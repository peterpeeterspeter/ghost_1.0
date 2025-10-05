// 💾 Analysis Cache - Reusable analysis storage and retrieval
// Enables cost savings by reusing expensive analysis results

import { CachedAnalysis, CacheStats, AnalysisCache } from '../../types/flatlay';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

export class AnalysisCache implements AnalysisCache {
  private cacheDir: string;
  private indexFile: string;
  
  constructor() {
    this.cacheDir = join(process.cwd(), '.cache', 'flatlay-analysis');
    this.indexFile = join(this.cacheDir, 'index.json');
    this.ensureCacheDir();
  }
  
  /**
   * Store analysis in cache
   */
  async store(analysis: CachedAnalysis): Promise<void> {
    try {
      const filePath = join(this.cacheDir, `${analysis.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
      
      // Update index
      await this.updateIndex(analysis);
      
      console.log(`💾 Cached analysis: ${analysis.id}`);
    } catch (error) {
      console.error('❌ Failed to cache analysis:', error);
      throw error;
    }
  }
  
  /**
   * Retrieve analysis by ID
   */
  async retrieve(id: string): Promise<CachedAnalysis | null> {
    try {
      const filePath = join(this.cacheDir, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const analysis = JSON.parse(data) as CachedAnalysis;
      
      // Update usage count
      analysis.usageCount++;
      await this.store(analysis);
      
      console.log(`🎯 Retrieved cached analysis: ${id} (usage: ${analysis.usageCount})`);
      return analysis;
    } catch (error) {
      console.log(`⚠️ Analysis not found: ${id}`);
      return null;
    }
  }
  
  /**
   * Find analysis by image hash
   */
  async findByImageHash(hash: string): Promise<CachedAnalysis | null> {
    try {
      const index = await this.getIndex();
      const entry = index.find(item => item.imageHash === hash);
      
      if (!entry) {
        return null;
      }
      
      // Check if not expired
      if (new Date(entry.expiresAt) < new Date()) {
        console.log(`⏰ Cached analysis expired: ${entry.id}`);
        await this.delete(entry.id);
        return null;
      }
      
      return await this.retrieve(entry.id);
    } catch (error) {
      console.error('❌ Failed to find analysis by hash:', error);
      return null;
    }
  }
  
  /**
   * Clean up expired analyses
   */
  async cleanup(): Promise<number> {
    try {
      const index = await this.getIndex();
      const now = new Date();
      let cleanedCount = 0;
      
      for (const entry of index) {
        if (new Date(entry.expiresAt) < now) {
          await this.delete(entry.id);
          cleanedCount++;
        }
      }
      
      console.log(`🧹 Cleaned up ${cleanedCount} expired analyses`);
      return cleanedCount;
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return 0;
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const index = await this.getIndex();
      const now = new Date();
      
      const validEntries = index.filter(entry => new Date(entry.expiresAt) > now);
      const totalSize = validEntries.reduce((sum, entry) => sum + entry.size, 0);
      const totalUsage = validEntries.reduce((sum, entry) => sum + entry.usageCount, 0);
      
      const sortedByDate = validEntries.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      return {
        totalAnalyses: validEntries.length,
        totalSize,
        oldestAnalysis: sortedByDate[0]?.createdAt || '',
        newestAnalysis: sortedByDate[sortedByDate.length - 1]?.createdAt || '',
        hitRate: validEntries.length > 0 ? totalUsage / validEntries.length : 0,
        averageUsage: validEntries.length > 0 ? totalUsage / validEntries.length : 0
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return {
        totalAnalyses: 0,
        totalSize: 0,
        oldestAnalysis: '',
        newestAnalysis: '',
        hitRate: 0,
        averageUsage: 0
      };
    }
  }
  
  /**
   * Delete analysis from cache
   */
  private async delete(id: string): Promise<void> {
    try {
      const filePath = join(this.cacheDir, `${id}.json`);
      await fs.unlink(filePath);
      
      // Update index
      const index = await this.getIndex();
      const updatedIndex = index.filter(entry => entry.id !== id);
      await fs.writeFile(this.indexFile, JSON.stringify(updatedIndex, null, 2));
      
      console.log(`🗑️ Deleted cached analysis: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to delete analysis ${id}:`, error);
    }
  }
  
  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      // Create index file if it doesn't exist
      try {
        await fs.access(this.indexFile);
      } catch {
        await fs.writeFile(this.indexFile, '[]');
      }
    } catch (error) {
      console.error('❌ Failed to create cache directory:', error);
    }
  }
  
  /**
   * Get cache index
   */
  private async getIndex(): Promise<any[]> {
    try {
      const data = await fs.readFile(this.indexFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to read cache index:', error);
      return [];
    }
  }
  
  /**
   * Update cache index
   */
  private async updateIndex(analysis: CachedAnalysis): Promise<void> {
    try {
      const index = await this.getIndex();
      const existingIndex = index.findIndex(entry => entry.id === analysis.id);
      
      const indexEntry = {
        id: analysis.id,
        imageHash: analysis.imageHash,
        createdAt: analysis.createdAt,
        expiresAt: analysis.expiresAt,
        usageCount: analysis.usageCount,
        size: JSON.stringify(analysis).length
      };
      
      if (existingIndex >= 0) {
        index[existingIndex] = indexEntry;
      } else {
        index.push(indexEntry);
      }
      
      await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error('❌ Failed to update cache index:', error);
    }
  }
}

