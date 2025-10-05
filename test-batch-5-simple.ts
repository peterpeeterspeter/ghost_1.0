import { join, basename } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { GhostMannequinPipeline } from './lib/ghost/pipeline';
import { config } from 'dotenv';

// Load .env.local explicitly
config({ path: '.env.local' });

async function runBatchTest() {
  console.log('🎭 Ghost Mannequin Pipeline - Batch Test (5 hemd images)');
  console.log('='.repeat(60));
  
  // Check API keys
  const falApiKey = process.env.FAL_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 DEBUG: API Key values:');
  console.log('   FAL_API_KEY:', falApiKey ? `${falApiKey.substring(0, 20)}...` : 'MISSING');
  console.log('   GEMINI_API_KEY:', geminiApiKey ? `${geminiApiKey.substring(0, 20)}...` : 'MISSING');
  
  if (!falApiKey || !geminiApiKey) {
    console.error('❌ Missing API keys in .env.local:');
    console.error('   FAL_API_KEY:', falApiKey ? '✅' : '❌');
    console.error('   GEMINI_API_KEY:', geminiApiKey ? '✅' : '❌');
    console.error('\nℹ️  .env.local has been created with your API keys');
    return;
  }

  console.log('✅ API Keys configured');
  console.log('🔧 Using Gemini 2.5 Flash Lite Preview (09-2025) for processing');
  console.log('🎨 Using AI Studio for rendering\n');

  // Initialize the pipeline
  const pipeline = new GhostMannequinPipeline({
    renderingModel: 'ai-studio',
    outputSize: '2048x2048',
    backgroundColor: 'white'
  });

  const results = [];
  const startTime = Date.now();

  // Run 5 tests with hemd.jpg
  for (let i = 1; i <= 5; i++) {
    console.log(`\n📸 Processing hemd.jpg (${i}/5)`);
    
    try {
      const testImagePath = join(process.cwd(), 'Input', 'hemd.jpg');
      
      if (!existsSync(testImagePath)) {
        console.error('❌ Test image not found:', testImagePath);
        return;
      }

      console.log(`📏 Image size: ${Math.round(readFileSync(testImagePath).length / 1024)}KB`);
      
      // Read the image file
      const imageBuffer = readFileSync(testImagePath);
      
      console.log('🚀 Starting Pipeline...\n');

      // Process the image
      const result = await pipeline.process({
        flatlay: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
      });

      if (result.status === 'completed') {
        console.log(`✅ Test ${i} completed successfully`);
        
        // Check interior analysis preservation
        const interiorCount = result.consolidation?.facts_v3?.interior_analysis?.length || 0;
        console.log(`   Interior analysis entries: ${interiorCount}`);
        
        results.push({
          test: i,
          status: 'success',
          interiorAnalysisCount: interiorCount,
          processingTime: result.metrics.processingTime,
          renderUrl: result.renderUrl
        });
      } else {
        console.log(`❌ Test ${i} failed: ${result.error?.message}`);
        results.push({
          test: i,
          status: 'failed',
          error: result.error?.message
        });
      }
    } catch (error) {
      console.log(`❌ Test ${i} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        test: i,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log('\n============================================================');
  console.log('✅ BATCH TEST COMPLETED!');
  console.log('============================================================');
  console.log(`⏱️  Total Time: ${totalTime}s`);
  console.log(`📊 Tests: ${results.length}`);
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    const avgTime = (successful.reduce((sum, r) => {
      const time = parseFloat(r.processingTime?.replace('s', '') || '0');
      return sum + time;
    }, 0) / successful.length).toFixed(1);
    
    const interiorAnalysisCounts = successful.map(r => r.interiorAnalysisCount);
    const avgInteriorAnalysis = (interiorAnalysisCounts.reduce((sum, count) => sum + count, 0) / interiorAnalysisCounts.length).toFixed(1);
    
    console.log(`⏱️  Average processing time: ${avgTime}s`);
    console.log(`🔍 Average interior analysis entries: ${avgInteriorAnalysis}`);
    console.log(`📊 Interior analysis range: ${Math.min(...interiorAnalysisCounts)}-${Math.max(...interiorAnalysisCounts)} entries`);
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed tests:');
    failed.forEach(f => {
      console.log(`   Test ${f.test}: ${f.error}`);
    });
  }

  // Save results
  const timestamp = Date.now();
  const resultsPath = join(process.cwd(), `batch-results-hemd-5-${timestamp}.json`);
  writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTime: `${totalTime}s`,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      avgProcessingTime: successful.length > 0 ? 
        (successful.reduce((sum, r) => {
          const time = parseFloat(r.processingTime?.replace('s', '') || '0');
          return sum + time;
        }, 0) / successful.length).toFixed(1) + 's' : 'N/A',
      avgInteriorAnalysis: successful.length > 0 ? 
        (successful.reduce((sum, r) => sum + r.interiorAnalysisCount, 0) / successful.length).toFixed(1) : 'N/A'
    },
    results
  }, null, 2));

  console.log(`\n💾 Batch results saved to: batch-results-hemd-5-${timestamp}.json`);
  console.log('\n✨ Batch test completed!');
}

// Run the batch test
runBatchTest().catch(console.error);
