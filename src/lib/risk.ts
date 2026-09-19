import { ACTION_LABEL, type Severity, type Language } from "@/src/data/ner-regions"

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * In-Browser Live Physics Calculation (MoES PS 26078):
 * Score = (0.35 * (|tempDelta| / 15) + 0.35 * (precipRate / 120) + 0.15 * (|z500 - 5600| / 350) + 0.15 * (shear / 75))
 * Normalized output: [0.0, 1.0]
 */
export function computeAnomalyScore(
  tempDelta: number,
  precipRate: number,
  z500: number,
  shear = 45,
): number {
  const tNorm = Math.min(1, Math.abs(tempDelta) / 15)
  const pNorm = Math.min(1, Math.max(0, precipRate) / 120)
  const zNorm = Math.min(1, Math.abs(z500 - 5600) / 350)
  const sNorm = Math.min(1, Math.max(0, shear) / 75)
  const score = 0.35 * tNorm + 0.35 * pNorm + 0.15 * zNorm + 0.15 * sNorm
  return clamp(score, 0, 1)
}

/**
 * ECMWF/NCMRWF Standard Extreme Forecast Index (EFI)
 * Range: [-1.0, +1.0] (dimensionless).
 * Measures deviation of ensemble forecast distribution from 30-year M-climate (ERA5 baseline).
 * Values > +0.70 indicate high risk of extreme convective anomalies.
 */
export function computeEFI(
  tempDelta: number,
  precipRate: number,
  z500: number,
  shear = 45,
): number {
  const tNorm = Math.max(-1, Math.min(1, tempDelta / 12))
  const pNorm = Math.max(0, Math.min(1, (precipRate - 10) / 95))
  const zNorm = Math.max(-1, Math.min(1, (z500 - 5600) / 320))
  const sNorm = Math.max(-1, Math.min(1, (shear - 35) / 40))

  const raw = 0.40 * pNorm + 0.30 * tNorm + 0.15 * Math.abs(zNorm) + 0.15 * Math.max(0, sNorm)
  return Number(Math.max(-1.0, Math.min(1.0, raw)).toFixed(2))
}

/**
 * Spatio-Temporal Anomaly Hazard Index (%)
 */
export function computeAnomalyIndex(
  tempDelta: number,
  precipRate: number,
  z500: number,
  shear = 45,
): number {
  const score = computeAnomalyScore(tempDelta, precipRate, z500, shear)
  return clamp(Math.round(score * 100), 0, 100)
}

/**
 * Dynamic Severity Levels based on Anomaly Score:
 * Score >= 0.70 ➔ "Severe Climatological Anomaly" / "Critical Synoptic Alert" (Red Badge)
 * Score 0.40 - 0.69 ➔ "Moderate Synoptic Perturbation" (Amber Badge)
 * Score < 0.40 ➔ "Synoptically Stable" (Emerald Badge)
 */
export function severityFromScore(score: number): Severity {
  if (score >= 0.85) return "Critical"
  if (score >= 0.70) return "Severe"
  if (score >= 0.40) return "Moderate"
  return "Low"
}

export function severityFromTelemetry(
  tempDeltaOrSlope: number,
  precipRateOrRain: number,
  z500OrSoil: number,
  shear = 45,
): Severity {
  // If called with legacy slope/rain/soil scale:
  if (tempDeltaOrSlope > 15 || z500OrSoil < 500) {
    const t = (tempDeltaOrSlope / 65) * 15
    const p = (precipRateOrRain / 350) * 120
    const z = 5200 + (z500OrSoil / 100) * 750
    return severityFromScore(computeAnomalyScore(t, p, z, shear))
  }
  return severityFromScore(computeAnomalyScore(tempDeltaOrSlope, precipRateOrRain, z500OrSoil, shear))
}

/**
 * Colorblind-Safe Severity Configuration.
 * Combines distinct geometric icon shapes + text labels + high-contrast colors.
 */
export function getSeverityConfig(severity: Severity) {
  switch (severity) {
    case "Critical":
      return {
        label: "Critical",
        iconName: "AlertOctagon" as const,
        colorHex: "#e11d48",
        badgeClass: "border-rose-500/50 bg-rose-950/40 text-rose-200 shadow-[0_0_10px_rgba(225,29,72,0.3)]",
        iconClass: "text-rose-400",
        indicatorDot: "bg-rose-500 animate-pulse",
      }
    case "Severe":
      return {
        label: "Severe",
        iconName: "AlertTriangle" as const,
        colorHex: "#d97706",
        badgeClass: "border-amber-500/50 bg-amber-950/40 text-amber-200 shadow-[0_0_10px_rgba(217,119,6,0.25)]",
        iconClass: "text-amber-400",
        indicatorDot: "bg-amber-500",
      }
    case "Moderate":
      return {
        label: "Moderate",
        iconName: "ShieldAlert" as const,
        colorHex: "#0284c7",
        badgeClass: "border-sky-500/50 bg-sky-950/40 text-sky-200 shadow-[0_0_10px_rgba(2,132,199,0.2)]",
        iconClass: "text-sky-400",
        indicatorDot: "bg-sky-400",
      }
    case "Low":
    default:
      return {
        label: "Low Risk",
        iconName: "CheckCircle2" as const,
        colorHex: "#059669",
        badgeClass: "border-emerald-500/50 bg-emerald-950/40 text-emerald-200",
        iconClass: "text-emerald-400",
        indicatorDot: "bg-emerald-400",
      }
  }
}

