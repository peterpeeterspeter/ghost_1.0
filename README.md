# Ghost Mannequin Pipeline v1.0

A production-ready AI pipeline for generating high-quality ghost mannequin product images with interior hollows and label preservation.

## 🎯 Overview

The Ghost Mannequin Pipeline uses advanced AI models to transform flat garment images into professional ghost mannequin product photos. It features a two-stage architecture with CCJ (Core Contract JSON) optimization for consistent, high-quality results.

## 🏗️ Architecture

### Stage 1: Analysis & Consolidation
```
Raw Image → Background Removal → Base Analysis → Enrichment Analysis → Consolidation → FactsV3 + ControlBlock
```

### Stage 2: CCJ Generation
```
FactsV3 + ControlBlock → CCJ Core Contract → CCJ Hints → Files API Upload → Gemini 2.5 Flash Image → Ghost Mannequin
```

## ✨ Key Features

- **Interior Hollows**: Shows neckline, cuffs, hems, and vents with subtle occlusion
- **Label Preservation**: Maintains brand labels and logos exactly as seen
- **Color Accuracy**: Precise color matching with hex color specifications
- **Construction Fidelity**: Preserves seams, stitching, trims, and closures
- **Files API Optimization**: 97% token reduction using Google Files API
- **Hard Locks**: Guarantees ghost effect, interior visibility, and label preservation
- **Batch Processing**: Supports batch operations with 100% success rate

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- API Keys: `GEMINI_API_KEY`, `FAL_API_KEY`

### Installation
```bash
cd packages/ghost-pipeline
npm install
```

### Environment Setup
Create `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
FAL_API_KEY=your_fal_api_key
```

### Run Single Test
```bash
npx tsx test-ccj-improved-v1-2.ts
```

### Run Batch Test
```bash
npx tsx test-ccj-batch-10.ts
```

## 📊 Performance

### Batch Test Results (10 runs)
- **Success Rate**: 100% (10/10)
- **Average Processing Time**: 16.3 seconds per image
- **Average Image Size**: 1.3MB
- **Token Optimization**: 0 input tokens (Files API)
- **Quality**: Consistent ghost mannequin with interior hollows

## 🔧 Technical Details

### CCJ Core Contract (10 fields)
```json
{
  "v": "gm-ccj-1.2",
  "category": "shirt",
  "silhouette": "classic-collar-long-sleeve",
  "colors_hex": ["#2E5BBA", "#FFFFFF"],
  "rules": {
    "bg": "#FFFFFF",
    "ghost": true,
    "show_interiors": true,
    "labels_lock": "keep_legible_exact"
  }
}
```

### CCJ Hints (~60 fields)
Rich steering data including:
- Color precision with hex values
- Material properties and fabric behavior
- Construction details and seam preservation
- Interior rendering specifications
- Label preservation rules
- QA targets and safety constraints

### Files API Integration
- Uploads images to Google Files API
- Returns `gs://` URIs for 0 token usage
- Fallback to base64 for reliability

### Model Configuration
```javascript
{
  model: "gemini-2.5-flash-image",
  generationConfig: {
    responseModalities: ["Image"],
    temperature: 0.05,
    imageConfig: { aspectRatio: "4:5" }
  }
}
```

## 📁 File Structure

```
packages/ghost-pipeline/
├── lib/ghost/
│   ├── ccj-improved.ts          # Core CCJ pipeline implementation
│   ├── consolidation.ts         # Analysis consolidation logic
│   ├── files-manager.ts         # Files API management
│   ├── fal.ts                   # FAL.AI integration
│   └── gemini.ts                # Gemini API integration
├── test-ccj-improved-v1-2.ts    # Main test script
├── test-ccj-batch-10.ts         # Batch testing script
├── CCJ_IMPROVEMENTS.md          # Detailed improvements documentation
└── README.md                    # This file
```

## 🎨 Output Quality

### Ghost Mannequin Features
- ✅ Interior hollows (neckline, cuffs, hem)
- ✅ Brand label preservation (exact text and placement)
- ✅ Color accuracy (hex color matching)
- ✅ Construction fidelity (seams, stitching, closures)
- ✅ Pure white background (#FFFFFF)
- ✅ 3D volume with proper ghost effect

### Technical Specifications
- **Resolution**: 2000px+ minimum
- **Format**: PNG with alpha channel
- **Aspect Ratio**: 4:5
- **Storage**: FAL storage with permanent URLs
- **Fallback**: Base64 encoding if Files API fails

## 🔄 Pipeline Flow

1. **Input Processing**: Raw image → background removal
2. **Analysis**: Base analysis + enrichment analysis
3. **Consolidation**: Merge into FactsV3 + ControlBlock
4. **CCJ Generation**: Build Core Contract + Hints
5. **Files API Upload**: Optimize token usage
6. **Image Generation**: Gemini 2.5 Flash Image
7. **Storage**: Upload to FAL storage
8. **Output**: Ghost mannequin image with metadata

## 🛠️ Customization

### Adding New Garment Types
1. Update facts in test scripts
2. Adjust CCJ Core Contract fields
3. Modify CCJ Hints for specific requirements
4. Test with batch processing

### Modifying Render Instructions
Edit `RENDER_INSTRUCTION_GHOST` in `ccj-improved.ts`:
```javascript
export const RENDER_INSTRUCTION_GHOST = `
TASK: Lift the flatlay garment into a 3-D ghost-mannequin product image.
// ... customize instructions
`;
```

## 🐛 Troubleshooting

### Common Issues
1. **API Key Errors**: Ensure `GEMINI_API_KEY` and `FAL_API_KEY` are set
2. **Files API Failures**: Check network connectivity and API quotas
3. **Image Quality Issues**: Adjust temperature and QA parameters
4. **Processing Timeouts**: Increase timeout values for large images

### Debug Mode
Enable detailed logging by setting environment variables:
```env
DEBUG=ghost-pipeline:*
LOG_LEVEL=debug
```

## 📈 Future Enhancements

- [ ] Support for additional garment types
- [ ] Advanced QA validation
- [ ] Batch processing optimization
- [ ] Custom aspect ratios
- [ ] Multi-angle generation
- [ ] Integration with e-commerce platforms

## 📄 License

Private repository - All rights reserved.

## 🤝 Contributing

This is a private project. For access or contributions, contact the repository owner.

---

**Ghost Mannequin Pipeline v1.0** - Production-ready AI image generation with interior hollows and label preservation.