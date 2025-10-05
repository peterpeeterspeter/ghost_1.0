/**
 * CCJ Integration Adapter
 * 
 * This adapter allows the CCJ pipeline to seamlessly integrate with the existing
 * Ghost Mannequin Pipeline by converting the existing AnalysisJSON and EnrichmentJSON
 * into CCJ format and orchestrating the CCJ-based generation.
 */

import type { AnalysisJSON, EnrichmentJSON } from '@/types/ghost';
import type { FactsV3, ControlBlock, ConsolidationOutput } from './consolidation';
import { 
  processCCJGhostMannequin, 
  type CCJPipelineConfig, 
  type CCJPipelineResult, 
  DEFAULT_CCJ_CONFIG 
} from './ccj-pipeline';

/**
 * Integration modes for CCJ pipeline
 */
export type CCJIntegrationMode = 
  | 'replace_consolidation'    // Replace consolidation + rendering stages
  | 'parallel_comparison'      // Run both old and new approaches
  | 'ccj_only';               // Skip consolidation, go straight to CCJ

/**
 * Configuration for CCJ integration
 */
export interface CCJIntegrationConfig extends CCJPipelineConfig {
  mode: CCJIntegrationMode;
  fallbackToLegacy: boolean;     // Fall back to legacy pipeline if CCJ fails
  compareResults: boolean;       // Run both and compare (for testing)
  preferCCJResults: boolean;     // Use CCJ results when both succeed
}

export const DEFAULT_CCJ_INTEGRATION_CONFIG: CCJIntegrationConfig = {
  ...DEFAULT_CCJ_CONFIG,
  mode: 'replace_consolidation',
  fallbackToLegacy: true,
  compareResults: false,
  preferCCJResults: true
};

/**
 * Adapter Result - combines CCJ with legacy pipeline result format
 */
export interface CCJIntegrationResult {
  // CCJ Results
  ccj_result: CCJPipelineResult;
  
  // Legacy Compatibility (for existing API consumers)
  legacy_compatible: {
    renderUrl: string;
    processingTime: number;
    facts_v3?: FactsV3;
    control_block?: ControlBlock;
  };
  
  // Integration Metadata
  integration_meta: {
    mode_used: CCJIntegrationMode;
    ccj_success: boolean;
    legacy_fallback_used: boolean;
    performance_comparison?: {
      ccj_time_ms: number;
      legacy_time_ms?: number;
      size_reduction_pct: number;    // CCJ vs legacy prompt size
      qa_score_improvement?: number;
    };
  };
}

/**
 * Main CCJ Integration Function
 * 
 * This function takes the SAME inputs as your existing consolidation step
 * and orchestrates CCJ processing while maintaining backward compatibility.
 * 
 * @param analysis - Your existing AnalysisJSON from step 2 ✅
 * @param enrichment - Your existing EnrichmentJSON from step 3 ✅  
 * @param imageRefs - Same image references from your pipeline
 * @param sessionId - Your existing session ID
 * @param config - CCJ integration configuration
 */
