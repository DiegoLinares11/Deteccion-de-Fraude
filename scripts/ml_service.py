from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import numpy as np
import logging
from sklearn.metrics import silhouette_score

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_service")

app = FastAPI(title="Servicio de Clustering para Transacciones")

# Modelo de entrada para cada transacción
class Transaction(BaseModel):
    amount: float = Field(..., gt=0, description="Monto de la transacción (debe ser mayor a 0)")
    hour: int = Field(..., ge=0, le=23, description="Hora de la transacción (0-23)")

# Modelo para la respuesta, actualizado para outliers como diccionario
class ClusteringResult(BaseModel):
    clusters: List[dict]
    outliers: dict
    inertia: Optional[float] = None      # Inercia del clustering
    silhouette: Optional[float] = None   # Coeficiente de silueta
    cluster_summary: Optional[List[dict]] = None  # Resumen por cluster

@app.post("/cluster", response_model=ClusteringResult)
def cluster_transactions(
    transactions: List[Transaction],
    k: int = Query(3, ge=2, description="Número de clusters a formar (mínimo 2)")
):
    # Validar que se reciba al menos una transacción
    if not transactions:
        logger.error("No se recibieron transacciones.")
        raise HTTPException(status_code=400, detail="La lista de transacciones está vacía.")

    try:
        # Convertir la lista de transacciones a DataFrame
        df = pd.DataFrame([t.dict() for t in transactions])
        logger.info(f"Procesando {len(df)} transacciones.")

        # Definir las características a usar
        features = ['amount', 'hour']

        # Escalar los datos
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(df[features])

        # Aplicar KMeans con k clusters
        kmeans = KMeans(n_clusters=k, random_state=42)
        df['cluster'] = kmeans.fit_predict(X_scaled)
        inertia = kmeans.inertia_
        logger.info(f"Clustering completado. Inercia: {inertia}")

        # Calcular distancia de cada punto a su centroide
        centroids = kmeans.cluster_centers_
        distances = np.linalg.norm(X_scaled - centroids[df['cluster']], axis=1)
        df['distance'] = distances

        # Agrupar outliers por cluster: aquellos puntos cuya distancia supera (media + 2.5*std)
        outliers_by_cluster = {}
        for cl in range(k):
            cluster_data = df[df['cluster'] == cl]
            mean_d = cluster_data['distance'].mean()
            std_d = cluster_data['distance'].std()
            threshold = mean_d + 0.5 * std_d
            cluster_outliers = cluster_data[cluster_data['distance'] > threshold]
            outliers_by_cluster[str(cl)] = cluster_outliers.to_dict(orient='records')
            logger.info(
                    f"Cluster {cl} - min: {distances.min():.4f}, median: {distances.median():.4f}, "
                    f"mean: {distances.mean():.4f}, std: {distances.std():.4f}, max: {distances.max():.4f}"
                 )
        # Calcular el coeficiente de silueta si es posible
        if k > 1 and len(transactions) > k:
            sil_score = silhouette_score(X_scaled, df['cluster'])
            logger.info(f"Silhouette Score: {sil_score:.4f}")
        else:
            sil_score = None

        # Generar un resumen por cluster (cantidad, promedio de monto, promedio de hora y distancia promedio)
        cluster_summary = df.groupby('cluster').agg(
            count=('amount', 'count'),
            avg_amount=('amount', 'mean'),
            avg_hour=('hour', 'mean'),
            avg_distance=('distance', 'mean')
        ).reset_index().to_dict(orient='records')

        return {
            "clusters": df.to_dict(orient="records"),
            "outliers": outliers_by_cluster,
            "inertia": inertia,
            "silhouette": sil_score,
            "cluster_summary": cluster_summary
        }
    except Exception as e:
        logger.exception("Error en el clustering:")
        raise HTTPException(status_code=500, detail=f"Error en el clustering: {str(e)}")

# Para ejecutar el servicio:
# uvicorn ml_service:app --reload
