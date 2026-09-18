"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  ACTION_LABEL,
  SEVERITY_LABEL,
  cloneRegion,
  DEFAULT_REGION,
  findNearestRegion,
  findRegionByName,
  NER_REGIONS,
  type Language,
  type RegionProfile,
} from "@/src/data/ner-regions"
import { SEED_INCIDENTS } from "@/src/data/seed-incidents"
import { t } from "@/src/lib/i18n"
import {
  clamp,
  computeRiskIndex,
  escalateAfterRainSpike,
  severityFromTelemetry,
  synthesizeTerrainForCoords,
} from "@/src/lib/risk"
import { clearOfflineQueue, loadOfflineQueue, persistOfflineQueue } from "@/src/lib/indexeddb-queue"
import { fetchLiveWeather, type LiveWeatherReport } from "@/src/lib/weather-service"
import type { AppNotification, IncidentReport, NewIncidentInput } from "@/src/types/incident"

const LANG_KEY = "ner-rakshak-lang"

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`
}

function incidentSeverity(type: NewIncidentInput["type"]): IncidentReport["severity"] {
  if (type === "Mesoscale Convective Cloudburst" || type === "Offshore Trough Surge") return "Critical"
  if (type === "Severe Heatwave Ridge" || type === "Deep Cyclonic Vorticity Depression") return "Severe"
  if (type === "Severe Gale / Microburst" || type === "Orographic Deluge") return "Severe"
  if (type === "Flash Flood" || type === "Urban Inundation") return "Moderate"
  return "Moderate"
}

export type FilterScope = "district" | "all"

export interface DisasterStore {
  selectedRegion: RegionProfile
  activeLanguage: Language
  isOfflineMode: boolean
  filterScope: FilterScope
  setFilterScope: (scope: FilterScope) => void
  incidentReports: IncidentReport[]
  offlineQueue: IncidentReport[]
  visibleIncidents: IncidentReport[]
  notifications: AppNotification[]
  gpsOverride: { lat: number; lon: number } | null
  flyToken: number
  liveWeather: LiveWeatherReport | null
  weatherLoading: boolean
  inspectingIncident: IncidentReport | null
  setInspectingIncident: (incident: IncidentReport | null) => void
  activeRightTab: "sliders" | "feed" | "split"
  setActiveRightTab: (tab: "sliders" | "feed" | "split") => void
  setSelectedRegionByName: (name: string) => boolean
  selectRegion: (region: RegionProfile) => void
  selectCustomLocation: (label: string, lat: number, lon: number, state?: string, district?: string) => void
  setActiveLanguage: (lang: Language) => void
  setOfflineMode: (value: boolean) => void
  addIncidentReport: (input: NewIncidentInput) => IncidentReport
  syncOfflineQueue: () => Promise<void>
  triggerGpsLocate: () => void
  updateTelemetry: (partial: {
    tempDelta?: number
    precipRate?: number
    z500?: number
    shear?: number
    slope?: number
    rainfall?: number
    soil?: number
  }) => void
  simulateSensorSpike: () => void
  dismissNotification: (id: string) => void
  pushNotice: (tone: AppNotification["tone"], message: string) => void
  resetToDefaultRegion: () => void
  resetToIndiaView: () => void
}

const DisasterContext = createContext<DisasterStore | null>(null)

export function DisasterProvider({ children }: { children: ReactNode }) {
  const [selectedRegion, setSelectedRegion] = useState<RegionProfile>(() => cloneRegion(DEFAULT_REGION))
  const [activeLanguage, setActiveLanguageState] = useState<Language>("en")
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [filterScope, setFilterScope] = useState<FilterScope>("all")
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>(SEED_INCIDENTS)
  const [offlineQueue, setOfflineQueue] = useState<IncidentReport[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [gpsOverride, setGpsOverride] = useState<{ lat: number; lon: number } | null>(null)
  const [flyToken, setFlyToken] = useState(0)
  const [liveWeather, setLiveWeather] = useState<LiveWeatherReport | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [inspectingIncident, setInspectingIncident] = useState<IncidentReport | null>(null)
  const [activeRightTab, setActiveRightTab] = useState<"sliders" | "feed" | "split">("sliders")
  const offlineQueueRef = useRef<IncidentReport[]>([])
  offlineQueueRef.current = offlineQueue

  const pushNotice = useCallback((tone: AppNotification["tone"], message: string) => {
    const id = createId("note")
    setNotifications([{ id, tone, message }])
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 3200)
    }
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY)
    if (saved === "en" || saved === "hi") {
      setActiveLanguageState(saved)
    } else {
      setActiveLanguageState("en")
    }
    void loadOfflineQueue().then((items) => {
      if (items.length) setOfflineQueue(items)
    })
  }, [])

  useEffect(() => {
    void persistOfflineQueue(offlineQueue)
  }, [offlineQueue])

  // Fetch real-time live meteorological telemetry (Open-Meteo) whenever coordinates change
  useEffect(() => {
    const [lat, lon] = selectedRegion.coords
    const controller = new AbortController()
    setWeatherLoading(true)
    fetchLiveWeather(lat, lon, controller.signal).then((report) => {
      if (report) {
        setLiveWeather(report)
        setSelectedRegion((prev) => {
          return {
            ...prev,
            elevation: report.elevation,
            tempDelta: report.tempDelta,
            precipRate: report.precipRate,
            z500: report.z500,
            shear: report.shear,
            severity: report.severity,
            advice: ACTION_LABEL[report.severity],
            status: {
              en: `${SEVERITY_LABEL[report.severity].en} — ${report.weatherLabel}`,
              hi: `${SEVERITY_LABEL[report.severity].hi} — ${report.weatherLabel}`,
              as: `${SEVERITY_LABEL[report.severity].as} — ${report.weatherLabel}`,
            },
          }
        })
      }
      setWeatherLoading(false)
    })
    return () => controller.abort()
  }, [selectedRegion.coords])

  const setActiveLanguage = useCallback((lang: Language) => {
    setActiveLanguageState(lang)
    window.localStorage.setItem(LANG_KEY, lang)
  }, [])

  const selectRegion = useCallback((region: RegionProfile) => {
    if (!region) return
    setSelectedRegion(cloneRegion(region))
    setGpsOverride(null)
    setFilterScope("district")
    setFlyToken((n) => (n <= 0 ? 1 : n + 1))
  }, [])

  const selectCustomLocation = useCallback(
    (label: string, lat: number, lon: number, state?: string, district?: string) => {
      const validLat = Number.isFinite(lat) ? lat : 21.2
      const validLon = Number.isFinite(lon) ? lon : 82.2
      const terrain = synthesizeTerrainForCoords(validLat, validLon)
      const inferredDistrict = district || label.split(",")[0].trim()
      const inferredCity = label.split(",")[0].trim()
      const dynamicProfile: RegionProfile = {
        id: `epicenter-${validLat.toFixed(4)}-${validLon.toFixed(4)}`,
        name: label,
        district: inferredDistrict,
        state: state || (validLat >= 28 ? "Northern Sector" : validLat <= 21 ? "Peninsular Sector" : "Central Sector"),
        city: inferredCity,
        coords: [validLat, validLon],
        tempDelta: terrain.tempDelta,
        precipRate: terrain.precipRate,
        z500: terrain.z500,
        shear: terrain.shear,
        phenomenon: terrain.phenomenon,
        slope: terrain.slope,
        rainfall: terrain.rainfall,
        soil: terrain.soil,
        elevation: terrain.elevation,
        severity: "Low",
        advice: ACTION_LABEL["Low"],
        status: {
          en: `Syncing Live NWP Telemetry…`,
          hi: `लाइव टेलीमेट्री सिंक हो रही है…`,
          as: `লাইভ টেলিমেট্ৰি সংযোগ হৈ আছে…`,
        },
        aliases: [label.toLowerCase(), inferredDistrict.toLowerCase(), inferredCity.toLowerCase()],
      }
      setSelectedRegion(dynamicProfile)
      setFilterScope("district")
      setGpsOverride({ lat: validLat, lon: validLon })
      setFlyToken((n) => (n <= 0 ? 1 : n + 1))
      pushNotice("success", `Locked Synoptic Sector: ${label} [${validLat.toFixed(3)}°, ${validLon.toFixed(3)}°]`)
    },
    [pushNotice],
  )

  const setSelectedRegionByName = useCallback(
    (name: string) => {
      const match = findRegionByName(name) ?? NER_REGIONS.find((r) => r.name.toLowerCase().includes(name.trim().toLowerCase()))
      if (!match) return false
      selectRegion(match)
      return true
    },
    [selectRegion],
  )

  const resetToDefaultRegion = useCallback(() => {
    selectRegion(DEFAULT_REGION)
  }, [selectRegion])

  const resetToIndiaView = useCallback(() => {
    setFlyToken(-1)
    setFilterScope("all")
    pushNotice("info", "Reset view to National Overview (Pan-India).")
  }, [pushNotice])

  const addIncidentReport = useCallback(
    (input: NewIncidentInput): IncidentReport => {
      const nearest = findNearestRegion(input.lat, input.lon)
      const report: IncidentReport = {
        id: createId("inc"),
        type: input.type,
        locationLabel: input.locationLabel || nearest.name,
        lat: input.lat,
        lon: input.lon,
        photo: input.photo || "/placeholder.svg",
        timestamp: new Date().toISOString(),
        reporter: t(activeLanguage, "citizenApp"),
        severity: incidentSeverity(input.type),
        syncStatus: isOfflineMode ? "queued" : "synced",
        regionId: nearest.id,
      }

      if (isOfflineMode) {
        setOfflineQueue((prev) => [report, ...prev])
        pushNotice("warning", t(activeLanguage, "storedIndexedDb"))
      } else {
        setIncidentReports((prev) => [report, ...prev])
        pushNotice("success", t(activeLanguage, "incidentPinned"))
      }
      return report
    },
    [activeLanguage, isOfflineMode, pushNotice],
  )

  const syncOfflineQueue = useCallback(async () => {
    const snapshot = offlineQueueRef.current
    if (snapshot.length === 0) return
    setOfflineQueue((prev) => prev.map((item) => ({ ...item, syncStatus: "syncing" as const })))
    await new Promise((resolve) => setTimeout(resolve, 700))
    const flushed = snapshot.map((item) => ({ ...item, syncStatus: "synced" as const }))
    setIncidentReports((prev) => [...flushed, ...prev])
    setOfflineQueue([])
    await clearOfflineQueue()
    pushNotice("success", t(activeLanguage, "queueSynced"))
  }, [activeLanguage, pushNotice])

  const setOfflineMode = useCallback(
    (value: boolean) => {
      setIsOfflineMode(value)
      if (!value) {
        window.setTimeout(() => {
          void syncOfflineQueue()
        }, 250)
      }
    },
    [syncOfflineQueue],
  )

  const triggerGpsLocate = useCallback(() => {
    const fallback = () => {
      selectRegion(DEFAULT_REGION)
      pushNotice("warning", t(activeLanguage, "gpsFallback"))
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      fallback()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const nearest = findNearestRegion(lat, lon)
        setSelectedRegion({
          ...cloneRegion(nearest),
          name: t(activeLanguage, "yourLocation"),
        })
        setGpsOverride({ lat, lon })
        setFlyToken((n) => n + 1)
        pushNotice("success", t(activeLanguage, "gpsOk"))
      },
      () => fallback(),
      { timeout: 6000, maximumAge: 15_000, enableHighAccuracy: true },
    )
  }, [activeLanguage, pushNotice, selectRegion])

  const updateTelemetry = useCallback(
    (partial: {
      tempDelta?: number
      precipRate?: number
      z500?: number
      shear?: number
      slope?: number
      rainfall?: number
      soil?: number
    }) => {
      setSelectedRegion((prev) => {
        const tempDelta =
          partial.tempDelta ??
          (partial.slope !== undefined
            ? Number(((partial.slope / 65) * 25 - 10).toFixed(1))
            : (prev.tempDelta ?? 2.5))
        const precipRate =
          partial.precipRate ??
          (partial.rainfall !== undefined
            ? Math.round((partial.rainfall / 350) * 120)
            : (prev.precipRate ?? 35))
        const z500 =
          partial.z500 ??
          (partial.soil !== undefined
            ? Math.round(5200 + (partial.soil / 100) * 750)
            : (prev.z500 ?? 5600))
        const shear = partial.shear ?? prev.shear ?? 45

        const slope = partial.slope ?? Math.round(clamp((Math.abs(tempDelta) / 15) * 50 + 12, 10, 64))
        const rainfall = partial.rainfall ?? Math.round(clamp(precipRate * 2.5, 10, 340))
        const soil = partial.soil ?? Math.round(clamp(((z500 - 5200) / 750) * 100, 15, 98))

        const severity = severityFromTelemetry(tempDelta, precipRate, z500, shear)
        return {
          ...prev,
          tempDelta,
          precipRate,
          z500,
          shear,
          slope,
          rainfall,
          soil,
          severity,
          advice: ACTION_LABEL[severity],
          status: {
            en: `${SEVERITY_LABEL[severity].en} — Live Telemetry`,
            hi: `${SEVERITY_LABEL[severity].hi} — लाइव टेलीमेट्री`,
            as: `${SEVERITY_LABEL[severity].as} — লাইভ টেলিমেট্ৰি`,
          },
        }
      })
    },
    [],
  )

  const simulateSensorSpike = useCallback(() => {
    setSelectedRegion((prev) => {
      const precipRate = Math.min(120, (prev.precipRate ?? 35) + 30)
      const tempDelta = Number(
        (((prev.tempDelta ?? 2.5) > 0 ? (prev.tempDelta ?? 2.5) + 3.0 : (prev.tempDelta ?? 2.5) - 3.0)).toFixed(1),
      )
      const z500 = Math.min(5950, (prev.z500 ?? 5600) + 120)
      const shear = Math.min(75, (prev.shear ?? 45) + 15)
      const severity = severityFromTelemetry(tempDelta, precipRate, z500, shear)
      return {
        ...prev,
        precipRate,
        tempDelta,
        z500,
        shear,
        rainfall: Math.min(350, prev.rainfall + 60),
        soil: Math.min(100, prev.soil + 12),
        slope: Math.min(65, prev.slope + 8),
        severity,
        advice: ACTION_LABEL[severity],
        status: {
          en: `${SEVERITY_LABEL[severity].en} — Synoptic Surge Spike`,
          hi: `${SEVERITY_LABEL[severity].hi} — मौसमी विसंगति स्पाइक`,
          as: `${SEVERITY_LABEL[severity].as} — বতৰৰ স্পাইক`,
        },
      }
    })
    setFlyToken((n) => n + 1)
    pushNotice("danger", "Synoptic Anomaly Surge: Live convective precipitation spike (+30 mm/hr) simulated!")
  }, [pushNotice])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const visibleIncidents = useMemo(
    () => [...offlineQueue, ...incidentReports],
    [offlineQueue, incidentReports],
  )

  const value = useMemo<DisasterStore>(
    () => ({
      selectedRegion,
      activeLanguage,
      isOfflineMode,
      filterScope,
      setFilterScope,
      incidentReports,
      offlineQueue,
      visibleIncidents,
      notifications,
      gpsOverride,
      flyToken,
      liveWeather,
      weatherLoading,
      inspectingIncident,
      setInspectingIncident,
      activeRightTab,
      setActiveRightTab,
      setSelectedRegionByName,
      selectRegion,
      selectCustomLocation,
      setActiveLanguage,
      setOfflineMode,
      addIncidentReport,
      syncOfflineQueue,
      triggerGpsLocate,
      updateTelemetry,
      simulateSensorSpike,
      dismissNotification,
      pushNotice,
      resetToDefaultRegion,
      resetToIndiaView,
    }),
    [
      selectedRegion,
      activeLanguage,
      isOfflineMode,
      filterScope,
      incidentReports,
      offlineQueue,
      visibleIncidents,
      notifications,
      gpsOverride,
      flyToken,
      liveWeather,
      weatherLoading,
      inspectingIncident,
      activeRightTab,
      setSelectedRegionByName,
      selectRegion,
      selectCustomLocation,
      setActiveLanguage,
      setOfflineMode,
      addIncidentReport,
      syncOfflineQueue,
      triggerGpsLocate,
      updateTelemetry,
      simulateSensorSpike,
      dismissNotification,
      pushNotice,
      resetToDefaultRegion,
      resetToIndiaView,
    ],
  )

  return <DisasterContext.Provider value={value}>{children}</DisasterContext.Provider>
}

export function useDisaster() {
  const ctx = useContext(DisasterContext)
  if (!ctx) throw new Error("useDisaster must be used within DisasterProvider")
  return ctx
}

export function useRiskIndex() {
  const { selectedRegion } = useDisaster()
  return computeRiskIndex(selectedRegion.slope, selectedRegion.rainfall, selectedRegion.soil)
}
