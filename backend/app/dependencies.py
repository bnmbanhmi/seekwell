from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from app import crud, models, schemas # Corrected import paths
from app.database import get_db # Corrected import paths
from app.config import settings # Corrected import paths

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token") # Corrected token URL

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        user_role_str: Optional[str] = payload.get("role")

        if email is None or user_role_str is None:
            raise credentials_exception
        
        try:
            user_role_from_token = models.UserRole(user_role_str)
        except ValueError: # Handle cases where role_str is not a valid UserRole
            raise credentials_exception

        token_data = schemas.TokenData(username=email, role=user_role_from_token)
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=token_data.username) 
    
    # Explicitly compare enum values
    if user is None or user.role is None or user.role.value != user_role_from_token.value:
        raise credentials_exception
    return user

# Dependency to get the current active user, can be any role
async def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    return current_user

# Specific role dependencies
async def get_current_active_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    # Explicitly compare enum values
    if current_user.role.value != models.UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires ADMIN role."
        )
    return current_user

async def get_current_active_doctor(current_user: models.User = Depends(get_current_user)) -> models.User:
    # Explicitly compare enum values
    if current_user.role.value != models.UserRole.DOCTOR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires DOCTOR role."
        )
    return current_user

async def get_current_active_clinic_staff(current_user: models.User = Depends(get_current_user)) -> models.User:
    # Explicitly compare enum values
    if current_user.role.value != models.UserRole.CLINIC_STAFF.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires CLINIC_STAFF role."
        )
    return current_user

async def get_current_active_patient(current_user: models.User = Depends(get_current_user)) -> models.User:
    # Explicitly compare enum values
    if current_user.role.value != models.UserRole.PATIENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires PATIENT role."
        )
    return current_user

# Dependency for users who are either Doctor or Admin
async def get_current_doctor_or_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    # Explicitly compare enum values
    if current_user.role.value not in [models.UserRole.DOCTOR.value, models.UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires DOCTOR or ADMIN role."
        )
    return current_user

# Dependency for users who are Clinic Staff or Admin or Doctor
async def get_staff_doctor_or_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    # Explicitly compare enum values
    if current_user.role.value not in [models.UserRole.CLINIC_STAFF.value, models.UserRole.ADMIN.value, models.UserRole.DOCTOR.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires CLINIC_STAFF, DOCTOR, or ADMIN role."
        )
    return current_user

async def get_current_clinic_staff_or_admin(
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role.value not in [models.UserRole.ADMIN.value, models.UserRole.CLINIC_STAFF.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires Admin or Clinic Staff role."
        )
    return current_user

async def get_current_patient_or_doctor_or_admin(
    current_user: models.User = Depends(get_current_active_user)
):
    # Allows a patient to access their own data, or a doctor their assigned patient, or admin anyone.
    # Specific checks for patient ID matching will be in the route itself.
    if current_user.role.value not in [models.UserRole.ADMIN.value, models.UserRole.DOCTOR.value, models.UserRole.PATIENT.value, models.UserRole.CLINIC_STAFF.value]: # Added Clinic Staff for broader access where applicable
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires Admin, Doctor, Clinic Staff, or Patient role with appropriate permissions."
        )
    return current_user

# Ensure all UserRole members are imported if not already
# from app.database import UserRole (already imported at top of file usually)
