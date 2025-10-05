#!/usr/bin/env npx tsx

import { 
  generateCCJRender, 
  prepareImageForModeRender,
  type FactsV3, 
  type ControlBlock,
  type RenderType 
} from './lib/ghost/ccj-modes';
import { configureFalClient } from './lib/ghost/fal';
import path from 'path';
import fs from 'fs';

async function testAllModes() {
  console.log('🚀 Testing CCJ Mode-Aware Render Layer');
  console.log('=====================================');

  try {
    // Configure FAL client
    if (process.env.FAL_API_KEY) {
      configureFalClient(process.env.FAL_API_KEY);
      console.log('✅ FAL client configured');
    } else {
      console.warn('⚠️ FAL_API_KEY not found, will use data URL fallback');
    }

    const imagePath = path.resolve('Input/hemd.jpg');
    console.log('🔑 API Keys present:');
    console.log('   • Gemini:', !!process.env.GEMINI_API_KEY);
    console.log('   • FAL:', !!process.env.FAL_API_KEY);
    console.log('📸 Using image:', imagePath);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    // Sample facts for hemd shirt (consistent across modes)
    const facts: FactsV3 = {
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
      }
    };

    const control: ControlBlock = {
      must: ['pure_white_background', 'ghost_mannequin_effect', 'interior_hollows_visible'],
      ban: ['mannequins', 'humans', 'props', 'reflections', 'long_shadows']
    };

    // Prepare image for Files API
    console.log('\n📤 Preparing image for Files API...');
    const primaryFileUri = await prepareImageForModeRender(imagePath, 'mode-test');
    console.log('✅ Image prepared:', primaryFileUri.startsWith('https://') ? 'Files API URI' : 'Base64 fallback');

    // Test all render modes
    const modes: RenderType[] = ['ghost', 'flatlay', 'on_model'];
    const results = [];

    for (const mode of modes) {
      console.log(`\n🎨 Testing ${mode.toUpperCase()} mode...`);
      const modeStartTime = Date.now();
      const sessionId = `ccj-modes-${mode}-${Date.now()}`;

      try {
        const imageBuffer = await generateCCJRender(
          facts,
          control,
          primaryFileUri,
          [], // no aux refs for this test
          mode,
          sessionId,
          '4:5'
        );

        const modeDuration = Date.now() - modeStartTime;
        console.log(`✅ ${mode.toUpperCase()} mode completed in ${modeDuration}ms`);
        console.log(`   • Image size: ${imageBuffer.length.toLocaleString()} bytes`);

        // Save individual results
        const timestamp = Date.now();
        const outputPath = `ccj-modes-${mode}-${timestamp}.png`;
        fs.writeFileSync(outputPath, imageBuffer);

        results.push({
          mode,
          success: true,
          processingTime: modeDuration,
          imageSize: imageBuffer.length,
          outputPath,
          sessionId
        });

        console.log(`   • Saved to: ${outputPath}`);

      } catch (error: any) {
        const modeDuration = Date.now() - modeStartTime;
        console.error(`❌ ${mode.toUpperCase()} mode failed in ${modeDuration}ms:`, error.message);
        
        results.push({
          mode,
          success: false,
          processingTime: modeDuration,
          error: error.message,
          sessionId
        });
      }
    }

    // Summary
    const successfulModes = results.filter(r => r.success).length;
    const totalModes = modes.length;
    const averageTime = results.reduce((sum, r) => sum + r.processingTime, 0) / totalModes;

    console.log('\n📊 Mode Test Results Summary:');
    console.log('============================');
    console.log(`   • Total modes tested: ${totalModes}`);
    console.log(`   • Successful: ${successfulModes}`);
    console.log(`   • Failed: ${totalModes - successfulModes}`);
    console.log(`   • Success rate: ${(successfulModes / totalModes * 100).toFixed(0)}%`);
    console.log(`   • Average processing time: ${averageTime.toFixed(0)}ms`);

    console.log('\n✅ Successful Modes:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   • ${r.mode.toUpperCase()}: ${r.processingTime}ms, ${r.imageSize!.toLocaleString()} bytes`);
      console.log(`     Output: ${r.outputPath}`);
    });

    if (successfulModes < totalModes) {
      console.log('\n❌ Failed Modes:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   • ${r.mode.toUpperCase()}: ${r.processingTime}ms, Error: ${r.error}`);
      });
    }

    // Save comprehensive results
    const summaryFileName = `ccj-modes-test-summary-${Date.now()}.json`;
    fs.writeFileSync(summaryFileName, JSON.stringify({
      totalModes,
      successfulModes,
      failedModes: totalModes - successfulModes,
      successRate: `${(successfulModes / totalModes * 100).toFixed(0)}%`,
      averageProcessingTimeMs: averageTime,
      facts,
      control,
      results
    }, null, 2));

    console.log(`\n💾 Test summary saved to: ${summaryFileName}`);

    console.log('\n🎯 Final Summary:');
    console.log(`   • Mode-aware CCJ render layer tested: ${successfulModes}/${totalModes} modes successful`);
    console.log(`   • Average processing time: ${averageTime.toFixed(0)}ms`);
    console.log('   • All modes use the same FactsV3 + ControlBlock inputs');
    console.log('   • Mode-specific system prompts and render instructions applied');
    console.log('   • Files API optimization for 0 input tokens on images');

  } catch (error: any) {
    console.error('❌ Mode test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testAllModes();
