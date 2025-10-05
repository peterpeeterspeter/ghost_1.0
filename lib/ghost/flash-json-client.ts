import type { FlashImagePromptPayload } from './json-payload-generator';
import type { GhostMannequinResult } from '@/types/ghost';
import type { ConsolidationOutput } from './consolidation';
import { GhostPipelineError } from '@/types/ghost';

/**
 * Send JSON payload to Gemini Flash 2.5 via Freepik API or AI Studio
 * This replaces the distilled prompt approach with structured JSON
 */
export async function generateGhostMannequinWithJsonPayload(
  payload: FlashImagePromptPayload,
  renderingModel?: 'freepik-gemini' | 'ai-studio',
  originalConsolidation?: ConsolidationOutput  // Preserve original data for AI Studio
): Promise<GhostMannequinResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Starting JSON payload generation with ${renderingModel || 'freepik-gemini'}...`);
    console.log(`📦 Payload size: ${JSON.stringify(payload).length} characters`);
    console.log(`🖼️ Reference images: ${payload.images.length}`);
    console.log(`📋 Template length: ${payload.prompt_block.base_prompt.length} characters`);
    
    // Route to AI Studio if specified, otherwise use Freepik
    if (renderingModel === 'ai-studio') {
      console.log('🎯 Routing JSON payload to AI Studio Gemini 2.5 Flash Image...');
      const { generateGhostMannequinWithStructuredJSON } = await import('./ai-studio');
      
      // Extract images for AI Studio
      const detailImage = payload.images.find(img => img.role === "detail_B");
      const onModelImage = payload.images.find(img => img.role === "on_model_A");
      
      if (!detailImage) {
        throw new Error('No detail_B image found in payload for AI Studio');
      }
      
      // Use original consolidation data if available to preserve full FactsV3 details
      // that may have been trimmed for Freepik JSON payload optimization
      const factsToUse = originalConsolidation?.facts_v3 || payload.facts_v3;
      const controlToUse = originalConsolidation?.control_block || payload.control_block;
      
      console.log('📊 Using data source:', originalConsolidation ? 'original consolidation' : 'payload data');
      
      return await generateGhostMannequinWithStructuredJSON(
        detailImage.url,
        factsToUse,
        controlToUse,
        onModelImage?.url,
        { sessionId: payload.meta.session_id }
      );
    }
    
    // Default to Freepik integration
    console.log('🎯 Routing JSON payload to Freepik Gemini Flash 2.5...');
    const { generateImageWithFreepikGeminiJson } = await import('./freepik');
    
    // Convert payload images to format expected by Freepik client
    const imageUrls: string[] = [];
    
    // Add images in correct order (on-model first, then detail)
    const onModelImage = payload.images.find(img => img.role === "on_model_A");
    const detailImage = payload.images.find(img => img.role === "detail_B");
    
    if (onModelImage) {
      imageUrls.push(onModelImage.url);
    }
    if (detailImage) {
      imageUrls.push(detailImage.url);
    }
    
    console.log('🎯 Sending JSON payload to Freepik Gemini Flash 2.5...');
    console.log(`📋 Images order: ${imageUrls.length} images`);
    if (onModelImage) console.log(`  - on_model_A: ${onModelImage.url.substring(0, 50)}...`);
    if (detailImage) console.log(`  - detail_B: ${detailImage.url.substring(0, 50)}...`);
    
    // Send JSON payload as the prompt text
    const jsonPrompt = JSON.stringify(payload, null, 2);
    console.log('📊 JSON payload preview:', jsonPrompt.substring(0, 200) + '...');
    
    // Handle different image scenarios properly
    let primaryImage: string;
    let referenceImage: string | undefined;
    
    if (detailImage && onModelImage) {
      // Two images: detail_B as primary, on_model_A as reference
      primaryImage = detailImage.url;
      referenceImage = onModelImage.url;
      console.log('🖼️ Using two images: detail_B (primary) + on_model_A (reference)');
    } else if (detailImage) {
      // Only detail image: use it as primary, no reference
      primaryImage = detailImage.url;
      referenceImage = undefined;
      console.log('🖼️ Using single image: detail_B only (no reference)');
    } else if (onModelImage) {
      // Only on-model image: use it as primary, no reference
      primaryImage = onModelImage.url;
      referenceImage = undefined;
      console.log('🖼️ Using single image: on_model_A only (no reference)');
    } else {
      throw new Error('No images found in payload');
    }
    
    const result = await generateImageWithFreepikGeminiJson(
      jsonPrompt,
      primaryImage,
      referenceImage
    );
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ JSON payload generation completed in ${processingTime}ms`);
    
    return {
      renderUrl: result.imageBase64,
      processingTime: result.processingTime,
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ JSON payload generation failed:', error);
    
    // Re-throw if already a GhostPipelineError
    if (error instanceof GhostPipelineError) {
      throw error;
    }
    
    throw new GhostPipelineError(
      `JSON payload generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'JSON_RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Fallback generation using distilled prompts if JSON approach fails
 */
export async function fallbackToDistilledPrompts(
  flatlayImage: string,
  consolidation: ConsolidationOutput,
  originalImage?: string
): Promise<GhostMannequinResult> {
  console.log('🔄 JSON approach failed, falling back to distilled prompts...');
  
  try {
    // Import the existing distilled prompt approach
    const { generateGhostMannequinWithControlBlockGemini } = await import('./gemini');
    const { buildDynamicFlashPrompt } = await import('./consolidation');
    
    // Generate distilled prompt
    const distilledPrompt = await buildDynamicFlashPrompt(
      consolidation.facts_v3,
      consolidation.control_block,
      consolidation.session_id || 'fallback-session'
    );
    
    console.log(`🔄 Using distilled prompt: ${distilledPrompt.length} chars`);
    
    // Use existing control block approach
    return await generateGhostMannequinWithControlBlockGemini(
      flatlayImage,
      distilledPrompt,
      consolidation,
      originalImage
    );
    
  } catch (fallbackError) {
    console.error('❌ Distilled prompt fallback also failed:', fallbackError);
    
    throw new GhostPipelineError(
      `Both JSON and distilled prompt approaches failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
      'ALL_RENDERING_FAILED',
      'rendering',
      fallbackError instanceof Error ? fallbackError : undefined
    );
  }
}

