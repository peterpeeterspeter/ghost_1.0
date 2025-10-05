import type { FactsV3, ControlBlock } from './consolidation';
import { createHash } from 'crypto';

/**
 * Core Contract JSON (CCJ) - Minimal but binding constraints
 * This is the small, rigid set of must-obey fields (0.8-1.5 KB)
 */
export interface CoreContractJSON {
  v: "gm-ccj-1.0";
  garment_id: string;
  category: string;
  silhouette: string;
  pattern: string;
  colors_hex: string[];
  parts: {
    neckline: {
      type: string;
      stance_deg?: number;
    };
    sleeves: {
      length: string;
      cuff?: string;
      gauntlet_placket?: boolean;
    };
    placket?: {
      buttons: number;
      spacing_mm: number;
    };
    hem: {
      shape: string;
      depth_mm: number;
    };
  };
  proportions: {
    shoulder_w: number;
    torso_l: number;
    sleeve_l: number;
  };
  rules: {
    texture_source: "B_flatlay_truth";
    proportion_source: "A_personless_only";
    bg: "#FFFFFF";
    ghost: true;
  };
}

/**
 * Hints JSON - Compressed additional data (optional to pass to model)
 * Contains the remaining ~70 fields with compressed keys
 */
export interface HintsJSON {
  v: "gm-hints-1.0";
  // Fabric details
  fab: {
    mat?: string;           // material
    weave?: string;         // weave_knit
    drape?: number;         // drape_stiffness
    trans?: string;         // transparency
    sheen?: string;         // surface_sheen
  };
  // Construction details
  const: {
    edge_fin?: string;      // edge_finish
    req_comp?: string[];    // required_components
    forb_comp?: string[];   // forbidden_components
    stch_vis?: string;      // stitch_visibility
    hrdw_fin?: string;      // hardware_finish
  };
  // Quality targets
  qa: {
    deltaE_max?: number;
    edge_halo_max?: number;
    sym_tol?: number;
    min_res?: number;
  };
  // Rendering preferences
  render: {
    light_pref?: string;    // lighting_preference
    shadow_bhv?: string;    // shadow_behavior
    detail_sharp?: string;  // detail_sharpness
    tex_emph?: string;      // texture_emphasis
  };
  // Safety and compliance
  safety?: string[];        // must_not array
  // Additional metadata
  meta?: {
    notes?: string;
    asym_exp?: boolean;     // structural_asymmetry.expected
    asym_reg?: string[];    // structural_asymmetry.regions
    label_vis?: string;     // label_visibility
  };
}

/**
 * Generate Core Contract JSON from analysis data
 */
export function generateCoreContract(
  facts: FactsV3,
  sessionId: string
): CoreContractJSON {
  // Extract 3-6 most important colors
  const colors = extractKeyColors(facts.palette);
  
  // Extract key proportions (normalized 0-1)
  const proportions = extractProportions(facts);
  
  // Map parts from analysis data
  const parts = extractGarmentParts(facts);
  
  const ccj: CoreContractJSON = {
    v: "gm-ccj-1.0",
    garment_id: sessionId.slice(0, 8),
    category: mapCategoryToShort(facts.category_generic),
    silhouette: facts.silhouette || "regular",
    pattern: facts.pattern || "solid",
    colors_hex: colors,
    parts,
    proportions,
    rules: {
      texture_source: "B_flatlay_truth",
      proportion_source: "A_personless_only",
      bg: "#FFFFFF",
      ghost: true
    }
  };
  
  return ccj;
}

/**
 * Generate Hints JSON from analysis data
 */
export function generateHints(
  facts: FactsV3,
  controlBlock: ControlBlock
): HintsJSON {
  const hints: HintsJSON = {
    v: "gm-hints-1.0",
    fab: {
      mat: facts.material,
      weave: facts.weave_knit,
      drape: facts.drape_stiffness,
      trans: facts.transparency,
      sheen: facts.surface_sheen
    },
    const: {
      edge_fin: facts.edge_finish,
      req_comp: facts.required_components,
      forb_comp: facts.forbidden_components
    },
    qa: facts.qa_targets,
    render: {
      light_pref: controlBlock.lighting_preference || 'soft_diffused',
      shadow_bhv: controlBlock.shadow_behavior || 'soft_shadows',
      detail_sharp: 'sharp',
      tex_emph: 'enhance'
    },
    safety: facts.safety?.must_not,
    meta: {
      notes: facts.notes,
      asym_exp: facts.structural_asymmetry?.expected,
      asym_reg: facts.structural_asymmetry?.regions,
      label_vis: facts.label_visibility
    }
  };
  
  return hints;
}

/**
 * Generate digest for CCJ (first 12 chars of SHA256)
 */
export function generateCCJDigest(ccj: CoreContractJSON): string {
  const ccjString = JSON.stringify(ccj, null, 0); // No whitespace for consistent hash
  const hash = createHash('sha256').update(ccjString).digest('hex');
  return hash.slice(0, 12);
}

/**
 * Generate the short prompt template with inlined CCJ
 */
export function generateShortPrompt(
  ccj: CoreContractJSON,
  digest: string
): string {
  const ccjInline = JSON.stringify(ccj, null, 1); // Minimal formatting
  
  return `TASK: Generate a studio product photo as a ghost mannequin. No people.
Use B (flatlay) for all colors/textures/pattern fidelity.
Use A (on-model, person scrubbed) only for global proportions/scale.
Honor the JSON CONTRACT exactly.

JSON CONTRACT (digest=${digest}):
${ccjInline}

REFERENCES (authority order):
1) B_clean.jpg  (truth for color/texture)
2) A_personless.jpg (scale/proportions only)

OUTPUT: 2048×2048, white background (#FFFFFF), subtle contact shadow, tight clipping (≈2 px).`;
}

