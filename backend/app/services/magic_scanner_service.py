import google.generativeai as genai
from app.core.config import settings
from typing import Dict, Any, Optional
import json
import io
from PIL import Image
from datetime import datetime

class MagicScannerService:
    @staticmethod
    def _initialize_gemini(api_key: Optional[str] = None):
        key = api_key or settings.GOOGLE_API_KEY
        if not key:
            return None
        genai.configure(api_key=key)
        # Using gemini-flash-latest as identified in the diagnostic models list
        return genai.GenerativeModel('gemini-flash-latest')

    @classmethod
    def scan_invoice(cls, image_data: bytes, api_key: Optional[str] = None) -> Dict[str, Any]:
        model = cls._initialize_gemini(api_key)
        if not model:
            return {"error": "IA non configurée. Veuillez ajouter votre clé API."}

        # Load image for Gemini
        img = Image.open(io.BytesIO(image_data))

        prompt = """
        Vous êtes un expert en extraction de données de factures et bons de commande.
        Analysez cette image et extrayez les informations suivantes sous format JSON STRICT :
        {
            "vendor_name": "Nom du fournisseur (cherchez en haut de la page)",
            "date": "YYYY-MM-DD",
            "items": [
                {
                    "product": "Nom précis du produit",
                    "quantity": 0,
                    "unit_price": 0.0,
                    "total": 0.0
                }
            ],
            "total_amount": 0.0,
            "currency": "MAD/USD/EUR"
        }

        RÈGLES CRITIQUES :
        1. Retournez UNIQUEMENT le JSON, sans explications ni markdown.
        2. Identifiez clairement le NOM DU FOURNISSEUR (souvent en gros en haut).
        3. Si la date est au format 'DD/MM/YYYY' ou 'MM/DD/YYYY', convertissez-la en 'YYYY-MM-DD'.
        4. Pour chaque produit, vérifiez si quantity * unit_price = total. Si l'image montre une erreur, utilisez les chiffres qui semblent les plus logiques.
        5. Nettoyez les noms des produits des bruits de lecture (ex: caractères spéciaux inutiles).
        6. Si une valeur est illisible, essayez de la déduire du contexte (ex: total - autres totaux = valeur manquante).
        """

        try:
            response = model.generate_content([prompt, img])
            
            if not response.candidates or not response.candidates[0].content.parts:
                return {"error": "L'IA n'a pas pu générer de réponse."}
            
            text = response.text.strip()
            # Extract JSON from response
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            return cls._validate_and_correct(data)
            
        except Exception as e:
            import traceback
            error_msg = traceback.format_exc()
            with open("scanner_errors.log", "a", encoding="utf-8") as f:
                f.write(f"\n--- Error {datetime.utcnow()} ---\n{error_msg}\n")
            return {"error": f"L'analyse a échoué : {str(e)}"}

    @staticmethod
    def _validate_and_correct(data: Dict[str, Any]) -> Dict[str, Any]:
        """Performs OCR correction and validation on the extracted data."""
        if not data or "items" not in data:
            return data

        corrected_items = []
        calculated_total = 0.0

        for item in data.get("items", []):
            qty = float(item.get("quantity") or 0)
            price = float(item.get("unit_price") or 0)
            
            # Simple correction: qty * price = total
            expected_total = round(qty * price, 2)
            actual_total = float(item.get("total") or 0)
            
            # If discrepancy exists, trust qty and price over total from OCR
            if abs(expected_total - actual_total) > 0.05:
                item["total"] = expected_total
            
            calculated_total += item.get("total", 0)
            corrected_items.append(item)

        data["items"] = corrected_items
        
        # If total_amount is wrong or missing, fix it
        if not data.get("total_amount") or abs(float(data["total_amount"]) - calculated_total) > 0.1:
            data["total_amount"] = round(calculated_total, 2)

        # Default values for missing fields
        if not data.get("vendor_name"):
            data["vendor_name"] = "Fournisseur Non Détecté"
        if not data.get("date"):
            data["date"] = datetime.utcnow().strftime("%Y-%m-%d")

        return data
