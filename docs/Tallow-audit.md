# Tallow audit

Oct 29, 2026. World: Tallow (`unit01`, atoms, the table, the mole): six benches and the Hopper. After this pass: 8 + 8 + 7 + 8 + 10 + 12 stages and 5 boss phases (`q5-assay` and `q6-weigh` grew).

## Method and limits (read this first)

- Played at `3D On` in the Browser pane as a guest, on a dev server at :3021. Stages were reached with the runner's `loadStage` through `__LQ_TEST__`.
- **What was played by hand (real pointer gestures, typed answers, Submit):** `q1-grain` stage 1 (lens tap-tap, lens drag, power dial drag) and stage 2 (lens drag onto a dish, dial); `q5-assay` stage 4 (sample to chute, Tip Sample, typed answer); `q6-weigh` stage 9 (join three atoms, drag the molecule to the pan, a wrong typed figure refused with its reason, then the right one and the reward card).
- **What was only loaded and looked at (a screenshot of the bench; not solved):** `q1-grain` 3 to 8; `q2-core` 1 to 5; `q3-catalogue` 1, 3, 5, 7; `q4-ledger` 1, 5, 7, 8; `q5-assay` 1, 3, 10; `q6-weigh` 10, 11; `boss-hopper` phase 2.
- **Never opened in the browser:** `q2-core` 6 to 8; `q3` 2, 4, 6; `q4` 2 to 4, 6; `q5` 2, 5 to 9; `q6` 1 to 8, 12; Hopper phases 1, 3, 4, 5. Those are rated from source and from `verify:*` only. Treat any verdict marked (src) as unplayed.
- Scripted solutions (`SOLUTIONS`, `MISSES`) pass for every stage; that is what `verify:learn` and `verify:table` prove, not that a hand can do them.
- AP references are Course and Exam Description **Unit 1, Atomic Structure and Properties** by topic number (1.1 moles and molar mass, 1.2 mass spectra of elements, 1.3 elemental composition of pure substances, 1.4 composition of mixtures, 1.5 atomic structure and electron configuration, 1.6 photoelectron spectroscopy, 1.7 periodic trends, 1.8 valence electrons and ionic compounds). The CED PDF in `docs/` was not read in full here; topic names are from memory of the CED.

## Per-stage verdicts

Operable / Intuitive / Busywork / Intuition / Accurate. "ok" means no defect found at the level of looking given in the evidence column.

### q1-grain (atoms, elements, compounds)

| # | Stage | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Lowest power that resolves atoms | ok after fix | Played. First lens picture at power 1 is a dim blank glass; a lens moved off a dish kept the old picture (fixed, below). Caption "Drag over a dish" stays after joining. |
| 2 | One-kind-of-atom sort | ok | Played the lens onto dish A at power 4. Four samples, two trays: guessable at 50% per sample but four samples. |
| 3 | Sort atoms by element with the reader | ok (screenshot) | Six atoms, four trays, reader slot, readable. |
| 4 | The cutter | ok (screenshot) | One tray, four dishes. |
| 5 | Build methane... water | fixed | The seventh atom sat under the Lens panel (screenshot); heap pitch tightened. |
| 6, 7, 8 | Build two molecules; mixture vs compound; element/compound/mixture | ok (screenshot) | Readable. Stage 8 repeats the stage 2 and 7 ideas as a final sort; kept as the application. |

### q2-core (nucleus, particles, shells, isotopes)

| # | Stage | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Predict the atom | ok (screenshot) | Three 3D model cards and a slot. |
| 2 | Gold foil beam | ok (screenshot) | Beam and foil panel is small but labelled. |
| 3 | Sort specks by the plates | ok (screenshot) | Nine identical specks; discovery, not reading. |
| 4 | Neutralise Sample D | ok (screenshot) | Needle at +8 with 10 electrons in the tray. |
| 5 | Fill the shells | ok (screenshot) | Rings and open samples readable. |
| 6 to 8 | Valence behaviour, same element, three ways to differ | (src) | Not opened. |

### q3-catalogue (the periodic table)

| # | Stage | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Order by protons | ok (screenshot) | Card text (name, protons) is small at the default camera; readable at full size. |
| 3, 5, 7 | File cards, noble gases, missing element | ok (screenshot) | The Stamp panel on stage 7 sits just above period 2 and clears it. |
| 2, 4, 6 | Periods, groups, trades | (src) | Not opened. |

### q4-ledger (mass number, ions)

| # | Stage | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Build an atom particle for particle | fixed | The proton and neutron heap covered the lower scale of the needle and mass gauges (zoomed screenshot); gauges moved up. |
| 5, 7, 8 | Cation, ion pad, sort by difference | ok (screenshot) | Readable. |
| 2 to 4, 6 | Not opened. | (src) | |

### q5-assay (isotopes, average mass)

