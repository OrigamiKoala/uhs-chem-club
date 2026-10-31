# Kettle `q3-change` — Physical or Chemical (CED 4.1, 4.4)

Status: built on branch `world/unit07-q3`. Files: `src/learn/quests/unit07/q3-change.js`, `src/learn/table/kits/pot-change.js`, `src/learn/engine/reactdata-change.js`,
`src/ui/story-scenes-kettle-q3.js`, `tools/lib/kettle-q3-change-checks.mjs`, plus the chart flip, the bank (`bench.q3-change`), the lead line and the story entry.

## The click and the bench

Students hold "burning loses mass". The bench shows three things the belief misses: an OPEN pot of burning steel wool GAINS mass (iron takes oxygen from the air,
4 Fe + 3 O₂ → 2 Fe₂O₃: 55.8 g becomes 79.8 g, +24.0 g), an open pot of burning wood loses mass (carbon dioxide and water vapour leave), and a SEALED pot weighs the same
before and after in both. Words earned: **physical change**, **chemical change** (stage 1), **evidence of reaction** (stage 2). `conservation of mass` is q1-recipe's (`BUILDS_ON`); stage 6
uses it on a whole pot. Lead line: *The forged ledger says metal came from nowhere, and Vess wants to know whether anything can.* Filed: a sealed pot weighs the same before and after, so the ledger's extra
metal came from somewhere.

## Instruments (`pot-change.js`, all numbers from `reactdata-change.js` `planChange`)

- **Pot** (`changepot`): a seat for a sample jar (or one change fixed on the pot), an optional "Lid" dial (Open / Sealed), an optional amount dial, a "Run" key and a window:
  one disc for each `unit` moles, what stands in the pot BEFORE on the left, AFTER on the right (a gas an open pot loses is drawn in grey, marked "out"; oxygen the open air supplies is drawn after the run
  as "+O₂"). The foot prints SEALED or OPEN TO AIR, IN WATER, and the disc size. Run is a set-up lookup: a different jar, lid or amount is a new set-up and reads "press Run" again.
- **Balance** (`potscale`): weighs the WHOLE pot (its own weight left out, jar weights never counted): a BEFORE line and an AFTER line (after only once the pot is run). A sealed pot counts the oxygen sealed in with it.
- **Lamps** (`evidence`): gas given off, new colour, solid forms, temperature change. Dark until a run; then lit only by the planner. No lamp says "chemical".
- **Sample jar** (`cjar`): names what it holds and what is done to it ("Steel wool / burned"); in stage 8 it is "Sample A/B/C" and prints nothing else.

## The planner (`planChange(id, { sealed, scale })`)

