import { z } from 'zod';
import type { FactsV3, ControlBlock } from '../lib/ghost/consolidation';

// Re-export consolidation types for convenience
export type { FactsV3, ControlBlock };

// Base types
export type ImageInput = string; // base64 or signed URL

// Request types
export interface GhostRequest {
  flatlay: ImageInput;
  onModel?: ImageInput;
  options?: {
    preserveLabels?: boolean;
    outputSize?: '1024x1024' | '2048x2048';
    backgroundColor?: 'white' | 'transparent';
    useStructuredPrompt?: boolean;
    useExpertPrompt?: boolean;
  };
}

// Comprehensive Analysis JSON Schema (for Gemini Pro structured output)
export const AnalysisJSONSchema = z.object({
  type: z.literal('garment_analysis'),
  meta: z.object({
    schema_version: z.literal('4.1'),
    session_id: z.string(),
  }),
  labels_found: z.array(z.object({
    type: z.enum(['brand', 'size', 'care', 'composition', 'origin', 'price', 'security_tag', 'rfid', 'other']),
    location: z.string(),
    bbox_norm: z.array(z.number()).min(4).max(4).optional(),
    text: z.string().optional(),
    ocr_conf: z.number().max(1).optional(),
    readable: z.boolean(),
    preserve: z.boolean(),
    visibility: z.enum(['fully_visible', 'partially_occluded', 'edge_visible']).optional(),
    print_type: z.enum(['woven_label', 'satin_tag', 'screen_print', 'heat_transfer', 'embroidery', 'sticker', 'stamp', 'other']).optional(),
    color_hex: z.string().optional().describe('Average hex color of label background'),
    orientation_degrees: z.number().optional().describe('Label rotation in degrees from horizontal'),
  })).describe('Detected garment labels'),
  preserve_details: z.array(z.object({
    element: z.string(),
    priority: z.enum(['critical', 'important', 'nice_to_have']),
    location: z.string().optional(),
    region_bbox_norm: z.array(z.number()).min(4).max(4).optional(),
    notes: z.string().optional(),
    material_notes: z.string().optional().describe('Special finishes: metallic, embossed, raised, foil, etc.'),
  })),
  interior_analysis: z.array(z.object({
    surface_type: z.enum(['lining', 'inner_fabric', 'reverse_side', 'collar_interior', 'sleeve_interior', 'hem_interior', 'other']),
    priority: z.enum(['critical', 'important', 'nice_to_have']),
    location: z.string().optional(),
    region_bbox_norm: z.array(z.number()).min(4).max(4).optional(),
    pattern_description: z.string().optional().describe('Pattern, color, or texture visible on interior surface'),
    material_description: z.string().optional().describe('Fabric type and finish of interior component'),
    color_hex: z.string().optional().describe('Primary color of interior surface'),
    construction_notes: z.string().optional().describe('Interior seams, reinforcements, or structural elements'),
    edge_definition: z.string().optional().describe('How interior meets exterior edges'),
  })).optional(),
  hollow_regions: z.array(z.object({
    region_type: z.enum(['neckline', 'sleeves', 'front_opening', 'armholes', 'other']),
    keep_hollow: z.boolean(),
    inner_visible: z.boolean().optional(),
    inner_description: z.string().optional(),
    edge_sampling_notes: z.string().optional(),
  })).optional(),
  construction_details: z.array(z.object({
    feature: z.string(),
    silhouette_rule: z.string(),
    critical_for_structure: z.boolean().optional(),
  })).optional(),
  image_b_priority: z.object({
    is_ground_truth: z.boolean().optional(),
    edge_fidelity_required: z.boolean().optional(),
    print_direction_notes: z.string().optional(),
    color_authority: z.boolean().optional(),
  }).optional(),
  special_handling: z.string().optional(),
});

