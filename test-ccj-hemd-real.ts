#!/usr/bin/env tsx

import { processCCJGhostMannequin } from './lib/ghost/ccj-pipeline';
import { FactsV3, ControlBlock } from './lib/ghost/consolidation';
import { configureGeminiClient } from './lib/ghost/gemini';
import { resolve } from 'path';

async function testCCJPipelineWithRealImages() {
  console.log('=== CCJ PIPELINE TEST WITH REAL IMAGES ===');
  
  // Configure Gemini client first
  console.log('🔧 Configuring Gemini client...');
  await configureGeminiClient();
  console.log('✅ Gemini client configured');
  
  // Sample facts and control block for hemd
  const sampleFacts: FactsV3 = {
    category_generic: "shirt",
    silhouette: "classic_fit",
    labels_found: {
      count: 2,
      primary_text: "EAT",
      locations: ["chest", "neck"],
      ocr_confidence: 0.95,
      is_critical: true
    },
    preserve_details: {
      elements: ["brand_label", "collar", "buttons"],
      brand_label_required: true,
      edge_finish_required: true,
      hardware_required: true,
      notes: "Preserve all visible details"
    },
    interior_analysis: {
      visible_regions: ["collar_interior", "cuff_interior"],
      edge_thickness_note: "Standard cotton construction",
      lining_present: false,
      pattern_inside: false,
      texture_inside: "cotton_weave",
      visibility_confidence: 0.8
    },
    hollow_regions: {
      list: ["neckline", "cuffs", "armpits"],
      depth_style: "natural_garment_volume",
      must_render: true,
      shadow_policy: "subtle_occlusion",
      notes: "Show natural garment drape"
    },
    construction_details: {
      seams: "flat_felled_seams",
      closures: "button_front_placket",
      collar_neckline: "classic_collar_with_stand",
      pockets: "none",
      special_features: "button_placket"
    },
    palette: {
      dominant_hex: "#FFFFFF",
      accent_hex: "#000000", 
      pattern_hexes: null,
      region_hints: ["white_body", "black_buttons"],
      temperature: "neutral",
      contrast_level: "high"
    }
  };

  const sampleControlBlock: ControlBlock = {
    must: [
      "pure_white_background",
      "ghost_mannequin_effect", 
      "interior_hollows_visible",
      "preserve_brand_label"
    ],
    ban: [
      "mannequins",
      "humans", 
      "props",
      "reflections",
      "long_shadows"
    ],
    label_keep_list: ["EAT"],
    label_legibility_min: 0.8
  };

  const sessionId = 'ccj-real-test-' + Date.now();
  
  // Use real image paths
  const images = {
    flatlayUrl: resolve('./Input/hemd.jpg'), // Real hemd image
    onModelUrl: undefined // No on-model image for this test
  };

  try {
    console.log('Starting CCJ pipeline with real images...');
    const result = await processCCJGhostMannequin(
      sampleFacts,
      sampleControlBlock, 
      sessionId,
      images
    );
    
    console.log('✅ CCJ Pipeline completed successfully!');
    console.log('Generated image URL:', result.generated_image_url);
    console.log('CCJ Package size:', result.ccj_package.sizes);
    console.log('QA Score:', result.qa_result?.passed ? 'PASSED' : 'FAILED');
    
    // Save result to file for comparison
    const fs = await import('fs');
    const resultFile = `ccj-real-result-${Date.now()}.json`;
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
    console.log(`💾 Result saved to: ${resultFile}`);
    
  } catch (error) {
    console.error('❌ CCJ Pipeline failed:', error);
  }
}

testCCJPipelineWithRealImages().catch(console.error);
