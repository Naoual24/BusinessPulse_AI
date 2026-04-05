import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Optional

class CurrencyService:
    _cache: Dict[str, Dict] = {}
    CACHE_DURATION = timedelta(hours=12)
    BASE_URL = "https://api.frankfurter.app/latest"

    @classmethod
    def get_rates(cls, base: str = "MAD") -> Optional[Dict[str, float]]:
        """
        Fetch exchange rates from Frankfurter API with a 12h cache.
        Frankfurter is free and robust.
        """
        now = datetime.now()
        
        # Check cache
        if base in cls._cache:
            cache_entry = cls._cache[base]
            if now - cache_entry['timestamp'] < cls.CACHE_DURATION:
                print(f"Using cached rates for {base}")
                return cache_entry['rates']

        try:
            print(f"Fetching fresh rates for {base}...")
            response = requests.get(f"{cls.BASE_URL}?from={base}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                rates = data.get('rates', {})
                # Add base to base rate (1.0)
                rates[base] = 1.0
                
                cls._cache[base] = {
                    'timestamp': now,
                    'rates': rates
                }
                return rates
            else:
                print(f"Currency API error: {response.status_code}")
                # Fallback to some hardcoded rates if API is down
                return cls._get_fallback_rates(base)
        except Exception as e:
            print(f"Currency fetch exception: {e}")
            return cls._get_fallback_rates(base)

    @classmethod
    def convert(cls, amount: float, from_curr: str, to_curr: str) -> float:
        if from_curr == to_curr:
            return amount
            
        rates = cls.get_rates(from_curr)
        if rates and to_curr in rates:
            return amount * rates[to_curr]
        
        # If specific base fetch failed, try inverse from USD or EUR if we have it
        # But usually get_rates(from_curr) should handle it
        return amount

    @staticmethod
    def _get_fallback_rates(base: str) -> Dict[str, float]:
        """Rough fallback rates in case of API failure"""
        # Rates as of late Feb 2026 (approximate)
        fallbacks = {
            "MAD": {"USD": 0.098, "EUR": 0.092, "MAD": 1.0},
            "USD": {"MAD": 10.2, "EUR": 0.94, "USD": 1.0},
            "EUR": {"MAD": 10.8, "USD": 1.06, "EUR": 1.0}
        }
        return fallbacks.get(base, {"USD": 1.0, "EUR": 1.0, "MAD": 1.0})
