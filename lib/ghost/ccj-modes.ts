// ccj-modes.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toFilesURI } from './ccj-improved';

export type RenderType = 'ghost' | 'flatlay' | 'on_model' | 'vton';

export interface FactsV3 {
  category_generic?: string;
  silhouette?: string;
  palette?: {
    dominant_hex?: string;
    accent_hex?: string;
    trim_hex?: string;
    pattern_hexes?: string[];
  };
  labels_found?: Array<{ text?: string; priority?: 'critical'|'high'|'normal' }>;
  interior_analysis?: { visible_regions?: string[] };
  hollow_regions?: { must_render?: boolean };
  construction_details?: Record<string, any>;
  color_precision?: { primary_hex?: string; secondary_hex?: string; trim_hex?: string; deltaE_max?: number };
  fabric_behavior?: { drape?: string; stiffness_0_1?: number; transparency?: string; surface_sheen?: string };
  construction_precision?: Record<string, any>;
  view?: 'front'|'back'|'side'|'detail';
}

export interface ControlBlock {
  must?: string[];
  ban?: string[];
}

export interface CCJCore {
  v: 'gm-ccj-1.3';
  id: string;
  category: string;
  silhouette: string;
  pattern: string;
  colors_hex: string[];
  parts: {
    openings?: string[];
    closures?: string | 'as_seen';
    trims?: string | 'as_seen';
    pockets?: string | 'as_seen';
  };
  proportions: {
    symmetry_tol_pct: number;
    framing_margin_pct: number;
  };
  rules: {
    bg: string;                // #FFFFFF
    mode: RenderType;          // ghost | flatlay | on_model | vton
    show_interiors: boolean;   // ghost: true, else false (unless you override)
    labels_lock: 'keep_legible_exact';
    authority: {
      geometry_texture: 'refs.primary';
      color_source: 'refs.primary';
      scale_proportion: 'refs.aux' | 'refs.aux|optional';
    };
  };
  refs: {
    primary: string; // Files API URI
    aux?: string[];  // optional Files API URIs
  };
}

export interface CCJHints {
  v: 'gm-hints-1.3';
  view?: 'front'|'back'|'top_down'|'3d_frontal';
  framing?: { margin_pct?: number; center?: boolean };
  lighting?: Record<string, any>;
  shadow?: Record<string, any>;
  color_precision?: Record<string, any>;
  material?: Record<string, any>;
  fabric_behavior?: Record<string, any>;
  construction?: Record<string, any>;
  interior?: Record<string, any>;
  labels?: Record<string, any>;
  qa?: { min_resolution_px?: number; symmetry_tol_pct?: number; edge_halo_max_pct?: number };
  safety?: { must_not?: string[] };
  notes?: string;
}

// small utilities
const pickColors = (f: FactsV3): string[] => {
  const c = f?.color_precision || {};
  const p = f?.palette || {};
  const set = new Set<string>(
    [c.primary_hex, c.secondary_hex, c.trim_hex, p.dominant_hex, p.accent_hex, p.trim_hex]
      .filter(Boolean) as string[]
  );
  if ((p.pattern_hexes || []).length) (p.pattern_hexes!).forEach(h => set.add(h));
  return Array.from(set).slice(0, 6); // 3–6 colors
};

const mapPattern = (f: FactsV3) => (Array.isArray(f?.palette?.pattern_hexes) && f.palette!.pattern_hexes!.length) ? 'patterned' : 'solid';

const defaultHex = '#FFFFFF';

// Build CCJ Core (mode-aware)
export function buildCCJCore(
  facts: FactsV3,
  primaryFileUri: string,
  auxFileUris: string[],
  mode: RenderType,
  sessionId: string
): CCJCore {
  const colors = pickColors(facts);
  const showInteriors = (mode === 'ghost'); // hard default; override if you need
  const openings = (
    facts?.interior_analysis?.visible_regions?.length
      ? facts.interior_analysis.visible_regions
      : ['neckline','sleeves','hem','vents']
  );

  return {
    v: 'gm-ccj-1.3',
    id: `ccj-${sessionId.slice(0, 8)}`,
    category: facts.category_generic || 'generic',
    silhouette: facts.silhouette || 'regular',
    pattern: mapPattern(facts),
    colors_hex: colors.length ? colors : [facts?.palette?.dominant_hex || defaultHex],

    parts: {
      openings,
      closures: 'as_seen',
      trims: 'as_seen',
      pockets: 'as_seen'
    },

    proportions: {
      symmetry_tol_pct: 3,
      framing_margin_pct: 6
    },

    rules: {
      bg: defaultHex,
      mode,
      show_interiors: showInteriors,
      labels_lock: 'keep_legible_exact',
      authority: {
        geometry_texture: 'refs.primary',
        color_source: 'refs.primary',
        scale_proportion: 'refs.aux|optional'
      }
    },

    refs: {
      primary: primaryFileUri,
      aux: auxFileUris
    }
  };
}

