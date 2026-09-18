"use client"

import { useEffect, useState } from "react"
import { Mountain, Wifi, WifiOff, Globe, Check, DatabaseBackup, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { FieldIncidentModal } from "@/src/components/FieldIncidentModal"
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

  if (!mounted) {
    return (
      <header
        className="relative flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6"
        suppressHydrationWarning
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 font-bold text-xs text-white">
            NR
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">NER-Rakshak</h1>
            <p className="truncate text-xs text-zinc-400">AI Landslide & Risk Early Warning System</p>
          </div>
        </div>
      </header>
    )
  }

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
    <header
      className="relative flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6"
      suppressHydrationWarning
    >
      <div className="flex min-w-0 items-center gap-3" suppressHydrationWarning>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white"
          suppressHydrationWarning
        >
          <Mountain className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">{t(activeLanguage, "title")}</h1>
          <p className="truncate text-xs text-zinc-400">{t(activeLanguage, "subtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <FieldIncidentModal />

        <div className="hidden flex-col items-end text-xs leading-tight sm:flex">
          <span className="font-mono tabular-nums">UTC {utc}</span>
          <span className="font-mono tabular-nums text-zinc-500">IST {ist}</span>
        </div>

        <label className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-300">
          {isOfflineMode ? <WifiOff className="size-3.5 text-red-400" /> : <Wifi className="size-3.5 text-emerald-400" />}
          <span className="hidden lg:inline">{t(activeLanguage, "simulateOffline")}</span>
          <Switch checked={isOfflineMode} onCheckedChange={setOfflineMode} />
        </label>

        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium",
            isOfflineMode
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
          )}
        >
          {isOfflineMode ? <WifiOff className="size-3.5" /> : <Wifi className="size-3.5" />}
          <span className="hidden sm:inline">
            {isOfflineMode ? t(activeLanguage, "offlineSync") : t(activeLanguage, "onlineSync")}
          </span>
        </div>

        {offlineQueue.length > 0 && !isOfflineMode ? (
          <Button type="button" size="sm" variant="outline" onClick={() => void syncOfflineQueue()}>
            <DatabaseBackup data-icon="inline-start" />
            {t(activeLanguage, "syncNow")} ({offlineQueue.length})
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Globe data-icon="inline-start" />
            <span className="hidden sm:inline">{t(activeLanguage, LANGUAGE_OPTIONS.find((l) => l.code === activeLanguage)?.key ?? "english")}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {LANGUAGE_OPTIONS.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => setActiveLanguage(lang.code)}>
                  <span className="flex-1">{t(activeLanguage, lang.key)}</span>
                  {lang.code === activeLanguage && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {notifications.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-[700] flex flex-col items-end gap-2 px-4 pt-2">
          {notifications.map((note) => (
            <div
              key={note.id}
              className={cn(
                "pointer-events-auto flex items-center gap-2 max-w-sm rounded-lg border px-3 py-2 text-xs shadow-2xl backdrop-blur-md transition-all",
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
  )
}
