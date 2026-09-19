"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { AlertTriangle, Camera, Crosshair, Loader2, Radio, Upload, WifiOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { useDashboardStore } from "@/lib/dashboard-store"
import type { FieldReport, LeafletRiskMarker, ReportIssue, RiskLevel } from "@/lib/dashboard-data"

const INCIDENT_TYPES = ["Road Blockage", "Convective Storm", "Flash Flood", "Cloudburst Surge"] as const
type IncidentType = (typeof INCIDENT_TYPES)[number]

const INCIDENT_TO_ISSUE: Record<IncidentType, ReportIssue> = {
  "Road Blockage": "Road Blocked",
  "Convective Storm": "Convective Storm",
  "Flash Flood": "Flooding",
  "Cloudburst Surge": "Cloudburst Surge",
}

const INCIDENT_TO_SEVERITY: Record<IncidentType, RiskLevel> = {
  "Road Blockage": "moderate",
  "Convective Storm": "severe",
  "Flash Flood": "moderate",
  "Cloudburst Surge": "severe",
}

export function FieldReportModal() {
  const { addReport } = useDashboardStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [incidentType, setIncidentType] = useState<IncidentType>("Road Blockage")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [lat, setLat] = useState("25.5788")
  const [lng, setLng] = useState("91.8933")
  const [roadName, setRoadName] = useState("NH-6 KM 42")
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function resetForm() {
    setIncidentType("Road Blockage")
    setPhotoPreview(null)
    setAnalyzing(false)
    setLat("25.5788")
    setLng("91.8933")
    setRoadName("NH-6 KM 42")
  }

  function handleFile(file: File | undefined | null) {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
    setAnalyzing(true)
    setTimeout(() => setAnalyzing(false), 2200)
  }

  function handleFetchGps() {
    setLocating(true)
    if (!navigator.geolocation) {
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4))
        setLng(pos.coords.longitude.toFixed(4))
        setLocating(false)
      },
      () => {
        setLocating(false)
      },
      { timeout: 5000 },
    )
  }

  function handleSubmit() {
    setSubmitting(true)

    const issue = INCIDENT_TO_ISSUE[incidentType]
    const severity = INCIDENT_TO_SEVERITY[incidentType]
    const latNum = Number.parseFloat(lat)
    const lngNum = Number.parseFloat(lng)

    const report: FieldReport = {
      id: `r-${Date.now()}`,
      issue,
      location: roadName || "Unnamed road segment",
      coordinates: `${latNum.toFixed(4)}° N, ${lngNum.toFixed(4)}° E`,
      timestamp: "Just now",
      reporter: "Field Unit — Citizen App",
      photo: photoPreview || "/reports/road-blocked-1.png",
      severity,
    }

    const marker: LeafletRiskMarker = {
      id: report.id,
      name: roadName || "New field report",
      level: "severe",
      position: [latNum, lngNum],
      riskIndex: severity === "severe" ? 88 : 55,
      note: issue,
    }

    setTimeout(() => {
      addReport(report, marker)
      setSubmitting(false)
      setOpen(false)
      resetForm()
    }, 600)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="border border-red-400/30 bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-500"
          />
        }
      >
        <AlertTriangle data-icon="inline-start" />
        <span className="hidden sm:inline">New Field Incident</span>
        <span className="sm:hidden">Report</span>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="size-4 text-red-500" />
            New Field Incident Report
          </DialogTitle>
          <DialogDescription>Submit a real-time hazard observation from your current location.</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <WifiOff className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <strong className="font-semibold">Offline Queue Active (IndexedDB):</strong> Reports logged in
            zero-network areas will sync automatically once connectivity returns.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Incident Type</Label>
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

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Photo Evidence</Label>
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
              dragActive ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:bg-muted/50",
            )}
          >
            {photoPreview ? (
              <>
                <Image
                  src={photoPreview || "/placeholder.svg"}
                  alt="Uploaded incident evidence"
                  fill
                  className="object-cover"
                />
                {analyzing && (
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/70 px-2 py-1 text-xs font-medium text-amber-300">
                    <Loader2 className="size-3 animate-spin" />
                    AI analyzing fissure depth…
                  </span>
                )}
              </>
            ) : (
              <>
                <Upload className="size-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Drag &amp; drop or tap to capture</span>
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Camera className="size-3" />
                  Camera capture supported
                </span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Geolocation</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchGps}
              disabled={locating}
              className="h-7 px-2 text-xs"
            >
              {locating ? (
                <Loader2 className="size-3 animate-spin" data-icon="inline-start" />
              ) : (
                <Crosshair className="size-3" data-icon="inline-start" />
              )}
              Fetch Current GPS
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="lat" className="text-xs text-muted-foreground">
                Latitude
              </Label>
              <Input
                id="lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="lng" className="text-xs text-muted-foreground">
                Longitude
              </Label>
              <Input
                id="lng"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="road" className="text-xs text-muted-foreground">
              Highway / Road Name
            </Label>
            <Input
              id="road"
              value={roadName}
              onChange={(e) => setRoadName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-red-600 text-white hover:bg-red-600/90 sm:w-full"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <AlertTriangle data-icon="inline-start" />
            )}
            Broadcast Emergency Alert &amp; Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
