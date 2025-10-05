# Flatlay Enhancement Pipeline

## 🎨 Overview

The Flatlay Enhancement Pipeline uses the same powerful analysis infrastructure as the Ghost Mannequin Pipeline but generates **enhanced flatlay images** instead of 3D ghost mannequin effects.

### **Key Difference:**
- **Ghost Mannequin**: Transforms flat garment into 3D dimensional presentation
- **Flatlay Enhancement**: Enhances flat garment with perfect lighting, color accuracy, and professional quality while maintaining flat perspective

## 🏗️ Architecture

Both pipelines share the same analysis infrastructure:

```
Input Image
    ↓
Background Removal (FAL.AI Bria 2.0)
    ↓
Garment Analysis (Gemini 2.5 Flash Lite Preview)
    ↓
Enrichment Analysis (Gemini 2.5 Flash Lite Preview)
    ↓
Consolidation (Gemini 2.5 Flash Lite Preview)
    ↓
┌─────────────────────────────────┐
│  RENDERING FORK                 │
│                                 │
│  if outputType === 'flatlay':   │
│    → Enhanced Flatlay           │
│  else:                          │
│    → Ghost Mannequin (3D)       │
└─────────────────────────────────┘
```

## 📊 What's Enhanced

### **Flatlay-Specific Enhancements:**

1. **Lighting Optimization**
   - Even, shadow-free lighting
   - Reveals fabric texture and detail
   - Eliminates hotspots and dark areas

2. **Color Perfection**
   - Exact hex values from enrichment analysis
   - Zero color shift or deviation
   - Proper saturation and temperature

3. **Detail Sharpening**
   - Crystal-clear fabric texture
   - Sharp pattern details
   - Perfectly legible labels and tags

