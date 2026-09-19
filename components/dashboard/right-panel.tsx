"use client"

import { useState } from "react"
import { Gauge, Radio, Rows, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiveFeed } from "@/components/dashboard/live-feed"
import { RiskAssessmentCard } from "@/src/components/RiskAssessmentCard"
import { AIPipelineStatus } from "@/components/dashboard/ai-pipeline-status"
import { SubgridAlertCard } from "@/components/dashboard/subgrid-alert-card"
import { useDisaster } from "@/src/context/DisasterContext"

export function RightPanel() {
  const { visibleIncidents, activeRightTab, setActiveRightTab, activeLanguage } = useDisaster()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-white/[0.08] lg:border-t-0 lg:border-l bg-[#1A1918] text-[#ECEAE6]">
      {/* Top Navigation Tab Bar for Right Panel */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-3.5 py-2.5 bg-[#1A1918]/90 backdrop-blur">
        <div className="flex items-center gap-1 rounded-lg bg-[#211F1E] p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveRightTab("sliders")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeRightTab === "sliders"
                ? "bg-emerald-700/80 text-white shadow-xs font-semibold"
                : "text-[#A8A29A] hover:text-[#ECEAE6] hover:bg-[#2A2725]"
            )}
          >
            <Gauge className="size-3.5 text-emerald-300" />
            <span>{activeLanguage === "hi" ? "सिनॉप्टिक स्लाइडर्स" : "AI Synoptic Sliders"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRightTab("feed")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeRightTab === "feed"
                ? "bg-emerald-700/80 text-white shadow-xs font-semibold"
                : "text-[#A8A29A] hover:text-[#ECEAE6] hover:bg-[#2A2725]"
            )}
          >
            <Radio className="size-3.5 text-emerald-300" />
            <span>{activeLanguage === "hi" ? "लाइव रिपोर्ट" : "Live Reports"}</span>
            <span className="ml-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-xs font-mono text-emerald-300">
              {visibleIncidents.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveRightTab(activeRightTab === "split" ? "sliders" : "split")}
          title={activeLanguage === "hi" ? "विभाजित दृश्य टॉगल करें" : "Toggle Split Stack View"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors",
            activeRightTab === "split"
              ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
              : "border-white/[0.08] bg-[#211F1E] text-[#A8A29A] hover:text-[#ECEAE6]"
          )}
        >
          <Rows className="size-3.5 text-sky-400" />
          <span className="hidden sm:inline">
            {activeLanguage === "hi" ? "विभाजित" : "Split"}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-5 space-y-4">
        {activeRightTab === "sliders" && (
          <div className="animate-in fade-in-50 duration-200 space-y-4">
            <SubgridAlertCard />
            <AIPipelineStatus />
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
              <SubgridAlertCard />
            </div>
            <div className="shrink-0">
              <AIPipelineStatus />
            </div>
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
