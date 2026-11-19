# Archived Mirrowen site files (2026-11-18)

These files belonged to the flat ring version of Mirrowen (seven open-air hosts on a 44 m ring round a round
basin at `y = 0.00 m`, `0/7` housed, `0.30 m` relief).

They were replaced on branch `site/mirrowen` (`docs/plans/mirrowen-world.md`, section "Site rebuild
(2026-11-18)") by the harbour rebuild:

- `src/three/mirrowen/harbour-plan.js` — new pure plan: levels, volumes, rooms, hulls, height field, cover, rails (no THREE)
- `src/three/mirrowen/terrain.js` — replaces `terrain.js` here: ground with holes, water, quay walls, dock, hulls, decks, sheds, vista
- `src/three/mirrowen/host-plan.js` — replaces `host-plan.js` here: derived from the plan's rooms
- `src/three/mirrowen/stations.js` — replaces `stations.js` here: seven hosts in their rooms (the bench builder is carried over)
- `src/three/mirrowen.js` — replaces `mirrowen.js` here: `MirrowenWorld` on the plan, `lib/workings.js`, `lib/cover.js`, `routeTo`
- `tools/gen-mirrowen-layout.mjs` — replaces the generator here
- `tools/verify-mirrowen.mjs` — replaces the verifier here; its ring, 100 m disc and quay-ring checks are replaced by
  `tools/lib/world-shape-checks.mjs` and the harbour's own checks
- `mirrowen.json` — the generated layout as it was

Nothing here is imported, built or verified.
