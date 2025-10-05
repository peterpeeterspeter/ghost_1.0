#!/usr/bin/env node

/**
 * Batch Test - Process 10 copies of hemd.jpg
 * Tests the enhanced pipeline with interior surfaces, construction details, and brand labels
 */

import { processGhostMannequin } from './lib/ghost/pipeline.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { config } from 'dotenv';

// Load .env.local explicitly
config({ path: '.env.local' });

async function testBatchHemd() {
  console.log('🎭 Ghost Mannequin Pipeline - Batch Test (10x hemd.jpg)');
  console.log('='.repeat(70));
  
  // Check API keys
  const falApiKey = process.env.FAL_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!falApiKey || !geminiApiKey) {
    console.error('❌ Missing API keys in .env.local:');
    console.error('   FAL_API_KEY:', falApiKey ? '✅' : '❌');
    console.error('   GEMINI_API_KEY:', geminiApiKey ? '✅' : '❌');
    return;
  }

  console.log('✅ API Keys configured');
  console.log('🔧 Using enhanced pipeline with interior surfaces, construction details, and brand labels\n');

  // Use hemd.jpg from the Input folder
  const inputDir = join(process.cwd(), 'Input');
  const testImagePath = join(inputDir, 'hemd.jpg');
  
  if (!existsSync(testImagePath)) {
    console.error('❌ Test image not found:', testImagePath);
    return;
  }

  // Convert local image to base64
  const imageBuffer = readFileSync(testImagePath);
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  console.log(`📸 Processing: ${basename(testImagePath)} x10`);
  console.log(`📏 Image size: ${Math.round(imageBuffer.length / 1024)}KB\n`);

  const request = {
    flatlay: base64Image,
  };

  const options = {
    falApiKey,
    geminiApiKey,
    renderingModel: 'ai-studio',
    enableLogging: true,
    timeouts: {
      backgroundRemoval: 120000,  // 2 minutes
      analysis: 120000,           // 2 minutes
      enrichment: 120000,         // 2 minutes  
      consolidation: 60000,       // 1 minute
      rendering: 180000,          // 3 minutes
    }
  };

  const results = [];
  const startTime = Date.now();

  console.log('🚀 Starting Batch Pipeline...\n');
  console.log('Enhanced Pipeline Features:');
  console.log('  ✅ Interior surface rendering');
  console.log('  ✅ Construction details (seams, reinforcements)');
  console.log('  ✅ Brand label preservation');
  console.log('  ✅ Hollow regions (neckline, sleeves, openings)');
  console.log('  ✅ Compact JSON with actionable rules');
  console.log('  ✅ Files API optimization (~99% token reduction)\n');

  for (let i = 1; i <= 10; i++) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔄 BATCH ITEM ${i}/10`);
    console.log(`${'='.repeat(50)}`);
    
    try {
      const itemStartTime = Date.now();
      console.log(`⏱️  Starting item ${i} at ${new Date().toLocaleTimeString()}`);
      
      const result = await processGhostMannequin(request, options);
      const itemTime = Date.now() - itemStartTime;
      
      console.log(`✅ Item ${i} completed in ${(itemTime / 1000).toFixed(1)}s`);
      console.log(`📊 Status: ${result.status}`);
      
      if (result.status === 'completed') {
        console.log(`🖼️  Generated: ${result.renderUrl ? '✅' : '❌'}`);
        
        results.push({
          item: i,
          sessionId: result.sessionId,
          status: result.status,
          processingTime: itemTime,
          renderUrl: result.renderUrl,
          analysis: {
            labelsFound: result.analysis?.labels_found?.length || 0,
            preserveDetails: result.analysis?.preserve_details?.length || 0,
            interiorSurfaces: result.analysis?.interior_analysis?.length || 0
          },
          enrichment: {
            primaryColor: result.enrichment?.color_precision?.primary_hex || 'N/A',
            fabricType: result.enrichment?.fabric_behavior?.primary_fabric || 'N/A'
          }
        });
        
        console.log(`📝 Analysis: ${result.analysis?.labels_found?.length || 0} labels, ${result.analysis?.preserve_details?.length || 0} details`);
        console.log(`✨ Enrichment: ${result.enrichment?.color_precision?.primary_hex || 'N/A'}, ${result.enrichment?.fabric_behavior?.primary_fabric || 'N/A'}`);
        
      } else if (result.error) {
        console.log(`❌ Item ${i} failed: ${result.error.message}`);
        results.push({
          item: i,
          status: 'failed',
          error: result.error.message,
          processingTime: itemTime
        });
      }
      
    } catch (error) {
      console.error(`💥 Item ${i} failed with error:`, error.message);
      results.push({
        item: i,
        status: 'error',
        error: error.message,
        processingTime: Date.now() - startTime
      });
    }
    
    // Small delay between items to avoid rate limits
    if (i < 10) {
      console.log('⏸️  Waiting 2 seconds before next item...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalTime = Date.now() - startTime;
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 BATCH PROCESSING COMPLETE');
  console.log('='.repeat(70));
  console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`📈 Average Time per Item: ${(totalTime / 10 / 1000).toFixed(1)}s`);
  console.log(`✅ Successful: ${results.filter(r => r.status === 'completed').length}/10`);
  console.log(`❌ Failed: ${results.filter(r => r.status !== 'completed').length}/10`);

  // Performance analysis
  const successfulResults = results.filter(r => r.status === 'completed');
  if (successfulResults.length > 0) {
    const avgProcessingTime = successfulResults.reduce((sum, r) => sum + r.processingTime, 0) / successfulResults.length;
    const minTime = Math.min(...successfulResults.map(r => r.processingTime));
    const maxTime = Math.max(...successfulResults.map(r => r.processingTime));
    
    console.log('\n📊 Performance Metrics:');
    console.log(`   Average: ${(avgProcessingTime / 1000).toFixed(1)}s`);
    console.log(`   Fastest: ${(minTime / 1000).toFixed(1)}s`);
    console.log(`   Slowest: ${(maxTime / 1000).toFixed(1)}s`);
    
    console.log('\n🎯 Enhanced Features Summary:');
    const avgLabels = successfulResults.reduce((sum, r) => sum + (r.analysis?.labelsFound || 0), 0) / successfulResults.length;
    const avgDetails = successfulResults.reduce((sum, r) => sum + (r.analysis?.preserveDetails || 0), 0) / successfulResults.length;
    const avgInterior = successfulResults.reduce((sum, r) => sum + (r.analysis?.interiorSurfaces || 0), 0) / successfulResults.length;
    
    console.log(`   Average Labels Found: ${avgLabels.toFixed(1)}`);
    console.log(`   Average Details Preserved: ${avgDetails.toFixed(1)}`);
    console.log(`   Average Interior Surfaces: ${avgInterior.toFixed(1)}`);
  }

  // Save results
  const timestamp = Date.now();
  const resultPath = join(__dirname, `batch-hemd-results-${timestamp}.json`);
  writeFileSync(resultPath, JSON.stringify({
    batchInfo: {
      totalItems: 10,
      successful: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status !== 'completed').length,
      totalTime: totalTime,
      averageTime: totalTime / 10
    },
    results: results
  }, null, 2));
  
  console.log(`\n💾 Full results saved to: ${basename(resultPath)}`);
  
  // List all generated images
  console.log('\n🖼️  Generated Images:');
  successfulResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.renderUrl}`);
  });

  console.log('\n✨ Batch test completed!\n');
}

// Run the batch test
testBatchHemd()
  .then(() => console.log('🎉 All done!'))
  .catch(error => {
    console.error('\n💥 Batch test failed:', error.message);
    process.exit(1);
  });
