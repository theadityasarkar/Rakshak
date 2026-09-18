export interface GeminiAdvisoryInput {
  locationName: string
  district?: string
  state?: string
  lat: number
  lon: number
  temp: number
  tempDelta: number
  precipRate: number
  z500: number
  shear: number
  hazardIndex: number
  weatherCondition: string
  elevation: number
}

export async function generateGeminiAdvisory(
  apiKey: string,
  input: GeminiAdvisoryInput,
): Promise<string> {
  const prompt = `You are the Chief Synoptic Meteorologist for the Ministry of Earth Sciences (MoES), Government of India, operating the Megh-Drishti AI Spatio-Temporal Extreme Weather Tracking Engine (Problem Statement PS 26078).
Generate a concise, high-impact meteorological advisory (3-4 sentences max) for the local disaster management authority based on the following real-time telemetry:

Sector: ${input.locationName}
District: ${input.district || "Local Sector"}, State: ${input.state || "India"}
Coordinates: ${input.lat.toFixed(4)}°N, ${input.lon.toFixed(4)}°E (Elevation: ${input.elevation}m ASL)
Real-time Temperature: ${input.temp}°C (Thermal Anomaly Δ: ${input.tempDelta > 0 ? "+" : ""}${input.tempDelta}°C)
Current Precipitation Surge Rate: ${input.precipRate} mm/hr
Z500 Synoptic Pressure Geopotential Height: ${input.z500} gpm
Vertical Wind Shear: ${input.shear} kts
Current Weather Condition: ${input.weatherCondition}
Spatio-Temporal Anomaly Hazard Index: ${input.hazardIndex}%

Instructions:
1. Provide a technical synoptic diagnosis of whether this sector faces risk of Cloudburst, Heatwave, Cyclonic Depression, or Stable Conditions.
2. State recommended administrative actions for District Emergency Operation Centres (DEOC).
3. Keep it formal, professional, and strictly under 60 words.`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 200,
      },
    }),
  })

  if (!res.ok) {
    const errJson = await res.json().catch(() => null)
    const msg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`
    throw new Error(msg)
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidate) {
    throw new Error("No text returned by Gemini API.")
  }

  return candidate.trim()
}
