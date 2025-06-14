#!/usr/bin/env python3
"""
Simple test script for AI Prediction API integration
Uses only standard libraries and requests
"""

import requests
import os
import sys
import time
import json
from io import BytesIO
import base64

# Configuration
BASE_URL = "http://localhost:8000"  # Change this to your deployed URL
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

def create_simple_test_image() -> bytes:
    """Create a simple test image using basic image data"""
    # Create a minimal JPEG header + data (this is a very basic approach)
    # For real testing, you'd want to use PIL or download a real image
    
    # Simple 2x2 pixel JPEG (minimal valid JPEG)
    jpeg_data = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x02,
        0x00, 0x02, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02,
        0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00,
        0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xD2, 0xCF, 0x20, 0xFF, 0xD9
    ])
    
    return jpeg_data

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/ai/health", timeout=10)
        print(f"✅ Health check status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_prediction_endpoint():
    """Test the prediction endpoint with image data"""
    print("🤖 Testing AI prediction endpoint...")
    
    try:
        # Use the simple test image
        image_data = create_simple_test_image()
        
        files = {'file': ('test_image.jpg', image_data, 'image/jpeg')}
        
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/ai/predict", files=files, timeout=30)
        response_time = time.time() - start_time
        
        print(f"📊 Response status: {response.status_code}")
        print(f"⏱️  Response time: {response_time:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"   Results: {json.dumps(result, indent=2)}")
            
            # Analyze results
            if isinstance(result, list) and len(result) > 0:
                top_prediction = max(result, key=lambda x: x.get('score', 0))
                print(f"🎯 Top prediction: {top_prediction['label']} ({top_prediction['score']:.2%})")
            
            return True
        else:
            print(f"❌ Prediction failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")
        return False

def test_invalid_file():
    """Test with invalid file types"""
    print("🧪 Testing with invalid file...")
    
    try:
        # Create a text file
        text_data = b"This is not an image file"
        files = {'file': ('test.txt', text_data, 'text/plain')}
        
        response = requests.post(f"{BASE_URL}/ai/predict", files=files, timeout=10)
        print(f"📊 Invalid file response status: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected invalid file type")
            return True
        else:
            print("❌ Should have rejected invalid file type")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Invalid file test failed: {e}")
        return False

def test_direct_hf_api():
    """Test direct Hugging Face API call"""
    print("🤗 Testing direct Hugging Face API...")
    
    if not HF_API_KEY:
        print("❌ HUGGINGFACE_API_KEY not set, skipping direct API test")
        return False
    
    try:
        image_data = create_simple_test_image()
        
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        
        response = requests.post(
            "https://api-inference.huggingface.co/models/bnmbanhmi/seekwell_skincancer_v2",
            headers=headers,
            data=image_data,
            timeout=30
        )
        
        print(f"📊 HF API status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Direct HF API call successful!")
            print(f"   Result: {json.dumps(result, indent=2)}")
            return True
        elif response.status_code == 503:
            print("⏳ Model is loading, this is normal for the first request")
            return True
        else:
            print(f"❌ HF API failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Direct HF API test failed: {e}")
        return False

def test_server_connectivity():
    """Test if the server is running"""
    print("🌐 Testing server connectivity...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running")
            data = response.json()
            print(f"   Server info: {data}")
            return True
        else:
            print(f"❌ Server responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
        print(f"   Trying to connect to: {BASE_URL}")
        return False
    except Exception as e:
        print(f"❌ Server connectivity test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting AI Model Integration Tests")
    print("=" * 50)
    
    # Check environment
    print(f"🔧 Base URL: {BASE_URL}")
    print(f"🔑 HF API Key configured: {'✅' if HF_API_KEY else '❌'}")
    print()
    
    # Run tests
    tests = [
        ("Server Connectivity", test_server_connectivity),
        ("Direct HF API", test_direct_hf_api),
        ("Health Check", test_health_check),
        ("Valid Image Prediction", test_prediction_endpoint),
        ("Invalid File Type", test_invalid_file),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 30)
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"💥 Test {test_name} crashed: {e}")
            results.append((test_name, False))
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
        
        # Provide troubleshooting tips
        print("\n💡 Troubleshooting tips:")
        print("1. Make sure your FastAPI server is running")
        print("2. Check that HUGGINGFACE_API_KEY is set in your environment")
        print("3. Verify the model URL is correct")
        print("4. Try running the server with: uvicorn app.main:app --reload")

if __name__ == "__main__":
    # Check if server URL is provided
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
    
    print("💡 Usage: python simple_test.py [BASE_URL]")
    print(f"   Using BASE_URL: {BASE_URL}")
    print()
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Test runner failed: {e}")
        sys.exit(1)
