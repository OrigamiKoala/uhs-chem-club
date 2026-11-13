/**
 * q2-laws.js — Bellows, bench two: THE GAS LAWS.
 *
 * 1  PREDICT: warmed from 20 °C to 40 °C, how much bigger is the volume
 * 2  TEST: at what kelvin temperature does Cylinder B double Cylinder A's volume  -> Charles's law
 * 3  what volume would this gas fill at 600 K (worked case first)               -> Using Charles's law
 * 4  PREDICT: a sealed tank cools from 293 K to 243 K, what happens to pressure
 * 5  TEST: cool the tank and read the fraction it fell                          -> Gay-Lussac's law
 * 6  a gas compressed to a third and heated from 300 K to 900 K                 -> Combined Gas Law
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { gasTable, rig, rigAt, cylRead } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, predictStage, cardColumn, typed } from './_shared.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bcharles.?s law\b/i, introducedAt: 2 },
  { term: /\bgay.lussac.?s law\b/i, introducedAt: 5 }
];

/** Pressure, absolute zero, kelvin and Boyle's law are plain words from q1-knocks. */
export const BUILDS_ON = ['unit04/q1-knocks'];

/** The keys the player's two guesses are kept under (`engine/predict.js`). */
export const KEY_ROOM = 'unit04/q2-laws#room';
export const KEY_TANK = 'unit04/q2-laws#tank';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RIG = 'rig';
const T20 = 293;
const P_ATM = 101.325;

/** The guesses of stage 1. */
export const ROOM_GUESSES = [['twice', 'Twice as big'], ['little', 'A little bigger'], ['none', 'No bigger']];
/** The guesses of stage 4 (and the verdicts of stage 5). */
export const TANK_GUESSES = [['same', 'Stays the same'], ['sixth', 'Falls by about a sixth'], ['half', 'Falls by about a half']];

/** Stage 2: the volume doubles at twice the kelvin temperature (586 K), which lies between two dial stops. */
export const DOUBLE_K = 2 * T20;
export const DOUBLE_TOL = 6;
export const DOUBLE_TEMPS = [293, 313, 400, 500, 650];

/** Stage 3's heater, in kelvin; the volume is asked for at BEYOND_K, past the last setting. */
const REACH_TEMPS = [300, 350, 400, 450];
const BEYOND_K = 600;

/** Stage 5's tank cooler, in kelvin (rising to the right), and the setting the prompt names (243 K). */
export const COOL_TEMPS = [193, 243, 273, 293];
export const COOL_AT = 2;

/** Stage 6: a sealed gas compressed to a third (6 L -> 2 L) and heated from 300 K to 900 K (past the 600 K dial). */
export const COMBINED = { P: 100, V1: 6, V2: 2, T1: 300, T2: 900 };
export function combinedP(c = COMBINED) {
  return c.P * (c.V1 / c.V2) * (c.T2 / c.T1);
}

/** How a tank's pressure changed between two settings, as the card that says so. */
export function fallCard(from, to) {
  const drop = 1 - to / from;
  return drop < 0.02 ? 'same' : drop < 0.33 ? 'sixth' : 'half';
}

