# Mirrowen (`unit06`): intermolecular forces, states, solutions

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar.
- **Earlier teaching pass:** 2026-11-06 (words, glossary, time-aware painters; record `docs/teaching-pass/Mirrowen.md`)
- **Quests:** `src/learn/quests/unit06/`. Chart `src/learn/worlds/unit06-states-of-matter.js`. Bank `src/learn/bank/unit06.json`. Glossary `src/learn/glossary/mirrowen.js`. Checks: `verify:mirrowen` (`tools/lib/mirrowen/`), `tools/verify-teaching-mirrowen.mjs` with `tools/teaching-ratchet-mirrowen.json`.
- **Kits:** `matter*.js` in `src/learn/table/kits/`; `src/learn/engine/matterdata*.js`, `thermodata.js`. The matter kit spreads the heat kit: it must declare its own `live`, `onMiss` and `tapZones`. `pans-3d.js` is shared.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit06 --totals`): 58 stages in 8 modules | briefing 0 | typed 15 (no instrument 0) | cards only 0 | reward long 0 | operation prompt 17 | hint 3 move/arithmetic 1 | vague 7 | register 0 | motive 2

## What is known to be wrong

- **`q2-grip` is a black box.** A probe prints the heat needed to separate a mole; six of eight stages are "order by the reading". Nothing connects the reading to its cause (size of the electron cloud, a permanent dipole, a hydrogen bond).
- **Only the piston meets the bar.** The earlier pass records that the graded act is the student's hand on the model for one instrument. Sorting by what a sample did is still cards on a rail.
- **15 typed stages**, three each in `q5-crossing`, `q6-solution` and the boss. 17 prompts open with an operation.
- **No stage has a briefing.**
- **Remaining stand-in words:** *tray*, *box*, *gauge*, *room*.
- `q5` stage 8 and `q7` stage 6 are beyond the exam and stay (owner decision): fix them to the standard and remove any "beyond the exam" label from play text.

## Bench notes

- `q1-states` (8): particles in solid, liquid, gas. The piston works; bring the other stages to it.
- `q2-grip` (8): intermolecular forces. **Redesign (M).** Show two molecules and what attracts them (the temporary dipole of a large cloud, the fixed dipole, the hydrogen bond), so the student predicts the order and the probe confirms. Molecules stay whole (the world's core idea).
- `q3-boil` (8): vapour pressure and boiling. Dynamic exchange at the surface is a good graded act: the student sets conditions and counts leaving against returning.
- `q4-solids` (6): kinds of solid.
- `q5-crossing` (8): heating curves. Three typed stages need the calculation pattern from Ember Reach `q2`.
- `q6-solution` (8): molarity, dilution, dissolving. Particles per volume should be visible when the student dilutes.
- `q7-separate` (7): separations.
- `boss-undertow` (5): three typed phases; re-test.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

A glide shows its rest value on first sight and then moves, so a check that looks once sees no change. The 3D crowd records every non-dark `fillRect` as a glass column. Tour piece keys are namespaced `<kit>:<kind>` because Kettle registers `jar` and `sample` globally. *Grip* was renamed to attraction by tool and left grammar damage; read every string.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

Planned 2026-11-11 by a plan session (no code changed). 58 stages become 54. Stage numbers are the new ones; "was n" gives the old index. Size: S strings and question only, M existing instrument with a new graded act or view, L new instrument. Rewards here are already short; most rows change the question and add a briefing.

| Bench | Idea | Structure | Terms it introduces (gloss) |
| --- | --- | --- | --- |
| `q1-states` 8 → 7 | Solids, liquids and gases differ in how their molecules are arranged and move; a change of state leaves each molecule whole. | Four Sealed Jars cut (boss phase 1 is the same stage). | solid, liquid, gas, phase change, intermolecular forces (attractions between one molecule and the next), density |
| `q2-grip` 8 → 8 | Molecules attract each other through uneven charge: brief (dispersion), permanent (dipole–dipole) or a hydrogen on N, O or F drawn to a lone pair (hydrogen bond). The cause predicts the order. | **Redesign (M).** The probe gains a view of two molecules of the sample approaching, showing what attracts them. In four stages the probe accepts only named reference samples and the rest are predicted; in two the question is the cause of a measured result. | London dispersion force, polarizable, dipole–dipole force, hydrogen bond, ion–dipole force |
| `q3-boil` 8 → 8 | In a sealed flask molecules leave and return at equal rates at the vapor pressure; a liquid boils when its vapor pressure reaches the outside pressure. | New stage 1 on leaving against returning (the bench note's graded act). Gas Over Water cut (a gas-mixture subtraction; Bellows owns it). Surface and Pour asks a direct question. | vapor pressure, boiling point, surface tension |
| `q4-solids` 6 → 5 | Molecular, ionic, metallic and network solids are told apart by tests; a crystalline solid melts at one temperature, an amorphous one softens over a range. | Inside the Solid merges into Quartz and Glass: the pattern of particles is shown beside the trace it explains. | crystalline, amorphous |
| `q5-crossing` 8 → 7 | Heat added during a phase change separates molecules without raising the temperature; a heating curve is slopes and level stretches. | The Way Back cut (the same sum with a minus sign). Ice to Steam shrinks from five stretches to two, after a worked case. A Burn asks for the cause. Stage 8 stays (owner decision) without its label. | heating curve, heat of fusion, heat of vaporization, phase diagram, triple point |
| `q6-solution` 8 → 7 | A dissolved solute is spread out as separate particles; molarity is moles in each litre; water changes the litres, not the moles. | Four Salts in a Bath cut (a ranking of thermometer readings; heat of solution is Ember Reach's). | solution, solute, solvent, molarity, dilution, soluble, miscible |
| `q7-separate` 7 → 7 | A mixture is separated by whatever differs between its parts: size, attraction to paper, boiling point. | No stage moved. Stage 6 stays (owner decision) without its label. | filtrate, chromatography, retention factor Rf, distillation, colligative property |
| `boss-undertow` 5 → 5 | Re-test of `q1`, `q2`, `q3`, `q5`, `q6`. No new idea. | Phase 2 changes with `q2`. | none |

Words (extend `glossary/mirrowen.js`): *tray* stays as the name of a sorting place, not of a concept; *box* (of molecules) → "picture of molecules"; *gauge* → pressure gauge, or "pressure"; *room* → volume; "holds on", "hold" → "attracts", "attraction" (finish the earlier rename and repair its grammar); "pull apart" on the probe → "Separate"; "the heat needed to pull one mole apart" → "heat to separate one mole". "Beyond the exam" is removed from two titles, two prompts, two rewards and one plaque title.

### Plan rows

#### `q1-states` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Three Jars | A solid keeps its shape, a liquid its volume, a gas neither. | The piston dragged on each jar's contents; "Pour" into the tank. | 1 ("Sort the three jars by what their contents do when..."). | **S.** Prompt: "Which jar holds a solid, which a liquid and which a gas?" Reward kept. | |
| 2 | Molecules in the Jars | The three states are three arrangements of the same molecules. | Three moving pictures of molecules: fixed places, sliding, far apart. | "box". | **S.** Prompt: "Which picture of molecules belongs to which jar?" | |
| 3 | Melting and Boiling (predict) | A guess. | Lead clip; three cards. | None of weight. | Keep. | |
| 4 | The Analyzer | Melting and boiling leave the molecule whole; splitting water does not. | "Read Molecule" names H₂O at every temperature for the ice jar, and H₂ and O₂ for split water. | 1 ("Sort the three changes by whether the analyzer names..."). | **S.** Briefing: "The analyzer names the molecules it finds in a jar." Trays: "Same molecule afterwards", "Different molecules afterwards". Prompt: "Which of these changes leave the water molecule whole?" | |
| 5 | What Holds the Ice | Attractions between molecules, not the bonds inside them, hold a solid together. | Heater through three settings: molecules shake, slide, fly apart, and the analyzer still reads H₂O. | 1 ("Pick what holds..."). | **S.** Prompt: "What holds the molecules of ice in their places?" | |
| 6 | Equal Jars | Mass in equal volumes shows how much space each molecule has. | Balance on three equal jars of one substance. | "weight"; order ran most to least. | **S.** Prompt: "In which jar does each molecule have the least space and in which the most?" (strip, least on the left). | |
| 7 | Water and Steam (typed) | A gas is mostly empty space. | Two equal jars weighed. | 1 ("Type how many times..."). The ratio of two readings; kept because the number (about 1,700) is the point. | **S.** Prompt: "How many times as many molecules are in the jar of water as in the equal jar of steam?" | |
| (cut) | Four Sealed Jars | | | Boss phase 1. | Archive under `archive/2026-11-11/mirrowen/`. | |

#### `q2-grip` (8 stages): redesign

Probe view (M, in the matter kit's painters; `matter-motion.js` style, time-aware): two molecules of the seated sample drift together. Dispersion: each cloud flickers lopsided for an instant, the neighbour's follows, δ+ and δ− flash; a larger cloud lops further. Dipole–dipole: fixed δ+ and δ− ends turn to face each other. Hydrogen bond: a dashed line from an H on N, O or F to a lone pair on the neighbour. The probe's key is "Separate" and it prints the heat to separate one mole. `probe` gains `accepts: [ids]`; a card not on the list is refused with "This sample is for you to predict."

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Four Atoms | A bigger electron cloud is pulled out of shape more easily, so it attracts its neighbours more strongly. | Probe on helium and neon: the view shows the clouds flicker lopsided, more for neon; two readings. Argon and xenon cards show their cloud sizes. | 3 (all four were probed and ranked by the reading). | **M**, pattern "observe one case, answer the neighbouring case". Briefing: "The electrons in an atom's cloud are always moving, so for an instant one side is slightly negative and the other slightly positive. That brief uneven charge attracts the atom next to it: a London dispersion force." Prompt: "Which of the four atoms attracts its neighbours most weakly and which most strongly?" (rail, weakest on the left). Reward kept, with "polarizable" glossed: "A bigger cloud is pulled out of shape more easily: it is more polarizable, so its dispersion forces are stronger." | |
| 2 | A Polar Molecule | A molecule with a permanent + end and − end attracts by those as well. | Probe on all three: hydrogen chloride reads above heavier krypton; the view shows its δ+ and δ− ends turning to face each other. | 3 (order by reading). | **M** (three cards and a slot replace the rail; the check refuses until HCl and Kr are probed). Cards: "It has a permanent + end and − end", "It has the bigger electron cloud", "It is the heavier". Prompt: "Why does hydrogen chloride attract its neighbours more strongly than krypton?" Reward kept. | |
| 3 | Which Attracts More? (predict) | A guess: light water or heavy hydrogen sulfide. | Lead clip; three cards. | "holds on". | **S.** Title and prompt: "Which needs more heat to separate a mole: water, at 18 g, or hydrogen sulfide, at 34 g?" | |
| 4 | Four Hydrides | A hydrogen on N, O or F is strongly attracted to a lone pair on the next molecule. | Probe on all four: water and ammonia read far above the heavier two; the view draws the dashed line between H and a lone pair. | 3 (order by reading); 2 (hydrogen bond defined in the reward). | **M**, pattern 6 (two trays replace the rail). Briefing: "A hydrogen atom bonded to nitrogen, oxygen or fluorine is strongly attracted to a lone pair on a neighbouring molecule. This attraction is a hydrogen bond." Trays: "Forms hydrogen bonds", "Does not". Prompt: "Which of these molecules form hydrogen bonds with their own kind?" Reward: "Water and ammonia do, and need far more heat to separate than heavier H₂S and PH₃. A hydrogen bond is the strongest attraction between neutral molecules." | |
| 5 | Ions in Water | A small or highly charged ion attracts water's partial charges more strongly. | Probe on Na⁺: the view shows water molecules turning their δ− ends to it; one reading. The other cards show ion size and charge. | 3. | **M** (probe accepts Na⁺). Briefing: "Water molecules are polar, so an ion attracts the oppositely charged end of each: an ion–dipole force." Prompt: "Which ion gives out the least heat when it enters water and which the most?" (rail, least on the left). Reward kept. | |
| 6 | Same Formula | A long molecule touches its neighbours over more of its surface than a compact one of the same formula. | Probe on butane and n-pentane; the view shows chains lying along each other. Neopentane's card shows a ball. | 3. | **M** (probe accepts butane and n-pentane; three cards and a slot: "n-pentane", "neopentane", "The same"). Prompt: "Which needs more heat to separate a mole: n-pentane or neopentane, both C₅H₁₂?" Reward kept. | |
| 7 | An Attraction and a Bond | The bonds inside a molecule are many times stronger than the attractions between molecules. | Bond dial reads the energy for a mole of O–H bonds; probe reads water. | 5 (a typed ratio of two readings times a count). | **M** (typed entry replaced by three cards: "About the same", "About twice as much", "More than twenty times as much"). Prompt: "How does the heat to break the O–H bonds in a mole of water compare with the heat to separate its molecules?" Reward kept. | |
| 8 | Five Sealed Samples | The picture of a molecule tells its strongest force. | Each sample's drawing with its + and − marks; probe free on all. | Hint 3 nearly the rule; acceptable. | **S.** Prompt: "What is the strongest force between the molecules of each sample?" | |

#### `q3-boil` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Leaving and Returning (new) | The pressure in a sealed flask stops rising when molecules return to the liquid as fast as they leave. | "Settle": molecules leave the surface, the gauge climbs, some return; two counters, LEAVING and RETURNING each second, come level as the gauge stops. | New: the idea was a clause in old stage 1's reward. | **M** (the `vapour` flask with its two counters shown; three cards and a slot: "None are leaving any more", "As many return as leave", "More leave than return"). Prompt: "When the pressure stops rising, what are the molecules at the surface doing?" Reward: "Molecules still leave and return, at equal rates. The steady pressure of the vapor is the liquid's vapor pressure." | |
| 2 | Sealed Liquids (was 1) | Weaker attractions, higher vapor pressure. | Each card prints the heat to separate a mole (from `q2`); the flask settles at a different pressure for each. | 1; order by a reading, kept as the test of a relation the student can state first. | **S.** Prompt: "Which liquid has the lowest vapor pressure and which the highest?" (lowest on the left). Hint 3: "Think which liquid's molecules leave the surface most easily." | |
| 3 | Warm and Cold (was 2) | Vapor pressure rises steeply with temperature. | Four cards with temperatures; warm water settles above cold ether. | 1. | **S.** Prompt: "Which sample has the lowest vapor pressure and which the highest?" | |
| 4 | On the Mountain (predict; was 3) | A guess. | Lead clip; three cards. | None. | Keep. | |
| 5 | Where It Boils (typed; was 4) | A liquid boils where its vapor pressure reaches the outside pressure. | Heater steps plot vapor pressure against temperature; an amber line marks the outside pressure; the crossing lies between two steps. | 1. | **S.** Briefing: "Bubbles of vapor can form inside a liquid only when its vapor pressure equals the pressure pressing on it. That is boiling." Prompt: "At what temperature does water boil when the outside pressure is 65 kPa?" | |
| 6 | Four Boiling Points (was 5) | Stronger attractions, higher boiling point. | Cards with structure; probe available. | "hold on". | **S.** Prompt: "Which liquid has the lowest boiling point and which the highest?" | |
| 7 | Surface Tension (was 6) | Stronger attractions give a higher surface tension. | "Test" shows a drop on each liquid's surface and prints its surface tension; cards print the attraction. | 5 (a question about which column of a table follows another: "surface pull, pour time, both or neither"). | **M** (selector options become the three liquids; the pour-time column goes). Prompt: "Which of the three liquids has the highest surface tension?" The check refuses a tested card only if all three were tested first: let the answer be given before testing. Reward: "Water: its molecules attract each other most strongly, so its surface resists being broken. That resistance is surface tension." | |
| 8 | Two Pictures (was 7) | Ice is less dense than water because hydrogen bonds hold its molecules in an open lattice. | Equal volumes weighed; two pictures with different numbers of molecules. | "box". | **S.** Prompt: "Which picture shows ice and which liquid water?" | |
| (cut) | Gas Over Water | | | See the sequence table. | Archive. | |

#### `q4-solids` (5 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Five Solids | A molecular solid melts low and never conducts. | Melting trace and conduction lamp, cold and molten. | 1 (a 16-word sort instruction). | **S.** Briefing: "A molecular solid is made of whole molecules held together only by the attractions between them." Trays: "Molecular solid", "Not molecular". Prompt: "Which of these are molecular solids?" | |
| 2 | Same Atoms (predict) | A guess. | Lead clip; three cards. | "give way". | **S.** Prompt: "Quartz and glass are both silicon and oxygen: how will each behave as it is heated?" | |
| 3 | Quartz and Glass (merges was 3 and 4) | Particles in a repeating pattern let go at one temperature; particles with no pattern let go over a range. | The tester's window shows each sample's particles, in a pattern or not, beside the stiffness trace as it is heated. | 2 (the cause, the pattern, was shown only in the next stage). | **M** (window and trace on one table). Trays: "Melts at one temperature", "Softens over a range". Prompt: "Which solids melt at one temperature and which soften over a range?" Reward: "The solids whose particles sit in a repeating pattern, crystalline solids, melt at one temperature. Glass has no pattern: it is amorphous, and softens gradually." | |
| 4 | Four Sealed Solids (was 5) | Four kinds of solid, four sets of test results. | Melt trace, hammer, lamp cold, lamp molten. | Hint 3 nearly the key. | **S.** Briefing: "Solids come in four main kinds: molecular, ionic, metallic and covalent network. Each behaves differently when hammered, heated and wired to a lamp." Prompt: "What kind of solid is each sealed sample?" | |
| 5 | Five Sealed Solids (was 6) | An amorphous solid can match an ionic one on every test but the trace. | The same tests. | None of weight. | **S.** Prompt: "What kind of solid is each sealed sample?" | |

#### `q5-crossing` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Ice on the Heater | Heat can go into a sample without raising its temperature. | Each press of "Heat" moves the pen; the thermometer stands at 0 °C across a level stretch. | 1 (a two-part instruction). | **S.** Briefing: "A heating curve plots a sample's temperature against the heat added to it." Prompt: "How much heat does this ice take in while its temperature stays at 0 °C?" | |
| 2 | Where Did It Go? (predict) | A guess. | Lead clip; three cards. | None. | Keep. | |
| 3 | Twelve Molecules | During a level stretch the heat separates molecules; it does not speed them up. | Window on twelve molecules: in place, then sliding, then flying apart, while the thermometer holds at each change. | 1 (the prompt is the move). | **S.** Prompt: "What does the heat do to the molecules while the thermometer stands still?" (answered by heating through both level stretches). | |
| 4 | More Ice (typed) | Heat to melt = moles × heat of fusion. | The cup's 18.0 g melts with about 6 kJ; the asked mass is not in the cup. | 2 (heat of fusion and ΔH named in the reward). | **S.** Briefing: "The heat needed to melt one mole of a solid at its melting point is its heat of fusion." Prompt: "How much heat melts 36.0 g of ice at 0 °C, in kilojoules?" | |
| 5 | Water to Steam (typed; was Ice to Steam) | A path with a slope and a level stretch is two heats added. | The curve for 18.0 g of water from 0 °C to steam at 100 °C; plate of constants. | 7 (five stretches summed, cold). | **M** (the sample starts as water at 0 °C; two stretches) with a worked case. Briefing: "A sloping stretch takes mass × c × ΔT. A level stretch takes moles × the heat of fusion or of vaporization, the heat to boil one mole." Worked lines (18.0 g of ice at 0 °C to water at 100 °C): "melt: 1.00 mol × 6.01 = 6.01 kJ", "warm: 18.0 g × 4.18 × 100 = 7.52 kJ", "total 13.5 kJ". Prompt: "How much heat takes 18.0 g of water at 0 °C to steam at 100 °C, in kilojoules?" Boss phase 4 uses ice to water with 54.0 g: keep it different from the worked case's numbers. | |
| 6 | A Burn (was 7) | Steam gives most of its heat as it condenses. | Cooler run on water at 100 °C and steam at 100 °C: the steam's pen draws a long level stretch first. | 3 (four cards ranked by the heat each printed). | **M** (two samples; three cards and a slot: "From condensing to liquid water", "From cooling from 100 °C to 37 °C", "From being hotter than the water"). Prompt: "Steam at 100 °C gives a hand far more heat than water at 100 °C: where does the extra come from?" | |
| 7 | Skipping the Liquid (was 8; owner: stays) | Which state water is in depends on pressure as well as temperature; at low enough pressure ice turns straight to vapor. | Pressure dial; "Heat" sweeps the temperature and lists the states passed through. | "Beyond the exam" in the prompt, reward and plaque title; 1. | **S.** Plaque title "Water's states". Briefing: "The state of water depends on pressure as well as temperature. A phase diagram maps the state at each pressure and temperature." Prompt: "At what pressure does warming ice never make liquid water?" Reward: "Below 0.611 kPa, the pressure of water's triple point, ice turns straight to vapor. Far above it, past the critical point, liquid and vapor are no longer different." | |
| (cut) | The Way Back | | | See the sequence table. | Archive. | |

#### `q6-solution` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Four White Powders | A dissolved solid is spread through the water as separate particles. | Window on the flask: particles apart, or still packed. | 1. | **S.** Briefing: "A solution is a mixture that is the same all the way through: the solute is spread through the solvent." Trays: "Dissolves", "Does not dissolve". Prompt: "Which powders dissolve in water?" | |
| 2 | Salt in a Flask (typed) | Molarity = moles of solute ÷ litres of solution. | The same salt in a 250 mL and a 500 mL flask: the window is half as crowded in the larger; 400 mL is not on the dial. | 7 (no worked case); 1 (a 22-word instruction). | **S**, worked case. Briefing: "Molarity, M, is the moles of solute in each litre of solution." Worked lines (another salt): "11.7 g ÷ 58.5 g/mol = 0.200 mol", "in 0.500 L: 0.200 ÷ 0.500 = 0.400 M". Prompt: "What is the molarity when this salt is made up to 400 mL?" | |
| 3 | Stock to a Flask (typed) | Adding water changes the litres, not the moles: M₁V₁ = M₂V₂. | "Stock poured in" dial with the molarity under the window; the wanted molarity lies between two steps. | 1. | **S.** Prompt: "How many mL of 2.00 M stock, topped up to 100 mL, make a 0.500 M solution?" Reward kept. | |
| 4 | Which Puts More In? (predict) | A guess. | Lead clip; four cards. | None. | Keep. | |
| 5 | Particles in the Water (typed) | An ionic solute separates into its ions; a molecular one stays whole. | Window: CaCl₂ gives one Ca²⁺ and two Cl⁻, NaCl two ions, sugar whole molecules. | 5 (the answer in units of 10²³). | **S.** Prompt: "How many moles of particles does 0.100 mol of calcium chloride put in the water?" Plate "One mole" goes. | |
| 6 | Water and Oil | Substances with similar attractions dissolve in each other. | "Liquid" dial between water and oil; each card keeps a line for each. | 1. | **S.** Prompt: "Which samples dissolve in water, which in oil, and which in both?" | |
| 7 | Three Sealed Flasks (was 8) | Molarity counts what was dissolved, not the particles it becomes. | Each flask's window shows 12 particles, of one, two or three kinds. | None of weight. | **S.** Prompt: "Which sealed flask has the lowest molarity and which the highest?" | |
| (cut) | Four Salts in a Bath | | | See the sequence table. | Archive. | |

#### `q7-separate` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Through the Paper (predict) | A guess. | Lead clip; three cards. | None. | Keep. | |
| 2 | Four Mixtures | Filter paper stops only what is too big for its pores; a dissolved solid passes. | "Pour Through": the paper holds sand and sawdust; the dried drop shows salt and dye passed. | 1. | **S.** Prompt: "Which mixtures can be separated by filtering, and which need the water boiled off?" | |
| 3 | Black Ink (typed) | A dye is identified by how far it travels relative to the liquid: Rf. | Strip run: three spots and the wet edge on a ruler. | 2 (chromatography and Rf in the reward). | **S.** Briefing: "In chromatography a liquid climbs a strip of paper and carries each dye a different distance. A dye's retention factor, Rf, is its distance divided by the distance the liquid travelled." Prompt: "What is the Rf of the red dye?" | |
| 4 | Another Liquid | A nonpolar liquid carries nonpolar dyes furthest. | "Solvent" dial; the spots' order reverses. | 1. | **S.** Prompt: "In hexane and acetone, which dye travels least and which furthest?" | |
| 5 | Three Liquids | Distillation takes off first the liquid with the lowest boiling point. | "Collect Cut" fills vials in turn; the column's temperature steps up. | 1. | **S.** Prompt: "Which liquid comes over first and which last?" | |
| 6 | A Salted Flask (typed; owner: stays) | Dissolved particles raise the boiling point, by an amount that depends on how many particles, not what they are. | Sugar and NaCl at the same amount: the rise doubles for NaCl; the "Dissolved" dial; the asked amount is past the dial. | "Beyond the exam" in the title and reward; 2 (the relation appears only in the reward). | **S.** Title "A Salted Flask". Briefing: "Dissolved particles raise the boiling point of water. Each mole of particles in a kilogram of water raises it by 0.51 °C, whatever the particles are." Prompt: "How many degrees above 100 °C does water boil with 3.00 mol of CaCl₂ in 2.00 kg?" Reward: "1.50 mol of CaCl₂ per kilogram is 4.50 mol of particles, a rise of 2.3 °C. A property that counts particles only is a colligative property." | |
| 7 | Sand, Salt and Water | Each step is chosen by what differs between the parts. | The board shows where each part ends after each step card. | None of weight. | **S.** Prompt: "Which steps, in which order, leave the sand, the salt and the water each alone?" | |

#### `boss-undertow` (5 phases)

| # | Phase | Re-tests | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | The Hold | `q1` stage 1. | 1. | **S.** Prompt: "Which jar holds a solid, which a liquid and which a gas?" | |
| 2 | The Siphons | `q2` stages 2, 4 and 8. | 3 (order by the probe's reading; hint 3 said so). | **M** (the probe accepts diethyl ether only; cards show structures). Prompt: "Which liquid needs the least heat to separate a mole and which the most?" | |
| 3 | The Vent (typed) | `q3` stage 5. | 1. | **S.** Prompt: "At what temperature does ethanol boil when the outside pressure is 45 kPa?" | |
| 4 | The Melt (typed) | `q5` stage 5. | Hint 3 the method (acceptable as reasoning; remove the formulas, which the plate holds). | **S.** Prompt: "How much heat melts 54.0 g of ice at 0 °C and warms the water to 100 °C, in kilojoules?" | |
| 5 | The Dose (typed) | `q6` stage 3. | 1. | **S.** Prompt: "How many mL of 1.50 M stock, topped up to 250 mL, make a 0.300 M solution?" | |

### Open for the builder

- `q2`: the two-molecule view is the main work. It must be a pure painter of state and `b.clock`; the 3D crowd reads the same painter through `dressRecorded`, and a first check sees a glide at its rest value (world file, Traps). `accepts` on the probe changes the checks and `SOLUTIONS` of five stages and boss phase 2.
- `q3` stage 1: whether the `vapour` fixture can print leaving and returning counts. If the planner does not expose rates, derive them from the gauge's approach to its settled value and say so.
- `q3` stage 7: the selector's options and the removal of the pour-time column in `surface`.
- `q5` stage 5: the heat-curve fixture starting from liquid water at 0 °C.
- `tools/verify-teaching-*.mjs` and the Mirrowen ratchet hold counts that fall with four cuts.
- Every string kept from the earlier pass: read it for the damage the "grip" rename left.

### Hand-back (plan)

- 54 stages: kept as built 5, reworded (S) 37, redesigned M 12, L 0. Of the 54, 1 is new (`q3` stage 1) and 1 merges two. Cut: 4, plus the one lost in the merge.
- Most likely to go wrong in the build: `q2-grip` (a new time-aware view plus a restricted probe across six stages); `q3-boil` stage 1 (needs rates the planner may not have); `q5-crossing` stage 5 (new start state for the curve, and it must stay distinct from boss phase 4).

### Structural changes

### Chemistry corrections

### Still weak

(Ordered by how likely a student is to get lost. For each: the stage, what is weak, why it was not fixed.)

### For the owner to look at

(Stages whose table was rebuilt or added. Nobody has seen these on a screen.)

### For close-out

(Stage and quest counts that changed; shared code changed; doctrine or engine lessons.)
