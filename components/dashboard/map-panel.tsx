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
  const [rainfallOverlay, setRainfallOverlay] = useState(true)
  const [slopeOverlay, setSlopeOverlay] = useState(false)
  const [showStations, setShowStations] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showBuffer, setShowBuffer] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [menuExpanded, setMenuExpanded] = useState(false)
  const { activeLanguage } = useDisaster()

  return (
    <div className="relative flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="relative flex-1 overflow-hidden">
        {/* Real Dynamic GIS Risk Map with Real Tile Layers and Filterable Layers */}
        <RiskMap
          showRainfallRadar={rainfallOverlay}
          showSlopeGradient={slopeOverlay}
          showStations={showStations}
          showIncidents={showIncidents}
          showBuffer={showBuffer}
        />

        {/* Floating Active Layer Information Badges */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex flex-col gap-1.5 text-xs">
          {rainfallOverlay && (
            <div className="flex items-center gap-2 rounded-md border border-sky-500/40 bg-zinc-950/90 px-2.5 py-1 text-[11px] text-sky-300 shadow-md backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
              </span>
              <span className="font-semibold">Live Doppler Rain Radar</span>
              <span className="text-[10px] text-zinc-400 font-mono">| RainViewer GIS</span>
            </div>
          )}
          {slopeOverlay && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 text-[11px] text-amber-300 shadow-md backdrop-blur">
              <Mountain className="size-3 text-amber-400" />
              <span className="font-semibold">DEM Topo Elevation & Contours</span>
              <span className="text-[10px] text-zinc-400 font-mono">| OpenTopoMap</span>
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
                <span>Critical / Severe Monitoring Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
                </span>
                <span>Moderate Risk Monitoring Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex size-3 items-center justify-center">
                  <span className="size-2.5 rounded-full border border-white bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                </span>
                <span>Low Risk / Baseline Safe Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center rounded bg-rose-600 px-1 py-0.5 text-[9px] font-bold text-white shadow">
                  ⚠️ ALERT
                </span>
                <span>Live Ground Incident (Slip / Road Block)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-3.5 items-center justify-center rounded-full border border-white bg-red-600 text-[9px] font-bold text-white shadow">
                  !
                </span>
                <span>Active Epicenter & Dynamic Buffer Ring</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Controls Bar: Search & Layer Toggles */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex flex-wrap items-start justify-between gap-2 p-3">
        <MapSearchBar />

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
                className="text-zinc-400 hover:text-zinc-200 p-0.5"
                title="Expand/Collapse options"
              >
                {menuExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
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
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent",
            )}
          >
            <CloudRain className="size-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{t(activeLanguage, "rainfallOverlay")}</span>
            <span className="ml-auto text-[9px] font-mono opacity-75">{rainfallOverlay ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSlopeOverlay((v) => !v)}
            title="Toggle digital elevation hillshade & mountain slope contours"
            className={cn(
              "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
              slopeOverlay
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent",
            )}
          >
            <Mountain className="size-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{t(activeLanguage, "slopeOverlay")}</span>
            <span className="ml-auto text-[9px] font-mono opacity-75">{slopeOverlay ? "ON" : "OFF"}</span>
          </button>

          {/* Secondary Toggles (Stations, Incidents, Buffer Zone) */}
          {menuExpanded && (
            <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setShowStations((v) => !v)}
                title="Toggle Regional Monitoring Station markers"
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
                  showStations
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent",
                )}
              >
                <Radio className="size-3.5 text-emerald-400 shrink-0" />
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
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent",
                )}
              >
                <AlertTriangle className="size-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{t(activeLanguage, "showIncidents")}</span>
                <span className="ml-auto text-[9px] font-mono opacity-75">{showIncidents ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBuffer((v) => !v)}
                title="Toggle Target Epicenter and Vulnerability Buffer Ring"
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium transition-all",
                  showBuffer
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent",
                )}
              >
                <CircleDot className="size-3.5 text-purple-400 shrink-0" />
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
