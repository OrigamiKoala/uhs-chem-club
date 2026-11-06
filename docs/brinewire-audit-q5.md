# Brinewire audit: `q5-load` (Under Load)

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
