{world} = <fill in: Mirrowen | Kettle (benches after q1) | Teeter | Verdigris | Brinewire | Quicklight | Lodestone | Thornmere | Cinder Halo>
{key}   = <the world's folder name under src/three/: mirrowen | kettle | teeter | verdigris | brinewire | quicklight | lodestone | thornmere | cinderhalo>
{unit}  = <fill in: unit06 | unit07 | unit08 | unit09 | unit10 | unit11 | unit12 | unit13 | unit14>

# Goal

Build the whole of **{world}** in Avalon (repo: `~/chem-3d`), a browser chemistry game for students aged 12 to 17: every bench, the boss, the table kit, the story, the question bank, the walkable 3D site and every check. When you finish, the owner will play it and should find no operability bug, no unreadable or overlapping text, no answer given away, no stage that can be passed without understanding, no chemistry that is false, and no world that looks like a flat coloured copy of another. The worlds already built each needed weeks of audit and rework to get there. Every defect that audit found is written down. Your job is to not build any of them again.

**The job is twofold: each stage must teach, and the 3D site must be a real place.**

1. **Each stage must teach.** A first-time student (ages 12 to 17) meeting a topic for the first time must be able to say, after each stage, what they found out and why it is so, because of what they did and saw on the bench. Do not repeat the failure mode of earlier passes: renaming vague words, adding glossaries, adding moving particles to instruments as decorative wallpaper, or hitting numeric targets while the stage remains an ungrounded dial-turn, card-drop, or number-type with the lesson dumped into a long paragraph in the reward card after the fact. The cause must be visible on the bench while acting, and the answer must be unreachable without understanding the idea.
2. **The 3D site must be a distinct place, with benches housed inside the world.** Do not build another flat plate with machines standing on it in the open. The owner is satisfied with one world only, **Ligar** (and the Kettle site rebuild), where the land has hills, cuttings and sunk floors, and the benches are housed inside the workings, drifts and chambers. When the owner lands on {world}, before reaching the first bench they must be able to say what kind of place this is in one sentence that names no colour. They cannot see most of the benches from where they land (at most two plates in view from spawn). They walk up or down to reach them (bench ground must span at least 3 m of relief). Each bench is inside a piece of the world that fits its chemistry, with walls or rock round it and its own lamps over it.

**This is one autonomous run.** Do the whole job without stopping to ask for the next task. Stop and ask only if (a) an instruction here conflicts with `PRODUCT.md` or `CLAUDE.md`, (b) the world's row in the signature table of `docs/plans/world-distinction-plan.md` cannot be built inside engine constraints, or (c) a decision is genuinely the owner's (a change of lore, scope or teaching content). Everything else: decide, do it, log it.

**Be honest about what no agent can verify.** Agents do not open the game in a browser in this repo; the owner play-tests. You cannot see a student's confusion, the feel of a drag on a phone, or whether a room reads as cramped or majestic. Every geometric and performance claim you make must come from a Node measurement (`tools/world-shape.mjs`, `tools/perf-worlds.mjs`, `tools/perf-bench-rest.mjs`, and verify scripts). Your deliverable ends with (1) the list of stages only the owner can judge by playing, and (2) the owner's 3D viewing list of 8 to 12 places to stand, what should be in view, and what would mean failure. Do not claim more than you measured.

# Authorizations for this task

- **Commit on a branch.** Work on a new branch `world/{unit}` cut from the current branch. Commit after each phase, only your own files, with a message describing the change. **Never push.** Other agents may have uncommitted work in the tree: do not stage, revert or reformat their files.
- Do **not** run the full `npm run verify` or `npm run build` without first copying anything in `dist/` that is not build output (the owner keeps reference art in `dist/art`) out to your scratchpad: the build wipes `dist/`. Run the individual `npm run verify:<name>` scripts.
- **Never delete** code, docs or checks that were once real. Move replaced files under `archive/<date>/` (or `docs/archive/<date>/`) with a README saying what replaced them, and disconnect them from live imports. Code in `archive/` is not built or verified.
- You may use subagents for independent benches or hosts once the vertical slice is green and the kit/ground are stable, but you own integration: you play and sign off every stage and measurement yourself.

# Read first, in this order (read large files in chunks; read only what you need)

