"use client"

import { useMemo, useState } from "react"
import { Search, Crosshair, ScanLine, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { nerDistricts, findNearestDistrict, type NerDistrict } from "@/lib/dashboard-data"
import { useDashboardStore } from "@/lib/dashboard-store"

function levelDot(level: NerDistrict["level"]) {
  if (level === "severe") return "bg-red-500"
  if (level === "moderate") return "bg-orange-400"
  return "bg-emerald-500"
}

export function LocationSearchBar() {
  const { selectDistrict } = useDashboardStore()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return nerDistricts
      .filter((d) => [d.name, d.district, d.state, ...d.aliases].some((v) => v.toLowerCase().includes(q)))
      .slice(0, 5)
  }, [query])

  function handleSelect(district: NerDistrict) {
    selectDistrict(district)
    setQuery(district.name)
    setOpen(false)
    setGeoError(null)
  }

  function handleScanRisk() {
    const match =
      suggestions[0] ?? nerDistricts.find((d) => d.name.toLowerCase() === query.trim().toLowerCase())
    if (match) handleSelect(match)
  }

  function handleUseMyLocation() {
    setGeoError(null)
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("GPS not supported on this device")
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const nearest = findNearestDistrict(latitude, longitude)
        const gpsLocation: NerDistrict = {
          ...nearest,
          id: `gps-${Date.now()}`,
          name: "Your Location",
          lat: latitude,
          lon: longitude,
        }
        setGeoLoading(false)
        handleSelect(gpsLocation)
        setQuery("Your Location")
      },
      () => {
        setGeoLoading(false)
        setGeoError("Unable to fetch GPS location")
      },
      { timeout: 8000 },
    )
  }

  return (
    <div className="pointer-events-auto relative w-full max-w-[280px] sm:max-w-sm">
      <div className="flex items-center gap-1 rounded-md border border-border/60 bg-card/95 p-1.5 backdrop-blur">
        <Search className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search District, Highway, or Town..."
          className="h-7 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          title="Use My Location"
        >
          {geoLoading ? <Loader2 className="animate-spin" /> : <Crosshair />}
        </Button>
        <Button type="button" size="sm" className="shrink-0 gap-1 px-2 text-xs" onClick={handleScanRisk}>
          <ScanLine data-icon="inline-start" />
          Scan Risk
        </Button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-[600] mt-1 overflow-hidden rounded-md border border-border/60 bg-card/95 backdrop-blur">
          {suggestions.map((d) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(d)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
            >
              <span className={cn("size-2 shrink-0 rounded-full", levelDot(d.level))} />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{d.state}</span>
            </button>
          ))}
        </div>
      )}

      {geoError && (
        <p className="absolute top-full mt-1 rounded-md bg-card/95 px-2 py-1 text-[10px] text-red-400">
          {geoError}
        </p>
      )}
    </div>
  )
}
