#!/usr/bin/env npx tsx

import { processGhostMannequinCCJ, buildCCJCore, buildCCJHints, consolidateToCCJ } from './lib/ghost/ccj-improved';
import path from 'path';

async function testCCJComplete() {
  try {
    console.log('🚀 Testing Complete CCJ Pipeline with Hemd');
    console.log('==========================================');
    
    // Sample facts based on hemd analysis
    const facts = {
      category_generic: 'shirt',
      silhouette: 'classic-collar-long-sleeve',
      pattern: 'solid',
      material: 'cotton',
      weave_knit: 'woven',
      drape_stiffness: 0.4,
      transparency: 'opaque',
      surface_sheen: 'matte',
      palette: {
        dominant_hex: '#2E5BBA',
        accent_hex: '#FFFFFF',
        pattern_hexes: []
      },
      color_precision: {
        primary_hex: '#2E5BBA',
        secondary_hex: '#FFFFFF',
        accuracy_score: 0.95
      },
      fabric_behavior: {
        drape_characteristic: 'structured',
        weight_class: 'medium',
        stretch_capability: 'none'
      },
      labels_found: [
        {
          text: 'HEMD BRAND',
          type: 'brand_label',
          preserve: true,
          priority: 'critical'
        }
      ],
      interior_analysis: {
        visible_regions: ['neckline', 'cuffs', 'hem'],
        edge_thickness_note: 'standard',
        lining_present: false,
        pattern_inside: false,
        texture_inside: 'cotton',
        visibility_confidence: 0.8
      },
      hollow_regions: {
        list: ['neckline', 'cuffs', 'hem'],
        depth_style: 'standard',
        must_render: true,
        shadow_policy: 'subtle',
        notes: 'Show interior hollows for ghost effect'
      },
      construction_details: {
        seams: 'visible',
        closures: 'button_placket',
        collar_neckline: 'classic_collar',
        pockets: 'none',
        special_features: 'button_cuffs'
      },
      visual_references: {
        primary: path.resolve('Input/hemd.jpg'),
        aux: []
      }
    };
    
    const sessionId = 'ccj-complete-test-' + Date.now();
    
    console.log('📸 Using image:', facts.visual_references.primary);
    console.log('🔑 API Key present:', !!process.env.GEMINI_API_KEY);
    
    // Generate CCJ Core and Hints
    console.log('\n📦 Generating CCJ Core and Hints...');
    const { core, hints } = consolidateToCCJ(facts, sessionId);
    
    console.log('📊 CCJ Core:');
    console.log(JSON.stringify(core, null, 2));
    
    console.log('\n📊 CCJ Hints:');
    console.log(JSON.stringify(hints, null, 2));
    
    console.log('\n📦 Running CCJ pipeline...');
    const imageBuffer = await processGhostMannequinCCJ(facts, sessionId);
    
    console.log('\n✅ CCJ Pipeline completed successfully!');
    console.log('📊 Image buffer size:', imageBuffer.length, 'bytes');
    
    // Save the result
    const fs = await import('fs');
    const timestamp = Date.now();
    const outputPath = `ccj-complete-result-${timestamp}.png`;
    const jsonPath = `ccj-complete-data-${timestamp}.json`;
    
    fs.writeFileSync(outputPath, imageBuffer);
    console.log('💾 Saved result to:', outputPath);
    
    // Save complete CCJ data
    const ccjData = {
      sessionId,
      timestamp: new Date().toISOString(),
      facts,
      ccjCore: core,
      ccjHints: hints,
      imageInfo: {
        size: imageBuffer.length,
        path: outputPath
      }
    };
    
    fs.writeFileSync(jsonPath, JSON.stringify(ccjData, null, 2));
    console.log('💾 Saved CCJ data to:', jsonPath);
    
    console.log('\n🎯 Summary:');
    console.log(`   • Image: ${outputPath}`);
    console.log(`   • JSON: ${jsonPath}`);
    console.log(`   • CCJ Core fields: ${Object.keys(core).length}`);
    console.log(`   • CCJ Hints fields: ${Object.keys(hints).length}`);
    
  } catch (error) {
    console.error('❌ CCJ test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

testCCJComplete();
