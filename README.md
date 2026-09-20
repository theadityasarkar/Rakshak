<div align="center">

<img src="https://raw.githubusercontent.com/theadityasarkar/Rakshak/main/public/logo.png" alt="Megh-Drishti Logo" width="120" height="120" onerror="this.style.display='none'"/>

# 🌩️ Megh-Drishti (मेघ-दृष्टि)

### AI-Driven Spatio-Temporal Tracking of Extreme Weather Anomalies

**Smart India Hackathon 2026 · Problem Statement SIH26078**  
*Ministry of Earth Sciences (MoES) / NCMRWF*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[![Vercel](https://img.shields.io/badge/Frontend-Live_on_Vercel-000000?style=for-the-badge&logo=vercel)](https://rakshak-indol-one.vercel.app)
[![Backend](https://img.shields.io/badge/Backend_API-Live_on_Vercel-000000?style=for-the-badge&logo=vercel)](https://rakshak-kappa-eight.vercel.app/docs)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<br/>

> **Megh-Drishti** is an autonomous, mission-critical meteorological intelligence platform that tracks extreme weather events (3–10 day medium-range), performs amplitude-preserving 12 km → 5 km downscaling via conditional diffusion models, and delivers 5 km-radius precision alerts — purpose-built for MoES, IMD, SDMA, and NDRF.

<br/>

[🚀 Live Demo](https://rakshak-indol-one.vercel.app) · [📖 API Docs](https://rakshak-kappa-eight.vercel.app/docs) · [🐛 Report Bug](https://github.com/theadityasarkar/Rakshak/issues) · [💡 Request Feature](https://github.com/theadityasarkar/Rakshak/issues)

</div>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🛠️ Technology Stack](#️-technology-stack)
- [⚡ Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [Full Stack with Docker](#full-stack-with-docker)
- [🌐 Environment Variables](#-environment-variables)
- [📡 API Reference](#-api-reference)
- [🎬 5-Minute Demo Walkthrough](#-5-minute-demo-walkthrough)
- [🔬 ML Pipeline](#-ml-pipeline)
- [🛰️ ERA5 Data Setup](#️-era5-data-setup)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [👥 Team](#-team)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🗺️ Command-Center GIS Dashboard
- Live Leaflet map with dark-mode tiles
- Real-time Doppler weather radar overlay (RainViewer)
- 3D topographic DEM relief rendering
- Smooth animated `flyTo` camera on anomaly selection
- Dynamic 5–60 km influence radius buffers

</td>
<td width="50%">

### 🤖 AI Anomaly Tracking Engine
- EFI (Extreme Forecast Index) scoring `[-1, +1]`
- Z-score vs. 30-year ERA5 climatological baseline
- Connected-component tracking → 4D bounding boxes (GeoJSON)
- Spherical GNN on icosahedral mesh *(behind `USE_GNN=false` flag)*

</td>
</tr>
<tr>
<td width="50%">

### 📊 Ensemble Forecast Visualisation
- p10 / p50 / p90 probability toggle
- Cone of uncertainty for cyclone tracks
- T+0 to T+240 h timeline scrubber (3-hour steps)
- Play / pause / keyboard arrow controls

</td>
<td width="50%">

### 🔬 12 km → 5 km Downscaling
- U-Net baseline + conditional DDPM (HF Diffusers)
- Amplitude-preserving: mass conservation residual `< 0.003`
- Before/after interactive swipe comparator
- RMSE, CRPS, radially-averaged power spectrum metrics

</td>
</tr>
<tr>
<td width="50%">

### 🚨 5 km-Radius Precision Alerts
- IMD four-tier severity (RED / ORANGE / YELLOW / GREEN)
- Lead time, probability, and MoES/NDMA action directives
- Full EN / हिन्दी i18n (zero untranslated strings)

</td>
<td width="50%">

### 📱 PWA + Offline-First
- Service worker with background sync
- IndexedDB queue for field incident logging offline
- Auto-flush on reconnect
- Lighthouse PWA score ≥ 90

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Megh-Drishti System                         │
├─────────────────┬───────────────────────┬───────────────────────────┤
│   Frontend      │      Backend API       │      ML Pipeline          │
│   (Next.js 16)  │      (FastAPI)         │      (Python / PyTorch)   │
│                 │                        │                           │
│  ┌───────────┐  │  ┌──────────────────┐  │  ┌─────────────────────┐ │
│  │ Leaflet   │  │  │ /api/v1/health   │  │  │ ERA5 Fetch (CDS)    │ │
│  │ GIS Map   │◄─┼─►│ /api/v1/anomalies│◄─┼─►│ EFI / Z-score       │ │
│  │           │  │  │ /api/v1/alerts   │  │  │ Tracker (CC 4D)     │ │
│  ├───────────┤  │  │ /api/v1/metrics  │  │  │ U-Net / DDPM        │ │
│  │ Timeline  │  │  │ /api/v1/tracks   │  │  │ Downscaler          │ │
│  │ Scrubber  │  │  └──────────────────┘  │  └─────────────────────┘ │
│  │           │  │                        │                           │
│  ├───────────┤  │  ┌──────────────────┐  │  ┌─────────────────────┐ │
│  │ Ensemble  │  │  │ DemoDataService  │  │  │ data/demo/*.json    │ │
│  │ View      │  │  │ (DEMO_MODE=true) │◄─┼─►│ (labeled scenarios) │ │
│  ├───────────┤  │  └──────────────────┘  │  └─────────────────────┘ │
│  │ PWA /     │  │                        │                           │
│  │ IndexedDB │  │  Vercel Serverless     │  data/raw/ → data/zarr/  │
│  └───────────┘  │  Python Runtime        │                           │
└─────────────────┴───────────────────────┴───────────────────────────┘
```

**Data flow:**
1. ERA5 reanalysis → `ml/data/fetch_era5.py` → Zarr store
2. Tracker (`ml/tracking/`) → 4D GeoJSON bounding boxes
3. FastAPI backend serves tracked anomalies + downscaled fields
4. Next.js dashboard renders live GIS layers + alert cards

---

## 📁 Project Structure

```
Rakshak/
├── app/                        # Next.js 16 App Router pages
│   ├── layout.tsx              # Root layout (fonts, providers)
│   └── page.tsx                # Dashboard entry point
│
├── components/                 # Reusable UI components
│   ├── dashboard/              # Dashboard-specific widgets
│   │   ├── header.tsx          # Command-center header
│   │   ├── sidebar.tsx         # Anomaly list sidebar
│   │   ├── timeline-scrubber.tsx  # T+0 → T+240h scrubber
│   │   ├── swipe-comparator.tsx   # 12km vs 5km before/after
│   │   ├── ensemble-view.tsx      # p10/p50/p90 cone
│   │   └── ...
│   └── ui/                     # Base UI primitives (Radix)
│
├── src/
│   ├── components/             # Feature components
│   │   ├── RiskMap.tsx         # Leaflet GIS map
│   │   ├── AlertCard.tsx       # 5km subgrid alert card
│   │   └── ...
│   ├── context/                # React Context providers
│   ├── lib/                    # API client, utilities
│   │   ├── api.ts              # Typed fetch wrappers
│   │   ├── weather-service.ts  # EFI / severity logic
│   │   └── indexeddb-queue.ts  # Offline telemetry queue
│   └── i18n/                   # EN / हिन्दी translations
│
├── backend/                    # FastAPI microservice
│   ├── index.py                # Vercel ASGI entry point
│   ├── vercel.json             # Vercel deployment config
│   ├── requirements.txt        # Lightweight API deps only
│   ├── app/
│   │   ├── main.py             # FastAPI app + CORS
│   │   ├── config.py           # Settings / env vars
│   │   ├── routers/            # health, anomalies, alerts, metrics
│   │   ├── schemas/            # Pydantic response models
│   │   └── services/
│   │       └── demo_service.py # JSON loader + alert evaluator
│   ├── data/demo/              # Pre-computed demo JSON payloads
│   │   ├── anomalies.json
│   │   ├── tracks.json         # 4D GNN trajectory waypoints
│   │   ├── alerts.json
│   │   ├── downscaled.json     # 12km vs 5km comparison tensors
│   │   ├── metrics.json        # Model evaluation benchmarks
│   │   └── amphan_replay.json  # Cyclone Amphan scenario
│   └── tests/
│
├── ml/                         # ML training & inference pipeline
│   ├── requirements.txt        # Heavy ML deps (torch, xarray, etc.)
│   ├── config.yaml             # Model & dataset config
│   ├── data/
│   │   └── fetch_era5.py       # CDS API → Zarr pipeline
│   └── tracking/
│       ├── efi.py              # EFI scorer (range [-1, +1])
│       ├── tracker.py          # Connected-component 4D tracker
│       └── gnn.py              # Spherical GNN (USE_GNN=false)
│
├── data/
│   ├── raw/                    # Raw ERA5 NetCDF files
│   ├── zarr/                   # Processed Zarr stores
│   └── demo/                   # Shared demo scenarios
│
├── docs/                       # Documentation & analysis plots
│   ├── AUDIT.md
│   └── *.png                   # Sanity-check plots
│
├── public/                     # Static assets, PWA manifest
├── docker-compose.yml          # Full-stack local orchestration
└── .env.example                # Environment variable template
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend Framework** | Next.js 16.3 (App Router, Turbopack) |
| **Language** | TypeScript 5.7 (strict mode), Python 3.11+ |
| **UI / Styling** | React 19, Tailwind CSS v4, Radix UI, Lucide Icons |
| **GIS & Mapping** | React-Leaflet 5, Leaflet 1.9, OpenStreetMap, RainViewer API |
| **Backend API** | FastAPI 0.110, Uvicorn, Pydantic v2 |
| **ML / Data** | PyTorch 2.2, HuggingFace Diffusers, Xarray, Dask, Zarr |
| **Offline / PWA** | Service Worker, IndexedDB, Web Background Sync API |
| **Deployment** | Vercel (Frontend + Serverless Backend) |
| **Package Manager** | pnpm (frontend), pip (backend/ML) |

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 20 and **pnpm** ≥ 9
- **Python** ≥ 3.11
- **Git**

### Frontend Setup

```bash
# 1. Clone the repository
git clone https://github.com/theadityasarkar/Rakshak.git
cd Rakshak

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL

# 4. Start development server (Turbopack)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the dashboard loads in demo mode automatically.

### Backend Setup

```bash
# 1. Create a virtual environment
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. Install API dependencies
pip install -r requirements.txt

# 3. Start the FastAPI server (from /backend directory)
python -m uvicorn index:app --reload --port 8000
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Full Stack with Docker

```bash
# Start both frontend and backend together
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 🌐 Environment Variables

### Frontend (`.env.local`)

```env
# Backend API endpoint
NEXT_PUBLIC_API_URL=http://localhost:8000

# Enable demo mode (loads from data/demo/*.json)
NEXT_PUBLIC_DEMO_MODE=true
```

### Backend

```env
# Demo mode — serve pre-computed JSON payloads
DEMO_MODE=true

# Server bind
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

Copy `.env.example` to `.env.local` and adjust values for your environment.

---

## 📡 API Reference

Base URL: `https://rakshak-kappa-eight.vercel.app`  
Interactive docs: [`/docs`](https://rakshak-kappa-eight.vercel.app/docs) (Swagger UI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Service health + model status |
| `GET` | `/api/v1/anomalies` | List all tracked extreme weather anomalies |
| `GET` | `/api/v1/anomalies/{id}` | Single anomaly telemetry |
| `GET` | `/api/v1/anomalies/{id}/track` | 4D GNN spatio-temporal trajectory |
| `GET` | `/api/v1/anomalies/{id}/downscaled` | 12 km vs 5 km DDPM comparison tensors |
| `POST` | `/api/v1/alerts/evaluate` | Evaluate alerts for `{lat, lon, radius_km}` |
| `GET` | `/api/v1/metrics` | Model evaluation benchmarks (RMSE, CRPS, etc.) |

**Example:**
```bash
curl https://rakshak-kappa-eight.vercel.app/api/v1/health
# {"status":"demo","demo_mode":true,"version":"1.0.0"}

curl -X POST https://rakshak-kappa-eight.vercel.app/api/v1/alerts/evaluate \
  -H "Content-Type: application/json" \
  -d '{"lat": 21.65, "lon": 88.35, "radius_km": 5.0}'
```

> **Note:** All demo responses are loaded from `backend/data/demo/*.json` and labeled **"Demo / Scenario Simulator"** in the UI, per MoES data integrity rules.

---

## 🎬 5-Minute Demo Walkthrough

Follow this structured walkthrough to evaluate all six phases:

### ⏱ Minute 1 — AI Command Console & Subgrid Alerts
1. Open the live dashboard at [rakshak-indol-one.vercel.app](https://rakshak-indol-one.vercel.app)
2. Observe the **FastAPI Microservice · Active** badge in the header
3. View the **5 km Subgrid Early Warning** card in the right panel:
   - IMD category (RED / ORANGE / YELLOW)
   - Lead time (T+24 h), probability (82–98%), MoES action directives

### ⏱ Minute 2 — 4D Timeline Scrubber & Ensemble Cone
1. Press `Space` or click **Play** on the bottom scrubber
2. Watch the forecast advance T+0 → T+240 h in 3-hour steps
3. Use `◀` `▶` keyboard arrows to step manually
4. Toggle **p10 / p50 / p90** to see the uncertainty cone adapt

### ⏱ Minute 3 — 12 km → 5 km DDPM Swipe Comparator
1. Click **"12km ⇄ 5km Swipe"** in the map panel
2. Drag the vertical divider across the anomaly core
3. Observe peak amplitude recovery: 85 mm/hr → 128–148 mm/hr

### ⏱ Minute 4 — Replay Cyclone Amphan
1. Click the **"Replay Cyclone Amphan"** amber button in the header
2. Map locks onto Sundarbans landfall `[21.65, 88.35]`
3. 81-hour IMD best-track renders with uncertainty cone
4. Stop the backend → click replay again → loads from cached offline assets ✅

### ⏱ Minute 5 — PWA, Offline Queue & Hindi i18n
1. DevTools → Network → **Offline**
2. Click **"Log Weather Anomaly"** → fill form → **"Queue Offline & Close"**
3. Toast: *"Stored in Local IndexedDB Queue"*
4. Restore network → watch auto-sync flush the queued report
5. Click the 🌐 globe icon → select **हिन्दी** → verify 100% UI translation

---

## 🔬 ML Pipeline

```
ERA5 NetCDF (CDS)
       │
       ▼
ml/data/fetch_era5.py  →  data/zarr/  (Xarray + Dask)
       │
       ▼
ml/tracking/efi.py     →  EFI index [-1, +1] per grid cell
ml/tracking/tracker.py →  Connected-component 4D bounding boxes
       │
       ▼
Coarsen high-res target → (coarse, fine) training pairs
       │
       ├──► U-Net baseline  (RMSE reference)
       └──► Conditional DDPM (HuggingFace Diffusers)
                │
                ▼
       Evaluation: RMSE · CRPS · Peak-amplitude error
                   Radially-averaged power spectrum
                │
                ▼
        data/metrics.json  →  /api/v1/metrics  →  "Model Evidence" tab
```

**Evaluation metrics** (saved to `data/metrics.json`):

| Metric | U-Net | DDPM |
|--------|-------|------|
| RMSE (mm/hr) | — | — |
| Peak-amplitude error (%) | — | — |
| CRPS | — | — |

> Results populated after running `python ml/eval.py` with real model checkpoints.

---

## 🛰️ ERA5 Data Setup

To fetch live ERA5 reanalysis grids for Cyclone Amphan or North India heatwave scenarios:

**1. Register at Copernicus CDS**  
→ [cds.climate.copernicus.eu](https://cds.climate.copernicus.eu/)

**2. Create API credentials file**

*Linux / macOS:* `~/.cdsapirc`  
*Windows:* `%USERPROFILE%\.cdsapirc`

```ini
url: https://cds.climate.copernicus.eu/api
key: <YOUR-PERSONAL-ACCESS-TOKEN>
```

**3. Install ML dependencies**
```bash
pip install -r ml/requirements.txt
```

**4. Fetch ERA5 data**
```bash
# Cyclone Amphan (May 2020)
python ml/data/fetch_era5.py --case cyclone_amphan

# North India heatwave
python ml/data/fetch_era5.py --case north_india_heatwave
```

Data is saved to `data/raw/` as NetCDF and converted to `data/zarr/` via Xarray + Dask.

---

## 🧪 Testing

### Frontend
```bash
pnpm lint        # ESLint check
pnpm typecheck   # TypeScript strict check
pnpm build       # Production build validation
```

### Backend
```bash
cd backend
pytest tests/ -v
```

### ML Pipeline
```bash
cd ml
pytest tests/test_tracking.py -v    # EFI + tracker unit tests (synthetic arrays)
pytest tests/test_efi.py -v         # EFI range [-1, +1] validation
```

---

## 🚀 Deployment

### Vercel (Recommended)

This project uses two separate Vercel deployments:

**Backend (FastAPI Serverless):**
1. Import `theadityasarkar/Rakshak` on Vercel
2. Set **Root Directory** → `backend`
3. Framework Preset → **FastAPI**
4. Add env var: `DEMO_MODE=true`
5. Deploy

**Frontend (Next.js):**
1. Import `theadityasarkar/Rakshak` on Vercel (new project)
2. Set **Root Directory** → `.` (repo root)
3. Framework Preset → **Next.js** (auto-detected)
4. Add env vars:
   ```
   NEXT_PUBLIC_API_URL=<your-backend-url>
   NEXT_PUBLIC_DEMO_MODE=true
   ```
5. Deploy

**Live deployments:**
- Frontend: https://rakshak-indol-one.vercel.app
- Backend API: https://rakshak-kappa-eight.vercel.app

### Docker (Self-hosted)
```bash
docker-compose up --build -d
```

---

## 👥 Team

| Role | Contributor |
|------|-------------|
| Lead Developer | [@theadityasarkar](https://github.com/theadityasarkar) |

*Developed for Smart India Hackathon 2026 (SIH26078) — Ministry of Earth Sciences / NCMRWF*

**Acknowledgments:**
- Meteorological radar data: [RainViewer API](https://www.rainviewer.com/)
- Weather forecasting data: [Open-Meteo](https://open-meteo.com/)
- Topographic tiles: [OpenTopoMap](https://opentopomap.org/) & Esri World Hillshade
- ERA5 reanalysis: [Copernicus Climate Data Store](https://cds.climate.copernicus.eu/)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/Rakshak.git

# 3. Create a feature branch
git checkout -b feat/your-feature-name

# 4. Make your changes and commit
git commit -m "feat: add your feature"

# 5. Push and open a Pull Request
git push origin feat/your-feature-name
```

**Guidelines:**
- Follow existing code style (TypeScript strict, Python type hints)
- Never hardcode model outputs — demo data must live in `data/demo/*.json`
- Scientific correctness: EFI range is `[-1, +1]`, not percent
- Run `pnpm lint && pnpm typecheck` before submitting a PR
- Every PR must leave the app in a runnable state

Please read [AGENTS.md](AGENTS.md) for the full list of project rules before contributing.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for MoES · NCMRWF · IMD · SDMA · NDRF**

*Smart India Hackathon 2026 — PS 26078*

</div>
