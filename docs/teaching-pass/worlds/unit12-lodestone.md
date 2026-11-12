# Lodestone (`unit12`): transition metals

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. This world is **not built**. The file is a lesson plan for a first build, written 2026-11-12 by a plan session to the same standard as the ten live worlds. No code was changed.

- **Session:** build session. One new view (the crystal-field picture) needs a strong model; the rest is reuse.
- **What exists:** the chart `src/learn/worlds/unit12-transition-metals.js` (four placeholder quests); a stage list in `docs/plans/learn-quests.md` ("World 12", five quests of eight). No quest files, bank, glossary or checks.
- **Topic, to confirm:** the chart and the stage list say transition metals. `docs/plans/world-plans.md` section 1 lists this world as "Thermodynamics & Entropy", which Ember Reach already teaches; this plan follows the chart.
- **Exam:** beyond the AP exam throughout. Owner decision for beyond-exam content: it must be followable by a 13-year-old, and "beyond the exam" appears nowhere in play text.
- **To create:** `src/learn/quests/unit12/` (four benches and a boss), `src/learn/bank/unit12.json`, `src/learn/glossary/lodestone.js`, a `verify:lodestone` check, story animations, the 3D site.

## How this plan differs from the earlier stage list

- Five quests of eight become four benches and 22 stages plus a five-phase boss.
- "Winning and Losing Metals" (smelting, refining, rusting) is left out: sacrificial protection is Brinewire `q2` stage 6, electrolysis is Brinewire `q6`, and a furnace reaction is Kettle. Nothing in it is about d electrons.
- Variable charge is taught from successive ionization energies the student can see, not from a list of manganese colours.

## Instruments

| Need | Source | Size |
| --- | --- | --- |
| Orbitals on an energy ladder with ↑ and ↓ electrons and "Test Energy" | shells kit `shelf` and `well` (Lanternfall `q6`) | reuse; add 3d and 4s rows for the fourth period |
| Energy to remove each electron in turn | trends kit `strip` (Lanternfall `q8`) | reuse on Mn and Mg |
| A magnet that pulls a sample with unpaired electrons | shells kit `magnet` (Lanternfall boss phase 3), Ligar `magnet` | reuse |
| Light absorbed by a solution; colour chips | cuvette kit `spectro` (Lanternfall `q9`) | reuse |
| A particle window with a "Mark" dial for lone pairs | pH kit `phpour` (Verdigris `q1` stage 7) | reuse |
| A central atom with bonds that settle apart, turned in 3D | Ligar `hubplate`, `turner` | reuse; ligands in place of atoms |
| A charge meter | atom kit `needle` | reuse |
| An electron on a ladder that jumps a gap and absorbs a line | optics kit `ladder` (Lanternfall `q3` stage 4) | reuse with a two-level ladder |
| **Crystal-field view** | new: the five d orbitals drawn as clouds round a metal ion; six ligands slide in along the axes; the two orbitals that point at ligands rise on a side ladder and the three that point between fall | **L** (shares its cloud drawing with Lanternfall `q10` and Ligar `q9`) |

## Bench-level sequence

| Bench | Idea | Terms it introduces (gloss) |
| --- | --- | --- |
| `q1-dblock` The d-Block (5) | In the fourth period the 3d orbitals fill; 4s and 3d electrons are close in energy, so these metals form ions of several charges, losing 4s first. | d-block, transition metal (an element whose ions have a partly filled d subshell), oxidation state |
| `q2-complex` Complex Ions (6) | A metal ion accepts lone pairs from surrounding molecules or ions, which arrange themselves round it in a set shape. | ligand, complex ion, coordinate bond, coordination number, isomer (cis and trans) |
| `q3-colour` Colour (6) | Ligands split the d orbitals into two energy levels; light whose energy matches the gap is absorbed, and the rest is the colour seen. | crystal field splitting |
| `q4-spin` Magnetism (5) | Whether d electrons pair up or spread out depends on the size of the gap, and decides whether the complex is pulled by a magnet. | high spin, low spin, paramagnetic (recap) |
| `boss` (5 phases) | Re-test. No new idea. | none |

Recaps at first use (worlds are all open from the start): electron configuration and subshells (`q1` stage 1, primer from Lanternfall `q6`); ionization energy (`q1` stage 3); lone pair (`q2` stage 2); complementary colour and photon energy (`q3` stage 1 and 3); unpaired electrons and magnets (`q4` stage 1).

