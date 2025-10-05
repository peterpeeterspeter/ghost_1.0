#!/usr/bin/env node

/**
 * Quick Local Test - Ghost Mannequin Pipeline
 * Tests with a local image from the test_data folder
 */

import { processGhostMannequin } from './lib/ghost/pipeline.js';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { config } from 'dotenv';

// Load .env.local explicitly
config({ path: '.env.local' });

async function testLocalImage() {
  console.log('🎭 Ghost Mannequin Pipeline - Quick Test');
  console.log('='.repeat(60));
  
  // Check API keys
  const falApiKey = process.env.FAL_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 DEBUG: API Key values:');
  console.log('   FAL_API_KEY:', falApiKey ? `${falApiKey.substring(0, 20)}...` : 'MISSING');
  console.log('   GEMINI_API_KEY:', geminiApiKey ? `${geminiApiKey.substring(0, 20)}...` : 'MISSING');
  
  if (!falApiKey || !geminiApiKey) {
    console.error('❌ Missing API keys in .env.local:');
    console.error('   FAL_API_KEY:', falApiKey ? '✅' : '❌');
    console.error('   GEMINI_API_KEY:', geminiApiKey ? '✅' : '❌');
    console.error('\nℹ️  .env.local has been created with your API keys');
    return;
  }

  console.log('✅ API Keys configured');
  console.log('🔧 Using Gemini 2.5 Flash Lite Preview (09-2025) for processing');
  console.log('🎨 Using AI Studio for rendering\n');

  // Use a test image from the Input folder
  const inputDir = join(process.cwd(), 'Input');
  const testImagePath = join(inputDir, 'hemd.jpg');  // Change this to test different images
  
  if (!existsSync(testImagePath)) {
    console.error('❌ Test image not found:', testImagePath);
    console.log('\nℹ️  Available images in Input folder:');
    if (existsSync(inputDir)) {
      readdirSync(inputDir)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
        .forEach(f => console.log(`   - ${f}`));
    }
    return;
  }

  // Convert local image to base64
  const imageBuffer = readFileSync(testImagePath);
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  console.log(`📸 Processing: ${basename(testImagePath)}`);
  console.log(`📏 Image size: ${Math.round(imageBuffer.length / 1024)}KB\n`);

  const request = {
    flatlay: base64Image,
    // onModel: base64OnModelImage, // Optional - uncomment if you have a reference image
  };

  const options = {
    falApiKey,
    geminiApiKey,
    renderingModel: 'ai-studio' as const,  // Using AI Studio with Gemini 2.5 Flash Image
    enableLogging: true,
    timeouts: {
      backgroundRemoval: 120000,  // 2 minutes
      analysis: 120000,           // 2 minutes
      enrichment: 120000,         // 2 minutes  
      consolidation: 60000,       // 1 minute
      rendering: 180000,          // 3 minutes
    }
  };

  try {
    console.log('🚀 Starting Pipeline...\n');
    console.log('Pipeline Stages:');
    console.log('  1️⃣  Background Removal (FAL.AI Bria 2.0)');
    console.log('  2️⃣  Garment Analysis (Gemini 2.5 Flash Lite Preview)');
    console.log('  3️⃣  Enrichment Analysis (Gemini 2.5 Flash Lite Preview)');
    console.log('  4️⃣  Consolidation (Gemini 2.5 Flash Lite Preview)');
    console.log('  5️⃣  Ghost Mannequin Generation (Gemini 2.5 Flash Image)\n');
    
    const startTime = Date.now();
    const result = await processGhostMannequin(request, options);
    const totalTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('✅ PIPELINE COMPLETED!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`🆔 Session ID: ${result.sessionId}`);
    console.log(`📊 Status: ${result.status}`);

    if (result.status === 'completed') {
      console.log('\n🎯 RESULTS:');
      console.log(`🖼️  Cleaned Image: ${result.cleanedImageUrl ? '✅ Generated' : '❌'}`);
      console.log(`👤 Ghost Mannequin: ${result.renderUrl ? '✅ Generated' : '❌'}`);
      
      console.log('\n⏱️  Stage Timings:');
      console.log(`   Background Removal: ${(result.metrics.stageTimings.backgroundRemoval / 1000).toFixed(1)}s`);
      console.log(`   Base Analysis: ${(result.metrics.stageTimings.analysis / 1000).toFixed(1)}s`);
      console.log(`   Enrichment: ${(result.metrics.stageTimings.enrichment / 1000).toFixed(1)}s`);
      console.log(`   Consolidation: ${(result.metrics.stageTimings.consolidation / 1000).toFixed(1)}s`);
      console.log(`   Rendering: ${(result.metrics.stageTimings.rendering / 1000).toFixed(1)}s`);

      if (result.analysis) {
        console.log('\n📝 Analysis Data:');
        console.log(`   Labels Found: ${result.analysis.labels_found?.length || 0}`);
        console.log(`   Details to Preserve: ${result.analysis.preserve_details?.length || 0}`);
      }
      
      if (result.enrichment) {
        console.log('\n✨ Enrichment Data:');
        console.log(`   Primary Color: ${result.enrichment.color_precision?.primary_hex || 'N/A'}`);
        console.log(`   Fabric: ${result.enrichment.fabric_behavior?.drape_quality || 'N/A'}`);
      }

      if (result.renderUrl) {
        console.log('\n📸 Output Image:');
        console.log(`   ${result.renderUrl.substring(0, 100)}...`);
        
        // Save result to file
        const timestamp = Date.now();
        const resultPath = join(process.cwd(), `ghost-result-${timestamp}.json`);
        
        // 🔍 DEBUG: Check interior_analysis before JSON.stringify
        console.log('🔍 DEBUG: Before JSON.stringify...');
        console.log('🔍 result.consolidation.facts_v3.interior_analysis:', result.consolidation?.facts_v3?.interior_analysis);
        console.log('🔍 typeof interior_analysis:', typeof result.consolidation?.facts_v3?.interior_analysis);
        console.log('🔍 Array.isArray(interior_analysis):', Array.isArray(result.consolidation?.facts_v3?.interior_analysis));
        
        // Check for circular references
        try {
          JSON.stringify(result.consolidation?.facts_v3?.interior_analysis);
          console.log('🔍 interior_analysis serializes correctly');
        } catch (error) {
          console.error('🔍 interior_analysis serialization error:', error);
        }
        
        // Try to stringify with error handling
        try {
          const jsonString = JSON.stringify(result, null, 2);
          writeFileSync(resultPath, jsonString);
          console.log(`\n💾 Full result saved to: ${basename(resultPath)}`);
          
          // 🔍 DEBUG: Check what was actually saved
          console.log('🔍 DEBUG: Checking saved file...');
          const savedContent = JSON.parse(jsonString);
          console.log('🔍 Saved interior_analysis length:', savedContent.consolidation?.facts_v3?.interior_analysis?.length || 0);
          console.log('🔍 Saved interior_analysis value:', savedContent.consolidation?.facts_v3?.interior_analysis);
          
        } catch (error) {
          console.error('🔍 JSON.stringify error:', error);
          console.log('🔍 Trying to stringify just the consolidation part...');
          try {
            const consolidationJson = JSON.stringify(result.consolidation, null, 2);
            console.log('🔍 Consolidation JSON (first 500 chars):', consolidationJson.substring(0, 500));
          } catch (consolidationError) {
            console.error('🔍 Consolidation JSON.stringify error:', consolidationError);
          }
        }
      }

    } else if (result.error) {
      console.log('\n❌ PIPELINE FAILED:');
      console.log(`   Stage: ${result.error.stage}`);
      console.log(`   Code: ${result.error.code}`);
      console.log(`   Message: ${result.error.message}`);
    }

  } catch (error) {
    console.error('\n💥 TEST FAILED:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack Trace:');
      console.error(error.stack);
    }
  }
}

// Run the test
testLocalImage()
  .then(() => console.log('\n✨ Test completed!\n'))
  .catch(error => {
    console.error('\n💥 Unhandled error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
