#!/usr/bin/env python3
"""
Test script for Hugging Face Space API
"""

import requests
import os
import time
from io import BytesIO

def create_test_image():
    """Create a simple test image"""
    from PIL import Image
    img = Image.new('RGB', (224, 224), color='tan')
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    return buffer.getvalue()

def test_space_api(space_url):
    """Test the Hugging Face Space API"""
    print(f"🧪 Testing Space API: {space_url}")
    
    try:
        # Test if space is running
        health_url = f"{space_url}/"
        response = requests.get(health_url, timeout=10)
        print(f"📊 Space status: {response.status_code}")
        
        if response.status_code != 200:
            print("❌ Space is not ready yet. Please wait a few minutes for it to build.")
            return False
        
        # Test prediction API
        api_url = f"{space_url}/api/predict"
        image_data = create_test_image()
        
        files = {'data': ('test.jpg', image_data, 'image/jpeg')}
        
        print("🤖 Testing prediction API...")
        pred_response = requests.post(api_url, files=files, timeout=30)
        
        print(f"📊 Prediction status: {pred_response.status_code}")
        
        if pred_response.status_code == 200:
            result = pred_response.json()
            print("✅ Prediction successful!")
            print(f"   Result: {result}")
            return True
        else:
            print(f"❌ Prediction failed: {pred_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Space. It might still be building.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_backend_integration():
    """Test our backend integration"""
    print("\n🔗 Testing backend integration...")
    
    try:
        # Test the new Space endpoint
        response = requests.post(
            "http://localhost:8000/ai/predict-space",
            files={'file': ('test.jpg', create_test_image(), 'image/jpeg')},
            timeout=30
        )
        
        print(f"📊 Backend status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Backend integration successful!")
            print(f"   Result: {result}")
            return True
        else:
            print(f"❌ Backend integration failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend server not running. Start it with: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    space_url = "https://bnmbanhmi-seekwell-skin-cancer.hf.space"
    
    print("🚀 Testing Hugging Face Space Integration")
    print("=" * 50)
    
    # Test 1: Space API
    space_success = test_space_api(space_url)
    
    # Test 2: Backend integration (if space is working)
    backend_success = False
    if space_success:
        backend_success = test_backend_integration()
    
    # Summary
    print("\n📊 Test Summary")
    print("=" * 30)
    print(f"Space API: {'✅ PASS' if space_success else '❌ FAIL'}")
    print(f"Backend Integration: {'✅ PASS' if backend_success else '❌ FAIL'}")
    
    if space_success and backend_success:
        print("\n🎉 All tests passed! Your AI integration is working!")
        print("\n🔗 Next steps:")
        print("1. Update your frontend to use /ai/predict-space endpoint")
        print("2. Deploy to Render/Vercel")
        print("3. Test with real images")
    elif space_success:
        print("\n⚠️  Space is working but backend needs configuration.")
        print("Make sure HUGGINGFACE_SPACE_URL is set in .env")
    else:
        print("\n⏳ Space is still building. Wait 2-5 minutes and try again.")
        print(f"Check status at: {space_url}")
