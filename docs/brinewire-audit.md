# Brinewire audit

Merged from the per-builder audit files (kept under `docs/archive/2026-11-05/brinewire/`). Evidence labels: **Played** (real pointer gestures), **Viewed**, **Scripted** (`verify:learn`, `verify:table`), **Bench** (`verify:bench` pointer paths), **Code**. Only `q4-potential` stages 1 and 5 were played by hand (3D Off; stage 1 also viewed at 3D On); no other stage was played, nothing was seen at 375 px, and the world was seen only through the q4 host.

## Defects found by the integrator after the builders

- `q2-activity` stage 2 listed beakers, strips and cards in the answer's order: reordered (checks updated).
- `celldata.displaces` treated a 12 mV gap (Sn, Pb) as a clean coating: it now needs a 0.05 V gap; the boss uses Fe, Ni, Sn, Ag instead.
- `q2` strips were 25 px across at phone landscape (`verify:bench`): kind radius raised, column step widened.
- Lead lines in the spec were two sentences; `verify:learn` allows one: every builder rewrote them.
- `verify:story`: `unit02/q10-wavefunctions` has no story animation: pre-existing, not Brinewire's.


---

# Brinewire q1-halves: per-stage audit

Evidence labels: `Code` (read in the source), `Scripted` (replayed by `verify:table` / `verify:learn` / the checks file by script, drag and two taps). Nothing here was `Bench` or `Played`: no browser was used.

| Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP topic | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Before and After | Card to seat to tray, with a two-tap twin; probe keeps a strip | The two columns sit under "Before" and "After", matching the windows | 4 cards read and sorted: light | Yes: the number moves for two atoms and not for the sulfate | Numbers from `oxNumber`; windows counted from `matchElectrons`; sulfate drawn as a spectator | 4.9.A.2 | Scripted |
| 2 Where They Go (predict) | Four cards, one slot, no instrument | The held models (free, gone) are offered | None | Commits a guess that stage 3 contrasts | n/a | 4.9.A.1 | Scripted |
| 3 Writing the Halves | Two electron dials per card; charge row | Charge row left against right | A few dial steps | Yes: 2 electrons on each card, as many as the zinc gave | `ledgerRows`; slips name the charge reading | 4.9.A.1 | Scripted |
| 4 Matching the Electrons | One multiplier dial per half; tally | Tally given against taken | A few dial steps | Yes: the halves scale to the lowest common electron count | `matchElectrons` (2 and 3); only that pair fits the 1 to 4 range | 4.9.A.1 | Scripted |
| 5 Who Gives (beyond the exam) | Probe, 4 cards, 2 slots | Numbers rise for the giver; windows show atoms becoming ions | Light | Yes, for the labelled-out-of-scope agent words | Windows from the planner; labelled beyond the exam in title and reward | not assessed (CED excludes it) | Scripted |
| 6 Permanganate in Acid | Six count dials; four rows | Row names the element or charge; refusal quotes the first row off | Dial steps are the build itself; up to 10 | Yes: oxygen with water, hydrogen with H⁺, charge with electrons | `balanceAcidHalf` checked against a Python nullspace; counts printed, never targets | 4.9 (balancing; acid) | Scripted |
| 7 Joining Two Halves | Two multiplier dials; tally | Same read as stage 4 | A few steps | Yes: 5 iron(II) to 1 permanganate, no electrons in the overall equation | `overall`; charge 17 on each side by hand | 4.9.A.1 | Scripted |
| 8 Four Sealed Reactions | Card to seat to tray, with a two-tap twin | Probe lists every element's two numbers | 4 cards read and sorted | Yes: precipitation and neutralisation move no number | `reactionStates` by hand for all four | 4.9.A.2 | Scripted |

Things to look at by hand are listed in `docs/plans/brinewire-notes-q1-halves.md`.


---

# Brinewire q2-activity audit (evidence labels: Code, Scripted, Bench; nothing was Played)

| Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP topic | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Coated or clean | Dip by drag or two taps, selector dial | Strips in beakers is a familiar picture | Up to six dips, none required | Counting coats per solution | Planner `displaces` | 4.9 redox, displacement | Scripted (drag, two taps), Code |
| 2 Rank four metals | Twelve possible dips, rail | Rank by how many solutions coated | Dips of a strip in its own solution add nothing | Builds the series from the player's own dips | Planner `activityOrder` | 4.9 | Scripted, Code |
| 3 Predict | Cards and slot | The held model is offered | None | Commits the guess | n/a | 4.9 | Scripted |
| 4 Copper in zinc | One dip, selector | Compare with the zinc-in-copper window | None | One-way exchange, tested against the guess | Planner | 4.9 | Scripted, Code |
| 5 Hydrogen in the list | Five acid beakers, rail of six | Bubbles are plain evidence | Five dips (one each) | Hydrogen as a member of the series | `givesHydrogen`; bubble rate not modelled | 4.9 | Scripted, Code |
| 6 Iron and a partner | Leave a Week, then cards to a tray | Blue spots are legended on the fixture | Low | Sacrificial protection from a measured nail | `protectsIron`; bare-nail rust not shown | 4.9 | Scripted, Code |
| 7 Sealed strip X | Four dips, one card on a rail | X is a new case of the same order | Low | A metal ranks between two others | Planner (nickel, E° between Fe and Pb) | 4.9 | Scripted, Code |
| 8 Take out the copper | Four mixed beakers, selector | Ions drawn as counted dots | Low | Choosing by the order, new case | Charge-for-charge swap counts | 4.9 | Scripted, Code |

Bench: nothing. Needs a hand: coating legibility at phone size, the five-beaker layout at 375 px, 3D dishes and strips.


---

## Brinewire audit: `q3-galvanic`

Evidence: Code, Scripted (`verify:table` and `verify:learn` replay solutions by script, drag, two taps), Bench (none: no browser). Nothing was Played; drawn tables were looked at as Node-rendered stills only.

| # | Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predict: wire alone | Cards and slot | Offers the held model (steady) | None | Commits a guess | n/a | 9.8 | Scripted |
| 2 | Keep it running | Seats, Run, plot | Plot key says what each run held | Few runs | A path for ions is needed | Fall to 0 at 3 s is simplified and said so | 9.8.A.1 | Scripted, Code |
| 3 | Which way electrons go | Run and a dial on each cell | Dial prints the needle convention | Three runs | Metals decide direction | 0.50, 1.23, 0.71 A | 9.8.A.1 | Scripted |
| 4 | Atoms leave, atoms join | Run, two cards | Counted windows | One run | Anode and cathode from counts | 8→10, 8→6 ions; 6→4, 6→8 atoms | 9.8.A.3 | Scripted |
| 5 | What the bridge carries | Run, dial | Bridge trails and counts | One run | Ions close the circuit | Balanced beakers (charge 0) | 9.8.A.1 | Scripted |
| 6 | Weighing the strips | Strips to pan, seats, Run | Balance list | Several drags | Mass follows atoms | 0.37 g lost, 0.42 g gained (1 h) | 9.8.A.1 | Scripted |
| 7 | Shorthand (beyond the exam) | Seven chips on a rail | Plaque gives the convention | Ordering | Notation | Labelled beyond the exam | none | Scripted |
| 8 | Sealed cell | Strips, Run, balance, card | Two independent evidences | Several drags | Transfer | Ni|Zn, Zn anode | 9.8.A.3 | Scripted |

Weak: stage 6 and 8 flows are long; strip seats unlabelled; 3D On unseen.


---

## Brinewire audit: `q4-potential` (the vertical slice)

Evidence labels: **Played** (real pointer gestures in the in-app browser at 3D Off, one pane of 800 × 600), **Viewed** (loaded and looked at), **Scripted** (`verify:table` and `verify:learn` replay the solution by script, by drag and by two taps), **Code** (read only). Nothing was seen at 3D On: Brinewire had no walkable world when the slice was played, and at 3D On the bench pane stays black until the world's host exists. Nothing was seen at 375 px.

| # | Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Against a Reference (rank four metals) | Electrode drag into the seat works with a real hand and the displaced electrode goes home; the rank cards landed on the rail by drag, and a two-tap on the rail inserted a card at an unexpected end (the rail's own rule) | The board reads at once; painted words are small in a small pane | Four seatings and a rank (mild) | The signed readings spread on one scale | E° values are CRC | 9.9.A.2 | Played (stage 1), Scripted |
| 2 | A Cell Nobody Wired (typed E°cell) | Typed field, two seatings | The strip keeps both readings | Subtraction only | Gap of two readings is the voltage | 3.17 V | 9.9.A.2 | Scripted (typed slips refused with a reading) |
| 3 | Which Cells Run (four cells, lamp) | Run key on each cell; the key overlapped the ion label (fixed by a taller fixture) | Lamp and signed meter | Four Run presses and four drags | A sign decides a cell | ±1.10, ±0.46, ±1.56 V | 9.9.A.1 | Viewed, Scripted |
| 4 | Twice Over (predict) | Cards and slot | Offers the held model (2.20 V) | None | Commits the guess | n/a | 9.9 | Scripted |
| 5 | Writing It Twice (run both settings) | The equation dial overlapped the voltmeter (fixed: content starts 11 units below a fixture with a dial); a Run pressed while the dial was still moving did not register (press again) | Two kept lines make the comparison | One dial turn | Volts per electron, energy per amount | 212 kJ, 425 kJ (424.5 rounds up), 1.10 V both | 9.9.A.3 | Played (Run, dial, Run), Scripted |
| 6 | The Energy Released (typed kJ) | Typed field | The board prints the half-reaction (n) and the plate gives F | Plug-and-chug flagged (see below) | Energy follows the electrons moved | 523 kJ | 9.9.A.3 | Scripted |
| 7 | How Far It Goes (typed log K) | Typed field | n is not printed: the balanced equation moves 2 (Zn + 2 Ag⁺) | Plate-and-type flagged | K from E° | 52.7 | 9.9.A.3 with 9.5 | Scripted |
| 8 | Two Sealed Metals (typed E°cell) | Typed field, two seatings | Metals named A and B | Subtraction only | A new pair, the same rule | 1.94 V | 9.9.A.2 | Scripted |

## Defects found in play and fixed

