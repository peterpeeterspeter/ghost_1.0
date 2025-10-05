#!/usr/bin/env node

/**
 * Test script for the new enrichment analysis stage
 * 
 * This demonstrates the enhanced four-stage pipeline:
 * 1. Background Removal (FAL.AI)
 * 2. Base Analysis (Gemini Pro) 
 * 3. Enrichment Analysis (Gemini Pro) - NEW STAGE
 * 4. Ghost Mannequin Generation (Gemini Flash with enrichment data)
 */

const { processGhostMannequin } = require('./lib/ghost/pipeline');

async function testEnrichmentPipeline() {
  // Check for required environment variables
  const falApiKey = process.env.FAL_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!falApiKey || !geminiApiKey) {
    console.error('❌ Missing required API keys:');
    console.error('   - FAL_API_KEY:', falApiKey ? '✅' : '❌');
    console.error('   - GEMINI_API_KEY:', geminiApiKey ? '✅' : '❌');
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }
  
  console.log('🚀 Testing Enhanced Ghost Mannequin Pipeline with Enrichment Analysis');
  console.log('=' .repeat(70));
  
  // Test image (replace with your own test image URL)
  const testImageUrl = 'https://example.com/test-garment.jpg'; // Replace with actual test image
  
  const request = {
    flatlay: testImageUrl,
  };
  
  const options = {
    falApiKey,
    geminiApiKey,
    enableLogging: true,
    timeouts: {
      backgroundRemoval: 30000,
      analysis: 90000,
      enrichment: 60000,  // New enrichment stage timeout
      rendering: 180000,
    }
  };
  
  try {
    console.log('📸 Processing test image:', testImageUrl);
    console.log('🔄 Starting four-stage pipeline...\n');
    
    const result = await processGhostMannequin(request, options);
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ Pipeline completed successfully!');
    console.log('📊 Results Summary:');
    console.log(`   Session ID: ${result.sessionId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Total Time: ${result.metrics.processingTime}`);
    
    console.log('\n⏱️  Stage Timings:');
    console.log(`   🗂️  Background Removal: ${result.metrics.stageTimings.backgroundRemoval}ms`);
    console.log(`   🔍 Base Analysis: ${result.metrics.stageTimings.analysis}ms`);
    console.log(`   ✨ Enrichment Analysis: ${result.metrics.stageTimings.enrichment}ms`);  // NEW STAGE
    console.log(`   🎨 Ghost Mannequin Generation: ${result.metrics.stageTimings.rendering}ms`);
    
    if (result.status === 'completed') {
      console.log('\n🔗 Output URLs:');
      if (result.cleanedImageUrl) {
        console.log(`   Cleaned Image: ${result.cleanedImageUrl}`);
      }
      if (result.renderUrl) {
        console.log(`   Ghost Mannequin: ${result.renderUrl}`);
      }
      
      console.log('\n📝 Analysis Data Available:');
      if (result.analysis) {
        console.log(`   ✅ Base Analysis: ${Object.keys(result.analysis).length} sections`);
      }
      if (result.enrichment) {
        console.log(`   ✅ Enrichment Analysis: Enhanced rendering data with ${result.enrichment.confidence_breakdown?.overall_confidence || 'N/A'} confidence`);
      }
    } else if (result.error) {
      console.log('\n❌ Pipeline failed:');
      console.log(`   Stage: ${result.error.stage}`);
      console.log(`   Code: ${result.error.code}`);
      console.log(`   Message: ${result.error.message}`);
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEnrichmentPipeline()
    .then(() => {
      console.log('\n🎉 Enrichment pipeline test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script error:', error.message);
      process.exit(1);
    });
}

module.exports = { testEnrichmentPipeline };
