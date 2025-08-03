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
    total_users = len(crud.get_users(db, limit=10000)) # A simple way to get total count
    officials = [user for user in crud.get_users(db, limit=10000) if user.role == UserRole.OFFICIAL]
    
    # TODO: Implement logic to count actual urgent cases
    urgent_cases_count = 5 # Mock data

    return {
        "totalUsers": total_users,
        "totalOfficials": len(officials),
        "urgentCases": urgent_cases_count
    }