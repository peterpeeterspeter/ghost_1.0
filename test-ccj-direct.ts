#!/usr/bin/env npx tsx

import { processGhostMannequinCCJ } from './lib/ghost/ccj-improved';
import path from 'path';

async function testDirectCCJ() {
  try {
    console.log('🚀 Testing Direct CCJ Pipeline');
    console.log('=============================');
    
    // Sample facts
    const facts = {
      category_generic: 'shirt',
      silhouette: 'classic-collar-long-sleeve',
      pattern: 'solid',
      material: 'cotton',
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
      },
      visual_references: {
        primary: path.resolve('Input/hemd.jpg'),
        aux: []
      }
    };
    
    const sessionId = 'direct-ccj-test-' + Date.now();
    
    console.log('📸 Using image:', facts.visual_references.primary);
    console.log('🔑 API Key present:', !!process.env.GEMINI_API_KEY);
    
    console.log('\n📦 Running direct CCJ pipeline...');
    const imageBuffer = await processGhostMannequinCCJ(facts, sessionId);
    
    console.log('\n✅ Direct CCJ Pipeline completed successfully!');
    console.log('📊 Image buffer size:', imageBuffer.length, 'bytes');
    
    // Save the result
    const fs = await import('fs');
    const outputPath = `ccj-direct-result-${Date.now()}.png`;
    fs.writeFileSync(outputPath, imageBuffer);
    console.log('💾 Saved result to:', outputPath);
    
  } catch (error) {
    console.error('❌ Direct CCJ test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

testDirectCCJ();
