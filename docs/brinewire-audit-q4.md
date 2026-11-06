# Brinewire audit: `q4-potential` (the vertical slice)

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
