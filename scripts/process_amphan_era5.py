#!/usr/bin/env python3
"""
Process and Align ERA5 Reanalysis Data for Super Cyclone Amphan (May 2020)
SIH 2026 PS 26078 (MoES / NCMRWF)

Tasks:
1. Open ERA5 pressure-level and single-level netCDF files, print dimensions,
   coordinate ranges, variables, units, file sizes, and time coordinate note.
2. Merge single-level instant and accumulation files, align with pressure-level
   data on common longitude (65.0E - 100.0E) and time axis.
3. Generate sanity check plots:
   - docs/sanity_amphan_wind.png: 850 hPa cyclonic wind circulation (May 19 & 20, 12:00 UTC)
   - docs/sanity_amphan_mslp.png: Minimum MSLP time series over Bay of Bengal showing intensification
4. Save merged/aligned dataset to data/zarr/amphan.zarr.
"""

import os
import sys
from pathlib import Path
import numpy as np
import xarray as xr
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Set paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
DOCS_DIR = BASE_DIR / "docs"
ZARR_DIR = BASE_DIR / "data" / "zarr"
ZARR_OUTPUT = ZARR_DIR / "amphan.zarr"

FILE_PL = RAW_DIR / "ERA5 pressure-level.nc"
FILE_INST = RAW_DIR / "data_stream-oper_stepType-instant.nc"
FILE_ACCUM = RAW_DIR / "data_stream-oper_stepType-accum.nc"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def step1_inspect_datasets():
    print("\n" + "=" * 80)
    print("TASK 1: INSPECTING ERA5 REANALYSIS NETCDF FILES WITH XARRAY")
    print("=" * 80)

    raw_files = [
        ("Pressure Level", FILE_PL),
        ("Single-level Instantaneous", FILE_INST),
        ("Single-level Accumulation", FILE_ACCUM),
    ]

    opened = {}
    time_coords_used = {}

    for label, filepath in raw_files:
        if not filepath.exists():
            raise FileNotFoundError(f"Required raw file not found: {filepath}")

        size_bytes = os.path.getsize(filepath)
        size_mb = size_bytes / (1024 * 1024)

        print(f"\n>> [{label}]")
        print(f"   Path: '{filepath}'")
        print(f"   File Size: {size_bytes:,} bytes ({size_mb:.2f} MB)")

        ds = xr.open_dataset(filepath)
        opened[label] = ds

        # Detect time coordinate name
        time_coord = "valid_time" if "valid_time" in ds.coords else ("time" if "time" in ds.coords else None)
        time_coords_used[label] = time_coord

        print(f"   Dimensions: {dict(ds.sizes)}")
        print("   Coordinate Ranges:")
        for cname in ds.coords:
            c = ds[cname]
            if c.ndim == 1:
                val_min = str(c.values[0])
                val_max = str(c.values[-1])
                print(f"     - {cname} (count={len(c)}): [{val_min} to {val_max}]")
            elif c.ndim == 0:
                print(f"     - {cname} (scalar): {c.values}")
            else:
                print(f"     - {cname}: shape {c.shape}")

        print("   Data Variables:")
        for vname in ds.data_vars:
            var = ds[vname]
            desc = var.attrs.get("long_name", var.attrs.get("standard_name", "N/A"))
            units = var.attrs.get("units", "dimensionless")
            print(f"     - {vname:5s} | dims: {str(var.dims):36s} | units: {units:15s} | {desc}")

    print("\n" + "-" * 80)
    print("[TIME] TIME COORDINATE ANALYSIS:")
    for label, tname in time_coords_used.items():
        print(f"   - {label}: uses '{tname}' as the time coordinate.")
    print("   -> Finding: ECMWF / Copernicus CDS outputs use 'valid_time' instead of 'time'.")
    print("      'valid_time' represents UTC forecast/reanalysis valid verification timestamps.")
    print("-" * 80)

    return opened


