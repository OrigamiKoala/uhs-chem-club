# Verdigris's first site (archived 2026-11-16)

The walkable site Verdigris (`unit09`) was built with on 2026-11-05: shallow pools held in rectangles by old fortress walls,
a plank spine running south from the pad through them, eight boardwalk spurs out from it with a host on the head of each,
the odd benches at x = -42 and the even at x = 42 (two columns, the coordinates Teeter's first site also used), and the
Leach's court at the spine's south end by the largest pool. Every bench stood at 0.00 m in the open.

It was replaced by the drowned fort in the reed swamp (`docs/plans/verdigris-world.md` section 8,
`docs/plans/world-distinction-plan.md`): a branching boardwalk through a flooded fort, the benches in towers, cisterns and
the gatehouse.

| Archived file | Replaced by |
| :--- | :--- |
| `verdigris.js` | `src/three/verdigris.js` (rewritten on the fort plan) |
| `verdigris/terrain.js` | `src/three/verdigris/terrain.js` (ground mesh, masonry, decks, water) and `verdigris/fort-plan.js` (the height field and the walk) |
| `verdigris/stations.js` | `src/three/verdigris/stations.js` (hosts that furnish rooms; the bench builder `buildVdBench` is kept there) |
| `verdigris/plant.js` | `src/three/verdigris/plant.js` (reeds, lamps, the pad, the far country) |
| `verdigris/host-plan.js` | `src/three/verdigris/host-plan.js` (each host names its room) |
| `tools/gen-verdigris-layout.mjs` | `tools/gen-verdigris-layout.mjs` (reads the fort plan) |
| `tools/verify-verdigris.mjs` | `tools/verify-verdigris.mjs` (the planner checks kept; the template's checks replaced by the shape checks) |
| `world-data/verdigris.json` | `src/three/world-data/verdigris.json` (regenerated; site ids, quest ids, labels and `built` flags unchanged) |

Nothing here is imported, built or verified. The relative imports inside these files point at their old places.
