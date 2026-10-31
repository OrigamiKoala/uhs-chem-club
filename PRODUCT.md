# Product

<!-- impeccable:product-schema 1 -->

Previous versions of this file are kept in `docs/archive/2026-10-22/PRODUCT.md` and `docs/archive/2026-10-29/PRODUCT.md`.

## Platform

web

## Users

One audience, one text register: **middle- and high-school students, ages 12 to 17**, who join for the competition, the story or their guild. Many have taken no chemistry course. Every stage, objective and concept is written for that reader: plain words, real chemistry terms once they are earned, rigorous and never condescending. The Learn road is checked against the AP Chemistry Course and Exam Description (see "Building a Learn world"); where a bench goes past what a first course covers (photoelectron spectroscopy, hybridization, Gibbs energy) or past the AP exam (molecular orbitals, quantum numbers), it says so on the bench.

**Club officers** are an operational role rather than a player audience. They run showcase nights, reset passwords, force renames, raise guild slot caps and correct stage copy live from the Sheets backend (`#/admin`, `docs/runbook.md`). Their work is maintenance, not play.

## Product Purpose

Avalon is a year-long RPG competition and molecular simulator for the UHS Chemistry Club. Students join one of four Imperial guilds aboard a salvage starship and learn chemistry by doing it: running instruments over mineral specimens, firing particle beams through atoms and calculating yields, rather than reading abstract lectures.

**Two roads.** The Learn worlds are the study road: no XP, never on the leaderboard. The campaign is the competition road: Quest 1, The Charge Gardens of Erebus, pays XP and feeds Standings. **At launch the competition is Quest 1 only** (20 stages, 650 XP, 715 with bonuses). More campaign quests are a later decision (Erebus work is on hold until Learn work is finished) and Standings are built from campaign XP only. How a season fills a level curve from one quest is open (see Not established).

## Principles

One list. Where an older rule and a newer one disagreed, the newer is stated here and the other is gone.

1. **Real terms, earned, never code words.** Use plain observable labels until the stage that earns the word, then the real term (atom, bond, isotope, orbital). Never an invented word that is later swapped for the real one ("light pieces", "grains"). Analogies to real life are welcome. Each term is defined where it is first met (a briefing, an earlier reward card, an inline gloss); `VOCABULARY` and `WITHHELD_VOCAB` enforce the promise.
2. **Never give away answers.** The bench holds the evidence and the player deduces the answer. Two kinds of information are kept apart:
   - *How a tool works and how to answer* (what a key does, how to place a piece, what "Submit" grades): always given, on the object (captions, notes, legends), never behind a hint.
   - *Which move solves the stage*: never given. Prompts state the objective, never the route; hints spend all three rungs on the science.
