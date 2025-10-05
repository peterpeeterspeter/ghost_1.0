import type { FactsV3, ControlBlock } from './consolidation';
import { createHash } from 'crypto';

/**
 * Improved CCJ Pipeline - Production-ready optimization
 * Based on learnings: interiors matter, stable Gemini 2.5 Flash Image behaviors
 */

// 1) Short, durable system instruction (v1.2)
export const SYSTEM_GM_MIN = `
You are a commercial product photographer. Return IMAGE ONLY.
Defaults: pure #FFFFFF background, soft even studio light, neutral WB, centered catalog framing.
Fidelity: match textures, seams, stitching, trims, and visible labels exactly to references. Do not invent.
No humans, mannequins, props, reflections, gradients, or added text/graphics.
If ambiguous, choose neutral e-commerce rendering that keeps all constraints true.
`.trim();

// 2) Render instruction (forces ghost, interiors, labels)
export const RENDER_INSTRUCTION_GHOST = `
TASK: Lift the flatlay garment into a 3-D ghost-mannequin product image.

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
OUTPUT: IMAGE ONLY.
`.trim();

/**
 * Enhanced Core Contract JSON v1.2 with interior + label locks
 */
export interface CoreContractJSONV12 {
  v: "gm-ccj-1.2";
  id: string;
  category: string;
  silhouette: string;
  pattern: string;
  colors_hex: string[];
  parts: {
    openings: string[];        // garment-agnostic: ["neckline", "sleeves", "hem", "vents"]
    closures: "as_seen";
    trims: "as_seen";
    pockets: "as_seen";
  };
  proportions: {
    symmetry_tol_pct: number;
    framing_margin_pct: number;
  };
  rules: {
    bg: "#FFFFFF";
    ghost: true;
    show_interiors: true;              // <<< interior lock
    labels_lock: "keep_legible_exact"; // <<< label lock
    authority: {
      geometry_texture: "refs.primary";
      color_source: "refs.primary";
      scale_proportion: "refs.aux|optional";
    };
  };
  refs: {
    primary: string;
    aux: string[];
  };
}

/**
 * Enhanced Hints JSON v1.2 with ~60 fields for better quality
 */
export interface HintsJSONV12 {
  v: "gm-hints-1.2";
  view: "front";
  framing: {
    margin_pct: number;
    center: boolean;
  };
  lighting: {
    studio_soft: boolean;
    white_balance: "neutral";
    avoid_hotspots: boolean;
  };
  shadow: {
    style: "contact_only";
    intensity: "very_low";
  };
  color_precision: {
    primary_hex?: string;
    secondary_hex?: string;
    trim_hex?: string;
    deltaE_max: number;
    saturation_bias: "neutral";
  };
  material: {
    family: string;
    weave_knit: string;
    weight: string;
    stretch: string;
  };
  fabric_behavior: {
    drape: string;
    stiffness_0_1: number;
    wrinkle_resistance: string;
    transparency: string;
    surface_sheen: string;
    microtexture: "as_seen";
  };
  construction: {
    seams: "preserve";
    stitch_density: string;
    edge_finish: string;
    closures: "as_seen";
    hardware: "as_seen";
    print_scale: string;
    topstitching: "preserve";
  };
  interior: {
    render_hollows: boolean;
    regions: string[];
    edge_thickness_mm: number;
    occlusion: "subtle";
    continuity: "no_fill_no_flatten";
  };
  labels: {
    visible: "preserve";
    placement: "as_seen";
    ocr_text: "do_not_invent";
    known_texts: string[];
    critical: string;
  };
  qa: {
    min_resolution_px: number;
    symmetry_tol_pct: number;
    edge_halo_max_pct: number;
  };
  safety: {
    must_not: string[];
  };
  notes: string;
}

/**
 * Build enhanced CCJ Core v1.2 with interior + label locks (garment-agnostic)
 */
