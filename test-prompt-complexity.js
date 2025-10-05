#!/usr/bin/env node

const FREEPIK_API_BASE = 'https://api.freepik.com/v1';
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY || 'FPSX7b918c5529743638f5fda53a36034567';

async function testPromptComplexity() {
  const imageUrl = "https://v3b.fal.media/files/b/penguin/jqx3AyluFnEtdIS2jjKCj.jpg";

  // Test different prompt complexities
  const tests = [
    {
      name: "Simple (90 chars)",
      prompt: "Transform this garment into a 3D ghost mannequin effect while preserving all details."
    },
    {
      name: "Medium (500 chars)", 
      prompt: "Create a professional studio photograph showing this garment transformed from its flat layout into a dimensional form against a pristine white background. The garment should appear as if worn by an invisible person, displaying natural drape and structure while preserving all original colors, patterns, and design elements with perfect accuracy. Show the garment floating naturally with soft, even studio lighting that illuminates the texture without harsh shadows."
    },
    {
      name: "Complex (1000 chars)",
      prompt: "Create a professional studio photograph capturing the essence of this striking garment, transformed from its flat layout into a dimensional display form against a pristine, pure white background. The subject should be presented as if worn by a transparent, invisible form, creating natural volume and a realistic silhouette that showcases the garment's structure and flow while maintaining absolute fidelity to the original design details, colors, and patterns. Pay close attention to the specific construction details including any visible seams, stitching, hardware, and trim elements. The dimensional effect should show the garment floating naturally, with soft, even studio lighting illuminating its texture and construction without creating any harsh shadows. The final image must look like a high-end product photograph suitable for e-commerce, perfectly conveying the garment's true shape and proportions as it would appear when worn, but with only the dimensional garment form visible."
    },
    {
      name: "Very Complex (2000+ chars) - Similar to our dynamic prompts",
      prompt: "Create a professional studio photograph capturing the essence of a striking outerwear piece, transformed from its flat layout into a dimensional display form against a pristine, pure white background. The subject is a beautiful kimono-style jacket, presented as if worn by a transparent, invisible form. This technique should create natural volume and a realistic silhouette, showcasing the garment's structure and flow while maintaining absolute fidelity to the original design details, colors, and patterns from the reference images. The jacket features a relaxed, open-front silhouette with wide, flowing sleeves, designed without any closures for an effortless drape. Its visual identity is defined by a captivating, medium-scale block print pattern that covers the entire garment. The dominant color is a vibrant cerulean blue, which serves as a rich canvas for intricate patterns accented with a lovely dusty rose and crisp white. The fabric itself has a soft, matte finish, giving it a sophisticated and tactile appearance. Pay close attention to the specific construction details. A delicate, crisp white fringe trim elegantly lines the entire front opening and collar, adding a subtle, three-dimensional texture and a sense of movement. The wide sleeves are completed with distinct, patterned cuffs, ensuring the design's continuity. The material has a gentle structure, allowing it to hang with a graceful drape that suggests both comfort and quality. The dimensional effect should show the jacket floating naturally, with the soft, even studio lighting illuminating its texture and the clean, bound edges of its construction without creating any harsh shadows. The final image must look like a high-end product photograph suitable for e-commerce, perfectly conveying the jacket's true shape and proportions as it would appear when worn, but with only the dimensional garment form visible. Most importantly: Transform the flat reference image into this three-dimensional presentation while preserving every original color, pattern, and design element with perfect accuracy."
    }
  ];

  for (const test of tests) {
    console.log(`\n🧪 Testing ${test.name}...`);
    console.log(`📏 Prompt length: ${test.prompt.length} characters`);
    
    try {
      const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-freepik-api-key': FREEPIK_API_KEY,
        },
        body: JSON.stringify({
          prompt: test.prompt,
          reference_images: [imageUrl]
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Task created: ${result.data.task_id}`);
        
        // Quick poll to see immediate result
        await new Promise(resolve => setTimeout(resolve, 8000)); // 8 seconds
        
        const statusResponse = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview/${result.data.task_id}`, {
          headers: { 'x-freepik-api-key': FREEPIK_API_KEY },
        });
        
        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          console.log(`📋 Status after 8s: ${statusResult.data.status}`);
          
          if (statusResult.data.status === 'COMPLETED') {
            console.log(`🎉 SUCCESS: Generated image available`);
          } else if (statusResult.data.status === 'FAILED') {
            console.log(`❌ FAILED: Complex prompt rejected`);
          } else {
            console.log(`⏳ Still processing...`);
          }
        }
        
      } else {
        const error = await response.text();
        console.log(`❌ Task creation failed: ${response.status} - ${error}`);
      }
      
      // Wait between tests to avoid rate limits
      console.log(`⏳ Waiting to avoid rate limits...`);
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
}

testPromptComplexity().catch(console.error);