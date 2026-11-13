{world} = <fill in one: Kettle | Lodestone | Teeter | Verdigris | Brinewire | Quicklight | Ember Reach | Mirrowen | Bellows | Lanternfall | Tallow>
{key}   = <the world's folder name under src/three/: kettle | lodestone | teeter | verdigris | brinewire | quicklight | ember | mirrowen | bellows | lanternfall | tallow>
{unit}  = <unit07 | unit12 | unit08 | unit09 | unit10 | unit11 | unit05 | unit06 | unit04 | unit02 | unit01>

# Goal

Rebuild the walkable 3D site of **{world}** in Avalon (repo: `~/chem-3d`), a browser chemistry game for students aged 12 to 17, so that it is a different place from every other world, and so that its benches are found inside the world, not standing on it.

The owner's complaint, which is the reason for this task: the walkable worlds look like one world in different colours. Ten of them are a flat plate with machines standing on it in the open, and six of those share one layout. The owner is satisfied with one world only, **Ligar**, where the land has hills and cuttings and the benches are in the quarry's workings and in chambers down the mine's drifts. `docs/plans/world-distinction-plan.md` has the measurements, the standard, the engine constraints and the brief for each world. It is the contract for this task. Read it first, all of it.

What "done" looks like for the owner: they land on {world}, and before they reach the first bench they can say what kind of place this is in one sentence that names no colour. They cannot see most of the benches from where they land. They walk up or down to reach them. Each bench is inside a piece of the world that has to do with its chemistry, with walls or rock round it and its own lamps over it.

**You are changing the site only.** Ground, sky detail, layout, hosts, props, vista, effects, and the world's checks. You change no quest, stage, table kit, bank entry, glossary, story line, site id, quest id or bench label. If the site cannot be made right without changing one of those, stop and ask.

**This is one autonomous run.** Do the whole job without stopping to ask for the next step. Stop and ask only if (a) something here conflicts with `PRODUCT.md` or `CLAUDE.md`, (b) the world's row in the signature table cannot be built inside the engine constraints, or (c) a decision is the owner's (a change to lore, scope or teaching content). Everything else: decide, do it, and log the decision in the build record.

**You cannot see what you build.** Agents do not open the game in a browser in this repo; the owner play-tests. Every geometric claim you make must come from a Node measurement, and your deliverable ends with a list of places the owner should stand and what they should see from each. Do not describe how anything looks as if you had seen it.

# Authorizations

- Work on a new branch `site/{key}` cut from the current branch. Commit after each phase, only your own files. **Never push.** Other work may be uncommitted in the tree: do not stage, revert or reformat files you did not change.
- Do **not** run the full `npm run verify` or `npm run build` without first copying anything in `dist/` that is not build output to your scratchpad: the build empties `dist/`, and the owner keeps reference art in `dist/art`. Prefer the individual `npm run verify:<name>` scripts.
- **Never delete** code, docs or checks that were once real. Move replaced files to `archive/<today's date>/site-{key}/` with a README saying what replaced them, and disconnect them from live imports. Code in `archive/` is not built or verified.
- You may use subagents for independent hosts once the ground and the first host are green. You own integration and every measurement.

# Read first, in this order (read large files in chunks; read only what you need)

1. `docs/plans/world-distinction-plan.md`, all of it. Section 3 is the standard you are held to, section 4 the constraints, section 6 the signature table. **{world}'s row in section 6 is your brief.** If the owner has edited the row, the edited row wins over anything you would prefer.
2. `CLAUDE.md` (hard rules, the SCOURED PLATE aesthetic, commands) and the "Worlds, ship, voyage (3D)" section of `docs/engineering/engine-and-worlds.md` (lines 240 to 320: bay bench, lamp pool, static merging, shadow pacing, boss arenas).
3. **Ligar, the reference.** Read the file headers and then the parts you will copy the method of:
   - `src/three/ligar/mine-plan.js` (hills in the height field, volumes, doorways, colliders, cover boxes, terrain holes; pure data, no THREE)
   - `src/three/ligar/mine.js` (the rock and the sets built from that plan)
   - `src/three/ligar/stations.js` lines 1 to 60 (what a host is, the host frame, how a chamber host keeps the bay clear and hangs its own lamps)
   - `src/three/ligar/terrain.js` lines 1 to 60 (one height field, what the ground shader draws)
   - `src/three/ligar/atmosphere.js`, search `Cover` (how the sun and sky are taken out of a roofed space)
   - `docs/plans/tallow-ligar-world.md` section 4, "What made it read as a toy", and `docs/archive/2026-11-06/passes/bench-integration.md`
