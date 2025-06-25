from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..dependencies import get_current_user
from ..models import (
    User, Patient, SkinLesionImage, AIAssessment, 
    CommunityHealthCenter, Appointment
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/overview", response_model=Dict[str, Any])
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analytics overview for community health
    """
    try:
        # Calculate date ranges
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Basic counts
        total_patients = db.query(Patient).count()
        total_cases = db.query(SkinLesionImage).count()
        total_ai_assessments = db.query(AIAssessment).count()
        total_centers = db.query(CommunityHealthCenter).count()
        
        # Risk distribution
        risk_distribution = db.query(
            AIAssessment.risk_level,
            func.count(AIAssessment.id).label('count')
        ).group_by(AIAssessment.risk_level).all()
        
        risk_data = {risk.risk_level.value if hasattr(risk.risk_level, 'value') else str(risk.risk_level): risk.count 
                    for risk in risk_distribution}
        
        # Recent cases (last 7 days)
        recent_cases = db.query(SkinLesionImage).filter(
            SkinLesionImage.uploaded_at >= week_ago
        ).count()
        
        # High risk cases
        high_risk_cases = db.query(AIAssessment).filter(
            AIAssessment.risk_level.in_(['HIGH', 'URGENT'])
        ).count()
        
        # Weekly trend data
        weekly_data = []
        for i in range(7):
            date = today - timedelta(days=i)
            cases_count = db.query(SkinLesionImage).filter(
                func.date(SkinLesionImage.uploaded_at) == date
            ).count()
            weekly_data.append({
                'date': date.isoformat(),
                'cases': cases_count
            })
        
        # Monthly assessment trends
        monthly_assessments = []
        for i in range(30):
            date = today - timedelta(days=i)
            assessments_count = db.query(AIAssessment).filter(
                func.date(AIAssessment.created_at) == date
            ).count()
            monthly_assessments.append({
                'date': date.isoformat(),
                'assessments': assessments_count
            })
        
        # Regional distribution (if community health centers have regions)
        regional_data = db.query(
            CommunityHealthCenter.name,
            func.count(Patient.patient_id).label('patient_count')
        ).outerjoin(
            Patient, Patient.community_health_center_id == CommunityHealthCenter.id
        ).group_by(CommunityHealthCenter.name).all()
        
        regional_distribution = [
            {'region': region.name, 'patients': region.patient_count}
            for region in regional_data
        ]
        
        return {
            'overview': {
                'total_patients': total_patients,
                'total_cases': total_cases,
                'total_assessments': total_ai_assessments,
                'total_centers': total_centers,
                'recent_cases': recent_cases,
                'high_risk_cases': high_risk_cases
            },
            'risk_distribution': risk_data,
            'weekly_trend': weekly_data,
            'monthly_assessments': monthly_assessments,
            'regional_distribution': regional_distribution,
            'generated_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Analytics overview error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate analytics overview: {str(e)}"
        )

@router.get("/social-determinants", response_model=Dict[str, Any])
async def get_social_determinants_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get social determinants of health analytics
    """
    try:
        # This would be based on actual EMR data with social determinants
        # For now, we'll provide sample structure
        
        mock_social_data = {
            'education_levels': {
                'no_formal_education': 25,
                'primary': 35,
                'secondary': 30,
                'higher': 10
            },
            'employment_status': {
                'employed': 60,
                'unemployed': 20,
                'student': 15,
                'retired': 5
            },
            'housing_conditions': {
                'adequate': 70,
                'overcrowded': 20,
                'poor_conditions': 10
            },
            'income_levels': {
                'below_poverty': 30,
                'low_income': 40,
                'middle_income': 25,
                'high_income': 5
            },
            'health_outcomes_correlation': [
                {'factor': 'education', 'correlation': 0.75, 'significance': 'high'},
                {'factor': 'income', 'correlation': 0.68, 'significance': 'high'},
                {'factor': 'housing', 'correlation': 0.45, 'significance': 'medium'},
                {'factor': 'employment', 'correlation': 0.52, 'significance': 'medium'}
            ]
        }
        
        return mock_social_data
        
    except Exception as e:
        logger.error(f"Social determinants analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate social determinants analytics: {str(e)}"
        )

@router.get("/performance-metrics", response_model=Dict[str, Any])
async def get_performance_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(default=30, description="Number of days to analyze")
):
    """
    Get system performance metrics
    """
    try:
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # AI model performance metrics
        ai_accuracy_data = db.query(
            func.date(AIAssessment.created_at).label('date'),
            func.avg(
                func.case(
                    [(AIAssessment.confidence_score >= 0.8, 1)],
                    else_=0
                )
            ).label('high_confidence_rate'),
            func.count(AIAssessment.id).label('total_assessments')
        ).filter(
            func.date(AIAssessment.created_at) >= start_date
        ).group_by(func.date(AIAssessment.created_at)).all()
        
        # Response time metrics (mock data)
        response_times = []
        for i in range(days):
            date = end_date - timedelta(days=i)
            # Simulate response time data
            avg_response = 1.2 + (i * 0.1) % 0.8  # Mock varying response times
            response_times.append({
                'date': date.isoformat(),
                'avg_response_time': round(avg_response, 2),
                'uptime_percentage': 99.5 + (i % 5) * 0.1
            })
        
        # User engagement metrics
        engagement_data = {
            'daily_active_users': [],
            'feature_usage': {
                'ai_analysis': 85,
                'appointment_booking': 70,
                'emr_access': 60,
                'community_health': 45
            },
            'user_satisfaction': 4.2  # Out of 5
        }
        
        # Generate daily active user data
        for i in range(days):
            date = end_date - timedelta(days=i)
            # Mock active user count
            active_users = 150 + (i * 10) % 50
            engagement_data['daily_active_users'].append({
                'date': date.isoformat(),
                'active_users': active_users
            })
        
        return {
            'ai_performance': [
                {
                    'date': metric.date.isoformat(),
                    'high_confidence_rate': float(metric.high_confidence_rate or 0),
                    'total_assessments': metric.total_assessments
                }
                for metric in ai_accuracy_data
            ],
            'system_performance': response_times,
            'user_engagement': engagement_data,
            'generated_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Performance metrics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate performance metrics: {str(e)}"
        )

