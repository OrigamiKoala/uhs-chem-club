# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Audiences play the same game, and none arrives knowing chemistry:

- **Elementary and middle schoolers** — younger students meeting the subject for the first time, who need intuitive, plain-English explanations without condescension or confusing ciphers.
- **High School students** — students joining for the competition, story, or guilds, many having taken no chemistry courses at all.

The comprehension floor is an **elementary school student**: every quest stage, objective, and concept must be clearly explainable in plain terms that an elementary student understands, while remaining rigorous.

**Club officers** are an operational role rather than a player audience. They run showcase nights, reset passwords, force renames, raise guild slot caps and correct stage copy live from the Sheets backend (`#/admin`, `docs/runbook.md`). Their work is maintenance, not play.

## Product Purpose

Avalon is a year-long RPG competition and molecular simulator for the UHS Chemistry Club. Students join one of four Imperial guilds aboard a salvage starship and learn chemistry by doing it — running instruments over mineral specimens, firing particle beams through atoms, and calculating yields — rather than reading abstract lectures.

The core product design invariants are:
1. **Teach chemistry clearly from the start using real concepts.** Never use invented replacement ciphers or analogues that later reveal "in the real world this is called X" (calling electrons "light pieces" or atoms "grains"). Use real chemistry terms (atoms, electrons, isotopes, molecules, compounds) from stage one. Analogies are encouraged to build intuition; replacement codes are banned.
2. **Never give away answers or spoil solutions.** The student must apply chemistry principles to investigate on the bench and deduce answers themselves. Neither prompts, mission cards, nor hints spoon-feed the correct answer.
3. **Elementary-school-friendly clarity.** Every quest provides an on-screen STAGE MISSION & SCIENCE card and interactive Objective & Guide modal (`src/learn/engine/quest-guide.js`) detailing the chemistry concept, mission context, plain-English stage goal, how-to-test instructions, and vocabulary definitions.
4. **Experiment trials, not monster combat.** The encounter layer represents scientific trials on specimens. Incorrect answers are missed trials with measurement discrepancies ("Missed Trial"), not monster attacks ("takes the hit"). Students have 3 trials before a safety reset, and progress is never lost.
5. **Interactive controls and responsive actions.** Stage action buttons (`[Objective]`, `[Findings]`, `[Fold Panel]`) and modal close buttons must always be interactive and responsive with `pointer-events: auto`.
6. **Discover chemistry to solve storyline problems (not vice versa).** Students actively explore and discover real chemical concepts on interactive instruments, then use that scientific knowledge to solve practical storyline problems (e.g. using isotopes/molar masses to catch a merchant selling alloyed metal). The game must not invent arbitrary sci-fi puzzles and retroactively force chemistry onto them.
7. **Physical intuition over organic chemistry jargon overload.** Elementary and middle schoolers must not be overwhelmed or intimidated by college organic chemistry terminology ("alkyl halide", "carbonyl", "nucleophile", "SN1/SN2"). Organic reactions teach concrete physical mechanism intuition: opposite charges attracting, limited bond seats requiring atoms to make room, 3D crowding blocking tight paths, leaving pieces clearing seats, and helper molecules.
8. **Visual and hands-on integration.** Chemistry is learned through visual exploration and direct manipulation of 3D molecules and bench instruments, never through text-heavy textbook walls with a disconnected 3D layer.

**Direction:** the Learn worlds are the story road (no XP); the campaign sectors are contracts (side jobs that pay XP).

## Positioning

A chemistry course often lectures abstractly before students touch an instrument. Avalon
grounds chemistry education in interactive instrumentation: students investigate real
chemical phenomena on working bench instruments, guided from stage one by clear,
elementary-friendly chemistry concepts and plain-English objectives. Students apply those
scientific principles to solve problems in the storyline without being spoon-fed answers.

It is also a competition with a real social frame: four rival guilds, normalized team
leaderboards, a shared season, and a quartermaster who talks to you in character.

## Operating Context

- **Lifecycle: pre-launch.** No real student accounts, XP or progress exist yet. Data
  shapes and flows are still free to change; that freedom ends at launch.
- **Where it is played:** phones and school laptops, at meetings, at showcase nights and
  between sessions. Phone play is a primary case, not an afterthought.
- **The season frame:** students register, pick a guild with live slot counts, and work
  through a campaign (`#/quest`) and a parallel study road (`#/learn`).
