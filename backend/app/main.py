from fastapi import FastAPI, Depends, HTTPException, status # Add status and HTTPException
from fastapi.middleware.cors import CORSMiddleware # Add this import
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session # Add Session

from .database import engine, create_db_and_tables, get_db # Import create_db_and_tables and get_db
from .routers import auth, users, chat, patients, appointments, doctors, hospitals, password

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    create_db_and_tables()
    yield
    # Optional: Add any shutdown logic here

app = FastAPI(
    title="Clinic Management API",
    description="API for Clinic Management, a healthcare access platform for rural communities.",
    version="0.1.0",
    lifespan=lifespan
)

# CORS Middleware configuration
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"]) # Assuming a users router exists
app.include_router(chat.router, prefix="/chat", tags=["Chat"]) # Assuming a chat router exists
app.include_router(patients.router, prefix="/patients", tags=["Patients"]) # Include the patients router
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments"]) # Include the appointments router
app.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])
app.include_router(hospitals.router, prefix="/hospitals", tags=["Hospitals"])
app.include_router(password.router, prefix="/password", tags=["Password"])


@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to Clinic Management API",
        "version": "v0.5.0"
    }
