# Ghost Mannequin Pipeline - Integration Guide

This guide shows you **all the ways** to connect your ghost mannequin pipeline to frontend tools **without running a server**.

## 🚀 Quick Start - Choose Your Integration Method

### Method 1: Direct Library Import (Recommended)
**Best for:** Custom applications, workflows, batch processing

```javascript
import { createGhostMannequinLibrary } from './lib/ghost-mannequin-lib';

const ghostMannequin = createGhostMannequinLibrary({
  falApiKey: 'your-fal-key',
  geminiApiKey: 'your-gemini-key',
  renderingModel: 'ai-studio'
});

// Process single image
const result = await ghostMannequin.processFromPaths(
  '/path/to/flatlay.jpg',
  '/path/to/onmodel.jpg'
);

console.log('Ghost mannequin URL:', result.renderUrl);
```

### Method 2: Command Line Interface
**Best for:** Scripts, automation, CI/CD pipelines

```bash
# Install globally (optional)
npm install -g .

# Process single image
ghost-mannequin process -i ./input/shirt.jpg -o ./output/ghost-shirt.jpg

# Batch process directory
ghost-mannequin batch -i ./input_images/ -o ./output_images/

# Health check
ghost-mannequin health
```

### Method 3: REST API (Server Mode)
**Best for:** Web applications, microservices, remote access

```bash
# Start server
npm run dev

# Send HTTP request
curl -X POST http://localhost:3002/api/ghost \
  -H "Content-Type: application/json" \
  -d '{"flatlay": "data:image/jpeg;base64,..."}'
```

---

## 📦 Method 1: Direct Library Integration

### Installation
```bash
# Copy your pipeline to your project
cp -r /path/to/ghost-mannequin-pipeline ./lib/

# Or install as dependency (if published)
npm install ghost-mannequin-pipeline
```

### Basic Usage
```javascript
import { createGhostMannequinLibrary } from 'ghost-mannequin-pipeline';

const ghostMannequin = createGhostMannequinLibrary({
  falApiKey: process.env.FAL_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  renderingModel: 'ai-studio',
  enableLogging: true
});

// Process from file paths (Node.js)
const result = await ghostMannequin.processFromPaths(
  './images/flatlay.jpg',
  './images/onmodel.jpg',
  {
    outputSize: '2048x2048',
    backgroundColor: 'white',
    preserveLabels: true
  }
);

// Process from URLs
const result2 = await ghostMannequin.process(
  'https://example.com/flatlay.jpg',
  'https://example.com/onmodel.jpg'
);

// Process from File objects (Browser)
const result3 = await ghostMannequin.processFromFiles(
  flatlayFile,
  onModelFile
);

// Batch processing
const results = await ghostMannequin.processBatch([
  { flatlay: './image1.jpg' },
  { flatlay: './image2.jpg' },
  { flatlay: './image3.jpg' }
], 2); // Process 2 concurrently
```

### Integration Examples

#### React Component
```jsx
import React, { useState } from 'react';
import { createGhostMannequinLibrary } from 'ghost-mannequin-pipeline';

function GhostMannequinProcessor() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const processImage = async (flatlayFile, onModelFile) => {
    setLoading(true);
    
    const ghostMannequin = createGhostMannequinLibrary({
      falApiKey: process.env.REACT_APP_FAL_API_KEY,
      geminiApiKey: process.env.REACT_APP_GEMINI_API_KEY,
      renderingModel: 'ai-studio'
    });

    try {
      const result = await ghostMannequin.processFromFiles(
        flatlayFile, 
        onModelFile
      );
      setResult(result);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => processImage(e.target.files[0])} 
      />
      {loading && <div>Processing...</div>}
      {result?.renderUrl && (
        <img src={result.renderUrl} alt="Ghost mannequin result" />
      )}
    </div>
  );
}
```

