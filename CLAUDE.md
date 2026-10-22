# CLAUDE.md — Megh-Drishti (मेघ-दृष्टि) Project Guide

> **Target Audience:** Claude Code / Anthropic AI Assistants working on this repository.  
> **Project:** Smart India Hackathon (SIH 2026) · **Problem Statement:** PS 26078 (Ministry of Earth Sciences - MoES / NCMRWF)  
> **Mission:** AI-driven spatio-temporal tracking of extreme weather anomalies (3–10 day medium-range) + 12 km → 5 km amplitude-preserving downscaling + 5 km-radius IMD-aligned alerts.

---

## 1. Project Overview & Stakeholders

* **Problem Statement:** PS 26078 — AI Tracking of Extreme Weather Anomalies (3-10 Day Forecast).
* **Primary Stakeholders:** MoES (Ministry of Earth Sciences), NCMRWF, IMD (India Meteorological Department), SDMA (State Disaster Management Authorities), NDRF.
* **Core Problem:** Coarse global numerical weather prediction (NWP ~12 km) systematically smooths out localized convective peaks (e.g. 150+ mm/hr rainfall).
* **Solution Architecture:**
  1. **4D Spatio-Temporal Anomaly Tracker (GNN):** Tracks atmospheric steering flow and anomalous geopotential height ($Z_{500}$), wind shear, and moisture flux across $T+0\text{h} \to T+240\text{h}$ with ensemble uncertainty ($p_{10}, p_{50}, p_{90}$).
  2. **Physics-Preserving Downscaler (Conditional DDPM / U-Net):** Resolves coarse 12 km grid cells into 5 km grids, restoring extreme precipitation amplitudes while strictly conserving mass and moisture balance.
  3. **Hyperlocal 5 km Alert Engine:** Common Alerting Protocol (CAP) compliant warnings aligned with IMD 4-tier color codes (Red, Orange, Yellow, Green).
  4. **Resilient GIS Command Center:** Dark-mode Next.js 16 + Leaflet map with Doppler radar overlays, timeline scrubber, and offline-first IndexedDB synchronization for NDRF field operators.

---

## 2. Technology Stack & Frameworks

| Layer | Technologies | Key Files / Config |
|---|---|---|
| **Frontend** | Next.js 16.3 (Turbopack, App Router), React 19, TypeScript 5.7, Tailwind CSS v4 | `app/`, `package.json`, `components/` |
| **GIS & Mapping** | Leaflet 1.9.4, React-Leaflet 5.0, RainViewer Radar API, OpenTopoMap | `src/components/RiskMap.tsx`, `components/dashboard/map-panel.tsx` |
| **Backend API** | FastAPI 0.110, Python 3.11+, Uvicorn, Pydantic v2 | `backend/app/main.py`, `backend/requirements.txt` |
| **ML & Data Pipeline** | PyTorch 2.2, Hugging Face Diffusers, Xarray, Dask, Zarr | `ml/`, `scripts/process_amphan_era5.py` |
| **Offline & PWA** | Service Worker, IndexedDB (`idb-keyval`), Web Background Sync | `src/lib/indexeddb-queue.ts`, `public/manifest.json` |
| **External Integrations** | Copernicus CDS (ERA5), Open-Meteo API, RainViewer, Google Gemini Pro | `src/lib/weather-service.ts`, `src/lib/gemini-service.ts` |

---

## 3. Non-Negotiable Engineering & Scientific Rules

When modifying or generating code in this repository, strictly adhere to these rules (derived from `AGENTS.md`):

1. **No Fake or Hardcoded Model Outputs:**
   * Never hardcode arbitrary formulas or fake predictions directly inside components.
   * Any simulated, scenario, or demo data **must** load from `/data/demo/*.json` or `/backend/data/demo/*.json` and must be clearly labeled **"Demo / Scenario Simulator"** in the UI.
