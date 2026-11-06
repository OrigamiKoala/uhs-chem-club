# Brinewire q1-halves: build notes

Status: built 2026-11-05, checked by script only (`verify:learn`, `verify:table`, `verify:story` filtered to unit10; `verify:bench` has no unit10 world yet). Nothing here was played.

## What was built

- Quest `src/learn/quests/unit10/q1-halves.js` (8 stages, predict pair 2 and 3, stage 5 labelled beyond the exam in its title and reward).
- Kit files `table/kits/cell-redox.js` (+ `-tour`): fixtures `cellredox` (beaker, two windows) and `cellprobe` (seat, readout, strip). `cell-ledger.js` (+ `-tour`): fixtures `cellledger` (a half-reaction card with chip dials or a "Written this many times" dial) and `celltally`. One line each added to `cell.js`.
- Planners `engine/celldata-q1.js`: probe cards (`CARDS`), the four sealed reactions (`SORT`, `reactionStates`, `isRedox`, `movers`), window counts from `matchElectrons` (`windowOf`, `windowCharge`), halves (`HALF`, `bare`, `scaleHalf`, `overall`, `equationText`), ledger rows in a fixed order (`rowsFor`, `firstOff`). `celldata.js` untouched.
- Story: painter `half-join` in `ui/story-scenes-brinewire-q1.js`, block in `story/quest-story.js`, lead line in `stage-story.js`. Bank `bank/unit10/q1-halves.json` (+ `bank.js`). Chart line flipped live. Checks `tools/lib/brinewire-q1-checks.mjs` (+ `verify-learn.mjs`).

## Where this parts from the spec (3.1) and why

