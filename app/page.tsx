"use client"

import { useState } from "react"
import { Map, LayoutDashboard, Gauge, Radio } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MapPanel } from "@/components/dashboard/map-panel"
import { RightPanel } from "@/components/dashboard/right-panel"
import { cn } from "@/lib/utils"
import { useDisaster } from "@/src/context/DisasterContext"

type MobileTab = "map" | "overview" | "sliders" | "feed"

const MOBILE_TABS: { id: MobileTab; label: string; Icon: typeof Map }[] = [
  { id: "map", label: "Map", Icon: Map },
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "sliders", label: "AI Sliders", Icon: Gauge },
  { id: "feed", label: "Live Feed", Icon: Radio },
]

function MobileLayout() {
  const [activeTab, setActiveTab] = useState<MobileTab>("map")
  const { visibleIncidents, setActiveRightTab } = useDisaster()
  const criticalCount = visibleIncidents.filter((i) => i.severity === "Critical").length

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab)
    // Keep right panel tab in sync
    if (tab === "sliders") setActiveRightTab("sliders")
    if (tab === "feed") setActiveRightTab("feed")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <DashboardHeader />

      {/* Content area — fills remaining space above bottom tab bar */}
      <div className="relative flex-1 min-h-0 overflow-hidden">

        {/* MAP TAB */}
        <div className={cn("absolute inset-0", activeTab === "map" ? "flex flex-col" : "hidden")}>
          <MapPanel />
        </div>

        {/* OVERVIEW TAB (Sidebar content) */}
        <div className={cn("absolute inset-0 overflow-y-auto", activeTab === "overview" ? "block" : "hidden")}>
          <DashboardSidebar />
        </div>

        {/* AI SLIDERS + LIVE FEED TAB — rendered via RightPanel but with forced active tab */}
        <div className={cn("absolute inset-0 flex flex-col overflow-hidden", (activeTab === "sliders" || activeTab === "feed") ? "flex" : "hidden")}>
          <RightPanel />
        </div>
      </div>

      {/* Bottom Tab Bar — fixed to bottom, always visible */}
      <div className="shrink-0 flex items-stretch border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl pb-safe">
        {MOBILE_TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          const showBadge = id === "feed" && visibleIncidents.length > 0
          const showCriticalBadge = id === "map" && criticalCount > 0

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all active:scale-95",
                isActive
                  ? "text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {/* Active indicator line at top */}
              {isActive && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              )}

              <span className="relative">
                <Icon className={cn("size-5", isActive ? "text-emerald-400" : "text-zinc-500")} />
                {/* Notification badge */}
                {showBadge && !isActive && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-black">
                    {visibleIncidents.length > 9 ? "9+" : visibleIncidents.length}
                  </span>
                )}
                {showCriticalBadge && !isActive && criticalCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white animate-pulse">
                    {criticalCount}
                  </span>
                )}
              </span>

              <span className={cn("leading-none", isActive ? "text-emerald-400" : "text-zinc-500")}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DesktopLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <DashboardHeader />
      <div className="grid flex-1 min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[305px_1fr_395px] xl:grid-cols-[320px_1fr_425px]">
        {/* Left Sidebar */}
        <div className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <DashboardSidebar />
        </div>

        {/* Center Main Map Area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <MapPanel />
        </main>

        {/* Right Panel */}
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <RightPanel />
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <>
      {/* Mobile: show tab-based layout */}
      <div className="lg:hidden h-screen">
        <MobileLayout />
      </div>
      {/* Desktop: show original 3-column layout */}
      <div className="hidden lg:block h-screen">
        <DesktopLayout />
      </div>
    </>
  )
}
