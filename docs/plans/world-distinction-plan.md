# World distinction plan: eleven worlds that are different places

**Status:** plan written 2026-11-13. No world rebuilt yet. Progress is tracked in section 9.
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
| Bellows | No ground: platforms at several levels round gasholders, over a cloud sea | Catwalks and ramps between platforms, open drop on both sides | Inside gasholder skirts, the compressor tower's base, a cold box; under moored bladders | High white sun, dark zenith |
| Ember Reach | The inside wall of a caldera, stepping down toward a lava lake | A switchback road down the wall | Galleries cut into the caldera wall with one side open to the lake; the turbine hall | Ochre fume; the lake lights the rock from below |
| Mirrowen | A harbour: quays, a dry dock sunk below the waterline, moored hulls, sea ice to the north | Along quays, over gangways and lock gates | Aboard hulls (holds, deckhouses), boathouses on piles, the dry dock floor | Cold white morning haze |
| Kettle | One foundry building the size of the site; a slag tip outside | Through the building's bays, charge end to tapping end | The building itself: casting bays, the charge floor up a ramp, the tapping pit, a control cabin | Indoors: light shafts through the roof, one furnace source |
| Teeter | A hillside of salt terraces: pans stepping down a slope, brine spilling pan to pan | Down the dikes and stairs-as-ramps, top pan to bottom | Weir houses and sluice chambers built into each terrace wall | Bright pale afternoon, evaporation shimmer |
| Verdigris | A drowned masonry fort in a reed swamp, sightlines under 40 m | A branching boardwalk between towers, never straight for long | Tower rooms, vaulted cisterns, a flooded gatehouse | Low green-grey overcast, thick fog |
| Brinewire | A tidal barrage: a concrete wall across the marsh, impounded brine one side, a drop the other | Along the crest, then down a long ramp to the foot | Gate houses on the crest, the cell gallery inside the wall, the switchyard cage at its foot | Dry late afternoon, long shadows off the wall |
| Quicklight | A refinery packed tight on basalt under a standing storm | A grid of alleys under pipe racks | Blast bunkers banked with earth, reactor skirts, a control block | Storm dusk; lightning to the rod pylons is the weather |
| Lodestone | A winding slot canyon in banded iron, descending to a bowl | One path down the canyon, bend after bend | Alcoves under overhangs in the canyon wall, open on the canyon side | Rust dusk, light only on the upper walls |
| Thornmere (unbuilt) | To claim: must not be flat, a ring, or any landform above | | | |
| Cinder Halo (unbuilt) | To claim | | | |

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
| Groundwork G1 to G5 | | | | | | |
| Kettle | | | | | | |
| Lodestone | | | | | | |
| Teeter | | | | | | |
| Verdigris | | | | | | |
| Brinewire | | | | | | |
| Quicklight | | | | | | |
| Ember Reach | | | | | | |
| Mirrowen | | | | | | |
| Bellows | | | | | | |
| Lanternfall | | | | | | |
| Tallow | | | | | | |

Each run fills its row with a date, and appends below any place where the build parted from section 6
and why.

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
