# Archived Ember Reach site files (2026-11-18)

These files belonged to the flat ring-shelf version of Ember Reach (seven open-air hosts on a 54 m ring at `y = 0.00 m`, `0/7` housed, `0.44 m` relief).

They were replaced on branch `site/ember` (`docs/plans/ember-reach-world.md`, section "Site rebuild (2026-11-18)") by the caldera-wall switchback rebuild:

- `src/three/ember/caldera-plan.js` — new pure data/height/workings/cover declaration (no THREE)
- `src/three/ember/terrain.js` — stepped caldera wall, switchback terraces, rock-cut gallery shells, turbine hall shell, lava lake, volcanic cone
- `src/three/ember/host-plan.js` — host metadata derived from `caldera-plan.js` rooms
- `src/three/ember/stations.js` — seven distinct gallery/hall hosts with pooled lamps and bay clearance
- `src/three/ember.js` — rebuilt `EmberReachWorld` wired to `caldera-plan.js`, `lib/workings.js`, `lib/cover.js`, `routeTo`
- `tools/gen-ember-layout.mjs` — deterministic generator for the new `src/three/world-data/ember.json`
- `tools/verify-ember.mjs` — rewritten verifier using `tools/lib/world-shape-checks.mjs`
