"""Unit tests for EFI calculation, 4D connected-component tracking, and Amphan IMD track verification."""

import pytest
import numpy as np
from ml.tracking.efi import compute_anomaly_zscore, compute_efi_from_zscore, compute_ensemble_efi
from ml.tracking.tracker import SpatioTemporalTracker
from ml.tracking.gnn import SphericalGNNTracker


# Known IMD Best-Track for Super Cyclonic Storm AMPHAN (May 16–21, 2020)
IMD_AMPHAN_BEST_TRACK = [
    {"time": "2020-05-16 03:00", "lat": 10.4, "lon": 86.4, "stage": "Depression"},
    {"time": "2020-05-17 03:00", "lat": 11.5, "lon": 86.0, "stage": "Cyclonic Storm"},
    {"time": "2020-05-18 03:00", "lat": 13.4, "lon": 86.2, "stage": "Super Cyclonic Storm"},
    {"time": "2020-05-19 12:00", "lat": 17.5, "lon": 87.0, "stage": "Extremely Severe CS"},
    {"time": "2020-05-20 12:00", "lat": 21.7, "lon": 88.3, "stage": "Landfall (Sundarbans)"},
    {"time": "2020-05-21 03:00", "lat": 25.5, "lon": 89.6, "stage": "Depression (Bangladesh)"},
]


def test_efi_range_and_bounds():
    """Verify that EFI output is strictly bounded in [-1.0, +1.0] across all input extremes."""
    # Test extreme positive, extreme negative, and baseline z-scores
    z_scores = np.array([-10.0, -5.0, -2.0, 0.0, 1.5, 2.0, 3.5, 8.0, 100.0])
    efi = compute_efi_from_zscore(z_scores)

    # 1. Strict boundaries [-1.0, +1.0]
    assert np.all(efi >= -1.0), "EFI values must never be less than -1.0"
    assert np.all(efi <= 1.0), "EFI values must never exceed +1.0"

    # 2. Climatological normal (Z=0) produces EFI = 0.0
    zero_idx = np.where(z_scores == 0.0)[0][0]
    assert np.isclose(efi[zero_idx], 0.0, atol=1e-4)

    # 3. Monotonic increasing property
    assert np.all(np.diff(efi) >= 0), "EFI must increase monotonically with Z-score"


def test_anomaly_zscore_calculation():
    """Verify standard standardized anomaly z-score calculation."""
    obs = np.array([[30.0, 50.0], [70.0, 100.0]])
    clim_mean = np.array([[50.0, 50.0], [50.0, 50.0]])
    clim_std = np.array([[10.0, 10.0], [10.0, 10.0]])

    z = compute_anomaly_zscore(obs, clim_mean, clim_std)
    expected = np.array([[-2.0, 0.0], [2.0, 5.0]])

    assert np.allclose(z, expected, atol=1e-5)


def test_ensemble_efi_synthetic():
    """Test ensemble EFI computation against synthetic climatology."""
    # 20 ensemble members over 10x10 spatial grid
    members = np.random.normal(loc=85.0, scale=10.0, size=(20, 10, 10))
    clim_percentiles = np.random.normal(loc=40.0, scale=8.0, size=(100, 10, 10))

    efi = compute_ensemble_efi(members, clim_percentiles, p_steps=50)

    assert efi.shape == (10, 10)
    assert np.all(efi >= -1.0) and np.all(efi <= 1.0)
    # Since forecast is significantly higher than climatology, EFI should be positive
    assert np.mean(efi) > 0.5


def test_spatiotemporal_tracker_synthetic_vortex():
    """Test 4D connected-component tracker on a synthetic moving vortex across 5 timesteps."""
    t_steps = 5
    height, width = 30, 30
    lats = np.linspace(10.0, 25.0, height)
    lons = np.linspace(80.0, 95.0, width)
    timestamps = [f"2020-05-{16+i} 06:00" for i in range(t_steps)]

    # Generate synthetic moving anomaly vortex: moves northeastward from (lat 12, lon 83) to (lat 22, lon 89)
    tensor = np.zeros((t_steps, height, width), dtype=np.float32)
    start_y, start_x = 5, 6
    for t in range(t_steps):
        center_y = start_y + t * 4
        center_x = start_x + t * 3
        y_grid, x_grid = np.ogrid[:height, :width]
        dist_sq = (y_grid - center_y) ** 2 + (x_grid - center_x) ** 2
        # Gaussian vortex with peak EFI = 0.95
        tensor[t] = 0.95 * np.exp(-dist_sq / (2.0 * 2.5**2))

    tracker = SpatioTemporalTracker(threshold=0.6, min_pixels=3)
    tracks = tracker.track_sequence(tensor, lats, lons, timestamps)

    assert len(tracks) >= 1, "Tracker must detect and persist the synthetic vortex"
    main_track = tracks[0]
    assert main_track["duration_steps"] == t_steps, f"Expected {t_steps} steps, got {main_track['duration_steps']}"

    # Verify northward/eastward trajectory progression
    waypoint_lats = [wp["lat"] for wp in main_track["waypoints"]]
    waypoint_lons = [wp["lon"] for wp in main_track["waypoints"]]
    assert waypoint_lats[-1] > waypoint_lats[0], "Track must show northward propagation"
    assert waypoint_lons[-1] > waypoint_lons[0], "Track must show eastward propagation"

    # Verify 4D bounding boxes
    for wp in main_track["waypoints"]:
        min_lat, min_lon, max_lat, max_lon = wp["bounding_box"]
        assert min_lat <= wp["lat"] <= max_lat, "Centroid must be within latitude bounding box"
        assert min_lon <= wp["lon"] <= max_lon, "Centroid must be within longitude bounding box"

    # Verify GeoJSON export
    geojson = tracker.to_geojson(tracks)
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) > 0


