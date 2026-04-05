import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any

class PredictiveAIService:
    @staticmethod
    def predict_churn(rfm_df: pd.DataFrame) -> Dict[str, float]:
        """
        Predict churn probability based on recency and frequency relative to averages.
        """
        churn_predictions = {}
        avg_recency = rfm_df['recency'].mean()
        
        for customer, row in rfm_df.iterrows():
            # Simple probabilistic model: recency/avg_recency weighted by frequency
            # If recency is 2x avg, churn probability is high
            prob = min(0.95, (row['recency'] / (avg_recency * 2)) * (1 / (1 + np.log1p(row['frequency']))))
            churn_predictions[str(customer)] = round(float(prob), 2)
            
        return churn_predictions

    @staticmethod
    def predict_clv(rfm_df: pd.DataFrame) -> Dict[str, float]:
        """
        Predict Customer Lifetime Value using Simple CLV Formula:
        (Avg Order Value * Purchase Frequency) * Profit Margin * Lifespan
        """
        clv_predictions = {}
        profit_margin = 0.25 # Assume 25% margin
        lifespan_years = 2
        
        for customer, row in rfm_df.iterrows():
            aov = row['monetary'] / row['frequency']
            # Predicted annual value = current yearly trajectory
            # Simplified for demo: Current monetary * multiplier based on frequency
            predicted_clv = row['monetary'] * (1 + (row['frequency'] * 0.1)) * Lifespan_multiplier(row['recency'])
            clv_predictions[str(customer)] = round(float(predicted_clv), 2)
            
        return clv_predictions

def Lifespan_multiplier(recency: int) -> float:
    # Decrease multiplier as recency increases
    if recency < 30: return 1.5
    if recency < 90: return 1.0
    if recency < 180: return 0.5
    return 0.1

class CampaignService:
    @staticmethod
    def get_recommendations(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        recs = {
            "Faithful Premium": {
                "action": "Exclusive VIP Access",
                "desc": "Invite to premium loyalty program & early access to new collections.",
                "priority": "High"
            },
            "Sleeping Clients": {
                "action": "Win-back Email",
                "desc": "Send a 'We miss you' discount code (20% off).",
                "priority": "Medium"
            },
            "At Risk": {
                "action": "Retention Offer",
                "desc": "Special discount on their most purchased items to prevent churn.",
                "priority": "Critical"
            },
            "New Clients": {
                "action": "Welcome Series",
                "desc": "Onboarding emails with brand story and next-purchase incentive.",
                "priority": "Medium"
            }
        }
        
        result_recs = []
        for seg in set([s['segment'] for s in segments]):
            if seg in recs:
                result_recs.append({
                    "segment": seg,
                    **recs[seg]
                })
        return result_recs