4. {world} as it stands: `src/three/{key}.js`, everything in `src/three/{key}/`, `tools/gen-{key}-layout.mjs`, `src/three/world-data/{key}.json`, `tools/verify-{key}.mjs`, and the world's `docs/plans/` file. Find every other file that names it: `grep -rIlE "{key}|{unit}" src tools`.
5. `docs/story/bible.md` for {world}'s place, foes and boss, and the quest titles in `src/three/{key}/host-plan.js`. The site must fit them.
6. `PRODUCT.md` section 5 rows that mention worlds, hosts, benches at 3D On, or the lean-in view.

Then measure the world as it stands and keep the output for your report:

```
node tools/world-shape.mjs {key} ligar
node tools/perf-worlds.mjs {key} ligar
```

# Method

Each phase ends with its checks green and a commit. Do not start a phase until the one before is green.

## Phase 0. Shared groundwork (only if it is not there yet)

Look at section 5 of the plan and at section 9's first row. If `src/three/lib/workings.js`, `src/three/lib/cover.js` and `tools/lib/world-shape-checks.mjs` do not exist, you are the pilot and you build G1 to G5 now, exactly as section 5 describes:

- Lift, do not rewrite. Ligar's behaviour must not change: `npm run verify:ligar`, `verify:bench`, `verify:arena` and `verify:voyage` are green before and after, and `node tools/perf-worlds.mjs ligar` prints the same counts.
- Every option you add to shared code is opt-in. After any shared change, run every world's verify script.

If they exist, read them and use them. Extend them only with opt-in options.

## Phase 1. Site spec before code

Add a section "Site rebuild (<date>)" to {world}'s file in `docs/plans/`. It is what you audit yourself against. It must contain:

1. **The place in one sentence**, naming no colour, and a second sentence saying what a player sees in the first ten seconds after landing.
2. **The signature**: landform, walk shape, bench housing, light. Checked against every other row in the plan's section 6: none of the first three may repeat. If yours has drifted from the row, say why.
3. **A plan** in words and coordinates: the extent of the walk, each level and its height, every closed piece of high ground, every water or drop the player is kept out of, the pad, the spawn, the route from the spawn to each bench in bench order, and the boss's ground.
4. **A section**: the heights along the main route, start to end. Bench ground must span at least 3 m (or, where the row says the ground is flat or built, say what gives the levels).
5. **One paragraph per bench**: the quest and what it teaches; the piece of the world it stands in and why that piece fits that chemistry; what encloses it (which directions are closed, what is overhead, how big the room is); how the player comes to it and what they see as they arrive; its lamps; what stands behind and beside the plate. No two benches in the world get the same room.
6. **How it differs from each neighbour.** For each of the other eleven worlds, one line: what a player would point at to tell the two apart.
7. **The far country**: what stands beyond the walk in each direction, and what is on the horizon.
8. **The numbers you will hold**: target `world-shape.mjs` row (housed count, ground span), plates in view from the spawn (at most two), triangle and draw-call budget (plan section 4).
9. **What is kept, what is rebuilt, what is archived**, file by file.

Gate: reread the spec against the plan's section 3. If the place could be turned into another world by changing its palette and its props, the landform is not doing the work. Redesign before writing code.

## Phase 2. The ground

Build the land with no hosts on it, only a placeholder box for each.

- The height field stays ONE analytic function. Levels come from grades, ramps, cuttings and sunk floors. There is never walkable ground above walkable ground: a roof or a deck overhead is a body.
- Write the pure plan module first (no THREE), as Ligar's `mine-plan.js` is: the generator, the world, the walk and the checks all read the one declaration.
- Rewrite `tools/gen-{key}-layout.mjs` for the new layout. It stays deterministic and seeded. Site ids, `questId`, `label`, `stage` and the `built` flag do not change. Regenerate `t2` still cameras and `t1` data.
- Close every piece of high ground and every drop with colliders. Prove by flood fill from the spawn that every approach is reachable, that no reachable cell drops off a ledge, and that the player cannot reach any roof, hill top or water.
- The landing pad, the spawn, the voyage's landing solution and `BOSS_ARENA_SPOTS` for {world}'s boss must still solve; move the arena spot in `boss-arena.js` if the ground under it moved, and keep it open and level with the boss in view.

