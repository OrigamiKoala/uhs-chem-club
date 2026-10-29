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

### q2-laws (The Gas Laws)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict 20 to 40 °C | Code | ok | ok | N | the Celsius-doubling model is a card | ok | 3.4 |
| 2 | Heat Holder 8 until its room is twice Holder 7's | Code, verify | ok | ok | hunting over six settings, but the answer (313 °C) cannot be guessed | the Celsius trap is a setting | ok | 3.4 (Charles) |
| 3 | Record, lay the straightedge, set the marker at zero room | Played: Record x3, straightedge by drag, line reaches the axis | needs the drag (the "Straightedge" key does not say so; the Tour does) | ok after text fix | N | a line carried past the data | ok | 3.4 |
| 4 | Predict a sealed tank cooled to −30 °C | Code | ok | ok | N | the Celsius model is a card | ok | 3.4 |
| 5 | Cool the tank, lay the card | Code | ok | ok | N | the plotted line | ok | 3.4 (Gay-Lussac) |
| 6 | Room at 327 °C past the dial (new) | Viewed: kelvin readout beside room | ok | ok | N | room over kelvin is constant | ok | 3.4 |

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

### q4-mixtures (Partial Pressures)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict neon's push when helium joins | Code | ok | ok | N | crowding model is a card | ok | 3.4 |
| 2 | Open both tanks, read neon's own push | Played: tanks dragged into the tray (readout 150 kPa for Ne) | fixed (drop by pointer) | ok | N | each gas has its own particle shape | ok | 3.4 (Dalton) |
| 3 | Open tanks until nitrogen is 60 % | Viewed | ok | ok | hunting, but each try shows the share | shares printed | ok | 3.4 |
| 4 | Rank four tanks by push | Code | ok | ok | N | moles beat weight | ok | 3.4 |
| 5 | Altitude: sort four readings | Code | ok | ok | Y (sorting) | the share stays, the push falls | ok | 3.4 |
| 6 | Oxygen's own push from moles and the gauge (new) | Code, verify | ok | ok | N | the moles-as-share slip is a card | ok | 3.4 |

### q5-speed (Speed and Escape)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict He vs N₂ leak | Code | ok | ok | N | | ok | 3.5 |
| 2 | Rank four chambers by emptying | Viewed | ok | ok after label fix | N | | ok | 3.5 (effusion) |
| 3 | Match a reference gas to the stack leak | Code | ok | ok | partly (match until it lights) | | ok | 3.5 |
| 4 | Predict where NH₃ and HCl meet | Code | ok | ok | N | | ok | 3.5 |
| 5 | Run the tube, lay the card | Code | ok | ok | N | | ok | 3.5 (diffusion) |
| 6 | Molar mass from a half-empty time (new) | Viewed | ok | the mass is printed on the gas dial | N | the nearest-match slip is a card | ok (CH₄ 16.04) | 3.5 (Graham) |

### q6-real (Real Gases)

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict a squeezed gauge against the gas law | Code | ok | ok | N | | ok | 3.6 |
| 2 | Squeeze helium, lay the card | Viewed | ok | ok | N | particles drawn at true size | ok | 3.6 |
| 3 | Sort four holders above, on, below the law | Viewed after rebuild | ok | ok | Y (sorting printed pairs) | | ok | 3.6 |
| 4 | Rank cold gases by deviation | Code | ok | ok | N | optional draw-off record is new evidence | ok | 3.6, 3.3 |

### boss-compressor

| Phase | Evidence | Verdict |
| --- | --- | --- |
| 1 intake | Viewed: bench, foe plate and HUD render, piston dial reads | ok |
| 2 to 5 | Code, verify:bellows | each phase reuses an idea from a bench; no new figure work |

## AP coverage

| CED topic | Where | Status |
| --- | --- | --- |
| 3.4 Ideal gas law: Boyle, Charles, Gay-Lussac, Avogadro | q1 s3 s4, q2, q3 | covered, with worked figures |
| 3.4 PV = nRT with units (atm, kPa, L, K) | q3 s4 s5 s7 | covered (new) |
| 3.4 molar mass from mass, P, V, T | q3 s6 | covered (new); the density form d = PM/RT is not named |
| 3.4 Dalton's law, mole fraction, partial pressure figures | q4 | covered (new figure stage) |
| 3.5 KMT: kinetic energy and temperature, Maxwell-Boltzmann | q1 s5 s6 | qualitative only; the formula KE = 3/2 kT and root-mean-square speed are not worked |
| 3.5 effusion, Graham's law | q5 | covered with a figure (new) |
| 3.6 deviation from ideal: size and attractions, high P / low T | q6 | qualitative, correct; no van der Waals constants (not on the AP exam) |
| Combined gas law P₁V₁/T₁ = P₂V₂/T₂ | q1 s4, q2 s6 build both halves | not asked for as one figure |
| Manometers, mmHg and torr | none | missing |
| Gas stoichiometry, gas collected over water | Kettle (unit07) | out of this world |

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

- q4 s5 and q6 s3 are still sorts of printed readings; each carries a reasoning step (matching two heaters, comparing two figures) but the answer is read off a figure. Replace with a built target if a later pass has time.
- q2 s2 and q4 s3 are search tasks over discrete dial settings. Their answers cannot be guessed, but a student could still solve them by trial.
- Boss phases reuse bench ideas; none asks for a worked figure.
- No stage names combined gas law, root-mean-square speed, density d = PM/RT, manometers or mmHg.
- The Tour was not read word by word for the new stages; `verify:table` passes (it checks that every kind has a step) and the new stages use only cards, plates and dials that already have steps.

## What only a person can judge

- Whether the worked-figure stages feel like reasoning or like arithmetic; whether the slip cards are too obvious.
- Whether "six times its starting figure" reads as a puzzle or as a trick.
- Whether the tank tag and the printed plates are large enough on a phone (375 px landscape); I checked an 800 x 600 pane only.
- Whether any stage is still crowded: stage 2 of q5 (four chambers, a dial and a rail) and q6 s3 (four panels and three trays).
- The feel of the 3D camera on a real touch drag.
