# Realism pass: Tallow

Started 2026-11-26. Brief: `docs/realism-pass-prompt.md`. Art only: no site, layout, collider, bay, walk or bench
behaviour changes.

## The real place

Tallow is a salt-refinery on a dry playa: a closed basin whose floor floods a few centimetres each wet season and
dries to a halite crust. The plant is forty years old, built from what industrial plants in such places are built
from: steel portal-frame sheds clad in painted profiled sheet on a poured concrete kerb, blockwork control houses,
riveted evaporator drums, pipe racks. Salt has crept up everything standing on the flat.

References (descriptions, not images in the repo):

1. Bonneville Salt Flats after the dry season: polygons 1–2.5 m across, irregular, bounded by pressure ridges a few
   centimetres proud; the plates between them are granular, off-white to pale grey, damp-dark in patches.
2. Salar de Uyuni brine-processing ponds: concrete bund walls crusted white to knee height, horizontal tide lines.
3. Atacama nitrate oficinas (Humberstone): corrugated/profiled steel sheds, paint sun-bleached to grey, rust blooming
   from fixings and laps, sheet ends and corners capped with angle flashings, gutters rusted through.
4. Board-formed industrial concrete of the 1970s–80s: tie holes on a ~0.6 m grid, panel seams, aggregate showing
   where the skin has weathered, dark band at the ground line.
5. Overcast desert light: a bright, slightly warm sky on the sun side, a darker zenith, strong bounce from the
   white ground, soft but present contact shadows under every object.

## What looks fake (before shots: `docs/images/realism-tallow/before-*.jpg`)

Viewpoints (camera position → look-at), reused for the after shots:

| # | View | Camera | Look at |
|---|---|---|---|
| 1 | spawn | (0, 1.7, 44) | (0, 1.6, 0) |
| 2 | hall from the approach | (8, 1.7, 24) | (30, 3, -10) |
| 3 | evaporators from the approach | (-10, 1.7, -14) | (-16, 4, -40) |
| 4 | bench lean-in (Bench 3) | (36, 1.75, -15.2) | (36, 0.9, -18.6) |
| 5 | far horizon | (-30, 1.7, 46) | (-160, 8, 160) |
| 6 | ground at eye height | (4, 1.7, 40) | (4.5, 0, 36.5) |

1. **Spawn.** Hall cladding reads as woven basket: the riveted `platedMetal` panel texture tiles every metre over
   10 m walls (texture, low-frequency procedural). Halls are bare boxes with knife-edge corners and no trim, gutter
   or downpipe (shape). The wall meets the salt along a ruled line with no drift and no shadow (shape, light). The
   crust's polygons are all one size and the ridges read as painted white lines (texture). Ambient is flat.
2. **Hall from the approach.** Same basket weave; the kerb is a white band with a perfectly straight top; the
   corner of the building is a single 90° edge; no contact darkening at the foot (shape, light).
3. **Evaporators.** The best-looking part of the world already (riveted drums, ladders, rails). The drum texture is
   blurry at 10 m (procedural, 512 px over a 30 m circumference). The ground cuts against the drum feet with no
   footing shadow.
4. **Bench lean-in.** The bench top is blotchy: the salt patch's "settles on what faces up" term paints white
   blooms on the plate the student works on (texture). The interior is dim and even.
5. **Horizon.** The crust tile repeat is visible as a regular net to 60 m (texture). The pond bund is a smooth white
   torus. The mesas are acceptable.
6. **Ground close-up.** Plates are smooth with a fur-like streak (the grit normal is too strong and directional);
   ridges have no granular crystal; no grain at all at the player's feet (texture, scale).

## CC0 textures (option A, owner's choice)

All from Poly Haven (every asset is CC0 1.0; licence page checked 2026-11-26). 1K JPG, graded and re-encoded;
`public/textures/tallow/LICENSE.md` records each file.

