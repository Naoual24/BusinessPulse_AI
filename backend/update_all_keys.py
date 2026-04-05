import sqlite3
import os

db_path = "businesspulse.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        new_key = "AIzaSyCaG3hZGaINeS8iYXdp6FLqkpm5NSvhkEo"
        cursor.execute("UPDATE users SET google_api_key = ?", (new_key,))
        conn.commit()
        print(f"Successfully updated {cursor.rowcount} users with the correct Google API Key.")
    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        conn.close()
else:
    print(f"Database {db_path} not found.")
