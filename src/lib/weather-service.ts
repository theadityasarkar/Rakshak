export interface LiveWeatherReport {
  temperature: number
  humidity: number
  rainCurrent: number
  rain24h: number
  elevation: number
  weatherCode: number
  weatherLabel: string
  windSpeed: number
  time: string
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&daily=precipitation_sum&timezone=auto`
    const res = await fetch(url, { signal })
    if (!res.ok) return null

    const data = await res.json()
    const current = data?.current
    const daily = data?.daily
    const elevation = typeof data?.elevation === "number" ? Math.round(data.elevation) : 450

    const rain24h = Array.isArray(daily?.precipitation_sum) && typeof daily.precipitation_sum[0] === "number"
      ? Number(daily.precipitation_sum[0])
      : Number(current?.precipitation ?? 0)

    const wmo = decodeWmoWeather(current?.weather_code ?? 0)

    return {
      temperature: current?.temperature_2m ?? 21,
      humidity: current?.relative_humidity_2m ?? 65,
      rainCurrent: current?.precipitation ?? 0,
      rain24h: Math.round(rain24h * 10) / 10,
      elevation,
      weatherCode: current?.weather_code ?? 0,
      weatherLabel: `${wmo.icon} ${wmo.label}`,
      windSpeed: current?.wind_speed_10m ?? 8,
      time: current?.time ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}
