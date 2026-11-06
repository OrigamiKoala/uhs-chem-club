# Brinewire q2-activity (Which Metal Gives): build notes

Built 2026-11-05 on the cell kit. No browser was used; nothing here is `Played`.

## What was built

- Quest `src/learn/quests/unit10/q2-activity.js` (8 stages), planners `src/learn/engine/celldata-q2-activity.js` (pure; `dipResult`, `dipWords`, `coated`, `nailSpots`, `stripsTakingOnly`; all of it is `celldata.js` `displaces`, `givesHydrogen`, `protectsIron`, `takesOutOnly`, `activityOrder`).
- Kit `src/learn/table/kits/cell-dip.js` + `cell-dip-tour.js`: fixtures `celldip` (the dip rack), `celldipnails` (iron nails in brine wired to partners, with a "Leave a Week" key) and piece `celldipstrip`. One import line in `cell.js`.
- Story painter `dip-order` (`src/ui/story-scenes-brinewire-q2-activity.js`), block in `quest-story.js`, lead line in `stage-story.js`, bank `bank/unit10/q2-activity.json`, chart line flipped live, checks `tools/lib/brinewire-q2-checks.mjs`, one `WITHHELD_VOCAB` line and the check call in `verify-learn.mjs`.

## Stages as built

1 coated or clean (selector of three solutions) · 2 rank Zn, Fe, Pb, Cu (rail, four beakers) · 3 predict (cards only) · 4 copper in the zinc solution (selector, quotes the guess) · 5 hydrogen among five metals (five acid beakers, rail of six) · 6 iron nail and four partners (Leave a Week, tray of cards) · 7 sealed X among four (rail pre-seated with the four known metals, X last) · 8 the strip that takes copper from the Cu/Fe mix (four mixed beakers, selector).

Prompts and hints are in the quest file. The rack prints no results log: each beaker keeps a small mark per strip dipped in it (`settle`, `props.noted`), a coloured square for a coating, a ring for bubbles, an empty square for none.

## Where this parts from the spec

- Lead line stage 1 is one sentence ("Two bolts on one pylon rot at different speeds, and Vess wants to find which metal gives."), because `verify:learn` requires a one-sentence lead; the two-sentence wording given in the spec fails that check. Filed line is the one asked for.
- Stage 3 prompt is one sentence with a semicolon (the verifier needs exactly one sentence).
- Stage 5: five acid beakers (one per strip) rather than one beaker; only the position of hydrogen is graded, so the order of Mg, Zn and Fe among themselves is free (the bench shows nothing that separates them).
- Stage 7: the four known metals start on the rail in the order stage 2 found, so the stage is about X alone; the whole rail is still graded.
- Stage 4 verdict options are the same four cards as the prediction ("Coated and thinner" is the held model). A wrong verdict is refused with "compare it with the zinc strip", not with the reading itself, because the reading is the answer.
- Stage 6 uses a tray "Nail with no blue spots" and cards (the multi-select), and a Run key "Leave a Week" so the spots are found, not printed at the start.
- The story's last beat avoids "anode" (`verify:story` holds it for q3); the reward card of stage 6 names "sacrificial anode" as the spec asks. `BUILDS_ON` is empty because q1 is not used for words.
- The Pb strip bubbles in acid per `givesHydrogen` (E° below 0); real lead in acid is slow, and the bench does not use lead there.

## Simplifications said on the bench or here

All solutions 1 M and strips left long enough to finish. One bubble pattern for every metal that gives hydrogen (real rates differ). A bare nail also rusts slowly; the nails show only the spots that wiring to a less active metal adds (5 each, the same for copper and tin). Mixed-beaker ions swap charge for charge, 6 of each at the start.

## What only a hand can judge

Whether the thin coated strip in each beaker reads as a coating at phone size (grey on grey: lead and iron coatings rely on the colour word under the beaker and the rough edge); the fit of the 5-beaker rack on stage 5 at 375 px; the two-tap twin for dipping a strip over a beaker seat; the marks (2 px squares) on each beaker; the 3D low dishes and flat bar strips at `3D On`.

## Defects found on the way

`verify:learn` crashes on a missing `brinewire-q1-checks.mjs` while another builder's bench is in progress; q2's checks were run on their own as well. `verify:story` known failure `unit02/q10-wavefunctions` is not this bench.
