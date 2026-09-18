"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { NER_REGIONS, localize, type Severity } from "@/src/data/ner-regions"
import { bufferRadiusMeters, computeRiskIndex, formatCoord, severityColor } from "@/src/lib/risk"
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
  useEffect(() => {
    map.flyTo([lat, lon], 12, { duration: 1.5 })
  }, [lat, lon, token, map])
  return null
}

export interface RiskMapProps {
  showRainfallRadar?: boolean
  showSlopeGradient?: boolean
  showStations?: boolean
  showIncidents?: boolean
  showBuffer?: boolean
}

export function RiskMap({
  showRainfallRadar = true,
  showSlopeGradient = false,
  showStations = true,
  showIncidents = true,
  showBuffer = true,
}: RiskMapProps) {
  const { selectedRegion, visibleIncidents, gpsOverride, flyToken, activeLanguage } = useDisaster()
  const [ready, setReady] = useState(false)
  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null)

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

  const focusLat = gpsOverride?.lat ?? selectedRegion.coords[0]
  const focusLon = gpsOverride?.lon ?? selectedRegion.coords[1]
  const riskScore = computeRiskIndex(selectedRegion.slope, selectedRegion.rainfall, selectedRegion.soil)
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
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) saturate(40%);
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
          background: rgba(9,9,11,0.85) !important;
          color: #a1a1aa !important;
        }
        .leaflet-control-attribution a { color: #d4d4d8 !important; }
      `}</style>
      <MapContainer
        center={[focusLat, focusLon]}
        zoom={8}
        scrollWheelZoom
        zoomControl={false}
        className="size-full"
        style={{ background: "#09090b" }}
      >
        <TileLayer
          className="ner-dark-tiles"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Real Topographic Elevation & Slope Gradient Hillshade Layer (Contours & Elevation) */}
        {showSlopeGradient && (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            opacity={0.55}
            maxNativeZoom={14}
            maxZoom={19}
            zIndex={410}
            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
          />
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
          NER_REGIONS.map((region) => (
            <Marker key={region.id} position={region.coords} icon={zoneIcons[region.severity]}>
              <Popup>
                <div className="min-w-[170px] text-xs">
                  <div className="mb-1 text-sm font-semibold">
                    {region.name} · {region.city}
                  </div>
                  <div className="space-y-0.5 text-zinc-300">
                    <div>
                      {t(activeLanguage, "baselineZone")}: {localize(region.status, activeLanguage)}
                    </div>
                    <div>
                      {t(activeLanguage, "slope")}: {region.slope}°
                    </div>
                    <div>
                      {t(activeLanguage, "rainfall")}: {region.rainfall}mm
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {showIncidents &&
          visibleIncidents.map((incident) => (
            <IncidentMarker key={incident.id} incident={incident} lang={activeLanguage} />
          ))}

        {/* Dynamic Risk Buffer Circle (8km - 15km) */}
        {showBuffer && (
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
        {showBuffer && (
          <Marker position={[focusLat, focusLon]} icon={createActiveIcon(selectedRegion.severity, riskScore)}>
            <Popup>
            <div className="min-w-[210px] p-1 text-xs">
              <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
                <span className="font-bold text-sm text-zinc-100">{selectedRegion.name}</span>
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${bufferColor}22`,
                    color: bufferColor,
                    border: `1px solid ${bufferColor}50`,
                  }}
                >
                  {riskScore}% Risk
                </span>
              </div>
              <div className="space-y-1 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Coordinates:</span>
                  <span className="font-mono text-zinc-200">{formatCoord(focusLat, focusLon)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Hazard Buffer:</span>
                  <span className="font-semibold" style={{ color: bufferColor }}>
                    {(bufferRadius / 1000).toFixed(0)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Slope Gradient:</span>
                  <span className="font-semibold text-zinc-200">{selectedRegion.slope}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">24h Cumulative Rain:</span>
                  <span className="font-semibold text-zinc-200">{selectedRegion.rainfall} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Soil Moisture:</span>
                  <span className="font-semibold text-zinc-200">{selectedRegion.soil}%</span>
                </div>
                <div className="mt-2 rounded border border-zinc-800 bg-zinc-900/90 p-1.5 text-[11px] leading-snug">
                  <span className="font-semibold text-amber-400">SDRF Advisory: </span>
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

function IncidentMarker({ incident, lang }: { incident: IncidentReport; lang: "en" | "hi" | "as" }) {
  const queued = incident.syncStatus !== "synced"
  return (
    <Marker position={[incident.lat, incident.lon]} icon={createIncidentIcon(queued)}>
      <Popup>
        <div className="min-w-[160px] text-xs">
          <div className="mb-1 text-sm font-semibold">{incident.type}</div>
          <div className="text-zinc-300">{incident.locationLabel}</div>
          <div className="text-zinc-400">{formatCoord(incident.lat, incident.lon)}</div>
          <div className={queued ? "mt-1 text-sky-300" : "mt-1 text-rose-300"}>
            {queued ? t(lang, "queued") : t(lang, "fieldPin")}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
