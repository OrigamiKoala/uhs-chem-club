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

**Nothing is NAMED without being explained — AND NOTHING SELF-EVIDENT IS EXPLAINED
ANYWAY.** The vocabulary schedule governs the chemistry; this governs everything else the
player has to touch. "Read the needle", "load the rings" and "set the field" are clear
sentences addressed to somebody who has already used the bench, which is the one reader
this product is not for — so a key whose LABEL does not say what it does carries one plain
sentence, drawn under the keys and left there for as long as the stage offers it, never a
tooltip, never once on first use, never only inside an earned hint.

**But a key whose label does say it carries nothing.** "Tip Sample" tips the sample.
"Strike It" strikes it. "Reset Sample" resets the sample. "Tapping a card" reads the card.
Every bench once opened with a panel of such sentences restating its own key caps back at
the player: a manual standing between them and the instrument, teaching nothing that
pressing the key once would not. Nine quests carried about thirty such lines and now carry
ten. A quest declines a legend by leaving the control out of its `TOOL_TEXT`, and
`toolNotes()` draws nothing rather than an empty "What these do" heading. `verify:learn`
therefore does NOT fail over a missing legend; it fails over a legend that exists and is
malformed, and runs every one that exists through the same withheld-vocabulary gate as a
prompt. **A legend is one short sentence**, under about eighteen words; it is a key legend,
not a manual. A tool's line may change as
words are earned: the needle's says "light pieces" until the stage after electrons are
named and "electrons" from then on. When a prompt, hint or refusal names a control, it
quotes it — `Press "Fire Beam"`, `Press "The middle"` — so the sentence cannot be read as
prose. Key labels obey all of this too: the core bench's three views read **Whole piece /
The middle / Outside** under **View**, not Whole / Core / Rings under "Field".

**A PROMPT STATES THE OBJECTIVE AND NEVER THE ROUTE.** "Tip Sample A down the chute, read
the code on each bin that caught pieces, and say what the split means" is not a task, it is
a procedure — the player executes three instructions and the discovery has already been
made for them. It is now "Say why Sample A splits across two bins instead of landing in
one." The route is what the bench is for. Rung 1 of the hint ladder is where "press this
key" belongs, because a hint is earned.

**A hint rung is ONE sentence.** Rung 1 says what to do with the tool, rung 2 says what to
look at or compare, rung 3 gives the exact method or calculation structure, but NEVER reveals
the final answer or arithmetic result. Hints must guide the user to solve the problem themselves,
never spoon-feed solutions or answers. Strip all feature advertisements and decorative fluff;
keep instructions necessary, clear, and direct.

