# Bench Tabletop — benches you work with your hands, not machines you answer

**Status:** plan only, nothing built. Drafted 2026-10-16.
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
  `fieldPoint` stands on walkable ground with a clear approach.

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

### Bellows (`unit04`) — gas kit (built with `bench-integration` P5)

| Quest | Becomes |
|---|---|
| `q1-knocks` | **Push the piston by hand**, pump strokes add gas, slide a burner under; points land on the recorder; **lay the straightedge to find zero pressure**. |
| `q2-laws` | Syringe and piston: compress to a quarter (graded on what you set); records sorted into trays by what was held constant. |
| `q3-ideal` | Weigh the tank on the balance, read its own gauges; compute R from the recorder rows (number entry kept: the calculation is the skill); **shelve the tank under the gas it must be**. |
| `q4-mixtures` | **Open valves to pour gas tank to tank**; gauges add; arrange gases by partial pressure. |
| `q5-speed` | Release two gases at a pinhole and run the stopwatch; **HCl/NH₃ tube: predict where the ring forms, then test**. |
| `q6-real` | Squeeze a gas in the cold bath; recorder plots PV/nRT; arrange cylinders by departure. |
| `boss-compressor` | Phases on piston, bath, balance, valves and pinhole. |

### Ember Reach (`unit05`) — heat kit, card stack (built with its integration phase)

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

Each phase ends with `npm run verify` green, its quests' lines deleted from `tools/table-legacy.json`, this
file's progress note updated, and the user testing in the browser.

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
- **T5 — Bellows**, together with `bench-integration` P5 (its hosts and field points are designed once).
- **T6 — Ember Reach**, together with its integration phase. The card stack from T2 serves `q5-hess`.
- **Then** retire what nothing uses: the station-row layout in `bench3d.js`, the deck/rail/controls
  panels in `PANEL_LAYOUT`, and the per-instrument key banks, once `table-legacy.json` is empty.

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
- **Drill Deck** stays text practice for now; a table form of practice problems is out of scope.

## 8. CLAUDE.md changes when built (not before)

Add to the teaching doctrine: *the answer is the table where it can be built*; *every drag has a two-tap
twin*; *ordering is dragging into place on a rail, never clicking in sequence*; *snaps are physics, never a gatekeeper*; *a prediction is only asked on a new case of an idea
already worked out*; *a field stage is evidence, never a lock, at most one per quest, never on a boss*.
Replace the "deck layout" and `PANEL_LAYOUT` notes once the station-row benches are retired.

## Progress

- 2026-10-16: plan drafted; decisions 1–3 answered. Nothing built.
- 2026-10-16: added (user): every ordering task is dragged into place, never clicked in sequence (§2.2); the
  `order` widget and the catalogue strip change in T0, ahead of the quest conversions.
