# Playtest feedback 2026-11-23 (Bellows)

Played: Bellows (unit04), 3D On, 1440 x 900, Continue as Guest. Reached every bench by URL (`#/learn/unit04/<quest>` plus reload) with all quests marked complete, as the skill allows. All seven benches were played to their end, in order: q1-knocks (7 stages), q2-laws (6), q3-ideal (6), q4-mixtures (5), q5-speed (7), q6-real (4) and boss-compressor (5 phases): 40 stages and phases, each solved on screen, with the reward line read and, at the end of each quest, the Vess debrief read to its Case Pin. Practice cards and worked problems were skipped (out of scope).

Not checked: the world itself (arrival cutscene, flight, walking to a bench, NPCs, the opening scenes of each bench, the Sites list), phone width, hint rung 3 on almost every stage (it opens only after a second wrong answer, so I read rung 3 nowhere), and the pointer animation of the tours (I read every tour step's text and looked at the highlighted object, but did not watch the pointer move). TOUR does nothing on most predict stages; noted where it happened.

Where I did not play in 3D On: q1-knocks stage 4 and q4-mixtures stage 2 could not be played in 3D On (the dial or the tanks could not be grabbed, see the notes), so I solved them in 3D Off (the flat bench) and returned to 3D On straight after. I opened later stages with `window.__lqStage(n)` only to reset a camera that a missed drag had tilted (q1 stages 4 and 5, q4 stages 2 and 3, q6 stage 3, with a reload where needed); the Vess boxes that opened by themselves after a jump are a jump effect and have no notes. Some miss messages and hint rungs were not read (stated in the notes where it applies): q2 stage 2 miss message, q3 stage 2 miss message and hints, q5 stage 3 miss message. Wrong answers were submitted first on most other stages.

Blocking problems: q1 stage 4 (the Piston dial cannot be grabbed in 3D On), q4 stage 2 (the two tanks cannot be picked up in 3D On), q1 stage 7, q3 stage 2 and q6 stage 2 (the reading the stage is about is hidden until after a submit), q4 stage 4 and q6 stage 4 (readings or labels hidden under other pieces), and q4/boss tank benches (the drop target is not where the picture is).

## q1-knocks (What Pressure Is)


**q1-knocks, question card.** Kicker "What pressure is"; question says "Nobody has touched the valves, and the gauge on the jammed tank keeps climbing." Uses "gauge" (owner banned it) and "valves", "jammed tank" never seen; story is not on the bench (opened by URL, opening scene not seen). Say "pressure", and say what the bench shows.

**q1, stage 1 (predict), prompt.** Two top lines; orange story line repeats the question card. Seven tiny unlabeled squares at right of bar (again). 

**q1, stage 1, tour.** One step "A pressure meter measures how hard a gas presses on the wall it is fixed to." with Done. Fine but "how hard a gas presses" is vague; ok.

**q1, stage 1, hint 1.** "Lay one card in the slot." - an operating line, not a hint on the chemistry. Predict stage hint should be where to look.

**q1, stage 1, bench.** Dropped card sits half over the slot edge (not centred) after a drop near slot centre; text "Place a card in the slot." stays under table after the card is in. Bench dim; card text italic small.

**q1, stage 1, after submit.** "Prediction Recorded. Your guess is locked in. Next, you will test a sealed box with three pressure meters." fine. 

**q1, stage 2, tour.** One step on the box: "Sensors on the walls read how hard the gas pushes." "pushes" is the banned word; say "presses on the wall". The tour never mentions the Heater dial, which the bench text says to turn.

**q1, stage 2, bench.** Meter readings 244 / 393 have no unit on the bench (kPa only appears in the reward). Labels ROOF / SIDE WALL / FLOOR are half hidden behind the glass box. A stray grey square floats at the top left of the bench after turning the dial. The box and readings are small for a bench with this much empty table.

**q1, stage 2, instrument.** Dial drags smoothly from 20 to 200 C and the readings rise together (244 to 393), which is a good picture but the stage never asks about it: "All three the same" is true at 20 C already, so the dial is optional busywork. Either ask about the rise ("what happens to all three as it heats?") or make the dial matter.

**q1, stage 2, miss message.** "The roof meter does not read higher than the other two." only restates the wrong card. Say what to look at: "At 200 C the roof reads 393 and so do the other two."

**q1, stage 2, hints.** Hint 1 "Turn the Heater dial, then place a card in the slot." only repeats the bench text. Hint 2 "Compare the three meters with each other as the temperature changes." fine. Hint 3 is locked: "The last hint opens after one more wrong answer." (reads as a tease; fine but ok).

**q1, stage 2, cards.** Dropped cards land half on the slot and on top of the "What the meters show" label and other cards; after solving the correct card sits half outside the slot overlapping the roof card. Snap the card into the slot centred and move the others clear. Same on every card-slot stage.

**q1, stage 2, reward.** Bottom line only: "Pressure. The particles fly in every direction and collide with every wall alike. Those collisions are the gas's pressure, measured in kilopascals, kPa." No animation; correct but "collide with every wall alike" is the answer to the next stage? fine. 

**q1, stage 3, prompt.** "At what temperature would the pressure of this gas fall to zero?" A beginner has never been told a gas can reach zero pressure or that there is a lowest temperature; Vess tour step 1 says it ("follow the line down") but only in the tour. Ask first what happens to pressure as the gas cools, then the zero.

**q1, stage 3, tour.** 3 steps. Step 1 (Vess) fine. Step 2 "Sensors on the walls read how hard the gas pushes. Press "Record" to record." repeats stage 2 and says "pushes". Step 3 "Press "Straightedge" to draw a line of best fit through your plotted data points and read its slope and y-intercept." uses "line of best fit", "slope", "y-intercept" (jargon, none introduced) and talks about plotted points while no plot exists yet. No step shows the Heater dial or the marker dial. Reorder: dial, Record, plot appears, straightedge, marker.

**q1, stage 3, bench.** The graph only appears after the first Record; before that the bench has no graph, so "plotted data points" has no referent. Graph is tiny (about 190 px wide), axis ticks read -200, -175, -50, 75, 200 (uneven, odd), axis text unreadable at 1440x900. The straightedge label "Slope = 0.83 | b = 221.1" is tiny and sits on top of the line. The graph's temperature axis stops at -200 C, but the answer is about -273, so the line never visibly reaches zero pressure; the student must compute -b/slope by hand with no calculator. Extend the axis to -300 so the line visibly meets the zero line, and show where it crosses.

**q1, stage 3, marker dial.** "Pressure reaches zero at / Set 0 C" dial runs at least to -380; the marker is not drawn on the graph so it cannot be checked against the line. Drawing it on the graph would let a student drag it to where the line meets zero. -280 was accepted (the real value is -273), tolerance is not shown anywhere.

**q1, stage 3, miss message.** For 0 C: "Set the marker to the temperature you read off the line." Does not say why 0 is wrong. Say "At 0 C the line is still at 222 kPa, not zero."

**q1, stage 3, hints.** Hint 1 "Turn the Heater dial and press Record at several temperatures." is an instruction already on the bench. Hint 2 is locked behind a 13 second wait or a wrong answer; fine.

**q1, stage 3, reward.** "Absolute Zero and Kelvin. The line reaches zero at -273 C, called absolute zero. The kelvin scale counts from there: K = C + 273, so 27 C is 300 K." Good content, but it arrives after the stage that already used negative temperatures. Owner asked (feedback-11-01) for kelvin to come first; still true. Also "Heater 27 C" shows in C only; add K beside it from stage 3 on.

**q1, stage 4, tour.** One step on the cylinder: "Drag the dials to move the piston, heat the gas, or add gas." This stage has only a Piston dial (no heater, no gas dial), so the step is wrong for the bench. It also never says which volume to compare. Say "Turn the Piston dial from 24 L to 12 L and read COLLISIONS". The tour pointer moved the piston to 6 L during the demo; the stage then opens at 24 L.

**q1, stage 4, 3D ON, BLOCKING.** I could not find or grab the Piston dial in 3D On. There is no track or ticks (stage 2 and 3 Heater dials show ticks); only a ~5 px orange knob at the top-left end of the cylinder, behind the glass. Six drags from the knob and from the piston end cap only tilted/panned the camera; a click did nothing. Draw a visible track with ticks above the cylinder (like the Heater dial), make the knob bigger, and make the piston end cap draggable too. In 3D Off the same dial works (dragging 24 L to 8 L to 12 L), so I solved this stage in 3D Off (stated in header).

**q1, stage 4, bench (3D On).** A stray grey square floats near the top right of the bench (seen at stages 2 and 4 after interaction).

**q1, stage 4, dial steps.** Dial jumps 24 L, then 8 L ahead, 12 L only at a specific mid position: steps are 24, 12, 8, ... uneven spacing; a student dragging to "half" cannot tell where 12 L is. Label the ticks with the volumes.

**q1, stage 4, miss message.** "Compare the COLLISIONS counter at 24 L and 12 L on the cylinder." Good; this tells the student exactly what to do.

**q1, stage 4, cards (3D Off).** Dropped "Half as many" card covers the "Collisions" slot label; after solving two cards overlap.

**q1, stage 4, reward.** "Boyle's Law. Half the volume gives twice the collisions and twice the pressure, so pressure x volume stays the same at one temperature. This is Boyle's law." Names Boyle's law before q2-laws asks for it; fine, but "pressure x volume stays the same" is the answer to stage 5 and q2: stage 5 now has nothing left to find.
(correction) q1 stage 4: piston dial could not be grabbed in 3D On, but in stage 5 (3D On) the same dial dragged fine (24 L to 8 L). So stage 4's problem is the rig position/hit area, not the dial itself.

**q1, stage 5, how I got here.** Opened with __lqStage(5) after stage 4 was solved in 3D Off; the Vess box opening by itself is a jump artifact (no note on it).

**q1, stage 5, tour step 1 (Vess).** Shows a worked example "200 kPa x 6.0 L = 1200 / new volume 2.0 L / 1200 / 2.0 = 600 kPa" with P1V1 = P2V2 for a different case. It is the method for this stage, written out; a student who opens the tour just copies it. Use a different relation image only, or drop the numbers.

**q1, stage 5, bench.** The cylinder is small (about 1/4 of the plate) and half of the plate to its left is an empty black rectangle. Enlarge the cylinder and fill or remove the black area. Stray grey square floats above the plate (now at the top middle); it moved between screenshots.

**q1, stage 5, prompt.** "What would the pressure be at 1.5 L?" The Piston dial has no 1.5 L setting (24, 12, 8, 4 ...), so the student cannot read the answer; it must be calculated, with no calculator on this bench. Fine as a stage, but say "Use the cylinder's readings to work out ..." and put the calculator button on the bench.

**q1, stage 5, miss message.** "At 4.2 L this gas would read 600 kPa, not at 1.5 L." Good and specific.

**q1, stage 5, hints.** Hint 1 "Turn the Piston dial and read the pressure and volume at each setting." Hint 2 "Check whether pressure x volume stays the same at every Piston setting." (gives the rule; fine here) both have a "What is this?" glossary chip beside them, which looks like part of the hint. Hint 3 locked until another wrong answer.

**q1, stage 5, reward.** "Using Boyle's Law. Pressure x volume stays about 2490 kPa-L, so at 1.5 L the pressure is about 1660 kPa." fine. Stage 5 repeats stage 4's reward idea (Boyle's law named twice).

