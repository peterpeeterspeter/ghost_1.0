import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { 
  GhostMannequinResult,
  GhostPipelineError,
} from "@/types/ghost";
import type { ConsolidationOutput } from './consolidation';
import { generateDynamicPrompt, configurePromptGenerator } from './prompt-generator';
import { getFilesManager, configureFilesManager, type ManagedFile } from './files-manager';

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

export function configureAiStudioEnhanced(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
  // Configure enhanced components
  configurePromptGenerator(apiKey);
  configureFilesManager(apiKey);
}

/**
 * Optimize image buffer using Sharp
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
 * Upload image using Enhanced Files Manager
 */
async function uploadImageWithEnhancedManager(
  imageInput: string, 
  role: 'flatlay' | 'reference',
  sessionId: string
): Promise<ManagedFile> {
  const filesManager = getFilesManager();
  
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

  // Optimize image before uploading
  const optimizedBuffer = await optimizeImageBuffer(imageBuffer, {
    role,
    maxWidth: role === 'flatlay' ? 1024 : 768,
    quality: role === 'flatlay' ? 0.85 : 0.75
  });

  console.log(`📸 Original: ${Math.round(imageBuffer.length / 1024)}KB → Optimized: ${Math.round(optimizedBuffer.length / 1024)}KB`);

  // Upload using enhanced manager
  return await filesManager.uploadFile(optimizedBuffer, {
    role,
    sessionId,
    mimeType,
    displayName: `ghost-mannequin-${role}-${sessionId}-${Date.now()}.${mimeType.split('/')[1]}`
  });
}

/**
 * Light JSON cleanup - preserve structure, remove only null/undefined/empty
 */
