from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, List

from app import crud, models, schemas
from app.database import get_db
from app.config import settings
from app.dependencies import get_current_user # Assuming get_current_user is here

# OAuth2 and Password Hashing
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# get_current_active_user moved to dependencies.py

# Router for authentication
router = APIRouter()

@router.post("/token", response_model=schemas.Token, tags=["authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate using email (which is in form_data.username as per OAuth2PasswordRequestForm)
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Include user's role in the token data
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires # Use .value for Enum
    )
    # Return role and user_id in the response body along with the token
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role.value, # Role is in the token, not directly in Token schema
        # "user_id": user.id # User ID also not directly in Token schema
    }

@router.post("/register/", response_model=schemas.UserSchema, tags=["authentication"]) # Changed response_model to UserSchema
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # User registration, open to anyone initially. Default role is PATIENT.
    if user.email: # Check if email is provided
        db_user_by_email = crud.get_user_by_email(db, email=user.email)
        if db_user_by_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    else:
        # Handle case where email is not provided, if it's truly optional
        # For now, let's assume email is required for registration for this check
        pass # Or raise an error if email is mandatory for registration logic
            
    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    # The role is part of UserCreate schema. If not provided, model default (PATIENT) will be used.
    return crud.create_user(db=db, user=user)