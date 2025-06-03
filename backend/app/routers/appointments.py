from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app import crud, schemas, models
from app.database import get_db
from app.dependencies import get_current_active_user, get_current_active_admin
from datetime import datetime, date, timedelta

router = APIRouter(
    tags=["Appointments"],
    responses={404: {"description": "Not found"}},
)

@router.post("/book", response_model=schemas.AppointmentSchema, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    print("Received appointment payload:", appointment)
    return crud.create_appointment(db=db, appointment=appointment, creator_id=current_user.user_id)

@router.get("/", response_model=List[schemas.AppointmentSchema])
def get_all_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_appointments(db, skip=skip, limit=limit)

@router.get("/available", response_model=List[Dict[datetime, Any]])
def get_available_slots_in_a_given_day(
    day: date = Query(..., description="Date to check for available slots (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get available 1-hour appointment slots for a given day (between 08:30 and 17:30 excluding lunch break).
    """
    return crud.get_available_slots_in_a_day(db, day=day)

@router.get("/available-range", response_model=List[schemas.AvailableSlot])
def get_available_slots_in_date_range(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get available 1-hour appointment slots between start_date and end_date (inclusive).
    Returns a flat list of datetime slots.
    """
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")

    available_slots = []
    current_date = start_date
    while current_date <= end_date:
        slots = crud.get_available_slots_in_a_day(db, day=current_date)
        available_slots.extend(slots)
        current_date += timedelta(days=1)

    return available_slots


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
