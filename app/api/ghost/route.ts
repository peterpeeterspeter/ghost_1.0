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
 * POST /api/ghost - Process ghost mannequin request
 * 
 * Expected request body (Two-Image Workflow):
 * {
 *   "flatlay": "base64 or URL of Detail Source (Image B) - REQUIRED",
 *   "onModel": "base64 or URL of On-Model Reference (Image A) - OPTIONAL",
 *   "options": {
 *     "preserveLabels": true,
 *     "outputSize": "2048x2048",
 *     "backgroundColor": "white"
 *   }
 * }
 * 
 * Image Roles:
 * - flatlay (Image B): Detail source with absolute truth for colors, patterns, textures, construction details
 * - onModel (Image A): On-model reference for understanding proportions and spatial relationships
 */
export async function POST(request: NextRequest) {
  console.log('Received ghost mannequin processing request');

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
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
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

    // Validate environment variables
    const falApiKey = process.env.FAL_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!falApiKey) {
      console.error('FAL_API_KEY environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Server configuration error: FAL API key not configured',
          code: 'MISSING_FAL_API_KEY'
        },
        { status: 500 }
      );
    }

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Server configuration error: Gemini API key not configured',
          code: 'MISSING_GEMINI_API_KEY'
        },
        { status: 500 }
      );
    }

    // Construct ghost request
    const ghostRequest: GhostRequest = {
      flatlay: body.flatlay,
      onModel: body.onModel,
      options: {
        preserveLabels: body.options?.preserveLabels ?? true,
        outputSize: body.options?.outputSize ?? '2048x2048',
        backgroundColor: body.options?.backgroundColor ?? 'white',
        useStructuredPrompt: body.options?.useStructuredPrompt ?? false,
        useExpertPrompt: body.options?.useExpertPrompt ?? false,
      },
    };

    // Prepare pipeline options
    const pipelineOptions = {
      falApiKey,
      geminiApiKey,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      enableLogging: process.env.NODE_ENV === 'development',
      renderingModel: (body.options?.renderingModel as 'freepik-gemini' | 'gemini-flash' | 'seedream' | 'ai-studio') || 
                     (process.env.RENDERING_MODEL as 'freepik-gemini' | 'gemini-flash' | 'seedream' | 'ai-studio') || 
                     'ai-studio', // Default to AI Studio!
      timeouts: {
        backgroundRemoval: parseInt(process.env.TIMEOUT_BACKGROUND_REMOVAL || '30000'),
        analysis: parseInt(process.env.TIMEOUT_ANALYSIS || '90000'),
        enrichment: parseInt(process.env.TIMEOUT_ENRICHMENT || '120000'),
        consolidation: parseInt(process.env.TIMEOUT_CONSOLIDATION || '45000'),
        rendering: parseInt(process.env.TIMEOUT_RENDERING || '180000'),
        qa: parseInt(process.env.TIMEOUT_QA || '60000'),
      },
      enableQaLoop: process.env.ENABLE_QA_LOOP !== 'false',
      maxQaIterations: parseInt(process.env.MAX_QA_ITERATIONS || '2'),
    };

    console.log('Starting ghost mannequin pipeline processing...');
    console.log(`🎯 DEBUG: Using renderingModel: ${pipelineOptions.renderingModel}`);
    console.log(`📋 DEBUG: Request renderingModel: ${body.options?.renderingModel || 'not specified'}`);
    console.log(`🌍 DEBUG: ENV RENDERING_MODEL: ${process.env.RENDERING_MODEL || 'not set'}`);

    // Process the request
    const result: GhostResult = await processGhostMannequin(ghostRequest, pipelineOptions);

    // Determine HTTP status based on result
    const statusCode = result.status === 'completed' ? 200 : 
                      result.status === 'processing' ? 202 : 500;

    // Log result
    if (result.status === 'completed') {
      console.log(`Ghost mannequin processing completed successfully in ${result.metrics.processingTime}`);
    } else {
      console.error('Ghost mannequin processing failed:', result.error);
    }

    return NextResponse.json(result, { status: statusCode });

  } catch (error) {
    console.error('Unexpected error in ghost mannequin API:', error);

    // Handle known pipeline errors
    if (error instanceof GhostPipelineError) {
      const statusCode = getHttpStatusFromError(error);
      return NextResponse.json(
        {
          sessionId: 'unknown',
          status: 'failed',
          error: {
            message: error.message,
            code: error.code,
            stage: error.stage,
          },
          metrics: {
            processingTime: '0s',
            stageTimings: {
              backgroundRemoval: 0,
              analysis: 0,
              enrichment: 0,
              consolidation: 0,
              rendering: 0,
            },
          },
        } as GhostResult,
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ghost - Health check and API information
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {
    // Health check endpoint
    if (action === 'health') {
      const falApiKey = process.env.FAL_API_KEY;
      const geminiApiKey = process.env.GEMINI_API_KEY;
      const freepikApiKey = process.env.FREEPIK_API_KEY_DISABLED;
      const renderingModel = process.env.RENDERING_MODEL || 'freepik-gemini';

      const errors: string[] = [];
      
      // Check required API keys
      if (!falApiKey) errors.push('FAL_API_KEY not configured');
      if (!geminiApiKey) errors.push('GEMINI_API_KEY not configured');
      if (renderingModel === 'freepik-gemini' && !freepikApiKey) {
        errors.push('FREEPIK_API_KEY_DISABLED not configured for freepik-gemini model');
      }

      const services = {
        fal: !!falApiKey,
        gemini: !!geminiApiKey,
        freepik: renderingModel === 'freepik-gemini' ? !!freepikApiKey : true,
        supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      };

      // Only require essential services (supabase is optional)
      const essentialServices = { fal: services.fal, gemini: services.gemini, freepik: services.freepik };
      const healthy = Object.values(essentialServices).every(Boolean) && errors.length === 0;

      if (!healthy) {
        return NextResponse.json(
          {
            healthy: false,
            services,
            errors,
            renderingModel,
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }

      // All services healthy
      return NextResponse.json({
        healthy: true,
        services,
        errors: [],
        renderingModel,
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      });
    }

    // Default API information
    return NextResponse.json({
      name: 'Ghost Mannequin Pipeline API',
      version: '0.1.0',
      description: 'AI-powered ghost mannequin generation from flatlay images',
      endpoints: {
        'POST /api/ghost': 'Process ghost mannequin request',
        'GET /api/ghost?action=health': 'Health check',
      },
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: '10MB',
      stages: [
        'background_removal - FAL.AI Bria 2.0',
        'analysis - Gemini 2.5 Pro with structured output',
        'rendering - Gemini 2.5 Flash (placeholder for image generation)',
      ],
    });

  } catch (error) {
    console.error('Error in GET /api/ghost:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/ghost - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Convert pipeline error to appropriate HTTP status code
 */
function getHttpStatusFromError(error: GhostPipelineError): number {
  switch (error.code) {
    case 'MISSING_FLATLAY':
    case 'MISSING_IMAGE_URL':
    case 'INVALID_IMAGE_FORMAT':
      return 400;
    
    case 'CLIENT_NOT_CONFIGURED':
    case 'MISSING_FAL_API_KEY':
    case 'MISSING_GEMINI_API_KEY':
      return 500;
    
    case 'RATE_LIMIT_EXCEEDED':
    case 'GEMINI_QUOTA_EXCEEDED':
      return 429;
    
    case 'INSUFFICIENT_CREDITS':
      return 402;
    
    case 'CONTENT_BLOCKED':
      return 422;
    
    case 'STAGE_TIMEOUT':
      return 408;
    
    case 'IMAGE_FETCH_FAILED':
      return 502;
    
    default:
      return 500;
  }
}

/**
 * Validate request size and content type
 */
function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  const maxSize = 50 * 1024 * 1024; // 50MB for base64 images

  if (contentLength && parseInt(contentLength) > maxSize) {
    return {
      valid: false,
      error: `Request too large. Maximum size is ${maxSize / 1024 / 1024}MB`
    };
  }

  const contentType = request.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    return {
      valid: false,
      error: 'Content-Type must be application/json'
    };
  }

  return { valid: true };
}
