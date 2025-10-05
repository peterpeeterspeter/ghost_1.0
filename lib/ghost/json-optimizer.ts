/**
 * Simple JSON Optimizer for Flash
 * 
 * Takes your existing AnalysisJSON + EnrichmentJSON and optimizes them
 * for direct consumption by Gemini Flash, similar to jsonprompt.it
 * 
 * This is MUCH simpler than the CCJ approach - just optimizes your existing data.
 */

import type { AnalysisJSON, EnrichmentJSON } from '@/types/ghost';

/**
 * LEGACY: Basic 18-field structure - TOO AGGRESSIVE for commercial use
 * Use CommercialOptimizedJSON instead for professional fashion photography
 */
export interface FlashOptimizedJSON {
  // Essential garment identification
  garment: {
    type: string;                    // From analysis
    silhouette: string;              // Extracted from analysis
    category: string;                // Derived category
  };
  
  // Critical visual properties
  visual: {
    primary_color: string;           // From enrichment.color_precision.primary_hex
    secondary_color?: string;        // From enrichment.color_precision.secondary_hex
    material_surface: string;        // From enrichment.fabric_behavior.surface_sheen
    transparency: string;            // From enrichment.fabric_behavior.transparency_level
    drape_quality: string;           // From enrichment.fabric_behavior.drape_quality
  };
  
  // Construction details that affect rendering
  construction: {
    seam_visibility: string;         // From enrichment.construction_precision
    edge_finishing: string;          // From enrichment.construction_precision
    hardware?: string[];             // Any hardware from analysis
  };
  
  // Critical preservation requirements
  preserve: {
    labels: string[];                // From analysis.labels_found (critical ones)
    details: string[];               // From analysis.preserve_details (critical priority)
    regions: string[];               // Important regions to maintain
  };
  
  // Rendering guidance
  rendering: {
    lighting: string;                // From enrichment.rendering_guidance.lighting_preference
    shadow_style: string;            // From enrichment.rendering_guidance.shadow_behavior
    color_fidelity: string;          // From enrichment.rendering_guidance.color_fidelity_priority
  };
}

/**
 * ENHANCED: Commercial-grade structure (35-45 fields)
 * Preserves essential commercial data while staying efficient
 * Designed for professional fashion e-commerce photography
 */
export interface CommercialOptimizedJSON {
  // Core garment identification (4 fields)
  garment: {
    type: string;
    silhouette: string;
    category: string;
    subcategory?: string;            // For fine-grained classification
  };
  
