from typing import Literal
from pydantic import BaseModel


class ModelsHealth(BaseModel):
    tracker: Literal["loaded", "missing"]
    downscaler: Literal["loaded", "missing"]


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "demo"]
    models: ModelsHealth
    data_init_time: str
    last_inference_time: str
    demo_mode: bool
    version: str