1. `PRODUCT.md`, **all of it**, and especially "Building a Learn world". Its principles are hard constraints. Section 5 is the pitfall ledger: every row is a defect that was built and fixed.
2. `docs/teaching-pass/BRIEF.md` (the pedagogical standard: the seven criteria of a stage that teaches, the text rules, and the redesign order), `docs/teaching-pass/PATTERNS.md` (redesigns to copy, with file pointers), and `docs/general-problems.md` (the engine traps ledger).
3. `docs/plans/world-distinction-plan.md`, **all of it**. Section 3 is the 3D standard you are held to, section 4 the constraints, section 6 the signature table. **{world}'s row in section 6 is your 3D brief.** If the owner edited the row, the edited row wins.
4. `docs/world-rebuild-prompt.md` (the site rebuild method: ground, hosts, atmosphere, shape checks, viewing list).
5. `CLAUDE.md` (hard rules, commands, the SCOURED PLATE aesthetic) and `docs/engineering/engine-and-worlds.md` ("Per-bench build notes" has layout traps; "Worlds, ship, voyage (3D)" lines 240 to 320 cover bay bench, lamp pool, static merging, shadow pacing, boss arenas).
6. The {world} section of `docs/plans/learn-quests.md` (content brief: quests, stage objectives, bench evidence, earned words, CED topics, typed worked-figure stages) and `docs/AP-coverage-audit.md` (what the AP expects and which topics are owed).
7. The AP Chemistry CED in `docs/ap-chemistry-course-and-exam-description.pdf` for the unit's topics. Read by page range; cite topic numbers.
8. `docs/story/bible.md` for lore, place, foes, boss encounter, and quest titles.
9. **Exemplars. Read the actual files of the reference implementations**, because copying a working pattern beats inventing one:
   - **Teaching & Benches:** Ember Reach (`src/learn/quests/unit05/`, `src/learn/table/kits/heat*.js`, `tools/verify-ember.mjs`, `tools/lib/ember-learn-checks.mjs`), Bellows (`unit04`, the gas kit), and Ligar (`unit03`, `orbitals.js`). `src/learn/quests/unit05/q3-enthalpy.js` is the cleanest single bench (predict pair, proportional ramp, typed worked figure, miss messages naming table evidence). `src/learn/quests/_template.js` is the contract. Inspect `src/learn/glossary/ember.js` and `lanternfall.js` for glossary structure.
   - **Walkable 3D World & Hosts:** Ligar (`src/three/ligar/mine-plan.js`, `mine.js`, `stations.js`, `terrain.js`, `atmosphere.js`), Kettle site rebuild (`src/three/kettle/`, `tools/gen-kettle-layout.mjs`, `tools/verify-kettle.mjs`), and the shared groundwork (`src/three/lib/workings.js`, `src/three/lib/cover.js`, `tools/lib/world-shape-checks.mjs`).
10. To find every file a world touches: `grep -rIlE "unit05|ember" src tools` (about 50 files) and `grep -rIlE "kettle" src tools`. Do the same for your world key at the end.
11. Run baseline measurements before touching anything:
    ```
    node tools/world-shape.mjs {key} ligar kettle
    node tools/perf-worlds.mjs {key} ligar kettle
    node tools/teaching-report.mjs {unit}
    ```

# Method

Build in this order. Each phase ends with its checks green and a commit. Do not start a phase until the previous one is green.

## Phase 0. Spec before code

Write `docs/plans/{world}-world.md`. It is the contract you will audit yourself against. It must contain:

