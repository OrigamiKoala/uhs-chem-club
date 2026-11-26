# Feedback 2026-11-18 Implementation Plan

Tracking every item from `docs/feedback-11-18.md`.

## Phase 1: UI (Glossary, Navbar, Drill Deck / Practice, Ship)
- [x] **Glossary** (`image-96`): Reformat glossary modal so it looks like a proper, easy-to-use glossary (clear term/definition layout, search/filter or clean grouped cards/rows, typography & spacing).
- [x] **Navbar** (`image-104`): Remove "Standings" and "Crew"; add "Practice" button linking to the Drill Deck / Practice screen.
- [x] **Drill Deck / Practice** (`image-105`):
  - [x] Remove "Week Streak" label & number and remove the concept of streaks from the game.
  - [x] Remove Daily Set.
  - [x] Remove kickers "Practice" (over Quick Run), "Beat the clock" (over Timed Round), and "Review" (over Weak Spots).
  - [x] Rename "Timed Round" → "Beat the clock" with description "90 seconds per question." (and align timer behavior if needed).
  - [x] Rename "Weak Spots" → "Review" with description "Review past mistakes".
  - [x] Pull questions only from quests/worlds the user has finished.
  - [x] Remove "A question is mastered when you have got it right twice..." next to Mastery.
  - [x] Remove "Drills pay no XP and never..." line.
  - [x] Remove "UNRANKED" labels next to "Drill" for each world.
  - [x] Remove "Learn Road" button at the bottom.
  - [x] Replace "Not yet" with "0%".
  - [x] Replace "AP Synthesis" with "AP".
  - [x] Active Drill screen: black background (no 3D world behind it), calculator accessible, full-screen question card with much larger text.
- [x] **Ship** (`image-95`): Remove "Primary Objective" (and sector subtitle if part of it) and "[E] / Click Holo-table to disembark".

## Phase 2: Lanternfall World & 3D Rendering
- [x] **Snow/ice textures** (`image-106`): Replace cracked-earth-painted-blue Voronoi/hex textures on Lanternfall with realistic snow and crystalline ice textures.
- [x] **Ship pad z-fighting & reload ship vanish** (`image-103`): Fix ship pad z-fighting and fix the ship vanishing when reloading on `/#/learn/unit02`.

## Phase 3: Global Learn Track Rules (Answer Slots, Tours, Duplicate Explainers)
- [x] **Global "Answer" slot label** (`image-82`): Ensure every answer slot across all Learn worlds has "Answer" printed on it where the answer goes.
- [x] **Global tours cleanup** (`image-91`): Remove ALL "how to submit" tours; keep basic interaction tours (drag dial, move card, etc.) only for the first time the user encounters them (e.g., Tallow).
- [x] **Global duplicate explainers** (`image-89`, `image-93`): Audit all Learn worlds for repeated/duplicate explainers; remove duplicates or make each genuinely distinct and useful.

## Phase 4: Lanternfall — Periodic Trends (`u2_trends`)
- [x] **Switch stages 1 & 2 + explainer animation** (`image-79`): Put predict stage right before testing; add a clean explainer animation where protons are added to an atom and it shrinks.
- [x] **Ionization energy ordering** (`image-81`): Remove Lithium and the Electron Remover completely; just arrange Sodium, Carbon, Fluorine cards in order.
- [x] **Chloride ion size & Electron Remover reform** (`image-82`): Reform stages where Electron Remover is useless (give an actually useful tool, e.g. Electron Adder / Ion Builder that shows adding/removing an electron changing shell size, or clean comparator).

## Phase 5: Lanternfall — Beer's Law / Spectrophotometry (`u2_beer`)
- [x] **Tour fix + block card on cuvette** (`image-83`): Remove duplicate step 1/2 in tour; fix step 3 (don't suggest putting color card into cuvette); block dropping color cards onto the cuvette/holder.
- [x] **Complementary color bench reform** (`image-85`): Fix spectrum/grading mismatch where Red looks absent on the spectrum yet is rejected as "still gets through".
- [x] **Beer's Law explainers** (`image-86`, `image-89`, `image-93`): Replace `cuvette-explainer.js` interactive with simple, clean, text-free animations; remove duplicate on stage 4; make calibration/concentration explainer visually show concentration ↑ → absorbance ↑ (or remove if redundant).
- [x] **Spectrometer overlap** (`image-87`): Fix "Wavelength (nm) 600" overlapping "SOURCE / SENSOR" and dial.
- [x] **Dropper/rinse tour & concentration labels** (`image-88`): Brighten tour, fix animation to show cuvette → spectrophotometer THEN dropper/rinse on cuvette; change "Lay on a cuvette" → "Lay this over a cuvette"; make cuvette concentration labels much larger & clearer.
- [x] **Calibration intro & straightedge** (`image-90`, `image-92`): Explain what calibration is & why it's needed; make straightedge show slope & y-intercept clearly on a readable graph; introduce straightedge (line of best fit) on first ever use; explain how to read an unknown off the line of best fit for non-math-minded students.

## Phase 6: Lanternfall — Spectroscopy, Orbitals & Boss
- [x] **Light & Molecule 3D animations** (`image-94`): Replace static 2D HCl drawings with 3D moving animations (spin, stretch/bend, electron jump).
- [x] **2s & 3s Orbital radial nodes + introduce "node"** (`image-98`, `image-100`): Make radial nodes unmistakably visible as clear empty rings; introduce "node" on the 2s stage instead of later.
- [x] **Wavefunction multi-part explanation** (`image-99`): Break wavefunction intro into intuitive multi-step parts assuming zero physics/wave background.
- [x] **Orbital Slice / Angular Nodes lighting, slots, & 3D surfaces** (`image-101`): Brighten these benches; resize slots so `2s`, `2p`, `3d` cards fit cleanly inside; show common 3D orbital surface visualizations (s, p, d) at the end of the stage.
- [x] **Lantern-Eater Boss Oxygen prompt** (`image-102`): Change prompt to say "oxygen (8 electrons)".

## Phase 7: Verification & CLAUDE.md Update
- [x] Run `npm run verify` and `npm run build` — all checks pass.
- [x] Update `CLAUDE.md` with any system changes.
