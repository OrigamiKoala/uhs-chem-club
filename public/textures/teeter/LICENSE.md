# Teeter textures: sources and licence

Every file here is derived from a Poly Haven texture. Poly Haven publishes all of its assets under
**CC0 1.0 Universal** (public domain dedication; https://polyhaven.com/license, checked 2026-11-27). No attribution
is required; the authors are listed anyway.

| File prefix | Poly Haven asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `ground_` | [dry_mud_field_001](https://polyhaven.com/a/dry_mud_field_001) | Rob Tuytel, Rico Cilliers | 3.0 m | diff, nor_gl, arm |
| `wall_` | [sandstone_blocks_05](https://polyhaven.com/a/sandstone_blocks_05) | Rob Tuytel | 3.0 m | diff, nor_gl, arm |
| `flags_` | [sandstone_blocks_08](https://polyhaven.com/a/sandstone_blocks_08) | Rob Tuytel | 3.0 m | diff, nor_gl, arm |
| `setts_` | [square_cobblestone](https://polyhaven.com/a/square_cobblestone) | Sơn Nguyễn | 2.0 m | diff, nor_gl, arm |
| `timber_` | [weathered_planks](https://polyhaven.com/a/weathered_planks) | Dario Barresi, Dimitrios Savva | 2.0 m | diff, nor_gl, arm |
| `brick_` | [medieval_red_brick](https://polyhaven.com/a/medieval_red_brick) | Rob Tuytel | 2.0 m | diff, nor_gl, arm |

## What was changed

Downloaded 2026-11-27 at 1K and re-encoded as JPEG (quality 70–80) by `tools/textures/prep_teeter.py`.

- `*_diff.jpg`: graded for Teeter. Saturation × 0.22 (ground), × 0.42 (wall), × 0.35 (flags), × 0.3 (setts),
  × 0.45 (timber), × 0.65 (brick); mean value set per pack; value clamped to 0.04–0.9 (ground 0.93) so no albedo is
  pure black or white. In the world each material multiplies its pack by a grey; the ground and the stair multiply
  theirs by the terrain's vertex paint.
- `*_nor.jpg`: the OpenGL-convention (`nor_gl`) normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed map, R = ambient occlusion, G = roughness (stretched into a per-pack range),
  B = metalness (zeroed: nothing here is bare metal).

Total: 2.9 MB (18 files), fetched only at 3D On (T4).
