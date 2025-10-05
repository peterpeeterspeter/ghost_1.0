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
    material: {
      family: facts?.material || "unknown",
      weave_knit: facts?.weave_knit || "unknown", 
      weight: facts?.fabric_behavior?.weight_class || "unknown",
      stretch: facts?.fabric_behavior?.stretch_capability || "unknown"
    },
    fabric_behavior: {
      drape: facts?.fabric_behavior?.drape_characteristic || "as_seen",
      stiffness_0_1: facts?.drape_stiffness ?? 0.4,
      wrinkle_resistance: facts?.fabric_behavior?.wrinkle_resistance || "moderate",
      transparency: facts?.transparency || "opaque",
      surface_sheen: facts?.surface_sheen || "matte",
      microtexture: "as_seen"
    },
    construction: {
      seams: "preserve",
      stitch_density: facts?.construction_precision?.stitch_density || "as_seen",
      edge_finish: facts?.edge_finish || "as_seen",
      closures: "as_seen",
      hardware: "as_seen",
      print_scale: facts?.print_scale || "as_seen",
      topstitching: "preserve"
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
    // Use EXACT hardcoded ghost structure for optimal quality
    return {
      v: 'gm-hints-1.2',  // Same version as hardcoded
      view: 'front',
      framing: { margin_pct: 6, center: true },
      lighting: { studio_soft: true, white_balance: 'neutral', avoid_hotspots: true },
      shadow: { style: 'contact_only', intensity: 'very_low' },

      color_precision: {
        primary_hex: facts?.color_precision?.primary_hex || facts?.palette?.dominant_hex,
        secondary_hex: facts?.color_precision?.secondary_hex || facts?.palette?.accent_hex,
        trim_hex: facts?.palette?.trim_hex,
        deltaE_max: facts?.qa_targets?.deltaE_max ?? 3,
        saturation_bias: 'neutral'
      },

      material: {
        family: facts?.material || 'unknown',
        weave_knit: facts?.weave_knit || 'unknown',
        weight: facts?.fabric_behavior?.weight_class || 'unknown',
        stretch: facts?.fabric_behavior?.stretch_capability || 'unknown'
      },

      fabric_behavior: {
        drape: facts?.fabric_behavior?.drape_characteristic || 'as_seen',
        stiffness_0_1: facts?.drape_stiffness ?? 0.4,
        wrinkle_resistance: facts?.fabric_behavior?.wrinkle_resistance || 'moderate',
        transparency: facts?.transparency || 'opaque',
        surface_sheen: facts?.surface_sheen || 'matte',
        microtexture: 'as_seen'
      },

      construction: {
        seams: 'preserve',
        stitch_density: facts?.construction_precision?.stitch_density || 'as_seen',
        edge_finish: facts?.edge_finish || 'as_seen',
        closures: 'as_seen',
        hardware: 'as_seen',
        print_scale: facts?.print_scale || 'as_seen',
        topstitching: 'preserve'
      },

      interior: {
        render_hollows: true,
        regions: ['neckline', 'sleeves', 'hem', 'vents'],
        edge_thickness_mm: 2,
        occlusion: 'subtle',
        continuity: 'no_fill_no_flatten'
      },

      labels: {
        visible: 'preserve',
        placement: 'as_seen',
        ocr_text: 'do_not_invent',
        known_texts: (facts?.labels_found || []).map((l:any) => l?.text).filter(Boolean),
        critical: (facts?.labels_found || []).some((l:any) => l?.priority === 'critical') ? 'yes' : 'unknown'
      },

      qa: {
        min_resolution_px: facts?.qa_targets?.min_resolution_px ?? 2000,
        symmetry_tol_pct: facts?.qa_targets?.symmetry_tolerance_pct ?? 3,
        edge_halo_max_pct: facts?.qa_targets?.edge_halo_max_pct ?? 1
      },

      safety: facts?.safety || { must_not: [] },

      notes: 'Use exact geometry/color/texture from refs; do not fabricate absent elements.'
    };
  }

  if (mode === 'flatlay') {
    return {
      ...common,
      view: 'top_down',
      framing: { margin_pct: 6, center: true, grid_align: true },
      lighting: { soft_top_light: true, white_balance: 'neutral', avoid_hotspots: true, fill_ratio: 'even' },
      shadow: { style: 'none', intensity: 'none' },

      // NEW: styling program and anti-crease policy
      styling: {
        pressed_or_steamed: true,             // force "finished" look
        lint_free_cleanup: true,
        retail_folds: true,
        alignments: ['hem_straight','placket_straight','collar_symmetric','side_seams_parallel'],
        sleeve_strategy: 'tuck_and_taper',    // neat sleeve taper instead of bunching
        waistband_strategy: 'flatten_and_center',
        hanger_marks_remove: true,
        logo_face_up: 'as_seen'
      },

      crease_policy: {
        allow_random_wrinkles: false,         // disallow random creases
        keep_structural_folds_only: true,     // folds that define shape are OK
        smooth_local_bunching: true,
        edge_wave_tolerance_pct: 1.0          // tighten if needed
      },

      // Fabric-aware smoothing targets (uses analysis to stay realistic)
      fabric_behavior: {
        drape: facts?.fabric_behavior?.drape || 'as_seen',
        stiffness_0_1: facts?.drape_stiffness ?? 0.35,
        wrinkle_resistance: facts?.fabric_behavior?.wrinkle_resistance || 'moderate',
        transparency: facts?.transparency || 'opaque',
        surface_sheen: facts?.surface_sheen || 'matte',
        microtexture: 'as_seen'
      },

      // Optional garment presets to reduce creases by type (reusable, garment-agnostic)
      garment_presets: {
        shirt: { button_policy: 'fully_buttoned', collar_roll: 'natural', sleeve_fold: 'single_minimal' },
        trousers: { leg_alignment: 'parallel', rise_flatten: true, pocket_bag_hide: true },
        dress: { bodice_flatten: true, skirt_sweep: 'gentle', belt_tidy: true },
        knit_top: { cuff_taper: true, hem_dewave: true }
      },

      // QA gates (auto-retry if not neat)
      qa: {
        min_resolution_px: 2000,
        symmetry_tol_pct: 2,
        edge_halo_max_pct: 0.8,
        // NEW wrinkle and alignment targets
        max_random_crease_score: 0.15,        // demand low-crease look
        hem_line_max_deviation_px: 2,         // keep hems straight
        placket_max_curve_px: 2               // avoid bowing plackets
      },

      // no interior hints in flatlay
      interior: undefined,
      notes: 'Retail-styled flatlay: pressed/steamed, straightened edges, structural folds only; remove random creases.'
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
      notes: "Use exact geometry/color/texture from refs; do not fabricate absent elements."
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
    notes: "Use exact geometry/color/texture from refs; do not fabricate absent elements."
  };
}

