# Ligar audit

Oct 28, 2026. World: Ligar (`unit03`, bonding): nine benches and the Basalt Warden.

## Method and limits

- Read `PRODUCT.md` and `docs/Avalon problems and clashing rules.md` first.
- Played at `3D On` in the Browser pane as a guest. One representative stage per bench was opened and looked at (stage 2 and 4 of `q1-joins`, stage 2 of `q2-lattice`, stages 1, 2 and 5 of `q3-distance`, stage 1 of `q4-dots`, stage 3 of `q6-shape`, stage 3 of `q7-polarity`). **`q5-resonance`, `q8-hybrid`, `q9-orbitals` and `boss-warden` were audited from source and rewards only, not played.** Treat their visual notes as unknown.
- Stages were reached by unlocking the guest profile and calling the runner's `loadStage` through `__LQ_TEST__`; no stage was solved by hand yet.
- AP references are Course and Exam Description (CED) **Unit 2, Molecular and Ionic Compound Structure and Properties**, by topic number (2.1 types of bonds, 2.2 potential energy and bond length, 2.3 ionic solids, 2.4 metals and alloys, 2.5 Lewis diagrams, 2.6 resonance and formal charge, 2.7 VSEPR and hybridization). I cite topics, not learning-objective codes, because I could not check the codes against the CED here.

## Sources of conflict to flag

- The task's example URL (`unit02/q1-wave`) is Lanternfall. Ligar is `unit03`.
- `PRODUCT.md` and `docs/Avalon problems and clashing rules.md` say agents do not browser-test. This session's request explicitly allows it, and the user asked for the benches to be played in 3D, so that is what was done.
- `PRODUCT.md` says benches that pass a first course (hybridization) "say so on the bench and stay optional". Several concepts below that are AP content were cut earlier as "beyond a first course" (formal charge, 5 and 6 domain shapes). Restoring them is a change of the product's age-band position, not only of copy; they should be marked optional on the bench.
- `CLAUDE.md` bans crowding ("NEVER have too many things going on"), which limits how much quantitative content one stage may carry. New quantitative content goes into new stages or benches, one idea each.

## Open items (current)

This section is the status of record. Older sections below are a history; where one disagrees with this list, this list wins.

### Open

| # | Item | Where | State |
| --- | --- | --- | --- |
| 1 | Sorts that end in a lookup: `q2` stages 2 and 3 still sort and rank to what the leads and hotplate show. The hints now send the student to the pictures first, but nothing asks for a reason. | `q2-lattice` 2, 3 | done |
| 2 | Tray names state the possible answers ("Mobile electrons", "Ions freed by melting", "No mobile charges") | `q2-lattice` 2, `q1` 5 | done |
| 3 | `q3` stage 1 is still "find the lowest point"; the pull and push traces explain why there is a bottom, but the task is a hunt | `q3-distance` 1 | done |
| 4 | `q1` stage 2 shows a join's outcome only as a rod or a drift; nothing makes a full outer shell feel necessary | `q1-joins` 2 | done |
| 5 | No quantitative stage on `q7`. The Arrows tool prints the pull difference, so a "set the difference" dial would copy it; the stage needs an atom-pull readout the student subtracts | `q7-polarity` | done |
| 6 | Angles are still read off a protractor and typed (`q6` 1, 5, 6, 7, 8, 9; Warden phase 3). Only `q6` stage 10 asks for a counted number | `q6-shape`, `boss-warden` 3 | done |
| 7 | Carbonate (three drawings, fractional order) is a practice question only. It repeats stage 8's arithmetic, so a stage would need a different idea, such as counting the drawings | `q5-resonance` | closed, user decided against it |
| 8 | Alloys' effect on conduction is untested (stage 8 tests melting only) | `q2-lattice` | open, low value |
| 9 | `q9` stage 3 still asks for twelve electron pours into a ladder; optional and not AP | `q9-orbitals` 3 | done |
| 10 | The element "O" in the mono face reads as "0" on slates, ozone and nitrate stages | `atoms.js` | done |
| 11 | Protractor: once laid on the plate it is a clear disc, nearly invisible, and a hand-made drag did not read an angle (the scripted pointer path does) | `q6` 1, 3, 5 to 9 | done |
| 12 | Dial label sits under the knob at its start position; the nitrate slate's title sits behind the frame | shared marker painter, `atoms.js` | done |
| 13 | The new pull numbers on `q1` stage 3 have no Tour step; the line printed on the plate is the only legend | `tour-ligar.js` | done |
| 14 | `fadeAudio` throws `IndexSizeError` (volume 3.1 outside [0, 1]) in `src/ui/cinematic.js:105` during the landing | not Ligar | done |
| 15 | Stages never played by a hand gesture: `q5` 5 to 8 (looked at), `q6` 3 to 9, `q7` 2, 4, 5, `q8` 1, 2, 4 to 7, 9, `q9` 1 to 3, `q2` 1, 3 to 8, `q1` 1, 2, 4, 5, `q3`, `q4`, Warden phases 2 to 5. A full second audit by gesture was not done | all | open |
| 16 | Student-confusion list (end of this file) needs a person to play it | all | open |

### Resolved since the first audit

