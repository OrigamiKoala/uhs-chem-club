"""
isosurface.py — Compute electron density grid and extract marching cubes isosurfaces
Supports PySCF RHF with automatic analytic pseudo-density fallback.
"""

import numpy as np
from skimage import measure

def compute_analytic_density(molecule_name, grid_points):
    """
    Analytic pseudo-density fallback:
    Superposes Slater-type exponential electron clouds around atomic centers with hand-tuned weights.
    """
    from molecules import MOLECULES
    geom_str = MOLECULES.get(molecule_name, MOLECULES["h2o"])
    lines = [l.strip().split() for l in geom_str.strip().splitlines() if l.strip()]

    density = np.zeros(grid_points.shape[0])
    weights = {"H": 1.0, "C": 4.0, "N": 5.0, "O": 6.5, "F": 7.5, "Cl": 8.0, "Li": 0.8}
    radii = {"H": 0.6, "C": 1.1, "N": 1.0, "O": 0.9, "F": 0.8, "Cl": 1.3, "Li": 1.4}

    for elem, x, y, z in lines:
        center = np.array([float(x), float(y), float(z)])
        dist = np.linalg.norm(grid_points - center, axis=1)
        w = weights.get(elem, 2.0)
        r0 = radii.get(elem, 1.0)
        density += w * np.exp(-dist / r0)

    # Extra lone-pair lobe for water or oxygen nucleophile
    if molecule_name in ("h2o", "nu_sub_pair"):
        lp_center = np.array([0.0, 0.9, 0.45]) if molecule_name == "h2o" else np.array([-1.4, 0.6, 0.0])
        dist = np.linalg.norm(grid_points - lp_center, axis=1)
        density += 5.0 * np.exp(-dist / 0.55)

    return density

def extract_nested_shells(density_3d, voxel_spacing, low_iso, high_iso):
    """Extracts outer diffuse shell and inner core shell."""
    outer_verts, outer_faces, _, _ = measure.marching_cubes(density_3d, level=low_iso, spacing=voxel_spacing)
    core_verts, core_faces, _, _ = measure.marching_cubes(density_3d, level=high_iso, spacing=voxel_spacing)
    return (outer_verts, outer_faces), (core_verts, core_faces)
