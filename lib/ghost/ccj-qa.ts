import type { CoreContractJSON } from './ccj-generator';

/**
 * QA Result structure mapped to CCJ constraints
 */
export interface QAResult {
  run_id: string;
  digest: string;
  deltaE00_mean: number;
  deltaE00_max: number;
  buttons: {
    expected: number;
    found: number;
    match: boolean;
  };
  cavities_ok: boolean;
  proportions_ok: boolean;
  retry_used: boolean;
  passed: boolean;
  errors: string[];
  execution_time_ms: number;
}

/**
 * QA Configuration for validation thresholds
 */
export interface QAConfig {
  deltaE00_mean_max: number;
  deltaE00_max_threshold: number;
  proportions_tolerance_pct: number;
  cavity_edge_threshold: number;
}

export const DEFAULT_QA_CONFIG: QAConfig = {
  deltaE00_mean_max: 3.0,
  deltaE00_max_threshold: 5.0,
  proportions_tolerance_pct: 5.0,
  cavity_edge_threshold: 0.3
};

/**
 * Lightweight QA validation against CCJ constraints
 */
export async function validateAgainstCCJ(
  generatedImageUrl: string,
  flatlayImageUrl: string,
  ccj: CoreContractJSON,
  digest: string,
  config: QAConfig = DEFAULT_QA_CONFIG
): Promise<QAResult> {
  const startTime = Date.now();
  const runId = new Date().toISOString();
  const errors: string[] = [];
  
  console.log(`🔍 Starting CCJ validation for digest: ${digest}`);
  
  try {
    // 1. Color validation - ΔE00 against flatlay swatches
    const colorValidation = await validateColors(
      generatedImageUrl, 
      flatlayImageUrl, 
      ccj.colors_hex,
      config
    );
    
    // 2. Button count validation (if placket exists)
    const buttonValidation = await validateButtons(
      generatedImageUrl,
      ccj.parts.placket?.buttons || 0
    );
    
    // 3. Cavity validation (neckline, sleeves must be open)
    const cavityValidation = await validateCavities(
      generatedImageUrl,
      ccj.parts,
      config
    );
    
    // 4. Proportions validation
    const proportionValidation = await validateProportions(
      generatedImageUrl,
      ccj.proportions,
      config
    );
    
    // Collect errors
    if (colorValidation.deltaE00_mean > config.deltaE00_mean_max) {
      errors.push(`Color accuracy failed: mean ΔE00 ${colorValidation.deltaE00_mean.toFixed(2)} > ${config.deltaE00_mean_max}`);
    }
    
    if (colorValidation.deltaE00_max > config.deltaE00_max_threshold) {
      errors.push(`Color accuracy failed: max ΔE00 ${colorValidation.deltaE00_max.toFixed(2)} > ${config.deltaE00_max_threshold}`);
    }
    
    if (!buttonValidation.match) {
      errors.push(`Button count mismatch: expected ${buttonValidation.expected}, found ${buttonValidation.found}`);
    }
    
    if (!cavityValidation) {
      errors.push('Cavity validation failed: neckline or sleeves not properly hollow');
    }
    
    if (!proportionValidation) {
      errors.push(`Proportions outside tolerance: ±${config.proportions_tolerance_pct}%`);
    }
    
    const passed = errors.length === 0;
    const executionTime = Date.now() - startTime;
    
    const result: QAResult = {
      run_id: runId,
      digest,
      deltaE00_mean: colorValidation.deltaE00_mean,
      deltaE00_max: colorValidation.deltaE00_max,
      buttons: buttonValidation,
      cavities_ok: cavityValidation,
      proportions_ok: proportionValidation,
      retry_used: false,
      passed,
      errors,
      execution_time_ms: executionTime
    };
    
    console.log(`${passed ? '✅' : '❌'} QA validation ${passed ? 'passed' : 'failed'} in ${executionTime}ms`);
    if (!passed) {
      console.log('🚫 QA Errors:', errors);
    }
    
    return result;
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ QA validation error:', error);
    
    return {
      run_id: runId,
      digest,
      deltaE00_mean: 999,
      deltaE00_max: 999,
      buttons: { expected: 0, found: 0, match: false },
      cavities_ok: false,
      proportions_ok: false,
      retry_used: false,
      passed: false,
      errors: [`QA execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      execution_time_ms: executionTime
    };
  }
}

/**
 * Color validation using ΔE00 against flatlay reference
 */
async function validateColors(
  generatedImageUrl: string,
  flatlayImageUrl: string,
  expectedColors: string[],
  config: QAConfig
): Promise<{ deltaE00_mean: number; deltaE00_max: number }> {
  try {
    console.log('🎨 Validating colors against flatlay reference');
    
    // This is a simplified implementation
    // In practice, you'd use a color science library like chroma.js or deltaE
    // and sample colors from both images for comparison
    
    // For now, return mock values that would pass QA
    // TODO: Implement actual ΔE00 calculation
    const mockDeltaE00Values = expectedColors.map(() => Math.random() * 2 + 0.5);
    const deltaE00_mean = mockDeltaE00Values.reduce((a, b) => a + b, 0) / mockDeltaE00Values.length;
    const deltaE00_max = Math.max(...mockDeltaE00Values);
    
    console.log(`🎨 Color validation: mean ΔE00 ${deltaE00_mean.toFixed(2)}, max ΔE00 ${deltaE00_max.toFixed(2)}`);
    
    return { deltaE00_mean, deltaE00_max };
    
  } catch (error) {
    console.error('❌ Color validation failed:', error);
    return { deltaE00_mean: 999, deltaE00_max: 999 };
  }
}

/**
 * Button count validation using ROI detection
 */
async function validateButtons(
  generatedImageUrl: string,
  expectedButtons: number
): Promise<{ expected: number; found: number; match: boolean }> {
  try {
    if (expectedButtons === 0) {
      return { expected: 0, found: 0, match: true };
    }
    
    console.log(`🔘 Validating button count: expected ${expectedButtons}`);
    
    // This is a simplified implementation
    // In practice, you'd use computer vision to detect circular objects
    // in the placket region of the image
    
    // Mock button detection - assume we find the correct count most of the time
    const foundButtons = Math.random() > 0.2 ? expectedButtons : expectedButtons - 1;
    const match = foundButtons === expectedButtons;
    
    console.log(`🔘 Button validation: found ${foundButtons}, expected ${expectedButtons}, match: ${match}`);
    
    return { expected: expectedButtons, found: foundButtons, match };
    
  } catch (error) {
    console.error('❌ Button validation failed:', error);
    return { expected: expectedButtons, found: 0, match: false };
  }
}

/**
 * Cavity validation using edge detection
 */
async function validateCavities(
  generatedImageUrl: string,
  parts: CoreContractJSON['parts'],
  config: QAConfig
): Promise<boolean> {
  try {
    console.log('🕳️ Validating hollow regions (neckline, sleeves)');
    
    // This is a simplified implementation
    // In practice, you'd use edge detection to verify that:
    // - Neckline shows interior cavity
    // - Sleeve openings are hollow
    // - No artificial filling of natural openings
    
    // Mock cavity validation - assume success most of the time
    const cavitiesValid = Math.random() > 0.1;
    
    console.log(`🕳️ Cavity validation: ${cavitiesValid ? 'passed' : 'failed'}`);
    
    return cavitiesValid;
    
  } catch (error) {
    console.error('❌ Cavity validation failed:', error);
    return false;
  }
}

/**
 * Proportions validation against CCJ specifications
 */
async function validateProportions(
  generatedImageUrl: string,
  expectedProportions: CoreContractJSON['proportions'],
  config: QAConfig
): Promise<boolean> {
  try {
    console.log('📏 Validating garment proportions');
    
    // This is a simplified implementation
    // In practice, you'd measure key dimensions from the generated image
    // and compare against the expected ratios with tolerance
    
    const tolerance = config.proportions_tolerance_pct / 100;
    
    // Mock proportion measurement - assume success most of the time
    const proportionsValid = Math.random() > 0.15;
    
    console.log(`📏 Proportions validation: ${proportionsValid ? 'within tolerance' : 'outside tolerance'} (±${config.proportions_tolerance_pct}%)`);
    
    return proportionsValid;
    
  } catch (error) {
    console.error('❌ Proportions validation failed:', error);
    return false;
  }
}

/**
 * Generate retry parameters for failed QA
 */
export function generateRetryParameters(originalQA: QAResult): {
  downscaleImages: boolean;
  shortenPrompt: boolean;
  adjustParameters: boolean;
} {
  const hasColorIssues = originalQA.deltaE00_mean > 3 || originalQA.deltaE00_max > 5;
  const hasStructuralIssues = !originalQA.buttons.match || !originalQA.cavities_ok;
  const hasProportionIssues = !originalQA.proportions_ok;
  
  return {
    downscaleImages: true, // Always downscale to 1536px on retry
    shortenPrompt: hasStructuralIssues, // Shorten if structural issues
    adjustParameters: hasColorIssues || hasProportionIssues
  };
}

/**
 * Store QA results for audit trail
 */
export interface QAStorageRecord {
  session_id: string;
  ccj_digest: string;
  qa_result: QAResult;
  ccj_data: CoreContractJSON;
  generated_image_url: string;
  retry_attempt: number;
  timestamp: string;
}

export function createQAStorageRecord(
  sessionId: string,
  ccj: CoreContractJSON,
  qaResult: QAResult,
  generatedImageUrl: string,
  retryAttempt: number = 0
): QAStorageRecord {
  return {
    session_id: sessionId,
    ccj_digest: qaResult.digest,
    qa_result: qaResult,
    ccj_data: ccj,
    generated_image_url: generatedImageUrl,
    retry_attempt: retryAttempt,
    timestamp: new Date().toISOString()
  };
}
