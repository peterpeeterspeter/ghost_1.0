# Ghost Mannequin Pipeline - Supabase Edge Function Package

This package contains the complete Ghost Mannequin Pipeline adapted for deployment as a Supabase Edge Function.

## 🚀 Features Included

✅ **Complete 5-Stage Pipeline**
- Background removal (FAL.AI Bria 2.0)
- Professional garment analysis (Gemini 2.0 Flash-Lite)
- Enrichment analysis (rendering-critical attributes)
- JSON consolidation (smart data merging)
- Ghost mannequin generation (AI Studio/Gemini 2.5 Flash)

✅ **Cost-Optimized Processing**
- Uses Gemini 2.0 Flash-Lite (95% cheaper than Pro)
- Image resizing for token savings
- Smart timeout management
- Comprehensive error handling

✅ **Production-Ready**
- TypeScript with proper error handling
- CORS support for web integration
- Structured logging and monitoring
- Session tracking and metrics

## 📋 Prerequisites

- Supabase project with Edge Functions enabled
- FAL.AI API key (https://fal.ai/dashboard)
- Google Gemini API key (https://aistudio.google.com/app/apikey)
- Supabase CLI installed

## 🛠️ Setup Instructions

### 1. Deploy to Supabase

```bash
# Initialize Supabase project (if not already done)
supabase init

# Create the edge function
supabase functions new ghost-mannequin

# Copy the pipeline code
cp ghost-mannequin-pipeline.ts supabase/functions/ghost-mannequin/index.ts

# Deploy the function
supabase functions deploy ghost-mannequin --no-verify-jwt
```

### 2. Set Environment Variables

```bash
# Set your API keys as secrets
supabase secrets set FAL_API_KEY=your_fal_api_key_here
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
supabase secrets set RENDERING_MODEL=ai-studio

# Optional: Freepik API key for alternative rendering
supabase secrets set FREEPIK_API_KEY=your_freepik_api_key_here
```

### 3. Test the Function

```bash
# Test locally
supabase functions serve ghost-mannequin

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ghost-mannequin \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "https://example.com/garment-image.jpg",
    "options": {
      "outputSize": "2048x2048",
      "backgroundColor": "white"
    }
  }'
```

## 🔧 API Usage

### Request Format

```typescript
interface GhostRequest {
  flatlay: string; // Required: base64 data or image URL
  onModel?: string; // Optional: on-model reference image
  options?: {
    preserveLabels?: boolean;
    outputSize?: '1024x1024' | '2048x2048';
    backgroundColor?: 'white' | 'transparent';
    useStructuredPrompt?: boolean;
    useExpertPrompt?: boolean;
  };
}
```

### Response Format

```typescript
interface GhostResult {
  sessionId: string;
  status: 'completed' | 'failed';
  cleanedImageUrl?: string; // Background-removed image
  renderUrl?: string; // Final ghost mannequin image
  analysis?: any; // Detailed garment analysis
  enrichment?: any; // Rendering-critical attributes
  metrics: {
    processingTime: string; // Total processing time
    stageTimings: {
      backgroundRemoval: number;
      analysis: number;
      enrichment: number;
      consolidation: number;
      rendering: number;
    };
  };
  error?: {
    message: string;
    code: string;
    stage: string;
  };
}
```

### Example Usage

#### JavaScript/TypeScript

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/ghost-mannequin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY', // Optional for public access
  },
  body: JSON.stringify({
    flatlay: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...', // or image URL
    options: {
      outputSize: '2048x2048',
      backgroundColor: 'white',
      preserveLabels: true
    }
  })
});

const result = await response.json();

if (result.status === 'completed') {
  console.log('Ghost mannequin URL:', result.renderUrl);
  console.log('Processing time:', result.metrics.processingTime);
} else {
  console.error('Processing failed:', result.error);
}
```

#### React Component

```jsx
import React, { useState } from 'react';

