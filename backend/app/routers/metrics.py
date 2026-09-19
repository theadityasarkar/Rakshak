"""Pipeline performance and benchmark evaluation metrics router."""

from fastapi import APIRouter
from backend.app.services.demo_service import demo_service
from backend.app.schemas.metrics import MetricsResponse

router = APIRouter(prefix="/api/v1/metrics", tags=["Model Evaluation & Benchmarks"])


@router.get("", response_model=MetricsResponse)
def get_metrics():
    """Retrieve verified evaluation metrics for the Spherical GNN Tracker and DDPM Downscaler."""
    data = demo_service.get_metrics()
    return MetricsResponse(
        provenance=data["provenance"],
        dataset_version=data["dataset_version"],
        generated_at=data["generated_at"],
        pipeline_benchmarks=data["pipeline_benchmarks"],
    )
