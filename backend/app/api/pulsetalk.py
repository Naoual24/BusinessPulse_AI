from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core import database
from ..models import models
from ..schemas import schemas
from ..services.pulsetalk_service import PulseTalkService
from .deps import get_current_user

router = APIRouter()

@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_ai(
    request: schemas.ChatRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Determine which analysis data to use
    upload_id = request.upload_id
    
    if upload_id:
        history = db.query(models.AnalysisHistory).filter(
            models.AnalysisHistory.upload_id == upload_id,
            models.AnalysisHistory.user_id == current_user.id
        ).first()
    else:
        # Get latest analysis for this user
        history = db.query(models.AnalysisHistory).filter(
            models.AnalysisHistory.user_id == current_user.id
        ).order_by(models.AnalysisHistory.created_at.desc()).first()

    if not history:
        return schemas.ChatResponse(
            response="Je n'ai pas encore accès à vos données pour répondre. Veuillez d'abord uploader un fichier et lancer l'analyse."
        )

    # PulseTalk logic
    # The 'full_data' field contains the analysis result from analytics.py
    business_data = history.full_data
    
    # Generate the AI response
    response_text = PulseTalkService.generate_response(
        user_query=request.message,
        business_data=business_data,
        api_key=current_user.google_api_key
    )
    
    return schemas.ChatResponse(response=response_text)
