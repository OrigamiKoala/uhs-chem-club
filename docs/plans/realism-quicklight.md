# Realism pass: Quicklight

Started 2026-11-27. Art only: no site, layout, collider, bay, walk or bench behaviour changes. Follows the Tallow,
Lanternfall, Bellows, Ember, Kettle, Mirrowen and Teeter passes, and reuses their shared loader
(`src/three/materials/texture-pack.js`) and Kettle's opt-in built kit (`kettle/kit.js`, `builtKit`).

## The real place

Quicklight is a 1970s fluid catalytic cracking refinery, about fifty years old, built on two young basalt flows under
a standing storm. The flow tops are black, glassy pāhoehoe with ropy swells and fissures, rusty where steam has
altered them, with grey ash drifted into the hollows. Where the upper flow's front was cut for the ramp it shows its
section: a rubbly clinker base, a dense jointed grey core, a red-brown vesicular crust. The plant itself stands on
concrete: broom-finished hardstanding with sawn joints, drain gullies along the alleys, oil soaked in under the pipe
racks. The buildings are cast concrete (board- and panel-formed), blast-resistant and windowless. The steel is painted
long ago and weathered; the hot columns and big lines wear aluminium jacketing over insulation; pumps are red.
Climate: wet, windy, dark cloud overhead, a low warm sun from the west-north-west under the cloud's edge.

References (descriptions, not images in the repo):

1. Svartsengi geothermal plant (Reykjanes, Iceland): steel plant and insulated pipelines standing straight on black
   lava, gravel pads round each building, the lava rough and dark right up to the concrete.
2. A 1970s Gulf Coast cat-cracker: aluminium-jacketed columns with lap bands every metre or so, fireproofed concrete
   skirts, galvanised grating platforms, pipe racks of steel bents with pipes on shoes and blind flanges at the ends.
3. Mauna Ulu flows (Kīlauea, 1969–74): ropy glassy black pāhoehoe, fissured plates, rusty oxidised patches; ʻaʻā
   fronts with a clinker base.
4. Refinery hardstanding: concrete slabs with sawn joints every 6 m, dark joints, darker along the foot of every wall
   and kerb, oil stains under the racks and pumps.
5. Blast-resistant control buildings: cast concrete with panel joints and tie holes at 0.6 m, rust runs under
   fixings, damp at the foot.
6. Storm light: a warm low sun under a dark cloud deck, the sun side bright, the shadow side dark and cool, the lava
   nearly black in shade.

## What looks fake (before shots: `docs/images/realism-quicklight/before-*.jpg`)

Shots taken at 3D On in the app's browser pane (canvas 1536 × 1152 at DPR 1.5), as a guest. The camera was set
through `stage.enterQuicklightScene`, the world updated and the canvas read back after an explicit render.

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn, east down the first alley | (-63, 1.7, -68.5) | (-40, 1.4, -68.5) |
| 2 | control block (q2) from its alley | (-8, 1.7, -46.5) | (8, 1.4, -46.5) |
| 3 | cracking reactor's skirt (q4) from c1 | (-25, 6.7, 44) | (-25, 7.5, 28) |
| 4 | bench lean-in (q1, analyser bunker) | 1.9 m out from the plate, 0.85 m over it | the plate |
| 5 | far horizon from the reactor plot | (60, 6.7, 50) | (300, 14, 10) |
| 6 | ground at eye height (by the spawn) | (-50, 1.7, -68.5) | (-49.4, 0, -71.5) |

1. **Spawn.** The paving is a grid of 0.6 m tiles with a tie-hole dimple in each (`pourConcrete` shuttering panels,
   laid on the floor at a 3 m tile): a tiled bathroom, not hardstanding (texture). The racks' pipes end in flat white
   discs (shape: no flanges or caps) and the insulated lines show a stretched panel map (texture). The pipes float on
   the beams (shape: no shoes). Unit plinths are knife-edged boxes (shape). The ground under the rack reads as
   crazy paving (texture).
2. **Control block.** Every wall is the same 0.6 m panel grid with a dimple per panel, top to bottom, including the
   lintel and the floor (texture, one tile repeating). Hard 90° edges on every jamb (shape). The wall meets the
   paving in a clean line with no damp and no darkening (light, grime).
