#!/usr/bin/env node

/**
 * Quick test script for the enhanced ghost mannequin pipeline
 * Tests the complete 4-stage process with separate JSON files
 */

const { processGhostMannequin } = require('./lib/ghost/pipeline');
require('dotenv').config({ path: '.env.local' });

async function testPipeline() {
  // Check API keys
  const falApiKey = process.env.FAL_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!falApiKey || !geminiApiKey) {
    console.error('❌ Missing API keys in .env.local:');
    console.error('   FAL_API_KEY:', falApiKey ? '✅' : '❌');
    console.error('   GEMINI_API_KEY:', geminiApiKey ? '✅' : '❌');
    return;
  }

  console.log('🚀 Testing Enhanced Ghost Mannequin Pipeline');
  console.log('================================================');

  // Use a test image URL or local file path
  // Replace with your test image URL
  const testImageUrl = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'; // Example shirt image

  const request = {
    flatlay: testImageUrl,
    // onModel: 'optional_on_model_image_url_here' // Optional
  };

  const options = {
    falApiKey,
    geminiApiKey,
    enableLogging: true,
    timeouts: {
      backgroundRemoval: 45000,  // 45 seconds
      analysis: 120000,          // 2 minutes
      enrichment: 90000,         // 1.5 minutes  
      rendering: 300000,         // 5 minutes
    }
  };

  try {
    console.log('📸 Processing image:', testImageUrl);
    console.log('🔄 Starting 4-stage pipeline...\n');
    
    const startTime = Date.now();
    const result = await processGhostMannequin(request, options);
    const totalTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(50));
    console.log('✅ PIPELINE COMPLETED!');
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`🆔 Session ID: ${result.sessionId}`);
    console.log(`📊 Status: ${result.status}`);

    if (result.status === 'completed') {
      console.log('\n🎯 RESULTS:');
      console.log(`🖼️  Cleaned Image: ${result.cleanedImageUrl || 'N/A'}`);
      console.log(`👤 Ghost Mannequin: ${result.renderUrl || 'N/A'}`);
      
      console.log('\n⏱️  Stage Timings:');
      console.log(`   Background Removal: ${result.metrics.stageTimings.backgroundRemoval}ms`);
      console.log(`   Base Analysis: ${result.metrics.stageTimings.analysis}ms`);
      console.log(`   Enrichment: ${result.metrics.stageTimings.enrichment}ms`);
      console.log(`   Rendering: ${result.metrics.stageTimings.rendering}ms`);

      if (result.analysis) {
        console.log('\n📝 Analysis Data Generated ✅');
      }
      if (result.enrichment) {
        console.log('✨ Enrichment Data Generated ✅');
      }

    } else if (result.error) {
      console.log('\n❌ PIPELINE FAILED:');
      console.log(`   Stage: ${result.error.stage}`);
      console.log(`   Code: ${result.error.code}`);
      console.log(`   Message: ${result.error.message}`);
    }

  } catch (error) {
    console.error('\n💥 TEST FAILED:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testPipeline()
  .then(() => console.log('\n🎉 Test completed!'))
  .catch(error => console.error('\n💥 Test error:', error.message));
