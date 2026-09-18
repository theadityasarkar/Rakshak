"use client"

import "leaflet/dist/leaflet.css"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import {
  nerRiskMarkers,
  type LeafletRiskLevel,
  type LeafletRiskMarker,
  type NerDistrict,
} from "@/lib/dashboard-data"

export type { LeafletRiskLevel, LeafletRiskMarker }

const LEVEL_COLOR: Record<LeafletRiskLevel, string> = {
  severe: "#ef4444",
  moderate: "#fb923c",
  safe: "#10b981",
}

const BUFFER_RADIUS: Record<LeafletRiskLevel, number> = {
  severe: 14000,
  moderate: 10000,
  safe: 8000,
}

function createRiskIcon(level: LeafletRiskLevel) {
  const color = LEVEL_COLOR[level]
  const pulse = level === "severe"
  return L.divIcon({
    className: "ner-risk-marker",
    html: `
      <span style="position:relative;display:flex;align-items:center;justify-content:center;width:18px;height:18px;">
        ${
          pulse
            ? `<span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.55;animation:ner-pulse 1.6s ease-out infinite;"></span>`
            : ""
        }
        <span style="position:relative;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid rgba(10,14,12,0.9);box-shadow:0 0 10px ${color}aa;"></span>
      </span>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

function createSearchPinIcon(level: LeafletRiskLevel) {
  const color = LEVEL_COLOR[level]
  return L.divIcon({
    className: "ner-search-marker",
    html: `
      <span style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
        <span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.5;animation:ner-pulse 1.4s ease-out infinite;"></span>
        <span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.35;animation:ner-pulse 1.4s ease-out 0.5s infinite;"></span>
        <span style="position:relative;width:16px;height:16px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;box-shadow:0 0 14px ${color}cc;"></span>
      </span>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function FlyToSelected({ location }: { location: NerDistrict | null }) {
  const map = useMap()
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lon], 11, { duration: 1.2 })
    }
  }, [location, map])
  return null
}

export function LeafletMap({
  markers = nerRiskMarkers,
  selectedLocation = null,
}: {
  markers?: LeafletRiskMarker[]
  selectedLocation?: NerDistrict | null
}) {
  const icons = useMemo(
    () => ({
      severe: createRiskIcon("severe"),
      moderate: createRiskIcon("moderate"),
      safe: createRiskIcon("safe"),
    }),
    [],
  )

  const searchIcons = useMemo(
    () => ({
      severe: createSearchPinIcon("severe"),
      moderate: createSearchPinIcon("moderate"),
      safe: createSearchPinIcon("safe"),
    }),
    [],
  )

  return (
    <>
      <style jsx global>{`
        @keyframes ner-pulse {
          0% {
            transform: scale(1);
            opacity: 0.55;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          background: #101814;
          color: #e6f0ea;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: #101814;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #9ca8a2;
        }
        .leaflet-control-attribution {
          background: rgba(10, 14, 12, 0.7) !important;
          color: #9ca8a2 !important;
        }
        .leaflet-control-attribution a {
          color: #cbd5cd !important;
        }
        .ner-dark-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.05) saturate(0.35)
            grayscale(0.15);
        }
      `}</style>
      <MapContainer
        center={[25.5788, 91.8933]}
        zoom={8}
        scrollWheelZoom
        zoomControl={false}
        className="size-full"
        style={{ background: "#0c1512" }}
      >
        <TileLayer
          className="ner-dark-tiles"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position} icon={icons[marker.level]}>
            <Popup>
              <div className="min-w-[160px] text-xs">
                <div className="mb-1 text-sm font-semibold">{marker.name}</div>
                <div className="space-y-0.5 text-[#c3d0ca]">
                  <div>Risk: {marker.riskIndex}%</div>
                  {marker.slope !== undefined && <div>Slope: {marker.slope}°</div>}
                  {marker.rainfall24h !== undefined && <div>24h Rainfall: {marker.rainfall24h}mm</div>}
                  {marker.note && <div>{marker.note}</div>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FlyToSelected location={selectedLocation} />

        {selectedLocation && (
          <>
            <Circle
              center={[selectedLocation.lat, selectedLocation.lon]}
              radius={BUFFER_RADIUS[selectedLocation.level]}
              pathOptions={{
                color: LEVEL_COLOR[selectedLocation.level],
                fillColor: LEVEL_COLOR[selectedLocation.level],
                fillOpacity: 0.16,
                weight: 1.5,
              }}
            />
            <Marker
              position={[selectedLocation.lat, selectedLocation.lon]}
              icon={searchIcons[selectedLocation.level]}
            >
              <Popup>
                <div className="min-w-[180px] text-xs">
                  <div className="mb-1 text-sm font-semibold">{selectedLocation.name}</div>
                  <div className="space-y-0.5 text-[#c3d0ca]">
                    <div>Hazard Index: {selectedLocation.riskIndex}%</div>
                    <div>Status: {selectedLocation.status}</div>
                    <div>Slope: {selectedLocation.slope}°</div>
                    <div>24h Rainfall: {selectedLocation.rainfall24h}mm</div>
                    <div>Soil Saturation: {selectedLocation.soilSaturation}%</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </>
  )
}