3. **Reactor skirt.** As 2, wrapped round a cylinder; the panel grid makes the skirt read as tiled. The door jambs
   are sharp boxes (shape). The paving is the same tile floor (texture).
4. **Bench lean-in.** The plate and the cased instrument read clearly. The room behind is dark and the arch's
   corrugation reads as plain panels (texture). The plate is the bench's own and stays as it is.
5. **Horizon.** The lava is black crazy paving with pale cracks in a regular 0.8 m net (`stormBasalt`, worley plates,
   texture). The shield volcano is a smooth cone (shape). Red pump bodies wear a brick-like stretched panel map
   (texture: stock 0..1 uvs). The skids and drums are knife-edged (shape).
6. **Ground close-up.** The tile floor again, with dark grout lines and a dimple in each tile; the kerb blocks repeat
   the same tile per block; the handrail posts are square bars (shape).

Across all shots: the hemisphere fill is high and even (1.3, sky blue-grey over a brown bounce), so shade has no
depth; there is no contact darkening anywhere objects meet the ground (light).

## CC0 textures (option A, the owner's choice)

All from Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by
`tools/textures/prep_quicklight.py`. `public/textures/quicklight/LICENSE.md` lists each file, its authors and grading.

| Pack | Source | Real tile | Used on |
|---|---|---|---|
| `lava` | [rock_3](https://polyhaven.com/a/rock_3) | 1.5 m | the lava ground mesh (× its vertex paint): flow tops, the front's section, the far land |
| `gravel` | [gravel_stones](https://polyhaven.com/a/gravel_stones) | 2.0 m | the yard inside the fence (crushed basalt between the units), the flare yard |
| `slab` | [brushed_concrete_2](https://polyhaven.com/a/brushed_concrete_2) | 2.5 m | the paving (hardstanding, ramps, courts) and the rooms' floor slabs |
| `wall` | [concrete_wall_006](https://polyhaven.com/a/concrete_wall_006) | 2.0 m | walls, retaining faces, copings and kerbs, the skirts, plinths |
| `steel` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | 2.0 m | structural steel, dark steel, rusted steel, handrails |
| `paint` | [green_metal_rust](https://polyhaven.com/a/green_metal_rust) | 1.0 m | painted plate graded to neutral and tinted: the red pumps and heater, the aluminium jacketing |
| `sheet` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | 2.7 m | the analyser bunker's arch, roofs |

Total 3.3 MB (21 files) at 3D On (T4) only: lava 0.69, gravel 0.80, slab 0.41, wall 0.59, steel 0.33, paint 0.24,
sheet 0.32 MB. Looked at and not used: `dark_rock` (tried first: stratified rock with white calcite veins, which read
as marble in a grid; replaced by `rock_3`), `moon_meteor_01` (too pale and even for a flow top), `concrete_panels`
(an 8 m tile of formwork: too coarse up close), `concrete_floor_02` (brown cast, reads as indoor), `container_side`
(ribbed: a container, not jacketing).

## Decisions taken without asking

- **Built shapes where the player walks; plain metric shapes beyond.** The world starts at 662k triangles (budget 900k)
  and Kettle's built kit doubles the process units (258k → 545k). So the kit gets two more opt-in values:
  `builtKit = 'metric'` (uvs in metres, no chamfer or bevel, the stock triangle count) and `'edges'` (boxes chamfered,
  cylinders plain metric). Quicklight uses the full built kit for the hosts, the racks' steel, the walk lamps, the
  bund, the heater and the flare; `'edges'` for the low units a player passes at hand height (skids, pots, valve
  stations, pumps, drums, exchangers) within 6 m of a walk; `'metric'` for every other unit and for the racks' pipes
  (their ends are flanged, so a bevel there is unseen). Kettle, Teeter and Brinewire (which pass `true`) are unchanged.
- **The ground is two meshes over one grid.** Inside the plant's fence the ground is the yard's crushed basalt (the
  `gravel` pack), outside it the flow's own rock (`lava`). The fence is the boundary, so the change of surface is
  where a real one would be. `terrainMesh` stays the lava mesh (the voyage and the checks read it).
- **The far land is eroded in the drawn mesh only** (`terrain.js` `farRelief`): ridges, gullies down the fall line and
  the risers of old flow fronts, faded to nothing inside 260 m. The height the game and the checks read is the plan's.
- **The haze opens** in code (`fogNear` × 1.4, `fogFar` × 1.6), not in `world-data/quicklight.json`, which is generated
  and checked against the plan.
- **The bench keeps its look.** Its parts are stock boxes from `bench-bay.js`, so it gets its own materials at the old
  repeat (`M.benchDark`, `M.benchTray`); the cased instrument and the plate are untouched.
- **The refinery's concrete is chamfered and laid in world metres** (`terrain.js` `block`): the joints and tie holes
  of the photographed wall run on from block to block instead of restarting at each.
- **Handrails and fence rails become round tubes** (open 8-sided tubes, the same order of triangles as the square bars).
- **The wall grime is Quicklight's own patch** (`quicklight/grime.js`), on Teeter's method (a `ttFoot` attribute read by
  a shader patch on cloned materials): a damp band at each wall's foot, measured from the floor in front of it, on
  vertical faces only (Teeter's also darkens tops, which on a kerb read wrong), no salt line. Streaks from
  `addWorldVariation`.
- **Contact shading on the paving is vertex paint**: extra rows of paving vertices at 0.15, 0.45 and 1.0 m from every
  closed side (an opening onto another walk is not a side) darken toward the wall, as Teeter's `footShade` does.
- **Sawn joints are drawn in world space** on the paving (a thin dark line every 6 m across each walk and along the
  gully), instead of the old 1 m-wide vertex-colour bands.
- **Anti-tile off for directional maps** (corrugated sheet, the wall's panel joints), as Mirrowen and Teeter found.

## Ordered changes and their checks

1. Plan, before shots, packs (this file). Check: licences, sizes.
2. Shape: built kit near the walk, metric beyond; chamfered refinery concrete in world metres; round handrails;
   pipe shoes and end flanges on the racks; the shield volcano eroded. Check: `verify:quicklight` (overlap, buried,
   walk, rooms), `verify:bench`, perf ≤ 900k tris / 566 draws.
3. Texture: metric repeats; six packs dressed at T4; world variation; foot grime; sawn joints. Check:
   `verify:normals`, after shots.
4. Light: sun up, hemisphere down with a darker bounce, environment a little lower; contact shading on the paving;
   exposure re-checked at the bench. Light count unchanged. Check: after shots 1–6, `verify:quicklight` lamp checks.

## Progress

- [x] Before shots (6)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-27)

### Shared, opt-in pieces

- `kettle/kit.js` `kitFor`: `builtKit: 'metric'` and `'edges'` (above). `true` and unset build exactly what they did.
- `materials/texture-pack.js`: unchanged; used as Kettle and Teeter use it.

### Quicklight

| # | Change | Where |
|---|---|---|
| Shape | The kit's boxes chamfered and cylinders bevelled on the hosts, racks, lamps, bund, heater and flare; units by the walk chamfered; every kit part laid in metres | `quicklight.js` (`builtKit`), `quicklight/plant.js` `buildUnits`, `buildRacks` |
| Shape | Every refinery body (walls, kerbs, copings, slabs, skirts, plinths) a chamfered box laid in world metres, so panel joints and tie holes run on; the skirt's chords laid round the ring by arc length | `quicklight/terrain.js` `block`, `worldUV` |
| Shape | Handrails, knee rails, fence top rails and every post round tubes; the reactor's transfer line and the train's overheads round insulated lines, not square bars | `quicklight/terrain.js` `tube`, `bar`, `postTube`, `duct` |
| Shape | Each rack pipe ends in a blind flange (bare) or a jacket end cap (insulated), proud of the pipe's end | `quicklight/plant.js` `buildRacks` |
| Shape | The shield volcano a broad dome with flow lobes, gullies and a notched summit crater; the far land eroded (ridges, gullies, flow risers) | `quicklight/plant.js` `shieldGeometry`, `quicklight/terrain.js` `farRelief` |
| Texture | One texel density: every material's repeat is 1 / its tile in metres (concrete 2.0 m, hardstanding 2.5 m, steel 2.0 m, paint 1.0 m, sheet 2.7 m, lava 1.5 m, gravel 2.0 m with the photos) | `quicklight.js` `initMaterials`, `initPacks` |
| Texture | Seven CC0 packs dressed at T4; the bench keeps its own steel and tray at the old repeat (`M.benchDark`, `M.benchTray`) | `quicklight.js` `initPacks`, `quicklight/stations.js` |
| Texture | The floors broom-finished hardstanding (procedural `hardstanding` below 3D On), not shuttered panels with tie holes | `materials/quicklight-textures.js`, `quicklight.js` |
| Texture | The yard inside the fence and the flare yard crushed basalt; outside, the flow's pitted rock | `quicklight/terrain.js` `buildGroundGeometry`, `buildPaving` |
| Texture | World variation and anti-tile on every big surface; streaks down the concrete walls and the jacketing | `quicklight.js` (pbr-kit `addWorldVariation`) |
| Texture | Damp band at every concrete wall's foot from its own floor; sawn joints every 6 m in the paving | `quicklight/grime.js` |
| Light | Paving darkened over the last metre before every wall and kerb | `quicklight/terrain.js` `buildPaving` (`contact`) |
| Light | Sun 1.9 → 2.35; hemisphere 1.3 → 1.0 with a dark neutral bounce (`#3d3c3b` under `#8b9cb3`); environment 0.7 → 0.6; haze opened | `quicklight/atmosphere.js`, `quicklight.js` |

Light count unchanged: Directional 1, Hemisphere 1, pooled Point 3. Exposure unchanged (1.12): the bench lean-in
(after shot 4) is as bright and as legible as before.

### Numbers

`node tools/perf-worlds.mjs quicklight ligar` (T4):

| | draws | triangles | shadow-caster triangles |
|---|---|---|---|
| before | 268 | 662k | 312k |
| after | 277 | 844k | 454k |
| budget | ≤ 566 | ≤ 900k | |

Node build time is within the run-to-run noise of this machine (about 2–4 s either way, measured against `HEAD` in a
scratch copy); it runs in `warmWorld` during the flight. Download added at 3D On: 3.3 MB (21 JPGs), fetched after the
world is built and uploaded as each lands.

### After shots (`docs/images/realism-quicklight/after-*.jpg`)

1. Spawn: broom-finished hardstanding with sawn joints and the alley's longitudinal joint, darker at the kerbs; round
   tube handrails; flanged pipe ends; the yard beside the alley crushed stone; cast concrete plinths with broken edges.
2. Control block: cast concrete with panel joints and tie holes running across the wall, cool grey, chamfered jambs,
   the paving joined to the wall by a darker strip.
3. Reactor skirt: the skirt in cast panels laid round the ring, a chamfered portal, crushed stone between the skirt
   and the paving.
4. Bench lean-in: the plate, the cased instrument and the pieces are unchanged and as legible as before.
5. Horizon: chamfered red pumps in scratched paint, jacketing and steel photographed, the yard crushed stone; the
   far land is gullied and ridged instead of smooth cones.
6. Ground at eye height: hardstanding at true scale with a sawn joint and pitting; a chamfered kerb with a damp foot;
   round handrail tubes; crushed stone past the kerb.
7. (extra) The far country from out on the lava: the shield a broad dome, the land before it cut by gullies.

### Left out, and why

- **Pipe shoes on the racks.** The pipes sit directly on the beams' top flanges, so a shoe would stand inside both;
  raising the pipes would move every line over the walk. The end flanges carry the detail instead.
- **Bevels on the far units and on the racks' pipes.** Triangle budget (see Decisions); their broken edges are metres
  away or overhead.
- **The ramp's grooves.** They were a 1 m vertex-colour stripe; drawing them crisply needs the ramp's direction in the
  shader. The broom finish carries the ramp's surface.
- **Contact shading under the units.** The units stand on plinths in the yard's gravel and receive the sun's shadow;
  the ground grid there is 2 m, too coarse for a contact blob to read.
- **The bench's cased instrument and plate.** They are the bench's (`bench-bay.js`, shared by every world) and the
  teaching surface; untouched.
- **The rooms' interiors** stay lamp-lit and dark, by design (the cover mask). They get the new concrete and floors.

### Asset licences

All seven packs are Poly Haven CC0; `public/textures/quicklight/LICENSE.md` lists the asset, authors, real size and
the grading done to each. Retired code: `archive/2026-11-27/quicklight-realism/` (the source files as they were).
