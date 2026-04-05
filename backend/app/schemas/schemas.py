from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    company_logo: Optional[str] = None
    currency: Optional[str] = "MAD"
    google_api_key: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    currency: Optional[str] = None
    google_api_key: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UploadBase(BaseModel):
    filename: str
    mapping: Optional[Dict[str, str]] = None

class Upload(UploadBase):
    id: int
    user_id: int
    created_at: datetime
    analysis: Optional["AnalysisHistory"] = None

    class Config:
        from_attributes = True

class AnalysisHistoryBase(BaseModel):
    filename: str
    total_sales: str
    total_profit: str
    top_product: str
    full_data: Dict
    analysis_type: Optional[str] = "sales"

class AnalysisHistoryCreate(AnalysisHistoryBase):
    upload_id: int

class AnalysisHistory(AnalysisHistoryBase):
    id: int
    user_id: int
    upload_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    upload_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str


class SimulationRequest(BaseModel):
    product_name: str
    new_price: float
    cost_basis: Optional[float] = None

class InventoryItemBase(BaseModel):
    product_name: str
    quantity: int
    unit_price: float

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: int
    user_id: int
    last_updated: datetime

    class Config:
        from_attributes = True

class InventoryBulkCreate(BaseModel):
    items: list[InventoryItemCreate]

class ScanHistoryBase(BaseModel):
    vendor_name: str
    date: str
    items: list[Dict]
    total_amount: float
    currency: str = "MAD"

class ScanHistoryCreate(ScanHistoryBase):
    pass

class ScanHistory(ScanHistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
