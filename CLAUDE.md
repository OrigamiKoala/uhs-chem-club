# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal. Its audience is middle- and
high-school students who know little or no chemistry, so the product rule that outranks
everything else is: **teach through play, reveal vocabulary last — then use it.** A player
draws lines between glowing regions for twenty stages and only meets the words "electron",
"curved arrow" and "steric hindrance" in the epilogue, after the intuition is already built.

**Withholding a word is a schedule, and the schedule is SHORT.** A player must be able to
arrive knowing virtually nothing, so nothing may be named before it has been done and
nothing may arrive faster than about one new idea per stage: introducing "nucleophilic
aromatic substitution" at stage one, to someone who has not met a molecule, is a broken
stage rather than a hard one. But once a reward card has named a thing the player has
already worked out, **that word is the word the game uses** — in the prompt, the hints, the
widget labels, the readouts and the refusal messages, not only on the explanation card.

**A withheld word is usually replaced by a HARDER one, and that is the failure mode to
watch for.** Every Unit 1 bench once ran a second, invented vocabulary so it could avoid
the real one: *light piece*, *marked grain*, *SPEC A*, *REF 03*, *CRATE 22*, *VIAL B*,
*Manifest 09*. A twelve-year-old holds "electron" more easily than "light piece", because
"electron" is a word they will hear again and "light piece" is a private code they must
maintain alongside the chemistry. So a word is withheld for **one stage** — long enough for
the player to find the thing, never long enough for the game to be talking in cipher — and
the fallback name is the plainest English available (*grain*, *cluster*, *layer*), never a
coinage. Discover, then name, then use, and do it inside two stages.

**Story is a frame, not a puzzle.** Erebus is the model: one transmission at the start, one
at the end, and in between a prompt that states the task and nothing else. Tallow used to
open every stage with a typewriter modal about an inbound buyer, a prospector's claim, a
corrosive cleaner eating its seal or a tester cell with two charges left, and the player had
to decode the fiction to find out what they were being asked to do. A bench stage now
carries **one briefing on stage one** — what the instrument is and what its tools do — and
every other stage is prompt, tools, answer. `frame.js` renders the `Objective` key only when
a stage actually has a briefing, because a key that opens an empty modal is a key that lies.
Samples are `SAMPLE A`, `SAMPLE B`, `SAMPLE C`, restarting at A on every stage: a player
should never be tracking which of CRATE 41 and SPEC R is the one under discussion.

**Two rules sit beside it and are enforced the same way.**

**Nothing is NAMED without being explained — including the instrument's own words.** The
vocabulary schedule governs the chemistry; this governs everything else the player has to
touch. "Read the needle", "load the rings", "the ring counters on the deck" and "set the
field" are clear sentences addressed to somebody who has already used the bench, which is
the one reader this product is not for. So every control a stage offers carries one plain
sentence saying what it does, drawn under the keys and left there for as long as the stage
offers it — never a tooltip, never once on first use, never only inside an earned hint. A
quest exports `toolNoteFor(controlId, stageNumber)`; `engine/frame.js`'s `toolNotes()`
draws it; `verify:learn` fails the build over a control with no line and runs every line
through the same withheld-vocabulary gate as a prompt. **A legend is one short sentence**,
under about eighteen words; it is a key legend, not a manual. A tool's line may change as
words are earned: the needle's says "light pieces" until the stage after electrons are
named and "electrons" from then on. When a prompt, hint or refusal names a control, it
quotes it — `Press "Fire Beam"`, `Press "The middle"` — so the sentence cannot be read as
prose. Key labels obey all of this too: the core bench's three views read **Whole piece /
The middle / Outside** under **View**, not Whole / Core / Rings under "Field".

**A hint rung is ONE sentence.** Rung 1 says what to do with the tool, rung 2 says what to
look at or compare, rung 3 gives the answer plainly — and where there is arithmetic, rung 3
shows the actual sum (`(0.2 x 10) + (0.8 x 11) = 2 + 8.8 = 10.8`), never the method alone. A
three-clause hint is a paragraph a stuck player has to parse before they can use it.

**A stage must be solvable by somebody who does not already know the answer.** This is the
test every bench stage has to pass and the easiest one to fail, because the author knows
the chemistry. A stage only a player who already knows can finish is not teaching, it is
checking — and it is checking the one thing this audience has not got. The evidence has to
be ON THE BENCH, not in hint rung three: stage 3 of `q2-core` carries an open reference
reading plus two with six protons and four electrons, which is what makes "the needle reads
protons minus electrons" a discovery rather than an assertion, and stage 6 is answerable
because the sample with the extra neutron has a visibly identical outside and stage 5
established that the outer shell decides behaviour. Hints point at that evidence; they are
not a substitute for it.

A Learn quest publishes its own schedule — `VOCABULARY` in `src/learn/quests/unit01/q1-grain.js`
and `q2-core.js` are the worked examples, mapping each gated term to the stage whose reward
card introduces it. `verify:learn` fails the build both ways round: a term used one stage
early, and a term the schedule promises that no card ever delivers. Every built Unit 1 quest
now publishes one; `WITHHELD_VOCAB` in `tools/verify-learn.mjs` holds only what a quest has
yet to earn, so words an earlier bench taught (atom, element, compound, mixture, proton,
neutron, electron, shell, valence, isotope, ion) are plain words downstream and using them
is the rule rather than a leak. `PRODUCT.md` §Product Principles 1 is the product-level
statement of all of this.

`PRODUCT.md` is the companion record: durable product truth — who plays, what the product
is for, what is confirmed versus deliberately undecided, and what future work must not
fabricate. This file stays the engineering and aesthetic reference; PRODUCT.md answers
"what is true about the product" without repeating implementation. Two facts it pins that
nothing here states: Avalon is **pre-launch** (no real accounts, XP or play data exist),
and the one confirmed device floor is **375 px**, with no formal accessibility standard
agreed beyond it.

`DESIGN.md` is the machine-readable half of the aesthetic. The "SCOURED PLATE" brief in
§Aesthetic below stays the prose authority; DESIGN.md carries the same world as extracted
tokens (34 colours, 5 type roles, the shadow and motion vocabulary) plus named rules, and
`.impeccable/design.json` carries drop-in HTML/CSS for ten primitives. Two facts it pins
that the prose below gets wrong: the chamfer has **two grades** — panels are relieved at
top-left *and* bottom-right (`.plate`, `.glass-panel`, `.scope-plate`), cards at top-left
only (`.holo-card`, `.stage-prompt-card`) — and `--radius-full` is the one non-zero radius.

## Build and Run
- `npm run dev` — Vite dev server on port 3000 with the API handler mounted as middleware.
- `npm run build` — production assets into `dist/`.
- `npm run verify` — `verify:quest` + `verify:console` + `verify:learn` + `verify:geometry`
  + `verify:media` + `verify:flows` + `verify:ship` + `verify:tallow` + `verify:bench`
  + `verify:holo` + `build`. Run this before shipping.
- `npm run verify:quest` — static integrity check of all 20 Quest 1 stages (see below),
  including the per-stage chemistry card and its three-sentence ceiling.
- `npm run verify:console` — solves the T4 chamber console's fit at fourteen viewports and
  asserts the ceiling the desk is held to: one surface, low, never more than 25% of the
  height of the glass.
- `npm run verify:learn` — integrity check of the Learn track registry, its no-XP
  invariant, and the practice sets (five per built quest, assembled at world scope).
- `npm run verify:geometry` — runs all 20 reaction animations headlessly and checks the chemistry
  on screen (see "Chemical realism" below). `--verbose` prints atom positions at every step.
- `npm run verify:media` — validates media manifest against assets and size budgets.
- `npm run verify:flows` — end-to-end smoke test of the API a new student touches.
- `npm run verify:ship` — asserts ship graph connectivity, 3-hop limit, hatch cones, and
  spline bounds, then **builds the Avalon and Erebus in Node** and asserts that nothing
  in either occupies the same space as anything else.
- `npm run verify:bench` — deploys BOTH Unit 1 instruments onto the real Tallow benches in
  Node and measures them: every site faces the ground the player walks in from, and every
  screen, station and control lands inside the glass at six aspects, clear of the HUD. It
  also drives `aimForChrome` — the camera correction a deployed bench applies — and asserts
  it converges with the station screens under the frame and the wells still in view; and it
  measures every station stand against the world it is standing in, in the BENCH's own
  frame and per mesh (a world AABB of a 4.8 m back lip on a rotated site says everything
  hits everything). That check found every screen stand seated inside a swarf chip.
- `npm run verify:holo` — one owner for the `X` key, and the comms board never invents a
  guild score.
- `npm run verify:tallow` — asserts the Tallow ground: every prop footprint disjoint
  (no two objects share space), sites clear of props, the sub-level excavation walkable,
  every charted Unit 1 quest sited, T4 decoration removable without stranding a site,
  and no campaign vocabulary in a place name. A SITE LABEL IS A SIGNPOST, so it names the
  bench's topic — `Bench 3 - The Periodic Table`, not `Catalogue Vault` — and the checker
  only holds it to the Erebus withheld list and a six-word ceiling. It also **builds the
  real world in Node**
  behind `tools/lib/dom-shim.mjs` and measures every pair of objects in it.
- `npm run deploy:backend` — `clasp push` of `apps-script/`.
- `npm run bake:stills` — regenerate the static SVG backdrops in `public/fallback/`.
- `npm run bake:video` — encode raw MP4 clips in `assets-src/video/` to web-ready WebM, MP4, posters and audio.
- `npm run seed` / `npm run test:load` — roster seeding and 40-user concurrency sim.
- `tools/hunyuan3d-shape-t4.ipynb` — Kaggle T4 batch shape generation (Hunyuan3D 2.1 shape-only pipeline, ~10 GB VRAM).

## Architecture

### Client (`src/`)
- `main.js` — boots the 3D stage, HUD and router immediately, then fetches `bootstrap`
  in the background so first paint never waits on the network.
- `router.js` — hash router. `ROUTES` declares auth/admin gating; `ROUTE_NAV` maps a route
  to the HUD nav button that should light up; unknown hashes normalize to `#/`. Closes any
  open modal and exits the quest scene on navigation. `PARAM_ROUTES` holds the patterned
  routes (`/learn/:worldId`, `/learn/:worldId/:questId`), matched only after an exact hit
  fails and handed to the render function as `params`; leaving a Learn quest route calls
  `disposeLearnQuest()`.
- `session.js` — token, player, team, XP, inventory, progress, flags (`hasFlag`, `setFlag`) and
  Learn-track progress (`learn`, `recordLearnStage`, `markLearnQuestComplete`, `setLearnState`
  — kept apart from `progress` because that is what the server pays XP against), persisted in
  `localStorage` and restored synchronously at boot. Exports `levelForXp`, `levelProgress`
  and `levelTitle` — **the only XP curve in the client** (45·(N−1)² per level, capped at
  level 12 to match `Scoring.gs`). Server XP is authoritative: `setUserData` overwrites the
  local total unless called with `{ trustXp: false }` (used by `player/create`, which does
  not return a real total).
- `api.js` — thin POST wrapper; clears the session on `UNAUTHORIZED`.
- `ui/layout.js` — `pageHeader`, `statRow`, `stepRail`, `emptyState`, `esc`. **Every screen
  builds its header from `pageHeader`**; do not hand-roll banner/title markup. Supports ambient
  video loops via `video` parameter.
- `ui/modal.js` — `showModal` / `closeModal`, with focus handling and Escape to dismiss.
- `ui/toast.js` — transient messages; the `type` maps to `.toast-success/-error/-warning/-info`.
- `ui/transmission.js` — diegetic CRT transmission typewriter component with Vess murmur, looping video, and dynamic text updates.
- `ui/gardens-map.js` — 20-pylon status visualization for Bridge and Quest screen HUD.
- `ui/cinematic.js` — fullscreen cinematic player with subtitles, frozen end-frame 1.1s fade-out, audio fade, and T1 / reduced-motion fallback.
- `audio/soundscape.js` — zero-dependency Web Audio procedural soundscape (room tints,
  relays, bond snaps, Vess murmur, volume controls; continuous drone disabled).
- `story/quest1.js` — single source of truth for Quest 1 narrative, pylon communications, onClear logs,
  and cinematic cutscenes (`cold_open` in onboarding, `launch`, `erebus_descent`, `pylon_wake`, `gardens_restored`, `item_award`).
