/**
 * _template.js — The contract every Learn quest game module implements.
 *
 * ENCOUNTER-FIRST DESIGN:
 * Every quest is built around what the player faces (who you fight, what they hold,
 * why the chemical move beats them). The chemistry is never an abstract math quiz;
 * operating the instrument IS the combat move that resolves the field encounter.
 *
 * Copy this file to `src/learn/quests/<worldId>/<questId>.js`, build the encounter,
 * point the quest's `module` at it in its world chart and set status to 'live'.
 *
 * Things the host guarantees before mount() is called:
 *   - the world and the quest are both open (gating already checked)
 *   - `container` is empty and is the only DOM the quest should write to
 *   - the HUD, router and soundscape are already running
 *
 * Things the quest must not do:
 *   - award XP. The Learn track pays none, in any module, ever.
 *   - write to `session.progress` or call `api.gradeStage` / `api.completeQuest`.
 *   - leave the 3D stage in quest mode on dispose.
 *   - run its own practice problems inline. Export `PRACTICE` and `learn/practice.js`
 *     will show it after the world's benches are done.
 *
 * Things every stage owes the player:
 *   - an `encounter` declaration: foe species/name, objective, and chemical core.
 *   - an objective stating the goal without prescribing the button path.
 *   - a three-rung hint ladder: Nudge (guiding question), Narrow it down (half the field),
 *     Show the move (method only, no answer numbers or leak words).
 *   - refusal messages on check() that do not leak target numbers (2-20 or word forms).
 *   - a `reward` card of 1-3 sentences naming the newly earned concept in real terms.
 */

import { LearnFrame } from '../engine/frame.js';

export const meta = {
  stageCount: 8,
  arena: 'bench' // 'bench' | 'boss'
};

/**
 * Encounter declarations and stage data.
 * Every stage defines who is engaged, what they hold, and why the move works.
 */
export const STAGES = [
  {
    encounter: {
      foe: 'Salt Husk',
      species: 'salt husk',
      name: 'Rogue Crystalline Husk',
      objective: 'Separate the unbonded ionic mixture before the lattice hardens.',
      chemicalCore: 'Heterogeneous mixtures can be separated mechanically; pure compounds cannot.'
    },
    prompt: 'Sort each specimen into its matching category before sealing the chamber.',
    hintLadder: [
      { label: 'Nudge', text: 'Does this sample have uniform composition, or can you see distinct grains?' },
      { label: 'Narrow it down', text: 'Look for multiple phases versus a single continuous chemical phase.' },
      { label: 'Show the move', text: 'Classify single elements, fixed compounds, and physical mixtures into separate trays.' }
    ],
    reward: {
      title: 'Lattice Dispersed',
      body: 'The mixture separated cleanly. Physical mixtures yield to mechanical sorting without breaking chemical bonds.',
      log: 'Specimen classified. The husk destabilized into inert salt grains.'
    }
  }
];

export const SOLUTIONS = [
  // Graded solutions tested by verify:learn
];

export const MISSES = [
  // Diagnosed incorrect states tested by verify:learn
];

/**
 * THE PRACTICE SET. Five problems, owed by every live quest.
 * Offered once the world is finished, XP-free and optional.
 */
export const PRACTICE = [
  {
    id: 'p1',
    question: 'Sample question statement describing a chemical phenomenon?',
    options: [
      { id: 'a', label: 'Correct chemical explanation' },
      { id: 'b', label: 'Common misconception or distractor' },
      { id: 'c', label: 'Alternative distractor' }
    ],
    answer: 'a',
    explanation: 'Detailed explanation clarifying why choice A is chemically valid and why others fail.'
  },
  {
    id: 'p2',
    question: 'Sample question statement 2?',
    options: [
      { id: 'a', label: 'Distractor 1' },
      { id: 'b', label: 'Correct chemical explanation' },
      { id: 'c', label: 'Distractor 2' }
    ],
    answer: 'b',
    explanation: 'Detailed explanation of why choice B is correct.'
  },
  {
    id: 'p3',
    question: 'Sample question statement 3?',
    options: [
      { id: 'a', label: 'Correct chemical explanation' },
      { id: 'b', label: 'Distractor 1' },
      { id: 'c', label: 'Distractor 2' }
    ],
    answer: 'a',
    explanation: 'Detailed explanation of why choice A is correct.'
  },
  {
    id: 'p4',
    question: 'Sample question statement 4?',
    options: [
      { id: 'a', label: 'Distractor 1' },
      { id: 'b', label: 'Correct chemical explanation' },
      { id: 'c', label: 'Distractor 2' }
    ],
    answer: 'b',
    explanation: 'Detailed explanation of why choice B is correct.'
  },
  {
    id: 'p5',
    question: 'Sample question statement 5?',
    options: [
      { id: 'a', label: 'Distractor 1' },
      { id: 'b', label: 'Distractor 2' },
      { id: 'c', label: 'Correct chemical explanation' }
    ],
    answer: 'c',
    explanation: 'Detailed explanation of why choice C is correct.'
  }
];

/**
 * @param {HTMLElement} container empty element to render into
 * @param {{
 *   world: object,
 *   quest: object,
 *   stagesCleared: number,
 *   isComplete: boolean,
 *   reportStage: (stageIndex: number) => void,
 *   reportComplete: () => void,
 *   exit: () => void
 * }} ctx
 * @returns {{dispose: () => void}}
 */
export function mount(container, ctx) {
  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let state = {};

  const frame = new LearnFrame(container, {
    stageCount: STAGES.length,
    rewards: STAGES.map(s => s.reward),
    onSubmit: () => submit(),
    onExit: () => ctx.exit()
  });

  function renderStage(i) {
    index = i;
    const stage = STAGES[i];
    frame.setStage(i, {
      prompt: stage.prompt,
      hints: stage.hintLadder,
      encounter: stage.encounter
    });
  }

  function submit() {
    // Check locally:
    // const res = check(state);
    // if (!res.ok) { frame.showError(res.reason); return; }
    // ctx.reportStage(index);
    // if (index === STAGES.length - 1) ctx.reportComplete();
    // else renderStage(index + 1);
  }

  renderStage(index);

  return {
    dispose() {
      frame.dispose();
    }
  };
}
