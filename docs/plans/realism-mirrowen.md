# Realism pass: Mirrowen

Started 2026-11-27. Brief: the owner's realism-pass prompt (same brief as `realism-lanternfall.md`). Art only: no site,
layout, collider, bay, walk or bench behaviour changes.

## The real place

Mirrowen is a small northern commercial harbour on a still, frozen morning: a basin closed by granite quays, a mole
out to a head on the sea ice, a cast-concrete dry dock with a tug on its blocks, a canal with a lock, two timber
boathouses on piles, and three working ships (an ice-breaker, a tanker, a freighter frozen into the canal). The quays
are late-19th-century dressed granite: rough-faced coursed blockwork walls with chamfered coping stones and setts
on top. The dock and the pump-well are early-20th-century shuttered concrete. The boathouses are tarred and weathered
board on timber frames under corrugated iron. The ships are painted welded steel plate, scraped by ice at the
waterline. Climate: sub-arctic, below freezing for weeks, a low sun in the east-south-east, sea smoke over the
open water, snow on the hills and the sea ice, the quays ploughed and trodden.

References (descriptions, not images in the repo):

1. Granite harbour walls of a 19th-century North Sea port (Aberdeen, Peterhead): grey rough-faced blocks in courses
   about 0.5 m high, darker and wet-stained in a band above the water, a chamfered coping course on top, iron
   bollards set into the setts.
2. Granite setts on a working quay in winter: grey, about 10 × 20 cm, snow lying in the joints and along the walls'
   feet, the walking lines darker and polished.
