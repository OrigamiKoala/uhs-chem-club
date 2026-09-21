# Learn track — worlds, quests, and how to build them

**Status: ten worlds charted, nine quests built and live — all of world 1
(Tallow) and all of world 2 (Ligar).** The road, the gating, the routes, the
progress store, the backend tab and the verifier all exist. Tallow's five benches
and Ligar's four are playable end to end and set the pattern the other 32 quests
follow. Tallow is additionally walkable ground at T4; **Ligar is games only**,
with no world behind them, which is a separate pass and not a gap in the quests.

## The shape of it

```
LEARN  (#/learn)            ten worlds, walked in order
  └─ WORLD (#/learn/unit01) one course unit — quests, played in order
       └─ QUEST (#/learn/unit01/q1-grain)
            a game with its own module, built like the Charge Gardens
```

A Learn quest is **a game, not a reading**. It owns its stages, its scene, its
inputs and its grading, exactly the way `src/screens/quest.js` owns Quest 1. The
host screen only checks the gating, loads the module and records what it reports.

## The rule that outranks the rest

**The Learn track pays no XP and never appears in Standings.**
Nothing in `src/learn/` may call `session.addXp`, `api.gradeStage`,
`api.completeQuest` or `session.recordProgress` — `npm run verify:learn` fails the
build if it does. Backend rows go to the `LearnProgress` tab, which
`Scoring.computePlayerTotalXp` does not read. A study road that moved the
leaderboard would turn learning into grinding and would punish the students it
exists to help.

## Files

| File | What it is |
| --- | --- |
| `src/learn/curriculum.js` | The registry. Worlds, quests, arenas, lookups. Pure data — no DOM, no three.js. |
| `src/learn/worlds/unitNN-*.js` | One chart per unit: world name, place, one line, and its quests. |
| `src/learn/progress.js` | Gating and completion. XP-free by construction. |
| `src/learn/practice.js` | The optional problem set a WORLD ends on. Five per built quest, gathered across the unit. Gates nothing. |
| `src/learn/engine/scope.js` | The **sampler scope**: a canvas bench instrument. Power dial, probe, cutter, shaker. Content-free. |
| `src/learn/engine/corebench.js` | The **core bench**: one piece in three fields (whole, core, rings). Beam, probe, stripper. Content-free. |
| `src/learn/engine/frame.js` | The **quest frame**: stage rail, prompt, readout, answer region, miss banner, hint ladder, reward card, debrief stepper. Grading-free. |
| `src/learn/quests/_template.js` | The contract a quest game module implements. |
| `src/learn/quests/unit01/q1-grain.js` | World 1 quest 1. Content, samples and grading only. |
| `src/learn/quests/unit01/q2-core.js` | World 1 quest 2. Content, specimens and grading only. |
| `src/screens/learn.js` | The road: ten worlds with status and progress. |
| `src/screens/learn-world.js` | One world: its quests, in order. |
| `src/screens/learn-quest.js` | The host that mounts a quest module. |
| `src/styles/learn.css` | Plate styling for the three screens and the quest bench. Phone rules in `mobile-screens.css`. |
| `apps-script/Learn.gs` | `LearnProgress` DAO: stages cleared, quest completed. |
| `tools/verify-learn.mjs` | Registry integrity, the no-XP invariant, every built quest's grading, and its five practice problems. |
| `tools/verify-bench.mjs` | Deploys both built instruments onto the real Tallow benches in Node: every site faces its approach, every screen and control lands inside the glass. |

## Gating

- World 1 is always open; world N opens when world N-1 is complete.
- Inside a world, quest 1 is open; quest N opens when quest N-1 is complete.
- A world or quest with nothing built is **charted** and never opens. Charted
  entries are transparent to the road — an unbuilt world between two built ones
  does not seal the way forward, or world 2 would wait on the whole curriculum.
- A world's `status` is **derived**, never declared: it is live exactly when at
  least one of its quests has a module.
- A cleared stage can be walked back into from the stage rail. There is no XP
  here for a replay to farm, and re-reading is the point of a study road.
