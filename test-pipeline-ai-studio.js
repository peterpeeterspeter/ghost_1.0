#!/usr/bin/env node

/**
 * Simple test to verify AI Studio integration in the pipeline
 */

const { processGhostMannequin } = require('./lib/ghost/pipeline');

async function testAiStudioPipeline() {
  console.log('🧪 Testing AI Studio in Pipeline\n');
  
  // Check environment
  if (!process.env.FAL_API_KEY) {
    console.error('❌ FAL_API_KEY required');
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY required');
    process.exit(1);
  }

  // Test request
  const request = {
    flatlay: 'https://cdn.fal.media/files/zebra/IfKNlPVMWpqJpOWHHBq8R.png',
    options: {
      outputSize: '1024x1024'
    }
  };

  // Pipeline options with AI Studio
  const options = {
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    renderingModel: 'ai-studio',
    enableLogging: true
  };

  console.log('🚀 Starting pipeline with AI Studio renderer...\n');

  try {
    const result = await processGhostMannequin(request, options);
    
    console.log('✅ Pipeline completed successfully!');
    console.log(`   Status: ${result.status}`);
    console.log(`   Session: ${result.sessionId}`);
    console.log(`   Processing Time: ${result.metrics.processingTime}`);
    
    if (result.renderUrl) {
      console.log(`   Generated Image: ${result.renderUrl}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

testAiStudioPipeline().catch(console.error);