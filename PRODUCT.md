# Product

<!-- impeccable:product-schema 1 -->

The previous version of this file is kept in `docs/archive/2026-10-22/PRODUCT.md`.

## Platform

web

## Users

One audience, one text register: **middle- and high-school students, ages 12 to 17**, who join for the competition, the story or their guild. Many have taken no chemistry course. Every stage, objective and concept is written for that reader: plain words, real chemistry terms once they are earned, rigorous and never condescending. Where a bench goes past what a first course covers (photoelectron spectroscopy, hybridization, Gibbs energy), it says so on the bench and stays optional.

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
6. **Trials, not combat.** An ordinary stage is a trial: a wrong answer is a missed trial with a reason, never an attack, and progress is never lost. **Only the six bosses fight**, and they are the one place foes, a health bar and Integrity appear. A foe only observes and is *dispersed, never killed*; scouting is free, only a committed miss costs one of three Integrity, a correct commit wins at any Integrity, and a reset keeps every reading and open hint. Foes come from the instrument's own planner and carry evidence (the deletion test: delete the foe and the stage must change). Real-time reflex challenges are rejected.
7. **The chemistry arrives after the work.** Every stage ends on a reward card (one to three sentences) that names, in real terms, the idea just worked out. Copy around it stays plain; the card is where the vocabulary lands.
8. **Chemistry solves story problems, not the reverse.** The story hands the player a practical problem (an alloyed ore, an unbalanced life-support mix) that the chemistry they discovered solves. No arbitrary sci-fi puzzle gets chemistry retrofitted onto it.
9. **Physical intuition over jargon.** Organic reactions teach mechanism (opposite charges attract, limited bond seats, crowding blocks a path, leaving pieces clear seats), not college nomenclature (alkyl halide, SN1/SN2).
10. **Show space as space, flat things flat.** Where shape or position is the idea (orbitals, molecular shape, lattices, scattering) the 3D object itself is the instrument, and at `3D On` the bench stands it up as solid parts (a foil in the beam, a source block, a lattice) rather than relying on a flat picture lying on the mat. A bench whose idea is spatial and that only draws a 2D picture is unfinished. Spectra, graphs and plots are drawn flat, square-on or as a 2D panel. Either way the picture is honest: what is drawn is what is graded, and `3D Off` draws the same picture on the canvas.
11. **Learning must never become grinding.** The study road pays no XP and never touches Standings; hints are free; a replay costs and earns nothing; practice is optional, skippable and gates nothing; streaks are weekly, never daily.
12. **Operating the bench is easier than the chemistry.** A first-time player can operate every tool from what is on the table, answer without hunting for Submit, undo any mistake where it was made (Undo, Start Over), and leave a bench at any point (Leave Bench, the nav keys). Show a control only on the stages that use it.
13. **Critical text only.** The interface does not advertise itself. Text exists to direct, instruct, teach or tell the story: functional labels, rules, errors, taught content, character speech. No decorative sci-fi noise, `//` markers, fake status readouts or ceremonial titles, and no cryptic terseness on essential instructions.
14. **An instrument never invents a reading.** A screen that claims to be telemetry shows what was measured or says it has none. This is a pre-launch product and a plausible number in place of a missing one is the easiest lie to ship.
15. **A place the player is told to look at is never blacked out.** At a bench built in the world, the transmission docks to one side at a readable width and the scrim goes to a veil. No modal precedes a stage.
16. **The floor is a student who knows nothing and is holding a phone.** Low-end hardware and 375 px are the design target, not a degraded mode.
17. **NEVER have too many things going on.** A stage asks for one decision at a time, and what is on the bench at once is what that decision needs and nothing else: one question, a small set of pieces (a few cards, a slot, an instrument and its one key), no second task stacked on the first, no extra readout, strip, label or angle that the answer does not use. When a stage feels crowded the fix is to remove, never to explain. A stage that adds a prediction, a strip and a model choice together has three tasks and is cut to one. The owner's play judges it; a crowded bench is a defect even when every check is green.
18. **The Tour explains every tool.** The Tour key (and a stage-one briefing) walks the player through what is on the stage's table, one step per instrument and per kind of piece, in plain, everyday words and short sentences, each step in three beats: *what it is* (what you can see on the table), *what to do with it* (the exact drag, tap or key), and *what it tells you* (what you will see happen). A step that is vague, that uses a word in a special sense, or that a first-time student could not follow with the tool in front of them is a defect. It never says which move solves the stage, and never uses a word the quest has not earned. Every sentence earns its place: a line a student would not miss is cut, and the Tour replaces a bench's stage briefing (a briefing survives only on a boss, where it states the fight's rule). A step must also say what an action is for (what a mark, a slot or a key does to the answer), never only how to perform it. It is built from the table itself (`table/tour.js`), so a new tool cannot arrive without its words; a bare call shows only what this player has not met, and what is true of every table (how to move pieces, Undo, Submit) is said once in the whole game. **Nothing is ever repeated:** the Tour key replays only the tools on the stage in front of the player, never the general lines. It works at `3D Off`. A tool with no Tour step is a defect (`verify:table`).
19. **What the player discovers, they get to hold.** When a stage's idea is how something is built (an atom's nucleus and shells, an ion, isotopes, a molecule), its reward card carries a solid 3D model of it, built from the numbers the player just worked with (`reward.model`, `model-parts.js`), that turns by dragging; at `3D Off` the same parts are drawn flat. The model is honest (every proton, neutron and electron is a counted one, and a scale shortcut is said under it), never decoration. More 3D models, visualizations and assets are added wherever a bench or a reward is about shape or position, not only where it is easy.
20. **The story is the investigation, told in the player's own words.** Every bench carries one thread of the case against the Fifth: a question Vess is trying to answer (a lead line on its first stage, in plain words), the evidence the bench itself produces, and one line *filed to the case* when the quest ends that moves the investigation on (`Filed: ...`) and that the next bench picks up. Story copy uses only words the quest has already earned, no jargon, no atmosphere, no invented number or event the bench did not measure, and nothing that restates the lesson. If a line would read the same with the story removed, or needs a term the player has not met, it is cut. `verify:story` holds the vocabulary and the filed line.
21. **Discover it, never read it off.** A stage never asks the player to report what the bench already shows in plain sight (sorting discs by a printed +, ticking what is labelled). The thing under study starts hidden, and the player finds it out with an instrument: charged plates bend the specks that carry a charge, a beam shows what is inside a foil, a needle reads a charge, a balance weighs. If a student could answer by looking at the table, the stage is rebuilt around an experiment (`q2-core` stage 3 is the model: nine identical specks, a pair of charged plates, and a sort by what happened).
22. **A quest ends on one story animation, and it is Vess's debrief.** When the player clears a quest's last stage, a short scene (three to five lines of Vess) reviews the ideas the quest worked out, each said over the picture that shows it, and ends on the line filed to the case (principle 20), so it both consolidates the lesson and moves the investigation on: the Fifth, the rumour of alchemy, the Case File. It replaces the debrief card, plays on every completion, is paced by the player (Next, Back, Skip), never interrupts a stage or sits before one, and is drawn from the bench's own numbers on a 2D canvas, so `3D Off` and reduced motion lose nothing (they show each line's last frame). `quest-story.js` holds it and `verify:story` counts it. Thirty-four are built, one for every quest that carries one: Tallow 7, Lanternfall 10, Ligar 6, Bellows 7 and Ember Reach 4 (a bench that adds nothing to the case has none, and ends on its debrief card).

