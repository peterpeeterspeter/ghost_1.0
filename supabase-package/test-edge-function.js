#!/usr/bin/env node

/**
 * Test script for Ghost Mannequin Pipeline Supabase Edge Function
 * Run this after deploying to test your function
 */

const SUPABASE_URL = 'https://your-project.supabase.co'; // Replace with your Supabase URL
const ANON_KEY = 'your-anon-key'; // Replace with your anon key (optional)

// Test image URLs (replace with your own test images)
const TEST_IMAGES = {
  shirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
  dress: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop',
  jacket: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop'
};

async function testEdgeFunction(imageName, imageUrl) {
  console.log(`\n🧪 Testing Ghost Mannequin Pipeline with ${imageName}`);
  console.log('='.repeat(50));

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ghost-mannequin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ANON_KEY && { 'Authorization': `Bearer ${ANON_KEY}` })
      },
      body: JSON.stringify({
        flatlay: imageUrl,
        options: {
          outputSize: '1024x1024',
          backgroundColor: 'white',
          preserveLabels: true
        }
      })
    });

    const totalTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('📊 Results:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Session ID: ${result.sessionId}`);
    console.log(`   Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`   Processing Time: ${result.metrics.processingTime}`);

    if (result.status === 'completed') {
      console.log('\n✅ SUCCESS!');
      
      if (result.cleanedImageUrl) {
        console.log(`🖼️  Background Removed: ${result.cleanedImageUrl}`);
      }
      
      if (result.renderUrl) {
        console.log(`👻 Ghost Mannequin: ${result.renderUrl}`);
      }

      console.log('\n⏱️  Stage Breakdown:');
      const timings = result.metrics.stageTimings;
      if (timings.backgroundRemoval > 0) {
        console.log(`   Background Removal: ${(timings.backgroundRemoval / 1000).toFixed(1)}s`);
      }
      if (timings.analysis > 0) {
        console.log(`   Analysis: ${(timings.analysis / 1000).toFixed(1)}s`);
      }
      if (timings.enrichment > 0) {
        console.log(`   Enrichment: ${(timings.enrichment / 1000).toFixed(1)}s`);
      }
      if (timings.consolidation > 0) {
        console.log(`   Consolidation: ${(timings.consolidation / 1000).toFixed(1)}s`);
      }
      if (timings.rendering > 0) {
        console.log(`   Rendering: ${(timings.rendering / 1000).toFixed(1)}s`);
      }

      if (result.analysis) {
        console.log(`\n📝 Analysis Data: ${Object.keys(result.analysis).length} fields`);
      }

      if (result.enrichment) {
        console.log(`✨ Enrichment Data: Available`);
      }

    } else {
      console.log('\n❌ FAILED');
      console.log(`   Error: ${result.error.message}`);
      console.log(`   Code: ${result.error.code}`);
      console.log(`   Stage: ${result.error.stage}`);
    }

  } catch (error) {
    console.log('\n💥 TEST FAILED');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Possible Issues:');
      console.log('   - Check your SUPABASE_URL is correct');
      console.log('   - Ensure the edge function is deployed');
      console.log('   - Verify your network connection');
    }
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check');
  console.log('='.repeat(25));

  try {
    // Basic connectivity test
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ghost-mannequin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ANON_KEY && { 'Authorization': `Bearer ${ANON_KEY}` })
      },
      body: JSON.stringify({}) // Empty body should trigger validation error
    });

    const result = await response.json();
    
    if (response.status === 400 && result.error) {
      console.log('✅ Edge function is responding');
      console.log(`   Expected validation error: ${result.error}`);
    } else {
      console.log('⚠️  Unexpected response format');
    }

  } catch (error) {
    console.log('❌ Health check failed');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Setup Check:');
    console.log('   1. Deploy the function: supabase functions deploy ghost-mannequin');
    console.log('   2. Set secrets: supabase secrets set FAL_API_KEY=...');
    console.log('   3. Update SUPABASE_URL in this script');
  }
}

async function runAllTests() {
  console.log('🚀 Ghost Mannequin Pipeline - Edge Function Test Suite');
  console.log('=====================================================');
  console.log(`Testing against: ${SUPABASE_URL}`);

  // Health check first
  await testHealthCheck();

  // Test with different garment types
  for (const [name, url] of Object.entries(TEST_IMAGES)) {
    await testEdgeFunction(name, url);
    
    // Add delay between tests to avoid rate limits
    if (name !== Object.keys(TEST_IMAGES).pop()) {
      console.log('\n⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('\n🎉 Test Suite Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Check all tests passed');
  console.log('   2. Integrate into your frontend application');
  console.log('   3. Monitor function logs: supabase functions logs ghost-mannequin');
  console.log('   4. Set up monitoring and alerting');
}

// Configuration validation
if (SUPABASE_URL.includes('your-project')) {
  console.error('❌ Please update SUPABASE_URL in this script with your actual Supabase URL');
  console.error('   Example: https://abcdefghijklmnop.supabase.co');
  process.exit(1);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});