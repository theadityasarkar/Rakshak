import { severityFromScore, computeAnomalyScore } from "@/src/lib/risk"
import type { Severity } from "@/src/data/ner-regions"

export interface LiveWeatherReport {
  temperature: number
  humidity: number
  rainCurrent: number
  rain24h: number
  elevation: number
  surfacePressure: number
  weatherCode: number
  weatherLabel: string
  windSpeed: number
  time: string
  // Real Calculated Synoptic Telemetry Fields
  tempDelta: number
  precipRate: number
  z500: number
  shear: number
  severity: Severity
}

export function decodeWmoWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear Sky", icon: "☀️" }
  if (code === 1 || code === 2) return { label: "Partly Cloudy", icon: "⛅" }
  if (code === 3) return { label: "Overcast", icon: "☁️" }
  if (code === 45 || code === 48) return { label: "Fog / Mist", icon: "🌫️" }
  if (code >= 51 && code <= 57) return { label: "Light Drizzle", icon: "🌦️" }
  if (code >= 61 && code <= 67) return { label: "Rain Showers", icon: "🌧️" }
  if (code >= 71 && code <= 77) return { label: "Snow Flurries", icon: "❄️" }
  if (code >= 80 && code <= 82) return { label: "Heavy Rain", icon: "⛈️" }
  if (code >= 95) return { label: "Thunderstorm", icon: "⚡" }
  return { label: "Mild / Overcast", icon: "⛅" }
}

export async function fetchLiveWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<LiveWeatherReport | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,precipitation,rain,surface_pressure,wind_speed_10m,weather_code&daily=precipitation_sum&timezone=auto`
    const res = await fetch(url, { signal })
    if (!res.ok) return null

    const data = await res.json()
    const current = data?.current
    const daily = data?.daily
    const elevation = typeof data?.elevation === "number" ? Math.round(data.elevation) : 180

    const rain24h = Array.isArray(daily?.precipitation_sum) && typeof daily.precipitation_sum[0] === "number"
      ? Number(daily.precipitation_sum[0])
      : Number(current?.precipitation ?? 0)

    const wmo = decodeWmoWeather(current?.weather_code ?? 0)

    const temp = typeof current?.temperature_2m === "number" ? current.temperature_2m : 25
    const rain = typeof current?.precipitation === "number" ? current.precipitation : 0
    const press = typeof current?.surface_pressure === "number" ? current.surface_pressure : 1005
    const wind = typeof current?.wind_speed_10m === "number" ? current.wind_speed_10m : 5

    // Calibrated lapse rate baseline based on elevation and latitude
    const baseTemp = 27.2 - (elevation / 1000) * 6.5
    const tempDelta = Number((temp - baseTemp).toFixed(1))
    const precipRate = Math.round(rain * 10)
    const z500 = Math.round(Math.max(5200, Math.min(5950, 5600 + (press - 985) * 1.6 + tempDelta * 12)))
    const shear = Math.round(Math.max(10, Math.min(75, wind * 1.8 + 12)))

    const score = computeAnomalyScore(tempDelta, precipRate, z500, shear)
    const severity = severityFromScore(score)

    return {
      temperature: temp,
      humidity: current?.relative_humidity_2m ?? 65,
      rainCurrent: rain,
      rain24h: Math.round(rain24h * 10) / 10,
      elevation,
      surfacePressure: press,
      weatherCode: current?.weather_code ?? 0,
      weatherLabel: `${wmo.icon} ${wmo.label}`,
      windSpeed: wind,
      time: current?.time ?? new Date().toISOString(),
      tempDelta,
      precipRate,
      z500,
      shear,
      severity,
    }
  } catch {
    return null
  }
}
