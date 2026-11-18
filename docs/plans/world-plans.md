# Avalon Learn Track — Master World Plans & Build Records

This document is the authoritative master compilation of all world plans, curriculum designs, CED alignments,
tabletop kit architectures, and build records for the 14 worlds of the Avalon Learn Track.

> **2026-11-11:** the final teaching pass (`docs/teaching-pass/README.md`) may cut, merge and move stages and quests. The stage counts and bench lists below are from before the pass and are reconciled once, by its close-out session. `node tools/teaching-report.mjs all --totals` prints the current counts.

---

## 1. Curriculum Architecture & World Matrix

The Learn track is structured into 14 worlds in road order (`unit01` to `unit14`). Ten worlds are fully built and live,
comprising 85 quest modules, 75 benches, 10 bosses, and 552 tabletop stages. Every built world is unlocked from the start.

| Unit | World | Chemistry Domain | CED Focus | Quests | Stages | Tabletop Kit | Status | Primary Doc |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **01** | **Tallow** | Atoms, Elements, Mole | Unit 1 (1.1–1.4) | 6 + Boss | 47 | Atom kit (`atom.js`) | Live | `docs/plans/tallow-ligar-world.md` |
| **02** | **Lanternfall** | Light, Orbitals, Trends | Unit 1 (1.5–1.8), Unit 3 | 10 + Boss | 63 | Optics kit (`optics.js`) | Live | `docs/plans/lanternfall-world.md` |
| **03** | **Ligar** | Chemical Bonds, Lattices | Unit 2 (2.1–2.7) | 9 + Boss | 71 | Bond kit (`bond.js`) | Live | `docs/plans/tallow-ligar-world.md` |
| **04** | **Bellows** | Gases & Gas Laws | Unit 3 (3.4–3.6) | 6 + Boss | 40 | Gas kit (`gas.js`) | Live | `docs/plans/bellows-world.md` |
| **05** | **Ember Reach** | Thermochemistry | Unit 6 (6.1–6.9) | 7 + Boss | 42 | Heat kit (`heat.js`) | Live | `docs/plans/ember-reach-world.md` |
| **06** | **Mirrowen** | IMF, States, Solutions | Unit 3 (3.1–3.3, 3.7–3.10) | 7 + Boss | 54 | Matter kit (`matter.js`) | Live | `docs/plans/mirrowen-world.md` |
| **07** | **Kettle** | Chemical Reactions | Unit 4 (4.1–4.9) | 8 + Boss | 64 | Pot kit (`pot.js`) | Live | `docs/plans/kettle-world.md` |
| **08** | **Teeter** | Chemical Equilibrium | Unit 7 (7.1–7.13), 9.5 | 8 + Boss | 56 | Pans kit (`pans.js`) | Live | `docs/plans/teeter-world.md` |
| **09** | **Verdigris** | Acids & Bases | Unit 8 (8.1–8.11) | 8 + Boss | 65 | pH kit (`ph.js`) | Live | `docs/plans/verdigris-world.md` |
| **10** | **Brinewire** | Electrochemistry | Unit 9 (9.7–9.11), 4.9 | 6 + Boss | 50 | Cell kit (`cell.js`) | Live | `docs/plans/brinewire-world.md` |
| **11** | **Quicklight** | Kinetics & Rate Laws | Unit 5 (5.1–5.11) | Charted | — | Kinetic kit | Planned | `docs/plans/learn-quests.md` |
| **12** | **Lodestone** | Transition Metals | Beyond the exam | 6 + Boss | 46 | Lode kit (`lode.js`) | Live | `docs/plans/lodestone-world.md` |
| **13** | **Thornmere** | Organic & Polymers | Beyond the exam (touches 2.5–2.7, 3.1, 3.1.A.5, 3.2.A.7, 8.6) | 6 + Boss | 53 | Thorn kit (`thorn.js`) | Live | `docs/plans/thornmere-world.md` |
| **14** | **Cinder Halo** | Nuclear Chemistry | AP 5.3.A.5–5.3.A.6; the rest beyond the exam | 6 + Boss | 53 | Nuke kit (`nuke.js`) | Live | `docs/plans/cinderhalo-world.md` |

---

## 2. World Summaries & Engineering Contracts

