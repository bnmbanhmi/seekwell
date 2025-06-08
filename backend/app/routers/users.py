from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app import crud, schemas, models 
from app.database import get_db, UserRole # Import UserRole
from app.dependencies import (
    get_current_active_user,
    get_current_active_admin,
)
from typing import List, cast, Union # Updated import

from datetime import date
import enum

router = APIRouter(
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)

# Endpoint to create a new user. 
# This is typically done via /auth/register for self-registration.
# This endpoint is restricted to ADMINs for creating any type of user.
@router.post("/", response_model=schemas.UserSchema, dependencies=[Depends(get_current_active_admin)])
def create_user_by_admin(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Admin creating a user, can specify role.
    # Check if email already exists
    if user.email: # user.email is Pydantic's EmailStr, which is a str
        db_user_email = crud.get_user_by_email(db, email=user.email)
        if db_user_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    # Check if username already exists
    db_user_username = crud.get_user_by_username(db, username=user.username)
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@router.get("/me", response_model=Union[schemas.UserSchema, schemas.PatientSchema, schemas.DoctorSchema])
async def read_users_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    role = current_user.role
    if role == UserRole.PATIENT:
        patient = crud.get_patient(db, patient_id=current_user.user_id)
        if patient:
            patient_dict = patient.__dict__.copy()
            patient_dict["username"] = current_user.username
            patient_dict["email"] = current_user.email
            return schemas.PatientSchema.model_validate(patient_dict)
        else:
            raise HTTPException(status_code=404, detail="Patient profile not found")
    elif role == UserRole.DOCTOR:
        doctor = crud.get_doctor(db, doctor_id=current_user.user_id)
        if doctor:
            doctor_dict = doctor.__dict__.copy()
            doctor_dict["username"] = current_user.username
            doctor_dict["email"] = current_user.email
            return schemas.DoctorSchema.model_validate(doctor_dict)
        else:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
    elif role == UserRole.CLINIC_STAFF:
        return schemas.UserSchema.model_validate(current_user)
    else:
        return schemas.UserSchema.model_validate(current_user)

@router.put("/me")
async def update_user_me(
    reponse: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Update current user's details
    body = await reponse.json()
    if not body:
        raise HTTPException(status_code=400, detail="No user data provided")
    
    role = current_user.role

    user_update = schemas.UserUpdate(
        username=body.get("username", current_user.username),
        email=body.get("email", current_user.email),
        full_name=body.get("full_name", current_user.full_name),
        role=role,  # Keep the current user's role
        password=body.get("password", None)  # Password can be updated, but it's optional
    )
    db_user = crud.update_user(db=db, user_id=current_user.user_id, user_update=user_update)

    if role == UserRole.PATIENT:
        current_patient = crud.get_patient(db, patient_id=current_user.user_id)
        # Convert gender string to Gender enum if needed
        gender_str = body.get("gender", current_patient.gender)
        from app.database import Gender, Class
        gender = None
        if isinstance(gender_str, str):
            gender_map = {g.value.lower(): g for g in Gender}
            gender = gender_map.get(gender_str.lower(), current_patient.gender)
        else:
            gender = current_patient.gender
        # Convert class_role string to Class enum if needed
        class_role_str = body.get("class_role", current_patient.class_role)
        class_role = None
        if isinstance(class_role_str, str):
            class_map = {c.value.lower(): c for c in Class}
            class_role = class_map.get(class_role_str.lower(), current_patient.class_role)
        else:
            class_role = current_patient.class_role
        # Ensure gender and class_role are always the correct string value for the DB
        if isinstance(gender, enum.Enum):
            gender = gender.value
        if isinstance(class_role, enum.Enum):
            class_role = class_role.value
        patient_update = schemas.PatientUpdate(
            username=current_user.username,
            email=current_user.email,
            full_name=body.get("full_name", current_patient.full_name),
            date_of_birth=body.get("date_of_birth", current_patient.date_of_birth),
            gender=gender,
            ethnic_group=body.get("ethic_group", current_patient.ethnic_group),
            address=body.get("address", current_patient.address),
            phone_number=body.get("phone_number", current_patient.phone_number),
            health_insurance_card_no=body.get("health_insurance_card_no", current_patient.health_insurance_card_no),
            identification_id=body.get("identification_id", current_patient.identification_id),
            job=body.get("job", current_patient.job),
            class_role=class_role
        )
        db_patient = crud.update_patient(db=db, patient_id=current_patient.patient_id, patient_update=patient_update)
        return db_patient  # Return the updated patient details
    elif role == UserRole.DOCTOR:
        current_doctor = crud.get_doctor(db, doctor_id=current_user.user_id)
        # If the user is a doctor, update the doctor profile
        doctor_update = schemas.DoctorUpdate(
            doctor_name=body.get("full_name", current_doctor.doctor_name),
            major=body.get("major", current_doctor.major)
        )
        db_doctor = crud.update_doctor(db=db, doctor_id=current_doctor.doctor_id, doctor_update=doctor_update)
        return db_doctor  # Return the updated doctor details
    elif role == UserRole.CLINIC_STAFF:
        pass

    return {"message": "Error: update in users table successful, but cannot update patient or doctor profile"}


@router.get("/", response_model=List[schemas.UserSchema], dependencies=[Depends(get_current_active_admin)])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Admin can retrieve a list of all users.
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.UserSchema)
def read_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    # Explicitly get Python-native values for comparison
    current_user_role_value = current_user.role.value
    # current_user_id = current_user.id
    current_user_id = cast(int, current_user.user_id) # Use cast

    if current_user_role_value != UserRole.ADMIN.value and current_user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.UserSchema)
def update_user_details(
    user_id: int, 
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    db_user_to_update = crud.get_user(db, user_id=user_id)
    if db_user_to_update is None:
        raise HTTPException(status_code=404, detail="User not found")

    current_user_role_value = current_user.role.value
    # current_user_id = current_user.id
    current_user_id = cast(int, current_user.id) # Use cast
    db_user_to_update_role_value = db_user_to_update.role.value

    if current_user_role_value != UserRole.ADMIN.value and current_user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this user")
    
    # Role change logic
    if user_update.role is not None and user_update.role.value != db_user_to_update.role.value:
        if current_user.role.value != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only ADMIN can change user roles.")
    
    if user_update.role is not None and user_update.role.value == UserRole.ADMIN.value and current_user.role.value != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot elevate privileges to ADMIN.")

    updated_user = crud.update_user(db=db, user_id=user_id, user_update=user_update)
    if updated_user is None: 
        raise HTTPException(status_code=404, detail="User not found after update attempt")
    return updated_user

@router.delete("/{user_id}", response_model=schemas.UserSchema)
def delete_user_by_admin(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_admin)):
    db_user_to_delete = crud.get_user(db, user_id=user_id)
    if db_user_to_delete is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # current_user_id = current_user.id # Get Python native value
    current_user_id = cast(int, current_user.id) # Use cast
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Admin cannot delete themselves via this endpoint.")

    return crud.delete_user(db=db, user_id=user_id)