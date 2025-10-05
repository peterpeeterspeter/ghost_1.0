#!/usr/bin/env npx tsx

import { 
  generateCCJRender, 
  prepareImageForModeRender,
  buildCCJCore,
  buildHints,
  buildRenderInstruction,
  type FactsV3, 
  type ControlBlock,
  type RenderType 
} from './lib/ghost/ccj-modes';
import { configureFalClient, uploadImageToFalStorage } from './lib/ghost/fal';
import { configureFilesManager } from './lib/ghost/files-manager';
import path from 'path';
import fs from 'fs';

async function testAllModesEncinitas() {
  console.log('🚀 Testing CCJ Mode-Aware Render Layer - ENCINITAS T-SHIRT');
  console.log('========================================================');

  try {
    // Configure FAL client
    if (process.env.FAL_API_KEY) {
      configureFalClient(process.env.FAL_API_KEY);
      console.log('✅ FAL client configured');
    } else {
      console.warn('⚠️ FAL_API_KEY not found, will use data URL fallback');
    }

    const imagePath = path.resolve('Input/encinitas detail.JPG');
    console.log('🔑 API Keys present:');
    console.log('   • Gemini:', !!process.env.GEMINI_API_KEY);
    console.log('   • FAL:', !!process.env.FAL_API_KEY);
    console.log('📸 Using image:', imagePath);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    // Configure Files Manager for optimal token usage
    console.log('🔧 Configuring Files Manager...');
    configureFilesManager(process.env.GEMINI_API_KEY);
    console.log('✅ Files Manager configured - Files API ready for 0 token usage');

    // Sample facts for encinitas t-shirt (consistent across modes)
    const facts: FactsV3 = {
      category_generic: 't-shirt',
      silhouette: 'crew-neck-short-sleeve',
      pattern: 'solid',
      material: 'cotton',
      weave_knit: 'knit',
      drape_stiffness: 0.3,
      transparency: 'opaque',
      surface_sheen: 'matte',
      edge_finish: 'standard',
      print_scale: 'as_seen',
      framing_margin_pct: 6,
      palette: {
        dominant_hex: '#000000', // Black
        accent_hex: '#FFFFFF',
        pattern_hexes: [],
        trim_hex: '#000000'
      },
      color_precision: {
        primary_hex: '#000000',
        secondary_hex: '#FFFFFF',
        accuracy_score: 0.95
      },
      fabric_behavior: {
        drape_characteristic: 'soft',
        weight_class: 'light',
        stretch_capability: 'moderate',
        wrinkle_resistance: 'low'
      },
      construction_precision: {
        stitch_density: 'standard',
        overall_construction_grade: 'good'
      },
      labels_found: [
        {
          text: 'ENCINITAS',
          type: 'brand_label',
          preserve: true,
          priority: 'critical'
        }
      ],
      interior_analysis: {
        visible_regions: ['neckline', 'sleeves', 'hem'],
        edge_thickness_note: 'thin',
        lining_present: false,
        pattern_inside: false,
        texture_inside: 'cotton',
        visibility_confidence: 0.8
      },
      hollow_regions: {
        list: ['neckline', 'sleeves', 'hem'],
        depth_style: 'standard',
        must_render: true,
        shadow_policy: 'subtle',
        notes: 'Show interior hollows for ghost effect'
      },
      construction_details: {
        seams: 'visible',
        closures: 'none',
        collar_neckline: 'crew_neck',
        pockets: 'none',
        special_features: 'short_sleeves'
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
        primary: imagePath,
        aux: []
      }
    };

    const control: ControlBlock = {
      must: ['pure_white_background', 'ghost_mannequin_effect', 'interior_hollows_visible'],
      ban: ['mannequins', 'humans', 'props', 'reflections', 'long_shadows']
    };

    // Prepare image for Files API
    console.log('\n📤 Preparing image for Files API...');
    const primaryFileUri = await prepareImageForModeRender(imagePath, 'encinitas-test');
    console.log('✅ Image prepared:', primaryFileUri.startsWith('https://generativelanguage.googleapis.com') ? 'Files API URI (0 tokens)' : 'Base64 fallback');

    // Test all modes
    const modes: RenderType[] = ['ghost', 'flatlay', 'on_model', 'vton'];
    const results = [];
    const startTime = Date.now();

    for (const mode of modes) {
      console.log(`\n🎨 Testing ${mode.toUpperCase()} mode...`);
      const modeStartTime = Date.now();

      try {
        const imageBuffer = await generateCCJRender(
          facts,
          control,
          primaryFileUri,
          [], // no aux images
          mode,
          `encinitas-${mode}-${Date.now()}`,
          '4:5'
        );

        const processingTime = Date.now() - modeStartTime;
        console.log(`✅ ${mode.toUpperCase()} mode completed in ${processingTime}ms`);
        console.log(`   • Image size: ${imageBuffer.length.toLocaleString()} bytes`);

        // Save locally
        const timestamp = Date.now();
        const localPath = `ccj-encinitas-${mode}-${timestamp}.png`;
        fs.writeFileSync(localPath, imageBuffer);
        console.log(`   • Saved locally: ${localPath}`);

        // Upload to FAL storage
        console.log('Uploading generated image to FAL storage...');
        const imageDataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        const falUrl = await uploadImageToFalStorage(imageDataUrl);
        console.log(`   • FAL Storage URL: ${falUrl}`);

        results.push({
          mode,
          success: true,
          processingTime,
          imageSize: imageBuffer.length,
          localPath,
          falUrl
        });

      } catch (error: any) {
        const processingTime = Date.now() - modeStartTime;
        console.error(`❌ ${mode.toUpperCase()} mode failed in ${processingTime}ms:`, error.message);
        results.push({
          mode,
          success: false,
          processingTime,
          error: error.message
        });
      }
    }

    // Summary
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    console.log('\n📊 Mode Test Results Summary:');
    console.log('============================');
    console.log(`   • Total modes tested: ${results.length}`);
    console.log(`   • Successful: ${successful}`);
    console.log(`   • Failed: ${failed}`);
    console.log(`   • Success rate: ${(successful / results.length * 100).toFixed(0)}%`);
    console.log(`   • Total processing time: ${totalTime}ms`);

    if (successful > 0) {
      const avgTime = results.filter(r => r.success).reduce((sum, r) => sum + r.processingTime, 0) / successful;
      console.log(`   • Average processing time: ${avgTime.toFixed(0)}ms`);
    }

    console.log('\n✅ Successful Modes:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   • ${r.mode.toUpperCase()}: ${r.processingTime}ms, ${r.imageSize.toLocaleString()} bytes`);
      console.log(`     Local: ${r.localPath}`);
      console.log(`     FAL URL: ${r.falUrl}`);
    });

    if (failed > 0) {
      console.log('\n❌ Failed Modes:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   • ${r.mode.toUpperCase()}: ${r.processingTime}ms, Error: ${r.error}`);
      });
    }

    // Save test summary
    const summaryPath = `ccj-encinitas-modes-test-summary-${Date.now()}.json`;
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      imagePath,
      facts,
      control,
      results,
      totalTime,
      successful,
      failed,
      successRate: `${(successful / results.length * 100).toFixed(0)}%`
    }, null, 2));
    console.log(`\n💾 Test summary saved to: ${summaryPath}`);

    console.log('\n🎯 Final Summary:');
    console.log(`   • Encinitas t-shirt tested across ${results.length} modes`);
    console.log(`   • Success rate: ${successful}/${results.length} (${(successful / results.length * 100).toFixed(0)}%)`);
    console.log('   • All modes use the same FactsV3 + ControlBlock inputs');
    console.log('   • Mode-specific system prompts and render instructions applied');
    console.log('   • Files API optimization for 0 input tokens on images');
    console.log('   • FAL storage integration for permanent image URLs');

    console.log('\n🖼️ Generated Images:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   • ${r.mode.toUpperCase()}: ${r.falUrl}`);
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAllModesEncinitas();
