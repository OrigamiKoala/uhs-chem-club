# Teaching pass: how to run it

This folder holds everything for the final teaching pass of the ten live Learn worlds: what each agent reads, the prompts you send, and where results are recorded. Nothing here was play-tested; it was written on 2026-11-11 from the stage text, the earlier records and your feedback files.

> **2026-11-12:** a plan session has written per-stage plans into all nine remaining live world files (`worlds/unit01` to `unit10`, Ember Reach excepted, which is built), and first-build plans for the four unbuilt worlds (`worlds/unit11-quicklight.md`, `unit12-lodestone.md`, `unit13-thornmere.md`, `unit14-cinder-halo.md`). Steps 2 to 4 of the sequence below can therefore be run as build sessions from those plans; `PROGRESS.md` has the summary.

## What is in the folder

| File | Who reads it | What it is |
| --- | --- | --- |
| `README.md` | you | This guide. |
| `BRIEF.md` | every agent | The standard (seven points), your decisions, the bench-by-bench method, text rules, engine traps, checks, what "done" means. |
| `PATTERNS.md` | every agent | Ways to turn an instrument-operating stage into one that teaches, with file pointers. Part B is filled by the exemplar sessions. |
| `worlds/unitNN-<world>.md` | the agent on that world | Facts, known faults, bench notes and traps for one world, then the Record the agent fills in (plan rows, what changed, what is still weak, what you should look at). |
| `PROGRESS.md` | every agent, and you | Baseline check results and each world's status. A session that is cut off is resumed from here. |
| `prompts/exemplar.md`, `plan.md`, `world.md`, `closeout.md` | the agent you send it to | The four prompts. `prompts/review.md` is given by an agent to its own review subagent; you never send it. |
| `Ember.md`, `Mirrowen.md`, `Teeter.md`, `Verdigris.md`, `Brinewire.md` | background only | Records of the 2026-11-06 pass. Agents are told not to read them whole. |

One tool was added: `node tools/teaching-report.mjs <unit>` prints fault flags per stage, and with `--read` prints a bench as plain text in play order. Agents use it to find faults without reading whole quest files. It is a reading aid, not a check; no count from it is a goal.

## Should a stronger model do Lanternfall, Ligar and Ember Reach first?

Yes, with four conditions.

Why it is worth the cost:

- The skill that failed in every earlier pass was design judgement: deciding what the student should do so the idea is visible. Sonnet at medium copies a concrete redesign far more reliably than it invents one.
- These three worlds contain the hardest work in the track. Lanternfall `q10-wavefunctions` and Ligar `q9-orbitals` need new visual instruments (you asked for them and got card sorts), and Lanternfall `q8-trends` needs an instrument that shows why a trend runs the way it does.
- They cover both groups. Lanternfall and Ligar had no pass (stand-in words, no glossary, answer-giving hints). Ember Reach had the 2026-11-06 pass and shows what the other four passed worlds share: the model moves and the student still types a number.

The conditions:

1. **Ember Reach goes first, and you play it before anything else runs.** It is the smallest world and it sets the patterns every other world copies (calculation stages, briefings, a worked case before the first typed stage). A flaw in the example is repeated seven times.
2. **Each exemplar session must write its redesigns into `PATTERNS.md`.** A Sonnet session cannot afford to read a whole exemplar world; it reads a short catalogue that points at the file to copy. The exemplar prompt requires this.
3. **One world per Opus session,** not all three in one.
4. **Use Opus for design in the other seven worlds too, cheaply.** A plan session (`prompts/plan.md`) reads a world and writes the per-stage plan without touching code. Sonnet then builds from the plan. This puts the strong model's judgement where it matters for a small share of the usage. It is strongly advised for Bellows and Kettle, advised for Teeter and Tallow, optional for Mirrowen, Verdigris and Brinewire.

If Opus usage runs short: keep Ember Reach as a full exemplar, and for Lanternfall and Ligar have Opus do only the benches marked redesign or rebuild in their world files (`q8-trends`, `q10-wavefunctions`; `q6-shape`, `q9-orbitals`) plus a plan for the rest, then let Sonnet finish each with `prompts/world.md`.

## The sequence

Start each step in a **new session**. The message you send is the one line in the last column.

