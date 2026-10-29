# The Learn road: the quest plan

**Status (2026-10-29): Lanternfall, Ligar, Bellows and Ember Reach are built, with Kettle's first bench. The rest is planned.** (Written 2026-10-10 as "Lanternfall is built; the rest is planned"; AP numbers and gaps were re-checked on 2026-10-29, see `docs/AP-coverage-audit.md`.) The road was
reordered the same day (see "Done already" below), and all nine Lanternfall quests were
built that day with the ground to walk them on (`lanternfall-world.md` says what was built
and where it differs from this plan). This file plans every quest the Learn road still
needs, in two levels of detail:

- **Lanternfall and Ligar, stage by stage.** All nine quests of **Lanternfall**
  (world 2, `unit02`, light and electrons; BUILT) and Ligar's benches three to nine
  (world 3, `unit03`, bonding; still to build). Agreed with the user, and charted under the
  ids and titles below.
- **Every other world, as a proposal for the user to edit:** Bellows, Ember
  Reach, Mirrowen, Kettle, Teeter, Verdigris, Brinewire, Quicklight, Lodestone,
  Thornmere and Cinder Halo. Each quest has an eight-stage arc, the words it
  earns, its instrument and its AP topics (see "The rest of the road"). Except
  for Brinewire, these are **not charted yet**: their world files still hold the
  original four placeholder quests until the proposal is agreed.

Every rule in CLAUDE.md binds this plan, and these are the ones it leans on most:

- **Teach through play; discover, name, use, inside two stages.** Every stage
  below is something the player *does* with an instrument. The word arrives on
  that stage's reward card and is used plainly from the next stage on.
- **The evidence is on the bench.** Each stage table has an *Evidence* column.
  It says what the bench shows that lets a player who does not know the answer
  work it out. A stage whose evidence cell would read "hint rung 3" is a broken
  stage.
- **A prompt states the objective, never the route.** The prompts below are
  drafts in that form. Rung 1 of the hint ladder says which key to press.
- **Nothing blocks a correct answer.** No stage needs a key press before Commit.
  Where operating the instrument IS the answer (set a frequency, fill boxes),
  an untouched bench is a wrong answer with a reason, never a gate.
- **One briefing per quest**, on stage 1, at most two sentences, saying what the
  instrument is and what its tools do.
- **Encounter-first architecture (Phase 8).** Every quest is structured
  around who the player faces, what the foe holds, and why the chemical move beats
  them. The chemistry is not an abstract math problem; operating the instrument is
  the tactical action that resolves the field encounter. Every stage defines an
  `encounter` block, foe intent, objective, and chemical rationale.
- **Hints are one sentence each.** Rung 3 gives the method and never the
  number.
- **Reward cards are one to three sentences.**
- **No XP, ever.**

Decisions already made with the user (2026-10-10):

| Decision | Answer |
| --- | --- |
| Worlds unlocked? | Every built world is open. Quests inside a world still open in order. **Done.** |
| World ids | Renumbered to road order, now `unit01`…`unit14`. **Done.** |
| Ligar sites 3 and 4 (Batch House, Weighbridge) | Re-signed for `q3-distance` and `q4-dots`, unbuilt. **Done.** |
| AP scope | AP exam scope **plus** molecular orbital diagrams, quantum-number assignment, and the Cr/Cu Aufbau exceptions. These three are taught but marked as going beyond the exam on their cards and in their practice problems. |
| World 2 name | **Lanternfall** (aurora ice). Worlds 11 and 12 are **Lodestone** and **Thornmere**. |
| Beer–Lambert / spectroscopy | Lanternfall quest 9. |
| The mole | Moved to **Tallow** as its sixth bench, `unit01/q6-weigh`, because Bellows, Ember Reach and Mirrowen all need it. Its one ionic sample (NaCl, in "formula units") became CO₂, since Tallow comes before Ligar names the formula unit. **Done.** |
| The Same Recipe | Stays Kettle's first bench (`unit07/q1-recipe`). **Done.** |
| Electrochemistry | A world of its own: **Brinewire** (copper marsh), world 10, after Verdigris. Quicklight, Lodestone, Thornmere and Cinder Halo moved to 11–14. **Done** (charted). |
| Solutions / Ksp | Solutions in Mirrowen, solubility equilibria in Teeter, as AP lays them out. |
| Beyond-AP worlds | Lodestone, Thornmere and Cinder Halo go to intro depth, 5–6 quests each. |

---

## Done already (the reorder)

- `curriculum.js` registers fourteen worlds: Tallow, Lanternfall, Ligar,
  Bellows, Ember Reach, Mirrowen, Kettle, Teeter, Verdigris, Brinewire,
  Quicklight, Lodestone, Thornmere, Cinder Halo. The files are
  `worlds/unit01-atoms.js` … `unit14-nuclear-chemistry.js`.
- `progress.js`: `isWorldOpen` is `world.status === 'live'`. Quest order inside a
  world is unchanged.
- Ligar's `q3-recipe` moved to Kettle as `quests/unit07/q1-recipe.js`. At T4
  Kettle has no ground yet, so it builds its own room (the path Ligar used
  before it was walkable).
- Ligar's `q4-weigh` went to Kettle and then on to Tallow, as
  `quests/unit01/q6-weigh.js`. Stage 5 is now a mole of CO₂ (44.0 g), not NaCl.
  The Tallow debriefs were re-pointed: Atomic Mass now leads into the weigh
  bench, and the weigh bench leads into Lanternfall. **It has no site on
  Tallow's ground yet.** `verify-tallow` names it in a documented `SITE_PENDING`
  set. `learn-quest.js` plays any quest without a site, on a walkable world, as
  a built bench in its own room, the same path as Kettle's. The walk HUD's bench
  list still links it. **Laying site 6 is an open task**, and it should reuse
  the site-5 hopper gantry's builder, since both are the assay floor.
- Ligar's `q1-joins` and `q2-lattice` are now `quests/unit03/`. Sites 3 and 4 in
  `ligar.json` (and `tools/gen-ligar-layout.py`) name `q3-distance` and
  `q4-dots` with `built: false`.
- `verify-ligar` now requires a site for every **built** Ligar quest, not every
  charted one. `verify-bench` measures only the join bench on Ligar; the scope
  and the assay floor are measured on Tallow.
- Field Manual roads, commendations (`ligar_surveyed` now reads its quest list
  off the chart), the voyage hash and every verifier key follow the new ids.

---

## Decisions still open

1. **Element names and symbols.** (*Done as recommended: `q1-wave` stage 8's card, and symbols from there on.*) Tallow and Ligar label samples by catalogue
   code (`CAT 11`). Electron configurations, Lewis structures and molecular
   orbital diagrams cannot be written that way: "1s² 2s² 2p⁶ 3s¹" and "O=C=O"
   are the content. Neither can anything after Ligar: every later world is
   written in formulas (H₂O, NaCl, CH₃COOH). **Recommendation:** Lanternfall
   `q1-wave` stage 8's card says
   once that every catalogue code is an element with a name and a symbol
   (sodium, Na, CAT 11). From then on, Lanternfall and Ligar's new benches label
   by symbol and show the catalogue code beside it on the card only. The
   existing built benches are not touched. Ligar `q4-dots` stage 1's card then
   earns the **chemical formula** (subscripts as counts), and Kettle `q2-names`
   earns naming.
2. **Arriving out of order.** (*Done in part: every Lanternfall quest exports `BUILDS_ON`, `verify:learn` checks the entries are real built quests, and the quest page prints one linked line. The word-use check was not written.*) Worlds are open now, so a player can start Ligar
   `q8-hybrid` without ever having seen Lanternfall's *orbital*. The vocabulary
   checker assumes road order. **Recommendation:** each quest exports
   `BUILDS_ON: ['unit02/q4-cloud', …]`. The quest's page shows one line,
   "Builds on: Lanternfall · Orbitals", linked, and nothing is gated by it.
   `verify:learn` fails if a quest uses a word earned in another world without
   listing the quest that earns it. That makes the dependency visible and keeps
   the open road honest.
3. **Which world to build first.** (*Lanternfall, light bench first, as recommended.*) **Recommendation:** Lanternfall `q1`–`q3` and
   `q9` first, because one new instrument (the light bench) serves all four.
   Then Ligar `q3`–`q5`, because sites 3 and 4 are standing empty. See "Build
   order".
4. **Lanternfall as ground.** (*Built, because it was asked for outright; see `lanternfall-world.md`.*) A walkable aurora ice field is a project the size
   of Tallow or Ligar. **Recommendation:** build every quest as a page first. At
   T4 the built instruments build their own room, as Kettle's do now. Write a
   separate `lanternfall-world.md` when the quests are done.
5. **Ligar sites 5–9.** Seven new benches need five more sites on a world laid
   out for four. **Recommendation:** extend `gen-ligar-layout.py`, putting sites
   5–6 on the quarry floor beside the forge and 7–9 under the north arches.
   Re-run `verify:ligar`'s flood fill. Each sign is at most six words, so
   `Formal Charge and Resonance` will need a shorter title (`Resonance`) when its
   site is laid.

6. **Redox split.** Kettle `q8-kinds` earns oxidation, reduction and the
   oxidation number (AP 4.9). Brinewire starts at half-reactions.
   **Recommendation:** keep the split, because AP 4.9 sits in the reactions
   unit. The alternative is to move all of redox to Brinewire and leave Kettle
   at proton transfer.
7. **Ember Reach before Kettle.** Enthalpy of reaction needs balanced equations
   and formulas, which Kettle teaches two worlds later. **Recommendation:** Ember
   Reach supplies balanced equations and earns "coefficients count moles"
   locally. The alternative is to move Kettle's `q2-names` and `q4-balance` to
   the end of Ligar.
8. **Naming (`Kettle q2-names`).** Naming is not a CED topic, but every AP unit
   assumes it. **Recommendation:** keep it.
9. **Beyond-exam stages inside AP worlds.** These are: Graham's law, van der
   Waals, phase diagrams, colligative properties, Lewis acids, basic-solution
   redox, the Nernst equation, quantitative Arrhenius, cell notation, and Kp/Kc
   conversion. **Recommendation:** keep each as one labelled stage. Cut any you
   would rather leave out.
10. **Thornmere and the campaign.** The Charge Gardens already teaches
    mechanisms: nucleophile, SN1 and SN2. **Recommendation:** Thornmere teaches
    structure, naming, isomers, properties and reaction *types*, and its
    substitution card points to the Charge Gardens rather than re-teaching
    mechanisms.
11. **Quest and stage count.** The whole road comes to 97 quests and 776 stages.
    **Recommendation:** keep 8 stages as the norm, but allow 6 where a quest is
    a recap. Lodestone `q1` and Thornmere `q5` are candidates.
12. **Placeholder charts.** The original four-quest charts of Bellows, Ember
    Reach, Mirrowen, Kettle (`q2`–`q5`), Teeter, Verdigris, Quicklight,
    Lodestone, Thornmere and Cinder Halo get replaced by the proposal's quest
    ids once it is agreed. Brinewire is already charted from it.

---

## The instruments

Seven pieces of new work: five new instruments and two extensions. Each one
follows the existing engine contract. It is content-free. Every reading comes
from a **pure planner** over the stage's declaration, so the drawn bench (T3 and
below) and the built bench (T4) cannot disagree. It has a drawn canvas version
and a `*3d.js` built version that exposes the same API. It is registered in
`engine/instruments.js`. And it carries its own well-formedness check in
`verify:learn`.

| Instrument | File | New or reused | Serves |
| --- | --- | --- | --- |
| **Light bench** | `engine/lightbench.js` (+`lightbench3d.js`) | new | Lanternfall q1, q2, q3, q9 |
| **Cloud plate** | `engine/cloudplate.js` (+3d) | new | Lanternfall q4 |
| **Box rack** | `engine/boxrack.js` (+3d) | new, on the catalogue board's two-tap slot model | Lanternfall q5, q6; Ligar q9; later Lodestone |
| **Core bench, extended** | `engine/corebench.js` | extension: a `spectrum` field and a pull meter | Lanternfall q7, q8 |
| **Join bench, extended** | `engine/joinbench.js` | extension: a separation crank and an energy trace | Ligar q3 |
| **Pair board** | `engine/pairboard.js` (+3d) | new | Ligar q4, q5 |
| **Domain rig** | `engine/domainrig.js` (+3d) | new | Ligar q6, q7, q8 |

