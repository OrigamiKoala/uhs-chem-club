# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences play the same game, and neither arrives knowing chemistry:

- **University High School students** — not only Chemistry Club members. Students join
  for the competition, the story or their friends' guild, and many have taken no
  chemistry course at all.
- **Middle schoolers** — younger students meeting the subject for the first time, with
  no course vocabulary to fall back on.

Because both audiences overlap in a single deployment, the floor is always the student
who knows nothing: anything a screen assumes about prior chemistry knowledge excludes a
real player.

**Club officers** are an operational role rather than a third audience. They run
showcase nights, reset passwords, force renames, raise guild slot caps and correct stage
copy live from the Sheets backend (`#/admin`, `docs/runbook.md`). Their work is
maintenance, not play.

## Product Purpose

Avalon is a year-long RPG competition and molecular simulator for the UHS Chemistry Club.
Students join one of four Imperial guilds aboard a salvage starship and learn chemistry by
doing it — drawing lines between glowing regions, running instruments over unlabelled
crates, firing a beam through a mounted specimen — rather than by reading about it.

The governing rule is **teach through play, reveal vocabulary last**. A player solves
twenty stages of the Charge Gardens before meeting the words *electron*, *curved arrow*
or *steric hindrance*; the Learn track's first quest teaches atom, element, molecule,
compound and mixture and names none of them until the debrief. Success is a student who
can predict what a reaction does before they can name it.

## Positioning

A chemistry course names a concept and then asks the student to apply it. Avalon inverts
that order: the mechanic comes first, the vocabulary comes last, and every quest is a
playable instrument rather than an illustrated explanation. That inversion is enforced
mechanically, not editorially — `npm run verify:quest` and `npm run verify:learn` fail
the build if withheld vocabulary appears in any player-facing string.

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
  at every point**, they pay nothing, they gate nothing — the next world opens on the last
  quest's completion whether or not a question is answered — and they come back for ever
  through a **Problems** key beside a finished world on the star map and on the Learn
  road. They are a 2D overlay on every tier.
- **Learn track:** ten worlds, one per AP Chemistry unit, 41 quests charted and nine built —
  all of Tallow (`unit01/q1-grain` through `unit01/q5-assay`) and all of Ligar
  (`unit02/q1-joins` through `unit02/q4-weigh`). Every Learn quest is a game with its own
  stages, scene, inputs and grading. Tallow and Ligar are both walkable ground at T4, with
  every one of their nine benches a built instrument standing on it; below T4 each bench is
  played as a page.
- **What Ligar teaches.** Four benches: what a bond is and why ionic and covalent are the
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
  lives in `src/story/` and obeys the same withheld-vocabulary list as teaching copy.
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

1. **The mechanic teaches; the word comes last — and then the word is used.** A player
   arrives knowing virtually nothing, so a concept is met as something they DO before it
   is ever named: a stage that opens by naming what it is about is designed wrong, and a
   stage that introduces "nucleophilic aromatic substitution" to someone who has not met
   a molecule is not a hard stage, it is a broken one.

   **Withholding a word is a schedule, not a policy.** Once a reward card has named a
   thing the player has already found, that word is the plain word for it and the game
   uses it — the prompt, the hints, the readouts and the refusal messages all say
   "electron" from the stage after the stage that earned it. Going on saying "light
   piece" once the player knows better is the instrument being coy, and it reads as the
   game hiding the ball. The rules that follow from this:

   - Nothing is introduced faster than it can be absorbed: roughly one new named idea per
     stage, and each one has to rest on something the player has already worked out.
   - A term is introduced at a stage's reward card, and is usable in play from the NEXT
     stage on. A quest declares that schedule in its module (`VOCABULARY` in
     `src/learn/quests/unit01/q2-core.js` is the worked example) and `npm run verify:learn`
     fails the build both ways round — a word said one stage early, and a word the
     schedule promises that no card ever delivers.
   - The intuition still comes first and it comes WITHOUT the word. Charge balance is met
     as a needle that sits on zero when two counts happen to be equal; only afterwards is
     it called an electron and a proton. Discover, then name, then use.
