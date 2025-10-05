#!/usr/bin/env npx tsx

/**
 * CLI Runner for Prompt Approach Testing
 * 
 * Tests the effectiveness of structured vs narrative prompts based on 
 * the clockmaker test discovery (70% vs 0% success rates).
 * 
 * Usage:
 *   npx tsx scripts/run-prompt-test.ts
 *   npm run test:prompts
 */

import dotenv from 'dotenv';
import { runPromptApproachTest } from './test-prompt-approaches';
import { configurePromptGenerator } from '../lib/ghost/prompt-generator';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('🚀 Ghost Mannequin Prompt Approach Test');
    console.log('=======================================');
    console.log('Inspired by clockmaker test: JSON 70% vs Narrative 0% success\n');

    // Configure API clients if available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      configurePromptGenerator(geminiKey);
      console.log('✅ Gemini API configured');
    } else {
      console.log('⚠️  GEMINI_API_KEY not found - narrative tests will be limited');
    }

    console.log('\n📋 Test will compare:');
    console.log('  1. 📝 Narrative prompts (current AI-generated approach)');  
    console.log('  2. 🔄 Structured hybrid prompts (JSON + narrative)');
    console.log('  3. 📊 Pure structured JSON prompts (like clockmaker test)');

    console.log('\n🎯 Measuring:');
    console.log('  • Prompt length and complexity');
    console.log('  • Processing time');
    console.log('  • Critical elements inclusion');
    console.log('  • Structured elements ratio');

    // Run the comprehensive test
    const results = await runPromptApproachTest();

    // Additional analysis
    console.log('\n📊 DETAILED ANALYSIS');
    console.log('====================');

    // Find best approach by structured elements
    const bestStructured = Object.entries(results.comparison.structuredElementRatio)
      .sort(([,a], [,b]) => b - a)[0];
    
    console.log(`\n🏆 Highest structured element density: ${bestStructured[0].toUpperCase()} (${Math.round(bestStructured[1])} elements)`);

    // Find most efficient approach
    const fastestApproach = Object.entries(results.comparison.averageProcessingTime)
      .sort(([,a], [,b]) => a - b)[0];
    
    console.log(`⚡ Fastest processing: ${fastestApproach[0].toUpperCase()} (${Math.round(fastestApproach[1])}ms average)`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    
    if (results.comparison.structuredElementRatio['structured_json'] > results.comparison.structuredElementRatio['narrative']) {
      console.log('✅ Structured JSON approach shows higher technical precision');
      console.log('   Consider implementing as primary method for complex garments');
    }
    
    if (results.comparison.structuredElementRatio['structured_hybrid'] > results.comparison.structuredElementRatio['narrative']) {
      console.log('✅ Hybrid approach balances structure with creativity');
      console.log('   Ideal for maintaining both precision and natural language flow');
    }

    console.log('\n🔬 CLOCKMAKER TEST VALIDATION');
    console.log('============================');
    console.log('Your clockmaker test showed structured prompts handle complex,');
    console.log('precise requirements much better than narrative approaches.');
    console.log('These results should help validate that insight for our use case.');

    console.log('\n📈 Next Steps:');
    console.log('  1. Review generated prompts in detail');
    console.log('  2. Test actual image generation with different approaches');
    console.log('  3. Measure real-world success rates (like your 70% vs 0%)');
    console.log('  4. Implement the most effective approach as default');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('  • Ensure GEMINI_API_KEY is set in .env.local');
    console.error('  • Check that all dependencies are installed');
    console.error('  • Verify TypeScript compilation is working');
    process.exit(1);
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test interrupted by user');
  console.log('Thank you for exploring prompt approaches! 🚀');
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  main();
}