3. A Baltic ice-breaker alongside in winter (Helsinki's icebreaker quay): red hull scraped grey-black along the ice
   belt, white superstructure of welded plate with rows of portholes, a rubbing strake and a rail round every deck.
4. A Norwegian boathouse (naust) on piles: horizontal weathered boards silvered brown, corner boards, a dark
   corrugated roof, piles dark and wet at the waterline.
5. Shuttered concrete dry-dock walls (Victorian or interwar): board-marked concrete with lift joints every
   1.5–2 m, wet and dark at the floor.
6. Winter sea ice outside a harbour: white snow-covered floes with grey pressure ridges, a tabular iceberg broken
   and eroded, never a box.

## What looks fake (before shots: `docs/images/realism-mirrowen/before-*.jpg`)

Viewpoints (camera → look-at), reused for the after shots. `before-0-overview.jpg` is an extra air view.

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn (terrace) | (24, 6.6, 50) | (6, 5.8, 20) |
| 2 | ice-breaker (host 1) from the main quay | (-4, 1.7, 34) | (10, 3, 10) |
| 3 | boathouse (host 6) from the shore | (-52, 1.7, 0) | (-26, 2, -13) |
| 4 | bench lean-in (Bench 1, deckhouse) | (13, 2.8, 8.2) | (13, 2.0, 3.6) |
| 5 | horizon north from the mole head | (70, 1.7, -88) | (110, 12, -400) |
| 6 | ground at eye height (terrace) | (24, 6.6, 50) | (24.5, 4.9, 46.5) |

1. **Spawn.** The ship's superstructure reads as a white tiled bathroom: the `platedMetal` panels are laid on each
   box face's 0..1 uvs, so panel size changes with every box (texture, scale). Every hull and deckhouse is a
   knife-edged box (shape). The quay and terrace are one pale noise with no setts, no scale (texture, scale). The
   light is flat white-grey: the hemisphere's ground is almost as bright as its sky and the sun is weak (light).
2. **Ice-breaker.** The hull is a flat red slab with a striped stretched map; no rubbing strake, no portholes
   (shape, texture). The quay wall is a dark grey strip of stretched planks (texture). The quay's edge has no coping
   (shape). The bollard is a stack of cylinders (shape). Nothing darkens where the ship meets the ice (light).
3. **Boathouse.** Flat untextured brown boxes (`M.timber` has no maps); the roof is grey tiles at random scale; no
   corner boards, no fascia (shape, texture). The brick pump house is a flat red tile pattern with bricks 30 cm high
   (scale). The quay wall's coping is missing (shape).
4. **Bench lean-in.** The floor plate tiles every metre in a square checker (texture); the walls are flat grey
   panels. The bench and instrument read clearly and are left as they are.
5. **Horizon.** The iceberg is a box with a crazy-paving map; the ship far out is two boxes (shape). The sea ice is
   uniform (texture).
6. **Ground.** One blotchy pale tone at a 4 m tile, no setts, no snow in joints, no scale (texture).

## CC0 textures (option A, owner's choice)

Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by
`tools/textures/prep_mirrowen.py`; `public/textures/mirrowen/LICENSE.md` records each file.

| Pack | Source | Real tile | Used on |
|---|---|---|---|
| `setts` | [square_cobblestone](https://polyhaven.com/a/square_cobblestone) | 2.0 m | quays and terrace (the paved part of the ground) |
| `snow` | [snow_01](https://polyhaven.com/a/snow_01) | 2.0 m | hills, sea ice, the snow part of the ground |
| `granite` | [granite_wall](https://polyhaven.com/a/granite_wall) | 1.9 m | quay walls, kerbs, coping, breakwater |
| `concrete` | [concrete_wall_004](https://polyhaven.com/a/concrete_wall_004) | 2.0 m | dry dock, pump well, footings |
| `plate` | [blue_metal_plate](https://polyhaven.com/a/blue_metal_plate) | 2.5 m | painted hulls and superstructures, cladding (graded neutral; the paint is the material colour) |
| `deck` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | 2.0 m | deck plate, grating, hatch covers |
| `rust` | [rusty_metal_04](https://polyhaven.com/a/rusty_metal_04) | 2.0 m | the frozen freighter, rusted steel, the crane |
| `boards` | [weathered_brown_planks](https://polyhaven.com/a/weathered_brown_planks) | 1.8 m | boathouse walls, piers, gates, piles |
| `roof` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | 2.7 m | corrugated roofs and the stores' walls |
| `brick` | [red_brick_03](https://polyhaven.com/a/red_brick_03) | 1.0 m | the pump house and its chimney |

Total 4.0 MB on disk (see "Numbers" below). Rejected after looking: `rusty_painted_metal`
(corrugated, not plate), `snow_05` (tyre tracks), `concrete_wall_003` (beige render), `cobblestone_floor_04`
(rounded cobbles with moss, not dressed setts).

## Decisions taken without asking

- **The ground becomes two materials** (one extra draw): the quays and terrace are granite setts, the hills and the
  sea ice snow. The plan already paints the quays as setts per vertex; the old single frost map hid it. The split is
  by the same test `groundTint` uses, made into two index groups on the one terrain mesh.
- **World-projected uvs on every shell and prop material** (`addWorldBoxUV`, as Lanternfall), so a plate or a block
  is the same size on every face.
- **The bench top keeps its procedural plate.** `M.steel` is the bench's top; the bench gets its own copy
  (`M.benchTop`) before the photo plate lands on the rest of the steel.
- **Swap, not rebuild** (as Tallow and Lanternfall): packs land in the existing map slots; materials that had no maps
  (`timber`, `timberDark`, `boards`, `brick`) get a procedural set at build, which is also their lower-tier look.
- **The Fifth's crystal ice keeps its procedural map.** It is the world's story object, not a real material.

## Ordered changes and their checks

1. Plan, before shots, packs (this file). Check: licences, sizes.
2. Shape: chamfered coping stones on every quay wall and kerb; rubbing strakes, bulwark caps, portholes and deck rails
   on the ships; corner boards and fascias on the boathouses; a turned (lathe) bollard and chamfered lamp footings; a
   broken tabular iceberg, crystal walls in the canal and real hull shapes and pitched roofs on the far country.
   Shells and vista are `phys: 'ground'`/`'ambient'`, so these never meet the overlap check; landmark changes stay
   inside their old boxes. Check: `verify:mirrowen`, `verify:bench`, perf.
3. Texture: world uvs and world variation, packs, the ground split. Check: `verify:normals`, after shots 1–3, 5, 6.
4. Light: a warmer, stronger low sun; a hemisphere whose bounce is darker than its sky; contact shade baked into the
   ground's vertex colour at the foot of every wall, room, hull and building. Check: after shots 1–4, light count.

## Progress

- [x] Before shots (6 + overview)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-27)

| # | Change | Where |
|---|---|---|
| Shape | `stoneCourse`: a dressed coping course of chunked stones (about 1.1 m long, rounded arrises, chipped corners) on every quay, dock, retaining and yard wall and along every kerb; the wall stops under it | `mirrowen/terrain.js` `edges` |
| Shape | Railings as tube rails on round stanchions with base plates; bulwarks with a round capping rail | `terrain.js` `rail`, `bulwark` |
| Shape | Rubbing strakes along every hull side; portholes (dark glass in brass rims) on the ice-breaker's casing and the freighter's deckhouse; framed windows in two tiers on the tanker's deckhouse; rails round all three upper decks | `terrain.js` `hull`, `superstructure`, `portholes`, `windows`, `deckRail` |
| Shape | The salt store's roof a true hip (one solid) instead of three stacked slabs; the thaw shed's gable a triangle instead of four steps; fascias, a ridge capping and corner boards on both boathouses | `terrain.js` `hipRoof`, `cornerBoards`, `room` |
| Shape | The pump house: granite plinth, string course, window sills and chimney cap | `terrain.js` `pumpHouse` |
| Shape | Far country: the tabular iceberg and its calved block eroded and tapered (`chunkGeometry`); breakwater as broken armour stone; the canal's ice walls as clusters of crystal columns; far ships as hulls with a raked bow; the town's roofs gabled | `terrain.js` `buildHarbourVista`, `farHull`, `gable` |
| Shape | A turned bollard (lathe: flared foot, waist, lipped cap) on a chamfered concrete foot; the lamp posts' feet chamfered blocks | `mirrowen/plant.js` |
| Texture | World-projected uvs on every shell and prop material, world variation (tone, roughness, run streaks on walls) on the large ones; anti-tile only on maps with no direction (rust, concrete), since its rotated sample crosses boards, courses and plate seams | `mirrowen.js` `initSurfaces` |
| Texture | The ground in three surfaces (index groups on the one mesh): snow on the hills and the sea ice, granite setts on the quays and terrace, concrete on the dock floor | `terrain.js` `groundSurface`, `mirrowen.js` `initMaterials` |
| Texture | Photo packs into the existing map slots at T4; painted steel and sheet take the paint as material colour (`tintTo`); boards, brick got neutral procedural grains (their lower-tier look) | `mirrowen.js` `initPacks` |
| Texture | The bench's plate keeps its own procedural steel (`M.benchTop`) | `mirrowen.js`, `mirrowen/stations.js` `buildMwBench` |
| Light | Sun #edf3f7 2.0 → #f6efe3 2.8 (a low morning sun, faintly warm); hemisphere #bdd0dc/#7f8c90 1.25 → #bccfdc/#5e676a 0.92 (bounce well under the sky); environment 0.85 → 0.75; exposure unchanged (0.9) | `mirrowen/atmosphere.js`, `mirrowen.js` |
| Light | Contact shade baked into the ground's vertex colour: the ice at the foot of every quay and dock wall, round every hull and the boathouses' piles, the dock floor along its walls; the quay edge beside a hull, the pump house's foot | `terrain.js` `contactShader` |

Light count unchanged (Directional 1, Hemisphere 1, pooled Point 3).

Old code: `archive/2026-11-27/mirrowen-realism/` (the six files as they stood, with a README).

### Numbers

`node tools/perf-worlds.mjs mirrowen ligar` (T4, consolidated):

| | draws | triangles |
|---|---|---|
| before | 292 | 283k |
| after | 299 | 444k |
| budget | ≤ 566 | ≤ 900k |

The extra draws are the ground's two new surfaces, the bench's own plate material and the copies; the triangles are
the coping stones (the most), the chunked far country and the tube rails.

Checks (2026-11-27): `verify:mirrowen` MIRROWEN OK; `verify:bench` BENCHES OK; `verify:normals` all normal-map
checks pass; `npm run verify` ALL 42 CHECKS + BUILD OK.

Texture download added at 3D On: 4.0 MB (30 JPGs, 1K). This is more than Lanternfall's 2.8 MB because the harbour
has more distinct near materials (stone, setts, concrete, painted plate, deck plate, rust, boards, sheet, brick,
snow); each pack is used on several materials, and nothing is fetched below T4.

### After shots (`docs/images/realism-mirrowen/after-*.jpg`)

0. Overview: setts on every quay and the terrace, snow on the open land and sea ice; hipped and gabled boathouse
   roofs; rails round the upper decks.
1. Spawn: the terrace is granite setts instead of pale noise; the superstructure is painted plate at one scale instead
   of white bathroom tiles; deck rails and portholes break up the ship's boxes; the light has a sun side.
2. Ice-breaker: coping stones along the quay edge; rubbing strake, portholes and deck rail; a turned bollard; the red
   hull is painted plate without stripes.
3. Boathouse: weathered boarding with corner boards and fascias (`after-3b-boathouse-close.jpg` from 6 m); the roof a
   true hip; the quay edge coped. From 30 m the boards still alias toward a blockwork look (mip level of the 2.4 m
   tile).
4. Bench lean-in: unchanged bench and instrument; the deckhouse floor is worn deck plate instead of a square checker;
   the pump house beyond shows its plinth and sills.
5. Horizon: coped mole head and setts; the iceberg eroded and tapered with a calved block; the ship far out has a bow.
6. Ground: granite setts about 20 cm, joints dark, worn paler on the paths.

## Left out, and why

- **No snow drifts on the quays.** The setts are shown ploughed and trodden; drift geometry against the quay
  furniture would need per-site placement that could meet the overlap and low-body checks. A later pass could add
  vertex-painted snow in the joints along walls.
- **The ice-breaker's hull is still a box in plan** (only its bow is shaped). Giving the parallel body a bilge curve
  means rebuilding the hull from the plan's outline, which `harbour-plan.js` uses for the walk; left alone.
- **The Fifth's crystal ice keeps its procedural map** (story object, not a real material).
- **The sky dome is unchanged** (the overcast is the world's look); only the lights and environment moved.
