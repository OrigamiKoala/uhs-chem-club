# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal. Its audience is middle- and high-school students
(12 to 17), so the design doctrine is: **teach chemistry clearly, intuitively and hands-on, without giving
away answers.**

This file is the doctrine, the hard rules and the commands. **Building or auditing a Learn world: read
`PRODUCT.md` "Building a Learn world" first** (targets, wiring, stage design, the pitfall ledger). How things are built is in
`docs/engineering/engine-and-worlds.md`. `PRODUCT.md` is the durable product truth and wins any disagreement
about what the product is (pre-launch, no real accounts/XP/play data, 375 px floor, no formal accessibility
standard, competition = Quest 1 only at launch). `DESIGN.md` + `.impeccable/design.json` hold aesthetic tokens
and primitives; the SCOURED PLATE prose below stays the authority. Story: `docs/story/bible.md`.

## Teaching doctrine (applies to every Learn quest, stage, hint and boss)

- **Table pieces are solid objects on a plate.** Cards are rounded slabs, tokens are pucks, particles and atoms are spheres on a base, and orbitals, molecules and lattices are real spatial models; `3D Off` draws the same parts flat. Where a piece sits in a socket, tray or holder it rests on top of it and never sinks in. The per-kit geometry, label and plaque rules are in `docs/engineering/engine-and-worlds.md` ("Per-bench build notes").
- **The answer is the table where it can be built.** Every quest is an open tabletop graded on what is on the table, not on an authored multiple-choice question unless the stage is an unbuildable reading.
- **Every drag has a two-tap twin.** Any piece or tool that can be dragged into place can also be picked up with a tap and put down with a second tap where it goes.
- **Ordering is dragging into place on a rail, never clicking in sequence.** Rank, sequence and sorting stages are rails or slots arranged by dragging pieces into order.
- **Snaps are physics, never a gatekeeper.** Snaps seat pieces into sockets, wells, clamps and rails by proximity and physical alignment; they do not reject or hide a move.
- **A prediction is asked on each quest's click stage and on a new case of an idea already worked out, never on every stage.** A prediction stage commits a hypothesis that is immediately tested on the table (Run); the guess is the player's own, recorded and contrasted by the bench, never graded (the stage is graded on what the test showed).
- **A field stage is evidence, never a lock, at most one per quest, never on a boss.** An in-world observation or measurement is supplementary evidence; never a prerequisite lock. A fetch must bring NEW evidence (a counted reference, a sample the bench lacks); one that carries a copy of what the bench already holds is cut.
- **Plain labels until the word is earned, then the real term. Never a code word.** No ciphers or invented
  words that are later swapped for the real one. Every term is defined where first met (briefing, an earlier
  reward card, or an inline gloss). Analogies to real life are fine.
  A quest's `VOCABULARY` maps each term to the stage whose reward card defines it; `verify:learn`
  enforces the card promise. `WITHHELD_VOCAB` in `tools/verify-learn.mjs` holds only what is not yet earned.
- **Never give away answers.** Two kinds of information are kept apart. *How a tool works and how to answer*
  is always given, on the object (captions, notes, legends; never behind a hint). *Which move solves the
  stage* is never given: prompt, briefing and hints never tell the player what to do or make the right
  option obvious. **A prompt states the objective, never the route**: one plain question or
  imperative, at most 25 words, no setting clause, no "!" (e.g. `q3-lines` asks to "Pick the element in the sealed tube", not mechanical strip/sample alignment). Setting and story live in the saga, world
  briefings and Case File, plus at most one quiet `.lq-story` lead line (`stage-story.js`, ≤20 words, no
  figure, never on a boss).
- **Hint ladder:** exactly three distinct rungs, each ONE sentence. 1 = which control to use (how
  it works is printed on the object), 2 = what to look at or compare, 3 = the method/structure, never the
  answer or the arithmetic result. Rung 1 free, rung 2 after a miss or 45 s, rung 3 after two misses.
  **The campaign differs on purpose:** Charge Gardens hints are `[nudge, narrow, solution]` so a stuck player
  on the XP road is never locked out; the solution rung only resets the display-only CLEAN counter.
