// ccj-modes-integration.ts
// Integration examples for using the mode-aware CCJ render layer

import { 
  generateCCJRender, 
  prepareImageForModeRender,
  type FactsV3, 
  type ControlBlock,
  type RenderType 
} from './ccj-modes';
import { configureFalClient } from './fal';

export interface ModeRenderOptions {
  mode: RenderType;
  aspectRatio?: '4:5'|'1:1'|'16:9'|'3:4'|'2:3';
  auxRefs?: string[]; // Optional auxiliary references (e.g., person for VTO)
}

export interface ModeRenderResult {
  success: boolean;
  imageBuffer?: Buffer;
  renderUrl?: string;
  error?: string;
  processingTime: number;
  mode: RenderType;
}

/**
 * Drop-in replacement for existing pipeline render functions
 * Uses the same FactsV3 + ControlBlock but switches render modes
 */
export async function renderWithMode(
  facts: FactsV3,
  control: ControlBlock,
  primaryImagePath: string,
  options: ModeRenderOptions,
  sessionId: string
): Promise<ModeRenderResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🎨 Rendering in ${options.mode.toUpperCase()} mode...`);
    
    // Prepare primary image for Files API
    const primaryFileUri = await prepareImageForModeRender(primaryImagePath, sessionId);
    
    // Prepare auxiliary references if provided
    const auxFileUris: string[] = [];
    if (options.auxRefs) {
      for (const auxRef of options.auxRefs) {
        try {
          const auxUri = await prepareImageForModeRender(auxRef, sessionId);
          auxFileUris.push(auxUri);
        } catch (error) {
          console.warn(`Failed to prepare aux reference ${auxRef}:`, error);
        }
      }
    }

    // Generate image using mode-aware render
    const imageBuffer = await generateCCJRender(
      facts,
      control,
      primaryFileUri,
      auxFileUris,
      options.mode,
      sessionId,
      options.aspectRatio || '4:5'
    );

    // Upload to FAL storage if configured
    let renderUrl: string;
    if (process.env.FAL_API_KEY) {
      try {
        const { uploadToFalStorage } = await import('./fal');
        renderUrl = await uploadToFalStorage(imageBuffer, sessionId);
        console.log(`✅ Image uploaded to FAL storage: ${renderUrl}`);
      } catch (error) {
        console.warn('FAL storage upload failed, using data URL:', error);
        renderUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      }
    } else {
      renderUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ ${options.mode.toUpperCase()} rendering completed in ${processingTime}ms`);

    return {
      success: true,
      imageBuffer,
      renderUrl,
      processingTime,
      mode: options.mode
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ ${options.mode.toUpperCase()} rendering failed:`, error.message);

    return {
      success: false,
      error: error.message,
      processingTime,
      mode: options.mode
    };
  }
}

/**
 * Batch render multiple modes with the same inputs
 */
export async function renderMultipleModes(
  facts: FactsV3,
  control: ControlBlock,
  primaryImagePath: string,
  modes: RenderType[],
  sessionId: string,
  aspectRatio: '4:5'|'1:1'|'16:9'|'3:4'|'2:3' = '4:5'
): Promise<ModeRenderResult[]> {
  console.log(`🔄 Rendering ${modes.length} modes: ${modes.join(', ')}`);
  
  const results: ModeRenderResult[] = [];
  
  for (const mode of modes) {
    const modeSessionId = `${sessionId}-${mode}`;
    const result = await renderWithMode(
      facts,
      control,
      primaryImagePath,
      { mode, aspectRatio },
      modeSessionId
    );
    results.push(result);
  }
  
  return results;
}

/**
 * Smart mode selection based on garment type and use case
 */
export function selectOptimalMode(
  facts: FactsV3,
  useCase: 'ecommerce' | 'catalog' | 'social' | 'vto' = 'ecommerce'
): RenderType {
  const category = facts.category_generic?.toLowerCase() || '';
  
  // VTO mode for virtual try-on use case
  if (useCase === 'vto') {
    return 'vton';
  }
  
  // Flatlay for certain garment types
  if (category.includes('underwear') || category.includes('socks') || category.includes('accessories')) {
    return 'flatlay';
  }
  
  // On-model for social media or lifestyle shots
  if (useCase === 'social') {
    return 'on_model';
  }
  
  // Default to ghost mannequin for e-commerce
  return 'ghost';
}

/**
 * Example usage functions
 */
export const Examples = {
  // Ghost mannequin (default e-commerce)
  async ghostEcommerce(facts: FactsV3, control: ControlBlock, imagePath: string, sessionId: string) {
    return renderWithMode(facts, control, imagePath, { mode: 'ghost' }, sessionId);
  },

  // Flatlay for accessories
  async flatlayAccessories(facts: FactsV3, control: ControlBlock, imagePath: string, sessionId: string) {
    return renderWithMode(facts, control, imagePath, { mode: 'flatlay' }, sessionId);
  },

  // On-model for lifestyle
  async onModelLifestyle(facts: FactsV3, control: ControlBlock, imagePath: string, sessionId: string) {
    return renderWithMode(facts, control, imagePath, { mode: 'on_model' }, sessionId);
  },

  // VTO with person reference
  async virtualTryOn(facts: FactsV3, control: ControlBlock, imagePath: string, personRef: string, sessionId: string) {
    return renderWithMode(facts, control, imagePath, { 
      mode: 'vton', 
      auxRefs: [personRef] 
    }, sessionId);
  },

  // All modes comparison
  async allModes(facts: FactsV3, control: ControlBlock, imagePath: string, sessionId: string) {
    return renderMultipleModes(facts, control, imagePath, ['ghost', 'flatlay', 'on_model'], sessionId);
  }
};

/**
 * Integration with existing pipeline
 * Replace existing render calls with mode-aware rendering
 */
export async function integrateWithExistingPipeline(
  pipelineResult: any, // Result from existing pipeline analysis
  mode: RenderType = 'ghost',
  sessionId: string
): Promise<ModeRenderResult> {
  // Extract facts and control from existing pipeline result
  const facts: FactsV3 = pipelineResult.facts_v3 || pipelineResult.analysis || {};
  const control: ControlBlock = pipelineResult.control_block || { must: [], ban: [] };
  
  // Use the cleaned flatlay image from pipeline
  const imagePath = pipelineResult.cleanedImageUrl || pipelineResult.flatlayUrl;
  
  if (!imagePath) {
    throw new Error('No image path found in pipeline result');
  }

  return renderWithMode(facts, control, imagePath, { mode }, sessionId);
}
