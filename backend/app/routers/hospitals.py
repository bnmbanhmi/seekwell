from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.database import get_db
from app.dependencies import get_current_active_admin
from typing import List

router = APIRouter(
    tags=["Hospitals"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.HospitalSchema)
def create_hospital(hospital: schemas.HospitalCreate, db: Session = Depends(get_db)):
    return crud.create_hospital(db=db, hospital_in=hospital)

@router.get("/", response_model=List[schemas.HospitalSchema])
def read_hospitals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_hospitals(db=db, skip=skip, limit=limit)

@router.get("/{hospital_id}", response_model=schemas.HospitalSchema)
def read_hospital(hospital_id: int, db: Session = Depends(get_db)):
    db_hospital = crud.get_hospital(db, hospital_id=hospital_id)
    if db_hospital is None:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return db_hospital

@router.put("/{hospital_id}", response_model=schemas.HospitalSchema, dependencies=[Depends(get_current_active_admin)])
def update_hospital(hospital_id: int, hospital_update: schemas.HospitalUpdate, db: Session = Depends(get_db)):
    updated = crud.update_hospital(db=db, hospital_id=hospital_id, hospital_update=hospital_update)
    if updated is None:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return updated

@router.delete("/{hospital_id}", response_model=schemas.HospitalSchema, dependencies=[Depends(get_current_active_admin)])
def delete_hospital(hospital_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_hospital(db=db, hospital_id=hospital_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return deleted
