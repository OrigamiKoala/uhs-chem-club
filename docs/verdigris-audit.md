# Verdigris (`unit09`) audit

Date: 2026-11-05. **Honest status: no stage of any bench or the boss was played by a hand with real gestures, and nothing was seen at 3D On or at 375 px by a person or an agent.** The evidence labels below are Bench (`verify:bench` solved the stage by real pointer paths, by drag and by two taps, at seven viewports in the built world), Scripted (`verify:learn`/`verify:table` replayed the `SOLUTIONS` and `MISSES` scripts through the real action path) and Code (read only). The columns Operable, Intuitive, Busywork, Builds intuition and Accurate are **not rated here**, because rating them needs play. Accurate is the exception: every number a stage grades is recomputed in `tools/lib/verdigris-*-checks.mjs` and `verdigris-data-checks.mjs` against values worked by hand or by numpy (Scripted/Code).

## Per-stage table

| Bench | Stage | Title | AP topic | Evidence | Operable / Intuitive / Busywork / Intuition |
| --- | --- | --- | --- | --- | --- |
| q1-handover | 1 | Where the Hydrogen Goes | 8.1 | Bench, Scripted | not played |
| q1-handover | 2 | Ammonia in Water (predict) | 8.1 | Bench, Scripted | not played |
| q1-handover | 3 | Ammonia Acts | 8.1 | Bench, Scripted | not played |
| q1-handover | 4 | What Is Left | 8.1 | Bench, Scripted | not played |
| q1-handover | 5 | Two Ways Round | 8.1 | Bench, Scripted | not played |
| q1-handover | 6 | Ions in Pure Water | 8.1 | Bench, Scripted | not played |
| q1-handover | 7 | Without a Proton | 8.1 | Bench, Scripted | not played |
| q1-handover | 8 | Pairs in Reactions | 8.1 | Bench, Scripted | not played |
| q2-scale | 1 | Reading the Steps | 8.1, 8.2 | Bench, Scripted | not played |
| q2-scale | 2 | Between the Flasks | 8.1, 8.2 | Bench, Scripted | not played |
| q2-scale | 3 | Two Meters | 8.1, 8.2 | Bench, Scripted | not played |
| q2-scale | 4 | Two Hydroxides Each | 8.1, 8.2 | Bench, Scripted | not played |
| q2-scale | 5 | Diluting Again and Again | 8.1, 8.2 | Bench, Scripted | not played |
| q2-scale | 6 | Warm Water (predict) | 8.1, 8.2 | Bench, Scripted | not played |
| q2-scale | 7 | Warming the Water | 8.1, 8.2 | Bench, Scripted | not played |
| q2-scale | 8 | Sealed Flask | 8.1, 8.2 | Bench, Scripted | not played |
| q3-weak | 1 | Same Reading? (predict) | 8.3 | Bench, Scripted | not played |
| q3-weak | 2 | Sorting the Flasks | 8.3 | Bench, Scripted | not played |
| q3-weak | 3 | How Much Let Go | 8.3 | Bench, Scripted | not played |
| q3-weak | 4 | The Steady Ratio | 8.3 | Bench, Scripted | not played |
| q3-weak | 5 | A Strength Between the Flasks | 8.3 | Bench, Scripted | not played |
| q3-weak | 6 | Diluting the Acid | 8.3 | Bench, Scripted | not played |
| q3-weak | 7 | The Base Constant | 8.3 | Bench, Scripted | not played |
| q3-weak | 8 | Acid and Base Together | 8.3 | Bench, Scripted | not played |
| q4-structure | 1 | Which Is Strongest? (predict) | 8.6 | Bench, Scripted | not played |
| q4-structure | 2 | Racing the Halides | 8.6 | Bench, Scripted | not played |
| q4-structure | 3 | Across a Row | 8.6 | Bench, Scripted | not played |
| q4-structure | 4 | Extra Oxygens | 8.6 | Bench, Scripted | not played |
| q4-structure | 5 | Sharing the Charge | 8.6 | Bench, Scripted | not played |
| q4-structure | 6 | Chlorine Nearby | 8.6 | Bench, Scripted | not played |
| q4-structure | 7 | Bases from Acids | 8.6 | Bench, Scripted | not played |
| q4-structure | 8 | Five Unlabelled Acids | 8.6 | Bench, Scripted | not played |
| q5-salts | 1 | Acid Used Up | 8.4 | Bench, Scripted | not played |
| q5-salts | 2 | What Will It Read? (predict) | 8.4 | Bench, Scripted | not played |
| q5-salts | 3 | Acetic Acid Used Up | 8.4 | Bench, Scripted | not played |
| q5-salts | 4 | Ammonia Used Up | 8.4 | Bench, Scripted | not played |
| q5-salts | 5 | Four Salts | 8.4 | Bench, Scripted | not played |
| q5-salts | 6 | Acid Left Over | 8.4 | Bench, Scripted | not played |
| q5-salts | 7 | A Salt Between the Flasks | 8.4 | Bench, Scripted | not played |
| q5-salts | 8 | Three Unlabelled Salts | 8.4 | Bench, Scripted | not played |
| q6-titrate | 1 | Using Up the Acid | 8.5, 8.7 | Bench, Scripted | not played |
| q6-titrate | 2 | The Next Acid (predict) | 8.5, 8.7 | Bench, Scripted | not played |
| q6-titrate | 3 | Two Acids, One Burette | 8.5, 8.7 | Bench, Scripted | not played |
| q6-titrate | 4 | Half Way | 8.5, 8.7 | Bench, Scripted | not played |
| q6-titrate | 5 | The Right Dye | 8.5, 8.7 | Bench, Scripted | not played |
| q6-titrate | 6 | More Than One Rise | 8.5, 8.7 | Bench, Scripted | not played |
| q6-titrate | 7 | How Strong Is the Acid | 8.5, 8.7 | Bench, Scripted | not played |
| q6-titrate | 8 | A Sealed Weak Acid | 8.5, 8.7 | Bench, Scripted | not played |
| q7-buffer | 1 | Which Moves More? (predict) | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q7-buffer | 2 | The Same Acid, Two Flasks | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q7-buffer | 3 | Making a Flask That Holds | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q7-buffer | 4 | Who Takes the Acid | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q7-buffer | 5 | The pH of a Mixture | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q7-buffer | 6 | Making a Target pH | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q7-buffer | 7 | Base Into the Mixture | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q7-buffer | 8 | Sealed Flasks | 8.4, 8.8, 8.9 | Bench, Scripted | not played |
| q8-capacity | 1 | Which Form? (predict) | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| q8-capacity | 2 | Reading the Strip | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| q8-capacity | 3 | An Indicator | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| q8-capacity | 4 | Two Strengths | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| q8-capacity | 5 | The Limit | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| q8-capacity | 6 | Three Ratios | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| q8-capacity | 7 | Acid on a Solid | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| q8-capacity | 8 | Choosing an Acid | 8.7, 8.10, 8.11 | Bench, Scripted | not played |
| boss-leach | 1 | Phase 1 · The Warm Flasks | 8.1 to 8.9 (re-test) | Bench, Scripted | not played |
| boss-leach | 2 | Phase 2 · The Three Acids | 8.1 to 8.9 (re-test) | Bench, Scripted | not played |
| boss-leach | 3 | Phase 3 · The Salt Vats | 8.1 to 8.9 (re-test) | Bench, Scripted | not played |
| boss-leach | 4 | Phase 4 · The Dosing Run | 8.1 to 8.9 (re-test) | Bench, Scripted | not played |
| boss-leach | 5 | Phase 5 · The Mixing Flask | 8.1 to 8.9 (re-test) | Bench, Scripted | not played |

