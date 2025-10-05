const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const TOTAL_TESTS = 50;
const API_ENDPOINT = 'http://localhost:3001/api/ghost';
const OUTPUT_DIR = path.join(__dirname, '..', 'test_results');

// Sample test image (replace with your actual test image)
const TEST_IMAGE = fs.readFileSync(path.join(__dirname, '..', 'test_data', 'sample_flatlay.jpg')).toString('base64');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create results file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const resultsFile = path.join(OUTPUT_DIR, `batch_test_${timestamp}.json`);
const results = {
    startTime: new Date().toISOString(),
    totalTests: TOTAL_TESTS,
    tests: [],
    summary: {
        successful: 0,
        failed: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0
    }
};

async function runTest(testNumber) {
    console.log(`Running test ${testNumber + 1}/${TOTAL_TESTS}`);
    const startTime = Date.now();
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                flatlay: `data:image/jpeg;base64,${TEST_IMAGE}`,
                options: {
                    outputSize: '2048x2048'
                }
            })
        });

        const data = await response.json();
        const processingTime = Date.now() - startTime;

        const testResult = {
            testNumber: testNumber + 1,
            timestamp: new Date().toISOString(),
            success: response.ok,
            statusCode: response.status,
            processingTime,
            response: data
        };

        results.tests.push(testResult);
        results.summary.successful += response.ok ? 1 : 0;
        results.summary.failed += response.ok ? 0 : 1;
        results.summary.totalProcessingTime += processingTime;

        // Save results after each test
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

        console.log(`Test ${testNumber + 1} completed in ${processingTime}ms (${response.ok ? 'Success' : 'Failed'})`);
    } catch (error) {
        const testResult = {
            testNumber: testNumber + 1,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
        };

        results.tests.push(testResult);
        results.summary.failed += 1;
        
        console.error(`Test ${testNumber + 1} failed:`, error.message);
        
        // Save results after each test
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    }
}

async function runBatchTests() {
    console.log(`Starting batch test of ${TOTAL_TESTS} iterations...`);
    console.log(`Results will be saved to: ${resultsFile}`);

    for (let i = 0; i < TOTAL_TESTS; i++) {
        await runTest(i);
    }

    // Calculate final summary
    results.endTime = new Date().toISOString();
    results.summary.averageProcessingTime = results.summary.totalProcessingTime / TOTAL_TESTS;

    // Save final results
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    console.log('\nBatch Test Summary:');
    console.log('==================');
    console.log(`Total Tests: ${TOTAL_TESTS}`);
    console.log(`Successful: ${results.summary.successful}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Average Processing Time: ${Math.round(results.summary.averageProcessingTime)}ms`);
    console.log(`Total Processing Time: ${Math.round(results.summary.totalProcessingTime)}ms`);
    console.log(`Results saved to: ${resultsFile}`);
}

// Run the tests
runBatchTests().catch(console.error);