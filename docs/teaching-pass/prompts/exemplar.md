# Prompt: exemplar world pass

For a strong model (Opus 5.5 or better, high effort). The owner's message names the world, for example "Follow `docs/teaching-pass/prompts/exemplar.md` for Ember Reach".

You are doing the final teaching pass of one Learn world of Avalon, and your world is also the worked example that seven later sessions on a smaller model will copy. Two things follow. The world must actually teach when you finish, because nobody will edit it again. And each redesign you make must be written down as a pattern another session can copy without reading your world.

Do the whole job in one run. Do not stop to ask what is next.

## Read, in this order

1. `docs/teaching-pass/BRIEF.md`: the standard, the owner's decisions, the method, the rules. Follow it throughout.
2. `docs/teaching-pass/PATTERNS.md`.
3. `docs/teaching-pass/worlds/<your world>.md`: facts, what is known to be wrong, bench notes, traps.
4. `docs/teaching-pass/PROGRESS.md`: baseline check results, and where a previous session on this world stopped, if one did. Resume from there.

## Do

1. Read the whole world once as the student (`node tools/teaching-report.mjs <unit> --read`), then write the bench-level sequence at the top of the world file's Record: per bench, the idea it teaches, what is cut, merged, moved or added, and the terms it introduces. Settle cross-bench order here.
2. Work bench by bench as `BRIEF.md` section 3 says: plan rows, lesson, strings, dependents, checks, record.
3. After each bench, add to `PATTERNS.md` Part B an entry for each redesign of a kind not already there. Cover as many of the ten fault types listed there as your world contains. Point to file and function names; no pasted code.
4. Prefer reusable helpers to per-stage code. When you add a route to shared engine or kit code (a new gesture, a briefing on ordinary stages, a worked case before a typed stage), build it so any kit can use it, add it to `PATTERNS.md` Part A, and list it under "For close-out".
5. After the first bench and again when the world is finished, run the cold-read review: start a subagent with the text of `docs/teaching-pass/prompts/review.md` and the unit and quest (or whole unit) to read. Fix what it finds or list it under "Still weak". After the first bench, apply what it taught you to the rest.
6. Run the end-of-world checks (`BRIEF.md` section 8) and finish the world file as section 10 says.

## Hand back

A short message: what changed in structure, the patterns added, check results (yours and baseline apart), the "Still weak" list, and the stages the owner should play first.
