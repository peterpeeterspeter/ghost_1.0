/**
 * Ghost Mannequin Library Usage Examples
 * Direct integration without server
 */

import { createGhostMannequinLibrary } from '../lib/ghost-mannequin-lib';
import fs from 'fs/promises';
import path from 'path';

// Initialize the library with your API keys
const ghostMannequin = createGhostMannequinLibrary({
  falApiKey: process.env.FAL_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  freepikApiKey: process.env.FREEPIK_API_KEY, // optional
  renderingModel: 'ai-studio', // or 'freepik-gemini', 'gemini-flash', 'seedream'
  enableLogging: true,
  timeouts: {
    backgroundRemoval: 30000,
    analysis: 90000,
    rendering: 180000
  }
});

// Example 1: Process from file paths (Node.js)
async function processFromFiles() {
  try {
    console.log('🔄 Processing images from file paths...');
    
    const result = await ghostMannequin.processFromPaths(
      '/path/to/your/flatlay-image.jpg',
      '/path/to/your/onmodel-image.jpg', // optional
      {
        outputSize: '2048x2048',
        backgroundColor: 'white',
        preserveLabels: true
      }
    );

    if (result.status === 'completed') {
      console.log('✅ Success! Ghost mannequin URL:', result.renderUrl);
      console.log('📊 Processing time:', result.metrics.processingTime);
      
      // Save result image
      if (result.renderUrl) {
        await saveImageFromUrl(result.renderUrl, 'output/ghost-mannequin.jpg');
      }
    } else {
      console.error('❌ Processing failed:', result.error?.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 2: Process from URLs
async function processFromUrls() {
  try {
    console.log('🔄 Processing images from URLs...');
    
    const result = await ghostMannequin.process(
      'https://example.com/flatlay-image.jpg',
      'https://example.com/onmodel-image.jpg', // optional
      {
        outputSize: '1024x1024',
        backgroundColor: 'transparent'
      }
    );

    if (result.status === 'completed') {
      console.log('✅ Success! Result:', result.renderUrl);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 3: Batch processing multiple images
async function batchProcessing() {
  const images = [
    {
      flatlay: 'https://example.com/shirt1.jpg',
      options: { outputSize: '2048x2048' }
    },
    {
      flatlay: 'https://example.com/dress1.jpg',
      onModel: 'https://example.com/dress1-model.jpg',
      options: { backgroundColor: 'white' }
    },
    {
      flatlay: '/local/path/pants1.jpg',
      options: { preserveLabels: true }
    }
  ];

  try {
    console.log('🔄 Processing batch of', images.length, 'images...');
    
    const results = await ghostMannequin.processBatch(images, 2); // Process 2 at a time
    
    console.log(`✅ Batch complete! ${results.filter(r => r.status === 'completed').length}/${results.length} successful`);
    
    // Process results
    results.forEach((result, index) => {
      if (result.status === 'completed') {
        console.log(`Image ${index + 1}: ✅ ${result.renderUrl}`);
      } else {
        console.log(`Image ${index + 1}: ❌ ${result.error?.message}`);
      }
    });
  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
  }
}

// Helper function to save image from URL
async function saveImageFromUrl(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(buffer));
    
    console.log('💾 Image saved to:', outputPath);
  } catch (error) {
    console.error('❌ Failed to save image:', error.message);
  }
}

// Example 4: Browser usage with File objects
// (This would be in a browser environment)
/*
async function processFromBrowserFiles(flatlayFile, onModelFile) {
  try {
    const result = await ghostMannequin.processFromFiles(
      flatlayFile,
      onModelFile,
      { outputSize: '2048x2048' }
    );
    
    if (result.status === 'completed') {
      // Display result in browser
      const img = document.createElement('img');
      img.src = result.renderUrl;
      document.body.appendChild(img);
    }
  } catch (error) {
    console.error('Processing failed:', error.message);
  }
}
*/

// Example 5: Integration with existing workflow
async function integrateWithWorkflow(inputDir, outputDir) {
  try {
    // Get all image files from input directory
    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    
    console.log(`🔄 Processing ${imageFiles.length} images from ${inputDir}...`);
    
    // Process each image
    for (const filename of imageFiles) {
      const inputPath = path.join(inputDir, filename);
      const outputPath = path.join(outputDir, `ghost-${filename}`);
      
      try {
        console.log(`Processing ${filename}...`);
        
        const result = await ghostMannequin.processFromPaths(inputPath);
        
        if (result.status === 'completed' && result.renderUrl) {
          await saveImageFromUrl(result.renderUrl, outputPath);
          console.log(`✅ ${filename} -> ${outputPath}`);
        } else {
          console.log(`❌ Failed to process ${filename}:`, result.error?.message);
        }
      } catch (error) {
        console.log(`❌ Error processing ${filename}:`, error.message);
      }
    }
    
    console.log('🎉 Workflow complete!');
  } catch (error) {
    console.error('❌ Workflow error:', error.message);
  }
}

// Run examples
async function runExamples() {
  console.log('🚀 Starting Ghost Mannequin Library Examples\n');
  
  // Uncomment the examples you want to run:
  // await processFromFiles();
  // await processFromUrls();
  // await batchProcessing();
  // await integrateWithWorkflow('./input_images', './output_images');
  
  console.log('\n✅ Examples complete!');
}

// Export functions for use in other modules
export {
  processFromFiles,
  processFromUrls,
  batchProcessing,
  integrateWithWorkflow,
  saveImageFromUrl
};

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}