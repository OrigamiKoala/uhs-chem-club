# Mirrowen realism pass: retired code (2026-11-27)

Kept for reference; nothing imports these. They are the files as they stood before the pass (`git show HEAD:<path>`),
saved as `.txt` so no tool or bundler picks them up. The live code is in `src/three/mirrowen.js` and
`src/three/mirrowen/`. Plan and reasons: `docs/plans/realism-mirrowen.md`.

What each held that the pass replaced:

- `terrain.js.txt` — quay, dock and yard walls as plain boxes to their tops with no coping; kerbs as one box per 2 m;
  railings of square bars on square posts; the boathouse's hipped roof as three stacked slabs and the thaw shed's
  gable as four stepped slabs; no rubbing strakes, portholes, windows or deck rails on the ships; the pump house a
  bare brick box; the ground one surface (one material); no contact shade; the far iceberg, the breakwater and the
  canal's ice walls as boxes, the far ships as boxes, the town's roofs as flat slabs.
- `plant.js.txt` — the bollard as three stacked cylinders; the lamp post's foot a sharp box.
- `kit.js.txt` — no `boxUv` or `blockGeometry`.
- `atmosphere.js.txt` — the sun #edf3f7 at 2.0; the hemisphere #bdd0dc over #7f8c90 at 1.25.
- `stations.js.txt` — the bench taking the world's steel (`M.steel`) for its plate.
- `mirrowen.js.txt` — `timber`, `timberDark`, `boards` and `brick` with no maps; one ground material; no world uvs;
  no photo packs; environment intensity 0.85.

`src/three/materials/mirrowen-textures.js` is unchanged: its generators are still the lower-tier look and the
fallback under the photo packs.