| Step | Model | What happens | Message to send |
| --- | --- | --- | --- |
| 0 | you | Commit the tree as it stands, so each session's diff is its own. | |
| 1 | Opus 5.5, high | Ember Reach exemplar | `Follow docs/teaching-pass/prompts/exemplar.md for Ember Reach.` |
| Gate A | you | Play Ember Reach, starting with the stages listed under "For the owner to look at" in `worlds/unit05-ember.md`. If the lessons are not right, say what is wrong in the same session and have it fixed before going on. | |
| 2 | Opus 5.5, high | Lanternfall exemplar | `Follow docs/teaching-pass/prompts/exemplar.md for Lanternfall.` |
| 3 | Opus 5.5, high | Ligar exemplar | `Follow docs/teaching-pass/prompts/exemplar.md for Ligar.` |
| Gate B | you | Play Lanternfall `q8` and `q10`, and Ligar `q6` and `q9`. | |
| 4 | Opus 5.5, high | Plans, one or two worlds per session | `Follow docs/teaching-pass/prompts/plan.md for Bellows and Kettle.` then `... for Teeter and Tallow.` |
| 5 | Sonnet 5.5, medium | Mirrowen | `Follow docs/teaching-pass/prompts/world.md for Mirrowen.` |
| 6 | Sonnet 5.5, medium | Brinewire | `Follow docs/teaching-pass/prompts/world.md for Brinewire.` |
| 7 | Sonnet 5.5, medium | Verdigris | `Follow docs/teaching-pass/prompts/world.md for Verdigris.` |
| 8 | Sonnet 5.5, medium | Teeter | `Follow docs/teaching-pass/prompts/world.md for Teeter.` |
| 9 | Sonnet 5.5, medium | Bellows | `Follow docs/teaching-pass/prompts/world.md for Bellows.` |
| 10 | Sonnet 5.5, medium | Tallow | `Follow docs/teaching-pass/prompts/world.md for Tallow.` |
| 11 | Sonnet 5.5, medium | Kettle | `Follow docs/teaching-pass/prompts/world.md for Kettle.` |
| 12 | Sonnet 5.5, medium | Close-out: counts, shared docs, every check, the build | `Follow docs/teaching-pass/prompts/closeout.md.` |
| Gate C | you | Play from `docs/teaching-pass/FINAL.md`: the merged "look at" list first, then "still weak". | |

Order rules that matter:

- Steps 5 to 8 (the four worlds that had the 2026-11-06 pass) need only Gate A. They can start while steps 2 to 4 are still running.
- Steps 9 to 11 (the worlds with no earlier pass) should wait for Gate B, because their patterns come from Lanternfall and Ligar.
- Tallow before Kettle: Kettle drops what Tallow owns, and they share two kits.
- Tallow after Ligar: they share `atoms.js`.

After each session: read its hand-back message, look at `git diff --stat`, and commit. If you would rather the agent commit, add to the message: `Commit when the end-of-world checks pass.`

## Keeping usage down

- **One world per session, a new session each time.** A long session pays for its whole history on every turn.
- **Send the one-line message and nothing else.** The agent reads three short files. Do not paste audits, feedback or old prompts; the world file already carries what matters from them.
- **Run sessions one after another.** Running two at once does not save usage and risks collisions in the shared check files. If you want the time back, run at most two, each in its own worktree, from these pairs (no shared kit code): Lanternfall with Ligar; Mirrowen with Brinewire; Verdigris with Bellows; Teeter with Tallow. Kettle runs alone. Never run Teeter with Verdigris, or Tallow, Ligar and Kettle together.
- **If a session stops** (usage limit, context, a crash), start a new session with the same one-line message. It reads `PROGRESS.md` and the world's Record and continues from the first unfinished bench. Kettle, Teeter and Verdigris are the largest and may need this.
- **Do not ask a session to "double-check everything".** The review is built in: each world session runs a cold-read subagent on its first bench and on the finished world, and that subagent sees only what a student sees.
- **Plan sessions are cheap** (they read and write one file). An Opus plan plus a Sonnet build costs less than a Sonnet session that has to redo a bench.
- **Skip the full `npm run verify`.** Sessions run the parts they need; close-out runs everything once.

## What the agents cannot do

No agent sees the screen. A rebuilt table can pass every check and still have a label that is hard to read or a model that is hard to follow. That is why each world file ends with "For the owner to look at" and why the gates exist. If you find a defect when playing, send a Sonnet session one line: `In <World> <quest> stage <n>, <what you saw>. Fix it following docs/teaching-pass/BRIEF.md; the plan row is in docs/teaching-pass/worlds/<file>.` That is a small session.

The world files' notes were written from stage text, not from play. Agents are told to treat each note as a lead to confirm. If you know a note is wrong, delete it from the world file before the session runs.

## Decisions recorded for the agents (edit `BRIEF.md` section 2 to change one)

- Beyond-exam content stays and is fixed to the standard.
- Agents may cut, merge, move and add stages and quests without asking; removed work is archived under `archive/2026-11-11/<world>/`.
- No agent opens the browser.
- Limiting reactant and activation energy leave Ember Reach; limiting reactant moves from Kettle `q1` to Kettle `q6`.
- Tallow owns compound against mixture, percent composition and empirical formula; Kettle stops repeating them.