// Build Hints per mode (reusing the same facts)
export function buildHints(facts: FactsV3, control: ControlBlock, mode: RenderType): CCJHints {
  const common: CCJHints = {
    v: 'gm-hints-1.3',
    color_precision: {
      primary_hex: facts?.color_precision?.primary_hex || facts?.palette?.dominant_hex,
      secondary_hex: facts?.color_precision?.secondary_hex || facts?.palette?.accent_hex,
      trim_hex: facts?.color_precision?.trim_hex || facts?.palette?.trim_hex,
      deltaE_max: (facts?.color_precision as any)?.deltaE_max ?? 3,
      saturation_bias: 'neutral'
    },
    material: facts?.construction_details?.material || {},
    fabric_behavior: {
      drape: facts?.fabric_behavior?.drape || 'as_seen',
      stiffness_0_1: facts?.fabric_behavior?.stiffness_0_1 ?? 0.35,
      transparency: facts?.fabric_behavior?.transparency || 'opaque',
      surface_sheen: facts?.fabric_behavior?.surface_sheen || 'matte',
      microtexture: 'as_seen'
    },
    construction: {
      seams: 'preserve',
      edge_finish: 'standard',
      closures: 'as_seen',
      hardware: 'as_seen',
      topstitching: 'preserve',
      print_scale: 'as_seen'
    },
    labels: {
      visible: 'preserve',
      ocr_text: 'do_not_invent',
      known_texts: (facts?.labels_found || []).map(l => l.text).filter(Boolean),
      critical: (facts?.labels_found || []).some(l => l.priority === 'critical') ? 'yes' : 'auto'
    },
    qa: { min_resolution_px: 2000, symmetry_tol_pct: 3, edge_halo_max_pct: 1 },
    safety: { must_not: control?.ban || ['humans','mannequins','props','reflections'] }
  };

  // Mode-specific adjustments
  if (mode === 'ghost') {
    return {
      ...common,
      view: 'front',
      framing: { margin_pct: 6, center: true },
      lighting: { studio_soft: true, white_balance: 'neutral', avoid_hotspots: true },
      shadow: { style: 'contact_only', intensity: 'very_low' },
      interior: {
        render_hollows: true,
        regions: facts?.interior_analysis?.visible_regions?.length
          ? facts.interior_analysis.visible_regions
          : ['neckline','sleeves','hem','vents'],
        edge_thickness_mm: 2,
        occlusion: 'subtle',
        continuity: 'no_fill_no_flatten'
      },
      notes: 'Ghost mannequin: show interior hollows, natural 3-D volume, clean alpha edges.'
    };
  }

  if (mode === 'flatlay') {
    return {
      ...common,
      view: 'top_down',
      framing: { margin_pct: 6, center: true },
      lighting: { soft_top_light: true, white_balance: 'neutral', avoid_hotspots: true },
      shadow: { style: 'none', intensity: 'none' },
      // no interior hints in flatlay
      interior: undefined,
      notes: 'Flatlay: neat laydown, no mannequin volume, top-down camera, pure white background.'
    };
  }

  if (mode === 'on_model') {
    return {
      ...common,
      view: '3d_frontal',
      framing: { margin_pct: 8, center: true },
      lighting: { studio_soft: true, white_balance: 'neutral' },
      shadow: { style: 'contact_only', intensity: 'low' },
      interior: { render_hollows: false },
      notes: 'On-model look on neutral background (digital form), preserve true garment shape & drape.'
    };
  }

  // vton
  return {
    ...common,
    view: '3d_frontal',
    framing: { margin_pct: 8, center: true },
    lighting: { studio_soft: true, white_balance: 'match_subject' },
    shadow: { style: 'scene_consistent', intensity: 'match_subject' },
    interior: { render_hollows: false },
    notes: 'VTO: transfer garment onto provided person reference; preserve scale & material behavior.'
  };
}

// System instruction (short & durable)
export const SYSTEM_GM = [
  'You are a commercial e-commerce product photographer. Return IMAGE ONLY.',
  'Defaults: pure #FFFFFF seamless background; soft even studio light; neutral white balance; centered composition.',
  'Fidelity: match geometry, colors, textures, seams, labels exactly to references. Do not invent.',
  'No humans, mannequins, props, reflections, backgrounds, or added graphics/text.'
].join('\n');

