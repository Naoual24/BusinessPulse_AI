import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
from typing import Dict, Any, List, Optional
import numpy as np

class MarketBasketService:
    @staticmethod
    def analyze(df: pd.DataFrame, min_support: float = 0.01) -> Dict[str, Any]:
        """
        Performs Market Basket Analysis using Apriori algorithm.
        Requires 'product' and either 'transaction_id' or 'customer'.
        """
        try:
            # Check for required columns
            if 'product' not in df.columns:
                return {"error": "Columns 'product' is required for MBA."}

            # Grouping key: prefer transaction_id, then customer
            group_keys = []
            if 'transaction_id' in df.columns:
                group_keys.append('transaction_id')
            elif 'customer' in df.columns:
                group_keys.append('customer')
                if 'date' in df.columns:
                    df['date_only'] = pd.to_datetime(df['date']).dt.date
                    group_keys.append('date_only')
            else:
                return {"error": "Either 'transaction_id' or 'customer' column is required for MBA."}

            baskets = df.groupby(group_keys)['product'].apply(list).values.tolist()
            # Important: only keep baskets with > 1 items for meaningful rules
            baskets = [b for b in baskets if len(b) > 1]

            if not baskets:
                return {
                    "top_rules": [],
                    "best_opportunities": [],
                    "seasonal_patterns": {},
                    "total_baskets": 0,
                    "message": "Pas assez de transactions avec plusieurs produits pour analyser."
                }

            # Transaction Encoding
            te = TransactionEncoder()
            te_ary = te.fit(baskets).transform(baskets)
            basket_df = pd.DataFrame(te_ary, columns=te.columns_)

            # Apriori
            frequent_itemsets = apriori(basket_df, min_support=min_support, use_colnames=True)
            
            if frequent_itemsets.empty:
                return {
                    "top_rules": [],
                    "message": "No frequent patterns found at this support level."
                }

            # Association Rules
            rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
            
            if rules.empty:
                return {
                    "top_rules": [],
                    "message": "No strong associations found."
                }

            # Processing and Formatting Rules
            rules['antecedents'] = rules['antecedents'].apply(lambda x: list(x))
            rules['consequents'] = rules['consequents'].apply(lambda x: list(x))
            
            # Sort by Lift and then Confidence
            rules = rules.sort_values(['lift', 'confidence'], ascending=False)

            # Top 10 Rules for general use
            top_rules = []
            for _, row in rules.head(10).iterrows():
                top_rules.append({
                    "if": row['antecedents'],
                    "then": row['consequents'],
                    "support": float(np.round(row['support'], 4)),
                    "confidence": float(np.round(row['confidence'], 4)),
                    "lift": float(np.round(row['lift'], 4))
                })

            # Top 5 Cross-Selling Opportunities (Best Lift)
            best_opportunities = top_rules[:5]

            # Seasonal Analysis (Simple implementation by grouping by month)
            seasonal_patterns = {}
            if 'date' in df.columns:
                df['month'] = pd.to_datetime(df['date']).dt.month
                for month in df['month'].unique():
                    month_df = df[df['month'] == month]
                    if len(month_df) > 10: # Only if enough data
                        m_baskets = month_df.groupby(group_keys)['product'].apply(list).values.tolist()
                        m_te_ary = te.fit(m_baskets).transform(m_baskets)
                        m_basket_df = pd.DataFrame(m_te_ary, columns=te.columns_)
                        m_freq = apriori(m_basket_df, min_support=min_support*1.5, use_colnames=True)
                        if not m_freq.empty:
                            m_rules = association_rules(m_freq, metric="lift", min_threshold=1.2)
                            if not m_rules.empty:
                                m_rules = m_rules.sort_values('lift', ascending=False).head(3)
                                seasonal_patterns[int(month)] = [
                                    {"if": list(r['antecedents']), "then": list(r['consequents'])}
                                    for _, r in m_rules.iterrows()
                                ]

            return {
                "top_rules": top_rules,
                "best_opportunities": best_opportunities,
                "seasonal_patterns": seasonal_patterns,
                "total_baskets": len(baskets)
            }

        except Exception as e:
            import traceback
            print(f"Error in MarketBasketAnalysis: {traceback.format_exc()}")
            return {"error": f"MBA failed: {str(e)}"}
