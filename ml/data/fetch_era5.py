"""Copernicus Climate Data Store (CDS) API fetcher for ERA5 Reanalysis.

Fetches ERA5 reanalysis for extreme weather cases defined in ml/config.yaml:
1. Cyclone Amphan (May 16–21, 2020, Bay of Bengal)
2. North India Severe Heatwave (May 22–27, 2020)
Converts raw datasets to chunked Zarr stores via Xarray and Dask.
"""

import os
import sys
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

try:
    import cdsapi
    import xarray as xr
    import dask
except ImportError as e:
    print(f"[ERROR] Required dependency missing: {e}. Run 'pip install cdsapi xarray dask zarr netcdf4'.")
    sys.exit(1)


def check_cds_credentials() -> bool:
    """Verify presence of Copernicus CDS API credentials in environment or ~/.cdsapirc."""
    cdsapirc = Path.home() / ".cdsapirc"
    has_file = cdsapirc.exists()
    has_env = "CDSAPI_KEY" in os.environ and ("CDSAPI_URL" in os.environ or True)
    return has_file or has_env


def load_config(config_path: Optional[Path] = None) -> Dict[str, Any]:
    """Load case configuration from config.yaml."""
    if config_path is None:
        config_path = Path(__file__).resolve().parent.parent / "config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def fetch_era5_case(
    case_key: str,
    config: Optional[Dict[str, Any]] = None,
    output_dir: Optional[Path] = None,
    dry_run: bool = False,
) -> Path:
    """Fetch ERA5 reanalysis data for a specific case and convert to Zarr via Xarray/Dask."""
    if config is None:
        config = load_config()

    cases = config.get("cases", {})
    if case_key not in cases:
        raise KeyError(f"Case '{case_key}' not found in configuration. Available: {list(cases.keys())}")

    case_cfg = cases[case_key]
    print(f"\n========================================================")
    print(f"[*] Processing Case: {case_cfg.get('name')}")
    print(f"[*] Target Year: {case_cfg.get('year')}, Month: {case_cfg.get('month')}")
    print(f"[*] Bounding Box (N/W/S/E): {case_cfg.get('area')}")
    print(f"========================================================")

    if not check_cds_credentials():
        raise PermissionError(
            "CDS API credentials not found!\n"
            "Please configure ~/.cdsapirc with:\n"
            "  url: https://cds.climate.copernicus.eu/api\n"
            "  key: <YOUR-CDS-API-KEY>\n"
            "Or set the environment variable CDSAPI_KEY."
        )

    root_dir = Path(__file__).resolve().parent.parent.parent
    target_zarr = root_dir / case_cfg.get("target_zarr", f"data/zarr/{case_key}.zarr")
    target_zarr.parent.mkdir(parents=True, exist_ok=True)

    if dry_run:
        print(f"[DRY-RUN] Would fetch and save to: {target_zarr}")
        return target_zarr

    client = cdsapi.Client()
    temp_nc = target_zarr.parent / f"{case_key}_raw.nc"

    # Request specification for reanalysis-era5-single-levels
    request_params = {
        "product_type": "reanalysis",
        "format": "netcdf",
        "variable": case_cfg.get("surface_variables", []),
        "year": case_cfg.get("year"),
        "month": case_cfg.get("month"),
        "day": case_cfg.get("days", []),
        "time": case_cfg.get("times", []),
        "area": case_cfg.get("area", []),
    }

    print(f"[*] Submitting request to Copernicus CDS API for '{case_key}'...")
    client.retrieve("reanalysis-era5-single-levels", request_params, str(temp_nc))
    print(f"[+] Downloaded raw NetCDF to {temp_nc}")

    # Convert NetCDF to chunked Zarr store using Xarray & Dask
    print(f"[*] Converting {temp_nc} to chunked Zarr store via Xarray/Dask...")
    with xr.open_dataset(temp_nc, chunks={"time": 8, "latitude": 64, "longitude": 64}) as ds:
        ds.to_zarr(str(target_zarr), mode="w", consolidated=True)
    print(f"[✓] Successfully wrote chunked Zarr store to: {target_zarr}")

    # Clean up temporary NetCDF file
    if temp_nc.exists():
        temp_nc.unlink()

    return target_zarr


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Fetch ERA5 reanalysis to Zarr via CDS API.")
    parser.add_argument("--case", choices=["cyclone_amphan", "north_india_heatwave", "all"], default="cyclone_amphan")
    parser.add_argument("--dry-run", action="store_true", help="Print request parameters without submitting.")
    args = parser.parse_args()

    cfg = load_config()
    cases_to_run = ["cyclone_amphan", "north_india_heatwave"] if args.case == "all" else [args.case]

    for c in cases_to_run:
        try:
            fetch_era5_case(c, cfg, dry_run=args.dry_run)
        except Exception as err:
            print(f"[ERROR] Case '{c}' failed: {err}")
            if not args.dry_run:
                sys.exit(1)
