# Avalon: problems and clashing rules

Oct 22, 2026 · @Carl Liu

## Summary

Avalon's science is mostly sound and its engineering is careful, but most benches are still worksheets: the player follows an instruction, and the idea never has to click. Below are the five problems that matter most, in order. Everything after this section is evidence and detail, grouped by type, with a suggested fix for each.

1. **No stage is designed around a click.** Prompts are tasks ("Sort the samples by…"), not questions the player wants answered. The wrong model the player arrives with is never put on the table and contradicted. See §Teaching.
2. **The rules contradict each other.** PRODUCT.md, CLAUDE.md, DESIGN.md and the plans disagree on naming, instructions, hints, combat, streaks and 3D. An agent that reads them all gets two answers to the same question. See §Clashing rules.
3. **Operating the bench still costs more than the chemistry.** The 10-09 audit fixed many single cases, but the cause stays: 2D panels laid on a tilted 3D table, and many buttons and systems to learn. See §Usability.
4. **The world grew faster than the core loop was tested.** 44 quests and 331 stages across six worlds. Every `verify:*` script was green while the audit found the game confusing. See §Scope and process.
5. **The audience is too wide for one text register.** PRODUCT.md sets the floor at an elementary student, while benches teach photoelectron spectroscopy, hybridization and Gibbs energy at AP depth. See §Teaching.

What I read: PRODUCT.md, CLAUDE.md, DESIGN.md, README.md, both feedback docs (feedback-10-22.md is still just a header), the story bible, the Quest 1 design doc and the plans (exploration pass, bench clarity, bench tabletop, engagement, immersion, storyline and combat, the per-world records). I also read stage code in `q1-grain`, `q2-core` and `evaluator.js`, and looked at the audit screenshots. I did not play the game, so layout and feel issues come from your audit and the screenshots, not my own play.

## Teaching

The benches teach by instruction-following: the player does what the prompt says, sees what the bench draws, and is then told the word. What's missing is the moment where their own wrong idea fails in front of them.

| ID | Problem | Evidence | Suggested fix |
| --- | --- | --- | --- |
| T1 | Prompts are tasks, not questions. Nothing makes the player want the answer. | `q1-grain` s1 "Set the lens to the lowest power at which you can see separate particles"; s2 "Sort the samples by how many different kinds of atom each one holds." | Give each quest one hook on the bench (a puzzling sample, a claim to check). Rewrite prompts as questions with a reason behind them. |
| T2 | The player's wrong model is never put on the table. Stages show the right model; they don't break the wrong one. | `q2-core` s1 (gold foil): the model cards are "Solid all through", "Hollow shell", "Tiny dense center". A kid who has heard of a nucleus picks the third card without firing. The model students actually hold (charge spread evenly) isn't an option; nobody holds "hollow shell". | Before firing, the player marks where they expect hits. Detectors keep every hit, so the rare bounce-back builds up instead of being one event. Name the model only after. |
| T3 | Some stages can be passed by guessing. | `q1-grain` s2: two samples, two trays (a 50% guess). | At least three or four cases per sort, including one that fails for the common misconception. |
| T4 | Miss messages give back the reasoning. `verify:learn` searches only for the answer string, so these pass. | `q1-grain` s2 miss: "one of them holds dark carbon atoms and pale sodium atoms together, so it is in the wrong tray." | A miss names what the table shows that disagrees ("Tray 1 holds two kinds of atom"), or says nothing and lets the world respond. Extend the leak check to the discriminating feature, not only the answer. |
| T5 | Predict-first was turned down. | Bench clarity §6: "Predict-first: not added (it would put a step in front of the bench on every stage)". | Require a prediction only on each quest's click stage, recorded and contrasted, not graded. |
| T6 | The audience is too wide. | PRODUCT.md: "The comprehension floor is an elementary school student". README: a high school club. Benches: PES, hybridization, molecular orbitals, Gibbs energy, two quests tagged "beyond the exam" (the AP exam). | Pick one age band per world and write its copy for that band. For example, Tallow and Bellows for middle school, Lanternfall and Ligar for high school. Show the band on the Star Map. |
| T7 | Breadth over depth. | 44 quests, 331 stages. Bench clarity P9 found repeated stages (`q2-core` 7 ≈ `q4-ledger` 5; `q1-grain` 5–6 ≈ `q1-recipe` 1, 3, 4). | Cut each quest to the 3–5 stages that carry a distinct idea, and put the saved effort into the click stage. |
| T8 | The story doesn't touch the bench. | The story bible says "the chemistry is the detective kit", but prompts carry no story, and samples are SAMPLE A/B/C on every bench. | Give each quest one stake that lives on the table: the merchant's alloy to expose, the ledger that can't balance. Keep it out of the prompt and in the samples themselves. |

