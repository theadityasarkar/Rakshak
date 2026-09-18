"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<SliderPrimitive.Root.Props, "value" | "defaultValue" | "onValueChange"> {
  value?: number[] | number
  defaultValue?: number[] | number
  onValueChange?: (value: number | number[]) => void
  indicatorClassName?: string
  trackClassName?: string
  thumbClassName?: string
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  indicatorClassName,
  trackClassName,
  thumbClassName,
  onValueChange,
  ...props
}: SliderProps) {
  const valArray = Array.isArray(value)
    ? value
    : typeof value === "number"
      ? [value]
      : undefined

  const defaultArray = Array.isArray(defaultValue)
    ? defaultValue
    : typeof defaultValue === "number"
      ? [defaultValue]
      : undefined

  const count = valArray ? valArray.length : defaultArray ? defaultArray.length : 1

  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center py-1.5", className)}
      data-slot="slider"
      defaultValue={defaultArray}
      value={valArray}
      min={min}
      max={max}
      onValueChange={(newVal) => {
        if (!onValueChange) return
        if (Array.isArray(value) || Array.isArray(defaultValue)) {
          onValueChange(Array.isArray(newVal) ? newVal : [newVal])
        } else {
          onValueChange(Array.isArray(newVal) ? newVal[0] : newVal)
        }
      }}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none cursor-pointer py-1">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-800/90 shadow-inner select-none",
            trackClassName
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn("h-full rounded-full transition-all duration-150", indicatorClassName || "bg-emerald-500")}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: count }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={index}
            className={cn(
              "block size-4.5 shrink-0 rounded-full border-2 border-white bg-zinc-950 shadow-[0_0_8px_rgba(0,0,0,0.7)] transition-transform select-none hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-110 cursor-grab active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50",
              thumbClassName
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }

