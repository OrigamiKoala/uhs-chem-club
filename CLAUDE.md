# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal. Its audience is middle- and
high-school students who know little or no chemistry, so the product rule that outranks
everything else is: **teach through play, reveal vocabulary last.** A player draws lines
between glowing regions for twenty stages and only meets the words "electron", "curved
arrow" and "steric hindrance" in the epilogue, after the intuition is already built.

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
- `npm run verify` — `verify:quest` + `verify:learn` + `verify:geometry` + `verify:media` + `verify:flows` + `verify:ship` + `verify:tallow` + `build`. Run this before shipping.
- `npm run verify:quest` — static integrity check of all 20 Quest 1 stages (see below).
- `npm run verify:learn` — integrity check of the Learn track registry and its no-XP invariant.
- `npm run verify:geometry` — runs all 20 reaction animations headlessly and checks the chemistry
  on screen (see "Chemical realism" below). `--verbose` prints atom positions at every step.
- `npm run verify:media` — validates media manifest against assets and size budgets.
- `npm run verify:flows` — end-to-end smoke test of the API a new student touches.
- `npm run verify:ship` — asserts ship graph connectivity, 3-hop limit, hatch cones, and spline bounds.
- `npm run verify:tallow` — asserts the Tallow ground: every prop footprint disjoint
  (no two objects share space), sites clear of props, the sub-level excavation walkable,
  every charted Unit 1 quest sited, T4 decoration removable without stranding a site,
  and no withheld vocabulary in a place name.
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
  worlds and quests, pure data), `progress.js` (gating and completion, XP-free),
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
the three-rung `hints` ladder, the per-site `scans`, and the `concept` card plus its
`conceptTiming`. `STAGE_COPY` is folded onto `STAGE_CONFIGS` at module load so the
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
  shook it would see the fragments band and wrongly call it mixed. Canvas, not the 3D
  chamber, because the walk down through scales is a 2D reveal that runs the same on every
  tier and holds at 375 px.
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
  Exit and Findings review buttons, reopenable briefing and debrief stepper
  mounted via `createTransmissionElement` (diegetic CRT video loop, typewriter audio ticks and
  Vess radio murmur), prompt, readout, answer region, Commit key, miss banner, hint ladder (rung 1 free,
  rung 2 after a miss or 45 s, rung 3 after two misses; copy accurately conveys both paths), and reward card.
  Supports soft refusals via `{ ok: false, notYet: true, msg }` routed through `frame.note()` without burning hint rungs.
  It never sees an answer; the quest calls `clear()` or `miss()`. Briefings establish narrative problem context
  (max 2 sentences per stage briefing per CLAUDE.md §7) while prompts state un-prescriptive objectives giving players
  free reign over bench tools. Real chemistry concepts are introduced immediately after each stage on its reward card
  (Quest 1: atoms, elements, atomic mass, chemical bonds, molecules, compounds, mixture separation, matter classification;
  Quest 2: nucleus & Rutherford model, protons & neutrons, electrons & neutrality, electron shells & Bohr model, valence
  electrons & octet rule, atomic number & isotopes, ions & net charge, subatomic architecture) so learners connect
  hands-on observations directly to chemistry rather than waiting for an end-of-quest lecture.
  In `scope.js`, single-unit samples (`total <= 1`) are centered at `[0, 0]` so high-magnification targets
  remain visible in the aperture.
- **The benches in 3D** — at T4 the two Unit 1 instruments are built rather than drawn.
  `engine/instruments.js` is the dispatcher every quest imports: it hands back the canvas
  instrument at T3 and below and the 3D one at T4, and the two expose the *same API*, take
  the same declarations and plan every tool through the same pure functions, so a stage that
  grades correct on one grades correct on the other. Those planners live in the canvas
  engines and are the single implementation: `planSettle`, `planCut` and `PIECE_TO_SPREAD`
  in `scope.js`; `planBeam`, `planStrip`, `packCore` and `RING_RADII` in `corebench.js`.
  `engine/bench3d.js` is the shared physical bench (plated top, a station per sample with a
  recessed phosphor well, engraved plaques, a constrained lean-over camera, and
  `fitToOpenArea`, which uses `setViewOffset` to centre the instrument in the part of the
  screen the frame is not covering). `engine/scope3d.js` and `engine/corebench3d.js` are the
  instruments themselves, drawn with `InstancedMesh` so a 400-piece sample is five draw
  calls. `engine/bench-host.js` inverts the render dependency — the benches ask for a host
  and `main.js` registers one — because a quest module must stay loadable in plain Node for
  `verify:learn`, and importing the stage would drag three.js and two worlds' JSON in with it.
  **Both quest modules changed by exactly one import line and not one character of copy.**
- **Screens** — `learn.js` (the road), `learn-world.js` (one world's quests, or the walk HUD
  when the world is built as a place), `learn-quest.js` (the host frame). Styling in `src/styles/learn.css` (`.lq-*` for the
  quest bench, `.scope-*` for the instrument, `.lq-choice-row`, `.lq-tally`); phone rules under `.m-learn`,
  `.m-learn-world`, `.m-learn-quest` in `mobile-screens.css`.
- **Endpoints** — `learn/progress`, `learn/stage`, `learn/complete`. None returns an XP
  field; `learn/complete` is idempotent. Rows ride along on `bootstrap` and `player/me` as
  `learn` and are merged with `session.setLearnState`, which unions rather than overwrites
  so a stage cleared while the sync was offline cannot silently re-lock a quest.

To build a quest: copy the template into `src/learn/quests/<worldId>/<questId>.js`, point
the chart's `module` at it, flip its `status` to `'live'`, correct `stageCount`, and run
`npm run verify`. Nothing else in the app needs editing.

`verify:learn` also grades a built quest. A module must export `meta.stageCount` matching
its chart, and a table-driven quest exports `STAGES`, `SOLUTIONS`, `MISSES` and `stateFor`
so the check can assert — as `verify:quest` does for the Charge Gardens — that the intended
solution grades correct, that a plausible wrong answer is refused **with a reason**, that an
untouched bench never grades correct, that every stage has exactly three distinct hint rungs
and a reward card, that every bench declaration is well formed, that all `quest-btn-sm` buttons carry
`btn-secondary` or `btn-primary`, that stage briefings do not exceed 2 sentences, that sample notes
describe provenance only without leaking answers, and that all prompt/hints/briefings/check messages
comply with withheld vocabulary rules. It reads both styles:
`samples` with `particles` for the sampler scope (real kinds, `geom` covering every piece,
bonds inside the cluster) and `specimens` with `core` and `rings` for the core bench, where
shell capacity is enforced — two on the nearest ring, eight after that, nothing further out
while a nearer ring still has room. No solution may name a sample, row, bin or choice that is
not on the bench; a manifest may cover a subset of the plates (`widget.rows`), and every row
it shows needs a solution line.

### World 1 quest 1 — The Grain of Things (`unit01/q1-grain`, live)
Eight stages on an Imperial salvage bench on Tallow with an orbital Guild buyer inbound;
the player leaves knowing what an atom, an element, a molecule, a compound and a mixture
are and meets none of those words until the debrief. **The order is the design**: every
stage is something the player *does* with an instrument, introduced by diegetic Vess
transmissions (reopenable via Objective) that ground the fiction in certifying salvage
cargo. Power up until the picture stops getting finer (there is a floor) → which of two
identical-looking crates is one material → how many kinds hide in one crate sold as
single-source → run a cutter over four objects (one will not divide) → assemble the cluster
that repeats → file two vials against two manifests with the same ingredients → settle three
crates and read the bands → file a manifest of four unlabelled crates. Player-facing
vocabulary before the debrief is *piece, kind, cluster, crate, band, recipe, material*, and
that restraint is the product. The catalogue codes (CAT 01, 06, 08, 11, 16, 17) are atomic
numbers, never explained here; the debrief points at them as the hook into `q3-catalogue`.