**q1, stage 6, prompt.** "Put the four speed snapshots in order from coldest on the left to hottest on the right." First time the student meets a "speed screen" / "snapshot"; they are told in tour step 1 only. Say what a snapshot is on the bench ("a photo of the gas's speeds at one temperature").

**q1, stage 6, tour.** Step 1 (Vess): "The speed screen sorts the particles by how fast they are moving: each bar counts the particles near that speed." Good. Step 2 "Drag the dials to move the piston, heat the gas, or add gas." is the same generic line as stage 4, wrong here (only a Heater dial) and says nothing about the strip. The tour demo leaves the heater at 327 C after Done.

**q1, stage 6, bench, Heater dial.** At 27 C the dial knob is invisible: it sits at the left end of the track hidden behind the cylinder/histogram. I only found it by guessing (227,201) on screen. Move the track clear of the cylinder and show all four settings with labels (-73, 27, 227, 527 C); the dial is also the only way to see what each snapshot means.

**q1, stage 6, bench, snapshots.** The snapshot captions "0 to 2400 m/s" are tiny and dark (unreadable). Snapshots are not labelled with a temperature, so the student must match shapes by eye; fine, but make the bars brighter. Cards on the strip overlap each other (A over C) after moving; space them evenly. Two stray grey squares float at the top left of the bench.

**q1, stage 6, strip.** Dragging D to the left end shoves the others and for a moment A is not visible; the strip needs a drop marker showing where the card will go.

**q1, stage 6, miss message.** "Two neighbouring snapshots on the strip are the wrong way round." Says something is wrong but not which pair. Highlight the pair or say "Snapshot D looks colder than A".

**q1, stage 6, hints.** Hint 1 "Turn the Heater dial and drag the snapshots onto the strip, coldest on the left." is an instruction. Hint 3 "Notice how heating shifts the speed spread higher, and order the snapshots by their spread." fine. (Hints 2 and 3 not opened here, see header.)

**q1, stage 6, reward.** "Speeds in a Gas. The particles do not all move at one speed. Heating shifts the spread to higher speeds and widens it; this spread is the Maxwell-Boltzmann distribution." Introduces a name nobody needs yet (q5 teaches it); drop the name here. Bottom text only, no animation.

**q1, stage 7, prompt.** "At what temperature do carbon dioxide (CO2) particles have the same average kinetic energy as helium (He) particles at 300 K?" Kinetic energy is only introduced in tour step 1 and the number "6.21" has no unit. Stage has no predict step although the surprising result (same temperature, very different speeds) is exactly what a prediction card would test.

**q1, stage 7, tour.** Step 1 (Vess) good. Step 2 repeats the generic "Drag the dials to move the piston, heat the gas, or add gas." though Cylinder A has no dials and B has only a Heater; highlight is on Cylinder A, not B. Show the pointer turning B's Heater.

**q1, stage 7, bench, BLOCKING-ish.** Cylinder B's KINETIC ENERGY line is blank at every heater setting; the number (7.25 at 350 K) only appears after pressing Submit with a wrong answer. Hint 1 says "watch its KINETIC ENERGY and SPEED readings" but the reading is hidden, so the student can only guess and submit. Show B's reading live as the dial turns (or explain that it is hidden). After solving, B's KINETIC ENERGY still shows blank beside A's 6.21, so the reward's comparison cannot be seen.

**q1, stage 7, Heater dial.** No visible track; the knob rides the cylinder's top edge. The first drag at the knob location panned the camera; I found it on the second try. Five settings (200, 250, 300, 350, 400 K) are unlabelled except by the top label. Draw tick marks with the values.

**q1, stage 7, miss message.** "Cylinder B's particles have more kinetic energy than Cylinder A's." Good (says which way), but it names the answer's direction only after a wrong Submit, see above.

**q1, stage 7, reward.** "Temperature and Kinetic Energy. The energies match at 300 K, the same temperature, though helium moves about three times as fast. Temperature measures the average kinetic energy of the particles, whatever their mass." Good content, text only. This is the idea the quest's mystery ("the gauge keeps climbing") needs, but the quest never returns to the jammed tank.

**q1, debrief (Vess, 4 slides).** Slide 1: "A gauge on the floor, on the side wall and on the roof of a sealed box all read the same, because a gauge counts knocks and counts them alike on every wall." The animation beside it shows bars "knocks per length of wall" of roof 3.6, side wall 2.8, floor 3.0, which are not the same, contradicting the sentence. Make the bars equal (average over time) or the line "about the same". Slide 2: "The gas is not pressing down with its weight: more gas, less room or more heat all make the knocks harder or more frequent." uses "room" and "knocks" (owner banned "room", "gauge", "push" in Bellows: still here); also says "more gas, less room" as new facts never shown in this quest (gas amount was never changed). Slide 3: "Temperature measures the average kinetic energy of the particles, and pressure reflects how frequently and forcefully they collide with walls." two ideas in one slide; fine but long. Slide 4 (hotter picture, bars 17.2 / 11.6 / 15.2) shows "hotter" with no earlier "cooler" for comparison.

**q1, Case Pin.** "Gas particles hitting the tank walls cause the pressure." The question card asked why the gauge on a jammed tank "keeps climbing" with valves untouched; the pin explains pressure but not the climb (heat raises it, shown at stage 2 only in passing). Add "and heat makes them hit harder and more often, so the gauge climbs".

**q1, whole quest.** (1) The words "gauge", "room", "pushes", "knocks" are still in the question card, tour, debrief; replace with pressure, volume, "hit" or "collisions" (the bench already says COLLISIONS). (2) Stages 4 and 5 are the same idea twice (stage 4 reward already states PV constant). Merge or make stage 5 test something new. (3) Kelvin arrives in stage 3's reward after stage 3 used negative Celsius; owner asked for Kelvin first. (4) The dial knob problem (stage 4 unreachable, stage 6 hidden at 27 C, stage 7 no track) is the quest's main playability issue: draw visible dial tracks with tick labels above every rig. (5) Stray grey squares float at the table edge in several stages. (6) Quest has no opening scene (opened by URL; not checked).

## q2-laws (The Gas Laws)


**q2-laws, question card.** "This sealed tank sat in freezing wind all night, and its gauge never dropped. What should the cold have done to it?" Uses "gauge" (owner banned it). A gauge that "never dropped" is a puzzling premise and the stages that follow are about a freely moving piston and cylinder volume, not a sealed tank's pressure. Make stage 1 ask about the tank (cold sealed gas: pressure falls) or change the card to a piston story.

**q2-laws, stage 1 (predict), prompt.** "A gas under a freely moving piston is warmed from 20 C to 40 C: how much bigger does its volume get?" Cards "Twice as big", "A little bigger", "No bigger". The bench shows only cards, no picture of a piston or heater; show the cylinder. The Celsius numbers are the trap and kelvin has not been needed yet in this quest; say that explicitly later (see stage 2).

**q2-laws, stage 1, tour.** TOUR does nothing on this stage (two presses, no box appeared), unlike q1 stage 1. Either show a step or hide the button on predict stages.

**q2-laws, stage 1, bench.** Card drops half over the slot again; a stray grey square floats at the top left of the table.

**q2-laws, stage 1, hints.** Not opened (predict). After submit: "Prediction Recorded. Your guess is locked in. Next, two cylinders will test how temperature changes gas volume." Fine.

**q2-laws, stage 2, prompt.** "At what kelvin temperature does Cylinder B have twice the volume of Cylinder A at 293 K?" "At what kelvin temperature" is awkward; say "How many kelvin must B be heated to for its volume to be twice A's (A stays at 293 K)?". Answer field "Cylinder B at ___ K".

