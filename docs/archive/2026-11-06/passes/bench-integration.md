# Bench integration — benches become part of each world

**Status:** Complete. P0 (shared groundwork), P1 (Tallow), P2/P3 (Ligar) and P4 (Lanternfall) done 2026-10-16; P5 (Bellows) and P6 (Ember Reach) were built with T5 and T6 of `bench-tabletop.md` (2026-10-22); P7 (records and retirement) complete with T7 (2026-10-22). This file stays the record of P0–P4 and of the §6–§7 host proposals. Drafted 2026-10-16.

## The brief

Every Learn bench today is visibly a bench in a hut: an apron, posts, a back wall, a roof, a sign
(`ligar/stations.js` `buildShelter`, `lanternfall/sites.js`, `bellows/sites.js`, `ember/sites.js`,
Tallow's lean-to and gantries). The brief is to fold each bench into the place around it, so it reads
as a working instrument on the world's own equipment. Examples: on Tallow, instruments scattered around
the salt refinery; on Ligar, benches inside the mine.

## Decisions (answered by the user)

| Question | Answer |
|---|---|
| Scope | **All five walkable worlds.** Tallow and Ligar first, then Lanternfall, Bellows, Ember Reach |
| Ligar's mine | **Real adits into hills.** Raise trap benches into hills and drive level tunnels into them |
| Ligar split | **Half and half.** Some benches at surface workings, the rest underground |
| Bench look | **Part of the machine.** The plate is a sampling shelf, control desk or inspection deck built into the equipment |
| Tallow layout | **Re-lay the world.** Benches and refinery equipment can both move |
| Other worlds' concepts | **Proposed here** for review (§5–§7) |
| Site signs | **Dropped.** No `Bench N - <topic>` sign in the world; the CLAUDE.md sign rule is retired |

## Invariants this pass must keep

1. **Nothing about a quest changes.** No prompt, hint, reward, grading, stage or XP change. The data
   `label` (`Bench 1 - Atoms`) stays: the UI (Star Map, guide, `[E]` prompt) still uses it. Only the
   physical sign goes.
2. **The deploy contract is unchanged.** Every bench keeps the 4.8 × 1.3 m plate at 0.95 m, a dormant
   cased instrument, one completion indicator, and `registerBenchAnchor` →
   `{position, rotationY, topY, dormant}`. `BenchViewer3D`, `PANEL_LAYOUT`, `fitDeployedAim` and every
   `*3d.js` instrument stay untouched.
3. **The clearance envelope is honoured.** Today it is implicit in the shelters ("posts at x = ±3,
   z = -1.55 and 2.95, roof above 3.3 m, nothing behind the bench nearer than z = -0.45", from
   `ember/sites.js`). Machinery may wrap round the bench, but never into that volume or into the panels'
   volume above the plate (deck/rail/controls/comms reach ~1.62 m + panel height, ±0.94 m sideways,
   z ≈ -0.44…-0.68).
4. **No overlap, walkable, lamps only lit, honest pictures**: `verify:<world>`, `verify:bench`,
   `verify:geometry` and `npm run verify` pass at every checkpoint.
5. **Facing is still derived from `approachPos`** (`siteFacing`), and the approach stays open ground
   at least ~4.4 m in front of the plate so the camera has somewhere to stand.
6. **Boss arenas (`BOSS_ARENA_SPOTS`) stay on open surface ground** in every re-laid world.
7. **No browser testing by Claude.** Node checks and `npm run build` only; the user tests in the browser.

## 1. Shared groundwork (all worlds)

**1a. One bay contract.** New `src/three/bench-bay.js`:
- `BENCH_BAY` — the plate (`width 4.8, depth 1.3, height 0.95`), the bench's local z (today `BENCH_Z =
  1.5`), and the clearance volume as boxes in the site frame: the bench body, the panel volume, the
  overhead (≥ 3.3 m clear above the floor), and the approach corridor in front.
- `buildBayBench(ctx, { skin, kind, plate })` — one builder for the plate, dormant case and indicator,
  with a `skin` that changes only its dress: `shelf` (sampling shelf with a handrail and drip edge),
  `desk` (control desk with a sloped instrument fascia), `deck` (grated inspection deck with toe
  boards), `ledge` (rock-bolted steel ledge for the mine). Dimensions and anchor never vary with skin.
- Replaces the five copies of `BENCH`/`BENCH_Z` and the five bench builders (`tallow.js buildBench`,
  `ligar.js buildBench`, `buildErBench`, the Lanternfall and Bellows benches). Each world passes its own
  materials in `ctx`.

**1b. Host builders.** Each world gets a `stations.js` (Tallow, Lanternfall, Bellows and Ember rename
`sites.js`) exporting one builder per **host**: the piece of equipment a bench belongs to. A host builder
returns `{ group, bench, local, colliders, partBoxes }`, the same shape `ligar/stations.js` returns now,
so `registerBenchAnchor` and `buildColliders` do not change. The bench is a **part of its host** (one
object), which the overlap rule already exempts. The host's own bodies are measured against the bay.

**1c. `verify:bench` measures the bay, not the shelter.** Add a per-site check that no world body
(baked parts included, via `partBoxes`) enters any `BENCH_BAY` clearance box, in all five worlds. Keep
the existing six-aspect framing and "instrument stands inside world geometry" checks. This replaces
the implicit guarantee the shelters gave.

**1d. Signs go.** Delete `buildSiteSign` (Ligar) and the sign/placard code in every site builder.
Update every verifier that asserts a site sign exists (`verify-ligar`, `-lanternfall`, `-bellows`,
`-ember`, `-flows`, `-learn`, `-holo`; the exact asserts are listed when the phase starts). Equipment
keeps its own industrial markings (plant tags like `EVAP-02`), which are not site signs and carry no
topic words.

**1e. Finding a bench without a sign.** The guide arrow (`guide-arrow.js`) and the completion indicator
already exist. Add: the indicator lamp is mounted where it is seen from the approach (it is a `lampMark`,
so the light count stays fixed), and the dormant instrument case is the one bright, clean object on a
weathered machine (the Tallow rule already: "it is the one thing on the flat somebody is using").

## 2. Tallow — instruments along the salt line (re-lay)

The refinery becomes one readable process line that the player walks along, and each bench sits at
the step of the process that matches its quest. Today there is no layout generator for Tallow, so this
phase adds `tools/gen-tallow-layout.mjs` (same settle-and-refuse rules as `gen-ligar-layout.py`) and
rewrites `tallow.json` from it.

The line, from the landing pad inward:
brine pans → evaporator row → cracking towers → pipe bridges → conveyor → weigh hopper and bagging →
loadout scale beside the hauler.

| Bench | Quest | Host (proposed) | Skin |
|---|---|---|---|
| 1 | `q1-grain` | The **raw-salt sample point** at the conveyor's tail, where harvested crust (a mixture) is first sampled | shelf |
| 2 | `q2-core` | The **instrument room under the evaporators** (the existing sublevel lab, moved under the evaporator row; its stair rises between two evaporators) | desk |
| 3 | `q3-catalogue` | The **process control house** at the foot of the evaporator row; the catalogue board is its wall of record cards (the vault blockhouse is retired) | desk |
| 4 | `q4-ledger` | The **cracking tower's sampling deck**: a tower separates what goes in by weight, a fit for isotopes | deck |
| 5 | `q5-assay` | The **weigh hopper** at the conveyor's head (today's hopper gantry, now actually fed by the conveyor) | deck |
| 6 | `q6-weigh` | The **sack-filling scale** on the bagging line next to bench 5 | shelf |

Work:
- `tallow/plant.js`: give evaporators, towers, conveyor and hopper an attachment point for a bay and
  leave the bay volume empty; add the control house, sample point and bagging line as new builders.
- `tallow.js`: replace `initSalvageBench`, `initCatalogueVault`, `initTallyFloor`, `initHopperGantry`
  with host builders; move `sublevel` (room, stair, `headPos`) under the evaporators and recut the
  terrain hole.
- Re-place crates, salt heaps, debris and the hauler around the new line; keep the `boss-hopper`
  arena at (0, 0, 30) clear, or move it with the layout.
- Update `t2.stillCamera` for each site (and re-run `bake:stills` if those stills are still
  baked from it), and the `t1.siteDescriptions` copy if it is still read anywhere.

## 3. Ligar — surface workings and the mine (half and half)

**Split.** Benches 1–4 keep their surface identity today; 5–9 are the generic `gauge-shelter`s. The
proposal puts four on the surface and five underground:

| Bench | Quest | Where | Host (proposed) | Skin |
|---|---|---|---|---|
| 1 | `q1-joins` | surface | The **slab-dressing yard** at the quarry face: the saw bed where cut slabs are clamped | shelf |
| 2 | `q2-lattice` | **mine** | The **ore drift** just inside the main adit, where a metal vein crosses the basalt (stone and wire side by side); the forge moves here from the lava tube | ledge |
| 3 | `q3-distance` | surface | The **crusher house**: the jaw crusher's inspection deck, where energy breaks stone | deck |
| 4 | `q4-dots` | surface | The **weighbridge scale house** desk (today's weighbridge, without its shelter) | desk |
| 5 | `q5-resonance` | surface | The **mine substation** at the portal: two charged plates on insulators become its bus bars | deck |
| 6 | `q6-shape` | mine | The **drill chamber**: a rock-bolt pattern board and the drill jumbo's control stand | ledge |
| 7 | `q7-polarity` | mine | The **sump and pump station** at the low point of the mine, where water is pumped out | ledge |
| 8 | `q8-hybrid` | mine | The **survey station** at the junction of three drifts | ledge |
| 9 | `q9-orbitals` | mine | The **hoist chamber** at the deepest point, under a winze to a lower level | desk |

### 3a. Hills and adits

- `gen-ligar-layout.py`: add a hills block. Two or three trap-bench hills (stepped basalt flows, the
  columnar kit already used for the cut walls) rising ~12–18 m, with portal faces toward the plant.
- A **mine plan** in `ligar.json` (`mine: { portals, drifts, chambers }`). A drift is a polyline with
  a width (≥ 3.6 m), a floor profile (gentle grade, ≤ 6°), and a roof height. A bench chamber is a
  rectangle ≥ 7.5 m wide × 9 m deep × 4.2 m high, so the bay plus its approach fit inside rock.
- Geometry: drift walls and roofs from the column kit (`columnWall`, `lintelBeam`), timber or steel
  sets every 2 m, rock bolts, a rail track and vent duct along the main drift, cable on hangers. Portal
  is a cut face with a steel portal set and a headwall.
- The existing pit and lava tube stay as the quarry; the tube no longer houses a bench.

### 3b. The walk under a hill (the hard part)

`getTerrainHeight(x, z)` answers one height per column, and the Ligar sub-level works only because
the pit is an open hole. A drift has ground above it that may itself be walkable, so:
- Change the walk to **layered**: `getTerrainHeight(x, z, fromY)`. Inside a drift footprint it
  answers the drift floor when `fromY` is below the drift roof, the hill surface otherwise. The other
  four worlds accept and ignore `fromY`.
- Callers to update: `stage.js` (9 calls), `aim-target.js`, `voyage.js`, `ship-exterior.js`,
  `world.js`, and each world's own calls; every one passes the current eye/foot height.
- The hill surface over a drift is made **unwalkable from below and above near the portals** (a
  cliff face at each portal), so a player never drops between layers.
- Colliders: drift walls as segment colliders in `buildColliders`; chamber walls as boxes.
- `enter(stage, siteId)` already lands the player at `approachPos` with a height; the resolver
  takes that height as `fromY`, so arriving at an underground site works.
- `verify:ligar` flood-fill becomes 3D: nodes are (x, z, layer), with a step from surface to drift
  only through a portal. It must reach every `approachPos`.

### 3c. Light underground

On a phone there is no shadow map, so the sun and sky fill would light the inside of a drift.
- Add a **cover mask** to Ligar's material patch (beside `applyLigarAir`): a small table of the mine's
  boxes in a uniform; a fragment inside one has direct sun, hemisphere and environment fill scaled to
  near zero, with a short falloff at each portal. Bake once, never per frame.
- Underground light comes only from lamps (`lampMark` on the sets, at chambers and junctions) in
  the existing `LampPool`. The pool's light count stays fixed; it already picks the nearest.
- `verify:ligar`'s lamps-only-lit check runs on the cover mask too: no unlit fragment in a chamber
  may read brighter than a threshold at T4 or with shadows off.

### 3d. Guiding into the mine

The guide arrow points straight at its site, which underground means through rock. Give
`guide-arrow.js` an optional waypoint list from the world (`routeTo(siteId, fromPos)`): surface →
portal → drift junctions → chamber. Other worlds return the site directly.

## 4. Order of work

Each phase ends with `npm run verify` green and a progress note in this file.

- [x] P0 — Shared groundwork (§1): `bench-bay.js`, `buildBayBench`, bay check in `verify:bench`,
      signs removed, verifiers updated. No world looks different yet except missing signs.
      Progress note below.
- [x] P1 — Tallow (§2): layout generator, process line, six hosts, sublevel moved.
      Progress note below.
- [x] P2 — Ligar surface (§3, benches 1, 3, 4, 5). Progress note below (done with P3).
- [x] P3 — Ligar mine (§3a–3d): hills, adits, cover mask, guide waypoints, benches 2, 6–9. The layered
      walk was not needed (see the note: the hills are not climbed).
- [x] P4 — Lanternfall (§5): generator re-lay, nine hosts, ground levelled per host. Progress note below.
- [ ] P5 — Bellows (§6). P6 — Ember Reach (§7). **Moved to `bench-tabletop.md` T5 / T6**, built together
      with each world's tabletop conversion.
- [ ] P7 (**moved to `bench-tabletop.md` T7**) — CLAUDE.md (retire the sign rule, describe the bay contract and the layered walk), per-world
      plan records, stills.

### P0 progress note (2026-10-16)

Done:
- `src/three/bench-bay.js`: `BENCH_BAY`, `PLATE_TOP`, `bayBoxes()`, `BENCH_SKINS`, `buildBayBench()`. The five
  bench builders (`tallow.js buildBench`, `ligar.js buildBench`, `buildErBench`, `buildLfBench`,
  `buildBwBench`) are now thin callers; each keeps its own cased-instrument dress (`dormant`) and small
  parts (`extras`) and passes its materials. Checked by fingerprinting every mesh of all 37 benches before and
  after: identical except a 1 mm shift of Ligar's indicator and plate number.
- Skins: today's four light-frame worlds are `shelf`, Ligar's stone-plinth bench is `ledge`. `desk` and `deck`
  are new and unused until a host takes them. The plan's handrail/drip edge for `shelf` is not built: it would
  have changed every world's look in P0. Each skin is held to the plate's footprint and anchor by `verify:bench`.
- Signs: Ligar's `buildSiteSign` and its four uses (Arch Terrace pier, forge mouth, deck gantry header plates,
  stations 5–9 with their hangers), the Ember/Lanternfall/Bellows site placards, and the dead `buildSign` in the
  Lanternfall and Bellows `props.js`. Tallow had none. Data `label`s stay; the verifiers that check them now
  say "site label" instead of "sign". No verifier asserted a physical sign.
- `verify:bench` measures the bay in all five worlds (built unbaked so the bench's own parts are identifiable),
  with `findBayIntrusions` in `tools/lib/overlap.mjs` (open shells and tubes judged by surface). It also asserts
  `PANEL_LAYOUT` lies inside the panel volume and that every instrument's measured reach lies inside the work volume.

Differences from §1 as drafted:
- **Work volume is 2.7 m either side and 2.4 m high, not "3.3 m clear".** Measured instrument reach is x ±2.63,
  z −0.53…0.65, 1.82 m high; 3.3 m was the old shelters' roof, which Tallow's lean-to (2.95 m) never met.
- **A ratchet, not a clean pass.** The old shelters intrude on the looser-built volumes, so
  `tools/bay-legacy.json` lists 25 (bench, volume) pairs (Tallow q1–q6, Ligar q1/q2/q4/q8/q9, Lanternfall q4/q7,
  Ember q2/q4). Anything not listed fails, and so does a listed pair that has gone clear. **Each world's phase
  deletes its benches' lines**; the plate/work/panels entries (Tallow q2, q3; Ligar q1, q4; Lanternfall q4) are
  the ones that most need the re-lay.
- **1b not renamed yet.** The site builders already return `{ group, bench, benchLocal, colliders }`;
  `sites.js` → `stations.js` and the `partBoxes` field come with each world's phase.
- **1e partly.** The indicator already sits on the apron facing the approach and is an emissive mesh, not a
  light, so the light count is unchanged. Making the dormant case the one bright clean object belongs to the host
  phases, where there is weathered machinery to set it against.

### P1 progress note (2026-10-16)

Done:
- `tools/gen-tallow-layout.mjs` writes `tallow.json` (hand-placed line, settled scatter, refuses on any overlap, any
  approach lane crossed, a blocked boss arena at (0, 0, 30), a stair that does not rise between the two roof
  vessels). The line runs from the pad west: pans, evaporator row (z -36), towers north of it, two pipe racks through the
  row's gaps, the conveyor (centre (2.5, 4), tail east, head west), weigh hopper and bagging line at its head, loadout
  scale and hauler beyond. Sites: 1 (17, 4) facing east; 2 (-4, -43) on floor -5; 3 (36, -18); 4 (31, -52); 5 under
  the head's chute (-8.69, 9); 6 beside it (-20.09, 9). `site.pos` is the bench centre and every facing is cardinal
  (the host colliders are axis-aligned). Tracks (ruts, paths) re-drawn to the new approaches.
- `tallow/stations.js`: six host builders returning `{ group, bench, benchLocal, colliders }`; `tallow.js initHosts()`
  places them, registers the anchors and turns their colliders to the world. `initSalvageBench`, `initCoreBench`,
  `initCatalogueVault`, `initTallyFloor`, `initHopperGantry` and their hard-coded colliders are gone. `plant.js` gained
  `CONVEYOR` (the belt's end positions and the discharge chute's mouth, which the weigh hopper is hung from),
  `buildLoadoutScale` and its support point.
- Sub-level moved under the row: room x -22…14, z -46…-31, floor -5.0, roof top -0.3 (ceilingY -0.85), stair x -6.6…-1.4,
  z -31…-22 (grade 0.56). The two vessels over it stand on its roof (`on: 'roof'` landmarks; y = roof top + 0.3, the
  foundation's foot) and their load comes down through the room on girders and eight columns. The terrain hole is the
  room's rect as before; the rim walls stand 0.6 m proud, so the vessels sit in a bunded basin. Lamps, drain and
  placards are placed from the data, not literals.
- 1e, for Tallow: the cased instrument is a separate, less rough, unsalted material (`noSalt`), the one clean object on
  the machine. The indicator is unchanged.
- `t1.siteDescriptions` was read by nothing but `verify:tallow`; deleted (and its check replaced by one on
  `t1.siteOrder`). `t2.stillCamera` is regenerated from the approach marks; `bake:stills` does not read it, so no re-bake.
- `tools/bay-legacy.json`: every `tallow/*` line deleted (25 → 13 pairs left: Ligar q1/q2/q4/q8/q9, Lanternfall
  q4/q7, Ember q2/q4). `verify:tallow` gained: hosts beside their one bench, vessels over the room, the Hopper's ground open.
- All `verify:*` pass (run one by one). `npm run build` was not run (nothing else changes it; `dist/` untouched).

Differences from §2 as drafted:
- **The stair rises between the two vessels in x, but south of them in z.** The stair is a ramp over z (`getTerrainHeight`)
  and the room is under the row, so the stair opens on the row's south face between the E2 and E3 columns.
- **Benches 4 and 5 are on a deck at grade, not elevated.** The walk is one layer. Bench 4's host is the tower itself
  (the column, its ladders and guys are part of the host, so the draw-off line can tie into a real nozzle), with the
  sample-cooler skid between it and the bench; the tower is turned (0.647) so its guys miss the deck.
- **The control house is a new building**, a poured block house with a veranda (the blockhouse is retired). Its desk is
  in the veranda, its record wall (index cards) beside the glass.
- **Hopper gantry is 0.55 m west of the belt's discharge,** the sleeve (sloping) bridging back to the bin: the belt's long
  diagonal members are boxed from the head's lip and the bin's ring frame would have read as inside it.
- **The shared `desk` skin's fascia was lowered 0.15 m** (it stood above the plate and the deployed instrument's trays met it).
  No other world uses `desk` yet.
- Pipe bridges moved to z -44.6 (the north end was inside the first tower's reach); loadout scale and hauler moved west.

For the user to look at in the browser (not tested here): the sleeve under the conveyor head, the control house door and
glass, the lab's columns and girders under the two vessels, the tower deck's draw-off line and the tower's guys.

### P2/P3 progress note — Ligar (2026-10-16)

Done:
- `tools/gen-ligar-layout.mjs` replaces `gen-ligar-layout.py` (the floors of the workings are laid from the real height
  field, which only the JS can evaluate). Hand-placed hills, workings and hosts; the scatter is settled; it REFUSES to
  write if anything fixed collides, a doorway does not meet its neighbour at one height, a grade is over 6 degrees, a
  working has less than 1.4 m of rock over its roof or reaches its hill's edge, a bay leaves its chamber, a cutting
  does not meet the ground at its foot, a ring box closes a cutting or cuts into a working, a host's real extents touch
  another's, or the warden's ground is not open. The three arches are pinned where they have always stood (an arch's
  talus is seeded from its position). `tallow`-style keep-outs: belts, hosts, the deck, the pit, the hills, each
  cutting's lane.
- `ligar/mine-plan.js` (pure, no THREE): the hills (`hillHeight`, a rounded block rising in two steps, 16 and 15 m), the
  workings as axis-aligned volumes (`cutting`, `drift`, `chamber`) with graded or flat floors and openings that meet on
  one plane, and everything derived from them: `floorAt`, wall segments, wall and ring colliders, the terrain holes, the
  light mask's boxes, and `routeTo` (the guide's way in). Generator, world, guide and verifiers stand on this one file.
- `ligar/mine.js`: the rock (floors in scoria, walls in section as the quarry's faces are but cut flat at the face so the
  colliders are exactly where the rock is, roofs, the headwall over each portal; `phys: 'ground'`) and the furniture
  (steel and timber sets every 2.4 m, rock bolts, vent duct, cable on hangers, the rail down the main adit and the
  decline, each portal's frame, a lamp every 6 m).
- `ligar/stations.js`: nine hosts, each returning `{ group, bench, benchLocal, colliders }`: 1 slab-dressing yard (shelf,
  bridge saw over a clamped slab, racks), 3 crusher house (deck, jaw crusher with flywheels, feed belt, housing,
  catwalk above the bay), 4 scale house (desk, cabin with the dial, weigh deck on its cells), 5 substation (deck, the
  two charged plates as bus bars, transformer, switchgear), 2 ore drift (ledge, forge, anvil, trough, the vein and the
  wire), 6 drill chamber (pattern board, jumbo, control stand), 7 sump and pump station, 8 survey station, 9 hoist
  chamber (desk, winder, winze collar and headgear, the rope). `ligar.js` loses `initArchTerrace`, `initTubeForge`,
  `initBatchHouse`, `initWeighbridge`, `initStations` and the shelters (`buildShelter`, `APRON`, the five signature
  pieces); `initHosts` places them like Tallow's. The lava tube is an empty quarry feature (barrel, mouth, a few props).
- Light: `setLigarCover` + the `applyLigarAir` patch take the sun, the hemisphere and the environment out of every
  fragment inside a working's box (8 volumes per hill, 2 hills, 1.3 m falloff), lamps untouched. Underground lamps are
  12 cd / 14 m (the only light there). Ash and grit fade indoors; no grit streak runs over a hill.
- Guide: the waypoint carries `siteId`; `LigarWorld.routeTo(siteId, from)` leads surface, portal axis, doorway by
  doorway; every other world answers with the straight line.
- Verifiers: `tools/bay-legacy.json` has no Ligar line left (13 -> 6 pairs: Lanternfall q4/q7, Ember q2/q4).
  `verify:ligar` gained the workings (doorways, grades, widths, rock over every roof, foot on the ground, bays inside
  chambers, cover-mask capacity, routes), the hills (no reachable cell stands on one, the route walkable from the first
  doorway on, every wall segment holds the walk out of the rock and leaves the room open), the light (a lamp in
  every working, the pool still three, only lamps, the forge and indicators are lit, the cover mask evaluated on the CPU
  as the shader does, the patch lands), furniture clear of the chamber walls (rock is ground and exempt from the overlap
  rule, so this is its own check), host footprints and the warden's ground. All `verify:*` pass and `npm run build` is green.

Differences from §3 as drafted:
- **No layered walk.** The plan's `getTerrainHeight(x, z, fromY)` is for a hill with a walkable top over a drift. Here a hill
  is not climbed: a ring of colliders closes it round except at the cuttings (`RING`), so inside its footprint the only
  floor there is is a working's, and `getTerrainHeight` answers it (`mine.floorAt`) with its two arguments. Every call
  site (`stage.js`, `aim-target.js`, `voyage.js`, `ship-exterior.js`, `world.js`, each world's own), `fpsControls` and the
  voyage keep their contract; the flood fill stays 2D (it is held to "no reachable cell stands on a hill"). If a hill is ever to be walked on, the layered walk is back on the table.
- **A portal is a cutting.** The terrain is cut away over a trench dug back into the hill's face (as the quarry's pit is),
  its walls are the hill in section following the slope, and the headwall stands over the adit's mouth. The plan's
  `mine: { portals, drifts, chambers }` is `mine.volumes` (`kind` says which; a doorway is a pair of `openings`). Drifts are
  straight segments, not polylines; roofs are rock slabs, not `lintelBeam`.
- **Chambers are 11.2 x 11 m, not 7.5 x 9.** The back wall stands 3.1 m behind the plate so that the columns' faces (up to
  0.3 m proud) clear the bay's behind volume, and 11.2 m across leaves 2.5 m a side for each host's machinery. Roof 4.4 m.
- **The hoist is the deepest, the sump is not the lowest.** Hill B's decline falls 0.1 per metre: the sump chamber is 1.2 m
  below the portal, the hoist chamber 2.4 m (and its winze goes on down). The sump is where the drainage of the decline
  gathers; the hoist is where the mine goes on from.
- **The east deck grew** to z 16.5 (the weigh deck lies beside the scale house's desk, not in front of it, so the player is
  never asked to stand on the bridge); the gantry's rail leaves the two lanes open; the batch house and its silos are gone.
- **`t1.siteDescriptions` is deleted** (read by nothing but `verify:ligar`), as on Tallow. `t2.stillCamera` regenerated.
- Hosts' declared circles are smaller than their real extents (a circle cannot both hold a 15 m yard and stay behind the
  approach); the generator's keep-out rectangles are the real extents, and the overlap and bay checks measure the bodies.

For the user to look at in the browser (not tested here): the portals' cuttings and headwalls from the yard (the terrain
hole's seam at the foot, the hill's two steps), the first lamp-lit view down the main adit, the forge's glow in the ore
drift, whether a drift is too dark between lamps (underground lamps are the one number to turn: `UNDERGROUND_LAMP` in
`ligar/mine.js`), the sump and hoist chambers on a phone (cover mask on a device with no shadow map), the guide arrow
leading in through hill A's portal, the crusher's catwalk over the bench, the substation's two plates beside the bench.

### P4 progress note — Lanternfall (2026-10-16)

Done:
- `lanternfall/stations.js` (was `sites.js`): nine host builders keyed by site id, each returning `{ group, bench, benchLocal,
  colliders }` like Tallow's and Ligar's. The shared shelter (four posts, roof, back wall) and the per-bench decor panels are
  gone. `lanternfall.js initSites()` became `initHosts()` (host colliders turned to the world, boxes and discs as in Tallow);
  `initLandmarks` and `buildColliders` skip any landmark with `host`.
- `lanternfall/host-plan.js` (pure data): each host's structure, bench `kind`, `skin`, plate and declared `extent` in its own
  frame, plus `LANE`, `WATER_HOLE` and `TENT_SPAN`. The generator keeps the scatter out of these rectangles, and
  `verify:lanternfall` builds the real world and fails a host that stands outside its declaration (or declares more than 2.5 m
  more than it builds), so the table cannot drift from the geometry.
- `tools/gen-lanternfall-layout.mjs` rewritten: hand-placed sites (all facings cardinal, the benches go round the lake in
  quest order from the south: flume, mast, sled, crawler, tent, mast, store, hole), rejection-sampled scatter from a fixed seed,
  and a REFUSAL to write if a footprint or extent collides, an approach lane is crossed, the lantern-eater's ground
  (`boss-eater`, x ±7, z 46…74) is built on, the water hole's ring is not inside the lake, the flume's intake does not reach the
  lake, or the two tent halves are not back to back. The lantern road is now laid along the walk (spawn, then each approach in
  bench order, round the tent) rather than on a ring: 29 posts.
- Hosts: 1 flume (shelf; trough on trestles with a glass front, paddle and motor, beach, strobe gantry, pump and intake pipe into
  the lake); 2 photocell housing (desk; an aurora mast, the housing at its foot with a tilted lens tube and hood, battery cabinet,
  photometer tripod); 3 spectrograph sled (shelf; runners, bed, tailgate dropped on the ice, collimator, prism, bellows camera with a
  seven-band spectrum card, camp 1 beside it); 4 crawler's lab module (desk; tracks, hull, a module whose floor is level with the plate,
  its doors lying flat against its sides, bench, shelves, stove and stack, interior lamp, cab and a drift); 5/6 records tent (desk, two
  builders, one canopy: the roof rises from each eave to a shared ridge, side walls, the board with a ladder of boxes on one face and a
  ladder of shelves on the other, filing cabinets and a stove on one side, a plan table and chart rack on the other, the work lamp
  hung on a chain); 7 detector mast (deck; grated platform, a half-ring of detectors round a sample chamber, source and beam tube, a
  watch mast beside it, lamp post); 8 tile store (shelf; racking with tiles in the periodic table's stepped shape, spares in crates,
  a raked tarpaulin on poles, camp 3); 9 cuvette sled (shelf; sled with the vial rack and boxed spectrometer, a ring of cut ice blocks round
  black water, a tripod with a pulley and bucket, the lamp hung from its head on a wire).
- Ground: terrain flats are per site (`site.flat`, written by the generator) instead of a 7.5 m disc, so every host and lane stands on
  dead-level ice; the flat is a disc round the host's extent and lane.
- 1e for Lanternfall: new materials `M.case`/`M.caseDark` (bright paint, bare metal) for the cased instrument, against frosted,
  weathered steel; `M.tarp`, `M.footing`, `M.rubber`, `M.paper` dress the hosts. No new emissive material: only the lantern is lit.
- Verifiers: `tools/bay-legacy.json` has no Lanternfall line left (6 -> 2 pairs: Ember q2/q4). `verify:lanternfall`: sites clear of every
  prop that is not their host, one host per site, host extents honest, tent halves back to back, every bench faces along an axis, level
  ice under each host, the boss's ground open, the water hole cut through the lake. `t1.siteDescriptions` was read by nothing but this
  verifier; deleted (replaced by a check on `t1.siteOrder`). `t2.stillCamera` regenerated from the approach marks.

Differences from §5 as drafted:
- **Bench 2 and bench 7 each get their own mast**, not the same one: bench 2's housing is at a mast's foot, bench 7's detector arc stands on a
  platform at another's (the plan's "platform" is at grade, as Tallow's decks are: the walk is one layer).
- **The records tent is two builders, not one**: bench 6 is the same tent turned round, so the two halves meet at the ridge and the board's
  spine with 0.1 m between, and neither owns the other's bodies (the overlap rule counts a group as one object).
- **Camps 1 and 3 are part of their hosts**, built from the same `buildCamp` the scattered camps use; three scattered camps remain.
- **The old ice crawler landmark and its builder are deleted**: bench 4's host is the crawler.
- **Bench 4's host is the widest chain of machinery** (tracks, hull, cab, drift: 11 m deep), because the crawler stands tail-on; its
  doors are shown lying flat against the module rather than open at right angles, which would stand in the work volume.

For the user to look at in the browser (not tested here): the crawler's module from the bench (its floor and the plate should read
as one surface), the tent's ridge from outside (two halves meeting), the lamp wire over bench 9, the flume's reflection of the strobe on
the lake side, the detector arc against the aurora, and the lantern road leading from the spawn to bench 1.

## 5. Lanternfall — an observatory camp on the ice (built in P4; see its progress note)

Today: nine huts on a ring round the lake, between lantern posts, six camps, sleds, an ice crawler,
four aurora masts. Proposal: the benches are the working parts of an **aurora observatory**
expedition, spread through the camps and masts instead of on a ring.

| Bench | Quest | Host |
|---|---|---|
| 1 | `q1-wave` | A **wave tank** cut into the lake edge ice: the ripple bench is its observation shelf |
| 2 | `q2-photon` | The **photocell housing at the foot of an aurora mast** |
| 3 | `q3-lines` | A **spectrograph sled** in camp 1, its tailgate the bench |
| 4 | `q4-cloud` | The **ice crawler's rear lab module**, doors open |
| 5 | `q5-numbers` | The **camp 2 records tent**: a board of boxes on the tent frame |
| 6 | `q6-filling` | The same records board's second side, under the same canopy |
| 7 | `q7-pes` | A **detector arc on an aurora mast's platform** |
| 8 | `q8-trends` | The **sample-tile racks** in camp 3's store |
| 9 | `q9-absorb` | A **cuvette sled** by the lake's open water hole |

## 6. Bellows — stations on the gas plant (proposal for review)

Today: six gantries on a ring on the cloud deck, among gasholders, a compressor tower, scoop pylons,
pipe and vent stacks. Proposal: each bench is a working point of the gas plant.

| Bench | Quest | Host |
|---|---|---|
| 1 | `q1-knocks` | The **gauge gallery** on a gasholder's lower walkway |
| 2 | `q2-laws` | The **compressor tower's piston deck** |
| 3 | `q3-ideal` | The **metering skid** where gas is weighed out of a gasholder |
| 4 | `q4-mixtures` | The **blending manifold** on a pipe rack |
| 5 | `q5-speed` | The **leak-test station** at the foot of a vent stack |
| 6 | `q6-real` | The **cold box** of the liquefier beside the compressor tower |

## 7. Ember Reach — instruments on the geothermal plant (proposal for review)

Today: seven heat-shield shelters on a 54 m ring round the hot spring. Proposal: each bench joins
the plant or vent field it is about.

| Bench | Quest | Host |
|---|---|---|
| 1 | `q1-flow` | The **heat-exchanger plates** on a wellhead |
| 2 | `q2-calorimetry` | A **sampling shelf at the hot spring's edge** |
| 3 | `q3-enthalpy` | The **habitat's boiler room**, fuel cage beside it |
| 4 | `q4-bonds` | A **fumarole sampling coil** in the vent field |
| 5 | `q5-hess` | The **separator and siphon manifold**, where steam takes two routes |
| 6 | `q6-entropy` | The **silencer pair**, where steam expands |
| 7 | `q7-gibbs` | The **turbine hall control room** |

The Crucible arena in front of the expansion loop stays where it is.

## 8. P7 — Records and retirement (completed 2026-10-22 with T7)

With every quest converted to a tabletop across all five walkable worlds and Kettle:
- Retired legacy drawn and 3D instruments: `scope3d.js`, `corebench3d.js`, `catalogue3d.js`, `assay3d.js`, `joinbench3d.js`, `lightbench3d.js`, `cloudplate3d.js`, `boxrack3d.js`, `electronbench3d.js`, `bondbench3d.js`, `pairboard3d.js`, `domainrig3d.js`, `gasrig3d.js`, `calorimeter3d.js`, `plates3d.js`.
- Retired `rackcontrols.js`, `magnetnotes.js`, `gasmount.js`, `thermomount.js`.
- Retired the station-row layout and per-instrument key banks in `bench3d.js`.
- Retired side panels (`deck`, `rail`, `controls`) from `PANEL_LAYOUT` in `frame.js`, leaving only `comms`.
- Re-baked stills (`npm run bake:stills`).
- Updated per-world records and marked integration complete.

## Risks and open questions

- **The layered walk (§3b) touches every world's height call.** It is gated behind an ignored
  argument in the other four, but the voyage and arrival paths must be re-checked with `verify:voyage`.
- **Panels in tight spaces.** CSS3D panels draw over WebGL, so a panel never disappears behind rock, but
  it can look as though it floats through a tunnel wall. Chambers are sized so the panel volume is in
  open air.
- **Performance underground.** Drifts add geometry; everything static is baked (`mergeStatic`) and the
  far mine is culled by distance from the portal.
- **Stills and T1 copy** describe the old sites. `t1.siteDescriptions` was unread in Tallow and is deleted (P1);
  the other worlds still carry it, and each phase checks whether it is read before rewriting it.
- **The per-world concepts in §5–§7 are proposals** and should be confirmed before their phase starts.
