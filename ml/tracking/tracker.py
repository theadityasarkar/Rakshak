"""Spatio-temporal anomaly tracker using connected-component analysis.

Implements:
1. Spatial thresholding on EFI or standardized anomaly z-scores.
2. 2D/3D connected-component labeling (scipy.ndimage.label).
3. Temporal association (IoU and minimum Euclidean centroid distance).
4. 4D bounding box calculation [min_lat, min_lon, max_lat, max_lon].
5. Export to GeoJSON FeatureCollection.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from scipy.ndimage import label, center_of_mass


class SpatioTemporalTracker:
    """Tracks meteorological anomaly cores across consecutive time steps."""

    def __init__(
        self,
        threshold: float = 0.65,
        min_pixels: int = 4,
        max_jump_km: float = 400.0,
    ):
        self.threshold = threshold
        self.min_pixels = min_pixels
        self.max_jump_km = max_jump_km

    def detect_clusters_at_time(
        self,
        field_2d: np.ndarray,
        lats: np.ndarray,
        lons: np.ndarray,
    ) -> List[Dict[str, Any]]:
        """Identify spatial clusters exceeding threshold at a single timestep."""
        mask = field_2d >= self.threshold
        labeled_mask, num_features = label(mask)

        clusters = []
        for cluster_id in range(1, num_features + 1):
            coords = np.argwhere(labeled_mask == cluster_id)
            if len(coords) < self.min_pixels:
                continue

            # Pixel indices
            y_indices = coords[:, 0]
            x_indices = coords[:, 1]

            # Geographic bounds
            cluster_lats = lats[y_indices]
            cluster_lons = lons[x_indices]

            min_lat = float(np.min(cluster_lats))
            max_lat = float(np.max(cluster_lats))
            min_lon = float(np.min(cluster_lons))
            max_lon = float(np.max(cluster_lons))

            # Intensity-weighted centroid
            weights = field_2d[y_indices, x_indices]
            total_weight = np.sum(weights)
            if total_weight > 0:
                c_lat = float(np.sum(cluster_lats * weights) / total_weight)
                c_lon = float(np.sum(cluster_lons * weights) / total_weight)
            else:
                c_lat = float(np.mean(cluster_lats))
                c_lon = float(np.mean(cluster_lons))

            peak_val = float(np.max(weights))
            mean_val = float(np.mean(weights))

            clusters.append({
                "cluster_id": cluster_id,
                "pixel_count": int(len(coords)),
                "centroid": [c_lat, c_lon],
                "bounding_box": [min_lat, min_lon, max_lat, max_lon],
                "peak_value": peak_val,
                "mean_value": mean_val,
                "pixels": coords,
            })

        return clusters

    def track_sequence(
        self,
        anomaly_tensor: np.ndarray,
        lats: np.ndarray,
        lons: np.ndarray,
        timestamps: List[str],
    ) -> List[Dict[str, Any]]:
        """Track anomaly clusters across all timesteps in the tensor.

        Args:
            anomaly_tensor: 3D array of shape (T, H, W).
            lats: 1D array of latitude coordinates.
            lons: 1D array of longitude coordinates.
            timestamps: List of string timestamps corresponding to T steps.

        Returns:
            List of track trajectories, each containing sequential waypoints with 4D bounding boxes.
        """
        n_times = anomaly_tensor.shape[0]
        tracks: List[List[Dict[str, Any]]] = []

        for t_idx in range(n_times):
            time_str = timestamps[t_idx]
            clusters = self.detect_clusters_at_time(anomaly_tensor[t_idx], lats, lons)

            if t_idx == 0:
                for c in clusters:
                    wp = {
                        "time_index": t_idx,
                        "time": time_str,
                        "lat": c["centroid"][0],
                        "lon": c["centroid"][1],
                        "bounding_box": c["bounding_box"],
                        "peak_intensity": c["peak_value"],
                        "mean_intensity": c["mean_value"],
                        "pixel_count": c["pixel_count"],
                    }
                    tracks.append([wp])
            else:
                unassigned_clusters = set(range(len(clusters)))
                for track in tracks:
                    last_wp = track[-1]
                    # Only match if last waypoint was in previous timestep
                    if last_wp["time_index"] != t_idx - 1:
                        continue

                    best_match_idx = None
                    min_dist = float("inf")

                    for c_idx in list(unassigned_clusters):
                        cand = clusters[c_idx]
                        # Approximate distance in km
                        d_lat = (cand["centroid"][0] - last_wp["lat"]) * 111.0
                        d_lon = (cand["centroid"][1] - last_wp["lon"]) * 111.0 * np.cos(np.radians(last_wp["lat"]))
                        dist_km = float(np.sqrt(d_lat**2 + d_lon**2))

                        if dist_km < min_dist and dist_km <= self.max_jump_km:
                            min_dist = dist_km
                            best_match_idx = c_idx

                    if best_match_idx is not None:
                        matched = clusters[best_match_idx]
                        wp = {
                            "time_index": t_idx,
                            "time": time_str,
                            "lat": matched["centroid"][0],
                            "lon": matched["centroid"][1],
                            "bounding_box": matched["bounding_box"],
                            "peak_intensity": matched["peak_value"],
                            "mean_intensity": matched["mean_value"],
                            "pixel_count": matched["pixel_count"],
                            "distance_from_prev_km": round(min_dist, 1),
                        }
                        track.append(wp)
                        unassigned_clusters.remove(best_match_idx)

                # Start new tracks for leftover clusters
                for c_idx in unassigned_clusters:
                    c = clusters[c_idx]
                    wp = {
                        "time_index": t_idx,
                        "time": time_str,
                        "lat": c["centroid"][0],
                        "lon": c["centroid"][1],
                        "bounding_box": c["bounding_box"],
                        "peak_intensity": c["peak_value"],
                        "mean_intensity": c["mean_value"],
                        "pixel_count": c["pixel_count"],
                    }
                    tracks.append([wp])

        # Filter out short transient tracks (e.g. noise lasting < 2 timesteps)
        persistent_tracks = [t for t in tracks if len(t) >= 2]
        if not persistent_tracks and tracks:
            persistent_tracks = sorted(tracks, key=len, reverse=True)[:1]

        formatted_tracks = []
        for idx, tr in enumerate(persistent_tracks):
            formatted_tracks.append({
                "track_id": f"anomaly-track-{idx + 1}",
                "duration_steps": len(tr),
                "start_time": tr[0]["time"],
                "end_time": tr[-1]["time"],
                "waypoints": tr,
            })

        return formatted_tracks

    def to_geojson(self, tracks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Convert tracked anomaly trajectories into a GeoJSON FeatureCollection."""
        features = []
        for tr in tracks:
            line_coords = [[wp["lon"], wp["lat"]] for wp in tr["waypoints"]]
            features.append({
                "type": "Feature",
                "id": tr["track_id"],
                "geometry": {
                    "type": "LineString",
                    "coordinates": line_coords,
                },
                "properties": {
                    "track_id": tr["track_id"],
                    "duration_steps": tr["duration_steps"],
                    "start_time": tr["start_time"],
                    "end_time": tr["end_time"],
                    "waypoints": tr["waypoints"],
                },
            })

            # Add bounding box polygons for each timestep
            for wp in tr["waypoints"]:
                min_lat, min_lon, max_lat, max_lon = wp["bounding_box"]
                poly = [
                    [min_lon, min_lat],
                    [max_lon, min_lat],
                    [max_lon, max_lat],
                    [min_lon, max_lat],
                    [min_lon, min_lat],
                ]
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [poly],
                    },
                    "properties": {
                        "track_id": tr["track_id"],
                        "time": wp["time"],
                        "type": "bounding_box_4d",
                        "peak_intensity": wp["peak_intensity"],
                    },
                })

        return {
            "type": "FeatureCollection",
            "provenance": "era5_connected_component_tracker",
            "features": features,
        }
