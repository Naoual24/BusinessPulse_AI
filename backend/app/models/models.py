from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    company_logo = Column(String, nullable=True)
    currency = Column(String, default="MAD", nullable=False)
    google_api_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploads = relationship("Upload", back_populates="owner")
    analyses = relationship("AnalysisHistory", back_populates="user")

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    mapping = Column(JSON, nullable=True) # Column mapping: { 'date': 'col1', ... }
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="uploads")
    analysis = relationship("AnalysisHistory", back_populates="upload", uselist=False)

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    total_sales = Column(String, nullable=False)
    total_profit = Column(String, nullable=False)
    top_product = Column(String, nullable=False)
    full_data = Column(JSON, nullable=False) # Stores the full analytics JSON
    user_id = Column(Integer, ForeignKey("users.id"))
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    analysis_type = Column(String, default="sales") # 'sales', 'mba', 'intelligence'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analyses")
    upload = relationship("Upload", back_populates="analysis")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True, nullable=False)
    quantity = Column(Integer, default=0)
    unit_price = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User")

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    vendor_name = Column(String, index=True)
    date = Column(String)
    items = Column(JSON, nullable=False) # List of extracted items
    total_amount = Column(Float, default=0.0)
    currency = Column(String, default="MAD")
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

