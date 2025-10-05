/**
 * Test script for AI Studio integration
 * Tests the new AI Studio integration with a simple ghost mannequin request
 */

import { processGhostMannequin } from './lib/ghost/pipeline.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAiStudioIntegration() {
  console.log('🧪 Testing AI Studio Integration...\n');

  // Test image URL (Unsplash sample - flatlay garment)
  const testImageUrl = 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000';
  
  // Configure pipeline options with AI Studio AS ALTERNATIVE
  const pipelineOptions = {
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    renderingModel: 'ai-studio', // Alternative renderer (default is 'freepik-gemini')
    enableLogging: true,
    timeouts: {
      backgroundRemoval: 30000,
      analysis: 90000,
      enrichment: 120000,
      consolidation: 45000,
      rendering: 300000, // 5 minutes for AI Studio rendering
      qa: 60000,
    }
  };

  if (!pipelineOptions.falApiKey) {
    console.error('❌ FAL_API_KEY not found in environment variables');
    process.exit(1);
  }

  if (!pipelineOptions.geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  const request = {
    flatlay: testImageUrl,
    options: {
      outputSize: '1024x1024',
    }
  };

  console.log('📊 Test Configuration:');
  console.log(`   Flatlay Image: ${testImageUrl}`);
  console.log(`   Renderer: ${pipelineOptions.renderingModel}`);
  console.log(`   Rendering Timeout: ${pipelineOptions.timeouts.rendering / 1000}s`);
  console.log('');

  const startTime = Date.now();

  try {
    console.log('🚀 Starting AI Studio pipeline test...\n');
    
    const result = await processGhostMannequin(request, pipelineOptions);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n✅ AI Studio Integration Test Results:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Session ID: ${result.sessionId}`);
    console.log(`   Total Processing Time: ${(totalTime / 1000).toFixed(2)}s`);
    
    if (result.status === 'completed') {
      console.log('\n🎯 Pipeline Stage Results:');
      console.log(`   Background Removal: ${result.metrics.stageTimings.backgroundRemoval}ms`);
      console.log(`   Analysis: ${result.metrics.stageTimings.analysis}ms`);
      console.log(`   Enrichment: ${result.metrics.stageTimings.enrichment}ms`);
      console.log(`   Consolidation: ${result.metrics.stageTimings.consolidation}ms`);
      console.log(`   Rendering: ${result.metrics.stageTimings.rendering}ms`);
      
      if (result.cleanedImageUrl) {
        console.log(`\n🖼️ Cleaned Image: ${result.cleanedImageUrl}`);
      }
      
      if (result.renderUrl) {
        console.log(`🎨 Generated Ghost Mannequin: ${result.renderUrl}`);
      }
      
      if (result.consolidation) {
        console.log('\n📊 Consolidation Data:');
        console.log(`   FactsV3 Fields: ${Object.keys(result.consolidation.facts_v3).length}`);
        console.log(`   Control Block Fields: ${Object.keys(result.consolidation.control_block).length}`);
        console.log(`   Conflicts Resolved: ${result.consolidation.conflicts_resolved}`);
      }
      
      console.log('\n🎉 AI Studio integration test completed successfully!');
    } else {
      console.log('\n❌ Pipeline failed:');
      if (result.error) {
        console.log(`   Error: ${result.error.message}`);
        console.log(`   Code: ${result.error.code}`);
        console.log(`   Stage: ${result.error.stage}`);
      }
    }

  } catch (error) {
    console.error('\n❌ AI Studio integration test failed:');
    console.error(`   Error: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    if (error.stage) {
      console.error(`   Stage: ${error.stage}`);
    }
    process.exit(1);
  }
}

// Run the test
testAiStudioIntegration().catch(console.error);