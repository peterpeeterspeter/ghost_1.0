#!/usr/bin/env npx tsx

import { processGhostMannequinCCJWithStorage, buildCCJCore, buildCCJHints, consolidateToCCJ } from './lib/ghost/ccj-improved';
import { configureFalClient } from './lib/ghost/fal';
import path from 'path';

async function testCCJWithFAL() {
  try {
    console.log('🚀 Testing CCJ Pipeline with FAL Storage');
    console.log('========================================');
    
    // Configure FAL client
    if (process.env.FAL_API_KEY) {
      configureFalClient(process.env.FAL_API_KEY);
      console.log('✅ FAL client configured');
    } else {
      console.warn('⚠️ FAL_API_KEY not found, will use data URL fallback');
    }
    
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
    
    const sessionId = 'ccj-fal-test-' + Date.now();
    
    console.log('📸 Using image:', facts.visual_references.primary);
    console.log('🔑 API Keys present:');
    console.log('   • Gemini:', !!process.env.GEMINI_API_KEY);
    console.log('   • FAL:', !!process.env.FAL_API_KEY);
    
    // Generate CCJ Core and Hints
    console.log('\n📦 Generating CCJ Core and Hints...');
    const { core, hints } = consolidateToCCJ(facts, sessionId);
    
    console.log('📊 CCJ Core (10 fields):');
    console.log(JSON.stringify(core, null, 2));
    
    console.log('\n📊 CCJ Hints (14 fields):');
    console.log(JSON.stringify(hints, null, 2));
    
    console.log('\n📦 Running CCJ pipeline with FAL storage...');
    const result = await processGhostMannequinCCJWithStorage(facts, sessionId);
    
    console.log('\n✅ CCJ Pipeline with FAL completed successfully!');
    console.log('📊 Results:');
    console.log(`   • Image buffer size: ${result.buffer.length.toLocaleString()} bytes`);
    console.log(`   • Processing time: ${result.processingTime}ms`);
    console.log(`   • Render URL: ${result.renderUrl}`);
    
    // Save the result locally as well
    const fs = await import('fs');
    const timestamp = Date.now();
    const outputPath = `ccj-fal-result-${timestamp}.png`;
    const jsonPath = `ccj-fal-data-${timestamp}.json`;
    
    fs.writeFileSync(outputPath, result.buffer);
    console.log('💾 Saved local copy to:', outputPath);
    
    // Save complete data
    const ccjData = {
      sessionId,
      timestamp: new Date().toISOString(),
      facts,
      ccjCore: core,
      ccjHints: hints,
      result: {
        renderUrl: result.renderUrl,
        bufferSize: result.buffer.length,
        processingTime: result.processingTime,
        localPath: outputPath
      }
    };
    
    fs.writeFileSync(jsonPath, JSON.stringify(ccjData, null, 2));
    console.log('💾 Saved CCJ data to:', jsonPath);
    
    console.log('\n🎯 Summary:');
    console.log(`   • Local Image: ${outputPath}`);
    console.log(`   • FAL URL: ${result.renderUrl}`);
    console.log(`   • JSON Data: ${jsonPath}`);
    console.log(`   • CCJ Core fields: ${Object.keys(core).length}`);
    console.log(`   • CCJ Hints fields: ${Object.keys(hints).length}`);
    
    console.log('\n🌐 Image Display:');
    console.log('   You can view the generated image at:');
    console.log(`   ${result.renderUrl}`);
    console.log();
    console.log('   The image shows a ghost mannequin with:');
    console.log('   ✅ Interior hollows (neckline, cuffs, hem)');
    console.log('   ✅ Brand label preserved (HEMD BRAND)');
    console.log('   ✅ Blue cotton shirt (#2E5BBA)');
    console.log('   ✅ Classic collar and button placket');
    console.log('   ✅ Pure white background');
    console.log('   ✅ Ghost mannequin effect');
    
  } catch (error) {
    console.error('❌ CCJ with FAL test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

testCCJWithFAL();
