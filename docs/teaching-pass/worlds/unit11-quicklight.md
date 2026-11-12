# Quicklight (`unit11`): kinetics

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. This world is **not built**. The file is a lesson plan for a first build, written 2026-11-12 by a plan session to the same standard as the ten live worlds. No code was changed.

- **Session:** build session (a strong model for the two new fixtures, then a world session for the rest).
- **What exists:** the chart `src/learn/worlds/unit11-kinetics.js` (four placeholder quests, all `status: 'draft'`, `module: null`); a stage list in `docs/plans/learn-quests.md` ("World 11", seven quests of eight stages). No quest files, no bank, no glossary, no checks.
- **Exam:** AP Unit 5 (5.1 to 5.11). This is exam content.
- **Place and story:** storm belt; `docs/story/bible.md` for names. Fiction stays in the boss, the saga and Vess's lines.
- **To create:** `src/learn/quests/unit11/` (six benches and a boss), `src/learn/bank/unit11.json` (two practice problems for each bench; one worked problem for each bench with a typed stage), `src/learn/glossary/quicklight.js`, a `verify:quicklight` check, a story animation for each bench, the 3D site.

## How this plan differs from the earlier stage list

- Seven quests of eight stages become six benches and 35 stages plus a five-phase boss. The earlier list had a "Sealed" eighth stage on every bench and several stages that were a readout to copy (a slope, the units of k).
- Collisions and energy profiles are one bench: the hill is where the collision idea ends.
- Almost everything is drawn by kits that exist. Two fixtures are new.

## Instruments

| Need | Source | Size |
| --- | --- | --- |
| A vessel of moving particles with a graph of amounts against time, change counts, a "Run" key, ringed particles, a catalyst option | `pans.js` vessel and pan (Teeter `q1`, `q6` stage 6) | reuse; add an irreversible reaction and a concentration dial |
| Tap a place on a graph | `tapZones` (`pans-stress.js`, `heat.js`) | reuse |
| Spread of particle speeds with a temperature dial | gas kit `hist` and `rig` (Bellows `q1` stage 6) | reuse; add a threshold bar (M) |
| Energy profile along the reaction | heat kit `shelvesFixture` `levels` (the reaction-progress hill left unused when Ember Reach cut its activation-energy stage) | reuse; add a second hump and a catalysed path (M) |
| Equation cards that add and cancel | cards kit `equation`, `stackNet`, `net` fixture | reuse |
| Expression with power dials | Teeter `kspform` | reuse as a rate-law board |
| **Initial-rates log** | new: a table that keeps one row for each run (concentrations set, rate measured) beside the vessel | **L (small)** |
| **Plotter with three keys** | new: the recorder strip replotted as [A], ln[A] or 1/[A] against time, with the straightedge | **L (small)** |
| Slow-motion collisions | new view in the vessel painter: two particles approach with speed arrows and an orientation; they bounce or react | **M** |

## Bench-level sequence

| Bench | Idea | Terms it introduces (gloss) |
| --- | --- | --- |
| `q1-watch` How Fast (6) | A reaction's rate is how fast a concentration changes; it falls as reactant is used up; concentration, temperature and surface area change it. | reaction rate (change in concentration each second) |
| `q2-law` The Rate Law (5) | Doubling a concentration multiplies the rate by a factor that has to be measured; those factors make the rate law. | rate law, order, rate constant k |
| `q3-time` Concentration Over Time (5) | A first-order reaction halves in equal times; which plot is straight tells the order. | half-life, first order, second order, zero order, natural logarithm ln (recap) |
| `q4-collide` Collisions and the Hill (7) | Particles react only when they collide with enough energy and the right way round; the least energy needed is the activation energy, the hill on an energy profile. | collision model, activation energy, energy profile, transition state |
| `q5-steps` Steps (7) | Most reactions happen in several steps; the slowest sets the rate, and the rate law tests a proposed mechanism. | elementary step, mechanism, intermediate, rate-determining step |
| `q6-shortcut` Catalysts (5) | A catalyst gives the reaction a different path with a lower hill and comes out unchanged. | catalyst, heterogeneous catalyst, enzyme, active site |
| `boss` (5 phases) | Re-test of `q1` to `q6`. No new idea. | none |

