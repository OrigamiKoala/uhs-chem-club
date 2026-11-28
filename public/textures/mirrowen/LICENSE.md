# Mirrowen textures: sources and licence

Every file here is derived from a CC0 texture. Poly Haven publishes all of its assets under **CC0 1.0 Universal**
(https://polyhaven.com/license, checked 2026-11-27). No attribution is required; the authors are listed anyway.

| File prefix | Source asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `setts_` | [square_cobblestone](https://polyhaven.com/a/square_cobblestone) | Sơn Nguyễn | 2.0 m | diff, nor_gl, arm |
| `snow_` | [snow_01](https://polyhaven.com/a/snow_01) | Rob Tuytel | 2.0 m | diff, nor_gl, arm |
| `granite_` | [granite_wall](https://polyhaven.com/a/granite_wall) | Dimitrios Savva | 1.9 m | diff, nor_gl, arm |
| `concrete_` | [concrete_wall_004](https://polyhaven.com/a/concrete_wall_004) | Charlotte Baglioni (photography), Dario Barresi (processing) | 2.0 m | diff, nor_gl, arm |
| `plate_` | [blue_metal_plate](https://polyhaven.com/a/blue_metal_plate) | Rob Tuytel | 2.5 m | diff, nor_gl, arm |
| `deck_` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | Rob Tuytel | 2.0 m | diff, nor_gl, arm |
| `rust_` | [rusty_metal_04](https://polyhaven.com/a/rusty_metal_04) | Amal Kumar | 2.0 m | diff, nor_gl, arm |
| `boards_` | [weathered_brown_planks](https://polyhaven.com/a/weathered_brown_planks) | Dimitrios Savva (photography), Rico Cilliers (processing) | 1.8 m | diff, nor_gl, arm |
| `roof_` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | Sergej Majboroda (photography), Jenelle van Heerden (processing) | 2.7 m | diff, nor_gl, arm |
| `brick_` | [red_brick_03](https://polyhaven.com/a/red_brick_03) | Rob Tuytel | 1.0 m | diff, nor_gl, arm |

## What was changed

Downloaded 2026-11-27 at 1K and re-encoded as JPEG (quality 74 albedo, 70 normal, 66 arm) by
`tools/textures/prep_mirrowen.py`.

- `*_diff.jpg`: graded so the material colour sets the tone: saturation 0 for `plate` and `roof` (the paint is the
  material colour), 0.1–0.22 for snow, setts, granite, concrete and deck, 0.55–0.8 for boards, rust and brick; mean
  value set per pack; value clamped to 0.04–0.94 so no albedo is pure black or white.
- `*_nor.jpg`: the OpenGL-convention normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed map as published (R ambient occlusion, G roughness, B metalness, the channels
  three.js reads `aoMap`, `roughnessMap` and `metalnessMap` from); metalness zeroed for the stone, snow, board and
  brick packs.
