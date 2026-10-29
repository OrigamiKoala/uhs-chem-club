# Lanternfall audit

Oct 29, 2026. World: Lanternfall (`unit02`, light, orbitals, trends): nine benches and the Eater. After this pass: 6 + 6 + 5 + 5 + 5 + 6 + 6 + 5 + 5 stages and 5 boss phases (six stages added).

## Method and limits (read this first)

This was one partial pass, not the full three-pass audit the task asked for.

- Played at `3D On` in the Browser pane as a guest on a dev server at :3011.
- **Played by hand with real pointer gestures:** `q1-wave` stage 1 (lamp drag into the holder, Colour dial, Submit, a miss and a pass); stage 3 (detectors dragged to the 0 m and 3.0 m pads, lamp seated, Fire Pulse, speed dial, a refused figure); the new stage 6 (a wrong typed figure refused with its reason, then the right one and the reward card).
- **Looked at only (screenshot of the loaded bench, not solved):** `q1-wave` 2, 4, 5; `q2-photon` 1 to 5; `q3-lines` 1 to 5.
- **Never opened in the browser:** `q4-cloud`, `q5-numbers`, `q6-filling`, `q7-pes`, `q8-trends`, `q9-absorb`, `boss-eater`, and the three new stages other than q1's stage 6. The new `q2`, `q6` and `q7` stages pass the scripted checks only (`verify:learn`, `verify:table`, `verify:bench`), which do not see a 3D pick or an unreadable label.
- Scripted solutions pass for every stage, as before.
- **The dev tool is unreliable for dials:** a drag on the `q1-wave` speed dial ended on 2.5, 2 and 4.5 for pointers at 520, 580 and 640 px. The dial reads the pointer's absolute position, so this is probably the drag tool dropping its last move, but I did not confirm that with a real mouse. A tap on the dial track did not set it either. The owner should try the dial by hand.
- Another agent was moving `PRACTICE` out of the quest files into `src/learn/bank/` during this pass, which made the dev server stall on `q3-lines` and `q4-cloud` ("Export not defined") until a stale cached module was refetched. `verify:learn` still reports 17 "bench problems, expected 2" failures from that work (`tools/lib/bank-check.mjs`); they are not Lanternfall's.
- AP topic numbers are from the Course and Exam Description in `docs/` (Unit 1: 1.5 configuration, 1.6 PES, 1.7 trends; Unit 3: 3.11 photons, 3.12 photoelectric effect, 3.13 Beer-Lambert) and from `docs/AP-coverage-audit.md`.

## Per-stage verdicts

Operable / Intuitive / Busywork / Intuition / Accurate. "ok" means no defect found at the level of looking given in the evidence column.

| Bench | Stage | Verdict | Evidence |
| --- | --- | --- | --- |
| q1-wave | 1 Red to Violet | fixed | Played. Lamp drag and dial work. An equal crest count was reported as "fewer": now says "the same number". The caption "Drag the lamp into its holder" stays after the lamp is in. |
| q1-wave | 2 Predict | ok (screenshot) | Three guesses and a slot. The prompt says "color"; the rest of the game says "colour". |
| q1-wave | 3 Time a pulse | ok | Played. Detectors and lamp seat by drag. The lamp needs a drag onto the circle's centre (a drop at its edge left it unseated). The recorder plot at the bench's lower right is tiny and unreadable. The speed dial is the only awkward part (see above). |
| q1-wave | 4 Other lamp | ok (screenshot) | Same bench, the other lamp. Kept: it is the click's second reading. |
| q1-wave | 5 One scale | ok (screenshot) | Ordering rail with a ruler. |
| q1-wave | 6 Crests per second (new) | ok | Played. Typed figure, c = wavelength x frequency with a worked mast to scale from. |
| q2-photon | 1 to 5 | ok (screenshot) | Readable; the instrument sits small in the middle of a large plate. |
| q2-photon | 6 Energy of a freed electron (new) | untested in browser | Scripted only. |
| q3-lines | 1 Predict | ok (screenshot) | |
| q3-lines | 2 to 5 | ok (screenshot) | Stage 4's ladder showed "n =" with the number hidden under the rail post, and positive energies under a "0" at the top: fixed (labels moved out, energies signed negative). |
| q4-cloud to q6-filling stage 5, q7-pes 1 to 5, q8-trends, q9-absorb, boss-eater | all | not played | Read from source only. |
| q6-filling | 6 A chloride ion (new) | untested in browser | Scripted only. |
| q7-pes | 6 Counting outer electrons (new) | untested in browser | Scripted only. |

## AP coverage

