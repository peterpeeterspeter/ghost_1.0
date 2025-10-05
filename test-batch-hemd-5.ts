import { join } from 'path';
import { writeFileSync } from 'fs';
import { GhostMannequinPipeline } from './lib/ghost/pipeline';
import { configureConsolidationClient } from './lib/ghost/consolidation';
import { configurePromptGenerator } from './lib/ghost/prompt-generator';
import { configureAiStudioClient } from './lib/ghost/ai-studio';
import { configureGeminiClient } from './lib/ghost/gemini';
import { configureFalClient } from './lib/ghost/fal';
import { configureFilesManager } from './lib/ghost/files-manager';
import { readFileSync } from 'fs';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runBatchTest() {
  console.log('🎭 Ghost Mannequin Pipeline - Batch Test (5 hemd images)');
  console.log('================================================================');

  // Configure all clients
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const falApiKey = process.env.FAL_API_KEY;

  if (!geminiApiKey || !falApiKey) {
    console.error('❌ Missing required API keys');
    console.error('   GEMINI_API_KEY:', geminiApiKey ? '✅' : '❌');
    console.error('   FAL_API_KEY:', falApiKey ? '✅' : '❌');
    process.exit(1);
  }

  configureConsolidationClient(geminiApiKey);
  configurePromptGenerator(geminiApiKey);
  configureAiStudioClient(geminiApiKey); // AI Studio uses the same Gemini API key
  configureGeminiClient(geminiApiKey);
  configureFalClient(falApiKey);
  configureFilesManager(geminiApiKey);

  console.log('✅ API Keys configured');
  console.log('🔧 Using Gemini 2.5 Flash Lite Preview (09-2025) for processing');
  console.log('🎨 Using AI Studio for rendering');

  // Initialize pipeline
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
      const hemdPath = join(process.cwd(), 'Input', 'hemd.jpg');
      const hemdImage = readFileSync(hemdPath);
      const base64Image = `data:image/jpeg;base64,${hemdImage.toString('base64')}`;

      const result = await pipeline.process({
        flatlay: base64Image
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
  console.log('\n================================================================');
  console.log('✅ BATCH TEST COMPLETED!');
  console.log('================================================================');
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