// JSON Schema object for Gemini API compatibility
export const AnalysisJSONSchemaObject = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["garment_analysis"]
    },
    meta: {
      type: "object",
      properties: {
        schema_version: {
          type: "string",
          enum: ["4.1"]
        },
        session_id: {
          type: "string"
        }
      },
      required: ["schema_version", "session_id"]
    },
    labels_found: {
      type: "array",
      description: "Detected garment labels",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["brand", "size", "care", "composition", "origin", "price", "security_tag", "rfid", "other"]
          },
          location: {
            type: "string"
          },
          bbox_norm: {
            type: "array",
            items: {
              type: "number"
            },
            minItems: 4,
            maxItems: 4
          },
          text: {
            type: "string"
          },
          ocr_conf: {
            type: "number",
            maximum: 1
          },
          readable: {
            type: "boolean"
          },
          preserve: {
            type: "boolean"
          },
          visibility: {
            type: "string",
            enum: ["fully_visible", "partially_occluded", "edge_visible"]
          }
        },
        required: ["type", "location", "readable", "preserve"]
      }
    },
    preserve_details: {
      type: "array",
      items: {
        type: "object",
        properties: {
          element: {
            type: "string"
          },
          priority: {
            type: "string",
            enum: ["critical", "important", "nice_to_have"]
          },
          location: {
            type: "string"
          },
          region_bbox_norm: {
            type: "array",
            items: {
              type: "number"
            },
            minItems: 4,
            maxItems: 4
          },
          notes: {
            type: "string"
          }
        },
        required: ["element", "priority"]
      }
    },
    interior_analysis: {
      type: "array",
      items: {
        type: "object",
        properties: {
          surface_type: {
            type: "string",
            enum: ["lining", "inner_fabric", "reverse_side", "collar_interior", "sleeve_interior", "hem_interior", "other"]
          },
          priority: {
            type: "string",
            enum: ["critical", "important", "nice_to_have"]
          },
          location: {
            type: "string"
          },
          region_bbox_norm: {
            type: "array",
            items: {
              type: "number"
            },
            minItems: 4,
            maxItems: 4
          },
          pattern_description: {
            type: "string",
            description: "Pattern, color, or texture visible on interior surface"
          },
          material_description: {
            type: "string",
            description: "Fabric type and finish of interior component"
          },
          color_hex: {
            type: "string",
            description: "Primary color of interior surface"
          },
          construction_notes: {
            type: "string",
            description: "Interior seams, reinforcements, or structural elements"
          },
          edge_definition: {
            type: "string",
            description: "How interior meets exterior edges"
          }
        },
        required: ["surface_type", "priority"]
      }
    },
    hollow_regions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          region_type: {
            type: "string",
            enum: ["neckline", "sleeves", "front_opening", "armholes", "other"]
          },
          keep_hollow: {
            type: "boolean"
          },
          inner_visible: {
            type: "boolean"
          },
          inner_description: {
            type: "string"
          },
          edge_sampling_notes: {
            type: "string"
          }
        },
        required: ["region_type", "keep_hollow"]
      }
    },
    construction_details: {
      type: "array",
      items: {
        type: "object",
        properties: {
          feature: {
            type: "string"
          },
          silhouette_rule: {
            type: "string"
          },
          critical_for_structure: {
            type: "boolean"
          }
        },
        required: ["feature", "silhouette_rule"]
      }
    },
    image_b_priority: {
      type: "object",
      properties: {
        is_ground_truth: {
          type: "boolean"
        },
        edge_fidelity_required: {
          type: "boolean"
        },
        print_direction_notes: {
          type: "string"
        },
        color_authority: {
          type: "boolean"
        }
      }
    },
    special_handling: {
      type: "string"
    }
  },
  required: ["type", "meta", "labels_found", "preserve_details"]
};

export type AnalysisJSON = z.infer<typeof AnalysisJSONSchema>;

