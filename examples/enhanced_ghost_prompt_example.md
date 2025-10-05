# Enhanced Ghost Mannequin Prompt Example

## Base Professional Prompt + Analysis-Specific Requirements

When processing a garment with the comprehensive analysis schema, the system will generate a prompt like this:

---

**[Base Professional Ghost Mannequin Prompt - 2000+ words of detailed instructions]**

## ANALYSIS-SPECIFIC REQUIREMENTS:

**CRITICAL LABEL PRESERVATION:**
- Preserve "Nike" at coordinates [0.45, 0.12, 0.55, 0.18] with perfect legibility
- Preserve size label "M" at coordinates [0.42, 0.19, 0.58, 0.25] with perfect legibility

**CRITICAL DETAIL PRESERVATION:**
- Preserve "Nike Swoosh Logo" at coordinates [0.15, 0.25, 0.25, 0.35] - Embroidered logo in contrasting white thread
  Material: Raised embroidery with slight sheen
- Preserve "Contrast stitching" at coordinates [0.20, 0.15, 0.80, 0.40] - White topstitching on navy fabric creates visual accent
  Material: Standard polyester thread, matte finish

**HOLLOW REGION REQUIREMENTS:**
- Keep neckline hollow as specified
  Edge handling: Clean edge with ribbed collar attachment
- Keep sleeves hollow as specified
  Edge handling: Finished with hemmed cuffs

**CONSTRUCTION REQUIREMENTS:**
- CRITICAL: Set-in sleeves - Maintain natural shoulder line and armpit curve
- CRITICAL: Side seams - Preserve body contour with slight tapering
- Bottom hem - Straight hem line with natural drape

**SPECIAL HANDLING:** Athletic wear with performance fabric - maintain moisture-wicking texture appearance. Logo embroidery critical for brand recognition.

**IMAGE PROCESSING PRIORITY:**
- Image B is ground truth for all visual details
- Maintain exact edge fidelity from source
- Image B colors are authoritative - match exactly
- Print direction: Logo and text oriented correctly for front view

Follow these analysis-derived requirements with absolute precision while maintaining the professional ghost mannequin photography standards specified above.

---

## Key Features of This Integration:

### 1. **Precise Spatial Coordinates**
- Uses normalized bounding boxes from the analysis
- Directs attention to exact pixel regions
- Ensures critical elements are preserved with perfect accuracy

### 2. **Material-Specific Instructions** 
- Incorporates material notes from the analysis
- Provides texture and finish guidance
- Ensures realistic representation of special materials

### 3. **Construction-Aware Processing**
- Follows silhouette rules from construction analysis
- Maintains structural integrity requirements
- Preserves designed openings and closures

### 4. **Priority-Based Preservation**
- Focuses on "critical" elements first
- Ensures brand-essential elements are protected
- Balances detail preservation with overall aesthetics

### 5. **Hollow Region Management**
- Respects keep_hollow flags from analysis
- Includes edge handling instructions
- Maintains authentic openings without artificial fill

This comprehensive approach ensures that the Gemini 2.5 Flash model receives both:
- **Professional photography standards** (lighting, composition, quality)
- **Garment-specific requirements** (spatial precision, material fidelity, structural integrity)

The result is a ghost mannequin that preserves every critical brand element while maintaining the professional e-commerce photography quality required for retail applications.
