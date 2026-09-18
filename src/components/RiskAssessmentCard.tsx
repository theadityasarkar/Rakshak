"use client"

import { useState, useMemo } from "react"
import {
  Gauge,
  Thermometer,
  CloudRain,
  Waves,
  Wind,
  ChevronDown,
  ChevronUp,
  Radio,
  Loader2,
  Wifi,
  WifiOff,
  RotateCw,
  Zap,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react"
import { generateGeminiAdvisory } from "@/src/lib/gemini-service"
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
import { NER_REGIONS, SEVERITY_LABEL, localize, type RegionProfile } from "@/src/data/ner-regions"
import {
  computeAnomalyScore,
  computeAnomalyIndex,
  severityFromScore,
  generateMoESAdvisory,
} from "@/src/lib/risk"
import { t } from "@/src/lib/i18n"
import { useDisaster } from "@/src/context/DisasterContext"

const DEFAULT_ENDPOINT = "https://iitzzaadii-sih-2.hf.space/api/v1/predict"

function anomalyTone(index: number) {
  if (index >= 70) {
    return {
      text: "text-red-400",
      bar: "bg-red-500",
      badge: "destructive" as const,
      border: "border-red-500/40",
      label: "Severe Climatological Anomaly",
    }
  }
  if (index >= 40) {
    return {
      text: "text-amber-400",
      bar: "bg-amber-400",
      badge: "secondary" as const,
      border: "border-amber-400/40",
      label: "Moderate Synoptic Perturbation",
    }
  }
  return {
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    badge: "outline" as const,
    border: "border-emerald-500/40",
    label: "Synoptically Stable",
  }
}

export function RiskAssessmentCard() {
  const { selectedRegion, selectRegion, updateTelemetry, simulateSensorSpike, activeLanguage, liveWeather } = useDisaster()
  const [useLiveEndpoint, setUseLiveEndpoint] = useState(false)
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT)
  const [source, setSource] = useState<"mock" | "live">("mock")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [explain, setExplain] = useState(false)
  const [overrideIndex, setOverrideIndex] = useState<number | null>(null)

  const [geminiKey, setGeminiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("megh_gemini_key") || ""
    }
    return ""
  })
  const [geminiAdvisory, setGeminiAdvisory] = useState<string | null>(null)
  const [isGeminiLoading, setIsGeminiLoading] = useState(false)
  const [geminiError, setGeminiError] = useState<string | null>(null)
  const isGeminiKeyActive = geminiKey.trim().startsWith("AIza") && geminiKey.trim().length > 20

  async function handleGenerateGemini() {
    if (!geminiKey.trim()) {
      // Generate a rich demo advisory when no key is present
      const demoAdvisory = `[MoES GenAI SYNOPTIC BULLETIN — DEMO MODE]\n` +
        `Sector: ${selectedRegion.name}, ${selectedRegion.state}\n\n` +
        `METEOROLOGICAL DIAGNOSIS:\n` +
        `Analysis of ${selectedRegion.district || selectedRegion.city} reveals ${hazardIndex >= 70 ? "CRITICAL" : hazardIndex >= 40 ? "MODERATE" : "STABLE"} synoptic conditions. ` +
        `Thermal anomaly of ${tempDelta > 0 ? "+" : ""}${tempDelta}°C combined with precipitation surge of ${precipRate} mm/hr ` +
        `indicates ${hazardIndex >= 70 ? "an extreme mesoscale weather event requiring immediate evacuation protocols" : hazardIndex >= 40 ? "elevated risk requiring heightened monitoring" : "synoptically stable conditions with routine surveillance"}.\n\n` +
        `Z500 geopotential height of ${z500} gpm and vertical wind shear of ${shear} kts ` +
        `${z500 > 5700 ? "indicate a blocking high-pressure ridge amplifying surface heating" : z500 < 5500 ? "indicate deep trough promoting cyclonic vorticity" : "indicate near-normal synoptic circulation"}.\n\n` +
        `DEOC RECOMMENDED ACTION (${selectedRegion.district || selectedRegion.city}):\n` +
        `${action}\n\n` +
        `[Enter Gemini Pro API key below to unlock real-time LLM neural briefings with live Open-Meteo data]`
      setGeminiAdvisory(demoAdvisory)
      return
    }
    setIsGeminiLoading(true)
    setGeminiError(null)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("megh_gemini_key", geminiKey.trim())
      }
      const result = await generateGeminiAdvisory(geminiKey, {
        locationName: selectedRegion.name,
        district: selectedRegion.district,
        state: selectedRegion.state,
        lat: selectedRegion.coords[0],
        lon: selectedRegion.coords[1],
        temp: liveWeather?.temperature ?? 25,
        tempDelta,
        precipRate,
        z500,
        shear,
        hazardIndex,
        weatherCondition: liveWeather?.weatherLabel ?? "Partly Cloudy",
        elevation: selectedRegion.elevation ?? 200,
      })
      setGeminiAdvisory(result)
    } catch (err: unknown) {
      setGeminiError((err as Error)?.message || "Failed to generate Gemini advisory")
    } finally {
      setIsGeminiLoading(false)
    }
  }

  const tempDelta =
    selectedRegion.tempDelta ??
    (selectedRegion.slope !== undefined ? Number(((selectedRegion.slope / 65) * 25 - 10).toFixed(1)) : 2.5)
  const precipRate =
    selectedRegion.precipRate ??
    (selectedRegion.rainfall !== undefined ? Math.round((selectedRegion.rainfall / 350) * 120) : 35)
  const z500 =
    selectedRegion.z500 ??
    (selectedRegion.soil !== undefined ? Math.round(5200 + (selectedRegion.soil / 100) * 750) : 5650)
  const shear = selectedRegion.shear ?? 45

  const liveCalculatedScore = computeAnomalyScore(tempDelta, precipRate, z500, shear)
  const liveCalculatedIndex = Math.round(liveCalculatedScore * 100)
  const hazardIndex = overrideIndex ?? liveCalculatedIndex
  const liveSeverity = severityFromScore(hazardIndex / 100)
  const tone = anomalyTone(hazardIndex)
  const action = generateMoESAdvisory(hazardIndex / 100, tempDelta, precipRate, z500, shear, activeLanguage)

  async function handleRecalculate() {
    setIsLoading(true)
    setError(null)
    const fallbackIndex = computeAnomalyIndex(tempDelta, precipRate, z500, shear)

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
      if (targetUrl.endsWith("/")) targetUrl = targetUrl.slice(0, -1)

      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempDelta,
          precipRate,
          z500,
          shear,
          lat: selectedRegion.coords[0],
          lon: selectedRegion.coords[1],
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        if (res.status === 405) {
          throw new Error("HTTP 405: Method Not Allowed. HF Space route does not accept POST on this path.")
        }
        if (res.status === 404) {
          throw new Error("HTTP 404: Endpoint path not found. Check your API route.")
        }
        throw new Error(`Endpoint returned status ${res.status}`)
      }

      const json = await res.json()
      const predictedVal =
        typeof json.hazard_index === "number"
          ? json.hazard_index
          : typeof json.score === "number"
            ? json.score * 100
            : typeof json.risk_percentage === "number"
              ? json.risk_percentage
              : typeof json.prediction === "number"
                ? json.prediction
                : null

      if (predictedVal === null) {
        throw new Error("Endpoint response missing hazard numeric field.")
      }

      setOverrideIndex(Math.max(0, Math.min(100, Math.round(predictedVal))))
      setSource("live")
    } catch (err) {
      setOverrideIndex(fallbackIndex)
      setSource("mock")
      const msg = err instanceof Error ? err.message : "Inference request failed"
      setError(`${msg} Using local calibrated AI engine instead.`)
    } finally {
      clearTimeout(timer)
      setIsLoading(false)
    }
  }

  const metrics = [
    {
      key: "tempDelta" as const,
      label: "Thermal Anomaly Δ",
      sublabel: "(-10°C to +15°C)",
      icon: Thermometer,
      unit: "°C",
      min: -10,
      max: 15,
      step: 0.5,
      value: tempDelta,
      calcNorm: Math.min(1, Math.abs(tempDelta) / 15),
    },
    {
      key: "precipRate" as const,
      label: "Precipitation Surge Rate",
      sublabel: "(0 to 120 mm/hr)",
      icon: CloudRain,
      unit: "mm/hr",
      min: 0,
      max: 120,
      step: 1,
      value: precipRate,
      calcNorm: Math.min(1, precipRate / 120),
    },
    {
      key: "z500" as const,
      label: "Z500 Synoptic Pressure Anomaly",
      sublabel: "(5200 to 5950 gpm)",
      icon: Waves,
      unit: "gpm",
      min: 5200,
      max: 5950,
      step: 10,
      value: z500,
      calcNorm: Math.min(1, Math.abs(z500 - 5600) / 350),
    },
    {
      key: "shear" as const,
      label: "Vertical Wind Shear",
      sublabel: "(10 to 75 kts)",
      icon: Wind,
      unit: "kts",
      min: 10,
      max: 75,
      step: 1,
      value: shear,
      calcNorm: Math.min(1, shear / 75),
    },
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
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2.5 pt-3.5 px-3.5">
        <CardTitle className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-100 font-semibold truncate mr-2">
          <Gauge className="size-4 text-emerald-400 shrink-0" />
          <span className="truncate">Synoptic AI Engine</span>
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
          <SelectTrigger size="sm" className="w-[215px] shrink-0 text-xs font-medium">
            <SelectValue placeholder={t(activeLanguage, "selectZone")} />
          </SelectTrigger>
          <SelectContent className="max-h-80 w-[240px]">
            {!NER_REGIONS.some((z) => z.id === selectedRegion.id) && (
              <SelectGroup>
                <SelectLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-zinc-900/90">
                  📍 Active Synoptic Core
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
                      <span className="truncate">{z.name}</span>
                      <span className="text-[10px] opacity-60 font-mono shrink-0">({z.city})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 pt-0 px-3.5 pb-3">
        {/* Cockpit HUD Anomaly Gauge & Status Banner */}
        <div className={cn("rounded-xl border p-2.5 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 shadow-md", tone.border)}>
          {/* Header Row: Hub & Severity Badge */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-zinc-800/70">
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Target Synoptic Sector</span>
              <p className="text-xs font-bold text-zinc-100 truncate">
                {selectedRegion.name} · {selectedRegion.state}
              </p>
            </div>
            <Badge variant={tone.badge} className="text-[10px] font-semibold px-2 py-0.5 shrink-0 whitespace-nowrap">
              {tone.label}
            </Badge>
          </div>

          {/* Telemetry Row: Score & Gauge Bar */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-2xl font-black tabular-nums tracking-tight", tone.text)}>
                  {hazardIndex}%
                </span>
                <span className="text-xs font-medium text-zinc-300">Anomaly Index</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {source === "live" ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Radio className="size-3 animate-pulse" /> External NWP API
                  </span>
                ) : (
                  <span className="text-sky-400/90 font-medium">⚡ In-Browser MoES Physics</span>
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[9px] text-zinc-400 font-mono">Perturbation Gauge</span>
              <div className="w-20 h-1.5 rounded-full bg-zinc-800/90 overflow-hidden p-0.5 border border-zinc-700/50">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", tone.bar)}
                  style={{ width: `${Math.min(100, Math.max(8, hazardIndex))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Simulation Presets (Single Row 4-Column Grid) */}
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-900/50 p-1 border border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 text-[10px] px-1 w-full truncate border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15"
            onClick={() => {
              setOverrideIndex(null)
              updateTelemetry({ tempDelta: 0.5, precipRate: 5, z500: 5600, shear: 25 })
            }}
            title="Simulate synoptically stable baseline"
          >
            🟢 Baseline
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 text-[10px] px-1 w-full truncate border-red-500/40 text-red-400 hover:bg-red-500/15"
            onClick={() => {
              setOverrideIndex(null)
              updateTelemetry({ tempDelta: 4.5, precipRate: 95, z500: 5780, shear: 65 })
            }}
            title="Simulate severe convective cloudburst"
          >
            🔴 Cloudburst
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 text-[10px] px-1 w-full truncate border-amber-500/40 text-amber-400 hover:bg-amber-500/15"
            onClick={() => {
              setOverrideIndex(null)
              updateTelemetry({ tempDelta: 8.6, precipRate: 0, z500: 5910, shear: 18 })
            }}
            title="Simulate severe synoptic heatwave"
          >
            🟠 Heatwave
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 text-[10px] px-1 w-full truncate border-sky-500/40 text-sky-400 hover:bg-sky-500/15"
            onClick={() => {
              setOverrideIndex(null)
              updateTelemetry({ tempDelta: -3.2, precipRate: 75, z500: 5460, shear: 58 })
            }}
            title="Simulate cyclonic / monsoon depression"
          >
            🔵 Depression
          </Button>
        </div>

        {/* Interactive Sliders */}
        <div className="flex flex-col gap-2">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const pct = Math.round(metric.calcNorm * 100)
            const stepDelta = metric.step

            const handleNudge = (delta: number) => {
              const next = Number((Math.max(metric.min, Math.min(metric.max, metric.value + delta))).toFixed(1))
              setOverrideIndex(null)
              updateTelemetry({ [metric.key]: next })
            }

            return (
              <div
                key={metric.key}
                className="flex flex-col gap-1 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <Icon className="size-3.5 text-sky-400" />
                    <span>{metric.label}</span>
                    <span className="text-[10px] text-zinc-500">{metric.sublabel}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleNudge(-stepDelta)}
                      className="flex size-5 items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                      title={`Decrease by ${stepDelta}${metric.unit}`}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="min-w-[54px] text-right font-bold tabular-nums text-zinc-100 font-mono">
                      {metric.value > 0 && metric.key === "tempDelta" ? `+${metric.value}` : metric.value}
                      {metric.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNudge(stepDelta)}
                      className="flex size-5 items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                      title={`Increase by ${stepDelta}${metric.unit}`}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>

                <Slider
                  value={[metric.value]}
                  min={metric.min}
                  max={metric.max}
                  step={metric.step}
                  indicatorClassName={tone.bar}
                  onValueChange={(val) => {
                    const next = Array.isArray(val) ? val[0] : typeof val === "number" ? val : undefined
                    if (typeof next === "number") {
                      setOverrideIndex(null)
                      updateTelemetry({ [metric.key]: next })
                    }
                  }}
                  className="py-0.5 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>{metric.min}{metric.unit}</span>
                  <span className="text-zinc-400 font-sans">{pct}% normalized perturbation</span>
                  <span>{metric.max}{metric.unit}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamically Reactive Recommended MoES Action Strip */}
        <div className={cn("rounded-md border p-2.5 transition-colors bg-zinc-900/60", tone.border)}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <span>MoES Action Advisory Strip</span>
              {geminiAdvisory && (
                <span className="flex items-center gap-0.5 rounded bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-bold text-purple-300 border border-purple-500/40">
                  <Sparkles className="size-2.5" /> Gemini Pro AI
                </span>
              )}
            </p>
            <span className={cn("text-[10px] font-mono font-bold uppercase", tone.text)}>
              {tone.label}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
            {geminiAdvisory || action}
          </p>
        </div>

        {/* Gemini Pro AI Synoptic Briefing Widget */}
        <div className="flex flex-col gap-2 rounded-md border border-purple-900/40 p-3 bg-purple-950/15">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
              <Sparkles className="size-3.5 text-purple-400" />
              Gemini Pro Synoptic LLM Briefing
            </span>
            <div className="flex items-center gap-1.5">
              {isGeminiKeyActive ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini Pro Active
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                  Key Optional
                </span>
              )}
              {geminiAdvisory && (
                <button
                  type="button"
                  onClick={() => setGeminiAdvisory(null)}
                  className="text-[10px] text-zinc-400 hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            Generate an official MoES GenAI bulletin for <strong className="text-zinc-300">{selectedRegion.district || selectedRegion.city || "this district"}</strong> using real-time telemetry. Works without a key in demo mode.
          </p>
          <div className="flex gap-1.5">
            <Input
              type="password"
              placeholder="Paste Gemini API Key (AIzaSy...)"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value)
                setGeminiError(null)
              }}
              className="h-7 text-xs bg-zinc-950/80 font-mono"
            />
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={isGeminiLoading}
              onClick={handleGenerateGemini}
              className="shrink-0 h-7 border-purple-500/50 text-purple-300 hover:bg-purple-900/30 text-[11px]"
            >
              {isGeminiLoading ? (
                <Loader2 className="size-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="size-3 mr-1 text-purple-400" />
              )}
              {isGeminiLoading ? "Generating…" : "Generate"}
            </Button>
          </div>
          {geminiError && (
            <p className="text-[10px] text-rose-400 font-mono">⚠️ {geminiError}</p>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          size="sm"
          onClick={() => {
            setOverrideIndex(null)
            simulateSensorSpike()
          }}
        >
          <Zap className="size-4 text-amber-400" data-icon="inline-start" />
          Simulate Synoptic Surge (+30 mm/hr Precip)
        </Button>

        <div className="flex flex-col gap-2 rounded-md border border-zinc-800 p-3 bg-zinc-900/30">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="live-endpoint-toggle" className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              {useLiveEndpoint ? (
                <Wifi className="size-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="size-3.5 text-zinc-500" />
              )}
              Connect External NWP Forecast Model
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
              ? "Connecting to external cloud ML model (Hugging Face / FastAPI / ECMWF API). If offline, system uses built-in MoES engine."
              : "Default: Built-in calibrated MoES live physics engine active (instant 0ms response, zero network quota)."}
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
                    Tip: Turn the toggle above OFF to use the local real-time AI physics engine.
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
          {isLoading ? "Recalculating Synoptic Fields…" : "Recalculate Spatio-Temporal Anomaly Index"}
        </Button>

        <button
          type="button"
          onClick={() => setExplain((v) => !v)}
          className="flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
        >
          In-Browser Live Physics Formula
          {explain ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
        {explain && (
          <div className="space-y-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] text-zinc-400">
            <p className="text-zinc-200 font-semibold">Live Spatio-Temporal Anomaly Index Formulation:</p>
            <p>• Thermal Anomaly Δ: 35% (|ΔT| / 15°C)</p>
            <p>• Precipitation Surge Rate: 35% (Precip / 120 mm/hr)</p>
            <p>• Z500 Synoptic Pressure Anomaly: 15% (|Z500 - 5600| / 350 gpm)</p>
            <p>• Vertical Wind Shear: 15% (Shear / 75 kts)</p>
            <p className="font-mono text-emerald-400 mt-2 bg-zinc-950 p-1.5 rounded border border-zinc-800">
              Score = 0.35·(|{tempDelta}|/15) + 0.35·({precipRate}/120) + 0.15·(|{z500}-5600|/350) + 0.15·({shear}/75) → {hazardIndex}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
