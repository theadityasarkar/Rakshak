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
      <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto border-r border-white/[0.08] bg-[#1A1918] p-3.5 pb-4 text-[#ECEAE6] select-none">
        
        {/* Active Focus Area Card / National Command Hub */}
        <div className="shrink-0">
          {isNationalOverview ? (
            <Card className="group relative overflow-hidden border border-emerald-500/30 bg-[#211F1E] transition-all hover:border-emerald-500/60 shadow-lg">
              {/* Satellite / Earth Command Banner */}
              <div className="relative h-28 w-full overflow-hidden bg-[#1A1918]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
                  alt="National Synoptic Command"
                  className="size-full object-cover brightness-[0.70] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#211F1E] via-[#211F1E]/40 to-transparent" />

                <div className="absolute top-2.5 right-2.5">
                  <span className="text-xs font-mono font-medium text-emerald-400 bg-[#1A1918]/80 px-2 py-0.5 rounded border border-white/[0.08]">
                    Pan-India grid
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-3.5 right-3.5">
                  <p className="font-serif text-base font-semibold text-[#ECEAE6] drop-shadow-md leading-snug">
                    National GNN Tracking Command
                  </p>
                  <p className="truncate text-xs text-[#A8A29A] drop-shadow">
                    MoES PS 26078 · GNN + Diffusion Pipeline
                  </p>
                </div>
              </div>

              {/* Command Summary & Key Metrics */}
              <CardContent className="flex flex-col gap-3 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#948E85] font-medium">Monitoring scope</span>
                  <span className="text-xs text-emerald-400 font-medium">
                    All 28 states & UTs
                  </span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/[0.08] bg-[#2A2725]/70 p-2.5 text-center text-xs">
                  <div>
                    <p className="text-xs text-[#948E85]">Districts covered</p>
                    <p className="font-medium text-[#ECEAE6] font-mono text-sm mt-0.5">{NER_REGIONS.length}+</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#948E85]">Active alerts</p>
                    <p className="font-medium text-red-400 font-mono text-sm mt-0.5">{visibleIncidents.filter(i => i.severity === "Critical").length} Critical</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#948E85]">NWP model</p>
                    <p className="font-medium text-emerald-400 font-mono text-sm mt-0.5">NCMRWF 12Z</p>
                  </div>
                </div>

                {/* Quick-Focus Anomaly Hubs Chips */}
                <div className="space-y-2 pt-0.5">
                  <p className="text-xs text-[#A8A29A] font-medium">
                    EFI anomaly detection hubs
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {NER_REGIONS.slice(0, 4).map((hub) => (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => {
                          selectRegion(hub)
                          pushNotice("warning", `Focused on ${hub.name}`)
                        }}
                        className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#2A2725] px-2.5 py-1.5 text-xs text-left text-[#ECEAE6] hover:border-emerald-500/60 hover:bg-[#34302C] transition-colors"
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
                "group relative overflow-hidden border transition-all hover:shadow-xl bg-[#211F1E]",
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
                <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-base font-semibold text-[#ECEAE6] drop-shadow-md line-clamp-2 leading-snug">
                      {selectedRegion.name}
                    </p>
                    <p className="truncate text-xs text-[#A8A29A] drop-shadow">
                      {selectedRegion.state}
                    </p>
                  </div>
                  <span className="shrink-0 rounded border border-white/[0.08] bg-[#1A1918]/90 px-2 py-0.5 font-mono text-xs font-medium text-emerald-400">
                    {selectedRegion.elevation}m ASL
                  </span>
                </div>
              </div>

              {/* Telemetry Summary & Trigger */}
              <CardContent className="flex flex-col gap-3 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#948E85] font-medium">{selectedRegion.city} sector</span>
                  <Badge
                    variant={selectedRegion.severity === "Low" ? "outline" : "destructive"}
                    className="text-xs font-medium"
                  >
                    {localize(SEVERITY_LABEL[selectedRegion.severity], activeLanguage)}
                  </Badge>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/[0.08] bg-[#2A2725]/70 p-2.5 text-center text-xs">
                  <div>
                    <p className="text-xs text-[#948E85]">Temp Δ</p>
                    <p className="font-semibold text-[#ECEAE6] font-mono text-sm mt-0.5">
                      {(selectedRegion.tempDelta ?? 2.5) > 0 ? `+${selectedRegion.tempDelta ?? 2.5}` : selectedRegion.tempDelta ?? 2.5}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#948E85]">Precip rate</p>
                    <p className="font-semibold text-[#ECEAE6] font-mono text-sm mt-0.5">{selectedRegion.precipRate ?? 35} mm/h</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#948E85]">Z500 anomaly</p>
                    <p className="font-semibold text-[#ECEAE6] font-mono text-sm mt-0.5">{selectedRegion.z500 ?? 5650} gpm</p>
                  </div>
                </div>

                {/* Inspect Area Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAreaModalOpen(true)}
                  className="w-full bg-emerald-700/80 hover:bg-emerald-600 text-[#ECEAE6] font-medium text-xs h-8 shadow-sm"
                >
                  <Compass className="size-3.5 mr-1.5" />
                  Inspect Synoptic Core & Shelters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Regional Status: Compact 2x2 Grid with District/All-India Scope Selector */}
        <div className="shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <h2 className="text-xs font-semibold text-[#ECEAE6]">
                Synoptic anomaly overview
              </h2>
              <span className="text-xs text-emerald-400 font-medium truncate">
                📍 {filterScope === "district" ? (selectedRegion.district || selectedRegion.city || selectedRegion.name) : "Pan-India"}
              </span>
            </div>

            <div className="flex items-center rounded-md border border-white/[0.08] bg-[#211F1E] p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setFilterScope("district")}
                className={cn(
                  "rounded px-2.5 py-0.5 font-medium transition-all",
                  filterScope === "district"
                    ? "bg-emerald-700/80 text-white shadow-xs"
                    : "text-[#A8A29A] hover:text-[#ECEAE6]"
                )}
                title="Show only active district & 160km synoptic corridor metrics"
              >
                District
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                className={cn(
                  "rounded px-2.5 py-0.5 font-medium transition-all",
                  filterScope === "all"
                    ? "bg-[#2A2725] text-white shadow-xs"
                    : "text-[#A8A29A] hover:text-[#ECEAE6]"
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
                "cursor-pointer rounded-lg border border-white/[0.08] bg-[#211F1E] p-3 transition-all hover:border-red-500/50 hover:bg-[#2A2725]",
                showCriticalList && "border-red-500/70 bg-red-950/25"
              )}
              title="Click to view critical anomaly hubs"
            >
              <div className="flex items-center justify-between">
                <TriangleAlert className="size-4 text-red-400" />
                <Badge variant="destructive" className="h-5 px-1.5 text-xs font-semibold">
                  {totalCriticalCount}
                </Badge>
              </div>
              <p className="mt-2 text-xs font-medium text-[#ECEAE6]">EFI anomaly nodes</p>
            </div>

            {/* Storm Corridors */}
            <div
              onClick={handleBlockedHighwaysClick}
              className="cursor-pointer rounded-lg border border-white/[0.08] bg-[#211F1E] p-3 transition-all hover:border-amber-500/50 hover:bg-[#2A2725]"
              title="Click to focus storm corridor on map"
            >
              <div className="flex items-center justify-between">
                <Construction className="size-4 text-amber-400" />
                <Badge
                  variant={scopedBlockedIncidents.length > 0 ? "secondary" : "outline"}
                  className={cn(
                    "h-5 px-1.5 text-xs font-semibold",
                    scopedBlockedIncidents.length > 0
                      ? "bg-amber-500/20 text-amber-300"
                      : "border-white/[0.08] text-[#A8A29A]"
                  )}
                >
                  {scopedBlockedIncidents.length}
                </Badge>
              </div>
              <p className="mt-2 text-xs font-medium text-[#ECEAE6]">Storm corridors</p>
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
              className="cursor-pointer rounded-lg border border-white/[0.08] bg-[#211F1E] p-3 transition-all hover:border-emerald-500/50 hover:bg-[#2A2725]"
              title="Click to center on synoptic event"
            >
              <div className="flex items-center justify-between">
                <Radio className="size-4 text-emerald-400" />
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 px-1.5 text-xs font-semibold",
                    scopedIncidents.length > 0
                      ? "border-emerald-500/40 text-emerald-400"
                      : "border-white/[0.08] text-[#A8A29A]"
                  )}
                >
                  {scopedIncidents.length}
                </Badge>
              </div>
              <p className="mt-2 text-xs font-medium text-[#ECEAE6]">Tracked 4D events</p>
            </div>

            {/* Queued Reports */}
            <div
              onClick={() => pushNotice("info", `${pending} field anomaly reports cached offline in IndexedDB.`)}
              className="cursor-pointer rounded-lg border border-white/[0.08] bg-[#211F1E] p-3 transition-all hover:border-sky-500/50 hover:bg-[#2A2725]"
              title="Offline queue status"
            >
              <div className="flex items-center justify-between">
                <ClipboardList className="size-4 text-sky-400" />
                <Badge variant="secondary" className="h-5 px-1.5 text-xs font-semibold bg-sky-500/20 text-sky-300">
                  {pending}
                </Badge>
              </div>
              <p className="mt-2 text-xs font-medium text-[#ECEAE6]">Offline queue</p>
            </div>
          </div>

          {/* Expandable Critical Zones Submenu */}
          {showCriticalList && (
            <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-lg border border-red-500/30 bg-[#211F1E] p-2.5 text-xs animate-in fade-in-50 duration-150">
              <p className="text-xs font-semibold text-[#A8A29A] px-1">
                Critical sectors ({filterScope === "district" ? (selectedRegion.district || selectedRegion.city || selectedRegion.name) : "All India"}):
              </p>
              {scopedCriticalRegions.length === 0 ? (
                <p className="px-2 py-1.5 text-[#948E85] text-xs">No critical sectors in this district.</p>
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
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[#ECEAE6] hover:bg-[#2A2725]"
                  >
                    <span className="font-medium truncate">{region.name}</span>
                    <Badge variant="destructive" className="text-xs py-0 px-1.5">
                      {region.severity}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Live Weather & Elevation Telemetry */}
        {liveWeather && (
          <div className="shrink-0">
            <Card
              onClick={() => setIsAreaModalOpen(true)}
              className="cursor-pointer border-sky-500/30 bg-[#211F1E] shadow-sm transition-all hover:border-sky-400 hover:bg-[#2A2725]"
              title="Click to view detailed weather breakdown"
            >
              <CardHeader className="pb-1 pt-3 px-3.5 flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-xs text-sky-400 font-medium">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
                  </span>
                  {isNationalOverview ? "Reference station telemetry" : "Live weather telemetry"}
                </CardTitle>
                <span className="text-xs text-[#948E85] font-mono">
                  Open-Meteo
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-3.5 pt-0 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-2xl font-semibold text-[#ECEAE6] tabular-nums">
                      {liveWeather.temperature}°C
                    </p>
                    <p className="text-xs text-sky-200/90 font-medium mt-0.5">
                      {liveWeather.weatherLabel} {isNationalOverview && `• ${selectedRegion.city}`}
                    </p>
                  </div>
                  <div className="text-right space-y-1 text-xs text-[#A8A29A]">
                    <div>24h rain: <span className="font-medium text-[#ECEAE6] font-mono">{liveWeather.rain24h} mm</span></div>
                    <div>Humidity: <span className="font-medium text-[#ECEAE6] font-mono">{liveWeather.humidity}%</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* IMD / Hazard Advisory Card */}
        <div className="shrink-0">
          <Card
            onClick={() => setIsAreaModalOpen(true)}
            className="cursor-pointer border-amber-500/30 bg-[#211F1E] transition-all hover:border-amber-500/60"
            title="Click to view emergency advisory instructions"
          >
            <CardHeader className="pb-1 pt-3 px-3.5">
              <CardTitle className="flex items-center justify-between text-xs text-amber-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CloudRain className="size-3.5" />
                  {t(activeLanguage, "imdAlert")}
                </span>
                <span className="text-xs text-amber-300 underline font-normal">Inspect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 p-3.5 pt-0 text-xs">
              <p className="line-clamp-2 text-xs leading-relaxed text-amber-100/90">
                {localize(selectedRegion.advice, activeLanguage)}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 pt-0.5">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span className="truncate">{localize(selectedRegion.status, activeLanguage)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hazard Legend */}
        <div className="shrink-0">
          <Card className="border-white/[0.08] bg-[#211F1E]">
            <CardHeader className="pb-1 pt-3 px-3.5">
              <CardTitle className="text-xs font-semibold text-[#ECEAE6]">
                {t(activeLanguage, "legend")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 p-3.5 pt-0 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-red-500" />
                  <span className="text-[#ECEAE6]">{localize(SEVERITY_LABEL.Critical, activeLanguage)}</span>
                </div>
                <span className="font-mono text-xs text-[#948E85]">&ge; 75% Risk</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-orange-500" />
                  <span className="text-[#ECEAE6]">{localize(SEVERITY_LABEL.Severe, activeLanguage)}</span>
                </div>
                <span className="font-mono text-xs text-[#948E85]">55 - 74%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-[#ECEAE6]">{localize(SEVERITY_LABEL.Moderate, activeLanguage)}</span>
                </div>
                <span className="font-mono text-xs text-[#948E85]">35 - 54%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-[#ECEAE6]">{localize(SEVERITY_LABEL.Low, activeLanguage)}</span>
                </div>
                <span className="font-mono text-xs text-[#948E85]">&lt; 35%</span>
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
