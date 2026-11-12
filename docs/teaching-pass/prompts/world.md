# Prompt: world pass

For Sonnet 5.5 at medium effort. The owner's message names the world, for example "Follow `docs/teaching-pass/prompts/world.md` for Bellows".

You are doing the final teaching pass of one Learn world of Avalon. Nobody will edit this world after you, so a stage you leave weak stays weak. Do the whole job in one run. Do not stop to ask what is next.

## Read, in this order

1. `docs/teaching-pass/BRIEF.md`: the standard, the owner's decisions, the method, the rules. Follow it throughout.
2. `docs/teaching-pass/PATTERNS.md`: the redesigns to copy, with file pointers. Open an exemplar file only for the pattern you are about to use.
3. `docs/teaching-pass/worlds/<your world>.md`: facts, known faults, bench notes, traps, and the plan rows if a plan session wrote them.
4. `docs/teaching-pass/PROGRESS.md`: baseline check results, and where a previous session on this world stopped, if one did. Resume from there; do not redo finished benches.

## Do

1. If the world file has no bench-level sequence yet, read the world once as the student (`node tools/teaching-report.mjs <unit> --read`) and write it at the top of the Record: per bench, its idea, what is cut, merged, moved or added, and the terms it introduces. If a plan is already there, follow it; where the code shows a plan row cannot be built as written, build the nearest thing that keeps the row's Idea and Evidence, and note the difference.
2. Work bench by bench as `BRIEF.md` section 3 says. One bench at a time, finished and recorded before the next.
3. After the first bench, run the cold-read review on it: start a subagent with the text of `docs/teaching-pass/prompts/review.md` and your unit and quest. Fix what it finds, and apply what it taught you to every later bench.
4. When every bench and the boss are done, run the cold-read review on the whole unit. Fix each finding or list it under "Still weak" with the reason.
5. Run the end-of-world checks (`BRIEF.md` section 8) and finish the world file as section 10 says.

## Three things that decide whether this pass works

- A stage is not fixed by better wording if the student still only reads a number and ranks it, matches a dial, or types a figure off a plate. Change what they do or what they are asked.
- The reward card confirms; it never teaches. If you need the reward to explain, put the explanation in a briefing before the stage, on a neighbouring case.
- Copy a pattern before inventing one. Invent only when `PATTERNS.md` has nothing for the fault.

## Hand back

A short message: what changed in structure, check results (yours and baseline apart), the "Still weak" list, and the stages the owner should play first.