// System instruction (short & durable) - SAME AS HARDCODED GHOST
export const SYSTEM_GM_GHOST = `You are a commercial product photographer. Return IMAGE ONLY.
Defaults: pure #FFFFFF background, soft even studio light, neutral WB, centered catalog framing.
Fidelity: match textures, seams, stitching, trims, and visible labels exactly to references. Do not invent.
No humans, mannequins, props, reflections, gradients, or added text/graphics.
If ambiguous, choose neutral e-commerce rendering that keeps all constraints true.`.trim();

// Mode-specific system instructions
export const SYSTEM_GM_FLATLAY = `You are a commercial FLATLAY product photographer. Return IMAGE ONLY.
Defaults: pure #FFFFFF seamless; TOP-DOWN camera; soft, even top light; neutral white balance; centered framing.
Styling (hard): garment is PRESSED/STEAMED, lint-free, retail-styled with clean retail folds and straightened hems/collars/sleeve lines.
Fidelity (hard): match colors, textures, patterns, and labels to the reference exactly. Do not invent.
No humans, mannequins, props, environments, reflections, or added graphics/text.`.trim();

export const SYSTEM_GM_ON_MODEL = `You are a commercial on-model product photographer. Return IMAGE ONLY.
Defaults: pure #FFFFFF background, 3D frontal view, soft studio lighting, neutral white balance.
Fidelity: match colors, textures, patterns, and labels exactly to references. Do not invent.
No humans, mannequins, props, reflections, or added graphics/text.
Render garment on digital form with realistic drape and proportions.`.trim();

