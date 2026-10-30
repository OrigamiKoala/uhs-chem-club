# Mirrowen (`unit06`) — audit

Per-stage record, written as each bench is built. Evidence labels (`PRODUCT.md` §7): **Played** (real pointer gestures, typed answers, Submit), **Viewed**
(loaded and screenshotted at `3D On`, default camera, scripted solution), **Scripted** (a scripted solution through the real action path only),
**Bench** (`verify:bench` solved it by pointer path), **Code** (read only). Columns: Operable, Intuitive, Busywork, Builds intuition, Accurate, AP topic.
A stage that was not played by hand is labelled so. The browser pane is 800 × 600, so "default camera" means that size; 375 px landscape is noted per bench.

## q2-grip · The Grip Between (CED 3.1) — the vertical slice

| # | Stage | Operable | Intuitive | Busywork | Builds intuition | Accurate | AP | Evidence |
| - | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Four Atoms | Yes: drag to probe, key, drag to rail all worked; card keeps its reading; a correct order is accepted with one card never pulled | Yes; the Tour explains the probe | No: three pulls then a rank | Yes: clouds drawn to scale | CRC ΔHvap | 3.1.A.1 | **Played** (drags, key, Submit, reward) |
| 2 | A Polar Molecule | Yes | Marks + / − read at 800 px only when zoomed | No | Yes: HCl beats heavier Kr | CRC | 3.1.A.2 | Viewed (old card layout; scripted) |
| 3 | Which Holds On? | Yes: card dragged to slot, Submit, reward | Yes | – | The click: offers "the heavier holds harder" | – | 3.1 | **Played** |
| 4 | Four Hydrides | Yes; prompt quotes the guess; the untouched table is refused with a reason | Yes | No | Yes: water and ammonia beat heavier cards | CRC | 3.1.A.4 | **Played** (Tour, the refusal, a pull); the rank scripted and Viewed |
| 5 | Ions in Water | Yes | Ion discs to scale; symbol on the name row (changed after viewing) | No | Yes | Marcus 1997 | 3.1.A.2 | Viewed (before the label change); scripted |
| 6 | Same Formula | Scripted solves | – | No | Yes | CRC | 3.1.A | Scripted |
| 7 | A Grip and a Bond | Crank and probe both on one table; typed field | The ratio needs two bonds per molecule, read from the card's glyph | Mild: a division | Yes | 2 × 463 / 40.65 | 3.1 | Viewed (scripted) |
| 8 | Five Sealed Samples | Trays sized for two cards, labels clear (changed after viewing); table taller (72) | Yes | No | Yes | CRC | 3.1.A.1 to .4 | Viewed after the fix; the solve is scripted |

Defects found and fixed while playing the slice (so the ledger learns from them): a card that printed a mass line and a reading on one row;
cloud discs too small to compare; ion symbols painted inside a small disc; tray labels overlapped by the first card of a tray whose cell was
shorter than the card (a tray's cell must be at least a card tall, so the table was made taller); a how-to note with no clear strip on a crowded
table; a reading printed as 40.6 where the text said 40.7 (floating-point rounding: add an epsilon before `toFixed`).
