import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MapPanel } from "@/components/dashboard/map-panel"
import { LiveFeed } from "@/components/dashboard/live-feed"
import { RiskAssessmentCard } from "@/src/components/RiskAssessmentCard"

export default function Page() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <DashboardHeader />
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr_360px]">
        {/* Left Sidebar (Overview, Weather, Advisories) */}
        <div className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <DashboardSidebar />
        </div>

        {/* Center Main Map Area */}
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 min-h-0">
          <div className="lg:hidden">
            <DashboardSidebar />
          </div>
          <div className="min-h-[420px] flex-1">
            <MapPanel />
          </div>
        </main>

        {/* Right Sidebar (Live Feed & Risk Assessment) with full smooth scrolling */}
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto border-t border-zinc-800 p-4 pb-24 lg:border-t-0 lg:border-l">
          <div className="shrink-0 max-h-[300px] flex flex-col">
            <LiveFeed />
          </div>
          <div className="shrink-0">
            <RiskAssessmentCard />
          </div>
        </div>
      </div>
    </div>
  )
}