1. **CED map.** Every CED topic of the unit, each assigned to a bench and a stage. A topic you cannot place is a logged gap with a reason. Topics that are calculations must have a stage where the player produces the number.
2. **Bench list in teaching order.** 6 to 9 benches and a boss. For each bench: the one idea thread, the instrument family, **the one click** (the stage whose answer contradicts a model students really hold, and what that wrong model is), the story stake (one thread of the case against the Fifth, a lead line, and the `Filed:` line the next bench picks up), `BUILDS_ON`, and the words it earns.
3. **Stage table for every stage, held to the 7 teaching standards.** 8 stages per bench (6 for a recap), each carrying a distinct idea, stage 8 normally a sealed sample, the boss five phases that re-test earlier ideas on a new case. Every stage must meet the seven teaching standards:
   - *1. The question comes first:* Prompt states what we are trying to find out before touching anything, in words a 13-year-old has (<= 25 words, no "!", no route, no operational commands like "Set marker to..." or "Type the...").
   - *2. The cause is visible while acting:* Particles, charges, energy, or bonds respond directly to student action. Moving models must NOT be decorative wallpaper; the idea must NEVER arrive for the first time in the reward card after the fact.
   - *3. The answer needs the idea:* Cannot pass by ranking black-box readouts that print the target property, dial matching, or copying hints.
   - *4. Every word known or explained where it stands:* Real terms, glossed once at first use, then used consistently. Avoid both euphemisms/ciphers ("gauge", "room", "knocks", "specks", "chips", "heap", "needle", "pot", "weight", "arms") and college textbook density ("lateral overlap of unhybridized parallel p orbitals"). Atoms have no human motives ("happy", "wants", "prefers", "trades"); replace motives with Coulombic attraction and lower energy.
   - *5. As simple as the idea allows, and no simpler:* Exactly one decision per stage; direct answer form (no entry-format decoding puzzles like "how many degrees falls short of 109.5°" or "in tenths so 0.5 is 5"); no two tasks at once ("do X, then say Y"); honest scientific limits in a clause ("for the first 18 elements", "by ordinary chemical means", "a rough guide").
   - *6. Being stuck leads to understanding, not the answer:* Exactly three one-sentence hints: 1 = where to look / which control (never a mere parts inventory); 2 = what to notice or compare; 3 = how to reason from it (method/structure; may give a needed formula or constant; NEVER the answer, the move, or the worked arithmetic). Misses name what the table shows that disagrees, without giving the answer; `kit.onMiss` replays the cause.
   - *7. Needs nothing the track has not taught:* Respect prerequisites (`BUILDS_ON`). Don't use concepts before taught (e.g. limiting reactants before balanced equations/moles; kelvin after ideal gas law; activation energy before kinetics). Maths, notation, instrument readings: taught on the bench first, or given on a plate/primer.
   - *"Never give away answers" does not mean "never explain":* Teach the idea on one case (via a brief briefing <= 2 sentences or predict lead clip on a neighbouring case), then ask the student to solve a different case!
   - **Table columns:** Briefing (at most 2 sentences, introducing tools/concept on a neighbouring case before doing); Objective (the prompt, <= 25 words, no "!", no route); **Evidence on the bench** that lets someone who does not know the answer work it out; **Everything the bench prints, and the check that none of it is the answer or the capacity or the reasoning**; Plausible wrong answers and the miss message each gets (naming what the table shows); Three hints; Reward card (1-2 short sentences, <= 40 words, confirming what was seen; never introducing the concept); Flat or 3D, and why; for numeric stages, the rung of the quantity ramp.
4. **Kit plan.** Pieces, fixtures, dials, pure planners (one function per reading, shared by drawn and built twin), and real data tables each number comes from (with a source). Reuse an existing kit wherever physics allows; extend with opt-in options only. Write a new kit only when no existing kit can show the cause. Say which Tour words each new kind of piece needs.
5. **Glossary plan.** `src/learn/glossary/{key}.js` registered in `glossary/index.js` (`QUESTS`, `TERMS` with 1-based `quest`/`stage` and one-clause `gloss`, `BANNED` stand-in regexes, `NEEDS` prerequisites with primers).
6. **The 3D site spec (from `docs/world-rebuild-prompt.md` Phase 1).** The site must be its own place and cannot copy another world's layout:
   - *6.1 The place in one sentence*, naming no colour, and a second sentence saying what a player sees in the first ten seconds after landing.
   - *6.2 The signature:* Landform, walk shape, bench housing, light. Checked against section 6 of `docs/plans/world-distinction-plan.md`: none of the first three may repeat any other world.
   - *6.3 A plan in words and coordinates:* Extent of walk, each level and height, closed high ground, drops player is kept out of, pad, spawn, route from spawn to each bench in bench order, and boss ground.
   - *6.4 A section:* Heights along main route, start to end. Bench ground must span at least 3 m of relief (or declare why the ground is flat/built and what gives the levels).
   - *6.5 One paragraph per bench room:* Quest and what it teaches; piece of the world it stands in and why that fits that chemistry; enclosure (minimum 11.2 × 11 m with 4.4 m headroom at plate, directions closed, roof covered by cover mask, lit by `LampPool`); arrival view; working machinery behind/beside the plate merged static. No two rooms alike.
   - *6.6 How it differs from each neighbour:* For each of the other eleven worlds, one line: what a player points at to tell the two apart.
   - *6.7 The far country:* Landmark per quarter of horizon that is this world's alone (`phys: 'ambient'`).
   - *6.8 Numbers to hold:* `world-shape.mjs` targets (housed count >= 2/3, ground span >= 3 m, no cloned coordinates), plates in view from spawn (at most two), triangle budget (< 900k) and draw-call budget (< 566 at T4).
   - *6.9 File inventory:* What is built, reused, and archived.
