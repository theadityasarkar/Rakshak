"""Automated test suite for Megh-Drishti FastAPI backend (Phase 1)."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify /api/v1/health conforms to Phase 1 contract."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "models" in data
    assert data["models"]["tracker"] in ("loaded", "missing")
    assert data["models"]["downscaler"] in ("loaded", "missing")
    assert "data_init_time" in data
    assert "last_inference_time" in data
    assert "demo_mode" in data
    assert data["demo_mode"] is True


def test_anomalies_list():
    """Verify anomalies list is loaded from /data/demo and contains valid EFI values."""
    res = client.get("/api/v1/anomalies")
    assert res.status_code == 200
    data = res.json()
    assert data["provenance"] != ""
    assert data["count"] > 0
    assert len(data["items"]) == data["count"]

    # Verify Rule 7: EFI range is [-1.0, +1.0]
    for item in data["items"]:
        assert -1.0 <= item["efi_index"] <= 1.0, f"Invalid EFI range for {item['id']}"
        assert item["lat"] != 0
        assert item["lon"] != 0


def test_anomaly_detail():
    """Verify single anomaly query."""
    res = client.get("/api/v1/anomalies/anomaly-brahmaputra-01")
    assert res.status_code == 200
    item = res.json()
    assert item["id"] == "anomaly-brahmaputra-01"
    assert "Guwahati" in item["city"]


def test_anomaly_track_4d():
    """Verify 4D Spatio-Temporal trajectory waypoints."""
    res = client.get("/api/v1/anomalies/anomaly-brahmaputra-01/track")
    assert res.status_code == 200
    data = res.json()
    assert data["anomaly_id"] == "anomaly-brahmaputra-01"
    assert len(data["waypoints"]) >= 4

    wp0 = data["waypoints"][0]
    assert wp0["step"] == "T+0h"
    assert "pressure_level_hpa" in wp0
    assert wp0["confidence"] > 0.5


def test_anomaly_downscaled_tensor():
    """Verify 12km coarse vs 5km downscaled tensors."""
    res = client.get("/api/v1/anomalies/anomaly-brahmaputra-01/downscaled")
    assert res.status_code == 200
    data = res.json()
    sample = data["data"]
    assert "coarse_nwp_12km" in sample
    assert "downscaled_5km" in sample

    coarse_p = sample["coarse_nwp_12km"]["precip_rate_mm_hr"]
    downscaled_p = sample["downscaled_5km"]["precip_peak_mm_hr"]
    # 5km resolves localized convective extreme peak
    assert downscaled_p > coarse_p
    assert sample["downscaled_5km"]["amplitude_recovery_pct"] > 0


def test_alerts_evaluate():
    """Verify alert evaluation near Guwahati."""
    res = client.post(
        "/api/v1/alerts/evaluate",
        json={"lat": 26.15, "lon": 91.74, "radius_km": 5.0},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["in_risk_zone"] is True
    assert len(data["matched_alerts"]) > 0
    assert data["distance_to_nearest_km"] < 10.0


def test_metrics_endpoint():
    """Verify pipeline metrics benchmark response."""
    res = client.get("/api/v1/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "pipeline_benchmarks" in data
    assert "tracker" in data["pipeline_benchmarks"]
    assert "downscaler" in data["pipeline_benchmarks"]
