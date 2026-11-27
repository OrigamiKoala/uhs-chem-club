# Tallow textures: sources and licence

Every file here is derived from a Poly Haven texture. Poly Haven publishes all of its assets under
**CC0 1.0 Universal** (public domain dedication; https://polyhaven.com/license). No attribution is
required; the authors are listed anyway.

| File prefix | Poly Haven asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `sheet_` | [rusty_metal_02](https://polyhaven.com/a/rusty_metal_02) | Rob Tuytel | 1.0 m | diff, nor_gl, arm |
| `concrete_` | [concrete_wall_008](https://polyhaven.com/a/concrete_wall_008) | Charlotte Baglioni (photography), Dario Barresi (processing) | 2.71 m | diff, nor_gl, arm |
| `drum_` | [rusty_metal_04](https://polyhaven.com/a/rusty_metal_04) | Amal Kumar | 2.0 m | diff, nor_gl, arm |
| `grain_` | [rough_concrete](https://polyhaven.com/a/rough_concrete) | Dimitrios Savva | 1.23 m | diff (as a detail layer), nor_gl |

## What was changed

Downloaded 2026-11-26 at 1K and re-encoded as JPEG (quality 70–88) to keep the world's download near 2 MB.

- `*_diff.jpg`: graded into Tallow's palette. `sheet` saturation × 0.32, `drum` × 0.62 with blue/cyan flecks
  removed, `concrete` × 0.70; `sheet` and `drum` warmed toward brown; value clamped to 0.04–0.86 so no albedo is
  pure black or white. `grain_diff.jpg` is the luminance of `rough_concrete` high-passed about mid-grey: it is a
  detail layer multiplied into the salt crust, not a colour.
- `*_nor.jpg`: the OpenGL-convention (`nor_gl`) normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed map, R = ambient occlusion, G = roughness, B = metalness (three.js reads
  `aoMap` from R, `roughnessMap` from G, `metalnessMap` from B, so one file serves all three).

The preparation script is recorded in `docs/plans/realism-tallow.md`.
