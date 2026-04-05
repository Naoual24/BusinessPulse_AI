from app.services.pulsetalk_service import PulseTalkService
import asyncio

business_data = {
    'summary': {'total_sales_value': 100, 'total_profit_value': 20, 'sales_growth': 5, 'top_products': []},
    'forecast': {'forecast': []},
    'recommendations': []
}

response = PulseTalkService.generate_response(
    user_query="Bonjour",
    business_data=business_data,
    language='fr'
)
print("Response from AI:", response)
