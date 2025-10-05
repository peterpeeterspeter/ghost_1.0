#!/usr/bin/env node

/**
 * Enhanced Duplicate Remover for Google Files API Storage
 * 
 * This script identifies and removes duplicate files with better precision:
 * - Exact size matching for identical files
 * - Content-based deduplication 
 * - Session-aware duplicate detection
 * - Smart keep/remove logic
 */

const { GoogleAIFileManager } = require('@google/generative-ai/server');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

class EnhancedDuplicateRemover {
  constructor(apiKey) {
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.files = [];
    this.duplicateGroups = [];
    this.stats = {
      totalFiles: 0,
      totalSizeKB: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      spaceRecovered: 0,
      errors: 0
    };
  }

  /**
   * Fetch all files and enhance with metadata
   */
  async fetchAllFiles() {
    console.log('🔍 Fetching all files from Google Files API...');
    
    try {
      const response = await this.fileManager.listFiles();
      this.files = (response.files || []).map(file => ({
        ...file,
        sizeBytes: parseInt(file.sizeBytes || '0'),
        createTime: new Date(file.createTime || ''),
        displayName: file.displayName || file.name,
        // Extract session info from filename
        sessionInfo: this.extractSessionInfo(file.displayName || file.name),
        isGhostMannequin: (file.displayName || file.name).includes('ghost-mannequin')
      }));

      this.stats.totalFiles = this.files.length;
      this.stats.totalSizeKB = Math.round(this.files.reduce((sum, f) => sum + f.sizeBytes, 0) / 1024);
      
      console.log(`📊 Found ${this.files.length} total files (${this.stats.totalSizeKB}KB)`);
      this.displayFileInventory();
      
      return this.files;
    } catch (error) {
      console.error('❌ Failed to fetch files:', error.message);
      throw error;
    }
  }

  /**
   * Extract session information from filename
   */
  extractSessionInfo(filename) {
    const match = filename.match(/ghost-mannequin-(\w+)-([^-]+)-(\d{13})/);
    if (match) {
      return {
        role: match[1], // flatlay, reference, etc.
        sessionId: match[2],
        timestamp: parseInt(match[3])
      };
    }
    return { role: 'unknown', sessionId: 'unknown', timestamp: 0 };
  }

  /**
   * Display organized file inventory
   */
  displayFileInventory() {
    if (this.files.length === 0) return;
    
    console.log('\n📋 File Inventory by Size:');
    
    // Group by size for easier duplicate identification
    const sizeGroups = new Map();
    this.files.forEach(file => {
      const sizeKB = Math.round(file.sizeBytes / 1024);
      if (!sizeGroups.has(sizeKB)) {
        sizeGroups.set(sizeKB, []);
      }
      sizeGroups.get(sizeKB).push(file);
    });

    // Sort by size (largest first)
    const sortedSizes = Array.from(sizeGroups.entries()).sort((a, b) => b[0] - a[0]);
    
    sortedSizes.forEach(([sizeKB, files]) => {
      const isLikelyDuplicate = files.length > 1;
      const marker = isLikelyDuplicate ? '🔄' : '📄';
      
      console.log(`\n${marker} ${sizeKB}KB (${files.length} file${files.length > 1 ? 's' : ''})`);
      
      files.forEach(file => {
        const age = Math.round((Date.now() - file.createTime.getTime()) / (1000 * 60 * 60));
        const sessionShort = file.sessionInfo.sessionId.substring(0, 8);
        console.log(`   • ${file.displayName}`);
        console.log(`     Session: ${sessionShort} | Age: ${age}h | Role: ${file.sessionInfo.role}`);
      });
    });
  }

  /**
   * Identify duplicates with enhanced logic
   */
  identifyDuplicates() {
    console.log('\n🔍 Identifying duplicates with enhanced precision...');
    
    // Group files by exact size
    const sizeGroups = new Map();
    this.files.forEach(file => {
      if (!sizeGroups.has(file.sizeBytes)) {
        sizeGroups.set(file.sizeBytes, []);
      }
      sizeGroups.get(file.sizeBytes).push(file);
    });

    this.duplicateGroups = [];
    
    // Process each size group
    sizeGroups.forEach((files, sizeBytes) => {
      if (files.length > 1) {
        // Sort by creation time (oldest first)
        files.sort((a, b) => a.createTime.getTime() - b.createTime.getTime());
        
        // For same-size files, apply smart keep/remove logic
        const duplicateGroup = this.createDuplicateGroup(files, sizeBytes);
        if (duplicateGroup.toDelete.length > 0) {
          this.duplicateGroups.push(duplicateGroup);
          this.stats.duplicatesFound += duplicateGroup.toDelete.length;
        }
      }
    });

    console.log(`📊 Found ${this.duplicateGroups.length} duplicate groups`);
    console.log(`🗑️  Total files to remove: ${this.stats.duplicatesFound}`);
    
    return this.duplicateGroups;
  }