- **The practice set gates nothing.** A world's problems are offered once, after
  its last bench is worked, and the next world is already open by then — gating
  is `worldProgress`, which knows nothing about practice. Skip every question and
  the road is identical.

## The engine

Two pieces, both content-free, both reusable by the next bench quest.

**`scope.js` — the sampler scope.** A canvas instrument, not a lesson. It draws a
sample of matter at a chosen magnification and knows four verbs:

- **power** (1–6). `detailFor(power, floorPower)` gives 0 solid → 1 mottled →
  2 lumps → 3 individual pieces. Past `floorPower` nothing new resolves, the
  pieces only get bigger. That walk down through scales is the whole reveal, and
  it is the whole reveal. At T3 and below it runs on canvas and holds up at
  375 px; at T4 the same declarations build the instrument on the bench the
  player walked to (`scope3d.js`), with the crates in real wells and the power
  control a milled cap they reach over and turn.
- **probe** — tap a piece for its catalogue code, a 0–10 mass meter, a 0–10 size
  meter, how many pieces are holding it, and one plain sentence. It reports the
  *count* of neighbours and never their kinds, so counting a cluster stays work.
- **cutter** — loose heaps scatter, bound clusters come apart into members, a
  lone piece does not move.
- **shaker** — settles a sample into one band per distinct material.

Samples declare `particles: [{ kinds: [...], n }]`, where a one-entry `kinds` is a
loose piece and a longer one is a bound cluster. The default shape is one centre
with the rest holding on to it; an entry that needs a real backbone supplies its
own `geom` and `bonds` (H–O–O–H is a chain, and drawing it as a star would be the
instrument lying about the salvage). `magnify` scales a plate holding one object.

**Every tool re-pours its sample first.** Without it, a player who ran the blade
over a crate of bound clusters and then shook it down would watch the fragments
settle into two bands and conclude the crate was mixed — punished for using both
instruments instead of one.

**`frame.js` — the chrome.** Stage rail, reopenable briefing, prompt, readout
region, answer region, Commit key, miss banner, hint ladder, reward card, debrief
stepper. It never sees an answer: the quest calls `clear()` or `miss()`. The hint
ladder is the campaign's bargain — rung 1 free, rung 2 after a miss or 45 s,
rung 3 after two misses — and costs nothing, because this track has no currency
to tax.

## Building a quest

1. Copy `src/learn/quests/_template.js` to `src/learn/quests/<worldId>/<questId>.js`.
2. Build the game. Bench quests compose `SampleScope` + `LearnFrame` and supply
   only content: kinds, samples, prompts, three hint rungs, a `check(state)` per
   stage and a reward card. Report each cleared stage with `ctx.reportStage(i)`
   and the finish with `ctx.reportComplete()`. Dispose what you created.
3. Export `meta.stageCount`, five `PRACTICE` problems, and — for a table-driven
   quest — `STAGES`, `SOLUTIONS`, `MISSES` and `stateFor`, so the verifier can
   grade it. Every stage owes a `reward` card of one to three sentences naming,
   in real chemical terms, what the player just worked out: the chemistry lands
   in bits, after each stage, never saved up for the debrief.
4. In the world chart, point the quest's `module` at
   `() => import('../quests/<worldId>/<questId>.js')` and set `status: 'live'`.
   Update `stageCount` to the real figure.
5. `npm run verify`.

Nothing else in the app needs editing: the world goes live on its own, the road
opens it in the right place, and the host loads it.

### What `verify:learn` checks about a built quest

- the module loads and exports `mount()`
- `meta.stageCount` matches the chart — the map must not lie about road length
- every stage has a title, a prompt, exactly three distinct hint rungs and a
  reward card, and no emoji anywhere a player can read
- **the intended solution grades correct**
- **a plausible wrong answer is refused, and is told why** — no silent miss
- an untouched bench never grades correct
- every bench sample is well formed: unique ids, real kinds, `geom` covering
  every piece, bonds pointing inside the cluster, and no solution naming a
  sample or a bin that is not there

