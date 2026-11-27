# Ember Reach textures: sources and licence

Every file here is derived from a Poly Haven texture. Poly Haven publishes all of its assets under
**CC0 1.0 Universal** (public domain dedication; https://polyhaven.com/license, checked 2026-11-27). No attribution
is required; the authors are listed anyway.

| File prefix | Poly Haven asset | Author(s) | Real size of one tile | Maps taken (1K JPG) |
|---|---|---|---|---|
| `cinder_` | [rocky_gravel](https://polyhaven.com/a/rocky_gravel) | Dimitrios Savva (photography), Dario Barresi (processing) | 1.81 m | diff, nor_gl, arm |
| `basalt_` | [rock_face_04](https://polyhaven.com/a/rock_face_04) | Dimitrios Savva | 2.0 m | diff, nor_gl, arm |
| `concrete_` | [concrete_layers_02](https://polyhaven.com/a/concrete_layers_02) | Rob Tuytel | 2.0 m | diff, nor_gl, arm |
| `brick_` | [factory_brick](https://polyhaven.com/a/factory_brick) | Rob Tuytel | 1.5 m | diff, nor_gl, arm |
| `sheet_` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | Sergej Majboroda (photography), Jenelle van Heerden (processing) | 2.7 m | diff, nor_gl, arm |

## What was changed

Downloaded 2026-11-27 at 1K and re-encoded as JPEG (quality 72–80) by `tools/textures/prep_ember.py`.

- `*_diff.jpg`: graded for Ember Reach. Saturation × 0.55 (cinder), × 0.3 (basalt, sheet), × 0.5 (concrete, warmed
  slightly), × 0.7 (brick); mean value set per pack; value clamped to 0.03–0.88 (basalt 0.62) so no albedo is pure
  black or white. The cinder and basalt albedos are multiplied by the terrain's own vertex paint in the ground shader.
- `*_nor.jpg`: the OpenGL-convention (`nor_gl`) normal map, unchanged apart from re-encoding.
- `*_arm.jpg`: Poly Haven's packed map, R = ambient occlusion, G = roughness, B = metalness (three.js reads `aoMap`
  from R, `roughnessMap` from G, `metalnessMap` from B). Metalness zeroed for every pack except `sheet`.
