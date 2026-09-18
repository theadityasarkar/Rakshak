"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Camera, Crosshair, Loader2, Radio, Upload, WifiOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { useDisaster } from "@/src/context/DisasterContext"
import { t } from "@/src/lib/i18n"
import type { IncidentType } from "@/src/data/ner-regions"

const INCIDENT_TYPES: IncidentType[] = [
  "Mesoscale Convective Cloudburst",
  "Offshore Trough Surge",
  "Severe Heatwave Ridge",
  "Deep Cyclonic Vorticity Depression",
  "Western Disturbance Vortex",
  "Flash Flood",
  "Urban Inundation",
  "Road Blockage",
  "Severe Gale / Microburst",
  "Orographic Deluge",
]

export function FieldIncidentModal() {
  const { addIncidentReport, isOfflineMode, selectedRegion, gpsOverride, triggerGpsLocate, activeLanguage } =
    useDisaster()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [incidentType, setIncidentType] = useState<IncidentType>("Mesoscale Convective Cloudburst")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [lat, setLat] = useState(String(selectedRegion.coords[0]))
  const [lng, setLng] = useState(String(selectedRegion.coords[1]))
  const [roadName, setRoadName] = useState("NH-6 KM 42")
  const [submitting, setSubmitting] = useState(false)
  const [queuedBanner, setQueuedBanner] = useState(false)

  useEffect(() => {
    if (!open) return
    const lat0 = gpsOverride?.lat ?? selectedRegion.coords[0]
    const lon0 = gpsOverride?.lon ?? selectedRegion.coords[1]
    setLat(lat0.toFixed(4))
    setLng(lon0.toFixed(4))
  }, [gpsOverride, selectedRegion, open])

  function resetForm() {
    setIncidentType("Mesoscale Convective Cloudburst")
    setPhotoPreview(null)
    setAnalyzing(false)
    setLat(String(selectedRegion.coords[0]))
    setLng(String(selectedRegion.coords[1]))
    setRoadName(`${selectedRegion.city} corridor`)
    setQueuedBanner(false)
  }

  function openDrawer() {
    const lat0 = gpsOverride?.lat ?? selectedRegion.coords[0]
    const lon0 = gpsOverride?.lon ?? selectedRegion.coords[1]
    setLat(lat0.toFixed(4))
    setLng(lon0.toFixed(4))
    setRoadName(`${selectedRegion.name} — ${selectedRegion.city}`)
    setOpen(true)
  }

  function handleFile(file: File | undefined | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(typeof reader.result === "string" ? reader.result : null)
      setAnalyzing(true)
      window.setTimeout(() => setAnalyzing(false), 1600)
    }
    reader.readAsDataURL(file)
  }

