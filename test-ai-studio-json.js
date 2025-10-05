#!/usr/bin/env node

/**
 * EXPERT JSON PAYLOAD APPROACH TEST
 * Test AI Studio's Gemini 2.5 Flash Image with structured JSON input
 */

require('dotenv').config({ path: '.env.local' });

async function testAiStudioJsonApproach() {
  console.log('🎯 TESTING AI STUDIO GEMINI 2.5 FLASH IMAGE - STRUCTURED JSON APPROACH');
  console.log('===============================================================================');

  // Check API key
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    return;
  }
  console.log('✅ Gemini API key configured');

  try {
    // Dynamic imports for ESM modules
    const { configureAiStudioClient, generateGhostMannequinWithStructuredJSON } = await import('./lib/ghost/ai-studio.ts');
    
    // Configure AI Studio client
    console.log('🔧 Configuring AI Studio client...');
    configureAiStudioClient(geminiApiKey);
    console.log('✅ AI Studio client configured');

    // Test image URLs
    const testImages = {
      flatlay: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      onModel: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    };

    console.log('🖼️ Test images:', testImages);

    // Mock structured analysis data (FactsV3 format)
    const analysisJSON = {
      "type": "garment_analysis",
      "meta": {
        "schema_version": "4.1",
        "session_id": "test-ai-studio-json",
        "processing_time_ms": 2500
      },
      "labels_found": [
        {
          "text": "ZARA",
          "location": "back_neck",
          "confidence": 0.95,
          "preserve": true
        }
      ],
      "preserve_details": [
        {
          "element": "collar_structure",
          "priority": "critical",
          "notes": "Maintain sharp collar points and proper fold"
        },
        {
          "element": "button_alignment",
          "priority": "important", 
          "notes": "Preserve button placement and thread details"
        },
        {
          "element": "fabric_texture",
          "priority": "critical",
          "notes": "Cotton weave pattern visible in original"
        }
      ]
    };

    // Mock enrichment analysis data
    const enrichmentJSON = {
      "type": "garment_enrichment_focused", 
      "meta": {
        "schema_version": "1.0",
        "session_id": "test-ai-studio-enrichment",
        "base_analysis_ref": "test-ai-studio-json"
      },
      "colors": {
        "dominant": {
          "hex": "#F3EFE0",
          "name": "cream",
          "accuracy": 0.92
        },
        "accent": {
          "hex": "#008AB8",
          "name": "teal_blue", 
          "accuracy": 0.88
        },
        "trim": {
          "hex": "#FFFFFF",
          "name": "white",
          "accuracy": 0.95
        }
      },
      "fabric_analysis": {
        "primary_material": "cotton_blend",
        "weave_pattern": "plain_weave",
        "surface_texture": "smooth",
        "drape_behavior": "structured",
        "thickness": "medium"
      },
      "construction_precision": {
        "seam_type": "french_seam",
        "edge_finish": "bound",
        "collar_construction": "fused",
        "button_attachment": "shank"
      },
      "rendering_guidance": {
        "shadow_intensity": 0.3,
        "highlight_boost": 0.1,
        "texture_emphasis": 0.7,
        "wrinkle_suppression": 0.2
      }
    };

    console.log('\n📊 STRUCTURED DATA:');
    console.log(`   Analysis JSON: ${Object.keys(analysisJSON).length} top-level fields`);
    console.log(`   Enrichment JSON: ${Object.keys(enrichmentJSON).length} top-level fields`);
    console.log(`   Labels found: ${analysisJSON.labels_found.length}`);
    console.log(`   Preserve details: ${analysisJSON.preserve_details.length}`);

    console.log('\n🚀 Starting AI Studio generation with STRUCTURED JSON approach...');
    console.log('   - Method: Separate JSON parts (application/json MIME type)');
    console.log('   - Images: Base64 inline data');
    console.log('   - Model: gemini-2.5-flash-image-preview');

    const startTime = Date.now();
    
    // Test the structured JSON approach
    const result = await generateGhostMannequinWithStructuredJSON(
      testImages.flatlay,
      analysisJSON,
      enrichmentJSON,
      testImages.onModel,
      'test-ai-studio-json-' + Date.now(),
      {
        jsonInputMethod: 'separate',    // JSON as separate application/json parts
        imageInputMethod: 'base64',     // Images as base64 inline data
        useSimplePrompt: false          // Use complex professional prompt
      }
    );

    const totalTime = Date.now() - startTime;

    console.log('\n✅ AI STUDIO JSON GENERATION SUCCESS!');
    console.log('===============================================');
    console.log(`⏱️  Total Processing Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`🎯 Generation Time: ${(result.processingTime / 1000).toFixed(1)}s`);
    console.log(`🖼️  Generated Image URL: ${result.renderUrl}`);
    console.log('\n🎉 STRUCTURED JSON APPROACH COMPLETED SUCCESSFULLY!');

    // Test different JSON input methods
    console.log('\n🔄 Testing alternative JSON input methods...');

    console.log('\n   📝 Testing INLINE JSON (embedded in text)...');
    const inlineResult = await generateGhostMannequinWithStructuredJSON(
      testImages.flatlay,
      analysisJSON,
      enrichmentJSON,
      undefined, // No on-model for this test
      'test-ai-studio-inline-' + Date.now(),
      {
        jsonInputMethod: 'inline',
        imageInputMethod: 'base64',
        useSimplePrompt: true
      }
    );

    console.log(`   ✅ Inline method success: ${(inlineResult.processingTime / 1000).toFixed(1)}s`);
    console.log(`   🖼️  Result URL: ${inlineResult.renderUrl}`);

    console.log('\n   📝 Testing EMBEDDED JSON (in main prompt)...');
    const embeddedResult = await generateGhostMannequinWithStructuredJSON(
      testImages.flatlay,
      analysisJSON,
      enrichmentJSON,
      undefined, // No on-model for this test
      'test-ai-studio-embedded-' + Date.now(),
      {
        jsonInputMethod: 'embedded',
        imageInputMethod: 'base64',
        useSimplePrompt: true
      }
    );

    console.log(`   ✅ Embedded method success: ${(embeddedResult.processingTime / 1000).toFixed(1)}s`);
    console.log(`   🖼️  Result URL: ${embeddedResult.renderUrl}`);

    console.log('\n🏆 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================');
    console.log('📊 RESULTS SUMMARY:');
    console.log(`   🥇 Separate JSON Method: ${(result.processingTime / 1000).toFixed(1)}s`);
    console.log(`   🥈 Inline JSON Method: ${(inlineResult.processingTime / 1000).toFixed(1)}s`);
    console.log(`   🥉 Embedded JSON Method: ${(embeddedResult.processingTime / 1000).toFixed(1)}s`);
    console.log('\n✅ AI STUDIO + STRUCTURED JSON APPROACH VALIDATION COMPLETE!');

  } catch (error) {
    console.error('\n❌ AI STUDIO JSON TEST FAILED:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stage: ${error.stage || 'unknown'}`);
    console.error(`   Code: ${error.code || 'unknown'}`);
    
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    
    console.log('\n📝 DEBUGGING INFO:');
    console.log('   - Check GEMINI_API_KEY is valid');
    console.log('   - Check AI Studio API quotas');
    console.log('   - Check network connectivity');
    console.log('   - Verify image URLs are accessible');
  }
}

// Run the test
testAiStudioJsonApproach()
  .then(() => {
    console.log('\n🎯 Test script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test script error:', error.message);
    process.exit(1);
  });