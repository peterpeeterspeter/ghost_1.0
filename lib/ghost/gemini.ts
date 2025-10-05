import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
import { 
  AnalysisJSON, 
  AnalysisJSONSchema,
  AnalysisJSONSchemaObject,
  EnrichmentJSON,
  EnrichmentJSONSchema,
  EnrichmentJSONSchemaObject,
  GarmentAnalysisResult,
  GarmentEnrichmentResult,
  GhostMannequinResult,
  GeminiAnalysisRequest,
  GeminiRenderRequest,
  GhostPipelineError,
  ANALYSIS_PROMPT,
  ENRICHMENT_ANALYSIS_PROMPT,
  GHOST_MANNEQUIN_PROMPT
} from "@/types/ghost";
import type { ConsolidationOutput } from './consolidation';

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

export function configureGeminiClient(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Convert image URL or base64 to base64 data for Gemini with automatic resizing
 * @param imageInput - URL, base64 string, or Files API URI
 * @param maxDimension - Maximum width/height in pixels (default: 1024 for cost optimization)
 * @returns Promise<string> - resized base64 data or Files API URI
 */
async function prepareImageForGemini(imageInput: string, maxDimension: number = 1024): Promise<string> {
  // 🆕 Check if it's already a Files API URI - return as-is for optimal token usage
  if (imageInput.startsWith('https://generativelanguage.googleapis.com/v1beta/files/')) {
    console.log('✅ Using Files API URI - no resizing needed, optimal token usage!');
    console.log('🎆 Token savings: ~50,000 tokens (97% reduction)');
    return imageInput; // Return URI directly for Files API usage
  }
  
  let imageBuffer: Buffer;
  
  if (imageInput.startsWith('data:image/')) {
    // Extract base64 from data URL
    const base64 = imageInput.split(',')[1];
    imageBuffer = Buffer.from(base64, 'base64');
  } else if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    // Fetch image and convert to buffer
    try {
      const response = await fetch(imageInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (error) {
      throw new GhostPipelineError(
        `Failed to fetch image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'IMAGE_FETCH_FAILED',
        'analysis',
        error instanceof Error ? error : undefined
      );
    }
  } else {
    // Assume it's already base64
    imageBuffer = Buffer.from(imageInput, 'base64');
  }
  
  // Resize image using Sharp to reduce token costs (4MB → ~200KB = 95% cost reduction)
  try {
    const sharp = await import('sharp');
    const originalSize = imageBuffer.length;
    
    const resizedBuffer = await sharp.default(imageBuffer)
      .resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 }) // Good quality but compressed
      .toBuffer();
    
    const newSize = resizedBuffer.length;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`📏 Image resized: ${Math.round(originalSize/1024)}KB → ${Math.round(newSize/1024)}KB (-${reduction}% size reduction)`);
    
    return resizedBuffer.toString('base64');
  } catch (error) {
    console.warn('Image resizing failed, using original:', error);
    return imageBuffer.toString('base64');
  }
}

/**
 * Get MIME type from image data or URL
 * @param imageInput - Image URL, data URL, or base64
 * @returns string - MIME type
 */
function getImageMimeType(imageInput: string): string {
  if (imageInput.startsWith('data:image/')) {
    const mimeMatch = imageInput.match(/data:(image\/[^;]+)/);
    return mimeMatch ? mimeMatch[1] : 'image/jpeg';
  }
  
  if (imageInput.includes('.png')) return 'image/png';
  if (imageInput.includes('.webp')) return 'image/webp';
  
  // Default to JPEG
  return 'image/jpeg';
}

/**
 * Analyze garment using Gemini 2.5 Flash Lite Preview model with structured output
 * @param imageUrl - Clean garment image URL or base64
 * @param sessionId - Session ID for tracking
 * @returns Promise with structured analysis and processing time
 */
export async function analyzeGarment(imageUrl: string, sessionId: string): Promise<GarmentAnalysisResult> {
  const startTime = Date.now();

  if (!genAI) {
    throw new GhostPipelineError(
      'Gemini client not configured. Call configureGeminiClient first.',
      'CLIENT_NOT_CONFIGURED',
      'analysis'
    );
  }

  try {
    console.log('Starting garment analysis with Gemini 2.5 Flash-Lite Preview (09-2025)...');

    // Try structured output first, with fallback to unstructured if it fails
    let analysis: AnalysisJSON;
    let processingTime: number;

    try {
      const result = await analyzeWithStructuredOutput(imageUrl, sessionId);
      analysis = result.analysis;
      processingTime = result.processingTime;
    } catch (structuredError) {
      console.warn('Structured output failed, falling back to unstructured analysis:', structuredError);
      const result = await analyzeWithFallbackMode(imageUrl, sessionId);
      analysis = result.analysis;
      processingTime = result.processingTime;
    }

    console.log(`Garment analysis completed in ${processingTime}ms`);

    return {
      analysis,
      processingTime: Date.now() - startTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Garment analysis failed:', error);

    // Re-throw if already a GhostPipelineError
    if (error instanceof GhostPipelineError) {
      throw error;
    }

    // Handle Gemini-specific errors
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new GhostPipelineError(
          'Gemini API quota exceeded or rate limit hit',
          'GEMINI_QUOTA_EXCEEDED',
          'analysis',
          error
        );
      }

      if (error.message.includes('safety') || error.message.includes('blocked')) {
        throw new GhostPipelineError(
          'Content blocked by Gemini safety filters',
          'CONTENT_BLOCKED',
          'analysis',
          error
        );
      }
    }

    throw new GhostPipelineError(
      `Garment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ANALYSIS_FAILED',
      'analysis',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Perform enrichment analysis on garment using Gemini 2.5 Flash Lite Preview model with structured output (STEP 2)
 * This is the second analysis stage that focuses on rendering-critical attributes
 * @param imageUrl - Clean garment image URL or base64 (same as first analysis)
 * @param sessionId - Session ID for tracking
 * @param baseAnalysisSessionId - Session ID from the base analysis for reference
 * @returns Promise with structured enrichment analysis and processing time
 */
export async function analyzeGarmentEnrichment(
  imageUrl: string, 
  sessionId: string,
  baseAnalysisSessionId: string
): Promise<GarmentEnrichmentResult> {
  const startTime = Date.now();

  if (!genAI) {
    throw new GhostPipelineError(
      'Gemini client not configured. Call configureGeminiClient first.',
      'CLIENT_NOT_CONFIGURED',
      'analysis'
    );
  }

  try {
    console.log('Starting garment enrichment analysis with Gemini 2.5 Flash-Lite Preview (09-2025)...');

    // Try structured output first, with fallback to unstructured if it fails
    let enrichment: EnrichmentJSON;
    let processingTime: number;

    try {
      const result = await analyzeEnrichmentWithStructuredOutput(imageUrl, sessionId, baseAnalysisSessionId);
      enrichment = result.enrichment;
      processingTime = result.processingTime;
    } catch (structuredError) {
      console.warn('Enrichment structured output failed, falling back to unstructured analysis:', structuredError);
      const result = await analyzeEnrichmentWithFallbackMode(imageUrl, sessionId, baseAnalysisSessionId);
      enrichment = result.enrichment;
      processingTime = result.processingTime;
    }

    console.log(`Garment enrichment analysis completed in ${processingTime}ms`);

    return {
      enrichment,
      processingTime: Date.now() - startTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Garment enrichment analysis failed:', error);

    // Re-throw if already a GhostPipelineError
    if (error instanceof GhostPipelineError) {
      throw error;
    }

    // Handle Gemini-specific errors
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new GhostPipelineError(
          'Gemini API quota exceeded or rate limit hit',
          'GEMINI_QUOTA_EXCEEDED',
          'analysis',
          error
        );
      }

      if (error.message.includes('safety') || error.message.includes('blocked')) {
        throw new GhostPipelineError(
          'Content blocked by Gemini safety filters',
          'CONTENT_BLOCKED',
          'analysis',
          error
        );
      }
    }

    throw new GhostPipelineError(
      `Garment enrichment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ANALYSIS_FAILED',
      'analysis',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Try analysis with structured output (responseSchema) - WORKING VERSION FROM COMMIT
 */
async function analyzeWithStructuredOutput(imageUrl: string, sessionId: string): Promise<{ analysis: AnalysisJSON, processingTime: number }> {
  const startTime = Date.now();
  
  console.log('Attempting structured output analysis...');
  
  // Get the Gemini Flash Lite model with structured output
  const model = genAI!.getGenerativeModel({
    model: "gemini-2.5-flash-lite-preview-09-2025",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: AnalysisJSONSchemaObject.properties,
        required: AnalysisJSONSchemaObject.required
      } as any,
    },
  });

  // Prepare image data or Files API URI
  const imageReference = await prepareImageForGemini(imageUrl);
  const isFilesApiUri = imageReference.startsWith('https://generativelanguage.googleapis.com/v1beta/files/');
  
  // Create the prompt with session context and image
  const enhancedPrompt = `${ANALYSIS_PROMPT}

Session ID: ${sessionId}
Ensure the response includes this session ID in the meta.session_id field.

IMPORTANT: Return a valid JSON response that exactly matches the specified schema structure.`;
  
  let result;
  if (isFilesApiUri) {
    // Use Files API URI directly (optimal token usage)
    console.log('📎 Using Files API reference for analysis');
    result = await model.generateContent([
      {
        text: enhancedPrompt,
      },
      {
        fileData: {
          mimeType: 'image/jpeg', // Files API handles MIME type detection
          fileUri: imageReference
        },
      },
    ]);
  } else {
    // Use inline data (traditional approach with resizing)
    const mimeType = getImageMimeType(imageUrl);
    console.log('📊 Using inline image data (resized)');
    result = await model.generateContent([
      {
        text: enhancedPrompt,
      },
      {
        inlineData: {
          data: imageReference, // This is base64 data from resizing
          mimeType,
        },
      },
    ]);
  }

  const response = await result.response;
  const responseText = response.text();
  
  if (!responseText) {
    throw new Error('Empty response from Gemini 2.0 Flash-Lite structured analysis');
  }

  // Parse and validate the JSON response
  const parsedResponse = JSON.parse(responseText);
  const analysis = AnalysisJSONSchema.parse(parsedResponse);
  
  return {
    analysis,
    processingTime: Date.now() - startTime
  };
}

/**
 * Fallback analysis without structured output constraints
 */
async function analyzeWithFallbackMode(imageUrl: string, sessionId: string): Promise<{ analysis: AnalysisJSON, processingTime: number }> {
  const startTime = Date.now();
  
  console.log('Attempting fallback analysis without structured output...');
  
  // Get the Gemini Flash Lite model without structured output constraints
  const model = genAI!.getGenerativeModel({
    model: "gemini-2.5-flash-lite-preview-09-2025",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      // No responseSchema - let Gemini generate freely
    },
  });

  // Prepare image data
  const imageData = await prepareImageForGemini(imageUrl);
  const mimeType = getImageMimeType(imageUrl);

  // Simplified prompt for fallback
  const fallbackPrompt = `Analyze this garment image and return a JSON response with the following structure:

{
  "type": "garment_analysis",
  "meta": {
    "schema_version": "4.1",
    "session_id": "${sessionId}"
  },
  "labels_found": [],
  "preserve_details": [
    {
      "element": "description of detail",
      "priority": "critical|important|nice_to_have",
      "notes": "preservation notes"
    }
  ]
}

Analyze the garment for important details that need to be preserved during ghost mannequin processing. Focus on:
1. Any visible labels, tags, or text
2. Important construction details like seams, hems, collars
3. Texture and material characteristics

Return only valid JSON.`;
  
  const result = await model.generateContent([
    {
      text: fallbackPrompt,
    },
    {
      inlineData: {
        data: imageData,
        mimeType,
      },
    },
  ]);

  const response = await result.response;
  const responseText = response.text();
  
  if (!responseText) {
    throw new Error('Empty response from Gemini 2.0 Flash-Lite fallback analysis');
  }

  // Parse JSON and create a minimal valid analysis
  let parsedResponse: any;
  try {
    parsedResponse = JSON.parse(responseText);
  } catch (parseError) {
    // If JSON parsing fails, create a minimal fallback
    parsedResponse = createMinimalAnalysis(sessionId);
  }

  // Ensure the response has required fields
  const validatedResponse = ensureRequiredFields(parsedResponse, sessionId);
  
  // Validate against schema
  const analysis = AnalysisJSONSchema.parse(validatedResponse);
  
  return {
    analysis,
    processingTime: Date.now() - startTime
  };
}

/**
 * Create a minimal valid analysis when all else fails
 */
function createMinimalAnalysis(sessionId: string): any {
  return {
    type: "garment_analysis",
    meta: {
      schema_version: "4.1",
      session_id: sessionId
    },
    labels_found: [],
    preserve_details: [
      {
        element: "garment structure",
        priority: "important",
        notes: "Preserve overall garment shape and proportions"
      }
    ],
    palette: {
      pattern_hexes: [],
      dominant_hex: "#CCCCCC",
      region_hints: {}
    }
  };
}

/**
 * Ensure response has all required fields for schema validation
 */
function ensureRequiredFields(response: any, sessionId: string): any {
  return {
    type: response.type || "garment_analysis",
    meta: {
      schema_version: response.meta?.schema_version || "4.1",
      session_id: response.meta?.session_id || sessionId
    },
    labels_found: Array.isArray(response.labels_found) ? response.labels_found : [],
    preserve_details: Array.isArray(response.preserve_details) ? response.preserve_details : [
      {
        element: "garment structure",
        priority: "important",
        notes: "Preserve overall garment shape and proportions"
      }
    ],
    hollow_regions: response.hollow_regions,
    construction_details: response.construction_details,
    image_b_priority: response.image_b_priority,
    special_handling: response.special_handling,
    palette: response.palette || {
      pattern_hexes: [],
      dominant_hex: undefined,
      accent_hex: undefined,
      trim_hex: undefined,
      region_hints: {}
    }
  };
}

/**
 * Generate ghost mannequin image using Gemini Flash model with enhanced analysis integration
 * @param flatlayImage - Clean flatlay image (base64 or URL)
 * @param analysis - Structured garment analysis (base analysis)
 * @param originalImage - Optional on-model reference image
 * @param enrichment - Optional enrichment analysis for enhanced rendering
 * @returns Promise with rendered image URL and processing time
 */
export async function generateGhostMannequin(
  flatlayImage: string,
  analysis: AnalysisJSON,
  originalImage?: string,
  enrichment?: EnrichmentJSON
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  let baseAnalysisFilePath: string | null = null;
  let enrichmentAnalysisFilePath: string | null = null;
  let fs: any;

  if (!genAI) {
    throw new GhostPipelineError(
      'Gemini client not configured. Call configureGeminiClient first.',
      'CLIENT_NOT_CONFIGURED',
      'rendering'
    );
  }

  try {
    console.log('Starting ghost mannequin generation with Gemini Flash...');

    // Get Gemini 2.5 Flash Image Preview for image generation
    // This model specifically supports image generation capabilities
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.05, // Very low temperature for precise, consistent generation
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE, // Per docs: BLOCK_NONE is default for newer models
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
          threshold: HarmBlockThreshold.BLOCK_NONE, // Per docs: BLOCK_NONE is default for newer models
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE, // Per docs: BLOCK_NONE is default for newer models
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE, // Per docs: BLOCK_NONE is default for newer models
        },
        {
          category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
          threshold: HarmBlockThreshold.BLOCK_NONE, // Per docs: BLOCK_NONE is default for newer models
        },
      ],
    });

    // Prepare images
    const flatlayData = await prepareImageForGemini(flatlayImage);
    const flatlayMimeType = getImageMimeType(flatlayImage);
    
    // Create temporary JSON files for analysis data
    fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');
    
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    
    // Create base analysis JSON file
    const baseAnalysisFileName = `base_analysis_${timestamp}.json`;
    baseAnalysisFilePath = path.join(tempDir, baseAnalysisFileName);
    await fs.writeFile(baseAnalysisFilePath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`Created base analysis JSON file: ${baseAnalysisFilePath}`);
    
    // Read the base analysis JSON file
    const baseAnalysisJsonContent = await fs.readFile(baseAnalysisFilePath, 'utf-8');
    const baseAnalysisJsonBase64 = Buffer.from(baseAnalysisJsonContent, 'utf-8').toString('base64');
    
    // Create enrichment analysis JSON file if enrichment data is provided
    let enrichmentAnalysisJsonBase64: string | null = null;
    if (enrichment) {
      const enrichmentAnalysisFileName = `enrichment_analysis_${timestamp}.json`;
      enrichmentAnalysisFilePath = path.join(tempDir, enrichmentAnalysisFileName);
      await fs.writeFile(enrichmentAnalysisFilePath, JSON.stringify(enrichment, null, 2), 'utf-8');
      console.log(`Created enrichment analysis JSON file: ${enrichmentAnalysisFilePath}`);
      
      const enrichmentAnalysisJsonContent = await fs.readFile(enrichmentAnalysisFilePath, 'utf-8');
      enrichmentAnalysisJsonBase64 = Buffer.from(enrichmentAnalysisJsonContent, 'utf-8').toString('base64');
    }
    
    // Use the enhanced ghost mannequin prompt with multi-source data authority
    const imageGenPrompt = GHOST_MANNEQUIN_PROMPT;
    
    const contentParts: any[] = [
      {
        text: imageGenPrompt,
      },
      {
        text: "Base Analysis JSON (Structural analysis with label detection and construction details):",
      },
      {
        inlineData: {
          data: baseAnalysisJsonBase64,
          mimeType: 'application/json',
        },
      },
    ];
    
    // Add enrichment analysis JSON if provided
    if (enrichmentAnalysisJsonBase64) {
      contentParts.push({
        text: "Enrichment Analysis JSON (Color precision, fabric behavior, and rendering guidance):",
      });
      contentParts.push({
        inlineData: {
          data: enrichmentAnalysisJsonBase64,
          mimeType: 'application/json',
        },
      });
    }
    
    // Add Image B (Detail Source)
    contentParts.push({
      text: "Image B (Detail Source - Primary visual reference):",
    });
    contentParts.push({
      inlineData: {
        data: flatlayData,
        mimeType: flatlayMimeType,
      },
    });

    // Add original image if provided (Image A)
    if (originalImage) {
      const originalData = await prepareImageForGemini(originalImage);
      const originalMimeType = getImageMimeType(originalImage);
      
      // Insert Image A before Image B
      contentParts.splice(1, 0, {
        text: "Image A (Shape Reference - For proportions and spatial relationships):",
      });
      contentParts.splice(2, 0, {
        inlineData: {
          data: originalData,
          mimeType: originalMimeType,
        },
      });
    }

    // Generate the ghost mannequin image using Gemini 2.5 Flash
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    
    console.log('Gemini 2.5 Flash completed generation...');
    
    // Debug: Log the complete response with safety ratings
    console.log('\n=== DETAILED GEMINI FLASH RESPONSE DEBUG ===');
    console.log('Response object keys:', Object.keys(response));
    console.log('Full response structure:', JSON.stringify({
      candidates: response.candidates?.length || 0,
      promptFeedback: response.promptFeedback ? 'present' : 'missing',
      usageMetadata: response.usageMetadata ? 'present' : 'missing'
    }, null, 2));
    console.log('First 2000 chars of full response:', JSON.stringify(response, null, 2).substring(0, 2000));
    console.log('=== END RESPONSE DEBUG ===\n');
    
    // Check for prompt feedback and safety ratings
    if (response.promptFeedback) {
      console.log('Prompt feedback:', JSON.stringify(response.promptFeedback, null, 2));
      if (response.promptFeedback.blockReason) {
        console.error('Prompt blocked reason:', response.promptFeedback.blockReason);
      }
      if (response.promptFeedback.safetyRatings) {
        console.log('Safety ratings:', JSON.stringify(response.promptFeedback.safetyRatings, null, 2));
      }
    }
    
    // Check candidate safety ratings
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.safetyRatings) {
        console.log('Candidate safety ratings:', JSON.stringify(candidate.safetyRatings, null, 2));
      }
      if (candidate.finishReason === 'PROHIBITED_CONTENT') {
        console.log('Content was blocked due to safety filters');
      }
    }
    
    // Also try to get text response to see what Gemini actually returns
    try {
      const textResponse = response.text();
      console.log('Text response from Gemini:', textResponse.substring(0, 500));
    } catch (textError) {
      console.log('No text response available:', textError instanceof Error ? textError.message : 'Unknown error');
    }
    
    // Extract generated image from response
    let renderUrl: string;
    
    // Check if response contains generated images
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      console.log('Candidate content:', candidate.content ? 'present' : 'missing');
      if (candidate.content && candidate.content.parts) {
        console.log('Parts found:', candidate.content.parts.length);
        candidate.content.parts.forEach((part, index) => {
          console.log(`Part ${index}:`, {
            hasText: !!part.text,
            hasInlineData: !!part.inlineData,
            mimeType: part.inlineData?.mimeType
          });
        });
        // Look for inline data (generated images)
        const imagePart = candidate.content.parts.find(part => 
          part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')
        );
        
        if (imagePart && imagePart.inlineData) {
          console.log('Generated image found in response, uploading to FAL storage...');
          
          // Convert base64 image to data URL
          const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          
          // Upload to FAL storage for permanent URL using existing FAL integration
          const { uploadImageToFalStorage } = await import('./fal');
          renderUrl = await uploadImageToFalStorage(imageDataUrl);
          
          console.log('Generated ghost mannequin image uploaded successfully:', renderUrl);
        } else {
          console.warn('No generated image found in response, using fallback...');
          renderUrl = await generateFallbackGhostMannequin(flatlayImage, analysis);
        }
      } else {
        console.warn('No content found in response, using fallback...');
        renderUrl = await generateFallbackGhostMannequin(flatlayImage, analysis);
      }
    } else {
      console.warn('No candidates found in response, using fallback...');
      renderUrl = await generateFallbackGhostMannequin(flatlayImage, analysis);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`Ghost mannequin generation completed in ${processingTime}ms`);
    
    // Cleanup temporary JSON files
    if (baseAnalysisFilePath && fs) {
      try {
        await fs.unlink(baseAnalysisFilePath);
        console.log(`Cleaned up temporary base analysis file: ${baseAnalysisFilePath}`);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temporary file ${baseAnalysisFilePath}:`, cleanupError);
      }
    }
    
    if (enrichmentAnalysisFilePath && fs) {
      try {
        await fs.unlink(enrichmentAnalysisFilePath);
        console.log(`Cleaned up temporary enrichment analysis file: ${enrichmentAnalysisFilePath}`);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temporary file ${enrichmentAnalysisFilePath}:`, cleanupError);
      }
    }

    return {
      renderUrl,
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Ghost mannequin generation failed:', error);
    
    // Cleanup temporary JSON files on error
    if (baseAnalysisFilePath && fs) {
      try {
        await fs.unlink(baseAnalysisFilePath);
        console.log(`Cleaned up temporary base analysis file after error: ${baseAnalysisFilePath}`);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temporary file on error ${baseAnalysisFilePath}:`, cleanupError);
      }
    }
    
    if (enrichmentAnalysisFilePath && fs) {
      try {
        await fs.unlink(enrichmentAnalysisFilePath);
        console.log(`Cleaned up temporary enrichment analysis file after error: ${enrichmentAnalysisFilePath}`);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temporary file on error ${enrichmentAnalysisFilePath}:`, cleanupError);
      }
    }

    // Re-throw if already a GhostPipelineError
    if (error instanceof GhostPipelineError) {
      throw error;
    }

    // Handle Gemini-specific errors
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new GhostPipelineError(
          'Gemini API quota exceeded or rate limit hit',
          'GEMINI_QUOTA_EXCEEDED',
          'rendering',
          error
        );
      }

      if (error.message.includes('safety') || error.message.includes('blocked')) {
        throw new GhostPipelineError(
          'Content blocked by Gemini safety filters',
          'CONTENT_BLOCKED',
          'rendering',
          error
        );
      }
    }

    throw new GhostPipelineError(
      `Ghost mannequin generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Enhanced ghost mannequin generation with custom prompting based on analysis
 * @param flatlayImage - Clean flatlay image
 * @param analysis - Structured garment analysis
 * @param onModelImage - Optional on-model reference
 * @returns Promise with detailed rendering result
 */
export async function generateEnhancedGhostMannequin(
  flatlayImage: string,
  analysis: AnalysisJSON,
  onModelImage?: string
): Promise<GhostMannequinResult> {
  // Create a more detailed prompt based on the analysis
  const enhancedPrompt = createEnhancedPrompt(analysis);
  
  // This would use the enhanced prompt with the generation logic
  // For now, we'll call the base function
  return generateGhostMannequin(flatlayImage, analysis, onModelImage);
}

/**
 * Create an enhanced prompt based on garment analysis
 * @param analysis - Structured garment analysis
 * @returns string - Enhanced prompt for ghost mannequin generation
 */
function createEnhancedPrompt(analysis: AnalysisJSON): string {
  let prompt = GHOST_MANNEQUIN_PROMPT + "\n\n## ANALYSIS-SPECIFIC REQUIREMENTS:\n\n";
  
  // Add critical label preservation from JSON analysis
  if (analysis.labels_found && analysis.labels_found.length > 0) {
    const criticalLabels = analysis.labels_found.filter(label => label.preserve && label.readable);
    if (criticalLabels.length > 0) {
      prompt += "**CRITICAL LABEL PRESERVATION:**\n";
      criticalLabels.forEach(label => {
        if (label.bbox_norm && label.bbox_norm.length === 4) {
          prompt += `- Preserve "${label.text || label.type}" at coordinates [${label.bbox_norm.join(', ')}] with perfect legibility\n`;
        } else {
          prompt += `- Preserve ${label.type} label "${label.text || ''}" at ${label.location} with perfect legibility\n`;
        }
      });
      prompt += "\n";
    }
  }
  
  // Add critical detail preservation
  if (analysis.preserve_details && analysis.preserve_details.length > 0) {
    const criticalDetails = analysis.preserve_details.filter(detail => detail.priority === 'critical');
    if (criticalDetails.length > 0) {
      prompt += "**CRITICAL DETAIL PRESERVATION:**\n";
      criticalDetails.forEach(detail => {
        if (detail.region_bbox_norm && detail.region_bbox_norm.length === 4) {
          prompt += `- Preserve "${detail.element}" at coordinates [${detail.region_bbox_norm.join(', ')}] - ${detail.notes || ''}\n`;
        } else {
          prompt += `- Preserve "${detail.element}" at ${detail.location || 'specified location'} - ${detail.notes || ''}\n`;
        }
        if (detail.material_notes) {
          prompt += `  Material: ${detail.material_notes}\n`;
        }
      });
      prompt += "\n";
    }
  }
  
  // Add hollow region specific instructions
  if (analysis.hollow_regions && analysis.hollow_regions.length > 0) {
    prompt += "**HOLLOW REGION REQUIREMENTS:**\n";
    analysis.hollow_regions.forEach(region => {
      if (region.keep_hollow) {
        prompt += `- Keep ${region.region_type} hollow as specified\n`;
        if (region.inner_visible && region.inner_description) {
          prompt += `  Inner details: ${region.inner_description}\n`;
        }
        if (region.edge_sampling_notes) {
          prompt += `  Edge handling: ${region.edge_sampling_notes}\n`;
        }
      }
    });
    prompt += "\n";
  }
  
  // Add construction-specific requirements
  if (analysis.construction_details && analysis.construction_details.length > 0) {
    prompt += "**CONSTRUCTION REQUIREMENTS:**\n";
    analysis.construction_details.forEach(detail => {
      if (detail.critical_for_structure) {
        prompt += `- CRITICAL: ${detail.feature} - ${detail.silhouette_rule}\n`;
      } else {
        prompt += `- ${detail.feature} - ${detail.silhouette_rule}\n`;
      }
    });
    prompt += "\n";
  }
  
  // Add special handling instructions
  if (analysis.special_handling) {
    prompt += `**SPECIAL HANDLING:** ${analysis.special_handling}\n\n`;
  }
  
  // Add image priority settings
  if (analysis.image_b_priority) {
    prompt += "**IMAGE PROCESSING PRIORITY:**\n";
    if (analysis.image_b_priority.is_ground_truth) {
      prompt += "- Image B is ground truth for all visual details\n";
    }
    if (analysis.image_b_priority.edge_fidelity_required) {
      prompt += "- Maintain exact edge fidelity from source\n";
    }
    if (analysis.image_b_priority.color_authority) {
      prompt += "- Image B colors are authoritative - match exactly\n";
    }
    if (analysis.image_b_priority.print_direction_notes) {
      prompt += `- Print direction: ${analysis.image_b_priority.print_direction_notes}\n`;
    }
    prompt += "\n";
  }
  
  prompt += "Follow these analysis-derived requirements with absolute precision while maintaining the professional ghost mannequin photography standards specified above.";
  
  return prompt;
}

/**
 * Generate ghost mannequin image using FAL.AI Seedream 4.0 Edit model
 * @param flatlayImage - Clean flatlay image (base64 or URL) 
 * @param analysis - Structured garment analysis
 * @param originalImage - Optional on-model reference image
 * @param enrichment - Optional enrichment analysis
 * @returns Promise with rendered image URL and processing time
 */
/**
 * Generate ghost mannequin using Control Block with Seedream 4.0
 * @param flatlayImage - Clean flatlay image
 * @param controlBlockPrompt - Optimized prompt from consolidation
 * @param consolidation - Consolidation output with Facts_v3
 * @param originalImage - Optional on-model reference
 */
export async function generateGhostMannequinWithControlBlock(
  flatlayImage: string,
  controlBlockPrompt: string,
  consolidation: ConsolidationOutput,
  originalImage?: string
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  
  console.log('Starting ghost mannequin generation with Control Block + Seedream 4.0...');
  
  try {
    // Import FAL client
    const { fal } = await import('@fal-ai/client');
    
    // Prepare image URLs for Seedream
    const imageUrls: string[] = [];
    
    // Add the cleaned flatlay image (Detail Source - primary input)
    if (flatlayImage.startsWith('data:')) {
      // Upload base64 to FAL storage first
      const { uploadImageToFalStorage } = await import('./fal');
      const flatlayUrl = await uploadImageToFalStorage(flatlayImage);
      imageUrls.push(flatlayUrl);
      console.log('Uploaded flatlay image to FAL storage for Seedream');
    } else {
      imageUrls.push(flatlayImage);
    }
    
    // Add the on-model image if provided (Shape Reference - secondary input)
    if (originalImage) {
      if (originalImage.startsWith('data:')) {
        const { uploadImageToFalStorage } = await import('./fal');
        const originalUrl = await uploadImageToFalStorage(originalImage);
        imageUrls.push(originalUrl);
        console.log('Uploaded on-model image to FAL storage for Seedream');
      } else {
        imageUrls.push(originalImage);
      }
    }
    
    console.log(`Seedream input: ${imageUrls.length} image(s)`);
    console.log('Using Control Block Prompt:', controlBlockPrompt);
    
    console.log('Calling FAL.AI Seedream 4.0 Edit API with Control Block...');
    
    // Call Seedream 4.0 Edit API with the control block prompt
    const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
      input: {
        prompt: controlBlockPrompt,
        image_urls: imageUrls,
        num_images: 1,
        image_size: {
          width: 1024,
          height: 1024
        },
        sync_mode: true,
        enable_safety_checker: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log: any) => log.message).forEach(console.log);
        }
      }
    });
    
    console.log('Seedream 4.0 generation with Control Block completed');
    
    // Extract the generated image URL
    if (result.data.images && result.data.images.length > 0) {
      const generatedImageUrl = result.data.images[0].url;
      const processingTime = Date.now() - startTime;
      
      console.log(`Ghost mannequin generation with Control Block completed in ${processingTime}ms`);
      console.log('Generated image URL:', generatedImageUrl);
      
      return {
        renderUrl: generatedImageUrl,
        processingTime,
      };
    } else {
      console.warn('No images generated by Seedream, using fallback...');
      return {
        renderUrl: flatlayImage, // Return cleaned image as fallback
        processingTime: Date.now() - startTime
      };
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Control Block Seedream generation failed:', error);
    
    throw new GhostPipelineError(
      `Control Block Seedream generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Generate ghost mannequin using Control Block with Gemini Flash
 * @param flatlayImage - Clean flatlay image
 * @param controlBlockPrompt - Optimized prompt from consolidation
 * @param consolidation - Consolidation output with Facts_v3
 * @param originalImage - Optional on-model reference
 */
export async function generateGhostMannequinWithControlBlockGemini(
  flatlayImage: string,
  controlBlockPrompt: string,
  consolidation: ConsolidationOutput,
  originalImage?: string
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  
  console.log('🎯 Starting ghost mannequin generation with Freepik Gemini 2.5 Flash...');
  console.log(`📏 Using distilled Flash prompt: ${controlBlockPrompt.length} chars (target: ~1,750 chars for 350 words)`);
  console.log('🔍 Distilled prompt preview:', controlBlockPrompt.substring(0, 200) + '...');
  
  try {
    // Import Freepik service
    const { generateImageWithFreepikGemini } = await import('./freepik');
    
    // Generate image using Freepik's Gemini 2.5 Flash API
    // Pass original on-model image (not cleaned, since we disabled cleaning)
    console.log('🧪 DEBUG: Using cleaned flatlay + original on-model (uncleaned)');
    const result = await generateImageWithFreepikGemini(
      controlBlockPrompt,
      flatlayImage,     // Cleaned flatlay from FAL
      originalImage     // Original on-model (uncleaned)
    );
    
    return {
      renderUrl: result.imageBase64,
      processingTime: result.processingTime,
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Freepik Gemini generation failed:', error);
    
    if (error instanceof GhostPipelineError) {
      throw error;
    }
    
    throw new GhostPipelineError(
      `Freepik Gemini generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

export async function generateGhostMannequinWithSeedream(
  flatlayImage: string,
  analysis: AnalysisJSON,
  originalImage?: string,
  enrichment?: EnrichmentJSON
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  
  console.log('Starting ghost mannequin generation with FAL.AI Seedream 4.0...');
  
  try {
    // Import FAL client
    const { fal } = await import('@fal-ai/client');
    
    // Prepare image URLs for Seedream
    const imageUrls: string[] = [];
    
    // Add the cleaned flatlay image (Detail Source - primary input)
    if (flatlayImage.startsWith('data:')) {
      // Upload base64 to FAL storage first
      const { uploadImageToFalStorage } = await import('./fal');
      const flatlayUrl = await uploadImageToFalStorage(flatlayImage);
      imageUrls.push(flatlayUrl);
      console.log('Uploaded flatlay image to FAL storage for Seedream');
    } else {
      imageUrls.push(flatlayImage);
    }
    
    // Add the on-model image if provided (Shape Reference - secondary input)
    if (originalImage) {
      if (originalImage.startsWith('data:')) {
        const { uploadImageToFalStorage } = await import('./fal');
        const originalUrl = await uploadImageToFalStorage(originalImage);
        imageUrls.push(originalUrl);
        console.log('Uploaded on-model image to FAL storage for Seedream');
      } else {
        imageUrls.push(originalImage);
      }
    }
    
    console.log(`Seedream input: ${imageUrls.length} image(s)`);
    
    // Create simplified ghost mannequin prompt for Seedream
    let seedreamPrompt = 'Transform this flat garment into a professional 3D ghost mannequin effect showing how it would appear when worn by an invisible person. Create a dimensional product photo with natural fabric draping, realistic volume, and commercial photography quality.';
    
    // Add critical details from analysis
    if (analysis.preserve_details && analysis.preserve_details.length > 0) {
      const criticalDetails = analysis.preserve_details.filter(detail => detail.priority === 'critical');
      if (criticalDetails.length > 0) {
        seedreamPrompt += ` Maintain critical details: ${criticalDetails.map(d => d.element).join(', ')}.`;
      }
    }
    
    seedreamPrompt += ' Professional e-commerce product photography style with white background, studio lighting, and high detail.';
    
    console.log('Calling FAL.AI Seedream 4.0 Edit API...');
    
    // Call Seedream 4.0 Edit API
    const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
      input: {
        prompt: seedreamPrompt,
        image_urls: imageUrls,
        num_images: 1,
        image_size: {
          width: 1024,
          height: 1024
        },
        sync_mode: true, // Wait for image to be generated
        enable_safety_checker: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log: any) => log.message).forEach(console.log);
        }
      }
    });
    
    console.log('Seedream 4.0 generation completed');
    
    // Extract the generated image URL
    if (result.data.images && result.data.images.length > 0) {
      const generatedImageUrl = result.data.images[0].url;
      const processingTime = Date.now() - startTime;
      
      console.log(`Ghost mannequin generation completed with Seedream in ${processingTime}ms`);
      console.log('Generated image URL:', generatedImageUrl);
      
      return {
        renderUrl: generatedImageUrl,
        processingTime,
      };
    } else {
      console.warn('No images generated by Seedream, using fallback...');
      return {
        renderUrl: flatlayImage, // Return cleaned image as fallback
        processingTime: Date.now() - startTime
      };
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Seedream ghost mannequin generation failed:', error);
    
    // Handle Seedream-specific errors
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new GhostPipelineError(
          'FAL.AI API quota exceeded or rate limit hit',
          'FAL_QUOTA_EXCEEDED',
          'rendering',
          error
        );
      }
      
      if (error.message.includes('safety') || error.message.includes('blocked')) {
        throw new GhostPipelineError(
          'Content blocked by FAL.AI safety filters',
          'CONTENT_BLOCKED',
          'rendering',
          error
        );
      }
    }
    
    throw new GhostPipelineError(
      `Seedream ghost mannequin generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Fallback ghost mannequin generation when Gemini image generation fails
 */
async function generateFallbackGhostMannequin(flatlayImage: string, analysis: AnalysisJSON): Promise<string> {
  console.log('\n=== USING FALLBACK GHOST MANNEQUIN GENERATION ===');
  console.log('This indicates Gemini Flash did not generate an image.');
  console.log('Reasons could be:');
  console.log('1. Content safety filters blocked the prompt');
  console.log('2. Model did not return image data in expected format');
  console.log('3. API error or timeout during image generation');
  console.log('4. Model does not support image generation for this prompt');
  
  // Try a much simpler ghost mannequin generation with Gemini Flash
  console.log('Attempting simple fallback generation...');
  
  try {
    const model = genAI!.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.1,
      },
    });
    
    const imageData = await prepareImageForGemini(flatlayImage);
    const mimeType = getImageMimeType(flatlayImage);
    
    const simplePrompt = "Transform this flat garment image into a 3D ghost mannequin effect showing how it would look when worn by an invisible person. Create a professional product photo with proper dimensional form and natural fabric draping.";
    
    const result = await model.generateContent([
      { text: simplePrompt },
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      },
    ]);
    
    const response = await result.response;
    const candidates = response.candidates;
    
    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      if (candidate.content && candidate.content.parts) {
        const imagePart = candidate.content.parts.find(part => 
          part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')
        );
        
        if (imagePart && imagePart.inlineData) {
          console.log('Simple fallback generation successful! Uploading to FAL storage...');
          const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          const { uploadImageToFalStorage } = await import('./fal');
          return await uploadImageToFalStorage(imageDataUrl);
        }
      }
    }
    
    console.log('Simple fallback also failed - no image generated');
  } catch (fallbackError) {
    console.error('Fallback generation failed:', fallbackError);
  }
  
  console.log('Returning original cleaned image as final fallback');
  console.log('=== END FALLBACK GENERATION ===\n');
  
  // As a last resort, return the cleaned background-removed image
  return flatlayImage;
}

/**
 * Test Gemini Flash image generation with a simple prompt
 */
export async function testGeminiFlashImageGeneration(): Promise<boolean> {
  if (!genAI) {
    return false;
  }

  try {
    console.log('Testing Gemini Flash image generation...');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      generationConfig: { temperature: 0.5 }
    });
    
    const result = await model.generateContent([
      { text: "Generate a simple red circle on a white background." }
    ]);
    
    const response = await result.response;
    console.log('Test response candidates:', response.candidates?.length || 0);
    
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        const hasImage = candidate.content.parts.some(part => 
          part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')
        );
        console.log('Test image generation result:', hasImage ? 'SUCCESS' : 'NO_IMAGE');
        return hasImage;
      }
    }
    
    console.log('Test image generation result: NO_CANDIDATES');
    return false;
  } catch (error) {
    console.error('Test image generation failed:', error);
    return false;
  }
}

/**
 * Validate Gemini API configuration
 * @returns Promise<boolean> - true if API is accessible
 */
export async function validateGeminiApi(): Promise<boolean> {
  if (!genAI) {
    return false;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });
    const result = await model.generateContent("Hello");
    return !!result.response;
  } catch {
    return false;
  }
}

/**
 * Try enrichment analysis with structured output (responseSchema) - STEP 2
 */
async function analyzeEnrichmentWithStructuredOutput(
  imageUrl: string, 
  sessionId: string,
  baseAnalysisSessionId: string
): Promise<{ enrichment: EnrichmentJSON, processingTime: number }> {
  const startTime = Date.now();
  
  console.log('Attempting enrichment structured output analysis...');
  
  // Get the Gemini Flash Lite model with structured output
  const model = genAI!.getGenerativeModel({
    model: "gemini-2.5-flash-lite-preview-09-2025",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: EnrichmentJSONSchemaObject.properties,
        required: EnrichmentJSONSchemaObject.required
      } as any,
    },
  });

  // Prepare image data or Files API URI
  const imageReference = await prepareImageForGemini(imageUrl);
  const isFilesApiUri = imageReference.startsWith('https://generativelanguage.googleapis.com/v1beta/files/');

  // Create the prompt with session context and base analysis reference
  const enhancedPrompt = `${ENRICHMENT_ANALYSIS_PROMPT}

Session ID: ${sessionId}
Base Analysis Reference: ${baseAnalysisSessionId}
Ensure the response includes this session ID in the meta.session_id field and the base analysis reference in meta.base_analysis_ref.

IMPORTANT: Return a valid JSON response that exactly matches the garment_enrichment_focused schema structure.`;
  
  let result;
  if (isFilesApiUri) {
    // Use Files API URI directly (optimal token usage)
    console.log('📎 Using Files API reference for enrichment analysis');
    result = await model.generateContent([
      {
        text: enhancedPrompt,
      },
      {
        fileData: {
          mimeType: 'image/jpeg', // Files API handles MIME type detection
          fileUri: imageReference
        },
      },
    ]);
  } else {
    // Use inline data (traditional approach with resizing)
    const mimeType = getImageMimeType(imageUrl);
    console.log('📊 Using inline image data for enrichment (resized)');
    result = await model.generateContent([
      {
        text: enhancedPrompt,
      },
      {
        inlineData: {
          data: imageReference, // This is base64 data from resizing
          mimeType,
        },
      },
    ]);
  }

  const response = await result.response;
  const responseText = response.text();
  
  if (!responseText) {
    throw new Error('Empty response from Gemini 2.0 Flash-Lite enrichment structured analysis');
  }

  // Parse and validate the JSON response
  const parsedResponse = JSON.parse(responseText);
  const enrichment = EnrichmentJSONSchema.parse(parsedResponse);
  
  return {
    enrichment,
    processingTime: Date.now() - startTime
  };
}

/**
 * Fallback enrichment analysis without structured output constraints
 */
async function analyzeEnrichmentWithFallbackMode(
  imageUrl: string, 
  sessionId: string,
  baseAnalysisSessionId: string
): Promise<{ enrichment: EnrichmentJSON, processingTime: number }> {
  const startTime = Date.now();
  
  console.log('Attempting enrichment fallback analysis without structured output...');
  
  // Get the Gemini Flash Lite model without structured output constraints
  const model = genAI!.getGenerativeModel({
    model: "gemini-2.5-flash-lite-preview-09-2025",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      // No responseSchema - let Gemini generate freely
    },
  });

  // Prepare image data
  const imageData = await prepareImageForGemini(imageUrl);
  const mimeType = getImageMimeType(imageUrl);

  // Simplified prompt for fallback
  const fallbackPrompt = `Analyze this garment image and return enrichment analysis JSON with the exact structure below.

{
  "type": "garment_enrichment_focused",
  "meta": {
    "schema_version": "4.3",
    "session_id": "${sessionId}",
    "base_analysis_ref": "${baseAnalysisSessionId}"
  },
  "color_precision": {
    "primary_hex": "#000000",
    "color_temperature": "neutral",
    "saturation_level": "moderate"
  },
  "fabric_behavior": {
    "drape_quality": "structured",
    "surface_sheen": "matte",
    "transparency_level": "opaque"
  },
  "construction_precision": {
    "seam_visibility": "visible",
    "edge_finishing": "serged",
    "stitching_contrast": false
  },
  "rendering_guidance": {
    "lighting_preference": "soft_diffused",
    "shadow_behavior": "soft_shadows",
    "color_fidelity_priority": "high"
  },
  "confidence_breakdown": {
    "color_confidence": 0.8,
    "fabric_confidence": 0.7,
    "overall_confidence": 0.75
  }
}

Analyze the garment for:
1. Precise color information with hex codes
2. Fabric behavior and surface properties  
3. Construction details affecting appearance
4. Rendering guidance for optimal results
5. Confidence scores for each analysis area

Return only valid JSON with proper structure.`;
  
  const result = await model.generateContent([
    {
      text: fallbackPrompt,
    },
    {
      inlineData: {
        data: imageData,
        mimeType,
      },
    },
  ]);

  const response = await result.response;
  const responseText = response.text();
  
  if (!responseText) {
    throw new Error('Empty response from Gemini 2.0 Flash-Lite enrichment fallback analysis');
  }

  // Parse JSON and create a minimal valid enrichment analysis
  let parsedResponse: any;
  try {
    parsedResponse = JSON.parse(responseText);
  } catch (parseError) {
    // If JSON parsing fails, create a minimal fallback
    parsedResponse = createMinimalEnrichmentAnalysis(sessionId, baseAnalysisSessionId);
  }

  // Ensure the response has required fields
  const validatedResponse = ensureRequiredEnrichmentFields(parsedResponse, sessionId, baseAnalysisSessionId);
  
  // Validate against schema
  const enrichment = EnrichmentJSONSchema.parse(validatedResponse);
  
  return {
    enrichment,
    processingTime: Date.now() - startTime
  };
}

/**
 * Create a minimal valid enrichment analysis when all else fails
 */
function createMinimalEnrichmentAnalysis(sessionId: string, baseAnalysisSessionId: string): any {
  return {
    type: "garment_enrichment_focused",
    meta: {
      schema_version: "4.3",
      session_id: sessionId,
      base_analysis_ref: baseAnalysisSessionId
    },
    color_precision: {
      primary_hex: "#808080",
      color_temperature: "neutral",
      saturation_level: "moderate"
    },
    fabric_behavior: {
      drape_quality: "structured",
      surface_sheen: "matte",
      transparency_level: "opaque"
    },
    construction_precision: {
      seam_visibility: "visible",
      edge_finishing: "serged",
      stitching_contrast: false
    },
    rendering_guidance: {
      lighting_preference: "soft_diffused",
      shadow_behavior: "soft_shadows",
      color_fidelity_priority: "high"
    },
    confidence_breakdown: {
      color_confidence: 0.5,
      fabric_confidence: 0.5,
      overall_confidence: 0.5
    }
  };
}

/**
 * Ensure enrichment response has all required fields for schema validation
 */
function ensureRequiredEnrichmentFields(response: any, sessionId: string, baseAnalysisSessionId: string): any {
  return {
    type: response.type || "garment_enrichment_focused",
    meta: {
      schema_version: response.meta?.schema_version || "4.3",
      session_id: response.meta?.session_id || sessionId,
      base_analysis_ref: response.meta?.base_analysis_ref || baseAnalysisSessionId
    },
    color_precision: {
      primary_hex: response.color_precision?.primary_hex || "#808080",
      secondary_hex: response.color_precision?.secondary_hex,
      color_temperature: response.color_precision?.color_temperature || "neutral",
      saturation_level: response.color_precision?.saturation_level || "moderate",
      pattern_direction: response.color_precision?.pattern_direction,
      pattern_repeat_size: response.color_precision?.pattern_repeat_size
    },
    fabric_behavior: {
      drape_quality: response.fabric_behavior?.drape_quality || "structured",
      surface_sheen: response.fabric_behavior?.surface_sheen || "matte",
      texture_depth: response.fabric_behavior?.texture_depth,
      wrinkle_tendency: response.fabric_behavior?.wrinkle_tendency,
      transparency_level: response.fabric_behavior?.transparency_level || "opaque"
    },
    construction_precision: {
      seam_visibility: response.construction_precision?.seam_visibility || "visible",
      edge_finishing: response.construction_precision?.edge_finishing || "serged",
      stitching_contrast: typeof response.construction_precision?.stitching_contrast === 'boolean' ? response.construction_precision.stitching_contrast : false,
      hardware_finish: response.construction_precision?.hardware_finish,
      closure_visibility: response.construction_precision?.closure_visibility
    },
    rendering_guidance: {
      lighting_preference: response.rendering_guidance?.lighting_preference || "soft_diffused",
      shadow_behavior: response.rendering_guidance?.shadow_behavior || "soft_shadows",
      texture_emphasis: response.rendering_guidance?.texture_emphasis,
      color_fidelity_priority: response.rendering_guidance?.color_fidelity_priority || "high",
      detail_sharpness: response.rendering_guidance?.detail_sharpness
    },
    market_intelligence: response.market_intelligence,
    confidence_breakdown: {
      color_confidence: typeof response.confidence_breakdown?.color_confidence === 'number' ? response.confidence_breakdown.color_confidence : 0.5,
      fabric_confidence: typeof response.confidence_breakdown?.fabric_confidence === 'number' ? response.confidence_breakdown.fabric_confidence : 0.5,
      construction_confidence: typeof response.confidence_breakdown?.construction_confidence === 'number' ? response.confidence_breakdown.construction_confidence : undefined,
      overall_confidence: typeof response.confidence_breakdown?.overall_confidence === 'number' ? response.confidence_breakdown.overall_confidence : 0.5
    }
  };
}
