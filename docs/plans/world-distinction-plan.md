# World distinction plan: eleven worlds that are different places

**Status:** plan written 2026-11-13. Groundwork and Kettle (the pilot) are built and measured; the owner has not yet seen Kettle. Progress is tracked in section 9.
**Owner's brief:** the walkable worlds read as one world in different colours. Ligar is the only one that
is right: its terrain is its own, and its benches are found inside the quarry's workings and the mine's
chambers. Every other world is too simple, and its benches are furniture standing on open ground.
**The prompt that rebuilds one world:** `docs/world-rebuild-prompt.md`.

This plan changes the 3D site only: ground, sky, hosts, layout, props, the world's checks. It changes no
quest, stage, kit, bank entry, label or story line.

---

## 1. What is wrong, measured

`node tools/world-shape.mjs` builds every world headlessly and prints the table below (2026-11-13).

| World | Benches | Ground under the benches | Relief on the way to them | Benches housed | Code in `src/three/<world>*` |
| :--- | :---: | :--- | :---: | :---: | ---: |
| Tallow | 6 | -5.60 to 0.13 m | 5.75 m | 1 | 8,351 lines |
| Lanternfall | 10 | all at 0.00 | 0.64 m | 0 | 2,329 |
| **Ligar** | 9 | -2.60 to 0.89 m | 21.55 m | **7** | 10,442 |
| Bellows | 6 | all at 0.00 | 0.00 m | 0 | 2,197 |
| Ember Reach | 7 | all at 0.00 | 0.44 m | 0 | 3,895 |
| Mirrowen | 7 | all at 0.00 | 0.30 m | 0 | 2,658 |
| Kettle | 8 | all at 0.00 | 0.22 m | 0 | 1,353 |
| Teeter | 8 | all at 0.00 | 0.34 m | 0 | 1,400 |
| Verdigris | 8 | all at 0.00 | 0.52 m | 0 | 1,478 |
| Brinewire | 6 | all at 0.00 | 0.55 m | 0 | 1,518 |
| Quicklight | 6 | all at 0.00 | 0.10 m | 0 | 1,031 |
| Lodestone | 6 | all at 0.00 | 0.16 m | 0 | 998 |

