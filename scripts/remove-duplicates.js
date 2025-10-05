#!/usr/bin/env node

/**
 * Remove Duplicates from Google Files API Storage
 * 
 * This script identifies and removes duplicate files from Google's Files API storage
 * based on content similarity, size, and naming patterns.
 */

const { GoogleAIFileManager } = require('@google/generative-ai/server');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

class DuplicateRemover {
  constructor(apiKey) {
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.files = [];
    this.duplicateGroups = [];
    this.stats = {
      totalFiles: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      spaceRecovered: 0,
      errors: 0
    };
  }

  /**
   * Generate a content signature from file metadata
   * Files with same size + similar names are likely duplicates
   */
  generateContentSignature(file) {
    // Extract meaningful parts from filename
    const nameWithoutTimestamp = file.displayName 
      ? file.displayName.replace(/-\d{13}\./, '.').replace(/ghost-mannequin-/, '')
      : file.name;
    
    // Create signature based on size + cleaned name
    const signature = crypto
      .createHash('md5')
      .update(`${file.sizeBytes}-${nameWithoutTimestamp}`)
      .digest('hex')
      .substring(0, 12);
    
    return signature;
  }

  /**
   * Fetch all files from Google Files API
   */
  async fetchAllFiles() {
    console.log('🔍 Fetching all files from Google Files API...');
    
    try {
      const response = await this.fileManager.listFiles();
      this.files = response.files || [];
      this.stats.totalFiles = this.files.length;
      
      console.log(`📊 Found ${this.files.length} total files`);
      
      // Log file details
      if (this.files.length > 0) {
        console.log('\n📋 File inventory:');
        this.files.forEach((file, index) => {
          const sizeKB = Math.round(parseInt(file.sizeBytes || '0') / 1024);
          const createDate = new Date(file.createTime || '').toLocaleDateString();
          console.log(`  ${index + 1}. ${file.displayName || file.name} (${sizeKB}KB) - ${createDate}`);
        });
      }
      
      return this.files;
    } catch (error) {
      console.error('❌ Failed to fetch files:', error.message);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Identify duplicate files based on content signatures
   */
  identifyDuplicates() {
    console.log('\n🔍 Analyzing files for duplicates...');
    
    const signatureMap = new Map();
    
    // Group files by content signature
    this.files.forEach(file => {
      const signature = this.generateContentSignature(file);
      
      if (!signatureMap.has(signature)) {
        signatureMap.set(signature, []);
      }
      
      signatureMap.get(signature).push({
        ...file,
        signature,
        sizeBytes: parseInt(file.sizeBytes || '0'),
        createTime: new Date(file.createTime || ''),
        isGhostMannequin: (file.displayName || file.name).includes('ghost-mannequin')
      });
    });

    // Find groups with more than one file (duplicates)
    this.duplicateGroups = [];
    
    signatureMap.forEach((fileGroup, signature) => {
      if (fileGroup.length > 1) {
        // Sort by creation time (keep oldest, remove newest)
        fileGroup.sort((a, b) => a.createTime.getTime() - b.createTime.getTime());
        
        this.duplicateGroups.push({
          signature,
          files: fileGroup,
          toKeep: fileGroup[0], // Keep the oldest file
          toDelete: fileGroup.slice(1), // Delete newer duplicates
          totalSize: fileGroup.reduce((sum, f) => sum + f.sizeBytes, 0)
        });
        
        this.stats.duplicatesFound += fileGroup.length - 1;
      }
    });

    console.log(`📊 Found ${this.duplicateGroups.length} groups with duplicates`);
    console.log(`🗑️  Total duplicates to remove: ${this.stats.duplicatesFound}`);

    return this.duplicateGroups;
  }

  /**
   * Display duplicate analysis results
   */
  displayDuplicateAnalysis() {
    if (this.duplicateGroups.length === 0) {
      console.log('✅ No duplicates found! Your storage is already optimized.');
      return;
    }

    console.log('\n📋 Duplicate Analysis Report:');
    console.log('=' .repeat(80));

    this.duplicateGroups.forEach((group, index) => {
      console.log(`\n${index + 1}. Signature: ${group.signature}`);
      console.log(`   Total files: ${group.files.length}`);
      console.log(`   Total size: ${Math.round(group.totalSize / 1024)}KB`);
      
      console.log('   📌 Keeping:');
      const keepFile = group.toKeep;
      console.log(`      ✓ ${keepFile.displayName || keepFile.name}`);
      console.log(`        Size: ${Math.round(keepFile.sizeBytes / 1024)}KB`);
      console.log(`        Created: ${keepFile.createTime.toLocaleString()}`);
      console.log(`        URI: ${keepFile.uri}`);
      
      console.log('   🗑️  Removing:');
      group.toDelete.forEach(file => {
        console.log(`      ✗ ${file.displayName || file.name}`);
        console.log(`        Size: ${Math.round(file.sizeBytes / 1024)}KB`);
        console.log(`        Created: ${file.createTime.toLocaleString()}`);
        console.log(`        URI: ${file.uri}`);
      });
    });

    const spaceToRecover = this.duplicateGroups.reduce((sum, group) => {
      return sum + group.toDelete.reduce((groupSum, file) => groupSum + file.sizeBytes, 0);
    }, 0);

    console.log('\n📊 Summary:');
    console.log(`   Total files: ${this.stats.totalFiles}`);
    console.log(`   Duplicate files: ${this.stats.duplicatesFound}`);
    console.log(`   Space to recover: ${Math.round(spaceToRecover / 1024)}KB`);
    console.log(`   Storage reduction: ${Math.round((spaceToRecover / this.files.reduce((sum, f) => sum + parseInt(f.sizeBytes || '0'), 0)) * 100)}%`);
  }

  /**
   * Remove duplicate files from storage
   */
  async removeDuplicates(dryRun = true) {
    if (this.duplicateGroups.length === 0) {
      console.log('✅ No duplicates to remove.');
      return;
    }

    console.log(`\n${dryRun ? '🧪 DRY RUN' : '🗑️  REMOVING'}: Processing ${this.stats.duplicatesFound} duplicate files...`);
    
    for (const group of this.duplicateGroups) {
      console.log(`\n📁 Processing signature: ${group.signature}`);
      
      for (const file of group.toDelete) {
        try {
          if (!dryRun) {
            console.log(`   🗑️  Deleting: ${file.displayName || file.name}...`);
            await this.fileManager.deleteFile(file.name);
            await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
          } else {
            console.log(`   🧪 Would delete: ${file.displayName || file.name}`);
          }
          
          this.stats.duplicatesRemoved++;
          this.stats.spaceRecovered += file.sizeBytes;
          
        } catch (error) {
          console.error(`   ❌ Failed to delete ${file.displayName || file.name}:`, error.message);
          this.stats.errors++;
        }
      }
    }

    console.log(`\n✅ ${dryRun ? 'DRY RUN' : 'REMOVAL'} completed!`);
    console.log(`   Files ${dryRun ? 'would be' : ''} removed: ${this.stats.duplicatesRemoved}`);
    console.log(`   Space ${dryRun ? 'would be' : ''} recovered: ${Math.round(this.stats.spaceRecovered / 1024)}KB`);
    console.log(`   Errors: ${this.stats.errors}`);
  }

  /**
   * Advanced deduplication with smart pattern matching
   */
  identifyAdvancedDuplicates() {
    console.log('\n🔍 Running advanced duplicate detection...');
    
    const advancedGroups = new Map();
    
    // Group by more sophisticated patterns
    this.files.forEach(file => {
      // Extract session pattern from filename
      const sessionMatch = (file.displayName || file.name).match(/ghost-mannequin-(\w+)-([^-]+)-/);
      const role = sessionMatch ? sessionMatch[1] : 'unknown';
      const sessionId = sessionMatch ? sessionMatch[2] : 'unknown';
      
      // Create advanced key
      const sizeGroup = Math.floor(parseInt(file.sizeBytes || '0') / 10240) * 10; // Group by 10KB ranges
      const advancedKey = `${role}-${sizeGroup}kb`;
      
      if (!advancedGroups.has(advancedKey)) {
        advancedGroups.set(advancedKey, []);
      }
      
      advancedGroups.get(advancedKey).push({
        ...file,
        role,
        sessionId,
        sizeBytes: parseInt(file.sizeBytes || '0'),
        createTime: new Date(file.createTime || ''),
        advancedKey
      });
    });

    // Find potential advanced duplicates
    const advancedDuplicates = [];
    
    advancedGroups.forEach((fileGroup, key) => {
      if (fileGroup.length > 1) {
        // Check if files are actually similar (not just same size range)
        const similarFiles = this.findSimilarFilesInGroup(fileGroup);
        
        if (similarFiles.length > 1) {
          similarFiles.sort((a, b) => a.createTime.getTime() - b.createTime.getTime());
          
          advancedDuplicates.push({
            key,
            files: similarFiles,
            toKeep: similarFiles[0],
            toDelete: similarFiles.slice(1)
          });
        }
      }
    });

    if (advancedDuplicates.length > 0) {
      console.log(`🎯 Advanced analysis found ${advancedDuplicates.length} additional potential duplicate groups`);
      
      advancedDuplicates.forEach((group, index) => {
        console.log(`\n   ${index + 1}. Pattern: ${group.key}`);
        console.log(`      Files: ${group.files.length} (${group.toDelete.length} duplicates)`);
        group.toDelete.forEach(file => {
          console.log(`      - ${file.displayName || file.name} (${Math.round(file.sizeBytes / 1024)}KB)`);
        });
      });
    }

    return advancedDuplicates;
  }

  /**
   * Find similar files within a group based on exact size and naming patterns
   */
  findSimilarFilesInGroup(fileGroup) {
    const sizeMap = new Map();
    
    // Group by exact size
    fileGroup.forEach(file => {
      if (!sizeMap.has(file.sizeBytes)) {
        sizeMap.set(file.sizeBytes, []);
      }
      sizeMap.get(file.sizeBytes).push(file);
    });
    
    // Return files that have exact size matches
    const similarFiles = [];
    sizeMap.forEach(files => {
      if (files.length > 1) {
        similarFiles.push(...files);
      }
    });
    
    return similarFiles;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🧹 Google Files API Duplicate Remover');
  console.log('====================================\n');

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.error('   Make sure your .env.local file contains GEMINI_API_KEY');
    process.exit(1);
  }

  const duplicateRemover = new DuplicateRemover(process.env.GEMINI_API_KEY);

  try {
    // Step 1: Fetch all files
    await duplicateRemover.fetchAllFiles();
    
    if (duplicateRemover.files.length === 0) {
      console.log('✅ No files found in storage. Nothing to clean up.');
      return;
    }

    // Step 2: Identify duplicates
    duplicateRemover.identifyDuplicates();
    
    // Step 3: Display analysis
    duplicateRemover.displayDuplicateAnalysis();
    
    // Step 4: Advanced detection (optional)
    const advancedDuplicates = duplicateRemover.identifyAdvancedDuplicates();

    // Step 5: Ask for confirmation
    const args = process.argv.slice(2);
    const forceRemove = args.includes('--force') || args.includes('-f');
    const dryRun = !forceRemove;
    
    if (duplicateRemover.duplicateGroups.length > 0) {
      if (dryRun) {
        console.log('\n🧪 This was a DRY RUN. No files were actually deleted.');
        console.log('   To actually remove duplicates, run:');
        console.log('   node scripts/remove-duplicates.js --force');
      } else {
        console.log('\n⚠️  WARNING: You are about to permanently delete files!');
        console.log('   This action cannot be undone.');
        
        // In force mode, proceed with removal
        await duplicateRemover.removeDuplicates(false);
      }
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DuplicateRemover };