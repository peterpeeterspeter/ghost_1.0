# Direct Pipeline Integration Demo

This shows you **exactly** how to use your ghost mannequin pipeline **without running a server**.

## ✅ What Works Right Now

Your pipeline is already set up for direct integration! Here are the **3 ways** you can connect it:

### Method 1: Direct Import (Recommended)

```javascript
// In your JavaScript/Node.js application:
import { processGhostMannequin } from './lib/ghost/pipeline.js';

const result = await processGhostMannequin(
  {
    flatlay: 'https://example.com/image.jpg', // or base64 data
    options: {
      outputSize: '2048x2048',
      backgroundColor: 'white'
    }
  },
  {
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    renderingModel: 'ai-studio',
    enableLogging: true
  }
);

console.log('Result URL:', result.renderUrl);
```

### Method 2: Command Line (No Server)

```bash
# Install dependencies
npm install

# Set environment variables
export FAL_API_KEY="your-key"
export GEMINI_API_KEY="your-key"

# Process images directly
node -e "
import('./lib/ghost/pipeline.js').then(async ({ processGhostMannequin }) => {
  const result = await processGhostMannequin({
    flatlay: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    options: { outputSize: '1024x1024' }
  }, {
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    renderingModel: 'ai-studio'
  });
  console.log('Success:', result.renderUrl);
});
"
```

### Method 3: Copy & Paste Integration

You can copy these core files into any project:

```bash
# Copy essential files to your project
cp -r lib/ghost/ /path/to/your-project/
cp types/ghost.ts /path/to/your-project/types/
cp .env.example /path/to/your-project/.env

# Install dependencies in your project
cd /path/to/your-project
npm install @fal-ai/client @google/generative-ai zod uuid
```

Then use it directly:

```javascript
import { processGhostMannequin } from './ghost/pipeline.js';

// Your code here...
```

## 🚀 Quick Test

Test your pipeline without server right now:

```bash
# 1. Make sure environment variables are set
echo $FAL_API_KEY
echo $GEMINI_API_KEY

# 2. Test with a simple curl-like command using Node.js
node --input-type=module -e "
import('./lib/ghost/pipeline.js').then(async ({ processGhostMannequin }) => {
  console.log('🚀 Testing direct pipeline...');
  const result = await processGhostMannequin({
    flatlay: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    options: { outputSize: '1024x1024', backgroundColor: 'white' }
  }, {
    falApiKey: process.env.FAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    renderingModel: 'ai-studio',
    enableLogging: true
  });
  console.log('✅ Status:', result.status);
  if (result.renderUrl) console.log('🎭 Result:', result.renderUrl);
  if (result.error) console.log('❌ Error:', result.error.message);
}).catch(console.error);
"
```

## 📋 Integration Examples

### React/Next.js Component

```jsx
'use client';
import { useState } from 'react';

export default function GhostMannequinProcessor() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const processImage = async (imageFile) => {
    setLoading(true);
    
    try {
      // Convert file to base64
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(imageFile);
      });

      // Call API endpoint (this uses your existing API)
      const response = await fetch('/api/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flatlay: base64,
          options: { outputSize: '2048x2048' }
        })
      });

      const data = await response.json();
      setResult(data);
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
        accept="image/*"
      />
      
      {loading && <div>Processing...</div>}
      
      {result?.renderUrl && (
        <img src={result.renderUrl} alt="Ghost mannequin result" />
      )}
    </div>
  );
}
```

### Node.js Batch Processing Script

```javascript
// batch-process.js
import { processGhostMannequin } from './lib/ghost/pipeline.js';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function batchProcess(inputDir, outputDir) {
  const files = await readdir(inputDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  await mkdir(outputDir, { recursive: true });
  
  console.log(`Processing ${imageFiles.length} images...`);
  
  for (const file of imageFiles) {
    try {
      console.log(`Processing ${file}...`);
      
      // Read and convert to base64
      const buffer = await readFile(path.join(inputDir, file));
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      
      // Process with pipeline
      const result = await processGhostMannequin({
        flatlay: base64,
        options: { outputSize: '2048x2048' }
      }, {
        falApiKey: process.env.FAL_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY,
        renderingModel: 'ai-studio'
      });
      
      if (result.status === 'completed' && result.renderUrl) {
        // Download result
        const response = await fetch(result.renderUrl);
        const resultBuffer = await response.arrayBuffer();
        
        // Save to output directory
        const outputPath = path.join(outputDir, `ghost-${file}`);
        await writeFile(outputPath, Buffer.from(resultBuffer));
        
        console.log(`✅ ${file} -> ghost-${file}`);
      } else {
        console.log(`❌ ${file} failed:`, result.error?.message);
      }
    } catch (error) {
      console.log(`❌ ${file} error:`, error.message);
    }
  }
  
  console.log('🎉 Batch processing complete!');
}

// Usage: node batch-process.js
await batchProcess('./input-images', './output-images');
```

### Python Integration (via subprocess)

```python
# python_integration.py
import subprocess
import json
import os

def process_ghost_mannequin(image_path, output_size="2048x2048"):
    """Process ghost mannequin using Node.js pipeline"""
    
    # Convert image to base64 (you could also use URLs)
    import base64
    with open(image_path, 'rb') as f:
        base64_image = base64.b64encode(f.read()).decode()
        base64_data = f"data:image/jpeg;base64,{base64_image}"
    
    # Create Node.js command
    node_script = f'''
    import('./lib/ghost/pipeline.js').then(async ({{ processGhostMannequin }}) => {{
      const result = await processGhostMannequin({{
        flatlay: '{base64_data}',
        options: {{ outputSize: '{output_size}' }}
      }}, {{
        falApiKey: process.env.FAL_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY,
        renderingModel: 'ai-studio'
      }});
      console.log(JSON.stringify(result));
    }}).catch(console.error);
    '''
    
    # Run Node.js pipeline
    result = subprocess.run([
        'node', '--input-type=module', '-e', node_script
    ], capture_output=True, text=True, cwd='/path/to/ghost-mannequin-pipeline')
    
    if result.returncode == 0:
        try:
            return json.loads(result.stdout.strip())
        except json.JSONDecodeError:
            return {'error': 'Failed to parse result'}
    else:
        return {'error': result.stderr}

# Usage
result = process_ghost_mannequin('./my-image.jpg')
if result.get('renderUrl'):
    print(f"Success: {result['renderUrl']}")
else:
    print(f"Failed: {result.get('error', 'Unknown error')}")
```

## 🎯 Key Benefits of Direct Integration

1. **No Server Required** - Import and use directly in your code
2. **Better Performance** - No HTTP overhead, direct function calls
3. **Easier Debugging** - Full access to logs and error handling
4. **More Flexible** - Custom error handling, retries, batching
5. **Cost Effective** - No server hosting costs

## 🔧 Environment Setup

Make sure you have these environment variables:

```bash
# .env or .env.local
FAL_API_KEY=your_fal_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
FREEPIK_API_KEY=your_freepik_api_key_here  # optional
```

## ✨ That's It!

Your ghost mannequin pipeline is **ready for direct integration**. You can:

- ✅ Import it directly into any Node.js application  
- ✅ Use it in serverless functions
- ✅ Call it from batch processing scripts
- ✅ Integrate it with existing workflows
- ✅ Use it in CLI tools and automation

**No server startup required!** Just import and use the `processGhostMannequin` function directly.