#### Node.js Workflow
```javascript
import { createGhostMannequinLibrary } from 'ghost-mannequin-pipeline';
import fs from 'fs/promises';
import path from 'path';

async function processProductImages(inputDir, outputDir) {
  const ghostMannequin = createGhostMannequinLibrary({
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    renderingModel: 'ai-studio'
  });

  const files = await fs.readdir(inputDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  for (const file of imageFiles) {
    try {
      console.log(`Processing ${file}...`);
      
      const result = await ghostMannequin.processFromPaths(
        path.join(inputDir, file)
      );

      if (result.status === 'completed' && result.renderUrl) {
        // Download and save result
        const response = await fetch(result.renderUrl);
        const buffer = await response.arrayBuffer();
        await fs.writeFile(
          path.join(outputDir, `ghost-${file}`),
          Buffer.from(buffer)
        );
        console.log(`✅ Saved ghost-${file}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error.message);
    }
  }
}

// Usage
await processProductImages('./product_photos', './ghost_mannequins');
```

---

## 🖥️ Method 2: Command Line Interface

### Installation
```bash
# Make CLI executable
chmod +x ./bin/ghost-mannequin-cli.js

# Install globally (optional)
npm install -g .

# Or run locally
npm run cli
```

### Commands

#### Process Single Image
```bash
# Basic usage
ghost-mannequin process -i ./images/shirt.jpg

# With all options
ghost-mannequin process \
  -i ./images/shirt.jpg \
  -r ./images/shirt-model.jpg \
  -o ./output/ghost-shirt.jpg \
  -s 2048x2048 \
  -b white \
  -m ai-studio \
  --verbose
```

#### Batch Processing
```bash
# Process entire directory
ghost-mannequin batch -i ./input_images/ -o ./output_images/

# With custom settings
ghost-mannequin batch \
  -i ./products/ \
  -o ./ghost_products/ \
  -s 1024x1024 \
  -c 3 \
  --verbose
```

#### Health Check
```bash
ghost-mannequin health
```

### Integration in Scripts
```bash
#!/bin/bash
# process_products.sh

echo "🚀 Starting product processing..."

# Process all products
ghost-mannequin batch \
  -i ./raw_products/ \
  -o ./processed_products/ \
  -s 2048x2048 \
  -b white \
  -c 2 \
  --verbose

echo "✅ Processing complete!"
```

### CI/CD Integration
```yaml
# .github/workflows/process-images.yml
name: Process Product Images

on:
  push:
    paths:
      - 'product_images/**'

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Process images
        run: |
          ghost-mannequin batch \
            -i ./product_images/ \
            -o ./ghost_mannequins/ \
            --verbose
        env:
          FAL_API_KEY: ${{ secrets.FAL_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: ghost-mannequins
          path: ./ghost_mannequins/
```

---

## 🌐 Method 3: REST API (Server Mode)

### Start Server
```bash
npm run dev  # Development
npm run build && npm start  # Production
```

### API Endpoints

#### Health Check
```bash
curl http://localhost:3002/api/ghost?action=health
```

#### Process Image
```bash
curl -X POST http://localhost:3002/api/ghost \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "onModel": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "options": {
      "outputSize": "2048x2048",
      "backgroundColor": "white"
    }
  }'
```

### JavaScript Client
```javascript
import { GhostMannequinClient } from './integration-examples/javascript-sdk.js';

const client = new GhostMannequinClient('http://localhost:3002');

// Health check
const health = await client.checkHealth();

// Process from files
const result = await client.processFromFiles(flatlayFile, onModelFile, {
  outputSize: '2048x2048',
  backgroundColor: 'white'
});

// Process from URLs
const result2 = await client.processFromUrls(
  'https://example.com/flatlay.jpg',
  'https://example.com/onmodel.jpg'
);
```

---

## ⚙️ Configuration

### Environment Variables
Create `.env.local`:
```env
# Required
FAL_API_KEY=your_fal_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
FREEPIK_API_KEY=your_freepik_api_key_here
RENDERING_MODEL=ai-studio
ENABLE_QA_LOOP=true
MAX_QA_ITERATIONS=2