- **Nothing is named without being explained, and every loose tool says what it does.** Every tool hangs in a
  named place with one plain caption printed under it (≤ ~18 words, drawn on the table, never a tooltip). A
  key whose label doesn't say what it does gets the same plain legend. A prompt/hint that names a control
  quotes it: `Press "Fire Beam"`. (The audit showed even a "Cutter" was not self-evident.)
- **The Tour explains every tool on the stage's table**, one step per instrument and kind of piece, in earned words
  (`src/learn/table/tour.js`, fed to the frame by `stagerunner.js`; a bare call shows only steps the player has not
  met, the Tour key replays all). Each step is written in three beats (what it is, what to do with it, what it
  tells you) in everyday words, and names the tool the way the player sees it. It says how a tool works, never which move solves the stage. `verify:table` fails on
  an instrument or tool with no step, and on an unearned word. A new kit kind gets its words in `tour.js`. Printed fact labels, plaques, and plates (`kind: 'plaque' | 'plate'`) carry no interactions and are excluded from Tour steps across all benches.
- **Tools are introduced right before the stage that needs them.** Stage 1's briefing (one per quest, ≤2
  sentences) names only the initial tools; `TOOL_TEXT` entries set `from:` to the exact stage.
- **Nothing blocks a player who has the right answer.** A stage may refuse a blank answer, or a wrong one
  with a reason; never a correct one for want of a key press.
- **A stage must be solvable by someone who doesn't already know the answer.** The evidence is on the
  bench, not in hint rung 3. Constants/formulas a stage needs are given on a plate, readout or rung 3.
- **Every stage owes a reward card** (1–3 sentences) naming the idea just worked out. A misses message
  must carry a reason and may not contain its stage's answer (`verify:learn` searches for it). Reward models (`ui/model-viewer.js`, `model-parts.js`, `model-parts-lanternfall.js`) stand the idea up in interactive 3D.
- **Scientific investigation, not monster combat.** Misses are "missed trials"; progress is never lost.
  Samples are SAMPLE A/B/C, restarting every stage. Stage controls (`.lq-stage-actions`, `.lq-controls`,
  dialog buttons) must always have `pointer-events: auto`.
