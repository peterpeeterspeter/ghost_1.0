import { NextRequest, NextResponse } from 'next/server';
import { GhostRequest, GhostResult, GhostPipelineError } from '@/types/ghost';
import { processGhostMannequin } from '@/lib/ghost/pipeline';

// Configure API route options for large file uploads
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Body size limit - allow up to 50MB for base64 images
const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/flatlay - Process enhanced flatlay request
 * 
 * Expected request body:
 * {
 *   "flatlay": "base64 or URL of source flatlay image - REQUIRED",
 *   "options": {
 *     "preserveLabels": true,
 *     "outputSize": "2048x2048",
 *     "backgroundColor": "white"
 *   }
 * }
 * 
 * This endpoint uses the same analysis pipeline as ghost mannequin but generates
 * an enhanced flatlay image instead of a 3D ghost mannequin effect.
 */
export async function POST(request: NextRequest) {
  console.log('Received flatlay enhancement processing request');

  try {
    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        {
          error: `Request too large. Maximum size is ${MAX_BODY_SIZE / 1024 / 1024}MB`,
          code: 'REQUEST_TOO_LARGE'
        },
        { status: 413 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.flatlay) {
      return NextResponse.json(
        {
          error: 'Missing required field: flatlay',
          code: 'MISSING_FLATLAY'
        },
        { status: 400 }
      );
    }

    // Validate API keys from environment
    const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!falApiKey || !geminiApiKey) {
      console.error('Missing required API keys');
      return NextResponse.json(
        {
          error: 'Server configuration error: Missing API keys',
          code: 'MISSING_API_KEYS'
        },
        { status: 500 }
      );
    }

    // Construct pipeline request with outputType set to 'flatlay'
    const pipelineRequest: GhostRequest = {
      flatlay: body.flatlay,
      onModel: body.onModel, // Optional on-model reference
      options: {
        preserveLabels: body.options?.preserveLabels ?? true,
        outputSize: body.options?.outputSize ?? '2048x2048',
        backgroundColor: body.options?.backgroundColor ?? 'white',
        useStructuredPrompt: body.options?.useStructuredPrompt,
        useExpertPrompt: body.options?.useExpertPrompt,
      }
    };

    console.log('Processing flatlay with pipeline...');
    console.log('Options:', {
      preserveLabels: pipelineRequest.options?.preserveLabels,
      outputSize: pipelineRequest.options?.outputSize,
      backgroundColor: pipelineRequest.options?.backgroundColor,
    });

    // Process with pipeline using flatlay output type
    const result = await processGhostMannequin(pipelineRequest, {
      falApiKey,
      geminiApiKey,
      renderingModel: 'ai-studio', // Use AI Studio for flatlay generation
      outputType: 'flatlay', // NEW: Specify flatlay output
      enableLogging: true,
    });

    console.log('Flatlay processing completed successfully');
    console.log('Session ID:', result.sessionId);
    console.log('Processing time:', result.metrics.processingTime);

    // Return successful result
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Flatlay processing error:', error);

    // Handle pipeline-specific errors
    if (error.code) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        {
          error: error.message || 'Processing failed',
          code: error.code,
          stage: error.stage,
          details: error.details
        },
        { status: statusCode }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(code: string): number {
  const errorStatusMap: Record<string, number> = {
    'INVALID_IMAGE': 400,
    'MISSING_FLATLAY': 400,
    'BACKGROUND_REMOVAL_FAILED': 500,
    'ANALYSIS_FAILED': 500,
    'ENRICHMENT_FAILED': 500,
    'CONSOLIDATION_FAILED': 500,
    'RENDERING_FAILED': 500,
    'QA_FAILED': 500,
    'TIMEOUT': 504,
    'API_ERROR': 502,
    'RATE_LIMIT': 429,
  };

  return errorStatusMap[code] || 500;
}

/**
 * GET /api/flatlay - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'flatlay',
    description: 'Enhanced flatlay image generation using AI analysis',
    version: '1.0.0'
  });
}
