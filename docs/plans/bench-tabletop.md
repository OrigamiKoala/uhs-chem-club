# Bench Tabletop — benches you work with your hands, not machines you answer

**Status:** T0 built (T0a: pure model, drawn tabletop, `table` widget, order rails, catalogue drag, `verify:table`; T0b: `leanIn()`, `table3d.js`, the frame's table mode, the recorder sheet, field points, the lean checks); **T1a built** (the atom kit, Tallow's field point, Tallow `q1-grain` + `q2-core`, their hosts); **T1b built** (Ligar `q1-joins` + `q4-dots`, the Lewis slate; **T1 is complete and waits on the user's review**, which the user has asked us to proceed past); **T2a built** (the card kit, Tallow `q3-catalogue` + `q4-ledger`, the cooler's field point); T2b (`q5-assay`, `q6-weigh`, `boss-hopper`) and T2c (Kettle) next; T3 onward not started. Drafted 2026-10-16. Phases T0–T7 (§6).
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