7. **Pitfall review.** Review every row of `PRODUCT.md` section 5, `docs/teaching-pass/BRIEF.md`, and `docs/world-rebuild-prompt.md`. Write "avoided by: how" for each. A row you cannot answer is an open defect: fix the design before code.

Gate: Reread the spec as a first-time 13-year-old on a phone. Cut every stage where the answer can be read off the table, found by dial-hunting, or reached by matching a printed fact. Cut crowded stages (one decision per stage). Check that no reward card carries the lesson, no model is decorative wallpaper, and the 3D site is not a flat plain with open tables.

## Phase 1. Data and pure planners

Write the pure planners and data tables first, with no UI (`src/learn/engine/` or `src/learn/table/`). Every number the player will see comes from them. Check planners in Node against hand-computed values from an independent source (paper calculation, CED, standard CRC/NIST tables); never certify a planner with the code that produced it. Chemistry must be accurate: simplify freely, say nothing false, and where a model encodes a simplification, state its limit in a clause.

## Phase 2. Vertical slice: click bench AND its 3D host room, end to end

Before building anything else, build **one bench completely**: the bench holding the central click, alongside its host room and ground in the 3D world.

Apply the **Redesign Hierarchy (lesson before words)**:
1. *Make the instrument show its cause:* Particles, charges, energy or bonds respond as the student acts and directly connect action to result.
2. *Change what is asked:* Ask the question requiring the idea (prediction on a new case, which change produces the result, direct quantity rather than an offset).
3. *Change the graded act:* Tap a particle (`hotspots`), tap a zone on the graph/vessel (`tapZones`), or drag the apparatus (`tapDrag`) rather than dialling a number already visible on the bench.
4. *Put telling before doing:* Stage briefing (<= 2 sentences) and predict lead clips (`leadFixture`) set up the question and name the idea on a neighbouring case before acting; reward card confirms in <= 40 words.
5. *Teach calculations in three steps:* (1) Concrete picture: see and compare the quantity without arithmetic; (2) Worked case in briefing: `briefing.worked` shows steps on a neighbouring case; (3) Typed new cases: on the bench past dial range, with slips as refused cards.
6. *Cut / archive:* 4 to 6 stages that teach well beat 8 padded stages. Archive cut stages to `archive/<date>/`; never reuse a stage id.

Wire everything the vertical slice needs, for real:
- The kit, quest module (`_template.js`), chart entry, glossary entry, bank entry (2 practice problems + guided worked problem), lead line, Tour steps, reward models, story animation, `SOLUTIONS` and `MISSES` scripts.
- **The 3D host room and ground foundation:**
  - Build the ground section for this bench from the pure plan module (like `ligar/mine-plan.js`).
  - The host is the room AND the bench as one object (`buildBayBench`), keeping bay envelope (`bayBoxes()`) completely empty.
  - Room dimensions: at least 11.2 × 11 m with 4.4 m of headroom at plate.
  - Roof covered with shared cover mask (`src/three/lib/cover.js`), lit by `LampPool` (no `PointLight` per fixture).
  - Doorway wide enough for player collider radius; guide route runs through doorway.
  - Machinery behind and beside plate merged static (`mergeStatic`).

Then verify and test:
- Run `verify:learn`, `verify:table`, `verify:story`, `verify:docs`, `verify:bench`. All green.
- Run `node tools/world-shape.mjs {key} ligar` to check that the host registers as housed (`R4` or better).
- **Play every stage of the bench by hand** with real gestures (drag, click then click, dials, typed answers, Submit). Fix everything found.
- Reread spec and pitfalls against what you learned. Fix patterns before copying them.