3. **A stage must be solvable by someone who does not already know the answer.** The evidence is on the bench, never only in a hint. One reading is never enough: every stage is solved by comparing two or more. Nothing blocks a player who has the right answer.
4. **The answer is what is on the table.** A Learn quest is an open tabletop graded on what the player built, arranged or measured, not an authored multiple-choice question (unless the stage is an unbuildable reading). Every drag has a two-tap twin. Snaps are physics, never a gatekeeper.
5. **Predict only where it pays, and predict first.** A prediction is asked on each quest's click stage and on a new case of an idea already worked out. It is never asked on every stage, and never graded: the test is what is graded, and the guess only comes back on screen. **The bench is separated into two parts.** A *predict stage* shows only the question and the guesses (model cards, tokens, a slot) and no instrument, tool or runnable control, and the player cannot go on until they have committed a guess; the *next stage* brings the instrument, shows the locked guess in its prompt, and its reward says whether the test agreed. The guess is made before the experiment is even on the table, so it cannot be changed after seeing the result. Predicting the structure of the thing under study (the model of the atom, before the beam fires) is the model case. `stage.predict`, `engine/predict.js` and `verify:table` hold it.
6. **Trials, not combat.** An ordinary stage is a trial: a wrong answer is a missed trial with a reason, never an attack, and progress is never lost. **Only the seven bosses fight**, and they are the one place foes, a health bar and Integrity appear. A foe only observes and is *dispersed, never killed*; scouting is free, only a committed miss costs one of three Integrity, a correct commit wins at any Integrity, and a reset keeps every reading and open hint. Foes come from the instrument's own planner and carry evidence (the deletion test: delete the foe and the stage must change). Real-time reflex challenges are rejected.
7. **The chemistry arrives after the work.** Every stage ends on a reward card (one to three sentences) that names, in real terms, the idea just worked out. Copy around it stays plain; the card is where the vocabulary lands.
8. **Chemistry solves story problems, not the reverse.** The story hands the player a practical problem (an alloyed ore, an unbalanced life-support mix) that the chemistry they discovered solves. No arbitrary sci-fi puzzle gets chemistry retrofitted onto it.
9. **Physical intuition over jargon.** Organic reactions teach mechanism (opposite charges attract, limited bond seats, crowding blocks a path, leaving pieces clear seats), not college nomenclature (alkyl halide, SN1/SN2).
10. **Show space as space, flat things flat.** Where shape or position is the idea (orbitals, molecular shape, lattices, scattering) the 3D object itself is the instrument, and at `3D On` the bench stands it up as solid parts (a foil in the beam, a source block, a lattice) rather than relying on a flat picture lying on the mat. A bench whose idea is spatial and that only draws a 2D picture is unfinished. Spectra, graphs and plots are drawn flat, square-on or as a 2D panel. Either way the picture is honest: what is drawn is what is graded, and `3D Off` draws the same picture on the canvas.
11. **Learning must never become grinding.** The study road pays no XP and never touches Standings; hints are free; a replay costs and earns nothing; practice is optional, skippable and gates nothing; streaks are weekly, never per day.
12. **Operating the bench is easier than the chemistry.** A first-time player can operate every tool from what is on the table, answer without hunting for Submit, undo any mistake where it was made (Undo, Start Over), and leave a bench at any point (Leave Bench, the nav keys). Show a control only on the stages that use it.
13. **Critical text only.** The interface does not advertise itself. Text exists to direct, instruct, teach or tell the story: functional labels, rules, errors, taught content, character speech. No decorative sci-fi noise, `//` markers, fake status readouts or ceremonial titles, and no cryptic terseness on essential instructions.
14. **An instrument never invents a reading.** A screen that claims to be telemetry shows what was measured or says it has none. This is a pre-launch product and a plausible number in place of a missing one is the easiest lie to ship.
15. **A place the player is told to look at is never blacked out.** At a bench built in the world, the transmission docks to one side at a readable width and the scrim goes to a veil. No modal precedes a stage.
16. **The floor is a student who knows nothing and is holding a phone.** Low-end hardware and 375 px are the design target, not a degraded mode.
17. **NEVER have too many things going on.** A stage asks for one decision at a time, and what is on the bench at once is what that decision needs and nothing else: one question, a small set of pieces (a few cards, a slot, an instrument and its one key), no second task stacked on the first, no extra readout, strip, label or angle that the answer does not use. When a stage feels crowded the fix is to remove, never to explain. A stage that adds a prediction, a strip and a model choice together has three tasks and is cut to one. The owner's play judges it; a crowded bench is a defect even when every check is green.
18. **The Tour explains every tool.** The Tour key (and a stage-one briefing) walks the player through what is on the stage's table, one step per instrument and per kind of piece, in plain, everyday words and short sentences, each step in three beats: *what it is* (what you can see on the table), *what to do with it* (the exact drag, tap or key), and *what it tells you* (what you will see happen). A step that is vague, that uses a word in a special sense, or that a first-time student could not follow with the tool in front of them is a defect. It never says which move solves the stage, and never uses a word the quest has not earned. Every sentence earns its place: a line a student would not miss is cut, and the Tour replaces a bench's stage briefing (a briefing survives only on a boss, where it states the fight's rule). A step must also say what an action is for (what a mark, a slot or a key does to the answer), never only how to perform it. It is built from the table itself (`table/tour.js`), so a new tool cannot arrive without its words; a bare call shows only what this player has not met, and what is true of every table (how to move pieces, Undo, Submit) is said once in the whole game. **Nothing is ever repeated:** the Tour key replays only the tools on the stage in front of the player, never the general lines. It works at `3D Off`. A tool with no Tour step is a defect (`verify:table`).
19. **What the player discovers, they get to hold.** When a stage's idea is how something is built (an atom's nucleus and shells, an ion, isotopes, a molecule), its reward card carries a solid 3D model of it, built from the numbers the player just worked with (`reward.model`, `model-parts.js`), that turns by dragging; at `3D Off` the same parts are drawn flat. The model is honest (every proton, neutron and electron is a counted one, and a scale shortcut is said under it), never decoration. More 3D models, visualizations and assets are added wherever a bench or a reward is about shape or position, not only where it is easy. A model that only spins an idle molecule and explains nothing is removed.
20. **The story is the investigation, told in the player's own words.** Every bench carries one thread of the case against the Fifth: a question Vess is trying to answer (a lead line on its first stage, in plain words), the evidence the bench itself produces, and one line *filed to the case* when the quest ends that moves the investigation on (`Filed: ...`) and that the next bench picks up. Story copy uses only words the quest has already earned, no jargon, no atmosphere, no invented number or event the bench did not measure, and nothing that restates the lesson. If a line would read the same with the story removed, or needs a term the player has not met, it is cut. `verify:story` holds the vocabulary and the filed line.
21. **Discover it, never read it off.** A stage never asks the player to report what the bench already shows in plain sight (sorting discs by a printed +, ticking what is labelled). The thing under study starts hidden, and the player finds it out with an instrument: charged plates bend the specks that carry a charge, a beam shows what is inside a foil, a needle reads a charge, a balance weighs. If a student could answer by looking at the table, the stage is rebuilt around an experiment (`q2-core` stage 3 is the model: nine identical specks, a pair of charged plates, and a sort by what happened).
22. **A quest ends on one story animation, and it is Vess's debrief.** When the player clears a quest's last stage, a short scene (three to five lines of Vess) reviews the ideas the quest worked out, each said over the picture that shows it, and ends on the line filed to the case (principle 20), so it both consolidates the lesson and moves the investigation on: the Fifth, the rumour of alchemy, the Case File. It replaces the debrief card, plays on every completion, is paced by the player (Next, Back, Skip), never interrupts a stage or sits before one, and is drawn from the bench's own numbers on a 2D canvas, so `3D Off` and reduced motion lose nothing (they show each line's last frame). `quest-story.js` holds it and `verify:story` counts it. Fifty are built, one for every quest of the six walkable worlds: Tallow 7, Lanternfall 10, Ligar 10, Bellows 7, Ember Reach 8 and Mirrowen 8. Kettle has none yet and ends on its debrief card.

## Hint ladder

Learn track: exactly three rungs, one sentence each. 1 = what to do with the tool, 2 = what to look at or compare, 3 = the method or structure, never the answer or the arithmetic. Rung 1 is free, rung 2 comes after a miss or 45 s, rung 3 after two misses. Rung 1 names the control, not the move; where a control needs explaining that explanation also lives on the object (principle 2). A predict stage has no tool, so all three of its rungs spend themselves on the science.

Campaign (Charge Gardens): `[nudge, narrow, solution]`. The third rung shows the move on purpose, because the campaign pays XP and a stuck player must never be locked out; using it only resets the display-only CLEAN counter, which pays nothing. This is the one place the two roads differ.

## Positioning

A chemistry course often lectures abstractly before students touch an instrument. Avalon grounds the subject in instruments: students investigate chemical phenomena on working benches, guided from stage one by plain objectives and the real vocabulary as they earn it. It is also a competition with a real social frame: four guilds, normalized team leaderboards, a shared season and a quartermaster who talks to you in character.

## Operating Context

- **Lifecycle: pre-launch.** No real student accounts, XP or progress exist yet. Data shapes and flows are still free to change; that freedom ends at launch.
- **Where it is played:** phones and school laptops, at meetings, at showcase nights and between sessions. Phone play is a primary case, not an afterthought.
- **The season frame:** students register (or continue as guest), pick a guild with live slot counts, and work through the campaign (`#/quest`) and the study road (`#/learn`).
- **Officer rituals:** live copy edits land in the Google Sheet without a redeploy; `docs/runbook.md` is the showcase-night reference.
- **Stack:** Vite + Three.js client, DOM UI over one persistent WebGL canvas; a Vercel Node proxy that does scrypt password derivation and rate limiting; a Google Apps Script web app over a Google Sheet of seven tabs (the rest of the old tab list is code constants).
- **Graphics:** two settings. `3D On` (T4, default) walks the ship and the worlds and builds each bench in the world; `3D Off` (T1, no WebGL needed) draws the same tabletops on a canvas and the same stage on the same payload contract. A phone is not disqualified from `3D On`.