// Render instruction (swaps by mode)
export function buildRenderInstruction(mode: RenderType): string {
  if (mode === 'ghost') {
    return [
      'TASK: Lift the flatlay garment into a 3-D ghost-mannequin product image.',
      'Ghost effect (hard): natural invisible form with realistic volume; show interior hollows (neckline, cuffs, hems, vents) with subtle occlusion and real edge thickness.',
      'Authority: first image is the single source of truth for geometry, micro-texture, pattern, and color.',
      'Fidelity (hard): clean alpha edges; pure #FFFFFF background only; preserve seams, stitching, trims, closures, and label text exactly as seen.',
      'If conflicts, prioritize: (1) safety, (2) image geometry/texture, (3) core contract color/parts, (4) hints.',
      'OUTPUT: IMAGE ONLY.'
    ].join('\n');
  }

  if (mode === 'flatlay') {
    return [
      'TASK: Create a high-end flatlay fashion product photo for e-commerce.',
      'Style (hard): top-down camera; neatly arranged garment; NO mannequin volume; NO interior hollows.',
      'Authority: first image is truth for geometry, texture, pattern, and color.',
      'Fidelity (hard): pure #FFFFFF background; clean edges; preserve seams, stitching, trims, closures, labels exactly as seen.',
      'OUTPUT: IMAGE ONLY.'
    ].join('\n');
  }

  if (mode === 'on_model') {
    return [
      'TASK: Render a clean on-model look on a neutral background using a digital form (no humans).',
      'Use the garment\'s true shape, drape, and proportions from the reference.',
      'Fidelity (hard): preserve seams, stitching, trims, closures, and labels exactly; pure #FFFFFF background; clean edges.',
      'OUTPUT: IMAGE ONLY.'
    ].join('\n');
  }

  // vton
  return [
    'TASK: Transfer the analyzed garment onto the provided person reference realistically.',
    'Match scale, fabric behavior, and lighting to the subject; avoid distortions and artifacts.',
    'Fidelity (hard): preserve garment details and colors; keep background minimal/neutral unless the subject requires.',
    'OUTPUT: IMAGE ONLY.'
  ].join('\n');
}

// Build Gemini parts (images first)
export function buildGeminiParts(
  primaryFileUri: string,
  auxFileUris: string[],
  ccjCore: CCJCore,
  ccjHints: CCJHints,
  renderInstruction: string
) {
  const parts: any[] = [];

  // 1) Primary image first (grounding)
  parts.push({ fileData: { fileUri: primaryFileUri, mimeType: 'image/jpeg' } });

  // 2) Optional aux references (if any)
  for (const aux of (auxFileUris || [])) {
    parts.push({ fileData: { fileUri: aux, mimeType: 'image/jpeg' } });
  }

  // 3) System instruction
  parts.push({ text: SYSTEM_GM });

  // 4) Render instruction (mode-specific)
  parts.push({ text: renderInstruction });

  // 5) CCJ Core (binding)
  parts.push({ text: JSON.stringify(ccjCore) });

  // 6) Hints (secondary steering)
  parts.push({ text: JSON.stringify(ccjHints) });

  return parts;
}

// End-to-end render (drop-in function)
export async function generateCCJRender(
  facts: FactsV3,
  control: ControlBlock,
  primaryFileUri: string,     // Files API URI for cleaned flatlay
  auxFileUris: string[],      // optional refs (e.g., personless A)
  mode: RenderType,
  sessionId: string,
  aspectRatio: '4:5'|'1:1'|'16:9'|'3:4'|'2:3' = '4:5'
): Promise<Buffer> {
  const ccjCore = buildCCJCore(facts, primaryFileUri, auxFileUris, mode, sessionId);
  const ccjHints = buildHints(facts, control, mode);
  const renderInstruction = buildRenderInstruction(mode);
  const parts = buildGeminiParts(primaryFileUri, auxFileUris, ccjCore, ccjHints, renderInstruction);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      responseModalities: ['Image'],        // IMAGE only
      temperature: 0.05,
      imageConfig: { aspectRatio }          // set via config, not text
    }
  });

  const { response } = await model.generateContent(parts);

  // extract image bytes
  for (const c of response.candidates || []) {
    for (const p of (c.content?.parts || [])) {
      if (p.inlineData?.data) {
        return Buffer.from(p.inlineData.data, 'base64');
      }
    }
  }

  throw new Error('No image returned from Gemini');
}

// Helper function to convert image input to Files API URI
export async function prepareImageForModeRender(
  imageInput: string,
  sessionId: string
): Promise<string> {
  try {
    console.log('📤 Uploading to Files API...');
    const filesUri = await toFilesURI(imageInput, 'image/jpeg');
    
    if (filesUri.startsWith('https://generativelanguage.googleapis.com/v1beta/files/')) {
      console.log('✅ Using Files API URI (0 input tokens)');
      return filesUri;
    } else {
      console.log('⚠️ Files API failed, using base64 fallback');
      return filesUri;
    }
  } catch (error) {
    console.warn('Files API upload failed, using base64 fallback:', error);
    
    // Convert to base64 data URI
    const fs = await import('fs');
    const path = await import('path');
    
    if (fs.existsSync(imageInput)) {
      const buffer = fs.readFileSync(imageInput);
      const base64 = buffer.toString('base64');
      console.log('📄 Using base64 encoding (high token usage)');
      return `data:image/jpeg;base64,${base64}`;
    }
    
    throw new Error(`Cannot process image input: ${imageInput}`);
  }
}