## Phase 3. The remaining benches

Build remaining benches in teaching order following the Redesign Hierarchy.
- After **each** bench: its checks green (`verify:learn`, `verify:table`, `verify:bench`), every stage played by hand, and a commit. Do not batch.
- Extend kits with opt-in options only, never global modifications.
- Update `src/learn/glossary/{key}.js`, bank entries (`src/learn/bank/{unit}.json`), and Tour steps in lockstep.
- After any shared engine or kit change, run all world scripts (`verify:tallow`, `verify:lanternfall`, `verify:ligar`, `verify:bellows`, `verify:ember`, `verify:kettle`, etc.) and `verify:bench`.

## Phase 4. The boss

- Five phases that re-test earlier benches' ideas on a new case, never introducing a new concept.
- One foe from instrument's pure planner, mapped one-to-one onto stage samples.
- Briefing per phase (`briefing: { speaker, body }`), no lead line, answer slot clear of foe's corner, miss reason on screen before foe answers, finale and arena (`boss-arena.js`, `boss-models.js`, `story-scenes-finales.js`).
- Boss arena spot must solve and stay open with boss in view (`verify:arena`).

## Phase 5. The walkable 3D world (the site rebuild method)

Build the full walkable site following `docs/world-rebuild-prompt.md`:

### 5.1 The ground
- The height field stays **ONE analytic function**. Relief comes from grades, ramps, cuttings and sunk floors, spanning at least 3 m of elevation across benches.
- **One floor only:** No walkable ground above walkable ground. A deck or roof overhead is a body.
- Write the pure plan module first (no THREE, e.g. `src/three/{key}/site-plan.js`), declaring ground heights, room volumes, doorways, colliders, cover boxes, and terrain holes.
- Layout generator `tools/gen-{key}-layout.mjs` is deterministic and seeded. Generates `src/three/world-data/{key}.json`, `t2` still cameras, and `t1` data. Site ids, `questId`, `label`, `stage` do not change.
- Close high ground, ledges, water, and drops with colliders. Prove by flood fill from spawn that every bench approach is reachable, no cell drops off a ledge, and player cannot walk onto roofs or water.
- Landing pad, spawn, voyage landing solution (`verify:voyage`), and boss arena spot (`verify:arena`) all solve.

### 5.2 The remaining hosts
- Build hosts in bench order. No two rooms alike.
- Each host is room AND bench as one object (`buildBayBench`); bay envelope stays empty; nothing added to `tools/bay-legacy.json`.
- Hold minimum room size (11.2 × 11 m with 4.4 m headroom at plate).
- Roofed spaces covered by cover mask; lit by `LampPool` with fixed light count.
- Wide doorways; machinery behind and beside plates built from real sections, merged static.

### 5.3 The place itself
- **Ground surface:** Custom shader/texturing reflecting geology and walked routes. Steep cuts reveal stratigraphic section.
- **Plant and props:** Placed because the workings need them; no scatter creep (no purposeless crates/barrels filling gaps). No instructional signs stand in any world.
- **Far country:** Distinct landmarks in all four quarters of horizon (`phys: 'ambient'`).
- **Movement:** Moving parts (steam, water, machinery) marked `noMerge` or `mover` and counted in `perf-worlds.mjs`.
- **Light:** SCOURED PLATE aesthetic. Filament light, no LED bloom, no neon glow, no cyan, no `backdrop-filter` over canvas. Opaque materials never set `depthWrite: false`.

### 5.4 Checks that hold the new shape
- Write `tools/verify-{key}.mjs` using `tools/lib/world-shape-checks.mjs`:
  - Bench ground span >= 3 m (or declared exception)
  - Housed count >= 2/3 of benches
  - No bench coordinates shared with another world
  - Not one circle, not two columns
  - At most two plates in view from spawn
  - Single floor
  - Overlap tolerance 0.06 m (`tools/lib/overlap.mjs`), buried bodies, flood fill reachability, lamps-only-lit, bay clearance (`verify:bench`), arena spot.
- Budget: at most 900k triangles and 566 draws at T4 via `node tools/perf-worlds.mjs {key} ligar`.

## Phase 6. Player-facing lists and integration