- The rig's Run key sat on the right beaker's ion label (fixed by making the cell 8 units taller).
- The equation dial's strip overlapped the voltmeter (fixed: `oy` offset for a scalable rig).
- The rank cards read "Magnesium" at about 6 px (fixed: symbols).
- A drag from a stale position cannot prove a drop (the browser tool's synthetic drag ends short; the cards eased onto the rail after the screenshot).

## Still weak (for the owner)

- Stages 6 and 7 are plate-and-type: the picture behind them is the board and the half-reaction text, not a drawing of the cell. The owner should judge whether they feel like understanding.
- Stage 5's energy counter prints a number that doubles; the kJ labels say "released", the reward introduces ΔG°.
- Painted text on the board and the rig is small at the default size of a small pane; whether it is large enough at 375 px landscape is unchecked.
- The bench at 3D On (a host in the marsh) is not yet seen.


---

## Brinewire audit: `q5-load` (Under Load)

Evidence labels: **Code** (read only), **Scripted** (`verify:table` and `verify:learn` replay the solution and a miss by script, by drag and by two taps), **Bench** (a script that paints a fixture in Node and reads the text it prints). Nothing was Played or Viewed: there was no browser. Nothing was seen at 3D On or at 375 px.

| # | Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Run Until It Stops (predict) | Four cards and a slot; no instrument | Offers the held model (a cell runs out) among four | None | Commits the guess before the test | n/a | 9.10 | Scripted |
| 2 | The Cell Runs Down (run, selector) | "Run" five times (8 ticks each); selector with a blank | Plot, voltmeter and dots all move together | Five presses (mild) | A dead cell is not an empty cell | 0.012 V to 0.000 V; 72 and 28 dots | 9.10.A.3 | Scripted, Bench |
| 3 | More Zinc Ions (dial, selector) | One dial, two "Run" presses, two kept lines | The log pairs strength and voltage | One dial turn | More product ion, lower voltage | 1.16 V at 0.010 M, 1.10 V at 1.0 M | 9.10.A.1 | Scripted, Bench |
| 4 | The Balance Point (typed ratio) | Typed field; cell already run to its end | Counts are printed under the windows | Division only | Ratio of the ions at a dead cell equals K | 72 ÷ 28 = 2.57; K = 2.545 | 9.10.A.3 | Scripted |
| 5 | Two Copper Beakers (selector) | One "Run", needle and meter, selector | The needle points at the bar the electrons go to | None | The dilute side gives the electrons | 0.059 V; leaves 0.010 M bar | 9.10.A.3 | Scripted, Bench |
| 6 | A Cell Nobody Wired (typed Nernst) | Typed field; cell unwired | Plate has E°, the equation-sheet form and Q in words | Plug-and-chug (flagged) | Q and its log set the shift from E° | 1.0113 V; slips 1.19, 0.92, 0.90, 1.10, no log | 9.10.A.4 | Scripted |
| 7 | Three Prepared Cells (rank) | Three Run keys, three cards on a rail | Voltages read directly | Three presses | Farther from balance, higher voltage | 1.16, 1.10, 1.04 V | 9.10.A.1 | Scripted |
| 8 | Sealed Beakers (selector) | One "Run", two meters, selector | Same cell as stage 5, new metal and side | None | Applies the dilute-side rule | 0.118 V (Ag, n = 1) | 9.10.A.3 | Scripted, Bench |

## Still weak (for the owner)

- Stage 6 is plate-and-type; the picture is two unwired beakers. Judge whether it feels like understanding.
- Stage 2 may feel slow if five presses read as ceremony; stage 4 is mounted already run to avoid repeating it.
- The plot's scale is fixed and tiny (0.012 V); the voltmeter prints three decimals.
- The Nernst plate prints "products ÷ reactants, ions only" in words; a student could still invert Q (refused with the two strengths).
- Not seen at 3D On or 375 px; the story scene `load-down` was only painted by `verify:story`.


---

## Brinewire audit: `q6-electrolysis`

Evidence labels: **Code** (read only), **Scripted** (`verify:table` replays each `SOLUTIONS`/`MISSES` entry by script, by drag and by two taps; `verify:learn` and `tools/lib/brinewire-q6-checks.mjs` check grading, slips and painted numbers). No stage was played in a browser; nothing was seen at 3D On or at 375 px.

| # | Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Pushing the Cell (zinc plates) | Two stepped dials, Run | Strip mass lines show lost/gained | Up to four runs | A supply beyond the cell's voltage reverses it | 4.07 mg gained, 6.10 mg lost | 9.7.A.1, 9.8.A.2 | Code, Scripted |
| 2 | Molten Salt (answer dial) | One dial, Run, answer dial | Product at each electrode is drawn | Two runs | Reduction where electrons are pushed in | Na and Cl₂ | 9.8.A.3 | Code, Scripted |
| 3 | How Much Passed (rank) | Run dial, three runs, rail | Balance lines per run | Three runs, three drags | Charge is current times time; current alone misleads | 33.5, 22.4, 55.9 mg | 9.11.A.1 | Code, Scripted |
| 4 | Plating Copper (typed) | Two dials, Run, field | Counter and half-reaction line | Plate-and-type (flagged) | Proportion to I and t, then moles | 1.19 g; slips refused by reading | 9.11.A.1 | Code, Scripted |
| 5 | Plating Silver (typed) | Same | One electron per ion | Plate-and-type (flagged) | n changes the answer | 2.01 g | 9.11.A.1 | Code, Scripted |
| 6 | Cells Driving Cells | Three drags, Run | Chain voltage live, tubes | Low | A favoured reaction drives an unfavoured one | 1.10 V each, 1.23 V back, no overpotential (stated) | 9.7.A.1 | Code, Scripted |
| 7 | Water and Brine | Run, four drags | Volumes and behaviour per tube | Four drags | Product depends on what is easier to change | 2:1 and 1:1 volumes; overpotential named | 9.8, 9.11 | Code, Scripted |
| 8 | The Sealed Plate (typed) | One drag, field | Balance prints only with the plate on | Plate-and-type (flagged) | Faraday's law backwards | 0.800 A | 9.11.A.1 | Code, Scripted |

## Still weak
- Stages 4, 5, 8 are plate-and-type; the pictures behind them are readouts, not a drawing of atoms arriving.
- Stage 1's strip lines and the mg figures are small numbers; the painted text sizes are unseen.
- Stage 7's property words under the tubes ("burns with a pop") are real tests but the bench shows no splint.


---

# Brinewire boss-clamp: audit

Evidence labels: Code (read in the source), Scripted (replayed by a Node script), Bench (drawn or driven on the bench by script). No stage was played by a hand.

| Phase | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP topic | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Rank Fe, Ni, Sn, Ag from dips | Dip by drag and by two taps, rail by drag and by two taps; solved by script, drag, two taps | Rack and cards are q2's; cards and beakers are not in the answer's order | Twelve dips is the most of any phase; each dip is one gesture and the marks stay | A second case of "more coats means gives more readily" | Gaps all above 0.1 V; Pb and Sn left out because 12 mV is a partial swap | 9.7 / activity series | Scripted, Bench |
| 2 Anode of Mg and Ag | Run key, answer dial; solved by script, drag, two taps | The ammeter prints what each swing means | None | Electrons leave through the anode, on a pair with 1+ and 2+ ions | Current 3.17 V / 2.2 ohm = 1.44 A, toward silver | 9.8 / galvanic cells | Scripted, Bench |
| 3 Typed E°cell Fe and Ag | Seat two electrodes, type a number | Board is q4's | None | Voltage is a gap, whatever the equation says | 0.80 − (−0.44) = 1.24 V; slips: sum, reversed, one reading, silver twice, twice the gap | 9.9.A.2 | Scripted |
| 4 Zinc concentration cell, which bar | Run key, answer dial | Dilute beaker on the left, so the remembered option does not work | None | Dilute side gives, on a new metal and a new side | 0.0592 V, dilute side is the anode | 9.10.A.3 | Scripted, Bench |
| 5 Typed grams of zinc, 1.50 A, 20.0 min | Two dials, Run, number field | Plate and reference lines as q6 s4 | None | Mass follows charge, electrons per atom and molar mass | 0.610 g; slips: minutes as seconds, one electron, copper, silver and nickel molar masses, coulombs, milligrams | 9.11.A.1 | Scripted |

| Property | Result | Evidence |
| --- | --- | --- |
| Five phases, five solutions, five misses; each solution accepted, each miss refused with a reason of more than 20 characters | Holds | Scripted (`verify:learn`) |
| No lead line, predict, field stage or fetch; three one-sentence hints; prompt at most 25 words | Holds | Scripted |
| Foe's corner clear of every slot, tray, fixture and piece on all five tables | Holds | Scripted (`brinewire-boss-checks`, `verify:bench`) |
| The Clamp's every pose inside the pad and the glass at 7 viewports, planFoe pose equals the body's pose | Holds | Bench (`verify:bench`) |
| Table solved by script, drag, two taps and the drawn tabletop's gestures; every control moves the table | Holds | Scripted (`verify:table`) |
| Reward cards 23 to 40 words | Holds | Code |
| Every number in the finale is a planner figure; scene paints at every beat | Holds | Scripted (`verify:story`, checks) |
| End set: 7 problems, bench 2 problems, all answerable, ids unique | Holds | Scripted (bank check in `verify:learn`) |
| The miss reason is on screen before the foe answers; one miss costs one Integrity | Inherited from the engine, same wiring as `boss-leach` | Code |
| Look of the Clamp's table body; feel of any phase; phone layout | Not judged | none: needs a hand |


---

# Brinewire world audit (the place, not the benches)

Evidence labels: `Code` (read in the source), `Scripted` (a Node script run in this tree), `Bench` (`verify:bench` driving the real tabletop on the real host). Nothing here was played or seen: no browser was used.

| Property | Result | Evidence |
| --- | --- | --- |
| Six hosts, one per quest id of the plan, built whether or not the quest exists | Holds; `siteForQuest` resolves every id and returns null for the boss | Scripted (`verify:brinewire`) |
| Site `built` flags agree with `src/learn/quests/unit10/` | Holds at the time of the run; goes stale as quests land and needs the generator rerun | Scripted |
| Every footprint disjoint; hosts and lanes clear of pools and props; pools at least 1 m apart | Holds | Scripted |
| No two built bodies share space (about 560 meshes) | Holds | Scripted |
| Nothing buried; pylons, tanks, piers and the switch house stand on their pool floor | Holds | Scripted |
| Only the work lamps are lit; 47 lamps share 3 real lights | Holds | Scripted |
| The walk: spawn reaches every approach, the pad and the Clamp's court; no ledge; no reachable cell under water; every near pool fenced | Holds | Scripted |
| Each host stands inside its declared extent; ground under each host and lane is level | Holds | Scripted |
| Bay volumes clear, nothing between the leaned-in camera and the plate, host or ground behind it, at seven viewports (1632 rays) | Holds for all six hosts | Scripted, Bench |
| Every unit10 quest that exists mounts on its host and solves by drag and by two taps | Holds for q1, q4, q5, q6; six q2-activity lines (pieces 25.9 to 27.9 px at the two phone-landscape views) fail the 28 px floor and belong to that bench | Bench |
| Cables: five spans, ambient, ends at pylons, 7.5 m or more clear, no host under one | Holds | Scripted |
| Rotor wheels turn flat about their masts, one turn in 40 s; nothing else animates | Holds | Scripted |
| The Clamp's ground in `boss-arena.js` equals the world's open court; 7 m round it open; court level; on the lagoon's shore | Holds | Scripted |
| The Clamp's body: rig, finite geometry, 9.7 m at scale 1.4, stands on the ground, muzzle, four plates that strike off, all poses finite, comes apart | Holds | Scripted (`verify:arena`) |
| Other worlds unchanged: tallow, lanternfall, ligar, bellows, ember, verdigris, teeter, kettle, mirrowen, voyage, arena | All pass after the shared edits | Scripted |
| Shared-engine changes are opt-in | One species entry in `BOSS_LOOK`, `BOSS_ARENA_SPOTS` and `BUILDERS`; no existing path altered | Code |
| Look of the ground, sky, hosts and the Clamp; walk feel; cable sag in the sky | Not judged | none: needs a hand |


## Weak areas pass (2026-11-06)

- `q4` stages 6 and 7: the board and electrodes are replaced by a ready-built cell with its balanced equation printed and the energy counter absent, so n comes from the equation. `verify:learn`, `verify:table` and `verify:bench` are green; not played.
- `q5` stage 2: one press now advances 20 ticks, so the run takes two presses (was five). Scripted only.
- Not fixed: `q6` stages 4, 5, 8 are still plate-and-type (the balance already shows a short plating run); the Run-after-dial miss is unreproduced; phone-landscape legibility is unchecked because the shared panel covers the bench at 667 × 375 until folded and a fold click did not register.

## Second weak-areas pass (2026-11-06)

- `q3` stage 3: Cell A is now Fe|Cu so Zn|Cu is not repeated from stage 2 (checks green).
- `q1` windows: the Before and After headings sat under the 3D glass rim at 3D On (seen at 3D On in the q1 stage 5 view, which also showed the beakers, probe and four cards legibly); the windows were moved 4 units down. The fix passes `verify:learn`, `table` and `bench`; it was not looked at again.
- `q6` stages 4, 5, 8: reviewed; each has a runnable plating bench with a coulomb counter or balance and the typed figure is past its dials, so they follow the quantity ramp and are kept.
- Run after the equation dial: the dial value is set on pointer move and a scripted run, dial, run records both settings, so the missed press is not reproduced.
- The Brinewire world briefing (three Vess panels) was seen in the browser and reads cleanly.
- Still not checked: phone landscape past the shared panel, every stage not named above.
