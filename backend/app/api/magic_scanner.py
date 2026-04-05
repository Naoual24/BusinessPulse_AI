from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..core import database
from ..models import models
from ..schemas import schemas
from .deps import get_current_user
from ..services.magic_scanner_service import MagicScannerService
from typing import Dict, Any, List

router = APIRouter()

@router.post("/scan")
async def scan_invoice(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Veuillez télécharger une image (JPG, PNG, etc.)")

    try:
        contents = await file.read()
        result = MagicScannerService.scan_invoice(contents, api_key=current_user.google_api_key)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse : {str(e)}")

@router.post("/save")
async def save_scan(
    data: schemas.ScanHistoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Saves scan to history and updates inventory stock."""
    try:
        # 1. Save to History
        new_history = models.ScanHistory(
            vendor_name=data.vendor_name,
            date=data.date,
            items=data.items,
            total_amount=data.total_amount,
            currency=data.currency,
            user_id=current_user.id
        )
        db.add(new_history)

        # 2. Update Inventory (Sync)
        for item in data.items:
            product_name = item.get("product")
            quantity = float(item.get("quantity") or 0)
            unit_price = float(item.get("unit_price") or 0)

            if not product_name: continue

            existing_item = db.query(models.Inventory).filter(
                models.Inventory.user_id == current_user.id,
                models.Inventory.product_name == product_name
            ).first()

            if existing_item:
                existing_item.quantity += int(quantity)
                existing_item.unit_price = unit_price
            else:
                new_inv = models.Inventory(
                    product_name=product_name,
                    quantity=int(quantity),
                    unit_price=unit_price,
                    user_id=current_user.id
                )
                db.add(new_inv)

        db.commit()
        return {"message": "Scan enregistré et inventaire mis à jour avec succès"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Échec de l'enregistrement : {str(e)}")

@router.get("/history", response_model=List[schemas.ScanHistory])
async def get_scan_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.ScanHistory).filter(models.ScanHistory.user_id == current_user.id).order_by(models.ScanHistory.created_at.desc()).all()

