from app.routers.health import router as health_router
from app.routers.anomalies import router as anomalies_router
from app.routers.alerts import router as alerts_router
from app.routers.metrics import router as metrics_router

__all__ = ["health_router", "anomalies_router", "alerts_router", "metrics_router"]