- `q8` stage 3 rendered black (nameplate sizes in metres); the empty-bowl readout under the knob.
- Camera swing on a slipped drag in the lean-in view (now smaller, and it settles back).
- `q1` stage 5 crowded row (now the 2 x 2 grid); `q1` stage 3 sorted by a charge seen on the faces (now compares printed pull numbers).
- Arrows tool tiny and a dropped tool not joining (cause was a `nojoin` card; a real drag now joins and prints NET 0.96; the tool is larger).
- `q5` stage 4: stamped charge and mark ring invisible at 3D On.
- Slate counts hidden by the frame.
- Five-domain shapes (`q6` 8, 9); counting domains from a formula (`q6` 10); hybridization from a formula (`q8` 8, 9); `q8` twist stage now predicts first; electron sea drawn on metal blocks; alloys melt lower (`q2` 8); `q9` unearned row words removed and the ladder direction printed; "octet" wording for hydrogen molecules.
- `q9` stage 3 rack boxes drawing: seated and poured electrons (spin arrows) were covered by an opaque lining plate at 3D On; `buildSlot` in `table-props.js` now makes `liningMat` optional, and `table3d.js` passes no lining for flat `kit.noJarFill` containers, leaving other benches' slot linings intact while revealing the arrows.

## Per-bench findings

| Bench | AP topics covered | AP topics missed or thin | Problems seen |
| --- | --- | --- | --- |
| `q1-joins` What Holds (5 stages) | 2.1 (ionic vs covalent, multiple bonds) | Why electrons are handed over (electronegativity), metallic as the third type, bond polarity | Atom labels on the 3D mat are small and blurry (Mg reads like "Ha" at default view). On stage 4 the "Charge of the unit" gauge is clipped by its bezel at the right edge. "Metal + nonmetal hands over" is stated by the reward and the sort rather than found. |
| `q2-lattice` Lattice (5) | 2.1, 2.3 (ion locked in lattice, conduction, brittleness) | **2.4 metals and alloys** (malleability, interstitial vs substitutional alloys); particle-level reason for melting point order is told, not computed | Stage 2 labels, "Tests current" lamp and hotplate text are tiny at the default camera. Tray names ("Mobile electrons", "Ions freed by melting") name the three answers of the sort. |
| `q3-distance` Distance (5) | 2.2 (potential energy vs distance, bond length, bond energy), 2.3 (lattice energy trend, qualitative) | **Coulomb's law as a quantity** ($F \propto q_1q_2/r^2$, $E \propto q_1q_2/r$), units, using it to rank lattice energy with numbers | Stage 1 plot is a nearly empty dark panel with a tiny "Pair A 200 −72.4" readout with no unit beside the number. Stage 5 shows charges and centre distances but never asks the player to use them: a ranking is reachable by memorising "MgO is strongest". (Correction after reading the stage: the hotplate is the instrument of stage 5; the player heats each salt, so the stage is empirical, but nothing made the player use charge and distance as numbers.) |
| `q4-dots` Dots (5) | 2.5 (Lewis diagrams, octet, lone pairs, incomplete octet) | **Formal charge** (2.6), expanded octets (named in rewards, never built here), odd-electron species | Stage 1 reads clearly: atoms, "Adds a pair" and "Takes one back" tools, count "8 of 8 left". Octet counters on atoms are small. |
| `q5-resonance` Resonance (3) | 2.6 resonance in ozone, bond-length evidence | **Formal charge to choose the best structure**; ions with three structures (carbonate, nitrate); bond order from resonance | Only ozone. The source notes formal charge, nitrate and fractional bond order were cut earlier. Not played. |
| `q6-shape` Shape (5) | 2.7 (linear, tetrahedral, trigonal pyramidal, bent; lone pair compression) | Trigonal planar by itself; **5 and 6 domain shapes** (trigonal bipyramidal, seesaw, T-shaped, octahedral, square planar) are only in the Warden and a reading; molecular vs electron-domain geometry as two ideas | Stage 3 bench is dense: view dial, marker dial, protractor, four arms and hub on one table. Hub atom shows "X" and "Arms 0" before anything is attached. |
| `q7-polarity` Polarity (4) | 2.1 (polar covalent, partial charges), 2.7 (net dipole from shape) | **Electronegativity as a periodic trend** is used (HCl, H–F) before it is taught anywhere; percent ionic character / bond type from ΔEN | Stage 3 table reads well (five 3D molecules, field plates). Electronegativity numbers appear only in a reading. |
| `q8-hybrid` Hybrid (5) | 2.7 (sp³, sp², sigma/pi, rotation) | **Hybridization read from domain count** (sp, sp², sp³ for a given molecule); counting σ and π bonds in a molecule | Not played. Relies on mixing a mixer the player has never seen. |
| `q9-orbitals` Orbitals (3) | Not in the AP CED (molecular orbital theory) | Nothing AP is missed; it is enrichment | Not played. Should say on the bench that it is optional. |
| `boss-warden` (5 phases) | Review of 2.3, 2.5, 2.7, polarity | Quantitative lattice energy | Not played. |

## Teaching-quality audit (added after the first pass was judged too shallow)

