# Learn track — worlds, quests, and how to build them

**Status: ten worlds charted, world 1 quest 1 built and live.**
The road, the gating, the routes, the progress store, the backend tab and the
verifier all exist. `unit01/q1-grain` — *The Grain of Things* — is playable end to
end and sets the pattern the other 38 quests follow.

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
| `src/learn/engine/scope.js` | The **sampler scope**: a canvas bench instrument. Power dial, probe, cutter, shaker. Content-free. |
| `src/learn/engine/frame.js` | The **quest frame**: stage rail, prompt, readout, answer region, miss banner, hint ladder, reward card, debrief stepper. Grading-free. |
| `src/learn/quests/_template.js` | The contract a quest game module implements. |
| `src/learn/quests/unit01/q1-grain.js` | World 1 quest 1. Content, samples and grading only. |
| `src/screens/learn.js` | The road: ten worlds with status and progress. |
| `src/screens/learn-world.js` | One world: its quests, in order. |
| `src/screens/learn-quest.js` | The host that mounts a quest module. |
| `src/styles/learn.css` | Plate styling for the three screens and the quest bench. Phone rules in `mobile-screens.css`. |
| `apps-script/Learn.gs` | `LearnProgress` DAO: stages cleared, quest completed. |
| `tools/verify-learn.mjs` | Registry integrity, the no-XP invariant, and every built quest's grading. |

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

## The engine

Two pieces, both content-free, both reusable by the next bench quest.

**`scope.js` — the sampler scope.** A canvas instrument, not a lesson. It draws a
sample of matter at a chosen magnification and knows four verbs:

- **power** (1–6). `detailFor(power, floorPower)` gives 0 solid → 1 mottled →
  2 lumps → 3 individual pieces. Past `floorPower` nothing new resolves, the
  pieces only get bigger. That walk down through scales is the whole reveal, and
  it is why this is canvas and not the 3D chamber: it runs identically on every
  graphics tier and holds up at 375 px.
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
3. Export `meta.stageCount`, and — for a table-driven quest — `STAGES`,
   `SOLUTIONS`, `MISSES` and `stateFor`, so the verifier can grade it.
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
| 01 | Tallow | Salt flats | Atoms | 3 (1 built) |
| 02 | Ligar | Basalt arches | Molecules | 4 |
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

## Next

- `unit01/q2-counting` — the mole, on the same bench. The scope already weighs
  and the crates already hold more pieces than anyone can count, so the setup is
  in place.
- Worlds 2, 5 and 9 want the 3D containment chamber rather than the scope. Decide
  whether to lift a reusable runner out of `src/quest3d/` when the second chamber
  quest needs it — not on the first.
- Consider a `field` arena instrument. Nothing has needed one yet.