## Plan rows

"Texts" gives the final prompt (P), the briefing (B) where the stage needs one, and the reward (R).

### `q1-dblock` The d-Block (5 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Filling the Fourth Period | After 4s, the five 3d orbitals fill, one electron each before any pair. | Ladder with 4s and 3d; "Test Energy" drops any electron with a lower place free. Build iron's outer electrons. | B: "A subshell is a set of orbitals of one energy. After 4s comes 3d, a set of five orbitals; the ten elements that fill it are the d-block." P: "How are iron's eight outermost electrons arranged at the lowest energy?" R: "Two in 4s and six in 3d: five singly, then one pair. Iron is [Ar] 4s² 3d⁶." | `shelf`, `well` |
| 2 | Which Leave First (predict) | A guess: 3d or 4s? | Two cards; lead: the ladder of the neutral atom. | P: "Iron loses two electrons to become Fe²⁺: which two?" Cards: "The two in 4s", "Two from 3d". | cards |
| 3 | Making the Ion | In the ion, 3d lies below 4s, so the 4s electrons leave first. | The ladder redraws for the ion as electrons are removed: the 3d rungs drop below 4s. "Test Energy" accepts only the arrangement with 4s empty. | P: "Which electrons has Fe²⁺ lost?" R: "The 4s pair. Once the atom is an ion its 3d orbitals lie lower than 4s, so Fe²⁺ is [Ar] 3d⁶." | `shelf` with ion levels (M) |
| 4 | Many Charges | Removing one more d electron costs only a little more, so several ions are possible. | "Remove an electron" on magnesium and on manganese: the cost of each removal is plotted. Magnesium's jumps after the second; manganese's climbs evenly to the seventh. | B: "The energy needed to remove each further electron from an atom is plotted as it is removed." P: "Which metal can form ions of many different charges?" R: "Manganese: its 4s and 3d electrons are close in energy, with no sudden jump until seven are gone. Each charge is an oxidation state, from +2 to +7." | trends `strip` |
| 5 | Which Count | A transition metal is one whose ions have a partly filled d subshell. | Five ions on cards, each with its d orbitals drawn: Sc³⁺ (empty), Fe³⁺, Cu²⁺, Zn²⁺ (full), Ti³⁺. | B: "A transition metal is an element that forms an ion with a partly filled d subshell." P: "Which of these ions have a partly filled d subshell?" Trays: "Partly filled", "Empty or full". R: "Sc³⁺ has no d electrons and Zn²⁺ has all ten, so neither behaves as a transition metal ion. The others do." | cards |

### `q2-complex` Complex Ions (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Ammonia on Copper | Molecules can attach to a metal ion and change it. | Ammonia poured into pale blue copper(II) solution: the window shows NH₃ molecules settling round each Cu²⁺ and the flask turns deep blue. | P: "What happens to the copper(II) ions when ammonia is added?" Cards: "Ammonia molecules attach to each ion", "The ions leave as a solid", "Nothing: the colours only mix". R: "Ammonia molecules attached to each Cu²⁺. A molecule or ion attached to a metal ion is a ligand, and the whole is a complex ion." | `phpour` window, cards |
| 2 | Whose Electrons | The ligand supplies both electrons of the bond. | "Mark" dial tags the lone pairs or the hydrogens; after the pour each nitrogen's lone pair lies between N and Cu. | P: "Which electrons make the bond between ammonia and copper?" `selector`: "Ammonia's lone pair", "One electron from each", "Copper's electrons". R: "Both electrons come from nitrogen's lone pair. A bond in which one atom supplies both electrons is a coordinate bond." | `phpour` with `Mark` |
| 3 | Six Round One | Six ligands settle at the corners of an octahedron. | Ligands snapped onto the metal ion settle as far apart as they can; the view turns; the protractor reads 90° between neighbours. | P: "What shape do six ligands make round a metal ion?" (shape cards and a slot, checked after six are attached). R: "An octahedron, with 90° between neighbours. The number of ligand atoms bonded to the metal is its coordination number: here, six." | `hubplate`, `turner` |
| 4 | Four Round One | Four ligands can be tetrahedral or flat in a square. | Two models side by side with four ligands; one is flat. | P: "Which complex has all four ligands in one plane?" R: "The square planar one. Four ligands are usually tetrahedral, but some metal ions, such as Pt²⁺, hold them in a flat square." | two `hubplate` models, `choice` |
| 5 | The Charge of the Whole | A complex ion's charge is the metal's charge plus its ligands'. | Fe³⁺ and six CN⁻ laid on a pad with a charge meter. | P: "What is the charge of the complex made of one Fe³⁺ and six CN⁻?" (set on a dial after building). R: "+3 and six of −1 make −3: [Fe(CN)₆]³⁻." | atom kit `needle`, dial |
| 6 | Two Ways to Place Them | The same ligands can be arranged in two different ways. | A square planar model with two NH₃ and two Cl⁻ to place. Build one arrangement on each of two models. | B: "Molecules with the same atoms arranged differently are isomers." P: "How many different ways can two NH₃ and two Cl⁻ be placed round a flat square?" (two different models is the answer). R: "Two: with the like ligands side by side, cis, or opposite, trans. The cis form is a cancer drug; the trans form is not." | two `hubplate` models |