export function buildCCJCore(facts: any, sessionId: string): CoreContractJSONV12 {
  return {
    v: "gm-ccj-1.2",
    id: sessionId.slice(0, 8),
    category: facts?.category_generic || "generic",
    silhouette: facts?.silhouette || "regular",
    pattern: facts?.pattern || "solid",
    colors_hex: Array.from(new Set([
      facts?.palette?.dominant_hex,
      facts?.palette?.accent_hex,
      ...(facts?.palette?.pattern_hexes || [])
    ].filter(Boolean))).slice(0, 6),
    parts: {
      // garment-agnostic anchors for ghost effect
      openings: ["neckline", "sleeves", "hem", "vents"],
      closures: "as_seen",
      trims: "as_seen",
      pockets: "as_seen"
    },
    proportions: {
      symmetry_tol_pct: facts?.qa_targets?.symmetry_tolerance_pct ?? 3,
      framing_margin_pct: facts?.framing_margin_pct ?? 6
    },
    rules: {
      bg: "#FFFFFF",
      ghost: true,
      show_interiors: true,             // hard lock
      labels_lock: "keep_legible_exact",// hard lock
      authority: {
        geometry_texture: "refs.primary",
        color_source: "refs.primary",
        scale_proportion: "refs.aux|optional"
      }
    },
    refs: {
      primary: facts?.visual_references?.primary || "gs://missing",
      aux: (facts?.visual_references?.aux || []).slice(0, 4)
    }
  };
}

/**
 * Build enhanced CCJ Hints v1.2 with ~60 fields (quality > cost; Flash is cheap)
 */
