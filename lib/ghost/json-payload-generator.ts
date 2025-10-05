import type { FactsV3, ControlBlock } from './consolidation';
import { GhostPipelineError } from '@/types/ghost';

/**
 * JSON Schema Types for Flash Image Prompt Payload v1
 */
export interface FlashImagePromptPayload {
  type: "flash_image_prompt_payload_v1";
  meta: {
    schema_version: "1.0";
    session_id: string;
  };
  images: ImageReference[];
  prompt_block: {
    base_prompt: string;
    language?: string;
  };
  facts_v3: FlashFactsV3;
  control_block: FlashControlBlock;
  transport_guardrails?: {
    max_px?: number;
    max_mb?: number;
    jpeg_quality_hint?: number;
  };
}

export interface ImageReference {
  role: "detail_B" | "on_model_A";
  url: string;
  mime_type?: string;
}

export interface FlashFactsV3 {
  category_generic: "top" | "bottom" | "dress" | "outerwear" | "knitwear" | "underwear" | "accessory" | "unknown";
  silhouette: string;
  required_components: string[];
  forbidden_components: string[];
  palette: {
    dominant_hex: string;
    accent_hex?: string;
    trim_hex?: string;
    pattern_hexes?: string[];
    region_hints?: Record<string, string>;
  };
  material: string;
  weave_knit: "woven" | "knit" | "nonwoven" | "unknown";
  drape_stiffness: number;
  transparency: "opaque" | "semi_sheer" | "sheer" | "semi_opaque";
  surface_sheen: "matte" | "subtle_sheen" | "glossy" | "metallic";
  pattern: string;
  print_scale: string;
  edge_finish: string;
  view: "front" | "back" | "side";
  framing_margin_pct: number;
  shadow_style: "soft" | "medium" | "hard";
  qa_targets?: {
    deltaE_max?: number;
    edge_halo_max_pct?: number;
    symmetry_tolerance_pct?: number;
    min_resolution_px?: number;
  };
  safety: {
    must_not: string[];
  };
  notes: string;
  structural_asymmetry: {
    expected: boolean;
    regions: string[];
  };
  label_visibility: "required" | "optional";
  continuity_rules: Record<string, string>;
}

export interface FlashControlBlock {
  lighting_preference: "soft_diffused" | "directional" | "high_key" | "dramatic";
  shadow_behavior: "minimal_shadows" | "soft_shadows" | "defined_shadows" | "dramatic_shadows";
  detail_sharpness: "soft" | "natural" | "sharp" | "ultra_sharp";
  texture_emphasis: "minimize" | "subtle" | "enhance" | "maximize";
  color_fidelity_priority: "low" | "medium" | "high" | "critical";
  hollow_regions: {
    region_type: "neckline" | "sleeves" | "front_opening" | "armholes" | "other";
    keep_hollow: boolean;
    inner_visible: boolean;
    inner_description?: string;
  }[];
  label_rules: {
    preserve_all_readable: boolean;
    min_ocr_conf: number;
  };
}

/**
 * Generate structured ghost mannequin prompt using hierarchical format
 * This creates the working JSON structure that was successfully tested
 */