@router.get("/mobile-metrics", response_model=Dict[str, Any])
async def get_mobile_chw_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get mobile CHW interface usage metrics
    """
    try:
        # CHW activity metrics
        chw_users = db.query(User).filter(User.role == 'LOCAL_CADRE').all()
        
        chw_metrics = []
        for chw in chw_users:
            # Get cases reviewed by this CHW
            cases_reviewed = db.query(SkinLesionImage).filter(
                SkinLesionImage.reviewed_by_cadre == chw.user_id
            ).count()
            
            # Get recent activity (last 7 days)
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_activity = db.query(SkinLesionImage).filter(
                and_(
                    SkinLesionImage.reviewed_by_cadre == chw.user_id,
                    SkinLesionImage.updated_at >= week_ago
                )
            ).count()
            
            chw_metrics.append({
                'chw_name': f"{chw.first_name} {chw.last_name}",
                'total_cases_reviewed': cases_reviewed,
                'recent_activity': recent_activity,
                'efficiency_score': min(100, recent_activity * 20)  # Mock efficiency calculation
            })
        
        # Mobile usage statistics
        mobile_stats = {
            'total_mobile_sessions': 450,  # Mock data
            'average_session_duration': 12.5,  # minutes
            'offline_usage_percentage': 25,
            'most_used_features': [
                {'feature': 'Case Review', 'usage_percentage': 65},
                {'feature': 'Patient Registration', 'usage_percentage': 45},
                {'feature': 'AI Analysis', 'usage_percentage': 80},
                {'feature': 'EMR Entry', 'usage_percentage': 35}
            ]
        }
        
        return {
            'chw_performance': chw_metrics,
            'mobile_usage': mobile_stats,
            'total_active_chws': len(chw_users),
            'generated_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Mobile CHW metrics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate mobile CHW metrics: {str(e)}"
        )
