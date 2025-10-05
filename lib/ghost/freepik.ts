import { GhostPipelineError } from '@/types/ghost';

const FREEPIK_API_BASE = 'https://api.freepik.com/v1';

/**
 * Freepik API response for task creation
 */
interface FreepikTaskResponse {
  data: {
    task_id: string;
  };
}

/**
 * Freepik API response for task status
 */
interface FreepikTaskStatusResponse {
  data: {
    generated: string[];
    task_id: string;
    status: 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    error?: string;
    message?: string;
  };
}

/**
 * Prepare image for Freepik API - convert to base64 or use URLs directly
 * Freepik accepts both base64 encoded images and publicly accessible URLs
 * For large images, URLs are preferred to avoid payload size limits
 */
async function prepareImageForFreepik(imageInput: string, useDirectUrls: boolean = true): Promise<string> {
  console.log(`🔄 Preparing image for Freepik: ${imageInput.substring(0, 100)}...`);
  console.log(`📏 Input length: ${imageInput.length}`);
  
  // Maximum recommended base64 size per image to avoid payload limits
  const MAX_BASE64_SIZE_MB = 8; // Conservative limit for multiple images
  
  if (imageInput.startsWith('data:image/')) {
    console.log('📦 Processing data URI - extracting base64 part');
    const base64Data = imageInput.split(',')[1];
    const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
    console.log(`📦 Base64 size: ${sizeInMB.toFixed(2)} MB`);
    
    if (sizeInMB > MAX_BASE64_SIZE_MB) {
      console.warn(`⚠️ Image size (${sizeInMB.toFixed(2)} MB) exceeds recommended limit (${MAX_BASE64_SIZE_MB} MB)`);
      console.warn('⚠️ Consider using image compression or smaller source images');
      // Still proceed but warn about potential failures
    }
    
    console.log(`📦 Base64 preview: ${base64Data.substring(0, 50)}...`);
    return base64Data;
  } else if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    if (useDirectUrls) {
      console.log('🌐 Using URL directly (avoids payload size limits)');
      console.log(`🌐 URL: ${imageInput}`);
      return imageInput;
    } else {
      console.log('🌐 Converting URL to base64 (as requested)');
      console.log(`🌐 URL: ${imageInput}`);
      
      try {
        // Download the image and convert to base64
        const response = await fetch(imageInput);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
        
        console.log(`🔄 URL converted to base64: ${sizeInMB.toFixed(2)} MB`);
        
        if (sizeInMB > MAX_BASE64_SIZE_MB) {
          console.warn(`⚠️ Image size (${sizeInMB.toFixed(2)} MB) exceeds recommended limit (${MAX_BASE64_SIZE_MB} MB)`);
          console.warn('⚠️ Large images may cause Freepik API failures due to payload size limits');
          console.warn('⚠️ Consider implementing image compression or resizing before Freepik processing');
        }
        
        console.log(`📦 Base64 preview: ${base64Data.substring(0, 50)}...`);
        
        return base64Data;
      } catch (error) {
        console.error('❌ Failed to convert URL to base64:', error);
        throw new Error(`Failed to prepare image for Freepik: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } else {
    // Assume it's already base64
    console.log('📝 Assuming input is base64 format');
    const sizeInMB = (imageInput.length * 0.75) / (1024 * 1024);
    console.log(`📝 Base64 size: ${sizeInMB.toFixed(2)} MB`);
    
    if (sizeInMB > MAX_BASE64_SIZE_MB) {
      console.warn(`⚠️ Image size (${sizeInMB.toFixed(2)} MB) exceeds recommended limit (${MAX_BASE64_SIZE_MB} MB)`);
    }
    
    console.log(`📝 Base64 preview: ${imageInput.substring(0, 50)}...`);
    return imageInput;
  }
}

/**
 * Create a Gemini 2.5 Flash generation task
 */
async function createGeminiTask(
  prompt: string,
  inputImage: string,
  referenceImage: string | undefined,
  apiKey: string
): Promise<string> {
  // Check if we should use direct URLs (preferred for large images)
  const useDirectUrls = process.env.USE_DIRECT_URLS_FOR_FREEPIK === 'true';
  
  // Prepare images array
  const images: string[] = [await prepareImageForFreepik(inputImage, useDirectUrls)];
  
  // Add reference image if provided
  if (referenceImage) {
    images.push(await prepareImageForFreepik(referenceImage, useDirectUrls));
  }

  // Use the correct parameter structure for Gemini 2.5 Flash with image references
  const payload: any = {
    prompt: prompt, // Use the actual prompt parameter with garment-specific details
    reference_images: images,  // CORRECT parameter name according to Freepik API docs
  };

  console.log('\n=== FREEPIK GEMINI DEBUG ===');
  console.log('Input image parameter:', inputImage.substring(0, 100) + '...');
  console.log('Reference image parameter:', referenceImage ? referenceImage.substring(0, 100) + '...' : 'undefined');
  console.log('\n--- Image Processing ---');
  console.log('Raw images array after processing:');
  for (let i = 0; i < images.length; i++) {
    console.log(`  Image ${i}: ${images[i].substring(0, 50)}... (length: ${images[i].length})`);
    console.log(`  Image ${i} is valid base64:`, /^[A-Za-z0-9+/]*={0,2}$/.test(images[i]));
  }
  
  console.log('\n--- Payload Construction ---');
  console.log('Reference images array length:', payload.reference_images.length);
  console.log('Reference images in payload:');
  for (let i = 0; i < payload.reference_images.length; i++) {
    console.log(`  Reference Image ${i}: ${payload.reference_images[i].substring(0, 50)}... (length: ${payload.reference_images[i].length})`);
  }
  
  console.log('\n--- API Request ---');
  console.log('Prompt preview:', payload.prompt.substring(0, 200) + '...');
  console.log('\n--- API Payload Structure ---');
  const debugPayload = {
    ...payload,
    reference_images: payload.reference_images.map((img: string, idx: number) => `base64_data_${img.length}_bytes_image_${idx}`)
  };
  console.log('Full payload structure:', JSON.stringify(debugPayload, null, 2));
  console.log('=== END FREEPIK DEBUG ===\n');

  console.log('🚀 Sending request to Freepik API...');
  console.log('📡 Endpoint:', `${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`);
  console.log('📡 Headers:', {
    'Content-Type': 'application/json',
    'x-freepik-api-key': apiKey ? '[REDACTED]' : 'MISSING'
  });
  console.log('📡 Body size (bytes):', JSON.stringify(payload).length);
  
  const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-freepik-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  console.log('📥 API Response status:', response.status);
  console.log('📥 API Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Freepik task creation error:', response.status, errorText);
    console.error('❌ Request payload that failed:', JSON.stringify({...payload, reference_images: payload.reference_images.map((img: string, idx: number) => `[base64_${img.length}bytes_img${idx}]`)}, null, 2));
    throw new Error(`Failed to create Freepik task: ${response.status} - ${errorText}`);
  }

  const result: FreepikTaskResponse = await response.json();
  console.log('✅ Freepik API response:', JSON.stringify(result, null, 2));
  
  // Log the task creation success with details
  console.log(`📋 Task created successfully: ${result.data.task_id}`);
  console.log('📋 Sent payload summary:');
  console.log(`  - Prompt length: ${payload.prompt.length} characters`);
  console.log(`  - Reference images count: ${payload.reference_images.length}`);
  console.log(`  - Total payload size: ${JSON.stringify(payload).length} bytes`);
  
  return result.data.task_id;
}

/**
 * Poll for task completion with timeout
 */
async function pollTaskCompletion(
  taskId: string,
  apiKey: string,
  maxWaitTime: number = 300000, // 5 minutes
  pollInterval: number = 5000    // 5 seconds
): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview/${taskId}`, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to check task status: ${response.status} - ${errorText}`);
    }

    const result: FreepikTaskStatusResponse = await response.json();
    console.log(`Task ${taskId} status: ${result.data.status}`);

    if (result.data.status === 'COMPLETED') {
      if (result.data.generated && result.data.generated.length > 0) {
        console.log(`Generated image URL: ${result.data.generated[0]}`);
        return result.data.generated[0];
      } else {
        throw new Error('Task completed but no images were generated');
      }
    } else if (result.data.status === 'FAILED') {
      console.error(`❌ Task ${taskId} FAILED`);
      console.error('❌ Full API response:', JSON.stringify(result, null, 2));
      
      // Try to get more details about the failure
      if (result.data.error || result.data.message) {
        console.error('❌ Error details:', result.data.error || result.data.message);
        throw new Error(`Image generation task failed: ${result.data.error || result.data.message}`);
      }
      
      throw new Error('Image generation task failed - no specific error details provided');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Task timeout - image generation took too long');
}

/**
 * Convert image URL to base64 data URI
 */
async function convertUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch generated image: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Determine MIME type from URL or default to PNG
    const mimeType = imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg') 
      ? 'image/jpeg' 
      : 'image/png';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate ghost mannequin image using Freepik's Gemini 2.5 Flash API
 */
/**
 * Test function to verify Freepik API behavior with minimal payload
 */
export async function testFreepikImageGeneration(
  testImage: string
): Promise<{ taskId: string; result: any }> {
  const apiKey = process.env.FREEPIK_API_KEY_DISABLED;
  if (!apiKey) throw new Error('Missing API key');

  console.log('🧪 TESTING FREEPIK API WITH MINIMAL PAYLOAD');
  
  // Create super simple test payload
  const base64Image = await prepareImageForFreepik(testImage);
  
  const testPayload = {
    prompt: "URGENT: Transform THIS EXACT GARMENT from the provided image into a ghost mannequin. Use ONLY the garment shown in the attached image. Do NOT create a different garment.",
    images: [base64Image],
    num_images: 1,
    aspect_ratio: "1:1"
  };
  
  console.log('🧪 Test payload:', {
    ...testPayload,
    images: [`base64_data_${base64Image.length}_bytes`]
  });
  
  const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-freepik-api-key': apiKey,
    },
    body: JSON.stringify(testPayload),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  
  const result = await response.json();
  console.log('🧪 API Response:', result);
  
  return { taskId: result.data.task_id, result };
}

/**
 * Test function with minimal prompt to debug Freepik API failures
 */
export async function testFreepikWithSimplePrompt(
  imageUrl1: string,
  imageUrl2: string
): Promise<{ taskId: string; success: boolean; error?: string }> {
  const apiKey = process.env.FREEPIK_API_KEY_DISABLED;
  if (!apiKey) throw new Error('Missing API key');

  console.log('🧪 TESTING FREEPIK WITH SIMPLE PROMPT');
  
  const simplePayload = {
    prompt: "Create a ghost mannequin version of the garment shown in the reference images. Transform it from flat to 3D while preserving all colors and details.",
    reference_images: [imageUrl1, imageUrl2]
  };
  
  console.log('🧪 Simple payload:', simplePayload);
  
  try {
    const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': apiKey,
      },
      body: JSON.stringify(simplePayload),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { taskId: '', success: false, error: `API Error: ${response.status} - ${error}` };
    }
    
    const result = await response.json();
    console.log('🧪 Simple test result:', result);
    
    // Poll for completion
    const taskId = result.data.task_id;
    let attempts = 0;
    const maxAttempts = 12; // 1 minute
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview/${taskId}`, {
        method: 'GET',
        headers: { 'x-freepik-api-key': apiKey },
      });
      
      const statusResult = await statusResponse.json();
      console.log(`🧪 Attempt ${attempts + 1}: ${statusResult.data.status}`);
      
      if (statusResult.data.status === 'COMPLETED') {
        console.log('🧪 SUCCESS! Generated:', statusResult.data.generated);
        return { taskId, success: true };
      } else if (statusResult.data.status === 'FAILED') {
        console.log('🧪 FAILED:', JSON.stringify(statusResult, null, 2));
        return { taskId, success: false, error: 'Task failed during processing' };
      }
      
      attempts++;
    }
    
    return { taskId, success: false, error: 'Timeout' };
    
  } catch (error) {
    return { taskId: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function generateImageWithFreepikGemini(
  prompt: string,
  inputImage: string,
  referenceImage?: string
): Promise<{ imageBase64: string; processingTime: number }> {
  const startTime = Date.now();
  const apiKey = process.env.FREEPIK_API_KEY_DISABLED;
  
  if (!apiKey) {
    throw new GhostPipelineError(
      'Freepik API key not configured',
      'CONFIGURATION_ERROR',
      'rendering'
    );
  }

  console.log('Starting Freepik Gemini 2.5 Flash image generation...');
  console.log('Input image type:', inputImage.startsWith('data:') ? 'Base64' : inputImage.startsWith('http') ? 'URL' : 'Other');
  console.log('Input image preview:', inputImage.substring(0, 100) + '...');
  console.log('Input image length:', inputImage.length);
  
  // Check if it's the cleaned image from FAL (should be base64) or original URL
  if (inputImage.startsWith('data:image/')) {
    console.log('✅ Receiving cleaned base64 image from pipeline');
  } else if (inputImage.startsWith('https://v3.fal.media/')) {
    console.log('✅ Receiving cleaned FAL storage URL');
  } else if (inputImage.startsWith('https://images.unsplash.com/')) {
    console.log('❌ WARNING: Still receiving original Unsplash URL - pipeline not working!');
  } else {
    console.log('❓ Unknown image source:', inputImage.substring(0, 200));
  }
  
  if (referenceImage) {
    console.log('Reference image type:', referenceImage.startsWith('data:') ? 'Base64' : referenceImage.startsWith('http') ? 'URL' : 'Other');
    console.log('Reference image preview:', referenceImage.substring(0, 100) + '...');
  }

  try {
    // Step 1: Create the generation task
    const taskId = await createGeminiTask(prompt, inputImage, referenceImage, apiKey);
    console.log(`Created Freepik task: ${taskId}`);
    
    // Step 2: Poll for task completion
    const imageUrl = await pollTaskCompletion(taskId, apiKey);
    
    // Step 3: Convert image URL to base64
    const imageBase64 = await convertUrlToBase64(imageUrl);
    
    const processingTime = Date.now() - startTime;
    console.log(`Freepik Gemini generation completed in ${processingTime}ms`);
    
    return {
      imageBase64,
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Freepik Gemini generation failed:', error);
    
    if (error instanceof GhostPipelineError) {
      throw error;
    }
    
    throw new GhostPipelineError(
      `Freepik generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Generate ghost mannequin image using Freepik's Gemini 2.5 Flash API with JSON payload
 * This version accepts a structured JSON payload as the prompt
 * 
 * @param jsonPrompt - The JSON payload as a string (stringified FlashImagePromptPayload)
 * @param inputImage - The input image (cleaned flatlay or base64)
 * @param referenceImage - Optional reference image (on-model or base64)
 * @returns Promise<{ imageBase64: string; processingTime: number }>
 */
export async function generateImageWithFreepikGeminiJson(
  jsonPrompt: string,
  inputImage: string,
  referenceImage?: string
): Promise<{ imageBase64: string; processingTime: number }> {
  const startTime = Date.now();
  const apiKey = process.env.FREEPIK_API_KEY_DISABLED;
  
  if (!apiKey) {
    throw new GhostPipelineError(
      'Freepik API key not configured',
      'CONFIGURATION_ERROR',
      'rendering'
    );
  }

  console.log('🚀 Starting Freepik Gemini 2.5 Flash JSON generation...');
  console.log('📦 JSON payload length:', jsonPrompt.length);
  console.log('🔍 JSON payload preview:', jsonPrompt.substring(0, 300) + '...');
  
  try {
    // Create task with JSON payload as prompt
    const taskId = await createGeminiTask(jsonPrompt, inputImage, referenceImage, apiKey);
    console.log('📋 Created Freepik JSON task:', taskId);
    
    // Poll for completion - increased timeout for complex JSON payloads
    const imageUrl = await pollTaskCompletion(taskId, apiKey, 300000); // 5 minutes timeout
    
    // Convert result to base64 format expected by pipeline
    const imageBase64 = await convertUrlToBase64(imageUrl);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Freepik Gemini JSON generation completed in ${processingTime}ms`);
    
    return { imageBase64, processingTime };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Freepik Gemini JSON generation failed:', error);
    
    if (error instanceof GhostPipelineError) {
      throw error;
    }
    
    throw new GhostPipelineError(
      `Freepik Gemini JSON generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Alternative method using Freepik's Mystic API endpoint
 * This provides more flexibility and potentially different content policies
 */
export async function generateImageWithFreepikMystic(
  prompt: string,
  inputImage: string,
  referenceImage?: string
): Promise<{ imageBase64: string; processingTime: number }> {
  const startTime = Date.now();
  const apiKey = process.env.FREEPIK_API_KEY_DISABLED;
  
  if (!apiKey) {
    throw new GhostPipelineError(
      'Freepik API key not configured',
      'CONFIGURATION_ERROR',
      'rendering'
    );
  }

  console.log('Starting Freepik Mystic image generation...');

  try {
    // Prepare the request payload for Mystic API
    const payload: any = {
      inputs: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image',
          image_base64: await prepareImageForFreepik(inputImage)
        }
      ]
    };

    // Add reference image if provided
    if (referenceImage) {
      payload.inputs.push({
        type: 'image', 
        image_base64: await prepareImageForFreepik(referenceImage)
      });
    }

    console.log('Calling Freepik Mystic API...');

    const response = await fetch(`${FREEPIK_API_BASE}/mystic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Freepik Mystic API error:', response.status, errorText);
      
      throw new GhostPipelineError(
        `Freepik Mystic API error: ${response.status} - ${errorText}`,
        'RENDERING_FAILED',
        'rendering'
      );
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    console.log(`Freepik Mystic generation completed in ${processingTime}ms`);
    console.log('Mystic result:', JSON.stringify(result, null, 2));

    // The Mystic API might return a different structure
    if (result && result.output) {
      // Assume the output contains a URL or base64 image
      let imageBase64;
      if (typeof result.output === 'string' && result.output.startsWith('http')) {
        // If it's a URL, convert to base64
        imageBase64 = await convertUrlToBase64(result.output);
      } else if (typeof result.output === 'string') {
        // If it's already base64
        imageBase64 = result.output.startsWith('data:') ? result.output : `data:image/png;base64,${result.output}`;
      } else {
        throw new GhostPipelineError(
          'Unexpected Mystic API response format',
          'RENDERING_FAILED',
          'rendering'
        );
      }
      
      return {
        imageBase64,
        processingTime,
      };
    } else {
      throw new GhostPipelineError(
        'No images generated by Freepik Mystic',
        'RENDERING_FAILED',
        'rendering'
      );
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Freepik Mystic generation failed:', error);
    
    if (error instanceof GhostPipelineError) {
      throw error;
    }
    
    throw new GhostPipelineError(
      `Freepik Mystic generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDERING_FAILED',
      'rendering',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Health check for Freepik API
 */
export async function checkFreepikHealth(): Promise<{ status: string; message: string }> {
  const apiKey = process.env.FREEPIK_API_KEY_DISABLED;
  
  if (!apiKey) {
    return {
      status: 'error',
      message: 'Freepik API key not configured'
    };
  }

  try {
    // Make a simple request to check API availability (GET all tasks)
    const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': apiKey,
      },
    });

    // API should return task list (could be empty)
    if (response.status === 200) {
      return {
        status: 'healthy',
        message: 'Freepik API is accessible'
      };
    }

    return {
      status: 'healthy', 
      message: `Freepik API responded with status ${response.status}`
    };

  } catch (error) {
    return {
      status: 'error',
      message: `Freepik API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
