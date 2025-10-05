# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an **AI-powered Ghost Mannequin Pipeline** built with Next.js 14 and TypeScript that transforms flatlay product photos into professional ghost mannequin images. The system orchestrates multiple AI services in a four-stage pipeline:

1. **Background Removal** - FAL.AI Bria 2.0 removes backgrounds from flatlay images
2. **Garment Analysis** - Gemini 2.0 Flash Lite analyzes garment structure with structured JSON output
3. **Enrichment Analysis** - Gemini 2.0 Flash Lite performs focused analysis of rendering-critical attributes (colors, fabrics, construction details)
4. **Ghost Mannequin Generation** - Gemini 2.5 Flash Image or FAL Seedream creates the final ghost mannequin effect using consolidated analysis

## Architecture

### Core Components

- **API Route**: `app/api/ghost/route.ts` - Main HTTP API endpoint with comprehensive error handling
- **Pipeline Orchestrator**: `lib/ghost/pipeline.ts` - `GhostMannequinPipeline` class manages the entire workflow with state tracking and timeout handling
- **FAL.AI Integration**: `lib/ghost/fal.ts` - Background removal using Bria 2.0 model
- **Gemini Integration**: `lib/ghost/gemini.ts` - Structured analysis and image generation
- **Freepik Integration**: `lib/ghost/freepik.ts` - Ghost mannequin generation using Gemini 2.5 Flash
- **Type System**: `types/ghost.ts` - Comprehensive TypeScript definitions with Zod schemas

### Pipeline Flow

```typescript
GhostRequest → validateRequest() → executeStage('background_removal') 
→ executeStage('analysis') → executeStage('enrichment') → executeStage('rendering') → GhostResult
```

Each stage has configurable timeouts, error handling, and performance metrics tracking. The `GhostMannequinPipeline` class maintains state throughout processing and provides detailed logging.

### Key Architectural Patterns

- **Staged Processing**: Each pipeline stage is isolated with its own error handling and timeout management
- **Dual Analysis System**: Base analysis for garment structure + enrichment analysis for rendering fidelity
- **Structured Output**: Gemini Pro uses Zod schema validation for consistent JSON analysis output
- **Comprehensive Error Handling**: Custom `GhostPipelineError` class with stage-specific error codes
- **State Management**: Pipeline state tracking with session IDs and processing metrics
- **Batch Processing**: Built-in support for concurrent processing of multiple requests

## Development Commands

### Environment Setup
```bash
# Copy environment template and configure API keys
cp .env.example .env.local

# Install dependencies
npm install
```

### Development Workflow
```bash
# Start development server
npm run dev

# Type checking (run before committing)
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Start production server
npm start
```

### API Testing
```bash
# Health check
curl http://localhost:3000/api/ghost?action=health

# Test pipeline with base64 image
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{"flatlay": "data:image/jpeg;base64,...", "options": {"outputSize": "2048x2048"}}'

# Test with URL input
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{"flatlay": "https://example.com/image.jpg"}'
```

### Debugging and Development

- **Enable detailed logging**: Set `ENABLE_PIPELINE_LOGGING=true` and `LOG_LEVEL=debug` in `.env.local`
- **Mock APIs during development**: Use `MOCK_FAL_API=true` and `MOCK_GEMINI_API=true` to avoid API costs
- **Development endpoints**: Set `ENABLE_DEV_ENDPOINTS=true` for additional debugging routes

## Required Environment Variables

```bash
# Essential API keys
FAL_API_KEY=your_fal_api_key_here          # Get from https://fal.ai/dashboard
GEMINI_API_KEY=your_gemini_api_key_here    # Get from https://aistudio.google.com/app/apikey
FREEPIK_API_KEY=your_freepik_api_key_here  # Get from https://freepik.com/api

# Optional Supabase storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Pipeline timeouts (optional, defaults provided)
TIMEOUT_BACKGROUND_REMOVAL=30000  # 30 seconds
TIMEOUT_ANALYSIS=90000           # 90 seconds  
TIMEOUT_ENRICHMENT=60000         # 60 seconds
TIMEOUT_RENDERING=180000         # 180 seconds
```

## Key Files to Know

