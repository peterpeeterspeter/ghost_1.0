import { join } from 'path';
import { config } from 'dotenv';
import { processGhostMannequin } from './lib/ghost/pipeline';
import { GhostRequest } from './types/ghost';
import { readFileSync, writeFileSync } from 'fs';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

async function runBatchFlatlayTests() {
  console.log('🎨 BATCH FLATLAY ENHANCEMENT TESTS - 6 GARMENTS');
  console.log('============================================================');

  const falApiKey = process.env.FAL_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!falApiKey || !geminiApiKey) {
    console.error('❌ Missing API keys in .env.local');
    return;
  }

  console.log('✅ API Keys configured');
  console.log('🔧 Using Gemini 2.5 Flash Lite Preview for processing');
  console.log('🎨 Using AI Studio for flatlay enhancement');
  console.log('');

  // Select 6 different garments for testing
  const testImages = [
    'hemd.jpg',                    // Shirt - already tested
    'eat trui.jpg',               // Sweater
    'singlet Detail.jpg',         // Tank top/singlet
    'wide detail.JPG',            // Wide garment
    'eat peter trui.JPG',         // Another sweater variant
    'encinitas detail.JPG'        // Different garment type
  ];

  const results = [];

  for (let i = 0; i < testImages.length; i++) {
    const imageName = testImages[i];
    console.log(`\n🔄 TEST ${i + 1}/6: ${imageName}`);
    console.log('============================================================');

    try {
      const testImagePath = join(process.cwd(), 'Input', imageName);
      const imageBuffer = readFileSync(testImagePath);
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      console.log(`📏 Image size: ${Math.round(imageBuffer.length / 1024)}KB`);
      console.log('🚀 Starting Pipeline...');

      const request: GhostRequest = {
        flatlay: base64Image,
        options: {
          preserveLabels: true,
          outputSize: '2048x2048',
          backgroundColor: 'white',
        },
      };

      const startTime = Date.now();
      const result = await processGhostMannequin(request, {
        geminiApiKey,
        falApiKey,
        renderingModel: 'ai-studio',
        outputType: 'flatlay',
        enableLogging: false, // Reduce noise for batch processing
        timeouts: {
          backgroundRemoval: 120000,
          analysis: 60000,
          enrichment: 60000,
          consolidation: 60000,
          rendering: 180000,
        }
      });

      const totalTime = Date.now() - startTime;

      console.log(`✅ TEST ${i + 1} COMPLETED in ${(totalTime / 1000).toFixed(1)}s`);
      console.log(`🖼️  Cleaned Image: ${result.cleanedImageUrl ? '✅' : '❌'}`);
      console.log(`🎨 Enhanced Flatlay: ${result.renderUrl ? '✅' : '❌'}`);
      
      if (result.renderUrl) {
        console.log(`🔗 Flatlay URL: ${result.renderUrl}`);
      }

      if (result.analysis) {
        console.log(`📊 Analysis: ${result.analysis.labels_found?.length || 0} labels, ${result.analysis.preserve_details?.length || 0} details`);
      }

      results.push({
        testNumber: i + 1,
        imageName,
        success: result.status === 'completed',
        processingTime: totalTime,
        cleanedImageUrl: result.cleanedImageUrl,
        flatlayUrl: result.renderUrl,
        analysisLabels: result.analysis?.labels_found?.length || 0,
        analysisDetails: result.analysis?.preserve_details?.length || 0,
        sessionId: result.sessionId,
        error: null
      });

    } catch (error: any) {
      console.log(`❌ TEST ${i + 1} FAILED: ${error.message}`);
      
      results.push({
        testNumber: i + 1,
        imageName,
        success: false,
        processingTime: 0,
        cleanedImageUrl: null,
        flatlayUrl: null,
        analysisLabels: 0,
        analysisDetails: 0,
        sessionId: null,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n============================================================');
  console.log('📊 BATCH TEST SUMMARY');
  console.log('============================================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/6`);
  console.log(`❌ Failed: ${failed.length}/6`);
  
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length;
    console.log(`⏱️  Average processing time: ${(avgTime / 1000).toFixed(1)}s`);
  }

  console.log('\n📋 DETAILED RESULTS:');
  results.forEach(result => {
    console.log(`\nTEST ${result.testNumber}: ${result.imageName}`);
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Time: ${(result.processingTime / 1000).toFixed(1)}s`);
    console.log(`   Cleaned: ${result.cleanedImageUrl ? '✅' : '❌'}`);
    console.log(`   Flatlay: ${result.flatlayUrl ? '✅' : '❌'}`);
    console.log(`   Analysis: ${result.analysisLabels} labels, ${result.analysisDetails} details`);
    if (result.flatlayUrl) {
      console.log(`   URL: ${result.flatlayUrl}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Save results to file
  const outputFileName = `batch-flatlay-results-${Date.now()}.json`;
  writeFileSync(outputFileName, JSON.stringify(results, null, 2));
  console.log(`\n💾 Full results saved to: ${outputFileName}`);

  console.log('\n✨ Batch testing completed!');
}

runBatchFlatlayTests().catch(console.error);
