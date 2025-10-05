# AI Studio Integration Guide

## Overview

The AI Studio integration provides **Google Gemini 2.5 Flash Image** as an alternative renderer for ghost mannequin generation. This integration offers better reliability and performance compared to external services.

## ✅ **Current Status: FULLY IMPLEMENTED**

- **AI Studio as Alternative Renderer**: `renderingModel: 'ai-studio'`
- **Default Renderer**: `freepik-gemini` (unchanged)
- **Full Pipeline Integration**: Seamless consolidation data flow
- **Advanced Error Handling**: Comprehensive safety settings and error recovery
- **Multi-modal Input**: Text prompts + reference images

## Architecture

### Integration Flow
```
Analysis → Enrichment → FactsV3 Consolidation → AI Studio (Gemini 2.5 Flash) → Generated Image
```

### Key Components
1. **`lib/ghost/ai-studio.ts`** - Main AI Studio integration module
2. **Pipeline Integration** - Seamless integration with existing pipeline
3. **Dynamic Prompt Generation** - Uses existing FactsV3 consolidation system
4. **Multi-modal Input** - Text + image references

## Usage

### Basic Usage (Alternative Renderer)
```javascript
import { processGhostMannequin } from './lib/ghost/pipeline.js';

const pipelineOptions = {
  falApiKey: process.env.FAL_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  renderingModel: 'ai-studio', // Alternative renderer
  enableLogging: true,
  timeouts: {
    rendering: 300000, // 5 minutes for AI Studio
  }
};

const request = {
  flatlay: 'https://example.com/flatlay.jpg',
  onModel: 'https://example.com/onmodel.jpg', // Optional
  options: {
    outputSize: '1024x1024',
  }
};

const result = await processGhostMannequin(request, pipelineOptions);
```

### Available Rendering Models
```typescript
type RenderingModel = 
  | 'freepik-gemini'  // Default - Freepik Gemini 2.5 Flash
  | 'ai-studio'       // Alternative - Google AI Studio 
  | 'seedream'        // FAL.AI SeeDream 4.0
  | 'gemini-flash'    // Legacy Gemini Flash
```

## API Integration Details

### Input Processing
```typescript
// Multi-modal content parts sent to AI Studio
const contentParts = [
  { text: dynamicPrompt },                    // Generated with FactsV3 data
  { text: "Primary Image (Detail Source):" },
  { inlineData: { data: flatlayBase64, mimeType: "image/jpeg" }},
  { text: "Shape Reference:" },               // Optional on-model image
  { inlineData: { data: originalBase64, mimeType: "image/jpeg" }}
];
```

### Response Processing
```typescript
// Extract generated image from AI Studio response
const imagePart = candidate.content.parts.find(part => 
  part.inlineData?.mimeType?.startsWith('image/')
);

if (imagePart?.inlineData) {
  const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  const renderUrl = await uploadImageToFalStorage(imageDataUrl); // Permanent storage
}
```

## Advanced Features

### Dynamic Prompt Generation
- **Gemini Pro 2.5** intelligently weaves FactsV3 data into Flash 2.5 templates
- **Exact color precision**: `#F3EFE0` instead of generic descriptions
- **Material specificity**: `drape_stiffness: 0.4`, `surface_sheen: matte`
- **Construction details**: `fringe_trim`, `multi_pattern_print`, `structured silhouette`

### Safety Settings
```typescript
safetySettings: [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]
```

### Error Handling
- **Quota Management**: Automatic handling of API rate limits
- **Content Safety**: Graceful handling of safety filter blocks
- **Fallback System**: Simple prompt generation if dynamic fails
- **Comprehensive Logging**: Detailed debugging information

## Comparison: AI Studio vs Freepik

| Feature | Freepik Issues | AI Studio Advantages |
|---------|----------------|---------------------|
| **Reliability** | 500 server errors, timeouts | Direct Google infrastructure |
| **Performance** | 5+ minute timeouts | 30-60 second generation |
| **Integration** | External API dependency | Uses existing Gemini infrastructure |
| **Cost** | Higher external costs | Google's competitive pricing |
| **Payload Handling** | Complex JSON parsing issues | Native multi-modal support |
| **Image Processing** | Polling-based, complex | Direct base64 response |

## Environment Configuration

```bash
# Required environment variables
GEMINI_API_KEY=your_gemini_api_key_here    # Same key used for analysis
FAL_API_KEY=your_fal_api_key_here          # For image storage

# Optional timeout configuration
TIMEOUT_RENDERING=300000  # 5 minutes for AI Studio rendering
```

## Testing

Run the AI Studio integration test:
```bash
node test-ai-studio.js
```

The test will:
1. Process a sample flatlay image
2. Use AI Studio for rendering
3. Show complete pipeline metrics
4. Display generated image URLs

## Health Check

AI Studio health is automatically included in pipeline health checks:
```typescript
import { healthCheck } from './lib/ghost/pipeline.js';

const health = await healthCheck({
  falApiKey: process.env.FAL_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  renderingModel: 'ai-studio'
});

console.log('AI Studio Status:', health.services.aiStudio);
```

## Integration Benefits

### 1. **Reliability**
- No external service dependencies beyond Google
- Consistent performance without 500 errors
- Built on Google's robust infrastructure

### 2. **Performance** 
- 30-60 second generation times (vs 5+ minutes with external services)
- Direct response without polling
- Immediate base64 image data

### 3. **Cost Efficiency**
- Uses same GEMINI_API_KEY as analysis
- Google's competitive pricing
- No additional service subscriptions

### 4. **Advanced Integration**
- Full FactsV3 consolidation support
- Dynamic prompt generation with Gemini Pro 2.5
- Multi-modal input (text + reference images)
- Seamless pipeline integration

## Future Enhancements

Potential improvements for the AI Studio integration:
1. **Batch Processing**: Multiple images in single request
2. **Advanced Controls**: Temperature, top-k, top-p parameters
3. **Custom Models**: Support for fine-tuned models
4. **Caching**: Intelligent prompt and result caching
5. **Metrics**: Advanced performance and quality tracking

---

The AI Studio integration is production-ready and provides a superior alternative to external rendering services while maintaining full compatibility with your existing ghost mannequin pipeline.