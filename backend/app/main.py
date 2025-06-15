from fastapi import FastAPI, Depends, HTTPException, status # Add status and HTTPException
from fastapi.middleware.cors import CORSMiddleware # Add this import
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session # Add Session

from .database import engine, create_db_and_tables, get_db # Import create_db_and_tables and get_db
from .routers import auth, users, chat, patients, appointments, doctors, hospitals, password, reports, ai_prediction, skin_lesions, cadre, community

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    create_db_and_tables()
    yield
    # Optional: Add any shutdown logic here

app = FastAPI(
    title="SeekWell - AI Health Assistant API",
    description="AI-powered skin cancer detection platform for community health workers and patients in underserved areas.",
    version="1.0.0",
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
app.include_router(reports.router, prefix="/medical_reports", tags=["Medical Reports"]) # Include the reports router
app.include_router(ai_prediction.router, prefix="/ai", tags=["AI Prediction"]) # Include the AI prediction router
app.include_router(skin_lesions.router, prefix="/skin-lesions", tags=["Skin Lesion Analysis"]) # Include the new skin lesions router
app.include_router(cadre.router, prefix="/cadre", tags=["Community Health Cadre"]) # SeekWell cadre workflow
app.include_router(community.router, prefix="/community", tags=["Community Health"]) # SeekWell community metrics


@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Welcome to SeekWell - AI Health Assistant API",
        "description": "AI-powered skin cancer detection for community health workers",
        "version": "1.0.0",
        "features": [
            "AI skin lesion analysis",
            "Community health worker workflow", 
            "Patient-cadre-doctor review system",
            "Mobile-first design",
            "Real-time risk assessment"
        ]
    }
