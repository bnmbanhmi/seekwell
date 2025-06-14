from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Option 1: Direct Inference API (currently not working for this model)
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/bnmbanhmi/seekwell_skincancer_v2"

# Option 2: Hugging Face Space API (replace with your actual Space URL)
# SPACE_API_URL = "https://your-username-seekwell-skin-cancer.hf.space/api/predict"

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

@router.post("/predict", response_model=List[Dict[str, Any]])
async def predict_skin_cancer(file: UploadFile = File(...)):
    """
    Predict skin cancer from uploaded image using Hugging Face model
    """
    if not HUGGINGFACE_API_KEY:
        raise HTTPException(status_code=500, detail="Hugging Face API key not configured")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size (10MB limit)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
    
    try:
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                HUGGINGFACE_API_URL,
                headers=headers,
                content=contents
            )
        
        if response.status_code == 503:
            raise HTTPException(
                status_code=503, 
                detail="Model is loading, please try again in a few seconds"
            )
        
        if response.status_code == 403:
            # If Inference API fails due to permissions, return a helpful error
            raise HTTPException(
                status_code=503,
                detail="Model not available via Inference API. Please deploy to Hugging Face Space for free hosting. See README for instructions."
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Hugging Face API error: {response.text}"
            )
        
        result = response.json()
        
        # Format the response to ensure it's properly structured
        if isinstance(result, list):
            return result
        else:
            return [result]
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout - model may be loading")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/predict-space", response_model=List[Dict[str, Any]])
async def predict_skin_cancer_space(file: UploadFile = File(...)):
    """
    Predict skin cancer using Hugging Face Space API (alternative to Inference API)
    You need to deploy the huggingface_space_app.py to a Hugging Face Space first
    """
    space_url = os.getenv("HUGGINGFACE_SPACE_URL")
    
    if not space_url:
        raise HTTPException(
            status_code=500, 
            detail="HUGGINGFACE_SPACE_URL not configured. Please deploy to HF Space first."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size (10MB limit)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
    
    try:
        # Prepare form data for Space API
        files = {"data": (file.filename, contents, file.content_type)}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{space_url}/api/predict",
                files=files
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Space API error: {response.text}"
            )
        
        result = response.json()
        
        # Format the response to ensure it's properly structured
        if isinstance(result, list):
            return result
        else:
            return [result]
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout - Space may be loading")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Space prediction failed: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Health check endpoint for AI prediction service
    """
    return {
        "status": "healthy",
        "model": "bnmbanhmi/seekwell_skincancer_v2",
        "api_configured": bool(HUGGINGFACE_API_KEY)
    }
