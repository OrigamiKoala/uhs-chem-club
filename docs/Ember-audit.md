# Ember Reach audit (unit05, thermodynamics)

Run: 2026-10-29, one autonomous pass (one audit, one fix round, one partial re-check). Ember Reach is seven benches and the Crucible on the heat kit (`src/learn/table/kits/heat*.js`).
Counts now: q1 4 stages, q2 6 (was 5), q3 5 (was 3), q4 6 (was 5), q5 4, q6 5 (was 4), q7 5 (was 4), boss 5 = 40 stages (was 34).

## What I played and what I did not

Labels: **Played** = in the built-in browser at 3D On as Guest with real pointer gestures; **Viewed** = loaded and read from a screenshot (at most one gesture); **Code** = quest file, kit and verify scripts only; **Bench** = `verify:bench` solves it through the real pointer path (drag and two taps) at seven viewports, which proves a hand can finish it but not that it reads well.

I knew every answer, so I cannot say where a first-time student gets confused. Only a few stages were played end to end. The browser tool's synthetic drag ends short of its target and the dev server reloads the page whenever any agent saves a file, so most stages were loaded and viewed rather than played; the rest rest on `verify:bench`. This is not a full play audit, and the second and third passes the brief asks for were not run (see the end).

## Blocking defects

None found that stopped a stage being finished. Small ones:

| Defect | Evidence | Status |
| --- | --- | --- |
| A tin or block seated in the cup mouth covers the cup's RISE readout (q1 s4, q2 s4) | Screenshots | Open: BATH stays readable, and each tin prints its own "bath +x °C" once it has been in. |
| A drop that ends near the mouth but outside the slot leaves the card lying over the cup, and a later grab of it threw the camera instead (q2 s4, synthetic drag) | Screenshots, state read back (`zone: null`) | Open, not reproduced with a real hand; the same drop on the slot's centre seats. The drop rule in `gestures.js` is shared, so I left it. |
| The note line on q4 s6 sits beside the "Formed" tray label | Screenshot | Cosmetic, left. |
| New q6 s5: plate and marker touched | Screenshot | Fixed (plate narrowed, marker moved). |

## Per-stage table

Verdicts: Op = operable by a hand; Int = intuitive from the table; Busy = busywork (Y is bad); Intu = the picture builds the idea; Acc = accurate. AP topics are the 2019 CED: 6.1 endothermic and exothermic, 6.2 energy diagrams, 6.3 heat transfer and equilibrium, 6.4 heat capacity and calorimetry, 6.5 energy of phase changes, 6.6 enthalpy of reaction, 6.7 bond enthalpies, 6.8 formation, 6.9 Hess; Unit 9: 9.1 entropy, 9.2 absence of favourability, 9.3 Gibbs, 9.4 thermodynamic and kinetic control, 9.5 free energy and equilibrium.

### q1-flow

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Join two blocks to finish at 50 °C | Played: A onto B, both read 50.0 | ok | ok | N, but the equal-mass average is easy | thermometers on the blocks | ok | 6.3 |
| 2 | Predict: spark or warm tank | Played: card to slot, Submit | ok (the card settles slowly) | ok | N | the 1200 °C card is the wrong model | ok | 6.3 |
| 3 | Warm the frozen valve with a source | Viewed + code | ok | ok | N | masses printed; the tiny spark barely moves it | ok | 6.3, 6.4 |
| 4 | Sort four tins by the bath's change | Played: tin onto cup, bath +15.8 kept | ok | ok | N | the bath is measured | ok | 6.1 |

### q2-calorimetry

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict: same heat in water or iron | Code | ok | ok | N | "same" is a card | ok | 6.4 |
| 2 | Heater dial until iron rises as far as water | Code, Bench | ok | ok | dial over five settings, but the answer cannot be guessed | iron needs a tenth | ok | 6.4 |
| 3 | Marker to the heat the water absorbed | Code, Bench | ok | formula on a plate | plug and chug, but the first number work and on a friendly bath | the rise is on the thermometer | ok | 6.4 |
| 4 | **New.** Ice in a 100 g bath: heat it absorbed melting | Played to the seated state: bath 20.0 to 3.4 °C; plate and marker rendered | ok (the drop must land on the dark mouth) | ok | N: two terms (melting, meltwater warming) must be separated | mixing alone would end at 16.7 °C; the bath ends at 3.4 | ok (334 J/g, 6.0 kJ/mol) | 6.5 |
| 5 | Name a metal from the bath's rise | Code, Bench | ok | ok | N | two readings (rise and fall) | ok | 6.4 |
| 6 | Marker to the heat a reaction gave the bath | Code, Bench | ok | ok | plug and chug after stage 3 | per-mole figure comes next bench | ok | 6.4, 6.6 |

