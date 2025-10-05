import { configureFilesManager } from './lib/ghost/files-manager';
import { generateCCJRender } from './lib/ghost/ccj-modes';
import { uploadImageToFalStorage } from './lib/ghost/fal';
import { toFilesURI } from './lib/ghost/ccj-improved';
import path from 'path';

// Test VTON mode with person + garment images
async function testVTONMode() {
  console.log('🚀 Testing VTON Mode - Person + Garment Transfer');
  console.log('================================================');

  try {
    // Configure Files Manager
    console.log('🔧 Configuring Files Manager...');
    configureFilesManager(process.env.GEMINI_API_KEY!);
    console.log('✅ Files Manager configured - Files API ready for 0 token usage');

    // Test data - using encinitas t-shirt as garment
    const garmentImagePath = path.resolve('./Input/encinitas detail.JPG');
    const personImagePath = path.resolve('./Input/hemd.jpg'); // Using hemd as person placeholder for testing
    
    console.log(`📸 Using garment: ${garmentImagePath}`);
    console.log(`👤 Using person: ${personImagePath}`);

    // Upload images to Files API
    console.log('📤 Uploading images to Files API...');
    const garmentFileUri = await toFilesURI(garmentImagePath);
    const personFileUri = await toFilesURI(personImagePath);
    
    console.log(`✅ Garment uploaded: ${garmentFileUri}`);
    console.log(`✅ Person uploaded: ${personFileUri}`);

    // Mock FactsV3 data for encinitas t-shirt
    const facts = {
      category_generic: 't-shirt',
      silhouette: 'regular',
      palette: {
        dominant_hex: '#FFFFFF',
        accent_hexes: ['#000000'],
        pattern_hexes: []
      },
      material: 'cotton',
      fabric_behavior: {
        drape_characteristic: 'natural',
        weight_class: 'medium',
        stretch_capability: 'minimal',
        wrinkle_resistance: 'moderate'
      },
      construction_precision: {
        stitch_density: 'standard'
      },
      edge_finish: 'as_seen',
      print_scale: 'as_seen',
      drape_stiffness: 0.4,
      transparency: 'opaque',
      surface_sheen: 'matte',
      labels_found: [
        {
          text: 'ENCINITAS',
          position: 'chest',
          visibility: 'visible',
          priority: 'high',
          type: 'brand'
        }
      ],
      color_precision: {
        primary_hex: '#FFFFFF',
        secondary_hex: '#000000'
      },
      weave_knit: 'knit'
    };

    const control = {
      ban: []
    };

    // Test VTON mode
    console.log('🎨 Testing VTON mode...');
    const startTime = Date.now();
    
    const imageBuffer = await generateCCJRender(
      facts,
      control,
      garmentFileUri,
      [], // no aux files
      'vton',
      `vton-test-${startTime}`,
      personFileUri, // person reference
      '4:5'
    );
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`✅ VTON mode completed in ${processingTime}ms`);
    console.log(`   • Image size: ${imageBuffer.length.toLocaleString()} bytes`);
    
    // Save locally
    const fileName = `vton-test-${startTime}.png`;
    const fs = await import('fs');
    fs.writeFileSync(fileName, imageBuffer);
    console.log(`   • Saved locally: ${fileName}`);
    
    // Upload to FAL storage
    console.log('Uploading generated image to FAL storage...');
    let falUrl = '';
    try {
      falUrl = await uploadImageToFalStorage(imageBuffer);
      console.log(`   • FAL Storage URL: ${falUrl}`);
    } catch (falError) {
      console.log(`   • FAL upload failed: ${falError}`);
    }
    
    console.log('\n🎯 VTON Test Summary:');
    console.log('====================');
    console.log(`   • Success: ✅`);
    console.log(`   • Processing time: ${processingTime}ms`);
    console.log(`   • Image size: ${imageBuffer.length.toLocaleString()} bytes`);
    console.log(`   • Local file: ${fileName}`);
    if (falUrl) {
      console.log(`   • FAL URL: ${falUrl}`);
    }
    
  } catch (error) {
    console.error('❌ VTON test failed:', error);
    process.exit(1);
  }
}

// Check environment
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable required');
  process.exit(1);
}

if (!process.env.FAL_API_KEY) {
  console.error('❌ FAL_API_KEY environment variable required');
  process.exit(1);
}

testVTONMode();
