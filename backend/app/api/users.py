from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from ..core import database, security
from ..models import models
from ..schemas import schemas
from .deps import get_current_user
from ..core.config import settings

router = APIRouter()

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=schemas.User)
def update_profile(
    update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if update.currency is not None:
        current_user.currency = update.currency
    
    if update.google_api_key is not None:
        current_user.google_api_key = update.google_api_key
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/logo", response_model=schemas.User)
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload_dir = os.path.join(settings.UPLOAD_DIR, "logos")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    file_extension = os.path.splitext(file.filename)[1]
    if file_extension.lower() not in ['.png', '.jpg', '.jpeg', '.svg']:
        raise HTTPException(status_code=400, detail="Invalid image type")

    unique_filename = f"logo_{current_user.id}_{uuid.uuid4().hex[:8]}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Store relative path for frontend
    current_user.company_logo = f"/api/analytics/logo/{unique_filename}" 
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/password")
def change_password(
    data: schemas.PasswordUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not security.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