- `story/trinkets.js` — Session Zero deterministic d20 cosmetic trinkets and character backgrounds.
- `media/manifest.js` — media manifest mapping 19 loops and cinematics with WebM, MP4, posters, and captions.
- `learn/` — the Learn track (see "Learn track" below): `curriculum.js` (the registry of
  worlds and quests, pure data, and `PROBLEMS_PER_QUEST`), `progress.js` (gating and
  completion, XP-free), `practice.js` (the optional problem set a world ends on),
  `worlds/unitNN-*.js` (one chart per AP unit), `quests/` (a game module per quest, plus
  `_template.js`, the contract).
- `screens/` — one render function per route, all pure string templates.
- `three/` — persistent WebGL stage, quality-tier probe (T4/T3/T2/T1), ship interior, camera rig.
  `stage.js` holds three modes (`ship` | `world` | `quest`) and `activeWorld`, which is
  whichever planet the player is standing on — Erebus (`world.js`) or Tallow (`tallow.js`).
  Tone-mapping exposure is per place: `SHIP_EXPOSURE` 1.28 for the ship and Erebus,
  `TALLOW_EXPOSURE` 0.92 for the salt pan, because a bright overcast rendered at the dark
  interior's exposure washes the crust out to paper. The renderer's shadow map is enabled
  at T4 only; every world light already asked for shadows and none were drawn before.
- `three/tallow.js` — **Tallow**, Learn world 01 (see "Tallow" below), built from
  `three/world-data/tallow.json` with PBR surfaces from `materials/tallow-textures.js`.
- `quest3d/` — reusable containment chamber, `MOLECULE_DATA` (atoms, bonds and the
  pickable `regions` that double as anchor definitions), `InstancedMesh` renderer,
  MarchingCubes charge-density isosurfaces, and `evaluator.js`.
- `fallback2d/stages.js` — DOM-only inputs for Tier 1, producing the identical payload
  contract. Anchor labels are generated from region position and intensity
  ("Blue zone 2 — bright, lower right") so a player with no 3D view can still choose.

### Quest data — one source of truth
`src/quest3d/evaluator.js` owns the player-facing copy and the answers. It is in two
layers: `STAGE_CONFIGS` holds geometry, expected anchors, tolerance (tight 0.85 unit radius
preventing overlap with neighbouring atoms) and reaction
animation, and `STAGE_COPY` holds everything the player reads — `shape`, `prompt`,
the three-rung `hints` ladder, the per-site `scans`, the `concept` card plus its
`conceptTiming`, and the `chem` card.

**`concept` and `chem` are two different cards and the difference is the product.**
`concept` with `conceptTiming: 'intro'` teaches the CONTROLS and appears before the stage
— stages 1 and 11, and nothing else. `chem` teaches the CHEMISTRY, appears only after the
solve, and is the one place in the campaign before the epilogue where the withheld
vocabulary is used on purpose: nucleophile, electrophile, carbocation, SN1, SN2, angle
strain, the real words for what the player has just done. Every stage has one, it is
capped at **three sentences**, and `verify:quest` fails the build over both rules — over a
chem card that runs long, and over an intro card that has started explaining chemistry.
This replaced a single end-of-quest lecture; dropping it in bits, after the work, is the
whole point. `STAGE_COPY` is folded onto `STAGE_CONFIGS` at module load so the
writing can be edited as writing; `cfg.hint` stays as an alias for `hints[0]` because
the backend has one `hint_text` column. Also exported: `evaluateStageLocally`,
`diagnoseMiss`, `scanFor`, `scansForStage`, `TOTAL_STAGES` and `TOTAL_QUEST_XP`.
Grading happens **in the browser at 0 ms**; the server call is fire-and-forget telemetry.
`CANONICAL_STAGES_20` in `api/[...route].js` and `DEFAULT_STAGES` in `apps-script/Quests.gs`
mirror the same titles and prompts — `npm run verify:quest` fails if they drift.

### API proxy (`api/[...route].js`)
Vercel catch-all. Performs `crypto.scrypt` password derivation (never sends plaintext to
Apps Script), rate limiting, salt caching, team-id normalization, and a 60 s in-memory cache
for public routes (including `team/roster` with graceful local fallback). When `APPS_SCRIPT_URL` is unset it falls back to `localDevHandler`, a
full in-memory mock of the backend — including the once-per-stage XP rule, so dev behaviour
matches production. Guild switching in `onboarding.js` is optimistic at 0 ms with client-side roster caching and background prefetching; mounts Vess recruit introduction and guild briefings via looping `vess_transmission` CRT video.

### Staying signed in — the rule that outranks the rest of the transport
Apps Script is not a reliable service. Under load, or when Google's serving layer
hiccups, `/exec` answers with an HTML page ("Page Not Found", a quota notice) instead
of JSON, and Sheets reads fail with "timed out" or "Internal error". Every one of those
is **transient and retryable**. None of them is evidence that a player's token is dead.

**Nothing may turn a backend failure into a sign-out.** Four places enforce it, and a
change to any one of them can silently reintroduce the bug where students were thrown
back to the login screen mid-quest:

1. `Auth.verifySessionToken` returns `null` **only** when the token is genuinely invalid
   (bad signature, expired, revoked, banned, missing player). If the *lookup itself*
   fails it throws `BACKEND_BUSY`. It used to swallow every error and return `null`,
   which made a slow Sheets read indistinguishable from a forged token.
2. `Main.doPost` answers `UNAUTHORIZED` only for that `null`. Anything whose message
   looks like a transient Google failure (`isTransientServiceError_`) is relabelled
   `BACKEND_BUSY`.
3. `callAppsScript` retries 3× with backoff on a timeout, a 5xx, a non-JSON body or a
   `BACKEND_BUSY` reply, each attempt capped at 9 s, and reports what is left as
   `BACKEND_UNAVAILABLE` (HTTP 503) — never `UNAUTHORIZED`, never `INTERNAL_ERROR`. The
   deployment checklist goes to the server log; the player sees one short sentence.
4. The `bootstrap` fallback to `localDevHandler` sets `degraded: true` and **omits**
   `player` rather than sending `player: null`. The mock has an empty roster, so it
   cannot know who is signed in; `main.js` clears the session only on a non-degraded
   `player === null`. This was the main cause of the random logouts — every Apps Script
   hiccup returned the mock, and the mock said nobody was logged in.

`api.js` adds the last backstop: `session.clear()` takes **two consecutive**
`UNAUTHORIZED` replies, and any success resets the count. Network failures and
unparseable responses throw `NETWORK` / `BACKEND_UNAVAILABLE` and never touch the session.

**Latency.** Every `Db.find*` reads a whole tab, and one request did it many times over.
`Db.getAll` memoizes per execution (`_rowCache`, dropped by `append`/`update`; globals do
not survive between Apps Script invocations, so it cannot serve another request stale
data), and a verified session is cached for `SESSION_CACHE_TTL_SEC` (180 s) under
`sess:<jti>`, so a signed-in player no longer pays a Sessions scan plus a Players scan on
every call. The cost is that a ban lags by up to that window; `revokeSession` drops the
key so logout is immediate. On login, the proxy re-fetches the salt and re-derives only
when the backend actually said `INVALID_CREDENTIALS` — retrying a hiccup there doubled an
already slow sign-in with a second scrypt pass.

**Rate limiting is per account, not per IP.** A club signs in from one school network, so
a per-IP cap locked the room out of its own portal. Sign-in allows 10/min per identifier
with a loose 150/min per IP to blunt a spray across many accounts.

### Backend (`apps-script/`)
`Db.gs` (Sheets DAO), `Auth.gs`, `Players.gs`, `Quests.gs` (manifest, grading, hints,
completion), `Scoring.gs` (normalized leaderboards, level curve, level titles),
`Items.gs`, `Events.gs`, `Main.gs` (router + `setup()` for one-click sheet init).

## Learn track — ten worlds, one per course unit

A second road beside the campaign, reached from the LEARN nav tab (`#/learn`).
Ten worlds in order — Atoms, Molecules, States of Matter, Stoichiometry and Reactions,
Equilibrium, Acids and Bases, Gases, Thermodynamics, Kinetics, Nuclear Chemistry — and
**every Learn quest is a game built the way the Charge Gardens was built** — it owns its
stages, its 3D scene, its inputs and its grading. The plan and the authoring steps live in
`docs/plans/learn-track.md`.

**Every world ends on a set of practice problems** (`src/learn/practice.js`): five per
built quest, gathered across the whole unit and shown once every bench in it has been
worked. They are optional, skippable a question at a time or all at once, and they GATE
NOTHING — the next world opens on the last quest's completion whether or not a single
question is answered, because gating is `worldProgress`, which knows nothing about
practice. They are offered once automatically (a `learnPracticeOffered:<worldId>` session
flag) and come back for ever through a **Problems** key beside a finished world on the
star map, on the Learn road, in the world brief and in the walk HUD. They are a **2D
overlay on every tier**, including T4: this is the player's own revision, not a
transmission, and no instrument in the fiction asks multiple-choice questions.
`verify:learn` asserts five well-formed problems per built quest, that each names an
answer that is one of its own options, that each carries an explanation, and that nothing
is offered on an unfinished world. **Leaving the whole set is one press, in the corner.**
The card carries a `Close` key in its top-right beside the `n / total` tag and a `Skip
All` key in the row; both call the same `finish()`, and `Skip This One` is the only key
that advances a single question. A player who wants none of it must never have to press
Skip five times to escape something that gates nothing.

**The rule that outranks the rest: the Learn track pays no XP and never reaches the
leaderboard.** Nothing in `src/learn/` or the three learn screens may call `session.addXp`,
`api.gradeStage`, `api.completeQuest` or `session.recordProgress`; `verify:learn` fails the
build if one does. The backend writes to the `LearnProgress` tab, which
`Scoring.computePlayerTotalXp` does not read, and the proxy keeps `localStore.learn` apart
from `progress` and `submissions`. A study road that moved Standings would turn learning
into grinding and would punish the students it exists to help.

- **Registry** — `src/learn/curriculum.js` is the single source of truth for what exists:
  `WORLDS` (sorted by `order`, with derived counts), `ARENAS`, `getWorld`, `getQuest`,
  `allQuests`, `loadQuestModule`. Pure data and pure functions — no DOM, no three.js, no
  localStorage, because the proxy and the verifier import it too.
- **Charts** — one file per world in `src/learn/worlds/`. A world's `status` is **derived**,
  never declared: it is `live` exactly when one of its quests has a module.
- **Gating** (`src/learn/progress.js`) — world 1 is always open, world N opens when N-1 is
  complete; quest 1 is open with its world, quest N opens when N-1 is complete. Charted
  (unbuilt) entries are transparent: an unbuilt world between two built ones must not seal
  the road, or world 2 would wait on the whole curriculum.
- **The quest contract** — `src/learn/quests/_template.js`. A module exports
  `mount(container, ctx)` and returns `{ dispose }`. `ctx` carries the world, the quest,
  `stagesCleared`, `isComplete`, `reportStage(i)`, `reportComplete()` and `exit()`.
  `screens/learn-quest.js` checks the gating, loads the module, and is the wall between the
  track and the XP rails.
