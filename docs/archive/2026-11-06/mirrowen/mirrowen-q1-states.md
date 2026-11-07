# Mirrowen bench 1: `q1-states` (Three States, CED 3.3) — stage table

Built 2026-10-29 from the spec (`mirrowen-world.md` 3.1) and the builder brief. Files: `src/learn/quests/unit06/q1-states.js`, `src/learn/table/kits/matter-window.js`,
`src/learn/engine/matterdata-window.js`, `src/ui/story-scenes-mirrowen-q1.js` (scene `states-three`), `tools/lib/mirrowen/q1-states.mjs`; marked entries in the chart,
`stage-story.js`, `quest-story.js` and `bank/unit06.json`. Evidence label for everything below: **Scripted + Node-checked**. Nothing was played by hand or viewed.

## What changed from the spec table, and why

| Spec | Built | Reason |
| --- | --- | --- |
| Window with Squeeze, Heater, Pour and Read keys on one fixture | Four fixtures: PRESS (Squeeze dial + Pour key + tube + tank), WINDOW (Heater dial + Read key + molecules), JARSCALE (balance), no ruler | A fixture has one key. The press shows no molecule, so stage 2 can ask the player to infer the molecules from behaviour |
| Stage 6 "order by space between particles", stage 7 "weigh equal jars" | Stage 6 is the weigh-and-rank (ordered by room per molecule), stage 7 is typed: how many times as many molecules a litre of water holds as a litre of steam | Ice has MORE room per molecule than liquid water (917 g against 1000 g per litre). A picture cannot show a 9 % difference, so the balance is the only honest evidence for the rank; the two stages would otherwise repeat |
| Third belief "the molecules shrink" | "Each molecule itself melts, then turns into a gas" | The belief students really hold is that the particle takes on the sample's state |
| Sealed jars X, Y, Z | Four jars W, X, Y, Z of other substances: argon at -187 degC (liquid), iodine (solid), carbon dioxide (gas), ethanol (liquid) | A new case: a cold liquid and a solid that is not ice |

## The instruments (all flat; no `dress3d`/`piece3d`)

