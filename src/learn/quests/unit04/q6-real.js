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
import { applyNotes } from '../../table/notes.js';
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
    prompt: 'Helium compressed to a hundredth of its volume should have a hundred times the pressure by the gas law: what does a real sensor read?',
    items: GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Picture the gas compressed until its particles nearly fill the volume: ask whether they can still be treated as points.',
      'Ask whether the pressure could rise by more or by less than the law says when the particles themselves take up volume.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'A compression cylinder will now test whether helium deviates from the gas law under high pressure.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 36, y: 30 }, {
      cyls: [cyl('a', 'Cylinder 13', 'He')], volumes: SQUEEZE, volumeStart: 1, vmax: 24.6, w: 62, trueSize: true,
      show: { temperature: false, amount: false, ideal: true },
      gate: { slot: 'show' }, hideUntilCommit: ['gauge', 'ideal']
    });
    return {
      title: 'High-Pressure Compression',
      briefing: 'A sealed cylinder holds 1 mol of helium at 300 K with particles drawn to scale.',
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'Compress the helium fully and place the card for how the pressure compares with the gas law.', 'Compress the helium fully and place the card for how the pressure compares with the gas law.');
      },
      widget,
      table: gasTable({
        pieces: [stmt('less', 'Less than the gas law says', { x: 90, y: 45 }), stmt('exact', 'Exactly what the gas law says', { x: 128, y: 45 }), stmt('more', 'More than the gas law says', { x: 109, y: 57.5 })],
        fixtures: [r],
        zones: { slots: [{ id: 'show', label: 'Prediction', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Turn the Piston dial and place a card in the slot.',
        'Compare the measured pressure with the gas law value at minimum volume.',
        'Read the pressure and the gas law figure at the smallest volume and see which is larger.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (Math.round(t.fixtures[RIG].dials.volume.value) !== SQUEEZE.length) return { ok: false, notYet: true, msg: 'Compress the cylinder to minimum volume first.' };
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === sideOf(cylRead(t, RIG, 0))) return { ok: true };
        return { ok: false, msg: 'The measured pressure is not on that side of the gas law value.' };
      },
      get reward() {
        return {
          log: 'Compressed hard, the pressure reads above the law.',
          title: 'Molecular Volume',
          body: 'At high pressures, helium exerts more pressure than the gas law predicts. Gas particles occupy finite volume themselves, leaving less empty space to move in.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 36, y: 30 }, {
      cyls: [cyl('a', 'Cylinder A', 'CO2', { V: HOLD_V, hold: 'V' })], temps: HOT, tempList: 'K', tempStart: 1, vmax: 24.6, w: 62, trueSize: true,
      title: `Cylinder A  ${GASES.CO2.sym}, ${HOLD_V} L`, show: { temperature: false, amount: false, volume: false, ideal: true }
    });
    return {
      title: 'Deviations from Ideal Behavior',
      briefing: 'A 0.5 L cylinder holds 1 mol of carbon dioxide starting at 250 K.',
      prompt: 'Why does cold CO₂ at 250 K read lower than the gas law predicts?',
      widget,
      table: gasTable({
        pieces: answerCards(COLD_CARDS),
        fixtures: [r],
        zones: { slots: [answerSlot('Why cold CO₂ reads low')] }
      }),
      hints: [
        'Check the cold setting at 250 K, then turn the Heater dial to compare with hotter settings.',
        'Compare the measured pressure with the gas law figure at 250 K and at 1500 K.',
        'At 250 K particles move slowly, so pulls between them matter most.'
      ],
      check(state) {
        const t = state.table;
        const seen = t.fixtures[RIG].props.seen?.temp || [1];
        if (seen.length < 2) return { ok: false, notYet: true, msg: 'Turn the Heater dial to compare 250 K with a warmer setting.' };
        const card = cardIn(t, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === 'attractions') return { ok: true };
        return { ok: false, msg: 'Particle volume raises pressure; cold pulls between particles lower it.' };
      },
      reward: {
        log: 'Cold, pressure reads below the law; hot and cramped, above.',
        title: 'Ideal Gas and Real Gas',
        body: 'A gas that always obeys the gas law is an ideal gas, whereas a real gas deviates. Cold attractions lower pressure and small-volume particle size raises it, canceling near 900 K.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 30, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'N2', { V: 2, hold: 'V' }), cyl('b', 'Cylinder B', 'NH3', { V: 2, hold: 'V' }), cyl('c', 'Cylinder C', 'He', { V: 2, hold: 'V' })],
      temps: COLD, tempList: 'K', tempStart: 1, vmax: 2, compact: true, w: 36, trueSize: true,
      show: { gauge: false, volume: false, temperature: false, amount: false, off: true }
    });
    return {
      title: 'Deviation Comparison',
      prompt: 'Rank the three cold gases on the rail from the one closest to the gas law to the one furthest from it.',
      widget,
      table: gasTable({
        pieces: [
          ...['a', 'b', 'c'].map(id => chip(id, `CYLINDER ${id.toUpperCase()}`, { x: 0, y: 0 })),
          { ...stmt('draw', 'Liquid at (°C): NH₃ −33 N₂ −196 He −269', { x: 100, y: 43 }), hidden: true, fetchFrom: 'drawoff' }
        ],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 108, y: 24 }, size: { w: 66, h: 16 }, first: 'Smallest deviation', last: 'Largest deviation', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } },
        fetch: [{ id: 'drawoff', label: 'Cold Draw-off', at: { x: 130, y: 56 } }]
      }),
      hints: [
        'Turn the Heater dial and arrange the cylinders on the rail.',
        'Fetch the Cold Draw-off record to see the temperatures where each gas condenses into a liquid.',
        'Compare the gap between each pressure and its gas law figure as a share of that figure.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders on the rail.' };
        const dev = id => { const q = cylRead(t, RIG, id); return Math.abs(q.P - q.ideal) / q.ideal; };
        const want = ['a', 'b', 'c'].sort((x, y) => dev(x) - dev(y));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two adjacent cylinders on the rail are in the wrong order.' };
      },
      reward: {
        log: 'Stronger intermolecular forces cause greater deviation.',
        title: 'Intermolecular Attractions',
        body: 'Stronger attractions between particles cause cold gases to fall further below ideal gas law predictions: helium least, nitrogen more, and ammonia most. These same attractive forces allow gases to condense into liquids.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn the Piston dial,', 'then place a card in the slot.'],
  3: ['Turn the Heater dial,', 'then place a card in the slot.'],
  4: ['Turn the Heater dial,', 'then arrange the chips on the rail.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'Summary',
      body: 'Real gases deviate from ideal behavior at high pressures due to molecular volume and at low temperatures due to intermolecular attractions. Real gases behave most ideally at low pressures and high temperatures.'
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
