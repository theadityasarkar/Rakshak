from typing import List, Optional
from pydantic import BaseModel, Field


class AlertEvaluateRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)
    radius_km: float = Field(default=5.0, gt=0.0, le=500.0)


class ActiveAlert(BaseModel):
    id: str
    anomaly_id: str
    urgency: str
    severity: str
    certainty: str
    headline: str
    area_desc: str
    centroid: List[float]
    radius_km: float = 5.0
    effective_utc: str
    expires_utc: str
    peak_intensity: str
    action_recommended: str
    # Phase 6: IMD Standardized Categories & 5km Subgrid Parameters
    imd_category: Optional[str] = "ORANGE"  # RED | ORANGE | YELLOW | GREEN
    imd_color_code: Optional[str] = "#f97316"
    lead_time_hours: Optional[int] = 24
    probability_pct: Optional[float] = 78.0
    action_hi: Optional[str] = None


class AlertEvaluateResponse(BaseModel):
    provenance: str
    evaluated_at: str
    query_centroid: List[float]
    radius_km: float = 5.0
    in_risk_zone: bool
    matched_alerts: List[ActiveAlert]
    nearest_anomaly_id: Optional[str] = None
    distance_to_nearest_km: Optional[float] = None
    # Evaluated IMD Summary for query coordinate
    overall_imd_category: Optional[str] = "GREEN"
    overall_imd_color: Optional[str] = "#22c55e"
    primary_action: Optional[str] = None
    primary_action_hi: Optional[str] = None