2. **Scientific Accuracy & Terminology:**
   * **EFI (Extreme Forecast Index):** Mathematically defined as integral comparing forecast CDF vs M-climate baseline. The valid range is **$[-1.0, +1.0]$** (never percentage like "88%").
   * **Convective Terminology:** Always use **"extreme convective rainfall risk"** or **"severe mesoscale convective surge"**. **NEVER** use "cloudburst prediction" for 3–10 day medium-range forecasts (as individual cloudburst cells cannot be deterministically forecasted days in advance).
3. **Keep Existing UI Design:**
   * The dark command-center aesthetic, Leaflet map configuration, timeline scrubber, and telemetry HUD must be preserved and enhanced — never rewritten or styled into basic generic UI.
4. **Next.js 16 Convention Awareness:**
   * Uses Next.js 16 App Router with Turbopack. Mind SSR boundaries (`"use client"` for Leaflet and stateful controls). Dynamic imports for Leaflet components with `{ ssr: false }`.
5. **No Placeholder Code:**
   * Never commit `TODO`, `pass`, or "implement later". Every delivered component must be functional, linted, and typechecked.

---

## 4. Key Development Commands

### Frontend
```bash
# Install dependencies
pnpm install

# Run development server (Turbopack)
pnpm dev

# Typecheck and Lint
pnpm typecheck
pnpm lint

# Production build verification
pnpm build
```

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
pip install -r requirements.txt

# Run backend server
uvicorn app.main:app --reload --port 8000

# Run backend tests
pytest tests/ -v
```

### Machine Learning
```bash
cd ml
pip install -r requirements.txt

# Run ML test suite (EFI validation, array processing)
pytest tests/ -v
```

---

## 5. Repository Directory Structure

```
d:\Codes\Cursor\ner-rakshak-dashboard-development\
├── AGENTS.md                  # Project constitution & non-negotiable rules
├── CLAUDE.md                  # Claude Code onboarding guide (this file)
├── README.md                  # High-level overview & setup instructions
├── app/                       # Next.js 16 App Router (layout, page, theme)
├── components/                # Modular UI & Dashboard components
│   ├── dashboard/             # Timeline scrubber, AI pipeline status, header, sidebar
│   └── ui/                    # Reusable primitive controls (Radix/Shadcn)
├── src/                       # Core frontend logic & GIS components
│   ├── components/            # RiskMap (Leaflet), RiskAssessmentCard, modals
│   ├── context/               # DisasterContext.tsx (central state store)
│   ├── data/                  # Static geographical & fallback definitions
│   └── lib/                   # API clients, weather-service, offline queue
├── backend/                   # FastAPI microservices
│   ├── app/                   # Routers (/api/v1/anomalies, /alerts, /downscaled)
│   └── data/demo/             # Precomputed scenario JSON payloads
├── ml/                        # ML training & inference routines
│   ├── tracking/              # Spherical GNN & EFI computation modules
│   └── downscaling/           # Conditional DDPM & U-Net downscaling pipelines
├── data/                      # Raw datasets, NetCDF, and Zarr stores
└── docs/                      # Architectural diagrams, audits, and SIH pitch documentation
```

---

## 6. Core API Contracts (`/api/v1/`)

* `GET /api/v1/health` → Status of service, active model checkpoints, demo mode flag.
* `GET /api/v1/anomalies` → Active 3–10 day anomalous weather hubs across India.
* `GET /api/v1/anomalies/{id}/track` → 4D GNN trajectory waypoints (lat, lon, pressure alt, step $t$, uncertainty bounds).
* `GET /api/v1/anomalies/{id}/downscaled` → Dual-resolution 12 km coarse vs 5 km DDPM resolved precipitation tensors.
* `POST /api/v1/alerts/evaluate` → Evaluates localized risk for coordinates `{lat, lon, radius_km}` and returns IMD color code alert.
* `GET /api/v1/metrics` → Validation benchmarks (RMSE, CRPS, Power Spectrum, Peak Amplitude Retention).
