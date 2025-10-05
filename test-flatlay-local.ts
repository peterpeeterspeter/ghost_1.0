#!/usr/bin/env node
/**
 * Quick local test for Flatlay Enhancement Pipeline
 * Tests the complete pipeline with detailed logging
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { processGhostMannequin } from './lib/ghost/pipeline';

async function main() {
  console.log('🎨 Flatlay Enhancement Pipeline - Quick Test');
  console.log('============================================================');

  // Validate API keys
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;

  if (!geminiApiKey || !falApiKey) {
    console.error('❌ Missing API keys in .env.local');
    process.exit(1);
  }

  console.log('✅ API Keys configured');
  console.log('🔧 Using Gemini 2.0 Flash Lite for processing');
  console.log('🎨 Using AI Studio for rendering');
  console.log('');

  // Load test image
  const testImagePath = join(process.cwd(), 'Input', 'hemd.jpg');
  const imageBuffer = readFileSync(testImagePath);
  const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  console.log(`📸 Processing: hemd.jpg`);
  console.log(`📏 Image size: ${Math.round(imageBuffer.length / 1024)}KB`);
  console.log('');
  console.log('🚀 Starting Pipeline...');
  console.log('');
  console.log('Pipeline Stages:');
  console.log('  1️⃣  Background Removal (FAL.AI Bria 2.0)');
  console.log('  2️⃣  Garment Analysis (Gemini 2.0 Flash Lite)');
  console.log('  3️⃣  Enrichment Analysis (Gemini 2.0 Flash Lite)');
  console.log('  4️⃣  Consolidation (Gemini 2.0 Flash Lite)');
  console.log('  5️⃣  🎨 FLATLAY ENHANCEMENT (Gemini 2.5 Flash Image)');
  console.log('');

  try {
    const result = await processGhostMannequin(
      {
        flatlay: imageBase64,
        options: {
          preserveLabels: true,
          outputSize: '2048x2048',
          backgroundColor: 'white',
        },
      },
      {
        geminiApiKey,
        falApiKey,
        renderingModel: 'ai-studio',
        outputType: 'flatlay', // 🎨 THIS IS THE KEY DIFFERENCE
        enableLogging: true,
        timeouts: {
          backgroundRemoval: 120000, // 2 minutes for large images
          analysis: 60000,
          enrichment: 60000,
          consolidation: 60000,
          rendering: 180000, // 3 minutes for image generation
        }
      }
    );

    console.log('');
    console.log('============================================================');
    console.log('✅ PIPELINE COMPLETED!');
    console.log('============================================================');
    console.log(`⏱️  Total Time: ${result.metrics.processingTime}`);
    console.log(`🆔 Session ID: ${result.sessionId}`);
    console.log(`📊 Status: ${result.status}`);
    console.log('');
    console.log('🎯 RESULTS:');
    console.log(`🖼️  Cleaned Image: ${result.cleanedImageUrl ? '✅ Generated' : '❌ Missing'}`);
    console.log(`🎨 Enhanced Flatlay: ${result.renderUrl ? '✅ Generated' : '❌ Missing'}`);
    console.log('');
    console.log('⏱️  Stage Timings:');
    console.log(`   Background Removal: ${(result.metrics.stageTimings.backgroundRemoval / 1000).toFixed(1)}s`);
    console.log(`   Base Analysis: ${(result.metrics.stageTimings.analysis / 1000).toFixed(1)}s`);
    console.log(`   Enrichment: ${(result.metrics.stageTimings.enrichment / 1000).toFixed(1)}s`);
    console.log(`   Consolidation: ${(result.metrics.stageTimings.consolidation / 1000).toFixed(1)}s`);
    console.log(`   Flatlay Enhancement: ${(result.metrics.stageTimings.rendering / 1000).toFixed(1)}s`);
    console.log('');
    console.log('📝 Analysis Data:');
    console.log(`   Labels Found: ${result.analysis?.labels?.length || 0}`);
    console.log(`   Details to Preserve: ${result.analysis?.preserve_details?.length || 0}`);
    console.log(`   Interior Surfaces: ${result.analysis?.interior_analysis?.length || 0}`);
    console.log('');

    // Show detailed analysis data
    if (result.analysis) {
      console.log('🔍 DETAILED ANALYSIS:');
      console.log(JSON.stringify(result.analysis, null, 2));
      console.log('');
    }

    // Show consolidated data
    if (result.consolidation) {
      console.log('📋 CONSOLIDATED DATA:');
      console.log('Facts V3:');
      console.log(JSON.stringify(result.consolidation.facts_v3, null, 2));
      console.log('Control Block:');
      console.log(JSON.stringify(result.consolidation.control_block, null, 2));
      console.log('');
    }

    console.log('📸 Output Image:');
    console.log(`   ${result.renderUrl || (result as any).imageUrl || 'undefined'}...`);
    console.log('');

    // Show metadata if available
    if ((result as any).metadata) {
      console.log('📋 METADATA:');
      console.log(JSON.stringify((result as any).metadata, null, 2));
      console.log('');
    }

    // Show the flatlay prompt if available
    if ((result as any).metadata?.flatlayPrompt) {
      console.log('🎯 FLATLAY RENDER PROMPT:');
      console.log((result as any).metadata.flatlayPrompt);
      console.log('');
    } else {
      console.log('⚠️ No flatlay prompt found in metadata');
    }

    console.log('✨ Test completed!');

  } catch (error: any) {
    console.error('');
    console.error('❌ PIPELINE FAILED!');
    console.error('============================================================');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.stage) console.error('Stage:', error.stage);
    process.exit(1);
  }
}

main();