- **Two roads:** the campaign pays XP and feeds Standings; the Learn track pays none and
  never reaches the leaderboard, by design.
- **Officer rituals:** live copy edits land in the Google Sheet without a redeploy;
  `docs/runbook.md` is the showcase-night reference.
- **Stack (existing):** Vite + Three.js client, DOM UI over one persistent WebGL canvas;
  a Vercel Node proxy that does scrypt password derivation and rate limiting; a Google
  Apps Script web app over a 15-tab Google Sheet.

## Capabilities and Constraints

- **Campaign — Quest 1, The Charge Gardens of Erebus:** 20 stages, 650 XP, a scan →
  compare → commit loop, physically honest 3D reaction animations, a chemistry card of
  one to three sentences after every solve, and an epilogue that gathers the terminology
  into a debrief.
- **The chemistry arrives in bits, after the work, on every quest.** Each stage of the
  campaign and of each Learn quest ends on a card that names — in real chemical terms —
  the idea the player just worked out. Capped at three sentences and checked by
  `verify:quest` / `verify:learn`. The gameplay copy around it stays in plain language:
  the card is where the vocabulary lands, not the prompt.
- **Practice problems close a Learn world.** Five per built quest, gathered and shown at
  the end of the WORLD rather than the end of a quest. They are **optional and skippable
  at every point**, they pay nothing, they gate nothing — every built world is open from the
  start, and inside a world the next bench opens on the last one's completion whether or
  not a question is answered — and they come back for ever
  through a **Problems** key beside a finished world on the star map and on the Learn
  road. They are a 2D overlay on every tier.
- **Learn track:** fourteen worlds in road order — Tallow (atoms and the mole), Lanternfall (light
  and electrons), Ligar (bonding), Bellows (gases), Ember Reach
  (thermodynamics), Mirrowen (states of matter), Kettle (stoichiometry and reactions),
  Teeter (equilibrium), Verdigris (acids and bases), Brinewire (electrochemistry), Quicklight (kinetics), Lodestone (transition
  metals), Thornmere (organic), and Cinder Halo (nuclear). **Every built world is open
  from the start**; the order is a recommendation. Thirty-one benches built, and four bosses: all of
  Tallow (`unit01/q1-grain` … `unit01/q6-weigh`; the mole was built on Ligar and moved), all of
  Lanternfall, all of Ligar, all of Bellows (`unit04/q1-knocks` … `unit04/q6-real`, on one gas rig,
  and the Compressor) and Kettle's first (`unit07/q1-recipe`, also built on Ligar). Every Learn
  quest is a game with its own stages, scene, inputs and grading. Tallow, Lanternfall, Ligar and
  Bellows are walkable ground at T4; Kettle is not yet, so it builds its own room; below T4 each
  bench is a page.
- **What Ligar taught as built (bench three now opens Kettle, bench four closes Tallow).** Four benches: what a bond is and why ionic and covalent are the
  only two kinds (`q1-joins`); what each kind builds, and how that decides whether a block
  shatters, melts low or conducts (`q2-lattice`); why a compound always has the same recipe,
  by count and by mass (`q3-recipe`); and how a count far too big to count is taken as a
  mass instead — the mole and molar mass (`q4-weigh`). The law of definite proportions is
  the spine of the third bench and is deliberately never named: the player counts the same
  recipe out of three samples from three places, and a name hung on that adds nothing they
  have not just done. Avogadro's number IS named, on the card after the stage that measures
  out equal counts without counting anything.
- **Hardware tiers:** T4 (walk the ship and the worlds in first person), T3 (discrete
  GPU), T2 (Chromebook-class), T1 (no WebGL at all). Every quest stage is 100% solvable in
  T1 through DOM-only inputs producing the same payload contract.
- **At T4 the interface is in the world.** The Charge Gardens' stage deck is a control desk
  in the chamber; every Unit 1 and Unit 2 Learn instrument is a built object on a bench the player has
  walked to, with their screens bolted over them and their power control a knob you reach
  over and turn. Nothing a player reads differs between the two presentations — the DOM is
  moved onto a plane, never re-authored — and a stage that grades correct on one grades
  correct on the other.
- **Grading is local and instant.** The browser grades at 0 ms; the server call is
  fire-and-forget telemetry.
- **Fairness rules that are product facts, not implementation details:** XP is paid once
  per stage; XP is flat with no attempt multiplier; hints cost nothing; completion is
  idempotent; progress never regresses; a finished quest replays for free.