The first version of this audit checked layout and AP coverage and called most benches fine. That was wrong: it looked at one stage per bench and judged how the table looked, not whether a student would know what to do, or would come away with an idea. This section is from actually operating the benches (drag, drop, dials) as a first-time student, in 3D at an 800 px pane, plus a read of each stage's prompt and reward. Benches I operated by hand: `q1-joins` stage 2, `q3-distance` stage 1, `q6-shape` stage 3. Benches I only opened and looked at: `q2`, `q4`, `q7`, `q8` (stages 3 and 5) and `q9` (stage 3). Not opened: `q5` stages 1 to 3, the Warden, and most later stages everywhere. Read these as a student's-eye critique with that coverage, not a complete play-through.

Three questions per bench: Is it **intuitive** (can a first-time player tell what to do and what happened)? Is any of it **busywork** (a task the player performs that carries no idea)? Does the **setup build intuition** (does the picture or the manipulation make the idea feel necessary)?

### What I saw by hand

- **`q1-joins` stage 2, "Press Them Together".** Not intuitive. The eight atoms are small discs in one crowded row along the far edge, with labels (Na, Cl, Ne) hard to read, while the two sorting trays take most of the table. The gesture is "drag one atom of a pair toward its partner", but the pairs sit 12 units apart and neighbouring pairs are close, so a drag easily lands an atom on a stranger (my Ne landed on Cl, my Ar landed on H) and the result is overlapping discs and an unclear outcome. Nothing on the table says in words what happened to a pair; the player must notice a rod or a drift and then decide by memory what the "ring on the rim" means. The idea (a bond is a shared fill of the outer shell) is not forced by the picture.
- **`q3-distance` stage 1, "The Bottom".** Busywork. The task is to slide a hand until a number is lowest. The curve is a satisfying thing to draw, but the table never shows two atoms moving together or apart, so the student cannot see why the energy climbs when the atoms are too close (the nuclei repel) or flattens when they are far (no pull). "Find the minimum" can be done without understanding why a minimum exists. The axes are tiny and the energy number carries no unit next to it.
- **`q6-shape` stage 3, "Four on the Hub".** The best moment on the bench is real: drop two arms and they settle straight apart; drop more and they swing into new places. But the prompt is "set the angle marker to the measured angle", which turns it into measure-then-type a number the student may already remember. The hub and arms are labelled "X" and "A", letters nobody has been told about. Worse, a missed grab drags the camera: one slip and the table was out of view (floor only), with no visible way back except leaving and re-entering the bench. A younger student would be lost.

### What I saw by opening the stage

- **`q8-hybrid` stage 3, "Four Lobes".** The bench is almost black: the mixing bowl cannot be seen, and the three orbital pieces and their electrons sit tiny at the bottom edge. A student cannot tell what to do. This is the stage the whole quest is built around.
- **`q8-hybrid` stage 5, "Twisting".** Two molecules drawn tiny in the middle of two large empty slates; the idea (a double bond cannot turn) is shown only by a refusal when the dial is turned.
- **`q9-orbitals` stage 3, "Oxygen's Boxes".** Overloaded: twelve green electron pieces, a molecular-orbital ladder with faint "2s/2p" labels, the unexplained words "PUSHES" and "HOLDS" beside the boxes, "PLACED / UNPAIRED" counters and a magnet panel, all at once. This is an idea the AP course does not test. It reads as an exam for a physicist, not a first encounter.

### Per bench verdicts (from the stages and rewards; hand-played ones are marked)

| Bench | Intuitive? | Busywork? | Setup builds intuition? |
| --- | --- | --- | --- |
| `q1-joins` | No (hand-played): crowded row, tiny atoms, accidental joins | The "ionic vs covalent" and "single, double, triple" sorts are sorts of printed facts into trays; the outcome of a join is shown, not reasoned | Weak. The fill-the-shell idea is never made necessary: no reason is given for why atoms "want" it, and electronegativity is absent |
| `q2-lattice` | Partly (opened): the four blocks and three trays read, but the lamp and hotplate text are tiny | Stage 5 ("place the block that stays solid at 900 °C and does not conduct") repeats stages 2 and 3: it is a lookup of the two earlier sorts | Good in stage 4 (build the salt grid, slide a layer, see repulsion and fracture) as the one hands-on moment; stages 2 and 3 are sorting to a known taxonomy |
| `q3-distance` | Stage 1 no (hand-played); stage 5 yes (heat three salts, rank) | Stage 1 and 2 are hunt-the-number; stage 2 ("set the depth marker to the energy to dissociate") is reading a value off a graph | Stage 5 and the new stage 6 do; stages 1 and 2 do not show the atoms |
| `q4-dots` | Yes: "Adds a pair" and "Takes one back" read; the count "8 of 8 left" is a good running check | Stage 1 solves by trial until lamps light, so a student can reach water's drawing by hunting lamps without counting valence electrons | Partly. Lamps give instant feedback, which helps, but no stage makes the student *count* valence electrons first |
| `q5-resonance` | Stage 2 gauge is clean (opened) | Stage 3 ("draw both structures") is rearranging one double bond | Good: the gauge contradicting the drawing is the best hook in the world. Formal charge stages were restored in this pass |
| `q6-shape` | No (hand-played): generic X/A labels, three dials, camera-drag trap | Setting the marker to a measured number is copying | Dropping arms is the idea; the number entry undermines it |
| `q7-polarity` | Yes (opened): plates, cards, trays are clear | Stage 4 repeats stage 3 with liquids and a rod: same answer, same reasoning | Good for polarity-as-vector-sum; weak on *why* a bond is polar since electronegativity is never shown as a number |
| `q8-hybrid` | No (opened): near-black bench, tiny parts | Stage 5 is a refusal demonstration | The mixing idea is strong on paper and invisible on screen |
| `q9-orbitals` | No (opened): overloaded | Fills boxes by a rule the student has just been told | Not AP content; pushes students who have not met orbitals' energies into a hard diagram |
| `boss-warden` | Not opened | Phases are re-tests of earlier benches, by design | Not assessed |

