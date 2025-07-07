"""
Skin Lesions Router
API endpoints for skin lesion analysis and management.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
import logging
from PIL import Image
import io

from ..database import get_db
from ..dependencies import get_current_user, get_current_active_local_cadre, get_current_doctor
from ..models import User, Doctor, UserRole
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


@router.get("/history")
async def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analysis history based on user role:
    - Patients: Only their own analysis history
    - Cadres: All analysis history from the community
    - Doctors/Admin: All analysis history
    """
    from ..models import SkinLesionImage, AIAssessment, Patient
    from sqlalchemy.orm import joinedload
    
    try:
        # Build base query
        query = db.query(SkinLesionImage).options(
            joinedload(SkinLesionImage.ai_assessment),
            joinedload(SkinLesionImage.patient)
        )
        
        # Apply role-based filtering
        if current_user.role.value == UserRole.PATIENT.value:
            # Patients can only see their own history
            query = query.filter(SkinLesionImage.patient_id == current_user.user_id)
        elif current_user.role.value == UserRole.LOCAL_CADRE.value:
            # Cadres can see all analyses (for community health monitoring)
            pass  # No additional filter needed
        elif current_user.role.value in [UserRole.DOCTOR.value, UserRole.ADMIN.value]:
            # Doctors and admins can see all analyses
            pass  # No additional filter needed
        else:
            # Other roles get no access
            return {"analyses": [], "total_count": 0}
        
        # Order by most recent first
        skin_lesions = query.order_by(SkinLesionImage.upload_timestamp.desc()).all()
        
        # Format the results
        analyses = []
        for lesion in skin_lesions:
            ai_assessment = lesion.ai_assessment
            patient = lesion.patient
            
            if ai_assessment:
                analysis_data = {
                    "success": True,
                    "image_id": lesion.image_id,
                    "patient_id": lesion.patient_id,
                    "patient_name": patient.full_name if patient else "Unknown Patient",
                    "predictions": [
                        {
                            "class_id": 1,
                            "label": ai_assessment.predicted_class,
                            "confidence": float(ai_assessment.confidence_level or 0.0),
                            "percentage": float(ai_assessment.confidence_level or 0.0) * 100
                        }
                    ],
                    "top_prediction": {
                        "label": ai_assessment.predicted_class,
                        "confidence": float(ai_assessment.confidence_level or 0.0),
                        "percentage": float(ai_assessment.confidence_level or 0.0) * 100
                    },
                    "analysis": {
                        "predicted_class": ai_assessment.predicted_class,
                        "confidence": float(ai_assessment.confidence_level or 0.0),
                        "body_region": lesion.body_region,
                        "analysis_timestamp": lesion.upload_timestamp.isoformat()
                    },
                    "risk_assessment": {
                        "risk_level": ai_assessment.risk_level,
                        "confidence_level": ai_assessment.confidence_level,
                        "needs_professional_review": ai_assessment.needs_professional_review or False,
                        "needs_urgent_attention": ai_assessment.risk_level in ['URGENT', 'HIGH'],
                        "base_risk": ai_assessment.risk_level,
                        "confidence_score": float(ai_assessment.confidence_level or 0.0),
                        "predicted_class": ai_assessment.predicted_class
                    },
                    "recommendations": [
                        "Consult with healthcare provider",
                        "Monitor for changes",
                        "Follow up as recommended"
                    ],
                    "workflow": {
                        "needs_cadre_review": lesion.reviewed_by_cadre is None and ai_assessment.risk_level in ['MEDIUM', 'HIGH'],
                        "needs_doctor_review": lesion.reviewed_by_doctor is None and ai_assessment.risk_level in ['HIGH', 'URGENT'],
                        "priority_level": ai_assessment.risk_level,
                        "estimated_follow_up_days": 30 if ai_assessment.risk_level == 'LOW' else 14 if ai_assessment.risk_level == 'MEDIUM' else 7
                    },
                    "timestamp": lesion.upload_timestamp.isoformat()
                }
                analyses.append(analysis_data)
        
        return {
            "analyses": analyses,
            "total_count": len(analyses)
        }
        
    except Exception as e:
        logger.error(f"Error fetching analysis history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analysis history"
        )


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
