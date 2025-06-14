#!/usr/bin/env python3
"""
Test script for AI Prediction API integration with Hugging Face model
"""

import asyncio
import aiohttp
import aiofiles
import os
import sys
import time
from typing import Optional
import json
from PIL import Image
import io
import base64

# Configuration
BASE_URL = "http://localhost:8000"  # Change this to your deployed URL
TEST_IMAGE_URL = "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400"  # Sample skin image
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

class AIModelTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_health_check(self):
        """Test the health check endpoint"""
        print("🔍 Testing health check endpoint...")
        try:
            async with self.session.get(f"{self.base_url}/ai/health") as response:
                data = await response.json()
                print(f"✅ Health check status: {response.status}")
                print(f"   Response: {json.dumps(data, indent=2)}")
                return response.status == 200
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
    
    async def create_test_image(self) -> bytes:
        """Create or download a test image"""
        print("📸 Preparing test image...")
        
        # Try to download a sample image
        try:
            async with self.session.get(TEST_IMAGE_URL) as response:
                if response.status == 200:
                    image_data = await response.read()
                    print("✅ Downloaded test image from URL")
                    return image_data
        except Exception as e:
            print(f"⚠️  Failed to download image: {e}")
        
        # Create a simple test image if download fails
        print("🎨 Creating synthetic test image...")
        img = Image.new('RGB', (224, 224), color='brown')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        return buffer.getvalue()
    
    async def test_prediction_endpoint(self, image_data: bytes):
        """Test the prediction endpoint with image data"""
        print("🤖 Testing AI prediction endpoint...")
        
        try:
            data = aiohttp.FormData()
            data.add_field('file', image_data, filename='test_image.jpg', content_type='image/jpeg')
            
            start_time = time.time()
            async with self.session.post(f"{self.base_url}/ai/predict", data=data) as response:
                response_time = time.time() - start_time
                
                print(f"📊 Response status: {response.status}")
                print(f"⏱️  Response time: {response_time:.2f}s")
                
                if response.status == 200:
                    result = await response.json()
                    print("✅ Prediction successful!")
                    print(f"   Results: {json.dumps(result, indent=2)}")
                    
                    # Analyze results
                    if isinstance(result, list) and len(result) > 0:
                        top_prediction = max(result, key=lambda x: x.get('score', 0))
                        print(f"🎯 Top prediction: {top_prediction['label']} ({top_prediction['score']:.2%})")
                    
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Prediction failed: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Prediction test failed: {e}")
            return False
    
    async def test_invalid_file(self):
        """Test with invalid file types"""
        print("🧪 Testing with invalid file...")
        
        try:
            # Create a text file
            text_data = b"This is not an image file"
            data = aiohttp.FormData()
            data.add_field('file', text_data, filename='test.txt', content_type='text/plain')
            
            async with self.session.post(f"{self.base_url}/ai/predict", data=data) as response:
                print(f"📊 Invalid file response status: {response.status}")
                
                if response.status == 400:
                    print("✅ Correctly rejected invalid file type")
                    return True
                else:
                    print("❌ Should have rejected invalid file type")
                    return False
                    
        except Exception as e:
            print(f"❌ Invalid file test failed: {e}")
            return False
    
    async def test_large_file(self):
        """Test with large file"""
        print("📏 Testing with large file...")
        
        try:
            # Create a large image (>10MB)
            large_img = Image.new('RGB', (4000, 4000), color='red')
            buffer = io.BytesIO()
            large_img.save(buffer, format='JPEG', quality=95)
            large_data = buffer.getvalue()
            
            print(f"   Created {len(large_data) / (1024*1024):.1f}MB image")
            
            data = aiohttp.FormData()
            data.add_field('file', large_data, filename='large_image.jpg', content_type='image/jpeg')
            
            async with self.session.post(f"{self.base_url}/ai/predict", data=data) as response:
                print(f"📊 Large file response status: {response.status}")
                
                if response.status == 400:
                    print("✅ Correctly rejected large file")
                    return True
                elif response.status == 200:
                    print("✅ Successfully processed large file")
                    return True
                else:
                    print("❌ Unexpected response for large file")
                    return False
                    
        except Exception as e:
            print(f"❌ Large file test failed: {e}")
            return False

async def run_direct_hf_test():
    """Test direct Hugging Face API call"""
    print("\n🤗 Testing direct Hugging Face API...")
    
    if not HF_API_KEY:
        print("❌ HUGGINGFACE_API_KEY not set, skipping direct API test")
        return False
    
    try:
        # Create test image
        img = Image.new('RGB', (224, 224), color='tan')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        image_data = buffer.getvalue()
        
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            
            async with session.post(
                "https://api-inference.huggingface.co/models/bnmbanhmi/seekwell_skincancer_v2",
                headers=headers,
                data=image_data
            ) as response:
                print(f"📊 HF API status: {response.status}")
                
                if response.status == 200:
                    result = await response.json()
                    print("✅ Direct HF API call successful!")
                    print(f"   Result: {json.dumps(result, indent=2)}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ HF API failed: {error_text}")
                    return False
                    
    except Exception as e:
        print(f"❌ Direct HF API test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting AI Model Integration Tests")
    print("=" * 50)
    
    # Check environment
    print(f"🔧 Base URL: {BASE_URL}")
    print(f"🔑 HF API Key configured: {'✅' if HF_API_KEY else '❌'}")
    print()
    
    # Test direct HF API first
    await run_direct_hf_test()
    print()
    
    # Test our API
    async with AIModelTester(BASE_URL) as tester:
        tests = [
            ("Health Check", tester.test_health_check()),
            ("Valid Image Prediction", tester.test_prediction_endpoint(await tester.create_test_image())),
            ("Invalid File Type", tester.test_invalid_file()),
            ("Large File", tester.test_large_file()),
        ]
        
        results = []
        for test_name, test_coro in tests:
            print(f"\n📋 Running: {test_name}")
            print("-" * 30)
            result = await test_coro
            results.append((test_name, result))
            print()
    
    # Summary
    print("📊 Test Summary")
    print("=" * 50)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your AI integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    # Check if server is likely running
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
    
    print("💡 Usage: python test_ai_prediction.py [BASE_URL]")
    print(f"   Using BASE_URL: {BASE_URL}")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Test runner failed: {e}")
        sys.exit(1)