- **The engine** (`src/learn/engine/`) — content-free pieces every bench quest composes.
  `scope.js` is the **sampler scope**: a canvas instrument with a 1–6 power dial
  (`detailFor` walks 0 solid → 1 mottled → 2 lumps → 3 individual pieces, and past a
  sample's `floorPower` nothing new resolves), a probe that reports a catalogue code, mass
  and size meters and *how many* pieces hold this one but never which kinds, a cutter and a
  shaker. Samples declare `particles: [{ kinds, n }]` — a one-entry `kinds` is a loose
  piece, longer is a bound cluster, and an entry needing a real backbone supplies its own
  `geom` and `bonds` (H–O–O–H is a chain; drawing it as a star would be the instrument
  lying). **Every tool re-pours its sample first**, or a player who cut a crate and then
  shook it would see the fragments band and wrongly call it mixed. At T3 and below this runs
  on canvas and holds at 375 px; at T4 the same declarations build the instrument on the
  bench (`scope3d.js`), through the same planners, to the same answers.
  `corebench.js` is the **core bench**: one piece shown in three fields — `whole` (a haze
  with the core drawn to scale, which is a speck), `core` (the grains separated and
  probeable, marked ones told apart by a stencilled cross and never by colour) and `rings`
  (light pieces at fixed radii). It carries a beam whose return counts are fixed by which
  track hits the axis rather than by a threshold on a spread (drawn with high-contrast
  through-tracks, bright #e0982b rebound beam, and central impact spark), a stripper that knocks
  one light piece off the outermost ring, and a reset. It knows no chemistry: a mark is a mark,
  and what a specimen *does* (`behaviourOf`) lives in the quest.
  `frame.js` is the **quest frame**: stage rail (cleared lamps are
  walkable — there is no XP here for a replay to farm; 44px touch strips on mobile), diegetic
  Exit and Findings review buttons, a briefing and debrief stepper
  mounted via `createTransmissionElement` (diegetic CRT video loop, typewriter audio ticks and
  Vess radio murmur), prompt, readout, answer region, Commit key, miss banner, hint ladder (rung 1 free,
  rung 2 after a miss or 45 s, rung 3 after two misses; copy accurately conveys both paths), and reward card.
  Supports soft refusals via `{ ok: false, notYet: true, msg }` routed through `frame.note()` without burning hint rungs.
  It never sees an answer; the quest calls `clear()` or `miss()`.
  **A BRIEFING IS A QUEST'S, NOT A STAGE'S.** Every built Unit 1 quest carries exactly one —
  on stage 1, at most 2 sentences, saying what the instrument is and what its tools do — and
  every other stage opens straight onto prompt, tools and answer. A briefing per stage meant a
  typewriter modal between the player and the bench eight times in a row, each one wrapping the
  task in a business situation they had to decode first. `setStage` therefore renders the
  `Objective` key only when `stage.briefing` exists, since a key that opens an empty modal is
  a key that lies. Prompts state the objective in one plain imperative sentence and leave the
  route to the player. Real chemistry lands immediately after each stage on its reward card
  (Quest 1: atoms, elements and mixtures, atomic mass, indivisibility, molecules, compounds,
  separation, classification; Quest 2: nucleus, protons/neutrons/electrons, neutrality,
  shells, valence, atomic number and isotopes, ions, the three ways matter can differ) so
  learners connect what they just did to the chemistry instead of waiting for an
  end-of-quest lecture.
  In `scope.js`, single-unit samples (`total <= 1`) are centered at `[0, 0]` so high-magnification targets
  remain visible in the aperture.
- **The power control is a knob, and on a built bench it is a knob you can reach.** A
  magnification setting is a thing you turn, never a minus key with a number beside a plus
  key. There are two of them and they are the same control:
  - `engine/dial.js` draws it on the panel — a milled cap with an engraved index and
    detents cut round its collar over a 270 deg sweep, turned three ways: drag it round
    (pointer capture), focus it and use the arrows / Home / End, or roll the wheel on it.
    That third and second path are why it is usable on a trackpad and visible to a keyboard.
  - `buildPowerDial()` in `engine/bench3d.js` builds it as REAL GEOMETRY on a raked plinth
    bolted to the plate — knurled cap, lit index, one notch per step with long stops at
    each end, and a generous invisible hit target so it can be grabbed at a glancing angle.
    `SampleScope3D` mounts it outboard of the leftmost station (so it keeps the same place
    in the player's VIEW whether a stage lays out one crate or four) and registers it with
    `BenchViewer3D.addGrabbable`, which hands a press to a control before it hands it to
    the view — a knob and a camera swing are the same gesture, so whichever the pointer
    went down on has to win.
  - **They cannot disagree.** Both call `angleFor` / `valueForAngle` from `dial.js`, which
    is the single implementation of where a detent is. A quest passes `onPower` once; the
    drawn instrument ignores it and the built one reports through it, and both end in the
    quest's own `setPower`.
- **A BUILT INSTRUMENT SHOWS A FLAT PICTURE.** The bench, the wells, the crate of bulk
  matter in them and the power dial are real geometry the player leans over — and what the
  instrument RESOLVES is drawn in two dimensions on a **raked screen standing behind each
  well** (`buildStation` in `engine/bench3d.js`), by the same `drawScopeField` /
  `drawCoreField` that paint the canvas instrument. Three bugs became this one rule: a
  microscope's output is a flat image, so pieces rising out of a hole as the dial came up
  read as the crate inflating; a core is a huddle, so staged as spheres in a well half its
  grains sat behind the other half and a player told to COUNT them counted five of six and
  was refused by an instrument that never showed them the sixth; and a light piece staged
  at ring scale was a speck indistinguishable from the dust of the planet behind it. Drawn
  flat, every piece is in the picture, in one place, at a countable size, on every tier —
  which is also what keeps a hint that names a position honest on both benches.
  **AND THE PICTURE IS HONEST ABOUT WHAT IS IN IT.** What a field draws is what the quest
  grades against. `fieldRings` in `corebench.js` used to draw the nucleus as ONE marked
  disc with ONE cross on it — a picture of a specimen holding a single marked grain — so
  from the stage the rings field takes over, every specimen on the bench looked identical
  and looked wrong, and a stage reasoning about how many marked grains were in there was
  arguing with its own screen. It is drawn small, because at ring distances it is small,
  but it is drawn as the same huddle `fieldCore` resolves, in the same proportions and
  the same packing. Picking
  goes through `BenchViewer3D.screenUnderRay()`, which hands back the press in the screen's
  own pixels so the 3D bench runs the identical `hitTestField` / `hitTestCore`.
- **Deployed, the instrument is AIMED into the open glass, never skewed into it.** On a
  walkable world the quest frame stays a page over the view (`deployPanels` returns early
  when the bench is built), so the top of the glass belongs to the header, the stage rail
  and the tool plate. `fitDeployedAim` / `aimForChrome` in `bench3d.js` measure how far down
  the middle of the view that chrome reaches and pitch the camera UP until the tops of the
  screens clear it — which slides the whole bench down into the empty glass without moving
  the camera, so how steeply the player looks into the wells is unchanged. `fitToOpenArea`'s
  `setViewOffset` is still the answer for a bench that builds its own room, and must never
  be used on the world camera: it would re-frame the whole of Tallow. `verify:bench` drives
  `aimForChrome` at six aspects and fails the build if a screen still runs under the frame
  or a well is aimed off the bottom.
- **A briefing never blacks out the bench it is describing.** `#modal-container` normally
  paints a near-opaque scrim over the whole glass, which is right for a dialog over a page
  and wrong over an instrument: the transmission telling the player to read the needle on
  all four specimens was itself the thing hiding all four. `screens/learn-quest.js` sets
  `body.bench-deployed` whenever the player is at a bench built in the world, and the rule
  under it in `learn.css` docks the card down the left of the glass at `min(430px, 44vw)`
  and drops the scrim to 34%. The bench then comes out from behind it by the SIDEWAYS twin
  of the aim above: `fitDeployedAim` measures the docked card and `aimForClear` /
  `setAimShift` walk the look-at point along the bench until the stations are centred in
  the clear part of the view. Below 860 px it reverts to the centred card, because a
  docked panel beside a bench too narrow to read helps nobody.
- **Both Unit 1 benches are BUILT at T4.** `BUILT_BENCHES` in `engine/instruments.js` holds
  `q1-grain` and `q2-core`, and `benchIsBuilt(questId)` is what `screens/learn-quest.js`
  asks to decide whether the frame is bolted to a bench or drawn as a page over the flat.
  The sampler scope used to be excluded on the argument that a microscope's picture is a
  picture and that building it would read as the sample inflating. What that missed is
  where the picture belongs: on a bench the player has walked to there is a SCREEN to put
  it on, the crates of bulk matter sit in real wells on the plate in front of them, and the
  power control is a milled cap they reach over and turn. That is exactly the relationship
  a scope has to its sample, and it is what the salvage bench on Tallow now is.
- **The benches in 3D** — `engine/instruments.js` is the dispatcher every quest imports: it
  hands back the canvas instrument or the built one, and the two expose the *same API*, take
  the same declarations and plan every tool through the same pure functions, so a stage that
  grades correct on one grades correct on the other. Those planners live in the canvas
  engines and are the single implementation. That now covers the PICTURE as well as the
  tools: `drawScopeField`, `fieldGeometry` and `hitTestField` in `scope.js`, and
  `drawCoreField`, `coreGeometry` and `hitTestCore` in `corebench.js`, are pure functions
  over a 2D context that both instruments call — so the built bench and the drawn bench
  cannot show different things, and a hint naming a position is true on both. Alongside
  them: `planSettle`, `planCut`, `PIECE_TO_SPREAD` and `packCore`, `planBeam`, `planStrip`,
  `RING_RADII`.
  `engine/bench3d.js` is the shared physical bench (plated top, a station per sample with a
  recessed phosphor well and a raked screen on a stand behind it, engraved plaques, a
  constrained lean-over camera, `addGrabbable` for controls that must take a press before
  the view does, `buildPowerDial`, `screenUnderRay` for a press that lands on a picture,
  `fitToOpenArea`, which uses `setViewOffset` to centre the instrument in the part of the
  screen the frame is not covering, and `fitDeployedAim`, which does the same job by aiming
  when the camera belongs to a world). `engine/scope3d.js` and `engine/corebench3d.js` are
  the instruments themselves: the physical crate or specimen in the well drawn with
  `InstancedMesh`, and the resolved picture drawn onto the station screen. `engine/bench-host.js` inverts the render dependency — the benches ask for a host
  and `main.js` registers one — because a quest module must stay loadable in plain Node for
  `verify:learn`, and importing the stage would drag three.js and two worlds' JSON in with it.
  **Both quest modules changed by exactly one import line and not one character of copy.**
  A **drawn** bench brings a page, not a scene, so nothing else would stand the walk down:
  `learn-quest.js` calls `stage.setWalkSuspended(true)` for it (released on dispose), or W
  would step the player off the bench and an arrow key aimed at the power dial would also be
  a step backwards. The page carries `.learn-quest-overworld`, a flat scrim over the live
  flat — no backdrop blur, because blurring a full-screen WebGL frame is the most expensive
  thing this app could ask a handset for. Nothing in Unit 1 takes that path any more; it
  stays because the next world's first quest may.
- **A screen bolted to a bench never moves.** `PANEL_LAYOUT` in `engine/frame.js` is fixed,
  and nothing may animate a panel's height: a readout that drifts while you are reading it
  is the instrument moving, which no instrument does. The plates hang LOWER than they first
  did, because at the original height the tops of all four came out above the fixed HUD
  band — the player saw the bottom half of a briefing with no way to scroll the world to
  reach the rest, since a CSS3D plane is not clipped and gives no sign anything is missing.
  `verify:bench` measures every plate through the real projection at six aspects and fails
  the build if one runs under the chrome, and `.lq-world-comms .modal-container` scrolls so
  a long transmission stays on its screen instead of hanging in the air beside the bench.
- **Screens** — `learn.js` (the road), `learn-world.js` (one world's quests, or the walk HUD
  when the world is built as a place), `learn-quest.js` (the host frame). Styling in `src/styles/learn.css` (`.lq-*` for the
  quest bench, `.scope-*` for the instrument, `.lq-knob*` for the power dial, `.lq-choice-row`,
  `.lq-tally`); phone rules under `.m-learn`,
  `.m-learn-world`, `.m-learn-quest` in `mobile-screens.css`.
- **Endpoints** — `learn/progress`, `learn/stage`, `learn/complete`. None returns an XP
  field; `learn/complete` is idempotent. Rows ride along on `bootstrap` and `player/me` as
  `learn` and are merged with `session.setLearnState`, which unions rather than overwrites
  so a stage cleared while the sync was offline cannot silently re-lock a quest.

To build a quest: copy the template into `src/learn/quests/<worldId>/<questId>.js`, point
the chart's `module` at it, flip its `status` to `'live'`, correct `stageCount`, write its
five `PRACTICE` problems, and run `npm run verify`. Nothing else in the app needs editing.

**Every stage owes a reward card of one to three sentences**, naming in real chemical terms
the idea the player just worked out. The chemistry lands in bits, after each stage; saving
it for the debrief is the thing this replaced, and `verify:learn` enforces the ceiling.

`verify:learn` also grades a built quest. A module must export `meta.stageCount` matching
its chart, and a table-driven quest exports `STAGES`, `SOLUTIONS`, `MISSES` and `stateFor`
so the check can assert — as `verify:quest` does for the Charge Gardens — that the intended
solution grades correct, that a plausible wrong answer is refused **with a reason**, that an
untouched bench never grades correct, that every stage has exactly three distinct hint rungs
and a reward card, that every bench declaration is well formed, that all `quest-btn-sm` buttons carry
`btn-secondary` or `btn-primary`, that a stage briefing (where a stage has one at all — in Unit 1
only stage 1 does) does not exceed 2 sentences, that sample notes
describe provenance only without leaking answers, **that every control a stage offers has a
key legend** (`toolNoteFor(controlId, stageNumber)` — see "Nothing is NAMED without being
explained" at the top of this file), and that all prompt/hints/briefings/legends/check
messages comply with withheld vocabulary rules. It reads both styles:
`samples` with `particles` for the sampler scope (real kinds, `geom` covering every piece,
bonds inside the cluster) and `specimens` with `core` and `rings` for the core bench, where
shell capacity is enforced — two on the nearest ring, eight after that, nothing further out
while a nearer ring still has room. No solution may name a sample, row, bin or choice that is
not on the bench; a manifest may cover a subset of the plates (`widget.rows`), and every row
it shows needs a solution line.

### World 1 quest 1 — Atoms, Elements and Mixtures (`unit01/q1-grain`, live)
Eight stages on a bench with three tools: a scope on a power dial, a cutter and a shaker.
One briefing, on stage one, naming those three tools; every other stage is prompt, tools,
answer. Zoom up until the picture stops getting finer (there is a floor) → which of two
identical-looking samples is one kind of atom → how many kinds hide in one sample → run the
cutter over four samples, one of which will not divide → copy the cluster that repeats →
file two samples by how many heavy atoms each molecule holds → settle three samples and read
the layers → file four samples as **element, compound or mixture**. `VOCABULARY` introduces
*atom* on stage 1's card, *element* and *mixture* on stage 2's, *molecule* on 5 and
*compound* on 6, and each word is used plainly from the next stage on. The last sample is
bonded pairs of one kind, so "still an element" is a real question rather than a lookup.
The catalogue codes (CAT 01, 06, 08, 11, 16, 17) are atomic numbers, never explained here;
the debrief points at them as the hook into `q3-catalogue`.

### World 1 quest 2 — Inside an Atom (`unit01/q2-core`, live)
Eight stages on the core bench in Tallow's sub-level lab. Fire a beam through an atom and
say what is inside it → count the crossed grains in the nucleus → work out a sealed sample's
electrons from the charge needle → place eleven electrons on rings by copying three open
samples → predict trading from the outer shell → tell two 13-grain samples apart by what is
outside them → strip electrons to reach plus two → say how three samples differ from a
standard.

**The vocabulary schedule is short on purpose.** Stage 2's reward card names protons,
neutrons **and** electrons together — all three are on screen by then, in "The middle" and
"Outside" — so from stage 3 the game says "electron" rather than "light piece", which is
what made the old stage 3 unreadable. *Shell* lands on 4, *valence* on 5, *isotope* on 6,
*ion* on 7.

**Stages 3, 4 and 6 are the ones that have to be DISCOVERED rather than asserted**, and each
was rebuilt because it was not. The failure mode is identical every time: the stage is easy
for a reader who already knows the chemistry and impossible for the reader it was written
for, and hint rung three is quietly carrying the whole lesson.

- **Stage 3 — the needle.** Three open samples stand beside one sealed. Two read zero, and
  **Sample C reads plus two with six protons and four electrons** — that third sample is the
  stage. With only the balanced pair the needle never moved, so there was nothing to learn
  from it. The commit is soft-refused until the needle has been on the sealed sample AND on
  at least one open one, because the comparison is the work.
- **Stage 4 — the rings.** Three open samples, not two: 2 alone, 2 and 8, and **2, 8 and 3**.
  The third is what makes "each ring fills before the next one starts" a pattern in three
  data points rather than an assertion in a hint.
- **Stage 6 — why the neutron does not matter.** Derivable from the stage before it: Samples
  A and B have the same protons and therefore the **identical outside, 2 and 4**, and stage 5
  established that the outer shell decides behaviour; Sample C has a different outside, 2 and
  5.

**Nothing in this quest requires clicking a particle.** Counting is the task on stages 2, 3,
6 and 8, so the answer is a number the player enters; the probe is a tool that is there if
they want a reading, never a gate on a commit. Every sample is a real nuclide and balances
unless a stage has stripped it. **The quest never connects the proton count to the scope's
catalogue** — that reveal belongs to `q3-catalogue`.

### World 1 quest 3 — The Periodic Table (`unit01/q3-catalogue`, live)
Eight stages on the catalogue board (`engine/catalogue.js`, the one Learn instrument that is
NOT drawn into an aperture: a card index is a card index, so it is built out of real plate
elements — a drawer of cards and a board of slots, two-tap place, no drag — which is the only
version of it that reflows at 375 px and can be read out loud). The payoff both earlier
benches pointed at: the CAT number the scope has filed by since bench one is the proton
count, and ordering by it makes the periodic pattern. Periods, groups, noble gases, metals
and nonmetals land as earned vocabulary; stage 7 has the player predict a card that is not
there, the way Mendeleev did. The question it leaves lying — why a listed mass is never a
whole number — is `q5-assay`'s.

### World 1 quest 4 — Isotopes and Ions (`unit01/q4-ledger`, live)
Eight stages reusing `CoreBench`. Counting protons, neutrons and electrons off one atom;
reading a sealed sample off its label; why isotopes react alike; charge from the needle;
driving an atom positive and another negative; cancelling charges in whole numbers (which is
why magnesium and chlorine combine one to two); and four sealed samples against a standard.
It ends able to describe any atom with three numbers.

### World 1 quest 5 — Atomic Mass (`unit01/q5-assay`, live)
Eight stages on the sorting bench (`engine/assay.js`, also used by the charted Ligar
`q4-weigh`): a sample tips down a chute over a deflector, one bin per weight, tallies
counted; a balance weighs a sample whole and reports what one piece weighs on average. A real
sample is a mix of isotopes, the proportions are fixed, the listed mass is a weighted average
that leans toward the common isotope, and the average runs both ways — a sealed sample gets
named off its number. Every hint rung three shows the actual sum. The bench never counts by
weighing at scale: moles are Ligar's.

### Tallow — Learn world 01 as a place you walk (`three/tallow.js`, T4)

At T4, `#/learn/unit01` is not a list of quests: it is the ground they are played on.
The player walks a salt-flat refinery in first person, finds a bench, and presses `[E]`.

- **The look is not Erebus.** Erebus is an amber basin at low sun; Tallow is a bleached
  salt pan under flat overcast — the same SCOURED PLATE world with the colour leached out.
  Ground bounce dominates (a `HemisphereLight` off white crust), the sun is broad and
  weak with no disc, and the palette stays warm-neutral with a brown/sand bias throughout.
  The sub-level is the one place the sun never reached, so the colour survives there: it is
  built from `crucible.jpg`'s register, riveted and sodium-lit.
- **Five sites, one per quest, all live, and each sign says what its bench teaches.**
  `site-1` *Bench 1 - Atoms* (`q1-grain`) under the lean-to in the yard; `site-2` *Bench 2 -
  Inside an Atom* (`q2-core`) down the stairwell in the diagnostic lab; `site-3` *Bench 3 -
  The Periodic Table* (`q3-catalogue`, the blockhouse with its door racked back); `site-4`
  *Bench 4 - Isotopes and Ions* (`q4-ledger`, painted floor and ledger board); `site-5`
  *Bench 5 - Atomic Mass* (`q5-assay`, a hopper over a chute with catch bins, south of the
  yard). The structures are unchanged — only the signs are, because a player choosing a
  bench should not have to enter it to find out what it is. Sites 1 and 2 carry their instruments as built objects (`BUILT_BENCHES`); sites
  3–5 stand as real places whose quests draw the bench as a page over the world —
  nothing sealed, nothing invented. `verify:tallow` still fails if a site's `built` flag
  disagrees with the chart.
- **The sub-level is a real excavation.** The terrain mesh has a rectangular hole cut in it
  (triangles whose centre falls inside the footprint are dropped), the pit is built as
  geometry so its edges are machined rather than stretched, and `getTerrainHeight` resolves
  the ramp — so the player walks down instead of being teleported under the ground. The pit
  rim is box colliders split around the stair mouth, which is what makes the stair the only
  way in.
- **Nothing shares space with anything.** Every landmark in `tallow.json` declares a
  footprint, every pair is disjoint, and `verify:tallow` proves it by computing the
  distances rather than trusting the layout.
- **A site faces the ground the player walks in from.** `siteFacing(site)` derives the
  group's rotation from `approachPos`, so moving an approach mark turns the site to meet
  it. Both built sites used to carry a hardcoded `Math.PI`, which was backwards: a site
  group's local +z is its front — the bench's back lip is at local -z, and the lean-to's
  back sheet and the lab's gauge board stand behind it — so the player walked in through
  the back wall, and the instrument docked its camera on the far side of the plate looking
  at the lip. `verify:bench` asserts the angle rather than trusting the number.
- **Only lamps are lit.** Sodium luminaires in the lab, the mast's obstruction lamp, the
  doorway light over the open vault, and one indicator per built site, driven from the
  Learn track's own progress through `setSiteComplete` — the world reads state, it never
  keeps it.
- **Tier boundary.** Walking Tallow is T4. At T3 and below the Learn road is the screens it
  has always been and every quest completes exactly as before. `learn/worlds3d.js` is the
  registry that says which worlds are walkable and is the only file a second one needs.
  `minTier: "T4"` landmarks are decoration: `verify:tallow` simulates removing every one of
  them and asserts every site is still reachable.

### Surfaces, small parts and the draw-call budget (`materials/pbr-kit.js`)

One toolkit builds every surface and every small part in all three places, so a
bolt on the ship is the same bolt as a bolt on the flat, ground down by a
different amount of weather.

- **A surface is convincing when its maps AGREE.** Albedo, normal, roughness and
  ambient occlusion all come off the same height field in every generator:
  `platedMetal`, `saltHardpan`, `desertSand`, `treadPlate`, `sedimentaryRock`.
  A scratch is lighter *because* it is raised, less rough *because* it is
  scoured, unoccluded *because* it stands proud. Draw those four independently
  and the eye reads plastic no matter how many octaves went in.
- **`platedMetal` builds a plate the way the object acquired it** — rolled steel,
  a pressed panel grid, rivet lines, paint, paint worn off the high edges, rust
  blooming out of the bare metal and streaking downward. `weather` 0…1 is most
  of the difference between the ship (0.34, in service) and Tallow (0.92).
- **All noise tiles.** Value noise and Worley run on a wrapped lattice with an
  explicit period, so nothing seams.
- **Two layers kill the repeat.** `addDetailNormal` adds grit far below the tile
  (what a player sees at their feet); `addMacroVariation` adds a drift across the
  whole mesh with no repeat at all. A 240 m ground plane needs both.
- **`aoMap` samples the SECOND uv set.** A generated occlusion map does nothing
  until the mesh is told to reuse its own UVs, so both worlds and the ship run
  one `enableAmbientOcclusion()` pass rather than remembering at every call site.
- **`mapsFromAlbedo` / `dressMaterialFromAlbedo`** derive maps from painted art.
  `/art/durasteel_plate.jpg` is the authority for the ship and it stays; height
  is a HIGH-PASS of luminance, so a bolt head becomes a bump while a darker panel
  does not become a pit. It previously had an unrelated procedural normal beside
  it, and the light contradicted the picture.
- **`mergeStatic` bakes a prop into one mesh per material.** Detail costs draw
  calls: a dressed pylon is forty meshes and there are twenty of them. Anything
  that must stay addressable — a lamp that lights, a sock that turns, a cabinet
  that cases up — sets `userData.noMerge`, which protects its whole subtree.
  `mergeStatic` records each part's box in `userData.partBoxes` so the physics
  check stays as precise as it was on the unbaked prop.

### Nothing occupies the same space as anything else

The rule is checked against the world that is **actually built**, not against a
table kept beside it — a table drifts the first time somebody nudges a crate.

`tools/lib/dom-shim.mjs` is enough of a browser for a world to be constructed in
Node; `tools/lib/overlap.mjs` walks the scene and measures every pair of separate
objects. `verify:tallow` runs it on Tallow, `verify:ship` on the Avalon and
Erebus.

- Parts **inside** one object are exempt: a gusset that merely touched the corner
  it braces would be holding nothing. So the hull, the corridor services and each
  prop are each one object, and the test runs strictly between them.
- `phys: 'ground'` (terrain, evaporation pans, landing aprons) and
  `phys: 'ambient'` (sky dome, horizon mesas, celestial bodies) are exempt by
  kind, as are transparent decals — a stain is a mark on a surface, not a body.
- Tolerance is 0.06 m, because a bounding box is a loose fit around a rotated or
  round body.
- **Elevated structures collide as their supports.** A pipe bridge and a conveyor
  are their piers and legs; you walk under the span. `supportPoints` in
  `tallow.js` is where that lives.
- What it found on its first run, all now fixed: a pipe bridge through a drum
  line, a conveyor through a pipe bridge, a container stacked across a hatch, a
  cable raceway through every deckhead frame, a tactical table skirt inside a
  doorway, a crate inside a lean-to post — and a missing import that would have
  crashed Tallow outright.
- **Every doorway says where it goes, on both faces.** A ship of identical grey
  openings is a maze, and a player who finds the star map by opening three doors has
  learned the deck plan by trial and error. `buildDoorwayFrames` hangs a stencilled
  header plate on each side of every frame, naming the compartment you walk INTO on
  that side — the room's designator read from the spine, `SPINE` read from inside the
  room. **The names are not written down at the frame:** `roomAt()` is asked what is
  actually half a metre through the opening in each direction, so a bulkhead that moves
  takes its legend with it and a plate can never name a compartment that is no longer
  behind it. `placard()` shrinks its face to fit rather than clipping, because
  `COMMAND BRIDGE` is twice the length of `COMMS`.
- **Doorways are drawn where the deck is free.** `buildDoorways` runs last, after
  every room has registered its furniture, draws ONE frame per unordered graph
  edge at the midpoint of the two compartments, and walks along that line to the
  first clear spot. `hatchPos` is untouched: the traversal graph and its view
  cones are a separate thing from where the plate is welded.

### The interface is in the world (`three/world-ui.js`, T4)

At T4 a quest's prompt, readout, hint ladder and Commit key are not a card over
the render — they are screens bolted to the bench the player is standing at.

- **The DOM is moved, never rebuilt.** A `CSS3DObject` carries the real element,
  with the real handlers and the real stylesheet, onto a plane in the scene.
  Rasterising a quest's HTML into a texture would mean re-implementing its
  layout, and re-implemented layout is how copy quietly changes. **Not one
  player-facing string differs between the two presentations, by construction.**
- Every panel gets a WebGL housing built strictly **around** the screen
  rectangle — back plate, bezel, standoffs, bolts, a stencilled designator, a dim
  filament that spills onto the bench. The CSS layer composites above WebGL, so
  an overlapping bezel would simply vanish.
- That compositing also means a panel is not occluded by geometry in front of it,
  so panels are only ever raised while the player is docked at the station that
  owns them.
- `LearnFrame.deployPanels()` re-homes `.lq-deck`, `.lq-rail` + `.lq-stage-head`
  and `.lq-controls` onto a gantry standing on the bench, and relocates
  `#modal-container` whole into a comms head above it — so `showModal`'s focus
  handling and Escape key are untouched, and briefings, findings and the debrief
  arrive on a screen instead of in a dialog. Off a walkable world it returns
  immediately and the frame is the page it has always been.
- `quest3d/console.js` does the same for the Charge Gardens, onto the operator's
  desk. That console is parented to the CAMERA, because the chamber's controls
  orbit the sample: bolting the desk to the room would swing it out of sight
  every time the player did the thing the stage is asking for. The fiction is
  the true one — the operator stands at a fixed station and the containment
  field turns the sample in front of them.
  - **ONE surface, and it is a control desk.** It used to raise three: a deck low
    and centre, and two plates angled in at eye height from the left and the
    right. Those two sat exactly where the molecule is, so the thing the stage
    was asking the player to look at was the thing they could not see. Now there
    is a single raked fascia across the bottom of the glass — the deck on the
    left of it, the stage rail and the relay strip on the right — with toggle
    banks, indicator lamps, rotaries, a hand rail and legs built in WebGL
    strictly around the aperture.
  - **It never covers more than a quarter of the height of the view**, and its
    top edge stays below -0.33 NDC. `fitConsole()` solves the width by BISECTION
    on the MEASURED projection rather than by trigonometry, because the fascia is
    raked and its near edge projects larger: the flat estimate put a "quarter
    height" desk at 29% of a 16:9 screen with its lip hanging off the bottom of
    the glass. `npm run verify:console` asserts both numbers at fourteen
    viewports, against the same pure function the live mount calls.
  - **Below 900 px of glass it is not raised at all** and the quest keeps the 2D
    stage deck, which is the interface `mobile-quest.css` was written for. The
    fascia is authored 1560 CSS px wide and scaled to fit; on a narrow window
    that lands one CSS pixel on a fraction of a device pixel, and a diegetic desk
    nobody can read is worse than an honest card.
  - **THE MOUNT IS THE LAST STATEMENT IN THE STAGE RENDER, AND THAT IS
    LOAD-BEARING.** Mounting the console MOVES the deck, the nav cluster, the
    relay map and the legend out of the quest screen's container and into the
    CSS3D layer, which hangs off `document.body`. Every `container.querySelector`
    after that point returns null, and because they are all written as
    `?.addEventListener` they fail silently — which is exactly what happened: at
    T4 not one control in the Charge Gardens worked. Submit, Hint, Clear, Exit,
    Prev, Next and every stage lamp were dead. Two things keep it fixed: the
    mount now runs after every listener is attached, and the stage's lookups go
    through `q()` / `qa()` in `quest.js`, which fall back to the document once a
    node has left the container. Either alone would do it; both together mean a
    reordering cannot quietly break the controls again.
- `WorldPanel` takes `housing: 'none'` for a caller that builds its own case, and
  `setWidth(metres)` to be re-fitted in place without re-flowing its DOM.
- Styling lives under `.lq-world-panel` in `learn.css` and `.quest-console-panel`
  in `holo.css`. Both are additive; T3 and below never load a different frame.

### A Learn instrument deploys onto the bench that is already there

`BenchViewer3D` takes an optional `world` frame (scene, camera, position,
rotationY, topY). With it, the stations are laid on the plate that stands on
Tallow, the stage camera docks in front of it, and the salt flat keeps running
behind — dust drifts, lamps flicker, the sock turns. Without it the bench builds
its own little room exactly as before.

- **The instrument's local frame is identical either way.** Only the transform on
  `this.root` differs, so every station coordinate and every hit test is written
  once and cannot drift between the two.
- **The bench is not built twice.** What stands on the plate when nobody is
  working is the instrument, cased up (`dormant`); pressing `[E]` hides the case
  and deploys the stations in its place. One object, two states.
- The deployment frame travels through `bench-host.js` (`setBenchSite`,
  `benchDeployment`) so quest modules never learn any of this happened, and
  `verify:learn` can still import them in plain Node.
- Both benches are 4.8 m long because a four-station instrument needs them to be;
  the lab's beam column and equipment rack moved outboard to make room, and the
  bench colliders are boxes rather than a single radius.

## Rules that keep the game fair
- **A screen that claims to be telemetry never invents a reading.** The comms CRT used to
  fall back to four hardcoded guild totals whenever it was handed nothing, and it was
  handed nothing every time, because `stage.js` was reading `t.score` off
  `session.teams` — the roster manifest, which carries names, liveries and slot caps and
  no scores at all. A pre-launch club with no submissions read a fully populated season off
  an instrument. `stage.refreshStandings()` now fetches the real `leaderboard` route (the
  same computation Standings reads, floored at a 20 s refresh) and
  `createCommsStandingsTexture` draws `NO GUILD TELEMETRY ON THIS CHANNEL` when it has no
  rows. `verify:holo` fails the build if either fabrication comes back.
- **A guild's score is a mean, never a sum.** `Scoring.getLeaderboards` computes
  `mean(xp of members with xp > 0) x (0.75 + 0.5 x active/roster)`, and the proxy mock
  mirrors it. A sum hands the season to whichever guild recruits hardest, which is what
  `docs/plans/avalon-implementation-plan.md` §4.4 was written to prevent. The consequence
  to expect: earning 20 XP moves your guild by a few points, not by 20, and a teammate
  crossing from 0 XP to a low total can pull the mean *down*. Because it is not XP,
  nothing may label it "XP" — the Comms CRT once did, and it made the board read as broken.
- **A Sheets flag column is never compared to a string.** `Db.append` writes `'TRUE'`, but
  `appendRow` applies cell-entry parsing, so Sheets stores a *boolean* and `getValues`
  reads back `true`. A strict `correct === 'TRUE'` therefore matched nothing: every
  player's stage XP summed to zero, leaving only completion bonuses, and since the team
  score counts only members with `xp > 0` as active, no guild score moved either. Read
  flags through `isTrueFlag` in `Util.gs` (accepts both forms) and never inline the compare.
  `verify:flows` guards it: the board must carry the signed-in player's XP, it must be
  non-zero, and their guild must count them active.
- **The mock's totals must match production's.** `localTotalXp` in `api/[...route].js` is
  the mock's `Scoring.computePlayerTotalXp` — stage XP plus 65 per completed quest — and
  `player/me`, `auth/login` and `leaderboard` all read through it. The leaderboard route is
  computed from `localStore`, not hardcoded; a fixed board cannot show whether XP reaches
  the standings, which is the one thing a dev run needs to prove.
- **XP is paid once per stage.** `Quests.gs` checks prior correct submissions, the proxy
  mock tracks `progress.cleared`, and the client only calls `session.addXp` when the stage
  is not a replay. Stage navigation lets players revisit any stage they have reached, so
  without this the Prev button is an infinite XP faucet.
- **Flat XP, no attempt multiplier.** The client grades locally and shows "+N XP" before the
  server replies; a server-side multiplier would contradict what the player was just told.
- **Hints are free** (`hint_cost: 0` on every stage). A stuck 8th grader should never be
  taxed for asking.
- **Completion is idempotent** — `completeQuest` returns the existing award if
  `Progress.completed_at` is already set, instead of minting another item.
- **Progress never regresses** — `stage_reached` is always `Math.max`'d. In `quest.js`
  `maxStageReached` is the *cleared count* (0…`TOTAL_STAGES`), never clamped to
  `TOTAL_STAGES - 1`; `navMaxIdx()` derives the highest openable stage index from it.
  Clamping the two together used to leave a finished quest reading as 19/20 cleared and
  made the last stage look unplayed, so replaying it paid its XP a second time (the
  server paid 0, and the next `player/me` pulled the local total back down — XP that
  appeared and then vanished).
- **A finished quest replays for free.** Re-entering `#/quest` after completion opens at
  Pylon 1 with every stage unlocked, `isReplay` true everywhere, and no XP awarded; the
  background `player/me` sync never jumps a completed player to the last stage.
  `verify:flows` covers re-completion, a post-completion replay and the unchanged total.
- **The clean-solve streak pays nothing.** It counts stages cleared first try without the
  solution hint and is display only. Give it an XP value and it becomes an attempt
  multiplier, which the rule above forbids.
- **Hints are earned, not bought.** Rung 1 is free; rung 2 opens after one miss or 45 s;
  rung 3 opens after two misses. Nobody is ever stranded — but nobody is handed the answer
  before they have looked, either.

## Quest 1 — The Charge Gardens of Erebus
20 stages, 650 XP total.

**The loop is scan → compare → commit.** A prompt states the situation and the goal and
never the route; everything true about an individual site lives in that site's scan.
Tapping a site (a click with no drag, handled in `interactions/arrow.js` → `onProbe`)
rings it in the chamber and prints its readout: polarity, a 0–10 CHARGE bar, a 0–10
CLEARANCE bar, and one plain sentence. One scan is never enough — every stage is solved
by comparing two or more, which is what makes looking the core verb rather than reading.
Tier 1 gets the identical readout from a row of Site buttons.

A miss is answered by `diagnoseMiss`, which names the physics — TWO GIVERS, BACKWARDS,
TOO WEAK TO FIRE, PATH BLOCKED — and points at a site to go and scan. All 216 possible
wrong site-pairings across the quest resolve to a specific message; none fall through.

Concept cards are rewards, not briefings. `conceptTiming: 'intro'` is reserved for the two
cards that teach the *controls* (stage 1's scan/drag, stage 11's arrow ordering) and those
obey the withheld-vocabulary list like everything else.

**The chemistry itself lands on `cfg.chem`, after every single solve.** One to three
sentences naming what the player just did in the words chemists use — nucleophilic
substitution, steric hindrance, regioselectivity, SN1 and SN2, angle strain, catalysis. It
is the one place in the campaign before the epilogue where the withheld vocabulary is used
deliberately, and it is drawn by `renderChemCard` only once the stage is cleared. The
epilogue is still there; it is now a gathering-up rather than the first time any of this is
said.
- Stages 1–7: one arrow. Red giver → blue receiver, then competing sites, then blocked
  paths that must be solved by rotating the view.
- Stages 8–10: three molecules in the chamber, including a bystander.
- Stages 11–20: two ordered arrows. Arrow badges are numbered; clicking a badge cycles its
  step, clicking an arrow deletes it. Wrong order is reported distinctly from a wrong move.
- Touch input: `QuestViewer` sets `touch-action: none` on the canvas while a quest is mounted
  (restored on dispose) and routes `pointercancel` to the interaction. `ArrowInteraction`
  only lets the pointer that started a drag move or finish it, and `cancel()` abandons a
  drag. `SmoothOrbitControls` forgets cancelled touches and counts fingers even while
  disabled, so a stale touch can never pose as a second finger.
- Concept cards (bumper cars, two-handed handshakes, bent springs) appear after the solve
  on the stages that introduce a new idea, and can be hidden and reopened.
- A correct answer plays a physically honest 3D reaction: molecules approach along the
  collision vector, a bond snaps in, leaving groups depart, double bonds open and re-form,
  rings pop. The explainer appears **after** the animation, never on top of it.
  `playReaction` never strands the player on "Reacting…": a failed animation still
  resolves so the explainer and Next button appear.
- The stage briefing modal auto-shows only for genuinely new mechanics — stages 1, 5, 8,
  11 (`AUTO_MODAL_STAGES` in `quest.js`, plus any `conceptTiming: 'intro'` stage), once each
  and never on replay. Stage 1 types out Vess's message at standard transmission speed via the CRT typewriter
  (describing planet Erebus, Charge Gardens restoration, connecting circuit components from red giver
  to blue receiver, and pylon reactivation); the Objective button reopens it on demand. Every other
  stage starts immediately; the Objective button reopens that stage's briefing on demand.
- The bundled `STAGE_CONFIGS` are authoritative for everything rendered or graded
  (`moleculeId`, anchors derived from its regions, expected anchors, positions, tolerance,
  blocked sites, `reaction`, `multiArrow`, XP). Backend `scene_config` is transport only —
  a stale Sheets row must never swap in another stage's molecule.
- The epilogue (`QUEST1_EPILOGUE`, duplicated verbatim in `Quests.gs`, the proxy and
  `quest.js` as an offline fallback) is the single place real terminology is introduced.
  The completion modal mounts Vess's multi-section interactive CRT debrief (with Next / Prev dialogue
  stepper like an RPG), walking through the grid restoration thanks, charges and electrons, curved arrow
  notation, steric hindrance, and reaction mechanisms before unlocking the final exit actions.

### Chemical realism (`molecule.js` + `reaction` blocks)
Every molecule and animation must be chemically honest, even where the copy never says so:
- No atom over its valence (double bonds count twice). Implicit hydrogens are fine.
- A group landing on a flat center (C=O carbon, carbocation) arrives **face-on** (≥ 50° out of
  the plane), and the center puckers afterwards (`bend` to 109.5°).
- A backside displacement lines up nucleophile, carbon and leaving group (≥ 160°); the
  remaining C–H bonds flip through (`bend`). Stage 11 shows the halfway point with faint
  `partialBond` / `weakenBond` sticks, completed in step 2 with `completeBond`.
- A transferred H sits on the receiver···H–X line (≥ 140°), and the fragment keeping it moves
  away (`departures`). Acids are real acids (hydronium, not water or hydroxide); the stage 10
  and 18 bases are amide (NH2−) because ammonia cannot deprotonate methanol or a C–H.
- An arrow onto a "scavenger" H+ forms an H–Cl/H–Br bond; the pair leaves together.
- A step that breaks two bonds passes `leavingBond` as an array.

Animation step options (`animateReactionStep`): `donorAtom`/`acceptorAtom`, `clusterLeft`/`clusterRight`
(move together along the donor→acceptor line; `leftRatio`/`rightRatio` split the closing
distance), `targetBondLength`, `leavingBond` (object or array), `leavingCluster` + `departDirection`
+ `departDistance`, `departures: [{ atoms, direction, distance }]`, `openDoubleBond`,
`closeDoubleBond`, `bend: [{ center, toward, atoms, angle }]` (an atom entry may be
`{ atom, carry: [...] }` to move its hangers-on), `partialBond`, `weakenBond`, `completeBond`,
`ringOpen`. Atoms that are bent or leaving must also belong to a cluster when that cluster moves.
Region positions double as graded `sourcePos`/`targetPos`; keep them equal (the geometry check
enforces it) and keep each region in the same screen zone, because the Tier 1 labels and the
solution hints ("upper left", "lower corner") are derived from it.

`npm run verify:quest` asserts, for every stage: the molecule exists, every expected anchor
is actually rendered, the intended solution grades correct for the configured XP, a
backwards arrow fails, blocked targets report `blocked`, shuffled multi-arrow steps report
`wrongOrder`, the solution coordinates pass the proximity check, and no player-facing string
contains withheld vocabulary (electron, nucleophile, electrophile, carbonyl, carbocation,
alkyl, ester, epoxide, isopropyl).

It also asserts that **the scanner never lies**: every rendered region has a scan readout,
letters are unique, readings are 0–10, no decoy giver scans stronger than the answer, no
*reachable* decoy taker scans hungrier than the answer, a `blockedAnchor` scans ≤ 3
clearance, every stage has exactly three distinct hint rungs, and a giver→giver submission
is diagnosed as `TWO GIVERS` rather than falling through to a generic miss.

## Plans in flight
- `docs/plans/learn-track.md` — the Learn road: ten worlds, 41 quests charted, five built
  (`unit01/q1-grain` … `unit01/q5-assay`, the whole of Tallow). Scaffolding, gating, routes,
  backend tab, per-world practice sets and the verifier are in place. World 01 (Tallow) is
  also built as walkable ground at T4: sites 1–2 are benches you stand at, sites 3–5 are
  real places whose quests draw the bench as a page over the world; the other nine worlds
  are charts only. The Tallow→Ligar pass (`tallow-ligar-build.md`) carries the bench order
  and what is deliberately left out of Unit 1.
- `docs/plans/immersion-pass.md` — the campaign frame (the quartermaster Vess, pylons on Erebus),
  Session Zero onboarding, soundscape, and the video pipeline (all 14 loops & cinematics baked & integrated).

## Player journey
1. `#/` landing — cold open comms transmission, cockpit loop banner, and Create Account / Try a Pylon CTAs.
2. `#/demo` — Stage 1 sample, no account, intro modal explains mechanics & controls, graded by the same evaluator. One CTA only: the primary Submit key becomes `Create Account` once the stage is solved.
3. `#/register` — step 1 of 3 on the shared `stepRail`. Live validation mirrors
   `validateDisplayName` in `Util.gs` exactly, so no rule bites only at submit time.
4. `#/onboarding` — step 2. Four teams with guild names and live slot counts.
   **A player who already holds a guild slot never sees the picker**: the screen
   redirects to `#/bridge` on entry, skips the claim if the slot was taken since
   the screen was drawn, and on an `ALREADY_ASSIGNED` reply pulls the real guild
   from `player/me` and leaves. The render is also route-guarded — the cold open
   is awaited, so a navigation during it must not paint the picker over wherever
   the player actually went.
5. `#/bridge` — step 3. Resume/start CTA, progress bar, XP, level and team conditions.
6. `#/quest` → `#/leaderboard`, `#/inventory`, `#/quarters`, `#/settings`, `#/admin`.

Nav labels match page titles exactly: BRIDGE, STAR MAP, LEARN, STANDINGS, INVENTORY, CREW.

**The Star Map charts two roads.** `screens/starmap.js` carries a two-tab row in both the
T4 holo-table and the 2D page: `Active Quests` (the four campaign sectors, unchanged) and
`Learn Quests` (the ten Learn worlds, from `curriculum.js` with gating from
`learn/progress.js`). A world that is built as a place reads *Enter <world>* and enters it
in 3D; one that is not reads *Enter* and opens its quest list. The LEARN nav tab is
untouched, so neither road is reachable only one way.

A **finished** world also carries a **Problems** key, which reopens that world's practice
set. `practiceKey()` and `bindPracticeKeys()` live in `screens/learn-world.js` and are
imported by the star map and the Learn road, so the key is authored once and appears in
every list that shows a world.

## Aesthetic — "SCOURED PLATE" (MANDATORY FOR ALL AGENTS)

Every screen, component and 3D scene obeys one brief: **hardware that has been in the
dust for forty years and still works.** Advanced technology, poorly maintained. The
reference points are the used-universe of a desert-planet space opera — never named in
player-facing copy, only felt.

### 1. The three material rules
Read `src/styles/tokens.css` before styling anything; it is the contract.
1. **Surfaces are warm dark.** The neutral scale (`--plate-000`…`--plate-600`) carries a
   brown/sand bias. Never the blue-black of a generic dark-mode website.
2. **Light is filament, not LED.** Amber comes from inside a thing, dim and local.
   *Nothing blooms.* A `box-shadow: 0 0 20px <colour>` is the single loudest tell of
   vibe-coded design and is banned. The only exceptions are things that are literally
   lamps: `.gfx-dot`, `.stage-dot.active`, `.stage-dot.completed`.
3. **Amber is a signal, not a surface.** If it is lit, something is live. Paint the whole
   UI with it and it means nothing.

### 2. Banned outright
Neon and synthwave glow; electric cyan (`#00e5ff`); glossy blue glassmorphism; candy
gradient buttons with white specular highlights; rounded corners (`--radius-sm` is `0`);
**emoji anywhere in player-facing markup**; Tailwind-default palette hexes (`#fbbf24`,
`#10b981`, `#ff5252`); auto-fit grids of "feature cards" advertising what the product does.

### 3. Geometry and texture
- Machined plate has **cut corners, not rounded ones**. `.plate`, `.glass-panel`,
  `.holo-card` and `.stage-prompt-card` share one treatment: a `clip-path` chamfer plus a
  matching hairline drawn as a 45° background gradient in the relieved corner.
- Every large surface is sandblasted — a shared `--grain` noise tile at 3–4 % opacity via
  `::before`, `mix-blend-mode: overlay`. Because a pseudo-element is not matched by
  `> *`, the `position: relative` on direct children keeps content above the grain.
- Seams are physical: `--seam-light` on the lamp-facing top edge, `--seam-dark` below.
- Type is **engraved** (`--engrave`, a dark line under the glyph), never glowing.

### 4. Colour
- Surfaces: `--plate-*`. Seams: `--border-durasteel`, `--seam-light/dark`.
- Signals: `--accent-amber` `#d99423`, `--accent-gold`, `--accent-rust`, `--accent-green`
  `#6f8f3f`, `--accent-danger` `#a8342a`, `--accent-bronze`. Filaments: `--lamp-*`.
- Guild liveries: `--team-earth/air/fire/water`. **The HUD badge derives its livery from
  `TEAM_LIVERY` in `main.js`, never from the sheet's `accent_hex`** — a stale hex in the
  Teams tab used to leak a bright web colour into the header.
- **Charge red `#ff1744` and blue `#00b0ff` are reserved for the chemistry** and appear in
  the 3D chamber only. In UI chrome they appear as printed ink on a hairline rule
  (`--charge-red-ink`, `--charge-blue-ink`) — the polarity key, `.scan-readout` left
  border, `.concept-pill` left border — never as a glowing block or a rainbow ramp.

### 5. Typography
- Page titles: `Cinzel` (`--font-imperial`) via `.page-title` — uppercase, tracked wide.
- Section and card headings: `Chakra Petch` (`--font-display`) via `.section-title`.
- Telemetry, labels, kickers, helper text: `Share Tech Mono` (`--font-mono`) via
  `.eyebrow` (`.lit` when live), `.stat-value`, `.tag`, `.form-label`, `.form-help`.
- Body: `Rajdhani` (`--font-main`).

### 6. Components
- **Panels**: `.glass-panel` / `.plate`. Banner art goes in `.panel-banner` — desaturated,
  dimmed and sepia-shifted behind a scanline, so it reads as a viewport, not a hero image.
- **Switchgear**: `.btn-primary` is a painted key cap (matte amber plate, engraved dark
  legend, physical bottom lip, sinks on press). `.btn-secondary` is bare durasteel.
  `.quest-btn-sm` is compact quest chrome. Labels are 1–2 words; **no arrow glyphs.**
- **Stage Deck**: collapsible bottom-left tablet in `quest.js` and `demo.js` (`Close` / `Stage Panel` + docked mini `Submit` / `Next Stage`).
- **Inputs**: `.form-input` is a recessed well; focus turns the text amber rather than
  adding a halo. Forms use explicit labels and helper text; never use placeholder example text.
  `.choice-option` is a toggle with a lit left edge when selected.
- **Banners**: `.form-banner` for faults; in the quest, `.stage-error-banner` with
  `.banner-mark` / `.banner-title` / `.banner-body` / `.banner-meta`. The leading mark is
  a stencilled `!!` or `//`, never an emoji.
- **Scanner**: `.scan-readout` is a cathode instrument — phosphor raster, segment meters,
  one beam sweep per read.
- **Factions**: four Imperial Guilds — Mineral Mining (Earth), Atmospheric Harvesters
  (Air), Thermal Smelters (Fire), Moisture Extraction (Water), shown as two-letter mono
  designators (MM / AH / TS / ME). Legacy ids `terra`, `zephyr`, `ignis`, `thalassa` are
  auto-migrated everywhere.

### 7. Copy discipline
The interface does not advertise itself. Delete any string that is not (a) a label,
(b) a rule the player must satisfy, (c) an error, (d) something being taught, or
(e) story — copy that builds the campaign fiction.
- **No feature marketing.** The landing page is a name plate and two switches.
- **No live connection claims.** Never use "COMMS LIVE" or "LIVE COMMS" badges; comms
  channels are labeled diegetically (e.g. `COMMS`) without claiming an active live connection.
- **A quest is described by three things and nothing else**: where it happens, its title,
  and one short line. Sector 01 is `Erebus · Desert world / The Charge Gardens / "Find
  what pulls. Draw the line."` — that is the template.
- Screens carry no subtitle unless it is that one line.
- **The teaching copy is exempt.** Prompts, `scans`, the three hint rungs, `diagnoseMiss`
  messages, concept cards and the epilogue are the product; they are trimmed for
  tightness, never for length.
- **Story copy is exempt too**, if it builds the fiction rather than describing the
  product. This covers Vess's transmissions and `onClear` lines, Session Zero scenes,
  guild pitches, and mission-log entries. It lives
  in `src/story/`. Limits:
  - Every line is diegetic: a character speaking, or the ship or the world reporting.
    It never talks about "the app", "levels" or "features".
  - A transmission is at most 2 sentences.
  - No withheld vocabulary. That list is enforced for story copy exactly as for teaching copy.
  - It never states a stage's route (which site gives, which takes). That belongs to the
    scans.
  - It never appears between a miss and its `diagnoseMiss` message, or over a reaction
    animation.

### 8. 3D and assets
- Quality tiers:
  - `T4`: Default ultra/enhanced tier (60fps, unconstrained WASD navigation, continuous walk splines, particle dust, full-res world). 2D page overlays are removed on the bridge (`#/bridge`); diegetic in-world terminals with `CLOSE` handle compartment interactions.
  - `T3`: High/Desktop (60fps, procedural interior, graph traversal, eased dolly, standard 2D page overlays).
  - `T2`: Standard/Chromebook/Mobile (30fps, DPR 1, baked stills).
  - `T1`: Non-WebGL Fallback (DOM-only).
- **A phone is not disqualified from T4 by being a phone.** `isT4Capable` in
  `three/tier.js` asks about WebGL2, cores and reported memory and nothing else — no
  pointer test, and Apple's mobile GPU is deliberately absent from the slow-renderer
  regex, because a renderer string is not a frame rate. `isT4Eligible` is that plus
  "not demoted earlier in this page session"; Settings and the HUD chip ask
  `isT4Capable`, so a handset the monitor demoted can always be put back by hand.
  Two things are cheaper on a handset and are the only fidelity differences: DPR is
  capped at 1.5 rather than 2 (a phone commonly reports 3), and `shadowMap` stays off,
  because soft shadow maps are the one T4 feature a mobile GPU cannot hold 60fps
  through.
- **A measured tier is never written down; only a chosen one is.** This is the rule that
  keeps a phone out of the stills. `session.gfxTierPref` holds a tier the *player* picked
  — `tierManager.chooseTier`, from the Settings radios or the HUD chip, is the only path
  that writes it — and `null` means "probe the device". `setTier` is the automatic path
  and persists nothing, so a bad afternoon is never inherited by the next visit.
  `session.gfxTier` is just what is running now. They used to be one value, and every
  automatic demotion was stored as though the player had asked for it.
- **A boot is not evidence.** `recordFrame` is one judgement window for the boot probe
  and the runtime monitor alike (90 frames), and it is blind for `WARM_UP_MS` (6 s) after
  boot and after every tier change, because textures uploading and shaders compiling read
  as 10fps. A demotion is **one step**, then the window is discarded and
  `DEMOTE_COOLDOWN_MS` (8 s) has to pass. The old monitor kept its slow samples after
  each change, so one hitch walked a capable iPhone from T4 to T1 within a few frames —
  and stored T1 — which is how a phone ended up looking at static backdrops. A device
  that really cannot render still lands where it belongs, it just has to prove it.
  `migrateStoredTier` (behind `avalon_gfx_rev`, rev 3) clears any stored sub-T4 tier once
  on a T4-capable touch device, since none of them were chosen; a desktop preference and
  a phone that is genuinely not capable are untouched.
- **T4 is a phone layout too.** The five in-world terminals (star map, quarters, cargo,
  comms, settings) carry their `m-screen m-<name>` hooks in the T4 branch as well as the
  2D one, so every phone rule in `mobile-screens.css` still applies inside a terminal.
  `mobile.css` takes the terminal to the glass edges below the HUD and drops the backdrop
  blur (the most expensive thing on the screen over a live 3D frame);
  `mobile-landscape.css` docks it to the right so the walk keeps the left of the glass.
- **Mobile T4 is driven by twin sticks** (`three/touch-controls.js`, styling in
  `styles/mobile-game.css`). A 360-degree look stick bottom-left and a 360-degree move
  stick bottom-right, both floating — the ring jumps to wherever the thumb lands in its
  corner zone — plus the `E` and `X` keys, which are the two presses a finger otherwise
  has no way to make: E uses what the world is offering (it lights only then) and X
  jumps. They are engraved with one glyph each, sized as key caps with tracking off, and
  carry `aria-label` Use / Jump. Because the key legend is now the same `E` the prompt
  uses, `showPrompt` no longer rewrites `[E]` to `[USE]` on a phone, and
  `stage.syncTouchControls` reads `[E]` when deciding whether the E key is armed. The sticks feed `FpsControls.analogMove` / `.analogLook`, which
  `update()` consumes exactly as it consumes W/A/S/D and mouse delta, so collision,
  terrain and interaction prompts know no difference; deflection is analogue (half push,
  half speed) and the rim sprints. `fpsControls.touchMode` stands the mouse path down
  entirely, because the synthetic mouse events a browser fires after a tap would read as a
  look drag and snap the camera. `showPrompt`
  rewrites `[E]` to `[USE]` in that mode. `stage.syncTouchControls` raises and lowers
  the layer on a 200 ms throttle; an in-world terminal, a deployed chamber, a cinematic,
  a `.screen-container` or a live modal takes the sticks away, and a push held through
  that transition is released rather than left stuck on.
- **Game mode** (`src/game-mode.js`, `body.game-mode`) takes the screen on a handset.
  Three routes in order: the Fullscreen API, granted only inside a user gesture
  (**feature-detected, never sniffed for a browser or a version**); an installed Home
  Screen launch, which is why `manifest.webmanifest`, `apple-mobile-web-app-capable` and
  the `icon-*.png` set exist; and failing both, the full-bleed `100dvh` layout plus a
  once-ever hint on how to install. `active` is read back from `fullscreenchange` only
  where the API exists, or the fallback state would be cleared on every sync.
- **The gesture that signs a player in cannot be the gesture that takes the screen.**
  `requestFullscreen` is granted only during a live user activation, and a sign-in spends
  it on `await api.login(...)`; by the time the bridge renders the request is refused
  without a word, which is why full screen never arrived after logging in. Three callers
  now cover it. `login.js` and `register.js` call `gameMode.autoEnter()` **synchronously,
  before the await**, so the press itself asks. The router arms
  `gameMode.armOnNextGesture()` on every authenticated route, which spends the player's
  next tap — anywhere — on the request; that is the only route a returning player with a
  stored token has, since they arrive from a page load having pressed nothing. And the
  `FULL` key and world entry are unchanged. Arming happens **once per page load**
  (`armUsed`), so a player who takes the screen back with `FULL` is not fought for it on
  their next navigation. Where there is no element full screen at all — an iPhone, where
  Safari has it for `<video>` only and an iPad does not — arming instead runs route 3 at
  once: no gesture is needed for a layout change. On that device the HUD key reads
  `INSTALL` and shows the Home Screen instructions instead of toggling; a key reading
  `WINDOW` would be claiming a state the device cannot be in, which §7 forbids.
  The third route is where an older iPhone lands. Safari used to expose full screen for
  `<video>` only (`HTMLVideoElement.webkitEnterFullscreen`, which is how a video site
  takes the screen there) and not for an arbitrary element — that path is no use to a
  WebGL canvas, since it accepts a `<video>` and nothing else, and piping the canvas
  through `captureStream()` into one would hand back a one-way picture with no touch
  mapping. It is deliberately not attempted.
- **Entering a 3D world on a phone turns the handset sideways.** `enterWorldScene` and
  `enterTallowScene` call `gameMode.enterWorld()` — full screen, then
  `screen.orientation.lock('landscape')`, which browsers grant only to a document that
  is already full screen. Support for the lock is narrower than support for full screen
  itself; where it is refused, nothing is said and nothing is shown — the player turns
  the device or does not. `stage.syncWorldOrientation` gives the lock back the moment the player is
  no longer standing on a planet (`activeWorld` set, mode `world` or `quest`) — the ship
  reads fine in portrait, and a chamber opened at T3 or below has no world behind it.
- Canvas sizing follows `visualViewport` on touch, not `window.innerHeight`: a phone
  collapsing its address bar fires only the `visualViewport` resize, and sizing to the
  window renders a buffer taller than the glass with the horizon off the bottom edge.
  The holo-close raycast reads NDC off the canvas rect for the same reason.
- Authentication gating & 3D view: On unauthenticated routes (`/login`, `/register`, `/`, `/onboarding`), the 3D ship interior and vista are visible behind the account cards, but first-person WASD navigation and mouse look are locked (`fpsControls.enabled = false`) until the player signs in.
- Starship traversal spine: `src/three/ship-graph.js` defines an undirected navigation graph across all compartments (`bridge`, `cockpit`, `starmap`, `quarters`, `cargo`, `comms`, `airlock`) with 3–6 point `walkPath` splines, `hatchPos` view-cone markers, and `routeBinding`.
- Starship 3D interior: `src/three/ship.js` builds hyper-realistic physical rooms and interconnecting corridor spines along `walkPath` splines with procedural PBR durasteel plating with tangent-space normal mapping (`createDurasteelNormalTexture`), floor grating, runway halogen strips, chamfered hatch bulkheads, tactical quad-CRT bridge consoles with mechanical keyboards and dial gauges, dual flight pods with yokes and center throttle quadrant in cockpit, central holo-table with 4-planet orrery and live holographic quest projector, 2-tier bunk beds with canvas bedding and stenciled metal footlockers, anglepoise desk lamp and gear hooks in quarters, overhead gantry crane and stacked shipping containers with cargo manifest screen, 19-inch equipment racks with patch bay loops and glowing vacuum tube cages in comms, and heavy airlock blast door with manual dogging wheel, hydraulic rams, and pressure dials. Non-overlapping physics bounds, rear-shifted bridge consoles (`Z = [0.2, 1.4]`), forward-shifted cockpit pods (`Z = [2.6, 3.8]`), and center pedestal colliders ensure wide-open transverse corridors at `Z = [1.4, 2.6]` across all rooms.
- In-World 3D content transfer: In T4, primary content lives diegetically in 3D: Quests in the Star Map holo-table, Standings on the Comms CRT terminal, Inventory on the Cargo Manifest, and the Bridge Welcome Hologram directly in front of the camera's original bridge position displaying "UHS Chem Club", meeting announcements ("Next meeting 9/29 in 702"), a top-right "Close [X]" badge, directional wayfinding arrows, and a bottom prompt ("Check out the star map for the latest quests!"). Any holographic projection (Bridge announcement directory screen & vertical beam via `clubHoloGroup`/`clubHoloBeam`, or Star Map holo-table planetary orrery & floating quest screen via `starmapHoloGroup`) always displays by default; dismissal flags (`clubHoloClosed`, `starmapHoloClosed`) are session-scoped (`sessionStorage`, cleared on new session/sign-in) so holograms only stay dismissed for the active session and pop back up on the next session. Projections can be closed and opened by pressing the "X" key (`stage.toggleAnyHolo()`, `stage.toggleClubHolo()`, `stage.toggleStarmapHolo()`), dispatching `club-holo:open|close` and `starmap-holo:open|close` events with debounced key handling.
  - **ONE HANDLER OWNS THE `X` KEY.** It is the window listener in `stage.js`,
    and nothing else may bind it. `FpsControls` used to bind it too, so every
    press toggled the board twice — open and shut inside one frame — and the key
    read as dead. The listener also ignores `e.repeat`, or holding the key would
    strobe the projection. `verify:holo` fails the build if a second owner
    appears.
  - **A press on a holo screen is not a dismissal.** The canvas raycast closes a
    projection only when the ray lands on the "Close [X]" badge the screen draws
    in its own top-right corner: each holo texture attaches that badge as a UV
    rectangle (`texture.userData.closeRect`, from `closeRectUv` in
    `materials/textures.js`, padded by a fingertip), and `stage` tests
    `hit.uv` against it. The whole surface used to be one close button, so
    reading the board — or clicking to steady the view — took it away. The 2D
    `CLOSE` controls on the bridge card and the star map terminal are unchanged.
  - **The bridge board is sized to the glass.** `stage.fitClubHolo()` scales the
    1.8 x 1.0125 m plate (and the beam that throws it, via
    `shipInterior.setClubHoloScale`) so the whole of it fits inside the viewport
    at its 1.4 m standing distance, minus the HUD, which covers the top of the
    view. It never scales above 1, and it re-fits on resize and on sign-in,
    since raising the HUD nav is 40 px off the top of a phone. In T3 and below, 2D full-page screens (`.screen-container`) remain active with matching dismissible/re-openable announcement cards with the same star map quest callout. Doorway frames in comms are positioned at corridor thresholds to prevent obstructing the Fleet Comms standings screen, and the Cargo Manifest terminal screen is offset (`Z = 0.370`) with polygon offsetting to eliminate coplanar Z-fighting and screen glitching.
- Erebus world scene: `src/three/world.js` and `src/three/world-data/erebus.json` define The Charge Gardens basin with 20 instanced pylon structures along a walkable route, survey lander ("SANDSTALKER") with boarding ramp, stratified sedimentary rock outcrops, procedural terrain heightmap (`getTerrainHeight`), amber celestial sky, banded gas giant vista (with `fog: false` celestial bodies), tuned desert haze (`fogNear: 70`, `fogFar: 280`), and atmospheric dust motes.
- T4 In-World Terminals: In T4, compartment interactions open `.in-world-terminal` tactical HUD overlays with `CLOSE` dismiss controls. Star Map holo-table integrates Sector 01 status and disembarking; Quarters integrates crew profile and avatar customizer; Cargo Hold integrates cargo manifest and trinket locker; Comms integrates standings; Settings integrates graphics tier (T4 default) and audio sliders. Bridge displays the floating directory kiosk instead of WASD/mouse look text prompts.
- T4 Learn deployment: In T4, `#/learn/unit01` enters the 3D Tallow world
  (`stage.enterTallowScene(siteId)`); walking to a bench and pressing `[E]` raises a
  `tallow:interact` event that routes to `#/learn/unit01/<questId>`, where the quest's
  instrument is deployed as the 3D bench with the frame as an overlay beside it. The
  router keeps the world scene across both routes (`isWalkableLearnRoute`), so stepping
  in and out of a bench never passes through the ship, and the last site is remembered so
  leaving a bench puts the player back in front of it rather than at the pad.
- T4 World Quest Deployment: In T4, `#/quest` enters the 3D Erebus world (`stage.enterWorldScene()`). The camera is dynamically reparented to `worldScene.scene` (and returned to `shipScene` upon exit) so Three.js continuously updates `camera.matrixWorld` without freeze, spawning above ground level (`groundY + eyeHeight`) facing Pylon 1 with active FPS navigation. The chemistry chamber deploys as an in-world instrument only when the player interacts with an active pylon, suspending FPS controls so the cursor and curved-arrow interaction operate cleanly, lighting its amber indicator in 3D upon clearance and returning cleanly to 3D terrain walking. Full-screen wrappers (`.app-viewport`, `.quest-hud-overlay`, `.quest-screen-flash`) strictly maintain `pointer-events: none` so molecule clicks and right-drag rotation reach the WebGL canvas, while cards (`.stage-prompt-card`, `.stage-dock-bar`, `.quest-nav-cluster`) claim `pointer-events: auto`.
- **The cursor is never captured.** Avalon is a teaching portal whose instruments are
  clicked — crates, bins, holo badges, a power dial — not an immersive shooter, and a pointer
  that disappears on the first click takes the very thing the player was pressing with it.
  `FpsControls.requestPointerLock` is therefore a **documented no-op**, not a missing call;
  looking around is left-click-and-drag on the view, everywhere, on every route. A caller who
  "just needs lock for this one case" reintroduces the trap. Two guards keep the walk out of
  the interface: `onMouseDown` ignores a press that landed on `.screen-container`, `.lq`,
  `.lq-world-panel`, a modal, a terminal or the HUD, and `onKeyDown` ignores a key aimed at a
  focused control inside any of those — without it an arrow key turning the scope's dial also
  walks the player off the bench. `stage.setWalkSuspended(on)` stands the walk down for an
  instrument that has no scene of its own (`FpsControls.releaseKeys` drops anything held, so a
  key that was down when the controls were disabled cannot come back latched).
- First-person controls: `src/three/fps-controls.js` provides unconstrained WASD + sprint (Shift) + Spacebar jump + drag-look navigation with sliding physics collision, penetration push-out resolution (`resolveBoxCollisions`), player radius of 0.25, terrain height clamping on Erebus, and contextual `[E]` interaction prompts at ship terminals and pylons. Movement is active in world exploration and gated behind active session authentication aboard ship; it suspends in quest overlays and puzzle chamber views, and clicks on `.cinematic-overlay`, `.modal-container`, and HUD elements never start a look drag.
- Planetary transit cinematics: Launch and atmospheric descent cinematics (`launch`, `erebus_descent`) trigger on transit to Sector 01 from the Star Map, Bridge, and Airlock without persistent one-time lockout, and are skippable via Click/Space/Esc. FPS controls are disabled during cinematic playback to prevent input leakage into the background world.
- Hero/prop shapes: `tools/hunyuan3d-shape-t4.ipynb` batches concept PNG/JPG images via Hunyuan3D 2.1 shape-only pipeline into `/kaggle/working/raw/*.glb` on NVIDIA T4; texturing is handled in Blender.
- Nano Banana PBR textures: procedural canvas PBR pipeline in `src/three/materials/textures.js` generating albedo, tangent-space normal maps, roughness, phosphor cathode distortion vignettes, and custom station screens (`createDurasteelTexture`, `createDurasteelNormalTexture`, `createBlastDoorTexture`, `createRackPanelTexture`, `createFootlockerTexture`, `createContainerStencilTexture`, `createKeyboardTexture`, `createDialGaugeTexture`, `createVacuumTubeTexture`, `createCrtScreenTexture`) coupled with Three.js `MeshStandardMaterial`.
- Starship cockpit: faceted durasteel canopy mullions, overhead avionics rack with amber task lighting, dual analog yokes, center throttle quadrant, armored bucket seats with 5-point harness straps, twin CRT monitors per pod, rudder pedals.
- Celestial vista: chromatic gas giant with rings, the banded desert planet Erebus, moons,
  an asteroid belt. Stars are blue-white and sand-gold, not neon.
  - `three/materials/celestial.js` draws every body with its own shader instead of image
    textures. Surfaces come from 3D simplex noise, and the only light is one sun
    (`SUN_DIRECTION`). The cabin lamps do not light them, so night sides are truly dark.
    Atmospheres are thin shells that only brighten on the day side, and the planet casts
    its shadow on the rings. The gas giant's tilt is set on a parent group, which keeps the
    rings on its equator. The asteroids are uneven, lumpy rocks built by
    `createAsteroidGeometry`.
  - `three/materials/starfield.js` puts the stars on a shell at radius 600–750, past every
    planet, sized in screen pixels by brightness, plus a very faint galactic band.
  - `stage.js` gives the ship scene `RoomEnvironment` PMREM
    (`environmentIntensity` 0.58, tone mapping exposure 1.28) so metal surfaces show rich specular reflections.
- Interior lighting rig:
  - `src/three/ship-lighting.js` implements `ShipLightPool` dynamically selecting the 7 closest light sources to the camera from 21 compartment and corridor positions with soft decay (1.2) and generous distance, plus a camera-mounted suit inspection light (strictly <= 8 PointLights for locked 60fps forward rendering).
  - Ambient base fill: `HemisphereLight` (0x8faac8 / 0x2e3544, 2.2) and `AmbientLight` (0x4a5668, 1.5) preventing crushed shadow voids.
  - Forward canopy starlight: `DirectionalLight` (0xdce6f8, 2.6) aimed from (-8, 16, 26) through the front canopy into the cockpit and bridge.
  - Physical 3D fixtures: `createCeilingLuminaire` mounts cast iron protective cages with warm sodium diffuser panels (`luminaireMat` #ffe6b0) across the central spine, transverse corridor, wing corridors, and all compartments, complemented by dual halogen runway guide strips embedded into the deck.
- Routes bind environment stills: `/art/cockpit.jpg`, `starmap.jpg`, `crucible.jpg`,
  `cargo.jpg`, `quarters.jpg`, `comms.jpg`, `airlock.jpg`.
- The app mark (`public/icon.svg`, rasterized to `icon-180/192/512.png`, and
  `favicon.svg`) is the HUD's hexagon in `--accent-amber` on `--plate-000`. It was
  electric cyan `#00e5ff`, which §2 bans outright; an installed Home Screen icon is
  the single most visible surface the product has, so it is held to the brief.

### 9. Layout invariants
- `--hud-h` is the height of the fixed header. `.app-viewport` padding and the fixed
  `.quest-hud-overlay` both derive from it; nothing may slide under the HUD.
- Everything must work at 375 px wide. Media queries at 900 px / 760 px / 620 px collapse
  the HUD, hide the legend and secondary chrome, shrink the chamfer, and cap the stage
  card height.
- **Phone layout lives in its own stylesheets**, linked after `holo.css` and scoped entirely to
  `max-width: 760px` (or narrower), so desktop is never affected:
  `mobile.css` (shell: two-row fixed HUD with a scrolling nav strip, `--hud-h` 92 px, or
  52 px when the nav is hidden via `:has()`; modal sheet, toasts, page furniture,
  transmissions, cinematic captions under the frame), `mobile-screens.css` (per-screen
  rules for landing → admin) and `mobile-quest.css` (quest, demo, Tier 1 fallback, gardens
  map). Inline template styles are overridden there through class hooks plus `!important`.
  Inputs are 16 px on phones so iOS does not zoom; safe-area insets are honoured
  (`viewport-fit=cover`).
  `mobile-game.css` (linked last) carries the twin sticks, the `100dvh` full-bleed
  canvas and the full-screen key; none of it is width-scoped, because a
  landscape-locked phone is routinely wider than 760 px.
  `mobile-landscape.css` targets sideways phones with
  `(pointer: coarse) and (max-height: 500px) and (orientation: landscape)` — they are often
  wider than 760 px — collapsing the HUD to one 44 px row and docking the Stage Deck to the
  right edge (`min(46vw, 400px)`) so the chamber keeps the left of the screen.
  The `[E]` prompt lives in the stick band, not over the view: `body.touch-walking`
  aligns `#fps-interact-prompt`, the `E` and `X` keys (`.tc-keys`), and the twin joysticks
  so their centers all lie on the exact line connecting the centers of the joysticks
  (`--tc-stick-center-y`: 90 px in portrait, 68 px in landscape via `transform: translateY(50%)`).
  Centred mid-glass it covered the very thing the player had walked up to read.
  On phones (`PHONE_QUERY` in `quest3d/viewer.js`, matching both files) `fitToOpenArea()`
  measures the HUD, `.quest-hud-top` and the visible deck, then uses `setViewOffset` to
  centre the chamber in the uncovered part of the canvas, zooming out when that area is
  narrower than a 1.7 widescreen view. It re-measures every 0.2 s; desktop projection is untouched.
  In `mobile-screens.css`, every screen root carries `m-screen m-<screen>`, and there are
  shared hooks: `m-grid-1` (grid drops to one column), `m-head` (header row wraps),
  `m-topbar`/`m-skip` (step rail and skip link), `m-foot`, `m-cta-stack`/`m-cta-row`,
  `m-tap`, `m-inset`, `m-subpanel` and `m-wrap`. On phones the Standings player table turns
  into stacked grid rows (`lb-row`, `lb-rank`, `lb-player`, `lb-team`, `lb-level`, `lb-xp`).
  When a new grid or table goes into one of these screens, add a hook to it.
  In `mobile-quest.css` the Stage Deck becomes a bottom sheet (≤ 46 dvh, internal scroll,
  sticky header so Close is always reachable; `stage-card-fallback` on Tier 1 lets it grow),
  stage lamps become 40 px-tall touch strips drawn by `::before`, and the quest hooks are
  `stage-header-main`/`stage-header-actions`, `banner-content`, `demo-actions`,
  `quest-modal-head`, `quest-debrief-stats`, `debrief-controls-left`, and in the Tier 1
  builders `fallback-arrow-row`/`fallback-arrow-glyph`/`fallback-step` (stacked, arrow turned down).