- **Confirmed device floor: every screen must work at 375 px wide.** Phone layout lives
  in its own stylesheets scoped to `max-width: 760px`, plus a landscape sheet for sideways
  phones.
- **Not established:** no formal accessibility standard (WCAG level, keyboard-only
  operation, screen-reader support, `prefers-reduced-motion`) has been set as a
  requirement. The code carries some of this already — `ui/cinematic.js` has a
  reduced-motion fallback, T1 uses native form controls — but it is not a stated bar.
  Future work should not claim compliance that was never agreed.
- **Not established:** season length and start date, roster size, guild slot cap beyond
  the documented default of 12, and whether the Learn track's remaining 32 quests ship
  this season.

## Brand Commitments

- **Name:** Avalon. The four guilds are Mineral Mining (Earth), Atmospheric Harvesters
  (Air), Thermal Smelters (Fire), Moisture Extraction (Water), shown as two-letter mono
  designators MM / AH / TS / ME.
- **The aesthetic is binding and already specified in full.** "SCOURED PLATE" —
  hardware that has been in the dust for forty years and still works. Its material
  rules, banned patterns, geometry, colour, typography, components and copy discipline
  are documented in `CLAUDE.md` and enforced by `src/styles/tokens.css`. That brief is
  design authority; future visual work extends it rather than reopening it.
- **Voice:** diegetic. Vess the quartermaster, pylon communications, guild pitches and
  mission logs are characters speaking, never a product describing itself. Story copy
  lives in `src/story/` and uses clear chemistry terms and plain English without invented ciphers.
- **Copy discipline:** the interface does not advertise itself. No feature marketing, no
  emoji in player-facing markup, no live-connection claims.

## Evidence on Hand

- A playable campaign and nine built Learn quests, verified by eleven check scripts
  (`verify:quest`, `verify:console`, `verify:learn`, `verify:geometry`, `verify:media`,
  `verify:flows`, `verify:ship`, `verify:tallow`, `verify:ligar`, `verify:bench`,
  `verify:holo`). Several
  of them build the real world in Node and measure it rather than trusting a table beside
  it: nothing may occupy the same space as anything else, no screen may hang off the edge
  of the glass, and the chamber console may not cover more than a quarter of the view.
- Baked media: 19 mapped loops and cinematics with WebM, MP4, posters and captions, plus
  static SVG backdrops for T1 and environment stills under `/art/`.
- Written plans under `docs/plans/` and the quest design doc `docs/quests/q1-charge-gardens.md`.
- An officer runbook at `docs/runbook.md`.
- **Absences future work must not fabricate:** there are no students, no play data, no
  testimonials, no screenshots of real use, no press and no institutional endorsement.
  The product has never been in a student's hands. **The product must not fabricate them
  either:** the comms board shows the standings the backend actually computes, or it says
  it has no telemetry. It used to fall back to four invented guild totals, which showed a
  finished season to a club that has never played a stage.

## Product Principles

1. **Real chemistry concepts from the start.** Never invent replacement ciphers or analogues that later reveal "in the real world this is called X" (calling electrons "light pieces" or atoms "grains"). Use standard chemistry terms (atoms, protons, neutrons, electrons, isotopes, molecules, compounds) from stage one. Analogies to real-life intuition (e.g. balancing a seesaw, recipe proportions) are welcome to build intuition, but private code words are forbidden.
2. **Never give away answers or spoil solutions.** A prompt states what to investigate, and the bench provides the tools. The user must explore, test, observe, and deduce the answer themselves. Neither the prompt, the mission briefing, the stage guide, nor the hint ladder should ever tell the player what to do or make the correct option obvious.
3. **Elementary-school-friendly explanations.** Every quest and stage provides an on-screen STAGE MISSION & SCIENCE card and an interactive Objective & Guide dialog (powered by `src/learn/engine/quest-guide.js`). These explain:
   - The real chemistry concept being taught (atoms, mass spectrometry, octet rule, etc.).
   - The storyline context (why the research expedition is performing this test).
   - The stage goal in plain, simple English that any elementary student can understand.
   - How to test using the bench instruments (scientific method: test, observe, deduce).
   - Clear vocabulary definitions for key technical terms.
