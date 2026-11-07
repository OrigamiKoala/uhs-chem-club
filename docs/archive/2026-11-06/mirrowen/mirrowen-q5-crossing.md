# `q5-crossing` — The Crossing (Mirrowen bench 5, CED 6.5)

Files: `src/learn/quests/unit06/q5-crossing.js`, `src/learn/table/kits/matter-curve.js`, `src/learn/engine/matterdata-curve.js`,
`src/ui/story-scenes-mirrowen-q5.js`, `tools/lib/mirrowen/q5-crossing.mjs`. Eight stages (the chart says 8). BUILDS_ON `unit05/q2-calorimetry`,
`unit05/q3-enthalpy`, `unit06/q2-grip`. The one click: **heat added always raises the temperature.**

## The instruments (all flat; the picture is complete at `3D Off`, and `3D On` paints the same plate under real knobs)

- **Heat recorder** (`heatcurve`, 98 x 49 units, plot 54 x 22.4). A cup (or, from stage 3, a window of twelve molecules), a thermometer column, and a pen.
  The "Heat per press" dial sets a fixed heat (kJ, negative to cool) and the key adds it. The pen draws the whole line from the old total to the new
  one (`traceOf`), flats included, so a coarse dial never hides a corner. The running total is the last row the recorder took; no new state.
- **Cooler** (`cooler`): a slot for a sample card; one press cools it to 37 °C, draws the way down and stamps `gave` (kJ) on the card, as the q2 probe does.
- **Phase map** (`phasemap`, beyond the exam): a "Pressure" dial of six settings and a key that warms ice from −40 to 400 °C at that pressure; draws the line
  coloured by state and a square at each change; the list on the left names the states of the last sweep. Nothing is drawn but what sweeps found.
- Piece `hsamp`: a 20 x 14 sample card (name, mass, "gave x kJ" once cooled).

Data: `matterdata-curve.js`. One planner, `planThermal`, runs both directions along a single line of heat (`heatOf`/`stateAt`), agrees with `planHeating`
(held in the verifier at ten heats), and `heatBetween` gives the signed total. Phase diagram: IAPWS-IF97 saturation, IAPWS R14-08 sublimation and ice-Ih melting
(held to CRC/IAPWS values: 3.169 kPa at 25 °C, 101.42 kPa at 100 °C, 1.5549 MPa at 200 °C, 8.588 MPa at 300 °C, 0.260 kPa sublimation at −10 °C, ice melts
near 110 MPa at −10 °C).

## Stages

Hint rungs are control / what to look at / method in the quest file (single source). Ramp: P picture, G guess, R proportional, F formula, N friendly, T typed.

| # | Prompt (objective) | Evidence on the bench | Prints, and why it is not the answer | Wrong answers and messages | Reward / ramp |
| - | --- | --- | --- | --- | --- |
| 1 | Warm the ice until its temperature stands still, then set the marker at the heat where it rises again. | Recorder (cup, no window), Heat dial, marker whose line crosses the plot | Axes, the running heat and temperature. The end of the level stretch (6.76 kJ) is not printed anywhere; it is read where the pen turns. Marker starts at 0. | Marker inside the level stretch: "At 1 kJ the line there is level." Pen not drawn far enough: "The pen has drawn to x kJ, and the line has not yet stood still and climbed again." | *The Heating Curve* (heating curve). P |
| 2 | PREDICT: The temperature stood still while the ice took in heat: where did that heat go? | Three cards and a slot, no instrument | Cards: leaks into the room / works against the pull between the molecules / warms the cup and the air. Never graded | – | *Now Test It*. G |
| 3 | You guessed (x): heat the ice until the window shows all twelve molecules flying free. | Same recorder plus the window of twelve molecules, up to 70 kJ | The window shows molecules, never a word for the state; streak lengths follow the temperature only, so they do not change on a level stretch | Stopping early: "At 8.0 kJ the window shows 0 of the twelve molecules flying free." | *Heat Against the Pull*, quotes the guess. R |
| 4 | Type the heat needed to melt 36.0 g of ice at 0 °C, in kilojoules. | A cup of 18.0 g at 0 °C with window, dial 1/2/4 kJ, plot to 10 kJ; plate "1 mol of water is 18.0 g" | The cup's own line shows 6.0 kJ for its 18.0 g; no ΔH is printed | 6.0 (one cup): "6.0 kJ melts about 18.0 g of ice at the rate the cup showed, not 36.0 g." Any other figure gets the same sentence with its own mass | *Heat of Fusion* (heat of fusion). F, N |
| 5 | Type the heat needed to take 18.0 g of ice at −10 °C to steam at 110 °C, in kilojoules. | Recorder to 70 kJ, window, no running total; plate of the three c values, two ΔH values, molar mass | The plate is constants only; the total is neither printed nor reachable by pressing (dial 4/12/40 kJ cannot land on 54.9) | 48.9 (no melting): "48.9 kJ would leave the 18.0 g boiling at 100 °C with 86% of it turned to steam." Every wrong figure says where it leaves the sample | *Heat of Vaporization*. T |
| 6 | Type the heat change when 18.0 g of steam at 110 °C is cooled to ice at −10 °C, in kilojoules. | Recorder in cooling (dial −4/−12/−40, key "Cool"), plot with heat added below zero, no total, no plate | The mirrored line; nothing is printed about sign | +54.9: "That figure puts heat into the sample, and the pen for this sample runs to the left of zero." Other wrong figures say where they leave the sample | *Condensing and Freezing* (condensation, freezing). T |
| 7 | Order the four samples by the heat each gives a hand as it cools to body temperature. | Cooler, four 1.00 g cards (water 60 °C, water 100 °C, steam 100 °C, steam 120 °C), a rail; each card keeps what it gave | Card names and mass; readings only after the cooler | Steam left of water: "Steam 100 °C sits left of Water 100 °C, and the cooler read 2.52 kJ for the one and 0.26 kJ for the other." | *Why Steam Burns*. New case |
| 8 | Beyond the exam: find a pressure at which warming ice never makes liquid water. | Phase map, six pressures (0.1 kPa to 100 MPa), plate "Phase diagrams are not on the AP exam." | Axes only; lines appear as sweeps are run | 101 kPa: "At 101 kPa the ice melted to liquid water before it went further." | *Phase Diagrams* (phase diagram, triple point, critical point). Beyond the exam |

Sweeps at 30 MPa and 100 MPa also show the melting point falling below 0 °C and no boiling; the card names the triple and critical points.

## Honest weaknesses

- Stage 3 repeats the flat stretch of stage 1 on purpose (that is what a test is), but its task, "heat until all twelve molecules fly free", is nearly a
  goal state; the learning is in watching the window. The molecules in the window are twelve, so shares are to the nearest twelfth (stated in the data header).
- Stages 4, 5 and 6 are typed figures behind a picture, but a player who knows q = n ΔH can skip the picture. Stage 4's constant is measured off the cup; stage 5
  prints its constants on a plate (the instrument cannot read 40.65 to the accuracy needed).
- Stage 8 folds three phase-diagram ideas of the old plan (read a phase, triple and critical points, why the melting line leans back) into one experiment.
  The lean back is in the data (`meltingAt`) and on the plot only as a few pixels; it is not stated on a card. Stage 7's burn is a rank by the cooler's
  readings, so it is read off; the near tie of steam at 100 and 120 °C is the thing to think about.
- Pressure dial positions are six; two are right (0.1 and 0.3 kPa). It is a small search, not a hunt for a green lamp.
- Stage 1's marker is read off a plot (with a cursor line); it is the only stage that grades a plot reading.
