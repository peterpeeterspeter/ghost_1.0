#!/bin/bash

echo "🚀 Testing Ghost Mannequin Pipeline API"
echo "========================================"

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server not running. Starting server..."
    npm run dev &
    SERVER_PID=$!
    echo "⏳ Waiting for server to start..."
    sleep 5
else
    echo "✅ Server is running"
fi

echo ""
echo "📸 Testing with sample image..."

# Test API endpoint
curl -X POST http://localhost:3000/api/ghost \
  -H "Content-Type: application/json" \
  -d '{
    "flatlay": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop"
  }' \
  --max-time 300 \
  --show-error \
  --fail

echo ""
echo "🎉 Test completed!"

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo "🛑 Stopping server..."
    kill $SERVER_PID
fi
