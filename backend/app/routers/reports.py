from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import crud, models
from app.database import get_db, UserRole
from app.dependencies import get_current_official_or_admin

router = APIRouter(
    tags=["Reports & Analytics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/dashboard-stats", dependencies=[Depends(get_current_official_or_admin)])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get high-level statistics for the admin and official dashboards.
    """
    all_users = crud.get_users(db, limit=10000)
    
    # Count patients specifically (not all users)
    patients = [user for user in all_users if user.role == UserRole.PATIENT]
    officials = [user for user in all_users if user.role == UserRole.OFFICIAL]
    doctors = [user for user in all_users if user.role == UserRole.DOCTOR]
    admins = [user for user in all_users if user.role == UserRole.ADMIN]
    
    return {
        "totalUsers": len(all_users),      # For admin dashboard - monitor all users
        "totalPatients": len(patients),    # For official dashboard - track patients specifically
        "totalOfficials": len(officials), 
        "totalDoctors": len(doctors),
        "totalAdmins": len(admins),
        # Note: Urgent cases will be aggregated from frontend localStorage
        # since AI analysis results are currently stored there
        "urgentCasesCount": 0,  # Placeholder - will be calculated by frontend
        "urgentCases": [],      # Placeholder - will be populated by frontend
        "diseaseStats": {}      # Placeholder - will be calculated by frontend
    }