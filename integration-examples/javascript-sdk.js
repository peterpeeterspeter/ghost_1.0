/**
 * Ghost Mannequin Pipeline JavaScript SDK
 * For integrating with external frontend applications
 */

class GhostMannequinClient {
  constructor(baseUrl = 'http://localhost:3002', apiKey = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Health check - verify the API is working
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/ghost?action=health`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Process ghost mannequin from image files
   * @param {File} flatlayFile - Required: garment detail image file
   * @param {File} onModelFile - Optional: on-model reference image file
   * @param {Object} options - Processing options
   */
  async processFromFiles(flatlayFile, onModelFile = null, options = {}) {
    if (!flatlayFile) {
      throw new Error('Flatlay image file is required');
    }

    // Convert files to base64
    const flatlayBase64 = await this.fileToBase64(flatlayFile);
    const onModelBase64 = onModelFile ? await this.fileToBase64(onModelFile) : undefined;

    return this.processFromBase64(flatlayBase64, onModelBase64, options);
  }

  /**
   * Process ghost mannequin from URLs
   * @param {string} flatlayUrl - Required: garment detail image URL
   * @param {string} onModelUrl - Optional: on-model reference image URL
   * @param {Object} options - Processing options
   */
  async processFromUrls(flatlayUrl, onModelUrl = null, options = {}) {
    if (!flatlayUrl) {
      throw new Error('Flatlay image URL is required');
    }

    return this.processFromBase64(flatlayUrl, onModelUrl, options);
  }

  /**
   * Process ghost mannequin from base64 data or URLs
   * @param {string} flatlay - Base64 data or URL
   * @param {string} onModel - Base64 data or URL (optional)
   * @param {Object} options - Processing options
   */
  async processFromBase64(flatlay, onModel = null, options = {}) {
    const requestBody = {
      flatlay,
      onModel,
      options: {
        outputSize: options.outputSize || '2048x2048',
        backgroundColor: options.backgroundColor || 'white',
        preserveLabels: options.preserveLabels !== false,
        renderingModel: options.renderingModel || 'ai-studio',
        ...options
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/ghost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders()
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Ghost mannequin processing failed: ${error.message}`);
    }
  }

  /**
   * Process with progress tracking using polling
   * @param {string} flatlay - Base64 data or URL
   * @param {string} onModel - Base64 data or URL (optional)
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback function
   */
  async processWithProgress(flatlay, onModel = null, options = {}, onProgress = null) {
    if (onProgress) onProgress({ stage: 'starting', message: 'Initiating processing...' });

    try {
      const result = await this.processFromBase64(flatlay, onModel, options);
      
      if (onProgress) {
        onProgress({ 
          stage: 'completed', 
          message: 'Processing completed successfully',
          result 
        });
      }

      return result;
    } catch (error) {
      if (onProgress) {
        onProgress({ 
          stage: 'failed', 
          message: error.message,
          error 
        });
      }
      throw error;
    }
  }

  /**
   * Convert File object to base64 string
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get default headers for API requests
   */
  getHeaders() {
    const headers = {};
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}

// Usage examples:

// Basic usage
const client = new GhostMannequinClient('http://localhost:3002');

// Health check
// await client.checkHealth();

// Process from files
// const result = await client.processFromFiles(flatlayFile, onModelFile, {
//   outputSize: '2048x2048',
//   backgroundColor: 'white'
// });

// Process from URLs
// const result = await client.processFromUrls(
//   'https://example.com/flatlay.jpg',
//   'https://example.com/onmodel.jpg'
// );

// Process with progress tracking
// await client.processWithProgress(flatlayData, onModelData, options, (progress) => {
//   console.log('Progress:', progress.stage, progress.message);
// });

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GhostMannequinClient };
}

if (typeof window !== 'undefined') {
  window.GhostMannequinClient = GhostMannequinClient;
}