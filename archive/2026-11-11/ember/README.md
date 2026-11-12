# Ember Reach: stages retired by the teaching pass (2026-11-11)

Each file holds the source of a stage as it stood when it was cut. Nothing here is built or verified. To restore one, paste the stage back into its quest's `STAGES`, add its `NOTES`, `SOLUTIONS` and `MISSES` entries, and raise `meta.stageCount` and the world chart's `stageCount`.

| File | What it was | Why it went |
| --- | --- | --- |
| `q1-flow.s5-unequal.js.txt` | `q1-flow` stage 5, Unequal Blocks: join a water block and an iron block so both finish at 27 °C. Solution `join('p','q')`, miss `join('r','s')`. | It needs specific heat capacity, which `q2-calorimetry` teaches, and its reward ("Water holds more energy per degree than iron") answered the prediction that opens `q2`. |
| `q2-calorimetry.s4-ice.js.txt` | `q2-calorimetry` stage 4, Ice in the Bath: type the heat 20 g of ice took to melt in a 100 g bath (solution 6700 J, miss 7000 J). | The answer was a two-step subtraction (the bath's loss less the meltwater's warming) hidden behind one thermometer, so the idea, heat with no rise in temperature, was never seen. Replaced by Heat With No Rise, where the student moves a burner along the heating curve. |
| `q2-calorimetry.s8-condense.js.txt` | `q2-calorimetry` stage 8, Steam to Water: type the heat 10.0 g of steam gives out cooling to water at 25 °C (solution 25.7 kJ). | The same sum as Ice to Steam run backwards; no new idea. |
| `q3-enthalpy.s7-limiting.js.txt` | `q3-enthalpy` stage 7, Which Runs Out?: type the heat when 0.040 mol HCl meets 0.060 mol NaOH. | Limiting reactant is taught in Kettle; owner decision of 2026-11-11 that it leaves Ember Reach. |
| `q3-enthalpy.s8-barrier.js.txt` | `q3-enthalpy` stage 8, The Way Back Over the Hill: type the reverse activation energy from a reaction-progress diagram. | Activation energy belongs to a unit that is not built; owner decision of 2026-11-11. The `levels` option of `shelvesFixture` that drew the hill is left in the kit, unused. |
| `q7-gibbs.s6-formation.js.txt` | `q7-gibbs` stage 6, Free Energy From Formation: type ΔG° for CaCO₃ → CaO + CO₂ from three formation free energies. | A third products-minus-reactants sum (after formation enthalpies in `q5` and entropies in `q6`) with a plate and nothing on the bench the number described. |