### Unit 01: Tallow (Atoms, Elements, and the Mole)
- **Setting:** Industrial salt flats and an automated conveyor/evaporator processing line. The player walks along a mineral refinement plant.
- **Benches:** `q1-grain` (matter vs mixtures), `q2-core` (inside atoms, Thomson/Rutherford charges), `q3-catalogue` (periodic table organisation), `q4-ledger` (isotopes and mass spectrometer), `q5-assay` (atomic weight calculation), `q6-weigh` (discovery of the mole), and `boss-hopper`.
- **Core Teaching Click:** The mole is *discovered by weighing*, not handed down as a magic number. A balance weighs; it never divides.
- **Reference:** `docs/plans/tallow-ligar-world.md`

### Unit 02: Lanternfall (Light, Electron Spectra, and Orbitals)
- **Setting:** An aurora research expedition camped around a frozen lake with masts, detector arcs, spectrograph sleds, and cuvette rigs.
- **Benches:** `q1-wave` (wavelength & frequency), `q2-photon` (Planck energy), `q3-lines` (Bohr emission lines), `q4-cloud` (quantum probability clouds), `q5-numbers` (quantum numbers), `q6-filling` (Aufbau & Hund), `q7-pes` (Photoelectron Spectroscopy), `q8-trends` (atomic radii & ionization energy), `q9-absorb` (Beer-Lambert law), `q10-wavefunctions` (radial distribution), and `boss-eater`.
- **Core Teaching Click:** Real PES traces are drawn honest and flat; electrons are sorted into shells by binding energy.
- **Reference:** `docs/plans/lanternfall-world.md`

### Unit 03: Ligar (Chemical Bonds, Lattices, and Molecular Structure)
- **Setting:** A high-altitude quarry and mine complex. Tables are dressed in heavy quarry gear (iron collars, timber decks, rock specimens).
- **Benches:** `q1-joins` (sharing vs transferring electrons), `q2-lattice` (ionic crystal lattice energy), `q3-distance` (Morse curve and bond length), `q4-lewis` (Lewis dot diagrams), `q5-resonance` (formal charge & resonance), `q6-shapes` (VSEPR geometries), `q7-polarity` (bond dipoles and net vector dipole), `q8-hybrid` (sp/sp2/sp3 hybridization), `q9-orbitals` (sigma and pi bonding), and `boss-warden`.
- **Core Teaching Click:** Molecular shape is a 3D physical model that rotates; bond angles are verified by protractors.
- **Reference:** `docs/plans/tallow-ligar-world.md`