### q3-enthalpy

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Set the chart to ΔH per mole | Code, Bench | ok | ok | N | the shelf drops | ok | 6.6, 6.2 |
| 2 | **New.** Moles dial 0.05, 0.10, 0.20, then 0.30 mol past the dial | Code, Bench | ok | ok | N: proportional first, then extrapolated | heat doubles with moles | ok (48 kJ) | 6.6 |
| 3 | Predict: best fuel per gram | Code | ok | ok | N | the per-mole figures are the wrong model | ok | 6.6 |
| 4 | Rank four tins by how far each warms the tank | Code, Bench | ok | ok | N | measured readings stay on the tins | ok | 6.6 |
| 5 | **New.** Heat from 6.0 g of H₂ given ΔH for 2 H₂ + O₂ | Code, Bench | ok | ok | calculation, but the slip answers are real (per-mole, per-gram) | no picture | ok (858 kJ) | 6.6 (ΔH goes with the equation) |

### q4-bonds

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict: pulling H–H apart | Code | ok | ok | N | | ok | 6.7 |
| 2 | Crank the bond, set the energy change | Viewed (crank panel, meter, marker) | ok | ok | N | the well curve | ok (436 kJ/mol) | 6.7 |
| 3 | Sort methane's bond chips into Broken and Formed | Viewed: chips as solid atoms and rods | ok | ok | Y, partly: reactant or product read off the printed equation, counts pre-multiplied | solid bond chips | ok (−802) | 6.7 |
| 4 | Predict: air joining to nitric oxide | Code | ok | ok | N | the "all reactions run downhill" model | ok | 6.7 |
| 5 | Read the ledger, lay the card | Viewed | ok | ok | Y, partly: the ledger prints both totals, so the card is a comparison | | ok (+181) | 6.7 |
| 6 | **New.** Fill the ledger for H₂ + Cl₂ → 2 HCl, set the estimate | Viewed + Bench | ok | ok | N: nothing is pre-placed; the player sums and subtracts | | ok (−184, real −184.6) | 6.7 |

### q5-hess

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict: one step or two | Code | ok | ok | N | | ok | 6.9 |
| 2 | Build C + O₂ → CO₂ on two stacks | Viewed: three cards, two stacks print totals | ok | ok | N | two totals side by side | ok | 6.9 |
| 3 | Build CH₄ from three cards (flip, double) | Viewed: dial starts on the unflipped slip | ok | ok | N | the stack prints the net equation | ok | 6.9 |
| 4 | CaCO₃ from the formation cards | Viewed | ok | ok | N | | ok | 6.8, 6.9 |

### q6-entropy

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict: where four particles stand | Code | ok | ok | N | | ok | 9.1 |
| 2 | Shake the chamber, read the bars | Viewed: chamber and histogram painted small | ok | text small | N | counts of arrangements build up | ok | 9.1 |
| 3 | Sort four changes into more or fewer ways | Viewed | ok | ok | Y, partly: the player counts gas moles in printed equations; no picture of the particles | | ok | 9.1 |
| 4 | Rank four boxes by room and motion | Viewed: solid boxes of twelve particles | ok | ok | N | the boxes | ok | 9.1 |
| 5 | **New.** ΔS for CaCO₃ → CaO + CO₂ from a table | Viewed after the fix | ok | ok | N: products less reactants, with slips named | | ok (+160.2) | 9.1 |

### q7-gibbs

