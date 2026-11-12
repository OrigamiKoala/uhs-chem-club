# Cinder Halo (`unit14`): nuclear chemistry

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. This world is **not built**. The file is a lesson plan for a first build, written 2026-11-12 by a plan session to the same standard as the ten live worlds. No code was changed.

- **Session:** build session. One new fixture (the counter with shields) and one new view (the chain reaction); the rest is reuse.
- **What exists:** the chart `src/learn/worlds/unit14-nuclear-chemistry.js` (four placeholder quests); a stage list in `docs/plans/learn-quests.md` ("World 14", five quests of eight). No quest files, bank, glossary or checks.
- **Exam:** beyond the AP exam throughout. It must be followable by a 13-year-old, and "beyond the exam" appears nowhere in play text.
- **Story:** the last world on the road; the atom that Tallow said no chemical change can split is split here. The last bench's final stage carries the story's close in its debrief, not in its prompt.
- **To create:** `src/learn/quests/unit14/` (four benches and a boss), `src/learn/bank/unit14.json`, `src/learn/glossary/cinderhalo.js`, a `verify:cinderhalo` check, story animations, the 3D site.

## How this plan differs from the earlier stage list

- Five quests of eight become four benches and 24 stages plus a five-phase boss.
- "Which Nuclei Last" (the band of stability, magic numbers) is left out as a bench: it is a chart to memorise with nothing to act on. Its one usable idea, that a nucleus with too many neutrons turns one into a proton, is the evidence in `q2` stage 2.
- Half-life does not assume Quicklight was played: the bench finds the constant halving time itself.

## Instruments

| Need | Source | Size |
| --- | --- | --- |
| Charged plates that bend charged particles and not neutral ones | atom kit `field` (Tallow `q2` stage 3) | reuse; three kinds of track |
| A nucleus built from proton and neutron pieces, with charge and mass meters | atom kit particle scale, `needle`, `mass` (Tallow `q4`) | reuse |
| Cards that carry atomic number and mass number, laid on a strip | cards kit `element` with a mass number (Tallow `q3`) | reuse as nuclide cards (M) |
| A vessel of particles that change one way, with a graph of the count against time and ringed particles | `pans.js` pan (Teeter `q1` stage 3) | reuse with an irreversible change |
| A scale that reads to four decimal places in u | mass kit `scale` (Tallow `q6`) | reuse; precision option (M) |
| A flat graph with tap zones | `tapZones` on a `spectrum`-style plot | reuse for the binding-energy curve (M) |
| **Counter and shields** | new: a sample stand, a counter that clicks and totals counts over ten seconds, a slot for a sheet (paper, aluminium, lead), and a distance dial | **L (small)** |
| **Chain view** | new view in the pan painter: a lump of nuclei; a neutron splits one, which throws out more neutrons; in a small lump most leave through the edge | **M** |

## Bench-level sequence

| Bench | Idea | Terms it introduces (gloss) |
| --- | --- | --- |
| `q1-comes-off` What Comes Off (6) | Some nuclei are unstable and throw out particles or rays: three kinds, told apart by what stops them and how charged plates bend them. | radioactivity, alpha particle, beta particle, gamma ray |
| `q2-equations` Nuclear Equations (6) | A decay changes the nucleus into another element; mass number and atomic number each add up across the arrow. | nuclide, mass number (recap), nuclear equation, positron, decay series |
| `q3-half-gone` Half-Life (6) | No one can say when one nucleus will decay, yet a large sample halves in a fixed time. | half-life, radiocarbon dating |
| `q4-shortfall` The Missing Mass (6) | A nucleus has less mass than its particles weighed apart; the missing mass is the energy that binds it, and it is released when nuclei split or join toward iron. | mass defect, binding energy, fission, chain reaction, critical mass, fusion |
| `boss` (5 phases) | Re-test. No new idea. | none |

Recaps at first use: proton, neutron, atomic number, mass number and isotope (`q1` stage 4 and `q2` stage 1, from Tallow); charge and charged plates (`q1` stage 3).

## Plan rows

"Texts" gives the final prompt (P), the briefing (B) where the stage needs one, and the reward (R).

