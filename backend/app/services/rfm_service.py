import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from datetime import datetime
from typing import Dict, List, Any

class RFMService:
    @staticmethod
    def calculate_rfm(df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
        """
        Calculate RFM metrics for each customer.
        mapping format from DB: { "system_field": "file_column" }
        e.g. { "date": "Order Date", "customer": "Customer Name", ... }
        """
        # Build rename dict: file_col -> system_field
        # Only for RFM-relevant fields
        rfm_fields = ['date', 'customer', 'quantity', 'price']
        rename_map = {}
        for sys_field, file_col in mapping.items():
            if sys_field in rfm_fields and isinstance(file_col, str):
                rename_map[file_col] = sys_field
        
        df_rfm = df.rename(columns=rename_map).copy()

        # Validate only required non-customer columns
        for col in ['date', 'quantity', 'price']:
            if col not in df_rfm.columns:
                raise ValueError(f"Required column '{col}' not found. Available: {list(df_rfm.columns)}")
        
        # If 'customer' column not mapped, fall back to 'product' grouping
        # This lets old files work without needing to re-upload
        if 'customer' not in df_rfm.columns:
            if 'product' in df_rfm.columns:
                df_rfm['customer'] = df_rfm['product'].astype(str)
            else:
                # Last resort: use row index as unique customer
                df_rfm['customer'] = 'Customer_' + df_rfm.reset_index(drop=True).index.astype(str)
        
        # Ensure correct types
        df_rfm['date'] = pd.to_datetime(df_rfm['date'], errors='coerce')
        df_rfm = df_rfm.dropna(subset=['date'])
        df_rfm['quantity'] = pd.to_numeric(df_rfm['quantity'], errors='coerce').fillna(0)
        df_rfm['price'] = pd.to_numeric(df_rfm['price'], errors='coerce').fillna(0)
        df_rfm['sales'] = df_rfm['quantity'] * df_rfm['price']
        
        # Reference date for recency (day after last purchase)
        ref_date = df_rfm['date'].max() + pd.Timedelta(days=1)
        
        rfm = df_rfm.groupby('customer').agg(
            recency=('date', lambda x: (ref_date - x.max()).days),
            frequency=('customer', 'count'),
            monetary=('sales', 'sum')
        )
        
        return rfm

    @staticmethod
    def segment_customers(rfm_df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply K-Means clustering to RFM metrics.
        """
        if len(rfm_df) < 5: # Minimum customers for 4-5 clusters
            # Fallback for small data: Simple quartile-based segmentation
            rfm_df['cluster'] = 0
            return rfm_df

        # Scale data
        scaler = StandardScaler()
        rfm_scaled = scaler.fit_transform(rfm_df[['recency', 'frequency', 'monetary']])
        
        # KMeans Clustering (set to 4 clusters for distinct segments)
        kmeans = KMeans(n_init=10, n_clusters=4, random_state=42)
        rfm_df['cluster'] = kmeans.fit_predict(rfm_scaled)
        
        return rfm_df

    @staticmethod
    def get_segment_labels(rfm_df: pd.DataFrame) -> Dict[int, str]:
        """
        Assign human-readable labels to clusters based on their averages.
        """
        cluster_avg = rfm_df.groupby('cluster').agg({
            'recency': 'mean',
            'frequency': 'mean',
            'monetary': 'mean'
        })
        
        # Sort and label
        # Higher monetary/frequency + lower recency = VIP/Loyal
        # High recency = At risk/Sleeping
        
        labels = {}
        for i in cluster_avg.index:
            row = cluster_avg.loc[i]
            if row['monetary'] > cluster_avg['monetary'].mean() and row['recency'] < cluster_avg['recency'].mean():
                labels[i] = "Faithful Premium"
            elif row['recency'] > cluster_avg['recency'].quantile(0.75):
                labels[i] = "Sleeping Clients"
            elif row['recency'] > cluster_avg['recency'].mean() and row['monetary'] < cluster_avg['monetary'].mean():
                labels[i] = "At Risk"
            else:
                labels[i] = "New Clients"
        
        return labels

    @staticmethod
    def analyze_segments(df: pd.DataFrame, mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Main entry point for RFM analysis.
        """
        try:
            rfm = RFMService.calculate_rfm(df, mapping)
            rfm_clustered = RFMService.segment_customers(rfm)
            labels = RFMService.get_segment_labels(rfm_clustered)
            
            rfm_clustered['segment'] = rfm_clustered['cluster'].map(labels)
            
            # Prepare result for frontend
            customer_list = []
            for customer, row in rfm_clustered.iterrows():
                customer_list.append({
                    "id": str(customer),
                    "recency": int(row['recency']),
                    "frequency": int(row['frequency']),
                    "monetary": float(row['monetary']),
                    "segment": row['segment']
                })
            
            # Segment distribution
            distribution = rfm_clustered['segment'].value_counts().to_dict()
            dist_list = [{"name": k, "value": v} for k, v in distribution.items()]
            
            return {
                "customers": customer_list,
                "segments": dist_list,
                "stats": {
                    "total_customers": len(rfm_clustered),
                    "top_segment": max(distribution, key=distribution.get) if distribution else "N/A"
                }
            }
        except Exception as e:
            print(f"RFM analysis error: {str(e)}")
            return {"error": str(e)}
