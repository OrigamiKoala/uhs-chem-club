# Ligar in three dimensions — the realism rebuild

**Status:** in flight. Started 2026-09-27.

**Status (2026-09-27): built.** Every item below is in, `npm run verify` passes,
and every Ligar shader (17 distinct programs in the built world) compiles under
glslang against three's own shader assembly (a scratch harness; not yet looked
at in a browser — the user playtests). Cost at T4: ~0.78M triangles, 516
meshes, 6 lights (sun, hemi, a pool of three, the forge), ~2.1 s to build in Node.

The brief (user): make Ligar feel like a real world out of a science-fiction
film rather than a toy generation — detail and shape — and rebuild whatever
needs rebuilding, rewiring every function back in.

## What made it read as a toy

1. **Every rock was one unit hexagonal cylinder**, instanced and scaled. Real
   columnar basalt is an irregular tessellation (four to seven sides, mostly
   five and six), packed tight with thin joints, broken into drums by
   cross-fractures, its tops chamfered by weather or snapped at a slant. A
   field of identical regular hexagons is the single loudest "procedural"
   tell in the world.
2. **The arches were a tube with prisms stuck on it**, a constant section on a
   semicircle. A natural arch is thick-footed and thin-crowned, lumpy, and in
   basalt its jointing fans: the columns stand perpendicular to the surface
   they cooled from, so the underside shows a honeycomb of column ends and the
   flank shows a fan of column lengths.
3. **The sky was a three-colour gradient with cardboard ridges** (flat
   `ShapeGeometry` silhouettes 260–310 m out), plain `THREE.Fog`, no
   environment map, so metal reflected nothing and distance read as grey.
4. **The ground was a 240 m plate** with a repeated Worley tile, ending in fog.
5. The frame-budget rules the other worlds follow were never applied: ~10
   `PointLight`s (one per luminaire), nothing baked, the shadow map re-drawn
   every frame.

## The rebuild (modules under `src/three/ligar/`)

- [x] `basalt.js` — the column kit. Voronoi tessellation from a relaxed
      jittered hex lattice (`columnCells`), and `prism()` extruding cells into
      merged, flat-shaded geometry with drums, chamfers, broken tops, vertex
      tone and per-column `partBoxes`: `columnRaft`, `columnWall`, `sawnSlab`,
      `radialRing`, `lintelBeam`, `basaltArch` (radial fan), `rubbleField`,
      `fallenColumn`.
- [x] `atmosphere.js` — one sky function (`lgSky` / `lgAir`): dusk, a low
      dust-reddened sun with a broad flare and no disc, the Belt of Venus and
      the earth's shadow on the anti-solar side, a broken altocumulus deck lit
      orange from below, crepuscular rays; far trap escarpments and a smoking
      shield volcano drawn IN the sky. Every material's fog replaced by aerial
      perspective toward it (`applyLigarAir`); PMREM environment; shadow box
      that follows the player in whole texels.
- [x] `terrain.js` — one analytic height field and one grid to an 880 m
      horizon (the walk unchanged inside 100 m), trap terraces rising in steps
      beyond it, the cut's outline written into the grid. The ground shader
      draws the column-top joints procedurally (non-repeating), dust in the
      joints, rain pools in the hollows reflecting the sunset, scoria yard,
      haul-road ruts, and columnar cliffs on every steep face.
- [x] `surfaces.js` — weathering applied once to everything built: ash on
      what faces up, damp dark feet, lichen on stone, iron weep under joints.
- [x] `vista.js` + `industry.js` — beyond the walk (`phys: 'ambient'`): six
      column spires 22–40 m tall, an 80 m natural arch on the western benches,
      the smelter (blast furnace, stoves, casthouse, four stacks, three
      smoking), a nine-pylon power line to the horizon, a derelict dragline.
- [x] `plant.js` — the props moved out of ligar.js and rebuilt from real
      structural parts (conveyors, carts, drums, hut, hauler, sheds, stacks,
      water tower, masts, pad, stakes).
- [x] Ground cover: cobbles and wind-stirred scrub in the ash and hollows.
- [x] `effects.js` — ash motes, grit streams, stack smoke, forge sparks.
- [x] `ligar.js` rewired: lamp pool, `bakeStatics`, shadow pacing, the old
      unit-hexagon builders deleted; sites, benches, colliders, anchors and
      the public contract unchanged.

## Invariants

- The public `LigarWorld` contract (`scene`, `data`, `colliders`,
  `terrainMesh`, `getTerrainHeight`, `benchAnchor`, `setBenchDeployed`,
  `setSiteComplete`, `update`, `dispose`) and every site position.
- `verify:ligar`, `verify:bench`, `verify:voyage` green: nothing overlaps,
  nothing buried, every bench reachable, no ledge in the walk.
- No player-facing string changes.
