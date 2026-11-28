# Quicklight before the realism pass (2026-11-27)

The source files the realism pass changed, as they stood before it, kept for reference. Nothing imports them; the
live code is in `src/three/quicklight.js`, `src/three/quicklight/` and `src/three/kettle/kit.js`. See
`docs/plans/realism-quicklight.md`.

| File here | Live file | What the pass replaced |
|---|---|---|
| `quicklight.js` | `src/three/quicklight.js` | Materials tiled per uv unit (stock 0..1 boxes, 2.4 m refinery tiles, 7 m ground), the shuttered-panel concrete on every floor, no photo packs, no grime, the layout's fog |
| `quicklight/terrain.js` | `src/three/quicklight/terrain.js` | Knife-edged concrete boxes with per-box uvs; square handrails, posts and insulated lines; vertex-colour joints a metre wide; one ground mesh; smooth far land |
| `quicklight/plant.js` | `src/three/quicklight/plant.js` | Stock kit shapes on every unit; rack pipes ending in bare discs; the shield volcano as a cone; stock-uv spheres and cones |
| `quicklight/atmosphere.js` | `src/three/quicklight/atmosphere.js` | Sun 1.9, hemisphere 1.3 with a brown bounce |
| `quicklight/stations.js` | `src/three/quicklight/stations.js` | The bench sharing the works' dark steel and grating |
| `kettle/kit.js` | `src/three/kettle/kit.js` | (Kept live and only added to: the opt-in `'metric'` and `'edges'` values of `builtKit`) |
| `materials/quicklight-textures.js` | `src/three/materials/quicklight-textures.js` | (Kept live and only added to: `hardstanding`) |

The procedural texture generators were not retired: they are still the surfaces below 3D On and the fallback until
the photographs land.
