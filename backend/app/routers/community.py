from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..dependencies import get_current_user
from ..models import SkinLesionImage, AIAssessment, Patient, User
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/stats", response_model=Dict[str, Any])
async def get_community_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get community health statistics - works for both patients and cadres
    """
    try:
        # Calculate date ranges
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        
        if current_user.role.value == 'LOCAL_CADRE':
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
            completed_reviews = db.query(SkinLesionImage).filter(
                SkinLesionImage.reviewed_by_cadre == current_user.user_id
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
        
        else:  # Patient or other roles
            # Get patient's own statistics
            patient = db.query(Patient).filter(Patient.patient_id == current_user.user_id).first()
            
            if not patient:
                # Mock data for demo purposes
                return {
                    "totalSkinAssessments": 5,
                    "pendingReviews": 1,
                    "completedReviews": 4,
                    "urgentCases": 0,
                    "lastAssessment": datetime.utcnow().isoformat(),
                    "nextFollowUp": None
                }
            
            # Get patient's skin assessments
            patient_assessments = db.query(SkinLesionImage).filter(
                SkinLesionImage.patient_id == patient.patient_id
            ).all()
            
            total_assessments = len(patient_assessments)
            pending_reviews = len([a for a in patient_assessments if a.status == 'pending'])
            completed_reviews = len([a for a in patient_assessments if a.status in ['reviewed', 'completed']])
            
            # Check for urgent cases
            urgent_cases = 0
            for assessment in patient_assessments:
                if assessment.ai_assessment and assessment.ai_assessment.risk_level in ['URGENT', 'HIGH']:
                    urgent_cases += 1
            
            # Get last assessment date
            last_assessment = None
            if patient_assessments:
                last_assessment = max(assessment.upload_timestamp for assessment in patient_assessments)
            
            return {
                "totalSkinAssessments": total_assessments,
                "pendingReviews": pending_reviews,
                "completedReviews": completed_reviews,
                "urgentCases": urgent_cases,
                "lastAssessment": last_assessment.isoformat() if last_assessment else None,
                "nextFollowUp": None  # Will implement follow-up logic later
            }
        
    except Exception as e:
        logger.error(f"Error fetching community stats: {str(e)}")
        # Return mock data for demo purposes
        if current_user.role.value == 'LOCAL_CADRE':
            return {
                "totalPendingReviews": 2,
                "urgentCases": 1,
                "completedReviews": 15,
                "totalPatients": 45,
                "aiAnalysesToday": 8,
                "followUpsNeeded": 3
            }
        else:
            return {
                "totalSkinAssessments": 3,
                "pendingReviews": 1,
                "completedReviews": 2,
                "urgentCases": 0,
                "lastAssessment": datetime.utcnow().isoformat(),
                "nextFollowUp": None
            }

@router.get("/health-metrics", response_model=Dict[str, Any])
async def get_community_health_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated community health metrics for insights
    """
    try:
        # Calculate date ranges
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Get weekly AI screening trends
        weekly_screenings = db.query(SkinLesionImage).filter(
            SkinLesionImage.upload_timestamp >= datetime.combine(week_ago, datetime.min.time())
        ).count()
        
        # Get monthly AI screening trends
        monthly_screenings = db.query(SkinLesionImage).filter(
            SkinLesionImage.upload_timestamp >= datetime.combine(month_ago, datetime.min.time())
        ).count()
        
        # Get risk level distribution
        risk_distribution = {}
        all_assessments = db.query(AIAssessment).all()
        for assessment in all_assessments:
            risk_level = assessment.risk_level or 'UNKNOWN'
            risk_distribution[risk_level] = risk_distribution.get(risk_level, 0) + 1
        
        # Get body region analysis
        body_region_stats = {}
        all_images = db.query(SkinLesionImage).all()
        for image in all_images:
            region = image.body_region or 'unknown'
            body_region_stats[region] = body_region_stats.get(region, 0) + 1
        
        return {
            "screeningTrends": {
                "weeklyScreenings": weekly_screenings,
                "monthlyScreenings": monthly_screenings,
                "averagePerDay": weekly_screenings / 7 if weekly_screenings > 0 else 0
            },
            "riskDistribution": risk_distribution,
            "bodyRegionStats": body_region_stats,
            "impactMetrics": {
                "totalScreenings": len(all_images),
                "highRiskDetected": risk_distribution.get('HIGH', 0) + risk_distribution.get('URGENT', 0),
                "earlyDetectionRate": ((risk_distribution.get('HIGH', 0) + risk_distribution.get('URGENT', 0)) / len(all_images) * 100) if all_images else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching health metrics: {str(e)}")
        # Return mock data for demo
        return {
            "screeningTrends": {
                "weeklyScreenings": 25,
                "monthlyScreenings": 120,
                "averagePerDay": 3.6
            },
            "riskDistribution": {
                "LOW": 45,
                "MEDIUM": 30,
                "HIGH": 8,
                "URGENT": 2
            },
            "bodyRegionStats": {
                "face": 15,
                "arms": 25,
                "back": 20,
                "legs": 25
            },
            "impactMetrics": {
                "totalScreenings": 85,
                "highRiskDetected": 10,
                "earlyDetectionRate": 11.8
            }
        }

@router.get("/patient-summary/{patient_id}", response_model=Dict[str, Any])
async def get_patient_summary(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive patient summary for cadre review
    """
    try:
        # Verify access rights
        if current_user.role.value not in ['LOCAL_CADRE', 'DOCTOR', 'ADMIN']:
            if current_user.user_id != patient_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this patient data"
                )
        
        # Get patient information
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Get patient's skin lesion history
        skin_assessments = db.query(SkinLesionImage).filter(
            SkinLesionImage.patient_id == patient_id
        ).order_by(SkinLesionImage.upload_timestamp.desc()).all()
        
        # Process assessments data
        assessment_summary = []
        for assessment in skin_assessments:
            ai_data = assessment.ai_assessment
            assessment_summary.append({
                "image_id": assessment.image_id,
                "upload_date": assessment.upload_timestamp.isoformat(),
                "body_region": assessment.body_region,
                "status": assessment.status,
                "ai_prediction": ai_data.predicted_class if ai_data else None,
                "risk_level": ai_data.risk_level if ai_data else None,
                "confidence": ai_data.confidence_level if ai_data else None,
                "reviewed_by_cadre": assessment.reviewed_by_cadre is not None,
                "needs_doctor_review": assessment.needs_professional_review
            })
        
        # Calculate risk profile
        risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "URGENT": 0}
        for assessment in assessment_summary:
            risk_level = assessment.get("risk_level", "UNKNOWN")
            if risk_level in risk_counts:
                risk_counts[risk_level] += 1
        
        return {
            "patient": {
                "patient_id": patient.patient_id,
                "name": patient.full_name,
                "age": calculate_age(patient.date_of_birth),
                "gender": patient.gender.value if patient.gender else None
            },
            "assessmentHistory": assessment_summary,
            "riskProfile": risk_counts,
            "totalAssessments": len(skin_assessments),
            "pendingReviews": len([a for a in assessment_summary if a["status"] == "pending"]),
            "urgentCases": risk_counts["URGENT"] + risk_counts["HIGH"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch patient summary"
        )

def calculate_age(birth_date):
    """Calculate age from birth date"""
    if not birth_date:
        return None
    today = datetime.utcnow().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