export function buildCCJHints(facts: any): HintsJSONV12 {
  return {
    v: "gm-hints-1.2",
    view: "front",
    framing: { margin_pct: facts?.framing_margin_pct ?? 6, center: true },
    lighting: { studio_soft: true, white_balance: "neutral", avoid_hotspots: true },
    shadow: { style: "contact_only", intensity: "very_low" },

    color_precision: {
      primary_hex: facts?.color_precision?.primary_hex || facts?.palette?.dominant_hex,
      secondary_hex: facts?.color_precision?.secondary_hex || facts?.palette?.accent_hex,
      trim_hex: facts?.palette?.trim_hex,
      deltaE_max: facts?.qa_targets?.deltaE_max ?? 3,
      saturation_bias: "neutral"
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

    interior: {
      render_hollows: true,
      regions: ["neckline", "sleeves", "hem", "vents"],
      edge_thickness_mm: 2,
      occlusion: "subtle",
      continuity: "no_fill_no_flatten"
    },

    labels: {
      visible: "preserve",
      placement: "as_seen",
      ocr_text: "do_not_invent",
      known_texts: (facts?.labels_found || []).map((l:any)=>l?.text).filter(Boolean),
      critical: (facts?.labels_found || []).some((l:any)=>l?.priority==="critical") ? "yes" : "unknown"
    },

    qa: {
      min_resolution_px: facts?.qa_targets?.min_resolution_px ?? 2000,
      symmetry_tol_pct: facts?.qa_targets?.symmetry_tolerance_pct ?? 3,
      edge_halo_max_pct: facts?.qa_targets?.edge_halo_max_pct ?? 1
    },

    safety: facts?.safety || { must_not: [] },

    notes: "Use exact geometry/color/texture from refs; do not fabricate absent elements."
  };
}

/**
 * Build Gemini parts with images first, then text (better grounding)
 * Order: primary → aux → system → render instruction → core → hints
 */
export async function buildGeminiParts(
  primaryImageUrl: string, 
  auxImageUrls: string[], 
  ccjCore: CoreContractJSONV12, 
  ccjHints: HintsJSONV12,
  sessionId: string
) {
  const parts: any[] = [];
  
  // 1) PRIMARY reference: upload to Files API for optimal token usage
  console.log('📤 Uploading primary image to Files API...');
  const primaryUri = await toFilesURI(primaryImageUrl, 'image/jpeg');
  
  if (primaryUri.startsWith('https://generativelanguage.googleapis.com/v1beta/files/')) {
    // Files API URI - optimal token usage
    parts.push({ fileData: { fileUri: primaryUri, mimeType: 'image/jpeg' } });
    console.log('✅ Using Files API URI for primary image (0 input tokens)');
  } else {
    // Base64 fallback
    parts.push({ inlineData: { data: primaryUri.replace(/^data:image\/[^;]+;base64,/, ''), mimeType: 'image/jpeg' } });
    console.log('⚠️ Using base64 fallback for primary image');
  }

  // 2) AUX refs: upload to Files API if provided (scale/proportion only)
  for (const auxUrl of auxImageUrls) {
    if (auxUrl) {
      console.log('📤 Uploading aux image to Files API...');
      const auxUri = await toFilesURI(auxUrl, 'image/jpeg');
      
      if (auxUri.startsWith('https://generativelanguage.googleapis.com/v1beta/files/')) {
        parts.push({ fileData: { fileUri: auxUri, mimeType: 'image/jpeg' } });
        console.log('✅ Using Files API URI for aux image (0 input tokens)');
      } else {
        parts.push({ inlineData: { data: auxUri.replace(/^data:image\/[^;]+;base64,/, ''), mimeType: 'image/jpeg' } });
        console.log('⚠️ Using base64 fallback for aux image');
      }
    }
  }

  // 3) System instruction (short/durable)
  parts.push({ text: SYSTEM_GM_MIN });

  // 4) Render instruction (forces ghost, interiors, labels)
  parts.push({ text: RENDER_INSTRUCTION_GHOST });

  // 5) Core Contract (binding rules – include ghost/show_interiors/labels_lock)
  parts.push({ text: JSON.stringify({ ccj_core: ccjCore }, null, 0) });

  // 6) Hints (secondary steering - trimmed)
  const trimmedHints = trimNullFields(ccjHints);
  parts.push({ text: JSON.stringify({ ccj_hints: trimmedHints }, null, 0) });
  
  return parts;
}

/**
 * Consolidated CCJ generation with guardrails
 * Never drops interior/labels (if upstream facts are sparse, we still enforce them)
 */
export function consolidateToCCJ(facts: any, sessionId: string) {
  const core = buildCCJCore(facts, sessionId);
  const hints = buildCCJHints(facts);

  // Hard locks (even if upstream facts were sparse)
  core.rules.show_interiors = true;
  core.rules.labels_lock = "keep_legible_exact";

  hints.interior = { ...(hints.interior||{}), render_hollows: true };
  hints.labels = { ...(hints.labels||{}), visible: "preserve", ocr_text: "do_not_invent" };

  return { core, hints };
}

/**
 * Generate Gemini image with stable features
 * Switch to stable Gemini and move AR to config
 */
export async function generateGeminiImage(
  parts: any[], 
  aspect: "4:5"|"1:1"|"16:9" = "4:5"
): Promise<Buffer> {
  // Import Gemini client
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Use stable model with AR in config
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image",
    generationConfig: {
      responseModalities: ["Image"],    // IMAGE only
      temperature: 0.05,
      imageConfig: { aspectRatio: aspect } // set here, not in text
    }
  });

  const result = await model.generateContent(parts);
  const response = await result.response;
  
  // Extract image
  for (const candidate of response.candidates || []) {
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64'); // PNG/JPEG bytes
        }
      }
    }
  }
  
  throw new Error("No image in response");
}

/**
 * Files API upload helper - integrates with existing Files API
 */
export async function toFilesURI(bufOrUrl: Buffer|string, mime = "image/jpeg"): Promise<string> {
  try {
    // Import existing Files Manager
    const { getFilesManager } = await import('./files-manager');
    const filesManager = getFilesManager();
    
    let buffer: Buffer;
    
    if (typeof bufOrUrl === 'string') {
      if (bufOrUrl.startsWith('http')) {
        // It's a URL, fetch it
        const response = await fetch(bufOrUrl);
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        // It's a file path, read it
        const fs = await import('fs');
        buffer = fs.readFileSync(bufOrUrl);
      }
    } else {
      // It's already a Buffer
      buffer = bufOrUrl;
    }
    
    // Upload to Files API
    const uploadResult = await filesManager.uploadFile(buffer, {
      role: 'flatlay',
      sessionId: `ccj-${Date.now()}`,
      mimeType: mime,
      displayName: `ccj-image-${Date.now()}.${mime.split('/')[1]}`
    });
    
    console.log(`✅ Uploaded to Files API: ${uploadResult.uri}`);
    return uploadResult.uri;
    
  } catch (error) {
    console.warn("⚠️ Files API upload failed, using base64 fallback:", error);
    // Fallback to base64 conversion
    if (typeof bufOrUrl === 'string') {
      const response = await fetch(bufOrUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return `data:${mime};base64,${base64}`;
    } else {
      const base64 = bufOrUrl.toString('base64');
      return `data:${mime};base64,${base64}`;
    }
  }
}

/**
 * Helper functions
 */
function dedupeHexes(hexes: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const hex of hexes) {
    if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex) && !seen.has(hex.toLowerCase())) {
      seen.add(hex.toLowerCase());
      result.push(hex);
    }
  }
  
  return result;
}

