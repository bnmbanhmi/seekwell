from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models 
from app.database import get_db, UserRole # Import UserRole
from app.dependencies import (
    get_current_active_user,
    get_current_active_admin,
)
from typing import List, cast # Updated import

router = APIRouter(
    prefix="/users",
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

@router.get("/me/", response_model=schemas.UserSchema)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    # Get current user's details
    return current_user

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