/**
 * q6-real.js — Bellows, bench six: REAL GASES.
 *
 * The liquefier's cold box beside the compressor tower, on the gas kit (`table/kits/gas.js`). Every bench so far held a gas to the gas
 * law, and the law held. This one squeezes and chills until it stops. A cylinder prints what its gauge reads beside what the gas law says
 * it should read, so how far a real gas strays is something to look at, not something to work out.
 *
 * THE CLICK. Players treat the gas law as exact: squeeze helium to a hundredth of its room and the gauge must read a hundred times
 * more. Stage 1 asks for that guess (a predict stage, no instrument). Stage 2 squeezes helium as far as the piston goes, with the
 * particles drawn at the share of the room they truly take: the crowd fills the glass, and the gauge reads MORE than the law says.
 * The particles are not points. Stage 3 warms a cramped cold gas until the pull between particles and the room they fill cancel, and
 * stage 4 ranks cold gases by how far they stray, with the plant's own record of when each turns liquid as new evidence.
 *
 *   1  PREDICT: helium squeezed to a hundredth of its room, against the gas law
 *   2  TEST: squeeze it all the way, lay the card for the gauge        -> Particles Take Room
 *   3  warm carbon dioxide until its gauge matches the law              -> Ideal Gas, Real Gas
 *   4  rank cold gases by how far each strays                          -> Strong Pulls Stray Furthest
 *
 * (Cut as past the idea or repeated: the compression-factor readings and the two corrections in kilopascals, the van der Waals
 * equation, the "which cylinder is most ideal" slot and the two statement-marking stages, which asked the player to report lines the
 * plate printed.)
 *
 * FIELD. Stage 4 may fetch the cold box's draw-off record (`bellows/stations.js`, field point `drawoff`): the temperatures at which the
 * three gases turn liquid. It is new evidence, not a copy of anything on the bench, and the stage is solvable without it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { gasTable, rig, chip, stmt, cylRead, rigAt, GASES } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, answerCards, answerSlot, predictStage, youPredicted, guessOf } from './_shared.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bideal gas(?:es)?\b/i, introducedAt: 3 },
  { term: /\breal gas(?:es)?\b/i, introducedAt: 3 }
];

/** The gas laws, pressure and the speed screen are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q5-speed'];

export const QUEST_KEY = 'unit04/q6-real';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RIG = 'rig';

/** The piston's settings for stage 2 (litres): a thousand-fold squeeze in six steps. */
export const SQUEEZE = [24.6, 2.5, 0.5, 0.2, 0.1, 0.06];
/** Stage 3: carbon dioxide in a small room, and the heater's settings (kelvin): the gauge crosses the gas law between the third and fifth. */
export const HOLD_V = 0.5;
export const HOT = [250, 400, 600, 900, 1500];
/** The cold settings of stage 4 (kelvin). */
export const COLD = [200, 220, 240];

/** A real-gas cylinder: its gauge is the van der Waals one, held to the plain gas law beside it. */
const cyl = (id, label, gas, extra = {}) => ({ id, label, gas, n: 1, T: 300, V: 1, hold: 'dial', vdw: true, ...extra });

export const GUESSES = [['less', 'Less than the gas law says'], ['exact', 'Exactly what the gas law says'], ['more', 'More than the gas law says']];
export const COLD_CARDS = [
  ['attractions', 'Attractions between particles lower pressure'],
  ['volume', 'Particle volume raises pressure'],
  ['none', 'Neither effect changes pressure']
];

