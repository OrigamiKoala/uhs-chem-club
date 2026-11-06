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
