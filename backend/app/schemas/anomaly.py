from typing import List
from pydantic import BaseModel, Field


class AnomalyItem(BaseModel):
    id: str
    name: str
    type: str
    lat: float
    lon: float
    district: str
    state: str
    city: str
    severity: str
    efi_index: float = Field(ge=-1.0, le=1.0)
    temp_delta_c: float
    precip_rate_mm_hr: float
    z500_gpm: float
    shear_kts: float
    radius_km: float
    advisory: str


class AnomalyListResponse(BaseModel):
    provenance: str
    dataset_version: str
    generated_at: str
    nwp_source: str
    count: int
    items: List[AnomalyItem]
