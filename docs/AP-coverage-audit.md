# AP coverage audit

Oct 29, 2026. Two questions: (A) does the built Learn track cover the AP Chemistry content for atomic
structure, molecules, gases and thermochemistry, and (B) once every quest in `docs/plans/learn-quests.md`
is built, is ALL AP content covered, quantitative content included.

## Method and limits

- Source of truth: `docs/ap-chemistry-course-and-exam-description.pdf` (CED, Course Framework V.1). I extracted
  every learning objective (92), essential knowledge statement, equation line (`EQN:`) and exclusion statement.
- Built track: loaded every quest module in Node and read each stage's prompt and reward title, the 5 `PRACTICE`
  items per quest, and the quest header comments. I also grepped quest source for specific terms.
- Read the existing `docs/Bellows-audit.md`, `docs/Ember-audit.md` and `docs/Ligar-audit.md` coverage tables and
  checked them against the CED instead of repeating them.
- **Not done:** no stage was played (CLAUDE.md: agents do not browser-test). "Covered" means a stage or practice
  item exists for it, not that it teaches well. A grep that finds nothing is reported as "not found", not proof of
  absence in every phrasing.

## Status

`docs/plans/learn-quests.md` was updated from this audit on 2026-10-29. **Done in the plan:** CED numbering and quest tags,
the "AP coverage" table (now with built / planned / **FIX** marks and a list of CED exclusions), the scope labels (B3),
the stages that give the missing topics a home (B2), the overlap note on Mirrowen `q4` (B6), and a note under
Ember Reach listing what was cut when it was built. **Still open:** the built-quest fixes marked **FIX** (Avogadro
arithmetic, ion configurations, electron affinity and the electronegativity trend, a reaction-progress diagram, ΔG°
from ΔGf°), a typed worked-figure stage for each unbuilt world (B4), the free-response skills (B5), a per-LO coverage
table, and the `verify:learn` rule about deferred vocabulary.

One correction to the first version of this document: the plan's *drafts* did contain several of the stages named
as missing in B2 (Bellows `q3` s7 gas volume, Ember Reach `q1` s6 and `q3` s5 energy diagrams, `q7` s5 to s7 ΔGf°,
kinetic control and coupled reactions, Lanternfall `q6` s7 ions and `q8` s7 to s8 successive ionization and
electronegativity). They were **cut when the quests were built**, so the plan's coverage claim was wrong rather than
the drafts. The updated plan records them as owed or rehoused.

## Headline findings (as found; resolution is in the Status above and in B1 to B7)

