# Mirrowen · `q3-boil` — Liquids and Vapour (CED 3.1, 3.2.A.1, 3.3)

Eight stages, one click ("water boils at 100 °C, always"), built on the matter kit's vapour part (`table/kits/matter-vapour.js`), data in
`engine/matterdata-vapour.js` (and `matterdata.js` `ANTOINE`, `vaporPressure`, `boilingPoint`, `LIQUID_PROPS`, `WATER_DENSITY`). Quest module
`quests/unit06/q3-boil.js`, verifier `tools/lib/mirrowen/q3-boil.mjs`, painter `ui/story-scenes-mirrowen-q3.js` (`boil-flask`).
BUILDS_ON: `unit06/q2-grip`, `unit04/q1-knocks` (pressure, kPa), `unit04/q4-mixtures` (gas over water), `unit03/q2-lattice`.
VOCABULARY: vapor pressure (s1), boiling point (s4), surface tension and viscosity (s6). The copy spells "vapor" (the CED's spelling);
the chart title keeps "Vapour".

## Instruments and pieces

| Kind | What it does | Reads |
| --- | --- | --- |
| `vapour` (flask) | A liquid card in a slot, a gauge that rises and levels off when "Settle" is pressed (a trace, or a plot of pressure against temperature built from the readings taken), dots above the liquid counted as P over T. Optional Heater dial (20 to 100 °C in tens) and Outside dial (sealed, 101, 65, 45 kPa). Boils (bubbles, "BOILS") when the Settle reading's pressure is at or above the Outside setting. | `vaporPressure(substance, T)`; T is the card's own temperature, else the Heater dial, else 25 °C |
| `surface` (plate) | "Test" lifts a ring off the liquid (the pull is the surface tension, mN/m) and times 5 mL through a narrow tube. A table keeps one row per liquid tested. | `LIQUID_PROPS`, densities (`matterdata-vapour.js`) |
| `cell` (equal boxes) | "Weigh" prints the mass of a 1 cm³ cube of ice or of water at 0 °C. | `WATER_DENSITY` |
| `jar` | A gas collected over water: printed gauge (101.3 kPa) and temperature (35 °C), molecules mixed (not counted by kind). Fixed. | the stage's own numbers |
| `liquid` card | Molecule glyph, name, a second line, and the pressure (or mass) it kept. | the flask / cell stamp |
| `pack` card | A box of molecules at one scale: an open lattice of 11 or a packed liquid of 12 (the ratio of the densities). | `PICTURE_COUNT` |

Reused: `probe` and `mol` cards (q2) in stage 5, the heat kit's `note` cards and `selector`. Flat only; no `dress3d` / `piece3d`, so `3D On`
shows the flat pictures on the plate with the default card slabs.

## The stages

| # | Prompt | Evidence on the bench | Prints (and why it is not the answer) | Ramp / form |
| - | --- | --- | --- | --- |
| 1 | Order ether, ethanol and water by the pressure the gauge settles at in a sealed flask. | Flask at 25 °C, three liquid cards on a rail | Each card prints its q2 grip (26.5, 38.6, 40.7 kJ). The pressures print only after Settle; the grip is a different quantity, so the order must be read from the flask. Earns **vapor pressure** | Picture; flat |
| 2 | Order the four samples by the pressure the gauge settles at. | Same flask; cards carry their own temperature (water 80 °C, ether 0 °C, ethanol 40 °C, acetone 25 °C) | The temperature on each card. Not the readings (17.8, 24.8, 30.7, 47.3 kPa). The strongest grip settles highest because it is hot | Proportional picture; flat |
| 3 | Where the outside air pressure is only 65 kPa, as on a high mountain, at what temperature will water boil? | None (predict stage): cards "It still boils at 100 °C", "It boils below 100 °C", "It boils above 100 °C" and a slot | The guess cards only | Guess (the click) |
| 4 | (Quotes the guess) Type the temperature at which water boils when the outside pressure is 65 kPa. | Flask with Heater (20 to 100 °C) and Outside dials, the plot of readings, an amber line at the outside pressure, bubbles at a step where the liquid boils | The plot axes and the outside value from the dial. No boiling point is printed. The answer (88.06 °C) lies between the 80 and 90 °C steps (flask 47.3 and 70.1 kPa) | Typed figure past the dial's steps, tolerance ±3 °C; earns **boiling point** |
| 5 | Order butane, n-pentane, acetone and water by boiling point. | The q2 probe (kJ per mole read per card), cards with masses and partial charges, a rail | Masses and partial charges. The probe reading is the grip, not the boiling point; the order follows from stages 1 to 4 | New case; flat |
| 6 | Which reading follows the grip across the three liquids: surface pull, pour time, both or neither? | Surface and pour plate (table of results), cards printing the grip, an answer dial | Grips on the cards. The two columns print after Test | Reading of two orders; earns **surface tension**, **viscosity** |
| 7 | File each picture box under the sample it shows. | Equal boxes (0.917 g, 1.000 g per cm³), two picture boxes of 11 and 12 molecules, trays Ice and Water at 0 °C | Box labels A and B; counts are drawn, not printed | Counted evidence; flat |
| 8 | Type the pressure of the gas alone in the jar, whose gauge reads 101.3 kPa. | Flask with Heater (20 to 50 °C) and plot; jar picture (35 °C) | Gauge and temperature of the jar. The water's pressure at 35 °C lies between the 30 and 40 °C steps (4.2 and 7.4 kPa on the cards of the flask) | Typed figure past the dial; ±0.4 kPa |

## Wrong answers, hints and rewards

1. Reversed rail → "ether sits left of ethanol, and the flask read 71.2 kPa for the one and 7.8 kPa for the other." Hints: Use the flask, its "Settle" key and the rail. / Compare what the gauge settled at for each card with the number printed on the card. / Rank the cards by the pressure each one settled at, from the lowest to the highest. Reward "Vapor Pressure": molecules leave and return; the gauge stops when the flows match; the weaker the grip, the higher it settles.
2. The 25 °C order (the click's cousin: strong grip means low pressure always) → "water sits left of ethanol, and the flask read 47.3 kPa for the one and 17.8 kPa for the other." Hints: flask and rail / compare the reading with the temperature on each card / rank by what the flask settled at, whatever the liquid. Reward "Heat Raises It".
3. Predict: no wrong answer; the guess is stored (`remember`) and quoted by stage 4. Hints: the cards and the slot / the last two stages / commit to the card you believe. Reward "Now Test It".
4. 100 → "At 100 °C the flask's pressure is 101.3 kPa, and the outside pressure is 65 kPa." Any wrong figure gets the same sentence with its own pressure. 80 or 85 (the middle of the bracket) are refused the same way; 86 to 90 pass. Hints: dials, "Settle" and the number field / compare the plotted line with the amber line and see which step the flask boils at / read where the line meets the amber line between two steps. Reward "Boiling Point" with a verdict line on the guess.
5. Rank by mass (water, acetone, butane, n-pentane) → "water sits left of acetone, and the probe read 40.7 kJ for the one and 29.1 kJ for the other." Hints: probe, key, rail / compare each reading with the mass and the + and − marks / rank by boiling point from the probe and what the flask showed. Reward "The Grip Sets the Boiling Point".
6. "Both" (or any wrong position) → the whole table read back: "water 72.8 mN/m and 10.0 s on grip 40.7 kJ; ethanol 22.3 mN/m and 15.2 s on grip 38.6 kJ; hexane 18.4 mN/m and 4.7 s on grip 28.9 kJ." Hints: plate, "Test", answer dial / compare each column with the grips on the cards / line up by grip, see which column keeps the order. Reward "Surface Tension and Viscosity" (ethanol grips less than water yet pours slower).
7. Boxes swapped → "Box B holds 11 molecules and box A holds 12, and box B sits in the "Water at 0 °C" tray." Hints: boxes and trays / compare the two masses and count molecules / the box with fewer molecules in the same space goes under the lighter sample. Reward "Why Ice Floats".
8. 101.3 → "The jar's gauge reads 101.3 kPa, and the gauge counts everything inside the jar." The 30 °C and 40 °C steps (97.1, 93.9), a sum (106.9) or the vapor alone get "The gas and the water vapor make up the gauge's 101.3 kPa between them, and … kPa of gas leaves a different share for the vapor than the plot shows at 35 °C." Hints: card, Heater, "Settle", number field / compare the jar's temperature with the steps either side / read the water's pressure between them, then work out what is left of the gauge. Reward "Gas Over Water".

Bank: `bench.q3-boil` has two problems and one worked problem (gas over water at 40 °C, five steps), plus three end problems (`q3-boil#0` to `#2`).

## What is weak

* Stage 1 and 2 are both ranks on one instrument. Stage 1 makes the discovery that every liquid has a plateau and prints the grips beside it, but
  it does not force the grip pattern: a student who notices the printed grips can rank without the flask. Stage 5 is where the pattern is needed.
* Stage 4 has nine heater steps and a plot built from the readings; a student who knows the bracket (80 to 90 °C) can type 88 without taking every
  reading. That is allowed (never block a correct answer). The "bubbles at this step" cue is a bracket, not a lamp to hunt for.
* Stage 6's surface and pour readings are model readings of CRC values (a ring without a correction factor, a tube whose water time is a convention of
  10.0 s); the Tour says what each does. Viscosity is not explained beyond "the grip is not all that sets it".
* Stage 7 asks for a match of two pictures to two samples. The lattice picture is drawn as an ordered network and the liquid as a packing, so a student
  who knows ice is ordered can match without weighing; the counts (11 and 12) and the masses agree with each other.
* Stage 8 is not a sealed sample of the whole bench. It does use stages 1 to 4 (the plot, the temperature rise) and Bellows' Dalton.
* The grip beside each liquid on the cards is the enthalpy of vaporization at that liquid's own boiling point, so "weaker grip, higher pressure at 25 °C" is
  a pattern among these three or four liquids, not a law (hexane and acetone would swap), and the reward says only what the bench measured.
* Nothing here was viewed in a browser or at `3D On`; the flat painters were run in Node against a stub context (no NaN, no exceptions) and laid out by
  `verify:table`.
