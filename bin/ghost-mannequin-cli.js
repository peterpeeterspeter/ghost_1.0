#!/usr/bin/env node

/**
 * Ghost Mannequin CLI Tool
 * Command-line interface for processing images
 */

import { program } from 'commander';
import { createGhostMannequinLibrary } from '../lib/ghost-mannequin-lib.js';
import { writeFile, mkdir, readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

program
  .name('ghost-mannequin')
  .description('AI-powered Ghost Mannequin Pipeline CLI')
  .version('1.0.0');

// Single image processing
program
  .command('process')
  .description('Process a single image to create ghost mannequin effect')
  .requiredOption('-i, --input <path>', 'Input flatlay image path')
  .option('-r, --reference <path>', 'Optional on-model reference image path')
  .option('-o, --output <path>', 'Output path for generated image (default: ./output/)')
  .option('-s, --size <size>', 'Output size (default: 2048x2048)', '2048x2048')
  .option('-b, --background <color>', 'Background color (default: white)', 'white')
  .option('-m, --model <model>', 'Rendering model (ai-studio|freepik-gemini|gemini-flash|seedream)', 'ai-studio')
  .option('--no-labels', 'Disable label preservation')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      await processImage(options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Batch processing
program
  .command('batch')
  .description('Process multiple images from a directory')
  .requiredOption('-i, --input <dir>', 'Input directory containing images')
  .option('-o, --output <dir>', 'Output directory (default: ./output/)', './output/')
  .option('-s, --size <size>', 'Output size (default: 2048x2048)', '2048x2048')
  .option('-b, --background <color>', 'Background color (default: white)', 'white')
  .option('-m, --model <model>', 'Rendering model (ai-studio|freepik-gemini|gemini-flash|seedream)', 'ai-studio')
  .option('-c, --concurrent <num>', 'Number of concurrent processes (default: 2)', '2')
  .option('--no-labels', 'Disable label preservation')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      await batchProcess(options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Health check
program
  .command('health')
  .description('Check API health and configuration')
  .action(async () => {
    try {
      await checkHealth();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

async function processImage(options) {
  console.log('🚀 Starting ghost mannequin processing...');
  console.log(`📁 Input: ${options.input}`);
  if (options.reference) console.log(`📁 Reference: ${options.reference}`);
  
  // Initialize library
  const ghostMannequin = createGhostMannequinLibrary({
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    freepikApiKey: process.env.FREEPIK_API_KEY,
    renderingModel: options.model,
    enableLogging: options.verbose || false
  });

  // Process image
  const result = await ghostMannequin.processFromPaths(
    options.input,
    options.reference,
    {
      outputSize: options.size,
      backgroundColor: options.background,
      preserveLabels: options.labels
    }
  );

  if (result.status === 'completed') {
    // Determine output path
    const inputName = path.basename(options.input, path.extname(options.input));
    const outputPath = options.output || path.join('./output/', `ghost-${inputName}.jpg`);
    
    // Create output directory
    await mkdir(path.dirname(outputPath), { recursive: true });
    
    // Download and save result
    if (result.renderUrl) {
      await downloadImage(result.renderUrl, outputPath);
      console.log('✅ Success!');
      console.log(`📁 Output: ${outputPath}`);
      console.log(`⏱️  Processing time: ${result.metrics.processingTime}`);
      console.log(`🆔 Session ID: ${result.sessionId}`);
    }
  } else {
    console.error('❌ Processing failed:', result.error?.message);
    process.exit(1);
  }
}

async function batchProcess(options) {
  console.log('🚀 Starting batch processing...');
  console.log(`📁 Input directory: ${options.input}`);
  console.log(`📁 Output directory: ${options.output}`);
  
  // Get all image files
  const files = await readdir(options.input);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  if (imageFiles.length === 0) {
    console.log('❌ No image files found in input directory');
    process.exit(1);
  }
  
  console.log(`📊 Found ${imageFiles.length} images to process`);
  
  // Initialize library
  const ghostMannequin = createGhostMannequinLibrary({
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    freepikApiKey: process.env.FREEPIK_API_KEY,
    renderingModel: options.model,
    enableLogging: options.verbose || false
  });

  // Prepare batch data
  const images = imageFiles.map(filename => ({
    flatlay: path.join(options.input, filename),
    options: {
      outputSize: options.size,
      backgroundColor: options.background,
      preserveLabels: options.labels
    },
    filename
  }));

  // Process batch
  const results = await ghostMannequin.processBatch(
    images,
    parseInt(options.concurrent)
  );

  // Create output directory
  await mkdir(options.output, { recursive: true });

  // Save results
  let successCount = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const filename = images[i].filename;
    const outputPath = path.join(options.output, `ghost-${filename}`);

    if (result.status === 'completed' && result.renderUrl) {
      try {
        await downloadImage(result.renderUrl, outputPath);
        console.log(`✅ ${filename} -> ghost-${filename}`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to save ${filename}:`, error.message);
      }
    } else {
      console.log(`❌ Failed to process ${filename}:`, result.error?.message);
    }
  }

  console.log(`🎉 Batch complete! ${successCount}/${imageFiles.length} images processed successfully`);
}

async function checkHealth() {
  console.log('🏥 Checking API health...');
  
  // Check environment variables
  const requiredEnvVars = ['FAL_API_KEY', 'GEMINI_API_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }
  
  console.log('✅ Environment variables configured');
  
  // Test API connectivity (basic validation)
  try {
    const ghostMannequin = createGhostMannequinLibrary({
      falApiKey: process.env.FAL_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      freepikApiKey: process.env.FREEPIK_API_KEY,
      enableLogging: false
    });
    
    console.log('✅ Library initialized successfully');
    console.log('✅ All systems operational');
  } catch (error) {
    console.error('❌ Library initialization failed:', error.message);
    process.exit(1);
  }
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(buffer));
}

// Parse arguments and run
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}