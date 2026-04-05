from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, analytics, users, pulsetalk, magic_scanner, inventory
from fastapi.staticfiles import StaticFiles
import os

# Initialize DB
print("Initializing database...")
Base.metadata.create_all(bind=engine)
print("Database initialized.")

app = FastAPI(title=settings.PROJECT_NAME)

# Ensure logo directory exists
logo_dir = os.path.join(settings.UPLOAD_DIR, "logos")
if not os.path.exists(logo_dir):
    os.makedirs(logo_dir)

# Mount static files for logos
app.mount("/api/analytics/logo", StaticFiles(directory=logo_dir), name="logos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(pulsetalk.router, prefix="/api/pulsetalk", tags=["pulsetalk"])
app.include_router(magic_scanner.router, prefix="/api/magic-scanner", tags=["magic_scanner"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])

@app.get("/")
def read_root():
    return {"message": "Welcome to BusinessPulse API"}
