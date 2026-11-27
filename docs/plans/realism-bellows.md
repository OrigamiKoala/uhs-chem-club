# Realism pass: Bellows

Started 2026-11-27. Brief: the owner's realism-pass prompt (same brief as `realism-tallow.md`). Art only: no site,
layout, collider, bay, walk or bench behaviour changes.

## The real place

Bellows is a gas works built on steel decks over a sea of cloud: no ground, every floor a deck on lattice legs.
The structures are the ones a 1950s–70s gas and air-separation works was built from: a Horton sphere of welded,
painted plates on a square skirt; a waterless piston gasholder (MAN/Wiggins type), a tall drum of plates on
stanchions with a dome; an air-separation cold box clad in ribbed sheet with lagged lines; a cast concrete plinth
under the Compressor; and two moored gas bladders of rubberised fabric. The air is thin, cold and dry and the light
is hard: paint chalks and fades, steel rusts slowly and only at edges, fixings and laps; nothing is wet or green.

References (descriptions, not images in the repo):

1. Horton spheres at a 1960s refinery tank farm: white or silver paint over welded petal plates whose seams show
   as faint raised lines, a dark equator girder on columns, rust weeping from the manway and relief valves.
2. Oberhausen-type waterless gasholder: a polygonal or round drum of plain plates between vertical stanchions,
   ring girders every few metres, a shallow dome, paint dulled grey-blue, streaks under every ring.
3. Offshore platform walkways: galvanised diamond tread plate in 1–2 m sheets, polished bright on the walked lines
   and dull grey under grime at the kerbs, toe boards and handrails on posts.
4. Air-separation cold box: a tall square casing of ribbed steel sheet on a frame, frost where cold lines leave it.
5. 1970s board-formed concrete: horizontal lift lines every ~0.6 m, tie holes, a darker damp band at the foot.
6. High-altitude light above cloud: a deep blue zenith, a bright white bounce from the cloud below, hard sun
   shadows, soft dark where a wall meets the deck.

## What looks fake (before shots: `docs/images/realism-bellows/before-*.jpg`)

Viewpoints (camera → look-at), reused for the after shots:

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn | (-2, 1.7, 60) | (0, 4, 20) |
| 2 | sphere skirt (host 1) from the sphere deck | (-54, 9.7, 27) | (-75, 13, 25) |
| 3 | gondola (host 4) from the mooring deck | (44, 5.7, 28) | (67, 10, 25) |
| 4 | bench lean-in (Bench 2, tower hall) | (0.4, -2.2, -17) | (-3.4, -3.1, -17) |
| 5 | horizon west over the cloud | (-2, 1.7, 56) | (-300, -12, -60) |
| 6 | deck at eye height | (-2, 1.7, 60) | (-1.6, 0, 56.5) |

1. **Spawn.** The deck's tread lugs are ~0.3 m blobs with a sparkle on each, three times real size, and the plate
   is near-black brown (texture, scale). The plinth is a smooth box with a faint pattern and a knife-edge top
   (shape, texture). The holder and the cold box read as blue marble with a regular grid (procedural cladding
   stretched at a 3 m tile). The Compressor is clean primitives. Ambient is flat: everything is lit the same.
2. **Sphere skirt.** The skirt is a box of marbled, streaky tiles (texture); its doorway is a hole with no frame or
   sill (shape); its corners and top are 90° edges (shape); the deck meets the wall with no shadow (light). The
   sphere is a smooth ball with a grid painted on (texture).
3. **Gondola.** A white box of marbled tiles: no trim, no window frames, no rivets (shape, texture). The bladder is
   a dark smooth ellipsoid with thin bands (shape: no gores, no sag).
4. **Bench lean-in.** The bench and its instrument read clearly and are left alone. The hall walls show a crazy-
   paving net (the procedural slab concrete), and the floor has the same net (texture).
5. **Horizon.** The cradled bladder is faceted; the sphere is glassy and the grid is the only detail; the deck in
   front shows the oversized lugs again; the lattice legs and catwalks are good.
6. **Deck.** Oversized lugs with a white highlight each, one value everywhere, no seams at real sheet size, no
   scale cue.

## CC0 textures (option A, owner's choice)

All from Poly Haven (every asset CC0 1.0; polyhaven.com/license checked 2026-11-27). 1K JPG, graded and
re-encoded by `tools/textures/prep_bellows.py`; `public/textures/bellows/LICENSE.md` records each file.