def step2_merge_and_align(opened_datasets):
    print("\n" + "=" * 80)
    print("TASK 2: MERGING SINGLE-LEVEL FILES AND ALIGNING TO COMMON REGION")
    print("=" * 80)

    ds_pl = opened_datasets["Pressure Level"]
    ds_inst = opened_datasets["Single-level Instantaneous"]
    ds_accum = opened_datasets["Single-level Accumulation"]

    print("Step 2a: Subsetting single-level datasets to common longitude [65.0 degE, 100.0 degE]...")
    common_lon_slice = slice(65.0, 100.0)
    ds_inst_sub = ds_inst.sel(longitude=common_lon_slice)
    ds_accum_sub = ds_accum.sel(longitude=common_lon_slice)

    print(f"   - Original inst longitude range: [{float(ds_inst.longitude.min())} degE, {float(ds_inst.longitude.max())} degE] ({len(ds_inst.longitude)} pts)")
    print(f"   - Aligned inst longitude range:  [{float(ds_inst_sub.longitude.min())} degE, {float(ds_inst_sub.longitude.max())} degE] ({len(ds_inst_sub.longitude)} pts)")
    print(f"   - Pressure level longitude range: [{float(ds_pl.longitude.min())} degE, {float(ds_pl.longitude.max())} degE] ({len(ds_pl.longitude)} pts)")

    print("\nStep 2b: Merging single-level instantaneous and accumulation datasets...")
    # Clarify total precipitation units
    print("   [PRECIP] Total Precipitation Note:")
    print("      Variable 'tp' in ERA5 accum is total precipitation accumulated in metres (m) over the step.")
    print("      It is an accumulation depth in metres (m), NOT a rate (mm/hr). Units are explicitly preserved as 'm'.")
    ds_accum_sub["tp"].attrs["units"] = "m"
    ds_accum_sub["tp"].attrs["long_name"] = "Total precipitation (hourly accumulation in metres)"

    ds_single = xr.merge([ds_inst_sub, ds_accum_sub], compat="override")
    print(f"   Merged single-level variables: {list(ds_single.data_vars.keys())}")

    print("\nStep 2c: Aligning single-level with pressure-level data on common grid and time axis...")
    ds_merged = xr.merge([ds_pl, ds_single], compat="override")

    print(f"   Merged dataset dimensions: {dict(ds_merged.sizes)}")
    print(f"   Variables in merged dataset ({len(ds_merged.data_vars)} vars):")
    for v in ds_merged.data_vars:
        dims_str = ", ".join(ds_merged[v].dims)
        u_str = ds_merged[v].attrs.get("units", "dimensionless")
        print(f"     * {v:6s} ({dims_str:40s}): units '{u_str}'")

    # Verify coordinate alignment
    assert np.allclose(ds_merged.longitude.values, ds_pl.longitude.values), "Longitude coordinates must match exactly"
    assert np.allclose(ds_merged.latitude.values, ds_pl.latitude.values), "Latitude coordinates must match exactly"
    assert np.array_equal(ds_merged.valid_time.values, ds_pl.valid_time.values), "Valid time coordinates must match exactly"

    print("\n   [SUCCESS] Verification: All coordinates and time axes aligned with 100% precision.")
    return ds_merged


