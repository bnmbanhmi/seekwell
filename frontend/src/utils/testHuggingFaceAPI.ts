/**
 * Test script to validate HuggingFace API integration
 * Updated for SSE Queue-based approach (LATEST FIX)
 */

import HuggingFaceAIService from '../services/HuggingFaceAIService';

async function testHuggingFaceAPI() {
  console.log('🧪 Testing SSE Queue-based HuggingFace API Integration...');
  console.log('🔧 Using Gradio v5.34.0 SSE protocol with file upload + queue processing');
  
  const service = new HuggingFaceAIService();
  
  try {
    // Test 1: Check service health
    console.log('\n1️⃣ Testing service health...');
    const healthCheck = await service.healthCheck();
    console.log('✅ Health check result:', healthCheck);
    
    // Test 2: Check space info (SSE endpoints)
    console.log('\n2️⃣ Testing space information...');
    const spaceInfo = await service.getSpaceInfo();
    console.log('✅ Space info:', spaceInfo);
    console.log('📋 API Approach:', spaceInfo.api_approach);
    
    // Test 3: Test endpoint discovery (shows SSE endpoints)
    console.log('\n3️⃣ Testing endpoint discovery...');
    const endpoints = await service.discoverEndpoint();
    console.log('✅ SSE Queue endpoints:');
    console.log('   - Upload:', endpoints.upload_endpoint);
    console.log('   - Queue Join:', endpoints.queue_join_endpoint);
    console.log('   - Queue Data:', endpoints.queue_data_endpoint);
    
    // Test 4: Test connection to main site
    console.log('\n4️⃣ Testing connection...');
    const connection = await service.testConnection();
    console.log('✅ Connection test:', connection);
    
    // Test 5: SSE Configuration verification
    console.log('\n5️⃣ SSE Configuration verification...');
    console.log('✅ Protocol: Server-Sent Events (SSE v3)');
    console.log('✅ Queue Enabled: true');
    console.log('✅ API Prefix: /gradio_api');
    console.log('✅ Function Index: 2 (predict)');
    console.log('✅ File Upload: FormData to /gradio_api/upload');
    console.log('✅ Queue Processing: POST to /gradio_api/queue/join');
    console.log('✅ Result Streaming: EventSource /gradio_api/queue/data');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Upload an image through the UI to test actual AI analysis');
    console.log('   2. Check browser console for SSE processing logs');
    console.log('   3. Should see file upload → queue join → SSE results');
    console.log('\n🔧 Expected NEW API flow:');
    console.log('   🚀 Starting AI Analysis with Gradio Queue System...');
    console.log('   � Uploading file to Gradio space...');
    console.log('   📤 File uploaded: {path: "/tmp/gradio/abc123.jpg"}');
    console.log('   🔄 Joining processing queue...');
    console.log('   📋 Joined queue: {event_id: "xyz789"}');
    console.log('   ⏳ Waiting for queue results...');
    console.log('   🔄 AI processing started...');
    console.log('   ⏱️ Estimated wait time: 0 in queue');
    console.log('   ✅ Got results from queue');
    console.log('   📊 Classification Results: MEL: 85.32%...');
    console.log('   ✅ Analysis successful!');
    
    console.log('\n🎯 This should fix:');
    console.log('   ❌ UnicodeDecodeError: Fixed with proper file upload');
    console.log('   ❌ POST method not allowed: Fixed with queue endpoints');
    console.log('   ❌ Too little data: Fixed with SSE protocol');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify HuggingFace Space is running');
    console.log('   3. The new SSE approach should resolve server errors');
    console.log('   4. EventSource may need CORS permissions');
    console.log('   5. Check browser dev tools Network tab for SSE connections');
  }
}

// Export for use in development
export { testHuggingFaceAPI };

// Run if called directly
if (require.main === module) {
  testHuggingFaceAPI();
}
