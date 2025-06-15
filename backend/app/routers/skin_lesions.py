"""
Skin Lesions Router
API endpoints for skin lesion analysis and management.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import logging
from PIL import Image
import io

from ..database import get_db
from ..dependencies import get_current_user, get_current_active_local_cadre, get_current_doctor
from ..models import User, Doctor
from ..services.lesion_service import lesion_service
from ..services.ai_integration import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skin-lesions", tags=["skin-lesions"])


@router.post("/upload-and-analyze")
async def upload_and_analyze_lesion(
    image: UploadFile = File(...),
    body_region: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and analyze a skin lesion image.
    """
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and convert image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Analyze the lesion
        analysis_result = await lesion_service.analyze_skin_lesion(
            image=pil_image,
            patient_id=current_user.user_id,  # For now, use current user as patient
            body_region=body_region,
            notes=notes
        )
        
        if not analysis_result["success"]:
            raise HTTPException(status_code=500, detail=analysis_result["error"])
        
        # Format for display
        display_result = lesion_service.format_analysis_for_display(analysis_result)
        
        return {
            "success": True,
            "message": "Skin lesion analysis completed",
            "analysis": display_result["display_data"],
            "needs_review": {
                "cadre": analysis_result["needs_cadre_review"],
                "doctor": analysis_result["needs_doctor_review"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in lesion analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during analysis")


@router.get("/analysis-history/{patient_id}")
async def get_patient_analysis_history(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analysis history for a patient.
    """
    # For now, return placeholder data
    # This would integrate with the database to get actual history
    
    return {
        "patient_id": patient_id,
        "analyses": [],
        "total_count": 0,
        "message": "Analysis history will be available after database integration"
    }


@router.get("/pending-reviews")
async def get_pending_reviews(
    risk_level: Optional[str] = None,
    current_user: User = Depends(get_current_active_local_cadre),
    db: Session = Depends(get_db)
):
    """
    Get pending lesion analyses that need cadre review.
    Only accessible by local cadres.
    """
    risk_levels = [risk_level] if risk_level else None
    queue = lesion_service.get_risk_priority_queue(risk_levels)
    
    return {
        "queue_info": queue["queue_info"],
        "pending_reviews": queue["pending_reviews"],
        "message": "Review queue will be populated from database"
    }


@router.post("/cadre-review/{analysis_id}")
async def submit_cadre_review(
    analysis_id: int,
    review_notes: str = Form(...),
    escalate_to_doctor: bool = Form(False),
    current_user: User = Depends(get_current_active_local_cadre),
    db: Session = Depends(get_db)
):
    """
    Submit cadre review for a skin lesion analysis.
    Only accessible by local cadres.
    """
    try:
        # This would integrate with database to save the review
        review_data = {
            "analysis_id": analysis_id,
            "reviewer_id": current_user.user_id,
            "review_notes": review_notes,
            "escalate_to_doctor": escalate_to_doctor,
            "review_timestamp": lesion_service._get_current_timestamp()
        }
        
        return {
            "success": True,
            "message": "Cadre review submitted successfully",
            "review_data": review_data
        }
        
    except Exception as e:
        logger.error(f"Error submitting cadre review: {e}")
        raise HTTPException(status_code=500, detail="Error submitting review")


@router.post("/doctor-consultation/{analysis_id}")
async def submit_doctor_consultation(
    analysis_id: int,
    diagnosis: str = Form(...),
    treatment_plan: str = Form(...),
    follow_up_days: Optional[int] = Form(None),
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Submit doctor consultation for a skin lesion analysis.
    Only accessible by doctors.
    """
    try:
        # This would integrate with database to save the consultation
        consultation_data = {
            "analysis_id": analysis_id,
            "doctor_id": current_user.user_id,
            "diagnosis": diagnosis,
            "treatment_plan": treatment_plan,
            "follow_up_days": follow_up_days,
            "consultation_timestamp": lesion_service._get_current_timestamp()
        }
        
        return {
            "success": True,
            "message": "Doctor consultation submitted successfully",
            "consultation_data": consultation_data
        }
        
    except Exception as e:
        logger.error(f"Error submitting doctor consultation: {e}")
        raise HTTPException(status_code=500, detail="Error submitting consultation")


@router.get("/ai-service-status")
async def get_ai_service_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get current status of the AI service.
    """
    try:
        status = ai_service.get_service_status()
        return {
            "success": True,
            "ai_service_status": status
        }
    except Exception as e:
        logger.error(f"Error getting AI service status: {e}")
        return {
            "success": False,
            "error": str(e),
            "ai_service_status": {"is_initialized": False}
        }


@router.post("/initialize-ai-service")
async def initialize_ai_service(
    current_user: User = Depends(get_current_user)
):
    """
    Initialize the AI service (for development/testing).
    """
    try:
        success = await ai_service.initialize()
        
        if success:
            return {
                "success": True,
                "message": "AI service initialized successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to initialize AI service"
            }
            
    except Exception as e:
        logger.error(f"Error initializing AI service: {e}")
        raise HTTPException(status_code=500, detail="Error initializing AI service")
