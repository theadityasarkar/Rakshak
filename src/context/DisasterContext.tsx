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
  if (type === "Rockfall" || type === "Crack / Slope Slip") return "Severe"
  if (type === "Flash Flood") return "Moderate"
  return "Severe"
}

export interface DisasterStore {
  selectedRegion: RegionProfile
  activeLanguage: Language
  isOfflineMode: boolean
  incidentReports: IncidentReport[]
  offlineQueue: IncidentReport[]
  visibleIncidents: IncidentReport[]
  notifications: AppNotification[]
  gpsOverride: { lat: number; lon: number } | null
  flyToken: number
  liveWeather: LiveWeatherReport | null
  weatherLoading: boolean
  setSelectedRegionByName: (name: string) => boolean
  selectRegion: (region: RegionProfile) => void
  selectCustomLocation: (label: string, lat: number, lon: number, state?: string) => void
  setActiveLanguage: (lang: Language) => void
  setOfflineMode: (value: boolean) => void
  addIncidentReport: (input: NewIncidentInput) => IncidentReport
  syncOfflineQueue: () => Promise<void>
  triggerGpsLocate: () => void
  updateTelemetry: (partial: { slope?: number; rainfall?: number; soil?: number }) => void
  simulateSensorSpike: () => void
  dismissNotification: (id: string) => void
  pushNotice: (tone: AppNotification["tone"], message: string) => void
  resetToDefaultRegion: () => void
}

const DisasterContext = createContext<DisasterStore | null>(null)

export function DisasterProvider({ children }: { children: ReactNode }) {
  const [selectedRegion, setSelectedRegion] = useState<RegionProfile>(() => cloneRegion(DEFAULT_REGION))
  const [activeLanguage, setActiveLanguageState] = useState<Language>("en")
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>(SEED_INCIDENTS)
  const [offlineQueue, setOfflineQueue] = useState<IncidentReport[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [gpsOverride, setGpsOverride] = useState<{ lat: number; lon: number } | null>(null)
  const [flyToken, setFlyToken] = useState(0)
  const [liveWeather, setLiveWeather] = useState<LiveWeatherReport | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
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
    if (saved === "en" || saved === "hi" || saved === "as") {
      setActiveLanguageState(saved)
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
          if (prev.elevation === report.elevation) return prev
          return { ...prev, elevation: report.elevation }
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
    setSelectedRegion(cloneRegion(region))
    setGpsOverride(null)
    setFlyToken((n) => n + 1)
  }, [])

  const selectCustomLocation = useCallback(
    (label: string, lat: number, lon: number, state?: string) => {
      const terrain = synthesizeTerrainForCoords(lat, lon)
      const severity = severityFromTelemetry(terrain.slope, terrain.rainfall, terrain.soil)
      const dynamicProfile: RegionProfile = {
        id: `epicenter-${lat.toFixed(4)}-${lon.toFixed(4)}`,
        name: label,
        district: label,
        state: state || "North Eastern Region",
        city: label,
        coords: [lat, lon],
        slope: terrain.slope,
        rainfall: terrain.rainfall,
        soil: terrain.soil,
        elevation: terrain.elevation,
        severity,
        advice: ACTION_LABEL[severity],
        status: {
          en: `${severity} — spatial terrain evaluation`,
          hi: `${ACTION_LABEL[severity].hi} — भू-स्थानिक मूल्यांकन`,
          as: `${ACTION_LABEL[severity].as} — স্থানিক ভূ-খণ্ড মূল্যায়ন`,
        },
        aliases: [label.toLowerCase()],
      }
      setSelectedRegion(dynamicProfile)
      setGpsOverride({ lat, lon })
      setFlyToken((n) => n + 1)
      pushNotice("success", `Epicenter locked: ${label} [${lat.toFixed(3)}°, ${lon.toFixed(3)}°]`)
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

  const updateTelemetry = useCallback((partial: { slope?: number; rainfall?: number; soil?: number }) => {
    setSelectedRegion((prev) => {
      const slope = partial.slope ?? prev.slope
      const rainfall = partial.rainfall ?? prev.rainfall
      const soil = partial.soil ?? prev.soil
      const severity = severityFromTelemetry(slope, rainfall, soil)
      return {
        ...prev,
        slope,
        rainfall,
        soil,
        severity,
        advice: ACTION_LABEL[severity],
        status: {
          en: `${severity} — live telemetry`,
          hi: `${ACTION_LABEL[severity].hi} — लाइव टेलीमेट्री`,
          as: `${ACTION_LABEL[severity].as} — লাইভ টেলিমেট্ৰি`,
        },
      }
    })
  }, [])

  const simulateSensorSpike = useCallback(() => {
    setSelectedRegion((prev) => {
      const rainfall = prev.rainfall + 60
      const severity = escalateAfterRainSpike(prev.severity)
      return {
        ...prev,
        rainfall,
        soil: Math.min(100, prev.soil + 8),
        severity,
        advice: ACTION_LABEL[severity],
        status: {
          en: `${severity} — rainfall spike +60mm`,
          hi: `${ACTION_LABEL[severity].hi} — वर्षा स्पाइक +60मिमी`,
          as: `${ACTION_LABEL[severity].as} — বৰষুণ স্পাইক +60মিমি`,
        },
      }
    })
    setFlyToken((n) => n + 1)
    pushNotice("danger", t(activeLanguage, "spikeNotice"))
  }, [activeLanguage, pushNotice])

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
      incidentReports,
      offlineQueue,
      visibleIncidents,
      notifications,
      gpsOverride,
      flyToken,
      liveWeather,
      weatherLoading,
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
    }),
    [
      selectedRegion,
      activeLanguage,
      isOfflineMode,
      incidentReports,
      offlineQueue,
      visibleIncidents,
      notifications,
      gpsOverride,
      flyToken,
      liveWeather,
      weatherLoading,
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
