import { fal } from "@fal-ai/client";
import { 
  FalBriaRequest, 
  FalBriaResponse, 
  BackgroundRemovalResult, 
  GhostPipelineError 
} from "@/types/ghost";

// Configure FAL client
export function configureFalClient(apiKey: string): void {
  fal.config({
    credentials: apiKey,
  });
}

/**
 * Remove background from image using FAL.AI Bria 2.0 model
 * @param imageUrl - URL or base64 encoded image
 * @returns Promise with cleaned image URL and processing time
 */
export async function removeBackground(imageUrl: string): Promise<BackgroundRemovalResult> {
  const startTime = Date.now();

  try {
    // Check if mocking is enabled
    if (process.env.MOCK_FAL_API === 'true') {
      console.log('🧪 MOCK MODE: Simulating background removal...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      return {
        cleanedImageUrl: imageUrl, // Return original image in mock mode
        processingTime: Date.now() - startTime,
      };
    }

    // Validate input
    if (!imageUrl) {
      throw new GhostPipelineError(
        'Image URL is required for background removal',
        'MISSING_IMAGE_URL',
        'background_removal'
      );
    }

    // Prepare request
    const request: FalBriaRequest = {
      image_url: imageUrl,
    };

    console.log('🚀 Starting background removal with FAL.AI Bria 2.0...');
    
    let processedImageUrl = imageUrl;
    
    // Handle base64 images properly as per FAL documentation
    if (imageUrl.startsWith('data:image/')) {
      const base64Size = (imageUrl.length * 3) / 4; // Rough base64 to bytes conversion
      console.log('📊 Base64 image size:', (base64Size / 1024 / 1024).toFixed(2), 'MB');
      
      // For images > 1MB, use FAL storage upload as recommended in docs
      if (base64Size > 1024 * 1024) { // 1MB threshold
        console.log('🔄 Large image detected, uploading to FAL storage...');
        try {
          // Extract base64 data and convert to File object for auto-upload
          const [header, base64Data] = imageUrl.split(',');
          const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Create File object - FAL will auto-upload this
          const file = new File([buffer], 'image.jpg', { type: mimeType });
          const uploadedUrl = await fal.storage.upload(file);
          processedImageUrl = uploadedUrl;
          console.log('✅ Image uploaded to FAL storage:', uploadedUrl);
        } catch (uploadError) {
          console.warn('⚠️ FAL storage upload failed, using direct base64:', uploadError);
          // Fall back to direct base64 (may cause HTTP 413 for very large images)
        }
      } else {
        console.log('📤 Small image, using direct base64');
      }
    } else {
      console.log('🔗 Using external URL:', imageUrl.substring(0, 50) + '...');
    }

    // Call FAL.AI Bria background removal endpoint
    console.log('📤 Sending request to FAL.AI Bria endpoint...');
    const result: any = await fal.subscribe("fal-ai/bria/background/remove", {
      input: {
        image_url: processedImageUrl
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status) {
          console.log('📋 FAL Status:', update.status);
        }
      },
    });

    const processingTime = Date.now() - startTime;

    // Validate response according to FAL.AI documentation
    const responseData = result?.data || result;
    const resultImageUrl = responseData?.image?.url;
    
    if (!resultImageUrl || typeof resultImageUrl !== 'string') {
      console.error('FAL.AI response structure:', result);
      console.error('Response data:', responseData);
      throw new GhostPipelineError(
        'Invalid response from FAL.AI: missing image URL',
        'INVALID_FAL_RESPONSE',
        'background_removal'
      );
    }

    console.log(`Background removal completed in ${processingTime}ms`);
    
    return {
      cleanedImageUrl: resultImageUrl,
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('Background removal failed:', error);
    
    // Handle FAL.AI specific errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        throw new GhostPipelineError(
          'FAL.AI rate limit exceeded. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          'background_removal',
          error
        );
      }
      
      if (error.message.includes('insufficient credits')) {
        throw new GhostPipelineError(
          'Insufficient FAL.AI credits',
          'INSUFFICIENT_CREDITS',
          'background_removal',
          error
        );
      }

      if (error.message.includes('invalid image')) {
        throw new GhostPipelineError(
          'Invalid image format or corrupted image',
          'INVALID_IMAGE_FORMAT',
          'background_removal',
          error
        );
      }
    }

    // Re-throw if already a GhostPipelineError
    if (error instanceof GhostPipelineError) {
      throw error;
    }

    // Generic error handling
    throw new GhostPipelineError(
      `Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'BACKGROUND_REMOVAL_FAILED',
      'background_removal',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Validate image URL format and accessibility
 * @param imageUrl - URL to validate
 * @returns Promise<boolean> - true if valid and accessible
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    // Check if it's a base64 data URL
    if (imageUrl.startsWith('data:image/')) {
      return true;
    }

    // Check if it's a valid HTTP/HTTPS URL
    const url = new URL(imageUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Try to fetch the image headers to verify it exists and is an image
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/') ?? false;

  } catch {
    return false;
  }
}



/**
 * Get estimated processing time for background removal based on image size
 * @param imageUrl - Image URL or base64 data
 * @returns number - Estimated processing time in milliseconds
 */
export async function getEstimatedProcessingTime(imageUrl: string): Promise<number> {
  try {
    // For base64 data URLs, estimate from string length
    if (imageUrl.startsWith('data:image/')) {
      const base64Length = imageUrl.length;
      // Rough estimation: larger base64 = larger image = longer processing
      return Math.min(Math.max(base64Length / 1000, 2000), 30000); // 2-30 seconds
    }

    // For URLs, try to get image size from headers
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      return Math.min(Math.max(sizeInMB * 2000, 2000), 30000); // 2-30 seconds based on file size
    }

    return 5000; // Default 5 seconds if we can't determine size
  } catch {
    return 5000; // Default 5 seconds on error
  }
}

/**
 * Upload generated image to FAL storage for permanent URL
 * @param imageDataUrl - Base64 data URL of the image
 * @returns Promise<string> - Permanent storage URL
 */
export async function uploadImageToFalStorage(imageDataUrl: string): Promise<string> {
  try {
    console.log('Uploading generated image to FAL storage...');
    
    // Convert data URL to file for upload
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.match(/data:([^;]+)/)?.[1] || 'image/png';
    
    // Create a blob from base64
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const file = new File([byteArray], 'ghost-mannequin.png', { type: mimeType });
    
    // Upload to FAL storage using the same pattern as background removal
    const uploadResult = await fal.storage.upload(file);
    
    console.log('Image uploaded to FAL storage successfully:', uploadResult);
    return uploadResult;
    
  } catch (error) {
    console.error('FAL storage upload failed:', error);
    
    // Return original data URL as fallback
    return imageDataUrl;
  }
}
