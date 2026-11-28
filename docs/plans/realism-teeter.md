# Realism pass: Teeter

Started and finished 2026-11-27. Art only: no site, layout, collider, bay, walk or bench behaviour changes. Follows the
Tallow, Lanternfall, Bellows, Ember, Kettle and Mirrowen passes, and reuses their shared loader
(`src/three/materials/texture-pack.js`) and Kettle's opt-in built kit (`kettle/kit.js`, `builtKit`).

## The real place

Teeter is a working salt garden cut into a west-facing hillside of limestone and salt-bearing marl, in a dry, hazy
climate. A brine spring at the head of a gully feeds a stone lade along the top shelf; from there the brine runs down
five terraces of shallow evaporation pans. Each terrace is held up by a dry-dressed limestone retaining wall about
5.5 m high, coursed in rock-faced blocks with a dressed coping. The walks along the wall feet (the dikes) are packed
clay with grit, trodden pale in the middle and damp at the wall foot. The pans are walled in clay banks; the brine in
them is a few centimetres of grey-green water over a pale crust. The works date from the late 19th century: the stone
is salt-bloomed and weathered, the timber is grey, the ironwork is painted and rusting.

References (descriptions, not images in the repo):

1. Salinas de Añana (Basque Country): terraced pans on a valley side, stone retaining walls under every terrace, a
   white efflorescence tide line along each wall a hand to a forearm above its foot, dark damp at the foot itself.
2. Maras salt terraces (Peru): hundreds of small pans in a regular grid on a slope, the brine reading as pale silver
   under a hazy sky, the clay banks between them rounded and pale.
3. 19th-century limestone retaining walls in the Jura and the Causses: rock-faced blocks in regular courses, a dressed
   flat coping in separate stones, a plinth course stepping out at the foot, vertical streaks under the coping.
4. Bare salt-bearing marl hillsides (the Cardona salt mountain, the Atacama foothills): gullied by rain down the fall
   line, ridges paler than gullies, no vegetation.
5. Stone setts on a steep cart ramp: small square setts, worn in the wheel line, grit in the joints.

## What looks fake (before shots: `docs/images/realism-teeter/before-*.jpg`)

Shots taken at 3D On in the app's browser pane (1024 × 768). The camera was set through `stage.enterTeeterScene` and
`camera.lookAt`, the HUD hidden by a style rule, the canvas read back after an explicit render.

| # | View | Camera | Look at |
|---|---|---|---|
| 0 | overview (extra) | (110, 48, 60) | (-20, 0, -5) |
| 1 | spawn | (70, eye, 30) | (58, 23.2, 36.2) |
| 2 | gauge chamber (q3) from its dike | (8, eye, 24) | (12, 12.6, 16.4) |
| 3 | dissolve room (q7) from the drying floor | (-48, eye, 20) | (-44, 1.8, 11.8) |
| 4 | bench lean-in (q1) | 1.9 m out from the plate, 0.85 m over it | the plate |
| 5 | far horizon over the floor's parapet | (-62, eye, 0) | (-300, -14, 40) |
| 6 | ground at eye height (dike 1) | (37, eye, 10) | (37.6, ground, 7) |
| 7 | the stair from its head (after only) | (66, eye, 36.2) | (40, 14, 36.2) |

1. **Spawn.** The ground is a net of 1.75 m hexagonal "pavers" with dimples (`saltHardpan` at `x / 7` uvs, repeat 4):
   a tiled floor, not packed clay (texture, low-frequency procedural, scale). The ramp walls and kerbs are bare boxes
   with knife edges (shape). The walls' stone is crazy paving cut by a 2.4 m joint grid (texture). The brine reads
   as blue glass tiles (texture, albedo too saturated toward cyan). The hill is a smooth dome (shape).
2. **Gauge chamber.** The terrace wall is one 24 m box per piece: no plinth, no coping stones, no courses; the
   crazy-paving tile repeats every 2.4 m in both directions (shape, texture). The wall meets the dike in a hard clean
   line with no damp and no shadow (light, grime). The lintel is a slab of the same crazy paving.
3. **Dissolve room.** As 2. The plinth-less foot, the identical tile and the absence of any weathering read as a
   rendered prop, not a retaining wall a century old.
4. **Bench lean-in.** The plate is legible. The room's wall behind is the same crazy paving, dark and soft (texture).
5. **Horizon.** The parapet's coping is one long slab with the joint grid; the hills are smooth dunes without gullies
   or ridges; the haze buries the valley (shape, light).
6. **Ground close-up.** Hexagonal pavers with stitched edges and dimples, uniform in size: nothing natural.

## CC0 textures (option A, the owner's choice)

All from Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by
`tools/textures/prep_teeter.py`. `public/textures/teeter/LICENSE.md` lists each file, its authors and its grading.

