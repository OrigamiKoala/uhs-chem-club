{world} = Ligar
{unit} = unit03

(Worlds and unit ids: Tallow `unit01`, Lanternfall `unit02`, Ligar `unit03`, Bellows `unit04`, Ember Reach `unit05`, Kettle `unit07`. Test script for a world: `npm run verify:<tallow|lanternfall|ligar|bellows|ember>`; Kettle is covered by `verify:learn` and `verify:table`.)

# Goal

You're improving the world of {world} in Avalon (repo: ~/chem-3d), a browser chemistry game for middle and high school students. When you're done, every bench, stage, and quest in {world} should teach its concept well enough that a student who finishes it could handle the AP Chemistry questions on that topic. Getting there should also be fun.

**This is one autonomous run.** Do the whole job (audit, every fix, every missing concept, re-audit) without stopping to ask me for the next task. Stop and ask only if (a) something in these instructions conflicts with PRODUCT.md, or (b) a decision is genuinely mine (for example a change to the product's scope). Everything else: decide, do it, log it.

Read PRODUCT.md first. Its invariants are hard constraints. PRODUCT.md and CLAUDE.md say agents do not browser-test; **for this task that rule is lifted: play the benches in the browser at 3D On.** Other agents are working on the other worlds in parallel.

# What's wrong now (expect to find all of these)

Many {world} benches:

- Have visual problems: overlap, clipping, unreadable text, a bench that renders black, or unclear what's interactive.
- Cannot be operated by a real hand: a drag that does nothing, a tool that will not join, a missed grab that throws the camera off the table.
- Aren't intuitive: a first-time player can't tell what to do or why.
- Are busywork: sorting a printed fact into a tray, copying a number off a gauge, hunting a value until a light turns on, solving by trial without understanding.
- Have a setup that does not build intuition: the picture never shows the thing the idea is about, so a student can pass without understanding.
- Overwhelm: too many new ideas, controls, or numbers at once.
- Assume background knowledge the student doesn't have, or make the player infer things from experiments that took humanity centuries to work out.
- Cover the qualitative side of a topic but not the quantitative side AP requires.
- Skip some concepts entirely.

# How to teach

The discovery path does not need to follow the historical path. Give students facts they couldn't reasonably infer: show them, state them, or have a character tell them. Then let them discover the consequences by manipulating the system. Build chemical intuition, not recall.

For quantitative content, follow Brilliant's approach, not plug-and-chug:

- Start from a concrete, visual situation. Ask for a prediction before any calculation.
- Build each relationship through proportional reasoning ("if I double this, what happens to that?") before naming a formula.
- Introduce a formula only as shorthand for something the player already understands.
- Ramp the numbers: friendly numbers and estimation first, realistic values later.
- Make units and sanity checks part of the gameplay.
- Give wrong answers visible, informative consequences, not just a "wrong."

# Process

## 0. Set up (once)

1. Read PRODUCT.md, CLAUDE.md, `docs/archive/2026-10-29/Avalon problems and clashing rules.md`, and the world's quest files in `src/learn/quests/{unit}/`.
2. `npm run dev -- --port 3011 --strictPort` (use another port if taken). Open it in the built-in browser, **3D On**. **Continue as Guest**, join a guild, skip onboarding and cinematics (Esc or Skip).
3. Unlock every quest in the world (quests open in order): in the page console, `const {session}=await import('/src/session.js'); for (const q of [<every quest id in the world>]) session.markLearnQuestComplete('{unit}', q)`.
4. Landing on a bench: a deep link first flies the ship. **Set the hash to `#/learn/{unit}/<quest>` and reload the page**; you land on the bench. Skip the Tour dialog.
5. Jumping to a stage: set `globalThis.__LQ_TEST__ = { runner: r => { window.__R = r } }`, change the hash to another quest and back (no reload), then `window.__R.loadStage(i)` (0-based). `window.__R.act({...})` runs a game action; `window.__R.tabletop.state` is the table.
6. The pane is small. Zoom screenshots to read labels. If something is hard to read at the default view, that is a defect.

## 1. Audit (play every stage, not a sample)

Play **every stage of every bench and the boss** as a first-time student would, in order, **with real gestures** (drag, click-then-click, dials), not only `window.__R.act`. Scripted solutions pass `verify:table` while real play fails (this has happened: a card kind that refused joins so a dropped tool never joined; a drag that threw the camera off the bench). For every stage write down evidence, not impressions:

- **Operable?** Could a real hand do it; does the bench render and read at the default camera; is the console clean?
- **Intuitive?** Does the student know what to do and what happened, from the table alone?
- **Busywork?** Does the task carry an idea, or is it matching/copying/hunting?
- **Builds intuition?** Does the picture or manipulation make the idea feel necessary?
- **Accurate?** Is everything said and shown true?
- **AP coverage:** the AP Chemistry Course and Exam Description topics it covers (cite topic numbers), and the topics the world misses.

Save to `docs/{world}-audit.md`: a per-stage table with those verdicts and one line of evidence each, the AP coverage table, and a work log you keep current. An audit that rates a bench from one stage's layout is a failed audit: say plainly what you did and did not play.

## 2. Fix, in this order, and keep going

1. **Blocking operability** (nothing else teaches until these work): black or unreadable benches, gestures that do not work, controls that cannot be found, camera traps, text clipped or too small.
2. **Teaching quality** of every stage the audit marked weak: rewrite the task so it carries the idea (predict, then test; a reading that needs reasoning; a quantity the student computes and can sanity-check) instead of polishing the old one. Cut or merge a stage that only repeats another (an application of an idea to a new case is not a repeat).
3. **Quantitative depth** wherever AP needs numbers.
4. **Missing concepts.** Add the stages or benches the audit found missing. Prefer new stages on the bench the concept belongs to (cheap, safe). A brand new bench needs a world site (`tools/gen-<world>-layout.mjs` and its world-data JSON) and about ten wiring files (chart, instruments list, stage-story, quest-story, field manual, verify lists, counts): do it only when a stage cannot hold the idea, and run the world's verify script, which checks overlap and walkability.

After **each** fix: replay the changed stages in the browser by hand, check the console, run `npm run verify:learn`, `verify:table`, `verify:story`, `verify:docs`, the world's own script and `verify:bench` (each as its own `npm run verify:<name>`), and commit with a message describing the teaching change.

## 3. Re-audit, then finish

When the fix list is empty, **run a second full audit pass over the changed world** (new stages count) and fix what it finds. Repeat until a full pass finds nothing blocking or major, or until you have done three passes; log anything left, with why. Then update `CLAUDE.md` (stage counts, new mechanisms, traps) and write the final summary: what changed, what is still weak, which concepts you added or recommend adding, and what only I can judge by playing (you cannot see a student's confusion).

# Constraints

- Chemistry must be accurate. Simplifying is fine; saying something false is not.
- Keep the existing storyline, characters, and voice. Dialogue text may be rewritten.
- Follow PRODUCT.md and CLAUDE.md: one decision per stage; predict first only on the click stage or a new case; prompts state the objective, never the route (at most 25 words, no "!"); three one-sentence hints (the control, what to look at, the method); every stage ends on a reward card of one to three sentences; plain words until earned; never give the answer in a prompt, hint or miss message; no text that advertises the interface.
- **Never delete** code, docs or checks that were once real: move them under `archive/<date>/` with a README saying why.
- Don't break other worlds. Reuse existing kits and pieces. Changes to shared engine, kit or verify code must leave every other world's checks passing: run `verify:tallow`, `verify:lanternfall`, `verify:bellows`, `verify:ember` after any shared change. Commit only your own files.
- **Do not run the full `npm run verify`** casually: it ends in `npm run build`, which empties `dist/` (the owner keeps reference art there; copy anything that is not build output out first).
- If something blocks you (sign-in fails, a bench crashes, a gesture cannot be made to work), log it in the audit and move on rather than stalling.

# Traps already hit (read before you start)

- **A real gesture is the test.** `verify:table` replays scripted actions and 2D gestures; it cannot see a 3D pick, a camera drag, or an unreadable label.
- `c.label(text, w, h)` takes **metres**: a 128 × 48 call made a 140 m plate that blacked out every orbital bench.
- Option objects (for example `wells(...)` in `q3-distance.js`) silently drop keys they do not list; check an option actually reached the drawing.
- A piece kind with `nojoin` can never be a drop target for a tool; use the field variant where a tool must join.
- A stage count lives in several places: `meta.stageCount` in the quest, the chart in `src/learn/worlds/<world>.js`, the `<!-- facts: ... stages=N -->` comment and the sentence in `PRODUCT.md`, and hard-coded stage indices in `tools/verify-learn.mjs` for the world. Inserting a stage before another shifts all of them, and the `NOTES` keys that print how-to lines on the plate.
- Every new kind of piece or tool needs a Tour step in the world's `table/tour-<world>.js`, or `verify:table` fails; a refusal message must not contain the feature that decides the stage; reward cards are one to three sentences.
- Pieces must fit trays and the table (`verify:table` layout checks name what overlaps or draws off the plate).
- Dev server HMR reloads the page: set the `__LQ_TEST__` hook again after an edit.
- Commits end with the attribution line given in your session's reminder.