**NOTHING EVER BLOCKS A PLAYER WHO HAS THE RIGHT ANSWER.** A stage may refuse a blank
answer — there is nothing there to grade — and it may refuse a wrong one with a reason. It
may not refuse a correct one because the player did not first press a key. Seventy such
gates existed across the nine built quests ("Press \"Tip Sample\" first", "Read at least
two cards in that column before answering", "Turn the Power dial up and watch the sample
first") and every one of them is gone. A player who already knows, or who worked it out
from something the stage did not anticipate, is right, and the bench says so. Where driving
the instrument IS the answer — `q2-core` stage 7 and `q4-ledger` stage 5 ask for a sample
brought to a given charge — the untouched case is a wrong answer WITH A REASON, not a gate.

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
early, and a term the schedule promises that no card ever delivers. Every built quest in Units 1 and 2
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
  + `verify:media` + `verify:flows` + `verify:ship` + `verify:voyage` + `verify:tallow` + `verify:ligar`
  + `verify:bench` + `verify:holo` + `verify:normals` + `build`. Run this before shipping. **The build
  empties `dist/`, which is gitignored** — anything placed only in `dist/` (reference art
  has been) is deleted by it. Source images belong in `public/` or `assets-src/`.
- `npm run verify:quest` — static integrity check of all 20 Quest 1 stages (see below),
  including the per-stage chemistry card and its three-sentence ceiling.
- `npm run verify:console` — solves the T4 chamber console's fit at fourteen viewports and
  asserts the ceiling the desk is held to: one surface, low, never more than 25% of the
  height of the glass.
- `npm run verify:learn` — integrity check of the Learn track registry, its no-XP
  invariant, and the practice sets (five per built quest, assembled at world scope).
  It does **not** demand a legend under every key (see "Nothing is NAMED" above); it holds
  every legend that exists to one well-formed, vocabulary-clean sentence.
  It also **presses every join-bench pair plate in Node** and measures what comes
  out: electrons conserved, and no piece left over the capacity of its outer shell.
  **A refusal may not carry its stage's answer**: every miss message the stage can produce
  (its MISSES, the untouched bench, and its check run over every other value the widget
  offers) is searched for the answer read from `SOLUTIONS` — a number as a standalone
  token or word, a `rings` sequence, the sample named by a "which one" answer, a sample
  beside its correct bin. Signed figures are exempt (they are charges), and any collision
  that remains is a documented per-stage allowlist entry. **Every hint rung is one sentence.**
- `npm run verify:geometry` — runs all 20 reaction animations headlessly and checks the chemistry
  on screen (see "Chemical realism" below). `--verbose` prints atom positions at every step.
- `npm run verify:media` — validates media manifest against assets and size budgets.
- `npm run verify:flows` — end-to-end smoke test of the API a new student touches.
- `npm run verify:ship` — asserts ship graph connectivity, 3-hop limit, hatch cones, and
  spline bounds, then **builds the Avalon and Erebus in Node** and asserts that nothing
  in either occupies the same space as anything else. It also flood-fills the deck against
  the real colliders and holds **every nav anchor the HUD dollies to** to standable,
  reachable deck — the check that was missing when four of the seven stood in the solid.
  **An open door is a hole**: a line through every doorway meets nothing with the leaves
  parted and a leaf with them shut (every portal was once a solid plate).
  **Reaching a room's middle is not walking around it**: every standable cell inside every
  room must be reachable (the furnace room passed the centre check with its whole starboard
  half sealed behind a slag bin, and 0.38 m in front of the firebox door), and every ship
  `setMode` in `stage.js` must clamp the walk to `SHIP_BOUNDS` itself — a hand-written box
  ending at z −8.5, older than the furnace room, stopped the player half a metre inside its
  doorway while every flood-fill passed. **Every compartment declares a light** (the pool
  has no table of its own any more), and **every door opening keeps pocket for both
  leaves** — half the opening of solid wall each side before the end of its run, since
  a leaf that slides off the end of a partition sticks out into the next room.
  On Erebus it also **flood-fills the walk from the spawn** against the real colliders
  (player radius included) and requires every pylon's approach mark to be reached: the
  basin now has outcrops, an arch, a skeleton and a derelict in it, and a landmark in the
  wrong place would wall a pylon off.
- `npm run verify:bench` — deploys ALL FIVE Unit 1 instruments onto the real Tallow benches,
  then ALL FOUR Unit 2 instruments onto the real Ligar benches (each fed the widest stage
  its quest declares, read from the quest's own `STAGES`), in Node, and measures them: every site faces the ground the player walks in from, and every
  body, readable face and control lands inside the glass at six aspects, clear of the HUD. It
  also drives `aimForChrome` — the camera correction a deployed bench applies — and asserts
  it converges with the readable faces under the frame and the working end still in view;
  and it measures everything the instrument STANDS on the plate against the world it is
  standing in, in the BENCH's own frame and per mesh (a world AABB of a 4.8 m back lip on a
  rotated site says everything hits everything), with the cabinet cased open and hidden
  bodies skipped, because one object has two states. That check found every screen stand
  seated inside a swarf chip (and, on Ligar, a scope stand inside a stone chip on the back
  lip at four stations), the assay hopper's legs inside the bench's tool rail, its bin
  floors inside the weld bead down the middle of the plate, and a catalogue board so tall it
  leaned back through the bench's own lip into the lean-to behind it. **An instanced body is
  measured per instance**: its geometry box is the UNIT body, so taken at face value it
  reported a metre-wide box round every heap and duly found the assay floor inside a vice two
  metres away — nothing was wrong with the bench, the ruler was. **A baked body is measured
  per part** for the same reason: a site baked by `mergeStatic` is one mesh per material,
  and the box round the one holding its plate and its lean-to encloses the bench standing
  in the middle of them, so the group's `partBoxes` are measured instead — and a **merged
  rock** (Ligar's `basalt.js` meshes; a quarry floor's rubble is one mesh) by the boxes it
  records on itself. Finally it puts **every
  stage `q3-catalogue` and `q5-assay` declare** through the built instrument: the board
  offers the slots the quest is about to grade against, and a pour places every piece
  `planPour` says it places. On the board it **presses**, through the real pointer path —
  project the target, `setPointer`, real raycast — so a card taken, filed and lifted is
  measured as the instrument resolves it, and one card is never turned into none.
  It puts **every stage `q1-joins` and `q2-lattice` declare** through the built join bench
  the same way: each piece in the picture is pressed on its screen and must read back that
  plate and that piece; the jaws must be shut exactly when `planJoin` says a pair holds; a
  block must show crumbled, held, molten and lit exactly as reported. In the world-fittings
  pass an **instanced field is measured one instance at a time** (the union of a quarry's
  floor rubble is a box round the whole floor) and a mesh marked `userData.openShell` — a
  barrel vault — by its triangles, since a vault has an underside and no inside.
- `npm run verify:voyage` — the Avalon can land and a player can get off it (see "The
  voyage" below): with the airlock's outer leaf open, a line through the hatch at head,
  chest and knee height meets nothing aboard (a lining sheet once stood in the opening),
  and with it shut the line stops on the leaf; on Tallow, Ligar and Erebus the landing
  `solveLanding` picks keeps the hull and ramp clear of every collider, puts the ramp's
  foot on open ground inside the walk and within a ramp's reach of the sill, on a quarter
  turn so the hull's collider box is exact; and the chevron's route aboard stays on deck.
- `npm run verify:ligar` — Ligar's ground, held to every rule `verify:tallow` holds Tallow
  to, and three a quarry needs: it **builds the real world** and measures every pair of
  bodies (instanced fields per instance, via `userData.partBoxes`); it fails any body
  **buried** under the ground it stands on (the ground is exempt from overlap, so a
  buried body overlaps nothing — four conveyors once stood tail-down five metres under
  the flat, and passed); and it **flood-fills the walk** from the spawn against the real
  colliders and walking surface, requiring every bench to be reachable on its own floor
  and **no reachable cell to drop off a ledge**, which is what proves the cut is sealed
  except by its ramp. Each sign must read `Bench N - <quest title>`. It also requires
  the rock to BE the column kit (twenty-plus merged basalt meshes, thousands of boxed
  columns — a builder quietly falling back to a unit hexagon fails it), the ground to
  run to the horizon, and every Ligar shader patch (ground, weather, air) to land on
  three's real shader source.
- `npm run verify:holo` — one owner for the `X` key, and the comms board never invents a
  guild score.
- `npm run verify:normals` — a dome put through both `heightToNormal`s must lean away from
  its centre on every flank under three.js's tangent frame, and no material may carry a
  negative `normalScale` or negate a sampled normal's y (see "Surfaces" below).
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
  `#modal-container` is one element shared by every dialog, so both its listeners (the
  backdrop click and the Escape key) are held and detached on close, and on a show over
  an open dialog — which replaces it without running its `onClose`. A listener left
  behind made every later backdrop press run every earlier dialog's close.
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
  The ship is `three/ship.js` (orchestrator and the public `ShipInterior` API) over
  `three/ship/`: `materials.js`, `kit.js` (the shared lining and parts), `hull.js`,
  `doors.js`, `corridor.js` and one builder per compartment in `ship/rooms/` — see
  "The Avalon" under §8.
  `stage.js` holds three modes (`ship` | `world` | `quest`) and `activeWorld`, which is
  whichever planet the player is standing on — Erebus (`world.js`), Tallow (`tallow.js`)
  or Ligar (`ligar.js`). The two Learn worlds share ONE arrival and render path
  (`enterLearnWorld`, `isLearnWorld`, `nearExitPad`, the Learn branch of the loop), so
  Ligar cannot come to differ from Tallow in how a player lands, walks or leaves; the
  exit pad is read from the world's own `landing-pad` landmark. Tone-mapping exposure is
  per place: `SHIP_EXPOSURE` 1.28 for the ship, `EREBUS_EXPOSURE` 0.82 for the desert
  (its sky and sand are lit to daylight levels), `TALLOW_EXPOSURE` 0.92 for the
  salt pan, because a bright overcast rendered at the dark interior's exposure washes the
  crust out to paper, and `LIGAR_EXPOSURE` 1.16, because black stone at dusk throws almost
  nothing back. **A chamber that brings its own room is drawn at `SHIP_EXPOSURE` whatever
  world it was opened on** — the Charge Gardens were lit for it — while a bench deployed
  in a world takes that world's (the quest branch of `render()`). The renderer's shadow map is enabled
  at T4 only; every world light already asked for shadows and none were drawn before.
- `three/voyage.js` — **the voyage**: flying the Avalon to a world at T4 (see "The voyage"
  under §8). `three/ship-exterior.js` is the Avalon seen from outside plus `solveLanding`;
  `three/guide-arrow.js` the lit chevron (and its plate on the glass) that leads to the
  airlock aboard and to a bench or pylon on the ground; `screens/voyage.js` the helm plate
  drawn while the ship is under way.
- `three/tallow.js` — **Tallow**, Learn world 01 (see "Tallow" below), built from
  `three/world-data/tallow.json` with PBR surfaces from `materials/tallow-textures.js`.
- `three/ligar.js` — **Ligar**, Learn world 02 (see "Ligar" below), built from
  `three/world-data/ligar.json` (generated by `tools/gen-ligar-layout.py`) over
  `three/ligar/` (atmosphere, terrain, the `basalt.js` column kit, weather, plant,
  vista, industry, effects) with PBR surfaces from `materials/ligar-textures.js`.
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
  `joinbench.js` is the **join bench**, Ligar's instrument, and it answers one
  question at two scales — which is why it is one bench and not two. A PAIR plate
  clamps two pieces face to face and presses them together; a SLAB plate holds a
  block of finished material you can hit, heat, cool and put a current through.
  Everything it reports is derived by a pure function from the declaration —
  `planJoin` decides what a press does from the two pieces' shells and kinds,
  `planSlab` decides the picture from a block's `build`, `conductionOf` decides
  whether a current passes from that build and the state the block is in. The one
  figure a block is simply told is the temperature it comes apart at, because that
  is a measurement. A slab may be `sealed`, meaning the bench resolves nothing
  inside it and says so; that is what makes "identify it from how it behaves" a
  real task rather than a look-up. A charge in a block is told apart by a
  STENCILLED plus or minus and never by colour.
  `catalogue3d.js` is the **catalogue board built** and `assay3d.js` the **assay works
  built** — see "ALL FIVE Unit 1 benches are BUILT at T4" below. Each exposes its drawn
  counterpart's API method for method and plans through the same pure functions
  (`readEntry`, `planPour`, `packBin`), so a stage grades identically on either.
  `corebench.js` is the **core bench**: one piece shown in three fields — `whole` (a haze
  with the core drawn to scale, which is a speck), `core` (the grains separated and
  probeable, marked ones told apart by a stencilled cross and never by colour) and `rings`
  (light pieces at fixed radii). It carries a beam whose return counts are fixed by which
  track hits the axis rather than by a threshold on a spread (drawn with high-contrast
  through-tracks, bright #e0982b rebound beam, and central impact spark), a stripper that knocks
  one light piece off the outermost ring, and a reset. It knows no chemistry: a mark is a mark,
  and what a specimen *does* (`behaviourOf`) lives in the quest.
  `frame.js` is the **quest frame**: stage rail (cleared lamps are
  walkable — there is no XP here for a replay to farm; 44px touch targets on phones, the
  current lamp carries `aria-current="step"`), a Findings review, a briefing and debrief stepper
  mounted via `createTransmissionElement` (diegetic CRT video loop, typewriter audio ticks and
  Vess radio murmur), prompt, readout, answer region, Commit key, miss banner, hint ladder (rung 1 free,
  rung 2 after a miss or 45 s, rung 3 after two misses; ONE wait line, replaced rather than
  appended, naming the true condition for the next rung), and reward card.
  **There is ONE way out, and it is the host bar's `Leave Bench`.** The frame's own Exit key is
  gone. `Hide Panel` (which folds the plates to the dock) renders only over a BUILT bench, since
  on a drawn bench there is nothing behind the page to reveal.
  **`setStage` resets everything a stage can leave behind**: the dock key's `data-act` goes
  back to `submit` (a clear sets it to `next`, and a stale `next` once let a player with the
  panel folded skip an unsolved stage), along with banners, hints, the wait line and the reward.
  **Findings is the gathering-up**: it lists the reward card of every cleared stage in order
  (quests pass `rewards: STAGES.map(s => s.reward)`), not a copy of the card already on screen.
  **The debrief can be left** by Escape, the backdrop or `Close`; `onDone` still runs exactly
  once. A repeated identical miss is re-announced (the banner empties, then refills), and
  selection keys carry `aria-pressed` synced from their `selected`/`lit` class by the frame,
  so no quest has to remember it; a "Lower"/"Raise" stepper is named after its field.
  `.lq-prompt-strip` repeats the prompt above the bench wherever the deck stacks under it
  (≤1000 px), because a phone player working the bench had scrolled the objective away.
  Supports soft refusals via `{ ok: false, notYet: true, msg }` routed through `frame.note()` without burning hint rungs.
  It never sees an answer; the quest calls `clear()` or `miss()`.
  **A BRIEFING IS A QUEST'S, NOT A STAGE'S.** Every built quest carries exactly one —
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
    quest's own `setPower`. (`q3-recipe` did not pass it, so its built scope had no knob.)
- **The tool keys are keys ON THE BENCH, and the DOM is still the only copy of them.** At
  T4 "Fire Beam", "Press Together", the View keys and the rest used to be buttons in the
  overlay's `.lq-controls`, pressed on a page floating over the instrument. Now
  `engine/bench-keys.js` `mirrorBenchKeys(controlsEl)` (called by the frame when
  `benchesAre3D()`) reads those buttons — groups from `[role="group"]` and its
  `aria-label`, legend from the button's own text, badge from a child element (the
  tester's charges), lit from `lit` / `selected` / `aria-pressed`, disabled from the
  button — and hands them to `BenchViewer3D.setKeys(groups, onPress)`; a press on a key on
  the bench calls `.click()` on the real button, so handlers and grading are untouched and
  identical on every tier. It finds the viewer through the registry in `bench-host.js`
  (`registerBenchViewer` / `activeBenchViewer` / `onBenchViewer`), because the frame is
  built before the instrument; a MutationObserver re-syncs once per frame, and the class
  `lq-keys-on-bench` on the controls element is what lets the CSS hide the mirrored DOM
  keys — VISUALLY, never with `display:none`: they stay focusable and in the accessibility
  tree, and the strip shows itself on `:focus-within`, because the 3D keys are pointer
  targets and a keyboard or screen-reader player would otherwise have no tools at all. `buildKeyBank()` (pure builder, like `buildPowerDial`) makes a raked steel face on
  a dark plinth with a proud durasteel cap per key, the legend engraved on it verbatim, a
  filament lens beside it lit only when the key is, and a dull legend when disabled; the
  keys are grabbables, so a press is never a camera drag, and a key fires on release only
  if the pointer is still on it. **Where it stands is a collision question**: the plate
  carries a weld bead down z = 0, swarf along the back lip, a vice and a tool block on the
  front corners and the note slips in front of every station, so the panel stands in the
  band BEHIND the bead (z -0.04 to -0.47), outboard of the instrument, right first then
  left, one column or two (over five keys); a bench laid end to end (q4-ledger stage 8,
  five samples) leaves no plate beside it, and there the keys stand as a low rail along
  the front edge. `verify:bench` makes every instrument carry four keys and six at its
  widest stage and holds the bank to the glass, the bench ends, clear of the instrument,
  clear of the world, and pressed through the real pointer path.
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
  instrument's bodies clear it. **They solve for `framedNodes()`, not for stations**: two
  of the five instruments are not station-shaped, and an aim written against `this.stations`
  simply did not aim them. An instrument that builds its own bodies registers each with
  `addFitNode(group, topMark, face)`, where `face` is the readable surface that must be
  WHOLLY in the glass — half a picture is not a picture — which slides the whole bench down into the empty glass without moving
  the camera, so how steeply the player looks into the wells is unchanged. `fitToOpenArea`'s
  `setViewOffset` is still the answer for a bench that builds its own room, and must never
  be used on the world camera: it would re-frame the whole of Tallow. `verify:bench` drives
  `aimForChrome` at six aspects and fails the build if a screen still runs under the frame
  or a well is aimed off the bottom.
- **THE FRAME IS A CLOSEABLE 2D OVERLAY OVER THE LIVE BENCH.** At T4 the quest frame stays
  a page over the view on every Tallow bench (`learn-quest.js` sets `inWorld = false`), and
  its `Hide Panel` key folds every plate away to a `Stage Panel` / `Commit` dock in the corner —
  so a player who wants to look at the instrument they are standing at can have the whole
  glass. `.learn-quest-overworld` in `learn.css` is what makes that work at all: the frame's
  containers are `pointer-events: none` and only the plates themselves take a press, because
  a transparent full-width box still swallows every click aimed at the bench behind it.
- **THE DECK IS HELD TO THE GLASS AND COMMIT NEVER LEAVES IT.** `.lq-deck` used to be
  one column that grew with the stage, so a long prompt over four samples sorted three
  ways ran a screen and a half tall and Commit (and the miss banner) were what the player
  had to scroll to find. It is three zones now: `.lq-prompt` pinned at the top,
  `.lq-deck-body` (readout, answer, hints) which scrolls only if it must, and
  `.lq-deck-foot` (banner, Hint, Commit) pinned at the bottom. Beside the bench the deck
  is sticky and `LearnFrame.fitDeck()` bounds it to the glass below where its top
  ACTUALLY is (the host bar and rail stand above it until the page scrolls); `reveal()`
  scrolls only the body to a new hint or reward, never the page. Stacked under the bench
  (≤1000 px, phones) it is part of the page. The column is `clamp(340px, 30vw, 440px)`,
  and over a built bench (`.learn-quest-overworld`) it stays docked right down to 761 px,
  because there the left column holds no instrument. **A sorting answer is a matrix, not
  a stack:** `compactBins()` in `setWidget` lifts the per-bin notes (identical on every
  row) into one `.lq-bin-legend`, ties each key to its line with `aria-describedby`, and
  marks the list `.lq-bins-matrix` so each sample is one row of short keys beside its name
  (the name turns amber once answered). No quest markup changed; a one-row list is left
  alone.
- **AND THE AIMING STOPS THE MOMENT THE PLAYER TAKES A STEP.** A deployed bench stands on
  ground that is still underfoot, so the player keeps their feet while they work it: W/A/S/D
  walks, a drag on the view turns, and collision and the terrain clamp are the world's as
  usual. The instrument stands them in front of the stations and aims them clear of the
  chrome, and `playerWalked()` in `bench3d.js` — the camera anywhere but the spot it was
  last stood on — flips `playerControlled` for good, after which `applyCamera` and
  `fitDeployedAim` return without touching anything. Two rules make that possible and both
  are load-bearing: the deployment frame declares `walkOwnsHeight`, so the instrument aims
  but never sets how high the head is (the walk clamps the same camera to the terrain every
  frame, and the two writing the same y is exactly the fight that made the view judder and
  W go nowhere); and the bench reads the look drag itself, through `turnCamera`, with the
  walk's own mouse path stood down by `fpsControls.mouseLookLocked` — a press that lands on
  a crate or a dial is the bench's before it is the view's, and two readers of one drag turn
  the view twice as far as the hand moved. `fpsControls.walkKeysAtBench` lets W/A/S/D and
  Shift through a focused panel control while a bench is up, because no key cap or dial in
  this product wants them and a player who has just pressed Commit must be able to step
  sideways without first thinking to click the ground; arrows and Space stay blocked, since
  the power dial does want those. In Node there is no walk, `walkOwnsHeight` is absent, and
  `verify:bench` measures the bench the way it always did.
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
- **ALL FIVE Unit 1 benches and ALL FOUR Unit 2 benches are BUILT at T4.** `BUILT_BENCHES`
  in `engine/instruments.js` holds the whole of Units 1 and 2, and `benchIsBuilt(questId)` is what `screens/learn-quest.js`
  asks to decide whether the player keeps their feet at a real object or the bench is drawn
  as a page over the flat.
  - The **sampler scope** (`scope3d.js`) used to be excluded on the argument that a
    microscope's picture is a picture. What that missed is where the picture belongs: on a
    bench the player has walked to there is a SCREEN to put it on, the crates sit in real
    wells on the plate, and the power control is a milled cap they reach over and turn.
  - The **core bench** (`corebench3d.js`) was always the other case, and serves both
    `q2-core` and `q4-ledger` — the second needed nothing but its name in the list.
  - The **catalogue board** (`catalogue3d.js`) is the case the flat-picture rule does not
    reach, and reverses the drawn board's own header. A card index RESOLVES nothing: it is
    a drawer of cards and a board of slots, objects the size of a hand. There is no picture
    of a card; there is a card. So it is built the whole way — a raked drafting board on an
    easel across the back of the plate with a milled slot per place, and a tray of loose
    cards in front of it. **Still two taps, never a drag**, for the reason the drawn board
    gives: a drag across small targets is the gesture this audience cannot make, and
    dragging a body through a 3D scene is worse. A card in the hand lifts off the tray,
    stands up face-on and turns its ink amber; open slots light while you are holding one.
    **A PRESS IS RESOLVED BY THE STATE, NEVER BY WHAT THE RAY HIT FIRST — AND NOTHING MAY
    CONSUME A CARD.** Every slot carries a generous invisible pick box, because a card-sized
    slot at a glancing angle is a small thing to hit with a fingertip, and that box is deep
    enough to swallow the card standing in it: the ray therefore answers "slot" whether the
    slot is full or empty. `onPointer` reading that as an empty slot is what made a filed
    card unliftable on stages 1, 3 and 8 and then silently overwrote it with the next card
    placed — a card the player watched vanish off the bench. A press the ray resolves as a
    FULL slot is a press on the card in it, and a card leaves a slot only through
    `liftFrom`, so it is always either in the drawer or in a slot and never nowhere.
    `verify:bench` drives the real pointer path — project the target, `setPointer`, real
    raycast — and asserts a filed card lifts and the card count never drops; the check it
    replaced set `placed` and `drawer` by hand and asserted they read back, which tested an
    assignment and could not have caught this.
  - The **assay floor** (`assay3d.js`) is the one built instrument with NO flat picture at
    all, because its output is not an image — it is objects falling into containers at
    arm's length. A hopper on legs, a chute, a deflector plate, a row of catch bins, and
    the pieces really fall down it. **The counting the flat-picture rule exists to protect
    is protected by the geometry instead**: every bin is open-fronted behind a sight glass
    and every piece that lands stacks into ONE PLANE just inside it, on the grid `packBin`
    computes, so nothing is ever behind anything, every piece is at a countable size, and
    the heap and the tally stencilled over it are the same measurement.
  - The **join bench** (`joinbench3d.js`) serves `q1-joins` (pair plates) and `q2-lattice`
    (slab plates). It is a **subclass of the drawn `JoinBench`**, not a second
    implementation: `press`, `strike`, `heat`, `cool`, `test`, `run` and the animation
    clock are inherited unchanged, so the two tiers cannot grade differently. It overrides
    only where things are drawn: the resolved picture on each station's raked screen (the
    same `drawJoinField` / `drawSlabField`), and hardware in the well — a press whose jaws
    close by exactly the inherited `t`, or a block in a clamp that cleaves, crumbles,
    holds, glows molten and lights a lamp for a current. **The block shows what the bench
    reports and nothing more** — its pose is read off `item.state`, `item.struck` and
    `item.current` — so a SEALED block gives away exactly what the readout already says.
    A press on a screen resolves through `hitTestJoin`; a press on the jaws or the block
    selects its plate (`recUnderRay`); a press that read a piece never also selects.
    It tears itself down rather than calling the base `dispose`, which assumes a DOM host.
  - **The cased-up cabinet says which bench it is.** `buildBench({ kind })` in `tallow.js`
    gives site 3 a bank of card-index drawers and site 5 a weigh-head with a big round
    scale over a shrouded chute. Five identical cabinets with a microscope's aperture in
    them meant a player walking the flat could not tell the card index from the assay works
    until they were standing at it. The bench under them is the same bench.
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
  `JoinBench` joined the dispatcher with Ligar, so a Unit 2 quest imports its bench from
  `instruments.js` like every other: `q1-joins`, `q2-lattice` and `q4-weigh` each changed
  by one import line and not one character of copy (`q3-recipe` already used it).
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
  `learn-quest.js` calls `stage.setWalkSuspended(true)` for it — and ONLY for it, since a
  built bench is a real object on real ground the player is meant to keep walking on —
  (released on dispose), or W would step the player off the bench and an arrow key aimed at
  the power dial would also be a step backwards. The page carries `.learn-quest-overworld`, a flat scrim over the live
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
`btn-secondary` or `btn-primary`, that a stage briefing (where a stage has one at all — in Units 1 and 2
only stage 1 does) does not exceed 2 sentences, that sample notes
describe provenance only without leaking answers, that **any key legend a quest does
supply** is one well-formed sentence (`toolNoteFor(controlId, stageNumber)`; a missing one
is a deliberate answer — see "Nothing is NAMED" at the top of this file), and that all
prompt/hints/briefings/legends/check messages comply with withheld vocabulary rules. It reads both styles:
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
  from it. Like every stage, it never refuses a correct answer for want of a key press; the
  comparison is where the hints point.
- **Stage 4 — the rings.** Three open samples, not two: 2 alone, 2 and 8, and **2, 8 and 3**.
  The third is what makes "each ring fills before the next one starts" a pattern in three
  data points rather than an assertion in a hint.
- **Stage 6 — why the neutron does not matter.** Derivable from the stage before it: Samples
  A and B have the same protons and therefore the **identical outside, 2 and 4**, and stage 5
  established that the outer shell decides behaviour; Sample C has a different outside, 2 and
  5.

**THE NEEDLE IS A METER YOU CLIP ON, AND IT STAYS ON.** It used to print one sentence into
the readout — "The needle swings to plus one and holds" — which the next thing the player
did wiped. So the stages that are ABOUT the needle asked for a comparison against a reading
that was no longer on screen, and driving a sample to a given charge meant carrying a number
through four presses of a stripper. `drawCoreField` now draws a real gauge on the specimen's
own plate: `CoreBench.setNeedle(id, value)` parks it, `refreshNeedles()` in the quest re-reads
every needle that is clipped on whenever a strip or a reset changes what is on a sample, and
four samples on the bench carry four gauges the player reads side by side. The bench still
knows no chemistry — it is handed the figure and shows it.

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
Eight stages on the sorting bench (`engine/assay.js`, also used by Ligar's
`q4-weigh`): a sample tips down a chute over a deflector, one bin per weight, tallies
counted; a balance weighs a sample whole. **A BALANCE WEIGHS; IT DOES NOT DIVIDE.** It used
to report the total, the count, the division and the answer, which handed the player every
stage from six on — press the key, read 20.2 off the readout, find 20.2 on the reference
plate, commit. The one piece of arithmetic this whole bench exists to teach was being done
for them by the instrument. It now reports the two figures it actually measures, a total and
a count, and stops. A real
sample is a mix of isotopes, the proportions are fixed, the listed mass is a weighted average
that leans toward the common isotope, and the average runs both ways — a sealed sample gets
named off its number. Hint rung three shows how to set up the average without revealing the calculated sum. The bench never counts by
weighing at scale: moles are Ligar's.

### World 2 — Ligar (`unit02`, four benches, all live, walkable at T4)

Ligar is the field of basalt arches. Tallow spent five benches on one atom at a
time; Ligar is about what happens when two of them touch. All four quests are
built as games. At T3 and below each is played as a page; at T4 Ligar is walkable
ground and all four benches are BUILT instruments standing on it (see "Ligar —
Learn world 02 as a place you walk"). Everything Tallow earned (atom, element, compound, molecule, proton,
neutron, electron, shell, valence, isotope, ion, cation, anion, metal, nonmetal,
atomic number, mass number) is a plain word from here on.

**And Ligar uses them.** Its four benches once said *piece* for atom (about 210
times), *group* for molecule (about 80, colliding with the periodic-table group
`q3-catalogue` had just taught), *kind* for element and *unit* for molecule. Each
is now the real word, chosen per sample and never by search-and-replace: a charged
piece is an **ion**, the repeating unit of an ionic solid is a **formula unit**
(from `q2-lattice` stage 6, where the card earns it), and an ionic sample on
`q4-weigh` is counted in formula units, which is why its readouts name each
hopper's own particle (`particleWord`, from an optional `particle` on the hopper,
defaulting to atom). A neutral word stays only where the real one would hand over
an answer — `q2-lattice`'s strike readout says a sealed block crumbles into
"small clusters", not molecules, because filing it as molecular is the stage — or
where it is plain English ("one connected piece"). The join bench's probe key is
`Read Atom`.

- **`q1-joins` What Holds** — the join bench, pair plates. Press three pairs and
  see which held (**bond**) → why the third would not, read off the outer shells →
  the needle says one pair handed an electron over and the other holds a pair
  between them → predict which from the two kinds (**ionic**, **covalent**) → a
  giver with two to give needs two takers → count the pairs between (**double**
  and **triple bonds**) → file four pairs off the catalogue alone → how many of
  one kind a giver can hold. It ends on the fact bench three needs: the counts on
  the outer shells leave a compound one recipe and no choice about it.
- **`q2-lattice` Stone and Wire** — the same bench, slab plates. Heat three blocks
  (**melting point**) → strike the salt block and read the face it left
  (**lattice**, **brittle**) → current through a block cold, molten, and through a
  molten block that carries no charge (**conduct**) → what survives a blow on a
  molecular solid → the block the blade will not cut → which of the three holds a
  molecule you could lift out (and the **formula unit** an ionic solid has
  instead) → three SEALED blocks named from the tests alone → pick a liner for a
  900 degree vessel. **The furnace is not a one-way door**: `Let It Cool` exists
  because a stage that asks for a cold reading and a molten one is unfinishable if
  heating cannot be undone.
- **`q3-recipe` The Same Recipe** — the sampler scope, reused unchanged. Three
  samples of one compound from three places (**fixed composition**) → a sample
  with loose atoms no molecule would take → two compounds of the same two
  elements, one to one and one to two → what one molecule weighs → what share of
  that weight is the heavy element (**percent composition**) → a weight ratio
  turned back into a count (**empirical formula**) → name three samples → check
  three claims. The law of definite proportions is the whole spine of this bench
  and is never named, because the name teaches nothing the counting has not
  already shown.
- **`q4-weigh` Counting By Weight** — the assay floor, reused with one additive
  change: a hopper may declare `bulk`, meaning the gate is dogged shut, the chute
  refuses it and the balance is all you get. Count a crate too full to tip → add up
  a recipe (**formula mass**) → three samples of sixty weighed against each other →
  measure out a matching count (**mole**, **Avogadro's number**) → a mole of a
  compound (**molar mass**) → grams to moles → a recipe read in moles → which of
  three drums holds the most atoms, which is the lightest one.

**The mole arrives by being DISCOVERED, and the order is the whole point.** Stage
three puts three samples of exactly sixty atoms on the floor and weighs them: the
totals come out in the ratio of the listed masses, which they have to. Stage four
inverts that one sentence — take the listed masses in grams and you have taken
equal counts — and only then does the card name it. A bench that opened by
asserting 6.02 x 10^23 would be checking, not teaching.

### Tallow — Learn world 01 as a place you walk (`three/tallow.js`, T4)

At T4, `#/learn/unit01` is not a list of quests: it is the ground they are played on.
The player walks a salt-flat refinery in first person, finds a bench, and presses `[E]`.

- **The look is not Erebus.** Erebus is an amber basin at low sun; Tallow is a high salt
  pan under a thin veil of cirrostratus: the sun is up at 35 degrees, softened to a
  white-hot patch with the **22-degree ice halo** a veil throws, the sky milky and bright,
  and a pale quarter-lit world hangs low in the north-east behind the air. The crust
  throws most of the light back up (a `HemisphereLight` whose ground term is the brighter
  one). Palette warm-neutral; the only colour on the flat is the brine in the evaporation
  ponds (milky, green, ochre, rose: four stages of one process) and the rust-red mud where
  wheels have broken the crust. The sub-level is the one place the sun never reached, so
  the colour survives there: riveted and sodium-lit.
- **It is built the way Erebus was rebuilt, in `three/tallow/`**, behind the unchanged
  `TallowWorld` contract (`scene`, `data`, `colliders`, `terrainMesh`, `hasFarTerrain`,
  `getTerrainHeight`, `benchAnchor`, `setBenchDeployed`, `setSiteComplete`, `update`):
  - `atmosphere.js` — **one sky function** (`tlSky`/`tlAir`) draws the dome, is every
    material's fog (aerial perspective toward the sky in the direction seen, still keyed
    to `scene.fog.near/far` for the voyage's cloud deck), and is PMREM'd into the
    environment map. **The far ranges are drawn IN the sky** as ridgelines over azimuth,
    lit by the same sun and buried in the same air: mountains forty kilometres off must
    not slide against each other as a player walks, which geometry inside a 1000 m far
    plane would.
  - `terrain.js` — one analytic height field and **one grid to an 880 m horizon**, with
    the excavation's outline written into the grid as extra lines so the hole is cut
    along the pit's own walls. The pan is dead flat (a few decimetres across the walk);
    the shore rises in some bearings and open salt runs to the sky in others. The ground
    shader draws two scales of the salt-polygon crust, damp patches, **vehicle ruts and
    trodden paths from the polylines in `tallow.json` `tracks`** (per pixel, so they are
    sharp at the boots), **mirror flats** of standing brine beyond 150 m that reflect the
    sky and ranges analytically, and a **mirage** on the far pan at grazing angles.
  - `surfaces.js` — the crust is POLYGONS of raised crystal ridges, not cracks, because
    a salt pan grows; and `applySaltWeather` patches every prop's material so **salt
    crusts its foot** (reading the real ground height under each pixel from a baked
    height texture, so the lab's floor works too), settles on up-facing faces and leaves
    dried tide lines. A material tunes it with `userData.salt`; `userData.noSalt` on a
    mesh or material exempts it (brine, stockpiles, rock). `weatherTheWorld()` applies
    salt and air once, after everything is built; a Learn instrument deployed later is
    deliberately left clean.
  - `plant.js` — the refinery, assembled from real parts through a `Rig` builder (I,
    angle and channel members, filleted pipe sweeps, flange pairs with studs, valves with
    handwheels, gauges on siphons, handrails at 1.07/0.53 m with toe plates, caged
    ladders, ring platforms, skirts with access doors, cladding in tiers) whose
    `finish()` lays every uv in metres. Evaporators stand on concrete plinths with missing
    and hanging cladding sheets (seeded per copy); the columns carry four landings, a
    reboiler and a guyed davit; the pipe racks are H-section portals with a bellows, an
    expansion loop and a torn lagged line; the conveyor's belt is torn and hanging. Its
    kit materials (cladding, safety rail, drawn bar grating, concrete) are cached per
    world in a `WeakMap` keyed on `ctx.M.drum`. Elevated structures collide as their
    feet: `SUPPORT_POINTS` there is the one table of where the columns stand. An
    octagonal plinth is turned by `thetaStart`, never by rotating the mesh, because a
    rotated part is measured by the box round its box and grew into the pit's kerb.
  - `hauler.js` — a tracked ore crawler lofted with Erebus's `loft()`: grousered track
    pads round a stadium loop, sprocket, idler and bogied road wheels, a lofted cab with
    deep viewports under a brow, a hopper bed with a ripped tarp, a knocked-over stack,
    a skirt plate hanging off one bolt, sunk to its axles and listing onto the windward
    flank with a salt drift against it. Its own `hullPlate()` material, never
    `hullMaterial()`, whose cached sets are shared with Erebus.
  - `vista.js` — everything beyond the walk, `phys: 'ambient'`, one vertex-coloured
    `noSalt` material (grime, run-off, soot and salt painted in world space): rock islands
    standing out of the pan; the far refinery to the north (hyperboloid cooling towers,
    banded chimneys, sphere tanks, columns, sheds, a slewed tower crane, a flare stack) in
    two clusters at 360–650 m, whose vents it returns as `plumes`; a stranded bucket-wheel
    excavator ~96 m long at ~270 m east-north-east; a pipeline on 43 instanced trestles
    marching west-north-west to the horizon with one trestle down; and a power line east.
    A vista material must never be shared with a prop: `weatherTheWorld()` patches a
    material once, the first time it meets it.
  - `effects.js`, `kit.js` — the moving air (motes, grit streaming over the crust, salt
    devils, vapour plumes whose puffs swell and thin with age) and the structural stock
    the sheds are framed from (I-sections, corrugated sheet).
  - `verify:tallow` runs every Tallow shader patch against three's real shader source and
    fails if one no longer lands (a renamed chunk would otherwise strip the salt or the
    air silently), and fails if `tracks` overflow the ground shader's segment arrays or
    its `MAX_TRACK_LINES` (8) polyline boxes per kind. The ground tests a pixel against
    each polyline's box before any of its segments, so a pixel away from every track pays
    eleven box tests, not thirty-five segments and their noise; a path is drawn along its
    segments only (it once drew each segment's whole LINE as a grey strip across the pan).
- **Five sites, one per quest, all live, and each sign says what its bench teaches.**
  `site-1` *Bench 1 - Atoms* (`q1-grain`) under the lean-to in the yard; `site-2` *Bench 2 -
  Inside an Atom* (`q2-core`) down the stairwell in the diagnostic lab; `site-3` *Bench 3 -
  The Periodic Table* (`q3-catalogue`, the blockhouse with its door racked back); `site-4`
  *Bench 4 - Isotopes and Ions* (`q4-ledger`, painted floor and ledger board); `site-5`
  *Bench 5 - Atomic Mass* (`q5-assay`, a hopper over a chute with catch bins, south of the
  yard). A player choosing a bench should not have to enter it to find out what it is.
  All five carry their instruments as built objects (`BUILT_BENCHES`). The lean-to is
  framed as a field crew frames one (H-columns on bolted base plates, knee braces, rafters,
  purlins, corrugated sheet, one corner lifted by a gale and one strip gone), and the vault
  is a battered poured-concrete blockhouse with a proud portal and a hood over the door.
  `verify:tallow` still fails if a site's `built` flag disagrees with the chart.
- **The sub-level is a real excavation.** The ground mesh has a rectangular hole cut in it
  along the pit's own outline (its edges are grid lines of the mesh), the pit is built as
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
- **The pad the Avalon lands on is low on purpose.** An octagon of plate with a bevelled
  edge, a worn ring-and-chevron marking and a soot scorch (decals), flush dark perimeter
  lamps, tie-down rings, precast blast walls and the windsock. Nothing inside the octagon
  stands more than a hand above the plate, because the ship's legs reach the ground height
  `solveLanding` reads and a marker post would come up through the landing gear.
- **Only lamps are lit.** Sodium luminaires in the lab, the mast's obstruction lamp, the
  doorway light over the open vault, and one indicator per built site, driven from the
  Learn track's own progress through `setSiteComplete` — the world reads state, it never
  keeps it. A luminaire's light is a `lampMark`, not a PointLight: the lab's four lamps
  are lit as two pooled sources (one per pair, at its midpoint, right over site 2) and
  the lean-to's work lamp is the third, all through a `LampPool` of TWO real lights (see
  "The frame budget of the walkable worlds").
- **Tier boundary.** Walking Tallow is T4. At T3 and below the Learn road is the screens it
  has always been and every quest completes exactly as before. `learn/worlds3d.js` is the
  registry that says which worlds are walkable. Ligar showed what a second one needs
  besides: its builder (`three/<world>.js`), an `enter<World>Scene` on the stage that
  hands it to the shared `enterLearnWorld`, and its site-complete hook.
  `minTier: "T4"` landmarks are decoration: `verify:tallow` simulates removing every one of
  them and asserts every site is still reachable.

### Ligar — Learn world 02 as a place you walk (`three/ligar.js`, T4)

At T4, `#/learn/unit02` is a basalt quarry at dusk the player walks in first person,
built from the three reference paintings (`ligar1`–`ligar3`): columnar basalt
everywhere, three natural arches striding away north, a steel deck under a gantry sign,
and an excavation with conveyors climbing out of it.

- **It is built the way Tallow and Erebus were rebuilt, in `three/ligar/`** (the
  realism pass is recorded in `docs/plans/ligar-realism.md`), behind the unchanged
  `LigarWorld` contract (`scene`, `data`, `colliders`, `terrainMesh`, `hasFarTerrain`,
  `getTerrainHeight`, `benchAnchor`, `setBenchDeployed`, `setSiteComplete`, `update`,
  `dispose`). What made the old world read as a toy was the answer to every question
  being one unit hexagon, a three-colour sky with cardboard ridges and a 240 m plate.
- **The look is neither Erebus nor Tallow** (`atmosphere.js`). Dusk: the sun eleven
  degrees up in the west-south-west, amber, a broad smoulder with **no disc** (a disc
  would be a lamp and would bloom). ONE sky function (`lgSky` / `lgAir`) draws the dome,
  is every material's fog (aerial perspective toward the sky in the direction seen,
  still keyed to `scene.fog.near/far` for the voyage) and is PMREM'd into the
  environment map. The far side of the sky shows what every real dusk does: the
  earth's shadow on the eastern horizon under the pink **belt of Venus**; an
  altocumulus deck lit orange from BELOW; crepuscular rays; a full moon rising
  opposite the sun. The far country is drawn IN the sky: stepped trap escarpments
  ribbed with columns, and in the north-east a shield volcano whose plume leans
  downwind. Black stone throws almost nothing back, so the hemisphere fill is weak.
- **Every rock is columnar basalt from one kit (`basalt.js`), never a unit hexagon.**
  A cooling flow cracks into an IRREGULAR tessellation: `columnCells` cuts a relaxed,
  jittered hex lattice into Voronoi cells (mostly five and six sides, some four, seven
  and eight), and `prism()` extrudes a cell through any `map(a, b, c)` — standing,
  fallen, or radial round a void — with cross-fracture DRUMS, chamfered edges, domed,
  cupped or snapped lids, and a per-column tone in vertex colour; winding is decided
  per triangle against an outward hint. Builders: `columnRaft` (outcrops, portal
  piers), `columnWall` (the quarry faces, ragged by whole columns and spalled at the
  lip), `sawnSlab` (site 1's terrace), `radialRing` (the tube mouth), `lintelBeam`,
  `basaltArch`, `rubbleField` and `fallenColumn`. Everything a landmark is made of is
  MERGED into one mesh with two material groups (column face, weathered lid), and
  records one box per column or piece in `userData.partBoxes`, which `verify:ligar`,
  `verify:bench` and the overlap checker all read. `buildRubbleField` returns one.
- **The arches FAN.** A flow cooling round a void grows its columns perpendicular to
  the cooling surface, so every column of `basaltArch` lies along the arch's radial
  direction — horizontal in the legs, vertical over the crown: the soffit is a
  honeycomb of column ends, the flank a fan of column lengths. Thick-footed and
  thin-crowned, lumpy, the legs flaring into buttresses; founded deep enough for the
  lower foot and never built below the ground. A leg collides as three circles along
  its breadth (`supportPoints`, from `archInfo`).
- **The ground runs to the horizon** (`terrain.js`): one analytic height field and
  one grid to 880 m. Inside 100 m it is exactly the old plateau (every site where it
  stood); beyond it the country climbs in TRAP BENCHES — talus apron, cliff, flat top —
  in embayments, then falls away behind the upper rim so the sky's far country shows
  over it; to the north-east (`WINDOW_AZ`) the benches are gone, the window the volcano
  and the moon are seen through. The ground shader draws the column tops per pixel
  (non-repeating Voronoi, each stone its own tone and tilt, bevelled rims, dust packed
  LIGHTER into the joints), rain standing in hollows, joints and rut bottoms as a
  mirror of the sky, ash drifts, lichen, the scoria yard, the haul road from `tracks`
  in `ligar.json`, and column-ribbed cliffs on every steep face. The quarry floor is
  drawn with the SAME material (`buildFloorGeometry`), so its puddles are the same water.
- **The cut's hole is wider than its floor.** The terrain's hole reaches `CUT_MARGIN`
  (0.8 m) past the pit into the rock, because the faces are whole columns standing
  proud of the wall line: under a pavement edge with nothing beneath it, a player in
  the pit looked up through the ground. The rim colliders are unchanged, so the band
  is never walked.
- **Weather is applied once to everything built** (`surfaces.js`,
  `weatherTheWorld()`): ash on what faces up, a dark damp foot read off a half-float
  ground-height texture, lichen on stone only, rust weeping down steep faces; then the
  air. `userData.noWeather` exempts a mesh (the ground, the scrub, a site indicator).
- **Ground cover** (`initGroundCover`): loose cobbles (merged, boxed) and instanced
  scrub tufts rooted where the field's ash and wet masks say water and dust gather,
  swaying in the wind; both keep off the yard, the haul road, the pit, the pad and
  every footprint. Scrub is `phys: 'ambient'` — it is walked through.
- **The moving air** (`effects.js`): ash falling slowly round the eye (the volcano is
  still putting it up), grit streams in gusts (never over the pit), ash devils on the
  far plain, smoke from every stack `buildStack` reports a `ventY` for and from the
  vista's stacks, and embers and flue smoke off the forge.
- **Beyond the walk** (`vista.js`, `industry.js`, all `phys: 'ambient'`): the "organ
  pipes" — spires of column thirty and forty metres tall standing off the plain — a
  natural arch eighty metres across on the western benches, built by the same kit so
  its scale is legible, and the works: the smelter this quarry feeds, a power line and
  a derelict walking dragline.
- **The frame budget**: the luminaires are `lampMarks` in a `LampPool` of three real
  lights (the forge keeps its own shadowing light); `bakeStatics()` merges every
  unbaked site group; the sun's shadow box follows the player in whole texels and is
  re-drawn only when it moves, while a bench is deployed (`benchesOpen`), or one frame
  in three (`paceShadow`).
- **Four sites, all built, each sign `Bench N - <quest title>`.** `site-1` *Bench 1 -
  What Holds* (`q1-joins`) on a cut terrace under a stone portal west of the yard;
  `site-2` *Bench 2 - Stone and Wire* (`q2-lattice`) at the **Tube Forge** — down the
  ramp, across the quarry floor and in under a barrel-vaulted lava tube with a hearth
  whose fire is the one red light and the one self-moving thing in the world, because
  that bench heats blocks; `site-3` *Bench 3 - The Same Recipe* (`q3-recipe`) in the
  silo-fed **Batch House**; `site-4` *Bench 4 - Counting By Weight* (`q4-weigh`) at the
  **Weighbridge** with its scale house. Sites 3 and 4 share the east deck and the gantry
  that carries both their signs, which is how the reference art placed them.
- **The tube is inside the cut, not behind it.** A chamber beyond the far wall would be
  outside the excavation rectangle, where `getTerrainHeight` answers with the flat five
  metres overhead. So the vault is roofed over the far portion of the floor.
- **The walking surface knows about everything stood on.** The walk clamps the camera
  to `getTerrainHeight` with no step limit, so the terrace, the deck (with its entry
  ramp) and the landing pad register themselves in `this.raised` as they are built, and
  anything laid inside a prop — scree, heaps, column feet, trestle legs — is placed on
  the ground under IT (`localGround`, and `localWalk` for the conveyors, which stand
  half in the cut) rather than at the prop's centre height. Each of those was a real
  bug `verify:ligar` found: a player sinking into the deck, scree buried a metre and a
  half under an arch's higher foot, a trestle standing in mid-air over the cut.
- **A conveyor is twenty-two metres long, not a circle.** Its declared radius covers its
  middle; the layout generator keeps its whole run clear, the floor rubble avoids its
  run, and it runs tail-DOWN in the cut and head-UP over the spoil (`rotY -PI/2`). The
  tail starts eleven metres inside the wall, because at 27 degrees that is how far out a
  belt must start to clear a five-metre lip — it once ran into the rock.
- **Merged and instanced bodies are measured per part.** A rock mesh records one box
  per column in `userData.partBoxes` (the `mergeStatic` channel), and so does every
  instanced field, so the overlap checker sees each column where it is. The
  quarry-floor rubble is its own body, not part of the exempt cut, because filed under
  the cut it once lay through the forge unseen.
- **What Ligar costs per frame, and the four rules that hold it down.** Measured in a
  real renderer (draw calls and triangles per walking frame, shadow passes included),
  these took the spawn view from 1044 calls / 1.44M triangles to about 590 / 850k, with
  no change to the picture:
  - **The forge's shadow is drawn once.** A point light's shadow is six renders of the
    scene and three.js re-draws all six every frame by default — it was ~270 calls and
    ~480k triangles of every frame, anywhere in the world. `shadow.autoUpdate` is off;
    `setBenchDeployed` and an open bench within reach (one frame in three) ask for it.
  - **The sun's box follows in 2 m steps** (`followLigarShadow(sun, pos, step)`, still a
    whole number of texels so nothing swims) and `paceShadow` runs at `every: 30`,
    because nothing in Ligar that casts moves on its own. At one-texel steps the whole
    caster set was re-drawn on every frame of a walk.
  - **Walkable ground groups are baked too** (`bakeStatics`: `phys: 'ground'` is exempt
    from the overlap check by kind, so baking costs no precision; the deck alone was 72
    draw calls) — except a mesh whose shader reads an attribute `mergeStatic` would
    strip: the cut's floor carries the ground's `aMask`, and merged it lost its grit.
  - **A weathered material is one program.** `applyLigarWeather`'s amounts are uniforms,
    so its cache key does not carry them.
- **The plant lives in `ligar/plant.js`**: each builder takes the world (its materials,
  `own`, `t4`, `buildRubbleField`, `lamps`, `lampMarks`) and returns a group in the
  landmark's frame. A prop never creates a `PointLight`; it pushes a `lampMark`. Props
  are assembled from real parts through a Tallow-style `Rig` (H, channel and angle
  sections, handrails with toe plates, caged ladders, valves, stencil placards, UVs in
  metres) over a per-world material kit cached on the world. Long members on a slope
  are built bay by bay, because the overlap check measures each part by its box.

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
- **Normal maps are OpenGL-style, because that is how three.js reads them**: red is
  +u, green is +v, and a CanvasTexture's flipY puts canvas row 0 at v = 1, so green
  points canvas UP. `heightToNormal` (and its copy in `tallow-textures.js`) once wrote
  green the other way and every rivet, pebble and stone read as a dimple; the Erebus
  rebuild then papered over it with negative `normalScale.y` and a flipped channel in
  its triplanar rock shader. The generator is fixed and the workarounds are gone —
  never compensate per material; `verify:normals` fails the build if one comes back.
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
  check stays as precise as it was on the unbaked prop — boxed straight into the
  group's frame (going through world space boxed a part twice on a turned group).

### The frame budget of the walkable worlds (Tallow, Erebus, Ligar)

Both worlds were built for the look first; these rules are what keep them cheap
without changing it. Measured in Node (`TallowWorld` / `WorldScene` behind the
DOM shim): Tallow went from 914 meshes (325 shadow casters, 5 point lights) to
389 (237, 2); Erebus from 254 (215, 21) to 178 (139, 3). Triangles barely moved
(0.79M / 0.51M to 0.76M / 0.50M): they were never the cost.

- **A PointLight is shaded on every lit pixel, lit or not.** A forward renderer
  runs the full specular term per light per fragment even at intensity zero, so
  twenty dormant pylon lamps were the most expensive thing in the sand's shader.
  `three/lamp-pool.js` owns a FIXED number of real lights (a changing count
  recompiles every material in view) and hands them to the lit sources nearest
  the eye, each weighted by how much nearer it is than the first one that missed
  out, so two sources trade places only at equal distance and nothing pops.
  Erebus: 3 lights for 20 pylons (13.8 m apart: the one underfoot and both
  neighbours) and the lander's bay. Tallow: 2. A new lamp in either world is a
  pool source, never a `new PointLight`.
- **What never moves is baked.** `TallowWorld.bakeStatics()` runs `mergeStatic`
  over every top-level group not already baked (the sites, the lab, the crate
  stacks) and bakes each cased-up instrument on its own INSIDE its `noMerge`
  group, so casing it up still hides one thing. A mesh carrying `phys`,
  `noSalt` or `openShell` is left out, because the tag lives on the mesh. The
  Erebus pylons are baked as ONE `pylon-ring` (each pylon group keeps only its
  lamp, number and hazard paint); their luminaires share one material set.
- **The sun does not move, so its shadow map is re-drawn only when something
  does** (`three/shadow-pace.js`). `followShadow` / `followTallowShadow` return
  whether the texel-snapped box moved; `paceShadow` re-draws on a move, while a
  Tallow bench is deployed (its jaws and pieces cast), and otherwise one frame in
  three (Tallow) or two (Erebus, whose chamber console rides on the camera).
  `holdShadowUntilAsked` puts `autoUpdate` back after every render of the scene,
  so a render the world's `update()` did not precede (the voyage's outside pass)
  always gets a fresh map.
- **Discard before the noise.** The grit/sand stream sheets are 180 m across and
  show only 1.5–75 m from the eye and inside a gust; their shaders test distance,
  then the one gust fbm, and discard before the other eight octaves. Tallow's
  sheet is a 3 m grid on every tier (the pan is flat to centimetres over that).
- **The air is not evaluated where there is none.** The aerial-perspective patch
  skips the sky function when the fog amount is under 0.002 (the first ~12 m,
  most of the ground at the feet), and the sky's cirrus / veil noise is skipped
  within a third of a degree of the horizon, where its coverage is zero (Erebus)
  or under a thousandth (Tallow) — which is where the mirror flats and the mirage
  look.
- **Rejected as too visible:** a coarser terrain grid (the rectilinear tails give
  the cardinal horizons their fine ridgelines), fewer sky-noise octaves, a smaller
  shadow map or PCF instead of PCFSoft, and merging the vista (half of it is
  behind the player and culled). A lower pixel-ratio cap for the worlds is the
  one lever left untouched, and it lives in `stage.applyTierSettings`.

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
  openings is a maze. `ship/doors.js` hangs a stencilled header plate on each face of
  every portal, naming the compartment you walk INTO on that side. **The names are not
  written down at the frame:** `roomAt()` is asked what is actually half a metre through
  the opening in each direction, so a bulkhead that moves takes its legend with it.
  `placard()` shrinks its face to fit rather than clipping.
- **Doorways are architecture.** Each opening in `WALLS` gets a portal and a pair of
  sliding leaves exactly where the wall declares it; `hatchPos` in the graph must sit
  within 0.75 m of one. The traversal graph and its view cones are a separate thing
  from where the plate is welded.
- **The lining is part of the structure.** `dressRoomShell` adds every room's wall,
  ceiling and deck lining to `ship.hull`, so it is one object with the plating and is
  exempt from overlap with it. It is held to a budget instead (`DRESS` in `kit.js`):
  nothing on a wall stands more than 0.1 m off its face and the upper chamfer starts
  at 2.45 m, so a room can stand furniture 0.05 m off a wall and know it is clear. A
  room that needs a wall span bare (a rack to the deckhead, the airlock's outer hatch)
  asks for it with `keepClear`. Equipment bolted to the structure may be added to the
  hull too — the bridge's dash and shoulder stations are, because the raked plating's
  world-aligned boxes cover the whole nose.

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
  The bottom-left stage card is docked by default into the dock bar from stage 1 onwards
  (leaving `#stage-dock-grade-btn` Submit and `#stage-card-open-btn` Stage Panel) so the 3D viewer is
  unobstructed for drawing arrows, and only reopens when the player clicks the button or solves the stage
  and the explanation banner appears. When a briefing modal auto-shows, closing/starting it maintains the docked state.
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
- `docs/plans/learn-track.md` — the Learn road: ten worlds, 41 quests charted, nine built
  (`unit01/q1-grain` … `unit01/q5-assay`, the whole of Tallow, and `unit02/q1-joins` …
  `unit02/q4-weigh`, the whole of Ligar). Scaffolding, gating, routes, backend tab,
  per-world practice sets and the verifier are in place. World 01 (Tallow) is also built as
  walkable ground at T4, all five of its benches built instruments standing on it. **Ligar is walkable at T4 too** — all four of its
  benches are built instruments on its ground, and a page on every lower tier. The other
  eight worlds are charts only. The Tallow→Ligar pass
  (`tallow-ligar-build.md`) carries the bench order and what is deliberately left out of
  each unit.
- `docs/plans/engagement-pass.md` — progression and engagement (plan only, nothing built):
  a table-driven level curve paced to the XP that exists, a presentation queue that holds
  level-ups until a safe moment, requisitions (derived unlocks, cosmetic or convenience
  only), commendations (stencilled plates from either road, never XP), per-stage Clean
  marks, the Field Manual (earned vocabulary as a collection), a weekly watch streak,
  officer-issued meeting codes, guild contracts, and Standings scopes (Your Guild, This
  Week, a pinned row and a neighbourhood). Six open decisions are listed in its §12,
  including whether the Learn XP wall stays (recommended: yes).
- `docs/plans/ship-redesign.md` — the Avalon rebuilt from a shared kit (done): faceted nose
  and raked canopy, one lining section in every compartment, sliding pressure doors that
  open as you approach, every room refurnished. Contracts kept and listed there.
- `docs/plans/immersion-pass.md` — the campaign frame (the quartermaster Vess, pylons on Erebus),
  Session Zero onboarding, soundscape, and the video pipeline (all 19 loops & cinematics baked & integrated, plus Ligar backdrop).
- `docs/video-prompts-t3.md` — T3 and below complete media generation guide (videos & images), parameters, and prompts.

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
1. **Surfaces are obsidian and titanium.** The neutral scale (`--plate-000`…`--plate-600`)
   is near-neutral dark with the faintest cool cast (`--plate-200` `#161519`) — deliberate, and
   confirmed. Warmth comes from the text ramp and the filament amber, not from the plates.
   What stays banned is the saturated navy of a generic dark-mode website.
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
- Machined plate uses **precision double-bezel architecture** with subtle corner radii (2–4px). `.plate`, `.glass-panel`,
  `.holo-card` and `.stage-prompt-card` share one treatment: clean durasteel outer borders (`1px solid var(--border-durasteel)`),
  crisp inner highlight hairlines (`inset 0 1px 0 rgba(255, 255, 255, 0.08)`), and deep ambient drop shadows. Crude polygon `clip-path` cuts are eliminated for clean rendering.
- Surfaces are crisp obsidian and titanium plates. Dirty SVG turbulence grain overlays and dark vignette overlays are eliminated in favor of clean optical clarity and high contrast.
- Seams are physical and precise: `--seam-light` on the lamp-facing top edge, `--seam-dark` below.
- Type is **crisp and sharp** (`--engrave: none`), without blurry dark drop shadows.

### 4. Colour
- Surfaces: Deep obsidian and titanium neutrals (`--plate-000` through `--plate-600`). Seams: `--border-durasteel`, `--seam-light/dark`.
- Text: High contrast typography (`--text-primary: #dcd6cc`, `--text-secondary: #a49c90`, `--text-bright: #fbf9f5`).
- Signals: `--accent-amber` `#e59b24`, `--accent-gold`, `--accent-rust`, `--accent-green`
  `#78a142` (with `--accent-green-deep` `#3f4a2a` as the recess border a lit lamp sits in),
  `--accent-danger` `#b8382c`, `--accent-bronze`. Filaments: `--lamp-*`. `--text-muted`
  `#8c8376` is held to 4.5:1 on `--plate-200`; never darken it below that.
- Guild liveries: `--team-earth/air/fire/water`. **The HUD badge derives its livery from
  `TEAM_LIVERY` in `main.js`, never from the sheet's `accent_hex`** — a stale hex in the
  Teams tab used to leak a bright web colour into the header.
- **Charge red `#ff1744` and blue `#00b0ff` are reserved for the chemistry** and appear in
  the 3D chamber only. In UI chrome they appear as printed ink on a hairline rule
  (`--charge-red-ink`, `--charge-blue-ink`) — the polarity key, `.scan-readout` left
  border, `.concept-pill` left border — never as a glowing block or a rainbow ramp.

### 5. Typography
- **Quantico across all roles**: Unified architectural geometric sans-serif for high-precision aerospace instrumentation.
  - Page titles: `Quantico` (`--font-imperial`) via `.page-title` — bold, controlled tracking (`0.1em`–`0.12em`).
  - Section and card headings: `Quantico` (`--font-display`) via `.section-title`, `.holo-title`.
  - Telemetry, labels, kickers, helper text: `Quantico` with JetBrains Mono fallback (`--font-mono`) via
    `.eyebrow` (`.lit` when live), `.stat-value`, `.tag`, `.form-label`, `.form-help`.
  - Body & teaching copy: `Quantico` (`--font-main`) with clean line height (1.55).

### 6. Components
- **Panels**: `.glass-panel` / `.plate`. Banner art goes in `.panel-banner` — clear, high-definition optical viewport with clean border and subtle ambient shadow (no artificial scanline overlays or muddy sepia filters).
- **Switchgear**: `.btn-primary` is a precision machined amber switch (metallic gradient, inner highlight hairline, subtle border radius, tactile spring physics via `--ease-spring`, no chunky 90s bottom lip). `.btn-secondary` is machined durasteel.
  `.quest-btn-sm` is compact quest switchgear. Labels are 1–2 words; **no arrow glyphs.**
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
  regex, because a renderer string is not a frame rate. `isT4Eligible` is now just
  `isT4Capable` (nothing demotes any more); Settings and the HUD chip ask it too.
  Two things are cheaper on a handset and are the only fidelity differences: DPR is
  capped at 1.5 rather than 2 (a phone commonly reports 3), and `shadowMap` stays off,
  because soft shadow maps are the one T4 feature a mobile GPU cannot hold 60fps
  through.
- **On a planet, resolution is paced and nothing else is.** `stage.paceResolution` steps
  the pixel ratio down a quarter when a second of frames averages under 45fps (never
  below 1 on a high-density screen, 0.8 on a 1x one), and back up after a few seconds
  with headroom, not returning to a ratio found too slow until 20 s pass without a slow
  second. The first 3 s on a planet are not judged. Aboard ship it is always the tier's
  full ratio. A machine that holds 60fps never sees it.
- **A world's shaders are compiled when it is built** (`stage.warmWorld`, via
  `compileAsync`), not a material at a time as each piece first comes into view — that
  was a stall of tens to hundreds of milliseconds on the frame it happened, mid-walk.
  Every world is built through `stage.worldFor`, so none can skip it.
- **A measured tier is never written down; only a chosen one is.** This is the rule that
  keeps a phone out of the stills. `session.gfxTierPref` holds a tier the *player* picked
  — `tierManager.chooseTier`, from the Settings radios or the HUD chip, is the only path
  that writes it — and `null` means "probe the device". `setTier` is the automatic path
  and persists nothing, so a bad afternoon is never inherited by the next visit.
  `session.gfxTier` is just what is running now. They used to be one value, and every
  automatic demotion was stored as though the player had asked for it.
- **THE TIER IS DECIDED ONCE, WHEN THE PAGE OPENS, AND KEPT.** There is no runtime
  frame monitor: `recordFrame` is a documented no-op the render loop still calls. A
  demotion rebuilt render settings under whatever the player was doing — mid-voyage,
  mid-bench — and the slow stretches that triggered it (a world building, shaders
  compiling, a heavy world through the canopy) are not evidence about the device. It
  also once walked a capable iPhone from T4 to the stills. After boot the only thing
  that changes the tier is the player choosing one (`chooseTier`).
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
  once: no gesture is needed for a layout change.
- **Flaunted Install & Home Screen Popup (`src/pwa-install.js`)**:
  - If not accessing as an installed app (`!gameMode.isStandalone()`), opening the app triggers an auto-popup modal detailing step-by-step installation instructions (iOS Safari: Share icon -> Add to Home Screen; Android: 1-tap install prompt / menu).
  - The HUD flaunts installation via `#hud-install-btn` (amber border, live pulsing filament dot, download icon, bold label) instead of a tiny or hidden button. Hidden in standalone mode.
- **Mobile Landscape Enforcement**:
  - `public/manifest.webmanifest` sets `"orientation": "landscape"` for native PWA landscape startup.
  - `gameMode.lockLandscape()` locks orientation via Screen Orientation API on boot, user gestures, and enter.
  - Mobile touch screens maintain landscape throughout navigation (`syncWorldOrientation` does not revert on return from worlds).
  - In browsers refusing orientation lock (e.g. iOS Safari) while in portrait on mobile screens, `#orientation-guard` activates with an animated rotating device graphic and "LOCK LANDSCAPE" / "Continue in portrait" options, auto-hiding immediately when rotated sideways to landscape.
- Canvas sizing follows `visualViewport` on touch, not `window.innerHeight`: a phone
  collapsing its address bar fires only the `visualViewport` resize, and sizing to the
  window renders a buffer taller than the glass with the horizon off the bottom edge.
  The holo-close raycast reads NDC off the canvas rect for the same reason.
- Authentication gating & 3D view: On unauthenticated routes (`/login`, `/register`, `/`, `/onboarding`), the 3D ship interior and vista are visible behind the account cards, but first-person WASD navigation and mouse look are locked (`fpsControls.enabled = false`) until the player signs in.
- Starship traversal spine: `src/three/ship-graph.js` defines an undirected navigation graph across all compartments (`bridge`, `cockpit`, `starmap`, `quarters`, `cargo`, `comms`, `airlock`) with 3–6 point `walkPath` splines, `hatchPos` view-cone markers, and `routeBinding`.
  - **THE NAV BAR TELEPORTS, SO ITS ANCHORS ARE A COLLIDER QUESTION AND THERE IS
    ONLY ONE COPY OF THEM.** `CameraRig.moveTo` sets the camera outright — pressing
    INVENTORY puts the player in the cargo hold with no walk in between — and then the
    walk takes over from wherever it was dropped. `SHIP_ANCHORS` in `camera-rig.js` is
    therefore **derived from `SHIP_GRAPH.nodes`**, which already carries a standing
    position and look target per station that `verify:ship` flood-fills. It used to be a
    hand-written table beside the graph, written when the ship was one open room: once the
    Avalon grew walls and furniture, FOUR of its seven anchors stood inside a collider and
    the comms one was not even in the comms compartment. `verify:ship` measures the anchors
    themselves as well as the nodes, because a derivation is only as good as its source.
  - **A PINCH IS A DEAD END, AND THE PUSH-OUT'S PROMISE IS NOW TRUE.**
    `FpsControls.resolveBoxCollisions` escapes each box along its own shortest edge, which
    is right for one box and exactly wrong for two: where two colliders overlap the body
    from opposite sides the second push undoes the first, and since the slide test asks
    whether the DESTINATION is clear, every step out of the solid is refused. The player
    oscillates between two positions for ever and cannot move — which is what the cargo
    anchor did, standing in the 0.25 m gap between the drum racks at `x 4.3` and the
    freight ending at `x 4.05`, in a 0.5 m body. So after the per-box pass, a body STILL in
    the solid steps out to the nearest clear deck (`nearestFreeSpot`), which is the
    invariant that code's comment always claimed. Nothing runs there unless the player is
    genuinely stuck, so a teleport nobody has thought of yet — a cinematic, a world spawn —
    cannot strand them either.
- **The Avalon** (`three/ship.js` over `three/ship/`, plan in `docs/plans/ship-redesign.md`).
  A used freighter, BUILT out of a few standard parts repeated with discipline, not
  modelled room by room out of boxes.
  - **Deck plan** (`ship-rooms.js`, pure data): the bow is a faceted nose —
    `BRIDGE_OUTLINE` runs straight sides to z 3.2, raked shoulders (two slot viewports
    each, `SHOULDER_PORTS`) and five canopy facets closing at z 6.8; everything in the
    bridge's box outside the outline is stepped colliders. Aft of it the spine, berths A
    and B and comms to port, the cargo hold, the ladderwell (`FLOOR_HATCH`, a shaft
    to the lower deck) and the airlock to starboard, the engine room (id `furnace`)
    across the stern. `HULL_WINDOWS` are portholes cut through the port plating.
    Deckheads 3.0 / bridge 3.4 / engine room 4.0.
  - **The canopy** (`hull.js` `canopyGeometry`) rakes 0.9 m aft from a 0.92 m sill to a
    2.85 m head, mitred at every joint, with cheeks closing the ends against the
    shoulders and a lowered nose deckhead forward of z 4.3.
  - **One section everywhere** (`kit.js` `dressRoomShell`): angled kick plate, three
    courses of pressed panel between structural ribs (bays filled with vents, conduit
    runs, equipment boxes and light slots), a cornice and angled upper chamfer, a
    coffered deckhead with beams and light troughs, a tiled deck (grating over a lit
    channel down the spine). Portholes get pressure-port trim. Textures are laid at
    world scale: a material with `userData.worldUV` is re-mapped by `applyWorldUVs`
    before the bake, so a bracket and a bulkhead carry rivets the same size.
  - **Doors** (`doors.js`): a chamfered gunmetal portal proud of both faces with jamb
    lights, a control box and name plates, and two leaves that part and slide into the
    bulkhead (at different depths, so neighbouring doors can share pocket). **They open
    for you** — within 3.0 m, shut again past 3.6 m, parting in about a fifth of a second — and the collider lifts the moment
    one starts to open and returns only once nobody is near enough to be caught.
    `ShipInterior.update(delta, time, viewer)` returns true when the set changes and
    `stage.js` hands the walk the new colliders. Doors are no longer `[E]` targets.
    **A portal is an ARCH, one outline, never a rectangle with a hole in it**
    (`archShape` in `kit.js`). The opening runs down to the deck, and a hole whose foot
    touches the outer edge is not a hole to the triangulator: every portal came out a
    solid plate filling its doorway, the leaves slid open unseen behind it, and the
    player walked through what looked like a shut door. `verify:ship` casts a line
    through every doorway at knee, chest and head height: clear when open, a leaf when shut.
  - **Rooms** (`ship/rooms/*.js`): bridge (tactical bank to port, nav racks to
    starboard, engineering and comms stations under the shoulder ports, the club
    board's deck emitter), cockpit (a dash following all five facets, pilot seats on
    rails with yokes, throttle pedestal, overhead panels), star map (octagonal
    projector table), berths (bunk alcove, fold-down desk under the porthole, lockers,
    washbasin; A lived in, B cadet issue), comms (rack, operator console, standings
    screen in a hutch, transmitter, valve gallery), ladderwell (railed hatch, shaft,
    rung ladder), cargo hold (freight box, strapped crate, chain hoist, drum rack,
    loader), airlock (octagonal outer hatch with rams and handwheel, cycle panel, two
    pressure suits), engine room (reactor with a flickering firebox, motivator,
    consoles). Each room bakes its furniture with `ship.bake(group)`; about 375 meshes
    and 190k triangles for the whole ship.
  - Every holo, screen, terminal id, route and prompt the rest of the app uses is
    unchanged: `clubHolo*`, `starmapHolo*`, `commsHolo*`, `commsScreenMat`,
    `cargoScreenMat`, and the seven stations.
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
- **Erebus** (`three/world.js` over `three/erebus/`, data in `world-data/erebus.json`,
  written by `tools/generate-erebus-world.mjs`). A dry lakebed on a desert moon at low sun
  under a ringed gas giant: the twenty pylons on the rim of the basin, a dune sea climbing
  away outside it, buttes on the horizon and the wreck of something enormous in the haze
  to the west. `world.js` keeps the whole public contract (`scene`, `data`, `colliders`,
  `pylonMeshes`, `terrainMesh`, `getTerrainHeight`, `setClearedStages`, `update`,
  `getAimTargets`); what the world is made of lives beside it:
  - **One height function, one ground to the horizon** (`erebus/terrain.js`).
    `makeHeightField` is analytic — bowl, rim, a flat cracked playa in the middle,
    asymmetric transverse dunes on draa, stepped bedrock far out, sand aprons round every
    landmark and a lee drift behind every pylon — so the walk, `solveLanding` and the
    Node checks stand on exactly the ground that is drawn. The mesh is ONE grid, 1.25 m
    across the walked square and growing geometrically to an 880 m disc; there is no
    backdrop seam because there is no second mesh. Every surface that shows wind follows
    `WIND`, which matches the ripples combed into the sand texture. A coarse copy of the
    walk on layer 1 is the only thing the sun's shadow camera draws of the ground.
  - **One sky function** (`erebus/atmosphere.js`). `erebusSky` / `erebusAir` draw the
    dome (always centred on whatever camera draws it) and are ALSO the fog: every material
    has `fog_fragment` replaced by aerial perspective toward the sky in the direction it is
    seen, thinner with altitude, still keyed to `scene.fog.near/far` so the voyage can
    close it into a cloud deck. The gas giant and its moon are the `celestial.js` shaders
    with the sky ADDED and the air column dimming them (a daytime moon's night side is sky,
    not black); the rings blend additively. The sun is 17 degrees up, dust-reddened, with a
    soft disc; its shadow box follows the player in whole texels and is re-drawn only
    when it moves or every other frame (`shadow-pace.js`). `createSkyEnvironment`
    PMREMs the sky so metal reflects the air it stands in.
  - **One geology** (`erebus/rocks.js`). `STRATA` is one stack of beds indexed by
    ALTITUDE: it decides both how far a face stands proud (hard beds ledge, soft recess)
    and the colour painted there, for every rock, the far buttes and the bedrock in the
    terrain alike — so the same bands appear at the same heights across the whole map.
    Shapes: fracture-cut `boulderGeometry`, lathed `columnGeometry` (lobed plan, V-gullies,
    caprock, talus, sandblasted notch) and `archGeometry`. The rock shader is triplanar in
    world space with varnish streaks and sand on up-facing surfaces; the far buttes use
    the `lite` variant.
  - **Landmarks** (`erebus/landmarks.js`) are one group each (scree included, instanced,
    with per-instance `partBoxes`), carry a footprint `radius` the landing solver avoids,
    and push their own colliders: sandstone spire, hoodoos with balanced caprocks, butte,
    outcrop, a boulder spill, a walk-under arch, a giant skeleton and a broken-backed
    freighter. `vista.js` is `phys: 'ambient'`: buttes 240–760 m out and a 300 m capital
    wreck nose-down in the dunes. `lander.js` is SANDSTALKER as a lofted craft whose legs
    each reach the ground under them. `effects.js` is the moving air: dust motes wrapped
    round the eye, sand streaming over the ground in gusts, and dust devils on the flats.
  - **Plate is desert plate** (`erebus/surfaces.js`): `hullPlate` is paint bleached by sun
    and chipped by sand down to primer and metal, not rust run down by rain — one shared
    set per wear grade, tinted per object. `addDustCover` lays sand on whatever faces up.
    pbr-kit's normal maps carry green inverted against three's tangent frame (a bump reads
    as a dimple), so every Erebus material flips normal-map y.
  - `tools/generate-erebus-world.mjs` rule 12 keeps every landmark's footprint (plus its
    scree) off the pylon ring.
