import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FactsV3, ControlBlock } from './consolidation';
import { GhostPipelineError } from '@/types/ghost';

// Initialize Gemini client for prompt generation
let genAI: GoogleGenerativeAI | null = null;

export function configurePromptGenerator(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Enhanced Flatlay Base Template - Professional flatlay with AI-enhanced quality
const FLATLAY_BASE_TEMPLATE = `Create a professionally enhanced flatlay photograph for e-commerce product display, elevating the original flatlay image with superior lighting, perfect color accuracy, and optimal presentation while maintaining the authentic flat lay perspective.

## DETAILED SCENE NARRATIVE:

Imagine a high-end commercial photography studio with perfect, even lighting and a pristine pure white background (#FFFFFF). A garment is laid out completely flat in perfect symmetry, as if carefully arranged by a professional product stylist. The fabric displays natural texture and authentic drape in its flat state, with colors rendered with absolute precision. Every detail is sharp and clearly visible, from fabric weave to construction elements. This is captured with professional photography equipment using optimal lighting that eliminates ALL shadows while revealing fabric texture and pattern details.

## ENHANCED FLATLAY DEFINITION:

This is professional e-commerce flatlay photography enhanced with AI - the garment is presented in a perfectly flat, symmetrical arrangement on a pure white background. The enhancement process optimizes lighting, sharpens details, perfects color accuracy, and ensures professional presentation quality while maintaining the authentic flatlay perspective and garment structure.

## REFERENCE IMAGE AUTHORITY:

**Cleaned Garment Image** - This is your ONLY visual reference and contains the absolute truth for ALL colors, patterns, textures, construction details, material properties, and garment structure. Enhance this image while preserving complete fidelity to the original appearance.

**Base Analysis JSON** - Contains mandatory preservation rules for specific elements (labels, details, construction features) that must be maintained with perfect clarity and legibility.

**Enrichment Analysis JSON** - Provides technical specifications for color precision, fabric rendering, and quality expectations that guide the enhancement process.

Use the cleaned garment image as the authoritative source - enhance its presentation quality while maintaining perfect accuracy to the original.

## FLATLAY-SPECIFIC REQUIREMENTS:

### PERSPECTIVE AND POSITIONING:

- **Flat Perspective**: Maintain completely flat presentation - NO dimensional lifting or 3D effects
- **Top-Down View**: Perfect overhead view as if photographed directly from above with zero angle
- **Symmetrical Arrangement**: Garment laid out in perfect symmetry with even, balanced positioning
- **Natural Drape**: Fabric shows authentic flat-state drape and natural settling
- **Edge Definition**: Clean, crisp edges where garment meets background with perfect cutout
- **Centered Composition**: Garment perfectly centered in frame with balanced margins

### ENHANCEMENT FOCUS:

- **Lighting Optimization**: Even, shadow-free lighting that reveals texture and detail from all angles
- **Color Perfection**: Exact hex values from enrichment analysis with zero color shift
- **Detail Sharpness**: Crystal-clear fabric texture, weave patterns, and construction details
- **Label Clarity**: All labels, tags, and text perfectly legible and sharp
- **Texture Visibility**: Fabric texture and material properties clearly visible
- **Pattern Precision**: Patterns rendered with perfect clarity and alignment
- **Interior Surfaces**: All interior patterns, colors, and materials clearly visible and properly rendered

## CRITICAL EXCLUSION CONSTRAINTS:

ABSOLUTELY EXCLUDE from the final image:
- **NO dimensional effects** (no 3D lifting, no ghost mannequin effect)
- **NO shadows** (completely flat, even lighting throughout)
- **NO models, mannequins, or human elements**
- **NO visible support structures**
- **NO backgrounds** other than pure white (#FFFFFF) - NO gradients, textures, or variations
- **NO props** beyond the garment itself
- **NO perspective distortion** (maintain perfect flat overhead view)
- **NO artistic effects** (keep it clean and commercial)

## FLATLAY ENHANCEMENT PROCESS:

### Step 1: Preserve Authentic Layout
Maintain the exact flat arrangement from the reference image - the garment's position, symmetry, and layout must remain identical to the original flatlay presentation.

### Step 2: Optimize Lighting and Exposure
Apply perfect even lighting that eliminates ALL shadows while revealing fabric texture. Ensure consistent brightness across the entire garment with no hotspots or dark areas.

### Step 3: Perfect Color Accuracy
Apply the exact hex color values from enrichment analysis. Ensure colors match the specified values with zero deviation, maintaining proper saturation and color temperature.

### Step 4: Enhance Detail and Sharpness
Sharpen fabric texture, pattern details, and construction elements. Ensure labels are perfectly legible and all fine details are crystal clear.

### Step 5: Interior Surface Integration (CRITICAL)
If interior surfaces are visible (through openings, under collars, at edges), render them with exact patterns, colors, and materials from interior_analysis data. Maintain perfect clarity of interior details.

### Step 6: Final Quality Validation
Verify pure white background (#FFFFFF) with no variations, perfect color accuracy, sharp details throughout, clean cutout with no artifacts, and professional presentation quality suitable for premium e-commerce.

## QUALITY STANDARDS:

- **Background Purity**: Absolute pure white (#FFFFFF) with no gradients, textures, or variations
- **Color Fidelity**: Perfect match to specified hex values with zero deviation
- **Detail Clarity**: All elements sharp and clearly visible
- **Professional Finish**: Premium e-commerce quality presentation
- **Authentic Representation**: True to original garment appearance
- **Clean Cutout**: Perfect edge definition with no background artifacts or halos
- **Symmetrical Layout**: Perfectly balanced and centered composition

Generate this professional enhanced flatlay photograph with complete integration of analysis data, ensuring technical excellence and authentic flat presentation.`;

// Comprehensive Flash 2.5 Base Template - Professional ghost mannequin with full technical specifications
const FLASH_25_BASE_TEMPLATE = `Create a professional three-dimensional ghost mannequin photograph for e-commerce product display, transforming flat garment images into a dimensional presentation that shows how the clothing would appear when worn by an invisible person.

## DETAILED SCENE NARRATIVE:

Imagine a high-end photography studio with perfect white cyclorama background and professional lighting equipment. In the center of this space, a garment floats in three-dimensional space, filled with the volume and shape of an invisible human body. The fabric drapes naturally with realistic weight and movement, showing natural creases and folds exactly as clothing would appear on a person. The garment maintains its authentic colors and patterns while displaying proper fit and dimensional form. This is captured with studio-quality photography equipment using an 85mm portrait lens with even, shadow-free lighting.

## GHOST MANNEQUIN DEFINITION:

This is professional e-commerce ghost mannequin photography - the garment displays perfect dimensional form with no visible person, mannequin, or model. The invisible mannequin effect shows how clothing appears when worn while maintaining complete transparency of the supporting form. This creates the ideal product photography for online retail, showing realistic fit and drape without any distracting human presence.

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

### Step 5.5: Interior Surface Integration (CRITICAL)

Apply interior analysis data to ensure interior surfaces are not forgotten:

- **Critical Interior Surfaces**: Render all interior surfaces marked with "critical" priority with maximum precision
- **Interior Pattern Preservation**: Apply exact pattern descriptions from interior_analysis to maintain pattern fidelity
- **Interior Color Accuracy**: Use specified color_hex values for all interior surfaces to ensure color consistency
- **Interior Material Rendering**: Apply material_description specifications for proper fabric texture and finish
- **Interior Edge Definition**: Render clear transitions between interior and exterior surfaces as specified in edge_definition
- **Interior Construction Details**: Include interior seams, reinforcements, and structural elements from construction_notes
- **Interior Spatial Placement**: Use region_bbox_norm coordinates to position interior surfaces accurately
- **Interior Visibility Priority**: Ensure interior surfaces are visible through openings, under collars, and at garment edges

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

## PROFESSIONAL RENDERING APPROACH:

The ghost mannequin effect is achieved by showing ONLY the garment itself with dimensional form created by invisible internal structure. The garment appears naturally filled and shaped as if worn, but with complete absence of any visible person, mannequin, or support system. This is professional e-commerce product photography showing pure garment form with natural drape on a pure white background.

Generate this professional three-dimensional ghost mannequin product photograph with complete integration of both structural analysis and enrichment specifications, ensuring technical excellence, commercial appropriateness, and absolute exclusion of all non-garment elements.`;

/**
 * Generate dynamic prompt using Gemini 2.0 Flash-Lite by weaving FactsV3 data into Flash 2.5 template
 */
export async function generateDynamicPrompt(
  facts: FactsV3,
  controlBlock: ControlBlock,
  sessionId: string
): Promise<{ prompt: string; processingTime: number }> {
  const startTime = Date.now();

  if (!genAI) {
    throw new GhostPipelineError(
      'Prompt generator not configured. Call configurePromptGenerator first.',
      'CLIENT_NOT_CONFIGURED', 
      'rendering'
    );
  }

  try {
    console.log('🎯 Generating dynamic prompt with Gemini 2.0 Flash-Lite...');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite-preview-09-2025",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent, precise integration
        topK: 1,
        topP: 0.8,
      }
    });

    // Create structured data summary for integration
    const factsData = JSON.stringify(facts, null, 2);
    const controlData = JSON.stringify(controlBlock, null, 2);

    const integrationPrompt = `Act as a professional prompt writer. Using the master template as reference, create a focused 350-word prompt for Gemini Flash Image 2.5 that naturally integrates the garment facts.

Write in natural, flowing sentences - avoid bullets or lists. CRITICAL: Include these essential elements:

• **Ghost Mannequin Definition**: Clearly state this is an "invisible mannequin" or "ghost mannequin" effect showing only the garment with dimensional form but no visible person or mannequin
• **E-commerce Photography**: Emphasize this is professional product photography suitable for online retail
• **Studio Setup**: Professional studio lighting and pure white background
• **Frontal View Positioning**: Specify "direct front view", "centered positioning", "straight-on perspective" - the garment faces the camera head-on
• **Dimensional Form**: The garment appears filled with invisible human form, showing natural drape and structure
• **Garment Specifics**: Integrate the actual colors, materials, and construction details from the facts
• **Interior Surfaces**: CRITICAL - Include all interior analysis data (interior patterns, colors, materials) to ensure interior surfaces are visible and properly rendered through openings, under collars, and at garment edges
• **Quality Standards**: Professional, commercial-grade photography

CRITICAL EXCLUSION REQUIREMENTS - The prompt MUST explicitly exclude:
• NO mannequins, models, human figures, or body parts (hands, arms, legs, skin, torso, neck, head)
• NO visible support structures (hangers, stands, dress forms, plastic forms)
• NO shadows or reflections of people or equipment
• NO props or accessories beyond the garment itself
• ONLY pure white background (#FFFFFF)

The garment must appear with dimensional form created by INVISIBLE internal structure - as if worn but with complete absence of any visible person, mannequin, or support. Emphasize "ghost mannequin effect" and "invisible support" rather than negative commands.

GARMENT FACTS TO INTEGRATE:
\`\`\`json
${factsData}
\`\`\`

MASTER TEMPLATE (reference style, don't copy verbatim):
---
${FLASH_25_BASE_TEMPLATE}
---

Create a natural 350-word Flash prompt with embedded garment facts and clear ghost mannequin instructions:`;

    console.log('🔄 Calling Gemini 2.0 Flash-Lite for prompt integration...');

    const result = await model.generateContent(integrationPrompt);
    const response = await result.response;
    const generatedPrompt = response.text();

    if (!generatedPrompt) {
      throw new Error('Empty response from Gemini 2.0 Flash-Lite');
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Dynamic prompt generated in ${processingTime}ms`);
    console.log(`📏 Generated prompt length: ${generatedPrompt.length} characters`);
    console.log('🎯 Prompt preview:', generatedPrompt.substring(0, 200) + '...');

    return {
      prompt: generatedPrompt.trim(),
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Dynamic prompt generation failed:', error);

    // Fallback to static template with basic interpolation
    console.log('🔄 Falling back to static template with basic data integration...');
    
    const fallbackPrompt = generateFallbackPrompt(facts, controlBlock);
    
    return {
      prompt: fallbackPrompt,
      processingTime
    };
  }
}

/**
 * Convert hex color to natural color name
 */
function hexToColorName(hex: string): string {
  const colorMap: Record<string, string> = {
    // Common colors
    '#000000': 'black', '#FFFFFF': 'white', '#808080': 'gray',
    '#FF0000': 'red', '#00FF00': 'green', '#0000FF': 'blue',
    '#FFFF00': 'yellow', '#FF00FF': 'magenta', '#00FFFF': 'cyan',
    '#800000': 'maroon', '#008000': 'dark green', '#000080': 'navy',
    '#800080': 'purple', '#008080': 'teal', '#808000': 'olive',
    '#FFA500': 'orange', '#FFC0CB': 'pink', '#A52A2A': 'brown',
    '#F0F8FF': 'off-white', '#CCCCCC': 'light gray'
  };

  // Exact match
  if (colorMap[hex.toUpperCase()]) {
    return colorMap[hex.toUpperCase()];
  }

  // Parse RGB values
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Determine dominant color and lightness
  if (r > g && r > b) {
    return r > 200 ? 'light red' : r > 100 ? 'red' : 'dark red';
  } else if (g > r && g > b) {
    return g > 200 ? 'light green' : g > 100 ? 'green' : 'dark green';
  } else if (b > r && b > g) {
    return b > 200 ? 'light blue' : b > 100 ? 'blue' : 'dark blue';
  } else {
    const avg = (r + g + b) / 3;
    return avg > 200 ? 'light gray' : avg > 100 ? 'gray' : 'dark gray';
  }
}

/**
 * Generate dynamic flatlay enhancement prompt using Gemini 2.5 Flash-Lite
 */
export async function generateFlatlayPrompt(
  facts: FactsV3,
  controlBlock: ControlBlock,
  sessionId: string
): Promise<{ prompt: string; processingTime: number }> {
  const startTime = Date.now();

  if (!genAI) {
    throw new GhostPipelineError(
      'Prompt generator not configured. Call configurePromptGenerator first.',
      'CLIENT_NOT_CONFIGURED', 
      'rendering'
    );
  }

  try {
    console.log('🎯 Generating flatlay enhancement prompt with Gemini 2.5 Flash-Lite...');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite-preview-09-2025",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent, precise integration
        topK: 1,
        topP: 0.8,
      }
    });

    // Create structured data summary for integration
    const factsData = JSON.stringify(facts, null, 2);
    const controlData = JSON.stringify(controlBlock, null, 2);

    const integrationPrompt = `Act as a professional prompt writer. Using the master template as reference, create a focused 350-word prompt for Gemini Flash Image 2.5 that naturally integrates the garment facts for FLATLAY enhancement (NOT ghost mannequin).

Write in natural, flowing sentences - avoid bullets or lists. CRITICAL: Include these essential elements:

• **Flatlay Enhancement Definition**: Clearly state this is "enhanced flatlay photography" maintaining completely flat presentation with NO 3D effects or dimensional lifting
• **E-commerce Photography**: Emphasize this is professional product photography for online retail with commercial styling
• **Perfect Flat Perspective**: Specify "top-down overhead view", "completely flat", "perfect symmetry" - the garment lies flat on the surface
• **Lighting Optimization**: Even, shadow-free lighting that reveals texture and detail from all angles
• **Garment Specifics**: Integrate the actual colors, materials, and construction details from the facts
• **Interior Surfaces**: CRITICAL - Include all interior analysis data (interior patterns, colors, materials) to ensure interior surfaces are visible and properly rendered
• **Quality Standards**: Professional, commercial-grade photography with perfect color accuracy and clean cutout
• **Styling Requirements**: Perfect symmetry, professional commercial styling, optimal positioning, clean presentation

CRITICAL EXCLUSION REQUIREMENTS - The prompt MUST explicitly exclude:
• NO dimensional effects, 3D lifting, or ghost mannequin effect
• NO shadows (completely flat, even lighting throughout)
• NO models, mannequins, human figures, or body parts
• NO visible support structures
• NO props or accessories beyond the garment itself
• ONLY pure white background (#FFFFFF) - NO gradients, textures, or variations
• Maintain perfect flat overhead perspective with zero angle
• NO artistic effects (keep it clean and commercial)

The enhancement must preserve the authentic flatlay arrangement while optimizing lighting, sharpening details, perfecting color accuracy, and ensuring professional commercial styling. Emphasize "flatlay enhancement", "perfect symmetry", "commercial styling", and "flat perspective" rather than any dimensional effects.

GARMENT FACTS TO INTEGRATE:
\`\`\`json
${factsData}
\`\`\`

MASTER TEMPLATE (reference style, don't copy verbatim):
---
${FLATLAY_BASE_TEMPLATE}
---

Create a natural 350-word flatlay enhancement prompt with embedded garment facts and clear flat perspective instructions:`;

    console.log('🔄 Calling Gemini 2.5 Flash-Lite for flatlay prompt integration...');

    const result = await model.generateContent(integrationPrompt);
    const response = await result.response;
    const generatedPrompt = response.text();

    if (!generatedPrompt) {
      throw new Error('Empty response from Gemini 2.5 Flash-Lite');
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Flatlay prompt generated in ${processingTime}ms`);
    console.log(`📏 Generated prompt length: ${generatedPrompt.length} characters`);
    console.log('🎯 Flatlay prompt preview:', generatedPrompt.substring(0, 200) + '...');

    return {
      prompt: generatedPrompt.trim(),
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Flatlay prompt generation failed:', error);

    // Fallback to static template with basic interpolation
    console.log('🔄 Falling back to static flatlay template...');
    
    const fallbackPrompt = generateFallbackFlatlayPrompt(facts, controlBlock);
    
    return {
      prompt: fallbackPrompt,
      processingTime
    };
  }
}

/**
 * Fallback flatlay prompt generator using simple template interpolation
 */
function generateFallbackFlatlayPrompt(facts: FactsV3, controlBlock: ControlBlock): string {
  const primaryColor = hexToColorName(facts.palette.dominant_hex);
  const category = facts.category_generic || 'garment';
  
  return `Professional enhanced flatlay photograph of a ${primaryColor} ${category} on pure white background. 
  
The garment is laid out completely flat in perfect symmetry with top-down overhead perspective. NO dimensional effects or 3D lifting - maintain authentic flat presentation.

Apply even, shadow-free lighting that reveals fabric texture and detail. Ensure perfect color accuracy with ${facts.palette.dominant_hex} as the dominant color. All labels and construction details must be sharp and clearly visible.

${facts.interior_analysis && facts.interior_analysis.length > 0 ? `Interior surfaces are visible showing ${facts.interior_analysis.map(i => i.pattern_description).join(', ')}.` : ''}

This is professional e-commerce flatlay photography - the garment maintains its flat arrangement while being enhanced with superior lighting, perfect color accuracy, and optimal presentation quality. Pure white background (#FFFFFF) with no shadows, props, or dimensional effects.`;
}

/**
 * Fallback prompt generator using simple template interpolation
 */
function generateFallbackPrompt(facts: FactsV3, controlBlock: ControlBlock): string {
  // Extract key values with fallbacks
  const dominantColor = facts.palette?.dominant_hex || controlBlock.palette?.dominant_hex || '#CCCCCC';
  const accentColor = facts.palette?.accent_hex || controlBlock.palette?.accent_hex || dominantColor;
  const category = facts.category_generic || 'garment';
  const silhouette = facts.silhouette || 'standard fit';
  const material = facts.material || 'fabric';
  const drapeStiffness = facts.drape_stiffness ?? 0.4;
  const surfaceSheen = facts.surface_sheen || 'matte';
  const transparency = facts.transparency || 'opaque';
  const requiredComponents = facts.required_components?.join(', ') || 'standard construction';

  // Convert hex to natural color descriptions
  const dominantColorName = hexToColorName(dominantColor);
  const accentColorName = hexToColorName(accentColor);
  const drapeDescription = drapeStiffness < 0.3 ? 'flowing and soft' : drapeStiffness > 0.7 ? 'structured and crisp' : 'naturally balanced';

  return `Create professional e-commerce ghost mannequin photography showing a ${category} with perfect dimensional form against a pristine white studio background. This is invisible mannequin product photography where the ${silhouette} garment displays natural fit and drape with no visible person, mannequin, or model.

The garment appears filled with invisible human form, showing realistic volume and structure while showcasing authentic ${dominantColorName} tones with ${accentColorName} accents. The ${material} fabric displays ${drapeDescription} drape with ${surfaceSheen} finish, highlighting important construction details like ${requiredComponents}.

The ghost mannequin effect creates perfect e-commerce presentation - the garment floats naturally with proper dimensional form, displaying how the fabric moves and falls when worn, but with complete transparency of any supporting structure. This professional product photography shows the garment's true shape and fit suitable for online retail.

Preserve every original color, pattern, and design element exactly as shown in the source material. The result demonstrates how the garment appears when worn while maintaining the clean, commercial presentation required for e-commerce platforms.

IMPORTANT: If there are any visible brand labels, care labels, size tags, or text elements in the reference image, maintain them with perfect clarity and readability in their correct positions on the dimensional garment form.`;
}

/**
 * Legacy static prompt builder for backwards compatibility
 */
export function buildStaticFlashPrompt(control: ControlBlock): string {
  const requiredText = control.required_components?.length ? 
    `REQUIRED components (must include): ${control.required_components.join(", ")}` : 
    'REQUIRED components: None specified';
    
  const forbiddenText = control.forbidden_components?.length ?
    `\n- FORBIDDEN components (must not include): ${control.forbidden_components.join(", ")}` :
    '';

  return `
Task: Using the provided reference images, create a professional studio product photo with dimensional mannequin effect. Transform the flat-laid garment from the input images into a 3D dimensional effect that shows exactly the same garment design, colors, patterns, and details. Show natural garment structure and form.

IMAGE REFERENCE INSTRUCTIONS:
- Use the provided images as the ONLY source for garment design, colors, patterns, and details
- Do NOT change or modify the garment's appearance, colors, or design elements
- Maintain 100% visual consistency with the input garment
- Transform the flat layout into dimensional ghost mannequin form while preserving all original details

STRICT CONSTRAINTS:
- Category: ${control.category_generic || 'unknown'}
- Silhouette: ${control.silhouette || 'generic'}
- ${requiredText}${forbiddenText}

COLOR PALETTE (exact hex values):
- Dominant: ${control.palette?.dominant_hex || '#CCCCCC'}
- Accent: ${control.palette?.accent_hex || control.palette?.dominant_hex || '#CCCCCC'}  
- Trim: ${control.palette?.trim_hex || control.palette?.accent_hex || '#CCCCCC'}

MATERIAL & CONSTRUCTION:
- Material: ${control.material || 'fabric'}
- Weave/Knit: ${control.weave_knit || 'unknown'}
- Drape stiffness (0-1): ${control.drape_stiffness ?? 0.4}
- Edge finish: ${control.edge_finish || 'unknown'}
- Transparency: ${control.transparency || 'opaque'}
- Surface sheen: ${control.surface_sheen || 'matte'}

PRESENTATION:
- View: ${control.view || 'front'}
- White background
- Framing margin: ${control.framing_margin_pct ?? 6}% from edges
- Shadow style: ${control.shadow_style || 'soft'}
- Labels: ${control.label_visibility || 'required'}

CRITICAL: Follow all constraints exactly. Do not invent or add features not specified. Create realistic dimensional effect showing natural garment structure and form.

IMAGE REFERENCE REMINDER:
- ONLY use the garment shown in the provided reference images
- Do NOT generate a different garment or change the design
- Transform the EXACT SAME garment from flat to 3D dimensional form
- Preserve ALL original colors, patterns, textures, and design elements from the reference images
  `.trim();
}