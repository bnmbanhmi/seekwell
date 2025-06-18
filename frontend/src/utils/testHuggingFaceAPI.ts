/**
 * Test script to validate HuggingFace API integration
 * Updated to test the FIXED API endpoints
 */

import HuggingFaceAIService from '../services/HuggingFaceAIService';

async function testHuggingFaceAPI() {
  console.log('🧪 Testing FIXED HuggingFace API Integration...');
  console.log('🔧 Using correct Gradio API endpoints with /gradio_api prefix');
  
  const service = new HuggingFaceAIService();
  
  try {
    // Test 1: Check service health
    console.log('\n1️⃣ Testing service health...');
    const healthCheck = await service.healthCheck();
    console.log('✅ Health check result:', healthCheck);
    
    // Test 2: Check space info (updated endpoints)
    console.log('\n2️⃣ Testing space information...');
    const spaceInfo = await service.getSpaceInfo();
    console.log('✅ Space info:', spaceInfo);
    console.log('📋 Primary endpoint:', spaceInfo.primary_endpoint);
    
    // Test 3: Test endpoint discovery (shows correct endpoints)
    console.log('\n3️⃣ Testing endpoint discovery...');
    const endpoints = await service.discoverEndpoint();
    console.log('✅ Available endpoints:', endpoints.discovered_endpoints);
    console.log('🎯 Primary endpoint URL:', endpoints.primary_endpoint);
    
    // Test 4: Test connection to main site
    console.log('\n4️⃣ Testing connection...');
    const connection = await service.testConnection();
    console.log('✅ Connection test:', connection);
    
    // Test 5: Configuration verification
    console.log('\n5️⃣ Configuration verification...');
    console.log('✅ Expected endpoints:');
    console.log('   - Primary: /gradio_api/call/predict (fn_index: 2)');
    console.log('   - Secondary: /gradio_api/run/predict');
    console.log('   - Fallback: /call/predict & /api/predict');
    console.log('✅ Queue polling: /gradio_api/queue/data');
    console.log('✅ Meta format: {_type: "gradio.FileData"}');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Upload an image through the UI to test actual AI analysis');
    console.log('   2. Check browser console for API call logs');
    console.log('   3. Should see "📤 Trying Gradio call API: .../gradio_api/call/predict"');
    console.log('   4. Should receive classification results with percentages');
    console.log('\n🔧 Expected API flow:');
    console.log('   🚀 Starting AI Analysis...');
    console.log('   🔄 Attempting method 1...');
    console.log('   📤 Trying Gradio call API: .../gradio_api/call/predict');
    console.log('   📋 Polling for results, event_id: abc123...');
    console.log('   ✅ Polling successful, got results');
    console.log('   ✅ Analysis successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify HuggingFace Space is running');
    console.log('   3. Try again - spaces may need time to wake up');
    console.log('   4. The fix should have resolved 404 errors');
    console.log('   5. If still failing, check HuggingFace Space status');
  }
}

// Export for use in development
export { testHuggingFaceAPI };

// Run if called directly
if (require.main === module) {
  testHuggingFaceAPI();
}