/* ------------------------------------------------------------------
   THE SIX STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: KEY_ROOM,
    title: 'Temperature and Volume',
    prompt: 'A gas under a freely moving piston is warmed from 20 °C to 40 °C: how much bigger does its volume get?',
    items: ROOM_GUESSES,
    hints: [
      'Lay one card in the slot.',
      'A free piston rises until the gas inside has the same pressure as the air outside.',
      'Think about whether 40 °C is twice as hot as 20 °C on the kelvin scale.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, two cylinders will test how temperature changes gas volume.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const base = { gas: 'He', n: 1, hold: 'P', V: 24, T: T20, P0: P_ATM };
    const a = rig('ra', { x: 20, y: 25 }, { cyls: [{ id: 'a', label: 'Cylinder A', ...base }], vmax: 60, compact: true, w: 34, show: { gauge: false, amount: false, kelvin: true } });
    const b = rig('rb', { x: 58, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder B', ...base }], temps: DOUBLE_TEMPS, tempList: 'K', tempStart: 1, vmax: 60, compact: true, w: 34, show: { gauge: false, amount: false, kelvin: true }
    });
    return {
      title: 'Doubling the Volume',
      prompt: 'At what kelvin temperature does Cylinder B have twice the volume of Cylinder A at 293 K?',
      entry: { id: 'ans', label: 'Cylinder B at', unit: 'K' },
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Turn Cylinder B\'s Heater dial and watch its volume and kelvin temperature.',
        'Notice that volume is in step with the kelvin temperature, not °C.',
        'Find the kelvin temperature that is double Cylinder A\'s starting kelvin temperature.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the temperature in K.' };
        const ratio = v / T20;
        if (Math.abs(v - DOUBLE_K) <= DOUBLE_TOL) return { ok: true };
        return { ok: false, msg: `At ${v} K Cylinder B's volume is ${ratio.toFixed(2)} times Cylinder A's.` };
      },
      reward: {
        log: 'Twice the volume took 586 K, not 40 °C.',
        title: 'Charles\'s Law',
        body: 'The volume doubled at 586 K, twice 293 K, which is 313 °C and not 40 °C. At constant pressure, volume is in step with kelvin temperature: Charles\'s law.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'He', n: 1, hold: 'P', V: 24, T: T20, P0: P_ATM }], temps: REACH_TEMPS, tempList: 'K', tempStart: 1, vmax: 60,
      show: { gauge: false, amount: false, kelvin: true }, label: 'Cylinder'
    });
    return {
      title: 'Using Charles\'s Law',
      briefing: {
        speaker: 'Vess',
        body: 'At constant pressure, volume ÷ kelvin is the same before and after: V₁ ÷ T₁ = V₂ ÷ T₂.',
        worked: ['12 L at 300 K', '12 ÷ 300 = 0.040 L for each kelvin', 'at 450 K: 0.040 × 450 = 18 L']
      },
      prompt: `What volume would this gas fill at ${BEYOND_K} K?`,
      entry: { id: 'ans', label: `Volume at ${BEYOND_K} K`, unit: 'L' },
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the Heater dial and read the volume and kelvin temperature at each setting.',
        'Check whether volume ÷ kelvin stays the same at every setting.',
        'Use V₁ ÷ T₁ = V₂ ÷ T₂ from the worked example to find the volume at the new temperature.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the volume in L.' };
        const a = rigAt(t, RIG, { temp: 1 })[0];
        const want = (a.V / a.T) * BEYOND_K;
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: 'That volume does not match the readings on the cylinder.' };
      },
      reward: {
        log: 'Volume over kelvin stayed the same.',
        title: 'Using Charles\'s Law',
        body: 'Volume ÷ kelvin stays about 0.082 L per K, so at 600 K the gas fills about 49 L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  predictStage({
    key: KEY_TANK,
    title: 'Temperature and Pressure',
    prompt: 'A sealed tank cools from 293 K to 243 K: what happens to its pressure?',
    items: TANK_GUESSES,
    hints: [
      'Lay one card in the slot.',
      'The tank is rigid, so its volume cannot change: ask what cooling does to the collisions on its walls.',
      'Ask how the pressure changes when the kelvin temperature drops by about a sixth.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, a sealed tank will be cooled on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Sealed tank', gas: 'N2', n: 1, hold: 'V', V: 10, T: T20 }], temps: COOL_TEMPS, tempList: 'K', tempStart: 4, vmax: 10,
      show: { amount: false, volume: false, kelvin: true }, plot: { x: 'T', y: 'P' }, label: 'Sealed tank'
    });
    return {
      title: 'Pressure in the Cold',
      prompt: 'By about what fraction does the pressure fall when the tank cools from 293 K to 243 K?',
      widget,
      table: gasTable({
        pieces: cardColumn(TANK_GUESSES, { x: 0 }).map((c, i) => ({ ...c, at: i < 2 ? { x: 90 + i * 38, y: 44.5 } : { x: 109, y: 57.5 } })),
        fixtures: [r],
        zones: { slots: [{ id: 'show', label: 'What the pressure did', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }, { recorder: { at: { x: 109, y: 11 }, size: { w: 36, h: 14 }, xLabel: 'Temperature', xUnit: 'K', yLabel: 'Pressure', yUnit: 'kPa' } }),
      hints: [
        'Turn the Heater dial to 243 K, then place a card in the slot.',
        'Compare the pressure at 243 K with the starting pressure at 293 K.',
        'Compare the drop in pressure with the drop in kelvin temperature.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (Math.round(t.fixtures[RIG].dials.temp.value) !== COOL_AT) return { ok: false, notYet: true, msg: 'Turn the Heater dial to 243 K.' };
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const want = fallCard(rigAt(t, RIG, { temp: 4 })[0].P, rigAt(t, RIG, { temp: COOL_AT })[0].P);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: 'The pressure at 243 K did not fall by the fraction that card says.' };
      },
      reward: {
        log: 'The pressure fell with the kelvin temperature.',
        title: 'Gay-Lussac\'s Law',
        body: 'The kelvin temperature fell by about a sixth and so did the pressure. At constant volume, pressure is in step with kelvin temperature: Gay-Lussac\'s law.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'He', n: 0.24056, hold: 'dial', V: 6, T: 300 }],
      volumes: [6, 4, 3, 2], volumeStart: 1,
      temps: [300, 450, 600], tempList: 'K', tempStart: 1,
      vmax: 8, show: { amount: false, kelvin: true }, label: 'Cylinder'
    });
    return {
      title: 'Two Changes at Once',
      prompt: 'What is the pressure after the volume is cut to a third and the gas is heated from 300 K to 900 K?',
      entry: { id: 'ans', label: 'Final pressure', unit: 'kPa' },
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Use the Piston and Heater dials to see how each change multiplies the starting pressure.',
        'Check the factor from cutting the volume to a third, and the factor from tripling the kelvin temperature.',
        'Multiply the starting pressure by both factors.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the pressure in kPa.' };
        const a = rigAt(t, RIG, { volume: 1, temp: 1 })[0];
        const want = a.P * 3 * (900 / 300);
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        if (Math.abs(v - a.P * 3) / (a.P * 3) < 0.05) return { ok: false, msg: '300 kPa only accounts for one of the two changes.' };
        return { ok: false, msg: v > want ? 'The final pressure is lower than that.' : 'The final pressure is higher than that.' };
      },
      reward: {
        log: 'Volume and temperature changes multiply the pressure.',
        title: 'Two Changes at Once',
        body: 'A third of the volume triples the pressure and three times the kelvin temperature triples it again: 100 kPa becomes 900 kPa.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn Cylinder B\'s Heater dial,', 'then type your answer in the field at the bottom.'],
  3: ['Turn the Heater dial,', 'then type your answer in the field at the bottom.'],
  4: ['Place a card in the slot.'],
  5: ['Turn the Heater dial,', 'then place a card in the slot.'],
  6: ['Test the Piston and Heater dials,', 'then type your answer in the field at the bottom.']
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
      body: 'At constant pressure, gas volume scales with kelvin temperature (Charles\'s law). At constant volume, gas pressure scales with kelvin temperature (Gay-Lussac\'s law). When both volume and temperature change, both factors multiply.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('little', 'slot:predict')],
  [dial('rb', 'temp', 4), typed('ans', '586')],
  [dial(RIG, 'temp', 1), dial(RIG, 'temp', 4), typed('ans', '49')],
  [put('sixth', 'slot:predict')],
  [dial(RIG, 'temp', 4), dial(RIG, 'temp', 2), put('sixth', 'slot:show')],
  [dial(RIG, 'volume', 4), dial(RIG, 'temp', 3), typed('ans', '900')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [typed('ans', '313')],
  [dial(RIG, 'temp', 4), typed('ans', '98')],
  [],
  [dial(RIG, 'temp', 2), put('half', 'slot:show')],
  [dial(RIG, 'volume', 4), typed('ans', '300')]
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
export { rigAt, cylRead };