| # | Stage | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict: a cold pack on its own | Code | ok | ok | N | | ok | 9.2 |
| 2 | Dial to the lowest temperature where it dissolves | Code, Bench | ok | ok | hunting over five settings, but each prints HEAT, SPREAD and NET | the plot | ok | 9.3 |
| 3 | Sort four sign cases by temperature | Code | ok | ok | N | | ok | 9.3 |
| 4 | **New.** ΔG at 298 K from ΔH (kJ) and ΔS (J) | Played: dial clicked to "−32.7 kJ"; viewed | ok | the answer labels only show while turning | N | the unit slips are options | ok (−32.7) | 9.3 |
| 5 | Marker at the melting temperature of ice | Code, Bench | ok | ok | hunting the dial first | the plot | ok (273 K; matches q2 s4's 334 J/g) | 9.3 |

### boss-crucible

| # | Phase | Evidence | Op | Int | Busy | Intu | Acc | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Heat the jacket caught | Code, Bench | ok | ok | plug and chug, the quantity stage 3 of q2 taught | | ok | 6.4 |
| 2 | Ledger for N₂ + 3 H₂ → 2 NH₃ | Viewed: chips pre-sorted, ledger prints both totals | ok | ok | answer is a subtraction of two printed totals | | ok (−93) | 6.7 |
| 3 | Hess stack for Fe₂O₃ → 2 Fe + 1.5 O₂ | Code, Bench | ok | ok | N | | ok (+824.2) | 6.9 |
| 4 | ΔS from an entropy table | Code | ok | ok | N; the miss message ("The dial does not match the table") has no consequence | | ok | 9.1 |
| 5 | Temperature at which the limestone seal fails | Code | ok | ok | hunting the dial | | ok | 9.3 |

## AP coverage

| CED topic | Where | Verdict |
| --- | --- | --- |
| 6.1 endothermic and exothermic | q1 s4, q4 | covered |
| 6.2 energy diagrams | q3 s1 (the shelves) | covered qualitatively; no activation-energy diagram (belongs to a kinetics world) |
| 6.3 heat transfer, equilibrium | q1 | covered |
| 6.4 heat capacity, calorimetry | q2 | covered, quantitative |
| 6.5 energy of phase changes | q2 s4 (new) | covered once: ice melting; no heating curve and no vaporisation |
| 6.6 enthalpy of reaction | q3 | covered after the added stages (per mole, scaling, per equation) |
| 6.7 bond enthalpies | q4 | covered, with a ledger the player fills (s6) |
| 6.8 formation | q5 s4, boss p3 | covered |
| 6.9 Hess's law | q5 | covered |
| 9.1 entropy | q6 | covered, with ΔS° from a table (s5) |
| 9.2 absence of favourability | q7 s1 to s3 | covered |
| 9.3 Gibbs free energy | q7 | covered, with a number worked at 298 K (s4) |
| 9.4 thermodynamic and kinetic control | none | missing (needs a kinetics bench) |
| 9.5 free energy and equilibrium (ΔG° and K, Q) | none | missing; recommend adding once the equilibrium world exists |
| Calorimetry with a constant-volume bomb, ΔU and ΔH, work | none | missing (not in the CED's AP calculations, optional) |
| Heating curves, ΔH_vap | none | missing; recommend a q2 stage on steam |

## Work log

1. Read PRODUCT.md, CLAUDE.md, the problems doc, every quest header and the heat kit's read functions.
2. Heat kit: cups now take a block with a latent heat (`block(..., { latent })` in `heat.js`; `cupRead` in `heat-read.js` returns `melted`). Warm the ice to 0 °C, pay for each gram that melts, then share one temperature.
3. q2: new stage 4, ice in the bath. `verify-ember.mjs` now allows 3 to 7 stages per quest.
4. q3: new stage 2 (the cup's Moles dial at 0.05, 0.10, 0.20 mol; 0.30 mol past the dial) and new stage 5 (ΔH goes with the equation; 6.0 g of hydrogen).
5. q4: new stage 6 (chips not pre-placed; estimate ΔH for H₂ + Cl₂ → 2 HCl).
6. q6: new stage 5 (ΔS from a table). The Crucible's phase 4 asked for this with no earlier bench teaching it.
7. q7: new stage 4 (ΔG at 298 K with the J/kJ slip as an option).
8. `tools/lib/ember-learn-checks.mjs`: stage indices moved, graded figures for each new stage recomputed from `thermodata.js`, refusal leak lists extended.
9. Checks run: `verify:learn`, `verify:table`, `verify:ember`, `verify:story`, `verify:bench` clean for Ember Reach. `verify:learn` and `verify:table` also fail on unit04 stages (another agent's work in progress), unrelated to these changes.

## What is still weak

Rebuilt in the second round: q4 s5 and s6 and the ledger now hide the Broken and Formed kJ totals (`hideTotals` on `ledgerFixture`), so the player adds the chips' energies; q7 s5 and Crucible phase 5 print ΔH and ΔS on a plate so the temperature is computed, with the dial left as a check. Third round: q4 s3 now gives single-bond chips and the player sets each count with "Larger" (bond chips are scalable, `maxScale` 4, counts multiply in `ledgerRead`); q7 s2 asks for the temperature the salt starts to dissolve at, read between two dial settings (about 238 K, ±12). Not rebuilt: q6 s3 (still sorts printed equations; it needs a new before-and-after particle card).

- The re-audit passes were not run: after the fixes I re-viewed only the new stages (q4 s6, q6 s5, q7 s4, q2 s4, boss p2). A full second pass over every stage in the browser is still owed.
- q4 s3 and s5 still ask for reading a printed equation or two printed totals. A rebuild would put a molecule picture (atoms and rods) on each chip's tray so the player counts the bonds themselves.
- q6 s3 sorts printed equations by their gas count with no picture of the particles.
- q7 s2, s5 and the boss's last phase hunt a dial value after the sign changes. A formula plate and a marker (as in the new q7 s4) would make T = ΔH/ΔS the thing the student computes.
- Miss messages were reworked to name what the bench shows: q6 s3 prints the entropy table's before and after figures, q7 s3 prints the line's ΔG at 100 K and 600 K, and boss phase 4 has real slip options (sign, products alone, steam taken off once) with a consequence each. q4 s3 and s5, q5 s3 and s4 and the boss's stack phase still use the generic "adds up to a different reaction" or "wrong tray" wording.
- The first prediction cards sit near the edge of the slot after Submit; harmless.
- Mixing-temperature rule (`equilibriumTemp`) ignores the cup's own heat capacity; fine for the lagged cup.

## What only a person can judge

- Whether the new ice stage's two-term arithmetic (melting plus warming the meltwater) is too much for a first calorimetry bench. The easier alternative is to ask for the heat per gram directly.
- Whether the answer-dial stages (q7 s4, boss) read as a choice of figures or as a guessing game, since the option labels show only as the dial turns.
- Whether the cup readouts hidden under a seated tin matter in play.
- How the camera and drop behave under a real mouse or finger when a drop lands beside the mouth.
- Pacing: five more stages across the world, most of them calculations.
