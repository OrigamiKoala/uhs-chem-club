# Brinewire before the realism pass (2026-11-27)

The source files the realism pass changed, as they stood before it, kept for reference. Nothing imports them; the
live code is in `src/three/brinewire.js` and `src/three/brinewire/`. See `docs/plans/realism-brinewire.md`.

| File here | Live file | What the pass replaced |
|---|---|---|
| `brinewire.js` | `src/three/brinewire.js` | Materials tiled per uv unit (2.4–3 m concrete tiles, plated steel at repeat 2 on 0..1 boxes), stock kit shapes, no photo packs, no world variation, environment 0.75 |
| `brinewire/terrain.js` | `src/three/brinewire/terrain.js` | Knife-edged stock boxes for the whole barrage; one slab per coping; the great faces as single boxes; the water's line as two ruled boxes; paving with no contact shade |
| `brinewire/atmosphere.js` | `src/three/brinewire/atmosphere.js` | Sun 1.9, hemisphere 1.25 with a bounce nearly as bright as the sky |
| `brinewire/stations.js` | `src/three/brinewire/stations.js` | The bench sharing the hosts' dark steel |
| `materials/brinewire-textures.js` | `src/three/materials/brinewire-textures.js` | (Kept live and only added to: `pourConcrete` takes `panels`, `joint`, `tie`; its defaults are the old look) |

The procedural texture generators were not retired: they are still the lower-tier surfaces and the fallback until the
photographs land.
