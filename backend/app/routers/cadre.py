from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..dependencies import get_current_active_local_cadre, get_current_user
from ..models import SkinLesionImage, AIAssessment, CadreReview, User, Patient
from ..schemas import CadreReviewCreate, CadreReviewResponse
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/pending-reviews", response_model=List[Dict[str, Any]])
async def get_pending_reviews(
    current_user: User = Depends(get_current_active_local_cadre),
    db: Session = Depends(get_db)
):
    """
    Get all pending skin lesion reviews for the current cadre
    """
    try:
        # Query for pending skin lesion images that need cadre review
        pending_reviews = db.query(SkinLesionImage).join(
            Patient, SkinLesionImage.patient_id == Patient.patient_id
        ).join(
            AIAssessment, SkinLesionImage.image_id == AIAssessment.image_id
        ).filter(
            SkinLesionImage.status == 'pending',
            SkinLesionImage.reviewed_by_cadre.is_(None)
        ).all()
        
        result = []
        for review in pending_reviews:
            patient = db.query(Patient).filter(Patient.patient_id == review.patient_id).first()
            ai_assessment = review.ai_assessment
            
            result.append({
                "image_id": review.image_id,
                "patient_name": patient.full_name if patient else "Unknown Patient",
                "upload_timestamp": review.upload_timestamp.isoformat(),
                "body_region": review.body_region,
                "ai_prediction": ai_assessment.predicted_class if ai_assessment else "No prediction",
                "confidence_score": ai_assessment.confidence_level if ai_assessment else 0.0,
                "risk_level": ai_assessment.risk_level if ai_assessment else "UNKNOWN",
                "status": review.status
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching pending reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending reviews"
        )

@router.get("/urgent-reviews", response_model=List[Dict[str, Any]])
async def get_urgent_reviews(
    current_user: User = Depends(get_current_active_local_cadre),
    db: Session = Depends(get_db)
):
    """
    Get urgent skin lesion reviews that require immediate attention
    """
    try:
        urgent_reviews = db.query(SkinLesionImage).join(
            AIAssessment, SkinLesionImage.image_id == AIAssessment.image_id
        ).join(
            Patient, SkinLesionImage.patient_id == Patient.patient_id
        ).filter(
            SkinLesionImage.status == 'pending',
            AIAssessment.risk_level.in_(['URGENT', 'HIGH']),
            SkinLesionImage.reviewed_by_cadre.is_(None)
        ).order_by(AIAssessment.created_at.desc()).all()
        
        result = []
        for review in urgent_reviews:
            patient = db.query(Patient).filter(Patient.patient_id == review.patient_id).first()
            ai_assessment = review.ai_assessment
            
            result.append({
                "image_id": review.image_id,
                "patient_name": patient.full_name if patient else "Unknown Patient",
                "upload_timestamp": review.upload_timestamp.isoformat(),
                "body_region": review.body_region,
                "ai_prediction": ai_assessment.predicted_class if ai_assessment else "No prediction",
                "confidence_score": ai_assessment.confidence_level if ai_assessment else 0.0,
                "risk_level": ai_assessment.risk_level if ai_assessment else "UNKNOWN",
                "status": review.status,
                "urgency_hours": (datetime.utcnow() - review.upload_timestamp).total_seconds() / 3600
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching urgent reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch urgent reviews"
        )

@router.post("/review/{image_id}", response_model=CadreReviewResponse)
async def submit_cadre_review(
    image_id: int,
    review_data: CadreReviewCreate,
    current_user: User = Depends(get_current_active_local_cadre),
    db: Session = Depends(get_db)
):
    """
    Submit cadre review for a skin lesion analysis
    """
    try:
        # Check if image exists and is pending
        skin_lesion = db.query(SkinLesionImage).filter(
            SkinLesionImage.image_id == image_id,
            SkinLesionImage.status == 'pending'
        ).first()
        
        if not skin_lesion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skin lesion image not found or already reviewed"
            )
        
        # Create cadre review
        cadre_review = CadreReview(
            image_id=image_id,
            cadre_id=current_user.user_id,
            review_notes=review_data.review_notes,
            agrees_with_ai=review_data.agrees_with_ai,
            escalate_to_doctor=review_data.escalate_to_doctor,
            local_recommendations=review_data.local_recommendations,
            review_timestamp=datetime.utcnow()
        )
        
        db.add(cadre_review)
        
        # Update skin lesion status
        skin_lesion.reviewed_by_cadre = current_user.user_id
        if review_data.escalate_to_doctor:
            skin_lesion.status = 'escalated'
            skin_lesion.needs_professional_review = True
        else:
            skin_lesion.status = 'reviewed'
        
        db.commit()
        db.refresh(cadre_review)
        
        return {
            "review_id": cadre_review.review_id,
            "message": "Cadre review submitted successfully",
            "status": skin_lesion.status,
            "escalated": review_data.escalate_to_doctor
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error submitting cadre review: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit cadre review"
        )

@router.get("/review/{image_id}", response_model=Dict[str, Any])
async def get_review_details(
    image_id: int,
    current_user: User = Depends(get_current_active_local_cadre),
    db: Session = Depends(get_db)
):
    """
    Get detailed information for cadre review
    """
    try:
        # Get skin lesion with related data
        skin_lesion = db.query(SkinLesionImage).filter(
            SkinLesionImage.image_id == image_id
        ).first()
        
        if not skin_lesion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skin lesion image not found"
            )
        
        # Get patient information
        patient = db.query(Patient).filter(
            Patient.patient_id == skin_lesion.patient_id
        ).first()
        
        # Get AI assessment
        ai_assessment = skin_lesion.ai_assessment
        
        return {
            "image_id": skin_lesion.image_id,
            "patient": {
                "name": patient.full_name if patient else "Unknown Patient",
                "age": calculate_age(patient.date_of_birth) if patient else None,
                "gender": patient.gender.value if patient else None
            },
            "image_info": {
                "upload_timestamp": skin_lesion.upload_timestamp.isoformat(),
                "body_region": skin_lesion.body_region,
                "notes": skin_lesion.notes,
                "image_path": skin_lesion.image_path
            },
            "ai_analysis": {
                "predicted_class": ai_assessment.predicted_class if ai_assessment else None,
                "risk_level": ai_assessment.risk_level if ai_assessment else None,
                "confidence_level": ai_assessment.confidence_level if ai_assessment else None,
                "recommendations": ai_assessment.recommendations if ai_assessment else None,
                "all_predictions": ai_assessment.all_predictions if ai_assessment else None
            },
            "status": skin_lesion.status
        }
        
    except Exception as e:
        logger.error(f"Error fetching review details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch review details"
        )

