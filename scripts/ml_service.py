# ml_service.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import numpy as np

app = FastAPI(title="Servicio de Clustering para Transacciones")

# Modelo de entrada para cada transacción
class Transaction(BaseModel):
    amount: float
    hour: int

# Modelo para la respuesta
class ClusteringResult(BaseModel):
    clusters: List[dict]
    outliers: List[dict]

@app.post("/cluster", response_model=ClusteringResult)
def cluster_transactions(transactions: List[Transaction]):
    # Convertir la lista de transacciones a DataFrame
    df = pd.DataFrame([t.dict() for t in transactions])
    
    # Definir las características a usar
    features = ['amount', 'hour']
    
    # Escalar los datos
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[features])
    
    # Definir número de clusters (puedes hacerlo parametrizable)
    k = 3
    kmeans = KMeans(n_clusters=k, random_state=42)
    df['cluster'] = kmeans.fit_predict(X_scaled)
    
    # Calcular distancia de cada punto a su centroide
    centroids = kmeans.cluster_centers_
    distances = np.linalg.norm(X_scaled - centroids[df['cluster']], axis=1)
    df['distance'] = distances
    
    # Por ejemplo, definimos outliers como aquellos que tienen distancia mayor a (media + 2.5*std)
    outliers = []
    for cl in range(k):
        cluster_data = df[df['cluster'] == cl]
        mean_d = cluster_data['distance'].mean()
        std_d = cluster_data['distance'].std()
        threshold = mean_d + 2.5 * std_d
        cluster_outliers = cluster_data[cluster_data['distance'] > threshold]
        outliers.extend(cluster_outliers.to_dict(orient='records'))
    
    return {
        "clusters": df.to_dict(orient="records"),
        "outliers": outliers
    }

# Para ejecutar el servicio:
# uvicorn ml_service:app --reload
