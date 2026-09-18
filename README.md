# 🌩️ Megh-Drishti (मेघ-दृष्टि)
### AI-Driven Spatio-Temporal Tracking of Extreme Weather Anomalies in Medium-Range Forecasts
**Smart India Hackathon · Problem Statement SIH26078 (Ministry of Earth Sciences — MoES)**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-GIS_Maps-199900?style=flat-square&logo=leaflet)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## ⚡ Overview

**Megh-Drishti** is an autonomous, mission-critical meteorological command engine engineered for the Ministry of Earth Sciences (MoES), IMD/NCMRWF, state disaster management authorities (SDMA), and NDRF quick-response units.

The system tracks, evaluates, and alerts on medium-range extreme weather anomalies across India by reconciling multi-model spatial divergence (GFS/ECMWF), live Doppler precipitation weather radar, 3D topographic DEM relief, and in-browser live physics calculations.

$$\text{Score} = 0.35 \times \frac{|\Delta T|}{15} + 0.35 \times \frac{\text{PrecipRate}}{120} + 0.15 \times \frac{|Z_{500} - 5600|}{350} + 0.15 \times \frac{\text{Shear}}{75}$$

---

## ✨ High-Impact Weather Anomaly Hubs

1. **Brahmaputra Valley (Assam/Guwahati) — `[26.1445, 91.7362]`**
   - *Phenomenon:* Mesoscale Convective Cloudburst Anomaly
   - *Telemetry:* $\Delta T = +4.2^\circ\text{C}$, Precip Rate $= 85\text{ mm/hr}$, $Z_{500} = 5820\text{ gpm}$, Shear $= 52\text{ kts}$
   - *Severity:* Severe Climatological Anomaly ($88\%$ Index)
   - *Advisory:* Pre-deploy SDRF/NDRF along vulnerable riverine basins. Flash flood probability high.

2. **Konkan Coastal Belt (Mumbai Offshore) — `[19.0760, 72.8777]`**
   - *Phenomenon:* Offshore Trough & Extreme Monsoon Depression
   - *Telemetry:* $\Delta T = -2.5^\circ\text{C}$, Precip Rate $= 110\text{ mm/hr}$, $Z_{500} = 5690\text{ gpm}$, Shear $= 64\text{ kts}$
   - *Severity:* Critical Synoptic Alert ($92\%$ Index)
   - *Advisory:* Issue coastal marine warnings. High urban runoff and waterlogging alert.

3. **North-West Plains (Bikaner / Churu) — `[28.0229, 73.3119]`**
   - *Phenomenon:* Severe Synoptic Heatwave Ridge
   - *Telemetry:* $\Delta T = +8.6^\circ\text{C}$, Precip Rate $= 0\text{ mm/hr}$, $Z_{500} = 5910\text{ gpm}$, Shear $= 15\text{ kts}$
   - *Severity:* Severe Heat Hazard ($79\%$ Index)
   - *Advisory:* Issue Red Heatwave Alert. Agricultural and grid cooling load peak advisory.

4. **Bay of Bengal Arc (Puri Coast) — `[19.8135, 85.8312]`**
   - *Phenomenon:* Deep Cyclonic Vorticity Depression
   - *Telemetry:* $\Delta T = -3.8^\circ\text{C}$, Precip Rate $= 75\text{ mm/hr}$, $Z_{500} = 5580\text{ gpm}$, Shear $= 58\text{ kts}$
   - *Severity:* High Cyclonic Watch ($74\%$ Index)
   - *Advisory:* Total suspension of artisanal fishing. Port warning signal level IV.

5. **Western Himalaya (Shimla / Kullu) — `[31.1048, 77.1734]`**
   - *Phenomenon:* Western Disturbance Cold Core Vortex
   - *Telemetry:* $\Delta T = -7.4^\circ\text{C}$, Precip Rate $= 45\text{ mm/hr}$, $Z_{500} = 5380\text{ gpm}$, Shear $= 42\text{ kts}$
   - *Severity:* Moderate Anomaly ($55\%$ Index)
   - *Advisory:* Heavy snowfall and localized freeze alerts along high-altitude transit passes.

---

## 🎯 Architecture & Capabilities

### 1. 🗺️ Multi-Layer GIS Command Map & Dynamic Influence Buffer
- **OpenStreetMap Dark/Voyager Tiles:** Clean, dark-mode cartography without watermarks.
- **Live Doppler Weather Radar:** Real-time precipitation reflectivity tiles from RainViewer API.
- **Topographic DEM Relief:** 3D hillshade and OpenTopo contour layers.
- **Smooth Flight (`map.flyTo`):** Dynamic camera fly-to target with zoom level `9` and duration `1.5s`.
- **Dynamic Anomaly Influence Radius:** Dynamic circular buffer ($30\text{ km} - 60\text{ km}$) surrounding the Spatio-Temporal Anomaly Core.

### 2. ⚡ In-Browser Live Physics Calculation & Adaptive Sliders
- **Thermal Anomaly $\Delta$:** Slider range $-10^\circ\text{C}$ to $+15^\circ\text{C}$.
- **Precipitation Surge Rate:** Slider range $0$ to $120\text{ mm/hr}$.
- **$Z_{500}$ Synoptic Geopotential Field:** Slider range $5200$ to $5950\text{ gpm}$.
- **Vertical Wind Shear:** Slider range $10$ to $75\text{ kts}$.
- **Dynamic Severity Tiers:**
  - $\text{Score} \ge 0.70$ ➔ **Severe Climatological Anomaly / Critical Alert** (Red Badge)
  - $\text{Score } 0.40 - 0.69$ ➔ **Moderate Synoptic Perturbation** (Amber Badge)
  - $\text{Score} < 0.40$ ➔ **Synoptically Stable** (Emerald Badge)
- **Dynamic MoES Advisory Strip:** Real-time generation of actionable operational directives.

### 3. 📶 Offline-First Resilient Telemetry Queue
- **IndexedDB Sync:** Field incident and anomaly logging functions seamlessly during communication blackouts.
- **Automatic Sync:** Flushes queued packets upon connectivity restoration.

### 4. 🗣️ Multilingual Command Net
- Standard operations in **English**, **हिन्दी**, and **অসমীয়া**.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5.7 (Strict Mode) |
| **UI & Styling** | React 19, Tailwind CSS v4, Radix/Base UI, Lucide Icons |
| **GIS & Mapping** | React Leaflet, Leaflet 1.9, OpenStreetMap, OpenTopoMap, RainViewer API |
| **Data & Cache** | IndexedDB, React Context API, Web Geolocation API |
| **Package Manager** | pnpm |

---

## 🚀 Getting Started

### Installation
```bash
# Clone the repository
git clone https://github.com/theadityasarkar/Rakshak.git
cd Rakshak

# Install dependencies
pnpm install

# Start Turbopack development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
# Compile and optimize production bundle
pnpm build

# Start production server
pnpm start
```

---

## 👥 Authors & Acknowledgments

- Developed for the **Smart India Hackathon (SIH)**.
- Ministry of Earth Sciences (**MoES PS 26078**).
- Meteorological radar and telemetry provided via [Open-Meteo](https://open-meteo.com/) and [RainViewer](https://www.rainviewer.com/).
- Topographic elevation data provided via [OpenTopoMap](https://opentopomap.org/) and Esri.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