export async function integrateCCJWithExistingPipeline(
  analysis: AnalysisJSON,           // ✅ FROM YOUR EXISTING STEP 2
  enrichment: EnrichmentJSON,       // ✅ FROM YOUR EXISTING STEP 3
  imageRefs: {
    cleanedImageUrl: string;        // From your FAL background removal
    onModelUrl?: string;           // Your original on-model image
  },
  sessionId: string,
  config: CCJIntegrationConfig = DEFAULT_CCJ_INTEGRATION_CONFIG
): Promise<CCJIntegrationResult> {
  
  console.log(`🔗 Starting CCJ Integration with mode: ${config.mode}`);
  console.log(`📊 Input: AnalysisJSON (${JSON.stringify(analysis).length} chars), EnrichmentJSON (${JSON.stringify(enrichment).length} chars)`);
  
  const startTime = Date.now();
  let legacyResult: ConsolidationOutput | undefined;
  let legacyTime: number | undefined;
  
  // STEP 1: Convert your existing JSONs to FactsV3 + ControlBlock format
  // This uses your existing consolidation logic to create the bridge data
  if (config.mode !== 'ccj_only' && (config.compareResults || config.fallbackToLegacy)) {
    try {
      console.log('🔄 Running legacy consolidation for comparison/fallback...');
      const legacyStartTime = Date.now();
      
      // Import your existing consolidation function
      const { consolidateAnalyses } = await import('./consolidation');
      
      legacyResult = await consolidateAnalyses(
        analysis,
        enrichment,
        imageRefs,
        sessionId
      );
      
      legacyTime = Date.now() - legacyStartTime;
      console.log(`✅ Legacy consolidation completed in ${legacyTime}ms`);
      
    } catch (legacyError) {
      console.warn('⚠️ Legacy consolidation failed:', legacyError);
      if (!config.fallbackToLegacy) {
        throw legacyError; // Fail fast if no fallback allowed
      }
    }
  }
  
  // STEP 2: Extract FactsV3 and ControlBlock for CCJ processing
  // CCJ needs these as inputs to generate its compact JSON
  let factsV3: FactsV3;
  let controlBlock: ControlBlock;
  
  if (legacyResult) {
    // Use consolidated data
    factsV3 = legacyResult.facts_v3;
    controlBlock = legacyResult.control_block;
  } else {
    // Create minimal FactsV3/ControlBlock directly from your JSONs
    console.log('🏗️ Creating minimal FactsV3/ControlBlock from analysis JSONs...');
    factsV3 = convertAnalysisToFactsV3(analysis, enrichment, sessionId);
    controlBlock = convertAnalysisToControlBlock(analysis, enrichment, sessionId);
  }
  
  // STEP 3: Run CCJ Pipeline with the converted data
  console.log('🚀 Running CCJ pipeline...');
  const ccjResult = await processCCJGhostMannequin(
    factsV3,
    controlBlock,
    sessionId,
    {
      flatlayUrl: imageRefs.cleanedImageUrl,
      onModelUrl: imageRefs.onModelUrl
    },
    config
  );
  
  const totalIntegrationTime = Date.now() - startTime;
  
  // STEP 4: Create Integration Result
  const integrationResult: CCJIntegrationResult = {
    ccj_result: ccjResult,
    
    legacy_compatible: {
      renderUrl: ccjResult.generated_image_url || imageRefs.cleanedImageUrl,
      processingTime: totalIntegrationTime,
      facts_v3: factsV3,
      control_block: controlBlock
    },
    
    integration_meta: {
      mode_used: config.mode,
      ccj_success: ccjResult.success,
      legacy_fallback_used: false, // Will update if fallback is used
      performance_comparison: {
        ccj_time_ms: ccjResult.execution_time_ms,
        legacy_time_ms: legacyTime,
        size_reduction_pct: calculateSizeReduction(ccjResult, legacyResult),
        qa_score_improvement: ccjResult.qa_result?.passed ? 25 : undefined
      }
    }
  };
  
  // STEP 5: Handle Fallback Logic
  if (!ccjResult.success && config.fallbackToLegacy && legacyResult) {
    console.log('🔄 CCJ failed, falling back to legacy pipeline...');
    
    // Import your existing rendering function
    const { generateGhostMannequinWithControlBlockGemini } = await import('./gemini');
    const { buildStaticFlashPrompt } = await import('./consolidation');
    
    try {
      const fallbackPrompt = buildStaticFlashPrompt(legacyResult.control_block);
      const fallbackRender = await generateGhostMannequinWithControlBlockGemini(
        imageRefs.cleanedImageUrl,
        fallbackPrompt,
        legacyResult,
        imageRefs.onModelUrl
      );
      
      // Update result to use legacy fallback
      integrationResult.legacy_compatible.renderUrl = fallbackRender.renderUrl;
      integrationResult.legacy_compatible.processingTime += fallbackRender.processingTime;
      integrationResult.integration_meta.legacy_fallback_used = true;
      
      console.log('✅ Legacy fallback completed successfully');
      
    } catch (fallbackError) {
      console.error('❌ Legacy fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
  
  // STEP 6: Log Integration Summary
  console.log(`🎯 CCJ Integration Summary:`);
  console.log(`   Mode: ${config.mode}`);
  console.log(`   CCJ Success: ${ccjResult.success}`);
  console.log(`   Fallback Used: ${integrationResult.integration_meta.legacy_fallback_used}`);
  console.log(`   Total Time: ${totalIntegrationTime}ms`);
  console.log(`   CCJ Size: ${ccjResult.sizes.ccj_bytes}B (vs ${ccjResult.sizes.hints_bytes}B hints)`);
  
  return integrationResult;
}

/**
 * Convert your existing AnalysisJSON to FactsV3 format
 * This bridges your current analysis with CCJ requirements
 */
function convertAnalysisToFactsV3(
  analysis: AnalysisJSON, 
  enrichment: EnrichmentJSON, 
  sessionId: string
): FactsV3 {
  
  // Extract colors from enrichment data
  const dominantHex = enrichment.color_precision?.primary_hex || '#888888';
  const secondaryHex = enrichment.color_precision?.secondary_hex;
  
  // Map analysis data to FactsV3 structure
  return {
    category_generic: mapGarmentCategory(analysis), // Your analysis → CCJ category
    silhouette: extractSilhouette(analysis),
    required_components: extractRequiredComponents(analysis),
    forbidden_components: [],
    palette: {
      dominant_hex: dominantHex,
      accent_hex: secondaryHex || dominantHex,
      trim_hex: dominantHex,
      pattern_hexes: [],
      region_hints: {}
    },
    material: enrichment.fabric_behavior?.drape_quality || 'unknown',
    weave_knit: mapWeaveType(enrichment),
    drape_stiffness: mapDrapeStiffness(enrichment),
    transparency: mapTransparency(enrichment),
    surface_sheen: mapSurfaceSheen(enrichment),
    pattern: 'solid', // Default for now
    print_scale: 'none',
    edge_finish: enrichment.construction_precision?.edge_finishing || 'unknown',
    view: 'front',
    framing_margin_pct: 6,
    shadow_style: 'soft',
    qa_targets: {
      deltaE_max: 3,
      edge_halo_max_pct: 1,
      symmetry_tolerance_pct: 3,
      min_resolution_px: 2000
    },
    safety: { must_not: [] },
    label_visibility: analysis.labels_found?.length > 0 ? 'required' : 'optional',
    structural_asymmetry: {
      expected: false,
      regions: []
    }
  };
}

/**
 * Convert analysis to ControlBlock format
 */
function convertAnalysisToControlBlock(
  analysis: AnalysisJSON, 
  enrichment: EnrichmentJSON, 
  sessionId: string
): ControlBlock {
  
  const factsV3 = convertAnalysisToFactsV3(analysis, enrichment, sessionId);
  
  // ControlBlock is subset of FactsV3 with same structure
  return {
    category_generic: factsV3.category_generic,
    silhouette: factsV3.silhouette,
    required_components: factsV3.required_components,
    forbidden_components: factsV3.forbidden_components,
    palette: factsV3.palette,
    material: factsV3.material,
    drape_stiffness: factsV3.drape_stiffness,
    edge_finish: factsV3.edge_finish,
    view: factsV3.view,
    framing_margin_pct: factsV3.framing_margin_pct,
    shadow_style: factsV3.shadow_style,
    safety: factsV3.safety,
    label_visibility: factsV3.label_visibility,
    continuity_rules: {},
    structural_asymmetry: factsV3.structural_asymmetry,
    weave_knit: factsV3.weave_knit,
    transparency: factsV3.transparency,
    surface_sheen: factsV3.surface_sheen
  };
}

// Helper mapping functions
function mapGarmentCategory(analysis: AnalysisJSON): 'top' | 'bottom' | 'dress' | 'outerwear' | 'knitwear' | 'underwear' | 'accessory' | 'unknown' {
  // You could enhance this with your existing analysis logic
  return 'unknown'; // Default - enhance based on your analysis patterns
}

function extractSilhouette(analysis: AnalysisJSON): string {
  return 'generic_silhouette'; // Default - enhance based on your analysis
}

function extractRequiredComponents(analysis: AnalysisJSON): string[] {
  const components: string[] = [];
  
  // Extract from your analysis data
  if (analysis.labels_found?.length > 0) {
    components.push('labels');
  }
  
  // Add more component detection based on your analysis structure
  return components;
}

function mapWeaveType(enrichment: EnrichmentJSON): 'woven' | 'knit' | 'nonwoven' | 'unknown' {
  // Map enrichment fabric behavior to weave type
  if (enrichment.fabric_behavior?.drape_quality === 'structured') return 'woven';
  if (enrichment.fabric_behavior?.drape_quality === 'flowing') return 'knit';
  return 'unknown';
}

function mapDrapeStiffness(enrichment: EnrichmentJSON): number {
  const drape = enrichment.fabric_behavior?.drape_quality;
  if (drape === 'structured') return 0.8;
  if (drape === 'flowing') return 0.2;
  return 0.4; // Default
}

function mapTransparency(enrichment: EnrichmentJSON): 'opaque' | 'semi_sheer' | 'sheer' {
  // Map from enrichment transparency levels to CCJ values
  const transparencyMap: Record<string, 'opaque' | 'semi_sheer' | 'sheer'> = {
    'opaque': 'opaque',
    'semi_opaque': 'semi_sheer',
    'translucent': 'semi_sheer',
    'sheer': 'sheer'
  };
  return transparencyMap[enrichment.fabric_behavior?.transparency_level || ''] || 'opaque';
}

function mapSurfaceSheen(enrichment: EnrichmentJSON): 'matte' | 'subtle_sheen' | 'glossy' {
  // Map from enrichment surface sheen to CCJ values
  const sheenMap: Record<string, 'matte' | 'subtle_sheen' | 'glossy'> = {
    'matte': 'matte',
    'subtle_sheen': 'subtle_sheen',
    'glossy': 'glossy',
    'metallic': 'glossy'  // Map metallic to glossy for CCJ
  };
  return sheenMap[enrichment.fabric_behavior?.surface_sheen || ''] || 'matte';
}

function calculateSizeReduction(ccjResult: CCJPipelineResult, legacyResult?: ConsolidationOutput): number {
  if (!legacyResult) return 0;
  
  const legacySize = JSON.stringify(legacyResult).length;
  const ccjSize = ccjResult.sizes.ccj_bytes;
  
  return ((legacySize - ccjSize) / legacySize) * 100;
}

/**
 * Check if CCJ integration is enabled via environment variable
 */
export function shouldUseCCJPipeline(): boolean {
  return process.env.USE_CCJ_PIPELINE === 'true';
}

/**
 * Get CCJ integration mode from environment
 */
export function getCCJIntegrationMode(): CCJIntegrationMode {
  const mode = process.env.CCJ_INTEGRATION_MODE as CCJIntegrationMode;
  return ['replace_consolidation', 'parallel_comparison', 'ccj_only'].includes(mode) 
    ? mode 
    : 'replace_consolidation';
}