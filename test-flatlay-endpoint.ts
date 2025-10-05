#!/usr/bin/env tsx
/**
 * Test script for flatlay enhancement endpoint
 * Tests the /api/flatlay endpoint with a sample image
 */

import { join } from 'path';
import { readFileSync } from 'fs';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testFlatlayEndpoint() {
  console.log('🧪 Testing Flatlay Enhancement Endpoint');
  console.log('============================================================');
  
  // Load test image
  const testImagePath = join(process.cwd(), 'Input', 'hemd.jpg');
  console.log('📸 Loading test image:', testImagePath);
  
  const imageBuffer = readFileSync(testImagePath);
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  
  console.log('📏 Image size:', Math.round(imageBuffer.length / 1024), 'KB');
  console.log('');
  
  // Prepare request
  const requestBody = {
    flatlay: base64Image,
    options: {
      preserveLabels: true,
      outputSize: '2048x2048',
      backgroundColor: 'white'
    }
  };
  
  console.log('🚀 Sending request to:', `${API_URL}/api/flatlay`);
  console.log('⏱️  Starting at:', new Date().toISOString());
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_URL}/api/flatlay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Request failed:', error);
      console.error('   Status:', response.status);
      console.error('   Error code:', error.code);
      console.error('   Message:', error.message);
      process.exit(1);
    }
    
    const result = await response.json();
    
    console.log('');
    console.log('============================================================');
    console.log('✅ FLATLAY ENHANCEMENT COMPLETED!');
    console.log('============================================================');
    console.log('⏱️  Total Time:', (processingTime / 1000).toFixed(1) + 's');
    console.log('🆔 Session ID:', result.sessionId);
    console.log('📊 Status:', result.status);
    console.log('');
    
    console.log('🎯 RESULTS:');
    console.log('🖼️  Cleaned Image:', result.cleanedImageUrl ? '✅ Generated' : '❌ Missing');
    console.log('🎨 Enhanced Flatlay:', result.renderUrl ? '✅ Generated' : '❌ Missing');
    console.log('');
    
    console.log('⏱️  Stage Timings:');
    if (result.metrics?.stageTimings) {
      const timings = result.metrics.stageTimings;
      console.log('   Background Removal:', (timings.backgroundRemoval / 1000).toFixed(1) + 's');
      console.log('   Base Analysis:', (timings.analysis / 1000).toFixed(1) + 's');
      console.log('   Enrichment:', (timings.enrichment / 1000).toFixed(1) + 's');
      console.log('   Consolidation:', (timings.consolidation / 1000).toFixed(1) + 's');
      console.log('   Flatlay Enhancement:', (timings.rendering / 1000).toFixed(1) + 's');
    }
    console.log('');
    
    console.log('📝 Analysis Data:');
    if (result.analysis) {
      console.log('   Labels Found:', result.analysis.labels_found?.length || 0);
      console.log('   Details to Preserve:', result.analysis.preserve_details?.length || 0);
      console.log('   Interior Surfaces:', result.analysis.interior_analysis?.length || 0);
    }
    console.log('');
    
    console.log('📸 Output URLs:');
    console.log('   Cleaned:', result.cleanedImageUrl);
    console.log('   Enhanced Flatlay:', result.renderUrl);
    console.log('');
    
    console.log('✨ Test completed successfully!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Request failed with error:', error);
    process.exit(1);
  }
}

// Run test
testFlatlayEndpoint().catch(console.error);
