# Prompt: Ligar teaching pass

You are improving how well the world of **Ligar** (`unit03`, bonding) in Avalon (repo `~/chem-3d`) teaches. Avalon is a browser chemistry game for students aged 12 to 17. When a student finishes Ligar they should be able to handle the AP Chemistry Unit 2 questions (molecular and ionic compound structure and properties), and it should be fun.

Another agent already audited Ligar, added missing AP content and fixed operability bugs. Your job is different: **judge and rewrite the teaching itself.** Whether a stage can be operated is settled. Whether a student learns from it is not.

## Read first, in this order

1. `PRODUCT.md`. Its invariants are hard constraints. If anything below conflicts with it, stop and ask the owner.
2. `docs/Ligar-audit.md`: coverage table, teaching-quality section, work log, open defects.
3. `docs/Avalon problems and clashing rules.md` and `CLAUDE.md` (teaching doctrine, hard rules, "retire by archiving").
4. The quests: `src/learn/quests/unit03/q1-joins.js` to `q9-orbitals.js` and `boss-warden.js`.

## How to teach (the owner's brief)

- Give students facts they could not reasonably infer: show them, state them, or have a character tell them. Then let them discover the consequences by manipulating the system. Build chemical intuition, not recall. The discovery path need not follow the historical path.
- For quantitative content follow Brilliant's approach, not plug-and-chug: start from a concrete visual situation; ask for a prediction before any calculation; build each relationship by proportional reasoning ("if I double this, what happens to that?") before naming a formula; introduce a formula only as shorthand for something already understood; ramp the numbers (friendly values and estimation first, realistic later); make units and sanity checks part of the play; give wrong answers visible, informative consequences, not just "wrong".
- Chemistry must be accurate. Simplifying is fine; saying something false is not.
- Keep the storyline, characters and voice (Vess, the Fifth). Dialogue text may be rewritten.

## The job

For **every stage of every Ligar bench and the Warden**, play it as a first-time student would and answer three questions:

1. **Intuitive?** Can a student tell what to do and what happened, from the table alone?
2. **Busywork?** Is the task carrying an idea, or is it matching a printed fact to a tray, copying a number, hunting a value, or solving by trial until a light turns on?
3. **Does the setup build intuition?** Does the picture or the manipulation make the idea feel necessary, or could a student pass without understanding?

Then rewrite the weakest stages. Prefer new tasks over new text. Cut or merge stages that repeat an idea (but note: application stages that use an idea on a new case are not repeats).

### Where to start (priority order)

1. `q1-joins`: stages 3 and 5 sort printed facts into trays; nothing makes "a full outer shell" feel necessary; stage 2's outcome is a rod or a drift the student must interpret. Electronegativity (now taught in `q7`) arrives after the idea it explains.
2. `q4-dots`: a student can reach water's drawing by hunting for lit lamps without counting valence electrons.
3. `q5-resonance`: stages 1 to 3 have never been played by an agent. Stage 3 is rearranging one double bond.
4. `q3-distance` stage 2 (reading a depth off a graph) and stage 6 (it ranks salts, never computes a number). `q8-hybrid` stages 1, 2, 4 and 5 (stage 5 is a refusal demo). `q7-polarity` stages 3 and 4.
5. `q9-orbitals` (beyond AP; overloaded; should be marked optional on the bench) and `boss-warden` (never played; phases should re-test earlier ideas, not new ones).
6. Quantitative depth across the world: few stages ask the student to compute a number they can sanity-check. Where it fits, add them (Coulomb's law ratios, formal charge arithmetic, bond order, counting sigma and pi bonds). Five-domain shapes (trigonal bipyramidal, seesaw, T-shaped) are not built yet; hybridization read from a formula is thin.

## Setup (what already works, and traps)

- `npm run dev -- --port 3011 --strictPort`. Open it in the built-in browser, **3D On** (the owner wants benches played in 3D). Sign in with **Continue as Guest**, join a guild, skip onboarding.
- Quests unlock in order. To open any bench, in the page console: `const {session}=await import('/src/session.js'); for (const q of ['q1-joins','q2-lattice','q3-distance','q4-dots','q5-resonance','q6-shape','q7-polarity','q8-hybrid','q9-orbitals']) session.markLearnQuestComplete('unit03', q)`.
- A deep link first flies the ship; **reload the page with the quest hash** (`#/learn/unit03/q4-dots`) to land on the bench.
- To jump to a stage: set `globalThis.__LQ_TEST__ = { runner: r => { window.__R = r } }` then change the hash to a quest; then `window.__R.loadStage(i)` (0-based). Skip the Tour dialog.
- **Operate with real gestures** (drag, click-then-click, dials), not only `window.__R.act(...)`. Scripted solutions pass `npm run verify:table` while real play fails: this happened twice (a card kind marked `nojoin` so a dropped tool never joined; a drag that threw the camera off the bench). If a real gesture does not work, that is a defect to fix and log.
- The pane is small; zoom screenshots to read labels. If something is hard to read at the default view, say so.
- Traps already hit: `c.label(text, w, h)` takes **metres** (a 128 m plate once blacked out every orbital bench); `wells()` in `q3-distance.js` silently drops options it does not list; the stage count lives in three places (`meta.stageCount`, `src/learn/worlds/unit03-bonding.js`, and the counts in `PRODUCT.md` and the verify scripts' stage indices); new tools and pieces need a Tour step in `src/learn/table/tour-ligar.js` or `verify:table` fails.

## Rules for changes

- Follow `PRODUCT.md` and `CLAUDE.md`: one decision per stage; predict first only on the click stage or a new case; prompts state the objective, never the route (at most 25 words, no "!"); three one-sentence hints (control, what to look at, method); every stage ends on a reward card of one to three sentences; no feature advertising; plain words until earned; never give away the answer in a prompt, hint or miss message.
- **Never delete** code or docs that were once real. Move them to `archive/<date>/` with a README saying why (see `CLAUDE.md`).
- Other agents are working on the other worlds. Do not change other worlds. Shared engine, kit and verify changes must keep every other world passing.
- Reuse existing kits and pieces. A brand new bench needs a world site (`tools/gen-ligar-layout.mjs`, `src/three/world-data/ligar.json`) and about ten wiring files; prefer new stages on the existing bench for the concept unless the owner asks for a bench.
- After each bench: replay the changed stages in the browser by hand and check the console; run `npm run verify:learn verify:table verify:story verify:docs verify:ligar verify:bench` (one at a time; each as `npm run verify:<name>`); fix what you broke; commit with a message that says the **teaching** change. Do **not** run the full `npm run verify` casually: it ends in `npm run build`, which wipes `dist/` (rescue non-build files such as `dist/art` first).
- Keep `docs/Ligar-audit.md` current: add what you played, what you judged, what you changed, and what is still weak. Update `CLAUDE.md` with changed stage counts and anything a later agent must know.

## What to deliver

1. A per-stage table in `docs/Ligar-audit.md`: stage, played how (real gestures or not), intuitive / busywork / intuition verdicts with one line of evidence each.
2. The rewrites, committed bench by bench.
3. A final summary: what changed, what is still weak, which concepts you added or recommend adding, and a short list of things only the owner can judge by playing (you cannot see a student's confusion).

If something blocks you (a bench crashes, a gesture cannot be made to work), log it in the audit and move on rather than stalling.
