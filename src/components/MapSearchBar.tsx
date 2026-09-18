"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Crosshair, Globe, Loader2, MapPin, Navigation, ScanLine, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { NER_REGIONS, searchRegions, type RegionProfile } from "@/src/data/ner-regions"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address?: {
    city?: string
    town?: string
    village?: string
    suburb?: string
    state?: string
    county?: string
    district?: string
    state_district?: string
    city_district?: string
  }
}

function severityDot(severity: RegionProfile["severity"]) {
  if (severity === "Critical" || severity === "Severe") return "bg-red-500"
  if (severity === "Moderate") return "bg-amber-400"
  return "bg-emerald-500"
}

export function MapSearchBar() {
  const {
    activeLanguage,
    selectRegion,
    selectCustomLocation,
    setSelectedRegionByName,
    triggerGpsLocate,
    selectedRegion,
  } = useDisaster()

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [nominatimLoading, setNominatimLoading] = useState(false)
  const [geocodedResults, setGeocodedResults] = useState<NominatimResult[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  // Parse direct coordinate entry: e.g. "25.5788, 91.8933" or "25.5788 91.8933"
  const parsedCoords = useMemo(() => {
    const trimmed = query.trim()
    const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)$/)
    if (!match) return null
    const lat = Number.parseFloat(match[1])
    const lon = Number.parseFloat(match[2])
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon }
    }
    return null
  }, [query])

  const localSuggestions = useMemo(() => searchRegions(query).slice(0, 5), [query])

  // Query Nominatim API with debounce
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 3 || parsedCoords) {
      setGeocodedResults([])
      setNominatimLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(async () => {
      setNominatimLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=4&addressdetails=1`
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "en,hi",
          },
        })
        if (res.ok) {
          const data = (await res.json()) as NominatimResult[]
          setGeocodedResults(data || [])
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setGeocodedResults([])
        }
      } finally {
        setNominatimLoading(false)
      }
    }, 380)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, parsedCoords])

  function handleSelectLocal(region: RegionProfile) {
    selectRegion(region)
    setQuery(region.name)
    setOpen(false)
  }

  function handleSelectGeocoded(result: NominatimResult) {
    const lat = Number.parseFloat(result.lat)
    const lon = Number.parseFloat(result.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    const city = result.address?.city || result.address?.town || result.address?.village || result.display_name.split(",")[0].trim()
    const state = result.address?.state || (lat >= 28 ? "Northern Sector" : lat <= 21 ? "Peninsular Sector" : "Central Sector")
    const district = result.address?.state_district || result.address?.county || result.address?.city_district || city
    const label = city !== district ? `${city} (${district})` : city
    selectCustomLocation(label, lat, lon, state, district)
    setQuery(label)
    setOpen(false)
  }

  function handleSelectCoords(coords: { lat: number; lon: number }) {
    const label = `GPS [${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}]`
    selectCustomLocation(label, coords.lat, coords.lon, "Custom Epicenter")
    setQuery(label)
    setOpen(false)
  }

  async function handleScanRisk() {
    const trimmed = query.trim()
    if (!trimmed) return

    if (parsedCoords) {
      handleSelectCoords(parsedCoords)
      return
    }
    if (localSuggestions.length > 0) {
      handleSelectLocal(localSuggestions[0])
      return
    }
    if (geocodedResults.length > 0) {
      handleSelectGeocoded(geocodedResults[0])
      return
    }

    // Direct asynchronous query on Enter or button click
    setNominatimLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=4&addressdetails=1`
      const res = await fetch(url, { headers: { "Accept-Language": "en" } })
      if (res.ok) {
        const data = (await res.json()) as NominatimResult[]
        if (data && data.length > 0) {
          handleSelectGeocoded(data[0])
          return
        }
      }
    } catch {
      // ignore
    } finally {
      setNominatimLoading(false)
    }

    const ok = setSelectedRegionByName(trimmed)
    if (!ok && NER_REGIONS[0]) handleSelectLocal(NER_REGIONS[0])
  }

  function handleGps() {
    setGeoLoading(true)
    triggerGpsLocate()
    window.setTimeout(() => setGeoLoading(false), 1200)
  }

  return (
    <div className="pointer-events-auto relative min-w-0 flex-1 sm:max-w-md">
      <div className="flex items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-950/90 p-1.5 shadow-lg backdrop-blur">
        <Search className="ml-1 size-3.5 shrink-0 text-zinc-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleScanRisk()
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 240)}
          placeholder={t(activeLanguage, "searchPlaceholder")}
          className="h-7 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
        />
        {nominatimLoading && <Loader2 className="size-3.5 animate-spin text-zinc-500" />}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-zinc-400 hover:text-white"
          onClick={handleGps}
          disabled={geoLoading}
          title={t(activeLanguage, "useMyLocation")}
        >
          {geoLoading ? <Loader2 className="animate-spin text-emerald-400" /> : <Crosshair />}
        </Button>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1 bg-emerald-600 px-2 sm:px-2.5 text-xs text-white hover:bg-emerald-500"
          onClick={handleScanRisk}
          title={t(activeLanguage, "scanRisk")}
        >
          <ScanLine className="size-3.5" />
          <span className="hidden sm:inline">{t(activeLanguage, "scanRisk")}</span>
        </Button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-[600] mt-1 max-h-72 overflow-auto rounded-md border border-zinc-700/80 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur">
          {/* Direct Coordinate match */}
          {parsedCoords && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectCoords(parsedCoords)}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
            >
              <Navigation className="size-3.5 shrink-0 text-emerald-400" />
              <div className="flex-1">
                <p className="font-semibold">Direct Coordinate Lock</p>
                <p className="text-[11px] text-emerald-400/80 font-mono">
                  {parsedCoords.lat.toFixed(4)}° N, {parsedCoords.lon.toFixed(4)}° E
                </p>
              </div>
              <Badge variant="outline" className="border-emerald-500/50 text-[10px] text-emerald-400">
                Spatial Point
              </Badge>
            </button>
          )}

          {/* Local regional results */}
          {localSuggestions.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Monitored MoES Synoptic Hubs
              </p>
              {localSuggestions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectLocal(region)}
                  className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-xs hover:bg-zinc-800/80"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", severityDot(region.severity))} />
                  <span className="flex-1 truncate font-medium text-zinc-200">
                    {region.name}
                    <span className="ml-1 font-normal text-zinc-400">({region.city})</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-zinc-500">{region.state}</span>
                </button>
              ))}
            </div>
          )}

          {/* Live OpenStreetMap Nominatim Results */}
          {geocodedResults.length > 0 && (
            <div className="border-t border-zinc-800/80 py-1">
              <p className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                <Globe className="size-3" />
                Live OSM Geocoding
              </p>
              {geocodedResults.map((result) => {
                const title = result.display_name.split(",")[0]
                const subtitle = result.display_name.split(",").slice(1, 3).join(",")
                return (
                  <button
                    key={result.place_id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectGeocoded(result)}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs hover:bg-zinc-800/80"
                  >
                    <MapPin className="size-3.5 shrink-0 text-sky-400" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-zinc-100">{title}</p>
                      <p className="truncate text-[10px] text-zinc-400">{subtitle}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                      {Number.parseFloat(result.lat).toFixed(2)}°, {Number.parseFloat(result.lon).toFixed(2)}°
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Empty state fallback */}
          {!parsedCoords && localSuggestions.length === 0 && geocodedResults.length === 0 && !nominatimLoading && (
            <div className="p-3 text-center text-xs text-zinc-500">
              Press Enter to query location or enter coordinates (e.g. 25.57, 91.89)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
