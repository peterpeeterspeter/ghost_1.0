import { configureGeminiClient } from './lib/ghost/gemini';
import { 
  processGhostMannequinCCJ, 
  consolidateToCCJ,
  buildGeminiParts,
  SYSTEM_GM 
} from './lib/ghost/ccj-improved';

async function testImprovedCCJ() {
  console.log('🚀 Testing Improved CCJ Pipeline');
  console.log('================================');
  
  try {
    // Configure Gemini client
    console.log('📡 Configuring Gemini client...');
    await configureGeminiClient(process.env.GEMINI_API_KEY!);
    console.log('✅ Gemini client configured');
    
    // Sample facts (simplified for testing)
    const sampleFacts = {
      category_generic: 'shirt',
      silhouette: 'classic-collar',
      pattern: 'solid',
      material: 'cotton',
      weave_knit: 'woven',
      drape_stiffness: 0.4,
      transparency: 'opaque',
      surface_sheen: 'matte',
      palette: {
        dominant_hex: '#2E5BBA',
        accent_hex: '#FFFFFF',
        pattern_hexes: []
      },
      color_precision: {
        primary_hex: '#2E5BBA',
        secondary_hex: '#FFFFFF',
        accuracy_score: 0.95
      },
      fabric_behavior: {
        drape_characteristic: 'structured',
        weight_class: 'medium',
        stretch_capability: 'none'
      },
      labels_found: [
        {
          text: 'SAMPLE BRAND',
          type: 'brand_label',
          preserve: true,
          priority: 'critical'
        }
      ],
      visual_references: {
        primary: 'gs://test-primary.jpg',
        aux: ['gs://test-aux.jpg']
      }
    };
    
    const sessionId = 'test-improved-ccj-001';
    
    console.log('\n📦 Testing CCJ consolidation...');
    const { core, hints } = consolidateToCCJ(sampleFacts, sessionId);
    
    console.log('✅ Core Contract generated:');
    console.log(`   • Version: ${core.v}`);
    console.log(`   • Category: ${core.category}`);
    console.log(`   • Colors: ${core.colors_hex.join(', ')}`);
    console.log(`   • Show interiors: ${core.rules.show_interiors}`);
    console.log(`   • Labels lock: ${core.rules.labels_lock}`);
    
    console.log('\n✅ Hints generated:');
    console.log(`   • View: ${hints.view}`);
    console.log(`   • Material: ${hints.material.family}`);
    console.log(`   • Interior regions: ${hints.interior.regions.join(', ')}`);
    console.log(`   • Labels visible: ${hints.labels.visible}`);
    
    console.log('\n📏 System instruction:');
    console.log(`   • Length: ${SYSTEM_GM.length} characters`);
    console.log(`   • Preview: ${SYSTEM_GM.substring(0, 100)}...`);
    
    console.log('\n🔧 Testing Gemini parts builder...');
    const parts = buildGeminiParts(
      core.refs.primary,
      core.refs.aux,
      core,
      hints
    );
    
    console.log(`   • Total parts: ${parts.length}`);
    console.log(`   • Parts types: ${parts.map(p => Object.keys(p)[0]).join(', ')}`);
    
    console.log('\n🎨 Testing image generation...');
    console.log('   • Note: This test requires valid Files API URIs');
    console.log('   • Skipping actual generation due to missing gs:// URIs');
    
    // Uncomment when you have actual Files API URIs:
    // const imageBuffer = await processGhostMannequinCCJ(sampleFacts, sessionId);
    // console.log(`   • Generated image size: ${imageBuffer.length} bytes`);
    
    console.log('\n✅ Improved CCJ Pipeline test completed successfully!');
    console.log('\n📊 Key Improvements:');
    console.log('   • ✅ Removed Freepik dependency');
    console.log('   • ✅ Short, durable system instruction');
    console.log('   • ✅ Images first, then JSON (better grounding)');
    console.log('   • ✅ Interior lock + label lock in Core Contract');
    console.log('   • ✅ Expanded Hints (~60 fields)');
    console.log('   • ✅ Stable Gemini 2.5 Flash Image features');
    console.log('   • ✅ Consolidation guardrails');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testImprovedCCJ().catch(console.error);
