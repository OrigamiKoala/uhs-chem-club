# Teeter (`unit08`): equilibrium

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). After the Ember Reach exemplar. Not at the same time as Verdigris (shared `eqdata.js`). A plan session first is advised.
- **Earlier teaching pass:** 2026-11-06 (words, glossary, shared mechanism views, tap zones; record `docs/teaching-pass/Teeter.md`)
- **Quests:** `src/learn/quests/unit08/`. Chart `src/learn/worlds/unit08-equilibrium.js`. Bank `src/learn/bank/unit08.json`. Glossary `src/learn/glossary/teeter.js`. Checks: `verify:teeter` (`tools/lib/teeter-*-checks.mjs`), `tools/verify-teaching-teeter.mjs` with `tools/teaching-ratchet-teeter.json`.
- **Kits:** `pans*.js` in `src/learn/table/kits/` (`pans-3d.js` shared with Ember Reach and Mirrowen); `src/learn/engine/eqdata.js` (shared with Verdigris), `eqdata-free.js`.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit08 --totals`): 69 stages in 9 modules | briefing 0 | typed 11 (no instrument 0) | cards only 0 | reward long 14 | operation prompt 46 | hint 3 move/arithmetic 7 | vague 7 | register 0 | motive 4

## What is known to be wrong

- **The reactions are letters:** `E ⇌ 2 D`, `F + G ⇌ H`, `M + N ⇌ W`, `X ⇌ Z`. A student cannot picture any of them. Use real reactions a student can see (N₂O₄ ⇌ 2 NO₂ with its colour, H₂ + I₂ ⇌ 2 HI, Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺, a dissolving salt). Check every constant you introduce against a reference value and record it.
- **46 of 69 prompts open with an operation**, the most in the track.
- **`q4-properties` is eight stages of algebra on K with nothing physical happening**, and "Read K" prints K for a card that the student then matches. Cut to about four, each tied to particle counts the student can see.
- **`q5-ice` is five typed ICE-table problems, one with a quadratic.** Calculation pattern: see the change in particle counts, one worked case, then at most three typed cases. Drop the quadratic or give the small-change shortcut with its limit stated.
- **Motion beside the dial.** The earlier pass records that its mechanism views add motion next to the graded move and do not change it.
- `q8` stage 7 (ATP coupling) stays (owner decision): fix it to the standard.

## Bench notes

- `q1-both` (8): forward and reverse rates become equal (the world's core idea: equilibrium is dynamic, not stopped). The student should see individual particles still converting at equilibrium.
- `q2-k` (8): the equilibrium constant. K as a ratio of counts the student can see before it is a formula.
- `q3-q` (8): Q against K. Tap zones exist; the question should be which way the reaction runs and why.
- `q4-properties` (8): see above.
- `q5-ice` (8): see above.
- `q6-lean` (8): Le Chatelier. The student applies the stress to the vessel and watches the particles respond; the rule is a summary of what they saw, never a slogan to apply.
- `q7-dissolve` (8): solubility product.
- `q8-free` (8): equilibrium and free energy.
- `boss-tipper` (5): re-test.

## Owner requests to check against the source

None specific beyond `docs/feedback.md` general feedback.

## Traps

Zones that follow a picture (`kit.tapZones`) must be computed from the painter's scale. `verify:table` and `verify:bench` drive a tap with `pickSpot`, a dial by its track. Checks under `tools/lib/teeter-*` match some wording (one required "pan" in a refusal). Changing the reactions changes `eqdata.js` values that Verdigris reads: add, do not alter, shared entries.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

Planned 2026-11-11 by a plan session (no code changed). 69 stages become 56. Stage numbers are the new ones; "was n" gives the old index. Size: S strings and question only, M existing instrument with a new graded act or view, L new instrument.

**Real reactions in place of letters.** Every reaction is one a student can picture, and every constant is checked against a reference by the builder and recorded under "Chemistry corrections". Add entries to `eqdata.js`; do not alter the ones Verdigris reads.

| Was | Becomes | Constant to verify |
| --- | --- | --- |
| A ⇌ B (the pan of `q1`, K = 2) | butane ⇌ isobutane, drawn as the same atoms joined in a different shape (orange and blue stay) | K ≈ 2.5 at 298 K and falls with temperature; about 2.0 near 320 K. Either keep K = 2.0 and print "320 K" on the vessel, or move the model to 2.5. |
| "A" and "B" in the large-K and small-K vessels (`q2` stages 6 and 7) | bars labelled "Reactant" and "Product" | none: these are three unnamed reactions compared by K |
| E ⇌ 2 D, 2 D ⇌ E (`q4` stage 1) | N₂O₄ ⇌ 2 NO₂ and its reverse | Kp ≈ 0.15 at 298 K (Kc 0.0059, already in the world) |
| F + G ⇌ H doubled (`q4` stage 3) | 2 SO₂ + O₂ ⇌ 2 SO₃, K = 280 at 1000 K (already used by the boss), against 4 SO₂ + 2 O₂ ⇌ 4 SO₃ | 280 at 1000 K |
| X ⇌ Z by way of two steps (`q4` stage 5) | C(s) + H₂O ⇌ CO + H₂, then CO + H₂O ⇌ CO₂ + H₂, adding to C(s) + 2 H₂O ⇌ CO₂ + 2 H₂ | at 1000 K, about 2.6 and 1.4; verify both |

| Bench | Idea | Structure | Terms it introduces (gloss) |
| --- | --- | --- | --- |
| `q1-both` 8 → 6 | A reversible reaction stops changing with both substances present, because it runs both ways at equal rates; where it settles does not depend on where it started. | Cut: A Picture of the Settled Vessel (a diagram matched to the window) and Sealed Vessels (boss phase 1 is the same stage). | reversible reaction, ⇌, equilibrium, dynamic equilibrium, rate (how many particles change each second) |
| `q2-k` 8 → 7 | One ratio of amounts is the same for every settled vessel of a reaction: K. Coefficients become powers, solids are left out; a large K means mostly product. | Three Sealed Vessels cut (three K calculations; boss phase 2 re-tests). | equilibrium constant K, Kc, Kp |
| `q3-q` 8 → 6 | Q is the same ratio for any mixture; the reaction runs until Q equals K. | The second predict-and-run pair (HI) cut: the NO₂ stage teaches what a coefficient does to Q. Two stages lose the Run key so the direction is reasoned, not watched. | reaction quotient Q |
| `q4-properties` 8 → 4 | Writing a reaction backwards inverts K; doubling it squares K; adding two reactions multiplies their K. | Was eight stages of card algebra on letters. Kept: reverse, predict, doubled, two in a row, each on a real reaction, the first tied to the amounts in a settled vessel. Cut: halved, reach the reaction, Kp from Kc (RT to a power, on a plate), the typed wanted K. | none new |
| `q5-ice` 8 → 6 | Every substance changes by the same x times its coefficient; K then fixes x. | Order: see the change, worked case then first typed, predict, small K typed, when the shortcut is fair, K from one reading. Cut: A Small Start (the quadratic) and Two Vessels, One K (two problems in one). | ICE table, small-x approximation (with its limit) |
| `q6-lean` 8 → 8 | A settled vessel that is disturbed moves until Q is back on K; only temperature changes K; a catalyst changes how soon, not where. | Taking NH₃ Out moves ahead of Moving Q, which becomes the summary and is reasoned without the dial. | Le Chatelier's principle, catalyst |
| `q7-dissolve` 8 → 7 | A solid in water reaches equilibrium with its ions: Ksp. Ksp gives how much dissolves; a common ion lowers it; Q above Ksp gives a precipitate. | Two Salts, One Added Ion cut (a ratio of ratios). The common-ion stage is acted on one beaker. | saturated, solubility product constant Ksp, molar solubility, common-ion effect, precipitate (recap) |
| `q8-free` 8 → 7 | ΔG° says where a reaction settles: negative, K above 1; ΔG° = −RT ln K; reactions can be added. | Warming a Vessel cut (two dials, two decisions, and `q6` stage 5 already heats two vessels). Stage 7 (ATP, owner decision: stays) loses its second decision. | ΔG° (recap), entropy (recap), coupled reaction, ATP |
| `boss-tipper` 5 → 5 | Re-test of `q1`, `q2`, `q3`, `q6`, `q5`. No new idea. | Phase 5 no longer needs a quadratic. | none |

Words (extend `glossary/teeter.js`): "the two counts" → "the count of each change"; "ratio ratio board" → "Ratio board"; "the check" (`kcheck`) → "K reader"; "Larger" key → "Double"; "spreading" → entropy; "gauge" in `q7` → "Q marker"; "ticks" → seconds. Prompts are questions throughout (46 of 69 were operations).

### Plan rows

#### `q1-both` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Butane Alone | The reaction stops changing with some butane left. | Particles in the vessel turn from orange to blue; both lines on the graph flatten with orange above zero. | 1 ("Run the vessel until..., then set the dial"). | **S** plus labels. Briefing: "Butane and isobutane are the same atoms joined in two different shapes, and each can turn into the other." Prompt: "Does all the butane turn into isobutane?" Dial options: "Only butane", "Only isobutane", "Both". Reward: "The amounts stopped changing with some butane still there. The reaction did not use it all up." | |
| 2 | What Is Happening? (predict) | A guess at what the particles do once the graph is flat. | Lead clip of a reaction starting; four cards. | None of weight. | **S.** Prompt: "Once the graph is flat, what are the particles in the vessel doing?" | |
| 3 | Ringed Particles | The graph is flat because both changes go on at the same rate: dynamic equilibrium. | Eight ringed particles in the settled vessel keep changing colour both ways; the two change counts keep rising together. | 1 ("Say what the ringed particles show"). | **S.** Prompt: "What do the ringed particles show is happening in the settled vessel?" Reward: "Butane keeps turning into isobutane and isobutane keeps turning back, at the same rate, so the amounts hold steady. This is dynamic equilibrium." | |
| 4 | Isobutane Alone | A vessel settles at the same amounts whichever side it starts from. | Solid lines from the new start end on the dashed lines of the first vessel. | 1 (a 24-word two-part instruction). | **S.** Prompt: "Started from isobutane alone, does the vessel settle with more, less or the same butane as before?" Reward: "It settled at the same amounts as when it started from butane. Where a reaction settles does not depend on which side it started." | |
| 5 | Two Settled Vessels (was 6) | At equilibrium the rates are equal; the amounts need not be. | Two settled vessels with unequal amounts and matching change counts. | Reward 35 words. | **S.** Prompt: "Which statement do these two settled vessels show to be false?" Reward: "At equilibrium the two rates are equal, but the amounts are not: this vessel holds about twice as much isobutane as butane." | |
| 6 | Writing the Vessels (was 7) | A reversible reaction is written with ⇌. | One vessel where the reverse count stays at zero, one where it runs. | 2 (term in the reward). | **S.** Briefing: "A reaction that runs both ways is a reversible reaction, written with a double arrow, ⇌." Prompt: "Which vessel holds a reversible reaction?" (answered by laying the arrow cards). Reward: "In Vessel 2 the product turns back, so it is written with ⇌. In Vessel 1 nothing turns back: that reaction finishes, and is not at equilibrium." | |
| (cut) | A Picture of the Settled Vessel; Sealed Vessels | | | See the sequence table. | Archive under `archive/2026-11-11/teeter/`. | |

#### `q2-k` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Where Do They End? (predict) | A guess: do different starts end alike? | Lead clip; three start tags; four cards. | None of weight. | **S.** Prompt: "Three vessels start with different amounts: what do they have in common once settled?" | |
| 2 | The Ratio Board | Isobutane ÷ butane is the same in every settled vessel. | Three settled vessels with different amounts; the board prints the ratio for each as the tiles are arranged. | 1 ("Arrange cards on the ratio board into..."); "Ratio ratio board". | **S.** Prompt: "Which ratio of amounts comes out the same for all three settled vessels?" Reward: "Isobutane ÷ butane is 2.0 in every vessel, whatever it began with. Products over reactants at equilibrium is the equilibrium constant, K." | |
| 3 | Two of the Same | A coefficient in the equation becomes a power in K. | Tiles H₂, I₂, HI, HI²; only one arrangement prints the same number three times. | 1. | **S.** Prompt: "Which ratio is the same for all three settled vessels of H₂ + I₂ ⇌ 2 HI?" Reward: "HI² ÷ (H₂ × I₂) is 54 in every vessel: the 2 in front of HI became a power. With amounts in mol/L the constant is written Kc." | |
| 4 | A Vessel With Solids | A pure solid is left out of K. | The amounts of CaCO₃ and CaO differ between vessels; the CO₂ pressure does not. | Reward 49 words. | **S.** Prompt: "Which ratio is the same for all three settled vessels of CaCO₃ ⇌ CaO + CO₂?" Reward: "Only the pressure of CO₂ is the same in every vessel, so only the gas is in K. The amount of a pure solid does not change how concentrated it is. With pressures the constant is written Kp." | |
| 5 | Find K (typed) | K is worked out from settled amounts. | Bars of each substance and the equation. | 7 (first calculation); 6 (hint 1 "Type the figure in the field"). | **S**, worked case in the briefing (stage 3's reaction with one vessel's numbers, line by line). Prompt: "What is K for this vessel, to two significant figures?" Miss: which amount was left unsquared, or which side was on top, where that can be told. Reward: "The settled pressures, with the 2 as a power, give K = 6.7. Any vessel of this reaction at this temperature gives the same." | |
| 6 | Nearly All the Way | A K far above 1 means almost all product. | Three vessels settle; one has almost no reactant bar left; each prints its K. | "A" as a name. | **S.** Bars are "Reactant" and "Product". Prompt: "Which reaction goes nearly to completion?" Reward: "Vessel 2 settled with almost no reactant; its K is 2.0 × 10⁵. A K far above 1 means the vessel settles as nearly all product." | |
| 7 | Hardly Started | A K far below 1 means almost no product: predicted from K before settling. | Three vessels printing K, not yet settled. | 6 (hint 1 offers "Settle" to check before answering). | **S.** The tap is graded before "Settle" is used (see Open). Prompt: "Which reaction will have made the least product once it settles?" Reward: "Vessel 3, with K = 3.0 × 10⁻⁶, made almost no product. A K far below 1 means the vessel settles as nearly all reactant." | |
| (cut) | Three Sealed Vessels | | | Three more K calculations. | Archive. | |

#### `q3-q` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Already at Equilibrium | A mixture with Q equal to K does not change. | Each mixture laid in the vessel shows a marker against the K line; run, only one keeps its bars still. | 2 (Q defined in a 39-word reward; the marker was unexplained). | **S**, pattern 6. Briefing: "Q, the reaction quotient, is the same ratio as K, worked out for any mixture whether or not it has settled. The marker shows Q and the line shows K." Prompt: "Which mixture is already at equilibrium?" Reward: "The mixture with Q on K did not change when run. At equilibrium Q equals K." | |
| 2 | Far More Isobutane (predict) | A guess for a mixture with Q above K. | Lead clip; mixture card; K tag; four cards. | None of weight. | **S.** Prompt: "What does this mixture do when it is left alone?" | |
| 3 | Run It | With Q above K the reaction runs toward reactants until Q falls to K. | The marker slides down to the K line while the isobutane bar falls and the butane bar rises. | 1 ("Press Run and set the dial"). | **S.** Prompt: "Which way does a mixture run when its Q is above K?" Reward: "Q was 19 against a K of 2.0, and isobutane turned back into butane until Q reached K. Above K a reaction runs toward reactants; below K, toward products." | |
| 4 | Which Makes More Isobutane | Equal amounts are not equilibrium; Q against K decides. | Marker and K line for each mixture laid in the vessel; no Run key. | 3 and 6 (hint 3: lay each card, press Run and see whose bar rises). | **M** (the test vessel with `noRun` on this stage). Prompt: "Which mixture will make more isobutane when left alone?" Reward: "Mixture 1 held equal amounts, so its Q was 1.0, below the K of 2.0, and it makes more isobutane. Equal amounts are not equilibrium." | |
| 5 | Which Makes More NO₂ (was 7) | A coefficient puts a substance into Q as a power, so amounts alone do not give the direction. | Two mixtures with equal pressures of the two gases whose markers stand on opposite sides of K. Run is available. | Reward 46 words. | **S.** Prompt: "Which mixture will make more NO₂ when left alone?" Reward: "Mixtures 1 and 2 each held equal pressures of the two gases, yet they ran opposite ways. NO₂ enters Q squared, so the size of the pressures matters, not only their ratio." | |
| 6 | Three Sealed Mixtures (was 8) | Q is worked out from amounts and set against K. | Three mixture cards printing their amounts; a plate with the equation and K. No vessel. | 3 (the marker gave the answer by its side of the line). | **M** (remove the test vessel; add a `plaque` with K). Trays: "Makes more product", "Does not change", "Makes more reactant". Prompt: "Which way will each mixture run?" Choose amounts that give Q by one easy division. Reward: "Below K a mixture makes products, above K it makes reactants, and on K it does not change." | |
| (cut) | A New Reaction (predict); Run the New Mixture | | | A second predict-and-run pair. | Archive. | |

#### `q4-properties` (4 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | The Same Vessel, Written Backwards (was 1) | Writing a reaction the other way round turns K upside down: 1 ÷ K. | A settled vessel of N₂O₄ and NO₂ and the ratio board from `q2`: NO₂² over N₂O₄ prints K; the tiles arranged for 2 NO₂ ⇌ N₂O₄ print its inverse. | 3 and 4 (letters; "Read K" printed the value of a card to be matched; nothing physical). | **M** (`vsl` and the ratio board in place of `kcheck`; four K cards and a slot stay). Prompt: "What is K for 2 NO₂ ⇌ N₂O₄ in this same settled vessel?" Reward: "The vessel is the same; only the ratio is written the other way up, so the new K is 1 ÷ 0.15 = 6.7." | |
| 2 | Doubling a Reaction (predict; was 2) | A guess. | Lead clip; four cards. | Letters. | **S.** Prompt: "What happens to K when every coefficient in H₂ + I₂ ⇌ 2 HI is doubled?" | |
| 3 | Every Coefficient Doubled (was 3) | Doubling a reaction squares its K. | K reader: H₂ + I₂ ⇌ 2 HI reads 54; with "Double" held it reads 2916, which is 54 × 54. The asked card is a different reaction. | Letters; "Larger". | **S** plus cards (the observed case and the asked case are both real: observe HI, answer for 2 SO₂ + O₂ ⇌ 2 SO₃ doubled). Prompt: "K is 280 for 2 SO₂ + O₂ ⇌ 2 SO₃. What is it for 4 SO₂ + 2 O₂ ⇌ 4 SO₃?" Reward: "Doubling every coefficient doubles every power in the ratio, so K is squared: 280 × 280 = 78,400. The mixture itself is no different." | |
| 4 | Two Reactions in a Row (was 5) | When two reactions add to a third, their K values multiply. | K reader takes each step alone and both together; the product CO of the first is used by the second and cancels. | Letters. | **S** plus cards (the two water-gas steps; verify both constants). Prompt: "What is K for C(s) + 2 H₂O ⇌ CO₂ + 2 H₂?" The observed pair on the reader must be a different pair from the asked one; use the butane chain already in `eqdata.js` renamed, or a second real pair. Reward: "The CO made by the first step is used by the second, so it cancels from the reaction and from the ratio: K is K₁ × K₂." | |
| (cut) | Every Amount Halved; Reach the Reaction; K From Pressures; The Wanted K | | | Algebra on cards; Kc to Kp is a formula on a plate. | Archive. The `kstack` fixture is then unused by this bench (`q8` stage 7 uses `stack`). | |

#### `q5-ice` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Change in Each Column | Each substance changes by x times its coefficient, down for reactants and up for products. | "Settle": each bar moves away from its dashed start, HI twice as far as H₂. | 2 (ICE table defined in a 41-word reward); 6 (hint 3 the rule). | **S.** Briefing: "An ICE table has three rows for each substance: the Initial amount, the Change, and the amount at Equilibrium." Prompt: "How does each substance change while the vessel settles?" Hint 3: "Compare how far the HI bar moved with how far the H₂ bar moved, and look at the equation." Reward: "H₂ and I₂ each fell by x and HI rose by 2x, as the coefficients say." | |
| 2 | Solving for x (typed; was 2, A Perfect Square) | K turns the bottom row of the table into one equation for x. | ICE board filled as cards are laid; settled bars; plate with K. | 7 (first solve, cold); 6 (hint 3 the method for this case). | **S**, worked case in the briefing on other starts (for example 2.0 M each, K = 64: "(2x)² ÷ (2.0 − x)² = 64", "2x ÷ (2.0 − x) = 8", "x = 1.6, so HI = 3.2 M"). Prompt: "What is the concentration of HI when this vessel has settled, in mol/L?" Miss: the Q the typed amount would give, against K. | |
| 3 | How Much Changes? (predict) | A guess from the size of K. | Lead clip; four cards. | None of weight. | **S.** Prompt: "K for N₂O₄ ⇌ 2 NO₂ is 0.0059. How much of 1.0 M N₂O₄ turns into NO₂?" | |
| 4 | A Small K (typed) | When K is small, so little reacts that the starting amount can be used unchanged. | The N₂O₄ bar barely leaves its dashed start. | 2 (the approximation named in the reward and given in hint 3). | **S.** Briefing: "When K is very small, x is tiny beside the starting amount, so 1.0 − x can be treated as 1.0. This small-x approximation is fair when less than 5% reacts." Prompt: "What is the concentration of NO₂ when this vessel has settled, in mol/L?" Reward: "With 1.0 − x taken as 1.0, (2x)² = 0.0059, so NO₂ is 0.077 M. Only about 4% of the N₂O₄ reacted." | |
| 5 | Is the Shortcut Fair? | The approximation fails where much of the reactant reacts. | Three vessels: one bar stays at its start, two fall well below. | None of weight. | **S.** Prompt: "In which vessel is the small-x approximation fair?" Reward: "Only where the reactant bar stays within 5% of its start. Where more reacts, the full equation is needed." | |
| 6 | K From One Reading (typed) | One measured amount gives x, x gives every amount, and they give K. | Settled HI bar with its value; starts on the board. | 6 (hints 2 and 3 are the route). | **S.** Prompt: "What is K for this reaction, from the amount of HI in the settled vessel?" Hint 3: "The table ties every amount to the one that was measured." | |
| (cut) | A Small Start; Two Vessels, One K | | | A quadratic; two problems in one. | Archive. | |

#### `q6-lean` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Adding H₂ | Adding a reactant puts Q below K; the vessel makes product until Q is back on K. | H₂ tapped in: the Q needle drops below the K line; run, the N₂ line falls and Q climbs back. | 1 (two-part instruction). The tap must be graded on the prediction, before the run draws the answer (see Open). | **S.** Prompt: "After H₂ is added to the settled vessel, where does the amount of N₂ settle?" Reward: "The added H₂ put Q below K. The vessel made more NH₃, using up N₂ as well, until Q was back on K." | |
| 2 | Compressing the Vessel | Compression moves the vessel toward the side with fewer gas molecules. | Piston dragged down; spheres counted in the window before and after settling. | 1. | **S.** Prompt: "After the vessel is compressed and settles again, does it hold more, fewer or the same number of gas molecules?" Reward: "Halving the volume put Q below K, so the vessel made NH₃: four molecules become two, and the count fell." | |
| 3 | Argon in the Vessel (predict) | A guess: does a gas that does not react shift it? | Lead clip; three cards. | 1 ("Lay the card for what..."). | **S.** Prompt: "Argon, which does not react, is added at fixed volume: what happens to the amount of NH₃?" | |
| 4 | Argon Added | Argon raises the total pressure but not the pressure of any reacting gas, so Q stays on K. | Pressure reading rises; Q needle does not move. | 1. | **S.** Prompt: "After argon is added, where does the amount of NH₃ settle?" Reward: "Argon raised the total pressure but left the pressures of N₂, H₂ and NH₃ as they were. Q stayed on K and nothing shifted." | |
| 5 | Heating Two Vessels | Heating raises K for a reaction that takes in heat and lowers it for one that gives heat out. | Burner on each vessel: one K rises, the other falls, and the amounts follow. | 3 ("tap the vessel where heating makes K larger": K is printed). | **S**, pattern "change what is asked" (the answer is the same vessel; the choice is retitled). Briefing: "Heating a settled vessel moves it in the direction that takes heat in." Choice title: "Takes in heat making product". Prompt: "Which reaction takes in heat as it makes its product?" Reward: "Heating raised K for N₂O₄ ⇌ 2 NO₂, so that reaction takes in heat; it lowered K for the ammonia vessel, which gives heat out. Only temperature changes K." | |
| 6 | Iron Powder | A catalyst changes how soon a vessel settles, not where. | Two vessels end at the same amounts and K; one gets there sooner. | Reward 50 words; "ticks". | **S.** Prompt: "What does the iron powder change?" Reward: "Both vessels settled at the same amounts. Iron powder is a catalyst: it speeds the reaction both ways equally, so the vessel settles sooner, not somewhere else." | |
| 7 | Taking NH₃ Out (was 8) | Removing product makes the vessel form more, but less than was taken. | NH₃ trap; Q falls below K; the NH₃ line recovers partway to its dashed level. | 1 (a 20-word two-part instruction). | **S**, moved. Prompt: "After some NH₃ is taken out, where does the amount of NH₃ settle compared with before?" Reward: "Q fell below K and the vessel made NH₃ again, but not all that was taken. Removing product keeps a vessel making more." | |
| 8 | Which Way Will It Shift? (was 7, Moving Q) | Le Chatelier's principle sums up what the last seven stages showed. | The settled vessel with its Q needle on K; four change cards. No "Change" dial. | 3 (each card was set on the dial and the needle read off). | **M** (remove the `change` dial; four cards, none of them a change already run in this bench: "Add N₂", "Add NH₃", "Expand", "Add helium"). Trays: "Makes more NH₃", "No shift", "Makes less NH₃". Prompt: "Which way does the settled vessel shift after each change?" Reward: "Each change that moved Q off K was followed by a shift that brought it back. This is Le Chatelier's principle: a vessel disturbed from equilibrium shifts to reduce the disturbance." | |

#### `q7-dissolve` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Adding Solid | Water dissolves only so much of a solid: then it is saturated. | Each scoop raises both ion meters until one scoop leaves them still and the solid lies on the floor. | 1 (the prompt is the move); reward 44 words with "trade units". | **S.** Prompt: "How many scoops of CaF₂ can this water dissolve?" Reward: "After a few scoops the meters stopped rising and the extra solid stayed on the floor. Water holding as much dissolved solid as it can is saturated; solid and ions are then at equilibrium." | |
| 2 | Writing the Expression | The K of a dissolving solid is Ksp: ions raised to their coefficients, solid left out. | Equation on the beaker; a meter for each ion and none for the solid; three power dials. | 2 (Ksp named in the reward). | **S.** Briefing: "A solid at equilibrium with its dissolved ions has an equilibrium constant, called the solubility product constant, Ksp." Prompt: "What is the Ksp expression for Ag₂CrO₄?" Reward: "Ksp = [Ag⁺]²[CrO₄²⁻]: each ion to its coefficient, and the solid left out as in any K." | |
| 3 | How Much Dissolves (typed) | For a salt that gives one of each ion, Ksp = s × s. | BaSO₄ beaker with both ion meters and its Ksp: the worked case in front of the student. AgCl's Ksp on the plate. | 2 (molar solubility defined in the reward). | **S.** Briefing: "Molar solubility, s, is the moles of a salt that dissolve in one litre." Prompt: "What is the molar solubility of AgCl, in mol/L?" Reward: "Each AgCl gives one Ag⁺ and one Cl⁻, so Ksp = s × s and s = 1.3 × 10⁻⁵ mol/L." | |
| 4 | Which Dissolves More (predict) | A guess: does the smaller Ksp mean less dissolves? | Lead clip; plate of two Ksp values; three cards. | None of weight. | **S.** Prompt: "Which holds more dissolved in a litre of water, AgCl or Ag₂CrO₄?" | |
| 5 | Two Beakers | Ksp ranks solubility only for salts with the same ratio of ions. | Two read beakers with a "Dissolved salt" line each. | The answer is a printed line; kept as the test of the prediction. | **S.** Prompt: "Which salt has more dissolved in its beaker?" Reward: "Ag₂CrO₄ has the smaller Ksp yet more of it dissolves, because its Ksp holds [Ag⁺] squared. Ksp values compare directly only for salts with the same ratio of ions." | |
| 6 | A Common Ion | Adding one of a salt's ions drives some of the salt out of solution. | One saturated BaSO₄ beaker with an "Added sulfate" dial: turning it up, Q rises above Ksp, solid grows on the floor and the Ba²⁺ meter falls. | 3 (two beakers "already read"; the answer was which printed line was larger). | **M** (one `beaker` with the `added` dial of old stage 8; three cards and a slot: "More BaSO₄ dissolves", "Some BaSO₄ comes out as solid", "Nothing changes"). The check refuses until the dial has been moved. Prompt: "What happens to the dissolved BaSO₄ when sodium sulfate is added to its saturated solution?" Reward: "The extra sulfate put Q above Ksp, so BaSO₄ left the water as a precipitate until Q was back on Ksp. This is the common-ion effect." | |
| 7 | Mixing Two Solutions | A precipitate forms when mixing leaves Q above Ksp. | Three mixtures printing the two ion concentrations after mixing; a plate with Ksp. No Q marker. | 3 (each mixture printed Q against Ksp on a gauge). | **M** (hide the Q marker on this stage; add Ksp to a plate; choose concentrations that multiply easily). Prompt: "In which mixture does a precipitate form?" Reward: "Only Mix 2 has Q, the product of its ion concentrations, above Ksp, so only there does a solid form." | |
| (cut) | Two Salts, One Added Ion | | | A ratio of ratios, read off two lines. | Archive. | |

#### `q8-free` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A Positive ΔG° (predict) | A guess: does a positive ΔG° mean no product at all? | Lead clip; four cards. | 7 (ΔG° assumed from Ember Reach). | **S.** Briefing: "ΔG°, the standard free energy change, is negative for a reaction that runs toward its products when everything starts at standard amounts." Add ΔG and entropy to `NEEDS` with a primer. Prompt: "A reaction has ΔG° = +8 kJ/mol. Starting from reactant alone, what does the vessel hold once settled?" | |
| 2 | ΔG° and Where a Vessel Settles | The more negative ΔG°, the more product at equilibrium; a positive ΔG° still gives some. | Three vessels settle with different product bars; three ΔG° cards. | 6 (hint 3 the move); reward 42 words. | **S.** Prompt: "Which ΔG° belongs to which vessel?" Reward: "The more negative the ΔG°, the more product the vessel holds. A positive ΔG° gives less product than reactant, but never none." | |
| 3 | K From ΔG° (typed) | ΔG° = −RT ln K. | Two settled vessels printing ΔG° and their bars; plate with R and T. | 7 (ln and e are not taught anywhere in the track); 6 (hint 3 the steps). | **S**, worked case in the briefing, with the formula in the form the calculator takes. Briefing: "ΔG° and K are tied by K = e^(−ΔG° ÷ RT), with ΔG° in joules. The e^x key on the calculator works it out." Worked lines (−5.0 kJ/mol): "−ΔG° = 5000 J/mol", "RT = 8.314 × 298 = 2478", "5000 ÷ 2478 = 2.02", "K = e^2.02 = 7.5". Prompt: "What is K for a reaction with ΔG° = −10.0 kJ/mol at 298 K?" Reward: "K is 57. A ΔG° of zero would give K = 1, and each step more negative multiplies K." | |
| 4 | Salts in Water (was 5) | A salt dissolves well when ΔH − TΔS is negative. | For each salt two bars, ΔH and TΔS, drawn to one scale. | 4 ("amber bar", "green bar", "on its own"). | **S.** Bars labelled "ΔH" and "TΔS". Prompt: "Which salt has a negative ΔG of dissolving at 298 K?" Reward: "Salt 2, sodium chloride, takes in heat but its TΔS is larger, so ΔG is −9.0 kJ/mol and it dissolves. For the other two ΔG is large and positive, and very little dissolves." | |
| 5 | A Cold Pack (was 6) | A change can take in heat and still run, if the entropy term is larger. | Run: the salt dissolves, the thermometer falls, TΔS bar is longer than ΔH bar. | 4 ("spreading"). | **S.** Cards: "Dissolving only happens when it gives out heat", "TΔS is larger than the heat taken in", "The salt dissolved without taking in heat". Prompt: "Why does this salt dissolve although it cools the water?" Reward: "The salt took in 14.8 kJ/mol, so the water cooled, but TΔS was 22.4 kJ/mol, so ΔG was negative." | |
| 6 | Two Reactions Together (was 7; owner: stays) | Reactions that share a substance add, and so do their ΔG° values; a reaction with positive ΔG° can be driven by one with a larger negative ΔG°. | The stack adds the cards, cancels what is on both sides, and prints the net reaction and net ΔG° with a ladder step for each card. | 5 (two decisions: build the stack, then set a dial to its sum); ATP unexplained. | **M**, pattern "let the construction be the answer" (remove the selector; the stack prints its own total; `ladder` as in Ember `q5`). Briefing: "ATP is the molecule cells use to carry energy. Splitting it into ADP and phosphate has a ΔG° of −30.5 kJ/mol." Prompt: "Which reactions add up to glucose + ATP → glucose-6-phosphate + ADP?" Reward: "Adding phosphate to glucose has ΔG° of +13.8 kJ/mol; added to ATP splitting at −30.5, the pair nets −16.7 and runs. This is a coupled reaction." | |
| 7 | Three Reactions (was 8) | The lowest ΔH − TΔS gives the largest K. | Three pairs of bars. | 6 (hint 3 the answer). | **S.** Prompt: "Which reaction settles with the most product at 298 K?" Hint 3: "ΔG° decides where a vessel settles, and it is made of both bars." Reward: "The reaction with the most negative ΔH − TΔS has the largest K, even though it takes in heat. ΔG° says where a reaction settles, not how fast." | |
| (cut) | Warming a Vessel | | | Two decisions; repeats `q6` stage 5. | Archive. | |

#### `boss-tipper` (5 phases)

| # | Phase | Re-tests | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | The Vessels | `q1` stages 3 and 6. | Letters; hint 3 the rule. | **S.** Prompt: "Which vessel has reached equilibrium?" | |
| 2 | The Burner (typed) | `q2` stage 5. | Hint 1. | **S.** Prompt: "What is K for this vessel, to two significant figures?" | |
| 3 | The Draw | `q3` stage 4. | Letters; hint 3 the move. | **M** (`noRun`, as `q3` stage 4). Prompt: "Which mixture will make more butane when left alone?" | |
| 4 | The Compression | `q6` stage 2. | "Squeeze"; two-part instruction. | **S.** Prompt: "After the vessel is compressed, where does the amount of NO₂ settle?" | |
| 5 | The Feed (typed) | `q5` stage 2. | 9 (needed a quadratic, which the bench no longer teaches; hint 3 said so). | **M** (equal starts so both sides are perfect squares, with numbers different from `q5` stage 2 and its worked case). Prompt: "What is the concentration of HI when this vessel has settled, in mol/L?" | |

### Open for the builder

- Butane ⇌ isobutane: decide between K = 2.0 at about 320 K and K = 2.5 at 298 K, and check the value. The model's source line in `eqdata.js` says "model reaction"; replace it with the reference.
- `q6` stages 1, 4 and 7 and boss phase 4: `answer: { target, watch }` on the vessel. Confirm the tap is accepted only before the post-stress run has drawn the line, or that the line is hidden until the tap. If neither holds, the graph gives the answer and the stage needs the fix.
- `q2` stage 7: whether a `choice` tap can be required before "Settle" is pressed.
- `q4` stage 1: the ratio board (`rig` in `pans`) with tiles for NO₂², NO₂ and N₂O₄, both ways up.
- `q4` stage 4: a second real pair for the K reader's observed case.
- `q7` stages 6 and 7: `beaker` options to carry the `added` dial alone and to hide the Q marker.
- `q8` stage 3: confirm the calculator has e^x; if not, the stage goes.
- `tools/lib/teeter-*-checks.mjs` match wording ("pan" in a refusal) and stage indices; the ratchet file `tools/teaching-ratchet-teeter.json` holds counts that will fall.
- Bank `unit08.json`: problems that use the letter reactions, the quadratic, or Kc to Kp.

### Hand-back (plan)

- 56 stages: reworded (S) 47, redesigned M 9, L 0. Cut: 13. All reactions real.
- Most likely to go wrong in the build: `q4-properties` (four stages rebuilt on new reactions and constants, one on a different fixture); the butane rename across `q1`, `q2`, `q3` and the boss (labels, clips, `eqdata.js`, checks that match "A" and "B"); `q6-lean` (whether the tap is a prediction or a reading depends on engine behaviour nobody has confirmed).

### Structural changes

### Chemistry corrections

### Still weak

(Ordered by how likely a student is to get lost. For each: the stage, what is weak, why it was not fixed.)

### For the owner to look at

(Stages whose table was rebuilt or added. Nobody has seen these on a screen.)

### For close-out

(Stage and quest counts that changed; shared code changed; doctrine or engine lessons.)
