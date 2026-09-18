"use client"

import { useEffect, useState } from "react"
import { CloudRain, Info, Wifi, WifiOff, Globe, Check, DatabaseBackup, X, Cpu } from "lucide-react"
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
  } = useDisaster()

  useEffect(() => {
    setMounted(true)
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
        className="relative flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl px-3 sm:px-5 z-20 select-none"
        suppressHydrationWarning
      >
        {/* Ambient glow line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {/* ── LEFT: Brand ── */}
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          {/* Logo icon */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 via-sky-600/25 to-indigo-700/20 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <CloudRain className="size-4 text-cyan-300" />
          </div>

          {/* Title block */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-white whitespace-nowrap">
                Megh-Drishti
              </h1>
              {/* PS badge — inline, only on sm+ */}
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-cyan-500/35 bg-cyan-950/50 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-400 tracking-wider whitespace-nowrap">
                <span className="size-1 rounded-full bg-cyan-400 animate-pulse" />
                PS 26078
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-zinc-500 font-medium tracking-wide whitespace-nowrap">
              MoES · AI Weather Anomaly Engine
            </p>
          </div>
        </div>

        {/* ── CENTER: NWP status pill (xl only) ── */}
        <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-3 py-1">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 whitespace-nowrap">
            IMD / NCMRWF 12Z · Active
          </span>
          <span className="h-3 w-px bg-zinc-700" />
          <Cpu className="size-3 text-cyan-500" />
          <span className="text-[10px] font-mono text-cyan-400 whitespace-nowrap">0.1° Ensemble</span>
        </div>

        {/* ── RIGHT: Controls ── */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

          {/* About button */}
          <button
            type="button"
            onClick={() => setInfoPanelOpen(true)}
            title="About Megh-Drishti"
            className="flex size-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-900/70 text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-zinc-800 transition-all"
          >
            <Info className="size-3.5" />
          </button>

          {/* Log Incident button */}
          <FieldIncidentModal />

          {/* UTC / IST clock — md+ only */}
          {mounted && (
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-2 py-1">
              <div className="flex items-center gap-1 font-mono">
                <span className="text-[9px] font-bold uppercase text-zinc-600">UTC</span>
                <span className="text-[11px] font-semibold tabular-nums text-zinc-300">{utc}</span>
              </div>
              <span className="h-3 w-px bg-zinc-800" />
              <div className="flex items-center gap-1 font-mono">
                <span className="text-[9px] font-bold uppercase text-emerald-600">IST</span>
                <span className="text-[11px] font-bold tabular-nums text-emerald-400">{ist}</span>
              </div>
            </div>
          )}

          {/* Live / Offline toggle */}
          <button
            type="button"
            onClick={() => setOfflineMode(!isOfflineMode)}
            title={isOfflineMode ? "Offline Buffer mode" : "Live Telemetry mode"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all",
              isOfflineMode
                ? "border-red-500/40 bg-red-950/25 text-red-400 hover:border-red-500/70"
                : "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:border-emerald-500/60"
            )}
          >
            {isOfflineMode
              ? <WifiOff className="size-3.5 animate-pulse" />
              : <Wifi className="size-3.5" />
            }
            <span className="hidden lg:inline">{isOfflineMode ? "Offline" : "Live"}</span>
            <span className={cn("size-1.5 rounded-full", isOfflineMode ? "bg-red-500" : "bg-emerald-400 animate-pulse")} />
          </button>

          {/* Offline sync button */}
          {offlineQueue.length > 0 && !isOfflineMode && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-sky-500/40 bg-sky-950/30 text-sky-300 hover:bg-sky-900/50 text-xs gap-1"
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
                  className="h-8 rounded-lg border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs px-2 text-zinc-200 gap-1 shadow-xs"
                />
              }
            >
              <Globe className="size-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-semibold text-[11px]">
                {t(activeLanguage, LANGUAGE_OPTIONS.find((l) => l.code === activeLanguage)?.key ?? "english")}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950/95 backdrop-blur-lg">
              <DropdownMenuGroup>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setActiveLanguage(lang.code)}
                    className="text-xs font-medium focus:bg-zinc-800"
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