## The road as charted

| # | World | Place | Unit | Quests |
| --- | --- | --- | --- | --- |
| 01 | Tallow | Salt flats | Atoms | 5 (5 built, walkable at T4) |
| 02 | Ligar | Basalt arches | Molecules | 4 (4 built, no ground) |
| 03 | Mirrowen | Tidal shelf | States of Matter | 4 |
| 04 | Kettle | Soda lake | Stoichiometry and Reactions | 4 |
| 05 | Teeter | Salt pans | Equilibrium | 4 |
| 06 | Verdigris | Acid marsh | Acids and Bases | 4 |
| 07 | Bellows | Cloud deck | Gases | 4 |
| 08 | Ember Reach | Vent fields | Thermodynamics | 4 |
| 09 | Quicklight | Storm belt | Kinetics | 4 |
| 10 | Cinder Halo | Crater sea | Nuclear Chemistry | 4 |

## World 1 quest 1 — The Grain of Things

Eight stages on a salvage bench on Tallow. The player leaves knowing what an
atom, an element, a molecule, a compound and a mixture are, and meets none of
those five words until the debrief.

**The order is the whole design.** Every stage is a thing the player *does* with
an instrument; the idea arrives afterwards as a reward card under "WHAT YOU JUST
FOUND", never as a briefing.

| # | What the player does | What it leaves them with |
| --- | --- | --- |
| 1 | turns the power up until the picture stops getting finer | there is a floor |
| 2 | finds which of two identical-looking crates is one material | one kind, or several |
| 3 | counts how many kinds are in one crate sold as single-source | sample widely; trust the scale, not the eye |
| 4 | runs a cutter over four objects | one of them will not divide |
| 5 | assembles the cluster that repeats through a vial | a bound group is a fixed recipe |
| 6 | files two vials against two manifests with the same ingredients | recipe is identity, not ingredients |
| 7 | settles three crates and reads the bands | mixed, or not |
| 8 | files a manifest of four unlabelled crates | all of it at once |

Player-facing vocabulary before the debrief: *piece, kind, cluster, crate, band,
recipe, material*. That restraint is the product, not a stylistic choice.

The scope's catalogue numbers (CAT 01, CAT 06, CAT 08, CAT 11, CAT 16, CAT 17)
are atomic numbers and are never explained here. The debrief closes by pointing at
them, which is the hook into `unit01/q3-catalogue`.

The debrief names, in order: **atom**, **element**, **molecule**, **compound**,
**mixture**, then hydrogen and oxygen, then water and the scouring agent that had
been pitting its own seal in the hold since stage 6.

## World 1 quest 2 — The Inside of a Piece

Eight stages on the **core bench** (`src/learn/engine/corebench.js`), picking up
exactly where site one's blade stopped: the object that would not divide, hit
with something much more violent than a blade. Same shape as quest 1 — the player
does something with an instrument and the idea arrives afterwards on a reward
card.

| # | What the player does | What it leaves them with |
| --- | --- | --- |
| 1 | fires a beam through one piece and reads the return counter | tiny, heavy middle; mostly empty |
| 2 | counts the marked grains in the core | two sorts of grain in there |
| 3 | reads a sealed piece at zero and works backwards | the books balance |
| 4 | places eleven light pieces onto the rings against two references | fixed distances, fixed room |
| 5 | tests two specimens with a dying cell, predicts the other two | the outermost ring decides |
| 6 | separates two specimens of identical grain count | the marked count is the identity |
| 7 | strips light pieces off until the needle reads plus two | a piece can carry a charge |
| 8 | files three unlabelled specimens against a reference | all of it at once |

Player-facing vocabulary before the debrief: *piece, core, grain, mark, ring,
light piece, specimen, needle*. The debrief names, in order: **nucleus**,
**proton**, **neutron**, **electron**, **shell**, **valence**, **ion** — with
isotope arriving alongside the neutron.

