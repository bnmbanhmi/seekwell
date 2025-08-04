from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.database import get_db, UserRole
from app.dependencies import get_current_active_user, get_current_active_admin, get_current_official_or_admin
from typing import List, Union

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

@router.get("/me", response_model=Union[schemas.UserSchema, schemas.PatientSchema])
async def read_users_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get the profile for the currently authenticated user.
    Returns a detailed PatientSchema for patients, and a standard UserSchema for other roles.
    """
    if current_user.role == UserRole.PATIENT:
        patient = crud.get_patient(db, patient_id=current_user.user_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        # The Patient model should have a relationship to the User model,
        # so we can construct the schema from the patient object directly.
        return patient
    
    # For all other roles (ADMIN, DOCTOR, OFFICIAL), return the basic user info.
    return current_user

@router.put("/me", response_model=Union[schemas.UserSchema, schemas.PatientSchema])
async def update_users_me(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update the profile for the currently authenticated user.
    """
    updated_user = crud.update_user(db, user_id=current_user.user_id, user_update=user_update)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return patient profile if user is a patient
    if updated_user.role == UserRole.PATIENT:
        patient = crud.get_patient(db, patient_id=updated_user.user_id)
        if patient:
            return patient
    
    return updated_user

@router.get("/", response_model=List[schemas.UserSchema], dependencies=[Depends(get_current_official_or_admin)])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Admin and Official can retrieve a list of all users.
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.UserSchema, dependencies=[Depends(get_current_official_or_admin)])
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.UserSchema, dependencies=[Depends(get_current_active_admin)])
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = crud.update_user(db, user_id=user_id, user_update=user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}", response_model=schemas.UserSchema, dependencies=[Depends(get_current_active_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.delete_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user