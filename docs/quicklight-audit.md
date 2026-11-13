# Quicklight (`unit11`) Audit — Kinetics

Built 2026-11-12 from [quicklight-world.md](plans/quicklight-world.md) on branch `world/unit11`.

## Coverage & Structure
- **AP CED Topics:** 5.1 (Reaction Rates), 5.2 (Introduction to Rate Law), 5.3 (Concentration Changes Over Time), 5.4 (Elementary Reactions), 5.5 (Collision Model), 5.6 (Reaction Energy Profile), 5.7 (Introduction to Reaction Mechanisms), 5.8 (Reaction Mechanism and Rate Law), 5.9 (Steady-State Approximation), 5.10 (Multistep Reaction Energy Profile), 5.11 (Catalysis), and 9.4 (Thermodynamic vs Kinetic Control in `q5-steps` s7 / `q4-collide` s7).
- **Benches (6 benches, 35 stages):**
  - `q1-watch` (6 stages): average/instantaneous rate, stoichiometric scaling (`-1/a Δ[A]/Δt`), and concentration/temperature/surface-area knobs.
  - `q2-law` (5 stages): initial rates table, reaction orders (0, 1, 2), rate constant `k` with units, and predicting an unrun trial.
  - `q3-time` (5 stages): constant half-life of first-order decay, integrated rate plots (`[A]`, `ln[A]`, `1/[A]` vs `t`), and `k = 0.693 / t½`.
  - `q4-collide` (7 stages): collision frequency, activation energy threshold, orientation factor, Maxwell-Boltzmann temperature shift, reaction energy profiles (`Ea` forward/reverse, `ΔH`), and kinetic vs thermodynamic control.
  - `q5-steps` (7 stages): elementary steps, intermediates, rate-determining step, molecularity, mechanism rate laws, fast pre-equilibrium, and two-step energy profiles.
  - `q6-shortcut` (5 stages): catalyzed pathway (`Ea` lowered, `ΔH` unchanged), catalyst regeneration vs intermediate consumption, and heterogeneous surface catalysis.
- **Boss (`boss-flare`, 5 phases):** re-tests rate calculation, initial-rate order deduction, half-life fraction remaining, forward activation energy from an energy profile, and mechanism matching.

## Verification Evidence
| Check | Scope | Result |
| --- | --- | --- |
| `verify:learn` | All 92 built quests, 592 stages, glossary, question bank `unit11.json` | Scripted (Node) |
| `verify:table` | Real stage grading, wrong-answer messages, hint ladders, quantity ramps | Scripted (Node) |
| `verify:story` | Story animations (`story-scenes-quicklight.js`) and `CASE_FILE` (`clue_quicklight_flare`) | Scripted (Node) |
| `verify:quicklight` | `ratedata.js` planners, `quicklight.json` layout, 6 host extents, walkability flood-fill, pooled lamps | Scripted (Node) |
| `verify:voyage` | Ship landing clearance, ramp foot, sill height on Quicklight | Scripted (Node) |
| `verify:arena` | `boss-flare` arena spot, `the flare` 3D rig (39 meshes, 3784 tris, 9.2 m, 4 armour plates, muzzle, all poses) | Scripted (Node) |
| `verify:bench` | All 6 Quicklight hosts inside `BENCH_BAY` volumes, pointer-path drag/tap at 7 viewports, `boss-flare` 3D corner foe | Scripted (Node) |
| `teaching-report.mjs unit11` | 40 stages in 7 modules: 0 vague, 0 motive, 0 operation prompt, 0 reward long, 0 hint3 move/arithmetic | Scripted (Node) |
| Browser hand play | Not run (per owner rule: no browser testing without explicit instruction) | Unverified in browser |

## Only the Owner Can Judge (Browser Play-Test List)
1. **3D Storm-Belt Feel & Exposure (`QUICKLIGHT_EXPOSURE = 1.12`):** Whether dark basalt, catwalk plates, and amber work lamps read with clear contrast at 3D On without crushing shadows or blowing out the cased instruments.
2. **Stage-by-Stage Comprehension (Ages 12–17):** Especially `q3-time` stage 3 (distinguishing linear `ln[A]` vs `1/[A]` plots), `q4-collide` stage 4 (Maxwell-Boltzmann tail above `Ea`), and `q5-steps` stage 6 (fast pre-equilibrium substitution).
3. **Typed Worked-Figure Friendly Numbers:** Whether `q1-watch` s3, `q2-law` s4–5, `q3-time` s2 & s5, `q4-collide` s6, and `boss-flare` phases 1, 3, 4 feel fair and intuitive on desktop and 375 px landscape touchscreens.
4. **Boss Flare (`the flare`) Readability:** Visual silhouette, flame pulse, armour-plate break feedback, and camera look-up framing in the storm-plaza arena.