### `q1-comes-off` What Comes Off (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Clicks | Some substances give off something that a counter detects, with nothing done to them. | Three samples on the stand in turn; the counter clicks at uneven moments and totals ten seconds. | B: "The counter clicks once for each particle or ray that enters it." P: "Which sample gives off the most radiation?" R: "The clicks come without heating or mixing anything. A substance whose nuclei throw out particles or rays by themselves is radioactive." | **counter** |
| 2 | What Stops It | Paper stops one kind of radiation, aluminium a second, and only thick lead the third. | One sample at a time; a sheet in the slot; the count with each sheet. Three samples, each giving one kind. | B: "Radiation comes in three kinds. Alpha is stopped by paper, beta by a sheet of aluminium, and gamma only by thick lead." P: "Which kind of radiation does each sample give off?" Trays: "Alpha", "Beta", "Gamma". | counter, sheets |
| 3 | Between the Plates | Alpha is positive, beta negative, gamma has no charge. | Each sample's beam passes between charged plates: one track curves gently toward the − plate, one sharply toward the + plate, one goes straight. | P: "What charge does each kind of radiation carry?" Trays: "Positive", "Negative", "None". R: "Alpha bends toward the − plate, so it is positive; beta bends the other way and further, so it is negative and much lighter; gamma is not bent." | atom kit `field` |
| 4 | What an Alpha Is | An alpha particle is two protons and two neutrons: a helium nucleus. | Proton and neutron pieces; a charge meter and a mass meter; a plate giving the alpha particle's charge, +2, and mass, 4. | P: "Which particles make up an alpha particle?" (the built nucleus is the answer). R: "Two protons and two neutrons, the nucleus of helium. A beta particle is an electron, and a gamma ray is light of very high energy." | atom kit, `needle`, `mass` |
| 5 | Further Away | Radiation spreads out, so the count falls quickly with distance. | Distance dial at 10, 20 and 40 cm; the ten-second count at each; a picture of rays spreading from the sample. | P: "When the counter is moved twice as far from the sample, what happens to the count?" Cards: "It halves", "It falls to a quarter", "It stays the same". R: "A quarter: the same rays are spread over four times the area." | counter with distance |
| 6 | An Unlabelled Sample | A sample can give off more than one kind. | A sample that gives alpha and gamma; sheets and counter. | P: "Which kinds of radiation does this sample give off?" (two tags to lay). | counter, sheets, tags |

### `q2-equations` Nuclear Equations (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Losing an Alpha | Alpha decay lowers the mass number by 4 and the atomic number by 2, making a different element. | A nucleus drawn as protons and neutrons throws out two of each; nuclide cards carry mass number above and atomic number below. | B: "A nuclide is a nucleus with a given number of protons and neutrons, written with its mass number above its atomic number: ²³⁸₉₂U." P: "Which nuclide is left when uranium-238 gives off an alpha particle?" R: "Thorium-234: four fewer in mass number, two fewer protons. The atom has become a different element." | nuclide cards (M), nucleus view |
| 2 | A Neutron Changes | In beta decay a neutron becomes a proton and an electron leaves: the atomic number rises by 1. | Carbon-14's nucleus, with more neutrons than protons: one neutron turns into a proton and an electron flies out. | P: "Which nuclide is left when carbon-14 gives off a beta particle?" R: "Nitrogen-14: the mass number is unchanged and there is one more proton. A nucleus with too many neutrons becomes more stable this way." | nuclide cards, nucleus view |
| 3 | Both Rows Add Up | In a nuclear equation the mass numbers add up on each side, and so do the atomic numbers. | An equation with one blank; cards for α (⁴₂He), β (⁰₋₁e), γ and a neutron (¹₀n). | B: "A nuclear equation writes a decay with each particle's mass number and atomic number, so that each row adds up across the arrow." P: "Which particle completes this equation?" | cards, slot |
| 4 | The Other Way | A nucleus with too few neutrons turns a proton into a neutron, giving off a positron. | Sodium-22's nucleus: a proton becomes a neutron and a positive particle leaves. | B: "A positron is a particle with the mass of an electron and a charge of +1." P: "Which nuclide is left when sodium-22 gives off a positron?" R: "Neon-22: the mass number is unchanged and there is one fewer proton." | nuclide cards, nucleus view |
| 5 | Gamma | A gamma ray carries away energy and changes neither number. | A nucleus gives off a ray and stays as it was. | P: "What happens to a nucleus's mass number and atomic number when it gives off a gamma ray?" Cards: "Both fall", "Only the mass number falls", "Neither changes". | nucleus view, cards |
| 6 | Step by Step to Lead | A heavy nucleus reaches a stable one through a series of decays. | A strip from uranium-238 to lead-206 with each step's card laid as α or β is chosen; the mass number and atomic number update. | P: "How many alpha particles are given off between uranium-238 and lead-206?" (marker; the strip is there to test it). R: "Eight: the mass number falls by 32, four at a time, since beta decay does not change it. The whole run is a decay series." | cards strip, `marker` |