export const SYSTEM_GM_VTON = `You are a commercial virtual try-on photographer. Return IMAGE ONLY.
Defaults: match subject background, 3D frontal view, scene-consistent lighting.
Fidelity: match colors, textures, patterns, and labels exactly to references. Do not invent.
No added graphics/text. Preserve subject's pose and background context.
Transfer garment realistically onto provided person reference.`.trim();

// Legacy export for backward compatibility
export const SYSTEM_GM = SYSTEM_GM_GHOST;

// Get system instruction based on mode
export function getSystemInstruction(mode: RenderType): string {
  switch (mode) {
    case 'ghost': return SYSTEM_GM_GHOST;
    case 'flatlay': return SYSTEM_GM_FLATLAY;
    case 'on_model': return SYSTEM_GM_ON_MODEL;
    case 'vton': return SYSTEM_GM_VTON;
    default: return SYSTEM_GM_GHOST;
  }
}

// Render instruction (swaps by mode) - SAME AS HARDCODED GHOST FOR GHOST MODE
export function buildRenderInstruction(mode: RenderType): string {
  if (mode === 'ghost') {
    return `TASK: Lift the flatlay garment into a 3-D ghost-mannequin product image.

Authority:
• Use the first image as the single source of truth for geometry, micro-texture, pattern, and color.
• If a second image exists, use it only for global scale/proportion hints.

Ghost mannequin (hard):
• Natural invisible form/volume; show interior hollows (neckline, cuffs, hems, vents) with subtle occlusion and real edge thickness.
• Sleeves remain cylindrical; hem perfectly level.
• Preserve visible labels/logos exactly as seen (do not invent or relocate text).

Fidelity (hard):
• Match colors precisely; preserve seam lines, stitching, trims, closures, and print scale.
• Clean alpha edges, no halos; background is pure #FFFFFF only.
• Only a very soft, tight contact shadow (no long/directional shadows).

Follow the attached JSON CONTRACT (binding) and JSON HINTS (secondary). If conflicts, prioritize:
1) safety, 2) image geometry/texture, 3) contract color/parts, 4) hints.
OUTPUT: IMAGE ONLY.`.trim();
  }

  if (mode === 'flatlay') {
    return [
      'TASK: Produce a HIGH-END FLATLAY e-commerce product photo.',
      'Authority: the first image is the single source of truth for geometry, texture, pattern, and color.',
      'Styling (hard): pressed/steamed finish; straighten hems, plackets, waistbands; align side seams; smooth random creases; keep only STRUCTURAL folds needed for a neat laydown; zero bunching.',
      'Composition (hard): true top-down camera; centered; parallel edges; consistent margins.',
      'Lighting (hard): soft, even top light; NO hotspots; neutral white balance.',
      'Background (hard): pure #FFFFFF only; clean alpha edges (no halos).',
      'Labels/prints (hard): preserve as seen; legible; do not relocate or invent text.',
      'Shadows: none or ultra-soft contact only under thick trim—avoid visible cast shadows.',
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
  renderInstruction: string,
  systemInstruction: string
) {
  const parts: any[] = [];

  // 1) Primary image first (grounding)
  parts.push({ fileData: { fileUri: primaryFileUri, mimeType: 'image/jpeg' } });

  // 2) Optional aux references (if any)
  for (const aux of (auxFileUris || [])) {
    parts.push({ fileData: { fileUri: aux, mimeType: 'image/jpeg' } });
  }

  // 3) System instruction (mode-specific)
  parts.push({ text: systemInstruction });

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
  const systemInstruction = getSystemInstruction(mode);
  const parts = buildGeminiParts(primaryFileUri, auxFileUris, ccjCore, ccjHints, renderInstruction, systemInstruction);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      responseModalities: ['Image'],        // IMAGE only
      temperature: 0.05,
      seed: 7,                             // consistency for batch testing
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