- Register glossary in `src/learn/glossary/index.js`.
- Update Field Manual, galaxy map, commendations, requisitions, saga, and learn styles.
- Reconcile counts: facts line and counts sentence in `PRODUCT.md`, `CLAUDE.md`, stage counts in each chart and meta, stage indices in check files (`NOTES` and `LEAKS` keys). `verify:docs` must be green.

## Phase 7. Whole-world audit by hand & cold-read review

Play **every stage of every bench and the boss**, in order, as a first-time student who does not know the answer, with real gestures (drag, two-tap twin, dials, typed figures, Calc button, Submit), never only `window.__R.act`. Set up via `PRODUCT.md` section 6 (`session.startGuest()`, `markLearnQuestComplete`, `loadStage(i)`).

Record in `docs/{world}-audit.md` (per-stage table): Operable, Intuitive, Busywork, Builds intuition, Accurate, AP topic, and evidence label (Played, Viewed, Scripted, Bench, Code).

Audit checks:
1. **Renders and reads at default camera:** No black bench, no overlapping text, no readout hidden under knobs, posts, rims, or bezels. Clean console.
2. **Real hand can operate:** Every drag has a two-tap twin; tools dropped on cards join; missed grab does not swing camera; dials land on intended step.
3. **Answer is not given:** Read every plate, prompt, hint, readout, tray name, and reward. None prints the answer, capacity, or reasoning. Cannot be passed by dial-hunting or matching printed facts.
4. **Pedagogical 7 standards check:** Question comes first; cause visible while acting; answer needs idea; words earned & glossed once; one decision per stage with direct answer form; hints build understanding without leaking answer/arithmetic; prerequisites respected.
5. **Wrong answers speak:** Make plausible mistakes; refusal names what table evidence disagrees.
6. **Tool guidance on the object:** Captions and Tour explain tools without needing hints.
7. **Viewports & 3D Off:** Check 375 px wide landscape viewport (`resize_window`) and `3D Off` on at least one stage per bench.
8. **Cold-read review:** Run `node tools/teaching-report.mjs {unit} --read` to read the entire world as plain text in play order, ensuring tone, grammar, clarity, and concept progression are sound.

Repeat until a pass finds no blocking or major defects.

## Phase 8. Close out

- Run each script independently:
  `npm run verify:learn`
  `npm run verify:table`
  `npm run verify:story`
  `npm run verify:docs`
  `npm run verify:drills`
  `npm run verify:sync`
  `npm run verify:run`
  `npm run verify:bench`
  `npm run verify:arena`
  `npm run verify:voyage`
  `npm run verify:teaching`
  `npm run verify:{key}`
  and all other world scripts (`verify:tallow`, `verify:lanternfall`, `verify:ligar`, `verify:bellows`, `verify:ember`, `verify:mirrowen`, `verify:kettle`, `verify:teeter`, `verify:verdigris`, `verify:brinewire`, `verify:quicklight`, `verify:lodestone`). All green.
- Measure shape and performance, recording before and after:
  ```
  node tools/world-shape.mjs {key} ligar kettle
  node tools/perf-worlds.mjs {key} ligar kettle
  node tools/perf-bench-rest.mjs
  ```
- Update documentation:
  - Fill {world}'s row in section 9 and correct row in section 6 of `docs/plans/world-distinction-plan.md`.
  - Update `PRODUCT.md` (facts line, counts sentence, status table, new pitfalls in section 5).
  - Update `CLAUDE.md` (counts or new mechanics/traps only; keep short).
  - Update `docs/AP-coverage-audit.md` and `docs/plans/learn-quests.md`.
  - Finish build record in `docs/plans/{world}-world.md` (what was built, where it parted from spec, measurements, archived files).
- Prepare deliverables:
  - **The owner's 3D viewing list:** 8 to 12 entries detailing where to stand (e.g. spawn, or "at Bench 3's plate, facing doorway"), what should be in view, and what would mean failure.
  - **Stages only the owner can judge by playing:** Short list of stages involving subtle confusion, pacing, phone legibility, or whether typed figures suit a 12-year-old.

# Rules you must not break

(Full list in `PRODUCT.md` and `CLAUDE.md`. These are broken most often.)

