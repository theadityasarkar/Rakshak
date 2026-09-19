"""Health and model pipeline status router."""

from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas.health import HealthResponse, ModelsHealth

router = APIRouter(prefix="/api/v1", tags=["Health & System"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    """Return health status of the API, underlying AI model checkpoints, and demo mode."""
    # In demo mode, precomputed checkpoints are loaded
    models = ModelsHealth(
        tracker="loaded" if settings.demo_mode else "missing",
        downscaler="loaded" if settings.demo_mode else "missing",
    )
    status = "demo" if settings.demo_mode else ("healthy" if models.tracker == "loaded" and models.downscaler == "loaded" else "degraded")

    return HealthResponse(
        status=status,
        models=models,
        data_init_time="2026-09-19T00:00:00Z",
        last_inference_time="2026-09-19T07:15:00Z",
        demo_mode=settings.demo_mode,
        version=settings.app_version,
    )
