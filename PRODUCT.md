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
  Apps Script web app over a 13-tab Google Sheet.

## Capabilities and Constraints

- **Campaign — Quest 1, The Charge Gardens of Erebus:** 20 stages, 650 XP, a scan →
  compare → commit loop, physically honest 3D reaction animations, and an epilogue that
  is the single place real terminology is introduced.
- **Learn track:** ten worlds, one per AP Chemistry unit, 40 quests charted and two built
  (`unit01/q1-grain`, `unit01/q2-core`). Every Learn quest is a game with its own stages,
  scene, inputs and grading.
- **Hardware tiers:** T3 (discrete GPU), T2 (Chromebook-class), T1 (no WebGL at all).
  Every quest stage is 100% solvable in T1 through DOM-only inputs producing the same
  payload contract.
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
  the documented default of 12, and whether the Learn track's remaining 38 quests ship
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

- A playable campaign and two built Learn quests, verified by five check scripts
  (`verify:quest`, `verify:learn`, `verify:geometry`, `verify:media`, `verify:flows`).
- Baked media: 19 mapped loops and cinematics with WebM, MP4, posters and captions, plus
  static SVG backdrops for T1 and environment stills under `/art/`.
- Written plans under `docs/plans/` and the quest design doc `docs/quests/q1-charge-gardens.md`.
- An officer runbook at `docs/runbook.md`.
- **Absences future work must not fabricate:** there are no students, no play data, no
  testimonials, no screenshots of real use, no press and no institutional endorsement.
  The product has never been in a student's hands.

## Product Principles

1. **The mechanic teaches; the word comes last.** If a screen has to name a concept
   before the player has done it, the stage is designed wrong.
2. **Looking is the verb.** One reading is never enough — every stage is solved by
   comparing two or more, which is what makes investigation the gameplay rather than
   reading comprehension.
3. **Learning must never become grinding.** The study road pays no XP and never touches
   Standings; hints are free; a replay costs and earns nothing.
4. **The floor is the student who knows nothing and is holding a phone.** Low-end
   hardware and 375 px are the design target, not a degraded mode.
5. **Nothing in the interface advertises the product.** Every string is a label, a rule,
   an error, something being taught, or a character speaking.

## Accessibility & Inclusion

The one confirmed requirement is the **375 px phone floor** — every screen, quest and
instrument must be fully usable on a phone.

Beyond that, no formal accessibility standard has been established. T1 exists so that a
student on hardware with no WebGL can solve every stage through native form controls,
which is an inclusion commitment in practice. A keyboard, screen-reader or
reduced-motion bar would be a new decision, not an existing one.
