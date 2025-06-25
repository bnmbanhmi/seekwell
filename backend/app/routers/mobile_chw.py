from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, Patient, SkinLesionImage, AIAssessment, CommunityHealthCenter
from ..schemas import PatientCreate
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_mobile_chw_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get mobile CHW dashboard data
    """
    try:
        if current_user.role.value != 'LOCAL_CADRE':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only LOCAL_CADRE users can access mobile CHW interface."
            )
        
        # Get pending cases for review
        pending_cases = db.query(SkinLesionImage).filter(
            SkinLesionImage.status == 'pending',
            SkinLesionImage.reviewed_by_cadre.is_(None)
        ).count()
        
        # Get urgent cases
        urgent_cases = db.query(SkinLesionImage).join(
            AIAssessment, SkinLesionImage.image_id == AIAssessment.image_id
        ).filter(
            SkinLesionImage.status == 'pending',
            AIAssessment.risk_level.in_(['URGENT', 'HIGH']),
            SkinLesionImage.reviewed_by_cadre.is_(None)
        ).count()
        
        # Get today's completed reviews
        today = datetime.utcnow().date()
        completed_today = db.query(SkinLesionImage).filter(
            SkinLesionImage.reviewed_by_cadre == current_user.user_id,
            SkinLesionImage.updated_at >= today
        ).count()
        
        # Get recent patients registered
        recent_patients = db.query(Patient).order_by(
            Patient.created_at.desc()
        ).limit(5).all()
        
        patient_list = [
            {
                'id': p.patient_id,
                'name': f"{p.first_name} {p.last_name}",
                'age': p.age,
                'phone': p.phone_number,
                'registered_at': p.created_at.isoformat()
            }
            for p in recent_patients
        ]
        
        return {
            'summary': {
                'pending_cases': pending_cases,
                'urgent_cases': urgent_cases,
                'completed_today': completed_today,
                'total_patients': db.query(Patient).count()
            },
            'recent_patients': patient_list,
            'chw_info': {
                'name': f"{current_user.first_name} {current_user.last_name}",
                'id': current_user.user_id,
                'role': current_user.role.value
            },
            'generated_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Mobile CHW dashboard error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load mobile CHW dashboard: {str(e)}"
        )

@router.get("/quick-actions", response_model=Dict[str, Any])
async def get_quick_actions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get quick actions for mobile CHW interface
    """
    try:
        if current_user.role.value != 'LOCAL_CADRE':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied."
            )
        
        quick_actions = [
            {
                'id': 'register_patient',
                'title': 'Register New Patient',
                'description': 'Register a new patient in the system',
                'icon': 'user-plus',
                'priority': 'high'
            },
            {
                'id': 'review_cases',
                'title': 'Review AI Cases',
                'description': 'Review pending AI skin analysis cases',
                'icon': 'eye',
                'priority': 'urgent',
                'badge_count': db.query(SkinLesionImage).filter(
                    SkinLesionImage.status == 'pending',
                    SkinLesionImage.reviewed_by_cadre.is_(None)
                ).count()
            },
            {
                'id': 'emergency_referral',
                'title': 'Emergency Referral',
                'description': 'Create emergency referral to doctor',
                'icon': 'alert-triangle',
                'priority': 'urgent'
            },
            {
                'id': 'health_education',
                'title': 'Health Education',
                'description': 'Access health education materials',
                'icon': 'book-open',
                'priority': 'medium'
            },
            {
                'id': 'community_stats',
                'title': 'Community Health Stats',
                'description': 'View community health statistics',
                'icon': 'bar-chart',
                'priority': 'low'
            }
        ]
        
        return {
            'quick_actions': quick_actions,
            'last_updated': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Quick actions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load quick actions: {str(e)}"
        )

@router.post("/quick-register", response_model=Dict[str, Any])
async def quick_patient_registration(
    first_name: str = Form(...),
    last_name: str = Form(...),
    age: int = Form(...),
    phone_number: str = Form(...),
    gender: str = Form(...),
    address: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Quick patient registration for mobile CHW interface
    """
    try:
        if current_user.role.value != 'LOCAL_CADRE':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied."
            )
        
        # Check if patient already exists
        existing_patient = db.query(Patient).filter(
            Patient.phone_number == phone_number
        ).first()
        
        if existing_patient:
            return {
                'success': False,
                'message': 'Patient with this phone number already exists',
                'existing_patient': {
                    'id': existing_patient.patient_id,
                    'name': f"{existing_patient.first_name} {existing_patient.last_name}"
                }
            }
        
        # Create new patient
        new_patient = Patient(
            first_name=first_name,
            last_name=last_name,
            age=age,
            phone_number=phone_number,
            gender=gender,
            address=address or '',
            created_by_cadre=current_user.user_id,
            created_at=datetime.utcnow()
        )
        
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        return {
            'success': True,
            'message': 'Patient registered successfully',
            'patient': {
                'id': new_patient.patient_id,
                'name': f"{new_patient.first_name} {new_patient.last_name}",
                'phone': new_patient.phone_number,
                'registered_at': new_patient.created_at.isoformat()
            }
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Quick registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register patient: {str(e)}"
        )

@router.get("/offline-sync", response_model=Dict[str, Any])
async def get_offline_sync_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get data for offline synchronization
    """
    try:
        if current_user.role.value != 'LOCAL_CADRE':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied."
            )
        
        # Get essential data for offline use
        sync_data = {
            'community_health_centers': [
                {
                    'id': center.id,
                    'name': center.name,
                    'address': getattr(center, 'address', ''),
                    'phone': getattr(center, 'phone', '')
                }
                for center in db.query(CommunityHealthCenter).all()
            ],
            'health_education_tips': [
                {
                    'id': 1,
                    'title': 'Skin Cancer Prevention',
                    'content': 'Use sunscreen, avoid excessive sun exposure, perform regular self-examinations.',
                    'category': 'prevention'
                },
                {
                    'id': 2,
                    'title': 'When to Seek Medical Help',
                    'content': 'Seek immediate medical attention for changes in moles, new growths, or suspicious lesions.',
                    'category': 'urgent_care'
                },
                {
                    'id': 3,
                    'title': 'Healthy Lifestyle',
                    'content': 'Maintain a healthy diet, exercise regularly, and avoid tobacco use.',
                    'category': 'general_health'
                }
            ],
            'emergency_contacts': [
                {
                    'type': 'Emergency Medical Services',
                    'phone': '115',
                    'available': '24/7'
                },
                {
                    'type': 'Poison Control',
                    'phone': '114',
                    'available': '24/7'
                }
            ],
            'sync_timestamp': datetime.utcnow().isoformat()
        }
        
        return sync_data
        
    except Exception as e:
        logger.error(f"Offline sync error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to prepare offline sync data: {str(e)}"
        )

@router.post("/sync-status", response_model=Dict[str, Any])
async def update_sync_status(
    last_sync: datetime,
    pending_uploads: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update mobile app sync status
    """
    try:
        if current_user.role.value != 'LOCAL_CADRE':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied."
            )
        
        # Log sync status (in a real app, this would update a sync status table)
        logger.info(f"CHW {current_user.user_id} sync status: last_sync={last_sync}, pending={pending_uploads}")
        
        return {
            'success': True,
            'message': 'Sync status updated',
            'server_time': datetime.utcnow().isoformat(),
            'next_sync_recommended': (datetime.utcnow() + timedelta(hours=4)).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Sync status update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update sync status: {str(e)}"
        )
