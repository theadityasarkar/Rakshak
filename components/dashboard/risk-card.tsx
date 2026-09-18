"use client"

import { useEffect, useState } from "react"
import {
  Gauge,
  MountainSnow,
  CloudRain,
  Droplets,
  ChevronDown,
  Radio,
  Loader2,
  Wifi,
  WifiOff,
  RotateCw,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { riskZones } from "@/lib/dashboard-data"
import { useDashboardStore } from "@/lib/dashboard-store"

const DEFAULT_ENDPOINT = "https://iitzzaadii-sih-2.hf.space/api/v1/predict"

function riskTone(index: number) {
  if (index >= 70) return { text: "text-red-400", bar: "bg-red-500", badge: "destructive" as const, label: "Critical" }
  if (index >= 40)
    return { text: "text-amber-400", bar: "bg-amber-400", badge: "secondary" as const, label: "Moderate" }
  return { text: "text-emerald-400", bar: "bg-emerald-500", badge: "outline" as const, label: "Low / Safe" }
}

function recommendedAction(index: number) {
  if (index >= 70) return "SDRF RED ALERT: Immediate evacuation of slope-adjacent settlements within 15km buffer. Close transit corridor."
  if (index >= 40) return "SDRF AMBER ADVISORY: Restrict heavy freight. Deploy field engineering crew for structural retaining inspection."
  return "SDRF GREEN NORMAL: Baseline operations. Routine sensor & meteorological telemetry observation."
}

const METRICS = [
  { key: "slope" as const, label: "Slope Gradient", icon: MountainSnow, unit: "°", max: 65 },
  { key: "rainfall24h" as const, label: "24h Rainfall", icon: CloudRain, unit: "mm", max: 350 },
  { key: "soilSaturation" as const, label: "Soil Saturation", icon: Droplets, unit: "%", max: 100 },
]

// Physics-informed XGBoost-aligned Hazard Probability:
function mockRiskIndex(slope: number, rainfall: number, soil: number) {
  const slopeNorm = Math.min(65, Math.max(0, slope)) / 65
  const rainNorm = Math.min(350, Math.max(0, rainfall)) / 350
  const soilNorm = Math.min(100, Math.max(0, soil)) / 100
  const prob = 0.35 * slopeNorm + 0.40 * rainNorm + 0.15 * soilNorm + 0.10
  return Math.max(0, Math.min(100, Math.round(prob * 100)))
}

type Source = "mock" | "live"

export function RiskAssessmentCard() {
  const { activeDistrict } = useDashboardStore()
  const [selectedId, setSelectedId] = useState(riskZones[2].id)
  const zone = riskZones.find((z) => z.id === selectedId) ?? riskZones[0]

  const [useLiveEndpoint, setUseLiveEndpoint] = useState(false)
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT)
  const [slope, setSlope] = useState(zone.slope)
  const [rainfall, setRainfall] = useState(zone.rainfall24h)
  const [soil, setSoil] = useState(zone.soilSaturation)
  const [riskIndex, setRiskIndex] = useState(zone.riskIndex)
  const [action, setAction] = useState(recommendedAction(zone.riskIndex))
  const [source, setSource] = useState<Source>("mock")
  const [liveSeverity, setLiveSeverity] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleZoneChange(id: string | null) {
    if (!id) return
    const nextZone = riskZones.find((z) => z.id === id) ?? riskZones[0]
    setSelectedId(id)
    setSlope(nextZone.slope)
    setRainfall(nextZone.rainfall24h)
    setSoil(nextZone.soilSaturation)
    setRiskIndex(nextZone.riskIndex)
    setAction(recommendedAction(nextZone.riskIndex))
    setSource("mock")
    setLiveSeverity(null)
    setError(null)
  }

  // Location Risk Lookup (search bar / GPS) automatically overrides the sliders and action.
  useEffect(() => {
    if (!activeDistrict) return
    setSlope(activeDistrict.slope)
    setRainfall(activeDistrict.rainfall24h)
    setSoil(activeDistrict.soilSaturation)
    setRiskIndex(activeDistrict.riskIndex)
    setAction(activeDistrict.advice)
    setSource("mock")
    setLiveSeverity(activeDistrict.status)
    setError(null)
  }, [activeDistrict])

  const payloadLocation = activeDistrict ?? zone

  async function handleRecalculate() {
    setIsLoading(true)
    setError(null)

    // Fallback mock stays active in case the live call is slow or fails.
    const fallbackIndex = mockRiskIndex(slope, rainfall, soil)

    if (!useLiveEndpoint) {
      setRiskIndex(fallbackIndex)
      setAction(recommendedAction(fallbackIndex))
      setSource("mock")
      setIsLoading(false)
      return
    }

    const timeoutMs = 8000
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const payload = {
        slope,
        elevation: zone.elevation,
        rainfall,
        soil_moisture: soil,
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Endpoint returned ${res.status}`)

      const json = await res.json()
      const riskPct = json?.risk_percentage
      const severity = json?.severity
      const actionText = json?.action

      if (typeof riskPct !== "number") throw new Error("Malformed response payload")

      const liveIndex = Math.max(0, Math.min(100, Math.round(riskPct)))

      setError(null)
      setRiskIndex(liveIndex)
      setAction(typeof actionText === "string" && actionText ? actionText : recommendedAction(liveIndex))
      setLiveSeverity(typeof severity === "string" ? severity : null)
      setSource("live")
    } catch (err) {
      // Network error, timeout, or malformed response — keep the app usable via mock data.
      setRiskIndex(fallbackIndex)
      setAction(recommendedAction(fallbackIndex))
      setSource("mock")
      setError(err instanceof Error ? err.message : "Inference request failed")
    } finally {
      clearTimeout(timer)
      setIsLoading(false)
    }
  }

  const tone = riskTone(riskIndex)
  const liveValues: Record<(typeof METRICS)[number]["key"], number> = {
    slope,
    rainfall24h: rainfall,
    soilSaturation: soil,
  }

  return (
    <Card className="border-border/80">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="size-4 text-emerald-400" />
          Risk Assessment Model
        </CardTitle>
        <Select items={riskZones.map((z) => ({ label: z.name, value: z.id }))} value={selectedId} onValueChange={handleZoneChange}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="Select zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {riskZones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {zone.state} · {zone.name}
            </p>
            <p className={cn("text-2xl font-bold tabular-nums", tone.text)}>{riskIndex}%</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Calculated Risk Index
              {source === "live" ? (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <Radio className="size-3" /> live model
                </span>
              ) : (
                <span className="text-muted-foreground/70">(mock)</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {source === "live" ? (
              <Badge className="gap-1 bg-emerald-500/15 text-[10px] font-semibold tracking-wide text-emerald-400">
                <Radio className="size-3" />
                LIVE HF MODEL
              </Badge>
            ) : null}
            <Badge variant={tone.badge} className="text-xs">
              {liveSeverity ?? tone.label}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {METRICS.map((metric) => {
            const Icon = metric.icon
            const value = liveValues[metric.key]
            const pct = Math.min(100, Math.round((value / metric.max) * 100))
            return (
              <div key={metric.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="size-3.5" />
                    {metric.label}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {value}
                    {metric.unit}
                  </span>
                </div>
                <Slider
                  value={[value]}
                  max={metric.max}
                  step={1}
                  onValueChange={(val) => {
                    const next = Array.isArray(val) ? val[0] : (val as number)
                    if (typeof next === "number") {
                      if (metric.key === "slope") setSlope(next)
                      if (metric.key === "rainfall24h") setRainfall(next)
                      if (metric.key === "soilSaturation") setSoil(next)
                    }
                  }}
                  className="py-0.5"
                />
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", tone.bar)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-md border border-border/70 bg-muted/20 p-3">
          <p className="text-xs font-medium text-foreground">Recommended action</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action}</p>
        </div>

        <div className="flex flex-col gap-2.5 rounded-md border border-border/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="live-endpoint-toggle" className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              {useLiveEndpoint ? (
                <Wifi className="size-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="size-3.5 text-muted-foreground" />
              )}
              Connect Custom Inference Endpoint
            </Label>
            <Switch id="live-endpoint-toggle" checked={useLiveEndpoint} onCheckedChange={setUseLiveEndpoint} />
          </div>
          <Input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            disabled={!useLiveEndpoint}
            spellCheck={false}
            className="h-8 font-mono text-[11px]"
            placeholder="https://your-inference-endpoint/api/predict"
          />
          {error ? <p className="text-[11px] text-red-400">{error} — showing fallback estimate.</p> : null}
        </div>

        <Button onClick={handleRecalculate} disabled={isLoading} className="w-full" size="sm">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <RotateCw className="size-4" data-icon="inline-start" />
          )}
          {isLoading ? "Recalculating…" : "Recalculate Risk"}
        </Button>

        <button
          type="button"
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          View model explainability
          <ChevronDown className="size-3.5" />
        </button>
      </CardContent>
    </Card>
  )
}