### `q3-half-gone` Half-Life (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Which One Next? (predict) | A guess: can one nucleus's decay be foretold? | Lead clip of a sample decaying. Three cards. | P: "Eight nuclei in a sample are ringed: can you tell which will decay next?" Cards: "The oldest", "The one nearest the edge", "It cannot be told". | `lead`, cards |
| 2 | Chance | Each nucleus decays by chance, at no set time. | Run the sample several times: the ringed nuclei decay in a different order each run. | P: "What decides when a single nucleus decays?" Cards: "How long it has existed", "Its neighbours", "Chance alone". R: "The order was different every run. Nothing about a nucleus says when it will decay; only the chance each second is fixed." | pan with ringed particles |
| 3 | Half, Then Half Again | A large sample halves in the same time, again and again. | A sample of 800; the graph of nuclei left; markers print the time at 400, 200 and 100. | P: "How does the time for the second halving compare with the first?" Cards: "Longer", "The same", "Shorter". R: "The same each time. That time is the half-life, and each radioactive nuclide has its own." | pan, graph, cards |
| 4 | What Is Left (typed) | After n half-lives, (½)ⁿ of the sample is left. | A sample with its half-life printed; the asked time is past the plot. | B worked line: "After 2 half-lives, ½ × ½ = ¼ is left." P: "What fraction of the sample is left after four half-lives?" The field accepts 1/16 or 0.0625. | pan, entry |
| 5 | Dating a Bone (typed) | The fraction of carbon-14 left tells how long ago a living thing died. | A living sample and an old bone on the counter: the bone gives a quarter of the count. A plate with carbon-14's half-life, 5,730 years. | B: "A living thing keeps a steady share of carbon-14. When it dies no more is taken in, and what it has decays." P: "How long ago did the animal this bone came from die?" R: "A quarter is left, so two half-lives have passed: about 11,460 years. This is radiocarbon dating." | counter, `plaque`, entry |
| 6 | The Right Half-Life | A use needs a half-life that suits its length. | Three nuclide cards with half-lives of six hours, eight days and thirty years; each can be run on the graph over one day. | P: "Which nuclide suits a medical scan that takes an afternoon?" R: "The six-hour one: it gives a strong count during the scan and is nearly gone in two days. A thirty-year nuclide would stay in the body." | cards, pan |

### `q4-shortfall` The Missing Mass (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Lighter Together? (predict) | A guess. | Three cards. | P: "A helium nucleus is weighed, then its two protons and two neutrons are weighed apart: which is heavier?" Cards: "The nucleus", "The four particles apart", "They are equal". | cards |
| 2 | Weighing It | A nucleus has less mass than its particles weighed apart. | Precision scale: two protons and two neutrons read 4.0319 u; the helium nucleus reads 4.0015 u. | P: "How does the mass of a helium nucleus compare with the mass of its four particles apart?" R: "The nucleus is lighter by 0.0304 u. The mass that is missing is the mass defect." | mass kit `scale` (precision) |
| 3 | Mass Into Energy (typed) | The missing mass left as energy when the nucleus formed; that energy holds it together. | The two readings; a plate: "1 u of mass is 931.5 MeV of energy" with MeV glossed as a unit of energy for single particles. | B: "Mass and energy can turn into each other. The energy given out when a nucleus forms from its particles is its binding energy." Worked line (another nucleus): "mass defect 0.0024 u × 931.5 = 2.2 MeV". P: "What is the binding energy of the helium nucleus, in MeV?" | scale, `plaque`, entry |
| 4 | The Curve | Binding energy for each particle in the nucleus rises to a peak near iron and then falls. | A flat curve of binding energy for each nucleon against mass number, with a few nuclei marked. Tap the most tightly bound. | B: "A nucleon is a proton or a neutron. The curve shows how much binding energy each nucleon has in nuclei of different sizes." P: "Which nucleus is the most tightly bound?" R: "Iron-56, at the top of the curve. Nuclei much lighter or much heavier are less tightly bound." | plot, `tapZones` |
| 5 | Splitting and Joining | Splitting a very heavy nucleus, or joining very light ones, moves up the curve and releases energy. | The curve with three marked changes: uranium splitting into two middle-sized nuclei, two hydrogen nuclei joining, iron splitting. Each is drawn as an arrow along the curve. | B: "Splitting a nucleus is fission and joining two is fusion." P: "Which changes release energy?" Trays: "Releases energy", "Takes energy in". R: "Fission of uranium and fusion of hydrogen both end nearer the peak, so both release energy. Splitting iron would take energy in." | plot, cards |
| 6 | One Sets Off the Next | Each fission frees neutrons that can split more nuclei; in a large enough lump the reaction grows. | A lump of uranium nuclei with a size dial: one neutron fired in. In a small lump most freed neutrons leave through the edge and the count of fissions dies; in a large one it climbs. | P: "What happens to the number of fissions when the lump is made larger?" Cards: "It dies away sooner", "It grows by itself", "It is unchanged". R: "In a large lump each fission's neutrons cause more than one more fission: a chain reaction. The least mass at which that happens is the critical mass." | **chain view**, cards |

