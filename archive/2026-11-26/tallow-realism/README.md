# Tallow realism pass: retired code (2026-11-26)

Kept for reference; nothing imports these. The live code is in `src/three/tallow.js`, `src/three/tallow/surfaces.js`
and `src/three/tallow/atmosphere.js`. Plan and reasons: `docs/plans/realism-tallow.md`.

- `pan-rim-bund.js.txt` — the evaporation ponds' bund before the pass: a four-point trapezoid swept round the plan
  with one random height per segment, in a plain untextured material. Replaced by a seven-point, noise-shaped bank
  in the granular salt material (it read as a smooth white torus).
- `salt-crust.js.txt` — the crust generator before the pass: undistorted Worley polygons of one size, a fine grain
  octave the 512 px map could not resolve (it read as fuzz), and the normal taken from the raw height.
- `lights.js.txt` — the sun and hemisphere before the pass (hemisphere 1.15 with the ground term brighter than the
  sky, which flattened every face).