const DEFAULT_INCIDENT_PHOTOS: Record<IncidentType, string> = {
  "Mesoscale Convective Cloudburst": "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=400&q=80",
  "Offshore Trough Surge": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
  "Severe Heatwave Ridge": "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=400&q=80",
  "Deep Cyclonic Vorticity Depression": "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=400&q=80",
  "Western Disturbance Vortex": "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=400&q=80",
  "Flash Flood": "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=80",
  "Urban Inundation": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
  "Road Blockage": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80",
  "Severe Gale / Microburst": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  "Orographic Deluge": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
}

  function handleSubmit() {
    setSubmitting(true)
    const latNum = Number.parseFloat(lat)
    const lngNum = Number.parseFloat(lng)
    const report = addIncidentReport({
      type: incidentType,
      locationLabel: roadName || selectedRegion.name,
      lat: Number.isFinite(latNum) ? latNum : selectedRegion.coords[0],
      lon: Number.isFinite(lngNum) ? lngNum : selectedRegion.coords[1],
      photo: photoPreview || DEFAULT_INCIDENT_PHOTOS[incidentType],
    })
    window.setTimeout(() => {
      setSubmitting(false)
      if (report.syncStatus === "queued") {
        setQueuedBanner(true)
        window.setTimeout(() => {
          setOpen(false)
          resetForm()
        }, 900)
      } else {
        setOpen(false)
        resetForm()
      }
    }, 400)
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="relative group overflow-hidden flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-[0_0_12px_rgba(244,63,94,0.3)] border border-red-400/40 transition-all hover:scale-[1.02] hover:shadow-[0_0_18px_rgba(244,63,94,0.5)] active:scale-[0.98] whitespace-nowrap"
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <AlertTriangle className="size-3.5 text-red-100 shrink-0" />
        <span className="hidden sm:inline tracking-tight">{t(activeLanguage, "newIncident")}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[800] flex justify-end bg-black/50">
          <button type="button" className="h-full flex-1 cursor-default" aria-label="Close drawer" onClick={() => setOpen(false)} />
          <aside className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Radio className="size-4 text-red-500" />
                  {t(activeLanguage, "incidentDrawerTitle")}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">{t(activeLanguage, "incidentDrawerDesc")}</p>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>

            {isOfflineMode || queuedBanner ? (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                <WifiOff className="mt-0.5 size-3.5 shrink-0" />
                <span className="font-semibold">{t(activeLanguage, "storedIndexedDb")}</span>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label className="text-xs text-zinc-400">{t(activeLanguage, "incidentType")}</Label>
              <ToggleGroup
                value={[incidentType]}
                onValueChange={(value) => {
                  const next = value[value.length - 1] as IncidentType | undefined
                  if (next) setIncidentType(next)
                }}
                variant="outline"
                className="grid w-full grid-cols-2 gap-1.5"
              >
                {INCIDENT_TYPES.map((type) => (
                  <ToggleGroupItem
                    key={type}
                    value={type}
                    className="w-full justify-center text-xs data-[state=on]:border-red-500/50 data-[state=on]:bg-red-500/15 data-[state=on]:text-red-300"
                  >
                    {type}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Label className="text-xs text-zinc-400">{t(activeLanguage, "photoEvidence")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(false)
                  handleFile(e.dataTransfer.files?.[0])
                }}
                className={cn(
                  "relative flex min-h-28 w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-md border-2 border-dashed text-xs transition-colors",
                  dragActive ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800",
                )}
              >
                {photoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Incident evidence" className="absolute inset-0 size-full object-cover" />
                    {analyzing && (
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/70 px-2 py-1 text-[11px] font-medium text-amber-300">
                        <Loader2 className="size-3 animate-spin" />
                        {t(activeLanguage, "analyzing")}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="size-5 text-zinc-400" />
                    <span className="font-medium">{t(activeLanguage, "dropPhoto")}</span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Camera className="size-3" />
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">{t(activeLanguage, "geolocation")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    triggerGpsLocate()
                    const lat0 = gpsOverride?.lat ?? selectedRegion.coords[0]
                    const lon0 = gpsOverride?.lon ?? selectedRegion.coords[1]
                    setLat(lat0.toFixed(4))
                    setLng(lon0.toFixed(4))
                  }}
                  className="h-7 px-2 text-[11px]"
                >
                  <Crosshair className="size-3" data-icon="inline-start" />
                  {t(activeLanguage, "fetchGps")}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="lat" className="text-[11px] text-zinc-500">
                    {t(activeLanguage, "lat")}
                  </Label>
                  <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} className="h-8 font-mono text-xs" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="lng" className="text-[11px] text-zinc-500">
                    {t(activeLanguage, "lon")}
                  </Label>
                  <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} className="h-8 font-mono text-xs" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="road" className="text-[11px] text-zinc-500">
                  {t(activeLanguage, "roadName")}
                </Label>
                <Input id="road" value={roadName} onChange={(e) => setRoadName(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 w-full bg-red-600 text-white hover:bg-red-600/90"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                <AlertTriangle data-icon="inline-start" />
              )}
              {isOfflineMode ? t(activeLanguage, "queueInstead") : t(activeLanguage, "broadcast")}
            </Button>
          </aside>
        </div>
      )}
    </>
  )
}
