/**
 * _template.js — The contract every Learn bench module implements.
 *
 * Read PRODUCT.md "Building a Learn world" before writing one. This file is only the shape.
 *
 * Copy this file to `src/learn/quests/<unitNN>/<questId>.js`, point the quest's `module` in its
 * world chart (`src/learn/worlds/<unitNN>-*.js`) at it, set `status: 'live'`, and keep the stage
 * count in step everywhere it lives (see PRODUCT.md, "The stage count lives in five places").
 *
 * Things the host guarantees before mount() is called:
 *   - the world and the quest are both open (gating already checked)
 *   - `container` is empty and is the only DOM the quest should write to
 *   - the HUD, router and soundscape are already running
 *
 * Things the quest must not do:
 *   - award XP. The Learn track pays none, in any module, ever. No `addXp`, `gradeStage`,
 *     `completeQuest` or `recordProgress`; `verify:learn` fails the build.
 *   - leave the 3D stage in quest mode on dispose.
 *   - carry its own practice problems. They live in the question bank
 *     (`src/learn/bank/<unitNN>.json`, shape in `learn/bank.js`): two problems after the bench,
 *     an optional guided worked problem if the bench is computational, and the world's end set.
 *     `verify:learn` fails a quest that still exports `PRACTICE`.
 *
 * What a bench is:
 *   - Usually 8 stages (6 for a recap). One idea per stage; a stage that only repeats another is
 *     cut, an application to a new case is kept. The last stage is normally a sealed sample.
 *   - One predict stage on the click (`predict: true`: the question and the guesses, no
 *     instrument, no runnable control), tested by the NEXT stage, which quotes the locked guess
 *     in its prompt and reward (`engine/predict.js`). A guess is never graded.
 *   - An open tabletop graded on what is on the table. Every drag has a two-tap twin.
 *   - A boss (`arena: 'boss'`) is the only place a foe, a health bar and Integrity appear. It has
 *     five phases that re-test earlier ideas on a new case, an `encounter` per phase, and no lead
 *     line. An ordinary stage has no `encounter` and no foe: a wrong answer is a missed trial
 *     with a reason, never an attack.
 *
 * Things every stage owes the player:
 *   - a `prompt`: ONE sentence, at most 25 words, no "!", stating the objective and never the
 *     route. A control it names is quoted: Press "Fire Beam".
 *   - exactly three `hints`, one sentence each: 1 = which control to use (how it works is
 *     printed on the object, never only here), 2 = what to look at or compare, 3 = the method
 *     or structure, never the answer or the arithmetic result. A predict stage has no tool, so
 *     all three spend themselves on the science.
 *   - a `check(state)` returning `{ ok: true }`, `{ ok: false, notYet: true, msg }` for a blank
 *     bench, or `{ ok: false, msg }` where `msg` names what the table SHOWS that disagrees. It
 *     never gives the reasoning, the rule, the capacity or the answer (`verify:learn` searches for
 *     the answer; read every refusal for the rest).
 *   - a `reward` card of 1 to 3 sentences (about 45 words) naming the idea just worked out in
 *     real terms. A term is real only once a card has defined it: list it in `VOCABULARY`.
 *   - for a figure the player works out: `entry: { id, label, unit }` and `entryNumber(...)` in
 *     `check`, with the slips a student makes kept as refusals the verify scripts check.
 *
 * Things every bench owes the world (outside this file): a lead line in `engine/stage-story.js`
 * (one sentence, at most 20 words, not on a boss), a Tour step for every new kind of piece or
 * tool, a story animation in `story/quest-story.js`, and its bank entry.
 *
 * The working shape is `unit05/q3-enthalpy.js`: copy its imports, `createRunner` mount and
 * `SOLUTIONS` / `MISSES` helpers (`put`, `dial`, typed entries) rather than inventing new ones.
 */

import { createRunner, stateFromScript, entryNumber } from '../engine/stagerunner.js';
import { remember, recall } from '../engine/predict.js';
import { applyNotes } from '../table/notes.js';
// This file sits one folder above the unit folders, so these paths lose one `../` when it is copied
// into `quests/<unit>/` (`'../../engine/stagerunner.js'`). Import the kit's table builders from
// '../../table/kits/<kit>.js'.

export const meta = { stageCount: 8 };

/** Terms this bench defines: a pattern for the term and the (1-based) stage whose reward card earns it. */
export const VOCABULARY = [
  // { term: /\bisotope\b/i, introducedAt: 5 }
];

/** Built quests whose words this bench uses. Real quest ids only (`verify:learn` checks). */
export const BUILDS_ON = [
  // 'unit01/q2-core'
];

export function toolNoteFor() { return null; }

export const STAGES = [
  {
    id: 's1-example',
    title: 'Example',
    prompt: 'Place the sample whose atoms are all of one kind in the tray.',
    // table: <kit>Table({ pieces: [...], fixtures: [...], zones: {...} }),
    hints: [
      'Use the lens and the dish.',
      'Compare the picture of each sample with the others.',
      'Look at how many different kinds of atom each picture shows.'
    ],
    check(state) {
      // return { ok: true } on the right table;
      // return { ok: false, notYet: true, msg } on a blank one;
      // otherwise { ok: false, msg } naming what the table shows.
      return { ok: false, notYet: true, msg: 'Nothing is in the tray yet.' };
    },
    reward: {
      title: 'Element',
      body: 'A sample whose atoms are all of one kind is an element. Two kinds of atom together make a compound or a mixture.',
      log: 'One kind of atom in the tray.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = { title: '', body: '' };

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

/** One script per stage, run through the real action path by verify:learn and verify:table. A typed figure is { type: { entry, value } }. */
export const SOLUTIONS = [
  // [put('sample-a', 'slot:tray')]
];

/** One script per stage: a plausible wrong answer (every slip a student makes). Each must be refused, and must say why. */
export const MISSES = [
  // [put('sample-b', 'slot:tray')]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}