### Light bench (`lightbench.js`)

One bench with interchangeable heads, the way the join bench is one bench at two
scales. A **lamp** has a frequency dial (the `dial.js` knob, wavelength printed
beside it in nm) and a brightness dial. The light passes through a **slot** and
lands on a **screen**. The slot holds nothing, a gas tube, a filter, a metal
plate or a cuvette.

- **Trace head**: the wave drawn on a ruled screen, so a wavelength is measured
  against the ruler rather than told. Beside it, a **timing gate** counts crests
  passing per second. That count is the frequency.
- **Prism head**: the light spread into a band on a scale in nm. A hot filament
  gives an unbroken band. A gas tube gives bright lines. A cool gas in front of
  the filament gives dark lines.
- **Photocell head**: a metal plate in a vacuum tube, with a **counter** (how
  many electrons came off per second) and a **speed meter** (how fast the
  fastest one was moving).
- **Cuvette head**: a solution in a cuvette, a path-length selector (1, 2, 4 cm)
  and an **absorbance** readout. Also a region selector for microwave, infrared
  or UV/visible light, which animates what the molecule in the cuvette does.

Pure planners: `planTrace(freq)`, `planSpectrum(source)`,
`planPhotocell(metal, freq, brightness)`, `planAbsorb(solution, λ, pathCm)` and
`planRegion(molecule, region)`. Constants live in one table: h = 6.626 × 10⁻³⁴
J·s, c = 3.00 × 10⁸ m/s, and real line positions and work functions.

**Built (T4).** The flat-picture rule applies. The lamp, slot, tube and dials are
geometry; the trace and the spectrum are drawn on a raked screen.

### Cloud plate (`cloudplate.js`)

A probe that finds an electron's position once per shot and leaves a dot on a
plate. One shot is a dot. Five hundred shots are a cloud. Positions are
**sampled from the real hydrogen-like |ψ|²** for 1s, 2s, 2p (x, y, z), 3s, 3p and
3d (five), in a seeded generator so the verifier can reproduce any picture.
Tools: **Fire** (1, 50 or 500 shots), **Slice** (which plane the plate shows),
**Clear**, and a **ring view**. The ring view draws a de Broglie standing wave on
a circular track; the player turns a wavelength dial and the wave either joins
up with itself or cancels out.

Planners: `sampleOrbital(id, shots, seed)` and `ringFits(wavelength, radius)`.

**Built.** A real glass plate with the dots as an `InstancedMesh` in it. The 3D
picture is the point here, but every count is still read flat from the slice
view.

### Box rack (`boxrack.js`)

Orbital boxes laid out on an energy ladder, one row per subshell, higher energy
higher up. Each box takes up to two electrons, placed **two-tap, never by drag**:
pick up or down from a tray, then tap a box. This is the catalogue board's slot
model with a different layout. Readouts: electrons placed, unpaired count, and
the written configuration as the rack currently reads it. There is a **magnet**
tool: a sample with unpaired electrons is pulled toward it, and one with none is
pushed weakly away.

Layouts are declarations:

- `atomic` (1s up to 4p, with 4s set below 3d)
- `address` (each box labelled with n, l and mₗ, and each electron with mₛ;
  used by q5)
- `molecular` (two atom columns with σ and π, bonding and antibonding rows
  between them; used by Ligar q9; the declaration chooses the O₂/F₂ order or
  the B₂–N₂ order)

Planner: `readRack(layout, placed)` gives the configuration, unpaired count,
whether Pauli and Hund are obeyed, bond order (molecular layout) and magnet
response.

**Built.** A board on an easel like `catalogue3d.js`, with arrows as small
lifted tokens.

### Core bench, extended

Two additions to the Tallow instrument, which already knows protons, shells and
the needle.

- **`spectrum` field** (a fourth view, "Spectrum"): fire high-energy light and
  every electron is knocked loose. Each one lands on a strip graded in binding
  energy (MJ/mol, log scale), and the heights add up. Subshells are declared on
  the specimen (`rings: [[2], [2, 6], [1]]`), each with its binding energy from
  the real table below.
- **Pull meter**: tap an electron and read the pull on it, with a ruler for its
  distance and a gauge for the shielding charge between it and the core. Beside
  it, **ionize**: the existing stripper now reports the energy each strip cost.

Planners: `planPES(specimen)` and `planPull(specimen, electron)`, which use
Coulomb's law with Z_eff = Z − (core electrons).

### Join bench, extended

The pair plate gains a **separation crank**. The player winds the two atoms
apart or together. An **energy trace** screen plots energy against distance as
they go, using a Morse-shaped curve built from the pair's declared bond length
and bond energy (real values below). The well's bottom and depth are therefore
measurements on the screen. For ionic pairs, a **charge-and-size** readout shows
what the slab's lattice is held by.

Planner: `planCurve(pair)`.

### Pair board (`pairboard.js`)

The atoms of a molecule laid out on a slate, as symbols. In stages that ask for
it, the player picks which atom sits in the middle. Electron pairs come from a
tray holding exactly the molecule's valence electrons. A pair is placed between
two atoms (a bond; a second or third pair there makes a double or triple bond) or
on one atom (a lone pair). Two-tap, never drag. Each atom carries an **octet
lamp**: lit when it is surrounded by eight (two for H, lit amber at six for B,
and a stencilled "+" when it goes past eight). A **formal-charge** tool stencils
each atom's formal charge. A **bond-length gauge** reports measured lengths,
which are declared measurements because they are real data.

Planner: `planLewis(molecule, placed)` gives electrons used, octet state per
atom, formal charges and bond orders.

### Domain rig (`domainrig.js`)

A hub with sockets. The player clips on **arms**: a bond arm carrying an atom, or
a lone-pair balloon. The arms push apart and settle. A **protractor** reads any
angle by tapping two arms. The ideal geometries come from tables; lone-pair
compression uses real measured angles.

- **Field plates** (q7): two charged plates. A molecule whose dipoles do not
  cancel swings to line up. A **dipole arrow** tool draws each bond's arrow and
  their sum.
- **Mixer** (q8): the hub's s and p clouds are shown and blended into hybrid
  lobes along the arms. A **twist** tool tries to rotate one end about a bond:
  it turns freely or locks.

Planner: `planDomains(arms)` gives positions, angles, shape name, dipole sum and
hybridization.

**Built.** This is the one instrument whose output is a 3D shape, so like the
assay floor it is built rather than drawn on a screen. Every angle is read off
the protractor as a number, so nothing has to be judged from a picture. At T3
and below it is a canvas projection that turns with a drag, with the same
protractor.

---

## Real data the benches use

Every figure a stage grades against is real. The verifiers hold each quest's
declarations to these tables.

- **Hydrogen visible lines:** 656 nm (3→2), 486 (4→2), 434 (5→2), 410 (6→2).
  Bohr levels Eₙ = −2.18 × 10⁻¹⁸ J / n².
- **Other lines:** sodium 589 nm. Helium 588, 502, 447 nm. Neon has many lines,
  mostly 585–703 nm.
- **Work functions:** cesium 2.1 eV (threshold ≈ 590 nm), sodium 2.3 eV
  (≈ 540 nm), zinc 4.3 eV (≈ 290 nm, ultraviolet).
- **PES binding energies (MJ/mol):** H 1.31; He 2.37; Li 6.26 / 0.52;
  Be 11.5 / 0.90; B 19.3 / 1.36 / 0.80; C 28.6 / 1.72 / 1.09;
  N 39.6 / 2.45 / 1.40; O 52.6 / 3.12 / 1.31; F 67.2 / 3.88 / 1.68;
  Ne 84.0 / 4.68 / 2.08; Na 104 / 6.84 / 3.67 / 0.50.
- **First ionization energies (kJ/mol):** Li 520, Be 899, B 801, C 1086,
  N 1402, O 1314, F 1681, Ne 2081, Na 496, Mg 738, Al 578, K 419.
  Mg successive: 738, 1451, 7733.
- **Radii (pm):** Li 152, Be 112, B 85, C 77, N 75, O 73, F 72, Na 186, K 227.
  Ions: Na⁺ 102, Cl 99, Cl⁻ 181.
- **Pauling electronegativity:** H 2.20, C 2.55, N 3.04, O 3.44, F 3.98,
  Cl 3.16, Na 0.93, K 0.82.
- **Bond lengths (pm) and energies (kJ/mol):** H–H 74 / 436; Cl–Cl 199 / 242;
  C–C 154 / 348; C=C 134 / 614; C≡C 120 / 839; N≡N 110 / 945; O=O 121 / 498.
  Ozone's bonds are 128 pm.
- **Lattice energies (kJ/mol):** NaF 923, NaCl 787, KCl 715, MgO 3795.
- **Angles:** CH₄ 109.5°, NH₃ 107°, H₂O 104.5°.
- **Dipole moments (D):** CO₂ 0, H₂O 1.85, CHCl₃ 1.04, CCl₄ 0.
- **Molecular orbital bond orders:** H₂ 1, He₂ 0, N₂ 3, O₂ 2 (two unpaired),
  O₂⁺ 2.5, O₂⁻ 1.5, F₂ 1.
- **Absorption:** copper(II) sulfate solution is blue and absorbs near 630 nm.
  Permanganate is purple and absorbs near 525 nm.

---

## World 2 — Lanternfall (`unit02`, light and electrons)

Tallow left the player with electrons on rings at fixed distances and no reason
why. Lanternfall is the reason. It is an ice field under a permanent aurora,
and the sky is the first emission spectrum the player ever sees. Nine quests,
eight stages each.

**What it may assume:** everything Tallow taught (atom … mass number, periodic,
group, period, metal, nonmetal). **What it earns:** everything in the
`VOCABULARY` lines below, which become plain words for Ligar and after.

### q1-wave — Light as a Wave (light bench: trace and prism heads)

Briefing: *A lamp you can tune, a screen that draws its light as a wave, and a
prism that spreads it into colours.*

| # | Objective (draft prompt) | Evidence on the bench | Card names |
| --- | --- | --- | --- |
| 1 | Say what changes on the screen as the dial turns from red to violet. | Trace crests crowd together; the gate count rises. | wavelength, frequency |
| 2 | Find the lamp setting whose wavelength is twice Sample A's. | The ruler; the frequency halves as the length doubles. | (inverse relation) |
| 3 | Say how fast each of the three lamps' light travels. | Wavelength × count is the same 3.00 × 10⁸ m/s for every setting. | speed of light, c = λν |
| 4 | Give the frequency of a 600 nm lamp. | The gate on a 300 nm and a 500 nm lamp to check the method. | — |
| 5 | Order four lamps from lowest to highest frequency. | Prism positions and the gate. | visible spectrum |
| 6 | Say which detector responds to Sample B, which the eye cannot see. | IR and UV detector strips past the ends of the band. | electromagnetic spectrum |
| 7 | Match three sources (radio, microwave, X-ray) to their wavelengths. | A detector set ranging from metres to nanometres. | — |
| 8 | Name the elements in two lamps from their labels, and give each one's frequency. | Lamp labels now carry the element name and symbol. | element symbols (decision 1) |

`VOCABULARY`: wavelength 1, frequency 1, speed of light 3, visible spectrum 5,
electromagnetic spectrum 6.

### q2-photon — Photons (light bench: photocell head)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Get electrons off the plate. | Red at full brightness: counter 0. Violet at its dimmest: counter > 0. | (the puzzle) |
| 2 | Find the lowest frequency that frees any electron from this plate. | Sweep the dial; the counter wakes at one setting. | threshold frequency |
| 3 | Say what turning up brightness does above the threshold. | Count rises; speed meter unchanged. | photon |
| 4 | Say what raising the frequency does. | Speed rises; count unchanged. | photoelectric effect |
| 5 | Give the energy of one photon from a 500 nm lamp. | The plate's threshold, given in joules, is a worked check against the dial. | E = hν, Planck's constant |
| 6 | Order three plates (Cs, Na, Zn) by how hard they hold their electrons. | Three thresholds. | work function |
| 7 | Pick the lamp that frees electrons from zinc. | Zinc's threshold is in the UV; only the UV lamp crosses it. | — |
| 8 | Say why a brighter red lamp will never work on zinc. | Stages 3–7. | (light is both wave and particle) |

`VOCABULARY`: threshold frequency 2, photon 3, photoelectric 4, Planck's
constant 5, work function 6.

