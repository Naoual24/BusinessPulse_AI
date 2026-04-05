import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from .sentiment_service import SentimentService
from .currency_service import CurrencyService

class DataService:
    @staticmethod
    def load_data(file_path: str) -> pd.DataFrame:
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format")
            
            # Basic cleanup: drop completely empty rows and columns
            df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
            # Trim column names
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            print(f"Error loading data: {e}")
            raise e

    @staticmethod
    def get_column_names(df: pd.DataFrame) -> List[str]:
        # Filter out 'Unnamed' columns
        return [c for c in df.columns if not c.startswith('Unnamed:')]

    @classmethod
    def analyze_data(cls, df: pd.DataFrame, mapping: Dict[str, str]) -> tuple[Dict[str, Any], pd.DataFrame]:
        # Identify core vs dynamic fields
        core_fields = ['date', 'product', 'quantity', 'price', 'cost', 'customer']
        
        # Check if mapping is { "system": "csv_col" } or { "csv_col": "system" }
        # Usually frontend sends: { "csv_col": "system" }
        # Let's count how many system fields are in keys vs values
        keys_are_system = sum(1 for k in mapping.keys() if k in core_fields)
        values_are_system = sum(1 for v in mapping.values() if v in core_fields)
        
        if keys_are_system > values_are_system:
            # It's system -> csv_col, invert it
            mapping = {v: k for k, v in mapping.items()}
            
        dynamic_fields = [k for k in mapping.values() if k not in core_fields]
        
        # Extract source currency from mapping if present
        source_currency = mapping.pop('source_currency', 'MAD') if 'source_currency' in mapping else 'MAD'
        target_currency = mapping.pop('target_currency', 'USD') if 'target_currency' in mapping else 'USD'
        
        # Mapping should now only contain FileCol -> SystemFieldName
        df = df.rename(columns=mapping)

        # Basic cleaning and Currency Conversion
        if 'price' in df.columns or 'cost' in df.columns:
            conversion_rate = 1.0
            if source_currency != target_currency:
                rates = CurrencyService.get_rates(source_currency)
                if rates and target_currency in rates:
                    conversion_rate = rates[target_currency]
            
            if conversion_rate != 1.0:
                if 'price' in df.columns:
                    df['price'] = pd.to_numeric(df['price'], errors='coerce') * conversion_rate
                if 'cost' in df.columns:
                    df['cost'] = pd.to_numeric(df['cost'], errors='coerce') * conversion_rate

        # Basic cleaning
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        
        df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0)
        df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0)
        df['total_sales'] = df['quantity'] * df['price']
        
        if 'cost' in df.columns:
            df['cost'] = pd.to_numeric(df['cost'], errors='coerce').fillna(0)
            df['total_profit'] = df['total_sales'] - (df['quantity'] * df['cost'])
        else:
            df['total_profit'] = 0

        # Sort by date for period calculations
        df = df.sort_values('date')
        
        # Period Comparison Calculations (Last 30 days vs Previous 30 days)
        max_date = df['date'].max()
        period_30d = max_date - pd.Timedelta(days=30)
        period_60d = max_date - pd.Timedelta(days=60)
        
        current_period = df[df['date'] > period_30d]
        previous_period = df[(df['date'] <= period_30d) & (df['date'] > period_60d)]
        
        sales_current = current_period['total_sales'].sum()
        sales_previous = previous_period['total_sales'].sum()
        
        sales_growth = 0
        if sales_previous > 0:
            sales_growth = ((sales_current - sales_previous) / sales_previous) * 100

        # Dynamic Breakdowns
        categorical_breakdowns = {}
        for field in dynamic_fields:
            if field in df.columns:
                breakdown = df.groupby(field)['total_sales'].sum().reset_index()
                breakdown.columns = ['name', 'value']
                categorical_breakdowns[field] = breakdown.to_dict('records')

        # Advanced KPIs
        total_sales = float(df['total_sales'].sum())
        total_transactions = len(df)
        total_profit = float(df['total_profit'].sum())
        
        aov = total_sales / total_transactions if total_transactions > 0 else 0
        profit_margin = (total_profit / total_sales * 100) if total_sales > 0 else 0

        # Top Products (Top 10)
        top_products = df.groupby('product')['total_sales'].sum().sort_values(ascending=False).head(10).to_dict()

        # Monthly Trends
        monthly_trends = df.resample('ME', on='date')['total_sales'].sum().reset_index()
        monthly_trends['date'] = monthly_trends['date'].dt.strftime('%Y-%m')
        
        summary = {
            "total_sales_value": float(np.round(total_sales, 2)),
            "total_profit_value": float(np.round(total_profit, 2)),
            "total_transactions": total_transactions,
            "aov": float(np.round(aov, 2)),
            "profit_margin": float(np.round(profit_margin, 2)),
            "sales_growth": float(np.round(sales_growth, 2)),
            "top_products": top_products,
            "monthly_trends": monthly_trends.to_dict('records'),
            "categorical_breakdowns": categorical_breakdowns,
            "comparison": {
                "current_sales": float(np.round(sales_current, 2)),
                "previous_sales": float(np.round(sales_previous, 2)),
            },
            "sentiment_analysis": cls._process_sentiment(df, mapping)
        }
        
        return summary, df

    @staticmethod
    def detect_anomalies(df: pd.DataFrame, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
        alerts = []
        try:
            # Ensure total_sales exists
            if 'total_sales' not in df.columns:
                return []

            # 1. Global Sales Drop Detection
            daily_sales = df.groupby(pd.Grouper(key='date', freq='D'))['total_sales'].sum().reset_index()
            if len(daily_sales) > 1:
                recent_period = daily_sales.tail(7)
                historical_period = daily_sales.iloc[:-7] if len(daily_sales) > 7 else daily_sales.iloc[:-1]
                
                recent_avg = recent_period['total_sales'].mean()
                historical_avg = historical_period['total_sales'].mean()
                
                if historical_avg > 0 and (historical_avg - recent_avg) / historical_avg >= 0.20:
                    drop_pct = int(np.round((1 - recent_avg/historical_avg)*100))
                    alerts.append({
                        "type": "red",
                        "message": f"Global sales drop detected! Recent average is {drop_pct}% lower than historical average.",
                        "date": datetime.now().strftime('%Y-%m-%d')
                    })

            # 2. Product Surge Detection (Stock alert)
            product_sales = df.groupby('product')['total_sales'].agg(['mean', 'last']).reset_index()
            # This is a bit simplistic; better would be comparing recent week vs historical
            # Let's try grouping by product and window
            recent_date = df['date'].max()
            seven_days_ago = recent_date - pd.Timedelta(days=7)
            
            recent_df = df[df['date'] >= seven_days_ago]
            older_df = df[df['date'] < seven_days_ago]
            
            if not recent_df.empty and not older_df.empty:
                recent_prod = recent_df.groupby('product')['total_sales'].sum()
                older_prod_avg = older_df.groupby('product')['total_sales'].sum() / ( (older_df['date'].max() - older_df['date'].min()).days / 7 or 1 )
                
                for product, recent_val in recent_prod.items():
                    if product in older_prod_avg:
                        old_avg = older_prod_avg[product]
                        if old_avg > 0 and (recent_val - old_avg) / old_avg >= 0.30:
                            surge_pct = int(np.round((recent_val/old_avg - 1)*100))
                            alerts.append({
                                "type": "green",
                                "message": f"High demand for '{product}'! Sales are {surge_pct}% above normal. Consider restocking.",
                                "date": datetime.now().strftime('%Y-%m-%d')
                            })
            
        except Exception as e:
            print(f"Error detecting anomalies: {e}")
        
        return alerts

    @classmethod
    def _process_sentiment(cls, df: pd.DataFrame, mapping: Dict[Any, Any]) -> Optional[Dict[str, Any]]:
        """Helper to process sentiment if a feedback column is provided"""
        # Look for feedback in mapping (mapping values are now the column names from file)
        # Note: mapping was inverted in analyze_data: mapping = {FileCol: SystemField}
        # But we need to find which FileCol maps to 'feedback'
        feedback_col = None
        for file_col, system_field in mapping.items():
            if system_field == 'feedback':
                feedback_col = file_col
                break
        
        if feedback_col and feedback_col in df.columns:
            comments = df[feedback_col].dropna().astype(str).tolist()
            if comments:
                return SentimentService.analyze_batch(comments)
        
        return None
