from app.core.database import SessionLocal
from app.models.models import User

db = SessionLocal()
user = db.query(User).first()
if user:
    user.google_api_key = "AIzaSyCaG3hZGaINeS8iYXdp6FLqkpm5NSvhkEo"
    # Also clear any old OpenAI key that might have been saved in the google_api_key field by mistake
    db.commit()
    print("Successfully updated user's Google API Key!")
else:
    print("No users found in database.")