/**
 * Validate JSON payload before sending to ensure it meets schema requirements
 */
export function validateJsonPayload(payload: FlashImagePromptPayload): void {
  // Basic validation
  if (payload.type !== "flash_image_prompt_payload_v1") {
    throw new Error(`Invalid payload type: ${payload.type}`);
  }
  
  if (payload.meta.schema_version !== "1.0") {
    throw new Error(`Invalid schema version: ${payload.meta.schema_version}`);
  }
  
  if (!payload.meta.session_id) {
    throw new Error('Missing session_id in payload meta');
  }
  
  if (!payload.images || payload.images.length === 0) {
    throw new Error('No images provided in payload');
  }
  
  // Must have at least detail_B image
  const hasDetailB = payload.images.some(img => img.role === "detail_B");
  if (!hasDetailB) {
    throw new Error('Missing required detail_B image in payload');
  }
  
  if (!payload.prompt_block.base_prompt) {
    throw new Error('Missing base_prompt in payload');
  }
  
  if (!payload.facts_v3 || !payload.control_block) {
    throw new Error('Missing facts_v3 or control_block in payload');
  }
  
  // Validate required facts_v3 fields
  if (!payload.facts_v3.category_generic) {
    throw new Error('Missing category_generic in facts_v3');
  }
  
  if (!payload.facts_v3.palette.dominant_hex) {
    throw new Error('Missing dominant_hex in facts_v3.palette');
  }
  
  // Validate hex color format
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexPattern.test(payload.facts_v3.palette.dominant_hex)) {
    throw new Error(`Invalid hex color format: ${payload.facts_v3.palette.dominant_hex}`);
  }
  
  console.log('✅ JSON payload validation passed');
}