/**
 * Helper functions
 */

function extractKeyColors(palette: any): string[] {
  const colors: string[] = [];
  
  if (palette?.dominant_hex) {
    colors.push(palette.dominant_hex);
  }
  if (palette?.accent_hex) {
    colors.push(palette.accent_hex);
  }
  if (palette?.trim_hex) {
    colors.push(palette.trim_hex);
  }
  if (palette?.pattern_hexes?.length) {
    // Add up to 3 more pattern colors
    colors.push(...palette.pattern_hexes.slice(0, 3));
  }
  
  // Ensure we have at least 1 color, max 6
  if (colors.length === 0) {
    colors.push('#CCCCCC'); // Default gray
  }
  
  return colors.slice(0, 6); // Max 6 colors
}

function extractProportions(facts: FactsV3): { shoulder_w: number; torso_l: number; sleeve_l: number } {
  // Default proportions for different categories
  const defaults = {
    shirt: { shoulder_w: 0.25, torso_l: 0.56, sleeve_l: 0.47 },
    top: { shoulder_w: 0.24, torso_l: 0.52, sleeve_l: 0.45 },
    dress: { shoulder_w: 0.22, torso_l: 0.78, sleeve_l: 0.42 },
    outerwear: { shoulder_w: 0.28, torso_l: 0.64, sleeve_l: 0.52 }
  };
  
  const category = facts.category_generic || 'top';
  return defaults[category as keyof typeof defaults] || defaults.top;
}

function extractGarmentParts(facts: FactsV3): CoreContractJSON['parts'] {
  const parts: CoreContractJSON['parts'] = {
    neckline: {
      type: extractNecklineType(facts),
      stance_deg: 10 // Default collar stance
    },
    sleeves: {
      length: extractSleeveLength(facts),
      cuff: extractCuffType(facts)
    },
    hem: {
      shape: "straight",
      depth_mm: 25
    }
  };
  
  // Add placket if it's a button-up garment
  const buttonCount = extractButtonCount(facts);
  if (buttonCount > 0) {
    parts.placket = {
      buttons: buttonCount,
      spacing_mm: 85
    };
  }
  
  return parts;
}

function extractNecklineType(facts: FactsV3): string {
  const silhouette = (facts.silhouette || '').toLowerCase();
  
  if (silhouette.includes('collar')) return 'classic-collar';
  if (silhouette.includes('v-neck')) return 'v-neck';
  if (silhouette.includes('round')) return 'crew-neck';
  if (silhouette.includes('turtle')) return 'turtleneck';
  if (silhouette.includes('polo')) return 'polo-collar';
  
  return 'crew-neck'; // Default
}

function extractSleeveLength(facts: FactsV3): string {
  const silhouette = (facts.silhouette || '').toLowerCase();
  
  if (silhouette.includes('long')) return 'long';
  if (silhouette.includes('short')) return 'short';
  if (silhouette.includes('sleeveless')) return 'none';
  if (silhouette.includes('3/4')) return '3/4';
  
  return 'long'; // Default
}

function extractCuffType(facts: FactsV3): string {
  const components = facts.required_components || [];
  const componentString = components.join(' ').toLowerCase();
  
  if (componentString.includes('button') && componentString.includes('cuff')) {
    return 'single-button';
  }
  if (componentString.includes('french') || componentString.includes('double')) {
    return 'french-cuff';
  }
  
  return 'barrel-cuff'; // Default
}

function extractButtonCount(facts: FactsV3): number {
  const silhouette = (facts.silhouette || '').toLowerCase();
  const components = facts.required_components || [];
  
  // Look for button references
  const buttonText = components.join(' ') + ' ' + silhouette;
  const buttonMatch = buttonText.match(/(\d+)[\s\-]?button/i);
  
  if (buttonMatch) {
    return parseInt(buttonMatch[1], 10);
  }
  
  // Default button counts by category
  if (silhouette.includes('shirt') || silhouette.includes('blouse')) return 6;
  if (silhouette.includes('cardigan')) return 5;
  if (silhouette.includes('jacket') || silhouette.includes('blazer')) return 3;
  
  return 0; // No buttons
}

function mapCategoryToShort(category?: string): string {
  const mapping: Record<string, string> = {
    'top': 'shirt',
    'shirt': 'shirt',
    'blouse': 'shirt',
    'bottom': 'pants',
    'pants': 'pants',
    'dress': 'dress',
    'outerwear': 'jacket',
    'jacket': 'jacket',
    'knitwear': 'sweater',
    'sweater': 'sweater'
  };
  
  return mapping[category || ''] || 'shirt';
}

/**
 * Complete CCJ generation package
 */
export interface CCJPackage {
  ccj: CoreContractJSON;
  hints: HintsJSON;
  digest: string;
  prompt: string;
  sizes: {
    ccj_bytes: number;
    hints_bytes: number;
    total_bytes: number;
  };
}

export function generateCCJPackage(
  facts: FactsV3,
  controlBlock: ControlBlock,
  sessionId: string
): CCJPackage {
  const ccj = generateCoreContract(facts, sessionId);
  const hints = generateHints(facts, controlBlock);
  const digest = generateCCJDigest(ccj);
  const prompt = generateShortPrompt(ccj, digest);
  
  const ccjBytes = JSON.stringify(ccj).length;
  const hintsBytes = JSON.stringify(hints).length;
  
  return {
    ccj,
    hints,
    digest,
    prompt,
    sizes: {
      ccj_bytes: ccjBytes,
      hints_bytes: hintsBytes,
      total_bytes: ccjBytes + hintsBytes + prompt.length
    }
  };
}