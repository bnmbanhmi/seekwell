from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app import crud, schemas, models 
from app.database import get_db, UserRole # Import UserRole
from app.dependencies import get_current_active_user
from typing import List, cast # Updated import

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    responses={404: {"description": "Not found"}},
)

@router.post("/create_report/", response_model=schemas.MedicalReportSchema, tags=["authentication"])
def create_report(
    report: schemas.MedicalReportCreate, # Changed to schemas.MedicalReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user) # Changed dependency and param name
):
    if current_user.role not in [UserRole.PATIENT, UserRole.CLINIC_STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create a report.",
        )
    
    # Ensure the patient exists
    patient = crud.get_patient_by_user_id(db, patient_id=report.patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )
    
    # Create the report
    created_report = crud.create_medical_report(db=db, report=report)
    return created_report

