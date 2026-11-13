# Erebus anatomy: how Quest 1 is built, and how a second quest fits beside it

Contents: 1. What the player does · 2. Files · 3. Stage data · 4. Grading and XP · 5. Answers the server
can grade · 6. Story data and copy rules · 7. Where `q1` is hardwired · 8. Target shape for side quests ·
9. Checks

Where this file and the code disagree, the code wins. Open the named file and confirm before relying on a
detail; line numbers are deliberately not given because they drift.

## 1. What the player does

1. Opens the contract from the Contract Board, the Star Map or the Bridge (`#/quest`).
2. At `3D On` the Avalon flies to Erebus (`three/voyage.js`) and the player walks a desert basin with
   twenty pylon sites. A waypoint leads to the next uncleared pylon. Pressing `[E]` at a pylon fires
   `pylon:interact`; a pylon beyond the next uncleared one refuses with a toast.
3. The pylon opens the **chamber**: a 3D molecule pair (`quest3d/viewer.js`, `molecule.js`) with a console
   (`quest3d/console.js`) carrying the prompt, hint ladder, nav and submit. A Vess transmission of at most
   two sentences opens the stage.
4. The player drags an arrow from one glowing site to another (or two arrows in order). Grading is
   immediate, in the browser. A miss gets a titled reason. A solve plays the reaction animation, then
   shows `+N XP`, the one-line explanation and the **chemistry card**.
5. Back on the ground the pylon is lit (`world.setClearedStages`). Milestone stages (7, 10, 20) play a
   short cinematic.
6. After stage 20: completion bonus, a clue for the Case File, and a five-part debrief from Vess that
   names the real chemistry (electrons, curved arrows, steric hindrance, mechanisms).

At `3D Off` there is no walk: the same stages run from a DOM view (`fallback2d/stages.js`) with the same
payload and the same grader.

Pedagogical shape (`docs/quests/q1-charge-gardens.md`): stages 1 to 7 one arrow and geometry; 8 to 10
three molecules with bystanders to ignore; 11 to 20 two ordered arrows. Each movement adds one rule.

## 2. Files

| File | Role |
|---|---|
| `src/screens/quest.js` | The quest screen: progress restore, world HUD, chamber deploy and exit, `loadStage`, hint ladder (`HINT_RUNGS`), grading call, miss display, payoff, chemistry card, milestones, completion and debrief. `AUTO_MODAL_STAGES` lists the stages whose briefing opens by itself. |
| `src/quest3d/evaluator.js` | `STAGE_CONFIGS` (geometry, answers, reaction animation), `STAGE_COPY` (title, shape, prompt, hints, concept, chem), `evaluateStageLocally`, `diagnoseMiss`, `TOTAL_STAGES`, `TOTAL_QUEST_XP`. Pure: Node imports it. |
| `src/quest3d/molecule.js`, `viewer.js`, `isosurface.js`, `anchors.js`, `interactions/` | The chamber's 3D mechanic. |
| `src/quest3d/console.js` | Moves the stage's DOM deck onto the in-world console. `mountConsole` must be the last statement of the stage render. |
| `src/fallback2d/stages.js` | The 3D Off inputs. |
| `src/story/quest1.js` | `QUEST1_STORY`: contract, arrival, briefing, guild openers, per-stage transmissions and `onClear` lines, milestones, clue, debrief. |
| `src/story/lore.js`, `saga.js`, `trinkets.js` | Case File notebook ids (`erebus:contract`, `erebus:pylon:<n>`, `erebus:milestone:<n>`, `erebus:debrief:<n>`), clues, prerequisites keyed by contract id. |
| `src/ui/field-manual.js` | One collectible term per stage (`road: 'campaign'`), in plain words. |
| `src/ui/gardens-map.js` | The relay map of cleared pylons. |
| `src/screens/contracts.js`, `starmap.js`, `bridge.js`, `quarters.js`, `casefile.js` | Where the contract is listed and its progress read. |
| `src/three/world.js` + `src/three/erebus/` + `src/three/world-data/erebus.json` | The walkable world; `tools/generate-erebus-world.mjs` lays it out. |
| `api/[...route].js` | The Vercel proxy and local mock: `CANONICAL_STAGES_20`, `quest/manifest`, `quest/grade`, `quest/complete`, the epilogue. |
| `apps-script/Quests.gs` | The server: `DEFAULT_QUEST`, `DEFAULT_STAGES` (with `answer_json`), `getManifest` (strips answers), `startQuest`, `gradeStage`, `getHint`, `completeQuest`. |
| `src/guest.js` | Guest mode's local answers for the same routes. |

