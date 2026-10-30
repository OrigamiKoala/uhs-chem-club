# Bellows audit (unit04, gases)

Run: 2026-10-28, one autonomous pass. Bellows is six benches and the Compressor boss, on the gas kit (`src/learn/table/kits/gas*.js`).
Counts now: q1 6 stages, q2 6, q3 7, q4 6, q5 6, q6 4, boss 5 = 40 stages (was 33).

## What I played and what I did not

Evidence labels used in the tables below:

- **Played**: the stage in the built-in browser at 3D On, as Guest, with real pointer gestures (drag, click), and the console checked.
- **Viewed**: the stage loaded in the browser at 3D On and read from a screenshot, with at least one real gesture or one scripted action, but not played through.
- **Code**: read from the quest file and the verify scripts only; not seen in the browser.

I did not play any stage as a student who does not know the answer: I knew every solution. I cannot see confusion; the final section lists what only a person can judge.
Browser notes: the pane is 800 x 600, a bench takes 10 to 40 s to appear after a hard reload on the dev server (black until it does; not a fault of the stage), and the synthetic drag the browser tool makes ends short of its target (a dial dragged across the whole track stopped part-way), so dial gestures were checked by clicking the track and by the pointer-to-units mapping.

## Blocking defects found and fixed

| Defect | Evidence | Fix |
| --- | --- | --- |
| The glass cube of the sealed box (q1 s2) stood over the three gauge figures, the title and the heater dial's start knob | Screenshot: ROOF reading hidden, "Holder 4, sealed" and "Heater" overlapped, the knob invisible at 20 °C | Readings stand in a column beside the vessel; the vessel starts 18 units under the dials and the cube is 0.72 wide high (`gas-draw.js` `boxGeometry`, `gas-3d.js`) |
| Cylinder names printed behind the leaning glass tube ("Hol er 2") and the Piston/Heater dial row hidden | Screenshots of q1 s3, s4, s5 | A lone cylinder names itself in the panel title; the tube starts 7 units under the dial row (`rig()` `titled`, `rigGeometry`) |
| Tank pieces unreadable: the lid legend lies flat under the valve and gauge head, so room and temperature (the evidence of q3 s3) could not be read | Zoom of q3 s3, s6 | Every built tank has a tag facing the player (`paintTag`, `buildTank`) |
| q6 s3 stacked two cylinders per panel; the second cylinder's name printed over the first one's readouts | Screenshot of q6 s3 | Four titled single-cylinder panels, each name carrying gas, room and temperature |
| The recorder strip's figures were painted at 9 px on a 512 px sheet and never named the vertical axis (q2 s3, q3 s4) | Screenshot: axis numbers unreadable | `TrendPlot` takes `fontPx`; the 3D strip paints at 20 px, draws the y-axis name, and the line is thicker (`trendplot.js`, `table3d.js`) |
| Pinhole chamber names printed behind the glass (q5 s2) and a two-line how-to read in the wrong order | Screenshot of q5 s2 | Chambers start 3 units lower; note shortened to two lines that stay together |
| Dropping a tall piece (a tank) with the pointer over the tray but its foot on open table put it on the table | q4 s2 play: tanks landed at y 53.6 in a tray that ends at 53 | A drop whose pointer is over a place and whose piece centre is not goes in that place (`gestures.js`) |
| Reward text was cut at the decimal point ("2500 ÷ 1.") | q1 s4 footer | `clampSentences` splits only at a stop followed by a space (`frame.js`) |
| An unseen Record key (q1 s2): the strip it fills was never shown | Code + play | Removed with the strip |

## Per-stage table

Verdict key: Op = operable by a hand; Int = intuitive from the table alone; Busy = busywork (Y is bad); Intu = the picture builds the idea; Acc = accurate. AP = CED topic (2019 CED: 3.4 ideal gas law, 3.5 kinetic molecular theory, 3.6 deviation from ideal behaviour; 3.3 IMFs for context).

