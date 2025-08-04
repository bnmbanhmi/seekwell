from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, models
from app.database import get_db, UserRole
from app.dependencies import get_current_active_user, get_current_active_admin, get_current_official_or_admin
from app.dependencies import get_current_active_user, get_current_active_admin, get_current_official_or_admin

router = APIRouter(
    tags=["Patients"]
)

@router.get("/", response_model=List[schemas.PatientSchema], dependencies=[Depends(get_current_official_or_admin)])
def list_all_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all patients. Restricted to Officials, Doctors, and Admins.
    """
    return crud.get_patients(db, skip=skip, limit=limit)

@router.get("/search/", response_model=List[schemas.PatientSchema], dependencies=[Depends(get_current_official_or_admin)])
def search_for_patients(
    q: str,
    db: Session = Depends(get_db)
):
    """
    Search for patients by name, email, or phone. Restricted to Officials, Doctors, and Admins.
    """
    return crud.search_patients(db, search_term=q)

@router.get("/{patient_id}", response_model=schemas.PatientSchema)
def get_patient_details(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get details for a specific patient.
    Admins, Doctors, and Officials can view any patient.
    Patients can only view their own profile.
    """
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Allow access if user is an admin/doctor/official OR if the patient is viewing their own profile
    if current_user.role in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.OFFICIAL] or current_user.user_id == patient_id:
        return db_patient
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to view this patient's details")

@router.put("/{patient_id}", response_model=schemas.PatientSchema)
def update_patient_profile(
    patient_id: int,
    patient_update: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update patient profile information.
    Admins and Doctors can update any patient.
    Patients can only update their own profile.
    """
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Allow access if user is an admin/doctor OR if the patient is updating their own profile
    if current_user.role in [UserRole.ADMIN, UserRole.DOCTOR] or current_user.user_id == patient_id:
        updated_patient = crud.update_patient(db, patient_id=patient_id, patient_update=patient_update)
        return updated_patient
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to update this patient's profile")

@router.get("/{patient_id}/analysis", response_model=List[schemas.AnalysisResultSchema])
def get_patient_analysis_results(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get analysis results for a specific patient.
    Admins, Doctors, and Officials can view any patient's analysis.
    Patients can only view their own analysis.
    """
    # Allow access if user is an admin/doctor/official OR if the patient is viewing their own data
    if current_user.role in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.OFFICIAL] or current_user.user_id == patient_id:
        analysis_results = crud.get_analysis_results_by_patient(db, patient_id=patient_id)
        return analysis_results
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to view this patient's analysis data")

@router.delete("/{patient_id}", response_model=schemas.PatientSchema, dependencies=[Depends(get_current_active_admin)])
def remove_patient_record(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a patient record. Restricted to Admins.
    """
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    # The user associated with the patient is deleted via cascade, so we only need to delete the user.
    db_user = crud.delete_user(db, user_id=patient_id)
    if db_user is None:
        # This case should ideally not be hit if a patient record exists
        raise HTTPException(status_code=404, detail="Associated user not found for patient")
        
    return db_patient
