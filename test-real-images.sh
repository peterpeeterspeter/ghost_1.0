#!/bin/bash

# Test script for ghost mannequin pipeline with real images
# Replace these URLs with your own hosted images

FLATLAY_URL="YOUR_FLATLAY_IMAGE_URL_HERE"
ONMODEL_URL="YOUR_ONMODEL_IMAGE_URL_HERE"

echo "Testing Ghost Mannequin Pipeline with real images..."
echo "Flatlay: $FLATLAY_URL"
echo "On-model: $ONMODEL_URL"

curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d "{\"flatlay\": \"$FLATLAY_URL\", \"onModel\": \"$ONMODEL_URL\"}" \
  --max-time 180

echo -e "\n\nTest completed!"