### q3-lines — Line Spectra (light bench: prism head, gas tubes; an energy-ladder plate)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say how the hot filament's light differs from the gas tube's. | Unbroken band against four bright lines. | continuous, line spectrum |
| 2 | Identify the gas in the sealed tube. | Its lines match one of three labelled reference tubes. | emission spectrum |
| 3 | Say what the cool gas in front of the filament does to it. | Dark lines at exactly the hydrogen tube's positions. | absorption spectrum |
| 4 | Say which jump on the ladder gives the red line. | The ladder plate lights the rung pair as each line is tapped. | energy level, ground and excited state |
| 5 | Give the energy of the 486 nm line. | The worked 656 nm line is on the plate. | ΔE = hν |
| 6 | Using the ladder formula, give the wavelength of the 5→2 jump. | The Eₙ table on the plate; 434 nm is on the screen to check against. | Bohr model |
| 7 | Say what happens to an electron given more than 2.18 × 10⁻¹⁸ J. | The top of the ladder is an open edge: the strip reads "gone". | ionization |
| 8 | Say why the ladder works for hydrogen but not for helium. | Helium's lines do not fit any spacing on the 1/n² ladder. | the model's limit |

`VOCABULARY`: line spectrum 1, emission 2, absorption 3, energy level / ground
state / excited state 4, Bohr 6.

### q4-cloud — Orbitals (cloud plate)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say where Sample A's electron is. | One shot is a dot in one place; fifty shots are somewhere else. | (probability) |
| 2 | Describe the shape after 500 shots. | A round, fuzzy cloud, densest at the middle. | orbital |
| 3 | Pick the wavelengths that fit on the ring. | The ring view joins up only at whole numbers of waves. | standing wave, wave–particle duality |
| 4 | Compare Sample A's cloud with Sample B's. | 2s is bigger and has an empty shell: no dots at one radius. | node; size grows with n |
| 5 | Describe Sample C's shape and where it has no dots. | Two lobes, empty plane through the middle. | p orbital |
| 6 | Say how many ways the p shape can point. | Slice x, y, z: three. | the three p orbitals |
| 7 | Sort five clouds by shape. | Four-lobed and ring-and-dumbbell pictures. | d orbitals |
| 8 | Say why the bench never draws a path for the electron. | Stage 1, plus a "track" tool that refuses (position and speed both). | uncertainty principle |

`VOCABULARY`: orbital 2, wave–particle duality 3, node 4, p orbital 5, d orbital
7, uncertainty principle 8. (*s orbital* is named on card 5 beside *p*, because
s is meaningless without a second shape to compare.)

### q5-numbers — Quantum Numbers (box rack, `address` layout) — beyond the exam

The card on stage 1 says plainly that the AP exam does not assess this bench.

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say what the first number on every box tracks. | Box rows labelled 1, 2, 3; clouds from q4 shown beside them grow. | principal quantum number n |
| 2 | Say which shapes the n = 2 row offers. | The rack shows the l values allowed for each n. | angular momentum number l |
| 3 | Say how many boxes a d row has. | mₗ runs −l…+l: count. | magnetic number mₗ |
| 4 | Put two electrons in one box. | Up and down are accepted; a second "up" is refused by the rack. | spin, mₛ |
| 5 | Find the illegal set among four labelled electrons. | Two of them share all four numbers. | Pauli exclusion principle |
| 6 | Say how many electrons the n = 3 shell holds. | Fill it. | 2n² |
| 7 | Give the four numbers of the last electron in Sample A (nitrogen). | Fill the rack. | — |
| 8 | Say which of three sets cannot exist and why. | l = n, mₗ outside ±l. | — |

`VOCABULARY`: principal 1, angular momentum 2, magnetic 3, spin 4, Pauli 5.

### q6-filling — Electron Configuration (box rack, `atomic` layout; magnet)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Place carbon's six electrons. | Energy ladder: lower rows first. | aufbau principle |
| 2 | Say how carbon's two p electrons sit. | Magnet: carbon is pulled, so two unpaired. | Hund's rule, paramagnetic |
| 3 | Write the configuration the rack reads for oxygen. | The rack's own readout format. | electron configuration |
| 4 | Fill potassium's 19th electron. | 4s sits below 3d on the ladder. | — |
| 5 | Write iron's configuration in short form. | A noble-gas core key collapses filled rows. | noble gas notation |
| 6 | Sort six elements into s, p, d and f blocks. | Last box filled. | blocks of the periodic table |
| 7 | Remove two electrons from iron. | The ladder for an ion: 4s empties first (and the magnet agrees). | transition metal ions |
| 8 | Fill chromium, then say why the rack's reading differs from the rule. | Measured magnet response: six unpaired. | Cr and Cu exceptions (beyond the exam) |

`VOCABULARY`: aufbau 1, Hund 2, paramagnetic/diamagnetic 2, configuration 3,
noble-gas notation 5, block 6.

> **Built differently (audit 2026-10-29).** The built quest has five stages (carbon, oxygen, potassium predict and test, scandium). Stage 7 above, the configuration of an ion, was cut, and CED 1.5.A asks for "an atom or its ions". Restore it as a stage or, at the least, as two practice items (Cl⁻, Fe³⁺; 4s empties first).

### q7-pes — Photoelectron Spectroscopy (core bench, `spectrum` field)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say what the two peaks of Sample A (helium vs hydrogen) say. | Same position class, helium's peak twice as tall and further right. | photoelectron spectrum |
| 2 | Say what the height of a peak counts. | Heights 1 and 2 against known electron counts. | — |
| 3 | Say why lithium has a peak far to the left. | Rings view: one electron on the second ring. | binding energy |
| 4 | Say why boron's second shell shows two peaks. | Peaks of height 2 and 1 at 1.36 and 0.80. | subshells 2s and 2p |
| 5 | Identify sealed Sample B from its spectrum. | Heights 2, 2, 4 → oxygen. | — |
| 6 | Say why neon's 1s peak sits further right than fluorine's. | Proton counts on the core view. | — |
| 7 | Match three spectra to Na, Mg and Al. | Height of the last peak. | — |
| 8 | Write the configuration that sealed Sample C's spectrum shows. | Read it off the peaks. | (the spectrum is the configuration) |

`VOCABULARY`: photoelectron spectrum 1, binding energy 3, subshell 4.

### q8-trends — Periodic Trends (core bench, pull meter and ionizer)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say what makes the pull on an electron stronger. | Pull meter on four specimens: more charge, closer distance. | Coulomb's law |
| 2 | Say why sodium's outer electron feels a pull of about +1, not +11. | Shielding gauge shows ten core electrons. | shielding, effective nuclear charge |
| 3 | Order Li, Be, B, C by radius. | Ruler; pull meter. | atomic radius |
| 4 | Say why K is bigger than Na. | Ring count. | — |
| 5 | Order Na⁺, Na and Cl⁻ by size. | Strip one, add one; the ruler. | ionic radius |
| 6 | Order Li, Be, B by ionization energy, and say why B breaks the pattern. | Ionizer readouts: 520, 899, 801; B's electron is in 2p. | ionization energy |
| 7 | Say which charge magnesium takes. | Successive strips: 738, 1451, then 7733. | successive ionization energies |
| 8 | Order four atoms by how hard they pull a shared pair. | Pull meter from outside the atom. | electronegativity, electron affinity |

`VOCABULARY`: Coulomb's law 1, shielding / effective nuclear charge 2, atomic
radius 3, ionic radius 5, ionization energy 6, electronegativity 8.

> **Built differently, and a gap (audit 2026-10-29).** The built quest has five stages and dropped stages 7 and 8 above; its header says electronegativity and electron affinity "go to the Drill Deck", but none of its five practice items contain either term. CED 1.7.A.2 lists both, with ionization energy and radii. Restore them: either stage 8 as drafted (pull on a shared pair; electron affinity as the energy change on adding an electron) or three practice items covering the trend across a period and down a group. Ligar `q7` stage 1 meets electronegativity only as a printed difference on a card.

### q9-absorb — Spectroscopy (light bench, cuvette head)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say what each kind of light does to the molecule in the cuvette. | Region selector: microwave spins it, IR stretches and bends it, UV/visible moves an electron. | molecular spectroscopy |
| 2 | Match three readings to the light that caused them. | Stage 1. | — |
| 3 | Say why the copper solution looks blue. | Prism head after the cuvette: orange is missing. | complementary colour |
| 4 | Pick the best wavelength to measure this solution at. | Sweep: the absorbance peak. | absorbance |
| 5 | Say what doubling the concentration does to the absorbance. | Three cuvettes. | — |
| 6 | Say what doubling the path does. | Path selector. | — |
| 7 | Write the rule connecting absorbance, path and concentration. | Stages 5–6. | Beer–Lambert law, A = εbc |
| 8 | Find the concentration of the sealed sample. | Calibration line drawn from three standards. | calibration curve |

`VOCABULARY`: absorbance 4, Beer–Lambert 7, calibration curve 8.

---

## World 3 — Ligar, benches three to nine (`unit03`)

**BUILT 2026-10-10.** What follows is the plan the benches were built from, kept as the
record. Where the build parted from it (HOF for HCN in `q4-dots`, a separate bond bench
instead of a join-bench crank, three polarity plates not six, `q5-resonance` retitled
*Charge and Resonance*) is listed in `ligar-complete.md`.

Benches one and two (`q1-joins`, `q2-lattice`) are built and unchanged. They
earn bond, ionic, covalent, double/triple bond, melting point, lattice, brittle, conduct and formula unit. What follows assumes
those words and Lanternfall's. *Lone pair* is withheld through `q1-joins` and
never earned there; `q4-dots` earns it on its first card.

### q3-distance — Bond Energy (join bench, crank and energy trace) — site 3, Batch House

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Find the distance at which two H atoms are happiest. | Wind the crank; the trace has a bottom. | potential energy curve, bond length |
| 2 | Give the energy it takes to pull the pair fully apart. | The well's depth. | bond energy |
| 3 | Say what happens when they are pushed closer than that. | The trace climbs steeply. | (nuclei repel) |
| 4 | Say why Cl₂'s bottom sits further out than H₂'s. | Ring counts on the two atoms. | — |
| 5 | Order the carbon–carbon single, double and triple bonds by length. | Three plates. | bond order |
| 6 | Say how bond length and bond energy are related. | Stage 5's three wells. | — |
| 7 | Order NaCl, KCl and MgO by how strongly their lattice holds. | Charge-and-size readout. | lattice energy |
| 8 | Predict which of NaF and NaCl melts higher. | Stage 7 and q2-lattice's furnace. | — |

### q4-dots — Lewis Structures (pair board) — site 4, Weighbridge

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Place every pair water has. | The tray holds exactly 8 electrons; octet lamps. | Lewis structure, lone pair |
| 2 | Say how many electrons the tray will hold for CH₄, NH₃ and HF. | Valence electrons on each card. | — |
| 3 | Draw CO₂ so every lamp is lit. | Two pairs short with single bonds: the lamps stay dark. | — |
| 4 | Pick the middle atom for HCN. | H takes one pair only; C has the most room. | central atom |
| 5 | Draw the ammonium ion. | The tray changes when the charge is set. | polyatomic ion |
| 6 | Draw BF₃ and say why boron's lamp stays amber. | Fluorine will not share a second pair. | incomplete octet |
| 7 | Draw NO. | An odd number of electrons in the tray. | free radical |
| 8 | Draw SF₆. | Sulfur's lamp shows "+": room past eight on the third ring. | expanded octet |

### q5-resonance — Formal Charge and Resonance (pair board, formal charge and bond-length gauge)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Find the atom in drawing A that "owns" one electron too few. | Formal-charge tool. | formal charge |
| 2 | Pick the better of two drawings of CO₂. | Formal charges of 0 everywhere vs ±1. | — |
| 3 | Pick the better of two drawings of SCN⁻. | Negative charge on the atom that pulls hardest. | — |
| 4 | Draw ozone, then read its two bond lengths. | Both 128 pm, between single and double. | resonance |
| 5 | Draw every arrangement of nitrate's double bond. | Three placements; the gauge reads all three bonds equal. | resonance structures |
| 6 | Give the order of each nitrate bond. | 4 pairs over 3 bonds. | fractional bond order |
| 7 | Say which of carbonate's drawings contributes most. | They are identical. | delocalized electrons |
| 8 | Say why water has no resonance. | No double bond to move. | — |