| # | Stage | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | One or two elements per sample | ok (screenshot) | Chute, assay, code reader, two trays. |
| 2 | Share in the lighter bin | (src) | Not opened. Three trays and two samples: a 33% guess, repaired by being two samples of one stock. |
| 3 | Balance the beam under chlorine | fixed | A "Listed 35.5" plate printed the answer to the hunt. Plate removed; the hunt of the fulcrum stays as the discovery that the average is a balance point. |
| 4 | Boron average | rewritten | Was a second fulcrum hunt. Now a typed figure; the tipped piles (tallies 8 and 32, beam tilting) are the evidence. Played. |
| 5, 6 | Predict, then fluorine | fixed | A "Listed 19.0" plate gave away both. Removed. Stage 6 stays a fulcrum hunt (the idea is only that a one-pile sample balances on the pile). |
| 7 | Balance a sealed canister | (src) | Hunting the heavy-atom count one at a time; accepted, the counts are small. |
| 8 | Natural or altered chlorine | (src) | Uses the fulcrum on three samples. |
| 9 (new) | Magnesium, three isotopes, typed | new, loaded by script only | Weighted average over three piles (24.3). |
| 10 (new) | Share of heavy atoms from the average | new, screenshot only | Plate-only bench. Honest weakness: a reading with no picture. |

### q6-weigh (moles)

| # | Stage | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 to 8 | Count by weighing to the rank of drums | (src) | Not opened. Stage 6 sets a tally dial, a small hunt. |
| 9 (new) | Percent by mass of oxygen in water | new, played | Built H₂O on the pan, scale read 18, 33 refused ("share of the atoms"), 88.9 passed. |
| 10 (new) | Hydrogen atoms in 36 g of water | new, screenshot only | Crate and a plate with the mole figures; plug-and-chug with refusals for the common slips. |
| 11 (new) | Empirical formula from two crates | new, screenshot only | 24 g C and 6 g H, typed ratio 3. |
| 12 (new) | Molecular formula from molar mass | new, not opened | Plate only, typed count 2. |

### boss-hopper

Phase 2 loaded: gauges clear of the heap after the fix. Phases 1, 3, 4, 5 not opened (src).

## Defects found and fixed

| # | Defect | Fix |
| --- | --- | --- |
| D1 | A lens kept the picture of the dish it had left (3D face signature was only rechecked for the dragged piece, and the piece kept easing after release) | `table3d.js` `tickPieces` also rechecks every lens until it arrives. Replayed. |
| D2 | `q1-grain` 5 and 7-atom heaps ran under the Lens panel | pitch 11, start 10. |
| D3 | `q4-ledger` and Hopper phase 2: particles covered the lower scales of the gauges | gauges moved up (Hopper gauges shortened to stay out of the foe's corner). |
| D4 | `q5` stage 3, 5, 6 printed the answer on a "Listed" plate | plates removed. |
| D5 | `q4` gauge was labelled "Needle" where the rest of Tallow says "Charge" | label unified. |

## Open items

- A first-time player sees a black pane for about 10 to 20 seconds while a bench's world builds (longer with other jobs running); nothing says it is loading. Not changed: shared engine, outside this world.
- `q5` stage 10 and `q6` 10 to 12 are plate-and-type benches. They carry the AP arithmetic with refusals that name the slip, but nothing in the picture builds intuition for percent or empirical formulas. A better version would show the two crates on a balance with the moles as scoops (as stage 6 does).
- The first lens picture at power 1 is a blank glass; "clumps" is never drawn.
- Nothing yet covers AP 1.4 (composition of mixtures) or reading a printed mass spectrum as a graph.
- A real-hand check of every stage is still owed; see below.

## AP coverage (Unit 1)

| Topic | Where | State |
| --- | --- | --- |
| 1.1 moles, molar mass, Avogadro | `q6` 4 to 8, 10 | covered, quantitative added (grams to particles) |
| 1.2 mass spectra of elements | `q5` 1 to 4, 9, 10 | piles of tipped atoms are a mass spectrum; never shown as a graph with peaks and relative abundance |
| 1.3 composition of pure substances | `q6` 9 to 12 | added: percent by mass, empirical, molecular formula |
| 1.4 composition of mixtures | none | missing |
| 1.5 atomic structure, configuration | `q2` 4 to 6 | shells to 2, 8, 8; subshell configurations belong to Lanternfall |
| 1.6 PES | Lanternfall `q7` | out of world |
| 1.7 periodic trends | Lanternfall `q8`, `q3` | `q3` has the groups; trends out of world |
| 1.8 valence electrons, ionic compounds | `q2` 6, `q4` 5 to 7, `q3` 5, 6 | covered |

## Work log

- Read PRODUCT.md, CLAUDE.md, the clashing-rules doc and the Tallow quest text (all stage prompts, hints and rewards dumped).
- Played q1 stages 1, 2; looked at the rest as listed above.
- Fixed D1 to D5; q5 rebuilt as above (8 to 10 stages); q6 8 to 12 stages; chart, `verify-learn` recomputations and PRODUCT.md counts updated.
- `verify:learn`, `:table`, `:story`, `:docs`, `:tallow`, `:lanternfall`, `:bellows`, `:ember` and `:bench` pass.
- Not done: a second full audit pass (see below).

## What only the owner can judge

Whether the typed stages feel like understanding or like arithmetic; whether the black loading pane at bench entry loses players; whether q1 to q4 gestures survive a trackpad and a phone (the drags here were synthetic); every stage not marked played.
