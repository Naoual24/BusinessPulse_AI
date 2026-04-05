import traceback

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("Import successful! The issue might be in Uvicorn serving.")
except Exception as e:
    print("Exception during import:")
    traceback.print_exc()
