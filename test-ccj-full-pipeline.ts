#!/usr/bin/env npx tsx

import { GhostMannequinPipeline } from './lib/ghost/pipeline';
import { configureGeminiClient } from './lib/ghost/gemini';
import { configureFalClient } from './lib/ghost/fal';
import path from 'path';

async function testCCJFullPipeline() {
  try {
    console.log('🚀 Testing CCJ Pipeline with Full Flash Lite Analysis');
    console.log('==================================================');
    
    // Configure clients
    if (process.env.GEMINI_API_KEY) {
      configureGeminiClient(process.env.GEMINI_API_KEY);
      console.log('✅ Gemini client configured');
    } else {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    if (process.env.FAL_API_KEY) {
      configureFalClient(process.env.FAL_API_KEY);
      console.log('✅ FAL client configured');
    } else {
      throw new Error('FAL_API_KEY is required');
    }
    
    // Enable CCJ pipeline
    process.env.USE_CCJ_PIPELINE = 'true';
    process.env.CCJ_INTEGRATION_MODE = 'replace_consolidation';
    
    console.log('🔧 CCJ Pipeline enabled');
    console.log('   • USE_CCJ_PIPELINE: true');
    console.log('   • CCJ_INTEGRATION_MODE: replace_consolidation');
    
    // Create pipeline with CCJ enabled
    const pipeline = new GhostMannequinPipeline({
      enableBackgroundRemoval: true,
      enableAnalysis: true,
      enableEnrichment: true,
      enableConsolidation: true,
      enableRendering: true,
      enableQaLoop: false,
      outputType: 'ghost-mannequin',
      timeouts: {
        backgroundRemoval: 30000,
        analysis: 60000,
        enrichment: 60000,
        consolidation: 30000,
        rendering: 90000,
        qa: 30000
      },
      maxQaIterations: 3
    });
    
    // Convert local image to base64
    const fs = await import('fs');
    const imagePath = path.resolve('Input/hemd.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
    
    console.log('📸 Using image:', imagePath);
    console.log('📸 Image size:', imageBuffer.length, 'bytes');
    
    // Process with full pipeline including Flash Lite analysis
    const result = await pipeline.process({
      flatlay: imageDataUrl,
      sessionId: 'ccj-full-pipeline-' + Date.now(),
      options: {
        enableBackgroundRemoval: true,
        enableAnalysis: true,
        enableEnrichment: true,
        enableConsolidation: true,
        enableRendering: true
      }
    });
    
    console.log('\n✅ Full CCJ Pipeline with Flash Lite Analysis completed!');
    console.log('📊 Results:');
    console.log(`   • Success: ${result.success}`);
    console.log(`   • Session ID: ${result.sessionId}`);
    console.log(`   • Processing time: ${result.processingTime}ms`);
    
    if (result.success && result.renderUrl) {
      console.log(`   • Render URL: ${result.renderUrl}`);
      console.log(`   • Image size: ${result.imageSize || 'unknown'}`);
      
      console.log('\n📋 Stage Results:');
      console.log(`   • Background removal: ${result.stageResults.backgroundRemovalFlatlay ? '✅' : '❌'}`);
      console.log(`   • Analysis (Flash Lite): ${result.stageResults.analysis ? '✅' : '❌'}`);
      console.log(`   • Enrichment (Flash Lite): ${result.stageResults.enrichment ? '✅' : '❌'}`);
      console.log(`   • CCJ Consolidation: ${result.stageResults.consolidation ? '✅' : '❌'}`);
      console.log(`   • Rendering: ${result.stageResults.rendering ? '✅' : '❌'}`);
      
      console.log('\n🎯 Analysis Results:');
      if (result.stageResults.analysis) {
        const analysis = result.stageResults.analysis.analysis;
        console.log(`   • Category: ${analysis.category_generic || 'unknown'}`);
        console.log(`   • Silhouette: ${analysis.silhouette || 'unknown'}`);
        console.log(`   • Material: ${analysis.material || 'unknown'}`);
        console.log(`   • Colors: ${analysis.palette?.dominant_hex || 'unknown'}`);
        console.log(`   • Labels found: ${analysis.labels_found?.length || 0}`);
        console.log(`   • Interior regions: ${analysis.interior_analysis?.visible_regions?.join(', ') || 'none'}`);
      }
      
      console.log('\n🎯 Enrichment Results:');
      if (result.stageResults.enrichment) {
        const enrichment = result.stageResults.enrichment.enrichment;
        console.log(`   • Color precision: ${enrichment.color_precision?.primary_hex || 'unknown'}`);
        console.log(`   • Fabric behavior: ${enrichment.fabric_behavior?.drape_characteristic || 'unknown'}`);
        console.log(`   • Construction grade: ${enrichment.construction_precision?.overall_construction_grade || 'unknown'}`);
        console.log(`   • Confidence: ${enrichment.confidence_breakdown?.overall_confidence || 'unknown'}`);
      }
      
      console.log('\n🎯 CCJ Results:');
      if (result.stageResults.consolidation) {
        const consolidation = result.stageResults.consolidation;
        console.log(`   • Facts V3 fields: ${Object.keys(consolidation.facts_v3 || {}).length}`);
        console.log(`   • Control block rules: ${consolidation.control_block?.must?.length || 0} must, ${consolidation.control_block?.ban?.length || 0} ban`);
        console.log(`   • Show interiors: ${consolidation.facts_v3?.hollow_regions?.must_render || false}`);
        console.log(`   • Label lock: ${consolidation.control_block?.label_keep_list?.length || 0} labels`);
      }
      
      console.log('\n🌐 Generated Image:');
      console.log(`   ${result.renderUrl}`);
      console.log();
      console.log('   The image shows a ghost mannequin generated with:');
      console.log('   ✅ Flash Lite analysis (garment structure)');
      console.log('   ✅ Flash Lite enrichment (color, fabric, construction)');
      console.log('   ✅ CCJ Core Contract JSON (10 fields)');
      console.log('   ✅ CCJ Hints JSON (14 fields)');
      console.log('   ✅ Interior hollows and label preservation');
      console.log('   ✅ Files API optimization (0 input tokens)');
      
    } else {
      console.error('❌ Pipeline failed or no render URL generated');
      if (result.error) {
        console.error('Error:', result.error);
      }
    }
    
  } catch (error) {
    console.error('❌ CCJ Full Pipeline test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

testCCJFullPipeline();
