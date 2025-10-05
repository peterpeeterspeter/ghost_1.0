import { configureGeminiClient } from './lib/ghost/gemini';
import { processCCJGhostMannequin } from './lib/ghost/ccj-pipeline';
import { DEFAULT_CCJ_CONFIG } from './lib/ghost/ccj-pipeline';

async function testCCJWithHemd() {
  console.log('🚀 Testing CCJ Pipeline with Hemd');
  console.log('==================================');
  
  try {
    // Configure Gemini client
    console.log('📡 Configuring Gemini client...');
    await configureGeminiClient(process.env.GEMINI_API_KEY!);
    console.log('✅ Gemini client configured');
    
    // Sample facts based on hemd analysis
    const hemdFacts = {
      category_generic: 'shirt',
      silhouette: 'classic-collar-long-sleeve',
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
          text: 'HEMD BRAND',
          type: 'brand_label',
          preserve: true,
          priority: 'critical'
        }
      ],
      interior_analysis: {
        visible_regions: ['neckline', 'cuffs', 'hem'],
        edge_thickness_note: 'standard',
        lining_present: false,
        pattern_inside: false,
        texture_inside: 'cotton',
        visibility_confidence: 0.8
      },
      hollow_regions: {
        list: ['neckline', 'cuffs', 'hem'],
        depth_style: 'standard',
        must_render: true,
        shadow_policy: 'subtle',
        notes: 'Show interior hollows for ghost effect'
      },
      construction_details: {
        seams: 'visible',
        closures: 'button_placket',
        collar_neckline: 'classic_collar',
        pockets: 'none',
        special_features: 'button_cuffs'
      }
    };
    
    const controlBlock = {
      must: [
        'pure_white_background',
        'ghost_mannequin_effect',
        'interior_hollows_visible'
      ],
      ban: [
        'mannequins', 
        'humans', 
        'props', 
        'reflections',
        'long_shadows'
      ],
      color_hex_lock: '#2E5BBA',
      lighting_hint: 'soft_even_studio',
      shadow_style: 'contact_only',
      view: 'front',
      framing_margin_pct: 6
    };
    
    const sessionId = 'ccj-hemd-test-001';
    
    // Test with local image - convert to absolute path
    const path = await import('path');
    const flatlayUrl = path.resolve('Input/hemd.jpg');
    console.log(`📸 Using image: ${flatlayUrl}`);
    
    console.log('\n📦 Running CCJ pipeline...');
    const result = await processCCJGhostMannequin(
      hemdFacts,
      controlBlock,
      sessionId,
      {
        flatlayUrl: flatlayUrl,
        onModelUrl: undefined // No on-model for this test
      },
      {
        ...DEFAULT_CCJ_CONFIG,
        enableQA: false, // Skip QA for now
        enableRetry: false
      }
    );
    
    console.log('\n📊 CCJ Pipeline Results:');
    console.log(`   • Success: ${result.success}`);
    console.log(`   • Image URL: ${result.generated_image_url ? 'Generated' : 'Failed'}`);
    console.log(`   • CCJ bytes: ${result.sizes.ccj_bytes}`);
    console.log(`   • Hints bytes: ${result.sizes.hints_bytes}`);
    console.log(`   • Total bytes: ${result.sizes.total_bytes}`);
    
    if (result.success && result.generated_image_url) {
      console.log('\n✅ CCJ Pipeline completed successfully!');
      console.log(`   • Generated image: ${result.generated_image_url}`);
    } else {
      console.log('\n❌ CCJ Pipeline failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCCJWithHemd().catch(console.error);
