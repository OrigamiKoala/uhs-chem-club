# Quicklight (`unit11`) audit — kinetics, 2026-11-13

**Method and honest limits.** Played in the built-in browser at 3D On as a guest: the world and bench loaded, console read, and these stages watched or operated: q1 s1, s2 (real Run clicks), s3; q4 s2 (collision track), s4 (energy spread), s5 (profile). **Not played by hand:** q1 s4–s7, q2, q3, q5, q6, boss (read from the quest text, replayed by `verify:learn`/`verify:table` scripts only). Drag of cards by a real hand was not proven (the browser tool's synthetic drag ends short). Ratings below for unplayed stages are text-and-script ratings and say so.

## Blocking defects found and fixed
| Defect | Evidence | Fix |
| --- | --- | --- |
| Whole world rendered white around the bench | console: 8 `computeBoundingSphere NaN` meshes in `quicklight-roads`; `texSubImage2D` errors | roads data uses `w`, code read `width` → `r.width ?? r.w` (`src/three/quicklight.js`) |
| Ground/road/catwalk textures never built | `quicklight-textures.js` took `(size, repeat)` but callers pass `{size, seed}` and `buildMaterial` needs `{albedo,height,…}`; roughness/metalness maps had null images | rewrote the module to the shared contract (as Brinewire) |
| Vessel said `Press "undefined"` | seen on q1 s2/s3 | label read from the fixture, not props |
| Benches were flat paintings | user report; rate kit had no `dress3d` | new `table/kits/rate-3d.js` (below) |

## 3D work
`rate-3d.js` runs each flat painter against a recording context and builds solids from what it drew: a vessel's or collision track's glass window becomes a **glass tank**; its particles swim through depth and height (not on a sheet); catalyst rings are tori; speed arrows are beads laid on the track; collision spheres are enlarged. Per the owner: **graphs, plots and energy profiles stay flat on the plate** (a first build stood them up; removed). Verified on q1 s2, q4 s2. At 3D On the flat window and its particles are no longer drawn on the plate (`b.bodies`, `shapesOff`), so there is no doubled picture. Dial names now start clear of the knob (`props.dialIndent`, set by `rateTable`). Not 3D: log, plotter, profile, spread, choice plates (they are 2D graphs/tables).

## Per-stage table
Verdict key: Op = operable, Int = intuitive, Busy = busywork risk, Intu = builds intuition, Acc = accurate. "P" = played; "T" = text/scripts only.

| Stage | Played | Evidence | Verdict / action |
| --- | --- | --- | --- |
| q1 s1 predict | P | lead clip draws the curve; cards readable | ok |
| q1 s2 two vessels | P | Run clicks work; tanks show A→B colour change, curves climb; hint 3 near-answer | ok; hint 3 reworded |
| q1 s3 average rate | P | marked points on curve; typed rate | ok (worked example then new case) |
| q1 s4 slowing | T | tap a curve stretch | ok |
| q1 s5 two for one | T | miss text stated the answer ratio | miss and hint 3 reworded |
| q1 s6 three changes | T | dial + dashed baseline + sort | ok |
| q1 s7 rate of each substance (new) | T | 3 H₂ → 2 NH₃, typed, evidence-based misses | **added** (AP 5.1 quantitative) |
| q2 s1–s5 | T | log + board; s4 hint 3 gave the division | hints 3 of s4, s5 reworded; the plate-and-log stages rely on the rates log fixture, unplayed |
| q3 s1–s5 | T | s5 hint 3 gave the division | reworded |
| q3 s6 integrated law (new) | T | typed [A] at 40 s with sanity bounds in misses | **added** (AP 5.3) |
| q4 s1 | T | was "what two things must a collision have" with the theory on the cards, and used Ea unintroduced | now predict-first ("how many collisions react?") |
| q4 s2 | P | track now a glass tank, spheres merge on reaction | briefing now defines Ea first |
| q4 s3 | T | hint 3 gave the answer | reworded |
| q4 s4 | P | energy columns flat; briefing/hint 3 gave numbers | reworded |
| q4 s5 | P | tapped a "TS"-labelled peak (lookup) | **rewritten**: typed forward Ea read from the ball's energy; levels not printed |
| q4 s6 | T | worked example was the same profile as the answer; miss gave arithmetic | new worked example, evidence misses |
| q4 s7 | T | cards said "(lower barrier)" | plain Path A/B |
| q5 s1 | T | briefing was a route | now defines elementary step |
| q5 s2 | T | card text "(made in 1, used in 2)" was the answer | plain species |
| q5 s3–s5 | T | hints named the answer | reworded |
| q5 s6 pre-equilibrium | P (board) | briefing printed the final law and the question was a doubling | **rewritten**: student sets the orders on the overall rate-law board |
| q5 s7 two hills | T | tap of the highest labelled peak, hints gave both Ea | **rewritten**: typed Ea of the slow step |
| q4 s8 temperature factor (new) | T | typed ratio of two shares read from the spread dial | **added** (AP 5.5/5.6 quantitative) |
| q6 s1 | T | hints described a two-path picture the scene did not draw; distractors silly | now predict-first, hints match the preview |
| q6 s2–s5 | T | card parentheticals and hint 3s gave answers | reworded |
| boss p1–p5 | T | re-tests; hint 3s name the method | unchanged |

## AP coverage (CED unit 5)
5.1 rate (qualitative + stoichiometric typed, new); 5.2 initial rates/rate law (q2); 5.3 concentration over time (half-life, plots, new integrated-law stage); 5.4 elementary reactions; 5.5 collision model; 5.6 energy profile; 5.7–5.8 mechanisms and rate law; 5.9 steady-state/pre-equilibrium (only fast pre-equilibrium); 5.10 multistep profile; 5.11 catalysis.
**Missing:** Arrhenius equation / ln k vs 1/T and two-temperature calculation (5.6, quantitative); half-life of zero and second order; steady-state approximation; units of k for other orders as a played stage; reading ΔH sign on a profile as a quantity.

## Pass 2 (2026-11-13, later) — found and fixed
| Finding | Evidence | Fix |
| --- | --- | --- |
| Ghosted titles on every table | table2d paints `f.label` and the rate painters print the same title | `hideLabel` for rate fixtures that print their own title (`rateTable`) |
| Concentration dial hidden under the 3D tank | q2 s1 zoom with the dress hidden: knob stands where the glass box leans | dialled vessels start their window lower (16.5), tank lower (`tankK`); knob and groove visible, tap on the track moved the dial 1→2 |
| Tap-zone and surface labels hidden by an opaque slab | q6 s5 screenshot | bands are transparent films; real tap on "Catalyst surface" set the zone |
| Second-order halving markers missing | planner returned only the first halving for order 0 and 2 | planner returns successive halvings (second order doubles, zero order halves) |
| H₂/NH₃ counts not in the equation's ratio (25 : 16) | q1 s7 screenshot | counts are whole reactions (24 : 16) |
| Arrhenius picture contradicted the answer (a 12 kJ/mol spread beside a 75 kJ/mol question) | q4 s9 screenshot | new `arrplot` fixture (ln k against 1/T, two points, line) with a Tour step |
| Boss hints named methods and numbers | text | rewritten to the ladder |

Added: q3 s7 second-order half-life (halvings 20 s then 40 s); q4 s9 Arrhenius slope (typed Ea ≈ 75 kJ/mol). World is now 597 stages.

Played by hand this pass (browser, 3D On): q1 s1 (real two-tap card, real Submit), q1 s7, q2 s1 (real tap on the dial track), q3 s3, s7, q4 s8–s9 render, q5 s6 board, q6 s2, s5 (real tap on a zone), boss phase 2 (board renders). Still only scripted: q1 s4–s6, q2 s2–s5, q3 s1–s2, s4–s6, q4 s1, s3, s6–s7, q5 s1–s5, s7, q6 s3–s4, boss phases 1, 3–5. No full third pass.

## Left weak / recommended next
- Hand-play the scripted-only stages, and a real drag (not tap) of a card; the browser tool's drag ends short.
- Steady-state approximation (AP 5.9) is not covered beyond fast pre-equilibrium.
- Tank size, sphere scale and the Arrhenius stage's difficulty are owner judgements.
- Zero-order half-life is shown by the planner but no stage asks about it.

## Work log
1. Set-up as guest (guild/oath passes needed a hold; team patched into the stored guest session).
2. Found white world → fixed roads and textures.
3. Built `rate-3d.js`; owner asked 2D graphs stay flat → removed standing graphs, hill and columns.
4. Text/leak fixes across q1–q6; q4 s1, q6 s1 made predict-first; q4 s5 rewritten; two quantitative stages added (counts 592→595, PRODUCT.md and CLAUDE.md updated).
5. Checks run green: `verify:learn`, `verify:table`, `verify:story`, `verify:docs`, `verify:quicklight`, `verify:bench`, `verify:teaching`. Other worlds' scripts not re-run (only the rate kit and Quicklight files changed).
6. Pass 2: ghost titles, hidden knob, slab labels, halving markers, counts ratio, Arrhenius picture, boss hints; two stages added (595→597). All verify scripts listed above re-run green, plus lanternfall, bellows, ember, tallow.
