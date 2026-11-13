/**
 * Unit 11 · Bench 5 — Steps (q5-steps)
 *
 * CED 5.7 (Reaction Mechanisms), 5.8 (Reaction Mechanism and Rate Law),
 * 5.9 (Pre-Equilibrium Approximation), 5.10 (Multistep Reaction Energy Profile).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import {
  rateTable,
  kvesselFixture,
  collviewFixture,
  rateboardFixture,
  kprofileFixture,
  plaqueFixture,
  stackFixture,
  stackRead,
  eqn,
  stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\belementary step\b/i, introducedAt: 1 },
  { term: /\bintermediate\b/i, introducedAt: 2 },
  { term: /\brate-determining step\b/i, introducedAt: 3 }
];

const SPEAKER = 'Vess';

const widget = {
  type: 'table',
  inspect() { return []; }
};

function toolNoteFor() {
  return '';
}

const DEBRIEF = {
  title: 'Bench 5 cleared',
  body: 'Elementary steps sum to the overall equation, intermediates cancel out, and the slowest step sets the rate law.',
  filed: 'Filed: the additive runs in two elementary steps; the slow first step sets the rate law.'
};

const TARGET_SUM = {
  lhs: [[1, 'NO₂'], [1, 'CO']],
  rhs: [[1, 'NO'], [1, 'CO₂']],
  dH: 0
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-sum-steps',
    title: 'Adding Elementary Steps',
    briefing: {
      speaker: SPEAKER,
      body: 'Most reactions happen as a series of single collisions called elementary steps. Added together, the steps must give the overall reaction.'
    },
    prompt: 'What overall reaction do these two elementary steps produce?',
    widget,
    table: rateTable({
      pieces: [
        eqn('e1', { x: 25, y: 18 }, [[2, 'NO₂']], [[1, 'NO₃'], [1, 'NO']], 0),
        eqn('e2', { x: 25, y: 38 }, [[1, 'NO₃'], [1, 'CO']], [[1, 'NO₂'], [1, 'CO₂']], 0)
      ],
      fixtures: [
        stackFixture('wanted', { x: 126, y: 28 }, {
          tray: 'stack',
          target: TARGET_SUM,
          hideSum: false,
          w: 44,
          h: 44
        })
      ],
      zones: {
        trays: [
          { id: 'stack', label: 'The stack', at: { x: 76, y: 30 }, size: { w: 48, h: 46 }, cell: 46, cellH: 14 }
        ]
      }
    }),
    hints: [
      'Move both elementary step cards into "The stack" tray.',
      'NO₃ appears once on the right of Step 1 and once on the left of Step 2, so it cancels.',
      'Add the left sides of the two steps and the right sides, then remove whatever appears on both.'
    ],
    check(state) {
      const r = stackRead(state.table, 'wanted');
      if (r.empty) return { ok: false, notYet: true, msg: 'Move both elementary step cards into "The stack".' };
      if (!r.matches) return { ok: false, msg: 'Both steps are needed so NO₃ and one NO₂ cancel.' };
      return { ok: true };
    },
    reward: {
      log: 'Elementary steps sum to NO2 + CO -> NO + CO2.',
      title: 'Elementary Steps',
      body: 'Each elementary step shows one molecular collision event, and their sum gives the overall reaction.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-intermediate',
    title: 'Spotting the Intermediate',
    prompt: 'Which species is an intermediate in this two-step path?',
    widget,
    table: rateTable({
      pieces: [
        stmt('NO3', 'NO₃', { x: 112, y: 9 }),
        stmt('NO2', 'NO₂', { x: 112, y: 24 }),
        stmt('CO', 'CO', { x: 112, y: 39 })
      ],
      fixtures: [
        plaqueFixture('steps', 'Two-step path', { x: 46, y: 28 }, [
          'Step 1: NO₂ + NO₂ → NO₃ + NO',
          'Step 2: NO₃ + CO → NO₂ + CO₂',
          'Overall: NO₂ + CO → NO + CO₂'
        ], { w: 78 })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Intermediate', at: { x: 112, y: 52 }, size: { w: 46, h: 8 } }]
      }
    }),
    hints: [
      'Compare the two steps with the overall equation.',
      'An intermediate is produced in an earlier step and consumed in a later step, so it never appears in the overall equation.',
      'Look for the species made in Step 1 and used up in Step 2.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Intermediate".' };
      if (card.id === 'NO2') return { ok: false, msg: 'NO₂ is a starting reactant present before Step 1 begins.' };
      if (card.id === 'CO') return { ok: false, msg: 'CO is a starting reactant in the overall equation.' };
      return { ok: true };
    },
    reward: {
      log: 'NO3 is the reaction intermediate.',
      title: 'Reaction Intermediate',
      body: 'An intermediate is formed in one elementary step and consumed in a later step, cancelling from the overall equation.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-rds',
    title: 'The Bottleneck',
    briefing: {
      speaker: SPEAKER,
      body: 'In a two-step mechanism the first step makes an intermediate, I, and the second turns I into the product, P.'
    },
    prompt: 'Which step controls how fast the final product P forms?',
    widget,
    table: rateTable({
      pieces: [
        stmt('slow', 'The slower step', { x: 116, y: 9 }),
        stmt('fast', 'The faster step', { x: 116, y: 24 }),
        stmt('equal', 'Both steps equally', { x: 116, y: 39 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 48, y: 28 }, {
          title: 'Two-step vessel',
          mode: 'twostep',
          twoStep: { mode: 'seq', k1f: 0.02, k1r: 0, k2: 0.5, a0: 1.0, b0: 0 },
          twoStepDial: {
            label: 'Step speeds',
            options: ['Slow 1, Fast 2', 'Fast 1, Slow 2'],
            presets: [
              { label: 'Slow 1, Fast 2', k1f: 0.02, k2: 0.5 },
              { label: 'Fast 1, Slow 2', k1f: 0.5, k2: 0.02 }
            ]
          },
          tMax: 60,
          w: 84,
          h: 42
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Controls rate', at: { x: 116, y: 52 }, size: { w: 42, h: 8 } }]
      }
    }),
    hints: [
      'Run the vessel under both presets on the "Step speeds" dial.',
      'Compare how quickly P forms under the two settings, and how much I builds up in each.',
      'Think of the steps as a line of people passing a bucket: what limits how fast buckets arrive?'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Controls rate".' };
      if (card.id === 'fast') return { ok: false, msg: 'Making one step fast still leaves product P waiting on the slow step.' };
      if (card.id === 'equal') return { ok: false, msg: 'The product line is not the same under both settings, so the two steps are not equally important.' };
      return { ok: true };
    },
    reward: {
      log: 'The slowest step is the rate-determining step.',
      title: 'Rate-Determining Step',
      body: 'The slowest step in a mechanism acts as the bottleneck and is called the rate-determining step.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-elementary-law',
    title: 'One-Step Collision Law',
    briefing: {
      speaker: SPEAKER,
      body: 'For a single elementary step, the rate depends directly on how many molecules must collide in that step.'
    },
    prompt: 'What is the rate law for the elementary step 2 A → B?',
    widget,
    table: rateTable({
      fixtures: [
        collviewFixture('view', { x: 42, y: 28 }, {
          title: 'Elementary step: 2 A → B',
          mode: 'elementary',
          pairs: [
            { label: '2 A collide', speed: 1.0, angle: 0, reacts: true, note: 'Two A molecules meet' }
          ],
          w: 70,
          h: 42
        }),
        rateboardFixture('board', { x: 114, y: 28 }, {
          title: 'Elementary rate law',
          species: ['A'],
          maxOrder: 2,
          w: 50,
          h: 26
        })
      ]
    }),
    hints: [
      'Watch how many A molecules must meet in this single elementary collision.',
      'Ask how doubling [A] changes the chance of meeting for each of the particles that must collide.',
      'Each colliding particle contributes its own factor of [A] to how often the collision happens.'
    ],
    check(state) {
      const ordA = Math.round(state.table.fixtures.board?.dials?.o0?.value ?? 0);
      if (ordA === 0) return { ok: false, notYet: true, msg: 'Set the order of A on the Elementary rate law board.' };
      if (ordA === 1) return { ok: false, msg: 'Two A molecules must collide together in this elementary step, not one.' };
      return { ok: true };
    },
    reward: {
      log: 'Elementary step 2 A -> B has rate = k[A]^2.',
      title: 'Elementary Rate Law',
      body: 'Unlike an overall equation, a single elementary step has orders equal to the number of colliding reactants.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-match-mechanism',
    title: 'Testing a Mechanism',
    prompt: 'Which mechanism matches the measured rate law?',
    widget,
    table: rateTable({
      pieces: [
        stmt('m1', '1 (slow): 2 NO₂ → NO₃+NO; 2 (fast): NO₃+CO → NO₂+CO₂', { x: 112, y: 12 }),
        stmt('m2', 'Single slow step: NO₂ + CO → NO + CO₂', { x: 112, y: 28 })
      ],
      fixtures: [
        plaqueFixture('obs', 'Lab measurements', { x: 38, y: 28 }, [
          'Overall: NO₂ + CO → NO + CO₂',
          'Measured: rate = k[NO₂]²',
          'Changing [CO] has zero effect'
        ], { w: 66 })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Valid mechanism', at: { x: 112, y: 48 }, size: { w: 58, h: 10 } }]
      }
    }),
    hints: [
      'Find the slow step in each candidate mechanism.',
      'Read the plate: which concentration matters, and to what power?',
      'A slow step is an elementary step, so its colliding particles give its rate law; compare that with the plate.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a mechanism card in "Valid mechanism".' };
      if (card.id === 'm2') return { ok: false, msg: 'A single step NO₂ + CO would give rate = k[NO₂][CO], which depends on [CO].' };
      return { ok: true };
    },
    reward: {
      log: 'Only a slow 2 NO2 step gives rate = k[NO2]^2.',
      title: 'Matching Rate Laws',
      body: 'A valid mechanism must sum to the overall equation and have a slow step whose rate law matches experiment.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-pre-eq',
    title: 'Fast Pre-Equilibrium',
    briefing: {
      speaker: SPEAKER,
      body: 'Step 1, 2 NO ⇌ N₂O₂, runs fast in both directions, so the amount of N₂O₂ stays in step with the NO. Step 2, N₂O₂ + O₂ → 2 NO₂, is slow.'
    },
    prompt: 'What is the rate law of the overall reaction, in terms of NO and O₂?',
    widget,
    table: rateTable({
      fixtures: [
        kvesselFixture('v1', { x: 44, y: 28 }, {
          title: 'Pre-equilibrium run',
          mode: 'twostep',
          twoStep: { mode: 'preeq', k1f: 0.4, k1r: 0.3, k2: 0.04, a0: 1.0, b0: 0 },
          tMax: 60,
          w: 76,
          h: 42
        }),
        rateboardFixture('board', { x: 118, y: 28 }, {
          title: 'Overall rate law',
          species: ['NO', 'O₂'],
          maxOrder: 2,
          w: 54,
          h: 30
        })
      ]
    }),
    hints: [
      'Run the vessel and watch how much N₂O₂ there is while the product forms.',
      'The slow step sets the rate, but the intermediate it uses cannot appear in the answer.',
      'Replace the intermediate by what it stays in step with, then count how many NO and how many O₂ remain.'
    ],
    check(state) {
      const d = state.table.fixtures.board?.dials || {};
      const o0 = Math.round(d.o0?.value ?? 0); const o1 = Math.round(d.o1?.value ?? 0);
      if (o0 === 0 && o1 === 0) return { ok: false, notYet: true, msg: 'Set the order of NO and of O₂ on the board.' };
      if (o0 === 1 && o1 === 1) return { ok: false, msg: 'That counts the NO once; the intermediate N₂O₂ is made from two NO.' };
      if (o0 === 0) return { ok: false, msg: 'The NO is in the rate law: the slow step uses N₂O₂, and N₂O₂ is made from NO.' };
      if (o1 === 0) return { ok: false, msg: 'O₂ collides in the slow step, so its concentration is in the rate law.' };
      if (o0 !== 2 || o1 !== 1) return { ok: false, msg: 'Count the particles in the slow step: how many NO and how many O₂ make up its reactants?' };
      return { ok: true };
    },
    reward: {
      log: 'Overall rate = k[NO]²[O₂].',
      title: 'Pre-Equilibrium Rate Law',
      body: 'The slow step uses N₂O₂ and O₂, and N₂O₂ stays proportional to [NO]², so rate = k[NO]²[O₂]. An intermediate never appears in the overall rate law.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-two-hump-profile',
    title: 'Two Hills, One Slow Step',
    prompt: 'What is the activation energy of the step that sets the overall rate?',
    entry: { id: 'ea_rds', label: 'Ea of slow step', unit: 'kJ/mol' },
    widget,
    table: rateTable({
      fixtures: [
        kprofileFixture('prof', { x: 75, y: 28 }, {
          title: 'Two-step energy profile (kJ/mol)',
          reactants: 30,
          ts: 95,
          valley: 55,
          ts2: 75,
          products: 15,
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Find the level of each peak and of the valley between them on the profile.',
      'Each step starts from the level just before it and climbs to its own peak.',
      'The step that sets the rate is the one that is hardest to get over.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea_rds');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the activation energy in kJ/mol.' };
      if (Math.abs(val - 65) <= 0.5) return { ok: true };
      if (Math.abs(val - 20) <= 0.5) return { ok: false, msg: 'That is the climb of the second step; compare it with the climb of the first.' };
      if (Math.abs(val - 95) <= 0.5) return { ok: false, msg: 'The first peak is at 95, but the climb starts at the reactants level, not at zero.' };
      return { ok: false, msg: 'Check the climb of each step: from where it starts to where its own peak is.' };
    },
    reward: {
      log: 'Slow step Ea = 95 - 30 = 65 kJ/mol.',
      title: 'Two-Step Profile',
      body: 'The first step climbs 65 kJ/mol and the second only 20, so the first is the rate-determining step. The valley between the hills holds the intermediate.'
    }
  }
];

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [put('e1', 'tray:stack'), put('e2', 'tray:stack')],
  [put('NO3', 'slot:ans')],
  [runFx('v1'), dial('v1', 'stepSpeed', 2), runFx('v1'), put('slow', 'slot:ans')],
  [dial('board', 'o0', 2)],
  [put('m1', 'slot:ans')],
  [dial('board', 'o0', 2), dial('board', 'o1', 1)],
  [{ type: { entry: 'ea_rds', value: '65' } }]
];

export const MISSES = [
  [put('e1', 'tray:stack')],
  [put('NO2', 'slot:ans')],
  [put('fast', 'slot:ans')],
  [dial('board', 'o0', 1)],
  [put('m2', 'slot:ans')],
  [dial('board', 'o0', 1), dial('board', 'o1', 1)],
  [{ type: { entry: 'ea_rds', value: '20' } }]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() {}
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}
