# Quicklight textures: sources and licence

Every file here is derived from a Poly Haven texture. Poly Haven publishes all of its assets under
**CC0 1.0 Universal** (public domain dedication; https://polyhaven.com/license, checked 2026-11-27). No attribution
is required; the authors are listed anyway.

| File prefix | Poly Haven asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `lava_` | [rock_3](https://polyhaven.com/a/rock_3) | Rob Tuytel | 1.5 m | diff, nor_gl, arm |
| `gravel_` | [gravel_stones](https://polyhaven.com/a/gravel_stones) | Amal Kumar | 2.0 m | diff, nor_gl, arm |
| `slab_` | [brushed_concrete_2](https://polyhaven.com/a/brushed_concrete_2) | Dario Barresi, Dimitrios Savva | 2.5 m | diff, nor_gl, arm |
| `wall_` | [concrete_wall_006](https://polyhaven.com/a/concrete_wall_006) | Charlotte Baglioni, Dario Barresi | 2.0 m | diff, nor_gl, arm |
| `steel_` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | Rob Tuytel | 2.0 m | diff, nor_gl, arm |
| `paint_` | [green_metal_rust](https://polyhaven.com/a/green_metal_rust) | Rob Tuytel | 1.0 m | diff, nor_gl, arm |
| `sheet_` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | Sergej Majboroda, Jenelle van Heerden | 2.7 m | diff, nor_gl, arm |

## What was changed

Downloaded 2026-11-27 at 1K and re-encoded as JPEG (quality 70–80) by `tools/textures/prep_quicklight.py`.

- `*_diff.jpg`: graded for Quicklight. Saturation × 0.15 (lava, tinted a little cool), × 0.2 (gravel), × 0.12 (slab,
  wall: their brown cast taken out, a little cool), × 0.5 (steel), × 0.4 (sheet); `paint` taken to grey except where
  rust shows through, then × 0.6. Mean value set per pack; value clamped to 0.035–0.9 (lava, gravel 0.92, paint 0.93)
  so no albedo is pure black or white. In the world each material multiplies its pack by a grey or a paint colour;
  the ground and the yard multiply theirs by the terrain's vertex paint.
- `*_nor.jpg`: the OpenGL-convention (`nor_gl`) normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed map, R = ambient occlusion, G = roughness (stretched into a per-pack range),
  B = metalness (× 0.5 for steel, × 0.6 for sheet, zeroed for the rest).

Total: 3.3 MB (21 files), fetched only at 3D On (T4).
