// 🖼️ Flatlay Image Generator - Main Processor
// Reuses Ghost Mannequin analysis pipeline with flatlay-specific rendering

import { 
  FlatlayRequest, 
  FlatlayResult, 
  FlatlayOptions, 
  FlatlayMetadata,
  FlatlayError,
  CachedAnalysis
} from '../../types/flatlay';
import { AnalysisCache } from './analysis-cache';
import { FlatlayRenderer } from './flatlay-renderer';
import { createHash } from 'crypto';

export class FlatlayProcessor {
  private analysisCache: AnalysisCache;
  private renderer: FlatlayRenderer;
  
  constructor() {
    this.analysisCache = new AnalysisCache();
    this.renderer = new FlatlayRenderer();
  }
  
  /**
   * Process flatlay image generation with optional analysis reuse
   */
  async processFlatlay(request: FlatlayRequest): Promise<FlatlayResult> {
    const startTime = Date.now();
    
    try {
      console.log('🖼️ Starting flatlay image generation...');
      
      // Step 1: Get or perform analysis
      const { analysis, enrichment, analysisId, analysisReused } = await this.getAnalysis(
        request.flatlayImage,
        request.options?.reuseAnalysisId,
        request.options?.cacheAnalysis ?? true
      );
      
      // Step 2: Generate flatlay-specific prompt
      const flatlayPrompt = this.generateFlatlayPrompt(
        analysis,
        enrichment,
        request.options
      );
      
      // Step 3: Render flatlay image
      const renderResult = await this.renderer.renderFlatlay(
        request.flatlayImage,
        flatlayPrompt,
        request.originalImage,
        request.options
      );
      
      const processingTime = Date.now() - startTime;
      
      // Step 4: Create metadata
      const metadata: FlatlayMetadata = {
        model: 'gemini-2.5-flash-image-preview',
        style: request.options?.style || 'commercial',
        background: request.options?.background || 'white',
        lighting: request.options?.lighting || 'studio',
        composition: request.options?.composition || 'centered',
        analysisReused,
        analysisId,
        inputImageSize: this.getImageSize(request.flatlayImage),
        outputImageSize: this.getImageSize(renderResult.imageUrl),
        tokenUsage: {
          analysis: analysisReused ? 0 : 1000, // Estimated
          rendering: 2000,
          total: analysisReused ? 2000 : 3000
        },
        costBreakdown: {
          analysis: analysisReused ? 0 : 0.001,
          rendering: 0.039,
          total: analysisReused ? 0.039 : 0.040
        }
      };
      
      console.log(`✅ Flatlay generation completed in ${processingTime}ms`);
      console.log(`📊 Analysis reused: ${analysisReused}`);
      console.log(`💰 Estimated cost: €${metadata.costBreakdown.total.toFixed(3)}`);
      
      return {
        success: true,
        imageUrl: renderResult.imageUrl,
        processingTime,
        cost: metadata.costBreakdown.total,
        analysisId,
        metadata
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Flatlay generation failed:', error);
      
      return {
        success: false,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get analysis - either from cache or perform new analysis
   */
  private async getAnalysis(
    imageUrl: string, 
    reuseAnalysisId?: string,
    cacheAnalysis: boolean = true
  ): Promise<{
    analysis: any;
    enrichment?: any;
    analysisId?: string;
    analysisReused: boolean;
  }> {
    
    // If reusing specific analysis
    if (reuseAnalysisId) {
      console.log(`🔄 Reusing cached analysis: ${reuseAnalysisId}`);
      const cached = await this.analysisCache.retrieve(reuseAnalysisId);
      if (cached) {
        return {
          analysis: cached.analysis,
          enrichment: cached.enrichment,
          analysisId: reuseAnalysisId,
          analysisReused: true
        };
      } else {
        throw new FlatlayError(
          `Cached analysis not found: ${reuseAnalysisId}`,
          'CACHE_ERROR',
          'caching'
        );
      }
    }
    
    // Check if we have cached analysis for this image
    const imageHash = this.generateImageHash(imageUrl);
    const existingAnalysis = await this.analysisCache.findByImageHash(imageHash);
    
    if (existingAnalysis) {
      console.log(`🎯 Found cached analysis for image hash: ${imageHash}`);
      return {
        analysis: existingAnalysis.analysis,
        enrichment: existingAnalysis.enrichment,
        analysisId: existingAnalysis.id,
        analysisReused: true
      };
    }
    
    // Perform new analysis using Ghost Mannequin pipeline
    console.log('🔍 Performing new analysis using Ghost Mannequin pipeline...');
    const analysisResult = await this.performGhostAnalysis(imageUrl);
    
    // Cache the analysis if requested
    if (cacheAnalysis) {
      const analysisId = await this.cacheAnalysis(analysisResult, imageHash);
      return {
        ...analysisResult,
        analysisId,
        analysisReused: false
      };
    }
    
    return {
      ...analysisResult,
      analysisReused: false
    };
  }
  
  /**
   * Perform analysis using the Ghost Mannequin pipeline
   */
  private async performGhostAnalysis(imageUrl: string): Promise<{
    analysis: any;
    enrichment?: any;
  }> {
    // Import Ghost Mannequin pipeline components
    const { analyzeGarment, analyzeGarmentEnrichment } = await import('@ghost-platform/ghost-mannequin');
    
    // Perform base analysis
    const analysisResult = await analyzeGarment(imageUrl, `flatlay-${Date.now()}`);
    
    // Perform enrichment analysis
    const enrichmentResult = await analyzeGarmentEnrichment(
      imageUrl, 
      `flatlay-enrichment-${Date.now()}`,
      analysisResult.analysis.meta.session_id
    );
    
    return {
      analysis: analysisResult.analysis,
      enrichment: enrichmentResult.enrichment
    };
  }
  
  /**
   * Cache analysis results
   */
  private async cacheAnalysis(analysisResult: any, imageHash: string): Promise<string> {
    const analysisId = `flatlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const cachedAnalysis: CachedAnalysis = {
      id: analysisId,
      analysis: analysisResult.analysis,
      enrichment: analysisResult.enrichment,
      imageHash,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      usageCount: 0,
      metadata: {
        originalImageSize: 0, // Will be filled by cache implementation
        processingTime: 0,
        cost: 0
      }
    };
    
    await this.analysisCache.store(cachedAnalysis);
    console.log(`💾 Cached analysis with ID: ${analysisId}`);
    
    return analysisId;
  }
  
  /**
   * Generate flatlay-specific prompt based on analysis and options
   */
  private generateFlatlayPrompt(
    analysis: any,
    enrichment: any,
    options?: FlatlayOptions
  ): string {
    const style = options?.style || 'commercial';
    const background = options?.background || 'white';
    const lighting = options?.lighting || 'studio';
    const composition = options?.composition || 'centered';
    
    // Base flatlay prompt
    let prompt = `Create a professional flatlay product photograph of this garment. `;
    
    // Add style-specific instructions
    switch (style) {
      case 'minimal':
        prompt += `Use a clean, minimal aesthetic with simple composition. `;
        break;
      case 'lifestyle':
        prompt += `Create a lifestyle flatlay with natural, relaxed styling. `;
        break;
      case 'commercial':
        prompt += `Use commercial e-commerce styling with professional presentation. `;
        break;
      case 'editorial':
        prompt += `Create an editorial-style flatlay with artistic composition. `;
        break;
    }
    
    // Add background instructions
    switch (background) {
      case 'white':
        prompt += `Use a pure white background. `;
        break;
      case 'colored':
        prompt += `Use a subtle colored background that complements the garment. `;
        break;
      case 'textured':
        prompt += `Use a subtle textured background. `;
        break;
      case 'transparent':
        prompt += `Use a transparent background. `;
        break;
    }
    
    // Add lighting instructions
    switch (lighting) {
      case 'natural':
        prompt += `Use natural, soft lighting. `;
        break;
      case 'studio':
        prompt += `Use professional studio lighting with even illumination. `;
        break;
      case 'soft':
        prompt += `Use soft, diffused lighting. `;
        break;
      case 'dramatic':
        prompt += `Use dramatic lighting with interesting shadows. `;
        break;
    }
    
    // Add composition instructions
    switch (composition) {
      case 'centered':
        prompt += `Center the garment in the frame. `;
        break;
      case 'asymmetric':
        prompt += `Use asymmetric composition for visual interest. `;
        break;
      case 'grid':
        prompt += `Arrange in a grid-like composition. `;
        break;
      case 'organic':
        prompt += `Use organic, flowing composition. `;
        break;
    }
    
    // Add analysis-based instructions
    if (analysis.preserve_details && analysis.preserve_details.length > 0) {
      const criticalDetails = analysis.preserve_details.filter((d: any) => d.priority === 'critical');
      if (criticalDetails.length > 0) {
        prompt += `Preserve these critical details: ${criticalDetails.map((d: any) => d.element).join(', ')}. `;
      }
    }
    
    if (analysis.labels_found && analysis.labels_found.length > 0) {
      const readableLabels = analysis.labels_found.filter((l: any) => l.readable);
      if (readableLabels.length > 0) {
        prompt += `Ensure these labels remain clearly visible: ${readableLabels.map((l: any) => l.text || l.type).join(', ')}. `;
      }
    }
    
    // Add enrichment-based instructions
    if (enrichment?.color_precision) {
      prompt += `Maintain exact color fidelity with primary color ${enrichment.color_precision.primary_hex}. `;
    }
    
    if (enrichment?.fabric_behavior) {
      prompt += `Respect fabric properties: ${enrichment.fabric_behavior.drape_quality} drape, ${enrichment.fabric_behavior.surface_sheen} finish. `;
    }
    
    prompt += `Create a high-quality, professional flatlay photograph suitable for e-commerce use.`;
    
    return prompt;
  }
  
  /**
   * Generate hash for image deduplication
   */
  private generateImageHash(imageUrl: string): string {
    return createHash('sha256').update(imageUrl).digest('hex').substring(0, 16);
  }
  
  /**
   * Get image size (placeholder implementation)
   */
  private getImageSize(imageUrl: string): number {
    // This would be implemented to get actual image size
    return 1024; // Placeholder
  }
}

