from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core import database
from ..models import models
from ..schemas import schemas
from .deps import get_current_user
from datetime import datetime

router = APIRouter()

@router.post("/bulk-add", response_model=List[schemas.InventoryItem])
async def bulk_add_to_inventory(
    data: schemas.InventoryBulkCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Adds multiple items to the user's inventory.
    If an item with the same name exists, it updates the quantity and price.
    """
    saved_items = []
    
    for item_data in data.items:
        # Check if item already exists for this user
        existing_item = db.query(models.Inventory).filter(
            models.Inventory.user_id == current_user.id,
            models.Inventory.product_name == item_data.product_name
        ).first()
        
        if existing_item:
            # Update existing item
            existing_item.quantity += item_data.quantity
            existing_item.unit_price = item_data.unit_price # Update to latest price
            existing_item.last_updated = datetime.utcnow()
            db.add(existing_item)
            saved_items.append(existing_item)
        else:
            # Create new item
            new_item = models.Inventory(
                product_name=item_data.product_name,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                user_id=current_user.id
            )
            db.add(new_item)
            saved_items.append(new_item)
            
    try:
        db.commit()
        # Refresh to get IDs for the response
        for item in saved_items:
            db.refresh(item)
        return saved_items
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde : {str(e)}")

@router.get("/", response_model=List[schemas.InventoryItem])
async def get_inventory(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves the full inventory for the current user.
    """
    return db.query(models.Inventory).filter(models.Inventory.user_id == current_user.id).all()
