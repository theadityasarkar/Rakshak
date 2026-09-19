"use client"

import { useEffect, useState } from "react"
import { CloudRain, Info, Wifi, WifiOff, Globe, Check, DatabaseBackup, X, Cpu, RotateCcw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FieldIncidentModal } from "@/src/components/FieldIncidentModal"
import { SystemInfoPanel } from "@/src/components/SystemInfoPanel"
import { useDisaster } from "@/src/context/DisasterContext"
import { LANGUAGE_OPTIONS, t } from "@/src/lib/i18n"
import { checkBackendHealth, type HealthResponse } from "@/src/lib/api"

function useClock() {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setMounted(true)
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return mounted ? now : null
}

export function DashboardHeader() {
  const [mounted, setMounted] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const now = useClock()
  const {
    activeLanguage,
    setActiveLanguage,
    isOfflineMode,
    setOfflineMode,
    notifications,
    dismissNotification,
    offlineQueue,
    syncOfflineQueue,
    replayCycloneAmphan,
  } = useDisaster()

  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    setMounted(true)
    checkBackendHealth().then(setBackendHealth)
    const timer = setInterval(() => {
      checkBackendHealth().then(setBackendHealth)
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  const utc = now
    ? now.toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--"
  const ist = now
    ? now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--"

  return (
    <>
      <header
        className="relative flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#1A1918]/95 backdrop-blur-xl px-3 sm:px-5 z-20 select-none"
        suppressHydrationWarning
      >
        {/* Ambient warm glow line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* ── LEFT: Brand & Live Status ── */}
        <div className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3.5">
          {/* Logo icon */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#211F1E] border border-white/[0.08] shadow-xs">
            <CloudRain className="size-4 text-cyan-300" />
          </div>

          {/* Title block */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base font-semibold text-[#ECEAE6] whitespace-nowrap tracking-normal">
                Megh-Drishti
              </h1>
              {/* PS code — subtle mono text */}
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-[#A8A29A] whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-cyan-400" />
                PS 26078
              </span>
            </div>
            <p className="hidden md:block text-xs text-[#948E85] font-normal whitespace-nowrap">
              MoES · AI Weather Anomaly Engine
            </p>
          </div>

          {/* Microservice Status Tag */}
          <div className="hidden lg:flex 2xl:hidden items-center gap-2 rounded-full border border-white/[0.08] bg-[#211F1E] px-3 py-1 text-xs shrink-0">
            <span className="relative flex size-1.5">
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                  backendHealth?.status === "healthy"
                    ? "bg-emerald-400"
                    : backendHealth?.demo_mode
                      ? "bg-amber-400"
                      : "bg-cyan-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-1.5 rounded-full",
                  backendHealth?.status === "healthy"
                    ? "bg-emerald-500"
                    : backendHealth?.demo_mode
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                )}
              />
            </span>
            <span
              className={cn(
                "font-medium whitespace-nowrap",
                backendHealth?.status === "healthy"
                  ? "text-emerald-400"
                  : backendHealth?.demo_mode
                    ? "text-amber-300"
                    : "text-[#ECEAE6]"
              )}
            >
              {backendHealth?.demo_mode ? "Demo Mode" : "Microservice Active"}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-[#A8A29A] text-xs whitespace-nowrap">
              {backendHealth?.models?.tracker === "loaded" ? "GNN + Diffusion" : "0.1° Ensemble"}
            </span>
          </div>
        </div>

        {/* ── CENTER: NWP Status Pill (Only on extra wide screens) ── */}
        <div className="hidden 2xl:flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#211F1E] px-4 py-1.5 shrink-0 shadow-xs">
          <span className="relative flex size-1.5">
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                backendHealth?.status === "healthy"
                  ? "bg-emerald-400"
                  : backendHealth?.demo_mode
                    ? "bg-amber-400"
                    : "bg-cyan-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-1.5 rounded-full",
                backendHealth?.status === "healthy"
                  ? "bg-emerald-500"
                  : backendHealth?.demo_mode
                    ? "bg-amber-500"
                    : "bg-cyan-500"
              )}
            />
          </span>
          <span
            className={cn(
              "text-xs font-medium whitespace-nowrap",
              backendHealth?.status === "healthy"
                ? "text-emerald-400"
                : backendHealth?.demo_mode
                  ? "text-amber-300"
                  : "text-[#ECEAE6]"
            )}
          >
            {backendHealth?.demo_mode
              ? "FastAPI · Demo scenario mode"
              : backendHealth?.status === "healthy"
                ? "FastAPI microservice · Active"
                : "IMD / NCMRWF 12Z · Active"}
          </span>
          <span className="h-3 w-px bg-white/[0.08]" />
          <Cpu className="size-3.5 text-cyan-400" />
          <span className="text-xs text-[#A8A29A] whitespace-nowrap">
            {backendHealth?.models?.tracker === "loaded" ? "GNN + Diffusion loaded" : "0.1° Ensemble"}
          </span>
        </div>

        {/* ── RIGHT: Controls ── */}
        <div className="flex shrink-0 items-center gap-2">

          {/* About button */}
          <button
            type="button"
            onClick={() => setInfoPanelOpen(true)}
            title="About Megh-Drishti"
            className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#211F1E] text-[#A8A29A] hover:border-white/20 hover:text-[#ECEAE6] hover:bg-[#2A2725] transition-all shrink-0"
          >
            <Info className="size-3.5" />
          </button>

          {/* Replay Cyclone Amphan button */}
          <Button
            type="button"
            size="sm"
            onClick={replayCycloneAmphan}
            title={
              activeLanguage === "hi"
                ? "सुपर चक्रवात अम्फान (मई 2020) पूर्ण पाइपलाइन रीप्ले करें"
                : "Replay Super Cyclone Amphan (May 2020) full pipeline from cached data"
            }
            className="h-8 gap-1.5 border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:border-amber-400/50 text-xs font-medium px-2.5 shadow-sm shrink-0 whitespace-nowrap"
          >
            <RotateCcw className="size-3.5 text-amber-400 shrink-0" />
            <span className="hidden 2xl:inline">
              {activeLanguage === "hi" ? "अम्फान रीप्ले" : "Replay Cyclone Amphan"}
            </span>
            <span className="hidden sm:inline 2xl:hidden">
              {activeLanguage === "hi" ? "अम्फान" : "Amphan Replay"}
            </span>
          </Button>

          {/* Log Incident button */}
          <div className="shrink-0">
            <FieldIncidentModal />
          </div>

          {/* UTC / IST clock — wide screens (>= 1536px) only */}
          {mounted && (
            <div className="hidden 2xl:flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#211F1E] px-2.5 py-1 shrink-0">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-xs text-[#948E85]">UTC</span>
                <span className="text-xs font-normal tabular-nums text-[#ECEAE6]">{utc}</span>
              </div>
              <span className="h-3 w-px bg-white/[0.08]" />
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-xs text-emerald-500/80">IST</span>
                <span className="text-xs font-medium tabular-nums text-emerald-400">{ist}</span>
              </div>
            </div>
          )}

          {/* Live / Offline toggle */}
          <button
            type="button"
            onClick={() => setOfflineMode(!isOfflineMode)}
            title={isOfflineMode ? "Offline Buffer mode" : "Live Telemetry mode"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all shrink-0",
              isOfflineMode
                ? "border-red-500/40 bg-red-950/25 text-red-400 hover:border-red-500/70"
                : "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:border-emerald-500/60"
            )}
          >
            {isOfflineMode
              ? <WifiOff className="size-3.5 animate-pulse shrink-0" />
              : <Wifi className="size-3.5 shrink-0" />
            }
            <span className="hidden md:inline">{isOfflineMode ? "Offline" : "Live"}</span>
            <span className={cn("size-1.5 rounded-full shrink-0", isOfflineMode ? "bg-red-500" : "bg-emerald-400 animate-pulse")} />
          </button>

          {/* Offline sync button */}
          {offlineQueue.length > 0 && !isOfflineMode && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-sky-500/30 bg-sky-950/30 text-sky-300 hover:bg-sky-900/40 text-xs gap-1 font-medium"
              onClick={() => void syncOfflineQueue()}
            >
              <DatabaseBackup className="size-3.5" />
              <span className="hidden sm:inline">Sync</span>
              <span>({offlineQueue.length})</span>
            </Button>
          )}

          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-white/[0.08] bg-[#211F1E] hover:bg-[#2A2725] text-xs px-2.5 text-[#ECEAE6] gap-1.5 shadow-xs font-medium"
                />
              }
            >
              <Globe className="size-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-medium text-xs">
                {t(activeLanguage, LANGUAGE_OPTIONS.find((l) => l.code === activeLanguage)?.key ?? "english")}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-white/[0.08] bg-[#211F1E]/95 backdrop-blur-lg text-[#ECEAE6]">
              <DropdownMenuGroup>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setActiveLanguage(lang.code)}
                    className="text-xs font-medium focus:bg-[#2A2725]"
                  >
                    <span className="flex-1">{t(activeLanguage, lang.key)}</span>
                    {lang.code === activeLanguage && <Check className="size-3.5 text-emerald-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-14 z-[700] flex flex-col items-end gap-2 px-4 pt-2">
            {notifications.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "pointer-events-auto flex items-center gap-2 max-w-sm rounded-lg border px-3 py-2 text-xs shadow-2xl backdrop-blur-md",
                  note.tone === "warning" && "border-amber-500/50 bg-zinc-950/95 text-amber-300",
                  note.tone === "success" && "border-emerald-500/50 bg-zinc-950/95 text-emerald-300",
                  note.tone === "danger" && "border-red-500/50 bg-zinc-950/95 text-red-300",
                  note.tone === "info" && "border-sky-500/50 bg-zinc-950/95 text-sky-300",
                )}
              >
                <span className="flex-1 font-medium leading-snug">{note.message}</span>
                <button
                  type="button"
                  onClick={() => dismissNotification(note.id)}
                  className="rounded p-0.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Dismiss"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </header>

      <SystemInfoPanel open={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} />
    </>
  )
}
