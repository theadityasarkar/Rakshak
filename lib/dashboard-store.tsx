"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import {
  fieldReports as initialFieldReports,
  nerRiskMarkers as initialMarkers,
  type FieldReport,
  type LeafletRiskMarker,
  type NerDistrict,
} from "@/lib/dashboard-data"

interface DashboardStore {
  reports: FieldReport[]
  markers: LeafletRiskMarker[]
  addReport: (report: FieldReport, marker: LeafletRiskMarker) => void
  activeDistrict: NerDistrict | null
  selectDistrict: (district: NerDistrict) => void
  clearDistrict: () => void
}

const DashboardContext = createContext<DashboardStore | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<FieldReport[]>(initialFieldReports)
  const [markers, setMarkers] = useState<LeafletRiskMarker[]>(initialMarkers)
  const [activeDistrict, setActiveDistrict] = useState<NerDistrict | null>(null)

  const addReport = useCallback((report: FieldReport, marker: LeafletRiskMarker) => {
    setReports((prev) => [report, ...prev])
    setMarkers((prev) => [marker, ...prev])
  }, [])

  const selectDistrict = useCallback((district: NerDistrict) => {
    setActiveDistrict(district)
  }, [])

  const clearDistrict = useCallback(() => setActiveDistrict(null), [])

  const value = useMemo(
    () => ({ reports, markers, addReport, activeDistrict, selectDistrict, clearDistrict }),
    [reports, markers, addReport, activeDistrict, selectDistrict, clearDistrict],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardStore() {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error("useDashboardStore must be used within a DashboardProvider")
  }
  return ctx
}
