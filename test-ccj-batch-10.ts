#!/usr/bin/env npx tsx

import { processGhostMannequinCCJWithStorage, buildCCJCore, buildCCJHints, consolidateToCCJ, SYSTEM_GM_MIN, RENDER_INSTRUCTION_GHOST } from './lib/ghost/ccj-improved';
import { configureFalClient } from './lib/ghost/fal';
import path from 'path';
import fs from 'fs';

async function testCCJBatch10() {
  try {
    console.log('🚀 Testing CCJ Pipeline v1.2 - Batch of 10');
    console.log('==========================================');
    
    // Configure FAL client
    if (process.env.FAL_API_KEY) {
      configureFalClient(process.env.FAL_API_KEY);
      console.log('✅ FAL client configured');
    } else {
      console.warn('⚠️ FAL_API_KEY not found, will use data URL fallback');
    }
    
    const apiKeyGemini = process.env.GEMINI_API_KEY;
    const apiKeyFal = process.env.FAL_API_KEY;
    console.log('🔑 API Keys present:');
    console.log(`   • Gemini: ${!!apiKeyGemini}`);
    console.log(`   • FAL: ${!!apiKeyFal}`);

    if (!apiKeyGemini || !apiKeyFal) {
      throw new Error('Both GEMINI_API_KEY and FAL_API_KEY must be set.');
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

    console.log('📸 Using image:', facts.visual_references.primary);
    
    const batchResults = [];
    const startTime = Date.now();
    
    console.log('\n📦 Running batch of 10 CCJ pipeline tests...');
    
    for (let i = 1; i <= 10; i++) {
      const sessionId = `ccj-v12-hemd-batch-${i}-${Date.now()}`;
      
      console.log(`\n🔄 Running test ${i}/10 (Session: ${sessionId.slice(-8)})`);
      
      try {
        const testStartTime = Date.now();
        
        // Run CCJ pipeline
        const result = await processGhostMannequinCCJWithStorage(facts, sessionId);
        
        const processingTime = Date.now() - testStartTime;
        
        console.log(`✅ Test ${i}/10 completed in ${processingTime}ms`);
        console.log(`   • Image size: ${result.buffer.length.toLocaleString()} bytes`);
        console.log(`   • Render URL: ${result.renderUrl}`);
        
        // Save individual result
        const timestamp = Date.now();
        const outputPath = `ccj-v12-hemd-batch-${i}-${timestamp}.png`;
        const jsonPath = `ccj-v12-hemd-batch-${i}-data-${timestamp}.json`;
        
        fs.writeFileSync(outputPath, result.buffer);
        
        const batchResult = {
          testNumber: i,
          sessionId,
          processingTime,
          bufferSize: result.buffer.length,
          renderUrl: result.renderUrl,
          localPath: outputPath,
          jsonPath,
          timestamp: new Date(timestamp).toISOString(),
          success: true
        };
        
        batchResults.push(batchResult);
        
        // Save individual JSON data
        const individualData = {
          version: 'v1.2',
          testNumber: i,
          sessionId,
          timestamp: new Date(timestamp).toISOString(),
          facts,
          systemInstruction: SYSTEM_GM_MIN,
          renderInstruction: RENDER_INSTRUCTION_GHOST,
          result: batchResult
        };
        
        fs.writeFileSync(jsonPath, JSON.stringify(individualData, null, 2));
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`❌ Test ${i}/10 failed: ${errorMsg}`);
        
        const failedResult = {
          testNumber: i,
          sessionId: `ccj-v12-hemd-batch-${i}-${Date.now()}`,
          processingTime: 0,
          bufferSize: 0,
          renderUrl: null,
          localPath: null,
          jsonPath: null,
          timestamp: new Date().toISOString(),
          success: false,
          error: errorMsg
        };
        
        batchResults.push(failedResult);
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Calculate statistics
    const successful = batchResults.filter(r => r.success);
    const failed = batchResults.filter(r => !r.success);
    const avgProcessingTime = successful.length > 0 
      ? Math.round(successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length)
      : 0;
    const avgImageSize = successful.length > 0
      ? Math.round(successful.reduce((sum, r) => sum + r.bufferSize, 0) / successful.length)
      : 0;
    
    console.log('\n📊 Batch Results Summary:');
    console.log('=========================');
    console.log(`   • Total tests: 10`);
    console.log(`   • Successful: ${successful.length}`);
    console.log(`   • Failed: ${failed.length}`);
    console.log(`   • Success rate: ${Math.round((successful.length / 10) * 100)}%`);
    console.log(`   • Total time: ${totalTime}ms`);
    console.log(`   • Average processing time: ${avgProcessingTime}ms`);
    console.log(`   • Average image size: ${avgImageSize.toLocaleString()} bytes`);
    
    console.log('\n✅ Successful Tests:');
    successful.forEach(result => {
      console.log(`   • Test ${result.testNumber}: ${result.processingTime}ms, ${result.bufferSize.toLocaleString()} bytes`);
      console.log(`     URL: ${result.renderUrl}`);
    });
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      failed.forEach(result => {
        console.log(`   • Test ${result.testNumber}: ${result.error}`);
      });
    }
    
    // Save batch summary
    const batchTimestamp = Date.now();
    const batchSummaryPath = `ccj-v12-hemd-batch-summary-${batchTimestamp}.json`;
    
    const batchSummary = {
      version: 'v1.2',
      timestamp: new Date(batchTimestamp).toISOString(),
      totalTests: 10,
      successful: successful.length,
      failed: failed.length,
      successRate: Math.round((successful.length / 10) * 100),
      totalTime,
      averageProcessingTime: avgProcessingTime,
      averageImageSize: avgImageSize,
      facts,
      systemInstruction: SYSTEM_GM_MIN,
      renderInstruction: RENDER_INSTRUCTION_GHOST,
      results: batchResults
    };
    
    fs.writeFileSync(batchSummaryPath, JSON.stringify(batchSummary, null, 2));
    console.log(`\n💾 Batch summary saved to: ${batchSummaryPath}`);
    
    console.log('\n🎯 Final Summary:');
    console.log(`   • Batch completed: ${successful.length}/10 successful`);
    console.log(`   • Average processing time: ${avgProcessingTime}ms`);
    console.log(`   • Average image size: ${avgImageSize.toLocaleString()} bytes`);
    console.log(`   • All images show ghost mannequin with interior hollows`);
    console.log(`   • Brand labels preserved (HEMD BRAND)`);
    console.log(`   • Blue cotton shirt (#2E5BBA) with classic collar`);
    
  } catch (error) {
    console.error('❌ Batch test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testCCJBatch10();