### `q3-colour` Colour (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | What Blue Absorbs | A coloured solution absorbs the complementary colour. | White light through the copper solution: the strip of light that passes is dark in the orange. | B: "A solution looks coloured because it absorbs some colours of white light and lets the rest through." P: "Which colour of light does the blue copper solution absorb?" | cuvette `spectro`, colour chips |
| 2 | Why Any Colour? (predict) | A guess. | Three cards. | P: "What inside a copper complex could absorb one colour of light?" Cards: "An electron jumping to a higher level", "The water warming up", "The copper ion vibrating". | cards |
| 3 | Ligands Split the d Orbitals | Six ligands raise the two d orbitals that point at them and lower the three that point between. | The five d clouds round the ion; six ligands slid in along the axes with a dial; on the side ladder two levels rise and three fall. Tap the orbitals that rise. | B: "A ligand's lone pair repels electrons in the metal's d orbitals. The closer an orbital points toward a ligand, the more its energy rises." P: "Which d orbitals are raised most when six ligands approach along the axes?" R: "The two whose lobes point straight at the ligands. The gap that opens between the two sets is the crystal field splitting." | **crystal-field view** |
| 4 | The Gap and the Light | Light is absorbed when a photon's energy equals the gap. | A two-level ladder with one electron; colour dial on the lamp; at one colour the electron jumps and a dark line appears in the band. | B: "A photon is absorbed only if its energy exactly lifts an electron from one level to another." P: "Which colour of light lifts an electron across this gap?" R: "Orange light matches the gap, so it is absorbed, and the solution looks blue." | optics `ladder`, lamp |
| 5 | A Wider Gap | A ligand that widens the gap moves the absorbed light to shorter wavelength. | Water ligands, then ammonia: the gap on the ladder widens and the dark place in the band moves. Cyanide is on a card, with its gap drawn wider still. | P: "A ligand widens the gap further: is the light it absorbs of longer or shorter wavelength?" Cards: "Longer", "Shorter", "The same". R: "Shorter: a wider gap needs a photon of more energy. Changing the ligand changes the colour." | ladder, `spectro`, cards |
| 6 | No Colour | With the d subshell empty or full, no electron can jump, and the ion is colourless. | Ladders for Sc³⁺ (no d electrons), Zn²⁺ (both levels full) and Cu²⁺ (one space). Each can be lit. | P: "Which ions are colourless in solution?" Trays: "Coloured", "Colourless". R: "Sc³⁺ has no d electron to lift and Zn²⁺ has no empty place to lift one into, so neither absorbs visible light." | ladders, cards |

