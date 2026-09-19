"""Megh-Drishti FastAPI Backend Service.

MoES / NCMRWF (PS 26078): AI Tracking of Extreme Weather Anomalies (3-10 Day)
+ 12km -> 5km Amplitude-Preserving Downscaling + 5km-Radius Alerts.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    health_router,
    anomalies_router,
    alerts_router,
    metrics_router,
)

app = FastAPI(
    title="Megh-Drishti API",
    description=(
        "Production REST API for MoES / NCMRWF PS 26078. "
        "Delivers 4D Spherical GNN tracking of extreme weather anomalies, "
        "12km to 5km amplitude-preserving conditional diffusion downscaling, "
        "and 5km-radius early warnings."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits localhost Next.js and external access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers under /api/v1
app.include_router(health_router)
app.include_router(anomalies_router)
app.include_router(alerts_router)
app.include_router(metrics_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "Megh-Drishti AI Spatio-Temporal Weather Anomaly Engine",
        "problem_statement": "MoES / NCMRWF PS 26078",
        "docs": "/docs",
        "health": "/api/v1/health",
        "demo_mode": settings.demo_mode,
        "version": settings.app_version,
    }
