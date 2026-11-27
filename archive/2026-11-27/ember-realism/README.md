# Ember Reach before the realism pass (2026-11-27)

The four source files the realism pass changed, as they stood at commit `6748d9f`, kept for reference. Nothing
imports them; the live code is in `src/three/ember.js` and `src/three/ember/`. See `docs/plans/realism-ember.md`.

| File here | Live file | What the pass replaced |
|---|---|---|
| `ember.js` | `src/three/ember.js` | Shells drew with the shared props' materials on 0..1 box uvs; no photo packs, no ground contact; environment 0.8 |
| `ember__terrain.js` | `src/three/ember/terrain.js` | Square-bar rails and posts; knife-edged concrete; flat rock-wall boxes; roofs with an eave out of the cliff; every gallery cut out of the ground; far grid growth 1.24; seven-sided far spires |
| `ember__caldera-plan.js` | `src/three/ember/caldera-plan.js` | The cone's height (atan2 gullies with a seam, no flows); no banking round the galleries |
| `ember__atmosphere.js` | `src/three/ember/atmosphere.js` | Sun 2.15, hemisphere 1.1 with a bounce nearly as bright as the sky, pale environment floor |

The procedural texture generators (`src/three/materials/ember-textures.js`) were not retired: they are still the
lower-tier surfaces and the fallback until the photographs land.