## Hint ladder

Learn track: exactly three rungs, one sentence each. 1 = what to do with the tool, 2 = what to look at or compare, 3 = the method or structure, never the answer or the arithmetic. Rung 1 is free, rung 2 comes after a miss or 45 s, rung 3 after two misses. Rung 1 names the control, not the move; where a control needs explaining that explanation also lives on the object (principle 2).

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

<!-- facts: worlds=14 built_worlds=6 quests=44 benches=38 bosses=6 stages=229 -->

- **Campaign: Quest 1, The Charge Gardens of Erebus.** 20 stages, 650 XP, a scan → compare → commit loop, physically honest 3D reaction animations, a chemistry card after every solve and an epilogue that gathers the terminology into a debrief.
- **Learn track:** fourteen worlds in road order: Tallow (atoms, the table, the mole), Lanternfall (light, orbitals, trends), Ligar (bonding), Bellows (gases), Ember Reach (thermodynamics), Mirrowen (states of matter), Kettle (stoichiometry and reactions), Teeter (equilibrium), Verdigris (acids and bases), Brinewire (electrochemistry), Quicklight (kinetics), Lodestone (transition metals), Thornmere (organic) and Cinder Halo (nuclear). **Six are built**: Tallow (6 benches + the Hopper), Lanternfall (9 + the Eater), Ligar (9 + the Warden), Bellows (6 + the Compressor), Ember Reach (7 + the Crucible) and Kettle (1 bench + the Golem). That is **44 quest modules: 38 benches and 6 bosses, 229 stages**. Every built world is open from the start; inside a world, quest N opens when N−1 is complete. The other eight are charted only and hold nothing shut.
- **Walkable worlds:** Tallow, Lanternfall, Ligar, Bellows and Ember Reach. Kettle has no walkable world yet, so its bench builds its own room. Every built quest is a tabletop; at `3D On` the camera leans in over the plate.
- **The Drill Deck holds practice in one place.** Five problems per built quest, asked in rounds (a Daily Set, a Quick Run, a Timed Round, Weak Spots) with stars, a **weekly** streak, per-world mastery tiers and a few cosmetic commendations. Optional and skippable at every point; pays no XP, never reaches Standings, gates nothing. A 2D screen on every setting.
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

- A playable campaign and 44 built Learn quests. `npm run verify` runs the check scripts in `package.json`, several of which build a real world in Node and measure it (nothing may occupy the same space as anything else, no screen may hang off the edge of the glass, the chamber console may not cover more than a quarter of the view) and `verify:docs` holds this file's counts to the curriculum registry.
- Baked media: mapped loops and cinematics with WebM, MP4, posters and captions, plus static SVG backdrops for `3D Off` and environment stills under `/art/`.
- Written plans under `docs/plans/`, the quest design doc `docs/quests/q1-charge-gardens.md` and an officer runbook at `docs/runbook.md`.
- Code retired but kept lives under `archive/` and is not built.
- **Absences future work must not fabricate:** there are no students, no play data, no testimonials, no screenshots of real use, no press and no institutional endorsement. The product has never been in a student's hands. The owner is the only play tester; agents do not browser-test.

## Accessibility & Inclusion

The one confirmed requirement is the **375 px phone floor** (portrait for non-bench screens, see above). Beyond that no formal accessibility standard exists. `3D Off` exists so that a student on hardware with no WebGL can solve every stage. A keyboard, screen-reader or reduced-motion bar would be a new decision, not an existing one.
