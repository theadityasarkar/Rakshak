"use client"

import React, { useMemo } from "react"
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Compass,
  Layers,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDisaster } from "@/src/context/DisasterContext"

const DAY_TICKS = [
  { hour: 0, label: "T+0h (Live)" },
  { hour: 24, label: "+1D" },
  { hour: 48, label: "+2D" },
  { hour: 72, label: "+3D" },
  { hour: 96, label: "+4D" },
  { hour: 120, label: "+5D" },
  { hour: 168, label: "+7D" },
  { hour: 216, label: "+9D" },
  { hour: 240, label: "+10D" },
]

export function TimelineScrubber() {
  const {
    timelineHour,
    setTimelineHour,
    isPlayingTimeline,
    togglePlayTimeline,
    stepTimeline,
    ensemblePercentile,
    setEnsemblePercentile,
    isSwipeComparatorActive,
    setIsSwipeComparatorActive,
    activeLanguage,
  } = useDisaster()

  const dayLabel = useMemo(() => {
    if (timelineHour === 0) return activeLanguage === "hi" ? "T+0h · लाइव कोर" : "T+0h · Live Synoptic Core"
    const days = (timelineHour / 24).toFixed(timelineHour % 24 === 0 ? 0 : 1)
    return activeLanguage === "hi"
      ? `T+${timelineHour}h · +${days} दिन क्षितिज`
      : `T+${timelineHour}h · +${days} Days Horizon`
  }, [timelineHour, activeLanguage])

  const pressureLevel = useMemo(() => {
    if (timelineHour === 0) return activeLanguage === "hi" ? "925 hPa (सतह कोर)" : "925 hPa (Surface Core)"
    if (timelineHour <= 24) return activeLanguage === "hi" ? "850 hPa (सीमा स्तर)" : "850 hPa (Boundary Layer)"
    if (timelineHour <= 72) return activeLanguage === "hi" ? "700 hPa (मध्य क्षोभमंडल)" : "700 hPa (Mid-Troposphere)"
    if (timelineHour <= 144) return activeLanguage === "hi" ? "500 hPa (सिनॉप्टिक स्टीयरिंग)" : "500 hPa (Synoptic Steering)"
    return activeLanguage === "hi" ? "250 hPa (जेट स्ट्रीम स्तर)" : "250 hPa (Jet Streak Level)"
  }, [timelineHour, activeLanguage])

  return (
    <div className="pointer-events-auto relative w-full border-t border-white/[0.08] bg-[#1A1918]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
      {/* Top row: Metrics bar, Ensemble toggles, and Comparator trigger */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.08] pb-2 text-xs">
        {/* Left: Time status & 4D forecast metadata */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-md bg-indigo-950/50 border border-indigo-500/30 px-2.5 py-0.5 text-indigo-300 font-mono font-medium text-xs">
            <Activity className="size-3.5 text-indigo-400 animate-pulse" />
            <span>{dayLabel}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[#A8A29A] border border-white/[0.08] rounded-md px-2 py-0.5 bg-[#211F1E]">
            <span className="text-[#948E85]">{activeLanguage === "hi" ? "ऊंचाई:" : "Altitude:"}</span>
            <span className="text-sky-400 font-medium">{pressureLevel}</span>
          </div>

          <span className="hidden md:inline text-xs text-[#948E85] font-mono">
            {activeLanguage === "hi" ? "3 घंटे अंतराल (81 वेपॉइंट्स · MoES/NCMRWF)" : "3h Step (81 Waypoints · MoES/NCMRWF)"}
          </span>
        </div>

        {/* Center/Right: Ensemble View (p10 / p50 / p90) & Swipe Comparator Button */}
        <div className="flex items-center gap-2">
          {/* Ensemble Member Toggle */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#211F1E] p-0.5 text-xs">
            <span className="px-2 text-[#948E85] font-mono hidden xs:inline">
              {activeLanguage === "hi" ? "एन्सेम्बल:" : "Ensemble:"}
            </span>
            <button
              type="button"
              onClick={() => setEnsemblePercentile("p10")}
              className={cn(
                "rounded px-2 py-0.5 font-mono font-medium transition-all text-xs",
                ensemblePercentile === "p10"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                  : "text-[#A8A29A] hover:text-[#ECEAE6]"
              )}
              title="10th Percentile — Conservative lower envelope"
            >
              p10
            </button>
            <button
              type="button"
              onClick={() => setEnsemblePercentile("p50")}
              className={cn(
                "rounded px-2 py-0.5 font-mono font-medium transition-all text-xs",
                ensemblePercentile === "p50"
                  ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-xs"
                  : "text-[#A8A29A] hover:text-[#ECEAE6]"
              )}
              title="50th Percentile — Deterministic median centerline"
            >
              p50
            </button>
            <button
              type="button"
              onClick={() => setEnsemblePercentile("p90")}
              className={cn(
                "rounded px-2 py-0.5 font-mono font-medium transition-all text-xs",
                ensemblePercentile === "p90"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs"
                  : "text-[#A8A29A] hover:text-[#ECEAE6]"
              )}
              title="90th Percentile — Extreme convective envelope"
            >
              p90
            </button>
          </div>

          {/* 12km vs 5km Swipe Comparator Toggle */}
          <button
            type="button"
            onClick={() => setIsSwipeComparatorActive((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 shadow-md",
              isSwipeComparatorActive
                ? "border-purple-500/80 bg-purple-950/70 text-purple-200 ring-1 ring-purple-500/40"
                : "border-white/[0.08] bg-[#211F1E] text-[#ECEAE6] hover:border-purple-500/40 hover:text-purple-300"
            )}
            title={activeLanguage === "hi" ? "12 किमी NWP बनाम 5 किमी DDPM स्वाइप तुलना टॉगल करें" : "Toggle 12km NWP vs 5km DDPM Before/After Swipe Comparator"}
          >
            <SlidersHorizontal className="size-3.5 text-purple-400" />
            <span className="font-mono">{activeLanguage === "hi" ? "12 किमी ⇄ 5 किमी स्वाइप" : "12km ⇄ 5km Swipe"}</span>
            <span
              className={cn(
                "size-1.5 rounded-full",
                isSwipeComparatorActive ? "bg-purple-400 animate-pulse" : "bg-white/20"
              )}
            />
          </button>
        </div>
      </div>

      {/* Bottom row: Controls & Interactive timeline track */}
      <div className="mt-2 flex items-center gap-2.5">
        {/* Play/Pause & Step Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setTimelineHour(0)}
            title={activeLanguage === "hi" ? "T+0h लाइव कोर पर रीसेट करें" : "Reset to T+0h Live Core"}
            className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#211F1E] text-[#A8A29A] hover:bg-[#2A2725] hover:text-[#ECEAE6] transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => stepTimeline(-3)}
            disabled={timelineHour <= 0}
            title={activeLanguage === "hi" ? "3 घंटे पीछे जाएं (बायां तीर)" : "Step back 3 hours (Left Arrow)"}
            className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#211F1E] text-[#ECEAE6] hover:bg-[#2A2725] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>

          <button
            type="button"
            onClick={togglePlayTimeline}
            title={
              isPlayingTimeline
                ? activeLanguage === "hi" ? "रोकें (Space)" : "Pause (Space)"
                : activeLanguage === "hi" ? "4D पूर्वानुमान चलाएं (Space)" : "Play 4D Forecast Evolution (Space)"
            }
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border font-medium shadow-md transition-all active:scale-95",
              isPlayingTimeline
                ? "border-amber-500/70 bg-amber-950/70 text-amber-300"
                : "border-indigo-500/70 bg-indigo-950/70 text-indigo-300 hover:bg-indigo-900"
            )}
          >
            {isPlayingTimeline ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => stepTimeline(3)}
            disabled={timelineHour >= 240}
            title={activeLanguage === "hi" ? "3 घंटे आगे बढ़ें (दायां तीर)" : "Step forward 3 hours (Right Arrow)"}
            className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#211F1E] text-[#ECEAE6] hover:bg-[#2A2725] disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Timeline Slider Track */}
        <div className="relative flex-1 flex flex-col justify-center px-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={240}
              step={3}
              value={timelineHour}
              onChange={(e) => setTimelineHour(Number(e.target.value))}
              aria-label="4D Weather Forecast Timeline Scrubber"
              className="w-full h-2 rounded-lg bg-[#2A2725] appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Day Ticks / Labels */}
          <div className="mt-1.5 flex justify-between px-0.5 text-xs font-mono text-[#948E85] select-none">
            {DAY_TICKS.map((t) => {
              const isActive = Math.abs(timelineHour - t.hour) <= 6
              return (
                <button
                  key={t.hour}
                  type="button"
                  onClick={() => setTimelineHour(t.hour)}
                  className={cn(
                    "hover:text-[#ECEAE6] transition-colors cursor-pointer",
                    isActive ? "text-indigo-300 font-semibold" : "text-[#948E85]"
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Keyboard shortcut guide badge */}
        <div className="hidden lg:flex items-center gap-1 font-mono text-xs text-[#948E85] border border-white/[0.08] rounded-md px-2.5 py-1 bg-[#211F1E] shrink-0">
          <kbd className="rounded bg-[#2A2725] px-1.5 py-0.5 text-[#ECEAE6]">◀</kbd>
          <kbd className="rounded bg-[#2A2725] px-1.5 py-0.5 text-[#ECEAE6]">▶</kbd>
          <span>±3h</span>
          <span className="text-white/20">·</span>
          <kbd className="rounded bg-[#2A2725] px-1.5 py-0.5 text-[#ECEAE6]">Space</kbd>
          <span>{activeLanguage === "hi" ? "चलाएं" : "Play"}</span>
        </div>
      </div>
    </div>
  )
}