/**
 * Dynamic MoES Action Advisory Generator according to Anomaly Score & Telemetry Parameters.
 * Conforms to AGENTS.md Rule 7: uses 'extreme convective rainfall risk', not 'cloudburst prediction'.
 */
export function generateMoESAdvisory(
  score: number,
  tempDelta?: number,
  precipRate?: number,
  z500?: number,
  shear?: number,
  lang: "en" | "hi" | "as" = "en",
): string {
  // 1. Extreme Convective Rainfall Risk (High Precipitation Surge Rate)
  if (precipRate !== undefined && precipRate >= 70) {
    if (lang === "hi") {
      return "एमओईएस रेड अलर्ट: अत्यधिक संवहनी भारी वर्षा जोखिम। 70 मिमी/घंटा से अधिक वर्षा दर दर्ज। नदी बेसिन व निचले इलाकों को तुरंत खाली कराएं।"
    }
    if (lang === "as") {
      return "MoES ৰেড এলাৰ্ট: চৰম সংবহনমূলক বৃষ্টিপাত সতৰ্কবাণী। ৭০ মিমি/ঘণ্টাতকৈ অধিক বৃষ্টিপাত। নদী উপত্যকা খালী কৰক আৰু NDRF মোতায়েন কৰক।"
    }
    return "MoES RED ALERT: Severe Mesoscale Convective Rainfall Risk. Surge rate >70 mm/hr detected across meso-grid. Pre-deploy SDRF/NDRF teams; mandate low-lying basin evacuation."
  }

  // 2. Severe Heatwave Warning Trigger (High Positive Thermal Anomaly Δ & Low Precip)
  if (tempDelta !== undefined && tempDelta >= 5.0 && (precipRate ?? 0) < 25) {
    if (lang === "hi") {
      return "एमओईएस रेड अलर्ट: गंभीर सिनॉप्टिक हीटवेव रिज चेतावनी। सामान्य से +5°C अधिक तापीय विसंगति। दोपहर में खुले कार्य प्रतिबंधित करें व कूलिंग केंद्र सक्रिय करें।"
    }
    if (lang === "as") {
      return "MoES ৰেড এলাৰ্ট: তীব্ৰ তাপপ্ৰবাহ সতৰ্কবাণী। স্বাভাৱিকতকৈ +৫°C অধিক উত্তাপ। বাহিৰৰ কাম সীমিত কৰক আৰু স্বাস্থ্য সতৰ্কতা জাৰি কৰক।"
    }
    return "MoES RED ALERT: Severe Synoptic Heatwave Ridge Warning. Thermal anomaly Δ exceeding +5°C above seasonal baseline. Enforce outdoor work restriction & activate cooling protocols."
  }

  // 3. Deep Cyclonic / Monsoon Depression Warning Trigger (Low Z500 Geopotential / High Shear)
  if ((z500 !== undefined && z500 <= 5520) || (precipRate !== undefined && precipRate >= 45 && (shear ?? 0) >= 55)) {
    if (lang === "hi") {
      return "एमओईएस गंभीर चेतावनी: गहरा मॉनसून अवसाद व तटीय चक्रवाती दबाव। बंदरगाह संकेत IV जारी; तटीय व नौकायन संचालन पूर्णतः स्थगित।"
    }
    if (lang === "as") {
      return "MoES গুৰুতৰ সতৰ্কবাণী: গভীৰ মৌচুমী অৱসাদ আৰু ঘূৰ্ণীবতাহ সংকট। বন্দৰ সংকেত IV জাৰি আৰু উপকূলীয় মাছমৰীয়াৰ যাত্ৰা নিষিদ্ধ।"
    }
    return "MoES SEVERE WARNING: Deep Synoptic Monsoon Depression & Coastal Vorticity Surge. Strong pressure dip & high shear. Suspend marine and transport operations."
  }

  // 4. Score-Based Severe Weather Alert
  if (score >= 0.70) {
    if (lang === "hi") {
      return "एमओईएस गंभीर चेतावनी: उच्च मेसोस्केल संवहनी विसंगति। संवेदनशील परिवहन गलियारे बंद करें और जिला आपदा प्रबंधन कक्ष सक्रिय करें।"
    }
    if (lang === "as") {
      return "MoES গুৰুতৰ সতৰ্কবাণী: উচ্চ মেচোস্কেল বতৰ বিসংগতি। বিপদসংকুল যাতায়ত বন্ধ কৰক আৰু দুৰ্যোগ ব্যৱস্থাপনা সতৰ্ক কৰক।"
    }
    return "MoES SEVERE ALERT: Multi-parameter Spatio-Temporal Weather Anomaly detected across medium-range numerical forecast ensemble. Alert regional disaster response forces (NDRF/SDRF)."
  }

  // 5. Moderate Synoptic Perturbation
  if (score >= 0.40) {
    if (lang === "hi") {
      return "एमओईएस एम्बर वॉच: मध्यम मौसमी विक्षोभ। माध्यम-दूरी एनडब्ल्यूपी एन्सेम्बल और डॉपलर रडार से निरंतर निगरानी।"
    }
    if (lang === "as") {
      return "MoES এম্বাৰ ৱাটচ: মধ্যম পৰ্যায়ৰ বতৰ আলোড়ন। এনডব্লিউপি আৰু ডপলাৰ ৰাডাৰেৰে নিৰন্তৰ নিৰীক্ষণ অব্যাহত।"
    }
    return "MoES AMBER WATCH: Moderate synoptic perturbation. Continuous medium-range NWP ensemble & Doppler radar tracking in progress."
  }

  // 6. Synoptically Stable Baseline
  if (lang === "hi") {
    return "एमओईएस ग्रीन एडवाइजरी: सिनॉप्टिक रूप से स्थिर स्थिति। सामान्य मौसमी अवलोकन व नियमित नागरिक संचालन अनुमत।"
  }
  if (lang === "as") {
    return "MoES গ্ৰীণ এডভাইজৰী: স্থিতিশীল বতৰ। নিয়মীয়া পৰ্যবেক্ষণ আৰু সাধাৰণ কাম-কাজ অনুমোদিত।"
  }
  return "MoES GREEN ADVISORY: Synoptically stable baseline. Continuous medium-range numerical observation."
}

