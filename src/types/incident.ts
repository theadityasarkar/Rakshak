import type { IncidentType, Severity, SyncStatus } from "@/src/data/ner-regions"

export interface IncidentReport {
  id: string
  type: IncidentType
  locationLabel: string
  lat: number
  lon: number
  photo: string
  timestamp: string
  reporter: string
  severity: Severity
  syncStatus: SyncStatus
  regionId: string
}

export interface NewIncidentInput {
  type: IncidentType
  locationLabel: string
  lat: number
  lon: number
  photo: string
}

export interface AppNotification {
  id: string
  tone: "warning" | "success" | "info" | "danger"
  message: string
}