### World 1 quest 2 — The Inside of a Piece (`unit01/q2-core`, live)
Eight stages on the core bench in Tallow's sub-level diagnostic lab, picking up where quest 1's
blade stopped. The Avalon needs reactor calibration and ion drive propellant from Imperial
deep-salvage canisters. Vess delivers clear, simple, jargon-free briefings across all eight stages:
fire a beam through a mounted piece to find its structure → count marked grains in the core →
deduce light particles from a sealed zero-charge canister → place eleven light pieces onto rings →
test specimens with a low-charge tester to predict trading behavior → check core marks to find coolant
match → strip light pieces to reach net charge plus two → classify three canisters on the manifest.
Briefings state the problem simply and plainly without technobabble or premature jargon.
Player-facing vocabulary before the debrief is *piece, core, grain, mark, ring, light piece, specimen, needle*;
the debrief names nucleus, proton, neutron (with isotope), electron, shell, valence and ion. Every
specimen is a real nuclide and balances unless a stage has stripped it. **The quest never connects
the marked count to the scope's catalogue** — the core bench does not talk to the catalogue,
preserving the proton-count reveal for `q3-catalogue`.

### Tallow — Learn world 01 as a place you walk (`three/tallow.js`, T4)

At T4, `#/learn/unit01` is not a list of quests: it is the ground they are played on.
The player walks a salt-flat refinery in first person, finds a bench, and presses `[E]`.

- **The look is not Erebus.** Erebus is an amber basin at low sun; Tallow is a bleached
  salt pan under flat overcast — the same SCOURED PLATE world with the colour leached out.
  Ground bounce dominates (a `HemisphereLight` off white crust), the sun is broad and
  weak with no disc, and the palette stays warm-neutral with a brown/sand bias throughout.
  The sub-level is the one place the sun never reached, so the colour survives there: it is
  built from `crucible.jpg`'s register, riveted and sodium-lit.
- **Four charted sites, two built.** `site-1` Salvage Bench (`q1-grain`) under the lean-to
  in the yard; `site-2` Core Bench (`q2-core`) down the stairwell in the diagnostic lab;
  `site-3` Catalogue Vault and `site-4` Tally Floor are `built: false` — real places you can
  walk to and read, which open nothing. **The world never invents a quest that has not been
  written**; `verify:tallow` fails if a site's `built` flag disagrees with the chart.
- **The sub-level is a real excavation.** The terrain mesh has a rectangular hole cut in it
  (triangles whose centre falls inside the footprint are dropped), the pit is built as
  geometry so its edges are machined rather than stretched, and `getTerrainHeight` resolves
  the ramp — so the player walks down instead of being teleported under the ground. The pit
  rim is box colliders split around the stair mouth, which is what makes the stair the only
  way in.
- **Nothing shares space with anything.** Every landmark in `tallow.json` declares a
  footprint, every pair is disjoint, and `verify:tallow` proves it by computing the
  distances rather than trusting the layout.
- **Only lamps are lit.** Sodium luminaires in the lab, the mast's obstruction lamp, and one
  indicator per built site, driven from the Learn track's own progress through
  `setSiteComplete` — the world reads state, it never keeps it.
- **Tier boundary.** Walking Tallow is T4. At T3 and below the Learn road is the screens it
  has always been and every quest completes exactly as before. `learn/worlds3d.js` is the
  registry that says which worlds are walkable and is the only file a second one needs.
  `minTier: "T4"` landmarks are decoration: `verify:tallow` simulates removing every one of
  them and asserts every site is still reachable.

## Rules that keep the game fair
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

