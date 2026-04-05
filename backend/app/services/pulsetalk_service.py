from openai import OpenAI
import google.generativeai as genai
from app.core.config import settings
from typing import Dict, Any, Optional
import json

class PulseTalkService:
    @staticmethod
    def _initialize_openai(api_key: Optional[str] = None):
        # Support OpenAI keys
        if api_key:
            api_key = str(api_key).strip()
        if api_key and api_key.startswith("sk-"):
            key = api_key
        else:
            key = settings.OPENAI_API_KEY
            
        if not key:
            return None
        return OpenAI(api_key=key)

    @staticmethod
    def _initialize_gemini(api_key: Optional[str] = None):
        # Support Gemini keys ("AIza...")
        if api_key:
            api_key = str(api_key).strip()
        if api_key and api_key.startswith("AIza"):
            key = api_key
        else:
            key = settings.GOOGLE_API_KEY
            
        if not key:
            return None
        try:
            genai.configure(api_key=key)
            return genai.GenerativeModel('gemini-2.5-flash')
        except Exception as e:
            print(f"Failed to initialize Gemini: {e}")
            return None

    @classmethod
    def generate_response(cls, user_query: str, business_data: Dict[str, Any], language: str = 'fr', api_key: Optional[str] = None) -> str:
        # Check which client to use based on key passed or env vars
        if api_key:
            api_key = str(api_key).strip()
            
        use_gemini = (api_key and api_key.startswith("AIza")) or (not api_key and settings.GOOGLE_API_KEY)
        client_openai = None
        client_gemini = None
        
        if use_gemini:
            client_gemini = cls._initialize_gemini(api_key)
        else:
            client_openai = cls._initialize_openai(api_key)
            
        if not client_openai and not client_gemini:
            return "Désolé, l'assistant IA n'est pas configuré. Veuillez ajouter votre clé API (Google Gemini ou OpenAI) dans les paramètres."

        # Construct the context from business data
        # We simplify the data to make it digestible for the LLM
        summary = business_data.get('summary', {})
        forecast = business_data.get('forecast', {}).get('forecast', [])
        mba = business_data.get('market_basket', {})
        
        context = {
            "total_sales": summary.get('total_sales_value'),
            "total_profit": summary.get('total_profit_value'),
            "sales_growth": summary.get('sales_growth'),
            "top_products": summary.get('top_products'),
            "recent_forecast": forecast[:5], # Send a snippet of forecast
            "ai_recommendations": recommendations,
            "market_basket_rules": mba.get('top_rules', [])[:5], # Top 5 rules
            "best_cross_selling": mba.get('best_opportunities', [])
        }

        system_prompt = f"""
Vous êtes PulseTalk, l'assistant IA intelligent de BusinessPulse. 
Votre rôle est d'aider l'utilisateur à comprendre ses données commerciales de manière professionnelle et amicale.

CONTEXTE COMMERCIAL ACTUEL :
{json.dumps(context, indent=2)}

DIRECTIVES :
1. Répondez dans la langue de l'utilisateur (détectée : {language}).
2. Soyez précis et basez-vous UNIQUEMENT sur les données fournies dans le contexte ci-dessus.
3. Si les données ne permettent pas de répondre, dites-le poliment.
4. Utilisez un ton encourageant et orienté vers l'action.
5. Formatez votre réponse avec un style Markdown (points, gras) si nécessaire pour la clarté.
8. SIMULATION DE DÉCISION : Si l'utilisateur propose de changer le prix d'un produit, utilisez un coefficient d'élasticité de -1.5 (Une hausse de prix de 10% réduit la quantité de 15%). Estimez le nouveau profit et expliquez l'impact mathématiquement en restant bref.
"""

        try:
            if client_gemini:
                try:
                    response = client_gemini.generate_content(
                        f"System: {system_prompt}\n\nUser: {user_query}"
                    )
                    return response.text.strip()
                except Exception as eval_err:
                    import traceback
                    with open("gemini_error.txt", "w", encoding="utf-8") as f:
                        f.write(traceback.format_exc())
                    print(f"Error calling Gemini: {eval_err}")
                    return "Désolé, une erreur est survenue lors de la communication avec l'IA Gemini. Veuillez vérifier votre clé API ou réessayer plus tard."
            
            if client_openai:
                response = client_openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_query}
                    ]
                )
                return response.choices[0].message.content.strip()
                
        except Exception as e:
            print(f"Error calling AI: {e}")
            if "insufficient_quota" in str(e):
                return "Désolé, votre clé API OpenAI n'a plus de crédit (insufficient_quota). Veuillez recharger votre compte OpenAI."
            return "Désolé, une erreur est survenue lors de la communication avec l'IA. Veuillez vérifier votre clé API ou réessayer plus tard."
        
        return "Désolé, une erreur inattendue s'est produite lors de la communication avec l'IA."
