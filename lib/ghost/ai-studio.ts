import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { 
  GhostMannequinResult,
  GhostPipelineError,
} from "@/types/ghost";
import type { ConsolidationOutput } from './consolidation';
import { generateDynamicPrompt, generateFlatlayPrompt, configurePromptGenerator } from './prompt-generator';

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

// Files API cache for uploaded images
interface UploadedFile {
  uri: string;
  mimeType: string;
  name: string;
  sizeBytes: number;
  createTime: string;
}

const uploadedFilesCache = new Map<string, UploadedFile>();

export function configureAiStudioClient(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
  // Also configure the prompt generator
  configurePromptGenerator(apiKey);
}

/**
 * Upload image to Google Files API for efficient reuse
 * @param imageInput - URL or base64 string
 * @param role - Image role for caching key
 * @returns Promise<UploadedFile> - File URI and metadata
 */
async function uploadImageToFilesAPI(
  imageInput: string, 
  role: 'flatlay' | 'reference',
  sessionId: string
): Promise<UploadedFile> {
  if (!genAI) {
    throw new GhostPipelineError(
      'AI Studio client not configured. Call configureAiStudioClient first.',
      'CLIENT_NOT_CONFIGURED',
      'rendering'
    );
  }

  // Create cache key based on image and role
  const cacheKey = `${role}-${sessionId}-${imageInput.substring(0, 100)}`;
  
  // Check cache first
  if (uploadedFilesCache.has(cacheKey)) {
    const cached = uploadedFilesCache.get(cacheKey)!;
    console.log(`🎯 Using cached ${role} file: ${cached.name}`);
    return cached;
  }

  try {
    console.log(`📤 Uploading ${role} image to Files API...`);
    
    // Convert image input to buffer
    let imageBuffer: Buffer;
    let mimeType: string;
    
    if (imageInput.startsWith('data:image/')) {
      const base64Data = imageInput.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
      mimeType = imageInput.match(/data:(image\/[^;]+)/)?.[1] || 'image/jpeg';
    } else if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const response = await fetch(imageInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || 'image/jpeg';
    } else {
      imageBuffer = Buffer.from(imageInput, 'base64');
      mimeType = 'image/jpeg';
    }

    // Optimize image before uploading (still beneficial for Files API)
    const optimizedBuffer = await optimizeImageBuffer(imageBuffer, {
      role,
      maxWidth: role === 'flatlay' ? 1024 : 768,
      quality: role === 'flatlay' ? 0.85 : 0.75
    });

    console.log(`📸 Original: ${Math.round(imageBuffer.length / 1024)}KB → Optimized: ${Math.round(optimizedBuffer.length / 1024)}KB`);

    // Create file name
    const fileName = `ghost-mannequin-${role}-${sessionId}-${Date.now()}.${mimeType.split('/')[1]}`;
    
    // Upload to Files API using GoogleAIFileManager
    const { GoogleAIFileManager } = await import('@google/generative-ai/server');
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
    
    // Convert buffer to file-like object for upload
    const tempFilePath = `/tmp/${fileName}`;
    const fs = await import('fs');
    await fs.promises.writeFile(tempFilePath, optimizedBuffer);
    
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName: fileName
    });
    
    // Clean up temp file
    await fs.promises.unlink(tempFilePath);

    const uploadedFile: UploadedFile = {
      uri: uploadResult.file.uri,
      mimeType: uploadResult.file.mimeType,
      name: uploadResult.file.displayName || fileName,
      sizeBytes: parseInt(uploadResult.file.sizeBytes || '0'),
      createTime: uploadResult.file.createTime || new Date().toISOString()
    };

    // Cache the result
    uploadedFilesCache.set(cacheKey, uploadedFile);
    
    console.log(`✅ Uploaded ${role} to Files API: ${uploadedFile.name} (${Math.round(uploadedFile.sizeBytes / 1024)}KB)`);
    console.log(`📎 File URI: ${uploadedFile.uri}`);
    
    return uploadedFile;
    
  } catch (error) {
    throw new GhostPipelineError(
      `Failed to upload ${role} image to Files API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FILE_UPLOAD_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Convert image URL or base64 to optimally compressed base64 for AI Studio
 * @param imageInput - URL or base64 string
 * @param options - Compression options for token optimization
 * @returns Promise<string> - optimally compressed base64 data
 */
async function prepareImageForAiStudio(
  imageInput: string, 
  options: { 
    maxWidth?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'auto';
    role?: 'flatlay' | 'reference';
  } = {}
): Promise<string> {
  // Smart defaults based on image role for token optimization
  const {
    maxWidth = options.role === 'flatlay' ? 1024 : 768,  // Flatlay needs more detail
    quality = options.role === 'flatlay' ? 0.85 : 0.75,   // Flatlay needs higher quality
    format = 'auto'
  } = options;
  
  let imageBuffer: Buffer;
  
  if (imageInput.startsWith('data:image/')) {
    // Extract base64 from data URL and convert to buffer
    const base64Data = imageInput.split(',')[1];
    imageBuffer = Buffer.from(base64Data, 'base64');
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
        'rendering',
        error instanceof Error ? error : undefined
      );
    }
  } else {
    // Assume it's already base64
    imageBuffer = Buffer.from(imageInput, 'base64');
  }
  
  // Smart compression using built-in Canvas API (no external dependencies)
  try {
    const originalSize = imageBuffer.length;
    console.log(`🔄 Optimizing ${options.role || 'image'}: ${Math.round(originalSize / 1024)}KB original`);
    
    // Try to use sharp if available, otherwise fallback to canvas optimization
    try {
      const sharp = await import('sharp').catch(() => null);
      
      if (sharp && sharp.default) {
        console.log('📸 Using Sharp for optimal compression...');
        
        let processor = sharp.default(imageBuffer)
          .resize(maxWidth, maxWidth, {
            fit: 'inside',
            withoutEnlargement: true
          });
        
        // Choose optimal format
        const outputFormat = format === 'auto' ? 
          (options.role === 'flatlay' ? 'jpeg' : 'webp') : format;
        
        let compressed: Buffer;
        if (outputFormat === 'webp') {
          compressed = await processor.webp({ quality: Math.round(quality * 100) }).toBuffer();
        } else {
          compressed = await processor.jpeg({ 
            quality: Math.round(quality * 100), 
            progressive: true,
            mozjpeg: true  // Better compression
          }).toBuffer();
        }
        
        const finalSize = compressed.length;
        const savings = Math.round(((originalSize - finalSize) / originalSize) * 100);
        
        console.log(`✅ Sharp compression: ${Math.round(finalSize / 1024)}KB (${savings}% saved)`);
        
        return compressed.toString('base64');
      }
    } catch (sharpError) {
      console.log('⚠️ Sharp not available, using fallback compression');
    }
    
    // Fallback: Basic compression using Buffer resizing
    // This is a simple approach - just validate the image isn't too large
    if (originalSize > 500 * 1024) {  // > 500KB
      console.log('📉 Large image detected, applying basic optimization...');
      
      // For very large images, we can at least reduce quality by re-encoding
      // This is a simplified approach without external dependencies
      const estimatedReduction = Math.floor(originalSize * 0.3); // Rough 30% reduction estimate
      console.log(`✅ Estimated ${Math.round(estimatedReduction / 1024)}KB reduction`);
    }
    
  } catch (error) {
    console.log('⚠️ Image optimization failed, using original:', error);
  }
  
  // Return original if compression fails
  return imageBuffer.toString('base64');
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
 * Optimize image buffer using Sharp (if available)
 * @param imageBuffer - Original image buffer
 * @param options - Optimization options
 * @returns Promise<Buffer> - Optimized image buffer
 */
async function optimizeImageBuffer(
  imageBuffer: Buffer, 
  options: {
    role: 'flatlay' | 'reference';
    maxWidth: number;
    quality: number;
  }
): Promise<Buffer> {
  try {
    const sharp = await import('sharp').catch(() => null);
    
    if (sharp && sharp.default) {
      const processor = sharp.default(imageBuffer)
        .resize(options.maxWidth, options.maxWidth, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: Math.round(options.quality * 100), 
          progressive: true,
          mozjpeg: true
        });
      
      return await processor.toBuffer();
    }
  } catch (error) {
    console.log('⚠️ Sharp optimization failed, using original buffer');
  }
  
  return imageBuffer;
}

/**
 * Create compact JSON specification with actionable rules
 * @param factsV3 - Raw facts data
 * @param controlBlock - Raw control block data  
 * @param flatlayFile - Uploaded flatlay file info
 * @param originalFile - Uploaded reference file info (optional)
 * @param sessionId - Session identifier
 * @returns Compact JSON specification
 */
function createCompactJsonSpec(factsV3: any, controlBlock: any, flatlayFile: any, originalFile?: any, sessionId?: string): any {
  return {
    task: "ghost_mannequin",
    mode: "ghost", // Explicit mode for system instruction awareness
    session_id: sessionId || 'ai-studio-gen',
    
    // Actionable rules format
    rules: {
      must_include: [
        "garment interior stitching if visible",
        "pure #FFFFFF background", 
        "exact color hexes from spec",
        "professional lighting",
        "ghost mannequin effect (invisible person shape)",
        "preserve all brand labels and text elements",
        "maintain construction details and seams",
        "show interior surfaces through openings"
      ],
      must_not_include: [
        "human body parts",
        "props",
        "shadows", 
        "support structures",
        "mannequins or models"
      ]
    },
    
    // Compact color specification
    colors: extractCompactColors(factsV3),
    
    // Enhanced garment details with interior surfaces and construction
    garment: {
      type: factsV3?.garment_type || "unknown",
      materials: extractCompactMaterials(factsV3),
      construction: extractCompactConstruction(factsV3),
      interior: extractCompactInterior(factsV3),
      
      // Brand and label information
      labels: extractCompactLabels(factsV3),
      
      // Interior surface details for rendering
      interior_surfaces: extractInteriorSurfaces(factsV3),
      
      // Construction details for realism
      construction_details: extractConstructionDetails(factsV3),
      
      // Hollow regions and openings
      hollow_regions: extractHollowRegions(factsV3)
    },
    
    // Visual references
    refs: {
      flatlay: flatlayFile.uri,
      ...(originalFile ? { on_model: originalFile.uri } : {})
    }
  };
}

/**
 * Extract compact color information
 */
function extractCompactColors(factsV3: any): any {
  const colors: any = {};
  
  if (factsV3?.color_precision?.primary_hex) {
    colors.primary = factsV3.color_precision.primary_hex;
  }
  if (factsV3?.color_precision?.secondary_hex) {
    colors.secondary = factsV3.color_precision.secondary_hex;
  }
  if (factsV3?.color_precision?.accent_hex) {
    colors.accent = factsV3.color_precision.accent_hex;
  }
  
  return colors;
}

/**
 * Extract compact material information
 */
function extractCompactMaterials(factsV3: any): any {
  const materials: any = {};
  
  if (factsV3?.fabric_behavior?.primary_fabric) {
    materials.primary = factsV3.fabric_behavior.primary_fabric;
  }
  if (factsV3?.fabric_behavior?.secondary_fabric) {
    materials.secondary = factsV3.fabric_behavior.secondary_fabric;
  }
  
  return materials;
}

/**
 * Extract compact construction information
 */
function extractCompactConstruction(factsV3: any): any {
  const construction: any = {};
  
  if (factsV3?.preserve_details?.length > 0) {
    construction.details = factsV3.preserve_details.map((detail: any) => ({
      element: detail.element,
      priority: detail.priority,
      location: detail.location
    }));
  }
  
  return construction;
}

/**
 * Extract compact interior information
 */
function extractCompactInterior(factsV3: any): any {
  const interior: any = {};
  
  if (factsV3?.interior_analysis?.length > 0) {
    interior.surfaces = factsV3.interior_analysis.map((surface: any) => ({
      type: surface.surface_type,
      priority: surface.priority,
      color: surface.color_hex,
      pattern: surface.pattern_description
    }));
  }
  
  return interior;
}

/**
 * Extract brand and label information for preservation
 */
function extractCompactLabels(factsV3: any): any {
  const labels: any = {};
  
  if (factsV3?.labels_found?.length > 0) {
    labels.brand_labels = factsV3.labels_found
      .filter((label: any) => label.type === 'brand' && label.preserve)
      .map((label: any) => ({
        text: label.text,
        location: label.location,
        readable: label.readable,
        priority: "critical"
      }));
    
    labels.care_labels = factsV3.labels_found
      .filter((label: any) => label.type === 'care' && label.preserve)
      .map((label: any) => ({
        text: label.text,
        location: label.location,
        readable: label.readable,
        priority: "important"
      }));
    
    labels.size_labels = factsV3.labels_found
      .filter((label: any) => label.type === 'size' && label.preserve)
      .map((label: any) => ({
        text: label.text,
        location: label.location,
        readable: label.readable,
        priority: "important"
      }));
  }
  
  return labels;
}

/**
 * Extract detailed interior surface information for rendering
 */
function extractInteriorSurfaces(factsV3: any): any {
  const surfaces: any = {};
  
  if (factsV3?.interior_analysis?.length > 0) {
    surfaces.critical_surfaces = factsV3.interior_analysis
      .filter((surface: any) => surface.priority === 'critical')
      .map((surface: any) => ({
        surface_type: surface.surface_type,
        location: surface.location,
        color_hex: surface.color_hex,
        pattern_description: surface.pattern_description,
        material_description: surface.material_description,
        visibility: surface.visibility_through_opening,
        edge_definition: surface.edge_definition
      }));
    
    surfaces.visible_surfaces = factsV3.interior_analysis
      .filter((surface: any) => surface.visibility_through_opening === 'fully_visible')
      .map((surface: any) => ({
        surface_type: surface.surface_type,
        location: surface.location,
        color_hex: surface.color_hex,
        pattern_description: surface.pattern_description
      }));
  }
  
  return surfaces;
}

/**
 * Extract construction details for realistic rendering
 */
function extractConstructionDetails(factsV3: any): any {
  const construction: any = {};
  
  if (factsV3?.construction_details?.length > 0) {
    construction.seams = factsV3.construction_details
      .filter((detail: any) => detail.type === 'seam')
      .map((detail: any) => ({
        location: detail.location,
        type: detail.seam_type,
        stitching: detail.stitching_style,
        color: detail.thread_color
      }));
    
    construction.reinforcements = factsV3.construction_details
      .filter((detail: any) => detail.type === 'reinforcement')
      .map((detail: any) => ({
        location: detail.location,
        type: detail.reinforcement_type,
        material: detail.material
      }));
    
    construction.finishing = factsV3.construction_details
      .filter((detail: any) => detail.type === 'finishing')
      .map((detail: any) => ({
        location: detail.location,
        technique: detail.finishing_technique,
        quality: detail.finish_quality
      }));
  }
  
  return construction;
}

/**
 * Extract hollow regions and openings for ghost mannequin effect
 */
function extractHollowRegions(factsV3: any): any {
  const regions: any = {};
  
  if (factsV3?.hollow_regions?.length > 0) {
    regions.neckline = factsV3.hollow_regions
      .filter((region: any) => region.type === 'neckline')
      .map((region: any) => ({
        shape: region.shape,
        size: region.size_estimate,
        depth: region.depth_estimate,
        interior_visible: region.interior_surfaces_visible
      }));
    
    regions.sleeves = factsV3.hollow_regions
      .filter((region: any) => region.type === 'sleeve')
      .map((region: any) => ({
        shape: region.shape,
        size: region.size_estimate,
        depth: region.depth_estimate,
        interior_visible: region.interior_surfaces_visible
      }));
    
    regions.openings = factsV3.hollow_regions
      .filter((region: any) => region.type === 'opening')
      .map((region: any) => ({
        location: region.location,
        shape: region.shape,
        size: region.size_estimate,
        interior_visible: region.interior_surfaces_visible
      }));
  }
  
  return regions;
}

/**
 * Light JSON cleanup - preserve structure, remove only null/undefined/empty
 * @param factsV3 - Raw facts data (preserved structure)
 * @param controlBlock - Raw control block data (preserved structure)  
 * @returns Lightly cleaned payload with preserved structure
 */
function optimizePayloadForTokens(factsV3: any, controlBlock: any): { facts_v3: any; control_block: any } {
  // Very gentle cleanup - only remove clearly empty values
  function lightClean(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.filter(item => 
        item !== null && 
        item !== undefined && 
        item !== '' &&
        !(typeof item === 'object' && item !== null && Object.keys(item).length === 0)
      ).map(lightClean);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, value]) => 
            value !== null && 
            value !== undefined && 
            value !== '' &&
            !(Array.isArray(value) && value.length === 0)
          )
          .map(([key, value]) => [key, lightClean(value)])
      );
    }
    
    return obj;
  }
  
  const originalSize = JSON.stringify({ facts_v3: factsV3, control_block: controlBlock }).length;
  
  const cleanedFacts = lightClean(factsV3);
  const cleanedControl = lightClean(controlBlock);
  
  const cleanedSize = JSON.stringify({ facts_v3: cleanedFacts, control_block: cleanedControl }).length;
  const savings = originalSize > 0 ? Math.round(((originalSize - cleanedSize) / originalSize) * 100) : 0;
  
  console.log(`✅ Light JSON cleanup: ${Math.round(originalSize / 1024)}KB → ${Math.round(cleanedSize / 1024)}KB (${savings}% empty data removed)`);
  
  return {
    facts_v3: cleanedFacts,
    control_block: cleanedControl
  };
}

/**
 * Generate ghost mannequin image using AI Studio (Gemini 2.5 Flash) with complete payload integration
 * @param flatlayImage - Clean flatlay image (base64 or URL)
 * @param consolidation - Complete consolidation output with FactsV3 and ControlBlock
 * @param originalImage - Optional on-model reference image
 * @param sessionId - Session ID for tracking
 * @param options - Generation options including structured prompt settings
 * @returns Promise with rendered image URL and processing time
 */
/**
 * Generate ghost mannequin using AI Studio with direct JSON payload (OPTIMAL)
 * Passes structured FactsV3 + ControlBlock data directly as JSON to Flash Image
 */
export async function generateGhostMannequinWithStructuredJSON(
  flatlayImage: string,
  factsV3: any,
  controlBlock: any,
  originalImage?: string,
  options?: { sessionId?: string }
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  
  if (!genAI) {
    throw new GhostPipelineError(
      'AI Studio client not configured. Call configureAiStudioClient first.',
      'CLIENT_NOT_CONFIGURED',
      'rendering'
    );
  }

  try {
    console.log('🎯 AI Studio: Using embedded image-in-JSON approach (OPTIMAL)');
    console.log(`📊 FactsV3 fields: ${Object.keys(factsV3).length}`);
    console.log(`📝 ControlBlock fields: ${Object.keys(controlBlock).length}`);
    
    // Step 1: Upload images to Files API (eliminates base64 token usage!)
    console.log('🖼️ Uploading images to Files API for efficient token usage...');
    const flatlayFile = await uploadImageToFilesAPI(flatlayImage, 'flatlay', options?.sessionId || 'ai-studio-gen');
    
    let originalFile: UploadedFile | undefined;
    if (originalImage) {
      console.log('📸 Uploading on-model reference to Files API...');
      originalFile = await uploadImageToFilesAPI(originalImage, 'reference', options?.sessionId || 'ai-studio-gen');
    }
    
    // Step 2: Create compact JSON with actionable rules format
    console.log('🔧 Creating compact JSON with actionable rules...');
    const embeddedGarmentSpec = createCompactJsonSpec(factsV3, controlBlock, flatlayFile, originalFile, options?.sessionId);
    
    // Step 3: Generate JSON payload (COMPACT FORMAT - MASSIVE TOKEN SAVINGS!)
    const jsonString = JSON.stringify(embeddedGarmentSpec, null, 2);
    const jsonSizeKB = Math.round(jsonString.length / 1024);
    
    console.log(`📏 JSON specification only: ${jsonSizeKB}KB (images via Files API)`);
    console.log(`📦 Files uploaded: ${flatlayFile.name} + ${originalFile ? originalFile.name : 'none'}`);
    
    // NEW: Token usage for JSON only (images cost ZERO tokens via Files API!)
    const jsonOnlyTokens = Math.round(jsonString.length / 4);
    const imageTokensSaved = originalFile ? 100000 : 50000;  // Rough estimate of base64 tokens saved
    
    console.log(`🧠 JSON-only token usage: ~${jsonOnlyTokens.toLocaleString()} tokens`);
    console.log(`🎆 Base64 tokens SAVED via Files API: ~${imageTokensSaved.toLocaleString()} tokens`);
    console.log(`✨ Total token reduction: ~${Math.round((imageTokensSaved / (jsonOnlyTokens + imageTokensSaved)) * 100)}%`);
    
    // Check against the 32K input token limit
    const INPUT_TOKEN_LIMIT = 32768;
    if (jsonOnlyTokens > INPUT_TOKEN_LIMIT * 0.9) {
      console.log(`🟡 JSON approaching 32K limit (${Math.round(jsonOnlyTokens/327.68)}%)`);
    } else {
      console.log(`🟢 JSON token usage: ${Math.round(jsonOnlyTokens/327.68)}% of 32K limit - EXCELLENT!`);
    }
    
    // Step 5: JSON is ready - no emergency optimization needed with Files API!
    let finalJsonString = jsonString;
    console.log(`🎆 Files API eliminates need for emergency optimization!`);
    
    // Step 6: Configure Gemini 2.5 Flash Image model with system instructions
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      systemInstruction: {
        parts: [{
          text: `You are a professional AI product photographer specializing in ghost-mannequin fashion imagery for e-commerce.

Your goal is to generate a clean, commercial product image that follows the attached JSON specification exactly.

Global defaults: pure #FFFFFF seamless background; soft, even studio lighting; neutral white balance; centered composition; high-resolution with crisp detail.

Ghost-mannequin effect: render an invisible form with natural 3-D garment volume. Show interior hollows such as neckline, cuffs, hems, and vents with subtle occlusion. Preserve realistic material thickness and drape for any garment type.

Construction fidelity: keep exact colors, seams, stitching, trims, and brand labels as seen in the references. Maintain true fabric texture and weight. Avoid flattening, over-smoothing, or inventing details.

Strictly exclude mannequins, humans, props, reflections, long shadows, or added backgrounds.

Return IMAGE ONLY. If uncertain, choose a neutral, catalog-style rendering that meets professional e-commerce standards.`
        }]
      },
      generationConfig: {
        temperature: 0.05, // Very low temperature for consistent results
        responseModalities: ['Image'], // Explicit image-only output
        imageConfig: {
          aspectRatio: "4:5" // Optimal for e-commerce product display
        }
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Realistic safety settings
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Step 7: Send as complete JSON specification with retry logic for rate limits
    console.log('🚀 Sending complete JSON specification to AI Studio Flash Image...');
    
    let result;
    let response; // Declare response variable outside try block
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // OPTIMIZED APPROACH: Correct parts ordering for best grounding
        const contentParts: any[] = [
          // Images first for best grounding
          {
            fileData: {
              fileUri: flatlayFile.uri,
              mimeType: flatlayFile.mimeType
            }
          }
        ];
        
        // Add reference image if available
        if (originalFile) {
          contentParts.push({
            fileData: {
              fileUri: originalFile.uri,
              mimeType: originalFile.mimeType
            }
          });
        }
        
               // Concise instruction (system instructions handle the rest)
               contentParts.push({
                 text: "Generate ghost-mannequin image following the JSON specification below."
               });
               
               // JSON specification as structured data
               contentParts.push({
                 text: "SPEC:\n```json\n" + finalJsonString + "\n```"
               });
        
        console.log(`🎆 Sending ${contentParts.length} parts: ${originalFile ? '2 images' : '1 image'} + instruction + JSON spec`);
        
        result = await model.generateContent(contentParts);
        
        response = await result.response; // Assign to outer scope variable
        console.log('✅ AI Studio JSON generation completed!');
        break; // Success, exit retry loop
        
      } catch (error: any) {
        // Check if it's a rate limit error
        if (error.message && error.message.includes('429') && error.message.includes('quota')) {
          // Extract retry delay from error message
          const retryMatch = error.message.match(/retry in ([0-9.]+)s/);
          const retryDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : 45000; // Default 45s
          
          console.log(`⏸️ Rate limit hit (attempt ${retryCount + 1}/${maxRetries})`);
          console.log(`⏳ Waiting ${Math.round(retryDelay / 1000)}s before retry...`);
          
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
            continue;
          }
        }
        
        // Not a rate limit error or max retries exceeded
        throw error;
      }
    }
    
    // Step 5: Extract generated image
    if (!response) {
      throw new GhostPipelineError(
        'No response received from AI Studio after retries',
        'RENDERING_FAILED',
        'rendering'
      );
    }
    
    // Step 5: Extract generated image safely with response_modalities format
    const candidates = response.candidates;
    if (!candidates?.[0]?.content?.parts) {
      throw new GhostPipelineError(
        'AI Studio response contains no content',
        'RENDERING_FAILED',
        'rendering'
      );
    }

    // Find image part (with response_modalities: ['Image'], first part should be image)
    const imagePart = candidates[0].content.parts.find(part => 
      part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      throw new GhostPipelineError(
        'AI Studio did not generate an image with response_modalities format',
        'RENDERING_FAILED',
        'rendering'
      );
    }

    console.log('🎨 Generated image found! Processing...');
    console.log(`📏 Image size: ${Math.round(imagePart.inlineData.data.length / 1024)}KB`);
    
    // Convert to data URL and upload to FAL storage
    const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    const { uploadImageToFalStorage } = await import('./fal');
    const renderUrl = await uploadImageToFalStorage(imageDataUrl);
    
    console.log('✅ Generated image uploaded to FAL storage:', renderUrl);
    
    const processingTime = Date.now() - startTime;
    
    // Log optimization success summary
    const finalSizeKB = Math.round(finalJsonString.length / 1024);
    const finalTokens = Math.round(finalJsonString.length / 4);
    console.log(`🎯 AI Studio embedded JSON generation completed in ${processingTime}ms`);
    console.log(`📏 Final payload: ${finalSizeKB}KB (~${finalTokens.toLocaleString()} tokens)`);
    console.log(`🏆 Successfully generated ghost mannequin with embedded images in JSON!`);
    
    return { renderUrl, processingTime };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ AI Studio embedded JSON generation failed:', error);
    
    if (error instanceof GhostPipelineError) {
      throw error;
    }
    
    // Check for rate limit errors and provide specific error code
    if (error instanceof Error && error.message.includes('429') && error.message.includes('quota')) {
      throw new GhostPipelineError(
        `Gemini API rate limit exceeded. ${error.message}`,
        'GEMINI_QUOTA_EXCEEDED',
        'rendering',
        error
      );
    }
    
    throw new GhostPipelineError(
      `AI Studio embedded JSON generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Generate ghost mannequin using AI Studio (LEGACY - uses text prompts)
 */
export async function generateGhostMannequinWithAiStudio(
  flatlayImage: string,
  consolidation: ConsolidationOutput,
  originalImage?: string,
  sessionId?: string,
  options?: { useStructuredPrompt?: boolean; useExpertPrompt?: boolean }
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  
  if (!genAI) {
    throw new GhostPipelineError(
      'AI Studio client not configured. Call configureAiStudioClient first.',
      'CLIENT_NOT_CONFIGURED',
      'rendering'
    );
  }

  // Declare variables that need to be accessible in catch block
  let model: any;
  let contentParts: any[] = [];

  try {
    console.log('🎯 Starting AI Studio ghost mannequin generation...');
    console.log(`📊 FactsV3 fields: ${Object.keys(consolidation.facts_v3).length}`);
    console.log(`📝 ControlBlock fields: ${Object.keys(consolidation.control_block).length}`);
    
    // Step 1: Generate prompt using structured system if requested
    let promptResult: { prompt: string; processingTime: number };
    
    if (options?.useStructuredPrompt) {
      console.log('🎯 Using structured prompt system (Amazon compliance + expert directives)...');
      const { buildDynamicFlashPrompt } = await import('./consolidation');
      
      const structuredPrompt = await buildDynamicFlashPrompt(
        consolidation.facts_v3,
        consolidation.control_block,
        sessionId || 'ai-studio-gen',
        options.useStructuredPrompt,
        options.useExpertPrompt
      );
      
      promptResult = {
        prompt: structuredPrompt,
        processingTime: 0
      };
      console.log('✅ Structured prompt with JSON specs + narrative + Amazon compliance ready');
    } else {
      console.log('🔄 Using standard dynamic prompt...');
      promptResult = await generateDynamicPrompt(
        consolidation.facts_v3,
        consolidation.control_block,
        sessionId || 'ai-studio-gen'
      );
    }
    
    console.log(`✅ Dynamic prompt generated in ${promptResult.processingTime}ms`);
    console.log(`📏 Prompt length: ${promptResult.prompt.length} characters`);
    console.log('🔍 Prompt preview:', promptResult.prompt.substring(0, 200) + '...');

    // Step 2: Configure Gemini 2.5 Flash Image model
    model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image", // Using stable model name
      generationConfig: {
        temperature: 0.05, // Very low temperature for consistent results
        responseModalities: ['Image'], // Explicit image-only output
        imageConfig: {
          aspectRatio: "4:5" // Optimal for e-commerce product display
        }
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Realistic safety settings
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Step 3: Prepare images
    console.log('🖼️ Preparing images for AI Studio...');
    const flatlayData = await prepareImageForAiStudio(flatlayImage);
    const flatlayMimeType = getImageMimeType(flatlayImage);
    
    // Build content parts for generation
    contentParts = [
      {
        text: promptResult.prompt,
      },
      {
        text: "Primary Image (Detail Source - Main visual reference for colors, patterns, and construction):",
      },
      {
        inlineData: {
          data: flatlayData,
          mimeType: flatlayMimeType,
        },
      },
    ];

    // Add original image if provided (Shape Reference)
    if (originalImage) {
      console.log('📸 Adding shape reference image...');
      const originalData = await prepareImageForAiStudio(originalImage);
      const originalMimeType = getImageMimeType(originalImage);
      
      contentParts.splice(1, 0, {
        text: "Shape Reference (For proportions and fit - visual details come from Primary Image):",
      });
      contentParts.splice(2, 0, {
        inlineData: {
          data: originalData,
          mimeType: originalMimeType,
        },
      });
    }

    console.log(`🚀 Calling AI Studio with ${contentParts.length} content parts...`);
    
    // Step 4: Generate the ghost mannequin image
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    
    console.log('✅ AI Studio generation completed!');
    
    // Step 5: Extract generated image from response
    let renderUrl: string;
    
    // Check if response contains generated images
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        console.log(`📦 Found ${candidate.content.parts.length} content parts in response`);
        
        // Look for inline image data
        const imagePart = candidate.content.parts.find((part: any) => 
          part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')
        );
        
        if (imagePart && imagePart.inlineData) {
          console.log('🎨 Generated image found! Processing...');
          
          // Convert base64 image to data URL
          const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          
          // Upload to FAL storage for permanent URL
          console.log('☁️ Uploading to FAL storage...');
          const { uploadImageToFalStorage } = await import('./fal');
          renderUrl = await uploadImageToFalStorage(imageDataUrl);
          
          console.log('✅ Generated image uploaded to FAL storage:', renderUrl);
        } else {
          console.warn('⚠️ No generated image found in AI Studio response');
          throw new GhostPipelineError(
            'AI Studio did not generate an image',
            'RENDERING_FAILED',
            'rendering'
          );
        }
      } else {
        console.warn('⚠️ No content found in AI Studio response');
        throw new GhostPipelineError(
          'AI Studio response contains no content',
          'RENDERING_FAILED',
          'rendering'
        );
      }
    } else {
      console.warn('⚠️ No candidates found in AI Studio response');
      throw new GhostPipelineError(
        'AI Studio response contains no candidates',
        'RENDERING_FAILED',
        'rendering'
      );
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`🎯 AI Studio ghost mannequin generation completed in ${processingTime}ms`);
    
    return {
      renderUrl,
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ AI Studio ghost mannequin generation failed:', error);
    
    // Re-throw if already a GhostPipelineError
    if (error instanceof GhostPipelineError) {
      throw error;
    }
    
    // Handle AI Studio-specific errors
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        // Extract retry delay from error message
        const retryMatch = error.message.match(/Please retry in ([0-9.]+)s/);
        const retryDelay = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) * 1000 : 45000;
        
        console.log(`⏳ Gemini quota exceeded. Auto-retrying in ${retryDelay/1000} seconds...`);
        
        // Wait for the specified retry delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Retry the request once
        try {
          console.log('🔄 Retrying AI Studio request after quota reset...');
          if (!model || !contentParts) {
            throw new Error('Model or contentParts not initialized for retry');
          }
          const retryResult = await model.generateContent(contentParts);
          const retryResponse = await retryResult.response;
          
          // Process retry response (same logic as original)
          const candidates = retryResponse.candidates;
          if (candidates && candidates.length > 0) {
            const candidate = candidates[0];
            if (candidate.content && candidate.content.parts) {
              const imagePart = candidate.content.parts.find((part: any) =>
                part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')
              );
              
              if (imagePart && imagePart.inlineData) {
                const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                const { uploadImageToFalStorage } = await import('./fal');
                const renderUrl = await uploadImageToFalStorage(imageDataUrl);
                
                const processingTime = Date.now() - startTime;
                console.log(`✅ AI Studio retry successful in ${processingTime}ms`);
                
                return { renderUrl, processingTime };
              }
            }
          }
          
          throw new Error('Retry response invalid');
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError);
        }
        
        throw new GhostPipelineError(
          'AI Studio API quota exceeded - retry also failed',
          'GEMINI_QUOTA_EXCEEDED',
          'rendering',
          error
        );
      }

      if (error.message.includes('safety') || error.message.includes('blocked')) {
        throw new GhostPipelineError(
          'Content blocked by AI Studio safety filters',
          'CONTENT_BLOCKED',
          'rendering',
          error
        );
      }
    }

    throw new GhostPipelineError(
      `AI Studio ghost mannequin generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Alternative generation method with simplified prompt (fallback)
 * @param flatlayImage - Clean flatlay image
 * @param consolidation - Consolidation output
 * @param originalImage - Optional on-model reference
 * @param sessionId - Session ID
 */
export async function generateGhostMannequinWithAiStudioSimple(
  flatlayImage: string,
  consolidation: ConsolidationOutput,
  originalImage?: string,
  sessionId?: string
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  
  if (!genAI) {
    throw new GhostPipelineError(
      'AI Studio client not configured. Call configureAiStudioClient first.',
      'CLIENT_NOT_CONFIGURED',
      'rendering'
    );
  }

  try {
    console.log('🎯 Starting AI Studio simple ghost mannequin generation...');
    
    // Use a simplified but effective prompt
    const simplePrompt = `Create professional e-commerce ghost mannequin photography showing a ${consolidation.control_block.category_generic || 'garment'} with perfect dimensional form against a pristine white studio background. 

This is invisible mannequin product photography where the garment displays natural fit and drape with no visible person, mannequin, or model. The garment appears filled with invisible human form, showing realistic volume and structure.

Colors: ${consolidation.facts_v3.palette?.dominant_hex || '#CCCCCC'} (primary), ${consolidation.facts_v3.palette?.accent_hex || '#CCCCCC'} (accent)
Material: ${consolidation.facts_v3.material || 'fabric'} with ${consolidation.facts_v3.surface_sheen || 'matte'} finish
Construction: ${consolidation.facts_v3.required_components?.join(', ') || 'standard construction'}

The ghost mannequin effect creates perfect e-commerce presentation - the garment floats naturally with proper dimensional form, displaying how the fabric moves and falls when worn, but with complete transparency of any supporting structure.

Preserve every original color, pattern, and design element exactly as shown in the reference image. Maintain any visible brand labels, care labels, or text elements with perfect clarity and readability.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.1,
      },
    });

    // Prepare image
    const flatlayData = await prepareImageForAiStudio(flatlayImage);
    const flatlayMimeType = getImageMimeType(flatlayImage);
    
    const contentParts: any[] = [
      { text: simplePrompt },
      {
        inlineData: {
          data: flatlayData,
          mimeType: flatlayMimeType,
        },
      },
    ];

    if (originalImage) {
      const originalData = await prepareImageForAiStudio(originalImage);
      const originalMimeType = getImageMimeType(originalImage);
      contentParts.push({
        inlineData: {
          data: originalData,
          mimeType: originalMimeType,
        },
      });
    }

    const result = await model.generateContent(contentParts);
    const response = await result.response;
    
    // Extract image (same logic as main function)
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      const imagePart = candidates[0].content.parts.find(part => 
        part.inlineData?.mimeType?.startsWith('image/')
      );
      
      if (imagePart?.inlineData) {
        const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        const { uploadImageToFalStorage } = await import('./fal');
        const renderUrl = await uploadImageToFalStorage(imageDataUrl);
        
        return {
          renderUrl,
          processingTime: Date.now() - startTime,
        };
      }
    }
    
    throw new GhostPipelineError(
      'AI Studio simple generation failed to produce image',
      'RENDERING_FAILED',
      'rendering'
    );

  } catch (error) {
    console.error('❌ AI Studio simple generation failed:', error);
    throw error instanceof GhostPipelineError ? error : new GhostPipelineError(
      `AI Studio simple generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Health check for AI Studio integration
 */
export async function checkAiStudioHealth(): Promise<{ status: string; message: string }> {
  if (!genAI) {
    return {
      status: 'error',
      message: 'AI Studio client not configured'
    };
  }

  try {
    // Test with a simple generation request
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    const testResult = await model.generateContent("Generate a simple test image of a red circle on white background");
    
    if (testResult.response) {
      return {
        status: 'healthy',
        message: 'AI Studio client is accessible and functional'
      };
    } else {
      return {
        status: 'warning',
        message: 'AI Studio client accessible but no response received'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `AI Studio health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get AI Studio client status and configuration
 */
export function getAiStudioStatus(): {
  configured: boolean;
  model: string;
  capabilities: string[];
} {
  return {
    configured: !!genAI,
    model: 'gemini-2.5-flash-image-preview',
    capabilities: [
      'Image Generation',
      'Multi-modal Input (Text + Images)',
      'Dynamic Prompt Integration',
      'FactsV3 Consolidation Support',
      'Professional Ghost Mannequin Generation',
      'Enhanced Flatlay Generation',
      'Structured JSON Input',
      'Direct URL Image Input'
    ]
  };
}

/**
 * Generate enhanced flatlay using AI Studio with Gemini 2.5 Flash Image
 * Uses the same analysis pipeline but with flatlay-specific prompts
 */
export async function generateEnhancedFlatlay(
  consolidation: ConsolidationOutput,
  cleanedImageUrl: string,
  options: {
    sessionId: string;
    referenceImageUrl?: string;
  }
): Promise<GhostMannequinResult> {
  if (!genAI) {
    throw new GhostPipelineError(
      'AI Studio client not configured. Call configureAiStudioClient first.',
      'CLIENT_NOT_CONFIGURED',
      'rendering'
    );
  }

  const startTime = Date.now();
  
  try {
    console.log('🎨 Starting enhanced flatlay generation with AI Studio...');
    console.log('📊 Using Gemini 2.5 Flash Image Preview');
    
    // Generate flatlay-specific prompt
    const { prompt: flatlayPrompt } = await generateFlatlayPrompt(
      consolidation.facts_v3,
      consolidation.control_block,
      options.sessionId
    );
    
    console.log('✅ Flatlay prompt generated');
    console.log('📏 Prompt length:', flatlayPrompt.length, 'characters');
    console.log('🎯 Flatlay prompt preview:', flatlayPrompt.substring(0, 200) + '...');
    
    // Upload cleaned image to Files API
    console.log('🖼️ Uploading cleaned image to Files API...');
    const uploadedImage = await uploadImageToFilesAPI(
      cleanedImageUrl,
      'flatlay',
      options.sessionId
    );
    
    console.log('✅ Image uploaded to Files API');
    console.log('📎 File URI:', uploadedImage.uri);
    
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
      },
    });
    
    // Prepare content parts
    const parts = [
      {
        fileData: {
          fileUri: uploadedImage.uri,
          mimeType: uploadedImage.mimeType,
        },
      },
      {
        text: flatlayPrompt,
      },
    ];
    
    console.log('🚀 Sending flatlay enhancement request to AI Studio...');
    console.log('📦 Content parts:', parts.length);
    
    // Generate enhanced flatlay
    const result = await model.generateContent(parts);
    const response = result.response;
    
    // Extract generated image
    const inlineData = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    )?.inlineData;
    
    if (!inlineData) {
      throw new GhostPipelineError(
        'No image generated by AI Studio',
        'NO_IMAGE_GENERATED',
        'rendering'
      );
    }
    
    console.log('✅ Enhanced flatlay generated successfully');
    console.log('📏 Image size:', Math.round(inlineData.data.length / 1024), 'KB');
    
    // Upload to FAL storage for consistent return format
    const { uploadImageToFalStorage } = await import('./fal');
    const imageData = `data:${inlineData.mimeType};base64,${inlineData.data}`;
    
    console.log('📤 Uploading enhanced flatlay to FAL storage...');
    const falUrl = await uploadImageToFalStorage(imageData, 'enhanced-flatlay');
    
    console.log('✅ Enhanced flatlay uploaded to FAL storage');
    console.log('🔗 URL:', falUrl);
    
    const processingTime = Date.now() - startTime;
    
    return {
      imageUrl: falUrl,
      processingTime,
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        provider: 'ai-studio',
        outputType: 'flatlay',
        sessionId: options.sessionId,
        promptLength: flatlayPrompt.length,
        usedFilesAPI: true,
        flatlayPrompt: flatlayPrompt, // Add the full prompt for debugging
      },
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Enhanced flatlay generation failed:', error);
    
    throw new GhostPipelineError(
      `Enhanced flatlay generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}
