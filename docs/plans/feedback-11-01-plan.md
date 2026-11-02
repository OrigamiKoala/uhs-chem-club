# Implementation Plan: Lanternfall, Ligar, and Bellows Audit Fixes (2026-11-01)

## Status: COMPLETED

### 1. Photoelectric Effect Explanation Animation (image-25)
- [x] Create dedicated animated explainer for the photoelectric effect (`mountPhotoelectricExplainer` in `src/ui/photoelectric-explainer.js`).
- [x] Visual 1: Photon strikes metal surface and electron pops off.
- [x] Visual 2: As photon count increases (brightness), electron count increases.
- [x] Visual 3: As photon frequency/energy increases, electron kinetic energy/speed increases.
- [x] Integrate into `src/ui/model-viewer.js` for `photons` model type.

### 2. Remove Weird Colored Dots on Benches (image-26)
- [x] Remove `buildPhotonRow` capsule dots from photocell tube in `src/learn/table/kits/optics.js`.
- [x] Remove floating/orbiting dots from Ligar orbital mixers and pieces in `src/learn/engine/orbital-props.js`.

### 3. Hydrogen Line Explanation Animation (image-27)
- [x] In `src/ui/model-viewer.js` (`drawLadder`), remove all text, labels, energy numbers, and badges.
- [x] Keep only the clean visual rungs, electron drop, and photon wavepacket emission.

### 4. Orbital Slice Explainer (image-28)
- [x] In `src/ui/slice-explainer.js`, remove top bar (`Plane:` and `Slice: ON`).
- [x] Remove status readout (`Empty slice` and `In slice:`).
- [x] Ensure the 3D visual fits cleanly in the modal without vertical scrolling.

### 5. d-Orbitals Explainer Animation (image-29)
- [x] In `src/ui/orbital-3d-viewer.js`, remove `+ Phase` and `− Phase` legend.
- [x] Remove the status bar containing orbital name and degenerate shape text.

### 6. Orbital Mixer Bench (image-30)
- [x] In `src/learn/table/kits/domain-orbitals.js` (`paintBowl`), suppress 2D flat orbital projection when 3D is active.
- [x] In `src/learn/engine/orbital-props.js` (`buildMixer3D`), enlarge 3D model on plinth so it is huge on the tabletop.

### 7. Molecular Orbitals Gas Cards & Magnet Trays (image-31)
- [x] Resize `CARD_RECT` for `mocard` to compact dimensions (`hw: 9, hh: 5.5`).
- [x] Adjust tray width, height, and snap alignment in `q9-orbitals.js` so cards fit completely inside "Pulled" and "Not pulled".

### 8. Molecular Orbitals Electron Interaction (image-32)
- [x] Fix electron pouring/dragging and tap-tap interactivity between supply and MO rack boxes with generous hitboxes.
- [x] Provide clear visual feedback during drag/hover (drag ghost, source glow, target box highlight) so users can easily place electrons into boxes.

### 9. Bellows Gas Laws & Straightedge Slope (image-33)
- [x] Display computed slope badge on the plot/straightedge in `table2d.js` and `table3d.js` when straightedge is laid.
- [x] Provide interactive volume slider connected to an analogue pressure gauge with a swinging needle in `gas-draw.js`, `gas-3d.js`, and `q1-knocks.js`.

### 10. Lanternfall: New 10th Quest on Wavefunctions & Atomic Orbitals
- [x] Build `src/learn/quests/unit02/q10-wavefunctions.js` introducing wavefunctions ($\psi$), probability density ($|\psi|^2$), radial nodes, and 3D atomic orbitals visually.
- [x] Provision `site-10` in `src/three/world-data/lanternfall.json` and `src/three/lanternfall/host-plan.js`.
- [x] Update `src/learn/worlds/unit02-quantum.js`, curriculum, question bank (`unit02.json`), and `tools/verify-lanternfall.mjs`.

### 11. Ligar: Expand Molecular Orbitals Quest (q9-orbitals)
- [x] Expand `q9-orbitals.js` into a comprehensive 6-stage quest.
- [x] Add visual AO addition (in-phase) vs subtraction (out-of-phase).
- [x] Add free-to-bonded atom transition showing orbitals morphing from AOs to MOs ($\sigma, \sigma^*, \pi, \pi^*$).
- [x] Add beginner explanations of bonding vs antibonding nodes, energies, bond order, and Hund's rule explaining $O_2$ paramagnetism.