## What is owed (only a hand can judge)

- Every stage: operability with a mouse and a finger (dials set where the pointer ends, missed grabs, two-tap twins on the new pieces: tag, chip, tile, dye card, acid card, pour key, burette dial), the 3D On look (glass flasks, windows of up to 280 spheres on a 44-unit flask), 3D Off, and 375 px landscape.
- The ten stages the builders themselves called weakest: `q1` s1 (legend names H₃O⁺) and s8 (12 chips), `q2` s3 (refusal shows both readings) and s5 (6.98 against 7.00), `q4` s3 (races read 0 or 100), `q5` s1/s3/s4 (three near-identical pour stages, a 1-in-3 dial), `q6` s4 (busiest table) and s6 (close to counting jumps), `q7` s3 (about 9 of 16 settings accepted), `q8` s2 (a verdict readable off the strip), the boss phases 3 and 4 (close to q5 s5 and q6 s5).
- Whether the typed pH, ratio and concentration figures suit a 12-year-old.
- The world: terrain, boardwalks, the Leach at 3D On, built and measured in Node only.

## Checks (2026-11-05, after the merge of world/unit08)

See the final report; the scripts are `verify:learn`, `table`, `story`, `docs`, `bench`, `verdigris`, `arena`, `voyage` and the other worlds' scripts.
