#!/usr/bin/env npx tsx

import { configureFilesManager, getFilesManager } from './lib/ghost/files-manager';
import fs from 'fs';
import path from 'path';

async function testFilesAPI() {
  try {
    console.log('🔧 Testing Files API upload...');
    
    // Check environment
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 API Key present:', !!apiKey);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not set');
      return;
    }
    
    // Configure Files Manager
    configureFilesManager(apiKey);
    const filesManager = getFilesManager();
    console.log('✅ Files Manager configured');
    
    // Read test image
    const imagePath = path.resolve('Input/hemd.jpg');
    console.log('📸 Image path:', imagePath);
    console.log('📸 Image exists:', fs.existsSync(imagePath));
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Image file not found');
      return;
    }
    
    const buffer = fs.readFileSync(imagePath);
    console.log('📸 Image size:', buffer.length, 'bytes');
    console.log('📸 Image type (first bytes):', buffer.subarray(0, 4));
    
    // Try upload
    console.log('📤 Attempting upload...');
    const result = await filesManager.uploadFile(buffer, {
      role: 'flatlay',
      sessionId: 'debug-' + Date.now(),
      mimeType: 'image/jpeg',
      displayName: 'debug-hemd.jpg'
    });
    
    console.log('✅ Upload successful!');
    console.log('📎 URI:', result.uri);
    console.log('📎 Name:', result.name);
    console.log('📎 Size:', result.sizeBytes, 'bytes');
    
  } catch (error) {
    console.error('❌ Files API test failed:');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    // Additional debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error cause:', (error as any).cause);
    }
  }
}

testFilesAPI();
