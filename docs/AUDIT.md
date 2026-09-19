# Megh-Drishti: Phase 0 Codebase & Scientific Integrity Audit

**Project:** SIH 2026 PS 26078 (MoES / NCMRWF)  
**Date:** September 19, 2026  
**Status:** Complete Audit (Phase 0)  
**Operating Standard:** Strictly following `AGENTS.md` rules and MoES scientific guidelines.

---

## 1. Technical Stack & Environment

| Layer | Technology & Version | Location / Config |
|---|---|---|
| **Framework** | Next.js 16.3.3 (Turbopack, App Router) | `package.json:19` |
| **Runtime / Language** | React 19.x, TypeScript 5.7.3, Node.js 24.x | `package.json:20,35` |
| **Package Manager** | `pnpm@12.3.4` | `package.json:5` |
| **Styling** | Tailwind CSS v4.3.3 (`@tailwindcss/postcss`) | `postcss.config.mjs`, `app/globals.css` |
| **UI Primitives** | Shadcn UI, Lucide React (1.16.0), Base UI (`@base-ui/react 1.5.0`) | `components/ui/*`, `package.json` |
| **Mapping Engine** | Leaflet 1.9.4, React-Leaflet 5.0.0 | `src/components/RiskMap.tsx` |
| **State Management** | React Context (`DisasterContext.tsx`) | `src/context/DisasterContext.tsx` |
| **Offline Storage** | IndexedDB (`idb-keyval` pattern) | `src/lib/indexeddb-queue.ts` |
| **External APIs** | Open-Meteo (forecast), RainViewer (Doppler radar tiles), Google Gemini Pro | `src/lib/weather-service.ts`, `src/lib/gemini-service.ts` |

---

## 2. Repository Structure

```
d:\Codes\Cursor\ner-rakshak-dashboard-development\
├── AGENTS.md                       # Non-negotiable operating rules
├── app/
│   ├── globals.css                 # Tailwind v4 theme, animations, dark mode tokens
│   ├── layout.tsx                  # Root layout with DisasterProvider & metadata
│   └── page.tsx                    # Main dashboard shell (Header, Sidebar, Map, Right Panel)
├── components/
│   ├── dashboard/
│   │   ├── ai-pipeline-status.tsx  # Two-Stage Hybrid AI visualizer (GNN + DDPM status)
│   │   ├── header.tsx              # Top command bar: PS 26078 brand, pipeline pill, clock, offline toggle
│   │   ├── map-panel.tsx           # GIS map container, search bar, layer toggles, legend
│   │   ├── right-panel.tsx         # Telemetry HUD container (AIPipelineStatus + RiskAssessmentCard)
│   │   ├── risk-card.tsx           # Re-export of RiskAssessmentCard
│   │   ├── sidebar.tsx             # Anomaly hubs list, filter scope, live critical feed
│   │   ├── live-feed.tsx           # Live alert list
│   │   ├── location-search-bar.tsx # Header location search input
│   │   └── field-report-modal.tsx  # Modal wrapper for incident reporting
│   └── ui/                         # Reusable design tokens (buttons, sliders, cards, modals)
├── src/
│   ├── components/
│   │   ├── RiskAssessmentCard.tsx  # Telemetry sliders, MoES action strip, Gemini briefing
│   │   ├── RiskMap.tsx             # Interactive Leaflet map, radar tiles, 4D trajectory, popups
│   │   ├── MapSearchBar.tsx        # Geo-search and coordinates fly-to handler
│   │   ├── AreaDetailsModal.tsx    # Sector inspection modal
│   │   ├── FieldIncidentModal.tsx  # Crowdsourced field incident logging
│   │   ├── IncidentDetailsModal.tsx# Incident inspector
│   │   └── SystemInfoPanel.tsx     # Technical architecture, equations, tech stack summary
│   ├── context/
│   │   └── DisasterContext.tsx     # Centralized state (selectedRegion, telemetry, incidents)
│   ├── data/
│   │   ├── ner-regions.ts          # Static dictionary of ~40 Indian anomaly stations & hubs
│   │   └── seed-incidents.ts       # 5 static incident records
│   ├── lib/
│   │   ├── risk.ts                 # Heuristic risk calculation formulas, terrain synthesizer
│   │   ├── weather-service.ts      # Open-Meteo external API integration
│   │   ├── gemini-service.ts       # Google Gemini LLM API client
│   │   ├── indexeddb-queue.ts      # Offline incident queue
│   │   └── i18n.ts                 # English / Hindi / Assamese localizations
│   └── types/
│       └── incident.ts             # TypeScript interfaces for incidents
└── docs/                           # Architecture, audit, and verification reports (this directory)
```

