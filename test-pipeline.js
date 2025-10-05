#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function runPipeline() {
  try {
    // Read the two images
    const hemdPath = path.join(__dirname, 'input', 'hemd.jpg');
    const hemdNathaliePath = path.join(__dirname, 'input', 'hemdNathalie.JPG');
    
    console.log('Reading images...');
    const hemdBuffer = fs.readFileSync(hemdPath);
    const hemdNathalieBuffer = fs.readFileSync(hemdNathaliePath);
    
    // Convert to base64
    const hemdBase64 = `data:image/jpeg;base64,${hemdBuffer.toString('base64')}`;
    const hemdNathalieBase64 = `data:image/jpeg;base64,${hemdNathalieBuffer.toString('base64')}`;
    
    console.log('Images converted to base64');
    console.log(`hemd.jpg size: ${hemdBuffer.length} bytes`);
    console.log(`hemdNathalie.JPG size: ${hemdNathalieBuffer.length} bytes`);
    
    // Prepare the request payload
    const payload = {
      garmentDetailImage: hemdBase64,      // Image B (garment detail)
      onModelImage: hemdNathalieBase64,    // Image A (on-model)
      options: {
        outputSize: "2048x2048"
      }
    };
    
    console.log('\nSending request to ghost mannequin pipeline...');
    console.log('This may take 1-2 minutes due to AI processing...\n');
    
    const response = await fetch('http://localhost:3000/api/ghost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Pipeline completed successfully!');
      console.log('\nResults:');
      console.log(`- Session ID: ${result.sessionId}`);
      console.log(`- Processing time: ${result.processingTime}ms`);
      console.log(`- Background removed Image A: ${result.onModelCleanedUrl ? 'Generated' : 'Failed'}`);
      console.log(`- Background removed Image B: ${result.garmentDetailCleanedUrl ? 'Generated' : 'Failed'}`);
      console.log(`- Ghost mannequin image: ${result.ghostMannequinUrl ? 'Generated' : 'Failed'}`);
      
      if (result.analysis) {
        console.log(`- Garment analysis: Completed (${Object.keys(result.analysis).length} properties)`);
      }
      
      console.log('\nStage timings:');
      if (result.stageTimings) {
        Object.entries(result.stageTimings).forEach(([stage, time]) => {
          console.log(`  - ${stage}: ${time}ms`);
        });
      }
      
      // Save URLs to a file for easy access
      const urls = {
        onModelCleanedUrl: result.onModelCleanedUrl,
        garmentDetailCleanedUrl: result.garmentDetailCleanedUrl,
        ghostMannequinUrl: result.ghostMannequinUrl,
        sessionId: result.sessionId,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync('pipeline-results.json', JSON.stringify(urls, null, 2));
      console.log('\n📁 Results saved to pipeline-results.json');
      
    } else {
      console.error('❌ Pipeline failed:');
      console.error(`Status: ${response.status}`);
      console.error(`Error: ${result.error || 'Unknown error'}`);
      
      if (result.details) {
        console.error('Details:', result.details);
      }
      
      if (result.stage) {
        console.error(`Failed at stage: ${result.stage}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to run pipeline:', error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  }
}

// Run the pipeline
runPipeline().catch(console.error);