### Consequence for the plan

Teaching problems that stop a student learning go **ahead of** adding AP topics, because new content on a bench the student cannot read will not teach. The revised priority list is at the end of this file.

## Cross-cutting problems

1. **Quantitative side is nearly absent.** No bench asks for a number the player computed. AP expects Coulomb's law reasoning with charge and distance ratios, bond-energy and bond-length trends as data, and formal charge as arithmetic ($FC = V - N - B/2$).
2. **Prerequisite concept used before taught.** Electronegativity, central to 2.1 and 2.5 to 2.7, is first used in `q7-polarity` and never given its own bench.
3. **Missing AP topics.** 2.4 (metals and alloys), formal charge (2.6), shapes for five and six domains (2.7), hybridization from a formula.
4. **Legibility.** Painted labels on the tilted 3D mat (atom symbols, gauge readouts, plot axes) are small at a 800 px wide pane. This is the U4 problem in the earlier audit and is still visible.
5. **Sorts reveal their categories.** Tray names state the possible answers; acceptable when the evidence is discovered, but several sorts in Ligar (q1 s3, q2 s2) still reduce to matching a printed fact to a tray.

## Planned work, in priority order (first pass; superseded by the revised list below)

1. **Quantitative Coulomb stage** in `q3-distance` (replacing the unused ranking of stage 5 with proportional reasoning, then numbers).
2. **Formal charge** stage in `q5-resonance` or a new bench, using the existing Lewis slate.
3. **Electronegativity and bond type** (new bench, ahead of polarity) to give 2.1 its quantitative half.
4. **5 and 6 domain shapes** in `q6-shape`.
5. **Metals and alloys** (2.4) in `q2-lattice`.
6. Visual fixes: atom label size on `q1-joins`, gauge clipping on stage 4, `q3-distance` plot legibility and unit.

Work after this audit is recorded at the end of this file.

## Work log

