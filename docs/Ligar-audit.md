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
- **Seen but not fixed:** on `q7-polarity` the Arrows tool, dropped on a card, shows only a tiny tag and no readable arrow at the default 3D camera, so the "pulls" the stages tell the player to use are not visible.
- **q7-polarity, new stage 1 "How Hard Each Atom Pulls"** (AP 2.1): lay the Arrows on H₂, HBr, HCl and KF, read the printed pull, and sort into "Shared evenly", "Pulled toward one" and "Taken by one". The reward names electronegativity and gives the numbers (0, 0.96, 3.16) and the rough 1.7 boundary for an ionic bond. HBr and KF were added to the molecule table (`vsepr.js`); the 3D arrows on a card are now longer and thicker so they can be seen. Later stages moved down one place (vocabulary stages, `verify:learn` indices and the world chart updated). Not done: the sort asks for a band, not a computed difference; HF is deliberately not used because the 1.7 rule would label it ionic.
- **Unresolved, seen in 3D:** with the Arrows tool, my click-then-click and drag onto a card left the tool lying free over the card instead of joined, while the same join through the game's own action worked and `verify:table` (drag and two taps in 2D) passes. A student may hit this. Needs a real-hand test.
- **q3-distance stage 1, why there is a bottom:** the plot now also draws two dotted traces over the stretch the hand has been through, "pull" (the nuclei on the other atom's electron, long reach) and "push" (the atoms against each other, short reach). Their sum is exactly the energy curve (Morse is the sum of those two exponentials), so nothing is invented. The reward and the second hint say so. The disc scale option was also being dropped silently (`wells()` did not pass `discK` on), so the atoms are now really drawn larger. Seen in 3D. Still the same task (find the lowest point); the bottom is still found, not told. Stage 2 (set the depth marker) and `q6-shape` stage 3 (type a measured angle) are unchanged.
- **q6-shape stage 3, small rework only:** the hub plate no longer says "Hub A" (it says "Centre atom"), hint rung 2 now sends the student to look at whether the arms stay in one flat layer and to compare several pairs, and the reward says why: four arms get furthest apart in space (109.5°), while laid flat they would sit closer (90°). The task is unchanged: attach four arms, read an angle with the protractor, set the marker. I kept it because it is the test of the stage-2 prediction (flat 90°, spread 109°, flat 120°) and the number comes from a measurement; a typed number is still a weak way to show the idea, and the camera-drag trap and the "X" and "A" ball faces are not fixed.

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

## Open defects not fixed

- **FIXED: `q8-hybrid` stage 3 rendered black at 3D On.** Cause: `orbital-props.js` asked the table's `label()` (which takes metres) for a 128 × 48 and a 64 × 64 nameplate and then scaled it, so every orbital piece carried a plane about 140 m wide that blacked out the view. The call now asks for the real size. It affected every orbital piece in the game, including Lanternfall's orbital benches. Remaining on that stage: the mixer readout text ("NOTHING MIXED") is partly covered by the bowl's knob. Earlier notes:  the lean-in camera pose is the normal 55° one, the ground texture is painted (non-empty canvas), the mat and ground meshes are visible, no console errors, and hiding the mixer fixture does not change the picture. Cause not found. A student cannot see the mixing bowl, so this stage cannot teach until it is fixed.
- **Camera drag on a missed grab.** In `q6-shape` stage 3 a drag that started on empty plate moved the view until the table was out of sight. The code clamps look to about ±0.2 rad, so it may have been something else (a dragged piece), not reproduced.
- **`q1-joins` stage 5** still uses the crowded single row.
- Everything in the revised priority list below item 1 is still to do: `q6` number entry, `q3` stages 1 and 2, repeated stages in `q2` and `q7`, electronegativity and bond type, 5 and 6 domain shapes, alloys, optional label on `q9`.
