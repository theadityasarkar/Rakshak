"""Alerts and 5km-radius subgrid hazard evaluation router."""

from fastapi import APIRouter
from app.services.demo_service import demo_service
from app.schemas.alert import AlertEvaluateRequest, AlertEvaluateResponse

router = APIRouter(prefix="/api/v1/alerts", tags=["Subgrid Alerts (5km Radius)"])


@router.post("/evaluate", response_model=AlertEvaluateResponse)
def evaluate_alerts(request: AlertEvaluateRequest):
    """Evaluate whether a geographic coordinate (lat, lon) and radius intersects an active 5km extreme weather alert zone."""
    result = demo_service.evaluate_alerts(
        lat=request.lat,
        lon=request.lon,
        radius_km=request.radius_km,
    )
    return AlertEvaluateResponse(**result)