### Teaching & Pedagogy Rules
- The Learn track pays no XP, writes no progress to server, and never reaches Standings. No `session.addXp`, `api.gradeStage`, `api.completeQuest`, or `session.recordProgress`.
- Prompt: One sentence, <= 25 words, no "!", states what to find out before touching anything, objective not route, no entry puzzles.
- Briefing: At most two sentences, introduces tools/concept on neighbouring case before doing. Ordinary table stages use `briefing: { speaker, body }` as the first Tour step.
- Hints: Exactly three, one sentence each (1: where to look / control; 2: what to notice/compare; 3: how to reason; never the answer, move, or arithmetic).
- Reward: 1 to 2 short sentences, <= 40 words, confirms what was seen; never introduces concept or carries the lesson.
- Lead line: At most 20 words, one per bench, none on a boss.
- "Never give away answers" does not mean "never explain": teach on one case, ask on a different case.
- Cause visible on bench: Moving models cannot be decorative wallpaper. Particles, charges, energy, or bonds respond to student action.
- Avoid black-box instruments that print the answer property directly for ranking.
- Register: Readable by a 13-year-old on first pass. No ciphers/euphemisms ("gauge", "room", "knocks", "specks", "chips", "needle") and no college textbook jargon ("lateral overlap"). No anthropomorphic atom motives ("happy", "wants", "prefers", "trades").
- Direct answer forms: No entry-format decoding puzzles.
- Calculations grounded: (1) See/compare without math -> (2) Worked case in briefing (`briefing.worked`) -> (3) Typed new case past dial range. No pure worksheet / plate-and-type stages.
- Predictions: Commit on a stripped table before revealing runnable instruments; never graded; predict stages show no instrument (except lead clips); next stage quotes locked guess.
- Words earned: Term glossed once in plain clause, then used consistently. Every world registers a glossary in `src/learn/glossary/{key}.js`.
- Beyond-exam content: Can stay and is held to standard, but never say "beyond the exam" in titles or text. Must be followable by a 13-year-old.

### Table & Engine Rules
- Every drag has a two-tap twin. Snaps are physics, never gatekeepers. Undo and Start Over work.
- Every fixture and tool has a Tour step in earned words.
- What is drawn is what is graded; `3D Off` draws the same picture.
- Every stage provides the `Calc` button.
- Painters are pure functions of state and `b.clock`; never write to fixture props (`verify:table` builds twice).
- Phone size floors: Tables must fit within area bounds (`verify:table` at 340 px wide, `verify:bench` at 812 × 375, every piece >= 28 px). Never enlarge table bounds to fit pieces.
- Practice problems live in `src/learn/bank/{unit}.json` (two per bench + guided worked problem); never in quest files.
- Story animations: 3 to 5 beats, a `Filed:` line, every number counted from drawn thing.

### 3D World & Site Rules
- **One height field, one floor.** No walkable ground above walkable ground. High ground and drops closed by colliders and proven by flood fill.
- **Relief:** Bench ground spans at least 3 m of elevation (or declared exception in spec).
- **Housed benches:** At least 2/3 of benches housed in rooms with roofs and >= 4 of 8 directions closed.
- **Room dimensions:** At least 11.2 × 11 m with 4.4 m of headroom at plate. Bay envelope (`bayBoxes()`) stays completely empty.
- **Lighting & Cover:** Only lamps are lit, pooled in `LampPool` with fixed light count. Roofed rooms covered by shared cover mask (`src/three/lib/cover.js`). No `PointLight` per fixture.
- **No cloned layouts:** Signature repeats no other world's landform, walk shape, or housing. At most two plates in view from spawn.
- **Physical honesty & aesthetics:** SCOURED PLATE. Filament light, no glow/bloom/neon/cyan. No signs or UI advertising in the 3D world.
- **Props & Budgets:** No scatter creep. Static props merged (`mergeStatic`); moving parts `noMerge`/`mover`. At most 900k triangles and 566 draw calls at T4 (`perf-worlds.mjs`). No `backdrop-filter`. Opaque materials never set `depthWrite: false`.

# Pitfalls that cost the most (details: `PRODUCT.md` section 5)