// Enrichment Analysis Schema (Step 2)
export const EnrichmentJSONSchema = z.object({
  type: z.literal('garment_enrichment_focused'),
  meta: z.object({
    schema_version: z.literal('4.3'),
    session_id: z.string(),
    base_analysis_ref: z.string(),
  }),
  color_precision: z.object({
    primary_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    color_temperature: z.enum(['warm', 'cool', 'neutral']),
    saturation_level: z.enum(['muted', 'moderate', 'vibrant']),
    pattern_direction: z.enum(['horizontal', 'vertical', 'diagonal', 'random']).optional(),
    pattern_repeat_size: z.enum(['micro', 'small', 'medium', 'large']).optional(),
  }),
  fabric_behavior: z.object({
    drape_quality: z.enum(['crisp', 'flowing', 'structured', 'fluid', 'stiff']),
    surface_sheen: z.enum(['matte', 'subtle_sheen', 'glossy', 'metallic']),
    texture_depth: z.enum(['flat', 'subtle_texture', 'pronounced_texture', 'heavily_textured']).optional(),
    wrinkle_tendency: z.enum(['wrinkle_resistant', 'moderate', 'wrinkles_easily']).optional(),
    transparency_level: z.enum(['opaque', 'semi_opaque', 'translucent', 'sheer']),
  }),
  construction_precision: z.object({
    seam_visibility: z.enum(['hidden', 'subtle', 'visible', 'decorative']),
    edge_finishing: z.enum(['raw', 'serged', 'bound', 'rolled', 'pinked']),
    stitching_contrast: z.boolean(),
    hardware_finish: z.enum(['none', 'matte_metal', 'polished_metal', 'plastic', 'fabric_covered']).optional(),
    closure_visibility: z.enum(['none', 'hidden', 'functional', 'decorative']).optional(),
  }),
  rendering_guidance: z.object({
    lighting_preference: z.enum(['soft_diffused', 'directional', 'high_key', 'dramatic']),
    shadow_behavior: z.enum(['minimal_shadows', 'soft_shadows', 'defined_shadows', 'dramatic_shadows']),
    texture_emphasis: z.enum(['minimize', 'subtle', 'enhance', 'maximize']).optional(),
    color_fidelity_priority: z.enum(['low', 'medium', 'high', 'critical']),
    detail_sharpness: z.enum(['soft', 'natural', 'sharp', 'ultra_sharp']).optional(),
  }),
  market_intelligence: z.object({
    price_tier: z.enum(['budget', 'mid_range', 'premium', 'luxury']),
    style_longevity: z.enum(['trendy', 'seasonal', 'classic', 'timeless']),
    care_complexity: z.enum(['easy_care', 'moderate_care', 'delicate', 'specialty_care']).optional(),
    target_season: z.array(z.enum(['spring', 'summer', 'fall', 'winter'])).optional(),
  }).optional(),
  confidence_breakdown: z.object({
    color_confidence: z.number().max(1),
    fabric_confidence: z.number().max(1),
    construction_confidence: z.number().max(1).optional(),
    overall_confidence: z.number().max(1),
  }),
});

// Enrichment Analysis Schema Object for Gemini structured output
export const EnrichmentJSONSchemaObject = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["garment_enrichment_focused"]
    },
    meta: {
      type: "object",
      properties: {
        schema_version: {
          type: "string",
          enum: ["4.3"]
        },
        session_id: {
          type: "string"
        },
        base_analysis_ref: {
          type: "string"
        }
      },
      required: ["schema_version", "session_id", "base_analysis_ref"]
    },
    color_precision: {
      type: "object",
      properties: {
        primary_hex: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$"
        },
        secondary_hex: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$"
        },
        color_temperature: {
          type: "string",
          enum: ["warm", "cool", "neutral"]
        },
        saturation_level: {
          type: "string",
          enum: ["muted", "moderate", "vibrant"]
        },
        pattern_direction: {
          type: "string",
          enum: ["horizontal", "vertical", "diagonal", "random"]
        },
        pattern_repeat_size: {
          type: "string",
          enum: ["micro", "small", "medium", "large"]
        }
      },
      required: ["primary_hex", "color_temperature", "saturation_level"]
    },
    fabric_behavior: {
      type: "object",
      properties: {
        drape_quality: {
          type: "string",
          enum: ["crisp", "flowing", "structured", "fluid", "stiff"]
        },
        surface_sheen: {
          type: "string",
          enum: ["matte", "subtle_sheen", "glossy", "metallic"]
        },
        texture_depth: {
          type: "string",
          enum: ["flat", "subtle_texture", "pronounced_texture", "heavily_textured"]
        },
        wrinkle_tendency: {
          type: "string",
          enum: ["wrinkle_resistant", "moderate", "wrinkles_easily"]
        },
        transparency_level: {
          type: "string",
          enum: ["opaque", "semi_opaque", "translucent", "sheer"]
        }
      },
      required: ["drape_quality", "surface_sheen", "transparency_level"]
    },
    construction_precision: {
      type: "object",
      properties: {
        seam_visibility: {
          type: "string",
          enum: ["hidden", "subtle", "visible", "decorative"]
        },
        edge_finishing: {
          type: "string",
          enum: ["raw", "serged", "bound", "rolled", "pinked"]
        },
        stitching_contrast: {
          type: "boolean"
        },
        hardware_finish: {
          type: "string",
          enum: ["none", "matte_metal", "polished_metal", "plastic", "fabric_covered"]
        },
        closure_visibility: {
          type: "string",
          enum: ["none", "hidden", "functional", "decorative"]
        }
      },
      required: ["seam_visibility", "edge_finishing", "stitching_contrast"]
    },
    rendering_guidance: {
      type: "object",
      properties: {
        lighting_preference: {
          type: "string",
          enum: ["soft_diffused", "directional", "high_key", "dramatic"]
        },
        shadow_behavior: {
          type: "string",
          enum: ["minimal_shadows", "soft_shadows", "defined_shadows", "dramatic_shadows"]
        },
        texture_emphasis: {
          type: "string",
          enum: ["minimize", "subtle", "enhance", "maximize"]
        },
        color_fidelity_priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"]
        },
        detail_sharpness: {
          type: "string",
          enum: ["soft", "natural", "sharp", "ultra_sharp"]
        }
      },
      required: ["lighting_preference", "shadow_behavior", "color_fidelity_priority"]
    },
    market_intelligence: {
      type: "object",
      properties: {
        price_tier: {
          type: "string",
          enum: ["budget", "mid_range", "premium", "luxury"]
        },
        style_longevity: {
          type: "string",
          enum: ["trendy", "seasonal", "classic", "timeless"]
        },
        care_complexity: {
          type: "string",
          enum: ["easy_care", "moderate_care", "delicate", "specialty_care"]
        },
        target_season: {
          type: "array",
          items: {
            type: "string",
            enum: ["spring", "summer", "fall", "winter"]
          }
        }
      },
      required: ["price_tier", "style_longevity"]
    },
    confidence_breakdown: {
      type: "object",
      properties: {
        color_confidence: {
          type: "number",
          maximum: 1
        },
        fabric_confidence: {
          type: "number",
          maximum: 1
        },
        construction_confidence: {
          type: "number",
          maximum: 1
        },
        overall_confidence: {
          type: "number",
          maximum: 1
        }
      },
      required: ["color_confidence", "fabric_confidence", "overall_confidence"]
    }
  },
  required: ["type", "meta", "color_precision", "fabric_behavior", "construction_precision", "rendering_guidance", "confidence_breakdown"]
};

