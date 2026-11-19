# Archived Tallow site files (2026-11-19)

These are the files as they stood before Tallow's site rebuild (branch `site/tallow`;
`docs/plans/tallow-ligar-world.md` section 5). They describe Tallow's hosts as machines standing in the open on the
pan (one of six benches housed: the pit).

- `stations.js`: the six hosts with outdoor aprons, lamp masts and the control house's veranda. Replaced in place by
  `src/three/tallow/stations.js`, whose hosts stand inside the buildings of `src/three/tallow/halls.js` (laid out in
  `src/three/tallow/hall-plan.js`).
- `gen-tallow-layout.mjs`: the layout generator before the buildings were keep-outs, with eight loose crate stacks.
  Replaced in place by `tools/gen-tallow-layout.mjs`.
- `verify-tallow.mjs`: the world's checks before the shape checks (`tools/lib/world-shape-checks.mjs`), the building
  checks and the cover mask were added. Replaced in place by `tools/verify-tallow.mjs`, which keeps every check this
  one made.

Nothing here is imported, built or verified.
