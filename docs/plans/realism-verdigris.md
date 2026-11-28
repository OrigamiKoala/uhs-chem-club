# Realism pass: Verdigris

Started 2026-11-27. Art only: no site, layout, collider, bay, walk or bench behaviour changes. Follows the Tallow,
Lanternfall, Bellows, Ember, Kettle, Mirrowen and Teeter passes, and reuses their shared loader
(`src/three/materials/texture-pack.js`) and Kettle's opt-in built kit (`kettle/kit.js`, `builtKit`).

## The real place

Verdigris is a small masonry fort of the 17th or 18th century built on a low clay island in a reed swamp, in a cool,
humid, overcast climate. Its drains failed long ago: the ward is flooded, the moat and the swamp are one sheet of
still, peat-dark water about half a metre deep over silt. The curtain, towers, gatehouse and keep are grey sandstone
ashlar in regular courses, with dressed copings, string courses and battered plinths at the water. The roofs are
copper sheet gone to verdigris. Everything at the water carries a band: dark wet stone and green algae from the water
up a hand or two, a pale old high-water line above it. The way in is a later boardwalk of weathered oak planks on
timber piles, with plain post-and-rail handrails, the piles black and slimy where they enter the water.

References (descriptions, not images in the repo):

1. Venetian lagoon forts (Forte di Sant'Andrea, the Lazzaretto walls): pale ashlar standing straight out of still
   water, a black-green algae band at the waterline, a paler salt and lime mark above it, the stone darker below.
2. Forts of the Dutch water lines (Stelling van Amsterdam): a fort island in flat wet country, reed beds to the
   horizon, copings in long dressed stones, the walls stained down from every joint of the coping.
3. Old copper roofs and spires (Scandinavian churches, Ottawa's Parliament): pale blue-green verdigris, darker along
   the standing seams and the eaves, brown copper showing where the patina has worn.
4. Wetland reserve boardwalks: grey weathered oak or larch boards across the line of travel, square posts with cut
   tops, two rails, round piles dark and wet below the deck.
5. Phragmites reed swamps: dense straw and green stands with soft ragged tops, open dark water between them.

## What looks fake (before shots: `docs/images/realism-verdigris/before-*.jpg`)

Shots taken at 3D On (T4) in the app's browser pane (canvas 1536 × 1152). The world was entered with
`stage.enterVerdigrisScene()`; for each shot the camera was placed and turned with `camera.lookAt`, the world updated
once and the scene rendered straight to the canvas (no HUD), then read back.

| # | View | Camera | Look at |
|---|---|---|---|
| 0 | overview (extra) | (110, 48, 60) | (0, 0, 0) |
| 1 | spawn, toward the gatehouse | (63, 1.6, 42) | (25, 5, 28) |
| 2 | tower chamber host (q2) from its door | (33, 3.6, 20) | (43.6, 4, 20) |
| 3 | dosing hall host (q6) from its door | (6, 6.0, -28) | (16.6, 6, -28) |
| 4 | bench lean-in (q1) | 1.9 m out from the plate, 0.85 m over it | the plate |
| 5 | far horizon from the landing stage | (63, 1.6, 42) | (400, 6, 160) |
| 6 | the deck at eye height | (60, 1.6, 40) | (58.5, 0, 37.5) |

1. **Spawn.** The curtain and the gatehouse read as brick wallpaper: one procedural "coursed stone" tile at 2.4 m,
   small blocks of identical size, repeating in both directions, tinted green (texture, low-frequency procedural,
   scale). Every wall is a box with knife edges; the merlons are cubes (shape). Wall and water meet in a clean line
   with no algae, no damp, no high-water mark (grime, light). The water is a cartoon: blobs with pale rims, too
   green (texture). The rails and posts are bare boxes of one flat brown (shape, texture).
2. **Tower chamber.** The walls are the same brick wallpaper; the floor is the same tile again, reading as small
   paving bricks (texture, scale). The joists and girders are clean boxes (shape). Dark and flat apart from the lamp.
3. **Dosing hall.** As 2: wallpaper walls, brick-tile floor, the tank's colour the only variation.
4. **Bench lean-in.** The cased instrument and the plate are legible. The wall behind is the wallpaper again.
5. **Horizon.** The deck's boards are procedural with a visible repeat and a green algae stripe that repeats; the
   far rises are one smooth ridge; reed cards in a band; the haze starts 4 m from the eye (shape, light).
6. **Ground close-up.** The planks are smooth plastic with bumps for nails, the tile's seam visible; the water under
   the rail is the blob pattern; the posts are boxes.

## CC0 textures (option A, the owner's choice)

All from Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and re-encoded by
`tools/textures/prep_verdigris.py`. `public/textures/verdigris/LICENSE.md` lists each file, its authors and grading.

| Pack | Source | Real tile | Used on |
|---|---|---|---|
| `wall` | [stone_brick_wall_001](https://polyhaven.com/a/stone_brick_wall_001) | 2.5 m | curtain, towers, gatehouse, keep, cistern heads, rooms' walls |
| `dressed` | [stone_block_wall](https://polyhaven.com/a/stone_block_wall) | 2.1 m | copings, merlons, string courses, plinths, lintels, rooms' floors |
| `planks` | [weathered_planks](https://polyhaven.com/a/weathered_planks) | 2.0 m | the boardwalks' decks, fascia, posts, rails, trestles, the rooms' timber |
| `brick` | [castle_brick_02_red](https://polyhaven.com/a/castle_brick_02_red) | 1.5 m | the rooms' and passages' vaults |

On disk: wall 0.60 MB, dressed 0.52 MB, planks 0.28 MB, brick 0.62 MB; 1.9 MB in all (12 files), fetched only at
3D On. The plank photo is turned a quarter turn in the prep (normals turned with it) so its boards run along u, as the
procedural boards do. The bed under the water is not given a photo: it is seen only through the water and in the haze.

## Decisions taken without asking

- **Kettle's built kit on for Verdigris** (`builtKit = true`), as in Teeter: the hosts' and the plant's boxes,
  bars and cylinders are chamfered or bevelled with uvs in metres. The bench (`buildVdBench`) keeps its own parts.
- **The masonry is built stone**: each block chamfered, uvs from its final world position in metres, as Teeter.
- **The waterline grime is a shader band on world height**, not a texture: every outside face meets the same water
  (`WATER`), so a band measured from it is exact everywhere. Faces that look into a room carry a flag (`vdOut` 0)
  and stay clean, as do the cisterns' rooms below the water line.
- **The water is re-made procedurally**, not photographed: fine wind ripples and a slow swell at real size, a dark
  peat-brown body. A photo of water tiles badly and does not move.
- **The haze opens a little in code** (`fogNear` 4 → 12, `fogFar` × 1.15), as Teeter, so `world-data/verdigris.json`
  (generated and checked) is untouched.

## Ordered changes and their checks

1. Plan, before shots, packs (this file). Check: licences, sizes.
2. Shape: built kit; chamfered masonry in world metres; coping and merlons as separate jittered stones; battered tower
   and gatehouse plinths; breach stumps as ragged courses; chamfered fascia, posts with cut tops, rails; piles that
   lean and taper; hip rolls on the copper roofs; the far rises eroded in the drawn mesh only. Check:
   `verify:verdigris` (overlap, buried, walk, hosts), `verify:bench`, perf.
3. Texture: four packs dressed at T4; metric repeats; world variation; the waterline band (algae, damp, old
   high-water line) on the masonry and the piles. Check: `verify:normals`, after shots.
4. Light: sun up, hemisphere down with a darker olive bounce, environment down; haze opened. Light count unchanged.
   Check: after shots 1–6 (bench lean-in legible), `verify:verdigris` lamp checks.

## Progress

- [x] Before shots (6 + overview)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots (the same 7, plus two extras: the gate passage and the south curtain's foot)

## What was done (2026-11-27)

| # | Change | Where |
|---|---|---|
| Shape | Every masonry block a chamfered box (3 cm on walls, about 1 cm on thin parts) with uvs laid from its final world position in metres, so courses run on across blocks and through the vaults' rotations | `verdigris/terrain.js` `block`, `finish` |
| Shape | The curtain's coping as separate dressed stones 0.9–1.7 m long, oversailing both faces by 6 cm, a few millimetres off each other (seeded) | `stoneRun` |
| Shape | Merlons each their own size and height; one in six has lost its top course at one end | `battlements` |
| Shape | A two-course plinth along the curtain at the water; the towers', gatehouse's and keep plinth's feet battered (faces leaning in) instead of boxes | `buildMasonry`, `battered` |
| Shape | The breaches' broken ends in ragged courses with blocks pulled out of the face, and fallen stones in the shallows beside them (never within 0.6 m of a walk) | `buildMasonry`, `rubbleStone` |
| Shape | The copper pyramid roofs get rolled hip cappings and a turned finial | `pyramidRoof` |
| Shape | Decks with eased edges; posts chamfered and each a hair off plumb; a flat 13 cm handrail board over a narrower mid rail; piles round, tapering, of differing girth, leaning up to 1.5° | `buildDecks`, `pile` |
| Shape | The far rises cut by spurs and gullies down the fall line, in the drawn mesh only; hollows darker, spurs paler | `relief`, `buildGroundGeometry` |
| Shape | Hosts, plant and far country on Kettle's built kit (`builtKit = true`) | `verdigris.js` |
| Texture | Four CC0 packs dressed at T4; every repeat metric (1 / tile in metres) | `initMaterials`, `initPacks` |
| Texture | Each post, rail and pile cut from one board of the plank photo, its grain along its length | `grainAlong`, `BOARD_MID` |
| Texture | The waterline on every outward face of the masonry and the decks: algae band, wet stone under the water, damp fading over 0.7 m, a broken old high-water line about 1.15 m up | `verdigris/grime.js` |
| Texture | World variation (tone, roughness, rain streaks under the copings) on every big surface; no anti-tile on directional maps | `addWorldVariation` |
| Texture | The water re-made: tiling wind ripples 15–60 cm long over two swells, normals worked from the waves themselves (not the 8-bit height, whose contour lines drew bright rims), a darker peat-brown body; opacity 0.84 → 0.9 | `verdigris-textures.js` `marshWater`, `verdigris.js` |
| Texture | Reeds shaded per blade, dark at the foot and pale at the tip | `verdigris/plant.js` |
| Light | Sun 1.9 → 2.35, hemisphere 1.25 → 0.95 (bounce `#545a45`, darker and olive), environment 0.75 → 0.62, its floor darker; haze from 12 m (was 4) and 15 % further out | `verdigris/atmosphere.js`, `verdigris.js` |

Light count unchanged: Directional 1, Hemisphere 1, pooled Point 3. Exposure unchanged (0.96). Nothing in
`world-data/verdigris.json`, the plan, the colliders, the sites or the benches was changed.

### Numbers

`node tools/perf-worlds.mjs verdigris ligar` (T4):

| | draws | triangles | shadow-caster triangles | Node build |
|---|---|---|---|---|
| before | 331 | 284k | 56k | 661 ms |
| after | 335 | 415k | 173k | 718–987 ms |
| budget | ≤ 566 | ≤ 900k | | |

Download added at 3D On: 1.9 MB (12 JPGs), fetched after the world is built and uploaded as each lands.

### After shots (`docs/images/realism-verdigris/after-*.jpg`)

0. Overview: grey coursed stone with copings and battered feet; the far rises carry spurs and gullies.
1. Spawn: coursed rock-faced ashlar instead of brick wallpaper; fine ripples on dark water; posts and rails of grey
   oak with the grain along them.
2. Tower chamber: the walls are coursed stone; the floor dressed flags at true size.
3. Dosing hall: as 2; the floor reads as large flags, not small bricks.
4. Bench lean-in: the plate, the cased instrument and the pieces are unchanged and legible; the wall behind is
   coursed stone under the lamp.
5. Horizon: weathered boards across the stage at true size; the haze starts further out.
6. Ground: photographed boards with nail holes and worn ends; the rails cut from single boards; ripples, no blobs.
7. Gate passage (after only): brick vault, rock-faced walls, the rails and deck.
8. South curtain (after only): the plinth, the breach's ragged ends, the algae band at the water.

### Left out, and why

- **The bench's cased instrument and plate.** They are the bench's (`bench-bay.js`, shared) and the teaching surface.
- **Separate planks with gaps in the decks.** About 40,000 boards; the photo carries the boards at true size.
- **Rubble in deep water.** Stones only lie where the bed is within 0.9 m of the surface, or they would float out of
  sight.
- **The portcullis slot** (a black recess over the gate passage's mouth) and the rooms' darkness: unchanged; the rooms
  are lit by their lamps only, by design.
- **Photographs for the bed and the cisterns' turf.** The bed is seen only through the water; the turf caps are far
  above the walk.
- **The far country's buildings** (chapel, aqueduct, ravelin): beyond 15 m of the walk and in the haze; they get the
  built kit and the new stone, no new construction.

### Asset licences

All four packs are Poly Haven CC0; `public/textures/verdigris/LICENSE.md` lists asset, authors, real size and grading.
Retired code: `archive/2026-11-27/verdigris-realism/` (the source files as they were, with a README).

### Checks (2026-11-27)

`npm run verify:verdigris` → `VERDIGRIS OK`; `npm run verify:bench` → `BENCHES OK`; `npm run verify:normals` →
`All normal-map checks pass.`; `npm run verify` → `ALL 42 CHECKS + BUILD OK in 545.62s`.