# Timeouts (ms)
TIMEOUT_BACKGROUND_REMOVAL=30000
TIMEOUT_ANALYSIS=90000
TIMEOUT_ENRICHMENT=120000
TIMEOUT_CONSOLIDATION=45000
TIMEOUT_RENDERING=180000
```

### Library Configuration
```javascript
const config = {
  // Required
  falApiKey: 'your-key',
  geminiApiKey: 'your-key',
  
  // Optional
  freepikApiKey: 'your-key',
  renderingModel: 'ai-studio', // 'ai-studio', 'freepik-gemini', 'gemini-flash', 'seedream'
  enableLogging: true,
  
  // Timeouts
  timeouts: {
    backgroundRemoval: 30000,
    analysis: 90000,
    enrichment: 120000,
    consolidation: 45000,
    rendering: 180000,
    qa: 60000
  }
};
```

---

## 🎯 Use Case Examples

### E-commerce Platform Integration
```javascript
// Shopify app integration
export async function POST(request) {
  const { productImages } = await request.json();
  
  const ghostMannequin = createGhostMannequinLibrary(config);
  
  const results = await ghostMannequin.processBatch(
    productImages.map(img => ({ flatlay: img.url })),
    3
  );
  
  return Response.json({ results });
}
```

### Photo Studio Workflow
```bash
#!/bin/bash
# Daily processing script
DAILY_DIR="./photos/$(date +%Y-%m-%d)"

if [ -d "$DAILY_DIR" ]; then
  echo "Processing photos from $DAILY_DIR..."
  ghost-mannequin batch -i "$DAILY_DIR" -o "./processed/$(date +%Y-%m-%d)" --verbose
fi
```

### Content Management System
```php
<?php
// WordPress plugin integration
function process_ghost_mannequin($attachment_id) {
    $image_path = get_attached_file($attachment_id);
    
    $command = "ghost-mannequin process -i '$image_path' -o ./wp-content/uploads/ghost/";
    $result = shell_exec($command);
    
    // Handle result...
}
```

---

## 🔧 Advanced Features

### Custom Error Handling
```javascript
try {
  const result = await ghostMannequin.process(flatlay, onModel);
} catch (error) {
  if (error.code === 'FAL_API_ERROR') {
    // Handle FAL API specific error
  } else if (error.code === 'GEMINI_API_ERROR') {
    // Handle Gemini API specific error
  } else {
    // Handle generic error
  }
}
```

### Progress Tracking
```javascript
await ghostMannequin.processWithProgress(
  flatlay,
  onModel,
  options,
  (progress) => {
    console.log(`Stage: ${progress.stage}, Message: ${progress.message}`);
  }
);
```

### Custom Timeouts
```javascript
const ghostMannequin = createGhostMannequinLibrary({
  ...config,
  timeouts: {
    backgroundRemoval: 45000,  // 45 seconds
    analysis: 120000,          // 2 minutes
    rendering: 300000          // 5 minutes
  }
});
```

---

## 📊 Performance Tips

1. **Batch Processing**: Use `processBatch()` with 2-3 concurrent jobs
2. **Image Size**: Resize images to 800-1200px before processing to reduce costs
3. **Caching**: Cache results to avoid reprocessing
4. **Error Recovery**: Implement retry logic with exponential backoff
5. **Resource Management**: Monitor API quotas and rate limits

---

## 🆘 Troubleshooting

### Common Issues

#### "API Key Not Found"
```bash
# Check environment variables
echo $FAL_API_KEY
echo $GEMINI_API_KEY

# Set temporarily
export FAL_API_KEY=your_key_here
```

#### "Module Not Found"
```bash
# Ensure dependencies are installed
npm install

# Check TypeScript compilation
npm run build-lib
```

#### "Processing Timeout"
```javascript
// Increase timeout
const config = {
  timeouts: { rendering: 600000 } // 10 minutes
};
```

### Getting Help
- Check logs with `enableLogging: true`
- Use `ghost-mannequin health` to verify configuration
- Review error codes in the response

---

## ✨ That's It!

You now have **three powerful ways** to integrate your ghost mannequin pipeline:

1. **📚 Direct Library** - Import and use in your code
2. **🖥️ Command Line** - Scripts and automation  
3. **🌐 REST API** - Web applications and services

Choose the method that best fits your workflow - **no server required** for options 1 and 2!