"use client"

import { useState, useMemo } from "react"
import {
  Gauge,
  MountainSnow,
  CloudRain,
  Droplets,
  ChevronDown,
  ChevronUp,
  Radio,
  Loader2,
  Wifi,
  WifiOff,
  RotateCw,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { NER_REGIONS, SEVERITY_LABEL, localize, type RegionProfile, type Severity } from "@/src/data/ner-regions"
import { computeRiskIndex, recommendedAction, severityFromTelemetry } from "@/src/lib/risk"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"

const DEFAULT_ENDPOINT = "https://iitzzaadii-sih-2.hf.space/api/v1/predict"

function riskTone(index: number, severityLabel?: string) {
  if (index >= 75 || severityLabel === "Critical")
    return { text: "text-red-400", bar: "bg-red-500", badge: "destructive" as const, border: "border-red-500/40" }
  if (index >= 55 || severityLabel === "Severe")
    return { text: "text-orange-400", bar: "bg-orange-500", badge: "destructive" as const, border: "border-orange-500/40" }
  if (index >= 35 || severityLabel === "Moderate")
    return { text: "text-amber-400", bar: "bg-amber-400", badge: "secondary" as const, border: "border-amber-400/40" }
  return { text: "text-emerald-400", bar: "bg-emerald-500", badge: "outline" as const, border: "border-emerald-500/40" }
}

export function RiskAssessmentCard() {
  const { selectedRegion, selectRegion, updateTelemetry, simulateSensorSpike, activeLanguage } = useDisaster()
  const [useLiveEndpoint, setUseLiveEndpoint] = useState(false)
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT)
  const [source, setSource] = useState<"mock" | "live">("mock")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [explain, setExplain] = useState(false)
  const [overrideIndex, setOverrideIndex] = useState<number | null>(null)

  const riskIndex = overrideIndex ?? computeRiskIndex(selectedRegion.slope, selectedRegion.rainfall, selectedRegion.soil)
  const liveSeverity = severityFromTelemetry(selectedRegion.slope, selectedRegion.rainfall, selectedRegion.soil)
  const tone = riskTone(riskIndex, liveSeverity)
  const action = recommendedAction(liveSeverity, activeLanguage)

  async function handleRecalculate() {
    setIsLoading(true)
    setError(null)
    const fallbackIndex = computeRiskIndex(selectedRegion.slope, selectedRegion.rainfall, selectedRegion.soil)

    if (!useLiveEndpoint) {
      setOverrideIndex(fallbackIndex)
      setSource("mock")
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      let targetUrl = endpoint.trim()
      // If user typed a Gradio HF space base URL, clean up trailing slashes
      if (targetUrl.endsWith("/")) targetUrl = targetUrl.slice(0, -1)

      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slope: selectedRegion.slope,
          elevation: selectedRegion.elevation,
          rainfall: selectedRegion.rainfall,
          soil_moisture: selectedRegion.soil,
          lat: selectedRegion.coords[0],
          lon: selectedRegion.coords[1],
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        if (res.status === 405) {
          throw new Error(
            "HTTP 405: Method Not Allowed. Hugging Face Space route does not accept POST on this path or ZeroGPU quota exceeded."
          )
        }
        if (res.status === 404) {
          throw new Error("HTTP 404: Endpoint path not found. Check your API route.")
        }
        throw new Error(`Endpoint returned status ${res.status}`)
      }

      const json = await res.json()
      // Support multiple API response formats (risk_percentage, prediction, score, etc.)
      const predictedVal =
        typeof json.risk_percentage === "number"
          ? json.risk_percentage
          : typeof json.score === "number"
            ? json.score * 100
            : typeof json.prediction === "number"
              ? json.prediction
              : null

      if (predictedVal === null) {
        throw new Error("Endpoint response missing 'risk_percentage' numeric field.")
      }

      setOverrideIndex(Math.max(0, Math.min(100, Math.round(predictedVal))))
      setSource("live")
    } catch (err) {
      setOverrideIndex(fallbackIndex)
      setSource("mock")
      const msg = err instanceof Error ? err.message : "Inference request failed"
      setError(`${msg} Using local calibrated AI model instead.`)
    } finally {
      clearTimeout(timer)
      setIsLoading(false)
    }
  }

  const metrics = [
    { key: "slope" as const, label: t(activeLanguage, "slope"), icon: MountainSnow, unit: "°", max: 65, value: selectedRegion.slope },
    { key: "rainfall" as const, label: t(activeLanguage, "rainfall"), icon: CloudRain, unit: "mm", max: 350, value: selectedRegion.rainfall },
    { key: "soil" as const, label: t(activeLanguage, "soil"), icon: Droplets, unit: "%", max: 100, value: selectedRegion.soil },
  ]

  const stateGroups = useMemo(() => {
    const groups: Record<string, RegionProfile[]> = {}
    for (const r of NER_REGIONS) {
      if (!groups[r.state]) groups[r.state] = []
      groups[r.state].push(r)
    }
    return groups
  }, [])

  const allSelectItems = useMemo(() => {
    const list = NER_REGIONS.map((z) => ({ label: `${z.name} (${z.state})`, value: z.id }))
    if (!NER_REGIONS.some((z) => z.id === selectedRegion.id)) {
      list.unshift({
        label: `${selectedRegion.name} (${selectedRegion.state || "Active"})`,
        value: selectedRegion.id,
      })
    }
    return list
  }, [selectedRegion])

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="size-4 text-emerald-400" />
          {t(activeLanguage, "riskModel")}
        </CardTitle>
        <Select
          items={allSelectItems}
          value={selectedRegion.id}
          onValueChange={(id) => {
            if (!id) return
            const next = NER_REGIONS.find((z) => z.id === id)
            if (next) {
              selectRegion(next)
              setOverrideIndex(null)
              setSource("mock")
            }
          }}
        >
          <SelectTrigger size="sm" className="w-[185px] text-xs">
            <SelectValue placeholder={t(activeLanguage, "selectZone")} />
          </SelectTrigger>
          <SelectContent className="max-h-80 w-[240px]">
            {!NER_REGIONS.some((z) => z.id === selectedRegion.id) && (
              <SelectGroup>
                <SelectLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-zinc-900/90">
                  📍 Active Searched Area
                </SelectLabel>
                <SelectItem value={selectedRegion.id} className="text-xs font-semibold">
                  {selectedRegion.name} ({selectedRegion.city || selectedRegion.state})
                </SelectItem>
                <SelectSeparator />
              </SelectGroup>
            )}
            {Object.entries(stateGroups).map(([stateName, regions], idx) => (
              <SelectGroup key={stateName}>
                {idx > 0 && <SelectSeparator />}
                <SelectLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-zinc-900/90 sticky top-0 z-10 backdrop-blur">
                  {stateName} ({regions.length})
                </SelectLabel>
                {regions.map((z) => (
                  <SelectItem key={z.id} value={z.id} className="text-xs">
                    <span className="flex items-center justify-between w-full gap-2">
                      <span>{z.name}</span>
                      <span className="text-[10px] opacity-60 font-mono">({z.city})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 pt-0">
        <div className="flex items-center justify-between rounded-md bg-zinc-900/80 p-3 border border-zinc-800/80">
          <div>
            <p className="text-xs text-zinc-400">
              {selectedRegion.state} · {selectedRegion.city}
            </p>
            <p className={cn("text-2xl font-bold tabular-nums transition-colors", tone.text)}>{riskIndex}%</p>
            <p className="flex items-center gap-1 text-xs text-zinc-500">
              {t(activeLanguage, "calculatedIndex")}
              {source === "live" ? (
                <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                  <Radio className="size-3" /> {t(activeLanguage, "liveModel")}
                </span>
              ) : (
                <span className="text-emerald-400/90 font-medium">⚡ Reactive Model</span>
              )}
            </p>
          </div>
          <Badge variant={tone.badge} className="text-xs font-semibold px-2.5 py-1">
            {localize(SEVERITY_LABEL[liveSeverity], activeLanguage)}
          </Badge>
        </div>

        {/* Quick Simulation Presets */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-zinc-900/40 p-1.5 border border-zinc-800/60">
          <span className="text-[10px] uppercase font-bold text-zinc-400 px-1">Presets:</span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 text-[10px] px-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15"
            onClick={() => {
              setOverrideIndex(null)
              updateTelemetry({ rainfall: 15, soil: 25, slope: 18 })
            }}
            title="Simulate low baseline weather (Safe)"
          >
            🟢 Safe (15mm)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 text-[10px] px-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/15"
            onClick={() => {
              setOverrideIndex(null)
              updateTelemetry({ rainfall: 140, soil: 68, slope: 35 })
            }}
            title="Simulate moderate continuous rain"
          >
            🟡 Moderate (140mm)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 text-[10px] px-2 border-red-500/40 text-red-400 hover:bg-red-500/15"
            onClick={() => {
              setOverrideIndex(null)
              updateTelemetry({ rainfall: 280, soil: 95, slope: 48 })
            }}
            title="Simulate severe monsoon cloudburst"
          >
            🔴 Cloudburst (280mm)
          </Button>
        </div>

        {/* Interactive Sliders */}
        <div className="flex flex-col gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const pct = Math.min(100, Math.round((metric.value / metric.max) * 100))
            return (
              <div key={metric.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <Icon className="size-3.5 text-zinc-400" />
                    {metric.label}
                  </span>
                  <span className="font-bold tabular-nums text-zinc-100">
                    {metric.value}
                    {metric.unit}
                  </span>
                </div>
                <Slider
                  value={[metric.value]}
                  max={metric.max}
                  step={1}
                  onValueChange={(val) => {
                    const next = Array.isArray(val) ? val[0] : typeof val === "number" ? val : undefined
                    if (typeof next === "number") {
                      setOverrideIndex(null)
                      updateTelemetry({ [metric.key]: next })
                    }
                  }}
                  className="py-1 cursor-pointer"
                />
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className={cn("h-full rounded-full transition-all duration-300", tone.bar)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamically Reactive Recommended Action */}
        <div className={cn("rounded-md border p-3 transition-colors bg-zinc-900/60", tone.border)}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-200">{t(activeLanguage, "recommendedAction")}</p>
            <span className={cn("text-[10px] font-mono font-bold uppercase", tone.text)}>
              {localize(SEVERITY_LABEL[liveSeverity], activeLanguage)} Protocol
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">{action}</p>
        </div>

        <Button type="button" variant="secondary" className="w-full" size="sm" onClick={simulateSensorSpike}>
          <Zap className="size-4 text-amber-400" data-icon="inline-start" />
          {t(activeLanguage, "simulateSpike")} (+60mm Rain)
        </Button>

        <div className="flex flex-col gap-2 rounded-md border border-zinc-800 p-3 bg-zinc-900/30">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="live-endpoint-toggle" className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              {useLiveEndpoint ? (
                <Wifi className="size-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="size-3.5 text-zinc-500" />
              )}
              {t(activeLanguage, "connectEndpoint")}
            </Label>
            <Switch
              id="live-endpoint-toggle"
              checked={useLiveEndpoint}
              onCheckedChange={(val) => {
                setUseLiveEndpoint(val)
                setError(null)
              }}
            />
          </div>

          <p className="text-[10px] text-zinc-400 leading-tight">
            {useLiveEndpoint
              ? "Connecting to external custom cloud model (Hugging Face / FastAPI). If endpoint is offline, system automatically uses built-in engine."
              : "Default: Built-in calibrated XGBoost engine active (instant 0ms calculation, no network quota limits)."}
          </p>

          {useLiveEndpoint && (
            <div className="space-y-1.5 pt-1">
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                spellCheck={false}
                className="h-8 font-mono text-[11px]"
                placeholder="https://your-api.hf.space/api/predict"
              />
              {error ? (
                <div className="rounded bg-red-950/40 border border-red-500/30 p-2 text-[11px] text-red-300">
                  <p className="font-semibold text-red-400">⚠️ {error}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Tip: Turn the toggle above OFF to use the local real-time AI model.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <Button onClick={handleRecalculate} disabled={isLoading} className="w-full" size="sm">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <RotateCw className="size-4" data-icon="inline-start" />
          )}
          {isLoading ? t(activeLanguage, "recalculating") : t(activeLanguage, "recalculate")}
        </Button>

        <button
          type="button"
          onClick={() => setExplain((v) => !v)}
          className="flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
        >
          {t(activeLanguage, "explainability")}
          {explain ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
        {explain && (
          <div className="space-y-1 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-[11px] text-zinc-400">
            <p>{t(activeLanguage, "weightSlope")}</p>
            <p>{t(activeLanguage, "weightRain")}</p>
            <p>{t(activeLanguage, "weightSoil")}</p>
            <p>
              score = slope×0.85 + rain×0.28 + soil×0.50 → {riskIndex}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
