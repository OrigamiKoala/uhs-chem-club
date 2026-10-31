# Kettle `q7-titrate` — Titration (CED 4.6): design record

Built on branch `world/unit07-q7`. Files: `src/learn/quests/unit07/q7-titrate.js`, kit `src/learn/table/kits/pot-titrate.js`, planners
`src/learn/engine/reactdata-titrate.js` (on `titrate` and `indicatorColour` in `reactdata.js`, which are unchanged), checks
`tools/lib/kettle-q7-titrate-checks.mjs`, story painter `src/ui/story-scenes-kettle-q7.js` (`burette-count`), entries in `quest-story.js`,
`stage-story.js`, `bank/unit07.json`, and the chart. No pH value is shown anywhere; a plot is not drawn.

## The click

Students hold "an acid takes an equal volume of base". Stage 1 offers it as a card (25.0 mL) beside 5.0, 10.0 and 62.5 mL; the case
(25.0 mL of 0.100 mol/L acid, 0.250 mol/L base) needs 10.0 mL. The H2SO4 stage (5) contradicts "one for one" a second time.
Prediction pair: stage 1 (no instrument) then stage 2 (the burette). The guess comes back in stage 2's prompt and reward.

## The kit

`titrator` fixture: a burette (tube, 0 to 50 mL scale, level, strength printed, "reading" = total let out), a "Per press" dial (mL one press
lets out; settings differ by stage), a key "Open Tap", a flask under the tip drawn in the planner's colour with its colour word, a slot for a
dye card beside it, and an optional window of discs (H+ and OH- still free, one disc a printed number of mol, a half-filled disc for a half).
The burette only gives out (each press is a recorder row, `x` = the total); Undo is the way back; it holds 50 mL. `perm` mode is the
permanganate flask (no dye slot). `indicator` piece: a card with the dye's name and swatches of the colours it can show (no volume on it).
Flat only; no `dress3d`/`piece3d` (the picture is complete and honest; a solid burette was not cheap enough to be sure of).
Tour: `pot:titrator` and `indicator` (printed "Dye cards" because "indicator" is earned in stage 2; the fixture title is "Tube and flask" until
stage 3, "Burette and flask" after: option `named`).

## Planners (`reactdata-titrate.js`) and hand-worked values

`flaskAt(sys, v, indicator)`, `equivalenceMl`, `endpointMl(sys, indicator, step)` (first grid volume at which the dye differs from its colour at
0 mL), `acidMolarity`, `permanganateAt`, `permanganateEndMl`, `ironMolarity`. Paper values are in the header of the checks file
(eq 10.0 / 20.0 / 22.5 / 36.0 / 25.0 / 22.5 / 45.0 mL; first colour 10.5 / 23.0 / 36.5 / 23.5 (methyl orange) / 23.0 (purple) / 45.5 mL).

## Stages

Ramp: P picture, G prediction, R proportional, F formula as shorthand, N friendly numbers, T typed. "Prints" lists everything the bench shows
and why none of it is the answer. Every refusal names the burette's own reading (what the table shows), never the rule.