- **`types/ghost.ts`**: Complete type definitions including enrichment schemas, Zod validation, error classes, and processing constants
- **`lib/ghost/pipeline.ts`**: Main pipeline orchestration with four-stage processing including enrichment analysis
- **`lib/ghost/gemini.ts`**: Both base analysis and enrichment analysis functions with fallback handling
- **`app/api/ghost/route.ts`**: HTTP API endpoint with request validation and error mapping
- **`.env.example`**: Comprehensive environment configuration template with all available options

## Professional AI Prompts

The system uses production-grade prompts optimized for commercial quality:

### Garment Analysis Prompt
- **Expert-level instructions** for comprehensive garment analysis
- **Systematic search strategy** covering all garment areas (neck, chest, sleeves, hem, hardware)
- **Technical precision** requirements for spatial coordinates and OCR extraction
- **Priority-based classification** focusing on brand preservation and critical details

### Dynamic Ghost Mannequin Generation Prompts
- **AI-Powered Prompt Generation**: Gemini Pro 2.5 intelligently weaves FactsV3 data into Flash 2.5 template
- **Professional photography specifications** with detailed scene narrative
- **Garment-specific customization** using analyzed material properties, colors, and construction details
- **Multi-image composition authority** with reference image instructions
- **Analysis-driven requirements** dynamically generated from consolidated JSON data
- **Intelligent fallback system** with static templates when AI generation fails

## Pipeline Error Handling

The system uses a comprehensive error handling strategy:

- **Stage-specific errors**: Each pipeline stage has specific error codes (e.g., `BACKGROUND_REMOVAL_FAILED`, `ANALYSIS_FAILED`)
- **HTTP status mapping**: `GhostPipelineError` instances are mapped to appropriate HTTP status codes
- **Timeout management**: Each stage has configurable timeouts with graceful failure
- **API-specific errors**: Special handling for FAL.AI and Gemini API-specific issues (rate limits, quotas, content blocking)

## Working with the Codebase

### Adding New Pipeline Stages
1. Define new stage in `ProcessingStage` type in `types/ghost.ts`
2. Add stage result interface (extend existing pattern)
3. Implement stage logic in appropriate service file
4. Add stage execution to `GhostMannequinPipeline.process()` method
5. Update error handling and timeout configuration

### Extending Analysis Schema
- Modify `AnalysisJSONSchema` in `types/ghost.ts` using Zod
- Update prompts in `ANALYSIS_PROMPT` constant
- Consider backward compatibility for existing analysis data

### Adding New AI Services
- Create new service file in `lib/ghost/` following existing patterns
- Implement configuration, processing, and error handling functions
- Add service-specific error codes to `GhostPipelineError` handling
- Update health check functionality

### Performance Optimization
- Monitor stage timings in pipeline metrics
- Adjust timeout values based on actual processing times
- Consider implementing request queuing for high-volume usage
- Use batch processing functions for multiple images

## Deployment Considerations

- The project uses `output: 'standalone'` for Docker compatibility
- Large file support configured (50MB request limit for base64 images)
- CORS headers configured for cross-origin API access
- Security headers applied to all routes
- Console logs removed in production builds (except errors/warnings)

## Testing Pipeline Components

Each pipeline stage can be tested independently:

```typescript
// Test background removal
import { removeBackground } from '@/lib/ghost/fal';
const result = await removeBackground(imageUrl);

// Test garment analysis  
import { analyzeGarment, analyzeGarmentEnrichment } from '@/lib/ghost/gemini';
const analysis = await analyzeGarment(cleanedImageUrl, sessionId);
const enrichment = await analyzeGarmentEnrichment(cleanedImageUrl, enrichmentSessionId, analysis.meta.session_id);

// Test full pipeline
import { processGhostMannequin } from '@/lib/ghost/pipeline';
const result = await processGhostMannequin(request, options);
```

## Freepik Gemini 2.5 Flash Integration

### Overview
The pipeline supports Freepik's Gemini 2.5 Flash API ("Nano Banana") as the primary rendering engine for ghost mannequin generation. This integration provides:

- **High-quality ghost mannequin effects** with proper 3D garment structure
- **Multi-reference image support** (up to 3 images per request)
- **Production-ready outputs** despite "preview" naming
- **Cost-effective processing** for commercial applications

