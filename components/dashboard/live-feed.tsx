"use client"

import { useEffect, useMemo, useState } from "react"
import {
  MapPin,
  Clock,
  Radio,
  Database,
  Crosshair,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCoord, relativeTime } from "@/src/lib/risk"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"
import { SEVERITY_LABEL, localize, type Severity } from "@/src/data/ner-regions"
import { IncidentDetailsModal } from "@/src/components/IncidentDetailsModal"
import { cn } from "@/lib/utils"

export function LiveFeed() {
  const {
    visibleIncidents,
    activeLanguage,
    selectedRegion,
    selectCustomLocation,
    pushNotice,
    inspectingIncident,
    setInspectingIncident,
  } = useDisaster()

  const [now, setNow] = useState<number | null>(null)
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all")
  const [searchFilter, setSearchFilter] = useState("")

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  const filteredIncidents = useMemo(() => {
    return visibleIncidents.filter((inc) => {
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase()
        return (
          inc.locationLabel.toLowerCase().includes(q) ||
          inc.type.toLowerCase().includes(q) ||
          inc.reporter.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [visibleIncidents, severityFilter, searchFilter])

  const handleCardClick = (report: (typeof visibleIncidents)[0]) => {
    // 1. Immediately fly map to exact incident coordinates and lock district telemetry
    selectCustomLocation(report.locationLabel, report.lat, report.lon)
    // 2. Open rich Incident Reconnaissance & SOP Inspector Modal
    setInspectingIncident(report)
    pushNotice("warning", `Focused on incident: ${report.locationLabel}`)
  }

  return (
    <>
      <Card className="flex h-full flex-col border-zinc-800 bg-zinc-950">
        <CardHeader className="space-y-2 pb-2.5 pt-3 px-3.5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
              <Radio className="size-4 text-emerald-400" />
              {t(activeLanguage, "liveFeed")}
            </CardTitle>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>{filteredIncidents.length} Telemetry Events</span>
            </span>
          </div>

          {/* Quick Severity Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-[10px] pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setSeverityFilter("all")}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-all",
                severityFilter === "all"
                  ? "bg-zinc-700 text-white shadow-xs"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              )}
            >
              All ({visibleIncidents.length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter("Critical")}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-all",
                severityFilter === "Critical"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-zinc-900 text-zinc-400 hover:text-red-400"
              )}
            >
              🔴 Critical ({visibleIncidents.filter(i => i.severity === "Critical").length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter("Severe")}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-all",
                severityFilter === "Severe"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-zinc-900 text-zinc-400 hover:text-orange-400"
              )}
            >
              🟠 Severe ({visibleIncidents.filter(i => i.severity === "Severe").length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter("Moderate")}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-all",
                severityFilter === "Moderate"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-zinc-900 text-zinc-400 hover:text-amber-400"
              )}
            >
              🟡 Moderate ({visibleIncidents.filter(i => i.severity === "Moderate").length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-1 px-3.5 pb-4">
          <div className="flex flex-col gap-2.5">
            {filteredIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs">
                <ShieldAlert className="size-8 mb-2 opacity-40 text-zinc-400" />
                <p>No reports match the selected filter.</p>
              </div>
            ) : (
              filteredIncidents.map((report) => {
                const queued = report.syncStatus !== "synced"
                const isFocused =
                  Math.abs(selectedRegion.coords[0] - report.lat) < 0.01 &&
                  Math.abs(selectedRegion.coords[1] - report.lon) < 0.01

                return (
                  <div
                    key={report.id}
                    onClick={() => handleCardClick(report)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleCardClick(report)
                      }
                    }}
                    className={cn(
                      "group relative flex gap-3 rounded-lg border p-2.5 transition-all duration-200 cursor-pointer text-left select-none",
                      isFocused
                        ? "border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/50"
                        : "border-zinc-800/90 bg-zinc-900/50 hover:border-emerald-500/70 hover:bg-zinc-900 hover:shadow-lg active:scale-[0.99]"
                    )}
                    title="Click to focus map on this incident and inspect detailed SOP & telemetry"
                  >
                    {/* Thumbnail Photo with Zoom Overlay */}
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-zinc-800 border border-zinc-700/50 group-hover:border-emerald-500/50 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.photo || "/placeholder.svg"}
                        alt={report.type}
                        className="size-full object-cover brightness-[0.80] transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Crosshair className="size-4 text-emerald-300" />
                      </div>
                    </div>

                    {/* Report Intel Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                      {/* Top Badges & Timing */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Badge
                            variant={
                              report.severity === "Critical"
                                ? "destructive"
                                : report.severity === "Severe"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px] px-1.5 py-0 font-semibold truncate"
                          >
                            {report.type}
                          </Badge>
                          {isFocused && (
                            <span className="shrink-0 rounded bg-emerald-500 px-1 py-0 font-mono text-[9px] font-bold text-black animate-pulse">
                              LOCKED
                            </span>
                          )}
                        </div>

                        <span className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-500 font-mono">
                          <Clock className="size-3 text-zinc-500" />
                          {now ? relativeTime(report.timestamp, activeLanguage) : "--"}
                        </span>
                      </div>

                      {/* Location Title */}
                      <p className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors line-clamp-1 leading-snug">
                        {report.locationLabel}
                      </p>

                      {/* Geotag & Interactive Hint */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-mono text-zinc-300 text-[10px] truncate">
                          <MapPin className="size-3 shrink-0 text-emerald-400" />
                          <span className="truncate">{formatCoord(report.lat, report.lon)}</span>
                        </span>

                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          Inspect SOP ↗
                        </span>
                      </div>

                      {/* Reporter & Verification Strip */}
                      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-1 mt-0.5">
                        <span className="truncate">{report.reporter}</span>
                        {queued ? (
                          <span className="flex items-center gap-1 text-sky-300 shrink-0 font-semibold">
                            <Database className="size-2.5" />
                            {t(activeLanguage, "queued")}
                          </span>
                        ) : (
                          <span className="shrink-0 text-emerald-400/90 font-medium flex items-center gap-0.5">
                            <CheckCircle2 className="size-2.5 text-emerald-400" />
                            {localize(SEVERITY_LABEL[report.severity], activeLanguage)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Incident Details & MoES SOP Inspector Modal */}
      <IncidentDetailsModal
        incident={inspectingIncident}
        onClose={() => setInspectingIncident(null)}
      />
    </>
  )
}
