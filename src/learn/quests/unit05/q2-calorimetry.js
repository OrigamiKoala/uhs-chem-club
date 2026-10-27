/**
 * Unit 5 · Bench 2 — Calorimetry (q2-calorimetry)
 *
 * The sampling shelf at the hot spring's edge, on the heat kit (`table/kits/heat.js`). The lidded cup with a weighed bath. The player gives
 * a bath a known amount of energy and watches how far the thermometer climbs, then runs the sum backwards: from a thermometer rise to a
 * metal's name, to the joules a reaction gave out. Four stages and ONE click: the belief that the same heat warms everything alike.
 *
 *   1  PREDICT: the same heat in 100 g of jacket water and 100 g of iron pipe: which warms more?
 *   2  TEST: set the iron's heater so the iron rises as far as the water       -> specific heat capacity, q = m c ΔT
 *   3  a hot fitting dropped in a bath: which metal is it?                    -> (the bath's gain is the metal's loss)
 *   4  a reaction in a weighed bath: the joules it gave out                   -> calorimeter
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction's cards put "they warm the same" beside the two materials; the two thermometers settle
 * it, and the iron needs about a tenth of the water's energy for the same rise.
 *
 * THE EVIDENCE IS ON THE BENCH. Every cup that asks for a heat prints no heat (`showHeat` off): the joules are worked out from the
 * mass, the specific heat capacity and the rise on the thermometer. The sum itself is given on a plate, because a formula a stage needs is
 * never withheld. A block that has been in the bath keeps how far the bath rose and how far it fell.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, block, charge, note, tag, cupFixture, plaqueFixture, markerFixture, cupRead, markerRead, fixed,
  SPECIFIC_HEAT_WATER, heatTransfer, blockSpecificHeat
} from '../../table/kits/heat.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bspecific heat capacity\b/i, introducedAt: 2 },
  { term: /\bcalorimeter\b/i, introducedAt: 4 }
];

/** The bench reads a thermometer as particle motion, and counts in moles. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit05/q1-flow'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const FORMULA = 'q = m × c × ΔT';
const MOUTH = 'slot:cup.mouth';

const QUEST_KEY = 'unit05/q2-calorimetry';
const GUESS_LABEL = { water: 'the jacket water', iron: 'the iron pipe', same: 'both the same' };

// Stage 2: the water takes 2092 J (a 5.0 degree rise on 100 g); the iron needs 225 J for the same rise.
const Q_WATER = 2092;
const IRON_C = 0.449;
// Stage 3: 100 g of water at 20 and a 50.0 g fitting of copper (c = 0.385) at 65.4 degrees.
const FITTING = { m: 50, c: 0.385, T: 65.4 };
// Stage 4: 0.06 mol of a neutralising mix, 55.8 kJ/mol, into a 200 g bath: 3348 J.
const MIX = { moles: 0.06, dH: -55.8 };
const BATH_4 = 200;
const Q_STAGE4 = heatTransfer(BATH_4, SPECIFIC_HEAT_WATER, (MIX.moles * -MIX.dH * 1000) / (BATH_4 * SPECIFIC_HEAT_WATER));

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Water or Iron?',
    // A PREDICT STAGE: the cups are not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'The same heat goes into 100 g of jacket water and 100 g of iron pipe: which warms up more?',
    widget,
    table: heatTable({
      pieces: [
        note('water', 'Jacket water warms up more', { x: 24, y: 16 }),
        note('iron', 'Iron pipe warms up more', { x: 70, y: 16 }),
        note('same', 'They warm up the same', { x: 116, y: 16 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 70, y: 44 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Picture the same electric heater switched on under each one, and which thermometer you expect to climb faster.',
      'Commit to the card you expect to warm up more.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, test both materials on the heater to measure how each warms.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const w = cupFixture('water', { x: 28, y: 33 }, { title: 'Jacket water · 100 g', water: 100, T0: 20, joules: Q_WATER });
    const i = cupFixture('iron', { x: 84, y: 33 }, { title: 'Iron pipe · 100 g', water: 100, c: IRON_C, T0: 20, joulesList: [112, 225, 449, 898, 2092], joulesStart: 5 });
    return {
      id: 's2-test',
      title: 'Equal Rises',
      prompt: 'Set the iron\'s heater so the iron rises as far as the water does.',
      widget,
      table: heatTable({ fixtures: [w.fixture, i.fixture], zones: { slots: [w.slot, i.slot] } }),
      hints: [
        'Use the iron\'s "Heater" dial and the two thermometers.',
        'Compare the two rises at each setting of the dial.',
        'The material that needs less energy for each degree needs a smaller setting to match.'
      ],
      check(state) {
        const t = state.table;
        const W = cupRead(t, 'water'); const I = cupRead(t, 'iron');
        if (Math.abs(I.dT - W.dT) < 0.1) return { ok: true };
        return { ok: false, msg: `The iron has risen ${fixed(I.dT, 1)} °C and the water ${fixed(W.dT, 1)} °C.` };
      },
      reward: {
        log: 'Iron needed a tenth of the water\'s energy.',
        title: 'Specific Heat Capacity',
        body: 'Specific heat capacity (c) is the heat needed to warm one gram by one degree: 4.184 J/(g·°C) for water and 0.449 J/(g·°C) for iron. Total heat absorbed or released is given by q = m × c × ΔT.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: 'Bath · 100 g', water: 100, T0: 20 });
    const names = [['al', 'Aluminium'], ['fe', 'Iron'], ['cu', 'Copper'], ['ag', 'Silver']];
    return {
      id: 's3-fitting',
      title: 'Naming a Metal',
      prompt: 'Which metal is the siphon fitting?',
      widget,
      table: heatTable({
        pieces: [
          block('fitting', 'Siphon fitting', { x: 76, y: 20 }, { ...FITTING, mass: '50.0 g' }),
          ...names.map(([id, label], k) => tag(id, label, { x: 70 + (k % 2) * 28, y: 44 + Math.floor(k / 2) * 13 }))
        ],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 122, y: 20 }, [FORMULA, 'c of water = 4.184 J/(g·°C)', 'Aluminium: 0.897 J/(g·°C)', 'Iron: 0.449 J/(g·°C)', 'Copper: 0.385 J/(g·°C)', 'Silver: 0.235 J/(g·°C)'], { w: 52 })
        ],
        zones: { slots: [a.slot, { id: 'answer', label: 'The fitting is', at: { x: 130, y: 52 }, size: { w: 28, h: 12 } }] }
      }),
      hints: [
        'Use the cup, the fitting, the plate of facts and the slot.',
        'Compare how far the bath rose with how far the fitting fell.',
        'Use the heat gained by the water to calculate the fitting\'s specific heat capacity, then match it to the list.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Put a name in the slot.' };
        if (p.id === 'cu') return { ok: true };
        const trial = t.pieces.fitting.props.trial;
        if (!trial) return { ok: false, msg: 'The fitting has not been in the cup yet.' };
        return { ok: false, msg: `The bath rose ${fixed(trial.rise, 1)} °C while the fitting fell ${fixed(trial.fall, 1)} °C.` };
      },
      reward: {
        log: 'The measured c matched one metal on the list.',
        title: 'A Fingerprint',
        body: 'Specific heat capacity is a characteristic property of each substance. In an insulated cup, the heat gained by the water equals the heat lost by the metal fitting.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: 'Reserve bath · 200 g', water: BATH_4, T0: 21 });
    return {
      id: 's4-reaction',
      title: 'Catching a Reaction',
      prompt: 'Set the marker to the heat the reaction gave out into the bath, in joules.',
      widget,
      table: heatTable({
        pieces: [charge('mix', 'Neutralising mix', { x: 76, y: 20 }, MIX)],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 118, y: 18 }, [FORMULA, 'c of the bath = 4.184 J/(g·°C)'], { w: 52 }),
          markerFixture('joules', 'Heat given out', { x: 118, y: 44 }, { min: 2000, max: 5000, step: 50, start: 2000, unit: 'J', w: 52 })
        ],
        zones: { slots: [a.slot] }
      }),
      hints: [
        'Use the cup, the mix, the plate of facts and the marker.',
        'Compare the bath\'s weight and its rise with the numbers in the formula.',
        'Calculate the heat gained by the bath using q = m × c × ΔT, which equals the heat released by the reaction.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'joules');
        if (v === 2000) return { ok: false, notYet: true, msg: 'Set the marker to the heat.' };
        if (Math.abs(v - Q_STAGE4) <= 25) return { ok: true };
        const rise = t.pieces.mix.props.rise;
        if (rise == null) return { ok: false, msg: 'The mix has not been in the cup yet.' };
        return { ok: false, msg: `The marker reads ${v} J, and the bath rose ${fixed(rise, 1)} °C.` };
      },
      reward: {
        log: 'The reaction\'s heat was read from the bath.',
        title: 'The Calorimeter',
        body: 'A calorimeter traps heat in a weighed bath so a thermometer can measure the reaction. The heat gained by the bath equals the heat released by the reaction.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Turn the iron\'s "Heater" dial.'],
  3: ['Drag the fitting onto the cup;', 'drag a name into the slot.'],
  4: ['Drag the mix onto the cup, then set the marker.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Different substances require different amounts of heat per degree of warming according to their specific heat capacity. In an insulated calorimeter, q = m × c × ΔT converts a measured temperature rise into joules released by a reaction.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'How much heat does 50.0 g of water absorb when it warms from 20.0 °C to 30.0 °C? (c = 4.184 J/(g·°C))',
    options: [
      { id: 'a', label: '2090 J' },
      { id: 'b', label: '1050 J' },
      { id: 'c', label: '4180 J' },
      { id: 'd', label: '209 J' }
    ],
    answer: 'a',
    explanation: 'The heat is mass times c times the rise: 50.0 g × 4.184 J/(g·°C) × 10.0 °C, which is about 2090 J.'
  },
  {
    question: 'Two 100 g blocks, one aluminium (c = 0.90 J/(g·°C)) and one silver (c = 0.24 J/(g·°C)), each absorb 900 J. Which warms more?',
    options: [
      { id: 'a', label: 'Silver, because each gram needs less heat per degree' },
      { id: 'b', label: 'Aluminium, because its specific heat capacity is larger' },
      { id: 'c', label: 'Both rise by the same amount, because their masses are equal' }
    ],
    answer: 'a',
    explanation: 'The rise is q divided by m times c, so for the same heat and mass the metal with the smaller c warms more.'
  },
  {
    question: 'A 100 g metal sample cools by 50.0 °C while a water bath absorbs 4500 J from it. What is the metal’s specific heat capacity?',
    options: [
      { id: 'a', label: '0.90 J/(g·°C)' },
      { id: 'b', label: '0.45 J/(g·°C)' },
      { id: 'c', label: '1.80 J/(g·°C)' },
      { id: 'd', label: '90 J/(g·°C)' }
    ],
    answer: 'a',
    explanation: 'Divide the heat by the mass times the temperature drop: 4500 J divided by 100 g times 50.0 °C gives 0.90 J/(g·°C).'
  },
  {
    question: 'In a coffee-cup calorimeter, 0.020 mol of a salt dissolves and absorbs 520 J from the bath. How much heat is absorbed per mole?',
    options: [
      { id: 'a', label: '26 kJ/mol' },
      { id: 'b', label: '10.4 kJ/mol' },
      { id: 'c', label: '2.6 kJ/mol' },
      { id: 'd', label: '0.026 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'Convert 520 J to 0.520 kJ and divide by the 0.020 mol that dissolved, which gives 26 kJ per mole.'
  },
  {
    question: 'A student runs an exothermic neutralisation in a thin metal beaker instead of an insulated cup. How does the calculated heat compare with the true value?',
    options: [
      { id: 'a', label: 'It is too low, because heat leaks through the walls instead of warming the solution' },
      { id: 'b', label: 'It is too high, because the metal conducts extra heat to the thermometer' },
      { id: 'c', label: 'It is unchanged, because the moles of acid and base are unchanged' }
    ],
    answer: 'a',
    explanation: 'Heat lost through the walls lowers the measured rise, so the heat calculated from the rise is smaller than the true value.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

export const SOLUTIONS = [
  [put('iron', 'slot:guess')],
  [dial('iron', 'heat', 2)],
  [put('fitting', MOUTH), put('cu', 'slot:answer')],
  [put('mix', MOUTH), dial('joules', 'value', 3350)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('iron', 'heat', 3)],
  [put('fitting', MOUTH), put('fe', 'slot:answer')],
  [put('mix', MOUTH), dial('joules', 'value', 2800)]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { Q_WATER, Q_STAGE4, FITTING, MIX, BATH_4, IRON_C };
export { cupRead, blockSpecificHeat };
