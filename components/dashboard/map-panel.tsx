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
  Route,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MapSearchBar } from "@/src/components/MapSearchBar"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"
import { TimelineScrubber } from "./timeline-scrubber"
import { SwipeComparator } from "./swipe-comparator"

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
  const [showTrajectory, setShowTrajectory] = useState(true)
  const [showNonIndiaAlerts, setShowNonIndiaAlerts] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [advancedExpanded, setAdvancedExpanded] = useState(false)
  const { activeLanguage, filterScope, setFilterScope, selectedRegion, flyToken, resetToIndiaView } = useDisaster()

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#1A1918]">
      <div className="relative flex-1 overflow-hidden">
        {/* Real Dynamic GIS Risk Map with Real Tile Layers and Filterable Layers */}
        <RiskMap
          basemapMode={basemapMode}
          showRainfallRadar={rainfallOverlay}
          showSlopeGradient={slopeOverlay}
          showStations={showStations}
          showIncidents={showIncidents}
          showBuffer={showBuffer}
          showTrajectory={showTrajectory}
          showNonIndiaAlerts={showNonIndiaAlerts}
        />

        {/* 12km vs 5km Before/After Swipe Comparator Over Selected Anomaly */}
        <SwipeComparator />

        {/* Floating Active Region Info Pill (Clean & minimal, bottom-left) */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#211F1E]/95 px-3.5 py-1 text-xs text-[#ECEAE6] shadow-lg backdrop-blur">
            <MapPin className="size-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium truncate max-w-[150px] sm:max-w-[240px]">
              {flyToken > 0
                ? (filterScope === "district" ? (selectedRegion.district || selectedRegion.city || selectedRegion.name) : "Pan-India")
                : "National Overview"}
            </span>
            {flyToken > 0 && filterScope === "district" && (
              <span className="text-xs text-[#948E85] font-mono">160km</span>
            )}
            {rainfallOverlay && (
              <span className="ml-1 flex items-center gap-1.5 border-l border-white/[0.08] pl-2 text-xs text-sky-400 font-medium">
                <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="hidden sm:inline">Doppler active</span>
              </span>
            )}
          </div>
        </div>

        {/* Interactive Map Legend Card */}
        {showLegend && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-[500] max-w-xs rounded-lg border border-white/[0.08] bg-[#211F1E]/95 p-3.5 text-xs shadow-2xl backdrop-blur animate-in fade-in duration-150">
            <div className="mb-2 flex items-center justify-between border-b border-white/[0.08] pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#ECEAE6]">
                <Info className="size-3.5 text-emerald-400" />
                <span>{t(activeLanguage, "mapLegend")}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="text-xs text-[#A8A29A] hover:text-[#ECEAE6]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#A8A29A]">
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-red-500 shadow-[0_0_6px_#ef4444]" />
                </span>
                <span className="text-[#ECEAE6]">Critical / severe EFI anomaly node</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
                </span>
                <span className="text-[#ECEAE6]">Moderate synoptic perturbation station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                </span>
                <span className="text-[#ECEAE6]">Synoptically stable baseline station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center rounded bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white shadow">
                  Alert
                </span>
                <span className="text-[#ECEAE6]">Live tracked 4D event</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-4 items-center justify-center rounded-full border border-white bg-red-600 text-xs font-bold text-white shadow">
                  !
                </span>
                <span className="text-[#ECEAE6]">GNN anomaly influence core (30–60km)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-mono text-xs font-medium text-indigo-300 border border-indigo-500/40 rounded px-1.5 bg-indigo-950/40">
                  <span className="size-1.5 rounded-full bg-indigo-400" /> T+0 → T+120h
                </span>
                <span className="text-[#ECEAE6]">4D GNN trajectory path</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-3.5 items-center justify-center rounded border border-purple-400/80 bg-purple-500/30">
                  <span className="size-1.5 bg-purple-400/70" />
                </span>
                <span className="text-[#ECEAE6]">5km Diffusion-downscaled subgrid cell</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center rounded bg-indigo-600/30 border border-indigo-500/50 px-1.5 py-0.5 text-xs font-mono font-medium text-indigo-300">
                  EFI
                </span>
                <span className="text-[#ECEAE6]">EFI threshold boundary (&gt;2σ)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mountain className="size-3.5 text-amber-400 shrink-0" />
                <span className="text-[#ECEAE6]">3D Topographic elevation relief</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Top Controls Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-2 p-2 sm:p-3">
        {/* Left: Search Bar + India Reset Button */}
        <div className="pointer-events-auto flex min-w-0 max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md flex-1 items-center gap-1.5">
          <MapSearchBar />
          <button
            type="button"
            onClick={resetToIndiaView}
            title="Reset to Full India View"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#211F1E] text-[#ECEAE6] shadow-lg backdrop-blur transition-all hover:bg-[#2A2725] active:scale-95"
          >
            <Globe className="size-3.5 text-sky-400" />
          </button>
        </div>

        {/* Right: Map Layers Popover & Quick Controls */}
        <div className="pointer-events-auto relative shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLayersOpen((v) => !v)}
              title="Toggle Map Layers & Overlays"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-all active:scale-95",
                layersOpen
                  ? "border-sky-500 bg-sky-950/80 text-sky-300"
                  : "border-white/[0.08] bg-[#211F1E] text-[#ECEAE6] hover:bg-[#2A2725]"
              )}
            >
              <Layers className="size-3.5 text-sky-400" />
              <span>Layers</span>
              {(rainfallOverlay || slopeOverlay) && (
                <span className="size-1.5 rounded-full bg-emerald-400" />
              )}
              {layersOpen ? <ChevronUp className="size-3 text-[#A8A29A]" /> : <ChevronDown className="size-3 text-[#A8A29A]" />}
            </button>

            <button
              type="button"
              onClick={() => setShowLegend((v) => !v)}
              title="Toggle Map Legend"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-all active:scale-95",
                showLegend
                  ? "border-emerald-500/50 bg-emerald-950/70 text-emerald-300"
                  : "border-white/[0.08] bg-[#211F1E] text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6]"
              )}
            >
              <Info className="size-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Legend</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop when Map Configuration Drawer is open */}
      {layersOpen && (
        <div
          className="absolute inset-0 z-[501] bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setLayersOpen(false)}
        />
      )}

      {/* Collapsible Right Drawer for Map Configuration */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 z-[502] w-72 sm:w-80 bg-[#211F1E]/98 border-l border-white/[0.08] shadow-2xl backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out text-[#ECEAE6]",
          layersOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-[#1A1918]/60">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-sky-400" />
            <div>
              <span className="text-xs font-semibold text-[#ECEAE6]">Map configuration</span>
              <p className="text-xs text-[#948E85]">GIS overlays & filter controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLayersOpen(false)}
            className="rounded p-1 text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Basemap Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#A8A29A]">Basemap style</label>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/[0.08] bg-[#2A2725]/60 p-1">
              <button
                type="button"
                onClick={() => setBasemapMode("dark")}
                className={cn(
                  "rounded py-1 text-xs font-medium transition-all text-center",
                  basemapMode === "dark" ? "bg-emerald-700/80 text-white shadow-xs font-semibold" : "text-[#A8A29A] hover:text-[#ECEAE6]"
                )}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setBasemapMode("satellite")}
                className={cn(
                  "rounded py-1 text-xs font-medium transition-all text-center",
                  basemapMode === "satellite" ? "bg-emerald-700/80 text-white shadow-xs font-semibold" : "text-[#A8A29A] hover:text-[#ECEAE6]"
                )}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setBasemapMode("topo")}
                className={cn(
                  "rounded py-1 text-xs font-medium transition-all text-center",
                  basemapMode === "topo" ? "bg-emerald-700/80 text-white shadow-xs font-semibold" : "text-[#A8A29A] hover:text-[#ECEAE6]"
                )}
              >
                Topo
              </button>
            </div>
          </div>

          {/* View Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#A8A29A]">View / filter scope</label>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/[0.08] bg-[#2A2725]/60 p-1">
              <button
                type="button"
                onClick={() => setFilterScope("district")}
                className={cn(
                  "rounded py-1 text-xs font-medium transition-all text-center",
                  filterScope === "district" ? "bg-emerald-700/80 text-white shadow-xs font-semibold" : "text-[#A8A29A] hover:text-[#ECEAE6]"
                )}
              >
                District focus
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                className={cn(
                  "rounded py-1 text-xs font-medium transition-all text-center",
                  filterScope === "all" ? "bg-[#34302C] text-white shadow-xs font-semibold" : "text-[#A8A29A] hover:text-[#ECEAE6]"
                )}
              >
                All-India scope
              </button>
            </div>
          </div>

          {/* Alert Markers & Non-India Toggle */}
          <div className="rounded-lg border border-white/[0.08] bg-[#2A2725]/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#ECEAE6]">Alert markers & clustering</span>
              <span className="text-xs font-mono text-[#948E85]">Cluster</span>
            </div>

            <button
              type="button"
              onClick={() => setShowIncidents((v) => !v)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                showIncidents
                  ? "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                  : "border border-transparent text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6]"
              )}
            >
              <AlertTriangle className="size-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{t(activeLanguage, "showIncidents")}</span>
              <span className="ml-auto text-xs font-mono opacity-75">{showIncidents ? "ON" : "OFF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNonIndiaAlerts((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all border",
                showNonIndiaAlerts
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                  : "border-white/[0.08] bg-[#211F1E] text-[#A8A29A] hover:text-[#ECEAE6]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="size-3.5 shrink-0 text-sky-400" />
                <span className="truncate">Show non-India alerts</span>
              </div>
              <span className="ml-2 font-mono text-xs font-medium shrink-0">
                {showNonIndiaAlerts ? "ON" : "OFF"}
              </span>
            </button>
            <p className="text-xs text-[#948E85] leading-relaxed">
              {showNonIndiaAlerts
                ? "Displaying all global/equatorial alerts."
                : "Non-India alerts hidden by default (bounded to Indian subcontinent [6.5°–37.5°N, 68°–97.5°E])."}
            </p>
          </div>

          {/* Meteorological GIS Overlays */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#A8A29A]">Meteorological overlays</label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setRainfallOverlay((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                  rainfallOverlay
                    ? "border border-sky-500/40 bg-sky-500/15 text-sky-300"
                    : "border border-transparent text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6]"
                )}
              >
                <CloudRain className="size-3.5 shrink-0 text-sky-400" />
                <span className="truncate">{t(activeLanguage, "rainfallOverlay")}</span>
                <span className="ml-auto text-xs font-mono opacity-75">{rainfallOverlay ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSlopeOverlay((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                  slopeOverlay
                    ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                    : "border border-transparent text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6]"
                )}
              >
                <Mountain className="size-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{t(activeLanguage, "slopeOverlay")}</span>
                <span className="ml-auto text-xs font-mono opacity-75">{slopeOverlay ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBuffer((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                  showBuffer
                    ? "border border-purple-500/40 bg-purple-500/15 text-purple-300"
                    : "border border-transparent text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6]"
                )}
              >
                <CircleDot className="size-3.5 shrink-0 text-purple-400" />
                <span className="truncate">5km Downscaled subgrid</span>
                <span className="ml-auto text-xs font-mono opacity-75">{showBuffer ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTrajectory((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                  showTrajectory
                    ? "border border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                    : "border border-transparent text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6]"
                )}
              >
                <Route className="size-3.5 shrink-0 text-indigo-400" />
                <span className="truncate">4D GNN trajectory (3–5 Day)</span>
                <span className="ml-auto text-xs font-mono opacity-75">{showTrajectory ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStations((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                  showStations
                    ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border border-transparent text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6]"
                )}
              >
                <Radio className="size-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">{t(activeLanguage, "showStations")}</span>
                <span className="ml-auto text-xs font-mono opacity-75">{showStations ? "ON" : "OFF"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Docked 4D Forecast Timeline Scrubber */}
      <TimelineScrubber />
    </div>
  )
}