- T4 In-World Terminals: In T4, compartment interactions open `.in-world-terminal` tactical HUD overlays with `CLOSE` dismiss controls. Star Map holo-table integrates Sector 01 status and disembarking; Quarters integrates crew profile and avatar customizer; Cargo Hold integrates cargo manifest and trinket locker; Comms integrates standings; Settings integrates graphics tier (T4 default) and audio sliders. Bridge displays the floating directory kiosk instead of WASD/mouse look text prompts.
- **The voyage — at T4 a world is FLOWN to, never stepped into** (`three/voyage.js`).
  A signed-in player aboard who asks for a world — the star map, the Learn road, the
  bridge's quest key, the airlock terminal — is not teleported and gets no film: the router
  (`tryVoyage`) hands the route to `stage.requestVoyage`, draws the helm plate, and holds
  the route until the player walks off the ship (`voyage:arrived`), then draws it with the
  player standing where the ramp left them (`stage._arrivalHold`, honoured by
  `enterWorldScene` / `enterLearnWorld`). One unbroken shot: the player is walked to the
  pilot's place and turned to the canopy, the drive spools, the stars stretch into
  streaks down a lit tunnel with the field of view kicking wide, the ship drops out in
  front of the planet (the same celestial shaders as the vista, in the world's palette,
  nothing on its surface modelled), flies to it, falls into its air (no plasma shell, no streaks: inside an atmosphere
  those read as a second jump away from the planet just reached), comes
  down through cloud onto the REAL built world, flies to its landing pad and sets down.
  **Once it reaches the planet it comes DOWN, not across**: the approach brakes to a
  stop at `HOLD_ALT` over the landing site, nose tipped down at the world
  (`HOLD_PITCH`, since from that high the horizon is below a level canopy); the entry
  falls straight down the local vertical until the cloud closes; and under the cloud
  the descent drops onto the pad from ~190 m overhead, turning onto its heading, with
  only a short slide into line. The old path skimmed the limb, drove forward through
  the air and then glided forward over the world, which read as flying over the planet
  twice with a jump between. The cloud veil scrolls by an accumulated `cloudScroll`
  (negative flow = streaming UP the glass, i.e. falling), never `time x rate`, so a
  change of rate cannot jump the deck.
  - **Two passes, one camera.** The player never leaves the ship's scene. Each frame draws
    the OUTSIDE (the space scene, or the destination world's own scene) through a second
    camera posed at (ship pose) x (player camera), then clears depth and draws the
    interior over it. The interior is opaque except its glass, so the outside is what the
    canopy, shoulder ports and portholes show; moving the ship is moving one matrix, and
    nothing aboard — colliders, doors, terminals, aim — is ever transformed.
  - **The only moment the outside changes from "a planet" to "this place" is inside a
    full cloud deck** in the world's own fog colour, which then breaks up as the ship
    descends. `buildFarGround` rings the built square with the terrain's own material so
    it reads as part of a planet from altitude (a world whose own ground already runs to
    the horizon sets `hasFarTerrain` and gets no ring — Erebus does); the world's fog is
    closed in and eased back out. A jump flash covers the moment the ship's own starfield and vista are
    released. No other cut exists. **The home sky (the ship's starfield and the canopy's
    gas giant) belongs to space, never to a world**: `_finishDisembark` hands it back to
    the interior, so `board()` and `_startDeparture` take it out again
    (`_adoptHomeSky` then `_releaseHomeSky`). Left in, the interior pass drew the gas
    giant over the world outside and it rode the whole voyage out, jump and all.
  - **Down, the player walks the ship.** A chevron (`GuideArrow`) leads to the airlock;
    [E] at its hatch reads `OPEN THE HATCH // DISEMBARK ONTO <WORLD>`, the hinged outer leaf
    (`ship.airlockLeaf`, `setAirlockOpen`, `AIRLOCK_HATCH` cut through the plating) swings
    in and the player is walked out and down the ramp. Once through the hull the interior
    stops being drawn and the exterior model (`buildShipExterior`) appears behind them.
    **Stepping off must not change a world's light count**, because a changed count
    recompiles every material in that world (a freeze of seconds at the foot of the
    ramp). So the hatch lamp is a descriptor (`hatchLamp`) the voyage adds to the
    world's `LampPool` when it parks, never a PointLight on the model; the camera's chest
    lamp (`stage.cameraLight`) is visible only while the camera is in the ship scene;
    and `_park` warms the shell's materials against the world with `compileAsync`.
    **The exterior is modelled on the reference freighter, not extruded from the deck
    plan** (`ship-exterior.js`): a faceted loft whose mid-body flanks sit exactly on the
    interior plating (`OUT_X`) and whose chiselled wedge nose runs on past the canopy to
    z 16, a raised slit-windowed cockpit block, chin gun pods, a dorsal spine, a turret
    hump with mast, two tarped crates and a canister rack on the roof, four stacked
    engine nacelles (two a flank) past the stern, three skid-footed legs a side and a
    grated stair with handrails. It is about 34.7 x 16.8 m (`SHIP_FOOTPRINT.body`), rides
    `DECK_CLEARANCE` 2.6 m over the highest ground so the legs have room, and its own
    weathered `platedMetal` sets (sand-dusted) — never the interior's materials, of which
    it borrows `hazardMat` read-only. The static shell is `mergeStatic`-baked to one mesh
    per material; `fitToGround` rebuilds the legs and stair for the ground under them and
    merges them into two `noMerge` rig meshes (17 draw calls, ~17k triangles). The shell
    shows slits, not the interior's five-pane canopy: it is never drawn with the player
    inside. On Ligar it lands about 18 m off the pad, which is too hemmed in for its length. On
    the ground the ship stands where it landed (its boxes join the walk's colliders), [E]
    at the ramp is `BOARD THE AVALON`, and any route back to the ship boards it — in
    through the airlock, still landed — rather than teleporting to space. Asking for
    another world from a landed ship is a lift-off, a climb through the cloud, a pull
    away from the world just left, and the jump.
  - A **quest route** lands the ship on its world and leads the player to that quest's
    bench (only if it is open); `#/quest` leads to the next pylon. `Skip` on the helm plate
    hurries the flight (x6); it never cuts. The voyage stands down for T3 and below, a
    reload onto a world route (the first route of a page load), a signed-out player and
    `session.reduceMotion` — each keeps the old path, launch film included at T3.
- T4 Learn deployment: In T4, `#/learn/unit01` enters the 3D Tallow world
  (`stage.enterTallowScene(siteId)`), and `#/learn/unit02` enters Ligar
  (`stage.enterLigarScene(siteId)`); walking to a bench and pressing `[E]` raises a
  `learn-site:interact` event (it was `tallow:interact` while Tallow was the only one)
  that routes to `#/learn/<worldId>/<questId>`, where the quest's
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
- **`[E]` acts on what the camera is POINTED at, never on what is nearest.** It used
  to be proximity: on the ship that meant the ROOM you stood in (the storage bay offered
  the manifest with your back to it), and wherever two things were close the nearer won
  however hard you looked at the other. `three/aim-target.js` (pure, Node-importable)
  casts the view ray against the box each target occupies and takes the first one it
  enters within that target's reach; a ray that starts inside a box is a miss, and
  `blockers` stop it. Targets come from the place: `ShipInterior.getAimTargets()` (every
  door filling its doorway, and each station's own furniture via the `aim` boxes on
  `interactiveTerminals`, which also carry the `prompt`) with the bulkheads from
  `getAimBlockers()`; `WorldScene.getAimTargets()` (pylon masts, the lander hull);
  `learnWorldAimTargets(world, eyeY)` for Tallow and Ligar (each bench off its
  `benchAnchor`, same-floor only, and the landing pad, which you look down at). The
  prompt and the key both read `stage.aimedInteraction()`, so they cannot disagree.
- Planetary transit cinematics: Launch and atmospheric descent cinematics (`launch`, `erebus_descent`) trigger on transit to Sector 01 from the Star Map, Bridge, and Airlock without persistent one-time lockout, and are skippable via Click/Space/Esc. FPS controls are disabled during cinematic playback to prevent input leakage into the background world.
- Hero/prop shapes: `tools/hunyuan3d-shape-t4.ipynb` batches concept PNG/JPG images via Hunyuan3D 2.1 shape-only pipeline into `/kaggle/working/raw/*.glb` on NVIDIA T4; texturing is handled in Blender.
- Nano Banana PBR textures: procedural canvas PBR pipeline in `src/three/materials/textures.js` generating albedo, tangent-space normal maps, roughness, phosphor cathode distortion vignettes, and custom station screens (`createDurasteelTexture`, `createDurasteelNormalTexture`, `createBlastDoorTexture`, `createRackPanelTexture`, `createFootlockerTexture`, `createContainerStencilTexture`, `createKeyboardTexture`, `createDialGaugeTexture`, `createVacuumTubeTexture`, `createCrtScreenTexture`) coupled with Three.js `MeshStandardMaterial`.
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
  - `src/three/ship-lighting.js` implements `ShipLightPool`, lighting the 7 sources nearest the camera (strictly <= 8 PointLights for locked 60fps forward rendering). **The rooms declare the sources** with `ship.addLight` at the fixtures they actually built; `stage.js` hands `shipInterior.lightSources` to the pool, and the table in `ship-lighting.js` is only a fallback.
  - Ambient base fill: `HemisphereLight` (0x8faac8 / 0x2e3544, 2.2) and `AmbientLight` (0x4a5668, 1.5) preventing crushed shadow voids.
  - Forward canopy starlight: `DirectionalLight` (0xdce6f8, 2.6) aimed from (-8, 16, 26) through the front canopy into the cockpit and bridge.
  - Physical fixtures: the light troughs in every coffered deckhead, the amber line under the spine's cornice, the lit channel under the spine's grating, jamb lights on every portal, and the rooms' own lamps and screens.
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
  `max-width: 768px` (or narrower), so desktop is never affected:
  `mobile.css` (shell: transparent HUD with freed up navbar space; top-left `#mobile-menu-btn`
  with menu icon, Avalon symbol and title on transparent background opens `#mobile-sidebar`
  from the left side containing the full navbar switchgear `.mobile-nav-item`, player telemetry,
  and actions; transparent `#hud-install-btn` sits next to AVALON; modal sheet, toasts, page furniture,
  transmissions, cinematic captions under the frame), `mobile-screens.css` (per-screen rules for
  landing → admin) and `mobile-quest.css` (quest, demo, Tier 1 fallback, gardens map). Inline template
  styles are overridden there through class hooks plus `!important`. Inputs are 16 px on phones so
  iOS does not zoom; safe-area insets are honoured (`viewport-fit=cover`).
  `mobile-game.css` (linked last) carries the twin sticks, the `100dvh` full-bleed
  canvas and the full-screen key; none of it is width-scoped, because a
  landscape-locked phone is routinely wider than 760 px. It also houses the compact
  Learn walk HUD for phones (Tallow/Ligar): unit, name and keys with no brief, single-line
  benches with cleared count in header, bounded above the stick band and scrolling internally.
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

### 10. Progression, Standings, and Commendations
- **Level Curve (`src/progression/levels.js`):** Pure table-based progression curve (`LEVEL_THRESHOLDS`). Levels 1 through 12, max level 12 (0 to 2,520 XP). Rank titles: Cadet (1-2), Scout (3-4), Navigator (5-6), Voyager (7-8), Pathfinder (9-10), Starmarshal (11-12). Quest 1 pays 715 XP total (650 stages + 40 completion + 25 on-time), reaching Level 6.
- **Requisitions & Locker (`src/progression/requisitions.js`, `src/screens/quarters.js`):** Quartermaster unlock registry. All unlocks are strictly cosmetic and identity-based (`nameplate`, `title`, `cosmetic`, `insignia`, `specialty`). Zero XP or hint perks. Held requisitions derive purely from player level and earned badges. Players customize loadouts in the Locker.
- **Commendations Registry (`src/progression/commendations.js`):** ~40 commendation badges across 5 roads: Campaign, Craft, Learn, Crew, and Season. Pure predicate evaluations (`earnedBy(state)`). Commendations grant prestige and cosmetics; they carry zero XP. Up to 3 plates can be pinned to active dress. No meeting code badges.
- **Marks & Field Manual (`src/progression/marks.js`, `src/ui/field-manual.js`):** Clean marks reward solving stages on the first attempt without method rungs. 20 clean marks unlock discovery entries in the Field Manual.
- **Standings & Dignity Rules (`src/screens/leaderboard.js`):** 4 tabs: Guilds, Crew, Your Guild, This Week. Top 25 + neighbourhood (3 above, 3 below the player) with divider. All players receive dignity protection equally. Players opting out (`board_optout`) appear as `Crew · <GUILD>` on public boards. Text movement indicator (`+3 since last visit`). Rows link to public profiles (`#/crew/:playerId`).
- **Public Profile (`src/screens/crew-profile.js`):** Read-only dossier for `#/crew/:playerId`. Displays suit preview, level/title, nameplate finish, pinned plates, commendation counts by road, field manual count, watch streak, and guild. Omits stage failure and hint statistics.
- **Weekly Watch & Contracts (`src/progression/watch.js`, `src/progression/contracts.js`):** Weekly watch streak tracking with 1 forgiveness per 6 stood. Shared guild contracts scale to active roster size.
- **Verification (`tools/verify-progression.mjs`):** Enforces curve thresholds, requisition whitelist, zero-XP commendation invariants, clean marks, and forgiveness rules via `npm run verify:progression` in `npm run verify`.
