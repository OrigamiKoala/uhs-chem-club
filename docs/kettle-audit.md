# Kettle (`unit07`) — audit

Written as the world was built (2026-10-30). Evidence labels: **Played** (real pointer gestures, typed answers, Submit), **Viewed** (loaded and screenshotted), **Scripted** (a solution script replayed through the real action path, `verify:learn` / `verify:table`), **Bench** (`verify:bench` solved it by pointer path), **Code** (read only).
An agent cannot judge a student's confusion, the feel of a drag on a phone or whether a typed figure suits a 12-year-old: those are in "Only the owner can judge" at the end.
Columns: Operable · Intuitive · Busywork · Builds intuition · Accurate · AP topic. `Y` yes, `?` not established, `N` no (see the note).

## Method and set-up

**Update (owner instruction, 2026-10-30): no more browser testing.** Everything labelled Played, Viewed or `3D Off` / phone-size below was done before that instruction. From here the evidence is Scripted, Bench and Code only, and every stage not marked Played is listed for the owner to play. The hand-play phase of the build prompt is therefore not completed.

A git worktree (`../chem-3d-kettle`) was used so the Mirrowen agent's uncommitted work in the main tree stayed untouched. The dev server ran on :3033 from the worktree; Continue as Guest, Fire guild (the guild confirm is a press-and-hold), `session.markLearnQuestComplete('unit07','q1-recipe')`, hash set to the quest and reloaded,
`__LQ_TEST__` set, hash changed to another quest and back, `__R.loadStage(i)`. The synthetic browser drag ends short of its target (as `PRODUCT.md` §6 warns), so a drop was always completed with the two-tap twin; a dial drag moved the knob (to "2 g" when "4 g" was aimed at).
Hand-play also needs 10 to 40 s for the bench to build and the built twin repaints about a second after a state change (the screenshot a moment too early shows the old picture: not a defect).

## q6-stoich — How Much Is Made (the vertical slice)

| # | Stage | Operable | Intuitive | Busywork | Intuition | Accurate | AP | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Water From Hydrogen (predict) | Y | Y | Y | Y | Y | 4.5 | Viewed, Scripted | cards, slot and equation plate render; five cards in two columns |
| 2 | Weigh the Water | Y | Y | Y | Y | Y | 4.5 | **Played**, Scripted | catch jar by two taps into the pot's seat, Run, jar to the balance pan, 9.0 g read; the dial knob dragged (2 g reached); the typed answer path not played here |
| 3 | Ammonia by the Mole | Y | Y | Y | Y | Y | 4.5 | Viewed, Scripted | window: nine discs of hydrogen before, six of ammonia after (dial at 9 mol) |
| 4 | Grams to Grams | Y | Y | Y | Y | Y | 4.5 | Viewed, Scripted | 7.1 g of chlorine weighed 11.7 g of salt; the plate prints no figure equal to the answer (35.1 g) |
| 5 | What Is Left Over | Y | Y | Y | Y | Y | 4.5 | **Played** | both jars, catch jar by taps; balance 72.0 g; typed 0 refused ("The pot made 72.0 g of water from 12.0 g of hydrogen and 64.0 g of oxygen"); typed 4.0 accepted; reward card shown |
| 6 | Gas From Limestone | Y | Y | Y | Y | Y | 4.5.A.3 | Viewed, Scripted | syringe filled to 2.44 L for 10.0 g; ticks 0 to 3 L |
| 7 | What the Furnace Keeps | Y | Y | Y | Y | Y | 4.5 | Scripted | not viewed |
| 8 | Weigh the Cloud | Y | Y | Y | Y | Y | 4.5, 1.4 | Scripted | not viewed; balance prints two decimals |

**Defects found and fixed while building it**: (1) the pot's panel was a 3-unit sliver and its Run key sat on it (the engine puts the key at the fixture's bottom right: the kit now reserves a 7-unit strip); (2) the balance's title was hidden by its readout and its caption by the jar seat;
(3) `jar()` silently dropped the `pure` option, so stage 8 weighed 4.90 g instead of 4.41 g: caught by the independent weighing check in `kettle-learn-checks.mjs`; (4) two typed answers equalled a figure printed on a plate (58.5 g, the molar mass of NaCl, was both; 2.0 g of hydrogen left over matched "H₂ 2.0 g/mol"): the amounts were changed and the check now refuses any plate that prints an answer;
(5) the Tour named the dial "Fed" where it reads "Hydrogen fed"; (6) the pot's "RUN" status read like a key label and became "DONE".

## q1-recipe — The Same Recipe (built earlier; re-audited)

| # | Stage | Evidence | Notes |
| --- | --- | --- | --- |
| 1 | Three Sources, One Molecule | Scripted, Bench | the one briefing is kept |
| 2 | The Wrong Proportions | **Viewed** (four samples, two trays), Scripted | was a 50 % guess (two samples, two trays): now four samples, two to a tray; tray names "True compound" and "Not a true compound" name the possible answers (logged, acceptable only because the shaker is the evidence) |
| 3 | Weigh Before and After | Scripted, Bench | stage briefing removed (the Tour explains the scale) |
| 4 | One Heap Runs Out | Scripted, Bench | marks the heap AND sets the tally: two decisions in one stage (logged, owner to judge) |
| 5 to 8 | | Scripted, Bench | not played by hand |

## boss-golem — the Recipe Golem (3 of 5 phases so far)

| Phase | Evidence | Notes |
| --- | --- | --- |
| 1 limiting feed on heaps | Scripted, Bench | kept from the first build |
| 4 what the furnace kept | Scripted | foe corner clear (`verify:table`); numbers worked by hand in `kettle-boss-golem-checks.mjs` |
| 5 the ledger | Scripted | |

(Phases 2 and 3 land with the benches they re-test: `q4-balance` and `q3-change`.)

## Checks run by hand on q6-stoich (one stage each, not every stage)

- **`3D Off`**: stage 1 and stage 5 draw the same table on the flat canvas (the same plates, jars, pot and the balance reading 72.0 g). The lead line and "Builds on" strip show above the bench.
- **667 x 375 viewport at `3D Off`**: the page stacks and the flat bench becomes a narrow column; the balance reading and pot are legible but small, and the answer dock wraps ("SUBMIT" and "HINT" break letter by letter). This is the shared drawn-table layout, not Kettle's: not fixed here. Phone play at `3D On` was not checked.
- **Story animation** (q6, played by Next through all five lines): the four pictures stacked on one plate; earlier pictures now fade as the next arrives (second pass). Text on the plate is small at 800 px.

## Still open

- Every stage of q6 except 2, 5 and 8 was Viewed or Scripted, not Played; the dial was dragged once and stopped a step short (the synthetic drag, not a measured defect).
- The pot's built twin is the engine's default rim and keys: no `dress3d` solid for the pot, jars or balance yet. The flat picture is complete.
- The hand-play evidence for the other benches is in their sections as they land.
