#!/usr/bin/env node

/**
 * Quick Test Example - Direct Pipeline Usage
 * Shows how to use the pipeline directly without server
 */

import { processGhostMannequin } from '../lib/ghost/pipeline.js';
import { readFile } from 'fs/promises';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function quickTest() {
  console.log('🚀 Testing Direct Pipeline Integration');
  console.log('=====================================');

  // Check environment
  if (!process.env.FAL_API_KEY || !process.env.GEMINI_API_KEY) {
    console.error('❌ Missing API keys in .env.local');
    console.error('   Please set FAL_API_KEY and GEMINI_API_KEY');
    process.exit(1);
  }

  try {
    // Example with URLs (no files needed)
    console.log('🔄 Processing sample image...');
    
    const request = {
      flatlay: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&crop=center',
      onModel: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop&crop=center',
      options: {
        outputSize: '1024x1024',
        backgroundColor: 'white',
        preserveLabels: true,
        useStructuredPrompt: false,
        useExpertPrompt: false
      }
    };

    const options = {
      falApiKey: process.env.FAL_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      freepikApiKey: process.env.FREEPIK_API_KEY,
      renderingModel: 'ai-studio',
      enableLogging: true,
      timeouts: {
        backgroundRemoval: 30000,
        analysis: 90000,
        enrichment: 120000,
        consolidation: 45000,
        rendering: 180000,
        qa: 60000
      },
      enableQaLoop: true,
      maxQaIterations: 2
    };

    console.log('⚙️  Configuration:');
    console.log(`   - Rendering Model: ${options.renderingModel}`);
    console.log(`   - Output Size: ${request.options.outputSize}`);
    console.log(`   - Background: ${request.options.backgroundColor}`);
    console.log('');

    const startTime = Date.now();
    const result = await processGhostMannequin(request, options);
    const endTime = Date.now();

    console.log('📊 Results:');
    console.log('===========');
    console.log(`Status: ${result.status}`);
    console.log(`Session ID: ${result.sessionId}`);
    console.log(`Total Time: ${((endTime - startTime) / 1000).toFixed(1)}s`);
    
    if (result.status === 'completed') {
      console.log('✅ SUCCESS!');
      console.log(`🎭 Ghost Mannequin URL: ${result.renderUrl}`);
      
      if (result.cleanedImageUrl) {
        console.log(`🖼️  Cleaned Flatlay: ${result.cleanedImageUrl}`);
      }
      
      if (result.cleanedOnModelUrl) {
        console.log(`🖼️  Cleaned On-Model: ${result.cleanedOnModelUrl}`);
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
      console.log('❌ FAILED');
      console.log(`Error: ${result.error?.message}`);
      console.log(`Code: ${result.error?.code}`);
      console.log(`Stage: ${result.error?.stage}`);
    }

    console.log('\n✨ Direct integration working! No server needed.');
    console.log('💡 You can now use this pattern in your own applications.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

async function fileTest(imagePath) {
  console.log(`\n🔄 Testing with local file: ${imagePath}`);
  
  try {
    // Read file and convert to base64
    const imageBuffer = await readFile(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    const request = {
      flatlay: base64Image,
      options: {
        outputSize: '1024x1024',
        backgroundColor: 'white'
      }
    };

    const options = {
      falApiKey: process.env.FAL_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      renderingModel: 'ai-studio',
      enableLogging: false // Less verbose for file test
    };

    const result = await processGhostMannequin(request, options);
    
    if (result.status === 'completed') {
      console.log('✅ File processing successful!');
      console.log(`Result: ${result.renderUrl}`);
    } else {
      console.log('❌ File processing failed:', result.error?.message);
    }
  } catch (error) {
    console.error('❌ File test error:', error.message);
  }
}

// Run tests
if (process.argv.length > 2) {
  // Test with specific file
  const imagePath = process.argv[2];
  await fileTest(imagePath);
} else {
  // Run basic URL test
  await quickTest();
}

console.log('\n🎉 Test complete!');
console.log('📖 See INTEGRATION_GUIDE.md for more usage examples.');