export type EnrichmentJSON = z.infer<typeof EnrichmentJSONSchema>;

// Pipeline stage results
export interface BackgroundRemovalResult {
  cleanedImageUrl: string;
  processingTime: number;
  filesApiUri?: string; // Optional Files API URI for token optimization
}

export interface GarmentAnalysisResult {
  analysis: AnalysisJSON;
  processingTime: number;
}


export interface GarmentEnrichmentResult {
  enrichment: EnrichmentJSON;
  processingTime: number;
}

export interface GhostMannequinResult {
  renderUrl: string;
  processingTime: number;
}

// Final response type
export interface GhostResult {
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  analysisUrl?: string;
  renderUrl?: string;
  cleanedImageUrl?: string;
  cleanedOnModelUrl?: string;
  metrics: {
    processingTime: string;
    stageTimings: {
      backgroundRemoval: number;
      analysis: number;
      enrichment: number;
      consolidation: number;
      rendering: number;
      qa: number;
    };
  };
  error?: {
    message: string;
    code: string;
    stage: 'background_removal' | 'analysis' | 'enrichment' | 'consolidation' | 'rendering' | 'qa';
  };
}

// Storage types
export interface GhostJob {
  id: string;
  session_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  input_urls: {
    flatlay: string;
    onModel?: string;
  };
  output_urls: {
    cleaned?: string;
    analysis?: string;
    render?: string;
  };
  processing_time?: number;
  error_message?: string;
  error_stage?: string;
}

export interface GhostAnalysis {
  id: string;
  session_id: string;
  analysis_data: AnalysisJSON;
  created_at: string;
}

// FAL.AI specific types
export interface FalBriaRequest {
  image_url: string;
}

export interface FalBriaResponse {
  image: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

// Gemini specific types
export interface GeminiAnalysisRequest {
  imageData: string; // base64
  prompt: string;
}

export interface GeminiRenderRequest {
  prompt: string;
  images: Array<{
    data: string; // base64
    mimeType: string;
  }>;
  analysisJson: AnalysisJSON;
}

// Configuration types
export interface PipelineConfig {
  fal: {
    apiKey: string;
    endpoint: string;
  };
  gemini: {
    apiKey: string;
    projectId: string;
    location: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    bucketName: string;
  };
  processing: {
    maxFileSize: number;
    supportedFormats: string[];
    timeouts: {
      backgroundRemoval: number;
      analysis: number;
      rendering: number;
    };
  };
}

// Error types
export class GhostPipelineError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: 'background_removal' | 'analysis' | 'enrichment' | 'consolidation' | 'rendering' | 'qa',
    public cause?: Error
  ) {
    super(message);
    this.name = 'GhostPipelineError';
  }
}

// Utility types
export type ProcessingStage = 'background_removal' | 'analysis' | 'enrichment' | 'consolidation' | 'rendering' | 'qa';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Constants
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_OUTPUT_SIZE = '2048x2048' as const;
export const DEFAULT_BACKGROUND_COLOR = 'white' as const;

