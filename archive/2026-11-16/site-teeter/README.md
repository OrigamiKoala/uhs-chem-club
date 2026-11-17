# Teeter's first site (archived 2026-11-16)

The walkable site Teeter (`unit08`) was built with on 2026-11-04: a flat field of salt pans with a causeway running north
from the pad, eight dikes running out from it, and a host on the head of each dike, the odd benches at x = -42 and the
even at x = 42 (two columns, the same coordinates as Verdigris), a boss plaza at the causeway's north end.

It was replaced by the hillside of salt terraces (`docs/plans/teeter-world.md` section 9,
`docs/plans/world-distinction-plan.md`): five terraces, one stair down the fall line, eight rooms dug into the terrace
walls under the pans.

| Archived file | Replaced by |
| :--- | :--- |
| `teeter.js` | `src/three/teeter.js` (rewritten on the terrace plan) |
| `teeter/terrain.js` | `src/three/teeter/terrain.js` (ground mesh, masonry, brine) and `teeter/terrace-plan.js` (the height field and the walk) |
| `teeter/stations.js` | `src/three/teeter/stations.js` (hosts that furnish rooms) |
| `teeter/plant.js` | `src/three/teeter/plant.js` (the beam pump is kept there, generalised) |
| `teeter/host-plan.js` | `src/three/teeter/host-plan.js` (each host names its room) |
| `tools/gen-teeter-layout.mjs` | `tools/gen-teeter-layout.mjs` (reads the terrace plan) |
| `tools/verify-teeter.mjs` | `tools/verify-teeter.mjs` (the planner and quest checks kept; the template's checks replaced by the shape checks) |
| `world-data/teeter.json` | `src/three/world-data/teeter.json` (regenerated; site ids, quest ids and labels unchanged) |

Nothing here is imported, built or verified. The relative imports inside these files point at their old places.
