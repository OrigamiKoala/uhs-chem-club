# Avalon — Engineering Reference

Avalon is the UHS Chemistry Club's competition portal. Its audience is middle- and
high-school students who know little or no chemistry, so the product rule that outranks
everything else is: **teach through play, reveal vocabulary last.** A player draws lines
between glowing regions for twenty stages and only meets the words "electron", "curved
arrow" and "steric hindrance" in the epilogue, after the intuition is already built.

## Build and Run
- `npm run dev` — Vite dev server on port 3000 with the API handler mounted as middleware.
- `npm run build` — production assets into `dist/`.
- `npm run verify` — `verify:quest` + `verify:geometry` + `verify:media` + `verify:flows` + `build`. Run this before shipping.
- `npm run verify:quest` — static integrity check of all 20 Quest 1 stages (see below).
- `npm run verify:geometry` — runs all 20 reaction animations headlessly and checks the chemistry
  on screen (see "Chemical realism" below). `--verbose` prints atom positions at every step.
- `npm run verify:media` — validates media manifest against assets and size budgets.
- `npm run verify:flows` — end-to-end smoke test of the API a new student touches.
- `npm run deploy:backend` — `clasp push` of `apps-script/`.
- `npm run bake:stills` — regenerate the static SVG backdrops in `public/fallback/`.
- `npm run bake:video` — encode raw MP4 clips in `assets-src/video/` to web-ready WebM, MP4, posters and audio.
- `npm run seed` / `npm run test:load` — roster seeding and 40-user concurrency sim.

## Architecture

### Client (`src/`)
- `main.js` — boots the 3D stage, HUD and router immediately, then fetches `bootstrap`
  in the background so first paint never waits on the network.
- `router.js` — hash router. `ROUTES` declares auth/admin gating; `ROUTE_NAV` maps a route
  to the HUD nav button that should light up; unknown hashes normalize to `#/`. Closes any
  open modal and exits the quest scene on navigation.
- `session.js` — token, player, team, XP, inventory, progress, and flags (`hasFlag`, `setFlag`), persisted in
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
  and cinematic cutscenes (`cold_open` in onboarding, `launch`, `erebus_descent`, `pylon_wake`, `gardens_restored`).
- `story/trinkets.js` — Session Zero deterministic d20 cosmetic trinkets and character backgrounds.
- `media/manifest.js` — media manifest mapping 19 loops and cinematics with WebM, MP4, posters, and captions.
- `screens/` — one render function per route, all pure string templates.
- `three/` — persistent WebGL stage, quality-tier probe (T3/T2/T1), ship interior, camera rig.
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

### Backend (`apps-script/`)
`Db.gs` (Sheets DAO), `Auth.gs`, `Players.gs`, `Quests.gs` (manifest, grading, hints,
completion), `Scoring.gs` (normalized leaderboards, level curve, level titles),
`Items.gs`, `Events.gs`, `Main.gs` (router + `setup()` for one-click sheet init).

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
- **Progress never regresses** — `stage_reached` is always `Math.max`'d.
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
- Concept cards (bumper cars, two-handed handshakes, bent springs) appear after the solve
  on the stages that introduce a new idea, and can be hidden and reopened.
- A correct answer plays a physically honest 3D reaction: molecules approach along the
  collision vector, a bond snaps in, leaving groups depart, double bonds open and re-form,
  rings pop. The explainer appears **after** the animation, never on top of it.
  `playReaction` never strands the player on "Reacting…": a failed animation still
  resolves so the explainer and Next button appear.
- The stage briefing modal auto-shows only for genuinely new mechanics — stages 1, 5, 8,
  11 (`AUTO_MODAL_STAGES` in `quest.js`, plus any `conceptTiming: 'intro'` stage), once each
  and never on replay. Every other stage starts immediately; the Objective button reopens
  the briefing on demand.
- The bundled `STAGE_CONFIGS` are authoritative for everything rendered or graded
  (`moleculeId`, anchors derived from its regions, expected anchors, positions, tolerance,
  blocked sites, `reaction`, `multiArrow`, XP). Backend `scene_config` is transport only —
  a stale Sheets row must never swap in another stage's molecule.
- The epilogue (`QUEST1_EPILOGUE`, duplicated verbatim in `Quests.gs`, the proxy and
  `quest.js` as an offline fallback) is the single place real terminology is introduced.

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
- `docs/plans/immersion-pass.md` — the campaign frame (the quartermaster Vess, pylons on Erebus),
  Session Zero onboarding, soundscape, and the video pipeline (all 14 loops & cinematics baked & integrated).

## Player journey
1. `#/` landing — cold open comms transmission, cockpit loop banner, and Create Account / Try a Pylon CTAs.
2. `#/demo` — Stage 1 sample, no account, intro modal explains mechanics & controls, graded by the same evaluator.
3. `#/register` — step 1 of 3 on the shared `stepRail`. Live validation mirrors
   `validateDisplayName` in `Util.gs` exactly, so no rule bites only at submit time.
4. `#/onboarding` — step 2. Four teams with guild names and live slot counts.
5. `#/bridge` — step 3. Resume/start CTA, progress bar, XP, level and team conditions.
6. `#/quest` → `#/leaderboard`, `#/inventory`, `#/quarters`, `#/settings`, `#/admin`.

Nav labels match page titles exactly: BRIDGE, STAR MAP, STANDINGS, INVENTORY, CREW.

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
  adding a halo. `.choice-option` is a toggle with a lit left edge when selected.
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
- **A quest is described by three things and nothing else**: where it happens, its title,
  and one short line. Sector 01 is `Erebus · Desert world / The Charge Gardens / "Find
  what pulls. Draw the line."` — that is the template.
- Screens carry no subtitle unless it is that one line.
- **The teaching copy is exempt.** Prompts, `scans`, the three hint rungs, `diagnoseMiss`
  messages, concept cards and the epilogue are the product; they are trimmed for
  tightness, never for length.
- **Story copy is exempt too**, if it builds the fiction rather than describing the
  product. This covers Vess's transmissions and `onClear` lines, Session Zero scenes,
  guild pitches, mission-log entries, Fleet Comms intercepts and item provenance. It lives
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
- Nano Banana (`generate_image`) matte textures with Three.js procedural geometry and
  `MeshStandardMaterial`.
- Starship cockpit: faceted durasteel canopy mullions, overhead avionics rack, dual analog
  yokes, throttle quadrant, armored bucket seats, twin CRT monitors.
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
  - `stage.js` gives the ship scene a dim `RoomEnvironment` PMREM
    (`environmentIntensity` 0.22) so the metal surfaces show reflections.
- Lighting: cool starlight through the canopy, warm sodium instrument task lamps, dust motes.
- Routes bind environment stills: `/art/cockpit.jpg`, `starmap.jpg`, `crucible.jpg`,
  `cargo.jpg`, `quarters.jpg`, `comms.jpg`, `airlock.jpg`.

### 9. Layout invariants
- `--hud-h` is the height of the fixed header. `.app-viewport` padding and the fixed
  `.quest-hud-overlay` both derive from it; nothing may slide under the HUD.
- Everything must work at 375 px wide. Media queries at 900 px / 760 px / 620 px collapse
  the HUD, hide the legend and secondary chrome, shrink the chamfer, and cap the stage
  card height.