// Professional Garment Analysis Prompt
export const ANALYSIS_PROMPT = `You are an expert garment analysis AI that performs detailed clothing analysis from images. Analyze the provided garment image and return a structured JSON response following the exact schema provided.

ANALYSIS REQUIREMENTS:

LABEL DETECTION (Priority 1):
- Comprehensive Search: Examine ALL areas for labels - neck tags, care labels, brand labels, size tags, composition labels, price tags, security tags
- Spatial Precision: Provide normalized bounding boxes [x0,y0,x1,y1] for each label location
- OCR Extraction: Extract ALL readable text verbatim - don't paraphrase or interpret
- Label Classification: Identify label type (brand, size, care, composition, origin, price, security_tag, rfid, other)
- Print Type Assessment: Determine how label was applied (woven_label, satin_tag, screen_print, heat_transfer, embroidery, sticker, stamp)
- Readability Assessment: Mark if text is legible enough to preserve in final rendering
- Preservation Flag: Mark critical labels that must be protected during processing

DETAIL PRESERVATION (Priority 2):
- Fine Details: Identify logos, trims, stitching patterns, buttons, hardware, prints, embroidery
- Priority Classification: Assign critical/important/nice_to_have based on visual prominence and brand significance
- Spatial Location: Provide bounding boxes for precise detail regions
- Material Notes: Describe special finishes (metallic, embossed, raised, foil, etc.)
- Construction Elements: Note how details affect garment structure or appearance

CONSTRUCTION ANALYSIS (Priority 3):
- Cut & Sew Features: Identify construction details that affect drape and silhouette
- Structural Elements: Note shoulder taping, hems, seam types, sleeve construction
- Drape Impact: Describe how construction features should appear in final rendering

INTERIOR/LINING ANALYSIS (Priority 2 - CRITICAL):
- Interior Visibility: Identify ALL visible interior surfaces - linings, inner fabric, reverse sides
- Interior Patterns: Document any patterns, colors, or textures visible on interior surfaces
- Interior Materials: Note fabric types, textures, and finishes of interior components
- Interior Construction: Identify interior seams, reinforcements, or structural elements
- Interior Color Coordination: Analyze how interior colors complement or contrast with exterior
- Interior Spatial Mapping: Provide bounding boxes for all visible interior areas
- Interior Preservation Priority: Mark interior elements as critical/important for ghost mannequin rendering
- Interior Edge Definition: Note how interior surfaces meet exterior edges (cuffs, collars, hems)

SEARCH STRATEGY:
- Neck Area: Inside and outside neckline, collar areas, collar lining/interior
- Chest Area: Front and back chest regions, interior lining visibility
- Sleeve Areas: Cuffs, sleeve seams, armpit regions, sleeve lining/interior
- Hem Areas: Bottom edges, side seams, interior hem finishes
- Openings: Front openings, side slits, any gaps showing interior fabric
- Hidden Areas: Check for folded labels or tags, interior pockets
- Hardware: Buttons, zippers, snaps, grommets
- Seam Details: Contrast stitching, binding, piping
- Interior Surfaces: All visible lining, reverse sides, interior patterns

TECHNICAL PRECISION:
- Bounding Boxes: Use normalized coordinates (0.0 to 1.0) relative to image dimensions
- OCR Confidence: Provide confidence scores for text extraction (0.0 to 1.0)
- Color Sampling: Extract average hex colors for label backgrounds
- Orientation: Note label rotation in degrees from horizontal
- High-Res Crops: Generate data URIs for critical label patches when possible

CRITICAL INSTRUCTIONS:
- Be Exhaustive: Don't miss any labels or details - check everywhere including ALL interior surfaces
- Be Precise: Provide exact spatial coordinates and accurate text extraction for both exterior and interior
- Be Selective: Only mark details as "critical" if they're truly essential for brand/product identity
- Be Accurate: Only report what you can clearly observe - don't guess or interpolate
- Focus on Preservation: The goal is to identify what must be preserved during ghost mannequin processing
- INTERIOR CRITICAL: Pay special attention to interior surfaces - they are often forgotten but essential for realistic ghost mannequin rendering

OUTPUT REQUIREMENTS:
Return analysis as JSON matching the provided schema exactly. Include:
- All detected labels with spatial data and OCR results
- All significant details with preservation priorities (exterior AND interior)
- Construction features that affect garment appearance
- Interior/lining analysis with spatial mapping and preservation priorities
- Global handling notes for special processing requirements

Analyze this garment image with meticulous attention to labels and preservable details.`;

