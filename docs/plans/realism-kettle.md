# Realism pass: Kettle

Started 2026-11-27. Art only: no site, layout, collider, bay, walk or bench behaviour changes. Follows the Tallow, Bellows,
Lanternfall and Ember passes and reuses their shared loader (`src/three/materials/texture-pack.js`).

## The real place

Kettle is a single-shed ironworks of the 1920s–50s standing on the edge of a dry soda lake. The lake floor is a pale
crust of sodium carbonate, cracked into small plates and dusted buff and grey near the works. The works itself is a
long steel-framed shed: hand-laid common brick to about 3.4 m (the dado), then corrugated steel sheet up to the
eaves, a corrugated roof on riveted trusses, a crane on rails down the main aisle (the nave). The floors are trowelled
concrete that has carried a century of carts, with firebrick paving in the cast house. Outside are a slag tip and an
ore stock. Everything is sooted: the brick is darkest under the eaves, the wall feet are damp and stained, and the
sheet has rusted at its laps.

References (descriptions, not images in the repo):

1. Völklingen Ironworks (Saarland), blower and casting halls: brick dado walls with a projecting plinth course and a
   sloped brick or sheet-metal sill where the brick stops, corrugated sheet above, riveted lattice trusses, crane
   rails on brackets off the stanchions.
2. Sloss Furnaces (Birmingham, Alabama): concrete floors worn smooth and dark along the cart routes, black at the
   wall feet and round every column base, rust run down the brick from every fixing.
3. Dry lake beds of the Mojave and Etosha: pale crust broken into hand-sized plates, buff where dust lies, never pure
   white, never a regular net.
4. Slag tips at Ebbw Vale and Consett: grey-black clinker in loose angular pieces, finer on the slopes, with paler
   dust in the hollows.
5. Light inside a works with no sun: lamps in pools, the floor between them almost black; outside, a hazy amber
   afternoon with a strong bounce off the pale crust.

## What looks fake (before shots: `docs/images/realism-kettle/before-*.jpg`)

Shots taken at 3D On in the app's browser pane (the frame came out at 800 × 500). The camera was set with
`stage.enterKettleScene` and `camera.lookAt`. HUD hidden by a style rule.

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn | (0, 1.7, 76) | (0, 4, 40) |
| 2 | nave from the charge door | (0, 1.7, 30) | (0, 4, -10) |
| 3 | stores host from its approach | (19, 1.7, 38) | (19, 1.6, 29) |
| 4 | pickling host from its approach | (21.5, 1.7, 15) | (31, 1.4, 15) |
| 5 | bench lean-in (stores) | (19, 1.75, 33.1) | (19, 0.9, 31.2) |
| 6 | far horizon past the slag tip | (-24, 1.7, 70) | (-190, 12, 150) |
| 7 | ground at eye height | (4, 1.7, 72) | (4.6, 0, 68.6) |

1. **Spawn.** The brick reads as red diamond quilting: the procedural brick tile's soot gradient runs top-to-bottom of
   every 2 m tile, so the wall is striped in bands (texture, low-frequency procedural). The walls are bare boxes,
   with no plinth, no sill where brick meets sheet, no corner trim and no eaves (shape). The crust is a regular net of
   1.3 m hexagonal pavers with dimples (texture, scale). The slag road is black leopard spots (texture). The buffer
   stop at the track's end reads as a signboard (shape). Nothing darkens where the wall meets the ground (light).
2. **Nave.** The floor's crack network is the same big polygons as the crust, plus a joint grid (texture). The brick
   repeats its soot band every 2 m up the wall (texture). The wall meets the floor in a hard clean line (light: no
   contact). Railings are square bars (shape).
3. **Stores.** Crates and shelves are knife-edged boxes with a stretched panel texture (shape, 0..1 uvs). The roof
   is a woven-basket sheet. The floor has the paver net again.
4. **Pickling bay.** The tanks are four flat boxes with no rim, lip or flange. The ribbed sheet on the stanchion casing
   reads as straw (texture stretched on 0..1 uvs). Dark and even.
5. **Bench lean-in.** The plate is legible. The cased instrument is a bare box (outside this pass: it is the bench's
   own). Shelves behind are sharp-edged boxes.
6. **Horizon.** The slag tip shows the crust's crack net in grey: crazy paving on a heap (texture). The mesas are
   smooth domes with soft terraces (shape).
7. **Ground close-up.** The paver net with dimples and dark grooves, 1.3 m plates: a tiled floor, not a crust.

## CC0 textures (option A, owner's choice)

All from Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by
`tools/textures/prep_kettle.py`. `public/textures/kettle/LICENSE.md` lists each file.

