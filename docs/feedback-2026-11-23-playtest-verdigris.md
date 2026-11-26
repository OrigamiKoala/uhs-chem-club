# Playtest feedback 2026-11-23: Verdigris (unit09)

**Second session, 2026-11-25: q8-capacity (8 stages) and boss-leach (5 phases) were played and are at the end of this file** ("Verdigris, part 2"). With part 1 that is 67 of 67 stages. 3D On, 1440 x 900, guest account. Part 2 benches were reached by URL with every quest marked complete; each stage was played in order from its first. A wrong answer was tried on q8-capacity stages 3 to 8 (not stage 1 or 2: both were right first time) and on boss-leach phases 1, 3, 4, 5 (phase 2 was submitted before the cards were placed). Hint rung 3 was read only where a second wrong answer opened it.

**Not played, not checked:** the flight to Verdigris, the arrival cutscene, the walk to the benches, the opening scenes (question cards were read), NPCs, the world terrain, 3D Off, phone width. Practice and worked-problem cards skipped (out of scope). No screenshots saved.

**Caveats from part 1 (still true for q1 to q7):** each bench was opened by URL after marking units 1 to 8 complete; hints were opened only on q1 stage 3 and q6 stage 7 (rung 1); hint rungs 2 and 3 are unchecked in q1 to q7; on q1 stage 3 `q1-handover.js` was read after two wrong tries and on q6 stage 7 `phdata.js` was read for the exact concentration; debrief slides 2 to 4 of q1 were clicked through without reading.

## Verdigris

**q1-handover, question card.** "The runoff from the Fifth's plant is eating through the fort's pipes. What is it doing to the water it reaches?" then prompt "Which particle holds the proton after HCl is poured into water?" - the card asks about the water, the prompt asks about "the proton"; the word proton has not been introduced when the prompt is read. (tour 1 introduces it, but tour is optional.)

**q1-handover, stage 1, bench.** Whole bench is very dark; the particle window spheres are dim bronze on near-black and hard to tell apart (HCl vs H2O vs hydrogens). Brighten.

**q1-handover, stage 1, tour.** Tour opened by itself right after pressing Start on the question card (3 steps: 1/3 H+ definition, 2/3 "Press Pour and watch the hydrogens move.", 3/3 "Drag it into a particle's seat." with hand on proton). Step 3 "particle's seat" is an odd made-up phrase; say "Drag the proton onto the molecule that holds it". Legend under window changes between steps ("HCl, H2O, HCl hydrogens" -> "Cl-, H3O+, HCl hydrogens") which shows the answer name before Pour is pressed in step 1? (legend read before pour: HCl/H2O).

**q1-handover, stage 1, bench.** The tray label "HCl" turns into "Cl-" and the legend reads "Cl-, H3O+" the moment Pour is pressed, so the labels tell you which molecule is left and which one is hydronium before you decide. The Pour button is a tiny key at the bottom right of the window and is easy to miss. Make it larger and label it "Pour HCl into water".

**q1-handover, stage 1, miss message.** Putting the proton on HCl gives "A particle cannot take its own proton." Plain reading is unclear (the proton was never "its own" to a student). Say "The proton came from HCl. Which other particle could be holding it now?"

**q1-handover, stage 1, bench.** Putting the proton in the HCl tray makes the poured picture un-pour (all particles go back to the dim un-poured state) and then re-pour after Submit. Looks like a glitch. Keep the poured picture on screen while the proton is moved.

**q1-handover, stage 1, reward card.** Banner "Handing Over a Proton. Each HCl donated (passed) a proton to a water molecule, making hydronium, H3O+, and leaving Cl-. A substance that donates a proton is a Bronsted-Lowry acid." Plain text banner only (no animation), and "donated (passed)" and "Bronsted-Lowry" in one sentence is too much; first use of "hydronium" and "Bronsted-Lowry" together. Split it: show the proton moving from HCl to the water in an animation, then name hydronium.

**q1-handover, stage 1, hints.** Not checked (Hint button was not opened before solving).

**q1-handover, stage 2 (predict), tour.** A tour box ("CARDS: Drag a card to its place.") opened by itself on arrival after "Next stage", covering the cards. A student who has not pressed TOUR should not get this; and the step is a gesture-only "how to drag" tour. Remove it or open it only on the first predict stage of the game.

**q1-handover, stage 2, prompt.** "Which best describes what ammonia, NH3, will do when it is poured into water?" Nothing so far says what ammonia is or that bases exist, so the student can only guess; the cards ("Nothing: it has no OH to give", "Break apart and release OH-", "Accept a proton from water, leaving OH-", "Donates a proton to water", "Dissolve and stay as it is") use "OH-" that has never been introduced. Give one line of what OH- is, or drop the two cards that mention it.

**q1-handover, stage 2, bench.** The bench shows the HCl picture ("Hydrochloric acid in water, 0.10 M HCl") under an ammonia question; it reads as the wrong picture. Show an empty beaker labelled "Water" or the ammonia bottle.

**q1-handover, stage 2, bench.** A dropped card is larger than the "My prediction" slot and lands half over the neighbouring card "Donates a proton to water", hiding its text. Shrink the card in the slot or move the slot clear of the stack.

