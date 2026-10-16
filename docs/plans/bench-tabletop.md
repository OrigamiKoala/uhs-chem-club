# Bench Tabletop — benches you work with your hands, not machines you answer

**Status:** T0 built (T0a: pure model, drawn tabletop, `table` widget, order rails, catalogue drag, `verify:table`; T0b: `leanIn()`, `table3d.js`, the frame's table mode, the recorder sheet, field points, the lean checks); T1 onward not started. Drafted 2026-10-16. Phases T0–T7 (§6).
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