  // Enhanced color precision (8 fields)
  color_precision: {
    primary_hex: string;
    secondary_hex?: string;
    tertiary_hex?: string;           // Third color for complex palettes
    color_temperature: 'warm' | 'cool' | 'neutral';
    saturation_level: 'muted' | 'moderate' | 'vibrant';
    pattern_direction?: 'horizontal' | 'vertical' | 'diagonal' | 'random';
    pattern_scale?: 'micro' | 'small' | 'medium' | 'large';
    color_fidelity_priority: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Enhanced fabric & material (7 fields)
  fabric_behavior: {
    drape_quality: 'crisp' | 'flowing' | 'structured' | 'fluid' | 'stiff';
    surface_sheen: 'matte' | 'subtle_sheen' | 'glossy' | 'metallic';
    transparency_level: 'opaque' | 'semi_opaque' | 'translucent' | 'sheer';
    texture_depth?: 'flat' | 'subtle_texture' | 'pronounced_texture' | 'heavily_textured';
    material_type: string;           // Cotton, wool, polyester, etc.
    weave_structure?: string;        // Woven, knit, nonwoven
    drape_stiffness: number;         // 0-1 scale for physics simulation
  };
  
  // Commercial-critical labels (5-8 fields per label, up to 3 labels)
  critical_labels: Array<{
    type: 'brand' | 'size' | 'care' | 'composition' | 'origin' | 'price';
    text?: string;                   // OCR extracted text
    position: string;                // Location description
    visibility_required: boolean;    // Must be visible in final output
    ocr_confidence?: number;         // 0-1 confidence score
    preserve_priority: 'critical' | 'important' | 'nice_to_have';
    dimensions?: { width: number; height: number }; // Label size
    color_hex?: string;              // Label background color
  }>;
  
  // Essential construction details (6-8 fields)
  construction_precision: {
    seam_visibility: 'hidden' | 'subtle' | 'visible' | 'decorative';
    edge_finishing: 'raw' | 'serged' | 'bound' | 'rolled' | 'pinked';
    stitching_contrast: boolean;
    hardware_elements?: Array<{
      type: string;                  // Button, zipper, snap, etc.
      finish: 'matte_metal' | 'polished_metal' | 'plastic' | 'fabric_covered';
      placement: string;             // Location description
      visibility: 'hidden' | 'functional' | 'decorative';
    }>;
  };
  
  // Interior & hollow regions (4-6 fields)
  interior_construction: {
    neckline_interior_visible: boolean;
    interior_construction_type?: string;
    collar_construction?: string;
    lining_visible?: boolean;
    hollow_regions: Array<{
      region_type: 'neckline' | 'sleeves' | 'front_opening' | 'armholes' | 'other';
      keep_hollow: boolean;
      interior_description?: string;
    }>;
  };
  
  // Professional rendering controls (5 fields)
  rendering_guidance: {
    lighting_preference: 'soft_diffused' | 'directional' | 'high_key' | 'dramatic';
    shadow_behavior: 'minimal_shadows' | 'soft_shadows' | 'defined_shadows' | 'dramatic_shadows';
    texture_emphasis: 'minimize' | 'subtle' | 'enhance' | 'maximize';
    detail_sharpness: 'soft' | 'natural' | 'sharp' | 'ultra_sharp';
    background_style: 'pure_white' | 'soft_gradient' | 'textured';
  };
  
  // Quality & compliance (3 fields)
  quality_targets: {
    commercial_grade_required: boolean;
    brand_compliance_level: 'standard' | 'premium' | 'luxury';
    detail_preservation_priority: 'minimal' | 'standard' | 'maximum';
  };
}

// ============================================================================
// DEPRECATED: This entire optimization approach was unnecessary!
// The existing FactsV3 schema in consolidation.ts already preserves ALL
// commercial-critical data. Instead of creating redundant systems,
// enhance the existing buildDynamicFlashPrompt() to better leverage
// the rich FactsV3 data that's already being captured.
// ============================================================================

/**
 * DEPRECATED: Use existing FactsV3 + ControlBlock system instead
 * The consolidation.ts already preserves all commercial-critical data
 */
export function optimizeForCommercialFlash(
  analysis: AnalysisJSON,
  enrichment: EnrichmentJSON
): CommercialOptimizedJSON {
  
  // Extract enhanced color precision data (8 fields)
  const colorPrecision = {
    primary_hex: enrichment.color_precision?.primary_hex || '#888888',
    secondary_hex: enrichment.color_precision?.secondary_hex,
    tertiary_hex: extractTertiaryColor(analysis, enrichment),
    color_temperature: enrichment.color_precision?.color_temperature || 'neutral' as const,
    saturation_level: enrichment.color_precision?.saturation_level || 'moderate' as const,
    pattern_direction: enrichment.color_precision?.pattern_direction,
    pattern_scale: enrichment.color_precision?.pattern_repeat_size,
    color_fidelity_priority: enrichment.rendering_guidance?.color_fidelity_priority || 'high' as const
  };
  
  // Extract critical labels with full commercial context (preserve up to 3 most important)
  const criticalLabels = analysis.labels_found
    ?.filter(label => label.preserve || label.type === 'brand' || label.type === 'size')
    ?.slice(0, 3) // Limit to 3 most critical labels
    ?.map(label => ({
      type: label.type,
      text: label.text,
      position: label.location,
      visibility_required: label.preserve || label.type === 'brand',
      ocr_confidence: label.ocr_conf,
      preserve_priority: label.type === 'brand' ? 'critical' as const : 
                        label.type === 'size' ? 'important' as const : 
                        'nice_to_have' as const,
      dimensions: label.bbox_norm ? {
        width: Math.abs(label.bbox_norm[2] - label.bbox_norm[0]),
        height: Math.abs(label.bbox_norm[3] - label.bbox_norm[1])
      } : undefined,
      color_hex: label.color_hex
    })) || [];
  
  // Extract hardware elements with detailed specifications
  const hardwareElements = analysis.preserve_details
    ?.filter(detail => isHardwareElement(detail.element))
    ?.map(detail => ({
      type: extractHardwareType(detail.element),
      finish: enrichment.construction_precision?.hardware_finish || 'matte_metal' as const,
      placement: detail.location || 'unspecified',
      visibility: detail.priority === 'critical' ? 'decorative' as const : 'functional' as const
    })) || [];
  
  // Extract hollow regions with commercial importance
  const hollowRegions = analysis.hollow_regions?.map(region => ({
    region_type: region.region_type,
    keep_hollow: region.keep_hollow,
    interior_description: region.inner_description
  })) || [];
  
  return {
    // Core garment identification (4 fields)
    garment: {
      type: extractGarmentType(analysis),
      silhouette: extractSilhouette(analysis),
      category: extractCategory(analysis),
      subcategory: extractSubcategory(analysis)
    },
    
    // Enhanced color precision (8 fields)
    color_precision: colorPrecision,
    
    // Enhanced fabric & material (7 fields)
    fabric_behavior: {
      drape_quality: enrichment.fabric_behavior?.drape_quality || 'structured',
      surface_sheen: enrichment.fabric_behavior?.surface_sheen || 'matte',
      transparency_level: enrichment.fabric_behavior?.transparency_level || 'opaque',
      texture_depth: enrichment.fabric_behavior?.texture_depth,
      material_type: extractMaterialType(enrichment),
      weave_structure: mapWeaveStructure(enrichment.fabric_behavior?.drape_quality),
      drape_stiffness: mapDrapeStiffness(enrichment.fabric_behavior?.drape_quality)
    },
    
    // Commercial-critical labels (up to 3 labels with full context)
    critical_labels: criticalLabels,
    
    // Essential construction details (6-8 fields)
    construction_precision: {
      seam_visibility: enrichment.construction_precision?.seam_visibility || 'visible',
      edge_finishing: enrichment.construction_precision?.edge_finishing || 'serged',
      stitching_contrast: enrichment.construction_precision?.stitching_contrast || false,
      hardware_elements: hardwareElements.length > 0 ? hardwareElements : undefined
    },
    
    // Interior & hollow regions (4-6 fields)
    interior_construction: {
      neckline_interior_visible: hollowRegions.some(r => r.region_type === 'neckline' && r.keep_hollow),
      interior_construction_type: extractInteriorConstructionType(analysis),
      collar_construction: extractCollarConstruction(analysis),
      lining_visible: checkLiningVisibility(analysis),
      hollow_regions: hollowRegions
    },
    
    // Professional rendering controls (5 fields)
    rendering_guidance: {
      lighting_preference: enrichment.rendering_guidance?.lighting_preference || 'soft_diffused',
      shadow_behavior: enrichment.rendering_guidance?.shadow_behavior || 'soft_shadows',
      texture_emphasis: enrichment.rendering_guidance?.texture_emphasis || 'subtle',
      detail_sharpness: enrichment.rendering_guidance?.detail_sharpness || 'natural',
      background_style: 'pure_white' // Standard for ghost mannequin
    },
    
    // Quality & compliance (3 fields)
    quality_targets: {
      commercial_grade_required: true,
      brand_compliance_level: determineBrandCompliance(criticalLabels),
      detail_preservation_priority: determinePreservationPriority(analysis.preserve_details)
    }
  };
}

/**
 * LEGACY: Basic optimization (18 fields) - Use only for token-constrained scenarios
 * For commercial use, prefer optimizeForCommercialFlash() instead
 */
export function optimizeForFlash(
  analysis: AnalysisJSON,
  enrichment: EnrichmentJSON
): FlashOptimizedJSON {
  
  // Extract critical color information
  const primaryColor = enrichment.color_precision?.primary_hex || '#888888';
  const secondaryColor = enrichment.color_precision?.secondary_hex;
  
  // Extract critical labels (only preserve=true ones)
  const criticalLabels = analysis.labels_found
    ?.filter(label => label.preserve)
    ?.map(label => label.text || label.type)
    ?.filter(Boolean) || [];
  
  // Extract critical preservation details
  const criticalDetails = analysis.preserve_details
    ?.filter(detail => detail.priority === 'critical')
    ?.map(detail => detail.element)
    ?.filter(Boolean) || [];
  
  // Extract any hardware mentions
  const hardware = analysis.preserve_details
    ?.filter(detail => detail.element?.toLowerCase().includes('button') || 
                      detail.element?.toLowerCase().includes('zipper') ||
                      detail.element?.toLowerCase().includes('snap'))
    ?.map(detail => detail.element) || [];
  
  return {
    garment: {
      type: extractGarmentType(analysis),
      silhouette: extractSilhouette(analysis),
      category: extractCategory(analysis)
    },
    visual: {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      material_surface: enrichment.fabric_behavior?.surface_sheen || 'matte',
      transparency: enrichment.fabric_behavior?.transparency_level || 'opaque',
      drape_quality: enrichment.fabric_behavior?.drape_quality || 'structured'
    },
    construction: {
      seam_visibility: enrichment.construction_precision?.seam_visibility || 'visible',
      edge_finishing: enrichment.construction_precision?.edge_finishing || 'standard',
      hardware: hardware.length > 0 ? hardware : undefined
    },
    preserve: {
      labels: criticalLabels,
      details: criticalDetails,
      regions: extractImportantRegions(analysis)
    },
    rendering: {
      lighting: enrichment.rendering_guidance?.lighting_preference || 'soft_diffused',
      shadow_style: enrichment.rendering_guidance?.shadow_behavior || 'soft_shadows',
      color_fidelity: enrichment.rendering_guidance?.color_fidelity_priority || 'high'
    }
  };
}

/**
 * Generate OPTIMIZED prompt for Flash with structured JSON leverage
 * Optimized for visual truth, precision, and leveraging structured data
 */
export function generateFlashPrompt(optimizedJson: FlashOptimizedJSON): string {
  // Generate dynamic sections based on JSON data
  const colorInstructions = generateColorInstructions(optimizedJson.visual);
  const materialInstructions = generateMaterialInstructions(optimizedJson.visual);
  const preservationInstructions = generatePreservationInstructions(optimizedJson.preserve);
  const constructionInstructions = generateConstructionInstructions(optimizedJson.construction);
  const renderingInstructions = generateRenderingInstructions(optimizedJson.rendering);
  
  // Create structured, data-driven prompt
  return `TASK: Transform flatlay garment into professional ghost mannequin photo with invisible wearer effect.

=== VISUAL TRUTH CONSTRAINTS ===
${colorInstructions}
${materialInstructions}

=== CONSTRUCTION FIDELITY ===
${constructionInstructions}

=== CRITICAL PRESERVATION ===
${preservationInstructions}

=== RENDERING SPECIFICATIONS ===
${renderingInstructions}

=== STRUCTURED DATA ===
${JSON.stringify(optimizedJson, null, 0)}

=== IMAGE AUTHORITY ===
• Image B (flatlay): ABSOLUTE TRUTH for colors, textures, patterns, labels, construction details
• Image A (on-model): Reference ONLY for proportions, fit, draping - ignore colors/materials
• Any conflict: Image B wins

=== OUTPUT REQUIREMENTS ===
• 2048×2048 resolution
• Professional product photography
• Pure white background (#FFFFFF)
• Studio lighting matching rendering specifications
• Natural fabric draping consistent with material properties
• Invisible person effect - no body visible, garment maintains worn shape`;
}

/**
 * ENHANCED: Commercial-grade preparation with comprehensive data preservation
 */
export function prepareForCommercialFlash(
  analysis: AnalysisJSON,
  enrichment: EnrichmentJSON
): {
  commercial_json: CommercialOptimizedJSON;
  prompt: string;
  token_analysis: {
    original_analysis_bytes: number;
    original_enrichment_bytes: number;
    commercial_optimized_bytes: number;
    reduction_pct: number;
    estimated_tokens: number;
    token_efficiency_ratio: number; // Quality preserved per token
    commercial_features_preserved: number; // Out of 119 original fields
  };
} {
  
  const originalAnalysisSize = JSON.stringify(analysis).length;
  const originalEnrichmentSize = JSON.stringify(enrichment).length;
  const totalOriginalSize = originalAnalysisSize + originalEnrichmentSize;
  
  const commercialJson = optimizeForCommercialFlash(analysis, enrichment);
  const commercialSize = JSON.stringify(commercialJson).length;
  
  // Calculate field preservation (approximate field count in commercial structure)
  const commercialFieldCount = calculateCommercialFieldCount(commercialJson);
  const originalFieldCount = 119; // From your analysis
  
  const reductionPct = ((totalOriginalSize - commercialSize) / totalOriginalSize) * 100;
  const estimatedTokens = Math.ceil(commercialSize / 4); // ~4 characters per token
  const tokenEfficiencyRatio = commercialFieldCount / estimatedTokens;
  
  return {
    commercial_json: commercialJson,
    prompt: generateCommercialFlashPrompt(commercialJson),
    token_analysis: {
      original_analysis_bytes: originalAnalysisSize,
      original_enrichment_bytes: originalEnrichmentSize,
      commercial_optimized_bytes: commercialSize,
      reduction_pct: Math.round(reductionPct * 100) / 100,
      estimated_tokens: estimatedTokens,
      token_efficiency_ratio: Math.round(tokenEfficiencyRatio * 1000) / 1000,
      commercial_features_preserved: commercialFieldCount
    }
  };
}

/**
 * Generate professional commercial-grade prompt with enhanced data integration
 */
export function generateCommercialFlashPrompt(commercialJson: CommercialOptimizedJSON): string {
  // Generate enhanced sections based on commercial data
  const brandComplianceInstructions = generateBrandComplianceInstructions(commercialJson);
  const colorPrecisionInstructions = generateEnhancedColorInstructions(commercialJson.color_precision);
  const constructionInstructions = generateEnhancedConstructionInstructions(commercialJson.construction_precision);
  const interiorInstructions = generateInteriorInstructions(commercialJson.interior_construction);
  const labelPreservationInstructions = generateLabelPreservationInstructions(commercialJson.critical_labels);
  const fabricBehaviorInstructions = generateFabricBehaviorInstructions(commercialJson.fabric_behavior);
  const qualityComplianceInstructions = generateQualityComplianceInstructions(commercialJson.quality_targets);
  
  // Create comprehensive commercial-grade prompt
  return `COMMERCIAL GHOST MANNEQUIN GENERATION

=== BRAND & LEGAL COMPLIANCE ===
${brandComplianceInstructions}

=== CRITICAL LABEL PRESERVATION ===
${labelPreservationInstructions}

=== ENHANCED COLOR PRECISION ===
${colorPrecisionInstructions}

=== CONSTRUCTION FIDELITY ===
${constructionInstructions}

=== INTERIOR & HOLLOW REGION HANDLING ===
${interiorInstructions}

=== FABRIC BEHAVIOR & PHYSICS ===
${fabricBehaviorInstructions}

=== QUALITY & COMPLIANCE STANDARDS ===
${qualityComplianceInstructions}

=== COMMERCIAL DATA PAYLOAD ===
${JSON.stringify(commercialJson, null, 1)}

=== IMAGE AUTHORITY & FIDELITY ===
• PRIMARY IMAGE (Flatlay): ABSOLUTE TRUTH for all visual properties
  - Colors: Exact hex matching required (${commercialJson.color_precision.primary_hex})
  - Labels: All critical labels must be visible and readable
  - Construction: Precise seam, hardware, and edge detail reproduction
  - Patterns: Exact direction (${commercialJson.color_precision.pattern_direction || 'solid'}) and scale

• REFERENCE IMAGE (On-model): Proportions and draping guidance ONLY
  - Use ONLY for 3D shape understanding and fit reference
  - IGNORE all colors, textures, and surface details from this image
  - Any visual conflicts: Primary image wins

=== PROFESSIONAL OUTPUT REQUIREMENTS ===
• Resolution: 2048×2048 pixels minimum
• Background: Pure white (#FFFFFF) with soft studio lighting
• Commercial photography standards with ${commercialJson.quality_targets.brand_compliance_level} grade quality
• Ghost mannequin effect: Invisible wearer, natural garment shape retention
• Label visibility: All critical labels readable and positioned as in source
• Construction accuracy: Hardware, seams, and finishing details precisely reproduced
• Color fidelity: ${commercialJson.color_precision.color_fidelity_priority} priority color matching
• Material physics: Realistic draping with ${commercialJson.fabric_behavior.drape_quality} characteristics`;
}

/**
 * Calculate approximate field count in commercial JSON structure
 */
function calculateCommercialFieldCount(json: CommercialOptimizedJSON): number {
  let count = 0;
  
  // Core garment fields
  count += Object.keys(json.garment).length;
  
  // Color precision fields
  count += Object.keys(json.color_precision).filter(k => json.color_precision[k as keyof typeof json.color_precision] !== undefined).length;
  
  // Fabric behavior fields
  count += Object.keys(json.fabric_behavior).filter(k => json.fabric_behavior[k as keyof typeof json.fabric_behavior] !== undefined).length;
  
  // Critical labels (count each label's fields)
  count += json.critical_labels.length * 6; // Average 6 fields per label
  
  // Construction precision fields
  count += Object.keys(json.construction_precision).filter(k => json.construction_precision[k as keyof typeof json.construction_precision] !== undefined).length;
  if (json.construction_precision.hardware_elements) {
    count += json.construction_precision.hardware_elements.length * 4; // 4 fields per hardware element
  }
  
  // Interior construction fields
  count += Object.keys(json.interior_construction).filter(k => json.interior_construction[k as keyof typeof json.interior_construction] !== undefined).length;
  count += json.interior_construction.hollow_regions.length * 3; // 3 fields per hollow region
  
  // Rendering guidance fields
  count += Object.keys(json.rendering_guidance).length;
  
  // Quality targets fields
  count += Object.keys(json.quality_targets).length;
  
  return count;
}

/**
 * LEGACY: All-in-one function for basic optimization (18 fields)
 */
export function prepareForFlash(
  analysis: AnalysisJSON,
  enrichment: EnrichmentJSON
): {
  optimized_json: FlashOptimizedJSON;
  prompt: string;
  sizes: {
    original_analysis_bytes: number;
    original_enrichment_bytes: number;
    optimized_bytes: number;
    reduction_pct: number;
  };
} {
  
  const originalAnalysisSize = JSON.stringify(analysis).length;
  const originalEnrichmentSize = JSON.stringify(enrichment).length;
  const totalOriginalSize = originalAnalysisSize + originalEnrichmentSize;
  
  const optimizedJson = optimizeForFlash(analysis, enrichment);
  const optimizedSize = JSON.stringify(optimizedJson).length;
  
  const reductionPct = ((totalOriginalSize - optimizedSize) / totalOriginalSize) * 100;
  
  return {
    optimized_json: optimizedJson,
    prompt: generateFlashPrompt(optimizedJson),
    sizes: {
      original_analysis_bytes: originalAnalysisSize,
      original_enrichment_bytes: originalEnrichmentSize,
      optimized_bytes: optimizedSize,
      reduction_pct: Math.round(reductionPct * 100) / 100
    }
  };
}

/**
 * Direct Flash generation using optimized approach
 */
export async function generateWithOptimizedJSON(
  analysis: AnalysisJSON,
  enrichment: EnrichmentJSON,
  images: {
    flatlayUrl: string;      // B - truth image
    onModelUrl?: string;     // A - proportions only  
  },
  sessionId: string
): Promise<{
  success: boolean;
  generated_image_url?: string;
  optimization_info: {
    original_size_bytes: number;
    optimized_size_bytes: number;
    reduction_pct: number;
    prompt_length: number;
  };
  processing_time_ms: number;
  error?: string;
}> {
  
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Generating ghost mannequin with JSON optimization for session: ${sessionId}`);
    
    // Step 1: Optimize your JSONs
    const prepared = prepareForFlash(analysis, enrichment);
    
    console.log(`📊 Optimization results:`);
    console.log(`   Original: ${prepared.sizes.original_analysis_bytes + prepared.sizes.original_enrichment_bytes}B`);
    console.log(`   Optimized: ${prepared.sizes.optimized_bytes}B`);
    console.log(`   Reduction: ${prepared.sizes.reduction_pct}%`);
    console.log(`   Prompt: ${prepared.prompt.length} chars`);
    
    // Step 2: Send to Flash using your existing Gemini Flash integration
    const flashResult = await generateWithRealFlash(
      prepared.prompt,
      prepared.optimized_json,
      images,
      sessionId
    );
    
    const processingTime = Date.now() - startTime;
    
    if (flashResult.success) {
      console.log(`✅ Optimized JSON generation completed in ${processingTime}ms`);
      return {
        success: true,
        generated_image_url: flashResult.imageUrl,
        optimization_info: {
          original_size_bytes: prepared.sizes.original_analysis_bytes + prepared.sizes.original_enrichment_bytes,
          optimized_size_bytes: prepared.sizes.optimized_bytes,
          reduction_pct: prepared.sizes.reduction_pct,
          prompt_length: prepared.prompt.length
        },
        processing_time_ms: processingTime
      };
    } else {
      throw new Error(flashResult.error || 'Flash generation failed');
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Optimized JSON generation failed:', error);
    
    return {
      success: false,
      optimization_info: {
        original_size_bytes: JSON.stringify(analysis).length + JSON.stringify(enrichment).length,
        optimized_size_bytes: 0,
        reduction_pct: 0,
        prompt_length: 0
      },
      processing_time_ms: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// ENHANCED HELPER FUNCTIONS - Commercial Data Extraction
// ============================================================================

/**
 * Extract tertiary color from pattern or trim details
 */
function extractTertiaryColor(analysis: AnalysisJSON, enrichment: EnrichmentJSON): string | undefined {
  // Look for pattern colors or trim colors in analysis data
  const patternDetails = analysis.preserve_details?.find(d => 
    d.element?.toLowerCase().includes('pattern') || 
    d.element?.toLowerCase().includes('trim')
  );
  
  // Could also extract from color_hex fields in labels
  const labelColors = analysis.labels_found
    ?.map(l => l.color_hex)
    ?.filter(Boolean)
    ?.find(hex => 
      hex !== enrichment.color_precision?.primary_hex && 
      hex !== enrichment.color_precision?.secondary_hex
    );
    
  return labelColors || undefined;
}

/**
 * Check if a preserve detail element is hardware
 */
function isHardwareElement(element: string): boolean {
  const hardwareTerms = ['button', 'zipper', 'snap', 'buckle', 'clasp', 'hook', 'eye', 'rivet', 'stud', 'grommet'];
  return hardwareTerms.some(term => element?.toLowerCase().includes(term));
}

/**
 * Extract specific hardware type from element description
 */
function extractHardwareType(element: string): string {
  const lowerElement = element?.toLowerCase() || '';
  if (lowerElement.includes('button')) return 'button';
  if (lowerElement.includes('zipper')) return 'zipper';
  if (lowerElement.includes('snap')) return 'snap';
  if (lowerElement.includes('buckle')) return 'buckle';
  if (lowerElement.includes('hook')) return 'hook';
  return 'hardware';
}

/**
 * Extract material type from enrichment data
 */
function extractMaterialType(enrichment: EnrichmentJSON): string {
  // Could be enhanced to analyze fabric behavior patterns
  // For now, derive from drape characteristics
  const drapeQuality = enrichment.fabric_behavior?.drape_quality;
  
  if (drapeQuality === 'crisp') return 'cotton';
  if (drapeQuality === 'flowing') return 'silk';
  if (drapeQuality === 'structured') return 'wool';
  if (drapeQuality === 'fluid') return 'jersey';
  if (drapeQuality === 'stiff') return 'denim';
  
  return 'unknown';
}

/**
 * Map drape quality to weave structure
 */
function mapWeaveStructure(drapeQuality?: string): string | undefined {
  if (!drapeQuality) return undefined;
  
  if (['crisp', 'structured', 'stiff'].includes(drapeQuality)) return 'woven';
  if (['flowing', 'fluid'].includes(drapeQuality)) return 'knit';
  
  return undefined;
}

/**
 * Map drape quality to stiffness number (0-1 scale)
 */
function mapDrapeStiffness(drapeQuality?: string): number {
  if (!drapeQuality) return 0.4; // Default medium stiffness
  
  switch (drapeQuality) {
    case 'stiff': return 0.9;
    case 'crisp': return 0.7;
    case 'structured': return 0.6;
    case 'flowing': return 0.3;
    case 'fluid': return 0.1;
    default: return 0.4;
  }
}

/**
 * Extract subcategory for fine-grained classification
 */
function extractSubcategory(analysis: AnalysisJSON): string | undefined {
  // Look for specific garment indicators in preserve details
  const details = analysis.preserve_details?.map(d => d.element?.toLowerCase()).join(' ') || '';
  
  if (details.includes('collar')) return 'collared';
  if (details.includes('sleeve')) return 'sleeved';
  if (details.includes('button')) return 'button-up';
  if (details.includes('zip')) return 'zip-up';
  
  return undefined;
}

/**
 * Extract interior construction type
 */
function extractInteriorConstructionType(analysis: AnalysisJSON): string | undefined {
  const interiorDetails = analysis.preserve_details?.find(d => 
    d.element?.toLowerCase().includes('lining') ||
    d.element?.toLowerCase().includes('interior') ||
    d.element?.toLowerCase().includes('inside')
  );
  
  if (interiorDetails) {
    const element = interiorDetails.element?.toLowerCase() || '';
    if (element.includes('lined')) return 'fully_lined';
    if (element.includes('partial')) return 'partially_lined';
    if (element.includes('unlined')) return 'unlined';
    return 'constructed';
  }
  
  return undefined;
}

/**
 * Extract collar construction details
 */
function extractCollarConstruction(analysis: AnalysisJSON): string | undefined {
  const collarDetail = analysis.preserve_details?.find(d => 
    d.element?.toLowerCase().includes('collar')
  );
  
  if (collarDetail) {
    const element = collarDetail.element?.toLowerCase() || '';
    if (element.includes('pointed')) return 'pointed_collar';
    if (element.includes('round')) return 'rounded_collar';
    if (element.includes('band')) return 'band_collar';
    if (element.includes('mandarin')) return 'mandarin_collar';
    return 'standard_collar';
  }
  
  return undefined;
}

/**
 * Check if lining is visible
 */
function checkLiningVisibility(analysis: AnalysisJSON): boolean {
  return analysis.hollow_regions?.some(region => 
    region.inner_visible && region.inner_description?.includes('lining')
  ) || false;
}

/**
 * Determine brand compliance level based on labels
 */
function determineBrandCompliance(labels: Array<{type: string, preserve_priority: string}>): 'standard' | 'premium' | 'luxury' {
  const hasBrandLabel = labels.some(l => l.type === 'brand');
  const hasCriticalLabels = labels.some(l => l.preserve_priority === 'critical');
  const labelCount = labels.length;
  
  if (hasBrandLabel && hasCriticalLabels && labelCount >= 2) return 'luxury';
  if (hasBrandLabel && labelCount >= 1) return 'premium';
  return 'standard';
}

/**
 * Determine detail preservation priority level
 */
function determinePreservationPriority(preserveDetails?: Array<{priority: string}>): 'minimal' | 'standard' | 'maximum' {
  if (!preserveDetails || preserveDetails.length === 0) return 'minimal';
  
  const criticalCount = preserveDetails.filter(d => d.priority === 'critical').length;
  const totalCount = preserveDetails.length;
  
  if (criticalCount >= 3 || totalCount >= 8) return 'maximum';
  if (criticalCount >= 1 || totalCount >= 4) return 'standard';
  return 'minimal';
}

// ============================================================================
// LEGACY HELPER FUNCTIONS (kept for backward compatibility)
// ============================================================================

function extractGarmentType(analysis: AnalysisJSON): string {
  // Enhanced logic based on preserve details
  const details = analysis.preserve_details?.map(d => d.element?.toLowerCase()).join(' ') || '';
  
  if (details.includes('shirt') || details.includes('blouse')) return 'shirt';
  if (details.includes('dress')) return 'dress';
  if (details.includes('pants') || details.includes('trouser')) return 'pants';
  if (details.includes('jacket') || details.includes('coat')) return 'outerwear';
  if (details.includes('sweater') || details.includes('knit')) return 'knitwear';
  
  return 'garment';
}

function extractSilhouette(analysis: AnalysisJSON): string {
  // Enhanced silhouette detection
  const details = analysis.preserve_details?.map(d => d.element?.toLowerCase()).join(' ') || '';
  
  if (details.includes('fitted') || details.includes('slim')) return 'fitted';
  if (details.includes('loose') || details.includes('relaxed')) return 'relaxed';
  if (details.includes('oversized')) return 'oversized';
  if (details.includes('straight')) return 'straight';
  
  return 'regular';
}

// ============================================================================
// ENHANCED COMMERCIAL PROMPT GENERATORS
// ============================================================================

/**
 * Generate brand compliance instructions based on critical labels
 */
function generateBrandComplianceInstructions(json: CommercialOptimizedJSON): string {
  const complianceLevel = json.quality_targets.brand_compliance_level;
  const hasBrandLabels = json.critical_labels.some(l => l.type === 'brand');
  
  let instructions = `• COMPLIANCE LEVEL: ${complianceLevel.toUpperCase()} grade requirements\n`;
  
  if (hasBrandLabels) {
    instructions += `• BRAND LABEL PRESERVATION: Critical - must be visible and readable\n`;
    instructions += `• LEGAL COMPLIANCE: All brand elements must match source exactly\n`;
  }
  
  instructions += `• QUALITY STANDARD: Professional fashion photography standards\n`;
  instructions += `• DETAIL PRESERVATION: ${json.quality_targets.detail_preservation_priority} level detail retention`;
  
  return instructions;
}

/**
 * Generate enhanced color instructions with precision data
 */
function generateEnhancedColorInstructions(colorPrecision: CommercialOptimizedJSON['color_precision']): string {
  let instructions = `• PRIMARY COLOR: Exact match to ${colorPrecision.primary_hex} (${colorPrecision.color_temperature} temperature)\n`;
  
  if (colorPrecision.secondary_hex) {
    instructions += `• SECONDARY COLOR: Exact match to ${colorPrecision.secondary_hex}\n`;
  }
  
  if (colorPrecision.tertiary_hex) {
    instructions += `• TERTIARY/ACCENT COLOR: Exact match to ${colorPrecision.tertiary_hex}\n`;
  }
  
  instructions += `• SATURATION LEVEL: ${colorPrecision.saturation_level} intensity required\n`;
  instructions += `• COLOR FIDELITY: ${colorPrecision.color_fidelity_priority.toUpperCase()} priority matching\n`;
  
  if (colorPrecision.pattern_direction) {
    instructions += `• PATTERN DIRECTION: ${colorPrecision.pattern_direction} alignment\n`;
  }
  
  if (colorPrecision.pattern_scale) {
    instructions += `• PATTERN SCALE: ${colorPrecision.pattern_scale} sizing`;
  }
  
  return instructions;
}

/**
 * Generate label preservation instructions
 */
function generateLabelPreservationInstructions(labels: CommercialOptimizedJSON['critical_labels']): string {
  if (labels.length === 0) {
    return '• No critical labels to preserve';
  }
  
  let instructions = `• CRITICAL LABELS COUNT: ${labels.length} labels requiring preservation\n`;
  
  labels.forEach((label, index) => {
    instructions += `\n• LABEL ${index + 1}: ${label.type.toUpperCase()}\n`;
    if (label.text) instructions += `  - Text: "${label.text}"\n`;
    instructions += `  - Position: ${label.position}\n`;
    instructions += `  - Visibility Required: ${label.visibility_required ? 'YES' : 'NO'}\n`;
    instructions += `  - Priority: ${label.preserve_priority.toUpperCase()}`;
    if (label.ocr_confidence) {
      instructions += `\n  - OCR Confidence: ${Math.round(label.ocr_confidence * 100)}%`;
    }
  });
  
  return instructions;
}

/**
 * Generate enhanced construction instructions
 */
function generateEnhancedConstructionInstructions(construction: CommercialOptimizedJSON['construction_precision']): string {
  let instructions = `• SEAM VISIBILITY: ${construction.seam_visibility} seams throughout\n`;
  instructions += `• EDGE FINISHING: ${construction.edge_finishing} edge treatment\n`;
  instructions += `• STITCHING CONTRAST: ${construction.stitching_contrast ? 'Visible contrast stitching' : 'Matching thread color'}\n`;
  
  if (construction.hardware_elements && construction.hardware_elements.length > 0) {
    instructions += `\n• HARDWARE ELEMENTS (${construction.hardware_elements.length} items):\n`;
    construction.hardware_elements.forEach((hw, index) => {
      instructions += `  - ${hw.type}: ${hw.finish} finish, ${hw.placement} placement, ${hw.visibility} style\n`;
    });
  } else {
    instructions += `\n• HARDWARE: No hardware elements detected`;
  }
  
  return instructions;
}

/**
 * Generate interior construction instructions
 */
function generateInteriorInstructions(interior: CommercialOptimizedJSON['interior_construction']): string {
  let instructions = `• NECKLINE INTERIOR: ${interior.neckline_interior_visible ? 'Visible' : 'Hidden'}\n`;
  
  if (interior.interior_construction_type) {
    instructions += `• INTERIOR TYPE: ${interior.interior_construction_type}\n`;
  }
  
  if (interior.collar_construction) {
    instructions += `• COLLAR CONSTRUCTION: ${interior.collar_construction}\n`;
  }
  
  instructions += `• LINING VISIBLE: ${interior.lining_visible ? 'YES' : 'NO'}\n`;
  
  if (interior.hollow_regions.length > 0) {
    instructions += `\n• HOLLOW REGIONS (${interior.hollow_regions.length} areas):\n`;
    interior.hollow_regions.forEach(region => {
      instructions += `  - ${region.region_type}: ${region.keep_hollow ? 'Keep hollow' : 'Fill'}`;
      if (region.interior_description) {
        instructions += ` (${region.interior_description})`;
      }
      instructions += `\n`;
    });
  }
  
  return instructions;
}

/**
 * Generate fabric behavior instructions
 */
function generateFabricBehaviorInstructions(fabric: CommercialOptimizedJSON['fabric_behavior']): string {
  let instructions = `• DRAPE QUALITY: ${fabric.drape_quality} fabric behavior\n`;
  instructions += `• SURFACE SHEEN: ${fabric.surface_sheen} finish\n`;
  instructions += `• TRANSPARENCY: ${fabric.transparency_level} material\n`;
  instructions += `• MATERIAL TYPE: ${fabric.material_type}\n`;
  
  if (fabric.weave_structure) {
    instructions += `• WEAVE STRUCTURE: ${fabric.weave_structure}\n`;
  }
  
  instructions += `• DRAPE STIFFNESS: ${fabric.drape_stiffness} (0=fluid, 1=rigid)\n`;
  
  if (fabric.texture_depth) {
    instructions += `• TEXTURE DEPTH: ${fabric.texture_depth} surface detail`;
  }
  
  return instructions;
}

/**
 * Generate quality compliance instructions
 */
function generateQualityComplianceInstructions(quality: CommercialOptimizedJSON['quality_targets']): string {
  let instructions = `• COMMERCIAL GRADE: ${quality.commercial_grade_required ? 'REQUIRED' : 'Standard'}\n`;
  instructions += `• BRAND COMPLIANCE: ${quality.brand_compliance_level.toUpperCase()} level\n`;
  instructions += `• DETAIL PRESERVATION: ${quality.detail_preservation_priority.toUpperCase()} priority\n`;
  instructions += `• QUALITY ASSURANCE: Professional fashion photography standards\n`;
  instructions += `• OUTPUT VALIDATION: All critical elements must be preserved and visible`;
  
  return instructions;
}

// ============================================================================
// LEGACY OPTIMIZED PROMPT GENERATORS (kept for backward compatibility)
// ============================================================================

/**
 * Generate precise color instructions from structured visual data
 */
function generateColorInstructions(visual: FlashOptimizedJSON['visual']): string {
  let instructions = `• PRIMARY COLOR: Exact match to ${visual.primary_color} (critical fidelity)`;
  
  if (visual.secondary_color) {
    instructions += `\n• SECONDARY COLOR: Exact match to ${visual.secondary_color} (preserve contrast ratios)`;
  }
  
  // Add color temperature guidance
  const colorTemp = getColorTemperature(visual.primary_color);
  instructions += `\n• COLOR TEMPERATURE: ${colorTemp} - maintain consistent lighting temperature`;
  
  // Add color fidelity priority
  instructions += `\n• FIDELITY PRIORITY: Critical - any color deviation will be rejected`;
  
  return instructions;
}

/**
 * Generate material behavior instructions from fabric analysis
 */
function generateMaterialInstructions(visual: FlashOptimizedJSON['visual']): string {
  let instructions = `• SURFACE FINISH: ${visual.material_surface} surface - no artificial sheen changes`;
  
  // Add drape behavior
  const drapeGuidance = getDrapeGuidance(visual.drape_quality);
  instructions += `\n• DRAPE BEHAVIOR: ${drapeGuidance}`;
  
  // Add transparency handling
  if (visual.transparency !== 'opaque') {
    instructions += `\n• TRANSPARENCY: ${visual.transparency} - maintain light transmission properties`;
  }
  
  return instructions;
}

/**
 * Generate construction fidelity instructions
 */
function generateConstructionInstructions(construction: FlashOptimizedJSON['construction']): string {
  let instructions = `• SEAM VISIBILITY: ${construction.seam_visibility} seams - maintain construction authenticity`;
  instructions += `\n• EDGE FINISHING: ${construction.edge_finishing} edges - preserve finishing details`;
  
  if (construction.hardware && construction.hardware.length > 0) {
    instructions += `\n• HARDWARE: Preserve exact placement and appearance of: ${construction.hardware.join(', ')}`;
  }
  
  return instructions;
}

/**
 * Generate critical preservation instructions
 */
function generatePreservationInstructions(preserve: FlashOptimizedJSON['preserve']): string {
  let instructions = '';
  
  if (preserve.labels.length > 0) {
    instructions += `• LABELS: Maintain perfect legibility and placement of: ${preserve.labels.join(', ')}`;
  }
  
  if (preserve.details.length > 0) {
    if (instructions) instructions += '\n';
    instructions += `• CRITICAL DETAILS: Preserve exact appearance of: ${preserve.details.join(', ')}`;
  }
  
  if (preserve.regions.length > 0) {
    if (instructions) instructions += '\n';
    instructions += `• FOCUS REGIONS: Pay special attention to: ${preserve.regions.join(', ')}`;
  }
  
  return instructions || '• No critical preservation requirements detected';
}

/**
 * Generate rendering specification instructions
 */
function generateRenderingInstructions(rendering: FlashOptimizedJSON['rendering']): string {
  let instructions = `• LIGHTING: ${rendering.lighting} lighting setup`;
  instructions += `\n• SHADOWS: ${rendering.shadow_style} shadow treatment`;
  instructions += `\n• COLOR ACCURACY: ${rendering.color_fidelity} priority color matching`;
  
  // Add specific lighting guidance
  const lightingSetup = getLightingSetup(rendering.lighting);
  instructions += `\n• SETUP: ${lightingSetup}`;
  
  return instructions;
}

/**
 * Helper: Determine color temperature from hex value
 */
function getColorTemperature(hexColor: string): string {
  // Convert hex to RGB
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'neutral';
  
  // Simple color temperature detection
  const { r, g, b } = rgb;
  if (r > g && r > b) return 'warm';
  if (b > r && b > g) return 'cool';
  return 'neutral';
}

/**
 * Helper: Get drape behavior guidance
 */
function getDrapeGuidance(drapeQuality: string): string {
  const drapeMap: Record<string, string> = {
    'structured': 'Maintains crisp edges and defined silhouette, minimal flowing',
    'fluid': 'Flows naturally with soft draping, follows gravity curves',
    'stiff': 'Rigid structure, maintains original shape when worn',
    'flowing': 'Graceful movement, emphasize natural fabric fall',
    'clingy': 'Follows body contours closely, emphasize fit',
    'loose': 'Relaxed fit with natural air gaps and volume'
  };
  
  return drapeMap[drapeQuality] || `${drapeQuality} draping behavior`;
}

/**
 * Helper: Get lighting setup instructions
 */
function getLightingSetup(lightingType: string): string {
  const lightingMap: Record<string, string> = {
    'soft_diffused': 'Large softbox setup, even illumination, minimal harsh shadows',
    'hard': 'Direct lighting, defined shadows, crisp edge definition',
    'rim': 'Backlighting emphasis, edge highlighting for dimension',
    'dramatic': 'High contrast lighting, pronounced shadows for depth',
    'flat': 'Even front lighting, minimal shadows, catalog style'
  };
  
  return lightingMap[lightingType] || `${lightingType} lighting configuration`;
}

/**
 * Helper: Convert hex to RGB
 */
function hexToRgb(hex: string): {r: number, g: number, b: number} | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function extractCategory(analysis: AnalysisJSON): string {
  // Basic category detection - enhance with your logic
  return 'apparel';
}

function extractImportantRegions(analysis: AnalysisJSON): string[] {
  // Extract important regions from analysis
  return analysis.preserve_details
    ?.filter(detail => detail.priority === 'critical' || detail.priority === 'important')
    ?.map(detail => detail.location || 'unspecified')
    ?.filter(Boolean) || [];
}

// Real Flash generation using your existing Gemini Flash integration
async function generateWithRealFlash(
  prompt: string,
  optimizedJson: FlashOptimizedJSON,
  images: { flatlayUrl: string; onModelUrl?: string },
  sessionId: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  
  try {
    console.log('🎆 Calling Gemini Flash with optimized JSON...');
    console.log(`Prompt: ${prompt.substring(0, 200)}...`);
    console.log(`Optimized JSON: ${JSON.stringify(optimizedJson, null, 2).substring(0, 300)}...`);
    
    // Check which Flash integration to use based on your existing setup
    const renderingModel = process.env.RENDERING_MODEL || 'freepik-gemini';
    
    if (renderingModel === 'freepik-gemini') {
      // Use Freepik's Gemini Flash API
      const { generateImageWithFreepikGemini } = await import('./freepik');
      
      const result = await generateImageWithFreepikGemini(
        prompt,
        images.flatlayUrl,     // B - truth image
        images.onModelUrl      // A - proportions (optional)
      );
      
      return {
        success: true,
        imageUrl: result.imageBase64  // Freepik returns base64
      };
      
    } else {
      // Use direct Gemini Flash (your existing generateGhostMannequin function)
      const { generateGhostMannequin } = await import('./gemini');
      
      // Create a minimal analysis object for compatibility
      const minimalAnalysis = {
        type: "garment_analysis",
        meta: { schema_version: "4.1", session_id: sessionId },
        labels_found: optimizedJson.preserve.labels.map(label => ({
          text: label,
          preserve: true,
          type: 'brand',
          location: 'unknown'
        })),
        preserve_details: optimizedJson.preserve.details.map(detail => ({
          element: detail,
          priority: 'critical' as const,
          notes: 'From optimized JSON'
        }))
      };
      
      const result = await generateGhostMannequin(
        images.flatlayUrl,
        minimalAnalysis,
        images.onModelUrl
      );
      
      return {
        success: true,
        imageUrl: result.renderUrl
      };
    }
    
  } catch (error) {
    console.error('❌ Flash generation with optimized JSON failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Flash error'
    };
  }
}
