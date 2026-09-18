"use client"

import { useEffect, useState } from "react"
import {
  MapPin,
  MountainSnow,
  CloudRain,
  Droplets,
  Wind,
  ShieldAlert,
  PhoneCall,
  Navigation,
  Compass,
  Building2,
  Zap,
  Activity,
  AlertTriangle,
  FileText,
  Thermometer,
  ExternalLink,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDisaster } from "@/src/context/DisasterContext"
import { computeRiskIndex, severityColor, formatCoord } from "@/src/lib/risk"
import { SEVERITY_LABEL, localize } from "@/src/data/ner-regions"
import { t } from "@/src/lib/i18n"

interface AreaDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AreaDetailsModal({ open, onOpenChange }: AreaDetailsModalProps) {
  const {
    selectedRegion,
    liveWeather,
    activeLanguage,
    simulateSensorSpike,
    gpsOverride,
  } = useDisaster()

  const [activeTab, setActiveTab] = useState<"overview" | "shelters" | "emergency">("overview")

  // Handle ESC key press
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  const lat = gpsOverride?.lat ?? selectedRegion.coords[0]
  const lon = gpsOverride?.lon ?? selectedRegion.coords[1]
  const riskIndex = computeRiskIndex(selectedRegion.slope, selectedRegion.rainfall, selectedRegion.soil)
  const color = severityColor(selectedRegion.severity, riskIndex)

  // Designated mountain evacuation shelters
  const shelters = [
    {
      name: `${selectedRegion.city} District Indoor Sports Stadium`,
      type: "Primary Designated Relief Center",
      distance: "1.8 km",
      capacity: "850 Persons",
      amenities: ["Generator Backup", "Emergency Medical Post", "Water Purifiers", "Satellite Ham Radio"],
      status: "Operational & Ready",
    },
    {
      name: `${selectedRegion.name} Government Higher Secondary Ground`,
      type: "Secondary Evacuation Safe Zone",
      distance: "2.6 km",
      capacity: "450 Persons",
      amenities: ["Emergency Tents", "Drinking Water Tanker", "Ambulance Staging Area"],
      status: "Standby Alert",
    },
    {
      name: `${selectedRegion.city} Civil Hospital Triage Extension`,
      type: "Medical Emergency Hub",
      distance: "3.4 km",
      capacity: "200 Patients",
      amenities: ["Trauma ICU Support", "Medical Oxygen Plant", "Blood Bank Reserve"],
      status: "24/7 Active Triage",
    },
  ]