Concept cards are rewards, not briefings. `conceptTiming: 'intro'` is reserved for cards
that teach the *controls* (stage 1's scan/drag, stage 11's arrow ordering); every card
that explains a *concept* is `'reward'` and appears after the solve, under
"WHAT YOU JUST FOUND".
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
- `docs/plans/learn-track.md` — the Learn road: ten worlds, 40 quests charted, two built
  (`unit01/q1-grain`, `unit01/q2-core`). Scaffolding, gating, routes, backend tab and
  verifier are in place. World 01 (Tallow) is also built as walkable ground at T4, with
  both of its benches as 3D instruments; the other nine worlds are charts only.
- `docs/plans/immersion-pass.md` — the campaign frame (the quartermaster Vess, pylons on Erebus),
  Session Zero onboarding, soundscape, and the video pipeline (all 14 loops & cinematics baked & integrated).

## Player journey
1. `#/` landing — cold open comms transmission, cockpit loop banner, and Create Account / Try a Pylon CTAs.
2. `#/demo` — Stage 1 sample, no account, intro modal explains mechanics & controls, graded by the same evaluator. One CTA only: the primary Submit key becomes `Create Account` once the stage is solved.
3. `#/register` — step 1 of 3 on the shared `stepRail`. Live validation mirrors
   `validateDisplayName` in `Util.gs` exactly, so no rule bites only at submit time.
4. `#/onboarding` — step 2. Four teams with guild names and live slot counts.
5. `#/bridge` — step 3. Resume/start CTA, progress bar, XP, level and team conditions.
6. `#/quest` → `#/leaderboard`, `#/inventory`, `#/quarters`, `#/settings`, `#/admin`.

Nav labels match page titles exactly: BRIDGE, STAR MAP, LEARN, STANDINGS, INVENTORY, CREW.

**The Star Map charts two roads.** `screens/starmap.js` carries a two-tab row in both the
T4 holo-table and the 2D page: `Active Quests` (the four campaign sectors, unchanged) and
`Learn Quests` (the ten Learn worlds, from `curriculum.js` with gating from
`learn/progress.js`). A world that is built as a place reads *Disembark to <world>* and
enters it in 3D; one that is not reads *Enter* and opens its quest list. The LEARN nav tab
is untouched, so neither road is reachable only one way.

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
- Authentication gating & 3D view: On unauthenticated routes (`/login`, `/register`, `/`, `/onboarding`), the 3D ship interior and vista are visible behind the account cards, but first-person WASD navigation and mouse look are locked (`fpsControls.enabled = false`) until the player signs in.
- Starship traversal spine: `src/three/ship-graph.js` defines an undirected navigation graph across all compartments (`bridge`, `cockpit`, `starmap`, `quarters`, `cargo`, `comms`, `airlock`) with 3–6 point `walkPath` splines, `hatchPos` view-cone markers, and `routeBinding`.
- Starship 3D interior: `src/three/ship.js` builds hyper-realistic physical rooms and interconnecting corridor spines along `walkPath` splines with procedural PBR durasteel plating with tangent-space normal mapping (`createDurasteelNormalTexture`), floor grating, runway halogen strips, chamfered hatch bulkheads, tactical quad-CRT bridge consoles with mechanical keyboards and dial gauges, dual flight pods with yokes and center throttle quadrant in cockpit, central holo-table with 4-planet orrery and live holographic quest projector, 2-tier bunk beds with canvas bedding and stenciled metal footlockers, anglepoise desk lamp and gear hooks in quarters, overhead gantry crane and stacked shipping containers with cargo manifest screen, 19-inch equipment racks with patch bay loops and glowing vacuum tube cages in comms, and heavy airlock blast door with manual dogging wheel, hydraulic rams, and pressure dials. Non-overlapping physics bounds, rear-shifted bridge consoles (`Z = [0.2, 1.4]`), forward-shifted cockpit pods (`Z = [2.6, 3.8]`), and center pedestal colliders ensure wide-open transverse corridors at `Z = [1.4, 2.6]` across all rooms.
- In-World 3D content transfer: In T4, primary content lives diegetically in 3D: Quests in the Star Map holo-table, Standings on the Comms CRT terminal, Inventory on the Cargo Manifest, and the Bridge Welcome Hologram directly in front of the camera's original bridge position displaying "UHS Chem Club", meeting announcements, and directional wayfinding arrows. In T3 and below, 2D full-page screens (`.screen-container`) remain active.
- Erebus world scene: `src/three/world.js` and `src/three/world-data/erebus.json` define The Charge Gardens basin with 20 instanced pylon structures along a walkable route, survey lander ("SANDSTALKER") with boarding ramp, stratified sedimentary rock outcrops, procedural terrain heightmap (`getTerrainHeight`), amber celestial sky, banded gas giant vista (with `fog: false` celestial bodies), tuned desert haze (`fogNear: 70`, `fogFar: 280`), and atmospheric dust motes.
- T4 In-World Terminals: In T4, compartment interactions open `.in-world-terminal` tactical HUD overlays with `CLOSE` dismiss controls. Star Map holo-table integrates Sector 01 status and disembarking; Quarters integrates crew profile and avatar customizer; Cargo Hold integrates cargo manifest and trinket locker; Comms integrates standings; Settings integrates graphics tier (T4 default) and audio sliders. Bridge displays the floating directory kiosk instead of WASD/mouse look text prompts.
- T4 Learn deployment: In T4, `#/learn/unit01` enters the 3D Tallow world
  (`stage.enterTallowScene(siteId)`); walking to a bench and pressing `[E]` raises a
  `tallow:interact` event that routes to `#/learn/unit01/<questId>`, where the quest's
  instrument is deployed as the 3D bench with the frame as an overlay beside it. The
  router keeps the world scene across both routes (`isWalkableLearnRoute`), so stepping
  in and out of a bench never passes through the ship, and the last site is remembered so
  leaving a bench puts the player back in front of it rather than at the pad.
