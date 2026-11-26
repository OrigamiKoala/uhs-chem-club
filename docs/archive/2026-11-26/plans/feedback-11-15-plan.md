# Feedback 2026-11-15 Fix Plan

Tracking all items from `docs/feedback-11-15.md` across Ship, Tallow (`unit01`), and Lanternfall (`unit02`).

## Phase 1: Ship, Navbar, & Shared Infrastructure
- [x] `images/feedback/image.png` — Remove `"AVALON STATION · FLIGHT DECK DIRECTORY"` from bridge directory texture (`src/three/materials/textures.js`)
- [x] `images/feedback/image-1.png` — Remove Open / Finished / Sealed legend below Erebus in Star Map (`src/ui/galaxy-map.js`)
- [x] `images/feedback/image-3.png` — Fix flipped ship doorway header signs (`src/three/ship/doors.js`)
- [x] `images/feedback/image-4.png` — Simplify airlock door text to `"AIRLOCK"` only + fix bottom-left hinge z-fighting (`src/three/materials/textures.js`, `src/three/ship/rooms/airlock.js`)
- [x] `images/feedback/image-54.png` — Clean up world briefing modal: remove Campaign Briefing, Tactical Mission, Vess dot, Click/Space hint, direct link footer, clickable text box; single Skip + Continue buttons; `"Take Off"` (`src/story/story-modal.js`)
- [x] `images/feedback/image-71.png` — Remove `.nav-btn.active` highlight & underline (`src/styles/main.css`)
- [x] `images/feedback/image-15.png` — Remove `"Filed"` sections from Vess debriefs (`src/story/quest-story.js`)
- [x] `images/feedback/image-43.png` — Calculator "Use Value" scales value to match entry unit multiplier (`× 10¹⁴`, `× 10⁻¹⁹`, etc.) (`src/ui/calculator.js`, `src/learn/engine/frame.js`)
- [x] `images/feedback/image-51.png` & `images/feedback/image-52.png` — Fix awkward Unicode superscripts in briefings, entry units, plaques, and readouts; simplify Q2 Stage 6 formula to `KE_electron = E_photon - W` (`src/learn/engine/frame.js`, `src/learn/table/kits/optics-draw.js`, `src/learn/quests/unit02/q2-photon.js`)

## Phase 2: Tours & Live Demos (`tour.js`, `tour-demo.js`, `frame.js`)
- [x] `images/feedback/image-5.png` — Tallow Q1 S1 tour dial doesn't land on answer (Power 4)
- [x] `images/feedback/image-6.png` — Tallow Q1 S3 Scale tour highlight includes the scale slot too
- [x] `images/feedback/image-7.png` — Tallow Q1 S3 Atoms tour highlight includes both atoms
- [x] `images/feedback/image-10.png` — Tallow Q1 S4 remove "Drag the lens onto a dish" tour step
- [x] `images/feedback/image-17.png` — Tallow Q2 S2 remove pointer dragging Solid ball into answer slot; just highlight Fire Beam
- [x] `images/feedback/image-19.png` — Tallow Q2 S3 tour animates dragging a particle in, then clicking Switch On
- [x] `images/feedback/image-22.png` — Tallow Q2 S5 replace sample-tray tour with pointer dragging an electron onto a ring
- [x] `images/feedback/image-28.png` — Tallow Q3 S1 no pointer animation on Element cards tour
- [x] `images/feedback/image-36.png` — Tallow Q5 S5 no pointer animation on tour, just highlight card
- [x] `images/feedback/image-38.png` — Tallow Q6 S3 tour animates clicking green fluid then clicking empty pan and transferring
- [x] `images/feedback/image-39.png` — Tallow Q6 S4 remove Crates tour step (no pan on this stage)
- [x] `images/feedback/image-40.png` — Lanternfall Q1 S3 tour animates dragging a detector in as well
- [x] `images/feedback/image-46.png` — Lanternfall Q2 S2 tour order: drag plate on first, then adjust dials
- [x] `images/feedback/image-77.png` — Lanternfall Q8 S1 remove fallback "The bench" tour on predict stages

