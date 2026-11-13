/**
 * boss-flare.js — Learn world 11 elite: THE FLARE.
 *
 * The runaway cracking tower spiking across Quicklight's storm belt. Five phases
 * re-test each bench's core idea on a fresh flare case, with The Flare watching
 * from the top-right corner of the tabletop (`x >= 126.5, y <= 23.5`).
 *
 * Every figure comes from `planFoe(1..5)` in `engine/ratedata.js`.
 * Clearing the last phase files `clue_quicklight_flare`. Pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { planFoe } from '../../engine/ratedata.js';
import {
  rateTable,
  kvesselFixture,
  rateslogFixture,
  rateboardFixture,
  kprofileFixture,
  plaqueFixture,
  stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit11/q1-watch',
  'unit11/q2-law',
  'unit11/q3-time',
  'unit11/q4-collide',
  'unit11/q5-steps',
  'unit11/q6-shortcut'
];

export const CLUE_ID = 'clue_quicklight_flare';
const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const FLARE_FOE = [{ id: 'flare', label: 'The Flare' }];

const widget = { type: 'table', inspect() { return []; } };

const p1 = planFoe(1);
const p2 = planFoe(2);
const p3 = planFoe(3);
const p4 = planFoe(4);
const p5 = planFoe(5);

const DEBRIEF = {
  title: 'The Flare stabilized',
  body: 'You read the cracking tower rate, rate law, half-lives, ignition barrier, and mechanism, shutting down the runaway spike.',
  filed: 'Filed: the tower was seeded with a catalytic powder whose slow intermediate step matches the Fifth additive signature.'
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 'p1-rate',
    title: 'Phase 1 · Tower Surge',
    prompt: 'What is the average rate of consumption between 5 s and 15 s?',
    entry: { id: 'rate', label: 'Average rate (5–15 s)', unit: 'mol/(L·s)' },
    widget,
    table: rateTable({
      fixtures: [
        kvesselFixture('v1', { x: 62, y: 32 }, {
          title: p1.species,
          order: 1,
          k: 0.09,
          a0: 0.80,
          tMax: 25,
          mode: 'reactant',
          freezeAt: 15,
          markedPoints: [
            { t: p1.t1, v: p1.c1, label: '5 s: 0.50 M' },
            { t: p1.t2, v: p1.c2, label: '15 s: 0.20 M' }
          ],
          w: 104,
          h: 44
        })
      ]
    }),
    foes: FLARE_FOE,
    encounter: {
      species: 'the flare',
      act: 'Measure Surge',
      intent: 'The Flare vents fuel from 0.50 mol/L at 5 s to 0.20 mol/L at 15 s.'
    },
    hints: [
      'Read the two marked concentrations at 5 s (0.50 mol/L) and 15 s (0.20 mol/L).',
      'Find how much concentration dropped and how many seconds elapsed.',
      'Average rate is change in concentration divided by elapsed time.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'rate');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Enter the average rate in mol/(L·s).' };
      if (Math.abs(val - 0.30) < 0.01) return { ok: false, msg: '0.30 mol/L is the total drop, not divided by the 10 s interval.' };
      if (Math.abs(val - 0.02) < 0.002) return { ok: false, msg: 'Dividing by 15 s uses the clock time rather than the 10 s interval from 5 s to 15 s.' };
      if (Math.abs(val - p1.answer) > 0.002) return { ok: false, msg: 'Compare (0.50 − 0.20) mol/L over (15 − 5) s.' };
      return { ok: true };
    },
    reward: {
      log: 'Phase 1 surge rate = 0.030 mol/(L·s).',
      title: 'Surge Measured',
      body: 'From 5 s to 15 s, concentration fell by 0.30 mol/L in 10 s, giving 0.030 mol/(L·s).'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'p2-orders',
    title: 'Phase 2 · Feed Manifold',
    prompt: 'What are the orders in A and B for the flare feed?',
    widget,
    table: rateTable({
      fixtures: [
        rateslogFixture('log', { x: 44, y: 32 }, {
          title: p2.species,
          species: ['A', 'B'],
          initialRows: p2.rows,
          w: 72,
          h: 42
        }),
        rateboardFixture('board', { x: 105, y: 42 }, {
          title: 'Rate law',
          species: ['A', 'B'],
          maxOrder: 3,
          w: 42,
          h: 26
        })
      ]
    }),
    foes: FLARE_FOE,
    encounter: {
      species: 'the flare',
      act: 'Lock Manifold',
      intent: 'The Flare mixes feeds A and B across three initial-rate runs.'
    },
    hints: [
      'Compare Run 1 and Run 2 on the log where [B] stays constant at 0.10 mol/L.',
      'Compare Run 1 and Run 3 where [A] stays constant at 0.10 mol/L.',
      'Set the Order [A] and Order [B] dials on the Rate law board.'
    ],
    check(state) {
      const oA = Math.round(state.table.fixtures.board?.dials?.o0?.value ?? 0);
      const oB = Math.round(state.table.fixtures.board?.dials?.o1?.value ?? 0);
      if (oA === 0 && oB === 0) return { ok: false, notYet: true, msg: 'Set the orders of A and B on the Rate law board.' };
      if (oA !== p2.orders.A) return { ok: false, msg: 'Between Run 1 and Run 2, doubling [A] makes the rate 4 times as fast.' };
      if (oB !== p2.orders.B) return { ok: false, msg: 'Between Run 1 and Run 3, doubling [B] doubles the rate.' };
      return { ok: true };
    },
    reward: {
      log: 'Phase 2 rate law is rate = k[A]^2[B].',
      title: 'Manifold Orders Locked',
      body: 'Doubling [A] quadrupled the rate (order 2) and doubling [B] doubled it (order 1).'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'p3-halflife',
    title: 'Phase 3 · Peroxide Core',
    prompt: 'What fraction of the peroxide core remains after 48 s?',
    entry: { id: 'frac', label: 'Fraction left', unit: '' },
    widget,
    table: rateTable({
      fixtures: [
        plaqueFixture('core', p3.species, { x: 60, y: 32 }, [
          'First-order decomposition',
          `Half-life = ${p3.tHalf} s`,
          'Elapsed time = 48 s'
        ], { w: 92 })
      ]
    }),
    foes: FLARE_FOE,
    encounter: {
      species: 'the flare',
      act: 'Time Decay',
      intent: 'The Flare peroxide core decays by first-order kinetics with a 12 s half-life.'
    },
    hints: [
      'Find how many 12 s half-lives fit into 48 s.',
      'Each first-order half-life multiplies the remaining fraction by 0.5.',
      'Raise 0.5 to the number of elapsed half-lives.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'frac');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Enter the remaining fraction as a decimal.' };
      if (Math.abs(val - 0.125) < 0.005) return { ok: false, msg: '0.125 is 3 half-lives (36 s), not 4 half-lives (48 s).' };
      if (Math.abs(val - 0.25) < 0.005) return { ok: false, msg: '0.25 is 2 half-lives (24 s); 48 s is 4 half-lives.' };
      if (Math.abs(val - p3.answer) > 0.002) return { ok: false, msg: '48 s ÷ 12 s = 4 half-lives, so the core halves four times.' };
      return { ok: true };
    },
    reward: {
      log: 'Phase 3 remaining fraction after 4 half-lives = 0.0625.',
      title: 'Core Timed',
      body: 'Four 12 s half-lives leave (1/2)^4 = 1/16 = 0.0625 of the starting peroxide.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'p4-barrier',
    title: 'Phase 4 · Ignition Barrier',
    prompt: 'What is the forward activation energy of the flare ignition?',
    entry: { id: 'ea', label: 'Forward Ea', unit: 'kJ/mol' },
    widget,
    table: rateTable({
      fixtures: [
        kprofileFixture('prof', { x: 60, y: 32 }, {
          title: `${p4.species} (kJ/mol)`,
          reactants: p4.reactants,
          ts: p4.ts,
          products: p4.products,
          w: 96,
          h: 44
        })
      ]
    }),
    foes: FLARE_FOE,
    encounter: {
      species: 'the flare',
      act: 'Measure Barrier',
      intent: 'The Flare holds reactants at 35 kJ/mol behind a 115 kJ/mol peak.'
    },
    hints: [
      'Read the reactants level R and the transition state peak TS on the profile.',
      'Forward activation energy is the climb from reactants up to the peak.',
      'Find the energy difference between R and TS.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Enter the forward activation energy in kJ/mol.' };
      if (Math.abs(val - 100) < 0.5) return { ok: false, msg: '100 kJ/mol is the reverse barrier from P = 15 up to TS = 115.' };
      if (Math.abs(val - 115) < 0.5) return { ok: false, msg: '115 kJ/mol is the peak height from zero, not from R = 35.' };
      if (Math.abs(val - p4.answer) > 0.5) return { ok: false, msg: 'Compare the reactants level (35) and transition state peak (115).' };
      return { ok: true };
    },
    reward: {
      log: 'Phase 4 forward Ea = 80 kJ/mol.',
      title: 'Barrier Measured',
      body: 'Climbing from reactants at 35 kJ/mol to the peak at 115 kJ/mol requires 80 kJ/mol.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'p5-mechanism',
    title: 'Phase 5 · Additive Chain',
    prompt: 'Which mechanism matches the flare additive rate law?',
    widget,
    table: rateTable({
      pieces: [
        stmt('mech1', 'Single slow step: X + Y → Z', { x: 96, y: 12 }),
        stmt('mech2', '1 (fast): 2 X ⇌ X₂; 2 (slow): X₂ + Y → Z', { x: 96, y: 26 }),
        stmt('mech3', '1 (slow): X + X → X₂; 2 (fast): X₂ + Y → Z', { x: 96, y: 40 })
      ],
      fixtures: [
        plaqueFixture('obs', p5.species, { x: 35, y: 32 }, [
          `Measured: ${p5.measuredLaw}`,
          'Overall: 2 X + Y → Z'
        ], { w: 58 })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Matching mechanism', at: { x: 96, y: 52 }, size: { w: 52, h: 8 } }]
      }
    }),
    foes: FLARE_FOE,
    encounter: {
      species: 'the flare',
      act: 'Shut Down',
      intent: 'The Flare additive follows rate = k[X]²[Y].'
    },
    hints: [
      'Check which reactants appear in the measured rate law: two X and one Y.',
      'A slow Step 1 with only X + X would leave [Y] out of the rate law.',
      'A fast reversible 2 X ⇌ X₂ followed by slow X₂ + Y → Z puts both [X]² and [Y] into the rate law.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a mechanism card in "Matching mechanism".' };
      if (card.id === 'mech1') return { ok: false, msg: 'A single slow step X + Y gives rate = k[X][Y], first order in X.' };
      if (card.id === 'mech3') return { ok: false, msg: 'A slow Step 1 of 2 X gives rate = k[X]², which has no [Y] dependence.' };
      return { ok: true };
    },
    reward: {
      log: 'Phase 5 pre-equilibrium mechanism matches rate = k[X]^2[Y].',
      title: 'The Flare Halted',
      body: 'Pre-equilibrium 2 X ⇌ X₂ followed by slow X₂ + Y → Z matches rate = k[X]²[Y] and shuts down the flare.'
    }
  }
];

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

export const SOLUTIONS = [
  [{ type: { entry: 'rate', value: '0.03' } }],
  [dial('board', 'o0', 2), dial('board', 'o1', 1)],
  [{ type: { entry: 'frac', value: '0.0625' } }],
  [{ type: { entry: 'ea', value: '80' } }],
  [put('mech2', 'slot:ans')]
];

export const MISSES = [
  [{ type: { entry: 'rate', value: '0.30' } }],
  [dial('board', 'o0', 1), dial('board', 'o1', 1)],
  [{ type: { entry: 'frac', value: '0.125' } }],
  [{ type: { entry: 'ea', value: '100' } }],
  [put('mech3', 'slot:ans')]
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
