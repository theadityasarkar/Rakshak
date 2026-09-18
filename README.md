# 🛡️ NER-Rakshak (एनईआर-रक्षक)
### AI-Powered Landslide & Risk Early Warning System for the North Eastern Region
**Smart India Hackathon · Problem Statement 26001 (Ministry of Development of North Eastern Region — MDoNER)**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-GIS_Maps-199900?style=flat-square&logo=leaflet)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 🏔️ Overview

The North Eastern Region (NER) of India comprises complex mountainous terrain with high tectonic fragility, steep slopes, and extreme monsoon precipitation. **NER-Rakshak** is an autonomous, mission-critical early warning command dashboard designed for state disaster management authorities (SDMA), SDRF/NDRF incident response units, and citizens.

It combines multi-source spatial telemetry, live Doppler weather radar, digital elevation models (DEM), and reactive machine-learning inference to compute high-resolution landslide vulnerability indices and trigger geotagged hazard evacuations.

---

## ✨ Key Features

### 1. 🗺️ Multi-Layer GIS Command Map
- **Live Doppler Weather Radar:** Real-time precipitation reflectivity tiles dynamically fetched from the RainViewer Doppler GIS network (`maxNativeZoom={7}`).
- **Topographic Elevation & Contours:** DEM hillshade contour layer powered by OpenTopoMap (`maxNativeZoom={14}`).
- **Interactive Layer Toggles & Filters:** 1-click toggling for Monitoring Stations, Live Field Incident Markers, Doppler Radar, and Dynamic Vulnerability Buffers.
- **On-Map Interactive Legend:** Instant visual guide explaining regional stations, severity tiers, and hazard flags.

### 2. ⚡ Reactive Spatial Telemetry & AI Risk Engine
- **Weighted Multi-Factor Scoring:** Real-time calculation balancing terrain slope ($41\%$), 24-hour cumulative rainfall ($32\%$), and soil pore-water saturation ($27\%$).
- **Dynamic Hazard Buffer Zones:** Automatic computation of evacuation buffer radii ($8\text{ km} - 16\text{ km}$) surrounding active epicenters.
- **Custom ML Endpoint Integration:** Toggle between internal reactive physics equations and external cloud ML models (e.g. Hugging Face Spaces / FastAPI REST endpoints).
- **Interactive Simulation Presets:** Instant testing using realistic presets (*Dry Summer Baseline*, *Monsoon Inflow Surge*, *Extreme Cloudburst*).

### 3. 📍 Comprehensive 8-State North Eastern Coverage
Full baseline geological profiles and telemetry for **31+ landslide-vulnerable mountain districts**:
- 🏔️ **Sikkim:** North Sikkim (Mangan / Teesta axis), East Sikkim (Gangtok / NH-10), South Sikkim (Namchi), West Sikkim (Gyalshing / Pelling)
- 🌧️ **Meghalaya:** East Khasi Hills (Shillong / NH-6), SW Khasi Hills (Mawsynram), West Khasi Hills (Nongstoin), West Jaintia Hills (Jowai), Ri-Bhoi (Nongpoh)
- 🌿 **Assam:** Kamrup Metropolitan (Guwahati), Dima Hasao (Haflong / railway ghats), Cachar (Silchar), Karbi Anglong (Diphu), Dibrugarh
- ⛰️ **Arunachal Pradesh:** Tawang (Sela Pass), West Kameng (Bomdila), Papum Pare (Itanagar), Lower Subansiri (Ziro)
- 🌲 **Nagaland:** Kohima (NH-29 sinking corridor), Phek (Tizu fault), Mokokchung, Dimapur
- 🌄 **Manipur:** Tamenglong (NH-37 Noney axis), Ukhrul (Shirui hills), Churachandpur, Imphal West
- 🎋 **Mizoram:** Aizawl (Ramhlun / Laipuitlang ridge), Lunglei, Champhai, Serchhip
- 🌾 **Tripura:** Dhalai (Ambassa / Atharamura range), West Tripura (Agartala), Gomati (Udaipur)

### 4. 🛰️ Geocoding & GPS Spatial Lock
- **Direct Coordinate Search:** Enter latitude/longitude pairs (`25.5788, 91.8933`) for immediate map flight.
- **OpenStreetMap Nominatim Geocoding:** Auto-complete search across villages, highways, and district landmarks.
- **Device GPS Locate:** Real-time browser geolocation with proximity-weighted regional sensor binding.

### 5. 📶 Offline-First Field Incident Reporting
- **PWA & IndexedDB Queue:** SDRF field personnel and citizens can capture geotagged incidents with photo evidence even during complete cellular/radio blackouts.
- **Auto Sync on Reconnect:** Queued reports automatically flush to the central command net when connectivity is restored.
- **Network Dropout Simulation:** Dedicated header toggle to test field-disconnected operations.

### 6. 🗣️ Multilingual SDRF Command Net
Seamless real-time interface localization across three key languages:
- **English** (Standard command operations)
- **हिन्दी** (National disaster coordination)
- **অসমীয়া** (Regional North-Eastern operations)

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

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.18 or higher recommended)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### Installation
```bash
# Clone the repository
git clone https://github.com/theadityasarkar/Rakshak.git

# Navigate into the project folder
cd Rakshak

# Install dependencies
pnpm install
```

### Running Locally
```bash
# Start Turbopack development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the command dashboard.

### Production Build
```bash
# Compile and optimize production bundle
pnpm build

# Start production server
pnpm start
```

---

## 📁 Repository Structure

```
ner-rakshak-dashboard/
├── app/
│   ├── globals.css           # Tailwind CSS v4 design tokens and custom animations
│   ├── layout.tsx            # Root HTML layout with metadata
│   └── page.tsx              # Main Command Dashboard layout grid
├── components/
│   ├── dashboard/
│   │   ├── header.tsx        # Command header, language switcher, offline toggle
│   │   ├── sidebar.tsx       # Regional overview, weather card, advisory details
│   │   ├── map-panel.tsx     # GIS map wrapper with layer toggles & legend
│   │   └── live-feed.tsx     # Real-time incident stream and sync status
│   └── ui/                   # Reusable UI component primitives (buttons, modals, selects)
├── src/
│   ├── components/
│   │   ├── RiskMap.tsx       # Leaflet GIS map with Doppler & DEM tile layers
│   │   ├── MapSearchBar.tsx  # GPS & Nominatim spatial search bar
│   │   ├── AreaDetailsModal.tsx # Full-screen district meteorological breakdown
│   │   ├── RiskAssessmentCard.tsx # Sliders, ML endpoint config, district picker
│   │   └── FieldIncidentModal.tsx # Geotagged hazard logging modal
│   ├── context/
│   │   └── DisasterContext.tsx # Central state management & IndexedDB sync
│   ├── data/
│   │   ├── ner-regions.ts    # 31+ North Eastern district telemetry profiles
│   │   └── seed-incidents.ts # Baseline field reports and road blockage alerts
│   └── lib/
│   │   ├── risk.ts           # Risk calculation algorithms & buffer math
│   │   └── i18n.ts           # Multilingual dictionary (EN, HI, AS)
├── public/                   # Static assets, icons, and report mock photos
├── package.json              # Project dependencies and build scripts
└── README.md                 # Project documentation
```

---

## 👥 Authors & Acknowledgments

- Developed for the **Smart India Hackathon (SIH)**.
- Ministry of Development of North Eastern Region (**MDoNER**).
- Weather data provided via [Open-Meteo](https://open-meteo.com/) and [RainViewer](https://www.rainviewer.com/).
- Topographic contour data provided via [OpenTopoMap](https://opentopomap.org/).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
