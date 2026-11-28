# Teeter before the realism pass (2026-11-27)

The source files the realism pass changed, as they stood before it, kept for reference. Nothing imports them; the
live code is in `src/three/teeter.js` and `src/three/teeter/`. See `docs/plans/realism-teeter.md`.

| File here | Live file | What the pass replaced |
|---|---|---|
| `teeter.js` | `src/three/teeter.js` | Materials tiled per uv unit of 0..1 boxes or `x / 7`, stock kit shapes, no photo packs, no wall grime, flatter light |
| `teeter/terrain.js` | `src/three/teeter/terrain.js` | Knife-edged masonry boxes with a crazy-paving tile; one long slab of coping; plain kerbs and banks; the stair in the ground mesh; smooth far hills |
| `teeter/plant.js` | `src/three/teeter/plant.js` | Beam pumps built of stock boxes and cylinders |
| `teeter/atmosphere.js` | `src/three/teeter/atmosphere.js` | Sun 2.3, hemisphere 1.2 with a bounce nearly as bright as the sky |
| `teeter/stations.js` | `src/three/teeter/stations.js` | The bench sharing the hosts' steel and timber |
| `materials/teeter-textures.js` | `src/three/materials/teeter-textures.js` | (Kept live and only added to: `weatheredBoards`) |

The procedural texture generators were not retired: they are still the lower-tier surfaces and the fallback until the
photographs land.
