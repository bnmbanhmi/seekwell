from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Add this import
from contextlib import asynccontextmanager

from .database import engine, create_db_and_tables # Import create_db_and_tables
from .routers import auth, users, chat, patients # Import the new patients router
from . import models # Import models to ensure tables are known to Base

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
origins = [
    "http://localhost:3000",
    "https://clinic-management-nine-lime.vercel.app"  # Allow your React frontend
    # You can add other origins here if needed, e.g., your deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"]) # Assuming a users router exists
app.include_router(chat.router, prefix="/chat", tags=["Chat"]) # Assuming a chat router exists
app.include_router(patients.router, prefix="/patients", tags=["Patients"]) # Include the patients router

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to Clinic Management API"}