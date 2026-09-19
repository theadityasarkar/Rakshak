from typing import List, Optional
from pydantic import BaseModel


class TrajectoryWaypoint(BaseModel):
    step: str
    day_label: str
    hours_ahead: int
    lat: float
    lon: float
    pressure_level_hpa: str
    confidence: float
    uncertainty_radius_km: float
    precip_rate_mm_hr: float
    shear_kts: float
    mesh_node_id: int
    bounding_box: Optional[List[float]] = None
    p10_lat: Optional[float] = None
    p10_lon: Optional[float] = None
    p50_lat: Optional[float] = None
    p50_lon: Optional[float] = None
    p90_lat: Optional[float] = None
    p90_lon: Optional[float] = None


class AnomalyTrackResponse(BaseModel):
    provenance: str
    anomaly_id: str
    waypoints: List[TrajectoryWaypoint]

