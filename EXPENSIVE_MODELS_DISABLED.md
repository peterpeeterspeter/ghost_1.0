# ⚠️ EXPENSIVE GEMINI MODELS DISABLED

## 🚨 BILLING ALERT

Google billing shows charges for:
- "Generate content input token count Gemini 2.5 Pro long input text"  
- "Generate content input token count Gemini 2.5 Pro short input text"

## Files Disabled:
- test-gemini-simple.js → test-gemini-simple.js.DISABLED_EXPENSIVE
- test-ai-studio-direct.js → test-ai-studio-direct.js.DISABLED_EXPENSIVE

## Current Status:
- ✅ Production pipeline uses ONLY flash-lite models (cheap)
- ✅ Test files with expensive models disabled
- ✅ Current cost per image: ~4.5¢ (instead of ~€2)

## To Re-enable (NOT RECOMMENDED):
```bash
mv test-gemini-simple.js.DISABLED_EXPENSIVE test-gemini-simple.js
mv test-ai-studio-direct.js.DISABLED_EXPENSIVE test-ai-studio-direct.js
```

## Monitoring:
- Google AI Studio Dashboard: https://aistudio.google.com/app/billing
- Check costs daily to catch spikes early
- Use only flash-lite models for analysis/enrichment
- Use 2.5-flash-image-preview ONLY for final rendering (3.9¢)

## Safe Models:
- ✅ gemini-2.0-flash-lite (~€0.10 per 1M tokens)
- ✅ gemini-2.5-flash-image-preview (~3.9¢ per image)
- ❌ gemini-2.5-pro (~€4-8 per 1M tokens) - 40x MORE EXPENSIVE!

Generated: 2025-09-26T08:19:02.436Z
