"""Service for loading, caching, and serving schema-validated demo data."""

import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional
from backend.app.config import settings
from backend.app.schemas.anomaly import AnomalyItem
from backend.app.schemas.alert import ActiveAlert


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0  # Earth radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class DemoDataService:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.data_dir
        self._anomalies: Optional[Dict[str, Any]] = None
        self._tracks: Optional[Dict[str, Any]] = None
        self._downscaled: Optional[Dict[str, Any]] = None
        self._alerts: Optional[Dict[str, Any]] = None
        self._metrics: Optional[Dict[str, Any]] = None
        self._load_all()

    def _read_json(self, filename: str) -> Dict[str, Any]:
        path = self.data_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Required demo artifact missing: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _load_all(self):
        self._anomalies = self._read_json("anomalies.json")
        self._tracks = self._read_json("tracks.json")
        self._downscaled = self._read_json("downscaled.json")
        self._alerts = self._read_json("alerts.json")
        self._metrics = self._read_json("metrics.json")

    def get_anomalies(self) -> Dict[str, Any]:
        return self._anomalies

    def get_anomaly_by_id(self, anomaly_id: str) -> Optional[AnomalyItem]:
        for item in self._anomalies.get("items", []):
            if item["id"] == anomaly_id:
                return AnomalyItem(**item)
        return None

    def get_track(self, anomaly_id: str) -> Optional[Dict[str, Any]]:
        tracks_dict = self._tracks.get("tracks", {}) if self._tracks else {}
        if anomaly_id not in tracks_dict:
            try:
                self._tracks = self._read_json("tracks.json")
                tracks_dict = self._tracks.get("tracks", {}) if self._tracks else {}
            except Exception:
                pass
        if anomaly_id in tracks_dict:
            return {
                "provenance": self._tracks.get("provenance", "spherical_gnn_simulation"),
                "anomaly_id": anomaly_id,
                "waypoints": tracks_dict[anomaly_id],
            }
        return None

    def get_downscaled(self, anomaly_id: str) -> Optional[Dict[str, Any]]:
        samples = self._downscaled.get("samples", {}) if self._downscaled else {}
        if anomaly_id not in samples:
            try:
                self._downscaled = self._read_json("downscaled.json")
                samples = self._downscaled.get("samples", {}) if self._downscaled else {}
            except Exception:
                pass
        if anomaly_id in samples:
            return {
                "provenance": self._downscaled.get("provenance", "ddpm_conditional_diffusion_sample"),
                "anomaly_id": anomaly_id,
                "data": samples[anomaly_id],
            }
        return None

    def _load_imd_thresholds(self) -> Dict[str, Any]:
        cfg_path = Path(__file__).resolve().parent.parent / "config" / "imd_thresholds.yaml"
        if cfg_path.exists():
            try:
                import yaml
                with open(cfg_path, "r", encoding="utf-8") as f:
                    return yaml.safe_load(f).get("imd_categories", {})
            except Exception:
                pass
        return {}

    def get_metrics(self) -> Dict[str, Any]:
        return self._metrics

    def evaluate_alerts(self, lat: float, lon: float, radius_km: float = 5.0) -> Dict[str, Any]:
        matched: List[ActiveAlert] = []
        nearest_id: Optional[str] = None
        min_dist: float = float("inf")
        nearest_anomaly: Optional[Dict[str, Any]] = None

        imd_rules = self._load_imd_thresholds()

        # Check against active anomalies
        for anom in self._anomalies.get("items", []):
            dist = haversine_distance_km(lat, lon, anom["lat"], anom["lon"])
            if dist < min_dist:
                min_dist = dist
                nearest_id = anom["id"]
                nearest_anomaly = anom

        # Check against active alerts
        for raw_alert in self._alerts.get("active_alerts", []):
            c_lat, c_lon = raw_alert["centroid"]
            dist = haversine_distance_km(lat, lon, c_lat, c_lon)
            if dist <= (radius_km + raw_alert.get("radius_km", 5.0)):
                # Assign IMD Category from YAML
                sev = raw_alert.get("severity", "Severe")
                cat_key = "RED" if sev == "Critical" else "ORANGE" if sev == "Severe" else "YELLOW"
                rule = imd_rules.get(cat_key, {})

                alert_copy = dict(raw_alert)
                alert_copy["radius_km"] = radius_km
                alert_copy["imd_category"] = cat_key
                alert_copy["imd_color_code"] = rule.get("color", "#ef4444" if cat_key == "RED" else "#f97316")
                alert_copy["lead_time_hours"] = 24
                alert_copy["probability_pct"] = rule.get("probability_baseline", 85.0)
                if isinstance(rule.get("action"), dict):
                    alert_copy["action_recommended"] = rule["action"].get("en", alert_copy.get("action_recommended", ""))
                    alert_copy["action_hi"] = rule["action"].get("hi", "")

                matched.append(ActiveAlert(**alert_copy))

        # If query is within influence of nearest anomaly (e.g. within 60km), synthesize 5km subgrid alert
        if not matched and nearest_anomaly and min_dist <= 60.0:
            p_rate = nearest_anomaly.get("precip_rate_mm_hr", 35.0)
            t_delta = nearest_anomaly.get("temp_delta_c", 2.5)
            shear = nearest_anomaly.get("shear_kts", 45.0)
            efi = nearest_anomaly.get("efi_index", 0.5)

            # Evaluate against IMD Threshold criteria
            if p_rate >= 65.0 or t_delta >= 6.5 or shear >= 64.0 or efi >= 0.8:
                cat_key = "RED"
            elif p_rate >= 35.0 or t_delta >= 4.5 or shear >= 48.0 or efi >= 0.5:
                cat_key = "ORANGE"
            elif p_rate >= 15.0 or t_delta >= 2.5 or shear >= 28.0 or efi >= 0.2:
                cat_key = "YELLOW"
            else:
                cat_key = "GREEN"

            rule = imd_rules.get(cat_key, {})
            action_en = rule.get("action", {}).get("en", nearest_anomaly.get("advisory", "")) if isinstance(rule.get("action"), dict) else nearest_anomaly.get("advisory", "")
            action_hi = rule.get("action", {}).get("hi", "") if isinstance(rule.get("action"), dict) else ""

            lead_time = 12 if min_dist <= 15.0 else (24 if min_dist <= 35.0 else 48)
            prob = max(55.0, round(rule.get("probability_baseline", 75.0) - (min_dist * 0.4), 1))

            dyn_alert = ActiveAlert(
                id=f"alert-5km-{nearest_anomaly['id']}",
                anomaly_id=nearest_anomaly["id"],
                urgency=rule.get("urgency", "Immediate"),
                severity=nearest_anomaly.get("severity", "Severe"),
                certainty=rule.get("certainty", "Observed"),
                headline=f"IMD {cat_key} 5km Subgrid Alert: {nearest_anomaly['name']}",
                area_desc=f"Subgrid radius {radius_km}km near {nearest_anomaly['city']}, {nearest_anomaly['state']}",
                centroid=[lat, lon],
                radius_km=radius_km,
                effective_utc="2026-09-19T06:00:00Z",
                expires_utc="2026-09-20T18:00:00Z",
                peak_intensity=f"{p_rate} mm/hr · {shear} kts",
                action_recommended=action_en,
                imd_category=cat_key,
                imd_color_code=rule.get("color", "#f97316"),
                lead_time_hours=lead_time,
                probability_pct=prob,
                action_hi=action_hi,
            )
            matched.append(dyn_alert)

        in_risk = len(matched) > 0 or min_dist <= radius_km
        primary = matched[0] if matched else None

        return {
            "provenance": "moes_cap_v1_imd_yaml_evaluated",
            "evaluated_at": "2026-09-19T07:15:00Z",
            "query_centroid": [lat, lon],
            "radius_km": radius_km,
            "in_risk_zone": in_risk,
            "matched_alerts": matched,
            "nearest_anomaly_id": nearest_id,
            "distance_to_nearest_km": round(min_dist, 2) if min_dist != float("inf") else None,
            "overall_imd_category": primary.imd_category if primary else ("YELLOW" if in_risk else "GREEN"),
            "overall_imd_color": primary.imd_color_code if primary else ("#eab308" if in_risk else "#22c55e"),
            "primary_action": primary.action_recommended if primary else "Standard meteorological monitoring active.",
            "primary_action_hi": getattr(primary, "action_hi", "") if primary else "मानक मौसम निगरानी सक्रिय।",
        }


demo_service = DemoDataService()