## Phase 3: Tallow (`unit01`) 3D World, Kits, Quests, Explainers & Debriefs
- [x] `images/feedback/image-2.png` — Move Tallow landing pad blast wall blocks away from the boarding ladder (`src/three/tallow.js`)
- [x] `images/feedback/image-8.png` — Tallow Q1 S3 show atomic weight number next to tray for first atom placed; vanish when emptied
- [x] `images/feedback/image-9.png` — Tallow Q1 S3 give all masked atoms the same plate color (`tint: 'pale'`)
- [x] `images/feedback/image-11.png` — Tallow Q1 S6 3D explainer adds H₂O molecule next to H₂O₂
- [x] `images/feedback/image-12.png`, `images/feedback/image-13.png`, `images/feedback/image-14.png` — Tallow Q1 Vess debrief copy fixes (no mystery grey powder, no cutter jargon, no loose atoms line)
- [x] `images/feedback/image-16.png` — Tallow Q2 S1/S2 remove 2D diagram underneath 3D model cards
- [x] `images/feedback/image-18.png` — Tallow Q2 S2 3D explainer: closeup Rutherford beam experiment animation, no text in 3D scene
- [x] `images/feedback/image-20.png` — Tallow Q2 S3 3D explainer: closeup charged plates animation (proton deflects, neutron goes straight)
- [x] `images/feedback/image-21.png` — Tallow Q2 S5 remove 2D grey dots/orbits underneath 3D specimens; slow down electron orbit speeds globally in `atom3d.js`
- [x] `images/feedback/image-23.png` — Tallow Q2 S5 3D explainer: animate electrons being added to nucleus in succession filling shells
- [x] `images/feedback/image-24.png` — Tallow Q2 S6 shrink specimen samples to fit trays cleanly
- [x] `images/feedback/image-25.png` — Tallow Q2 S6 uncover Samples D & E; animate electron flying out/in when tested and revert on removal
- [x] `images/feedback/image-27.png` — Tallow Q2 S7 remove 3D explainer model
- [x] `images/feedback/image-29.png` — Tallow Q3 S7 show Potassium (K) card under Sodium (Na)
- [x] `images/feedback/image-30.png` — Tallow Q4 S1 shrink proton & neutron pieces so they fit in the nucleus together
- [x] `images/feedback/image-31.png` — Tallow Q4 S2 remove 3D explainer model
- [x] `images/feedback/image-32.png` — Tallow Q4 S4 replace `"needle"` with `"charge"` in specimen paint
- [x] `images/feedback/image-33.png` — Tallow Q4 S5 explainer: animate 2 electrons leaving Mg, smiley face on stable nucleus, text `"Magnesium 2+ has a full outer shell, so it is stable"`
- [x] `images/feedback/image-34.png` — Tallow Q4 S7 make ion charges (`Mg²⁺`, `Cl⁻`) clearly visible with proper superscripts
- [x] `images/feedback/image-35.png` — Tallow Q4 Vess debrief: slow down and exaggerate/highlight electron transfer
- [x] Line 81 — Tallow Q5 Vess debrief: remove chlorine tampering part
- [x] `images/feedback/image-37.png` — Tallow Q6 S1 remove tour + pre-build CH₄ molecule; globally in atom kit replace 3D center cylinder bonds with thick 2D plate-center lines, touching 3D atoms, and frozen shared electrons between them

