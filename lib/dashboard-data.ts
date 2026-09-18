export type RiskLevel = "severe" | "moderate" | "safe"

export interface RiskZone {
  id: string
  name: string
  state: "Assam" | "Meghalaya" | "Sikkim"
  level: RiskLevel
  top: number // % position within map container
  left: number // % position within map container
  riskIndex: number
  slope: number
  rainfall24h: number
  soilSaturation: number
  lat: number
  lon: number
  elevation: number
}

export const riskZones: RiskZone[] = [
  {
    id: "z1",
    name: "Guwahati Hills",
    state: "Assam",
    level: "moderate",
    top: 62,
    left: 38,
    riskIndex: 58,
    slope: 34,
    rainfall24h: 62,
    soilSaturation: 71,
    lat: 26.1445,
    lon: 91.7362,
    elevation: 285,
  },
  {
    id: "z2",
    name: "Nongstoin Ridge",
    state: "Meghalaya",
    level: "severe",
    top: 48,
    left: 28,
    riskIndex: 87,
    slope: 52,
    rainfall24h: 118,
    soilSaturation: 92,
    lat: 25.5177,
    lon: 91.2698,
    elevation: 1310,
  },
  {
    id: "z3",
    name: "Cherrapunji Slope",
    state: "Meghalaya",
    level: "severe",
    top: 58,
    left: 22,
    riskIndex: 91,
    slope: 58,
    rainfall24h: 142,
    soilSaturation: 96,
    lat: 25.2702,
    lon: 91.7323,
    elevation: 1484,
  },
  {
    id: "z4",
    name: "Gangtok North",
    state: "Sikkim",
    level: "moderate",
    top: 18,
    left: 58,
    riskIndex: 61,
    slope: 41,
    rainfall24h: 54,
    soilSaturation: 68,
    lat: 27.3389,
    lon: 88.6065,
    elevation: 1650,
  },
  {
    id: "z5",
    name: "Mangan Valley",
    state: "Sikkim",
    level: "severe",
    top: 10,
    left: 66,
    riskIndex: 83,
    slope: 49,
    rainfall24h: 96,
    soilSaturation: 88,
    lat: 27.5117,
    lon: 88.5311,
    elevation: 1200,
  },
  {
    id: "z6",
    name: "Jorhat Plains",
    state: "Assam",
    level: "safe",
    top: 40,
    left: 70,
    riskIndex: 22,
    slope: 12,
    rainfall24h: 18,
    soilSaturation: 34,
    lat: 26.7509,
    lon: 94.2037,
    elevation: 116,
  },
  {
    id: "z7",
    name: "Shillong Peak",
    state: "Meghalaya",
    level: "moderate",
    top: 44,
    left: 32,
    riskIndex: 55,
    slope: 37,
    rainfall24h: 58,
    soilSaturation: 64,
    lat: 25.5788,
    lon: 91.8933,
    elevation: 1965,
  },
  {
    id: "z8",
    name: "Dibrugarh Belt",
    state: "Assam",
    level: "safe",
    top: 26,
    left: 82,
    riskIndex: 15,
    slope: 8,
    rainfall24h: 12,
    soilSaturation: 25,
    lat: 27.4728,
    lon: 94.912,
    elevation: 108,
  },
]

export type LeafletRiskLevel = "severe" | "moderate" | "safe"

export interface LeafletRiskMarker {
  id: string
  name: string
  level: LeafletRiskLevel
  position: [number, number]
  riskIndex: number
  slope?: number
  rainfall24h?: number
  note?: string
}

export const nerRiskMarkers: LeafletRiskMarker[] = [
  {
    id: "guwahati-hillside",
    name: "Guwahati Hillside",
    level: "severe",
    position: [26.1445, 91.7362],
    riskIndex: 91,
    slope: 42,
    rainfall24h: 180,
  },
  {
    id: "shillong-pass-ridge",
    name: "Shillong Pass Ridge",
    level: "moderate",
    position: [25.5788, 91.8933],
    riskIndex: 48,
    slope: 28,
  },
  {
    id: "silchar-valley-route",
    name: "Silchar Valley Route",
    level: "safe",
    position: [24.8333, 92.7976],
    riskIndex: 18,
    note: "Low Alert",
  },
]

