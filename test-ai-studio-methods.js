/**
 * Test script for different AI Studio JSON and image input methods
 * Demonstrates the various ways to feed JSON and images to AI Studio
 */

import { generateGhostMannequinWithStructuredJSON, configureAiStudioClient } from './lib/ghost/ai-studio.js';
import { analyzeGarment, analyzeGarmentEnrichment, configureGeminiClient } from './lib/ghost/gemini.js';
import { removeBackground, configureFalClient } from './lib/ghost/fal.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAiStudioMethods() {
  console.log('🧪 Testing AI Studio JSON & Image Input Methods...\n');

  // Test image URL (Unsplash sample - flatlay garment)
  const testImageUrl = 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000';
  
  // Configure clients
  if (!process.env.FAL_API_KEY) {
    console.error('❌ FAL_API_KEY not found in environment variables');
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  configureFalClient(process.env.FAL_API_KEY);
  configureGeminiClient(process.env.GEMINI_API_KEY);
  configureAiStudioClient(process.env.GEMINI_API_KEY);

  try {
    console.log('🔄 Step 1: Background removal...');
    const cleanedResult = await removeBackground(testImageUrl);
    console.log(`✅ Background removed: ${cleanedResult.cleanedImageUrl}`);

    console.log('\n🔄 Step 2: Analysis...');
    const analysisResult = await analyzeGarment(cleanedResult.cleanedImageUrl, 'test-session');
    console.log(`✅ Analysis completed: ${Object.keys(analysisResult.analysis).length} fields`);

    console.log('\n🔄 Step 3: Enrichment analysis...');
    const enrichmentResult = await analyzeGarmentEnrichment(
      cleanedResult.cleanedImageUrl, 
      'test-enrichment', 
      analysisResult.analysis.meta.session_id
    );
    console.log(`✅ Enrichment completed: ${Object.keys(enrichmentResult.enrichment).length} fields`);

    // Now test different JSON and image input methods
    const testMethods = [
      {
        name: 'Method 1: JSON as Separate Binary Data + Base64 Images',
        options: {
          jsonInputMethod: 'separate',
          imageInputMethod: 'base64',
          useSimplePrompt: true
        }
      },
      {
        name: 'Method 2: JSON Inline Text + Base64 Images',
        options: {
          jsonInputMethod: 'inline',
          imageInputMethod: 'base64',
          useSimplePrompt: false
        }
      },
      {
        name: 'Method 3: JSON Embedded in Prompt + Auto Images',
        options: {
          jsonInputMethod: 'embedded',
          imageInputMethod: 'auto',
          useSimplePrompt: false
        }
      }
    ];

    for (const method of testMethods) {
      console.log(`\n🎯 Testing: ${method.name}`);
      console.log(`   JSON Method: ${method.options.jsonInputMethod}`);
      console.log(`   Image Method: ${method.options.imageInputMethod}`);
      console.log(`   Simple Prompt: ${method.options.useSimplePrompt}`);

      const startTime = Date.now();

      try {
        const result = await generateGhostMannequinWithStructuredJSON(
          cleanedResult.cleanedImageUrl,          // Flatlay image
          analysisResult.analysis,                // Raw analysis JSON
          enrichmentResult.enrichment,            // Raw enrichment JSON
          testImageUrl,                          // Original on-model image
          `test-${Date.now()}`,                  // Session ID
          method.options                         // Test options
        );

        const processingTime = Date.now() - startTime;
        console.log(`✅ Success! Generated in ${(processingTime / 1000).toFixed(2)}s`);
        console.log(`   Generated Image: ${result.renderUrl}`);
        
        // Only test first method for demo (comment out to test all)
        break;

      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.log(`❌ Failed after ${(processingTime / 1000).toFixed(2)}s: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Helper function to show JSON structure differences
function demonstrateJSONMethods() {
  console.log('\n📋 JSON Input Method Comparison:\n');
  
  const sampleAnalysis = {
    type: "garment_analysis",
    meta: { schema_version: "4.1", session_id: "example" },
    labels_found: [{ text: "BRAND", location: "neck_area" }],
    preserve_details: [{ element: "logo", priority: "critical" }]
  };

  console.log('🔸 Method 1: SEPARATE - JSON as binary data (application/json MIME type)');
  console.log('   • Analysis JSON sent as base64-encoded application/json');
  console.log('   • Enrichment JSON sent as base64-encoded application/json');
  console.log('   • Clean separation between prompt, JSON data, and images');
  console.log('   • Best for large JSON payloads');

  console.log('\n🔸 Method 2: INLINE - JSON as text in separate content parts');
  console.log(`   • Text: "Analysis Data: ${JSON.stringify(sampleAnalysis, null, 2)}"`);
  console.log('   • Readable by AI as text but not structured data');
  console.log('   • Good for moderate JSON sizes');

  console.log('\n🔸 Method 3: EMBEDDED - JSON embedded in main prompt');
  console.log('   • JSON mixed directly into the ghost mannequin prompt');
  console.log('   • Most compact but potentially less structured');
  console.log('   • Best for small JSON payloads');

  console.log('\n📸 Image Input Method Comparison:\n');
  
  console.log('🔸 AUTO/BASE64 (Current): Convert all images to base64 inline data');
  console.log('   • Guaranteed to work with all image sources');
  console.log('   • Larger payload size but self-contained');
  
  console.log('\n🔸 URL (Experimental): Try to pass URLs directly to AI Studio');
  console.log('   • Smaller payloads, faster transmission');
  console.log('   • May not be supported - fallback to base64 if needed');
}

console.log('📖 AI Studio Input Methods Demo\n');
demonstrateJSONMethods();

// Ask user if they want to run the actual test
console.log('\n❓ Run actual test? (This will use API credits)');
console.log('   Uncomment the line below to run:\n');
console.log('// testAiStudioMethods().catch(console.error);');

// Uncomment to run the actual test:
// testAiStudioMethods().catch(console.error);