from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import shutil
import os
import uuid
from ..core import database, config
from ..models import models
from ..schemas import schemas
from .deps import get_current_user
import pandas as pd
import numpy as np
from ..services.data_service import DataService
from ..services.forecast_service import ForecastService

router = APIRouter()

@router.get("/history", response_model=list[schemas.AnalysisHistory])
def get_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.AnalysisHistory).filter(models.AnalysisHistory.user_id == current_user.id).order_by(models.AnalysisHistory.created_at.desc()).all()

@router.post("/upload", response_model=schemas.Upload)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Ensure upload directory exists
    if not os.path.exists(config.settings.UPLOAD_DIR):
        os.makedirs(config.settings.UPLOAD_DIR)

    file_extension = os.path.splitext(file.filename)[1]
    if file_extension not in ['.csv', '.xlsx', '.xls']:
        raise HTTPException(status_code=400, detail="Invalid file type")

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(config.settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_upload = models.Upload(
        filename=file.filename,
        file_path=file_path,
        user_id=current_user.id
    )
    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)
    return new_upload

@router.get("/{upload_id}/columns")
def get_columns(
    upload_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload = db.query(models.Upload).filter(models.Upload.id == upload_id, models.Upload.user_id == current_user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    df = DataService.load_data(upload.file_path)
    return {"columns": DataService.get_column_names(df)}

@router.post("/{upload_id}/map")
def set_mapping(
    upload_id: int,
    mapping: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload = db.query(models.Upload).filter(models.Upload.id == upload_id, models.Upload.user_id == current_user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    upload.mapping = mapping
    db.commit()
    return {"message": "Mapping saved"}

@router.get("/{upload_id}/analytics")
def get_analytics(
    upload_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload = db.query(models.Upload).filter(models.Upload.id == upload_id, models.Upload.user_id == current_user.id).first()
    if not upload or not upload.mapping:
        raise HTTPException(status_code=400, detail="Data or mapping missing")
    
    print(f"Starting analytics for upload {upload_id}")
    try:
        df = DataService.load_data(upload.file_path)
        print("Data loaded, columns:", df.columns.tolist())
        
        # In our implementation, analyze_data should ideally return the cleaned df
        # But for now, let's just make sure predict_sales also cleans properly
        # Prepare mapping with currencies
        currency_code = current_user.currency if len(current_user.currency) == 3 else "MAD"
        mapping_data = upload.mapping.copy()
        mapping_data['target_currency'] = currency_code
        
        analysis, cleaned_df = DataService.analyze_data(df, mapping_data)
        print("Basic analysis complete")
        print("Cleaned DF columns:", cleaned_df.columns.tolist())
        print(cleaned_df.head(2))
        
        forecast = ForecastService.predict_sales(cleaned_df, upload.mapping)
        print("Forecasting complete")
        
        recommendations = ForecastService.get_recommendations(analysis)
        print("Recommendations generated")
        
        # Get Total Expenses from ScanHistory for the dashboard
        scans = db.query(models.ScanHistory).filter(models.ScanHistory.user_id == current_user.id).all()
        total_expenses = sum(s.total_amount for s in scans)

        result = {
            "summary": {
                **analysis,
                "total_expenses": total_expenses,
                "net_balance": round(analysis['total_sales_value'] - total_expenses, 2)
            },
            "forecast": forecast,
            "recommendations": recommendations,
            "alerts": DataService.detect_anomalies(cleaned_df, upload.mapping)
        }

        # Map currency code to symbol for history
        symbols = {"MAD": "DH", "USD": "$", "EUR": "€"}
        symbol = symbols.get(currency_code, currency_code)

        # Save to history if not already present for this upload
        existing_history = db.query(models.AnalysisHistory).filter(
            models.AnalysisHistory.upload_id == upload_id,
            models.AnalysisHistory.analysis_type == "sales"
        ).first()
        if not existing_history:
            history_entry = models.AnalysisHistory(
                filename=upload.filename,
                total_sales=f"{symbol}{analysis['total_sales_value']:,.2f}",
                total_profit=f"{symbol}{analysis['total_profit_value']:,.2f}" if analysis['total_profit_value'] else "N/A",
                top_product=list(analysis['top_products'].keys())[0] if analysis['top_products'] else "N/A",
                full_data=result,
                user_id=current_user.id,
                upload_id=upload_id,
                analysis_type="sales"
            )
            db.add(history_entry)
            db.commit()

        return result
    except Exception as e:
        print(f"Analytics error for upload {upload_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@router.get("/{upload_id}/customer-intelligence")
def get_customer_intelligence(
    upload_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload = db.query(models.Upload).filter(
        models.Upload.id == upload_id,
        models.Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if not os.path.exists(upload.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        from ..services.rfm_service import RFMService
        from ..services.predictive_service import PredictiveAIService, CampaignService
        
        # Load and clean data
        if upload.file_path.endswith('.csv'):
            df = pd.read_csv(upload.file_path)
        else:
            df = pd.read_excel(upload.file_path)

        # 1. RFM Analysis
        rfm_result = RFMService.analyze_segments(df, upload.mapping)
        if "error" in rfm_result:
            return rfm_result

        # 2. Predictive Insights
        rfm_df = RFMService.calculate_rfm(df, upload.mapping)
        churn_weights = PredictiveAIService.predict_churn(rfm_df)
        clv_values = PredictiveAIService.predict_clv(rfm_df)
        
        # Merge predictions into customer list
        for cust in rfm_result['customers']:
            cust['churn_probability'] = churn_weights.get(cust['id'], 0)
            cust['clv'] = clv_values.get(cust['id'], 0)

        # 3. Marketing Recommendations
        recommendations = CampaignService.get_recommendations(rfm_result['customers'])
        
        result = {
            "segmentation": rfm_result,
            "marketing_actions": recommendations,
            "insights": {
                "avg_clv": round(float(np.mean(list(clv_values.values()))), 2) if clv_values else 0,
                "high_risk_count": len([c for c in rfm_result['customers'] if c['churn_probability'] > 0.7])
            }
        }

        # Save to history if not already present for this upload
        existing_history = db.query(models.AnalysisHistory).filter(
            models.AnalysisHistory.upload_id == upload_id,
            models.AnalysisHistory.analysis_type == "intelligence"
        ).first()
        if not existing_history:
            history_entry = models.AnalysisHistory(
                filename=upload.filename,
                total_sales=f"{len(rfm_result['customers'])} Clients",
                total_profit=f"{result['insights']['avg_clv']} CLV",
                top_product=rfm_result['stats']['top_segment'],
                full_data=result,
                user_id=current_user.id,
                upload_id=upload_id,
                analysis_type="intelligence"
            )
            db.add(history_entry)
            db.commit()

        return result

    except Exception as e:
        print(f"Customer Intelligence error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{upload_id}/market-basket")
def get_market_basket(
    upload_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload = db.query(models.Upload).filter(
        models.Upload.id == upload_id,
        models.Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    try:
        from ..services.market_basket_service import MarketBasketService
        
        # Load data
        df = DataService.load_data(upload.file_path)
        
        # Inverse mapping for renaming: {CSV_Col: Internal_Name}
        inner_mapping = {v: k for k, v in upload.mapping.items() if v and isinstance(v, str)}
        df = df.rename(columns=inner_mapping)
        
        # Perform MBA
        result = MarketBasketService.analyze(df)

        if "error" not in result:
            # Save to history if not already present for this upload
            existing_history = db.query(models.AnalysisHistory).filter(
                models.AnalysisHistory.upload_id == upload_id,
                models.AnalysisHistory.analysis_type == "mba"
            ).first()
            if not existing_history:
                # Find most frequent item for 'top_product'
                top_p = "N/A"
                if result.get('top_rules') and len(result['top_rules']) > 0:
                    top_p = f"{result['top_rules'][0]['if'][0]} → {result['top_rules'][0]['then'][0]}"

                history_entry = models.AnalysisHistory(
                    filename=upload.filename,
                    total_sales=f"{result.get('total_baskets', 0)} Trans.",
                    total_profit="MBA Analysis",
                    top_product=top_p,
                    full_data=result,
                    user_id=current_user.id,
                    upload_id=upload_id,
                    analysis_type="mba"
                )
                db.add(history_entry)
                db.commit()
        
        return result
    except Exception as e:
        print(f"Market Basket Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{upload_id}/products")
async def get_products(
    upload_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    upload = db.query(models.Upload).filter(models.Upload.id == upload_id, models.Upload.user_id == current_user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    try:
        from ..services.data_service import DataService
        
        df = DataService.load_data(upload.file_path)
        inner_mapping = {v: k for k, v in upload.mapping.items() if v and isinstance(v, str)}
        df = df.rename(columns=inner_mapping)
        
        if "product" not in df.columns or "price" not in df.columns:
            raise HTTPException(status_code=400, detail="Missing mapped columns")
            
        products_df = df.groupby("product").agg({"price": "mean"}).reset_index()
        products_df = products_df.dropna(subset=["product"]).sort_values(by="product")
        
        products = [{"name": str(row["product"]), "price": float(row["price"])} for _, row in products_df.iterrows()]
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{upload_id}/simulate")
async def simulate_decision(
    upload_id: int, 
    request: schemas.SimulationRequest,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    upload = db.query(models.Upload).filter(models.Upload.id == upload_id, models.Upload.user_id == current_user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    try:
        from ..services.data_service import DataService
        from ..services.simulation_service import SimulationService
        
        df = DataService.load_data(upload.file_path)
        inner_mapping = {v: k for k, v in upload.mapping.items() if v and isinstance(v, str)}
        df = df.rename(columns=inner_mapping)
        
        if not all(col in df.columns for col in ["product", "price", "quantity"]):
            raise HTTPException(status_code=400, detail="Missing required mapped columns for simulation (product, price, quantity)")
            
        result = SimulationService.simulate_price_change(
            df=df, 
            product_col="product", 
            price_col="price", 
            quantity_col="quantity", 
            product_name=request.product_name, 
            new_price=request.new_price, 
            cost_basis=request.cost_basis
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/global-summary")
def get_global_summary(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Returns a summary of Sales (from History) and Purchases (from Scans)."""
    try:
        # 1. Total Sales from verified analyses
        history = db.query(models.AnalysisHistory).filter(models.AnalysisHistory.user_id == current_user.id).all()
        total_sales = 0.0
        latest_analysis = None
        
        if history:
            # We take the sum of total_sales from all history entries
            # Need to parse the string formatted sales (e.g. "$1,234.56")
            for entry in history:
                try:
                    val_str = str(entry.total_sales).replace(",", "").replace("$", "").replace("€", "").replace("DH", "").replace("MAD", "").strip()
                    total_sales += float(val_str)
                except: continue
            
            # Use the latest analysis for structure (charts, recommendations)
            latest_analysis = history[0].full_data
            if isinstance(latest_analysis, str):
                import json
                latest_analysis = json.loads(latest_analysis)

        # 2. Total Purchases from scans
        scans = db.query(models.ScanHistory).filter(models.ScanHistory.user_id == current_user.id).all()
        total_expenses = sum(s.total_amount for s in scans)

        if not latest_analysis:
            # Create a mock/empty analysis structure if none exists
            latest_analysis = {
                "summary": {
                    "total_sales_value": 0,
                    "aov": 0,
                    "profit_margin": 0,
                    "top_products": {},
                    "monthly_trends": [],
                    "comparison": {"current_sales": 0, "previous_sales": 0},
                    "categorical_breakdowns": {}
                },
                "forecast": {"forecast": []},
                "recommendations": ["Commencez par importer vos ventes pour une analyse complète."],
                "alerts": []
            }

        # Override summary with global totals
        latest_analysis["summary"]["total_sales_value"] = total_sales
        latest_analysis["summary"]["total_expenses"] = total_expenses
        latest_analysis["summary"]["net_balance"] = round(total_sales - total_expenses, 2)
        
        return latest_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
