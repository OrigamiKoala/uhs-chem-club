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

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, block, charge, note, tag, cupFixture, plaqueFixture, markerFixture, leadFixture, curveFixture, cupRead, markerRead, fixed,
  SPECIFIC_HEAT_WATER, heatTransfer, blockSpecificHeat
} from '../../table/kits/heat.js';
import { curvePath, curveAt } from '../../table/kits/heat-motion.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bspecific heat capacity\b/i, introducedAt: 2 },
  { term: /\bcalorimeter\b/i, introducedAt: 4 },
  { term: /\bheat of fusion\b/i, introducedAt: 6 },
  { term: /\bheat of vaporization\b/i, introducedAt: 7 }
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
// Stage 3: a 150 g bath that took 5021 J and rose 8.0 degrees. The worked case in its briefing is a different bath (50 g, 4 degrees).
const BATH_3 = 150;
const Q_BATH = 5021;
// Stage 5: 100 g of water at 20 and a 50.0 g fitting of copper (c = 0.385) at 65.4 degrees.
const FITTING = { m: 50, c: 0.385, T: 65.4 };
// Stage 6: 10.0 g of ice at 0 degrees heated to water at 40 degrees. The burner's 31 settings are equal shares of the heat, and the
// 21st is where the last ice has gone (3340 J of 5014 J), so the heat of fusion can be read there: 334 J for every gram.
const MELT = { m: 10, from: 0, to: 40, steps: 31 };
const L_ICE = 334;
/** Where a given heat (J) leaves the 10.0 g of stage 6, in words: read from the curve's own path. */
function meltReached(q) {
  const path = curvePath({ m: MELT.m, from: MELT.from, to: MELT.to });
  if (q >= path.total) return 'as water above 40 °C';
  const at = curveAt(path, q / path.total);
  return at.kind === 'melt' ? `at 0 °C with ${fixed(MELT.m * (1 - at.mix), 1)} g of ice still solid` : `as water at ${fixed(at.T, 0)} °C`;
}
// Stage 7: 10.0 g of ice at 0 degrees to steam at 100 degrees: 3.34 + 4.18 + 22.6 kJ.
const Q_CURVE = (10 * 334 + 10 * SPECIFIC_HEAT_WATER * 100 + 10 * 2260) / 1000;
/** Where a given heat (J) leaves those 10.0 g, in words. */
function reached(q) {
  if (q < 3340) return `${fixed(q / 334, 1)} g melted, still at 0 °C`;
  if (q < 3340 + 10 * SPECIFIC_HEAT_WATER * 100) return `as water at ${fixed((q - 3340) / (10 * SPECIFIC_HEAT_WATER), 0)} °C`;
  if (q < 3340 + 10 * SPECIFIC_HEAT_WATER * 100 + 22600) return `boiling at 100 °C with ${fixed((q - 3340 - 10 * SPECIFIC_HEAT_WATER * 100) / 2260, 1)} g turned to steam`;
  return 'as steam above 100 °C';
}
// Stage 4: 0.06 mol of a neutralising mix, 55.8 kJ/mol, into a 200 g bath: 3348 J.
const MIX = { moles: 0.06, dH: -55.8 };
const BATH_4 = 200;
const Q_STAGE4 = heatTransfer(BATH_4, SPECIFIC_HEAT_WATER, (MIX.moles * -MIX.dH * 1000) / (BATH_4 * SPECIFIC_HEAT_WATER));

