import { ACTION_LABEL, type Severity } from "@/src/data/ner-regions"

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

export function computeRiskProbability(slope: number, rainfall: number, soil: number): number {
  const slopeNorm = clamp(slope, 0, 65) / 65
  const rainNorm = clamp(rainfall, 0, 350) / 350
  const soilNorm = clamp(soil, 0, 100) / 100
  // XGBoost-aligned Hazard Probability:
  // Score = (0.35 * (Slope / 65) + 0.40 * (Rainfall / 350) + 0.15 * (Soil / 100) + 0.10)
  const prob = 0.35 * slopeNorm + 0.40 * rainNorm + 0.15 * soilNorm + 0.10
  return clamp(prob, 0.1, 1.0)
}

export function computeRiskIndex(slope: number, rainfall: number, soil: number): number {
  const prob = computeRiskProbability(slope, rainfall, soil)
  return clamp(Math.round(prob * 100), 0, 100)
}

export function severityFromTelemetry(slope: number, rainfall: number, soil: number): Severity {
  const index = computeRiskIndex(slope, rainfall, soil)
  if (index >= 75) return "Critical"
  if (index >= 55) return "Severe"
  if (index >= 35) return "Moderate"
  return "Low"
}

export function escalateAfterRainSpike(current: Severity): Severity {
  if (current === "Critical") return "Critical"
  return "Critical"
}

export function bufferRadiusMeters(severity: Severity, riskIndex?: number): number {
  const score = riskIndex ?? (severity === "Critical" ? 85 : severity === "Severe" ? 65 : severity === "Moderate" ? 45 : 20)
  if (score >= 75) return 16000 // 16 km Critical Risk Buffer
  if (score >= 55) return 12000 // 12 km Severe Risk Buffer
  if (score >= 35) return 8000  // 8 km Moderate Risk Buffer
  return 5000                   // 5 km Low Baseline Buffer
}

export function severityColor(severity: Severity, riskIndex?: number): string {
  const score = riskIndex ?? (severity === "Critical" ? 85 : severity === "Severe" ? 65 : severity === "Moderate" ? 45 : 20)
  if (score >= 75) return "#ef4444" // Critical: Red >= 75%
  if (score >= 55) return "#f97316" // Severe: Orange 55-74%
  if (score >= 35) return "#f59e0b" // Moderate: Amber 35-54%
  return "#10b981" // Low: Emerald < 35%
}

export function synthesizeTerrainForCoords(lat: number, lon: number): {
  slope: number
  rainfall: number
  soil: number
  elevation: number
} {
  // Deterministic physics-informed terrain synthesizer from spatial coordinates
  const latSeed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453) % 1
  const lonSeed = Math.abs(Math.cos(lat * 39.346 + lon * 11.135) * 23421.6312) % 1

  const isHimalayanZone = lat >= 22.5 && lat <= 30.5 && lon >= 88.0 && lon <= 97.8
  const baseSlope = isHimalayanZone ? 30 : 16
  const slope = Math.round(baseSlope + latSeed * 30) // 25° - 60°
  const rainfall = Math.round(60 + lonSeed * 240) // 60 - 300 mm
  const soil = Math.round(30 + (rainfall / 350) * 48 + latSeed * 16) // 30 - 94%
  const elevation = Math.round(isHimalayanZone ? 500 + latSeed * 1500 : 100 + lonSeed * 400)

  return {
    slope: clamp(slope, 10, 64),
    rainfall: clamp(rainfall, 30, 340),
    soil: clamp(soil, 25, 96),
    elevation: Math.max(40, elevation),
  }
}

export function recommendedAction(severity: Severity, lang: "en" | "hi" | "as"): string {
  return ACTION_LABEL[severity][lang]
}

export function formatCoord(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S"
  const ew = lon >= 0 ? "E" : "W"
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`
}

export function relativeTime(iso: string, lang: "en" | "hi" | "as"): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(0, Math.round(diff / 60000))
  if (mins < 1) {
    return lang === "hi" ? "अभी" : lang === "as" ? "এতিয়াই" : "Just now"
  }
  if (mins < 60) {
    return lang === "hi" ? `${mins} मि पहले` : lang === "as" ? `${mins} মিনিট আগত` : `${mins} min ago`
  }
  const hours = Math.round(mins / 60)
  return lang === "hi" ? `${hours} घं पहले` : lang === "as" ? `${hours} ঘণ্টা আগত` : `${hours} h ago`
}
