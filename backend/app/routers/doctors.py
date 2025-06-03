from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.database import get_db
from app.dependencies import (
    get_current_active_user,
    get_current_active_admin,
)
from typing import List

router = APIRouter(
    tags=["Doctors"],
    responses={404: {"description": "Not found"}},
)

# Create a new doctor - only ADMINs can do this
@router.post("/", response_model=schemas.DoctorSchema, dependencies=[Depends(get_current_active_admin)])
def create_doctor(doctor: schemas.DoctorCreate, db: Session = Depends(get_db)):
    # Create doctor record
    return crud.create_doctor(db=db, doctor_in=doctor)

# Get list of all doctors - only ADMINs
@router.get("/", response_model=List[schemas.DoctorSchema])
def get_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_doctors(db, skip=skip, limit=limit)

# Get specific doctor by ID - ADMIN or that doctor
@router.get("/{doctor_id}", response_model=schemas.DoctorSchema)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    current_user_id = current_user.user_id
    if current_user.role != models.UserRole.ADMIN and current_user_id != doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    doctor = crud.get_doctor(db, doctor_id=doctor_id)
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

# Update doctor information
@router.put("/{doctor_id}", response_model=schemas.DoctorSchema)
def update_doctor(
    doctor_id: int,
    doctor_update: schemas.DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    db_doctor = crud.get_doctor(db, doctor_id=doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if current_user.role != models.UserRole.ADMIN and current_user.user_id != doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    return crud.update_doctor(db=db, doctor_id=doctor_id, doctor_update=doctor_update)

# Delete doctor
@router.delete("/{doctor_id}", response_model=schemas.DoctorSchema)
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_admin),
):
    doctor = crud.get_doctor(db, doctor_id=doctor_id)
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")

    return crud.delete_doctor(db=db, doctor_id=doctor_id)