function optimizePayloadForTokens(factsV3: any, controlBlock: any): { facts_v3: any; control_block: any } {
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
 * Enhanced ghost mannequin generation with improved file management and cleanup
 */
export async function generateGhostMannequinEnhanced(
  flatlayImage: string,
  factsV3: any,
  controlBlock: any,
  originalImage?: string,
  options?: { 
    sessionId?: string;
    autoCleanup?: boolean;
    cleanupAfterHours?: number;
  }
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  const sessionId = options?.sessionId || 'ai-studio-enhanced';
  const autoCleanup = options?.autoCleanup ?? true;
  const cleanupAfterHours = options?.cleanupAfterHours ?? 2; // Faster cleanup for development
  
  if (!genAI) {
    throw new GhostPipelineError(
      'AI Studio Enhanced client not configured. Call configureAiStudioEnhanced first.',
      'CLIENT_NOT_CONFIGURED',
      'rendering'
    );
  }

  const filesManager = getFilesManager();

  try {
    console.log('🎯 AI Studio Enhanced: Using Files API with intelligent management');
    
    // Step 1: Auto-cleanup old files before processing (if enabled)
    if (autoCleanup) {
      console.log('🧹 Performing pre-processing cleanup...');
      const cleanupStats = await filesManager.cleanupOldFiles(cleanupAfterHours);
      if (cleanupStats.deleted > 0) {
        console.log(`✅ Cleaned up ${cleanupStats.deleted} old files`);
      }
    }
    
    // Step 2: Upload images with enhanced management
    console.log('🖼️ Uploading images with enhanced Files API management...');
    const flatlayFile = await uploadImageWithEnhancedManager(flatlayImage, 'flatlay', sessionId);
    
    let originalFile: ManagedFile | undefined;
    if (originalImage) {
      console.log('📸 Uploading on-model reference with enhanced management...');
      originalFile = await uploadImageWithEnhancedManager(originalImage, 'reference', sessionId);
    }
    
    // Step 3: Light JSON cleanup
    console.log('🔧 Light JSON cleanup while preserving structure...');
    const { facts_v3: optimizedFacts, control_block: optimizedControl } = optimizePayloadForTokens(factsV3, controlBlock);
    
    // Step 4: Create comprehensive JSON payload
    const embeddedGarmentSpec = {
      task: "professional_ghost_mannequin_generation",
      session_id: sessionId,
      
      expert_directives: {
        role: "expert AI image engine for Amazon-compliant e-commerce photography",
        task: "render flawless product image adhering to all parameters",
        principles: [
          "Parse JSON as direct commands",
          "Ghost mannequin: invisible person shape/volume",
          "Straight frontal view (0° angles)",
          "Platform compliance mandatory",
          "Professional studio output"
        ]
      },
      
      // Visual references using enhanced file metadata
      visual_references: {
        flatlay: {
          file_uri: flatlayFile.uri,
          mime_type: flatlayFile.mimeType,
          role: "ground_truth_source",
          instructions: "Absolute truth for colors, patterns, textures, details",
          metadata: {
            sizeKB: Math.round(flatlayFile.sizeBytes / 1024),
            contentHash: flatlayFile.contentHash,
            uploadTime: flatlayFile.createTime
          }
        },
        ...(originalFile ? {
          on_model: {
            file_uri: originalFile.uri,
            mime_type: originalFile.mimeType,
            role: "proportions_only",
            instructions: "Use ONLY for fit/shape - ignore colors/materials",
            metadata: {
              sizeKB: Math.round(originalFile.sizeBytes / 1024),
              contentHash: originalFile.contentHash,
              uploadTime: originalFile.createTime
            }
          }
        } : {})
      },
      
      facts_v3: optimizedFacts,
      control_block: optimizedControl,
      
      critical_requirements: [
        "Maintain exact color fidelity from facts_v3.palette hex values",
        "Preserve all required_components exactly as specified",
        "Apply material properties: drape_stiffness, transparency, surface_sheen",
        "Follow control_block lighting and shadow preferences precisely", 
        "Respect all safety constraints and negative constraints",
        "Generate straight frontal orthographic view only (0° yaw, 0° roll)",
        "Ensure professional studio lighting against pure white background",
        "Maintain hollow regions as specified (necklines, sleeves, openings)"
      ],
      
      output_requirements: {
        resolution: "high_resolution_commercially_ready",
        style: "professional_product_photography",
        background: "pure_white_studio",
        lighting: "soft_even_professional_studio",
        shadows: "eliminate_harsh_shadows",
        format: "single_image_no_commentary"
      }
    };
    
    // Step 5: Generate and log JSON stats
    const jsonString = JSON.stringify(embeddedGarmentSpec, null, 2);
    const jsonSizeKB = Math.round(jsonString.length / 1024);
    const jsonOnlyTokens = Math.round(jsonString.length / 4);
    const imageTokensSaved = originalFile ? 100000 : 50000;
    
    console.log(`📏 JSON specification: ${jsonSizeKB}KB (images via Enhanced Files API)`);
    console.log(`📦 Files uploaded: ${flatlayFile.displayName} (${Math.round(flatlayFile.sizeBytes / 1024)}KB)` + 
                (originalFile ? ` + ${originalFile.displayName} (${Math.round(originalFile.sizeBytes / 1024)}KB)` : ''));
    console.log(`🧠 JSON-only token usage: ~${jsonOnlyTokens.toLocaleString()} tokens`);
    console.log(`🎆 Base64 tokens SAVED: ~${imageTokensSaved.toLocaleString()} tokens`);
    console.log(`✨ Total token reduction: ~${Math.round((imageTokensSaved / (jsonOnlyTokens + imageTokensSaved)) * 100)}%`);
    
    // Step 6: Configure Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.05,
      },
    });
    
    // Step 7: Send request with enhanced error handling
    console.log('🚀 Sending enhanced JSON specification to AI Studio Flash Image...');
    
    let result;
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const contentParts: any[] = [
          {
            fileData: {
              fileUri: flatlayFile.uri,
              mimeType: flatlayFile.mimeType
            }
          }
        ];
        
        if (originalFile) {
          contentParts.push({
            fileData: {
              fileUri: originalFile.uri,
              mimeType: originalFile.mimeType
            }
          });
        }
        
        contentParts.push({
          text: jsonString
        });
        
        console.log(`🎆 Sending ${contentParts.length} parts with enhanced metadata`);
        
        result = await model.generateContent(contentParts);
        response = await result.response;
        
        console.log('✅ AI Studio Enhanced generation completed!');
        break;
        
      } catch (error: any) {
        if (error.message && error.message.includes('429') && error.message.includes('quota')) {
          const retryMatch = error.message.match(/retry in ([0-9.]+)s/);
          const retryDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : 45000;
          
          console.log(`⏸️ Rate limit hit (attempt ${retryCount + 1}/${maxRetries})`);
          console.log(`⏳ Waiting ${Math.round(retryDelay / 1000)}s before retry...`);
          
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
            continue;
          }
        }
        
        throw error;
      }
    }
    
    // Step 8: Extract and process result
    if (!response) {
      throw new GhostPipelineError(
        'No response received from AI Studio Enhanced after retries',
        'RENDERING_FAILED',
        'rendering'
      );
    }
    
    const candidates = response.candidates;
    if (!candidates?.[0]?.content?.parts) {
      throw new GhostPipelineError(
        'AI Studio Enhanced response contains no content',
        'RENDERING_FAILED',
        'rendering'
      );
    }

    const imagePart = candidates[0].content.parts.find(part => 
      part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      throw new GhostPipelineError(
        'AI Studio Enhanced did not generate an image',
        'RENDERING_FAILED',
        'rendering'
      );
    }

    console.log('🎨 Generated image found! Processing with enhanced metadata...');
    
    // Step 9: Create result with enhanced metadata
    const processingTime = Date.now() - startTime;
    const base64Data = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    
    const enhancedResult: GhostMannequinResult = {
      imageUrl: base64Data,
      processingTime,
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        sessionId,
        inputFiles: {
          flatlay: {
            uri: flatlayFile.uri,
            sizeKB: Math.round(flatlayFile.sizeBytes / 1024),
            contentHash: flatlayFile.contentHash
          },
          ...(originalFile ? {
            reference: {
              uri: originalFile.uri,
              sizeKB: Math.round(originalFile.sizeBytes / 1024),
              contentHash: originalFile.contentHash
            }
          } : {})
        },
        tokenUsage: {
          jsonTokens: jsonOnlyTokens,
          savedTokens: imageTokensSaved,
          reductionPercent: Math.round((imageTokensSaved / (jsonOnlyTokens + imageTokensSaved)) * 100)
        },
        payloadStats: {
          jsonSizeKB,
          totalFiles: originalFile ? 2 : 1,
          compressionApplied: true
        }
      }
    };
    
    // Step 10: Optional session cleanup after successful generation
    if (autoCleanup) {
      console.log('🧹 Scheduling session cleanup...');
      
      // Cleanup this session's files after a delay (allow for any follow-up processing)
      setTimeout(async () => {
        try {
          const sessionCleanup = await filesManager.cleanupSession(sessionId);
          console.log(`✅ Post-processing cleanup: ${sessionCleanup.deleted} session files deleted`);
        } catch (error) {
          console.warn('⚠️ Session cleanup failed:', error);
        }
      }, 30000); // 30 second delay
    }
    
    console.log(`✅ AI Studio Enhanced processing completed in ${processingTime}ms`);
    console.log(`📊 Storage stats:`, filesManager.getStorageStats());
    
    return enhancedResult;
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('AI Studio Enhanced generation failed:', error);
    
    // Cleanup on error (optional)
    if (autoCleanup) {
      try {
        await filesManager.cleanupSession(sessionId);
        console.log('🧹 Cleaned up session files after error');
      } catch (cleanupError) {
        console.warn('⚠️ Error cleanup failed:', cleanupError);
      }
    }

    if (error instanceof GhostPipelineError) {
      throw error;
    }

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
      `AI Studio Enhanced generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get Files API usage statistics
 */
export async function getFilesApiStats(): Promise<{
  totalFiles: number;
  totalSizeKB: number;
  filesByRole: Record<string, number>;
  oldestFile: string;
  newestFile: string;
}> {
  try {
    const filesManager = getFilesManager();
    return filesManager.getStorageStats();
  } catch (error) {
    console.warn('Failed to get Files API stats:', error);
    return {
      totalFiles: 0,
      totalSizeKB: 0,
      filesByRole: {},
      oldestFile: '',
      newestFile: ''
    };
  }
}

/**
 * Manual cleanup function for development/debugging
 */
export async function cleanupFilesApi(options?: {
  maxAgeHours?: number;
  sessionId?: string;
}): Promise<{ deleted: number; errors: number }> {
  try {
    const filesManager = getFilesManager();
    
    if (options?.sessionId) {
      return await filesManager.cleanupSession(options.sessionId);
    } else {
      return await filesManager.cleanupOldFiles(options?.maxAgeHours ?? 24);
    }
  } catch (error) {
    console.error('Manual cleanup failed:', error);
    return { deleted: 0, errors: 1 };
  }
}