# Lanternfall textures: sources and licence

Every file here is derived from a CC0 texture. Poly Haven publishes all of its assets under **CC0 1.0 Universal**
(https://polyhaven.com/license); ambientCG publishes all of its assets under **CC0 1.0 Universal**
(https://ambientcg.com/license). No attribution is required; the authors are listed anyway.

| File prefix | Source asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `snow_` | [ambientCG Snow010A](https://ambientcg.com/a/Snow010A) | ambientCG (Lennart Demes) | not published; laid at 2.5 m | Color, NormalGL, AmbientOcclusion, Roughness |
| `rock_` | [Poly Haven rock_face_03](https://polyhaven.com/a/rock_face_03) | Dario Barresi (photography), Rico Cilliers (processing) | 2.7 m | diff, nor_gl, arm |
| `till_` | [Poly Haven gray_rocks](https://polyhaven.com/a/gray_rocks) | Dimitrios Savva | 1.8 m | diff, nor_gl, arm |
| `timber_` | [Poly Haven wood_planks_grey](https://polyhaven.com/a/wood_planks_grey) | Rob Tuytel | 1.5 m | diff, nor_gl, arm |
| `sheet_` | [Poly Haven corrugated_iron_03](https://polyhaven.com/a/corrugated_iron_03) | Charlotte Baglioni | 2.0 m | diff, nor_gl, arm |
| `plate_` | [Poly Haven rusty_metal_02](https://polyhaven.com/a/rusty_metal_02) | Rob Tuytel | 1.0 m | diff, nor_gl, arm |

## What was changed

Downloaded 2026-11-27 at 1K and re-encoded as JPEG (quality 74–80) by `tools/textures/prep_lanternfall.py`.

- `*_diff.jpg`: graded toward a neutral grey so the material colour or the vertex paint sets the tone: saturation
  × 0.12 (snow, rock), × 0.18 (till), × 0.25 (sheet), × 0.28 (plate), × 0.40 (timber); mean value set per pack;
  value clamped to 0.04–0.94 so no albedo is pure black or white.
- `*_nor.jpg`: the OpenGL-convention normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: R = ambient occlusion, G = roughness, B = metalness (three.js reads `aoMap` from R, `roughnessMap`
  from G, `metalnessMap` from B). Poly Haven's packed `arm` as published (metalness zeroed for rock, till and timber);
  for `snow_` packed from ambientCG's separate AO and roughness maps with metalness 0.
