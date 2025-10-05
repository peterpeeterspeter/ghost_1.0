import { z } from 'zod';
import type { FactsV3, ControlBlock } from '../lib/ghost/consolidation';
export type { FactsV3, ControlBlock };
export type ImageInput = string;
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
export declare const AnalysisJSONSchema: z.ZodObject<{
    type: z.ZodLiteral<"garment_analysis">;
    meta: z.ZodObject<{
        schema_version: z.ZodLiteral<"4.1">;
        session_id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        session_id?: string;
        schema_version?: "4.1";
    }, {
        session_id?: string;
        schema_version?: "4.1";
    }>;
    labels_found: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["brand", "size", "care", "composition", "origin", "price", "security_tag", "rfid", "other"]>;
        location: z.ZodString;
        bbox_norm: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        text: z.ZodOptional<z.ZodString>;
        ocr_conf: z.ZodOptional<z.ZodNumber>;
        readable: z.ZodBoolean;
        preserve: z.ZodBoolean;
        visibility: z.ZodOptional<z.ZodEnum<["fully_visible", "partially_occluded", "edge_visible"]>>;
        print_type: z.ZodOptional<z.ZodEnum<["woven_label", "satin_tag", "screen_print", "heat_transfer", "embroidery", "sticker", "stamp", "other"]>>;
        color_hex: z.ZodOptional<z.ZodString>;
        orientation_degrees: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: "brand" | "size" | "care" | "composition" | "origin" | "price" | "security_tag" | "rfid" | "other";
        location?: string;
        text?: string;
        readable?: boolean;
        preserve?: boolean;
        visibility?: "fully_visible" | "partially_occluded" | "edge_visible";
        color_hex?: string;
        bbox_norm?: number[];
        ocr_conf?: number;
        print_type?: "other" | "woven_label" | "satin_tag" | "screen_print" | "heat_transfer" | "embroidery" | "sticker" | "stamp";
        orientation_degrees?: number;
    }, {
        type?: "brand" | "size" | "care" | "composition" | "origin" | "price" | "security_tag" | "rfid" | "other";
        location?: string;
        text?: string;
        readable?: boolean;
        preserve?: boolean;
        visibility?: "fully_visible" | "partially_occluded" | "edge_visible";
        color_hex?: string;
        bbox_norm?: number[];
        ocr_conf?: number;
        print_type?: "other" | "woven_label" | "satin_tag" | "screen_print" | "heat_transfer" | "embroidery" | "sticker" | "stamp";
        orientation_degrees?: number;
    }>, "many">;
    preserve_details: z.ZodArray<z.ZodObject<{
        element: z.ZodString;
        priority: z.ZodEnum<["critical", "important", "nice_to_have"]>;
        location: z.ZodOptional<z.ZodString>;
        region_bbox_norm: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        notes: z.ZodOptional<z.ZodString>;
        material_notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        location?: string;
        element?: string;
        priority?: "critical" | "important" | "nice_to_have";
        notes?: string;
        region_bbox_norm?: number[];
        material_notes?: string;
    }, {
        location?: string;
        element?: string;
        priority?: "critical" | "important" | "nice_to_have";
        notes?: string;
        region_bbox_norm?: number[];
        material_notes?: string;
    }>, "many">;
    hollow_regions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        region_type: z.ZodEnum<["neckline", "sleeves", "front_opening", "armholes", "other"]>;
        keep_hollow: z.ZodBoolean;
        inner_visible: z.ZodOptional<z.ZodBoolean>;
        inner_description: z.ZodOptional<z.ZodString>;
        edge_sampling_notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        region_type?: "other" | "neckline" | "sleeves" | "front_opening" | "armholes";
        keep_hollow?: boolean;
        inner_visible?: boolean;
        inner_description?: string;
        edge_sampling_notes?: string;
    }, {
        region_type?: "other" | "neckline" | "sleeves" | "front_opening" | "armholes";
        keep_hollow?: boolean;
        inner_visible?: boolean;
        inner_description?: string;
        edge_sampling_notes?: string;
    }>, "many">>;
    construction_details: z.ZodOptional<z.ZodArray<z.ZodObject<{
        feature: z.ZodString;
        silhouette_rule: z.ZodString;
        critical_for_structure: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        feature?: string;
        silhouette_rule?: string;
        critical_for_structure?: boolean;
    }, {
        feature?: string;
        silhouette_rule?: string;
        critical_for_structure?: boolean;
    }>, "many">>;
    image_b_priority: z.ZodOptional<z.ZodObject<{
        is_ground_truth: z.ZodOptional<z.ZodBoolean>;
        edge_fidelity_required: z.ZodOptional<z.ZodBoolean>;
        print_direction_notes: z.ZodOptional<z.ZodString>;
        color_authority: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        is_ground_truth?: boolean;
        edge_fidelity_required?: boolean;
        print_direction_notes?: string;
        color_authority?: boolean;
    }, {
        is_ground_truth?: boolean;
        edge_fidelity_required?: boolean;
        print_direction_notes?: string;
        color_authority?: boolean;
    }>>;
    special_handling: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "garment_analysis";
    labels_found?: {
        type?: "brand" | "size" | "care" | "composition" | "origin" | "price" | "security_tag" | "rfid" | "other";
        location?: string;
        text?: string;
        readable?: boolean;
        preserve?: boolean;
        visibility?: "fully_visible" | "partially_occluded" | "edge_visible";
        color_hex?: string;
        bbox_norm?: number[];
        ocr_conf?: number;
        print_type?: "other" | "woven_label" | "satin_tag" | "screen_print" | "heat_transfer" | "embroidery" | "sticker" | "stamp";
        orientation_degrees?: number;
    }[];
    preserve_details?: {
        location?: string;
        element?: string;
        priority?: "critical" | "important" | "nice_to_have";
        notes?: string;
        region_bbox_norm?: number[];
        material_notes?: string;
    }[];
    hollow_regions?: {
        region_type?: "other" | "neckline" | "sleeves" | "front_opening" | "armholes";
        keep_hollow?: boolean;
        inner_visible?: boolean;
        inner_description?: string;
        edge_sampling_notes?: string;
    }[];
    construction_details?: {
        feature?: string;
        silhouette_rule?: string;
        critical_for_structure?: boolean;
    }[];
    meta?: {
        session_id?: string;
        schema_version?: "4.1";
    };
    image_b_priority?: {
        is_ground_truth?: boolean;
        edge_fidelity_required?: boolean;
        print_direction_notes?: string;
        color_authority?: boolean;
    };
    special_handling?: string;
}, {
    type?: "garment_analysis";
    labels_found?: {
        type?: "brand" | "size" | "care" | "composition" | "origin" | "price" | "security_tag" | "rfid" | "other";
        location?: string;
        text?: string;
        readable?: boolean;
        preserve?: boolean;
        visibility?: "fully_visible" | "partially_occluded" | "edge_visible";
        color_hex?: string;
        bbox_norm?: number[];
        ocr_conf?: number;
        print_type?: "other" | "woven_label" | "satin_tag" | "screen_print" | "heat_transfer" | "embroidery" | "sticker" | "stamp";
        orientation_degrees?: number;
    }[];
    preserve_details?: {
        location?: string;
        element?: string;
        priority?: "critical" | "important" | "nice_to_have";
        notes?: string;
        region_bbox_norm?: number[];
        material_notes?: string;
    }[];
    hollow_regions?: {
        region_type?: "other" | "neckline" | "sleeves" | "front_opening" | "armholes";
        keep_hollow?: boolean;
        inner_visible?: boolean;
        inner_description?: string;
        edge_sampling_notes?: string;
    }[];
    construction_details?: {
        feature?: string;
        silhouette_rule?: string;
        critical_for_structure?: boolean;
    }[];
    meta?: {
        session_id?: string;
        schema_version?: "4.1";
    };
    image_b_priority?: {
        is_ground_truth?: boolean;
        edge_fidelity_required?: boolean;
        print_direction_notes?: string;
        color_authority?: boolean;
    };
    special_handling?: string;
}>;
export declare const AnalysisJSONSchemaObject: {
    type: string;
    properties: {
        type: {
            type: string;
            enum: string[];
        };
        meta: {
            type: string;
            properties: {
                schema_version: {
                    type: string;
                    enum: string[];
                };
                session_id: {
                    type: string;
                };
            };
            required: string[];
        };
        labels_found: {
            type: string;
            description: string;
            items: {
                type: string;
                properties: {
                    type: {
                        type: string;
                        enum: string[];
                    };
                    location: {
                        type: string;
                    };
                    bbox_norm: {
                        type: string;
                        items: {
                            type: string;
                        };
                        minItems: number;
                        maxItems: number;
                    };
                    text: {
                        type: string;
                    };
                    ocr_conf: {
                        type: string;
                        maximum: number;
                    };
                    readable: {
                        type: string;
                    };
                    preserve: {
                        type: string;
                    };
                    visibility: {
                        type: string;
                        enum: string[];
                    };
                };
                required: string[];
            };
        };
        preserve_details: {
            type: string;
            items: {
                type: string;
                properties: {
                    element: {
                        type: string;
                    };
                    priority: {
                        type: string;
                        enum: string[];
                    };
                    location: {
                        type: string;
                    };
                    region_bbox_norm: {
                        type: string;
                        items: {
                            type: string;
                        };
                        minItems: number;
                        maxItems: number;
                    };
                    notes: {
                        type: string;
                    };
                };
                required: string[];
            };
        };
        hollow_regions: {
            type: string;
            items: {
                type: string;
                properties: {
                    region_type: {
                        type: string;
                        enum: string[];
                    };
                    keep_hollow: {
                        type: string;
                    };
                    inner_visible: {
                        type: string;
                    };
                    inner_description: {
                        type: string;
                    };
                    edge_sampling_notes: {
                        type: string;
                    };
                };
                required: string[];
            };
        };
        construction_details: {
            type: string;
            items: {
                type: string;
                properties: {
                    feature: {
                        type: string;
                    };
                    silhouette_rule: {
                        type: string;
                    };
                    critical_for_structure: {
                        type: string;
                    };
                };
                required: string[];
            };
        };
        image_b_priority: {
            type: string;
            properties: {
                is_ground_truth: {
                    type: string;
                };
                edge_fidelity_required: {
                    type: string;
                };
                print_direction_notes: {
                    type: string;
                };
                color_authority: {
                    type: string;
                };
            };
        };
        special_handling: {
            type: string;
        };
    };
    required: string[];
};
export type AnalysisJSON = z.infer<typeof AnalysisJSONSchema>;
export declare const EnrichmentJSONSchema: z.ZodObject<{
    type: z.ZodLiteral<"garment_enrichment_focused">;
    meta: z.ZodObject<{
        schema_version: z.ZodLiteral<"4.3">;
        session_id: z.ZodString;
        base_analysis_ref: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        session_id?: string;
        schema_version?: "4.3";
        base_analysis_ref?: string;
    }, {
        session_id?: string;
        schema_version?: "4.3";
        base_analysis_ref?: string;
    }>;
    color_precision: z.ZodObject<{
        primary_hex: z.ZodString;
        secondary_hex: z.ZodOptional<z.ZodString>;
        color_temperature: z.ZodEnum<["warm", "cool", "neutral"]>;
        saturation_level: z.ZodEnum<["muted", "moderate", "vibrant"]>;
        pattern_direction: z.ZodOptional<z.ZodEnum<["horizontal", "vertical", "diagonal", "random"]>>;
        pattern_repeat_size: z.ZodOptional<z.ZodEnum<["micro", "small", "medium", "large"]>>;
    }, "strip", z.ZodTypeAny, {
        primary_hex?: string;
        secondary_hex?: string;
        color_temperature?: "warm" | "cool" | "neutral";
        saturation_level?: "muted" | "moderate" | "vibrant";
        pattern_direction?: "horizontal" | "vertical" | "diagonal" | "random";
        pattern_repeat_size?: "micro" | "small" | "medium" | "large";
    }, {
        primary_hex?: string;
        secondary_hex?: string;
        color_temperature?: "warm" | "cool" | "neutral";
        saturation_level?: "muted" | "moderate" | "vibrant";
        pattern_direction?: "horizontal" | "vertical" | "diagonal" | "random";
        pattern_repeat_size?: "micro" | "small" | "medium" | "large";
    }>;
    fabric_behavior: z.ZodObject<{
        drape_quality: z.ZodEnum<["crisp", "flowing", "structured", "fluid", "stiff"]>;
        surface_sheen: z.ZodEnum<["matte", "subtle_sheen", "glossy", "metallic"]>;
        texture_depth: z.ZodOptional<z.ZodEnum<["flat", "subtle_texture", "pronounced_texture", "heavily_textured"]>>;
        wrinkle_tendency: z.ZodOptional<z.ZodEnum<["wrinkle_resistant", "moderate", "wrinkles_easily"]>>;
        transparency_level: z.ZodEnum<["opaque", "semi_opaque", "translucent", "sheer"]>;
    }, "strip", z.ZodTypeAny, {
        surface_sheen?: "matte" | "subtle_sheen" | "glossy" | "metallic";
        drape_quality?: "crisp" | "flowing" | "structured" | "fluid" | "stiff";
        texture_depth?: "flat" | "subtle_texture" | "pronounced_texture" | "heavily_textured";
        transparency_level?: "opaque" | "semi_opaque" | "translucent" | "sheer";
        wrinkle_tendency?: "moderate" | "wrinkle_resistant" | "wrinkles_easily";
    }, {
        surface_sheen?: "matte" | "subtle_sheen" | "glossy" | "metallic";
        drape_quality?: "crisp" | "flowing" | "structured" | "fluid" | "stiff";
        texture_depth?: "flat" | "subtle_texture" | "pronounced_texture" | "heavily_textured";
        transparency_level?: "opaque" | "semi_opaque" | "translucent" | "sheer";
        wrinkle_tendency?: "moderate" | "wrinkle_resistant" | "wrinkles_easily";
    }>;
    construction_precision: z.ZodObject<{
        seam_visibility: z.ZodEnum<["hidden", "subtle", "visible", "decorative"]>;
        edge_finishing: z.ZodEnum<["raw", "serged", "bound", "rolled", "pinked"]>;
        stitching_contrast: z.ZodBoolean;
        hardware_finish: z.ZodOptional<z.ZodEnum<["none", "matte_metal", "polished_metal", "plastic", "fabric_covered"]>>;
        closure_visibility: z.ZodOptional<z.ZodEnum<["none", "hidden", "functional", "decorative"]>>;
    }, "strip", z.ZodTypeAny, {
        seam_visibility?: "hidden" | "subtle" | "visible" | "decorative";
        edge_finishing?: "raw" | "serged" | "bound" | "rolled" | "pinked";
        stitching_contrast?: boolean;
        hardware_finish?: "none" | "matte_metal" | "polished_metal" | "plastic" | "fabric_covered";
        closure_visibility?: "hidden" | "decorative" | "none" | "functional";
    }, {
        seam_visibility?: "hidden" | "subtle" | "visible" | "decorative";
        edge_finishing?: "raw" | "serged" | "bound" | "rolled" | "pinked";
        stitching_contrast?: boolean;
        hardware_finish?: "none" | "matte_metal" | "polished_metal" | "plastic" | "fabric_covered";
        closure_visibility?: "hidden" | "decorative" | "none" | "functional";
    }>;
    rendering_guidance: z.ZodObject<{
        lighting_preference: z.ZodEnum<["soft_diffused", "directional", "high_key", "dramatic"]>;
        shadow_behavior: z.ZodEnum<["minimal_shadows", "soft_shadows", "defined_shadows", "dramatic_shadows"]>;
        texture_emphasis: z.ZodOptional<z.ZodEnum<["minimize", "subtle", "enhance", "maximize"]>>;
        color_fidelity_priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
        detail_sharpness: z.ZodOptional<z.ZodEnum<["soft", "natural", "sharp", "ultra_sharp"]>>;
    }, "strip", z.ZodTypeAny, {
        lighting_preference?: "soft_diffused" | "directional" | "high_key" | "dramatic";
        shadow_behavior?: "minimal_shadows" | "soft_shadows" | "defined_shadows" | "dramatic_shadows";
        texture_emphasis?: "subtle" | "enhance" | "maximize" | "minimize";
        color_fidelity_priority?: "medium" | "high" | "critical" | "low";
        detail_sharpness?: "natural" | "sharp" | "ultra_sharp" | "soft";
    }, {
        lighting_preference?: "soft_diffused" | "directional" | "high_key" | "dramatic";
        shadow_behavior?: "minimal_shadows" | "soft_shadows" | "defined_shadows" | "dramatic_shadows";
        texture_emphasis?: "subtle" | "enhance" | "maximize" | "minimize";
        color_fidelity_priority?: "medium" | "high" | "critical" | "low";
        detail_sharpness?: "natural" | "sharp" | "ultra_sharp" | "soft";
    }>;
    market_intelligence: z.ZodOptional<z.ZodObject<{
        price_tier: z.ZodEnum<["budget", "mid_range", "premium", "luxury"]>;
        style_longevity: z.ZodEnum<["trendy", "seasonal", "classic", "timeless"]>;
        care_complexity: z.ZodOptional<z.ZodEnum<["easy_care", "moderate_care", "delicate", "specialty_care"]>>;
        target_season: z.ZodOptional<z.ZodArray<z.ZodEnum<["spring", "summer", "fall", "winter"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        price_tier?: "budget" | "mid_range" | "premium" | "luxury";
        style_longevity?: "trendy" | "seasonal" | "classic" | "timeless";
        care_complexity?: "easy_care" | "moderate_care" | "delicate" | "specialty_care";
        target_season?: ("spring" | "summer" | "fall" | "winter")[];
    }, {
        price_tier?: "budget" | "mid_range" | "premium" | "luxury";
        style_longevity?: "trendy" | "seasonal" | "classic" | "timeless";
        care_complexity?: "easy_care" | "moderate_care" | "delicate" | "specialty_care";
        target_season?: ("spring" | "summer" | "fall" | "winter")[];
    }>>;
    confidence_breakdown: z.ZodObject<{
        color_confidence: z.ZodNumber;
        fabric_confidence: z.ZodNumber;
        construction_confidence: z.ZodOptional<z.ZodNumber>;
        overall_confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        color_confidence?: number;
        fabric_confidence?: number;
        construction_confidence?: number;
        overall_confidence?: number;
    }, {
        color_confidence?: number;
        fabric_confidence?: number;
        construction_confidence?: number;
        overall_confidence?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    type?: "garment_enrichment_focused";
    color_precision?: {
        primary_hex?: string;
        secondary_hex?: string;
        color_temperature?: "warm" | "cool" | "neutral";
        saturation_level?: "muted" | "moderate" | "vibrant";
        pattern_direction?: "horizontal" | "vertical" | "diagonal" | "random";
        pattern_repeat_size?: "micro" | "small" | "medium" | "large";
    };
    fabric_behavior?: {
        surface_sheen?: "matte" | "subtle_sheen" | "glossy" | "metallic";
        drape_quality?: "crisp" | "flowing" | "structured" | "fluid" | "stiff";
        texture_depth?: "flat" | "subtle_texture" | "pronounced_texture" | "heavily_textured";
        transparency_level?: "opaque" | "semi_opaque" | "translucent" | "sheer";
        wrinkle_tendency?: "moderate" | "wrinkle_resistant" | "wrinkles_easily";
    };
    construction_precision?: {
        seam_visibility?: "hidden" | "subtle" | "visible" | "decorative";
        edge_finishing?: "raw" | "serged" | "bound" | "rolled" | "pinked";
        stitching_contrast?: boolean;
        hardware_finish?: "none" | "matte_metal" | "polished_metal" | "plastic" | "fabric_covered";
        closure_visibility?: "hidden" | "decorative" | "none" | "functional";
    };
    meta?: {
        session_id?: string;
        schema_version?: "4.3";
        base_analysis_ref?: string;
    };
    rendering_guidance?: {
        lighting_preference?: "soft_diffused" | "directional" | "high_key" | "dramatic";
        shadow_behavior?: "minimal_shadows" | "soft_shadows" | "defined_shadows" | "dramatic_shadows";
        texture_emphasis?: "subtle" | "enhance" | "maximize" | "minimize";
        color_fidelity_priority?: "medium" | "high" | "critical" | "low";
        detail_sharpness?: "natural" | "sharp" | "ultra_sharp" | "soft";
    };
    market_intelligence?: {
        price_tier?: "budget" | "mid_range" | "premium" | "luxury";
        style_longevity?: "trendy" | "seasonal" | "classic" | "timeless";
        care_complexity?: "easy_care" | "moderate_care" | "delicate" | "specialty_care";
        target_season?: ("spring" | "summer" | "fall" | "winter")[];
    };
    confidence_breakdown?: {
        color_confidence?: number;
        fabric_confidence?: number;
        construction_confidence?: number;
        overall_confidence?: number;
    };
}, {
    type?: "garment_enrichment_focused";
    color_precision?: {
        primary_hex?: string;
        secondary_hex?: string;
        color_temperature?: "warm" | "cool" | "neutral";
        saturation_level?: "muted" | "moderate" | "vibrant";
        pattern_direction?: "horizontal" | "vertical" | "diagonal" | "random";
        pattern_repeat_size?: "micro" | "small" | "medium" | "large";
    };
    fabric_behavior?: {
        surface_sheen?: "matte" | "subtle_sheen" | "glossy" | "metallic";
        drape_quality?: "crisp" | "flowing" | "structured" | "fluid" | "stiff";
        texture_depth?: "flat" | "subtle_texture" | "pronounced_texture" | "heavily_textured";
        transparency_level?: "opaque" | "semi_opaque" | "translucent" | "sheer";
        wrinkle_tendency?: "moderate" | "wrinkle_resistant" | "wrinkles_easily";
    };
    construction_precision?: {
        seam_visibility?: "hidden" | "subtle" | "visible" | "decorative";
        edge_finishing?: "raw" | "serged" | "bound" | "rolled" | "pinked";
        stitching_contrast?: boolean;
        hardware_finish?: "none" | "matte_metal" | "polished_metal" | "plastic" | "fabric_covered";
        closure_visibility?: "hidden" | "decorative" | "none" | "functional";
    };
    meta?: {
        session_id?: string;
        schema_version?: "4.3";
        base_analysis_ref?: string;
    };
    rendering_guidance?: {
        lighting_preference?: "soft_diffused" | "directional" | "high_key" | "dramatic";
        shadow_behavior?: "minimal_shadows" | "soft_shadows" | "defined_shadows" | "dramatic_shadows";
        texture_emphasis?: "subtle" | "enhance" | "maximize" | "minimize";
        color_fidelity_priority?: "medium" | "high" | "critical" | "low";
        detail_sharpness?: "natural" | "sharp" | "ultra_sharp" | "soft";
    };
    market_intelligence?: {
        price_tier?: "budget" | "mid_range" | "premium" | "luxury";
        style_longevity?: "trendy" | "seasonal" | "classic" | "timeless";
        care_complexity?: "easy_care" | "moderate_care" | "delicate" | "specialty_care";
        target_season?: ("spring" | "summer" | "fall" | "winter")[];
    };
    confidence_breakdown?: {
        color_confidence?: number;
        fabric_confidence?: number;
        construction_confidence?: number;
        overall_confidence?: number;
    };
}>;
export declare const EnrichmentJSONSchemaObject: {
    type: string;
    properties: {
        type: {
            type: string;
            enum: string[];
        };
        meta: {
            type: string;
            properties: {
                schema_version: {
                    type: string;
                    enum: string[];
                };
                session_id: {
                    type: string;
                };
                base_analysis_ref: {
                    type: string;
                };
            };
            required: string[];
        };
        color_precision: {
            type: string;
            properties: {
                primary_hex: {
                    type: string;
                    pattern: string;
                };
                secondary_hex: {
                    type: string;
                    pattern: string;
                };
                color_temperature: {
                    type: string;
                    enum: string[];
                };
                saturation_level: {
                    type: string;
                    enum: string[];
                };
                pattern_direction: {
                    type: string;
                    enum: string[];
                };
                pattern_repeat_size: {
                    type: string;
                    enum: string[];
                };
            };
            required: string[];
        };
        fabric_behavior: {
            type: string;
            properties: {
                drape_quality: {
                    type: string;
                    enum: string[];
                };
                surface_sheen: {
                    type: string;
                    enum: string[];
                };
                texture_depth: {
                    type: string;
                    enum: string[];
                };
                wrinkle_tendency: {
                    type: string;
                    enum: string[];
                };
                transparency_level: {
                    type: string;
                    enum: string[];
                };
            };
            required: string[];
        };
        construction_precision: {
            type: string;
            properties: {
                seam_visibility: {
                    type: string;
                    enum: string[];
                };
                edge_finishing: {
                    type: string;
                    enum: string[];
                };
                stitching_contrast: {
                    type: string;
                };
                hardware_finish: {
                    type: string;
                    enum: string[];
                };
                closure_visibility: {
                    type: string;
                    enum: string[];
                };
            };
            required: string[];
        };
        rendering_guidance: {
            type: string;
            properties: {
                lighting_preference: {
                    type: string;
                    enum: string[];
                };
                shadow_behavior: {
                    type: string;
                    enum: string[];
                };
                texture_emphasis: {
                    type: string;
                    enum: string[];
                };
                color_fidelity_priority: {
                    type: string;
                    enum: string[];
                };
                detail_sharpness: {
                    type: string;
                    enum: string[];
                };
            };
            required: string[];
        };
        market_intelligence: {
            type: string;
            properties: {
                price_tier: {
                    type: string;
                    enum: string[];
                };
                style_longevity: {
                    type: string;
                    enum: string[];
                };
                care_complexity: {
                    type: string;
                    enum: string[];
                };
                target_season: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                };
            };
            required: string[];
        };
        confidence_breakdown: {
            type: string;
            properties: {
                color_confidence: {
                    type: string;
                    maximum: number;
                };
                fabric_confidence: {
                    type: string;
                    maximum: number;
                };
                construction_confidence: {
                    type: string;
                    maximum: number;
                };
                overall_confidence: {
                    type: string;
                    maximum: number;
                };
            };
            required: string[];
        };
    };
    required: string[];
};
export type EnrichmentJSON = z.infer<typeof EnrichmentJSONSchema>;
export interface BackgroundRemovalResult {
    cleanedImageUrl: string;
    processingTime: number;
    filesApiUri?: string;
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
export interface GeminiAnalysisRequest {
    imageData: string;
    prompt: string;
}
export interface GeminiRenderRequest {
    prompt: string;
    images: Array<{
        data: string;
        mimeType: string;
    }>;
    analysisJson: AnalysisJSON;
}
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
export declare class GhostPipelineError extends Error {
    code: string;
    stage: 'background_removal' | 'analysis' | 'enrichment' | 'consolidation' | 'rendering' | 'qa';
    cause?: Error;
    constructor(message: string, code: string, stage: 'background_removal' | 'analysis' | 'enrichment' | 'consolidation' | 'rendering' | 'qa', cause?: Error);
}
export type ProcessingStage = 'background_removal' | 'analysis' | 'enrichment' | 'consolidation' | 'rendering' | 'qa';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export declare const SUPPORTED_IMAGE_FORMATS: readonly ["image/jpeg", "image/png", "image/webp"];
export declare const MAX_FILE_SIZE: number;
export declare const DEFAULT_OUTPUT_SIZE: "2048x2048";
export declare const DEFAULT_BACKGROUND_COLOR: "white";
export declare const ANALYSIS_PROMPT = "You are an expert garment analysis AI that performs detailed clothing analysis from images. Analyze the provided garment image and return a structured JSON response following the exact schema provided.\n\nANALYSIS REQUIREMENTS:\n\nLABEL DETECTION (Priority 1):\n- Comprehensive Search: Examine ALL areas for labels - neck tags, care labels, brand labels, size tags, composition labels, price tags, security tags\n- Spatial Precision: Provide normalized bounding boxes [x0,y0,x1,y1] for each label location\n- OCR Extraction: Extract ALL readable text verbatim - don't paraphrase or interpret\n- Label Classification: Identify label type (brand, size, care, composition, origin, price, security_tag, rfid, other)\n- Print Type Assessment: Determine how label was applied (woven_label, satin_tag, screen_print, heat_transfer, embroidery, sticker, stamp)\n- Readability Assessment: Mark if text is legible enough to preserve in final rendering\n- Preservation Flag: Mark critical labels that must be protected during processing\n\nDETAIL PRESERVATION (Priority 2):\n- Fine Details: Identify logos, trims, stitching patterns, buttons, hardware, prints, embroidery\n- Priority Classification: Assign critical/important/nice_to_have based on visual prominence and brand significance\n- Spatial Location: Provide bounding boxes for precise detail regions\n- Material Notes: Describe special finishes (metallic, embossed, raised, foil, etc.)\n- Construction Elements: Note how details affect garment structure or appearance\n\nCONSTRUCTION ANALYSIS (Priority 3):\n- Cut & Sew Features: Identify construction details that affect drape and silhouette\n- Structural Elements: Note shoulder taping, hems, seam types, sleeve construction\n- Drape Impact: Describe how construction features should appear in final rendering\n\nSEARCH STRATEGY:\n- Neck Area: Inside and outside neckline, collar areas\n- Chest Area: Front and back chest regions\n- Sleeve Areas: Cuffs, sleeve seams, armpit regions\n- Hem Areas: Bottom edges, side seams\n- Hidden Areas: Check for folded labels or tags\n- Hardware: Buttons, zippers, snaps, grommets\n- Seam Details: Contrast stitching, binding, piping\n\nTECHNICAL PRECISION:\n- Bounding Boxes: Use normalized coordinates (0.0 to 1.0) relative to image dimensions\n- OCR Confidence: Provide confidence scores for text extraction (0.0 to 1.0)\n- Color Sampling: Extract average hex colors for label backgrounds\n- Orientation: Note label rotation in degrees from horizontal\n- High-Res Crops: Generate data URIs for critical label patches when possible\n\nCRITICAL INSTRUCTIONS:\n- Be Exhaustive: Don't miss any labels or details - check everywhere\n- Be Precise: Provide exact spatial coordinates and accurate text extraction\n- Be Selective: Only mark details as \"critical\" if they're truly essential for brand/product identity\n- Be Accurate: Only report what you can clearly observe - don't guess or interpolate\n- Focus on Preservation: The goal is to identify what must be preserved during ghost mannequin processing\n\nOUTPUT REQUIREMENTS:\nReturn analysis as JSON matching the provided schema exactly. Include:\n- All detected labels with spatial data and OCR results\n- All significant details with preservation priorities\n- Construction features that affect garment appearance\n- Global handling notes for special processing requirements\n\nAnalyze this garment image with meticulous attention to labels and preservable details.";
export declare const GHOST_MANNEQUIN_PROMPT = "Create a professional three-dimensional ghost mannequin photograph for e-commerce product display, transforming flat garment images into a dimensional presentation that shows how the clothing would appear when worn by an invisible person.\n\n## DETAILED SCENE NARRATIVE:\nImagine a high-end photography studio with perfect white cyclorama background and professional lighting equipment. In the center of this space, a garment floats in three-dimensional space, filled with the volume and shape of an invisible human body. The fabric drapes naturally with realistic weight and movement, showing natural creases and folds exactly as clothing would appear on a person. The garment maintains its authentic colors and patterns while displaying proper fit and dimensional form. This is captured with studio-quality photography equipment using an 85mm portrait lens with even, shadow-free lighting.\n\n## MULTI-SOURCE DATA AUTHORITY:\n**Image B (Detail Source)** - Primary visual reference containing the absolute truth for all colors, patterns, textures, construction details, and material properties. Copy these elements with complete fidelity.\n\n**Base Analysis JSON** - Contains mandatory preservation rules for specific elements, their coordinates, structural requirements, and construction details that must be followed exactly.\n\n**Enrichment Analysis JSON** - Provides technical specifications for color precision, fabric behavior, rendering guidance, and quality expectations that must be integrated into the final result.\n\n**Image A (Model Reference)** - Use only for understanding basic proportions and spatial relationships; all visual details should come from Image B.\n\n## ENHANCED TECHNICAL SPECIFICATIONS:\n\n### COLOR PRECISION INTEGRATION:\nApply the exact color values from the enrichment analysis:\n- **Primary Color**: Use the specified hex value as the dominant garment color with perfect fidelity\n- **Secondary Color**: If provided, apply to accent elements, patterns, or trim details\n- **Color Temperature**: Adjust lighting setup to complement warm/cool/neutral color temperature\n- **Saturation Level**: Render colors at the specified saturation intensity (muted/moderate/vibrant)\n- **Pattern Direction**: Align patterns according to specified direction (horizontal/vertical/diagonal/random)\n- **Pattern Scale**: Size pattern elements according to specified repeat size (micro/small/medium/large)\n\n### FABRIC BEHAVIOR SIMULATION:\nImplement realistic fabric physics based on enrichment analysis:\n- **Drape Quality**: Simulate fabric behavior (crisp/flowing/structured/fluid/stiff)\n  - Crisp: Sharp edges and angular folds\n  - Flowing: Smooth, continuous curves\n  - Structured: Maintains defined shape with minimal droop\n  - Fluid: Liquid-like movement with soft cascading\n  - Stiff: Rigid appearance with minimal flexibility\n- **Surface Sheen**: Apply appropriate light reflection (matte/subtle_sheen/glossy/metallic)\n- **Transparency Level**: Render opacity correctly (opaque/semi_opaque/translucent/sheer)\n- **Texture Depth**: Show surface relief (flat/subtle_texture/pronounced_texture/heavily_textured)\n- **Wrinkle Tendency**: Add realistic creasing based on fabric type\n\n### ADVANCED LIGHTING IMPLEMENTATION:\nConfigure studio lighting according to rendering guidance:\n- **Lighting Preference**: \n  - Soft_diffused: Even, wraparound lighting with no harsh shadows\n  - Directional: Controlled directional lighting with defined light source\n  - High_key: Bright, cheerful lighting with minimal shadows\n  - Dramatic: Contrasty lighting with defined highlights and shadows\n- **Shadow Behavior**: Control shadow intensity and quality\n  - Minimal_shadows: Nearly shadowless presentation\n  - Soft_shadows: Gentle, diffused shadows\n  - Defined_shadows: Clear but not harsh shadow definition\n  - Dramatic_shadows: Strong shadow contrast for depth\n- **Detail Sharpness**: Adjust focus and clarity (soft/natural/sharp/ultra_sharp)\n- **Texture Emphasis**: Control fabric texture visibility (minimize/subtle/enhance/maximize)\n\n### CONSTRUCTION PRECISION RENDERING:\nApply construction details from enrichment analysis:\n- **Seam Visibility**: Render seams according to specified prominence (hidden/subtle/visible/decorative)\n- **Edge Finishing**: Show edge treatments accurately (raw/serged/bound/rolled/pinked)\n- **Stitching Contrast**: Apply or minimize thread visibility based on contrast specification\n- **Hardware Finish**: Render metal/plastic elements with specified finish (matte_metal/polished_metal/plastic/fabric_covered)\n- **Closure Visibility**: Handle closures appropriately (none/hidden/functional/decorative)\n\n## STEP-BY-STEP ENHANCED CONSTRUCTION PROCESS:\n\n### Step 1: Establish Dimensional Framework\nCreate a three-dimensional human torso form with natural anatomical proportions - realistic shoulder width spanning approximately 18 inches, natural chest projection forward from the spine, gradual waist taper, and proper arm positioning with slight outward angle from the body. This invisible form should suggest a person of average build standing in a relaxed, professional pose.\n\n### Step 2: Apply Color and Pattern Precision\nMap the exact visual information from Image B onto the three-dimensional form, using the precise hex color values from the enrichment analysis. Maintain perfect color fidelity and apply the specified color temperature adjustments. Ensure pattern elements follow the specified direction and scale parameters.\n\n### Step 3: Implement Fabric Physics\nApply the fabric behavior specifications from the enrichment analysis:\n- Simulate the specified drape quality for realistic fabric movement\n- Apply appropriate surface sheen for light interaction\n- Maintain proper transparency levels\n- Add texture depth according to specifications\n- Include natural wrinkles based on fabric tendency\n\n### Step 4: Configure Professional Lighting\nSet up studio lighting according to the rendering guidance:\n- Apply the specified lighting preference for overall illumination\n- Implement shadow behavior according to specifications\n- Adjust for color temperature compatibility\n- Ensure critical color fidelity priority is maintained\n\n### Step 5: Execute Base Analysis Requirements\nProcess all elements from the base analysis JSON:\n- Locate each element marked with \"critical\" priority and ensure it appears sharp and clearly readable within specified bounding box coordinates\n- For elements marked \"preserve: true\" in labels_found, maintain perfect legibility without repainting or altering the text\n- Follow construction_details rules for structural requirements like maintaining wide sleeves or open fronts\n- Implement hollow_regions specifications for neck openings, sleeves, and front openings\n\n### Step 6: Final Quality Integration\nPerfect the dimensional presentation using enrichment specifications:\n- Apply detail sharpness settings throughout the garment\n- Implement texture emphasis preferences\n- Ensure market intelligence requirements are reflected in overall quality level\n- Validate confidence levels are met through technical precision\n\n## QUALITY VALIDATION WITH ENRICHMENT CRITERIA:\nThe final image must demonstrate:\n- **Color Accuracy**: Perfect fidelity to specified hex values and color properties\n- **Fabric Realism**: Accurate simulation of specified fabric behavior and physics\n- **Technical Excellence**: Implementation of all rendering guidance specifications\n- **Construction Fidelity**: Accurate representation of all construction precision details\n- **Professional Quality**: Appropriate to specified market tier and style requirements\n- **Lighting Optimization**: Perfect implementation of lighting preferences and shadow behavior\n- **Detail Preservation**: All base analysis critical elements maintained at specified sharpness level\n\n## CONFIDENCE INTEGRATION:\nUse the confidence scores from enrichment analysis to prioritize rendering quality:\n- **High Confidence Areas** (0.8+): Render with maximum precision and detail\n- **Medium Confidence Areas** (0.6-0.8): Apply standard quality with careful attention\n- **Lower Confidence Areas** (<0.6): Use conservative interpretation, avoid over-rendering\n\n## MARKET INTELLIGENCE APPLICATION:\nApply market context from enrichment analysis:\n- **Price Tier**: Adjust overall presentation quality to match market positioning (budget/mid_range/premium/luxury)\n- **Style Longevity**: Consider presentation approach for trendy vs classic pieces\n- **Target Season**: Ensure styling and presentation appropriate for seasonal context\n\nGenerate this professional three-dimensional ghost mannequin product photograph with complete integration of both structural analysis and enrichment specifications, ensuring technical excellence and commercial appropriateness.";
export declare const ENRICHMENT_ANALYSIS_PROMPT = "You are an expert fashion technology AI performing **focused enrichment analysis** for professional garment reproduction. This analysis builds upon completed structural analysis and focuses on **rendering-critical attributes** that directly impact ghost mannequin generation quality.\n\n## ANALYSIS MISSION:\n\nExtract **high-value technical properties** that enable photorealistic garment reproduction with precise color fidelity, accurate fabric behavior, and professional lighting guidance.\n\n## ENRICHMENT FOCUS AREAS:\n\n### 1. COLOR PRECISION (Priority: Critical)\n\n**Objective**: Extract precise color data for accurate reproduction\n\n- **Primary Hex Color**: Dominant garment color as exact 6-digit hex (#RRGGBB)\n- **Secondary Hex Color**: Secondary color if present (patterns, accents, trim)\n- **Color Temperature**: Warm/cool/neutral classification for lighting setup\n- **Saturation Level**: Muted/moderate/vibrant for color intensity matching\n- **Pattern Direction**: Horizontal/vertical/diagonal/random for alignment guidance\n- **Pattern Repeat Size**: Micro/small/medium/large for texture scaling\n\n**Analysis Method**: Sample color from well-lit, representative areas. Avoid shadows, highlights, or color-cast regions.\n\n### 2. FABRIC BEHAVIOR (Priority: Critical)\n\n**Objective**: Understand how fabric moves and appears for realistic draping\n\n- **Drape Quality**: How fabric falls and flows (crisp/flowing/structured/fluid/stiff)\n- **Surface Sheen**: Light reflection properties (matte/subtle_sheen/glossy/metallic)\n- **Texture Depth**: Surface relief characteristics (flat/subtle_texture/pronounced_texture/heavily_textured)\n- **Wrinkle Tendency**: Fabric's crease behavior (wrinkle_resistant/moderate/wrinkles_easily)\n- **Transparency Level**: Opacity characteristics (opaque/semi_opaque/translucent/sheer)\n\n**Analysis Method**: Examine how light interacts with fabric surface, how fabric falls at edges, and visible texture patterns.\n\n### 3. CONSTRUCTION PRECISION (Priority: Important)\n\n**Objective**: Document construction details that affect visual appearance\n\n- **Seam Visibility**: How prominent seams appear (hidden/subtle/visible/decorative)\n- **Edge Finishing**: How raw edges are treated (raw/serged/bound/rolled/pinked)\n- **Stitching Contrast**: Whether thread color contrasts with fabric (true/false)\n- **Hardware Finish**: Metal/plastic finish type (none/matte_metal/polished_metal/plastic/fabric_covered)\n- **Closure Visibility**: How closures appear (none/hidden/functional/decorative)\n\n**Analysis Method**: Focus on visible construction elements that impact final rendered appearance.\n\n### 4. RENDERING GUIDANCE (Priority: Important)\n\n**Objective**: Provide technical direction for optimal image generation\n\n- **Lighting Preference**: Best lighting approach (soft_diffused/directional/high_key/dramatic)\n- **Shadow Behavior**: How shadows should appear (minimal_shadows/soft_shadows/defined_shadows/dramatic_shadows)\n- **Texture Emphasis**: How much to emphasize fabric texture (minimize/subtle/enhance/maximize)\n- **Color Fidelity Priority**: Importance of exact color matching (low/medium/high/critical)\n- **Detail Sharpness**: Optimal detail rendering (soft/natural/sharp/ultra_sharp)\n\n**Analysis Method**: Consider fabric properties and garment style to recommend optimal rendering parameters.\n\n### 5. MARKET INTELLIGENCE (Priority: Useful)\n\n**Objective**: Provide commercial context for styling decisions\n\n- **Price Tier**: Quality/market positioning (budget/mid_range/premium/luxury)\n- **Style Longevity**: Fashion lifecycle (trendy/seasonal/classic/timeless)\n- **Care Complexity**: Maintenance requirements (easy_care/moderate_care/delicate/specialty_care)\n- **Target Season**: Seasonal appropriateness (spring/summer/fall/winter array)\n\n**Analysis Method**: Assess construction quality, fabric choice, and design sophistication.\n\n## TECHNICAL ANALYSIS GUIDELINES:\n\n### Color Sampling Protocol:\n\n1. **Primary Color**: Sample from largest solid color area under neutral lighting\n2. **Secondary Color**: Sample from significant accent or pattern elements\n3. **Avoid**: Shadow areas, highlight reflections, color-cast regions\n4. **Validate**: Ensure hex values represent true garment colors\n\n### Fabric Assessment Technique:\n\n1. **Drape Observation**: Look at how fabric falls at sleeves, hem, and loose areas\n2. **Sheen Analysis**: Examine light reflection patterns across surface\n3. **Texture Evaluation**: Assess visible surface relief and weave structure\n4. **Transparency Check**: Look for any see-through qualities or opacity variations\n\n### Construction Evaluation:\n\n1. **Seam Inspection**: Check visibility and prominence of construction seams\n2. **Edge Analysis**: Examine how fabric edges are finished\n3. **Hardware Review**: Catalog all visible metal/plastic elements\n4. **Detail Documentation**: Note contrast stitching and decorative elements\n\n## CONFIDENCE SCORING:\n\nProvide confidence levels (0.0-1.0) for each analysis area:\n\n- **Color Confidence**: How certain you are about color accuracy\n- **Fabric Confidence**: How well you can assess fabric properties from image\n- **Construction Confidence**: How clearly construction details are visible\n- **Overall Confidence**: General analysis reliability\n\n## CRITICAL REQUIREMENTS:\n\n- **Evidence-Based**: Only report what you can clearly observe\n- **Rendering-Focused**: Prioritize attributes that affect image generation quality\n- **Precision**: Provide exact hex values and specific classifications\n- **Commercial Awareness**: Consider how quality level affects presentation expectations\n- **Technical Accuracy**: Use professional fashion and textile terminology\n\n## OUTPUT FORMAT:\n\nReturn analysis as JSON matching the garment_enrichment_focused schema exactly.\n\nFocus on **rendering-critical attributes** that enable professional-quality ghost mannequin generation with accurate color reproduction and realistic fabric behavior.";