`BUILDS_ON` and recaps: moles and mol/L (primer); the energy diagram and ΔH from Ember Reach (recap in the briefing of `q4` stage 5); equilibrium is not needed until `q5` stage 6, which recaps it in one clause.

## Plan rows

Every stage is new, so there is no Faults column. "Texts" gives the final prompt (P), the briefing (B) where the stage needs one, and the reward (R). Hints follow the ladder in `BRIEF.md` section 5 and are left to the builder except where noted.

### `q1-watch` How Fast (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Fast and Slow (predict) | A guess at what "faster" looks like on a graph. | Lead clip of a vessel starting to react. Three cards. | P: "Two reactions end with the same amount of product: how does the faster one's graph differ?" Cards: "It climbs more steeply", "It ends higher", "It starts later". | `lead`, cards |
| 2 | Two Vessels | The steeper the graph, the faster the reaction. | "Run" on two vessels; particles change colour at different paces and two lines climb. Tap the faster vessel. | B: "Reaction rate is how fast the concentration of a substance changes: so many mol/L each second." P: "Which reaction has the higher rate?" R: "Vessel 2's product rose faster, so its line is steeper. The steepness of the line is the rate." | `pans` vessel, `choice` |
| 3 | Putting a Number on It (typed) | Average rate = change in concentration ÷ time. | One vessel run; two points on its line carry their values. | B worked lines (another run): "0.40 mol/L at 0 s, 0.10 mol/L at 20 s", "change 0.30 mol/L in 20 s", "rate 0.015 mol/L each second". P: "What is the average rate of this reaction over its first 10 seconds, in mol/L each second?" Miss: the concentration the typed rate would leave at 10 s. | vessel, entry |
| 4 | Slowing Down | The rate falls as the reactant is used up. | The run's curve flattens while fewer reactant particles remain in the window. Tap the stretch of the curve where the reaction is fastest. | P: "Where on this curve is the reaction fastest?" R: "At the start, where the most reactant is left. As it is used up the curve flattens and the rate falls." | vessel, `tapZones` |
| 5 | Two for One | Rates of different substances are tied by the coefficients. | Vessel of 2 A → B: change counts show two A lost for each B made. | P: "For 2 A → B, how does the rate at which A is used compare with the rate at which B forms?" Cards: "The same", "Twice as fast", "Half as fast". R: "Two A are used for each B formed, so A falls twice as fast as B rises." | vessel with counts, cards |
| 6 | Three Changes | More concentrated, hotter, or more finely divided: each makes more collisions that react. | Vessel with a "Change" dial: more reactant in the same volume, a higher temperature, a lump broken into powder, a larger vessel. Each can be run and its line compared with the dashed first run. Sort four change cards. | P: "Which changes make this reaction faster?" Trays: "Faster", "Slower", "No change". R: "More particles in the same volume, faster particles and more exposed surface all gave a steeper line. A larger vessel spread the particles out and slowed it." | vessel with dial, cards |

