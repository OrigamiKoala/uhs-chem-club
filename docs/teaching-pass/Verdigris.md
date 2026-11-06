# Verdigris teaching pass (2026-11-06)

Run from `docs/fix-world-teaching-prompt.md` for WORLD = Verdigris, UNIT = unit09. Nothing was played in a browser (the owner play-tests).

**This pass is partial, and says so.** It changed the words, added the glossary, the primers and the checks, and made every flask-like window a
moving model. It did **not** rebuild the benches around the student acting on the particles themselves, and it added no predict lead-ins. The
open work is listed first so it is not lost.

## Tally

| | Stages |
|---|---|
| Total (8 benches x 8 + boss 5) | 69 |
| With a live mechanism view (particles move in time, driven by the planner's count), flat and at 3D On | 59 |
| Still static | 10 (6 predict stages, 4 card or board stages) |
| Kept static with a reason the owner has accepted | 0 (the 4 card or board stages are candidates only; see below) |
| Target (at most 1 in 6 static) | 11 (met) |

"Live" is weaker than the prompt's "dynamic bench": in most of the 57 the graded move is still a dial, a card or a typed number, and the
moving model is the picture beside it. The model's counts are the planner's own, so the picture is honest, but a student can still solve
those stages without watching it. That is the same half-fix `general-problems.md` records for Brinewire.

## What was done

- **Words.** `tools/lib/rewrite-play-text.py` rewrote string literals (never code or comments) in the unit09 quests, the ph kit, its Tour text and
  the bank: *rig* to *board* (*ratio rig* to *expression board*), *tile* to *card*, *chip* to *formula card*, *pour window* to *particle window*,
  *lens* to *counter*, *strength* to *concentration* where it meant mol/L. *Strength* meaning strong or weak (q4, "How strong the acid is") was kept.
  Internal ids (`phrig`, `phtile`, `chip` in code) are unchanged. `boss-leach` is exempt as story, but it was rewritten too where the word was a
  lab quantity (concentration).
- **Glossary.** `src/learn/glossary/verdigris.js`: 21 terms with gloss and first stage, the banned words, and `NEEDS`. Registered in
  `glossary/index.js`, so the Glossary key and the "What is this?" hint key (shared frame code from the Brinewire pass) work on every Verdigris bench.
- **Primers.** `NEEDS` offers the existing `log` and `ratio` primers on `q2-scale` 1, 2, 4; `q3-weak` 4, 5; `q7-buffer` 5, 6 and `q6-titrate` 8, and
  a new `amount` primer (concentration x volume = amount) on `q5-salts` 6 and `q6-titrate` 7. The Primer key shows on those stages.
- **Mechanism views** (all pure in `engine/phmotion.js`, painted at the table clock, flat; `live` declared per fixture and by the kit):
  - `phflask`, `phscale` windows: every unit wobbles. In a weak solution units hand a proton over and take it back every 2.6 s, and the number
    that has let go stays the planner's count at every frame (a fully ionized or untouched solution does not swap). A hand-over is drawn as the
    two particles parting.
  - `phpour` window (q1): molecules wobble; on Pour one proton crosses from the acid to the water (or from the water to the base) and lands.
  - `phrace` (q4): after Race the protons fly one by one from the acid's window to the base's; the two counts follow the ones that have landed.
  - `phburette` (q6, boss): a drop falls on each pour; hydronium (amber) and hydroxide (blue) dots move in each flask, in the ratio the pH gives.
  - `phneut`, `phmix`, `phsolid`, `phstrip`: particles wobble; the fraction strip gains a row of 40 molecules that trade protons while the share in each form holds.
- **Checks.** `tools/verify-teaching-verdigris.mjs` (wired into `verify:teaching`): banned words (play text and bank), term before its stage, needs have a
  primer that runs, the window moves / holds the count / swaps only when it can / responds to dilution / stays at or under 200 particles, static
  ratio, predict lead-ins and reading load (ratchets in `tools/teaching-ratchet.json`, key `verdigris`; `--strict` fails them; `--update` writes them).
  `tools/lib/teaching-dump.mjs unit09` prints every stage as JSON for audits.
- The painters keep their per-fixture memory (a shuffle, when a pour began) in a `WeakMap` (`phmotion.scratch`), not on the fixture: `verify:table`
  compares two builds of a table and failed when the fixture carried it.

## Third run (2026-11-06): graded by the particles, a short animated Tour, misses that replay

- **Graded by the system, not a dial.** Six stages lost their answer dial and are now graded on the state the student leaves the particles in:
  `q2` 1 (dilute until the pH is 3), `q2` 5 (dilute until one more dilution would change the pH by under 0.1), `q3` 6 (dilute until 25 of the 200 units
  have come apart), `q5` 1, 3 and 4 (pour to the first pour at which the window shows none of the acid or base left; pouring on is a miss). The
  acidic / neutral / basic idea is now in the reward and the pH meter instead of a selector. Every other dial, card and typed stage is unchanged.
- **Tour.** Every Verdigris instrument step is one short line (none over 16 words, held by the check) and opens with a live clip: the instrument's own
  painter on a small canvas, driven by the kit's demonstration (`handler.demo`): a flask diluting, a pour, a titration. `table/tour.js` steps carry `fx`, and `frame.js`
  (`tourClipMarkup`, `startTourClip`) draws it; the general lines (Moving pieces, Prediction, trays, the strip) were cut for every world.
- **Misses replay the cause.** `stagerunner.submit` calls the kit's `onMiss`; the ph kit marks each instrument that can replay (`handler.replay`), and its painters, flat and 3D, show it
  at step 0, 1, ... n, one a second, framed in amber, then settle on the table as the student left it (`ph-replay.js`). Dilute flasks, mixing flasks, buffer flasks,
  the solid, the pour window and the burette replay; the race, strip and rig do not. The banner message still carries the reading.
- **Not done, and the largest gap:** a miss on a dial, card or typed stage replays only what the student already did with the instrument; it cannot show a cause they never
  produced. About 50 stages still end on a dial, a card or a typed number. A real particle answer (carry the proton, tap the unit that holds it, drag ions into a
  vessel) needs a new input kind in `table/gestures.js`; I did not add one. `q1` 1, 3, 5, 7 (where the proton goes) and `q4` (the race ranking) are the first candidates.

## Fourth run (2026-11-06): real particle answers

- **The proton bench** (`kits/ph-transfer.js`: fixture `phtransfer`, piece `phproton`, builder `transferParts`). A row of particles, each a core with its hydrogens as wobbling
  spheres (3D On: solid spheres, like every window). A particle that can give carries one proton, a real loose piece. Under each particle is a seat. The student drags
  (or taps, then taps) a proton into another particle's seat; the particles redraw as what they become and rename themselves. The check reads where the proton went
  (`transferRead`), never a card or a dial. No new gesture code: pieces and seats already give drag, the two-tap twin, undo, Start Over and 3D.
- **Stages graded this way:** `q1` 1 (HCl is poured into water: carry the proton to the particle that holds it), `q1` 3 (ammonia: the water's proton goes to the ammonia) and
  `q7` 4 (the acid poured into the buffer: carry its proton to the acetate, not the acetic acid). Their selector and formula cards are gone; the flask or pour window stays beside
  the bench as the evidence. A wrong move reads the window and its replay shows the proton coming straight back.
- **Not converted:** `q1` 5 and 7, `q4` (the race ranking), `q5` 5 and 8 (sorting salts), `q8` 2, 3, 8 (the strip), `q6` 3 to 5. Each is a candidate for the same bench or a sibling
  (drop an ion into a vessel; tap the unit that holds a proton). The remaining dial, card and typed stages are listed in the table above.

## Open work, in the order I would do it

1. **Predict lead-ins** (2 of 8 done, 2026-11-06, second run: `q1` 2 shows hydrochloric acid handing a proton to water on a loop, `q2` 6 shows pure water at 25 °C trading protons. Still open: `q3` 1, `q4` 1, `q5` 2, `q6` 2, `q7` 1, `q8` 1). A clip of a *different* case must come first; for several of these
   (q3:1, q4:1, q6:2) any particle clip of the topic gives the answer away, so the lead-in needs the owner's judgement on which case to show.
2. **Make the student act on the particles.** Started 2026-11-06: `q2-scale` stages 1 and 5 and `q3-weak` stage 6 now have one flask and a Dilute key (`scaleFlask(..., { dilute: 3 })`); each press makes the concentration a tenth, records the pH, and a fixed sample box counts the H₃O⁺ (1000, 100, 10, 1; in stage 5 the count stops falling near 100 because water supplies hydronium). The answer waits until the flask has been diluted enough. Still to do: The big benches are still dial-and-read: `q2` (a selector over a flask: drag H₃O⁺ in to dilute and
   watch the pH marker), `q5` (pour base and watch units neutralize one by one, then count), `q6` (the curve plotter draws from the planner; the point
   should ride the burette), `q7` and `q8` (buffer: acid added as falling particles that the acetate catches), `q4` (drag the proton).
3. **3D (done in the second run).** `kits/ph-3d.js` runs each fixture's flat painter against a recording canvas (`ball()` / `dot()` in `ph-flask.js` report every sphere) and stands the spheres up as one InstancedMesh in the host's steel, hovering over the plate and moving with the same clock. At `3D On` the plate skips the spheres (`__skip`), so the two views are one fact. Fixtures opt in with `bodies3d` (all the live ones; the Lewis pour window stays flat). `verify:bench` passes for unit09. Not done: a 3D reward model per idea, and glass vessels with real depth (the spheres sit in the plane of the window).
4. **Expression boards** (`q1` 6, `q3` 8): a printed board with cards. Candidates for the exception test (symbolic, short), but I have not claimed them.
5. **Reading load**: 14 prompts, rewards or hints are over the limit (the ratchet holds them). Rewards still carry derivations.
6. **Hints and misses** were reworded only for the glossary; none replays the mechanism. The "What is this?" key works wherever a hint uses a glossary term.
7. **Beyond-the-exam content**: `q1` stage 7 (Lewis acids, Lewis is not in the glossary on purpose). Cutting it needs the owner.
8. **Bank**: reworded by the same script (4 lines changed); no worked problem was given a mechanism view.
9. `boss-leach` text was only changed where *strength* meant concentration. Its fiction (vats, the Leach) is intentionally kept.

## Stage audit (generated from the source; "Defects" are what the checks can see, not a full read)

| Stage | Now | Prompt as written | What moves | Defects found | Done |
|---|---|---|---|---|---|
| boss-leach:1 Phase 1 · The Warm Flasks | dynamic | Set the dial to the flask that is neutral. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| boss-leach:2 Phase 2 · The Three Acids | dynamic | Drag the three acids onto the rail from the lowest pH to the highest. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| boss-leach:3 Phase 3 · The Salt Vats | dynamic | Sort the three salt solutions into acidic, neutral and basic. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| boss-leach:4 Phase 4 · The Dosing Run | dynamic | Pick the dye that changes colour at the equivalence point of this titration. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | - | windows move (2026-11-06) |
| boss-leach:5 Phase 5 · The Mixing Flask | dynamic | Find the ratio of acetate to acetic acid that gives a pH of 5.10. | spheres wobble as acid or base is poured | - | windows move (2026-11-06) |
| q1-handover:1 Where the Hydrogen Goes | dynamic | Find which particle holds the hydrogen that began on each HCl once the acid is poured into water. | molecules wobble; on Pour the proton crosses from one molecule to the other | - | windows move (2026-11-06) |
| q1-handover:2 Ammonia in Water | dynamic | Which best describes what ammonia, NH₃, will do when it is poured into water? | molecules wobble; on Pour the proton crosses from one molecule to the other | predict without lead-in | windows move (2026-11-06) |
| q1-handover:3 Ammonia Acts | dynamic | Say whether ammonia acted as an acid or as a base. | molecules wobble; on Pour the proton crosses from one molecule to the other | - | windows move (2026-11-06) |
| q1-handover:4 What Is Left | static | Pair each acid with the particle that is left of it after it hands a proton over. | nothing (exception: conjugate-pair bookkeeping (formula cards beside acids)) | no mechanism view | open |
| q1-handover:5 Two Ways Round | dynamic | Find the substance that acts as an acid in one window and as a base in the other. | molecules wobble; on Pour the proton crosses from one molecule to the other | - | windows move (2026-11-06) |
| q1-handover:6 Ions in Pure Water | static | Arrange cards on the board into a ratio that reads the same number for all three waters. | nothing (exception: printed expression board (Kw)) | reward over limit; no mechanism view | open |
| q1-handover:7 Without a Proton | dynamic | Find what moves when boron trifluoride, BF₃, meets ammonia, a case beyond the exam. | molecules wobble; on Pour the proton crosses from one molecule to the other | reward over limit | windows move (2026-11-06) |
| q1-handover:8 Pairs in Reactions | static | In each reaction, lay the two substances of each conjugate pair side by side. | nothing (exception: conjugate-pair bookkeeping (formula cards beside reactions)) | reward over limit; no mechanism view | open |
| q2-scale:1 Reading the Steps | dynamic | Dilute the acid step by step and say how the pH changes with each tenfold dilution. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| q2-scale:2 Between the Flasks | dynamic | Find the pH of the 3.2 × 10⁻⁴ M hydrochloric acid, to two decimal places. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| q2-scale:3 Two Meters | dynamic | Read both meters on the three sodium hydroxide flasks and find what the pH and the pOH add up to. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| q2-scale:4 Two Hydroxides Each | dynamic | Find the pH of the 0.025 M barium hydroxide, to two decimal places. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| q2-scale:5 Diluting Again and Again | dynamic | Keep diluting the hydrochloric acid and say what the pH does as the dilution continues. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| q2-scale:6 Warm Water | dynamic | Which best describes the pH of pure water after it is warmed to 50 °C? | units wobble and swap protons at the planner's ionized count | predict without lead-in | windows move (2026-11-06) |
| q2-scale:7 Warming the Water | dynamic | Warm the pure water to 50 °C and say whether it is acidic, neutral or basic. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| q2-scale:8 Sealed Flask | dynamic | Find the concentration of hydronium, in mol/L, in the sealed flask. | units wobble and swap protons at the planner's ionized count | - | windows move (2026-11-06) |
| q3-weak:1 Same Reading? | static | Which best describes the pH readings of 0.10 M hydrochloric acid and 0.10 M acetic acid, read side by side? | nothing | predict without lead-in; no mechanism view | open |
| q3-weak:2 Sorting the Flasks | dynamic | Sort the three flasks by how much of the acid has let go of its protons. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q3-weak:3 How Much Let Go | dynamic | Find the percent of the acetic acid that has ionized in this flask. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q3-weak:4 The Steady Ratio | dynamic | Arrange cards on the board into a ratio that reads the same number for all three acetic acid flasks. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q3-weak:5 A Concentration Between the Flasks | dynamic | Find the pH of 0.15 M acetic acid, to two decimal places. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q3-weak:6 Diluting the Acid | dynamic | Dilute the acetic acid and say what happens to the share of it that has ionized. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q3-weak:7 The Base Constant | dynamic | Arrange cards on the board into a ratio that reads the same number for all three ammonia flasks. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q3-weak:8 Acid and Base Together | static | Arrange cards so the board reads one number for all three pairs of an acid and its base. | nothing (exception: printed expression board (Ka)) | no mechanism view | open |
| q4-structure:1 Which Is Strongest? | static | Rank hydrogen fluoride, hydrogen chloride and hydrogen bromide from the strongest acid to the weakest. | nothing | predict without lead-in; no mechanism view | open |
| q4-structure:2 Racing the Halides | dynamic | Race the three acids and rank them from strongest to weakest. | protons fly from the acid window to the base window; counts follow the ones that have landed | - | windows move (2026-11-06) |
| q4-structure:3 Across a Row | dynamic | Rank methane, ammonia, water and hydrogen fluoride from strongest acid to weakest. | protons fly from the acid window to the base window; counts follow the ones that have landed | - | windows move (2026-11-06) |
| q4-structure:4 Extra Oxygens | dynamic | Rank the four chlorine acids from strongest to weakest. | protons fly from the acid window to the base window; counts follow the ones that have landed | - | windows move (2026-11-06) |
| q4-structure:5 Sharing the Charge | dynamic | Rank ethanol, acetic acid and formic acid from strongest to weakest. | protons fly from the acid window to the base window; counts follow the ones that have landed | - | windows move (2026-11-06) |
| q4-structure:6 Chlorine Nearby | dynamic | Rank acetic acid and its three chlorinated forms from strongest to weakest. | protons fly from the acid window to the base window; counts follow the ones that have landed | - | windows move (2026-11-06) |
| q4-structure:7 Bases from Acids | dynamic | Rank these four bases from the one that takes the fewest protons from acetic acid to the one that takes the most. | protons fly from the acid window to the base window; counts follow the ones that have landed | - | windows move (2026-11-06) |
| q4-structure:8 Five Unlabelled Acids | dynamic | Rank the five unlabelled acids from strongest to weakest. | protons fly from the acid window to the base window; counts follow the ones that have landed | - | windows move (2026-11-06) |
| q5-salts:1 Acid Used Up | dynamic | Pour in sodium hydroxide until no hydrochloric acid is left, then say whether the flask is acidic, neutral or basic. | units wobble as the base is poured | - | windows move (2026-11-06) |
| q5-salts:2 What Will It Read? | static | What will the pH be when acetic acid and sodium hydroxide are mixed in equal amounts, with none of either left over? | nothing | predict without lead-in; no mechanism view | open |
| q5-salts:3 Acetic Acid Used Up | dynamic | Pour in sodium hydroxide until no acetic acid is left, then say whether the flask is acidic, neutral or basic. | units wobble as the base is poured | - | windows move (2026-11-06) |
| q5-salts:4 Ammonia Used Up | dynamic | Pour in hydrochloric acid until no ammonia is left, then say whether the flask is acidic, neutral or basic. | units wobble as the base is poured | - | windows move (2026-11-06) |
| q5-salts:5 Four Salts | dynamic | Sort the four salt solutions into acidic, neutral and basic. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q5-salts:6 Acid Left Over | dynamic | Find the pH of the flask after 20.0 mL of 0.10 M sodium hydroxide has been poured into 30.0 mL of 0.10 M hydrochloric acid. | units wobble as the base is poured | - | windows move (2026-11-06) |
| q5-salts:7 A Salt Between the Flasks | dynamic | Find the pH of 0.10 M sodium acetate, to two decimal places. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | - | windows move (2026-11-06) |
| q5-salts:8 Three Unlabelled Salts | dynamic | For each unlabelled salt flask, say which of its parent acid and parent base is weak. | 200 units wobble; in a weak solution units hand over a proton and take it back, the ionized count held at the planner's | reward over limit | windows move (2026-11-06) |
| q6-titrate:1 Using Up the Acid | dynamic | Mark the volume of sodium hydroxide that has just used up all the hydrochloric acid in the flask. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | - | windows move (2026-11-06) |
| q6-titrate:2 The Next Acid | static | What will the pH be at the equivalence point when 0.100 M acetic acid is titrated with 0.100 M sodium hydroxide? | nothing | predict without lead-in; no mechanism view | open |
| q6-titrate:3 Two Acids, One Burette | dynamic | Find how the pH at the equivalence point of acetic acid compares with 7. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | - | windows move (2026-11-06) |
| q6-titrate:4 Half Way | dynamic | Read each flask when half the sodium hydroxide needed to use up its acid has been poured, and say what that reading equals. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | - | windows move (2026-11-06) |
| q6-titrate:5 The Right Dye | dynamic | Pick the dye that changes colour at the equivalence point of this titration. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | reward over limit | windows move (2026-11-06) |
| q6-titrate:6 More Than One Rise | dynamic | Titrate the sulfurous acid and say how many protons one molecule of it gives up. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | reward over limit | windows move (2026-11-06) |
| q6-titrate:7 How Strong Is the Acid | dynamic | Find the concentration of the hydrochloric acid in the flask, in mol/L. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | - | windows move (2026-11-06) |
| q6-titrate:8 A Sealed Weak Acid | dynamic | Find the Ka of the weak acid in the flask. | a drop falls on each pour; H₃O⁺ and OH⁻ dots move in the flask in the pH's ratio | - | windows move (2026-11-06) |
| q7-buffer:1 Which Moves More? | static | Which flask's pH moves more when acid is added to water and to acetic acid with sodium acetate? | nothing | predict without lead-in; no mechanism view | open |
| q7-buffer:2 The Same Acid, Two Flasks | dynamic | Add the same acid to both flasks and say which flask's pH moves more. | spheres wobble as acid or base is poured | - | windows move (2026-11-06) |
| q7-buffer:3 Making a Flask That Holds | dynamic | Make a flask that holds its pH when acid is poured in and when base is poured in. | spheres wobble as acid or base is poured | - | windows move (2026-11-06) |
| q7-buffer:4 Who Takes the Acid | dynamic | Pour acid into the mixture and say which of acetic acid and acetate takes it up. | spheres wobble as acid or base is poured | reward over limit | windows move (2026-11-06) |
| q7-buffer:5 The pH of a Mixture | dynamic | Find the pH of the flask with no meter, to two decimal places. | spheres wobble as acid or base is poured | - | windows move (2026-11-06) |
| q7-buffer:6 Making a Target pH | dynamic | Find the ratio of acetate to acetic acid that gives a pH of 4.40. | spheres wobble as acid or base is poured | - | windows move (2026-11-06) |
| q7-buffer:7 Base Into the Mixture | dynamic | Pour base into the mixture and say how its pH changes. | spheres wobble as acid or base is poured | reward over limit | windows move (2026-11-06) |
| q7-buffer:8 Sealed Flasks | dynamic | Pour acid and base into each sealed flask and name the one that is not a buffer. | spheres wobble as acid or base is poured | - | windows move (2026-11-06) |
| q8-capacity:1 Which Form? | static | Which form of acetic acid is there more of at pH 3, and which at pH 6? | nothing | predict without lead-in; no mechanism view | open |
| q8-capacity:2 Reading the Strip | dynamic | Read the strip at pH 3 and at pH 6 and say which form of acetic acid there is more of at each. | a row of 40 molecules trades protons; the share in each form is the curve's at the dial's pH | reward over limit | windows move (2026-11-06) |
| q8-capacity:3 An Indicator | dynamic | Find the pH at which methyl red is half in its red form and half in its yellow form. | a row of 40 molecules trades protons; the share in each form is the curve's at the dial's pH | - | windows move (2026-11-06) |
| q8-capacity:4 Two Concentrations | dynamic | Pour the same acid into both flasks and say which one holds its pH better. | spheres wobble as acid or base is poured | reward over limit | windows move (2026-11-06) |
| q8-capacity:5 The Limit | dynamic | Find how many pours of acid the second flask can take before its acetate is used up. | spheres wobble as acid or base is poured | reward over limit | windows move (2026-11-06) |
| q8-capacity:6 Three Ratios | dynamic | Pour the same base into each flask and say which one holds its pH best. | spheres wobble as acid or base is poured | reward over limit | windows move (2026-11-06) |
| q8-capacity:7 Acid on a Solid | dynamic | Pour acid into each beaker and say which solid dissolves more. | ions wobble; pellets dissolve as acid is poured | reward over limit | windows move (2026-11-06) |
| q8-capacity:8 Choosing an Acid | dynamic | Find which sealed acid would make the best buffer at pH 4.5. | a row of 40 molecules trades protons; the share in each form is the curve's at the dial's pH | reward over limit | windows move (2026-11-06) |

## Decisions the owner might want to reverse

- *Card* is the one word for every draggable (tiles, chips, tags, formula cards); the formula-bearing ones are "formula cards". If a card must be told
  apart from a tag card, the Tour already names them.
- *Particle window* for the magnified square of 200 (or 8) units; *counter* for the readout that counts H₃O⁺ and OH⁻.
- The exchange of protons in a weak solution is shown as cells swapping every 2.6 s. The rate is a drawing choice (not a measured rate); only the count is graded.
- The titration flask draws 24 dots in the ratio [H₃O⁺] : [OH⁻]. At pH 4 or below there are no blue dots, as in life, so the dots say little near the ends of the curve.
- The strip fixture grew by 5 units of height for its molecule row.

## Only the owner can judge these (most likely to lose a student first)

1. `q2-scale` 2 and 4 (typed pH from a logarithm): a primer is offered, but nothing on the bench makes the log visible.
2. `q3-weak` 4 and 7 (building Ka from cards): the expression board is printed numbers; the student does not see why products go over reactants.
3. `q6-titrate` 7 and 8 (concentration from the equivalence volume; Ka from the half-way point): multi-step arithmetic with the `amount` primer only.
4. `q4-structure` 3 to 8 (race ranking): the flight is new; whether eight races feel like a pattern or a chore needs a human eye.
5. Pacing of every new motion: the 2.6 s swap period, the 1.6 s proton crossing, the 0.6 s drop, and whether the wobble reads as heat and not as noise.