4. **Professional Presentation**
   - Pure white background (#FFFFFF)
   - Centered composition
   - Balanced margins
   - Premium e-commerce quality

## 🔌 API Endpoint

### **POST /api/flatlay**

Enhanced flatlay generation using AI analysis.

#### Request Body:
```json
{
  "flatlay": "base64_or_url_of_flatlay_image",
  "options": {
    "preserveLabels": true,
    "outputSize": "2048x2048",
    "backgroundColor": "white"
  }
}
```

#### Response:
```json
{
  "sessionId": "uuid",
  "status": "completed",
  "cleanedImageUrl": "https://...",
  "renderUrl": "https://...",
  "metrics": {
    "processingTime": "42.5s",
    "stageTimings": {
      "backgroundRemoval": 12000,
      "analysis": 4000,
      "enrichment": 2000,
      "consolidation": 1500,
      "rendering": 18000
    }
  },
  "analysis": {
    "labels_found": [...],
    "preserve_details": [...],
    "interior_analysis": [...]
  }
}
```

### **GET /api/flatlay**

Health check endpoint.

#### Response:
```json
{
  "status": "healthy",
  "endpoint": "flatlay",
  "description": "Enhanced flatlay image generation using AI analysis",
  "version": "1.0.0"
}
```

## 🎯 Key Features

### **✅ What IS Enhanced:**
- Perfect flat perspective maintained
- Even, shadow-free lighting
- Exact color accuracy (hex values)
- Sharp details and texture
- Clear label legibility
- Interior surfaces (if visible)
- Professional presentation

### **🚫 What's EXCLUDED:**
- NO dimensional effects (stays flat)
- NO 3D lifting or ghost mannequin
- NO shadows
- NO models, mannequins, or human elements
- NO props beyond the garment
- NO perspective distortion

## 📝 Prompt Strategy

The flatlay enhancement uses a specialized prompt that:

1. **Maintains Flat Perspective**
   - Top-down overhead view
   - Completely flat presentation
   - Symmetrical arrangement

2. **Optimizes Technical Quality**
   - Professional studio lighting
   - Perfect color accuracy
   - Enhanced sharpness

3. **Preserves Authenticity**
   - True to original garment
   - Exact layout maintained
   - All details preserved

### **Flatlay Prompt Template:**

```
Create a professionally enhanced flatlay photograph for e-commerce 
product display, elevating the original flatlay image with superior 
lighting, perfect color accuracy, and optimal presentation while 
maintaining the authentic flat lay perspective.

## FLATLAY-SPECIFIC REQUIREMENTS:

- **Flat Perspective**: Maintain completely flat presentation - 
  NO dimensional lifting or 3D effects
- **Top-Down View**: Perfect overhead view as if photographed 
  directly from above
- **Symmetrical Arrangement**: Garment laid out symmetrically 
  with even, balanced positioning
- **Lighting Optimization**: Even, shadow-free lighting that 
  reveals texture and detail
- **Color Perfection**: Exact hex values with zero color shift

[Analysis data integration follows...]
```

## 🚀 Usage Examples

### **TypeScript/JavaScript:**
```typescript
const response = await fetch('/api/flatlay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    flatlay: imageBase64OrUrl,
    options: {
      preserveLabels: true,
      outputSize: '2048x2048',
      backgroundColor: 'white'
    }
  })
});

const result = await response.json();
console.log('Enhanced flatlay:', result.renderUrl);
```

### **cURL:**
```bash
curl -X POST http://localhost:3000/api/flatlay \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "data:image/jpeg;base64,...",
    "options": {
      "preserveLabels": true,
      "outputSize": "2048x2048"
    }
  }'
```

### **Test Script:**
```bash
npx tsx test-flatlay-endpoint.ts
```

## ⚙️ Configuration

The flatlay pipeline is configured via the same options as ghost mannequin:

```typescript
const result = await processGhostMannequin(request, {
  falApiKey: process.env.FAL_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  renderingModel: 'ai-studio',
  outputType: 'flatlay', // 👈 This enables flatlay mode
  enableLogging: true,
});
```

## 📊 Performance

**Typical Processing Times:**
- Background Removal: ~12-15s
- Analysis: ~4-5s
- Enrichment: ~2-3s
- Consolidation: ~1-2s
- Flatlay Enhancement: ~18-22s

**Total Pipeline**: ~40-50s

## 🎨 Model Information

- **Analysis**: Gemini 2.5 Flash Lite Preview (09-2025)
- **Enrichment**: Gemini 2.5 Flash Lite Preview (09-2025)
- **Consolidation**: Gemini 2.5 Flash Lite Preview (09-2025)
- **Rendering**: Gemini 2.5 Flash Image Preview

## 💡 Use Cases

### **E-commerce Product Photography:**
- Enhance existing flatlay photos
- Improve lighting and color accuracy
- Ensure consistent professional quality

### **Catalog Preparation:**
- Batch process flatlay images
- Standardize presentation
- Optimize for web display

### **Quality Control:**
- Fix poor lighting conditions
- Correct color inaccuracies
- Enhance detail visibility

## 🔄 Comparison

| Feature | Ghost Mannequin | Flatlay Enhancement |
|---------|----------------|---------------------|
| **Perspective** | 3D dimensional | Flat overhead |
| **Output** | Worn appearance | Laid flat appearance |
| **Lighting** | Dimensional shadows | Flat, even lighting |
| **Use Case** | Show garment fit | Show garment details |
| **Analysis** | ✅ Same | ✅ Same |
| **Interior** | ✅ Visible through openings | ✅ Visible if present |
| **Quality** | Premium 3D | Premium 2D |

## 📁 Code Structure

```
/app/api/
  /flatlay/route.ts          # Flatlay endpoint
  /ghost/route.ts            # Ghost mannequin endpoint

/lib/ghost/
  pipeline.ts                # Shared pipeline (routes based on outputType)
  prompt-generator.ts        # generateFlatlayPrompt() + generateDynamicPrompt()
  ai-studio.ts              # generateEnhancedFlatlay() + ghost mannequin functions
  gemini.ts                 # Shared analysis functions
  consolidation.ts          # Shared consolidation logic
```

## 🔧 Environment Variables

Required environment variables (same as ghost mannequin):

```env
FAL_KEY=your_fal_api_key
GEMINI_API_KEY=your_gemini_api_key
RENDERING_APPROACH=json  # Optional, defaults to 'json'
```

## ✨ Benefits

1. **Shared Analysis Infrastructure**: Reuses proven analysis pipeline
2. **Consistent Quality**: Same analysis quality as ghost mannequin
3. **Cost Efficient**: Leverages existing models and optimization
4. **Easy Integration**: Same API pattern as ghost mannequin
5. **Interior Awareness**: Captures interior surfaces automatically
6. **Professional Output**: E-commerce ready flatlay images

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-30  
**Status**: ✅ Production Ready