1. **Number probe is a fixture with a seat, not a piece laid on a species.** A piece "laid on" a species needs a join the cell kit does not have (only blocks join). It is the potential board's pattern: a seat, a readout and a strip that remembers (`settle`). The card is dragged to the seat, so the two-tap twin comes with it.
2. **Stage 1 has four cards, not five** (Zinc, Copper, Sulfur in the sulfate ions, Oxygen in the sulfate ions). A card has to stand for one kind of atom so one number can be read per window; the whole sulfate ion has no single number. Sorting is into two trays ("Number different", "Number the same") rather than marking, because marking cards (`markable`) cannot also be carried to the probe seat. The probe prints Before and After together, so one placement per card reads both.
3. **Stage 1 prompt does not say "oxidation number"** (the reward earns it). It asks for the sort by "whether the probe reads the same number before and after".
4. **Stage 5 puts the probe and two beakers on one table** with one slot per beaker. The probe has no strip there. Cards: Cu, Ag⁺, Mg, Fe²⁺.
5. **Stage 6 uses six chip dials** (H⁺, H₂O, electrons, each on the left and on the right) because the side of each chip is part of what is being worked out. Ranges are 0 to 10, 0 to 6, 0 to 6. This is a build, not a hunt: the ledger names the row that is off. The ledger prints left and right counts (as the brief says) and not row differences (as the spec table says); it never marks a row.
6. **Stage 3 prints only the charge row**; stages 4 and 7 print no rows (the halves are given balanced, only their multiples change, the card shows the scaled half and the tally shows the electrons).
7. **Stage 7 multiplier ranges are 1 to 3 (permanganate) and 1 to 6 (iron(II))**; stage 4 uses 1 to 4 on both. Only the lowest matching pair fits each range.
8. **Stage 8 tray names ("Redox", "Not redox") are the two answers** (the spec's sort); "redox" is earned on stage 3's reward. Sealed means labelled Reaction A to D; the reward names them.
9. **Lead line is one sentence** ("The Fifth says the pylons are rotting, and Vess wants to find out what moves when a metal rots."), because `verify:learn` requires a one-sentence story line; the caller's two-sentence text failed that check. The Filed line is as given.
10. **Stage 2 prompt is one question** ("Where do the two electrons that each zinc atom loses end up?") for the same one-sentence rule.
11. **`WITHHELD_VOCAB` line sits before the `unit09/q6-titrate` line** (there is no `unit10/q4-potential` line to follow). The `checkBrinewireQ1` call follows the Q4 call as asked.
12. Chart descriptor: "The pylons are rotting; find what moves when a metal rots."

## Prompts and hints as built

1. "Sort the four cards by whether the probe reads the same number before and after." 1 Drag a card onto the probe seat to read it, then drag each of the four cards into a tray. 2 Compare the "Before" number with the "After" number the probe prints for each card. 3 Put a card in the first tray when its two numbers are not equal and in the second when they are.
2. "Where do the two electrons that each zinc atom loses end up?" (predict) 1 Use the four cards and the slot. 2 Picture the zinc strip in the "Before" and "After" windows and ask what in the After window could hold electrons the strip lost. 3 Ask whether the electrons can end up anywhere that is not a particle.
3. "Write each half of the zinc and copper reaction so that its charge balances." (quotes the guess) 1 Turn the electron dials on each card until the charge row has the same count on both sides. 2 Compare the charge on the left and on the right of the arrow for the zinc card and for the copper card. 3 An electron carries one unit of negative charge, so place electrons on the side that has too much positive charge to cancel it.
4. "Balance aluminium with copper(II) ions so no electrons are left over." 1 Turn the "Written this many times" dial on each card and watch the tally. 2 Compare the electrons given with the electrons taken for each pair of settings. 3 Write each half enough times that both halves handle the same number of electrons.
5. "Lay the species that gives up its electrons in each beaker on its slot." 1 Drag a card onto the probe seat to read it, then lay one card on each beaker's slot. 2 Compare the "Before" and "After" numbers of the two species in each beaker. 3 The species that gives up electrons is the one whose number rises.
6. "Balance the permanganate half in acid by placing electrons, hydrogen ions and water." 1 Turn the dials for hydrogen ions, water and electrons on the left and the right of the arrow. 2 Compare the left count with the right count in each row of the ledger, one row at a time. 3 Settle the oxygen row with water, then the hydrogen row with hydrogen ions, then the charge row with electrons.
7. "Join the permanganate half and the iron(II) half so that no electrons are left over." 1 as stage 4. 2 Compare how many electrons one copy of each half handles with the tally at each setting. 3 Write the halves enough times that the electrons given equal the electrons taken.
8. "Sort the four sealed reactions into redox and not redox." 1 Drag a reaction card onto the probe seat to read it, then drag each card into a tray. 2 Compare the "Before" and "After" numbers the probe prints for every element in a reaction. 3 A reaction is redox when the numbers of at least one of its elements are not equal.

## What only a hand can judge

- Stage 1 and 8: whether reading four (or four) cards on the probe then sorting feels like discovery or like a chore, and whether the probe's Before/After columns read at a glance at phone size.
- Stage 5: the table is tall (two stacked beakers, a probe and four cards); crowding at 375 px.
- Stage 6: six dials on one card (dial labels at the dial strip's pitch, 5 units); dragging a dial to a number from 0 to 10 on a phone.
- The windows: whether 8 strip atoms and about 10 ions are readable with the labels at the minimum size.
- 3D On: the beaker windows get low glass walls (`dress3d`, copied from the board); the ledger, tally and probe are flat. Not seen in 3D.
- Story painter pacing and sizes.

## Defects found while building

- `ledgerRows` lists the elements of every species in a half, so a half with a zero-count entry would print extra rows; the ledger builds halves without zero entries and `rowsFor` pins the row labels per card.
- `balanceAcidHalf` returns the balanced half including its electrons, so a card started from it is already solved. `bare()` strips the electrons for the student's starting card (found by `verify:table` on stage 3).
- The `tag` piece is 26 units wide, so a probe seat is 32 by 14.
- Not mine, seen in the filtered output: `unit10/q3-galvanic` fails `verify:learn` (prompt two sentences, no lead line, no bench problems) and `verify:story` (no animation); those builds are in progress.