## 3. Stage data

One Erebus stage, merged from `STAGE_CONFIGS` and `STAGE_COPY` (abridged; read stage 5 in
`evaluator.js` for the real record):

```js
{
  stageIndex: 4,
  shape: '...',                             // kicker: the kind of problem, e.g. 'FIRST CONTACT'
  title: 'Stage 5 — The Trap',
  prompt: 'Two blue sites pull equally, but one is blocked. Rotate the chamber to find the unblocked route.',
  hints: [                                   // nudge, narrow, the move
    'Both blue sites pull equally hard. Rotate the view to see which one has an open approach.',
    '...', '...'
  ],
  hint: /* === hints[0], legacy field */,
  conceptTiming: 'intro',                    // or 'reward'
  concept: { badge, title, intro, pills: [{ type, html }], action },   // controls and visual code only
  chem: { badge: 'CHEMISTRY', title, body }, // after the solve; real words; <= 3 sentences
  xp: 25,
  moleculeId, expectedFrom, expectedTo, blockedAnchor,   // the mechanic's own answer fields
  reaction: { ..., explanation: 'One plain sentence about what just happened.' }
}
```

The bundled client data is the truth for everything the player sees and is graded on; the manifest from
the server is trusted only for transport fields. A stale Sheet row once swapped one stage's molecule for
another's, which is why.

## 4. Grading and XP

- **The browser grades first** (`evaluateStageLocally`), so the player waits on nothing. It returns
  `{ correct, xpAwarded, blocked?, wrongOrder?, incomplete?, message? }`. `diagnoseMiss` turns a wrong
  payload into `{ title, body }` (`BACKWARDS`, `TWO GIVERS`, `TWO TAKERS`, `PATH BLOCKED`,
  `RIGHT MOVES, WRONG ORDER`, `NOT FINISHED`); the generic `NOT QUITE` is a last resort.
- **The server confirms** (`api.gradeStage(questId, stageIndex, payload, elapsedMs, hintUsed, gfxTier)`).
  It holds the answers (`answer_json`, never sent to the client), logs the submission, advances
  `Progress.stage_reached`, and pays the stage's flat XP only if no earlier correct submission exists.
  `session.addXp` is given the server's figure.
- `max_attempts` is 9999 and `hint_cost` is 0: nothing locks a player out and hints are free.
- Hint rungs: 1 always open; 2 after one miss or 45 s; 3 after two misses. Using rung 3 clears the
  CLEAN streak, which is display only.
- `quest/complete` is idempotent, pays the completion bonus once and returns the epilogue.
- A sync failure throws `BACKEND_BUSY` and never logs the player out.

## 5. Answers the server can grade

`Quests.gradeStage` already compares several payload kinds generically:

| `kind` | Payload | `answer_json` |
|---|---|---|
| `pick` | `{ anchors: [id] }` | `{ anchors: [id] }` |
| `pick_multi` | `{ anchors: [ids] }` | `{ anchors: [ids], ordered: bool }` |
| `choice` | `{ correct: [id] }` | `{ correct: [id] }` |
| `rank` | `{ order: [ids] }` | `{ order: [ids] }` |
| `chain` | `{ steps: [...] }` | `{ steps: [...] }` (exact) |
| `arrow`, `multi_arrow` | Erebus's own | Erebus's own |

**Design the new mechanic so that a finished stage reduces to a small canonical payload of ids** (a set,
an ordered list, a mapping of slot to piece). The browser turns whatever the player built into that
payload; the server compares it with a generic comparator. This keeps the server grader a few lines per
kind instead of a second copy of the game, which is the only way client and server stay in agreement.

