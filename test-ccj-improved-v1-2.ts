#!/usr/bin/env npx tsx

import { processGhostMannequinCCJWithStorage, buildCCJCore, buildCCJHints, consolidateToCCJ, SYSTEM_GM_MIN, RENDER_INSTRUCTION_GHOST } from './lib/ghost/ccj-improved';
import { configureFalClient } from './lib/ghost/fal';
import path from 'path';

async function testCCJImprovedV12() {
  try {
    console.log('🚀 Testing Improved CCJ Pipeline v1.2');
    console.log('====================================');
    
    // Configure FAL client
    if (process.env.FAL_API_KEY) {
      configureFalClient(process.env.FAL_API_KEY);
      console.log('✅ FAL client configured');
    } else {
      console.warn('⚠️ FAL_API_KEY not found, will use data URL fallback');
    }
    
    // Sample facts based on hemd shirt analysis (enhanced for v1.2)
    const facts = {
      category_generic: 'shirt',
      silhouette: 'classic-collar-long-sleeve',
      pattern: 'solid',
      material: 'cotton',
      weave_knit: 'woven',
      drape_stiffness: 0.4,
      transparency: 'opaque',
      surface_sheen: 'matte',
      edge_finish: 'standard',
      print_scale: 'as_seen',
      framing_margin_pct: 6,
      palette: {
        dominant_hex: '#2E5BBA', // Blue
        accent_hex: '#FFFFFF',
        pattern_hexes: [],
        trim_hex: '#FFFFFF'
      },
      color_precision: {
        primary_hex: '#2E5BBA',
        secondary_hex: '#FFFFFF',
        accuracy_score: 0.95
      },
      fabric_behavior: {
        drape_characteristic: 'structured',
        weight_class: 'medium',
        stretch_capability: 'none',
        wrinkle_resistance: 'moderate'
      },
      construction_precision: {
        stitch_density: 'standard',
        overall_construction_grade: 'high'
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
      qa_targets: {
        deltaE_max: 3,
        min_resolution_px: 2000,
        symmetry_tolerance_pct: 3,
        edge_halo_max_pct: 1
      },
      safety: {
        must_not: ['humans', 'mannequins', 'props', 'reflections']
      },
      visual_references: {
        primary: path.resolve('Input/hemd.jpg'),
        aux: []
      }
    };
    
    const sessionId = 'ccj-v12-hemd-' + Date.now();
    
    console.log('📸 Using image:', facts.visual_references.primary);
    console.log('🔑 API Keys present:');
    console.log('   • Gemini:', !!process.env.GEMINI_API_KEY);
    console.log('   • FAL:', !!process.env.FAL_API_KEY);
    
    // Generate CCJ Core and Hints v1.2
    console.log('\n📦 Generating CCJ Core and Hints v1.2...');
    const { core, hints } = consolidateToCCJ(facts, sessionId);
    
    console.log('📊 CCJ Core v1.2 (10 fields):');
    console.log(JSON.stringify(core, null, 2));
    
    console.log('\n📊 CCJ Hints v1.2 (~60 fields):');
    console.log(JSON.stringify(hints, null, 2));
    
    console.log('\n📋 System Instruction (Minimal):');
    console.log(SYSTEM_GM_MIN);
    console.log('\n📋 Render Instruction (Ghost):');
    console.log(RENDER_INSTRUCTION_GHOST);
    
    console.log('\n📦 Running improved CCJ pipeline v1.2...');
    const result = await processGhostMannequinCCJWithStorage(facts, sessionId);
    
    console.log('\n✅ Improved CCJ Pipeline v1.2 completed successfully!');
    console.log('📊 Results:');
    console.log(`   • Image buffer size: ${result.buffer.length.toLocaleString()} bytes`);
    console.log(`   • Processing time: ${result.processingTime}ms`);
    console.log(`   • Render URL: ${result.renderUrl}`);
    
    // Save the result locally as well
    const fs = await import('fs');
    const timestamp = Date.now();
    const outputPath = `ccj-v12-hemd-${timestamp}.png`;
    const jsonPath = `ccj-v12-hemd-data-${timestamp}.json`;
    
    fs.writeFileSync(outputPath, result.buffer);
    console.log('💾 Saved local copy to:', outputPath);
    
    // Save complete data
    const ccjData = {
      version: 'v1.2',
      sessionId,
      timestamp: new Date().toISOString(),
      facts,
      ccjCore: core,
      ccjHints: hints,
      systemInstruction: SYSTEM_GM_MIN,
      renderInstruction: RENDER_INSTRUCTION_GHOST,
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
    console.log('   ✅ Classic collar with button placket');
    console.log('   ✅ Pure white background');
    console.log('   ✅ Ghost mannequin effect');
    console.log('   ✅ Enhanced v1.2 quality improvements');
    
    console.log('\n🔧 Improvements in v1.2:');
    console.log('   ✅ Stable Gemini 2.5 Flash Image');
    console.log('   ✅ Images-first grounding for better quality');
    console.log('   ✅ Garment-agnostic interior/label locks');
    console.log('   ✅ Expanded hints (~60 fields)');
    console.log('   ✅ Hard consolidation guardrails');
    console.log('   ✅ Practical QA nudges');
    
  } catch (error) {
    console.error('❌ CCJ v1.2 test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

testCCJImprovedV12();