export interface NerDistrict {
  id: string
  name: string
  district: string
  state: string
  lat: number
  lon: number
  rainfall24h: number
  slope: number
  soilSaturation: number
  elevation: number
  riskIndex: number
  level: RiskLevel
  status: string
  advice: string
  aliases: string[]
}

export const nerDistricts: NerDistrict[] = [
  {
    id: "east-khasi-hills",
    name: "East Khasi Hills",
    district: "East Khasi Hills",
    state: "Meghalaya",
    lat: 25.5788,
    lon: 91.8933,
    rainfall24h: 185,
    slope: 42,
    soilSaturation: 88,
    elevation: 1965,
    riskIndex: 88,
    level: "severe",
    status: "Severe Hazard",
    advice: "NH-6 prone to mudslides. Avoid non-essential hill transit.",
    aliases: ["shillong", "nh-6", "khasi hills"],
  },
  {
    id: "kamrup-metropolitan",
    name: "Kamrup Metropolitan",
    district: "Kamrup Metropolitan",
    state: "Assam",
    lat: 26.1445,
    lon: 91.7362,
    rainfall24h: 62,
    slope: 18,
    soilSaturation: 45,
    elevation: 55,
    riskIndex: 52,
    level: "moderate",
    status: "Moderate Advisory",
    advice: "Waterlogging alert in lowlands, hillside slopes stable.",
    aliases: ["guwahati", "kamrup"],
  },
  {
    id: "north-sikkim",
    name: "North Sikkim",
    district: "North Sikkim",
    state: "Sikkim",
    lat: 27.5117,
    lon: 88.5311,
    rainfall24h: 220,
    slope: 54,
    soilSaturation: 94,
    elevation: 1200,
    riskIndex: 97,
    level: "severe",
    status: "Critical Evacuation",
    advice: "Active slope failure detected near Teesta river basin. SDRF alert active.",
    aliases: ["mangan", "chungthang", "teesta"],
  },
  {
    id: "cachar",
    name: "Cachar",
    district: "Cachar",
    state: "Assam",
    lat: 24.8333,
    lon: 92.7976,
    rainfall24h: 25,
    slope: 8,
    soilSaturation: 30,
    elevation: 22,
    riskIndex: 10,
    level: "safe",
    status: "Safe Zone",
    advice: "Normal conditions. No landslide hazard.",
    aliases: ["silchar"],
  },
]

export function findNearestDistrict(lat: number, lon: number): NerDistrict {
  let nearest = nerDistricts[0]
  let minDist = Number.POSITIVE_INFINITY
  for (const d of nerDistricts) {
    const dist = Math.hypot(d.lat - lat, d.lon - lon)
    if (dist < minDist) {
      minDist = dist
      nearest = d
    }
  }
  return nearest
}

export type ReportIssue = "Road Blocked" | "Crack Detected" | "Flooding" | "Landslide"

export interface FieldReport {
  id: string
  issue: ReportIssue
  location: string
  coordinates: string
  timestamp: string
  reporter: string
  photo: string
  severity: RiskLevel
}

export const fieldReports: FieldReport[] = [
  {
    id: "r1",
    issue: "Road Blocked",
    location: "NH-6, near Nongstoin",
    coordinates: "25.5138° N, 91.2698° E",
    timestamp: "2 min ago",
    reporter: "Field Unit — Meghalaya",
    photo: "/reports/road-blocked-1.png",
    severity: "severe",
  },
  {
    id: "r2",
    issue: "Crack Detected",
    location: "Retaining Wall, Cherrapunji Rd",
    coordinates: "25.2702° N, 91.7323° E",
    timestamp: "14 min ago",
    reporter: "Citizen Report",
    photo: "/reports/crack-detected-1.png",
    severity: "severe",
  },
  {
    id: "r3",
    issue: "Road Blocked",
    location: "SH-2, Mawsynram approach",
    coordinates: "25.3000° N, 91.5822° E",
    timestamp: "31 min ago",
    reporter: "Field Unit — Meghalaya",
    photo: "/reports/road-blocked-2.png",
    severity: "moderate",
  },
  {
    id: "r4",
    issue: "Crack Detected",
    location: "Hillside above Mangan town",
    coordinates: "27.5117° N, 88.5311° E",
    timestamp: "48 min ago",
    reporter: "Citizen Report",
    photo: "/reports/crack-detected-2.png",
    severity: "severe",
  },
]
