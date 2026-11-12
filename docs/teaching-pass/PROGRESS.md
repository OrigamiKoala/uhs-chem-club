# Teaching pass: progress

Each session updates its own world's section after every bench. A new session on a world reads its section and resumes from the first bench not marked done.

## Baseline checks (2026-11-11, before the pass)

Run singly on the tree as it stood. A failure listed here is not caused by the pass.

| Check | Result |
| --- | --- |
| `verify:learn`, `verify:table`, `verify:docs`, `verify:teaching`, `verify:bench` | pass |
| `verify:tallow`, `verify:lanternfall`, `verify:ligar`, `verify:bellows`, `verify:ember`, `verify:mirrowen`, `verify:kettle`, `verify:teeter`, `verify:verdigris`, `verify:brinewire` | pass |
| `verify:story` | **fails**: story animation `unit10/q1-halves` uses "oxidation" before the bench that introduces it. Brinewire's pass fixes it. |
| `npm run build` | not run for the baseline |

`verify:bench` takes about a minute and a half; the others a few seconds each.

## Worlds

Status values: not started, planned (plan rows written), in progress, done, played by owner.

### Ember Reach (`unit05`), exemplar

- Status: done (not yet played by the owner)
- Benches done: all eight. Cold-read review run after `q1-flow` and on the finished world; findings fixed or listed under "Still weak" in the world file.
- Checks at the end (2026-11-11): `verify:learn`, `verify:table`, `verify:ember`, `verify:teaching`, `verify:bench`, `verify:docs` and `npm run build` pass. `verify:story` fails on `unit10/q1-halves` (baseline) and `unit02/q10-wavefunctions has no story animation` (not in the baseline table, not Ember Reach).
- Not committed.
- 2026-11-12, after the owner played it: particle views reworked (no energy packets, named box per block, sample and heater as rings, stretched motion scale). Record in `worlds/unit05-ember.md`, "Particle rework". `verify:learn`, `verify:table`, `verify:ember`, `verify:teaching`, `verify:bench`, `verify:docs`, `npm run build` pass; `verify:story` fails on the same two baseline items.

### Lanternfall (`unit02`), exemplar

- Status: planned 2026-11-11 (plan rows in `worlds/unit02-lanternfall.md`; 61 stages → 63; one new fixture, `q10` stage 2; `q8` redesigned)
- Benches done:
- Stopped at:

### Ligar (`unit03`), exemplar

- Status: in progress (exemplar session, 2026-11-12)
- Benches done: `q1-joins` (6), `q2-lattice` (8), `q3-distance` (5), `q4-dots` (8), `q5-resonance` (8), `q6-shape` (10), `q7-polarity` (5). Cold-read review run on `q1-joins` and its findings applied.
- Stopped at: `q8-hybrid` next, then `q9-orbitals` (rebuild), the boss, the bank, the Tour (`tour-ligar.js`), the glossary and the world file's Record. Pre-pass quest files are in `archive/2026-11-11/ligar/*.before.js`. The unit03 lines of `WITHHELD_VOCAB` in `tools/verify-learn.mjs` were removed (kept in `withheld-vocab-removed.txt`). The world file's Record is written at the end of the session; until then the plan rows there are the plan, and the quest files' header comments say what was built.

### Mirrowen (`unit06`)

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: all eight (`q1-states` 7, `q2-grip` 8, `q3-boil` 8, `q4-solids` 5, `q5-crossing` 7, `q6-solution` 7, `q7-separate` 7, `boss-undertow` 5; 54 stages total). Cold-read review run after `q1-states` and on the finished world; findings fixed or listed under "Still weak" in `worlds/unit06-mirrowen.md`.
- Stopped at:

### Brinewire (`unit10`)

- Status: planned 2026-11-11 (`worlds/unit10-brinewire.md`; 53 → 50)
- Benches done:
- Stopped at:

### Verdigris (`unit09`)

- Status: planned 2026-11-11 (`worlds/unit09-verdigris.md`; 69 → 65)
- Benches done:
- Stopped at:

### Teeter (`unit08`)

- Status: planned 2026-11-11 (`worlds/unit08-teeter.md`; 69 → 56; letter reactions replaced by real ones)
- Benches done:
- Stopped at:

### Bellows (`unit04`)

- Status: planned 2026-11-11 (`worlds/unit04-bellows.md`; 49 → 40)
- Benches done:
- Stopped at:

### Tallow (`unit01`)

- Status: planned 2026-11-11 (`worlds/unit01-tallow.md`; 55 → 47)
- Benches done:
- Stopped at:

### Kettle (`unit07`)

- Status: planned 2026-11-11 (`worlds/unit07-kettle.md`; 75 → 64; `q1-recipe` removed, boss rebuilt to five phases)
- Benches done:
- Stopped at:

### Plan session (2026-11-11 to 2026-11-12)

One session followed `prompts/plan.md` for the nine live worlds not yet passed, and wrote first-build plans for the four unbuilt worlds. No code changed and no check was needed for the plans themselves; `verify:docs` was run afterwards and passes; no other check was run.

- If every plan is built as written, the ten live worlds hold 552 stages (605 now): Tallow 47, Lanternfall 63, Ligar 71, Bellows 40, Ember Reach 42, Mirrowen 54, Kettle 64, Teeter 56, Verdigris 65, Brinewire 50.
- New fixtures (L) in the live worlds: the wavefunction strip (Lanternfall `q10`) and the overlap track (Ligar `q9`). Both need the sign of an orbital along a line from `orbitals.js`; build that helper once.
- A builder checks each plan row against the bench before building it (`BRIEF.md` section 3, step 2). Each world file lists what the plan could not settle under "Open for the builder".

### Unbuilt worlds

Plans only; nothing is built. Each file is a lesson plan for a first build to the same standard.

| World | File | Benches | Stages | New fixtures |
| --- | --- | --- | --- | --- |
| Quicklight (`unit11`, kinetics, AP Unit 5) | `worlds/unit11-quicklight.md` | 6 and a boss | 35 and 5 phases | initial-rates log; three-key plotter |
| Lodestone (`unit12`, transition metals) | `worlds/unit12-lodestone.md` | 4 and a boss | 22 and 5 phases | crystal-field view |
| Thornmere (`unit13`, organic chemistry) | `worlds/unit13-thornmere.md` | 5 and a boss | 28 and 5 phases | mirror |
| Cinder Halo (`unit14`, nuclear chemistry) | `worlds/unit14-cinder-halo.md` | 4 and a boss | 24 and 5 phases | counter and shields; chain view |

Open question for the owner: `docs/plans/world-plans.md` lists Lodestone as "Thermodynamics & Entropy"; its chart file and stage list say transition metals. The plan follows the chart.

### Close-out

- Status: not started
