#!/usr/bin/env tsx

import { configureGeminiClient } from './lib/ghost/gemini';

async function configure() {
  try {
    await configureGeminiClient();
    console.log('✅ Gemini client configured successfully');
  } catch (error) {
    console.error('❌ Failed to configure Gemini client:', error);
  }
}

configure().catch(console.error);