2. **A name is never used before it is explained, including the instrument's own.**
   Principle 1 governs the CHEMISTRY vocabulary; this one governs everything else the
   player is asked to touch. "Read the needle", "load the rings", "the ring counters on
   the deck" and "set the field" are all perfectly clear sentences addressed to somebody
   who has already used the bench, and that reader is the one person this product is not
   for. So a control whose label does NOT say what it does carries a plain sentence
   saying what it does, beside it, for as long as the stage offers it — not in a tooltip,
   not once on first use, and not inside a hint the player has to earn. **A control whose
   label already says it carries nothing**: "Tip Sample" needs no legend explaining that
   it tips the sample. A quest exports `toolNoteFor(controlId, stageNumber)`, and
   `npm run verify:learn` fails the build over a legend that exists and is malformed or
   leaks withheld vocabulary, never over one deliberately left out. The line follows
   principle 1's schedule too: the needle's legend says "light pieces" until the stage
   after electrons are named, and says "electrons" from then on — and a legend never
   states the thing its own stage exists to discover.
   **A refusal is held to the hint ladder's rule**: it names the reason and where to look,
   never the value the player must enter; `verify:learn` fails a miss message that
   contains its stage's answer.
3. **A stage must be solvable by somebody who does not already know the answer.** This is
   the test every bench stage has to pass and the easiest one to fail, because the author
   knows the chemistry. A stage that can only be finished by a player who already knows
   what protons do is not teaching, it is checking — and it is checking the one thing
   this product's audience has not got. In practice the evidence a stage needs has to be
   ON THE BENCH: the rule that the needle reads crosses minus light pieces is
   discoverable because an open reference on the same bench reads plus two with six
   crosses and four light pieces; the rule that neutrons do not change what a piece IS is
   discoverable because the piece with the extra neutron has an identical outside, and
   the stage before established that the outside is what decides behaviour. Asserting
   either of those in a hint instead is the failure mode, and hint rung three is not a
   substitute for evidence.
4. **Looking is the verb.** One reading is never enough — every stage is solved by
   comparing two or more, which is what makes investigation the gameplay rather than
   reading comprehension.
5. **Learning must never become grinding.** The study road pays no XP and never touches
   Standings; hints are free; a replay costs and earns nothing; the practice problems are
   optional, skippable and gate nothing. A study aid that held the road shut would be a
   test, and this is not one.
6. **The floor is the student who knows nothing and is holding a phone.** Low-end
   hardware and 375 px are the design target, not a degraded mode.
7. **Nothing in the interface advertises the product.** Every string is a label, a rule,
   an error, something being taught, or a character speaking.
8. **An instrument never invents a reading.** A screen that claims to be telemetry shows
   what was measured or says it has none. This is a pre-launch product, and a plausible
   number in place of a missing one is the easiest lie to ship and the hardest to notice.
   The same honesty binds a PICTURE: what an instrument draws is what the quest grades
   against. A core holding six marked grains is drawn with six, not with one grain
   standing in for the idea of a core, or the player is being asked to reason about a
   specimen the screen is misreporting to them.
9. **A place the player is told to look at is never blacked out to tell them.** A modal
   over a page is a dialog; the same modal over an instrument the briefing is describing
   hides the thing it is describing. At a bench built in the world the transmission docks
   down one side of the glass at a readable width, the scrim goes to a veil, and the
   instrument is aimed out from behind it.

## Accessibility & Inclusion

The one confirmed requirement is the **375 px phone floor** — every screen, quest and
instrument must be fully usable on a phone.

Beyond that, no formal accessibility standard has been established. T1 exists so that a
student on hardware with no WebGL can solve every stage through native form controls,
which is an inclusion commitment in practice. A keyboard, screen-reader or
reduced-motion bar would be a new decision, not an existing one.