### `q4-spin` Magnetism (5 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Two Iron Solutions | The same metal ion is pulled by a magnet with one ligand and not with another. | "Test Sample" on Fe²⁺ with water and Fe²⁺ with cyanide: one moves toward the magnet. | B: "A substance with unpaired electrons is pulled toward a magnet: it is paramagnetic." P: "Which iron(II) complex has unpaired electrons?" | `magnet`, cards |
| 2 | Spread or Pair (predict) | A guess. | Split ladder with a small gap; two cards. | P: "Six d electrons, a small gap: do they pair up in the lower level, or spread over both?" | cards |
| 3 | Filling the Split Levels | With a small gap electrons spread out singly; with a large gap they pair in the lower level. | Split ladder with a gap dial and "Test Energy": the lowest arrangement changes as the gap grows; an UNPAIRED counter. | B: "Putting two electrons in one orbital costs energy, because they repel. Lifting an electron across the gap costs energy too." P: "How do six d electrons arrange themselves when the gap is large?" R: "All six pair in the lower three orbitals: low spin, no unpaired electrons. With a small gap they spread over all five: high spin, four unpaired." | `shelf` with gap dial (M), `well` |
| 4 | Which Counts Have a Choice | Only d⁴ to d⁷ can be high or low spin. | Split ladders for d³, d⁵ and d⁸ with the gap dial. | P: "For which numbers of d electrons does the size of the gap change the number unpaired?" Trays: "Changes", "Does not change". R: "Three electrons fill the lower level singly either way, and eight leave the same two unpaired. Only four to seven electrons have two different arrangements." | `shelf`, cards |
| 5 | Predict the Magnet | A ligand that makes a large gap gives the low-spin complex. | Two cobalt(III) complexes on cards with their gaps drawn: fluoride (small gap), ammonia (large gap). The magnet is there to test after the answer. | P: "Which cobalt(III) complex is pulled toward the magnet?" R: "The fluoride complex: its small gap leaves four of its six d electrons unpaired. With ammonia all six are paired." | cards, `magnet` |

### Boss (5 phases)

| # | Phase | Re-tests | Design |
| --- | --- | --- | --- |
| 1 | The Ion | `q1` stage 3 | P: "How are the d electrons of Mn²⁺ arranged?" on the ladder. |
| 2 | The Charge | `q2` stage 5 | P: "What is the charge of the complex of Co³⁺ with four NH₃ and two Cl⁻?" |
| 3 | The Pair | `q2` stage 6 | P: "Which model is the trans form?" |
| 4 | The Colour | `q3` stages 1 and 5 | A complex that absorbs violet. P: "What colour is a solution that absorbs violet light?" |
| 5 | The Magnet | `q4` stages 3 and 5 | P: "Which of these iron(III) complexes is pulled more strongly by the magnet?" |

## Glossary (`src/learn/glossary/lodestone.js`)

`TERMS` as in the sequence table. `BANNED`: *ring* for a set of ligands, *holds*, *grabs*, *wants*, *prefers*, *boxes* (orbitals), *rack*, *field* used alone (say crystal field splitting once, then "the gap"). `NEEDS`: electron configuration, ionization energy, lone pair, photon, complementary colour.

## Chemistry to verify and record

- In ions 3d lies below 4s; in the neutral atoms the order of filling is 4s then 3d. Say both, as `q1` stages 1 and 3 do.
- Chromium and copper are exceptions to the filling order (4s¹ 3d⁵, 4s¹ 3d¹⁰): do not use them in `q1` stage 1, or give the clause "two elements in the row are exceptions".
- [Fe(H₂O)₆]²⁺ is high spin and [Fe(CN)₆]⁴⁻ low spin; [CoF₆]³⁻ is high spin and [Co(NH₃)₆]³⁺ low spin.
- [Cu(H₂O)₆]²⁺ absorbs in the orange-red; with ammonia the absorption moves to shorter wavelength and the colour deepens.

## Open for the builder

- The crystal-field view is the one new piece. It needs the d orbital shapes (`orbitals.js` has them for Lanternfall `q4` stage 5) and a ladder that moves with a ligand-distance dial. Build the signed-orbital helper once for Lanternfall `q10`, Ligar `q9` and this.
- `shelf` rows for the fourth period and for a split d set; whether "Test Energy" can take a pairing cost and a gap.
- `hubplate` with ligands (a molecule on each bond, not an atom).
- Chart: replace the four placeholder quests with the four bench ids above.

## Hand-back (plan)

- 22 stages and 5 boss phases, all new: 14 on reused fixtures unchanged, 6 with a new option (M), 2 on the one new view (L; `q3` stage 3 and the story animation).
- Most likely to go wrong in the build: `q3-colour` stage 3 (a new 3D view that has to make "pointing at the ligands" visible on a phone); `q1-dblock` stage 3 (the ladder must redraw its levels for the ion without drawing the answer first); `q4-spin` stage 3 (a new energy rule in "Test Energy").
