# Bellows realism pass: retired code (2026-11-27)

Kept for reference; nothing imports these. They are the files as they stood before the pass (`git show HEAD:<path>`),
saved as `.txt` so no tool or bundler picks them up. The live code is in `src/three/bellows.js` and
`src/three/bellows/`. Plan and reasons: `docs/plans/realism-bellows.md`.

What each held that the pass replaced:

- `bellows__decks.js.txt` — every built box with knife edges; every merged piece shaded flat (the sphere, the holder's
  drum and the bladders drawn as facets); the sphere box-projected, which tore its plate pattern at every 45°; the
  bladders as smooth ellipsoids; doorways cut into plate with no frame; the gondola's sheet ends uncapped; the deck
  plate with no darkening at the foot of what stands on it; the skirt plated in the bolted `steel`; the tower hall's
  floor the plinth's bare concrete.
- `bellows__plant.js.txt` — the Compressor's block and housing as plain tapered cylinders, their plate texture
  stretched once round 44 m; the cumulus heads as plain low-poly spheres.
- `bellows__vista.js.txt` — the cloud column as faceted spheres.
- `bellows__atmosphere.js.txt` — the hemisphere at 1.5 with a saturated blue sky colour (#5d8bd0) and the sun at 2.3,
  which lit every face alike and blued the works.
- `bellows__stations.js.txt` — the bench taking the world's steel for its plate.
- `bellows.js.txt` — procedural maps only; no world variation; no photo packs.

The procedural generators themselves (`platedMetal`, `treadPlate`, `slabConcrete`, `ribbedSheet`) are not retired:
they are still built first, and they are the look below T4 and whenever a photo pack fails to load.
