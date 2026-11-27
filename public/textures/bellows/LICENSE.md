# Bellows textures: sources and licence

Every file here is derived from a CC0 texture. Poly Haven publishes all of its assets under **CC0 1.0 Universal**
(https://polyhaven.com/license, checked 2026-11-27). No attribution is required; the authors are listed anyway.

| File prefix | Source asset | Author | Real size of one tile | Used on | Size (3 files) |
|---|---|---|---|---|---|
| `tread_` | [Poly Haven metal_plate](https://polyhaven.com/a/metal_plate) | Rob Tuytel | 0.5 m | the deck plate, the tower hall floor | 0.49 MB |
| `plate_` | [Poly Haven blue_metal_plate](https://polyhaven.com/a/blue_metal_plate) | Rob Tuytel | 2.5 m | `cladding` (sphere, skirt, gondola) | 0.10 MB |
| `rivet_` | [Poly Haven metal_plate_02](https://polyhaven.com/a/metal_plate_02) | Rob Tuytel | 2.0 m | `steel` (holder shell, Compressor) | 0.43 MB |
| `ribbed_` | [Poly Haven factory_wall](https://polyhaven.com/a/factory_wall) | Rob Tuytel | 3.0 m | `ribbed` (the cold box casing) | 0.24 MB |
| `concrete_` | [Poly Haven concrete_slab_wall](https://polyhaven.com/a/concrete_slab_wall) | Dimitrios Savva | 2.3 m | `concrete` (the plinth, the tower hall) | 0.25 MB |
| `paint_` | [Poly Haven green_metal_rust](https://polyhaven.com/a/green_metal_rust) | Rob Tuytel | 1.0 m | `darkSteel`, `grating` (legs, rails, frames) | 0.17 MB |

Total 1.6 MB, fetched at 3D On (T4) only.

## What was changed

Downloaded 2026-11-27 at 1K (diff, nor_gl, arm JPG) and re-encoded as JPEG (quality 74–80) by
`tools/textures/prep_bellows.py`.

- `*_diff.jpg`: desaturated (× 0.06 to × 0.3) and moved onto the paint the procedural map carried (blue and green
  sources taken to the works' grey-white and dark blue-grey paint); value clamped to 0.035–0.95.
- `*_nor.jpg`: the OpenGL-convention normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed arm (R = ambient occlusion, G = roughness, B = metalness, the channels three.js
  reads `aoMap`, `roughnessMap` and `metalnessMap` from). Metalness zeroed for concrete, `plate_` and `ribbed_`
  (paint is not metal); roughness raised on `plate_` and `ribbed_` (chalked, matte paint) and floored at 0.25 on
  `tread_`.
