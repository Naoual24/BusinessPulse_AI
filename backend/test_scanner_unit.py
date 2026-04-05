import google.generativeai as genai
import os
from dotenv import load_dotenv
import io
from PIL import Image
from app.services.magic_scanner_service import MagicScannerService

load_dotenv()

# Create a small blank image for testing
img = Image.new('RGB', (100, 100), color = (73, 109, 137))
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='PNG')
image_data = img_byte_arr.getvalue()

try:
    print("Testing MagicScannerService.scan_invoice...")
    # This will likely fail to extract real invoice data from a blank image, 
    # but it will verify the model initialization and API call flow.
    result = MagicScannerService.scan_invoice(image_data)
    print("Result:", result)
except Exception as e:
    print(f"Test failed with error: {e}")