"Housed" means a roof overhead and at least four of eight compass directions closed within 12 m, measured
at the mark where the player stands to use the bench. "Relief" is the range of ground height on straight
lines from the spawn to each bench (Ligar's figure includes hills the player walks round, not over).

Three findings:

1. **Ten of eleven worlds are one flat plate.** Outside Ligar and Tallow's one pit, every bench in the
   product stands at exactly 0.00 m and the ground on the way to it moves by less than 0.7 m.
2. **No bench outside Ligar is inside anything.** Each host is a machine standing behind a plate in the
   open (0 to 3 directions closed, no roof). The player sees every bench from the spawn.
3. **Six worlds are one template.** Kettle, Teeter, Verdigris, Brinewire, Quicklight and Lodestone each
   put their benches in two columns at x = ±42 (Lodestone ±24) either side of a straight north-south road,
   at even spacing, with a pad at one end, a boss plaza at the other, a lane of about 40 lamp posts, and
   heaps, stacks and tanks filling the gaps. Teeter and Verdigris have their benches on identical
   coordinates; so do Brinewire and Quicklight. `brinewire/terrain.js` differs from `verdigris/terrain.js`
   in 13 of 158 lines. The ring worlds (Ember Reach, Mirrowen: every bench on one circle of 54 or 44 m)
   are the template's older form.

### Why it happened

- Each world after Ember Reach was built by copying the last one (`docs/world-build-prompt.md` names
  Ember Reach and Bellows as the files to copy, and gives the walkable world one bullet in Phase 4).
- The per-world checks hold the template in place: `verify-kettle.mjs` and its siblings require level
  ground under every host and lane, a lamp lane from the spawn to every approach, and props inside a
  100 m disc. They measure that a world is safe, and nothing measures that it is a place.
- A host was defined as "the machine a bench is bolted to". That rule stopped benches being bare tables,
  and stopped there: the machine still stands on a plain.

---

## 2. What Ligar does (the reference)

Read these before designing anything; a rebuilt world needs each of these properties, in its own form.

| Property | How Ligar gets it | Files |
| :--- | :--- | :--- |
| The land has a shape you walk through | Hills are added to the one height field and closed off with collider rings, so they are walls, and the way in is a cutting dug into the hill's face | `ligar/mine-plan.js` (`hillHeight`, `ringColliders`), `ligar/terrain.js` |
| Benches are found, not seen | A mine is a set of volumes (cutting, drift, chamber) that meet at doorways; five benches stand in chambers at the end of drifts, four in surface workings of the quarry | `ligar/mine-plan.js`, `ligar/mine.js`, `ligar/stations.js` |
| Inside is dark, and lit by its own lamps | A cover mask takes the sun and the sky out of every fragment inside a working, so a drift is dark on a phone with no shadow map; lamps come from the fixed pool | `ligar/atmosphere.js` (`setLigarCover`), `lamp-pool.js` |
| The ground is not a texture on a plate | The ground shader draws the column tops, dust in the joints, standing rain and haul ruts per pixel; cliffs show the columns in section | `ligar/terrain.js`, `ligar/basalt.js` |
| Rock and plant have real form | Voronoi column kit, structural steel built from sections, weathering applied once to everything | `ligar/basalt.js`, `ligar/plant.js`, `ligar/surfaces.js` |
| There is a far country | Spires, a natural arch, a smelter, a power line and a dragline beyond the walk | `ligar/vista.js`, `ligar/industry.js` |
| The site has levels | Bench ground from -2.6 m (the sump, down a decline) to +0.9 m | `world-data/ligar.json` (`sublevel`, `mine`) |

Build records: `docs/plans/tallow-ligar-world.md` section 4 ("What made it read as a toy") and
`docs/archive/2026-11-06/passes/bench-integration.md` (how the hosts and the mine were laid out).

---

## 3. The standard a rebuilt world is held to

A world is done when all of these hold. The first five are measured; the last two are the owner's to judge.

1. **Its own signature.** The world's row in section 6 names a landform, a walk shape, a bench housing and
   a light. No other world's row repeats any of the first three.
2. **Its own layout.** No bench shares coordinates with a bench in another world, the benches are not on
   one circle, and they are not in two straight columns (`world-shape.mjs` prints clones; the world's own
   verify script holds the other two).
3. **The ground has levels.** Bench ground spans at least 3 m across the world, and the walk between
   benches goes up or down a grade the player can feel, unless the world's signature is flatness (Tallow)
   or a built deck (Bellows), in which case the levels come from the structure.
4. **Benches are housed.** At least two thirds of the benches read `R4` or better in `world-shape.mjs`,
   and the rest stand in a working that closes at least three directions. From the spawn, at most two
   plates are in view.
5. **Nothing regresses.** `verify:<world>`, `verify:bench`, `verify:arena`, `verify:voyage` and
   `verify:learn` are green; draw calls and triangles in `tools/perf-worlds.mjs` stay inside the budget in
   section 4; every site id, quest id, label and bench anchor contract is unchanged.
6. **One sentence tells it apart.** A player who has seen two worlds can say what each one is without
   naming a colour ("the one inside the foundry", "the one down the canyon").
7. **Each bench belongs where it stands.** Standing at the plate, what is around the player is the piece
   of the world that the bench's chemistry is about.

---

## 4. Engine constraints every rebuild keeps

From `docs/engineering/engine-and-worlds.md` ("Worlds, ship, voyage") and the code. None is waived.

- **One analytic height field, one floor.** The walk, the landing solver and the checks stand on
  `getTerrainHeight(x, z)`. There is never a walkable floor above another walkable floor. A roof, a
  gallery overhead, a pipe rack or a deck above the player is a body, never ground. Levels are made by
  ramps, grades, cuttings and sunk floors.
- **High ground is closed.** A hill, cliff or mesa the player must not climb gets a collider ring; the
  flood-fill check in the world's verify script proves no ledge can be walked off.
- **The bay envelope.** Every bench is `buildBayBench` (`three/bench-bay.js`), and `bayBoxes()` stay
  empty: machinery to the sides (|x| > 2.8), behind the plate (z < -2) or above 2.4 m. A room must be at
  least as large as Ligar's chamber (11.2 × 11 m, roof 4.4 m) so the lean-in camera has air.
  `verify:bench` measures it and `tools/bay-legacy.json` stays empty.
- **Only lamps are lit**, from a `LampPool` with a fixed light count. No `PointLight` per fixture. A fire
  or molten metal is one declared source, as Ligar's forge is.
- **Frame cost.** Static props go through `mergeStatic` and `consolidateStatic`; movers stay `noMerge`.
  Budget per world at T4, as `tools/perf-worlds.mjs` prints it headlessly: at most 900k triangles and at most 566 draws
  (Ligar's own figures on 2026-11-13: 867k and 566; Kettle today is 93k and 285). Shadow maps rest when idle.
- **Arrival and the boss.** The landing pad, the spawn, `BOSS_ARENA_SPOTS[<boss>]` (open, level ground with
  the boss in view) and the voyage's landing solution must still solve. Site ids stay `site-N`; a site's
  `label` and `questId` do not change; a site faces its `approachPos`.
- **Lower tiers.** `3D Off` draws no world. The JSON's `t2` still cameras and `t1` data must be
  regenerated for the new layout.
- **Archive, never delete.** Replaced modules, generators and checks move to `archive/<date>/` with a
  README. A check that enforced the old template is replaced by one that enforces the new shape; it is
  not removed.

---

## 5. Shared groundwork (built once, by the pilot)

The pilot world (Kettle, section 7) builds these as its first phase, because a shared layer written
before a second world needs it is a guess. Ligar must keep passing `verify:ligar` unchanged throughout.

| Item | What | Where |
| :--- | :--- | :--- |
| G1 | **Workings layer.** Lift the world-neutral half of `ligar/mine-plan.js` (volumes with floors, doorways, wall segments, wall colliders, jambs, clearance boxes, terrain holes, the guide's route through doorways) into a shared module; `mine-plan.js` re-exports it and keeps the hills and the basalt constants | `src/three/lib/workings.js` |
| G2 | **Cover mask for stock materials.** The template worlds use `THREE.Fog` and unpatched materials, so a roofed room would still be lit by the sky. Lift Ligar's cover test (`ligarCover`, `setLigarCover`) into a shared patch that removes sun and sky light inside declared boxes, and apply it in each rebuilt world | `src/three/lib/cover.js` |
| G3 | **Shape checks.** One library the per-world verify scripts call: bench ground span, housed count, no cloned coordinates, not-a-ring, not-two-columns, plates in view from the spawn, single floor (no walkable cell under a body lower than 2.4 m except declared doorways) | `tools/lib/world-shape-checks.mjs` |
| G4 | **Reading aids cover all twelve worlds.** Done 2026-11-13: Quicklight and Lodestone added to `tools/perf-worlds.mjs` and `tools/perf-bench-rest.mjs`. | `tools/` |
| G5 | **Docs.** `docs/world-build-prompt.md` Phase 0 item 5 already points new worlds at this plan; `engine-and-worlds.md` gains the workings and cover layers once they exist | `docs/` |

`tools/world-shape.mjs` (the measurement behind section 1) already exists.

---

## 6. The signature table

No two rows may share a landform, a walk shape or a bench housing. Rows for worlds not yet built
(Thornmere, Cinder Halo) are claimed here before their spec is written.

**These concepts are proposals. Owner: change any row before sending that world's prompt; the prompt
tells the agent the row is the brief.** Two rows change what a place is called in the lore and need a yes:
Brinewire (a barrage across the marsh) and Verdigris (a drowned fort).

| World | Landform | Walk shape | Bench housing | Light (kept from the built sky unless noted) |
| :--- | :--- | :--- | :--- | :--- |
| Tallow | Dead-flat salt pan to a mirror horizon; one excavated pit | Along the process line, brine to bagged salt | Inside the plant's own buildings: evaporator hall, tower base, control house, bagging shed, the pit | White high-altitude glare, ice halo |
| Lanternfall | A glacier tongue running down to a frozen lake; crevasse field, pressure ridges | Round the lake shore, with spurs cut down into the ice | Ice: a crevasse lab down a cut ramp, caves under pressure ridges, the dome, the crawler's cabin | Polar night, aurora |
| **Ligar** (reference, unchanged) | Basalt plateau, trap-bench hills, a quarry cut | Hub at the quarry, adits into two hills | Mine chambers and quarry workings | Dusk, low amber sun |
| Bellows (built 2026-11-18) | No ground: steel decks on lattice legs at seven heights (-8 to +12 m) round a sphere on its skirt, a piston holder, the Compressor's tower, a cold box and two bladders, over a cloud sea 38 m and more below | A hub (the apron) and five arms of 4 m catwalks and 1-in-5 ramps over the drop, railed on both sides | Inside the sphere's skirt, the tower's base hall, the meter house inside the piston holder under the parked piston, the gondola hung under the moored bladder, under the bladder hauled down onto its cradle (the bag is the roof), the cold box's foot | High white sun, dark zenith; indoors under a cover mask, lamps only |
| Ember Reach | The inside wall of a caldera, stepping down toward a lava lake | A switchback road down the wall | Galleries cut into the caldera wall with one side open to the lake; the turbine hall | Ochre fume; the lake lights the rock from below |
| Mirrowen (built 2026-11-18) | A harbour: quay walls 2.6 m above the water round a basin, a mole, a dry dock sunk 7 m (4.4 m below the waterline), an ice-breaker and a tanker moored and a freighter frozen into the canal, sea ice to the north | A ring of right-angled quays joined by two gate walks over water (the canal's lock gate, the dry dock's gate), gangways up onto three decks, companionways down inside the hulls | Aboard hulls (a deckhouse, a tanker's pump room, a hold, an evaporator flat), two boathouses on piles (a thaw shed, a salt store), a pump well off the dry dock's floor | Cold white morning haze; indoors under a cover mask, lamps only |
| Kettle (built 2026-11-13) | One foundry building the size of the site, floors at five levels inside it; a slag tip and an ore stock outside | Up one crane aisle from the charge door to the cast house, bays opening off it, two ramps up and two down | The building itself: stores, scale bay, control cabin on a plinth, sump cellar, charge bank up a ramp, pickling bay, tapping pit, refining bay | Indoors under a cover mask: shafts through louvred bands high in the west walls and the charge door, one furnace source |
| Teeter (built 2026-11-16) | A west-facing hillside of salt terraces: five levels of pans 5.5 m apart behind masonry walls, brine spilling pan to pan; spurs close the valley's head | One stair straight down the fall line (four ramps through four walls), a level dike branching off its foot on each terrace: a comb, not a switchback | Rooms dug into the terrace walls under the pans (the pans' floor is the roof), entered by a passage through the wall; two are weir houses standing up among the pans | Bright pale afternoon, evaporation shimmer; indoors under a cover mask, the sun in at each door |
| Verdigris (built 2026-11-16) | A drowned masonry fort in a reed swamp: a flooded ward inside a broken curtain, towers and cistern heads out of the water, a moat round it; sightlines closed by reeds, walls and fog | A branching boardwalk on piles from a landing stage in the reeds, over the moat bridge, through the gatehouse, then a trunk with branches between the towers; no plank run longer than 22 m, ramps up to tower doors, stairs down into cisterns | Tower chambers (three towers and the keep's hall) above the water, three vaulted cisterns sunk below it, the flooded gatehouse's winch chamber | Low green-grey overcast, fog from 4 m gone at 220 m; indoors under a cover mask, the sun in only at doors that face it and open onto a deck |
| Brinewire (built 2026-11-17) | A tidal barrage: a concrete wall across the marsh between two headlands, impounded brine 10 m up its west face, a 12 m drop to the tailrace and the tidal flats on its east | Along the crest road, then down one long ramp on the wall's east face (two flights, a landing at the gallery's level) to the foot | Gate houses on piers off the crest over the lagoon, three cell chambers off a gallery inside the wall (entered by an adit from the landing), the switchyard's rectifier cage against the wall at its foot | Dry late afternoon, the east side in the wall's long shadow; indoors under a cover mask, the low sun in only through each gate house's south window |
| Quicklight (built 2026-11-17) | A refinery packed tight onto two young basalt lava flows under a standing storm; the upper flow's 5 m front crosses the site, the tank bund sunk 4 m | A grid of ten alleys under pipe racks (eleven junctions), one grid on each flow, joined by one ramp cut up through the front | Two bunkers sunk under banked earth (analyser, catalyst), inside the cracking reactor's skirt, under the reactor train's table, the control block, a pump cellar in the tank bund | Storm dusk; lightning to the rod pylons is the weather, the sky and the fill rising with each strike; indoors under a cover mask, lamps only |
| Lodestone | A winding slot canyon in banded iron, descending to a bowl | One path down the canyon, bend after bend | Alcoves under overhangs in the canyon wall, open on the canyon side | Rust dusk, light only on the upper walls |
| Thornmere | An archipelago of pitch mounds in a tar lake, each higher than the last | A zigzag chain mound to mound over root ridges, with two side branches | Inside the trees: hollow stumps, a root vault, a fallen hollow trunk, a pit under a stump's roots | Grey daylight under a high dead canopy; mist on the tar |
| Cinder Halo | An impact-crater field: one great crater with smaller craters punched into its wall, each floor lower than the last | Down crater by crater through cuttings in the rims, spiralling inward and down round the great crater to its floor | Shielded concrete cells built into each crater's wall, entered by a dog-leg maze | Ash dusk under the planet's ring arcing across the sky; filament lamps inside the cells |

---

## 7. Order and size

One world per agent run, one at a time (the shared files `stage.js`, `voyage.js`, `worlds3d.js`,
`boss-arena.js`, `package.json` and the shared libs are touched by every run).

| # | World | Tier | Why here |
| :---: | :--- | :--- | :--- |
| 1 | **Kettle** (pilot) | Full rebuild + groundwork G1 to G5 | Smallest code, pure template, and an indoor world exercises the workings layer and the cover mask hardest |
| 2 | Lodestone | Full rebuild | Already a canyon in outline; proves alcoves (a roof with an open side) on the shared layer |
| 3 | Teeter | Full rebuild | Proves graded levels without rooms; un-clones it from Verdigris |
| 4 | Verdigris | Full rebuild | |
| 5 | Brinewire | Full rebuild | Un-clones it from Quicklight |
| 6 | Quicklight | Full rebuild | |
| 7 | Ember Reach | Re-terrain + rehouse | Its caldera rim, lake and plant exist; the walk moves onto the wall |
| 8 | Mirrowen | Re-terrain + rehouse | Its basin, canal, hulls and ice exist |
| 9 | Bellows | Re-terrain + rehouse | The deck becomes several |
| 10 | Lanternfall | Re-terrain + rehouse | Ten benches: the most hosts to rebuild |
| 11 | Tallow | Rehouse only | Its ground and plant are already detailed; five benches move indoors |

- **Full rebuild:** new terrain, layout generator, host plan, hosts, plant, atmosphere detail, vista and
  verify script. The old modules are archived.
- **Re-terrain + rehouse:** the sky, textures and the best props are kept; the height field, the layout
  and every host are redone.
- **Rehouse only:** the ground stays; hosts and their surroundings are rebuilt.

After world 3, re-read the standard in section 3 against what the owner said about worlds 1 to 3 and
amend it before continuing.

---

## 8. What one world's rebuild consists of

The steps are spelled out in `docs/world-rebuild-prompt.md`. In outline:

1. **Measure and read.** `world-shape.mjs` and `perf-worlds.mjs` for the world as it stands; Ligar's files.
2. **Site spec** in the world's `docs/plans/<world>-world.md` (a new section): a plan drawing in words and
   coordinates, a section through the levels, one paragraph per bench saying what encloses it and why that
   place fits its chemistry, the walk from spawn to each bench in order, the boss ground, the vista, and
   the signature row checked against every other row.
3. **Ground first**: height field, levels, closed high ground, the walk proven by flood fill, with
   placeholder boxes where the hosts will be.
4. **One host end to end**, the hardest one, with its room, lamps, cover and bay clearance, then the rest.
5. **Plant, ground shader, vista, effects.**
6. **Checks rewritten** to hold the new shape; all world scripts green; perf inside budget.
7. **Docs and the owner's viewing list**: where to stand and what should be seen from there.

No agent looks at the result in a browser. The run ends with a list of views for the owner to judge.

---

## 9. Progress

| World | Spec | Ground | Hosts | Plant and vista | Checks | Owner has seen it |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Groundwork G1 to G5 | n/a | n/a | n/a | n/a | 2026-11-13 (G1 to G5 built; see below) | n/a |
| Kettle | 2026-11-13 | 2026-11-13 | 2026-11-13 (8 of 8 housed) | 2026-11-13 | 2026-11-13 (`verify:kettle` rewritten) | not yet |
| Lodestone | 2026-11-14 | 2026-11-14 | 2026-11-14 (6 of 6 housed) | 2026-11-14 | 2026-11-14 (`verify:lodestone` rewritten) | not yet |
| Teeter | 2026-11-16 | 2026-11-16 | 2026-11-16 (8 of 8 housed) | 2026-11-16 | 2026-11-16 (`verify:teeter` rewritten) | not yet |
| Verdigris | 2026-11-16 | 2026-11-16 | 2026-11-16 (8 of 8 housed) | 2026-11-16 | 2026-11-16 (`verify:verdigris` rewritten) | not yet |
| Brinewire | 2026-11-17 | 2026-11-17 | 2026-11-17 (6 of 6 housed) | 2026-11-17 | 2026-11-17 (`verify:brinewire` rewritten) | not yet |
| Quicklight | 2026-11-17 | 2026-11-17 | 2026-11-17 (6 of 6 housed) | 2026-11-17 | 2026-11-17 (`verify:quicklight` rewritten) | not yet |
| Ember Reach | 2026-11-18 | 2026-11-18 | 2026-11-18 (7 of 7 housed) | 2026-11-18 | 2026-11-18 (`verify:ember` rewritten) | not yet |
| Mirrowen | 2026-11-18 | 2026-11-18 | 2026-11-18 (7 of 7 housed) | 2026-11-18 | 2026-11-18 (`verify:mirrowen` rewritten) | not yet |
| Bellows | 2026-11-18 | 2026-11-18 | 2026-11-18 (6 of 6 housed) | 2026-11-18 | 2026-11-18 (`verify:bellows` rewritten) | not yet |
| Lanternfall | | | | | | |
| Tallow | | | | | | |
| Thornmere (new world) | 2026-11-14 | 2026-11-14 | 2026-11-14 (6 of 6 housed) | 2026-11-14 | 2026-11-14 (`verify:thornmere`) | not yet |
| Cinder Halo (new world) | 2026-11-14 | 2026-11-14 | 2026-11-14 (6 of 6 housed) | 2026-11-14 | 2026-11-14 (`verify:cinderhalo`) | not yet |

Each run fills its row with a date, and appends below any place where the build parted from section 6
and why.

**Bellows, 2026-11-18 (branch `site/bellows`).** Built as the row (updated above) says. `world-shape.mjs`: bench ground -8.00 to 12.00 m
(20.0 m, six floor levels), relief 58.0 m (it counts the cloud sea under the gaps between decks), housed 6 of 6 (R7 R7 R7 R7 R7 R8), no cloned
coordinates, no plate in view from the spawn. `perf-worlds.mjs`: 252 draws, 302k triangles (before: 201 and 106k). It uses the shared layers as
they are: `lib/workings.js` (23 volumes: open decks, catwalks and ramps, roofed rooms and passages, `outdoorDoors`) and `lib/cover.js` (9 boxes,
one of them the piston holder's whole foot, which is seen over the meter house's low partitions; no openings). New and world-local: the height
field off every volume is the cloud sea, so every edge must be closed, and the rails are found rather than listed (`works-plan.js` `withRails`
looks past every side of every open volume a quarter metre at a time and rails any span with the drop behind it); the flood fill's "every
reachable cell is in a volume" is the check that holds it. Departures: none from the row; the walk is a hub with five arms, which no other row
uses. For the next world: a round structure round a rectangular room leaves an unreachable ring between them that is seen from inside, so
cover the whole structure, not only the room; a room hung in the air (the gondola) needs no legs and must have none. Spec, build record and the
owner's viewing list: `docs/plans/bellows-world.md`, "Site rebuild (2026-11-18)".

**Mirrowen, 2026-11-18 (branch `site/mirrowen`).** Built as the row (updated above) says. `world-shape.mjs`: bench ground -7.00 to
1.20 m (8.2 m, seven floor levels), relief 15.0 m, housed 7 of 7 (R7 R8 R7 R8 R6 R7 R8), no cloned coordinates, no plate in view from
the spawn. `perf-worlds.mjs`: 292 draws, 283k triangles (before: 265 and 132k). It uses the shared layers as they are: `lib/workings.js`
(31 volumes in four kinds: ground volumes the terrain draws, decks the terrain is cut away under, rooms and roofed passages; `outdoorDoors`,
`pass: false` kerbs, railings, bulwarks, windows and one open bay) and `lib/cover.js` (10 boxes, no sun openings). Departures: the row's
"lock gates" are two gates, the canal's lock gate and the dry dock's gate; Bench 3 stands in the pump well that opens off the dry dock's
floor, not on the open floor (it is housed and still reached across the floor); the walk is a ring round the basin, which Lanternfall's
row also walks round water, so the two are told apart by built quay edges against a natural shore and by gangways up onto decks. For the
next world: a room aboard a ship is a volume inside the hull's plan with the deck cut away round it; a passage sloping down under a deck
needs a roof that follows its floor and then runs flat under the deck, or the deck is holed at its low end; a host that sets `side` or a
colour on a material from the world's `M` changes every body that shares it. Spec, build record and the owner's viewing list:
`docs/plans/mirrowen-world.md`, "Site rebuild (2026-11-18)".

**Ember Reach, 2026-11-18 (branch `site/ember`).** Built as the row says: the north-facing inside wall of a volcanic caldera stepping down 24 m across five levels (6 m per step) in a four-ramp switchback road with four hairpins toward a lava lake 20 m below Level 4; six rock-cut geothermal galleries (five distinct open-sided rock/sinter/brick/gantry/baffle architectures, two oriented sideways with 7.6 m railed lake-viewing bays) plus the enclosed gabled Turbine Hall at the foot. `world-shape.mjs`: bench ground 0.00 to 18.00 m (18.0 m, four levels), relief 24.15 m, housed 7 of 7 (R7 R7 R7 R7 R7 R7 R7), no cloned coordinates, 0 plates in view from spawn. `perf-worlds.mjs`: 369 draws, 141k triangles, 166 ms build (before: 464 draws, 250k triangles, 388 ms). Uses `lib/workings.js` (28 volumes: 14 open road/ramp/yard volumes, 7 doors, 7 rooms; `pass: false` 1.05 m railings along every lake-facing drop) and `lib/cover.js` (14 boxes, per-room sky residual 0.20–0.42). Departures: terrace steps were raised from 5 m to 6 m (1-in-5 ramps) so every gallery roof tucks cleanly below the terrace rail above it; `ember/terrain.js` retains `{ fbm2, buildRibbon, buildDisc }` exports for Mirrowen. Spec, build record and owner's viewing list: `docs/plans/ember-reach-world.md` ("Site rebuild (2026-11-18)").

**Quicklight, 2026-11-17 (branch `site/quicklight`).** Built as the row (updated above) says. `world-shape.mjs`: bench ground -4.00 to
5.00 m (9.0 m, five levels), relief 13.6 m, housed 6 of 6 (R8 R7 R7 R7 R7 R8), no cloned coordinates, no plate in view from the spawn.
`perf-worlds.mjs`: 268 draws, 662k triangles (before: 116 and 163k). It uses the shared layers as they are: `lib/workings.js` (the walk
is 19 open volumes and 12 roofed ones, `outdoorDoors`) and `lib/cover.js` (12 boxes, no openings). Departures: one bench is in a pump
cellar in the sunk tank bund, which the row does not name; the Flare's mark is due north of the boss, because `verify:arena` holds the
arena table's collider as an axis-aligned box. For the next world: a roof member at 4.4 to 4.6 m across a plate's line stands in the
lean-in camera's box (it reaches 4.6 m); `verify:arena` only passes a boss mark that faces along z; a unit packer needs a finer second
pass along the alleys or the blocks read open at eye height. Spec, build record and the owner's viewing list:
`docs/plans/quicklight-world.md` section 7.

**Brinewire, 2026-11-17 (branch `site/brinewire`).** Built as the row (updated above) says. `world-shape.mjs`: bench ground 0.00 to
12.00 m (12.0 m, three levels), relief 12.6 m, housed 6 of 6 (R7 R7 R8 R8 R8 R7), no cloned coordinates, no plate in view from the
spawn. `perf-worlds.mjs`: 280 draws, 247k triangles (before: 369 and 212k). It uses the shared layers as they are: `lib/workings.js`
(the walk is volumes, `outdoorDoors`) and `lib/cover.js` (14 boxes, two windows). Departures: the north yard runs the wall's full
width so the landing ground stands over the drop (from the crest road the 27 m deck hides the foot); the edges over the tailwater
side are kerbs and railings, not parapets (a solid parapet hid the drop from a player standing at it); the gate houses take the sun
through south windows (a west window's light landed past the door). For the next world: a parapet on a raised walk must not reach
the eye, and a drop is only seen over a railing; test a view by ray from the eye at the edge before claiming it. The row's "needs
a yes" on lore: the run was sent with this row as its brief, and `saga.js`'s marsh pools, cells and pylons fit the barrage
unchanged. Spec, build record and the owner's viewing list: `docs/plans/brinewire-world.md` section 9.

**Verdigris, 2026-11-16 (branch `site/verdigris`).** Built as the row (updated above) says. `world-shape.mjs`: bench ground -3.60 to
4.40 m (8.0 m), relief 8.0 m, housed 8 of 8 (R8 R7 R7 R7 R8 R7 R7 R8), no cloned coordinates (before: Teeter's first site's), no plate in
view from the spawn. `perf-worlds.mjs`: 331 draws, 284k triangles (before: 351 and 203k). It uses the shared layers as they are:
`lib/workings.js` (the walk is volumes; doorways declared as linked pairs that must share a wall) and `lib/cover.js` (18 boxes, three sun
openings). Departures: the twin cistern's still-full cell is sunk 2 m deeper than the room so its water shows over a parapet below the eye;
the sun comes in only at doors that face it and open onto a deck (a stair's foot is under a roof). For the next world: cut a water sheet away
over anything hollow below it; a door's sun opening needs open ground on its far side; the strip behind a plate set 3 m from the wall is
0.65 m deep. The standard in section 3 was not re-read against the owner's view (section 7): the owner has not yet seen Kettle, Lodestone or
Teeter. Spec, build record and the owner's viewing list: `docs/plans/verdigris-world.md` section 8.

**Teeter, 2026-11-16 (branch `site/teeter`).** Built as the row (updated above) says. `world-shape.mjs`: bench ground 0.00 to 16.50 m
(16.5 m), relief 22.0 m, housed 8 of 8 (R7 R8 R7 R7 R7 R7 R7 R7), no cloned coordinates (before: Verdigris's), no plate in view from the
spawn. `perf-worlds.mjs`: 401 draws, 263k triangles (before: 390 and 184k). It uses the shared layers as they are: `lib/workings.js`
(the whole walk and the rooms are volumes; the walk's walls are its colliders) and `lib/cover.js` (16 boxes, a door opening per room).
Departures: the walk shape is a comb (one stair, level dikes branching off), so it is not a second switchback beside Ember Reach's row;
the sun comes into the rooms through their doors, not down a shaft (the sun is 14 degrees up). For the next world: a fixture placed from
a room's middle lands on the plate; test height as well as plan wherever ground runs under a body. The standard in section 3 was not
re-read against the owner's view (section 7) because the owner has not yet seen Kettle, Lodestone or Teeter. Spec, build record and the
owner's viewing list: `docs/plans/teeter-world.md` section 9.

**Cinder Halo, 2026-11-14 (branch `world/unit14`).** Built new as the row says. `world-shape.mjs`: bench ground -12.50 to -2.00 m (10.5 m),
relief 20.58 m, housed 6 of 6 (R8 R8 R8 R8 R8 R8), no cloned coordinates, no plate in view from the spawn. `perf-worlds.mjs`: 142 draws,
152k triangles. It uses the shared layers as they are: `lib/cover.js` (`makeCover`, twelve boxes: six cells and six vestibules) and
`tools/lib/world-shape-checks.mjs`; `lib/workings.js` was not needed (each cell is its host's own body on a crater floor). New and
world-local: a height field that is the lowest of the plain and every crater floor's and cutting's wall rise, so floors are flat and
every wall rises from the walk; a dog-leg vestibule on every cell, checked by a ray from outside the vestibule to the plate. Spec,
build record and the owner's viewing list: `docs/plans/cinderhalo-world.md` section 8.

**Thornmere, 2026-11-14 (branch `world/unit13`).** Built new, not rebuilt: there was no site before. `world-shape.mjs`: bench
ground 1.00 to 4.80 m (3.8 m), relief 6.40 m, housed 6 of 6 (R7 R8 R6 R7 R4 R7), no cloned coordinates. `perf-worlds.mjs`:
172 draws, 150k triangles. It uses its own cover mask (`thornmere/cover.js`) and shape checks (`tools/lib/thornmere/`), written
before the shared G2 and G3 layers reached its branch; moving onto them is a follow-up. Spec and build record:
`docs/plans/thornmere-world.md` section 6 and 8.

**Lodestone, 2026-11-14 (branch `site/lodestone`).** Built as the row says. `world-shape.mjs`: bench ground -13.0 to -2.0 m
(11 m), relief 29.7 m, housed 6 of 6 (R6 R6 R6 R5 R6 R6), no cloned coordinates, no plate in view from the spawn.
`perf-worlds.mjs`: 170 draws, 306k triangles (before: 199 and 181k). It uses the shared layers as they were: the alcoves are
`lib/workings.js` volumes with one `to: null` opening (`outdoorDoors`); `lib/cover.js` covers the canyon runs, the pothole
and the alcoves below their rims with a per-box sky residual. New and world-local: the walk as a union of shapes with an
inside depth, closed by a collider on every 0.5 m edge cell and faced by a rock sheet traced round the edge (marching
squares), and rock coloured by height in the world. For the next world: keep 7 m of rock between any two parts of a walk
(thinner, and the faces' lips land in the other part), hold the ground at the floor for longer than a grid cell's diagonal
past the walk's edge, and turn a host's box colliders as boxes when it faces along an axis. `tools/glsl-check.mjs` compiles a
world's patched shaders offline (`glslangValidator`); the cover mask's GLSL now has that evidence. Spec, departures and the
owner's viewing list: `docs/plans/lodestone-world.md` section 7.

**Groundwork, 2026-11-13 (branch `site/kettle`).** G1 `src/three/lib/workings.js`, G2 `src/three/lib/cover.js`,
G3 `tools/lib/world-shape-checks.mjs` are built; G4 was already done; G5 is the "Shared site layers" entry in
`docs/engineering/engine-and-worlds.md`. Ligar is unchanged: its plan outputs (walls, colliders, holes, cover
boxes, ring, routes) compare identical before and after, its cover shader text hashes the same,
`verify:ligar` is green and `perf-worlds.mjs ligar` prints 566 draws and 867k triangles as before.
Kettle then used all of it: `makeCover` (17 boxes, 4 openings) and the workings opt-ins (`roof`, `outdoorDoors`, `pass: false`).

---

## 10. Risks

- **Nobody sees it until the owner does.** Every geometric property is measured in Node; whether a place
  feels like a place is not. The pilot is one world for that reason: judge Kettle before starting world 2.
- **Rooms and the lean-in camera.** A wall or roof inside the bay envelope blocks the bench view.
  `verify:bench` catches bodies in the envelope; it does not catch a room that is merely cramped. Hold
  the minimum room size in section 4.
- **Dark rooms on phones.** Handsets have no shadow map, so without the cover mask (G2) a roofed room is
  as bright as outdoors. A rebuilt world is not done until its rooms are covered.
- **Finding a hidden bench.** Housing benches makes them harder to find. The guide arrow must route
  through doorways (G1), and the lamp lane to each approach stays a check.
- **Cost.** Ligar is ten times the code of a template world. Expect each full rebuild to be a long run;
  the tiers in section 7 are the estimate of relative size.
- **Lore.** A changed landform must still match the world's `place`, its foes and its story lines
  (`docs/story/bible.md`). Brinewire and Verdigris change the most.

**Kettle, 2026-11-13 (branch `site/kettle`).** Built as the row said, with three departures, each written into the row above:
(1) the light shafts come through louvred bands high in the west walls and through the charge door, not through the roof,
because the built sky's sun stands 25 degrees up in the west-south-west and a roof slot's light would land on a wall;
(2) a second closed heap, the ore stock, stands east of the works; (3) the bench housing is eight named bays
(the row's "casting bays" are the stores, scale, pickling and refining bays). Measurements and the owner's viewing list:
`docs/plans/kettle-world.md` sections 11.10 to 11.12. For the next world: the shared layers held without change after the
pilot's opt-ins; the things that cost time were ramps (entered only at their ends), the arena's clear ring, and door jambs.
