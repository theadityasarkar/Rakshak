"""Anomalies, 4D GNN tracks, and 5km downscaling router."""

from fastapi import APIRouter, HTTPException
from backend.app.services.demo_service import demo_service
from backend.app.schemas.anomaly import AnomalyListResponse, AnomalyItem
from backend.app.schemas.track import AnomalyTrackResponse
from backend.app.schemas.downscale import AnomalyDownscaledResponse

router = APIRouter(prefix="/api/v1/anomalies", tags=["Anomalies & AI Tracking"])


@router.get("", response_model=AnomalyListResponse)
def list_anomalies():
    """List all currently tracked extreme weather anomalies across India."""
    data = demo_service.get_anomalies()
    return AnomalyListResponse(
        provenance=data["provenance"],
        dataset_version=data["dataset_version"],
        generated_at=data["generated_at"],
        nwp_source=data["nwp_source"],
        count=len(data["items"]),
        items=[AnomalyItem(**item) for item in data["items"]],
    )


@router.get("/{anomaly_id}", response_model=AnomalyItem)
def get_anomaly(anomaly_id: str):
    """Retrieve telemetry and metadata for a specific weather anomaly."""
    anomaly = demo_service.get_anomaly_by_id(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail=f"Anomaly '{anomaly_id}' not found.")
    return anomaly


@router.get("/{anomaly_id}/track", response_model=AnomalyTrackResponse)
def get_anomaly_track(anomaly_id: str):
    """Retrieve the 4D Spatio-Temporal Trajectory (lat, lon, pressure level, time) for an anomaly."""
    track_data = demo_service.get_track(anomaly_id)
    if not track_data:
        raise HTTPException(
            status_code=404,
            detail=f"4D Trajectory for anomaly '{anomaly_id}' not found in tracking registry.",
        )
    return AnomalyTrackResponse(**track_data)


@router.get("/{anomaly_id}/downscaled", response_model=AnomalyDownscaledResponse)
def get_anomaly_downscaled(anomaly_id: str):
    """Retrieve 12km coarse NWP vs 5km DDPM generative downscaling comparison tensor."""
    downscaled_data = demo_service.get_downscaled(anomaly_id)
    if not downscaled_data:
        raise HTTPException(
            status_code=404,
            detail=f"5km downscaled sample for anomaly '{anomaly_id}' not found in registry.",
        )
    return AnomalyDownscaledResponse(**downscaled_data)