- T4 World Quest Deployment: In T4, `#/quest` enters the 3D Erebus world (`stage.enterWorldScene()`). The camera is dynamically reparented to `worldScene.scene` (and returned to `shipScene` upon exit) so Three.js continuously updates `camera.matrixWorld` without freeze, spawning above ground level (`groundY + eyeHeight`) facing Pylon 1 with active FPS navigation. The chemistry chamber deploys as an in-world instrument only when the player interacts with an active pylon, suspending FPS controls and releasing pointer lock so the 2D cursor and curved-arrow interaction operate cleanly, lighting its amber indicator in 3D upon clearance and returning cleanly to 3D terrain walking. Full-screen wrappers (`.app-viewport`, `.quest-hud-overlay`, `.quest-screen-flash`) strictly maintain `pointer-events: none` so molecule clicks and right-drag rotation reach the WebGL canvas, while cards (`.stage-prompt-card`, `.stage-dock-bar`, `.quest-nav-cluster`) claim `pointer-events: auto`.
- First-person controls: `src/three/fps-controls.js` provides unconstrained WASD + sprint (Shift) + Spacebar jump + mouse look navigation with sliding physics collision, penetration push-out resolution (`resolveBoxCollisions`), player radius of 0.25, terrain height clamping on Erebus, and contextual `[E]` interaction prompts at ship terminals and pylons. Movement is active in world exploration and gated behind active session authentication aboard ship; pointer lock automatically suspends in quest overlays and puzzle chamber views, and clicks on `.cinematic-overlay`, `.modal-container`, and HUD elements are excluded from pointer lock capture.
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
  `mobile-landscape.css` (linked last) targets sideways phones with
  `(pointer: coarse) and (max-height: 500px) and (orientation: landscape)` — they are often
  wider than 760 px — collapsing the HUD to one 44 px row and docking the Stage Deck to the
  right edge (`min(46vw, 400px)`) so the chamber keeps the left of the screen.
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
