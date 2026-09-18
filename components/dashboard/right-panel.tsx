"use client"

import { useState } from "react"
import { Gauge, Radio, Rows, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiveFeed } from "@/components/dashboard/live-feed"
import { RiskAssessmentCard } from "@/src/components/RiskAssessmentCard"
import { useDisaster } from "@/src/context/DisasterContext"

export function RightPanel() {
  const { visibleIncidents, activeRightTab, setActiveRightTab } = useDisaster()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-zinc-800 lg:border-t-0 lg:border-l bg-zinc-950">
      {/* Top Navigation Tab Bar for Right Panel */}
      <div className="shrink-0 flex items-center justify-between border-b border-zinc-800/80 px-3 py-2 bg-zinc-900/50 backdrop-blur">
        <div className="flex items-center gap-1 rounded-lg bg-zinc-950/80 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveRightTab("sliders")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              activeRightTab === "sliders"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <Gauge className="size-3.5 text-emerald-300" />
            <span>AI Synoptic Sliders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRightTab("feed")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              activeRightTab === "feed"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <Radio className="size-3.5 text-emerald-300" />
            <span>Live Reports</span>
            <span className="ml-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300">
              {visibleIncidents.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveRightTab(activeRightTab === "split" ? "sliders" : "split")}
          title="Toggle Split Stack View"
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border transition-colors",
            activeRightTab === "split"
              ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
          )}
        >
          <Rows className="size-3" />
          <span className="hidden sm:inline">Split</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 pb-4 space-y-4">
        {activeRightTab === "sliders" && (
          <div className="animate-in fade-in-50 duration-200">
            <RiskAssessmentCard />
          </div>
        )}

        {activeRightTab === "feed" && (
          <div className="animate-in fade-in-50 duration-200 h-full">
            <LiveFeed />
          </div>
        )}

        {activeRightTab === "split" && (
          <div className="animate-in fade-in-50 duration-200 space-y-4">
            <div className="shrink-0">
              <RiskAssessmentCard />
            </div>
            <div className="shrink-0 max-h-[360px] flex flex-col">
              <LiveFeed />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
