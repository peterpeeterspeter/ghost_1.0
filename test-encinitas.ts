#!/usr/bin/env node
/**
 * Test with encinitas garment
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { processGhostMannequin } from './lib/ghost/pipeline';

async function main() {
  console.log('🏖️ Ghost Mannequin Pipeline - Encinitas Test');
  console.log('============================================================');

  // Validate API keys
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;

  if (!geminiApiKey || !falApiKey) {
    console.error('❌ Missing API keys in .env.local');
    process.exit(1);
  }

  console.log('✅ API Keys configured');
  console.log('🔧 Using Gemini 2.5 Flash Lite Preview for processing');
  console.log('🎨 Using AI Studio for rendering');
  console.log('');

  // Load encinitas image
  const testImagePath = join(process.cwd(), 'Input', 'encinitas detail.JPG');
  const imageBuffer = readFileSync(testImagePath);
  const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  console.log(`📸 Processing: encinitas detail.JPG`);
  console.log(`📏 Image size: ${Math.round(imageBuffer.length / 1024)}KB`);
  console.log('');
  console.log('🚀 Starting Pipeline...');
  console.log('');
  console.log('Pipeline Stages:');
  console.log('  1️⃣  Background Removal (FAL.AI Bria 2.0)');
  console.log('  2️⃣  Garment Analysis (Gemini 2.5 Flash Lite Preview)');
  console.log('  3️⃣  Enrichment Analysis (Gemini 2.5 Flash Lite Preview)');
  console.log('  4️⃣  Consolidation (Gemini 2.5 Flash Lite Preview)');
  console.log('  5️⃣  Ghost Mannequin Generation (Gemini 2.5 Flash Image)');
  console.log('');

  try {
    const result = await processGhostMannequin({
      garmentDetailImage: imageBase64,
      outputType: 'ghost-mannequin',
      renderingModel: 'ai-studio',
      processingOptions: {
        mockFalApi: process.env.MOCK_FAL_API === 'true',
        skipEnrichment: process.env.SKIP_ENRICHMENT === 'true'
      }
    });

    console.log('============================================================');
    console.log('✅ PIPELINE COMPLETED!');
    console.log('============================================================');
    console.log(`⏱️  Total Time: ${result.processingTime}s`);
    console.log(`🆔 Session ID: ${result.sessionId}`);
    console.log(`📊 Status: ${result.status}`);
    console.log('');

    console.log('🎯 RESULTS:');
    console.log(`🖼️  Cleaned Image: ${result.cleanedImageUrl ? '✅ Generated' : '❌ Failed'}`);
    console.log(`👤 Ghost Mannequin: ${result.renderUrl ? '✅ Generated' : '❌ Failed'}`);
    console.log('');

    if (result.renderUrl) {
      console.log('📸 Output Image:');
      console.log(`   ${result.renderUrl}...`);
    }

    console.log('✨ Test completed!');
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
