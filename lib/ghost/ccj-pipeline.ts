import { generateGhostMannequin } from './gemini';
import { generateCCJPackage, type CCJPackage } from './ccj-generator';
import { validateCCJResult, type QAResult } from './ccj-qa';
import { AnalysisJSON, EnrichmentJSON } from '../types/ghost';
import { 
  processGhostMannequinCCJ, 
  generateWithQA,
  consolidateToCCJ,
  buildGeminiParts,
  toFilesURI
} from './ccj-improved';

export interface CCJPipelineConfig {
  enableQA: boolean;
  enableRetry: boolean;
  maxImageSize: number;
  retryImageSize: number;
  enableHintsPassthrough: boolean;
  forceShortPrompt: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_CCJ_CONFIG: CCJPipelineConfig = {
  enableQA: true,
  enableRetry: true,
  maxImageSize: 2048,
  retryImageSize: 1536,
  enableHintsPassthrough: false,
  forceShortPrompt: false,
  logLevel: 'info',
};

export interface CCJPipelineResult {
  success: boolean;
  generated_image_url?: string;
  ccj_package: CCJPackage;
  qa_result?: QAResult;
  qa_storage_record?: any;
  sizes: {
    ccj_bytes: number;
    hints_bytes: number;
    total_bytes: number;
  };
}

export async function processCCJGhostMannequin(
  facts: any,
  controlBlock: any,
  sessionId: string,
  images: {
    flatlayUrl: string;
    onModelUrl?: string;
  },
  config: CCJPipelineConfig = DEFAULT_CCJ_CONFIG
): Promise<CCJPipelineResult> {
  const startTime = Date.now();
  
  console.log(`🚀 Starting CCJ Ghost Mannequin Pipeline for session: ${sessionId}`);
  
  // Generate CCJ package
  const ccjPackage = generateCCJPackage(facts, controlBlock, sessionId);
  
  console.log(`📦 CCJ Package generated:`);
  console.log(`   • CCJ size: ${ccjPackage.sizes.ccj_bytes} bytes`);
  console.log(`   • Hints size: ${ccjPackage.sizes.hints_bytes} bytes`);
  console.log(`   • Prompt length: ${ccjPackage.prompt.length} characters`);
  console.log(`   • Digest: ${ccjPackage.digest}`);
  
  // Convert facts to AnalysisJSON format for generateGhostMannequin
  const analysis: AnalysisJSON = convertFactsToAnalysisJSON(facts, sessionId);
  const enrichment: EnrichmentJSON = convertFactsToEnrichmentJSON(facts, sessionId);
  
  // Generate image using real Gemini Flash Image API
  console.log(`🎨 Attempting image generation with CCJ approach...`);
  
  const generationResult = await generateCCJImage(
    ccjPackage,
    images.flatlayUrl,
    images.onModelUrl,
    analysis,
    enrichment,
    config,
    sessionId,
    false
  );
  
  if (!generationResult.success) {
    console.error(`❌ CCJ Pipeline failed: ${generationResult.error}`);
    return {
      success: false,
      ccj_package: ccjPackage,
      sizes: ccjPackage.sizes,
    };
  }
  
  let qaResult: QAResult | undefined;
  
  // Run QA validation if enabled
  if (config.enableQA) {
    console.log(`🔍 Running CCJ-based QA validation...`);
    qaResult = await validateCCJResult(
      generationResult.imageUrl!,
      ccjPackage,
      images.flatlayUrl,
      sessionId
    );
    
    console.log(`📊 QA Results: ${qaResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Retry with smaller image if QA failed and retry is enabled
    if (!qaResult.passed && config.enableRetry) {
      console.log(`🔄 QA failed, attempting bounded retry...`);
      
      const retryResult = await generateCCJImage(
        ccjPackage,
        images.flatlayUrl,
        images.onModelUrl,
        analysis,
        enrichment,
        { ...config, maxImageSize: config.retryImageSize },
        sessionId,
        true
      );
      
      if (retryResult.success) {
        // Re-run QA on retry result
        qaResult = await validateCCJResult(
          retryResult.imageUrl!,
          ccjPackage,
          images.flatlayUrl,
          sessionId
        );
        
        console.log(`📊 QA Results (retry): ${qaResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        // Update generation result to retry result
        Object.assign(generationResult, retryResult);
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`✅ CCJ Pipeline completed in ${totalTime}ms`);
  
  return {
    success: true,
    generated_image_url: generationResult.imageUrl,
    ccj_package: ccjPackage,
    qa_result: qaResult,
    sizes: ccjPackage.sizes,
  };
}

async function generateCCJImage(
  ccjPackage: CCJPackage,
  flatlayUrl: string,
  onModelUrl: string | undefined,
  analysis: AnalysisJSON,
  enrichment: EnrichmentJSON,
  config: CCJPipelineConfig,
  sessionId: string,
  isRetry: boolean
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    console.log(`${isRetry ? '🔄' : '🎨'} ${isRetry ? 'Retry' : 'Initial'} generation attempt`);
    
    // Convert to improved CCJ format with interior + label locks
    const consolidatedFacts = {
      ...analysis,
      ...enrichment,
      visual_references: {
        primary: flatlayUrl,
        aux: onModelUrl ? [onModelUrl] : []
      }
    };
    
    // Use improved CCJ pipeline with direct Gemini generation
    // Pass the full sessionId, not just the truncated garment_id
    const imageBuffer = await processGhostMannequinCCJ(consolidatedFacts, sessionId);
    
    // Convert buffer to data URL for compatibility
    const imageBase64 = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log(`${isRetry ? '🔄' : '✅'} Generation successful with improved CCJ pipeline`);
    return { success: true, imageUrl: imageDataUrl };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`${isRetry ? '🔄❌' : '❌'} Generation failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

function convertFactsToAnalysisJSON(facts: any, sessionId: string): AnalysisJSON {
  return {
    type: 'garment_analysis',
    meta: {
      schema_version: '4.1',
      session_id: sessionId,
    },
    labels_found: facts.labels_found || [],
    preserve_details: facts.preserve_details || [],
    interior_analysis: facts.interior_analysis || [],
    hollow_regions: facts.hollow_regions || [],
    construction_details: facts.construction_details || {},
    palette: facts.palette || {},
    material: facts.material || 'cotton',
    weave_knit: facts.weave_knit || 'woven',
    drape_stiffness: facts.drape_stiffness || 0.4,
    transparency: facts.transparency || 'opaque',
    surface_sheen: facts.surface_sheen || 'matte',
    pattern: facts.pattern || 'solid',
    print_scale: facts.print_scale || 'unknown',
    edge_finish: facts.edge_finish || 'unknown',
    special_handling: facts.special_handling || '',
    image_b_priority: {
      print_direction_notes: facts.print_direction_notes || '',
    },
  };
}

function convertFactsToEnrichmentJSON(facts: any, sessionId: string): EnrichmentJSON {
  return {
    type: 'garment_enrichment_focused',
    meta: {
      schema_version: '4.3',
      session_id: sessionId,
      base_analysis_ref: sessionId,
    },
    color_precision: facts.color_precision || {
      primary_hex: '#FFFFFF',
      color_temperature: 'neutral',
      saturation_level: 'moderate',
    },
    fabric_behavior: facts.fabric_behavior || {
      drape_quality: 'structured',
      surface_sheen: 'matte',
      transparency_level: 'opaque',
    },
    construction_precision: facts.construction_precision || {
      seam_quality: 'standard',
      stitch_density: 'medium',
      finishing_quality: 'good',
      overall_construction_grade: 'B',
    },
    rendering_guidance: facts.rendering_guidance || {
      preferred_angle: 'front',
      lighting_suggestions: 'soft_even',
      shadow_intensity: 'subtle',
      background_recommendations: 'white_seamless',
    },
    confidence_breakdown: facts.confidence_breakdown || {
      overall_confidence: 0.8,
      color_confidence: 0.9,
      construction_confidence: 0.7,
      label_confidence: 0.8,
    },
  };
}

export function extractCCJMetrics(result: CCJPipelineResult): {
  ccj_efficiency: number;
  qa_score: number;
  retry_rate: number;
  execution_speed: number;
} {
  const ccjEfficiency = result.sizes.ccj_bytes / (result.sizes.ccj_bytes + result.sizes.hints_bytes);
  
  let qaScore = 100;
  if (result.qa_result) {
    qaScore = result.qa_result.passed ? 100 : 
              (result.qa_result.score || 0);
  }
  
  const retryRate = result.qa_result && !result.qa_result.passed ? 1 : 0;
  
  const executionSpeed = 1; // ops per second (placeholder)
  
  return {
    ccj_efficiency: ccjEfficiency,
    qa_score: qaScore,
    retry_rate: retryRate,
    execution_speed: executionSpeed,
  };
}
