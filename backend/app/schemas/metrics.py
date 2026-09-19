from typing import Any, Dict
from pydantic import BaseModel


class MetricsResponse(BaseModel):
    provenance: str
    dataset_version: str
    generated_at: str
    pipeline_benchmarks: Dict[str, Any]
