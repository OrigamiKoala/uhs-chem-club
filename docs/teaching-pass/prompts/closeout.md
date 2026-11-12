# Prompt: close-out

For Sonnet 5.5 at medium effort, once, after every world pass is finished. The owner's message: "Follow `docs/teaching-pass/prompts/closeout.md`".

Each world session left its count changes, shared-code changes, doctrine changes and engine lessons under "For close-out" in `docs/teaching-pass/worlds/<world>.md`. You reconcile the shared files from those sections. Do not redo any teaching work and do not read the plan rows.

1. Read `docs/teaching-pass/PROGRESS.md` and the "For close-out", "Still weak" and "For the owner to look at" sections of each of the ten world files (grep for the headings; do not read the files whole).
2. Counts: `node tools/teaching-report.mjs all --totals` gives stages and modules per world. Bring these into line: the `facts` comment and prose counts in `PRODUCT.md`, the table and bench lists in `docs/plans/world-plans.md`, per-world notes in `docs/engineering/engine-and-worlds.md`, `docs/AP-coverage-audit.md` where a stage or quest was cut, moved or added, and any count in `CLAUDE.md`.
3. Doctrine: fold agreed changes into `CLAUDE.md` (Teaching Doctrine) once, in its existing terse style. Add engine lessons to `docs/general-problems.md` under a "Lessons from the final pass (2026-11)" heading, one line each.
4. Shared code: for each shared-code change the worlds listed, confirm it is still present and that no later world undid it (`git log -p --follow` on the file, or read the function).
5. Run every check singly and list results: `npm run verify:learn`, `verify:table`, `verify:story`, `verify:docs`, `verify:teaching`, `verify:bench`, each `verify:<world>`, then `npm run build` (move `dist/art` out first if it exists, and back after). Fix failures that come from counts or docs. For a failure inside a world's lesson code, fix it only if it is a stale index or count; otherwise report it with the world and the failing line.
6. Write `docs/teaching-pass/FINAL.md`: per world, the structural changes in two lines, then one merged "Still weak" list and one merged "For the owner to look at" list, each ordered by how likely a student is to get lost. Mark `PROGRESS.md` complete.

Hand back the check results and the path to `FINAL.md`.