**q1-handover, stage 3, bench (proton bench).** I could not tell which of the two protons to carry. Each of the two particles on the proton bench has a white proton beside it, and the trays below are named after the same particles, so "carry a proton to a particle" reads as "put any proton on any particle". I tried: left proton into the water tray (miss "...the proton you moved comes straight back"), left proton into the ammonia tray (miss "A particle cannot take its own proton." because that proton belongs to ammonia). Only the right proton (water's) into the ammonia tray passes. Show a line from each proton to the particle it belongs to, and rename the trays "Gives" and "Receives" or make the prompt say "Move a proton from one particle to another".

**q1-handover, stage 3, bench.** The tray labels change under you: "NH3" becomes "NH4+" and "H2O" becomes "OH-" after the first Submit, giving the answer away for the second try. Keep them fixed until solved.

**q1-handover, stage 3, bench.** After the move the proton is drawn floating beside the tray rather than seated in it (about 30 px off the tray square). Seat it in the tray.

**q1-handover, stage 3, miss message.** "In the window, 3 of 8 ammonia particles changed, and each went from three hydrogens to four; the proton you moved comes straight back." Good evidence but it tells a student what the answer looks like ("three hydrogens to four"). Drop that clause or keep only the count.

**q1-handover, stage 3, hint 1.** "Press "Pour" and watch the white hydrogens, then carry a proton on the proton bench." Does not say which way a proton moves. Hints 2 and 3 not opened.

**q1-handover, stage 3, reward.** Text banner: "A Base Accepts a Proton. The prediction held: water donated a proton to ammonia, making NH4+ and leaving OH-. A substance that accepts a proton is a Bronsted-Lowry base." When the prediction was "Accept a proton from water" the banner is fine; check what it says if the prediction was wrong. Also text only, no animation.

**q1-handover, stage 3, bench.** Stage 3 uses the same bench and the same gesture as stage 1 and the particle window shows "0.00010 M NH3" (a number with no meaning at this point). Remove the concentration or explain it.

**q1-handover, stage 4, tour.** Tour opened by itself on arrival (2 steps: "What is left of an acid after it donates a proton is its conjugate base. The two differ by one proton." then "FORMULA CARDS 2 / 2 Drag it into a place."). The prompt "What is the conjugate base of each acid?" uses "conjugate base" before it is defined; a student who skips the tour has no definition. Put the definition in the prompt: "Each acid hands over one proton. Match each acid to what is left."

**q1-handover, stage 4, bench.** The four acids on the left (HNO3, H2O, NH4+, HCN) cannot be picked up and nothing says they are fixed; the middle slots are unlabelled. Six answer cards for four slots with two spares (H3O+, NH2-), fine, but H3O+ has no acid to pair with on this bench, which is confusing; remove it or add its acid (H2O is not its pair).

**q1-handover, stage 4, bench.** Cards are bigger than their slots and land offset and on top of each other: CN- sat half off the HCN slot, NH3 overlapped the NH4+ slot and the CN- card. Make cards the size of the slots, snap them exactly, and space the slots further apart.

**q1-handover, stage 4, miss message.** "NH3 has 3 hydrogens and no charge, beside HNO3 has 1 hydrogen and no charge." The sentence is broken ("beside HNO3 has"). Say "NH3 has three hydrogens and HNO3 has one. A conjugate base has exactly one hydrogen fewer."

**q1-handover, stage 4, reward.** "Conjugate Pairs. An acid and the particle left when it donates a proton are a conjugate acid-base pair. Each pair differs by one proton." Text only. Fine to keep; it repeats the tour step word for word.

**q1-handover, stage 4, hints.** Not opened.

**q1-handover, stage 5, prompt/bench.** Prompt "Which substance acts as an acid in one window and as a base in the other?" is clear, but the five cards (HNO3, NH3, H2O, NO3-, NH4+) are all things the student has just seen, and only one is in both windows, so the two windows are not needed: read the legends "HNO3, H2O, water hydrogens" and "NH3, H2O, water hydrogens" and the answer is the repeated name. Make the cards include a decoy that is in both windows but only ever one role (for example H3O+ if shown) or remove one window's legend names.

**q1-handover, stage 5, bench.** The "Pour" keys at the bottom right of each window are small and unlabelled for a stage that does not need them; the windows already look poured. Either remove the Pour keys or make the stage need them.

**q1-handover, stage 5, bench.** The H2O card dropped in "Acts both ways" overlaps the neighbouring NH4+ card and hides its text; the slot is smaller than the card. Same fix as stage 4.

**q1-handover, stage 5, miss message.** "NH3 is in the second window only, and there it gained a hydrogen." Clear. Keep.

**q1-handover, stage 5, reward.** "Amphoteric. Water accepted a proton from nitric acid and donated a proton to ammonia. A substance that can act as an acid or a base is amphoteric." Good plain content; but "amphoteric" is the stage's one new word and appears only here, never as a label on the bench. Put the word on the slot label ("Acts both ways (amphoteric)").

**q1-handover, stage 5, hints, tour.** No tour opened on this stage. Hints not opened.

**q1-handover, stage 6, tour.** Opened by itself on arrival (3 steps). Step 1 packs "autoionization", "H3O+", "OH-", "moles per litre" into one box. Step 2 "Put cards above and below the line. Each column prints a number." does not say what the line is (a division line) or that cards on the same side multiply. Step 3 "Drag a card onto the board." puts the H3O+ card on top of the "Pure water" column header and hides its numbers while the box stays up. Keep one idea per step and show a finished example (H3O+ over OH-) on a blank column set.

**q1-handover, stage 6, prompt.** "Which combination of the two concentrations is the same for all three waters?" "Combination" and "concentration" have not been taught here (moles per litre is only in the tour). Say "Build a calculation with the two cards that gives the same number for pure water, acid water and base water."

**q1-handover, stage 6, bench.** The board prints the result live under each column (1.00, 1.00 x 10^8, 1.00 x 10^-20 ... then 1.00 x 10^-14 in all three). That makes the stage trial and error: drop cards until three numbers match, without knowing what the cards mean. Keep the live numbers but make the student pick "multiply" or "divide" deliberately first, or hide the numbers until Submit.

**q1-handover, stage 6, bench.** Everything on the board is tiny and dark: the column concentrations ("H3O+ 1.0 x 10^-7") are about 6 px high and the slots are dim. Enlarge the board text, brighten the slot outlines.

**q1-handover, stage 6, bench.** Dropped cards land on the line between slots and half-cover the column text (the OH- card covered the "Pure water" number). Snap cards to the slots and size them to fit.

**q1-handover, stage 6, reward.** "Autoionization and Kw. [H3O+] x [OH-] is 1.0 x 10^-14 in every water at 25 C. That constant is Kw, and in pure water each ion is 1.0 x 10^-7 mol/L." Too many new things (autoionization, Kw, 25 C, mol/L, square brackets) in two sentences, plain text. Show it as a short animation of two waters swapping a proton, then give Kw alone.

**q1-handover, stage 6, miss/hints.** Only the correct board was tried after two wrong shapes (ratio gave 1.00 / 10^8 / 10^-20); the board itself acts as the miss message. Hints not opened.

**q1-handover, stage 7, tour.** Opened by itself: "Not every acid-base reaction moves a proton. The Mark dial lets you follow either the hydrogens or the lone pairs (unshared electron pairs)." One step only, and it never shows what to do with the Mark dial (set it, then press Pour). "Lone pairs" and "unshared electron pairs" have not been met anywhere in Verdigris so far; it is a new idea with no picture.

**q1-handover, stage 7, prompt.** "What moves when boron trifluoride, BF3, meets ammonia?" A student with no chemistry cannot tell what "meets" means (a reaction?) or what boron trifluoride is. Say "BF3 gas is mixed with ammonia. What moves between the two particles?" and mark the stage as extra (beyond the exam) so it does not read as required.

**q1-handover, stage 7, bench.** The particle window is small and the orange lone-pair marks are 2 or 3 px dots among bigger spheres, hard to follow when Mark is set to "Lone pairs" and the pour is run. Enlarge the marked lone pairs and make the pair visibly travel from nitrogen to boron.

**q1-handover, stage 7, bench.** The two dials ("Mark" in the window, "What moved" beside it) both have a knob drawn at the far end and read "Set to -" with labels (A proton, An electron pair, Nothing) in tiny text. The Mark dial's labels ("Off", "NH3 hydrogens", "Lone pairs") are cut off at the window edge. Move the labels clear of the knob.

**q1-handover, stage 7, miss message.** "In the window every hydrogen of NH3 is still on the nitrogen after the pour." Clear and based on what the window shows. Keep.

**q1-handover, stage 7, reward.** "BF3 accepted a lone pair from NH3; no proton moved. Lewis Acid and Base. Nitrogen shared its lone pair with boron, and no proton moved. A substance that accepts an electron pair is a Lewis acid; one that donates it is a Lewis base." Says "no proton moved" twice. Cut to one sentence plus the definition, and draw the arrow from nitrogen to boron.

**q1-handover, stage 7, hints.** Not opened.

**q1-handover, stage 7, bench (after Submit).** In the instant after the correct answer the label of the "What moved" dial grew into huge orange text ("An electron pair") spread across the dial and over the "A proton / An electron pair / Nothing" labels. Looks like a pop animation stuck mid-size. Keep the label the same size.

**q1-handover, debrief, slide 1 of 5.** Vess: "When HCl meets water, 8 of 8 hydrogens leave as protons and join water molecules to make hydronium. A proton donor like HCl is a Bronsted-Lowry acid." Picture is the ammonia window with "0 of 8 ammonia particles have taken a hydrogen" while the line talks about HCl: the picture does not match the words. Show the HCl window with 8 of 8.

**q1-handover, debrief, slide 5 of 5 (Case Pin).** Picture is the Kw table "H3O+ times OH-, in three waters" under the pin "The runoff donates protons to the water: it is acid waste." The table says nothing about runoff, so the pin does not follow from the picture. End on the HCl picture (acid gives protons, water takes them), and leave Kw to its own slide. The opening question ("What is it doing to the water it reaches?") is answered, good.

**q1-handover, debrief, slides 2 to 4.** Stepped through them quickly without reading each one; not checked. 

**q1-handover, in general.** (1) A tour box opens by itself on stages 1, 2, 4, 6 and 7 (not 3 or 5) the first time you arrive; the owner's rule is the tour only opens when TOUR is pressed, so this is inconsistent across stages. (2) Banner text rewards on every stage are plain text with no animation; stage 1 and 3 are the same bench and gesture, repeated. (3) The whole bench is much darker than the Kettle and Teeter benches; the particle window spheres are bronze and dim in the unpoured state. (4) Hints were not opened on any stage except 3 hint 1.

**q2-scale, question card.** "The acid meters on the marsh tanks read numbers only a few steps apart. How much more acidic is a tank one step lower?" then the bench prompt is "What does a tenfold dilution do to the pH of an acid?" The card asks about steps between tanks, the stage asks about dilution; the link is never said. Also "pH" and "tenfold dilution" appear before anything has explained them. Make the prompt "Add water to the acid one tenfold step at a time. What happens to the pH meter's number?"

**q2-scale, stage 1, tour.** Opened by itself after Start (3 steps). Step 1 "The pH meter reads how much H3O+ a solution holds. The lower the pH, the more H3O+." is the whole idea of pH in one line with no picture; fine to keep but it also hands over half the answer. Step 2 "Lay a meter on the seat. Dilute adds water." calls the flask rim a "seat" (same odd word as q1); say "Put the meter on the flask". Step 3's highlight box sits on the empty spot where the meter started, not on the meter.

**q2-scale, stage 1, bench.** "Dilute" key, flask readout "H3O+ in a fixed sample: 1000" and "0.10 M" are tiny and dark; the flask picture changes (fewer orange ions) which is good. The pH meter must be dragged onto the flask before it reads; before that nothing says the numbers are missing. Label the meter "Drag onto the flask to read pH".

**q2-scale, stage 1, bench.** Answer cards "Rises by 1 / Falls by 1 / Halves / Rises by 10" are bigger than the "My answer" slot; a dropped card hung half outside it and covered the slot label, and the neighbouring cards overlapped each other. Shrink cards to the slot size.

**q2-scale, stage 1, miss message.** "Dilute the acid at least twice with the pH meter on it." It is an instruction, not a reason, and does not say what was wrong with "Rises by 10". Say "pH went from 1.00 to 2.00 to 3.00. How much did it change per dilution?" only after the student has diluted.

**q2-scale, stage 1, reward.** Banner "The pH Scale. Each tenfold dilution leaves a tenth of the H3O+ and raises the pH by 1. One step on the pH scale is a factor of ten." Clear, short. Text only; show the flask thinning with the meter ticking 1, 2, 3.

**q2-scale, stage 1, hints.** Not opened.

**q2-scale, stage 2, prompt.** "What is the pH of 1.0 x 10^-5 mol/L hydrochloric acid?" No tour opened here. The three flasks on the bench are 0.010 M, 0.0010 M and 1.0 x 10^-4 M, and the question concentration is not among them, so the student must extend the pattern (2, 3, 4, then 5). Good idea, but the bench never says to compare; add the line "Read the flasks, then answer for the one that is not on the bench."

**q2-scale, stage 2, bench.** Dropping the pH meter on the lowest edge of the third flask left it hanging outside the flask seat and the meter read "-" (no reading). The seats are dark squares that look like part of the picture. Make the whole flask a drop zone and snap the meter onto the seat.

**q2-scale, stage 2, bench.** Flask concentrations ("0.010 M", "0.0010 M", "1.0 x 10^-4 M") are tiny and use three different styles in a row. Use the same style (1.0 x 10^-2, 10^-3, 10^-4).

**q2-scale, stage 2, miss message.** Typed 4: "Compare 1.0 x 10^-5 mol/L with 1.0 x 10^-2 mol/L (pH 2.00) and 1.0 x 10^-3 mol/L (pH 3.00)." It gives pH values for flasks I had not yet read (I had read none), so the evidence is handed over in the miss text. Say "Read each flask with the meter and see how the pH moves."

**q2-scale, stage 2, reward.** "For a power of ten, the pH is the exponent with its sign dropped. Powers of Ten. 5.00. Hydrochloric acid donates all its protons to water, so its H3O+ concentration is its own concentration, and the pH is the power of ten with its sign dropped." The same rule is stated twice, and "exponent with its sign dropped" is jargon. Say "The pH is the number after the minus sign: 10^-5 gives pH 5."

**q2-scale, stage 2, hints.** Not opened. The number box at the bottom right is labelled just "pH" with no unit or hint that decimals are allowed.

**q2-scale, stage 3, tour.** Opened by itself with one long box: "For a concentration between two powers of ten, the logarithm gives the place between: pH = -log[H3O+]. The log key on the calculator works it out." plus a three-line worked example for 2.0 x 10^-3 (pH 2.70). First time "logarithm" and "pH = -log" appear, in a tour a student can skip. Move the idea onto the bench (a pH line with the two flasks marked and the new one between them), not a formula box.

**q2-scale, stage 3, prompt.** "What is the pH of 3.2 x 10^-4 M hydrochloric acid, to two decimal places?" The only way to get 3.49 is the log key; the bench flasks (0.0010 M and 1.0 x 10^-4 M) only tell you "between 3 and 4". I solved it with my own knowledge of logs. Either accept "between 3 and 4" through a number line stage first, or say in the prompt "Use the calculator's log key".

**q2-scale, stage 3, Primer.** The new PRIMER key opens a window with two plain browser sliders (blue, default styling, not the bench's dials) labelled "Power of ten -4First digit 3" with the words run together, and a result "-3.52" for 3 x 10^-4 (the stage is 3.2, so the primer never shows the stage's own number). Style the sliders like the game, put a space between the labels, and let the first digit move in tenths.

**q2-scale, stage 3, miss message.** Typed 3.2: "A pH of 3.20 stands for 6.3 x 10^-4 mol/L of hydronium; this flask holds 3.2 x 10^-4 M of acid, all of it ionized in the window." Too many numbers, and "ionized" is new. Say "pH 3.20 would mean more acid than this flask holds."

**q2-scale, stage 3, reward.** "Reading a Concentration. 3.49, between the readings 3.00 and 4.00 of the flasks on either side. The logarithm places every concentration on the pH scale." Fine; drop "The logarithm places every concentration on the pH scale" (jargon, repeats the tour).

**q2-scale, stage 3, hints.** Not opened.

**q2-scale, stage 4, tour.** Opened by itself: "The pOH meter counts OH- the way the pH meter counts H3O+." One step, no pointer action shown, and "pOH" is introduced only here. Fine as a line, but the stage is about pH + pOH so say what pOH is on the bench label ("pOH: OH- counted like pH").

**q2-scale, stage 4, prompt/bench.** "What do the pH and the pOH of a solution add up to?" with three NaOH flasks (0.10 M, 0.010 M, 0.0010 M) and one pH meter and one pOH meter. Only one meter fits on a flask at a time: dropping the second meter on a flask throws the first one off, so a student can never see pH and pOH of the same flask side by side and must remember one number. Let both meters sit on the same flask (one seat each).

**q2-scale, stage 4, bench.** Meters do not land where they are dropped: aiming at the second flask put the meter on the first, and aiming at the first once put it on the second, and a meter dropped between flasks hung half over the flask legend ("Na+ OH-") hiding it. Make the whole flask the target and snap to the nearest seat.

**q2-scale, stage 4, miss message.** Typed 13 (a number read off a meter): "Sample at least two flasks with the meters first." Good rule but it shows even when the number is plainly wrong for the flask read, and it appeared again after I typed 14 with only one flask sampled with a pair; it does not say that both meters must be read on the same flask. Say "Read pH and pOH on two flasks and add each pair."

**q2-scale, stage 4, reward.** "pOH. 14. In every flask at 25 C, pH + pOH = 14." One line, fine, but it never ties back to Kw from q1 stage 6 (10^-14). Add "14 comes from Kw = 10^-14".

**q2-scale, stage 4, hints.** Not opened.

**q2-scale, stage 5, prompt.** "What is the pH of 0.025 M barium hydroxide, to two decimal places?" No tour opened. Two steps are needed (count the OH-, then pOH to pH) and nothing on the bench says "count the OH- first". I solved it by knowing Ba(OH)2 has two OH-; the bench window shows "Ba2+ OH-" without counts. Show the formula Ba(OH)2 on the flask label and let the window count OH- per formula unit.

**q2-scale, stage 5, bench.** The pH meter is on the bench and I never used it (the flask reads 0.025 M, meter would read the answer), so either it gives the answer away or it is unused. Lock the meter on this stage or remove it.

**q2-scale, stage 5, miss message.** Typed 12.40: "The window shows two OH- for each Ba(OH)2 formula unit; that figure counts one." Good: tells exactly what went wrong. Keep. "Formula unit" is new; say "each Ba(OH)2".

**q2-scale, stage 5, reward.** "Strong Bases. 0.025 M Ba(OH)2 gives 0.050 M OH-: pOH 1.30, pH 12.70. A base that releases all of its hydroxide ions is a strong base." Good and short. The term "strong base" is first named here after two stages of strong acids/bases; fine.

**q2-scale, stage 5, hints.** Not opened.

**q2-scale, stage 6, prompt.** "What happens to the pH of hydrochloric acid as it is diluted again and again?" Good question. No tour opened. Only one wrong-answer path was not tried (I read the meter first), so there is no miss message note. The three cards ("It keeps rising steadily", "It levels off at one value", "It drops back down") are fine but "at one value" is vague; say "It stops near a number".

**q2-scale, stage 6, bench.** The pH meter, when laid on the flask, covers the "Dilute" key (the key sits under it at the flask's bottom edge); I had to click the visible sliver of the key. Move the key to the side of the flask or the meter's seat above it.

**q2-scale, stage 6, bench.** After the fourth dilution the banner "No more water can be added." appears with no word on why it stops (the flask reads 7.00 at the 10^-9 M step). A student cannot tell whether they have reached the limit of the bench or of the chemistry. Let the student keep diluting and see the number stay at 7, or label the end ("limit of the bench: 1.0 x 10^-9 M").

**q2-scale, stage 6, bench.** The "levels off" card dropped on "My answer" covers the slot and the slot label; same oversize-card problem as stage 1.

**q2-scale, stage 6, reward.** "Strong Acids and the Floor. Water supplies 1.0 x 10^-7 mol/L of H3O+ of its own, so the 1.0 x 10^-9 M flask reads 7.00, not 9.00." Title "the Floor" is a made-up name (it is a limit, not a floor in the picture: pH rises to 7). Rename "Water's own H3O+" and say "pure water is pH 7, so no acid can read higher than 7".

**q2-scale, stage 6, hints.** Not opened.

**q2-scale, stage 7 (predict), prompt/bench.** "Which best describes the pH of pure water after it is warmed to 50 C?" Nothing so far says temperature changes anything (stage 4 says "at 25 C" only in the reward), so the student can only guess. Fine for a predict stage, but the bench only shows "Pure water, 25 C" with "0 M" under it. "0 M" makes no sense for water (it reads as nothing dissolved) and the 25 C label is the only hint. Remove "0 M". Add a thermometer or a "warm" dial so the next stage has something to turn.

**q2-scale, stage 7, bench.** The four cards ("The pH is exactly 7.00", "above 7", "below 7", "The pH is 0") include one absurd card ("pH is 0") that nobody will pick; replace it with "The pH depends on the container". The dropped card again covers the "My prediction" label.

**q2-scale, stage 7, after Submit.** Banner "Next, the pure water is warmed and read." is fine. No tour opened.

**q2-scale, stage 8, prompt.** "You predicted "The pH is below 7". Is pure water at 50 C acidic, neutral or basic?" The prediction quote makes the stage feel like a trap (below 7 sounds acidic). Good teaching idea. No tour opened. A student has never been told what "neutral" means in this world, so say "neutral means H3O+ and OH- are equal" on the dial label or the bench.

**q2-scale, stage 8, bench.** The temperature dial (25 C to 50 C) only has the two end labels; the pH meter gives 6.63 and the bench prints "H3O+ 2.3 x 10^-7, OH- 2.3 x 10^-7" in orange without being asked. That printed pair is the answer on screen even before the meter is used. Fine as evidence, but then the pH meter and the dial are both unnecessary once the dial is turned; make the printed counts appear only when the "Counter" is switched on.

**q2-scale, stage 8, bench.** The answer dial ("The warm water is", Acidic / Neutral / Basic) is hard to hit: the knob sits above its track and a drag started a few pixels off did nothing (the dial stayed on Acidic after I dragged at its old label position). When the dial moves the chosen word pops up huge ("Acidic" in big orange letters) to the right of the dial and stays there. Remove the pop-up, same glitch as q1-handover stage 7.

**q2-scale, stage 8, miss message.** "At 50 C the counter counts 2.3 x 10^-7 mol/L of H3O+ and 2.3 x 10^-7 mol/L of OH-." It states the evidence and leaves the student to conclude "equal means neutral". Add "Equal amounts of both is what neutral means." "The counter" is an unnamed instrument.

**q2-scale, stage 8, reward.** "Warm water is neutral at a pH below 7. Neutral Is Not Always 7. The prediction held. At 50 C pure water reads 6.63 yet holds equal H3O+ and OH-, 2.3 x 10^-7 mol/L each, so it is neutral." Good. Text only.

**q2-scale, stage 8, hints.** Not opened.

**q2-scale, stage 9, tour.** Opened by itself with a worked example: "To go from a pH back to a concentration, undo the logarithm with a power of ten: [H3O+] = 10^(-pH). 1. pH = 3.30 2. [H3O+] = 10^(-3.30) 3. = 5.0 x 10^-4 mol/L". Three problems: it is the same calculation as the stage, so it is a worked answer; "undo the logarithm" and "10^(-pH)" are first seen here; and the number box then says "(like 5.0e-4)", which is the example's answer, so the tour and the box repeat each other. Keep one of them.

**q2-scale, stage 9, prompt.** "What is the concentration of H3O+ in the sealed flask, in mol/L?" "Sealed" and "concentration hidden" on the bench are clear. Good use of the meter. I read 2.62 on the meter and needed a calculator (the Calc key is at the bottom right); nothing on the stage says the calculator is allowed.

**q2-scale, stage 9, bench.** The pH meter, dropped on the flask, sits across the corner of the particle window and hides part of it. Seat it beside the window.

**q2-scale, stage 9, miss message.** Typed 2.62: "2.62 is the number the meter shows; the question asks for mol/L of hydronium." Clear.

**q2-scale, stage 9, reward.** "Back From the Scale. 2.4 x 10^-3 mol/L. A pH of 2.62 gives [H3O+] = 10^(-2.62), the concentration of hydrochloric acid in the sealed flask." Fine. It repeats the tour. The typed answer needs scientific notation ("2.4e-3"); the placeholder "like 5.0e-4" tells you how; accepted.

**q2-scale, stage 9, hints.** Not opened.

**q2-scale, debrief, slide 1 of 5.** Vess: "Each tenfold dilution of hydrochloric acid raised the pH by 1: 1.00, 2.00, 3.00. Because pH is a log scale, one step is a factor of ten." In the first frame I saw, the picture was the sodium hydroxide table ("0.10 M pH 13.00 pOH 1.00 ...") which belongs to slide 2. Make the picture follow the line. "Log scale" is jargon; say "each step down is ten times more acidic".

**q2-scale, debrief, slides 2 to 4.** Slide 2 "pOH counts hydroxide the way pH counts hydronium. At 25 C the two always add up to 14.00." Slide 3 "Diluted repeatedly, hydrochloric acid read 6.00, 6.79, 6.98 and 7.00. Water's own hydronium ions stop the pH from rising past 7." Slide 4 "Water at 50 C reads 6.63 yet still holds equal H3O+ and OH-. Neutral means equal amounts of both ions, which equals pH 7 only at 25 C." Short and one idea each. The list 6.00, 6.79, 6.98 does not match what a student sees on the bench (the bench starts at 1.0 x 10^-6 M and the first two dilutions read 6.98 then 7.00; the student never sees 6.00 or 6.79 as listed).

**q2-scale, debrief, Case Pin.** "Each pH step is a tenfold change in acidity." It answers the card's question ("How much more acidic is a tank one step lower?"). Good. Opening scene not seen (bench entered by URL).

**q2-scale, in general.** (1) The stage-5 and stage-9 tours/boxes that open by themselves again hold worked examples (stage 3 and 9 effectively give the method); a student who skips them can still solve everything from the miss messages, which is fine, but the miss messages often hand over the next number (stage 2 gives pH 2.00 and 3.00, stage 3 gives 6.3 x 10^-4). (2) Every stage's reward is a one-line text banner with no animation; the pH ticks (1, 2, 3 per dilution) and the flask thinning would show the idea better than the words. (3) Typed stages (2, 3, 5, 9) all depend on a log calculator the student was only told about in the tour (Primer button on stages 3, 5, 9 only); put the same Primer and Calc on stage 2 and say so in the prompt. (4) Answer cards and typed boxes are tiny at the bottom right ("pH", "pH + pOH", "H3O+ in mol/L (like 5.0e-4) M"); enlarge the box and its label. (5) Stage 1 is the only one with a link to the question card's story (marsh tanks); stages 2 to 9 never come back to the tanks.

**q3-weak, question card.** "Two waste tanks hold the same amount of acid, yet one eats through steel and the other barely stains it. Why?" Then the bench prompt: "Which best describes the pH readings of 0.10 M hydrochloric acid and 0.10 M acetic acid, read side by side?" The link works (same amount, different strength) but "acetic acid" is a new name with no link to the tanks; say "Tank A is hydrochloric acid, tank B is acetic acid (vinegar's acid)".

**q3-weak, stage 1 (predict), tour.** A one-step tour box ("NAME CARDS: Drag a card to its place.") opened by itself on Start. It is a gesture already taught in q1 and q2; remove it. It also sat on top of the cards.

**q3-weak, stage 1, bench.** Two tiny name cards at the top ("0.10 M hydrochloric acid", "0.10 M acetic acid") have no slot and no purpose I could find; they look like leftovers. Remove them or give them slots. The HCl picture is shown under a question about two acids, and acetic acid is not shown at all. Show both flasks.

**q3-weak, stage 1, bench.** The four prediction cards include "Acetic acid reads 7", which no student will pick (a vinegar-like acid cannot be neutral); swap for "Acetic acid reads lower by one". The dropped card again hides the "My prediction" label.

**q3-weak, stage 1, prompt.** "read side by side" and "pH readings" are vague; say "Which acid will have the higher pH meter reading at the same strength, 0.10 M?"

**q3-weak, stage 1, after Submit.** Banner "Next, three acids at the same concentration are read." The prompt named two acids; say which third acid is coming.

**q3-weak, stage 2, tour.** Opened by itself (2 steps): "FLASK: The spheres are 200 units of the solution. Lay the pH meter on the seat." and "PH METER: Drag it onto a flask to read it." "Seat" again, and "200 units" is a number a student has no use for. Say "Each flask shows 200 acid particles. Put the meter on a flask to read its pH."

**q3-weak, stage 2, prompt.** "You predicted "Acetic acid reads higher". Which acids are nearly all ionized and which only a little?" "Ionized" has never been explained (q1 used "donated a proton"). Use "Which acids gave a proton to nearly every water molecule they met, and which to only a few?" The bin labels "Nearly all ionized" and "Only a little ionized" also need the plain words.

**q3-weak, stage 2, bench.** Three flasks (HCl, acetic acid, hydrofluoric acid) at 0.10 M, one pH meter, two bins. The flask pictures are dense 200-sphere grids that are too small to count; the legend ("H3O+, Cl-" / "H3O+, CH3COO-, CH3COOH" / "H3O+, F-, HF") is 5 px text. A student can sort without the meter by the legend alone or by prior knowledge (I used knowledge; the meter was never needed). Add a count under each window ("ions: 200 of 200") or make the meter required before Submit.

**q3-weak, stage 2, bench.** Cards for the acids sit in a column at the right, each bigger than the bin, and land overlapping the other cards in the bin (the first drop covered the bin heading "Nearly all ionized").

**q3-weak, stage 2, miss message.** Swapped HCl and acetic acid: "In the window of hydrochloric acid, 200 of 200 molecules have donated a proton, and its meter reads 1.00." It tells the HCl meter reading (1.00) without my having used the meter. Good evidence but it replaces the student's own measurement; keep the "200 of 200" and drop the meter reading.

**q3-weak, stage 2, reward.** "Weak and Strong Acids. Acetic acid did read higher, 2.88 against 1.00. At the same concentration every HCl ionized and only a few acetic acid molecules did." Good, but "weak" and "strong" appear only in the title; say "HCl is a strong acid; acetic and hydrofluoric acid are weak acids" in the body. Hydrofluoric acid is not mentioned in the body at all.

**q3-weak, stage 2, hints.** Not opened.

**q3-weak, stage 3, tour.** Opened by itself with one line: "Percent ionization is the share of an acid's molecules that have donated a proton, as a percent." "Share ... as a percent" for a 12-year-old with no maths: add "for example 3 of 200 is 1.5 percent". 

**q3-weak, stage 3, prompt/bench.** "What percent of the acetic acid in this flask is ionized?" with a 200-sphere window where only 3 or 4 are orange (H3O+). A student can count the orange spheres and divide, which gives about 1.5 and is not accepted exactly; the pH meter route (1.3) needs a calculator and the log rule. The two routes disagree and nothing says which to use. Say in the prompt "Use the pH meter" or make the count exactly match 1.3 percent (for example scale the window to 1000 spheres, 13 orange).

**q3-weak, stage 3, bench.** The pH meter laid on the flask covers the legend "CH3COOH" and the bottom of the window (the legend is cut to "CH3C"). Move the legend or the seat.

**q3-weak, stage 3, miss message.** Typed 2.88: "2.88 is the pH this flask reads; the question asks for a percent of the acid put in." Clear. Good.

**q3-weak, stage 3, reward.** "Percent Ionization. A pH of 2.88 means 1.3 x 10^-3 mol/L of H3O+ from 0.10 M of acid put in, so 1.3 percent is ionized. That share is the percent ionization." Fine, but "put in" is awkward (say "dissolved").

**q3-weak, stage 3, hints.** Not opened.

**q3-weak, stage 4, prompt.** "Which ratio of concentrations is the same for all three acetic acid flasks?" No tour opened. I built H3O+ times CH3COO- over CH3COOH on the first try because I already knew Ka; I did not try a wrong layout, so there is no miss note. A student who has not seen q1 stage 6 (the same board) has to guess the layout; "ratio" appears here but the board teaches multiply on top, divide below only through the q1 tour.

**q3-weak, stage 4, bench.** Same expression-board problems as q1 stage 6: dropped cards land over the column numbers (the CH3COOH card sat on the first "1.80 x 10^-5" and hid it), cards are bigger than the slots, and the three flask windows are small and identical-looking. The flasks do not show "0.10 M, 0.010 M, 0.0010 M" ions differently enough to see that a smaller share ionizes when more dilute; show the ionized count under each window.

**q3-weak, stage 4, reward.** "The Acid Constant. H3O+ times CH3COO- over CH3COOH read 1.8 x 10^-5 in all three flasks, although the share that ionized changed. That steady number is the acid's constant, Ka." Good. First time "Ka" appears, and the percent that ionized in the three flasks is never printed, so "the share that ionized changed" is not visible. Print the percent under each flask when the board is solved.

**q3-weak, stage 4, hints.** Not opened.

**q3-weak, stage 5, tour.** Opened by itself with a full worked method for 0.10 M acetic acid ("Let x = [H3O+] = [CH3COO-]. 1. x^2 / 0.10 = 1.8 x 10^-5 (x is small beside 0.10) 2. x = sqrt(1.8 x 10^-6) = 1.3 x 10^-3 mol/L 3. pH = -log(1.3 x 10^-3) = 2.88"). It is the same calculation as the stage with one number changed, so the tour does the stage. It also introduces "x is small beside 0.10" (an approximation) and "sqrt" without a word of why. Show the idea (the ions are equal, so multiply Ka by the concentration and take the square root) and leave the numbers to the student.

**q3-weak, stage 5, prompt/bench.** "What is the pH of 0.15 M acetic acid, to two decimal places?" The bench is a flask and a Ka card ("Acetic acid Ka 1.8 x 10^-5"); there is no pH meter, so this is pure arithmetic with no picture doing any work. Add a meter that is locked until Submit, or a window that shows the ion count after the answer.

**q3-weak, stage 5, miss message.** Typed 2.88 (the tour's answer): "That is the pH of the 0.10 M flask; this flask holds 0.15 M." Clear and kind. Keep.

**q3-weak, stage 5, reward.** "A New Concentration. The constant held at a concentration no flask showed: with the two ions equal, Ka gives 1.6 x 10^-3 mol/L of H3O+ and a pH of 2.79 for 0.15 M acetic acid." I typed 2.78 and it was accepted, but the reward says 2.79 (and the true value is 2.78 or 2.79 depending on rounding). Make the reward say the value the student typed, or accept only the one number it prints.

**q3-weak, stage 5, hints.** Not opened.

**q3-weak, stage 6, prompt/bench.** "What happens to the share of acetic acid that is ionized as it is diluted?" No tour opened. The bench shows a flask with a Dilute key and the pH meter; the meter's number (3.90 at 0.0010 M) goes UP as acid is diluted, which looks like "less acid ionized" to a beginner (pH up = less acidic). Nothing on the bench shows the share, so the stage cannot be solved from evidence on screen: the percent is only printed in the reward. Print "percent ionized" next to the meter (as in stage 3) so the student sees 1.3, 4.2, 12.5.

**q3-weak, stage 6, bench.** The Dilute key is a tiny button under the flask corner and the meter's seat sits on top of it again. Same fix as q2-scale stage 6.

**q3-weak, stage 6, miss message.** I answered "A smaller share is ionized" without diluting: "Dilute the acid at least twice first." Good rule, but it should be shown before Submit can be pressed, or say "Dilute twice and compare the flask windows."

**q3-weak, stage 6, bench.** Wrong card I put in "My answer" overlapped the slot label and, when I dragged it out, the replacement card also landed half outside the slot. Same card-size problem as everywhere.

**q3-weak, stage 6, reward.** "Dilution. The more dilute the acetic acid, the larger the share that has ionized: 1.3 percent at 0.10 M, 4.2 percent at 0.010 M and 12.5 percent at 0.0010 M, even though the pH rises." Good. "Even though the pH rises" is the key surprise and deserves its own line.

**q3-weak, stage 6, hints.** Not opened.

**q3-weak, stage 7, whole stage.** "Which ratio is the same for all three ammonia flasks?" is stage 4 again with ammonia: same board, same three drops, same 1.8 x 10^-5 on the bench (ammonia's Kb really is 1.8 x 10^-5, the same number as acetic acid's Ka, which makes it look like the stage did not change). No tour opened, I solved it by repeating the stage 4 layout in three drags. Merge it into stage 4 (add a second row of flasks) or replace it with a different idea (for example: which of ammonia and acetic acid is the stronger base or acid by Ka). Remove it as a separate stage if nothing else is added.

**q3-weak, stage 7, bench.** Same dropped-card overlap on the board as stage 4 and q1 stage 6; the bench is dark and the OH-, NH4+ and NH3 cards are large against the slots.

**q3-weak, stage 7, reward.** "The Base Constant. The same steady ratio holds for a base: NH4+ times OH- over NH3 read 1.8 x 10^-5 in all three flasks. That number is the base's constant, Kb." Fine; it repeats stage 4's reward almost word for word.

**q3-weak, stage 8, prompt.** "Which combination of Ka and Kb is the same for every acid and its conjugate base?" "Conjugate base" was introduced in q1 stage 4 only; fine if q1 was played, but this prompt does not say what the pairs are. Name them on the bench ("Acetic acid and acetate", "Ammonium and ammonia", "Hydrofluoric acid and fluoride"); the column titles "Acetic acid pair / Ammonia pair / Hydrofluoric acid pair" do not say which species each Ka and Kb belong to, and the ammonia pair lists Ka 5.6 x 10^-10 and Kb 1.8 x 10^-5 with no word that the Ka is for ammonium.

**q3-weak, stage 8, bench.** Third expression-board stage in this quest (stages 4, 7, 8) and the same gesture; the Kb card dropped over the first column's header ("Acetic acid pair") and still counted as placed in a top slot, so the slot positions are not obvious. Make the cards snap into slots.

**q3-weak, stage 8, reward.** "Ka Times Kb. Ka times Kb read 1.0 x 10^-14 for acetic acid, for ammonia and for hydrofluoric acid with their bases. For any acid and its conjugate base, Ka x Kb = Kw." Good. It is the first time Kw returns since q1 stage 6; say "the same 10^-14 you met for water".

**q3-weak, stage 8, hints, miss.** Solved first try, no wrong answer tested, hints not opened.

**q3-weak, debrief, slides 1 to 4.** Slide 1 "At the same concentration, 0.10 M, hydrochloric acid donated every proton while acetic acid donated only a few: pH 1.00 against 2.88." Slide 2 "Diluting acetic acid causes a larger fraction of it to ionize: 3 of 200 units at 0.10 M, 8 at 0.010 M and 25 at 0.0010 M." Slide 3 "H3O+ times CH3COO- divided by CH3COOH equals the same constant Ka in every flask, regardless of concentration." Slide 4 "For any acid and its partner base, Ka times Kb equals 1.0 x 10^-14, so a larger Ka always means a smaller Kb." Slide 2's numbers (3, 8, 25 of 200) are the counts the bench never showed (the bench stage 6 only gave pH), so the first time the student sees them is here; put them on the bench. Slides 3 and 4 are formulas read aloud with no picture; slide 4 says "partner base" where the quest says "conjugate base"; use one word.

**q3-weak, debrief, Case Pin.** "The harsh tank holds a strong acid that splits completely; the weak acid barely splits." Answers the opening question (two tanks, one eats steel). "Splits" is a new word for "ionizes"; use "gives away its protons". 

**q3-weak, in general.** (1) Five of the eight stages (4, 7, 8, and the card sorts) rely on the same expression board; stages 4 and 7 are the same stage. (2) Tours opened on stages 1, 2, 3, 5 only, and the stage 5 tour is a worked answer. (3) Two typed stages (3 and 5) accept numbers that differ from what the reward prints (stage 5: typed 2.78, reward says 2.79). (4) The meter, Dilute key and seats overlap on stages 2, 3 and 6. (5) Hints not opened on any stage; opening scene not seen.

**q4-structure, question card.** The orange line above the prompt reads "See how a molecule's structure makes an acid strong or weak." That is an instruction, not a question, and the Start card did not show a question I could read (the card closed with my Start click before I read the text; the line shown on the bench is this one). Replace it with a question the story asks, for example "Why does one tank's acid eat steel faster than another's?" and keep it in the same wording as the other quests' cards.

**q4-structure, stage 1 (predict), prompt.** "Which of HF, HCl and HBr is the weakest acid and which the strongest?" A student has never been told what these formulas are or that acids differ in strength by the atom bonded to hydrogen; q3 only showed acetic acid and HF as "weak". It is a pure guess with an empty bench (three cards on a bare line). Say what the three are ("three hydrogen halides: hydrogen fluoride, hydrogen chloride, hydrogen bromide") and show them as molecules.

**q4-structure, stage 1, tour.** One step opened only after I pressed TOUR: "ACID CARDS: Drag it into a place in the race." The word "race" is unexplained (it is a strength ranking); say "Drag each acid onto the line from weakest to strongest."

**q4-structure, stage 1, bench.** Dropped cards sit on top of each other and over the end labels (the HCl card hid "Weakest acid", HF covered half of HBr). There are no slots on the line, so a student cannot tell where "middle" is. Add three marked places.

**q4-structure, stage 1, after Submit.** A deliberately wrong ranking (HBr weakest, HF strongest) was accepted with "Your ranking is locked in. Next, the three acids are raced against each other to test it." Predictions are not graded, which is right, but the banner does not say which ranking I made; show the ranking back (the stage 2 prompt does this for other predicts).

**q4-structure, stage 2, tour.** Opened by itself: "PROTON RACE: Put an acid and a base in the places, then press Race." The student has no idea which "base" to use; the only cards are the three acids. The place is labelled "Base it leaves", and the way in is to drop another acid card (HCl) there to stand for the base that acid leaves (Cl-). Say so on the bench: "Drop an acid here. Its leftover base (Cl-, F-, Br-) takes the proton".

**q4-structure, stage 2, prompt.** "You predicted "HF strongest". Which of the three acids is weakest and which strongest?" Same ranking as stage 1 but now the bench is a different machine (the Proton race) plus the ranking rail at the top. A student does not know the answer is made by racing every pair and ranking them. Add one line: "Race the acids in pairs, then put them in order."

**q4-structure, stage 2, bench.** The race area is tiny and dark: "Races run" shows rows like "HF + Cl-  0", "HCl + F-  100", "HBr + Cl-  96" at about 6 px, and the label under it ("Protons on the base, of 100") cannot be read. The two particle windows are cut off by the bench's front edge (their captions are half hidden). Enlarge the result rows and move the windows up.

**q4-structure, stage 2, bench.** To race an acid I have to drag cards between the ranking rail at the top and the two places; dragging a card out of a place sends it back to the rail where it lands on top of another card. The cards on the rail overlap (HCl and HBr were stacked at the end). There is also a banner "Put a card in each place first." that hides the rail cards under it and blocks the drag.

**q4-structure, stage 2, bench.** The cards print "bond 92 pm" / "565 kJ/mol" style structure facts in 4 px text. They are never explained (what is pm, what is kJ/mol) and are never part of the stage's reasoning here. Remove them from this stage or explain bond length and bond energy first.

**q4-structure, stage 2, reward.** "Down the Group. You put HF strongest; it came last. HF is the weakest." "Down the Group" is jargon (the periodic table group, not taught here); "it came last" is vague. Say "HBr gave up protons most easily (96 of 100), then HCl, then HF (0 of 100). The bigger the halogen, the stronger the acid." The banner above (not the reward) said "HBr gave up protons most readily, then HCl, then HF."

**q4-structure, stage 2, hints and miss message.** Not tested; solved on the first ranking after running three races (HF with Cl-, HCl with F-, HBr with Cl-). I did not press Race with every pair needed; the stage accepted the ranking after three races. Hints not opened.

**q4-structure, stage 3, prompt/bench.** "Which of CH4, NH3, H2O and HF is the weakest acid and which the strongest?" Four cards on the rail, each printing "on nitrogen, electroneg. 3.04" and similar in 4 px text, and the same two race places. No tour opened. I ranked them correctly without running a race; the electronegativity numbers on the cards are the evidence, but "electronegativity" has never been defined on this bench (it was taught in Ligar). Say "Bigger electronegativity means the atom pulls on shared electrons harder" in the prompt or on the card.

**q4-structure, stage 3, miss message.** With the cards in the given order I pressed Submit and got "HF sits left of CH4. No race has put the two against each other yet." It names two cards but not why HF should be to the right, and it demands a race even though the cards' numbers answer the question. Say "Ranked wrongly. Race HF against CH4's base to see which gives its proton away."

**q4-structure, stage 3, bench.** The pinned miss banner covers the whole ranking rail (the rail's cards sit under it with only their lower edges showing) and stays until the next action; my first two drags hit the banner and did nothing. Move the banner off the rail or dismiss it on the next click. A card dropped past the rail's right end (HF at about x 650) stayed off the rail and the stage said "Put all 4 cards on the rail." with no sign of which card was off.

**q4-structure, stage 3, reward.** "Across a Period. From CH4 to HF the atom holding the hydrogen is more electronegative each time, and the acid is stronger each time. A more electronegative atom holds the charge of the conjugate base better." The title "Across a Period" is table jargon, and "holds the charge better" is vague. Say "The atom that pulls harder on electrons makes the stronger acid."

**q4-structure, stage 3, hints.** Not opened.

**q4-structure, stage 4, prompt/bench.** "Which of the four chlorine acids is weakest and which strongest?" The four cards (HClO, HClO2, HClO3, HClO4) print "H-O-Cl" and "0, 1, 2, 3 extra O" in text so small that the formulas could not be read in a screenshot of the bench or even a zoom; I only knew which card was which from the source. A student cannot rank what they cannot read. Make the card formula at least as big as the card title in stage 1, and print "extra oxygen: 2" as a line.

**q4-structure, stage 4, bench.** The two cards I moved ended up stacked on top of each other in the middle of the rail (HClO2 over HClO3), with the order impossible to read; the stage still accepted the order. Space the rail's cards evenly after every drop and show a numbered slot under each.

**q4-structure, stage 4, tour.** None opened and the stage did not need one, but the new word "chlorine acids" is not explained: it means acids with chlorine and different amounts of oxygen. Say "four acids of chlorine with 1, 2, 3 or 4 oxygen atoms".

**q4-structure, stage 4, reward.** "The Inductive Effect. Every extra oxygen on the chlorine pulls charge toward itself through the bonds, so the conjugate base holds its charge better and the acid is stronger. That pull is the inductive effect." Correct, but the word "pulls charge toward itself" repeats stage 3's phrase "holds the charge better" without a picture; show the pull with arrows on a model of the acid, in 3D or flat. Races were not needed for this stage either (again no race was run).

**q4-structure, stage 4, hints, miss.** Not tested (right on the second layout, which I could not see clearly).

**q4-structure, stage 5, prompt/bench.** "Which of ethanol, acetic acid and formic acid is the weakest acid and which the strongest?" No tour. The cards print "CH3CH2OH", "CH3COOH", "HCOOH" with a one-line structure and a charge line in text too small to read. I ranked by prior knowledge. The "resonance" idea needs a picture of the base's charge shared over two oxygens (3D at 3D On, like Ligar's resonance quest), but the bench shows only card text. Show the leftover base of each acid (ethoxide, acetate, formate) with its charge drawn, so a student can see "one oxygen holds it" against "two oxygens share it".

**q4-structure, stage 5, bench.** Formic acid against acetic acid is not decided by anything on the bench (the card text I could read does not separate them), so ranking those two is a guess or a recall. Add a race result or drop the strict order and ask only "which is by far the weakest?".

**q4-structure, stage 5, reward.** "Resonance. When acetic acid or formic acid donates its proton, the charge of the conjugate base is shared over two oxygens by resonance. Ethoxide keeps it on one oxygen, so ethanol is by far the weakest." Banner above: "Both carboxylic acids beat ethanol." "Carboxylic" and "ethoxide" appear for the first time here. Do not use words the bench never showed; and the reward never says why formic beats acetic.

**q4-structure, stage 5, hints, miss.** Not tested.

**q4-structure, stage 6, prompt.** "Which base accepts the fewest protons from acetic acid and which the most?" Acetic acid is already in the Acid place and the four base cards (OH-, Cl-, ClO-, F-) are on the rail labelled "left by H2O", "left by HCl" and so on. Good idea. The prompt asks for fewest and most only, but the rail wants all four in order.

**q4-structure, stage 6, miss message.** Submitting the cards in their starting order gave "Cl- sits left of ClO-. No race has been run for Cl- yet." After I ran four races (0, 14, 96, 100 of 100) the stage still would not accept my drag of OH- to the right end ("Put all 4 cards on the rail."), and after Restart the ranking alone (no races at all) was accepted. So races are demanded in a miss message but not needed for a right answer; either require them or stop asking for them. The message "No race has been run for Cl- yet." is also hard to follow ("run for" what?). Say "Race acetic acid against Cl- first."

**q4-structure, stage 6, bench.** After a drag the rail's cards slide for about a second, and during that time the cards overlap in pairs or one disappears (I thought I had lost the OH- card and used Undo and Restart to find it). A drop past the end of the rail, or on top of the pinned miss banner, leaves a card where it cannot be seen. Make the rail show where a card will land (a gap) and keep the miss banner off the rail.

**q4-structure, stage 6, bench.** The race log lines ("CH3COOH + Cl-  0", "... + F-  14", "... + ClO-  96", "... + OH-  100") are at 6 px and the right-hand number column is hard to tie to its row. Enlarge.

**q4-structure, stage 6, reward.** "Strong Acid, Weak Base. Cl-, left by the strongest acid, took 0 of 100 protons from acetic acid, and OH-, left by the weakest, took 100. The stronger an acid, the weaker its conjugate base." Good, the numbers come from what the student saw. Banner: "The stronger the acid, the weaker the base it leaves."

**q4-structure, stage 6, hints.** Not opened.

**q4-structure, stage 7 (sealed), tour.** Opened by itself with the rules, not the question: "Resonance across two oxygens stabilizes a conjugate base strongly, and an electronegative chlorine atom pulls charge away to stabilize it further. Without resonance or chlorine, an OH group holds its proton tightest." That is the whole answer key for the stage in four lines (A has resonance, D and E have chlorine, B has none). Cut the tour to "Rank by what you learned in the last six stages" and let the student apply it.

**q4-structure, stage 7, prompt.** "Order these five acids from weakest to strongest." The cards are lettered A to E with their formulas printed at about 5 px ("H-NH2 electroneg. 3.04", "CH3C(=O)-OH", "H-O-Cl 2 extra O", "H-O-Cl 0 extra O", "H-Br bond 141 pm"). I misread card E's "0 extra O" as "3 extra O" and my first two submissions were wrong because of it. Print the numbers large (14 px or more) and put "extra O: 0" on its own line.

**q4-structure, stage 7, miss message.** "C sits left of E. Look again at the structure and charge drawing on each card." then "D sits left of E. Look again at ...". The message names one pair and repeats the same advice; it never says whether to move C left or right. Say "C (HBr) is stronger than E (HClO): move it to the right of E".

**q4-structure, stage 7, bench.** The five cards mix three families (a halide, oxyacids of chlorine, an amine, a carboxylic acid), so comparing HBr with HClO3 needs a fact no stage taught (halogen size against extra oxygens); the answer HBr strongest is a recall. Either give a race for the close pair or compare within one family only.

**q4-structure, stage 7, reward.** "What Sets Strength. An acid is strong when its conjugate base holds the charge well: by a larger atom, a more electronegative atom, electron-pulling neighbours or resonance. Each factor you raced works through the conjugate base." Good summary but "electron-pulling neighbours" is new and "Each factor you raced" is false for stages 3, 4, 5 (none was raced); say "Each factor you ranked".

**q4-structure, stage 7, hints.** Not opened.

**q4-structure, debrief (4 slides).** Slide 1 "Raced against chloride, HF kept all 100 protons, while HCl gave all 100 to fluoride. Fluorine pulls hardest on electrons, yet HF is the weaker acid." Slide 2 "HBr gave 96 of 100 protons to chloride, and HCl gave only 4 to bromide. Down a group the bond is longer and the acid stronger." Slide 3 "Each extra oxygen on chlorine pulls charge toward itself, the inductive effect, so the leftover base holds its charge better and the acid is stronger." Slide 4 "Resonance spreads the charge of acetate over two oxygens. Acetic acid gave up its protons to ethoxide; ..." Slide 1 contradicts stage 3's reward ("more electronegative atom, stronger acid") without saying when each rule applies (across a row against down a group); add one sentence. Slide 2's "HCl gave only 4 to bromide" is a race the student never ran (I ran HBr with Cl- only). The debrief has no Case Pin or closing line, and the quest never asked a story question, so it does not close any mystery.

**q4-structure, in general.** (1) Every stage is the same gesture: drag cards into order along a rail; stages 3 to 5 do not use the race at all and can be done from card text (which is too small to read). Replace one or two with a different action. (2) The pinned miss banner covers the rail, and a card moved during the 1 second slide animation looks lost; fix the banner position and show the landing gap. (3) Card text and the race log are 4 to 6 px everywhere. (4) Tours opened by themselves on stage 2 and stage 7 (stage 7's tour gives the answer). (5) Hints were not opened; the question card and the opening scene were not seen properly (the card closed on Start before I could read it).

**q5-salts, question card.** "The worst waste tank has been neutralized. Is its water safe now?" Good: follows from the story and from q1's acid waste. The bench prompt "What is the pH when sodium hydroxide has exactly used up the hydrochloric acid?" answers it.

**q5-salts, stage 1, tour.** A one-step tour opened by itself on Start: "MIXING FLASK: Pour adds base from the jug. Green units are used up." It does not say the Pour key is the small key at the bottom right of the flask, nor how much each press adds (10 mL), nor that the pH meter goes on the seat. Say "Press Pour to add 10 mL of base. Lay the pH meter on the flask to read it."

**q5-salts, stage 1, prompt/bench.** There is no answer control: the stage is solved by pouring 50 mL and pressing Submit, with the meter reading 7.00 on the bench. A student reads "What is the pH ..." and looks for a box to type in. Add an answer (a number box) or reword the prompt as an instruction: "Pour until the acid is all used up, then read the pH meter."

**q5-salts, stage 1, bench.** The pH meter's home is at the far right and the seat is at the bottom left of the flask, behind the "acid used up" legend; the meter, once on the seat, covers that legend and the end of the "Poured" line. The Pour key is about 20 px wide. Make the key bigger and move the legend.

**q5-salts, stage 1, bench.** A student who presses Submit at 0 mL or 30 mL was not tested; if Submit then judges the current state, say what is wrong ("acid is left over").

**q5-salts, stage 1, reward.** "Strong Acid, Strong Base. 7.00. Na+ and Cl- do not react with water." Short and right. Add "so the water is safe" to answer the story's question.

**q5-salts, stage 1, hints.** Not opened.

**q5-salts, stage 2 (predict), prompt/bench.** "What will the pH be when acetic acid and sodium hydroxide are mixed in equal amounts, with none of either left over?" No tour. The bench is only four cards ("Exactly 7", "Above 7", "Below 7", "14") and the My prediction slot; there is no flask, no acid, no base, so nothing on screen relates to the question. Show the acetic acid flask and the jug as in stage 1. "14" is not a sensible choice for a mixture of an acid and a base; replace it with "About 4".

**q5-salts, stage 2, bench.** The dropped "Above 7" card sits half over the "My prediction" slot and its label, same as every card stage.

**q5-salts, stage 2, after Submit.** "Your prediction is locked in. Next, sodium hydroxide is poured into acetic acid until none of the acid is left." Fine.

**q5-salts, stage 3, prompt/bench.** "You predicted "Above 7". What is the pH when sodium hydroxide has exactly used up the acetic acid?" Same bench as stage 1 with acetic acid (0.10 M, 50 mL) and the jug; no tour; no number box again. The Submit key with nothing poured says only "Pour first." Good. It is the same task as stage 1 with a different acid; fine for a comparison, but the student is never asked to compare the two readings (7.00 against 8.72).

**q5-salts, stage 3, bench.** The meter had to be dragged to the seat again and Pour pressed five times; a "Pour all" key or a dial for the volume would save the repetition. The pH meter still covers the "acid used up" legend.

**q5-salts, stage 3, reward.** Banner "The flask read 8.72 with the acid used up." then "Salt Hydrolysis. You predicted above 7, and the meter read 8.72. Acetate takes protons from water, leaving OH-." "Salt hydrolysis" appears only as a title and is not defined; it also never says why Na+ does nothing. Say "Acetate is a weak base: it takes protons from water, so the water turns basic." Do not name the idea before the student has met it.

**q5-salts, stage 3, hints.** Not opened.

**q5-salts, stage 4, whole stage.** "What is the pH when hydrochloric acid has exactly used up the ammonia?" It is stages 1 and 3 a third time: the same flask, the same jug, meter to the seat, five presses of Pour, Submit; only the liquids changed (ammonia 0.10 M, 50 mL against 0.10 M HCl). No tour, no prediction, no wrong answer possible except submitting early. Merge stages 1, 3 and 4 into one bench with a choice of flask (HCl, acetic acid, ammonia) and a table of readings the student fills in, or turn stage 4 into a predict stage.

**q5-salts, stage 4, bench.** The legend now reads "base left / base used up" while the stage 1 and 3 legend read "acid left / acid used up"; correct but nothing on the bench marks the change. The meter again covers the legend.

**q5-salts, stage 4, reward.** Banner "The flask read 5.28 with the base used up." then "Acidic Salt. Ammonium, the acid left behind by ammonia, gives protons to water, so the flask read 5.28 and is acidic. Equal amounts of an acid and a base can leave a flask that is not neutral." Good content. "Acid left behind by ammonia" is awkward (ammonia is a base; ammonium is its conjugate acid); say "Ammonium, made when ammonia takes a proton, gives a proton back to water".

**q5-salts, stage 5, prompt/bench.** "Which salt solutions are acidic, which neutral and which basic?" No tour. Four flasks (sodium chloride, sodium fluoride, ammonium chloride, potassium nitrate, each 0.10 M), a "Strong parents: HCl, HNO3 . NaOH, KOH" note, four name cards and three bins. The "Strong parents" note is a clear tool, but it is a bare list of formulas and never says "a salt takes after its stronger parent". The pH meter sits on top of the "Flask to read its pH." line and the first name card at the far right; the card "Sodium chloride" overlaps it.

**q5-salts, stage 5, bench.** The cards, once dropped, are wider than the bins (names like "Potassium nitrate" run past the bin edge) and land on top of one another: two cards in one bin overlapped so that one name was unreadable, and when I moved a card the others slid into new places so the card I aimed at was a different one (I moved ammonium chloride when I meant sodium fluoride). Make the bins big enough for all four cards in a column, fix card width, and let cards snap into a stack.

**q5-salts, stage 5, miss message.** NaF in "Acidic": "The meter on sodium fluoride reads 8.09." It gives the reading the student did not take; I never used the meter. The message is useful but tells the student to use the meter by showing what it would say. Say "Put the meter on the sodium fluoride flask."

**q5-salts, stage 5, bench.** The miss banner stayed pinned after the next drags and I read the same message twice after changing the layout; it should clear when the cards are moved.

**q5-salts, stage 5, reward.** "Which Ions React. Sodium chloride and potassium nitrate read 7.00; sodium fluoride read 8.09 and ammonium chloride 5.13. An ion from a strong acid or a strong base does nothing to the pH; an ion from a weak one reacts with water." Good rule. Ammonium chloride reads 5.13 here but 5.28 in stage 4 (different amount); one line saying "5.13 here because the solution is more dilute" would stop a student wondering.

**q5-salts, stage 5, hints.** Not opened.

**q5-salts, stage 6, prompt.** "What is the pH of the flask after the pour?" The bench opens with 30.0 mL of 0.10 M HCl and "Poured 20 mL" already shown, so "the pour" has already happened and the student never poured. Say "20 mL of sodium hydroxide has been added to 30 mL of acid. What is the pH now?". No tour opened; the PRIMER key is new here.

**q5-salts, stage 6, bench.** The flask picture is large and clear (33 of 100 acid units left, shown by colour: green used up, grey left). Good. There is no meter, so the stage is arithmetic only, and a Pour key is drawn but does nothing useful (the amount is fixed). Remove the Pour key or let the student choose the volume.

**q5-salts, stage 6, miss message.** Typed 1.00: "The window shows 33 of 100 acid units left; a pH of 1.00 is what 0.10 M acid alone reads." Good, it tells how to reason without the answer.

**q5-salts, stage 6, reward.** "Excess Decides. 33 of 100 units of acid were left. Those left-over moles, spread through 50.0 mL, set the pH at 1.70: when one reagent is in excess, it decides the pH." "Reagent" and "moles" are new; plain: "The acid that is left over decides the pH: 1 part in 3 of the acid is left, in 50 mL of liquid."

**q5-salts, stage 6, hints.** Not opened.

**q5-salts, stage 7, prompt/bench.** "What is the pH of 0.10 M sodium acetate, to two decimal places?" The bench shows the sodium acetate flask (0.10 M) and a card "Acetic acid Ka 1.8 x 10^-5". No tour. The step the student must take (use Ka x Kb = Kw from q3 stage 8 to get acetate's Kb, then solve for OH-, pOH, pH) is three ideas in one stage and the bench shows none of them; the answer needs a calculator and no Calc key is pointed to. Split into two stages (find Kb of acetate; then the pH) or put Kb on the card.

**q5-salts, stage 7, miss message.** Typed 5.13 (the pOH): "5.13 is the pOH of this flask; the question asks for its pH." Clear, but it shows the pOH is the intermediate result; it gives the student the intermediate number.

**q5-salts, stage 7, reward.** "pH of a Salt. Acetate makes hydroxide equal to the acetic acid it forms, 7.5 x 10^-6 mol/L here, so the pOH is 5.13 and the pH 8.87." Good. It repeats the miss message's 5.13.

**q5-salts, stage 7, hints.** Not opened.

**q5-salts, debrief (3 slides and the Case Pin).** Slide 1 "Acid and base used up exactly read 7.00 only when both were strong. Acetic acid with sodium hydroxide read 8.72, and ammonia with hydrochloric acid read 5.28." Slide 2 "Sodium chloride read 7.00, sodium fluoride 8.09 and ammonium chloride 5.13. The ion of a weak parent reacts with water; the ions of strong parents do not." Slide 3 "When one reagent is left over, it decides the pH. After 20.0 mL of base met 30.0 mL of acid, 33 of 100 acid units were left and the flask read 1.70." Short, one idea each, numbers from the bench. "Parent" and "reagent" are never defined on the bench; say "the acid and base the salt came from" and "the one left over". The sodium acetate stage (stage 7) is not in the debrief.

**q5-salts, debrief, Case Pin.** "Not always: neutralizing it can still leave an acidic or basic salt behind." It answers the opening question ("Is its water safe now?"). Good. But the question card talks about a waste tank, and the final line never says whether the tank in the story is safe; say which salt the tank would hold.

**q5-salts, in general.** (1) Stages 1, 3 and 4 are the same bench and gesture three times, and stage 5's cards and bins have the overlap problems seen in q1 and q2. (2) Tours opened by themselves only on stage 1. (3) Three stages (1, 3, 4) give no way to type or pick an answer; the answer is whatever is on the bench when Submit is pressed. (4) Hints were not opened on any stage; no opening scene seen.

**q6-titrate, question card.** "The worst waste tank must be neutralized exactly. How much base does it take?" Follows from q5's Case Pin. Prompt: "What volume of sodium hydroxide exactly uses up the hydrochloric acid?" Good.

**q6-titrate, stage 1, tour.** Two steps opened by themselves on Start: "CURVE 1 / 2: Each pour adds a point: pH against mL." and "BURETTE AND FLASK 2 / 2: Pour adds base. Amber dots are H3O+, blue dots are OH-." The second says what the dot colours are but never says that a "burette" is the tall measuring tube on the left, nor where the Pour key is; the first highlights the graph while the pointer is on the graph's edge. Say "The tube (burette) holds the base. Press Pour to add 5 mL; each press adds a point to the graph."

**q6-titrate, stage 1, bench.** The burette's labels run into each other: "Pour size 5 mL" and "Hydrochloric acid 0.1 M" overlap at the top of the tube, and the tube numbers (0 mL, 25) are 4 px. The Pour key is a 40 px key at the bottom of the left panel, the Mark dial a small knob at the top left of the graph. At 25.0 mL the flask also prints "pH 7.00" in large type, so the answer is on the bench the moment the pour reaches it; the graph's steep rise is not needed.

**q6-titrate, stage 1, bench (Mark dial).** The Mark dial ("Mark at (mL) 22") jumps in half-millilitre steps and does not follow the pointer one-to-one: dragging to the same spot gave 22, 25.5, 25.5, 26 and only a drag to x 469 gave 25. It took five tries to land on 25. Make it snap to whole millilitres or show the number as it moves, and make the knob bigger.

**q6-titrate, stage 1, miss message.** Mark at 22: "The meter reads 2.19 at 22.0 mL." Good: shows the reading at the wrong place. 

**q6-titrate, stage 1, reward.** Banner "The pH rose steeply at 25.0 mL." then "The Titration Curve. A graph of pH against the volume of base poured is a titration curve. Its steep rise, here at 25.0 mL where the pH read 7.00, is the equivalence point: the acid has just been used up." Introduces "titration curve" and "equivalence point" in one box; split.

**q6-titrate, stage 1, hints.** Not opened.

**q6-titrate, stage 2 (predict), prompt.** "What will the pH be at the equivalence point when 0.100 M acetic acid is titrated with 0.100 M sodium hydroxide?" This is q5-salts stage 3 again (acetic acid with sodium hydroxide, read as 8.72 there). A student who played q5 knows the answer; a student who did not has only "equivalence point" from stage 1. Either drop the stage or make it a different test (a weak base with a strong acid).

**q6-titrate, stage 2, bench.** The bench is four cards ("Exactly 7", "Above 7", "Below 7", "About 13") and the My prediction slot; no burette, no acid. "About 13" is a card nobody picks. After Submit: "Prediction locked in. Next, acetic acid is titrated beside hydrochloric acid." No tour opened.

**q6-titrate, stage 3, prompt/bench.** "You predicted "Above 7". Is the pH at acetic acid's equivalence point below, at or above 7?" Two burettes (hydrochloric and acetic acid), two flasks (pH 1.00 and 2.88), a curve and a three-way dial ("Acetic acid at its equivalence point": Below 7 / Exactly 7 / Above 7). Third time this fact is tested (q5 stage 3, q6 stage 2, here) and the answer is on the flask at 25 mL ("pH 8.72"); no new idea. Replace it with a stage that has the student read both curves' shapes (where each starts, where each jumps).

**q6-titrate, stage 3, bench.** No tour opened. One Pour key (a 25 px key at the bottom of the left panel) moves both burettes together, which is not said. The curve's legend ("Hydrochloric", "Acetic") is 4 px. When the dial is moved the chosen word pops up huge ("Exactly 7") to the right of the dial, over the "Above 7" label and stays there; same glitch as q1 stage 7 and q2 stage 8.

**q6-titrate, stage 3, miss message.** Dial on "Exactly 7": "At 25.0 mL the hydrochloric acid display reads 7.00 and the acetic acid display 8.72." Good evidence.

**q6-titrate, stage 3, reward.** "Not Always 7. Above 7, as you predicted: hydrochloric acid read 7.00 at 25.0 mL and acetic acid 8.72. The acetate left when the acid is used up is a weak base, so the equivalence point of a weak acid is above 7." Good; short and uses the bench's numbers.

**q6-titrate, stage 3, hints.** Not opened.

**q6-titrate, stage 4, prompt.** "Half way to the equivalence point, what does the pH equal?" The word pKa appears for the first time on the dial ("The pKa of the acid") and is never defined in Verdigris so far (q3 only gave Ka). Define it on the bench: "pKa = -log Ka. For acetic acid, Ka 1.8 x 10^-5 gives pKa 4.74." Also no tour opened; a PRIMER key opened a description I did not read.

**q6-titrate, stage 4, bench.** The answer dial's three labels ("The pKa of the acid", "The pH at equivalence", "Exactly 7") are drawn on top of each other and unreadable ("The pKa dihe Ka of the acid" in the screenshot), and the knob covers one of them. Space them out and put them in a column.

**q6-titrate, stage 4, bench.** The burettes pour 5 mL at a time but half-equivalence for acetic acid is 12.5 mL, which can never be poured; the curve table at the top right of the graph (tiny numbers) lists 5.0, 10.0, 15.0 mL only. The miss message then quotes "4.75 at 12.5 mL" that the student could not make. Pour size should be 2.5 mL for this stage or the equivalence volumes should be 20 and 30.

**q6-titrate, stage 4, bench.** Same stuck-large "The pH at equivalence" pop-up over the dial after it is moved.

**q6-titrate, stage 4, miss message.** Dial on "The pH at equivalence": "Half way, the acetic acid display reads 4.75 at 12.5 mL and the formic acid display 3.75 at 10.0 mL; at the equivalence volumes they read 8.72 and 8.22." Gives both numbers; the student still has to compare them with the pKa values, which they have never seen. Keep the readings, add the pKa of each acid to the flask label.

**q6-titrate, stage 4, reward.** "The Half-Equivalence Point. Half way, acetic acid read 4.75 and formic acid 3.75, within 0.01 of their pKa values, 4.74 and 3.74. At the half-equivalence point half the acid has become its base, so the pH equals the pKa." The "pKa values" appear here for the first time. Say "pKa is just Ka turned into a pH-style number (-log Ka)".

**q6-titrate, stage 4, hints.** Not opened.

**q6-titrate, stage 5, prompt/bench.** "Which indicator changes colour at the equivalence point of this titration?" The bench shows the acetic acid burette and flask (20.0 mL, 0.15 M), four colour strips (methyl orange, methyl red, bromothymol blue, phenolphthalein) and four name cards. No tour. The word "indicator" has never been explained (a dye that changes colour at a certain pH), the strips' pH ranges are not printed, and "this titration" does not say that the equivalence point of acetic acid with sodium hydroxide is above 7 (the student has to recall stage 3). I solved it by prior knowledge of phenolphthalein; I never poured. Tell the student to pour and watch the strips, and print each indicator's range next to its strip.

**q6-titrate, stage 5, bench.** The strips are named in 5 px text under the strips and the card names are in a column on the right; cards and strips are joined only by the name. Put the cards on the strips.

**q6-titrate, stage 5, miss message.** Methyl orange: "The methyl orange tube changed colour between 0.0 mL and 14.2 mL." Good, but it describes a pour I had not done; the strips on screen had not moved. Make the strips actually change as the student pours, so the message is something they saw.

**q6-titrate, stage 5, reward.** "Indicators. Phenolphthalein changed between 29.99 and 30.10 mL, inside the steep rise; bromothymol blue took 28.4 to 30.0 mL. An indicator must change colour near the equivalence pH." Good. The sentence does not define "indicator" for the first time reader; add it at the start.

**q6-titrate, stage 5, hints.** Not opened.

**q6-titrate, stage 6, prompt/bench.** "How many protons does one molecule of sulfurous acid donate?" with a burette (20.0 mL, 0.050 M), a curve and a three-way dial ("Protons per molecule": One / Two / Three). No tour. After pouring 20 mL in 5 mL steps the curve is a nearly straight line (pH 2.4, 4.6, 7.2, 9.8 at 5, 10, 15, 20 mL), so the two steep rises the stage is about cannot be seen. The reward says the curve "rose steeply at 10.0 mL and again at 20.0 mL" and the miss message quotes pH values at 10, 20 and 30 mL, which I never read (the graph stops at 20 mL poured). Pour 1 mL per press near the rises, or draw the curve for every mL.

**q6-titrate, stage 6, bench.** The dial's chosen word ("Three") pops up huge to the right again after it is moved. The mark labels "One / Two / Three" are tiny.

**q6-titrate, stage 6, miss message.** Dial on Three: "The display reads 4.59 at 10.0 mL, 9.80 at 20.0 mL and 12.30 at 30.0 mL." Numbers the student has not seen, with no hint what to look for. Say "Look for how many times the curve jumps."

**q6-titrate, stage 6, reward.** "Polyprotic Acids. The curve rose steeply at 10.0 mL and again at 20.0 mL: two protons, each needing the same amount of base. Such an acid is polyprotic." Good rule, "polyprotic" is new; the word is fine if the bench had shown the jumps.

**q6-titrate, stage 6, hints.** Not opened.

**q6-titrate, stage 7, prompt/bench.** "What is the concentration of the hydrochloric acid in the flask, in mol/L?" The bench is a single burette (0.1 M base) and a flask "25.00 mL, concentration unknown", with no pH meter, no graph and no indicator named. After pouring 30 mL in 5 mL steps nothing on the bench had changed; I opened the hint ("Use "Pour size" and "Pour", and type the concentration in the field.") and only then found a tiny "Pour size" dial at the top of the burette (5 mL / 1 mL / 0.1 mL) hidden under the label "Hydrochloric acid". After 36 mL the flask's dots had turned from amber to blue. A student is never told that the colour change is the end point (this is a hidden indicator, "bromothymol" in the code), nor that the flask colour is the signal. Say on the bench "The flask contains a dye that changes colour when the acid is used up" and make the Pour size dial a visible dial.

**q6-titrate, stage 7, bench.** The whole stage is on a narrow burette panel in the middle of an empty dark bench. Pour size dial labels ("5 mL", "1 mL", "0.1 mL") overlap the label "Hydrochloric acid". A 0.1 mL pour size would need over 300 presses for this volume; add a "Pour until it changes" key or let the dial be dragged while pouring.

**q6-titrate, stage 7, miss message.** Typed 0.1: "That is the concentration of the base in the burette." Good.

**q6-titrate, stage 7, answering.** I got the exact volume by reading `phdata.js` after my first attempts did not isolate it (the colour changed between 31 and 36 mL and I did not narrow it further with the pour size dial). The stage accepted 0.1256 (the exact value), so I do not know how close the student's value has to be.

**q6-titrate, stage 7, reward.** "From Volume to Concentration. The colour changed at 31.4 mL of 0.100 M base, which is 3.14 mmol. The 25.00 mL of acid held that amount, so its concentration was 0.126 M." Good, clear. "mmol" is new.

**q6-titrate, stage 7, hints.** Hint 1 only: "Use "Pour size" and "Pour", and type the concentration in the field." It names the controls but not what to look for (the colour change).

**q6-titrate, stage 8 (sealed), prompt/bench.** "What is the Ka of the weak acid in the flask?" Burette, flask "25.0 mL, concentration unknown" with a pH meter, a curve and a small table of points (5.0 mL 4.86, 10.0 mL 5.16, 15.0 mL 5.63, 20.0 mL 8.90, 25.0 mL 12.00). No tour. The idea (find the volume of the steep rise, halve it, read the pH there, turn it into Ka) is four steps with no prompts; the table is 5 px text; the number box says "Ka (write 0.0005 as 5e-4)", good. I got 6.9e-6 from the table (10^-5.16), which the stage accepted. The curve with 5 mL steps puts the steep rise somewhere between 15 and 20 mL, and the student has to guess 20 mL is the equivalence point; a 1 mL pour would show it.

**q6-titrate, stage 8, reward.** "Reading Ka. The steep rise was at 20.0 mL, so half way is 10.0 mL, where the pH read 5.16. That is the pKa, so Ka is about 7.0 x 10^-6, for an acid whose concentration was never given." Good. "pKa to Ka" step (Ka = 10^-pKa) is stated without a worked line; add "10^-5.16 = 6.9 x 10^-6".

**q6-titrate, stage 8, miss message and hints.** Not tested; solved on the first typed answer.

**q6-titrate, debrief (4 slides and the Case Pin).** Slide 1 "Poured into 25.0 mL of hydrochloric acid, the base moved the pH slowly, then at 25.0 mL it leapt through 7.00. That steep rise is the equivalence point." Slide 2 "Acetic acid took the same 25.0 mL of base, yet it read 8.72 there while hydrochloric acid read 7.00. The equivalence point depends on the acid." Slide 3 "Half way to each equivalence point the pH matched the acid's pKa: 4.75 for acetic acid and 3.75 for formic acid. That is the half-equivalence point." Slide 4 "Sulfurous acid rose steeply twice, at 10.0 mL and 20.0 mL. A polyprotic acid gives up its protons one step at a time." One idea each, with bench numbers. Slides 3 and 4 give pKa values (4.75) that differ from the reward in stage 4 (4.74), a small mismatch; pick one. Indicators (stage 5) and the two unknown-acid stages (7 and 8) are not in the debrief.

**q6-titrate, debrief, Case Pin.** "The pH curve pinpointed the exact neutralization point for the worst waste tank." The question asked "How much base does it take?" and the pin gives no volume. Say "25 mL of base neutralizes 25 mL of this acid" (or the tank's real figure).

**q6-titrate, in general.** (1) The bench is the same burette-and-curve machine on every stage; it works, but the 5 mL pour step is too coarse for stages 4 (needs 12.5 mL) and 6 (needs the two jumps), and the answer dials pop up an oversize word after each drag. (2) Stages 2 and 3 repeat q5 stage 3. (3) Tours opened by themselves only on stage 1. (4) Stage 7 gives the student no sign what to look for (no meter, no graph, a hidden colour change). (5) Hints were opened only on stage 7; the stages with a small knob or dial (Mark, Pour size, answer dials) all need bigger controls.

**q7-buffer, question card.** "Acid from the marsh keeps splashing into the fort's drinking water. What can we add to keep the water steady?" Good: follows from q1 and q5 and leads to buffers.

**q7-buffer, stage 1 (predict), prompt/bench.** "Which flask's pH moves more when acid is added to water and to acetic acid with sodium acetate?" The sentence is long and hard to parse ("moves" means the pH number changes; "acetic acid with sodium acetate" is not said to be a buffer, rightly, but it is also not shown). The bench is four cards ("The water flask moves more", "The acetic acid and sodium acetate flask moves more", "Both move the same", "Neither flask moves") and the My prediction slot; no flask is drawn. Show the two flasks and say "Add the same drop of acid to both. In which does the pH reading change more?". No tour opened; the dropped card again hides the slot label.

**q7-buffer, stage 2, tour.** A one-step tour opened by itself: "MIXING FLASK: Pour acid or base in. Spheres are the particles." It also played a demonstration behind the box: the water flask showed pH 2.04 "was 7.00" before I had poured anything, then reset to 7.00 once I closed the box. Do not play a result before the student acts, and say where the Pour keys are.

**q7-buffer, stage 2, prompt/bench.** "You predicted "The water flask moves more". Which flask's pH moves more when the same acid is poured into each?" Two flasks (Water 100 mL, Acetic acid with sodium acetate 100 mL), each with its own small Pour key, and a three-way answer dial. The student has to press Pour in each flask separately; one press in only the buffer flask gives a half-test. Say "Pour acid into both flasks".

**q7-buffer, stage 2, bench.** The answer dial's three labels ("The water flask", "The acetic acid and sodium acetate flask", "Both the same") are drawn on top of each other and the middle one is unreadable, and after a drag the chosen words pop up huge again over the dial. Same as q2 stage 8, q6 stages 3, 4 and 6.

**q7-buffer, stage 2, miss message.** Dial on "Both the same": "After one pour the water reads 7.00 then 2.04, and the other flask reads 4.74 then 4.66." It says the answer in numbers, which is fine as evidence, but the student had not yet poured into the water flask in the first place; the banner shows the water numbers from a pour the student did not do.

**q7-buffer, stage 2, reward.** Banner "The water flask moved far more than the acetic acid and sodium acetate flask." then "A Buffer. The water did move more, as you predicted. One pour of acid moved the water from 7.00 to 2.04 and the other flask from 4.74 to 4.66." Good and short. "A Buffer" appears as a title with no definition of what makes it a buffer (a weak acid with its salt); say that.

**q7-buffer, stage 2, hints.** Not opened.

**q7-buffer, stage 3, prompt/bench.** "What must a flask contain to hold its pH against both added acid and added base?" The bench is one flask with three stacked dials ("Pour in: Acid / Base", "Acetic acid 0 to 100", "Acetate 0 to 100") and one Pour key, no tour. The three dials sit 7 px apart with their labels and numbers ("0 25 50 100") drawn over each other and over the knobs, so grabbing the middle one (acetic acid) failed four times (my drags moved the acetate knob, then the Pour-in knob, instead). It took five tries to set acetic acid and acetate to 50 each. This is a blocker for a beginner. Give each dial its own row of at least 30 px with the label on the left and the number on the right.

**q7-buffer, stage 3, bench.** The stage has no answer control: it passed after one pour of base with 50 and 50, without the student pouring acid or testing a flask with only one member. A student can never learn "both members needed" without trying acid-only and acetate-only flasks; the reward says "only when it held acetic acid and acetate together" but the bench never made the student compare. Make the stage ask for three flasks (acid only, acetate only, both) and pour both ways in each.

**q7-buffer, stage 3, reward.** Banner "Only a flask holding both acetic acid and acetate held its pH against acid and against base." then "Both Members. A flask held its pH against both pours only when it held acetic acid and acetate together, in large amounts. Acetate is the conjugate base of acetic acid: the acid takes added base, and the conjugate base takes added acid." Good wording for the last sentence, but it claims the student saw "only when" which they did not.

**q7-buffer, stage 3, hints, miss.** Not tested.

**q7-buffer, stage 4, prompt/bench.** "Which particle in the buffer accepts the protons of the added acid?" The buffer flask (100 acetate, 100 acetic acid, pH 4.74), a Pour key and a proton bench with H3O+, CH3COOH and CH3COO-, three trays. No tour. It is the proton-bench gesture from q1 (stages 1 and 3) again, which is a good callback; the stage is clear apart from the layout below.

**q7-buffer, stage 4, bench.** After a first move the proton sat on the CH3COOH tray; my second drag started at the proton's old stock position (it had gone) and so did nothing, and the old miss banner stayed on screen, so it looked as if the new answer had been rejected too. Clear the banner when the student moves a piece, and keep the stock piece where the student left it, or show the empty stock spot.

**q7-buffer, stage 4, miss message.** Proton on CH3COOH: "After one pour the window holds 90 acetate spheres and 110 acetic acid spheres, from 100 and 100; the proton you carried comes straight back." Good: shows the real change; but it gives the answer (acetate fell). 

**q7-buffer, stage 4, reward.** "Acid Taken Up. Each of the 10 spheres of acid poured in was caught by an acetate: acetate fell from 100 to 90 spheres and acetic acid rose from 100 to 110. The conjugate base takes up added acid, so the pH barely moves." Good, numbers from the bench.

**q7-buffer, stage 4, hints.** Not opened.

**q7-buffer, stage 5, prompt/bench.** "Find the pH of the flask with no meter, to two decimal places." Three flasks (100 acetic acid with 100 acetate: pH 4.74; 10 acetic acid with 100 acetate: pH 5.74; a third with no meter) and a plate "Acetic acid pKa 4.74"; a PRIMER key. No tour. I answered 5.22 from my own knowledge of the Henderson-Hasselbalch equation; the first wrong try (4.74) showed the sphere counts in the miss message ("this flask holds 150 acetate spheres and 50 of acetic acid"), which I could not count on screen (the third flask's spheres are too dense). Print the counts on each flask label.

**q7-buffer, stage 5, bench.** The two reference flasks give 4.74 and 5.74, which show "one pH unit per tenfold ratio", but the unmetered flask has a 3 to 1 ratio, which needs the logarithm of 3 (0.48). A student with only the references can estimate 5.2 at best and the stage wants two decimal places. Say "to one decimal place" or give a third reference (30 to 10).

**q7-buffer, stage 5, miss message.** Typed 4.74: "4.74 is what the 100 and 100 flask reads; this flask holds 150 acetate spheres and 50 of acetic acid." Clear and kind.

**q7-buffer, stage 5, reward.** Banner "The pH is the pKa plus the log of acetate over acetic acid." then "Henderson-Hasselbalch. Three acetate to one acetic acid puts the pH 0.48 above the pKa of 4.74, at 5.22. That rule, pH = pKa + log(base / acid), is the Henderson-Hasselbalch equation." The equation name is a mouthful for a title; the sentence is fine.

**q7-buffer, stage 5, hints.** Not opened.

**q7-buffer, stage 6, prompt/bench.** "Find the ratio of acetate to acetic acid that gives a pH of 4.40." Same two reference flasks as stage 5, a plate "pKa 4.74, Target pH 4.40" and a typed box labelled "Acetate per acetic acid". No tour. It is stage 5 run backwards and needs 10 to a negative power; the two reference flasks (4.74 and 5.74) only show "one unit per factor of ten", so 0.34 below the pKa cannot be turned into a ratio from the bench. This is calculator work behind the PRIMER key; say so, and say the ratio is a decimal.

**q7-buffer, stage 6, miss message.** Typed 2: "A flask with 2 acetate spheres for each acetic acid sphere reads 5.05, and the target is 4.40." Clear: it shows that the guess lands too high. Good.

**q7-buffer, stage 6, reward.** "Working Backwards. A pH of 4.40 lies 0.34 below the pKa, so the ratio of acetate to acetic acid is 10 to the power -0.34, which is 0.45. The Henderson-Hasselbalch equation runs in both directions." I typed 0.46 and it passed, but the reward prints 0.45. Print the number the student typed or the range accepted.

**q7-buffer, stage 6, hints.** Not opened.

**q7-buffer, stage 7, prompt/bench.** "What happens to the buffer's pH when base is poured in?" The buffer flask (100 and 100, pH 4.74), a Pour key and a four-way dial ("The pH": Rises a lot / Rises a little / Falls / Stays the same). No tour. This is stage 4 with base instead of acid and adds little; the base-side half of stage 3 already showed it. The dial's labels overlap ("Rises a lot" drawn over "Rises a little") and the knob sits on top of one; the chosen word pops up huge again.

**q7-buffer, stage 7, miss message.** Dial on "Stays the same" after pouring: "The meter reads 4.74 before the pour and 4.83 after it." Good, from the bench. The wording does not say whether 0.09 counts as "a little".

**q7-buffer, stage 7, reward.** "Base Taken Up. Acetic acid donated protons to the added base, falling from 100 to 90 while acetate rose to 110. The pH rose only from 4.74 to 4.83." Good. This and stage 4 can be one stage with an Acid / Base switch.

**q7-buffer, stage 7, hints.** Not opened.

**q7-buffer, stage 8, prompt/bench.** "What is the pH after pouring 50 spheres of NaOH into 100 spheres of CH3COOH (2:1 mole ratio)?" The flask (100 spheres), a plate "pKa 4.74, Equivalence (10 pours): pH 8.72", a Pour key and a typed pH box. No tour. The docs list this stage as the sealed "name the one that is not a buffer" stage; what is on screen is a different one, the same as stage 6's idea once more (half neutralized gives pH = pKa). The prompt uses "2:1 mole ratio" and "NaOH" without saying the ratio is acid to base, and the plate's "10 pours" and the stage's "5 pours" count different things (10 pours reach equivalence, 5 pours make the buffer).

**q7-buffer, stage 8, miss message.** Submitting 8.72 before pouring: "Pour 50 spheres of NaOH (5 pours) first." Clear. After pouring, 8.72: "8.72 is the pH at equivalence (1:1, all CH3COO-), not at the 2:1 buffer." Good, but it names the plate's number as the wrong answer, which means the plate is a decoy; say so on the plate or remove the equivalence line.

**q7-buffer, stage 8, reward.** Banner "A 2:1 weak-acid to strong-base mixture formed a buffer at pH = pKa (4.74)." then "Weak Acid + Strong Base Regimes. With 2:1 CH3COOH to NaOH, half the acid became CH3COO-, giving [HA] = [A-] and pH = pKa = 4.75. At 1:1 equivalence, only CH3COO- remains and pH > 7." The pKa is 4.74 in the banner and 4.75 in the box, and "Regimes" is jargon; correct to 4.74 and retitle "Half way to equivalence".

**q7-buffer, stage 8, hints.** Not opened.

**q7-buffer, debrief (4 slides and the Case Pin).** Slide 1 "The same pour of acid took the water from 7.00 to 2.04 and the mixture only from 4.74 to 4.66. The mixture is a buffer." Slide 2 "In the buffer each sphere of acid was caught by an acetate. Acetate fell from 100 spheres to 90 and acetic acid rose from 100 to 110." Slide 3 "Base is caught the other way: acetic acid fell from 100 to 90 and acetate rose to 110, so the pH rose only from 4.74 to 4.83." Slide 4 "The pH is the pKa plus the log of acetate over acetic acid. Acetate to acetic acid of 100 to 100 reads 4.74, 150 to 50 reads 5.22, and 100 to 10 reads 5.74." One idea each, numbers from the bench. Slide 4 lists "100 to 10" where the bench had 10 acetic acid to 100 acetate (the ratio is the other way round), and it never says what "buffer" is made of (a weak acid with its conjugate base); the stage 3 dials are missing from the debrief.

**q7-buffer, debrief, Case Pin.** "A weak acid with its conjugate base holds the intake's pH steady against acid spikes." Answers the opening question ("What can we add to keep the water steady?"). Good. It says "acid spikes" only; add "and base".

**q7-buffer, in general.** (1) Stage 3 (stacked dials) cannot be played by a beginner as built. (2) Stages 4 and 7 are one stage with a switch; stages 5, 6 and 8 are three versions of Henderson-Hasselbalch with logs the bench never shows. (3) The tour opened by itself only on stage 2, and it played a demo before the student acted. (4) Four answer dials (stages 2, 7 and the stage 3 dial group) have overlapping labels and the stuck-large word. (5) Hints were not opened. (6) Typed answers are accepted within a tolerance the reward does not state (0.46 against a printed 0.45; 4.74 against a printed 4.75).


## Verdigris, part 2 (q8-capacity and boss-leach)

### q8-capacity
**q8-capacity, question card.** "The fort's water is protected for now. How much more acid can it take before the protection fails?" Stage 1 asks "Which form of acetic acid is there more of at pH 3, and which at pH 6?" The card promises a "how much acid" answer, which stage 4 and 5 reach only after three stages about forms and indicators. Open with the water's buffer and a pour, then explain why it holds.
**q8-capacity, stage 1 (predict), bench.** Four long-sentence cards ("Acetic acid is the main form at both pH 3 and pH 6", "Acetic acid at pH 3 and acetate at pH 6", "Acetate at pH 3 and acetic acid at pH 6", "Acetate is the main form at both pH 3 and pH 6"), the text 14 px and centred in odd perspective; a dropped card lands inside the slot but covers the label "My prediction". "Acetic acid", "acetate" and "pH" were met in unit 09 q1 to q3 but "main form" is new. Hint 1 "Place one of the four prediction cards in the slot." says nothing. Tour (one step "Drag a card to its place."): a gesture taught in earlier worlds; remove.
**q8-capacity, stage 1, reward-line.** After submit: "Prediction locked in. Next, slide the pH dial across the strip to see which form dominates at each pH."
**q8-capacity, stage 2, prompt.** "You predicted "Acetic acid at pH 3 and acetate at pH 6". Which form of acetic acid is there more of at pH 3, and which at pH 6?" The sentence quotes the card whose text is the answer; I clicked "Acetic acid at 3, acetate at 6" in the answer list, which equals my prediction, so the stage is a copy of the prediction. Say "Test your guess: slide the dial to pH 3 and to pH 6 and read the bars."
**q8-capacity, stage 2, bench.** A clear chart: sliding the pH dial draws the two curves (acetic acid falling, acetate rising) and a row of green and grey spheres with the percentages "CH₃COOH 88 %" and "CH₃COO⁻ 95 %" under it; this is the best picture of the quest. Problems: the dial knob is small (a drag from 5 px off failed once); the percentages are in 10 px type at the bottom corners; the answer dial is a list of four sentences in the panel at right ("The main form / Set to —"), selected by clicking the sentence, and nothing says that the sentence is clickable (the control looks like a dial but behaves as a list). The word "dial" is used for it in the hint ("then set the answer dial"). Say "pick one".
**q8-capacity, stage 2, hint 1.** "Drag the "pH" dial to 3 and then to 6, then set the answer dial." How-to; a "What is this?" link beside it.
**q8-capacity, stage 2, reward.** "Acid and Base Forms. Your prediction was right. At pH 3 it is 98 percent acetic acid; at pH 6 it is 95 percent acetate." Good numbers; "Your prediction was right" is printed for everyone who picked the right answer, but the stage did not check the prediction.
**q8-capacity, stage 3, prompt and tour.** "At what pH is methyl red half in its red form and half in its yellow form?" Methyl red is new and "red form" and "yellow form" are not explained. Tour (opens by itself, one step) "Move the pH dial to see which form dominates at each pH." Good. The tour box covers the lower left of the bench.
**q8-capacity, stage 3, bench.** A tilted strip chart with a red curve, a yellow curve and a row of mixed red and yellow beads; the solution's colour swatch ("colour of the solution") at the left turns from red to yellow. The pH axis labels (2 to 8) are small and sit at the chart's far edge; the dial track is much longer than the chart, so the dial's pH and the chart's cursor are not above each other. The pH answer box is at the bottom right with a unit "pH".
**q8-capacity, stage 3, miss messages.** "At pH 4.0, the strip reads 93 percent red form and 7 percent yellow form." and "At pH 5.5, the strip reads 28 percent red form and 72 percent yellow form." Excellent: each shows what the strip read at the student's number.
**q8-capacity, stage 3, hints.** 1 "Drag the "pH" dial across the strip and type the pH in the field." 2 "Watch the heights of the red and yellow curves at the amber line as you slide the pH dial." 3 "Find the pH where the red and yellow curves cross at 50% each." Good ladder.
**q8-capacity, stage 3, reward.** "An Indicator. The two forms are equal (50% each) at pH 5.1, methyl red's pKa—red below, yellow above." "pKa" appears for the first time and is not defined; the word was not used in the prompt or hints. Say "pKa is the pH where the two forms are equal". 
**q8-capacity, stage 4, prompt and bench.** "Which buffer has the larger capacity?" Two flasks "Each 0.010 M" and "Each 0.10 M" with 100 mL, a pH readout, a Pour key and sphere pictures (one sphere is 0.1 mmol). "Capacity" is introduced in the prompt; "0.010 M" and "M" are not explained. The flask pictures are good: the right flask holds 10 times more spheres. After I pressed Pour on both: pH 4.27 (from 4.75) and 4.70 (from 4.74). The small caption "one sphere is 0.1 mmol" runs into the legend ("...caught the pour"), and the Pour key is 40 px wide at the flask's lower right. Tour (opens by itself) "Press Pour at the bottom right to add acid or base." The tour box covers the left flask.
**q8-capacity, stage 4, miss message.** "After one pour, the 0.010 M buffer dropped from 4.75 to 4.27, while the 0.10 M buffer moved only from 4.74 to 4.70." Good. It was grey on dark and hard to read. Pressing Submit before choosing: "Set the dial."
**q8-capacity, stage 4, reward.** "Buffer Capacity. The same pour dropped the dilute buffer to 4.27, while the concentrated one moved only to 4.70. Higher concentrations give greater buffer capacity." Good.
**q8-capacity, stage 5, prompt and bench.** "How many pours of acid can the second flask take before its acetate is used up?" Two flasks with spheres, one Pour key on Flask 1. Pouring six times gave pH 3.91 and the picture did not say "used up" (the acetate spheres vanish only in the last pours); I did not know when to stop. Make the flask say "acetate used up" when the green spheres are gone and show the pour counter. The answer (24) needs the student to count Flask 1's acetate (40) and Flask 2's (120) from pictures of hundreds of spheres, which is not feasible by eye; the miss message gives both numbers ("Flask 2 holds 120 spheres of acetate (Flask 1 holds 40)").
**q8-capacity, stage 5, miss message.** "6 pours add 30 spheres of acid, while Flask 2 holds 120 spheres of acetate (Flask 1 holds 40)." and for 20: "20 pours add 100 spheres of acid, while Flask 2 holds 120 ...". It reveals the arithmetic (120 ÷ 5 = 24). Good in that it explains, bad in that it gives away.
**q8-capacity, stage 5, hints.** 1 "Press "Pour" on Flask 1 until its acetate runs out, then type how many pours Flask 2 can take." 2 "Compare how much acetate Flask 2 starts with compared to Flask 1." 3 "Buffer capacity scales directly with how much acetate is available to neutralize the acid." Good.
**q8-capacity, stage 5, reward.** "The Limit. Flask 1's 40 spheres of acetate lasted 8 pours, so Flask 2's 120 spheres takes 24. A buffer fails once either component runs out." Good; "lasted 8 pours" is not what the student did (6 pours).
**q8-capacity, stage 6, prompt and bench.** "Which ratio of acetic acid to acetate holds its pH best?" Three flasks labelled "1 : 1", "10 : 1", "100 : 1" with pH 4.74, 3.74 and 2.95 and a Pour key on each; a horizontal answer dial at the right ("Holds best, acid : acetate / Set to —" with stops 1:1, 10:1, 100:1). The bench never says what a Pour adds; the miss message says "After pouring base ...", while stage 5 poured acid. Print "Pour 5 spheres of base" on the keys. Clicking a label on the answer dial does nothing (my first click said "Set the dial."); it must be dragged, as in stage 7 and 8, but stage 2's answer list was clickable: use one control style. The flasks' captions "one sphere is 0.1 mmol" and "...caught the pour" overlap each other, and "was 4.74" labels appear only after a pour.
**q8-capacity, stage 6, miss message.** "After pouring base, the 100 : 1 flask moved from 2.95 to 3.56, while the 1 : 1 flask moved only from 4.74 to 4.83." Good. Grey on dark again.
**q8-capacity, stage 6, reward.** "The Best Ratio. The 1 : 1 buffer shifted least (0.09 vs 0.21 and 0.61). Buffers work best when both components are within a factor of ten of each other." Good. The 10 : 1 flask is within a factor of ten, so the second sentence says the 10:1 flask works too while the stage calls 1:1 the best: say "closest to 1 : 1 works best".
**q8-capacity, stage 7, prompt and bench.** "Which sealed acid makes the best buffer at pH 4.5?" A strip chart with two dials ("pH" and "Acid X / Y / Z") and an answer dial. "Sealed acid" is the idea that the acids' pKa values are hidden, which the stage never says; the student must compare which acid is nearest half-and-half at pH 4.5 (X is 96 % base form, Y is 62 / 38, Z is 0 %). The result is read from a 10 px line at the bottom right ("X⁻ 96 %"). Good stage idea; the readout is far too small and the three curve pictures disappear when the dial moves (the old curve vanishes). Show all three curves at once, in three colours.
**q8-capacity, stage 7, miss message.** "At pH 4.5, Acid X reads 4 percent acid form and 96 percent base form, while Acid Y reads 64 and 36." Good: shows evidence. It reveals Y's figures; fine.
**q8-capacity, stage 7, reward.** "Choosing an Acid. Acid Y: at pH 4.5 it is 64 percent acid form and 36 percent base form. Pick an acid whose pKa is closest to your target pH." Good, the take-away rule is stated.
**q8-capacity, stage 8, prompt and bench.** "When acid is added to both beakers, which solid dissolves more?" Two beakers (Mg(OH)₂ and AgCl) with a Pour acid key and an answer dial (Mg(OH)₂, AgCl, Both equally). One pour of 10 acid spheres: a few Mg²⁺ appeared above the Mg(OH)₂ solid and none above AgCl. The effect after one pour is a handful of dots; make the dissolving visible (the solid squares shrink, ions float). "Solid" and "dissolves" are used before the stage says why (basic ions react with acid): that is the reward's job. The dial again had to be dragged by its knob; the 50 px knob is tiny. The idea (solubility depends on pH) is new and is the last stage with nothing leading to it: the question card has been about buffer capacity for seven stages, and stage 8 moves to solids. Say why in the prompt ("acid rain on the fort's stones").
**q8-capacity, stage 8, miss message.** With "AgCl": "After pouring acid, Mg(OH)₂ has 35 units of solid left and AgCl has 40 units left." Good. Grey on dark.
**q8-capacity, stage 8, reward.** "pH and Solubility. Adding acid removes basic anions like OH⁻ by forming water, pulling more Mg(OH)₂ into solution. Because Cl⁻ is the conjugate base of a strong acid, AgCl does not dissolve more in acid." "Basic anions", "conjugate base" and "strong acid" are three new terms in a sentence the student reads once. Say "OH⁻ reacts with the acid and makes water; Cl⁻ does not react with acid, so AgCl stays." The last-stage button is "FINISH" (other stages say "Next stage"); fine.
**q8-capacity, debrief (5 slides, last is the Case Pin).** 1 "At pH 3 the strip showed 98 acetic acid to 2 acetate, and at pH 6 it showed 5 to 95. An acid is mostly protonated below its pKa and deprotonated above it." "Protonated" and "deprotonated" are new jargon; say "has its H⁺ below ... has lost its H⁺ above". 2 "The same pour moved the 0.010 M buffer from 4.75 to 4.27 and the 0.10 M buffer only from 4.74 to 4.70. Buffer capacity grows with concentration." 3 "Flask 1 held 40 spheres of acetate and each pour used 5. After 8 pours 2 were left and the pH had dropped from 4.75 to 3.05." The student poured six times, not eight, and the slide does not say the flask was used up; "2 were left" contradicts "used up". 4 "Two pours of acid dissolved 10 spheres of magnesium hydroxide, because acid neutralizes its OH⁻, but none of the silver chloride. Basic anions make salts more soluble in acid." The student poured once (10 spheres of acid), not twice. Nothing about indicators (stage 3) or the best ratio (stage 6) or choosing an acid (stage 7). Slide 4's "Basic anions make salts more soluble in acid" is the right idea but jargon-heavy.
**q8-capacity, Case Pin.** "We measured the buffer's capacity, so we know how much runoff the intake can take." No number is given, so the card's "How much more acid can it take?" stays unanswered. Give the capacity (e.g. "about 24 pours of 5 spheres").
**q8-capacity, in general.** Answer controls differ by stage (a clickable list in stage 2, a draggable slider in 6 to 8, a number box in 3 and 5, cards in 1); the dial hint "set the answer dial" does not say which. Miss messages are very good but printed in dim grey; make them as bright as the hints. Several readouts (percentages, "was 4.75") are 10 px.

### boss-leach
**boss-leach, question card.** "The Fifth's acid runoff pours out at a huge rate. What kind of work makes that much acid?" None of the five phases asks about work or rates (they ask which flask is neutral, to order three acids, to sort three salts, to pick an indicator, to type a buffer ratio) and nothing on any bench mentions ore, mining or washing. The Case Pin then answers "The runoff matches heavy ore washing, far beyond ordinary mining." That is a leap from a pH quiz to a story fact. Either let a phase measure the runoff (a flask labelled "runoff" whose pH is so low only one process makes it) or reword the card to a question the phases can answer.
**boss-leach, intro.** The title "THE LEACH" is shown over a pier with a dark dome on it, centred, while the bench is still building (about 10 s black screen with "Building the bench" first). The boss card ("THE LEACH, PHASE 1 OF 5" with the red bar) then sits at the top centre of every phase and covers the right half of the prompt line and the "Trial missed:" line under it ("Trial missed: the reading does not match what that vat of..." was cut). Move the boss card out of the way.
**boss-leach, phase 1 ("Which flask is neutral?"), bench.** Three flasks (hydrochloric acid at 25 °C, water at 60 °C, sodium hydroxide at 60 °C) printed with their ion counts ("H₃O⁺ 3.1 × 10⁻⁷ M, OH⁻ 3.1 × 10⁻⁷ M" under the water) and a pH meter to drop in one flask. The counts under each flask are the answer: the flask whose H₃O⁺ and OH⁻ are equal is neutral, so the meter is not needed (and the HCl flask also reads 6.51, so the meter does not separate them). The answer dial is a vertical list at the bottom ("Hydrochloric acid / Water / Sodium hydroxide") with a knob at the right of the track; it needs a drag, which the stage does not say. Let the student discover the equal counts: hide them until the meter is in.
**boss-leach, phase 1, refusal.** With "Hydrochloric acid": "The hydrochloric acid flask reads 6.51, with 3.1 × 10⁻⁷ M H₃O⁺ and 3.2 × 10⁻⁸ M OH⁻." (the strip at the top said "MISSED TRIAL" and one integrity dot went out). Clear. Reward: "Neutral Is Equal Amounts. Warm water read 6.51 with equal H₃O⁺ and OH⁻, so it is neutral. The acid (6.51) and base (7.00) did not have equal amounts." The acid reading is 6.51 (the same as the water), which reads like a typo.
**boss-leach, phase 1, win scene.** A beam of light hits the Leach and the strip says "Dispersed"; the phase has only one of five health segments gone but the label says the foe is dispersed. Say "Phase 1 cleared".
**boss-leach, phase 2 ("Order these three acid solutions from lowest pH to highest pH."), bench.** The pH meter has a seat only in the first flask (acetic acid, 0.10 M, pH 2.88); the other two flasks have no seat, so the student can read one pH and must work out the other two from the picture (HF 0.0010 M, formic 0.050 M), which is a hard step for a beginner. My drag of the meter onto flasks 2 and 3 left it lying loose on the table. The cards "Acetic acid", "Hydrofluoric acid" and "Formic acid" are not on the rail at the start (the first Submit said "Put all 3 cards on the rail."); the rail is the thin strip at the top edge and, once cards are on it, the boss card hides the middle card and half of the others. Move the rail below the boss card and mark it with slots.
**boss-leach, phase 2, reward.** "Concentration vs. Percent ionized. Formic acid is pH 2.54, acetic acid 2.88, and hydrofluoric acid 3.26. HF had the highest percent ionized, but it was the most dilute, so its [H₃O⁺] was lowest." Good; "percent ionized" and "[H₃O⁺]" are new notation; the box before it never used them.
**boss-leach, phase 3 ("Which salt solutions are acidic, which neutral and which basic?"), bench.** A plate "Strong parents: Acids: HCl, HNO₃; Bases: NaOH, KOH" gives the rule outright, and the meter on the first flask is the only reading (4.98 for ammonium nitrate, shown only in the refusal). The student can sort without any measurement. Cards drop overlapping each other in the trays (two cards lay over each other in "Neutral"). The wrong sort refusal: "The meter on ammonium nitrate reads 4.98." The student never put the meter in a flask; the reading is shown anyway. Reward: "Salts of Weak Parents. Ammonium nitrate is acidic (4.98), sodium carbonate is basic (11.65), and potassium chloride is neutral (7.00). Only ions from weak parents react with water." Good rule.
**boss-leach, phase 4 ("Which indicator changes colour at the equivalence point of this titration?"), bench.** An ammonia flask (25.0 mL, 0.10 M) with a hydrochloric-acid burette (pour size 5 mL), a column of four coloured dyes with their pH ranges, four indicator cards and a "My indicator" slot. A student can put a card in the slot and submit without pouring anything. The refusal (phenolphthalein): "The phenolphthalein tube changed colour between 2.0 mL and 22.5 mL." — it states what the pour would show, so the burette is never needed. The question text "this titration" refers to a titration that nobody has run. The first-time student has no clue that the equivalence is at pH 5.28 (weak base + strong acid) unless they pour; show a pH read-out while pouring.
**boss-leach, phase 4, reward.** "An Indicator for a Base. Ammonia reached equivalence at 25.0 mL and pH 5.28. Methyl red changes colour right through that pH, making it the right indicator." Good.
**boss-leach, phase 5 ("What ratio of acetate to acetic acid gives a pH of 5.10?"), bench.** Two reference flasks ("100 acetic acid, 100 acetate", pH 4.74; "10 acetic acid, 100 acetate", pH 5.74), a plate "pKa 4.74, Target pH 5.10" and a number box. The two flasks give 1 : 1 and 10 : 1, so a student can interpolate (about 2 to 3) but the exact 2.27 needs 10^0.36, which the quest never taught (the reward uses the formula, the debrief does not). Accepted answer 2.27 (and 2.3 likely). Refusal for 5: "A flask with ratio 5 (acetate ÷ acetic acid) reads 5.44, and the target is 5.10." Good: shows a trial and gives a direction. Hints: 1 "Use the pKa and target pH on the plate, then type the decimal ratio." 2 "Compare the target pH with the pKa to see whether you need more acetate or more acetic acid." Reward: "A Buffer to Order. pH 5.10 is 0.36 above the pKa, so the acetate-to-acetic-acid ratio is 10^0.36 = 2.27." The log relation appears only here; add a line when the student first sees a ratio and pH side by side (q8-capacity stage 6).
**boss-leach, win scene.** The Leach bursts into light and the card reads "Dispersed"; a toast "Notebook updated. New entries are in the Case File." sits over the lower right corner on top of the reward.
**boss-leach, debrief (5 slides, last is the Case Pin).** 1 "Warm water read pH 6.51 yet held equal H₃O⁺ and OH⁻, so it was neutral. The warm base that read 7.00 held far more OH⁻ than H₃O⁺." 2 "Formic acid read 2.54, acetic acid 2.88, and hydrofluoric acid 3.26. The pH depended on total [H₃O⁺], not just the percent ionized." 3 "Ammonia reached equivalence at 25.0 mL of acid and pH 5.28. Methyl red changed colour right across that jump, while the other indicators did not." 4 "100 acetic acid spheres with 227 acetate spheres read pH 5.10. Choosing the buffer ratio sets the target pH." Salts (phase 3) have no slide. Slide 1 calls the sodium hydroxide flask "the warm base that read 7.00", which is wrong (a base at 60 °C reading 7.00 is odd; it is just because pKw changes) and unexplained.
**boss-leach, Case Pin.** "The runoff matches heavy ore washing, far beyond ordinary mining." See the question card note: nothing in the fight supports it.
**boss-leach, in general.** The five phases reuse the benches of q2, q3, q5, q6, q7; each phase works by comparing numbers printed on the bench, with the meter or burette unused or only half used. Integrity (the red dots) drops with a "MISSED TRIAL" strip; this strip's text is cut by the boss card. A miss was tried in phases 1, 3, 4 and 5, and an incomplete submit in phase 2. Hint rung 3 was not opened in any phase.
