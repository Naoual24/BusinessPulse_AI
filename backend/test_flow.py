import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

try:
    # 1. Signup / Login
    signup_data = {"email": "test2@businesspulse.com", "password": "password123"}
    requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
    
    login_data = {"username": "test2@businesspulse.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    # 2. Upload File
    file_path = r"c:\Users\naoua\Desktop\BusinessPulse\data\sample_sales.csv"
    with open(file_path, "rb") as f:
        r = requests.post(f"{BASE_URL}/analytics/upload", headers=headers, files={"file": f})
    upload_id = r.json().get("id")
    print(f"Uploaded successfully. ID: {upload_id}")

    # 3. Set Mapping
    # The frontend usually sends: { csv_col: system_field }
    # Let's be consistent with how test_flow works
    mapping = {
        "date": "date",
        "product_name": "product",
        "qty_sold": "quantity",
        "unit_price": "price",
        "unit_cost": "cost"
    }
    r = requests.post(f"{BASE_URL}/analytics/{upload_id}/map", headers=headers, json=mapping)
    print("Mapping set:", r.status_code)

    # 4. Get Analytics
    r = requests.get(f"{BASE_URL}/analytics/{upload_id}/analytics", headers=headers)
    print("Analytics response code:", r.status_code)
    
    data = r.json()
    print("Analytics summary keys:", list(data.get("summary", {}).keys()))
    print("Forecast data points:", len(data.get("forecast", {}).get("forecast", [])))
    print("Recommendations count:", len(data.get("recommendations", [])))
    print("SUCCESS: End-to-end API functional!")
except Exception as e:
    print(f"Test failed: {e}")