### q6-shape — Molecular Shape (domain rig)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say the angle between two arms on the hub. | Protractor: 180°. | electron domain, linear |
| 2 | Add a third, then a fourth arm, and read the angles. | 120°, then 109.5°, and the fourth pops out of the plane. | trigonal planar, tetrahedral, VSEPR |
| 3 | Build NH₃ and say its shape. | A lone-pair balloon is a domain you cannot see in the shape. | trigonal pyramidal |
| 4 | Build H₂O and say its angle. | 104.5°; NH₃ 107°; CH₄ 109.5°. | bent; lone pairs push harder |
| 5 | Build CO₂ and say how many domains its double bonds take. | Two arms, 180°. | (a multiple bond is one domain) |
| 6 | Build PCl₅ and then SF₄. | Five domains; a lone pair goes on the equator. | trigonal bipyramidal, seesaw |
| 7 | Build SF₆ and XeF₄. | Six domains; two lone pairs go opposite. | octahedral, square planar |
| 8 | Name the shapes of three molecules from their Lewis structures. | Build each. | electron vs molecular geometry |

### q7-polarity — Polarity (domain rig, field plates and dipole arrows)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say which end of the H–Cl bond is negative. | Electronegativity card: Cl 3.16 vs H 2.20. | partial charge, polar bond |
| 2 | Sort H–H, H–Cl and Na–Cl by how unevenly they share. | Electronegativity differences. | nonpolar / polar / ionic |
| 3 | Say whether CO₂ turns between the plates. | It does not, despite two polar bonds. | molecular dipole |
| 4 | Say why H₂O turns and CO₂ does not. | Dipole arrows add up for the bent molecule and cancel for the straight one. | — |
| 5 | Compare CCl₄ and CHCl₃ in the field. | One H breaks the symmetry. | — |
| 6 | Say whether NH₃ and BF₃ turn. | The lone pair. | — |
| 7 | Sort six molecules into polar and nonpolar. | The field. | — |
| 8 | Pick the liquid a charged rod will bend. | Stage 7. | (into IMFs, Mirrowen) |

### q8-hybrid — Hybridization (domain rig, mixer and twist)

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say how many bonds carbon's rack (q6) predicts, and how many CH₄ has. | Two unpaired electrons, but four identical bonds. | (the puzzle) |
| 2 | Mix carbon's orbitals to match four identical arms. | The mixer gives four lobes at 109.5°. | hybrid orbital, sp³ |
| 3 | Mix for three arms. | Three lobes at 120° and one p left over. | sp² |
| 4 | Mix for two arms. | Two lobes and two p orbitals. | sp |
| 5 | Say how ethene's second bond is built. | The leftover p lobes overlap side to side. | sigma and pi bonds |
| 6 | Count the sigma and pi bonds in HCN. | Lewis structure plus the mixer. | — |
| 7 | Twist ethane, then ethene. | One turns freely; the other locks. | restricted rotation |
| 8 | Name the hybridization at the centre of PCl₅ and SF₆. | Five and six domains. | sp³d, sp³d² (beyond the exam) |

### q9-orbitals — Molecular Orbitals (box rack, `molecular` layout; magnet) — beyond the exam

| # | Objective | Evidence | Card names |
| --- | --- | --- | --- |
| 1 | Say where the two H 1s boxes go when they combine. | One row below, one above. | bonding, antibonding orbital |
| 2 | Fill H₂. | Both electrons in the lower box. | — |
| 3 | Fill He₂ and say why it does not exist. | Two below, two above: no net gain. | bond order |
| 4 | Give N₂'s bond order. | Fill the rack. | — |
| 5 | Fill O₂, then hold it to the magnet. | Two unpaired electrons in π*; it is pulled. | (Lewis cannot explain this) |
| 6 | Order O₂⁺, O₂ and O₂⁻ by bond length. | Bond orders 2.5, 2 and 1.5. | — |
| 7 | Say why F₂ is weaker than O₂. | Bond order 1. | — |
| 8 | Fill B₂ with the other layout and say why it is magnetic. | σ/π order switch below N₂. | (the order switch) |

---

## The rest of the road (proposal, for the user to edit)

Eleven worlds, 72 new quests, eight stages each. Every quest below follows the same
rules as Lanternfall and Ligar above. It is written more compactly so it is
easier to edit:

- Each numbered line is one stage: **the objective** (a draft prompt), then
  *the evidence on the bench* in italics, then → **the word its reward card
  earns** in bold. A stage with no arrow earns no new word: it uses the last
  one.
- `(beyond the exam)` marks content outside the current AP CED. It is taught,
  labelled on its card, and kept out of the AP-style practice problems unless
  labelled there too.
- **CED** gives the AP Course and Exam Description topics the quest covers. They
  are numbered from the current CED (rechecked 2026-10-29: 7.1 to 7.12, 8.1 to 8.11, 9.1 to 9.11). "AP coverage" at the end maps every CED topic to a
  quest.
- Stage 8 of almost every quest is a **sealed sample**: the whole quest at
  once, with nothing labelled. That is the pattern every built quest already
  ends on.

### Road-wide dependencies

The road is not in AP's unit order, so some worlds come before the ideas they
use. Each case is handled locally, and listed here so it stays visible:

- **Ember Reach (5) comes before Kettle (7)**, and its enthalpy of reaction
  needs balanced equations. Ember Reach supplies every equation already
  balanced. Its `q3-enthalpy` stage 2 card earns, locally, "the coefficients in
  a balanced equation count moles". Balancing is Kettle `q4-balance`'s job. (See
  decision 7 for the alternative.)
- **Bellows (4) comes before Mirrowen (6).** Bellows `q6-real` says in plain
  words that molecules attract one another a little; Mirrowen `q2-grip` names
  the kinds. Gas collected over water (which needs vapor pressure) is held back
  for Mirrowen `q3-boil`.
- **ΔG is earned in Ember Reach, and its links are paid later:** ΔG° and K in
  Teeter `q8-free`, ΔG° and E° in Brinewire `q4-potential`.
- **Kettle `q8-kinds` introduces proton transfer and electron transfer** (AP 4.8
  and 4.9) as kinds of reaction. Verdigris and Brinewire build on that.
- **Quicklight (11) comes after Teeter (8).** Teeter says "the two rates are
  equal" qualitatively; Quicklight `q7-shortcut` closes the loop (a catalyst
  does not move K).
- **Cinder Halo `q4-halflife`** leans on Quicklight `q3-time`'s first-order
  half-life.
- **Formulas and names.** Every world from Bellows on is written in formulas.
  See decision 1 (symbols in Lanternfall, formulas in Ligar `q4-dots`) and
  Kettle `q2-names` (naming).

### New instruments for the rest of the road

Same contract as above: content-free, pure planners, drawn and built versions
with one API, and declarations checked by `verify:learn`.

| Instrument | File | Serves | Notes |
| --- | --- | --- | --- |
| **Gas rig** | `gasrig.js` | Bellows (all); Mirrowen q3 | A cylinder and piston, a pressure gauge with an atm/kPa/mmHg ring, a thermometer with a heater and cooler, and a charging valve fed from the assay hopper, so gas is metered in moles by weighing. A particle window has a knock counter on one wall. Extra heads: a second tank with a joining valve, a speed screen, a pinhole, a vapour manometer. Planner `planGas` (ideal; van der Waals with real a, b for q6). |
| **Calorimeter** | `calorimeter.js` | Ember Reach q1–q3; Mirrowen q5 | A lidded cup, stirrer and thermometer trace, a heater with a joule counter, tongs for hot metal blocks, and a reaction port. |
| **Arrangement box** | head on the calorimeter | Ember Reach q6 | Particles in cells, with a counter of the ways they could be arranged. |
| **Favourability plotter** | screen | Ember Reach q7; Teeter q8 | ΔG plotted against T, with the crossing marked. |
| **The pot** | `pot.js` | Kettle q3–q8; Thornmere q6 | A reaction vessel with a particle window that counts every atom before and after. Also a balance (the assay balance), filter and drying oven, conductivity lamp, gas tests (glowing splint, lit splint, limewater) and a **burette head**. |
| **Flask bench** | `flaskbench.js` | Mirrowen q6–q7 | Volumetric flasks, a pipette, a balance and a particle window, plus a chromatography strip (solvent choice) and a distillation column. |
| **The pans** | `pans.js` | Teeter (all) | A vessel with a particle window, forward and reverse counters per second, and a concentration–time plotter. A **Q/K gauge** has a needle against a fixed K line. Stress keys: add, remove, squeeze, heat, catalyst, inert gas. Also an ICE board and a solubility beaker with ion meters. |
| **pH bench** | `phbench.js` | Verdigris (all) | A pH meter, the pot's burette head and a titration-curve plotter. A particle window counts H₃O⁺, OH⁻, HA and A⁻. Also an indicator rack and a buffer flask. |
| **Cell bench** | `cellbench.js` | Brinewire (all); Lodestone q5 | Two half-cell beakers, an electrode rack (Zn, Cu, Ag, Fe, Mg, Pb, graphite), a salt bridge, and a wire with a voltmeter and ammeter that shows electron flow. Ions move in the bridge. Also a power supply with a timer, and the assay balance to weigh electrodes. |
| **Rate bench** | `ratebench.js` | Quicklight (all) | A flask with a concentration probe. Its plotter has `[A]`, `ln[A]` and `1/[A]` keys. Also a stopwatch, an initial-rates log, a temperature bath and an energy-profile screen. The collision stages reuse the **Charge Gardens chamber** (`quest3d/`), where orientation is already the lesson. |
| **Detector bench** | `detector.js` | Cinder Halo (all) | A sample stand, a counter (count rate, clicks), a shield rack (paper, aluminium, lead), deflection plates, and a precision balance for mass defect. |

**Reused, not rebuilt:**
- the **catalogue board's** two-tap card layout: Hess cards, naming boards,
  reaction sorting, mechanism steps, the N–Z chart
- the **join bench crank** (Ligar q3): Ember Reach bond enthalpies, Mirrowen's
  grip probe
- the **domain rig**: complex-ion geometry, Thornmere's model kit
- the **box rack**: a `crystal-field` layout for Lodestone
- the **light bench**: colour of complexes, optical activity
- the **core bench**: a decaying population for half-life
- the **assay balance**: everywhere a mass is the measurement

---

### World 4 — Bellows (`unit04`, gases): 6 quests

> **BUILT (2026-10-10).** All six benches, the gas rig and the Compressor boss are live, and Bellows is walkable ground at T4. The stages below are the plan; what was built, and every place it differs, is in `bellows-world.md`.

#### `q1-knocks` · Pressure and Temperature · CED 3.5 · gas rig
1. Say what the gauge is measuring. *The knock counter on the wall rises and falls with the needle.* → **pressure**
2. Say what doubling the gas in the cylinder does to the reading. *Charge the valve; twice the knocks.*
3. Say what heating does to the particles. *They move faster and hit harder and more often.* → **kinetic energy** (temperature measures its average)
4. Say why the particles do not all move at one speed. *Speed screen: a spread with a peak.* → **Maxwell–Boltzmann distribution**
5. Compare a light gas and a heavy gas at one temperature. *Heavy ones are slower; the average-energy readout is identical.*
6. Read one pressure in three units. *Gauge ring.* → **atm, kPa, mmHg**
7. Find the temperature at which the pressure would reach zero. *Cool, plot P against T, extend the line to −273 °C.* → **absolute zero, kelvin**
8. Say which of four statements about gas particles the bench has shown to be true. → **kinetic molecular theory**

#### `q2-laws` · The Gas Laws · CED 3.4 · gas rig
1. Halve the volume at fixed temperature and say what the pressure does. → **Boyle's law**
2. Say why, from the knocks. *Same particles, half the room, twice the wall hits.*
3. Heat at fixed pressure and say what the piston does. *V against T(K) is a straight line through zero.* → **Charles's law**
4. Say why the line only passes through zero in kelvin. *The same data plotted in °C does not.*
5. Heat a sealed rigid tank. → **Gay-Lussac's law**
6. Add gas at fixed temperature and pressure. *Volume grows in proportion.* → **Avogadro's law**
7. Change P, V and T at once and predict the new volume. → **combined gas law**
8. Match four gauge records to the quantity held fixed in each.