## Usability and presentation

The 10-09 audit's single cases were mostly addressed, but two causes behind them remain: a 3D camera on content that is flat, and too many systems competing for a new player's attention.

| ID | Problem | Evidence | Suggested fix |
| --- | --- | --- | --- |
| U1 | Flat panels on a tilted 3D table. The camera adds foreshortening and smaller text, and no information. | Audit figures 1 and 6: model tiles, a boxed "Beam" picture and a plot all lie flat on a black mat. CLAUDE.md hard rule: "A built instrument shows a flat picture". Your audit: "most of the quests are 2D in a 3D world". | Decide per bench. Where shape or position is the idea (orbitals, molecular shape, lattices, scattering), make the 3D object itself the instrument. Elsewhere, show the bench square-on or as a 2D panel. |
| U2 | Too many systems for a new player. | At a bench: Leave Bench, Tour, Findings, Hint, Submit, Undo, Start Over, stage lamps, story line, briefing, bench log, trend plot, readings board, captions, notes, field fetch. Bosses add foes and Integrity. Outside: Case File, Drill Deck, Star Map, Standings, Inventory, Crew, about 40 commendations, contracts, Field Manual, a weekly watch. | Show a control only on the stages that use it. Before launch, decide which outer systems a first-week player meets at all. |
| U3 | A field fetch that is pure carrying. | `q1-grain` s1: the hidden "Belt scoop" sample (`c7s`) holds the same atoms in the same count as Sample A (`c7`). The fetch chip shows on the first stage (figure 1). | Keep a fetch only when what is fetched is new evidence. Otherwise cut it; it breaks the "no busywork" invariant. |
| U4 | Words the player must read are painted on a tilted mat. | Table labels and notes are "paint on the mat" with a minimum size. Tabletop plan §7 estimates a 7 cm piece at about 10 px on a 667 px phone. | Draw text the player must read in screen space (HTML over the canvas). Keep painted words for short labels only. |
| U5 | How to use a tool sits behind the Hint button. | Hint rung 1 is defined as "what to do with the tool". A player has to think to press Hint to learn the controls. | Move all operating help onto the objects (captions, notes) and the tour. Spend all three hint rungs on the science. |

The plan records say these audit items are fixed: undo and start over, tool captions, the shaker removed, fixed detectors, the Close Channel exit, worn crates and the star map. I checked them in the code and docs only, not in a browser.

## Scope and process

Most of the effort has gone into worlds and checks that measure structure. Nothing yet measures whether a player understands a bench.