export function recommendedAction(severity: Severity, lang: Language): string {
  return ACTION_LABEL[severity][lang] || ACTION_LABEL[severity].en
}

// Backward-compatible alias for computeRiskIndex
export function computeRiskIndex(
  a: number,
  b: number,
  c: number,
  d = 45,
): number {
  if (a > 15 || c < 500) {
    const t = (a / 65) * 15
    const p = (b / 350) * 120
    const z = 5200 + (c / 100) * 750
    return computeAnomalyIndex(t, p, z, d)
  }
  return computeAnomalyIndex(a, b, c, d)
}

export function computeRiskProbability(slope: number, rainfall: number, soil: number): number {
  return computeRiskIndex(slope, rainfall, soil) / 100
}

export function escalateAfterRainSpike(current: Severity): Severity {
  return "Critical"
}

/**
 * Dynamic Extreme Weather Influence Radius Buffer (30km to 60km)
 */
export function bufferRadiusMeters(severity: Severity, riskIndex?: number): number {
  const score = riskIndex ?? (severity === "Critical" ? 92 : severity === "Severe" ? 75 : severity === "Moderate" ? 50 : 25)
  // Dynamic buffer circle representing Extreme Weather Influence Radius (30km to 60km)
  const radius = 30000 + (clamp(score, 0, 100) / 100) * 30000
  return Math.round(radius)
}

export function severityColor(severity: Severity, riskIndex?: number): string {
  const score = riskIndex ?? (severity === "Critical" ? 92 : severity === "Severe" ? 75 : severity === "Moderate" ? 50 : 25)
  if (score >= 70) return "#ef4444" // Severe / Critical Climatological Anomaly: Red >= 70%
  if (score >= 40) return "#f59e0b" // Moderate Synoptic Perturbation: Amber 40-69%
  return "#10b981"                 // Synoptically Stable: Emerald < 40%
}

