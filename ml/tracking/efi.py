"""Extreme Forecast Index (EFI) and 30-Year Climatology Anomaly Calculator.

Adheres strictly to scientific meteorological definitions (MoES PS 26078 & ECMWF standard):
- EFI range is strictly [-1.0, +1.0] (never percentage).
- Standardized anomaly z-score Z = (X - mu_clim) / sigma_clim.
- Bounded nonlinear CDF mapping: EFI = erf(Z / (sqrt(2) * k)).
"""

import math
from typing import Union, Tuple
import numpy as np
from scipy.special import erf


def compute_anomaly_zscore(
    observed: np.ndarray,
    clim_mean: np.ndarray,
    clim_std: np.ndarray,
    eps: float = 1e-6,
) -> np.ndarray:
    """Compute standardized anomaly z-score against 30-year climatology.

    Args:
        observed: 2D or 3D array of observed/forecast field values.
        clim_mean: 30-year climatological mean of the same spatial shape.
        clim_std: 30-year climatological standard deviation of the same spatial shape.
        eps: Small epsilon to prevent division by zero in zero-variance regions.

    Returns:
        Standardized z-score array Z = (X - mu) / sigma.
    """
    safe_std = np.maximum(clim_std, eps)
    z = (observed - clim_mean) / safe_std
    return z


def compute_efi_from_zscore(
    z_score: np.ndarray,
    sensitivity: float = 1.8,
) -> np.ndarray:
    """Convert standardized anomaly z-scores to Extreme Forecast Index (EFI) in [-1.0, +1.0].

    EFI = erf(Z / (sqrt(2) * sensitivity))
    Strictly bounded in [-1.0, +1.0].
    - Z = 0  -> EFI = 0.0 (Climatological normal)
    - Z = +2 -> EFI ~ +0.67 (Substantial anomaly)
    - Z >= +3 -> EFI ~ +0.89 to +0.99 (Extreme anomaly)
    - Negative Z values indicate deficit / suppressed anomalies in [-1.0, 0.0].

    Args:
        z_score: Standardized anomaly z-scores.
        sensitivity: Scaling factor calibrating EFI spread.

    Returns:
        EFI array with values strictly clamped within [-1.0, +1.0].
    """
    scaled = z_score / (math.sqrt(2.0) * sensitivity)
    efi = erf(scaled)
    # Ensure strict floating point clamping
    return np.clip(efi, -1.0, 1.0)


def compute_ensemble_efi(
    forecast_members: np.ndarray,
    clim_percentiles: np.ndarray,
    p_steps: int = 100,
) -> np.ndarray:
    """Compute standard ECMWF integral EFI across ensemble forecast members against climatological percentiles.

    EFI = (2 / pi) * Integral_0^1 ( [p - F_f(Q_c(p))] / sqrt(p * (1 - p)) ) dp

    Args:
        forecast_members: Shape (M, H, W) where M is number of ensemble members.
        clim_percentiles: 30-year climatological distribution quantiles.
        p_steps: Number of integration steps between (0, 1).

    Returns:
        2D EFI array with values in [-1.0, +1.0].
    """
    # Numerical integration using midpoint rule avoiding singularities at p=0 and p=1
    p_vals = np.linspace(0.01, 0.99, p_steps)
    dp = p_vals[1] - p_vals[0]
    weights = dp / np.sqrt(p_vals * (1.0 - p_vals))

    m_members = forecast_members.shape[0]
    accumulated_diff = np.zeros(forecast_members.shape[1:], dtype=np.float64)

    for i, p in enumerate(p_vals):
        q_c = np.quantile(clim_percentiles, p, axis=0) if clim_percentiles.ndim > 2 else clim_percentiles
        # Fraction of forecast members less than or equal to climatological quantile Q_c(p)
        f_f = np.sum(forecast_members <= q_c, axis=0) / float(m_members)
        accumulated_diff += (p - f_f) * weights[i]

    efi = (2.0 / math.pi) * accumulated_diff
    return np.clip(efi, -1.0, 1.0)
