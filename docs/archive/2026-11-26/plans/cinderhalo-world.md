# Cinder Halo (`unit14`): Nuclear Chemistry — World Spec & Build Record

**World:** Cinder Halo (`unit14`, world 14 in road order, the last), the crater sea where the Fifth runs its transmutation works.
**Subject:** radioactivity, the three kinds of radiation, nuclear equations, which nuclei are stable, half-life, mass defect and binding energy, fission, chain reactions and fusion. Beyond the AP exam except half-life as first-order decay (CED 5.3.A.5 and 5.3.A.6); owner decision 2026-11-11 holds: followable by a 13-year-old, and "beyond the exam" appears nowhere in play text.
**Structure:** 6 benches of 8 stages (48) + 1 boss (`boss-core`, 5 phases) = 53 stages, 7 quest modules.
**Kit:** `nuke` (`src/learn/table/kits/nuke*.js`), extending the heat kit's cards, slots, plaques and typed entries, on the Thornmere pattern (a registry, one file per instrument family, kinds prefixed `n`). Planners and data in `src/learn/engine/nucdata.js`.
**Status:** spec written 2026-11-14. Build record at the end (section 8).

Sources: `docs/plans/learn-quests.md` World 14 (five quests of eight, a sixth left uncharted), the chart in `src/learn/worlds/unit14-nuclear-chemistry.js` (four draft quests), `docs/story/bible.md` (the Reveal: the Fifth breaks and rebuilds nuclei on Cinder Halo), `PRODUCT.md` "Building a Learn world", and `docs/plans/world-distinction-plan.md` section 6 (Cinder Halo's row was unclaimed; this spec claims it). Where they disagree this spec says what it chose and why.

## 0. Decisions that part from the earlier plans

- **Six benches, not five.** `learn-quests.md` folds mass defect, fission and fusion into one bench and leaves radioactivity's own click (that cold does not slow decay) out. PRODUCT asks for six to nine. Radioactivity and the three radiations are split into two benches (`q1`, `q2`), and the four-quest chart's ids are kept where they fit: `q1-still-warm`, `q2-what-comes-off`, `q5-half-gone` (was `q3-half-gone`), `q6-shortfall` (was `q4-the-shortfall`); `q3-equations` and `q4-stability` are new. The draft chart was never built or played, so no saved progress names the old ids.
- **The first bench carries the story's oldest clue.** Bellows' boss filed *the Warm Cylinder*, a sealed drum that stayed warm for twelve days on a freezing deck. Bench 1 answers it: the drum's nuclei decay at the same rate warm or cold, and the radiation they give off warms the drum.
- **No college detail that changes nothing the student can see.** The antineutrino and neutrino that leave with beta particles and positrons are said to exist in one clause (bench 3, stage 3) and drawn nowhere else; the strong nuclear force is named with what it does (holds touching nucleons together) and nothing about its carriers; isotope separation is not taught.
- **Boss.** `boss-core`, the Transmutation Core of the bible's finale, on the great crater's floor.

## 1. CED map

Nuclear chemistry is not a unit of the AP CED. Two essential-knowledge statements name it, and several topics are used.

| CED topic | Where | Note |
| --- | --- | --- |
| 5.3.A.5 half-life is constant for first order; t½ = 0.693/k | `q5` s1, s4, s6 (typed k) | the EQN is printed on the bench plate for s6 |
| 5.3.A.6 radioactive decay is first-order kinetics | `q5` s4, s6; boss phase 4 | shown on a ln(N) against time plot that is a straight line |
| 5.3.A.3 ln[A]t − ln[A]0 = −kt | `q5` s6 plot | the straight line is drawn; k is its fall per day |
| 1.5 Atomic structure (protons, neutrons, mass number) | `q1` s3, `q3` all | recap of Tallow `q2-core`, `q4-ledger` (glossary `NEEDS`, primer `nucleons`) |
| 1.7 / 2.1 Coulomb attraction and repulsion | `q2` s1–s3 (plates), `q4` s3 (protons push on protons) | qualitative |
| Calculation: count from amount (proportion) | `q1` s6 (typed) | see, compare two, type a third past the samples |
| Calculation: nuclei left after n half-lives | `q5` s5 (typed past the grid) | |
| Calculation: rate constant from half-life | `q5` s6 (typed; worked case in briefing) | AP EQN |
| Calculation: radiocarbon age | `q5` s7 (typed; worked case) | |
| Calculation: neutron-to-proton ratio | `q4` s7 (typed; worked case) | |
| Calculation: binding energy from mass defect, E = mc² as 931.5 MeV per u | `q6` s3 (typed; worked case), boss phase 5 (typed, fission) | |

Gaps logged: none against the CED (its two statements are covered). Beyond-exam topics left out on purpose: nuclear medicine dose units (sievert, gray), the neutrino's evidence, isotope separation, reactor engineering beyond the chain reaction.

## 2. Bench list in teaching order

| # | Bench | Idea thread | Instrument family | The one click (and the wrong model it contradicts) | Story stake, lead line, `Filed:` | `BUILDS_ON` | Words earned |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `q1-still-warm` Still Warm (8) | Some nuclei change on their own and give off radiation; the rate depends only on how many such nuclei there are, not on heat, cold or chemistry, and the radiation's energy warms what stops it. | counter rig (`ncount`), nucleus view (`nnuc`) | s4/s5: chilling the ore to −40 °C does **not** slow its counts. Wrong model: radioactivity is like a chemical reaction, slower when cold. | The Warm Cylinder (Bellows' clue): why do the Fifth's ore drums stay warm with no fire under them? Lead: "The Fifth's ore drums stay warm with no fire under them, and Vess wants to know why." Filed: the drums are warm because their nuclei decay, and no cold slows it. | `unit01/q2-core`, `unit01/q4-ledger` | radiation, radioactive, background radiation, radioactive decay, count rate |
| 2 | `q2-what-comes-off` What Comes Off (8) | Three radiations come off: alpha (heavy, +2), beta (an electron), gamma (energy, no charge). Charged plates sort them by charge; a charged particle tears electrons off every atom it passes, so it stops soon; gamma, uncharged, goes furthest. | counter rig with plates and shield slot | s4/s5: the **lightest** thing, gamma, goes furthest and the heavy alpha the least. Wrong model: the biggest, heaviest particle punches through most. | What leaks out of the Fifth's drums, and what will stop it? Lead: "Something leaks through the Fifth's drum walls, and Vess needs to know what will stop it." Filed: the drums leak gamma rays; only thick lead or concrete holds them. | `q1-still-warm` | alpha particle, beta particle, gamma ray, ionize |
| 3 | `q3-equations` Balancing the Nucleus (8) | A decay is written as a nuclear equation in which mass numbers and atomic numbers each add up the same on both sides; each kind of decay moves a nucleus a fixed step on the chart of nuclides. | nucleus view (`nnuc`), chart of nuclides (`nchart`, tap a square) | s2/s3: beta decay **raises** the atomic number. Wrong model: losing an electron leaves the element unchanged (or lowers it). | The Fifth's slag holds elements the ore never held. Lead: "The Fifth's slag holds elements its ore never had, and Vess wants to know where they came from." Filed: each decay makes a new element, step by step, from uranium down to lead. | `q2-what-comes-off`, `unit01/q4-ledger` | nuclear equation, positron, positron emission, electron capture, decay series |
| 4 | `q4-stability` Which Nuclei Last (8) | Stable nuclei lie in a band on the chart; heavy ones need more neutrons than protons because every proton pushes on every other while the strong nuclear force holds only touching nucleons; a nucleus off the band decays toward it. | chart of nuclides with the stable squares filled, a nucleus view of pushes and holds | s2/s3: stable heavy nuclei hold **more** neutrons than protons. Wrong model: a stable nucleus holds equal numbers. | Which of the Fifth's made isotopes will keep, and which will decay in its store? Lead: "The Fifth stores made isotopes, and Vess wants to know which of them will keep." Filed: the Fifth's store is full of nuclei off the band; they cannot keep. | `q3-equations` | band of stability, strong nuclear force, neutron-to-proton ratio |
| 5 | `q5-half-gone` Half Gone, Then Half Again (8) | In each half-life half of the nuclei still there decay, whatever the amount; the count falls by halves, never to zero in a whole step; ln of the amount falls in a straight line (first order). | decaying sample (`ndecay`: a grid of nuclei, a clock, a plot) | s2/s3: after **two** half-lives a **quarter** is left. Wrong model: two halves make a whole, so it is all gone. | How long has the Fifth been running the works? Lead: "Vess wants to know how long the Fifth has been working this crater." Filed: the slag's clock says the works have run for decades, not months. | `q1-still-warm`, `unit11/q3-time` | half-life (recap, glossed in this world), rate constant (recap), radiocarbon dating |
| 6 | `q6-shortfall` The Missing Weight (8) | A nucleus weighs less than its parts; the missing mass is the energy that binds it (E = mc²); nuclei near iron are bound tightest, so splitting a heavy nucleus or joining light ones releases energy; a chain reaction runs when each fission causes one more. | precision balance (`nscale`), binding-energy curve (`ncurve`), chain chamber (`nchain`) | s1/s2: helium-4 weighs **less** than two protons and two neutrons. Wrong model: a whole weighs exactly the sum of its parts. | Where the Core gets its power, and what made the craters. Lead: "The Core runs with no fuel line, and Vess wants to know what powers it." Filed: the Core splits uranium; one runaway chain made these craters. | `q3-equations`, `q4-stability` | mass defect, MeV, binding energy, binding energy per nucleon, fission, chain reaction, critical, fusion |
| B | `boss-core` The Transmutation Core (5) | Re-test on new cases. No new idea. | all of the above | none | The Core on the great crater's floor | all six | none |

## 3. Stage tables

**How to read a row.** *Objective* is the prompt (≤ 25 words, a question). *Evidence* is what on the bench lets a student who does not know the answer work it out. *Prints* is everything the bench shows as text or number, with the check that none of it is the answer. *Wrong → miss* gives the plausible mistakes and what each refusal names. *Reward* is the card's gist (built ≤ 40 words). `B:` is a briefing (≤ 2 sentences). Hints follow the ladder (1 where to look, 2 what to compare, 3 how to reason) and are read back with `node tools/teaching-report.mjs unit14 --read`. Every instrument here is flat: a counter's tracks, a chart, a plot and a balance are diagrams; a nucleus is drawn as a packed disc of counted protons and neutrons, square-on (its spatial shape is not the idea). Reward models of light nuclei use the shared `atom` model (protons and neutrons counted, "not to scale").

### `q1-still-warm` Still Warm

| # | Stage | Objective | Evidence on the bench | Prints (leak check) | Wrong → miss | Reward |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | The Clicking Ore | B: a counter clicks once for each bit of radiation (energy or a particle thrown out of an atom) that reaches its tube; a few clicks always come from the surroundings. "Which ore sample gives off radiation of its own?" | Counter rig, Sample slot, two ore cards (A uranium ore, B iron ore) and an empty-slot count. In the window, tracks leave some atoms of A and reach the tube; B shows none. | Counts per minute after each count (A 1,860, B 25, empty 24). No sample is named as uranium. | B → "Ore B counted about what the empty slot counts." | Ore A: it counted far above the empty slot. A substance that gives off radiation on its own is radioactive. |
| 2 | Clicks From Nowhere | "With nothing in the Sample slot, where does most of the counter's radiation come from?" | Empty rig; a "Lead Housing" key closes 5 cm of lead round the tube. Open 24 counts per minute, housed 4. Window shows tracks arriving from outside the rig. Three statements. | Counts. Statements: "The counter itself", "Rock, air and space around the counter", "The ore samples in the store" (the store is drawn shut in lead). | "The counter itself" → "Inside the lead the counter still works, and its count fell from 24 to 4." "The samples" → "The samples are sealed in the lead store, and the count fell when the lead closed round the tube." | From outside the counter: rock, air and space. This steady trickle is background radiation, and every count includes it. |
| 3 | Which Element Now | "One uranium atom in the ore gives off radiation: what element is it afterwards?" | Nucleus view: a nucleus of 92 protons and 146 neutrons, each drawn and counted; "Watch the Nucleus" throws out a particle of two protons and two neutrons; the count then reads 90 protons, 144 neutrons. A plate lists atomic numbers 88 to 92 with names. Three statements. | Counts before and after (the evidence); the plate (the key to read it with). | "Still uranium" → "The nucleus now holds 90 protons; uranium has 92." "Uranium, as an ion" → "The particle came from the nucleus, and the protons changed, not the electrons." | Thorium: the nucleus lost two protons, and the number of protons decides the element. A nucleus changing on its own and giving off radiation is radioactive decay. |
| 4 | The Cold Drum (predict) | "The ore is chilled from 20 °C to −40 °C: what do you expect its count to do?" | Lead clip: a fizzing tablet in warm and in ice-cold water (a chemical reaction slows when cold). Cards: falls a lot / stays the same / rises. | Clip caption. | ungraded | Prediction recorded. |
| 5 | The Cold Count | "Does chilling the ore change how often its nuclei decay? You predicted …" | Rig with a temperature key (−40, 20, 300 °C). The window shows the ore's atoms moving slowly or fast with temperature; nuclei decay as often at each. Counts 1,846 / 1,860 / 1,838 (one minute each; two counts at one temperature differ by as much). Three statements. | Counts per temperature. | "It falls" → "At −40 °C it counted 1,846, and at 20 °C 1,860: two counts at 20 °C differ as much." (or "not counted at −40 °C") | It stays the same. Cold slowed the atoms' motion; the nuclei decayed as often, because heat and cold reach the atoms and their electrons, not the nucleus. |
| 6 | Twice the Ore | B: the count rate is the number of counts each minute. "What would 5 g of this ore count in one minute?" (typed) | Rig with 1 g and 2 g cards of the same ore; the window draws twice as many atoms for 2 g and twice as many tracks. Counts 1,860 and 3,696. Entry field. | Counts for 1 g and 2 g only; 5 g is not a card (past the samples). | 1,860 → "That is what 1 g counted."; 3,720 (2 × 1,860) → "Two grams counted 3,696 on the bench." (accepted if inside 2 %? No: 3,720 is 5 g? no; it is the 2 g slip); 7,440 → "4 g would count that." | About 9,200: five times the nuclei, five times the decays. The count rate rises in step with the number of radioactive nuclei. |
| 7 | Where the Warmth Comes From | "Why does a sealed drum of this ore stay warmer than the deck around it?" | Drum view: a sealed drum with a thermometer; the window shows tracks stopping in the drum's steel and in the ore, and the atoms round each stop moving faster (shaken harder). The drum's oxygen gauge stays full (nothing burns). Three statements. | Drum 34 °C, deck 9 °C; oxygen "unchanged". | "The ore burns slowly" → "The oxygen in the sealed drum has not fallen." "It kept its heat from the mine" → "A drum of iron ore stored beside it has cooled to the deck's 9 °C." | Radiation stopped in the drum gave its energy to the atoms there. The drum stays warm as long as its nuclei go on decaying. |
| 8 | The Sealed Drums | "Which of three sealed drums holds radioactive ore?" | Three drum cards, each printed with its temperature: one hot (62 °C, heated by the Fifth's boiler), one at deck temperature (9 °C, the radioactive one), one warm (30 °C, plain iron ore in the sun). Rig. | Temperatures (the trap); counts after counting. | The hot drum → "Drum A counted 26: about the background." | Drum B, the cold one. Warmth is not the test: the counter is, and a decaying nucleus counts the same at any temperature. |

Stage 6's tolerance: accepted 9,020 to 9,390 (5 × 1,860 = 9,300 and 5 × 1,836 + 24 = 9,204 both pass). Slips kept as `SLIPS` and refused: 1,860; 3,696; 3,720; 7,440; 18,600.

### `q2-what-comes-off` What Comes Off

Sources are real: P is polonium-210 (alpha only), Q strontium-90 with its yttrium-90 (beta only), R cobalt-60 in a steel capsule that stops its own betas (gamma only); M is americium-241 (alpha and a low-energy gamma, 59.5 keV). Their names are not printed until the stage that earns them.

| # | Stage | Objective | Evidence on the bench | Prints | Wrong → miss | Reward |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Between the Plates | B: two charged plates stand either side of the beam, positive above and negative below; opposite charges attract. "Which source gives off radiation with no charge?" | Rig with plates on; three source cards P, Q, R. P's tracks bend a little toward the negative plate, Q's bend sharply toward the positive, R's run straight. | Counts; no charge printed. | P → "P's tracks bend toward the negative plate." Q → "Q's tracks bend toward the positive plate." | R: its tracks ran straight between the plates. Radiation with no charge and no mass, energy like light, is a gamma ray. |
| 2 | Toward the Positive Plate | "Which source throws out negatively charged particles?" | Same rig, same cards. | Same. | P → "P's tracks bend toward the negative plate." | Q: its particles bend toward the positive plate, so they are negative. Each is an electron thrown out of a nucleus: a beta particle. |
| 3 | Heavy and Positive | B: an alpha particle is two protons and two neutrons bound together, over 7,000 times as heavy as an electron, so the plates turn it far less. "Which of three new sources throws out alpha particles?" | Three fresh cards S, T, U (Am-241 shielded to its alphas, Sr-90, Co-60, shuffled). | Counts. | The beta source → "Its tracks bend toward the positive plate." The gamma source → "Its tracks run straight." | S: positive, and bent only a little. Each alpha particle is a helium-4 nucleus, ⁴₂He. |
| 4 | Through or Not (predict) | "Which do you expect to pass most easily through a sheet of paper and a slab of aluminium?" | Cards: alpha (heaviest), beta, gamma (no mass). No instrument. | none | ungraded | Prediction recorded. |
| 5 | Paper, Aluminium, Lead | B: a charged particle pulls on the electrons of every atom it passes and tears some off, which leaves a trail of ions; each one costs it energy. "Which radiation gets through 5 mm of aluminium? You predicted …" | Rig, shield slot, three shield cards (paper, 5 mm aluminium, 5 cm lead), sources α, β, γ. Window: α's trail of ions is dense and stops at the paper; β's sparser trail stops in the aluminium; γ makes a rare ion and passes. Counts. | Counts per source and shield. | α → "With aluminium in the slot, the alpha source counted 24, the background." β → "With aluminium, the beta source counted 39." | Gamma. Alpha's dense trail of ions stopped it in paper, beta's in aluminium; gamma, with no charge, ionizes rarely and goes furthest. Radiation that tears electrons off atoms is ionizing radiation. |
| 6 | Inside the Body | "Swallowed, which radiation does most damage to the cells right beside it?" | Tissue view (a strip of cells): each source inside it; α's trail is short and dense, breaking many molecules in a few cells; β's runs a few millimetres with sparse breaks; γ crosses the strip with one or two. A break count per cell row. | Breaks per 0.1 mm of path (α ≈ 30, β ≈ 1, γ ≈ 0.1). | γ → "The gamma ray broke one molecule in the whole strip." β → "The beta trail broke a few molecules spread over many cells." | Alpha. Inside the body it spends all its energy within a few cells, breaking many molecules there; outside, the dead outer layer of skin stops it. |
| 7 | The Mixed Source | "Which radiations does source M give off?" | Rig with M and the three shields. M counts 2,000 open, 300 behind paper, 230 behind aluminium, 24 behind lead. Four statements. | Counts. | "Alpha only" → "Behind paper M still counted 300." "Beta and gamma" → "Paper took M from 2,000 to 300." "Alpha and beta" → "Behind aluminium M still counted 230." | Alpha and gamma: paper took most of it, and what passed the paper also passed aluminium and was stopped only by lead. |
| 8 | Three Sealed Sources | "Sort the three sealed sources X, Y and Z by the radiation each gives off." | Rig with shields, no plates. Trays Alpha, Beta, Gamma. | Counts. | A misfiled card → the counts that disagree, e.g. "Y counted 2,950 behind paper." | Shields alone told them apart: paper stops alpha, aluminium stops beta, and only thick lead slows gamma. |

### `q3-equations` Balancing the Nucleus

The chart of nuclides is drawn with protons (atomic number Z) across and neutrons (N) up; each square is one nuclide. Tapping a square answers the stage with that nucleus; the equation line writes it in.

| # | Stage | Objective | Evidence | Prints | Wrong → miss | Reward |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Alpha Decay | B: in a nuclear equation each nucleus is written with its mass number above and atomic number below, as ⁴₂He for an alpha particle. "Which nucleus is left when uranium-238 gives off an alpha particle?" | Nucleus view (92 p, 146 n counted; "Watch the Nucleus" throws out 2 p + 2 n and hides the counts after); chart Z 88–93, N 140–147; equation line ²³⁸₉₂U → ? + ⁴₂He. | Parent counts; the particle's counted parts; the tapped square's symbol. | ²³⁶₉₀Th-like slips → "On the right the mass numbers add to 236; on the left 238." | Thorium-234: 238 = 234 + 4 and 92 = 90 + 2. An equation in which both numbers balance is a nuclear equation. |
| 2 | Beta Decay (predict) | "Thorium-234 gives off a beta particle, an electron: what do you expect happens to its atomic number?" | Cards: falls by one / stays 90 / rises by one. No instrument. | none | ungraded | Prediction recorded. |
| 3 | Inside Beta Decay | "Which nucleus is left when thorium-234 gives off a beta particle? You predicted …" | Nucleus view: a neutron turns into a proton (its colour changes) and an electron leaves (⁰₋₁e). Chart, equation line. | Parent counts; the change drawn. | Th-234 → "A neutron became a proton, so the nucleus holds one more proton than thorium's 90." ²³³₉₀Th → "The mass numbers would add to 233; the left has 234." | Protactinium-234: a neutron became a proton and an electron left, so the mass number stayed 234 and the atomic number rose to 91. A tiny uncharged particle also leaves, which changes neither number. |
| 4 | A Positive Electron | B: a positron is an electron with a positive charge, ⁰₊₁e. "Which nucleus is left when fluorine-18 gives off a positron?" | Nucleus view (9 p, 9 n, every one drawn): a proton becomes a neutron and a positron leaves. Chart Z 6–10. | As above. | ¹⁸₁₀Ne → "A proton became a neutron, so the nucleus holds fewer protons than fluorine's 9." | Oxygen-18: a proton became a neutron, so the atomic number fell to 8 and the mass number stayed 18. That is positron emission. |
| 5 | Pulled In | "Beryllium-7's nucleus pulls in one of its own innermost electrons: which nucleus is left?" | Nucleus view (4 p, 3 n): an electron from the innermost shell falls in; a proton becomes a neutron. Chart Z 2–6. | As above. | ⁷₅B → "The electron joined a proton, which became a neutron." | Lithium-7: the captured electron turned a proton into a neutron, as positron emission does, without throwing anything out. That is electron capture. |
| 6 | Only Energy | "Technetium-99m gives off a gamma ray: which nucleus is left?" | Nucleus view: the nucleus settles and a gamma ray leaves; nothing else moves. Chart Z 41–45. The "m" is glossed on the view: the nucleus holds extra energy. | As above. | A neighbour square → "The gamma ray carried no protons and no neutrons away." | Technetium-99, the same square: a gamma ray carries energy only, so neither number changed. |
| 7 | Uranium to Lead | "Which alpha and beta steps take uranium-238 down to lead-206?" | Chart Z 80–93, N 122–147 with uranium-238 and lead-206 marked; "Alpha" and "Beta" keys move a marker one decay at a time and draw its path. The marker's square is the answer. | The marker's nuclide; the number of each step taken (the student's own count). | Marker on ²¹⁰₈₂Pb → "The marker stands on lead-210, not lead-206." Marker off the chart → "The marker left the chart." | Eight alpha and six beta steps: each alpha lowers the mass number by 4, and nothing else changes it. This chain of decays is a decay series. |
| 8 | Thorium to Lead | B (worked): uranium-235 to lead-207: the mass number falls 28 and only alpha changes it, 28 ÷ 4 = 7 alphas; they lower the atomic number by 14 to 78, so 4 betas raise it to 82. "How many alpha decays take thorium-232 to lead-208?" (typed) | The chart (Z 80–93) with thorium-232 and lead-208 marked; no keys. | The two nuclides. | 24 → "24 is how far the mass number falls; each alpha takes 4." 4 → "4 betas: the question asks for alphas." 12 → "Twelve alphas would lower the mass number by 48." | Six: the mass number falls 24, and each alpha takes 4. |

### `q4-stability` Which Nuclei Last

| # | Stage | Objective | Evidence | Prints | Wrong → miss | Reward |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | The Stable Squares | B: on this chart a filled square is a stable nucleus, and the line marks equal protons and neutrons. "For elements up to calcium, how do the neutrons of a stable nucleus compare with its protons?" | Chart Z 1–20, N 0–28, stable squares filled, the N = Z line; tapping a square reads its symbol, protons and neutrons. Three statements. | Readings of tapped squares. | "About twice as many" → "Calcium-40 holds 20 protons and 20 neutrons." | About equal: they sit on or just above the line. The stable squares form a band of stability. |
| 2 | The Heavy End (predict) | "Lead-208 is stable and holds 82 protons: how many neutrons do you expect it holds, compared with its protons?" | Cards: as many / more / fewer. No instrument. | none | ungraded | Prediction recorded. |
| 3 | Pushes and Holds | B: every proton pushes on every other proton in the nucleus, but the strong nuclear force holds together only nucleons that touch. "Do stable heavy nuclei hold more neutrons, as many, or fewer than their protons? You predicted …" | Chart Z 1–83 with the band; a nucleus view of the tapped square draws its protons, lines for the pushes between them and short links for the holds between touching nucleons (the push lines grow far faster than the links as the nucleus grows). | Readings; the drawn counts of pushes and links. | "As many" → "Lead-208 holds 126 neutrons and 82 protons." | More: the band bends above the line. Extra neutrons add the strong nuclear force's hold without adding any push. |
| 4 | Too Many Neutrons | B: the chart's legend shows where each decay moves a nucleus: alpha two down and two left, beta one right and one down, positron one left and one up. "Which decay brings carbon-14, above the band, toward it?" | Chart Z 1–10 with carbon-14 marked above the band; the legend's three moves are the answer (tap one). | Readings. | Positron → "That move goes up and left, further from the filled squares." Alpha → "That move lands on beryllium-10, still above the band." | Beta decay: it turns a neutron into a proton, moving carbon-14 onto nitrogen-14, a stable square. |
| 5 | Too Few Neutrons | "Which decay brings oxygen-15, below the band, toward it?" | Chart Z 1–10, oxygen-15 marked; legend. | Readings. | Beta → "That move goes down and right, away from the band." | Positron emission: it turns a proton into a neutron, moving oxygen-15 onto nitrogen-15. Electron capture makes the same move. |
| 6 | Past Lead | "Polonium-210 holds 84 protons, more than any stable nucleus: which decay does it undergo?" | Chart Z 76–90 with the band ending at bismuth (83); polonium-210 marked; legend. | Readings. | Beta → "That move lands on astatine-210, further past the band's end." | Alpha: it takes away two protons and two neutrons at once, landing on lead-206. No nucleus with more than 83 protons is stable. |
| 7 | The Ratio | B (worked): iron-56 holds 26 protons and 30 neutrons: 30 ÷ 26 = 1.15 neutrons for each proton. "What is the neutron-to-proton ratio of stable gold-197?" (typed, two decimals) | Chart with gold-197 marked; tapping reads protons 79 and mass number 197 only. | Z and A (the neutrons are A − Z, worked by the student). | 2.49 → "That is 197 ÷ 79, which counts protons as neutrons." 0.67 → "That is protons per neutron." 1.00 → "Gold-197 does not sit on the line." | 1.49: 118 neutrons for 79 protons. Heavy stable nuclei hold about one and a half neutrons per proton. |
| 8 | The Fifth's Isotope | "A sealed vial holds a nucleus of 27 protons and 33 neutrons: which decay will it undergo?" | Chart Z 20–32; the vial's square is not marked (the student finds it); the legend. | Readings. | Positron → "Cobalt's stable square holds 32 neutrons; the vial's has 33." | Beta decay: one neutron more than cobalt-59, the stable one, so a neutron becomes a proton (cobalt-60 to nickel-60). |

### `q5-half-gone` Half Gone, Then Half Again

The grid holds 256 nuclei of the sample (iodine-131, 8.0 days, unless said). Each nucleus decays at its own moment; the moments are spread so that the grid follows the large-sample law, and the bench says so ("a large sample; a few nuclei alone do not keep to it").

| # | Stage | Objective | Evidence | Prints | Wrong → miss | Reward |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Half the Nuclei | B: each nucleus has the same chance of decaying in any day, whatever has happened before. "How many days until half of the iodine-131 nuclei have decayed?" | Grid, clock ("Wait 1 Day", "Back"), nuclei left counted and plotted. The answer is the clock's setting. | Days, nuclei left (256 → 128 at day 8). | 16 days → "At 16 days 64 nuclei are left, a quarter." | Eight days: 128 of 256 left. The time for half of a radioactive sample to decay is its half-life. |
| 2 | Two Half-Lives (predict) | "After 8 days half the iodine-131 is left: how much do you expect is left after 16 days?" | Cards: none / a quarter / a half. No instrument. | none | ungraded | Prediction recorded. |
| 3 | Sixteen Days | "How much of the iodine-131 is left after 16 days? You predicted …" | Grid and clock to 24 days. Cards in a slot. | Days, nuclei left. | None → "At 16 days the grid still holds 64 nuclei." Half → "128 were left at day 8; at day 16 there are 64." | A quarter: in the second 8 days half of the 128 still there decayed. It falls by halves and never reaches zero in a whole half-life. |
| 4 | Big Sample, Small Sample | "Which takes longer to lose half its nuclei: 256 nuclei of iodine-131 or 64?" | Two grids side by side on one clock. | Days, nuclei left in each. | "The large one" → "At 8 days the large grid holds 128 and the small one 32: both halves." | Neither: both halved in 8 days. The half-life does not depend on how much there is, the mark of a first-order process. |
| 5 | Five Half-Lives | "How many of 256 iodine-131 nuclei are left after 40 days?" (typed) | Grid and clock to 24 days only (three half-lives). | Up to day 24. | 0 → "Each 8 days leaves half of what was there; it never empties in a whole step." 51 (256 − 5 × 41) → "That takes away the same number each time." 16 → "That is 32 days, four half-lives." | Eight: five halvings, 256 → 128 → 64 → 32 → 16 → 8. |
| 6 | The Rate Constant | B (worked): for first-order decay t½ = 0.693 / k; cobalt-60's half-life is 5.27 years, so k = 0.693 ÷ 5.27 = 0.132 per year. "What is iodine-131's rate constant, in per day?" (typed) | Grid with a plot of ln(nuclei left) against days: a straight line falling from ln 256; the plate prints t½ = 0.693/k. | The plot's axes; t½ is the student's own (stage 1). | 5.55 (8.02 ÷ 0.693... or 0.693 × 8) → "That multiplies the half-life by 0.693; the plate divides." 0.125 → "1 ÷ 8 is not 0.693 ÷ 8." | 0.0866 per day: the line falls by 0.0866 every day. The rate constant k fixes the half-life. |
| 7 | The Carbon Clock | B (worked): a living thing keeps the air's share of carbon-14 until it dies, then it halves every 5,730 years; a bone with half the living count is 5,730 years old. "How old is a bone whose carbon-14 counts one-eighth of a living bone's?" (typed) | Grid of carbon-14 nuclei and a counter: living bone 15.3 counts per minute per gram, the old bone 1.9. | Counts. | 5,730 → "That bone would count half the living count, 7.7." 11,460 → "That is two half-lives: a quarter." 45,840 → "That divides by eight half-lives." | 17,190 years: three half-lives, 15.3 → 7.7 → 3.8 → 1.9. Dating by carbon-14 is radiocarbon dating. |
| 8 | The Unlabelled Vial | "Which isotope is in the sealed vial?" | A plate of three half-lives (fluorine-18 1.83 h, technetium-99m 6.0 h, iodine-131 8.0 d); the counter and a clock in hours; counts at 0, 6, 12 h are 1,600, 800, 400. Cards to the slot. | Plate; counts at the student's chosen times. | F-18 → "In 6 hours the count only halved; fluorine-18 would have fallen to about a tenth." I-131 → "Iodine-131 would barely change in 12 hours." | Technetium-99m: the count halved every 6 hours. A half-life is the isotope's own signature. |

### `q6-shortfall` The Missing Weight

Masses in u, nuclear (electrons not counted) for the balance: proton 1.007276, neutron 1.008665, helium-4 nucleus 4.001506, deuterium nucleus 2.013553. Atomic masses for the fission sum (electrons balance): uranium-235 235.043930, barium-141 140.914403, krypton-92 91.926173. 1 u = 931.5 MeV.

| # | Stage | Objective | Evidence | Prints | Wrong → miss | Reward |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Whole or Parts (predict) | "Do you expect a helium-4 nucleus to weigh more, less, or the same as two free protons and two free neutrons?" | Cards. No instrument. | none | ungraded | Prediction recorded. |
| 2 | The Balance | "Does a helium-4 nucleus weigh the same as its parts? You predicted …" | Balance: tap "Add Proton" / "Add Neutron" to load the left pan; helium-4 sits in the right pan. Each pan prints its mass; the beam tips. Three statements. | Both masses (4.031882 and 4.001506 once loaded). | "The same" → "The pans read 4.031882 u and 4.001506 u." "More" → "The nucleus's pan is the lighter." | Less: 0.030376 u less. The mass a nucleus lacks against its separate parts is its mass defect. |
| 3 | Mass Into Energy | B (worked): E = mc², and 1 u of mass is 931.5 MeV of energy (an MeV is a unit of energy sized for one nucleus); deuterium lacks 0.002388 u, so 0.002388 × 931.5 = 2.22 MeV holds it together. "How much energy holds a helium-4 nucleus together, in MeV?" (typed) | The loaded balance from stage 2 (its two masses printed). A plate: 1 u = 931.5 MeV. | Masses; the plate. | 0.0304 → "That is the mass defect in u; the plate turns u into MeV." 3,756 → "That turns the whole 4.03 u into energy." | 28.3 MeV: the mass defect as energy. That energy is the binding energy, needed to pull the nucleus apart. |
| 4 | Held Tightest | B: binding energy per nucleon is the binding energy shared over the nucleons. "Which nucleus holds each of its nucleons most tightly?" | Curve of binding energy per nucleon against mass number (25 real nuclides); tap a point to read it; the answer is a tapped point. | The tapped point's name and value to one decimal. | Uranium-238 → "Uranium-238 reads 7.6 MeV; others read higher." Helium-4 → "Helium-4 reads 7.1 MeV; heavier ones read higher." | Iron-56 (8.8 MeV), with nickel-62 beside it. Nuclei near iron are the most tightly bound. |
| 5 | Splitting Uranium | B: when a slow neutron enters a uranium-235 nucleus, the nucleus can split in two. "Does splitting uranium-235 into barium-141 and krypton-92 give out energy or take it in?" | Chamber: "Fire Neutron" splits the nucleus, three neutrons fly; the balance weighs before (U-235 + n, 236.052595 u) and after (Ba + Kr + 3 n, 235.866571 u); the curve marks the three nuclei. Two statements. | Masses; curve points. | "Takes it in" → "After the split the pan reads 0.186 u lighter." | Gives it out: the pieces weigh 0.186 u less and sit higher on the curve. Splitting a heavy nucleus is fission. |
| 6 | The Chain | B: each fission frees three neutrons, and control rods soak up neutrons. "Of each fission's three neutrons, how many must the rods soak up for the reaction to hold steady?" | Chamber run generation by generation with the rods set to soak up none (1 → 3 → 9 → 27 fissions), one (1 → 2 → 4 → 8) or all three (1 → 0). Four statements 0 to 3. The setting that holds steady is not on the rods. | Fissions per generation. | 1 → "With one soaked up, each generation doubled: 1, 2, 4, 8." 0 → "With none, each generation tripled." 3 → "With all three soaked up, the reaction stopped after one fission." | Two: then each fission causes exactly one more. A self-running series of fissions is a chain reaction, and one that holds steady is critical. |
| 7 | Joining Hydrogen | "Which gives out energy: joining two hydrogen-2 nuclei into helium-4, or splitting helium-4 into two hydrogen-2?" | Balance: two deuterium nuclei (4.027106 u) against helium-4 (4.001506 u); the curve's two points (1.1 and 7.1 MeV). Two statements. | Masses; curve readings. | "Splitting" → "Two deuterium nuclei weigh 0.0256 u more than helium-4." | Joining them: helium-4 weighs less and sits far higher on the curve. Joining light nuclei is fusion, which powers the stars. |
| 8 | Neither Way | "Which marked nucleus can give out energy neither by splitting nor by joining?" | The curve with three unnamed marks: X (mass number 4), Y (56), Z (238). Answer: tap a mark. | Readings of the marks (one decimal). | X → "X sits low at the light end; joining such nuclei gives out energy." Z → "Z sits low at the heavy end; splitting it gives out energy." | Y, at the top of the curve: any change to it lowers the binding energy per nucleon, so it would take energy in. |

### `boss-core` The Transmutation Core (five phases, each a new case of an idea already taught)

| # | Phase | Re-tests | Objective | Evidence | Answer |
| --- | --- | --- | --- | --- | --- |
| 1 | The Vented Cans | `q1` s1, s5, s8 | "Which of the Core's three vented cans holds a radioactive sample?" | Counter rig; cans at 300 °C, 20 °C and −40 °C; the radioactive one is the frozen can. | the frozen can |
| 2 | The Leaking Cask | `q2` s5, s7 | "Which radiations does the Core's leaking cask give off?" | Counter, shields: open 3,200, paper 3,150, aluminium 900, lead 50 (beta and gamma: cobalt-60 unsealed). | beta and gamma |
| 3 | The Core's Fuel Line | `q3` s3 | "Which nucleus is left when sodium-24 in the coolant gives off a beta particle?" | Nucleus view, chart Z 9–14. | magnesium-24 |
| 4 | The Burned-Out Source | `q5` s5, s8 | "A cobalt-60 source (half-life 5.27 years) counted 3,200 per minute when sealed: how many years until it counts 400?" (typed) | Counter, plate t½. | 15.8 years |
| 5 | The Core Itself | `q6` s3, s5 | "How much energy, in MeV, does one fission of uranium-235 into barium-141, krypton-92 and three neutrons give out?" (typed) | Balance with before and after; plate 1 u = 931.5 MeV. | 173 MeV |

Foes come from `planFoe()` on the phase's own samples ("Transmutation cores": a can, a cask, a nucleus, a source, a fuel element); each is dispersed (its glow of filament dims and its plates part), never killed. Answer slots sit left of the foe's corner.

## 4. Kit plan

**Kit `nuke`** extends `HEAT_KIT` (cards, notes, slots, trays, plaques, typed entries). Each family file registers its kinds in `nuke-registry.js`; kinds are prefixed `n`. Every live fixture at `3D On` is the same moving picture laid on the plate (`liveDress`, the Lodestone and Thornmere method), so `3D Off` draws the same picture.

| Fixture / piece | File | What it is | Reads (pure, shared) | Tour words |
| --- | --- | --- | --- | --- |
| `ncount` counter rig | `nuke-count.js` | A Sample slot, an optional shield slot, optional charged plates, an optional temperature key and lead housing, a window that draws the sample's atoms and every track (bent by the plates, stopped by the shield, with its trail of ions), and a tube. "Count" counts one minute; the card keeps its count. | `countRead`; planner `countsOf(src, {shield, plates, temp, grams, housed})` | "Counter" |
| `nnuc` nucleus view | `nuke-nuc.js` | A nucleus drawn as counted protons and neutrons; "Watch the Nucleus" plays its decay (alpha, beta, positron, capture, gamma) with what leaves drawn and counted; counts after may be hidden. Optional push-and-hold drawing (bench 4). | `nucRead`; `decayOf(nuclide, mode)` | "Nucleus view" |
| `nchart` chart of nuclides | `nuke-chart.js` | A window of the chart (protons across, neutrons up), stable squares filled (optional), marks, an equation line, the legend of moves (tap a move), Alpha/Beta step keys (walk mode). Tap a square to read or answer. | `chartRead`; `stable(Z, N)`, `nuclide(Z, A)`, `stepOf(mode)` | "Chart of nuclides", "Moves on the chart" |
| `ndecay` decaying sample | `nuke-decay.js` | A grid of 256 (or 64) nuclei, a clock (Wait / Back), nuclei left, a plot (count, or ln of count). Two grids on one clock optional. | `decayRead`; `leftAt(N0, t, half)`, `decayTimes(N0, half, seed)` | "Decaying sample" |
| `ndrum` drum view | `nuke-count.js` | A sealed drum, thermometer, oxygen gauge, and the window of tracks stopping in the steel. | none (shows only) | "Drum" |
| `ntissue` tissue strip | `nuke-count.js` | A strip of cells with a source inside; each radiation's trail and its breaks per row. | `breaksOf(kind)` | "Tissue strip" |
| `nscale` balance | `nuke-scale.js` | Two pans; Add Proton / Add Neutron (tap) or fixed loads; masses printed to six decimals; the beam tips toward the heavier. | `scaleRead`; `massOf(...)` | "Balance" |
| `ncurve` binding-energy curve | `nuke-curve.js` | Points of binding energy per nucleon against mass number; tap a point to read and answer; marks may be unnamed. | `curveRead`; `bePerNucleon(name)` | "Binding-energy curve" |
| `nchain` chain chamber | `nuke-curve.js` | A block of uranium; "Fire Neutron" plays generations of fission, with the rods' setting (0, 1 or 3 soaked up). | `chainRead`; `generations(absorbed, n)` | "Chain chamber" |
| `nlead` clip | `nuke-lead.js` | A looping neighbouring case on a predict stage (`noRun`). | none | "Watch first" |
| `nchoice` | `nuke-choice.js` | Statements to tap (a hidden dial with a blank start). | `chosenIndex` | "Your answer" |
| `nsrc` source card | `nuke-count.js` | A card naming a sample (or a letter); it keeps its last count. | — | "Sample cards" |

**Data and their sources** (`src/learn/engine/nucdata.js`), each checked in Node against values typed in from the source (`tools/lib/cinderhalo/data-checks.mjs`), never against the code that produced them:

- Half-lives (NNDC NuDat / NUBASE2020): uranium-238 4.468 × 10⁹ y, thorium-234 24.1 d, iodine-131 8.02 d, technetium-99m 6.01 h, fluorine-18 109.8 min, cobalt-60 5.27 y, carbon-14 5,730 y (the conventional value; NUBASE gives 5,700 ± 30), polonium-210 138.4 d, strontium-90 28.8 y, americium-241 432 y.
- Decay modes and the uranium-238 series (8 α, 6 β⁻ to lead-206); thorium-232 to lead-208 (6 α, 4 β⁻); uranium-235 to lead-207 (7 α, 4 β⁻).
- Stable nuclides Z 1 to 83 (no observed decay; bismuth-209, whose half-life is 2 × 10¹⁹ years, is drawn stable and said so in the Tour): the table of stable isotopes (CRC Handbook / NuDat "stable" flag).
- Masses (AME2020, CODATA 2018): proton 1.007276 u, neutron 1.008665 u, helium-4 nucleus 4.001506 u, deuteron 2.013553 u; atomic: uranium-235 235.043930, barium-141 140.914403, krypton-92 91.926173; 1 u = 931.494 MeV (printed 931.5).
- Binding energy per nucleon (AME2020), printed to one decimal: H-2 1.1, He-4 7.1, Li-7 5.6, C-12 7.7, O-16 8.0, Fe-56 8.8, Ni-62 8.8, Kr-92 8.5, Ba-141 8.3, Pb-208 7.9, U-235 7.6, U-238 7.6 and 13 between.
- Shield transmission (NIST XCOM for gamma; CSDA ranges for alpha and beta): alpha 0 behind paper; strontium-90/yttrium-90 beta 0.97 through paper, under 0.005 through 5 mm aluminium; cobalt-60 gamma 0.93 through 5 mm aluminium, 0.05 through 5 cm lead; americium-241's 59.5 keV gamma 0.69 through 5 mm aluminium, 0 through 5 cm lead.

**Planners** (pure): `countsOf`, `decayOf`, `stepOf`, `stable`, `nuclide`, `leftAt`, `decayTimes`, `massOf`, `bePerNucleon`, `generations`, `breaksOf`. Counts carry a fixed, seeded scatter of about 1 % so two counts of one sample differ (real counting does), and the scatter never depends on temperature or chemistry.

**Simplifications, each said on the bench or under the model:** the plates bend alpha particles far more than real plates of that size would (said on the rig); the neutrino is named once and not drawn; the decaying grid follows the large-sample law exactly (said on the grid); the nucleus is drawn flat, not to scale; bismuth-209 counts as stable.

## 5. Glossary plan (`src/learn/glossary/cinderhalo.js`, registered in `glossary/index.js`)

`TERMS` (quest, stage, gloss): radiation (1,1), radioactive (1,1), background radiation (1,2), radioactive decay (1,3), count rate (1,6); gamma ray (2,1), beta particle (2,2), alpha particle (2,3), ionizing radiation (2,5); nuclear equation (3,1), positron (3,4), positron emission (3,4), electron capture (3,5), decay series (3,7); band of stability (4,1), strong nuclear force (4,3), neutron-to-proton ratio (4,7); half-life (5,1, glossed again for decay), radiocarbon dating (5,7); mass defect (6,2), MeV (6,3), binding energy (6,3), binding energy per nucleon (6,4), fission (6,5), chain reaction (6,6), critical (6,6), fusion (6,7).

`BANNED` stand-ins: rays (for radiation, outside "gamma ray"), glow, glowing, zap, nuke, atom-smash, hot (for radioactive), clicks per (count rate), weight (for mass), wants, prefers, happy, unstable atoms (the nucleus is what is unstable; "unstable" alone is allowed), split atoms (it is the nucleus).

`NEEDS` with primers: proton, neutron, nucleus, atomic number, mass number, isotope (Tallow; new primer `nucleons`); ion (Tallow; primer `ions`); rate constant, first order, half-life (Quicklight; new primer `firstorder`); natural logarithm (primer `log`).

## 6. The 3D site

### 6.1 The place

**Cinder Halo is a field of impact craters punched into a plain of black cinder, and you go down into it crater by crater, through cuttings in their rims, to the great crater where the Fifth's reactor stands broken open.** In the first ten seconds after landing the player stands on the north rim of the great crater with the planet's ring arcing across the sky, looks down a 15 m bowl to a cracked containment dome on its floor, and sees a cutting leading west off the landing apron toward the rim of a smaller crater.

### 6.2 The signature (claimed in `docs/plans/world-distinction-plan.md` section 6)

| Landform | Walk shape | Bench housing | Light |
| --- | --- | --- | --- |
| An impact-crater field: one great crater with smaller craters punched into its wall, each floor lower than the last | Down crater by crater: from the landing on the outer plain, through cuttings in the rims, spiralling inward and down round the great crater to its floor | Shielded cells: a thick concrete cell built into each crater's wall, entered by a dog-leg maze so no straight line runs from outside to the plate | Ash dusk under the planet's ring, which arcs across the sky; inside the cells, filament lamps only |

Checked against every other row: no other world is a crater field (Ember Reach descends one caldera wall by switchbacks; Lodestone one slot canyon to a pothole; Teeter terraces down one slope); none walks a spiral of separate bowls (Thornmere's chain climbs over open mounds; Lodestone is one path; Ember a switchback; Kettle one building); none houses benches in shielded cells entered by mazes (Quicklight's blast bunkers are banked with earth and entered straight; Ligar's chambers are mine drifts; Lodestone's are open alcoves).

### 6.3 Plan (x east, z north, metres; heights are crater floors)

The great crater G is centred at (0, −12), its floor a disc of radius 24 at −15.0. The outer plain stands at about +3. Every crater floor is flat; outside the walk the ground rises as the crater's wall (a steep fall-off curve), so the walk is always the lowest ground near it. The height field is the lowest of: the plain, each crater's floor plus its wall rise, each cutting's floor plus its wall rise.

| Part | Centre (x, z) | Floor radius | Floor | What stands on it |
| --- | --- | --- | --- | --- |
| L Landing | (0, 70) | 24 | 0.0 | pad at (0, 78), spawn (0, 58) facing south |
| Apron (cutting) | (0, 46) to (0, 31) | half-width 5 | 0.0 | the overlook onto G |
| C1 | (−64, 25) | 18 | −2.0 | Bench 1, the drum store |
| C2 | (−66, −36) | 18 | −4.5 | Bench 2, the shield cell |
| C3 | (−23, −76) | 18 | −7.0 | Bench 3, the beam target hall |
| C4 | (38, −66) | 18 | −9.0 | Bench 4, the separation hall |
| C5 | (64, −12) | 18 | −11.0 | Bench 5, the cask vault |
| C6 | (44, 25) | 18 | −12.5 | Bench 6, the fuel-pool hall |
| G floor | (0, −12) | 24 | −15.0 | the Core: arena player (0, 2), boss (0, −16) |

Cuttings (half-width 3.5, floor falling evenly between the two floors): L–C1, C1–C2, C2–C3, C3–C4, C4–C5, C5–C6, C6–G. The walk is the union of the discs, the apron and the cuttings; everything else rises, closed by colliders on every grid cell outside the walk that touches it. Extent of the walk: x −84 to 82, z −94 to 94. Route in bench order: spawn → L → L–C1 → Bench 1 → C1–C2 → Bench 2 → … → Bench 6 → C6–G → the Core.

### 6.4 Section along the main route

Spawn 0.0 → Bench 1 −2.0 → Bench 2 −4.5 → Bench 3 −7.0 → Bench 4 −9.0 → Bench 5 −11.0 → Bench 6 −12.5 → the Core −15.0. Bench ground spans −2.0 to −12.5: **10.5 m**. Every cutting is a grade of 3 to 15 %.

### 6.5 The rooms

Every cell holds the bay envelope empty, measures 12.4 × 12.4 m inside with 5 m clear over the plate, is covered by the shared cover mask (`src/three/lib/cover.js`), and hangs its own two lamps from the world's `LampPool`. Its front wall carries a vestibule whose outer opening is on its side: a dog-leg maze, 3 m wide, the guide's route through it. The cell stands at the back of its crater, its back against the crater wall, which rises above its roof within a few metres. Each faces the floor's middle, where the cutting arrives.

1. **Bench 1, the drum store (Still Warm).** A barrel-vaulted store of ore drums: drums racked two high behind the plate and down the left wall, a counter cabinet on the right. The vault is built of precast arch ribs. The ore that stays warm is stored here. Arrival: down the long cutting from the landing, the first crater, the store's vestibule straight ahead.
2. **Bench 2, the shield cell (What Comes Off).** A hot cell: behind the plate a wall of stacked lead bricks with a thick viewing window and two manipulator arms through it into the sealed cell beyond; shielding slabs of three thicknesses racked on the right. Flat slab roof on beams. Where radiation is stopped.
3. **Bench 3, the beam target hall (Balancing the Nucleus).** An accelerator's beam pipe comes through the back wall on its magnets to a target block behind the plate: nuclei are made here. A stepped roof, higher at the back, over the magnets.
4. **Bench 4, the separation hall (Which Nuclei Last).** The tallest cell (7 m): a row of tall centrifuge columns down each side behind the plate, with their header pipes overhead, where nuclei of different masses are sorted. Trussed roof.
5. **Bench 5, the cask vault (Half Gone).** A low wide vault with three ranks of dry-storage casks (vented cylinders) behind the plate, where spent fuel waits out its half-lives; air slots in the back wall. Flat roof on deep beams.
6. **Bench 6, the fuel-pool hall (The Missing Weight).** A raised pool tank behind the plate (its rim 1.2 m high, water inside it, fuel racks under the water), a gantry crane rail over it above 2.4 m. Where the fuel that is split is kept. Monitor roof.

The Core (boss ground, not a cell): on the great crater's floor, a containment dome split open, its reactor vessel exposed, a ring of fallen roof plates; open level ground in front of it.

### 6.6 How it differs from each neighbour

- Tallow: one flat pan to a mirror horizon; here no flat ground wider than a crater floor, and the horizon is crater rims.
- Lanternfall: ice and a frozen lake walked round; here dry cinder walked down into.
- Ligar: basalt hills entered by adits; here bowls entered over their rims, and the rooms are poured concrete.
- Bellows: decks over a cloud sea; here everything is ground, and the drop is into the next crater.
- Ember Reach: one caldera wall descended by switchbacks to a lava lake; here many separate bowls, each closed, descended in a spiral, and no lava.
- Mirrowen: quays and hulls on water; here no water outside the fuel pool.
- Kettle: inside one foundry building; here six separate cells in six craters.
- Teeter: terraces stepping down one slope; here round bowls.
- Verdigris: a drowned fort in reeds, fog under 40 m; here the great crater is seen across at once.
- Brinewire: a concrete wall along a marsh; here concrete only in the cells.
- Quicklight: a grid of alleys under pipe racks; here no grid, a spiral.
- Lodestone: a canyon you are inside, one path down; here open bowls with a sky ring overhead.
- Thornmere: mounds rising out of tar, rooms inside trees; here bowls sinking into cinder, rooms in concrete.

### 6.7 The far country (`phys: 'ambient'`)

North: the broken shell of a cooling tower on the plain. East: a line of transmission pylons, two of them fallen. South, beyond the great crater: the reactor's tall stack. West: a field of small craters with the grounded hull of a Fifth ship in one. Overhead: the planet's ring (in the sky dome).

### 6.8 Numbers to hold

`world-shape.mjs`: housed ≥ 4 of 6 (target 6 of 6), bench ground span ≥ 3 m (planned 10.5), no cloned coordinates, not one circle (the cells sit at 52 to 66 m from the great crater's centre, not on one radius), not two columns. Plates in view from the spawn: at most two (planned: none). Triangles < 900k, draws < 566 at T4.

### 6.9 File inventory (all new; there was no site)

`src/three/cinderhalo.js`, `src/three/cinderhalo/{site-plan,terrain,atmosphere,stations,plant}.js`, `tools/gen-cinderhalo-layout.mjs`, `src/three/world-data/cinderhalo.json`, `tools/verify-cinderhalo.mjs`, `tools/lib/cinderhalo/data-checks.mjs`. Shared layers used as they are: `src/three/lib/cover.js` (`makeCover`), `tools/lib/world-shape-checks.mjs`. Registered in `src/three/stage.js`, `src/three/voyage.js`, `src/learn/worlds3d.js`, `boss-arena.js` and the tools' world lists.

## 7. Pitfall review

**PRODUCT.md section 5, teaching leaks.** Idea in the reward: every row above has an Evidence entry on the bench, and every new idea a reward names (ionizing radiation, decay series, critical) is first seen on the bench (the trail of ions, the walked path, the steady generations). Decorative motion: every moving thing is what the student's key set going (a count, a decay, a clock, a weighing), and it differs between right and wrong (the tracks stop at the shield the student chose). Black box: no instrument prints the property asked for: the rig prints counts, not "alpha"; the chart prints nuclides, not "stable" (the filled squares are the data, the question is what they show or a new case); the curve is the binding energy per nucleon itself, asked as a location or a new case (the unnamed marks). Plate-and-type: every typed stage has the instrument behind it (the rig's counts, the grid, the chart, the balance). Two voices: glossary `BANNED`. Motives: none. Answer forms: direct (a count, a nucleus, a square, a number of decays). Hint leaks: ladder, read back in the audit. Prerequisites: `BUILDS_ON` and `NEEDS` primers. A plate prints the answer: q5 s8's plate prints three half-lives and the counts, and the answer is the match (a match of measured to listed is the only way to identify an isotope; the student measures it). Refusal states the rule: misses above name readings. Tray names: q2 s8's trays are alpha, beta, gamma, earned at s1 to s3. Term before taught: glossary stages. Model not held: each click's wrong model is one students hold (radioactivity slows with cold; heavier goes further; beta leaves the element unchanged; stable means equal numbers; two halves make a whole; a whole weighs its parts). Stages that repeat: q3 s4 to s6 are three different decays; q4 s4 and s5 are the two sides of the band. Story: one stake per bench.

**Operating the bench.** Cards go to one Sample slot, one shield slot or one answer slot, at least 60 units apart; every drag has its two-tap twin from the shared engine; keys are drawn on the fixture with their names; the clock steps one day per tap; taps on the chart's squares are at least 28 px at the smallest table (the chart windows are sized so); text at the kit's minimum sizes.

**Rendering at 3D On.** Live dress only (no slab over a painted display, no label in metres); fixtures with a key keep their bottom-right 8 units free; captions 30 units from the right edge.

**Teeter, Verdigris, Brinewire, Thornmere rows.** No reference trace drawn ahead of the clock; counts of the simulated grid follow the planner's law (said on the grid); zeros printed plainly; trays inside the table; lead lines name the stake, not the finding; kinds prefixed `n`; tolerances with a margin (`+ 1e-9`); one table per constant (`nucdata.js`); lead lines one sentence ≤ 20 words; hosts registered before play; words earned per bench; scripts set only what a hand changes; drawn pictures render at 667 × 375 in Node and are read.

**Wiring and process.** Stage counts in five places (6 × 8 + 5 = 53); bank ids new; shared engine changes opt-in and every world's script rerun; `dist/` not touched; commit only this world's files.

**`docs/world-rebuild-prompt.md` pitfalls.** Re-skinning: the landform is seven bowls and seven cuttings over 15 m of fall. A shed: each cell is built into its crater's wall, with the wall rising above its roof. Eight rooms that are one room: section 6.5, six different machines and roofs. Cramped room: 12.4 × 12.4 × 5 held by `verify:cinderhalo`. Bright room: a cover box per cell. Lost bench: a lamp post at every vestibule, the guide's route through the maze. Two floors: none. Light per lamp: `LampPool`. Scatter: props only inside cells, at the Core and in the far country. Shared code: used as is. Claiming a look: measurements and a viewing list only.

## 8. Build record

(appended as phases finish)

### State at 2026-11-14, end of the world build (branch `world/unit14`)

**Built:** `nucdata.js` (planners and data, held to source values by `tools/lib/cinderhalo/data-checks.mjs`); the `nuke` kit (counter rig with
shield slot, charged plates, temperature keys and lead housing; sealed drums; tissue strip; nucleus view with five decays and a
repulsion-and-hold drawing; chart of nuclides with pick, columns, walk and move modes and a live nuclear equation; decaying sample with
one or two grids, a clock and a count or ln plot; balance; binding-energy curve; chain chamber; answer list; lead clip) with Tour words for
every fixture and piece; six benches of 8 stages and the Transmutation Core (5 phases): 53 stages, all `live`. Each bench has its lead
line, its two bank problems (worked problems on `q3`, `q5`, `q6`), glossary terms, recap primers (`nucleons`, `firstorder`) and a debrief
story animation (`src/ui/story-scenes-cinderhalo.js`). The boss has an arena body (`buildCore` in `boss-models.js`), a bench body
(`foebody.js`, the Flare's, renamed, as the Coil's is), a portrait and lines (`foes.js`), a saga clue (`clue_cinderhalo_core`, "The Rod
Log") and the `boss-core` arena spot. The walkable site, layout generator, `verify:cinderhalo`, and the registrations in `stage.js`
(Cinder Halo joins the dark worlds whose flashlight is on by default), `voyage.js`, `worlds3d.js`, `boss-arena.js` and every tool's list.

**Where the build parted from the spec (sections 3 and 6):**

- `q2` s3's new sources are S (beta), T (alpha), U (gamma); the alpha source is a second polonium-210, not americium (whose gamma would
  have drawn straight tracks beside the bent ones).
- `q2` s5 and s8 carry no how-to note (no clear strip on a full table); the Tour and the rig's own foot line say how to count.
- `q4` s3 is titled *Repulsion and the Strong Force*; "push" and "hold" were stand-in words caught by the cold read.
- `q4` s4, s5, s6, s8: the chart no longer draws where a chosen move lands (it made a choice of three into a search); a miss names it.
- `q4` s7 reads gold-197's neutrons from the chart (the spec said only Z and A); the stage is the division, worked first on iron-56.
- `q5` s3 and s4 answer on a list, not cards; `q5` s7's bone count is a plate beside the grid; `q5` s8's clock steps one hour.
- `q6` s5 draws no curve (the balance is the evidence); `q6` s6's briefing says *a fission like the one you watched* frees three
  neutrons (uranium-235 averages about 2.4; the channel on the bench frees 3).
- Site: the arena moved to boss (0, −15, −12), player (0, 4) and the dome to (0, −26) so the fallen plates stay on the floor; the vestibule
  ends flush with the cell's side wall (8.6 m in the spec left a gap beside the room); the drum store's ribs are open cylinder segments.
- Commits: benches 1 to 3 and the site went in one commit (the slice and the next two benches were checked together before it).

**Measured (Node).** Before: Cinder Halo had no site (`world-shape.mjs` and `perf-worlds.mjs` listed no `cinderhalo`). After:

| | world-shape (ground, relief, housed) | perf-worlds (draws, k tris) |
| --- | --- | --- |
| cinderhalo | −12.50 to −2.00 m, 20.58 m, 6/6 (R8 R8 R8 R8 R8 R8) | 142, 152 |
| ligar (reference, unchanged) | −2.60 to 0.89 m, 21.55 m, 7/9 | 566, 867 |
| kettle (reference, unchanged) | −2.40 to 3.20 m, 5.60 m, 8/8 | 233, 113 |

No two worlds share bench coordinates. No plate is in view from the spawn. `glsl-check.mjs cinderhalo`: every patched shader compiles; the
sky shader (with the ring) was also compiled by hand with `glslangValidator`.

**Archived:** nothing (there was no site, and the four-quest draft chart was replaced in place; its ids and titles are recorded in the
chart file's header and in section 0).

**Not done:** no stage drawn to PNG (no Node canvas in the project); nothing seen in a browser; no stage played by a hand.

### The owner's 3D viewing list

1. **The spawn, facing south.** In view: the landing apron of packed ash, the cutting west toward the first crater with a lamp at its mouth,
   the planet's ring across the sky, and south the great crater's far rim and the reactor stack beyond it. Failure: a bench plate in view, a
   lit doorway visible from here, or the ring drawn as a glow.
2. **The tip of the overlook (0, 34), facing south.** In view: down a 15 m bowl to the split dome on a dark glassy floor. Failure: the bowl
   reads as a flat plate, or the edge has no wall and looks walkable.
3. **Halfway down the first cutting, facing west.** In view: crater walls banded by height on both sides, the first crater's floor opening
   ahead. Failure: the cutting reads as a road on a plain.
4. **Crater 1's floor, facing the drum store's vestibule.** In view: a concrete cell against the crater wall, rock rising above its roof,
   its vestibule opening at the side, a lamp post by it. Failure: a hut standing in the open.
5. **Inside the drum store at the plate, facing the back.** In view: the barrel vault on ribs, racks of drums two high behind and down the
   left. Failure: sky light inside, the vault open at its ends, the room cramped.
6. **The shield cell's plate, facing the lead wall.** In view: lead bricks, the dark window, two manipulator arms. Failure: an arm in the
   lean-in view.
7. **The target hall's plate, facing the back.** In view: the beam pipe through the back wall on its magnets to the target block, the stepped
   roof. Failure: the pipe overlapping the bench.
8. **The separation hall from its door.** In view: the tallest cell, two rows of tall columns with copper headers, trusses. Failure: columns
   closing the space across the plate.
9. **The cask vault's plate.** In view: two ranks of vented casks behind the plate, more down the left wall, air slots high in the back.
10. **The pool hall's plate.** In view: the raised pool with dark water and racks under it, the crane bridge over it, the monitor roof.
    Failure: the water drawn bright or see-through to the floor.
11. **The lowest cell (crater 6, −12.5 m) looking back up the cutting from crater 5.** In view: the descent; you should feel you have come
    down a long way from the landing.
12. **The Core's ground (0, 4), facing south.** In view: the split dome with the vessel standing in it, the rod drives, fallen roof plates to
    either side, the boss in front of the split. Failure: the boss inside the dome or a plate under its feet.

### Stages only the owner can judge by playing

- `q1` s5 (the cold count): whether a student trusts that 1,846 and 1,860 are "the same" when the rig scatters by about 1 %.
- `q2` s1 to s3: whether the bend of the alpha tracks is visible enough at phone size.
- `q2` s6: whether the tissue strip reads as cells and breaks.
- `q3` s7: whether fourteen taps feel like discovery or chores.
- `q4` s3: whether the drawn repulsion lines and holds read at all on a nucleus of 208 discs 44 units wide.
- `q4` s4 to s8: whether the legend's arrows are read as moves on a fine chart.
- `q5` s6, s7 and boss phases 4 and 5: whether the typed worked figures feel like understanding to a 12-year-old.
- `q6` s6: whether a student sees "holds steady" in the generation counts.
- The counter's foot line and the chart's equation line at 375 px landscape (measured only at 340 px and 812 × 375).
