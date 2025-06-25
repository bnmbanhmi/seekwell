from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.database import get_db
from app.dependencies import get_current_active_admin
from typing import List

router = APIRouter(
    tags=["Community Health Centers"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.CommunityHealthCenterSchema)
def create_community_health_center(center: schemas.CommunityHealthCenterCreate, db: Session = Depends(get_db)):
    return crud.create_community_health_center(db=db, center_in=center)

@router.get("/", response_model=List[schemas.CommunityHealthCenterSchema])
def read_community_health_centers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_community_health_centers(db=db, skip=skip, limit=limit)

@router.get("/{center_id}", response_model=schemas.CommunityHealthCenterSchema)
def read_community_health_center(center_id: int, db: Session = Depends(get_db)):
    db_center = crud.get_community_health_center(db, center_id=center_id)
    if db_center is None:
        raise HTTPException(status_code=404, detail="Community Health Center not found")
    return db_center

@router.put("/{center_id}", response_model=schemas.CommunityHealthCenterSchema, dependencies=[Depends(get_current_active_admin)])
def update_community_health_center(center_id: int, center_update: schemas.CommunityHealthCenterUpdate, db: Session = Depends(get_db)):
    updated = crud.update_community_health_center(db=db, center_id=center_id, center_update=center_update)
    if updated is None:
        raise HTTPException(status_code=404, detail="Community Health Center not found")
    return updated

@router.delete("/{center_id}", response_model=schemas.CommunityHealthCenterSchema, dependencies=[Depends(get_current_active_admin)])
def delete_community_health_center(center_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_community_health_center(db=db, center_id=center_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Community Health Center not found")
    return deleted
