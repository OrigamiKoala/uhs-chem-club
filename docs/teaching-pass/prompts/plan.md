# Prompt: plan a world (no code changes)

For a strong model (Opus 5.5 or better). The owner's message names one or more worlds, for example "Follow `docs/teaching-pass/prompts/plan.md` for Bellows and Tallow".

You are writing the lesson plan that a smaller model will build from in a later session. The design judgement is yours; the building is theirs. Change no code. Write only into the world file(s).

## Read

1. `docs/teaching-pass/BRIEF.md` (sections 1 to 5 matter most).
2. `docs/teaching-pass/PATTERNS.md`, including the exemplar entries in Part B.
3. `docs/teaching-pass/worlds/<world>.md`.

## Do, for each world

1. Read the world as the student: `node tools/teaching-report.mjs <unit> --read`, and the fault flags without `--read`.
2. For each bench, read the quest file's `table` definitions and the painters of the fixture kinds it uses, enough to know what the student sees and what the kit can already do. A plan that needs an instrument the kit cannot draw must say so and name the cheapest route.
3. At the top of the world file's Record write the bench-level sequence: per bench, its idea, what is cut, merged, moved or added, and the terms it introduces with their glosses.
4. Write one plan row per stage (`BRIEF.md` section 3, step 2). In the Change column be specific enough to build from:
   - the question the stage asks, as the final prompt text;
   - what the student does and what responds on the bench;
   - the pattern from `PATTERNS.md` and the file it lives in;
   - the briefing or lead clip, if the stage needs one, as final text;
   - the reward, as final text.
   Hints and misses may be left to the builder unless the stage is subtle.
5. Mark each redesign S (strings and question only), M (existing instrument, new graded act or view) or L (new instrument). Keep L to the benches where nothing cheaper can show the idea, and say why.
6. List under "Open for the builder" anything you could not settle from the code.

## Hand back

Per world: the number of stages kept, reworded, redesigned (S, M, L), cut and added, and the three benches most likely to go wrong in the build.