### Key Features
- **Reference Image Processing**: Uses cleaned FAL storage URLs directly (avoids 40MB+ payloads)
- **Structured Prompting**: Combines garment analysis data with explicit image reference instructions
- **Content Policy Compliance**: Automatic handling of appropriate reference images
- **Error Recovery**: Comprehensive error handling with detailed logging

### Usage
```typescript
import { generateImageWithFreepikGemini } from '@/lib/ghost/freepik';

const result = await generateImageWithFreepikGemini(
  controlBlockPrompt,  // Detailed prompt with garment specifications
  flatlayImageUrl,     // Cleaned flatlay image URL
  onModelImageUrl      // Optional on-model reference (must comply with content policies)
);
```

### Content Policy Considerations
**Important**: Freepik's content moderation system may reject on-model reference images that show human features, even in legitimate commercial contexts:

- ✅ **Acceptable**: Flatlay garments, ghost mannequin forms, fabric close-ups
- ⚠️ **May Fail**: Images showing hands, arms, or any human body parts
- ❌ **Will Fail**: Any images with faces, torso, or perceived inappropriate content

### Workarounds for Content Policy Issues
1. **Single Image Mode**: Use only flatlay images when on-model references are flagged
2. **Crop References**: Remove human features from on-model images before processing
3. **Alternative Models**: Fall back to FAL Seedream for sensitive content

### API Configuration
```bash
# Required in .env.local
FREEPIK_API_KEY=your_freepik_api_key_here

# Optional rendering model selection
DEFAULT_RENDERING_MODEL=freepik-gemini  # or 'seedream'
```

### Debugging Freepik Integration
```bash
# Test Freepik API directly
curl -X POST http://localhost:3000/api/test-freepik \
  -H "Content-Type: application/json" \
  -d '{"imageUrl1": "https://example.com/flatlay.jpg", "imageUrl2": "https://example.com/reference.jpg"}'

# Enable detailed Freepik logging
ENABLE_PIPELINE_LOGGING=true
LOG_LEVEL=debug
```

### Error Handling
The integration includes comprehensive error detection:

- **Content Policy Violations**: Tasks fail with `FAILED` status
- **API Rate Limits**: Automatic retry with exponential backoff
- **Image Accessibility**: Validation of FAL storage URL accessibility
- **Timeout Management**: Configurable timeouts for long-running tasks

### Performance Notes
- **Processing Time**: Typically 20-30 seconds per image
- **Payload Size**: ~2KB using URLs vs 40MB+ with base64
- **Rate Limits**: 5 requests per minute (check current limits in API headers)
- **Cost**: More affordable than Google Gemini for commercial use

## Dynamic Prompt Generation System

### Overview
The pipeline features an advanced **AI-powered prompt generation system** that uses Gemini Pro 2.5 to intelligently weave garment-specific analysis data into professional Flash 2.5 templates. This creates personalized, data-driven prompts for superior ghost mannequin generation.

### Key Innovation: Analysis-to-Prompt Integration
Instead of generic templates, every prompt is **dynamically customized** using:
- **Exact Color Values**: `#F3EFE0` instead of "cream colored"
- **Material Properties**: Specific fabric behavior with `drape_stiffness: 0.4`
- **Construction Details**: Required components like `fringe_trim, multi_pattern_print`
- **Surface Characteristics**: `matte`, `opaque`, `structured` based on analysis
- **Category Context**: `outerwear` vs `knitwear` handling differences
- **Safety Constraints**: Automatic content policy compliance

### Architecture
```typescript
// New prompt generation flow
FactsV3 + ControlBlock → Gemini Pro 2.5 → Personalized Flash 2.5 Prompt → AI Generation
```

### Core Components
- **`lib/ghost/prompt-generator.ts`**: Gemini Pro 2.5 powered dynamic prompt generation
- **Flash 2.5 Base Template**: Garment-agnostic professional template maintained at full detail level
- **Intelligent Integration**: Natural weaving of analysis data without forced mechanical insertion
- **Fallback System**: Static templates when AI generation fails

### Usage Examples