4. **Experiment trials, not monster combat.** The encounter layer represents scientific trials on mineral specimens. Incorrect submissions are missed trials with measurement discrepancies ("Missed Trial"), not monster attacks ("takes the hit"). The player has 3 experiment trials before a safety reset, and progress/readings are never lost.
5. **A stage must be solvable by somebody who does not already know the answer.** The evidence needed must be ON THE BENCH: comparing two or more specimens or readings on the instruments is how the student discovers the relationship. Hints point at that evidence; they are never a substitute for it and never reveal arithmetic solutions.
6. **Looking is the verb.** One reading is never enough — every stage is solved by
   comparing two or more, which is what makes investigation the gameplay rather than
   reading comprehension.
7. **Learning must never become grinding.** The study road pays no XP and never touches
   Standings; hints are free; a replay costs and earns nothing; the practice problems are
   optional, skippable and gate nothing. A study aid that held the road shut would be a
   test, and this is not one.
8. **The floor is the student who knows nothing and is holding a phone.** Low-end
   hardware and 375 px are the design target, not a degraded mode.
9. **Critical text only and zero decorative fluff.**
   - Nothing in the interface advertises the product or its features.
   - Text exists solely if it is 100% critical to direct, instruct, or teach the player (functional labels, rules, errors, direct teaching, or unadorned character speakers).
   - Strip all decorative sci-fi noise, pseudo-technical slashes (`//`), fake status indicators (`status: clear`, `integrity: high`), tactical warnings, and ceremonial titles (`Vess // Quartermaster` -> `Vess`).
   - Copy must make direct, plain sense and remain helpful without artificial jargon or decorative filler, while avoiding overly cryptic terseness on essential instructions.
10. **An instrument never invents a reading.** A screen that claims to be telemetry shows
   what was measured or says it has none. This is a pre-launch product, and a plausible
   number in place of a missing one is the easiest lie to ship and the hardest to notice.
   The same honesty binds a PICTURE: what an instrument draws is what the quest grades
   against. A core holding six marked grains is drawn with six, not with one grain
   standing in for the idea of a core, or the player is being asked to reason about a
   specimen the screen is misreporting to them.
11. **A place the player is told to look at is never blacked out to tell them.** A modal
   over a page is a dialog; the same modal over an instrument the briefing is describing
   hides the thing it is describing. At a bench built in the world the transmission docks
   down one side of the glass at a readable width, the scrim goes to a veil, and the
   instrument is aimed out from behind it.
12. **Specimens carry evidence, and trials test the hypothesis.** An encounter on a specimen must fail the deletion test: *if you can delete the specimen and the stage is unchanged, the trial is decoration.* So a specimen's reaction is what the bench measures — a husk falls into layers because the sample settles into layers, a moth sheds because the photocell says electrons leave — drawn from the instrument's own planner and never authored. The trial submission is the committed answer itself. The rest of the doctrine does not bend for it: the prompt states the objective and never the solution; **nothing blocks a correct answer** (a right commit on trial one wins immediately); testing with bench tools is free and only a committed incorrect trial counts toward the 3-trial limit; and **safety resets cost nothing that matters** — a reset refills trials and keeps every open hint, reading and answer. Specimens are stabilized, never killed, and are named in the plainest English (*salt husk*, *lamp moth*), never a coinage the player must memorise alongside the chemistry. Real-time reflex challenges are rejected: they fail at 375 px and would block a student who understands the chemistry.
13. **Chemistry solves storyline problems, not vice versa.** The storyline is motivated by practical problems that students solve using the chemistry they discover (e.g. mass spectrometry reveals mineral fraud, reaction stoichiometry balances life support gases, charge maps restore sabotaged power links). We do not create confusing sci-fi puzzles and retroactively force chemistry onto them.
14. **Organic chemistry: physical mechanism intuition over terminology overload.** Elementary and middle school students get scared and confused when hit with dense organic chemistry nomenclature. Focus squarely on intuitive physical dynamics: opposite charges attract (red givers to blue receivers), atoms with limited bond seats must make room before accepting new bonds, 3D crowding blocks congested paths, leaving pieces vacate seats, and helper molecules assist transfers. Formal college terminology (alkyl halide, carbonyl, carbocation, nucleophile, electrophile, SN1/SN2) is omitted from core gameplay copy to prevent intimidation.

## Accessibility & Inclusion

The one confirmed requirement is the **375 px phone floor** — every screen, quest and
instrument must be fully usable on a phone.

Beyond that, no formal accessibility standard has been established. T1 exists so that a
student on hardware with no WebGL can solve every stage through native form controls,
which is an inclusion commitment in practice. A keyboard, screen-reader or
reduced-motion bar would be a new decision, not an existing one.
