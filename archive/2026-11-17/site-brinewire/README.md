# Brinewire's first site (archived 2026-11-17)

The walkable site Brinewire (`unit10`) was built with on 2026-11-05: a flat salt flat of fenced brine pools with a plank
spine running south from the pad, six boardwalk spurs, and a host on the head of each spur, the odd benches at x = -42 and
the even at x = 42 (two columns, the template shared with Verdigris and Quicklight), the Clamp's court at the spine's south
end on the shore of the largest pool.

It was replaced by the tidal barrage (`docs/plans/brinewire-world.md` section 9, `docs/plans/world-distinction-plan.md`):
a crest road, two gate houses off it over the lagoon, a ramp down the wall's east face, a gallery of three cell chambers
inside the wall, and the switchyard's cage at its foot.

| Archived file | Replaced by |
| :--- | :--- |
| `brinewire.js` | `src/three/brinewire.js` (rewritten on the barrage plan) |
| `brinewire/terrain.js` | `src/three/brinewire/terrain.js` (ground mesh, concrete, water) and `brinewire/barrage-plan.js` (the height field and the walk) |
| `brinewire/stations.js` | `src/three/brinewire/stations.js` (hosts that furnish rooms) |
| `brinewire/plant.js` | `src/three/brinewire/plant.js` (lamps, pad, deck plant, switchyard, outfalls, far country) |
| `brinewire/host-plan.js` | `src/three/brinewire/host-plan.js` (each host names its room) |
| `tools/gen-brinewire-layout.mjs` | `tools/gen-brinewire-layout.mjs` (reads the barrage plan) |
| `tools/verify-brinewire.mjs` | `tools/verify-brinewire.mjs` (the planner checks and every safety check kept; the template's checks replaced by the shape checks) |
| `world-data/brinewire.json` | `src/three/world-data/brinewire.json` (regenerated; site ids, quest ids and labels unchanged) |

Nothing here is built, imported or verified.
