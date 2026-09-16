# Quest 1 — exploration pass

## The problem

The stage loop today is: read a prompt that states the answer → read a concept card
that states it again → drag the line the prompt described → watch the animation.
The player never has to look at the chamber. Specifically:

1. **Prompts are answer keys.** "connect the brightest red donor to the deepest blue
   receiver" leaves nothing to find.
2. **Looking is unrewarded.** You can rotate the view, but the game gives you nothing
   for it. All information arrives as prose.
3. **The hint is one button that dumps the solution.** Free, so the optimal play is to
   press it every stage.
4. **Failure says "NOT QUITE".** A wrong answer teaches nothing.
5. **Twenty stages, two verbs.** Drag one arrow ×10, drag two arrows ×10.

## The fix — five changes

### 1. Scan (new core verb)
Tap any glowing site → a telemetry readout for that site alone:

    SITE C · TAKER
    CHARGE     ████████░░  8/10
    CLEARANCE  ██░░░░░░░░  2/10
    "Just as hungry — but three bulky neighbours crowd every approach."

One site tells you nothing; the answer comes from **comparing** scans. That is the
exploration loop. Scanning is free and unlimited, never required, and is where the
teaching now lives. `SITES SCANNED 2/4` is shown as a nudge, not a gate.

Tap = scan, drag = draw. No mode switch, no extra button.

### 2. Prompts state the situation, never the route
> "Two blue sites, both screaming for charge, both equally strong. Only one of them
> can actually be reached. Scan to find out which."

### 3. Hint ladder, earned
- **Nudge** — free, always. Asks a question, names which number to compare.
- **Narrow** — after 1 wrong attempt or 45 s. Eliminates most of the field.
- **Solution** — after 2 wrong attempts. Names the move.

The answer stops being free but is always reachable within two misses.

### 4. Failure names the physics
Classified miss: giver→giver, taker→taker, backwards, too-weak pairing, blocked,
right-moves-wrong-order, incomplete. Each gets its own sentence.

### 5. Concept cards become rewards
A card that explains the idea *before* the player finds it is a lecture. Mechanics
cards (stage 1 controls, stage 11 arrow ordering) stay up front; every *concept* card
now fires **after** the solve, as "WHAT YOU JUST FOUND".

Plus: per-stage shape kicker (SURVEY / THE TRAP / THE RACE / DOMINO …) and a clean-solve
streak — no wrong attempts and no solution-tier hint. Streak is display only; it pays no
XP, so the flat-XP-once-per-stage rule is untouched.

## Files
- `src/quest3d/evaluator.js` — `STAGE_COPY` layer (shape/prompt/hints/scans/concept)
  merged into `STAGE_CONFIGS`; `diagnoseMiss()`.
- `src/quest3d/interactions/arrow.js` — tap-without-drag fires `onProbe(anchor)`.
- `src/quest3d/viewer.js` — wires `onProbe` through `loadStage`.
- `src/screens/quest.js` — scan panel, hint ladder, diagnostics, streak, kicker.
- `src/fallback2d/stages.js` — scan buttons so Tier 1 has the same loop.
- `src/styles/holo.css` — scan readout + meters.
- `api/[...route].js`, `apps-script/Quests.gs` — mirrored prompts/hints.
- `tools/verify-stages.mjs` — asserts every rendered region has a scan entry, every
  stage has 3 hint tiers, and the new copy stays jargon-free.

## Status
- [x] Diagnosis
- [x] Copy pack (20 stages: shape, prompt, 3 hints, scans, concept timing)
- [x] Scan mechanic (3D tap + Tier 1 buttons + readout panel)
- [x] Hint ladder
- [x] Miss diagnostics
- [x] Streak + kicker
- [x] Mirrors synced, verify extended, `npm run verify` green