export function GhostMannequinProcessor({ supabaseUrl, anonKey }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const processImage = async (file) => {
    setLoading(true);
    setResult(null);

    try {
      // Convert file to base64
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/ghost-mannequin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          flatlay: base64,
          options: {
            outputSize: '2048x2048',
            backgroundColor: 'white'
          }
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Processing failed:', error);
      setResult({ status: 'failed', error: { message: error.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
        disabled={loading}
      />
      
      {loading && <div>Processing ghost mannequin...</div>}
      
      {result?.status === 'completed' && (
        <div>
          <h3>Results</h3>
          <p>Processing time: {result.metrics.processingTime}</p>
          {result.cleanedImageUrl && (
            <div>
              <h4>Background Removed</h4>
              <img src={result.cleanedImageUrl} alt="Cleaned" style={{ maxWidth: '300px' }} />
            </div>
          )}
          {result.renderUrl && (
            <div>
              <h4>Ghost Mannequin</h4>
              <img src={result.renderUrl} alt="Ghost mannequin" style={{ maxWidth: '300px' }} />
            </div>
          )}
        </div>
      )}
      
      {result?.status === 'failed' && (
        <div>
          <h3>Error</h3>
          <p>{result.error.message}</p>
          <p>Code: {result.error.code}</p>
          <p>Stage: {result.error.stage}</p>
        </div>
      )}
    </div>
  );
}
```

## 🔍 Monitoring and Debugging

### Logs

View function logs in real-time:

```bash
supabase functions logs ghost-mannequin --follow
```

### Error Codes

The pipeline returns specific error codes for debugging:

- `STAGE_TIMEOUT`: Processing stage timed out
- `IMAGE_FETCH_FAILED`: Could not fetch image from URL
- `INVALID_FAL_RESPONSE`: FAL.AI API returned invalid response
- `BACKGROUND_REMOVAL_FAILED`: Background removal failed
- `INVALID_GEMINI_RESPONSE`: Gemini API returned invalid response
- `ANALYSIS_FAILED`: Garment analysis failed
- `ENRICHMENT_FAILED`: Enrichment analysis failed
- `CONSOLIDATION_FAILED`: Data consolidation failed
- `RENDERING_FAILED`: Ghost mannequin generation failed
- `PIPELINE_FAILED`: General pipeline failure

### Performance Metrics

The pipeline tracks detailed timing metrics:

- `backgroundRemoval`: Time for FAL.AI background removal
- `analysis`: Time for base garment analysis
- `enrichment`: Time for enrichment analysis
- `consolidation`: Time for data consolidation
- `rendering`: Time for ghost mannequin generation

## 💰 Cost Optimization

This implementation uses cost-optimized models and techniques:

1. **Gemini 2.0 Flash-Lite**: 95% cheaper than Pro models
2. **Image Resizing**: Reduces token consumption significantly
3. **Smart Timeouts**: Prevents runaway costs
4. **Error Handling**: Avoids expensive retry loops

Estimated costs per image: $0.05-$0.15 depending on complexity.

## 🚀 Advanced Configuration

### Custom Timeouts

Adjust timeouts via environment variables:

```bash
supabase secrets set TIMEOUT_BACKGROUND_REMOVAL=45000  # 45 seconds
supabase secrets set TIMEOUT_ANALYSIS=120000          # 2 minutes
supabase secrets set TIMEOUT_ENRICHMENT=90000         # 1.5 minutes
supabase secrets set TIMEOUT_RENDERING=300000         # 5 minutes
```

### Rendering Model Selection

Choose your preferred rendering model:

```bash
supabase secrets set RENDERING_MODEL=ai-studio        # Recommended
supabase secrets set RENDERING_MODEL=gemini-flash     # Alternative
```

## 📖 What This Package Includes

- **Complete Pipeline Implementation** (845 lines of TypeScript)
- **5-Stage Processing**: Background removal → Analysis → Enrichment → Consolidation → Rendering
- **Professional Analysis**: 70+ structured data fields
- **Cost Optimizations**: Token savings, cheap models, smart timeouts
- **Production Ready**: Error handling, logging, metrics, CORS support
- **Easy Integration**: Simple REST API with comprehensive documentation

## 🎯 Next Steps

1. Deploy the Edge Function to your Supabase project
2. Set up your API keys as secrets
3. Test with sample images
4. Integrate into your frontend application
5. Monitor performance and costs

This package gives you a complete, production-ready ghost mannequin pipeline that runs serverlessly on Supabase Edge Functions! 🚀