# UX / Consistency Pass — Registration + Quest 1

Goal: one continuous brand, no dead ends, no bugs, playable by a middle schooler who
has never seen chemistry.

## Findings (traced 2026-09-15)

### Bugs
1. **Quest completion modal is invisible.** `#modal-container` has zero CSS — no overlay,
   no positioning, no z-index. Finishing all 20 stages renders the payoff modal below the
   fold, behind the app viewport. The epilogue's `\n\n` also collapses in a `<p>`.
   If `quest/complete` fails, the player is silently dumped on the bridge with no reward.
2. **Quest 1 unplayable on Tier 1 (no WebGL).** `STAGE_CONFIGS` carries no `anchors`, so
   `renderFallbackInputs` renders empty dropdowns. Labels also fall back to raw ids.
3. **Demo screen is broken.** `moleculeId: 'h2o'` does not exist in `MOLECULE_DATA`;
   `demo/grade` mock grades a `pick` payload with arrow logic → always wrong, and prints
   `undefined` as feedback. It is linked from the landing page as "Try Demo".
4. **XP can be farmed.** Replaying a completed stage re-runs `session.addXp`; local XP is
   then `Math.max`'d against server XP forever, so it never reconciles down.
5. **Bridge leaks session subscribers** — `session.subscribe` on every route entry, never
   released; each visit adds another live re-render callback.
6. **Bridge advertises the wrong quest** — "7 Stages / 165 XP" vs the real 20 stages / 650 XP,
   and no notion of the player's progress.
7. **Nav highlight never matches** for COMMS/CARGO/CREW (`raw.includes(target)` compares
   `/leaderboard` to `comms`).
8. **`/settings` is public** (`auth: false`) but shows a change-password form that can only
   fail for a signed-out visitor.
9. **Toast variants unstyled** — `.toast-success/-error/-warning` do not exist, so an error
   and a success look identical (amber).
10. **No responsive rules anywhere** — the 64px HUD with 5 nav buttons + stats + chips
    overflows on a phone, which is what students will use.
11. Server applied a 1.25× first-attempt multiplier the client could not know about, so the
    "+15 XP" banner and the real award disagreed.
12. Dead code in the quest runner (`attemptsLeft`, `hintUsed`, the scan sweep) and no way to
    ask for a hint even though the backend has `hint_text` for every stage.
13. Multi-arrow stages (11–20) never tell the player how many arrows are needed or how to
    reorder them.

### Consistency
- Every screen hand-rolls its own header markup and inline font stack; three different title
  treatments (`.holo-title`, inline Cinzel, inline Chakra Petch) across seven screens.
- Nav labels (COMMS / CARGO / CREW) do not match page titles (Standings / Inventory /
  Profile Settings).
- Links used `--accent-cyan`; the brand spec is amber/gold.
- Star Map advertised hardcoded transit dates (OCT 02 …) that are already stale.

## Delivered

Design system (`src/styles/main.css`, `src/ui/layout.js`, `src/ui/modal.js`), a three-step
signup journey, a Quest 1 runner with hints, an arrow counter, replay-safe XP and a visible
completion payoff, every screen on the shared header, and backend/proxy copy synced to the
client. Two new checks guard it: `npm run verify:quest` (all 20 stages solvable, consistent
and jargon-free) and `npm run verify:flows` (register → team → grade → complete).

## Plan

- [x] Phase 1 — Design system: shared header/stat/banner/modal/toast/responsive CSS +
      `src/ui/layout.js` + `src/ui/modal.js`.
- [x] Phase 2 — Registration flow: landing → register → onboarding → bridge as one 3-step
      journey with a visible step rail, live validation, working demo.
- [x] Phase 3 — Quest 1: T1 anchors, arrow counter, hints, replay without XP farm, visible
      completion payoff, mobile layout.
- [x] Phase 4 — Remaining screens on the shared components.
- [x] Phase 5 — Backend/proxy: flat XP, epilogue + stage counts consistent everywhere.
- [x] Phase 6 — `npm run build`, update CLAUDE.md.