| Pack | Source | Real tile | Used on | Files, size on disk |
|---|---|---|---|---|
| `sheet` | [rusty_metal_02](https://polyhaven.com/a/rusty_metal_02) | 1.0 m | hall cladding, ribs, shutter boxes | diff + nor + arm, 0.40 MB |
| `concrete` | [concrete_wall_008](https://polyhaven.com/a/concrete_wall_008) | 2.71 m | kerbs, slabs, blockwork, plinths | diff + nor + arm, 0.29 MB |
| `drum` | [rusty_metal_04](https://polyhaven.com/a/rusty_metal_04) | 2.0 m | evaporator and tank shells | diff + nor + arm, 0.62 MB |
| `grain` | [rough_concrete](https://polyhaven.com/a/rough_concrete) | 1.23 m | crystal grain on the salt crust (detail layer) | diff (luminance) + nor, 0.8 MB |

Total download: **2.1 MB**, T4 only. Rejected after looking: `snow_02` (twig grooves in the normal map read as
debris), `white_stucco` (too smooth to register).

Grading (script kept in the session scratchpad and summarised here): saturation × 0.32 (sheet), × 0.62 (drum, with
blue/cyan hues removed), × 0.70 (concrete); sheet and drum multiplied toward warm brown; value clamped 0.04–0.86.
The grain's luminance is high-passed about mid-grey so it adds grain without changing the crust's tone.

## Decisions taken without asking

- **Bench top keeps its own procedural plate.** The photo sheet goes on a new `sheetMat` used only by the halls;
  `plateMat` (bench tops, host sheet, many plant props) is untouched except that the bench-top clone carries less
  settled salt, so the plate a student works on is not blotched white.
- **The ribs stay geometry.** The photo is a flat painted sheet; the profile is the existing 0.3 m rib boxes.
- **Swap, not rebuild.** Packs are loaded after the world is built and swapped into the existing materials'
  map slots (same map set, so no shader recompile), each texture uploaded with `renderer.initTexture` as it lands,
  during the flight. A slow network leaves the procedural maps in place. Below T4 and in Node nothing is fetched.

## Ordered changes and their checks

1. Shared loader `src/three/materials/texture-pack.js` (opt-in; nothing else imports it). Check: build, Node
   world construction with no renderer fetches nothing (`verify:tallow` runs headless).
2. Shape: hall corner flashings, base flashing, eaves gutters and downpipes, salt drifts banked on wall feet.
   Check: `verify:tallow` (overlap, low bodies, flood), `verify:bench`, perf triangles ≤ 900k.
3. Texture: `sheetMat`, concrete and drum packs, grain in the ground shader, irregular crust polygons, softer grit
   normal, world-space macro variation on the large surfaces. Check: `verify:normals`, `verify:tallow` shader-patch
   checks, after shots 1, 2, 6.
4. Light: hemisphere less flat (sky above, darker bounce), contact occlusion on the ground round every building
   footprint and round structure, exposure re-checked at the bench. Check: after shots 1–4, light count unchanged.

## Progress

- [x] Before shots (6)
- [x] Textures chosen, downloaded, graded, licence recorded
- [x] Loader (`src/three/materials/texture-pack.js`)
- [x] Shape
- [x] Texture
- [x] Light
- [x] Verify + perf
- [x] After shots

## What was done (2026-11-26)

### Shared, opt-in pieces (no other world uses them yet)

- `src/three/materials/texture-pack.js`: `loadTexturePack`, `dressFromPack`, `dressWorld`, `packsAvailable`. A pack
  is `<name>_diff/_nor/_arm.jpg` under `public/textures/<world>/`; maps go into the slots the procedural material
  already has (same program, no recompile), each uploaded with `renderer.initTexture` as it decodes. No renderer,
  no DOM, or below the caller's tier: nothing is fetched and the procedural maps stay.
- `pbr-kit.js` `addWorldVariation(mat, { scale, strength, roughShift, antiTile, streaks })`: world-space tone and
  roughness drift, a second rotated coarser albedo sample blended in patches (anti-tile), optional vertical streaks.
- `pbr-kit.js` `addWorldBoxUV(mat, { metres })`: box-projected world uvs for every map slot, for stock boxes whose
  0..1 face uvs stretch a texture.

### Tallow

| # | Change | Where |
|---|---|---|
| Shape | Corner angle flashings, a drip flashing on the masonry, eaves gutters, downpipes with brackets and shoes on every clad/plinth hall | `tallow/halls.js` `buildTrim` |
| Shape | Salt drifted against every wall's foot, deeper on the windward faces, thinning to nothing at doors, belt slots and anywhere another host or landmark stands; `phys: 'ground'` | `tallow/halls.js` `buildHallFoot` |
| Shape | Pond bunds rebuilt as a lumpy blade-scraped bank (7-point profile, seeded waves along and across, slumps) in the granular salt material | `tallow.js` `initPanRims` |
| Shape/texture | Crust polygons domain-warped (varied size, bowed sides), ridges of varying height and width, each plate a slightly different grey; the unresolvable fine octave removed and the normal taken from a 1 px smoothed height (the "fur") | `tallow/surfaces.js` `saltCrust` |
| Texture | Halls' own `sheetMat` with the `sheet` pack, world variation, anti-tile and run streaks | `tallow.js` `initMetals`, `initPacks` |
| Texture | `concrete` pack on kerbs, slabs, blockwork and the plant kit's concrete; hall floors are the same pour, trowelled (`hallFloorMaterial`) | `tallow.js` |
| Texture | `drum` pack on evaporator and tank shells, with world variation | `tallow.js` |
| Texture | Bench top and instrument cabinet: world-projected uvs and the `sheet` pack at low normal strength; the bench top takes almost no settled salt (`top: 0.05`) | `tallow.js` |
| Texture | Ground: photographed grain as an albedo detail layer and a light normal, fading out by 25 m | `tallow/terrain.js` `setTallowGrain` |
| Light | Contact occlusion on the ground round every hall footprint (5 boxes) and every evaporator/tower shell (5 circles) | `tallow/terrain.js` `setTallowContacts`, `tallow.js` `initContacts` |
| Light | Hemisphere 1.15 → 0.92 with the bounce below the sky; sun 2.7 → 2.95; environment 0.5 → 0.6; exposure 0.92 → 0.98 | `tallow/atmosphere.js`, `tallow.js`, `stage.js` |

Light count unchanged (Directional 1, Hemisphere 1, pooled Point 2).

### Numbers

`node tools/perf-worlds.mjs tallow ligar` (T4, consolidated):

| | draws | triangles |
|---|---|---|
| before | 317 | 798k |
| after | 330 | 811k |
| budget | ≤ 566 | ≤ 900k |

Download added at 3D On: 2.1 MB (11 JPGs). Checks: `npm run verify` — ALL 42 CHECKS + BUILD OK (includes
`verify:tallow`, `verify:bench`, `verify:normals`).

### After shots (`docs/images/realism-tallow/after-*.jpg`)

1. Spawn: the halls read as profiled sheet with lapped corner flashings and gutters; the crust's polygons vary in
   size and shape, so the pan no longer looks paved.
2. Hall from the approach: weathered grey-brown sheet with rust spots and run streaks instead of the basket weave;
   no visible repeat down the wall.
3. Evaporators: photographed rust and paint loss on the shells; darker ground at their feet.
4. Bench lean-in: the plate is worn painted steel at a metre per tile instead of the stretched white blotches; the
   floor is trowelled concrete.
5. Horizon: no regular net in the crust; the pond bund is a lumpy granular bank instead of a smooth torus.
6. Ground at eye height: granular crystal on the plates, ridges standing proud, no combed fuzz.

### Left out, and why

- **Rock and far country.** The mesas and ranges already read as eroded, layered landforms; the gain did not justify
  the triangles.
- **The pit (sub-level), crates, hauler, landing pad and the ship.** Out of the walk past most halls, or shared
  (the ship and the pad belong to the voyage); left for a later pass.
- **Concrete edge chamfers and chipped corners.** The kerbs and slabs are strips from `wallPieces` that the overlap and
  housing checks read; bevelling them was not worth the risk to those checks in this pass.
- **Baked AO in vertex colour.** The ground shader's distance-field occlusion does the contact shadow at no triangle
  cost; props keep their own AO maps.
- **The contact occlusion is subtle** in full sun on the white crust; it is clearest round the evaporators and in the
  lee of the halls.

### Asset licences

All four packs are Poly Haven CC0; `public/textures/tallow/LICENSE.md` lists the asset, author, real size and the
grading done to each. Retired code: `archive/2026-11-26/tallow-realism/`.