| Pack | Source | Real tile | Used on | Size on disk |
|---|---|---|---|---|
| `tread` | [metal_plate](https://polyhaven.com/a/metal_plate) | 0.5 m | the deck, the tower hall's floor | 0.49 MB |
| `plate` | [blue_metal_plate](https://polyhaven.com/a/blue_metal_plate) | 2.5 m | `cladding`: sphere, its skirt, gondola | 0.10 MB |
| `rivet` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | 2.0 m | `steel`: holder shell, deck edges, Compressor | 0.43 MB |
| `ribbed` | [factory_wall](https://polyhaven.com/a/factory_wall) | 3.0 m | `ribbed`: the cold box casing | 0.24 MB |
| `concrete` | [concrete_slab_wall](https://polyhaven.com/a/concrete_slab_wall) | 2.3 m | `concrete`: the plinth and the tower hall's walls | 0.25 MB |
| `paint` | [green_metal_rust](https://polyhaven.com/a/green_metal_rust) | 1.0 m | `darkSteel`, `grating`: legs, rails, frames | 0.17 MB |

Total 1.6 MB, T4 only. Each albedo is graded onto the paint its procedural map carried (blue and green sources taken
to the works' grey-white and dark blue-grey); painted packs carry metalness 0.

## Decisions taken without asking

- **The bench top keeps its own procedural plate.** The bay bench's top is `M.steel`; Bellows gives its benches a
  copy (`M.benchTop`) before the photo plate lands on `M.steel`, so the surface a student works on does not change.
- **Swap, not rebuild** (as Tallow and Lanternfall): packs go into the existing map slots after the world is built,
  each uploaded as it lands; nothing recompiles. Below T4, in Node, or if a fetch fails, the procedural maps stay.
- **World uvs stay `decks.js` `worldUV` (3 m tile)**; each pack's `scale` converts 3 m to the photo's real tile.
- **Contact shadow is vertex colour on the deck plate.** There is no ground shader here; the deck mesh is already
  vertex-coloured, so the occlusion at the foot of every wall and structure is baked into it (no triangles, no pass).
- **The bladders are not photo-textured.** No CC0 rubberised fabric reads at 50 m; they get gores and seams in shape.
- **The bench interiors, the cased instruments, the landing pad and the ship are left alone.**

## Ordered changes and their checks

1. Plan, before shots, packs (this file). Check: licences, sizes.
2. Shape: bevelled frames round doorways; capping and base angles on the skirt and gondola; a coping and a chamfered
   foot on the plinth; gores and a soft sag on the bladders; welded petal seams on the sphere. Every new piece
   stays inside the old envelope or against a wall face, clear of every bay. Check: `verify:bellows`,
   `verify:bench`, perf.
3. Texture: packs wired (`initPacks`), real tread scale, world variation on large surfaces, deck grime and wear.
   Check: `verify:normals`, after shots 1–3, 6.
4. Light: hemisphere less flat, sun up, environment and exposure re-set, contact occlusion in the deck's vertex
   colour at every wall foot and structure. Check: after shots 1–4, light count unchanged.

## Progress

- [x] Before shots (6)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-27)

| Phase | Change | Where |
|---|---|---|
| Shape | Every built slab, wall and member at least 0.18 m thick and 1.2 m long is a chamfered box (`chamferBox`, 28 triangles) | `bellows/decks.js` `bucketer` |
| Shape | Channel door frames and a threshold plate on the skirt's, gondola's and casing's doors and the plinth's passage, 0.06 m proud, outside the clear width | `decks.js` `doorFrames` |
| Shape | Angle flashings on the gondola's two open corners | `decks.js` `cornerAngles` |
| Shape | Bladders in 16 gores, drawn in along each seam and under each load strap (inward only, so `bagBelly` still holds), smooth-shaded | `decks.js` `bagSkin` |
| Shape | Sphere, holder drum and dome smooth-shaded (`userData.smooth`); sphere at 72 x 40 | `decks.js` `flush`, `sphere`, `holder`, `arc` |
| Shape | Compressor block and housing turned with a foot flange, cornice, bolted flange, mid band and lip (crisp, band by band) | `bellows/plant.js` `turned` |
| Shape | Cumulus heads and the south cloud column as billowed, flat-based, smooth puffs | `plant.js` `billowPuff`, `bellows/vista.js` |
| Texture | Six CC0 packs swapped into the procedural slots as they land | `bellows.js` `initPacks` |
| Texture | Deck tread at its real 0.5 m (the old lugs were ~3x too big); the tower hall's floor is the same chequer plate (`M.hallFloor`), not the board-formed concrete | `bellows.js`, `decks.js` `room` |
| Texture | Skirt re-plated in the sphere's painted plate (the bolted plate read as stone blocks at that size) | `decks.js` `ROOM_MAT`, `skirtBand` |
| Texture | Sphere's uvs laid as courses of 2.5 m plates narrowing to petals (`userData.ownUV`) instead of a box projection | `decks.js` `sphere` |
| Texture | Compressor uvs in metres, a whole number of plates round each body | `plant.js` `metricRoundUV` |
| Texture | World variation (tone and roughness drift, run streaks) on cladding, steel, ribbed sheet, concrete, deck, grating and skin; anti-tile only on the deck and grating (on panel textures the turned copy drew crosses) | `bellows.js` `initMaterials` |
| Texture | Bench plate kept on its own procedural steel (`M.benchTop`) | `bellows.js`, `bellows/stations.js` |
| Light | Hemisphere 1.5 → 1.05, sky #5d8bd0 → #8ea9d4, bounce #e3eaf5 → #c7ced8; sun 2.3 → 2.9 | `bellows/atmosphere.js` |
| Light | Contact shade baked into the deck plate's vertex colour at the foot of every room, the plinth, the skirt, the cold box, the drum and the Compressor's base (up to 34 %, 0.75 m falloff, height-gated) | `decks.js` `contactShapes`, `contactShade` |

Light count unchanged (Directional 1, Hemisphere 1, pooled Point 3). Exposure left at 0.86: the bench lean-in reads
as before.

### Numbers

`node tools/perf-worlds.mjs bellows ligar` (T4, consolidated):

| | draws | triangles |
|---|---|---|
| before | 252 | 302k |
| after | 259 | 402k |
| budget | ≤ 566 | ≤ 900k |

Checks: `verify:bellows` BELLOWS OK; `verify:bench` BENCHES OK; `verify:normals` all pass; `npm run verify` ALL 42
CHECKS + BUILD OK.

### After shots (`docs/images/realism-bellows/after-*.jpg`)

1. Spawn: the deck is galvanised grey chequer plate at real size instead of black blotches; the Compressor's block
   and housing have flanges and bands; the light is less blue and the shaded faces read.
2. Sphere skirt: painted plate with weld seams instead of a marbled tile grid; a framed door with a threshold; the
   deck darkens at the wall's foot.
3. Gondola: framed door, capped corners, matte painted plate; the bladder's gores and strap lines show.
4. Bench lean-in: board-formed concrete walls instead of crazy paving, a chequer-plate floor; bench and instrument
   unchanged and as legible.
5. Horizon: billowed cumulus instead of faceted domes; the sphere smooth, in plate courses; the bladder smooth.
6. Deck at eye height: diamond lugs at 4 cm, wear and grime drifting across the deck, no repeating pattern.

### Left out, and why

- **The sphere still shows its plate courses as a faint light/dark pattern from far off.** The photo's tonal blotches
  repeat 27 x 14 times; graded down to contrast 0.38 it is faint. Further would flatten it to plain paint.
- **Gondola and skirt walls stay clean.** Grime is world-variation streaks only; a baked AO or vertex-colour grime on
  the merged walls needs a second uv or colour channel on the whole works bucket, not worth it this pass.
- **Bevels on rail bars, lattice members and the 1 m deck-thickness pieces.** Too thin or too many (the deck pieces
  alone would add ~150k triangles) for an edge nobody sees.
- **Deck sheet seams.** The deck's vertex grid is 1 m; a seam needs either a shader line or a finer mesh.
- **Room interiors, hosts, cased instruments, the landing pad, the ship.** Hosts and benches are bench-adjacent
  (bay contract); the pad and ship belong to the voyage.
- **The sky dome and its blue.** The owner's; only the hemisphere fill moved.

### Asset licences

All six packs are Poly Haven CC0 1.0; `public/textures/bellows/LICENSE.md` lists asset, author, real size, size on
disk and grading. Retired code: `archive/2026-11-27/bellows-realism/` (with README).