---

## 3. Data Flow & Subsystem Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │               User Interaction               │
                               │  - Select Station in Sidebar/Search          │
                               │  - Drag Telemetry Sliders in Right Panel     │
                               │  - Click Map / Waypoint / Incident Marker    │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           DisasterContext.tsx                │
                               │  - selectedRegion State                      │
                               │  - updateTelemetry()                         │
                               │  - simulateSensorSpike()                     │
                               │  - filterScope ("all" | "district")          │
                               │  - incidentReports & offlineQueue            │
                               └───────┬──────────────┬──────────────┬────────┘
                                       │              │              │
                    ┌──────────────────┘              │              └──────────────────┐
                    ▼                                 ▼                                 ▼
       ┌────────────────────────┐        ┌────────────────────────┐        ┌────────────────────────┐
       │   RiskAssessmentCard   │        │      MapPanel &        │        │        Sidebar         │
       │                        │        │        RiskMap         │        │                        │
       │ - Sliders: tempDelta,  │        │ - Leaflet MapContainer │        │ - Scoped Stations list │
       │   precipRate, z500,    │        │ - TileLayer (CartoDB)  │        │ - Critical Anomaly Hubs│
       │   shear                │        │ - RainViewer Radar Tile│        │ - Filter Scope toggle  │
       │ - Dual resolution:     │        │ - 4D GNN Trajectory    │        │ - Live Incident Feed   │
       │   12km Coarse -> 5km   │        │ - 5km Subgrid Circle   │        └────────────────────────┘
       │   DDPM Resolved        │        │ - Station & Incident   │
       │ - Gemini LLM Briefing  │        │   Markers + Popups     │
       └────────────────────────┘        └────────────────────────┘
