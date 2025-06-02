from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, models
from app.database import get_db
from app.dependencies import get_current_active_user, get_current_active_admin
from datetime import datetime

router = APIRouter(
    tags=["Appointments"],
    responses={404: {"description": "Not found"}},
)

@router.post("/book", response_model=schemas.AppointmentSchema)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_appointment(db=db, appointment=appointment, creator_id=current_user.id)

@router.get("/", response_model=List[schemas.AppointmentSchema])
def get_all_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_appointments(db, skip=skip, limit=limit)

@router.get("/available", response_model=List[datetime])
def get_available_slots_in_a_given_day(
    day: datetime = Query(..., description="Date to check for available slots (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get available 1-hour appointment slots for a given day (between 08:30 and 17:30 excluding lunch break).
    """
    return crud.get_available_slots(db, day=day)

@router.get("/me", response_model=List[schemas.AppointmentSchema], 
            dependencies=[Depends(get_current_active_user)])
def get_appointments_for_patient(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="You must be a patient to view your appointments")
    
    return crud.get_appointments_for_patient(db, patient_id=current_user.id)

@router.get("/{appointment_id}", response_model=schemas.AppointmentSchema)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_appointment = crud.get_appointment(db, appointment_id=appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Allow only admins, the assigned doctor, or the patient to access
    if (current_user.role != models.UserRole.ADMIN and 
        current_user.id != db_appointment.patient_id and 
        current_user.id != db_appointment.doctor_id):
        raise HTTPException(status_code=403, detail="Not enough permissions to view this appointment")
    
    return db_appointment

@router.put("/{appointment_id}", response_model=schemas.AppointmentSchema)
def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_appointment = crud.get_appointment(db, appointment_id=appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if (current_user.role != models.UserRole.ADMIN and 
        current_user.id != db_appointment.patient_id and 
        current_user.id != db_appointment.doctor_id):
        raise HTTPException(status_code=403, detail="Not enough permissions to update this appointment")
    
    return crud.update_appointment(db, appointment_id, appointment_update)

@router.delete("/{appointment_id}", response_model=schemas.AppointmentSchema)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_appointment = crud.get_appointment(db, appointment_id=appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if (current_user.role != models.UserRole.ADMIN and 
        current_user.id != db_appointment.patient_id and 
        current_user.id != db_appointment.doctor_id):
        raise HTTPException(status_code=403, detail="Not enough permissions to delete this appointment")
    
    return crud.delete_appointment(db, appointment_id)
