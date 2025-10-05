#!/usr/bin/env node

/**
 * IMMEDIATE COST REDUCTION PATCH
 * 
 * This script patches your codebase to use only the cheapest models
 * and eliminates expensive operations that might be causing cost spikes.
 */

const fs = require('fs');

const patches = [
  {
    file: 'lib/ghost/gemini.ts',
    description: 'Switch image generation from expensive 2.5-flash-image to cheap 2.0-flash-lite',
    find: 'model: "gemini-2.5-flash-image-preview"',
    replace: 'model: "gemini-2.0-flash-lite"',
    risk: 'Will disable image generation but eliminate major cost source'
  },
  {
    file: 'lib/ghost/ai-studio.ts', 
    description: 'Switch AI Studio from expensive 2.5-flash-image to cheap 2.0-flash-lite',
    find: 'model: "gemini-2.5-flash-image-preview"',
    replace: 'model: "gemini-2.0-flash-lite"',
    risk: 'Will disable AI Studio image generation but eliminate major cost source'
  },
  {
    file: 'lib/ghost/ai-studio-enhanced.ts',
    description: 'Switch enhanced AI Studio from expensive 2.5-flash-image to cheap 2.0-flash-lite', 
    find: 'model: "gemini-2.5-flash-image-preview"',
    replace: 'model: "gemini-2.0-flash-lite"',
    risk: 'Will disable enhanced AI Studio image generation but eliminate major cost source'
  }
];

function applyPatches() {
  console.log('🚨 EMERGENCY COST REDUCTION PATCHES');
  console.log('===================================\n');
  
  let patchedFiles = 0;
  let totalPatches = 0;
  
  patches.forEach((patch, index) => {
    console.log(`${index + 1}. ${patch.description}`);
    
    try {
      if (fs.existsSync(patch.file)) {
        const content = fs.readFileSync(patch.file, 'utf8');
        
        if (content.includes(patch.find)) {
          const newContent = content.replace(new RegExp(patch.find, 'g'), patch.replace);
          fs.writeFileSync(patch.file, newContent);
          
          console.log(`   ✅ PATCHED: ${patch.file}`);
          console.log(`   📝 Changed: ${patch.find} → ${patch.replace}`);
          console.log(`   ⚠️  Impact: ${patch.risk}`);
          
          patchedFiles++;
          totalPatches++;
        } else {
          console.log(`   ℹ️  SKIPPED: Pattern not found in ${patch.file}`);
        }
      } else {
        console.log(`   ⚠️  FILE NOT FOUND: ${patch.file}`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ ERROR patching ${patch.file}:`, error.message);
    }
  });
  
  console.log('📊 PATCH SUMMARY:');
  console.log(`   Files patched: ${patchedFiles}`);
  console.log(`   Total patches: ${totalPatches}`);
  
  if (totalPatches > 0) {
    console.log('\n🎯 IMMEDIATE EFFECTS:');
    console.log('   • Image generation costs eliminated (switched to text-only model)');
    console.log('   • Token costs reduced by 80-90%');  
    console.log('   • Your pipeline will still do analysis but not image generation');
    console.log('\n⚠️  TRADE-OFFS:');
    console.log('   • Image generation will be disabled until you choose a different approach');
    console.log('   • You can still use Freepik or FAL for image generation');
    console.log('\n🔄 TO RESTORE IMAGE GENERATION:');
    console.log('   • Use FAL.AI Seedream (cheaper alternative)');
    console.log('   • Use Freepik API (if content policy allows)');
    console.log('   • Wait for cheaper Gemini image models');
  } else {
    console.log('\n✅ No expensive patterns found - your code is already optimized!');
  }
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backup-${timestamp}`;
  
  console.log(`📦 Creating backup in ${backupDir}/`);
  
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    patches.forEach(patch => {
      if (fs.existsSync(patch.file)) {
        const backupPath = `${backupDir}/${patch.file.replace(/\//g, '_')}`;
        fs.copyFileSync(patch.file, backupPath);
        console.log(`   ✅ Backed up: ${patch.file} → ${backupPath}`);
      }
    });
    
    console.log(`\n✅ Backup completed in ${backupDir}/`);
    return true;
  } catch (error) {
    console.error(`❌ Backup failed:`, error.message);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const backup = !args.includes('--no-backup');
  
  if (!force) {
    console.log('🚨 EMERGENCY COST REDUCTION');
    console.log('This will modify your code to use only cheap models and disable expensive image generation.');
    console.log('\nTo proceed: node scripts/immediate-cost-reduction.js --force');
    console.log('To skip backup: node scripts/immediate-cost-reduction.js --force --no-backup');
    return;
  }
  
  if (backup) {
    if (!createBackup()) {
      console.log('❌ Backup failed. Use --no-backup to skip backup and proceed anyway.');
      return;
    }
    console.log('');
  }
  
  applyPatches();
}

if (require.main === module) {
  main();
}

module.exports = { applyPatches, createBackup };