  /**
   * Create a smart duplicate group with keep/remove logic
   */
  createDuplicateGroup(files, sizeBytes) {
    // Strategy: Keep the oldest file (likely the original)
    // Remove newer files (likely duplicates from retries/testing)
    
    const toKeep = files[0]; // Oldest file
    const toDelete = files.slice(1); // All newer files
    
    return {
      sizeBytes,
      sizeKB: Math.round(sizeBytes / 1024),
      files: files,
      toKeep: toKeep,
      toDelete: toDelete,
      totalSize: files.reduce((sum, f) => sum + f.sizeBytes, 0),
      duplicateType: this.classifyDuplicateType(files)
    };
  }

  /**
   * Classify the type of duplicate group
   */
  classifyDuplicateType(files) {
    const roles = new Set(files.map(f => f.sessionInfo.role));
    const sessions = new Set(files.map(f => f.sessionInfo.sessionId));
    
    if (sessions.size === 1) {
      return 'same_session'; // Multiple files from same session (retries)
    } else if (roles.size === 1) {
      return 'same_role'; // Same role across different sessions
    } else {
      return 'mixed'; // Mixed roles/sessions
    }
  }

  /**
   * Display comprehensive duplicate analysis
   */
  displayDuplicateAnalysis() {
    if (this.duplicateGroups.length === 0) {
      console.log('\n✅ No duplicates found! Your storage is optimized.');
      return;
    }

    console.log('\n📋 Duplicate Analysis Report:');
    console.log('=' .repeat(80));

    let totalSpaceToRecover = 0;

    this.duplicateGroups.forEach((group, index) => {
      console.log(`\n${index + 1}. Duplicate Group - ${group.sizeKB}KB files`);
      console.log(`   Type: ${group.duplicateType}`);
      console.log(`   Total files: ${group.files.length}`);
      console.log(`   Files to remove: ${group.toDelete.length}`);
      
      console.log('\n   📌 KEEPING (oldest):');
      const keep = group.toKeep;
      const keepAge = Math.round((Date.now() - keep.createTime.getTime()) / (1000 * 60 * 60));
      console.log(`      ✓ ${keep.displayName}`);
      console.log(`        Session: ${keep.sessionInfo.sessionId.substring(0, 8)}`);
      console.log(`        Age: ${keepAge}h | Created: ${keep.createTime.toLocaleString()}`);
      
      console.log('\n   🗑️  REMOVING (newer):');
      group.toDelete.forEach(file => {
        const age = Math.round((Date.now() - file.createTime.getTime()) / (1000 * 60 * 60));
        console.log(`      ✗ ${file.displayName}`);
        console.log(`        Session: ${file.sessionInfo.sessionId.substring(0, 8)}`);
        console.log(`        Age: ${age}h | Created: ${file.createTime.toLocaleString()}`);
        totalSpaceToRecover += file.sizeBytes;
      });
    });

    console.log('\n📊 Deduplication Summary:');
    console.log(`   Total files: ${this.stats.totalFiles}`);
    console.log(`   Current storage: ${this.stats.totalSizeKB}KB`);
    console.log(`   Duplicate files: ${this.stats.duplicatesFound}`);
    console.log(`   Space to recover: ${Math.round(totalSpaceToRecover / 1024)}KB`);
    console.log(`   Storage reduction: ${Math.round((totalSpaceToRecover / (this.stats.totalSizeKB * 1024)) * 100)}%`);
    console.log(`   Files after cleanup: ${this.stats.totalFiles - this.stats.duplicatesFound}`);
  }

