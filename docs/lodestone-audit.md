# Lodestone (`unit12`) — audit by hand

Per-stage record of what was played in the browser (dev server, guest, `#/learn/unit12/<quest>`), with real gestures (taps, two-tap drags,
Submit) unless the evidence column says otherwise. Evidence labels: **Played** (real pointer gestures and Submit), **Viewed** (loaded and
looked at), **Scripted** (`verify:learn` / `verify:table` scripts), **Bench** (`verify:bench` pointer paths), **Code** (read only).
Columns: Operable · Intuitive · Busywork · Builds intuition · Accurate · AP topic.

## Work log

- 2026-11-13, pass 1, `q1-dblock` at 3D On (800 × 600 pane): every stage played; a wrong answer submitted on stages 1, 2, 4 and 6 and its refusal read.
  Found and fixed: the ladder was small on a mostly empty plate (enlarged, boxes scale with the fixture); the Test Energy result line ran under
  its key (shortened, clipped to the space left); "could sit lower" read oddly for a move within 3d (now "can move lower"); a parked recorder
  strip earned a Tour step ("Paper strip") although nothing records (parked at 2 units, out of the Tour); at 3D On the plate is painted with no
  clock, so the lead clip and the gliding levels stood still (new live dress, `lode-3d.js`, repaints the fixture's painter each frame);
  the story's labels sat on its 3d boxes (moved down). 3D Off viewed and stage 1 tapped at 800 × 600 and at 667 × 375.

## `q1-dblock` The d-Block

| # | Stage | Evidence | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Vanadium | Played (3D On; 3D Off and 667 × 375 one tap) | Taps land on columns; Test Energy animates the move | Briefing names 3d; "Electrons: n of 5" counts | None | Test Energy shows the paired electron moving to an empty orbital of the same level | Yes (4s² 3d³) | 1.5.A.3 |
| 2 | Iron | Played | Yes | Yes | None | Same idea without the test: pairing at the sixth | Yes | 1.5.A.3 |
| 3 | Which Two Leave (predict) | Played (two taps; synthetic drag fell short) | Yes; lead clip moves at 3D On after the live dress | Cards hold the real wrong model | — | Clip shows filling order | — | 1.5.A.3 |
| 4 | Making Fe²⁺ | Played (followed the wrong prediction first) | Yes; levels glide as charge reaches +1 | Prompt quotes the guess | None | The ladder flips at +1; Test Energy shows both 4s electrons falling into 3d | Yes, a simplified ladder (said in the Tour words "drawn at its energy") | 1.5.A.3 |
| 5 | Cobalt(III) | Played | Yes | Yes | None | New case, third electron from 3d | Yes (3d⁶) | 1.5.A.3 |
| 6 | The Sealed Drum | Played (Mn tried first, then Fe; card swap on the load slot works) | Yes | Plate gives the evidence only | Four cards, 25 % guess | Uses the ladder to test each metal | Yes | 1.5.A.3 |

## `q2-charges` Many Charges

Pass 1 (3D On, 800 × 600): every stage played; wrong answers submitted on stages 2, 4, 5 and 6. Found and fixed: the small ladder beside
the bars was 3 units a box (now scales with the strip); the transition-metal trays held one row, so a third card spilled off the tray
(two rows, four cards, Fe dropped as a repeat of Ti); the ion rows' captions overprinted the next row; **the sealed strip's small ladder
drew the sealed atom's own 4s and 3d electrons, which named it** (a sealed strip now shows no ladder and plain bars); a duplicate
variable in the strip painter blanked the whole app (a check run whose output I filtered for FAIL hid the import error: run the tail).

| # | Stage | Evidence | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Calcium's Costs | Played | Remove key and gap taps work | Briefing defines ionization energy | None | The third bar is coloured like the inner level it left | NIST values | 1.5.A.4, 1.8.A.3 |
| 2 | Manganese's Costs | Played (marked after 2 first; refusal gives bars 2 and 3) | Yes | Yes | None | Seven bars in even steps, the eighth from 3p | Yes | 1.5.A.4, 1.7.A.2 |
| 3 | The Third Electron (predict) | Played | Yes; lead bars grow | Card holds the "more protons" model | — | Clip: a neighbour pair that follows the trend | Yes | 1.7.A.2 |
| 4 | Mn²⁺ and Fe²⁺ | Played (chose Fe²⁺ first) | Remove keys and tap-to-choose work | Prompt quotes the guess | None | Fe²⁺'s electron leaves the paired orbital, and costs less | 3248 / 2957 kJ/mol | 1.5.A.4 |
| 5 | Transition Metals | Played (Cu in the wrong tray first) | Two-tap card moves; load square swaps | Briefing defines the term; Cu exception said | A sort, but each card is read on the ladder first | Ion rows show empty, partly filled and full 3d | Definition stated as used ("some books also count…" in the bank) | 1.7.A.1 |
| 6 | The Sealed Strip | Played (V first) | Yes | Yes | 25 % guess among four cards | Jump after four matched to Ti's four outer electrons | Yes | 1.5.A.4 |

## `q3-complex` Complex Ions

Pass 1 (3D On, 800 × 600): every stage played; wrong answers on stages 1, 3 (before Bond, after a reload), 5 (three Cl⁻), 6 (meter +2).
Found and fixed: the magnified complex and the option text were small (enlarged); in the bond picture one of copper's own electrons sat in
the gap the lone pair moves into (copper's electrons now spread on the side away from ammonia); the count stages refused a seventh ligand
with no visible reason (the space round the ion is drawn as a shell, and each ligand at its relative size: Cl⁻ half as wide again as
water); empty rings were too dim to find.

| # | Stage | Evidence | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Ammonia on Copper | Played | Add key and option list | Briefing says six waters are already bonded | Read of the window, the see step | Window shows NH₃ replacing H₂O as the colour deepens | [Cu(NH₃)₄(H₂O)₂]²⁺; the excess-ammonia clause is on the plate | beyond (2.1 recap) |
| 2 | Whose Electrons (predict) | Played | Yes | "One from each, as in H₂" is the held model | — | H₂ clip | — | 2.1 |
| 3 | Counting Electrons | Played | Bond key, option list | Prompt quotes the guess | None | Electrons coloured by owner; copper's count stays 9 | Yes | beyond |
| 4 | Water Round Iron | Played (seven added) | Add key; extra drawn pushed off | Yes | Tap until no more bond: a count, but the shell shows why | Space round the ion drawn | Yes ([Fe(H₂O)₆]³⁺) | beyond |
| 5 | Chloride Round Copper | Played (three submitted first) | Yes | Yes | As 4 | Cl⁻ drawn larger; four fill the shell | [CuCl₄]²⁻ (tetrahedral; the distortion is not drawn) | beyond |
| 6 | The Charge of the Whole | Played (+2 first) | Ring taps cycle; meter live | Yes | Meter-led build, the see step | Each Cl⁻ moves the meter by −1 | Yes | beyond |
| 7 | Two Grips | Played (four added) | Yes | Briefing draws en's formula | As 4 | Each en's two nitrogens joined by a backbone arc | Yes ([Ni(en)₃]²⁺) | beyond |
| 8 | The Sealed Drum | Played | Yes | Plate gives the evidence only | None | Build to a measured charge with no meter | Yes | beyond |
