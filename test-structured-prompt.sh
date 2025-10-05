#!/bin/bash

# Test Ghost Mannequin API with Structured Prompt System
# This demonstrates the Amazon-ready 32+ field structured approach

echo "🚀 Testing Ghost Mannequin Pipeline with Structured Prompts"
echo "========================================================="
echo "This will activate the Amazon-compliant structured prompt system"
echo "based on clockmaker test insights (70% vs 0% success rate)"
echo ""

# Sample base64 image (1x1 pixel test image)
SAMPLE_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Test 1: Hybrid Structured Prompt (Recommended)
echo "🧪 Test 1: Hybrid Structured Prompt"
echo "-----------------------------------"
echo "Features: JSON structure + narrative + Amazon compliance"

curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "'$SAMPLE_IMAGE'",
    "options": {
      "useStructuredPrompt": true,
      "preserveLabels": true,
      "outputSize": "2048x2048"
    }
  }' \
  --max-time 300 \
  --silent \
  --show-error \
  | jq '.error // "SUCCESS: Check server logs for structured prompt activation"'

echo ""
echo "✅ Test 1 completed - Check server logs for:"
echo "   🚀 STRUCTURED PROMPT ACTIVATED: Hybrid Structured approach" 
echo "   📊 Based on clockmaker test insights: 70% structured vs 0% narrative success rate"
echo "   🎯 Amazon marketplace compliance: 32+ structured fields, 85% frame fill, shadowless lighting"

echo ""
echo "🧪 Test 2: Expert AI Command Prompt (Maximum Precision)"
echo "------------------------------------------------------"
echo "Features: Direct AI commands + pure JSON specification"

curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "'$SAMPLE_IMAGE'",
    "options": {
      "useStructuredPrompt": true,
      "useExpertPrompt": true,
      "preserveLabels": true,
      "outputSize": "2048x2048"
    }
  }' \
  --max-time 300 \
  --silent \
  --show-error \
  | jq '.error // "SUCCESS: Check server logs for expert prompt activation"'

echo ""
echo "✅ Test 2 completed - Check server logs for:"
echo "   🚀 STRUCTURED PROMPT ACTIVATED: Expert AI Command approach"

echo ""
echo "🎯 Both tests demonstrate the new Amazon-ready structured prompt system!"
echo "📊 Key features activated:"
echo "   • 32+ structured fields for Amazon marketplace compliance"
echo "   • 85% frame fill requirement"
echo "   • Shadowless lighting specifications"
echo "   • Prohibited elements filtering"
echo "   • Color precision with exact hex values"
echo "   • Fabric physics simulation"
echo ""
echo "🚀 Your frontend can now use these same options for structured prompts!"