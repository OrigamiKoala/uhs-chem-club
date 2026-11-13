# Building the side quest's walkable world

A side quest has its own planet. The world is not scenery around a menu: it is where the player sees what
they have done. Erebus has twenty dark pylons on the rim of a dry lakebed and each solved stage lights
one. Design the place so that **the state of the contract can be read off the landscape**.

Authority: `docs/engineering/engine-and-worlds.md`, section "Worlds, ship, voyage (3D)". Read it before
writing world code. This file is the short list of what binds a side-quest world and where to look.

## Exemplars to open

- **Erebus**, the only contract world: `src/three/world.js` (the orchestrator and public contract),
  `src/three/erebus/` (terrain, atmosphere, rocks, landmarks, vista, effects),
  `src/three/world-data/erebus.json`, `tools/generate-erebus-world.mjs`. Its sites are stage sites
  (`{ id: 'site-1', stage: 1, pos, approachPos, label }`), `[E]` on one fires `pylon:interact`, and
  `setClearedStages(set)` changes what stands there.
- **Lodestone**, the most recent world built to the current rules: `src/three/lodestone.js`,
  `src/three/lodestone/`, `tools/gen-lodestone-layout.mjs`, `tools/verify-lodestone.mjs`. Copy its
  structure for the generator and the verify script. To find everything a world touches:

```bash
grep -rIln "lodestone" src tools package.json | grep -v "src/learn/"
```

A side-quest world is entered like Erebus (a contract route, stage sites, the game opening from a site),
and is built like Lodestone (generator, host plan, analytic terrain, lamp pool, verify script). It is not
a Learn world: it has no benches, no `buildBayBench`, no boss arena, and `isLearnWorld` must stay false
for it.

## Design

- **One place with one job.** A works, a yard, a field, a rig that the Fifth Guild left broken. The
  stage sites are the machines of that place. Name the world and write its one line in the spec.
- **A site per stage, or a site per movement.** Twenty pylons suit a game whose stage is one junction.
  If the mechanic reads better as a few large machines, use one site per movement that holds its stages
  in order. Either way the next uncleared site is led to by the waypoint, and a site beyond it refuses
  with a plain toast.
- **Cleared is visible.** Each clear changes something permanent at the site and, at milestones,
  something seen from across the world (lamps along a rim, a stack that starts to steam, a gate that
  opens). This is the progress bar.
- **Walks are short.** Sites stand close enough that the walk between two stages is a few seconds. The
  quest is 25 to 35 minutes of play; the walk must not double it.
- **No signs.** No sign stands in any world. A site's name is its data `label` (at most six words), read
  by the Star Map, the guide arrow and the `[E]` prompt.
- **Plain industrial hardware**, SCOURED PLATE: weathered plate, bolts, cable, filament lamps. Amber is
  a signal, never a surface.

## Engine rules

- **Layout is generated.** `tools/gen-<world>-layout.mjs` writes `src/three/world-data/<world>.json`
  (sky, terrain, landmarks, sites, spawn). Positions are never hand-edited in the JSON.
- **One analytic height function**, so the walk and the Node checks stand on the drawn ground; one
  terrain grid to the horizon.
- **One sky function** that is also the fog and the PMREM environment map.
- **Materials from the PBR kit** (`src/three/materials/pbr-kit.js`); OpenGL-style normals, never
  compensated per material (`verify:normals`).
- **Nothing overlaps.** No two bodies occupy the same space (`tools/lib/overlap.mjs`, tolerance 0.06 m),
  nothing is buried, and every site can be walked to from the spawn.
- **Only lamps are lit.** A lamp is a `lampMark` in the world's `LampPool` with a fixed light count; a
  changed count recompiles every material. Never add a `PointLight`. Lighting a cleared site must reuse
  pool lamps, not add lights.
- **Draw calls are the budget.** Static props go through `mergeStatic` and `consolidateStatic`; anything
  that moves or is addressed later (a site's cleared state) is marked `noMerge` or `mover`. Shadow maps
  rest when nothing moves (`shadow-pace.js`). No `backdrop-filter` over the canvas.
- **The pointer is never locked.** `[E]` acts on what the camera points at (`aim-target.js`), never on
  what is nearest. One window listener for `X`.
- **The world is flown to** at `3D On` (`three/voyage.js`): add a destination entry
  (`key`, `name`, `hash`, `descent`, `planet`), and a branch in `stage.worldFor`. Stepping off the ship
  must not change the world's light count.
- **Phones.** Twin sticks show while the walk is the foreground and hide for the game view; DPR is
  capped and handsets have no shadow map. The game view opened from a site must not depend on shadows
  to be read.
- **3D Off has no walk.** The contract route goes straight to the stage list and the flat game view.
  The world JSON's `t1` and `t2` blocks (see `erebus.json`) describe what lower tiers show.

## Registering the world

- `src/three/stage.js`: import, `worldFor` branch, exposure constant, and an entry path for a contract
  world (Erebus uses `enterWorldScene`; generalise it to take a world key instead of adding a second
  copy).
- `src/three/voyage.js`: the destination entry.
- `src/router.js`: `voyageTargetFor` returns the world key and the waypoint of the next uncleared site
  for the contract's route.
- `src/ui/galaxy-map.js` and `src/screens/starmap.js`: the planet's plate (`verify:galaxy`).
- `src/story/saga.js`: the world's arrival lines and clue.
- `src/media/manifest.js`: only if a cinematic is added; a missing cinematic must not block play.
- `package.json`: `verify:<world>` and its place in the `verify` chain.

## Checks

Write `tools/verify-<world>.mjs` on the pattern of `tools/verify-lodestone.mjs`: build the real world in
Node with the DOM shim and measure declarations, site footprints, overlap of bodies, buried bodies, lamps
only lit, and a walk from the spawn to every site. Add: every stage has a site (or its movement's site),
every site's cleared state exists and adds no light, and labels are at most six words.

Then run `verify:<world>`, `verify:voyage`, `verify:galaxy`, `verify:normals`, and
`node tools/perf-worlds.mjs` (compare the new world's draw calls with the existing worlds'; a world far
above them needs merging, not a higher budget). After any change to shared engine code, run every other
world's verify script as well.