Every specimen on the bench is a real nuclide (C-12, C-13, N-13, N-14, N-15,
O-16, He-4, Li-7, Ne-20, Na-23, Cl-35) and every one of them balances: its light
pieces match its marked grains unless a stage has stripped some off. The verifier
enforces shell capacity — two closest in, eight after that, nothing further out
while a nearer ring has room — so a specimen cannot teach the rule wrong on the
very screen the rule is learned from.

**What this quest deliberately does not say.** The core bench does not talk to
the sampler scope's catalogue, and Vess says so in stage one. The player leaves
holding a proton count for a dozen specimens and no idea the scope has been
filing by exactly that number since site one. That reveal is `q3-catalogue`, and
spending it early would waste the best moment on this world.

## Next

- All five Tallow quests are live — `q3-catalogue`, `q4-ledger` and `q5-assay`
  were finished in the Tallow/Ligar pass (see `tallow-ligar-build.md`). The
  mole moved off Tallow entirely: it is Ligar `q4-weigh`'s subject.
- Worlds 2, 5 and 9 want the 3D containment chamber rather than a canvas bench.
  Decide whether to lift a reusable runner out of `src/quest3d/` when the second
  chamber quest needs it — not on the first.
- Consider a `field` arena instrument. Nothing has needed one yet.

---

## Progress — Tallow built as ground (T4)

World 01 is now a place as well as a chart. Status:

- [x] `src/three/world-data/tallow.json` — salt-flat refinery: 38 landmarks with declared
      footprints, 5 sites, a sub-level excavation, spawn, and T1/T2 parity blocks.
- [x] `src/three/tallow.js` — `TallowWorld`: bleached-overcast lighting, cracked hardpan
      terrain with the excavation cut out of the mesh, evaporator drums, cracking towers,
      pipe racks, conveyor, derelict hauler, buyer's pad, crate stacks, salt heaps, pan
      rims, the lean-to bench, the sub-level lab, the open catalogue vault, the tally
      floor and the hopper gantry.
- [x] `src/three/materials/tallow-textures.js` — procedural PBR set. Normals are derived
      from the same height field that drew each albedo (`heightToNormal`), so every bump
      registers with the crack or seam that caused it.
- [x] `src/learn/engine/bench3d.js` + `scope3d.js` + `corebench3d.js` — both Unit 1
      instruments rebuilt as physical benches, `InstancedMesh`-drawn, same API.
- [x] `src/learn/engine/instruments.js` — the tier dispatcher both quests now import.
- [x] `src/learn/engine/bench-host.js` — render dependency inverted so quest modules stay
      loadable in plain Node for `verify:learn`.
- [x] `src/learn/worlds3d.js` — the registry of walkable worlds. **One entry to add a second.**
- [x] Star Map: two tabs, Active Quests and Learn Quests.
- [x] `tools/verify-tallow.mjs`, wired into `npm run verify`.

Deliberately **not** done, and why:

- The other nine worlds have no ground, Ligar included: its four benches are built and
  playable, but the arches are not a place you can walk. Build Tallow end-to-end first and
  let what breaks inform the rest — the same order `3d-conversion-prompts.md` §6 sets out
  for Erebus.
- ~~`q3-catalogue` and `q4-counting` have sites but no content~~ — superseded:
  every charted quest now exists, every site's `built` flag is `true`, and
  sites 3–5 stand as real places (open vault, tally floor, hopper gantry)
  whose quests play as a page over the world at T4.
- Tallow is T4 only. T3 and below keep the existing Learn screens, and every quest still
  completes identically on them.

### To make a second Learn world walkable

1. Author `src/three/world-data/<world>.json` to the same schema.
2. Write its `WorldScene` beside `tallow.js`.
3. Add `enterXScene` to `stage.js` and one entry to `WORLDS_3D` in `src/learn/worlds3d.js`.
4. Extend `tools/verify-tallow.mjs` to cover it (or copy it per world).

Nothing else needs editing: the router, the star map's Learn tab, the walk HUD and the
bench dispatcher all read the registry.
