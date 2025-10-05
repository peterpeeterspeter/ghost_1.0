#!/usr/bin/env node

/**
 * Debug script to test Freepik Gemini 2.5 Flash API with minimal payload
 */

const FREEPIK_API_BASE = 'https://api.freepik.com/v1';
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY || 'FPSX7b918c5529743638f5fda53a36034567';

async function testFreepikAPI() {
  console.log('🧪 Testing Freepik Gemini 2.5 Flash API...');
  console.log('📡 API Key:', FREEPIK_API_KEY ? `${FREEPIK_API_KEY.substring(0, 8)}...` : 'MISSING');

  // Test 1: Minimal payload with simple prompt and single image URL
  const testPayload = {
    prompt: "Transform this garment into a 3D ghost mannequin effect while preserving all details and colors.",
    reference_images: [
      "https://v3b.fal.media/files/b/penguin/jqx3AyluFnEtdIS2jjKCj.jpg"  // Use actual FAL URL from logs
    ]
  };

  console.log('🚀 Test payload:', JSON.stringify(testPayload, null, 2));
  console.log('📏 Payload size:', JSON.stringify(testPayload).length, 'bytes');

  try {
    // Step 1: Create task
    console.log('\n📤 Creating task...');
    const createResponse = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': FREEPIK_API_KEY,
      },
      body: JSON.stringify(testPayload),
    });

    console.log('📥 Create response status:', createResponse.status);
    console.log('📥 Create response headers:');
    for (const [key, value] of createResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Task creation failed:', errorText);
      return;
    }

    const createResult = await createResponse.json();
    console.log('✅ Task created:', JSON.stringify(createResult, null, 2));

    const taskId = createResult.data.task_id;
    
    // Step 2: Poll for completion
    console.log(`\n🔄 Polling task ${taskId}...`);
    
    for (let attempt = 1; attempt <= 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second intervals
      
      const statusResponse = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview/${taskId}`, {
        method: 'GET',
        headers: {
          'x-freepik-api-key': FREEPIK_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        console.error('❌ Status check failed:', statusResponse.status, await statusResponse.text());
        break;
      }

      const statusResult = await statusResponse.json();
      console.log(`📋 Attempt ${attempt}: ${statusResult.data.status}`);
      
      if (statusResult.data.status === 'COMPLETED') {
        console.log('🎉 SUCCESS! Generated images:', statusResult.data.generated);
        return statusResult.data.generated;
      } else if (statusResult.data.status === 'FAILED') {
        console.error('❌ Task FAILED');
        console.error('❌ Full response:', JSON.stringify(statusResult, null, 2));
        
        // Check for error details in different possible locations
        if (statusResult.data.error) {
          console.error('❌ Error field:', statusResult.data.error);
        }
        if (statusResult.data.errors) {
          console.error('❌ Errors array:', statusResult.data.errors);
        }
        if (statusResult.error) {
          console.error('❌ Root error:', statusResult.error);
        }
        if (statusResult.message) {
          console.error('❌ Message:', statusResult.message);
        }
        
        break;
      }
    }
    
    console.log('⏰ Polling timeout - task did not complete in expected time');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

// Test 2: Check API key and account status
async function testAPIHealth() {
  console.log('\n🏥 Testing API health...');
  
  try {
    const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
      method: 'GET', 
      headers: {
        'x-freepik-api-key': FREEPIK_API_KEY,
      },
    });

    console.log('📋 Health check status:', response.status);
    console.log('📋 Health check headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API is accessible');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.error('❌ API health check failed:', error);
    }

  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
}

// Test 3: Even simpler payload test
async function testMinimalPayload() {
  console.log('\n🔬 Testing with absolutely minimal payload...');
  
  const minimalPayload = {
    prompt: "Show this garment in 3D form.",
    reference_images: ["https://v3b.fal.media/files/b/penguin/jqx3AyluFnEtdIS2jjKCj.jpg"]
  };
  
  console.log('🧪 Minimal payload:', JSON.stringify(minimalPayload, null, 2));
  
  try {
    const response = await fetch(`${FREEPIK_API_BASE}/ai/gemini-2-5-flash-image-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': FREEPIK_API_KEY,
      },
      body: JSON.stringify(minimalPayload),
    });

    console.log('📋 Minimal test status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Minimal test created task:', result.data.task_id);
      return result.data.task_id;
    } else {
      const error = await response.text();
      console.error('❌ Minimal test failed:', error);
    }
  } catch (error) {
    console.error('❌ Minimal test error:', error.message);
  }
}

// Run all tests
async function main() {
  console.log('🔍 FREEPIK API DEBUGGING SESSION');
  console.log('=====================================\n');
  
  await testAPIHealth();
  await testMinimalPayload();
  await testFreepikAPI();
  
  console.log('\n✅ Debug session complete');
}

main().catch(console.error);