- **q3-distance, new stage 6 "A Salt Not Yet Heated"** (AP 2.3): rail NaF, NaCl, KCl and MgO by how hard the ions are held, with no hotplate. NaF is the one salt the player never melted, so the printed charges and centre distances are the only evidence. The reward states Coulomb's law as charge product over distance and shows the numbers (1/235, 1/283, 1/319, 4/212; MgO is about five times NaCl, against 3795 and 787 kJ/mol measured). Verified: `verify:learn`, `verify:table`, `verify:story`, `verify:docs`, `verify:ligar`; stage rendered in 3D with no console errors. Not done: the stage still asks for a ranking, not a computed number; a proportional "double the charge" stage and a plot-legibility fix for stage 1 remain.
- **q5-resonance, four new stages (4–7)** (AP 2.6, formal charge): "Who Owns What" (stamp the atoms of CO and mark the positive one), "Do the Count" (set a dial to the formal charge of ozone's middle oxygen, no stamp, so the player does the arithmetic), "Two Drawings" (CO₂: choose the drawing with charges nearest zero) and "Where the Minus Goes" (SCN⁻: negative charge on the atom that pulls harder). These stages were retired earlier from the same bench; the kit and engine still supported them, so they were restored with the new dial stage and Tour steps for Stamp and Mark (`tour-ligar.js`). Practice set now holds two formal-charge questions. Also fixed a legibility bug in the shared slate painter (`atoms.js`): lone pairs on an atom at the far side of a slate hid behind its puck at 3D On, so they now swing sideways. Verified: `verify:table`, `learn`, `docs`, `story`, `ligar`, `bench`. Not done: nitrate and carbonate (three structures, fractional bond order) are still only practice questions.
- **q1-joins stages 2, 3 (and 5 left as is), layout:** pairs moved from one crowded row into a 2 x 2 grid, 60 units apart, so a drag toward a partner can no longer land on a stranger, with larger readable atoms and shorter trays. Replayed by `verify:table` (drag and two taps) and `verify:learn`; looked at in 3D. Stage 5's row of four pairs is unchanged and still crowded.
- **q6-shape, new stages 6 and 7** (AP 2.7): "Six on the Hub" (six arms settle into an octahedron; find the smallest angle among pairs that do not all read the same) and "Two Unseen Arms on Six" (four arms and two lone pairs: the pairs sit opposite and the atoms lie flat, square planar). Rewards name octahedral SF₆ and square planar XeF₄ with 3D models. The tray was widened for six pieces (layout checked by `verify:table`). Seen in 3D with six arms attached. Trigonal bipyramidal and seesaw (five domains) are not yet a stage.
- **q3-distance stage 1:** the two atoms on the track are drawn twice as large; the improvement is small and the stage is still a hunt for the lowest number (see priority 2).
- **Re-evaluated:** `q2-lattice` stage 5 and `q7-polarity` stage 4 are application stages (use what was learned on a new case), not pure repeats, so they are kept. The first audit's call to cut them was too hasty.
- **[Resolved; see Open items]** Earlier note: on `q7-polarity` the Arrows tool, dropped on a card, shows only a tiny tag and no readable arrow at the default 3D camera, so the "pulls" the stages tell the player to use are not visible.
- **q7-polarity, new stage 1 "How Hard Each Atom Pulls"** (AP 2.1): lay the Arrows on H₂, HBr, HCl and KF, read the printed pull, and sort into "Shared evenly", "Pulled toward one" and "Taken by one". The reward names electronegativity and gives the numbers (0, 0.96, 3.16) and the rough 1.7 boundary for an ionic bond. HBr and KF were added to the molecule table (`vsepr.js`); the 3D arrows on a card are now longer and thicker so they can be seen. Later stages moved down one place (vocabulary stages, `verify:learn` indices and the world chart updated). Not done: the sort asks for a band, not a computed difference; HF is deliberately not used because the 1.7 rule would label it ionic.
- **[Resolved; see Open items]** Earlier note: with the Arrows tool, my click-then-click and drag onto a card left the tool lying free over the card instead of joined, while the same join through the game's own action worked and `verify:table` (drag and two taps in 2D) passes. A student may hit this. Needs a real-hand test.
- **q3-distance stage 1, why there is a bottom:** the plot now also draws two dotted traces over the stretch the hand has been through, "pull" (the nuclei on the other atom's electron, long reach) and "push" (the atoms against each other, short reach). Their sum is exactly the energy curve (Morse is the sum of those two exponentials), so nothing is invented. The reward and the second hint say so. The disc scale option was also being dropped silently (`wells()` did not pass `discK` on), so the atoms are now really drawn larger. Seen in 3D. Still the same task (find the lowest point); the bottom is still found, not told. Stage 2 (set the depth marker) and `q6-shape` stage 3 (type a measured angle) are unchanged.
- **q6-shape stage 3, redesigned (supersedes the note below):** it is now "Leaving the Plate". The tray holds five arms and the plate has a DEPTH gauge (new `hubThickness` in `vsepr.js`: the thinnest slab through the hub that holds every atom). The player adds arms one at a time, sees DEPTH stay 0.00 for two and three arms and rise to 0.82 at four, and sets a marker to the fewest arms that cannot lie flat (4). It builds on the stage 2 prediction, needs no protractor and no remembered number, and five arms means the answer is not just "all of them". Seen in 3D with three and four arms. The 109.5° figure now comes only in the reward. Still not done: the "X" and "A" ball faces and the camera-drag trap.
- **q6-shape stage 3, earlier small rework (superseded):** the hub plate no longer says "Hub A" (it says "Centre atom"), hint rung 2 now sends the student to look at whether the arms stay in one flat layer and to compare several pairs, and the reward says why: four arms get furthest apart in space (109.5°), while laid flat they would sit closer (90°). The task is unchanged: attach four arms, read an angle with the protractor, set the marker. I kept it because it is the test of the stage-2 prediction (flat 90°, spread 109°, flat 120°) and the number comes from a measurement; a typed number is still a weak way to show the idea, and the camera-drag trap and the "X" and "A" ball faces are not fixed.
- **q2-lattice, new stages 6 and 7: metals and alloys** (AP 2.4). Done as stages at the end of the metal bench rather than a new bench: a new bench needs a generated world site, chart, story and about ten more files, which was too risky to add without a way to play-test the walk to it. Stage 6 "Hammer the Metals": a pure metal block bends, a substitutional alloy (a few larger foreign atoms among the rows) dents less, an interstitial one (much smaller atoms in the gaps) holds; sort by how far each gives way. Stage 7 "Where the Atoms Go": four atom cards with their widths (Ni 135, Cr 140, C 70, H 25 pm; iron 140 pm) sorted into "in its place" or "in a gap". The planner (`joinbench.js`), blow mapping (`bonds.js`) and block picture got an `alloy` field (`sub` or `int`) and per-atom size and tint. Seen in 3D: BENT, HELD and DENTED show on the struck blocks. Not covered: the electron sea is not drawn on the metal pictures, and alloys' effect on conductivity and melting point is not tested. Atom widths are Clementi empirical radii.
- **Operability fixes (done):**
  - **Arrows join:** the cause was my own stage, not 3D. Plain molecule cards are `nojoin`, so a dropped tool never joined; the `q7` stage 1 cards are now field cards (`dmol`), and a real drag in the browser joins the tool to the card. (`verify:table` could not see it because its script joins by direct action.)
  - **Camera trap:** inside a world, a drag on empty plate dropped the player out of the lean-in view, with only an "[E] LEAN IN" prompt to return (a phone has no E key). A drag while leaned in now swings the view a little and settles back (`bench3d.js`); Leave Bench and the walk keys still leave. Reproduced before, and confirmed after, with a real drag.
  - **Ball faces:** the generic hub and arm in `q6-shape` read "Hub" and "Arm" instead of "X" and "A".
  - **`q1-joins` stage 5:** the four pairs are in the same 2 x 2 grid as stages 2 and 3, with trays below.
- **Teaching fixes after the operability pass:**
  - **q4-dots, new stage 1 "Count the Electrons":** water's slate hides its "OF 8 LEFT" count and the player sets a dial to the valence electrons the three atoms bring, so the budget is counted before any drawing (previously the tray told the total and a student could hunt for lit lamps). Now 6 stages.
  - **q1-joins stage 5:** the prompt is now "how many electron pairs its two atoms will share" and pressing is no longer required, so a student can reason from the outer electrons each atom shows (N five, O six, F seven, H one) and how many more it needs; hints and miss message follow that reasoning. Seen: the electrons are visible on the atoms in 3D.
  - **q3-distance stage 2:** the marker is set to the energy for **2 mol** of H–Cl bonds (the plot is for 1 mol, printed on the table), so it is proportional reasoning with units, not reading a depth off a graph. Reward and verify updated.
  - **q5-resonance, new stage 8 "Four Over Three":** restored from history: gauge the three equal bonds of nitrate and set a dial to the fractional bond order, 4/3. Now 8 stages.
  - **q8-hybrid:** stage 5's prompt is an objective ("find out which of these two bonds lets its far end turn a quarter turn") not a command, and a new stage 6 "Counting Sigma and Pi" asks for the sigma and pi bonds of H–C≡N (the HCN card now shows its bond lines). Now 6 stages.
  - **q9-orbitals:** it was already `optional: true` in the chart (the first audit said it was not); its descriptor line now says "Optional, beyond AP".
- **[Superseded by Open items]** Status at that time: `q1-joins` stage 3 still sorts by an observed charge on the faces; `q2-lattice` stages 2 and 3 still sort to a taxonomy the student is not asked to reason about; `q5` stages 1 to 3 and the Warden were never played; `q9` stage 3 is still overloaded; `q6` and `q7` have only light quantitative content; `q8` stage 5 is still an observation of a refusal, now with an objective prompt. None of the new stages has been played by a student.

## Blockers and bugs logged, not fixed

- `src/ui/cinematic.js:105` `fadeAudio` throws `IndexSizeError` (volume 3.1173 outside [0, 1]) during the landing sequence. Not Ligar-specific, not touched.
- Deep links such as `#/learn/unit03/q1-joins` first redirect to the world (the ship flies there); a page reload on the quest hash lands on the bench. Quests also stay locked until the one before is complete, so auditing a later bench needs the guest profile unlocked (`session.markLearnQuestComplete`).
- `__LQ_TEST__.runner` plus `runner.loadStage(i)` is the fastest way to open a given stage when auditing.

## Revised priority list (after the teaching-quality review)

1. **Make stages operable and readable** (blocking): `q8-hybrid` stage 3 bench is black; the camera-drag trap on every bench (a missed grab sends the camera off the table); `q1-joins` crowded pair row and accidental joins; unreadable tiny atoms and labels.
2. **Replace "type the number you measured" and "find the minimum" with reasoning tasks**: `q6-shape` stage 3 and `q3-distance` stages 1 and 2 (show the two atoms, predict then see the energy, ask why).
3. **Cut or merge repeated stages**: `q2-lattice` stage 5, `q7-polarity` stage 4, and the listing-the-category sorts in `q1-joins`.
4. **Add the missing quantitative and conceptual content**: electronegativity and bond type (ΔEN), 5 and 6 domain shapes, alloys, hybridization from a formula.
5. **Mark `q9-orbitals` as optional enrichment** and cut its on-table load.

## Open defects, as first logged (history; the current status is in Open items)

- **FIXED: `q8-hybrid` stage 3 rendered black at 3D On.** Cause: `orbital-props.js` asked the table's `label()` (which takes metres) for a 128 × 48 and a 64 × 64 nameplate and then scaled it, so every orbital piece carried a plane about 140 m wide that blacked out the view. The call now asks for the real size. It affected every orbital piece in the game, including Lanternfall's orbital benches. Remaining on that stage: the mixer readout text ("NOTHING MIXED") is partly covered by the bowl's knob. Earlier notes:  the lean-in camera pose is the normal 55° one, the ground texture is painted (non-empty canvas), the mat and ground meshes are visible, no console errors, and hiding the mixer fixture does not change the picture. Cause not found. A student cannot see the mixing bowl, so this stage cannot teach until it is fixed.
- **[Mitigated; the swing is smaller and settles back]** Camera drag on a missed grab. In `q6-shape` stage 3 a drag that started on empty plate moved the view until the table was out of sight. The code clamps look to about ±0.2 rad, so it may have been something else (a dragged piece), not reproduced.
- **[Resolved: now the 2 x 2 grid]** `q1-joins` stage 5 used the crowded single row.
- **[Status moved to Open items]** At that time, still to do: `q6` number entry, `q3` stages 1 and 2, repeated stages in `q2` and `q7`, electronegativity and bond type, 5 and 6 domain shapes, alloys, optional label on `q9`.

## Second pass: the remaining teaching work (Oct 29, 2026)

Method: the dev server at 3D On in the Browser pane, guest profile, `loadStage` through `__LQ_TEST__`. "Real gesture" below means a pointer drag or click in the 3D view (not `window.__R.act`). Many benches take 5 to 10 s to appear after a stage change (the pane is black until the world finishes loading); a screenshot taken sooner is not a defect.

### Played, by stage

| Stage | How it was played | Result |
| --- | --- | --- |
| `q5` 1 (predict) | real drag of a card into the slot, Submit, Next | works |
| `q5` 2 (bond length) | real drag of the Gauge onto a bond (reads 128 pm); real drag of the dial | works; the dial label sits under the knob at its start position (shared marker painter, not changed) |
| `q5` 3 (two ozone drawings) | real drag of "Adds a pair" onto a bond (bond became double) | works. **Fixed:** the "n OF 18 LEFT" count sat behind the timber frame and under the right atom of a wide slate |
| `q5` 4 (stamp and mark on CO) | real drags of Stamp and Mark | **Defect found and fixed:** the stamp registered but printed nothing (the shoulder position is off the puck's face at 3D On) and the mark ring was drawn outside the puck. The charge now replaces the electron count on the atom (C −1, O +1) and the ring is inside the rim |
| `q5` 5 (dial for the middle oxygen) | looked at, not operated | reads clearly; atom symbol "O" in the mono face reads like a zero at the default view |
| `q5` 6 (CO₂ drawing) | one real drag of "Adds a pair" between two atoms | works; the slate sits far back and small |
| `q5` 7 (SCN⁻), 8 (nitrate 4/3) | looked at, not operated | count clipped as above (fixed); the NO₃⁻ title sits behind the frame |
| `q6` 1 (two arms) | real drags and taps of arms onto the hub | arms join and settle apart. **Not confirmed by hand:** laying the protractor on two arms. Once dropped on the plate it is a clear acrylic disc that is almost invisible on the dark plate, and my drags did not read an angle (the scripted pointer path in `verify:bench` does) |
| `q6` 3, 4, 5, 6, 7 | not played by gesture | rely on `verify:table` and `verify:bench` (pointer paths by drag and by two taps) |
| `q6` 8, 9 (new) | `verify:bench` pointer paths only | stage 9 needs the Turn dial (the top arm hides behind a balloon at the default view) |
| `q7` 1 (electronegativity sort) | real drag of Arrows onto the HCl card (joins, prints NET 0.96) | works. The tool is a thin pen: readable but small |
| `q7` 2 (predict) | looked at | reads |
| `q7` 3 (sort in the field) | real click on "Switch Field" | works; the screen lags a moment behind the click, so a double click switches it back off |
| `q7` 4, 5 | not played | |
| `q8` 3 (bowl) | real drags of s and px into the bowl (readout LOBES 2, LEFT OVER 2) | works and renders (the earlier black bench is fixed). The empty-bowl readout "NOTHING MIXED" was under the knob and now sits lower |
| `q8` 1, 2, 4, 5, 6 | not played by gesture | |
| `q8` 7, 8, 9 (new: predict the twist, boron, carbon in CO₂) | `verify:bench` only | |
| `q9` 1, 2 | not played | |
| `q9` 3 | not played; edited from source | the rack no longer prints PUSHES / HOLDS or a PLACED count, the prompt is an objective |
| `q1` 3 | real drag: Mg pressed onto O (joins, rod drawn) | the pull numbers are legible after enlarging them |
| `q2` 2 | looked at | legible at the default camera; the three tray names still state the possible answers |
| `boss-warden` phase 1 | real drag of Plate B into the slot, Submit | works (hints, miss and win paths unplayed) |
| `boss-warden` phases 2 and 4 | looked at | readable |
| `boss-warden` phases 3 and 5 | not played | |

### Changes this pass

- **Shared slate painter (`atoms.js`):** stamped charge visible, mark ring on the puck, count and charge lines moved clear of the frame; slate top margin raised so the count clears wide slates. `q4-dots` and `q5` slates were moved down to stay on the table.
- **`bench3d.js`:** a slipped drag in the lean-in view swings less (about 8° of yaw instead of 17°).
- **`q1-joins` 3:** each atom prints how hard it pulls on shared electrons (`opts.pull`), the stage sorts handed-over from shared pairs by comparing the numbers, then pressing to confirm. The reward ties ionic and covalent to the gap between the pulls (the word electronegativity is earned in `q7`). Electronegativity is no longer used before it is seen.
- **`q2-lattice`:** the metal block pictures now draw one free electron per ion between the ions (the electron sea). Stages 2 and 3 are unchanged (see below).
- **`q6-shape` 8, 9:** five domains settle as axis and ring (middle of the three angles: 120°); two atoms and three lone pairs give 180° (XeF₂), with SF₄ and ClF₃ named in the reward.
- **`q8-hybrid`:** new predict stage before the twist (which bond lets the far end turn), then the twist; new stages "Three Lobes" (boron, BF₃, sp²) and "Two Lobes" (carbon, CO₂, sp), so hybridization is read from the number of arms on a formula card. Now 9 stages.
- **`q9-orbitals` 3:** unearned row words and the PLACED counter removed; one count (UNPAIRED) remains.
- **`q4-dots`, `boss-warden`:** prompts said "octet" for molecules containing hydrogen; now "full outer shell".
- **`q7`:** the Arrows tool is larger (table radius 8.5).
- **Tools:** `tools/verify-bench.mjs` prints the differing values when `BENCH_DIFF=1` is set.
- **Counts at that point:** 242 stages (q2 and q6 have grown since: now q2 8, q6 10, 244 in all).

### Still weak at the end of the second pass (superseded by Open items)

- `q2-lattice` 2 and 3 still sort or rank to results found by heating and clipping; they do not ask for a reason. Alloys' effect on conduction and melting point is untested.
- `q6` and `q7` have little quantitative content (angles are read and typed; no ΔEN arithmetic beyond stage 1's bands; no bond-order or lattice-energy ratios).
- `q9` stage 3 still asks for twelve electron pours into a molecular orbital ladder; the stage is optional and not AP.
- `q5` nitrate and carbonate resonance with three drawings are practice questions only.
- The Warden's phase 3 (type an angle from a protractor) repeats the reading-and-typing mechanism.
- The "O" in the mono face reads as "0" on every Lewis slate and on the nitrate/ozone stages.

### Stages I suspect confuse a first-time student (play these first)

1. `q6` 1 and 3: laying the protractor on two arms. The disc is nearly invisible once on the plate and the second arm hides behind balloons or the hub at the default view.
2. `q6` 9 and `q6` 7: reading an angle between arms that sit behind a balloon needs the Turn dial; nothing tells the student that.
3. `q5` 4: Stamp and Mark are two tools used in order (stamp both atoms, then mark one); the prompt says only "mark the atom".
4. `q8` 3, 8, 9: three controls (pieces, bowl, readout) and the lobe model; whether a student sees why an orbital "left over" matters.
5. `q1` 3: whether the pull numbers are read as a gap or as two separate facts.
6. `q7` 3: the field switch reacts late; a student may click twice.
7. `q9` 3: the whole stage.
8. The Warden phases 2 to 5 as a first-time sequence (the foe's lines and the integrity bar were not read).

### Third step: the rest of the rework (Oct 29, 2026)

- **`q2-lattice` 8 "Alloys on the Hotplate" (new):** rail copper, brass, iron and steel by melting point. Each alloy melts below its pure metal, and the reward says why (foreign atoms break up the rows). Stages 2 and 3 now send the student to the pictures first (which particles carry charge; which blocks are separate groups) and call the heating a check on a prediction. They still end in a sort and a ranking.
- **`q6-shape` 10 "Count the Domains" (new):** SF₄ card with no lone pair drawn; the marker is set to the domains on sulfur (6 valence electrons, 4 bonds, 1 lone pair = 5), so the number has to be counted from the formula. Played by a real drag of the knob (the knob lands a step short of where the pointer ends, so a student will adjust).
- **`q8` 8 "Three Lobes":** played end to end by gesture (three drags into the bowl, LOBES 3, LEFT OVER 1, Submit, reward).
- **`q9` 3:** the rack prints HIGHER ENERGY and LOWER ENERGY (the direction of the ladder, which "from the lowest box" needed); the count lines moved off the frame. Looked at in 3D; not poured by hand.
- Stage total 244. `verify:learn`, `table`, `docs`, `story`, `ligar` and `bench` pass after each change.

Left undone (all of these are listed as open in Open items):
- **`q5` carbonate:** same four-pairs-over-three-bonds arithmetic as nitrate, so it would repeat stage 8, not add an idea.
- **`q7` quantitative stage:** the Arrows tool already prints the pull difference, so a "set the difference" dial would be copying a number. A real one needs an atom-pull readout that the student must subtract, which means a new kit reading.
- **Warden phase 3:** still reads and types a protractor angle from ammonia.
- **Alloy conduction:** not tested; both brass and steel conduct, so it would not discriminate anything.
- A full second audit pass by gesture over every stage was not done; the table above says which stages were played.

### Update after the open-items pass (usage limit reached)

Changed and checked (all 13 `verify:*` scripts print OK at commit "Ligar open items"): items 1 and 2 (`q2` stage 9 ranks four unheated blocks from their pictures; stage 2 trays now name what the lamp did), 3 (`q3` stage 1 asks where the atoms stay put), 4 (`q1` stage 2 prints that a ring lights when a shell is full), 5 (`q7` stage 6 subtracts printed pulls), 6 (`q6` stage 5 and Warden phase 3 ask for the gap below 109.5), 9 (`q9` stage 3 seats ten electrons; two are poured), 10 (sans-serif element symbols), 11 (brass protractor disc), 12 (dial track lowered, slate title moved), 13 (Tour sentence for pull), 14 (audio volume clamped). Stage total 246. Not re-played by hand after these edits: `q2` 9, `q7` 6, `q6` 5.

- **FIXED: q9 stage 3 rack boxes drawing at 3D On:** electrons seated or poured into the rack boxes are now drawn at 3D On. `buildSlot` in `table-props.js` makes `liningMat` optional; `table3d.js` passes no lining for flat boxes (`kit.noJarFill`, where contents are painted on the mat), leaving regular card/slot linings intact on other benches. The arrows painted on the mat are now visible inside the rack boxes.

Still open from the list: 7 (carbonate, excluded by request), 8 (alloy conduction), 15 (hand-play coverage), 16 (student-confusion list).
