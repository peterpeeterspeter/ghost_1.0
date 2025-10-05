/**
 * Ghost Mannequin API - Standalone Server
 * Fixed version with updated Deno dependencies
 */

// Import Deno standard library modules (latest versions)
import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.204.0/crypto/mod.ts";

// Set default port
const PORT = Deno.env.get("PORT") || "8000";

// Load API keys from environment or use placeholders
const FAL_API_KEY = Deno.env.get("FAL_API_KEY") || "YOUR_FAL_API_KEY";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "YOUR_GEMINI_API_KEY";
const FREEPIK_API_KEY = Deno.env.get("FREEPIK_API_KEY") || "YOUR_FREEPIK_API_KEY";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface GhostRequest {
  flatlay: string; // base64 or URL
  onModel?: string; // base64 or URL (optional)
  options?: {
    preserveLabels?: boolean;
    outputSize?: '1024x1024' | '2048x2048';
    backgroundColor?: 'white' | 'transparent';
    useStructuredPrompt?: boolean;
    useExpertPrompt?: boolean;
    renderingModel?: 'freepik-gemini' | 'seedream';
  };
}

interface GhostResult {
  sessionId: string;
  status: 'completed' | 'failed' | 'processing';
  cleanedImageUrl?: string;
  cleanedOnModelUrl?: string;
  renderUrl?: string;
  analysis?: any;
  enrichment?: any;
  consolidation?: any;
  metrics: {
    processingTime: string;
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

type ProcessingStage = 'background_removal' | 'analysis' | 'enrichment' | 'consolidation' | 'rendering';

// =============================================================================
// ERROR HANDLING
// =============================================================================

class GhostPipelineError extends Error {
  public readonly code: string;
  public readonly stage: ProcessingStage;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    stage: ProcessingStage,
    originalError?: Error
  ) {
    super(message);
    this.name = 'GhostPipelineError';
    this.code = code;
    this.stage = stage;
    this.originalError = originalError;
  }
}

// =============================================================================
// MOCK PIPELINE IMPLEMENTATION
// =============================================================================

async function mockProcessRequest(request: GhostRequest): Promise<GhostResult> {
  const sessionId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`🚀 Processing ghost mannequin request [${sessionId}]`);
  
  try {
    // Simulate processing stages with delays
    await new Promise(resolve => setTimeout(resolve, 500)); // background removal
    await new Promise(resolve => setTimeout(resolve, 800)); // analysis
    await new Promise(resolve => setTimeout(resolve, 600)); // enrichment
    await new Promise(resolve => setTimeout(resolve, 300)); // consolidation
    await new Promise(resolve => setTimeout(resolve, 1200)); // rendering
    
    const totalTime = Date.now() - startTime;
    
    return {
      sessionId,
      status: 'completed',
      cleanedImageUrl: "https://storage.googleapis.com/ghost-mannequin-demo/cleaned_demo.png",
      renderUrl: "https://storage.googleapis.com/ghost-mannequin-demo/ghost_result.png",
      analysis: {
        garment_type: "shirt",
        colors: ["white", "blue"],
        features: ["button-up", "collar"]
      },
      enrichment: {
        fabric: "cotton",
        texture: "smooth",
        transparency: 0.2
      },
      consolidation: {
        // Simplified consolidation data
        facts_v3: {
          garment_type: "shirt",
          colors: ["white", "blue"],
          fabric: "cotton"
        }
      },
      metrics: {
        processingTime: `${totalTime}ms`,
        stageTimings: {
          backgroundRemoval: 500,
          analysis: 800,
          enrichment: 600, 
          consolidation: 300,
          rendering: 1200
        }
      }
    };
  } catch (error) {
    return {
      sessionId,
      status: 'failed',
      metrics: {
        processingTime: `${Date.now() - startTime}ms`,
        stageTimings: {
          backgroundRemoval: 0,
          analysis: 0,
          enrichment: 0,
          consolidation: 0,
          rendering: 0
        }
      },
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof GhostPipelineError ? error.code : 'UNKNOWN_ERROR',
        stage: error instanceof GhostPipelineError ? error.stage : 'unknown'
      }
    };
  }
}

// =============================================================================
// HTTP SERVER
// =============================================================================

async function handleRequest(request: Request): Promise<Response> {
  // Add CORS headers
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  
  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  
  // Health check endpoint
  if (request.url.endsWith("/health")) {
    return new Response(
      JSON.stringify({ 
        status: "ok", 
        apiKeys: {
          fal: FAL_API_KEY ? "configured" : "missing",
          gemini: GEMINI_API_KEY ? "configured" : "missing",
          freepik: FREEPIK_API_KEY ? "configured" : "missing"
        },
        version: "1.0.0",
        timestamp: new Date().toISOString()
      }), 
      { headers }
    );
  }
  
  // Process ghost mannequin request
  if (request.url.endsWith("/process-ghost") && request.method === "POST") {
    try {
      const requestData = await request.json() as GhostRequest;
      
      // Validate request
      if (!requestData.flatlay) {
        return new Response(
          JSON.stringify({ 
            error: "Missing required 'flatlay' field",
            status: "failed"
          }),
          { status: 400, headers }
        );
      }
      
      // Process the request (mock implementation for now)
      const result = await mockProcessRequest(requestData);
      
      return new Response(JSON.stringify(result), { headers });
      
    } catch (error) {
      console.error("Error processing request:", error);
      
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to process request",
          status: "failed",
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers }
      );
    }
  }
  
  // Not found
  return new Response(
    JSON.stringify({ error: "Not found", status: "failed" }),
    { status: 404, headers }
  );
}

// Start the server
console.log(`🚀 Ghost Mannequin API server starting on port ${PORT}...`);
console.log(`📍 Health check: http://localhost:${PORT}/health`);
console.log(`📍 Process endpoint: http://localhost:${PORT}/process-ghost`);

serve(handleRequest, { port: parseInt(PORT) });