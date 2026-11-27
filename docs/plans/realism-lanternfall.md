# Realism pass: Lanternfall

Started 2026-11-27. Brief: the owner's realism-pass prompt (same brief as `realism-tallow.md`). Art only: no site,
layout, collider, bay, walk or bench behaviour changes.

## The real place

Lanternfall is the snout of a temperate-to-polar valley glacier that ends in an ice cliff on a frozen proglacial lake,
in the long polar night under an aurora. The country is glaciated metamorphic rock (dark banded gneiss in the
nunatak, grey granite erratics) with lateral moraines of grey till and cobbles. The expedition's works are some
seasons old: rooms dug into firn and moraine and lined with grey weathered boards on timber sets, a tracked drilling
crawler clad in painted profiled sheet, steel masts and lantern posts, a canvas tent in a crevasse.

References (descriptions, not images in the repo):

1. A glacier terminus in section (Perito Moreno, Svínafellsjökull): white firn over dense blue ice, horizontal
   bubble-rich bands, dark dirt bands where old surfaces were buried, the face scalloped by melt, never a smooth sheet.
2. Antarctic wind-packed snow in the dark season: pale grey-white under a blue sky, low sastrugi, firm and matte,
   trodden lanes greyer and glossier; snow drifts banked on the windward foot of anything standing.
3. Lateral moraine cut by a track (Svalbard, Ny-Ålesund): unsorted grey till, angular cobbles of every size in
   silt, frost on the fines.
