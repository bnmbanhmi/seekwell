from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app import crud, schemas, models
from app.database import get_db
from app.dependencies import get_current_active_user
import json

router = APIRouter(
    tags=["Medical Reports"],
    responses={404: {"description": "Not found"}},
)

# Create Medical Report
@router.post("/", response_model=schemas.MedicalReportSchema, status_code=status.HTTP_201_CREATED)
def create_medical_report(
    medical_report: schemas.MedicalReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    if current_user.role != "DOCTOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can create medical reports.")
    return crud.create_medical_report(db=db, report=medical_report)

# Update Medical Report
@router.put("/{record_id}", response_model=schemas.MedicalReportSchema)
def update_medical_report(
    record_id: int,
    medical_report: schemas.MedicalReportUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    existing_report = crud.get_medical_report(db=db, record_id=record_id)
    if not existing_report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical report not found.")
    if current_user.role != "DOCTOR" and current_user.user_id != existing_report.doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this report.")
    return crud.update_medical_report(db=db, record_id=record_id, report_update=medical_report)

# Retrieve Medical Reports (List)
@router.get("/", response_model=List[schemas.MedicalReportSchema])
def get_medical_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    if current_user.role == "DOCTOR":
        return crud.get_medical_reports_by_doctor(db=db, doctor_id=current_user.user_id)
    elif current_user.role == "PATIENT":
        return crud.get_medical_reports_for_patient(db=db, patient_id=current_user.user_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view medical reports.")

# Retrieve Single Medical Report
@router.get("/{record_id}", response_model=schemas.MedicalReportSchema)
def get_medical_report(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    report = crud.get_medical_report(db=db, record_id=record_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical report not found.")
    if current_user.role != "DOCTOR" and current_user.role != "PATIENT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view this report.")
    return report

# Delete Medical Report
@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medical_report(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    report = crud.get_medical_report(db=db, record_id=record_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical report not found.")
    if current_user.role != "DOCTOR" and current_user.user_id != report.doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this report.")
    crud.delete_medical_report(db=db, record_id=record_id)

# Search Medical Reports by Filters
@router.get("/search", response_model=List[schemas.MedicalReportSchema])
def search_medical_reports(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    in_day: Optional[date] = None,
    out_day: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    return crud.search_medical_reports(db=db, patient_id=patient_id, doctor_id=doctor_id, in_day=in_day, out_day=out_day)