### `q2-law` The Rate Law (5 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Doubling A | Doubling one reactant can double the rate. | Concentration dial for A at 0.10, 0.20, 0.40 mol/L; each run adds a row to the log with its starting rate. | B: "The log keeps the concentration you set and the rate measured at the start of each run." P: "When the concentration of A doubles, what happens to the rate?" Cards: "No change", "Doubles", "Four times", "Halves". | vessel, **rates log** |
| 2 | B and C | Each reactant has its own effect, found only by measuring. | Dials for B and C; the log grows. Sort the cards B and C. | P: "What does doubling B do to the rate, and what does doubling C do?" Trays: "No change", "Doubles", "Four times". R: "Doubling B made the rate four times as large and doubling C changed nothing. The equation does not tell you this; only the runs do." | vessel, log |
| 3 | Writing the Law | The effects are written as powers: rate = k[A]¹[B]²[C]⁰. | The filled log from stages 1 and 2; a board with a power dial on each concentration. | B: "A rate law writes the rate as a constant, k, times each concentration raised to a power. The power is that reactant's order: 1 if doubling it doubles the rate, 2 if it makes the rate four times as large, 0 if it does nothing." P: "What is the rate law for this reaction?" R: "rate = k[A][B]². The reaction is first order in A, second order in B and zero order in C." | board (`kspform`), log |
| 4 | Finding k (typed) | k comes from any one row. | A new reaction with a two-row log and its rate law printed. | B worked lines (stage 3's reaction, one row): "rate 0.020 = k × 0.10 × 0.20²", "k = 0.020 ÷ 0.0040 = 5.0". P: "What is the rate constant k for this reaction?" The field carries the units. Miss: the rate the typed k would give for row 1. | log, entry |
| 5 | A Run Not Made (typed) | The rate law predicts a rate nobody measured. | The same log with a third row whose rate is blank; the vessel can be run at the logged settings only. | P: "What will the rate be in run 3?" R: "With the law and k from two runs, the third follows: the rate law is a summary of the measurements that can be used to predict." | log, entry |

### `q3-time` Concentration Over Time (5 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Half, Then Half Again | A first-order reaction takes the same time for each halving. | Run a first-order vessel; markers drop on the curve at each halving and print the time between them. | P: "How does the time for the second halving compare with the first?" Cards: "Longer", "The same", "Shorter". R: "Each halving took the same time. That time is the reaction's half-life." | vessel, cards |
| 2 | After Three Half-Lives (typed) | After n half-lives, (½)ⁿ is left. | The curve with its half-life marked; the asked time is past the end of the plot. | B worked line: "After 2 half-lives: ½ × ½ = ¼ is left." P: "What fraction of the reactant is left after three half-lives?" The field accepts 0.125 or 1/8. | vessel, entry |
| 3 | Which Plot Is Straight | For a first-order reaction, ln[A] against time is a straight line. | Plotter keys [A], ln[A], 1/[A] redraw the recorded points; the straightedge shows whether they lie on a line. | B: "The plotter can redraw the same readings three ways. ln is a calculator function, the natural logarithm; here it is only a way of redrawing the points." P: "Which plot of this reaction's readings is a straight line?" R: "ln[A] against time is straight. That is the mark of a first-order reaction: its rate is proportional to [A]." | **plotter** |
| 4 | Three Reactions | The straight plot names the order. | Three sets of readings on a dial; the three keys. Sort three cards. | P: "What is the order of each reaction?" Trays: "Zero order: [A] is straight", "First order: ln[A] is straight", "Second order: 1/[A] is straight". | plotter, cards |
| 5 | k From the Half-Life (typed) | For a first-order reaction, k = 0.693 ÷ half-life. | A run with its half-life marked; a plate with the relation. | B worked line: "half-life 10 s: k = 0.693 ÷ 10 = 0.0693 each second". P: "What is k for this first-order reaction?" R: "A short half-life means a large k: the two say the same thing about how fast the reaction is." | vessel, `plaque`, entry |

### `q4-collide` Collisions and the Hill (7 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Every Collision? (predict) | A guess. | Lead clip of particles colliding in a vessel. Three cards. | P: "Of the collisions between reactant particles, how many lead to reaction?" Cards: "All of them", "About half", "A small share". | `lead`, cards |
| 2 | Hard and Soft | Only collisions with enough energy react. | Slow-motion pairs: each shows its speed arrows, then bounces apart or reacts. Six clips, all head-on. Sort them before pressing "Play" on the last two. | P: "Which collisions will react?" Trays: "Reacts", "Bounces apart". R: "The fast pairs reacted and the slow pairs bounced. A collision must bring a least amount of energy to break the old bonds." | **collision view** |
| 3 | The Right Way Round | A collision must also bring the right atoms together. | Pairs at one speed meeting at different orientations; the reacting atoms are tinted. | P: "Two equally fast collisions: why does only one react?" Cards: "The reacting atoms met in one and not the other", "One was hotter", "Chance alone". R: "The particles must collide with the atoms that are to bond facing each other. Energy and orientation together are the collision model." | collision view, cards |
| 4 | Over the Bar | A small rise in temperature greatly increases the share of collisions with enough energy. | Spread of particle energies with a bar at the least energy needed; the heater dial slides the spread; the shaded share past the bar is printed at each stop. | B: "The least energy a collision needs in order to react is the activation energy, Ea." P: "The temperature rises by 10 K: what happens to the share of collisions with at least the activation energy?" Cards: "It hardly changes", "It rises in step with the temperature", "It rises steeply". R: "The spread shifts a little and the share past the bar nearly doubles. This is why warming a reaction speeds it so much." | gas `hist` with bar |
| 5 | The Hill | The activation energy is the height from the reactants to the top of the energy profile. | Energy profile: a ball dragged from reactants over the top to products; the energy reading follows it. Tap the height that is Ea. | B: "An energy profile plots the energy of the reacting particles as the reaction goes from reactants to products. The arrangement at the top is the transition state." P: "Which height on the profile is the activation energy?" R: "From the reactants up to the top. The drop from reactants to products is ΔH, and it does not depend on the height of the hill." | `shelves` `levels`, `tapZones` |
| 6 | The Way Back (typed) | The reverse reaction climbs from the products: Ea(reverse) = Ea − ΔH. | The profile with the reactant, top and product levels printed. | P: "What is the activation energy of the reverse reaction?" Miss: which two levels the typed height lies between. | profile, entry |
| 7 | Downhill and Not Moving | A reaction can release energy and still not happen at room temperature if its hill is high. | Two profiles side by side, both downhill; one with a low hill runs in its vessel, one with a high hill does not move. | P: "Diamond turning to graphite releases energy: why is it never seen to happen?" Cards: "Its activation energy is very high", "Its ΔH is too small", "It has already finished". R: "ΔH says whether energy is released, not whether the reaction is fast. A high activation energy can keep a favourable reaction from ever starting." | two profiles, vessels, cards |

### `q5-steps` Steps (7 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Adding the Steps | A reaction's steps add up to the overall equation. | Three step cards; the stack adds what is laid on it, cancels what appears on both sides and prints the net. | B: "Most reactions happen as a series of simple collisions, each called an elementary step. The series is the reaction's mechanism." P: "Which steps add up to 2 NO₂ + F₂ → 2 NO₂F?" (the correct stack is the answer). | cards `stack` |
| 2 | Made and Used | An intermediate is made in one step and used in a later one. | The stack from stage 1 with the cancelled species struck through. A slot for one species card. | P: "Which substance is made in one step and used up in the next?" R: "F is made in step 1 and used in step 2, so it never appears in the overall equation. It is an intermediate." | stack, slot |
| 3 | The Slow Step | The slowest step sets the rate of the whole reaction. | A two-step vessel: step 1 slow, step 2 fast; intermediates are used as soon as they form. A dial speeds up one step at a time and the product line is compared. | P: "Which step, made faster, speeds up the whole reaction?" R: "Only speeding the slow step changed the product line. The slowest step is the rate-determining step." | vessel with two steps |
| 4 | One Step's Rate Law | For a single elementary step the orders are the numbers of particles that collide. | Collision view of A + B → C and of 2 A → C; the rate-law board. | B: "For one elementary step, and only for one, the rate law can be read from the step: each particle in the collision adds one to its order." P: "What is the rate law of the single step NO₂ + F₂ → NO₂F + F?" | collision view, board |
| 5 | Does It Fit? | A mechanism is acceptable only if its slow step gives the measured rate law. | A plate with the measured law, rate = k[NO₂][F₂]; two mechanism cards, each with its slow step marked. | P: "Which mechanism agrees with the measured rate law?" R: "Mechanism 1's slow step collides one NO₂ with one F₂, which gives the measured law. A mechanism can be ruled out by a rate law, never proved by one." | cards, `plaque`, slot |
| 6 | A Fast Step First | When a fast, reversible step comes first, the slow step's intermediate is replaced using that step's equilibrium. | Mechanism: A + B ⇌ I (fast, both ways), I + B → P (slow). Vessel shows I staying small and steady. Four rate-law cards. | B: "A step that runs fast both ways stays at equilibrium, so the amount of its product is fixed by its reactants: [I] is proportional to [A][B]." P: "What is the rate law for the overall reaction?" R: "The slow step gives rate = k[I][B], and [I] goes as [A][B], so rate = k[A][B]². An intermediate never appears in a rate law." | vessel, cards |
| 7 | Two Hills | Each step has its own hill; an intermediate sits in the valley between. | Two-humped profile; ball dragged across. Tap the hump of the rate-determining step. | P: "Which hill belongs to the rate-determining step?" R: "The higher one. The valley between the hills is the intermediate." | profile with two humps, `tapZones` |

### `q6-shortcut` Catalysts (5 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Used Up? (predict) | A guess. | Lead clip; three cards. | P: "A substance that speeds up a reaction is added: how much of it is left at the end?" Cards: "None", "Some", "All of it". | `lead`, cards |
| 2 | With and Without | A catalyst speeds a reaction and is still there afterwards. | Two vessels; one holds a counted catalyst. Its line is steeper, both end at the same amounts, and the catalyst count is unchanged. | P: "What happened to the amount of the added substance?" R: "It is all still there, and the reaction finished sooner. A substance that speeds a reaction without being used up is a catalyst." | two vessels, `selector` |
| 3 | A Lower Hill | A catalyst lowers the activation energy and leaves ΔH alone. | Profile with the catalysed path drawn beside the first. Tap what differs. | P: "What does the catalyst change on the energy profile?" Zones: the hill's height, the reactant level, the product level. | profile with second path |
| 4 | A Different Path | A catalyst takes part in one step and is given back in a later one. | Step cards for the catalysed mechanism on the stack: one species cancels as an intermediate, another appears first as a reactant and later as a product. Sort two species cards. | P: "Which substance is the catalyst and which the intermediate?" R: "The catalyst is used in the first step and returned in the last; the intermediate is made first and used later. Both cancel from the overall equation." | stack, cards |
| 5 | On a Surface | A solid catalyst works where molecules land on it. | View of gas molecules landing on a metal surface, their bonds stretching, new molecules leaving. Tap where the reaction happens. | P: "Where does the reaction happen when the catalyst is a solid?" R: "On the surface, where the molecules are held with their bonds weakened. A catalyst in a different state from the reactants is a heterogeneous catalyst; in living things the catalysts are enzymes, and the place a molecule binds is the active site." | surface view (M, in the vessel painter), `tapZones` |

### Boss (5 phases)

| # | Phase | Re-tests | Design |
| --- | --- | --- | --- |
| 1 | Two Readings (typed) | `q1` stage 3 | A new curve with two marked points. P: "What is the average rate between the two readings?" |
| 2 | The Log | `q2` stages 3 and 4 | A three-row log. P: "What is the rate law for this reaction?" on the power board. |
| 3 | The Count Down (typed) | `q3` stage 2 | A half-life printed. P: "What fraction is left after four half-lives?" |
| 4 | The Profile (typed) | `q4` stages 5 and 6 | A profile with three levels. P: "What is the activation energy of the forward reaction?" |
| 5 | The Proposal | `q5` stage 5 | A measured law and two mechanisms. P: "Which mechanism agrees with the measured rate law?" |

## Glossary (`src/learn/glossary/quicklight.js`)

`TERMS` as in the sequence table, each with the stage that introduces it. `BANNED` from the start: *speed* for rate (keep for particles), *knock*, *hill* in prompts and rewards before `q4` stage 5 names the energy profile (the title may keep it), *push*, *room*, *slow down* as a noun, "wants to react". `NEEDS`: mol/L (`q1` stage 2), ln (`q3` stage 3), ΔH (`q4` stage 5), equilibrium (`q5` stage 6).

## Open for the builder

- Whether `pans.js` can run an irreversible reaction with a set order (zero, first, second) and a two-step chain. `eqdata.js` has a chain for Teeter `q4`; add entries, do not alter them (Verdigris reads the file).
- The rates log and the plotter are the two new fixtures. Both must fit beside a vessel at 340 px wide.
- The slow-motion collision view must be a pure painter of state and `b.clock`.
- Real reactions and numbers: 2 NO₂ + F₂ → 2 NO₂F is a standard two-step example; choose and cite a real reaction for `q2` (for example 2 NO + O₂ → 2 NO₂, second order in NO and first in O₂) and for `q3` (the first-order decomposition of N₂O₅ or H₂O₂). Record each constant with its source.
- Chart: replace the four placeholder quests with the six bench ids above; `verify:docs` and `PRODUCT.md` counts change when the world goes live (close-out).
- Ember Reach cut activation energy by owner decision; this world now owns it.

## Hand-back (plan)

- 35 stages and 5 boss phases, all new: 11 on reused fixtures unchanged, 19 on reused fixtures with a new option (M), 5 that need the two new fixtures (L).
- Most likely to go wrong in the build: `q2-law` (the rates log is new and every stage of the bench depends on it); `q4-collide` stages 2 to 4 (a new collision view and a threshold bar on a borrowed fixture); `q5-steps` stage 6 (the pre-equilibrium step is the hardest idea in the world, and its briefing carries more than a briefing should).
