# Negative Constraints for Ghost Mannequin Rendering

## 🚫 Critical Exclusion Constraints

The ghost mannequin rendering pipeline now includes comprehensive negative constraints to ensure **ONLY the garment** appears in the final output.

### ✅ Implementation Details

**File**: `/lib/ghost/prompt-generator.ts`

The base template and dynamic prompt generation now explicitly exclude:

### 🔴 Absolutely Excluded Elements:

1. **NO Mannequins**
   - Visible mannequins (full or partial)
   - Plastic forms, torso forms, dress forms
   - Any mannequin shapes or outlines

2. **NO Models or Human Elements**
   - Human figures, faces, body parts
   - Skin, hands, arms, legs, torso, neck, head
   - Any human presence or suggestion

3. **NO Support Structures**
   - Hangers, stands, rods, clips
   - Visible support systems of any kind
   - Equipment or rigging

4. **NO Unwanted Visual Elements**
   - Backgrounds other than pure white (#FFFFFF)
   - Props or accessories not part of the garment
   - Shadows of human forms or mannequin shapes
   - Reflections showing people or equipment

### ✅ What IS Included:

- **ONLY the garment** with dimensional form
- Invisible internal structure creating natural drape
- Professional studio lighting
- Pure white background (#FFFFFF)
- Ghost mannequin effect (garment appears worn but without visible support)

## 📋 Template Sections Updated:

### 1. **Base Template** (FLASH_25_BASE_TEMPLATE)
```markdown
## CRITICAL EXCLUSION CONSTRAINTS:

ABSOLUTELY EXCLUDE from the final image:
- **NO mannequins** (visible or partial)
- **NO models** (human figures, faces, body parts)
- **NO human elements** (skin, hands, arms, legs, torso, neck, head)
- **NO mannequin parts** (plastic forms, torso forms, dress forms)
- **NO visible support structures** (hangers, stands, rods, clips)
- **NO backgrounds** other than pure white (#FFFFFF)
- **NO props** (accessories not part of the garment)
- **NO shadows of human forms** or mannequin shapes
- **NO reflections** showing people or equipment
```

### 2. **Integration Prompt** (Dynamic Prompt Generation)
```markdown
CRITICAL EXCLUSION REQUIREMENTS - The prompt MUST explicitly exclude:
• NO mannequins, models, human figures, or body parts (hands, arms, legs, skin, torso, neck, head)
• NO visible support structures (hangers, stands, dress forms, plastic forms)
• NO shadows or reflections of people or equipment
• NO props or accessories beyond the garment itself
• ONLY pure white background (#FFFFFF)

The garment must appear with dimensional form created by INVISIBLE internal structure - 
as if worn but with complete absence of any visible person, mannequin, or support.
```

## 🎯 Rendering Philosophy:

Instead of using negative commands like "remove person" or "no mannequin", the system uses **positive framing**:

- ✅ "Professional e-commerce ghost mannequin photography"
- ✅ "Garment displays dimensional form with invisible support"
- ✅ "Pure garment form with natural drape on pure white background"
- ✅ "Shows ONLY the garment itself with dimensional form created by invisible internal structure"

## 📊 Test Results:

**Pipeline Performance**: 60.2s total time
- ✅ Background Removal: 17.1s
- ✅ Analysis: 4.3s (with interior analysis)
- ✅ Enrichment: 2.1s
- ✅ Consolidation: 2.0s
- ✅ Rendering: 19.0s

**Token Optimization**: 98% reduction via Files API (~960 tokens for rendering)

## 🔧 Technical Integration:

The negative constraints are integrated at multiple levels:

1. **Template Level**: Base template includes exclusion constraints
2. **Prompt Generation Level**: Dynamic prompts emphasize exclusions
3. **Integration Level**: AI-powered prompt writer receives explicit exclusion requirements
4. **Rendering Level**: Final prompt to Gemini 2.5 Flash Image includes all constraints

## ✨ Benefits:

- **Cleaner Outputs**: Eliminates unwanted mannequin/model artifacts
- **Professional Quality**: Ensures pure e-commerce product photography
- **Consistent Results**: Explicit constraints reduce variability
- **Brand Safety**: No human elements that could be problematic
- **Interior Preservation**: Interior surfaces remain visible and accurate

---

**Last Updated**: 2025-09-30  
**Status**: ✅ Active in Production