**q2-laws, stage 2, tour.** One step, highlight on Cylinder A: "Drag the dials to move the piston, heat the gas, or add gas." Same generic line as q1; B is the cylinder with a dial and there is no piston dial or gas dial here. Point at B's Heater.

**q2-laws, stage 2, bench.** Heater dial is a knob on the left end cap of Cylinder B with no visible track; my first drag from where the knob looked to be only tilted the camera. Dial steps (293 up to 400 K shown) never reach the answer (586 K), so the answer cannot be set or read on the bench, it must be calculated (2 x 293). That makes the dial a way to see the trend only. Extend the dial to 600 K or ask for a smaller doubling.

**q2-laws, stage 2, miss message.** Typed 313 (the Celsius trap). I did not read the message before my screenshot cropped it; see header (not read).

**q2-laws, stage 2, hints.** Hint 1 "Turn Cylinder B's Heater dial and watch its volume and kelvin temperature." Hint 2 "Notice that volume is in step with the kelvin temperature, not C." Each has a "What is this?" chip. Hint 3 locked: "The last hint opens after one more wrong answer."

**q2-laws, stage 2, reward.** "Charles's Law. The volume doubled at 586 K, twice 293 K, which is 313 C and not 40 C. At constant pressure, volume is in step with kelvin temperature: Charles's law." The reward states the doubling happened ("doubled at 586 K") but the bench never showed it; and it does not return to the stage 1 prediction (20 C to 40 C is "a little bigger"). Say "20 C is 293 K and 40 C is 313 K, so the volume grows by 7 percent".

**q2-laws, stage 3, prompt.** "What volume would this gas fill at 600 K?" Answer field "Volume at 600 K ___ L". Clear, but it is the same question as stage 2 run the other way (stage 2 doubled the kelvin, stage 3 scales it): two stages of Charles's law with a calculation. Merge into one stage, or make stage 3 use a Celsius reading to practise the conversion.

**q2-laws, stage 3, tour.** Step 1 (Vess) gives the full worked method for a different case: "V1 / T1 = V2 / T2 ... 12 L at 300 K, 12 / 300 = 0.040 L for each kelvin, at 450 K: 0.040 x 450 = 18 L". This is the answer procedure (a student copies it with 24.6 L, 300 K, 600 K). Keep the idea, drop the worked numbers or use the earlier stage's reward for it. Step 2 is the generic "Drag the dials to move the piston, heat the gas, or add gas." again, highlight on the cylinder.

**q2-laws, stage 3, bench.** After Done the Heater is left at 300 K (24.6 L); the knob and track are visible here (the track is clearer than in stage 2). No dial position reaches 600 K, so the answer must be calculated. The cylinder is small and the plate empty around it.

**q2-laws, stage 3, miss message.** "That volume does not match the readings on the cylinder." for 40 L. Does not say what to do. Say "At 300 K the cylinder shows 24.6 L; 600 K is twice as hot".

**q2-laws, stage 3, reward.** "Using Charles's Law. Volume / kelvin stays about 0.082 L per K, so at 600 K the gas fills about 49 L." fine. Text only.

**q2-laws, stage 4 (predict), prompt.** "A sealed tank cools from 293 K to 243 K: what happens to its pressure?" Cards "Stays the same", "Falls by about a sixth", "Falls by about a half". This is the question the quest opened on, so it fits, but the tank is never shown on the predict bench and stage 5 asks the same question again with the same three cards. Merge stage 4 into stage 5 (keep the prediction, run the test on the same page) or give stage 4 a different cooling.

**q2-laws, stage 4, tour.** TOUR does nothing on this stage (same as stage 1).

**q2-laws, stage 5, prompt.** "By about what fraction does the pressure fall when the tank cools from 293 K to 243 K?" Identical in numbers and cards to stage 4; the student who predicted already knows the question. Also "fraction" cards "a sixth" vs "a half" need arithmetic (243/293) the bench never shows; show the pressure readings 244 and 202 side by side with the kelvin.

**q2-laws, stage 5, tour.** One step on the tank: "Drag the dials to move the piston, heat the gas, or add gas. Press "Record" to record." This bench has no piston dial and no gas dial, and Record is not used at all in this stage (pressing it does nothing visible). Pointer goes to Record, which is the wrong control: it should go to the Heater dial.

**q2-laws, stage 5, bench.** "Sealed tank N2" is drawn as the same glass cylinder with a loose piston end cap as before, so it does not look sealed. Pressure reads 244 kPa at 293 K, 202 kPa at 243 K with no unit on the kelvin line (K shown). Cards drop half over the slot and over the label "What the pressure did".

**q2-laws, stage 5, miss message.** "The pressure at 243 K did not fall by the fraction that card says." Does not give the numbers; say "It fell from 244 to 202 kPa, which is not half."

**q2-laws, stage 5, reward.** "Gay-Lussac's Law. The kelvin temperature fell by about a sixth and so did the pressure. At constant volume, pressure is in step with kelvin temperature: Gay-Lussac's law." fine content, text only. This is where the opening question (the tank in freezing wind) is answered, but the reward never mentions the tank or why the gauge "never dropped".

**q2-laws, stage 6, prompt.** "What is the pressure after the volume is cut to a third and the gas is heated from 300 K to 900 K?" Answer field "Final pressure ___ kPa". This is the combined gas law and nothing in the quest taught combining two changes; stages 1 to 5 each change one thing. The first time the student meets two changes is the final test. Add a stage that changes volume and temperature together (e.g. run both dials and read the pressure) before this, or have the tour step explain "do one change at a time, then the other".

**q2-laws, stage 6, tour.** One step on the cylinder: "Drag the dials to move the piston, heat the gas, or add gas." (same generic line, third quest in a row). Piston and Heater knobs are stacked close together at the left end of the cylinder (two orange knobs about 10 px apart); hard to tell which is which. Separate the two dials and label them.

**q2-laws, stage 6, bench.** Cylinder is tiny with a big empty plate; stray grey square at the top left again. 100 kPa, 6 L, 300 K start values are readable.

**q2-laws, stage 6, miss message.** For 300: "300 kPa only accounts for one of the two changes." Good, says why.

**q2-laws, stage 6, instrument.** I did not use the dials; the answer is arithmetic from the prompt (100 x 3 x 3). The bench adds nothing. Make the bench give the check: show the pressure that results when the student runs both dials and ask them to predict it first.

**q2-laws, stage 6, reward.** "Two Changes at Once. A third of the volume triples the pressure and three times the kelvin temperature triples it again: 100 kPa becomes 900 kPa." Good and plain.

**q2-laws, debrief (Vess, 4 slides).** Slide 1: "A gas does not care about the number on a Celsius thermometer. Its room, and its pressure in a sealed tank, follow the kelvin temperature, counted up from absolute zero." "does not care" is an anthropomorphic phrasing and "room" is the banned word for volume. Slide 2: "So a sealed tank left out in the cold must lose pressure in step with its kelvin temperature: cool one by fifty degrees and its gauge falls by about a sixth." "gauge" again; "about a sixth" is true only from 293 K, say so. The picture shows a gauge needle, a dotted line from 0 K "no knocks" up to "17 % lower": "knocks" is not defined and "17 %" appears next to the words "a sixth". Slide 3: "Every cold-weather check on the station comes down to this, and a tank that does not follow it has something wrong inside." Story aside the student cannot use; cut. Case Pin: "Cold should drop its pressure, so a tank that stays hot has a heat source inside." This follows the question card but the quest never mentioned a heat source.

**q2-laws, whole quest.** (1) Stages 4 and 5 are the same question; merge. (2) Stages 2 and 3 are both Charles's law arithmetic; one is enough. (3) No stage for Boyle (q1), Charles, Gay-Lussac side by side (what stays fixed); a stage that sorts the three laws by what is held constant would let the student see the pattern. (4) Hint 3 is locked until a second wrong answer on every stage, so a student who answers right after hint 2 never sees it; fine. (5) The Heater/Piston dial knobs are hard to find (no tracks) as in q1.

## q3-ideal (The Ideal Gas Law)


