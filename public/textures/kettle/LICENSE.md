# Kettle textures: sources and licence

Every file here is derived from a Poly Haven texture. Poly Haven publishes all of its assets under
**CC0 1.0 Universal** (public domain dedication; https://polyhaven.com/license, checked 2026-11-27). No attribution
is required; the authors are listed anyway.

| File prefix | Poly Haven asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `crust_` | [dry_ground_01](https://polyhaven.com/a/dry_ground_01) | Rob Tuytel | 4.0 m | diff, nor_gl, arm |
| `slag_` | [gravel_stones](https://polyhaven.com/a/gravel_stones) | Amal Kumar | 2.0 m | diff, nor_gl, arm |
| `concrete_` | [concrete_floor_worn_001](https://polyhaven.com/a/concrete_floor_worn_001) | Dimitrios Savva, Rico Cilliers | 3.0 m | diff, nor_gl, arm |
| `brick_` | [red_brick_03](https://polyhaven.com/a/red_brick_03) | Rob Tuytel | 1.0 m | diff, nor_gl, arm |
| `sheet_` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | Sergej Majboroda, Jenelle van Heerden | 2.7 m | diff, nor_gl, arm |
| `metal_` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | Rob Tuytel | 2.0 m | diff, nor_gl, arm |

## What was changed

Downloaded 2026-11-27 at 1K and re-encoded as JPEG (quality 70–80) by `tools/textures/prep_kettle.py`.

- `*_diff.jpg`: graded for Kettle. Saturation × 0.2 (crust), × 0.25 (slag), × 0.4 (concrete, warmed slightly),
  × 0.72 (brick), × 0.35 (sheet), × 0.5 (metal); mean value set per pack; contrast raised on the crust, slag and
  concrete; value clamped to 0.04–0.9 (crust 0.93) so no albedo is pure black or white. In the world each building
  material multiplies its pack by its own paint colour; the ground multiplies the crust and slag by its vertex paint.
- `*_nor.jpg`: the OpenGL-convention (`nor_gl`) normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed map, R = ambient occlusion, G = roughness, B = metalness. Metalness zeroed for
  every pack except `sheet` and `metal`.

Total: 2.9 MB (18 files), fetched only at 3D On (T4).
