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


## q2-k to q8-free and boss-tipper (second session)

Evidence labels: **Scripted** = `verify:learn`/`verify:table` solved it by script, drag and two-tap, and refused every authored miss; **Viewed** = loaded at 800 x 600 in `3D Off` and looked at (zoomed screenshots); **Played** = real two-tap gestures in the browser.

| Bench | Stages | Evidence | Findings |
| --- | --- | --- | --- |
| q2-k | 1 to 8 | Scripted all; Viewed 1 to 5; Played 2 (Settle, B over line, A under line: all three pans read 2.00); one 3D On view of stage 2 | Bars printed "NaN × 10^-infinity" for zero: fixed. Lead line gave away the click: replaced. Typed field at stage 5 small. |
| q3-q | 1 to 8 | Scripted all; Viewed 1, 3, 8 | Stage 8 trays clipped at the table's right edge: moved. Stage 3 prints Q and K values (evidence by design). |
| q4-properties | 1 to 8 | Scripted all; Viewed 1, 6, 8 | Reaction-card text is small at 800 px. No Kp/Kc and no halving stage. |
| q5-ice | 1 to 8 | Scripted all; Viewed 2, 5, 8 | Reads cleanly. Stage 2 prints K and the start (constants given by design). |
| q6-lean | 1 to 8 | Scripted all; Viewed 1, 8 | Stage 8 is a dial search (anti-pattern, weak). Header title clips at 800 px. |
| q7-dissolve | 1 to 8 | Scripted all; Viewed 1, 2, 7 | Reads cleanly. |
| q8-free | 1 to 8 | Scripted all; Viewed 3, 7 | Stage 3 prints the rule and constants; stage 6 adjacent to Ember Reach q7-gibbs. |
| boss-tipper | 5 phases | Scripted all (`verify:table`, `verify:bench` at 7 viewports by pointer path, `verify:arena` body) | Never seen or played; the arena body and finale are measured, not looked at. |
| walkable world | | `verify:teeter` and `verify:voyage`; one 3D On view of a bench built in the world | Visual quality of terrain, sky and brine unseen beyond the one bench view (paving under the bench looked right). |

Not done anywhere in q2 to q8 and the boss: hand play of every stage, a second pass, 375 px landscape, `3D On` per bench, story animations viewed (only q1-both's beat 1 was seen).


# Pass 2 (2026-11-05): 3D On, and the weak spots closed

Pass 2 was at **3D On**, 1280 x 800: the voyage lands on Teeter, the player disembarks onto the salt flats and opens a quest at its bench in the walkable world. The 3D bench is what the owner plays, so this pass outranks the 3D Off pass above. `loadStage(i)` (the `__LQ_TEST__` hook) jumps between stages; every answer below was given with real taps.

## Played at 3D On (taps, accepted by the stage)

| Bench | Stage | What was done |
| --- | --- | --- |
| q2-k | 2 The Ratio Rig | Settle, tile B over tile A; all three pans read 2.00 |
| q4-properties | 1 The Other Way Round | card to the check, Flip, Read K (0.250), tile 1.25, Submit |
| q4-properties | 4 Every Amount Halved | card to the check, Larger, Read K (16.0), tile 6.00, Submit |
| q6-lean | 8 Taking NH₃ Out | take-out dial 0.5, Run x6 (NH₃ 0.97, then 0.50, then 0.66), "Less than before", Submit |
| q7-dissolve | 1 Adding Solid | eight scoops to saturation, Submit |
| boss-tipper | phase 1 The Pans | stepped back, looked up at the Tipper, leaned in, Pan 2, Submit: bar 1000 to 800, Flawless |

## Viewed at 3D On

q1-both 1 to 8; q2-k 2, 4, 5, 8; q3-q 1, 3, 6, 8; q4-properties 6, 8; q5-ice 1, 5; q6-lean 1, 5, 7; q7-dissolve 4, 7, 8; q8-free 1, 4, 7, 8; the boss table and the Tipper (a beam balance on a trestle, two pans, a dial, pump jacks behind). Every story animation was viewed: q1 (four beats), q2 (three), a beat each of q3 to q8.

## Defects found and fixed in pass 2

| Defect | Found by | Fix |
| --- | --- | --- |
| Story painters showed the NEXT scene at the end of a beat (they switched on `t < x` and a beat ends at `t = x`): q7 showed empty meters and bars, q6 an empty graph | Viewed at 3D On | switch on `t <= x` in the q1, q2, q4, q5, q6, q7, q8 and boss painters |
| Awkward prompts ("made half as large", "Lay tiles on the rig so that it reads") | Owner | "with every amount halved", "Arrange tiles on the rig into a ratio that comes out the same for all three settled pans"; same wording in hints, rewards, bank, story |
| The letter O reads as 0 in the bench type | Viewed | the halving card uses W |
| q3-q stage 8: answer slots overlapped the vessel and hung off the table | Viewed | narrower vessel, slots at x 131.5 |
| Selector options hidden until the dial moved | Played | `selectorFixture({ list: true })` prints every option on the card |
| q6-lean header title clipped | Viewed | `.learn-quest-2d .learn-host-title` wraps |
| Boss phase 4 reward claimed the pressure "doubled" at any volume | Played | "raised the pressure", "Q above K" |
| Reaction-card text small | Viewed | equation text 3.0 x scale, K and badge 2.4 x scale |
| Saga text described a refinery and tanks | Read | rewritten to the salt pans |
| `unit08` missing from `BUILT_BENCHES` | Read | added |

## Weak spots from the first report

| Weak spot | Now |
| --- | --- |
| q1-both s1 and s4 read a marker off a curve | s1: what the settled pan holds (Only A, Only B, Both A and B). s4: the B-only pan's A against the dashed line (Lower, Level, Higher) |
| q6-lean s8 searched three dials | s8 takes NH₃ out of a settled vessel; one decision |
| q6-lean had no remove-a-product stage | s8 is that stage |
| q4-properties had no halving stage | s4: K of M + N ⇌ W from 2 M + 2 N ⇌ 2 W (K 36), answer 6 |

## Still open

- Kp/Kc is `q4-properties` stage 7 (added at the owner's request, beyond the exam; it replaced "a stack already built"). Played at 3D On: the Kc tile was refused with a reason, 0.144 was accepted.
- The pan is drawn flat on the bench; the bench is 3D.
- Six stages were played at 3D On and about 40 viewed; the other stages are scripted. q3-q, q5-ice and q8-free were not clicked through at 3D On, and boss phases 2, 3 and 5 were not played at 3D On.
- 375 px portrait was not checked (benches need landscape; `verify:bench` covers 667 x 375).
