# Brinewire textures: sources and licence

Every pack here is made from a Poly Haven texture set. All Poly Haven assets are released under **CC0 1.0 Universal**
(public domain dedication; https://polyhaven.com/license, checked 2026-11-27). No attribution is required; it is
recorded here anyway.

Each pack is three 1024 px JPGs: `<name>_diff.jpg` (albedo, sRGB), `<name>_nor.jpg` (OpenGL normal) and `<name>_arm.jpg`
(R ambient occlusion, G roughness, B metalness). They were graded and re-encoded by `tools/textures/prep_brinewire.py`
from the 1K downloads; the grading is listed below.

| Pack | Poly Haven asset | Authors | Real size | Grading |
|---|---|---|---|---|
| `board` | [wood_textured_concrete](https://polyhaven.com/a/wood_textured_concrete) | Dimitrios Savva | 1.8 m | saturation × 0.35, contrast × 1.15, roughness 0.78–0.98, metalness 0 |
| `wall` | [concrete_wall_006](https://polyhaven.com/a/concrete_wall_006) | Dario Barresi, Charlotte Baglioni | 2.0 m | saturation × 0.4, contrast × 1.2, roughness 0.74–0.98, metalness 0 |
| `pave` | [concrete_floor_worn_001](https://polyhaven.com/a/concrete_floor_worn_001) | Dimitrios Savva, Rico Cilliers | 3.0 m | saturation × 0.3, contrast × 1.3, roughness 0.62–0.95, metalness 0 |
| `block` | [concrete_block_wall](https://polyhaven.com/a/concrete_block_wall) | Charlotte Baglioni | 2.0 m | saturation × 0.35, contrast × 0.85, lifted to mid-grey, roughness 0.8–1.0, metalness 0 |
| `rock` | [rock_face](https://polyhaven.com/a/rock_face) | Greg Zaal, Dario Barresi | 2.38 m | saturation × 0.22, contrast × 1.25, roughness 0.82–1.0, metalness 0 |
| `steel` | [rusty_painted_metal](https://polyhaven.com/a/rusty_painted_metal) | Amal Kumar | 2.2 m | red paint replaced by its own luminance as a neutral grey; rust laid over it at 45% and saturation × 0.5; roughness 0.55–0.95, metalness 0 |
| `patina` | [green_metal_rust](https://polyhaven.com/a/green_metal_rust) | Rob Tuytel | 1.0 m | saturation × 0.45, roughness 0.5–0.9, metalness 0 |
| `roof` | [worn_corrugated_iron](https://polyhaven.com/a/worn_corrugated_iron) | Jenelle van Heerden, Dimitrios Savva | 1.8 m | saturation × 0.3, roughness 0.5–0.9, metalness 0 |

Total on disk: about 3.0 MB. Fetched only at 3D On (T4); below that, and if a file fails, the procedural maps stay.