| ID | Problem | Evidence | Suggested fix |
| --- | --- | --- | --- |
| P1 | The world grew faster than the core loop was tested. | Recent plans are mostly hosts, mines, lighting, terrain and bay clearance. Tabletop §2.6 makes world integration a requirement of every phase: a bench "does not count as done" until it fits its world. | Make the bench itself the definition of done: its `verify:*` scripts pass and the owner has played it. Integrating it into the world comes after, as its own step. |
| P2 | Play testing is the owner's. | Tabletop status: "Nothing is browser-tested." Ligar pass: "no browser pass" by an agent; the owner tests. | Agents do not browser-test and the plan does not depend on it. An agent may write a Playwright or Node script to check something it is building, but that is a scratch aid, never a planning step or a gate. |
| P3 | Green checks, confused player. | About 25 `verify:*` scripts check overlap, geometry, copy length and answer leaks. All were green when the 10-09 audit found the game hard to operate. | Keep the scripts. Whether a bench is understandable is judged by the owner's play, fed back as audit notes like `feedback-10-22.md`. |
| P4 | CLAUDE.md is too long to weigh. | 400 lines, 41 KB. Doctrine sits beside layout coordinates ("sorting trays on Tallow (`q1-grain` stage 3) stand at y:48 (h:16)") and CSS details ("`margin-left: auto !important` on `.lq-rail`"). | Cut CLAUDE.md to the teaching doctrine, hard rules and commands (about 100 lines). Move per-world and engine notes into `docs/`, and coordinates into code comments. |
| P5 | Dead code and dead features. | `calorimeter.js`, `thermomount.js` and `GasRig` are marked orphaned. `quest-guide.js` has no callers, yet PRODUCT.md describes its guide modal as a core feature. Tabletop phase T7 (retirement) hasn't started. | Run T7 now, and remove the dead features from PRODUCT.md. |
| P6 | The same content lives in several places. | PRODUCT.md lists its invariants twice (8 "core invariants", then 14 overlapping "principles"). The Quest 1 epilogue is copied into `Quests.gs`, the API proxy and `quest.js`. | One source for each piece of copy. Merge PRODUCT.md's two lists into one. |
| P7 | The competition rests on a road that's on hold. | XP comes only from the campaign: Charge Gardens, 715 XP in total. CLAUDE.md: "Erebus quests are out of scope until Learn work is finished." The engagement pass: "there is not enough XP to hold a level curve." | Decide what the competition is at launch: Quest 1 only, more campaign quests, or Standings counted on something other than XP. |

## Clashing rules

Twelve rules contradict each other across PRODUCT.md, CLAUDE.md, DESIGN.md, the plans and the code. An agent that reads both sides of a pair will follow whichever it read last. Each row suggests one way to settle it; C2, C5 and C10 are judgment calls only you can make.

