# Kettle before the realism pass (2026-11-27)

The source files the realism pass changed, as they stood at commit `9944b42`, kept for reference. Nothing imports
them; the live code is in `src/three/kettle.js` and `src/three/kettle/`. See `docs/plans/realism-kettle.md`.

| File here | Live file | What the pass replaced |
|---|---|---|
| `kettle.js` | `src/three/kettle.js` | Materials tiled at 2–4 m per uv unit, no photo packs, no contact shadow, walls baked without their grime |
| `kettle__kit.js` | `src/three/kettle/kit.js` | Knife-edged stock boxes and cylinders with 0..1 uvs per face (still what other worlds get: the built shapes are opt-in) |
| `kettle__works.js` | `src/three/kettle/works.js` | Wall slabs with no grime; no plinth, sill, gutter, downpipe or corner trim; square-bar railings; bare column base plates |
| `kettle__terrain.js` | `src/three/kettle/terrain.js` | Smooth domed mesas; the crust's crack net drawn over the heaps |
| `kettle__atmosphere.js` | `src/three/kettle/atmosphere.js` | Sun 2.2, hemisphere 1.15 with a bounce nearly as bright as the sky |
| `kettle__plant.js` | `src/three/kettle/plant.js` | The buffer stops: a timber board on two raked bars |

The procedural texture generators (`src/three/materials/kettle-textures.js`) were not retired: they are still the
lower-tier surfaces and the fallback until the photographs land (Bellows also uses two of them).