  const emergencyContacts = [
    { agency: "NDRF Regional Battalion (North East HQ)", phone: "011-24363260 / 9711077372", toll: "1078", role: "Search, Drone Recon & Debris Rescue" },
    { agency: "State Disaster Response Force (SDRF)", phone: "0364-2502088", toll: "1077", role: "Rapid Incident Containment & Evacuation" },
    { agency: "District Emergency Operations Center (DEOC)", phone: "0364-2225289", toll: "1070", role: "Local Administration & Relief Logistics" },
    { agency: "National Emergency Response Support", phone: "Direct Dial 112", toll: "112", role: "Police · Fire · Medical Dispatch" },
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />

      {/* Main Modal Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-zinc-700/80 bg-zinc-950 p-5 sm:p-6 text-zinc-100 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="border-b border-zinc-800 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl border font-bold text-lg"
                style={{ borderColor: `${color}70`, backgroundColor: `${color}20`, color }}
              >
                <Compass className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedRegion.name}
                  <span className="text-sm font-normal text-zinc-400">({selectedRegion.state})</span>
                </h2>
                <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-0.5">
                  <span className="font-mono text-zinc-300">{formatCoord(lat, lon)}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-semibold">{selectedRegion.elevation}m ASL</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs font-bold px-2.5 py-1"
                style={{ borderColor: color, color, backgroundColor: `${color}15` }}
              >
                {localize(SEVERITY_LABEL[selectedRegion.severity], activeLanguage)} · {riskIndex}% Risk
              </Badge>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onOpenChange(false)}
                className="size-7 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex gap-2 border-t border-zinc-800/80 pt-3 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-600"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              📊 Area Telemetry & Risk
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shelters")}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "shelters"
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-600"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              🛡️ Evacuation Shelters ({shelters.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("emergency")}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "emergency"
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-600"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              📞 Disaster Hotlines
            </button>
          </div>
        </div>

        {/* Tab 1: Area Telemetry & Risk */}
        {activeTab === "overview" && (
          <div className="space-y-4 pt-3">
            {/* Key Metrics 4-Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <Thermometer className="size-3.5 text-amber-400" />
                  Live Temp
                </div>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">
                  {liveWeather ? `${liveWeather.temperature}°C` : "--"}
                </p>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {liveWeather ? liveWeather.weatherLabel : "Fetching telemetry..."}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <CloudRain className="size-3.5 text-sky-400" />
                  24h Rainfall
                </div>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">
                  {selectedRegion.rainfall} mm
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {selectedRegion.rainfall > 120 ? "⚠️ Heavy Runoff" : "Normal Precip"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <MountainSnow className="size-3.5 text-emerald-400" />
                  Slope Gradient
                </div>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">
                  {selectedRegion.slope}°
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {selectedRegion.slope > 35 ? "High Shear Stress" : "Stable Incline"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <Droplets className="size-3.5 text-indigo-400" />
                  Soil Saturation
                </div>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">
                  {selectedRegion.soil}%
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {selectedRegion.soil > 75 ? "High Pore-Pressure" : "Stable Matrix"}
                </p>
              </div>
            </div>

            {/* Geological & Hazard Evaluation */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Landslide Vulnerability Assessment
                </span>
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {riskIndex}% Index
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${riskIndex}%`, backgroundColor: color }}
                />
              </div>

              <div className="mt-3.5 space-y-2 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200">Active Advisory: </span>
                    {localize(selectedRegion.advice, activeLanguage)}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Navigation className="size-4 shrink-0 text-sky-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200">Highway Corridor Status: </span>
                    {selectedRegion.severity === "Critical" || selectedRegion.severity === "Severe"
                      ? "High debris-flow risk along mountain highway passes. Heavy freight transit restricted."
                      : "Corridors currently clear. Continuous geotechnical sensor surveillance active."}
                  </div>
                </div>
              </div>
            </div>

            {/* Open-Meteo Real-Time Telemetry Feed */}
            {liveWeather && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/25 p-3.5 text-xs">
                <div className="flex items-center justify-between text-sky-400 font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Wind className="size-4" /> Live Meteorological Telemetry (Open-Meteo API)
                  </span>
                  <Badge variant="outline" className="border-sky-500/40 text-[10px] text-sky-300">
                    Real-Time Feed
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-zinc-300">
                  <div>
                    <span className="text-zinc-500">Wind Speed:</span>
                    <p className="font-bold text-white text-sm mt-0.5">{liveWeather.windSpeed} km/h</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Relative Humidity:</span>
                    <p className="font-bold text-white text-sm mt-0.5">{liveWeather.humidity}%</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">24h Cumul. Rain:</span>
                    <p className="font-bold text-white text-sm mt-0.5">{liveWeather.rain24h} mm</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Designated Safe Evacuation Shelters */}
        {activeTab === "shelters" && (
          <div className="space-y-3 pt-3">
            <p className="text-xs text-zinc-400 font-medium">
              Designated safe evacuation shelters within the designated buffer radius of {selectedRegion.name}:
            </p>
            {shelters.map((shelter) => (
              <div
                key={shelter.name}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-emerald-400" />
                    <span className="font-bold text-sm text-white">{shelter.name}</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-xs font-semibold">
                    {shelter.distance}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{shelter.type}</span>
                  <span className="font-semibold text-zinc-200">Capacity: {shelter.capacity}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {shelter.amenities.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 font-medium"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Disaster Emergency Hotlines */}
        {activeTab === "emergency" && (
          <div className="space-y-3 pt-3">
            <p className="text-xs text-zinc-400 font-medium">
              Immediate disaster response command centers and emergency control room contacts:
            </p>
            {emergencyContacts.map((contact) => (
              <div
                key={contact.agency}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-white">{contact.agency}</p>
                  <p className="text-zinc-400 text-[11px]">{contact.role}</p>
                  <p className="font-mono text-emerald-400 font-semibold text-xs pt-0.5">{contact.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide block font-semibold">Toll Free</span>
                  <Badge variant="secondary" className="font-mono font-bold text-sm bg-zinc-800 text-white mt-0.5">
                    {contact.toll}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={simulateSensorSpike}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-medium text-xs"
          >
            <Zap className="size-3.5 mr-1 text-amber-400" />
            Simulate Weather Surge (+60mm)
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4"
          >
            Close Details
          </Button>
        </div>
      </div>
    </div>
  )
}