## Capabilities and Constraints

<!-- facts: worlds=14 built_worlds=7 quests=59 benches=52 bosses=7 stages=408 -->

- **Campaign: Quest 1, The Charge Gardens of Erebus.** 20 stages, 650 XP, a scan → compare → commit loop, physically honest 3D reaction animations, a chemistry card after every solve and an epilogue that gathers the terminology into a debrief.
- **Learn track:** fourteen worlds in road order: Tallow (atoms, the table, the mole), Lanternfall (light, orbitals, trends), Ligar (bonding), Bellows (gases), Ember Reach (thermodynamics), Mirrowen (states of matter), Kettle (stoichiometry and reactions), Teeter (equilibrium), Verdigris (acids and bases), Brinewire (electrochemistry), Quicklight (kinetics), Lodestone (transition metals), Thornmere (organic) and Cinder Halo (nuclear). **Seven are built**: Tallow (6 benches + the Hopper), Lanternfall (9 + the Eater), Ligar (9 + the Warden), Bellows (6 + the Compressor), Ember Reach (7 + the Crucible), Mirrowen (7 + the Undertow) and Kettle (8 benches + the Golem). That is **59 quest modules: 52 benches and 7 bosses, 408 stages**. Every built world is open from the start; inside a world, quest N opens when N−1 is complete. The other seven are charted only and hold nothing shut.
- **Walkable worlds:** Tallow, Lanternfall, Ligar, Bellows, Ember Reach, Mirrowen and Kettle. Every built quest is a tabletop; at `3D On` the camera leans in over the plate.
- **The Drill Deck holds practice in one place.** Every bench problem and every end-of-world question (the question bank, one JSON file per world), asked in rounds (a Daily Set, a Quick Run, a Timed Round, Weak Spots) with stars, a **weekly** streak, per-world mastery tiers and a few cosmetic commendations. Each bench also asks two problems after its debrief, and offers a guided worked problem on computational benches. Optional and skippable at every point; pays no XP, never reaches Standings, gates nothing. A 2D screen on every setting.
- **The story is kept in the Case File's Notebook.** Every briefing, transmission and piece of evidence files itself there as it is seen.
- **A player's record follows them.** Everything a player has done that is not XP is held in the Google Sheet as the master copy and mirrored in localStorage, which the game plays from so nothing waits on the network. Guest mode saves locally only and never reaches the Sheet.
- **Grading is local and instant.** The browser grades at 0 ms; the server call is fire-and-forget.
- **Fairness rules that are product facts:** XP is paid once per stage, flat with no attempt multiplier; hints cost nothing; completion is idempotent; progress never regresses; a finished quest replays free.
- **Stage controls today:** `Tour`, `Findings`, `Hint`, `Submit`, `Undo`, `Start Over`, `Hide Panel` and `Leave Bench`. A control that does nothing fails `verify:learn`.
- **Device floor: 375 px wide.** Screens outside a bench or a world (landing, login, register, onboarding, bridge, Standings, Inventory, Crew, Settings, Drill Deck, Case File, Star Map) must work in portrait at 375 px. Benches and worlds on a phone may require landscape: game mode locks orientation and shows `#orientation-guard` in portrait, and terminals, Star Map and Standings read edge to edge in the glass in either orientation.
- **Not established:** no formal accessibility standard (WCAG level, keyboard-only operation, screen-reader support) has been set; `prefers-reduced-motion` is honoured in `ui/cinematic.js` but is not a stated bar. Future work must not claim compliance that was never agreed.
- **Not established:** season length and start date, roster size, guild slot cap beyond the default of 12, what fills a level curve from one campaign quest, and whether more campaign quests ship in the first season.

## Brand Commitments

- **Name:** Avalon. The four guilds are Mineral Mining (Earth), Atmospheric Harvesters (Air), Thermal Smelters (Fire), Moisture Extraction (Water), shown as two-letter mono designators MM / AH / TS / ME.
- **The aesthetic is binding:** "SCOURED PLATE", hardware that has been in the dust for forty years and still works. Its rules are in `CLAUDE.md`, `DESIGN.md` and `src/styles/tokens.css`. Future visual work extends it.
- **Voice:** diegetic. Vess the quartermaster, pylon communications, guild pitches and mission logs are characters speaking, never a product describing itself. Story copy lives in `src/story/` and uses clear chemistry terms without invented ciphers.

## Evidence on Hand

- A playable campaign and 59 built Learn quests. `npm run verify` runs the check scripts in `package.json`, several of which build a real world in Node and measure it (nothing may occupy the same space as anything else, no screen may hang off the edge of the glass, the chamber console may not cover more than a quarter of the view) and `verify:docs` holds this file's counts to the curriculum registry.
- Baked media: mapped loops and cinematics with WebM, MP4, posters and captions, plus static SVG backdrops for `3D Off` and environment stills under `/art/`.
- Written plans under `docs/plans/`, the quest design doc `docs/quests/q1-charge-gardens.md` and an officer runbook at `docs/runbook.md`.
- Per-world audits of the five walkable Learn worlds (Oct 28 and 29, 2026), with their evidence of what was played, are kept in `docs/archive/2026-10-29/`; their decisions and pitfalls are in "Building a Learn world" below. `docs/AP-coverage-audit.md` maps every AP topic to a quest.
- Code retired but kept lives under `archive/` and is not built.
- **Absences future work must not fabricate:** there are no students, no play data, no testimonials, no screenshots of real use, no press and no institutional endorsement. The product has never been in a student's hands. The owner is the only play tester; agents do not browser-test unless the owner asks for it in that task.

## Accessibility & Inclusion

The one confirmed requirement is the **375 px phone floor** (portrait for non-bench screens, see above). Beyond that no formal accessibility standard exists. `3D Off` exists so that a student on hardware with no WebGL can solve every stage. A keyboard, screen-reader or reduced-motion bar would be a new decision, not an existing one.

---

# Building a Learn world