* **Press and tank**: a slot for a jar; "Squeeze" (Off, Light, Firm, Hard = 1, 1.5, 2, 3 atm); "Pour". A gas follows the pressure (V = 1/p); a solid and a liquid do not move, and the piston stops where it meets them. The tank shows a lump (the same block as in the tube), a flat layer (same area as in the tube) or a haze through the whole tank (the same dots). A jar remembers what it did (`props.did`: the smallest share of its room it was squeezed to, and the pour) so a refusal can name it.
* **Window and reader**: eight molecules in a glass, the same eight in every state (a solid is a lattice turned one way, a liquid a jumbled pool, a gas spread through the glass). "Heater" sets degC. "Read Molecule" names the molecules in the glass and the window keeps one line per temperature pressed. Jar "Split water" holds eight H2 and four O2 (the atoms of eight water molecules).
* **Balance**: one pan, every jar 1.00 L of water (ice and water at 0 degC, steam at 100 degC, 1 atm); "Weigh" writes the weight on the jar.
* Pieces: `jar` (a sealed jar printing only its label and, once weighed, its grams), `pbox` (a picture of one jar's eight molecules).

## Data (`matterdata-window.js`)

Densities of ice and water are the CRC rows already in `matterdata.js` (0.9168 and 0.99984 g/cm3). Steam at 100 degC and 101.3 kPa is 0.598 kg/m3 (IAPWS-95 saturated vapour, 3 s.f.); the ideal-gas value is 0.588, 1.6 % lower, checked in the verifier. Melting and boiling points: CRC. Steam jars are at 150 degC so the hardest squeeze (3 atm = 304 kPa) stays under the 476 kPa saturation pressure of water at 150 degC.
**Simplifications said honestly:** the picture draws the same eight molecules in every state (the amount is conserved) and draws gas gaps about 1.4 times a liquid's; the real figure is about 12 times (stage 7), which will not fit a card. The box card says so in its Tour step.

## Stages

Hints are (control / what to look at / method). Every prompt is one sentence of at most 25 words. "Prints" is everything the bench prints besides the jar label.

| # | Prompt | Evidence | Prints, and why it is not the answer | Wrong answer and its message | Reward | Form |
| - | --- | --- | --- | --- | --- | --- |
| 1 | Sort the three jars by what their contents do when squeezed and when poured. | Press and tank; jars A (water 20 degC), B (steam 150 degC), C (ice -10 degC) | Letters; trays are the three pour pictures "Stays a lump", "Pools flat", "Fills the tank", no state word | Steam in "Pools flat": "Jar B sits in the "Pools flat" tray, and its contents spread through the whole tank and squeezed to 33 % of its room." | Solid, Liquid, Gas | flat |
| 2 | Put each box of molecules in the tray of the jar it shows. | Press and tank again, boxes 1 to 3 (liquid, gas, solid), jars A (gas), B (solid), C (liquid) | Box numbers only | Solid and liquid boxes swapped: "Jar B stayed a lump in the tank and did not squeeze smaller, and box 1 is in its tray." | Molecules in Three States | flat |
| 3 | When ice melts and then boils, what happens to the molecules of water? | None (predict): cards "The bonds inside each molecule break and the atoms drift apart", "Each molecule stays whole and the molecules move apart", "Each molecule itself melts, then turns into a gas" | The cards | Never graded | Now Test It | flat |
| 4 | Sort the three changes by whether the reader names the same molecule afterward (prompt quotes the guess). | Window: ice jar at -10, 20, 110 degC; jar of split water; the reader | Change cards "Ice melts", "Water boils", "Electricity splits water"; trays "Same molecule" and "New molecule"; the reader lines are what the player pressed | Boil in "New molecule": "For the ice jar the reader named H2O at 20 degC and H2O at 110 degC." (or says which temperature was not read) | Phase Change, with a line contrasting the guess | flat |
| 5 | Pick what holds the molecules of the ice in place. | Window at -10, 5, 110 degC (the molecules stay put, then slide but stay together, then fly apart) and the reader | Cards "Bonds inside each molecule", "Pulls between one molecule and the next", "The molecules are only moving slowly"; slot "Holds the ice" | "Bonds" card: "The reader named H2O at 5 degC, where the molecules were already loose." "Slowly" card: "The streaks behind the molecules are about as long at 5 degC as at -10 degC." | Intermolecular Forces | flat |
| 6 | Order the three jars by the room each molecule has, from the most to the least. | Balance: A water 1000 g, B steam 0.598 g, C ice 917 g (equal 1.00 L jars of water) | Rail ends "Most room each" and "Least room each"; plate "Each jar holds 1.00 L of water" | Steam, water, ice: "Jar A sits left of Jar C, and the balance read 1000 g for the one and 917 g for the other." | Density | flat |
| 7 | Type how many times as many molecules the water jar holds as the steam jar. | Balance, jars Water and Steam | Plate as stage 6; readings kept on the jars | 1000: "The water jar read 1000 g and the steam jar 0.598 g; 1000 times does not fit the two." Accepts 5 % of 1672 | A Gas Is Mostly Empty | flat |
| 8 | Sort the four sealed jars into solid, liquid and gas. | Press and tank; W (argon -187 degC, liquid), X (iodine, solid), Y (CO2, gas), Z (ethanol, liquid) | Letters; trays "Solid", "Liquid", "Gas" | Argon in "Gas": "Jar W sits in the "Gas" tray, and its contents lay flat in the bottom of the tank and did not squeeze smaller." | Reading the State | flat |

Hints, by stage (rung 1 control, rung 2 look, rung 3 method):
1. Use the "Squeeze" dial and the "Pour" key on each jar, then drag the jar into a tray. / Compare what the contents of each jar do in the tube with what they do in the tank. / File each jar under the picture its contents made in the tank.
2. Try each jar in the press and the tank, then drag each box into the tray of the jar it shows. / Compare how far apart the molecules in each box are, and whether they stand in any order. / Match what a jar did when it was poured and squeezed with how the molecules in a box are placed.
3. Use the three cards and the slot. / Think of the same jar of water as ice, as water and as steam. / Commit to what you expect to happen to each molecule itself, not to the sample.
4. Put a jar in the square, turn the "Heater" dial, and press "Read Molecule" at each temperature. / Compare what the reader names for the ice jar at each temperature with what it names for the jar of split water. / File each change by whether the reader still names the molecule the jar started with.
5. Turn the "Heater" dial through its three settings and press "Read Molecule" at each. / Compare how the molecules move at each setting, whether they stay together, and what the reader names. / Rule out each card against what the window and the reader showed, and keep the one nothing contradicts.
6. Weigh each jar with the balance and its "Weigh" key, then drag the jars onto the strip. / Every jar is the same size and holds the same kind of molecule. / In jars of equal size, more weight means more molecules in the same space.
7. Weigh both jars with the balance and its "Weigh" key, then type your answer in the field at the bottom. / Both jars are the same size and hold the same kind of molecule, so compare what they weigh. / The weights of equal jars are in the same proportion as their numbers of molecules, so compare the two weights as a ratio.
8. Try each jar with the "Squeeze" dial and the "Pour" key, then drag it into a tray. / Compare what each jar did with what the jars of water did earlier. / A jar sorts by how its contents behave, whatever they are made of.

The click is stage 3 to 4 (and 4 to 5). Quantity ramp: the bench has one calculation, stage 7: picture (the press and tank, stage 6's rank), a prediction by the rank (steam far lightest), proportional reasoning (equal jars, weight follows molecules), a figure past anything the balance shows (1672, typed; the dial reads at most 1000). The slips (1000, the ice to steam ratio 1533, a factor of ten or a thousand) are refused with the two readings.

## Vocabulary and the Tour

`VOCABULARY`: solid, liquid, gas (stage 1), phase change (4), intermolecular forces (5), density (6). `BUILDS_ON`: `unit01/q1-grain` (molecule, atom), `unit03/q1-joins` (bond). The spec also listed `unit04/q1-knocks` and `unit01/q4-ledger`; neither is used, so neither is listed. Tour steps exist for `matter:press`, `matter:window`, `matter:jarscale` and the pieces `jar` and `pbox`. `verify:table` holds them to the VOCABULARY schedule.

## Story

Lead line (stage 1): "Vess wants to know whether the canal ice is a different substance from the water under it." Animation `states-three`: eight molecules in three jars (counted), one jar carried from solid to liquid to gas with the molecules, whole bonds and broken bonds counted from the drawn bond lengths, then a jar of water against a jar of steam with the grams from the data. Filed: "ice and water are one molecule, so ice is water held still by what lies between its molecules." (The bench measured an ice jar, not the canal ice, so the line does not say the canal ice was tested.)

## What is weak

* Stage 5 rules out "slowly" only by the length of the streaks (a statement about the picture, not an instrument reading) and rules out nothing else; the bonds card is refuted by the reader only if it was pressed.
* Stage 1 does not need the Squeeze dial (Pour separates the three jars); squeeze is used for the gas fraction in refusals and by stages 2 and 8. A player may ignore it.
* Stage 7 has no picture beyond the balance (a pbox cannot show equal volumes with a 1672-fold difference); it is close to plate-and-type, with the working carried by the stage 6 reasoning.
* Molecule cards are small (25 by 21 units) with discs about 5 px across at 667 px wide; legibility at 375 px is unchecked.
* Pictures are static; the streaks stand for motion. Gas gaps are drawn at about 1.4 times a liquid's, not 12.
* The jar is shown at `3D On` only as a card; the press, window and balance have no solids.
