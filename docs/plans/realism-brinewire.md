# Realism pass: Brinewire

Started 2026-11-27. Art only: no site, layout, collider, bay, walk or bench behaviour changes. Follows the Tallow,
Lanternfall, Bellows, Ember, Kettle, Mirrowen and Teeter passes, and reuses their shared loader
(`src/three/materials/texture-pack.js`) and Kettle's opt-in built kit (`kettle/kit.js`, `builtKit`).

## The real place

Brinewire is a tidal barrage across a salt marsh on a dry coast: one mass-concrete wall about 15 m high between two
sandstone headlands, the impounded lagoon on its west side 10 m up, a 12 m drop to the tailrace basin and the tidal
flats on its east. It was built in the 1930s and has been worked ever since: the great faces were cast in lifts
against timber shuttering, so they carry board marks and a lift joint every metre and a half; the parapets, piers and
rooms are later cast concrete with tie holes; the gate houses are concrete blockwork with sheet roofs; the steelwork is
painted and rusting at every lap; the copper fittings have gone green. The brine leaves a dark wet band and a ragged
white salt line on every face that stands in it.

References (descriptions, not images in the repo):

1. Board-marked mass-concrete dams of the 1930s (Hoover's downstream face, the Scottish hydro dams): vertical board
   texture, horizontal lift joints, dark leaching streaks running down from each joint, efflorescence below them.
2. Tidal barrages and sea locks (the Rance barrage, Dutch Afsluitdijk sluices): a precast coping on the parapet in
   separate units with chamfered edges, a dark algal band and a pale salt line at the water level, rust-stained steel
   gates in their slots.
3. Inter-war concrete blockwork gate and pump houses: rendered or bare block in running bond, a cast sill and lintel,
   corrugated sheet roofs gone dull grey.
4. Copper bus and fittings by the sea: verdigris green, darker in the hollows, rust spots where iron clamps touch it.
5. Bedded sandstone headlands on a dry coast (the Jurassic Coast, Namaqualand): beds 0.5–1.5 m thick, paler and redder
   in turn, broken faces, the colour of dry rock in strong low sun.

## What looks fake (before shots: `docs/images/realism-brinewire/before-*.jpg`)

Shots taken at 3D On (T4) in the app's browser pane at 1024 × 768 (DPR 1.5): the camera set on the stage's camera,
the world updated three times with the shadow forced, then rendered and read back.

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn (north yard, along the crest road) | (-29, 13.6, -67) | (-29, 13.2, -50) |
| 2 | host: gate house 1 from the crest road | (-27, 13.6, -52) | (-42, 14, -38) |
| 3 | host: the rectifier cage from the apron | (26, 1.6, -58) | (6, 4, -72) |
| 4 | bench lean-in (q4, meter room in the gallery) | (-14.6, 8.3, -2.8) | (-17.6, 6.9, -2.8) |
| 5 | far horizon over the lagoon | (-30, 13.6, 30) | (-300, 8, 80) |
| 6 | ground at eye height (crest road at a gate house) | (-30, 13.6, -40) | (-33, 12, -37.5) |
| 7 | the east face from the tailwater (extra) | (30, 1.6, -30) | (4, 6, 10) |

1. **Spawn.** Every concrete surface (paving, parapets, the gate houses, the deck) wears the same `pourConcrete` tile:
   four 0.6–0.75 m panels to each 2.4–3 m repeat, a black joint grid and a tie hole in every panel. The road reads as
   a bathroom floor and the walls as tiled boxes (texture, scale). The parapet and coping are bare boxes with knife
   edges (shape). The headland behind is a net of cobbles: the ground's cracked-mud worley at `x / 7` (texture).
   Ambient is flat; nothing darkens where the walls meet the road (light).
2. **Gate house.** Blockwork that is the same tiled concrete; the roof is a flat dark slab with no profile; the sill,
   lintel and walls are single sharp boxes (shape, texture). No grime at the foot.
3. **Cage.** The east face behind it is the tile grid again, 15 m of it, with a visible regular repeat (texture). The
   steel reads as dark flat paint; the plant's posts and frames are stock boxes (shape).
4. **Bench lean-in.** The plate and instrument are legible but dim; the room's walls are the plated-metal procedural
   at 0.5 m panels (texture). Kept as the reference for legibility.
5. **Horizon.** The coping reads as a row of identical tiles with dark joints at 1.2 m; the parapet's face is the tile
   grid (texture). The lagoon and the pylons are acceptable.
6. **Ground close-up.** The paving's joints are drawn in the texture every metre on top of the real 6 m joints in the
   vertex colour; the tie holes repeat on the floor, which no floor has (texture, scale). The parapet's foot meets the
   paving in a clean line (light).
7. **East face.** A 300 m grid of identical panels; the salt line is a ruler-straight white stripe (texture, shape).

## CC0 textures (option A, the owner's choice)

All from Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by
`tools/textures/prep_brinewire.py`; `public/textures/brinewire/LICENSE.md` lists each file, its authors and its grading.

| Pack | Source | Real tile | Size on disk | Used on |
|---|---|---|---|---|
| `board` | [wood_textured_concrete](https://polyhaven.com/a/wood_textured_concrete) | 1.8 m | 0.26 MB | the barrage's two great faces and the walls over a drop |
| `wall` | [concrete_wall_006](https://polyhaven.com/a/concrete_wall_006) | 2.0 m | 0.59 MB | parapets, piers, copings, lintels, vaults, rooms' walls, plinths |
| `pave` | [concrete_floor_worn_001](https://polyhaven.com/a/concrete_floor_worn_001) | 3.0 m | 0.27 MB | the walks' paving, the deck, the rooms' floors |
| `block` | [concrete_block_wall](https://polyhaven.com/a/concrete_block_wall) | 2.0 m | 0.62 MB | the gate houses' blockwork |
| `rock` | [rock_face](https://polyhaven.com/a/rock_face) | 2.38 m (laid at 4 m) | 0.50 MB | the ground mesh: headlands, beds, flats (× its vertex paint) |
| `steel` | [rusty_painted_metal](https://polyhaven.com/a/rusty_painted_metal) | 2.2 m | 0.23 MB | painted steel: stanchions, beams, rails, the gate leaf, plant steel |
| `patina` | [green_metal_rust](https://polyhaven.com/a/green_metal_rust) | 1.0 m | 0.18 MB | the green copper cladding and fittings |
| `roof` | [worn_corrugated_iron](https://polyhaven.com/a/worn_corrugated_iron) | 1.8 m | 0.46 MB | roof sheet on the gate houses and the cage |

Total: 3.0 MB (24 files), fetched only at 3D On (T4). Looked at and not used: `concrete_wall_003` and `dirty_concrete`
(blotchy stains that read as paint), `preconcrete_wall_001` (crazed render, not cast concrete), `worn_rock_natural_01`
(too smooth and yellow to read as bedded rock).

## Decisions taken without asking

- **Kettle's built kit, switched on** (`BrinewireWorld.builtKit = true`): every kit box, bar and cylinder in the hosts
  and the plant is chamfered or bevelled with uvs in metres; every kit material's repeat becomes 1 / its tile.
- **The bench keeps its look.** Its parts are stock boxes from `bench-bay.js`, so it gets its own materials at the old
  repeat (`M.benchTop` as before, plus `M.benchDark` and `M.benchTray`); the plate and cased instrument are untouched.
- **The barrage's boxes are built shapes too**: chamfered (2–4 cm), uvs laid from their final world position in metres
  on each face's own plane so the texture runs on from piece to piece. Every chamfer only removes material inside the
  old box, so no overlap, bay or walk check can change.
- **The water's line is a ragged strip**, not a box: the wet band's top and the salt line's top wander a few
  centimetres along the face (seeded), in the same thin skin a hand off the face as before.
- **Contact shade is in vertex colour**: the paving darkens over the last half metre before each wall's foot. No
  per-frame cost. (The ground meets the barrage almost everywhere under water, so it was left.)
- **The instrument board behind the q4 plate gets its own material** (`M.panel`, procedural flat plate): the steel
  photograph is ribbed sheet with rust runs, which is wrong for an instrument board and busy behind the teaching view.
- **Walls over a drop are board-marked mass concrete** like the great faces (they were the stained cast `wall` photo,
  which repeated as a comb along the 300 m ramp wall).
- **Procedural maps stay as the fallback** and the lower-tier look; the concrete procedural loses its tile grid (fewer,
  larger panels, no tie hole in every panel) so T2/T3 and a failed fetch no longer show the bathroom tile either.

## Ordered changes and their checks

1. Plan, before shots, packs (this file, the licence). Check: licences, sizes.
2. Shape: built kit; chamfered barrage boxes with world-metre uvs; precast coping units; ragged waterline. Check:
   `verify:brinewire` (overlap, walk, rooms, hosts in their rooms), `verify:bench`, perf.
3. Texture: metric repeats; eight packs dressed at T4; world variation (anti-tile off on directional maps); leaching
   streaks on the faces. Check: `verify:normals`, after shots.
4. Light: hemisphere less flat, environment and exposure re-balanced, contact shade. Light count unchanged. Check:
   after shots 1–5 (bench lean-in legible), `verify:brinewire` lamp checks.

## Progress

- [x] Before shots (7)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-27)

| # | Change | Where |
|---|---|---|
| Shape | Every barrage box chamfered (3.5 cm at most, none under 6 cm thick), uvs laid in metres from its final world position on its face's plane, so the concrete runs on across pieces | `brinewire/terrain.js` `block`, `metricUV` |
| Shape | The great faces and every wall over a drop cast in 1.5 m lifts on levels shared by the whole barrage: a V groove at each lift line, a vertical one at each monolith (16 m on the east face, 4 m on the walk walls) | `brinewire/terrain.js` `liftSpan` |
| Shape | Every coping, sill and lintel laid in precast units 1.2–1.8 m long (seeded), each up to 5 mm lower than the old top, never higher | `brinewire/terrain.js` `copingUnits` |
| Shape | The water's line as two ragged sheets in the old band's skin: the wet band's top wanders a hand up and down, the salt line over it thickens where the spray lands | `brinewire/terrain.js` `waterline`, `tideStrip` |
| Shape | Hosts and plant through Kettle's built kit (`builtKit = true`): chamfered boxes, bevelled cylinders, uvs in metres | `brinewire.js` |
| Texture | One texel density: every material's repeat is 1 / its tile in metres (concrete 3 m, plated steel 1.5 m); eight photographed packs at T4, each tinted to its material's colour | `brinewire.js` `initMaterials`, `initPacks` |
| Texture | Board marks laid level on the faces (the photograph turned a quarter) | `brinewire.js` `initPacks` |
| Texture | World variation on every big surface (tone and roughness drift; anti-tile on maps with no direction; leaching runs on the faces, walls, vaults and blockwork) | `brinewire.js` (pbr-kit `addWorldVariation`) |
| Texture | The ground's cliffs sampled from the side where they are steep, with the photo's relief and anti-tile dropped there (the old top-down uvs smeared stripes down every headland face) | `brinewire.js` `steepGround` |
| Texture | The procedural concrete (the fallback and the look below T4) loses its tile grid: two 1.5 m panels to the tile, faint joints and tie holes | `materials/brinewire-textures.js` `pourConcrete` (`panels`, `joint`, `tie`) |
| Texture | The meter room's instrument board on its own flat painted plate (`M.panel`), so the photographed sheet's ribs and rust are not the backdrop to the plate | `brinewire/stations.js`, `brinewire.js` |
| Light | The paving darkens over the last half metre before every wall that stands on a walk's side (vertex colour, extra rows at 0.15 and 0.45 m) | `brinewire/terrain.js` `buildPaving` |
| Light | Sun 1.9 → 2.25; hemisphere 1.25 → 1.0 with a cooler sky (`#c4cdd1`) over a darker bounce (`#6a6150`); environment 0.75 → 0.62. Exposure unchanged (0.9) | `brinewire/atmosphere.js`, `brinewire.js` |

Light count unchanged: Directional 1, Hemisphere 1, pooled Point 3 (`perf-worlds`).

### Numbers

`node tools/perf-worlds.mjs brinewire ligar` (T4):

| | draws | triangles | shadow-caster triangles | materials |
|---|---|---|---|---|
| before | 280 | 247k | 33k | 63 |
| after | 284 | 360k | 131k | 65 |
| budget | ≤ 566 | ≤ 900k | | |

Download added at 3D On: 3.0 MB (24 JPGs), fetched after the world is built and uploaded as each lands.

### After shots (`docs/images/realism-brinewire/after-*.jpg`)

1. Spawn: the road is a worn concrete slab, the parapets are cast concrete with contraction joints and a precast
   coping, the gate house is blockwork; the headland reads as rock instead of cobbles.
2. Gate house: blockwork in running bond with a cast lintel; a corrugated roof; board-marked parapet with its coping
   units; the paving darker at the wall's foot.
3. Cage: the east face in lifts of board-marked concrete; the north wall stained cast concrete; the steel painted and
   streaked; the headland's cut face as rock.
4. Bench lean-in: the plate, the cased instrument and the pieces are as before (their materials are untouched); the
   instrument board behind them is flat plated steel.
5. Horizon: the parapet as board-marked concrete under separate coping units; the lagoon and the pylons as before.
6. Ground at eye height: a photographed worn slab at true scale with no drawn grid; blockwork beside it.
7. East face: lift lines and monolith joints the length of the wall; the tide line wanders; the headland's cliff is
   rock, not vertical stripes.

### Left out, and why

- **The far country, the chimney works and the headland's form.** The works on the headland are plain boxes and the
  headland a smooth dome; reshaping them means new geometry far from the walk, and the hill already lost its worst fault
  (the cobble net) with the rock photo. Left for a later pass.
- **The lagoon and tailwater.** The water's procedural ripple reads acceptably at the distances it is seen from; a
  water shader is outside a texture pass.
- **The gate houses' stepped gables.** The gable ends are built in six stepped courses (`buildGateHouse`); a raked
  gable would need new geometry that meets the roof's underside exactly, and the steps read as blockwork courses.
- **Baked AO in vertex colour on the barrage.** The barrage is merged boxes with no shared vertices; the paving's
  contact shade, the lift grooves and the photographs' own AO carry it.
- **The bench's plate, dormant instrument and tray.** They are the bench's own (`bench-bay.js`, shared by every world)
  and the teaching surface; untouched.

### Asset licences

All eight packs are Poly Haven CC0; `public/textures/brinewire/LICENSE.md` lists the asset, authors, real size and the
grading done to each. The source files as they were before this pass: `archive/2026-11-27/brinewire-realism/`.
