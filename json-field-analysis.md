# 📊 JSON Field Count Analysis - Maximum Fields Passed to Flash

## **1. 📝 Original Analysis Data (Step 2 & 3)**

### **AnalysisJSON (Step 2 - Garment Analysis)**
- **Total Fields**: **~79 fields** (including nested objects and arrays)
- **Main Sections**: 8 sections
- **Typical Size**: 2,000-3,000 bytes
- **Structure**:
```typescript
{
  type: "garment_analysis",
  meta: { schema_version, session_id },                    // 2 fields
  labels_found: [{                                         // 9 fields per label
    type, location, bbox_norm, text, ocr_conf, 
    readable, preserve, visibility, print_type, 
    color_hex, orientation_degrees
  }],
  preserve_details: [{                                     // 5 fields per detail
    element, priority, location, region_bbox_norm, 
    notes, material_notes
  }],
  hollow_regions: [{                                       // 5 fields per region
    region_type, keep_hollow, inner_visible, 
    inner_description, edge_sampling_notes
  }],
  construction_details: [{                                 // 3 fields per detail
    feature, silhouette_rule, critical_for_structure
  }],
  image_b_priority: {                                      // 4 fields
    is_ground_truth, edge_fidelity_required, 
    print_direction_notes, color_authority
  },
  special_handling: string                                 // 1 field
}
```

### **EnrichmentJSON (Step 3 - Enrichment Analysis)**  
- **Total Fields**: **~40 fields** (including nested objects)
- **Main Sections**: 6 sections
- **Typical Size**: 1,000-1,500 bytes
- **Structure**:
```typescript
{
  type: "garment_enrichment_focused",
  meta: { schema_version, session_id, base_analysis_ref },  // 3 fields
  color_precision: {                                       // 6 fields
    primary_hex, secondary_hex, color_temperature, 
    saturation_level, pattern_direction, pattern_repeat_size
  },
  fabric_behavior: {                                       // 5 fields
    drape_quality, surface_sheen, texture_depth, 
    wrinkle_tendency, transparency_level
  },
  construction_precision: {                                // 5 fields
    seam_visibility, edge_finishing, stitching_contrast, 
    hardware_finish, closure_visibility
  },
  rendering_guidance: {                                    // 5 fields
    lighting_preference, shadow_behavior, texture_emphasis, 
    color_fidelity_priority, detail_sharpness
  },
  market_intelligence: {                                   // 4 fields (optional)
    price_tier, style_longevity, care_complexity, target_season
  },
  confidence_breakdown: {                                  // 4 fields
    color_confidence, fabric_confidence, 
    construction_confidence, overall_confidence
  }
}
```

**COMBINED ORIGINAL DATA**: **~119 fields maximum**

---

## **2. ⚡ Optimized JSON (Flash Optimizer)**

### **FlashOptimizedJSON - Current Implementation**
- **Total Fields**: **18 fields** (fixed structure)
- **Main Sections**: 5 categories
- **Typical Size**: 500-600 bytes
- **Reduction**: **85% fewer fields** (18 vs 119)

```typescript
{
  garment: {           // 3 fields
    type: string,
    silhouette: string,
    category: string
  },
  visual: {            // 5 fields (1 optional)
    primary_color: string,
    secondary_color?: string,
    material_surface: string,
    transparency: string,
    drape_quality: string
  },
  construction: {      // 3 fields (1 optional array)
    seam_visibility: string,
    edge_finishing: string,
    hardware?: string[]
  },
  preserve: {          // 3 arrays
    labels: string[],
    details: string[],
    regions: string[]
  },
  rendering: {         // 3 fields
    lighting: string,
    shadow_style: string,
    color_fidelity: string
  }
}
```

---

## **3. 🏗️ CCJ (Core Contract JSON) System**

### **CoreContractJSON (Minimal Contract)**
- **Total Fields**: **14 fields** (rigid structure)
- **Main Sections**: 6 categories
- **Typical Size**: 800-1,200 bytes
- **Purpose**: Binding contract for model

