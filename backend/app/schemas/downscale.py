from typing import Dict, List
from pydantic import BaseModel


class CoarseNWPData(BaseModel):
    precip_rate_mm_hr: float
    temp_delta_c: float
    z500_gpm: float
    shear_kts: float
    smoothing_note: str


class Downscaled5kmData(BaseModel):
    precip_peak_mm_hr: float
    temp_peak_c: float
    shear_peak_kts: float
    amplitude_recovery_pct: float
    crps_score: float
    mass_conservation_residual: float
    grid_dimensions: List[int]
    resolution_km: float


class DownscaledSample(BaseModel):
    coarse_nwp_12km: CoarseNWPData
    downscaled_5km: Downscaled5kmData
    subgrid_bounding_box: Dict[str, float]


class AnomalyDownscaledResponse(BaseModel):
    provenance: str
    anomaly_id: str
    data: DownscaledSample
