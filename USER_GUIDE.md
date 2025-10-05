# Ghost Mannequin Pipeline - User Guide

## Getting Started

Visit **http://localhost:3000** to access the Ghost Mannequin Pipeline interface.

## Features

### 🔍 API Health Check
- Click **"Check API Health"** to verify all services are running
- Confirms FAL.AI and Gemini API connections
- Shows service status and any configuration issues

### 🖼️ Image Upload & Testing

#### Option 1: Upload Your Own Images (Two-Image Workflow)

**Image A - On-Model Reference (Optional)**
- Shows garment worn by a person
- Used for understanding proportions and spatial relationships
- Helps AI understand fit and drape
- Drag & drop or click the left upload area

**Image B - Detail Source (Required)**
- Flatlay or detail shot of the garment
- Primary visual reference with absolute truth for colors, patterns, textures
- Contains all construction details and brand elements
- Drag & drop or click the right upload area
- **Required**: You must upload at least Image B

**Supported Formats**: JPEG, PNG, WebP (max 10MB each)
**Process**: Click **"🚀 Generate Ghost Mannequin"** (enabled only when Image B is uploaded)

#### Option 2: Test with Sample Image
- Click **"🧪 Test with Sample Image"** for instant testing
- Uses a curated sample t-shirt image from Unsplash
- No file upload required - perfect for quick testing

### 📊 Processing Results

The interface displays comprehensive processing results including:

#### Success Response
```json
{
  "sessionId": "uuid-here",
  "status": "completed",
  "cleanedImageUrl": "background-removed-image-url",
  "renderUrl": "ghost-mannequin-result-url", 
  "metrics": {
    "processingTime": "4.2s",
    "stageTimings": {
      "backgroundRemoval": 2100,
      "analysis": 1500, 
      "rendering": 600
    }
  }
}
```

#### Error Response
```json
{
  "sessionId": "uuid-here",
  "status": "failed",
  "error": {
    "message": "Detailed error description",
    "code": "ERROR_CODE",
    "stage": "background_removal"
  }
}
```

## Pipeline Stages

### 1. 🎯 Background Removal (FAL.AI Bria 2.0)
- Removes backgrounds from flatlay product images
- Typical processing time: 1-3 seconds
- Returns clean RGBA image with transparent background

### 2. 🔬 Professional Garment Analysis (Gemini 2.5 Pro)
- **Label Detection**: Identifies and maps brand tags, size labels, care instructions
- **Detail Preservation**: Catalogs logos, stitching, hardware, textures
- **Construction Analysis**: Documents seams, structure, silhouette requirements
- **Spatial Mapping**: Provides normalized coordinates for all elements
- Typical processing time: 1-2 seconds

### 3. 🎨 Ghost Mannequin Generation (Gemini 2.5 Flash)
- Creates professional 3D ghost mannequin effect
- Uses analysis data to preserve critical brand elements
- Maintains spatial accuracy and material fidelity
- Professional photography quality output
- Typical processing time: 2-5 seconds

## API Testing

### Direct API Calls

You can also test the API directly using curl:

```bash
# Health check
curl http://localhost:3000/api/ghost?action=health

# Process with both images (recommended)
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    "onModel": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
    "options": {
      "outputSize": "2048x2048",
      "backgroundColor": "white"
    }
  }'

# Process with just detail source (Image B only)
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    "options": {
      "outputSize": "2048x2048",
      "backgroundColor": "white"
    }
  }'

# Process with base64 image
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASA...",
    "options": {
      "outputSize": "2048x2048"
    }
  }'
```

### Test Endpoints

- **GET /api/test**: View available test images and endpoints
- **GET /api/test?action=sample-request**: Get a ready-to-use sample request

## Troubleshooting

### Common Issues

**❌ "FAL_API_KEY not configured"**
- Check your `.env.local` file has the correct API key
- Restart the development server after adding keys

**❌ "Gemini API quota exceeded"**  
- Check your Google Cloud Console for quota limits
- Wait for quota reset or upgrade your plan

**❌ "Invalid image format"**
- Ensure images are JPEG, PNG, or WebP
- Check file size is under 10MB limit

**❌ "Stage timeout"**
- Increase timeout values in `.env.local`:
  ```
  TIMEOUT_BACKGROUND_REMOVAL=45000
  TIMEOUT_ANALYSIS=30000
  TIMEOUT_RENDERING=90000
  ```

### Debug Mode

Enable detailed logging by setting in `.env.local`:
```
LOG_LEVEL=debug
ENABLE_PIPELINE_LOGGING=true
ENABLE_REQUEST_LOGGING=true
```

## Expected Performance

- **Total Pipeline**: 4-8 seconds for typical garment images
- **Background Removal**: 1-3 seconds (depends on image complexity)
- **Analysis**: 1-2 seconds (Gemini Pro structured output)
- **Rendering**: 2-5 seconds (Gemini Flash generation)

## Quality Expectations

The enhanced pipeline produces:
- **Commercial-grade analysis** with spatial precision
- **Brand element preservation** at pixel-level accuracy
- **Professional photography quality** suitable for e-commerce
- **Comprehensive JSON data** for downstream processing
- **Session tracking** for full audit trails

Perfect for e-commerce, fashion brands, and professional product photography workflows.
