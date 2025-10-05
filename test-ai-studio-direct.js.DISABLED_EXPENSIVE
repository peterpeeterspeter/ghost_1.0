#!/usr/bin/env node

/**
 * DIRECT AI STUDIO TEST - Structured JSON Approach
 * Test Gemini 2.5 Flash Image directly with structured JSON input
 */

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAiStudioDirect() {
  console.log('🎯 DIRECT AI STUDIO TEST - GEMINI 2.5 FLASH IMAGE + STRUCTURED JSON');
  console.log('=========================================================================');

  // Check API key
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    return;
  }
  console.log('✅ Gemini API key configured');

  try {
    // Initialize Gemini client
    console.log('🔧 Initializing Google Generative AI client...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log('✅ Client initialized');

    // Configure Gemini 2.5 Flash Image model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.05, // Very low for consistent results
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });
    console.log('✅ Gemini 2.5 Flash Image model configured');

    // Test image URL (clean product flatlay)
    const testImageUrl = 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';

    console.log('🖼️ Test image:', testImageUrl);

    // Fetch and convert image to base64
    console.log('🔄 Converting image to base64...');
    const imageResponse = await fetch(testImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    console.log(`✅ Image converted: ${Math.round(imageBase64.length / 1024)}KB`);

    // Mock structured analysis data (realistic garment analysis)
    const analysisData = {
      "type": "garment_analysis_v4",
      "meta": {
        "session_id": "ai-studio-direct-test",
        "timestamp": new Date().toISOString(),
        "model_version": "gemini-2.5-pro"
      },
      "garment_category": "shirt",
      "colors": {
        "dominant": "#F5F5DC", // beige
        "accent": "#8B4513",   // saddle brown
        "trim": "#FFFFFF"      // white
      },
      "material_properties": {
        "fabric_type": "cotton_blend",
        "texture": "smooth",
        "drape_behavior": "structured",
        "transparency": "opaque",
        "surface_finish": "matte"
      },
      "construction_details": {
        "collar_type": "button_down",
        "sleeve_style": "long_sleeve",
        "cuff_style": "button_cuff",
        "front_closure": "button_placket",
        "hem_style": "straight"
      },
      "preserve_elements": [
        "button_details",
        "collar_structure", 
        "fabric_texture",
        "any_visible_labels"
      ]
    };

    const renderingInstructions = {
      "ghost_mannequin_requirements": {
        "effect_type": "invisible_mannequin",
        "background": "pure_white_studio",
        "lighting": "soft_diffused_professional",
        "shadows": "minimal_natural",
        "perspective": "front_view_slight_angle"
      },
      "quality_standards": {
        "resolution": "high_definition",
        "color_accuracy": "preserve_exact_colors",
        "detail_preservation": "maintain_all_construction_details",
        "professional_finish": "e_commerce_ready"
      }
    };

    // Method 1: Test with JSON as separate inlineData parts
    console.log('\n🧪 METHOD 1: JSON as separate application/json parts');
    console.log('   - Analysis data as application/json MIME type');
    console.log('   - Rendering instructions as application/json MIME type');
    console.log('   - Image as image/jpeg base64');

    const method1Content = [
      {
        text: `Create a professional ghost mannequin photograph from this garment. Use the provided structured analysis data for precise color matching, material properties, and construction details.

The ghost mannequin effect should show the garment with natural dimensional form as if worn by an invisible person. The garment should appear properly fitted and structured against a pristine white studio background.

Follow the rendering instructions exactly for lighting, shadows, and professional e-commerce presentation standards.`
      },
      {
        text: "Garment Analysis Data:"
      },
      {
        inlineData: {
          data: Buffer.from(JSON.stringify(analysisData, null, 2)).toString('base64'),
          mimeType: 'application/json'
        }
      },
      {
        text: "Rendering Instructions:"
      },
      {
        inlineData: {
          data: Buffer.from(JSON.stringify(renderingInstructions, null, 2)).toString('base64'),
          mimeType: 'application/json'
        }
      },
      {
        text: "Reference Image (use for visual details and colors):"
      },
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      }
    ];

    console.log(`🚀 Calling AI Studio with ${method1Content.length} content parts...`);
    
    const startTime = Date.now();
    const result1 = await model.generateContent(method1Content);
    const response1 = await result1.response;
    const processingTime1 = Date.now() - startTime;

    console.log(`✅ Method 1 completed in ${(processingTime1 / 1000).toFixed(1)}s`);

    // Check for generated image
    let generatedImageFound = false;
    if (response1.candidates && response1.candidates.length > 0) {
      const candidate = response1.candidates[0];
      if (candidate.content && candidate.content.parts) {
        console.log(`📦 Found ${candidate.content.parts.length} response parts`);
        
        for (let i = 0; i < candidate.content.parts.length; i++) {
          const part = candidate.content.parts[i];
          if (part.text) {
            console.log(`   Part ${i}: Text (${part.text.length} chars)`);
            console.log(`   Preview: "${part.text.substring(0, 100)}..."`);
          } else if (part.inlineData && part.inlineData.mimeType) {
            console.log(`   Part ${i}: ${part.inlineData.mimeType} (${part.inlineData.data.length} bytes)`);
            if (part.inlineData.mimeType.startsWith('image/')) {
              generatedImageFound = true;
              console.log('🎨 ✅ GENERATED IMAGE FOUND!');
              console.log(`     MIME Type: ${part.inlineData.mimeType}`);
              console.log(`     Size: ${Math.round(part.inlineData.data.length / 1024)}KB`);
            }
          }
        }
      }
    }

    if (generatedImageFound) {
      console.log('\n🎉 SUCCESS! AI Studio generated a ghost mannequin image using structured JSON!');
    } else {
      console.log('\n⚠️ No image generated, but request processed successfully');
    }

    // Method 2: Test with JSON embedded in text (for comparison)
    console.log('\n🧪 METHOD 2: JSON embedded in text prompt (comparison)');
    
    const method2Content = [
      {
        text: `Create a professional ghost mannequin photograph from this garment.

GARMENT ANALYSIS:
${JSON.stringify(analysisData, null, 2)}

RENDERING INSTRUCTIONS:
${JSON.stringify(renderingInstructions, null, 2)}

Use this data for precise color matching, material properties, and construction details. Show the garment with natural dimensional form as if worn by an invisible person.`
      },
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      }
    ];

    console.log('🚀 Calling AI Studio with embedded JSON approach...');
    
    const startTime2 = Date.now();
    const result2 = await model.generateContent(method2Content);
    const response2 = await result2.response;
    const processingTime2 = Date.now() - startTime2;

    console.log(`✅ Method 2 completed in ${(processingTime2 / 1000).toFixed(1)}s`);

    let generatedImage2Found = false;
    if (response2.candidates && response2.candidates.length > 0) {
      const candidate = response2.candidates[0];
      if (candidate.content && candidate.content.parts) {
        const imagePart = candidate.content.parts.find(part => 
          part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')
        );
        if (imagePart) {
          generatedImage2Found = true;
          console.log('🎨 ✅ Method 2 also generated an image!');
        }
      }
    }

    console.log('\n🏆 RESULTS SUMMARY:');
    console.log('==================');
    console.log(`📊 Method 1 (Separate JSON Parts): ${(processingTime1 / 1000).toFixed(1)}s - ${generatedImageFound ? '✅ Image Generated' : '❌ No Image'}`);
    console.log(`📊 Method 2 (Embedded JSON): ${(processingTime2 / 1000).toFixed(1)}s - ${generatedImage2Found ? '✅ Image Generated' : '❌ No Image'}`);

    if (generatedImageFound || generatedImage2Found) {
      console.log('\n🎯 CONCLUSION: AI Studio successfully processes structured JSON data for ghost mannequin generation!');
    } else {
      console.log('\n📝 CONCLUSION: AI Studio processed requests but did not generate images (may need prompt refinement)');
    }

    console.log('\n✅ DIRECT AI STUDIO TEST COMPLETED!');

  } catch (error) {
    console.error('\n❌ AI STUDIO TEST FAILED:');
    console.error(`   Error: ${error.message}`);
    
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    
    // Common troubleshooting
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      console.log('\n💡 TROUBLESHOOTING: API quota or rate limit exceeded');
    } else if (error.message.includes('safety') || error.message.includes('blocked')) {
      console.log('\n💡 TROUBLESHOOTING: Content blocked by safety filters');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 TROUBLESHOOTING: Network connectivity issue');
    }
    
    console.log('\n📝 DEBUG CHECKLIST:');
    console.log('   - Verify GEMINI_API_KEY is correct and active');
    console.log('   - Check AI Studio API quotas and billing');
    console.log('   - Ensure network connectivity to Google AI services');
    console.log('   - Test image URL is accessible');
  }
}

// Run the test
testAiStudioDirect()
  .then(() => {
    console.log('\n🎯 Direct AI Studio test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test script error:', error.message);
    process.exit(1);
  });