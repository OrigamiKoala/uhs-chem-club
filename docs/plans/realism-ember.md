# Realism pass: Ember Reach

Started 2026-11-27. Art only: no site, layout, collider, bay, walk or bench behaviour changes. Follows the Tallow pass
(`docs/plans/realism-tallow.md`) and reuses its shared loader (`src/three/materials/texture-pack.js`).

## The real place

Ember Reach is the inner wall of a young basaltic caldera, stepped by a haul road cut in four switchbacks down to a
working lava lake. The rock is layered basalt: dark flows a few metres thick, each with a rubbly red-brown top, with
thin ochre tuff partings between them. The road is crushed scoria (red and black cinder) rolled hard. The geothermal
plant cut into the wall is around thirty years old: board-formed concrete retaining walls, rock-cut galleries lined
with steel ribs, a refractory brick vault, a corrugated steel turbine hall, painted steel safety rail along every drop.
Hot, dry, sulphurous air: steel rusts at its joints and fixings, concrete is stained dark at its foot and streaked under
its top edge, sulphur yellows the ground round every vent.

References (descriptions, not images in the repo):

1. Kīlauea's Halemaʻumaʻu rim (Hawaiʻi): layered basalt in section, each flow a dark massive band with a reddish
   clinker top; talus cones at the foot of every cliff; the crater floor black and ropy.
2. Krafla and Nesjavellir geothermal stations (Iceland): corrugated steel halls on concrete plinths, insulated steam
   mains on steel saddles, safety rail in faded yellow paint on round tube posts with base plates.
3. Mine haul roads in red scoria (Canary Islands, Lanzarote): crushed cinder, red-brown to black, rolled smooth in
   the wheel tracks, loose and coarser at the shoulders and against the cut face.
4. 1990s board-formed retaining walls: horizontal lift lines every 0.6–1 m, chamfered arrises, weep holes, a dark damp
   band at the foot and rust streaks under any fixing.
5. Volcanic haze light: a warm, low sun on one side; the sky a dirty amber, darker overhead; bounce from the dark ground
   weak and warm; a red underglow from the lake on the north side.

## What looks fake (before shots: `docs/images/realism-ember/before-*.jpg`)

Viewpoints (camera → look-at), used again for the after shots. Shots taken at 1280×800, 3D On.

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn (rim yard) | (26, 25.6, 66) | (-6, 24.8, 60) |
| 2 | gallery 1 (ribs) from road 1 | (8, 19.7, 37) | (-5, 20.8, 44) |
| 3 | turbine hall from road 4 | (47, 1.7, -39) | (36, 4, -27) |
| 4 | bench lean-in (gallery 4) | (5.5, 13.8, 24.2) | (5.5, 13.5, 28) |
| 5 | horizon over the lava lake to the cone | (-2, 1.7, -66) | (30, 6, -220) |
| 6 | ground at eye height (road 2) | (30, 13.7, 15) | (30.6, 12, 11.5) |

1. **Spawn.** The ground reads as giant hexagonal pavers with dimples: the `sinterCrust` map is laid at 12.5 m per
   tile, so its crack plates are 2–3 m across and its spray beads are fist-sized (texture, scale). The retaining wall
   is one flat box with knife edges (shape). The caldera wall behind is a smooth sheet of the same pavers stretched
   down the slope (texture: planar uvs on a cliff). The light is even everywhere (light).
2. **Gallery 1.** The gallery is a black box with a tin lid sitting on the road: square rock walls, no relief, no
   footing, no shadow line (shape, light). The road kerb and the retaining wall are plain boxes (shape).
3. **Turbine hall.** The hall's `platedMetal` reads as wood-grain tiles: one panel tile is stretched across each box
   face's 0..1 uvs (texture). Bare box with no flashings or base (shape). The road runs into the wall with no contact
   darkening (light).
4. **Bench lean-in.** The bench reads clearly. The gallery behind is pitch black and featureless (light); the floor is
   blurred dimples (texture).
5. **Horizon.** The cone is a smooth cone at the terrain's coarse far grid (30 m cells), no flows or gullies (shape);
   the caldera walls are smooth fog-coloured sheets (shape, texture). The rail is square bar (shape).
6. **Ground close-up.** Pavers again, a 3 m plate with fist-sized dimples; no grain at the player's feet, no gravel,
   no wheel track (texture, scale).

## CC0 textures (option A, owner's choice)

All Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by
`tools/textures/prep_ember.py`; `public/textures/ember/LICENSE.md` records each file.