@router.get("/community-stats", response_model=Dict[str, Any])
async def get_community_stats(
    current_user: User = Depends(get_current_active_local_cadre),
    db: Session = Depends(get_db)
):
    """
    Get community health statistics for cadre dashboard
    """
    try:
        # Calculate date ranges
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        
        # Get pending reviews count
        total_pending = db.query(SkinLesionImage).filter(
            SkinLesionImage.status == 'pending',
            SkinLesionImage.reviewed_by_cadre.is_(None)
        ).count()
        
        # Get urgent cases count
        urgent_cases = db.query(SkinLesionImage).join(
            AIAssessment, SkinLesionImage.image_id == AIAssessment.image_id
        ).filter(
            SkinLesionImage.status == 'pending',
            AIAssessment.risk_level.in_(['URGENT', 'HIGH']),
            SkinLesionImage.reviewed_by_cadre.is_(None)
        ).count()
        
        # Get completed reviews count
        completed_reviews = db.query(CadreReview).filter(
            CadreReview.cadre_id == current_user.user_id
        ).count()
        
        # Get total patients count (approximate community size)
        total_patients = db.query(Patient).count()
        
        # Get AI analyses today
        ai_analyses_today = db.query(SkinLesionImage).filter(
            SkinLesionImage.upload_timestamp >= datetime.combine(today, datetime.min.time())
        ).count()
        
        # Get follow-ups needed
        follow_ups_needed = db.query(SkinLesionImage).join(
            AIAssessment, SkinLesionImage.image_id == AIAssessment.image_id
        ).filter(
            AIAssessment.follow_up_needed == True,
            SkinLesionImage.status == 'reviewed'
        ).count()
        
        return {
            "totalPendingReviews": total_pending,
            "urgentCases": urgent_cases,
            "completedReviews": completed_reviews,
            "totalPatients": total_patients,
            "aiAnalysesToday": ai_analyses_today,
            "followUpsNeeded": follow_ups_needed
        }
        
    except Exception as e:
        logger.error(f"Error fetching community stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch community statistics"
        )

def calculate_age(birth_date):
    """Calculate age from birth date"""
    if not birth_date:
        return None
    today = datetime.utcnow().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
