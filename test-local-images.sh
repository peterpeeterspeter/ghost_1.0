#!/bin/bash

# Test script for ghost mannequin pipeline with local images
# Place your images in the project directory and update the paths below

FLATLAY_IMAGE="./your-flatlay-image.jpg"
ONMODEL_IMAGE="./your-onmodel-image.jpg"

if [ ! -f "$FLATLAY_IMAGE" ]; then
    echo "Error: Flatlay image not found at $FLATLAY_IMAGE"
    echo "Please place your flatlay image in the project directory and update FLATLAY_IMAGE path"
    exit 1
fi

if [ ! -f "$ONMODEL_IMAGE" ]; then
    echo "Error: On-model image not found at $ONMODEL_IMAGE" 
    echo "Please place your on-model image in the project directory and update ONMODEL_IMAGE path"
    exit 1
fi

echo "Converting images to base64..."
FLATLAY_B64="data:image/jpeg;base64,$(base64 -i "$FLATLAY_IMAGE")"
ONMODEL_B64="data:image/jpeg;base64,$(base64 -i "$ONMODEL_IMAGE")"

echo "Testing Ghost Mannequin Pipeline with local images..."
echo "Flatlay: $FLATLAY_IMAGE"
echo "On-model: $ONMODEL_IMAGE"

curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d "{\"flatlay\": \"$FLATLAY_B64\", \"onModel\": \"$ONMODEL_B64\"}" \
  --max-time 180

echo -e "\n\nTest completed!"
