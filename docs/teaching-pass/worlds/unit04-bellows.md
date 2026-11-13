# Bellows (`unit04`): gases

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). A plan session first is strongly advised: this world has the most worksheet stages.
- **Earlier teaching pass:** none
- **Quests:** `src/learn/quests/unit04/`. Chart `src/learn/worlds/unit04-gases.js`. Bank `src/learn/bank/unit04.json`. No glossary: create `src/learn/glossary/bellows.js`. Checks: `verify:bellows`.
- **Kits:** `gas.js`, `gas-draw.js`, `gas-read.js`, `gas-3d.js` in `src/learn/table/kits/`; `src/learn/engine/gasdata.js`, `gas-particles.js`, `gas-props.js`. Not shared.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit04 --totals`): 49 stages in 7 modules | briefing 1 | typed 17 (no instrument 0) | cards only 2 | reward long 15 | operation prompt 31 | hint 3 move/arithmetic 6 | vague 36 | register 6 | motive 2

## What is known to be wrong

- **The owner asked twice (2026-10-09, 2026-11-01) and it is still not done:** *pressure* and *volume* for *gauge*, *room*, *push*, *knocks*, *squeeze* (36 of 49 stages); kelvin taught first (it is needed in `q1` and introduced in `q2` stage 3); the ideal gas law stated before it is needed; sorts run lowest on the left. "Holder 8" is a container: call it a cylinder or a tank and drop the numbers where a stage has one.
- **Worksheets.** 17 typed stages; `q3-ideal` is five in nine. `q1` stage 7 teaches the manometer with no manometer, only a plate of mercury levels. Multi-step conversions with one formula hint (`q5` stage 7: rms speed with kg/mol).
- **Two stages are about percentage error in a student's lab report** (`q3` stage 9 "A Thermometer That Reads Low", `q4` stage 8 "A Forgotten Correction"), which is not gas chemistry. Cut them or ask the gas question underneath.
- **31 prompts open with an operation** ("Type the temperature at which Holder 8's room is twice Holder 7's").
- **Rewards in textbook register:** "Mole quantity in a gas is directly proportional to pressure and volume, and inversely proportional to absolute temperature. Combining these dependencies yields the ideal gas law."

## Bench notes

- `q1-knocks` (8): pressure is particles hitting the walls (the world's core idea; the particles are simulated live, so use them). The student should change the volume or the number of particles and see the hits on a wall change. Kelvin is introduced here, on the bench, before any stage needs it. The manometer stage gets a drawn manometer or goes.
- `q2-laws` (7): Boyle, Charles, Gay-Lussac. Each law seen as a change in the particles before it is a number; then one worked case; then typed cases.
- `q3-ideal` (9): PV = nRT. State the law in a briefing before the first stage that needs it. Cut to about six. Stage 3 is a card sort of tanks whose hint 3 is the formula in stand-in words.
- `q4-mixtures` (8): partial pressures. Two kinds of particle visible in one container, each kind's hits counted.
- `q5-speed` (8): speeds, effusion, diffusion. Stage 7 (rms speed) needs its unit conversion on a plate and a worked case, or it goes.
- `q6-real` (4): real gases. Particle size and attraction should be visible at high pressure.
- `boss-compressor` (5): re-test; rename.

Quest ids such as `q1-knocks` stay (ids are internal); titles and all play text change.

## Owner requests to check against the source

`docs/feedback-11-01.md` section "Bellows"; `docs/plans/feedback-11-01-plan.md` item 9.

## Traps

A rename of *room* and *push* by tool will hit ordinary English uses ("room temperature", "push the piston"): use the skip list in `tools/lib/rewrite-play-text.py` and read the diff. Checks under `tools/` may match the old words.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

Planned 2026-11-11 by a plan session (no code changed). 49 stages become 40. Stage numbers are the new ones; "was n" gives the old index. Size: S strings and question only, M existing instrument with a new graded act or view, L new instrument.

| Bench | Idea | Structure | Terms it introduces (gloss) |
| --- | --- | --- | --- |
| `q1-knocks` 8 → 7 (title "What Pressure Is") | Pressure is particles colliding with the walls; it falls to zero at −273 °C, where the kelvin scale starts; less volume means more collisions (Boyle's law); temperature is the average kinetic energy of the particles. | Kelvin is found here in a new stage 3, before any stage needs it (owner request). Stage 4 asks about collisions, not a dial target. Cut: Reading a Manometer (a plate of mercury levels, a unit this world then uses twice) and Boyle's Law and the Straight Line (the answer was a slope the plot printed; the owner asked for the slider and gauge instead, which stage 4 is). | pressure (how hard a gas presses on each bit of wall, in kilopascals, kPa), collision, absolute zero, kelvin (K = °C + 273), Boyle's law, kinetic energy (energy of motion) |
| `q2-laws` 7 → 6 | At constant pressure volume is in step with kelvin temperature (Charles's law); at constant volume pressure is (Gay-Lussac's law); the two changes multiply. | Extrapolating to Zero Volume cut: absolute zero is now found in `q1` stage 3. Using Charles's Law moves up to follow the stage that discovers it. The combined-law stage gets a cylinder in place of a plate. | Charles's law, Gay-Lussac's law |
| `q3-ideal` 9 → 6 | Equal moles of any gas fill equal volumes; PV = nRT; the law counts moles, names a gas and works in two unit sets. | The law is stated in the briefing of stage 3 (owner request), where the student measures R. Cut: the five-tank card sort (the formula in stand-in words), Gas Density (a derived formula on a plate), A Thermometer That Reads Low (percentage error, not gas chemistry). | mole (recap), Avogadro's law, ideal gas law, gas constant R, atmosphere (atm) |
| `q4-mixtures` 8 → 5 | In a mixture each gas has the pressure it would have alone; the partial pressures add; a gas's share of the pressure is its share of the moles. | The two mole-fraction stages merge into one typed stage with tanks on the bench. Cut: Atmospheric Pressure and Altitude (a dial turned until a readout halves) and A Forgotten Correction (percentage error). | partial pressure, Dalton's law, mole fraction |
| `q5-speed` 8 → 7 | At one temperature lighter particles move faster, so they effuse and diffuse faster; time goes with the square root of molar mass. | Particle Speed (rms speed with kg/mol) cut. | effusion, diffusion, Graham's law |
| `q6-real` 4 → 4 | Real particles take up space and attract each other, so real gases leave the ideal gas law at high pressure and low temperature. | Stage 3 asks which way the gas deviates and why, not for a dial setting where two figures match. | ideal gas, real gas |
| `boss-compressor` 5 → 5 | Re-test of `q2`, `q4`, `q3`, `q6`, `q5`. No new idea. | Phase 4 changes with `q6` stage 3. | none |

World-wide renames (create `src/learn/glossary/bellows.js` with these in `BANNED`): *room* → volume; *gauge* as a quantity → pressure ("pressure gauge" stays as the instrument's name); *push* → pressure, presses; *knocks* → collisions (counter label "COLLISIONS"); *squeeze* → compress; "Holder 8" → "Cylinder" (a letter only where a stage has two); "the gas law figure" → "ideal gas law pressure"; "energy of motion" → kinetic energy after `q1` stage 7 glosses it. Sorts run lowest on the left. Heater dials rise to the right. Thermometers print kelvin with °C beneath from `q1` stage 3 onward. Use the skip list in `rewrite-play-text.py` for "room temperature".

### Plan rows

#### `q1-knocks` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Three Gauges (predict) | A guess: does a gas press harder on the floor? | Four statement cards. | 7 (nothing says what a gauge measures). | **S.** Briefing: "A pressure gauge measures how hard a gas presses on the wall it is fixed to." Prompt: "A sealed box of gas has a pressure gauge on its roof, its side wall and its floor: which reads highest?" | yes |
| 2 | Pressure on Every Wall | A gas presses equally on every wall because its particles fly in all directions and collide with all of them. | Live particles in the box striking roof, side and floor; three gauges that agree at every heater setting. | 4 ("push"); 6 (hint 1 a tool list). | **S.** Prompt: "Which statement do the three gauges support?" Reward: "The particles fly in every direction and collide with every wall alike. Those collisions are the gas's pressure, measured in kilopascals, kPa." | yes |
| 3 | Where Pressure Runs Out (new) | Cooling slows the particles; the pressure heads for zero at −273 °C, absolute zero, and the kelvin scale counts from there. | Sealed box: each cooler heater setting shows slower particles and a lower gauge; Record drops a point on the strip; the straightedge carries the line down to zero pressure. | New. Kelvin was needed in `q1` and introduced in `q2` stage 3. | **M** (`box` with `plot` of pressure against °C, Record, straightedge and `markerFixture`, as old `q2` stage 3 had for volume). Briefing: "Cooling a gas slows its particles, so they collide with the walls less hard and the pressure falls. Record the pressure at several temperatures and follow the line down." Prompt: "At what temperature would the pressure of this gas fall to zero?" Reward: "The line reaches zero at −273 °C, called absolute zero. The kelvin scale counts from there: K = °C + 273, so 27 °C is 300 K." | yes |
| 4 | Volume and Pressure (was 3) | Half the volume, twice the collisions, twice the pressure. | Piston dial: the same particles in less space; the COLLISIONS counter and the gauge needle both rise. | 3 ("Set the piston so the gauge reads 6 times its starting figure": a dial turned to a target); 4 ("room", "knocks", "squeezing"); reward 45 words. | **M**, pattern "change what is asked". Four cards and a slot: "Half as many", "The same", "Twice as many", "Four times as many". Prompt: "When the volume is halved, what happens to the collisions with the walls each second?" The check refuses until two settings where one volume is half the other have been visited. Reward: "Half the volume gives twice the collisions and twice the pressure, so pressure × volume stays the same at one temperature. This is Boyle's law." | yes |
| 5 | Using Boyle's Law (typed, was 4) | P₁V₁ = P₂V₂. | The piston dial stops at 4 L; pressure × volume can be checked at every stop; 1.5 L is past the dial. | 7 (first calculation, cold); 6 (hints 2 and 3 are the arithmetic); 1. | **S**, worked case in the briefing. Briefing: "At one temperature, pressure × volume is the same before and after: P₁V₁ = P₂V₂." Worked lines (another gas): "200 kPa × 6.0 L = 1200", "new volume 2.0 L", "1200 ÷ 2.0 = 600 kPa". Prompt: "What would the pressure be at 1.5 L?" Miss: the volume at which this gas would have the typed pressure. Reward: "Pressure × volume stays about 2500, so at 1.5 L the pressure is about 1660 kPa." | yes |
| 6 | Speeds in a Gas (was 5) | Particles in a gas have a spread of speeds; heating moves the whole spread to higher speeds. | Speed screen redraws at each heater setting, beside live particles; four snapshots to place. | 4 (the screen is never explained); reward in textbook register. | **S.** Briefing: "The speed screen sorts the particles by how fast they are moving: each bar counts the particles near that speed." Prompt: "Which snapshot was taken at the coldest temperature and which at the hottest?" (rail, coldest on the left). Reward: "The particles do not all move at one speed. Heating shifts the spread to higher speeds and widens it; this spread is the Maxwell–Boltzmann distribution." | yes (prompt: put all 4 in order) |
| 7 | Mass and Kinetic Energy (was 6) | At one temperature every gas has the same average kinetic energy; lighter particles move faster. | Two cylinders printing ENERGY and SPEED; the readings agree in energy only when the temperatures agree. | 1 ("Set Holder 6's heater so..."); a match of two readouts, kept as the stage where the equal temperatures are the surprise. | **S.** Briefing: "Kinetic energy is energy of motion. A particle has more of it if it is heavier or moving faster." Prompt: "At what temperature do carbon dioxide particles have the same average kinetic energy as helium particles at 300 K?" Reward: "The energies match at 300 K, the same temperature, though helium moves about three times as fast. Temperature measures the average kinetic energy of the particles, whatever their mass." | yes |
| (cut) | Reading a Manometer; Boyle's Law and the Straight Line | | | See the sequence table. | Archive under `archive/2026-11-11/bellows/`. | |

#### `q2-laws` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Temperature and Volume (predict) | A guess: is 40 °C twice as hot as 20 °C for a gas? | Three cards. | 4 ("room", "push"). | **S.** Prompt: "A gas under a freely moving piston is warmed from 20 °C to 40 °C: how much bigger does its volume get?" | yes |
| 2 | Doubling the Volume (typed) | Volume is in step with kelvin temperature: Charles's law. | Two cylinders; one fixed at 293 K, the other heated; volume and kelvin printed; the heater's stops do not include the answer. | 1 ("Type the temperature at which Holder 8's room is twice Holder 7's"); owner: the dial had no stop near the answer and the student had to guess. | **S** plus dial list (stops at even kelvin steps that straddle the answer; the answer itself is not a stop, pattern "take the answer off the dial"). Prompt: "At what kelvin temperature does this gas have twice the volume it has at 293 K?" Reward: "The volume doubled at 586 K, twice 293 K, which is 313 °C and not 40 °C. At constant pressure, volume is in step with kelvin temperature: Charles's law." | yes |
| 3 | Using Charles's Law (typed, was 6) | V₁ ÷ T₁ = V₂ ÷ T₂ with T in kelvin. | Heater dial with volume and kelvin at each stop; 600 K is past the dial. | 6 (hints 2 and 3 the arithmetic); 7. | **S**, worked case. Briefing worked lines (another gas): "12 L at 300 K", "12 ÷ 300 = 0.040 L for each kelvin", "at 450 K: 0.040 × 450 = 18 L". Prompt: "What volume would this gas fill at 600 K?" Reward: "Volume ÷ kelvin stays about 0.081, so at 600 K the gas fills about 49 L." | yes |
| 4 | Temperature and Pressure (predict) | A guess for a sealed tank. | Three cards. | 4 ("gauge", "knocks"). | **S.** Prompt: "A sealed tank cools from 293 K to 243 K: what happens to its pressure?" | yes |
| 5 | Pressure in the Cold | In a sealed rigid tank, pressure is in step with kelvin temperature: Gay-Lussac's law. | Slower particles and a lower gauge at each cooler stop. | 1 ("Cool the tank ..., then lay the card"); 6 (hint 3 the arithmetic); the heater fell to the right (owner). | **S** plus dial direction. Prompt: "By about what fraction does the pressure fall when the tank cools from 293 K to 243 K?" Reward: "The kelvin temperature fell by about a sixth and so did the pressure. At constant volume, pressure is in step with kelvin temperature: Gay-Lussac's law." | yes |
| 6 | Two Changes at Once (typed, was 7) | A change of volume and a change of temperature each multiply the pressure. | Cylinder with piston and heater dials: each change can be made alone and its factor seen; the asked temperature is past the heater. | 3 (a plate and a number, nothing on the bench). | **M** (a `rig` with both dials in place of the plate, as boss phase 1). Prompt: "What is the pressure after the volume is cut to a third and the gas is heated from 300 K to 900 K?" Reward: "A third of the volume triples the pressure and three times the kelvin temperature triples it again: 100 kPa becomes 900 kPa." Choose the numbers so no plate or readout prints the answer. | yes |
| (cut) | Extrapolating to Zero Volume | | | Its idea is `q1` stage 3. | Archive. | |

#### `q3-ideal` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Heavy Gas, Light Gas (predict) | A guess: does a heavier gas fill more volume? | Three cards. | 4 ("room", "weight"). | **S.** Prompt: "One mole of helium and one mole of carbon dioxide are at the same temperature and pressure: which fills more volume?" Briefing: "A mole is a fixed, very large number of particles." | yes |
| 2 | Equal Moles, Equal Volumes | Equal numbers of particles of any gas fill equal volumes at the same temperature and pressure. | Two cylinders; adding carbon dioxide raises its piston; the volumes match when the amounts match. | 1 ("Add gas to Holder 11 until..."). A match of two readings: kept as the see-and-compare step. | **S.** Prompt: "How many moles of carbon dioxide fill the same volume as one mole of helium?" Reward: "One mole of each fills the same volume, however heavy its particles. This is Avogadro's law." | yes |
| 3 | The Gas Constant (was 4) | P × V ÷ (n × T) is the same number for every sample: PV = nRT. | Cylinder with amount and heater dials printing P, V, n and T; four number cards. | 1 and 4 (a 21-word prompt that spelled the formula in stand-in words); the law was never stated before use (owner). | **S.** Briefing: "Pressure rises with the amount of gas and with the kelvin temperature, and falls as the volume grows. Put together, P × V ÷ (n × T) comes to the same number for any sample of gas." Prompt: "What does P × V ÷ (n × T) come to for this gas, in kPa, litres, moles and kelvin?" Reward: "It is 8.31 at every setting. That number is the gas constant, R, and the relation PV = nRT is the ideal gas law." Drop the straightedge from this table. | yes |
| 4 | Moles in a Tank (typed, was 5) | n = PV ÷ RT. | A sealed tank drawn with its gauge, volume and temperature. | 3 (a plate only); 7 (no worked case). | **M** (a `tank` piece with `plate` in place of the plaque) with a worked case. Worked lines (another tank): "P × V = 500 × 5.0 = 2500", "R × T = 8.31 × 301 = 2500", "n = 2500 ÷ 2500 = 1.0 mol". Change the bench tank so it is not the old 250 kPa, 10 L, 300 K case with the same products. Prompt: "How many moles of gas are in Tank X?" Miss: the pressure the typed moles would give in this tank. | yes |
| 5 | Naming a Gas (was 6) | Mass ÷ moles is the molar mass, which names the gas. | The sealed tank on the scale reads its mass of gas; its gauge, volume and temperature give the moles. | 3 (a plate only). | **M** (`tank` on `scaleFixture`). Prompt: "Which gas is in the sealed tank?" Reward: "The tank holds about 1.0 mol and 44 g of gas, so one mole is 44 g: carbon dioxide." | yes |
| 6 | Atmospheres and Celsius (typed, was 7) | The numbers must be in the units R uses. | Tank drawn with a gauge in atm and a thermometer in °C; R printed for atm. | Reward 56 words; 6 (hint 3 the steps). | **S.** Briefing: "Pressure is also measured in atmospheres: 1 atm is 101.3 kPa. With atm and litres the gas constant is 0.0821." Prompt: "How many moles of gas are in Tank Y?" Hint 3: "Each number must be in the unit that this R uses, and temperature is always in kelvin." Reward: "2.5 atm, 5.0 L and 300 K give 0.51 mol. Using 27 for the temperature would have given a number eleven times too large." | yes |
| (cut) | Counting Moles from Pressure; Gas Density; A Thermometer That Reads Low | | | See the sequence table. | Archive. | |

#### `q4-mixtures` (5 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A Second Gas (predict) | A guess: does one gas change another's pressure? | Three cards. | 4 ("knocks"). | **S.** Prompt: "Neon is alone in a tank, then helium is added: what happens to the pressure neon makes?" | yes |
| 2 | Each Gas Alone | Each gas in a mixture has the pressure it would have alone; the total is the sum. | Common tank with two kinds of particle in view; neon's own pressure and the total printed as each tank is opened. | 1 ("Open both tanks, then place the card"). | **S.** Prompt: "What happens to neon's own pressure when helium is let into the same tank?" Reward: "Neon's pressure did not change. The pressure a gas has in a mixture is its partial pressure, and the partial pressures add up to the total: Dalton's law." | yes |
| 3 | A Gas's Share (typed, merges was 3 and 6) | Partial pressure = mole fraction × total pressure. | Four tanks open into the common tank; each tank prints its gas and moles; the common tank prints the total pressure only. | 3 (was 3: the tank printed nitrogen's pressure and the total, so the answer was one readout over another; was 6: a plate). | **M** (common tank with the per-gas pressure hidden; tanks with `showAmount`). Briefing: "A gas's mole fraction is its moles divided by all the moles in the mixture. Its partial pressure is that fraction of the total pressure." Worked line: "0.2 mol of 0.8 mol is 0.25, and 0.25 × 200 kPa = 50 kPa". Prompt: "What is the partial pressure of nitrogen when all four tanks are open?" Reward: "Nitrogen is 2.4 of the 4.0 mol, a mole fraction of 0.60, so it makes 60 kPa of the 100 kPa." Boss phase 2 uses the same numbers: change one of the two. | yes |
| 4 | Moles, Not Mass (was 4) | At one volume and temperature the pressure follows the moles, not the mass. | Four tanks printing gas and grams, with no gauge; a plate of molar masses. | 3 (each tank's pressure was read off and the readings ranked); order ran highest first (owner). | **M** (`tank` with `noGauge`; common tank removed; plate added). Prompt: "Which tank has the lowest pressure and which the highest, at the same volume and temperature?" (rail, lowest on the left). Reward: "The tank with the most moles has the highest pressure, even though it does not hold the most grams." | yes |
| 5 | Gas Over Water (typed, was 7) | A gas collected over water shares the jar with water vapour; subtract the vapour's partial pressure. | Plate with the total and the vapour pressure. Nothing responds. | 3 (plate and type). Kept short because the idea is one subtraction of stage 2's law. | **S.** Briefing: "A gas collected over water is mixed with water vapour, which has a partial pressure of its own." Prompt: "What is the partial pressure of the gas alone in the jar?" Reward: "The total, 752 mmHg, is the gas plus 24 mmHg of water vapour, so the gas alone is 728 mmHg." The plate glosses mmHg in one line ("mmHg: another unit of pressure; 760 mmHg = 1 atm"). | yes |
| (cut) | Atmospheric Pressure and Altitude; Using Partial Pressures (merged); A Forgotten Correction | | | See the sequence table. | Archive. | |

#### `q5-speed` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Two Leaks (predict) | A guess: which gas escapes faster? | Three cards. | None of weight. | **S.** Prompt: "A helium chamber and a nitrogen chamber each have a tiny hole: which empties first?" | yes |
| 2 | Effusion Rates | Lighter particles move faster, reach the hole more often and escape sooner. | Stopwatch dial: particles leave each chamber through the hole; each chamber is labelled with its gas and shows what is left. | 4 (effusion only in the reward); the rail ran earliest to latest (fine) but hint 3 was the move. | **S.** Briefing: "Gas escaping through a tiny hole into empty space is effusion." Prompt: "Which chamber empties first and which last?" Reward: "The lightest gas emptied first. At one temperature lighter particles move faster, so they reach the hole more often." Confirm each chamber names its gas. | yes |
| 3 | An Unknown Gas | Gases that effuse at the same rate have the same molar mass. | Unknown and reference chambers side by side with half-empty times. | 1 ("Set the reference gas so..."). | **S.** Prompt: "Which reference gas effuses at the same rate as the unknown sample?" Reward: "The unknown keeps pace with one reference gas, so it has that gas's molar mass." | yes |
| 4 | Meeting in a Tube (predict) | A guess: where do two gases meet? | Three cards. | None of weight. | **S.** Prompt: "Ammonia (NH₃, 17 g/mol) and hydrogen chloride (HCl, 36.5 g/mol) enter opposite ends of a tube: where do they meet?" | yes |
| 5 | Diffusion Along a Tube | Gases spread through other gases by diffusion; the lighter one gets further. | Stopwatch: two fronts advance at different speeds; a white ring forms where they meet. | 1 (two-part instruction); hint 3 the move; register ("disperse", "net movement"). | **S.** Prompt: "Run the stopwatch until the gases meet and place the card for where the ring formed." Reward: "The ring formed closer to the heavier gas, because lighter particles travel faster on average." | yes |
| 6 | Graham's Law (typed) | Effusion time goes with the square root of molar mass. | Gas dial with each reference gas's half-empty time; the unknown's time. | 7 (the square-root relation appeared only in hint 3). | **S.** Briefing added. Prompt: "Type the mass of one mole of the unknown gas." Reward trimmed under 40 words. | yes |
| 7 | Speeds and Mass (was 8) | At one temperature a heavier gas has its spread of speeds at lower speeds. | Four snapshot curves. Nothing responds. | Reward 43 words; a card sort (see Open). | **S.** Prompt: "Put the four speed snapshots in order from the lightest particles to the heaviest, all taken at 300 K." Reward trimmed under 40 words. | yes |
| (cut) | Particle Speed | | | Unit conversion to kg/mol with one formula hint and a plate. | Archived (`archive/2026-11-11/bellows/q5-speed.before.js`). | |

#### `q6-real` (4 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Compressed Helium (predict) | A guess: does a real gas follow the law when compressed hard? | Three cards. | Stand-in words ("squeezed", "gauge", "room"). | **S.** Reworded to compressed, volume, pressure. | yes |
| 2 | High-Pressure Compression | At high pressure the particles' own volume matters, and the pressure is above the law's. | At the smallest volume the particles visibly fill much of the cylinder (`trueSize: true`); the pressure reads above the ideal gas law pressure printed beside it. | 1 (two-part instruction); stand-in "Holder 13". | **S.** Renamed to Cylinder 13; briefing added; removed `then` and stand-in words. | yes |
| 3 | Cold Carbon Dioxide | Attractions between particles hold a cold gas's pressure below the law's; particle size raises it when hot and cramped. | Heater dial: at 250 K pressure is below the ideal gas law pressure, at 1500 K above, canceling near 900 K. | 3 ("Set the heater until the gauge matches"); reward 50 words. | **M.** Added `answerCards` ("Attractions between particles lower pressure", etc.) + `seen.temp.includes(1)` coldest-visited check; reward trimmed to 2 sentences (≤40w); renamed Holder A to Cylinder A. | yes |
| 4 | Three Cold Gases | Stronger attractions mean a larger deviation, and a gas that liquefies at a higher temperature. | Three cylinders with real and ideal pressures; Cold Draw-off field card of condensation temperatures. | 6 (hint 3 the arithmetic); order ran most to least (owner: lowest on the left). | **S.** Rail reversed to least-on-left (`dev(x) - dev(y)`); hints point to Cold Draw-off; renamed Holder A–C to Cylinder A–C. | yes |

#### `boss-compressor` (5 phases)

| # | Phase | Re-tests | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | The Intake | `q2` stage 6. | "gauge", "room"; reward 41 words. | **S.** Reworded to pressure and volume; reward trimmed to 38 words. | yes |
| 2 | The Blend | `q4` stages 2 and 3. | "pushes", "gauge"; used same 60/100 numbers as `q4` stage 3. | **S.** Changed target to 75 kPa N₂ of 125 kPa total (`1.8, 1.2, 2.0, 1.0` mol); reworded to partial pressure and total pressure. | yes |
| 3 | The Tanks (typed) | `q3` stages 4 to 6. | "Gauge", "Room" on plaque. | **S.** Plaque updated to Pressure and Volume. | yes |
| 4 | The Cold Box | `q6` stage 3. | "Holder", "squeezes", "room"; dial-matching only. | **M.** Added `answerCards` + `seen.temp.includes(1)` coldest-visited check (for NH₃); placed slot clear of `FOE_PAD`; renamed Holder to Cylinder. | yes |
| 5 | The Seals | `q5` stage 3. | "half-time". | **S.** Reworded hint 3 to "half-empty time". | yes |

### Open for the builder

- `q1` stage 3: whether `box` can Record pressure against °C with the straightedge and marker (old `q2` stage 3 did this for a `rig` and volume). If only the `rig` can, use a rig with the piston locked.
- `q1` stage 4: whether the `rig` prints a collisions counter that a stage can turn on ("the counters a stage turns on").
- `q2` stage 2: the owner asked for a continuous heater. A continuous dial would let the student turn until the volume doubles; the plan keeps stops and moves them so the answer lies between two. If a continuous dial is wanted, change the stage to set the dial (no typing) and say so.
- `q3` stages 4 and 5 and boss phase 3: how a sealed `tank` piece prints volume and temperature (`plate: true`), and whether the scale reads the mass of gas or of gas and tank.
- `q4` stage 3: whether `commonTank` can hide the per-gas pressure line.
- `q5` stage 7 and `q4` stage 5 remain plate or card stages with nothing that responds.
- Words in `tools/` checks that match "room", "gauge", "Holder".

### Hand-back (plan)

- 40 stages: reworded (S) 30, redesigned M 10, L 0. Of the 40, 1 is new (`q1` stage 3) and 1 merges two. Cut: 9, plus the one lost in the merge.
- Most likely to go wrong in the build: `q1-knocks` (a new first-principles kelvin stage, a changed graded act in stage 4, and the world-wide rename of room, gauge, push and knocks, which checks may match); `q4-mixtures` (three stages change what the tanks print); `q3-ideal` (plates replaced by tank pieces inside the phone-size floors).

### Structural changes

- Reduced Bellows (`unit04`) from 50 stages across 7 quests to 40 stages (`q1-knocks` 7, `q2-laws` 6, `q3-ideal` 6, `q4-mixtures` 5, `q5-speed` 7, `q6-real` 4, `boss-compressor` 5). Pre-pass files archived in `archive/2026-11-11/bellows/`.
- `gas.js`: added `dialed(state, f, dialName)` and `seen` tracking on `rig` and `box` so stages can verify that a player visited key dial settings (halving volume in `q1` stage 4, coldest temperature in `q6` stage 3 and `boss-compressor` phase 4).
- `gas-draw.js`: replaced stand-in readout labels (`GAUGE` → `PRESSURE`, `ROOM` → `VOLUME`, `KNOCKS` → `COLLISIONS`, `IDEAL LAW` / `DIFFERENCE` / `KINETIC ENERGY`).
- Populated `src/learn/glossary/bellows.js` (and registered in `glossary/index.js`) with all world terms and `BANNED` stand-in words; cleaned `tour-bellows.js` and `bank/unit04.json` of stand-in words.

### Chemistry corrections

- Standardized gas-law terminology across all benches, Tour steps, and bank items (`pressure`, `volume`, `collisions`, `compress`, `cylinder`/`tank`, `partial pressure`, `mole fraction`).
- `q1-knocks` stage 3: replaced `q2`'s old straightedge volume-zero stage with a `box` temperature-zero stage introducing absolute zero (−273 °C) and kelvin.
- `q4-mixtures` stage 3 & `boss-compressor` phase 2: separated their numbers (`q4` uses 60/100 kPa, `boss-compressor` uses 75/125 kPa) and hid per-gas partial pressures on `q4` stage 3 so mole fraction must be computed.
- `q5-speed` stage 4: added explicit formulas and molar masses (`NH₃, 17 g/mol` and `HCl, 36.5 g/mol`) to the diffusion prediction prompt.

### Still weak

- **`q1-knocks` stages 1–2**: `gauge` still appears as the physical instrument noun ("Three Gauges", "pressure gauge") where the world's `BANNED` rule targets `gauge` used as a synonym for pressure.
- **`q1-knocks` stage 4 & 7, `q3-ideal` stage 2, `q4-mixtures` stage 2, `q5-speed` stage 2–3 & 5, `q6-real` stage 2**: interactive instruments display live readouts (`COLLISIONS`, `KINETIC ENERGY`, volume, partial pressure, half-empty time), so a careful observer can read/match numbers directly without computing first; kept by design as observational discovery benches.
- **`q3-ideal` stages 4 & 6, `q4-mixtures` stage 5, `q5-speed` stage 7, `boss-compressor` stage 3**: static plaque/card stages with no responding dial/valve on the table (`q3` stage 4 uses a fixed `tank` with `plate: true`; `q4` stage 5 and `boss` phase 3 use a `plaque`; `q5` stage 7 uses `hist` cards).
- **`q6-real` stage 3 & `boss-compressor` phase 4**: combine setting the heater to the crossover point and placing the cold-attraction reason card in one stage.

### For the owner to look at

- `q1-knocks` stage 3 (`Where Pressure Runs Out` on `box` with recorder + marker), stage 4 (`COLLISIONS` counter + `seen.volume` halving check).
- `q2-laws` stage 2 (`586 K` typed between dial stops) and stage 3 (worked case + typed).
- `q3-ideal` stage 4 & 5 (`tank` with `plate: true` on `scaleFixture`), `q4-mixtures` stage 3 (`partials: false` common tank) & stage 4 (`noGauge` tanks lowest-on-left rail).
- `q6-real` stage 3 & `boss-compressor` phase 4 (`answerCards` + `seen.temp.includes(1)` check, slot clear of `FOE_PAD` on boss), `q6-real` stage 4 (least-deviation-on-left rail).

### For close-out

- `unit04` stage count changed: 50 → 40 (`q1-knocks` 8→7, `q2-laws` 7→6, `q3-ideal` 9→6, `q4-mixtures` 8→5, `q5-speed` 8→7, `q6-real` 4→4, `boss-compressor` 5→5). `PRODUCT.md` and `CLAUDE.md` still reflect pre-close-out counts (`verify:docs` currently fails on `PRODUCT.md` having 595 vs registry 571).
- Shared `gas.js` / `gas-draw.js` updates (`dialed()` hook, `seen` tracking, updated labels) and `glossary/bellows.js` registration in `glossary/index.js`.