| CED | Where | Verdict |
| --- | --- | --- |
| 1.5 Configuration | q6-filling 1 to 6 | Covered. Neutral atoms through scandium; ion configurations now asked (Cl⁻ built; Fe³⁺ stated in the reward, not built, because the bench ladder puts 4s below 3d for every atom and cannot show the reversal). |
| 1.6 PES | q7-pes 1 to 5 | Covered. |
| 1.7 Periodic trends | q8-trends 1 to 5; q7-pes 6 | Radius, Zeff, ionization energy and ionic radius covered; successive ionization energies now asked (q7-pes 6). Electron affinity (`q8-trends` 6) and electronegativity (`q8-trends` 7) are now taught on a new Atom gauge fixture (`gainFixture`); stage 6 was played in the browser up to two atoms (carbon 122 kJ/mol, nitrogen −7 kJ/mol), stage 7 by script only. |
| 3.11 Photons, c = λν | q1-wave 6 | Now a typed worked figure, proportional first (a mast to scale from). |
| 3.12 Photoelectric, E = hν | q2-photon 6 | Now a typed worked figure: photon energy minus work function. Boss phase 2 still tests the idea on the bench. |
| 3.13 Beer-Lambert | q9-absorb | Bench only (calibration). Not re-audited. |
| 1.2, 1.4 | none here | Tallow and Kettle. |

## Work log

- Fixed the energy ladder labels and sign (`table/kits/optics-draw.js`), committed as 4999e53.
- `q1-wave` stage 1: equal case message.
- Added `q1-wave` 6 (c = λν), `q2-photon` 6 (E = hν, kinetic energy of the freed electron), `q6-filling` 6 (Cl⁻), `q7-pes` 6 (successive ionization energies). Stage counts moved in each quest's `meta`, `worlds/unit02-quantum.js` and `PRODUCT.md` (288 stages). `verify:table`, `verify:story`, `verify:docs`, `verify:lanternfall`, `verify:bench`, `verify:tallow`, `verify:bellows` and `verify:ember` pass. `verify:learn` fails only on the other agent's bank check.
- Also: `q5-numbers` stage 4 note is one line (it had split across the plate); `q6-filling` prompt uses a true minus (the font has no superscript minus); `q8-trends` stage 5 rail moved clear of the size gauge; `q8-trends` 6 and 7 added (electron affinity, electronegativity) with `gainFixture`; bench cap raised to 7 stages.
- Played by hand this round: `q6-filling` 6 (Cl⁻ built with drags, reward shown), `q8-trends` 6 (two atoms measured). Screenshot only: `q4-cloud` 2 to 4, `q5-numbers` 1, 3 to 5, `q7-pes` 2 to 4 and 6, `q8-trends` 2 to 5, `q9-absorb` 1 to 3. Still never opened: `q9-absorb` 4 and 5, `boss-eater`.
- Open layout defects: `q5-numbers` 1 dial labels overlapped by the knobs; boss phase 5 calibration plot small. (Fixed in round three: `q7-pes` 4 end labels and notes, `q7-pes` holder over the energy dial.)
- Earlier (superseded by the commit 63c6af0): not committed: the four quest files, `unit02-quantum.js` and `PRODUCT.md`, because the quest files also carry another agent's uncommitted `PRACTICE` removal.

## Still open

- Play `q4-cloud` to `boss-eater` by hand; this pass did not.
- Fe³⁺ (and other transition-metal ions) built on a bench with the reversed ladder.
- Dial reliability by a real mouse; a tap on a dial track does nothing.
- The small recorder plot on the pulse timer bench.
- Whether the new typed stages' numbers feel friendly to a 12-year-old: only the owner can judge.

## Second round (play of q9-absorb and boss-eater)

- **Blocking defect fixed:** at 3D On the spectrophotometer's digital readout (`ABSORBANCE 0.100`, transmittance bar) was invisible on every spectrometer stage (`q9-absorb` 2 to 5 and boss phase 5): a solid bezel slab in `cuvette.js` `dress3d` lay over the painted display. It is now a thin frame. Played: cuvette in the beam, Record, the reading shows.
- `q9-absorb` stage 5: the calibration plot was about 100 px wide with unreadable axes; enlarged (42 x 24 units). Boss phase 5's plot is still the small one (the foe pad and the plaque leave no room); the absorbance readout itself now shows.
- Looked at (screenshot only): boss phases 1 to 5 render and read; `q9-absorb` 1 to 3.
- Played by hand: `q9-absorb` 4 (cuvette into the holder, Record, reading), `q9-absorb` 5 (one standard recorded).
- Still never solved by hand: `q9-absorb` 4 and 5 to completion, every boss phase.

## Third round

- `q7-pes` stage 4: the chamber is 38 units tall so "Held loosest" and "Held tightest" show; the specimen notes ("10 protons") use the brighter text colour.
- `q7-pes` stage 2: the holder sat over the Light energy dial's track; it now sits lower when the chamber has an energy dial. Played: dial dragged to 50 MJ/mol, Fire Light, three electrons land on the strip.
- A full second audit pass over every changed stage was NOT done; each stage touched this run was replayed once after its change, and the rest were only looked at. No browser play of the boss to a solution, of `q3-lines`, `q4-cloud`, `q5-numbers` beyond the screenshots above, or of `q8-trends` 7.