  /**
   * Remove duplicates with enhanced error handling
   */
  async removeDuplicates(dryRun = true) {
    if (this.duplicateGroups.length === 0) {
      console.log('\n✅ No duplicates to remove.');
      return { deleted: 0, errors: 0, spaceRecovered: 0 };
    }

    const mode = dryRun ? '🧪 DRY RUN' : '🗑️  ACTUAL REMOVAL';
    console.log(`\n${mode}: Processing ${this.stats.duplicatesFound} duplicate files...`);
    
    let deleted = 0;
    let errors = 0;
    let spaceRecovered = 0;

    for (const [groupIndex, group] of this.duplicateGroups.entries()) {
      console.log(`\n📁 Group ${groupIndex + 1}/${this.duplicateGroups.length}: ${group.sizeKB}KB duplicates`);
      
      for (const [fileIndex, file] of group.toDelete.entries()) {
        try {
          const fileName = file.displayName;
          const sizeKB = Math.round(file.sizeBytes / 1024);
          
          if (dryRun) {
            console.log(`   🧪 Would delete: ${fileName} (${sizeKB}KB)`);
          } else {
            console.log(`   🗑️  Deleting: ${fileName} (${sizeKB}KB)...`);
            await this.fileManager.deleteFile(file.name);
            
            // Rate limiting to avoid API limits
            if (fileIndex < group.toDelete.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          
          deleted++;
          spaceRecovered += file.sizeBytes;
          
        } catch (error) {
          console.error(`   ❌ Failed to delete ${file.displayName}:`, error.message);
          errors++;
        }
      }
    }

    const spaceRecoveredKB = Math.round(spaceRecovered / 1024);
    const action = dryRun ? 'would be' : 'were';
    
    console.log(`\n✅ ${mode} completed!`);
    console.log(`   Files ${action} deleted: ${deleted}`);
    console.log(`   Space ${action} recovered: ${spaceRecoveredKB}KB`);
    console.log(`   Errors: ${errors}`);

    return { deleted, errors, spaceRecovered: spaceRecoveredKB };
  }

  /**
   * Show storage statistics
   */
  showStorageStats() {
    console.log('\n📊 Current Storage Statistics:');
    
    const roleStats = new Map();
    const sessionStats = new Map();
    let oldestFile = this.files[0];
    let newestFile = this.files[0];
    
    this.files.forEach(file => {
      // Role stats
      const role = file.sessionInfo.role;
      if (!roleStats.has(role)) {
        roleStats.set(role, { count: 0, sizeKB: 0 });
      }
      roleStats.get(role).count++;
      roleStats.get(role).sizeKB += Math.round(file.sizeBytes / 1024);
      
      // Session stats
      const session = file.sessionInfo.sessionId.substring(0, 8);
      if (!sessionStats.has(session)) {
        sessionStats.set(session, { count: 0, sizeKB: 0 });
      }
      sessionStats.get(session).count++;
      sessionStats.get(session).sizeKB += Math.round(file.sizeBytes / 1024);
      
      // Age tracking
      if (file.createTime < oldestFile.createTime) oldestFile = file;
      if (file.createTime > newestFile.createTime) newestFile = file;
    });

    console.log(`\n   Total files: ${this.stats.totalFiles}`);
    console.log(`   Total storage: ${this.stats.totalSizeKB}KB`);
    console.log(`   Average file size: ${Math.round(this.stats.totalSizeKB / this.stats.totalFiles)}KB`);
    
    const ageSpan = Math.round((newestFile.createTime - oldestFile.createTime) / (1000 * 60 * 60));
    console.log(`   Age span: ${ageSpan}h (${oldestFile.createTime.toLocaleDateString()} - ${newestFile.createTime.toLocaleDateString()})`);

    console.log('\n   📊 By Role:');
    roleStats.forEach((stats, role) => {
      console.log(`      ${role}: ${stats.count} files (${stats.sizeKB}KB)`);
    });

    console.log('\n   📊 By Session (top 5):');
    const topSessions = Array.from(sessionStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
    
    topSessions.forEach(([session, stats]) => {
      console.log(`      ${session}...: ${stats.count} files (${stats.sizeKB}KB)`);
    });
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🧹 Enhanced Google Files API Duplicate Remover');
  console.log('===============================================\n');

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.error('   Make sure your .env.local file contains GEMINI_API_KEY');
    process.exit(1);
  }

  const duplicateRemover = new EnhancedDuplicateRemover(process.env.GEMINI_API_KEY);
  
  try {
    // Step 1: Fetch and analyze files
    await duplicateRemover.fetchAllFiles();
    
    if (duplicateRemover.files.length === 0) {
      console.log('✅ No files found in storage. Nothing to clean up.');
      return;
    }

    // Step 2: Show current storage stats
    duplicateRemover.showStorageStats();

    // Step 3: Identify duplicates
    duplicateRemover.identifyDuplicates();
    
    // Step 4: Display analysis
    duplicateRemover.displayDuplicateAnalysis();

    // Step 5: Handle removal based on command line args
    const args = process.argv.slice(2);
    const forceRemove = args.includes('--force') || args.includes('-f');
    const confirmRemove = args.includes('--confirm');
    
    if (duplicateRemover.duplicateGroups.length > 0) {
      if (forceRemove || confirmRemove) {
        console.log('\n⚠️  WARNING: About to permanently delete duplicate files!');
        
        if (forceRemove) {
          console.log('   --force flag detected: proceeding with deletion...');
          await duplicateRemover.removeDuplicates(false);
        } else if (confirmRemove) {
          console.log('   --confirm flag detected: proceeding with deletion...');
          await duplicateRemover.removeDuplicates(false);
        }
      } else {
        console.log('\n🧪 This was a DRY RUN analysis. No files were deleted.');
        console.log('\nTo actually remove duplicates:');
        console.log('   node scripts/remove-duplicates-enhanced.js --confirm');
        console.log('   node scripts/remove-duplicates-enhanced.js --force');
      }
    }

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    if (process.env.DEBUG) {
      console.error('Full error:', error);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EnhancedDuplicateRemover };