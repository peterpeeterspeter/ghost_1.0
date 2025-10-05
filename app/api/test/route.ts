import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test - Provide test image URLs for pipeline testing
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'sample-request') {
    // Return a sample request that can be used to test the pipeline
    const sampleRequest = {
      flatlay: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&crop=center",  // Image B - Detail Source
      onModel: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop&crop=center", // Image A - On-Model Reference
      options: {
        outputSize: "2048x2048",
        backgroundColor: "white"
      }
    };

    return NextResponse.json({
      message: "Sample request for testing the ghost mannequin pipeline",
      sample: sampleRequest,
      instructions: "You can POST this data to /api/ghost to test the pipeline",
      curl: `curl -X POST http://localhost:3000/api/ghost -H "Content-Type: application/json" -d '${JSON.stringify(sampleRequest)}'`
    });
  }

  // Default test information
  return NextResponse.json({
    message: "Ghost Mannequin Pipeline Test Endpoint",
    endpoints: {
      "GET /api/test?action=sample-request": "Get a sample request for testing",
    },
    imageRoles: {
      "Image A - On-Model Reference (Optional)": "For understanding proportions and spatial relationships",
      "Image B - Detail Source (Required)": "Primary visual reference with absolute truth for colors, patterns, textures"
    },
    testImages: {
      "imageA_samples": [
        {
          name: "On-Model T-Shirt Reference",
          url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop&crop=center",
          description: "Person wearing a shirt - for proportions"
        }
      ],
      "imageB_samples": [
        {
          name: "Detail Source T-Shirt",
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&crop=center",
          description: "Flat-lay detail shot - primary source"
        }
      ]
    },
    usage: "The pipeline works with two images: Image A (on-model reference) and Image B (detail source)"
  });
}