When a stage has more than one correct arrangement, canonicalise in the browser (sort, or map each
arrangement to the outcome it produces) and grade the outcome. If that is impossible, add one new generic
kind to the server (for example `set_map`: every slot holds a member of its allowed set) rather than
quest-specific code. Never grade continuous positions on the server; Erebus's coordinate fallback
(`solMap` in `Quests.gs`) is a relic, not a pattern.

## 6. Story data and copy rules

`QUEST1_STORY` fields a new quest's story module mirrors: `contract { id, title, client, sector, type,
reward, brief, clueAwarded }`, `arrival { cinematic, lines }`, `briefing`, `guildOpeners { earth, air,
fire, water, neutral }`, one entry per stage `{ stage, transmission, onClear }`, `milestones { <stage>:
{ cinematic, line } }`, `clue`, `debrief { clueAward, sections: [{ title, speaker, badge, subtitle, text }] }`.

Rules, checked by `verify:quest` and `verify:story`:

- Every line is Quartermaster Vess over comms or the ship reporting. Diegetic, plain industrial English
  (`docs/story/bible.md` D6), no fantasy coinage.
- A transmission is at most two sentences, contains no withheld word, and **never states the route**
  (which piece goes where). It gives the situation; the prompt gives the goal.
- Stage 1 opens with the player's guild's opener. Every stage has an `onClear` line.
- The enemy is the Fifth Guild (abandoned survey crews, `docs/story/bible.md`); a contract repairs or
  recovers something they left or broke. Nothing is killed and there is no combat in a side quest.
- The contract yields one clue for the Case File at its last stage, and its completion is a prerequisite
  key (`contracts: ['contract_<world>_NN']`) that `saga.js` can read.
- The debrief is where the real chemistry is named: first section closes the contract, the rest each
  take one idea the player used and give its real name and one true sentence about it. Then the
  epilogue gathers them. Keep one source for that copy (Erebus's epilogue lives in three files, which is
  a logged pitfall in `PRODUCT.md`).
- Opening a briefing files it in the Case File (`session.recordNotebook(id)`; ids only).

## 7. Where `q1` is hardwired

Find the current list with:

```bash
grep -rIlE "['\"]q1['\"]|QUEST1_|CANONICAL_STAGES_20|quest3d/evaluator|DEFAULT_STAGES|avalon_q1" src api apps-script tools | grep -v "^src/learn/"
```

At the time of writing:

- **Client:** `screens/quest.js` (`QUEST_ID`), `router.js` (`/quest`, `voyageTargetFor`), `session.js`
  (stage reached, `avalon_q1_stage_reached`), `guest.js`, `screens/contracts.js` (a literal `CONTRACTS`
  array and stat row), `starmap.js`, `bridge.js`, `quarters.js`, `casefile.js`, `demo.js`,
  `story/lore.js`, `ui/field-manual.js`, `ui/gardens-map.js`, `three/stage.js` (`worldFor`,
  `enterWorldScene`).
- **Proxy:** `api/[...route].js` answers every quest route from `CANONICAL_STAGES_20` and ignores the
  quest id.
- **Server:** `Quests.gs` refuses any id but `DEFAULT_QUEST.quest_id`; `Main.gs` defaults a missing id
  to `q1`; `Db.gs` and `Events.gs` read `active_quest`.
- **Checks:** `verify-stages.mjs`, `verify-flows.mjs`, `verify-sync.mjs`, `verify-story.mjs`,
  `verify-geometry.mjs`.

## 8. Target shape for side quests

Leave Erebus's own files where they are; give it a registry entry that points at them. New quests go in
their own folder. If an earlier run of this skill already built this, follow what exists instead.

```
src/contracts/
  registry.js              // CONTRACTS: [{ questId, contractId, code, title, issuer, type, worldKey,
                           //   route, stageCount, totalXp, bonusXp, status, summary, clueId, load() }]
                           // progressFor(questId), the one place screens read contract progress from
  <questId>/
    stages.js              // STAGES (copy + answers + xp), evaluate(i, payload), diagnoseMiss(i, payload),
                           //   solutionFor(i), TOTAL_STAGES, TOTAL_XP, BANNED. PURE: no DOM, no three.
    game3d.js              // the mechanic at 3D On
    game2d.js              // the same stage at 3D Off, same payload
    story.js               // the QUEST1_STORY shape
    screen.js              // render(container): walk HUD, deploy, loadStage, hints, grade, payoff, debrief
