import pandas as pd
import numpy as np
from typing import Dict, Any

class SimulationService:
    @staticmethod
    def simulate_price_change(
        df: pd.DataFrame, 
        product_col: str, 
        price_col: str, 
        quantity_col: str, 
        product_name: str, 
        new_price: float, 
        cost_basis: float = None
    ) -> Dict[str, Any]:
        """
        Simulate the impact of a price change on quantity sold and net profit
        using a Price Elasticity of Demand (PED) model.
        """
        # Filter for the specific product
        product_data = df[df[product_col] == product_name]
        
        if product_data.empty:
            return {"error": f"Product '{product_name}' not found in data."}
            
        # Get current metrics
        current_price = float(product_data[price_col].mean())
        current_quantity = float(product_data[quantity_col].sum())
        
        # If no sales volume
        if current_quantity <= 0:
            return {"error": "No sales volume found for this product to simulate on."}
            
        # If cost_basis isn't provided, estimate it. Let's assume a 40% margin as default
        if cost_basis is None or cost_basis <= 0:
            cost_basis = current_price * 0.60
            
        current_profit = (current_price - cost_basis) * current_quantity
        
        # Calculate percent change in price
        if current_price > 0:
            price_change_pct = (new_price - current_price) / current_price
        else:
            return {"error": "Current price is zero or invalid, cannot calculate elasticity."}
            
        # Apply standard Price Elasticity of Demand (PED = -1.5)
        ped = -1.5
        
        quantity_change_pct = ped * price_change_pct
        
        # New predicted metrics
        new_quantity = current_quantity * (1 + quantity_change_pct)
        # Prevent negative quantities
        new_quantity = max(0.0, new_quantity)
        
        new_profit = (new_price - cost_basis) * new_quantity
        
        return {
            "product_name": product_name,
            "current": {
                "price": round(current_price, 2),
                "quantity": round(current_quantity, 0),
                "profit": round(current_profit, 2)
            },
            "predicted": {
                "price": round(new_price, 2),
                "quantity": round(new_quantity, 0),
                "profit": round(new_profit, 2),
                "cost_basis": round(cost_basis, 2),
                "elasticity_assumed": ped,
                "quantity_change_pct": round(quantity_change_pct * 100, 2),
                "profit_change_pct": round(((new_profit - current_profit) / current_profit * 100) if current_profit != 0 else 0, 2)
            }
        }
