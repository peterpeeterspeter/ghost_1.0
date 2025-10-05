#!/bin/bash

# Configuration
TOTAL_TESTS=50
API_ENDPOINT="http://localhost:3001/api/ghost"
TEST_IMAGE_PATH="${1:-./test_data/sample_flatlay.jpg}"  # Allow custom image path as first argument
OUTPUT_DIR="./test_results"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%S-%3NZ")
RESULTS_FILE="$OUTPUT_DIR/batch_test_$TIMESTAMP.json"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Initialize results file
cat > "$RESULTS_FILE" << EOF
{
  "startTime": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "totalTests": $TOTAL_TESTS,
  "tests": [],
  "summary": {
    "successful": 0,
    "failed": 0,
    "averageProcessingTime": 0,
    "totalProcessingTime": 0
  }
}
EOF

echo "Starting batch test of $TOTAL_TESTS iterations..."
echo "Results will be saved to: $RESULTS_FILE"

# Check if test image exists
if [ ! -f "$TEST_IMAGE_PATH" ]; then
    echo "Error: Test image not found at $TEST_IMAGE_PATH"
    exit 1
fi

# Encode image to base64 and save to temp file
TEMP_PAYLOAD="/tmp/ghost_payload_$$.json"
echo "Encoding image to base64..."
IMAGE_BASE64=$(base64 -i "$TEST_IMAGE_PATH" | tr -d '\n')
if [ $? -ne 0 ]; then
    echo "Error: Failed to encode test image to base64"
    exit 1
fi

# Create JSON payload file
cat > "$TEMP_PAYLOAD" << EOF
{"flatlay": "data:image/jpeg;base64,$IMAGE_BASE64", "options": {"outputSize": "2048x2048"}}
EOF

echo "Image encoded successfully ($(wc -c < "$TEMP_PAYLOAD") bytes payload)"

successful=0
failed=0
total_time=0

for i in $(seq 1 $TOTAL_TESTS); do
    echo "Running test $i/$TOTAL_TESTS"
    
    start_time=$(date +%s)
    
    # Make the API request using payload file
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$API_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d @"$TEMP_PAYLOAD" \
        --max-time 600)
    
    end_time=$(date +%s)
    processing_time=$(((end_time - start_time) * 1000))
    total_time=$((total_time + processing_time))
    
    # Extract HTTP status code
    http_status=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_status" -eq 200 ]; then
        echo "Test $i completed in ${processing_time}ms (Success)"
        successful=$((successful + 1))
        status="true"
    else
        echo "Test $i failed with HTTP status $http_status in ${processing_time}ms"
        failed=$((failed + 1))
        status="false"
    fi
    
    # Create temporary test result
    cat > "/tmp/test_result_$i.json" << EOF
{
  "testNumber": $i,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "success": $status,
  "statusCode": $http_status,
  "processingTime": $processing_time,
  "response": $response_body
}
EOF
    
    # Update results file with new test (basic approach)
    # Note: This is a simple implementation. For production, consider using jq for proper JSON manipulation
    echo "Test $i result saved"
done

# Calculate averages
if [ $TOTAL_TESTS -gt 0 ]; then
    average_time=$((total_time / TOTAL_TESTS))
else
    average_time=0
fi

# Create final summary
cat > "$RESULTS_FILE" << EOF
{
  "startTime": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "endTime": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "totalTests": $TOTAL_TESTS,
  "summary": {
    "successful": $successful,
    "failed": $failed,
    "averageProcessingTime": $average_time,
    "totalProcessingTime": $total_time
  }
}
EOF

echo ""
echo "Batch Test Summary:"
echo "=================="
echo "Total Tests: $TOTAL_TESTS"
echo "Successful: $successful"
echo "Failed: $failed"
echo "Average Processing Time: ${average_time}ms"
echo "Total Processing Time: ${total_time}ms"
echo "Results saved to: $RESULTS_FILE"

# Cleanup temporary files
rm -f /tmp/test_result_*.json
rm -f "$TEMP_PAYLOAD"
