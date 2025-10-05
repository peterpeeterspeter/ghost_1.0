#!/usr/bin/env node

/**
 * DISABLE FREEPIK FALLBACK PATCH
 * 
 * Keeps Gemini 2.5 Flash Image for rendering (3.9 cents per generation)
 * Disables expensive Freepik fallback to prevent cost spikes
 * Keeps all analysis and prompt generation on cheap flash-lite models
 */

const fs = require('fs');

const patches = [
  {
    file: 'lib/ghost/pipeline.ts',
    description: 'Disable Freepik fallback in main pipeline',
    find: /RENDERING_MODEL.*freepik/gi,
    replace: 'RENDERING_MODEL === "ai-studio"',
    risk: 'Will prevent fallback to Freepik - only use Gemini for rendering'
  },
  {
    file: 'lib/ghost/pipeline.ts',
    description: 'Remove Freepik import and calls',
    find: /import.*freepik/gi,
    replace: '// Freepik disabled for cost control',
    risk: 'Will disable Freepik integration completely'
  },
  {
    file: 'lib/ghost/pipeline.ts',
    description: 'Disable generateImageWithFreepikGemini calls',
    find: /generateImageWithFreepikGemini/g,
    replace: 'null // generateImageWithFreepikGemini disabled',
    risk: 'Will prevent Freepik image generation calls'
  },
  {
    file: 'app/api/ghost/route.ts',
    description: 'Set default rendering model to ai-studio only',
    find: /DEFAULT_RENDERING_MODEL.*freepik/gi,
    replace: 'DEFAULT_RENDERING_MODEL = "ai-studio"',
    risk: 'Forces ai-studio as only rendering option'
  },
  {
    file: '.env.example',
    description: 'Update example to show ai-studio as default',
    find: /DEFAULT_RENDERING_MODEL.*freepik/gi,
    replace: 'DEFAULT_RENDERING_MODEL=ai-studio',
    risk: 'Documentation change only'
  }
];