4. Antarctic field-station buildings (Halley, Dumont d'Urville huts): painted corrugated or profiled sheet with rows
   of fixings, the paint dulled by UV and wind-blown ice, steel frames dark grey, rust only at fixings and edges.
5. Lake ice in winter: dark clear ice with white pressure cracks and broken rafted slabs along the shore, their
   edges rounded by sublimation, not cut square.
6. Polar-night light: the sky brighter on the aurora's side, darker overhead; the snow's bounce takes the sky's
   colour and is never brighter than the sky itself; soft contact darkening where anything stands in the snow.

## What looks fake (before shots: `docs/images/realism-lanternfall/before-*.jpg`)

Viewpoints (camera → look-at), reused for the after shots. Eye heights are ground + 1.7 m where noted.

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn (yard) | (10, 3.6, 40) | (10, 2, 0) |
| 2 | flume cave (host 1) from the east path | (41.8, ground + 1.7, 11) | (19.2, 2, 11) |
| 3 | drilling crawler (host 4) from its path | (0, ground + 1.7, -70.2) | (0, 17, -90) |
| 4 | bench lean-in (Bench 1) | (23.2, 1.8, 11) | (19.2, 0.7, 11) |
| 5 | horizon north over the lake | (-20, ground + 1.7, 33) | (-60, 20, -300) |
| 6 | ground at eye height | (10, 3.6, 40) | (10.5, 1.9, 36.5) |

1. **Spawn.** The ice cliff reads as blue-and-white cloth: the `carvedIce` map's sine bands are laid on 0..1 sheet
   uvs, so one tile stretches across 50 m (texture). The icefall behind is a heap of cubes floating over the
   glacier (shape). The flume cave is a box (shape). The yard is one flat white tone (texture, scale). The light is
   flat: the hemisphere's ground colour is brighter than its sky (light).
2. **Flume cave.** Every slab is a square-edged box; the cave's shell shows the carved-ice bands stretched along each
   slab (shape, texture). The slabs rest on the lake with no contact darkening (light).
3. **Crawler.** The cladding's `platedMetal` reads as basket weave and stretches 3.6 m vertically per panel (texture).
   The cut faces either side are the same stretched carved-ice bands, blue water rather than ice (texture). The
   floor plates read as tiles (texture, scale).
4. **Bench lean-in.** The cave's walls are vertical smears (stretched carved ice). The floor is a smooth, glossy,
   untextured sheet. The bench and its instrument read clearly and are left as they are.
5. **Horizon.** The pressure-ridge cave and shore slabs are stacks of boxes; the snout is cloth; the seracs on the
   icefall are cubes (shape); the moraine cut face to the left is a uniform dark grey (texture).
6. **Ground.** Soft blotches at an 11 m tile; no grain at the player's feet, no sastrugi, no scale cue (texture).

## CC0 textures (option A, owner's choice)

Poly Haven (all assets CC0 1.0, polyhaven.com/license checked 2026-11-27) and ambientCG (all assets CC0 1.0,
ambientcg.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by `tools/textures/prep_lanternfall.py`;
`public/textures/lanternfall/LICENSE.md` records each file.

| Pack | Source | Real tile | Used on | Size on disk |
|---|---|---|---|---|
| `snow` | [ambientCG Snow010A](https://ambientcg.com/a/Snow010A) | 2.5 m (taken) | the ground, snow on shells | 0.36 MB |
| `rock` | [rock_face_03](https://polyhaven.com/a/rock_face_03) | 2.7 m | nunatak and rock walls, stone, granite; its relief also on ice faces | 0.67 MB |
| `till` | [gray_rocks](https://polyhaven.com/a/gray_rocks) | 1.8 m | moraine cut faces and walls | 0.81 MB |
| `timber` | [wood_planks_grey](https://polyhaven.com/a/wood_planks_grey) | 1.5 m | linings, sets, crates, sledges | 0.46 MB |
| `sheet` | [corrugated_iron_03](https://polyhaven.com/a/corrugated_iron_03) | 2.0 m | the crawler's cladding | 0.25 MB |
| `plate` | [rusty_metal_02](https://polyhaven.com/a/rusty_metal_02) | 1.0 m | steel and dark steel (not the bench top) | 0.37 MB |

Total download about 2.8 MB, T4 only. Rejected after looking: ambientCG Ice001–Ice004 (read as broken green glass,
not glacier ice); Poly Haven `snow_02` (twig grooves, already rejected for Tallow).

## Decisions taken without asking

- **Ice keeps a procedural colour.** No CC0 photo reads as glacier ice in section. Ice faces get the rock photo's
  relief (normal, AO, roughness) for their fractured surface and a rewritten, calmer procedural albedo; the firn
  and dirt bands stay painted per vertex, where they already were.
- **World-projected uvs on the shells and the ground pieces.** The sheets are built with 0..1 uvs per sheet; rather
  than change every builder, the shell materials take `addWorldBoxUV` (the projection Tallow's bench uses), so every
  map tiles at a fixed number of metres everywhere.
- **The bench top keeps its own procedural plate.** `M.steel` is the bench's top; the bench gets its own copy before
  the photo plate lands on the rest of the steel, so the surface a student works on does not change.
- **Swap, not rebuild** (as Tallow): packs land in the existing map slots, so nothing recompiles; materials that had
  no maps (timber, stone, rock walls, till) get a procedural set at build, which is also their lower-tier look.
- **The aurora and the sky's teal horizon are not touched.** They are the world's teaching subject (an emission
  spectrum) and were set by the owner; only the hemisphere, environment and exposure move.

## Ordered changes and their checks

1. Plan, before shots, packs (this file). Check: licences, sizes.
2. Shape: rounded, chipped, seeded slabs (`Buckets.chunk`) for the shore ridges and the cave shells built of slabs;
   seracs on the icefall as broken blocks; fluted, receding melt scallops on the snout; snow drifted round the feet of
   posts and masts. Displacement only ever shrinks a piece inside its old box, so no new overlap or bay intrusion.
   Check: `verify:lanternfall` (overlap, bays, walk), `verify:bench`, perf.
3. Texture: packs wired (`initPacks`), world uvs and world variation on the shells, rewritten procedural ice, the
   ground's snow at 2.5 m with anti-tile under the vertex paint. Check: `verify:normals`, after shots 1–3, 6.
4. Light: hemisphere sky above bounce, environment and exposure re-set, contact occlusion on the ground round every
   room's portal and every standing landmark. Check: after shots 1–4, light count unchanged.

## Progress

- [x] Before shots (6)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-27)

| # | Change | Where |
|---|---|---|
| Shape | `chunkGeometry` / `Buckets.chunk`: a seeded block with rounded edges, worn faces and broken corners that only ever loses material inside the box it replaces | `lanternfall/kit.js` |
| Shape | The flume cave's standing slabs, lintels, rafted roof and heaped slabs, and the ice-hole cave's courses, lintels, roof and heap, as chunks | `lanternfall/stations.js` |
| Shape | Snow drifted over the flume cave's rafted roof (thin, so the slab edges break through) | `lanternfall/stations.js` |
| Shape | The shore's pressure-ridge slabs and the open ridge across the lake as chunks; the icefall's seracs as broken, tapering blocks | `lanternfall/ground.js` |
| Shape | The snout's face scalloped into melt flutes (ribs no prouder than the old face plus 0.77 m, runnels never behind the land's cliff) at a finer grid | `lanternfall/ground.js` `buildSnout` |
| Shape | Snow drifts banked round the feet of lantern posts and masts, inside their colliders; poles and legs rounder | `lanternfall/props.js` `snowSkirt` |
| Texture | Ice rewritten: pale melt scallops, air clouds, hairline fractures; colour and bands stay per vertex; less glossy | `materials/lanternfall-textures.js` `carvedIce` |
| Texture | Neutral procedural sets for every material that had no maps (timber boards, rock, cobble till, snow), graded to the photos' means; the colour moved into `color` | `lanternfall-textures.js` `grainSurface`, `lanternfall.js` `initMaterials` |
| Texture | World-projected uvs on every shell, face, slab, rock, timber, snow and metal material (one tile is a fixed size in metres everywhere), and world variation with anti-tile on the large surfaces, the crawler's cladding with run streaks | `lanternfall.js` `initSurfaces` |
| Texture | Photo packs: snow on the ground (2.5 m tile under the vertex paint) and on drifts; rock on rock walls, floors, stone, granite, footings; rock relief only on ice faces, slabs and carved ice; till on moraine faces; timber on linings and sets; profiled sheet on the crawler's cladding; plate on steel and dark steel, the paint moved into the colour as each lands | `lanternfall.js` `initPacks` |
| Texture | The bench's plate keeps its own procedural plated steel (`M.benchTop`) | `lanternfall.js`, `stations.js` `buildLfBench` |
| Light | Hemisphere: sky #4a6fb0 → #5d7fbf, bounce #9dc2d6 → #5f7684 (bounce now below the sky), 1.35 → 1.4; environment 0.75 → 0.85; exposure unchanged (1.12) | `lanternfall/atmosphere.js`, `lanternfall.js` |
| Light | Contact shade baked into the ground's and the lake's vertex colour: the foot of every cut face (by its height), round every room standing on the land or the lake, round masts, camps and sleds | `lanternfall/ground.js` `bakeContactShade`, `lanternfall.js` `initContacts` |

Light count unchanged (Directional 1, Hemisphere 1, pooled Point 3).

### Numbers

`node tools/perf-worlds.mjs lanternfall ligar` (T4, consolidated):

| | draws | triangles |
|---|---|---|
| before | 215 | 171k |
| after | 238 | 352k |
| budget | ≤ 566 | ≤ 900k |

The extra draws are the bench plate's own material and the drifts' snow material in each post and mast; the
triangles are the chunks (the ice-hole cave's courses most) and the finer snout.

Download added at 3D On: 2.8 MB (18 JPGs). Checks (2026-11-27): `verify:lanternfall` LANTERNFALL OK;
`verify:bench` BENCHES OK; `verify:normals` all normal-map checks pass; `npm run verify` ALL 42 CHECKS + BUILD OK.

### After shots (`docs/images/realism-lanternfall/after-*.jpg`)

1. Spawn: the ice cliff is fluted ice with a firn band at the top instead of blue cloth; the icefall is broken blocks,
   not cubes; the flume cave's slabs are rounded and its roof carries snow.
2. Flume cave: slabs with worn, rounded edges and fractures at a real size, not stretched bands; the heaped slabs are
   broken pieces. The cave's plan is still a rectangle (its room is fixed by the layout).
3. Crawler: profiled sheet at a 2 m tile on the cladding instead of basket weave; the cut faces either side are
   fractured pale ice, not stretched stripes; the tailgate is worn plate.
4. Bench lean-in: the floor is matte lake ice with faint fractures instead of a smooth glossy sheet; the walls are
   standing slabs; the bench, its plate and the instrument are unchanged and read as before.
5. Horizon: the moraine faces are cobble till; the ice-hole cave's courses are blocks with worn edges; the snout's
   silhouette is fluted.
6. Ground: packed, wind-textured snow at the player's feet instead of soft blotches.

### Left out, and why

- **The rooms' plan forms.** The flume cave still reads as a rectangle from the east: its walls stand on the room's
  rect, which is layout (not to be changed). The slabs, roof and drift break it up only at close range.
- **The far country's landforms and the nunatak.** They already read as eroded, layered land at their distance; the
  rock pack now covers the nunatak chamber and the erratic.
- **The lake ice.** Kept procedural: no CC0 photo reads as dark, clear lake ice, and as a near-mirror it is mostly the
  sky's reflection. It now takes contact shade round the caves.
- **The records tent's canvas, the dome and the crawler's hull.** Out of the walk past most hosts or already
  acceptable; left for a later pass.
- **The aurora, the sky's teal horizon and the fog.** The aurora is the world's teaching subject; not touched.
- **Ice photo.** ambientCG Ice001–Ice004 read as broken green glass; the ice keeps its procedural colour with the rock
  photo's relief only.

### Asset licences

All six packs are CC0 (Poly Haven, ambientCG); `public/textures/lanternfall/LICENSE.md` lists the asset, author, real
size and the grading done to each. Retired code: `archive/2026-11-27/lanternfall-realism/`.