def step3_sanity_checks(ds):
    print("\n" + "=" * 80)
    print("TASK 3: GENERATING SANITY CHECK VISUALIZATIONS FOR CYCLONE AMPHAN")
    print("=" * 80)

    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------
    # Sanity Check 1: 850 hPa wind fields over Bay of Bengal
    # Dates: 2020-05-19 12:00 and 2020-05-20 12:00
    # -------------------------------------------------------------
    print("Generating sanity check 1: 850 hPa wind fields over Bay of Bengal...")
    t1 = np.datetime64("2020-05-19T12:00:00")
    t2 = np.datetime64("2020-05-20T12:00:00")

    # Slice Bay of Bengal region: lat 8N to 26N, lon 80E to 96E
    bob_lat = slice(26.0, 8.0)
    bob_lon = slice(80.0, 96.0)

    w1 = ds.sel(pressure_level=850.0, valid_time=t1, latitude=bob_lat, longitude=bob_lon)
    w2 = ds.sel(pressure_level=850.0, valid_time=t2, latitude=bob_lat, longitude=bob_lon)

    speed1 = np.sqrt(w1.u**2 + w1.v**2)
    speed2 = np.sqrt(w2.u**2 + w2.v**2)

    # Find center of circulation (minimum wind or approximate eyewall)
    lat_grid1, lon_grid1 = np.meshgrid(w1.latitude.values, w1.longitude.values, indexing="ij")
    lat_grid2, lon_grid2 = np.meshgrid(w2.latitude.values, w2.longitude.values, indexing="ij")

    fig, axes = plt.subplots(1, 2, figsize=(16, 7), facecolor="#09090b")
    fig.suptitle(
        "Super Cyclone Amphan (May 2020)   850 hPa Wind Circulation Sanity Check (ERA5)",
        fontsize=15,
        fontweight="bold",
        color="#f4f4f5",
        y=0.98,
    )

    panels = [
        (axes[0], w1, speed1, "May 19, 2020 12:00 UTC (Super Cyclonic Storm Core)", "Peak Convective Vortex"),
        (axes[1], w2, speed2, "May 20, 2020 12:00 UTC (Sundarbans Landfall)", "Landfall Inundation Eyewall"),
    ]

    for ax, w_sub, spd, title_txt, phase_txt in panels:
        ax.set_facecolor("#0f172a")
        # Wind speed contour fill
        cf = ax.contourf(
            w_sub.longitude,
            w_sub.latitude,
            spd,
            levels=np.linspace(0, 65, 27),
            cmap="turbo",
            extend="max",
        )
        # Wind quivers (skip points for readability)
        skip = 3
        q = ax.quiver(
            w_sub.longitude[::skip],
            w_sub.latitude[::skip],
            w_sub.u[::skip, ::skip],
            w_sub.v[::skip, ::skip],
            color="#ffffff",
            alpha=0.85,
            scale=450,
            width=0.0035,
        )

        max_spd = float(spd.max())
        # Find coordinates of max wind
        idx_max = np.unravel_index(np.argmax(spd.values), spd.shape)
        max_lat = float(w_sub.latitude[idx_max[0]])
        max_lon = float(w_sub.longitude[idx_max[1]])

        ax.plot(max_lon, max_lat, marker="x", color="#f43f5e", markersize=10, markeredgewidth=2.5)
        ax.annotate(
            f"Vmax: {max_spd:.1f} m/s ({max_spd*1.944:.0f} kts)\n[{max_lat:.2f} degN, {max_lon:.2f} degE]",
            xy=(max_lon, max_lat),
            xytext=(max_lon + 1.2, max_lat + 0.8),
            color="#fef08a",
            fontsize=9.5,
            fontweight="bold",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#18181b", edgecolor="#eab308", alpha=0.9),
            arrowprops=dict(arrowstyle="->", color="#eab308", lw=1.5),
        )

        # Coastline / geographic reference lines
        ax.axhline(21.65, color="#38bdf8", linestyle="--", alpha=0.4, linewidth=1)
        ax.axvline(88.35, color="#38bdf8", linestyle="--", alpha=0.4, linewidth=1)
        ax.text(88.5, 21.8, "Sundarbans Landfall Point", color="#38bdf8", fontsize=8, alpha=0.8)

        ax.set_title(f"{title_txt}\n{phase_txt}", color="#e4e4e7", fontsize=11, fontweight="bold", pad=8)
        ax.set_xlabel("Longitude ( degE)", color="#a1a1aa", fontsize=10)
        ax.set_ylabel("Latitude ( degN)", color="#a1a1aa", fontsize=10)
        ax.tick_params(colors="#a1a1aa", labelsize=9)
        ax.grid(True, color="#334155", linestyle=":", alpha=0.5)

    cbar_ax = fig.add_axes([0.15, 0.08, 0.7, 0.03])
    cbar = fig.colorbar(cf, cax=cbar_ax, orientation="horizontal")
    cbar.set_label("850 hPa Wind Speed (|V| in m s^-^1)", color="#f4f4f5", fontsize=10, fontweight="bold")
    cbar.ax.tick_params(colors="#f4f4f5", labelsize=9)

    plt.subplots_adjust(bottom=0.20, top=0.88, wspace=0.25)
    wind_out = DOCS_DIR / "sanity_amphan_wind.png"
    plt.savefig(wind_out, dpi=200, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"   [SUCCESS] Saved: {wind_out} (Size: {os.path.getsize(wind_out):,} bytes)")

    # -------------------------------------------------------------
    # Sanity Check 2: Minimum MSLP time series over Bay of Bengal
    # -------------------------------------------------------------
    print("Generating sanity check 2: Minimum MSLP time series over Bay of Bengal...")
    bob_msl_ds = ds.sel(latitude=slice(26.0, 8.0), longitude=slice(80.0, 96.0))
    # Minimum MSLP at each timestep in hPa
    min_mslp_hpa = (bob_msl_ds.msl.min(dim=["latitude", "longitude"]) / 100.0).values
    time_vals = ds.valid_time.values

    # Find minimum of the entire storm
    abs_min_idx = int(np.argmin(min_mslp_hpa))
    abs_min_time = time_vals[abs_min_idx]
    abs_min_val = min_mslp_hpa[abs_min_idx]

    fig, ax = plt.subplots(figsize=(13, 6), facecolor="#09090b")
    ax.set_facecolor("#0f172a")

    # Plot time series line
    ax.plot(
        time_vals,
        min_mslp_hpa,
        color="#38bdf8",
        linewidth=2.5,
        marker="o",
        markersize=6,
        markerfacecolor="#0284c7",
        markeredgecolor="#ffffff",
        label="Bay of Bengal Min MSLP (ERA5)",
    )

    # Shaded threshold zones for IMD cyclone classifications
    ax.axhspan(940, 960, color="#ef4444", alpha=0.15, label="Super Cyclonic Storm (< 960 hPa)")
    ax.axhspan(960, 975, color="#f97316", alpha=0.15, label="Extremely Severe Cyclonic Storm (960-975 hPa)")
    ax.axhspan(975, 990, color="#eab308", alpha=0.15, label="Very Severe Cyclonic Storm (975-990 hPa)")
    ax.axhspan(990, 1005, color="#10b981", alpha=0.10, label="Cyclonic Storm / Depression (> 990 hPa)")

    # Highlight peak intensity
    ax.scatter([abs_min_time], [abs_min_val], color="#ef4444", s=140, zorder=5, edgecolors="#ffffff", linewidth=2)
    ax.annotate(
        f"Peak Super Cyclone Amphan\nMin MSLP: {abs_min_val:.1f} hPa\n{str(abs_min_time)[:16]} UTC",
        xy=(abs_min_time, abs_min_val),
        xytext=(abs_min_time, abs_min_val - 8),
        color="#fecaca",
        fontsize=9.5,
        fontweight="bold",
        ha="center",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#450a0a", edgecolor="#ef4444", alpha=0.95),
        arrowprops=dict(arrowstyle="->", color="#ef4444", lw=2),
    )

    # Landfall milestone
    landfall_time = np.datetime64("2020-05-20T12:00:00")
    lf_idx = np.where(time_vals == landfall_time)[0][0]
    lf_val = min_mslp_hpa[lf_idx]
    ax.scatter([landfall_time], [lf_val], color="#f97316", s=120, zorder=5, edgecolors="#ffffff", linewidth=2)
    ax.annotate(
        f"Sundarbans Landfall\nMSLP: {lf_val:.1f} hPa\n2020-05-20 12:00 UTC",
        xy=(landfall_time, lf_val),
        xytext=(landfall_time + np.timedelta64(10, "h"), lf_val + 7),
        color="#fed7aa",
        fontsize=9,
        fontweight="bold",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#431407", edgecolor="#f97316", alpha=0.95),
        arrowprops=dict(arrowstyle="->", color="#f97316", lw=2),
    )

    ax.set_title(
        "Super Cyclone Amphan   Minimum Mean Sea Level Pressure Evolution (Bay of Bengal)",
        color="#f4f4f5",
        fontsize=13,
        fontweight="bold",
        pad=12,
    )
    ax.set_ylabel("Minimum Mean Sea Level Pressure (hPa)", color="#a1a1aa", fontsize=11, fontweight="bold")
    ax.set_xlabel("Time (UTC)", color="#a1a1aa", fontsize=11, fontweight="bold")
    ax.set_ylim(930, 1010)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d\n%H:00"))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=1))
    ax.tick_params(colors="#a1a1aa", labelsize=9.5)
    ax.grid(True, color="#334155", linestyle="--", alpha=0.5)

    ax.legend(loc="upper right", facecolor="#18181b", edgecolor="#3f3f46", labelcolor="#e4e4e7", fontsize=9)

    mslp_out = DOCS_DIR / "sanity_amphan_mslp.png"
    plt.savefig(mslp_out, dpi=200, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"   [SUCCESS] Saved: {mslp_out} (Size: {os.path.getsize(mslp_out):,} bytes)")