function generateStructuredGhostMannequinPrompt(
  facts: FlashFactsV3,
  control: FlashControlBlock
) {
  const fabricBehaviorExamples = getFabricBehaviorExamples(facts.material, facts.weave_knit, facts.drape_stiffness);
  
  return {
    "request": "Create a professional three-dimensional ghost mannequin photograph for e-commerce product display",
    "description": "transforming flat garment images into a dimensional presentation that shows how the clothing would appear when worn by an invisible person",
    "detailed_scene_narrative": {
      "setting": "high-end photography studio with perfect white cyclorama background and professional lighting equipment",
      "garment_presentation": "floats in three-dimensional space, filled with the volume and shape of an invisible human body",
      "fabric_behavior": "drapes naturally with realistic weight and movement, showing natural creases and folds exactly as clothing would appear on a person",
      "appearance": "maintains its authentic colors and patterns while displaying proper fit and dimensional form",
      "capture_method": "studio-quality photography equipment using an 85mm portrait lens with even, shadow-free lighting"
    },
    "visual_reference_hierarchy": {
      "primary_garment_details": "The provided garment image contains the absolute truth for all colors, patterns, textures, construction details, and material properties. Copy these elements with complete fidelity. Every button, stitch, pattern element, label, and detail must be preserved exactly as shown.",
      "dimensional_reference": "Use standard human proportions for creating the three-dimensional form, with realistic shoulder width, natural chest projection, gradual waist taper, and proper arm positioning with slight outward angle from the body."
    },
    "technical_specifications": {
      "color_and_pattern_fidelity": [
        `Primary color: ${facts.palette.dominant_hex} - extract and maintain exactly`,
        `Secondary colors: ${facts.palette.accent_hex || 'N/A'}, ${facts.palette.trim_hex || 'N/A'}`,
        "Maintain pattern integrity including scale, direction, and alignment",
        "Preserve color gradients, prints, and multi-colored elements",
        `Color temperature: ${getColorTemperature(facts.palette.dominant_hex)}`,
        `Surface sheen: ${facts.surface_sheen} finish throughout`
      ],
      "fabric_behavior_simulation": {
        "analysis": `Material: ${facts.material}, Weave: ${facts.weave_knit}, Drape stiffness: ${facts.drape_stiffness}`,
        "examples": fabricBehaviorExamples
      },
      "professional_lighting_setup": getLightingSetup(control.lighting_preference, control.shadow_behavior),
      "construction_detail_preservation": getConstructionDetails(facts, control)
    },
    "step_by_step_construction_process": {
      "step_1_establish_dimensional_framework": "Create an invisible three-dimensional form with natural human proportions - approximately 18-inch shoulder span, realistic chest depth, natural waist taper, and properly positioned arms. This serves as the invisible mannequin structure.",
      "step_2_map_garment_details": `Transfer all visual information from the source garment with absolute precision. Category: ${facts.category_generic}, Silhouette: ${facts.silhouette}. Every color, pattern piece, texture, and detail must match exactly. Required components: ${facts.required_components.join(', ')}`,
      "step_3_apply_natural_draping": `Implement realistic fabric physics for ${facts.material}: Add natural tension points at shoulders, Create realistic gathering based on ${facts.drape_stiffness} stiffness level, Show proper sleeve drape, Include natural creasing at flex points, Maintain fabric's ${facts.transparency} opacity`,
      "step_4_perfect_the_lighting": `Apply ${control.lighting_preference} lighting with ${control.shadow_behavior}: Eliminates all shadows on white background, Creates subtle dimensionality, Maintains true color representation, Enhances texture at ${control.texture_emphasis} level, Provides even coverage`,
      "step_5_refine_critical_details": getDetailRefinement(facts, control),
      "step_6_final_quality_check": "Verify the dimensional presentation shows: Natural garment shape as if worn, Proper proportions and fit, All original details preserved, Professional lighting and presentation, Clean white background, Sharp focus throughout"
    },
    "quality_validation_criteria": [
      "Perfect Detail Fidelity: Every element from the original garment preserved",
      "Dimensional Realism: Natural three-dimensional form without distortion",
      "Professional Lighting: Even, shadow-free illumination",
      `Color Accuracy: Exact matching to ${facts.palette.dominant_hex} and accent colors`,
      "Construction Integrity: All seams, closures, and details properly shown",
      "Commercial Quality: Ready for immediate e-commerce use"
    ],
    "critical_requirements": [
      `Maintain exact ${facts.category_generic} garment proportions`,
      "Preserve all text and labels without alteration",
      `Show natural ${facts.material} fabric behavior`,
      "Create believable dimensional form",
      "Ensure pure white background (#FFFFFF)",
      `Apply ${control.detail_sharpness} edge definition`,
      "Display interior elements where naturally visible"
    ],
    "garment_analysis_data": {
      "category": facts.category_generic,
      "material_properties": {
        "type": facts.material,
        "weave": facts.weave_knit,
        "drape_stiffness": facts.drape_stiffness,
        "transparency": facts.transparency,
        "surface_sheen": facts.surface_sheen
      },
      "color_palette": facts.palette,
      "construction_features": {
        "required_components": facts.required_components,
        "forbidden_components": facts.forbidden_components,
        "edge_finish": facts.edge_finish,
        "structural_asymmetry": facts.structural_asymmetry
      },
      "rendering_controls": {
        "lighting": control.lighting_preference,
        "shadows": control.shadow_behavior,
        "sharpness": control.detail_sharpness,
        "texture_emphasis": control.texture_emphasis,
        "hollow_regions": control.hollow_regions
      }
    },
    "additional_notes": "Flash 2.5 JSON payload with structured prompt data"
  };
}

