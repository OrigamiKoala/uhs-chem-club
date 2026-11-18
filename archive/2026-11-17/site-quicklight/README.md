# Quicklight's first site (archived 2026-11-17)

The walkable site Quicklight (`unit11`) was built with on 2026-11-12: a flat plate of dark basalt with a spine road running
north and south, six rigs standing in the open beside it, the odd benches at x = -42 and the even at x = 42 (two columns, the
template shared with Brinewire, Verdigris and Teeter), cracking towers, storage tanks and storm pylons filling the gaps, and an
open storm plaza at the road's end where the Flare was fought. Every bench stood at 0.00 m; none was housed (`world-shape.mjs`:
`-1 -1 -0 -1 -1 -1`).

It was replaced by the refinery (`docs/plans/quicklight-world.md` section 7, `docs/plans/world-distinction-plan.md`): a grid of
alleys under pipe racks on two lava flows, a ramp up through the upper flow's front, and the benches in the analyser bunker, the
control room, the pump cellar in the tank bund, inside the cracking reactor's skirt, under the reactor train's table and in the
catalyst bunker.

| Archived file | Replaced by |
| :--- | :--- |
| `src/three/quicklight.js` | `src/three/quicklight.js` (rewritten on the refinery plan) |
| `src/three/quicklight/terrain.js` | `src/three/quicklight/terrain.js` (ground, paving, walls, room shells) and `quicklight/refinery-plan.js` (the height field and the walk) |
| `src/three/quicklight/stations.js` | `src/three/quicklight/stations.js` (hosts that furnish rooms; the lettered tags are gone) |
| `src/three/quicklight/plant.js` | `src/three/quicklight/plant.js` (racks, units, bund, heater, flare stack, rod pylons, far country) |
| `src/three/quicklight/host-plan.js` | `src/three/quicklight/host-plan.js` (each host names its room) |
| `tools/gen-quicklight-layout.mjs` | `tools/gen-quicklight-layout.mjs` (reads the refinery plan) |
| `tools/verify-quicklight.mjs` | `tools/verify-quicklight.mjs` (the planner checks and every safety check kept; the template's checks replaced by the shape checks) |
| `src/three/world-data/quicklight.json` | `src/three/world-data/quicklight.json` (regenerated; site ids, quest ids and labels unchanged) |

`src/three/quicklight/atmosphere.js` was kept and extended (the lightning). Nothing here is built, imported or verified.