| n | Prompt | Evidence · prints | Slip → message | Hints (1 / 2 / 3) | Reward | Ramp · mode |
| --- | --- | --- | --- | --- | --- | --- |
| 1 predict | Choose how much of the base it takes to use up all the acid. | four cards (5.0, 10.0, 25.0, 62.5 mL), slot; plate: 25.0 mL of 0.100 mol/L acid, base 0.250 mol/L, what mol/L means, one base particle uses up one acid particle. No instrument. Constants only. | none: never graded (blank → "Lay a card in the slot") | the cards and slot / compare particles in a litre of each / work out the acid's particles then the base that holds that many | "Now Test It" | G · F |
| 2 | (You guessed X.) Add base until the dye in the flask first changes colour. | tube and flask, dye card, press dial 0.5 / 1 / 2 / 5 mL. Prints strength of base, volume of acid, the reading. The answer is a state (pink within 1.0 mL of the first change), not a number, and no setting equals 10.0 or 10.5. | 5 mL presses to 15.0 → "The flask had already changed colour before the reading reached 15.0 mL."; no dye → "has no dye in it"; colourless → "still colourless at X mL" | the card, slot, dial, key / watch flask and reading together / big presses then small | Titration (titration, burette, indicator earned); quotes the guess and 10.5 mL | P · 3 (flat) |
| 3 | Stop the burette where the base has exactly used up the acid in the flask. | window of discs (H+ 20 at the start, one disc 0.00025 mol = 1 mL of base), no dye; plate: 25.0 mL of acid, 0.200 mol/L. Discs, not numbers; the volume is never printed. Presses 0.5 / 1 / 2 / 5. | 20.5 mL → "The window shows 0.5 discs of OH- left over at 20.5 mL."; early → discs of H+ still shown | dial and key, watch window / compare H+ and OH- discs / count what is left, press that much | Equivalence Point | R · F |
| 4 | Type the concentration of the acid in the flask in mol/L. | burette (0.200 mol/L), flask 25.0 mL HCl, dye card; no window (the window would show the acid's amount). Acid 0.180 (hidden); eq 22.5, colour 23.0 gives 0.184: accepted 0.174 to 0.186. | 0.2 (equal strengths) → "0.200 mol/L does not follow from the burette: the flask first changed colour at 23.0 mL." | card, dial, key, then type / compare the reading at the change with the 25.0 mL / the base run in holds as many particles as the acid, find the acid's share of each litre | Counting Acid by Base | F · T |
| 5 | Type the concentration of the sulfuric acid in the flask in mol/L. | as 4; plate: each H2SO4 particle gives 2 H+. Acid 0.072; eq 36.0, colour 36.5 gives 0.0730 (one-for-one 0.146). Accepted 0.0695 to 0.0745. | 0.146 → same form, names 36.5 mL | card, dial, key / compare H+ per sulfuric particle with HCl's one / count base particles then share among the H+ of each acid particle | Two H+ for One Acid | F · T |
| 6 | Type how many mL the burette gives between the first colour change and the equivalence point. | window (25 discs, 0.00002 mol each), methyl orange card (red, orange, yellow swatches), acid 0.0200 mol/L, base 0.0200 mol/L. Dye goes red to orange at 23.5; discs match at 25.0; the answer is 1.5 (±0.3). Dilute on purpose: in 0.1 mol/L solutions the two coincide within a drop. | 0 ("the colour change is the match") → "0.0 mL does not match the readings: the flask first changed colour at 23.5 mL." | card, dial, key, window / note the reading at the first change and at nothing left over / small presses near each, then how far apart | Endpoint | T |
| 7 | Type the concentration of the Fe2+ ions in the flask in mol/L. | permanganate 0.0200 mol/L, 25.0 mL Fe2+ sample, no dye: pale to purple (purple means permanganate left over). Plate: the equation, "only the 5 to 1 count is used here", "purple needs no indicator" (the balancing is not asked; stated on the card). Fe 0.0900; first purple 23.0 gives 0.092: accepted 0.085 to 0.095. | 0.0184 (one-for-one) → same form | dial, key, type / first purple that stays / count permanganate, scale by the equation's count | A Dye of Its Own | T |
| 8 sealed | Type the concentration of the acid from the pickling bath in the sealed flask in mol/L. | as 4 with sulfuric acid 0.450, base 0.500: eq 45.0, colour 45.5 gives 0.455; accepted 0.438 to 0.462. No legend of 2 H+ is printed (transfer from stage 5). | 0.91 (one-for-one) | as 4, plus think H+ per particle | The Bath Is Counted | T |

The overshoot idea of the first draft is not a stage: it is the refusal form of stages 2, 3 and 4 (a reading past the change is named in the message).

## Words and story

Earned: titration, burette, indicator (2), equivalence point (3), endpoint (6). `BUILDS_ON`: `unit07/q6-stoich` (mole ratio, moles). Lead line: "Nobody at the foundry knows
how strong the acid in the pickling tank is." Story animation `burette-count`: drops of 0.5 mL are counted into the flask; base discs
(one per drop) and acid discs (planner) are counted against each other; the dye turns on the drop after they match; the strength is the printed
arithmetic on the counted volume. Filed: the pickling bath is 0.450 mol/L sulfuric acid, so the foundry's acid use can be checked against its ledger.
The bank has `q7-titrate#b1`, `#b2` and `#w` (5 steps with `calc`: sulfuric acid against sodium hydroxide, 30.0 mL).

## What is weak

- Stages 2 and 3 are, honestly, hunts: a titration is. Stage 2 is graded on a state and compared with the guess; stage 3 on the window. Neither has a number to copy.
- Stage 6 needs a dilute pair to make the gap visible on a 0.5 mL grid; the reward says why. It is a second reading subtracted from the first.
- Stage 5 states the 2 H+ on a plate (a fact about the acid, not the move); the discovery that the base doubles is by the typed figure being refused.
- Permanganate is simplified: pale versus purple only (the yellow of Fe3+ is ignored), acid taken as plentiful, and a faint pink counted as soon as any permanganate is left over.
- Flat burette; no solid at `3D On`. The stage-1 window of discs was kept off stage 4, 5 and 8 so it cannot show the unknown amount; those three rely on the colour alone.
- Burette holds 50.0 mL; a coarse run past it is refused with the mL left and the player uses Undo.

## For the owner to play

Stage 2 (the press dial and dye slot, and whether the colour change is readable), 3 (the window discs against the reading), 6 (the three-colour methyl orange and the two readings),
7 (the purple), 4/5/8 (typing from the first-colour reading), the Tour on stage 2 and 3, and the story animation.
