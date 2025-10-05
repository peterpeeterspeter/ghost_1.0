// 🖼️ Flatlay Image Generator Types
// Reuses Ghost Mannequin analysis pipeline with flatlay-specific rendering

import { AnalysisJSON, EnrichmentJSON } from '@ghost-platform/ghost-mannequin';

// Flatlay-specific types
export interface FlatlayRequest {
  flatlayImage: string;           // Input flatlay image (URL or base64)
  originalImage?: string;         // Optional on-model reference
  options?: FlatlayOptions;
}

export interface FlatlayOptions {
  style?: 'minimal' | 'lifestyle' | 'commercial' | 'editorial';
  background?: 'white' | 'colored' | 'textured' | 'transparent';
  lighting?: 'natural' | 'studio' | 'soft' | 'dramatic';
  composition?: 'centered' | 'asymmetric' | 'grid' | 'organic';
  quality?: 'standard' | 'high' | 'premium';
  cacheAnalysis?: boolean;        // Whether to cache analysis results
  reuseAnalysisId?: string;      // ID of cached analysis to reuse
}

export interface FlatlayResult {
  success: boolean;
  imageUrl?: string;
  processingTime: number;
  cost?: number;
  analysisId?: string;           // ID for caching analysis
  metadata?: FlatlayMetadata;
  error?: string;
}

export interface FlatlayMetadata {
  model: string;
  style: string;
  background: string;
  lighting: string;
  composition: string;
  analysisReused: boolean;
  analysisId?: string;
  inputImageSize: number;
  outputImageSize: number;
  tokenUsage: {
    analysis: number;
    rendering: number;
    total: number;
  };
  costBreakdown: {
    analysis: number;
    rendering: number;
    total: number;
  };
}

// Cached analysis structure
export interface CachedAnalysis {
  id: string;
  analysis: AnalysisJSON;
  enrichment?: EnrichmentJSON;
  imageHash: string;             // Content hash for deduplication
  createdAt: string;
  expiresAt: string;
  usageCount: number;
  metadata: {
    originalImageSize: number;
    processingTime: number;
    cost: number;
  };
}

// Flatlay-specific prompts
export interface FlatlayPrompts {
  minimal: string;
  lifestyle: string;
  commercial: string;
  editorial: string;
}

// Analysis cache management
export interface AnalysisCache {
  store(analysis: CachedAnalysis): Promise<void>;
  retrieve(id: string): Promise<CachedAnalysis | null>;
  findByImageHash(hash: string): Promise<CachedAnalysis | null>;
  cleanup(): Promise<number>;    // Returns number of cleaned items
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  totalAnalyses: number;
  totalSize: number;
  oldestAnalysis: string;
  newestAnalysis: string;
  hitRate: number;
  averageUsage: number;
}

// Flatlay rendering configuration
export interface FlatlayRenderConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  style: string;
  background: string;
  lighting: string;
  composition: string;
  quality: string;
}

// Error types specific to flatlay
export class FlatlayError extends Error {
  constructor(
    message: string,
    public code: 'ANALYSIS_FAILED' | 'RENDERING_FAILED' | 'CACHE_ERROR' | 'VALIDATION_ERROR',
    public stage: 'analysis' | 'rendering' | 'caching' | 'validation',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FlatlayError';
  }
}

