import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import timedelta
from typing import Dict, List, Any

class ForecastService:
    @staticmethod
    def predict_sales(df: pd.DataFrame, mapping: Dict[str, str], days: int = 30):
        # Prepare data
        # Data has already been renamed to system field names by DataService
        
        # Ensure we have the required columns
        required = ['date', 'quantity', 'price']
        for col in required:
            if col not in df.columns:
                print(f"Warning: Missing column {col} for forecasting")
                return {"error": f"Missing required data field: {col}", "forecast": [], "confidence_indicator": "None"}

        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0)
        df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0)
        df = df.dropna(subset=['date'])
        
        if df.empty:
            return {"error": "No valid data rows after cleaning", "forecast": [], "confidence_indicator": "None"}

        df['sales'] = df['quantity'] * df['price']

        # Daily aggregation
        daily = df.groupby('date')['sales'].sum().reset_index()
        daily = daily.sort_values('date')

        if len(daily) < 2:
            return {"error": "Not enough historical data points for forecasting", "forecast": [], "confidence_indicator": "Low"}

        # Linear Regression
        # Convert dates to ordinal numbers for regression
        X = np.array(range(len(daily))).reshape(-1, 1)
        y = daily['sales'].values
        
        model = LinearRegression()
        model.fit(X, y)

        # Future dates
        last_date = daily['date'].max()
        future_X = np.array(range(len(daily), len(daily) + days)).reshape(-1, 1)
        predictions = model.predict(future_X)

        forecast = []
        for i, pred in enumerate(predictions):
            future_date = last_date + timedelta(days=i+1)
            forecast.append({
                "date": future_date.strftime('%Y-%m-%d'),
                "predicted_sales": max(0, float(pred))
            })

        return {
            "forecast": forecast,
            "confidence_indicator": "High" if len(daily) > 30 else "Medium"
        }

    @staticmethod
    def get_recommendations(analysis: Dict[str, Any]) -> List[str]:
        recommendations = []
        
        top_products = list(analysis.get('top_products', {}).keys())
        if top_products:
            # Using a more robust way to get top 3 to satisfy linter
            top_3 = []
            for i in range(min(3, len(top_products))):
                top_3.append(top_products[i])
            if top_3:
                recommendations.append(f"Stock up on top performing products: {', '.join(top_3)}.")

        # Insights from dynamic breakdowns
        breakdowns = analysis.get('categorical_breakdowns', {})
        for field, data in breakdowns.items():
            if data:
                # Find the top category in this breakdown
                top_cat = max(data, key=lambda x: x['value'])
                recommendations.append(f"Your best performing {field.replace('_', ' ')} is '{top_cat['name']}' with ${top_cat['value']:.2f} in sales.")

        total_profit = analysis.get('total_profit_value')
        total_sales = analysis.get('total_sales_value')
        
        if total_profit and total_sales and total_sales > 0 and (total_profit / total_sales < 0.2):
            recommendations.append("Your profit margin is below 20%. Consider reviewing product costs or increasing prices.")
        
        recommendations.append("Analyze monthly trends to identify seasonal peaks and plan marketing campaigns accordingly.")
        
        return recommendations
