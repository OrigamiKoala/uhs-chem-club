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

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: all eleven (`q1-wave` 5, `q2-photon` 6, `q3-lines` 5, `q4-cloud` 5, `q5-numbers` 5, `q6-filling` 7, `q7-pes` 6, `q8-trends` 9, `q9-absorb` 5, `q10-wavefunctions` 5, `boss-eater` 5; 63 stages total). Cold-read review run and applied on `q1-wave` and `q2-photon`; `q3–boss` cold-read subagents timed out in `thinking` (listed under "Still weak").
- Checks at the end (2026-11-12): `verify:lanternfall`, `verify:table`, `verify:teaching`, `verify:drills`, `verify:story`, `verify:bench`, and `npm run build` pass. `verify:learn` and `verify:docs` fail only on unrelated `unit09` / `PRODUCT.md` stage count diffs from other sessions.
- Stopped at:

### Ligar (`unit03`), exemplar

- Status: done (not yet played by the owner, 2026-11-12)
- Benches done: all ten (`q1-joins` 6, `q2-lattice` 8, `q3-distance` 5, `q4-dots` 8, `q5-resonance` 8, `q6-shape` 10, `q7-polarity` 5, `q8-hybrid` 9, `q9-orbitals` 7, `boss-warden` 5; 71 stages total). Cold-read review run across `q1-joins` through `boss-warden` and findings applied; `src/learn/glossary/ligar.js` and `tour-ligar.js` updated; Record completed in `worlds/unit03-ligar.md`.

### Mirrowen (`unit06`)

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: all eight (`q1-states` 7, `q2-grip` 8, `q3-boil` 8, `q4-solids` 5, `q5-crossing` 7, `q6-solution` 7, `q7-separate` 7, `boss-undertow` 5; 54 stages total). Cold-read review run after `q1-states` and on the finished world; findings fixed or listed under "Still weak" in `worlds/unit06-mirrowen.md`.
- Stopped at:

### Brinewire (`unit10`)

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: all seven (`q1-halves` 8, `q2-activity` 8, `q3-galvanic` 8, `q4-potential` 7, `q5-load` 7, `q6-electrolysis` 7, `boss-clamp` 5; 50 stages total). Cold-read review run after `q1-halves` and on the finished world; findings fixed or listed under "Still weak" in `worlds/unit10-brinewire.md`.
- Stopped at:

### Verdigris (`unit09`)

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: all nine (`q1-handover` 7, `q2-scale` 9, `q3-weak` 8, `q4-structure` 7, `q5-salts` 7, `q6-titrate` 8, `q7-buffer` 7, `q8-capacity` 7, `boss-leach` 5; 65 stages total). Cold-read review run after `q1-handover` and on the finished world; findings fixed or listed under "Still weak" in `worlds/unit09-verdigris.md`.
- Checks at the end (2026-11-12): `verify-teaching-verdigris.mjs`, `verify:verdigris`, `verdigris-*-checks.mjs`, `verify:bench`, and `npm run build` pass; `verify:table` passes all 65 `unit09` stages (fails only on unrelated `unit08/*` WIP from another session); `verify:docs` fails only on expected `PRODUCT.md` stage count diff (recorded under "For close-out"); `verify:story` fails only on baseline `unit02/q10-wavefunctions`.
- Stopped at:

### Teeter (`unit08`)

- Status: done (2026-11-12)
- Benches done: `q1-both` (6; cold-read review run and applied), `q2-k` (7), `q3-q` (6), `q4-properties` (4), `q5-ice` (6), `q6-lean` (8), `q7-dissolve` (7), `q8-free` (7), `boss-tipper` (5) — 56 stages total; whole-world cold-read review run and applied.
- Checks: `verify:teaching` (0 failures across all 5 worlds), `verify:teeter` (`TEETER OK`), `verify:bench` (`BENCHES OK`), `verify:learn` (0 `unit08` failures; 3 unrelated `unit09` failures), `verify:table` (0 `unit08` failures; 5 unrelated `unit02/q8-trends` failures), `verify:story` (1 unrelated `unit02/q10-wavefunctions` error), `verify:docs` (needs `PRODUCT.md` total stage count update 595→569), `npm run build` (passed).

