"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import {
  CloudRain,
  Mountain,
  Radio,
  AlertTriangle,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  CircleDot,
  MapPin,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MapSearchBar } from "@/src/components/MapSearchBar"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"

const RiskMap = dynamic(() => import("@/src/components/RiskMap").then((mod) => mod.RiskMap), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-zinc-950 text-xs text-zinc-500">
      Loading GIS map…
    </div>
  ),
})

export function MapPanel() {
  const [basemapMode, setBasemapMode] = useState<"dark" | "satellite" | "topo">("dark")
  const [rainfallOverlay, setRainfallOverlay] = useState(true)
  const [slopeOverlay, setSlopeOverlay] = useState(true)
  const [showStations, setShowStations] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showBuffer, setShowBuffer] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [menuExpanded, setMenuExpanded] = useState(false)
  const { activeLanguage, filterScope, setFilterScope, selectedRegion, flyToken, resetToIndiaView } = useDisaster()

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="relative flex-1 overflow-hidden">
        {/* Real Dynamic GIS Risk Map with Real Tile Layers and Filterable Layers */}
        <RiskMap
          basemapMode={basemapMode}
          showRainfallRadar={rainfallOverlay}
          showSlopeGradient={slopeOverlay}
          showStations={showStations}
          showIncidents={showIncidents}
          showBuffer={showBuffer}
        />

        {/* Floating Active Layer Information Badges (Sleek Compact Pill Row) */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-zinc-950/90 px-3 py-1 text-[11px] text-emerald-300 shadow-md backdrop-blur">
            <MapPin className="size-3 text-emerald-400 shrink-0" />
            <span className="font-semibold truncate max-w-[180px]">
              {flyToken > 0
                ? (filterScope === "district" ? (selectedRegion.district || selectedRegion.city || selectedRegion.name) : "Pan-India")
                : "National Overview"}
            </span>
            {flyToken > 0 && filterScope === "district" && (
              <span className="text-[10px] text-zinc-400 font-mono">160km</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-950/90 px-2.5 py-1 text-[11px] text-zinc-300 shadow-md backdrop-blur">
            <span className="font-medium">
              {basemapMode === "satellite" ? "🛰️ Satellite 3D" : basemapMode === "topo" ? "🏔️ Topo Terrain" : "🗺️ Esri Dark Slate"}
            </span>
          </div>

          {rainfallOverlay && (
            <div className="flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-zinc-950/90 px-2.5 py-1 text-[11px] text-sky-300 shadow-md backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
              </span>
              <span className="font-medium">Doppler Radar</span>
            </div>
          )}

          {slopeOverlay && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 text-[11px] text-amber-300 shadow-md backdrop-blur">
              <Mountain className="size-3 text-amber-400" />
              <span className="font-medium">3D Hillshade Relief</span>
            </div>
          )}
        </div>

        {/* Interactive Map Legend Card */}
        {showLegend && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-[500] max-w-xs rounded-lg border border-zinc-700/90 bg-zinc-950/95 p-3 text-xs shadow-2xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                <Info className="size-3.5 text-emerald-400" />
                <span>{t(activeLanguage, "mapLegend")}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-[11px] text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-red-500 shadow-[0_0_6px_#ef4444]" />
                </span>
                <span>Critical / Severe Weather Anomaly Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
                </span>
                <span>Moderate Synoptic Perturbation Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                </span>
                <span>Synoptically Stable Baseline Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center rounded bg-rose-600 px-1 py-0.5 text-[9px] font-bold text-white shadow">
                  ⚠️ ALERT
                </span>
                <span>Live Synoptic Event (Cloudburst / Surge / Vortex)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-3.5 items-center justify-center rounded-full border border-white bg-red-600 text-[9px] font-bold text-white shadow">
                  !
                </span>
                <span>Weather Anomaly Influence Radius (30-60km)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mountain className="size-3.5 text-amber-400 shrink-0" />
                <span>3D Topographic Elevation & Relief Contours</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar Row — always pinned to top-left of map */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-center gap-2 p-2 sm:p-3">
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2">
          <MapSearchBar />
          <button
            type="button"
            onClick={resetToIndiaView}
            title="Zoom out to Full India View"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-950/90 px-2.5 py-1.5 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur transition-all hover:border-sky-500/50 hover:bg-zinc-900 hover:text-white"
          >
            <Globe className="size-3.5 shrink-0 text-sky-400" />
            <span className="hidden sm:inline">Full India View</span>
          </button>
        </div>
      </div>

      {/* Layer Toggles — pinned to top-right, below search row on mobile */}
      <div className="pointer-events-none absolute right-0 top-12 z-[500] p-2 sm:top-0 sm:p-3">
        <div className="pointer-events-auto flex flex-col gap-1 rounded-md border border-zinc-700/80 bg-zinc-950/90 p-1.5 shadow-xl backdrop-blur">
          {/* Header row to collapse or expand filter controls */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-300">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3 text-sky-400" />
              <span>Map Layers</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowLegend((v) => !v)}
                title="Toggle Map Legend"
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                  showLegend ? "bg-emerald-500/20 text-emerald-300" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                Legend
              </button>
              <button
                type="button"
                onClick={() => setMenuExpanded((v) => !v)}
                className="p-0.5 text-zinc-400 hover:text-zinc-200"
                title="Expand/Collapse options"
              >
                {menuExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            </div>
          </div>

          {/* Basemap Mode Selector (100% Free Public Layers, ZERO API KEY REQUIRED) */}
          <div className="flex items-center justify-between gap-1.5 border-b border-zinc-800/80 px-1.5 py-1 text-[11px]">
            <span className="text-[10px] text-zinc-400">Basemap:</span>
            <div className="flex items-center rounded border border-zinc-800 bg-zinc-900/90 p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setBasemapMode("dark")}
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium transition-all",
                  basemapMode === "dark" ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                )}
                title="Esri Dark Slate Canvas (No API Key)"
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setBasemapMode("satellite")}
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium transition-all",
                  basemapMode === "satellite" ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                )}
                title="Esri Satellite Imagery (No API Key)"
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setBasemapMode("topo")}
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium transition-all",
                  basemapMode === "topo" ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                )}
                title="Esri Topographic Contour Terrain (No API Key)"
              >
                Topo
              </button>
            </div>
          </div>

          {/* View Scope Selector */}
          <div className="flex items-center justify-between gap-1.5 border-b border-zinc-800/80 px-1.5 py-1 text-[11px]">
            <span className="text-[10px] text-zinc-400">Filter Scope:</span>
            <div className="flex items-center rounded border border-zinc-800 bg-zinc-900/90 p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setFilterScope("district")}
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium transition-all",
                  filterScope === "district" ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                )}
                title="Show active district & corridor only"
              >
                District
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium transition-all",
                  filterScope === "all" ? "bg-zinc-700 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                )}
                title="Show all India markers and alerts"
              >
                All India
              </button>
            </div>
          </div>

          {/* Primary Quick Toggles */}
          <button
            type="button"
            onClick={() => setRainfallOverlay((v) => !v)}
            title="Toggle live Doppler rainfall radar layer (real weather data)"
            className={cn(
              "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
              rainfallOverlay
                ? "border border-sky-500/40 bg-sky-500/20 text-sky-300 shadow-xs"
                : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
            )}
          >
            <CloudRain className="size-3.5 shrink-0 text-sky-400" />
            <span className="truncate">{t(activeLanguage, "rainfallOverlay")}</span>
            <span className="ml-auto text-[9px] font-mono opacity-75">{rainfallOverlay ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSlopeOverlay((v) => !v)}
            title="Toggle 3D digital elevation relief & terrain slope contours across all terrains"
            className={cn(
              "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
              slopeOverlay
                ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-xs"
                : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
            )}
          >
            <Mountain className="size-3.5 shrink-0 text-amber-400" />
            <span className="truncate">{t(activeLanguage, "slopeOverlay")}</span>
            <span className="ml-auto text-[9px] font-mono opacity-75">{slopeOverlay ? "ON" : "OFF"}</span>
          </button>

          {/* Secondary Toggles (Stations, Incidents, Buffer Zone) */}
          {menuExpanded && (
            <div className="flex flex-col gap-1 border-t border-zinc-800/80 pt-1">
              <button
                type="button"
                onClick={() => setShowStations((v) => !v)}
                title="Toggle Regional Monitoring Station markers"
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
                  showStations
                    ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                <Radio className="size-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">{t(activeLanguage, "showStations")}</span>
                <span className="ml-auto text-[9px] font-mono opacity-75">{showStations ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIncidents((v) => !v)}
                title="Toggle Live Ground Incident markers"
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
                  showIncidents
                    ? "border border-rose-500/40 bg-rose-500/20 text-rose-300"
                    : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                <AlertTriangle className="size-3.5 shrink-0 text-rose-400" />
                <span className="truncate">{t(activeLanguage, "showIncidents")}</span>
                <span className="ml-auto text-[9px] font-mono opacity-75">{showIncidents ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBuffer((v) => !v)}
                title="Toggle Weather Anomaly Influence Radius"
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
                  showBuffer
                    ? "border border-purple-500/40 bg-purple-500/20 text-purple-300"
                    : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                <CircleDot className="size-3.5 shrink-0 text-purple-400" />
                <span className="truncate">{t(activeLanguage, "showBuffer")}</span>
                <span className="ml-auto text-[9px] font-mono opacity-75">{showBuffer ? "ON" : "OFF"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