### Unit 04: Bellows (Gases, Gas Laws, and Kinetic Molecular Theory)
- **Setting:** An atmospheric compression plant with gas storage tanks, piston manifolds, and bleed valves.
- **Benches:** `q1-knocks` (pressure from particle collisions), `q2-laws` (Boyle, Charles, Avogadro relations), `q3-ideal` (PV = nRT), `q4-mixtures` (Dalton's law of partial pressures), `q5-kmt` (Maxwell-Boltzmann speed distributions), `q6-real` (van der Waals real gas deviations), and `boss-compressor`.
- **Core Teaching Click:** Pressure is the rate of momentum transfer from particle impacts; gas particles are simulated with live physics.
- **Reference:** `docs/plans/bellows-world.md`

### Unit 05: Ember Reach (Thermochemistry and Calorimetry)
- **Setting:** The inside cliff wall of a volcanic caldera stepping down 24 m in a four-ramp switchback road toward a lava lake, with six rock-cut geothermal galleries and a turbine hall at the foot.
- **Benches:** `q1-flux` (heat vs temperature), `q2-heat` (specific heat capacity q = mcΔT), `q3-calorimeter` (coffee-cup calorimetry), `q4-rxn` (enthalpy of chemical reaction), `q5-curve` (heating/cooling curves), `q6-hess` (Hess's law), `q7-bonds` (bond enthalpy calculations), and `boss-crucible`.
- **Core Teaching Click:** Live thermal motion and temperature curves. A calorimeter isolates exchange; heat released equals heat absorbed.
- **Reference:** `docs/plans/ember-reach-world.md`

### Unit 06: Mirrowen (Intermolecular Forces, States, and Solutions)
- **Setting:** A coastal frozen canal and ice basin. Automated dosing stations, vapour flasks, and separation columns.
- **Benches:** `q1-states` (particle spacing and compressibility), `q2-grip` (London dispersion, dipole-dipole, hydrogen bonding), `q3-boil` (vapour pressure and dynamic equilibrium), `q4-solids` (crystalline vs amorphous networks), `q5-crossing` (heating curves and phase change enthalpies), `q6-solution` (molarity, dilution, ionic dissolving), `q7-separate` (chromatography, distillation, filtration), and `boss-undertow`.
- **Core Teaching Click:** Molecules remain whole when melting or boiling; intermolecular forces act *between* molecules, not inside them.
- **Reference:** `docs/plans/mirrowen-world.md`

### Unit 07: Kettle (Chemical Reactions and Stoichiometry)
- **Setting:** One ironworks building on a soda flat, entered at the charge door and walked through to the furnace: a crane aisle with the bays opening off it on five floor levels, a slag tip and an ore stock outside (site rebuilt 2026-11-13, `kettle-world.md` section 11).
- **Benches:** `q1-recipe` (definite composition and limiting reactants), `q2-names` (naming ionic, molecular, and acid compounds), `q3-change` (physical vs chemical change, mass conservation), `q4-balance` (balancing reaction equations), `q5-ionic` (net ionic equations and solubility rules), `q6-stoich` (molar stoichiometry and gravimetric yield), `q7-titrate` (acid-base titration), `q8-kinds` (synthesis, decomposition, redox, combustion), and `boss-golem`.
- **Core Teaching Click:** Grams react in the ratio of moles and coefficients, never in the direct ratio of grams.
- **Reference:** `docs/plans/kettle-world.md`

### Unit 08: Teeter (Chemical Equilibrium)
- **Setting:** A west-facing hillside of salt terraces: five levels of brine pans held up by masonry walls, one stair straight down the fall line with a level dike branching off it on each terrace, and the benches in rooms dug into the terrace walls under the pans (two are weir houses standing up among them); the Tipper is fought on the drying floor at the bottom (site rebuilt 2026-11-16, `teeter-world.md` section 9).
- **Benches:** `q1-both` (forward and reverse rates reaching balance), `q2-k` (equilibrium constant K expression), `q3-q` (reaction quotient Q vs K), `q4-properties` (manipulating K values and Kp/Kc), `q5-calc` (RICE tables and equilibrium concentrations), `q6-lean` (Le Chatelier's principle: T, P, V, concentrations), `q7-dissolve` (solubility product Ksp), `q8-common` (common ion effect and precipitation), and `boss-tipper`.
- **Core Teaching Click:** Equilibrium is a dynamic balance where forward and reverse rates are equal, not a state where reactions have stopped.
- **Reference:** `docs/plans/teeter-world.md`

### Unit 09: Verdigris (Acids and Bases)
- **Setting:** A drowned masonry fort in a reed swamp, crossed on branching boardwalks; the benches are in the gatehouse's winch chamber, three tower chambers and the keep's hall up ramps from the boardwalk, and three cisterns down stairs below the water (site rebuilt 2026-11-16, `verdigris-world.md` section 8).
- **Benches:** `q1-handover` (Bronsted-Lowry proton transfer), `q2-scale` (pH, pOH, Kw, autoionization of water), `q3-weak` (weak acid Ka and weak base Kb), `q4-structure` (molecular structure effects on acid strength), `q5-salts` (acid-base properties of salt solutions), `q6-titrate` (titration curves: strong/weak, polyprotic), `q7-buffer` (buffer composition and Henderson-Hasselbalch), `q8-capacity` (buffer capacity and alpha-plots), and `boss-leach`.
- **Core Teaching Click:** Strong acids dissociate completely; weak acids establish an equilibrium. Buffers resist pH change via conjugate pairs.
- **Reference:** `docs/plans/verdigris-world.md`

### Unit 10: Brinewire (Electrochemistry)
- **Setting:** The copper marsh, crossed by a tidal barrage: a concrete wall with the marsh's brine impounded against its west face and a 12 m drop to the tailrace and the tidal flats on its east. The benches are in two gate houses off the crest road, three cell chambers in a gallery inside the wall, and the switchyard's cage at its foot (site rebuilt 2026-11-17; `docs/plans/brinewire-world.md` section 9).
- **Benches:** `q1-halves` (redox half-reactions and oxidation states), `q2-activity` (activity series and displacement reactions), `q3-galvanic` (galvanic cell construction, salt bridge, electrodes), `q4-potential` (standard cell potential E°cell and ΔG° = -nFE°), `q5-load` (cell potential under non-standard conditions, Nernst, concentration cells), `q6-electrolysis` (electrolytic cells, Faraday's law of electrolysis), and `boss-clamp`.
- **Core Teaching Click:** Voltage is energy per electron (intensive); a cell runs down until Q = K (E = 0), not until all reactants vanish.
- **Reference:** `docs/plans/brinewire-world.md`

### Unit 11: Quicklight (Kinetics)
- **Setting:** A refinery crammed onto a black lava field under a standing storm: a grid of alleys under pipe racks between packed process units, on a lower flow and, up one ramp through the upper flow's front, on the reactor plot. The benches are in the analyser bunker and the catalyst bunker (both sunk under banked earth), the control room, the pump cellar in the sunk tank bund, inside the cracking reactor's skirt and under the reactor train's table; lightning strikes the rod pylons (site rebuilt 2026-11-17; `docs/plans/quicklight-world.md` section 7).
- **Benches:** `q1-watch` (reaction rate from a concentration curve), `q2-law` (initial rates, orders, the rate law and k), `q3-time` (half-life and the straight-line plots), `q4-collide` (the collision model, activation energy, the Maxwell-Boltzmann tail), `q5-steps` (elementary steps, the rate-determining step, mechanisms), `q6-shortcut` (catalysts), and `boss-flare`.
- **Core Teaching Click:** Rate is how fast concentration changes; the slowest step sets it; a catalyst gives a path with a lower activation energy and comes out unchanged.
- **Reference:** `docs/plans/quicklight-world.md`

### Unit 12: Lodestone (Transition Metals)
- **Setting:** A slot canyon cut down through banded iron, walked from a scoured hollow at its head down eleven straight runs and ten bends to a round pothole where the Fifth's sorting magnet stands; each bench is in an alcove under the overhanging bed at the outside of a bend (site rebuilt 2026-11-14, `lodestone-world.md` section 7).
- **Benches:** `q1-dblock` (d-electron arrangements; ions lose 4s first), `q2-charges` (successive ionization energies, several charges), `q3-complex` (ligands, the coordinate bond, coordination number, chelates), `q4-shapes` (octahedral, tetrahedral, square planar; cis and trans), `q5-colour` (complementary colour, crystal field splitting), `q6-spin` (paramagnetism, high and low spin), and `boss-coil`.
- **Core Teaching Click:** The d electrons decide everything: which electrons leave, which charges form, what colour a complex is and whether a magnet pulls it.
- **Reference:** `docs/plans/lodestone-world.md`

---

## 2a. Site Rebuilds (2026-11-13)

The "Setting" lines above describe the sites as first built. Eleven of the twelve walkable sites are being rebuilt so that each
is a different landform with its benches housed inside it, as Ligar's are. The measurements, the standard, the per-world brief
(the signature table) and progress are in `docs/plans/world-distinction-plan.md`; the prompt for one world's rebuild is
`docs/world-rebuild-prompt.md`. A rebuilt world's "Setting" line is rewritten by its run.

---

## 3. Teaching Doctrine Across All Worlds

1. **Tabletop as the Answer:** Every stage is solved by arranging pieces, operating instruments, setting dials, or typing calculated numbers from physical measurements.
2. **Predict First, Test Second:** Commit a hypothesis before revealing an instrument or running a reaction. Predictions are never graded.
3. **No Unearned Terms:** Introduce real terminology with a one-clause gloss only when the concept has been seen. Glossaries are world-specific (`src/learn/glossary/<world>.js`).
4. **Self-Contained Evidence:** Everything needed to solve a stage exists on the bench or plate. No external lookup is required.
5. **Investigation, Not Grinding:** Learn track pays no XP and has no timers. Bosses test mastery across the unit's core ideas through five progressive phases.
6. **Vess Debrief Animations:** Each quest concludes with an animated 3–5 beat retrospective tying the discovery to the ongoing investigation into the Fifth Guild.
