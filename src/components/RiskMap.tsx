"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Rectangle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import { NER_REGIONS, localize, type Severity, type Language } from "@/src/data/ner-regions"
import { bufferRadiusMeters, computeRiskIndex, formatCoord, severityColor, isLocationInSector } from "@/src/lib/risk"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"
import { fetchAnomalyTrack, type TrajectoryWaypoint as ApiWaypoint } from "@/src/lib/api"
import type { IncidentReport } from "@/src/types/incident"

export interface TrajectoryWaypoint {
  id: string
  step: string
  dayLabel: string
  coords: [number, number]
  pressureLevel: string
  intensityLabel: string
  confidence: number
  uncertaintyRadiusMeters: number
  meshNodeId: number
}

function createTrajectoryIcon(step: string, isLive: boolean, isActive = false) {
  const bg = isActive ? "#a855f7" : isLive ? "#10b981" : "#818cf8"
  const size = isActive ? 16 : 12
  return L.divIcon({
    className: "gnn-trajectory-marker",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        ${(isLive || isActive) ? `<div style="position:absolute;width:${size + 14}px;height:${size + 14}px;border-radius:9999px;background:${bg};opacity:0.45;animation:ner-pulse 1.4s ease-out infinite;"></div>` : ''}
        <div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};border:2px solid #ffffff;box-shadow:0 0 12px ${bg};"></div>
      </div>
      <span style="margin-top:2px;font-size:9px;font-weight:800;font-family:monospace;background:${isActive ? "rgba(88,28,135,0.95)" : "rgba(9,9,11,0.92)"};color:#ffffff;padding:1px 4px;border-radius:4px;border:1px solid ${isActive ? "rgba(192,132,252,0.8)" : "rgba(129,140,248,0.4)"};letter-spacing:0.5px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.8);">
        ${step}
      </span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -14],
  })
}

function getAnomalyIdForRegion(regionId: string, regionName: string): string {
  const s = (regionId + " " + regionName).toLowerCase()
  if (s.includes("amphan") || s.includes("sundarbans")) return "cyclone-amphan"
  if (s.includes("mumbai") || s.includes("konkan")) return "anomaly-mumbai-02"
  if (s.includes("bikaner") || s.includes("rajasthan") || s.includes("heatwave")) return "anomaly-bikaner-03"
  if (s.includes("puri") || s.includes("cyclone") || s.includes("odisha") || s.includes("east-coast")) return "anomaly-puri-04"
  if (s.includes("gangotri") || s.includes("himalayan") || s.includes("uttarakhand")) return "anomaly-gangotri-05"
  return "anomaly-brahmaputra-01"
}

function compute4DTrajectory(lat: number, lon: number, precip: number, shear: number): TrajectoryWaypoint[] {
  let dLat = 0.35
  let dLon = -0.65

  if (lat >= 28) {
    dLat = 0.28
    dLon = 0.85
  } else if (lon >= 88) {
    dLat = 0.55
    dLon = -0.45
  } else if (lat < 18) {
    dLat = 0.4
    dLon = -0.9
  }

  const steps = [
    { step: "T+0h", dayLabel: "Live Core", hPa: "925 hPa (Surface Core)", conf: 98, unc: 12000, pMult: 1.0 },
    { step: "T+24h", dayLabel: "+1 Day", hPa: "850 hPa (Boundary Layer)", conf: 92, unc: 28000, pMult: 0.95 },
    { step: "T+48h", dayLabel: "+2 Days", hPa: "700 hPa (Mid-Troposphere)", conf: 86, unc: 52000, pMult: 0.88 },
    { step: "T+72h", dayLabel: "+3 Days", hPa: "500 hPa (Steering Level)", conf: 79, unc: 82000, pMult: 0.78 },
    { step: "T+96h", dayLabel: "+4 Days", hPa: "400 hPa (Upper Flow)", conf: 71, unc: 115000, pMult: 0.65 },
    { step: "T+120h", dayLabel: "+5 Days", hPa: "250 hPa (Jet Streak)", conf: 64, unc: 155000, pMult: 0.52 },
  ]

  return steps.map((s, idx) => {
    const curve = Math.sin((idx / 5) * Math.PI) * 0.25
    const ptLat = Number((lat + idx * dLat + curve).toFixed(4))
    const ptLon = Number((lon + idx * dLon).toFixed(4))
    const pVal = Math.round(precip * s.pMult)
    const sVal = Math.round(shear * s.pMult)

    return {
      id: `traj-${idx}`,
      step: s.step,
      dayLabel: s.dayLabel,
      coords: [ptLat, ptLon],
      pressureLevel: s.hPa,
      intensityLabel: `${pVal} mm/hr · ${sVal} kts`,
      confidence: s.conf,
      uncertaintyRadiusMeters: s.unc,
      meshNodeId: Math.floor(10000 + (lat * 100 + lon * 50 + idx * 791) % 30962),
    }
  })
}

