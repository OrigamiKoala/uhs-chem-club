# Bench Tabletop — benches you work with your hands, not machines you answer

**Status:** T0 built (T0a: pure model, drawn tabletop, `table` widget, order rails, catalogue drag, `verify:table`; T0b: `leanIn()`, `table3d.js`, the frame's table mode, the recorder sheet, field points, the lean checks); **T1a built** (the atom kit, Tallow's field point, Tallow `q1-grain` + `q2-core`, their hosts); **T1b built** (Ligar `q1-joins` + `q4-dots`, the Lewis slate; **T1 is complete and waits on the user's review**, which the user has asked us to proceed past); **T2a built** (the card kit, Tallow `q3-catalogue` + `q4-ledger`, the cooler's field point); **T2b built** (the mass kit, Tallow `q5-assay` + `q6-weigh` + `boss-hopper`, the hopper's and the sack's field points, the foe's corner of the table); **T2c built** (the heap kit, a named room, Kettle `q1-recipe` + `boss-golem`: **T2 is complete, and every Tallow and Kettle quest is a table**); **T3a built** (the bonds kit, Ligar `q2-lattice` + `q3-distance` + `q5-resonance`, the ore drift's field point); **T3b built** (the domain kit, Ligar `q6-shape` + `q7-polarity` + `q8-hybrid`, the sump's field point); **T3c built** (the orbital kit, Ligar `q9-orbitals` + `boss-warden`: **T3 is complete, and every Ligar quest is a table**); **T4a built** (the optics kit, Lanternfall `q1-wave` + `q2-photon` + `q3-lines`, the flume's field point); **T4b built** (the cloud kit and the address and filling kit, Lanternfall `q4-cloud` + `q5-numbers` + `q6-filling`, the records tent re-roofed); **T4c built** (the spectrum, trends and cuvette kits, Lanternfall `q7-pes` + `q8-trends` + `q9-absorb`, the ice hole's field point); **T4d built** (`boss-eater`: **T4 is complete, and every Lanternfall quest is a table**). **T0 to T4 are built: Tallow, Kettle, Ligar and Lanternfall are tabletops; Bellows and Ember Reach (T5, T6) and records and retirement (T7) are not started.** Nothing is browser-tested; see the T4 closing note at the end of Progress. Drafted 2026-10-16. Phases T0–T7 (§6).
**This plan now carries the rest of `bench-integration.md`.** That plan's P0–P4 are done (bay contract,
Tallow, Ligar, Lanternfall); its P5 (Bellows), P6 (Ember Reach) and P7 (records, stills, site copy) are
folded in here as phases T5–T7, so each remaining world is re-laid and re-benched once, not twice.
`bench-integration.md` stays the record of P0–P4 and of the host proposals for Bellows and Ember.

**Companions:** `bench-integration.md` (where each bench stands; the bay contract this keeps),
`bench-clarity-pass.md` (the "relationship is never drawn" diagnosis, which the recorder in §3.4 closes),
`learn-quests.md` (per-quest science), `CLAUDE.md` teaching doctrine (unchanged unless §8 says so).

## Decisions (answered by the user, 2026-10-16)

1. **Tabletop + field.** At T4, engaging a bench leans the camera in over the plate, which becomes an open
   tabletop of real 3D pieces you drag, snap, pour and arrange. The side screens shrink to a prompt strip
   and a foot dock. Some stages also send the player into the world (fetch a sample, read a gauge on the
   plant). T1–T3 get a drawn tabletop with the same model. The bench bays built in `bench-integration.md`
   stay exactly where they are.
2. **Rewrite most multiple-choice stages.** Most stages become build, measure, arrange or
   predict-then-test tasks graded on what is on the table. A "why" question survives only where the idea
   cannot be built, and then as a prediction on a new case.
3. **Atom kit first.** The shared drag-and-snap workspace is built with an atom kit and piloted on Tallow
   `q1-grain` + `q2-core` and Ligar `q1-joins` + `q4-dots`, so a player has been snapping atoms together
   since Tallow when they reach bonding. Then world by world.

---

## 1. What is wrong today

**One shape for every bench.** Every instrument is a row of up to four stations at 0.92 m centres along
a 4.8 m plate (`bench3d.js` `STATION_PITCH`), with a briefing/readout/answer deck on the left and stage
rail + tool keys on the right (`frame.js` `PANEL_LAYOUT`). The player stands in front, selects a station,
presses a key, reads a number or a picture, then turns to a separate widget and answers. Thirteen
instruments, one interaction: **select → press → read → answer elsewhere.**

**The answer is almost never the thing you did.** Across the 44 built quest modules (38 benches + 6 bosses, 331 stages) the answer widget declarations
are 180 `choice`, 41 `number`, 40 `bins`, 14 `order`, 11 `decimal`, 5 `multi`, 5 `pick` and only 20
`none` (stages graded on the instrument's own state, e.g. a Lewis drawing). Roughly 57 % of all answers are
multiple choice. Examples of the disconnect:

| Quest / stage | What the player does | What is graded |
|---|---|---|
| `q5-hess` s2–s4 "Make the stack add up to …" | flips cards on the stack | a 4-way choice of ΔH; **the stack itself is never graded** |
| `q1-joins` s1 "Which pairs hold together…" | presses three pairs | a bins widget filled in afterwards |
| `q1-grain` s5 "How many atoms of each element build one molecule…" | looks through the scope | number entry |
| `q4-ledger` s7 "smallest ratio of A and B ions that balances to zero" | reads two cards | number entry, though balancing charge is a physical act |
| `q6-weigh` s4 "How many grams of oxygen contain the same number of atoms as 12.0 g of carbon?" | reads weights | number entry, though it is literally "pour until the counts match" |
| `q1-recipe` s4 "Which heap runs out first…" | reads heap sizes | choice, though it is "build molecules until a heap is empty" |

**Quests that are almost all choice** (≥ 6 of 8): `q5-hess` (8), `q3-lines`, `q7-pes`, `q2-lattice`,
`q5-resonance`, `q6-shape`, `q1-knocks` (7 each), `q3-distance`, `q9-orbitals`, `q3-ideal`, `q5-speed`,
`q6-real`, `q4-bonds` (6 each). These are the ones that read as "stand at a machine and take a quiz".

**What is already right and must survive:** the pure planners (`planJoin`, `planLewis`, `planDomains`,
`planBeam`, the gas and thermo planners) are honest physics shared by the drawn and built twins; the
bench bay contract; the doctrine on hints, prompts, vocabulary and answer leaks; no XP on the Learn track.
The pair board, box rack and domain hub already let the player build the answer; they are the seed of this
plan, held back by the station-row layout and two-tap-only input.

---

## 2. The new shape: the tabletop

When the player engages a bench the instrument case opens as today, and then:

- **The camera leans in** (`leanIn()` in `bench3d.js`): from the standing aim to a pitched view
  (~55° down) framed so the whole 4.8 × 1.3 m plate fits the glass at every aspect. On a landscape phone
  the plate's 3.7 : 1 strip fills the width and leaves room above and below for the strip and dock.
  Walking (`playerWalked`) stands the player back up exactly as today; `[E]` at the bench leans in again.
- **The plate is a workspace**, not a row of stations: loose pieces, trays, containers, a rail, slots
  and fixtures (the old instruments, now one object on the table among others), laid out per stage.
- **The screens go.** The deck, rail and controls CSS3D panels are replaced while leaning in by a
  screen-space **prompt strip** (top, under `--hud-h`: prompt, stage dots) and **foot dock** (Hint,
  Commit, banner) — the layout `.lq-prompt` / `.lq-deck-foot` already uses at T1–T3. Readings live **on
  the objects** (a gauge on the tank, a counter on the balance, a lamp on an atom) and on the **recorder**
  (§3.4), not on a side screen. Briefing stays the docked-left card on stage 1 only.
- **The answer is the table** wherever the task can be done by hand. Commit grades the table's state.

At **T1–T3** the deck body holds a drawn top-down tabletop (canvas) with the same pieces, zones, snaps
and recorder, driven by the same reducer. A stage grades identically on both (the existing twin rule).

### 2.1 Interaction verbs

Every stage is built from these, and a quest should use several:

| Verb | What the player does | Replaces |
|---|---|---|
| **Build** | drag pieces together; they snap where the physics says they join | number entry ("how many atoms…"), `choice` about structure |
| **Arrange** | drag pieces into position along a rail or into a grid; the others slide apart to make room | `order` widget (tap in sequence), card filing |
| **Sort** | put pieces into labelled trays | `bins` widget |
| **Transfer** | pour, scoop, pump or carry between containers | number entry on amounts |
| **Measure** | pick up a tool (ruler, protractor, balance, thermometer, stopwatch) and lay it on something | "read the number on the screen" |
| **Tune & record** | turn a dial / push a piston; every run drops a point on the recorder | `setReadout` that wipes the last reading |
| **Predict, then test** | place a prediction token, then press Run; the run grades it | "Why does …?" choice |
| **Fetch** (T4 field) | walk to a spot on the world's plant, take a sample or reading, bring it back | a sample that is simply already on the bench |

### 2.2 Input rules

- **Drag is primary, two-tap always works.** Every drag has a tap-piece-then-tap-target twin (the pair
  board and box rack rule, kept), so touch, trackpad and 375 px all work. `verify:table` replays every
  solution both ways.
- At T4 a press on a piece goes to the piece (`addGrabbable` already hands presses to controls before
  the view); a drag on empty table is a look. The cursor is never captured.
- Pieces move on the plate plane (ray onto plane `y = PLATE_TOP`), lift 3 cm while held, and snap with a
  short settle; nothing animates a screen.
- **Ordering is always dragging into place, never clicking in sequence.** Today's `order` widget
  (`stagerunner.js`) has the player tap items one after another to number them, with a "Clear Order"
  key to start over. That goes. Every "order / rank / arrange" task is a row of pieces on a rail that the
  player **drags into position**: pick one up, the others slide apart to open a gap, drop it in. The
  answer is the left-to-right arrangement as it stands. The two-tap twin is tap a piece, then tap the gap
  it goes in (not "tap them in order"). The rail's ends carry the plain labels the prompt uses ("fewest
  protons" / "most protons", "largest" / "smallest"), so direction is never a guess. The starting
  arrangement is a fixed shuffle that is never already the answer (`verify:table` checks).
- A **scratch corner** on every atom-kit table: a few loose atoms and a bin, never graded, cleared each
  stage. It is where a player plays with bonding before Ligar asks about it.

### 2.3 Snaps are physics, never a gatekeeper

A snap that only accepts the right answer is an answer key. So:

- The kit lets the player attempt **any** join. What happens is decided by the pure planner
  (`planJoin` for atoms, `planLewis` for pairs, `planDomains` for arms) and shown honestly: a pair that
  holds stays together; a pair that does not drifts apart when released; an over-full atom shows its
  stencilled `!` lamp; a charge needle reads the net charge.
- In stages about the rule itself (e.g. Lewis structures), snaps place things where the player put them and
  only the lamps report; nothing auto-arranges electrons.
- A table never refuses a Commit of a correct build. It may refuse a blank table, or explain a wrong one.

### 2.4 Prediction stages

"Predict, then test" replaces most "Why …?" choices, with one condition that keeps the doctrine (*a stage
must be solvable by someone who doesn't already know the answer*): **a prediction is only asked on a new
case of an idea the quest has already worked out on the table.** The prediction token is a physical card
dropped in a slot (still the `choice` widget's state underneath, so `check()` and the leak search are
unchanged). Run plays the test; a wrong prediction is a missed trial whose reason is the test itself,
shown before any foe answers.

### 2.5 Field stages (T4 only, at most one per quest)

- A stage may declare `field: { siteId, point, take }`: a spot on the world's plant (the conveyor tail,
  the wave flume, the mine sump) registered by the world as a `fieldPoint`. The guide arrow routes there
  (`routeTo` in Ligar; the lantern road in Lanternfall; Tallow's line).
- `[E]` on the point (aim-target, never nearest) puts the item in a **carry slot** (a small HUD chip,
  SCOURED PLATE); back at the bench it appears on the table.
- Fetching is evidence, never a lock: Commit still grades the answer. At T1–T3 the same stage shows a
  drawn site plate where the player taps the point; the model is identical.
- Field stages only at worlds that are walkable (Tallow, Lanternfall, Ligar now; Bellows and Ember when
  their bench-integration phases land). Kettle has none.

### 2.6 Every bench belongs to its place (applies to every phase)

**This is a requirement of every phase, not a finishing touch. An agent reworking a bench also makes
sure it is well integrated into its world, and does not count a bench as done until it is.** The
tabletop puts the player's eyes on the plate for most of a quest, so the plate and everything around it
is now the most-looked-at part of each world. `bench-integration.md` made each bench a working part of
the plant, camp or mine; the tabletop must keep that true from the new camera and go further:

1. **The table is the host's own work surface.** Pieces, trays, containers, tools and fixtures are
   dressed as that host's equipment, from the world's material kit (`pbr-kit`, the world's `M`): sample
   pans and scoops off Tallow's brine line; rock-bolted steel ledges, ore tubs and miner's tools in
   Ligar; sled gear, cased optics and frosted fittings in Lanternfall; gas-plant valves and gauges in
   Bellows; heat-shield tongs and spring water in Ember. A generic grey bench-kit object on every world is
   the failure this rule exists to prevent. Only the cased instrument stays "the one clean thing".
2. **The lean-in view shows the host, not a void.** From the lean-in pose at all six aspects the frame
   is the plate with the host's machinery at its edges and the world beyond it (the belt, the drift
   walls, the lake ice, the gasholder walkway). No bare sky, no back of a prop, no unfinished face, no
   body the camera sits inside. A new `lean` clearance box joins `bayBoxes()` (the camera's volume and
   its sightline to the plate) and `verify:bench` fails any world body inside it.
3. **The world does what the table says.** A pour comes from the host's own pipework or hopper, a
   field point is a real piece of the host or its neighbour (the conveyor tail, the sump, the flume,
   the ice hole), the indicator lamp and any new lamp are `lampMark`s in the world's `LampPool` (light
   count fixed), and the host's soundscape carries on while the player works. Under a Ligar hill only
   lamps light, so every mine table gets a lamp over its plate.
4. **Dormant to working reads as one machine.** The case opening, the table's fixtures rising and the
   field point are all on the host; nothing appears from nowhere.
5. **Each phase re-checks integration for the benches it touches**, including the worlds already
   integrated (Tallow, Ligar, Lanternfall), because the camera, the fixtures and the field points are new.
   Hosts may be adjusted to suit the table (bench-integration's invariants 3–7 still hold: bay
   clearance, no overlap, walkable, lamps only lit, facing from `approachPos`, open approach, boss arenas
   on open ground).
6. **Every phase ends with a per-bench look list for the user**, like P4's ("for the user to look at in
   the browser"): what to stand at, what the lean-in view should show, where the field point is, since the
   agent does not test in the browser.

Bench-integration invariants 1 ("nothing about a quest changes") and 2 (`PANEL_LAYOUT`,
`fitDeployedAim` and every `*3d.js` untouched) are lifted: changing those is this plan's job.

---

## 3. Engineering

### 3.1 The model (pure, no DOM, no THREE): `src/learn/table/`

- `model.js` — `TableState` `{ pieces: {id, kind, at, rot, joinedTo}, zones: {trays, rail, slots,
  containers}, fixtures, recorder, carry, prediction }` and a reducer `apply(state, action)`. Actions:
  `pick`, `place`, `join`, `split`, `pour`, `setDial`, `run`, `flip`, `scale`, `predict`, `fetch`.
  Every view dispatches actions; nothing else mutates state. Deterministic, serialisable.
- `snap.js` — where a dropped piece lands (zone hit-test, join candidates), asking the kit's planner
  whether a join holds.
- `kits/atoms.js` — nuclear particles + electrons + atoms; joins through `planJoin` / `lewis.js`
  (`VALENCE`, `planLewis`); molecule recognition (`formulaOf(cluster)`); charge of a cluster.
- `kits/cards.js` — equation and element cards: flip, scale, stack; `netOf(stack)` cancels species.
- `kits/optics.js`, `kits/gas.js`, `kits/heat.js`, `kits/arms.js` — thin wrappers over `lightdata.js`,
  `gasdata.js`, `thermodata.js`, `vsepr.js`. **No second implementation of any planner.**
- `recorder.js` — every `run` appends `{x, y, label}`; plots drawn by the existing `trendplot.js`.

### 3.2 The views

- `engine/table2d.js` — canvas top-down view on `PlateBench`'s raster/aperture helpers; pointer drag
  with two-tap fallback; reuses each instrument's `draw*Field` for magnified pictures (the scope's
  picture appears inside a lens you drag over a dish).
- `engine/table3d.js` — a `BenchViewer3D` subclass (never a second viewer): pieces are meshes registered
  through `addGrabbable`, instanced per kind; fixtures reuse the existing `*3d.js` builders. Flat
  pictures on fixtures keep the "built instrument shows a flat picture" rule.
- `instruments.js` gains `Tabletop` (canvas vs built, as for every other instrument).

### 3.3 Stage runner and frame

- New widget `type: 'table'`: `check(state)` receives `state.table` (the `TableState`) alongside the
  usual fields. Stages declare `table: { kit, pieces, zones, fixtures, tools }` instead of
  `samples`/`pairs`/`rigs`. Old stage shapes keep working until their quest converts.
- `frame.js`: a table mode that renders the prompt strip and foot dock in screen space while leaning in;
  `PANEL_LAYOUT` stays the fixed layout for unconverted benches (nothing animates either). Findings move
  to the recorder sheet on the table.
- `SOLUTIONS` for table stages become **action scripts** (`[{pick:'na1'},{join:['na1','cl1']}, …]`) that
  `verify:table` replays through the reducer, and `stateFor` builds the end state from them. `MISSES`
  likewise.

### 3.4 The recorder

A paper strip on the table that keeps every reading the player takes (`bench-clarity-pass.md` §1: today
`setReadout` replaces). Tune-and-record stages plot automatically; the player can lay a straightedge
(a tool) across the points, which is how "extrapolate to zero pressure" (`q1-knocks` s7) and the
calibration line (`q9-absorb` s8) become things done by hand.

### 3.5 Checks