Read this whole section before writing a world. It is what five worlds (Tallow, Lanternfall, Ligar, Bellows, Ember Reach) taught the project in October 2026, after each had been built once and then audited stage by stage. Almost every rule below exists because a built stage broke it. `CLAUDE.md` holds the hard rules and commands; `docs/engineering/engine-and-worlds.md` holds how things are built and the per-world build records. The prompt that runs this section end to end, for an agent building a whole world, is `docs/world-build-prompt.md`; `docs/original-prompt.md` is the older prompt for auditing one built world. Where this section and an older plan in `docs/plans/` disagree, this section wins (`docs/plans/learn-quests.md` was reconciled with it on 2026-10-29; the old `Nudge / Narrow it down / Show the move` hint labels are retired).

## 1. What a world has to achieve

**Curriculum target.** Every world is checked against the AP Chemistry Course and Exam Description (CED). Before writing a stage, list every CED topic of the unit and assign each to a bench and a stage; a topic with no stage is logged as a gap, never silently dropped (`docs/AP-coverage-audit.md` is the cross-world map, and records the gaps found so far). The audience is still a 12 to 17 year old who may know no chemistry, so:

- **Quantity as well as quality.** Every one of the five first builds covered the qualitative side of a topic and skipped the quantitative side the AP asks for (Coulomb's law with numbers, formal charge as arithmetic, c = λν, E = hν, PV = nRT with units, q = mcΔT, ΔG = ΔH − TΔS). Any CED topic that is a calculation needs at least one stage where the player produces the number (section 4, "The quantity ramp").
- **Beyond the exam** (molecular orbitals, quantum numbers, the Cr/Cu exceptions, Graham's law, van der Waals) is taught only as a stage that says so on its card, is marked `optional: true` in the chart, and is kept out of AP-style practice unless labelled there too. Content that is on the CED but past a first course (photoelectron spectroscopy, hybridization, Gibbs free energy) says so on the bench. The chart does not yet carry `optional` for those (see "Open decisions").
- **Do not claim exam readiness.** The world teaches the topics; nothing in the interface says it prepares anyone for the exam.

**Shape.** A world is six to nine benches in teaching order plus one boss.

- **Stages per bench: 8 is the norm, 6 where a bench is a recap** (the road plan's decision, `docs/plans/learn-quests.md`). Reach the number by adding distinct ideas (a worked figure, a new case of the idea, an extension past the dial's range), never by padding. A stage that merely repeats another is cut; an application of an idea to a *new case* is not a repeat (an audit once recommended cutting two such stages and was overruled). The built worlds sit below this norm in places (Lanternfall benches are 5 to 7 stages and its check caps at 7; Ember Reach's check allows 3 to 8; some Tallow benches run 10 to 13). A new world's verify script must allow 6 to 8, and raising an existing world's cap must not break another world.
- **Each bench is one instrument family and one thread of ideas.** An idea is discovered, named on a reward card, and used on the next stage ("discover, name, use, inside two stages"). Stage 8 of a bench is normally a **sealed sample**: the whole bench's ideas at once, nothing labelled.
- **The boss has five phases that re-test earlier benches' ideas on a new case.** A phase never introduces a concept. A boss phase that repeats a bench stage verbatim is replaced with a combined or extended case (Bellows' phases 2 to 4 were).
- **Dependencies between worlds are explicit.** Worlds are open from the start, so a player can arrive out of order. Each quest exports `BUILDS_ON` (real built quests) and uses no word earned in another world without listing it. When a world needs an idea a later world teaches (Ember Reach needs balanced equations from Kettle), the world supplies the input already balanced and earns the one needed idea locally on a reward card.

## 2. What a whole world is made of

A world is not only quests. The wiring for a new one is about fifty files; the reliable way to find them all is to use the most recent world as the template and grep for its id (`grep -rIlE "unit05|ember" src tools` finds every file Ember Reach touches). Groups:

| Group | What | Where |
| --- | --- | --- |
| Registry | The chart (id, title, one-line descriptor, `arena`, `stageCount`, `status`, `module`, `optional`), world registration, walkable-world entry, question bank | `src/learn/worlds/unitNN-*.js`, `curriculum.js`, `worlds3d.js`, `bank.js`, `src/learn/bank/<unit>.json` |
| Quests | One module per bench and one for the boss | `src/learn/quests/<unit>/` (copy `src/learn/quests/_template.js`) |
| Table kit | Pieces, fixtures, planners (pure; shared by the drawn and built twins), 2D painters, 3D solids, tool and fixture Tour words, reward model parts | `table/kits/<kit>*.js`, `engine/<kit>-props.js`, `engine/<kit>-solids.js`, `kits/registry.js`, `kits/index.js`, `engine/instruments.js`, `table/tour*.js`, `engine/model-parts*.js` |
| Story | Lead lines, Vess's debrief for every quest, painters, the world's saga, the boss finale | `engine/stage-story.js`, `story/quest-story.js`, `story/saga.js`, `ui/story-scenes-<world>.js` (+ `-mech`), `ui/story-scenes-finales.js` |
| Boss | Arena spot, articulated body, foe planner | `engine/boss-arena.js`, `engine/boss-models.js`, `engine/foes.js` |
| 3D world | Terrain, atmosphere, hosts (each bench is built into its world's machinery), site layout generated by a script into JSON, textures, voyage and stage hooks | `src/three/<world>.js`, `src/three/<world>/`, `src/three/world-data/<world>.json`, `tools/gen-<world>-layout.mjs`, `src/three/materials/<world>-textures.js`, `src/three/stage.js`, `src/three/voyage.js` |
| Player-facing lists | Field Manual road, galaxy map, commendations, requisitions, learn styles | `ui/field-manual.js`, `ui/galaxy-map.js`, `progression/commendations.js`, `progression/requisitions.js`, `src/styles/learn.css` |
| Checks | The world's own verify script, its Learn checks, entries in the shared verify lists, the `npm run verify` chain, the facts line below | `tools/verify-<world>.mjs`, `tools/lib/<world>-learn-checks.mjs`, `verify-learn.mjs`, `verify-story.mjs`, `verify-arena.mjs`, `verify-bench.mjs`, `verify-voyage.mjs`, `package.json`, the facts comment in this file |

- **Prefer stages over benches once a world exists.** A new bench inside a built world needs a site in the layout generator, its JSON, a host, and about ten wiring files, and cannot be checked without walking to it. Ligar chose to add alloys, five-domain shapes and formal charge as stages on the benches they belonged to, and every one of those landed safely.
- **Every bench is part of its world's machinery** and is checked from the lean-in view: the bay envelope stays clear, hills are never climbed, only lamps are lit. These rules are in `engine-and-worlds.md`; the world's verify script measures them.
- **A world without ground yet (Kettle)** builds its bench in its own room at `3D On`. Ship it that way rather than blocking the quests on terrain.

## 3. What a bench module has to be

A bench is `src/learn/quests/<unit>/<id>.js`, copied from `_template.js`.

- **Exports:** `meta.stageCount`, `STAGES`, `SOLUTIONS` and `MISSES` (scripts that `verify:learn` and `verify:table` replay through the real action path, drag and two taps), `stateFor`, `mount(container, ctx)` returning `{dispose}`, `VOCABULARY` (each term mapped to the stage whose reward card defines it), `BUILDS_ON`. It exports no `PRACTICE` and never touches XP (`addXp`, `gradeStage`, `completeQuest`, `recordProgress` fail the build).
- **A stage** is `{ id, title, prompt, table, hints[3], check(state), reward }` plus, where it applies, `predict: true`, `entry: { id, label, unit }` (a typed figure; `entryNumber` reads it; `entrySigned` for a percentage error that may be negative), a widget, and how-to notes (`applyNotes`). `check` returns `{ ok }`, `{ ok: false, notYet: true, msg }` for a blank bench, or `{ ok: false, msg }` naming what the table shows.
- **Prompt:** one sentence, at most 25 words, no "!", states the objective and never the route (`Pick the element in the sealed tube`, not a strip-and-sample recipe). A prompt or hint that names a control quotes it: `Press "Fire Beam"`.
- **Hints:** three rungs, one sentence each (see Hint ladder). **Reward:** one to three sentences naming the idea in real terms, kept to about 45 words; a longer second sentence is clipped by the frame (`clampSentences`).
- **Planners are pure and shared.** Every reading comes from one function the drawn and the built twin both call, from real data (`thermodata.js`, the Ligar molecule table, `gasdata.js`), so a stage grades identically at `3D On` and `3D Off`. `verify:learn` recomputes every number the quest relies on.
- **A lead line** (`stage-story.js`, one sentence of at most 20 words, on a bench's first stage, never on a boss) states the stake at the bench in earned words.
- **Question bank:** exactly two problems after the debrief for each bench, plus (where the bench is computational) one guided worked problem of 4 to 8 steps whose number steps carry a `calc` the checker recomputes. Ids (`<quest>#<n>`, `#b1`, `#b2`, `#w`) are never reused or renumbered because mastery is stored by id.
- **Story animation:** three to five beats of Vess (two sentences, 36 words at most), each said over the picture that shows it, and a `Filed:` line. A scene shows the mechanism and every number on screen is counted or measured from the drawn thing. New worlds add themselves to `verify:story`'s required list.
- **Tour:** every new kind of piece, tool or fixture gets its words in the world's tour file or `verify:table` fails.
- **A boss** declares `encounter {species, act, intent, hit?, counter?, moves?}` per phase. Foes come only from `planFoe()`, map one-to-one onto the stage's samples, have no lead line, and stand clear of the answer slot (a boss answer slot sits outside the foe's corner).

## 4. How to design a stage

1. **Start from the wrong idea the player brings, and put it on the table.** Each bench has one click: a stage whose answer contradicts a common model. The model must be one students actually hold (the gold-foil stage first offered "hollow shell", which nobody believes; the real wrong model, charge spread evenly, is a card). Wrong models become cards, dial labels or traps: a Celsius-doubling card, a "heavier fills more" card, a thermometer that reads low, a 1200 °C card. Slips a student makes (Celsius as kelvin, a factor of ten, the nearest reference) are kept as `*_CARDS` and the verify scripts check the stage refuses each one.
2. **Discover with an instrument; do not read it off.** The property under study starts hidden and a tool reveals it. Compare at least two readings. A sort has at least three or four cases and one that fails for the common misconception; two samples in two trays is a 50 % guess.
3. **Predict, then test, on the click and on a new case.** The predict stage holds only the question and the guesses; the next stage quotes the locked guess in its prompt and reward. Detectors and counters keep every hit across firings so a rare event builds up instead of being one flash.
4. **The quantity ramp** (the Brilliant pattern, and the one the audits kept coming back to). For every calculation: a concrete picture; a prediction before any arithmetic; proportional reasoning ("double this, what happens to that?") before the formula; the formula only as shorthand for something already understood, printed on a plate when the stage needs a constant; friendly numbers first and realistic values later; then **a figure beyond the dial's range** that has to be typed (the worked-figure stage: `entry`, `typed('ans', '1660')` in a script); units and sanity checks as part of play; and wrong answers that cost something visible. A typed stage needs a picture behind it: a bench that is only a plate and a number box ("plate-and-type") was flagged weak in every world.
5. **Wrong answers speak.** A miss names what the table shows that disagrees ("Tray 1 holds two kinds of atom", "the bath warmed 15.8 °C from 0.05 mol"), never the reasoning and never the answer. A boss miss reason is on screen before the foe answers.
6. **Operating help goes on the object, science goes in the hints.** Captions, notes and legends say how a tool works and how to answer; hint rung 1 names the control; rungs 2 and 3 are science.
7. **Mark the hard.** Beyond-exam and past-first-course stages say so on the card and bench.
8. **Accuracy.** Simplify freely; say nothing false. Where a kit encodes a simplification, say it under the model or on the bench, and check before promising a stage the kit cannot show (the Lanternfall energy ladder puts 4s below 3d for every atom, so Fe³⁺ is stated in a reward and not built; the cup's mixing temperature ignores the cup's own heat capacity; the atom widths on the alloy stage are empirical radii).

**Stage anti-patterns found in the first builds** (each one was a real stage, and each was rewritten):

- a sort of printed facts into trays; a rank that ends in a lookup of earlier readings;
- copying a number from a gauge or plate into a marker; "type the angle you measured";
- hunting a dial or heater setting until a lamp lights or a number goes green, or a dial with a setting exactly at the answer (remove that setting and ask for a typed figure, or print the constants and ask for the computed value);
- plug-and-chug with the formula, the numbers and the answer's unit all printed;
- a stage that only shows a refusal (a double bond that will not turn) instead of making the player predict;
- a stage that reads a printed equation or two printed totals and subtracts: hide the totals and have the player add the chips;
- a bench with twelve things on it (view dial, marker dial, protractor, four arms and a hub; or twelve electron pours into a ladder);
- a fetch whose sample copies what the bench already holds, or any lock that stands in front of a correct answer.

## 5. Pitfalls ledger

Each row is a defect that was built, found and fixed. Do not build it again.

### Teaching leaks

| Pitfall | What happened | Rule |
| --- | --- | --- |
| A plate, header or readout prints the answer | "Listed 35.5" and "Listed 19.0" plates on three Tallow isotope stages; a rack header printing `UNPAIRED 2` on the boss stage that asks for that count; a rack printing `1s² 2s² 2p⁴` on the stage that asks for the notation; a common tank printing the share | Check every printed number against the stage's answer. Turn the readout off on that stage (`readout: false`, `hideTotals`, `hideValue`, hidden counters) and let the instrument be the evidence |
| A refusal states the rule | "A box takes at most one of each" on the stage that asks for the capacity | `verify:learn` only searches for the answer string. Also read every refusal for the discriminating feature, the capacity or the reasoning |
| A miss message gives the reasoning | "one holds dark carbon and pale sodium together, so it is in the wrong tray" | Name what the table shows that disagrees, or say nothing and let the table respond |
| Tray or rail names state the possible answers | "Mobile electrons", "Ions freed by melting", "No mobile charges" | Acceptable only when the evidence has been discovered; otherwise name the tray by what the player did or saw |
| A term is used before it is taught | Electronegativity used by Ligar's polarity bench (HCl, H–F) before any bench taught it; Ember Reach needing balanced equations that Kettle teaches later | `BUILDS_ON`, a local reward card that earns the word, and `WITHHELD_VOCAB` |
| The model offered is not the model students hold | Gold foil offered solid, hollow shell, tiny dense centre | Offer the idea students really have and contradict it |
| Stages that repeat | `q2-core` stage 7 repeated `q4-ledger` stage 5; Bellows boss phases 2 to 4 replayed three bench stages | Cut or fold; keep a stage only if it applies the idea to a new case |
| Story that does not touch the bench | Prompts carry no story; every sample is SAMPLE A/B/C | One stake per bench, a lead line, and evidence the bench itself measured |

### Operating the bench

| Pitfall | What happened | Rule |
| --- | --- | --- |
| Crowded rows cause accidental joins | Ligar pairs in one row: a drag landed Ne on Cl | Lay pairs in a grid at least 60 units apart so a drag toward a partner cannot reach a stranger |
| A dropped tool never joins a card | Cards of kind `nojoin` cannot be drop targets; `verify:table` joins by direct action and never saw it | Use the field variant where a tool must join (`molCard(..., { field: true })`) and check with a real drag |
| A missed grab throws the camera | A drag on empty plate swung the lean-in view until the table was out of sight | The lean-in swings about 8° and settles back; presses on empty plate must never move the player out of the lean |
| A drop beside a slot leaves the piece lying over the instrument | A tin dropped near the cup's mouth hid the RISE readout; a tall tank with its foot off the tray landed on the table | A drop whose pointer is over a place and whose centre is not goes in that place (shared rule in `gestures.js`; do not special-case it per stage) |
| Dials | A dragged knob stops a step short; a tap on the track sets nothing; a hit band too narrow fails a correct reading | Make hit bands tolerant of one step (Bellows widened one); the real-hand behaviour of the Lanternfall speed dial is unconfirmed |
| A tool laid on the plate vanishes | The protractor was a clear disc, invisible on the dark plate | Give every loose tool a visible body (brass disc) and a caption |
| Needed control is not mentioned | Arms behind a balloon need the Turn dial; nothing said so | The object's note says it |
| A control that reacts late | The field switch lagged, so a second click turned it back off | Show the new state at once or disable the control while it settles |
| Text a player must read is tiny | Painted words at 9 px on a tilted mat; recorder axes unreadable | Words are paint with a minimum size (`LABEL.min`); trend strips paint at 20 px; name axes with units; draw must-read text large |
| Black pane at bench entry | The world takes about 8 s to build and the pane is black | A "Building the bench" overlay holds until the table has elapsed; a screenshot taken sooner is not a defect |

### Rendering at `3D On`

| Pitfall | What happened | Rule |
| --- | --- | --- |
| `c.label(text, w, h)` takes metres | A 128 × 48 call made a 140 m plate that blacked out every orbital bench | Size labels in metres |
| An opaque slab over a painted display | The spectrophotometer's bezel hid the ABSORBANCE readout on five stages | Instrument cases and bezels are frames, never slabs; glazing is omitted where the sample well must stay open |
| Glass bodies lean over printed text | Cylinder names printed behind the tube; the sealed box stood over its gauges | Paint nothing within 7 units behind a cylinder tube, 18 behind the sealed box, 7 behind a pinhole chamber; a lone cylinder names itself in its panel title; tanks carry a tag facing the player |
| A lining plate hides painted contents | Spin arrows in the rack boxes were covered at `3D On` | A flat container that paints its contents on the mat takes no lining (`liningMat` is optional, `noJarFill`) |
| A pour leaves no trace | The fill slab sat behind the pan's wall | Any pour fills at least 0.018 m |
| A lens kept the old picture | Its 3D face depended on the dish under it and was rechecked only on the dragged piece | Recheck every lens signature until the piece stops easing |
| Painted words under 3D hardware | Knobs on the first letter of dial names; ladder numbers under rail posts; pan labels under the rim; rail end words under the first card | Dial names start 3.6 units in with a pitch of 7; ladder labels sit outside the posts; pan labels stand 1.7 units higher; a rail takes `labelLift` (opt-in) |
| Fonts | "O" read as "0" in the mono face; the font has no superscript minus | Use sans symbols for element letters and a true minus |
| Drawn contents off the puck | A stamped charge, a mark ring and lone pairs hidden by the puck, the far atom or the timber frame | Charges replace the electron count on the puck; lone pairs swing sideways; slate margins `SLATE_R + 5.5` sides and `+ 6` bottom |
| Heaps cover gauges | The proton and neutron heap lies at y 49 and 59 and hid the build gauges' scales | Put gauges at y 29 to 31 and keep them out of the foe's corner |
| Plots too small to read | Calibration and recorder plots about 100 px wide | Enlarge to 36 × 22 units or more and check against the right edge |
| Generic ball faces | The hub and arm read "X" and "A" | Name pieces in earned words ("Hub", "Arm") |
| An option object silently drops keys | `wells(...)` ignored the disc scale | Check that every option actually reaches the drawing |
| Disposal recursion | `Table3D.dispose()` called back into the stage and froze the router | Flag the table disposed before unmounting the scene |

### Wiring and process

| Pitfall | What happened | Rule |
| --- | --- | --- |
| A card prints two lines on one row | `q2-grip`: a molecule card's mass line and the probe's reading were drawn at the same height and overprinted | Give every line of a card a row of its own and size the card to the rows it can carry |
| A tray's cell is shorter than its card | `q2-grip` stage 8: the first card of each tray hid the tray's label | A tray's `cellH` is at least a card tall and the tray carries the label strip above its first card; where the table is too short, make the table taller (`bounds: { w: 150, h: 72 }`) |
| A rail's end label under a tall fixture | `q3-boil` stages 1 and 2: "Settles lowest" was cut off by the flask's lower edge | A rail beside a fixture lies below the fixture's bottom edge by a label's height; `verify:table` does not see it, a look at the lean-in view does |
| `toFixed` rounds a half down | 40.65 printed as 40.6 where the text said 40.7 | Add an epsilon (`(v + 1e-9).toFixed(1)`) wherever a data row ending in 5 is printed |
| A correct order refused for want of a pull | A rank that required every card to have been through the instrument | A correct answer is accepted at once; only a wrong one is told which card has not been read (as `q2-grip` stage 1 does) |
| Parallel builders share one function | Six benches were built at once on one kit | Give each bench its own file that registers its fixtures and pieces (`matter-registry.js`) and its own marker line in each shared list; no two builders then edit the same lines |
| The Escape key leaves a bench | While driving a bench by hand, Escape closed the quest and returned to the Learn list | Close a Tour or a modal with its own button; a deep link into a world's first bench opens the world's briefing first (dismiss it with Skip) |
| The stage count lives in five places | Quest `meta.stageCount`, the world chart, this file's facts line and sentence, and stage indices hard-coded in `verify-learn.mjs` | Update all five; inserting a stage shifts every later index, every `NOTES` key and the 1-based `LEAKS` keys |
| Question bank moved mid-pass | Seventeen bench-problem failures appeared while another agent moved `PRACTICE` to `bank/` | Quests export no `PRACTICE`; never reuse a bank id |
| `selectorFixture` answer cards | A dial whose start position is read as "not set" | Give it a trailing blank option as the start |
| Shared-engine change breaks other worlds | A global `labelLift` broke three other benches' layout checks | Make engine changes opt-in; after any shared change run every world's verify script |
| Full verify wipes `dist/` | `npm run verify` ends in `npm run build`, which empties `dist/`; the owner keeps reference art there | Copy anything that is not build output out first, and run the individual `verify:*` scripts during work |
| Several agents in one tree | Dev server reloads on every save; uncommitted files from other agents; `__LQ_TEST__` is lost on reload | Commit only your files; set the hook again after an edit |
| Scripted solutions pass while hands fail | `verify:table` replays scripted actions and cannot see a 3D pick, a camera drag or an unreadable label; all checks were green when the first audit found the game hard to operate | Treat green as necessary, never as understood; the owner's play is the judge |
| Stale templates and plans | `_template.js` and `docs/plans/learn-quests.md` still described encounter-first combat design | This file is the source of truth; the template was rewritten on 2026-10-29 |
| Copy in several places | The Quest 1 epilogue lives in three files; PRODUCT.md once listed its rules twice | One source for each piece of copy; one list of principles |
| Doc counts drift | PRODUCT.md said 31 benches while 38 existed | `verify:docs` holds counts, retired wording and every rooted file path named in the live docs |

## 6. Verifying a world

Run these after every change, each as its own `npm run verify:<name>`: `learn` (registry, no XP, grading tables recomputed from real data, plates drawn in Node, hint, prompt, legend and leak rules), `table` (layout overlap, Tour coverage, predict-first, models, drag and two-tap replay), `story`, `docs`, the world's own script (`tallow`, `lanternfall`, `ligar`, `bellows`, `ember`: it builds the real world in Node and measures overlap, walkability, lamps), and `bench` (real pointer paths at six aspects). After a change to shared code run all five world scripts.

- **No browser testing by default.** The owner plays. An agent may write a Playwright or Node script as a scratch aid, but it is never a gate or a definition of done. Hand testing by an agent happens only when the owner asks for it in that task.
- **When the owner does ask for a play pass,** the set-up that works: `npm run dev -- --port 3011 --strictPort`; Continue as Guest (or `session.startGuest()`), join a guild, skip cinematics; unlock the world's quests with `session.markLearnQuestComplete(unit, id)` for each id; set the hash to `#/learn/<unit>/<quest>` and **reload** (a deep link otherwise flies the ship first); set `globalThis.__LQ_TEST__ = { runner: r => { window.__R = r } }`, change the hash to another quest and back, then `window.__R.loadStage(i)` (0-based) jumps to a stage. The pane is small (zoom to read labels); a bench takes 10 to 40 s to appear; the browser tool's synthetic drag ends short of its target, so it cannot prove a dial or a drop; a drag in progress eases the camera so a second drag from a stale screenshot misses.
- **A boss reward card over the bench** just after a stage clears is the camera looking up at the foe, not a defect.

## 7. Auditing a world

The audits that produced this section followed one protocol, worth repeating for a new world:

1. Per stage, record **Operable** (could a real hand do it, does it read at the default camera, is the console clean), **Intuitive** (does a first-timer know what to do and what happened), **Busywork** (does the task carry an idea or is it matching, copying, hunting), **Builds intuition** (does the picture make the idea necessary), **Accurate**, and **AP topic**.
2. Label the evidence honestly: **Played** (real pointer gestures, typed answers, Submit), **Viewed** (loaded and screenshotted), **Scripted** (a scripted solution, which shows what the bench draws solved, not that a hand can do it), **Bench** (`verify:bench` solved it by pointer path), **Code** (read only). An audit that rates a bench from one stage's layout is a failed audit; say what was and was not played, and list what only the owner can judge (confusion, pacing, phone legibility).
3. Fix in this order: blocking operability, teaching quality of weak stages, quantitative depth, missing concepts. Replay every changed stage afterward. Run up to three passes, log anything left, and update stage counts everywhere (section 5).
4. Save to `docs/<world>-audit.md`: per-stage table, AP coverage table, a work log that is kept current, and a "still open" list.

## 8. Status of the built worlds

Counts are 408 stages in 59 quests. Every stage of every world has been loaded and solved by script at least once. Hand play by a real gesture is partial everywhere, and in no world has a student played it.

| World | Built | Known open items |
| --- | --- | --- |
| Tallow (`unit01`) | 6 benches + Hopper; AP Unit 1 | Plate-and-type weakness on the isotope and mole benches' last stages (a mass spectrum read as a graph; formula stages); every stage not hand-played is owed a real-hand check; whether q1 to q4 gestures survive a trackpad or a phone |
| Lanternfall (`unit02`) | 9 benches + Eater; AP 1.5 to 1.7, 3.11 to 3.13 | Joystick title clipped on `q4-cloud` stage 5; the boss's calibration plot is small; the `q1-wave` speed dial by a real hand is unconfirmed; transition-metal ions (Fe³⁺) cannot be built on the one ladder; `q9-absorb` stages 4 and 5 and the boss phases never solved by a hand |
| Ligar (`unit03`) | 9 benches + Warden; AP 2.1 to 2.7 | Protractor drag by a hand is unconfirmed; many stages never gesture-played (`q5`, `q6`, `q7`, `q8`, `q9`, the Warden's phases 2 to 5); carbonate resonance is practice-only by decision; no numeric lattice energy, no bond-enthalpy sums (Ember), intermolecular forces are Mirrowen's |
| Bellows (`unit04`) | 6 benches + Compressor; AP 3.4 to 3.6 | `q6` stage 3 and boss phase 4 are searches over five heater settings (real-gas behaviour cannot be worked on paper); error stages cover two kinds of slip only; the manometer is painted with no 3D body and only the open tube; gas over water stops at the vapour correction (moles of product are Kettle's); phone-size legibility unchecked |
| Ember Reach (`unit05`) | 7 benches + Crucible; AP 6.1 to 6.9, 9.1 to 9.3 | Two-term ice arithmetic may be heavy for a first calorimetry bench; `q7` stages 2, 5 and the boss's last phase hunt a dial after the sign changes; no heating curve or vaporisation; AP 9.4 and 9.5 wait for the kinetics and equilibrium worlds; a seated tin can cover the cup's RISE readout |
| Mirrowen (`unit06`) | 7 benches + Undertow; AP 3.1 to 3.3, 3.7 to 3.10, 6.5, 6.1.A.4, 6.4.A.7 | Built by scripted checks and by pointer paths (`verify:bench` solves every stage at seven viewports by drag and by two taps); **only `q2-grip` stages 1 to 4 were played by a hand**, the rest were viewed or scripted (`docs/mirrowen-audit.md`). Mass percent is one end-set problem, with no stage (`q6`); `q3` stages 1 and 2 are both ranks on one flask; `q1` stage 7 is close to plate-and-type; the chromatography strip and the still are simulations (the benches say so); the glass melt trace is a smooth curve between two real fixed points; nothing was seen at 375 px; the world (sky, water, ice, the crawler) was built and measured in Node and seen only through the benches' hosts; biomolecules and polymers (3.1.A.5, 3.2.A.7) are bank problems only |
| Kettle (`unit07`) | 8 benches + Golem; AP 4.1 to 4.9 | Built by scripted checks and by pointer paths (`verify:bench` solves every stage at seven viewports by drag and by two taps); only early `q6` stages played by hand before browser testing stopped on instruction; remaining hand play listed in `docs/kettle-audit.md` |

**Only the owner can judge:** whether the typed worked-figure stages feel like understanding or like arithmetic for a 12-year-old; whether the slip cards are too obvious; whether any bench is still crowded; the feel of the 3D camera and the dials under a real mouse or finger; whether tags, plates and text are large enough at 375 px landscape; pacing across a world; whether the answer-dial stages read as a choice of figures or as a guessing game.

## 9. Open decisions

- **Optional marking on the chart.** `optional: true` is used only for `q9-orbitals`. `q5-numbers` is "beyond the exam" in its copy but not in the chart; `q7-pes`, `q8-hybrid` and `q7-gibbs` go past a first course and are not marked. Which of these become `optional` is not settled.
- **Stage-count targets for built worlds.** Section 1 sets 8 (or 6) for new work; whether to grow the 4 to 6 stage benches of Bellows and Ember Reach to the norm, or leave them, is not settled.
- **Per-world AP gaps** are tracked in `docs/AP-coverage-audit.md`.

## 10. Decisions already made

| Date | Decision |
| --- | --- |
| 2026-10-10 | Every built world is open; quests inside a world open in order. World ids follow road order. AP scope plus molecular orbitals, quantum numbers and the Cr/Cu exceptions, taught and labelled beyond the exam. The mole moved to Tallow. Electrochemistry is its own world. |
| 2026-10-22 | Bosses fight and ordinary stages are trials; foes are dispersed. One age band for the whole game, 12 to 17. The competition at launch is Quest 1 only. Retired features are archived under `archive/`, never deleted. Play testing stays with the owner. The Drill Deck streak is weekly. |
| 2026-10-22 and 23 | Operating help sits on the object and the Tour; hints spend rungs 2 and 3 on science. A prediction is asked on each bench's click stage and on a new case. A field fetch must bring new evidence. Miss messages name what the table shows. Flat things are drawn flat and spatial things are 3D. |
| 2026-10-28 and 29 | Quantitative content follows the quantity ramp and ends in a typed worked figure. Sorts that end in a lookup and hunts for a dial value are rebuilt as reasoning stages. Carbonate resonance stays practice-only. Ligar and others prefer new stages over new benches. Stage norm is 8 (6 for a recap), taken from the road plan. AP is the coverage target and beyond-exam content is labelled. |
