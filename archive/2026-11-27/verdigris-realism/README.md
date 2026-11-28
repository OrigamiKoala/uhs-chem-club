# Verdigris before the realism pass (2026-11-27)

The source files the realism pass changed, as they stood before it, kept for reference. Nothing imports them; the
live code is in `src/three/verdigris.js` and `src/three/verdigris/`. See `docs/plans/realism-verdigris.md`.

| File here | Live file | What the pass replaced |
|---|---|---|
| `verdigris.js` | `src/three/verdigris.js` | Materials tiled per 2.4 m or 4 m uv unit, stock kit shapes, no photo packs, no waterline grime, flatter light, fog from 4 m |
| `terrain.js` | `src/three/verdigris/terrain.js` | Knife-edged masonry boxes; one long coping slab per wall; cube merlons; box batters; straight breach steps; box posts and square rails; stock cylinder piles; smooth far rises |
| `atmosphere.js` | `src/three/verdigris/atmosphere.js` | Sun 1.9, hemisphere 1.25 with a grey bounce nearly as bright as the sky |
| `plant.js` | `src/three/verdigris/plant.js` | Reeds of one flat colour |
| `verdigris-textures.js` | `src/three/materials/verdigris-textures.js` | `marshWater` as blobby value noise (its normals read off the 8-bit height) |
| `stations.js` | `src/three/verdigris/stations.js` | (Unchanged by the pass; kept for reference with the rest.) |

The procedural texture generators (`peatMud`, `boardwalk`, `fortStone`) were not retired: they are still the lower-tier
surfaces and the fallback until the photographs land.
