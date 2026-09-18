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
  X,
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
  const [layersOpen, setLayersOpen] = useState(false)
  const [advancedExpanded, setAdvancedExpanded] = useState(false)
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

        {/* Floating Active Region Info Pill (Clean & minimal, bottom-left) */}
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-[500] flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-zinc-950/90 px-3 py-1 text-[11px] text-emerald-300 shadow-lg backdrop-blur">
            <MapPin className="size-3 text-emerald-400 shrink-0" />
            <span className="font-semibold truncate max-w-[150px] sm:max-w-[240px]">
              {flyToken > 0
                ? (filterScope === "district" ? (selectedRegion.district || selectedRegion.city || selectedRegion.name) : "Pan-India")
                : "National Overview"}
            </span>
            {flyToken > 0 && filterScope === "district" && (
              <span className="text-[10px] text-zinc-400 font-mono">160km</span>
            )}
            {rainfallOverlay && (
              <span className="ml-1 flex items-center gap-1 border-l border-zinc-800 pl-1.5 text-[10px] text-sky-400 font-medium">
                <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="hidden sm:inline">Doppler Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Interactive Map Legend Card */}
        {showLegend && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-[500] max-w-xs rounded-lg border border-zinc-700/90 bg-zinc-950/95 p-3 text-xs shadow-2xl backdrop-blur animate-in fade-in duration-150">
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

      {/* Unified Top Controls Bar — cleanly positioned, never overlapping */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-2 p-2 sm:p-3">
        {/* Left: Search Bar + India Reset Button */}
        <div className="pointer-events-auto flex min-w-0 max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md flex-1 items-center gap-1.5">
          <MapSearchBar />
          <button
            type="button"
            onClick={resetToIndiaView}
            title="Reset to Full India View"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-950/90 text-zinc-300 shadow-lg backdrop-blur transition-all hover:border-sky-500/50 hover:bg-zinc-900 hover:text-white active:scale-95"
          >
            <Globe className="size-3.5 text-sky-400" />
          </button>
        </div>

        {/* Right: Map Layers Popover & Quick Controls */}
        <div className="pointer-events-auto relative shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLayersOpen((v) => !v)}
              title="Toggle Map Layers & Overlays"
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur transition-all active:scale-95",
                layersOpen
                  ? "border-sky-500 bg-sky-950/80 text-sky-300"
                  : "border-zinc-700/80 bg-zinc-950/90 text-zinc-300 hover:border-zinc-600 hover:text-white"
              )}
            >
              <Layers className="size-3.5 text-sky-400" />
              <span className="text-[11px]">Layers</span>
              {(rainfallOverlay || slopeOverlay) && (
                <span className="size-1.5 rounded-full bg-emerald-400" />
              )}
              {layersOpen ? <ChevronUp className="size-3 text-zinc-400" /> : <ChevronDown className="size-3 text-zinc-400" />}
            </button>

            <button
              type="button"
              onClick={() => setShowLegend((v) => !v)}
              title="Toggle Map Legend"
              className={cn(
                "flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-all active:scale-95",
                showLegend
                  ? "border-emerald-500/50 bg-emerald-950/70 text-emerald-300"
                  : "border-zinc-700/80 bg-zinc-950/90 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Info className="size-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">Legend</span>
            </button>
          </div>

          {/* Floating Layers Dropdown Menu */}
          {layersOpen && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-[501]"
                onClick={() => setLayersOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-[502] w-64 rounded-lg border border-zinc-700/80 bg-zinc-950/95 p-2.5 text-xs shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-200">
                  <Layers className="size-3.5 text-sky-400" />
                  <span>Map Configuration</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLayersOpen(false)}
                  className="rounded p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Basemap Mode Selector */}
              <div className="mb-2 flex items-center justify-between gap-1.5 border-b border-zinc-800/80 pb-2 text-[11px]">
                <span className="text-[10px] text-zinc-400">Basemap:</span>
                <div className="flex items-center rounded border border-zinc-800 bg-zinc-900/90 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setBasemapMode("dark")}
                    className={cn(
                      "rounded px-1.5 py-0.5 font-medium transition-all",
                      basemapMode === "dark" ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                    )}
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
                  >
                    Topo
                  </button>
                </div>
              </div>

              {/* View Scope Selector */}
              <div className="mb-2 flex items-center justify-between gap-1.5 border-b border-zinc-800/80 pb-2 text-[11px]">
                <span className="text-[10px] text-zinc-400">Filter Scope:</span>
                <div className="flex items-center rounded border border-zinc-800 bg-zinc-900/90 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setFilterScope("district")}
                    className={cn(
                      "rounded px-1.5 py-0.5 font-medium transition-all",
                      filterScope === "district" ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                    )}
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
                  >
                    All India
                  </button>
                </div>
              </div>

              {/* Primary Overlays */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setRainfallOverlay((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium transition-all",
                    rainfallOverlay
                      ? "border border-sky-500/40 bg-sky-500/15 text-sky-300"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <CloudRain className="size-3.5 shrink-0 text-sky-400" />
                  <span className="truncate">{t(activeLanguage, "rainfallOverlay")}</span>
                  <span className="ml-auto text-[9px] font-mono opacity-75">{rainfallOverlay ? "ON" : "OFF"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSlopeOverlay((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium transition-all",
                    slopeOverlay
                      ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <Mountain className="size-3.5 shrink-0 text-amber-400" />
                  <span className="truncate">{t(activeLanguage, "slopeOverlay")}</span>
                  <span className="ml-auto text-[9px] font-mono opacity-75">{slopeOverlay ? "ON" : "OFF"}</span>
                </button>
              </div>

              {/* Advanced Layers Toggle */}
              <div className="mt-2 border-t border-zinc-800/80 pt-1.5">
                <button
                  type="button"
                  onClick={() => setAdvancedExpanded((v) => !v)}
                  className="flex w-full items-center justify-between py-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-200"
                >
                  <span>More Feature Layers</span>
                  {advancedExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>

                {advancedExpanded && (
                  <div className="space-y-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowStations((v) => !v)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] font-medium transition-all",
                        showStations
                          ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                          : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      <Radio className="size-3 shrink-0 text-emerald-400" />
                      <span className="truncate">{t(activeLanguage, "showStations")}</span>
                      <span className="ml-auto text-[9px] font-mono opacity-75">{showStations ? "ON" : "OFF"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowIncidents((v) => !v)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] font-medium transition-all",
                        showIncidents
                          ? "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                          : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      <AlertTriangle className="size-3 shrink-0 text-rose-400" />
                      <span className="truncate">{t(activeLanguage, "showIncidents")}</span>
                      <span className="ml-auto text-[9px] font-mono opacity-75">{showIncidents ? "ON" : "OFF"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBuffer((v) => !v)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] font-medium transition-all",
                        showBuffer
                          ? "border border-purple-500/40 bg-purple-500/15 text-purple-300"
                          : "border border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      <CircleDot className="size-3 shrink-0 text-purple-400" />
                      <span className="truncate">{t(activeLanguage, "showBuffer")}</span>
                      <span className="ml-auto text-[9px] font-mono opacity-75">{showBuffer ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