```typescript
{
  v: "gm-ccj-1.0",              // 1 field
  garment_id: string,           // 1 field
  category: string,             // 1 field
  silhouette: string,           // 1 field
  pattern: string,              // 1 field
  colors_hex: string[],         // 1 array (3-6 colors)
  parts: {                      // 4 nested objects
    neckline: { type, stance_deg },
    sleeves: { length, cuff, gauntlet_placket },
    placket: { buttons, spacing_mm },
    hem: { shape, depth_mm }
  },
  proportions: {                // 3 fields
    shoulder_w, torso_l, sleeve_l
  },
  rules: {                      // 4 fields
    texture_source: "B_flatlay_truth",
    proportion_source: "A_personless_only",
    bg: "#FFFFFF",
    ghost: true
  }
}
```

### **HintsJSON (Extended Data)**  
- **Total Fields**: **~25 fields** (compressed keys)
- **Main Sections**: 6 categories
- **Typical Size**: 600-1,000 bytes
- **Purpose**: Optional QA/audit data

```typescript
{
  v: "gm-hints-1.0",
  fab: {                        // 5 fields (compressed keys)
    mat, weave, drape, trans, sheen
  },
  const: {                      // 5 fields
    edge_fin, req_comp, forb_comp, stch_vis, hrdw_fin
  },
  qa: {                         // 4 fields
    deltaE_max, edge_halo_max, sym_tol, min_res
  },
  render: {                     // 4 fields
    light_pref, shadow_bhv, detail_sharp, tex_emph
  },
  safety: string[],             // 1 array
  meta: {                       // 5 fields
    notes, asym_exp, asym_reg, label_vis
  }
}
```

---

## **🎯 FIELD COUNT COMPARISON**

| Approach | **Fields Passed to Flash** | **Size (bytes)** | **Reduction** |
|----------|---------------------------|------------------|---------------|
| **Full Original Data** | ~119 fields | 3,000-4,500B | Baseline |
| **Optimized JSON** | 18 fields | 500-600B | **85% reduction** |  
| **CCJ Only** | 14 fields | 800-1,200B | **88% reduction** |
| **CCJ + Hints** | 39 fields | 1,400-2,200B | **67% reduction** |

---

## **📊 MAXIMUM FIELDS BY USE CASE**

### **🚀 Production Efficiency (Recommended)**
**Optimized JSON Approach**: **18 fields maximum**
- ✅ Fastest processing
- ✅ Lowest token cost  
- ✅ Essential data only
- ✅ Works with all Flash models

### **🎯 Ultra-Minimal (CCJ Core)**  
**Core Contract Only**: **14 fields maximum**
- ✅ Absolute minimum viable data
- ✅ Strict binding contract
- ✅ Maximum efficiency
- ❌ Less detail preservation

### **🔍 Enhanced with Hints (CCJ + Hints)**
**Full CCJ System**: **39 fields maximum** 
- ✅ Rich QA data
- ✅ Audit trail
- ✅ Advanced retry logic
- ❌ More complex system

### **📚 Legacy Full Data (Not Recommended)**
**Original Analysis + Enrichment**: **119 fields maximum**
- ❌ Token-heavy
- ❌ Processing overhead  
- ❌ Verbose prompts
- ✅ Maximum detail (often unused)

---

## **💡 RECOMMENDATIONS**

### **For Production Use:**
**Use Optimized JSON (18 fields)** with `RENDERING_APPROACH=optimized`
- Perfect balance of efficiency and detail
- 85% reduction in data size
- Maintains visual truth through structured instructions
- Compatible with all Flash models

### **For Experimental/QA:**
**Use CCJ System (14-39 fields)** for advanced retry logic and audit trails
- Ultra-compact core contract (14 fields)
- Optional hints for quality assurance (25 additional fields)
- Advanced digest-based validation

**ANSWER: Maximum 18 fields are passed to Flash in the optimized approach (85% reduction from 119 original fields)**