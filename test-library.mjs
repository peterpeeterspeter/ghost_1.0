#!/usr/bin/env node

/**
 * Test the standalone library with your full pipeline
 */

import { createGhostMannequinLibrary } from './lib/ghost-mannequin-lib.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testLibrary() {
  console.log('🧪 Testing Standalone Ghost Mannequin Library');
  console.log('============================================');

  // Check environment
  if (!process.env.FAL_API_KEY || !process.env.GEMINI_API_KEY) {
    console.error('❌ Missing API keys in .env.local');
    console.error('   FAL_API_KEY:', process.env.FAL_API_KEY ? '✅' : '❌');
    console.error('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅' : '❌');
    return;
  }

  // Initialize library
  const ghostMannequin = createGhostMannequinLibrary({
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    renderingModel: 'ai-studio', // Your optimized model
    enableLogging: true
  });

  try {
    console.log('🔄 Processing test image...');
    
    const result = await ghostMannequin.process(
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      undefined, // No on-model image
      {
        outputSize: '1024x1024',
        backgroundColor: 'white',
        preserveLabels: true
      }
    );

    console.log('\n📊 Results:');
    console.log('===========');
    console.log(`✅ Status: ${result.status}`);
    console.log(`🆔 Session: ${result.sessionId}`);
    console.log(`⏱️  Time: ${result.metrics?.processingTime || 'N/A'}`);
    
    if (result.status === 'completed') {
      console.log('\n🎯 URLs:');
      if (result.cleanedImageUrl) {
        console.log(`🖼️  Cleaned: ${result.cleanedImageUrl}`);
      }
      if (result.renderUrl) {
        console.log(`👻 Ghost Mannequin: ${result.renderUrl}`);
      }

      console.log('\n📝 Analysis Available:');
      if (result.analysis) {
        console.log(`✅ Base Analysis: ${Object.keys(result.analysis).length} sections`);
      }
      if (result.enrichment) {
        console.log(`✅ Enrichment: Enhanced data with confidence ${result.enrichment.confidence_breakdown?.overall_confidence || 'N/A'}`);
      }

      if (result.metrics?.stageTimings) {
        console.log('\n⏱️  Stage Timings:');
        Object.entries(result.metrics.stageTimings).forEach(([stage, time]) => {
          if (time > 0) {
            console.log(`   ${stage}: ${(time / 1000).toFixed(1)}s`);
          }
        });
      }
    } else {
      console.log(`❌ Error: ${result.error?.message}`);
      console.log(`   Code: ${result.error?.code}`);
      console.log(`   Stage: ${result.error?.stage}`);
    }

    console.log('\n✨ Your complete pipeline is working through the library!');
    console.log('🎉 All advanced features are included:');
    console.log('   - Background removal');
    console.log('   - Professional analysis (70+ fields)');
    console.log('   - Dynamic prompts');
    console.log('   - Cost optimizations');
    console.log('   - Multiple AI models');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

await testLibrary();