/**
 * Trim null fields from JSON to reduce payload size
 */
function trimNullFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(trimNullFields).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const trimmed = trimNullFields(value);
      if (trimmed !== undefined) {
        result[key] = trimmed;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  
  return obj;
}

/**
 * Main CCJ pipeline processor with refs-first parts
 * Generation call with refs-first parts (images first for stronger grounding)
 */
export async function processGhostMannequinCCJ(
  facts: any, 
  sessionId: string, 
  aspect: "4:5"|"1:1" = "4:5"
): Promise<Buffer> {
  // Configure Files Manager
  const { configureFilesManager } = await import('./files-manager');
  configureFilesManager(process.env.GEMINI_API_KEY!);
  
  const { core, hints } = consolidateToCCJ(facts, sessionId);

  // Ensure refs from Files API
  const primary = core.refs.primary;
  const aux = core.refs.aux || [];

  const parts = await buildGeminiParts(primary, aux, core, hints, sessionId);
  const img = await generateGeminiImage(parts, aspect);

  // Optional: lightweight QA + single retry
  // if (!passesQA(img)) { return await generateGeminiImage(parts, aspect); }

  return img;
}

/**
 * Process CCJ pipeline with FAL storage upload (like main pipeline)
 * Returns both buffer and permanent URL for display
 */
export async function processGhostMannequinCCJWithStorage(facts: any, sessionId: string): Promise<{
  buffer: Buffer;
  renderUrl: string;
  processingTime: number;
}> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting CCJ pipeline with FAL storage...');
    
    // Generate image using CCJ pipeline
    const imageBuffer = await processGhostMannequinCCJ(facts, sessionId);
    
    // Convert buffer to data URL for FAL storage upload
    const imageBase64 = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;
    
    // Upload to FAL storage for permanent URL (like main pipeline)
    console.log('☁️ Uploading to FAL storage...');
    const { uploadImageToFalStorage } = await import('./fal');
    const renderUrl = await uploadImageToFalStorage(imageDataUrl);
    
    const processingTime = Date.now() - startTime;
    console.log('✅ CCJ pipeline with FAL storage completed:', renderUrl);
    
    return {
      buffer: imageBuffer,
      renderUrl,
      processingTime
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ CCJ pipeline with storage failed:', errorMsg);
    throw error;
  }
}

/**
 * Optional QA + retry for quality > cost
 */
export async function generateWithQA(
  parts: any[], 
  aspect: "4:5"|"1:1"|"16:9" = "4:5"
): Promise<Buffer> {
  const img = await generateGeminiImage(parts, aspect);
  
  // Quick QA check (simplified)
  if (!passesQA(img)) {
    console.log('QA failed, retrying...');
    const retry = await generateGeminiImage(parts, aspect);
    return retry;
  }
  
  return img;
}

/**
 * Practical QA nudges (optional but helpful)
 * If you see washed color: lower temperature (0.0–0.03) and set deltaE_max to 2.
 * If edges halo: add qa.edge_halo_max_pct=0.5.
 * If symmetry off: set proportions.symmetry_tol_pct=2 and framing.margin_pct=5.
 */
function passesQA(img: Buffer): boolean {
  // Simplified QA - check if image is valid and has reasonable size
  return img.length > 10000 && img.length < 5000000; // 10KB to 5MB
}
