"use client"

import React from "react"
import { AlertOctagon, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSeverityConfig } from "@/src/lib/risk"
import type { Severity } from "@/src/data/ner-regions"

interface SeverityBadgeProps {
  severity: Severity
  className?: string
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
}

export function SeverityBadge({
  severity,
  className,
  showIcon = true,
  size = "md",
}: SeverityBadgeProps) {
  const config = getSeverityConfig(severity)

  const renderIcon = () => {
    const iconSizeClass = size === "sm" ? "size-3" : size === "lg" ? "size-4" : "size-3.5"
    switch (config.iconName) {
      case "AlertOctagon":
        return <AlertOctagon className={cn(iconSizeClass, config.iconClass, "shrink-0")} />
      case "AlertTriangle":
        return <AlertTriangle className={cn(iconSizeClass, config.iconClass, "shrink-0")} />
      case "ShieldAlert":
        return <ShieldAlert className={cn(iconSizeClass, config.iconClass, "shrink-0")} />
      case "CheckCircle2":
      default:
        return <CheckCircle2 className={cn(iconSizeClass, config.iconClass, "shrink-0")} />
    }
  }

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
    lg: "text-xs px-2.5 py-1 gap-1.5 font-semibold",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-semibold tracking-wide transition-colors",
        config.badgeClass,
        sizeClasses[size],
        className
      )}
      title={`Severity: ${config.label}`}
    >
      {showIcon && renderIcon()}
      <span className="truncate">{config.label}</span>
    </span>
  )
}