### q1-knocks (Pressure and Temperature)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict which wall's gauge reads most | Played: card dragged into slot, reward shown | ok | ok | N | the weight model is a card | ok | 3.5 |
| 2 | Box with three gauges and a heater: which statement do they back up | Played: heater clicked and dragged, readings column read, card flow | fixed | ok after fix | N | three gauges + 3D crowd | ok | 3.5 |
| 3 | Set the piston so the gauge reads six times | Viewed + scripted; verify | ok | ok | was a sort of four printed readings (Y); now reasoning on 1/V | gauge and knocks together | ok (P x V = 2494 kPa L) | 3.4 (Boyle) |
| 4 | Gauge at 1.5 L, past the dial | Played: dial dragged, card dragged, Submit, reward | ok | ok | N: worked figure with a "squeeze cannot lower it" sanity card | extrapolation from the bench | ok | 3.4 |
| 5 | Order four speed snapshots by temperature | Viewed (screens, snapshots, rail) | ok | ok | N: comparing shapes | speed screen + 3D crowd | ok | 3.5 (Maxwell-Boltzmann) |
| 6 | Set Holder 6's heater so the two gases carry the same energy (was a sort of four readings) | Played: heater track clicked to 100 °C, both ENERGY readings 7.73 | ok (dial hit band widened) | ok | N | same energy, 3x the speed | ok | 3.5 |
| 7 | Gas pressure in atm from a mercury U-tube (new, round 2) | Code, verify; the drawn tube was not looked at | ok | ok | N | the column is drawn at 0.05 units a millimetre beside its figure | ok (950 mmHg = 1.25 atm) | 3.4 (manometer, mmHg) |
| 8 | Slope of gauge against 1 ÷ room, from recorded points (new, round 3) | Code, verify | ok | ok | N | the line is straight through the origin; the gauge alone is the slip | ok (P×V = 2494 kPa·L) | 3.4 (graphs, slope = nRT) |

### q2-laws (The Gas Laws)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict 20 to 40 °C | Code | ok | ok | N | the Celsius-doubling model is a card | ok | 3.4 |
| 2 | Heat Holder 8 until its room is twice Holder 7's | Code, verify | ok | ok | hunting over six settings, but the answer (313 °C) cannot be guessed | the Celsius trap is a setting | ok | 3.4 (Charles) |
| 3 | Record, lay the straightedge, set the marker at zero room | Played: Record x3, straightedge by drag, line reaches the axis | needs the drag (the "Straightedge" key does not say so; the Tour does) | ok after text fix | N | a line carried past the data | ok | 3.4 |
| 4 | Predict a sealed tank cooled to −30 °C | Code | ok | ok | N | the Celsius model is a card | ok | 3.4 |
| 5 | Cool the tank, lay the card | Code | ok | ok | N | the plotted line | ok | 3.4 (Gay-Lussac) |
| 6 | Room at 327 °C past the dial (new) | Viewed: kelvin readout beside room | ok | ok | N | room over kelvin is constant | ok | 3.4 |
| 7 | Final gauge after a squeeze and a heating together (new, round 2) | Code, verify | ok | ok | N | the squeeze-alone, heating-alone and Celsius-ratio slips are cards | ok (600 kPa) | 3.4 (combined law) |

### q3-ideal (The Ideal Gas Law)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict: mole of He vs CO₂ | Viewed | ok | ok | N | the "heavier fills more" model is a card | ok | 3.4 |
| 2 | Add CO₂ until its room matches He's | Code, verify | ok | ok | N | gas mass shown beside room | ok | 3.4 (Avogadro) |
| 3 | Sort four tanks by particles against Tank A | Played: tank dragged into a tray | was unreadable, now ok | needs P V / T per tank | N | tags carry room and temperature | ok | 3.4 |
| 4 | Find PV / nRT from recorded points | Code | ok | ok | partly (copying a number off a line) | the line through the origin | ok (R = 8.314) | 3.4 |
| 5 | Moles from a printed plate (new) | Viewed | ok | ok | N | slips: decimal point, factor of ten | ok | 3.4 |
| 6 | Name a sealed gas from plate and mass (new) | Played: drag, Submit, reward | ok | ok | N | moles then molar mass | ok | 3.4 (molar mass from density) |
| 7 | Atmospheres, litres, degrees C (new) | Code, verify | ok | ok | N | the unit slips are cards | ok | 3.4 |
| 8 | Grams per litre from gauge, kelvin and molar mass (new, round 2) | Code, verify | ok | ok | N | moles-per-litre and the inverted quotient are cards | ok (1.76 g/L) | 3.4 (d = PM/RT) |
| 9 | Percentage error in the moles from a thermometer that reads 5 K low (new, round 3) | Code, verify | ok | ok | N | the wrong-sign answer is refused with a reason | ok (+1.7%) | experimental error |

