# Kettle `q8-kinds` — Kinds of Reaction (CED 4.7, 4.8, 4.9)

Branch `world/unit07-q8`. Quest `src/learn/quests/unit07/q8-kinds.js`; kit `src/learn/table/kits/pot-kinds.js`; planners `src/learn/engine/reactdata-kinds.js`
(`reactdata.js` is untouched); story `src/ui/story-scenes-kettle-q8.js` (`furnace-log`); checks `tools/lib/kettle-q8-kinds-checks.mjs`.

## The click

Students hold **"a reaction is one kind only."** Stage 7 asks for the guess (four cards: three single kinds and "More than one kind", no instrument on the table);
stage 8 gives eight reaction cards and a "Look for" dial over five kinds. The dial remembers the light of each card per kind, so the same card can be lit under
several kinds. Magnesium burning is lit under synthesis, combustion and redox; the table refuses a card lit under one kind only by naming the reading it shows.

The five kinds are synthesis, decomposition, combustion, acid-base, redox (`kindsFull`). `reactdata.js` `kindsOf` is not used: it misses a metal burning, an
acid giving a proton to ammonia, and mis-reads a hydroxide's hydrogen. Combustion here is "a substance burning in oxygen": O₂ is a reactant and the reaction is redox,
so Mg + O₂ counts. Hydrogen burning would count too and is not on the log.

## Stage table

Dependencies: `unit07/q1-recipe`, `unit07/q6-stoich` only. **No precipitation stage:** the seed's stage 3 (file the precipitation reactions from `q5-ionic`) waited, since
`q5-ionic` is a separate build and this bench may not use a word earned only there. Its place became the prediction that opens the click (7 + 8). Precipitation is not one of
the five kinds on the board. The integrator may add it back as a new case once `q5-ionic` is merged.

| n | Prompt | Evidence on the bench | Printed, and why none of it is the answer | Slip → refusal | Ramp / idea |
| --- | --- | --- | --- | --- | --- |
| 1 | Put each pot in the tray that matches what the window shows. | window (pieces): six pots, dial + Run; atoms before and after | pot names and formulas under the atoms; trays named by what is seen ("Several become one") | Pot F (burning methane) in "Several become one" → "Pot F showed 2 substances before and 2 after, and it is in the tray…" | synthesis, decomposition |
| 2 | Burn the fuel, test the gas it leaves, and file what the burning made. | burner (methane jar, empty gas jar), gas rig with four tests (legend on the rig says what each test answers) | the legend says what a test does, never what the jar holds | Carbon filed with water, limewater never tried → "Carbon is in the tray, but none of the tests tried in the jar found it." | combustion |
| 3 | Put each pot in the tray that matches what the window shows. | window (proton): five pots; an amber ring marks a hydrogen ion only if one passes (acid + base) | formulas; the ring appears only after Run | Pot E (Mg with HCl: electrons, no proton) in the ring tray → names what the window shows after Run | acid-base reaction |
| 4 | Choose the particle that gave electrons and the one that took them. | window (electrons): Zn + CuSO₄; amber dots count the electrons from the oxidation-number change | the charges after each symbol; "2 electrons moved" is not the answer (the answer is who gave) | swapped → "Cu²⁺ has no dots before the reaction."; sulfate → "has no dots before the reaction or after it" | oxidation, reduction, redox |
| 5 | Type the number manganese carries in MnO₄⁻. | window (numbers): CO₂, NO₃⁻, SO₄²⁻ worked out; typed answer +7 is past every worked case | the rules plate (lone atom 0, oxygen −2, hydrogen +1, all together the charge); worked rows | 8 (charge forgotten) → "With +8 on manganese and −2 on each of four oxygens, all together is 0, and the ion's charge is −1." | oxidation number; ramp: picture (worked species), proportional-free, typed past the worked range |
| 6 | Name the gas in each sample jar. | gas rig + three sample jars (CO₂, H₂, O₂) + four names (nitrogen is the decoy) | the legend per test; samples named only A, B, C | CO₂ sample named hydrogen → lists what that sample's tests gave | gas tests applied |
| 7 | Choose what kind of reaction magnesium burning in oxygen is. (PREDICT) | none: equation plate, four guess cards, a slot | the equation only | — | the held model |
| 8 | Light each reaction card under every kind it belongs to. (prompt quotes the guess) | eight cards (equation + states only), "Look for" dial, a raw reading beside each card per kind | readings are raw: "2 in, 1 out"; "O₂ goes in"; "H⁺: HCl to NH₃" / "no H⁺ moves"; the oxidation numbers before→after. No card names a kind. | only Mg lit under synthesis → names the first reading it disagrees with | reactions overlap |

Hints (three rungs, one sentence each) and rewards are in the module. Mode: all flat; the idea is pieces, readings and counts, not shape or position, so no reward model.

## The eight cards of the log (hand-worked)

Zn + CuSO₄ → redox. 2 Mg + O₂ → MgO: synthesis, combustion, redox. HCl + NaOH: acid-base. CaCO₃ → CaO + CO₂: decomposition. CH₄ + 2 O₂: combustion, redox.
NH₃ + HCl → NH₄Cl: synthesis, acid-base. Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂: redox (the furnace log). 2 H₂O → 2 H₂ + O₂: decomposition, redox. Every kind lights on at least two cards.

## Story

Lead line: "Vess finds a furnace log that lists reactions nobody has named." Scene `furnace-log`: Fe₂O₃ + 3 CO, numbers from `oxNumbers`, six electron dots travelling from the
three carbons to the two irons; each atom's number moves one step per dot. Filed: the ore gave up its oxygen to carbon, so it was reduced, not made from nothing.

## What is weak

- Stage 1 and 3 are two sorts of the same mechanics (chips into trays after reading a window). They differ in the idea; an owner who finds them alike could merge 3 into 8.
- Stage 5 is arithmetic on rules; the worked cases are the picture, but it remains the closest thing to plate-and-type on the bench.
- Stage 8 prints a per-kind reading beside every card. The readings are raw (counts, oxygen side, the numbers), but "H⁺: HCl to NaOH" is close to the definition of acid-base.
- Combustion has no instrument of its own on the board beyond which side O₂ stands on; the heat and light are in the reward only.
- Marks per kind are kept by a kit `settle` hook reconciling `flipped` with the dial; if undo/redo in play drops a light, that is the place to look.
- Not played in a browser (by rule). The owner should play 1, 2, 4, 6 and 8.