### Pedagogy Pitfalls
- **Idea arrives in reward card:** Stage is an ungrounded dial/sort and reward explains what it meant in > 40 words. Bench must show cause while acting; briefing sets up question; reward confirms in <= 40 words.
- **Moving model as decorative wallpaper:** Particles moving beside an ungrounded dial without carrying cause. Model must be what student acts on or directly connects action to result.
- **Black box printing the target property:** Probes outputting electronegativity difference, lattice heat, or formal charge, turning stage into number comparison. Connect reading to physical cause.
- **Worksheet / plate-and-type stages:** Pure numbers on plates with no instrument and formula-drop hints. Ground in an instrument; teach calculation via quantity ramp.
- **Two bad voices:** Euphemisms/ciphers ("gauge", "room", "knocks", "specks") vs dense textbook prose ("lateral overlap"). Plain real terms readable by a 13-year-old.
- **Anthropomorphic motives:** "Atoms want an octet", "happy", "prefers". Atoms want nothing; use Coulombic attraction and lower energy.
- **Convoluted answer forms:** Puzzles about entry format ("degrees short of 109.5°"). Ask for quantity directly.
- **Hint leaks:** Rung 1 as parts inventory; rung 3 giving away arithmetic or answer. Rung 1 = where to look; Rung 2 = what to compare; Rung 3 = how to reason.
- **Measuring counts instead of teaching:** Meeting stage counts or clearing regex flags while stage remains ungrounded. Stage is done only when it has honest Evidence on bench.
- **Broken grammar from mechanical renames:** Running regex replacements without reading resulting sentences.

### 3D World Pitfalls
- **Re-skinning:** Changing palette and props while height field inside walk varies by < 1 m. Landform must do the work.
- **A shed is not a place:** Four-walled standalone hut on a plain around each bench. Room must be part of the geology or large working machinery.
- **Eight rooms that are one room:** Copying first host seven times with different props.
- **Cramped room:** Walls placed just outside bay envelope pass checks but crush lean-in camera against a wall. Hold minimum 11.2 × 11 × 4.4 m dimensions.
- **Bright room:** Roof with no cover mask is fully lit by sky on mobile devices lacking shadow maps.
- **The lost bench:** Hidden bench with no lamp lane or guide route through doorway.
- **Two floors:** Bridges/mezzanines walked both on and under. Engine supports one floor only.
- **Light per lamp:** Adding `PointLight` per fixture recompiles materials and blows draw/perf limits. Use `LampPool`.
- **Scatter creep:** Filling empty ground with heaps and crates because plan view looked bare. Clean shaped ground is better than clutter.
- **Changing shared code for one world:** Breaking another world's layout. Always make shared options opt-in and verify all worlds.
- **Claiming a look:** Writing that a room looks magnificent when you cannot see it. Report measurements and viewing list.

# Definition of done

You are done only when **all** hold, and your final report says which you verified and how:

1. Every check in Phase 8 is green (or each failure logged with proof it is not yours).
2. Every stage meets the 7 teaching standards: has a written idea, honest Evidence on bench that is not the reward card, and no open fault against `docs/teaching-pass/BRIEF.md`.
3. Every stage of every bench and boss was played by hand with real gestures at least once, and recorded in `docs/{world}-audit.md`.
4. `node tools/world-shape.mjs` shows no cloned coordinates, bench ground relief spanning >= 3 m (or declared exception), and at least 2/3 of benches housed.
5. Triangles (< 900k) and draw calls (< 566) within budget via `perf-worlds.mjs`.
6. Every row of `PRODUCT.md` section 5 was reviewed against this world.
7. `3D Off` and 375 px landscape viewport checked on at least one stage per bench.
8. Docs, counts, AP audit, and distinction plan progress row updated; build record written in `docs/plans/{world}-world.md`.
9. Everything committed on `world/{unit}`, nothing pushed, and working tree clean.

# Final report

Reply with:
- **What was built:** Benches, stage counts, kit, boss, and the 3D world site.
- **The 3D place & signature:** Place in one sentence (no colour), landform, walk shape, bench housing, light, and how it differs from neighbours.
- **Measurements:** Before and after rows from `node tools/world-shape.mjs` and `node tools/perf-worlds.mjs`.
- **CED topics covered:** And any gaps with reasons.
- **Shared code touched:** Options added and worlds re-tested.
- **Checks run:** Every check and exact status.
- **Play-test record:** What you played by hand and defects fixed along the way.
- **Owner's 3D viewing list:** 8 to 12 places to stand, what should be seen, and failure conditions.
- **Stages only the owner can judge by playing:** Short list of subjective judgements (confusion, pacing, phone feel, typed figures).
- Plain statement that nothing was seen in a browser.