/**
 * Megh-Drishti Typed API Client.
 * Connects frontend to the FastAPI microservice at NEXT_PUBLIC_API_URL or localhost:8000.
 * Implements graceful fallback to demo mode when offline or backend is stopped.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface ModelsHealth {
  tracker: "loaded" | "missing"
  downscaler: "loaded" | "missing"
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "demo"
  models: ModelsHealth
  data_init_time: string
  last_inference_time: string
  demo_mode: boolean
  version: string
}

export interface AnomalyItem {
  id: string
  name: string
  type: string
  lat: number
  lon: number
  district: string
  state: string
  city: string
  severity: "Critical" | "Severe" | "Moderate" | "Low"
  efi_index: number
  temp_delta_c: number
  precip_rate_mm_hr: number
  z500_gpm: number
  shear_kts: number
  radius_km: number
  advisory: string
}

export interface TrajectoryWaypoint {
  step: string
  day_label: string
  hours_ahead: number
  lat: number
  lon: number
  pressure_level_hpa: string
  confidence: number
  uncertainty_radius_km: number
  precip_rate_mm_hr: number
  shear_kts: number
  mesh_node_id: number
  bounding_box?: [number, number, number, number]
  p10_lat?: number
  p10_lon?: number
  p50_lat?: number
  p50_lon?: number
  p90_lat?: number
  p90_lon?: number
}

export interface DownscaledResponse {
  provenance: string
  anomaly_id: string
  data: {
    coarse_nwp_12km: {
      precip_rate_mm_hr: number
      temp_delta_c: number
      z500_gpm: number
      shear_kts: number
      smoothing_note: string
    }
    downscaled_5km: {
      precip_peak_mm_hr: number
      temp_peak_c: number
      shear_peak_kts: number
      amplitude_recovery_pct: number
      crps_score: number
      mass_conservation_residual: number
      grid_dimensions: [number, number]
      resolution_km: number
    }
    subgrid_bounding_box: {
      min_lat: number
      max_lat: number
      min_lon: number
      max_lon: number
    }
  }
}

export interface AlertEvaluationResult {
  provenance: string
  evaluated_at: string
  query_centroid: [number, number]
  radius_km: number
  in_risk_zone: boolean
  matched_alerts: Array<{
    id: string
    anomaly_id: string
    urgency: string
    severity: string
    certainty: string
    headline: string
    area_desc: string
    centroid: [number, number]
    radius_km: number
    effective_utc: string
    expires_utc: string
    peak_intensity: string
    action_recommended: string
    imd_category?: string
    imd_color_code?: string
    lead_time_hours?: number
    probability_pct?: number
    action_hi?: string
  }>
  nearest_anomaly_id?: string
  distance_to_nearest_km?: number
  overall_imd_category?: string
  overall_imd_color?: string
  primary_action?: string
  primary_action_hi?: string
}

export async function checkBackendHealth(
  signal?: AbortSignal,
): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as HealthResponse
  } catch {
    return null
  }
}

export async function fetchAnomalies(
  signal?: AbortSignal,
): Promise<AnomalyItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/anomalies`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []) as AnomalyItem[]
  } catch {
    return []
  }
}

import {
  AMPHAN_CACHED_TRACK,
  AMPHAN_CACHED_DOWNSCALED,
  AMPHAN_CACHED_ALERT,
} from "@/src/data/cached-amphan"

export async function fetchAnomalyTrack(
  anomalyId: string,
  signal?: AbortSignal,
): Promise<TrajectoryWaypoint[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/anomalies/${encodeURIComponent(anomalyId)}/track`,
      { signal },
    )
    if (res.ok) {
      const data = await res.json()
      if (data.waypoints && data.waypoints.length > 0) {
        return data.waypoints as TrajectoryWaypoint[]
      }
    }
  } catch {
    // Backend offline; attempt cached fallback
  }

  // Fallback: try static Next.js public route or cached memory
  if (anomalyId.toLowerCase().includes("amphan")) {
    return AMPHAN_CACHED_TRACK
  }

  try {
    const localRes = await fetch("/data/demo/tracks.json", { signal })
    if (localRes.ok) {
      const allTracks = await localRes.json()
      const tracksMap = allTracks.tracks || allTracks
      if (tracksMap[anomalyId]) return tracksMap[anomalyId]
    }
  } catch {
    // Ignore offline fetch errors
  }

  return []
}

export async function fetchDownscaledData(
  anomalyId: string,
  signal?: AbortSignal,
): Promise<DownscaledResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/anomalies/${encodeURIComponent(anomalyId)}/downscaled`,
      { signal },
    )
    if (res.ok) {
      return (await res.json()) as DownscaledResponse
    }
  } catch {
    // Backend offline; attempt cached fallback
  }

  if (anomalyId.toLowerCase().includes("amphan")) {
    return AMPHAN_CACHED_DOWNSCALED
  }

  try {
    const localRes = await fetch("/data/demo/downscaled.json", { signal })
    if (localRes.ok) {
      const allDownscaled = await localRes.json()
      const samples = allDownscaled.samples || allDownscaled
      if (samples[anomalyId]) {
        return {
          provenance: "cached_static_demo",
          anomaly_id: anomalyId,
          data: samples[anomalyId],
        }
      }
    }
  } catch {
    // Ignore offline fetch errors
  }

  return null
}

export async function evaluateAlertZone(
  lat: number,
  lon: number,
  radiusKm = 5.0,
  signal?: AbortSignal,
): Promise<AlertEvaluationResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/alerts/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, radius_km: radiusKm }),
      signal,
    })
    if (res.ok) {
      return (await res.json()) as AlertEvaluationResult
    }
  } catch {
    // Backend offline
  }

  // If coordinates are in Sundarbans/Amphan vicinity (lat ~21.65, lon ~88.35 within 1 degree)
  const dLat = Math.abs(lat - 21.65)
  const dLon = Math.abs(lon - 88.35)
  if (dLat < 1.5 && dLon < 1.5) {
    return {
      ...AMPHAN_CACHED_ALERT,
      query_centroid: [lat, lon],
      radius_km: radiusKm,
      evaluated_at: new Date().toISOString(),
    }
  }

  // Graceful offline fallback: synthesize 5km subgrid evaluation
  return {
    provenance: "offline_client_cache",
    evaluated_at: new Date().toISOString(),
    query_centroid: [lat, lon],
    radius_km: radiusKm,
    in_risk_zone: true,
    overall_imd_category: "ORANGE",
    overall_imd_color: "#f97316",
    primary_action:
      "MoES ORANGE ALERT: Keep quick-response disaster management cells on high alert. Regulate transit corridors.",
    primary_action_hi:
      "एमओईएस ऑरेंज अलर्ट: त्वरित प्रतिक्रिया आपदा प्रबंधन इकाइयों को उच्च सतर्कता पर रखें। परिवहन मार्गों का नियमन करें।",
    matched_alerts: [
      {
        id: `alert-offline-${Math.round(lat * 100)}`,
        anomaly_id: "offline-core",
        urgency: "Expected",
        severity: "Severe",
        certainty: "Likely",
        headline: `5km Subgrid Alert (${radiusKm}km radius)`,
        area_desc: `Subgrid region at coordinates [${lat.toFixed(2)}°, ${lon.toFixed(2)}°]`,
        centroid: [lat, lon],
        radius_km: radiusKm,
        effective_utc: new Date().toISOString(),
        expires_utc: new Date(Date.now() + 86400000).toISOString(),
        peak_intensity: "85 mm/hr · 52 kts",
        action_recommended:
          "MoES/NDMA ALERT: Continuous Doppler radar monitoring. Maintain emergency helplines.",
        action_hi:
          "एमओईएस/एनडीएमए अलर्ट: निरंतर डॉपलर रडार निगरानी। आपातकालीन हेल्पलाइन सक्रिय रखें।",
        imd_category: "ORANGE",
        imd_color_code: "#f97316",
        lead_time_hours: 24,
        probability_pct: 82.0,
      },
    ],
  }
}

