"use client"

import { useState, useMemo } from "react"
import {
  AlertTriangle,
  TriangleAlert,
  Construction,
  ClipboardList,
  CloudRain,
  Radio,
  X,
  ChevronRight,
  Compass,
  Wind,
  Droplets,
  MountainSnow,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NER_REGIONS, SEVERITY_LABEL, localize } from "@/src/data/ner-regions"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"
import { AreaDetailsModal } from "@/src/components/AreaDetailsModal"
import { isLocationInSector } from "@/src/lib/risk"

const LEVEL_TONE = {
  Critical: "border-red-500/60 bg-red-950/20",
  Severe: "border-orange-500/60 bg-orange-950/20",
  Moderate: "border-amber-400/60 bg-amber-950/20",
  Low: "border-emerald-500/60 bg-emerald-950/20",
}

export function DashboardSidebar() {
  const {
    selectedRegion,
    selectRegion,
    resetToDefaultRegion,
    visibleIncidents,
    offlineQueue,
    activeLanguage,
    liveWeather,
    pushNotice,
    selectCustomLocation,
    filterScope,
    setFilterScope,
    flyToken,
    resetToIndiaView,
  } = useDisaster()

  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false)
  const [showCriticalList, setShowCriticalList] = useState(false)

  const isNationalOverview = flyToken <= 0

  // Filter stations & incidents to current district/sector or all India
  const scopedStations = useMemo(() => {
    if (filterScope === "all") return NER_REGIONS
    return NER_REGIONS.filter((r) =>
      isLocationInSector(
        r.coords[0],
        r.coords[1],
        r.district,
        r.state,
        selectedRegion.coords,
        selectedRegion.district,
        selectedRegion.state,
      ),
    )
  }, [filterScope, selectedRegion])

  const scopedCriticalRegions = useMemo(() => {
    return scopedStations.filter((r) => {
      const severity = r.id === selectedRegion.id ? selectedRegion.severity : r.severity
      return severity === "Critical" || severity === "Severe"
    })
  }, [scopedStations, selectedRegion])

  const totalCriticalCount = useMemo(() => {
    const inList = scopedCriticalRegions.some((r) => r.id === selectedRegion.id)
    if (!inList && (selectedRegion.severity === "Critical" || selectedRegion.severity === "Severe")) {
      return scopedCriticalRegions.length + 1
    }
    return scopedCriticalRegions.length
  }, [scopedCriticalRegions, selectedRegion])

  const scopedIncidents = useMemo(() => {
    if (filterScope === "all") return visibleIncidents
    return visibleIncidents.filter((i) =>
      isLocationInSector(
        i.lat,
        i.lon,
        undefined,
        undefined,
        selectedRegion.coords,
        selectedRegion.district,
        selectedRegion.state,
      ),
    )
  }, [filterScope, visibleIncidents, selectedRegion])

  const scopedBlockedIncidents = useMemo(
    () => scopedIncidents.filter((i) => i.type === "Road Blockage"),
    [scopedIncidents],
  )
  const pending = offlineQueue.length

  const handleBlockedHighwaysClick = () => {
    if (scopedBlockedIncidents.length > 0) {
      const first = scopedBlockedIncidents[0]
      selectCustomLocation(first.locationLabel, first.lat, first.lon)
      pushNotice("warning", `Focused on blocked corridor: ${first.locationLabel}`)
    } else {
      pushNotice("info", `No blocked highways reported in ${selectedRegion.district || selectedRegion.city || "this sector"}.`)
    }
  }

  return (
    <>
      <aside className="flex h-full w-full flex-col gap-3.5 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-3.5 pb-4 text-zinc-100 select-none">
        
        {/* Active Focus Area Card / National Command Hub */}
        <div className="shrink-0">
          {isNationalOverview ? (
            <Card className="group relative overflow-hidden border-2 border-emerald-500/40 bg-zinc-950 transition-all hover:border-emerald-500/70 shadow-lg">
              {/* Satellite / Earth Command Banner */}
              <div className="relative h-28 w-full overflow-hidden bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
                  alt="National Synoptic Command"
                  className="size-full object-cover brightness-[0.70] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="border-emerald-500/60 bg-black/60 text-[10px] font-mono font-bold text-emerald-400">
                    PAN-INDIA GRID
                  </Badge>
                </div>

                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-sm sm:text-base font-bold text-white drop-shadow-md leading-snug">
                    National Synoptic Command
                  </p>
                  <p className="truncate text-[11px] text-zinc-300 drop-shadow">
                    MoES PS 26078 • Medium-Range Climatology
                  </p>
                </div>
              </div>

              {/* Command Summary & Key Metrics */}
              <CardContent className="flex flex-col gap-2.5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">Monitoring Scope</span>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[11px] font-semibold">
                    All 28 States & UTs
                  </Badge>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-zinc-400">Districts Covered</p>
                    <p className="font-bold text-zinc-100 font-mono">{NER_REGIONS.length}+</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400">Active Alerts</p>
                    <p className="font-bold text-red-400 font-mono">{visibleIncidents.filter(i => i.severity === "Critical").length} Critical</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400">NWP Model</p>
                    <p className="font-bold text-emerald-400 font-mono">NCMRWF 12Z</p>
                  </div>
                </div>

                {/* Quick-Focus Anomaly Hubs Chips */}
                <div className="space-y-1.5 pt-0.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Target Extreme Weather Hubs:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {NER_REGIONS.slice(0, 4).map((hub) => (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => {
                          selectRegion(hub)
                          pushNotice("warning", `Focused on ${hub.name}`)
                        }}
                        className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[11px] text-left text-zinc-300 hover:border-emerald-500/60 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <span className="truncate">{hub.city || hub.name.split(" ")[0]}</span>
                        <span className={cn("size-1.5 rounded-full shrink-0", hub.severity === "Critical" ? "bg-red-400" : "bg-amber-400")} />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card
              className={cn(
                "group relative overflow-hidden border-2 transition-all hover:shadow-xl",
                LEVEL_TONE[selectedRegion.severity]
              )}
            >
              {/* Visual Landscape Banner */}
              <div className="relative h-28 w-full overflow-hidden bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    selectedRegion.state.toLowerCase().includes("himachal") || selectedRegion.name.toLowerCase().includes("shimla") || selectedRegion.name.toLowerCase().includes("manali")
                      ? "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80"
                      : selectedRegion.state.toLowerCase().includes("uttarakhand") || selectedRegion.name.toLowerCase().includes("joshimath") || selectedRegion.name.toLowerCase().includes("kedarnath")
                        ? "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=600&q=80"
                        : selectedRegion.state.toLowerCase().includes("kerala") || selectedRegion.name.toLowerCase().includes("wayanad")
                          ? "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80"
                          : selectedRegion.state.toLowerCase().includes("maharashtra") || selectedRegion.name.toLowerCase().includes("raigad")
                            ? "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"
                            : selectedRegion.name.toLowerCase().includes("srinagar") || selectedRegion.state.toLowerCase().includes("kashmir") || selectedRegion.state.toLowerCase().includes("ladakh")
                              ? "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=600&q=80"
                              : selectedRegion.id.includes("shillong") || selectedRegion.id.includes("khasi")
                                ? "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
                                : selectedRegion.id.includes("sikkim") || selectedRegion.id.includes("mangan")
                                  ? "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"
                                  : "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={selectedRegion.name}
                  className="size-full object-cover brightness-[0.70] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Reset to National View Button */}
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 rounded-full bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetToIndiaView()
                    }}
                    title="Return to National Overview"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>

                {/* Location Name & ASL badge */}
                <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-white drop-shadow-md line-clamp-2 leading-snug">
                      {selectedRegion.name}
                    </p>
                    <p className="truncate text-[11px] text-zinc-300 drop-shadow">
                      {selectedRegion.state}
                    </p>
                  </div>
                  <span className="shrink-0 rounded border border-emerald-500/40 bg-zinc-950/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                    {selectedRegion.elevation}m ASL
                  </span>
                </div>
              </div>

              {/* Telemetry Summary & Trigger */}
              <CardContent className="flex flex-col gap-2.5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">{selectedRegion.city} Sector</span>
                  <Badge
                    variant={selectedRegion.severity === "Low" ? "outline" : "destructive"}
                    className="text-[11px] font-semibold"
                  >
                    {localize(SEVERITY_LABEL[selectedRegion.severity], activeLanguage)}
                  </Badge>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-zinc-400">Temp Δ</p>
                    <p className="font-bold text-zinc-100 font-mono">
                      {(selectedRegion.tempDelta ?? 2.5) > 0 ? `+${selectedRegion.tempDelta ?? 2.5}` : selectedRegion.tempDelta ?? 2.5}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400">Precip Rate</p>
                    <p className="font-bold text-zinc-100 font-mono">{selectedRegion.precipRate ?? 35} mm/h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400">Z500 Anomaly</p>
                    <p className="font-bold text-zinc-100 font-mono">{selectedRegion.z500 ?? 5650} gpm</p>
                  </div>
                </div>

                {/* Inspect Area Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAreaModalOpen(true)}
                  className="w-full bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs h-8 shadow-sm"
                >
                  <Compass className="size-3.5 mr-1.5" />
                  Inspect Synoptic Core & Shelters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Regional Status: Compact 2x2 Grid with District/All-India Scope Selector */}
        <div className="shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                Synoptic Anomaly Overview
              </h2>
              <span className="text-[10px] text-emerald-400 font-medium truncate">
                📍 {filterScope === "district" ? (selectedRegion.district || selectedRegion.city || selectedRegion.name) : "Pan-India"}
              </span>
            </div>

            <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5 text-[10px] shrink-0">
              <button
                type="button"
                onClick={() => setFilterScope("district")}
                className={cn(
                  "rounded px-2 py-0.5 font-semibold transition-all",
                  filterScope === "district"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
                title="Show only active district & 160km synoptic corridor metrics"
              >
                District
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                className={cn(
                  "rounded px-2 py-0.5 font-semibold transition-all",
                  filterScope === "all"
                    ? "bg-zinc-700 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
                title="Show all India aggregate metrics"
              >
                All India
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Critical Anomaly Hubs */}
            <div
              onClick={() => setShowCriticalList((v) => !v)}
              className={cn(
                "cursor-pointer rounded-lg border border-zinc-800/90 bg-zinc-900/50 p-2.5 transition-all hover:border-red-500/60 hover:bg-zinc-900",
                showCriticalList && "border-red-500/80 bg-red-950/30"
              )}
              title="Click to view critical anomaly hubs"
            >
              <div className="flex items-center justify-between">
                <TriangleAlert className="size-4 text-red-400" />
                <Badge variant="destructive" className="h-5 px-1.5 text-xs font-bold">
                  {totalCriticalCount}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-zinc-300">Anomaly Hubs</p>
            </div>

            {/* Storm Corridors */}
            <div
              onClick={handleBlockedHighwaysClick}
              className="cursor-pointer rounded-lg border border-zinc-800/90 bg-zinc-900/50 p-2.5 transition-all hover:border-amber-500/60 hover:bg-zinc-900"
              title="Click to focus storm corridor on map"
            >
              <div className="flex items-center justify-between">
                <Construction className="size-4 text-amber-400" />
                <Badge
                  variant={scopedBlockedIncidents.length > 0 ? "secondary" : "outline"}
                  className={cn(
                    "h-5 px-1.5 text-xs font-bold",
                    scopedBlockedIncidents.length > 0
                      ? "bg-amber-500/20 text-amber-300"
                      : "border-zinc-700 text-zinc-400"
                  )}
                >
                  {scopedBlockedIncidents.length}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-zinc-300">Storm Corridors</p>
            </div>

            {/* Live Synoptic Events */}
            <div
              onClick={() => {
                if (scopedIncidents.length > 0) {
                  const inc = scopedIncidents[0]
                  selectCustomLocation(inc.locationLabel, inc.lat, inc.lon)
                  pushNotice("info", `Centered on event: ${inc.locationLabel}`)
                } else {
                  pushNotice("info", `No active synoptic events reported in ${selectedRegion.district || selectedRegion.city || "this sector"}.`)
                }
              }}
              className="cursor-pointer rounded-lg border border-zinc-800/90 bg-zinc-900/50 p-2.5 transition-all hover:border-emerald-500/60 hover:bg-zinc-900"
              title="Click to center on synoptic event"
            >
              <div className="flex items-center justify-between">
                <Radio className="size-4 text-emerald-400" />
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 px-1.5 text-xs font-bold",
                    scopedIncidents.length > 0
                      ? "border-emerald-500/40 text-emerald-400"
                      : "border-zinc-700 text-zinc-400"
                  )}
                >
                  {scopedIncidents.length}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-zinc-300">Synoptic Events</p>
            </div>

            {/* Queued Reports */}
            <div
              onClick={() => pushNotice("info", `${pending} field anomaly reports cached offline in IndexedDB.`)}
              className="cursor-pointer rounded-lg border border-zinc-800/90 bg-zinc-900/50 p-2.5 transition-all hover:border-sky-500/60 hover:bg-zinc-900"
              title="Offline queue status"
            >
              <div className="flex items-center justify-between">
                <ClipboardList className="size-4 text-sky-400" />
                <Badge variant="secondary" className="h-5 px-1.5 text-xs font-bold bg-sky-500/20 text-sky-300">
                  {pending}
                </Badge>
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-zinc-300">Offline Queue</p>
            </div>
          </div>

          {/* Expandable Critical Zones Submenu */}
          {showCriticalList && (
            <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-red-500/30 bg-zinc-950 p-2 text-xs animate-in fade-in-50 duration-150">
              <p className="text-[10px] uppercase font-bold text-zinc-400 px-1">
                Critical Sectors ({filterScope === "district" ? (selectedRegion.district || selectedRegion.city || selectedRegion.name) : "All India"}):
              </p>
              {scopedCriticalRegions.length === 0 ? (
                <p className="px-2 py-1.5 text-zinc-500 text-[11px]">No critical sectors in this district.</p>
              ) : (
                scopedCriticalRegions.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => {
                      selectRegion(region)
                      setShowCriticalList(false)
                      pushNotice("warning", `Navigated to ${region.name} (${region.severity})`)
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <span className="font-medium truncate">{region.name}</span>
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                      {region.severity}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Live Weather & Elevation Telemetry (Shrink-0, Never Squashed) */}
        {liveWeather && (
          <div className="shrink-0">
            <Card
              onClick={() => setIsAreaModalOpen(true)}
              className="cursor-pointer border-sky-500/40 bg-sky-950/20 shadow-sm transition-all hover:border-sky-400 hover:bg-sky-950/30"
              title="Click to view detailed weather breakdown"
            >
              <CardHeader className="pb-1 pt-2 px-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-1.5 text-[11px] text-sky-400 font-semibold uppercase tracking-wider">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
                  </span>
                  {isNationalOverview ? "Reference Station Telemetry" : "Live Weather Telemetry"}
                </CardTitle>
                <Badge variant="outline" className="border-sky-500/40 text-[9px] text-sky-300 font-mono py-0">
                  Open-Meteo
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 p-3 pt-0 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-white tabular-nums">
                      {liveWeather.temperature}°C
                    </p>
                    <p className="text-[11px] text-sky-200 font-medium">
                      {liveWeather.weatherLabel} {isNationalOverview && `• ${selectedRegion.city}`}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5 text-[11px] text-zinc-400">
                    <div>24h Rain: <span className="font-semibold text-zinc-100">{liveWeather.rain24h} mm</span></div>
                    <div>Humidity: <span className="font-semibold text-zinc-100">{liveWeather.humidity}%</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* IMD / Hazard Advisory Card (Shrink-0) */}
        <div className="shrink-0">
          <Card
            onClick={() => setIsAreaModalOpen(true)}
            className="cursor-pointer border-amber-500/30 bg-amber-950/20 transition-all hover:border-amber-500/60"
            title="Click to view emergency advisory instructions"
          >
            <CardHeader className="pb-1 pt-2 px-3">
              <CardTitle className="flex items-center justify-between text-xs text-amber-400">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CloudRain className="size-3.5" />
                  {t(activeLanguage, "imdAlert")}
                </span>
                <span className="text-[10px] text-amber-300 underline">Inspect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-3 pt-0 text-xs">
              <p className="line-clamp-2 text-[11px] leading-snug text-amber-100/90">
                {localize(selectedRegion.advice, activeLanguage)}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400 pt-0.5">
                <AlertTriangle className="size-3 shrink-0" />
                <span className="truncate">{localize(selectedRegion.status, activeLanguage)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hazard Legend (Shrink-0, Clean and Compact) */}
        <div className="shrink-0">
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader className="pb-1 pt-2 px-3">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {t(activeLanguage, "legend")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-3 pt-0 text-[11px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-red-500" />
                  <span className="text-zinc-300">{localize(SEVERITY_LABEL.Critical, activeLanguage)}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">&ge; 75% Risk</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-orange-500" />
                  <span className="text-zinc-300">{localize(SEVERITY_LABEL.Severe, activeLanguage)}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">55 - 74%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-zinc-300">{localize(SEVERITY_LABEL.Moderate, activeLanguage)}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">35 - 54%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-zinc-300">{localize(SEVERITY_LABEL.Low, activeLanguage)}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">&lt; 35%</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </aside>

      {/* Comprehensive Area Details Modal */}
      <AreaDetailsModal open={isAreaModalOpen} onOpenChange={setIsAreaModalOpen} />
    </>
  )
}
