# Teeter teaching pass (2026-11-06)

Run from `docs/archive/2026-11-11/fix-world-teaching-prompt.md` for WORLD = Teeter, UNIT = unit08. Nothing was played in a browser; the owner's rule is to play-test himself.

**This pass is partial, like Brinewire's.** It changed the words, added a glossary and a Teeter check, and put a moving mechanism view on every instrument that shows particles or amounts (seven fixture kinds). It did not rebuild the graded move of any stage: the student still turns dials, lays cards and types numbers. The second round (below) added moving models to q4, q8 stage 7 and the predict stages, and 3D dresses.

## Tally

| | Stages |
|---|---|
| Total (8 benches x 8 + Tipper 5) | 69 |
| With a live mechanism view in 2D and a 3D dress | 69 |
| Static | 0 |

Second round (same day): every stage now has a moving model. New: the reaction machine (cards that add into one reaction, with the particles that cancel fading), moving crowds in the K-check, lead-in clips on all nine predict stages, a gas box for Kp, and a 3D dress for every live fixture.
"Live" is checked by `tools/verify-teaching-teeter.mjs` (it moves with the clock, stands still with it frozen, stays under 160 circles in 2D and 220 spheres in 3D). It does **not** mean the student acts on the particles: in nearly every stage the graded move is still a dial, a card or a typed number.

## What was done