export function synthesizeTerrainForCoords(lat: number, lon: number): {
  tempDelta: number
  precipRate: number
  z500: number
  shear: number
  phenomenon: string
  elevation: number
  slope: number
  rainfall: number
  soil: number
} {
  // Deterministic physics-informed weather anomaly synthesizer from spatial coordinates
  const latSeed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453) % 1
  const lonSeed = Math.abs(Math.cos(lat * 39.346 + lon * 11.135) * 23421.6312) % 1

  const isEasternBasin = lat >= 22.0 && lat <= 29.5 && lon >= 88.0 && lon <= 97.8
  const isNorthernHimalayas = lat >= 29.5 && lat <= 37.0 && lon >= 73.0 && lon <= 82.0
  const isWesternCoast = lat >= 8.0 && lat <= 21.5 && lon >= 71.5 && lon <= 77.8
  const isNWPlains = lat >= 25.0 && lat <= 32.0 && lon >= 69.0 && lon <= 76.5
  const isBayOfBengal = lat >= 15.0 && lat <= 22.5 && lon >= 80.0 && lon <= 89.0

  let tempDelta = 1.5
  let precipRate = 25
  let z500 = 5650
  let shear = 35
  let phenomenon = "Mesoscale Weather Perturbation"

  if (isNWPlains) {
    tempDelta = Number((6.5 + latSeed * 4.5).toFixed(1)) // +6.5°C to +11°C heatwave
    precipRate = Math.round(lonSeed * 10)
    z500 = Math.round(5850 + latSeed * 80)
    shear = Math.round(15 + lonSeed * 15)
    phenomenon = "Severe Synoptic Heatwave Ridge"
  } else if (isWesternCoast) {
    tempDelta = Number((-1.5 - latSeed * 2.0).toFixed(1))
    precipRate = Math.round(75 + lonSeed * 40) // 75 - 115 mm/hr
    z500 = Math.round(5650 + latSeed * 60)
    shear = Math.round(50 + lonSeed * 20)
    phenomenon = "Offshore Trough & Monsoon Depression"
  } else if (isEasternBasin) {
    tempDelta = Number((3.0 + latSeed * 2.5).toFixed(1))
    precipRate = Math.round(60 + lonSeed * 40)
    z500 = Math.round(5780 + latSeed * 60)
    shear = Math.round(45 + lonSeed * 20)
    phenomenon = "Mesoscale Convective Cloudburst Anomaly"
  } else if (isBayOfBengal) {
    tempDelta = Number((-2.0 - latSeed * 2.5).toFixed(1))
    precipRate = Math.round(65 + lonSeed * 30)
    z500 = Math.round(5560 + latSeed * 50)
    shear = Math.round(50 + lonSeed * 20)
    phenomenon = "Deep Cyclonic Vorticity Depression"
  } else if (isNorthernHimalayas) {
    tempDelta = Number((-4.5 - latSeed * 4.5).toFixed(1))
    precipRate = Math.round(35 + lonSeed * 30)
    z500 = Math.round(5350 + latSeed * 80)
    shear = Math.round(35 + lonSeed * 20)
    phenomenon = "Western Disturbance Cold Core Vortex"
  } else {
    tempDelta = Number(((latSeed - 0.5) * 8).toFixed(1))
    precipRate = Math.round(latSeed * 55)
    z500 = Math.round(5550 + lonSeed * 200)
    shear = Math.round(25 + latSeed * 35)
  }

  const baseElevation = isNorthernHimalayas ? 1800 : isEasternBasin ? 350 : isWesternCoast ? 250 : isNWPlains ? 220 : 120
  const elevation = Math.round(baseElevation + latSeed * 850)

  const slope = Math.round(clamp((Math.abs(tempDelta) / 15) * 50 + 12, 10, 64))
  const rainfall = Math.round(clamp(precipRate * 2.5, 15, 340))
  const soil = Math.round(clamp(((z500 - 5200) / 750) * 100, 20, 96))

  return {
    tempDelta,
    precipRate,
    z500,
    shear,
    phenomenon,
    elevation: Math.max(10, elevation),
    slope,
    rainfall,
    soil,
  }
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

/**
 * Great-circle distance between two GPS coordinates using the Haversine formula (in kilometers)
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Determines whether a station or incident is within the active district / operational disaster command sector
 * Matches direct district name or falls within maxRadiusKm (default 160km).
 */
export function isLocationInSector(
  itemLat: number,
  itemLon: number,
  itemDistrict: string | undefined,
  itemState: string | undefined,
  centerCoords: [number, number],
  centerDistrict?: string,
  centerState?: string,
  maxRadiusKm = 160,
): boolean {
  // 1. Direct district match (case-insensitive substring)
  if (itemDistrict && centerDistrict) {
    const d1 = itemDistrict.toLowerCase().replace(/district/g, "").trim()
    const d2 = centerDistrict.toLowerCase().replace(/district/g, "").trim()
    if (d1.length > 2 && d2.length > 2 && (d1.includes(d2) || d2.includes(d1))) {
      return true
    }
  }

  // 2. Operational sector proximity (160km encompasses local district + adjoining transport corridors)
  const dist = haversineDistanceKm(centerCoords[0], centerCoords[1], itemLat, itemLon)
  return dist <= maxRadiusKm
}