### Boss (5 phases)

| # | Phase | Re-tests | Design |
| --- | --- | --- | --- |
| 1 | The Sheet | `q1` stages 2 and 3 | A sealed sample, sheets and plates. P: "Which kind of radiation does the sealed sample give off?" |
| 2 | The Blank | `q2` stage 3 | An equation with a blank nuclide. P: "Which nuclide completes this equation?" |
| 3 | The Count (typed) | `q3` stage 4 | A count now and the half-life. P: "What will the count be after three half-lives?" |
| 4 | The Scale (typed) | `q4` stages 2 and 3 | Readings for a new nucleus. P: "What is this nucleus's binding energy, in MeV?" |
| 5 | The Curve | `q4` stage 5 | The curve and one change. P: "Does joining two helium nuclei release energy or take it in?" |

## Glossary (`src/learn/glossary/cinderhalo.js`)

`TERMS` as in the sequence table. `BANNED`: *ray* for alpha and beta (they are particles), *weight* for mass, *shots*, *specks*, *glow*, *dies* for a nucleus (say decays), *unstable* without its gloss at first use ("likely to change by itself"), *atom smashing*. `NEEDS`: proton, neutron, atomic number, mass number, isotope, charge.

## Chemistry to verify and record

- Masses: proton 1.00728 u, neutron 1.00866 u, helium-4 nucleus 4.00151 u; defect 0.03038 u; binding energy 28.3 MeV. Use nuclear, not atomic, masses, or state that electrons are included on both sides.
- Uranium-238 to lead-206: 8 alpha and 6 beta.
- Sodium-22 decays mostly by positron emission to neon-22. Carbon-14's half-life is 5,730 years. Technetium-99m (six hours) is the usual scan nuclide; iodine-131 has eight days; caesium-137 thirty years.
- The count falling to a quarter at twice the distance holds for a small source in air with gamma or beta; alpha is stopped by a few centimetres of air. Use a gamma source in `q1` stage 5 and say so on the sample.
- Tallow `q1` stage 4 says no chemical change splits an atom. This world is where that clause pays off; keep the two consistent.

## Open for the builder

- The counter must click from a seeded random sequence so that `verify:table` can build a table twice and compare; a ten-second total is a function of state, not of the clock.
- Whether `pans.js` can run a one-way change with a set half-life and re-seed the order of decays between runs (`q3` stage 2 depends on the order differing).
- Nuclide cards: the cards kit prints atomic number from the symbol; add a mass number and non-element particles.
- The chain view must be a pure painter; the escape of neutrons must follow from the lump's size, not be scripted.
- Chart: replace the four placeholder quests with the four bench ids above. The chart's first quest was a field stage ("Still Warm"); this plan has no field stage.

## Hand-back (plan)

- 24 stages and 5 boss phases, all new: 12 on reused fixtures unchanged, 6 with a new option (M), 6 on the new counter or chain view (L; `q1` stages 1, 2, 5 and 6, `q3` stage 5, `q4` stage 6).
- Most likely to go wrong in the build: `q1-comes-off` (the counter is new, random and on four stages of the first bench); `q3-half-gone` stage 2 (the idea is chance, and a deterministic engine has to show it honestly); `q4-shortfall` stage 6 (a new simulation that must give the right answer for the right reason).