| Pack | Source | Real tile | Used on |
|---|---|---|---|
| `crust` | [dry_ground_01](https://polyhaven.com/a/dry_ground_01) | 4.0 m | the yard's ground (multiplied by its vertex paint) |
| `slag` | [gravel_stones](https://polyhaven.com/a/gravel_stones) | 2.0 m | the slag roads; blended into the ground on the heaps |
| `concrete` | [concrete_floor_worn_001](https://polyhaven.com/a/concrete_floor_worn_001) | 3.0 m | every concrete floor, slab, plinth and concrete wall |
| `brick` | [red_brick_03](https://polyhaven.com/a/red_brick_03) | 1.0 m | brick walls; tinted for firebrick walls and the cast house's paving |
| `sheet` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | 2.7 m | wall cladding and roofs |
| `metal` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | 2.0 m | structural steel, plate, tanks, crates (tinted per material) |

Target: under 3 MB at 3D On (T4) only. Rejected after looking: `ground_grey` (reads as mottled concrete, not clinker),
`mud_cracked_dry_riverbed_002` (plates too coarse and brown for a soda crust).

## Decisions taken without asking

- **The bench plate and its rims keep their procedural cast iron** (`M.castIron`, `M.darkIron`). The photo steel goes
  on every other steel material. The plate is what the student works on, so it stays as legible as it is now.
- **Every kit surface is laid in metres.** Box, bar, slab and cylinder uvs become metres (1 uv = 1 m), and each
  material's repeat becomes 1 / (its tile in metres). That way one material has one texel density on every object.
  Before this, floors were laid at 4 m per tile, walls at 2 m, roofs at 3 m and props stretched one tile over each face.
- **Contact shadow is one baked map**, not per-fragment loops: walls, columns and every host's footprint are
  rasterised at 0.25 m over the works and blurred. The floors and the yard ground sample it in world xz. Inside the
  works there is no sun shadow, so this is the only thing that seats a machine on the floor.
- **Wall grime is vertex colour** (damp band at the foot, soot under the roof). `mergeStatic` and `consolidateStatic`
  used to drop every attribute but position/normal/uv; they get an opt-in `keep` option that Kettle alone passes.
- **Swap, not rebuild** (as the earlier passes): the world is complete with its procedural maps. At T4 with a renderer
  the packs are fetched after build and put into the slots (or uniforms) already compiled, each uploaded as it lands.

## Ordered changes and their checks

1. Shared, opt-in: `keep` on `mergeStatic` / `consolidateStatic`. Check: `npm run verify` (every world's bake).
2. Shape: kit verbs build chamfered boxes and bevelled cylinders with metric uvs; walls with a plinth course, a sill
   at the dado, corner angles and an eaves trim; tube railings; bolted column bases; proper buffer stops.
   Check: `verify:kettle` (overlap, buried, walk, rooms), `verify:bench`, perf ≤ 900k tris / 566 draws.
3. Texture: metric repeats, wall vertex grime, world variation and anti-tile on the big surfaces, ground shader with
   photographed crust, slag on the heaps and the contact map; packs dressed at T4. Check: `verify:normals`, shots.
4. Light: hemisphere less flat, sun a touch stronger, bounce darker; exposure re-checked at the bench. Light count
   unchanged. Check: after shots 1–5, `verify:kettle` lamp checks.

## Progress

- [x] Before shots (7)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-27)

### Shared, opt-in pieces

- `pbr-kit.js` `mergeStatic(group, { keep })` and `consolidateStatic(scene, { keep })`: extra attributes carried
  through the bake (a part that lacks one is filled with 1s; consolidation only merges meshes with the same set). The
  default (`keep = []`) is the old behaviour, so no other world changes.
- `kettle/kit.js` built shapes, behind `w.builtKit`: five other worlds share this kit and still get the stock boxes
  and cylinders.

### Kettle

| # | Change | Where |
|---|---|---|
| Shape | Every kit box, bar and slab chamfered (2–30 mm by size, 44 triangles); every cylinder, cone, tube and strut turned with bevelled rims; uvs in metres with a seeded offset per part | `kettle/kit.js` `chamferBoxGeometry`, `turnedGeometry` |
| Shape | Outside the works, along every wall that faces the yard: a concrete plinth course, a steel sill where the brick meets the sheet, an eaves gutter, a downpipe with brackets and a shoe every ~12 m; steel angles at the outside corners | `kettle/works.js` `buildExteriorTrim` |
| Shape | Inside the halls, a steel sill on the wall face at the dado | `kettle/works.js` `wall` |
| Shape | Railings in tube on toe plates; each stanchion on a grouted pad with a base plate and four bolts | `kettle/works.js` |
| Shape | The track's buffer stops: rail posts, raked struts, a timber headstock, two sprung buffers | `kettle/plant.js` `buildTrack` |
| Shape | Mesas: height varies with x, z as well as bearing, gullies cut down the faces, beds stepped at uneven heights with sharp risers | `kettle/terrain.js` `makeKettleField` |
| Texture | One texel density: every material's repeat is 1 / its tile in metres (brick 1.0 m, concrete 3.0 m, sheet 2.7 m, steel 2.0 m, crust 4.0 m, slag 2.0 m with the photos; the procedural fallbacks at matching real sizes) | `kettle.js` `initMaterials`, `initPacks` |
| Texture | Six CC0 packs dressed at T4, each building material tinted back to its old paint; the bench plate and rims keep their procedural iron | `kettle.js` `initPacks` |
| Texture | World variation and anti-tile on walls, floors, roofs and steel; run streaks on the walls | `kettle.js` (pbr-kit `addWorldVariation`) |
| Texture | Wall grime in vertex colour: damp band at the foot (measured from the floor on each face's own side), soot under the roof | `kettle/grime.js` `wallGeometry` |
| Texture | The roads in world metres (`addWorldBoxUV`), so the 5 m road and the 2.6 m spur have one clinker size | `kettle.js` |
| Texture | The heaps: the crust's crack relief flattened, and clinker drawn in world metres once the slag pack lands | `kettle/terrain.js` `patchKettleGround` |
| Light | Contact shadow: one baked map at 0.25 m of every wall, column and host footprint, blurred at 0.3 m and 1.2 m, on every floor (0.85) and the yard ground (0.8) | `kettle/grime.js` `buildContactMap`, `kettle.js` `initGrime` |
| Light | Sun 2.2 → 2.4; hemisphere 1.15 → 1.0 with the bounce darker and warmer than the sky (`#957f60` under `#cfc0a0`); exposure 0.94 → 1.02 (the photographed floors and brick are darker than the procedural ones) | `kettle/atmosphere.js`, `stage.js` |

Light count unchanged: Directional 1, Hemisphere 1, pooled Point 3 (`verify:kettle`: 55 lamps and one fire share 3 real lights).

### Numbers

`node tools/perf-worlds.mjs kettle ligar` (T4):

| | draws | triangles |
|---|---|---|
| before | 233 | 113k |
| after | 235 | 244k |
| budget | ≤ 566 | ≤ 900k |

Download added at 3D On: 2.9 MB (18 JPGs). Node build of the world: about 260 → 470 ms (more geometry to bake and the
contact map); it runs in `warmWorld` during the flight.

### After shots (`docs/images/realism-kettle/after-*.jpg`)

1. Spawn: real brick in courses with a concrete plinth course, gutters and downpipes along the wall; the crust is
   hand-sized cracked plates instead of a paver net; the buffer stop is a buffer stop.
2. Nave: a worn concrete floor with no fake crack polygons; brick dado darker at its foot; tube railings up the ramp.
3. Stores: crates and shelves with broken edges and photographed steel; brick wall in courses; the floor darker under
   the racks and round the bench.
4. Pickling bay: the stanchion casings read as brick instead of straw; the floor is concrete, darker at the tanks.
5. Bench lean-in: the plate, the cased instrument and the pieces are unchanged and as legible as before; the brick
   and shelving behind read as material.
6. Horizon: the slag tip is dark clinker, not crazy paving; the mesas are broken by gullies and steps. Fog still
   softens them (see below).
7. Ground at eye height: a photographed dry crust, plates 0.1–0.4 m, with grit and small stones; no dimples.

### Left out, and why

- **Tank copings.** A steel cap on the tanks' walls put a downward face 1 m over walk cells that reach into the tank
  walls' footprint, which `verify:kettle`'s "nothing low over the walk" check reads as a ceiling. Dropped; the
  chamfered walls already break the hard edges.
- **The bench's cased instrument and plate.** They are the bench's (`bench-bay.js`, shared by every world) and the
  teaching surface; untouched.
- **The furnace, stoves and far-country buildings.** Beyond 15 m of every walk; they get the built shapes and the
  photographed steel and brick through the kit and the materials, but no new construction.
- **Contact shadow on vertical faces** (machinery feet, wall bases inside). The floor side is darkened by the contact
  map and the wall side by its damp band; host machinery has only its own AO maps.
- **Mesa detail.** The far grid is 20–60 m per cell where the mesas stand, so gullies show only as notches in the
  skyline, and the fog washes them. A denser far band (as Ember's `axisLines({ bands })`) is the next step if wanted.
- **The interior stays dark.** Inside is lamps only (the cover mask), by design. The exposure change keeps it about as
  bright as before; it is not brighter.

### Asset licences

All six packs are Poly Haven CC0; `public/textures/kettle/LICENSE.md` lists the asset, authors, real size and the
grading done to each. Retired code: `archive/2026-11-27/kettle-realism/` (the six source files as they were).
