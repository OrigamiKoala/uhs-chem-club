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
    prompt: 'With the same heat added to 100 g of water and 100 g of iron, which reaches a higher temperature?',
    widget,
    table: heatTable({
      pieces: [
        note('water', 'Water warms up more', { x: 24, y: 16 }),
        note('iron', 'Iron warms up more', { x: 70, y: 16 }),
        note('same', 'Both warm up the same', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'heater', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Watch the clip: identical heaters warm water on the left and iron on the right.',
      'Compare how each material responds when both have the same mass and heat input.',
      'Think of a sunny beach: does the dry sand or the ocean water feel hotter?'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for water and iron is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const w = cupFixture('water', { x: 28, y: 33 }, { title: 'Water · 100 g', water: 100, T0: 20, joules: Q_WATER, showHeat: true });
    const i = cupFixture('iron', { x: 84, y: 33 }, { title: 'Iron · 100 g', water: 100, c: IRON_C, T0: 20, joulesList: [112, 225, 449, 898, 2092], joulesStart: 5, showHeat: true });
    return {
      id: 's2-test',
      title: 'Equal Rises',
      briefing: { speaker: SPEAKER, body: 'Heat is measured in joules (J). Warming 1 g of water by 1 °C takes 4.184 J, which is its specific heat capacity (c).' },
      prompt: 'The water rose 5.0 °C using 2,092 J, so how much heat does the iron need for the same rise?',
      widget,
      table: heatTable({ fixtures: [w.fixture, i.fixture], zones: { slots: [w.slot, i.slot] } }),
      hints: [
        'Compare RISE and HEAT on both panels, then adjust the "Heater" dial on the iron panel to match the water\'s RISE.',
        'At 449 J the iron rises twice as much as the water, so compare how much heat gives half that rise.',
        'Both samples weigh 100 g, so a substance with a lower specific heat capacity needs less heat for the same temperature rise.'
      ],
      check(state) {
        const t = state.table;
        const W = cupRead(t, 'water'); const I = cupRead(t, 'iron');
        if (Math.abs(I.dT - W.dT) < 0.1) return { ok: true };
        return { ok: false, msg: `At ${I.joules.toLocaleString('en-US')} J the iron rose ${fixed(I.dT, 1)} °C, while the water rose ${fixed(W.dT, 1)} °C.` };
      },
      reward: {
        log: 'Iron needed about a ninth of the water\'s heat.',
        title: 'Specific Heat Capacity',
        body: 'Iron rose 5.0 °C on 225 J while water needed 2,092 J, about nine times as much. Water needs 4.184 J per gram per °C, while iron needs only 0.449 J.'
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
        body: 'The heat a sample absorbs equals its mass times its specific heat capacity times its temperature change: q = m × c × ΔT. Here is an example; your bench has a different bath.',
        worked: [
          '50 g of water warms from 20 °C to 24 °C.',
          'ΔT = 24 − 20 = 4 °C',
          'q = m × c × ΔT',
          'q = 50 g × 4.184 J/(g·°C) × 4 °C',
          'q = 837 J'
        ]
      },
      prompt: 'How much heat did the water bath absorb?',
      entry: { id: 'joules', label: 'Heat absorbed', unit: 'J' },
      widget,
      table: heatTable({
        fixtures: [
          w.fixture,
          plaqueFixture('ref', 'Reference', { x: 106, y: 19 }, [
            FORMULA,
            'q: heat (joules, J)',
            'm: mass (grams, g)',
            'c: specific heat capacity (J/(g·°C))',
            'ΔT: temperature change (°C)',
            'c of water = 4.184 J/(g·°C)'
          ], { w: 68 }),
        ],
        zones: { slots: [w.slot] }
      }),
      hints: [
        'Read the bath\'s mass on the cup and its RISE beside the thermometer.',
        'Match the mass, RISE, and water\'s specific heat capacity from the reference plate to m, ΔT, and c.',
        'Substitute your bath\'s mass, c, and temperature rise into q = m × c × ΔT, just like the worked example.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'joules');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat in joules.' };
        if (Math.abs(v - Q_BATH) <= 50) return { ok: true };
        const r = cupRead(t, 'water');
        return { ok: false, msg: `${v.toLocaleString('en-US')} J would warm the ${BATH_3} g bath by ${fixed(v / (BATH_3 * SPECIFIC_HEAT_WATER), 1)} °C, but the bath rose ${fixed(r.dT, 1)} °C.` };
      },
      reward: {
        log: 'q = m × c × ΔT gave the bath\'s heat.',
        title: 'The Heat Equation',
        body: 'The 150 g bath rose 8.0 °C, absorbing 5,021 J (within 50 J is accepted). More water or a larger temperature rise requires more heat.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: `Bath · ${BATH_4} g`, water: BATH_4, T0: 21 });
    return {
      id: 's5-reaction',
      title: 'Catching a Reaction',
      briefing: { speaker: SPEAKER, body: 'A calorimeter is an insulated cup of water with a thermometer. Heat released by a reaction goes straight into the water, so the heat the water absorbs equals the heat the reaction released.' },
      prompt: 'How much heat did the reaction release?',
      entry: { id: 'joules', label: 'Heat released', unit: 'J' },
      widget,
      table: heatTable({
        pieces: [charge('mix', 'Acid and base mix', { x: 76, y: 20 }, { ...MIX, shown: '' })],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'Reference', { x: 118, y: 18 }, [
            FORMULA,
            'Heat released by reaction',
            '= heat absorbed by bath',
            'c of water = 4.184 J/(g·°C)'
          ], { w: 52 }),
        ],
        zones: { slots: [a.slot] }
      }),
      hints: [
        'Drop the mix into the cup, then read the bath\'s mass on the cup and the RISE beside the thermometer.',
        'Because the thermometer sits in the water, the mass and RISE belong to the water bath.',
        'Calculate the heat the water absorbed with q = m × c × ΔT; that equals the heat the reaction released.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'joules');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat in joules.' };
        if (Math.abs(v - Q_STAGE4) <= 35) return { ok: true };
        const rise = t.pieces.mix.props.rise;
        if (rise == null) return { ok: false, msg: 'Drop the mix into the cup first.' };
        return { ok: false, msg: `${v.toLocaleString('en-US')} J would warm the ${BATH_4} g bath by ${fixed(v / (BATH_4 * SPECIFIC_HEAT_WATER), 1)} °C, but the bath rose ${fixed(rise, 1)} °C.` };
      },
      reward: {
        log: 'The bath\'s rise gave the reaction\'s heat.',
        title: 'The Calorimeter',
        body: 'The 200 g bath rose 4.0 °C, absorbing about 3,350 J. That is the heat the reaction released.'
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
      briefing: { speaker: SPEAKER, body: 'Every metal has a unique specific heat capacity. Drop the hot fitting into the water bath, calculate its c, and match it to the table.' },
      prompt: 'Which metal is the hot pipe fitting made of?',
      widget,
      table: heatTable({
        pieces: [
          block('fitting', 'Pipe fitting', { x: 76, y: 20 }, { ...FITTING, mass: '50.0 g' }),
          ...names.map(([id, label], k) => tag(id, label, { x: 70 + (k % 2) * 28, y: 44 + Math.floor(k / 2) * 13 }))
        ],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'Reference', { x: 122, y: 20 }, [
            FORMULA,
            'so c = q ÷ (m × ΔT)',
            'Heat into water = heat out of metal',
            'c of water = 4.184 J/(g·°C)',
            'Aluminium: 0.897   Iron: 0.449',
            'Copper: 0.385   Silver: 0.235'
          ], { w: 52 })
        ],
        zones: { slots: [a.slot, { id: 'answer', label: 'The fitting is', at: { x: 130, y: 46 }, size: { w: 30, h: 14 } }] }
      }),
      hints: [
        'Drop the fitting into the cup, then read how much the bath warmed and how much the fitting cooled.',
        'First find the heat the water absorbed, then compare it with the fitting\'s mass and temperature drop.',
        'Use c = q ÷ (m × ΔT) for the fitting and match your result to the metals on the reference plate.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Place a metal card in the slot.' };
        if (p.id === 'cu') return { ok: true };
        const trial = t.pieces.fitting.props.trial;
        if (!trial) return { ok: false, msg: 'Test the fitting in the cup first.' };
        return { ok: false, msg: `The 100 g bath rose ${fixed(trial.rise, 1)} °C while the 50.0 g fitting fell ${fixed(trial.fall, 1)} °C, which does not match ${p.label.toLowerCase()}.` };
      },
      reward: {
        log: 'The measured c matched copper.',
        title: 'A Thermal Fingerprint',
        body: 'The fitting transferred 837 J to the water while cooling 43.4 °C, giving a specific heat capacity of 0.385 J/(g·°C). That matches copper.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-melt',
    title: 'Heat With No Rise',
    briefing: { speaker: SPEAKER, body: 'The heat needed to melt 1 g of a solid is its heat of fusion. Drag the burner along the graph and watch what happens to the temperature while the ice melts.' },
    prompt: 'What is the heat of fusion of ice, in joules per gram?',
    entry: { id: 'jg', label: 'Heat of fusion', unit: 'J/g' },
    widget,
    table: heatTable({
      fixtures: [curveFixture('heating', { x: 62, y: 30 }, { ...MELT, w: 100, h: 44, readout: 'both', title: 'Heating 10.0 g of ice' })]
    }),
    hints: [
      'Drag the burner along the graph and watch the particles, temperature, and heat added.',
      'Find the exact point where the last ice melts and the temperature is about to rise.',
      'That total heat melted all 10.0 g of ice, so divide by 10.0 g to find the heat per gram.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'jg');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat per gram in joules.' };
      if (Math.abs(v - L_ICE) <= 9) return { ok: true };
      const q = v * MELT.m;
      return { ok: false, msg: `At ${fixed(v, 0)} J/g, 10.0 g would take ${Math.round(q).toLocaleString('en-US')} J, leaving the sample ${meltReached(q)}.` };
    },
    reward: {
      log: 'Melting 10.0 g of ice took 3,340 J at 0 °C.',
      title: 'Heat of Fusion',
      body: 'The ice absorbed 3,340 J while staying at 0 °C until it all melted, or 334 J/g. Only after melting finished did the water warm up.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-curve',
    title: 'Ice to Steam',
    briefing: { speaker: SPEAKER, body: 'Boiling works like melting: temperature stays at 100 °C while heat separates the liquid particles into gas. The heat needed to boil 1 g of a liquid is its heat of vaporization.' },
    prompt: 'How much heat, in kilojoules (kJ), turns 10.0 g of ice at 0 °C into steam at 100 °C?',
    entry: { id: 'kj', label: 'Heat needed', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('ref', 'Reference', { x: 35, y: 28 }, [
          FORMULA,
          'Heat of fusion of ice: 334 J/g',
          'Heat of vaporization: 2,260 J/g',
          'c of water = 4.184 J/(g·°C)',
          '1 kJ = 1,000 J'
        ], { w: 62 }),
        curveFixture('heating', { x: 109, y: 30 }, { m: 10, from: 0, to: 100, w: 76, h: 42, readout: 'temp', title: 'Heating 10.0 g of ice' })
      ]
    }),
    hints: [
      'Drag the burner along the graph and notice its three sections: flat, rising, and flat.',
      'Find the heat for each section: melting at 0 °C, warming water from 0 °C to 100 °C, and boiling at 100 °C.',
      'Use the per-gram values for the two flat sections, q = m × c × ΔT for the rising section, and combine all three in kJ.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'kj');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat in kilojoules.' };
      if (Math.abs(v - Q_CURVE) <= 0.35) return { ok: true };
      return { ok: false, msg: `${fixed(v, 1)} kJ leaves the 10.0 g sample ${reached(v * 1000)}.` };
    },
    reward: {
      log: 'Turning 10.0 g of ice at 0 °C into steam at 100 °C took 30.1 kJ.',
      title: 'Heat of Vaporization',
      body: 'The three sections took 3.34 kJ, 4.18 kJ, and 22.6 kJ, totaling 30.1 kJ. Boiling took the most heat because turning liquid into gas pulls particles completely apart.'
    }
  }
];


/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Specific heat capacity (c) is the heat needed to warm 1 g of a substance by 1 °C. Using q = m × c × ΔT, a calorimeter measures reaction heat from a water bath\'s temperature change, while melting and boiling absorb heat at constant temperature.'
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
    onLoad(r) {
      if (r.index === 1) {
        const g = recall(QUEST_KEY);
        if (g && GUESS_LABEL[g]) r.frame.note(`You predicted: ${GUESS_LABEL[g]}. Test it on the bench.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { Q_WATER, Q_BATH, BATH_3, L_ICE, MELT, Q_CURVE, Q_STAGE4, FITTING, MIX, BATH_4, IRON_C };
export { cupRead, blockSpecificHeat };