function createZoneIcon(severity: Severity) {
  const color = severityColor(severity)
  const pulse = severity === "Critical" || severity === "Severe"
  return L.divIcon({
    className: "ner-risk-marker",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:22px;height:22px;transform:translate(-50%,-50%);">
      ${pulse ? `<div style="position:absolute;width:26px;height:26px;border-radius:9999px;background:${color};opacity:0.4;animation:ner-pulse 1.8s ease-out infinite;"></div>` : ""}
      <div style="position:relative;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 0 10px ${color}, 0 2px 5px rgba(0,0,0,0.5);"></div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -12],
  })
}

function createActiveIcon(severity: Severity, riskScore: number) {
  const color = severityColor(severity, riskScore)
  return L.divIcon({
    className: "ner-search-marker",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;transform:translate(-50%,-50%);">
      <div style="position:absolute;width:40px;height:40px;border-radius:9999px;background:${color};opacity:0.35;animation:ner-pulse 1.4s ease-out infinite;"></div>
      <div style="position:absolute;width:26px;height:26px;border-radius:9999px;background:${color};opacity:0.55;animation:ner-pulse 1.8s ease-out 0.4s infinite;"></div>
      <div style="position:relative;width:20px;height:20px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;box-shadow:0 0 16px ${color};display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:11px;font-weight:900;">!</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  })
}

function createIncidentIcon(queued: boolean) {
  const color = queued ? "#38bdf8" : "#f43f5e"
  const label = queued ? "QUEUE" : "ALERT"
  return L.divIcon({
    className: "ner-incident-marker",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);">
      <div style="display:flex;align-items:center;gap:3px;background:${color};color:#ffffff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;border:1.5px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.7);letter-spacing:0.5px;">
        <span style="font-size:9px;">⚠️</span>
        <span>${label}</span>
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};"></div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -26],
  })
}

function FlyToTarget({
  lat,
  lon,
  token,
}: {
  lat: number
  lon: number
  token: number
}) {
  const map = useMap()
  const prevTokenRef = useRef(0)

  useEffect(() => {
    try {
      const container = map.getContainer()
      if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
        return
      }
      map.invalidateSize()

      // token === 0: Initial load / National Overview -> KEEP FULL INDIA VIEW
      if (token === 0) {
        map.setView([21.2, 82.2], 4.2)
        return
      }
      // token === -1: Explicit reset to Full India View button
      if (token === -1) {
        map.flyTo([21.2, 82.2], 4.2, { duration: 1.4 })
        prevTokenRef.current = -1
        return
      }
      // Only fly to specific location when token > 0 and token actually changed!
      if (token > 0 && token !== prevTokenRef.current) {
        prevTokenRef.current = token
        const targetLat = Number.isFinite(lat) ? lat : 21.2
        const targetLon = Number.isFinite(lon) ? lon : 82.2
        map.flyTo([targetLat, targetLon], 10, { duration: 1.5 })
      }
    } catch {
      // Safely ignore animation interruptions or transient unmounts
    }
  }, [lat, lon, token, map])

  return null
}

export interface RiskMapProps {
  showRainfallRadar?: boolean
  showSlopeGradient?: boolean
  showStations?: boolean
  showIncidents?: boolean
  showBuffer?: boolean
  showTrajectory?: boolean
  showNonIndiaAlerts?: boolean
  basemapMode?: "dark" | "satellite" | "topo"
}