def step4_save_to_zarr(ds):
    print("\n" + "=" * 80)
    print("TASK 4: SAVING MERGED AND ALIGNED DATASET TO ZARR")
    print("=" * 80)

    ZARR_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Writing dataset to: '{ZARR_OUTPUT}'...")

    # Configure chunking suitable for spatio-temporal tracking and downscaling
    # e.g., chunk by timestep
    ds_chunked = ds.chunk({
        "valid_time": 1,
        "pressure_level": -1,
        "latitude": 141,
        "longitude": 141,
    })

    # Add global provenance metadata
    ds_chunked.attrs["title"] = "ERA5 Reanalysis - Super Cyclone Amphan (May 15-21, 2020)"
    ds_chunked.attrs["institution"] = "ECMWF / Copernicus Climate Change Service (C3S)"
    ds_chunked.attrs["project"] = "Megh-Drishti (MoES PS 26078)"
    ds_chunked.attrs["history"] = "Merged and aligned on common 65E-100E spatial grid and valid_time axis"
    ds_chunked.attrs["spatial_resolution"] = "0.25 deg (~28 km)"
    ds_chunked.attrs["precipitation_note"] = "Variable 'tp' is total precipitation in metres (accumulated depth, not rate)"

    # Save to Zarr
    ds_chunked.to_zarr(ZARR_OUTPUT, mode="w")

    print(f"\n[SUCCESS] Successfully saved Zarr store at: {ZARR_OUTPUT}")

    # Verify reload
    print("Verifying Zarr store by reloading with xarray.open_zarr()...")
    ds_reloaded = xr.open_zarr(ZARR_OUTPUT)
    print(f"   Reloaded Zarr dimensions: {dict(ds_reloaded.sizes)}")
    print(f"   Reloaded variables ({len(ds_reloaded.data_vars)}): {list(ds_reloaded.data_vars.keys())}")
    print(f"   Valid time span: {ds_reloaded.valid_time.values[0]} to {ds_reloaded.valid_time.values[-1]}")
    print(f"   Latitude range: [{float(ds_reloaded.latitude.min())} deg, {float(ds_reloaded.latitude.max())} deg]")
    print(f"   Longitude range: [{float(ds_reloaded.longitude.min())} deg, {float(ds_reloaded.longitude.max())} deg]")

    # Calculate total size of Zarr directory
    total_zarr_bytes = sum(f.stat().st_size for f in ZARR_OUTPUT.glob("**/*") if f.is_file())
    print(f"   Total Zarr Store On-Disk Size: {total_zarr_bytes:,} bytes ({total_zarr_bytes / (1024*1024):.2f} MB)")
    ds_reloaded.close()


def main():
    opened = step1_inspect_datasets()
    ds_merged = step2_merge_and_align(opened)
    step3_sanity_checks(ds_merged)
    step4_save_to_zarr(ds_merged)
    print("\n" + "=" * 80)
    print("ALL 4 TASKS COMPLETED SUCCESSFULLY.")
    print("=" * 80)


if __name__ == "__main__":
    main()
