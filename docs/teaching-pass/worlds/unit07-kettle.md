# Kettle (`unit07`): reactions and stoichiometry

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. The notes below were written on 2026-11-11 from the stage text and the earlier records, without playing the world. Treat every item as a lead to confirm against the source, and expect to find more.

- **Session:** World pass (Sonnet). The largest world (75 stages): expect two sessions. Run after Tallow. A plan session first is strongly advised.
- **Earlier teaching pass:** none
- **Quests:** `src/learn/quests/unit07/`. Chart `src/learn/worlds/unit07-stoichiometry.js`. Bank `src/learn/bank/unit07.json`. No glossary: create `src/learn/glossary/kettle.js`. Checks: `verify:kettle` (`tools/lib/kettle-*-checks.mjs`, one file per bench).
- **Kits:** `pot*.js`, `heap.js`, `mass.js` (shared with Tallow), `atoms.js` (shared with Tallow and Ligar) in `src/learn/table/kits/`; `src/learn/engine/reactdata*.js`.
- **Report on 2026-11-11** (`node tools/teaching-report.mjs unit07 --totals`): 75 stages in 10 modules | briefing 2 | typed 16 (no instrument 0) | cards only 3 | reward long 14 | operation prompt 27 | hint 3 move/arithmetic 4 | vague 33 | register 2 | motive 2

## What is known to be wrong

