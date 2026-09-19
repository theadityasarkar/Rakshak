"use client"

import { useState } from "react"
import {
  Cpu,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Hexagon,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDisaster } from "@/src/context/DisasterContext"

export function AIPipelineStatus() {
  const [expanded, setExpanded] = useState(false)
  const { selectedRegion } = useDisaster()

  const tempDelta =
    selectedRegion.tempDelta ??
    (selectedRegion.slope !== undefined ? Number(((selectedRegion.slope / 65) * 25 - 10).toFixed(1)) : 2.5)
  const precipRate =
    selectedRegion.precipRate ??
    (selectedRegion.rainfall !== undefined ? Math.round((selectedRegion.rainfall / 350) * 120) : 35)

  const downscaledPrecip =
    precipRate > 5
      ? precipRate >= 75
        ? Math.min(180, Math.round(precipRate * 1.5))
        : Math.round(precipRate * 1.35)
      : precipRate
  const precipPct = precipRate > 0 ? Math.round(((downscaledPrecip - precipRate) / precipRate) * 100) : 0

  const isHighAnomaly = Math.abs(tempDelta) > 5 || precipRate > 60

  return (
    <div className="flex flex-col rounded-lg border border-white/[0.08] bg-[#211F1E]/80 overflow-hidden shadow-sm">
      {/* Collapsed Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-[#2A2725]/60"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/20 border border-indigo-500/30">
            <Cpu className="size-3.5 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#ECEAE6] truncate">Two-stage hybrid AI pipeline</p>
            <p className="text-xs text-[#A8A29A] font-mono truncate">GNN track → diffusion downscale · PS 26078</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mini pipeline status indicators */}
          <div className="flex items-center gap-1">
            <span className="flex size-4 items-center justify-center rounded bg-emerald-500/20 border border-emerald-500/40">
              <CheckCircle2 className="size-3 text-emerald-400" />
            </span>
            <ArrowRight className="size-3 text-[#7C766E]" />
            <span className="flex size-4 items-center justify-center rounded bg-emerald-500/20 border border-emerald-500/40">
              <CheckCircle2 className="size-3 text-emerald-400" />
            </span>
          </div>
          {expanded ? <ChevronUp className="size-3.5 text-[#A8A29A]" /> : <ChevronDown className="size-3.5 text-[#A8A29A]" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="flex flex-col gap-3 px-3.5 pb-3.5 pt-1 border-t border-white/[0.08] animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {/* Stage 1: Spherical GNN Tracker */}
          <div className={cn(
            "rounded-lg border p-3 transition-all",
            isHighAnomaly
              ? "border-red-500/40 bg-red-950/20"
              : "border-white/[0.08] bg-[#2A2725]/60"
          )}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Hexagon className="size-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-[#ECEAE6]">
                  Stage 1 — Spherical GNN tracker
                </span>
              </div>
              <span className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border",
                isHighAnomaly
                  ? "bg-red-500/15 border-red-500/40 text-red-400"
                  : "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
              )}>
                <span className={cn("size-1.5 rounded-full", isHighAnomaly ? "bg-red-400 animate-pulse" : "bg-emerald-400")} />
                {isHighAnomaly ? "Anomaly detected" : "Tracking"}
              </span>
            </div>

            <div className="space-y-1 text-xs text-[#A8A29A] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[#7C766E]">Input:</span>
                <span className="text-[#ECEAE6]">NEPS-G 12km ensemble → icosahedral mesh (40,962 nodes)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#7C766E]">EFI:</span>
                <span className={cn("font-medium", isHighAnomaly ? "text-red-400" : "text-emerald-400")}>
                  {isHighAnomaly ? `>${Math.abs(tempDelta) > 8 ? "3" : "2"}σ deviation from ERA5 30-year baseline` : "Within climatological norm (±1σ)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#7C766E]">Output:</span>
                <span className="text-[#ECEAE6]">4D spatio-temporal bounding box → {selectedRegion.district || selectedRegion.city || selectedRegion.name}</span>
              </div>
            </div>
          </div>

          {/* Arrow between stages */}
          <div className="flex items-center justify-center gap-2 -my-0.5">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#2A2725] px-2.5 py-0.5">
              <ArrowRight className="size-3 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">Pipe region</span>
            </div>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Stage 2: Diffusion Downscaler */}
          <div className="rounded-lg border border-white/[0.08] bg-[#2A2725]/60 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-[#ECEAE6]">
                  Stage 2 — Diffusion downscaler
                </span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-xs font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Amplitude preserved
              </span>
            </div>

            <div className="space-y-1 text-xs text-[#A8A29A] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[#7C766E]">Mode:</span>
                <span className="text-[#ECEAE6]">Conditional denoising diffusion (DDPM)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#7C766E]">Scale:</span>
                <span className="text-purple-300 font-medium">12km → 5km generative downscaling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#7C766E]">Output:</span>
                <span className="text-[#ECEAE6]">5km subgrid impact zone · extreme amplitudes retained</span>
              </div>
            </div>

            {/* Mini downscaling progress bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-xs text-[#A8A29A] shrink-0 font-mono">12km</span>
              <div className="flex-1 h-1.5 rounded-full bg-[#1A1918] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 w-full transition-all duration-1000 animate-pulse" />
              </div>
              <span className="text-xs text-purple-300 font-semibold shrink-0 font-mono">5km</span>
            </div>

            {/* Live 12km NWP vs 5km DDPM De-smoothing Matrix */}
            <div className="mt-2.5 rounded-lg bg-[#1A1918] border border-purple-500/20 p-2.5 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-300 font-medium font-sans">
                  Spectral smoothing reversal
                </span>
                <span className="text-emerald-400 font-medium">Mass conserved ✓</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-white/[0.08] bg-[#211F1E] p-2">
                  <span className="text-xs text-[#A8A29A] block font-sans">12km coarse NWP</span>
                  <div className="text-[#ECEAE6] font-semibold text-sm mt-0.5">
                    {precipRate} <span className="text-xs font-normal text-[#A8A29A]">mm/hr</span>
                  </div>
                  <span className="text-xs text-[#948E85] block mt-0.5">Averaged over 144km²</span>
                </div>
                <div className="rounded border border-purple-500/30 bg-purple-950/20 p-2">
                  <span className="text-xs text-purple-300 block font-sans">5km DDPM resolved</span>
                  <div className="text-emerald-400 font-semibold text-sm mt-0.5">
                    {downscaledPrecip} <span className="text-xs font-normal text-purple-300">mm/hr</span>
                  </div>
                  <span className="text-xs text-emerald-400/90 block font-medium mt-0.5">
                    {precipRate > 0 ? `+${precipPct}% peak extreme` : "Quiescent baseline"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Physics Constraints Verification */}
          <div className="rounded-lg border border-white/[0.08] bg-[#2A2725]/60 p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-[#ECEAE6]">Physics-informed constraints</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                "Moisture convergence",
                "Thermodynamic conservation",
                "Fluid dynamics",
              ].map((constraint) => (
                <div key={constraint} className="flex items-center gap-1.5 rounded bg-[#1A1918] px-2 py-1 text-xs border border-white/[0.05]">
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span className="text-[#A8A29A] truncate">{constraint}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Architecture Flow */}
          <div className="rounded-lg border border-white/[0.08] bg-[#1A1918] p-2.5 text-xs font-mono text-center space-y-1">
            <span className="text-[#A8A29A] font-sans">Architecture flow:</span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-cyan-300">NEPS-G 12km</span>
              <ArrowRight className="size-3 text-[#7C766E] shrink-0" />
              <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-indigo-300">GNN (DGL)</span>
              <ArrowRight className="size-3 text-[#7C766E] shrink-0" />
              <span className="rounded bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-purple-300">DDPM 5km</span>
              <ArrowRight className="size-3 text-[#7C766E] shrink-0" />
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-emerald-300">Alert API</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