Eight changes. Physical: ice melts (18.0 g), sugar in water (17.1 g in 90 g), salt in water (11.7 g in 90 g, drawn as its two ions held in the crystal and then in the water), dry ice warming (44.0 g). Chemical: sugar heated
(C₁₂H₂₂O₁₁ → 12 C + 11 H₂O(g), 34.2 g), steel wool burned (4 Fe + 3 O₂ → 2 Fe₂O₃, 55.8 g), magnesium burned (2 Mg + O₂ → 2 MgO, 24.3 g), wood chips burned (C₆H₁₀O₅ + 6 O₂ → 6 CO₂ + 5 H₂O, 16.2 g).
Products are `reactPlan`; a gas leaves an open pot and stays in a sealed one; an open pot takes its air reactants (O₂) in plenty, a sealed pot holds the amount sealed in with the sample.
Lamps: gas = a gas stands in the pot (or has left it) that was not a gas before; colour = a colour stands in it that was not there; solid = a solid stands in it that was not there; temperature = the change gives out or takes in at
least 2 kJ for the amount in the pot (a change the pot's heater drives, heated sugar, reads no temperature lamp). Heats of change are listed in the planner's header with their sources. A new substance = a species (by formula,
a salt's ions counting as the salt) in the pot after that was not before.

**Simplifications, said honestly:** wood is drawn as cellulose C₆H₁₀O₅ burning completely (real wood leaves ash; the open pot reads 0.0 g after); rust and the iron oxide of burning wool are Fe₂O₃; heated sugar is C₁₂H₂₂O₁₁ → 12 C + 11 H₂O
(a real caramel also loses volatile oils); a sealed pot is large enough to hold the oxygen the burn takes (the foundry's charging pot); the pot's heater is not modelled.

## Stages

Mode: **flat** everywhere (a window of discs, a balance and lamps are flat pictures; there is no spatial idea to stand up, so no `dress3d`/`piece3d` was built; `3D Off` draws the same thing). Ramp rung marked R.
Every stage: reward 1 to 3 sentences, hints three rungs (rung 1 names the control, 2 what to compare, 3 the method), refusals name what the table shows.

| n | Prompt | Evidence on the bench | Printed, and why none of it is the answer | Slip → refusal | Reward (idea) |
| --- | --- | --- | --- | --- | --- |
| 1 | Sort the four changes by whether a new substance is in the pot afterwards. | pot, window, jars Ice (melts), Sugar (in water), Sugar (heated), Steel wool (burned), trays "Same substance after" / "New substance after" | jar names and what is done to them; nothing about the result. The window is read after a run. | a physical change filed "new" → "Ice: the window shows H₂O before and H₂O after; lit: Temperature change." (the facts, not the rule) | **physical change**, **chemical change** |
| 2 | Pick the change that lit a lamp without making a new substance. | pot, window, four lamps, jars Dry ice, Wood chips, Steel wool, Sugar (in water); slot | Dry ice and wood chips light the SAME two lamps (gas, temperature); only the window tells them apart. | wood chips or sugar → their window and lit lamps | **evidence of reaction** (a lamp is evidence, not proof) |
| 3 | PREDICT: Choose how an open pot of steel wool weighs after the wool burns, compared with before. | only a plaque (open pot, steel wool 55.8 g), three chips, a slot | no instrument, no runnable control | — (a guess is never graded) | the guess is locked (`remember`) |
| 4 | (getter) Lay the chip for what the balance shows after the steel wool burns in the open pot. **The click.** | pot, window, balance, wool jar, three chips, slot | balance prints BEFORE only until run | "Lighter" or "The same" → "The balance read 55.8 g before and 79.8 g after." | an open pot gains: iron took oxygen from the air |
| 5 | Sort the three burns by whether the open pot weighs more or less afterwards. | pot, window (grey "out" rows for gas that left), balance, jars Steel wool, Magnesium, Wood chips, trays | no verdict printed | wood filed "more" → "Wood chips: the balance read 16.2 g before and 0.0 g after." | what crosses the lid decides |
| 6 | Type what a sealed pot weighs after 83.7 g of steel wool burns in it, with 36.0 g of oxygen sealed in. (R: picture, friendly numbers, then a figure PAST the dial) | pot with Lid and "Steel wool" dial (11.2, 22.3, 33.5 g), window, balance; typed figure | the prompt's 83.7 and 36.0 are inputs; 119.7 is printed nowhere; no dial stands at 83.7 | 83.7 → "83.7 g is the steel wool alone; 36.0 g of oxygen was sealed in with it."; other → the sealed pot's own before/after readings | **conservation of mass** applied to a whole pot (119.7 g) |
| 7 | Pick the change after which the pot holds the same particles it began with. | pot, window, jars Salt (in water), Wood chips, Steel wool, Magnesium; slot | the window shows Na⁺ and Cl⁻ in the crystal and again in the water | a burn → its window and lit lamps | dissolving a salt is classed as physical; the AP course notes a case can be made the other way because ionic bonds break |
| 8 | Sort samples A, B and C by whether a new substance forms in the sealed pot. | sealed pot, window, lamps, jars Sample A (wood chips), B (dry ice), C (ice); trays | jars hide what they hold; A and B light the same gas and temperature lamps | any wrong tray → the sample's window and lit lamps | a lit lamp is evidence; a new substance is proof |

Hints, prompts and rewards are in the module. No stage's check requires a run (a player who knows the answer is never blocked); a refusal before a run says the pot has not been run.

## Weak points, honestly

- Stages 2 and 7 are one-of-four picks (25 % blind). Stages 1, 5 and 8 are sorts (1/16 and 1/8 blind). All of them are decided by running the jars and reading the window.
- Stage 7 is the easiest stage: three decoys are plainly burning. The nuance (the AP course accepts an argument either way) is in the reward, not in a decision the table could grade.
- Stage 5 leaves an open wood pot reading 0.0 g after (complete combustion); it may read as "matter destroyed" until the grey "out" rows are noticed. Stage 6's typed figure is an addition, honest as a conservation check but not hard.
- The temperature lamp is a rule on the size of the heat (2 kJ), with heats from the formation table or the CRC; the lit/dark outcome for each change is checked, the exact kJ is not shown.
- The sealed pot for steel wool holds 24.0 g of oxygen (about 18 L): it is a big pot, which the bench never says.
- Window labels use formulas with state letters, (s) (l) (g) (aq), not explained anywhere on the table; the Tour text does not define them (the term "state symbol" belongs to q4-balance).
- Untested by hand: the 2D window's panel widths at 70 units, tray overflow when three or more jars go in one tray, the jar names at 6.2 px. Please play it.

## Verified in Node

`verify:learn`, `verify:table` (including "Predict first" and the Tour step per fixture and piece kind), `verify:story`, and `verify:quest-run` pass. `tools/lib/kettle-q3-change-checks.mjs` holds: the planner's weights, open and
sealed, for all eight changes against figures worked on paper; each change's four lamps and whether it made a new substance; dry ice and wood chips light the same lamps and differ in the window; the asked figure (83.7 + 36.0 = 119.7);
the pot, balance and lamps replayed through the real table (an after reading only after a run, a changed lid is a new set-up); blank benches never pass; the predict stage has no instrument; the hidden samples print nothing;
no plate or dial prints 119.7 and no dial stands at 83.7; every miss is refused with a reason that carries no method word and not the answer.
