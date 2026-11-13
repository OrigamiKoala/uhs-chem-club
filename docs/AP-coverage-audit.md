# AP Chemistry Coverage Audit

Audited Nov 13, 2026 against `docs/ap-chemistry-course-and-exam-description.pdf` (Course Framework V.1 — 91 topics across Units 1–9, 28 `EQN:` lines, and CED exclusions).

## Method & Scope

- **Source of truth:** `docs/ap-chemistry-course-and-exam-description.pdf` (all 91 topics, learning objectives, essential knowledge statements, `EQN:` lines, and exclusion statements).
- **Built track:** All 12 live Learn worlds (`unit01`–`unit12`, 107 charted quests, all `src/learn/quests/` modules and `src/learn/bank/*.json` practice + worked problems).
- **Content beyond AP:** Worlds/benches beyond the AP CED (`unit02/q5-numbers`, `unit02/q10-wavefunctions`, `unit03/q9-orbitals`, `unit04/q5-speed` Graham's law/effusion, `unit06/q5-crossing` phase diagrams, `unit06/q7-separate` boiling-point elevation, `unit07/q9-hsab`, `unit12` Lodestone, and draft `unit13`/`unit14`) are preserved as-is.
- **Boundary of this pass:** Where a quantitative or qualitative AP gap could be patched on an existing bench without modifying quest/stage code, a guided `worked` problem was added to `src/learn/bank/<unit>.json` and verified with `npm run verify:learn`. Where a missing topic is best covered by a new stage or bench, it is **flagged below** and scheduled in [ap-gap-implementation-plan.md](file:///Users/carlliu/chem-3d/docs/plans/ap-gap-implementation-plan.md) with no quest code written.

---

## Executive Summary

With `unit01`–`unit11` built, the two cut stages restored (`unit02/q9-absorb` s6–s7 for CED 3.11; `unit09/q8-capacity` s8 for CED 8.11), and all six workstreams in [ap-gap-implementation-plan.md](file:///home/antigravity/OrigamiKoala/uhs-chem-club/docs/plans/ap-gap-implementation-plan.md) completed, **91 of 91 AP CED topics are covered** qualitatively and quantitatively across stages, bench problems, and guided worked problems, and **all 28 CED `EQN:` equations** are represented.

### Patched in this pass (11 new `worked` problems in `src/learn/bank/`)
- **`unit01/boss-hopper#w`** (CED 1.3): *Empirical and Molecular Formula of Succinic Acid* — mass % → moles → non-integer ratio scaling (1 : 1.5 : 1 → `C₂H₃O₂`) → molecular formula (`C₄H₆O₄`) from molar mass.
- **`unit02/boss-eater#w`** (CED 1.5, 1.6, 1.7): *Identifying an Element from Successive Ionization Energies* — IE₃ → IE₄ core jump, valence electron count, electron configuration, and PES peak count.
- **`unit03/q4-dots#w`** (CED 2.5): *Valence Electron Budget of the Sulfate Ion* — valence electron sum with charge, single bonds, outer octets, and formal charge.
- **`unit03/q6-shape#w`** (CED 2.7): *Molecular Geometry of Bromine Pentafluoride* — valence electrons → 6 domains (5 bonds + 1 lone pair) → square pyramidal geometry and `< 90°` angles.
- **`unit04/q1-knocks#w`** (CED 3.4, 3.5): *Compressing Helium and Neon at Constant Temperature* — `P₁V₁ = P₂V₂`, collision frequency, and equal average kinetic energy at equal `T`.
- **`unit06/q1-states#w`** (CED 3.3): *Space Per Molecule in Liquid Water vs Steam* — molar volume of liquid water vs steam via `PV = nRT` (~1630× ratio).
- **`unit06/boss-undertow#w`** (CED 3.7, 6.5): *Preparing a Solution and Boiling Off the Solvent* — dilution, mole conservation, and `q = nΔHvap`.
- **`unit07/q2-names#w`** (CED 1.8 / stoichiometry prerequisite): *Formula and Mass of Aluminium Sulfate* — charge balance (`Al₂(SO₄)₃`), atom counting, molar mass, and moles of O atoms.
- **`unit09/q1-handover#w`** (CED 4.8, 8.1): *Autoionization of Water and Conjugate Pairs* — Brønsted–Lowry conjugate pairs, `Kw = [H₃O⁺][OH⁻]`, `pH`, and `pOH`.
- **`unit10/boss-clamp#w`** (CED 9.8, 9.9, 9.11): *From Cell Potential to Electrolysis Mass* — `E°cell`, `ΔG° = −nFE°cell`, `q = It`, and Faraday's law mass plated.
- **`unit11/boss-flare#w`** (CED 5.2, 5.3, 5.6): *First-Order Decay and Activation Energy* — `k = 0.693 / t½`, non-integer-half-life `ln[A]t = ln[A]₀ − kt`, and `Ea(rev) = Ea(fwd) − ΔH`.

### New Stages & Bank Items Added (Gap Implementation Pass)

| Priority | CED Topic | Implemented Content | Built Home |
| --- | --- | --- | --- |
| **Medium** | **9.3** (`9.3.A.3`) | Calculating `ΔG°rxn = ΣΔGf°(products) − ΣΔGf°(reactants)` from a `ΔGf°` table including standard-state `O₂(g)` (`ΔGf° = 0`). | `unit05/q7-gibbs.js` s6 (`s6-formation`) |
| **Medium** | **8.4** (`8.4.A.2`, `8.4.A.4`) | Quantitative **weak acid + strong base** reaction regimes (`CH₃COOH` + `NaOH` in 2:1 mole ratio → buffer `pH = pKa` vs 1:1 equivalence). | `unit09/q7-buffer.js` s8 (`s8-half-equiv`) + `unit09.json` (`q7-buffer#e2`) |
| **Medium** | **3.1.A.5, 3.2.A.7** | Noncovalent interactions in **biomolecules** (H-bonding vs hydrophobic dispersion) and **polymers** (chain-length dispersion, cross-linking). | `unit06/q2-grip.js` s9 (`s9-biomolecules`), `unit06/q4-solids.js` s6 (`s6-polymers`), `unit06.json` (`q2-grip#e1`, `q4-solids#e1`) |
| **Low** | **1.7** (`1.7.A.1`, `1.7.A.3`) | **Successive ionization energy** group identification (`IE₁–IE₄`) and estimating a numeric property from periodic neighbours. | `unit02/q7-pes.js` s7 (`s7-ie-group`), `unit01/q3-catalogue.js` s7 |
| **Low** | **1.4** (`1.4.A.2`) | Purity of an impure sample from **elemental analysis** mass % (`% Ca` in impure `CaCO₃`). | `unit07/q6-stoich.js` s9 (`s9-purity`) + `unit07.json` (`q6-stoich#e1`) |

---

## Full Unit-by-Unit CED Matrix

### Unit 1: Atomic Structure and Properties (1.1–1.8)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Moles, molar mass, `NA`, `n = m/M` | `unit01/q6-weigh` (s1–s5), `q6-weigh#w` | Covered | Covered | **Covered** |
| 1.2 | Mass spectra, average atomic mass | `unit01/q5-assay` (s1–s5), `q5-assay#w` | Covered | Covered | **Covered** |
| 1.3 | Elemental composition, empirical/molecular formula | `unit01/q6-weigh` (s6–s8), `boss-hopper#w` (added) | Covered | Covered | **Covered** |
| 1.4 | Composition of mixtures (purity) | `unit07/q5-ionic#w` (gravimetric), `unit07/q6-stoich` (s9 `s9-purity`), `q6-stoich#e1` | Covered | Covered | **Covered** |
| 1.5 | Electron configuration, shells, Coulomb's law | `unit02/q6-filling` (s1–s6 incl. `Cl⁻`), `q6-filling#w` (`Fe³⁺`), `q8-trends` | Covered | Covered | **Covered** |
| 1.6 | Photoelectron spectroscopy (PES) | `unit02/q7-pes` (s1–s5), `q7-pes#w` | Covered | Covered | **Covered** |
| 1.7 | Periodic trends (radius, IE, EA, EN, ionic radius, successive IE) | `unit02/q8-trends` (s1–s9), `unit02/q7-pes` (s6–s7), `unit01/q3-catalogue` (s7), `boss-eater#w`, `unit12/q2-charges` | Covered | Covered | **Covered** |
| 1.8 | Valence electrons, ionic compounds, group reactivity | `unit01/q3-catalogue`, `q4-ledger`, `unit07/q2-names#w` (added) | Covered | Covered | **Covered** |

### Unit 2: Compound Structure and Properties (2.1–2.7)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Types of chemical bonds | `unit03/q1-joins` (s1–s5), `q7-polarity` | Covered | n/a | **Covered** |
| 2.2 | Intramolecular force & potential energy | `unit03/q3-distance` (s1–s4), `q3-distance#w` | Covered | Covered | **Covered** |
| 2.3 | Structure of ionic solids | `unit03/q2-lattice` (s1, s3, s7), `q3-distance` | Covered | Covered | **Covered** |
| 2.4 | Structure of metals & alloys | `unit03/q2-lattice` (s5–s6) | Covered | n/a | **Covered** |
| 2.5 | Lewis diagrams | `unit03/q4-dots` (s1–s7), `q4-dots#w` (added) | Covered | Covered | **Covered** |
| 2.6 | Resonance & formal charge | `unit03/q5-resonance` (s1–s7), `q5-resonance#w` | Covered | Covered | **Covered** |
| 2.7 | VSEPR & bond hybridization | `unit03/q6-shape` (s1–s9), `q6-shape#w` (added), `q7-polarity#w`, `q8-hybrid`, `boss-warden#w` | Covered | Covered | **Covered** |

### Unit 3: Properties of Substances and Mixtures (3.1–3.13)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Intermolecular forces | `unit06/q2-grip` (s1–s9 incl. `s9-biomolecules`), `q2-grip#e1`, `q3-boil` | Covered | n/a | **Covered** |
| 3.2 | Properties of solids | `unit03/q2-lattice`, `unit06/q4-solids` (s1–s6 incl. `s6-polymers`), `q4-solids#e1` | Covered | n/a | **Covered** |
| 3.3 | Solids, liquids, and gases | `unit06/q1-states` (s1–s6), `q1-states#w` (added) | Covered | Covered | **Covered** |
| 3.4 | Ideal gas law, Dalton's law, mole fraction | `unit04/q1`–`q4`, `q1-knocks#w` (added), `q2-laws#w`, `q3-ideal#w`, `q4-mixtures#w`, `boss-compressor#w` | Covered | Covered | **Covered** |
| 3.5 | Kinetic molecular theory, Maxwell–Boltzmann | `unit04/q1-knocks` (s6–s7), `q5-speed` (s5) | Covered | Covered | **Covered** |
| 3.6 | Deviation from ideal gas law | `unit04/q6-real` (s1–s3) | Covered | n/a | **Covered** |
| 3.7 | Solutions and mixtures (`M = n/L`, dilution) | `unit06/q6-solution` (s2–s3, s6), `q6-solution#w`, `boss-undertow#w` (added) | Covered | Covered | **Covered** |
| 3.8 | Representations of solutions | `unit06/q6-solution` (s4, `q6-solution#0`) | Covered | n/a | **Covered** |
| 3.9 | Separation of solutions & mixtures | `unit06/q7-separate` (s1–s6), `q7-separate#w` | Covered | Covered | **Covered** |
| 3.10 | Solubility (like dissolves like) | `unit06/q6-solution` (s1, s5) | Covered | n/a | **Covered** |
| 3.11 | Spectroscopy & EM spectrum (MW/IR/UV-Vis) | `unit02/q9-absorb` (s6–s7 restored) | Covered | n/a | **Covered** |
| 3.12 | Photoelectric effect (`c = λν`, `E = hν`) | `unit02/q1-wave`, `q2-photon`, `q3-lines`, `#w` | Covered | Covered | **Covered** |
| 3.13 | Beer–Lambert law (`A = εbc`) | `unit02/q9-absorb` (s1–s4), `q9-absorb#w` | Covered | Covered | **Covered** |

### Unit 4: Chemical Reactions (4.1–4.9)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Introduction for reactions | `unit07/q3-change` (s1–s6) | Covered | n/a | **Covered** |
| 4.2 | Net ionic equations | `unit07/q4-balance`, `q5-ionic` (s1–s6) | Covered | n/a | **Covered** |
| 4.3 | Representations of reactions | `unit07/q4-balance` (s3), `q6-stoich` (s4) | Covered | n/a | **Covered** |
| 4.4 | Physical and chemical changes | `unit07/q3-change`, `unit06/q1-states`, `q2-grip` (s6) | Covered | n/a | **Covered** |
| 4.5 | Stoichiometry (mass, limiting, yield, gas) | `unit07/q6-stoich` (s1–s7), `q6-stoich#w`, `boss-golem#w`, `unit04/q3-ideal#5` | Covered | Covered | **Covered** |
| 4.6 | Introduction to titration | `unit07/q7-titrate` (s1–s5), `q7-titrate#w` | Covered | Covered | **Covered** |
| 4.7 | Types of chemical reactions | `unit07/q8-kinds` (s1–s7), `q5-ionic` | Covered | n/a | **Covered** |
| 4.8 | Introduction to acid-base reactions | `unit07/q8-kinds` (s4), `unit09/q1-handover` (s1–s4), `q1-handover#w` (added) | Covered | Covered | **Covered** |
| 4.9 | Oxidation-reduction reactions | `unit07/q8-kinds` (s5–s6, `#w`), `unit10/q1-halves` (s1–s7, `#w`) | Covered | Covered | **Covered** |

### Unit 5: Kinetics (5.1–5.11)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 5.1 | Reaction rates | `unit11/q1-watch` (s1–s6), `q1-watch#w` | Covered | Covered | **Covered** |
| 5.2 | Introduction to rate law | `unit11/q2-law` (s1–s5), `q2-law#w` | Covered | Covered | **Covered** |
| 5.3 | Concentration changes over time (0th/1st/2nd, `t½`) | `unit11/q3-time` (s1–s7), `q3-time#w`, `boss-flare#w` (added) | Covered | Covered | **Covered** |
| 5.4 | Elementary reactions | `unit11/q5-steps` (s4) | Covered | n/a | **Covered** |
| 5.5 | Collision model | `unit11/q4-collide` (s1–s4) | Covered | n/a | **Covered** |
| 5.6 | Reaction energy profile | `unit11/q4-collide` (s5–s9), `q4-collide#w`, `boss-flare#w` (added) | Covered | Covered | **Covered** |
| 5.7 | Introduction to reaction mechanisms | `unit11/q5-steps` (s1–s2) | Covered | n/a | **Covered** |
| 5.8 | Reaction mechanism and rate law | `unit11/q5-steps` (s3–s5) | Covered | n/a | **Covered** |
| 5.9 | Pre-equilibrium / steady-state approximation | `unit11/q5-steps` (s6, `#b2`) | Covered | n/a | **Covered** |
| 5.10 | Multistep reaction energy profile | `unit11/q5-steps` (s7), `q5-steps#w` | Covered | Covered | **Covered** |
| 5.11 | Catalysis | `unit11/q6-shortcut` (s1–s5), `q6-shortcut#w` | Covered | Covered | **Covered** |

### Unit 6: Thermochemistry (6.1–6.9)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Endothermic and exothermic processes | `unit05/q1-flow` (s4), `q3-enthalpy` (s1), `unit06/q6-solution` | Covered | n/a | **Covered** |
| 6.2 | Energy diagrams | `unit05/q1-flow#2`, `q3-enthalpy#5`, `unit11/q4-collide` | Covered | Covered | **Covered** |
| 6.3 | Heat transfer & thermal equilibrium | `unit05/q1-flow` (s1–s3), `q1-flow#w` | Covered | Covered | **Covered** |
| 6.4 | Heat capacity & calorimetry (`q = mcΔT`) | `unit05/q2-calorimetry` (s1–s5, `#w`, `#6`) | Covered | Covered | **Covered** |
| 6.5 | Energy of phase changes | `unit05/q2-calorimetry` (s6–s7), `unit06/q5-crossing` (s1–s5, `#w`) | Covered | Covered | **Covered** |
| 6.6 | Introduction to enthalpy of reaction | `unit05/q3-enthalpy` (s1–s6), `q3-enthalpy#w` | Covered | Covered | **Covered** |
| 6.7 | Bond enthalpies | `unit05/q4-bonds` (s1–s6), `q4-bonds#w` | Covered | Covered | **Covered** |
| 6.8 | Enthalpy of formation (`ΣΔHf°`) | `unit05/q5-hess` (s4, `#b2`, `#3`) | Covered | Covered | **Covered** |
| 6.9 | Hess's law | `unit05/q5-hess` (s1–s3), `q5-hess#w` | Covered | Covered | **Covered** |

### Unit 7: Equilibrium (7.1–7.12)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 7.1 | Introduction to equilibrium | `unit08/q1-both` (s1–s5) | Covered | n/a | **Covered** |
| 7.2 | Direction of reversible reactions | `unit08/q1-both` (s3, s5) | Covered | n/a | **Covered** |
| 7.3 | Reaction quotient & equilibrium constant (`Kc`, `Kp`) | `unit08/q2-k` (s2–s3), `q3-q` (s1–s5) | Covered | n/a | **Covered** |
| 7.4 | Calculating the equilibrium constant | `unit08/q2-k` (s4, `#w`), `q5-ice` (s5) | Covered | Covered | **Covered** |
| 7.5 | Magnitude of the equilibrium constant | `unit08/q2-k` (s5–s6) | Covered | n/a | **Covered** |
| 7.6 | Properties of the equilibrium constant | `unit08/q4-properties` (s1–s3, `#w`) | Covered | Covered | **Covered** |
| 7.7 | Calculating equilibrium concentrations (ICE, small-x) | `unit08/q5-ice` (s1–s5, `#w`) | Covered | Covered | **Covered** |
| 7.8 | Representations of equilibrium | `unit08/q1-both`, `q6-lean` (particle views) | Covered | n/a | **Covered** |
| 7.9 | Le Châtelier's principle | `unit08/q6-lean` (s1–s7), `boss-tipper` (s4) | Covered | n/a | **Covered** |
| 7.10 | Reaction quotient & Le Châtelier's principle | `unit08/q6-lean` (Q vs K) | Covered | n/a | **Covered** |
| 7.11 | Introduction to solubility equilibria (`Ksp`) | `unit08/q7-dissolve` (s1–s4, s6, `#w`), `q3-q#w` | Covered | Covered | **Covered** |
| 7.12 | Common-ion effect | `unit08/q7-dissolve` (s5, `#w`, `#b2`) | Covered | Covered | **Covered** |

### Unit 8: Acids and Bases (8.1–8.11)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 8.1 | Intro to acids/bases (`pH`, `pOH`, `Kw`, `T` dependence) | `unit09/q1-handover` (`#w` added), `q2-scale` (s1–s4, s7) | Covered | Covered | **Covered** |
| 8.2 | pH & pOH of strong acids and bases | `unit09/q2-scale` (s2–s6, s8, `#w`) | Covered | Covered | **Covered** |
| 8.3 | Weak acid & base equilibria (`Ka`, `Kb`, `%` ionization) | `unit09/q3-weak` (s1–s7, `#w`), `boss-leach#w` | Covered | Covered | **Covered** |
| 8.4 | Acid-base reactions & buffers | `unit09/q5-salts` (strong+strong `#w`, salt hydrolysis), `unit09/q7-buffer` (s8 `s8-half-equiv`), `q7-buffer#e2` | Covered | Covered | **Covered** |
| 8.5 | Acid-base titrations (curves, half-equiv, polyprotic) | `unit09/q6-titrate` (s1–s7, `#w`) | Covered | Covered | **Covered** |
| 8.6 | Molecular structure of acids & bases | `unit09/q4-structure` (s1–s6) | Covered | n/a | **Covered** |
| 8.7 | pH and `pKa` (predominant species, indicators) | `unit09/q8-capacity` (s1–s2), `q6-titrate` (s4) | Covered | Covered | **Covered** |
| 8.8 | Properties of buffers | `unit09/q7-buffer` (s1–s3, s6) | Covered | n/a | **Covered** |
| 8.9 | Henderson–Hasselbalch equation | `unit09/q7-buffer` (s4–s5, `#w`) | Covered | Covered | **Covered** |
| 8.10 | Buffer capacity | `unit09/q8-capacity` (s3–s6, `#w`) | Covered | Covered | **Covered** |
| 8.11 | pH and solubility | `unit09/q8-capacity` (s8 restored) | Covered | n/a | **Covered** |

### Unit 9: Thermodynamics and Electrochemistry (9.1–9.11)
| CED | Topic | Built Home | Qual | Quant | Verdict |
| --- | --- | --- | --- | --- | --- |
| 9.1 | Introduction to entropy | `unit05/q6-entropy` (s1–s4) | Covered | n/a | **Covered** |
| 9.2 | Absolute entropy & `ΔS°rxn = ΣS°` | `unit05/q6-entropy` (s5, `#w`) | Covered | Covered | **Covered** |
| 9.3 | Gibbs free energy (`ΔH − TΔS`, `ΣΔGf°`) | `unit05/q7-gibbs` (s2–s6 incl. `s6-formation`, `#w`, `#5`), `boss-crucible#w` | Covered | Covered | **Covered** |
| 9.4 | Thermodynamic and kinetic control | `unit05/q7-gibbs#4, #6`, `unit11/q4-collide` (s7) | Covered | n/a | **Covered** |
| 9.5 | Free energy and equilibrium (`K = e^(−ΔG°/RT)`) | `unit08/q8-free` (s1–s2, s6, `#w`) | Covered | Covered | **Covered** |
| 9.6 | Free energy of dissolution | `unit05/q7-gibbs` (s1), `boss-crucible#w`, `unit08/q8-free` (s3–s4) | Covered | Covered | **Covered** |
| 9.7 | Coupled reactions | `unit08/q8-free` (s5, `#b2`), `unit05/q7-gibbs#3, #7`, `unit10/q4-potential#e1` | Covered | Covered | **Covered** |
| 9.8 | Galvanic (voltaic) and electrolytic cells | `unit10/q3-galvanic` (`#w`), `q6-electrolysis` | Covered | Covered | **Covered** |
| 9.9 | Cell potential & free energy (`ΔG° = −nFE°`) | `unit10/q4-potential` (s1–s6, `#w`), `boss-clamp#w` (added) | Covered | Covered | **Covered** |
| 9.10 | Cell potential under nonstandard conditions (Nernst) | `unit10/q5-load` (s1–s6, `#w`) | Covered | Covered | **Covered** |
| 9.11 | Electrolysis and Faraday's law (`I = q/t`) | `unit10/q6-electrolysis` (s3–s4, s7, `#w`), `boss-clamp#w` (added) | Covered | Covered | **Covered** |
