# Brinewire teaching pass (2026-11-06, second run)

Run from `docs/archive/2026-11-11/fix-world-teaching-prompt.md` for WORLD = Brinewire, UNIT = unit10. Nothing was played in a browser; every claim below is from source, Node checks and the bench checks.

## Tally

| | Stages (53 = 6 benches x 8 + the Clamp's 5) |
|---|---|
| With a live mechanism view | 53 |
| of which a model beside, under or inside the bench (3D at `3D On`, flat at `3D Off`) | 50 |
| of which drawn inside the rig's own beakers (flat) | 3 (`q3` 4 and 8, `q4` 1) |
| Static | 0 |

Eight crowded tables were re-laid so a full-size model fits inside them (`kits/cell-room.js` finds the empty rectangle): `q1` 1 (cards in a 2 x 2 block, trays lower), `q1` 5 and `q2` 6 (wider, model beside the instrument), `q2` 2 and `boss-clamp` 1 (strips in a row under the rack, wider), `q2` 5 (name cards in a column beside the rack, model under the strips), `q2` 8 (strips in a row), `q3` 7 (chips and plaque tightened, shorter). Widths stay under the 340 px limit of each table's pieces (`verify:table`) and heights never grow (`verify:bench`). The hovering-model fallback (`props.hover`, a thumbnail on the table) is still in the code for a table with no empty rectangle; none uses it now.

## Third run: particle answers, an animated Tour, misses that replay

- **Answers on particles.** A new layer, "sites" (`kits/cell-sites.js`, `cell-site-sets.js`): resting particles in the moving model (electron rings either side of a strip, atom copies, the four kinds of particle in a beaker, an iron nail per beaker) that a tap sets. A site sets a hidden dial, so each stage still grades on the same planner. `kit.hotspots` is read by `gestures.js` (flat) and by `table3d.js` (a ray that meets a site's sphere), and `verify:table` / `verify:bench` play the solutions by tapping them. Also fixed: the 3D model was scaled to the box and not to the flat fit, so 3D and flat disagreed on where a particle was.
  - Now answered on particles, strips or beakers: `q1` 1 (tap each particle to read and mark its oxidation number), 3, 4, 7 (electron rings and atom copies on the strips), `q2` 1 (tap the beaker), 2, 5, 7 and `boss-clamp` 1 (the strips themselves go on the rail; hydrogen is a bubble piece), 6 (tap the nails), 8 (the chosen strip goes in the answer seat). Their name cards, trays and dials are gone.
  - Fourth run (the remaining 21): `q1` 5 (tap the metal or the ion that gives up electrons, in two beakers), 8 (tap the redox reactions among four sealed beakers drawn side by side), `q3` 4 (tap each strip: atoms leave or join), 5 and 6 (tap the beaker or strip), `q4` 1 (the electrodes themselves go on the rail), 3 (tap the lamp of each cell that lights), `q5` 2 (tap each kind of ion still there), 5, 8 (tap the bar or beaker), 7 (prepared cells are cans on the rail), `q6` 2 (tap the electrode that makes sodium), 7 (gas bubbles in the tube seats), `boss-clamp` 2 and 4 (tap the strip or bar). Selectors that stay on the stage are readouts (`hideDials`): nothing can turn them.
  - **Still on a dial, tray or card (5), kept on purpose:** `q1` 6 (balancing an equation in acid is bookkeeping with six counts), `q2` 4, `q4` 5 and `q5` 3 (each says in a statement what a reading does: a prediction's result, not a thing in the model), `q6` 3 (ranking three runs by current times time is arithmetic). The count is a ratchet (`cardOrDial`: 5).
  - **Leaks found and fixed:** the model named the sealed metals (colour and symbol) in `q2` 7, `q3` 8, `q4` 8 and `q6` 8, and drew the real concentrations in the sealed cell of `q5` 8. Sealed benches now draw grey bars, a letter and equal crowds; `verify:teaching` holds it.
- **Animated Tour.** Every tool has a clip: the real stage's table and its own solution played with a hand (`table/tour-demo.js`, built by the other teaching session, which I extended so the hand can touch a site; `kits/cell-tour-demos.js`). Words are one short line each (`kits/cell-tour-min.js`, at most 12 words, checked).
- **Misses replay.** A wrong commit calls `kit.onMiss(table, msg)` (the runner passes the message): the model restarts for six seconds, what does not add up (an electron with nowhere to go, an ion with no electron) is ringed in amber, and the reason is written over the model; the 3D spheres pulse.

## What was built

- **Doctrine and rules.** `CLAUDE.md`, `PRODUCT.md`: real term with a gloss on first use, one term per concept; `WITHHELD_VOCAB` keeps only answers (removed lines in `withheld-vocab-removed.txt`). `docs/general-problems.md` and `docs/archive/2026-11-11/fix-world-teaching-prompt.md` now require 3D visualizations wherever possible (hovering is fine).
- **Glossary** `src/learn/glossary/brinewire.js` (28 terms, banned synonyms, per-stage needs) and the Glossary key; hints that use a term get a "What is this?" key that opens the Glossary at that term.
- **Primer key** (`engine/primers.js`, `NEEDS`): hands-on panels with sliders for powers of ten and the logarithm, a ratio, the ampere-to-gram ladder, and atoms becoming ions. Ten stages offer one (`q1` 1; `q4` 6, 7; `q5` 4, 6, 7; `q6` 3, 4, 5, 8).
- **Mechanism engine.** `engine/cellscene.js` (pure): a spec of vessels, strips, a wire, a salt bridge, ions and bubbles becomes boxes, balls and lines at time `t`. `kits/cell-scenes.js` builds the spec for each instrument from its own read function: ledger cards (electron transfer), the redox beaker and probe, the dip rack and nails (displacement, bubbles, coating), the galvanic rig (the bridge decides whether electrons flow), the ready cell, the load run, the read bench and the concentration cell (ion counts follow the concentration), the potential board (electrons toward or away from the hydrogen reference), and every supply scene (reverse a cell, molten salt, plating, water, brine). `kits/cell-scene.js` shows it: a 3D dress (glass vessels, strips, ions and electrons as spheres in the host's own materials, ticking with `dt`) and a flat painter at the table clock; `kits/cell-attach.js` adds it under every stage. Shared engine change: `Table2D.tick` runs a kit's `live(state)` and passes a clock; reduced motion freezes it.
- **Predict lead-ins** (5 of 5): a fixed, control-free clip (zinc in copper salt; the unconnected cell; a running cell) shown before each guess; none shows the answer.
- **Reading load**: 28 rewards trimmed (derivations dropped, one new fact and the term); prompts and hints were already within the limit.
- **Words**: "strength" is now "concentration" in play text, tour, bank; "ledger", "chips", "push" removed.
- **Checks** (`npm run verify:teaching`): banned words in stages and the bank; a term used before its stage; every need names a primer that runs; the model moves, responds to the circuit and stays under 80 primitives; static ratio, predict lead-ins and reading load by ratchet (`tools/teaching-ratchet.json`: 8, 0, 0).

## Not done, and why

1. **21 stages are still answered on a dial, tray or card** (listed above).
2. The three rig-embedded models (`q3` 4 and 8, `q4` 1) are flat only.
3. **`q1` 6 (acid balance)** has the transfer model but not hydrogen ions and water in motion.
4. **3D for the two embedded rigs** (`cellgalv`, `cellboard`): the particles are painted into their flat beakers, not added to their 3D glass.
5. **Hint rungs and miss messages** were not rewritten stage by stage, and **misses do not replay the cause in the model**.
6. **No reward model** was added to stages that lack one, and the **Tour has no animated loop**.
7. **The bank** only had banned words removed; it was not re-worded against the glossary and has no mechanism views.
8. The hand-read audit of section 3 (every noun classified) was not done; the table below is generated from the source and shows what the checks can see.

## Stage audit (generated)

| Stage | Now | Prompt as written | On the bench (fixture kinds) | Defects found | Done |
|---|---|---|---|---|---|
| q1-halves:1 Before and After | static | Sort the four cards by whether the probe reads the same number before and after. | cellredox, cellprobe; pieces: tag | static | open: no room beside the pieces at the phone floor |
| q1-halves:2 Where They Go | dynamic | Where do the two electrons that each zinc atom loses end up? | cellscene; pieces: note | - | 3D/flat model added; primer if it needs maths |
| q1-halves:3 Writing the Halves | dynamic | Write each half of the zinc and copper reaction so that its charge balances. | cellledger, cellscene | - | 3D/flat model added; primer if it needs maths |
| q1-halves:4 Matching the Electrons | dynamic | Balance aluminium with copper(II) ions so no electrons are left over. | cellledger, celltally, cellscene | - | 3D/flat model added; primer if it needs maths |
| q1-halves:5 Who Gives (Beyond the Exam) | static | Lay the species that gives up its electrons in each beaker on its slot. | cellredox, cellprobe; pieces: tag | static | open: no room beside the pieces at the phone floor |
| q1-halves:6 Permanganate in Acid | dynamic | Balance the permanganate half in acid by placing electrons, hydrogen ions and water. | cellledger, plaque, cellscene | - | 3D/flat model added; primer if it needs maths |
| q1-halves:7 Joining Two Halves | dynamic | Join the permanganate half and the iron(II) half so that no electrons are left over. | cellledger, celltally, cellscene | - | 3D/flat model added; primer if it needs maths |
| q1-halves:8 Four Sealed Reactions | dynamic | Sort the four sealed reactions into redox and not redox. | cellprobe, cellscene; pieces: tag | - | 3D/flat model added; primer if it needs maths |
| q2-activity:1 Coated or Clean | dynamic | Find the solution that put a coating on both of the other metals. | celldip, selector, cellscene; pieces: celldipstrip | - | 3D/flat model added; primer if it needs maths |
| q2-activity:2 Ranking Four Metals | static | Rank zinc, iron, lead and copper from the metal that gives electrons most readily to the one that gives least. | celldip; pieces: celldipstrip, tag | static | open: no room beside the pieces at the phone floor |
| q2-activity:3 Back the Other Way | dynamic | A zinc strip is coated with copper in a copper solution; what does a copper strip do in a zinc solution? | cellscene; pieces: tag, note | - | 3D/flat model added; primer if it needs maths |
| q2-activity:4 Copper in Zinc | dynamic | Dip a copper strip in the zinc solution and say what happens to it. | celldip, selector, cellscene; pieces: celldipstrip | - | 3D/flat model added; primer if it needs maths |
| q2-activity:5 Hydrogen in the List | static | Place hydrogen in the list of the five metals, from most readily giving electrons to least. | celldip; pieces: celldipstrip, tag | static | open: no room beside the pieces at the phone floor |
| q2-activity:6 Iron and a Partner | static | Find which metals, wired to an iron nail, keep it from rusting in brine. | celldipnails; pieces: tag | static | open: no room beside the pieces at the phone floor |
| q2-activity:7 The Sealed Strip | dynamic | Place the sealed metal X in the list of zinc, iron, lead and copper. | celldip, cellscene; pieces: celldipstrip, tag | - | 3D/flat model added; primer if it needs maths |
| q2-activity:8 Take Out the Copper | static | Choose a strip that takes the copper out of a solution of copper(II) and iron(II) ions and leaves the iron ions. | celldip, selector; pieces: celldipstrip | static | open: no room beside the pieces at the phone floor |
| q3-galvanic:1 A Wire Between Beakers | dynamic | With a wire joining a zinc electrode in zinc sulfate to a copper electrode in copper sulfate, what does the ammeter show? | cellscene; pieces: tag, note | - | 3D/flat model added; primer if it needs maths |
| q3-galvanic:2 Keep It Running | dynamic | Make the ammeter keep a current for the whole run. | cellgalv, cellgalvplot, cellscene; pieces: cellgalvtube, cellgalvrod, cellgalvwire | - | 3D/flat model added; primer if it needs maths |
| q3-galvanic:3 Which Way the Electrons Go | dynamic | Say which beaker the electrons move toward in each cell, from its ammeter. | cellgalv, cellscene | - | 3D/flat model added; primer if it needs maths |
| q3-galvanic:4 Atoms Leave, Atoms Join | dynamic | Mark the strip where atoms leave it and the strip where atoms join it, in the zinc–copper cell. | cellgalv; pieces: tag | - | model drawn inside the rig |
| q3-galvanic:5 What the Bridge Carries | dynamic | Show which way the negative ions in the bridge move while the cell runs. | cellgalv, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| q3-galvanic:6 Weighing the Strips | dynamic | Weigh each strip before and after the run, and say which one gained mass. | cellgalv, cellgalvbal, selector, cellscene; pieces: cellgalvstrip | - | 3D/flat model added; primer if it needs maths |
| q3-galvanic:7 Shorthand (Beyond the Exam) | static | Write the zinc–copper cell in shorthand. | plaque; pieces: chip | dials/cards over a readout; static | open: no room beside the pieces at the phone floor |
| q3-galvanic:8 The Sealed Cell | dynamic | Find the anode of the sealed cell. | cellgalv, cellgalvbal; pieces: cellgalvstrip, note | - | model drawn inside the rig |
| q4-potential:1 Against a Reference | dynamic | Rank the four metals by the voltage each one reads against the hydrogen reference. | cellboard; pieces: cellelectrode, tag | - | model drawn inside the rig |
| q4-potential:2 A Cell Nobody Wired | dynamic | Find the voltage, in volts, of a cell made from magnesium and silver. | cellboard, cellscene; pieces: cellelectrode | - | 3D/flat model added; primer if it needs maths |
| q4-potential:3 Which Cells Run | dynamic | Run the four cells and sort them by whether the lamp lights. | cellrig, cellscene; pieces: tag | - | 3D/flat model added; primer if it needs maths |
| q4-potential:4 Twice Over | dynamic | What does a zinc–copper cell that reads 1.10 V read when its equation is written twice over? | cellscene; pieces: tag, note | - | 3D/flat model added; primer if it needs maths |
| q4-potential:5 Writing It Twice | dynamic | Run the zinc–copper cell with its equation written once and then twice over, and say what changes. | cellrig, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| q4-potential:6 The Energy Released | dynamic | Find the energy, in kJ, released when one mole of magnesium reacts with copper(II) ions. | cellrig, plaque, cellscene | - | 3D/flat model added; primer if it needs maths |
| q4-potential:7 How Far It Goes | dynamic | Find log K, to the nearest whole number, for zinc reacting with silver ions. | cellrig, plaque, cellscene | - | 3D/flat model added; primer if it needs maths |
| q4-potential:8 Two Sealed Metals | dynamic | Find the voltage, in volts, of a cell made from the two sealed metals. | cellboard, cellscene; pieces: cellelectrode | - | 3D/flat model added; primer if it needs maths |
| q5-load:1 Run Until It Stops | dynamic | When a tin and lead cell has driven a small load until its voltmeter reads zero, what does each beaker hold? | cellscene; pieces: tag, note | - | 3D/flat model added; primer if it needs maths |
| q5-load:2 The Cell Runs Down | dynamic | Run the tin and lead cell and say what each beaker holds when the voltmeter reads zero. | cellloadrun, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| q5-load:3 More Zinc Ions | dynamic | Raise the zinc ion concentration in the zinc beaker, from 0.010 M to 1.0 M, and say what the voltmeter does. | cellloadread, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| q5-load:4 The Balance Point | dynamic | Find the tin count divided by the lead count in the cell that reads zero. | cellloadrun, cellscene | - | 3D/flat model added; primer if it needs maths |
| q5-load:5 Two Copper Beakers | dynamic | Run a copper cell with a 1.0 M beaker and a 0.010 M beaker, and say which bar the electrons leave. | cellloadcc, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| q5-load:6 A Cell Nobody Wired | dynamic | Find the voltage, in volts, of the zinc and copper cell with 1.0 M zinc ions and 0.0010 M copper ions. | cellloadread, plaque, cellscene | - | 3D/flat model added; primer if it needs maths |
| q5-load:7 Three Prepared Cells | dynamic | Rank the three zinc and copper cells by voltage, highest first. | cellloadread, cellscene; pieces: tag | - | 3D/flat model added; primer if it needs maths |
| q5-load:8 Sealed Beakers | dynamic | Say which beaker of the sealed silver cell holds the more dilute solution. | cellloadcc, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:1 Reversing the Cell | dynamic | Make zinc plate out of the solution in the zinc–copper cell. | cellsupply, cellscene | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:2 Molten Salt | dynamic | Say which electrode makes sodium in molten sodium chloride. | cellsupply, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:3 How Much Passed | dynamic | Rank the three silver-plating runs by the electric charge each passed, least first. | cellsupply, cellscene; pieces: tag | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:4 Plating Copper | dynamic | Find the mass of copper, in grams, plated by 2.00 A running for 30.0 minutes. | cellsupply, plaque, cellscene | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:5 Plating Silver | dynamic | Find the mass of silver, in grams, plated by 3.00 A running for 10.0 minutes. | cellsupply, plaque, cellscene | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:6 Cells Driving Cells | dynamic | Make zinc–copper cells drive the electrolysis of water. | cellsupply, cellscene; pieces: cellsupplypack | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:7 Water and Brine | dynamic | Compare electrolysing water and electrolysing brine: say what each gas tube collects. | cellsupply, cellscene; pieces: tag | - | 3D/flat model added; primer if it needs maths |
| q6-electrolysis:8 The Sealed Plate | dynamic | Find the current, in amperes, that plated the sealed plate in the time shown. | cellsupply, plaque, cellscene; pieces: cellsupplyplate | - | 3D/flat model added; primer if it needs maths |
| boss-clamp:1 Phase 1 · The Dip Rack | static | Rank iron, nickel, tin and silver from the metal that gives electrons most readily to the one that gives least. | celldip; pieces: celldipstrip, tag | static | open: no room beside the pieces at the phone floor |
| boss-clamp:2 Phase 2 · The Open Cell | dynamic | Find the anode of the magnesium and silver cell. | cellgalv, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| boss-clamp:3 Phase 3 · The Potential Board | dynamic | Find the voltage, in volts, of a cell made from iron and silver. | cellboard, cellscene; pieces: cellelectrode | - | 3D/flat model added; primer if it needs maths |
| boss-clamp:4 Phase 4 · The Zinc Beakers | dynamic | Run the zinc cell and say which bar the electrons leave. | cellloadcc, selector, cellscene | - | 3D/flat model added; primer if it needs maths |
| boss-clamp:5 Phase 5 · The Plating Run | dynamic | Find the mass of zinc, in grams, plated by 1.50 A running for 20.0 minutes. | cellsupply, plaque, cellscene | - | 3D/flat model added; primer if it needs maths |


## Decisions the owner might reverse

- Placement of the model: below the table, compact (26 units high) where the table is tight, nowhere where it cannot fit. A tall table with free width beside it would fit a model at `3D On` without shrinking, but the 340 px phone check forbids extra width, so below is used everywhere.
- `WITHHELD_VOCAB` lost entries for other worlds too (the prompt's examples).
- The Primer and Glossary keys sit in the stage-actions row beside Tour and Findings.
- The model draws no numbers; counts are particles and the stage's own readouts still print figures.

## Only the owner can judge these

1. The re-laid tables (`q1` 1, 5; `q2` 2, 5, 6, 8; `q3` 7; `boss-clamp` 1): whether the moved cards, strips and trays still read naturally, and whether `q2` 5's column of name cards beside the rack is easy to find.
2. Pacing and size of the moving model on a phone (the compact 26-unit scenes are small).
3. Whether electrons in the wire and ions through the bridge read as such without labels (the model prints none).
4. `q5` 6 and `q4` 7: the logarithm primer is a refresher, not a lesson; a student who has never met logs may still stall.
5. The lead-in clips: do they give a picture to guess from without giving the answer?