/**
 * Helper function to generate fabric behavior examples based on material analysis
 */
function getFabricBehaviorExamples(material: string, weave: string, drapeStiffness: number): string[] {
  const examples = [];
  
  if (drapeStiffness <= 0.3) {
    examples.push("Lightweight fabrics: Flowing drape with soft folds");
    examples.push("Natural movement with gentle gathering");
  } else if (drapeStiffness <= 0.6) {
    examples.push("Medium-weight materials: Balanced structure with moderate drape");
    examples.push("Natural stretch and recovery visible in knits");
  } else {
    examples.push("Heavy/structured materials: Maintain shape with minimal droop");
    examples.push("Crisp edges and defined silhouette");
  }
  
  if (weave === 'knit') {
    examples.push("Knit behavior: Natural stretch and recovery visible");
  } else if (weave === 'woven') {
    examples.push("Woven structure: Stable grain lines with crisp edges");
  }
  
  examples.push(`${material}: Weighted drape with material-appropriate fold characteristics`);
  
  return examples;
}

/**
 * Helper function to generate lighting setup based on preferences
 */
function getLightingSetup(lightingPref: string, shadowBehavior: string): string[] {
  const setup = [
    "Primary key light from upper left at 45-degree angle",
    "Fill light from right to reduce shadows",
    "Background lights to ensure pure white backdrop",
    "Rim lighting to define edges and create separation"
  ];
  
  if (shadowBehavior === 'minimal_shadows') {
    setup.push("Minimize all shadows under garment");
    setup.push("Maximum fill light ratio for even illumination");
  } else if (shadowBehavior === 'soft_shadows') {
    setup.push("Gentle, diffused shadows for subtle dimension");
  } else if (shadowBehavior === 'defined_shadows') {
    setup.push("Clear shadow definition for enhanced dimensionality");
  }
  
  if (lightingPref === 'soft_diffused') {
    setup.push("Large, soft light sources for even coverage");
  } else if (lightingPref === 'directional') {
    setup.push("Controlled directional lighting with defined light source");
  }
  
  return setup;
}

/**
 * Helper function to generate construction details preservation
 */
function getConstructionDetails(facts: FlashFactsV3, control: FlashControlBlock): string[] {
  const details = [
    "Seam lines and stitching details",
    "Buttons, zippers, and hardware placement",
    "Collar shape and structure",
    "Cuff construction and details",
    "Hem finishing and length",
    "Pocket placement and style"
  ];
  
  if (facts.required_components.length > 0) {
    details.push(`Essential components: ${facts.required_components.join(', ')}`);
  }
  
  if (control.hollow_regions.length > 0) {
    const regions = control.hollow_regions.map(r => r.region_type).join(', ');
    details.push(`Hollow regions to preserve: ${regions}`);
  }
  
  if (facts.edge_finish !== 'unknown') {
    details.push(`Edge finishing: ${facts.edge_finish}`);
  }
  
  return details;
}

/**
 * Helper function to get color temperature description
 */
function getColorTemperature(hexColor: string): string {
  // Simple hue-based color temperature classification
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  if (r > g && r > b) {
    return 'warm';
  } else if (b > r && b > g) {
    return 'cool';
  } else {
    return 'neutral';
  }
}

