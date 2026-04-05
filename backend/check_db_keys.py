import sqlite3
import os

db_path = "businesspulse.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, email, google_api_key FROM users LIMIT 5")
        rows = cursor.fetchall()
        print("Users in database:")
        for row in rows:
            print(f"ID: {row[0]}, Email: {row[1]}, Google Key: {row[2][:10] if row[2] else 'None'}...")
    except Exception as e:
        print(f"Error reading database: {e}")
    finally:
        conn.close()
else:
    print(f"Database {db_path} not found.")