Green before moving on: the world builds in Node, flood fill passes, `verify:voyage`, `verify:arena`.

## Phase 3. One host, end to end

Pick the bench whose room is hardest (the most enclosed, or the lowest). Build it completely:

- The host is the room AND the bench as one object, as in `ligar/stations.js`. The bench is `buildBayBench`; the bay envelope (`bayBoxes()`) stays empty; nothing new goes in `tools/bay-legacy.json`.
- A room is at least 11.2 × 11 m with 4.4 m of headroom at the plate, so the lean-in camera has air on both sides and behind the player.
- A roofed room is covered (the shared cover mask), and is lit by its own lamps from the world's `LampPool`. The pool's light count does not change with where the player is. No `PointLight` per fixture.
- The doorway is wide enough to walk through with the collider radius, and the guide's route runs through it.
- What stands beside and behind the plate is the working machinery of that place, built from real sections (look at `ligar/plant.js` and `tallow/kit.js`), merged static unless it moves.

Then measure: `verify:bench` (bay clearance and the pointer-path solve at every viewport), the world's own overlap and buried-body checks, `world-shape.mjs` for that bench (`R4` or better, or what the spec declared). Fix the pattern here, before copying it.

## Phase 4. The remaining hosts

Build them in bench order. After each: checks green, a commit. No two rooms alike. A bench the spec leaves partly open (an alcove, a gallery with one open side) still closes at least three directions.

## Phase 5. The place itself

In this order, stopping when the budget is reached:

1. **The ground's surface.** What this ground is made of, drawn so it does not repeat where the eye can find it, and so that the routes people take show on it. Steep faces show what the land is made of in section.
2. **The plant and the props**, placed because the place needs them, not to fill gaps. Delete the idea of scatter: every heap, stack and tank is either part of a working or it is gone. No sign stands in any world.
3. **The far country** beyond the walk (`phys: 'ambient'`): at least one landmark per quarter of the horizon that is this world's and no other's.
4. **Movement**: the few things that move here (water, steam, cable, weather), each one `noMerge` and counted in `perf-worlds.mjs`.
5. **Light.** Keep the built sky unless the row says otherwise. Heat is not drawn as a glow; nothing blooms; amber is a signal, never a surface (`CLAUDE.md`, SCOURED PLATE).

## Phase 6. Checks that hold the new shape

Rewrite `tools/verify-{key}.mjs`. Keep every safety check it had (overlap at 0.06 m, buried bodies, reachability, no walkable ledge, only lamps lit, lamps over every plate, hosts inside their declared extents, level ground under each plate and its lane, emoji-free strings, the arena). Replace the checks that held the old template (two columns, the 100 m prop disc, one lamp lane down one road) with checks that hold the spec's numbers, using `tools/lib/world-shape-checks.mjs`: bench ground span, housed count, no bench coordinates shared with another world, not one circle, not two columns, at most two plates in view from the spawn, single floor. The archived script goes to `archive/`.

Then run, each as its own script: `verify:{key}`, `verify:bench`, `verify:arena`, `verify:voyage`, `verify:learn`, `verify:table`, `verify:docs`, and every other world's script (`verify:tallow`, `verify:lanternfall`, `verify:ligar`, `verify:bellows`, `verify:ember`, `verify:mirrowen`, `verify:kettle`, `verify:teeter`, `verify:verdigris`, `verify:brinewire`, `verify:quicklight`, `verify:lodestone`). All green, or each failure logged with the evidence that it is not yours (run it on the parent branch).

Measure again and put before and after side by side in the build record:

```
node tools/world-shape.mjs {key} ligar
node tools/perf-worlds.mjs {key} ligar
node tools/perf-bench-rest.mjs
```

## Phase 7. Close out

- **Build record.** Finish the "Site rebuild" section: what was built, every place it parted from the spec and why, the before and after measurements, what was archived and where.
- **The plan.** Fill {world}'s row in section 9 of `docs/plans/world-distinction-plan.md`; correct its row in section 6 if the build parted from it; if you were the pilot, fill the groundwork row.
- **Other docs.** {world}'s "Setting" line in `docs/plans/world-plans.md`; the world's paragraph in `docs/engineering/engine-and-worlds.md` (add one if it has none: files, layout, the traps you met); `PRODUCT.md` section 5 gains a row for any new pitfall; `CLAUDE.md` only if a hard rule or command changed.
- **The owner's viewing list.** Eight to twelve entries. For each: where to stand (the spawn, or "at Bench N's plate, facing the door"), what should be in view, and what would mean it failed. Include the landing, the first sight of the first bench, every room, the lowest and highest ground, and the boss's ground.