1. **The plan is written against the old CED numbering.** The current CED has 12 topics in Unit 7 (no 7.13, 7.14),
   11 in Unit 8 (the plan stops at 8.10) and 11 in Unit 9 (the plan's 9.7 to 9.10 are one slot too low). Three
   topics fall through as a result (see B1).
2. **AP content the plan has no quest for:** gas stoichiometry (4.5.A.3), pH and solubility (8.11), coupled
   reactions (9.7), thermodynamic vs kinetic control (9.4, dropped when Ember Reach was built), ΔG° from ΔGf°
   (9.3.A.3), purity from elemental analysis (1.4).
3. **Wrongly labelled "beyond the exam":** the Nernst equation (9.10 is a full CED topic with `E = E° − (RT/nF) ln Q`).
4. **Labelled in scope but excluded by the CED:** the pH after adding acid or base to a buffer (Verdigris `q7` s7),
   and "oxidizing/reducing agent" as assessed terms (Brinewire `q1` s4).
5. **Built content that is not on the AP exam and is not labelled as such:** Bellows `q5` (effusion, diffusion,
   Graham's law, rms speed). The CED has only `KE = ½mv²` and the Maxwell–Boltzmann picture.
6. **Built gaps in atomic structure:** electron affinity and the electronegativity trend are taught nowhere
   (`q8-trends` header says "the words go to the Drill Deck"; its five practice items do not contain them).
   Ion electron configurations and group reactivity trends are thin.
7. **Quantitative skill is mostly one multiple-choice practice item per formula** in Tallow, Lanternfall and Ligar.
   Bellows and Ember Reach are the only built worlds where the player types a computed number on the bench. The
   plan's own rule ("numeric practice goes to `PRACTICE`") leaves `E = hν`, `c = λν`, `A = εbc` and the moles
   arithmetic as single MCQs. This matters because the AP free-response section is quantitative.

---

# Part A. Built track against the CED

Verdicts: **Covered**, **Partial** (a real hole, named), **Gap** (nothing found), **Unbuilt** (planned, so see Part B).

## Atomic structure (CED Unit 1)

| CED | Where built | Verdict | Notes |
| --- | --- | --- | --- |
| 1.1 Moles and molar mass | Tallow `q6-weigh` s1 to 8; `boss-hopper` p5 | **Partial** | The mole, molar mass and grams to moles (s6) are worked on the bench. Avogadro's number is only a printed count on a counter. No stage and no practice item converts grams or moles to a number of particles (`PRACTICE` P1 to P5 are moles from grams, molar mass, which holds more atoms, moles of H in 2 mol H₂O, meaning of "a mole"). 1.1.A asks for exactly that dimensional analysis. |
| 1.2 Mass spectra | Tallow `q5-assay` s1 to 8 | **Covered** | Weighted average from abundances, predicting a spectrum, deducing the mix from the average. Quantitative. |
| 1.3 Elemental composition | Kettle `q1-recipe` s5 (percent composition), s6 (empirical formula) | **Covered** | Built. Only a 3 g C : 8 g O case turns up in the practice; no case that needs a multiplier to reach whole numbers was found. |
| 1.4 Composition of mixtures | none built | **Gap** | `q1-recipe` s8 ("matches its label") is the nearest. Purity from elemental analysis is not taught. |
| 1.5 Electron configuration | Lanternfall `q6-filling` s1 to 5; Tallow `q2-core` s5, `q4-ledger` | **Partial** | Aufbau, Hund, 4s before 3d, scandium all covered. Configurations of ions (Fe³⁺, Cl⁻, O²⁻), which 1.5.A names, are not asked; `q4-ledger` builds ions in the shell model only. Coulomb's law: qualitative in `q8-trends`, ranked in Ligar `q3` s6. |
| 1.6 Photoelectron spectroscopy | Lanternfall `q7-pes` s1 to 5 | **Covered** | Peak position and relative height to configuration, both directions. |
| 1.7 Periodic trends | Lanternfall `q8-trends` s1 to 5 | **Partial** | Radius, shielding and Zeff, ionization energy, ionic radius: covered. **Electron affinity: not taught anywhere** (the string occurs only in a header comment of `q8-trends` and in the plan). **Electronegativity trend:** Ligar `q7` s1 teaches electronegativity as a number printed on a card, never as a trend across a period or down a group. Successive ionization energies appear only as a cut idea in `q8`'s header. 1.7.A.3 (estimate an unknown property from position) is exercised for proton number only (`q3-catalogue` s7). |
| 1.8 Valence electrons, ionic compounds | Tallow `q3-catalogue` s4 to 6, `q4-ledger` s5 to 7; Ligar `q1` s4 | **Partial** | Charges from valence electrons, whole-number cancellation, alkali/halogen/noble words: covered. Reactivity trends down a group (1.8.A.1) not found. |

## Molecules (CED Unit 2, plus the intermolecular topics of Unit 3)

| CED | Where built | Verdict | Notes |
| --- | --- | --- | --- |
| 2.1 Types of bonds | Ligar `q1` s2 to 5, `q2` s2, `q7` s1 to 2, s7 | **Covered** | Ionic, polar and nonpolar covalent, metallic. |
| 2.2 Potential energy vs distance | Ligar `q3` s1 to 4 | **Covered** | Bond length and energy from the curve, bond order. Quantitative (s2: energy to break 2 mol HCl). |
| 2.3 Ionic solids | Ligar `q2` s2 to 4, `q3` s5 to 6 | **Covered** | Coulomb's law as a ranking (charge, ion size). |
| 2.4 Metals and alloys | Ligar `q2` s6 to 10 | **Covered** | Interstitial and substitutional by atomic radius. |
| 2.5 Lewis diagrams | Ligar `q4` s1 to 8 | **Covered** | Electron budget, octet, incomplete, expanded, odd-electron. |
| 2.6 Resonance, formal charge | Ligar `q5` s1 to 8 | **Covered** | Hand-counted formal charge, fractional bond order. |
| 2.7 VSEPR, hybridization | Ligar `q6` s1 to 10, `q7` s1 to 7, `q8` s1 to 9 | **Covered** | Shapes from two to six domains with lone pairs; sp, sp², sp³; σ and π. "Geometric isomer" is never named in the quest text (restricted rotation, s5 to 6, is taught). |
| Beyond the exam, taught | Ligar `q9-orbitals`; hybrid mixing `q8` s3, s8, s9 | n/a | Molecular orbital diagrams and the derivation of hybrid orbitals are excluded by the CED. The track marks `q9` optional. |
| 3.1 Intermolecular forces | none built | **Unbuilt** | Mirrowen `q2`, `q3`. Bellows `q6` says only that molecules attract a little. |
| 3.2 Properties of solids | Ligar `q2` (partly) | **Partial** | Ligar already sorts ionic, metallic, network and molecular solids by melting point, conduction and brittleness. The plan gives this to Mirrowen `q4` as well (see B6). |
| 3.3 Solids, liquids, gases | none built | **Unbuilt** | Mirrowen `q1`. |

## Gases (CED 3.4 to 3.6)

| CED | Where built | Verdict | Notes |
| --- | --- | --- | --- |
| 3.4 Ideal gas law | Bellows `q1` to `q4`, `boss-compressor` p1 to p3 | **Covered** | Boyle, Charles, Gay-Lussac, combined, Avogadro, `PV = nRT`, molar mass, density, Dalton and mole fraction, gas over water (vapour correction), STP, graphs and slopes, manometers. Typed numeric answers throughout. Strongest quantitative world in the track. |
| 3.4 / 4.5.A.3 Gas stoichiometry | none | **Gap** | The CED names it ("stoichiometric calculations combined with the ideal gas law"). Bellows hands it to Kettle (`Bellows-audit.md`), and Kettle `q6` as planned does not include gases (see B2). |
| 3.5 Kinetic molecular theory | Bellows `q1` s5, s6; `q5` s7, s8 | **Covered** | KE and temperature, Maxwell–Boltzmann by temperature and by mass. |
| 3.5 extras: effusion, diffusion, Graham's law, rms speed | Bellows `q5`, `boss-compressor` p5 | **Not on the exam** | None of these appear in the CED. Keep, but label as beyond the exam on the cards and practice, as the plan does for other extras. |
| 3.6 Deviation from ideal | Bellows `q6` s1 to 4 | **Covered** | High pressure and low temperature; molecular volume and attractions. Qualitative, which is what the CED asks. |

## Thermochemistry (CED Unit 6, plus the thermodynamic half of Unit 9)

| CED | Where built | Verdict | Notes |
| --- | --- | --- | --- |
| 6.1 Endothermic and exothermic | Ember Reach `q1` s4 | **Partial** | Chemical changes covered. 6.1.A.4 (dissolving as exo- or endothermic from the strength of interactions) is only touched by `q7` s1's cold pack; the interaction-strength argument is missing. |
| 6.2 Energy diagrams | `q3` s1 ("the shelves") | **Partial** | `Ember-audit.md` already says qualitative only. No reaction-progress diagram with reactants, products and ΔH drawn or read. The kinetic version is planned for Quicklight `q5`. |
| 6.3 Heat transfer, thermal equilibrium | `q1` s1, s3, s5 | **Covered** | |
| 6.4 Heat capacity, calorimetry | `q2` s1 to 3, s5, s6 | **Covered** | Typed `q = mcΔT`, metal identification. Molar heat capacity (6.4.A.5) and a calorimeter's own heat capacity not found. |
| 6.5 Energy of phase changes | `q2` s4, s7 | **Partial** | Fusion and vaporization worked, ice at 0 °C to steam at 100 °C in kJ. No heating curve drawn or read; the sign flip for condensation and freezing (6.5.A.2) not found. `Ember-audit.md` still says vaporization is missing, which is out of date. |
| 6.6 Enthalpy of reaction | `q3` s1 to 7 | **Covered** | Per mole, scaling, per equation, limiting reactant, predicted temperature. |
| 6.7 Bond enthalpies | `q4` s1 to 6 | **Covered** | Ledger the player fills. |
| 6.8 Enthalpy of formation | `q5` s4, `boss-crucible` p3 | **Covered** | Products minus reactants. |
| 6.9 Hess's law | `q5` s1 to 3 | **Covered** | Reverse, scale, add. |
| 9.1, 9.2 Entropy | `q6` s1 to 5 | **Covered** | Includes ΔS° from a table. |
| 9.3 Gibbs free energy | `q7` s2 to 5 | **Partial** | `ΔG° = ΔH° − TΔS°` and the crossing temperature, typed. `ΔG° = ΣΔGf°(products) − ΣΔGf°(reactants)` (9.3.A.3) is absent. |
| 9.4 Thermodynamic vs kinetic control | `q7` practice only | **Gap** | Mentioned as one answer option in practice; no stage. `Ember-audit.md` agrees. |
| 9.5 Free energy and equilibrium | none | **Unbuilt** | Teeter `q8`. |
| 9.6 Free energy of dissolution | `q7` s1 | **Partial** | The cold-pack salt that dissolves while cooling the water is the observation; the ΔH/ΔS argument for solubility is not drawn out. |
| 9.7 Coupled reactions | none | **Gap** | Not planned either. |

## Verdict on Part A

Strong: gases, Hess/bond/formation enthalpy, Lewis/VSEPR, PES. Needs work before the track can claim the
four named areas: **Avogadro arithmetic, ion configurations, electron affinity and electronegativity trends,
the heating curve, energy diagrams, ΔGf° sums, thermodynamic vs kinetic control, coupled reactions, gas
stoichiometry.** Each is a single-stage fix except 9.4 and 9.7, which need a home (see B3).

---

# Part B. `docs/plans/learn-quests.md` against the CED

## B1. The CED numbering the plan used was stale (fixed in the plan)

The plan said its numbers came from "the 2019/2020 CED, so check them against the current CED". Checked, and the
plan now says its numbers are the current CED's. Where they differed:

| Unit | Plan | Current CED | Effect |
| --- | --- | --- | --- |
| 7 | 7.11 to 7.13 → Teeter `q7`; 7.14 → `q8` | Topics end at **7.12**. 7.11 solubility equilibria, 7.12 common-ion effect. Free energy and K is only **9.5**. | Plan's 7.13 (pH and solubility) is now **8.11** and has no quest in the plan's coverage table. |
| 8 | 8.1 to 8.10 | **8.1 to 8.11** (8.11 pH and solubility) | 8.11 missing. Teeter `q7` s7 teaches it informally; give it a number and a Verdigris home. |
| 9 | 9.7 → Brinewire `q3`, `q4`; 9.8 → `q4`; 9.9 → `q5`; 9.10 → `q6` | 9.7 **coupled reactions**, 9.8 galvanic and electrolytic cells, 9.9 cell potential and free energy, 9.10 **nonstandard conditions (Nernst)**, 9.11 **electrolysis and Faraday's law** | Every Brinewire mapping is one slot low. 9.7 (coupled reactions) has no quest. Nernst and Faraday are now core, not extras. |
| 5, 6 | as in plan | Unchanged (5.1 to 5.11, 6.1 to 6.9) | ok |
| 3, 4 | as in plan | Unchanged | ok |

## B2. Topics with no quest (or too thin a quest)

"Plan now" is what `learn-quests.md` says after the 2026-10-29 update.

| CED | What was missing | Plan now |
| --- | --- | --- |
| 4.5.A.3 gas stoichiometry | The CED says stoichiometry combines with the ideal gas law and molarity. Bellows left it to Kettle; Kettle `q6` had no gas stage. | **Added:** Kettle `q6` stage 5 (heat CaCO₃, collect CO₂, type the volume at 25 °C and 1.00 atm; over water, subtract the vapour pressure). Stages 4 and 5 (limiting reactant, excess) were merged to make room. Bellows `q3` s7 is noted as cut. |
| 8.11 pH and solubility | No number, no quest; Teeter `q7` s7 taught it before acids are earned. | **Moved:** Verdigris `q8` stage 7, qualitative only (the amino-acid stage moves to practice). Teeter `q7` s7 is now a common-ion comparison for 1:1 and 1:2 salts. |
| 9.3.A.3 ΔG° from ΔGf° | Absent from plan and from built `q7`. | **Owed (FIX):** noted under Ember Reach as a typed stage with a ΔGf° table. Not yet in the built quest. |
| 9.4 thermodynamic vs kinetic control | Drafted in Ember Reach `q7`, cut in the build. | **Rehoused:** Quicklight `q5` stage 3 (a downhill reaction on a tall hill); header tag now includes 9.4. |
| 9.7 coupled reactions | Drafted in Ember Reach `q7`, cut in the build. | **Rehoused:** Teeter `q8` stage 7 (replaces the ΔG vs ΔG° stage, which becomes a practice item labelled beyond the exam). |
| 1.4 composition of mixtures | Mirrowen `q6` s7 gave a mass percent only. | **Added:** Kettle `q6` stage 8 now ends with the percent purity of the salt; Mirrowen `q6` stage 7 points there. |
| 1.7 electron affinity, electronegativity trend | Drafted in Lanternfall `q8` s7 to s8, cut in the build; the header's Drill Deck promise is not kept. | **Owed (FIX):** a note under Lanternfall `q8` says to restore stage 8 or add three practice items. |
| 1.5 ion configurations | Drafted in `q6-filling` s7, cut in the build. | **Owed (FIX):** note under Lanternfall `q6`. |
| 6.2 energy diagrams | Drafted in Ember Reach `q1` s6 and `q3` s5, cut in the build. | **Owed (FIX):** Ember Reach note asks for one reaction-progress diagram stage in `q3`. |
| 6.5 heating curve, condensation | Mirrowen `q5` covered the upward trip only. | **Added:** Mirrowen `q5` stage 4 now also asks for the heat released on condensing and freezing. Stages 6 to 8 (phase diagrams) stay labelled beyond the exam. |
| 6.1.A.4, 6.4.A.7 dissolving as exo or endo | Planned nowhere. | **Added:** Mirrowen `q6` stage 6 (calorimeter cup, read ΔT, explain by interaction strengths); header tag now 6.1, 6.4. |
| 1.1 Avogadro arithmetic | Not in the plan. | **Owed (FIX):** listed in the coverage table; no stage written yet. |

## B3. Mislabelled scope (all fixed in the plan except Bellows `q5`'s built cards)

| Plan item | Plan said | CED says | Action (done in the plan) |
| --- | --- | --- | --- |
| Brinewire `q5` s5, Nernst | "(beyond the exam)" | 9.10 is a topic; `E = E° − (RT/nF) ln Q` is on the equation list | Label removed; it is in scope, with a typed-answer stage suggested. |
| Brinewire `q6` Faraday's law, `I = q/t` | present, mapped to 9.10 | 9.11 | Remapped to 9.8 and 9.11. |
| Verdigris `q7` s7 "Add base and find the new pH" | in scope | Excluded ("computation of the change in pH resulting from the addition of an acid or a base to a buffer") | Labelled beyond the exam in the plan. |
| Brinewire `q1` s4 oxidizing and reducing agent | taught | "Meaning of the terms reducing agent and oxidizing agent will not be assessed" | Labelled beyond the exam in the plan. |
| Quicklight `q5` s7 Arrhenius | beyond the exam | Excluded | Correct. |
| Teeter `q4` s5 Kp/Kc | beyond the exam | Excluded | Correct. |
| Mirrowen `q7` s6 to 7 colligative | beyond the exam | Excluded | Correct. |
| Bellows `q5` (built) | not labelled | Not in the CED | Plan labels all of stages 4 to 8. **The built cards and practice are not yet labelled.** |

## B4. Quantitative coverage against the CED equation list

Every `EQN:` line in the CED, with its planned or built home.

| Equation | CED | Home | Quantitative depth |
| --- | --- | --- | --- |
| `n = m/M`; Avogadro | 1.1 | Tallow `q6` | Moles worked; particle count not (Part A). |
| average atomic mass | 1.2 | Tallow `q5` | Worked on a balance beam on the bench (s3 to 7), plus two MCQ. |
| `F ∝ q₁q₂/r²` | 1.5, 2.2 | Lanternfall `q8`, Ligar `q3` | Ranking only. Matches the CED ("proportional"). |
| `c = λν`, `E = hν` | 3.11, 3.12 | Lanternfall `q1`, `q2` | One MCQ each in practice; no typed calculation. |
| Photoelectric `KE = hν − Φ` | 3.12 | `boss-eater` p2 | Bench. |
| `A = εbc` | 3.13 | Lanternfall `q9` | Bench (calibration), two MCQ. |
| `PV = nRT`, Dalton, `KE = ½mv²` | 3.4, 3.5 | Bellows | Bench, typed. |
| `M = n/L`, dilution | 3.7 | Mirrowen `q6` | Planned (stage 2, 3). |
| gas and solution stoichiometry, limiting reactant, yield, titration | 4.5, 4.6 | Kettle `q6`, `q7` | Planned; gas piece missing (B2). |
| `q = mcΔT`, `q = nΔH`, `ΔH = Σ(bonds) …`, `ΔHf` sums, Hess | 6.4 to 6.9 | Ember Reach | Bench, typed. |
| rate law, order, `k`, units | 5.2 | Quicklight `q2` | Planned. |
| integrated laws, `t½` | 5.3 | Quicklight `q3` | Planned (zero, first, second). |
| `Kc`, `Kp`, `Q`, ICE | 7.3 to 7.10 | Teeter `q2`, `q3`, `q5`, `q6` | Planned. Small-x approximation planned (`q5` s3 to 4). |
| `Ksp`, molar solubility, common ion | 7.11, 7.12 | Teeter `q7` | Planned. |
| `pH`, `pOH`, `Kw` | 8.1, 8.2 | Verdigris `q1`, `q2` | Planned. |
| `Ka`, `Kb`, `pKa`, `Ka·Kb = Kw` | 8.3, 8.7 | Verdigris `q3`, `q8` | Planned. |
| Henderson–Hasselbalch | 8.9 | Verdigris `q7` | Planned (s4 to 6). |
| `ΔS° = ΣS°` | 9.2 | Ember Reach `q6` | Built, typed. |
| `ΔG° = ΔH° − TΔS°` | 9.3 | Ember Reach `q7` | Built, typed. |
| `ΔG° = ΣΔGf°` | 9.3 | none | **Missing.** |
| `K = e^(−ΔG°/RT)` | 9.5 | Teeter `q8` | Planned. |
| `ΔG° = −nFE°` | 9.9 | Brinewire `q4` | Planned. |
| `E = E° − (RT/nF) ln Q` | 9.10 | Brinewire `q5` | Planned, mislabelled (B3). |
| `I = q/t`, Faraday | 9.11 | Brinewire `q6` | Planned. |

**The rule that weakens the quantitative side.** The plan says numeric practice "is the place for photon energy,
Beer–Lambert, formal charge" and the quests teach each once. On the built evidence this means Lanternfall and
Tallow have one MCQ per formula. A student who understands the idea can still fail a free-response item that
asks for the arithmetic. Where the plan has an ordinary typed-answer stage (Bellows and Ember Reach pattern:
`answerCards`, typed numeric fields, slip options with a reason), use it for the worked-figure stages in the
unbuilt worlds. Specifically worth a typed stage in every planned world: `n = m/M` with Avogadro (Tallow), `c = λν`
and `E = hν` (Lanternfall), `M₁V₁ = M₂V₂` (Mirrowen), a mass-to-mass stoichiometry and a titration concentration
(Kettle), `k` from a table (Quicklight), an ICE solve (Teeter, planned), a `pH` of a weak acid (Verdigris, planned),
`E°cell` and `ΔG°` (Brinewire).

## B5. Free-response skills

The CED weights experimental design, data analysis and justification (Science Practices 2, 4, 6) heavily on the free
response. The plan's stage 8 "sealed sample" pattern covers claim-and-evidence in principle. Bellows adds percentage
error and the direction of a systematic slip. Nothing plans: choosing which plot is linear (Quicklight `q3` does),
random error and significant figures, or designing a procedure. Not content, but part of "all AP content" if the goal
is the exam. Suggest one cross-world set of stages or a short, optional "Lab Notebook" quest per unit rather than
more benches.

## B6. Overlap and sequencing

- **Mirrowen `q4` duplicates Ligar `q2`** (note added to the plan; stages 1 to 4 should still be cut or shortened).
   Ligar `q2-lattice` already covers kinds of solid, alloys and the
  property sorts (CED 2.4 and most of 3.2). Reduce `q4` to molecular solids, amorphous vs crystalline, and the
  four-way sealed sort, or move 3.2 to "Ligar `q2`, Mirrowen `q4` s5 to 8".
- **Teeter `q8-free` before Brinewire `q4`.** ΔG° and K (9.5) comes from Teeter; ΔG° and E° (9.9) from Brinewire.
  Already noted in the plan; the coupled-reaction stage (9.7) belongs next to the first one.
- **Gas over water** is split across Bellows `q4` s7 and Mirrowen `q3` s8; the moles-of-product step now has a home
  in the plan (Kettle `q6` stage 5), which is not yet built.
- **Ember Reach before Kettle.** The plan's workaround is sound. Ember Reach `q3` s5 already uses a balanced
  equation (6.0 g H₂ burning), so the plan note "Ember Reach supplies every equation already balanced" holds.
- **The Drill Deck cannot carry deferred vocabulary.** `q8-trends` defers two terms to it that its practice items
  do not contain; `verify:learn` should fail a header that promises a term the `PRACTICE` set lacks.

## B7. The plan's own status was stale (partly fixed)

- The status line and the AP table are now current. "Size of the road" and "Build order" still say Bellows and Ember Reach are proposals and that
  Ligar `q3` to `q9` is "still to build". All of them are built: Ligar 9 quests plus the Warden, Bellows 6 plus
  the Compressor, Ember Reach 7 plus the Crucible, Kettle `q1-recipe` and the Golem. The plan's quest counts for
  Bellows (6) and Ember Reach (7) match; I did not compare stage counts.
- Built Bellows and Ember Reach have typed worked-figure stages the plan does not describe. Rewriting both sections
  from the built quests (and `Bellows-audit.md`, `Ember-audit.md`) would make the coverage table honest.
- **Still open.** The "AP coverage" table lists topics but not learning objectives. 92 LOs exist; several topics hold two (6.9.A
  and 6.9.B). A per-LO table is more robust to renumbering.

---

# Corrected coverage map

This is now the table in `docs/plans/learn-quests.md` ("AP coverage"), copied here on 2026-10-29. **B** = built,
**P** = planned, **FIX** = a stage owed that is not yet in the built quest.

| Unit | Topic → quest |
| --- | --- |
| 1 | 1.1 Tallow q6 (B; **FIX**: grams or moles to particle count with Avogadro's number is never asked, add a stage or practice) · 1.2 Tallow q5 (B) · 1.3 Kettle q1 (B) · 1.4 Kettle q6 stage 8 purity (P) · 1.5 Lanternfall q6 (B; **FIX**: configurations of ions) · 1.6 Lanternfall q7 (B) · 1.7 Lanternfall q8 (B; **FIX**: electron affinity and the electronegativity trend) · 1.8 Tallow q3, q4, Ligar q1 (B; group reactivity trends not found) |
| 2 | 2.1 Ligar q1, q7 · 2.2 q3 · 2.3 q2, q3 · 2.4 q2 · 2.5 q4 · 2.6 q5 · 2.7 q6, q7, q8 (all B) |
| 3 | 3.1 Mirrowen q2, q3 · 3.2 Ligar q2 (B) and Mirrowen q4, reduced · 3.3 Mirrowen q1 · 3.4 Bellows q1 to q4 (B) · 3.5 Bellows q1, q5 (B) · 3.6 Bellows q6 (B) · 3.7, 3.8, 3.10 Mirrowen q6 · 3.9 Mirrowen q7 · 3.11 to 3.13 Lanternfall q1, q2, q9 (B) |
| 4 | 4.1, 4.4 Kettle q3 · 4.2 q5 · 4.3 q4 · 4.5 q6 including the gas stage 5 · 4.6 q7 · 4.7 q8 · 4.8 q8, Verdigris q1 · 4.9 q8, Brinewire q1 (all P) |
| 5 | 5.1 Quicklight q1 · 5.2 q2 · 5.3 q3 · 5.4, 5.5 q4 · 5.6, 5.10 q5 · 5.7 to 5.9 q6 · 5.11 q7 (all P) |
| 6 | 6.1 Ember Reach q1 (B) and Mirrowen q6 stage 6 (dissolving) · 6.2 Ember Reach q3 (B; **FIX**: reaction-progress diagram) · 6.3 q1 (B) · 6.4 q2 (B), Mirrowen q6 stage 6 · 6.5 q2 stages 4, 7 (B) and Mirrowen q5 (P) · 6.6 q3 (B) · 6.7 q4 (B) · 6.8 q5 (B) · 6.9 q5 (B) |
| 7 | 7.1, 7.8 Teeter q1 · 7.2 q3 · 7.3 q2, q3 · 7.4, 7.5 q2 · 7.6 q4 · 7.7 q5 · 7.9, 7.10 q6 · 7.11, 7.12 q7 (all P) |
| 8 | 8.1 Verdigris q1, q2 · 8.2 q2 · 8.3 q3 · 8.4 q5, q7 · 8.5 q6 · 8.6 q4 · 8.7 q8 · 8.8, 8.9 q7 · 8.10 q8 · 8.11 q8 stage 7 (all P) |
| 9 | 9.1, 9.2 Ember Reach q6 (B) · 9.3 Ember Reach q7 (B; **FIX**: ΔG° from ΔGf°) · 9.4 Quicklight q5 stage 3 (P) · 9.5 Teeter q8 (P) · 9.6 Ember Reach q7 stage 1 (B) and Teeter q8 (P) · 9.7 Teeter q8 stage 7 (P) · 9.8 Brinewire q3, q6 (P) · 9.9 q4 · 9.10 q5 (Nernst, in scope) · 9.11 q6 (all P) |

---

# Recommended actions

Done (plan, 2026-10-29):

1. Numbering and coverage table fixed to the corrected map.
2. Homes found for gas stoichiometry, 8.11, 9.4, 9.7 and purity as stages in existing quests; ΔG° from ΔGf° recorded
   as owed.
3. Relabels: Nernst in scope; buffer-addition pH, oxidizing/reducing agent, Bellows `q5` beyond the exam (in the plan).

Open:

4. **Close the built atomic-structure gaps**: electron affinity and electronegativity trend (Lanternfall `q8`), ion
   configurations (`q6-filling`), Avogadro arithmetic (`q6-weigh` or practice), group reactivity (Tallow `q3`).
5. **Close the built thermochemistry gaps**: a reaction-progress diagram (Ember Reach `q3`), ΔG° from ΔGf° (`q7`),
   a heating curve stage (Mirrowen `q5` is planned; Ember Reach `q2` has only the numbers).
6. **Label Bellows `q5`'s built cards and practice** "beyond the exam".
7. **Add a typed worked-figure stage** to each unbuilt world for its headline equation (B4).
8. **Make `verify:learn` fail a header comment or reward that defers a term to the Drill Deck** unless a `PRACTICE`
   item contains it.
