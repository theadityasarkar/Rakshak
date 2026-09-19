"""Backend application settings and environment configuration."""

import os
from pathlib import Path
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "data" / "demo"


class Settings(BaseModel):
    app_name: str = "Megh-Drishti Anomaly & Downscaling API"
    app_version: str = "1.0.0"
    demo_mode: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    data_dir: Path = DATA_DIR
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


settings = Settings()
