# Teeter (unit08) audit

Evidence labels: **Played** (real pointer gestures in the built-in browser, typed answers, Submit), **Viewed** (loaded and looked at), **Scripted** (a scripted solution through the real action path, `verify:learn`/`verify:table`), **Bench** (`verify:bench` pointer path), **Code** (read only). Columns: Op = operable, Int = intuitive, Busy = free of busywork, Intu = builds intuition, Acc = accurate.

Setting of the play pass: built-in browser at 800 x 600, `3D Off` (Teeter has no walkable ground in the first play pass; the bench at `3D On` is checked when the world lands), guest session, `__LQ_TEST__` runner for `loadStage(i)` jumps, stage gestures by `left_click` two-tap (the browser tool's drag ends short of its target, so a drag is not proved by hand; `verify:table` replays drag).

## q1-both Running Both Ways

| # | Stage | Op | Int | Busy | Intu | Acc | AP | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A Alone | yes | yes | marker is a read-off of a curve (weak) | yes | yes | 7.1 | Played | Run x10, tap marker groove at 15, Submit: reward shown. Wrong marker not played (Scripted miss). |
| 2 | What Is Happening? | yes | yes | no | sets up the click | n/a | 7.1 | Played | Two-tap card to slot, Submit. |
| 3 | Ringed Particles | yes | yes | no | yes (click) | yes | 7.1.A.3 | Played | Wrong dial first: refusal "changed colour 18 times ... counts are not zero" in `.stage-error-banner`; right dial: reward quotes the guess. Selector shows no option names until moved (blank start): logged. |
| 4 | B Alone | yes | yes | read-off marker | yes | yes | 7.1 | Played (Run, ghost) / Scripted (submit) | Ghost trace leaked the whole answer curve before running; fixed to draw only to the current tick. |
| 5 | A Picture of the Settled Pan | yes | yes | no | yes | yes | 7.8 | Played | Run x8, two-tap Diagram 4 to slot, Submit: reward. Diagram colours are laid in rows, not scattered (cosmetic). |
| 6 | Two Settled Pans | yes | yes | no | yes | yes | 7.1.A.3 | Played | Wrong card refused with "both counts under the graph are above zero"; right card accepted. |
| 7 | Writing the Pans | yes | yes | no | yes | yes | 7.1.A.1 | Played | Tag cards were 6 px: replaced by an `arw` card at 4.4 x scale. Two-tap both cards, Submit: reward. |
| 8 | Sealed Pans | yes | yes | no | yes | yes | 7.1.A.2 | Played | Dial tapped to Pan 3, Submit: reward. |
| story | Pan Both Ways | n/a | | | | yes | | Viewed | Beat 1 plays and paints; beats 2 and 3 viewed by `verify:story` paint check only. |

Left open for q1: selector option names are invisible until the dial moves; the pan at 800 x 600 is small (plot about 60 px wide); phone width (375) not checked; `3D On` not checked.
