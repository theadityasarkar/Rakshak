"use client"

import { useEffect, useState } from "react"
import { MapPin, Clock, Radio, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCoord, relativeTime } from "@/src/lib/risk"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"
import { SEVERITY_LABEL, localize } from "@/src/data/ner-regions"

export function LiveFeed() {
  const { visibleIncidents, activeLanguage } = useDisaster()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <Card className="flex h-full flex-col border-zinc-800 bg-zinc-950">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Radio className="size-4 text-emerald-400" />
          {t(activeLanguage, "liveFeed")}
        </CardTitle>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {t(activeLanguage, "live")}
        </span>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-0">
        <div className="flex flex-col gap-3">
          {visibleIncidents.map((report) => {
            const queued = report.syncStatus !== "synced"
            return (
              <div key={report.id} className="flex gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-2.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={report.photo || "/placeholder.svg"} alt={report.type} className="size-full object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={report.severity === "Low" ? "outline" : report.severity === "Moderate" ? "secondary" : "destructive"} className="text-[11px]">
                      {report.type}
                    </Badge>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-500">
                      <Clock className="size-3" />
                      {now ? relativeTime(report.timestamp, activeLanguage) : "--"}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium">{report.locationLabel}</p>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{formatCoord(report.lat, report.lon)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                    <span className="truncate">{report.reporter}</span>
                    {queued ? (
                      <span className="flex items-center gap-1 text-sky-300">
                        <Database className="size-3" />
                        {t(activeLanguage, "queued")}
                      </span>
                    ) : (
                      <span>{localize(SEVERITY_LABEL[report.severity], activeLanguage)}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