| Pack | Source | Real tile | Size on disk | Used on |
|---|---|---|---|---|
| `ground` | [dry_mud_field_001](https://polyhaven.com/a/dry_mud_field_001) | 3.0 m | 0.86 MB | the ground mesh (× its vertex paint), the pans' clay banks |
| `wall` | [sandstone_blocks_05](https://polyhaven.com/a/sandstone_blocks_05) | 3.0 m | 0.61 MB | terrace walls, plinths, ramp walls, kerbs, rooms' walls, the spring house and piers |
| `flags` | [sandstone_blocks_08](https://polyhaven.com/a/sandstone_blocks_08) | 3.0 m | 0.13 MB | rooms' floors, the coping stones and lintels |
| `setts` | [square_cobblestone](https://polyhaven.com/a/square_cobblestone) | 2.0 m | 0.58 MB | the stair's four ramps |
| `timber` | [weathered_planks](https://polyhaven.com/a/weathered_planks) | 2.0 m | 0.30 MB | fences, joists, ties, the hosts' timber |
| `brick` | [medieval_red_brick](https://polyhaven.com/a/medieval_red_brick) | 2.0 m | 0.51 MB | the rooms' barrel vaults and jack arches |

Total: 2.9 MB (18 files), fetched only at 3D On (T4). Looked at and not used: `dry_ground_rocks` (too brown and
stony for a trodden dike), `gravel_ground_01` (reads as a gravel drive), `castle_wall_varriation` and
`medieval_blocks_02` (random rubble, not coursed ashlar), `stone_tiles_02` (crazy paving again).

## Decisions taken without asking

- **Kettle's built kit, switched on for Teeter** (`TeeterWorld.builtKit = true`): every kit box, bar and cylinder in
  the hosts, the plant and the pumps is chamfered or bevelled with uvs in metres, so every material is tiled in metres
  (repeat = 1 / tile). The beam pumps' local `box`/`cyl` helpers now go through the kit too (their piers wore the
  stone photo at several times its size on stock 0..1 uvs).
- **The bench keeps its look.** Its parts are stock boxes from `bench-bay.js`, so it gets its own materials at the old
  repeat (`M.benchTop`, `M.benchDark`, `M.benchTray`); the cased instrument and the plate are untouched.
- **The masonry carries its own grime** as a vertex attribute (`ttFoot`, the height of the ground in front of each
  block) read by a shader patch on the masonry's clones (`teeter/grime.js`): a damp band at the foot and a ragged salt
  tide line above it. A wall's ground is level, so one height per block is exact; the ramps' side walls (whose floor
  slopes) are left clean, as a band drawn up a slope read as a wash.
- **Contact at the wall foot is the ground's vertex paint** (`footShade`), on four extra rows of vertices at 0.12,
  0.45, 1.1 and 2.2 m from each dike's wall, not a baked map: the dikes are straight strips along straight walls.
- **The far land is eroded in the drawn mesh only** (`relief`): the height the game and the checks read is the plan's,
  unchanged; nobody walks there. Faded to zero near the terraces, the graduation tower, the cistern house, the brine
  main and the river.
- **Anti-tile off for directional maps** (coursed stone, boards, brick), as Mirrowen found: the rotated second sample
  draws their joints crossed.
- **The haze opens a little** in code (`fogNear` × 1.3, `fogFar` × 1.2) rather than in `world-data/teeter.json`, which
  is generated and checked against the plan.

## Ordered changes and their checks

1. Plan, before shots, packs (this file). Check: licences, sizes.
2. Shape: built kit; masonry as chamfered blocks laid in world metres; plinth course, coping stones, kerb stones,
   rounded clay banks, chamfered fences; the stair as its own mesh; the far land eroded. Check: `verify:teeter`
   (overlap, buried, walk, rooms, hosts in their rooms), `verify:bench`, perf.
3. Texture: metric repeats; six packs dressed at T4; world variation; the masonry's foot grime; gully shading on the
   far land. Check: `verify:normals`, after shots.
4. Light: sun 2.3 → 2.7, hemisphere 1.2 → 0.92 with a darker, warmer bounce; environment 0.8 → 0.65; haze opened.
   Light count unchanged. Check: after shots 1–5 (bench lean-in legible), `verify:teeter` lamp checks.

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
| Shape | Every masonry block chamfered (2–4 cm on walls and kerbs, 7 cm on the clay banks, 1–1.4 cm on fence timber), uvs laid from the block's final world position in metres on its own face plane, so the courses run on from block to block | `teeter/terrain.js` `block`, `finish` |
| Shape | Along the five walls the walk passes: a plinth course stepping out 0.1 m at the foot, and a coping of separate dressed stones 0.8–1.5 m long, a few millimetres off each other in height and line (seeded); the shelf's bank the same | `teeter/terrain.js` `buildMasonry`, `stoneRun` |
| Shape | Kerbs between the dikes and the pans in separate kerb stones | `teeter/terrain.js` |
| Shape | The stair's four ramps as their own mesh (`teeter-stair`, the same vertices as the ground) | `teeter/terrain.js` `buildGroundGeometry`, `teeter.js` `initTerrain` |
| Shape | Hosts, plant and pumps built with chamfered and bevelled kit parts | `teeter.js` (`builtKit`), `teeter/plant.js` |
| Shape | The hill and the spurs cut by gullies down the fall line, with broad swells; gullies darker and ridges paler in the vertex paint | `teeter/terrain.js` `relief`, `reliefAt` |
| Texture | One texel density: every material's repeat is 1 / its tile in metres; ground and setts photographed; walls, kerbs, rooms in coursed limestone; coping and floors in dressed slab; timber and vaults photographed | `teeter.js` `initMaterials`, `initPacks` |
| Texture | World variation on every big surface; streaks down the walls under the coping | `teeter.js` (pbr-kit `addWorldVariation`) |
| Texture | Damp band and salt tide line at every wall's foot, from the ground in front of it | `teeter/grime.js`, `ttFoot` in `teeter/terrain.js` |
| Texture | The brine warmed and thinned (tint `#e8dfcc`, opacity 0.78 → 0.62), so the pans read as brine over crust, not as blue glass | `teeter.js` |
| Texture | `weatheredBoards`: a procedural board surface, the timber's lower-tier look and the slots the photo fills | `materials/teeter-textures.js` |
| Light | Ground darkened over the last two metres before each wall's foot | `teeter/terrain.js` `footShade` |
| Light | Sun 2.3 → 2.7, hemisphere 1.2 → 0.92 (sky `#cdd5d7`, bounce `#a69c86`), environment 0.8 → 0.65, haze opened | `teeter/atmosphere.js`, `teeter.js` |

Light count unchanged: Directional 1, Hemisphere 1, pooled Point 3 (`verify:teeter`: the lamps share 3 real lights).
Exposure unchanged (0.88).

### Numbers

`node tools/perf-worlds.mjs teeter ligar` (T4):

| | draws | triangles | shadow-caster triangles | Node build |
|---|---|---|---|---|
| before | 401 | 263k | 29k | 372 ms |
| after | 423 | 471k | 156k | 534 ms |
| budget | ≤ 566 | ≤ 900k | | |

Download added at 3D On: 2.9 MB (18 JPGs), fetched after the world is built and uploaded as each lands.

### After shots (`docs/images/realism-teeter/after-*.jpg`)

0. Overview: the pans read as pale grey-green brine; the walls as stone with a coping; the hills show gullies.
1. Spawn: the shelf is packed clay with grit instead of a paver net; the ramp walls are coursed stone with a dressed
   coping; kerb stones line the pans.
2. Gauge chamber: coursed rock-faced limestone with a plinth course, a dressed lintel and coping, a damp foot and a
   ragged salt line; the dike darkens toward the wall.
3. Dissolve room: as 2, on the drying floor.
4. Bench lean-in: the plate, the cased instrument and the pieces are unchanged and as legible as before; the wall
   behind is coursed stone under the lamp.
5. Horizon: the parapet's coping is separate dressed stones; the far hills carry gullies; the haze is a little lighter.
6. Ground: a photographed trodden clay with grit at true scale, darker at the wall's foot; the plinth and its courses.
7. Stair: worn setts down the ramp between coursed ramp walls with a dressed coping.

### Left out, and why

- **The bench's cased instrument and plate.** They are the bench's (`bench-bay.js`, shared by every world) and the
  teaching surface; untouched.
- **A battered (leaning) wall face.** Real retaining walls lean back; here the weir houses' fronts stand in the plane
  of the terrace wall above its coping, so a batter would leave a step where each house meets its wall.
- **Counterforts or pilasters.** Anything standing more than a hand out of a wall would stand inside the walk with
  no collider (colliders are not changed by this pass).
- **Rock outcrops on the hill.** The gullies and the shading carry the far land; outcrops would be scatter.
- **The pumps' moving beams and rods**, the far country's buildings (the graduation tower, the cistern house, the
  brine main) and the drying floor's heaps: beyond 15 m of the walk or moving; they get the built kit and the new
  materials, but no new construction.
- **The valley floor** stays flat: it carries the river, and the haze holds it.
- **A contact map inside the rooms.** The rooms are lamp-lit; their walls carry the damp band, the floors do not.

### Asset licences

All six packs are Poly Haven CC0; `public/textures/teeter/LICENSE.md` lists the asset, authors, real size and the
grading done to each. Retired code: `archive/2026-11-27/teeter-realism/` (the source files as they were).
