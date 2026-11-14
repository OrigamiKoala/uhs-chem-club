# Thornmere (`unit13`) audit

Written 2026-11-14 at the close of the world build on `world/unit13`. Spec and build record: `docs/plans/thornmere-world.md`.

## What the evidence labels mean here

- **Bench**: `verify:bench` solved the stage through the real pointer path (drag and two-tap) at seven viewports, with every piece at 28 px or more and the whole table in the free glass.
- **Scripted**: `verify:learn`, `verify:table` and `verify:thornmere` replayed the stage's solution (passes) and its scripted miss (refused, with a reason).
- **Viewed (Node)**: the stage's own tabletop drawn to PNG by the game's `drawTable` (`tools/thornmere-stills.mjs`) at 812 × 375 and at 667 × 375, as it opens, after the miss and after the solution, and read. This is the `3D Off` picture; the `3D On` plate is the same painter laid on the plate (`liveDress`).
- **Played**: none. A browser pass by real gestures was attempted and refused by the session's permission check, in line with `CLAUDE.md` ("agents do NOT test in the browser"). No stage was operated by a hand, and nothing was seen at `3D On`.

Every stage below is Bench + Scripted + Viewed (Node). Ratings are the builder's reading of the stage against `docs/teaching-pass/BRIEF.md`, not a student's experience.

## Per stage

| Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | Topic |
| --- | --- | --- | --- | --- | --- | --- |
| q1 s1 Four Bonds Each | yes | yes: carbon's outline closes at four | no | the H count follows from bonds used | yes | 2.5 recap |
| q1 s2 One More Carbon (predict) | yes | yes | no | sets up the click | — | — |
| q1 s3 The Third Carbon | yes | yes: a hydrogen is drawn leaving | no | **click**: two more, not four | yes | 2.5 |
| q1 s4 Twenty Carbons (typed) | yes | yes; worked case in briefing | low | pattern checked on four chains first | yes (C₂₀H₄₂) | formula pattern |
| q1 s5 Drawing It Quickly | yes | yes | no | corners and ends = carbons | yes | notation |
| q1 s6 Naming a Branch | yes | medium: the longest chain is hidden by drawing | no | longest-chain rule on a trap drawing | yes (3-methylpentane) | naming |
| q1 s7 Closing the Ring (typed) | yes | yes | low | each end gives up one H | yes (C₆H₁₂) | — |
| q1 s8 The Sealed Drum | yes | yes | no | two H fewer + single bonds = ring | yes (cyclobutane) | — |
| q2 (slice, 8 stages) | see `docs/plans/thornmere-world.md` build record of the slice | | | | | 2.6, 2.7, 5.7 |
| q3 s1 One Formula, Two Molecules | yes | yes | no | same atoms, different order | yes | isomers |
| q3 s2 Counting Isomers (typed) | yes; Record refuses repeats | yes | low (several builds) | the strip refuses a bent copy | yes (3) | — |
| q3 s3 The Compact One | yes | yes | no | contact length drawn; third sample not testable | yes (9.5 °C) | 3.1 |
| q3 s4 One Side or the Other | yes | medium: two dichloroethenes differ by one digit | no | the double bond springs back; the turned form is drawn beside | yes | 2.7, cis/trans |
| q3 s5 The Mirror (predict) | yes | yes | no | sets up the click | — | — |
| q3 s6 Four Different Groups | yes | yes | low (eleven presses) | **click**: no turn of twelve matches | yes | chirality |
| q3 s7 Which Is Chiral | yes | yes | low | best count printed on each card | yes | — |
| q3 s8 The Carbon That Does It | yes | yes | no | four different groups named per carbon | yes (lactic acid C2) | — |
| q4 s1 One Atom Changed | yes | yes | no | the H-bond drawn amber between OH and O | yes (78.4 / −24.8 °C) | 3.1 |
| q4 s2 Is It a Base (predict) | yes | yes | no | NaOH clip on a neighbouring case | — | 8.6 |
| q4 s3 The pH Test | yes (fixed: window was too narrow) | yes | no | **click**: the meter stays at 7.0; nothing leaves | yes | 8.6 |
| q4 s4 Short of Electrons | yes | yes | no | pair places drawn from electronegativity | yes (rule of thumb, said in Tour) | 2.1 recap |
| q4 s5 Which Is the Acid | yes | yes | no | a proton moves to water in one window | yes (pH 2.9) | 8.6 |
| q4 s6 Why It Lets Go | yes (fixed: plate clipped) | medium: why the carbon can take a pair is the hard step | no | the pair moves in as the C=O pair moves out | yes | 2.6 resonance |
| q4 s7 The Nitrogen Group | yes | yes | no | N lone pair takes a proton; OH⁻ left | yes | 8.6 |
| q4 s8 Two O–H Groups | yes | yes | no | sealed: shared charge only on –COOH | yes | — |
| q5 s1 Where It Goes (predict) | yes | yes | no | NH₃ + HCl clip | — | 4.2 |
| q5 s2 One In, One Out | yes | yes | no | **click**: the pair goes to carbon; Br⁻ leaves | yes | substitution |
| q5 s3 Crowding | yes | yes | no | only methyl and tertiary can be tested; the middle two are reasoned | simplified (the ion is drawn turned back by CH₃ groups; said as a picture, not a rate) | 5.x qualitative |
| q5 s4 Acid Meets Alcohol | yes | medium: a two-step reaction; proton moves left out (said) | no | O pair to C=O carbon, then water leaves | simplified honestly | 5.7–5.9 |
| q5 s5 The New Bond | yes | yes | no | ringed atoms show where each came from | yes | condensation |
| q5 s6 Water Breaks It | yes | yes | no | the link's C–O pair leaves; drawn as one move (said) | simplified honestly | hydrolysis |
| q5 s7 Three Kinds | yes | yes | low | each reaction played, molecules counted before and after | yes | reaction types |
| q5 s8 Two Carbons Bonded to Bromine | yes | yes | no | sealed: poor and unblocked | yes | — |
| q6 s1 Into a Chain (predict) | yes | yes | no | H–Br + ethene clip | — | — |
| q6 s2 Joining Up | yes | yes | no | **click**: each second pair becomes the link | yes (2-methylpropene, said in header) | 3.1.A.5 |
| q6 s3 The Growing End | yes | yes | no | the second pair moves; a σ pair returns | yes | — |
| q6 s4 Which Monomer | yes | yes | no | repeating unit read from the drawn chain | yes (PVC) | 3.2.A.7 |
| q6 s5 Links That Lose Water (typed) | yes | yes | low | water falls at each join, counted | yes (5) | — |
| q6 s6 A Real Chain (typed) | yes | yes; worked case in briefing | low | n − 1 links | yes (499) | — |
| q6 s7 Amino Acids | yes | medium: a crowded drawing | no | N pair to C=O carbon of the other molecule | yes; proton moves left out (said) | biomolecules |
| q6 s8 Where to Cut | yes | yes | no | sealed: the ester link's C–O | yes | — |
| Boss p1 The Wax Layer (typed) | yes | yes | low | new case of q1 s4 | yes (62) | — |
| Boss p2 The Soft Seam | yes | yes | no | new case of q2 s8 (C₅H₁₀ ring vs alkene) | yes | — |
| Boss p3 The Twisted Filler | yes | yes | no | new case of q3 s8 | yes (2-bromobutane C2) | — |
| Boss p4 The Weak Point | yes | yes | no | new case of q4 s4 on an amide link | yes | — |
| Boss p5 Opening the Gate | yes | yes | no | new case of q6 s8 on a polyamide | yes | — |