- **`verify:table`** (new, part of `verify`): every table stage's script replays to a state its `check`
  passes, by drag and by two-tap; every `MISSES` script fails with its reason; no join outcome is authored
  (each comes from the kit's planner); no piece label, tray label or token contains the stage's answer;
  every tool in a stage's `tools` changes the state or the picture (the "control that does nothing" rule).
- **`verify:learn`**: a ratchet, `tools/table-legacy.json`, lists quests not yet converted. A converted
  quest has at most **2 `choice` stages out of 8**, and every `choice` it keeps is either a prediction
  token or a reading that cannot be built. Converting a quest deletes its line; new quests get none.
- **`verify:bench`**: the lean-in pose at the six aspects (the whole plate inside the glass, below the
  HUD and above the dock; smallest piece ≥ 28 px at 667 × 375).
- **`verify:run`**: every stage mounts as a table and its script runs. **`verify:<world>`**: every
  `fieldPoint` stands on walkable ground with a clear approach and belongs to a host or a named
  landmark (`host:` / landmark id), never a free-standing marker.
- **`verify:bench`, integration (§2.6)**: the `lean` box is clear in all five worlds; the lean-in frame at
  each aspect has host or world geometry behind the plate (a ray grid from the camera hits world bodies or
  terrain, not only sky, past the plate's far edge); table fixtures use the world's material kit (no
  bench-kit default material on a deployed world bench). `tools/bay-legacy.json` must be empty when T6
  ends.

---

## 4. Per-quest map

One line per quest: the kit, what the player now does, and a field stage if any. Stage counts stay as they are
(8 per bench, bosses keep their phase counts); `PRACTICE` is untouched (append-only). Bins become trays, orders become rails, and the
"why" stages become predictions or are folded into the build that shows the reason.

### Tallow (`unit01`) — atom kit, card table, balance

| Quest | Becomes |
|---|---|
| `q1-grain` | **Field:** scoop the samples at the conveyor tail. Drag a **lens** over each dish (scope picture inside it, power dial on the lens); drag the **cutter** across a dish to try to split it; s5–s6 **build one molecule of Sample A from loose atoms** (first snaps of the road, "join" not "bond"); sort dishes into element / compound / mixture trays. |
| `q2-core` | **Build an atom**: drag protons and neutrons into a nucleus, electrons onto shell rings; the clip-on charge needle reads live. s1 aim the beam at the foil and place the detector yourself. s7 "bring Sample A to +2" = pull electrons off. Isotope / ion / element = build each variant from Sample D and tray them. |
| `q3-catalogue` | Card table: **lay the cards in a strip by proton count, then fold the strip into rows where the pattern restarts** (the table's shape is discovered by doing it); drop the mystery card into its slot. |
| `q4-ledger` | Atom kit at particle scale: build atoms and ions from bins; s6 fill the outer shell by hand; s7 **drag A and B ions onto a neutral pad until the charge needle reads zero** (graded on the pad). **Field:** draw the sample at the cracking tower's sample cooler. |
| `q5-assay` | **Pour a sample into the mass sorter**; atoms pile into weight bins. Average mass = **slide a fulcrum under the piles until the beam balances** (the balance point of the piles is the weighted average). Unknowns: pour and compare piles. **Field:** the weigh hopper. |
| `q6-weigh` | Two-pan balance with drums and scoops: **pour oxygen until the atom counter matches the carbon pan**; split the 72 g water drum into equal scoops and count them; build CH₄/CO₂ on the pan from atoms and read the weight. **Field:** sack scale. |
| `boss-hopper` | Five phases on the same table (sort, build an atom, slot a card, balance a pile, count a drum); foe watches the table. |

### Lanternfall (`unit02`) — optics rail, particle probe, box rack, recorder

| Quest | Becomes |
|---|---|
| `q1-wave` | **Field:** watch the wave flume (crest spacing, the analogy). Optical rail: place lamp, slit and detector strips yourself; the wave is drawn live; tune the lamp until its wave matches twice Sample A's; time a pulse between two detectors you place a measured distance apart; **arrange lamps on the rail** by frequency. |
| `q2-photon` | Photocell: drag metal plates into the holder, set colour and brightness, freed electrons collect in a counting cup; **arrange plates by the threshold you found**; red-on-zinc becomes a prediction then test. |
| `q3-lines` | Plug gas tubes into the socket; lines land on a strip; **slide reference strips alongside to match**; on the energy ladder **drag an electron down a rung and its line appears** — "which drop makes the red line" is answered by making it. |
| `q4-cloud` | Probe: each press drops a dot (a long exposure builds the cloud); stretch the ring string and tune it until it closes; turn the p cloud onto every axis peg it fits; tray the five clouds by shape. |
| `q5-numbers` | Address blocks: drag an electron token to the box an address names; build the third shell full and count; the illegal-address stage becomes "try to place them" (the rack refuses with the rule shown). |
| `q6-filling` | Box rack by drag (two-tap kept), ladder drawn tall; magnet test as today; Fe²⁺ = pull two electrons off and test. |
| `q7-pes` | **Fire the beam; knocked-out electrons fall into energy bins and pile into peaks** (height = count). Identify the sealed spectrum by **building the atom whose piles match** (atom kit + spectrum overlay). |
| `q8-trends` | **Tug the outer electron** off each atom with a spring gauge (pull reads); lay scale-model atoms against a size gauge and **arrange them on the rail**; ions built from atoms (add/remove electron) and sized the same way. |
| `q9-absorb` | **Fill cuvettes with a dropper** (drops = concentration), slide them into the beam; the recorder plots absorbance; lay the straightedge for the calibration line; place the unknown on it. **Field:** draw water at the ice hole for the blank. |
| `boss-eater` | Phases on ladder, photocell, box rack, tube socket and cuvette rail. |

### Ligar (`unit03`) — atom kit (bond scale), slab fixtures, pair slate, domain hub

| Quest | Becomes |
|---|---|
| `q1-joins` | **Drag atoms together**: a pair that holds snaps (an electron visibly hands over, or a shared pair forms in the joint); Ne–Ne drifts apart. Tray pairs by handed-over / shared. **Build MgClₙ until Mg's outer shell is empty and the needle reads zero**; **build methane** by snapping H onto C until its lamp lights; a second pair dragged into a joint makes a double bond. |
| `q2-lattice` | Slabs on the table: swing the hammer, slide onto the hotplate, clip the circuit across. **Snap ions into a grid** vs stack molecules; s6 **try to lift one molecule out with tongs** (graded on what you lifted). **Field:** chip the blocks from the ore drift. |
| `q3-distance` | **Pull two atoms apart by hand**; the energy curve draws behind your hand; release at the bottom of the well (graded on where you left it). Lay C–C bonds on the ruler rail; salts on the hotplate in order. |
| `q4-dots` | Pair slate by drag: electrons from the tray to a joint or an atom; **arrange the skeleton yourself** (s4 "which atom sits in the middle of HOF" is graded on the skeleton built); charge chip for NH₄⁺. |
| `q5-resonance` | Drag pairs between positions; formal-charge stamp; **build all equivalent nitrate drawings on three slates**; bond-length gauge across a bond; water's "no resonance" becomes try-and-fail. |
| `q6-shape` | Domain hub: **clip arms on by drag, they push apart**, lay the protractor across two arms; **drag the lone-pair balloon** to axial or equatorial and watch the strain settle (graded on where it sits). |
| `q7-polarity` | Drag molecules between the field plates; arrows tool; **bring a charged rod to liquid streams**. **Field:** the stream at the sump. |
| `q8-hybrid` | **Drag s and p orbitals into the mixer bowl**; the lobes that come out are what you mixed (graded on the mix); grab a bond end and twist it. |
| `q9-orbitals` | MO box rack by drag; magnet test; rank O₂ species by laying them on the length rail. |
| `boss-warden` | Phases on hotplate, pair slate, hub, field plates and magnet. |

### Bellows (`unit04`) — gas kit (built with its integration in T5)

| Quest | Becomes |
|---|---|
| `q1-knocks` | **Push the piston by hand**, pump strokes add gas, slide a burner under; points land on the recorder; **lay the straightedge to find zero pressure**. |
| `q2-laws` | Syringe and piston: compress to a quarter (graded on what you set); records sorted into trays by what was held constant. |
| `q3-ideal` | Weigh the tank on the balance, read its own gauges; compute R from the recorder rows (number entry kept: the calculation is the skill); **shelve the tank under the gas it must be**. |
| `q4-mixtures` | **Open valves to pour gas tank to tank**; gauges add; arrange gases by partial pressure. |
| `q5-speed` | Release two gases at a pinhole and run the stopwatch; **HCl/NH₃ tube: predict where the ring forms, then test**. |
| `q6-real` | Squeeze a gas in the cold bath; recorder plots PV/nRT; arrange cylinders by departure. |
| `boss-compressor` | Phases on piston, bath, balance, valves and pinhole. |

### Ember Reach (`unit05`) — heat kit, card stack (built with its integration in T6)

| Quest | Becomes |
|---|---|
| `q1-flow` | Carry blocks with tongs between baths; **draw the system boundary by dragging a rope round the parts you mean** (graded on what is inside); energy chart built, not tapped. |
| `q2-calorimetry` | Pour measured water into the cup, drop the hot block in, read the thermometer; **shelve Metal M under its name**; lift the lid and see the loss on the recorder. |
| `q3-enthalpy` | Weigh the ribbon, drop it in acid; **build the energy diagram by dragging the product level** above or below the reactants. |
| `q4-bonds` | Pull bonds on the crank; **drag each bond into Broken or Formed and the ledger sums**; estimate graded by number. |
| `q5-hess` | **Card stack graded on the stack**: flip, scale and stack cards until the cancelled net equation under the stack equals the target; ΔH by number where the sum is hidden. |
| `q6-entropy` | Open the gate; **place particles in cells to find every arrangement** (the board counts distinct ones found); arrange ice/water/steam on the rail. |
| `q7-gibbs` | Drag the temperature slider and **set the crossing marker where ΔG reaches zero**; sign combinations into trays. |
| `boss-crucible` | Five phases on cup, ledger, stack, table and plotter. |

### Kettle (`unit07`) — atom kit at heap scale

| Quest | Becomes |
|---|---|
| `q1-recipe` | **Build one molecule to set the recipe**; **build molecules from the two heaps until one runs out** (the limiting heap is the one that empties; count what you built); weigh the parts for percent by mass; crates into recipe trays. |
| `boss-golem` | Build NaCl units from heaps / drums against the golem. |

---

## 5. Copy rules for the rewrite

The doctrine in `CLAUDE.md` is unchanged; these say how it reads at a tabletop.

- **Prompt** states the objective as something to make or find on the table ("Build one molecule of
  Sample A.", "Balance the two pans by atom count.") — still ≤ 25 words, no route.
- **Hint rung 1** = what the pieces or tool do; **rung 2** = what to look at (a lamp, a needle, a pile);
  **rung 3** = the method, never the finished build or the number.
- **Tool legends** only for tools whose name does not say what they do; a "Lens" or "Cutter" gets none.
- **Misses** name what the table shows ("Sample A's carbon still has an unlit lamp"), never the answer.
- **Reward cards** unchanged in purpose: name the idea just worked out.
- **Vocabulary**: piece and tray labels are play copy and are held to `WITHHELD_VOCAB` (Tallow `q1-grain`
  says "join" and "piece"; "atom" and "bond" arrive on their cards as today).

---

## 6. Order of work

Each phase ends with `npm run verify` green, its quests' lines deleted from `tools/table-legacy.json`, every
bench it touched meeting §2.6 (integrated into its world from the lean-in view, with a look list for the
user), this file's progress note updated, and the user testing in the browser. T1–T4 re-check the hosts
already built in Tallow, Ligar and Lanternfall under the new camera and adjust them where the table needs
it; T5 and T6 build Bellows' and Ember's hosts for the first time.

- **T0 — Groundwork.** `table/` model + reducer + `snap.js`; `table2d.js`; `table3d.js` on
  `BenchViewer3D`; `leanIn()`; table mode in `frame.js`; widget `table` in `stagerunner.js`; recorder;
  `verify:table`; `table-legacy.json` seeded with every quest; `verify:bench` lean-in pose. Proved on one
  throwaway stage, not shipped to a quest.
  **Shipped in T0, before any quest converts:** the `order` widget becomes a drag-to-reorder rail (§2.2)
  for all 14 order stages in 11 quests (`q1-wave`, `q2-photon`, `q8-trends`, `q3-distance`,
  `q9-orbitals`, `q3-ideal`, `q4-mixtures`, `q5-speed`, `q6-real`, `q3-enthalpy`, `q6-entropy`), and the
  catalogue board (`catalogue.js`, today two taps with drag forbidden) gains drag for the strip filing in
  `q3-catalogue` s1 and s3: a card dropped on a filled slot pushes the row along rather than swapping.
  Both still write the state they write today (`state.order`, the board's `placed`), so every `check()`,
  `SOLUTIONS` and `MISSES` entry stands unchanged; only the rail's end labels are new copy.
- **T1 — Atom kit pilot.** `kits/atoms.js` (particle scale and bond scale), scratch corner, carry slot +
  `fieldPoint` (Tallow conveyor tail). Convert **Tallow `q1-grain`, `q2-core`; Ligar `q1-joins`,
  `q4-dots`.** User review before going on: feel of dragging at T4 and on a phone, lean-in framing,
  whether the tabletop reads as less confusing.
- **T2 — Rest of Tallow + Kettle.** Card table (`kits/cards.js`), balance and mass sorter; `q3`–`q6`,
  `boss-hopper`, Kettle `q1-recipe`, `boss-golem`; Tallow's remaining field points.
- **T3 — Rest of Ligar.** Slab fixtures, bond crank by hand, domain hub by drag, mixer, MO rack; `q2`,
  `q3`, `q5`–`q9`, `boss-warden`; mine field points (ore drift, sump).
- **T4 — Lanternfall.** Optics rail, photocell, probe, PES piles, cuvettes; all nine + `boss-eater`;
  flume and ice-hole field points.
- **T5 — Bellows: integration (old P5) and tabletop together.** Confirm the host proposals with the
  user before starting (`bench-integration.md` §6: gauge gallery on a gasholder walkway, compressor
  tower piston deck, metering skid, blending manifold on a pipe rack, leak-test station at a vent stack,
  the liquefier's cold box). Then: `bellows/sites.js` → `bellows/stations.js` with one host builder per
  bench returning `{group, bench, local, colliders, partBoxes}` through `buildBayBench`; re-lay
  `tools/gen-bellows-layout.mjs` so each host stands on the plant; delete the six ring gantries; keep the
  compressor's arena on open ground; field points on the plant (a gasholder's gauge, the vent stack's
  leak point, the cold box's draw-off); convert `q1`–`q6` + `boss-compressor` on the gas kit; check
  whether `t1.siteDescriptions` in `bellows.json` is read before rewriting or deleting it; update
  `verify:bellows` and `docs/plans/bellows-world.md`.
- **T6 — Ember Reach: integration (old P6) and tabletop together.** Confirm the host proposals first
  (`bench-integration.md` §7: wellhead heat-exchanger plates, sampling shelf at the hot spring's edge,
  the habitat's boiler room, a fumarole sampling coil, the separator and siphon manifold, the silencer
  pair, the turbine hall control room). Then: `ember/sites.js` → `ember/stations.js`, hosts replacing the
  seven heat-shield shelters on the 54 m ring; re-lay `tools/gen-ember-layout.mjs`; the Crucible arena in
  front of the expansion loop stays; empty `tools/bay-legacy.json` (its two `behind` waivers are Ember's
  old shelters); field points in the vent field and plant (a fumarole, the spring's edge, a wellhead);
  convert `q1`–`q7` + `boss-crucible` on the heat kit and card stack (from T2); check
  `t1.siteDescriptions` in `ember.json`; update `verify:ember` and `docs/plans/ember-reach-world.md`.
- **T7 — Records and retirement (old P7 plus this plan's cleanup).** Retire what nothing uses: the
  station-row layout in `bench3d.js`, the deck/rail/controls panels in `PANEL_LAYOUT`, the
  per-instrument key banks and `fitDeployedAim`'s standing aim where `leanIn()` replaced it, once
  `table-legacy.json` is empty. Re-bake stills (`bake:stills`) for every re-laid world. Bring each
  per-world plan record up to date (`bellows-world.md`, `ember-reach-world.md`, the Tallow, Ligar and
  Lanternfall records). Mark `bench-integration.md` complete. CLAUDE.md per §8.

---

## 7. Risks and open questions

- **Scale of the rewrite.** 331 stages of copy, hints, misses and solutions. Mitigated by doing it world
  by world behind the ratchet, and by keeping stage counts and `PRACTICE` untouched.
- **Drag vs look at T4.** A press near a piece that misses it turns the view. Pieces get a generous hit
  volume while leaning in; empty-table drags still look. Watch for this in the T1 review.
- **Phone legibility.** A 4.8 m plate at 667 px wide puts a 7 cm piece at ~10 px unless the lean-in frames
  only the active part of the table. Plan: lean-in frames the stage's used zones, not always the whole
  plate; `verify:bench` asserts the minimum piece size.
- **Performance.** Hundreds of loose particles (mass sorter piles, probe dots) are instanced, one draw
  call per kind; shadows re-drawn only on a move (`shadow-pace.js`) as today.
- **Field stages and bosses.** Walk is suspended in a boss encounter, so boss phases never declare
  `field`.
- **Host proposals for Bellows and Ember are unconfirmed** (`bench-integration.md` §6–§7). Each is
  confirmed with the user at the start of T5 / T6, and may change once the table's needs are known (a
  piston deck has to hold a syringe rig; a boiler room has to hold a cup calorimeter and baths).
- **Re-laying a world while rewriting its quests** makes T5 and T6 the largest phases. If one runs long,
  split it: hosts and the re-lay first (benches still on the old station row), then the table conversion.
- **Drill Deck** stays text practice for now; a table form of practice problems is out of scope.

## 8. CLAUDE.md changes when built (not before)

Add to the teaching doctrine: *the answer is the table where it can be built*; *every drag has a two-tap
twin*; *ordering is dragging into place on a rail, never clicking in sequence*; *snaps are physics, never a gatekeeper*; *a prediction is only asked on a new case of an idea
already worked out*; *a field stage is evidence, never a lock, at most one per quest, never on a boss*.
Add to the worlds section: *every bench is part of its host and is checked from the lean-in view
(§2.6)*. Replace the "deck layout" and `PANEL_LAYOUT` notes once the station-row benches are retired,
replace the `bench-integration.md` pointer with "complete", and describe Bellows' and Ember's hosts the way
Tallow's, Ligar's and Lanternfall's are described.

## Progress

- 2026-10-16: plan drafted; decisions 1–3 answered. Nothing built.
- 2026-10-16: added (user): every ordering task is dragged into place, never clicked in sequence (§2.2); the
  `order` widget and the catalogue strip change in T0, ahead of the quest conversions.
- 2026-10-16: added (user): `bench-integration.md`'s remaining phases (P5 Bellows, P6 Ember, P7 records)
  folded in as T5–T7; §2.6 makes integrating each bench into its world part of every phase's done.
- 2026-10-16: **T0a built** (everything in T0 that is not 3D, camera or frame). T0b still owes `table3d.js`,
  `leanIn()`, the frame's table mode and the `verify:bench` lean-in pose. Shipped, and the API later phases build on:
  - **`src/learn/table/`** (pure, no DOM, no THREE). `model.js` `createTable(spec, seedKey)` builds a `TableState`
    from a stage's `table: {kit, bounds?, pieces, zones {trays, slots, containers, rail}, fixtures, tools, prediction?,
    fetch?, recorder?}` (an unsound declaration throws, so it fails `verify:table`); `apply(state, action)` is the only
    reducer (returns a new state, never throws, `state.last = {verb, ok, reason?, ...}`); `applyAll`, `runScript(state,
    script, {mode: 'direct'|'drag'|'tap', strict})`, `expandStep`, `signature(state)` (the table without raw
    coordinates: two tables are the same when their signatures are), `checkInvariants`, `clusters`, `clusterFormula`,
    `labelsOf(spec)`, `snapDial`. Units are table units (default `bounds` 100 x 60; the 3D view maps the plate onto them).
  - **Actions** are one-key objects: `{pick: id|null}`, `{place: {piece?, at | to}}` (`at` = a drag, resolved by
    `snap.resolveDrop`; `to` = a two-tap target: `tray:ID` `slot:ID` `container:ID` `rail:INDEX` `piece:ID` `free:X,Y`),
    `{join: [a, b]}` (= place on a piece), `{split: id | [a, b]}`, `{pour: {from, to, what, amount}}`, `{setDial:
    {fixture, dial, value}}`, `{run: fixtureId}`, `{flip: id}`, `{scale: {piece, factor}}`, `{predict: tokenId|null}`,
    `{fetch: pointId}`, `{lay: tool|null}`. A drag and a two-tap that mean the same end in the same signature.
  - **Kit interface** (`kits/registry.js`: `registerKit`, `getKit`, `radiusOf`; `kits/index.js` is where T1 imports
    `./atoms.js`): `id`, `kinds {kind: {r}}`, `planJoin(a, b, state) -> {holds, reason?, link?}` (never a gatekeeper; a
    pair that does not hold drifts apart and `last.reason` says why), `canJoin` (derived), `readPiece(id, state)` (DERIVED
    from structure, so a split undoes a join), `formulaOf(ids, state)`, `chargeOf`, `run(state, fixtureId) -> {x, y,
    label}|null` (the recorder appends it; nothing else invents a row), `tools {id: {label, press, active?, enabled?,
    probe}}`, `maxScale`. Joins live in `state.links` (kit `link` data) with `piece.joinedTo` as the index. The throwaway
    kit and stage that prove all of it are `tools/lib/table-fixture.mjs` (not imported by `src/`).
  - `snap.js` (zone hit-test with slots before containers before trays before the rail; `joinCandidates` with the
    planner's answer attached; `resolveDrop`/`pointFor` as inverses; only pieces on open table are join targets, a drop
    on a zone is a drop into it), `rail.js` (`RailController`, `reorder`, `insertionIndex`, `gapsFor`,
    `startArrangement`), `recorder.js` (`append`, `lay`, `lineOf`, `readY`, `readX`; a straightedge is two rows or two
    points), `tools.js` (`BUILTIN_TOOLS.straightedge`, `toolDef`).
  - **Widget `type: 'table'`** (`stagerunner.js`): `blankAnswer(stage).table` is the `TableState`; `runner.act(action)` is
    the only way a view changes it and mirrors `state.choice` = the prediction token; `check(state)` reads `state.table`.
    `SOLUTIONS[i]` / `MISSES[i]` are action scripts (arrays); a quest's `stateFor` calls `stateFromScript(stage, entry)`
    (non-array entries pass through, so old shapes are untouched). The tabletop is `Tabletop(host, {onAction, tools})` in
    `instruments.js` (= `Table2D` at every tier until T0b registers the built twin); `cfg.tableHost()` may name another
    host element. `engine/table2d.js` extends `PlateBench`: press-move-release drags, tap-then-tap-target twin, rail pieces
    slide apart, dials dragged, Run tapped, tool keys under the canvas; `drawTable`, `fixtureLayout` and the gesture
    methods (`pointerDown/Move/Up`, in table units) are what `verify:table` drives. Not yet in the view: flip/scale/pour/
    fetch gestures (T1/T2 bring them with their kits).
  - **Order rails** (`engine/railview.js`, over `RailController`): all 14 `order` stages in 11 quests are drag-to-reorder
    with the tap-piece-then-tap-gap twin; "Clear Order" is gone. They still write `state.order`, so every `check()`,
    `SOLUTIONS` and `MISSES` entry is unchanged. New per-stage fields: `widget.rail: {first, last}` (the plain labels at
    the left/right end; direction is fixed by them, and `verify:learn` holds them to the vocabulary gate) and optional
    `widget.start` (used on `q8-trends` s5 and `q3-distance` s5, where the fixed shuffle landed on the answer). The start is
    a fixed shuffle, never the declared order and never the answer (`verify:table`). Copy that said "tap" for placing
    (miss messages, two hints) now says "put".
  - **Catalogue** (`catalogue.js`): drag a card to a slot (ghost follows the pointer; the click that ends a drag is
    swallowed); `board.strip: true` (declared on `q3-catalogue` s1 and s3) makes a drop on a filled slot push the row
    along to the nearest gap (right first, then left; a full row returns the displaced card to the drawer); other boards
    swap or return the card. `fileCard` is pure and shared. **For T0b:** `catalogue3d.js` already files by tap through
    `fileCard` (twin rule kept, including pushing); dragging a BUILT card is the T0b half.
  - **`npm run verify:table`** (in `verify`, after `verify:learn`): the throwaway stage is replayed by script, drag, two
    taps and the drawn tabletop's own gestures; the stage runner is driven; misses, authored outcomes, label leaks, dead
    tools/dials, layout and drawing are checked; every real `type: 'table'` stage gets the same treatment; the 14 rails
    (including the DOM widget on a hand-made DOM), the catalogue strip, and the ratchet. **`tools/table-legacy.json`**
    lists all 44 built quests (38 benches + 6 bosses): listed = unconverted; unlisted = converted, held to at most a
    quarter of its stages as `choice` (so 2 of 8), each declared `widget.keep: 'reading'` (a prediction is a table token,
    not a choice); a listed quest whose stages are all tables must have its line deleted; new quests get none.
- 2026-10-16: **T0b built** (the built side: everything in T0 that is 3D, camera or frame). Nothing is browser-tested; the
  throwaway table still reaches no quest. Shipped, and the API T1 builds on:
  - **`BenchViewer3D.leanIn(opts)`** (`bench3d.js`, solver in `engine/lean.js`). `opts {zones?, viewport?, reserve?,
    pitchDeg?, instant?}`; `zones` are used rectangles in the bench frame in metres (`{x0,x1,z0,z1}`, default `PLATE_ZONE` =
    the whole 4.8 x 1.3 m plate). Returns the pose `{position, target, pitch, dist, fov, aspect, fits, safe, ndc, key}`.
    `planLeanIn({zones, viewport, reserve, fov, pitchDeg})` is the pure solver (55 degrees down, the used zones inside the
    free glass); `chromeReserve(w, h)` models the HUD, strip and dock in px when nothing can be measured (a phone is
    `w <= 768 || h <= 500`); live, `measureLeanReserve()` reads `.lq-tstrip`, `.lq-tdock` and a docked briefing card and the
    pose is re-solved at 5 Hz when any of it moves. The camera flies there in 0.45 s (instantly under reduced motion).
    `leaveLean({walked})`, `settleLean()`, `isLeanSettled()`, `leaning`, `onLeanChange`. A step is seen as a change in the
    camera's x/z that the lean did not write (`leanWalkIntent`; the walk runs first each frame), hands the camera to the walk
    and stands the player up; Escape and the dock's Stand key stand up without walking; `[E]` and the Lean In key lean in
    again. A drag on empty table is a small look that settles back (`leanLook`). While leaning `fitToOpenArea` /
    `fitDeployedAim` do nothing, `body.bench-leaning` hides the touch sticks (Stand brings them back), and the stage sets
    `fpsControls.holdBase` so the walk does not read the lean camera as a teleport. Unconverted benches never call any of it.
    `addGrabbable` takes an optional `accepts(raycaster)`, so one wide hit volume only takes a press where something is there.
  - **`engine/table3d.js` `Table3D extends BenchViewer3D`**; `Tabletop(host, opts)` returns it at T4 and `Table2D` below
    (`opts {onAction, tools, toolHost?, onLeanChange?, onCarry?}`; the runner passes the last three at T4). Same contract as
    `Table2D`: `setState(state)`, `dispose()`, `built = true`. It leans in on its first state with `[map.zone]` and re-frames
    when a stage changes the table's furniture (`boardSignature`). The table's units land on the plate by `table/layout.js`
    `plateMap(bounds)` (uniform scale, centred, 6 cm margin), so **declare `bounds` plate-shaped (about 150 x 46) for a table
    that must hold 28 px pieces on a 667 x 375 phone**; a 100 x 80 table gives about 25 px at its far edge
    (`TEST_TABLE_WIDE` is the built twin's throwaway). The flat part of the plate is `drawTable(..., {pieces:false,
    controls:false, sheet:false, crt:false})`, the canvas table's own picture; pieces are puck/card meshes with an engraved
    legend, lifted 3 cm while held and eased to their place; kinds flagged `instanced` are one InstancedMesh each; joins are
    rods; jars have walls and a rising fill; a fixture is a rim, a knob per dial and a Run key unless the kit supplies
    `fixture3d`. Fixtures are dressed from `opts.world.materials` (the host's own, recorded by `buildBayBench` on
    `dormant.userData.benchMats`, handed over by `stage.benchDeployment().materials`), never the bench kit's.
  - **`table/gestures.js` `TableGestures`**: what a pointer does on a table, written once for both views (press, slop, drag,
    rail gap, tap-then-tap twin, dials, Run, pour, the paper strip). `contextKeys(state, kit)` are the keys a held piece or a
    pending field item offers: **Flip**, **Smaller**, **Larger** (kit kinds flagged `flip` / `scale`) and a fetch key per
    pending `table.fetch` entry (left out where a world has the point). **Pour** is a drag from one jar to another, or a tap on
    each, one `kit.pourStep` (default 1). **Straightedge**: drag between two readings on the strip lays it through them, a tap
    on the strip lifts it. A second quick tap on a held card puts it down (there is no double-tap flip). `table/layout.js`
    holds `fixtureLayout`, `plateMap`, `pieceTargets`; `engine/table-keys.js` `TableKeys` renders the tool and context keys.
  - **Recorder sheet**: a paper plane at `recorder.box`, painted by `trendplot.js` (new `pxOf`, `overlay`), the straightedge
    a bar laid on it; rows come from the kit only. `recorder` accepts `{at, size, xLabel, yLabel, xUnit, yUnit}`. The 2D strip
    uses `recorder.plotUnits`. `setKeys` / `setReadings` are no-ops on a table: tools are in the dock, readings on the sheet.
  - **Frame table mode** (`frame.js`): `setTableMode(on, {onStand, onLean})`, `setLeaning(bool)`, `setCarry(label|null)`,
    `el.tableKeys`. Entering moves the finished nodes (no copy is retyped): a **prompt strip** under the HUD (Leave Bench from
    the host bar, the objective, the stage dots) and a **foot dock** (Stand / Lean In, Tour, Findings, the table's keys, Hint,
    Commit), with the miss banner, hints and a reward card on a message plate floating over the dock, so neither bar changes
    height. The card, fold dock and tool plate are hidden in table mode; `PANEL_LAYOUT` and everything else are as before.
    The runner turns it on when `benchesAre3D()` and a table stage loads, and off when the stage is not a table.
    **A quest that plays table stages at T4 must be in `BUILT_BENCHES`** (`instruments.js`) so the host keeps the player on
    their feet. CSS: `learn.css`, "TABLE MODE".
  - **Field points (world side only)**: `three/field-points.js` `registerFieldPoint(world, {id, siteId, label, host, pos,
    half?, rotY?, reach?})` (refuses a point with no `host`), `fieldPointsOf`, `fieldPointById`, `fieldAimTargets(world,
    {ids})`, `clearFieldPoints`. `[E]` goes through `stage.aimedInteraction` to `viewer.aimedInteraction(origin, dir, world)`
    (the bench stage now offers `[E] TAKE <item>` for the point the camera is POINTED at, never the nearest, and `[E] LEAN
    IN` at the plate). **Carry slot**: `takeField(point)` sets `carry` and `onCarry(label)`; the frame's chip reads "Carrying
    <label>"; `flushCarry()` runs on `leanIn()` and dispatches the reducer's `fetch`, so the piece appears on the table back at
    the bench. No world registers a point yet (T1 brings Tallow's conveyor tail); `verify:<world>` is to hold each one to
    "walkable ground, a clear approach, a host or named landmark".
  - **Checks.** `verify:bench`: the lean-in pose on the throwaway table at seven viewports (2560x1080, 1920x1080, 1680x1050,
    1440x960, 1280x960, 812x375, 667x375): the whole used zone inside the free glass, below the HUD and strip, above the dock,
    smallest piece >= 28 px, camera inside the bay's `approach` or `lean` air; the whole solution replayed through the real
    pointer handlers by drag and by two taps (84 presses), a look, a step, `[E]`, a field point and the carry slot. In the five
    worlds, per bench: the new **`lean`** box (`bayBoxes().lean`: x +-1.2, y 2.4..4.6, z from the plate's front edge out 2.1 m,
    the camera's air), **`sight`** (a 9 x 5 grid of segments from each whole-plate pose to the plate must pass through no
    body), **`view`** (rays through the free glass that land past the plate's far edge must reach a body or the terrain), and a
    tabletop deployed on the world's first bench must use that bench's own materials (with a negative control).
    `tools/bay-legacy.json` now also waives, by name, the benches the new camera exposes: `lean` and `sight` for Tallow
    `q2-core` (the sub-level's roof is at the camera's height) and `q3-catalogue` (the control house roof), Ligar `q9-orbitals`
    (hoist chamber roof), Lanternfall `q5-numbers` and `q6-filling` (the records tent's ridge), all of Bellows (the six ring
    gantries, deleted in T5) and Ember (the seven shelters, T6); **T1 clears Tallow, T3 Ligar, T4 Lanternfall**, and the file
    can only shrink. `verify:table` also drives the shared gestures (pour, flip, scale, fetch, the straightedge) and the frame's
    table mode and CSS; `verify:run` mounts the throwaway stage through the runner and plays its script (and will do the same
    for every real `type: 'table'` stage).
  - **Deferred.** The tray/rail/slot pieces of the built plate are flat pictures with low rims (no tray geometry yet); the field
    chip and the keys are screen-space; `kit.fixture3d` is a hook with no kit using it yet; `catalogue3d.js` still has no drag;
    no world has a field point; the pose assumes the stage's table is centred on the plate; pour is one step per gesture.
  - **For the user to look at in a browser (nothing here is browser-tested)**. There is no quest to open: `Tabletop` is only
    reached by `type: 'table'` stages, and no quest has one. To see it, temporarily add the throwaway stage (`tools/lib/
    table-fixture.mjs` `TEST_STAGE` with `TEST_TABLE_WIDE`, and `registerTestKit()`) to a Tallow quest that is in
    `BUILT_BENCHES`, at 3D On. Then check: (1) on entering, the camera flies over the plate and the table fills the glass between
    the prompt strip and the dock; on a phone held sideways (667 x 375, 812 x 375) the pieces are big enough to hit; (2) a piece
    follows the pointer, lifts and settles, the rail's pieces slide apart under a dragged card, tap-then-tap does the same,
    a drag on bare table swings the view and lets it go; (3) W / the move stick stands you up, the sticks vanish while leaned
    in and return after Stand, `[E]` at the plate says LEAN IN; (4) the hint, miss banner and reward float over the dock without
    moving it; Leave Bench still works; (5) the strip prints the readings and the straightedge lies on it; (6) nothing glows,
    nothing is rounded. Per bench: the lean-in frame should show the host's machinery at the plate's edges and the world beyond
    it; the waived benches above will show a roof or a gantry over the camera until their phase.
- 2026-10-16: **T1a built** (first half of T1: the atom kit, Tallow's field point, Tallow `q1-grain` and `q2-core`, their hosts).
  Nothing here is browser-tested. Shipped, and the API T1b builds on:
  - **`table/kits/atoms.js`** (registered by `kits/index.js`; id `atoms`). One kit, two scales, one set of rules. **Every join is
    `joinbench.js` `planJoin` asked against the atoms' CURRENT shells** (the links already standing are applied in order, so a split
    undoes a join), a drawing is `lewis.js` `planLewis`, the lens picture is `scope.js` `drawScopeField`, the cut and the shake are
    `planCut` / `planSettle`, the beam is `corebench.js` `planBeam`. No stage declares an outcome and `verify:table` replays every
    join against the planner. A pair that does not hold drifts apart and `state.last.reason` says why; the runner shows that reason
    (`frame.note`) unless the stage sets `table.opts.explain: false`.
  - **THE BOND-SCALE HALF (what T1b converts Ligar onto).** Piece kind `atom`, `props {el: 'Na'}` (optional `shells` prefill, `mask`
    withholds the symbol, `tint`, `lone`, `dots`, `scratch`). A link is `{type: 'transfer'|'share', giver, moved, pairs, a, b}`: a
    hand-over (`giver` hands `moved` electrons over; both end charged) or `pairs` shared pairs (1 single, 2 double, 3 triple). Exports:
    `atomView`, `readPiece(id, state) -> {shells, outer, cap, room, full, lamp ('room'|'full'|'over'), charge}`, `chargeOf(ids, state)`
    (the needle on a cluster), `closureOf(ids, state) -> {closed, open}` (MgCl is open, MgCl₂ closed: "build until nothing is left open"),
    `formulaOf` / `countsOf` / `moleculesOf(state)`, `lewisOf(ids, state) -> {mol, placed, read}` (the cluster as drawn, bonds from the
    links, lone pairs and dots from the atoms' props, so T1b's slate drops only have to set `props.lone` / `props.dots` or add pair pieces
    that join to an atom), `elementOf`, `shellsFor`. Stage wording: `table.opts.words` is `'plain'` (default: no shell talk in a reason) or
    `'shells'`; `table.opts.shells` draws each atom's outer electrons on its face. Ne-Ne drifts apart, Na-Cl hands over, two oxygens share
    two pairs, two nitrogens three, four hydrogens close a carbon and a fifth is refused, MgCl₂ closes: all in `verify:table` "Atom kit".
  - **THE PARTICLE-SCALE HALF.** Kinds `proton`, `neutron`, `electron` (never joined: `nojoin`), `nucleus` (a fixed lump drawn as the
    to-scale huddle), `specimen` (rings, counts, a casing, a needle reading, a tested stamp), `detector`, `card`. A shell is a tray with a
    `cap` (the picture prints `n/cap` and a stencilled `!` lamp, `plates.js` `lampMark`, when it holds more); the charge needle is a
    `needle` fixture (`needleReading(state, id)`: protons on the nucleus lump or in its zones against electrons in them); the beam is a
    `beam` fixture with a Run key (`runLabel: 'Fire Beam'`) that reads where the detector sits; the tester is a `tester` fixture that stamps
    what the sample in its slot does (`stamp` on a run); the reader is a `reader` fixture that prints the name and mass of the atom in its slot.
  - **THE SAMPLER'S TOOLS ON A TABLE.** `dish` (a sample in `props.sample`, the scope's own declaration; `props.view` makes it open at that
    power), `lens`, `cutter`, `shaker`. New reducer rules, all in `model.js` and all kit-driven: `kinds.x.tool` (a tool lies ON another piece
    and comes off when picked up, a piece carried into a zone leaves its tools behind), `planJoin -> {once, set, rest}` (a pass: the cutter
    writes `cut` on the dish and hangs back where it was), `run -> {stamp}`, `kinds.x.nojoin`, `kinds.x.split` (the held piece offers
    "Pull Out"), `kit.joinGap` (joined pieces stand a little apart so the join shows), a join stands the joiner beside the target on the first
    free side (`standBeside`), a tray may declare `cell` (the pitch for big pieces) and `cap`, a fixture `noRun` / `runLabel` / `props`, a
    dial `labels`, `table.opts`, a fetch entry `at` (below). Painting is the kit's (`paintPiece`, `paintFixture`, `paintLink`, `faceKey`,
    `printed`, `linkRods`): `table2d.js` `drawTable` and `table3d.js` call the SAME functions, so a face is one picture; the built puck's
    top is a canvas painted by `paintPiece`.
  - **The scratch corner** (`scratchCorner`, `atomTable(spec)`): bottom left of every atom-kit table, a bin and four loose atoms (H, O, Na,
    Cl), never graded (`props.scratch`; `piecesIn`, `moleculesOf` skip it), a fresh one every stage. `verify:table` fails an atom table
    without it and proves that playing in it changes no stage's answer.
  - **Field point and carry slot.** `three/tallow/stations.js` `buildSamplePoint` returns `fieldPoints: [{id: 'tail', label: 'Belt Scoop', ...}]`:
    the scoop across the cross-cut sampler's drum, a real piece of host `site-1`, registered by `tallow.js` through `registerFieldPoint`
    (host-local to world, with the place to stand). `[E]` on it (aim-target, never the nearest) puts "Belt scoop" in the carry chip; leaning
    in at the bench puts the dish on the table. The guide chevron leads to the stand (`bench-host.js` `guideTo`, wired in `main.js` to
    `stage.setWorldWaypoint`; `Table3D.syncGuide` shows it while the world has the point and the item is neither fetched nor carried).
    **Evidence, never a lock:** the scoop is a second dish for stage 1; the stage is answered with the bench's own dish. **At T1 to T3** the
    same fetch is a drawn **site plate** on the table (`table.fetch[].at`; a tap on it, `TableGestures.siteAt`); where the world has the
    point the built table draws no plate and a tap there does nothing (`showsSite`). `verify:tallow` holds each point to: belongs to a site
    (host), labelled, within 12 m of its bench, the place to stand clear of every collider and level with the ground under the point, the point
    itself solid (the clearance test can fail), inside `[E]` reach, and walkable from the bench's approach mark (a flood fill over the real colliders).
  - **`q1-grain` and `q2-core` are table quests** (all 16 stages, no `choice`; their lines are gone from `tools/table-legacy.json`; `PRACTICE`, `VOCABULARY`,
    the reward cards and every export other benches import (`KINDS`, `POWER_SCALES`, `PARTS`, `behaviourOf`) are unchanged). `q1-grain`: 1 lens over a dish and
    the power dial (graded on the dial), 2 tray the samples by kinds of atom, 3 read atoms in the reader and tray the ore by element (sodium and
    magnesium are dressed alike), 4 draw the cutter across four samples and tray the one it cannot split, 5 build one molecule of Sample A from loose
    atoms (the planner refuses a third hydrogen on an oxygen), 6 build one molecule of each sample (the planner makes H-O-O-H only if the hydrogens
    go on first, which is its honest answer), 7 pass the shaker under three samples and tray them, 8 tray four samples (lens, cutter and shaker all
    on the table). `q2-core`: 1 detector round the foil, "Fire Beam", the strip records, a model card in the slot; 2 pick out the particles that carry
    a +; 3 load electrons until the needle rests on zero; 4 load shells (cap lamp) against three open samples; 5 the tester and three trays; 6 and 8
    trays against a reference (specimen faces print protons, neutrons and a needle); 7 pull electrons off until the needle reads +2. `SOLUTIONS` and
    `MISSES` are action scripts; every miss carries a reason and no answer.
    **Deviation from §4:** `q2-core` s6 and s8 tray prebuilt specimens (they do not build each variant from Sample D); building three atoms in one
    stage wants the cluster model with shell rings, which is T2/T3's to design with the card table. Stage 1's model cards are a slot, not a `choice`.
  - **Integration (§2.6).** Sample 1 (conveyor tail): the table is the host's own surface (host materials), a field point on the drum, the lean-in view
    shows the sampler frame and the yard (the host was already clear of every lean check). Sample 2 (instrument room): the roof slab was inside the lean
    air, so the room is **0.6 m deeper** (`gen-tallow-layout.mjs` `FLOOR_Y` -5.6, ramp grade 0.62, headroom 4.8), the one roof beam that crossed the air over the
    bench is left out, and a luminaire and lamp hang over the back of the plate (`lampMark`, no new light in the pool). **Both Tallow waivers are deleted**
    (`tallow/q2-core` and, since the veranda's front edge now stands at the plate's, `tallow/q3-catalogue`): `tools/bay-legacy.json` has no Tallow line.
    `bench-bay.js` `lean` now starts at the top of the `approach` air (2.2 m, was 2.4) so the two together hold every camera height: a small table leans in
    lower and nearer than the whole plate. Tables are 120 x 64 units (`TABLE_BOUNDS`), pieces 5 units or more, which is 28 px at 340 px and at 667 x 375.
  - **Checks.** `verify:table`: the atom kit section, site-plate gesture, `printed` text, run readable along the solution, `noRun` fixtures, the
    scratch corner; `verify:bench`: every real table stage on the built table at 7 viewports (whole table in the free glass, pieces 28 px or more, host
    materials, camera in the lean/approach air) and its whole solution through the real pointer path by drag and by two taps, the field point (chevron,
    no plate, carry, table); `verify:tallow`: the field points; `verify:run` mounts all 16 stages (and the throwaway); `verify:learn`: a Tallow section holds every declared dish, atom, specimen and nucleus to the real tables and recomputes every graded answer (the lowest resolving power, kinds of atom, elements, the cutter's result, the molecule, the shaker's layers, the beam, protons, shells, the tester, isotopes) from the scope's and the kit's own planners.
  - **Deferred.** Ligar `q1-joins` and `q4-dots` (T1b: the atom kit's bond half is ready for them); the Lewis slate's pair pieces (T1b); a tray that is a
    real pan or tray in 3D (still a flat picture with a low rim); `catalogue3d` drag; the card kit (T2); `bake:stills` for the deeper instrument room (T7);
    the sound of the host while the player works; building each variant atom in `q2-core` s6/s8.
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Tallow, 3D On. **Bench 1** (`Bench 1 - Atoms`, the sample point at the
    conveyor's tail): stand at the plate and read the briefing (it names the lens and the scoop). Press `[E]` at the plate, or let the table
    lean in on its own: the camera should fly over the plate with the table filling the glass between the prompt strip and the dock, the host's sampler
    frame and the yard behind it, no sky and no back of a prop. Stage 1: drag the lens onto SAMPLE A (it rests a little right of the dish, the picture in
    the lens), drag the power dial's knob (or tap the track) to 4. Press W to stand up: the amber chevron should lead about 4.6 m along the bench's left to **the
    sampler's drum** (the field point: the scoop across the drum), `[E] TAKE BELT SCOOP` appears when you point at it, the chip reads "Carrying Belt
    scoop"; back at the plate, lean in again and a second dish (BELT SCOOP) is on the table. Stages 4 and 7: drag the cutter or shaker across a dish: it
    returns to its hook and the dish's picture changes (the helium puff stays unchanged). Stages 5 and 6: drag an H onto an O, an H onto the same O, then
    a third H (it should drift away with "Oxygen has no room left."); tap an atom to pick it up and press "Pull Out" in the dock to take it out of its
    molecule. The scratch corner (bottom left, four loose atoms and a bin) should always be there. Phone, landscape: pieces should be easy to hit, and a
    drag on bare table should only swing the view. **Bench 2** (`Bench 2 - Inside an Atom`, down the stair between the two evaporators; it is deeper than
    before): the camera leans in under a roof high enough to clear it, with the bulkhead, the gauge board and the equipment rack at the plate's edges and a
    lamp over the back of the plate. Stage 1: put the detector in the three places in turn and press "Fire Beam" (a dot per run on the strip, counts printed on
    the detector); stages 3, 4 and 7: electrons are dragged between trays and the needle moves live (it should read +8 until you add electrons in stage 3), a
    shell tray that holds too many prints `n/cap` and a `!` lamp; stage 5: drop a sample in the tester's slot and press "Run Tester" (the sample's face
    prints what it did). At T3 and below (3D Off, or a phone below T4) the same stages draw on the deck as a flat top-down table, with a drawn site plate
    ("Belt scoop") in the corner of stage 1 that a tap takes. Check nothing glows, nothing is rounded, the keys under the table take presses.
- 2026-10-17: **T1b built** (second half of T1: Ligar `q1-joins` and `q4-dots` on the atom kit at bond scale, and the hosts they stand in).
  Nothing here is browser-tested. Shipped, and the API T2 onward builds on:
  - **`q1-joins` is a table quest** (all 8 stages, no `choice`; its line is gone from `tools/table-legacy.json`; `PRACTICE`, `DEBRIEF`,
    `VOCABULARY`, every reward title and the quest's stage count are unchanged). A pair is two atoms that start side by side; any atom may be
    joined to any other (the planner answers, a pair that does not hold drifts apart and says why) and a stage grades only the pairs it handed over
    (`pairRead`; a stray join to a stranger is refused with a reason, never blocked). 1 put three pairs together and tray what held from what
    sprang apart; 2 fill every outer shell (the neon pair starts lit); 3 build one pair whose atoms end charged and one that ends neutral (any pairing
    of Na, Cl, H, H that does it passes); 4 tray four pairs by handed-over / held-between (read from the link the planner made); 5 build the unit in
    which every outer shell is full, with a unit needle clipped on the magnesium atom (four chlorines on the table, two needed); 6 tray three pairs by
    the rods between them; 7 tray four pairs as ionic / covalent / no bond (the argon-hydrogen pair is two loose atoms in No bond); 8 fill carbon's
    shell with hydrogens (six on the table, the fifth is refused). Faces are staged with the words: no charge mark before stage 3 and no shell dots
    before stage 2 (`table.opts.charges: false`, `table.opts.shells`), a refusal says "room" before it says "shell" (`opts.words`).
  - **`q4-dots` is a table quest** (all 8 stages, no `choice`; line gone; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, `BUILDS_ON`, titles unchanged).
    The **Lewis slate** on the atom kit: a molecule's atoms and a joint at every link stand fixed on a `slate` fixture (the board), the tray's pieces
    `pairs` ("Pair"), `single` ("Single", stage 7 only) and `lift` ("Lift Out") are dragged onto a joint (a shared pair) or an atom (a lone pair or a
    single electron) and go back to the tray, and the board's one rule (a hydrogen or fluorine shares one pair) is `lewis.js` `addBond`'s refusal,
    shown as the reason. `slateOf(state, id)` is the reading every stage grades on: `planLewis` of the drawing the pieces' props hold, the tray's count
    (`TRAY n OF m`), the charge. 1 water; 2 ammonia, methane and hydrogen fluoride on three plates; 3 carbon dioxide; 4 HOF, a triangle of three
    joints (the player decides which two to fill, so the atom in the middle is what they built, graded by the lamps); 5 the ammonium ion with a charge
    chip (a fixture whose dial is `charge`) that sets the tray; 6 boron trifluoride, drawn until the tray is empty (the board refuses fluorine's second
    pair, and boron's lamp stays amber); 7 nitric oxide with a single electron; 8 SF6 (24 deals). A lamp is a ring inside the atom's rim (phosphor lit,
    amber dashed for boron's six, double for an expanded octet, the stencilled `!` for more than it can hold); each atom prints what stands round it
    against what it wants (`6/8`). **`boss-warden` is untouched** and still plays the pair board, the join bench, the domain rig and the rack
    (`verify:run` and the warden's foes in `verify:bench` still pass).
  - **API additions.** `kits/atoms.js`: `pairRead`, `slateOf`, `slateParts`, `slateLayout`, `SLATE_R`, `JOINT_R`; kinds `joint`, `pairs`, `single`, `lift`
    (tray pieces are `tool` kinds); fixtures `slate` (board, lines and count) and `chip`; the `needle` fixture takes `props.cluster` (net charge of everything
    joined to a piece); `opts.charges: false`; a lit ring on any atom whose outer shell is full when `opts.shells`. `table/model.js`: a refused `planJoin` may
    answer `home: true` and the piece goes back where it hangs (`last.home`). `engine/table3d.js`: `mats.tray` dresses the trays when the host has one.
  - **Checks.** `verify:table` ("Atom kit"): the unit needle, `pairRead`, the whole slate (every deal agrees with `lewis.js` and a 160-step walk never
    parts from it, the one rule is refused with its reason and the piece goes home, a single electron on a joint is refused, Lift Out takes a dot first,
    the chip changes the tray, a loose atom cannot join a slate atom); `verify:learn`: every `q4-dots` slate is its molecule (atoms, joints, tray,
    no overlaps) and each solution leaves the intended `DRAWINGS` entry, and a "Ligar bench one" block recomputes every `q1-joins` pair, charge, count and
    tray from `joinbench.js` `planJoin` on the elements' own shells; `verify:bench`: the 16 real stages lean in at 7 viewports and are solved through
    the real pointer path by drag and by two taps; `verify:run` mounts all 16. Two checks were made to say what they mean: a **fixed** piece (an atom on a
    slate, a joint) is a target and never grabbed, so it owes no 28 px hit size and may stand on its own fixture; and `verify:table`'s label/answer search
    now reads a subscript as part of its word ("H₂" is "h2"), where it used to read it as "h" and call every hydrogen label a leak of the formula H₂.
    `verify:bench` no longer measures the join bench at bench 1 or the pair board at bench 4 (nothing plays them there; they stand on at bench 2, bench 5
    and in the warden's room and are measured there).
  - **Deviations from §4.** (1) `q1-joins` s1 "a second pair dragged into a joint makes a double bond": a join is one planner answer, so two oxygens
    snap with two rods and two nitrogens with three; the player-dealt second pair is `q4-dots`'s slate. (2) `q1-joins` s7 (predict off the catalogue) is
    join-and-tray graded on what the planner made, with no prediction token (a prediction is asked only on a new case, §2.4, and this is the first
    time the idea is met); its reward now says "after a few pairs you do not have to press anything". (3) `q4-dots` s4: the atoms are fixed on the
    slate and the skeleton is the set of joints the player fills, not atoms they place; free atoms with joints of their own is the cluster model T3
    designs with the domain hub. (4) `q4-dots` s2 no longer files plates under lone-pair counts: drawing all three molecules shows the counts, and
    the card says them. (5) `q4-dots` s6 is a build, not a "why": the board's refusal is the reason. (6) A pair's partner is its neighbour at the start;
    there are no "PAIR A" labels.
  - **Integration (§2.6).** Bench 1 (slab-dressing yard at the quarry's west face) and bench 4 (scale-house desk on the east deck) already cleared the
    new camera: neither had a `lean`, `sight` or `view` waiver, so `tools/bay-legacy.json` needed no Ligar line deleted (`ligar/q9-orbitals` stays for T3)
    and no host moved. From the lean-in pose the yard shows the saw bed with its slab, the bridge saw's portal and the two racks of dressed slabs, with the
    work lamps on their masts either side; the scale house shows its riveted cabin with the dial on its face, the weigh deck on the right and the test
    weights racked at the left. Both are in daylight, so neither needs a lamp over the plate (a mine table does, in T3). The tables are dressed from
    Ligar's own materials (the plate steel for pieces, the dark steel for rims and fixtures) and **the trays are basalt rimmed** (`mats.tray`, ore tubs on
    the ledge). The scratch corner on both tables is checked (playing in it changes no stage's answer); neither quest has a field point, so there is no
    carry to check at Ligar yet.
  - **Deferred.** The slate's tray piece deals one pair per drag (SF6 is 24 deals); atoms a player places themselves on a slate; the atoms kit's cluster
    model with shell rings (T2/T3); `kit.fixture3d` still unused; a tray that is a real tub in 3D (still a flat picture with a low basalt rim).
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Ligar, 3D On, after Tallow is open (every built world is open
    from the start). **Bench 1** (`Bench 1 - What Holds`, the slab-dressing yard at the quarry's west face; stand at the plate, press `[E]` or let it lean in):
    the camera should fly over the plate with the table filling the glass between the prompt strip and the dock, the saw bed and the bridge saw's portal
    behind it, a slab rack at each side, no sky and no back of a prop. Stage 1: drag an atom onto the one it started beside (Na on Cl, then H on H, then Ne
    on Ne); the first two should stay joined with a rod, the neon pair should drift apart and the banner should say why; tray the pairs; drag
    on bare table should only swing the view. Stage 2: dots on the rim and a green ring on the atoms whose shell is full (the neon pair at the start). Stage 3:
    plus and minus marks appear on the faces. Stage 5: the needle box ("Unit charge") reads zero throughout; the magnesium atom's ring lights after the second
    chlorine. Stage 6: two rods between the oxygens, three between the nitrogens. Stage 8: the fifth hydrogen drifts away and the banner says the carbon's outer shell is already full.
    The trays should have a stone rim. **Bench 4** (`Bench 4 - Lewis Structures`, the scale-house desk on the east deck): the cabin with its dial behind
    the desk, the weigh deck on the right. Stage 1: drag the "Pair" piece from the top left onto a joint (the small ring between two atoms) and then onto an
    atom; it should return to its place each time, "TRAY n OF m" should fall by two, and a lit ring should appear round an atom that has enough; "Lift Out"
    on a joint or an atom takes one back. Stage 4: a second joint on the hydrogen atom should be refused ("A hydrogen atom has room for one shared pair
    only.") and the pair should go home. Stage 5: drag the "Tray charge" knob to +1 and the tray should shrink by one. Stage 7: "Single" appears. Stage 8
    is twenty-four drags. On a phone held sideways: the joints (the smallest targets on any table so far) should still be easy to land a pair on, and a drag
    that starts on bare table should only swing the view. At 3D Off (or below T4) the same stages draw on the deck as flat top-down tables.
- 2026-10-17: **T1 closing note (for the user, before T2).** T1 is the pilot, so these are the things the plan wants judged, which no check can: (1) the
  **feel of dragging** at T4 on a desktop and on a phone held sideways: does a piece follow the pointer and settle, does a press near a piece take it
  or swing the view (the plan's "drag vs look" risk), is a tap-then-tap fine on a trackpad; the slate asks for the most precise drops yet (a 3 unit joint;
  the tray piece's own reach is 11 units, so the nearest target wins), and its last stage asks for twenty-four of them. (2) The **lean-in framing**: does
  it fill the glass with the table between the strip and the dock on every aspect, are the five hosts (Tallow 1 and 2, Ligar 1 and 4) visible behind the
  plate, is the landscape phone's table readable (pieces 28 px or more; the fixed slate atoms and joints are about 26 and 18 px and are targets, not handles). (3) **Whether
  the tabletop reads as less confusing** than the stations it replaced: the two pilots with the most to judge are Tallow `q2-core` (build an atom) and
  Ligar `q4-dots` (electrons from a tray), because they replace the most arithmetic with something to do with the hands. The user has asked us to go
  on to T2 through T4 without waiting for this; if the review says the drag is wrong, it is wrong in `table/gestures.js` and the two views once, and every
  quest after T1 inherits the fix. Decisions that would be cheaper to change now than later: the slate's one-pair-per-drag dealing, the choice to fix
  atoms on a slate, `mats.tray` stone rims on every Ligar table, and the lamp as a ring (not a separate light) on every atom.
- 2026-10-17: **T2a built** (first third of T2: the card kit, Tallow `q3-catalogue` and `q4-ledger`, the cooler's field point). T2b owes the mass
  sorter and the two-pan balance (`q5-assay`, `q6-weigh`) and `boss-hopper`; T2c owes Kettle `q1-recipe` and `boss-golem`. Nothing here is
  browser-tested (the drawn faces were rendered to pictures in Node and read; the built twin is held by `verify:bench`). Shipped, and the API later phases build on:
  - **`table/kits/cards.js`** (registered by `kits/index.js`; id `cards`). Piece kinds `element` (`props {sym}`; everything on its face is DERIVED: the
    proton count is `electrons.js` `zOf`, the outer-shell dots `atoms.js` `shellsFor`, what it does is `tradeOf(sym)` read off `joinbench.js`
    `shellPlan`; `props.mass` is the one datum, `props.hide: ['z'|'mass'|'outer']` withholds a reading, `props.sealed` prints a "?" and nothing else) and
    `equation` (`props {eq: 'C(s) + O₂(g) → CO₂(g)', dH}`, `flip` = the sides swap and ΔH changes sign, `scale` = every amount and ΔH multiplied, `maxScale`
    4). Exports: `elementView(piece) -> {sym, z, name, shells, outer, trade, mass, hide, sealed}`, `elementCard(id, sym, at, props)`, `tradeOf`,
    `parseEquation`, `equationText`, `cardView(piece)` (the card as it reads now), **`netOf(stack) -> {reactants, products, species, dH, text, cancelled}`**
    (equation cards added, what stands on both sides cancelled, **ΔH is `thermodata.js` `hessStackEnthalpy`'s own sum**: no second implementation),
    `sameReaction(a, b)`, `stackOf(state, zone)`, `stackNet(state, zone)`, `piecesIn`, `slotCard`, `railOrder`, `testedOf`, and the furniture
    `cardTable(spec)` (bounds `CARD_BOUNDS` 150 x 64, a parked recorder), `cardSlot(id, at, {label, row})`, `cardTray(id, label, at, cols, rows, pitch)`.
    Fixtures: `net` (`props {zone, hideDH?}`: prints the cancelled equation and ΔH under a stack; T6's `q5-hess` is the first user), `tester`
    (`props {slot}`: stamps what the card in its slot does, `run` is `tradeOf`; a sealed card reads nothing). A held equation card offers Flip / Smaller /
    Larger through the shared `contextKeys`. **Two view hooks arrived with it:** `kinds.x.rect = {hw, hh}` (a card the kit paints is a thin slab with
    its face painted by the SAME `paintPiece` onto a canvas of its own proportions, `table3d.js` `buildRectPiece`; the drawn table already hands
    `paintPiece` a centre and a scale), and `slot.row` in a table spec (the slots that share a row are a STRIP: a card dropped on a filled one pushes the row
    along by `engine/catalogue.js` `fileCard` itself, `model.js` `fileIntoRow`; `verify:table` replays the same drops through `fileCard` and the table
    and compares). Prediction tokens may carry `r` (a token is as big as its piece). `TableGestures.tapPiece(id, at)`: tapping a piece **on the rail**
    with a piece in the hand puts it before (left half) or after (right half) the one tapped, so the end of a full rail can be tapped.
  - **`q3-catalogue` is a card table** (all 8 stages, no `choice`; line gone from `tools/table-legacy.json`; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, the reward cards,
    `CARDS` (boss-hopper imports it) and every other export unchanged). 1 lay six cards on a strip (a rail: fewest protons / most protons) by protons, the
    weights printed beside as the trap; 2 set aside the cards where the outer-shell dots fall back to one (18 cards in two wrapped rows, a tray); 3 file the
    last row of the chart into eight slots that are one strip row (a card dropped on a filled place pushes the row along, `fileCard`), column numbers printed under
    the slots; 4 give three loose cards (protons withheld, dots visible) the open place in the column their dots match; 5 test cards (drop one in the tester, press
    "Test Card") and tray every card that will not trade; 6 tray six cards in four trays by what they do; 7 lay a sealed card in the one open place, set
    its proton count on a stamp and drop a prediction token (a new case: silicon, never measured); 8 file four loose cards into the open places. Every
    answer is read off the table (`railOrder`, `slotCard`, `piecesIn`, `tradeOf`).
  - **`q4-ledger` is an atom-kit table at particle scale** (all 8 stages, no `choice`; line gone; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, rewards unchanged except
    the numbers in stages 1, 2 and 4). A heap of loose protons, neutrons and electrons, "The middle" and "Outside" trays and a needle clipped on both: 1 build an
    atom particle for particle against Sample A (its middle drawn to scale as a lump, its rings and needle on a specimen) with a **field point**: a draw from the
    tower's sample cooler (`cooler`, below), a second reference that appears on the table, evidence and never a lock; 2 build sealed Sample B from its label (label
    plates: the new `plate` fixture prints a sample's lines); 3 tray samples by whether they react like Sample A; 4 build the protons and electrons of a sealed ion from
    its label and the needle printed on it; 5 take every electron off magnesium's outermost shell (shell trays print `n/cap`; the needle reads +2); 6 fill chlorine's
    outer shell (one spare electron; the needle goes negative); 7 put the fewest Sample A and B ions on a pad until its needle reads zero (new kind `ion`, `props
    {el, charge}`, which the needle counts); 8 tray four samples against a reference. **Atoms were made smaller than the old stage had them** (lithium-7 and -6,
    beryllium, a lithium ion) so a build is 10 to 12 drags and the heap fits the table; the stages teach the same ideas. `needleReading` and `chargeOf` count an
    `ion`'s own charge.
  - **Field point `cooler`** (`three/tallow/stations.js` `buildTowerDeck`): the draw-off valve of the sample-bomb rack on the cooler skid, host `site-4`, the player
    stands 1.3 m in front of the skid (behind the plate, round the bench's side; `verify:tallow` holds it to walkable ground from the approach mark, a clear stand
    and a solid point). `verify:bench` plays stage 1's `fetch` through the world's registered point (chevron, `[E]`, carry, table) and at T1 to T3 the drawn
    site plate takes the same fetch.
  - **Integration (§2.6).** Bench 3 (control house, veranda desk, record wall) already cleared the lean-in camera in T1a (the veranda stands back to the plate, a
    luminaire hangs over it): **its `lean`/`sight` waiver was already gone** (`tools/bay-legacy.json` has no Tallow line), so there was nothing to delete and no host
    moved. Bench 4 gained its field point and the table stands on the deck beside the skid with the tower behind it; the sodium lamp on its mast (host-local
    3.5, 1.5) lights the plate. Both tables are dressed from Tallow's own plate steel (`benchMats`, held by `verify:bench`).
  - **Checks.** `verify:table`: the card kit section (the quest's `CARDS` are the element: protons, shells, trade; equation parse, flip, scale; a three-card
    stack nets to methane with ΔH = −74.8 and equals `hessStackEnthalpy`; the stack's net fixture and every card's face are drawn at 340 and 667 px; a strip row is
    `fileCard` for eight drops, by drag and by tap; held keys), and the catalogue board's own strip rules on synthetic boards (the boss still files on the board).
    `verify:learn` ("Tallow's tables are real"): every card is its element at the mass the scope weighed; the chart is in order of protons and each column shares
    its outer shell (helium excepted: its shell is full at two); every graded answer of both quests is recomputed (periods, the tray of cards that will not
    trade, the trade of each of six cards, silicon's protons and behaviour, each loose card between its neighbours; every build equals its sample, every label's two
    numbers are its sample's protons and protons plus neutrons, the sealed ion's needle, magnesium's and chlorine's shells, the smallest ratio from the two charges,
    the four kinds of difference). `verify:bench` plays every stage through the pointer path at seven viewports; its old fixtures for the catalogue board and the
    core bench (which used `q3`'s and `q4`'s declarations) are now synthetic boards and specimens, since the quests no longer declare any.
  - **Deviations from §4.** (1) `q3` stage 2 sets cards aside in a tray; the strip is not folded by hand until stage 3, where the last row is laid into
    the chart (the player lays the row that restarts; there is no separate "fold"). (2) `q3` stage 4 is a filing by outer-shell dots (protons withheld), not a "what
    do columns share" choice. (3) `q3` stage 7 grades three things on the table (the card in the open place, the stamp's proton count, a prediction token) where the
    old stage took a number and a choice. (4) `q4` stages 1, 2 and 4 use smaller atoms; the "bins" are a heap of loose particles (no room for three bins on a 120 x 64
    table beside the scratch corner). (5) `q4` stage 5 has no "Fire Stripper": the player drags the electrons off, as in `q2-core` stage 7 (stage 3 of this quest
    is a sibling of `q2-core` stage 6 and stage 8 a sibling of `q2-core` stage 8, with a "no difference" sample added). (6) `q4` stage 6 starts from neutral
    chlorine and needs one electron, not eighteen.
  - **Deferred.** A card back for element cards (`flip` is only offered on equation cards); `q4`'s labels are text plates, not a card; the recorder is parked on both
    tables; tray pieces are still flat pictures with low rims in 3D; no sound of the host while the player works.
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Tallow, 3D On. **Bench 3** (`Bench 3 - The Periodic Table`, the control
    house south of the evaporator row; stand at the veranda desk and press `[E]` or let it lean in): the camera flies over the plate with the card table filling
    the glass (wider than the atom tables: 150 units, so 2.8 m of the plate), the blockhouse wall and its record board behind it, the veranda's lamp over the plate.
    Stage 1: drag a card onto the strip (the others slide apart); tap a card, then tap the left or right half of one on the strip. Stage 3: drop a card on a
    filled place in the bottom row and the row should push along. Stage 5 and 6: drag a card into the tester slot and press "Test Card": the card's face prints
    what it did. Stage 7: drag the stamp's knob, drop a prediction token in the slot at the right. On a phone held sideways the cards (about 28 px at 340) show
    their symbol and a number, and their name and weight only when there is room. **Bench 4** (`Bench 4 - Isotopes and Ions`, the cracking tower's deck): the
    table with the tower behind it and the cooler skid at the left; press W to stand up and the chevron leads round the bench to the skid's bomb rack, where `[E]
    TAKE COOLER DRAW` appears when you point at it; lean in again and a second reference sample is on the table. Stage 1: drag protons and neutrons into "The
    middle", electrons into "Outside" and watch the needle; stage 5: electrons off the third shell into "Taken off" (the shell trays print `n/8`); stage 7: the
    ions' charges are printed on their shoulders and the pad's needle sums them. At T3 and below the same stages draw flat on the deck.
- 2026-10-17: **T2b built** (second third of T2: the mass kit, Tallow `q5-assay`, `q6-weigh` and `boss-hopper`, field points on hosts 5 and 6, the foe on the table).
  Nothing here is browser-tested. T2c owes Kettle `q1-recipe` and `boss-golem`, then T2 is complete.
  - **Mass kit** (`table/kits/mass.js`, id `mass`, extends the atom kit; registered in `kits/index.js`). Honest by construction: a balance weighs, never divides, and
    every number comes from the pure planners (`assay.js` `planPour` for tallies, `packBin` for piles) and the listed masses (`listedMass`, `speciesMass`).
    Pieces: `sample` (props `bins [{mass, n}]`, `note`, `code`, `sealed`; its face prints tallies per bin) and `crate` (props `species`, `n` | `grams`, `sealed`).
    Fixtures: `assay` (props `slot`, dial `pivot`, Run "Tip Sample"; beam moment is Σ n(m − pivot), level when |net| ≤ 1e-6 of the total), `coder` (Run "Read
    Code", dial `bin`), `balance` (two pans as containers or a `mix`, atom counters per pan, LEVEL lamp, unit `u` = particles or `g` = grams, counter = grams / M x
    6.02e23), `scale` (one pan, Run "Weigh", feeds the recorder), `mixer` (dial `heavy` of a fixed total) and `tally` (a dial). Builders: `balanceTable({unit,
    counters, refCrate, drum, steps, capacity, ...})`, `crate()`, `pourSteps()`. Read-outs for the checks: `assayRead`, `mixRead`, `panLoad`, `balanceRead`,
    `scaleRead`, `counterOf`, `massOfSample`, `countOfSample`. A pour moves one step of a species from a drum (`table.opts.steps`).
  - **Core changes.** A kit `run` may return `{noop: reason}`; the reducer fails the action with that reason and the runner shows it. Containers take a `cell`
    (a scoop's size). `state.tools` (not the kit's list) names the keys the stage offers. `layout.js` gained `FOE_PAD` / `foePadOf(bounds)` (the foe's corner:
    r 11.5, 12 in) and `FOE_HEADROOM_M`.
  - **Foe on the table.** A fight stage declares `foes: [{id, label}]` and keeps the corner pad clear (`verify:table` holds every zone, fixture, strip, plate and
    piece off it). `table3d.js` `foeSpots(n)` seats `FoeLayer3D` bodies in the pad (so a new phase moves the foe), pushes a headroom zone onto the lean zones, and a
    press on the pad takes nothing. The frame shows a one-line foe plate in the strip. The foe only observes; misses cost Integrity as before.
  - **Quests.** `q5-assay` (8 stages): tip and read code; the share in a bin; the fulcrum finds a listed mass (Cl 35.5); boron 10.8; a one-pile prediction token;
    the sealed canister against the mixer dial (heavy = 4); which listed tray; natural or altered. `q6-weigh` (8): carbon crate against pours of 50; build CH₄ on a
    scale; sixty atoms each of H, C, O on a line; **oxygen pour to match 12 g of carbon's counter (the mole is discovered)**; CO₂; the water drum into scoops;
    hydrogen to match 36 g of water; drums railed by atoms. `boss-hopper` (5 phases): sort, build a neutral atom, slot a card, balance slag, count a drum; each
    keeps its `encounter {species, act, intent, hit?, counter?}`. All three lines are gone from `tools/table-legacy.json`.
  - **Field points** (`three/tallow/stations.js`, real parts of the hosts with `host:` ids): `hopper` "Hopper Draw" (a scoop across the third catch bin of host 5,
    stand 1.45 m in front) and `sack` "Counted Sack" (host 6's bagging line, stand 2.1 m in front). `verify:tallow` holds both to walkable ground, a clear stand and
    a solid point; `verify:bench` plays stage 1 of q5 and q6 through the registered point and the drawn site plate (T1 to T3). Hosts 5 and 6 and the Hopper's arena
    needed no geometry change: their lean, sight and view clearances were already green and `tools/bay-legacy.json` has no Tallow line; the Hopper's tables are
    built in their own room, so `BOSS_ARENA_SPOTS['boss-hopper']` is unchanged.
  - **Checks.** `verify:table`: the foe pad on every fight stage. `verify:learn` ("the mass tables"): each sample is a whole pile the planner pours as declared and
    every graded answer is recomputed from `planPour` and the listed masses. `verify:bench`: all stages at seven viewports through the pointer path, plus "the
    Hopper on its tables" (foe extents inside the pad, clear of furniture and the free glass, <= 16000 triangles, reactions, miss lunge, disperse, knock-back,
    relocation between phases).
  - **Deviations from §4.** (1) `q5` s2 asks the share by abundance trays (25/50/75 in 100), not a typed number; s1 shows the answer as a tray. (2) `q6` s2 is an
    atom-sized 120 x 64 table with a scratch corner; s6 grades a tally dial (0 to 8, answer 4) beside the scoops. (3) The boss's per-bin `moves` were dropped (no bins
    widget), and each phase has one foe. (4) The mass tables have no scratch corner. (5) **Deferred: the assay beam, the balance and the scale are painted on the
    plate (host materials) but have no standing 3D geometry or instanced piles (`fixture3d`)**; the pictures are the same as T2d would draw. Also deferred:
    `fixture3d`, a recorder on the mass tables, and sound.
  - **For the user to look at in a browser, per bench.** Tallow, 3D On. **Bench 5** (`Bench 5 - Atomic Mass`, weigh hopper under the belt's discharge): lean in, the
    assay beam and trays fill the glass, the hopper's belt above; point at the scoop on the third catch bin for `[E] TAKE HOPPER DRAW`, carry it, and the extra
    sample appears. Stage 3: drag the fulcrum dial and watch the beam tilt; LEVEL lights when the piles balance. **Bench 6** (`Bench 6 - Counting by Weight`, sack
    scale and elevator): the balance with two pans, drum and counters; `[E]` at the counted sack on the bagging line; stage 4 pour oxygen scoops until the counters
    match. **Boss arena** (The Hopper): the hopper's body sits in the table's top-left corner pad, clear of the pieces; check it re-seats at each of the five
    phases, tilts on a miss and disperses on a win. Check all three at 375 px landscape and a desktop.
- 2026-10-17: **T2c built** (last third of T2: the heap kit, Kettle `q1-recipe` and `boss-golem`, the foundry room). **After this every Tallow quest (seven) and
  both Kettle quests are converted** (`tools/table-legacy.json` lists no `unit01` or `unit07` line). Nothing here is browser-tested; the drawn tables were
  rendered to pictures in Node and read, the built twin and the room are held by `verify:bench`. Shipped, and the API T3 onward builds on:
  - **Heap kit** (`table/kits/heap.js`, id `heap`, extends the mass kit, which extends the atom kit: an `atom` still joins exactly as `atoms.js` says).
    **A heap is a container whose contents are a count** (`heap(id, label, sym, amount, at, size)`: `contents {hydrogen: 18}`, `capacity` = what it started
    with, `props {still, pile: {el}}`), drawn as a pile of that many dots and never printed as a number; nothing pours from it (`props.still`:
    `gestures.js` `containerAt` skips still containers, so a press on a heap is a look). `product(...)` is the same for finished molecules, `dock(...)` holds
    the one molecule a maker copies, `pan(...)` holds what a scale weighs. **The maker** (fixture `maker`, `props {dock, heaps {sym: containerId}, product}`,
    Run "Make Molecule" / "Make Unit"): the player builds ONE molecule by hand (every join the planner's) and drops it in the dock; a press takes from each
    heap as many atoms of that kind as the molecule in the dock holds (`countsOf` the cluster, so the recipe is whatever was built, never a number a stage
    declares) and adds one to the product; a heap that cannot supply another refuses with `"The hydrogen heap holds too few for another."`, an empty or
    two-piece dock with its own reason. **Share bar** (fixture `share`, dial `share` 0 to 100, props `left`/`right` captions): a hundred equal parts and a
    marker. **Ledger** (fixture `ledger`, `props.pan`): the weight of each element on a pan, atom by atom from the listed masses. **Tag** (kind `tag`, a small
    rect plate, `TAG_RECT`): "Runs out first", dropped on a heap. A `scale` with `props.atoms` records a row `{x: molecules made on the pan, y: weight}` on Run, so
    a weighing before and after a joining is two points on the strip. Pure readers a stage's `check` and `verify:learn` use: `dockRead`, `heldIn`, `heapLeft`,
    `madeOf`, `tallyOf`, `shareOf`, `panRead`, `ledgerOf`, `atomsIn`, **`limitOf(have, need) -> {made, limiting, left}`** (the arithmetic of a recipe against heaps),
    `pileSlots`, `pileOf`; furniture `heapTable(spec)`, `HEAP_BOUNDS` (120 x 64, the atom tables'). `atoms.js` `SCOPE_KINDS` gained `k07` (nitrogen, the
    scope's old Kettle entry) and `mass.js` knows `sodium`.
  - **Core and view changes.** `model.js`: a container may carry `props` (plain data the kit reads), and a kit's `run` may answer `contents: {containerId: {what: delta}}`,
    which the reducer applies (the only way a run moves what a container holds; `verify:table` still holds every Run key to "changes the table"). `table2d.js`
    `drawTable`: a kit may paint a container's contents itself (`kit.paintContainer(ctx, c, state, {X, Y, sc, bodies})`; `view.piles === false` leaves the dots to the
    built table). `table3d.js`: **one InstancedMesh per pile** (`kit.pileOf(container) -> {n, cap, slots, r, colour}`), laid once on the capacity's slots and shown
    `n` at a time, so a heap drawn down loses its outermost atoms and the rest stay put (`viewer.piles`; `boardSignature` includes capacity and pile). `pileSlots`
    is stable in the capacity alone, nearest the middle first, with a mound height for the built pile; `verify:bench` builds piles of 300, 200 and 150 and holds them to
    three draw calls, every atom inside its container, above the plate and clear of its neighbours, and fewer atoms after a draw.
  - **Rooms** (`engine/rooms.js`): a quest with no world under it names a room (`export const ROOM = 'foundry'` in the quest module; `createRunner` takes `cfg.room`;
    `Tabletop` and `BenchViewer3D` take `opts.room`) and the viewer builds that instead of the generic lab bench: `build(viewer) -> {bench, set, mats, lights, key,
    lamp}`. The viewer's `room.mats` dress the table (`top`, `dark`, `tray`) exactly as a host's `benchMats` do; `buildBench` / `buildLighting` use the room's own
    bench, set and lamp; a deployed world still wins (`opts.world` first). **The foundry** (Kettle): a cast-iron assay plate 4.8 x 1.3 m on rolled-section legs with an
    apron and a shelf of ingot moulds, a splash plate along its back (a rail of hung tongs, three brass gauges, a rack of mould boards: the part of the room the lean-in
    camera always sees beyond the table), a rail track across the floor with a slag cart, a firebrick wall 2.35 m behind the plate with pilasters, plate pipework and a
    furnace mouth, ore hoppers and ingot stacks out beyond the bench's ends, a crane rail with a hanging ladle, and **one pendant lamp over the plate** (a lens, the one
    emissive mesh in the room, with the spot that lights the plate), about 3300 triangles in 169 plain meshes (the budget `verify:bench` holds is 6000).
  - **Quests.** `q1-recipe` (8 stages, no `choice`; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, rewards and stage count unchanged): 1 build one molecule from loose atoms to match three
    dishes of one substance (the dishes' pictures against the loose atoms by tint and size); 2 draw the shaker under two dishes and tray the one that is not a true compound; 3 weigh
    atoms loose on the scale's pan, lift them off, join them on the table, put them back and weigh again (the strip keeps molecules made against total weight: the two points
    sit at one weight); 4 build water in the dock, copy it from two heaps until one cannot supply another, put the "Runs out first" tag on that heap and set the tally to
    the molecules made (graded on the heaps' own capacities through `limitOf`: **a player who has the answer is never blocked for want of a key press**); 5 weigh the atoms of one
    molecule one by one and set a bar of a hundred parts at the oxygen's share (88, 89 and 90 pass, the true share being 88.9; the atoms' shares 33, 50 and 67 each get their reason);
    6 build the molecule whose ledger of weights runs three to eight (carbon dioxide; carbon monoxide has a reason); 7 tray three dishes under the recipe their molecules follow
    (reference atoms along the side); 8 shake three shipments and tray them against a label. `boss-golem` (2 phases, `encounter` per phase kept, foes only from `planFoe()`, the
    golem in the table's corner pad, no field stage): 1 the maker again, with sodium chloride and heaps of 9 and 14 (graded on the tally alone); 2 two crates of sodium and chlorine
    weighed on a scale in grams against the listed molar masses, the tally set to the moles (2). Both lines are gone from `tools/table-legacy.json`.
  - **Foe body.** The recipe golem's boiler was trimmed (0.09 m tall rather than 0.12, a squatter body) and its lunge and its sink on dispersal match the other table foes (0.05 and
    0.01 m), so it stays inside the table's foe pad and the free glass at every aspect.
  - **Checks.** `verify:learn` ("Kettle's tables are real", replacing the old scope-joiner block): the molecule three dishes share and the molecule built, the shaker's layers
    (`layersOf`), what the pan weighs before and after (the listed masses), the maker's copy against `limitOf` and the heap it empties, the share against 16.0 of 18.0, the ledger's
    three to eight, each sample's recipe from its own molecule, each shipment against its label, the golem's heaps and drums. `verify:bench`: the real-stage loop now plays a quest
    with no world (a named room, dressed from the room's own materials, never the bench kit's, no field stage) and the Hopper's fight check runs for the golem (two phases, every
    pose inside the pad and the glass), plus **"Kettle's room, from the lean-in view"**: the bay's six volumes clear, `sight` and `view` rays at seven viewports (a ray grid that
    reaches a wall, a prop or the floor beyond the plate), one lit lamp over the plate with its spot, a table in the room's materials with a negative control, a triangle budget,
    negative controls for the volume, the sightline and a room with no walls, and the instanced piles above.
  - **Deviations from §4.** (1) **A maker copies the molecule, rather than the player joining every atom of every molecule** (nine molecules of three atoms by hand is 27 drags a
    stage): the one molecule is still built by hand and every join is the planner's, and the count is what the heaps hold. The heaps are 18 and 11 atoms (the golem's 9 and 14), small
    enough to count and for a tally dial to reach; the instanced pile is proved at hundreds in `verify:bench`, but no stage asks for a heap of hundreds yet. (2) `q1-recipe` s2 uses
    trays and the shaker (the old Settle key), as Tallow `q1-grain` s7 does. (3) s3 asks the player to lift the atoms off the pan before joining them (a drop into a container is a
    drop into the zone, never a join: `snap.js`), so the same atoms are weighed loose and joined. (4) s5 is a share bar, not a typed percent; (5) s7's "crates" are the same dishes as
    Tallow's samples. (6) `boss-golem` phase 2 weighs and tallies (grams to moles is the calculation the phase is about); it builds nothing. (7) The heap-kit stages 3 to 7 carry no
    scratch corner (the table has no room for it beside the strip and the heaps); stages 1, 2 and 8 are atom-kit tables and keep it. (8) Kettle has no field stage (§2.5).
  - **Integration (§2.6).** There is no world to integrate with, so the room is held to what a host is (above): the table is the foundry's own cast-iron plate with firebrick ore
    tubs for trays; from the lean-in pose at every aspect the frame is the plate with the splash plate (tongs, gauges, mould boards) at its far edge and the floor, the rail track
    and the wall's base beyond it (at ultrawide the ingot stacks, hoppers and the cart's side too); the `lean` and `sight` boxes are clear; the lamp is over the plate and out of the
    camera's air. Nothing is in `tools/bay-legacy.json` for Kettle (it has no bay).
  - **Deferred.** The assay beam, the balance and the scale are still painted on the plate rather than standing (`fixture3d`, as T2b); pans and trays are flat pictures with low rims
    (a tray of firebrick is a rim colour); no sound for the foundry; the room's lamp is a scene light in the viewer's own scene, not a `lampMark` (the viewer's scene has no
    `LampPool`); only the one room exists, and a second unwalkable world would add its own to `ROOMS`; `bake:stills` for Kettle; the old scope instrument (`SampleScope3D`) now serves no
    quest and is retired with T7.
  - **For the user to look at in a browser, per bench.** Kettle, 3D On (`#/learn/unit07/q1-recipe`; there is no world to walk, the quest opens in its room). **Bench 1**: the camera should
    fly over a cast-iron plate with the table filling the glass between the prompt strip and the dock, the splash plate with its tongs and gauges along the top, the rail track and a slag
    cart beyond it, a brick wall's base at the very top at a wide aspect; a pendant lamp should light the plate warm and nothing else should glow. Stage 1: join H onto O twice, the
    third H should drift away. Stage 3: put three atoms on the pan, press "Weigh", lift them off and join them, put the molecule back and press "Weigh": two points on the strip at the
    same height. Stage 4 (the one to try first): build water, drop it in the dock, press "Make Molecule" and watch the hydrogen heap lose two dots a press; the press after the hydrogen heap
    is spent should say why; put the tag on that heap and set the tally. On the built table the heaps are real mounds (one body each); check they read as heaps at 375 px and that a
    press that misses a piece still only swings the view. Stage 5: the marker is a hundred steps along a 100-unit track, so check it can be set to 89 with a thumb on a phone. Stage 6: the
    ledger should list carbon and oxygen weights for whatever is on the pan. **Boss** (`#/learn/unit07/boss-golem`): the boiler golem stands in the table's top-right corner pad, clear of
    every piece, at both phases; a miss should tilt it, a clear should disperse it.
- 2026-10-17: **T2 closing note (for the user, before T3).** T2 is complete: the card kit, the mass kit and the heap kit; Tallow's seven quests and Kettle's two are tables (nine quests,
  63 stages, no `choice` left in them). These are the things a check cannot judge and the plan wants looked at: (1) **the three kits' honesty**: every join is
  `joinbench.js`, every weight a listed mass, every count what a heap or a pan holds, and `verify:learn` recomputes each graded answer from the planners; but the maker (heap kit) is
  the one place a machine does repeated work, so ask whether "build one, then copy it from the heaps" reads as chemistry (it is meant to read as a recipe) or as a vending machine, and
  whether stage 4 teaches why one heap runs out. (2) **Standing geometry**: the balance, the assay beam and the scale are pictures on the plate (the same as T2b), so a pour or a weigh
  has no mass moving in 3D; heaps are real instanced mounds. If the lean-in view looks flat, `kit.fixture3d` is the hook. (3) **Phones**: the share bar asks for a hundred steps along one
  track, stage 3 of Kettle asks the player to lift atoms off the pan, and the card tables ask for a lot of drags on a 3.7 : 1 plate; these are where a thumb will tell us the model needs
  a gesture. (4) **The foundry**: the first room built for a bench with no world; if it reads as a good place, the next unwalkable world (Kettle's other quests, then any chart that
  has no site) gets a room in `rooms.js`, not a bench kit. (5) **Tallow as a whole** is now one process line worked entirely by hand, from the conveyor tail to the sack scale and the
  Hopper; it is the right place to judge whether the tabletop makes Unit 1 less confusing. T3 (Ligar's remaining nine, bond crank, domain hub, mixer, MO rack) starts from the atom kit and
  the slate; nothing in T2 changes `PANEL_LAYOUT` or any station-row bench.
- 2026-10-17: **T3a built** (first third of T3: Ligar `q2-lattice`, `q3-distance` and `q5-resonance`, the bonds kit, the ore drift's field point). T3b owes
  `q6-shape`, `q7-polarity` and `q8-hybrid` (the domain hub, field plates, mixer), T3c `q9-orbitals` (its `lean`/`sight` waiver in `tools/bay-legacy.json`
  stays until then) and `boss-warden`, which still plays the old instruments. Nothing here is browser-tested; the drawn tables were rendered to pictures in Node and
  read, the built twin is held by `verify:bench`. Shipped, and the API T3b onward builds on:
  - **Bonds kit** (`table/kits/bonds.js`, id `bonds`, extends the atom kit: an `atom`, an `ion` and the Lewis slate work exactly as `atoms.js` says; a thin wrapper
    over `joinbench.js` `planSlab`/`conductionOf` and `bonddata.js` `PAIRS`/`morse`/`planCurve`/`LATTICES`/`IONS`). **A block** (`slab`, `props.slab` its old declaration:
    `build`, `melt`, `tint`, `sealed`, `cluster`, `groups`) is MOLTEN exactly while it lies on open table with its middle inside a **hotplate** fixture (one dial, `heat`) at or past
    its melting point (`slabView`, `plateArea`, `hotplateUnder`): nothing is stored, so the temperature a block gives way at is found by turning the dial and lifting it off cools
    it. Tool pieces laid on a block: the **hammer** (`once`, writes `struck`; what a blow does is the old bench's own `strikeOf`), the **leads** (stay on the block; their lamp is
    `conductionOf` for the block as it is now) and the **tongs** (`once`; `liftCells`/`liftOf`: the connected group round the atom nearest the middle, in `planSlab`'s links
    for the phase the block is in; the tongs log every lift in `props.lifts` and the block rings what has gone). Pure readers: `slabView`, `liftCells`, `liftOf`, `liftsOf`,
    `groupsOf` (the separate groups a whole block is made of), `smallestPiece`, `strikeOf`. **The lattice grid** (fixture `lattice`, its cells are `slot`s, ions are `ion`
    pieces): Run "Slide a Layer" toggles `slid` on the top row's ions and `gridRead` reports like and unlike neighbours and which pairs now face a like charge (their ions
    print the stencilled `!`). **The wells** (fixture `wells`, `props.rows [{id, pair, label, start}]`, one dial a row): a pair's separation is the position of the hand on
    a track; `kit.dialed` keeps `{lo, hi}` per row (the curve is drawn only over the stretch the hand has been through, `paintWells`, `wellRead`), a `marker` dial draws a level
    line for a stage that asks for a depth, and a stage's Run key may release a pair (`props.release`): it settles at `PAIRS[...].r0`. `innerZero(pair)` is where squeezing
    brings the energy back to zero. **Cards**: `salt` (two ions to scale, their charges and centre distance, molten past `LATTICES[...].melts` on a hotplate) and `pairtag`
    (two atoms and the rods between them). Bounds 150 x 72 (`bondsTable`, `BONDS_BOUNDS`).
  - **Atom kit / Lewis slate additions** (`atoms.js`): three readers dropped on the slate: `fcstamp` (prints `planLewis`'s own `fc` on an atom, live), `mark` (a dashed ring that
    stays, or comes off) and `gauge` (on a joint with a pair in it: the length `lewis.js` `gaugeLength` reads off the REAL molecule, not the drawing); `three` ("3 Pairs") deals up
    to three lone pairs at once; `slateParts(..., {prefill})` starts a slate with a drawing on it (a skeleton to put electrons round, or a finished drawing to read).
  - **Core changes** (each small, each generic): `snap.js` `joinCandidates` asks `kit.pairable(me, o)` (a block set beside a block is just set down, not a failed join that drifts it
    off the plate); `model.js` `setDial` calls `kit.dialed(state, fixture, dial)` and writes the fixture props it answers, and a kit `run` may answer `dials: {fixtureId: {dial: value}}`;
    `layout.js` `fixtureLayout` honours a fixture's `props.margin`, `rowPitch`, `top` and a per-dial `grab` band (`gestures.js` `fixtureHit` uses it: a row of atoms drawn on a track is its
    handle); `table2d.js` sizes a square token to its words (`ctx.measureText`). The guide for a field point now passes `siteId` and `to`, so Ligar's `routeTo(siteId, from, toPos)`
    leads doorway by doorway to the place to stand and not to the bench (`voyage.js` `setGroundWaypoint`).
  - **`q2-lattice`** (8 stages, no `choice`; line gone from `tools/table-legacy.json`; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, every reward and the stage count unchanged): 1 order three blocks
    on a rail by the setting each gives way at on the hotplate (a block chipped from the drift's seam is the field item, a fourth block that is not ranked); 2 build a 4 x 3 grid of twelve
    ions with no like charges touching and slide a layer (two blocks and the hammer stand beside it as the evidence); 3 tray three blocks by when the leads' lamp lights (cold and molten,
    only molten, never); 4 break the vent block down and set a tally to the fewest atoms left bonded in one piece; 5 take hold of one atom of the arch block with the tongs and tray the
    block by what came out; 6 lift a molecule out of one block (graded on what the tongs log: a separate group of the whole block, never half of a struck one); 7 tray four sealed
    blocks by build; 8 slot the one liner that holds at 900 degrees and passes no current.
  - **`q3-distance`** (8 stages, no `choice`; line gone): 1 pull the hydrogen pair apart and leave the hand at the bottom of its well (within a tenth of the bond length, six pm at least);
    2 set a depth marker against the bottom of the hydrogen-chlorine trace (within 15 kJ/mol); 3 squeeze the pair in until its energy is back at zero; 4 a **prediction** on a new
    case: three hands on one plot (H-H, Cl-Cl, F-F), place Inside / Between / Outside and "Release Pair C" (it settles at its own bottom); 5 rail three carbon pairs from the longest
    bond; 6 rail the same pairs from the hardest to pull apart (the opposite order, found); 7 rail three salts by how strongly their ions are held; 8 hotplate two salts and slot the one
    that needs more heat. `verify:table`'s count of old `order` stages drops from 14 to 12 (`ORDER_STAGES_LEFT`).
  - **`q5-resonance`** (8 stages, no `choice`; line gone): 1 stamp both atoms of carbon monoxide and mark the one that carries a plus; 2 draw carbon dioxide so every lamp is lit and every charge
    is zero (the lamps alone cannot choose, the stamp can); 3 draw thiocyanate with its minus on the stronger puller (the drawing is graded on `planLewis`'s `fc` and `vsepr.js` `EN`); 4 gauge
    both ozone bonds and tray the second by its length against the first (the drawing says double and single, the gauge says alike); 5 nitrate on three slates (skeleton given, `3 Pairs` deals
    a whole set of lone pairs), graded on three different drawings that each light every lamp; 6 gauge the three nitrate bonds and set an order dial (steps of a twelfth) to what four pairs
    shared by three bonds come to; 7 tray carbonate's three locked drawings More / Same / Less; 8 water on two slates: only lit drawings are compared and the stage passes when they all agree
    (the second slate is the try-and-fail). Stages 5 and 7 are on the bonds kit at 150 x 72 (three four-atom slates are wider than the atom table's 120).
  - **Deviations from §4.** (1) q2's "stack molecules" is the vent block's tally and the tongs (stage 4 and 6), not a second grid. (2) q3 s3 and s4 are an energy level (back at zero) and a
    prediction rather than "why" choices; q3 has no separate "ruler rail": the rails are the standard rails with the end labels the plan names. (3) Pairs are not dragged between positions on a
    slate in one gesture: "Lift Out" and "Pair" are two drops. (4) The standing geometry of the hotplate, the wells and the grid is still painted on the plate (the same deferral as T2b, `fixture3d`);
    pieces and rims are in the host's materials. (5) The old join bench's block plates and the bond bench and pair board serve no stage of these three quests now; the warden's room keeps the
    bond bench, the pair board and the join bench's pairs, so `verify:bench` measures them there (`LG_BENCHES` drops a quest whose stages are all tables).
  - **Integration (§2.6).** Bench 2 (ore drift, underground): `lean`/`sight` were already clear (no waiver), the table is dressed from the drift's own plate steel with basalt trays, the hearth,
    anvil, quench trough and tong rack stand at the sides, a **lamp hangs over the back of the plate** (`ligar/stations.js`, a `lampMark`, no new light in the pool; `verify:ligar` holds it
    for every underground bench whose quest is a table) and a **chisel and lump hammer** lie on the vein's plinth. **The field point `chip`** ("Seam Chip") is the vein slab on its plinth, a real
    part of host `site-2`; the place to stand is 1.0 m in front and to the left of the plinth (host frame x 3.2, z 1.0, clear of the trough and the wire drums); `verify:ligar` holds it to: belongs to
    a site, solid at the point, a clear and level place to stand, inside `[E]` reach, on ground the walk reaches from the pad, and a guide route (`routeTo(site, from, stand)`) that is walkable end to
    end and ends on the stand; `verify:bench` plays stage 1's fetch through the registered point (chevron to the stand, no site plate, `[E]`, carry, the block on the table). Benches 3 (crusher
    inspection deck) and 5 (mine substation at the main portal) stand on the surface in daylight and cleared the lean-in camera without a waiver: nothing moved. Every table is dressed from Ligar's
    own materials (`mats.tray` is basalt).
  - **Checks.** `verify:table`: all 24 stages (by script, drag, two taps and the drawn tabletop's own gestures, with a miss and no authored outcome each). `verify:learn` ("Ligar bench two" and the
    rewritten q3 and q5 blocks): every block is a real build with a melting point the dial reaches, a block is molten exactly while it is on a hot plate and cools off it, every graded answer is
    recomputed from `planSlab`, `conductionOf`, `morse`, `LATTICES` and `planLewis`, the three pairs' orders are opposite, nitrate has exactly three drawings and water exactly one way to light its
    lamps from its skeleton. `verify:bench`: all 24 stages at seven viewports through the real pointer path by drag and by two taps. `verify:ligar`: the field point and the bench lamp.
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Ligar, 3D On. **Bench 2** (`Bench 2 - Stone and Wire`, the ore drift just inside the main adit): lean in; the
    plate should fill the glass with the hearth and anvil at the sides and a lamp over the back of the plate. Stage 1: press W to stand up, the chevron should lead through the portal and along the drift to
    the vein on the right (it ends in front of the plinth, not at the bench), `[E] TAKE SEAM CHIP` appears when you point at the slab, lean in again and a fourth block is on the table. Drag a block
    onto the hotplate (it lies on the plate while its middle is inside the ruled area), drag the heat dial: the block turns to scattered pieces and reads MOLTEN at its setting and comes back when you
    lift it. Stage 2: drag ions into the grid, press "Slide a Layer": the `!` marks should appear on the ions that now face a like charge. Stage 3: drop the leads on a block; the lamp ring fills while a
    current passes. Stage 5 and 6: drop the tongs on a block: it prints how many came out and the block shows rings where they were. **Bench 3** (`Bench 3 - Bond Energy`, the crusher's inspection deck): drag
    along a pair's track (the whole row of atoms is the handle): the curve draws behind the hand and an amber square rides on it; stage 4 needs a prediction token in its slot before "Release Pair C".
    **Bench 5** (`Bench 5 - Charge and Resonance`, the mine substation): drop the "Stamp" piece on an atom (its charge prints on its shoulder), "Gauge" on a joint holding a pair (its length prints beside
    it), "3 Pairs" on an atom. On a phone held sideways check the wells' hand (the knob is small; the row of atoms is the handle), the slates of stage 5 and 7 (150 units wide) and the thin tokens of q3
    stage 4. At 3D Off the same stages draw flat on the deck, with a drawn "Chipped block" plate in stage 1's corner.
- 2026-10-17: **T3b built** (second third of T3: Ligar `q6-shape`, `q7-polarity` and `q8-hybrid` on the domain kit, the sump's field point, hosts 6, 7 and 8). T3c owes
  `q9-orbitals` (its `lean`/`sight` waiver in `tools/bay-legacy.json` stays until then) and `boss-warden`, which still plays the old domain rig, bond bench, pair board and box
  rack (`verify:bench` still measures the rig there). Nothing here is browser-tested; the drawn tables were rendered to pictures in Node and read, the built twin is held by
  `verify:bench`. Shipped, and the API T3c onward builds on:
  - **Domain kit** (`table/kits/domain.js`, id `domain`, `domainTable(spec)` = 150 x 64 units; four files: `domain-hub.js`, `domain-field.js`, `domain-orbitals.js`, and `domain-draw.js`
    for the shared pictures). A thin wrapper over `vsepr.js` (`planDomains`, `angleBetween`, `domainStrain`, `planDipole`, `planBlend`, `planTwist`); no stage declares an outcome.
    **Hub.** A `hub` piece (fixed) is a join target. An `arm` (`props {sym, mult}`) or a `balloon` (lone pair) is a TOOL laid on it (`kinds.x.tool`, `target: true`), so dropping one on the hub
    clips it and dragging it away unclips it. **`kit.settle(state)`** (new, called by `model.js` `apply` and `createTable`) poses every clipped arm at the vector `planDomains` gives
    it, seen from `openingView(vectors)` (the turn and tilt that keep the arms furthest apart on the plate, a fixed scan) plus the `turner` fixture's dial; the table eases the arms there,
    which is "clip them on and they push apart". The `protractor` (tool, a pass) remembers the last two arms it touched; `protractorRead` is `angleBetween` of them; `hubRead` gives the plan,
    the atoms and lone pairs, `hubHeight`. Fixtures: `hubplate` (ARMS, ANGLE and optionally HEIGHT), `turner` (the Turn dial), `marker` (a dial the player sets to a number they read).
    **Frame.** `frame(id, sym, n, at)` returns a `sockets` fixture and one slot per socket of the n-domain polyhedron (`socketPoints`, labelled End / Middle / Side); `frameRead` reads
    `vsepr.domainStrain` of what stands in the slots (STRAIN, NEAREST, PAIRS APART on the plate) and whether it is the lowest any arrangement of those domains can have.
    **Molecule cards** (`mol`, static; `dmol`, put in a field; `tmol`, a `dmol` that can also be flipped) draw `RIG_MOLECULES` (or `props.arms` after a swap) with `molRead` (plan, dipole, angles,
    shape). **Plates** (`plates` fixture; a card is IN THE FIELD when its middle is inside `gapArea`, on open table, like a block on the hotplate; Run "Switch Field" throws a hidden dial) swing a
    card so its net pull points at the positive bar when the field is on and `planDipole` says the pulls add; `dmolBehaviour` / `dmolPose` are the readings. Tools: `arrows` (laid on a card:
    an arrow per bond and NET), `swapper` (a pass: the first outer atom that is not its own element becomes its own, so CCl4 becomes CHCl3), `rod` (laid on a `stream`, which bends toward it
    exactly when the liquid's molecules are polar). **Orbitals.** An `orb` piece (`props {type, atom, e, axis?, to?, dir?}`) is drawn with its lobes and electrons; `planOrbJoin`: two orbitals on different
    atoms, each with a single electron, that point at each other (`to`) make a sigma bond, two p orbitals on one axis a pi bond (the link records `type`), anything else is refused with the picture's
    reason; `bondsBuilt` counts them. A `mixbowl` fixture with a still container is the mixer: `bowlRead` is `planBlend` of the s, p and d in it (lobes where `planDomains` puts that many arms, the
    p left out standing over). A `twist` fixture's dial turns the far end of a bond (`twistRead`: free where `planTwist` says so, `held` where it does not).
  - **Core changes** (each small, each generic): `model.js` `kit.settle`; `layout.js` `fixtureLayout` honours `props.hidden` (a dial that carries state with no control); `snap.js` `joinCandidates` lets a tool that
    is `kinds.x.target` be a join target (a protractor is laid on an arm that is laid on a hub); `vsepr.js` gained `REPULSION`, `domainStrain`, `arrangements`, `bestStrain`, `socketAngle`, `hubHeight` and
    `planBlend`; `verify:table`: a fixture with `props.backdrop` is a surface things stand on (pieces start on it, zones lie in it).
  - **`q6-shape`** (8 stages, no `choice`; line gone from `tools/table-legacy.json`; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, rewards unchanged): 1 set a marker to the angle two arms settle at; 2 four arms, 109.5;
    3 build ammonia's hub so nitrogen sits at the peak of a low pyramid (graded on `hubHeight`: three atoms alone lie flat, so the lone pair has to go on); 4 water's measured angle with both lone pairs on;
    5 the domains round CO2's carbon (two double-bonded arms are two arms); 6 and 7 the frame: put the lone pair (SF4), then both lone pairs (XeF4), where the strain is least (graded on `frameRead.lowest`, and
    `verify:learn` holds every lowest arrangement to the planner: round the middle, and opposite); 8 tray three hub cards (XeF2, BF3, XeF4) under the shape their atoms make, the card printing the angles between its atoms.
  - **`q7-polarity`** (8 stages, none `choice`; two predictions are table tokens): 1 turn HCl (Flip) so its partial negative end faces the positive plate (graded on the pose the field would turn it to);
    2 tray NaCl, H2 and HCl by how evenly the bond shares (the arrows' NET is the evidence); 3 predict whether CO2 turns, then Switch Field; 4 tray water and CO2 by whether the arrows add or cancel;
    5 change one atom of CCl4 with a swap tool so that it turns; 6 predict which of NH3 and BF3 turns; 7 tray three molecules polar or nonpolar; 8 (FIELD) lay the rod on three streams and tray those that bend, with a
    fourth stream drawn from the sump as evidence and never a lock.
  - **`q8-hybrid`** (8 stages, no `choice`): 1 bond hydrogen atoms to carbon's orbitals as they stand (two bond, a third is refused: the puzzle, found); 2 mix carbon's orbitals for one lobe for each of methane's bonds;
    3 and 4 tray NH3, H2O, C2H4 and CO2, BF3, HCN by the lobes the centre needs (each card prints the arms the planner counts); 5 build the second bond between ethene's carbons (a lobe on a lobe is the first bond, a
    leftover p on a leftover p is the second); 6 build every bond of HCN from its orbitals (2 sigma, 2 pi, checked against `countSigmaPi`); 7 turn the far end of ethane's bond and ethene's a quarter turn if they will
    (graded on what each end did; the double bond's knob turns and the end holds); 8 two bowls with s and p orbitals already in them and a tray of d orbitals: add them until each bowl makes the lobes its card has arms (5 and 6).
  - **Field point `sump`** (`three/ligar/stations.js` `buildSumpStation`, host `site-7`): the draw-off cock on the sump's front wall with a stub over a catch bucket and the sump's water running from it;
    the player stands 1.6 m in front of the bucket (host frame x 3.9, z 5.2). `verify:ligar` holds it to the same rules as `chip` and now names it; `verify:bench` plays stage 8's fetch through the registered point
    (chevron, `[E]`, carry, table) and, at T1 to T3, the drawn site plate.
  - **Integration (§2.6).** Benches 6 (drill chamber), 7 (sump and pump station) and 8 (survey station) are all underground, so each now hangs **a lamp over its plate** (`w.buildLuminaire(0, 3.7, -1.0)`, a `lampMark`
    in the pool: the pool is still three lights; `verify:ligar` holds "every underground bench whose quest is a table has a lamp over its plate" for four benches now) and stands an **ore tub with a miner's pick** at
    the plate's side (outside the bay's x 2.7), each host's table being dressed from Ligar's plate steel with basalt trays as before. `lean`/`sight`/`view` were already clear for all three (no waiver to delete);
    `tools/bay-legacy.json` still waives only `ligar/q9-orbitals`.
  - **Checks.** `verify:table`: all 24 stages (script, drag, two taps, the drawn tabletop's gestures, a miss each, no authored outcome, 28 px pieces, nothing starts on another thing). `verify:learn`: each angle graded
    is `angleBetween` of the arms on the hub, the frame's lowest arrangements are exactly where `planDomains` puts the lone pairs, every molecule the hub can hold settles with arms apart and inside the plate, every
    polarity answer is `planDipole`, a swap of one chlorine is CHCl3, every bowl is `planBlend`, every bond built is the molecule's own sigma and pi, a single bond turns and a double does not. `verify:bench`: all 24 stages at
    seven viewports through the real pointer path by drag and two taps, and the sump's point. `verify:ligar`: the lamps and the point.
  - **Deviations from §4.** (1) `q6` s3 and s8 are graded on a height reading and a tray, not a build of "the lone pair out of the shape"; s6 and s7 grade where a lone pair is put on a frame of sockets (the hub with its arms
    posed by the planner is stages 1-5), so there are two hub forms. (2) The protractor is touched to two arms in turn (a pass that remembers two), not laid across them. (3) `q7`: stage 1 turns a card with Flip rather than
    asking which end; stages 3 and 6 are predictions (new cases of an idea worked out); stage 4 is a tray rather than a "why". (4) `q8` s7 grabs a knob, not the bond end itself. (5) Arms and orbitals are 6.3 units across so a
    thumb takes them at 340 px; hub, balloon and orbital pictures are paintings on pucks (the same deferral as T2b: no standing geometry, `fixture3d` unused).
  - **Deferred.** The hub's arms are pucks in 3D (rods for bonds, one rod for a balloon), not the old rig's lobes; the bond's far end is not itself grabbed; hybrid names are not printed on the bowl's output;
    `domainrig.js` and `domainrig3d.js` stay for the warden until T3c.
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Ligar, 3D On. **Bench 6** (`Bench 6 - Molecular Shape`, the drill chamber in hill A): lean in under the new lamp over the back of the
    plate; the rock-bolt board is behind it, the jumbo's flank to the left and an ore tub with a pick at the right edge. Stage 1: drag an arm onto the hub (the big disc at the left): it clips on and the pair swings to
    opposite sides; drag the protractor onto one arm then the other and its face and the plate print the angle; the Turn dial swings the picture; set the Angle marker. Stage 3: with three hydrogen atoms HEIGHT reads 0
    and the lone pair makes it lean. Stage 6 and 7: drop the pieces into the places of the frame and read STRAIN. **Bench 7** (`Bench 7 - Polarity`, the sump and pump station down hill B's decline): the plates
    stand at the left, trays at the right. Drag a card between the bars and press "Switch Field"; the bars light and a polar card swings round; lay "Arrows" on a card. Stage 8: press W, the chevron leads down the
    decline to the sump; `[E] TAKE SUMP STREAM` when you point at the cock on the sump's front wall; back at the plate a fourth stream is on the table. **Bench 8** (`Bench 8 - Hybridization`, the junction of three drifts):
    drop orbitals in the bowl and the lobes draw beside it; drop an orbital on another to overlap them (a refusal says why); stage 7's knob turns ethane's far end and not ethene's. On a phone held sideways the hub
    and orbital pieces should still be easy to hit, and a stage-6 frame piece should fall in its place. At 3D Off the same stages draw flat on the deck.
- 2026-10-17: **T3c built** (last third of T3: the orbital kit, Ligar `q9-orbitals` and `boss-warden`, the hoist chamber, the T3 close-out). **After this every Ligar quest (nine
  benches and the Warden) is a table**, as are all of Tallow and Kettle; `tools/table-legacy.json` lists Lanternfall, Bellows and Ember only, and `tools/bay-legacy.json`
  has no Tallow, Ligar or Kettle line. Nothing here is browser-tested; the drawn tables are proved in Node and the built twin by `verify:bench`. Shipped, and the API T4 onward builds on:
  - **Orbital kit** (`table/kits/mo.js`, id `mo`; a thin wrapper over `engine/mo.js` `rowsMO`/`readMO`/`fillMO`/`DIATOMICS`, no second implementation). **The rack**: a `rack` fixture
    (a backdrop; `rackGeometry(order, at)` is the one place the boxes stand) draws the ladder, the atoms' boxes at the sides and the boxes between them; **each MO box is a container**
    (`capacity` 2, `contents {electron: n}`, `props.mo {rack, row, idx}`) and the loose electrons are a `supply` container. An electron is POURED: a drag from the jar to a box (or a tap on
    each), back to lift one out, box to box to move it; the first in a box stands up and the second points down, so a box holds a pair or nothing, and a third is refused with the rack's
    own reason. `Join Atoms` is the rack's Run key on a stage that starts with the atoms apart (a hidden `merged` dial). **The magnet** (`magnet` fixture) reads `DIATOMICS[mol].unpaired`,
    the REAL molecule, never the rack; with `props.slot` it tests the gas card in that slot and writes the pull on the card. A `bondtest` fixture prints the listed bond energies; a `marker`
    is a plain dial. Cards (`mocard`, rect) carry a label and, for a species, its lower/upper counts (`cardCounts`, from `fillMO`). Readers a stage's `check` and `verify:learn` use:
    `rackOf`, `readOf`, `matchesGround` (row by row, a row's boxes alike), `supplyLeft`, `magnetRead`, `bondTestRead`, `cardPull`, `rackOrder`; builders `moTable` (150 x 64), `moRack`,
    `moSupply`, `magnet`, `bondTester`, `marker`, `moCard`, `fillSteps` (the pours of a ground state). **Core hooks, small and generic:** `kit.pourRefusal(state, from, to, what)` (why a pour took
    nothing; `model.js`), `kit.noJarFill(container)` (`table3d.js` draws no slab of fill in a box).
  - **`q9-orbitals`** (8 stages, no `choice`; line gone from `tools/table-legacy.json`; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, the rewards and the stage-5 lead line are unchanged): 1 put the two new boxes
    and an atom's box on a rail from lowest to highest energy (`Join Atoms` draws the new boxes, numbered); 2 pour H2's two electrons so the molecule has the least energy; 3 He2's four and a bond-order
    marker (zero); 4 N2's ten and the marker (three); 5 O2's twelve **so the rack pulls on the magnet as hard as the real sample does** (the player discovers that the last two stand alone); 6 three species cards
    (O2, O2+, O2-, printed with their lower/upper counts) laid on a rail by bond length; 7 F2's fourteen with a bond tester and a prediction token against an O2 reference card; 8 B2's six, a magnet and a
    prediction token (the order of the boxes is the other order, so pairing them as oxygen's would predict wrong). Misses carry a reason and no answer; every graded fill is the ground state.
  - **`boss-warden`** (5 phases, each its own table; `encounter {species, act, intent}` kept per phase, one `foes` entry each, no field stage, the pad clear): 1 `bonds` kit, three plating blocks,
    a hotplate and the marked place for the one that takes the most heat; 2 `atoms` kit, SF4 on the Lewis slate with the `3 Pairs` tile; 3 `domain` kit, the xenon hub, tray of four fluorines, two
    lone pairs and a protractor, and the angle marker; 4 `domain` kit, the plates, three molecule cards (CO2, SF4, NH3) and a tray for those that turn; 5 `mo` kit, three gas cards, a magnet with a test
    slot and the place for the gas it draws in. The foe is the warden, in the table's corner pad, reading no probe (as the Hopper and the golem). **Its body was made squatter** (`foebody.js`, scale 0.58:
    no well holds a warden any more) so every pose stays in the pad. `BOSS_ARENA_SPOTS['boss-warden']` is unchanged. Its line is gone from `tools/table-legacy.json`.
  - **The hoist chamber** (bench 9, `ligar/stations.js` `buildHoistChamber`): the winze's kerb, A-frame and sheave moved to the BACK of the chamber (behind the plate), the rope's pylon to z 0.5, so the rope
    no longer crosses the leaned-in camera's air (the check measures a body's box, so a rope laid diagonally across the lean volume spoils it); a lamp over the plate (`lampMark`, the pool is still three
    lights), an ore tub and pick at the left of the plate, the skip moved beside the collar. **`tools/bay-legacy.json` has no Ligar line any more** (its `ligar/q9-orbitals` `lean`/`sight` waiver was the last).
  - **Orphaned drawn instruments (T7 retires them; nothing was deleted).** No quest of any world plays these any more: **`JoinBench`** (`joinbench.js`'s class + `joinbench3d.js`; the pure `planJoin`/`planSlab`/`conductionOf`/`shellPlan` stay in use by the kits),
    **`BondBench`** (`bondbench.js`, `bondbench3d.js`; `bonddata.js` stays), **`PairBoard`** (`pairboard.js`, `pairboard3d.js`, `paircontrols.js`; `lewis.js` stays), **`DomainRig`** (`domainrig.js`'s class, `domainrig3d.js`, `rigcontrols.js`; `rotateView` and `vsepr.js` stay),
    and, from T1 and T2, `SampleScope`, `CoreBench`, `CatalogueBoard`, `AssayFloor`. `BoxRack` is NOT orphaned (Lanternfall `q5-numbers`, `q6-filling` and `boss-eater` still play it), but its `molecular` layout
    (`boxrack.js` `drawMolecular`, `combine`, the MO-aware `act`) is. `verify:bench` no longer builds the Ligar ones ("every Ligar quest is a tabletop"), and its old warden foe passes are replaced by "boss-warden on its tables".
  - **Checks.** `verify:table`: all 13 new stages (script, drag, two taps, the drawn tabletop's gestures, a miss each, 28 px pieces, nothing on the foe's pad); the `order` count is 11. `verify:learn`: a q9 block (every rack is
    the molecule's own, a pair per box, a jar of exactly its valence electrons, the ground state is `fillMO`'s, bond orders are the planner's, the magnet's pull is the real one and a pair-up rack would not match it, the rail's
    answer is the order of the listed lengths, F2 is the weaker bond in the listed data, B2 in oxygen's order reads no unpaired electrons) and a boss-warden block (the hot block, SF4's lamps and sulfur's expanded octet,
    XeF4's 90 degrees from `angleBetween`, the polar cards from `planDipole`, the magnet's writing on every gas); the 2D encounter plate test declares its own pack of three. `verify:bench`: all 13 stages at seven
    viewports through the real pointer path (the pours are repeated drags and taps), and "boss-warden on its tables" (every pose in the pad and in the glass, clear of furniture, read back from `planFoe`).
    `verify:ligar`: "every underground bench whose quest is a table (5) has a lamp over its plate".
  - **Deviations from §4.** (1) `q9` stage 1 is a rail, not a "what happens" choice; stages 3 and 4 grade a rack plus a marker, not a choice; stage 5 is "match the magnet" (the plan's magnet test), 7 and 8 are
    predictions on a new case. (2) Which way an arrow points is the order it went in (no Up/Down hand): Hund's rule is therefore not a thing the player is told, and the magnet is how they find it. (3) Stage 6 lays
    prefilled species cards on the rail (three racks of 11 to 13 electrons would not fit a 150 x 64 table at 28 px pieces); filling is stages 2 to 5, 7 and 8. (4) Warden phase 5 tests gas cards, not three racks, and
    phase 4 takes molecules to a tray rather than picks plates. (5) The Warden's foe reads no probe (the planner's `hold`, `lamps`, `arms`, `field`, `pull` reactions are still in `foes.js` and still tested, but nothing feeds them).
  - **Deferred.** The rack's boxes are painted flat with a low rim (no standing geometry, `fixture3d` still unused); the electron jar's electrons are an instanced pile but a box's arrows are flat; no sound; `bake:stills` for
    the re-laid hoist chamber (T7); the orphaned instruments above.
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Ligar, 3D On. **Bench 9** (`Bench 9 - Molecular Orbitals`, the hoist chamber at the bottom of hill B's decline): the winze's A-frame and its
    sheave now stand at the back left behind the plate, the winder at the right, the rope running along the back at roof height; a lamp hangs over the plate and an ore tub stands at its left. Lean in: the rack fills the glass
    with the jar of electrons at its left and the magnet or marker at its right. Stage 1: press "Join Atoms" (two numbered boxes appear), drag the cards along the rail. Stage 2: drag from the jar to the lower box twice (a third is
    refused). Stage 5: press "Test Sample" (STRENGTH 2) and arrange the twelve electrons until "ALONE IN A BOX" agrees. Stage 6: three cards on the rail. Stage 7 and 8: a prediction token, then the tester or the magnet.
    On a phone held sideways check that the boxes (14 x 8 units) are easy to drop an electron on, and that a drag from the jar moves one electron per drag. **The Warden** (`#/learn/unit03/boss-warden`, fought at its arena):
    five tables in turn with the squat warden standing in the table's top-right corner, clear of every piece; a miss should make it lunge, a win disperse it. Phase 2 is nine drags (`3 Pairs` deals the fluorines' lone pairs).
- 2026-10-17: **T3 closing note (for the user, before T4).** T3 is complete: Ligar's nine benches and the Warden are tables on four kits (atoms and the Lewis slate, bonds, domain, orbital), with two field points
  in the mine (`chip`, `sump`), a lamp over every underground plate and a mine whose hosts leave the lean-in air clear. What no check can judge and the plan wants looked at: (1) **the mine as a place to work**: each
  underground table is lit by one lamp over its plate and nothing else; does the lean-in view read as a miner's bench, and are the surface benches (1, 3, 4, 5) in daylight too different? (2) **The rack**: pouring
  electrons box by box is the plan's "drag" for the MO rack, but an arrow's direction is not the player's choice; if that reads as taking something away, a hand with Up and Down is a small change in `mo.js`. (3) **Stage 5 as
  "match the magnet"** teaches Hund's rule by contradiction rather than by being told; if a student finds it too indirect the hint ladder is where to add. (4) **Small targets**: the smallest targets on any table so far
  are the rack's boxes and the slate's joints; the phone check is theirs. (5) **The Warden's squat body** (scale 0.58) is the only 3D art change in T3. T4 (Lanternfall) starts from the same kits plus an optics kit; nothing in T3 changes `PANEL_LAYOUT`
  or any station-row bench.
- 2026-10-17: **T4a built** (first part of T4: the optics kit, Lanternfall `q1-wave`, `q2-photon` and `q3-lines`, the flume's field point, benches 1 to 3). T4b owes `q4-cloud`
  to `q9-absorb` and `boss-eater` (the light bench keeps `q9-absorb` and the Eater; the cloud plate, box rack and electron bench keep the rest; `q5-numbers` and `q6-filling` keep
  their `lean`/`sight` waivers in `tools/bay-legacy.json`). Nothing here is browser-tested; the drawn tables were rendered to pictures in Node and read, the built twin is held by
  `verify:bench`. Shipped, and the API T4b onward builds on:
  - **Optics kit** (`table/kits/optics.js`, id `optics`, tables 150 x 64; `optics-read.js` the pure readers, `optics-draw.js` the painters both views call). A thin wrapper over
    `lightdata.js` (`planTrace`, `planPrism`, `planPhotocell`, `planJump`, `jumpsForLine`, `pulseNs`; the last two are new): no stage declares what a screen, band, cup or ladder reads.
    **Pieces never join** (`nojoin`); they are put in slots, trays and on the rail, and a fixture reads whatever stands in the slot it owns (`seated(state, slot)`). Kinds: `lamp`
    (`props.nm`, or `tuned` = wherever its screen's colour dial has it; its glass is lit only while it stands in a source slot, `litSource`), `water` (the flume's strip: crest
    spacing in metres and crests a second), `source` (a mast, an oven: read on the log ruler), `plate` (`props.metal`), `tube` (`props.gas`; "Sealed tube" names none), `filament`,
    `cell` (a cell of cool gas), `strip` (a reference strip: a gas's real lines on the 380 to 750 nm scale), `chip` (a line, `props.nm`), `detector`, `electron`.
    Fixtures and their builders: `waveScreen` (`wave`: a lamp slot, an optional `colour` dial, wavelength and frequency read-outs, the wave drawn against a 2400 nm ruler;
    `rate:false` prints no frequency), `logRuler` (`ruler`), `pulseRail` (`pulse`: marks at known metres, a slot each, Run "Fire Pulse" writes `{x: gap, y: pulseNs(gap)}` on the recorder and
    the timer prints the gap and the time, never the speed), `spectrograph` (`band`: socket, optional cell and reference slots, `detectors` lights the UV and IR strips; `bandRead`
    gives `{plan, seen, refLines, matched, whole, uv, ir, shape}`), `photocell` (`cell`: holder, a built-in colour dial or a lamp slot, a brightness dial or a fixed one, the beam,
    the collector, a counting cup, the two meters; `cellRead` is `planPhotocell` of what stands there; `record` adds Run "Record"/"Test"), `energyLadder` + `linesStrip` (`ladder`, `lines`:
    rungs 1 to 6 and the open top are slots, evenly spaced and marked NOT TO SCALE, one electron stands on rung 1; **`kit.settle` writes the move into the electron's own props**
    (`at`, `last {hi, lo, nm, up}`, `lines`): a drop keeps the line `planJump` gives, a climb gives out nothing; the strip prints it; a `probe` slot takes a chip and asks `jumpsForLine`),
    `plaque` (printed reference lines) and `marker` (a dial set to a read figure). `ladderRead`, `rungOf`, `TOP`, `pickedUpBy`, `firstFreeing`, `waveRead`, `rulerRead`, `pulseRead`,
    `timedLast`, `detectorsOn` are what a stage's `check` and `verify:learn` read.
  - **Core change** (`table/gestures.js` `pieceAt`): a piece in the hand is taken again only on the piece itself, not within the generous grab reach, so a target beside it (the next
    rung, 8 units away) can be tapped. Every other kit's `verify:table` and `verify:bench` replays still pass.
  - **`q1-wave`** (8 stages, no `choice`; `PRACTICE`, `DEBRIEF`, `VOCABULARY` and every reward but stage 3's are as they were): 1 tune a lamp (put in its holder, colour dial) until more crests pass a second than Sample A's, with
    the flume strip as the **field item**; 2 tune to twice Sample A's crest spacing; 3 put two detectors on marks 0 to 6 m along the rail, fire a pulse, set the speed reading
    (gap over time: the speed of light is found, not given; stage 4 reads two reference lamps whose products agree); 4 read two reference lamps, set the frequency of 600 nm; 5 four lamps on a rail
    by frequency (read each in the holder first); 6 tray three lamps under the eye, the infrared strip or the ultraviolet strip (the band lights the strip); 7 tray a mast, an oven and an X-ray tube
    under the frequency they work at (read on the log ruler); 8 put in the matching slot the lamp that makes 5.1 x 10^14 a second (the screen prints wavelength only). The order stage is now a rail
    (`ORDER_STAGES_LEFT` 11 -> 10).
  - **`q2-photon`** (8 stages, no `choice`): 1 free electrons from the sodium plate (plate dragged in, colour and brightness dials); 2 the first setting that frees any; 3 double the cup's count (the brightness
    dial, a fixed violet lamp); 4 tune until the fastest electron leaves at 8 x 10^5 m/s, "Record" keeps (frequency, speed) on the sheet; 5 the plaque's worked sodium threshold, h, c and a
    frequency, and a reading for one photon's energy; 6 the three plates on a rail from loosest grip to tightest (each is taken to the holder, swept and recorded; the order stage is a rail,
    `ORDER_STAGES_LEFT` 10 -> 9); 7 tray the lamps that free zinc (each tried in the lamp slot); 8 **predict** an intense red lamp on zinc (two tokens), then "Test" (`prediction.tested`).
  - **`q3-lines`** (8 stages, no `choice`): 1 put a filament and a gas tube under the band each makes; 2 slide a reference strip alongside the sealed tube's band until all its lines fall on it;
    3 the same for the dark lines a cell of cool gas cuts out of the filament's light; 4 **drag the electron down a rung until it gives out the red line**; 5 the 486 nm line's energy (rung
    energies printed, never the drop's; worked line and constants on a plaque); 6 predict the wavelength of a fifth-to-second drop (four tokens), then make the drop; 7 give the electron more
    than the whole ladder (the open top slot); 8 put each of three lines in the probe and tray it by whether any pair of rungs makes it (the "why" is the reward card).
  - **Hosts and the flume's field point (§2.6).** The three tables are dressed from the host's own materials (held by `verify:bench`); all three hosts already hung a lantern over the plate (a `lampMark`, no new
    light) and cleared `lean`/`sight`/`view`, so no waiver was deleted (`tools/bay-legacy.json` still lists only `lanternfall/q5-numbers` and `q6-filling`, T4b's). **Field point `flume`**
    ("Flume Strip", `lanternfall/stations.js` `buildWaveTank`): the crest recorder on a post in front of the flume's gutter, host `site-1`, the player stands 1.1 m in front of it to the right of the bay;
    `lanternfall.js` registers it; the guide is the straight lantern road from the approach. Bench 2 gained a plate case on a trestle (three plates in slots) beside the desk; bench 3 a rack of gas tubes and
    the spare filament lamp on the sled's bed. `verify:lanternfall` now holds every field point (a piece of its host, a clear level stand inside reach, reachable on foot, an open straight way from the approach)
    and "every bench whose quest is a tabletop has a lamp over its plate".
  - **Checks.** `verify:table`: all 24 stages (script, drag, two taps, the drawn tabletop's gestures, a miss each, no authored outcome, 28 px pieces). `verify:learn`: three blocks recompute every graded
    answer from the planners (crests, the pulse time, strips and lines, `planPhotocell` sweeps, each drop). `verify:bench`: all 24 stages at seven viewports through the real pointer path by drag and two
    taps, and the flume's point (chevron, `[E]`, carry, table); the old light-bench instruments are measured only for the quests that still play them (`LF_BENCHES`).
  - **Deviations from §4.** (1) `q1-wave` stage 1 grades a tuning (more crests a second than Sample A), not a "how does the wave change" statement; the finding is on the card. (2) Stage 3's speed is found
    by timing a pulse, not by wavelength times frequency (that product is stage 4's evidence). (3) `q2-photon` stage 3 asks the count to be doubled and stage 4 a speed to be reached; the "same speed" and "same number"
    are on the two meters. (4) `q3-lines` stage 3's cell is unnamed and the strip is picked from three, which is the absorption fingerprint. (5) The ladder is evenly spaced (the true spacing of rungs 5 and 6 is under
    a unit), and says so. (6) Stage 8 of `q3-lines` is a tray, not the "why" choice. (7) The standing 3D geometry of screens, the photocell and the ladder is still painted on the plate in the host's materials
    (the same `fixture3d` deferral as T2b); waves are drawn at rest.
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Lanternfall, 3D On. **Bench 1** (`Bench 1 - Light Waves`, the wave flume on the south shore): lean in over the plate; the flume
    and its strobe gantry stand behind it, the lake ice beyond, the work lantern over the back of the plate. Stage 1: press W, the chevron leads to the **crest recorder on its post at the flume's front, right of
    the bench**; `[E] TAKE FLUME STRIP` when you point at it; lean in again and a strip off the flume's chart is on the table (put it in the Lamp holder: a water wave, 0.90 m between crests, 1.1 a second). Drag the
    lamp into its holder (the glass lights), drag the Colour knob and watch the wave crowd. Stage 3: drag a detector onto two marks, press "Fire Pulse", the timer prints the gap and the time and the sheet gets a
    point. Stage 5: take a lamp from the rail into the holder and back; pieces slide apart under it. Stage 6: the band lights UV or IR for the lamps that are past its ends. **Bench 2** (`Bench 2 - Photons`, the photocell
    housing at the mast's foot): the housing and mast behind, a plate case on a trestle at the right. Drag a plate into the holder, turn Colour and Brightness: the beam changes colour and width, dots cross the tube into
    the cup, the meters move; "Record" drops a point on the sheet; stage 8's tokens and "Test". **Bench 3** (`Bench 3 - Line Spectra`, the spectrograph sled): the sled and its camp behind, a tube rack on the bed. Plug a
    source into the socket (the band draws), slide a strip alongside (its lines that fall on the band turn amber), drag the electron up and down the ladder (the strip keeps each line; a climb says it gives out nothing;
    the arrow shows the move); the rungs are 8 units apart, so on a phone held sideways check the drops are easy to land and that tapping the electron and then the next rung works. Nothing glows and nothing is rounded.
- 2026-10-22: **T4b built** (second part of T4: Lanternfall `q4-cloud`, `q5-numbers` and `q6-filling`, two new kits, benches 4 to 6). T4c owes `q7-pes`, `q8-trends`, `q9-absorb` and `boss-eater` (the electron bench
  and the light bench's cuvette head keep those; `tools/table-legacy.json` lists Lanternfall's four, Bellows and Ember). Nothing here is browser-tested; the drawn tables were rendered to pictures in Node and read, the built twin
  is held by `verify:bench`. Built on the tree after the user's own follow-up edits to main (the foot-dock key is **Submit**; scratch corners only when `spec.scratch === true`; tabletops lean in instantly on stage entry; `d < best.d` in the gestures),
  none of which T4b touches. Shipped, and the API T4c onward builds on:
  - **Cloud kit** (`table/kits/cloud.js`, id `cloud`, tables 150 x 64 or narrower via `cloudTable(spec, {w})`; `cloud-read.js` the pure readers, `cloud-draw.js` the painters both views call). A thin wrapper over `orbitals.js` (`sampleOrbital`,
    `ringFits`, `nodeRadii`, `shapeOf`) and `cloudplate.js` (`projectDots`, `turnPoint`, and three functions pulled out of it so the drawn plate and the table share them: `strokeRingWave`, `blurAt`, `trackRefusal`).
    **Fixtures:** `cloud` (a plate: exposure dial 1 / 50 / 500 shots, a hidden `fired` dial, Run "Fire" which writes `fired` and nothing on the recorder; optional `ring` dial in `disc` mode, counting the dots inside the circle on the plate, or `band`
    mode, counting the dots whose real distance from the nucleus is within `BAND_PM` of it; optional `slice` dial; `view` names the shared view; `film` gives a slot in its side column; its height follows its dials), `view` (turn 0 to 330 degrees and
    tilt -90 to 90 in 30 degree steps, optional slice: ONE view for every cloud on the table), `wavering` (the ring track: a slot for a string, `strokeRingWave` draws the laps), `blur` (the precision level and the two blurs `blurAt` gives),
    `tracker` (Run "Track Electron", which always answers `noop` with `trackRefusal().reason`). **Pieces** (never joined): `cloud` (a card showing the 500 dots through the shared view, with its x, y and z axes), `tile` (a string of one
    wavelength), `film` (an outline of one of four shapes, `FILMS`, all of one area). Readers a stage's `check` and `verify:learn` use: `plateRead`, `ringRead`, `filmRead`, `catchOf`, `trackRead`, `blurRead`, `viewRead`, `axisOf`, `nodePm`, `filmHolds`,
    `filmArea`, `pointsOf` (cached `sampleOrbital`). The dots are the real |psi|^2, so the first fifty of five hundred are always the same fifty.
  - **Address and filling kit** (`table/kits/shells.js`, id `shells`; `shells-read.js`, `shells-draw.js`). A thin wrapper over `electrons.js` (`placeElectron`, `removeElectron`, `readRack`, `findRoom`, `validAddress`, `groundConfig`, `shortString`,
    `MEASURED`). **The rack** is a `shelf` board (energy axis, row labels, readings, the lit floor, each row's mean reach in pm from the real hydrogen-like distance) with a FIXED `box` piece for every box, lowest energy at the bottom, built by `shelf(rackId,
    rows, at, {pre, locked, target, finder, show, reach, readout, core})`. **Arrows are dealt by hand**, as the Lewis slate deals pairs: `up`, `down` and `lift` are tool pieces dropped on a box (`once`, back home); a second arrow the same way is refused with the
    rack's own reason and the piece goes home; a locked prefill cannot be lifted. **Electron tokens** (`etok`) carry their own address; dropped on the rack one stands in the room its address names (the arrow appears in that box, derived by `arrowsOf`,
    `placedTokens`), or is refused with the rule shown (`whyNoRoom`: no room has the address, or two electrons would share all four numbers); a placed token dropped again comes off, one put in a tray is off the rack. **The address strip** (`addressStrip`,
    fixture `finder`) is a dial per cell (floor, type, room, bunk; `fixed` values for cells it does not offer), lighting a floor, a row or one box by how many numbers it `show`s, or printing NO ROOM HAS THIS ADDRESS. **Magnets** (`magnet`): `sample` reports the REAL
    `MEASURED` pull, without one it reports the rack's own arrangement (`rackPull`); `coreSwitch` folds the closed core; `marker` is a plain dial. Cards `ccard` and `tag`, strips `estrip` (a symbol over its ladder of bars, the last row lit). Core change,
    small and generic: `snap.js` `pointFor` falls back to a target's own middle when no side of it can be told from its neighbours (a box in a row of boxes), so a drop by drag and a tap end in the same table.
  - **`q4-cloud`** (8 stages, no `choice`; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, every reward and the stage count are unchanged; its line is gone from `tools/table-legacy.json`): 1 fire shots (one, fifty, five hundred a press) and set the counting ring to hold about
    nine in ten of them; 2 lay the one of four films of equal area that catches the most dots (the round one, for any seed); 3 sort six strings by whether they close on the ring track (332, 166 and 111 pm do); 4 find the distance at which the second cloud has an
    empty shell, in `band` mode with a slice to look through (the node at 105.8 pm; the first cloud has shots there); 5 turn the cloud until a slice through its middle holds almost no dots (only the views along the node plane do, `verify:learn` enumerates all 84);
    6 put four clouds on the x, y and z pegs by the axis their lobes lie along, the repeat in the tray; 7 tray five clouds by shape (`shapeOf`); 8 predict what a sharper position does to the speed blur, then turn the precision dial and press Track Electron.
  - **`q5-numbers`** (8 stages, no `choice`; line gone): 1 set the floor so its s row reaches about 300 pm (the board prints each row's distance); 2 tray the four suite types by whether the second floor has a room of the type; 3 put an electron in the box an address names,
    the strip lighting it; 4 two electrons in one box (a third refused); 5 place four candidate electrons on the rack and tray the one it refuses (two share all four numbers; whichever comes second is refused); 6 fill the third shell (nine boxes) and set the marker to the count;
    7 write the address of the ringed electron of nitrogen on the strip; 8 try four listed electrons on the rack and tray the two the rack refuses with the rule.
  - **`q6-filling`** (8 stages, no `choice`; line gone): 1 carbon's six electrons; 2 place carbon's p electrons until the rack pulls on the magnet as hard as the real sample (Hund's rule is found by the magnet); 3 build oxygen and put the card the rack reads in the slot;
    4 potassium's nineteenth electron (the 4s row stands below 3d); 5 build iron, turn Collapse Core on and put the short form in the slot; 6 tray six element strips by block; 7 lift two electrons off iron until the rack reads iron(II), the magnet measuring the real ion;
    8 place chromium's last six electrons until the rack matches the magnet (beyond the exam).
  - **The records tent** (`lanternfall/stations.js` `buildRecordsHalf`, `host-plan.js`): the canopy ran 3.4 m out over the lean-in camera's air in front of the plate, which was the whole of the `lean` and `sight` waivers. **The eave now ends at the plate's
    line (z 0.5)**, so the tent is a gable open at its mouth with the bench standing in the doorway: roof panel, rafters, eave beam, side walls, eave posts, colliders and the lamp's chain follow, the ridge is still the same world line from both halves (`TENT_SPAN` 7.0, bench
    to bench), and the declared extent of both halves is tight at `[-5.7, 5.7, -3.6, 0.7]`. **`tools/bay-legacy.json` no longer lists `lanternfall/q5-numbers` or `q6-filling`** (what is left is Bellows' and Ember's, T5 and T6). Bench 4 (the crawler's lab) already cleared
    every lean, sight and view check, so no host moved there. All three tables are dressed from their host's own materials and each tent half and the lab hang a work lantern over the plate (`verify:lanternfall`: "every bench whose quest is a tabletop (6) has a lamp over its plate").
  - **Checks.** `verify:table`: 24 new stages (script, drag, two taps, the drawn tabletop's gestures, a miss each, no authored outcome, 28 px pieces). `verify:learn`: a q4 block recomputes every count from the planners (the ring's share, four equal-area films
    and the seeds that all pick the round one, the strings, the node and the shells either side of it, the empty slice among all 84 views, the axes, the shapes, the blur product against the uncertainty floor, the track key's reason), a q5 block (each row's reach
    against the sampled mean, the rooms, the Pauli pair and the refusal in either order, the full shell, nitrogen's ringed box, the sets) and a q6 block (every graded rack against `electrons.js`, both magnets, the cards, the blocks). `verify:bench`: all 24 stages at
    seven viewports through the real pointer path by drag and two taps, and the tent's `lean`, `sight` and `view` checks with no waiver.
  - **Deviations from §4.** (1) `q4-cloud` stage 5 grades a view (a slice that is empty), not a "what shape" statement; the lobes are found by turning, and stage 6 puts clouds on axis pegs rather than turning one cloud onto each peg. (2) Stage 8 is a prediction on an idea
    not worked out earlier (the one place §2.4's condition is relaxed: the trade is on the gauge, the reason is the Track Electron key's, and the table has no earlier stage that could have taught it). (3) `q5-numbers` stage 1 is "match the reach" (printed per row), not a
    statement about what n tracks. (4) The ring track's six strings are sorted, not tuned on a dial: all three that close are asked for, which one dial setting could not. (5) Direction in the filling rack is the arrow dealt (Up or Down), so Hund's rule is found by the magnet and
    never told; the electron kit's `placeElectron` is the only rule. (6) The old periodic strip that lit with the electron count (q6) is gone; the board prints PLACED, ALONE IN A BOX and the configuration.
  - **Orphaned drawn instruments (T7 retires them; nothing was deleted).** `CloudPlate` (`cloudplate.js`'s class, `cloudplate3d.js`) no quest plays now (the pure functions stay: the cloud kit imports them); `BoxRack` is still played by `boss-eater`, but its `address` and `atomic`
    layouts, `finder` and `hand` are orphaned with these two quests (`engine/rackcontrols.js` the same).
  - **Deferred.** The cloud plate's dots are painted flat on the plate (the instanced 3D dots, and a real turned solid, are the `fixture3d` deferral again); the rack's boxes are cards with arrows painted on them, not standing boxes; no sound; `bake:stills` for the tent (T7).
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Lanternfall, 3D On. **Bench 4** (`Bench 4 - Orbitals`, the ice crawler's lab module, doors open): lean in; the module's shelves and chart board behind the plate, the lantern over it,
    the crawler's tracks at the sides. Stage 1: press Fire three times with the exposure on one shot (a dot each, the first circled), set it to fifty, then drag the Ring knob until the plate prints about 450 of 500 inside. Stage 2: drag a film onto the plate (the side
    column prints what it catches). Stage 3: drag a string onto the track (the laps draw round it, crisp or smeared) and then into a tray. Stage 4: turn Slice on and step the ring outward on the second plate until its shell reads 0. Stage 5: tilt and turn the view
    knobs, switch Slice on and watch the count of dots shown. Stage 6 and 7: the cards redraw as the view knobs turn. Stage 8: place a token, drag Level, press Track Electron (the banner gives the reason). On a phone held sideways the cards are 18 units (about 80 px) and the
    plates' pictures about 130 px, so check the dots still read. **Bench 5** (`Bench 5 - Quantum Numbers`, the south half of the records tent) and **bench 6** (`Bench 6 - Electron Configuration`, the north half, back to back): the roof now stops at the plate, so lean in and
    the camera should see the board's face behind the plate (milled boxes on bench 5's, a ladder of shelves on bench 6's), the filing cabinets or the plan table at the sides, and the lantern hung from the eave; the tent should read as open at the mouth, and from the lane the
    two benches should still look like one tent. Bench 5, stage 1: drag the Floor knob (rows and amber bars light, distances beside each row); stage 3: drag the Electron piece onto the lit box; stage 5: drop candidates on any box (each stands in its own room, the refused one
    drifts home with the rule in the banner); stage 8 the same. Bench 6: drop Up and Down on boxes (a third of one direction is refused), press Test Sample and Test Rack, lift with Lift Out, drag the strips. The boxes are 6 units (26 px at 667 x 375); check the drop lands on the
    box under the piece when two are near, and that tap-then-tap on a box works.
- 2026-10-22: **T4c built** (third part of T4: Lanternfall `q7-pes`, `q8-trends` and `q9-absorb`, three new kits, the ice hole's field point, benches 7 to 9). T4d owes `boss-eater` (it still plays the old
  electron bench, box rack and light bench; `tools/table-legacy.json` lists it, Bellows and Ember). Nothing here is browser-tested; the drawn tables were rendered in Node and the built twin is held by
  `verify:bench`. `tools/bay-legacy.json` has no Lanternfall line (it had none left after T4b). Shipped, and the API T4d onward builds on:
  - **Core change.** `kit.pilesOf(state) -> [{id, at, n, cap, slots, r, colour, shown?}]` lets a kit stand instanced piles that belong to no container; `table3d.js` `pileSources` / `layPile` serve it and the
    container piles alike, and a pile that is not a prefix of its slots (a column in every bin) says which stand with `shown` (the rest are given no size). `table2d.js` hands a fixture's painter `bodies`
    (true when the built table stands the piles) so the flat picture leaves them out.
  - **Spectrum kit** (`table/kits/pes.js`, id `pes`; `pes-read.js`, `pes-draw.js`). A thin wrapper over `electronbench.js` `spectrumOf` (`electrons.js` `planPES`): the chamber (`chamber(id, at, sources, {energyDial,
    rings, model, axisLabel})`, kind `pes`) holds a specimen card (`specimen`, kind `spec`) and "Fire Light" knocks off every electron the light carries enough energy for (`freedBy`); they fall into a strip
    of twenty log-scaled bins (`binOf`, highest energy at the left, a column of up to six under each) that is ONE instanced body in the built view (`chamberPiles`); the fired card keeps a printout (`printOf`).
    The light's energy is a dial (`ENERGY_STEPS`, shown from stage three); `buildFixture` (protons and electrons on two dials; its peaks lie over the strip as amber outlines), `writerFixture` (an electron
    count per row, `WRITER_ROWS`, graded against `groundConfig`), `tallyFixture`, `plaqueFixture`. Readers: `chamberRead`, `buildRead`, `writtenRead`, `writerTarget`, `holdOf`, `electronsIn`, `pilesOf`, `stripOf`.
  - **Trends kit** (`table/kits/trends.js`, id `trends`; `trends-read.js`, `trends-draw.js`). Scale-model atom cards (`atomCard`, drawn at one pixel per picometre everywhere), a spring gauge (`springFixture`: the
    pull is `planPull` on the electron its dial names, outermost or innermost; the charge at the middle, distance, electrons between and charge felt as the stage shows them), a size gauge (`sizerFixture`, radius from
    `RADIUS` / `ION_RADIUS`, optionally a "Measure Atom" key), a stripper (`stripFixture`: each "Strip Electron" takes one off and reads `IONIZATION` / `MG_SUCCESSIVE`, refusing past what is measured) and an
    "Add Electron" tool piece (`electronPiece`) laid on a card. Readers: `springRead`, `sizeRead`, `stripRead`, `pullOf`, `hardestPull`, `feelsOf`, `costOf`, `itemOf`, `shellsNow`.
  - **Cuvette kit** (`table/kits/cuvette.js`, id `cuvette`; `cuvette-read.js`, `cuvette-draw.js`). A thin wrapper over `lightdata.js` (`planAbsorb`, `regionOf`, `planRegion`, `wavelengthRgb`): cuvettes
    (`cuvette`, drops or a fixed strength, `DROP` 2 mmol/L, `MAX_DROPS` 6), "Add Drop" and "Empty" tool pieces, a spectrometer (`spectro`: live reading, optional wavelength and path dials, "Record" plots
    against nm, strength or path; a sealed cuvette is read onto its own face and never plotted, so the sheet cannot print its strength), the light dial with a molecule (`region`), the strip of light that
    gets through (`strip`), colour chips, motion and reading cards, `markerFixture`, and the kit's own `straightedge` probe. Readers: `spectroRead`, `regionRead`, `absorbOf`, `concOf`, `missingColour`, `chipIn`.
  - **`q7-pes`** (8 stages, no `choice`; `PRACTICE`, `DEBRIEF`, `VOCABULARY`, rewards and the stage-5 lead line unchanged): 1 rank two specimens on the rail by how much energy it takes to knock their electrons off; 2 set a
    tally to the electrons in Sample B (Sample A's card says its own); 3 set the light so exactly one of lithium's electrons comes off; 4 set it so all of boron's outer ring and none of the inner comes off (two piles from one
    ring); 5 build the atom whose outlines cover the sealed specimen's piles; 6 rank oxygen, fluorine and neon by their innermost peaks; 7 tray three sealed samples under sodium, magnesium and aluminum; 8 write the
    sealed specimen's configuration, a count a row.
  - **`q8-trends`** (8 stages, no `choice`; one prediction): 1 tray the atom with the electron pulled hardest of all (tug the innermost too); 2 tray atoms by the charge their outermost electron feels; 3 rail
    Li, Be, B, C by size; 4 predict potassium against sodium, then measure; 5 make Na+ and Cl- by hand and rail them with a sodium atom, smallest first; 6 rail Li, Be, B by what the first electron costs; 7 strip
    magnesium until the next would cost many times more (an electron laid back recovers an over-strip); 8 rail Na, C, N, F by the pull on their outermost electron.
  - **`q9-absorb`** (8 stages, no `choice`; one prediction; beyond the exam, as before): 1 match three kinds of light to the motions they make in a molecule; 2 tray three printed wavelengths under their kind of light;
    3 put the chip for the colour the copper solution takes out in the slot; 4 set the wavelength where it dims the beam most (the sheet plots each point); 5 fill Cuvette B with drops so it takes in twice as much as A
    (**field:** lake water from the ice hole is the blank, the sheet's origin); 6 set the path that doubles the reading; 7 predict B at two centimetres against A at one, then read; 8 fill three standards, record them, lay the
    straightedge, read the sealed sample and set a marker to its strength.
  - **Field point `hole`** ("Ice Hole Water", `lanternfall/stations.js` `buildWaterHole`, host `site-9`): a sampling winch on a post on the ice west of the hole (hand winch, crank, line up over the tripod's pulley, bucket
    drawn up beside it), a real part of the host; the player stands at host (-4.9, -3.2). `verify:lanternfall` holds it (a piece of its host, a clear level stand inside reach, reachable on foot, an open straight way from
    the approach) and names it; `verify:bench` plays stage 5's fetch through the registered point (chevron, `[E]`, carry, table) and, at T1 to T3, the drawn site plate.
  - **Integration (section 2.6).** Benches 7, 8 and 9 were already clear of the lean, sight and view checks and each already hung a lamp over its plate (`verify:lanternfall`: every tabletop bench has one). The tables are
    dressed from the hosts' own materials (held by `verify:bench`). New dressing, all outside the bay: a specimen rack on bench 7's platform, a hanging spring scale at bench 8's end of the store, the winch at bench 9.
  - **Checks.** `verify:table`: all 24 stages (script, drag, two taps, the drawn tabletop's gestures, a miss each, 28 px pieces; the rail count drops from 9 to 6). `verify:learn`: three blocks recompute every graded figure from
    `planPES`, `planPull`, the measured radii and costs, and `planAbsorb`. `verify:bench`: all 24 stages at seven viewports through the real pointer path, the strip's instanced electrons, and the Lantern-Eater's phases measured on
    the old electron bench, box rack and light bench (`BOSS_BENCH`), which no quest else plays.
  - **Deviations from section 4.** (1) `q7` stage 5 builds the atom on two dials (protons, electrons), not from loose particles: sixteen drags for oxygen do not fit a table that also holds a strip. (2) `q7` stages 3 and 4 are
    a dial on the light's energy rather than marking peaks: the least energy that frees an electron IS its binding energy. (3) `q7` stage 1 ranks two specimens (a one-in-two guess); the evidence is the strip. (4) `q8` has no
    separate electron "tug" that pulls an electron off: the spring gauge reads the pull and the stripper takes it off. (5) `q9` stage 8's "place the unknown on the line" is a marker set to the strength read off it.
    (6) A card must be lifted out of a holder to be changed (a piece in a slot is not joined): the hints say so for the over-stripped magnesium. (7) The flat pictures of the strip, gauges and spectrometer are painted on the
    plate (the `fixture3d` deferral again); only the electrons of the strip stand up.
  - **Orphaned drawn instruments (T7 retires them; nothing was deleted).** `ElectronBench` and `LightBench` are now played only by `boss-eater` (its spectrum head, and its light bench heads); the electron bench's atom head
    serves no quest.
  - **For the user to look at in a browser (nothing here is browser-tested), per bench.** Lanternfall, 3D On. **Bench 7** (`Bench 7 - Photoelectron Spectroscopy`, the detector arc on its platform): lean in; the arc and the
    chamber behind the plate, a specimen rack on the platform to the right, the work lamp's arm over the plate. Stage 1: drag a card into the chamber slot, press "Fire Light": green electrons should stand in columns on the strip
    and the card should keep a small printout; rank the cards on the rail. Stage 3: drag the "Light energy" knob and fire at low settings (the ring picture shows lithium's rings). Stage 5: drag the build's dials and watch the amber
    outlines settle over the piles. On a phone check the columns read as piles and the cards (about 50 by 33 px) are easy to drop. **Bench 8** (`Bench 8 - Periodic Trends`, the tile store): the racks behind the plate, a hanging
    spring scale at the left end. Atom cards are drawn to scale, so bigger atoms should look bigger; drag one into the spring gauge's holder and the readout shows pull, core charge and distance; the dial picks the outermost or
    innermost electron. Stage 5: lay "Add Electron" on the chlorine card (it must be out of the holder), "Strip Electron" with sodium in the stripper. **Bench 9** (`Bench 9 - Spectroscopy`, the cuvette sled by the ice hole): the sled
    on the right, the tripod over the hole behind. Stage 5: press W, the chevron leads round to **the sampling winch on its post west of the hole** (`[E] TAKE ICE HOLE WATER` when you point at the winch); lean in again and a
    clear cuvette of lake water is on the table (its reading is zero). Lay "Add Drop" on a cuvette (off the beam), slide it into the beam slot and read it; "Record" drops a point on the sheet. Stage 8: the "Straightedge" key in
    the dock lays a line through the standards. Nothing glows and nothing is rounded.
- 2026-10-22: **T4d built** (last part of T4: the Lantern-Eater, and the Lanternfall close-out). **After this every Lanternfall quest (nine benches and the Eater) is a table**, as are all of Tallow, Kettle and Ligar; `tools/table-legacy.json`
  lists Bellows (`unit04`, seven lines) and Ember Reach (`unit05`, eight lines) only, and `tools/bay-legacy.json` lists Bellows and Ember only (13 quest lines, 28 bench volumes). Nothing here is browser-tested; the drawn tables are proved in Node
  and the built twin by `verify:bench`. Shipped, and the API T5 onward builds on:
  - **`boss-eater`** (5 phases, each its own table; `encounter {species, act, intent, hit}` kept per phase, one `foes` entry each, no field stage, the foe pad clear on every table): 1 `optics` kit, the energy ladder and its strip: make the
    hydrogen atom give out the 486 nm line (the electron's last drop is graded, `jumpsForLine` says only the fourth rung to the second makes it); 2 `optics` kit, the photocell with a cesium plate fixed in the holder and three lamps tried in the
    lamp slot: put the lamp that frees electrons at the lowest speed in the marked place (`planPhotocell`, all three lamps free electrons, each at its own speed); 3 `shells` kit, oxygen's rack with the s rows locked, "Test Sample" and "Test Rack",
    Up, Down and Lift Out, and a marker: set it to how many electrons stand alone (`MEASURED.O`; the board prints the rack's own count, so the evidence is the rack matching the magnet); 4 `pes` kit, a sealed neon core already in the chamber and a
    build with two dials: build the atom whose outlines cover the piles (2, 2 and 6); 5 `cuvette` kit, three standards filled by drops, a sealed copper solution of 7 mmol/L, the spectrometer's "Record", the straightedge and a marker. Each phase is a
    fresh specimen of a bench the player has worked; the eater is `foebody.js`'s own body (small enough that the pad holds every pose), standing in the table's top-right corner and reading no probe. `BOSS_ARENA_SPOTS['boss-eater']` is unchanged
    and `verify:lanternfall` still holds it open. Its line is gone from `tools/table-legacy.json`. `PRACTICE`, `DEBRIEF` (clue `clue_lantern_lens`), every reward card and every `hit` line are as they were.
  - **API addition (one).** `buildFixture(id, at, {size})` in `table/kits/pes.js` takes a size (default 36 x 46 as before); `pes-draw.js` `paintBuild` draws a smaller atom on a shorter build so the rings stay clear of the dials. Phase 4 needed a
    build that fits under the foe's pad beside a 110-unit chamber (30 x 39 at (129, 44.2)). Nothing else in the kits or the core changed.
  - **BUILT_BENCHES** (`engine/instruments.js`) lists `boss-eater`, and its stale per-quest comments (q1-wave, q2-photon, q3-lines, q1-joins, q4-dots) now say they are tabletops.
  - **Checks.** `verify:table`: five more stages (script, drag, two taps, the drawn tabletop's gestures, a miss each, 28 px pieces, nothing in the pad). `verify:learn`: a Lantern-Eater block recomputes every graded figure (the only drop that makes 486 nm,
    that each lamp frees cesium at its own speed and the marked lamp is the slowest, that the rack matching oxygen's magnet has two alone and pairing the p electrons first would not, neon's piles and that no other candidate has ten electrons, that the
    sealed solution is read back off the line through the standards). `verify:bench`: all five stages at seven viewports through the real pointer path, and "boss-eater on its tables" (every pose in the pad and the glass, read back from `planFoe`; the
    eater's poses are `idle`, `unmoved`, `absorbed`, `ionized` and `dispersed`). The Lanternfall old-instrument passes (`LF_BENCHES`, the widest and dial stages, the pointer pass) now stand empty: no quest plays them, and the message says so.
  - **Deviations from section 4.** (1) The plan lists "tube socket" among the Eater's benches; the Eater's fourth phase was already the photoelectron bench's sealed core, so it stays on the spectrum kit and the tube socket is not a phase (phase 1 is the
    ladder alone: a socket and a band do not fit beside the ladder and its strip under a foe's pad). (2) Phase 1 grades the drop made (the electron's last move), as `q3-lines` stage 4 does, not a statement about the rungs. (3) Phase 3 is a marker
    set to a count on a rack matched to the magnet, not a rack alone, because the original asks for a number; it is graded on the marker, so a player who already knows the answer is never refused. (4) Phase 4 is a build, not a four-way choice, and the
    prompt no longer names an element; the sealed core is neon as before. (5) Phase 5's sealed solution is 7 mmol/L (the original's 7.5 is not reachable with two-millimole drops and a half-unit marker is already the finest). (6) Phase 2 offers three lamps,
    as before, and all three free cesium's electrons, so "lowest speed" never means zero.
  - **Integration (section 2.6) for all nine benches and the arena, re-checked from the lean-in view.** `verify:lanternfall` (the hosts stand inside their declared extents; every field point is a piece of its host with a clear level stand, reachable on foot
    with a straight approach; every tabletop bench has a lamp over its plate; the Eater's ground is open) and `verify:bench` (the `lean`, `sight` and `view` boxes clear, a ray grid from the lean-in camera hits the host or the world behind the plate, the tables are dressed
    from the host's own materials) pass with **no Lanternfall waiver**; `tools/bay-legacy.json` has none. `docs/plans/lanternfall-world.md` now records the hosts and field points that changed (the flume's crest recorder, the ice hole's winch, the tent re-roofed,
    the new dressing, a lamp over every plate).
  - **Orphaned drawn instruments (T7 retires them; nothing was deleted).** Checked by grep at the end of T4: no quest in any world plays these. **`LightBench`** (`lightbench.js`'s class, `lightbench3d.js`; the pure helpers `fmtLength` and the picture routines the optics kit
    imports stay), **`CloudPlate`** (`cloudplate.js`'s class, `cloudplate3d.js`; `projectDots`, `turnPoint`, `strokeRingWave`, `blurAt`, `trackRefusal` stay, the cloud kit uses them), **`BoxRack`** (`boxrack.js`, `boxrack3d.js`), **`ElectronBench`** (`electronbench.js`'s class and
    `electronbench3d.js`; `spectrumOf`, `planPull`, `shellsOf`, `outerShell` stay, the spectrum and trends kits import them), and, from T1 to T3, `SampleScope`, `CoreBench`, `CatalogueBoard`, `AssayFloor`, `JoinBench`, `BondBench`, `PairBoard` and `DomainRig`. **`engine/rackcontrols.js` and
    `engine/magnetnotes.js` are now imported by nothing at all** and can be deleted outright. `engine/instruments.js` still builds all of them through the dispatcher (`Tabletop` is the only entry a quest uses); `verify:learn` still instantiates `ElectronBench` and the old 3D benches are still imported by
    `verify:bench`. **Still played and NOT orphaned:** `GasRig` (Bellows, all six quests and the Compressor) and `Calorimeter` (Ember, all seven and the Crucible), until T5 and T6.
  - **For the user to look at in a browser (nothing here is browser-tested).** `#/learn/unit02/boss-eater`, 3D On, fought at its arena on the way in from the spawn. Five tables in turn, each with the small winged eater standing in the table's top-right corner, clear of every piece; a miss
    should make it lunge, a win disperse it. **Phase 1**: the ladder fills the left; drag the electron to a rung (a climb says it gives out nothing), the strip beside it prints "LAST DROP GAVE OUT ... nm". **Phase 2**: the photocell and three lamps along the bottom; drag a lamp into the lamp slot
    and read the speed meter, then drop the lamp you choose in the marked place at the right. **Phase 3**: oxygen's s rows are already full; deal Up and Down onto the p row, press "Test Sample" and "Test Rack", and set the "Oxygen" marker; the board prints how many are alone. On a phone the three magnets' keys
    and the marker are the small targets. **Phase 4**: the sealed core is already in the chamber; press "Fire Light", then turn the build's Protons and Electrons dials (the build is shorter than in `q7-pes`, so check its rings are legible); amber outlines settle over the piles when it matches. **Phase 5**: fill the three
    standards with "Add Drop", slide each into the beam and "Record", lay the straightedge from the dock, read the sealed sample and set the marker; the recorder sheet sits further left than in `q9-absorb` so the eater's corner is clear.
- 2026-10-22: **T4 closing note (for the user, before T5).** T4 is complete: Lanternfall's nine benches and the Lantern-Eater are tables on six kits (optics, cloud, address and filling, spectrum, trends, cuvette), with two field points (`flume`, `hole`), a lamp over every plate and a records tent whose roof no longer runs over the
  leaned-in camera. With T1 to T3, **twenty-nine quests are tables**: Tallow (seven), Kettle (two), Ligar (ten) and Lanternfall (ten), 218 table stages in all, on the atom, card, mass, heap, bonds, domain, orbital and the six Lanternfall kits. `npm run verify` is green; **none of it has been looked at in a browser**, so
  here is what a check cannot judge and what to open first.
  - **What to review in a browser.** (1) **The feel of dragging at T4**, on a desktop and on a phone held sideways, across all four worlds: does a piece follow the pointer and settle, does a press near a piece take it or turn the view, is tap-then-tap fine on a trackpad. The tightest targets so far are the Lewis slate's joints (Ligar),
    the MO rack's and the address rack's boxes (about 26 px at 667 x 375), the energy ladder's rungs (8 units apart), the cards on the PES and trends tables (about 50 x 33 px) and the Eater's phase-3 marker. (2) **Lean-in framing**: does it fill the glass with the table between the strip and the dock at every aspect, and is each host
    visible behind the plate (Tallow's belt and tower, the mine's drift walls under their one lamp, the aurora camp's lake and tents, the foundry room)? (3) **The field points**, walked: Tallow's `tail` (conveyor tail), `cooler` (cracking tower's sample cooler), `hopper` (weigh hopper) and `sack` (sack scale); Ligar's `chip` (ore drift) and `sump`; Lanternfall's `flume`
    (the crest recorder in front of bench 1's gutter) and `hole` (the sampling winch beside bench 9's ice hole). Each should lead with the chevron, offer `[E]` when you point at the object, put a chip in the carry slot and show the item on the table when you lean in again. (4) **The Lanternfall camp as a place**: the nine hosts, the lantern road,
    the records tent (benches 5 and 6 back to back, open at the mouth), the Eater's ground, and the lean-in view at each bench against the list of per-bench look notes under T4a, T4b, T4c and T4d. (5) **The lean-in views per world**: Tallow (six hosts along the process line), Ligar (four surface hosts and the underground ones, where only lamps light),
    Lanternfall (nine hosts on the ice), Kettle (the foundry room). (6) **Whether the tabletop reads as less confusing** than the stations it replaced; T1's two pilots (`q2-core`, `q4-dots`) and Lanternfall's `q7-pes` (electrons piling into a strip) and `q9-absorb` (drops, a beam, a sheet) are the stages with the most to judge.
  - **Known deviations and deferrals across T0 to T4, honestly.** (1) **Fixtures are flat paintings on the plate, with no standing 3D geometry.** The `kit.fixture3d` hook exists in `table3d.js` and **no kit uses it**: the balance, assay beam and scale (Tallow), the hotplate, wells and ion grid (Ligar), the hub, balloons and orbital pictures (Ligar),
    the MO rack's boxes, the ladder, photocell, spectrometer, strip, gauges and cloud plate (Lanternfall) are painted in the host's materials with low rims, not built. What does stand up and is instanced: atoms, heaps, the mass sorter's piles, the PES strip's electrons, the electron jar, pieces and trays' rims. Waves are drawn at rest, no mass moves in a pour. If the lean-in
    view looks flat, building the `fixture3d` kit (a standing balance, a standing ladder) is the single piece of work that closes most of it. (2) **No sound** on any table. (3) **Waivers:** `tools/bay-legacy.json` still lists Bellows (six quests) and Ember (seven) for `lean` and `sight` (and `behind` for two of Ember's), 28 bench volumes in all, because those worlds still have their old
    shelters and gantries; Tallow, Ligar, Lanternfall and Kettle have none. (4) **Legacy ratchet:** `tools/table-legacy.json` lists the 15 Bellows and Ember quests. The ratchet's rule (at most a quarter of a converted quest's stages may stay `choice`, each a prediction or an unbuildable reading) is met everywhere it applies; the converted quests keep few or no `choice` stages, but several of the
    predictions are on ideas the quest has only half worked (T4b's `q4-cloud` stage 8 relaxes section 2.4 on purpose). (5) **Simplifications of section 4**, each recorded where it happened: some stages are a dial or a marker set to a worked figure instead of a hand action (`q7-pes` stages 3 and 4, `q5-numbers`, `q9-absorb` stage 8's "place the unknown"); some "build from loose
    particles" stages are two dials (`q7-pes` stage 5, the Eater's phase 4); the hub's arms are pucks; arrow direction on the filling and MO racks is a tool choice (Up, Down) or the order dealt, so Hund's rule is found by the magnet and never told; the Eater has no "tube socket" phase. (6) **Drill Deck** stays text practice. (7) **`bake:stills`** has not been re-run for any re-laid host (the tent, the hoist
    chamber, the camp's hosts) and the site copy is untouched: both are T7. (8) **Orphans** are listed above and kept on purpose, so T7 can retire them in one commit once Bellows and Ember no longer need the station-row layout. (9) The Learn track still pays no XP and nothing in `src/learn/` calls `session.addXp`, `api.gradeStage`, `api.completeQuest` or `session.recordProgress` (`verify:learn` holds that).
  - **What remains.** **T5 (Bellows)** and **T6 (Ember Reach)** each re-lay the world, build the hosts and convert their quests (six plus the Compressor; seven plus the Crucible) on a gas kit and a heat kit, after confirming the host proposals in `bench-integration.md` sections 6 and 7 with the user; T6 also empties `tools/bay-legacy.json`.
    **T7** retires the orphans and the station-row layout (`bench3d.js`, `PANEL_LAYOUT`, `fitDeployedAim`'s standing aim), re-bakes stills, brings the per-world records up to date, marks `bench-integration.md` complete and rewrites `CLAUDE.md` per section 8. **`CLAUDE.md` has not been edited** (section 8 says not before everything is built).

## Design invariants added after the 2026-10-09 user audit (apply to T5, T6 and every later bench)

1. **The bench teaches itself.** Every tool hangs in a named place with one plain line printed under it (`caption`); every table that joins, marks or removes things prints how (`notes`). The briefing on stage 1 says how to answer ("Press Submit"). A player must never need prior knowledge of the game to operate a tool.
2. **Real words, real objects.** No invented answer labels ("hard crust", "tiny lump"); an answer card carries a drawing of what it names. A lens looks like a lens, a cutter like a blade. If a tool's effect needs explaining to be understood (the old shaker's "layers"), replace it with something the player can see and build.
3. **No busywork.** A gesture must be the thinking, not the carrying: marking a particle is one tap, not a drag into a tray. Instruments that exist only to be moved (one detector shuffled between places) become fixed, one per reading.
4. **Everything is undoable where it was done.** A join is broken by tapping it. A tool lying on a piece is the top thing there and can always be picked up (`kinds.x.onTop`).
5. **Layout is audited, not eyeballed.** `table/audit.js` holds every stage's opening table: nothing overlaps a zone, a label strip (`layout.js` `LABEL`), a note or a fixture, and labels fit their zone (set smaller to fit, never below `LABEL.min`). New quests get no line on `tools/layout-legacy.json` (a ratchet to be created when the remaining quests are wired in).
6. **Solid things have broken edges.** Built pieces come from `engine/table-props.js` (rounded slabs, lathed bodies, assembled tools), never a textured box or cylinder; the plate is a worn mat (`table-surface.js`), faces are weathered. Triangle budgets in `verify:bench` are the cost cap.
7. **Teardown must not depend on luck.** A viewer that hands itself back to the stage (`unmountScene(this)`) flags itself disposed first; `disposeLearnQuest` and `LearnFrame.dispose` guard every step so a fault never leaves the stage UI up or the router dead.

## Lanternfall audit pass (2026-10-22)

The user audit of 2026-10-09 named general faults (squares with textures, weird layout, confusing words, tools that explain nothing, busywork).
Tallow was fixed first; this pass applies the same invariants to all nine Lanternfall benches and the Lantern-Eater.

- **Solid things.** `engine/lab-props.js` (new) builds the optics, cloud, spectrum, trends and cuvette kits' pieces and fixtures from the
  invariant-6 vocabulary: a lamp is a housing with a lens barrel (lit in the colour of its light), a gas tube a glass tube between brass
  caps on a name card, a filament a glass bulb on a screw base, a cell a flanged glass cylinder with a stopcock, a plate a coupon of its own
  metal on a bakelite carrier, a detector a cast head with a sensor snout, a cuvette a glass cell on a steel foot with a liquid column,
  a dropper a pipette with a rubber bulb. Slots are sockets (lamp cup, plate clips, tube cradle, ladder rung, sample well, chamber,
  rail mark); every instrument has a cast case with screws and a pane of glass over its picture; the photocell has a glass dome, the pulse
  timer a track, the ladder uprights; the cloud plates stand their dots up as beads at their depth. `Table3D` reaches them through
  optional kit hooks (`piece3d`, `slot3d`, `deckStyle`, `dress3d`, `restHeight`, `pilesOf`), so a kit that supplies none looks as before.
- **Layout.** `unit02/*` is off `tools/layout-legacy.json`. Slots are as wide as the widest thing that stands in them; the ladder's
  electron is a small ball (a `rect` kind with a larger grab radius) so six rungs fit; the spectrograph's slots pack from the left;
  trays, tokens and tools were moved clear of labels, captions and fixtures; q7 stage 7's answers are three trays down the right.
- **Words.** `q5-numbers` and the address kit say shell, subshell, orbital and spin (the apartment words are gone); every stage-one
  briefing says how to answer; stages print how-to lines (`table/notes.js`, `applyNotes`); the cuvette bench's tools and the electron tool
  are captioned.
- **Not done.** The spectrograph and ruler have no solid parts of their own beyond the case; the flat wave screens are still pictures
  (the 2D wave is the lesson); no browser pass was run (the owner tests), only `verify:*` in Node.

## Ligar audit pass (2026-10-22)

The same audit faults (squares with textures, a weird layout, confusing words, tools that explain nothing, nothing to take a mistake back with),
applied to all nine Ligar benches and the Basalt Warden. `unit03/*` is off `tools/layout-legacy.json`; `npm run verify` is the check, and the
look has been seen only in a software-GL headless browser (no real GPU), so the owner's pass is still the judge of it.

- **Solid things.** `engine/ligar-props.js` (new). A model atom is a polished ball in a turned iron collar with its painted face printed on the
  crown (a spherical cap mapped flat), so the symbol, the outer electrons and the lamp ring are the drawn table's own picture; an ore block is a
  rough-hewn body of its own rock (a rounded box roughened by noise, strata and grain in vertex colours) with a sawn, glazed face in a worn brass
  bezel that carries the kit's picture of what is inside it; a salt is a card with a cut crystal; a pair tag a riveted brass tag; the hammer a club
  hammer with an ash handle; the leads a cased lamp and two cables to crocodile clips; the tongs two forged arms on a rivet; the slate's tools
  stamped brass caps; the hub a cast ball with sockets, an arm a ball on a stem (a brass band per shared pair), a lone pair a lobe on a post;
  molecules, streams and orbital cards stand on enamelled steel tiles; instruments are set in timber survey boards (iron corner straps, bolts, a
  pane of glass) and the hotplate in cast iron on lugs; an order rail is a steel track. A tool laid on a block stands on the block's face
  (`restHeight`), a block on the hotplate on the plate. Reached through the kits' optional hooks, only when the table's `skin` is the world's id
  (`stagerunner` passes `ctx.world.id`); other worlds are untouched. New hooks: `deck3d(f, {w, d, mats, skin})`; `piece3d`'s context gains `skin` and
  `faceInfo()`; `slot3d` and `deckStyle` receive `{skin}`. A group's `userData.joinY` makes a join a steel rod between the middles of two solids.
- **The table.** The mat is lighter and is lit a little from within (a mine at dusk printed black on black); it runs the length of the bench so
  the plate's grain is not the frame's loudest thing; trays and jars have a pale stone floor; an orbital box is a low socket, not a five-centimetre
  jar that hid the near half of the arrows in it; the lean-in frames `usedRect` (what is on the table, its words and a hand's room to work) so a
  bench of three atoms in a row fills the glass and is centred in it; a hand over something that can be taken shows a grab cursor.
- **Layout** (61 failures of the audit, all fixed in the quests' own tables): trays moved clear of their label strips and the table's edge,
  rails and tokens re-stacked, boss tables re-seated, blank labels (`' '`) no longer claim a label strip (`layout.js`), every loose tool has a
  caption and room for it.
- **Words.** "Tray" is not a verb ("Sort each pair into a tray by ..."); the trays are named for what is in them ("Stayed together", "Came apart",
  "Handed over", "Shared"); a bond sits in "the gap between two atoms", never a "joint"; the Lewis slate says "6 OF 8 LEFT", not "TRAY 6 OF 8";
  "resolves" is gone; every stage-one briefing ends "Press Submit when the table shows your answer."; stages print how-to lines
  (`applyNotes`) where there is a clear strip; every loose tool says what it does in a caption (Strikes a block, Tests a block, Lifts an atom,
  Adds a pair, Takes one back, Prints charge, Shows each pull, Holds a charge, Swaps an atom, Reads an angle).
- **Taking it back.** Every table (both views) has **Undo** and **Start Over** in the foot dock, and Ctrl+Z: the runner keeps the tables a stage
  has been through (`history`), a move is a whole drag or two taps, a dial dragged is one step, a piece in the hand is put down first, Start
  Over is itself undoable (`verify:table` replays all of it). Tools on a block are `onTop` (hammer, leads, tongs, protractor, arrows, rod,
  swapper), so a tool laid on a block can always be lifted off it again and a press never takes the block under it.
- **Not done.** The hub's arms still stand in the table plane (a projected star), not in the air; the flat pictures (lattice grid, energy plot,
  slates, rack) are still pictures under glass; the briefing card's tour, the world's timber and the host bench were not touched; no real-GPU pass.