def test_gnn_flag_default():
    """Verify GNN on icosahedral mesh goes behind flag USE_GNN=false by default."""
    gnn_tracker = SphericalGNNTracker()
    # Default without env override must be False
    assert gnn_tracker.use_gnn is False

    traj = gnn_tracker.predict_trajectory(
        current_lat=12.0,
        current_lon=86.0,
        intensity=95.0,
        shear_kts=55.0,
        lead_hours=24,
        step_hours=6,
    )
    assert len(traj) == 5  # T+0, T+6, T+12, T+18, T+24
    assert traj[0]["method"] == "spherical_topological_baseline"


def test_amphan_tracked_vs_imd_best_track():
    """Verify Cyclone Amphan tracking lat/lon trajectory against known IMD Best-Track coordinates."""
    # Create Bay of Bengal grid covering Amphan track: lat 8N to 28N, lon 80E to 94E
    lats = np.linspace(8.0, 28.0, 80)
    lons = np.linspace(80.0, 94.0, 80)
    timestamps = [pt["time"] for pt in IMD_AMPHAN_BEST_TRACK]
    n_steps = len(IMD_AMPHAN_BEST_TRACK)

    # Construct ERA5-like pressure depression / vorticity anomaly field aligned with Amphan's synoptic center
    anomaly_tensor = np.zeros((n_steps, len(lats), len(lons)), dtype=np.float32)
    for t_idx, imd_pt in enumerate(IMD_AMPHAN_BEST_TRACK):
        target_lat = imd_pt["lat"]
        target_lon = imd_pt["lon"]
        # Add slight atmospheric perturbation to test tracker robustness (+/- 0.3 deg)
        sim_lat = target_lat + 0.15 * np.sin(t_idx)
        sim_lon = target_lon - 0.12 * np.cos(t_idx)

        # Place intense low pressure / EFI vortex
        for i, lat in enumerate(lats):
            for j, lon in enumerate(lons):
                dist = np.sqrt(((lat - sim_lat) * 111.0)**2 + ((lon - sim_lon) * 111.0 * np.cos(np.radians(sim_lat)))**2)
                if dist < 180.0:  # 180km core radius
                    anomaly_tensor[t_idx, i, j] = max(0.0, float(0.92 * (1.0 - (dist / 180.0)**1.5)))

    tracker = SpatioTemporalTracker(threshold=0.55, min_pixels=4, max_jump_km=600.0)
    tracks = tracker.track_sequence(anomaly_tensor, lats, lons, timestamps)

    assert len(tracks) >= 1, "Tracker must identify Cyclone Amphan trajectory"
    amphan_track = tracks[0]
    tracked_wps = amphan_track["waypoints"]

    print("\n--- Cyclone Amphan Track Verification vs IMD Best Track ---")
    for i, (imd_pt, trk_wp) in enumerate(zip(IMD_AMPHAN_BEST_TRACK, tracked_wps)):
        lat_err = abs(trk_wp["lat"] - imd_pt["lat"])
        lon_err = abs(trk_wp["lon"] - imd_pt["lon"])
        dist_err_km = np.sqrt((lat_err * 111.0)**2 + (lon_err * 111.0 * np.cos(np.radians(imd_pt["lat"])))**2)
        print(f"[{imd_pt['time']}] {imd_pt['stage']:24s} | IMD: ({imd_pt['lat']:5.2f}N, {imd_pt['lon']:5.2f}E) | Tracked: ({trk_wp['lat']:5.2f}N, {trk_wp['lon']:5.2f}E) | Delta: {dist_err_km:5.1f} km")

        # Approximate check: tracked center should be within 60 km of IMD best-track center
        assert dist_err_km < 60.0, f"Step {i} error too large: {dist_err_km:.1f} km (limit 60 km)"

    # Final verification: Landfall at West Bengal / Sundarbans near lat 21.7°N
    landfall_wp = tracked_wps[4]
    assert 21.0 <= landfall_wp["lat"] <= 22.5, f"Landfall lat out of range: {landfall_wp['lat']}"
    assert 87.5 <= landfall_wp["lon"] <= 89.0, f"Landfall lon out of range: {landfall_wp['lon']}"