### Bellows (`unit04`)

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: all seven (`q1-knocks` 7, `q2-laws` 6, `q3-ideal` 6, `q4-mixtures` 5, `q5-speed` 7, `q6-real` 4, `boss-compressor` 5; 40 stages total). Cold-read review run after `q1-knocks` and on the whole finished world; findings fixed or listed under "Still weak" in `worlds/unit04-bellows.md`.
- Stopped at:

### Tallow (`unit01`)

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: `q1-grain` (8; cold-read review run and applied; `paintReader` updated to print mass only), `q2-core` (7; stage 8 cut and archived; `TRADE_TEXT` updated and cased samples blocked from tester), `q3-catalogue` (6; stage 1 cut and archived; stage 5 uses pre-tested reference cards; stage 6 card fixed in place), `q4-ledger` (8; briefings, labels, and prompts updated), `q5-assay` (5; cut 7 stages and archived, added stage 5 *Name the Element*, updated `mass.js` display rows and `element` card support), `q6-weigh` (8; cut old stage 6 and archived, added stage 3 *The Same Number of Atoms*, added worked cases to typed stages), `boss-hopper` (5; prompts, labels, hints, and rewards updated), `src/learn/glossary/tallow.js` created and registered, `src/learn/table/tour.js` updated. Whole-world cold-read review run and applied.
- Checks: `verify:tallow` (`TALLOW OK`), `verify:teaching` (`TEACHING (MIRROWEN) OK`), `verify:bench` (`BENCHES OK`), `verify:story` (`STORY INTEGRITY OK`), `verify:learn` (0 `unit01` failures; 4 pre-existing unrelated failures in `unit02/q10-wavefunctions`, `unit09/q2-scale`, `unit09/q3-weak`), `verify:table` (all 47 `unit01` stages `ok`), `verify:docs` (2 expected `PRODUCT.md` count mismatches for close-out), `npm run build` (passed).
- Stopped at:

### Kettle (`unit07`)

- Status: done (2026-11-12; not yet played by the owner)
- Benches done: `q1-recipe` removed (archived under `archive/2026-11-11/kettle/q1-recipe.before.js`, `site-1` removed from `host-plan.js` and `kettle.json` regenerated), `q2-names` (8; cold-read review run and applied), `q3-change` (7; stage 8 cut, stage 4 redesigned), `q4-balance` (8), `q5-ionic` (8), `q6-stoich` (8; *One Reactant Runs Out* moved from `q1` stage 4, *Weigh the Cloud* archived), `q7-titrate` (6; *Purple Base* and *The Pickling Bath* archived, stage 6 redesigned), `q8-kinds` (8; *Three Gas Jars* moved to stage 2, *The Furnace Log* cut to 5 cards), `q9-hsab` (6; *Partner Exchange* and *Sealed Foundry Reagents* archived, probe scaled, *Take Out the Lead* redesigned with `wellsFixture`), `boss-golem` (5 phases rebuilt), `src/learn/glossary/kettle.js` created. Whole-world cold-read review run and applied.
- Checks: `verify:kettle` (`KETTLE OK`), `verify:bench` (`BENCHES OK`), `verify:story` (`STORY INTEGRITY OK`), `verify:teaching` (`TEACHING (MIRROWEN) OK`), `verify:table` (`TABLETOP OK`, 0 `unit07` failures), `verify:learn` (0 `unit07` failures; 6 unrelated WIP failures in `unit01/q3-catalogue`, `unit02/q10-wavefunctions`, `unit09/q2-scale`, `unit09/q3-weak`), `verify:docs` (2 expected `PRODUCT.md` count mismatches for close-out), `npm run build` (passed).
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

- Status: done (2026-11-12) — 85 quest modules (75 benches + 10 bosses), 552 stages reconciled across `PRODUCT.md`, `CLAUDE.md`, `docs/plans/world-plans.md`, and `docs/teaching-pass/PROGRESS.md`.
