"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  ShieldAlert,
  Clock,
  Percent,
  CircleDot,
  Radio,
  AlertTriangle,
  RotateCw,
  Info,
  MapPin,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDisaster } from "@/src/context/DisasterContext"
import { evaluateAlertZone, type AlertEvaluationResult } from "@/src/lib/api"
import { t } from "@/src/lib/i18n"

export function SubgridAlertCard() {
  const { selectedRegion, activeLanguage } = useDisaster()
  const [evaluation, setEvaluation] = useState<AlertEvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const lat = selectedRegion.coords[0]
  const lon = selectedRegion.coords[1]

  const fetchEvaluation = useCallback(async () => {
    setLoading(true)
    try {
      const res = await evaluateAlertZone(lat, lon, 5.0)
      if (res) setEvaluation(res)
    } finally {
      setLoading(false)
    }
  }, [lat, lon])

  useEffect(() => {
    void fetchEvaluation()
  }, [fetchEvaluation])

  const primaryAlert = evaluation?.matched_alerts?.[0]
  const imdCat = evaluation?.overall_imd_category || primaryAlert?.imd_category || "ORANGE"
  const imdColor = evaluation?.overall_imd_color || primaryAlert?.imd_color_code || "#f97316"
  const leadTime = primaryAlert?.lead_time_hours ?? 24
  const prob = primaryAlert?.probability_pct ?? 82.0

  const actionText =
    activeLanguage === "hi" && evaluation?.primary_action_hi
      ? evaluation.primary_action_hi
      : evaluation?.primary_action ||
        (activeLanguage === "hi" && primaryAlert?.action_hi
          ? primaryAlert.action_hi
          : primaryAlert?.action_recommended ||
            "MoES/NDMA: Maintain continuous meteorological monitoring.")

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#211F1E] p-4 shadow-xl backdrop-blur space-y-3.5 text-[#ECEAE6]">
      {/* Header: Title, IMD Badge, and Refresh */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 items-center justify-center rounded-lg border shadow-xs"
            style={{
              backgroundColor: `${imdColor}18`,
              borderColor: `${imdColor}40`,
              color: imdColor,
            }}
          >
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-semibold text-[#ECEAE6]">
                {t(activeLanguage, "subgridAlertTitle") || "5km Subgrid Early Warning"}
              </span>
              <span className="text-xs font-mono font-medium text-sky-400">
                {t(activeLanguage, "fiveKmRadius")}
              </span>
            </div>
            <p className="text-xs text-[#948E85] truncate max-w-[200px] xs:max-w-[240px]">
              {selectedRegion.city || selectedRegion.name} · {selectedRegion.state}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEvaluation}
          disabled={loading}
          title={activeLanguage === "hi" ? "5 किमी जोखिम दायरा पुनर्मूल्यांकन" : "Re-evaluate 5km Hazard Radius"}
          className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#2A2725] text-[#A8A29A] hover:text-[#ECEAE6] transition-colors disabled:opacity-50"
        >
          <RotateCw className={cn("size-3.5", loading && "animate-spin text-sky-400")} />
        </button>
      </div>

      {/* Primary Status Banner: IMD Warning Level */}
      <div
        className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium"
        style={{
          backgroundColor: `${imdColor}15`,
          borderColor: `${imdColor}40`,
          color: imdColor,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span
              className="absolute inline-flex size-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: imdColor }}
            />
            <span
              className="relative inline-flex size-2 rounded-full"
              style={{ backgroundColor: imdColor }}
            />
          </span>
          <span className="font-semibold">{activeLanguage === "hi" ? `आईएमडी ${imdCat} चेतावनी` : `IMD ${imdCat} Warning`}</span>
        </div>
        <span className="text-xs font-medium text-[#ECEAE6]">
          {imdCat === "RED"
            ? t(activeLanguage, "takeAction")
            : imdCat === "ORANGE"
              ? t(activeLanguage, "bePrepared")
              : t(activeLanguage, "beUpdated")}
        </span>
      </div>

      {/* Grid: 5km Radius, Lead Time, Probability */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-white/[0.08] bg-[#2A2725]/70 p-2.5 space-y-1">
          <div className="flex items-center gap-1 text-xs text-[#948E85]">
            <CircleDot className="size-3 text-sky-400" />
            <span>{t(activeLanguage, "radius")}</span>
          </div>
          <div className="text-base font-semibold text-[#ECEAE6] font-mono">5.0 km</div>
          <div className="text-xs text-[#948E85]">{t(activeLanguage, "subgridCell")}</div>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-[#2A2725]/70 p-2.5 space-y-1">
          <div className="flex items-center gap-1 text-xs text-[#948E85]">
            <Clock className="size-3 text-amber-400" />
            <span>{t(activeLanguage, "leadTime")}</span>
          </div>
          <div className="text-base font-semibold text-amber-300 font-mono">T+{leadTime}h</div>
          <div className="text-xs text-[#948E85]">{t(activeLanguage, "mediumRange")}</div>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-[#2A2725]/70 p-2.5 space-y-1">
          <div className="flex items-center gap-1 text-xs text-[#948E85]">
            <Percent className="size-3 text-emerald-400" />
            <span>{t(activeLanguage, "probability")}</span>
          </div>
          <div className="text-base font-semibold text-emerald-400 font-mono">{prob}%</div>
          <div className="text-xs text-[#948E85]">{t(activeLanguage, "ensembleConf")}</div>
        </div>
      </div>

      {/* Recommended Emergency Action */}
      <div className="rounded-lg border border-white/[0.08] bg-[#2A2725]/80 p-3 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
          <AlertTriangle className="size-3.5" />
          <span>{t(activeLanguage, "emergencyDirective")} (MoES / NDMA)</span>
        </div>
        <p className="text-xs leading-relaxed text-[#ECEAE6]">
          {actionText}
        </p>
      </div>

      {/* Footer / Provenance */}
      <div className="flex items-center justify-between pt-1 text-xs font-mono text-[#948E85]">
        <span>Provenance: {evaluation?.provenance || "moes_cap_v1"}</span>
        <span>Lat: {lat.toFixed(2)}° · Lon: {lon.toFixed(2)}°</span>
      </div>
    </div>
  )
}