#### `q3-ideal` · The Ideal Gas Law · CED 3.4 · gas rig, assay balance
1. Meter one mole into the cylinder at 0 °C and 1 atm and read the volume. → **molar volume**
2. Find the one number PV/nT gives for every reading. → **gas constant R**, **PV = nRT**
3. Find how many moles a sealed tank holds.
4. Pick the R that matches a kPa gauge. *Two values of R on the plate.*
5. Weigh a tank of unknown gas and name it. *Mass over moles gives the molar mass.*
6. Find a gas's density at set conditions.
7. A reaction in the cylinder gives off a gas: find its volume. *The balanced equation is supplied.* (**Cut in the build**; the Bellows quest has no gas stoichiometry. It now lives in Kettle `q6` stage 5, CED 4.5.A.3.)
8. Say why every gas has the same molar volume. *Particle volume is negligible against the space.*

#### `q4-mixtures` · Partial Pressures · CED 3.4 · gas rig, second tank
1. Join two tanks and say what the gauge reads. *The sum.* → **partial pressure**, **Dalton's law**
2. Say how hard each gas pushes. *Per-gas knock counters: each as if alone.*
3. Find one gas's share of the moles. → **mole fraction**
4. Find a partial pressure from mole fraction and total pressure.
5. Find oxygen's partial pressure at altitude.
6. Add a gas that reacts with nothing to a fixed tank. *Every other partial pressure stays where it was.*
7. Rank three gases in a mixture by partial pressure from their counts.
8. Sealed tank: find the moles of each gas from the gauge readings.

#### `q5-speed` · Speed and Escape · CED 3.5 · gas rig, speed screen, pinhole

> **Scope (audit 2026-10-29).** The CED has only KE = ½mv² and the Maxwell–Boltzmann picture (3.5). Effusion, diffusion, Graham's law and root-mean-square speed (stages 4 to 8, as built) are not on the exam. Label those cards and practice items "beyond the exam", not only stage 5.
1. Heat the gas and describe what the speed screen does. *The peak moves right and flattens.*
2. Compare He, N₂ and CO₂ at one temperature. *Lighter is faster.*
3. Say what fraction of particles clears a speed bar at two temperatures. *Tail area* (a preview of activation energy).
4. Open a pinhole and compare how fast two gases leak. → **effusion**
5. Find the ratio of leak rates for H₂ and O₂. → **Graham's law** (beyond the exam)
6. Identify an unknown gas from its leak rate against a reference.
7. Release a gas at one end and say why it takes time to cross. → **diffusion**
8. Say which of two gases reaches the far end first.

#### `q6-real` · Real Gases · CED 3.6 · gas rig, squeeze and deep cold
1. Squeeze hard and read PV/nRT. *It drifts above 1; the particles' own volume is drawn.*
2. Say what the particles' size does at high pressure.
3. Cool until the gas is nearly condensing and read PV/nRT. *Below 1; particles linger near each other.*
4. Say what the pull between particles does at low temperature. → **ideal gas, real gas**
5. Rank He, N₂ and NH₃ by deviation at the same conditions.
6. Pick the conditions under which a gas behaves most ideally. *High T, low P.*
7. Read the two correction terms. → **van der Waals equation** (beyond the exam)
8. Say why a real gas can become a liquid and an ideal one never could.

---

### World 5 — Ember Reach (`unit05`, thermodynamics): 7 quests

**Built (2026-10-15).** See `ember-reach-world.md` for what was built and where it parted from the stage lists below.

> **Cut in the build, and still owed (audit 2026-10-29, `AP-coverage-audit.md`).** The built quests dropped four things the drafts below carried, and the CED needs each: (1) `q1` stage 6 and `q3` stage 5, the energy diagram (CED 6.2): restore one reaction-progress diagram stage in `q3`; (2) `q7` stage 5, ΔG° from formation free energies, `ΔG° = ΣΔGf° (products) − ΣΔGf° (reactants)` (CED 9.3.A.3): add as a typed stage using a ΔGf° table, the same skill as `q6` stage 5 for entropy; (3) `q7` stage 6, kinetic control (CED 9.4): now Quicklight `q5` stage 3; (4) `q7` stage 7, coupled reactions (CED 9.7): now Teeter `q8` stage 7. Also owed in `q2`: the condensation and freezing sign flip (CED 6.5.A.2, now Mirrowen `q5` stage 4) and, in `q7` or `q3`, dissolving as exo- or endothermic from interaction strengths (CED 6.1.A.4, now Mirrowen `q6` stage 6).

#### `q1-flow` · Heat and Temperature · CED 6.1–6.3 · calorimeter
1. Touch a hot block to a cold one and say where both end. → **thermal equilibrium**
2. Say which way the energy went. → **heat**
3. Mark what is inside the boundary and what is outside it. → **system, surroundings**
4. Sort a hand warmer and a cold pack by which way heat crosses. → **exothermic, endothermic**
5. Say from the trace whether dissolving Sample A is endothermic.
6. Draw the energy diagram the trace implies. → **energy diagram**
7. Say why a bath and a spark at the same temperature hold different heat.
8. Sort four processes: burning, melting, condensing, dissolving NH₄NO₃.

#### `q2-calorimetry` · Calorimetry · CED 6.4 · calorimeter
1. Heat 100 g and 200 g of water with the same joules and compare ΔT. → **heat capacity**
2. Heat water and iron of equal mass with the same joules. → **specific heat capacity**
3. Find the heat needed to warm a mass of water. → **q = mcΔT**
4. Drop a hot block into water and find the block's specific heat. *Heat lost equals heat gained.*
5. Identify the metal from a table of specific heats.
6. Run a reaction in the cup and find the heat it released. → **calorimeter** (q of the reaction is −q of the solution)
7. Find that heat per mole of reaction.
8. Say why the cup and lid matter. *Leaving them off makes the answer too small.*

#### `q3-enthalpy` · Enthalpy of Reaction · CED 6.6 · calorimeter
1. Express the heat per mole of reaction, with its sign. → **enthalpy change, ΔH**
2. Double the amounts and say what happens to q and to ΔH. → (coefficients count moles; earned here, see "Road-wide dependencies")
3. Reverse the reaction. *ΔH flips sign.*
4. Find the heat released by burning a given mass.
5. Draw the energy diagram for an endothermic reaction.
6. Compare ΔH for making liquid water and water vapour. *State matters.*
7. Find the mass needed to release a set amount of heat.
8. Rank three fuels by heat per gram.

#### `q4-bonds` · Bond Enthalpies · CED 6.7 · join bench crank
1. Crank an H–H bond apart and read the cost. → **bond enthalpy**
2. Say what forming the bond does. *Releases the same amount.*
3. List the bonds broken and the bonds made when methane burns.
4. Estimate ΔH from bond enthalpies. *Broken minus formed.*
5. Say why the estimate differs from the calorimeter's figure. → **average bond enthalpy**
6. Say why burning releases energy even though bonds are broken. *C=O and O–H are strong.*
7. Compare the cost of breaking a double bond and a single bond.
8. Predict the sign of ΔH for a reaction from the bond table alone.

#### `q5-hess` · Hess's Law and Formation · CED 6.8, 6.9 · Hess board (card board)
1. Stack two equation cards to reach a target and add their ΔH. → **Hess's law**
2. Reach a target that needs one card flipped.
3. Reach a target that needs one card doubled.
4. Reach a three-card target (C to CO₂ by way of CO).
5. Read a formation card and say why an element's is zero. → **standard enthalpy of formation, standard state**
6. Find ΔH° of a reaction from formation values. *Products minus reactants.*
7. Say why the route does not matter. → **state function**
8. Sealed: find the formation enthalpy of an unknown from its combustion.

#### `q6-entropy` · Entropy · CED 9.1, 9.2 · arrangement box
1. Count the arrangements of two particles in four cells and then in eight. *More room, more ways.*
2. Open a gas into an empty chamber and say why it never comes back. → **entropy**
3. Order the solid, liquid and gas of one substance by entropy.
4. Predict the sign of ΔS for reactions that change the moles of gas.
5. Predict the sign for dissolving a salt.
6. Say what heating does to entropy.
7. Find ΔS° of a reaction from a table. → **standard molar entropy** (zero for a perfect crystal at 0 K)
8. Sort four processes by the sign of ΔS.

#### `q7-gibbs` · Free Energy · CED 9.3, 9.4, 9.6 · favourability plotter
1. Say whether each of two reactions runs on its own. → **thermodynamically favorable**
2. Combine ΔH and ΔS into one verdict. → **Gibbs free energy, ΔG = ΔH − TΔS**
3. Sort the four sign cases.
4. Find the temperature at which melting ice becomes favourable. *T = ΔH/ΔS, the crossing on the plotter.*
5. Find ΔG° of a reaction from formation free energies.
6. Say why diamond turning to graphite is favourable and never seen. → **kinetic control**
7. Drive an unfavourable reaction by pairing it with a favourable one. → **coupled reactions**
8. Pick a temperature that makes a process favourable.

---

### World 6 — Mirrowen (`unit06`, states of matter, IMFs, solutions): 7 quests

#### `q1-states` · Solids, Liquids and Gases · CED 3.3 · particle window (gas rig)
1. Describe how the particles sit and move in three samples of one substance.
2. Squeeze each and say which compresses.
3. Pour each into a new container and say what keeps its shape and its volume.
4. Melt the solid and say what changed and what did not. *The molecules are intact.* → **phase change**
5. Say what holds the solid's molecules together, since it is not their bonds. → **intermolecular forces**
6. Compare the spacing in each state. *A gas is mostly empty.*
7. Order the three by density.
8. Sort five particle pictures by state.

