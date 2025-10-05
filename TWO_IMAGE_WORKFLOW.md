# Two-Image Workflow Integration

## Overview

The Ghost Mannequin Pipeline has been enhanced to support the **professional two-image workflow** as designed in the system architecture. This matches the professional prompts and ensures optimal results.

## Image Roles

### 🔍 Image B - Detail Source (Required)
- **API Field**: `flatlay`
- **Purpose**: Primary visual reference containing absolute truth
- **Content**: Colors, patterns, textures, construction details, brand elements
- **Source**: Flatlay shots, detail photography, product shots
- **Analysis**: This image is analyzed by Gemini 2.5 Pro for comprehensive garment analysis
- **Priority**: **Required** - Pipeline cannot run without this image

### 👤 Image A - On-Model Reference (Optional) 
- **API Field**: `onModel`
- **Purpose**: Understanding proportions and spatial relationships
- **Content**: Garment worn by person showing fit and drape
- **Source**: Model photography, on-body shots
- **Analysis**: Used for dimensional understanding only
- **Priority**: **Optional** - Enhances results but not required

## Professional Prompt Integration

The system integrates these images according to the professional prompt specifications:

```
**Image B (Detail Source)** - This is your primary visual reference containing 
the absolute truth for all colors, patterns, textures, construction details, 
and material properties. Copy these elements with complete fidelity.

**Image A (Model Reference)** - Use only for understanding basic proportions 
and spatial relationships; all visual details should come from Image B.
```

## Web Interface

Visit **http://localhost:3000** to see the enhanced interface:

- **Side-by-side upload areas** for both images
- **Clear labeling** of Image A (optional) and Image B (required)  
- **Visual feedback** with different border colors
- **Smart validation** - button only enables when Image B is uploaded
- **Usage guidance** explaining the roles of each image

## API Integration

### Request Structure
```json
{
  "flatlay": "base64_or_url_of_image_B",    // Detail Source (Required)
  "onModel": "base64_or_url_of_image_A",    // On-Model Reference (Optional)
  "options": {
    "outputSize": "2048x2048",
    "backgroundColor": "white"
  }
}
```

### Processing Flow
1. **Background Removal**: Applied to Image B (detail source)
2. **Garment Analysis**: Performed on cleaned Image B with comprehensive schema
3. **Ghost Mannequin Generation**: Uses both images with proper authority:
   - Image B provides visual truth (colors, patterns, details)
   - Image A provides proportional context (fit, drape, dimensions)

## Enhanced Features

### 🔬 Analysis Integration
- Gemini 2.5 Pro analyzes Image B for comprehensive garment data
- JSON schema includes spatial coordinates for brand elements
- Priority classification ensures critical details are preserved

### 🎨 Rendering Authority
- Image B is ground truth for all visual elements
- Image A provides dimensional and proportional context
- Temperature 0.05 for precise, consistent generation
- Analysis-specific requirements dynamically added to rendering prompt

### 🧪 Testing Support
- **Sample Images**: Pre-configured test images for both roles
- **Quick Testing**: "Test with Sample Image" uses both images
- **API Endpoints**: `/api/test` provides sample requests and documentation

## Quality Benefits

Using both images provides:
- **Better Proportions**: On-model reference ensures realistic fit
- **Accurate Details**: Detail source preserves exact colors and patterns  
- **Brand Fidelity**: Critical elements preserved with pixel-perfect accuracy
- **Professional Results**: Commercial-grade ghost mannequin effects

## Backwards Compatibility

The system maintains full backwards compatibility:
- **Image B Only**: Works with just the detail source (flatlay)
- **Legacy Field Names**: `flatlay` and `onModel` maintain API compatibility
- **Optional Image A**: Pipeline functions without on-model reference

## Best Practices

For optimal results:
1. **Always provide Image B** - The detail source is essential
2. **Include Image A when available** - Significantly improves proportional accuracy
3. **Use high-quality images** - Better inputs yield better outputs
4. **Match garment type** - Both images should show the same garment
5. **Consider lighting** - Consistent lighting between images helps analysis

This two-image workflow ensures the Ghost Mannequin Pipeline produces professional-quality results suitable for e-commerce, fashion brands, and commercial photography applications.