/* ------------------------------------------------------------------
   THE SEVEN STAGES
   The calculation is taught in three steps: the quantity is seen and compared with no arithmetic (stage 2), one case is worked in the
   briefing of the first typed stage (stage 3), and every typed stage after it is a new case whose number describes something on the bench.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Water or Iron?',
    // A PREDICT STAGE: the cups are not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'The same heat goes into 100 g of water and 100 g of iron: which warms up more?',
    widget,
    table: heatTable({
      pieces: [
        note('water', 'The water warms up more', { x: 24, y: 16 }),
        note('iron', 'The iron warms up more', { x: 70, y: 16 }),
        note('same', 'They warm up the same', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'heater', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Watch the clip: a heater feeds energy into water, and the particles of the water speed up.',
      'Picture the same heater under a block of iron of the same mass.',
      'Think about a beach on a sunny afternoon, and whether the dry sand or the sea feels hotter.'
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
      body: 'Next, the same heater is put under each one.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const w = cupFixture('water', { x: 28, y: 33 }, { title: 'Water · 100 g', water: 100, T0: 20, joules: Q_WATER, showHeat: true });
    const i = cupFixture('iron', { x: 84, y: 33 }, { title: 'Iron · 100 g', water: 100, c: IRON_C, T0: 20, joulesList: [112, 225, 449, 898, 2092], joulesStart: 5, showHeat: true });
    return {
      id: 's2-test',
      title: 'Equal Rises',
      briefing: { speaker: SPEAKER, body: 'Heat is measured in joules (J). The heat needed to warm 1 g of a substance by 1 °C is its specific heat capacity, c.' },
      prompt: 'The water rose 5.0 °C on 2,092 J: how much heat does the iron need for the same rise?',
      widget,
      table: heatTable({ fixtures: [w.fixture, i.fixture], zones: { slots: [w.slot, i.slot] } }),
      hints: [
        'Look at the RISE and the HEAT printed on each cup, and at the "Heater" dial under the iron.',
        'Compare how fast the particles in the two cups move when both have taken in the same heat.',
        'Both cups hold 100 g, so the substance that needs less heat for each degree needs a smaller heater setting for the same rise.'
      ],
      check(state) {
        const t = state.table;
        const W = cupRead(t, 'water'); const I = cupRead(t, 'iron');
        if (Math.abs(I.dT - W.dT) < 0.1) return { ok: true };
        return { ok: false, msg: `On ${I.joules.toLocaleString('en-US')} J the iron has risen ${fixed(I.dT, 1)} °C, and the water rose ${fixed(W.dT, 1)} °C.` };
      },
      reward: {
        log: 'Iron needed about a ninth of the water\'s heat.',
        title: 'Specific Heat Capacity',
        body: 'The iron rose 5.0 °C on 225 J where the water needed 2,092 J. The specific heat capacity of water is 4.184 J/(g·°C) and that of iron is 0.449 J/(g·°C).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const w = cupFixture('water', { x: 30, y: 32 }, { title: `Water bath · ${BATH_3} g`, water: BATH_3, T0: 20, joules: Q_BATH });
    return {
      id: 's3-equation',
      title: 'The Heat Equation',
      briefing: {
        speaker: SPEAKER,
        body: 'The heat a sample takes in is its mass times its specific heat capacity times its rise in temperature: q = m × c × ΔT. Here is one bath worked through; the bath on your bench is a different one.',
        worked: [
          '50 g of water warms from 20 °C to 24 °C.',
          'ΔT = 24 − 20 = 4 °C',
          'q = m × c × ΔT',
          'q = 50 g × 4.184 J/(g·°C) × 4 °C',
          'q = 837 J'
        ]
      },
      prompt: 'How much heat did the water bath take in?',
      entry: { id: 'joules', label: 'Heat taken in', unit: 'J' },
      widget,
      table: heatTable({
        fixtures: [
          w.fixture,
          plaqueFixture('ref', 'What you may use', { x: 106, y: 19 }, [
            FORMULA,
            'q: heat (joules, J)',
            'm: mass (grams, g)',
            'c: specific heat capacity (J/(g·°C))',
            'ΔT: rise in temperature (°C)',
            'c of water = 4.184 J/(g·°C)'
          ], { w: 68 }),
        ],
        zones: { slots: [w.slot] }
      }),
      hints: [
        'Look at the mass printed on the cup and the RISE printed beside the thermometer.',
        'Match each of those two readings to a letter in q = m × c × ΔT, and find c for water on the plate.',
        'The worked case shows where a mass, a specific heat capacity and a rise each go in the equation, and yours go in the same places.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'joules');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in joules.' };
        if (Math.abs(v - Q_BATH) <= 50) return { ok: true };
        const r = cupRead(t, 'water');
        return { ok: false, msg: `${v.toLocaleString('en-US')} J would warm the ${BATH_3} g bath ${fixed(v / (BATH_3 * SPECIFIC_HEAT_WATER), 1)} °C, and the bath rose ${fixed(r.dT, 1)} °C.` };
      },
      reward: {
        log: 'The formula q = m c ΔT gave the bath\'s heat.',
        title: 'The Heat Equation',
        body: 'The 150 g bath rose 8.0 °C, so it took in about 5,020 J. More water, or a bigger rise, means more heat.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: `Bath · ${BATH_4} g`, water: BATH_4, T0: 21 });
    return {
      id: 's5-reaction',
      title: 'Catching a Reaction',
      briefing: { speaker: SPEAKER, body: 'A calorimeter is an insulated cup of water with a thermometer in it. Heat that a reaction gives out goes into the water, so the heat the water takes in is the heat the reaction gave out.' },
      prompt: 'How much heat did the reaction give out?',
      entry: { id: 'joules', label: 'Heat given out', unit: 'J' },
      widget,
      table: heatTable({
        pieces: [charge('mix', 'Acid and base mix', { x: 76, y: 20 }, MIX)],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 118, y: 18 }, [
            FORMULA,
            'Heat out of the reaction',
            '= heat into the bath',
            'c of the bath = 4.184 J/(g·°C)'
          ], { w: 52 }),
        ],
        zones: { slots: [a.slot] }
      }),
      hints: [
        'Drop the mix in the cup, then look at the mass printed on the cup and the RISE beside the thermometer.',
        'The thermometer sits in the bath, so the mass and the rise you can read are those of the bath.',
        'Work out the heat the bath took in as you did for the last bath: the reaction gave out that same heat.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'joules');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in joules.' };
        if (Math.abs(v - Q_STAGE4) <= 35) return { ok: true };
        const rise = t.pieces.mix.props.rise;
        if (rise == null) return { ok: false, msg: 'The mix has not been in the cup yet.' };
        return { ok: false, msg: `${v.toLocaleString('en-US')} J would warm the ${BATH_4} g bath ${fixed(v / (BATH_4 * SPECIFIC_HEAT_WATER), 1)} °C, and the bath rose ${fixed(rise, 1)} °C.` };
      },
      reward: {
        log: 'The reaction\'s heat was read from the bath.',
        title: 'The Calorimeter',
        body: 'The 200 g bath rose 4.0 °C, so it took in about 3,350 J. That is the heat the reaction gave out.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: 'Bath · 100 g', water: 100, T0: 20 });
    const names = [['al', 'Aluminium'], ['fe', 'Iron'], ['cu', 'Copper'], ['ag', 'Silver']];
    return {
      id: 's4-fitting',
      title: 'Naming a Metal',
      prompt: 'Which metal is the hot pipe fitting made of?',
      widget,
      table: heatTable({
        pieces: [
          block('fitting', 'Pipe fitting', { x: 76, y: 20 }, { ...FITTING, mass: '50.0 g' }),
          ...names.map(([id, label], k) => tag(id, label, { x: 70 + (k % 2) * 28, y: 44 + Math.floor(k / 2) * 13 }))
        ],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 122, y: 20 }, [
            FORMULA,
            'so c = q ÷ (m × ΔT)',
            'Heat into water = heat out of metal',
            'c of water = 4.184 J/(g·°C)',
            'Aluminium: 0.897   Iron: 0.449',
            'Copper: 0.385   Silver: 0.235'
          ], { w: 52 })
        ],
        zones: { slots: [a.slot, { id: 'answer', label: 'The fitting is', at: { x: 130, y: 52 }, size: { w: 28, h: 12 } }] }
      }),
      hints: [
        'Drop the fitting in the cup, then read how far the bath rose and what the fitting now reads.',
        'Work out the heat the water took in from the mass and the rise of the water.',
        'The fitting gave out that same heat, so use it with the mass of the fitting and the fall in temperature of the fitting.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Put a name in the slot.' };
        if (p.id === 'cu') return { ok: true };
        const trial = t.pieces.fitting.props.trial;
        if (!trial) return { ok: false, msg: 'The fitting has not been in the cup yet.' };
        return { ok: false, msg: `The 100 g bath rose ${fixed(trial.rise, 1)} °C while the 50.0 g fitting fell ${fixed(trial.fall, 1)} °C, and that does not give the value listed for ${p.label.toLowerCase()}.` };
      },
      reward: {
        log: 'The measured c matched one metal on the list.',
        title: 'A Fingerprint',
        body: 'The fitting gave 837 J to the water and fell 43.4 °C, which makes its specific heat capacity about 0.385 J/(g·°C). That is the value for copper.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-melt',
    title: 'Heat With No Rise',
    briefing: { speaker: SPEAKER, body: 'While a solid melts, the heat going in pulls its particles out of their fixed places, and the temperature does not rise. The heat needed to melt one gram of a solid is its heat of fusion.' },
    prompt: 'What is the heat of fusion of ice, in joules for each gram?',
    entry: { id: 'jg', label: 'Heat of fusion', unit: 'J for each gram' },
    widget,
    table: heatTable({
      fixtures: [curveFixture('heating', { x: 62, y: 30 }, { ...MELT, w: 100, h: 44, readout: 'both', title: 'Heating 10.0 g of ice' })]
    }),
    hints: [
      'Drag the burner along the graph and watch the particles, the temperature and the heat added.',
      'Find the point where the last particle has left its fixed place and the temperature is about to rise.',
      'The heat added up to that point melted all 10.0 g, so share it equally among the grams.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'jg');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat for each gram, in joules.' };
      if (Math.abs(v - L_ICE) <= 9) return { ok: true };
      const q = v * MELT.m;
      return { ok: false, msg: `${fixed(v, 0)} J for each gram is ${Math.round(q).toLocaleString('en-US')} J for the 10.0 g, and that much heat leaves the sample ${meltReached(q)}.` };
    },
    reward: {
      log: 'Melting 10.0 g of ice took 3,340 J at 0 °C.',
      title: 'Heat of Fusion',
      body: 'The ice took in 3,340 J and stayed at 0 °C until the last of it had melted: 334 J for each gram. Only then did the water begin to warm.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-curve',
    title: 'Ice to Steam',
    briefing: { speaker: SPEAKER, body: 'Boiling is like melting: the temperature stays at 100 °C while the heat pulls the particles away from each other. The heat needed to boil one gram of a liquid is its heat of vaporization.' },
    prompt: 'How much heat turns 10.0 g of ice at 0 °C into steam at 100 °C?',
    entry: { id: 'kj', label: 'Heat needed', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('ref', 'What you may use', { x: 46, y: 28 }, [
          FORMULA,
          'Heat of fusion of ice: 334 J for each gram',
          'Heat of vaporization of water: 2,260 J for each gram',
          'c of water = 4.184 J/(g·°C)',
          '1 kJ = 1,000 J'
        ], { w: 80 }),
        curveFixture('heating', { x: 118, y: 30 }, { m: 10, from: 0, to: 100, w: 58, h: 40, readout: 'temp', title: 'Heating 10.0 g of ice' })
      ]
    }),
    hints: [
      'Drag the burner along the graph and count its stretches: flat, rising, flat.',
      'Each stretch takes its own heat: melting at 0 °C, warming the water from 0 °C to 100 °C, and boiling at 100 °C.',
      'A flat stretch uses a heat for each gram from the plate, the rising stretch uses q = m × c × ΔT, and the whole path is the three together.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'kj');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
      if (Math.abs(v - Q_CURVE) <= 0.35) return { ok: true };
      return { ok: false, msg: `${fixed(v, 1)} kJ would leave the 10.0 g ${reached(v * 1000)}.` };
    },
    reward: {
      log: 'Ice at 0 °C needed about 30 kJ to become steam at 100 °C.',
      title: 'Heat of Vaporization',
      body: 'The three stretches took 3.34 kJ, 4.18 kJ and 22.6 kJ, about 30.1 kJ in all. Boiling took the most, because the particles of a gas are pulled right away from each other.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Turn the "Heater" dial under the iron.'],
  3: ['Type your answer in the field at the bottom.'],
  4: ['Drag the mix onto the cup, then type your answer.'],
  5: ['Drag the fitting onto the cup;', 'drag a name into the slot.'],
  6: ['Drag along the graph to move the burner, then type your answer.'],
  7: ['Drag along the graph to move the burner, then type your answer.']
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
      body: 'Specific heat capacity (c) is the heat needed to warm one gram of a substance by one degree. The heat a sample takes in is q = m × c × ΔT, so a calorimeter can measure the heat of a reaction from the rise of its bath. Melting and boiling take heat with no rise in temperature.'
    }
  ]
};

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
  [{ type: { entry: 'joules', value: '5020' } }],
  [put('mix', MOUTH), { type: { entry: 'joules', value: '3350' } }],
  [put('fitting', MOUTH), put('cu', 'slot:answer')],
  [dial('heating', 'heat', 21), { type: { entry: 'jg', value: '334' } }],
  [{ type: { entry: 'kj', value: '30.1' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('iron', 'heat', 3)],
  [{ type: { entry: 'joules', value: '3300' } }],
  [put('mix', MOUTH), { type: { entry: 'joules', value: '2800' } }],
  [put('fitting', MOUTH), put('fe', 'slot:answer')],
  [dial('heating', 'heat', 22), { type: { entry: 'jg', value: '351' } }],
  [{ type: { entry: 'kj', value: '7.5' } }]
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
export const CHECKS = { Q_WATER, Q_BATH, BATH_3, L_ICE, MELT, Q_CURVE, Q_STAGE4, FITTING, MIX, BATH_4, IRON_C };
export { cupRead, blockSpecificHeat };