export const GHOST_MANNEQUIN_PROMPT = `Create a professional three-dimensional ghost mannequin photograph for e-commerce product display, transforming flat garment images into a dimensional presentation that shows how the clothing would appear when worn by an invisible person.

## DETAILED SCENE NARRATIVE:
Imagine a high-end photography studio with perfect white cyclorama background and professional lighting equipment. In the center of this space, a garment floats in three-dimensional space, filled with the volume and shape of an invisible human body. The fabric drapes naturally with realistic weight and movement, showing natural creases and folds exactly as clothing would appear on a person. The garment maintains its authentic colors and patterns while displaying proper fit and dimensional form. This is captured with studio-quality photography equipment using an 85mm portrait lens with even, shadow-free lighting.

## REFERENCE IMAGE AUTHORITY:
**Cleaned Garment Image** - This is your ONLY visual reference and contains the absolute truth for ALL colors, patterns, textures, construction details, material properties, and garment structure. Copy these elements with complete fidelity and precision.

**Base Analysis JSON** - Contains mandatory preservation rules for specific elements, their coordinates, structural requirements, and construction details that must be followed exactly.

**Enrichment Analysis JSON** - Provides technical specifications for color precision, fabric behavior, rendering guidance, and quality expectations that must be integrated into the final result.

Use the cleaned garment image as the authoritative source for all visual information - transform this exact flatlay garment into a three-dimensional ghost mannequin form while preserving every detail perfectly.

## ENHANCED TECHNICAL SPECIFICATIONS:

### COLOR PRECISION INTEGRATION:
Apply the exact color values from the enrichment analysis:
- **Primary Color**: Use the specified hex value as the dominant garment color with perfect fidelity
- **Secondary Color**: If provided, apply to accent elements, patterns, or trim details
- **Color Temperature**: Adjust lighting setup to complement warm/cool/neutral color temperature
- **Saturation Level**: Render colors at the specified saturation intensity (muted/moderate/vibrant)
- **Pattern Direction**: Align patterns according to specified direction (horizontal/vertical/diagonal/random)
- **Pattern Scale**: Size pattern elements according to specified repeat size (micro/small/medium/large)

### FABRIC BEHAVIOR SIMULATION:
Implement realistic fabric physics based on enrichment analysis:
- **Drape Quality**: Simulate fabric behavior (crisp/flowing/structured/fluid/stiff)
  - Crisp: Sharp edges and angular folds
  - Flowing: Smooth, continuous curves
  - Structured: Maintains defined shape with minimal droop
  - Fluid: Liquid-like movement with soft cascading
  - Stiff: Rigid appearance with minimal flexibility
- **Surface Sheen**: Apply appropriate light reflection (matte/subtle_sheen/glossy/metallic)
- **Transparency Level**: Render opacity correctly (opaque/semi_opaque/translucent/sheer)
- **Texture Depth**: Show surface relief (flat/subtle_texture/pronounced_texture/heavily_textured)
- **Wrinkle Tendency**: Add realistic creasing based on fabric type

### ADVANCED LIGHTING IMPLEMENTATION:
Configure studio lighting according to rendering guidance:
- **Lighting Preference**: 
  - Soft_diffused: Even, wraparound lighting with no harsh shadows
  - Directional: Controlled directional lighting with defined light source
  - High_key: Bright, cheerful lighting with minimal shadows
  - Dramatic: Contrasty lighting with defined highlights and shadows
- **Shadow Behavior**: Control shadow intensity and quality
  - Minimal_shadows: Nearly shadowless presentation
  - Soft_shadows: Gentle, diffused shadows
  - Defined_shadows: Clear but not harsh shadow definition
  - Dramatic_shadows: Strong shadow contrast for depth
- **Detail Sharpness**: Adjust focus and clarity (soft/natural/sharp/ultra_sharp)
- **Texture Emphasis**: Control fabric texture visibility (minimize/subtle/enhance/maximize)

### CONSTRUCTION PRECISION RENDERING:
Apply construction details from enrichment analysis:
- **Seam Visibility**: Render seams according to specified prominence (hidden/subtle/visible/decorative)
- **Edge Finishing**: Show edge treatments accurately (raw/serged/bound/rolled/pinked)
- **Stitching Contrast**: Apply or minimize thread visibility based on contrast specification
- **Hardware Finish**: Render metal/plastic elements with specified finish (matte_metal/polished_metal/plastic/fabric_covered)
- **Closure Visibility**: Handle closures appropriately (none/hidden/functional/decorative)

## STEP-BY-STEP ENHANCED CONSTRUCTION PROCESS:

### Step 1: Establish Dimensional Framework
Create a three-dimensional human torso form with natural anatomical proportions - realistic shoulder width spanning approximately 18 inches, natural chest projection forward from the spine, gradual waist taper, and proper arm positioning with slight outward angle from the body. This invisible form should suggest a person of average build standing in a relaxed, professional pose.

### Step 2: Apply Color and Pattern Precision
Map the exact visual information from the cleaned garment image onto the three-dimensional form, using the precise hex color values from the enrichment analysis. Maintain perfect color fidelity and apply the specified color temperature adjustments. Ensure pattern elements follow the specified direction and scale parameters.

### Step 3: Implement Fabric Physics
Apply the fabric behavior specifications from the enrichment analysis:
- Simulate the specified drape quality for realistic fabric movement
- Apply appropriate surface sheen for light interaction
- Maintain proper transparency levels
- Add texture depth according to specifications
- Include natural wrinkles based on fabric tendency

### Step 4: Configure Professional Lighting
Set up studio lighting according to the rendering guidance:
- Apply the specified lighting preference for overall illumination
- Implement shadow behavior according to specifications
- Adjust for color temperature compatibility
- Ensure critical color fidelity priority is maintained

### Step 5: Execute Base Analysis Requirements
Process all elements from the base analysis JSON:
- Locate each element marked with "critical" priority and ensure it appears sharp and clearly readable within specified bounding box coordinates
- For elements marked "preserve: true" in labels_found, maintain perfect legibility without repainting or altering the text
- Follow construction_details rules for structural requirements like maintaining wide sleeves or open fronts
- Implement hollow_regions specifications for neck openings, sleeves, and front openings

### Step 6: Final Quality Integration
Perfect the dimensional presentation using enrichment specifications:
- Apply detail sharpness settings throughout the garment
- Implement texture emphasis preferences
- Ensure market intelligence requirements are reflected in overall quality level
- Validate confidence levels are met through technical precision

## QUALITY VALIDATION WITH ENRICHMENT CRITERIA:
The final image must demonstrate:
- **Color Accuracy**: Perfect fidelity to specified hex values and color properties
- **Fabric Realism**: Accurate simulation of specified fabric behavior and physics
- **Technical Excellence**: Implementation of all rendering guidance specifications
- **Construction Fidelity**: Accurate representation of all construction precision details
- **Professional Quality**: Appropriate to specified market tier and style requirements
- **Lighting Optimization**: Perfect implementation of lighting preferences and shadow behavior
- **Detail Preservation**: All base analysis critical elements maintained at specified sharpness level

## CONFIDENCE INTEGRATION:
Use the confidence scores from enrichment analysis to prioritize rendering quality:
- **High Confidence Areas** (0.8+): Render with maximum precision and detail
- **Medium Confidence Areas** (0.6-0.8): Apply standard quality with careful attention
- **Lower Confidence Areas** (<0.6): Use conservative interpretation, avoid over-rendering

## MARKET INTELLIGENCE APPLICATION:
Apply market context from enrichment analysis:
- **Price Tier**: Adjust overall presentation quality to match market positioning (budget/mid_range/premium/luxury)
- **Style Longevity**: Consider presentation approach for trendy vs classic pieces
- **Target Season**: Ensure styling and presentation appropriate for seasonal context

Generate this professional three-dimensional ghost mannequin product photograph with complete integration of both structural analysis and enrichment specifications, ensuring technical excellence and commercial appropriateness.`;