/** The side of the gas law a cylinder reads on, as the card that says so: within two percent is "on" the law. */
export function sideOf(q) {
  const ratio = q.ideal > 0 ? q.P / q.ideal : 1;
  return ratio > 1.02 ? 'more' : ratio < 0.98 ? 'less' : 'exact';
}

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Compression Prediction',
    prompt: 'When helium is compressed to a hundredth of its volume, how does a real pressure sensor compare with the 100× jump the gas law predicts?',
    items: GUESSES,
    hints: [
      'The ideal gas law assumes gas particles take up zero volume themselves.',
      'Picture gas particles packed into a tiny space where their own size starts to matter.',
      'Think about whether less empty space makes particles hit the walls more often or less often.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, you will compress a cylinder of helium to see if it follows the gas law.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 36, y: 30 }, {
      cyls: [cyl('a', 'Cylinder 13', 'He')], volumes: SQUEEZE, volumeStart: 1, vmax: 24.6, w: 62, trueSize: true,
      show: { temperature: false, amount: false, ideal: true }
    });
    return {
      title: 'High-Pressure Compression',
      briefing: 'A sealed cylinder holds 1 mol of helium at 300 K with particles drawn to scale.',
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'At 0.06 L, how does helium\'s measured pressure compare with the ideal gas law?', 'At 0.06 L, how does helium\'s measured pressure compare with the ideal gas law?');
      },
      widget,
      table: gasTable({
        pieces: [stmt('less', 'Less than the gas law says', { x: 90, y: 45 }), stmt('exact', 'Exactly what the gas law says', { x: 128, y: 45 }), stmt('more', 'More than the gas law says', { x: 109, y: 57.5 })],
        fixtures: [r],
        zones: { slots: [{ id: 'show', label: 'Measured vs gas law', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Turn the Piston dial all the way to 0.06 L.',
        'Compare the cylinder\'s PRESSURE reading with the IDEAL LAW value at 0.06 L.',
        'See whether the measured pressure is lower than, equal to, or higher than the ideal gas law.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (Math.round(t.fixtures[RIG].dials.volume.value) !== SQUEEZE.length) return { ok: false, notYet: true, msg: 'Compress the cylinder to its minimum volume (0.06 L) first.' };
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const q = cylRead(t, RIG, 0);
        if (card.id === sideOf(q)) return { ok: true };
        return { ok: false, msg: 'Compare the measured PRESSURE with the IDEAL LAW reading at 0.06 L.' };
      },
      get reward() {
        return {
          log: 'At high pressure, the reading is above the gas law.',
          title: 'Particle Volume',
          body: 'Under high pressure, helium reads higher than the ideal gas law predicts. Particles take up real space, leaving less empty volume to move in.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 36, y: 30 }, {
      cyls: [cyl('a', 'Cylinder A', 'CO2', { V: HOLD_V, hold: 'V' })], temps: HOT, tempList: 'K', tempStart: 1, vmax: 24.6, w: 62, trueSize: true, attractions: true,
      title: `Cylinder A  ${GASES.CO2.sym}, ${HOLD_V} L`, show: { temperature: false, amount: false, volume: false, ideal: true }
    });
    return {
      title: 'Deviations from Ideal Behavior',
      briefing: 'A 0.5 L cylinder holds 1 mol of CO₂ starting at 250 K. Dashed lines show attractions pulling slow, nearby particles together.',
      prompt: 'Why does cold CO₂ at 250 K read lower pressure than the ideal gas law predicts?',
      widget,
      table: gasTable({
        pieces: answerCards(COLD_CARDS),
        fixtures: [r],
        zones: { slots: [answerSlot('Why cold CO₂ reads low')] }
      }),
      hints: [
        'Compare the measured pressure and ideal gas law at 250 K, then warm the gas with the Heater dial.',
        'Watch the dashed lines between slow particles at 250 K versus fast particles at higher temperatures.',
        'Think about how attractions pulling particles toward each other affect how hard they hit the walls.'
      ],
      check(state) {
        const t = state.table;
        const seen = t.fixtures[RIG].props.seen?.temp || [1];
        if (seen.length < 2) return { ok: false, notYet: true, msg: 'Turn the Heater dial to compare 250 K with a warmer setting.' };
        const card = cardIn(t, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === 'attractions') return { ok: true };
        return { ok: false, msg: 'Particle volume raises pressure; cold attractions between particles lower it.' };
      },
      reward: {
        log: 'Cold, pressure reads below the law; hot and cramped, above.',
        title: 'Ideal Gas and Real Gas',
        body: 'An ideal gas follows PV = nRT; a real gas deviates. At 250 K, attractions between CO₂ particles lower pressure, while at 900 K size and attractions nearly cancel.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 31, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'N2', { V: 2, hold: 'V' }), cyl('b', 'Cylinder B', 'NH3', { V: 2, hold: 'V' }), cyl('c', 'Cylinder C', 'He', { V: 2, hold: 'V' })],
      temps: COLD, tempList: 'K', tempStart: 1, vmax: 2, compact: true, w: 54, rowH: 14.5, trueSize: true,
      show: { gauge: false, volume: false, temperature: false, amount: false, off: true }
    });
    const labels = { a: 'CYLINDER A (N₂)', b: 'CYLINDER B (NH₃)', c: 'CYLINDER C (He)' };
    return {
      title: 'Deviation Comparison',
      prompt: 'Order the three cold gases from closest to the ideal gas law (left) to furthest (right).',
      widget,
      table: gasTable({
        pieces: [
          ...['a', 'b', 'c'].map(id => chip(id, labels[id], { x: 0, y: 0 })),
          { ...stmt('draw', 'Liquid at (°C): NH₃ −33 N₂ −196 He −269', { x: 100, y: 45 }), hidden: true, fetchFrom: 'drawoff' }
        ],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 106, y: 24 }, size: { w: 72, h: 16 }, first: 'Smallest deviation', last: 'Largest deviation', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } },
        fetch: [{ id: 'drawoff', label: 'Cold Draw-off', at: { x: 130, y: 56 } }]
      }),
      hints: [
        'Read the DIFFERENCE percentage on each cold cylinder.',
        'You can also fetch the Cold Draw-off record to see the temperatures where each gas condenses into a liquid.',
        'A larger percentage difference means the gas strays further from the ideal gas law.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders on the strip.' };
        const dev = id => { const q = cylRead(t, RIG, id); return Math.abs(q.P - q.ideal) / q.ideal; };
        const want = ['a', 'b', 'c'].sort((x, y) => dev(x) - dev(y));
        if (order.join() === want.join()) return { ok: true };
        for (let i = 0; i < order.length - 1; i++) {
          if (dev(order[i]) > dev(order[i + 1])) {
            return { ok: false, msg: `${t.pieces[order[i]].label} deviates more than ${t.pieces[order[i + 1]].label}: swap them.` };
          }
        }
        return { ok: false, msg: 'Two adjacent cylinders on the strip are in the wrong order.' };
      },
      reward: {
        log: 'Stronger attractions cause greater deviation.',
        title: 'Particle Attractions',
        body: 'Helium deviates least, nitrogen more, and ammonia most. Stronger attractions between particles pull cold gas pressure further below the ideal gas law.',
        last: true
      }
    };
  })()
];


/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'Summary',
      body: 'Real gases stray from the ideal gas law at high pressure (because particle volume takes up space) and at low temperature (because attractions pull particles together). They behave most ideally at low pressure and high temperature.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('exact', 'slot:predict')],
  [dial(RIG, 'volume', 6), put('more', 'slot:show')],
  [dial(RIG, 'temp', 4), put('attractions', 'slot:answer')],
  [{ fetch: 'drawoff' }, dial(RIG, 'temp', 1), dial(RIG, 'temp', 3), put('c', 'rail:0'), put('a', 'rail:1'), put('b', 'rail:2')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(RIG, 'volume', 6), put('exact', 'slot:show')],
  [dial(RIG, 'temp', 2), put('volume', 'slot:answer')],
  [put('b', 'rail:0'), put('a', 'rail:1'), put('c', 'rail:2')]
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

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { rigAt, cylRead, GASES };