## Phase 4: Lanternfall Q1–Q3 (`unit02/q1-wave`, `q2-photon`, `q3-lines`) & Z-Fighting
- [x] `images/feedback/image-41.png` — Q1 S3 result dial: `"Not set"`, `"Red is faster"`, `"Violet is faster"`, `"Neither is faster"`
- [x] `images/feedback/image-42.png` — Q1 S4 draw wave + wavelength measurement on 2D ruler; rename sources to `"Radio"`, `"Microwave"`, `"X-ray"`, `"Red"`, `"Violet"`
- [x] `images/feedback/image-44.png` — Q1 Vess debrief: remove crests-counted text, show continuous wavelength/color/frequency shift graphic; remove photoelectric teaser
- [x] `images/feedback/image-45.png` — Q2 add introductory discovery stage before Bright Red prediction where user sees light knock electrons off metal
- [x] `images/feedback/image-47.png` — Q2 photocell animated white dots flowing out when threshold met (speed/rate scales with brightness) in live 3D tabletop
- [x] `images/feedback/image-48.png` — Q2 photoelectric explainer: remove buttons, auto-play red then UV photons at multiple brightnesses
- [x] `images/feedback/image-49.png` — Q2 remove redundant "The Lowest Frequency" stage and fold threshold frequency/work function into previous stage
- [x] `images/feedback/image-50.png` — Q2 S5 compact photocell: fix overlap between Colour dial, red LAMP text, and HOLDER
- [x] `images/feedback/image-53.png` — Q2 Vess debrief: separate concepts cleanly one at a time instead of all at once
- [x] `images/feedback/image-55.png` — Q3 S2 fix filament/tube base z-fighting with cradle, fix overlap between Helium tube and Band plate, fix tray blue edge z-fighting
- [x] `images/feedback/image-56.png` — Q3 S3 remove `"No strip alongside"`, remove golden matched lines & match count text, rename `"Alongside"` to `"Reference"`, fix reference strip edge z-fighting
- [x] `images/feedback/image-57.png` — Q3 S5 add absorption explainer animation (matching photon climbs ladder, other colors pass through)

## Phase 5: Lanternfall Q4 (`unit02/q4-cloud`) & Orbital Explainers
- [x] `images/feedback/image-58.png` — Q4 add exploratory wave-particle duality stage before "Waves That Fit"
- [x] `images/feedback/image-59.png` — Q4 ring track: remove 2D ring wave, keep only 3D standing wave with visible peaks/troughs, trace-in + grow/shrink animation, rename trays to `"Grows stronger"` and `"Grows weaker"`
- [x] `images/feedback/image-60.png` — Q4 standing-wave explainer: remove all buttons and unnecessary words, auto-playing clear animation
- [x] `images/feedback/image-61.png` & `images/feedback/image-62.png` — Q4 remove Stage 4 ("Two Lobes") and replace with a better p-orbital stage with a clear question
- [x] `images/feedback/image-63.png` — Q4 cloud view fixture: remove `"JOYSTICK"`, enlarge joystick, remove Turn/Tilt angle markings
- [x] `images/feedback/image-64.png` — Q4 d-orbitals stage & explainer: make it clear they are d-orbitals during the stage; remove buttons and text from explainer (animation only)
- [x] `images/feedback/image-65.png` — Q4 Vess debrief: actually show s, p, and d orbital shapes

## Phase 6: Lanternfall Q5–Q8 (`unit02/q5-numbers`, `q6-filling`, `q7-pes`, `q8-trends`)
- [x] `images/feedback/image-66.png` — Q5 S1 make selected orbital obvious, fix `"No orbital has this address"` overlapping `"Target"`, add 3D orbital preview in corner (showing all p orbitals with active ml highlighted)
- [x] `images/feedback/image-67.png` — Q5 remove prediction stage ("How Many in an Orbital") and "Orbital Capacity" stage
- [x] `images/feedback/image-68.png` & Line 147 — Q5 Pauli stage: prettier card display & layout, clearer prompt to place electrons, remove empty diagram labels, replace placed big card with small quantum-number label next to arrow; add more electron-sorting stages at the end of Q5
- [x] `images/feedback/image-69.png` & `images/feedback/image-70.png` — Q5 Vess debrief: real arrowheads instead of lines with balls; rewrite beat 3 clearly with accompanying animation
- [x] `images/feedback/image-72.png` & `images/feedback/image-73.png` — Q6 remove `rack` animation from Stage 1 and Stage 5 reward explainers
- [x] Line 159 — Q6 add Aufbau exception stages (Chromium, Copper) at the end of Q6
- [x] `images/feedback/image-74.png` — Q7 S2 remove golden cut-off caption text in PES chamber
- [x] `images/feedback/image-75.png` & `images/feedback/image-76.png` — Q7 remove `rack` animation from Stage 3 and Stage 5 reward explainers
- [x] `images/feedback/image-78.png` — Q8 replace Stage 2 ("What the Outer Electron Feels") with a more interactive, visual electron shielding stage

## Phase 7: Verification & Documentation
- [x] Run `npm run verify` and `npm run build` — **ALL 39 CHECKS + BUILD OK**
- [x] Update `CLAUDE.md` with any architectural/system updates
