# Tallow in three dimensions — realism, diegesis, physics

**Status:** in flight. Started 2026-09-19.

The brief: craft Tallow and the quests played there as a hyper-realistic, freely
walkable first-person game; extend the same bar to the ship and Erebus. Copy the
product into 3D — **no player-facing string changes anywhere**. Preserve the
SCOURED PLATE look. Proper physics: no two objects may occupy the same space.

## Decisions taken before any code (answered by the user)

| Question | Answer |
|---|---|
| Scope | Tallow **+ ship + Erebus** |
| Quest frame | **Diegetic in-world panels** — the same strings on physical surfaces |
| Tier boundary | **Walking stays T4**; T3 and below keep the 2D screens untouched |
| Assets | **Procedural, in code** — no new binaries, no bake step |
| Erebus quest UI | **Also diegetic** (both roads) |
| Panel input | **Pointer released, raycast clicks** — [E] docks, cursor operates |
| Phone T4 | **Diegetic everywhere, no accommodation** |
| Latitude | **Rebuild where it helps**; navigation graph and site/pylon identities stay |

## Invariants that outrank the brief

1. **Not one player-facing string changes.** Prompts, hints, scans, briefings,
   reward cards, epilogue, labels — all verbatim. The diegetic panels re-home the
   existing DOM; they never re-author it.
2. **T3 and below are untouched.** Every quest completes exactly as it does today.
3. **The Learn track still pays no XP** — `verify:learn` must stay green.
4. **Grading is unchanged.** The frame still never sees an answer.
5. **`npm run verify` passes** at every checkpoint.

## Phases

- [x] P0 — Survey, decisions, plan
- [x] P1 — `materials/pbr-kit.js`: shared procedural PBR + greeble toolkit
- [x] P2 — `three/world-ui.js`: world-space diegetic panel system (CSS3D + WebGL housing)
- [x] P3 — `LearnFrame` diegetic mode (same API, same copy, on the bench).
      The instrument is now deployed onto the bench that already stands on
      Tallow rather than into a private scene, which meant widening both
      benches to 4.8 m so a four-station layout fits the plate, moving the lab
      column and rack clear of it, and boxing the bench colliders.
- [x] P4 — Erebus chamber console (`quest3d/console.js`): the stage deck moved
      onto the operator's desk, parented to the camera because the chamber's
      own controls orbit the sample.
- [x] P5 — Tallow realism pass. Crust rebuilt from `saltHardpan` with a detail
      normal below the repeat and a macro variation above it; every metal now
      comes from `platedMetal` at four weathering levels with full albedo /
      normal / roughness / metalness / AO; treadplate lab deck; faulted
      sedimentary cut face; greebles on the evaporators, the columns, the bench
      and the lean-to; services across the lab ceiling; two-layer dust.
- [x] P6 — Ship + Erebus realism pass. The Avalon's durasteel keeps its painted
      plate artwork but now carries normal / roughness / occlusion DERIVED from
      that image, so the light agrees with the picture; treadplate deck; a full
      set of services along the deckhead; one doorway per threshold instead of
      nine in a thicket. Erebus's basin floor is a real wind-worked ripple field
      instead of forty thousand random squares, and every pylon is built as
      hardware — bolted base, guys, insulator stack, service hatch, cable feed.
- [x] P7 — Physics, proved rather than declared. `tools/lib/dom-shim.mjs` lets a
      world be BUILT in Node; `tools/lib/overlap.mjs` measures every pair of
      separate objects in it. Wired into `verify:tallow` (Tallow) and
      `verify:ship` (the Avalon and Erebus). It found and fixed: a pipe bridge
      through a drum line, a conveyor through a pipe bridge, a container stacked
      across a hatch, a raceway through every deckhead frame, a tactical table
      skirt inside a doorway, and a crate inside a lean-to post.

## What the physics check is, precisely

Two objects may touch, may be bolted together and may be bedded into the ground.
They may not be drawn through each other. Parts INSIDE one object are exempt — a
gusset that merely touched the corner it braces would be holding nothing — so
the hull, the corridor services and each prop are each one object and the test
runs strictly between them. Ground surfaces (`phys: 'ground'`), the sky and
distant bodies (`phys: 'ambient'`) and decals (transparent) are exempt by kind.

Tolerance is 0.06 m: a bounding box is a loose fit around a rotated or round
body, and two adjacent props routinely share a few centimetres of empty box.
- [x] P5.1 — Playtest corrections (2026-09-19). First run on the flat turned up
      four things, all of which the fiction had been paying for:
      1. **q1 stage 2 could not be passed.** `checkResolved` recorded only the
         *selected* plate, but one dial magnifies the whole bench — so "inspect
         both crates" was unsatisfiable by looking. Resolution is now bench-wide.
      2. **The cursor was captured on every click.** Pointer lock is gone from
         the product: `FpsControls.requestPointerLock` is a documented no-op and
         looking around is left-drag everywhere. A teaching portal whose
         instruments are clicked cannot eat the pointer on the first click.
      3. **The sampler scope is not a built bench.** A microscope shows a
         *picture* at a magnification; built in 3D that reads as the sample
         inflating, which is not what matter does. `SampleScope` is now the
         drawn instrument on every tier, `instruments.BUILT_BENCHES` names the
         quests whose bench really is an object (`q2-core` only), and
         `learn-quest.js` decides from it whether the frame goes diegetic or
         stays a page over the flat. `SampleScope3D` is kept, whole.
      4. **The power control is a knob** (`engine/dial.js`), turned by drag,
         arrow keys or wheel — not a pair of stepper keys.
      Side effects worth knowing: a drawn bench has no scene, so nothing else
      would stand the walk down — `stage.setWalkSuspended()` does it, and
      `FpsControls.onKeyDown` now ignores keys aimed at a focused control.

## Technique notes

**Why CSS3D for the panels.** The quest modules hand the frame HTML strings.
Rasterising that into a canvas texture would mean re-implementing their layout,
which is exactly the "change the text" failure mode the brief forbids. A
`CSS3DRenderer` object transformed onto the panel plane keeps the DOM, the
handlers, the fonts and the 375 px rules intact, and a WebGL bezel/phosphor
housing built around it supplies the hardware. Text stays verbatim by
construction.


## Build cost

Procedural surfaces are per-pixel JavaScript and run once, when a place is
entered. Measured in Node behind the DOM shim (a browser is faster — its
`getImageData`/`putImageData` are memcpy rather than a JS loop):

| Place | before | after |
|---|---|---|
| the Avalon | 432 ms | ~350 ms |
| Tallow | 2927 ms | ~850 ms |
| Erebus | 1294 ms | ~580 ms |

Four changes got that, none of them visible:

1. **Ambient occlusion is computed at half resolution.** It describes where a
   surface shadows itself, not where its grain is, so 256 interpolated is
   identical to 512 and a quarter of the cost. It was the single most expensive
   pass in the kit.
2. **`platedMetal` computes wear and rust at half resolution.** Both are broad
   soft fields that are blurred immediately afterwards — paying full price for a
   signal you then deliberately soften is paying twice for nothing.
3. **`desertSand` buckets its lag gravel into a wrapped 12 x 12 grid.** Ninety
   stones tested against every pixel of two passes is forty-seven million
   distance computations; bucketed, a lookup touches one or two.
4. **Resolution is spent where the player's face goes.** The bench plate and the
   pylon mast stay at 512; drums read from ten metres across four repeats, and a
   deck repeated nine times, drop to 256 — where the repeat is already supplying
   the density that resolution would have.