#### Dynamic Prompt Generation
```typescript
import { generateDynamicPrompt, configurePromptGenerator } from '@/lib/ghost/prompt-generator';

// Configure with Gemini API key
configurePromptGenerator(apiKey);

// Generate personalized prompt
const result = await generateDynamicPrompt(facts, controlBlock, sessionId);
console.log('Generated prompt length:', result.prompt.length);
console.log('Processing time:', result.processingTime, 'ms');
```

#### Pipeline Integration
```typescript
// Automatic integration in pipeline
const promptToUse = await buildDynamicFlashPrompt(
  consolidation.facts_v3, 
  consolidation.control_block, 
  this.state.sessionId
);
```

### Technical Specifications

#### Gemini Pro 2.5 Configuration
- **Model**: `gemini-2.5-pro`
- **Temperature**: `0.1` (low for consistent integration)
- **Top-K**: `1` (focused output)
- **Top-P**: `0.8` (balanced creativity)

#### Integration Requirements
1. **Color Integration**: Replace generic colors with exact hex values from `facts.palette`
2. **Material Specificity**: Use specific material details from `facts.material`
3. **Construction Details**: Integrate `required_components` and silhouette information
4. **Surface Properties**: Include `drape_stiffness`, `transparency`, `surface_sheen` values
5. **Pattern Information**: Weave in pattern details and scale information
6. **Category Context**: Apply category-specific handling and terminology
7. **Safety Constraints**: Include `safety.must_not` requirements naturally
8. **Quality Standards**: Integrate `qa_targets` for precision requirements

### Example Transformations

#### Before (Generic Template)
```
"Create a professional ghost mannequin photograph with realistic fabric draping."
```

#### After (Dynamic Integration)
```
"Create a professional ghost mannequin photograph of this outerwear with relaxed, 
boxy kimono-style silhouette, ensuring fringe_trim and multi_pattern_print are 
clearly visible. The unknown fabric should drape with stiffness level 0.4 showing 
balanced movement. Apply matte finish (#F3EFE0 dominant, #008AB8 accent colors) 
with opaque transparency..."
```

### Performance Characteristics
- **Generation Time**: 2-5 seconds typical
- **Prompt Quality**: Professional-grade, production-ready
- **Consistency**: Deterministic output for same input data
- **Fallback Speed**: <100ms for static template fallback
- **Integration Depth**: Complete FactsV3 data utilization

### Error Handling & Reliability

#### Graceful Fallback System
```typescript
try {
  // Attempt dynamic generation
  const dynamicPrompt = await generateDynamicPrompt(facts, control, sessionId);
  return dynamicPrompt.prompt;
} catch (error) {
  // Automatic fallback to static template
  console.warn('Dynamic prompt generation failed, using static fallback');
  return generateFallbackPrompt(facts, control);
}
```

#### Common Failure Scenarios
- **API Rate Limits**: Automatic static fallback
- **Content Filtering**: Sanitized prompt generation
- **Network Issues**: Local fallback processing
- **Invalid Analysis Data**: Schema validation with defaults

### Benefits Over Static Templates

1. **Precision**: Exact garment specifications instead of generic descriptions
2. **Consistency**: Every detail derived from actual image analysis
3. **Personalization**: Each prompt tailored to specific garment characteristics
4. **Professional Quality**: Maintains Flash 2.5 template detail level
5. **Scalability**: Handles any garment category with appropriate terminology
6. **Brand Accuracy**: Preserves critical design elements and colors

### Configuration Options

```bash
# Enable dynamic prompt generation (default: true)
ENABLE_DYNAMIC_PROMPTS=true

# Fallback to static prompts when dynamic fails (default: true)
ENABLE_PROMPT_FALLBACK=true

# Log prompt generation details (development)
LOG_PROMPT_GENERATION=true
```

### Debugging Dynamic Prompts

```bash
# Enable detailed prompt logging
ENABLE_PIPELINE_LOGGING=true
LOG_LEVEL=debug

# Test prompt generation directly
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{"flatlay": "https://example.com/garment.jpg", "options": {"enableLogging": true}}'
```

This dynamic prompt generation system represents a significant advancement in AI-driven e-commerce photography, ensuring each ghost mannequin generation is perfectly tailored to the specific garment being processed.
