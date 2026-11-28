# Verdigris textures: sources and licence

Every file here is derived from a Poly Haven texture. Poly Haven publishes all of its assets under
**CC0 1.0 Universal** (public domain dedication; https://polyhaven.com/license, checked 2026-11-27). No attribution
is required; the authors are listed anyway.

| File prefix | Poly Haven asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `wall_` | [stone_brick_wall_001](https://polyhaven.com/a/stone_brick_wall_001) | Dimitrios Savva, Rico Cilliers | 2.5 m | diff, nor_gl, arm |
| `dressed_` | [stone_block_wall](https://polyhaven.com/a/stone_block_wall) | Amal Kumar | 2.1 m | diff, nor_gl, arm |
| `planks_` | [weathered_planks](https://polyhaven.com/a/weathered_planks) | Dimitrios Savva, Dario Barresi | 2.0 m | diff, nor_gl, arm |
| `brick_` | [castle_brick_02_red](https://polyhaven.com/a/castle_brick_02_red) | Rob Tuytel | 1.5 m | diff, nor_gl, arm |

## What was changed

Downloaded 2026-11-27 at 1K and re-encoded as JPEG (quality 70–80) by `tools/textures/prep_verdigris.py`.

- `*_diff.jpg`: graded for Verdigris. Saturation × 0.28 (wall), × 0.22 (dressed), × 0.4 (planks), × 0.55 (brick);
  mean value set per pack; value clamped to 0.04–0.9 so no albedo is pure black or white. In the world each material
  multiplies its pack by a grey.
- `*_nor.jpg`: the OpenGL-convention (`nor_gl`) normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed map, R = ambient occlusion, G = roughness (stretched into a per-pack range),
  B = metalness (zeroed: nothing photographed here is bare metal).

Total: 1.9 MB (12 files), fetched only at 3D On (T4).