src/three/<world>.js + src/three/<world>/ + src/three/world-data/<world>.json
tools/gen-<world>-layout.mjs, tools/verify-<world>.mjs, tools/verify-<questId>.mjs
tools/gen-contract-server.mjs   // writes apps-script/QuestData.gs from every stages.js
docs/quests/<questId>-<slug>.md
```

- **Quest ids** continue the series: `q2`, `q3`. Contract ids are `contract_<world>_NN`. Never reuse an
  id, including a retired one.
- **Route:** `#/contract/:questId`, rendered by the registry entry's `screen.js`. `#/quest` stays Erebus.
- **One source for stage data.** `stages.js` is it. The proxy imports it (as `verify-stages.mjs` already
  imports from `api/`). Apps Script cannot import, so `tools/gen-contract-server.mjs` writes the
  server's quest and stage tables (with `answer_json`) to a generated `.gs` file with a "generated, do
  not edit" header, and the quest's verify script fails if that file is out of date. Do not hand-copy
  stage rows into three files.
- **Server:** make `getManifest`, `startQuest`, `gradeStage`, `getHint` and `completeQuest` look the
  quest up by id in a table that holds Erebus and the generated quests; keep the Erebus branches of
  `gradeStage` byte-for-byte. A quest's `status` (`live`, `sealed`) and its release and close dates stay
  server data.
- **Session:** progress is already keyed by `quest_id` (`session.recordProgress(questId, n)`); replace
  the `q1` literals in the screens with `progressFor(questId)`.
- **Contract Board, Star Map, Bridge:** render from the registry. Remove a sealed placeholder card when
  the real contract takes its place.
- **Field Manual, lore, clean stages:** key by quest (`road: 'campaign'`, ids `<questId>_<n>`; notebook
  ids `<world>:contract`, `<world>:site:<n>`, `<world>:milestone:<n>`, `<world>:debrief:<n>`).
  `session.recordCleanStage` is indexed by stage only today; key it by quest before a second quest uses it.
- **Data shapes are still free to change** (pre-launch, `PRODUCT.md`), but anything saved must merge
  through `src/shared/statemerge.js` and survive `verify:sync`.

## 9. Checks

| Script | Holds |
|---|---|
| `verify:quest` (`tools/verify-stages.mjs`) | Erebus: every stage solvable, reversed answer refused, blocked answer flagged, wrong order named, three distinct hint rungs, withheld words absent from play copy, chemistry card present and at most three sentences, intro card free of withheld words, client and proxy agree, story has a line per stage, guild openers, milestones. **Copy this file's structure for `tools/verify-<questId>.mjs`.** |
| `verify:geometry` | Erebus's reaction animations are chemically sane (valence, bond lengths, no overlap). Write the equivalent for the new payoff animation: whatever it draws must obey the rule it teaches at every frame. |
| `verify:flows` | The API contract end to end against the local mock: wrong answer, right answer, replay pays nothing, completion idempotent. Add the new quest's stages. |
| `verify:sync` | State merge and guest mode. |
| `verify:story` | Story data, clue wiring, notebook ids. |
| `verify:console` | The chamber console never covers more than a quarter of the view. Apply the same limit to the new game's HUD. |
| `verify:progression`, `verify:docs`, `verify:galaxy`, `verify:voyage` | Levels and commendations, counts in `PRODUCT.md`, the galaxy chart, the flight to each world. |

The new quest's own verify script must also check: the intended solution of every stage grades correct
and pays the configured XP; every mistake listed in the spec is refused **with its own diagnosis**; no
stage is passable by a payload that ignores the stage's new rule (replay the previous stage's style of
answer and require a refusal); the 3D Off view produces the same payload for the same solution; XP sums
to the registry's total; the generated server file is current. Add it to the `verify` chain in
`package.json`.