### q4-mixtures (Partial Pressures)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict neon's push when helium joins | Code | ok | ok | N | crowding model is a card | ok | 3.4 |
| 2 | Open both tanks, read neon's own push | Played: tanks dragged into the tray (readout 150 kPa for Ne) | fixed (drop by pointer) | ok | N | each gas has its own particle shape | ok | 3.4 (Dalton) |
| 3 | Open tanks until nitrogen is 60 % | Viewed | ok | ok | hunting, but each try shows the share | shares printed | ok | 3.4 |
| 4 | Rank four tanks by push | Code | ok | ok | N | moles beat weight | ok | 3.4 |
| 5 | Altitude: set the height where oxygen's own push has halved (was a sort of four readings) | Code, verify; one of four dial settings passes | ok | ok | N | the mixture holds while the push falls | ok (5500 m: 0.52) | 3.4 |
| 6 | Oxygen's own push from moles and the gauge (new) | Code, verify | ok | ok | N | the moles-as-share slip is a card | ok | 3.4 |
| 7 | Gas alone over water: gauge minus vapour pressure (new, round 2) | Code, verify | ok | ok | N | adding the vapour on is a card | ok (752 − 24 = 728 mmHg) | 3.4 (collected over water; the moles of product are Kettle's) |
| 8 | Percentage error in the dry gas when the vapour is not subtracted (new, round 3) | Code, verify | ok | ok | N | the wrong sign and the wrong denominator are refused | ok (+3.3%) | experimental error, gas over water |

### q5-speed (Speed and Escape)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict He vs N₂ leak | Code | ok | ok | N | | ok | 3.5 |
| 2 | Rank four chambers by emptying | Viewed | ok | ok after label fix | N | | ok | 3.5 (effusion) |
| 3 | Match a reference gas to the stack leak | Code | ok | ok | partly (match until it lights) | | ok | 3.5 |
| 4 | Predict where NH₃ and HCl meet | Code | ok | ok | N | | ok | 3.5 |
| 5 | Run the tube, lay the card | Code | ok | ok | N | | ok | 3.5 (diffusion) |
| 6 | Molar mass from a half-empty time (new) | Viewed | ok | the mass is printed on the gas dial | N | the nearest-match slip is a card | ok (CH₄ 16.04) | 3.5 (Graham) |
| 7 | Speed that carries the average kinetic energy at 300 K (new, round 2) | Code, verify | ok | ok | N | the mean speed, the missing 3 and grams for kilograms are cards | ok (517 m/s) | 3.5 (rms speed, KE = 3/2 RT) |
| 8 | Order four 300 K speed snapshots (He, N₂, CO₂, Xe) from lightest to heaviest (new, round 3) | Code, verify | ok | the earlier stages earn heavier = slower | N: comparing shapes | the heavy gas is taller, narrower, further left | ok | 3.5 (Maxwell-Boltzmann by molar mass) |

### q6-real (Real Gases)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict a squeezed gauge against the gas law | Code | ok | ok | N | | ok | 3.6 |
| 2 | Squeeze helium, lay the card | Viewed | ok | ok | N | particles drawn at true size | ok | 3.6 |
| 3 | Warm cramped CO₂ until its gauge reads on the law (was a sort of four holders) | Code, verify; one of five heater settings passes (900 K) | ok | ok | N | below when cold, above when hot, between them the two effects cancel | ok (vdW ratios checked) | 3.6 |
| 4 | Rank cold gases by deviation | Code | ok | ok | N | optional draw-off record is new evidence | ok | 3.6, 3.3 |

### boss-compressor

| Phase | Evidence | Verdict |
| --- | --- | --- |
| 1 intake: piston and heater together, gauge hidden, six times the plaque | Code, verify (only the pair 5 L / 177 °C passes); bench layout checked by verify:bench | rebuilt, round 2: combined law, a Celsius trap in the dial labels |
| 2 blend: nitrogen 60 kPa of a 100 kPa gauge from four tanks | Code, verify (only tanks A, B, C pass) | rebuilt: two quantities at once; the old rank of three tanks is cut |
| 3 tanks: the mass of gas from a plate in atm, L and °C | Code, verify | rebuilt: a worked figure with the Celsius, moles-as-grams and doubled slips as cards |
| 4 cold box: warm ammonia until the gauge reads on the gas law | Code, verify (only 1200 K passes) | new, the boss now draws on bench six |
| 5 seals: match the reference gas to the unmarked seal | Code, verify | unchanged |

The old phases 2 to 4 (heat to double the room, sort tanks by particles, rank three tanks) repeated stages the benches already ask. They were replaced, not archived: their stage ideas live on in q2 s2, q3 s3 and q4 s4, and no check was removed without a replacement.

## AP coverage

| CED topic | Where | Status |
| --- | --- | --- |
| 3.4 Ideal gas law: Boyle, Charles, Gay-Lussac, Avogadro | q1 s3 s4, q2, q3 | covered, with worked figures |
| 3.4 PV = nRT with units (atm, kPa, L, K) | q3 s4 s5 s7 | covered (new) |
| 3.4 molar mass from mass, P, V, T; density d = PM/RT | q3 s6, s8 | covered |
| 3.4 Dalton's law, mole fraction, partial pressure figures | q4 | covered (new figure stage) |
| 3.5 KMT: kinetic energy and temperature, Maxwell-Boltzmann by temperature and by molar mass; root-mean-square speed | q1 s5 s6, q5 s7 s8 | covered; u = √(3RT/M) is worked once |
| 3.5 effusion, Graham's law | q5 | covered with a figure (new) |
| 3.6 deviation from ideal: size and attractions, high P / low T | q6 | qualitative, correct; no van der Waals constants (not on the AP exam) |
| Combined gas law P₁V₁/T₁ = P₂V₂/T₂ | q2 s7, boss phase 1 | covered |
| Manometers, mmHg and torr | q1 s7, q4 s7 | covered (open-tube manometer; mmHg and atm) |
| Gas collected over water | q4 s7 (vapour pressure only) | covered; the moles of product are Kettle's |
| Graphs: P against V curves, P against 1/V is a line, slope = nRT; V against °C reaches zero at −273 | q1 s8, q2 s3 | covered |
| Experimental error: percentage error, direction of a systematic slip (forgotten vapour correction, a thermometer that reads low) | q3 s9, q4 s8 | covered with typed signed answers |
| Gas stoichiometry | Kettle (unit07) | out of this world |

## Work log

1. Read PRODUCT.md, CLAUDE.md, the clashing-rules doc and all seven quest files. Started the dev server on 3014.
2. Played q1 s1 and s2 in the browser; found the glass over the readings and the dial knob. Fixed the box and the cylinder geometry; removed the unseen Record key from q1 s2. Commit `687e85a`.
3. Rewrote q1 s3 (target, not sort) and added s4. Added a worked-figure stage to q2 (s6), q3 (s5, s6), q4 (s6) and q5 (s6); predict-stage hints now spend all three rungs on science. Commit `a0ecdc9`.
4. Found the tank pucks unreadable at q3 s3; added the tag, the data plates for the worked-figure stages, the recorder-strip text size and axis name, pinhole labels, drops by the pointer. Commits `Bellows: worked-figure stages print…` and `…tank tags…`.
5. Rebuilt q6 s3; rewrote rung 3 of the hint ladders that restated the objective; added q3 s7 (units); fixed the reward-text clamp. 
6. Registry and PRODUCT.md counts: 247 to 254 stages.

## Second pass

Done after the changes above, over the changed stages only (see "Played / Viewed" above). Findings left open are listed under "Still weak".

## Still weak

- q6 s3 and boss phase 4 are still searches over five heater settings: the real-gas behaviour cannot be worked out on paper, so a typed answer does not fit them. q2 s2 and q4 s3 were converted to typed answers in round 3.
- The error stages cover two kinds of slip (a forgotten correction, a miscalibrated instrument). Random error, significant figures and a leaking vessel are not asked.
- The graph stage asks for one slope. Choosing which of several plots is straight, and reading a graph that is drawn for the player, are not asked.
- The manometer is a drawing painted on a plaque (`paintManometer` in `gas-draw.js`); it has no 3D body, and it was not looked at in a browser. Only an open-tube manometer is drawn, not a closed one.
- Gas over water stops at the vapour correction. Turning that pressure into moles of the product belongs to Kettle.
- The Tour was not read word by word for the new stages; `verify:table` passes (it checks that every kind has a step) and the new stages use only cards, plates and dials that already have steps.

## What only a person can judge

- Whether the worked-figure stages feel like reasoning or like arithmetic; whether the slip cards are too obvious.
- Whether "six times its starting figure" reads as a puzzle or as a trick.
- Whether the tank tag and the printed plates are large enough on a phone (375 px landscape); I checked an 800 x 600 pane only.
- Whether any stage is still crowded: stage 2 of q5 (four chambers, a dial and a rail) and boss phase 2 (four tanks and the common tank).
- Whether the hidden gauge in boss phase 1 reads as fair, or as a trap; and whether the U-tube on q1 s7 reads at a glance.
- The feel of the 3D camera on a real touch drag.

## Round 2

7. Rebuilt q4 s5 (altitude: set the height where oxygen's own push has halved) and q6 s3 (warm cramped CO₂ until its gauge reads on the law). Both were sorts of printed readings.
8. Added q1 s7 (manometer), q2 s7 (combined gas law), q3 s8 (density), q4 s7 (gas over water) and q5 s7 (root-mean-square speed). Each is a worked figure with its slips as cards.
9. Rewrote boss phases 1 to 4 (see the boss table). Boss phase 3's answer slot sits clear of the foe's corner.
10. Stage counts: q1 7, q2 7, q3 8, q4 7, q5 7, q6 4, boss 5 = 45. `verify:learn`, `table`, `story`, `bellows`, `bench`, `run`, `drills`, `arena`, `sync`, `tallow`, `lanternfall`, `ligar` and `ember` pass. Nothing was played in a browser this round.

## Round 3

11. Typed entry (the Ember Reach system: `stage.entry`, `entryNumber`, a `type` step in the scripts) replaces the answer cards in q1 s4 s7, q2 s6 s7, q3 s5 s7 s8, q4 s6 s7, q5 s6 s7 and boss phase 3. The `*_CARDS` lists stay as the slips each stage must refuse (verify holds them); the cards are gone from the tables, so the right figure is no longer on screen. Left as cards: q3 s4 (the straightedge's R), q3 s6 (name the gas) and the predict stages.
12. q2 s2 now asks for the temperature that doubles the room; the dial no longer has a setting at 313 °C, so it cannot be hunted for. q4 s3 asks for nitrogen's share of the total pressure with all four tanks open, and the common tank no longer prints the share.
13. New stages: q1 s8 (graph, slope), q5 s8 (Maxwell-Boltzmann by molar mass), q3 s9 and q4 s8 (percentage error, signed typed answer, `_shared.js` `entrySigned`).
14. Counts: q1 8, q2 7, q3 9, q4 8, q5 8, q6 4, boss 5 = 49. PRODUCT.md stages=276 (includes other worlds). The same checks as round 2 pass; nothing was played in a browser.