## Defects found and fixed during the build (by Node render and checks)

- q1 s7: a miss printed the answer ("the board draws 12 hydrogens"); reworded.
- q1 s3 and s7: board titles ("Ethane, full", "Hexane, bent round") went stale once the molecule changed; renamed "Model board".
- q3: the model board had no way to take a carbon away, so counting isomers would have needed Start Over, which also wipes the record strip; a tap on a carbon now removes it on boards that draw their own hydrogens.
- q3 s4: the "far end turned over" form drew its second pair crossed; it is now drawn whole.
- q3 s6: the mirror image was drawn with an extra reflection, so a group "in place" did not stand where its match stood, and one group hid behind the carbon; the rig is now drawn so the image is the literal reflection in the dashed line, with depth shown by size.
- q4 s3: the pH window at 70 units wide overprinted ethanol's oxygen and the water molecule; widened.
- q4 s6: the electronegativity plate ran off the right edge; resized.
- q4: the pH painter drew an O–H on propanone, which has none.
- q5 s3: the approach window's CH₃ groups overlapped; spaced and enlarged.
- Hint leaks at rung 2 or 3 in q4 s1, q5 s4, q6 s7; a "make room" euphemism in q5 s4; misses that stated the answer or the method in q5 s7, q6 s2, q6 s6.

## Still open

- Nothing was played by a hand or seen in a browser, at `3D On` or `3D Off`.
- The H atoms on small boards (q1 s5, q3 s1, boss p1) render at about 6 to 7 px at 667 × 375; taps measure 28 px or more, but whether the letters read on a phone is the owner's call.
- The electron views with pairs (q4 s7, q5 s4, q6 s7) are crowded at phone width.
- q3 s6 needs eleven presses of "Next Turn" to try every turn; whether that reads as investigation or busywork is the owner's call.
- The chain maker prints no running count of units joined (the picture is the count).