```

---

## 4. Comprehensive Audit of Hardcoded / Simulated Values & Formulas

Per Rule 1 of `AGENTS.md` (*"NEVER hardcode or fake model outputs. Any simulated/demo data must be loaded from /data/demo/*.json AND labeled 'Demo / Scenario Simulator' in UI"*), below is the exhaustive list of every fake, hardcoded, or heuristically synthesized item currently present in the codebase.

| Subsystem / Item | File & Line | Current Implementation (What is Hardcoded/Derived) | What It Should Really Be (Scientific & Production Target) |
|---|---|---|---|
| **Anomaly Index / EFI Score** | `src/lib/risk.ts:8-37` | Arbitrary linear sum: `0.35*(|ΔT|/15) + 0.35*(P/120) + 0.15*(|z-5600|/350) + 0.15*(S/75)`. Multiplied by 100 and displayed as a percentage: `"EFI 25%"`, `"88% EFI-Anomaly Index"`. | **ECMWF/NCMRWF Extreme Forecast Index (EFI)**. Defined as integral of ensemble forecast CDF vs M-climate (ERA5 30-year baseline). **Dimensionless range is $[-1.0, +1.0]$, never percent**. Labeled as `"Scenario Simulator / Demo Index"` until connected to real ECMWF/NEPS-G CDFs. |
| **Cloudburst Prediction Wording** | `src/lib/risk.ts:80-89`, `src/data/ner-regions.ts:80-100` | Functions & alerts say `"MoES RED ALERT: Severe Mesoscale Convective Cloudburst Warning"`, `"Cloudburst Hub"`, `"Cloudburst Prediction"`. | **Rule 7 Violation**. Must say **"Extreme Convective Rainfall Risk"** or **"Localized Torrential Inundation Risk"**, as numerical cloudbursts cannot be deterministically predicted 3–10 days in advance; only anomalous convective potential can be forecasted. |
| **Downscaling Formula** | `src/components/RiskAssessmentCard.tsx:82-113` | Ad-hoc multiplier in `getDownscaledMetric`: `factor = val >= 75 ? 1.5 : 1.35` (e.g. 80 mm/hr $\rightarrow$ 120 mm/hr). Similar arbitrary offsets for thermal anomaly ($+6 \rightarrow +7.7^\circ\text{C}$). | **Generative Diffusion Model (DDPM / Diffusers)** output. In demo mode, these must load from pre-generated 12km vs 5km tensor pairs in `/data/demo/downscale_sample_*.json` labeled `"Demo / Scenario Simulator"`. In production, inferred via PyTorch/Diffusers inference service. |
| **Downscaled Values in AI Pipeline Card** | `components/dashboard/ai-pipeline-status.tsx:28-36, 166-193` | Hardcoded formula in card: `downscaledPrecip = precipRate >= 75 ? Math.round(precipRate * 1.5) : Math.round(precipRate * 1.35)`. Static badges: `"Moisture Convergence ✓"`, `"Thermodynamic Conservation ✓"`. | Precomputed verification tensors loaded from demo JSON showing exact MSE, Continuous Ranked Probability Score (CRPS), and mass conservation residual $(\nabla \cdot \vec{v} \approx 0)$. |
| **Downscaled Values in Map Popups** | `src/components/RiskMap.tsx:389, 483` | Inline duplication of `Math.round(pRate * 1.5)`. | Read from the unified region/station record or demo dataset, not computed ad-hoc in JSX strings. |
| **Guwahati / Station Telemetry** | `src/data/ner-regions.ts:76-1627` | 40+ hardcoded station objects with hand-crafted values (e.g., Guwahati: `tempDelta: 4.2, precipRate: 85, z500: 5820, shear: 52, severity: 'Critical'`). | Should be loaded from `/data/demo/stations.json` (or `/data/demo/nepsg_12km_sample.json`) and labeled `"Demo Baseline / Scenario Simulator"` in the UI. |
| **Synthetic Weather for Map Coordinates** | `src/lib/risk.ts:190-270` | `synthesizeTerrainForCoords(lat, lon)` generates pseudo-random weather parameters using `Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453 % 1`. | Spatial interpolation from real NetCDF/Zarr NEPS-G gridded forecast, or fallback with clear disclaimer: `"Interpolated Spatial Estimator (Synthetic Demo)"`. |
| **4D GNN Trajectory Generation** | `src/components/RiskMap.tsx:47-81` | `compute4DTrajectory()` generates 6 synthetic waypoints using linear step offsets (`dLat = 0.35`, `dLon = -0.65`) and fake confidence percentages (`98%`, `92%`, `86%`). | Trajectory waypoints extracted from Spherical GNN tracking output (lat, lon, pressure altitude, time $t$, node IDs, covariance matrix) stored in `/data/demo/gnn_trajectories.json`. |
| **Header Pipeline Status Ticks** | `components/dashboard/header.tsx:97-108` | Center pill displays `GNN Track ✓ → 5km DDPM ✓ | NEPS-G Mesh` with a hardcoded green pulsing dot. | Pipeline health status queried from backend endpoint `/api/pipeline/status` or labeled `"Scenario Engine: Precomputed GNN+DDPM"`. |
| **Sensor Spike Simulation** | `src/context/DisasterContext.tsx:385-414` | Injects arbitrary hardcoded increments: `+30 mm/hr` precip, `+3.0°C` temperature, `+120 gpm` Z500, `+15 kts` shear. | Scenario injection selector that loads named scenarios from `/data/demo/scenarios/*.json` (e.g., *Cyclone Remal Surges*, *Wayanad Meso-Vortex*, *Northwest Heat Dome*). |
| **Seed Incidents** | `src/data/seed-incidents.ts:5-165` | 5 static records with external Unsplash images, hardcoded coordinates, and relative time offsets (`hourAgo(6)`). | Stored in `/data/demo/incidents.json` and labeled `"Demo Field Incidents"`. |
| **Open-Meteo Heuristic Conversion** | `src/lib/weather-service.ts:60-70` | Synthesizes unmeasured synoptic variables: `tempDelta = temp - 28`, `precipRate = rain * 10`, `z500 = pressure * 5.6`, `shear = wind * 1.85`. | Real IMD/NCMRWF atmospheric level queries ($500\text{ hPa}$ geopotential height, $850\text{-}200\text{ hPa}$ wind vector delta) or clearly labeled Open-Meteo proxy derivation. |
| **System Info Metrics** | `src/components/SystemInfoPanel.tsx:140-190` | Hardcoded benchmark claims (e.g., "94.2% GNN Tracking Accuracy", "0.18 CRPS", "96.4% Peak Amplitude Retention"). | Dynamically loaded from model evaluation report artifact `/data/demo/benchmark_metrics.json`. |

---

## 5. Risks and Unknowns

1. **Next.js 16.3.3 Breaking Conventions:**
   - Turbopack is active. Dynamic imports and client components (`"use client"`) must strictly follow Next.js 16 conventions. Leaflet components cannot run in SSR.
2. **Scientific Credibility Before SIH / MoES Judges:**
   - MoES/NCMRWF scientists will immediately spot percentage-based EFI or claims of "cloudburst prediction at 7 days". Correcting terminology to "Extreme Convective Rainfall Risk" and EFI $[-1, +1]$ is paramount.
3. **Absence of a Local Python Backend / ML Engine:**
   - The repository currently lacks the `/backend` (FastAPI) and `/ml` directories mentioned in `AGENTS.md`. All logic currently executes in client-side TypeScript.
4. **Data Size and Zarr / NetCDF Handling:**
   - Real 12km global NWP datasets (e.g. NCMRWF NEPS-G) are gigabytes in size. Loading them directly into the browser is impossible; a lightweight tiled or pre-sliced demo API (`/data/demo/` or FastAPI `/api/forecast`) is necessary.
5. **No Existing Automated Tests:**
   - Currently, there are no Jest, Vitest, or Playwright tests configured. `pnpm build` is the only automated verification check.

---

## 6. Proposed Phased Implementation Plan (Phases 1–6)

### Phase 1: Data Contracts, Demo Architecture & Directory Setup
* **Scope:**
  - Create the required top-level directory structure per `AGENTS.md`: `/data/demo`, `/docs`.
  - Extract all hardcoded station profiles, incident seeds, downscaled tensor samples, and GNN trajectory coordinates into structured, validated JSON files in `/data/demo/*.json`.
  - Create TypeScript loader utilities in `src/lib/demo-data.ts` that read from `/data/demo/*.json`.
  - Add explicit `"Demo / Scenario Simulator"` labels to the dashboard header, telemetry HUD, and map overlay per Rule 1.
* **Files Likely Touched:**
  - `data/demo/stations.json` [NEW]
  - `data/demo/scenarios.json` [NEW]
  - `data/demo/incidents.json` [NEW]
  - `data/demo/gnn_trajectories.json` [NEW]
  - `data/demo/benchmark_metrics.json` [NEW]
  - `src/lib/demo-data.ts` [NEW]
  - `src/context/DisasterContext.tsx`
  - `components/dashboard/header.tsx`
* **Acceptance Test:**
  - `pnpm build` exits with code 0.
  - Verifying in browser that all stations, trajectories, and telemetry load directly from `/data/demo/*.json` and UI displays `"Demo / Scenario Simulator"` badge.

### Phase 2: Scientific Accuracy & Meteorological Terminology Refactor
* **Scope:**
  - Implement genuine EFI formula calculation utilities in `src/lib/efi.ts` with $[-1.0, +1.0]$ range.
  - Update `RiskAssessmentCard.tsx` and `RiskMap.tsx` to display EFI as $[-1.0, +1.0]$ (e.g., `EFI: +0.82 · Extreme Anomaly Risk`).
  - Purge all instances of "cloudburst prediction" across the codebase; replace with **"extreme convective rainfall risk"** or **"severe mesoscale convective surge"** per Rule 7.
  - Add unit tests for EFI range validation and severity mapping.
* **Files Likely Touched:**
  - `src/lib/efi.ts` [NEW]
  - `src/lib/risk.ts`
  - `src/components/RiskAssessmentCard.tsx`
  - `src/components/RiskMap.tsx`
  - `components/dashboard/map-panel.tsx`
  - `components/dashboard/sidebar.tsx`
  - `src/data/ner-regions.ts`
* **Acceptance Test:**
  - Automated test verifying EFI is bounded in $[-1.0, +1.0]$.
  - Grep search confirming zero instances of "cloudburst prediction" in user-facing UI.

### Phase 3: Backend Foundation (FastAPI Microservice)
* **Scope:**
  - Initialize `/backend` with FastAPI, Uvicorn, and Pydantic schemas.
  - Implement endpoints:
    - `GET /api/health` — Pipeline and model checkpoint health.
    - `GET /api/stations` — Station profiles and latest 12km ensemble values.
    - `GET /api/forecast/4d-trajectory/{station_id}` — 4D GNN trajectory waypoints.
    - `GET /api/downscale/5km/{station_id}` — 12km vs 5km downscaled comparison tensors.
  - Connect Next.js frontend to query FastAPI backend with graceful fallback to `/data/demo/*.json` when offline.
* **Files Likely Touched:**
  - `backend/main.py` [NEW]
  - `backend/requirements.txt` [NEW]
  - `backend/routers/forecast.py` [NEW]
  - `src/lib/api-client.ts` [NEW]
  - `components/dashboard/header.tsx` (live backend status indicator)
* **Acceptance Test:**
  - `curl -s http://localhost:8000/api/health` returns status `200 OK`.
  - Frontend header updates status dot dynamically based on backend health.

### Phase 4: GNN 4D Trajectory & Diffusion Model Pipeline Demonstration
* **Scope:**
  - Structure `/ml` directory with model inference wrappers:
    - `ml/gnn_tracker/` (Spherical GNN icosahedral tracking pipeline schema).
    - `ml/diffusion_downscaler/` (DDPM conditional downscaling schema).
  - Serve realistic multi-timestep tracking tensors $(t, \text{lat}, \text{lon}, \text{pressure\_hPa}, \text{uncertainty\_cov})$.
  - Render interactive 3-10 day trajectory timeline slider on the map allowing the user to scrub between $T+0\text{h}$, $T+24\text{h}$, $T+72\text{h}$, and $T+120\text{h}$.
* **Files Likely Touched:**
  - `ml/README.md` [NEW]
  - `ml/schemas.py` [NEW]
  - `src/components/RiskMap.tsx`
  - `components/dashboard/map-panel.tsx`
  - `components/dashboard/ai-pipeline-status.tsx`
* **Acceptance Test:**
  - User can scrub time slider on the map to see trajectory advance along the steering path with expanding ensemble spread.

### Phase 5: High-Resolution 5km Subgrid Alerting & GeoJSON Layer
* **Scope:**
  - Implement localized 5km radius alert generation conforming to PS 26078 requirements.
  - Render actual 5km spatial subgrid bounding boxes on Leaflet map over the anomaly core.
  - Add download/export capability for MoES CAP (Common Alerting Protocol) JSON/XML advisories.
* **Files Likely Touched:**
  - `src/lib/cap-alert-generator.ts` [NEW]
  - `src/components/RiskMap.tsx`
  - `src/components/AreaDetailsModal.tsx`
  - `src/components/RiskAssessmentCard.tsx`
* **Acceptance Test:**
  - Clicking "Export MoES Alert" downloads valid CAP-compliant JSON alert for the focused 5km subgrid.

### Phase 6: End-to-End Verification, Performance Optimization & Presentation Kit
* **Scope:**
  - End-to-end verification of all phases under offline and live modes.
  - Performance audit: map FPS, render latency, bundle size.
  - Final documentation in `/docs` (Architecture, SIH Presentation Demo Script, API Reference).
  - Ensure zero TypeScript errors and clean production build.
* **Files Likely Touched:**
  - `docs/ARCHITECTURE.md` [NEW]
  - `docs/SIH_PRESENTATION_SCRIPT.md` [NEW]
  - `README.md`
* **Acceptance Test:**
  - `pnpm build` passes with zero warnings.
  - Full rehearsal of the SIH pitch using the live dashboard without errors.

---

## 7. Open & Blocking Questions for the User

1. **FastAPI Backend Execution Environment:**  
   Do you have Python 3.10+ installed locally on your Windows machine so we can run the FastAPI backend (`uvicorn`) alongside Next.js in Phase 3, or would you prefer the Next.js API Routes (`/app/api/...`) to serve the demo endpoints directly without requiring Python setup?
2. **Dataset Availability:**  
   Do you currently have any raw sample NetCDF/GRIB2 files or ERA5/NEPS-G sample files from MoES/NCMRWF, or should Phase 1 generate physically consistent, realistic scenario JSON datasets based on historical events (e.g. Cyclone Remal, 2024 Wayanad extreme rainfall, North India heat dome)?
3. **Demo / Scenario Simulator UI Banner:**  
   To fulfill Rule 1, would you prefer a sleek top-bar banner (e.g., `"Megh-Drishti · Demo / Scenario Simulator Mode · Powered by Precomputed NEPS-G & ERA5 Climatology"`) or a pill badge in the header?

---

*Audit completed. Awaiting user approval of Phase 0 and answers to open questions before proceeding to Phase 1.*