#### `q2-grip` · Intermolecular Forces · CED 3.1 · grip probe (join bench crank, molecule pairs)
1. Pull apart pairs of He, Ar and Xe. *The grip grows with size.* → **London dispersion forces**, **polarizability**
2. Compare two molecules of the same size, one polar. → **dipole–dipole forces**
3. Pull apart HF, H₂O and NH₃. *An unusually strong grip at the H.* → **hydrogen bonding**
4. Put salt in water and read the grip of an ion on water. → **ion–dipole forces**
5. Rank four pairs by grip.
6. Compare pentane with neopentane. *Same formula; contact area.*
7. Compare a grip with a bond (Ligar's crank). *IMFs are far weaker.*
8. Name the strongest force in each of five substances.

#### `q3-boil` · Liquids and Vapour · CED 3.1, 3.3 · gas rig (vapour manometer)
1. Seal a liquid in a flask. *The gauge rises and stops.* → **vapor pressure**
2. Compare the vapour pressures of three liquids against their grip.
3. Heat until the vapour pressure matches the room's. → **boiling point**
4. Boil it at a lower outside pressure (the mountain).
5. Rank four molecules by boiling point from their IMFs.
6. Compare surface tension and viscosity against grip. → **surface tension, viscosity**
7. Say why ice floats. *Hydrogen-bonded open lattice.*
8. Collect a gas over water and find its own pressure. *Dalton's law from Bellows plus vapour pressure.*

#### `q4-solids` · Kinds of Solid · CED 3.2 (2.4 is Ligar `q2`) · join bench slab plates (q2-lattice) plus metals

> **Overlap (audit 2026-10-29).** Ligar `q2-lattice` is built and already covers ionic, metallic, network and molecular solids, alloys, conduction and brittleness (CED 2.4 and most of 3.2). Keep here only what Ligar does not: molecular solids held by intermolecular forces, amorphous vs crystalline, and the four-way sealed sort. Stages 1 to 4 below repeat Ligar and should be cut or shortened.
1. Strike a metal block. *It bends and does not shatter.* → **metallic bonding**
2. Pass a current through it cold.
3. Swap in some larger atoms (brass). → **substitutional alloy**
4. Tuck small atoms into the gaps (steel). *Harder.* → **interstitial alloy**
5. Compare four solids: ionic, molecular, network and metallic.
6. Identify sealed solids from melting point, conductivity and brittleness.
7. Compare glass with quartz. → **amorphous, crystalline**
8. Pick the solid for a job.

#### `q5-crossing` · Phase Changes · CED 6.5 · calorimeter (heating-curve recorder)
1. Heat ice steadily. *The temperature stops twice.* → **heating curve**
2. Say where the heat went on the flat parts. → **heat of fusion, heat of vaporization**
3. Find the heat to melt a given mass. *q = nΔH*
4. Find the total heat from ice at −10 °C to steam at 110 °C, then the heat released when that steam condenses and freezes again. *Condensation is the negative of vaporization; fusion and freezing likewise.* (CED 6.5.A.2; Ember Reach `q2` stage 7 already does the upward trip.)
5. Say why steam burns worse than boiling water.
6. Say which phase a substance is in at a given P and T. → **phase diagram** (beyond the exam)
7. Find the triple point and the critical point. (beyond the exam)
8. Say why water's melting line leans the wrong way. (beyond the exam)

#### `q6-solution` · Solutions · CED 3.7, 3.8, 3.10, 6.1, 6.4 · flask bench
1. Dissolve a salt and watch the particle window. *Ions spread out, each wrapped in water.* → **solution, solute, solvent**
2. Make 0.100 M from a weighed mass in a volumetric flask. → **molarity**
3. Dilute it and say what stayed the same. *Moles.* → **dilution**
4. Count the particles CaCl₂ gives per formula. *Three.* → **strong electrolyte**
5. Say which of two solids dissolves in water and which in hexane. → **"like dissolves like"**, **solubility**
6. Dissolve a salt in a calorimeter cup, read ΔT, and say whether dissolving is exothermic or endothermic and why. *Compare the strengths of ion–ion and ion–water interactions.* (CED 6.1.A.4, 6.4.A.7; reuses the Ember Reach calorimeter. Solubility against temperature moves to practice.)
7. Find the mass percent of one component in a mixture. → **mass percent** (CED 3.7. Purity from elemental analysis, CED 1.4, is Kettle `q6` stage 8.)
8. Prepare a solution to a specification from a stock.

#### `q7-separate` · Separating Mixtures · CED 3.9 · flask bench (strip, column)
1. Run a dye up paper. *The spots separate.* → **chromatography**
2. Measure each spot's travel. → **Rf**
3. Swap to a nonpolar solvent and say why the order reverses.
4. Distil a two-liquid mixture and say which comes first. → **distillation**
5. Say whether filtering or evaporating recovers a dissolved solid.
6. Add salt to water and read the boiling point. → **boiling point elevation** (beyond the exam)
7. Say why salt melts road ice. → **colligative property, freezing point depression** (beyond the exam)
8. Plan the separation of a three-part mixture.

---

### World 7 — Kettle (`unit07`, stoichiometry, reactions, descriptive): 8 quests

`q1-recipe` (The Same Recipe, CED 1.3) is built. The rest follow it. The
placeholder charts (`q2-ledger` … `q5-kinds`) are replaced by these.

#### `q2-names` · Names and Formulas · assumed by every AP unit · card board
1. Write the formula Mg²⁺ and Cl⁻ make. *Charges cancel* (Tallow `q4-ledger`). → **ionic formula**
2. Name NaCl and MgO. → **naming ionic compounds**
3. Name iron's two chlorides. → **Roman numerals**
4. File the polyatomic ion cards: nitrate, sulfate, carbonate, hydroxide, ammonium, phosphate, acetate. → **polyatomic ion**
5. Write calcium nitrate. *Parentheses.*
6. Name CO, CO₂ and N₂O₄. → **prefixes for molecular compounds**
7. Name HCl(aq) and HNO₃. → **acid names**
8. A mixed set: name or write each.

#### `q3-change` · Physical or Chemical · CED 4.1, 4.4 · the pot
1. Say which of four changes made a new substance. → **chemical change, physical change**
2. Read the evidence: gas, solid, colour, temperature. → **evidence of reaction**
3. Compare dissolving sugar with sodium in water in the particle window.
4. Compare melting ice with splitting water.
5. Say why dissolving salt can be argued either way. *Ionic bonds break, but nothing new forms.*
6. Weigh a sealed pot before and after. → **conservation of mass**
7. Say why an open pot got lighter. *Gas escaped.*
8. Sort eight changes.

#### `q4-balance` · Balancing Equations · CED 4.3 · the pot (atom counts)
1. Count the atoms on each side of H₂ + O₂ → H₂O as drawn. → **chemical equation, reactants, products**
2. Fix it by changing a subscript, then by changing a count. *A subscript change makes H₂O₂, a different molecule on the scope.* → **coefficient**
3. Balance methane's combustion.
4. Turn a particle diagram into a balanced equation.
5. Mark each species' state. → **state symbols**
6. Balance propane's combustion.
7. Balance a reaction treating a polyatomic ion as one unit.
8. Sealed: find an unknown product's formula from the atom counts.

#### `q5-ionic` · Net Ionic Equations · CED 4.2 · the pot (conductivity, particle window)
1. Mix two clear solutions. *One goes cloudy.* → **precipitate**
2. Say which ions never changed. → **spectator ions**
3. Write only what reacted. → **net ionic equation**
4. Use the four always-soluble ions (Na⁺, K⁺, NH₄⁺, NO₃⁻). → **solubility rules**
5. Predict whether three mixtures precipitate.
6. Write the net ionic equation for a strong acid with a strong base.
7. Say why a weak acid stays whole in a net ionic equation.
8. Write the molecular, complete ionic and net ionic equations for one reaction. → **complete ionic equation**

#### `q6-stoich` · Stoichiometry · CED 4.5, 1.4 · the pot, assay balance
1. Find moles of product from moles of reactant. → **mole ratio**
2. Go from grams to grams.
3. Use a kit of bolts and brackets and say which runs out. → **limiting reactant**
4. Find the limiting reactant from masses, and how much of the other is left. → **excess reactant**
5. Heat CaCO₃ and collect the CO₂, then type the volume it fills at 25 °C and 1.00 atm. *The balanced equation gives the moles; PV = nRT gives the room.* (CED 4.5.A.3, the one place stoichiometry meets the gas law; Bellows `q3` stage 7 planned this and was cut. Collected over water, subtract the vapour pressure from Bellows `q4`.)
6. Find the most product possible. → **theoretical yield**
7. Weigh what was actually made. → **percent yield**
8. Filter, dry and weigh a precipitate to find the percent chloride in a sample, then the percent purity of the salt. → **gravimetric analysis** (CED 1.4: elemental composition shows purity)

#### `q7-titrate` · Titration · CED 4.6 · the pot, burette head
1. Add base from the burette until the colour changes. → **titration, burette, indicator**
2. Say what "just enough" means. *Moles match.* → **equivalence point**
3. Find the concentration of an acid.
4. Titrate H₂SO₄. *It needs twice the base.*
5. Say what overshooting does to the answer.
6. Tell the colour change from the true match point. → **endpoint**
7. Titrate with permanganate. *It is its own indicator.*
8. Sealed unknown.

#### `q8-kinds` · Kinds of Reaction · CED 4.7, 4.8, 4.9 · the pot, gas tests, card board
1. Sort reactions that join and reactions that split. → **synthesis, decomposition**
2. Burn a fuel and test the products. → **combustion**
3. File the precipitation reactions (q5).
4. Watch a proton move from one molecule to another. → **acid–base reaction** (Brønsted–Lowry, introduced here)
5. Drop zinc into copper sulfate and watch the electrons move. → **oxidation, reduction, redox**
6. Assign oxidation numbers. → **oxidation number**
7. Identify three gases by test: glowing splint, lit splint, limewater.
8. Sort eight reactions by type.

---

### World 8 — Teeter (`unit08`, equilibrium): 8 quests

#### `q1-both` · Dynamic Equilibrium · CED 7.1, 7.8 · the pans
1. Start with only A and watch until the plot flattens.
2. Say whether anything is still happening. *Both counters still tick, at equal rates.* → **dynamic equilibrium**
3. Start with only B. *It reaches the same end.*
4. Watch the forward rate fall and the reverse rate rise until they meet.
5. Pick the particle diagram that shows equilibrium.
6. Say what equilibrium does not mean. *The concentrations are not equal.*
7. Say what the double arrow promises. → **reversible reaction**
8. Sealed: say which of three flasks has reached equilibrium.

#### `q2-K` · The Equilibrium Constant · CED 7.3–7.5 · the pans
1. Read the final concentrations from three starts and find the ratio that never changes. → **equilibrium constant K**
2. Say what a coefficient becomes in the ratio. *A power.*
3. Say what happens to a pure solid or liquid. *It is left out.*
4. Write the gas version in pressures. → **Kp, Kc**
5. Calculate K from equilibrium data.
6. Say what a large K means.
7. Say what a small K means.
8. Sealed: match three reactions to their K.

#### `q3-Q` · Which Way It Goes · CED 7.2, 7.3 · Q/K gauge
1. Take the same ratio before equilibrium. → **reaction quotient Q**
2. Say which way the system moves when Q < K.
3. Say which way it moves when Q > K.
4. Say what Q = K means.
5–7. Predict the direction for three mixtures.
8. Sealed.

#### `q4-properties` · Combining K · CED 7.6 · Hess-style card board
1. Reverse a reaction. *K becomes 1/K.*
2. Double the coefficients. *K is squared.*
3. Halve them. *K is square-rooted.*
4. Add two reactions. *Their Ks multiply.*
5. Convert between Kp and Kc. (beyond the exam)
6–8. Find a target K from given ones; sealed.

#### `q5-ice` · Equilibrium Concentrations · CED 7.7 · ICE board
1. Lay out initial, change and equilibrium amounts. → **ICE table**
2. Solve for x when it is a perfect square.
3. Use the small-x approximation when K is small.
4. Check whether the approximation was fair.
5. Find K from partial data.
6–8. Two problems and a sealed one.

#### `q6-lean` · Le Châtelier's Principle · CED 7.9, 7.10 · stress keys
1. Add a reactant and say which way the system moves. → **Le Châtelier's principle**
2. Remove a product.
3. Squeeze the vessel. *It shifts toward fewer moles of gas.*
4. Add an inert gas at fixed volume. *No shift.*
5. Heat an endothermic reaction. *It shifts, and K itself changes.*
6. Add a catalyst. *Faster, no shift.*
7. Explain each shift with Q.
8. Choose conditions for the most ammonia.

#### `q7-dissolve` · Solubility Equilibria · CED 7.11, 7.12 · solubility beaker
1. Add solid until it stops dissolving. *The ion meters stop.* → **saturated solution, Ksp**
2. Write a Ksp expression.
3. Find AgCl's molar solubility from its Ksp. → **molar solubility**
4. Compare the solubilities of salts with different formula ratios. *Not by Ksp alone.*
5. Add a common ion. *A precipitate forms.* → **common-ion effect**
6. Use Q against Ksp to say whether a precipitate forms.
7. Add the common ion to a 1:1 salt and to a 1:2 salt and compare how far each solubility falls. *Not by Ksp alone.* (pH and solubility, CED 8.11, moved to Verdigris `q8` stage 7, after acids are earned.)
8. Sealed.

#### `q8-free` · Free Energy and K · CED 9.5, 9.7 · favourability plotter
1. Find the link between ΔG° and K for three reactions. → **ΔG° = −RT ln K**
2. Say what sign of ΔG° goes with K > 1.
3. Calculate K from ΔG°.
4. Say how temperature moves K through ΔG°.
5. Say what decides whether a salt dissolves. → **free energy of dissolution**
6. Say why some salts dissolve while cooling the water.
7. Drive an unfavourable reaction by pairing it with a favourable one that shares an intermediate (ATP to ADP). *The two ΔG° add.* → **coupled reactions** (CED 9.7; Ember Reach `q7` stage 7 was cut when that quest was built). ΔG = ΔG° + RT ln Q is not on the CED equation list; if kept it goes to practice, labelled beyond the exam.
8. Sealed.

---

### World 9 — Verdigris (`unit09`, acids and bases): 8 quests

#### `q1-handover` · Acids and Bases · CED 8.1 · pH bench (particle window)
1. Add HCl to water and say where the proton went. → **Brønsted–Lowry acid and base, hydronium**
2. Add NH₃ to water. *It takes a proton.*
3. Pair each acid with what is left of it. → **conjugate acid–base pair**
4. Say why water can act either way. → **amphoteric**
5. Count the ions in pure water. → **autoionization, Kw**
6. Read Kw at 25 °C.
7. Say what BF₃ does with NH₃. → **Lewis acid and base** (beyond the exam)
8. Find the conjugate pairs in four reactions.

#### `q2-scale` · pH · CED 8.1, 8.2 · pH meter
1. Read 0.1, 0.01 and 0.001 M HCl. *One unit per tenfold step.* → **pH**
2. Find pH from [H₃O⁺].
3. Find pOH and the sum. → **pOH**
4. Find the pH of a strong base.
5. Say why HCl is fully ionized. → **strong acid, strong base**
6. Dilute a strong acid and say what the pH does.
7. Say why neutral water at 50 °C is not pH 7.
8. Sealed.

#### `q3-weak` · Weak Acids and Bases · CED 8.3 · pH bench
1. Compare HCl and acetic acid at the same concentration. → **weak acid**
2. Count the fraction ionized. → **percent ionization**
3. Write the expression and its log. → **Ka, pKa**
4. Find a weak acid's pH with an ICE table.
5. Dilute a weak acid. *The percent ionized rises.*
6. Find a weak base's constant. → **Kb**
7. Multiply Ka and Kb for a conjugate pair. *Kw.*
8. Sealed.

#### `q4-structure` · Acid Strength and Structure · CED 8.6 · card board, Ligar's pair board
1. Rank HF, HCl and HBr. *Bond length and strength.*
2. Rank CH₄, NH₃, H₂O and HF. *Electronegativity.*
3. Rank HClO and HClO₄. *More oxygens.*
4. Compare a carboxylic acid with an alcohol. *Resonance in the conjugate base* (Ligar `q5`).
5. Add electronegative atoms near the acid group.
6. Rank five acids.
7. Rank three bases.
8. Sealed.

#### `q5-salts` · Neutralization and Salts · CED 8.4 · pH bench
1. Neutralize a strong acid with a strong base. *pH 7.*
2. Neutralize a weak acid with a strong base. *Basic.* → **salt hydrolysis**
3. Neutralize a weak base with a strong acid. *Acidic.*
4. Predict the pH of NaCl, NaF, NH₄Cl and KNO₃ solutions.
5. Mix unequal amounts. *The excess strong reagent decides the pH.*
6. Half-neutralize a weak acid and look at what is left.
7. Calculate a salt solution's pH.
8. Sealed.

#### `q6-titrate` · Titration Curves · CED 8.5 · burette, curve plotter
1. Titrate strong with strong. *Steep jump at 7.* → **titration curve**
2. Titrate weak with strong. *Equivalence above 7.*
3. Read the pH halfway to equivalence. *pH = pKa.* → **half-equivalence point**
4. Pick an indicator for each curve.
5. Find Ka from a curve.
6. Titrate a diprotic acid. *Two jumps.* → **polyprotic acid**
7. Find a concentration from the equivalence volume.
8. Sealed.

#### `q7-buffer` · Buffers · CED 8.4, 8.8, 8.9 · buffer flask
1. Add acid to water and to the mixture. *One barely moves.* → **buffer**
2. Say what the mixture is made of.
3. Watch the added H₃O⁺ get caught by A⁻.
4. Find pH from the ratio. → **Henderson–Hasselbalch equation**
5. Mix equal amounts. *pH = pKa.*
6. Build a buffer at pH 4.7.
7. Add base and find the new pH. (beyond the exam: the CED excludes computing the pH change on adding acid or base to a buffer. Keep it qualitative on the exam track, or label the card.)
8. Sealed.

#### `q8-capacity` · pKa, Protonation and Capacity · CED 8.7, 8.10, 8.11 · pH bench
1. Say which form dominates below the pKa. → **protonation state**
2. Say which dominates above it.
3. Say why an indicator changes colour where it does.
4. Compare a dilute buffer with a concentrated one. → **buffer capacity**
5. Overwhelm a buffer.
6. Say why a ratio far from 1 buffers poorly.
7. Add acid to a saturated solution of a hydroxide and then of a chloride, and say which dissolves more. *Qualitative only: the CED excludes computing solubility as a function of pH.* → **pH and solubility** (CED 8.11). The amino-acid forms stage (beyond the exam) moves to practice.
8. Sealed.

---

### World 10 — Brinewire (`unit10`, electrochemistry): 6 quests (charted)

#### `q1-halves` · Half-Reactions · CED 4.9 · cell bench, pot
1. Drop zinc into copper solution and read the oxidation numbers before and after.
2. Split the reaction in two. → **half-reaction**
3. Balance aluminium with Cu²⁺. *Electrons lost equal electrons gained.*
4. Name the species that does each job. → **oxidizing agent, reducing agent** (beyond the exam: the CED says the terms will not be assessed. Keep the words, label the card.)
5. Balance a reaction in acid with H₂O and H⁺.
6. Balance permanganate with iron(II).
7. Balance a reaction in base. (beyond the exam)
8. Sealed.

#### `q2-activity` · Which Metal Gives · descriptive, CED 4.9 · electrode rack, beakers
1. Drop metals into each other's solutions. *Coated or not.*
2. Rank the metals from the results. → **activity series**
3. Predict a pairing not yet tried.
4. Put metals in acid and say which give off hydrogen.
5. Say why gold is found as metal.
6. Say why zinc protects iron. → **sacrificial anode**
7. Place a sealed metal in the series.
8. Pick a metal to plate out another by displacement.

#### `q3-galvanic` · Galvanic Cells · CED 9.8 · cell bench
1. Separate the two halves and wire them. *No current.*
2. Add the bridge. *Current.* → **salt bridge**
3. Read which way the electrons go.
4. Name each electrode. → **anode, cathode, galvanic cell**
5. Read which way the ions in the bridge go.
6. Say which electrode gains mass.
7. Write the cell in shorthand. → **cell notation** (beyond the exam)
8. Sealed.

#### `q4-potential` · Cell Potential · CED 9.9 · cell bench, potential board
1. Read each metal against a standard and build a table. → **standard reduction potential**
2. Find a cell's voltage. → **E°cell** (cathode minus anode)
3. Say what a positive E° means.
4. Say why doubling a half-reaction leaves E° alone.
5. Link E° to ΔG°. → **ΔG° = −nFE°, Faraday constant**
6. Link E° to K.
7. Pick the best pair for a battery.
8. Sealed.

#### `q5-load` · Under Load · CED 9.10 · cell bench (run time)
1. Run the cell and watch the voltage fall.
2. Say what Q does to the voltage (qualitatively).
3. Say why the cell is dead when Q = K. *E = 0.*
4. Build a cell from one metal at two concentrations. → **concentration cell**
5. Calculate a voltage away from standard. → **Nernst equation**, E = E° − (RT/nF) ln Q (in scope: CED 9.10 puts it on the equation list, so give it a typed-answer stage like Bellows)
6. Raise the cathode concentration.
7. Compare alkaline, lead–acid and lithium-ion cells (descriptive).
8. Sealed.

#### `q6-electrolysis` · Electrolysis · CED 9.8, 9.11 · cell bench, power supply, balance
1. Push current through a cell the wrong way. → **electrolytic cell, electrolysis**
2. Electrolyse molten NaCl. *Sodium at one electrode, chlorine at the other.*
3. Find charge from current and time. → **coulomb**
4. Turn moles of electrons into mass plated. → **Faraday's law**
5. Plate silver for a set time.
6. Compare electrolysing water with electrolysing brine.
7. Plate an object and refine copper.
8. Sealed: find the current from the mass plated.

---

### World 11 — Quicklight (`unit11`, kinetics): 7 quests

#### `q1-watch` · Reaction Rates · CED 5.1 · rate bench
1. Compare two reactions: one done in a second, one never seen to move.
2. Read a rate off the slope. → **reaction rate**
3. Compare an average rate with the rate at one instant.
4. Relate the rates of A and B through the coefficients.
5. Raise the concentration.
6. Raise the temperature.
7. Compare a powder with a lump.
8. Add a catalyst (a preview of q7).

#### `q2-law` · Rate Laws · CED 5.2 · initial-rates log
1. Double [A]. *Rate doubles.* → **rate law, order**
2. Double [B]. *Rate quadruples.*
3. Double [C]. *No change.*
4. Write a rate law from a table. → **method of initial rates**
5. Find the overall order.
6. Find k. → **rate constant**
7. Give k's units.
8. Sealed.

#### `q3-time` · Concentration Over Time · CED 5.3 · plotter
1. Plot [A]. *A curve.*
2. Plot ln[A]. *A straight line means first order.* → **integrated rate law**
3. Plot 1/[A]. *A straight line means second order.*
4. Find k from the slope.
5. Measure successive half-lives. *Constant for first order.* → **half-life**
6. Find what is left after n half-lives.
7. Recognize zero order.
8. Sealed.

#### `q4-collide` · Collisions · CED 5.4, 5.5 · Charge Gardens chamber
1. Watch the chamber. *Most collisions bounce.* → **collision model**
2. Say what speed has to do with it.
3. Say what direction has to do with it. *Orientation* (the Charge Gardens' arrows).
4. Raise the temperature. *The tail above the bar grows.* → **activation energy**
5. Count how many particles meet in one step. → **elementary reaction, molecularity**
6. Write the rate law of an elementary step.
7. Say why three-body steps are rare.
8. Sealed.

#### `q5-hill` · Energy Profiles · CED 5.6, 5.10, 9.4 · energy-profile screen
1. Read the top of the hill. → **transition state**
2. Read Ea and ΔH from the profile.
3. Find a reaction that runs downhill in energy and still never moves at room temperature. *A tall hill.* → **kinetic control** (CED 9.4; Ember Reach `q7` stage 6 was cut when that quest was built, since it needs this bench.)
4. Find the reverse Ea.
5. Read a two-humped profile. → **intermediate**
6. Say which hump is slowest.
7. Plot ln k against 1/T. → **Arrhenius equation** (beyond the exam)
8. Sealed.

#### `q6-mechanism` · Mechanisms · CED 5.7–5.9 · mechanism card board
1. Add up the steps and cancel. → **reaction mechanism**
2. Find the intermediate.
3. Say which step sets the rate. → **rate-determining step**
4. Write the rate law for a slow first step.
5. Substitute through a fast equilibrium before a slow step. → **pre-equilibrium**
6. Decide whether a proposed mechanism fits the rate law.
7. Find a species used up and then regenerated.
8. Sealed.

#### `q7-shortcut` · Catalysis · CED 5.11 · rate bench, catalyst tray
1. Add a catalyst. *Faster, and recovered unchanged.* → **catalyst**
2. Read the lower hill.
3. Say why the mechanism changed.
4. Compare a dissolved catalyst with a surface. → **homogeneous, heterogeneous**
5. Watch an enzyme work. → **enzyme, active site**
6. Say why a catalyst does not move K (Teeter).
7. Use acid as a catalyst.
8. Sealed.

---

### World 12 — Lodestone (`unit12`, transition metals): 5 quests, beyond AP throughout

#### `q1-dblock` · The d-Block · box rack, light bench
1. Fill Sc to Zn. (recap of Lanternfall `q6`)
2. Make their ions. *4s empties first.*
3. Lay out manganese's charges from +2 to +7 by colour.
4. Name the ions. *Roman numerals* (Kettle).
5. Say why Fe³⁺ outlasts Fe²⁺ in air. *d⁵.*
6. Say why zinc does not count. → **transition metal**
7. Read radii across the d-block. *Nearly flat.*
8. Sealed.

#### `q2-complex` · Complex Ions · domain rig, ligand tray
1. Add NH₃ to Cu²⁺. *Deep blue.* → **complex ion, ligand**
2. Say who supplies the bond's electrons. → **coordinate covalent bond**
3. Count the ligands. → **coordination number**
4. Build octahedral, tetrahedral and square planar complexes.
5. Find a complex's charge.
6. Attach a ligand by two or more points. → **chelate**
7. Build both forms of [Pt(NH₃)₂Cl₂]. *Cis and trans* (cisplatin).
8. Name three simple complexes.

#### `q3-colour` · Colour · light bench, box rack (`crystal-field` layout)
1. Read what [Cu(H₂O)₆]²⁺ absorbs. *Orange; it looks blue.*
2. Watch the d boxes split in an octahedral field. → **crystal field splitting**
3. Match the gap to the absorbed photon (Lanternfall).
4. Swap ligands and watch the colour shift. → **spectrochemical series**
5. Say why Zn²⁺ and Sc³⁺ are colourless.
6. Compare a tetrahedral split.
7. Predict a colour.
8. Sealed.

#### `q4-spin` · Magnetism and Spin · box rack, magnet
1. Hold Fe²⁺ with water and with cyanide to the magnet. → **high spin, low spin**
2. Weigh the cost of pairing against the gap.
3. Count unpaired electrons.
4. Predict the magnet's response.
5. Say why only d⁴ to d⁷ have a choice.
6. Say why square planar d⁸ is diamagnetic.
7. Compare a strong and a weak ligand.
8. Sealed.

#### `q5-metals` · Winning and Losing Metals · cell bench, favourability plotter
1. Reduce an ore with carbon. → **metallurgy**
2. Say why it needs a furnace. *ΔG against T* (Ember Reach).
3. Win aluminium by electrolysis (Brinewire).
4. Refine copper.
5. Rust iron. *It needs oxygen and water.* → **corrosion**
6. Protect it: paint, zinc coating, a sacrificial block.
7. Say why aluminium and chromium protect themselves. → **passivation**
8. Pick the method for a job.

---

### World 13 — Thornmere (`unit13`, organic chemistry): 6 quests, beyond AP throughout

#### `q1-chains` · Carbon Chains · domain rig (model kit), naming card board
1. Build CH₄ and C₂H₆. → **hydrocarbon, alkane**
2. Find the formula pattern. *CₙH₂ₙ₊₂.*
3. Name meth- to dec-.
4. Draw condensed and skeletal formulas. → **skeletal formula**
5. Name a branch: longest chain, lowest numbers. → **IUPAC naming**
6. Name 2-methylbutane from the model.
7. Close a ring. → **cycloalkane**
8. Sealed.

#### `q2-unsat` · Double and Triple Bonds · model kit, the pot
1. Build ethene. *CₙH₂ₙ.* → **alkene, unsaturated**
2. Build ethyne. → **alkyne**
3. Number where the double bond is.
4. Test with bromine water. *It decolourizes.*
5. Build benzene. *Resonance* (Ligar). → **aromatic**
6. Compare saturated and unsaturated fats.
7. Add hydrogen across a double bond. → **hydrogenation**
8. Sealed.

#### `q3-isomers` · Isomers · model kit, light bench (polarized)
1. Build two C₄H₁₀ and compare their boiling points. → **structural isomers**
2. Count the C₅H₁₂ isomers.
3. Build both forms of 2-butene. *Restricted rotation* (Ligar). → **geometric (cis/trans) isomers**
4. Try to lay a molecule on its mirror image. → **chirality, enantiomers**
5. Find the carbon that makes it so. → **stereocenter**
6. Pass polarized light through each. → **optical isomers**
7. Say why a drug's mirror image can matter.
8. Sealed.

#### `q4-groups` · Functional Groups · model kit, card board
1. Add –OH. → **functional group, alcohol**
2. Build an ether.
3. Build C=O at the end and in the middle. → **carbonyl, aldehyde, ketone**
4. Build –COOH. → **carboxylic acid**
5. Build –COO–. → **ester**
6. Build an amine and an amide. → **amine, amide**
7. Swap in a halogen. → **haloalkane**
8. Find every group in a drug molecule.

#### `q5-properties` · Structure and Properties · grip probe, pH bench
1. Compare the boiling points of ethanol and dimethyl ether. *Hydrogen bonding.*
2. Compare the water solubility of alcohols as the chain grows.
3. Say why acetic acid is an acid (Verdigris).
4. Say why amines are bases.
5. Say why esters smell (descriptive).
6. Read the carbonyl's polarity.
7. Rank five boiling points.
8. Sealed.

#### `q6-reactions` · Reactions and Polymers · the pot, model kit
1. Burn a hydrocarbon (recap).
2. Add Br₂ or H₂O across an alkene. → **addition reaction**
3. Turn a haloalkane into an alcohol. → **substitution reaction** (its mechanism is the Charge Gardens'; the card points there)
4. Make an ester. *Water comes out.* → **condensation reaction**
5. Chain ethene together. → **addition polymer**
6. Make nylon or polyester. → **condensation polymer**
7. Join amino acids. *Amide links.* Look at sugars. → **biomolecules**
8. Sealed.

---

### World 14 — Cinder Halo (`unit14`, nuclear chemistry): 5 quests, beyond AP throughout

#### `q1-warm` · Radioactivity · detector bench
1. Hold the counter to two samples. *Only one clicks.* → **radioactivity**
2. Put paper in front of the sample. → **alpha radiation**
3. Put aluminium in front. → **beta radiation**
4. Put lead in front. → **gamma radiation**
5. Pass each between charged plates. *α bends to −, β to +, γ goes straight.*
6. Identify what a sample emits from shields alone.
7. Move the counter away. *The rate falls.*
8. Sealed.

#### `q2-equations` · Nuclear Equations · nuclide card board
1. Follow alpha decay. *A falls by 4, Z by 2.* → **nuclear equation**
2. Follow beta decay. *A neutron becomes a proton.*
3. Follow positron emission. → **positron emission**
4. Follow electron capture. → **electron capture**
5. Follow gamma emission. *No change.*
6. Balance mass and atomic numbers.
7. Count the α and β steps from U-238 to Pb-206. → **decay series**
8. Sealed.

#### `q3-stability` · Which Nuclei Last · N–Z card board
1. Plot the stable nuclides. → **band of stability**
2. Watch n/p rise with Z.
3. Say what a nucleus with too many neutrons does. *β⁻.*
4. Say what one with too few does. *β⁺ or capture.*
5. Say what everything past Z = 83 does. *α.*
6. Notice even–even and magic numbers. (beyond)
7. Predict the decay mode of four nuclides.
8. Sealed.

#### `q4-halflife` · Half-Life · core bench (decaying population), counter
1. Count until the sample halves, then halves again. → **half-life**
2. Compare it with first order (Quicklight).
3. Find the fraction left after n half-lives.
4. Find what is left at a time that is not a whole number of half-lives.
5. Date a sample by carbon-14. → **radiocarbon dating**
6. Pick an isotope for a medical scan.
7. Compare activity with amount.
8. Sealed: date an artifact.

#### `q5-mass` · Mass Defect, Fission and Fusion · precision balance, chamber
1. Weigh He-4 against two protons and two neutrons. *Lighter.* → **mass defect**
2. Turn the missing mass into energy. → **E = mc², nuclear binding energy**
3. Plot binding energy per nucleon. *Iron at the peak.*
4. Split uranium. *The products are more tightly bound.* → **fission**
5. Let the neutrons go on. → **chain reaction, critical mass**
6. Join hydrogen. → **fusion**
7. Compare energy per gram with burning fuel (Ember Reach).
8. Say what made Cinder Halo's craters (the story's close).

An optional sixth quest, *Radiation and Life* (dose, shielding, medical and
power uses), is left uncharted unless wanted.

---

### AP coverage (every CED topic → its quest)

Rewritten 2026-10-29 against the current CED (Course Framework V.1; `docs/ap-chemistry-course-and-exam-description.pdf`),
which has 7.1 to 7.12, 8.1 to 8.11 and 9.1 to 9.11. The full reasoning and the built-track findings are in
`docs/AP-coverage-audit.md`. **B** = built, **P** = planned in this file, **FIX** = a stage owed that is not yet in
the built quest.

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

Scope labels (CED exclusion statements): beyond the exam are quantum-number assignment, Aufbau exceptions (Cr, Cu),
hybrid-orbital derivation and d-orbital hybridization, molecular orbital diagrams, phase diagrams, colligative
properties and molality, Arrhenius calculations, Kc/Kp conversion, Lewis acid–base, oxidizing and reducing agent as
terms, the pH change on adding acid or base to a buffer, solubility as a function of pH as a calculation, Henderson–Hasselbalch derivation,
effusion, Graham's law and van der Waals corrections (not in the CED at all).

### Size of the road

| | Quests | Stages |
| --- | --- | --- |
| Built | 9 | 72 |
| Lanternfall + Ligar (agreed) | 16 | 128 |
| This proposal | 72 | 576 |
| **Whole road** | **97** | **776** |

Each quest also owes five practice problems, so the road carries 485 of them.

---

## What each quest also owes

- **Five `PRACTICE` problems**, AP style. These are the place for numeric
  practice (photon energy, Beer–Lambert, formal charge) that a stage only
  teaches once. Beyond-exam quests label their problems that way.
- **`STAGES`, `SOLUTIONS`, `MISSES`, `stateFor`**, so `verify:learn` grades every
  stage both ways. Numeric answers will collide with the refusal-message scan
  (656, 109.5); each collision is a documented allowlist entry, as
  `q3-catalogue` stage 4's is.
- **`WITHHELD_VOCAB`** entries in `tools/verify-learn.mjs` for all sixteen quest
  keys, matching the `VOCABULARY` lines above.
- **`BUILDS_ON`**, if decision 2 is accepted.

## Verifier work

- `verify:learn`: well-formedness for each new declaration type:
  - light-bench sources: real lines within 380–750 nm for visible, real work
    functions
  - cloud ids from the known set
  - box-rack layouts: no box over two, Pauli and Hund checks, molecular
    electron counts equal to the atoms' valence sum
  - pair-board molecules: tray equals the valence sum plus or minus the charge
  - domain-rig arms: 2–6, angles from the table
  - every figure checked against the real-data tables above
- `verify:bench`: each new 3D instrument measured at six aspects, as now. Ligar
  sites 3–9 are deployed and pressed through the real pointer path when built.
- `verify:ligar`: the new sites, their signs (six words), their flood-fill
  reachability, overlap.

## Build order

1. ~~**Light bench**~~ (drawn + built) → Lanternfall `q1-wave`, `q2-photon`,
   `q3-lines`, `q9-absorb`. **Done.**
2. ~~**Cloud plate**~~ → `q4-cloud`. **Done.**
3. ~~**Box rack**~~ → `q5-numbers`, `q6-filling`. **Done.**
4. ~~**Core bench extensions**~~ → `q7-pes`, `q8-trends`. **Done**, as a sibling
   instrument (`electronbench.js`) and not an extension of `corebench.js`. Lanternfall complete.
5. **Join bench crank** → Ligar `q3-distance` at the Batch House (`built: true`).
6. **Pair board** → `q4-dots` (Weighbridge), `q5-resonance` (new site 5).
7. **Domain rig** → `q6-shape`, `q7-polarity`, `q8-hybrid` (sites 6–8).
8. **Box rack, molecular layout** → `q9-orbitals` (site 9). Ligar complete.
9. ~~Lanternfall as walkable ground~~ (its own plan). **Done:** `lanternfall-world.md`.
10. ~~**Tallow site 6**~~ for `q6-weigh`: the site-5 hopper-gantry builder, laid again.
    **Done**; `SITE_PENDING` is empty.
11. **The rest of the road, by instrument, in road order where the instruments
    allow:**
    - **Kettle:** build `pot.js` and its burette head first, since the pH bench
      and Thornmere reuse them. Then Bellows (`gasrig.js`), Ember Reach
      (`calorimeter.js`), Mirrowen (`flaskbench.js`, plus the grip probe on the
      join bench), Teeter (`pans.js`), Verdigris (`phbench.js`), Brinewire
      (`cellbench.js`) and Quicklight (`ratebench.js`).
    - **The three beyond-AP worlds** come last. They are mostly reuse: Lodestone
      uses the box rack, domain rig, light bench and cell bench; Thornmere uses
      the domain rig, pot and grip probe; Cinder Halo needs `detector.js`.

Each step ends on a green `npm run verify`, and on CLAUDE.md and this file
updated.

## Progress

- [x] Road reordered, ids renumbered, worlds unlocked, Kettle given recipe and
  weigh, Ligar sites 3–4 re-signed, charts list every quest above (2026-10-10).
- [x] The mole moved to Tallow (`unit01/q6-weigh`, CO₂ in place of NaCl);
  Brinewire charted as world 10; worlds 11–14 shifted (2026-10-10).
- [x] The rest of the road drafted as a proposal (this file).
- [x] Lanternfall: all nine quests, four instruments, the ground, the verifiers (2026-10-10).
- [x] Tallow site 6 (2026-10-10).
- [x] AP audit against the current CED: numbering corrected, coverage table rewritten, scope labels fixed, missing AP stages added to Teeter q7/q8, Verdigris q8, Kettle q6, Mirrowen q4/q5/q6, Quicklight q5, with the stages the built Lanternfall and Ember Reach quests cut listed as owed (2026-10-29, `docs/AP-coverage-audit.md`).
- [ ] The built-quest fixes the audit marks **FIX** (Avogadro arithmetic, ion configurations, electron affinity and electronegativity trend, energy diagram, ΔG° from ΔGf°).
- [ ] The user's edits to the proposal; then the placeholder charts replaced.
- [ ] Decisions 5–12 above.
- [ ] Steps 5–8 and 11.
