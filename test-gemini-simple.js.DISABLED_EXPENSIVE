const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testGeminiBasic() {
  console.log('🧪 Testing basic Gemini Pro 2.5 connectivity...');
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const startTime = Date.now();
  
  try {
    const result = await model.generateContent([
      {
        text: "Return a simple JSON response with just: {\"test\": \"success\", \"timestamp\": \"" + new Date().toISOString() + "\"}",
      }
    ]);

    const response = await result.response;
    const responseText = response.text();
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Gemini API is working');
    console.log('⏱️ Processing time:', processingTime + 'ms');
    console.log('📝 Response:', responseText);
    
    return true;
  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
    console.log('⏱️ Failed after:', Date.now() - startTime + 'ms');
    return false;
  }
}

testGeminiBasic();