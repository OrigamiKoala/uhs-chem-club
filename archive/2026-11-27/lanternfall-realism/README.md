# Lanternfall realism pass: retired code (2026-11-27)

Kept for reference; nothing imports these. They are the files as they stood before the pass (`git show HEAD:<path>`),
saved as `.txt` so no tool or bundler picks them up. The live code is in `src/three/lanternfall.js`,
`src/three/lanternfall/` and `src/three/materials/lanternfall-textures.js`. Plan and reasons:
`docs/plans/realism-lanternfall.md`.

What each held that the pass replaced:

- `lanternfall-textures.js.txt` — `carvedIce` before the pass: sine bands over flutes, dark blue to pale, which read as
  blue-and-white cloth once a sheet's 0..1 uvs stretched one tile across a 50 m cliff. Replaced by a pale, low-contrast
  melt-scallop ice laid in world metres; the bands are painted per vertex as before.
- `ground.js.txt` — the snout as a smooth sheet; the shore's and the lake's rafted slabs and the icefall's seracs as
  plain boxes.
- `stations.js.txt` — the flume cave's and the ice-hole cave's slabs and courses as plain boxes; the bench taking the
  world's steel for its plate.
- `kit.js.txt` — `Buckets` without `chunk`.
- `props.js.txt` — lantern posts and masts standing on the snow with no drift at their feet; 6-sided poles.
- `atmosphere.js.txt` — the hemisphere with its ground colour (#9dc2d6) brighter than its sky (#4a6fb0).
- `lanternfall.js.txt` — materials with no maps (timber, stone, granite, rock walls and floors, till, snow), no world
  uvs, no contact shade, no photo packs, environment intensity 0.75.