| ID | Rule A (where) | Rule B (where) | Suggested resolution |
| --- | --- | --- | --- |
| C1 | Real chemistry terms "from stage one" (PRODUCT invariant 1 and principle 1). | Plain labels until the word is earned: `WITHHELD_VOCAB`, Lanternfall's and Bellows' "words plain until earned", tabletop §5 ("atom" and "bond" arrive on their cards). README also promises "without textbook jargon". | The real rule is B plus a ban on code words: use plain observable labels until the stage that earns the word, then the real term, and never an invented word that is later swapped out. Rewrite PRODUCT principle 1 and the README line to say that. |
| C2 | Nothing "should ever tell the player what to do" (PRODUCT principle 2). Delete any string that isn't critical (PRODUCT principle 9). | Prompts may be "one plain question or imperative" (CLAUDE.md). Hint rung 1 is "what to do with the tool". `q1-grain` s1's briefing says "Drag the lens onto the dish and slide the power dial". Your audit asks for explanations of how to use instruments. | Split two kinds of information. How a tool works and how to answer: always given, on the object. Which move solves the stage: never given. Write that split into PRODUCT.md and CLAUDE.md in the same words. |
| C3 | Every quest has a STAGE MISSION & SCIENCE card and an Objective & Guide modal with vocabulary definitions (PRODUCT invariant 3 and principle 3; DESIGN.md signature). | `quest-guide.js` has no callers, so don't copy from it. "No modal precedes a stage". "No Vess modal opens on a stage" (CLAUDE.md). | B is what was built. Delete the guide from PRODUCT.md and DESIGN.md. Vocabulary definitions in a guide would also break C1. |
| C4 | Stage buttons are `[Objective]`, `[Findings]`, `[Fold Panel]` (PRODUCT invariant 5, DESIGN.md Do's). | The bench has Tour, Findings, Hint, Submit and Hide Panel (CLAUDE.md and the audit screenshots). | Update PRODUCT.md and DESIGN.md to the current buttons. |
| C5 | "Experiment trials, not monster combat": misses are measurement discrepancies, "not monster attacks", and specimens are "stabilized, never killed" (PRODUCT 4 and 12, DESIGN.md). | Six bosses fight, with health bars, foes, intent lines and Integrity (CLAUDE.md). The story bible has "Spoil Combat", and the storyline plan answers "a battle with monsters". Foes are "dispersed". | Your call. Either bosses are trials on a large specimen, with copy to match, or PRODUCT.md admits that bosses fight and keeps the trial framing for ordinary stages. Use one verb ("stabilized" or "dispersed") everywhere. |
| C6 | Hint rung 3 is the method, "never the answer" (CLAUDE.md teaching doctrine, Learn track). | Charge Gardens hints are `[nudge, narrow, solution]` (`evaluator.js`), and the exploration pass's rung 3 "names the move". | One ladder on both roads. If the campaign keeps a solution rung on purpose, say so in CLAUDE.md and the reason why. |
| C7 | A self-explanatory tool gets no legend; "a 'Lens' or 'Cutter' gets none" (CLAUDE.md doctrine, tabletop §5). | "Every tool hangs in a named place with one plain line printed under it", and "every loose tool carries a caption" (post-audit invariant 1, CLAUDE.md's Ligar notes). | B. The audit showed the cutter wasn't self-evident. Delete the "gets none" lines. |
| C8 | Drill Deck has "a day streak" (PRODUCT.md), and `drills.js` counts consecutive days (`streakOf`). | "A weekly streak, not a daily one", and "Daily streaks" are deliberately excluded (engagement pass §7.1, §13). PRODUCT principle 7: learning must never become grinding. | Make the Drill Deck streak weekly, or drop it. |
| C9 | Predict-first "not added" (bench clarity §6). | "Predict, then test" is a core verb (tabletop §2.1, §2.4), and Ember Reach's "why" stages are predictions. | State one rule in CLAUDE.md. Suggested: a prediction on each quest's click stage, otherwise only for a new case of an idea already worked out. |
| C10 | "A built instrument shows a flat picture" (CLAUDE.md hard rule). Ligar's pass notes the pictures are "still pictures under glass". | Add 3D visualizations wherever they help (your 10-09 audit). Learning comes through "direct manipulation of 3D molecules" (PRODUCT invariant 8). | Flat pictures for things that are flat (spectra, graphs, plots). Spatial content (orbitals, shape, lattices, scattering) gets the 3D object as the instrument. Keep "the picture is honest" either way. |
| C11 | "The comprehension floor is an elementary school student" (PRODUCT.md). | A high school club (README), "players are 12 to 17" (engagement pass), and AP-depth benches. | See T6: one age band per world, stated in PRODUCT.md. |
| C12 | "Every screen must work at 375 px wide", a portrait phone width (PRODUCT.md). | Game mode enforces landscape with an orientation lock and `#orientation-guard` (CLAUDE.md, Mobile). | State which screens must work in portrait and which may require landscape. |

## Stale facts

PRODUCT.md and README.md trail the code by several weeks, and CLAUDE.md is the most current. An agent that reads PRODUCT.md first starts from a wrong picture of what exists.

| Fact | PRODUCT.md or README.md says | CLAUDE.md, plans or code say |
| --- | --- | --- |
| Built Learn content | "Thirty-one benches built, and four bosses" (PRODUCT) | 38 benches and 6 bosses: 44 quest modules, 331 stages |
| Ligar | "Four benches" taught as built (PRODUCT) | Nine benches and the Basalt Warden |
| Walkable worlds | Tallow, Lanternfall, Ligar and Bellows (PRODUCT) | Ember Reach too |
| Evidence | "nine built Learn quests, verified by eleven check scripts" (PRODUCT) | 44 quests; `npm run verify` runs about 25 scripts |
| Graphics tiers | T3 desktop, T2 Chromebook at 30 fps, T1 no WebGL (README); T4 to T1 (PRODUCT) | Two settings: "3D On" (T4) and "3D Off" (T1) |
| Database | "Avalon DB" with 6 tabs (README); a 15-tab sheet (PRODUCT) | 7 sheet tabs; the rest are code constants |
| Premise | "Four rival corporate flagships" (README) | Four Imperial guilds aboard one salvage starship (PRODUCT) |
| Bench form | Learn instruments are "a built object on a bench" with screens bolted over them (PRODUCT) | Every built quest is a tabletop |
| Guide copy | `quest-guide.js` describes `q1-recipe` by its old stages | `q1-recipe` was rebuilt (bench clarity build record) |
| 10-22 feedback | `docs/feedback-10-22.md` has a header and no content | Nothing to compare yet |

The fix is one pass over PRODUCT.md and README.md. Then add a `verify:docs` check that compares PRODUCT.md's counts against the curriculum registry, so they can't drift again.

## Suggested order of fixes

Settle the rules before rewriting benches, then pilot the new approach on one quest before rolling it out. Otherwise every bench gets reworked twice.

- [x] **Make the three judgment calls.** (2026-10-22) Bosses fight, ordinary stages are trials, foes are "dispersed" (C5). One age band for the whole game, 12 to 17 (T6, C11). Competition at launch is Quest 1 only (P7).
- [x] **One docs pass.** (2026-10-22: C1 to C12, stale facts, merged principles, CLAUDE.md cut to 150 lines with the rest in `docs/engineering/engine-and-worlds.md`, `verify:docs` added; old versions in `docs/archive/2026-10-22/`.) Resolve C1 to C12 in PRODUCT.md, CLAUDE.md and DESIGN.md. Update the stale facts, merge PRODUCT.md's two lists (P6), and cut CLAUDE.md to doctrine, hard rules and commands (P4).
- [x] **Play testing stays with the owner.** (2026-10-22) No agent browser pass or cold-read step is planned (P2, P3). Playwright scripts are optional scratch aids.
- [x] **Pilot one quest built around its click.** (2026-10-22, built, awaiting the owner's play: the gold foil now asks for a prediction of the Back count, the wrong "soft and even" model is a card, detectors keep every hit across firings, and the beam bench is dressed in a 3D foil and source at `3D On`.) Tallow `q2-core`, starting with the gold foil: add the hook, a prediction, and detectors that keep every hit; show the bench square-on or as a true 3D scattering scene (T1, T2, T5, U1). The owner plays it and reports back.
- [x] **Roll out world by world.** (Tallow done 2026-10-22; Lanternfall, Ligar, Bellows and Ember Reach built 2026-10-23, awaiting the owner's play: 77, 77, 53 and 61 stages cut to 49, 45, 33 and 33; one predicted click per bench against the likely wrong model; guessable sorts widened; miss messages name only what the table shows; hint rung 1 is the control; carry-only fetches and locks retired; every tool in the Tour; 3D solids for the spatial benches; 34 story animations in all. Kettle has one bench.) Cut each quest to its distinct stages (T7). Remove guessable sorts (T3) and reasoning in miss messages (T4). Move operating help out of hint rung 1 (U5). Keep only fetches that bring new evidence (U3). Show only the controls a stage uses (U2), and draw must-read text in screen space (U4). Give each quest a stake on the table (T8).
- [x] **Retire dead code** (2026-10-22: archived to `archive/retired-2026-10-22/`, not deleted; the Drill Deck streak is now weekly, C8) (tabletop T7, P5).
- [ ] **Then world integration.** A bench counts as done when its `verify:*` scripts pass and the owner has played it; fitting it into its world is the next step, not part of done (P1).