- **Only bosses fight; ordinary stages are trials** (a wrong answer is a missed trial with a reason, never an attack) (`boss-hopper`, `boss-eater`, `boss-warden`, `boss-golem`, `boss-compressor`, `boss-crucible`).
  A boss phase declares `encounter {species, act, intent, hit?, counter?, moves?}`; ordinary stages have
  none. Foes come only from `planFoe()` in `engine/foes.js` (asks the instrument's own planner), map
  one-to-one onto the stage's samples/rows, are "dispersed, never killed" (the one verb, everywhere), fit SCOURED PLATE. A foe
  only observes: scouting is free, only a committed miss costs 1 of 3 Integrity, knock-back keeps
  everything learned, a correct commit wins at any Integrity, the miss reason is on screen before the foe
  answers, every foe line passes the vocabulary gate and answer-leak search. No modal precedes a stage.
- **Boss = one health bar over its fight** (`boss-arena.js`, `boss-hud.js`); cosmetic only, never
  refuses an answer. FPS combat layer was removed; `encounter3d.js` takes no part in Commit. The boss stands in the world
  across the table (see Boss arenas); on a table with no arena (Kettle) its toy stands in the table's corner pad.
- Quest descriptors: where it happens, title, one short line (story-flavoured, naming the mission).

## Hard rules that outrank the rest

- **The Learn track pays no XP and never reaches the leaderboard.** Nothing in `src/learn/` or the learn
  screens may call `session.addXp`, `api.gradeStage`, `api.completeQuest` or `session.recordProgress`.
  Drill Deck rewards are cosmetic. `verify:learn`/`verify:drills` fail the build otherwise.
- **Nothing turns a backend failure into a sign-out.** `verifySessionToken` returns `null` only for a
  genuinely bad token (transient failures throw `BACKEND_BUSY`); `doPost` answers `UNAUTHORIZED` only
  for that; `callAppsScript` retries 3× and reports `BACKEND_UNAVAILABLE` (503); the `bootstrap` mock
  fallback sets `degraded: true` and omits `player`. `api.js` clears the session only after two
  consecutive `UNAUTHORIZED`. Rate limiting is per account, not per IP.
- **The Sheet is master, localStorage is the cache** for everything non-XP (flags, notebook, practice,
  loadout, marks, commendations, settings, learn copy, saga): one `PlayerState` doc per player, merged by
  `src/shared/statemerge.js` (mirrored in `apps-script/PlayerState.gs`; `union` sections never lose
  data, `latest` sections take the newer). The game plays from localStorage and never waits; sync never
  surfaces errors or touches the session. `/HoloClosed$/` flags don't travel. Sign-out wipes per-player
  state. XP, quest progress, inventory and roster are NOT in the doc.
- **Guest mode (`session.startGuest()`, `session.isGuest`):** saves entirely to `localStorage` and
  never writes or syncs to Google Sheets (`sync.js` ignores guests, and `guest.js` answers account APIs
  locally). Whenever an agent is testing some part of the frontend and they need to pass the login screen,
  they should use guest mode (click `#landing-guest-btn` / `#login-guest-btn` "Continue as Guest" or call `session.startGuest()`).
- **XP:** paid once per stage; flat (no attempt multiplier); hints free; completion idempotent; progress
  never regresses (`Math.max`); a finished quest replays free. Clean-solve streak pays nothing. Guild
  score is a mean (`mean(xp>0) × (0.75 + 0.5×active/roster)`), never a sum, and is never labelled "XP".
  Server XP is authoritative. Read Sheets flag columns through `isTrueFlag`, never `=== 'TRUE'`.
- **Telemetry never invents a reading** (comms CRT shows `NO GUILD TELEMETRY ON THIS CHANNEL` when empty).
- **Nothing occupies the same space as anything else.** Checked against the world actually built
  (`tools/lib/overlap.mjs`), not a table. Parts inside one object are exempt; `phys: 'ground'|'ambient'`
  and decals are exempt by kind; tolerance 0.06 m; elevated structures collide as their supports;
  baked/instanced bodies are measured per part (`userData.partBoxes`).
- **The cursor is never captured** (`requestPointerLock` is a documented no-op); look = drag.
  **One owner for the `X` key** (the `stage.js` window listener).
- **Flat things are drawn flat; spatial things are 3D objects.** A spectrum, graph or plot is a flat picture
  (same `draw*Field` as the canvas bench, shown square-on or as a 2D panel). Where shape or position is the
  idea (orbitals, molecular shape, lattices, scattering) the 3D object is the instrument: a kit stands it up
  with `kit.dress3d` / `fixture3d` / `piece3d` (Tallow's beam bench: a foil frame with nuclei in a wide empty
  pane, and a source block, `lab-props.js` `buildScatterFoil` / `buildBeamSource`). Either way **the
  picture is honest**: what is drawn is what is graded. The 3D and drawn benches expose
  the same API and plan through the same pure functions, so a stage grades identically on both.
- **Atom and particle cards never clip or obscure their contents.** Particle packing (`packCore`) relaxes overlapping grains to enforce visible separation (min distance $\ge 1.76$). Canvas discs and pucks (`paintNucleus`, `paintSpecimen`, etc.) constrain labels, charges, and badges within disc rims (`maxW`, inner radius scaling, bottom capsule foot labels) so text and counts never occlude nucleons or clip circular edges. Concentric electron shells and orbits (`orbitAt`, `shellOrbit`) draw round rings on the mat without tray borders; multi-ring orbits (`q2-core` s4) auto-fill inner shells first; concentric shell zones (`q2-core` s5 `sh1`, `sh2`, `sh3`) resolve drops to the nearest ring radius, allowing free placement across shells while staggering slot phases. Loose electrons are sized at particle scale ($r = R/2 = 2.5$, min $\ge 14\text{ px}$ at phone scale) with hit targets expanded by `GRAB_MIN_PX` in gestures.
- **NEVER have too many things going on.** One decision per stage; only what that decision needs is on the bench
  (a few pieces, one instrument, its one key). No second task stacked on the first, no extra strip, readout, label or
  angle the answer does not use. When a stage is crowded, remove; do not explain. (`q2-core` stage 1 once stacked a
  prediction, a strip and a model choice and was cut back to one: lay a model, fire the beam.)
- **Discover it, never read it off.** No stage asks the player to report what is visible on the table (printed +, labels).
  The property under study starts hidden and an instrument reveals it (`q2-core` stage 3: identical specks, the
  `field` fixture's charged plates, sort by bent or straight). The Tour replaces stage briefings on benches, every
  sentence must earn its place, and a Tour step says what an action is for, not only how to do it.
- **Predict first, in a separate part of the bench.** A prediction is a `predict: true` stage that shows only the
  question and the guesses (cards, tokens, a slot) and NO instrument, tool or runnable control; it cannot be
  submitted blank. The NEXT stage brings the instrument and the locked guess back in its prompt and reward
  (`engine/predict.js`: `remember` in the predict stage's `onClear`, `recall` in getters on the test stage). The
  guess is never graded and cannot be changed after the result. Tallow: `q2-core` stages 1+2 (predict the atom, then
  fire the beam) and `q5-assay` stages 5+6; Lanternfall: `q1-wave` stages 2+3 (predict, then time either lamp, followed by stage 4 timing the other lamp); predict stage rewards are titled "Prediction". `verify:table` ("Predict first") holds it for `unit01`, `unit02` and `unit03`; Bellows and Ember Reach hold the same rule in `verify:learn` and `verify:ember`.
- **What is discovered is held in 3D.** A reward about how something is built carries `reward.model` only where it visually demonstrates the concept (e.g. molecular geometry in `q6-shape`, net dipoles in `q7-polarity`, hybrid lobes in `q8-hybrid`). Non-explanatory 3D animations that merely spin an idle molecule without explaining anything (such as in covalent joins, lattice energetics, gas laws, or thermochemistry across Ligar, Bellows, and Ember Reach) are removed. Visual explainers (`ui/model-viewer.js`, `orbital-3d-viewer.js`, `shielding-explainer.js`, `cuvette-explainer.js`, `ionic-radius-animator.js`, `slice-explainer.js`) must contain NO feature advertisements, instructions ("Drag to turn it"), or narrative paragraph text—captions and readouts are strictly clean labels, formulas, and metric tags. Counts come from the spec; `verify:table` ("Models") checks them. Add models only when a bench or reward visually demonstrates shape, position, or mechanism.
- **The story is the investigation.** One thread per bench: a lead line (`stage-story.js`, plain, on a first stage),
  evidence the bench itself measured, and a `Filed:` line ending the quest's animation that the next bench picks up.
  Only earned words, no jargon, no atmosphere, no invented numbers or events, nothing that restates the lesson.
  `verify:story` fails a caption using a word a later bench introduces.
- **A quest ends on one story animation, which is Vess's debrief** (`src/story/quest-story.js`, painters in
  `src/ui/story-scenes*.js` over the kit `src/ui/story-kit.js`, player `src/ui/story-anim.js`, hooked in `stagerunner.js`
  `next()` in place of the debrief card). 3 to 5 beats, each a line of Vess (at most 2 sentences, 36 words) that
  reviews an idea the quest worked out, said over the part of the scene that shows it (a beat's `to` is where its picture
  ends), then one `Filed:` line that moves the case against the Fifth on. The player steps at their own pace (Next, Back,
  Enter/Space/arrows; Skip or Esc leaves, losing nothing); it plays on every completion, never before or between stages;
  reduced motion and `3D Off` show each beat's last frame. Words: only what the quest has earned, none a later bench
  introduces. A quest with no animation yet still ends on its `DEBRIEF` card. `verify:story` holds it. Built for Tallow (7),
  Lanternfall (10), Ligar (10), Bellows (7) and Ember Reach (8): every quest of those five worlds has one, and `verify:story`
  fails a quest of `unit01`–`unit05` without it. **A scene shows the mechanism, never a decoration:** what the line says is what
  moves, and every number on screen is counted or measured from the drawn thing (Bellows: particles bounce on a phase and each wall
  knock is counted from it, `ui/story-sim.js` `wallHits`, so squeezing or heating raises the gauge for the reason it does on the
  bench; Ligar `ui/story-scenes-ligar-mech.js`: valence dots move between atoms, atoms ride the H–Cl well, water turns in the field,
  16 Lewis dots are placed, ozone's bonds average, domains push apart with the bond angle measured from the drawn arms, and the pi
  overlap of a twisted double bond is the overlap of the drawn lobes; Ember `ui/story-scenes-ember-mech.js`: heat swapped between
  block and water, bond sums as a running total, heat against moles and per mole against per gram, a gas spreading with the
  count of ways drawn; Lanternfall `ui/story-scenes-lanternfall.js`: crests counted at a fixed point, electron drops that
  each draw one spectral line, the four numbers of every electron placed, photoelectron peaks built from electrons leaving
  their rings, nuclear-charge arrows on shrinking radii; Tallow's painters already work this way: atoms built nucleon by
  nucleon, bins and a sliding pivot, a balance counted by atoms). New painters use `story-sim.js`, run on the 960-wide plate the registry scales up, and take `(ctx, w, h, t, clock)`.
- **The comms panel is the only screen bolted to the bench** (`PANEL_LAYOUT`: comms only, fixed position; never animate a panel height).
- **`mountConsole` is the last statement in the Charge Gardens stage render** (it moves the deck into
  CSS3D; later `container.querySelector` calls return null). Use `q()`/`qa()` in `quest.js`.

## Testing

The owner play-tests in the browser; agents do not. Verify with `npm run verify` and its scripts, `npm run build`
(mind `dist/`) and Node checks. An agent may write a Playwright or Node script to check something it is
building, but browser testing is never a planning step, a gate or a definition of done.

## Question bank

All practice lives in `src/learn/bank/<worldId>.json` (shape and ids in `src/learn/bank.js`), never in a quest file.
Each bench: exactly two problems after the debrief (`ui/bench-practice.js`) and, where the bench is computational, one
guided worked problem (`ui/worked-problem.js`: 4 to 8 small steps, typed number or choice, hint, step shown after two
misses). Number steps carry a `calc` expression that `verify:learn` recomputes (`tools/lib/bank-check.mjs`). The `end` set
closes the world and may be thin or empty for a quest. Everything is skippable, gates nothing and pays no XP. Ids
(`<quest>#<n>`, `#b1`/`#b2`, `#w`) are never reused: mastery is stored by id.

## Retire by archiving

Never delete code, docs or checks that were once real. Move them under `archive/<date>/` (paths mirrored, with
a README saying why) or `docs/archive/<date>/`, and cut their wiring out of the live tree. Nothing under
`archive/` is built, imported or verified.

## Build and verify

- `npm run dev` (Vite :3000 with API middleware) · `npm run build` (empties gitignored `dist/`; keep
  source art in `public/`) · `npm run verify` before shipping.
- `vercel.json` configures API proxy rewrites, SPA catch-all routing (`/(.*)` -> `/index.html`), and cache-control headers (`index.html` must-revalidate, `/assets/*` immutable).
- PWA manifest (`<link rel="manifest" href="/manifest.webmanifest" crossorigin="use-credentials">`) sets `crossorigin="use-credentials"` so Vercel Preview Deployment Protection (SSO) does not redirect uncredentialed manifest fetches to `vercel.com/sso-api` with CORS errors.
- Chunk invalidation recovery: `vite:preloadError` in `index.html` and chunk error traps in `curriculum.js` / `learn-quest.js` automatically reload with a debounce timestamp when dynamic module imports fail due to mid-session deployments replacing chunk hashes.
- `verify` = `verify:quest` (20 Charge Gardens stages, chem card ≤3 sentences, copy mirrors in
  `api/[...route].js` + `Quests.gs`), `:console`, `:learn` (registry, no-XP, practice sets, grading
  tables recomputed from real data, plates drawn in Node, hint/prompt/legend/leak rules, encounter layer),
  `:table`, `:story`, `:sync`, `:drills`, `:docs` (PRODUCT.md counts vs the registry, retired wording, paths that must exist), `:galaxy`, `:run` (every quest mounts and every stage runs), `:geometry`
  (all 20 reaction animations), `:media`, `:flows`, `:progression`, `:ship`, `:voyage`, `:tallow`,
  `:ligar`, `:lanternfall`, `:bellows`, `:ember` (each builds its real world in Node and checks overlap,
  buried bodies, walkability flood-fill, lamps-only-lit, shader patches; `:ligar` also holds the mine:
  doorways, grades, rock over every roof, bays inside chambers, hills unclimbed, the guide's route, walls
  that hold, lamps in every working, the cover mask), `:arena` (the boss table's ground in all five worlds, the five boss bodies, the look up), `:bench` (every built instrument
  on its real bench at six aspects, real pointer paths, foe bodies, and the bench bay in all five worlds), `:holo`, `:normals`, then `build`.
- Other: `deploy:backend` (clasp), `bake:stills`, `bake:video`, `seed`, `test:load`.
- Test hooks: `globalThis.__LQ_TEST__` is read in `stagerunner.js`/`plates.js` and inert without it.

## Where the rest lives

The cross-world AP check (built track and `docs/plans/learn-quests.md` against the current CED, with the corrected topic map, the AP topics with no quest yet, and the scope labels) is `docs/AP-coverage-audit.md`. The plan's own CED numbers are the old ones (the CED now ends Unit 7 at 7.12, Unit 8 at 8.11, Unit 9 at 9.11).

How to build and audit a Learn world, the pitfall ledger and each world's open items are in `PRODUCT.md` ("Building a Learn world"). Per-world build records, per-bench decisions and layout traps (moved out of this file on 2026-10-29) are in `docs/engineering/engine-and-worlds.md`. The per-world audits are in `docs/archive/2026-10-29/`.


Architecture, the Learn engine, tabletop layout rules, per-world notes, the 3D worlds and ship, mobile, the player
journey and progression are in `docs/engineering/engine-and-worlds.md`. Plans and per-world records are in
`docs/plans/`. Retired code is kept, not deleted, under `archive/` (never built, imported or verified). Old
versions of these docs are in `docs/archive/`. Orientation in one paragraph: `src/main.js` boots the stage, HUD and
hash router; `src/screens/` holds DOM screens (`bridge.js` announcement); `src/learn/` holds the Learn track (curriculum registry, quests, the `Tabletop` engine over
`table/kits/`); `src/quest3d/` is the Charge Gardens; `src/three/` is the persistent WebGL stage and the worlds (club meeting announcements and star map promo in `materials/textures.js` `createClubHoloTexture`);
`api/[...route].js` is the Vercel proxy and `apps-script/` the backend.

## Aesthetic — "SCOURED PLATE" (mandatory)

Hardware that has been in the dust forty years and still works. Read `src/styles/tokens.css` first.
1. Surfaces obsidian and titanium (`--plate-000…600`, faint cool cast). Warmth from text and filament.
2. **Light is filament, not LED:** nothing blooms. `box-shadow: 0 0 20px <colour>` is banned except true
   lamps (`.gfx-dot`, `.stage-dot.active/.completed`). 3. **Amber is a signal, not a surface.**
- **Banned:** neon/synthwave glow, electric cyan, glossy blue glassmorphism, candy gradients, rounded
  corners (`--radius-sm` is 0; `--radius-full` the only non-zero), emoji in markup, Tailwind-default hexes,
  auto-fit "feature card" grids, arrow glyphs in keys, `//` decorative markers, fake status readouts.
- Geometry: `.plate`/`.glass-panel`/`.holo-card`/`.stage-prompt-card` share one clean bezel treatment
  (durasteel 1px border, inner highlight hairline, deep ambient shadow); seams `--seam-light/dark`.
- Colour: text `--text-primary #dcd6cc`; `--text-muted #8c8376` must stay ≥4.5:1 on `--plate-200`;
  signals `--accent-amber #e59b24`, green `#78a142`, danger `#b8382c`. Charge red `#ff1744` / blue
  `#00b0ff` are reserved for the 3D chemistry; in chrome only as printed ink on a hairline. HUD badge
  livery comes from `TEAM_LIVERY` in `main.js`, never sheet `accent_hex`.
- Type: Quantico everywhere (JetBrains Mono fallback for telemetry), crisp, no blurry shadows.
- Components: `.btn-primary` amber switch, `.btn-secondary` durasteel, `.quest-btn-sm` (labels 1–2
  words, with `btn-secondary` or `btn-primary`), `.form-input` recessed well (no placeholder examples),
  banners `.form-banner` / `.stage-error-banner` with a `!!`/`//` mark, `.scan-readout`.
- **Copy discipline:** the interface does not advertise itself. Delete any string that isn't a label, a
  rule, an error, something taught, or story. No "COMMS LIVE" claims. Screens carry no subtitle unless the
  one-line quest descriptor. Teaching and story copy are exempt from trimming-for-length, not from rules.
- **Layout:** `--hud-h` is the fixed header height; nothing slides under it. Screens outside a bench or a world must work in portrait at 375 px; benches and worlds may require landscape (game mode locks it).
  Three.js scenes keep to the plate/glass rules enforced by `verify:bench`.
