#!/usr/bin/env npx tsx

import { 
  SYSTEM_GM,
  buildRenderInstruction,
  buildCCJCore,
  buildHints,
  type FactsV3, 
  type ControlBlock,
  type RenderType 
} from './lib/ghost/ccj-modes';

function showRenderPrompts() {
  console.log('🎨 CCJ Mode-Aware Render Prompts');
  console.log('================================');
  console.log();

  // Sample facts for demonstration
  const facts: FactsV3 = {
    category_generic: 'shirt',
    silhouette: 'classic-collar-long-sleeve',
    pattern: 'solid',
    palette: {
      dominant_hex: '#2E5BBA',
      accent_hex: '#FFFFFF'
    },
    labels_found: [
      {
        text: 'HEMD BRAND',
        priority: 'critical'
      }
    ],
    interior_analysis: {
      visible_regions: ['neckline', 'cuffs', 'hem']
    }
  };

  const control: ControlBlock = {
    must: ['pure_white_background', 'ghost_mannequin_effect'],
    ban: ['mannequins', 'humans', 'props', 'reflections']
  };

  const modes: RenderType[] = ['ghost', 'flatlay', 'on_model', 'vton'];
  const sessionId = 'demo-session-id';
  const primaryFileUri = 'https://example.com/files/hemd.jpg';

  console.log('📋 SHARED SYSTEM INSTRUCTION:');
  console.log('=============================');
  console.log(SYSTEM_GM);
  console.log();

  modes.forEach(mode => {
    console.log(`\n🎯 ${mode.toUpperCase()} MODE:`);
    console.log('='.repeat(30));
    
    // Get mode-specific render instruction
    const renderInstruction = buildRenderInstruction(mode);
    
    // Get CCJ Core
    const ccjCore = buildCCJCore(facts, primaryFileUri, [], mode, sessionId);
    
    // Get CCJ Hints
    const ccjHints = buildHints(facts, control, mode);
    
    console.log('\n📝 RENDER INSTRUCTION:');
    console.log('----------------------');
    console.log(renderInstruction);
    
    console.log('\n📋 CCJ CORE (Binding Rules):');
    console.log('-----------------------------');
    console.log(JSON.stringify({
      mode: ccjCore.rules.mode,
      show_interiors: ccjCore.rules.show_interiors,
      bg: ccjCore.rules.bg,
      labels_lock: ccjCore.rules.labels_lock,
      category: ccjCore.category,
      colors_hex: ccjCore.colors_hex
    }, null, 2));
    
    console.log('\n💡 CCJ HINTS (Secondary Steering):');
    console.log('-----------------------------------');
    console.log(JSON.stringify({
      view: ccjHints.view,
      lighting: ccjHints.lighting,
      shadow: ccjHints.shadow,
      interior: ccjHints.interior,
      notes: ccjHints.notes
    }, null, 2));
    
    console.log('\n🔧 KEY DIFFERENCES:');
    console.log('-------------------');
    
    if (mode === 'ghost') {
      console.log('• Interior rendering: ENABLED (render_hollows: true)');
      console.log('• View: front');
      console.log('• Shadows: contact_only, very_low');
      console.log('• Focus: 3D ghost mannequin with interior hollows');
    } else if (mode === 'flatlay') {
      console.log('• Interior rendering: DISABLED (no interior hints)');
      console.log('• View: top_down');
      console.log('• Shadows: none, none');
      console.log('• Focus: Top-down flatlay with no volume');
    } else if (mode === 'on_model') {
      console.log('• Interior rendering: DISABLED (render_hollows: false)');
      console.log('• View: 3d_frontal');
      console.log('• Shadows: contact_only, low');
      console.log('• Focus: Digital form with true garment shape');
    } else if (mode === 'vton') {
      console.log('• Interior rendering: DISABLED (render_hollows: false)');
      console.log('• View: 3d_frontal');
      console.log('• Shadows: scene_consistent, match_subject');
      console.log('• Focus: Virtual try-on with person reference');
    }
    
    console.log('\n' + '─'.repeat(60));
  });

  console.log('\n🎯 PROMPT STRUCTURE SUMMARY:');
  console.log('============================');
  console.log('1. System Instruction (shared across all modes)');
  console.log('2. Render Instruction (mode-specific task)');
  console.log('3. CCJ Core (binding rules with mode flags)');
  console.log('4. CCJ Hints (secondary steering with mode-specific adjustments)');
  console.log();
  console.log('📊 Mode-Specific Features:');
  console.log('• Ghost: Interior hollows, 3D volume, contact shadows');
  console.log('• Flatlay: Top-down view, no volume, no shadows');
  console.log('• On-model: 3D frontal, digital form, low shadows');
  console.log('• VTO: 3D frontal, scene-consistent lighting, person reference');
}

showRenderPrompts();