**q3-ideal, question card.** "Opening a jammed tank to look inside could burst it. How can we count the gas in it from the outside?" Good premise (continues q1's jammed tank) but "count the gas" is not what stage 1 asks (moles of He vs CO2 at equal temperature and pressure).

**q3-ideal, stage 1 (predict), prompt.** "One mole of helium and one mole of carbon dioxide are at the same temperature and pressure: which fills more volume?" "Mole" is used before it is explained; the only explanation is tour step 1.

**q3-ideal, stage 1, tour.** Single Vess step: "A mole is a fixed, very large number of particles." This says nothing a student can use (how many? why a unit?). Say "A mole is a counting unit, like a dozen, but for particles: 1 mole = 6.02 x 10^23 particles." Also opens only when TOUR is pressed (fine).

**q3-ideal, stage 1, bench.** Same as the other predict benches: card half over the slot after drop; bench shows only cards. After submit: "Prediction Recorded. Your guess is locked in. Next, two cylinders will test whether different gases fill different volumes at the same temperature and pressure." fine.

**q3-ideal, stage 2, prompt.** "How many moles of carbon dioxide fill the same volume as one mole of helium?" (no answer field; the Gas in dial is the answer.) The prompt asks "how many moles" but the student answers by turning a dial and pressing Submit; say "Turn Cylinder B's Gas in dial until B fills the same volume as A".

**q3-ideal, stage 2, tour.** Generic "Drag the dials to move the piston, heat the gas, or add gas." with the highlight on Cylinder A (it has no dial). Point at Cylinder B's Gas in dial.

**q3-ideal, stage 2, bench, BLOCKING-ish.** Cylinder B's VOLUME shows "-" at every setting, before and after Submit and after solving, so the student cannot see that the volumes match; they can only guess by amount (0.5 mol, then 1 mol) or by mass. Show B's volume live next to A's 22.4 L. Also the dial knob is a tiny orange dot on B's left end cap with no track or tick labels; four drag attempts tilted/panned the camera before one worked. Draw a track with the values (0.5, 1, 2 mol).

**q3-ideal, stage 2, miss/hints.** I set the dial to 1 mol on my first submit, so the miss message and hints were not read on this stage (not checked).

**q3-ideal, stage 2, reward.** "Avogadro's Law. One mole of each fills the same volume, however heavy its particles. This is Avogadro's law." Correct, but the bench never showed the equal volume (see above). Also 22.4 L for A is introduced without saying it is "one mole at 0 C and 1 atm".

**q3-ideal, stage 3, prompt.** "What does P x V / (n x T) come to for this gas, in kPa, litres, moles and kelvin?" Cards 8.31, 0.0831, 83.1, 101.3; slot "It comes to". The first time the ratio PV/nT is shown to the student is inside the question itself; the student has never been told why this ratio. The "Ideal gas law hinted but never stated" owner note (feedback-11-01) is still partly true: it appears only in the reward.

**q3-ideal, stage 3, tour.** Step 1 (Vess): "Pressure rises with the moles (n) and kelvin temperature (T), and falls as volume (V) grows. Put together, P x V / (n x T) comes to the same number for any gas." States the finding before the stage tests it. Step 2: "Drag the dials to move the piston, heat the gas, or add gas. Press "Record" to record." (generic again; this bench has Heater and Gas in dials, no piston). The graph (P x V against n x T) shows only during the tour and after Record; empty plate afterwards.

**q3-ideal, stage 3, bench.** Readings 101 kPa, 22.4 L, 1.00 mol, 273 K are enough to work out the answer with the calculator, no need for Record or the graph. The graph's axes are tiny and unreadable. Cards: 4 small cards, one lands overlapping another after drop (8.31 over 83.1). Stray grey square at the left again.

**q3-ideal, stage 3, miss message.** "The cylinder readings do not come to the number on that card." Vague; say "101 x 22.4 / (1 x 273) is about 8.3, not 83.1".

**q3-ideal, stage 3, reward.** "The Ideal Gas Law. It is 8.31 at every setting. That number is the gas constant, R, and the relation PV = nRT is the ideal gas law." Good, but "at every setting" was never shown (the student may never have recorded a second setting). Make Record required: ask the student to record at least two settings.

**q3-ideal, stage 4, prompt.** "How many moles of gas are in Tank X?" Answer "Moles in Tank X ___ mol". Good and short, and it is the quest's question ("count the gas from the outside").

**q3-ideal, stage 4, tour.** Step 1 (Vess) works the entire method with numbers: "From PV = nRT, the moles in a tank are n = PV / RT. P x V = 500 x 5.0 = 2500 / R x T = 8.31 x 301 = 2500 / n = 2500 / 2500 = 1.0 mol". A student who opens the tour copies it with 400, 10, 300. The tour also does not show the calculator button (a student will need one for 400 x 10 / (8.31 x 300)); point at it. Step 2 is the generic dial line again.

**q3-ideal, stage 4, bench.** During the tour the cylinder label read "Piston 15 L" while the reading said "VOLUME 10.0 L" (tour demo moves the piston); afterwards "Piston 10 L". Cylinder tiny on a big plate; "Read Tank X, then type your answer at the bottom." is fine.

**q3-ideal, stage 4, miss message.** For 4: "In this 10 L tank at 300 K, 4 mol would give 998 kPa, not 400 kPa." Excellent; make every stage's miss message do this.

**q3-ideal, stage 4, reward.** "Moles in a Tank. For Tank X, n = (400 x 10) / (8.31 x 300), about 1.60 mol." Fine, text only; does not close the jammed-tank story ("how many moles are in it").

**q3-ideal, stage 5, prompt.** "Which gas is in the sealed tank?" Cards: Nitrogen 28, Oxygen 32, Argon 40, Carbon dioxide 44 g/mol. "g/mol" (molar mass: grams in one mole) is introduced nowhere; the student must find moles from P V / R T (stage 4), then divide the weight by it. Two steps, no guide. Say in the prompt "Weigh the tank, work out how many moles it holds, then find the gas whose one mole weighs that much."

**q3-ideal, stage 5, tour.** One step "Drag a tank onto a pan, slot, or tray." The tank to drag and the scale are not highlighted; the highlight sits on an empty square (the tank's drop spot) while the Sealed tank label covers the tank. "pan, slot, or tray" are three words for one thing here; say "Drag the tank onto the scale".

**q3-ideal, stage 5, bench.** The tank's information label ("Sealed tank 250 kPa 10.0 L 300 K") sits on top of the tank and over the scale's WEIGHT line, hiding part of the reading "44.1 g" ("WEIGH..." cut). The tank starts beside the scale not on it; my first drag at its picture missed and panned the camera. Cards overlap each other when dropped (Nitrogen under Carbon dioxide).

**q3-ideal, stage 5, miss messages.** Submitting with the tank off the scale: "Put the sealed tank on the scale to weigh its gas." good. Wrong gas: "That gas does not fit the sealed tank." vague; say "44.1 g in 1.0 mol is 44 g per mole, not 28".

**q3-ideal, stage 5, reward.** "Naming a Gas. The tank holds about 1.0 mol and 44 g of gas, so one mole is 44 g: carbon dioxide." fine; text only.

**q3-ideal, stage 6, prompt.** "How many moles of gas are in Tank Y?" Tank Y: 2.50 atm, 5.00 L, 27 C. Good as a units trap (atm and Celsius together).

**q3-ideal, stage 6, tour.** Step 1 (Vess): "Pressure is also measured in atmospheres: 1 atm is 101.3 kPa. With atm and litres the gas constant is 0.0821." The tour hands over the gas constant for these units, which the student could not otherwise know (the bench never shows 0.0821); this is the right content but it lives only in a skippable tour. Put "R = 0.0821 L atm / (mol K)" on the bench or in the glossary. The kelvin conversion (27 C to 300 K) is not mentioned anywhere before the miss/reward, and the cylinder shows only C here (no kelvin line, unlike earlier stages), so the student has to remember K = C + 273.

**q3-ideal, stage 6, bench.** Cylinder reads "PRESSURE 2.50 atm TEMPERATURE 27 C VOLUME 5.00 L"; label says "Tank Y - Ar" and a piston label "Piston 5 L". Small cylinder on empty plate; no calculator button on the bench.

**q3-ideal, stage 6, miss message.** For 5.6 (used 27 instead of 300): "That is more gas than Tank Y holds." Does not say why (the Celsius trap); say "You used 27 for T. The gas law needs kelvin: 27 C is 300 K."

**q3-ideal, stage 6, reward.** "Atmospheres and Celsius. 2.5 atm, 5.0 L and 300 K give 0.51 mol. Using 27 for the temperature would have given a number eleven times too large." Good and specific.

**q3-ideal, debrief (Vess, 4 slides).** Slide 1: "A gas takes up room according to how many particles it has, not what they are." "room" again (banned word for volume) and "not what they are" ignores temperature and pressure. Slide 2: "A mole of helium and a mole of carbon dioxide fill the same room, though one weighs eleven times the other." room again. Slide 3: "So a pressure, a room and a temperature are enough to count a sealed tank without opening it, which is the first check when a holder reads too high." room again; "holder" (gas holder, a station term the student has never seen). Replace "room" by "volume" in all three slides. Case Pin: "Pressure, volume and temperature give the amount of gas without opening a valve." Good; answers the question card.

**q3-ideal, whole quest.** (1) Moles are used in stage 1 and defined only by "A mole is a fixed, very large number of particles." (2) Stages 4 and 6 are the same calculation; stage 6 differs only by the unit trap, so fold the trap into stage 4 or make stage 6 find a different unknown (volume or pressure). (3) The ideal gas law is named in the stage 3 reward and used by stage 4; fine. (4) Hidden readings (stage 2 volume) and hard-to-grab dials are the playability issues again.

## q4-mixtures (Partial Pressures)


**q4-mixtures, question card.** "The Fifth pumped a second gas into the fuel line, and the gauge reads higher. How much of that reading is the new gas?" Uses "The Fifth" (a faction the student has not met on this world's path), "fuel line" (never shown) and "gauge" (banned word). The stages are about neon and helium in tanks, not a fuel line. Say "A second gas was added to the tank and the pressure rose. How much of the new pressure is the second gas?"

**q4-mixtures, stage 1 (predict), prompt.** "Neon is alone in a tank and helium is added: what happens to the pressure neon makes?" Cards "The same", "Lower", "Higher". "the pressure neon makes" is awkward; say "the pressure of the neon alone". No picture of the tank on the bench. TOUR opens nothing on this stage (same as the other predict stages).

**q4-mixtures, stage 2, prompt.** "What happens to neon's own pressure when helium is let into the same tank?" Stage title "Each Gas Alone". Almost the same sentence as stage 1; the prediction and this test ask the same question again.

**q4-mixtures, stage 2, tour.** One step "Drag a tank onto a pan, slot, or tray." (generic gas-tank line, third use in this world). The tour box covers both tanks while it points at an empty square, not at the common tank.

**q4-mixtures, stage 2, bench (3D On), BLOCKING.** I could not pick up Tank A or Tank B in 3D On: five drags (on the tank, its cap, its label) only tilted the camera. The two tanks stand on top of each other with their labels overlapping ("TANK A 249 kPa He" over "TANK B 150 kPa Ne"), partly covering the instruction line, which is cut off to "then place a car...". The how-to is split in two pieces far apart ("Open both tanks into the common tank," at the bottom left, "then place a card in the slot." in the middle). Move tanks apart, put labels beside not over them. I played this stage in 3D Off after that (stated in header).

**q4-mixtures, stage 2, bench (3D Off).** Common tank panel reads "PRESSURE 0 kPa" (shown "-" before) and "EACH GAS PUSHES" ("pushes" is banned) with an empty dashed box "Valves open into the tank". Dropping only Tank B into the common tank (Tank A ended up hidden under it) and choosing "The same" was accepted, so the stage can be passed without ever seeing a pressure reading and without opening both tanks. Show the common tank's pressure for each gas, and require both tanks open before the card can be submitted. Change "EACH GAS PUSHES" to "PRESSURE OF EACH GAS".

**q4-mixtures, stage 2, reward.** "Partial Pressure. Neon's pressure did not change. The pressure a gas has in a mixture is its partial pressure, and the partial pressures add up to the total: Dalton's law." Correct, but the bench never showed neon's pressure staying at 150 kPa. Also two ideas (partial pressure, Dalton's law) in 35 words; split.

**q4-mixtures, stage 3, prompt.** "What is the partial pressure of nitrogen when all four tanks are open?" (stage title "A Gas's Share"). Answer "Partial pressure of nitrogen ___ kPa". Fine. "Partial pressure" was defined in stage 2's reward only.

**q4-mixtures, stage 3, tour.** Step 1 (Vess) works an example with the method: "A gas's mole fraction is its moles divided by all the moles in the mixture. Its partial pressure is that fraction of the total pressure. 0.2 mol of 0.8 mol is 0.25, 0.25 x 200 kPa = 50 kPa". Gives the whole procedure; the student copies it. Step 2 is the generic "Drag a tank onto a pan, slot, or tray."

**q4-mixtures, stage 3, bench (3D On).** Four tanks (A He 0.400 mol, B Ne 0.400 mol, C N2 2.40 mol, D CO2 0.800 mol) are small, standing at the right with tiny labels; the common tank at the left has a large empty black panel below it and a very wide empty plate. After dragging all four in (this time the drags worked) they pile on top of each other over the Common tank's readout, hiding PRESSURE and VOLUME ("0 k", "99.", "27"), so the total pressure the answer needs cannot be read; I worked it out from earlier readings (10 kPa per 0.4 mol). Line the open tanks up beside the common tank (not over it) and show the total pressure in large type.

**q4-mixtures, stage 3, floating squares.** Three grey squares floated over the bench in one screenshot (left edge, top right, bottom middle). They look like leftover drag markers. Remove.

**q4-mixtures, stage 3, miss message.** For 100: "Nitrogen makes less pressure than that." "makes" is odd; say "Nitrogen is only part of the gas: 100 kPa is the pressure of all four gases together."

**q4-mixtures, stage 3, reward.** "Mole Fraction. Nitrogen is 2.4 of the 4.0 mol, a mole fraction of 0.60, so it makes 60 kPa of the 100 kPa." Good; "it makes" again.

**q4-mixtures, stage 4, prompt.** "Put the four tanks in order from lowest pressure on the left to highest on the right, at the same volume and temperature." Good direction (low to high, as the owner asked). Needs grams / molar mass = moles, which the student must work out four times; there is no calculator button on the bench.

**q4-mixtures, stage 4, tour.** One step: "Drag a tank onto a pan, slot, or tray." Wrong for a strip; pointer on Tank A only. Say "Drag the tanks along the strip to order them" and point at the strip.

**q4-mixtures, stage 4, bench.** Tanks stand on the strip with labels overlapping each other; after one move, Tank D and Tank B overlap and the strip's end labels "Lowest pressure" and "Highest pressure" are hidden behind the tanks (only "Lowest pre..." shows). Tank info labels (TANK C, 6.00 g) overlap neighbouring tanks (C under A). The strip itself is a faint line. Space the four tanks evenly (at least a tank's width apart) and put the end labels above the strip. The Molar masses card (He 4, N2 28, CO2 44, Xe 131 g/mol) at left is clear and well placed. A grey square floats at the top (270,85).

**q4-mixtures, stage 4, miss message.** "Two adjacent tanks on the rail are in the wrong order." "rail" vs "strip" (the bench says "strip"); and it doesn't say which two. Highlight the pair.

**q4-mixtures, stage 4, reward.** "Moles, Not Mass. The tank with the most moles has the highest pressure, even though it does not hold the most grams." Good.

**q4-mixtures, stage 5, prompt.** "What is the partial pressure of the gas alone in the jar at 10 L?" Answer "Gas alone ___ mmHg". "Jar", "10 L", "gas alone" are not introduced; the bench is a cylinder labelled "Jar over water - H2O = 24 mmHg".

**q4-mixtures, stage 5, tour.** Step 1 (Vess): "A gas collected over water is mixed with water vapour (24 mmHg at 25 C; 760 mmHg = 1 atm)." Brings in mmHg and water vapour with no lead-in; the sentence does not say what to do with the 24 (subtract it). It is also the only place the student learns mmHg exists. Step 2 is the generic "Drag the dials to move the piston, heat the gas, or add gas." again.

**q4-mixtures, stage 5, bench.** Cylinder reads 752 mmHg, 25 C, 10.0 L; the dials are not needed (the answer is 752 - 24). The "jar over water" is drawn as the usual cylinder; show a jar upside down in a water trough or at least water. Cylinder small on a large plate.

**q4-mixtures, stage 5, miss message.** For 752: "The gas alone has less pressure than that." Doesn't say why; say "752 mmHg includes the water vapour".

**q4-mixtures, stage 5, reward.** "Gas Over Water. The total, 752 mmHg, is the gas plus 24 mmHg of water vapour, so the gas alone is 728 mmHg." Good.

**q4-mixtures, debrief (Vess, 4 slides).** Slide 1: "Every gas in a tank pushes as if it were alone, and the gauge adds the pushes up. Each gas's share of the push is its share of the particles." "pushes", "push", "gauge" (all banned by the owner), and "share of the particles" (should be "share of the moles"). Slide 2: "The moles, not the weight, decide who pushes hardest. Splitting a tank's push gas by gas is how a crew sees what has been added to it." "pushes hardest", "push" again. Slide 3: "The station's air is a mixture, and so is the fuel in its lines, so whatever the Fifth added will show up as a push of its own." Story aside about "the Fifth" and "fuel lines" the student has not seen; "a push of its own" is not chemistry. Case Pin: "Each gas adds its own partial pressure, and together they make the total." Good; but it does not answer the card's question "how much of the reading is the new gas?" directly: add "so the new gas's share is its mole fraction times the total".

**q4-mixtures, whole quest.** (1) Stage 1 predict and stage 2 ask the same thing. (2) Stage 2's bench passes without opening both tanks. (3) In 3D On the tanks are hard to grab when stacked (stage 2), and piles hide the common tank's readout (stage 3); lay the open tanks beside the common tank. (4) Stage 5 (gas over water) is a new topic and could be an optional side stage. (5) Banned words "pushes/gauge/makes" still throughout.

## q5-speed (Speed and Escape)


**q5-speed, question card.** "Gas is hissing out of the damaged vent, and nobody can see it. Which gas is leaking?" The stages rank four chambers by how fast they empty; the card promises to identify a leaking gas, which only happens at the end, if at all (not checked, see header).

**q5-speed, stage 1 (predict), prompt.** "A helium chamber and a nitrogen chamber each have a tiny hole in the wall: which one runs out of gas first?" Cards "The helium chamber", "The nitrogen chamber", "Both together". "Both together" is not a possible answer (they are separate chambers); replace with "They empty at the same time". No picture of the chambers on the bench; TOUR does nothing on this predict stage.

**q5-speed, stage 2, prompt.** "Rank the four chambers on the rail from earliest to empty to latest to empty." "Rail" and "chips" are made-up (the bench says "Empties first / Empties last" and "rank the chips"); say "Put the chambers in order, the one that empties first on the left." Chips are labelled only "CHAMBER A/B/C/D"; the gases (N2, H2, CO2, He) are on the chambers below. Put the gas on the chip.

**q5-speed, stage 2, tour.** One step on the pinhole panel: "Gas leaks through the pinhole; turn "Stopwatch" to advance time." Good, short, shows where to look. Does not mention the chips.

**q5-speed, stage 2, bench.** Stopwatch dial (2 s, 4 s) drags smoothly in 3D On; the particles visibly drain, and "LEFT 48 % / 6 % / 55 % / 14 %" appears under each chamber after a moment. Good. But: the readouts show "-" at 0 s and only fill in after the dial moves. Chips on the rail overlap when moved (Chamber B over Chamber D), and the dial knob sits on the panel's top edge with no tick labels. The chips lie on a rail above the panel and far from the dial: put the rail below the chambers.

**q5-speed, stage 2, miss message.** "Two adjacent chambers on the rail are in the wrong order." Does not say which pair; highlight them.

**q5-speed, stage 2, reward.** "Effusion. Gas escaping through a pinhole into a vacuum undergoes effusion. Lighter gas molecules have higher average speeds at a given temperature, reaching the hole more frequently and effusing faster." "undergoes effusion" is a definition by repetition; "effusing faster" repeats. Say: "Gas leaking through a tiny hole is called effusion. The lighter the gas, the faster it leaks." Text only.

**q5-speed, stage 3, prompt.** "Set the reference gas so its effusion rate matches the unknown sample." "effusion rate" is only defined in the reward of stage 2; "unknown sample" is named "STACK LEAK" on the bench. Say: "Find the gas that leaks out as fast as the sample from the stack."

**q5-speed, stage 3, tour.** One step: "Gas leaks through the pinhole; turn "Stopwatch" to advance time." The bench has two dials (Stopwatch and Gas) and the task is to turn the Gas dial; the tour never mentions the Gas dial or how to know a match. Highlight and explain both.

**q5-speed, stage 3, bench.** The Stopwatch and Gas dial knobs sit stacked at the left end of the panel (about 15 px apart), hard to tell apart; the Gas knob has no tick labels (neon, argon, krypton ...). "HALF EMPTY AFTER" shows 6.45 s for the sample from the start, and "-" for the reference until the stopwatch has run past half, so the student compares percentages at one time (63 percent vs 72 percent) which works but the panel never says that is the method. Show both half-empty times and let the student match 6.45 s; matching time is the number the bench already prints.

**q5-speed, stage 3, bench, floating squares.** Two grey squares float above and below the panel (top left and bottom left).

**q5-speed, stage 3, miss message.** Not seen (submitted the right gas, krypton, at 72 percent, on the first submit).

**q5-speed, stage 3, reward.** "Effusion Rate and Molar Mass. Gases with identical effusion rates at the same temperature have the same molar mass. Comparing an unknown gas to reference standards identifies its molar mass." Two new terms ("effusion rate", "molar mass") and the sentence is a definition by repetition; the owner's rule says rewards never introduce new concepts. Say what was seen: "The sample leaked as fast as krypton, so it is as heavy as krypton (84 g/mol)."

**q5-speed, stage 4 (predict), prompt.** "Ammonia (NH3, 17 g/mol) and hydrogen chloride (HCl, 36.5 g/mol) enter opposite ends of a tube: where do they meet?" Cards "Nearer the ammonia end", "Halfway", "Nearer the hydrogen chloride end". Good predict stage, sits directly before its test. "g/mol" appears again without a gloss. TOUR does nothing on this stage.

**q5-speed, stage 5, prompt.** "Run the stopwatch until the gases meet and place the card for where the ring formed." The student already chose a card in stage 4; this stage shows the same three cards again, with the tube text "PLACE PREDICTION FIRST", so the student predicts twice. After the stopwatch and Check the answer card is the same slot ("Prediction"). Make the stage 4 prediction carry over and have this stage only ask the student to read the ring (e.g. "Nearer which end did the ring form?").

**q5-speed, stage 5, tour.** One step on the tube: "Turn "Stopwatch" to watch the two gases creep along the tube. Press "Check" to record." Good, short. Does not say what the ring is; the tube text "NO RING YET" appears only after a card is placed.

**q5-speed, stage 5, bench.** The panel prints "RING AT 59 cm" with a white ring in a green/orange bar, but not the tube length, so "59 cm" cannot be placed (halfway of what?). Print "59 cm of 100 cm". The Stopwatch knob (60 s) and Check button are tiny in the panel's corners. Floating grey squares again (three at the top). Cards drop partly over the slot.

**q5-speed, stage 5, reward.** "Diffusion. Gases disperse through other gases by diffusion. Frequent collisions slow net movement, but lighter particles travel faster on average, so the ring forms closer to the heavier gas." Defines diffusion by repeating it; also contrasts with effusion (stage 3 reward) without saying how they differ. Say: "The lighter ammonia travels faster, so the two gases meet closer to the heavier HCl end."

**q5-speed, stage 6, prompt.** "Type the mass of one mole of the unknown gas." Answer "Molar mass ___ g/mol". The bench shows reference helium 4 g/mol half empty after 1.41 s and the unknown after 2.82 s, so the answer needs "time goes as the square root of the mass" (2 times the time means 4 times the mass). That rule is stated only in this stage's reward ("Graham's law"), so a student who has not seen it cannot solve the stage except by trying numbers. Either give the square-root rule in the tour (as a worked example with different numbers) or let the student find it by turning the Gas dial until a reference matches the unknown (as in stage 3).

**q5-speed, stage 6, tour.** One step on the pinhole panel: "Gas leaks through the pinhole; turn "Stopwatch" to advance time." The same line as stages 2 and 3, though the task is different. It does not mention the "Gas" dial (it carries the reference gas, "Gas helium, 4 g/mol").

**q5-speed, stage 6, bench.** Reference and unknown chambers with LEFT and HALF EMPTY AFTER readings (1.41 s and 2.82 s) are clear and readable at this size. Two dial knobs stacked at the top left (Stopwatch and Gas) again; they overlap.

**q5-speed, stage 6, miss message.** For 8: "The unknown gas has a larger figure than that." "figure" is vague; say "8 g/mol would leak faster than helium's 1.41 s half time scaled by the square root: try a larger number".

**q5-speed, stage 6, reward.** "Graham's Law. The half-empty time scales as the square root of molar mass (Graham's law), so twice the time means four times the mass: 4 x 4 = 16 g/mol, methane." Good worked statement but it comes after the stage that needed it.

**q5-speed, stage 7, prompt.** "Put the four speed snapshots in order from the lightest particles to the heaviest, all taken at 300 K." The same stage as q1-knocks stage 6 (sort four speed snapshots on a strip), now with mass in place of temperature. Merge with that idea or turn this one into a different task (match each snapshot to a named gas).

**q5-speed, stage 7, tour.** One step on the helium cylinder: "Drag the dials to move the piston, heat the gas, or add gas." The bench has no dials at all (a fixed "Helium at 300 K" reference with its speed bars). Replace with "The tall bars are helium's speeds at 300 K; compare each snapshot's shape with it."

**q5-speed, stage 7, bench.** Snapshot cards are small and dark ("0 to 2400 m/s" unreadable). Moving a card onto the strip stacks it on its neighbour (B on D), so the strip showed only three cards and the stage said "Put all four snapshots on the strip." until I dragged the covered one out. Cards overlap on the strip once dropped. Space the four slots so each card has its own place; add drop markers.

**q5-speed, stage 7, miss messages.** "Two neighbouring snapshots on the strip are the wrong way round." (does not say which) and "Put all four snapshots on the strip." (see the stacking problem above).

**q5-speed, stage 7, reward.** "Mass and Speed. At one temperature every gas has the same average kinetic energy, so heavier particles move more slowly. Their curve is taller and narrower at lower speeds, while a light gas spreads wider toward high speeds." Fine content; repeats q1-knocks stages 6 and 7's ideas.

**q5-speed, debrief (Vess, 4 slides).** Slide 1: "The lighter the gas, the faster its particles go, so the sooner it leaks through a hole and the further it spreads in the same time." Good. Slide 2: "The leak at the vent stack emptied at the same pace as krypton, and a leak that matches a known gas has the same kind of particle." Overgeneralises: matching a leak rate shows the same molar mass, not the same kind of particle (another gas of 84 g/mol would match). Slide 3: "Graham's law connects effusion and diffusion rates inversely to the square root of molar mass." Jargon in one line ("effusion and diffusion", "inversely", "square root"); show the 2 times the time = 4 times the mass example from stage 6 instead. Case Pin: "The vent is leaking krypton, a heavy gas." Good, answers the question.

**q5-speed, whole quest.** (1) Seven stages is the longest of the four so far; stages 1/4 are predicts that sit right before their tests, good. (2) Stage 6 needs the square-root relation before it is taught (reward only). (3) Effusion (pinhole) and diffusion (tube) are both taught without saying how they differ; add one line. (4) Stage 7 repeats q1 stage 6. (5) Dial knobs stacked top-left in every pinhole bench; make the Stopwatch and Gas dials separate rows with labels. (6) The vent-leak story is closed by the pin but the benches never mention a vent; add a krypton/vent picture in stage 3 (the unknown is called "STACK LEAK").

## q6-real (Real Gases)


**q6-real, question card.** "The Fifth packed one tank far past its limit. Do the usual gas rules still hold inside it?" "The Fifth" again with no introduction on this path; "past its limit" is vague. Say "A tank was squeezed to a tiny volume. Does the ideal gas law still give the right pressure?"

**q6-real, stage 1 (predict), prompt.** "Helium compressed to a hundredth of its volume should have a hundred times the pressure by the gas law: what does a real sensor read?" Cards "Less than the gas law says", "Exactly what the gas law says", "More than the gas law says". Fine; "real sensor" unexplained. TOUR does nothing here.

**q6-real, stage 2, prompt.** "Compress the helium fully and place the card for how the pressure compares with the gas law." "Fully" is not defined: the Piston dial goes to 0.1 L, then 0.06 L; at 0.1 L the stage said "Compress the cylinder to minimum volume first." and 0.06 L is the minimum. Show the minimum setting (a lock mark) or say "to 0.06 L".

**q6-real, stage 2, tour.** One step on the cylinder: "Drag the dials to move the piston, heat the gas, or add gas." (generic again; one Piston dial only). The tour demo drags the piston to 0.2 L and the stage resets to 24.6 L when it closes.

**q6-real, stage 2, bench, BLOCKING-ish.** PRESSURE and IDEAL LAW readings show "-" until a card is placed and Submit is pressed, so the student has no evidence to choose a card with (the whole point of the stage); the readings (67927 kPa vs 41570 kPa at 0.06 L) appear only after a submit, and then the stage says "The measured pressure is not on that side of the gas law value." for a wrong card. Show both pressure readings live as the piston moves, so the student sees the gap open; keep the prediction stage as the guess. Also the Piston dial knob sits on the cylinder's top edge with no ticks.

**q6-real, stage 2, miss messages.** "Compress the cylinder to minimum volume first." (fine) and "The measured pressure is not on that side of the gas law value." "side of" is vague; say "The sensor read 67927 kPa, higher than the gas law's 41570 kPa."

**q6-real, stage 2, reward.** "Molecular Volume. At high pressures, helium exerts more pressure than the gas law predicts. Gas particles occupy finite volume themselves, leaving less empty space to move in." Good; "exerts" and "finite" are fine but "Molecular Volume" as a title is a term not met before.

**q6-real, stage 3, prompt.** "Why does cold CO2 at 250 K read lower than the gas law predicts?" Cards "Attractions between particles lower pressure", "Particle volume raises pressure", "Neither effect changes pressure". The first card names the answer's idea (attractions) that no bench in this quest has shown; the bench's only evidence is "3065 kPa" vs "4157 kPa" at 250 K and (after turning the dial) "14887 kPa" vs "14965 kPa" at 800 K. A student with no idea of attractions between particles can only pick the other two by elimination. Add a picture of particles pulling on each other (or an earlier stage showing them) before asking "why".

**q6-real, stage 3, tour.** One step "Drag the dials to move the piston, heat the gas, or add gas." The stage's instruction ("Turn the Heater dial to compare 250 K with a warmer setting.") only appears as a miss message after placing a card, so a student can submit without ever turning the dial and be told off. Put it in the prompt: "Turn up the Heater and compare the two pressures".

**q6-real, stage 3, bench.** After I closed the tour the camera view moved and the Heater knob became ungrabbable (three drags panned the camera instead); after a reload the default view let the same drag work. Dial knob is small and sits on the cylinder's rim again. Cards drop half over the slot; stray grey square floats near the top.

**q6-real, stage 3, miss message.** For "Particle volume raises pressure": "Turn the Heater dial to compare 250 K with a warmer setting." This is a prompt for evidence, not a reason; good as a nudge, but it should appear before the submit (see tour note).

**q6-real, stage 3, reward.** "Ideal Gas and Real Gas. A gas that always obeys the gas law is an ideal gas, whereas a real gas deviates. Cold attractions lower pressure and small-volume particle size raises it, canceling near 900 K." Too much: ideal vs real, two effects and a new number (900 K) in 40 words, and the bench showed 800 K (14887 vs 14965) not 900 K. Cut to one idea: "At 250 K the particles pull on each other, so the pressure is lower than the gas law says. At 800 K the pull no longer matters."

**q6-real, stage 4, prompt.** "Rank the three cold gases on the rail from the one closest to the gas law to the one furthest from it." Chips on the rail read "Smallest deviation ... Largest deviation" (good wording; the prompt's "rail", "closest to the gas law" are not). Bench text "Turn the Heater dial, then arrange the chips on the rail." The hint to turn the heater is wrong for this stage (the gases are meant to be compared cold).

**q6-real, stage 4, tour.** One step with the highlight round the three stacked cylinders: "Drag the dials to move the piston, heat the gas, or add gas." (generic).

**q6-real, stage 4, bench, BLOCKING-ish.** The three cylinders (A, B ammonia, C helium) are stacked so close that their labels run over each other ("Cylinder A", "Cylinder B NH3", "Cylinder C He" overlap the readouts "PRESSURE", "IDEAL LAW"). Only Cylinder C's "DIFFERENCE +1 %" is readable; A's and B's difference rows are hidden under the next cylinder. I could not read the evidence and got the order by guessing helium first, then trying A before B (one miss: "Two adjacent cylinders on the rail are in the wrong order."). Space the three cylinders apart with their readouts beside them. The chips say "Cylinder A/B/C" only (gas is on the cylinder); put the gas on the chip.

**q6-real, stage 4, HUD.** An unexplained badge "COLD DRAW-OFF 4 M" sits at the top left of the bench. It is not mentioned anywhere (a timer? an objective?). Explain or remove.

**q6-real, stage 4, reward.** "Intermolecular Attractions. Stronger attractions between particles cause cold gases to fall further below ideal gas law predictions: helium least, nitrogen more, and ammonia most. These same attractive forces allow gases to condense into liquids." Three ideas in 45 words and "intermolecular" is never defined. Keep: "Helium is closest, ammonia furthest: the stronger the pull between particles, the lower the pressure".

**q6-real, debrief (Vess, 4 slides).** Slide 1: "A real gas reads above the gas law where its particles crowd, because they take up room." "room" again (banned). Slide 2: "It reads below it where they cling, because they pull on each other, and that same pull is what turns a gas into a liquid." "cling" is anthropomorphic; and "that same pull turns a gas into a liquid" is a new idea (condensation) first appearing in a debrief. Slide 3: "So a gas is closest to ideal when it is thin and warm, and every pressure vessel on the cloud deck is designed knowing exactly where the gas law stops being true." Story aside, and "thin" (low pressure) is not a word the bench used. Case Pin: "No. Packed that tight, the particles crowd each other and the ideal gas law fails." The pin only gives the high-pressure half; add "and cold gas reads low".

**q6-real, whole quest.** (1) Only four stages, and the middle two (2 and 3) hide their evidence until a card is submitted (stage 2) or have an unreachable dial (stage 3). (2) The quest names two effects (volume, attractions) without a stage that isolates each: a stage that compresses at high temperature (volume effect only) and one that cools at low pressure (attraction only) would show them. (3) The van der Waals equation is not mentioned at all; fine for beginners but the world plan lists it. (4) "The Fifth" and "cloud deck" asides in the card and debrief.

## boss-compressor (The Compressor)


**boss-compressor, question card.** "The Fifth's sealed tank has stayed hot for 12 days in freezing air. What could keep it hot that long?" Good link to q2 (the tank in freezing wind). The bench asks something else (set a piston and heater), so the question and the bench never meet in phase 1.

**boss-compressor, HUD.** Boss bar "THE COMPRESSOR, PHASE 1 OF 5, 1000 / 1000" top right; a line "THE COMPRESSOR   MISSED TRIAL" / "DISPERSED" with a box row and "The compressor cycles at a steady stroke over its intake." Good wording ("missed trial", "dispersed"). The line "Trial missed: the cylinder compression cycle does not match the target." is jargon ("cylinder compression cycle"), say "The pressure is not six times the plaque's."

**boss-compressor, phase 1, prompt.** "Set the piston and heater so the pressure will be six times the figure on the plaque." "figure" and "plaque": the bench has a panel reading "The pressure began at 125 kPa" (no plaque). Say: "Set the piston and heater so the pressure is six times the starting pressure, 125 kPa."

**boss-compressor, phase 1, tour.** 2 steps. Step 1 (Vess): "Apply the gas relationships from each bench to stabilize the compressor and clear the fault." Vague and the first time "fault" appears. Step 2 is the generic "Drag the dials to move the piston, heat the gas, or add gas." with the cylinder highlighted; says nothing about the plaque panel or that the pressure is not shown.

**boss-compressor, phase 1, bench, BLOCKING-ish.** The cylinder shows only VOLUME and TEMPERATURE; no PRESSURE reading anywhere, so the student cannot see the effect of the dials and must calculate (125 x 20/5 x 450/300). That may be intended for a boss; say so in the prompt ("work it out, then set the dials"). The Piston and Heater knobs are two tiny orange dots at different places along the cylinder with no labels or ticks (Piston knob rides the top-right of the cylinder, Heater knob below the label); my drags from the first two attempts moved the wrong dial or nothing. Drawn dial tracks with ticks needed, as in q1.

**boss-compressor, phase 1, miss message.** Submit with 20 L and 77 C: "With these settings the pressure will be less than six times the figure." Good (says which way); the full-screen boss reaction scene (a robot with a gauge, red flash) appears for about 3 seconds before the bench comes back; it hides the miss message until it ends.

**boss-compressor, phase 1, reward.** "Combined Gas Law. Pressure rises as volume shrinks and as kelvin temperature rises, and the two factors multiply: a quarter of the volume gives 4 times the pressure, and 450 K against 300 K gives another 1.5, so 6 times." Good worked example (and shows q2 stage 6 was needed). The values (5 L, 177 C) are a spoiler for later reruns but fine.

**boss-compressor, phase 2, prompt.** "Open tanks into the common tank until nitrogen's partial pressure is 75 kPa and total pressure is 125 kPa." Good and clear. The line under it reads "The compressor keeps its blending tanks shut."

**boss-compressor, phase 2, bench, BLOCKING-ish.** The instruction "Drag tanks into or out of the tray" names the tray, but the picture shows a big lower panel with a faint "Valves open into the tank" caption and a smaller oval "common tank" above it. Dropping tanks onto the oval (where the picture of the tank is) does nothing: the common tank stayed at "0 kPa" and the bench said "Open a tank into the common tank first." I had to drag them into the lower panel. Make the oval the target or label the lower panel as the tray ("Drop tanks here to open them"). Same for q4-mixtures stages 2 and 3.

**boss-compressor, phase 2, bench.** Once opened, live readings appear: PRESSURE 125 kPa, N2 74.8 kPa 60 %, He 49.9 kPa 40 % (good). But "EACH GAS PUSHES SHARE" is printed on the panel ("pushes" is banned), tank labels (TANK A / TANK B / TANK C) overlap one another, and Tank D (argon) stands alone at the far right. The stale message "Open a tank into the common tank first." stayed on screen after the tanks were open.

**boss-compressor, phase 2, reward.** "Partial Pressures. Each gas adds pressure in proportion to its moles. Nitrogen's 3.0 mol of the 5.0 mol in the tank is a mole fraction of 0.6, giving 75 kPa of the 125 kPa total pressure." Good. The line above now reads "FLAWLESS" (no explanation of what flawless means; I did not make a mistake on this phase except the earlier misdrop, so it counts only submits).

**boss-compressor, phase 3, prompt.** "Type the mass of gas in the sealed tank." Sealed tank - helium (4.0 g/mol), 2.00 atm, 10 L, 27 C. The bench prints "R = 0.0821 L-atm per mol-K." which is exactly the help q3-ideal's stage 6 lacks (there it hid in a tour step). Good here. "Mass of gas ___ g" is clear.

**boss-compressor, phase 3, miss message.** For 0.81 (the moles): "The tank holds more gas than that." Good direction, but it does not say the answer is in grams, not moles: say "0.81 is moles; the answer is in grams."

**boss-compressor, phase 3, reward.** "Mass From the Gas Law. n = PV / RT = (2.0 x 10) / (0.0821 x 300) = 0.81 mol, and 0.81 mol x 4.0 g/mol is about 3.2 g. The temperature goes in as 300 K, not 27." Good. This phase repeats q3-ideal stages 4 to 6 in one step.

**boss-compressor, phase 4, prompt.** "Why cold NH3, at 300 K read lower than the gas law predicts?" Stray comma after "NH3". Same three cards as q6-real stage 3 ("Attractions between particles lower pressure", "Particle volume raises pressure", "Neither effect changes pressure"), same hidden step (the stage only accepts the card after the Heater dial has been turned to a warmer setting, announced only by the miss message "Turn the Heater dial to compare 300 K with a warmer setting."). A boss phase should test something new; this is q6 stage 3 again with ammonia. Use a different question, for example rank two gases by attraction strength.

**boss-compressor, phase 4, reward.** "Real Gas Crossing. Cold ammonia reads below the gas law because attractions between particles lower pressure; very hot, particle volume raises it. Near 1200 K the two effects cancel." q6's reward said "canceling near 900 K" for CO2; different gas, but two numbers with no explanation will look like an error to a student. "Real Gas Crossing" is a made-up title.

**boss-compressor, phase 5, prompt.** "Set the reference gas so its effusion rate matches the unmarked seal." Unmarked seal = "SEAL B". The bench prints REFERENCE half-empty 3.16 s (neon) and SEAL B 8.07 s from the start; turning the Gas dial to xenon gives 8.07 s. A direct number match, so no reasoning is needed; q5 stage 3 asked the same thing with percentages (63 vs 72). Use a version that needs the square-root rule from q5 stage 6 (for example give the seal's time only and ask for its molar mass).

**boss-compressor, phase 5, tour.** (not opened for phases 3 to 5; the tour for phase 1 only had two steps)

**boss-compressor, phase 5, reward.** "Effusion Match. Gases with equal effusion rates share identical molar masses. The leak rate matches xenon, identifying the escaping gas." Good, short.

**boss-compressor, debrief (Vess, 4 slides).** Slide 1 shows a labelled blueprint ("a heater", "a piston", "a count", "a blend", "a pinhole") with the line "With every gas tank balanced and vented, the Compressor finally shut down." ("a count" and "a blend" are not names of anything the student used; label them "a tank counter" or drop.) Slide 2: "Inside its vault sits a sealed cylinder that held steady pressure for twelve days while the air outside stayed freezing." Slide 3: "Gay-Lussac's law proves a sealed gas would lose pressure in the cold unless something inside keeps making heat. We logged the cylinder in the Case File." "proves" overstates ("shows"); "Case File" is the screen name, fine. Case Pin: "No ordinary gas stays hot 12 days in freezing air. Something inside makes heat." Resolves the quest's question and ties back to q2. Good.

**boss-compressor, in general.** (1) The fight is a quiz of the six quests but only phases 1 and 2 are new; phases 3, 4, 5 repeat q3 stages 4 to 6, q6 stage 3 and q5 stage 3. (2) The Vess line before each phase ("The compressor cycles at a steady stroke over its intake.", "keeps its blending tanks shut", "seals the tank and locks its dial", "compresses a cold cylinder of ammonia", "A pinhole hisses in the compressor's flank, and nothing says what is leaving it.") is good story text and short. (3) The boss bar drops 1000, 800, 600, 400, 200 (each phase 200), consistent. (4) The full-screen robot scene on a missed trial covers the bench for about 3 seconds each time; a student retrying a stage with a calculation loses 3 seconds per miss; shorten or allow skipping.

## In general, Bellows


**Bellows, owner's earlier notes (docs/feedback-11-01.md, Bellows section), still open or fixed?** (a) Stage with "plot values" instead of a slider: q1 stage 3 still has the Record/graph/straightedge flow (still). (b) Dial with only 200 and 400 K: q1 stage 7's Heater now has five steps (200, 250, 300, 350, 400) and q2 stage 2's dial stops at 400 K while the answer is 586 K (still). (c) "room" instead of volume: the word "room" is still in the q1, q2 and q3 debriefs and q1/q2 hints (still). (d) Straightedge gives no y-intercept and the line is thick: q1 stage 3 now shows "Slope = 0.83 | b = 221.1" but the label is tiny and on top of the line (partly fixed). (e) Heater dial colder to the right: not seen (fixed). (f) Introduce kelvin first: still after the stage that needs it (q1 stage 3 reward). (g) Mention the ideal gas law before the stage that needs it: it is stated in q3 stage 3's reward, before stage 4 (fixed). (h) Banned words "gauge", "room", "push" in every stage: still in the question cards, debriefs and one bench ("EACH GAS PUSHES"). (i) Sort from lowest on the left: q4 stage 4 and q1 stage 6 now do (fixed).

**Bellows, dials.** In 3D On the dial knobs in most rigs are 5 px orange dots riding the cylinder's rim with no visible track or tick labels; whether a drag grabs the knob or pans the camera is close to chance. Failed grabs: q1 stage 4 (Piston, five tries, blocking), q2 stage 2 (two tries), q3 stage 2 (four tries), q6 stage 3 (three tries). Give every dial a visible track with labelled ticks above the rig, and make a miss never pan the camera.

**Bellows, tank benches (q3 stage 5, q4, boss phase 2).** Tanks stack on top of each other, their labels overlap the instruction text and the readouts, and the drop target is the lower "Valves open into the tank" panel, not the picture of the common tank. Two benches (q4 stage 2, q4 stage 3) hid the common tank's pressure behind the pile. Lay the tanks out in a row and label the drop panel "Drop tanks here".

**Bellows, hidden readings.** Several stages hide the number the student needs until after a submit: q1 stage 7 (Cylinder B's KINETIC ENERGY), q3 stage 2 (B's VOLUME), q6 stage 2 (PRESSURE and IDEAL LAW), q4 stage 2 (common tank pressure shows 0). A student cannot solve from evidence, only guess. Show the readings live.

**Bellows, tours.** Almost every tour on a cylinder bench is the same line, "Drag the dials to move the piston, heat the gas, or add gas." (16 benches), highlighting the cylinder even where it has one dial or none. Replace with one specific step per bench naming the dial the stage uses, and drop the tour on benches whose only action is typing. The tour on every predict stage does nothing (q2 stages 1 and 4, q3 stage 1, q4 stage 1, q5 stages 1 and 4, q6 stage 1; q1 stage 1 has one step).

**Bellows, predict stages.** Every predict bench is only cards on a table; show a picture of the thing being predicted (the tank, the piston, the pinhole).

**Bellows, cards and strips.** Dropped cards and chips land half over their slot or on top of each other, and the end labels of strips ("Lowest pressure", "Highest pressure") are hidden under the pieces (q1 stage 6, q4 stage 4, q5 stages 2 and 7). Snap pieces into evenly spaced places.

**Bellows, stray grey squares.** Small grey squares float over the bench after a drag in q1 stages 2, 4, 5, 6; q2 stage 1; q3 stage 3; q4 stages 3, 4; q5 stages 3, 5 and q6 stage 3. They look like leftover drag markers. Remove.

**Bellows, story.** "The Fifth", "fuel line", "vent stack", "cloud deck", "holder" are used in question cards and debriefs of q4, q6 and the boss with no setup on the bench. Case Pins are good (q1 to q6 and the boss each answer the card's question). Only q1 and q2 ask what the card asked in their first stage.

**Bellows, rewards.** Every stage's reward is one line of text at the bottom of the bench; none is an animation. The owner's rule (one idea, mechanism shown) is not met anywhere in this world: for example Boyle's law (q1 stage 4), Charles's law (q2 stage 2), partial pressure (q4 stage 2), Graham's law (q5 stage 6) deserve a short animation of the particles. Several rewards also introduce new terms (effusion rate, molar mass, intermolecular attractions, Real Gas Crossing).

**Bellows, repeats.** q1 stages 4 and 5 (Boyle twice), q2 stages 2 and 3 (Charles twice), q2 stages 4 and 5 (same question), q3 stages 4 and 6 (same calculation), q1 stage 6 and q5 stage 7 (sort speed snapshots), q6 stage 3 and boss phase 4 (same cards), q5 stage 3 and boss phase 5 (match a reference gas). About a fifth of the 40 stages repeat an earlier one.

**Bellows, jump from the world.** I opened every bench by URL (`#/learn/unit04/<quest>`) with all quests marked complete, as the skill allows; I did not walk the world or see any opening scene, so the "question has something to see" scenes are not checked.
