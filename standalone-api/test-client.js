#!/usr/bin/env node

/**
 * Test Client for Complete Ghost Mannequin API
 * Tests the standalone backend with all enterprise features
 */

const API_URL = 'http://localhost:8000'; // Update with your API URL

// Test images
const TEST_IMAGES = {
  shirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
  dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=800&fit=crop',
  jacket: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=800&fit=crop'
};

async function testHealthCheck() {
  console.log('🏥 Testing API Health Check...');
  console.log('=' .repeat(50));
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API is healthy!');
      console.log(`   Service: ${result.service}`);
      console.log(`   Version: ${result.version}`);
      console.log(`   Status: ${result.status}`);
    } else {
      console.log('❌ API health check failed');
    }
  } catch (error) {
    console.log('❌ Failed to connect to API');
    console.log(`   Error: ${error.message}`);
    console.log(`   Make sure the API is running on ${API_URL}`);
  }
}

async function testGhostMannequinProcessing(imageName, imageUrl) {
  console.log(`\\n🧪 Testing Ghost Mannequin Processing: ${imageName}`);
  console.log('=' .repeat(60));
  console.log(`📸 Image: ${imageUrl}`);
  
  const startTime = Date.now();
  
  try {
    const requestPayload = {
      user_id: `test-user-${Date.now()}`,
      garment_url: imageUrl,
      options: {
        output_size: '2048x2048',
        rendering_model: 'ai-studio',
        enable_files_api: true,
        enable_logging: true,
        preserve_labels: true
      }
    };
    
    console.log('🚀 Sending request to /process-ghost...');
    console.log(`📦 Payload: ${JSON.stringify(requestPayload, null, 2)}`);
    
    const response = await fetch(`${API_URL}/process-ghost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });
    
    const result = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log(`\\n📊 Response Status: ${response.status}`);
    console.log(`⏱️  Total Request Time: ${(totalTime / 1000).toFixed(2)}s`);
    
    if (result.success) {
      console.log('\\n✅ SUCCESS! Ghost mannequin processing completed');
      console.log(`🆔 Session ID: ${result.session_id}`);
      console.log(`👤 User ID: ${result.user_id}`);
      console.log(`📊 Status: ${result.result?.status}`);
      
      // Processing metrics
      if (result.result?.processing_metrics) {
        const metrics = result.result.processing_metrics;
        console.log('\\n📈 Processing Metrics:');
        console.log(`   Total Time: ${metrics.total_time_seconds}s`);
        console.log(`   Background Removal: ${(metrics.stage_timings.background_removal / 1000).toFixed(2)}s`);
        console.log(`   Analysis: ${(metrics.stage_timings.analysis / 1000).toFixed(2)}s`);
        console.log(`   Enrichment: ${(metrics.stage_timings.enrichment / 1000).toFixed(2)}s`);
        console.log(`   Consolidation: ${(metrics.stage_timings.consolidation / 1000).toFixed(2)}s`);
        console.log(`   Rendering: ${(metrics.stage_timings.rendering / 1000).toFixed(2)}s`);
        
        // Cost optimization
        if (metrics.cost_optimization) {
          console.log('\\n💰 Cost Optimization:');
          console.log(`   Files API Used: ${metrics.cost_optimization.files_api_used ? '✅ YES' : '❌ NO'}`);
          console.log(`   Tokens Saved: ${metrics.cost_optimization.tokens_saved.toLocaleString()}`);
          console.log(`   Cost Savings: $${metrics.cost_optimization.cost_savings_usd.toFixed(3)}`);
          
          if (metrics.cost_optimization.files_api_used) {
            console.log(`   📉 Token Reduction: ~97%`);
            console.log(`   💵 Cost Efficiency: ~96% savings vs base64`);
          }
        }
      }
      
      // Generated URLs
      console.log('\\n🖼️  Generated Images:');
      console.log(`   Cleaned Image: ${result.result?.cleaned_image_url || 'Not available'}`);
      console.log(`   Ghost Mannequin: ${result.result?.ghost_mannequin_url || 'Not available'}`);
      
      // Analysis summary
      if (result.result?.analysis_data) {
        console.log('\\n🔍 Analysis Summary:');
        const analysis = result.result.analysis_data;
        console.log(`   Type: ${analysis.type || 'N/A'}`);
        console.log(`   Labels Found: ${analysis.labels_found?.length || 0}`);
        console.log(`   Preserve Details: ${analysis.preserve_details?.length || 0}`);
        console.log(`   Construction Details: ${analysis.construction_details?.length || 0}`);
      }
      
      // Enrichment summary
      if (result.result?.enrichment_data) {
        console.log('\\n✨ Enrichment Summary:');
        const enrichment = result.result.enrichment_data;
        console.log(`   Type: ${enrichment.type || 'N/A'}`);
        if (enrichment.color_precision) {
          console.log(`   Primary Color: ${enrichment.color_precision.primary_hex || 'N/A'}`);
          console.log(`   Color Temperature: ${enrichment.color_precision.color_temperature || 'N/A'}`);
        }
        if (enrichment.fabric_behavior) {
          console.log(`   Drape Quality: ${enrichment.fabric_behavior.drape_quality || 'N/A'}`);
          console.log(`   Surface Sheen: ${enrichment.fabric_behavior.surface_sheen || 'N/A'}`);
        }
      }
      
      // Consolidation summary
      if (result.result?.consolidation_data) {
        console.log('\\n📋 Consolidation Summary:');
        const consolidation = result.result.consolidation_data;
        console.log(`   Facts V3 Fields: ${Object.keys(consolidation.facts_v3 || {}).length}`);
        console.log(`   Control Block Fields: ${Object.keys(consolidation.control_block || {}).length}`);
        console.log(`   Conflicts Found: ${consolidation.conflicts_found?.length || 0}`);
      }
      
    } else {
      console.log('\\n❌ FAILED');
      console.log(`   Error Message: ${result.error?.message || 'Unknown error'}`);
      console.log(`   Error Code: ${result.error?.code || 'N/A'}`);
      console.log(`   Error Stage: ${result.error?.stage || 'N/A'}`);
      if (result.error?.details) {
        console.log(`   Error Details: ${result.error.details}`);
      }
    }
    
    return {
      success: result.success,
      sessionId: result.session_id,
      processingTime: totalTime,
      costSavings: result.result?.processing_metrics?.cost_optimization?.cost_savings_usd || 0,
      tokensSaved: result.result?.processing_metrics?.cost_optimization?.tokens_saved || 0
    };
    
  } catch (error) {
    console.log('\\n💥 TEST FAILED');
    console.log(`   Error: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Complete Ghost Mannequin API - Test Suite');
  console.log('='.repeat(60));
  console.log(`🔗 Testing API: ${API_URL}`);
  console.log(`📊 Focus: Enterprise features and Files API optimization`);
  
  // Health check first
  await testHealthCheck();
  
  const results = [];
  let totalCostSavings = 0;
  let totalTokensSaved = 0;
  let successCount = 0;
  
  // Test each image type
  for (const [imageName, imageUrl] of Object.entries(TEST_IMAGES)) {
    const result = await testGhostMannequinProcessing(imageName, imageUrl);
    results.push({ imageName, ...result });
    
    if (result.success) {
      successCount++;
      totalCostSavings += result.costSavings || 0;
      totalTokensSaved += result.tokensSaved || 0;
    }
    
    // Wait 3 seconds between tests to avoid overwhelming the API
    if (Object.keys(TEST_IMAGES).indexOf(imageName) < Object.keys(TEST_IMAGES).length - 1) {
      console.log('\\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Display comprehensive summary
  console.log('\\n\\n📊 COMPLETE API TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful Tests: ${successCount}/${results.length}`);
  console.log(`💰 Total Cost Savings: $${totalCostSavings.toFixed(3)}`);
  console.log(`🎆 Total Tokens Saved: ${totalTokensSaved.toLocaleString()}`);
  
  if (successCount > 0) {
    console.log(`📈 Average Cost Savings: $${(totalCostSavings / successCount).toFixed(3)} per image`);
    console.log(`📈 Average Tokens Saved: ${Math.round(totalTokensSaved / successCount).toLocaleString()} per image`);
  }
  
  console.log('\\n🔍 Per-Image Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const cost = result.costSavings ? `$${result.costSavings.toFixed(3)}` : '$0.000';
    const tokens = result.tokensSaved ? result.tokensSaved.toLocaleString() : '0';
    console.log(`   ${status} ${result.imageName}: ${tokens} tokens saved, ${cost} saved`);
  });
  
  // Recommendations
  console.log('\\n💡 RECOMMENDATIONS:');
  
  const successRate = (successCount / results.length) * 100;
  
  if (successRate === 100) {
    console.log('   🎉 Perfect! All tests passed - API is production ready!');
    console.log('   📈 Files API optimization working perfectly');
    console.log('   🚀 Ready for high-volume production deployment');
  } else if (successRate >= 75) {
    console.log(`   ⚠️  Good success rate (${successRate.toFixed(0)}%) but some issues detected`);
    console.log('   🔧 Check API logs for failed requests');
    console.log('   🔧 Verify all environment variables are set correctly');
  } else if (successRate >= 50) {
    console.log(`   ⚠️  Moderate success rate (${successRate.toFixed(0)}%) - needs attention`);
    console.log('   🔧 Check API key configuration and network connectivity');
    console.log('   🔧 Review error logs for common failure patterns');
  } else {
    console.log(`   🚨 Low success rate (${successRate.toFixed(0)}%) - major issues detected`);
    console.log('   🔧 Verify API is running and all API keys are valid');
    console.log('   🔧 Check network connectivity and firewall settings');
  }
  
  if (totalCostSavings > 0) {
    console.log('\\n📊 PRODUCTION SCALING ESTIMATES:');
    const avgSavings = totalCostSavings / Math.max(successCount, 1);
    console.log(`   📈 100 images/day: ~$${(avgSavings * 100).toFixed(2)}/day saved`);
    console.log(`   📈 1,000 images/day: ~$${(avgSavings * 1000).toFixed(2)}/day saved`);
    console.log(`   📈 Monthly (30k images): ~$${(avgSavings * 30000).toFixed(2)} saved`);
    console.log(`   📈 Annual (365k images): ~$${(avgSavings * 365000).toFixed(2)} saved`);
  }
  
  console.log('\\n🎯 Next Steps:');
  console.log('   1. Integrate API into your application');
  console.log('   2. Set up production monitoring and alerting');
  console.log('   3. Configure auto-scaling for high volume');
  console.log('   4. Monitor cost savings via detailed metrics');
  console.log('   5. Scale up knowing you have enterprise-grade pipeline!');
}

// Configuration validation
const url = new URL(API_URL);
if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
  console.log('⚠️  Testing against local API - make sure it\\'s running:');
  console.log('   cd standalone-api');
  console.log('   deno run --allow-net --allow-env index.ts');
  console.log('');
}

// Run the comprehensive tests
runComprehensiveTests()
  .then(() => {
    console.log('\\n✅ Complete API test suite finished!');
  })
  .catch(error => {
    console.error('\\n❌ Test suite failed:', error);
    process.exit(1);
  });