- **Language.** `pan(s)`, `rig`, `tile(s)`, `chip(s)`, `squeeze`, `room` and `push` are gone from play text (titles, prompts, hints, misses, rewards, labels, captions, Tour steps, bank). Vessel, ratio board, card, compress, volume, "lowers Q" and "drives" replace them. Internal ids (`pan`, `rig`, `panFixture`, `s2-squeeze`, kit id `pans`) are unchanged. The Tipper's phase 4 keeps its title "The Squeeze" (a boss may keep its fiction). Story painters and the saga were not edited.
- **Glossary.** `src/learn/glossary/teeter.js`: 18 terms with gloss and first stage, `BANNED`, and `NEEDS` (five stages offer the existing `ratio`, `amount` and `log` primers). Registered in `glossary/index.js`, so the bench frame's Glossary key and Primer key work for Teeter.
- **Doctrine.** Teeter had no entries in `WITHHELD_VOCAB`, so nothing was removed there. `CLAUDE.md` already carries the new language rule (Brinewire pass); its Teeter bullet is updated.
- **Mechanism views** (all on the 2D table's clock, `live(f, state)`; the same planner numbers as before are printed and graded):
  - `pan` (`q1-both`): 48 particles drift about their own patch; after Run the shown tick climbs from the old tick to the new one (14 ticks a second), so each particle changes colour in time and wears a ring for a moment after it changes.
  - `vessel` (`q6-lean`, Tipper 4): the sphere window's particles drift (faster, as a gas does) under the piston.
  - `beaker` (`q7-dissolve`): dissolved ions wander in the water.
  - `vsl` (`q2-k`, Tipper 2), `qk` (`q3-q`, Tipper 3), `icebars` (`q5-ice`, Tipper 5), `kbars` (`q8-free`): each bar is a crowd of drifting particles, and after Settle or Run the bar glides from the starting amount to the settled one over about two seconds. The cold pack's thermometer falls in time.
- **Checks.** `tools/verify-teaching-teeter.mjs` (in `npm run verify:teaching`): banned words, term-before-gloss, needs name a primer, mechanism views move/stand still/respond/stay small, ratchets for static ratio, predict lead-ins and reading load (`tools/teaching-ratchet-teeter.json`; `--strict` makes them fail). Updated `tools/lib/teeter-q8-checks.mjs` (it looked for the word "pan" in a refusal).

## Open work, in the order I would do it

1. **The graded move is still a dial, card or typed number in nearly every stage.** The prompt asks for the student to act on the particles. Best targets: `q1-both` 1/4 (release particles from a dish and watch both changes), `q2-k` 2-4 (drag particles into the ratio), `q3-q` (pour a mixture), `q5-ice` 1 (draw the change columns by dragging particles), `q4-properties` (drag a particle between two cards to flip or scale it).
2. **Hints and misses** do not replay the mechanism; there is no "What is this?" action; the Tour has no animation first (the clips are on the predict stages only).
3. **Reading load:** 14 prompt, reward or hint items over the limit (ratchet).
4. **Maths primers** are offered at five stages (`ratio`, `amount`, `log`); `q5-ice` stages 2 and 4 (a quadratic, a square root) and `q8-free` (the exponential) have no primer that teaches them. Recap cards for moles, concentration and pressure (Tallow, Bellows) are not written.
5. **Reward models** are on none of the live stages; **bank** (`unit08.json`) was only reworded, not rewritten against the glossary.
6. **3D was not seen.** The dress is checked in Node only (it builds, moves, holds still under reduced motion, stays under the sphere cap). Whether it reads well, sits right on each deck, or collides with the knobs and cards needs a human eye at 3D On.
7. **Boss and shared checks** that other sessions own (`unit09`, `unit10`) fail for reasons outside Teeter.
8. `git stash@{0}` from the first round still exists; it holds only older copies of files now in the tree and is safe to drop.

## Decisions the owner might reverse

- "Pan" became **vessel** everywhere in play text, including the Tipper's stages; the boss may keep fiction names if you prefer "pan" there.
- The ratio instrument's fiction name **rig** became **ratio board**; K-algebra **tiles** and ICE **chips** became **cards**.
- Particles in the vessel are drawn drifting, not bouncing: it is the planner's colour that is honest, the position is decoration of the same kind as the old jitter.

## Stage audit (generated from the source)

| Stage | Now | Prompt | What moves | Open defects |
|---|---|---|---|---|
| q1-both:1 A Alone | dynamic | Run the vessel until the amounts stop changing, then set the dial to what it holds. | pan, selector (drifting particles / glide) | no reward model |
| q1-both:2 What Is Happening? | dynamic | Once the graph is flat, which best describes what the particles in the vessel are doing? | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q1-both:3 Ringed Particles | dynamic | Say what the ringed particles show is happening in the settled vessel. | pan, selector (drifting particles / glide) | no reward model |
| q1-both:4 B Alone | dynamic | Run the B-only vessel until it stops changing, then set the dial to where its A ends against the dashed line. | pan, selector (drifting particles / glide) | no reward model |
| q1-both:5 A Picture of the Settled Vessel | dynamic | Lay the particle diagram that matches the vessel once it is in equilibrium. | pan (drifting particles / glide) | no reward model |
| q1-both:6 Two Settled Vessels | dynamic | Lay the statement that these two settled vessels show to be false. | pan (drifting particles / glide) | no reward model |
| q1-both:7 Writing the Vessels | dynamic | Lay on each vessel the arrow card that describes how it reacts. | pan (drifting particles / glide) | no reward model |
| q1-both:8 Sealed Vessels | dynamic | Set the dial to the vessel that has reached equilibrium. | pan, selector (drifting particles / glide) | no reward model |
| q2-k:1 Where Do They End? | dynamic | Which best describes the three vessels once each has settled? | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q2-k:2 The Ratio Board | dynamic | Arrange cards on the ratio board into a ratio that comes out the same for all three settled vessels. | vsl, rig (drifting particles / glide) | no reward model |
| q2-k:3 Two of the Same | dynamic | Arrange cards on the ratio board into a ratio that comes out the same for all three settled vessels of this reaction. | vsl, rig (drifting particles / glide) | no reward model |
| q2-k:4 A Vessel With Solids | dynamic | Arrange cards on the ratio board into a ratio that comes out the same for all three settled vessels of this reaction. | vsl, rig (drifting particles / glide) | reward over 40 words; no reward model |
| q2-k:5 Find K | dynamic | Find K for this vessel, to two significant figures. | vsl (drifting particles / glide) | no reward model |
| q2-k:6 Nearly All the Way | dynamic | Set the dial to the vessel whose reaction goes nearly to completion. | vsl, selector (drifting particles / glide) | no reward model |
| q2-k:7 Hardly Started | dynamic | Set the dial to the vessel that will have made the least B once it has settled. | vsl, selector (drifting particles / glide) | no reward model |
| q2-k:8 Three Sealed Vessels | dynamic | Lay on each vessel the card with the K that belongs to it. | vsl (drifting particles / glide) | no reward model |
| q3-q:1 Already at Rest | dynamic | Lay the mixture that is already in equilibrium. | qk (drifting particles / glide) | no reward model |
| q3-q:2 Far More B | dynamic | Which best describes what this mixture does when it is left alone? | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q3-q:3 Run It | dynamic | Press "Run" and set the dial to the way the mixture moves. | qk, selector (drifting particles / glide) | reward over 40 words; no reward model |
| q3-q:4 Which Makes More B | dynamic | Lay the mixture that will make more B when it is left alone. | qk (drifting particles / glide) | no reward model |
| q3-q:5 A New Reaction | dynamic | Which best describes what this mixture does when it is left alone? | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q3-q:6 Run the New Mixture | dynamic | Press "Run" and set the dial to the way the mixture moves. | qk, selector (drifting particles / glide) | no reward model |
| q3-q:7 Which Makes More NO₂ | dynamic | Lay the mixture that will make more NO₂ when it is left alone. | qk (drifting particles / glide) | reward over 40 words; no reward model |
| q3-q:8 Three Sealed Mixtures | dynamic | Lay each mixture under the way it will move when it is left alone. | qk (drifting particles / glide) | no reward model |
| q4-properties:1 The Other Way Round | dynamic | Lay the K card for E ⇌ 2 D, which is the card 2 D ⇌ E written in the reverse direction. | kcheck (drifting particles / glide) | no reward model |
| q4-properties:2 Doubling a Reaction | dynamic | What happens to the K of A + B ⇌ C when every amount in it is doubled? | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q4-properties:3 Every Amount Doubled | dynamic | Lay the card for the K of F + G ⇌ H when every amount in it is doubled. | kcheck (drifting particles / glide) | no reward model |
| q4-properties:4 Every Amount Halved | dynamic | Lay the K card for M + N ⇌ W, which is 2 M + 2 N ⇌ 2 W with every amount halved. | kcheck (drifting particles / glide) | no reward model |
| q4-properties:5 Two Reactions in a Row | dynamic | Lay the card for the K of the reaction X ⇌ Z. | kcheck (drifting particles / glide) | no reward model |
| q4-properties:6 Reach the Reaction | dynamic | Stack the cards so that they add up to 2 A + 2 B ⇌ 2 D. | kstack (drifting particles / glide) | no reward model |
| q4-properties:7 K From Pressures | dynamic | Lay the card for Kp of N₂O₄ ⇌ 2 NO₂ at 298 K, which has Kc 0.0059. | plaque, pgas (drifting particles / glide) | reward over 40 words; no reward model |
| q4-properties:8 The Wanted K | dynamic | Type the K of the reaction 2 A ⇌ C. | kstack (drifting particles / glide) | no reward model |
| q5-ice:1 Change in Each Column | dynamic | Lay a change card in each column to show how each substance changes while the vessel settles. | iceboard, icebars (drifting particles / glide) | reward over 40 words; no reward model |
| q5-ice:2 A Perfect Square | dynamic | Type the concentration of HI when this vessel has settled, in moles per litre. | iceboard, icebars, plaque (drifting particles / glide) | no reward model |
| q5-ice:3 How Much Changes? | dynamic | How much of 1.0 M N₂O₄ turns into NO₂ when K for N₂O₄ ⇌ 2 NO₂ is 0.0059? | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q5-ice:4 A Small K | dynamic | Type the concentration of NO₂ when this vessel has settled, in moles per litre. | iceboard, icebars, plaque (drifting particles / glide) | no reward model |
| q5-ice:5 Is the Shortcut Fair? | dynamic | Set the dial to the vessel where the small-x approximation is fair. | icebars, selector (drifting particles / glide) | no reward model |
| q5-ice:6 K From One Reading | dynamic | Type K for this reaction from the amount of HI the vessel holds when it has settled. | iceboard, icebars, plaque (drifting particles / glide) | no reward model |
| q5-ice:7 A Small Start | dynamic | Type the concentration of NO₂ when this vessel has settled, in moles per litre. | icebars, plaque (drifting particles / glide) | no reward model |
| q5-ice:8 Two Vessels, One K | dynamic | Type the concentration of HI when Vessel B has settled, in moles per litre. | icebars, plaque (drifting particles / glide) | no reward model |
| q6-lean:1 Adding H₂ | dynamic | Add H₂ to the settled vessel, then set the dial to what happens to the N₂ amount. | vessel, selector (drifting particles / glide) | no reward model |
| q6-lean:2 Compressing the Vessel | dynamic | Compress the vessel, then set the dial to whether it holds more, fewer or the same gas molecules once settled. | vessel, selector (drifting particles / glide) | no reward model |
| q6-lean:3 Argon in the Vessel | dynamic | Lay the card for what adding argon, a gas that does not react, does to the NH₃ amount in a fixed-size vessel. | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q6-lean:4 Argon Added | dynamic | Add argon to the vessel and set the dial to what happens to the NH₃ amount. | vessel, selector (drifting particles / glide) | no reward model |
| q6-lean:5 Heating Two Vessels | dynamic | Heat each vessel, then set the dial to where heating makes K larger. | vessel, selector (drifting particles / glide) | reward over 40 words; no reward model |
| q6-lean:6 Iron Powder | dynamic | Run both vessels, then set the dial to what the iron powder changes. | vessel, selector (drifting particles / glide) | reward over 40 words; no reward model |
| q6-lean:7 Moving Q | dynamic | Sort the changes by what each does to Q at the moment it is made. | vessel (drifting particles / glide) | no reward model |
| q6-lean:8 Taking NH₃ Out | dynamic | Take some NH₃ out of the settled vessel, then set the dial to its NH₃ amount once it settles again, compared with before. | vessel, selector (drifting particles / glide) | reward over 40 words; no reward model |
| q7-dissolve:1 Adding Solid | dynamic | Add CaF₂ until another scoop no longer changes either meter. | beaker (drifting particles / glide) | reward over 40 words; no reward model |
| q7-dissolve:2 Writing the Expression | dynamic | Write the equilibrium constant expression for Ag₂CrO₄ dissolving in water. | beaker, kspform (drifting particles / glide) | no reward model |
| q7-dissolve:3 How Much Dissolves | dynamic | Type how many moles of AgCl dissolve in one litre of water, in mol/L. | beaker, plaque (drifting particles / glide) | no reward model |
| q7-dissolve:4 Which Dissolves More | dynamic | Which salt holds more dissolved in water, AgCl or Ag₂CrO₄? | clip, plaque (drifting particles / glide) | predict without a lead-in; no reward model |
| q7-dissolve:5 Two Beakers | dynamic | Set the dial to the salt that has more dissolved in its beaker. | beaker, selector (drifting particles / glide) | no reward model |
| q7-dissolve:6 Salt Already in the Water | dynamic | Set the dial to the beaker that holds more dissolved BaSO₄. | beaker, selector (drifting particles / glide) | no reward model |
| q7-dissolve:7 Mixing Two Solutions | dynamic | Set the dial to the mixture in which a precipitate forms. | beaker, selector (drifting particles / glide) | no reward model |
| q7-dissolve:8 Two Salts, One Added Ion | dynamic | Set the dial to the salt whose solubility drops by the larger factor when 0.10 mol/L of a common ion is added. | beaker, selector (drifting particles / glide) | reward over 40 words; no reward model |
| q8-free:1 A Positive ΔG° | dynamic | Predict what a vessel of a reaction with ΔG° = +8 kJ/mol holds once it has settled, starting from reactant alone. | clip (drifting particles / glide) | predict without a lead-in; no reward model |
| q8-free:2 ΔG° and Where a Vessel Settles | dynamic | Lay each ΔG° card on the vessel it belongs to. | kbars (drifting particles / glide) | reward over 40 words; no reward model |
| q8-free:3 K From ΔG° | dynamic | Type the K of a reaction with a ΔG° of −10.0 kJ/mol at 298 K. | kbars, plaque (drifting particles / glide) | reward over 40 words; no reward model |
| q8-free:4 Warming a Vessel | dynamic | Set each dial to what warming does to the amount of product the vessel holds. | kbars, selector (drifting particles / glide) | no reward model |
| q8-free:5 Salts in Water | static | Set the dial to the salt that dissolves on its own at 298 K. | - | cards or dials over a readout; no moving model |
| q8-free:6 A Cold Pack | static | Lay the card that explains what happens in the beaker. | - | cards or dials over a readout; no moving model |
| q8-free:7 Two Reactions Together | dynamic | Make the stack add up to glucose + ATP → glucose-6-phosphate + ADP, then set its net ΔG°. | stack, selector, plaque (drifting particles / glide) | no reward model |
| q8-free:8 Three Reactions | static | Set the dial to the reaction whose vessel would settle with the most product at 298 K. | - | cards or dials over a readout; no moving model |
| boss-tipper:1 Phase 1 · The Vessels | dynamic | Set the dial to the vessel that has reached equilibrium. | pan, selector (drifting particles / glide) | no reward model |
| boss-tipper:2 Phase 2 · The Burner | dynamic | Find K for this vessel, to two significant figures. | vsl (drifting particles / glide) | no reward model |
| boss-tipper:3 Phase 3 · The Draw | dynamic | Lay the mixture that will make more A when it is left alone. | qk (drifting particles / glide) | no reward model |
| boss-tipper:4 Phase 4 · The Squeeze | dynamic | Compress the vessel, then set the dial to what happens to the NO₂ amount. | vessel, selector (drifting particles / glide) | no reward model |
| boss-tipper:5 Phase 5 · The Feed | dynamic | Type the concentration of HI when this vessel has settled, in moles per litre. | icebars, plaque (drifting particles / glide) | no reward model |

## Only the owner can judge these

Ordered by how likely a first-time student is to get stuck:

1. `q4-properties` 1 to 8: the algebra of K now has the reaction machine and the moving K-check, but the student still only lays cards; whether the fading of cancelled particles reads as "cancel" is the thing to look at.
2. `q5-ice` 2, 4, 6, 7, 8: solving for x (a perfect square, a small-x shortcut) with no maths teaching.
3. `q8-free` 1 to 8: ΔG°, ln and exp with no primer for exp; "spontaneous" is glossed only in the Glossary.
4. The nine predict stages now have a looping clip. Judge whether each clip pictures the idea without leaning to an answer (`q3-q` 2 and 5 start from a B-heavy vessel; `q4-properties` 2 shows a settled vessel; `q8-free` 1 shows ΔG° of −4 kJ/mol where the stage asks about +8).
5. Pacing of the new motion: 14 ticks a second after Run, two seconds for a bar to glide, drift speed of particles. Judge whether the ring on a changed particle reads as "this one just changed".
6. The 3D dress: spheres hover over each deck at their own heights and bars stand up as glass columns. Judge the heights, colours and whether the columns hide the numbers printed on the deck.
7. Whether the drifting crowd inside the thin bars of `q2-k`, `q3-q` and `q5-ice` reads as particles or as noise at 375 px.


## Second round: what was built (2026-11-06)

- `pans-cards.js`: `paintMachine` (a row per card: particles it uses, particles it makes; a particle one card makes and another uses pulses out as the two cancel; the bottom row is the net). Used by `kstack` (q4 stages 6 and 8) and a wrapper for the heat kit's `stack` (q8 stage 7). `kcheck` draws its bars as crowds and rings the species in the cards laid on it.
- `pans-clips.js`: `clip` (scenes `react`, `gasadd`, `dissolve`, `hill`) on the nine predict stages, and `pgas` (a one-litre gas box showing p = c × RT) on q4 stage 7. Stage tables were enlarged or rearranged where the new fixtures needed room (q1, q2, q3, q4, q5, q6, q8 predict stages; q4 stages 6, 7, 8; q8 stage 7).
- `pans-3d.js`: one 3D dress for every live fixture. It runs the fixture's own flat painter against a recording context each frame: filled circles become spheres, ringed circles rings, coloured rectangles glass columns, and circles drawn inside a column float inside it. So the 3D crowd is, particle for particle, the flat one. Installed by `installDresses()` after all benches register.
- Checks: `verify-teaching-teeter.mjs` steps every live fixture in 2D and 3D, and counts a clip as a lead-in (9 of 9).


## Third round (2026-11-06): answers by touching the particles, an animated Tour, misses that replay

**Answers by tapping the thing.** A new `choice` fixture (`pans-choice.js`) keeps an answer without a knob: the student taps the vessel, beaker, salt, reaction or column that is the answer and it is framed in amber. Underneath it is the same `value` dial an answer dial had, so every `check()` and scripted solution is unchanged; a fixture is made tappable with `pickable(fixture, n)` or `pickColumns(vsl)` (`props.pick`, read by `table/gestures.js` `fixtureHit`, so it works in 2D and 3D). "The same" is kept as a plate on the choice itself. Stages converted (11): `q1-both` 8, Tipper phase 1, `q2-k` 6 and 7, `q5-ice` 5, `q7-dissolve` 5 to 8, `q8-free` 5 and 8. The substances of `q2-k` (ratio board) and the changes of `q5-ice` are now spheres on bases (`pans-puck.js`, flat and in 3D) rather than cards, dragged exactly as before.

**Misses replay the cause.** `stagerunner.js submit()` calls `tabletop.replay()` after a miss; the kit's `replay()` (`PANS_KIT`) restarts every vessel's run from tick 0 at 36 ticks a second with each change ringed (`replayPans`), and every bar's glide from its starting amount (`replayGlide`, `replaySettle`). The miss message is shown as before.

**The Tour is a film.** Every Tour step can carry a `demo` (`table/tour-demo.js`): a real stage's table played with that stage's own scripted solution (pieces dragged, keys pressed, an answer tapped) on a canvas in the step, drawn by `drawTable`. All 30 steps of Teeter have one, and every step is at most 16 words (most under 9). Repeated instruments (three vessels) get one step. The general steps (moving pieces, trays, prediction) are films too. The text lives in `pans-tour-min.js`.

**Still a dial, a card or a number** (not converted this round):
- `q6-lean` all: the vessel is changed by dials (add, volume, temperature, catalyst), and its answer is an outcome dial.
- `q1-both` 1, 3, 4: outcome dials; `q3-q` 3 and 6: a "which way" dial; `q8-free` 4: two outcome dials; `q8-free` 7: an answer dial.
- Every typed number (`q2-k` 5, `q3`..`q5`, `q7` 3, `q8` 3, Tipper 2 and 5).
- Cards that are cards: predict guesses (by rule), reaction cards, diagram cards, mixture cards, K-algebra number cards.
Next candidates: pour H₂ particles into the vessel from a source (replace the `add` dial), drag the piston, and build the answer as a particle picture (drag particles into the answer vessel) for the outcome and number stages.


## Fourth round (2026-11-06): `q6-lean` and the Tipper's phase 4 are touched, not dialled

The stress vessel (`touch: true`, `pans-stress.js`) has no knobs. Under its graph is a strip of apparatus and the window holds the piston; every control is a tap zone (`gestures.js` `tap` hit, `kit.tapZones`):
- **Supply of gas** (H₂ in stage 1, argon in stage 4): each tap adds one step; past the top it empties; a small "empty" plate resets it. **Trap** (stage 8): the same, taking NH₃ out.
- **Burner and ice** (stage 5): each tap on the burner adds 25 K, each tap on the ice takes 25 K off.
- **Piston** (stages 2 and the Tipper): drag it in the window; the height of the pointer sets the volume.
- **The answer is a place on the graph.** Where the old stages set an outcome dial (rises / falls / the same), the student taps the graph above, on or below the dashed level the species stood at before the change (three labelled bands). The band sets the same answer dial as before (`answer: {target, watch, higher, same, lower}`), so the checks and scripted solutions are unchanged. Stages 1, 4, 8 and the Tipper's phase 4.
- **Stage 5's answer** is a tap on the vessel (the same `pickable`), with two plates for "both" and "neither" (`choiceFixture(..., {plates})`).
- A miss now also replays the vessel's run from the moment of the change (`replayVessels`).
- The Tour's vessel film and text were updated; the harnesses (`verify-table.mjs`, `verify-bench.mjs`) tap the zones as a person would (stepping zones are tapped as many times as the step needs; the piston is touched at the height the value maps to).

**Left as dials or cards in this bench:** stage 2's answer (more / fewer / the same molecules) is still an answer dial; stage 6 (iron powder) answers with an outcome dial; stage 7 still chooses the change with the vessel's menu dial and sorts cards.
**Not verified:** `verify:bench` stops at an error in `ph-transfer.js` (Verdigris, another session) when it reaches `unit09`; Teeter's stages ran before that and reported nothing. `verify:run` and `verify:learn` have failures in `unit09` for the same reason.