- **Stand-in words** (33 of 75 stages): *pot* (reaction vessel), *heap*, *recipe* (formula or ratio), *chips*, *needle*, "Tray the sample", "the number manganese carries" (oxidation number).
- **Order.** `q1-recipe` stage 4 teaches limiting reactant before balanced equations (`q4`) and mole ratios (`q6`). Move it to `q6-stoich`.
- **Repeats.** `q1-recipe` re-teaches compound against mixture, percent composition and empirical formula, which Tallow `q1` and `q6` own. With the limiting-reactant stage moved, little of `q1` is left: merge what remains (definite proportions, conservation of mass) into `q3-change`, or keep a short `q1` on definite proportions only.
- **Worksheets.** `q6-stoich` is seven typed stages in eight; `q7-titrate` five in eight. 27 prompts open with an operation.
- **The boss is broken.** `boss-golem` has three phases titled Phase 1, Phase 4 and Phase 5; phases 2 and 3 are described in its header and missing from `STAGES`. Rebuild it as five phases that re-test the benches.
- **`q9-hsab` stays (owner decision) and must be fixed.** It teaches "hard prefers hard, and soft prefers soft" as a slogan across eight stages. Show the reason (a small, highly charged ion holds its electrons tightly; a large one's cloud is easily pulled out of shape) so the pairing can be predicted. No motives, plain words, and no more stages than the idea needs.

## Bench notes

- `q1-recipe` (8): see Order and Repeats above.
- `q2-names` (8): naming. A naming bench is mostly convention; keep it short and make the charge balance visible (ions that cancel), since that is the one idea in it.
- `q3-change` (8): physical against chemical change, conservation of mass. Particles before and after should show the same atoms rearranged.
- `q4-balance` (8): balancing. The student should balance by counting atoms they can see on each side.
- `q5-ionic` (8): precipitation and net ionic equations. Spectator ions should be seen staying dissolved.
- `q6-stoich` (8): grams react in the ratio of moles (the world's core idea). Calculation pattern: mole ratio seen with countable particles, one worked case, then typed cases. Limiting reactant arrives here.
- `q7-titrate` (8): titration. The equivalence point should be seen in the flask (no acid left), then computed.
- `q8-kinds` (8): kinds of reaction, oxidation number. Stage 5 names oxidation number properly.
- `q9-hsab` (8): see above.
- `boss-golem`: rebuild.

## Owner requests to check against the source

`docs/kettle-audit.md` ends with "Only the owner can judge"; read that section only.

## Traps

`tools/lib/kettle-*-checks.mjs` assert stage indices and some wording. Kettle registers Tour piece keys `jar` and `sample` in the global table. Moving the limiting-reactant stage changes two benches' counts, checks and bank entries at once: do it as one step.

## Record

Filled by the plan session (if any) and the pass session. Keep it current after every bench.

### Bench-level sequence

Planned 2026-11-11 by a plan session (no code changed). 75 stages in 10 modules become 64 in 9. Stage numbers are the new ones; "was n" gives the old index. Size: S strings and question only, M existing instrument with a new graded act or view, L new instrument.

| Bench | Idea | Structure | Terms it introduces (gloss) |
| --- | --- | --- | --- |
| `q1-recipe` 8 → 0 | (removed) | Tallow owns compound against mixture (`q1`), percent composition and empirical formula (`q6`); the shaker is the tool the owner called unintuitive. Stage 4 (limiting reactant with countable atoms) moves to `q6-stoich` stage 5. Stage 3 (joining keeps the mass) is covered by `q3` stage 6. The rest is archived and the quest leaves the chart. | none |
| `q2-names` 8 → 8 | A formula is the smallest group of ions with no charge; names follow from the ions. | No stage moved. The charge balance is the one idea; every naming rule is shown on an example plate before it is used. | ionic compound, charge meter, polyatomic ion (a group of atoms that stays together and carries one charge), Roman numeral in a name |
| `q3-change` 8 → 7 | A chemical change makes a new substance, a physical change does not; signs of a reaction are evidence only; mass is conserved when nothing enters or leaves. | Stage 8 (Three Samples) cut: stages 1 and 2 again. Stage 4 asks for the cause of the gain, not the balance reading. | physical change, chemical change, conservation of mass |
| `q4-balance` 8 → 8 | An equation must show the same atoms on both sides; coefficients count molecules, subscripts say what the substance is. | No stage moved. | chemical equation, reactant, product, coefficient, subscript, state symbol |
| `q5-ionic` 8 → 8 | Dissolved ionic compounds are separate ions; some pairs of ions leave the water as a solid; the rest are spectators. | No stage moved. | solution, precipitate, spectator ion, net ionic equation, solubility rules, complete ionic equation |
| `q6-stoich` 8 → 8 | Substances react in the ratio of their moles; grams go through moles; the reactant that runs out sets the amount made. | Order: predict, grams in step, mole ratio, grams to grams with a worked case, limiting reactant seen with countable atoms (from `q1` stage 4), limiting in grams, gas volume, percent yield. Weigh the Cloud (a four-step back-calculation with a 46-word reward) cut. Gas From Limestone uses a molar volume on the plate, not PV = nRT, which this world has not taught. | mole (recap), mole ratio, limiting reactant, excess, theoretical yield, percent yield |
| `q7-titrate` 8 → 6 | A titration counts the acid in a flask by the base that exactly reacts with it. | Purple Base cut (a redox titration one bench before redox is taught). The Pickling Bath cut (Sulfuric Acid again; the boss re-tests). An Early Dye answers in one choice, not a typed difference. | concentration in mol/L (recap), titration, burette, indicator, equivalence point, endpoint |
| `q8-kinds` 8 → 8 | Reactions are classed by what changes: pieces join or split, a fuel burns, a proton moves, electrons move. | Three Gas Jars moves from 6 to 2, before the stage that needs the gas tests. The Furnace Log is cut from eight cards to five. | synthesis, decomposition, combustion, acid, base, oxidation, reduction, redox reaction, oxidation number |
| `q9-hsab` 8 → 6 | An ion whose electron cloud keeps its shape is hard, one whose cloud is easily pulled out of shape is soft; hard pairs with hard and soft with soft, and that predicts which solid forms. | Owner decision: stays. Cut: Partner Exchange and Sealed Foundry Reagents (plate and chips, no instrument). The prediction case changes: silver hydroxide is not soluble, so "silver does not precipitate with hydroxide" was wrong. | electron cloud, hard ion, soft ion |
| `boss-golem` 3 → 5 | Re-test of `q2`, `q4`, `q5`, `q6`. No new idea. | Rebuilt as five phases; the three that exist are kept and renumbered. | none |

World-wide renames (create `src/learn/glossary/kettle.js` with these in `BANNED`): *pot* → vessel (fixture label "Reaction vessel"; "furnace" stays where the stage is a furnace); *window* → particle view; *heap* → supply; *recipe* → formula, equation or ratio as the case is; *chips*, *pucks*, *discs* → ions, molecules, cards or "circles" where the picture is meant; *needle* → charge meter; *cell* (the naming tray) → tray; *cloud* → precipitate once `q5` stage 1 has named it; *lamps* → signs; "Tray the sample" → a question; *weighs*, *weight* → has a mass of, mass; *particles* in titration → moles.

### Plan rows

#### `q1-recipe` (removed)

| # | Stage | Change |
| --- | --- | --- |
| 1, 7 | Three Sources, One Molecule; Name Three Samples | Cut: fixed composition is Tallow `q1` stages 5 and 6. |
| 2, 8 | The Wrong Proportions; Three Claims | Cut: compound against mixture is Tallow `q1`; the shaker goes with them. |
| 3 | Weigh Before and After | Cut: conservation of mass is `q3` stage 6. |
| 4 | One Heap Runs Out | Moved to `q6-stoich` stage 5 (new id; never reuse the old one). |
| 5, 6 | Which Share Is Which; Backwards From the Weight | Cut: Tallow `q6` stages 6 and 7. |

Archive the quest file under `archive/2026-11-11/kettle/` with a README. Remove it from the chart, `BUILDS_ON` of later benches and the boss, the bank, and `tools/lib/kettle-*-checks.mjs`.

#### `q2-names` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | What Magnesium and Chlorine Make (predict) | A guess at a formula from two charges. | Plate with the two ions; five formula cards. | 7 (nothing says a compound has no charge); 6 (hint 1 a tool list). | **S.** Briefing: "An ionic compound is made of positive and negative ions held together. Taken as a whole it has no charge." Prompt: "Which formula do you expect for the compound of Mg²⁺ and Cl⁻?" Reward: "Next, build the compound from its ions and read the charge meter." | |
| 2 | Build the Group | The formula counts the ions in the smallest group with no charge. | Charge meter moves +2 for each Mg²⁺ and −1 for each Cl⁻ laid in the tray. | 4 ("chips", "cell", "needle"). | **S.** Prompt: "What is the smallest group of Mg²⁺ and Cl⁻ ions that has no charge?" Reward: "One Mg²⁺ and two Cl⁻ add up to zero, so the formula is MgCl₂." | |
| 3 | Name the Compound | Metal ion's name first, then the nonmetal ion's name ending in -ide. | Example plate (a named compound with its ions); name cards on the label. | 1 ("Write the name ... on the label"); reward 38 words. | **S.** Prompt: "What is the compound of Mg²⁺ and O²⁻ called?" Reward: "The metal keeps its name and the other ion ends in -ide: magnesium oxide." | |
| 4 | Name the Iron Oxides | A Roman numeral in a name is the charge of one metal ion. | Each tray's meter shows the oxide ions' total; the irons print no charge and must cancel it. | 2 (the rule arrives in a 45-word reward). | **S.** Briefing: "Some metals form ions with more than one charge. The name then gives the charge of one metal ion as a Roman numeral in brackets." Prompt: "What is the iron oxide in each tray called?" Reward: "One iron cancels −2 in FeO and two irons cancel −6 in Fe₂O₃, so they are iron(II) oxide and iron(III) oxide." | |
| 5 | Write the Formula | A polyatomic ion stays whole and goes in brackets when there is more than one. | "Dissolve" on each sample: the particle view shows NO₃ staying together as one piece while Ca separates. | 2 (polyatomic ion defined in the reward). | **S.** Briefing: "A polyatomic ion is a group of atoms that stays together and carries one charge. Dissolve Sample A to see one." Prompt: "What is the formula of the compound in Sample B?" Reward: "Each nitrate ion stays whole as NO₃⁻, and one Ca²⁺ needs two of them: Ca(NO₃)₂." | |
| 6 | Name the Molecule | A compound of two nonmetals is named by counting atoms with prefixes. | "Look" on each sample draws the molecule; plate of count words. | 4 (nothing says why there is no charge to balance). | **S.** Briefing: "Two nonmetals form molecules, not ions, so there are no charges to cancel. The name counts the atoms of each element with a prefix." Prompt: "What is the compound in Sample B called?" Reward: "Two nitrogens and four oxygens: dinitrogen tetroxide." | |
| 7 | Name the Acids | An acid is named from the negative ion that comes with H⁺. | Examples plate; the ions of each acid in its tray. | Convention only; kept short. | **S.** Prompt: "What is the acid made of the ions in each tray called?" Reward: "H⁺ with Cl⁻ is hydrochloric acid, and H⁺ with nitrate, NO₃⁻, is nitric acid." | |
| 8 | The Unmarked Drum | Charge balance gives the metal's charge, and so the name. | "Dissolve": the view draws 2 Fe and 3 SO₄²⁻. | 6 (hint 3 the route). | **S.** Prompt: "What is the compound in the unmarked drum called?" Hint 3: "The ions together have no charge, and only the sulfate's charge is printed." Reward: "Three SO₄²⁻ carry −6, so each of the two irons is 3+: iron(III) sulfate, Fe₂(SO₄)₃." | |

#### `q3-change` (7 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Same or New | A chemical change makes a new substance; a physical change leaves the same one. | "Run" on each jar: the particle view draws the particles before and after. | 2 (both terms defined in a 39-word reward). | **S**, pattern 6. Briefing: "In a physical change the substance is the same afterwards. In a chemical change a new substance has formed." Trays: "Physical change", "Chemical change". Prompt: "Which of these changes are physical and which are chemical?" Reward: "Melted ice is still H₂O, so melting is physical. Heated sugar and burned steel wool left new particles, so those changes are chemical." | |
| 2 | A Sign Is Not Proof | A gas, a colour, a solid or a temperature change is evidence of a reaction, not proof. | Four signs light as the vessel runs; the particle view shows whether the particles changed. | 4 ("lamp"); reward 42 words. | **S.** Fixture title "Signs of a reaction". Prompt: "Which change gives a sign of a reaction without making a new substance?" Reward: "Dry ice gives off a gas and is still carbon dioxide. A sign suggests a reaction; only a new substance shows one." | |
| 3 | Steel Wool in an Open Vessel (predict) | A guess: does burning change the mass? | Plate describing the open vessel; three cards. | 6. | **S.** Prompt: "After steel wool burns in an open vessel, is the mass greater, the same or less?" | |
| 4 | Burn It Open | Burning iron gains mass because oxygen from the air bonds to it. | The balance rises 24.0 g; the particle view shows O₂ coming in from above and joining the iron. | 3 (the answer was the balance reading: "Lay the chip for what the balance shows"). | **M**, pattern "change what is asked". The three chips become causes: "Oxygen from the air joined the iron", "Heat added mass", "Nothing was added". Prompt: "Where did the extra mass come from when the steel wool burned?" Check and `SOLUTIONS` change. Reward: "The iron bonded to oxygen from the air, 4 Fe + 3 O₂ → 2 Fe₂O₃, so the vessel gained the mass of that oxygen: 24.0 g." | |
| 5 | Heavier or Lighter | A burn that takes a gas in gains mass; one that gives a gas off loses it. | Balance before and after each burn; rows of the view that arrive or leave. | The balance prints the answer; the trays must carry the cause so the view is needed. | **S.** Trays: "Gains mass: a gas came in", "Loses mass: a gas went out". Prompt: "Which burns make an open vessel gain mass and which make it lose mass?" Reward: "Iron and magnesium take in oxygen and gain mass. Wood gives off carbon dioxide and water vapour and loses mass." | |
| 6 | A Sealed Vessel (typed) | With nothing entering or leaving, the mass after equals the mass before. | Lid dial sealed; balance reads the same before and after at each amount on the dial; the asked amount is not on the dial. | 1 ("Type what a sealed pot weighs..."). | **S.** Prompt: "What is the mass of the contents of a sealed vessel after 83.7 g of steel wool burns with the 36.0 g of oxygen inside?" Reward: "83.7 g of iron and 36.0 g of oxygen make 119.7 g of iron oxide. Mass is conserved when nothing enters or leaves." | |
| 7 | The Same Particles | Dissolving salt leaves the same ions: a physical change. | View before and after: the same Na⁺ and Cl⁻, in a crystal and then spread in water. | Reward 42 words. | **S.** Prompt: "After which change does the vessel hold the same particles it began with?" Reward: "The Na⁺ and Cl⁻ ions are the same before and after, so dissolving salt is classed as a physical change, though the ions do separate." | |
| (8) | Three Samples | (cut) | | Repeats stages 1 and 2. | Archive. | |

#### `q4-balance` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Count the Atoms | An equation as written can lose atoms, which a real change cannot. | Particle view: molecules before and after; two count dials. | 2 (equation, reactant, product defined in a 39-word reward); a count copied to a dial, kept because it is the first reading of the view. | **S.** Briefing: "A chemical equation writes a change: the reactants before the arrow, the products after it. The particle view draws the molecules the equation names." Prompt: "How many oxygen atoms does this equation show before the change, and how many after?" Reward: "Two oxygen atoms before and one after. Atoms are not destroyed in a reaction, so the equation is not yet right." | |
| 2 | A Way to Agree (predict) | A guess at how to fix it. | Equation plate; three cards. | 4 (cards vague). | **S.** Cards: "Change the small 2 in H₂O", "Put a number in front of a formula", "Add an O atom on the right". Prompt: "How would you make the oxygen atoms agree on both sides of H₂ + O₂ → H₂O?" | |
| 3 | Make Them Agree | A coefficient changes how many molecules; a subscript changes which substance. | Turning a subscript dial redraws a different molecule in the view; turning a coefficient dial draws more of the same; the ledger counts both sides. | 2 (both terms in the reward). | **S.** Briefing: "The number in front of a formula is a coefficient. The small number inside a formula is a subscript." Prompt: "Which numbers can change to balance the equation without changing the substances?" (answered by balancing it). Reward: "Coefficients count molecules, so changing them keeps the substances. Changing a subscript made a different substance." | |
| 4 | The Furnace Equation | An equation counts only what reacted. | View before and after with carbon monoxide left over. | 4 ("recipe"). | **S.** Prompt: "Which balanced equation describes the change in the particle view?" Reward: "Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂. The carbon monoxide still there afterwards did not react, so it is not in the equation." | |
| 5 | Which State | State symbols say how the particles of each substance are arranged. | Each substance drawn in rows, jumbled, far apart, or among water. | Hint 3 "Match each way of sitting". | **S.** Prompt: "What state is each substance in?" Reward: "(s) is solid, (l) liquid, (g) gas and (aq) dissolved in water." | |
| 6 | Propane | Balancing atom by atom, leaving the element that appears in two products for last. | Ledger rows move as each dial turns. | 6 (hint 3 is the method, acceptable as "how to reason"). | **S.** Prompt: "What coefficients balance propane burning in oxygen?" Reward: "C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O. Oxygen is in both products, so it is set last." | |
| 7 | Groups That Stay Whole | A polyatomic ion that stays whole is counted as one piece. | Rings round PO₄ and OH in the view; ledger of pieces. | Reward 43 words. | **S.** Prompt: "What coefficients balance this equation, counting each ringed group as one piece?" Reward: "PO₄ stays whole, so it is balanced as a single piece: 3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O." | |
| 8 | Sealed Bags | A balanced equation fixes the formula of an unknown product. | Atoms in on the left; two sealed bags on the right. | None of weight. | **S.** Prompt: "What is the formula of the substance in each sealed bag?" Reward: "Four phosphorus and ten oxygen atoms went in and two bags came out, so each holds P₂O₅." | |

#### `q5-ionic` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Two Clear Solutions | Mixing two solutions can form a solid: a precipitate. | The mix clouds, a yellow solid settles, the filter catches it. | 1 ("Pour ... and collect"). | **S.** Briefing: "When an ionic compound dissolves, its ions separate and spread through the water. Each jar holds one dissolved compound." Prompt: "Does anything new form when these two clear solutions are mixed?" Reward: "A yellow solid formed and the filter caught it. A solid that forms when solutions are mixed is a precipitate." | |
| 2 | What Is Left in the Water (predict) | A guess at which ions stayed dissolved. | Five statement cards. | 1 (a 27-word prompt). | **S.** Prompt: "Which ions are still dissolved after the precipitate settles?" | |
| 3 | Still Dissolved | Ions that stay dissolved and unchanged are spectator ions. | BEFORE and AFTER views: K⁺ and NO₃⁻ loose in both, Pb²⁺ and I⁻ packed at the bottom; the conductivity bulb stays lit. | 4 ("pucks", "discs", "bulbs" never explained). | **S.** One Tour line: the bulb lights when ions are free to move in the water. Prompt: "Which ions are still dissolved after the mixing?" Reward: "K⁺ and NO₃⁻ were dissolved before and after, unchanged. Ions that take no part are spectator ions." | |
| 4 | Only What Reacted | A net ionic equation shows only the ions that changed. | Ions counted leaving the water in AFTER. | 2 (term in the reward). | **S**, pattern 6. Briefing: "A net ionic equation shows only the ions that changed, and writes the solid they made as one formula." Prompt: "What is the net ionic equation for this mixing?" Reward: "Pb²⁺(aq) + 2 I⁻(aq) → PbI₂(s). The spectator ions are left out." | |
| 5 | Ions That Always Stay (predict) | A guess from the cases seen. | Eight ions. | 1 (prompt begins "Choose"). | **S.** Prompt: "Which of these ions do you expect to stay dissolved whatever they are mixed with?" | |
| 6 | Four Mixtures | Some ions stay dissolved with every partner: the start of the solubility rules. | Mixture dial: four BEFORE and AFTER views. | None of weight. | **S.** Prompt: "Which ions stayed dissolved in every mixture?" Reward: "Na⁺, K⁺, NH₄⁺ and NO₃⁻ stayed dissolved every time. Solubility rules list which pairs of ions form a solid." | |
| 7 | Clear and Still Reacting | Ions can react without a solid: H⁺ and OH⁻ make water. | H⁺ and OH⁻ gone from AFTER, water molecules drawn, bulb dimmer. | None of weight. | **S.** Prompt: "What is the net ionic equation when these two clear solutions are mixed?" Reward: "H⁺(aq) + OH⁻(aq) → H₂O(l). Na⁺ and Cl⁻ are spectators, so the bulb dims but stays lit." | |
| 8 | Sealed Jars | A complete ionic equation shows every dissolved ion on both sides. | BEFORE and AFTER for two sealed jars. | 2 (term in a 44-word reward); 1 (26-word prompt). | **S.** Briefing: "A complete ionic equation shows every dissolved ion before and after, and writes a solid as one formula." Prompt: "What is the complete ionic equation for the sealed jars?" Reward: "Ag⁺ + NO₃⁻ + K⁺ + Br⁻ → AgBr(s) + K⁺ + NO₃⁻. Cross out what is on both sides and the net ionic equation is left." | |

#### `q6-stoich` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Water From Hydrogen (predict) | A guess at grams made from grams fed. | Equation plate; five mass cards. | 6. | **S.** Prompt: "How many grams of water do you expect from 4.0 g of hydrogen, with plenty of oxygen?" | |
| 2 | Weigh the Water (typed) | The mass made grows in step with the mass fed. | Hydrogen dial; the balance reads the water at each setting; 5.0 g is past the dial. | 1 ("Type the grams..."). | **S.** Prompt: "How many grams of water does 5.0 g of hydrogen make?" Reward: "Every gram of hydrogen made 9 g of water. The amounts are in a fixed ratio, set by the equation." | |
| 3 | Ammonia by the Mole (typed) | The coefficients give the ratio of moles: the mole ratio. | Circles of hydrogen before and of ammonia after, 3 to 2 at every dial setting. | 7 (mole not recapped); 1. | **S.** Briefing: "A mole is a fixed, very large number of particles. Each circle in the particle view stands for one mole." Prompt: "How many moles of ammonia does 12 mol of hydrogen make?" Reward: "Every 3 mol of hydrogen made 2 mol of ammonia: the coefficients in the equation. That is the mole ratio." | |
| 4 | Grams to Grams (typed) | Grams become moles, moles follow the ratio, moles become grams. | Chlorine jar weighed in; salt weighed out; plate of molar masses. | 7 (first three-step calculation, cold); 6 (hint 3 is the route). | **S**, worked case in the briefing (stage 1's case). Briefing: "A balance reads grams, but the equation counts moles, so grams are changed to moles first." Worked lines: "4.0 g H₂ ÷ 2.0 g/mol = 2.0 mol H₂", "2 H₂ makes 2 H₂O: 2.0 mol H₂O", "2.0 mol × 18.0 g/mol = 36 g". Prompt: "How many grams of salt does 21.3 g of chlorine make?" Hint 3 points back to the worked case. Reward: "21.3 g of chlorine is 0.30 mol, which makes 0.60 mol of salt: 35.1 g." | |
| 5 | One Reactant Runs Out (moved from `q1` stage 4) | The reactant that runs out first sets how much is made. | The maker copies a water molecule from two supplies of atoms; both shrink; one empties and the maker stops. | 5 (two decisions: mark the supply and set the tally); 4 ("heap", "recipe"). | **M.** Remove the "Runs out first" tag; the one answer is the tally. Prompt: "How many water molecules can these hydrogen and oxygen atoms make?" Reward: "The hydrogen ran out first and stopped the count. The reactant that runs out is the limiting reactant; what is left of the other is the excess." | |
| 6 | What Is Left Over (typed) | In grams, the limiting reactant is found by comparing moles. | Both jars fed; balance reads the water. | 6 (hint 3 the route); 1. | **S.** Prompt: "How many grams of hydrogen are left over when the vessel has made all the water it can?" Hint 3: "Grams cannot be compared across substances; the equation's ratio is in moles." Reward: "The oxygen was the limiting reactant. 4.0 mol of the 6.0 mol of hydrogen reacted, leaving 2.0 mol: 4.0 g." | |
| 7 | Gas From Limestone (typed) | Moles of a gas become litres through the volume of one mole. | Syringe fills as limestone is heated; litres read at dial amounts. | 7 (the plate gave R and expected PV = nRT, taught only in Bellows). | **S** plus plate. Plate adds: "At 25 °C and 1.00 atm, 1 mol of any gas fills 24.5 L"; remove R. Prompt: "How many litres of carbon dioxide does 50.0 g of limestone give at 25 °C and 1.00 atm?" Reward: "50.0 g of limestone is 0.50 mol and gives 0.50 mol of carbon dioxide, which fills 12.2 L." | |
| 8 | What the Furnace Keeps (typed) | Percent yield = mass made ÷ the most the equation allows × 100. | Balance reads the iron actually made. | 2 (theoretical yield and percent yield first in rewards). | **S.** Briefing: "The most product an equation allows is the theoretical yield. Percent yield is the mass actually made divided by it, times 100." Worked line: "3.0 g made of 4.0 g allowed = 75%". Prompt: "What is the percent yield of iron from this furnace?" Reward: "The equation allows 55.8 g and the furnace made 34.6 g: a 62% yield." | |
| (cut) | Weigh the Cloud | | | Four steps backwards, nothing responds, 46-word reward. | Archive. | |

#### `q7-titrate` (6 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | How Much Base (predict) | A guess: a more concentrated base is needed in a smaller volume. | Plate with both concentrations; four volume cards. | 7 (mol/L not recapped); 6 (hint 3 is the route to the answer of a prediction). | **S.** Briefing: "Concentration is how much is dissolved in each litre: a 0.100 mol/L solution holds 0.100 mol in every litre." Prompt: "How much of the base do you expect it takes to use up all the acid?" Hint 3: "Decide whether a more concentrated base is needed in a larger or a smaller volume." | |
| 2 | Watch the Colour | A titration adds measured base until the acid is used up; an indicator shows when. | Burette reading climbs with each press; the flask turns pink at one reading. | 1 (prompt is the operation); 2 (titration, burette, indicator in a 44-word reward). | **S.** Briefing: "A titration adds one solution from a burette, a tube marked in millilitres, to another until they have exactly reacted. An indicator is a dye that changes colour when that happens." Prompt: "What volume of base changes the indicator's colour?" Reward: "The indicator changed at about 10.5 mL: that much base used up the acid in 25.0 mL." | |
| 3 | Nothing Left Over | At the equivalence point the moles of base added equal the moles of acid. | Particle view: H⁺ circles fall and none is left at one reading; past it OH⁻ circles appear. | 1; 6 (hint 3 the move). | **S.** Prompt: "At what burette reading has the base exactly used up the acid?" Hint 3: "Each press removes the same number of H⁺; see how many are left." Reward: "At 20.0 mL no H⁺ and no OH⁻ are left over. That is the equivalence point: moles of base added equal moles of acid." | |
| 4 | The Acid in the Flask (typed) | Moles of base at the equivalence point give the acid's concentration. | Burette reading at the colour change; 25.0 mL of acid. | 7 (first calculation, cold); "strength", "particles"; reward 51 words. | **S**, worked case in the briefing (stage 3's titration). Worked lines: "0.0200 L × 0.250 mol/L = 0.00500 mol base", "0.00500 mol acid in 0.0250 L", "0.00500 ÷ 0.0250 = 0.200 mol/L". Prompt: "What is the concentration of the acid in the flask, in mol/L?" Reward: "22.5 mL of 0.200 mol/L base is 0.00450 mol, so the acid is 0.00450 mol in 0.0250 L: 0.180 mol/L." | |
| 5 | Sulfuric Acid (typed) | An acid that gives two H⁺ needs twice the base. | Plate: H₂SO₄ gives two H⁺; the view shows two H⁺ for each acid. | "strength", "particles", "share them out". | **S.** Prompt: "What is the concentration of the sulfuric acid in the flask, in mol/L?" Hint 3: "The base counts H⁺, and each acid molecule gave two." Reward: "36.0 mL of 0.100 mol/L base is 0.00360 mol, which meets half as many moles of H₂SO₄: 0.0720 mol/L." | |
| 6 | An Early Indicator | The endpoint (colour change) is not always the equivalence point. | Methyl orange changes colour while the view still shows H⁺ left. | 5 (the answer was a typed difference between two readings). | **M.** Typed entry removed; three statement cards and a slot: "Before the equivalence point", "At the equivalence point", "After the equivalence point". The check refuses until the burette has passed the colour change. Prompt: "Does methyl orange change colour before, at or after the equivalence point?" Reward: "The colour changed while H⁺ was still left. Where the indicator changes is the endpoint; a good indicator has its endpoint close to the equivalence point." | |
| (cut) | Purple Base; The Pickling Bath | | | Redox before `q8`; a repeat. | Archive. | |

#### `q8-kinds` (8 stages)

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Join or Split | Synthesis joins substances into one; decomposition splits one into several. | Reaction dial: each view draws the substances before and after. | 1 ("Put each pot in the tray that matches what the window shows"); 2 (terms in the reward). | **S**, pattern 6. Briefing: "In a synthesis, two or more substances join into one. In a decomposition, one substance breaks into two or more." Trays carry the terms and "Neither". Prompt: "Which reactions are a synthesis, which a decomposition and which neither?" Reward: "Counting the substances on each side sorts them. Many reactions are neither: their atoms change partners." | |
| 2 | Three Gas Jars (was 6) | Each common gas has its own test. | Gas tests rig: a glowing splint relights, a lit splint pops, limewater turns cloudy, or nothing changes. | Order: stage 3 needed these tests before they were taught. | **S**, moved. Prompt: "Which gas is in each sample jar?" Reward: "Oxygen relights a glowing splint, hydrogen pops with a lit one and carbon dioxide turns limewater cloudy. Nitrogen changes none of them." | |
| 3 | Burn a Fuel (was 2) | A fuel of carbon and hydrogen burns in oxygen to carbon dioxide and water: combustion. | Burner runs; the gas jar is tested; the tests respond. | 1 (a three-part instruction). | **S.** Prompt: "What does methane make when it burns in oxygen?" Reward: "The tests found carbon dioxide and water. Burning a fuel in oxygen is combustion." | |
| 4 | A Proton Moves (was 3) | In an acid-base reaction a proton passes from the acid to the base. | A ringed hydrogen sits on one molecule before and on another after. | 2 (terms in the reward); 1. | **S**, pattern 6. Briefing: "A hydrogen ion, H⁺, is a single proton. In an acid-base reaction a proton passes from one molecule, the acid, to another, the base." Trays: "Acid-base", "Not acid-base". Prompt: "In which reactions does a proton pass from one molecule to another?" Reward: "Where the ringed hydrogen changed molecules, the reaction is acid-base. An acid being present is not enough." | |
| 5 | Zinc in Copper Sulfate (was 4) | Oxidation is losing electrons, reduction is gaining them. | Electron dots on Zn before, on Cu after. | 2 (terms in the reward); "gave", "took". | **S.** Briefing: "Losing electrons is oxidation and gaining electrons is reduction." Slots: "Oxidised", "Reduced". Prompt: "Which particle is oxidised and which is reduced?" Reward: "Zinc lost two electrons and was oxidised; Cu²⁺ gained them and was reduced. A reaction in which electrons move is a redox reaction." | |
| 6 | Oxidation Number (typed, was 5) | The oxidation numbers in a species add up to its charge. | "Worked" dial shows three species worked out line by line (the worked cases); rules plate. | 4 ("the number manganese carries"); 2 (the definition in a 43-word reward). | **S.** Briefing: "An oxidation number is the charge an atom would have if every shared electron went to the atom that pulls harder. Oxygen is usually −2." Prompt: "What is the oxidation number of manganese in MnO₄⁻?" Reward: "Four oxygens at −2 make −8, and the ion's charge is −1, so manganese is +7. A rising oxidation number means electrons were lost." | |
| 7 | Burning Magnesium (predict) | A guess: can a reaction be more than one kind? | Equation plate; four cards. | 6. | **S.** Prompt: "What kind of reaction is magnesium burning in oxygen?" | |
| 8 | The Furnace Log | The kinds overlap, because each looks at something different. | "Look for" dial sets a kind; each card shows the reading that kind needs (substances, oxygen, protons, electrons). | 5 (eight cards under five kinds is forty decisions). | **M.** Five cards: Zn + CuSO₄, 2 Mg + O₂, HCl + NaOH, CaCO₃ → CaO + CO₂, CH₄ + 2 O₂. Prompt: "Which kinds of reaction is each of these?" Reward: "Burning magnesium is a synthesis, a combustion and a redox reaction at once. Each kind looks at something different: substances, oxygen, protons or electrons." | |

#### `q9-hsab` (6 stages)

Words: "hard" and "soft" are the real terms and are glossed in stage 1. "Firmness", "squishy", "rigid", "prefers", "like pairs stick" and "hard–soft principle" go. Fixture "Firmness Probe" becomes "Cloud probe".

| # | Stage | Idea | Evidence on the bench | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Hard and Soft | An ion whose electron cloud keeps its shape near a charge is hard; one whose cloud is pulled out of shape is soft. | The probe brings a charge up to the ion in its socket: the cloud stays round or stretches toward it. Each ion is drawn to scale with its charge. | 4 ("squishy", "rigid", "firmness"); 2 (the reason, size, only in the reward). | **S/M** (ions drawn to scale if they are not). Briefing: "An ion's electrons form a cloud round its nucleus. The probe brings a charge near the ion and shows whether the cloud keeps its shape." Trays: "Hard: the cloud keeps its shape", "Soft: the cloud is pulled out of shape". Prompt: "Which ions are hard and which are soft?" Reward: "Small ions hold their electrons close and are usually hard. Large ions, and ions with many outer electrons such as Ag⁺, are usually soft." | |
| 2 | Which Pairs Make a Solid | Hard ions form solids with hard ions and soft with soft. | Wells: each cation mixed with fluoride and with iodide; two wells turn cloudy. | 6 (hint 3 was the answer); "like pairs stick together". | **S.** Prompt: "Which pairs of ions form a solid?" Hint 3: "Set each cloudy pair beside what stage 1 showed about its two ions." Reward: "Ca²⁺ and F⁻, both hard, formed a solid, and so did Ag⁺ and I⁻, both soft. The mixed pairs stayed dissolved." | |
| 3 | What Holds Each Solid | Hard pairs are held by attraction between opposite charges; soft pairs share electrons where their clouds overlap. | Viewer: two round clouds side by side, or two clouds merged between the nuclei. | 4 ("covalent overlap between squishy clouds"); 6 (hint 3 the answer). | **S.** Chips: "Held by attraction between opposite charges", "Held by sharing electrons where the clouds overlap". Prompt: "What holds each of the two solids together?" Reward: "Hard ions stay as separate charged spheres that attract. Soft ions' clouds stretch toward each other and share electrons." | |
| 4 | Sulfide (predict) | A prediction from hard and soft on a new ion. | Plate: "Sulfide, S²⁻, is a large, soft ion." Four cards. | Chemistry: the old case set hydroxide against sulfide for silver, but silver does form a solid with hydroxide. | **S.** Cards: "Only Ag⁺", "Only Ca²⁺", "Both", "Neither". Prompt: "Which ions do you expect sulfide to form a solid with: Ag⁺, Ca²⁺, both or neither?" | |
| 5 | Test With Sulfide | The prediction holds: the soft cation forms the solid. | Wells: the silver well turns black, the calcium well stays clear. | 1 ("Mix ... and collect"); 6 (hint 2 names the result). | **S.** Prompt: "Which ion does sulfide form a solid with?" Reward: "Soft Ag⁺ formed black Ag₂S with soft S²⁻. Hard Ca²⁺ stayed dissolved." | |
| 6 | Take Out the Lead (was 7) | Hard and soft choose a reagent that removes one metal and leaves another. | Wells with Pb²⁺ and Mg²⁺ and a reagent dial (fluoride, sulfide). | No instrument (plate and two cards); hint 3 the answer. | **M** (`wellsFixture` with `cat1`, `cat2` and a reagent dial; see Open). Briefing: "Lead ions, Pb²⁺, are large and soft; magnesium ions, Mg²⁺, are small and hard." Prompt: "Which reagent removes the lead from the water and leaves the magnesium dissolved?" Reward: "Soft sulfide formed a solid with soft Pb²⁺ and left hard Mg²⁺ dissolved. Hard and soft is a rough guide, not a law." | |
| (cut) | Partner Exchange; Sealed Foundry Reagents | | | Plate and chips with nothing to test; the hints named wells the table did not have. | Archive. | |

#### `boss-golem` (5 phases)

| # | Phase | Re-tests | Faults | Change | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | Limiting Feed (exists) | `q6` stage 5. | Reward teaches "limiting reactant" as if new; "heap", "recipe". | **S.** Prompt: "How many units of sodium chloride can the golem build from these two supplies?" Reward: "The supply that ran out first set the count: it was the limiting reactant." `BUILDS_ON` loses `q1-recipe`. | |
| 2 | The Golem's Label (new) | `q2` stage 8. | Missing. | **M** (copy `q2` stage 8's table with a different compound, for example copper(II) nitrate: 1 Cu and 2 NO₃⁻ in the view). Prompt: "What is the compound in the golem's drum called?" | |
| 3 | The Golem's Board (new; the header's phase 2) | `q4` stage 6. | Missing. | **M** (`eqBench` with a fresh equation, for example C₂H₆ + O₂ → CO₂ + H₂O). Prompt: "What coefficients balance the equation on the golem's board?" | |
| 4 | What the Furnace Kept (typed; exists) | `q6` stages 6 and 8. | 1 ("Type the percent..."); 6 (hint 3 the route). | **S.** Prompt: "What is the percent yield of iron from this furnace?" | |
| 5 | The Ledger (typed; exists) | `q6` stage 2 (amounts scale in step). | 1. | **S.** Prompt: "What is the most iron, in tons, that 39.9 tons of ore can give?" | |

