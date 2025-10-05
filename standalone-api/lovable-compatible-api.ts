/**
 * Ghost Mannequin API - Lovable-Compatible Version
 * Enhanced CORS and external domain support
 */

import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.204.0/crypto/mod.ts";

const PORT = Deno.env.get("PORT") || "8000";

// Load API keys
const FAL_API_KEY = Deno.env.get("FAL_API_KEY") || "DEMO_FAL_KEY";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "DEMO_GEMINI_KEY"; 
const FREEPIK_API_KEY = Deno.env.get("FREEPIK_API_KEY") || "DEMO_FREEPIK_KEY";

// =============================================================================
// TYPES
// =============================================================================

interface GhostRequest {
  flatlay: string;
  onModel?: string;
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

// =============================================================================
// ENHANCED CORS HEADERS
// =============================================================================

function getCorsHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

function validateGhostRequest(body: any): { valid: boolean; error?: string } {
  console.log("🔍 Validating request:", JSON.stringify(body, null, 2));
  
  if (!body) {
    return { valid: false, error: "Request body is required" };
  }
  
  if (typeof body !== 'object') {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  
  // Accept both 'flatlay' and 'garment_url' field names for compatibility
  const imageUrl = body.flatlay || body.garment_url;
  if (!imageUrl) {
    return { valid: false, error: "Missing required field 'flatlay' or 'garment_url'" };
  }
  
  if (typeof imageUrl !== 'string') {
    return { valid: false, error: "Image field must be a string (URL or base64)" };
  }
  
  console.log("✅ Request validation passed");
  return { valid: true };
}

// =============================================================================
// MOCK PROCESSING
// =============================================================================

async function processGhostMannequin(request: any): Promise<GhostResult> {
  const sessionId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Handle both field name formats
  const imageUrl = request.flatlay || request.garment_url;
  
  console.log(`🚀 Processing ghost mannequin request [${sessionId}]`);
  console.log(`📷 Image URL: ${imageUrl.substring(0, 100)}...`);
  console.log(`👤 OnModel: ${request.onModel ? 'Provided' : 'None'}`);
  console.log(`⚙️ Options:`, request.options);
  
  try {
    // Simulate processing stages with realistic delays
    console.log("🗂️  Stage 1: Background removal...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log("🔍 Stage 2: Garment analysis...");
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    console.log("✨ Stage 3: Enrichment analysis...");
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log("🔗 Stage 4: Data consolidation...");
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log("🎭 Stage 5: Ghost mannequin rendering...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Processing completed in ${totalTime}ms`);
    
    return {
      sessionId,
      status: 'completed',
      cleanedImageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&bg=removed",
      renderUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop&ghost=true",
      analysis: {
        garment_type: "shirt",
        colors: ["white", "blue", "navy"],
        features: ["button-up", "collar", "cuffs"],
        labels_found: [
          { text: "PREMIUM QUALITY", confidence: 0.92, location: { x: 0.2, y: 0.8 } }
        ],
        preserve_details: [
          { type: "logo", priority: "high", location: { x: 0.15, y: 0.75 } },
          { type: "stitching", priority: "medium", description: "contrast stitching" }
        ],
        construction_details: [
          { type: "seam", location: "shoulder", technique: "flat-fell" },
          { type: "closure", style: "button", count: 7 }
        ]
      },
      enrichment: {
        fabric: "cotton blend",
        texture: "smooth twill",
        transparency: 0.1,
        drape_stiffness: 0.6,
        surface_sheen: "matte"
      },
      consolidation: {
        facts_v3: {
          garment_type: "button-up shirt",
          primary_colors: ["#FFFFFF", "#1E3A8A", "#374151"],
          fabric_type: "cotton blend",
          key_features: ["contrast buttons", "chest pocket", "tailored fit"]
        },
        control_block: {
          safety: {
            must_not: ["visible mannequin parts", "human features"],
            content_policy: "commercial_safe"
          },
          quality_targets: {
            edge_sharpness: 0.9,
            color_accuracy: 0.95,
            detail_preservation: 0.9
          }
        }
      },
      metrics: {
        processingTime: `${totalTime}ms`,
        stageTimings: {
          backgroundRemoval: 800,
          analysis: 1200,
          enrichment: 600,
          consolidation: 400,
          rendering: 1500
        }
      }
    };
  } catch (error) {
    console.error("❌ Processing failed:", error);
    
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
        message: error instanceof Error ? error.message : 'Processing failed',
        code: 'PROCESSING_ERROR',
        stage: 'unknown'
      }
    };
  }
}

// =============================================================================
// HTTP HANDLER
// =============================================================================

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  console.log(`📥 ${method} ${path} from ${request.headers.get('origin') || 'unknown'}`);
  
  // Enhanced CORS headers
  const headers = new Headers(getCorsHeaders());
  
  // Handle preflight OPTIONS requests
  if (method === "OPTIONS") {
    console.log("✅ CORS preflight handled");
    return new Response(null, { status: 204, headers });
  }
  
  // Health check endpoint
  if (path === "/health" && method === "GET") {
    const healthData = {
      status: "ok",
      version: "2.0.0-lovable",
      timestamp: new Date().toISOString(),
      apiKeys: {
        fal: FAL_API_KEY !== "DEMO_FAL_KEY" ? "configured" : "demo",
        gemini: GEMINI_API_KEY !== "DEMO_GEMINI_KEY" ? "configured" : "demo", 
        freepik: FREEPIK_API_KEY !== "DEMO_FREEPIK_KEY" ? "configured" : "demo"
      },
      cors: "enabled",
      endpoints: {
        health: "GET /health",
        process: "POST /process-ghost"
      }
    };
    
    console.log("✅ Health check successful");
    return new Response(JSON.stringify(healthData, null, 2), { headers });
  }
  
  // Process ghost mannequin endpoint
  if (path === "/process-ghost" && method === "POST") {
    try {
      let requestBody;
      
      // Parse JSON body
      try {
        const bodyText = await request.text();
        console.log("📝 Raw request body:", bodyText.substring(0, 200) + "...");
        requestBody = JSON.parse(bodyText);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Invalid JSON in request body",
              code: "INVALID_JSON",
              stage: "validation"
            }
          }),
          { status: 400, headers }
        );
      }
      
      // Validate request
      const validation = validateGhostRequest(requestBody);
      if (!validation.valid) {
        console.error("❌ Validation failed:", validation.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: validation.error,
              code: "VALIDATION_ERROR", 
              stage: "validation"
            }
          }),
          { status: 400, headers }
        );
      }
      
      // Process the request
      const result = await processGhostMannequin(requestBody);
      
      console.log("✅ Request processed successfully");
      return new Response(JSON.stringify(result), { headers });
      
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: error instanceof Error ? error.message : "Internal server error",
            code: "INTERNAL_ERROR",
            stage: "processing"
          }
        }),
        { status: 500, headers }
      );
    }
  }
  
  // 404 for unknown endpoints
  console.log(`❌ Unknown endpoint: ${method} ${path}`);
  return new Response(
    JSON.stringify({ 
      success: false,
      error: {
        message: "Endpoint not found",
        code: "NOT_FOUND",
        available_endpoints: [
          "GET /health",
          "POST /process-ghost"
        ]
      }
    }),
    { status: 404, headers }
  );
}

// =============================================================================
// SERVER STARTUP
// =============================================================================

console.log(`🚀 Ghost Mannequin API (Lovable-Compatible) starting...`);
console.log(`📍 Port: ${PORT}`);
console.log(`🌐 CORS: Enabled for all origins`);
console.log(`📋 Endpoints:`);
console.log(`   - GET  http://localhost:${PORT}/health`);
console.log(`   - POST http://localhost:${PORT}/process-ghost`);
console.log(`🔑 API Keys: ${FAL_API_KEY !== "DEMO_FAL_KEY" ? "Real" : "Demo"} mode`);
console.log(`⚡ Server ready for Lovable frontend integration!`);

await serve(handleRequest, { port: parseInt(PORT) });