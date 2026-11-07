# Brinewire: the walkable world (builder notes)

Scope: the copper marsh as a place (spec section 5), the six bench hosts, the Clamp's arena spot and arena body. Not here: the quests, the cell kit, the Clamp's table foe body (`foebody.js`, `foes.js`), the boss quest and the finale.

## What was built

- `tools/gen-brinewire-layout.mjs` writes `src/three/world-data/brinewire.json` (seeded, self-checking, refuses to write on a layout clash). It reads `src/learn/quests/unit10/` to set each site's `built` flag, so **rerun it whenever a quest module lands** (`verify:brinewire` fails on a stale flag).
- `src/three/brinewire.js` (the `BrinewireWorld` class, same contract as `VerdigrisWorld`) and `src/three/brinewire/{terrain,atmosphere,stations,plant,host-plan}.js`, `src/three/materials/brinewire-textures.js` (`saltMud`, `saltBoard`, `brineWater`, `pourConcrete`).
- Layout: a plank spine from the pad and spawn (z 92) south to the switch-house court (boss ground at 0,-54), six spurs (odd benches west at x -42, even east at x +42, z 62/28/-6 west and 46/12/-22 east), nine near pools between the spurs fenced by boxes, the lagoon (largest pool, z -62 to -130) on the court's south shore. Pools carry a lattice pylon or a brine tank; the court's west pool carries the switch house; the lagoon carries three pylons and four rotor piers (the only moving parts, cup wheels, one turn in 40 s). Five cable spans (two conductors each) hang from pylon arm tips, 8 m or more over the water and the spurs, as one ambient object. Land: transformers, cable reels, salt heaps, ingot and crate stacks, salt grass, 37 work lamps.
- Hosts (one per quest id of the plan, built whether or not the quest exists): site-1 `q1-halves` pylon base in a brine sump; site-2 `q2-activity` dip pool with a gantry of hung strips; site-3 `q3-galvanic` pool pair with an arched pipe bridge and a strung cable; site-4 `q4-potential` metering shed; site-5 `q5-load` battery bank; site-6 `q6-electrolysis` plating works. Each bench's cased instrument (`kind`: beaker, rack, rig, meter, load, supply) differs.
- Boss arena: `boss-arena.js` gains `BOSS_LOOK['the clamp']` and the `boss-clamp` spot (unit10, same court coordinates as the other end-of-spine arenas); `boss-models.js` gains `buildClamp` (a drain clamp on a lattice pylon: concrete sled, braced mast, patina housing with two lenses, five glass cells with copper caps ringed round the back on cables, two three-joint arms ending in working jaw pairs, four armour plates). **Hook for the later builder:** the species name is `'the clamp'`; `foes.js` and `foebody.js` need an entry under that name (Leach entries are the model); the saga/finale files nothing yet.
- Registered: `worlds3d.js` (`unit10`), `voyage.js` (`brinewire`), `stage.js` (world, exposure 0.9, `enterBrinewireScene`, `setBrinewireSiteComplete`, `isLearnWorld`), `commendations.js` (`learn_q7_halves`, earned by `unit10/q1-halves`), `verify-bench.mjs` (import, foes list, `WORLD_OF`), `verify-voyage.mjs`, `verify-arena.mjs` (world, ten bodies, scale), `package.json` (`verify:brinewire`, and in the `verify` chain before `verify:bench`).
- `tools/verify-brinewire.mjs`: modelled on `verify-verdigris.mjs`: the planner data check, landmark and host declarations, built-flag staleness, sites and labels, tier parity, the lamp lane, the Clamp's ground against `boss-arena.js`, then the real world in Node: overlap, buried bodies, lit materials, water, bench anchors and lamps, the walk flood fill (ledges, wading, fenced pools, reachable approaches), host extents, level ground, the bay and lean-in view at seven viewports. New checks: cable spans (ambient, end at pylons, 7.5 m clearance, no host under one) and the rotor wheels.

## Where this parts from the spec or from Verdigris

- Spec section 5 says hosts are "built into" marsh machinery; the plan's names are used (`pylon-base`, `dip-pool`, `pool-pair`, `metering-shed`, `battery-bank`, `plating-works`). Six hosts means six spurs and nine near pools, not Verdigris's ten.
- The boss arena sits on the same court coordinates as Verdigris (0,-54), because the court geometry (plaza, shore of the largest pool) is the proven one. The brief did not give coordinates.
- A new landmark kind, the cable run, is data (`cables` in the JSON) rather than a landmark; it is ambient and has no collider. The pad, lamps and landing code are Ember Reach's own, as in Verdigris.
- The commendation is an addition the brief only allowed "if Verdigris touched it"; it names the first bench by id only, so it works before the quest is wired.
- Host extents are the slab each host stands on; `verify:brinewire` keeps the bodies inside it (within 0.25 m).

## What only a hand can judge

No browser was used. Unseen: whether the salt-crust ground, the bleached boards and the teal brine read as a salt marsh at the light the sky gives; the pylon lattice thickness from the walk; whether the white crust at the pool lips is too bright against the 0.9 exposure; the cable sag against the sky; whether the host dressing (dip-pool strips, battery cells, anode bars) is legible from the approach mark; the Clamp's jaws and cell levels in motion; the rotor piers' speed.

## Defects found along the way

- `verify:bench` currently reports six lines for `unit10/q2-activity` (pieces `s-zn` and `s-fe` 25.9 to 27.9 px across at the two phone-landscape viewports, under 28 px). That is the q2 builder's table, not the world; every Brinewire host line in `verify:bench` is green.
- The built flags in `brinewire.json` go stale each time another builder lands a quest. Rerun the generator last.
