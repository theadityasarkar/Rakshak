"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { NER_REGIONS, localize, type Severity, type Language } from "@/src/data/ner-regions"
import { bufferRadiusMeters, computeRiskIndex, formatCoord, severityColor, isLocationInSector } from "@/src/lib/risk"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"
import type { IncidentReport } from "@/src/types/incident"

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
  basemapMode?: "dark" | "satellite" | "topo"
}

export function RiskMap({
  showRainfallRadar = true,
  showSlopeGradient = true,
  showStations = true,
  showIncidents = true,
  showBuffer = true,
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
  } = useDisaster()
  const [ready, setReady] = useState(false)
  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null)

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
    if (filterScope === "all") return visibleIncidents
    return visibleIncidents.filter((incident) =>
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
  }, [filterScope, visibleIncidents, selectedRegion])

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
                        Precipitation Surge: {pRate} mm/hr
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectRegion(region)}
                      className="mt-2 w-full rounded bg-emerald-600 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      Focus This Sector 🎯
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

        {showIncidents &&
          displayedIncidents.map((incident) => (
            <IncidentMarker
              key={incident.id}
              incident={incident}
              lang={activeLanguage}
              onInspect={(inc) => {
                selectCustomLocation(inc.locationLabel, inc.lat, inc.lon)
                setInspectingIncident(inc)
              }}
            />
          ))}

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

        {/* Pulsing Epicenter Marker */}
        {showBuffer && flyToken > 0 && (
          <Marker position={[focusLat, focusLon]} icon={createActiveIcon(selectedRegion.severity, riskScore)}>
            <Popup>
              <div className="min-w-[240px] p-1 text-xs">
                <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-zinc-100">{selectedRegion.name}</span>
                    <span className="text-[10px] text-sky-400 font-semibold tracking-wide">
                      Spatio-Temporal Anomaly Core
                    </span>
                  </div>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0"
                    style={{
                      backgroundColor: `${bufferColor}22`,
                      color: bufferColor,
                      border: `1px solid ${bufferColor}50`,
                    }}
                  >
                    {riskScore}% Anomaly Index
                  </span>
                </div>
                <div className="space-y-1 text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Coordinates:</span>
                    <span className="font-mono text-zinc-200">{formatCoord(focusLat, focusLon)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Weather Anomaly Influence Radius:</span>
                    <span className="font-semibold text-zinc-100">
                      {Math.round(bufferRadius / 1000)} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Thermal Anomaly:</span>
                    <span className="font-semibold text-zinc-100 font-mono">
                      {(selectedRegion.tempDelta ?? 2.5) > 0 ? `+${selectedRegion.tempDelta ?? 2.5}` : selectedRegion.tempDelta ?? 2.5}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Precipitation Surge Rate:</span>
                    <span className="font-semibold text-zinc-100 font-mono">
                      {selectedRegion.precipRate ?? 35} mm/hr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Z500 Synoptic Pressure Anomaly:</span>
                    <span className="font-semibold text-zinc-100 font-mono">{z500Val} gpm</span>
                  </div>
                  {selectedRegion.shear !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Vertical Wind Shear:</span>
                      <span className="font-semibold text-zinc-100 font-mono">{selectedRegion.shear} kts</span>
                    </div>
                  )}
                  <div className="mt-2 rounded border border-zinc-800 bg-zinc-900/90 p-1.5 text-[11px] leading-snug">
                    <span className="font-semibold text-sky-400">MoES Advisory: </span>
                    <span className="text-zinc-300">{localize(selectedRegion.advice, activeLanguage)}</span>
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
        <div className="min-w-[190px] text-xs p-1 space-y-1.5">
          <div className="font-bold text-sm text-zinc-100">{incident.type}</div>
          <div className="text-zinc-300 font-medium">{incident.locationLabel}</div>
          <div className="text-zinc-400 font-mono text-[11px]">{formatCoord(incident.lat, incident.lon)}</div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className={queued ? "text-sky-300 font-semibold text-[11px]" : "text-rose-400 font-semibold text-[11px]"}>
              {queued ? t(lang, "queued") : "Verified Alert"}
            </span>
            <button
              type="button"
              onClick={() => onInspect(incident)}
              className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              Inspect SOP ↗
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
