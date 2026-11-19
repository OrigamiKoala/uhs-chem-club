# Archived Bellows site files (2026-11-18)

These files belonged to the one-plate version of Bellows: a circular steel deck of radius 82 m at
`y = 0.00 m`, six open-air hosts on a 46 m ring round the Compressor, a ring of lamp posts, gasholders, scoop
pylons, crate stacks and moored bladders standing in the gaps (`0/6` housed, `0.00 m` relief).

They were replaced on branch `site/bellows` (`docs/plans/bellows-world.md`, section "Site rebuild
(2026-11-18)") by the gas works hung over the cloud:

- `src/three/bellows/works-plan.js` (new): the pure plan (volumes, rooms, structures, the height field, the cover spec)
- `src/three/bellows/decks.js` (new): decks, catwalks, ramps, rails and their lamps, lattice legs, the six rooms, the
  plinth, the sphere, the piston holder, the cold box, the gondola and the two bladders. Replaces `terrain.js`.
- `src/three/bellows/plant.js` (new): the Compressor, the landing pad and the cumulus heads, lifted unchanged from
  `props.js`. The rest of `props.js` (gasholders on legs, scoop pylons, pipe racks, vent stacks, crate stacks,
  moored bladders, lamp posts, comms mast) is not used.
- `src/three/bellows/vista.js` (new): the far country.
- `src/three/bellows/host-plan.js`, `src/three/bellows/stations.js`: rebuilt; the six hosts are rooms. The bench
  (`buildBwBench`) is kept as it was.
- `src/three/bellows.js`, `tools/gen-bellows-layout.mjs`, `src/three/world-data/bellows.json`,
  `tools/verify-bellows.mjs`: rebuilt. The copies here are the versions before the rebuild.

Nothing here is imported, built or verified.