function findAndPatchContent(content, patches) {
  let modifiedContent = content;
  let patchesApplied = 0;

  // More specific patches based on actual content analysis
  const specificPatches = [
    {
      // Disable Freepik in conditional logic
      pattern: /if.*freepik.*{[\s\S]*?generateImageWithFreepikGemini[\s\S]*?}/gi,
      replacement: '// Freepik rendering disabled for cost control',
      description: 'Remove Freepik conditional blocks'
    },
    {
      // Disable Freepik fallback logic
      pattern: /case.*freepik.*:[\s\S]*?break;/gi,
      replacement: 'case "freepik":\n        throw new Error("Freepik disabled for cost control");\n        break;',
      description: 'Disable Freepik case statements'
    },
    {
      // Remove Freepik imports
      pattern: /import.*freepik.*from.*['"]/gi,
      replacement: '// Freepik import disabled for cost control',
      description: 'Remove Freepik imports'
    },
    {
      // Disable Freepik configuration
      pattern: /FREEPIK_API_KEY/g,
      replacement: 'FREEPIK_API_KEY_DISABLED',
      description: 'Disable Freepik API key usage'
    }
  ];

  specificPatches.forEach(patch => {
    if (patch.pattern.test(content)) {
      modifiedContent = modifiedContent.replace(patch.pattern, patch.replacement);
      patchesApplied++;
      console.log(`      ✓ Applied: ${patch.description}`);
    }
  });

  return { content: modifiedContent, patchesApplied };
}

function analyzeAndPatch() {
  console.log('🎯 DISABLING FREEPIK FALLBACK (COST CONTROL)');
  console.log('============================================\n');
  
  const filesToPatch = [
    'lib/ghost/pipeline.ts',
    'app/api/ghost/route.ts', 
    'lib/ghost/freepik.ts',
    '.env.example',
    'types/ghost.ts'
  ];
  
  let totalFilesPatched = 0;
  let totalPatchesApplied = 0;
  
  filesToPatch.forEach((filePath, index) => {
    console.log(`${index + 1}. Analyzing: ${filePath}`);
    
    try {
      if (fs.existsSync(filePath)) {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        
        // Check if file contains Freepik references
        if (originalContent.includes('freepik') || originalContent.includes('Freepik')) {
          console.log(`   🎯 Found Freepik references`);
          
          const { content: modifiedContent, patchesApplied } = findAndPatchContent(originalContent, patches);
          
          if (patchesApplied > 0) {
            fs.writeFileSync(filePath, modifiedContent);
            console.log(`   ✅ PATCHED: ${filePath} (${patchesApplied} changes)`);
            totalFilesPatched++;
            totalPatchesApplied += patchesApplied;
          } else {
            console.log(`   ℹ️  No specific patterns to patch in ${filePath}`);
          }
        } else {
          console.log(`   ✓ No Freepik references found`);
        }
      } else {
        console.log(`   ⚠️  File not found: ${filePath}`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error processing ${filePath}:`, error.message);
      console.log('');
    }
  });
  
  // Create a comprehensive disable patch for pipeline
  patchPipelineSpecifically();
  
  console.log('📊 PATCH SUMMARY:');
  console.log(`   Files modified: ${totalFilesPatched}`);
  console.log(`   Total patches: ${totalPatchesApplied}`);
  
  if (totalPatchesApplied > 0) {
    console.log('\n🎯 EFFECTS:');
    console.log('   ✅ Freepik fallback disabled - prevents cost spikes');
    console.log('   ✅ Gemini 2.5 Flash Image kept for rendering (3.9¢/generation)');
    console.log('   ✅ Analysis remains on cheap flash-lite models');
    console.log('   ✅ Base64 token costs from Freepik eliminated');
    
    console.log('\n💰 COST IMPACT:');
    console.log('   • Rendering: ~3.9¢ per image (Gemini Flash Image)');
    console.log('   • Analysis: ~0.1¢ per image (flash-lite)');
    console.log('   • Total per image: ~4¢ (predictable and reasonable)');
    console.log('   • No more Freepik base64 token costs (50K-200K tokens)');
    
    console.log('\n🔄 TO RE-ENABLE FREEPIK (if needed):');
    console.log('   • Revert changes from backup');
    console.log('   • Or manually uncomment disabled code');
    console.log('   • Set FREEPIK_API_KEY in environment');
  } else {
    console.log('\n✅ No Freepik references found - already clean!');
  }
}

function patchPipelineSpecifically() {
  const pipelineFile = 'lib/ghost/pipeline.ts';
  
  console.log('🎯 Applying specific pipeline patches...');
  
  if (!fs.existsSync(pipelineFile)) {
    console.log('   ⚠️  Pipeline file not found');
    return;
  }
  
  try {
    let content = fs.readFileSync(pipelineFile, 'utf8');
    let modified = false;
    
    // Force rendering model to ai-studio only
    if (content.includes('renderingModel')) {
      content = content.replace(
        /const renderingModel = .*/g, 
        'const renderingModel = "ai-studio"; // Freepik disabled for cost control'
      );
      modified = true;
      console.log('   ✓ Forced rendering model to ai-studio');
    }
    
    // Disable Freepik switch case
    if (content.includes('case "freepik"')) {
      content = content.replace(
        /case "freepik":\s*[\s\S]*?break;/gi,
        'case "freepik":\n        throw new GhostPipelineError("Freepik disabled for cost control", "FREEPIK_DISABLED", "rendering");\n        break;'
      );
      modified = true;
      console.log('   ✓ Disabled Freepik case in switch statement');
    }
    
    // Comment out Freepik imports
    if (content.includes('from \'./freepik\'')) {
      content = content.replace(
        /import .* from ['"]\.\/freepik['"];/g,
        '// import from \'./freepik\' disabled for cost control'
      );
      modified = true;
      console.log('   ✓ Disabled Freepik imports');
    }
    
    if (modified) {
      fs.writeFileSync(pipelineFile, content);
      console.log('   ✅ Pipeline specifically patched');
    }
    
  } catch (error) {
    console.error('   ❌ Pipeline patching failed:', error.message);
  }
  
  console.log('');
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backup-freepik-disable-${timestamp}`;
  
  console.log(`📦 Creating backup in ${backupDir}/`);
  
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const filesToBackup = [
      'lib/ghost/pipeline.ts',
      'app/api/ghost/route.ts',
      'lib/ghost/freepik.ts',
      '.env.example',
      'types/ghost.ts'
    ];
    
    filesToBackup.forEach(file => {
      if (fs.existsSync(file)) {
        const backupPath = `${backupDir}/${file.replace(/\//g, '_')}`;
        fs.copyFileSync(file, backupPath);
        console.log(`   ✅ Backed up: ${file}`);
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
    console.log('🎯 DISABLE FREEPIK FALLBACK (COST CONTROL)');
    console.log('==========================================');
    console.log('This will:');
    console.log('• Keep Gemini 2.5 Flash Image for rendering (3.9¢/generation)');
    console.log('• Disable Freepik fallback to prevent cost spikes');
    console.log('• Keep analysis on cheap flash-lite models');
    console.log('• Eliminate base64 token costs from Freepik');
    console.log('\nTo proceed: node scripts/disable-freepik-fallback.js --force');
    console.log('To skip backup: node scripts/disable-freepik-fallback.js --force --no-backup');
    return;
  }
  
  if (backup) {
    if (!createBackup()) {
      console.log('❌ Backup failed. Use --no-backup to skip backup and proceed anyway.');
      return;
    }
    console.log('');
  }
  
  analyzeAndPatch();
}

if (require.main === module) {
  main();
}

module.exports = { analyzeAndPatch, createBackup };