"""
export_glb.py — Decimate to <= 8k triangles, weld vertices, and export .glb into public/quests/q1/
"""

import os
import sys
import numpy as np

def export_glb_mesh(verts, faces, output_path):
    try:
        import trimesh
        mesh = trimesh.Trimesh(vertices=verts, faces=faces)
        # Decimate if necessary
        if len(mesh.faces) > 8000:
            mesh = mesh.simplify_quadric_decimation(8000)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        mesh.export(output_path, file_type="glb")
        print(f"Exported {output_path} ({len(mesh.vertices)} verts, {len(mesh.faces)} faces)")
    except ImportError:
        print("trimesh not installed; skipping binary GLB export. Three.js client will use procedural fallback.")

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "../../public/quests/q1")
    print(f"Density pipeline target: {out_dir}")