/**
 * Helper function to get detail refinement instructions
 */
function getDetailRefinement(facts: FlashFactsV3, control: FlashControlBlock): string {
  const refinements = [];
  
  if (facts.label_visibility === 'required') {
    refinements.push('Brand labels and tags clearly visible');
  }
  
  refinements.push('Special construction features highlighted');
  refinements.push('Unique design elements preserved');
  
  if (control.hollow_regions.some(r => r.inner_visible)) {
    refinements.push('Interior details where visible (collar stands, facing, etc.)');
  }
  
  refinements.push('Any text or printed elements maintained');
  
  return refinements.join(', ');
}

/**
 * Generate JSON payload for Flash 2.5 Image generation
 */
export function generateFlashJsonPayload(
  facts: FactsV3,
  controlBlock: ControlBlock,
  sessionId: string,
  images: { flatlayUrl: string; onModelUrl?: string }
): FlashImagePromptPayload {
  try {
    console.log('🔧 Generating JSON payload for Flash 2.5...');
    
    // Build image references array
    const imageReferences: ImageReference[] = [
      {
        role: "detail_B",
        url: images.flatlayUrl,
        mime_type: determineMimeType(images.flatlayUrl)
      }
    ];
    
    // Add on-model image if provided
    if (images.onModelUrl) {
      imageReferences.unshift({
        role: "on_model_A", 
        url: images.onModelUrl,
        mime_type: determineMimeType(images.onModelUrl)
      });
    }
    
    // Transform FactsV3 to Flash format
    const flashFacts: FlashFactsV3 = {
      category_generic: mapCategoryGeneric(facts.category_generic),
      silhouette: facts.silhouette || "unknown silhouette",
      required_components: facts.required_components || [],
      forbidden_components: facts.forbidden_components || [],
      palette: {
        dominant_hex: facts.palette?.dominant_hex || "#CCCCCC",
        accent_hex: facts.palette?.accent_hex,
        trim_hex: facts.palette?.trim_hex,
        pattern_hexes: facts.palette?.pattern_hexes || [],
        region_hints: convertRegionHintsToStringRecord(facts.palette?.region_hints) || {}
      },
      material: facts.material || "unknown",
      weave_knit: mapWeaveKnit(facts.weave_knit),
      drape_stiffness: facts.drape_stiffness ?? 0.4,
      transparency: mapTransparency(facts.transparency),
      surface_sheen: mapSurfaceSheen(facts.surface_sheen),
      pattern: facts.pattern || "unknown",
      print_scale: facts.print_scale || "unknown",
      edge_finish: facts.edge_finish || "unknown",
      view: mapView(facts.view),
      framing_margin_pct: facts.framing_margin_pct ?? 6,
      shadow_style: mapShadowStyle(facts.shadow_style),
      qa_targets: facts.qa_targets,
      safety: {
        must_not: facts.safety?.must_not || ["no_nudity", "no_violence"]
      },
      notes: facts.notes || "",
      structural_asymmetry: facts.structural_asymmetry || { expected: false, regions: [] },
      label_visibility: mapLabelVisibility(facts.label_visibility),
      continuity_rules: facts.continuity_rules || {}
    };
    
    // Transform Control Block to Flash format
    const flashControl: FlashControlBlock = {
      lighting_preference: mapLightingPreference(controlBlock),
      shadow_behavior: mapShadowBehavior(controlBlock),
      detail_sharpness: mapDetailSharpness(controlBlock),
      texture_emphasis: mapTextureEmphasis(controlBlock),
      color_fidelity_priority: "critical", // Always critical for ghost mannequin
      hollow_regions: extractHollowRegions(controlBlock),
      label_rules: {
        preserve_all_readable: true,
        min_ocr_conf: 0.8
      }
    };
    
    // Generate structured ghost mannequin prompt (the working JSON structure)
    const structuredPrompt = generateStructuredGhostMannequinPrompt(flashFacts, flashControl);
    
    // Generate the expert AI prompt that interprets JSON
    const expertAIPrompt = `You are an expert AI image generation engine specializing in photorealistic, Amazon-compliant e-commerce apparel photography. Your sole function is to interpret the provided JSON object and render a single, flawless product image that strictly adheres to every specified parameter.

**Your directives are:**
1.  **Parse the JSON:** Analyze every field in the provided JSON schema. Each field is a direct command.
2.  **Ghost Mannequin Execution:** The \`effect: "ghost_mannequin"\` and \`form: "invisible_human_silhouette"\` mean you must render the garment as if worn by an invisible person, giving it shape and volume without showing any part of a mannequin or model.
3.  **Crucial View Angles:** Pay close attention to the \`view_angle\`.
    *   If \`"interior_neckline_shot"\` is specified, you must generate a view of the *inside back and shoulder area* of the garment, including the brand tag if requested. This shot is vital for post-production.
    *   For all other angles, maintain perfect consistency in lighting, color, and fabric texture.
4.  **Platform Compliance is Mandatory:** The \`TechnicalAndPlatformSpecs\` are non-negotiable.
    *   **Framing:** The garment MUST occupy the \`frame_fill_percentage\` of the total image area against the specified \`background\`.
    *   **Lighting:** The \`lighting\` must be soft and even, completely eliminating harsh shadows on the product and background.
        Even, symmetric illumination: two large soft sources at 45° left/right, equal power (1:1), gentle on-axis fill; no single-side key, no rim/split lighting; preserve micro-fold shading and texture; seamless white background with no gradient or vignette.
    *   **Negative Constraints:** You are forbidden from rendering any elements listed in \`negative_constraints\`.
5.  **Styling is Key:** The \`Styling\` category dictates the final look. A \`\"perfectly_fitted_no_bunching\"\` garment must be smooth and well-defined. Sleeve drape must be exactly as specified.

Your output must be a single, high-resolution, commercially ready image that looks like it was taken in a professional photo studio. Do not add any commentary.

**JSON SPECIFICATION:**\n${JSON.stringify(structuredPrompt, null, 2)}`;
    
    // Build complete payload
    const payload: FlashImagePromptPayload = {
      type: "flash_image_prompt_payload_v1",
      meta: {
        schema_version: "1.0",
        session_id: sessionId
      },
      images: imageReferences,
      prompt_block: {
        base_prompt: expertAIPrompt,
        language: "en"
      },
      facts_v3: flashFacts,
      control_block: flashControl,
      transport_guardrails: {
        max_px: 2048,
        max_mb: 8,
        jpeg_quality_hint: 86
      }
    };
    
    console.log(`✅ JSON payload generated successfully`);
    console.log(`📊 Payload size: ${JSON.stringify(payload).length} characters`);
    console.log(`🖼️ Images: ${imageReferences.length} references`);
    console.log(`📋 Template length: ${JSON.stringify(structuredPrompt, null, 2).length} characters`);
    
    return payload;
    
  } catch (error) {
    console.error('❌ JSON payload generation failed:', error);
    throw new GhostPipelineError(
      `Failed to generate JSON payload: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'JSON_PAYLOAD_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Helper function to convert region hints from Record<string, string[]> to Record<string, string>
 */
function convertRegionHintsToStringRecord(regionHints?: Record<string, string[]>): Record<string, string> {
  if (!regionHints) return {};
  
  const result: Record<string, string> = {};
  for (const [key, values] of Object.entries(regionHints)) {
    // Join array values with commas or take the first value
    result[key] = Array.isArray(values) ? values.join(', ') : String(values);
  }
  return result;
}

/**
 * Helper functions for data transformation
 */
function determineMimeType(url: string): string {
  if (url.includes('.png')) return 'image/png';
  if (url.includes('.webp')) return 'image/webp';
  if (url.includes('.jpg') || url.includes('.jpeg')) return 'image/jpeg';
  if (url.startsWith('data:image/')) {
    const mimeMatch = url.match(/data:(image\/[^;]+)/);
    return mimeMatch ? mimeMatch[1] : 'image/jpeg';
  }
  return 'image/jpeg'; // Default
}

function mapCategoryGeneric(category?: string): FlashFactsV3['category_generic'] {
  const categoryMap: Record<string, FlashFactsV3['category_generic']> = {
    'top': 'top',
    'bottom': 'bottom', 
    'dress': 'dress',
    'outerwear': 'outerwear',
    'knitwear': 'knitwear',
    'underwear': 'underwear',
    'accessory': 'accessory'
  };
  return categoryMap[category || ''] || 'unknown';
}

function mapWeaveKnit(weave?: string): FlashFactsV3['weave_knit'] {
  const weaveMap: Record<string, FlashFactsV3['weave_knit']> = {
    'woven': 'woven',
    'knit': 'knit',
    'nonwoven': 'nonwoven'
  };
  return weaveMap[weave || ''] || 'unknown';
}

function mapTransparency(transparency?: string): FlashFactsV3['transparency'] {
  const transparencyMap: Record<string, FlashFactsV3['transparency']> = {
    'opaque': 'opaque',
    'semi_sheer': 'semi_sheer', 
    'sheer': 'sheer',
    'semi_opaque': 'semi_opaque'
  };
  return transparencyMap[transparency || ''] || 'opaque';
}

function mapSurfaceSheen(sheen?: string): FlashFactsV3['surface_sheen'] {
  const sheenMap: Record<string, FlashFactsV3['surface_sheen']> = {
    'matte': 'matte',
    'subtle_sheen': 'subtle_sheen',
    'glossy': 'glossy',
    'metallic': 'metallic'
  };
  return sheenMap[sheen || ''] || 'matte';
}

function mapView(view?: string): FlashFactsV3['view'] {
  const viewMap: Record<string, FlashFactsV3['view']> = {
    'front': 'front',
    'back': 'back',
    'side': 'side'
  };
  return viewMap[view || ''] || 'front';
}

function mapShadowStyle(shadow?: string): FlashFactsV3['shadow_style'] {
  const shadowMap: Record<string, FlashFactsV3['shadow_style']> = {
    'soft': 'soft',
    'medium': 'medium', 
    'hard': 'hard'
  };
  return shadowMap[shadow || ''] || 'soft';
}

function mapLabelVisibility(visibility?: string): FlashFactsV3['label_visibility'] {
  return visibility === 'optional' ? 'optional' : 'required';
}

function mapLightingPreference(control: ControlBlock): FlashControlBlock['lighting_preference'] {
  // Map from control block data - add logic based on your control block structure
  return 'soft_diffused'; // Default for ghost mannequin
}

function mapShadowBehavior(control: ControlBlock): FlashControlBlock['shadow_behavior'] {
  const shadowStyle = control.shadow_style || 'soft';
  const behaviorMap: Record<string, FlashControlBlock['shadow_behavior']> = {
    'soft': 'soft_shadows',
    'medium': 'defined_shadows',
    'hard': 'dramatic_shadows'
  };
  return behaviorMap[shadowStyle] || 'soft_shadows';
}

function mapDetailSharpness(control: ControlBlock): FlashControlBlock['detail_sharpness'] {
  // Enhanced sharpness for ghost mannequin detail preservation
  return 'sharp';
}

function mapTextureEmphasis(control: ControlBlock): FlashControlBlock['texture_emphasis'] {
  // Enhance texture for better fabric representation
  return 'enhance';
}

function extractHollowRegions(control: ControlBlock): FlashControlBlock['hollow_regions'] {
  // Extract hollow regions from control block - this would need to be adapted
  // based on your actual control block structure
  return [
    {
      region_type: "neckline",
      keep_hollow: true,
      inner_visible: true,
      inner_description: "preserve inner edge details from detail image"
    },
    {
      region_type: "sleeves", 
      keep_hollow: true,
      inner_visible: false
    }
  ];
}