// Focused High-Value Enrichment Analysis Prompt (Step 2)
export const ENRICHMENT_ANALYSIS_PROMPT = `You are an expert fashion technology AI performing **focused enrichment analysis** for professional garment reproduction. This analysis builds upon completed structural analysis and focuses on **rendering-critical attributes** that directly impact ghost mannequin generation quality.

## ANALYSIS MISSION:

Extract **high-value technical properties** that enable photorealistic garment reproduction with precise color fidelity, accurate fabric behavior, and professional lighting guidance.

## ENRICHMENT FOCUS AREAS:

### 1. COLOR PRECISION (Priority: Critical)

**Objective**: Extract precise color data for accurate reproduction

- **Primary Hex Color**: Dominant garment color as exact 6-digit hex (#RRGGBB)
- **Secondary Hex Color**: Secondary color if present (patterns, accents, trim)
- **Color Temperature**: Warm/cool/neutral classification for lighting setup
- **Saturation Level**: Muted/moderate/vibrant for color intensity matching
- **Pattern Direction**: Horizontal/vertical/diagonal/random for alignment guidance
- **Pattern Repeat Size**: Micro/small/medium/large for texture scaling

**Analysis Method**: Sample color from well-lit, representative areas. Avoid shadows, highlights, or color-cast regions.

### 2. FABRIC BEHAVIOR (Priority: Critical)

**Objective**: Understand how fabric moves and appears for realistic draping

- **Drape Quality**: How fabric falls and flows (crisp/flowing/structured/fluid/stiff)
- **Surface Sheen**: Light reflection properties (matte/subtle_sheen/glossy/metallic)
- **Texture Depth**: Surface relief characteristics (flat/subtle_texture/pronounced_texture/heavily_textured)
- **Wrinkle Tendency**: Fabric's crease behavior (wrinkle_resistant/moderate/wrinkles_easily)
- **Transparency Level**: Opacity characteristics (opaque/semi_opaque/translucent/sheer)

**Analysis Method**: Examine how light interacts with fabric surface, how fabric falls at edges, and visible texture patterns.

### 3. CONSTRUCTION PRECISION (Priority: Important)

**Objective**: Document construction details that affect visual appearance

- **Seam Visibility**: How prominent seams appear (hidden/subtle/visible/decorative)
- **Edge Finishing**: How raw edges are treated (raw/serged/bound/rolled/pinked)
- **Stitching Contrast**: Whether thread color contrasts with fabric (true/false)
- **Hardware Finish**: Metal/plastic finish type (none/matte_metal/polished_metal/plastic/fabric_covered)
- **Closure Visibility**: How closures appear (none/hidden/functional/decorative)

**Analysis Method**: Focus on visible construction elements that impact final rendered appearance.

### 4. RENDERING GUIDANCE (Priority: Important)

**Objective**: Provide technical direction for optimal image generation

- **Lighting Preference**: Best lighting approach (soft_diffused/directional/high_key/dramatic)
- **Shadow Behavior**: How shadows should appear (minimal_shadows/soft_shadows/defined_shadows/dramatic_shadows)
- **Texture Emphasis**: How much to emphasize fabric texture (minimize/subtle/enhance/maximize)
- **Color Fidelity Priority**: Importance of exact color matching (low/medium/high/critical)
- **Detail Sharpness**: Optimal detail rendering (soft/natural/sharp/ultra_sharp)

**Analysis Method**: Consider fabric properties and garment style to recommend optimal rendering parameters.

### 5. MARKET INTELLIGENCE (Priority: Useful)

**Objective**: Provide commercial context for styling decisions

- **Price Tier**: Quality/market positioning (budget/mid_range/premium/luxury)
- **Style Longevity**: Fashion lifecycle (trendy/seasonal/classic/timeless)
- **Care Complexity**: Maintenance requirements (easy_care/moderate_care/delicate/specialty_care)
- **Target Season**: Seasonal appropriateness (spring/summer/fall/winter array)

**Analysis Method**: Assess construction quality, fabric choice, and design sophistication.

## TECHNICAL ANALYSIS GUIDELINES:

### Color Sampling Protocol:

1. **Primary Color**: Sample from largest solid color area under neutral lighting
2. **Secondary Color**: Sample from significant accent or pattern elements
3. **Avoid**: Shadow areas, highlight reflections, color-cast regions
4. **Validate**: Ensure hex values represent true garment colors

### Fabric Assessment Technique:

1. **Drape Observation**: Look at how fabric falls at sleeves, hem, and loose areas
2. **Sheen Analysis**: Examine light reflection patterns across surface
3. **Texture Evaluation**: Assess visible surface relief and weave structure
4. **Transparency Check**: Look for any see-through qualities or opacity variations

### Construction Evaluation:

1. **Seam Inspection**: Check visibility and prominence of construction seams
2. **Edge Analysis**: Examine how fabric edges are finished
3. **Hardware Review**: Catalog all visible metal/plastic elements
4. **Detail Documentation**: Note contrast stitching and decorative elements

## CONFIDENCE SCORING:

Provide confidence levels (0.0-1.0) for each analysis area:

- **Color Confidence**: How certain you are about color accuracy
- **Fabric Confidence**: How well you can assess fabric properties from image
- **Construction Confidence**: How clearly construction details are visible
- **Overall Confidence**: General analysis reliability

## CRITICAL REQUIREMENTS:

- **Evidence-Based**: Only report what you can clearly observe
- **Rendering-Focused**: Prioritize attributes that affect image generation quality
- **Precision**: Provide exact hex values and specific classifications
- **Commercial Awareness**: Consider how quality level affects presentation expectations
- **Technical Accuracy**: Use professional fashion and textile terminology

## OUTPUT FORMAT:

Return analysis as JSON matching the garment_enrichment_focused schema exactly.

Focus on **rendering-critical attributes** that enable professional-quality ghost mannequin generation with accurate color reproduction and realistic fabric behavior.`;