# Rules you must not break

- One height field, one floor. No walkable ground over walkable ground. High ground and drops are closed by colliders and proven by flood fill.
- Nothing occupies the same space as anything else (`tools/lib/overlap.mjs`, tolerance 0.06 m). A host's own parts are exempt from each other, so a host is one object.
- The bay envelope is empty and `tools/bay-legacy.json` stays empty. Every bench is checked from the lean-in view by `verify:bench`.
- Only lamps are lit, from a pool with a fixed light count. A roofed room is covered.
- Static props are merged (`mergeStatic`, `consolidateStatic`); anything addressable or moving is `noMerge` or `mover`. No `backdrop-filter` over the canvas. Shadow maps rest when idle. A world's opaque material never sets `depthWrite: false`.
- At most 900k triangles and 566 draws at T4, as `perf-worlds.mjs` prints them (the plan's section 4).
- Site ids, quest ids, labels, bench anchors and the public world contract (`scene`, `data`, `colliders`, `terrainMesh`, `getTerrainHeight`, `benchAnchor`, `setBenchDeployed`, `setSiteComplete`, `update`, `dispose`) are unchanged. No player-facing string changes.
- Nothing in `src/learn/` changes, except `boss-arena.js`'s spot for this world if the ground under it moved.
- No sign, placard of instructions, or text that advertises the interface stands in the world.
- SCOURED PLATE: weathered hardware, filament light, no glow, no neon, no cyan, no emoji, no rounded corners.
- Physical honesty: a thing is drawn as what it is. Rock is jointed the way that rock joints; steel is built from sections; water lies level.
- Archive, never delete. A check is replaced by a stricter one, never dropped.

# Pitfalls that cost the most

- **Re-skinning.** Changing the palette, the prop set and the horizon ring and calling it a new world. If the height field inside the walk still varies by less than a metre, nothing has changed.
- **A shed is not a place.** Standing a four-walled hut on a plain round each bench meets the roof count and misses the point. The room is part of the land or part of one large structure that the player is already inside or beside.
- **Eight rooms that are one room.** Copying the first host seven times with different machines.
- **The cramped room.** Walls placed just outside the bay envelope pass `verify:bench` and leave the lean-in camera looking at a wall. Hold the minimum room size.
- **The bright room.** A roof with no cover mask is fully lit by the sky on a phone, which has no shadow map.
- **The lost bench.** A hidden bench with no lamp lane and no guide route through its doorway.
- **Two floors.** A gallery, bridge or mezzanine the player can walk both on and under. The engine has one floor.
- **A light per lamp.** Each `PointLight` recompiles every material when the count changes.
- **Scatter creep.** Filling open ground with heaps and crates because it looks empty in a plan view. Empty ground that is the right shape is fine.
- **Changing shared code for one world.** An option that is not opt-in breaks another world's layout. Run every world's script after a shared change.
- **Claiming a look.** You have not seen it. Report measurements and the viewing list.

# Definition of done

1. `node tools/world-shape.mjs` shows {world} with no cloned coordinates, bench ground spanning at least 3 m (or the declared exception), and at least two thirds of its benches housed.
2. The world's signature repeats no other row's landform, walk shape or bench housing, and the spec's "how it differs from each neighbour" list is complete.
3. Every check in Phase 6 is green, or each failure is shown not to be yours.
4. Triangles and draw calls are inside the budget, before and after are in the build record.
5. No quest, stage, kit, bank, glossary, story, id or label changed.
6. Replaced files are in `archive/` with a README; the docs in Phase 7 are updated; the plan's progress row is filled.
7. Everything is committed on `site/{key}`, nothing is pushed, and no file of yours is uncommitted.

# Final report

Reply with: the place in one sentence; the signature; the before and after `world-shape.mjs` and `perf-worlds.mjs` rows; each bench and what now encloses it; what you changed in shared code and which worlds you re-ran; every check and its result; where the build parted from the spec and why; what is still weak; and **the owner's viewing list**. Say plainly that nothing was seen in a browser.

If something blocks you, log it in the build record with the evidence and carry on with what does not depend on it.