Hints for all five are rebuilt to the ladder; `meta.stageCount` becomes 5; titles lose "Phase n ·" numbering that skips.

### Open for the builder

- Removing `q1-recipe`: the chart, the saga beats that name it, `BUILDS_ON` in other quests and the boss, the bank file, `tools/lib/kettle-*-checks.mjs`, and the Tour piece keys it registered. If the story needs a first bench before naming, `q3-change` is the natural opener: consider moving it ahead of `q2-names` on the chart (nothing in `q3` needs names).
- `q6` stage 5 runs in the heap kit inside a pot-kit quest; confirm a quest may mix kits (the boss does).
- `q6` stage 7: check that a plate printing 24.5 L does not trip the "plate prints an answer" check (the answer is 12.2 L).
- `q7` stage 6: statement cards and a slot beside the titrator; the table is already full on a phone, so re-lay.
- `q9` stage 6: whether `wellsFixture` and its data cover Pb²⁺ and Mg²⁺ with fluoride and sulfide. If not, keep cards but add the data, or use Ag⁺ and Ca²⁺ with a fluoride-or-sulfide dial.
- `q9` stage 1: whether the probe draws ions to scale; the reward's claim about size needs it.
- Boss phases 2 and 3 are new tables next to the foe pad (top right kept clear).

### Hand-back (plan)

- 64 stages: reworded (S) 57, redesigned M 7, L 0. Of the 64, 2 are new (boss phases 2 and 3) and 1 moved between benches. Cut: 13 (seven with `q1-recipe`).
- Most likely to go wrong in the build: removing `q1-recipe` and moving its stage 4 (two benches, the boss, the chart, the bank and several check files change at once); `boss-golem` (two new phases and renumbering); `q9-hsab` (the chemistry of every pair must be checked against real solubilities, and stage 6 needs wells data that may not exist).

### Structural changes

### Chemistry corrections

### Still weak

(Ordered by how likely a student is to get lost. For each: the stage, what is weak, why it was not fixed.)

### For the owner to look at

(Stages whose table was rebuilt or added. Nobody has seen these on a screen.)

### For close-out

(Stage and quest counts that changed; shared code changed; doctrine or engine lessons.)