export function RiskMap({
  showRainfallRadar = true,
  showSlopeGradient = true,
  showStations = true,
  showIncidents = true,
  showBuffer = true,
  showTrajectory = true,
  showNonIndiaAlerts = false,
  basemapMode = "dark",
}: RiskMapProps) {
  const {
    selectedRegion,
    visibleIncidents,
    gpsOverride,
    flyToken,
    activeLanguage,
    filterScope,
    selectRegion,
    selectCustomLocation,
    setInspectingIncident,
    timelineHour,
    setTimelineHour,
    ensemblePercentile,
    isSwipeComparatorActive,
  } = useDisaster()
  const [ready, setReady] = useState(false)
  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null)
  const [apiWaypoints, setApiWaypoints] = useState<ApiWaypoint[]>([])

  const anomalyId = useMemo(() => {
    return getAnomalyIdForRegion(selectedRegion.id, selectedRegion.name)
  }, [selectedRegion.id, selectedRegion.name])

  useEffect(() => {
    const controller = new AbortController()
    fetchAnomalyTrack(anomalyId, controller.signal)
      .then((waypoints) => {
        if (waypoints && waypoints.length > 0) {
          setApiWaypoints(waypoints)
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [anomalyId])

  const displayedStations = useMemo(() => {
    if (filterScope === "all") return NER_REGIONS
    return NER_REGIONS.filter((region) =>
      isLocationInSector(
        region.coords[0],
        region.coords[1],
        region.district,
        region.state,
        selectedRegion.coords,
        selectedRegion.district,
        selectedRegion.state,
      ),
    )
  }, [filterScope, selectedRegion])

  const displayedIncidents = useMemo(() => {
    // India Subcontinent Bounding Box: lat 6.5 to 37.5, lon 68.0 to 97.5
    const isInsideIndia = (lat: number, lon: number) =>
      lat >= 6.5 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5

    const baseList = showNonIndiaAlerts
      ? visibleIncidents
      : visibleIncidents.filter((inc) => isInsideIndia(inc.lat, inc.lon))

    if (filterScope === "all") return baseList
    return baseList.filter((incident) =>
      isLocationInSector(
        incident.lat,
        incident.lon,
        undefined,
        undefined,
        selectedRegion.coords,
        selectedRegion.district,
        selectedRegion.state,
      ),
    )
  }, [filterScope, visibleIncidents, selectedRegion, showNonIndiaAlerts])

  useEffect(() => {
    setReady(true)
  }, [])

  // Fetch real-time live Doppler weather radar tile configuration (RainViewer)
  useEffect(() => {
    if (!showRainfallRadar) return
    const controller = new AbortController()
    fetch("https://api.rainviewer.com/public/weather-maps.json", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const latest = data.radar?.past?.slice(-1)[0]
        if (data.host && latest?.path) {
          setRadarTileUrl(`${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`)
        }
      })
      .catch(() => {
        // network fallback handled gracefully
      })
    return () => controller.abort()
  }, [showRainfallRadar])

  const focusLat = (gpsOverride && Number.isFinite(gpsOverride.lat)) ? gpsOverride.lat : (Number.isFinite(selectedRegion?.coords?.[0]) ? selectedRegion.coords[0] : 21.2)
  const focusLon = (gpsOverride && Number.isFinite(gpsOverride.lon)) ? gpsOverride.lon : (Number.isFinite(selectedRegion?.coords?.[1]) ? selectedRegion.coords[1] : 82.2)
  const tempDeltaVal =
    selectedRegion.tempDelta ??
    (selectedRegion.slope !== undefined ? Number(((selectedRegion.slope / 65) * 25 - 10).toFixed(1)) : 2.5)
  const precipRateVal =
    selectedRegion.precipRate ??
    (selectedRegion.rainfall !== undefined ? Math.round((selectedRegion.rainfall / 350) * 120) : 35)
  const z500Val =
    selectedRegion.z500 ??
    (selectedRegion.soil !== undefined ? Math.round(5200 + (selectedRegion.soil / 100) * 750) : 5650)
  const shearVal = selectedRegion.shear ?? 45
  const riskScore = computeRiskIndex(tempDeltaVal, precipRateVal, z500Val, shearVal)
  const bufferColor = severityColor(selectedRegion.severity, riskScore)
  const bufferRadius = bufferRadiusMeters(selectedRegion.severity, riskScore)

  const currentWaypoint = useMemo(() => {
    if (!apiWaypoints || apiWaypoints.length === 0) return null
    return apiWaypoints.reduce((prev, curr) =>
      Math.abs(curr.hours_ahead - timelineHour) < Math.abs(prev.hours_ahead - timelineHour) ? curr : prev
    )
  }, [apiWaypoints, timelineHour])

  const currentCoord = useMemo<[number, number]>(() => {
    if (!currentWaypoint) return [focusLat, focusLon]
    if (ensemblePercentile === "p10" && currentWaypoint.p10_lat !== undefined && currentWaypoint.p10_lon !== undefined) {
      return [currentWaypoint.p10_lat, currentWaypoint.p10_lon]
    }
    if (ensemblePercentile === "p90" && currentWaypoint.p90_lat !== undefined && currentWaypoint.p90_lon !== undefined) {
      return [currentWaypoint.p90_lat, currentWaypoint.p90_lon]
    }
    if (currentWaypoint.p50_lat !== undefined && currentWaypoint.p50_lon !== undefined) {
      return [currentWaypoint.p50_lat, currentWaypoint.p50_lon]
    }
    return [currentWaypoint.lat, currentWaypoint.lon]
  }, [currentWaypoint, ensemblePercentile, focusLat, focusLon])

  const p10Positions = useMemo<[number, number][]>(() => {
    if (!apiWaypoints.length) return []
    return apiWaypoints.map((w) => [w.p10_lat ?? w.lat, w.p10_lon ?? w.lon])
  }, [apiWaypoints])

  const p50Positions = useMemo<[number, number][]>(() => {
    if (!apiWaypoints.length) return []
    return apiWaypoints.map((w) => [w.p50_lat ?? w.lat, w.p50_lon ?? w.lon])
  }, [apiWaypoints])

  const p90Positions = useMemo<[number, number][]>(() => {
    if (!apiWaypoints.length) return []
    return apiWaypoints.map((w) => [w.p90_lat ?? w.lat, w.p90_lon ?? w.lon])
  }, [apiWaypoints])

  const milestoneWaypoints = useMemo(() => {
    if (!apiWaypoints.length) return []
    const targetHours = [0, 24, 48, 72, 120, 168, 240]
    return apiWaypoints.filter((w) => targetHours.includes(w.hours_ahead))
  }, [apiWaypoints])

  const fallbackWaypoints = useMemo(() => {
    return compute4DTrajectory(focusLat, focusLon, precipRateVal, shearVal)
  }, [focusLat, focusLon, precipRateVal, shearVal])

  const zoneIcons = useMemo(
    () => ({
      Critical: createZoneIcon("Critical"),
      Severe: createZoneIcon("Severe"),
      Moderate: createZoneIcon("Moderate"),
      Low: createZoneIcon("Low"),
    }),
    [],
  )

  if (!ready) {
    return (
      <div className="flex size-full items-center justify-center bg-zinc-950 text-xs text-zinc-400">
        {t(activeLanguage, "loadingMap")}
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes ner-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .ner-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(82%) contrast(115%) saturate(35%);
        }
        .ner-3d-hillshade-dark {
          filter: contrast(135%) brightness(115%);
          mix-blend-mode: screen;
        }
        .ner-3d-hillshade {
          filter: contrast(130%) brightness(95%);
          mix-blend-mode: multiply;
        }
        .ner-topo-tiles {
          filter: contrast(125%) saturate(120%);
        }
        .leaflet-popup-content-wrapper {
          background: #09090b;
          color: #e4e4e7;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
        }
        .leaflet-popup-tip { background: #09090b; }
        .leaflet-container a.leaflet-popup-close-button { color: #a1a1aa; }
        .leaflet-control-attribution {
          background: rgba(9,9,11,0.65) !important;
          color: #71717a !important;
          font-size: 9px !important;
          padding: 1px 6px !important;
          border-radius: 4px 0 0 0;
        }
        .leaflet-control-attribution a { color: #a1a1aa !important; }
      `}</style>
      <MapContainer
        center={[21.2, 82.2]}
        zoom={4.2}
        minZoom={3.5}
        zoomSnap={0.1}
        scrollWheelZoom
        zoomControl={false}
        className="size-full"
        style={{ background: "#09090b" }}
      >
        {/* Base Map Layers based on basemapMode (100% Free Public GIS Layers - ZERO API KEY REQUIRED) */}
        {basemapMode === "dark" && (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, &copy; OpenStreetMap'
              maxZoom={16}
            />
            {showSlopeGradient && (
              <TileLayer
                className="ner-3d-hillshade-dark"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
                opacity={0.48}
                maxNativeZoom={13}
                maxZoom={16}
                zIndex={405}
                attribution='&copy; <a href="https://www.esri.com">Esri 3D Hillshade</a>'
              />
            )}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              attribution=""
              maxZoom={16}
              zIndex={425}
            />
          </>
        )}

        {basemapMode === "satellite" && (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com">Esri World Imagery</a>'
              maxZoom={18}
            />
            {showSlopeGradient && (
              <TileLayer
                className="ner-3d-hillshade"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
                opacity={0.35}
                maxNativeZoom={13}
                maxZoom={18}
                zIndex={405}
                attribution='&copy; <a href="https://www.esri.com">Esri 3D Hillshade</a>'
              />
            )}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution=""
              maxZoom={18}
              zIndex={425}
            />
          </>
        )}

        {basemapMode === "topo" && (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com">Esri World Topo</a>'
              maxZoom={18}
            />
            {showSlopeGradient && (
              <TileLayer
                className="ner-3d-hillshade"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
                opacity={0.3}
                maxNativeZoom={13}
                maxZoom={18}
                zIndex={405}
                attribution='&copy; <a href="https://www.esri.com">Esri 3D Hillshade</a>'
              />
            )}
          </>
        )}

        {/* Real Doppler Precipitation Weather Radar Layer */}
        {showRainfallRadar && radarTileUrl && (
          <TileLayer
            url={radarTileUrl}
            opacity={0.65}
            maxNativeZoom={7}
            maxZoom={19}
            zIndex={430}
            attribution='&copy; <a href="https://rainviewer.com">RainViewer Radar</a>'
          />
        )}

        <FlyToTarget lat={focusLat} lon={focusLon} token={flyToken} />

        {showStations &&
          displayedStations.map((region) => {
            const tDelta =
              region.tempDelta ??
              (region.slope !== undefined ? Number(((region.slope / 65) * 25 - 10).toFixed(1)) : 2.5)
            const pRate =
              region.precipRate ??
              (region.rainfall !== undefined ? Math.round((region.rainfall / 350) * 120) : 35)
            return (
              <Marker key={region.id} position={region.coords} icon={zoneIcons[region.severity]}>
                <Popup>
                  <div className="min-w-[190px] text-xs">
                    <div className="mb-1 text-sm font-semibold">
                      {region.name} · {region.city}
                    </div>
                    <div className="space-y-0.5 text-zinc-300">
                      <div>
                        Status: {localize(region.status, activeLanguage)}
                      </div>
                      <div>
                        Thermal Anomaly: {tDelta > 0 ? `+${tDelta}` : tDelta}°C
                      </div>
                      <div>
                        Precipitation (12km Coarse): {pRate} mm/hr
                      </div>
                      <div className="text-purple-300 font-semibold">
                        5km DDPM Resolved: {pRate > 5 ? (pRate >= 75 ? Math.round(pRate * 1.5) : Math.round(pRate * 1.35)) : pRate} mm/hr
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectRegion(region)}
                      className="mt-2 w-full rounded bg-emerald-600 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      Focus this sector 🎯
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

        {showIncidents && (
          <IncidentClusterLayer
            incidents={displayedIncidents}
            lang={activeLanguage}
            onInspect={(inc) => {
              selectCustomLocation(inc.locationLabel, inc.lat, inc.lon)
              setInspectingIncident(inc)
            }}
          />
        )}

        {/* Dynamic Extreme Weather Influence Radius Buffer (30km - 60km) */}
        {showBuffer && flyToken > 0 && (
          <Circle
            key={`${selectedRegion.id}-${focusLat}-${focusLon}-${bufferRadius}-${bufferColor}`}
            center={[focusLat, focusLon]}
            radius={bufferRadius}
            pathOptions={{
              color: bufferColor,
              fillColor: bufferColor,
              fillOpacity: 0.22,
              weight: 2,
              dashArray: riskScore >= 70 ? "6, 6" : undefined,
            }}
          />
        )}

        {/* ── 4D Spherical GNN Trajectory Track & Ensemble View (Phase 3) ── */}
        {showTrajectory && flyToken > 0 && currentWaypoint?.bounding_box && (
          <Rectangle
            key={`bbox-${currentWaypoint.hours_ahead}-${ensemblePercentile}`}
            bounds={[
              [currentWaypoint.bounding_box[0], currentWaypoint.bounding_box[1]],
              [currentWaypoint.bounding_box[2], currentWaypoint.bounding_box[3]],
            ]}
            pathOptions={{
              color: "#c084fc",
              weight: 2,
              dashArray: "6, 4",
              fillColor: "#a855f7",
              fillOpacity: 0.16,
            }}
          >
            <Popup>
              <div className="min-w-[220px] p-1.5 text-xs font-mono">
                <div className="mb-1.5 flex items-center justify-between border-b border-zinc-800 pb-1">
                  <span className="font-medium text-purple-300 font-sans">
                    5km subgrid bounding box
                  </span>
                  <span className="rounded bg-purple-950 px-1.5 py-0.5 text-xs text-purple-200 border border-purple-500/40">
                    {currentWaypoint.step}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-zinc-300">
                  <div>Forecast: {currentWaypoint.step} ({currentWaypoint.day_label})</div>
                  <div>Pressure: {currentWaypoint.pressure_level_hpa}</div>
                  <div>Lat: [{currentWaypoint.bounding_box[0].toFixed(2)}°, {currentWaypoint.bounding_box[2].toFixed(2)}°]</div>
                  <div>Lon: [{currentWaypoint.bounding_box[1].toFixed(2)}°, {currentWaypoint.bounding_box[3].toFixed(2)}°]</div>
                  <div className="pt-1 text-emerald-400 font-semibold border-t border-zinc-800">
                    DDPM peak: {currentWaypoint.precip_rate_mm_hr} mm/hr
                  </div>
                </div>
              </div>
            </Popup>
          </Rectangle>
        )}

        {/* Current Active Step Uncertainty Cone */}
        {showTrajectory && flyToken > 0 && currentWaypoint && (
          <Circle
            key={`active-cone-${currentWaypoint.hours_ahead}-${ensemblePercentile}`}
            center={currentCoord}
            radius={currentWaypoint.uncertainty_radius_km * 1000}
            pathOptions={{
              color:
                ensemblePercentile === "p90"
                  ? "#f43f5e"
                  : ensemblePercentile === "p10"
                  ? "#06b6d4"
                  : "#818cf8",
              fillColor:
                ensemblePercentile === "p90"
                  ? "#f43f5e"
                  : ensemblePercentile === "p10"
                  ? "#06b6d4"
                  : "#818cf8",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "4, 4",
            }}
          />
        )}

        {/* Expanding Cone of Uncertainty along future track */}
        {showTrajectory &&
          flyToken > 0 &&
          milestoneWaypoints
            .filter((w) => w.hours_ahead > timelineHour)
            .map((wp) => {
              const pt: [number, number] =
                ensemblePercentile === "p10"
                  ? [wp.p10_lat ?? wp.lat, wp.p10_lon ?? wp.lon]
                  : ensemblePercentile === "p90"
                  ? [wp.p90_lat ?? wp.lat, wp.p90_lon ?? wp.lon]
                  : [wp.p50_lat ?? wp.lat, wp.p50_lon ?? wp.lon]
              return (
                <Circle
                  key={`cone-${wp.hours_ahead}-${ensemblePercentile}`}
                  center={pt}
                  radius={wp.uncertainty_radius_km * 1000}
                  pathOptions={{
                    color: "#818cf8",
                    fillColor: "#818cf8",
                    fillOpacity: 0.035,
                    weight: 1,
                    dashArray: "4, 4",
                  }}
                />
              )
            })}

        {/* Ensemble View: p10 / p50 / p90 Tracks */}
        {showTrajectory && flyToken > 0 && p10Positions.length > 0 && (
          <>
            {/* p10 Conservative Lower Envelope Track */}
            <Polyline
              key={`p10-poly-${focusLat}-${focusLon}`}
              positions={p10Positions}
              pathOptions={{
                color: "#06b6d4",
                weight: ensemblePercentile === "p10" ? 3.5 : 1.5,
                dashArray: "4, 4",
                opacity: ensemblePercentile === "p10" ? 0.95 : 0.4,
              }}
            />
            {/* p50 Median Deterministic Centerline */}
            <Polyline
              key={`p50-poly-${focusLat}-${focusLon}`}
              positions={p50Positions}
              pathOptions={{
                color: "#818cf8",
                weight: ensemblePercentile === "p50" ? 4 : 2.5,
                opacity: ensemblePercentile === "p50" ? 1 : 0.6,
              }}
            />
            {/* p90 Extreme Convective Envelope Track */}
            <Polyline
              key={`p90-poly-${focusLat}-${focusLon}`}
              positions={p90Positions}
              pathOptions={{
                color: "#f43f5e",
                weight: ensemblePercentile === "p90" ? 3.5 : 1.5,
                dashArray: "6, 4",
                opacity: ensemblePercentile === "p90" ? 0.95 : 0.4,
              }}
            />
          </>
        )}

        {/* Milestone Waypoint Markers (Clickable to jump timeline) */}
        {showTrajectory &&
          flyToken > 0 &&
          milestoneWaypoints.map((wp) => {
            const coord: [number, number] =
              ensemblePercentile === "p10"
                ? [wp.p10_lat ?? wp.lat, wp.p10_lon ?? wp.lon]
                : ensemblePercentile === "p90"
                ? [wp.p90_lat ?? wp.lat, wp.p90_lon ?? wp.lon]
                : [wp.p50_lat ?? wp.lat, wp.p50_lon ?? wp.lon]
            const isLive = wp.hours_ahead === 0
            const isCurrent = currentWaypoint?.hours_ahead === wp.hours_ahead
            return (
              <Marker
                key={`milestone-${wp.hours_ahead}`}
                position={coord}
                icon={createTrajectoryIcon(wp.step, isLive, isCurrent)}
                eventHandlers={{
                  click: () => {
                    setTimelineHour(wp.hours_ahead)
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[220px] p-1.5 text-xs">
                    <div className="mb-1.5 flex items-center justify-between gap-1.5 border-b border-zinc-800 pb-1">
                      <span className="font-medium text-indigo-300 font-mono">
                        {wp.step} ({wp.day_label})
                      </span>
                      <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-1.5 py-0.5 text-xs font-medium text-indigo-300 font-mono">
                        {wp.confidence}% GNN
                      </span>
                    </div>
                    <div className="space-y-1 text-zinc-300 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-sans">Pressure altitude:</span>
                        <span className="text-cyan-400 font-medium">{wp.pressure_level_hpa}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-sans">Ensemble cone:</span>
                        <span className="text-amber-400 font-medium">±{wp.uncertainty_radius_km} km</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800/80 pt-1 text-purple-200">
                        <span className="text-purple-400 font-sans">5km DDPM peak:</span>
                        <span className="font-medium text-emerald-400">{wp.precip_rate_mm_hr} mm/hr</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTimelineHour(wp.hours_ahead)}
                      className="mt-2 w-full rounded bg-indigo-600/80 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-xs font-mono"
                    >
                      Jump timeline to {wp.step} ⏩
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

        {/* Pulsing Epicenter Marker at current timeline timestep */}
        {showBuffer && flyToken > 0 && (
          <Marker position={currentCoord} icon={createActiveIcon(selectedRegion.severity, riskScore)}>
            <Popup>
              <div className="min-w-[240px] p-1 text-xs">
                <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
                  <div className="flex flex-col">
                    <span className="font-serif font-semibold text-sm text-zinc-100">{selectedRegion.name}</span>
                    <span className="text-xs text-sky-400 font-medium tracking-wide">
                      {currentWaypoint ? `${currentWaypoint.step} synoptic forecast core` : "Spatio-temporal anomaly core"}
                    </span>
                  </div>
                  <span
                    className="rounded px-2 py-0.5 font-mono text-xs font-medium shrink-0"
                    style={{
                      backgroundColor: `${bufferColor}22`,
                      color: bufferColor,
                      border: `1px solid ${bufferColor}50`,
                    }}
                  >
                    {riskScore}% anomaly index
                  </span>
                </div>
                <div className="space-y-1 text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Centroid Coordinates:</span>
                    <span className="font-mono text-zinc-200">{formatCoord(currentCoord[0], currentCoord[1])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Forecast Horizon:</span>
                    <span className="font-semibold text-indigo-300 font-mono">
                      {currentWaypoint ? `${currentWaypoint.step} (${currentWaypoint.day_label})` : "T+0h"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Active Ensemble Member:</span>
                    <span className="font-semibold text-cyan-300 font-mono">
                      {ensemblePercentile.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Uncertainty Cone Radius:</span>
                    <span className="font-semibold text-amber-400 font-mono">
                      ±{currentWaypoint ? currentWaypoint.uncertainty_radius_km : Math.round(bufferRadius / 1000)} km
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-300">
                    <span className="text-purple-400 font-medium">5km DDPM Resolved Peak:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {currentWaypoint ? currentWaypoint.precip_rate_mm_hr : ((selectedRegion.precipRate ?? 35) > 5 ? Math.round((selectedRegion.precipRate ?? 35) * 1.5) : (selectedRegion.precipRate ?? 35))} mm/hr
                    </span>
                  </div>
                  <div className="mt-2 rounded border border-zinc-800 bg-zinc-900/90 p-2 text-xs leading-snug">
                    <span className="font-medium text-sky-400 font-sans">MoES advisory: </span>
                    <span className="text-zinc-300 font-sans">{localize(selectedRegion.advice, activeLanguage)}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </>
  )
}

function IncidentClusterLayer({
  incidents,
  lang,
  onInspect,
}: {
  incidents: IncidentReport[]
  lang: Language
  onInspect: (incident: IncidentReport) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (typeof window === "undefined" || !map) return

    try {
      require("leaflet.markercluster")
    } catch {
      // plugin already initialized
    }

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 42,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const isCriticalCluster = count >= 4
        const bg = isCriticalCluster
          ? "background: rgba(225, 29, 72, 0.95); border: 2px solid #fda4af; box-shadow: 0 0 12px rgba(225,29,72,0.6);"
          : "background: rgba(217, 119, 6, 0.95); border: 2px solid #fde68a; box-shadow: 0 0 10px rgba(217,119,6,0.5);"
        return L.divIcon({
          html: `<div style="${bg} width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 11px; font-weight: 900; font-family: monospace; letter-spacing: -0.5px;">
            ${count}
          </div>`,
          className: "ner-incident-cluster-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      },
    })

    incidents.forEach((incident) => {
      const queued = incident.syncStatus !== "synced"
      const marker = L.marker([incident.lat, incident.lon], {
        icon: createIncidentIcon(queued),
      })

      const container = document.createElement("div")
      container.className = "min-w-[210px] text-xs p-1 space-y-1.5"
      container.innerHTML = `
        <div class="font-serif font-semibold text-sm text-zinc-100">${incident.type}</div>
        <div class="text-zinc-300 font-medium">${incident.locationLabel}</div>
        <div class="text-zinc-400 font-mono text-xs">${formatCoord(incident.lat, incident.lon)}</div>
        <div class="flex items-center justify-between pt-1 border-t border-zinc-800">
          <span class="${queued ? "text-sky-300 font-medium text-xs" : "text-rose-400 font-medium text-xs"}">
            ${queued ? t(lang, "queued") : "Verified alert"}
          </span>
          <button type="button" class="cluster-sop-inspect-btn rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow-xs">
            Inspect SOP ↗
          </button>
        </div>
      `
      const btn = container.querySelector(".cluster-sop-inspect-btn")
      if (btn) {
        btn.addEventListener("click", () => {
          onInspect(incident)
        })
      }

      marker.bindPopup(container)
      clusterGroup.addLayer(marker)
    })

    map.addLayer(clusterGroup)

    return () => {
      map.removeLayer(clusterGroup)
    }
  }, [map, incidents, lang, onInspect])

  return null
}

function IncidentMarker({
  incident,
  lang,
  onInspect,
}: {
  incident: IncidentReport
  lang: Language
  onInspect: (incident: IncidentReport) => void
}) {
  const queued = incident.syncStatus !== "synced"
  return (
    <Marker position={[incident.lat, incident.lon]} icon={createIncidentIcon(queued)}>
      <Popup>
        <div className="min-w-[210px] text-xs p-1 space-y-1.5">
          <div className="font-serif font-semibold text-sm text-zinc-100">{incident.type}</div>
          <div className="text-zinc-300 font-medium">${incident.locationLabel}</div>
          <div className="text-zinc-400 font-mono text-xs">{formatCoord(incident.lat, incident.lon)}</div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className={queued ? "text-sky-300 font-medium text-xs" : "text-rose-400 font-medium text-xs"}>
              {queued ? t(lang, "queued") : "Verified alert"}
            </span>
            <button
              type="button"
              onClick={() => onInspect(incident)}
              className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              Inspect SOP ↗
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
