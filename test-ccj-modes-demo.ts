#!/usr/bin/env npx tsx

import { 
  buildCCJCore,
  buildHints,
  buildRenderInstruction,
  type FactsV3, 
  type ControlBlock,
  type RenderType 
} from './lib/ghost/ccj-modes';
import path from 'path';
import fs from 'fs';

async function demoAllModes() {
  console.log('🚀 CCJ Mode-Aware Render Layer Demo');
  console.log('===================================');
  console.log('(Demonstrating mode-specific outputs without API calls)');
  console.log();

  // Sample facts for hemd shirt (consistent across modes)
  const facts: FactsV3 = {
    category_generic: 'shirt',
    silhouette: 'classic-collar-long-sleeve',
    pattern: 'solid',
    material: 'cotton',
    weave_knit: 'woven',
    drape_stiffness: 0.4,
    transparency: 'opaque',
    surface_sheen: 'matte',
    edge_finish: 'standard',
    print_scale: 'as_seen',
    framing_margin_pct: 6,
    palette: {
      dominant_hex: '#2E5BBA', // Blue
      accent_hex: '#FFFFFF',
      pattern_hexes: [],
      trim_hex: '#FFFFFF'
    },
    color_precision: {
      primary_hex: '#2E5BBA',
      secondary_hex: '#FFFFFF',
      accuracy_score: 0.95
    },
    fabric_behavior: {
      drape_characteristic: 'structured',
      weight_class: 'medium',
      stretch_capability: 'none',
      wrinkle_resistance: 'moderate'
    },
    construction_precision: {
      stitch_density: 'standard',
      overall_construction_grade: 'high'
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
    qa_targets: {
      deltaE_max: 3,
      min_resolution_px: 2000,
      symmetry_tolerance_pct: 3,
      edge_halo_max_pct: 1
    },
    safety: {
      must_not: ['humans', 'mannequins', 'props', 'reflections']
    }
  };

  const control: ControlBlock = {
    must: ['pure_white_background', 'ghost_mannequin_effect', 'interior_hollows_visible'],
    ban: ['mannequins', 'humans', 'props', 'reflections', 'long_shadows']
  };

  // Test all render modes
  const modes: RenderType[] = ['ghost', 'flatlay', 'on_model', 'vton'];
  const results = [];

  for (const mode of modes) {
    console.log(`\n🎨 Demo Mode: ${mode.toUpperCase()}`);
    console.log('='.repeat(30));
    
    const sessionId = `ccj-modes-demo-${mode}-${Date.now()}`;
    const primaryFileUri = 'https://example.com/files/hemd.jpg'; // Mock URI

    try {
      // Build CCJ Core for this mode
      const ccjCore = buildCCJCore(facts, primaryFileUri, [], mode, sessionId);
      
      // Build hints for this mode
      const ccjHints = buildHints(facts, control, mode);
      
      // Get render instruction for this mode
      const renderInstruction = buildRenderInstruction(mode);

      console.log(`✅ Generated CCJ Core (${mode}):`);
      console.log(JSON.stringify(ccjCore, null, 2));
      
      console.log(`\n✅ Generated CCJ Hints (${mode}):`);
      console.log(JSON.stringify(ccjHints, null, 2));
      
      console.log(`\n✅ Render Instruction (${mode}):`);
      console.log(renderInstruction);

      results.push({
        mode,
        success: true,
        ccjCore,
        ccjHints,
        renderInstruction
      });

    } catch (error: any) {
      console.error(`❌ ${mode.toUpperCase()} mode failed:`, error.message);
      
      results.push({
        mode,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  const successfulModes = results.filter(r => r.success).length;
  const totalModes = modes.length;

  console.log('\n📊 Mode Demo Results Summary:');
  console.log('=============================');
  console.log(`   • Total modes demoed: ${totalModes}`);
  console.log(`   • Successful: ${successfulModes}`);
  console.log(`   • Failed: ${totalModes - successfulModes}`);
  console.log(`   • Success rate: ${(successfulModes / totalModes * 100).toFixed(0)}%`);

  console.log('\n🎯 Mode-Specific Features Demonstrated:');
  results.filter(r => r.success).forEach(r => {
    console.log(`\n   📋 ${r.mode.toUpperCase()} Mode:`);
    console.log(`      • CCJ Core mode: ${r.ccjCore.rules.mode}`);
    console.log(`      • Show interiors: ${r.ccjCore.rules.show_interiors}`);
    console.log(`      • View type: ${r.ccjHints.view}`);
    console.log(`      • Shadow style: ${r.ccjHints.shadow?.style || 'N/A'}`);
    console.log(`      • Interior rendering: ${r.ccjHints.interior?.render_hollows ? 'Yes' : 'No'}`);
    console.log(`      • Notes: ${r.ccjHints.notes}`);
  });

  // Save comprehensive results
  const summaryFileName = `ccj-modes-demo-summary-${Date.now()}.json`;
  fs.writeFileSync(summaryFileName, JSON.stringify({
    totalModes,
    successfulModes,
    failedModes: totalModes - successfulModes,
    successRate: `${(successfulModes / totalModes * 100).toFixed(0)}%`,
    facts,
    control,
    results
  }, null, 2));

  console.log(`\n💾 Demo summary saved to: ${summaryFileName}`);

  console.log('\n🎯 Key Insights:');
  console.log('   • All modes use the same FactsV3 + ControlBlock inputs');
  console.log('   • Mode-specific CCJ Core rules (show_interiors, mode)');
  console.log('   • Mode-specific CCJ Hints (view, lighting, shadows, interior)');
  console.log('   • Mode-specific render instructions');
  console.log('   • Ghost mode: interior hollows enabled');
  console.log('   • Flatlay mode: top-down view, no interior rendering');
  console.log('   • On-model mode: 3D frontal view, no interior rendering');
  console.log('   • VTO mode: scene-consistent lighting, no interior rendering');
}

demoAllModes();
