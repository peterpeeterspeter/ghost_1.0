import type { FactsV3, ControlBlock } from './consolidation';
import { GhostPipelineError } from '@/types/ghost';
import { 
  generateCCJPackage, 
  type CCJPackage, 
  type CoreContractJSON, 
  type HintsJSON 
} from './ccj-generator';
import { 
  validateAgainstCCJ, 
  generateRetryParameters, 
  createQAStorageRecord,
  type QAResult,
  type QAStorageRecord 
} from './ccj-qa';

/**
 * CCJ Pipeline Configuration
 */
export interface CCJPipelineConfig {
  enableQA: boolean;
  enableRetry: boolean;
  maxImageSize: number;        // 2048px default, 1536px on retry
  retryImageSize: number;      // 1536px
  enableHintsPassthrough: boolean;  // Pass hints to model or keep for QA only
  forceShortPrompt: boolean;   // Use minimal prompt
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_CCJ_CONFIG: CCJPipelineConfig = {
  enableQA: true,
  enableRetry: true,
  maxImageSize: 2048,
  retryImageSize: 1536,
  enableHintsPassthrough: false, // Keep hints for QA only by default
  forceShortPrompt: false,
  logLevel: 'info'
};

/**
 * CCJ Pipeline Result
 */
export interface CCJPipelineResult {
  success: boolean;
  generated_image_url?: string;
  ccj_package: CCJPackage;
  qa_result?: QAResult;
  qa_storage_record?: QAStorageRecord;
  retry_used: boolean;
  execution_time_ms: number;
  error?: string;
  sizes: {
    ccj_bytes: number;
    hints_bytes: number;
    prompt_chars: number;
    total_payload_size: number;
  };
}

/**
 * Main CCJ Pipeline Orchestrator
 * Implements the two-tier JSON approach with Core Contract + Hints
 */
export async function processCCJGhostMannequin(
  facts: FactsV3,
  controlBlock: ControlBlock,
  sessionId: string,
  images: {
    flatlayUrl: string;      // B_clean.jpg (truth for color/texture)
    onModelUrl?: string;     // A_personless.jpg (scale/proportions only)
  },
  config: CCJPipelineConfig = DEFAULT_CCJ_CONFIG
): Promise<CCJPipelineResult> {
  const startTime = Date.now();
  let retryUsed = false;
  
  try {
    console.log(`🚀 Starting CCJ Ghost Mannequin Pipeline for session: ${sessionId}`);
    
    // Step 1: Generate Core Contract JSON + Hints
    const ccjPackage = generateCCJPackage(facts, controlBlock, sessionId);
    
    console.log(`📦 CCJ Package generated:`);
    console.log(`   • CCJ size: ${ccjPackage.sizes.ccj_bytes} bytes`);
    console.log(`   • Hints size: ${ccjPackage.sizes.hints_bytes} bytes`);
    console.log(`   • Prompt length: ${ccjPackage.prompt.length} characters`);
    console.log(`   • Digest: ${ccjPackage.digest}`);
    
    // Step 2: First generation attempt
    console.log(`🎨 Attempting image generation with CCJ approach...`);
    
    let generationResult = await attemptGeneration(
      ccjPackage,
      images,
      config,
      false // not a retry
    );
    
    let qaResult: QAResult | undefined;
    let qaStorageRecord: QAStorageRecord | undefined;
    
    // Step 3: QA validation if enabled
    if (config.enableQA && generationResult.success && generationResult.imageUrl) {
      console.log(`🔍 Running CCJ-based QA validation...`);
      
      qaResult = await validateAgainstCCJ(
        generationResult.imageUrl,
        images.flatlayUrl,
        ccjPackage.ccj,
        ccjPackage.digest
      );
      
      // Step 4: Retry logic if QA failed
      if (!qaResult.passed && config.enableRetry && !retryUsed) {
        console.log(`🔄 QA failed, attempting bounded retry...`);
        
        const retryParams = generateRetryParameters(qaResult);
        
        // Update config for retry
        const retryConfig = {
          ...config,
          maxImageSize: retryParams.downscaleImages ? config.retryImageSize : config.maxImageSize,
          forceShortPrompt: retryParams.shortenPrompt
        };
        
        // Retry generation
        const retryResult = await attemptGeneration(
          ccjPackage,
          images,
          retryConfig,
          true // is retry
        );
        
        if (retryResult.success) {
          generationResult = retryResult;
          retryUsed = true;
          
          // Re-run QA on retry result
          if (generationResult.imageUrl) {
            qaResult = await validateAgainstCCJ(
              generationResult.imageUrl,
              images.flatlayUrl,
              ccjPackage.ccj,
              ccjPackage.digest
            );
            qaResult.retry_used = true;
          }
        }
      }
      
      // Step 5: Store QA results
      if (qaResult && generationResult.imageUrl) {
        qaStorageRecord = createQAStorageRecord(
          sessionId,
          ccjPackage.ccj,
          qaResult,
          generationResult.imageUrl,
          retryUsed ? 1 : 0
        );
        
        console.log(`📊 QA Results: ${qaResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (!qaResult.passed) {
          console.log(`   Errors: ${qaResult.errors.join(', ')}`);
        }
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    const result: CCJPipelineResult = {
      success: generationResult.success,
      generated_image_url: generationResult.imageUrl,
      ccj_package: ccjPackage,
      qa_result: qaResult,
      qa_storage_record: qaStorageRecord,
      retry_used: retryUsed,
      execution_time_ms: executionTime,
      sizes: {
        ccj_bytes: ccjPackage.sizes.ccj_bytes,
        hints_bytes: ccjPackage.sizes.hints_bytes,
        prompt_chars: ccjPackage.prompt.length,
        total_payload_size: ccjPackage.sizes.total_bytes
      }
    };
    
    console.log(`${result.success ? '✅' : '❌'} CCJ Pipeline completed in ${executionTime}ms`);
    
    return result;
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ CCJ Pipeline failed:', error);
    
    // Generate minimal CCJ package for error response
    const errorCcjPackage = generateCCJPackage(facts, controlBlock, sessionId);
    
    return {
      success: false,
      ccj_package: errorCcjPackage,
      retry_used: retryUsed,
      execution_time_ms: executionTime,
      error: error instanceof Error ? error.message : 'Unknown pipeline error',
      sizes: {
        ccj_bytes: errorCcjPackage.sizes.ccj_bytes,
        hints_bytes: errorCcjPackage.sizes.hints_bytes,
        prompt_chars: errorCcjPackage.prompt.length,
        total_payload_size: errorCcjPackage.sizes.total_bytes
      }
    };
  }
}

/**
 * Attempt image generation with CCJ approach
 */
async function attemptGeneration(
  ccjPackage: CCJPackage,
  images: { flatlayUrl: string; onModelUrl?: string },
  config: CCJPipelineConfig,
  isRetry: boolean
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    console.log(`${isRetry ? '🔄' : '🎨'} ${isRetry ? 'Retry' : 'Initial'} generation attempt`);
    
    // Prepare prompt (potentially shortened for retry)
    let prompt = ccjPackage.prompt;
    if (config.forceShortPrompt || isRetry) {
      prompt = generateShortenedPrompt(ccjPackage.ccj, ccjPackage.digest);
    }
    
    console.log(`📋 Using prompt: ${prompt.length} characters`);
    console.log(`🖼️ Image references: B=${images.flatlayUrl}, A=${images.onModelUrl || 'none'}`);
    
    // Optional: Include hints if enabled
    if (config.enableHintsPassthrough) {
      const hintsPayload = JSON.stringify(ccjPackage.hints, null, 1);
      console.log(`💡 Including hints payload: ${hintsPayload.length} characters`);
    }
    
    // Simulate Freepik generation call (replace with actual implementation)
    // For now, return mock successful result
    const mockResult = {
      success: true,
      imageUrl: `data:image/jpeg;base64,${ccjPackage.digest}.jpg`,
      error: undefined
    };
    
    if (mockResult.success && mockResult.imageUrl) {
      console.log(`${isRetry ? '🔄' : '✅'} Generation successful: ${mockResult.imageUrl}`);
      return { success: true, imageUrl: mockResult.imageUrl };
    } else {
      console.log(`${isRetry ? '🔄❌' : '❌'} Generation failed: ${mockResult.error}`);
      return { success: false, error: mockResult.error };
    }
    
  } catch (error) {
    console.error(`❌ Generation attempt failed:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Generation error' 
    };
  }
}

/**
 * Generate shortened prompt for retry attempts
 */
function generateShortenedPrompt(ccj: CoreContractJSON, digest: string): string {
  const ccjInline = JSON.stringify(ccj, null, 0); // No formatting for compactness
  
  return `TASK: Ghost mannequin photo. No people.
B=truth, A=proportions only. Honor JSON CONTRACT.

CONTRACT(${digest}): ${ccjInline}

OUT: 2048×2048, white bg, ghost effect.`;
}

/**
 * Utility function to downscale image URLs (if needed)
 */
export function prepareImageForSize(imageUrl: string, maxSize: number): string {
  // In practice, you might want to add query parameters or use a resizing service
  // For now, return the original URL
  // TODO: Implement image resizing if needed
  return imageUrl;
}

/**
 * Extract key metrics from CCJ pipeline result
 */
export function extractCCJMetrics(result: CCJPipelineResult): {
  ccj_efficiency: number;  // CCJ size vs old approach
  qa_score: number;        // 0-100 based on QA results
  retry_rate: number;      // 0 or 1 for this result
  execution_speed: number; // ops per second
} {
  const ccjEfficiency = result.sizes.ccj_bytes / (result.sizes.ccj_bytes + result.sizes.hints_bytes);
  
  let qaScore = 100; // Default perfect score
  if (result.qa_result) {
    qaScore = result.qa_result.passed ? 100 : 
      Math.max(0, 100 - (result.qa_result.errors.length * 25)); // -25 points per error
  }
  
  const retryRate = result.retry_used ? 1 : 0;
  const executionSpeed = 1000 / result.execution_time_ms; // operations per second
  
  return {
    ccj_efficiency: ccjEfficiency,
    qa_score: qaScore,
    retry_rate: retryRate,
    execution_speed: executionSpeed
  };
}