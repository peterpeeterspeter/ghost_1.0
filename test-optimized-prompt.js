/**
 * Test script to show the optimized prompt generation
 */

// Mock analysis and enrichment data (typical from your pipeline)
const mockAnalysis = {
  type: "garment_analysis",
  meta: { schema_version: "4.1", session_id: "test-123" },
  labels_found: [
    { text: "CALVIN KLEIN", preserve: true, type: "brand", location: "chest" },
    { text: "100% COTTON", preserve: true, type: "care", location: "inner_tag" }
  ],
  preserve_details: [
    { element: "front_button_placket", priority: "critical", notes: "Maintain button alignment" },
    { element: "collar_construction", priority: "important", notes: "Preserve collar shape" },
    { element: "sleeve_cuffs", priority: "critical", notes: "Keep cuff details visible" }
  ]
};

const mockEnrichment = {
  type: "garment_enrichment_focused",
  meta: { schema_version: "4.3", session_id: "test-123" },
  color_precision: {
    primary_hex: "#1E3A8A",
    secondary_hex: "#FFFFFF", 
    color_temperature: "cool",
    saturation_level: "high"
  },
  fabric_behavior: {
    drape_quality: "structured",
    surface_sheen: "subtle_sheen",
    transparency_level: "opaque"
  },
  construction_precision: {
    seam_visibility: "visible",
    edge_finishing: "topstitched",
    stitching_contrast: true
  },
  rendering_guidance: {
    lighting_preference: "soft_diffused",
    shadow_behavior: "medium_shadows",
    color_fidelity_priority: "critical"
  }
};

// Import the functions (we'll simulate them since we can't easily import)
function optimizeForFlash(analysis, enrichment) {
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
      type: "shirt",
      silhouette: "tailored",
      category: "top"
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
      regions: ["chest", "collar", "cuffs"]
    },
    rendering: {
      lighting: enrichment.rendering_guidance?.lighting_preference || 'soft_diffused',
      shadow_style: enrichment.rendering_guidance?.shadow_behavior || 'soft_shadows',
      color_fidelity: enrichment.rendering_guidance?.color_fidelity_priority || 'high'
    }
  };
}

function generateColorInstructions(visual) {
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

function generateMaterialInstructions(visual) {
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

function generateConstructionInstructions(construction) {
  let instructions = `• SEAM VISIBILITY: ${construction.seam_visibility} seams - maintain construction authenticity`;
  instructions += `\n• EDGE FINISHING: ${construction.edge_finishing} edges - preserve finishing details`;
  
  if (construction.hardware && construction.hardware.length > 0) {
    instructions += `\n• HARDWARE: Preserve exact placement and appearance of: ${construction.hardware.join(', ')}`;
  }
  
  return instructions;
}

function generatePreservationInstructions(preserve) {
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

function generateRenderingInstructions(rendering) {
  let instructions = `• LIGHTING: ${rendering.lighting} lighting setup`;
  instructions += `\n• SHADOWS: ${rendering.shadow_style} shadow treatment`;
  instructions += `\n• COLOR ACCURACY: ${rendering.color_fidelity} priority color matching`;
  
  // Add specific lighting guidance
  const lightingSetup = getLightingSetup(rendering.lighting);
  instructions += `\n• SETUP: ${lightingSetup}`;
  
  return instructions;
}

function getColorTemperature(hexColor) {
  // Convert hex to RGB
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'neutral';
  
  // Simple color temperature detection
  const { r, g, b } = rgb;
  if (r > g && r > b) return 'warm';
  if (b > r && b > g) return 'cool';
  return 'neutral';
}

function getDrapeGuidance(drapeQuality) {
  const drapeMap = {
    'structured': 'Maintains crisp edges and defined silhouette, minimal flowing',
    'fluid': 'Flows naturally with soft draping, follows gravity curves',
    'stiff': 'Rigid structure, maintains original shape when worn',
    'flowing': 'Graceful movement, emphasize natural fabric fall',
    'clingy': 'Follows body contours closely, emphasize fit',
    'loose': 'Relaxed fit with natural air gaps and volume'
  };
  
  return drapeMap[drapeQuality] || `${drapeQuality} draping behavior`;
}

function getLightingSetup(lightingType) {
  const lightingMap = {
    'soft_diffused': 'Large softbox setup, even illumination, minimal harsh shadows',
    'hard': 'Direct lighting, defined shadows, crisp edge definition',
    'rim': 'Backlighting emphasis, edge highlighting for dimension',
    'dramatic': 'High contrast lighting, pronounced shadows for depth',
    'flat': 'Even front lighting, minimal shadows, catalog style'
  };
  
  return lightingMap[lightingType] || `${lightingType} lighting configuration`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function generateOptimizedPrompt(optimizedJson) {
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

// Run the test
console.log("🎯 OPTIMIZED PROMPT GENERATION TEST\n");
console.log("📊 Input Data:");
console.log("Analysis Labels:", mockAnalysis.labels_found.map(l => l.text));
console.log("Critical Details:", mockAnalysis.preserve_details.filter(d => d.priority === 'critical').map(d => d.element));
console.log("Primary Color:", mockEnrichment.color_precision.primary_hex);
console.log("Drape Quality:", mockEnrichment.fabric_behavior.drape_quality);
console.log("\n" + "=".repeat(80) + "\n");

// Generate optimized JSON
const optimizedJson = optimizeForFlash(mockAnalysis, mockEnrichment);

// Generate the prompt
const optimizedPrompt = generateOptimizedPrompt(optimizedJson);

console.log("🚀 GENERATED OPTIMIZED PROMPT:\n");
console.log(optimizedPrompt);

console.log("\n" + "=".repeat(80));
console.log(`📏 Prompt Length: ${optimizedPrompt.length} characters`);
console.log(`📦 JSON Size: ${JSON.stringify(optimizedJson).length} bytes`);
console.log(`📈 Optimization: Structured data → ${Object.keys(optimizedJson).length} categories → Precise visual instructions`);