| Pack | Source | Real tile | Used on |
|---|---|---|---|
| `cinder` | [rocky_gravel](https://polyhaven.com/a/rocky_gravel) | 1.81 m | ground (flat and gentle slopes), triplanar |
| `basalt` | [dark_rock](https://polyhaven.com/a/dark_rock) | 2.42 m | ground (steep and cliffs), rock-cut gallery walls, piers, soffits |
| `concrete` | [concrete_layers_02](https://polyhaven.com/a/concrete_layers_02) | 2.0 m | retaining walls, kerbs, slabs, concrete galleries |
| `brick` | [factory_brick](https://polyhaven.com/a/factory_brick) | 1.5 m | gallery 3's refractory vault and piers |
| `sheet` | [corrugated_iron_02](https://polyhaven.com/a/corrugated_iron_02) | 2.7 m | turbine hall walls and roof, gallery roof sheet |

Target download ≤ 3 MB, T4 only; sizes recorded below once graded.

## Decisions taken without asking

- **Ground is world-projected, not uv-mapped.** The terrain's uvs are planar (x, z), so any photo would smear down the
  cliffs. The ground shader samples the cinder pack from above and the basalt pack triplanar, blended by slope, in
  world metres, with a second rotated sample against tiling and a coarse sample far away. The vertex paint (strata,
  sulphur, scoria near the lake) still sets the colour, so the photo albedos are graded to neutral.
- **Swap, not rebuild.** As in Tallow: the world is complete with its procedural maps; packs are fetched after build at
  T4 with a renderer and swapped into slots (or uniforms) that are already compiled, each uploaded at once with
  `renderer.initTexture` during the flight. Below T4 and in Node nothing is fetched.
- **Shells get their own materials.** `M.concrete`, `M.rock`, `M.brick` are shared with plant props and hosts; the room
  shells, retaining walls and kerbs get clones with world box uvs, so the hosts are untouched.
- **Shape stays inside the old boxes.** Shells are `phys: 'ground'` (exempt from the overlap check) but they bound the
  walk and the bench bays, so every reshaped shell part stays within its old bounding box: rock walls are displaced
  inward only, concrete is chamfered, rails become round tube of the same reach.
- **No physical debris skirts on the walk.** The road is reachable ground; a skirt there would be an un-collided body.
  Ground contact is done in the ground shader instead (dark band and coarser grit at every wall foot).

## Ordered changes and their checks

1. Prep script and packs (`tools/textures/prep_ember.py`, `public/textures/ember/`). Check: sizes, licence file.
2. Ground shader: world-space cinder/basalt, anti-tile, far sample, contact darkening at every wall and landmark foot.
   Check: `verify:ember` (headless build), after shots 1, 5, 6.
3. Shell textures: world box uvs and packs on rock, concrete, brick, sheet. Check: after shots 2, 3.
4. Shell shape: chamfered concrete, inward-displaced rock walls, round-tube rails with base plates, hall base and
   corner flashing. Check: `verify:ember` (overlap, low bodies, flood), `verify:bench` (bay envelopes).
5. Far country: denser far terrain grid, the cone's lava ridges and gullies, strata benches on the outer wall, rough
   spires in place of seven-sided cylinders. Check: perf (≤ 900k tris, ≤ 566 draws), after shot 5.
6. Light: less flat hemisphere, weaker and warmer bounce, environment and exposure retuned; bench lean-in re-checked.
   Check: light count unchanged, after shot 4.

## Progress

- [x] Before shots (6)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Ground shader
- [x] Shell textures
- [x] Shell shape
- [x] Far country
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-27)

| # | Change | Where |
|---|---|---|
| Texture | Five CC0 packs (table above; `basalt` is `rock_face_04`, `dark_rock` was tried first and dropped: its pale joint dust reads as marble veins) | `public/textures/ember/`, `tools/textures/prep_ember.py` |
| Texture | Ground in world metres: cinder from above on level ground, basalt triplanar on steep ground, slope blend frayed by noise, rotated anti-tile sample, a coarse far sample; each photo divided by its mean so the strata/sulphur/scoria paint still sets the colour; the cinder keeps 60% of its own colour | `ember/ground.js` `patchEmberGround`, `ember.js` `initPacks` |
| Light | Contact darkening on the ground at every gallery front (7 boxes), every retaining-wall line (15 boxes, collinear segments joined) and every landmark foot (34 circles); in the procedural fallback too | `ember/ground.js` `setEmberContacts`, `ember.js` `initContacts` |
| Texture | Shells on their own materials with world box uvs and world variation (tone drift, anti-tile, run streaks): concrete (board-formed photo), rock (basalt photo), brick (photo; procedural relief in brick red until it lands), turbine hall sheet and roofs (corrugated photo, paint moved into `color`), floors (procedural slab at real scale: the board lifts read as planks underfoot), sinter, steel | `ember.js` `initMaterials` (`M.shell*`), `ember/terrain.js` `SHELL_MAT` |
| Shape | Galleries cut into the cliff: the land is banked round each gallery's sides and back to just over its roof and the ground runs on over the roof; the roof no longer sticks out over the facade; only the doorway's front stays open (all but the free-standing turbine hall) | `caldera-plan.js` `bankGalleries`, `buriedRooms`; `ember/terrain.js` |
| Shape | Rock walls, piers and soffits hewn: subdivided boxes pushed inward by seeded noise, tapered at the edges | `ember/terrain.js` `addRockBox` |
| Shape | Concrete and brick arrises rounded (3.5 cm / 2 cm) within their own bounds | `ember/terrain.js` `ROUND`, `boxGeo` |
| Shape | Safety rail as 52/42 mm tube on 60 mm tube posts with base plates on the toe kerb (was square bar on square posts through the kerb) | `ember/terrain.js` `addTube` |
| Shape | Turbine hall sheet stands on a 0.6 m concrete upstand | `ember/terrain.js` |
| Shape | Far grid growth 1.24 -> 1.13 and a 6 m band over the cone (34k -> 58k ground triangles), so the caldera walls carry their ledges; the cone's gullies have no atan2 seam, flow lobes and levees run down its flanks, rills score its top, old flow fronts step its profile | `ember/terrain.js` `axisLines`, `caldera-plan.js` |
| Shape | Far basalt spires as eroded, ledged columns (28 × 24 segments, noise in angle and height) instead of seven-sided prisms | `ember/terrain.js` `addSpire` |
| Light | Sun 2.15 -> 2.5; hemisphere 1.1 -> 0.82 with the bounce darkened to the cinder's (#77624e -> #4e3f33); environment floor darker; environment 0.8 -> 0.68; exposure unchanged (0.98), bench lean-in re-checked | `ember/atmosphere.js`, `ember.js` |

Light count unchanged (Directional 2, Hemisphere 1, pooled Point 3).

### Numbers

`node tools/perf-worlds.mjs ember ligar` (T4, consolidated):

| | draws | triangles |
|---|---|---|
| before | 370 | 141k |
| after | 371 | 231k |
| budget | ≤ 566 | ≤ 900k |

Download added at 3D On: 2.7 MB (15 JPGs), T4 only.

### After shots (`docs/images/realism-ember/after-*.jpg`)

1. Spawn: rolled red-black cinder instead of giant dimpled pavers; the retaining wall is board-formed concrete with
   lift lines and a rounded arris; the caldera walls carry ledges.
2. Gallery 1: the gallery sits in the slope with the ground run over its roof and no lid-like eave; its face is hewn
   basalt instead of a flat dark box.
3. Turbine hall: corrugated sheet with run streaks on a concrete upstand instead of stretched wood-grain tiles; the
   road is gravel up to its foot.
4. Bench lean-in: the gallery's back wall is hewn rock under the lamp instead of black; the bench and its pieces read
   as before.
5. Horizon: round tube rail; the cone's crest is broken by gullies and flows; the east wall shows rock.
6. Ground at eye height: crushed scoria at real scale (stones 1–3 cm, fines between), no visible repeat.

### Left out, and why

- **Lamp posts, pipe runs, habitats, wellheads and other plant props.** They are shared-builder props in
  `ember/plant.js` that verify's overlap and housing checks read part by part; the gain over their existing detail was
  smaller than the ground and shells, and the risk to those checks larger.
- **Host machinery and bench cabinets.** Teaching furniture; left exactly as it was so lean-in legibility is unchanged.
- **The lava lake.** Its crazed crust and glow already read as a lake from the rail; a photo of lava would bring new
  emissive texture into a check (`only lamps and the lava lake are lit`) for little gain.
- **Physical debris skirts at wall feet on the road.** The road is reachable ground; a skirt there would be an
  un-collided body. The ground shader's contact band does the job instead.
- **Distant walls are still soft.** Fog and the rock photo's mip levels flatten them past ~150 m; a third, much
  coarser sample or baked far albedo would help and is the next step if wanted.

### Asset licences

All five packs are Poly Haven CC0; `public/textures/ember/LICENSE.md` lists the asset, authors, real size and the
grading done to each. Retired code: `archive/2026-11-27/ember-realism/`.

### Screenshot method

The world was opened as a guest with `stage.enterEmberScene(null, pos, look)`, the HUD hidden by a style rule and the
guide arrow moved to an unrendered layer, the camera set to each viewpoint and the walk controls' euler synced to it.
Other sessions were editing other worlds at the same time, and Vite's full reloads kept resetting the page, so the
shots were taken on a dev server with HMR off (`.claude/vite.nohmr.mjs`, launch entry `avalon-nohmr`, port 3013).
