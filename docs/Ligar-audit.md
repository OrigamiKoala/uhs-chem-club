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
| `q3-distance` Distance (5) | 2.2 (potential energy vs distance, bond length, bond energy), 2.3 (lattice energy trend, qualitative) | **Coulomb's law as a quantity** ($F \propto q_1q_2/r^2$, $E \propto q_1q_2/r$), units, using it to rank lattice energy with numbers | Stage 1 plot is a nearly empty dark panel with a tiny "Pair A 200 −72.4" readout with no unit beside the number. Stage 5 shows charges and centre distances but never asks the player to use them: a ranking is reachable by memorising "MgO is strongest". The hotplate fixture sits on stage 5 though nothing is heated. |
| `q4-dots` Dots (5) | 2.5 (Lewis diagrams, octet, lone pairs, incomplete octet) | **Formal charge** (2.6), expanded octets (named in rewards, never built here), odd-electron species | Stage 1 reads clearly: atoms, "Adds a pair" and "Takes one back" tools, count "8 of 8 left". Octet counters on atoms are small. |
| `q5-resonance` Resonance (3) | 2.6 resonance in ozone, bond-length evidence | **Formal charge to choose the best structure**; ions with three structures (carbonate, nitrate); bond order from resonance | Only ozone. The source notes formal charge, nitrate and fractional bond order were cut earlier. Not played. |
| `q6-shape` Shape (5) | 2.7 (linear, tetrahedral, trigonal pyramidal, bent; lone pair compression) | Trigonal planar by itself; **5 and 6 domain shapes** (trigonal bipyramidal, seesaw, T-shaped, octahedral, square planar) are only in the Warden and a reading; molecular vs electron-domain geometry as two ideas | Stage 3 bench is dense: view dial, marker dial, protractor, four arms and hub on one table. Hub atom shows "X" and "Arms 0" before anything is attached. |
| `q7-polarity` Polarity (4) | 2.1 (polar covalent, partial charges), 2.7 (net dipole from shape) | **Electronegativity as a periodic trend** is used (HCl, H–F) before it is taught anywhere; percent ionic character / bond type from ΔEN | Stage 3 table reads well (five 3D molecules, field plates). Electronegativity numbers appear only in a reading. |
| `q8-hybrid` Hybrid (5) | 2.7 (sp³, sp², sigma/pi, rotation) | **Hybridization read from domain count** (sp, sp², sp³ for a given molecule); counting σ and π bonds in a molecule | Not played. Relies on mixing a mixer the player has never seen. |
| `q9-orbitals` Orbitals (3) | Not in the AP CED (molecular orbital theory) | Nothing AP is missed; it is enrichment | Not played. Should say on the bench that it is optional. |
| `boss-warden` (5 phases) | Review of 2.3, 2.5, 2.7, polarity | Quantitative lattice energy | Not played. |

## Cross-cutting problems

1. **Quantitative side is nearly absent.** No bench asks for a number the player computed. AP expects Coulomb's law reasoning with charge and distance ratios, bond-energy and bond-length trends as data, and formal charge as arithmetic ($FC = V - N - B/2$).
2. **Prerequisite concept used before taught.** Electronegativity, central to 2.1 and 2.5 to 2.7, is first used in `q7-polarity` and never given its own bench.
3. **Missing AP topics.** 2.4 (metals and alloys), formal charge (2.6), shapes for five and six domains (2.7), hybridization from a formula.
4. **Legibility.** Painted labels on the tilted 3D mat (atom symbols, gauge readouts, plot axes) are small at a 800 px wide pane. This is the U4 problem in the earlier audit and is still visible.
5. **Sorts reveal their categories.** Tray names state the possible answers; acceptable when the evidence is discovered, but several sorts in Ligar (q1 s3, q2 s2) still reduce to matching a printed fact to a tray.

## Planned work, in priority order

1. **Quantitative Coulomb stage** in `q3-distance` (replacing the unused ranking of stage 5 with proportional reasoning, then numbers).
2. **Formal charge** stage in `q5-resonance` or a new bench, using the existing Lewis slate.
3. **Electronegativity and bond type** (new bench, ahead of polarity) to give 2.1 its quantitative half.
4. **5 and 6 domain shapes** in `q6-shape`.
5. **Metals and alloys** (2.4) in `q2-lattice`.
6. Visual fixes: atom label size on `q1-joins`, gauge clipping on stage 4, `q3-distance` plot legibility and unit.

Work after this audit is recorded at the end of this file.

## Work log

(none yet)
