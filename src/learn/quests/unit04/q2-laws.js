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
const T20 = 300;
const P_ATM = 101.325;

/** The guesses of stage 1. */
export const ROOM_GUESSES = [['twice', 'Twice as big'], ['little', 'A little bigger'], ['none', 'No bigger']];
/** The guesses of stage 4 (and the verdicts of stage 5). */
export const TANK_GUESSES = [['same', 'Stays the same'], ['sixth', 'Falls by about a sixth'], ['half', 'Falls by about a half']];

/** Stage 2: the volume doubles at twice the kelvin temperature (600 K), which is an exact stop on the dial. */
export const DOUBLE_K = 2 * T20;
export const DOUBLE_TOL = 6;
export const DOUBLE_TEMPS = [300, 400, 500, 600, 700];

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
    prompt: 'When a gas under a free piston warms from 20 °C to 40 °C, how much larger does its volume get?',
    items: ROOM_GUESSES,
    hints: [
      'Convert 20 °C and 40 °C to kelvin before picking a card.',
      'A free piston moves until the gas inside has the same pressure as the air outside.',
      'Ask whether 40 °C is really twice as hot as 20 °C on the kelvin scale.'
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
    const a = rig('ra', { x: 45, y: 28 }, { cyls: [{ id: 'a', label: 'Cylinder A', ...base }], vmax: 60, compact: true, w: 40, show: { gauge: false, amount: false, kelvin: true } });
    const b = rig('rb', { x: 105, y: 28 }, {
      cyls: [{ id: 'a', label: 'Cylinder B', ...base }], temps: DOUBLE_TEMPS, tempList: 'K', tempStart: 1, vmax: 60, compact: true, w: 40, show: { gauge: false, amount: false, kelvin: true }
    });
    return {
      title: 'Doubling the Volume',
      prompt: 'By what factor should kelvin temperature increase so volume doubles?',
      entry: { id: 'ans', label: 'Temperature factor', unit: '×' },
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Turn Cylinder B\'s Heater dial until its volume is twice Cylinder A\'s.',
        'Compare Cylinder B\'s kelvin temperature at double volume with Cylinder A\'s 300 K.',
        'Divide the doubled-volume kelvin temperature by 300 K.'
      ],
      check(state) {
        const t = state.table;
        const seen = t.fixtures.rb.props.seen?.temp || [1];
        if (seen.length < 2) return { ok: false, notYet: true, msg: 'Turn Cylinder B\'s Heater dial first.' };
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the factor.' };
        if (Math.abs(v - 2) < 0.02) return { ok: true };
        return { ok: false, msg: v > 2 ? 'At that factor, volume would more than double.' : 'At that factor, volume would less than double.' };
      },
      reward: {
        log: 'Doubling volume takes twice the kelvin temperature.',
        title: 'Charles\'s Law',
        body: '20 °C to 40 °C is only 293 K to 313 K (a 7% rise). Doubling volume takes twice the kelvin temperature (300 K to 600 K, a factor of 2), which is Charles\'s law.',
        model: { type: 'bellows-scene', scene: 'charles' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 75, y: 31 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'He', n: 1, hold: 'P', V: 24, T: T20, P0: P_ATM }], temps: REACH_TEMPS, tempList: 'K', tempStart: 1, vmax: 60, w: 76,
      show: { gauge: false, amount: false, kelvin: true }, label: 'Cylinder'
    });
    return {
      title: 'Using Charles\'s Law',
      briefing: {
        speaker: 'Vess',
        body: 'At constant pressure, volume divided by kelvin temperature stays constant (V₁ ÷ T₁ = V₂ ÷ T₂). Always use kelvin, never Celsius—Celsius can be 0 or negative, which would give zero or negative values.'
      },
      prompt: 'What volume would this gas fill at 327 °C?',
      entry: { id: 'ans', label: 'Volume at 327 °C', unit: 'L' },
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Convert 327 °C to kelvin first using K = °C + 273.',
        'Check that volume divided by kelvin temperature stays constant at every Heater setting.',
        'Compare 300 K with 600 K and scale the cylinder\'s 300 K volume by that same factor.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the volume in L.' };
        const a = rigAt(t, RIG, { temp: 1 })[0];
        const want = (a.V / a.T) * BEYOND_K;
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: `At 300 K the cylinder holds ${a.V.toFixed(1)} L; 327 °C is 600 K (twice as hot), so check your scaling.` };
      },
      reward: {
        log: 'Volume divided by kelvin stayed constant.',
        title: 'Using Charles\'s Law',
        body: '327 °C is 600 K (twice 300 K), and volume ÷ kelvin stays about 0.082 L per K, so at 600 K the gas fills about 49 L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  predictStage({
    key: KEY_TANK,
    title: 'Temperature and Pressure',
    prompt: 'When a rigid sealed tank cools from 293 K to 243 K, what happens to its pressure?',
    items: TANK_GUESSES,
    hints: [
      'Think about how cooling affects particle speed inside a rigid tank that cannot shrink.',
      'With volume fixed, slower particles hit the tank walls less often and less hard.',
      'Compare how much the kelvin temperature drops (50 K out of 293 K) to predict the pressure drop.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, you will cool a sealed tank on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = rig(RIG, { x: 36, y: 27 }, {
      cyls: [{ id: 'a', label: 'Sealed tank', gas: 'N2', n: 1, hold: 'V', V: 10, T: T20 }], temps: COOL_TEMPS, tempList: 'K', tempStart: 4, vmax: 10,
      show: { amount: false, volume: false, kelvin: true }, label: 'Sealed tank'
    });
    return {
      title: 'Pressure in the Cold',
      prompt: 'By about what fraction does the sealed tank\'s pressure drop when cooled from 293 K to 243 K?',
      widget,
      table: gasTable({
        pieces: cardColumn(TANK_GUESSES, { x: 0 }).map((c, i) => ({ ...c, at: i < 2 ? { x: 92 + i * 38, y: 44.5 } : { x: 111, y: 57.5 } })),
        fixtures: [r],
        zones: { slots: [{ id: 'show', label: 'What the pressure did', at: { x: 111, y: 27 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Turn the Heater dial to 243 K and compare the pressure with the starting reading at 293 K.',
        'Find how many kPa the pressure dropped and compare that drop with the starting 244 kPa.',
        'Notice that the pressure drops by the same fraction as the kelvin temperature (50 out of 293).'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (Math.round(t.fixtures[RIG].dials.temp.value) !== COOL_AT) return { ok: false, notYet: true, msg: 'Turn the Heater dial to 243 K first.' };
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const p0 = rigAt(t, RIG, { temp: 4 })[0].P;
        const p1 = rigAt(t, RIG, { temp: COOL_AT })[0].P;
        const want = fallCard(p0, p1);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: `Pressure fell from ${Math.round(p0)} kPa to ${Math.round(p1)} kPa; compare that drop with ${Math.round(p0)} kPa.` };
      },
      reward: {
        log: 'Pressure dropped with kelvin temperature.',
        title: 'Gay-Lussac\'s Law',
        body: 'Cooling by 50 K from 293 K drops pressure by about a sixth (Gay-Lussac\'s law), so a sealed tank in freezing wind should lose pressure.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const r = rig(RIG, { x: 75, y: 31 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'He', n: 0.24056, hold: 'dial', V: 6, T: 300 }],
      volumes: [6, 4, 3, 2], volumeStart: 1,
      temps: [300, 450, 600, 900], tempList: 'K', tempStart: 1,
      vmax: 8, w: 76, show: { amount: false, kelvin: true }, label: 'Cylinder'
    });
    return {
      title: 'Two Changes at Once',
      briefing: {
        speaker: 'Vess',
        body: 'When both volume and kelvin temperature change at once, find each factor separately and multiply them together.'
      },
      prompt: 'By what factor is pressure multiplied when volume is cut to a third and temperature rises from 300 K to 900 K?',
      entry: { id: 'ans', label: 'Pressure factor', unit: '×' },
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Use the Piston and Heater dials to set 2 L and 900 K and compare with the starting 100 kPa pressure.',
        'Find what factor cutting volume to a third multiplies pressure by, and what factor heating from 300 K to 900 K multiplies it by.',
        'Multiply the volume factor and the temperature factor together.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the factor by which pressure is multiplied.' };
        const want = 3 * (900 / 300);
        if (Math.abs(v - want) < 0.05) return { ok: true };
        if (Math.abs(v - 3) < 0.05) return { ok: false, msg: 'A factor of 3 only accounts for one of the two changes.' };
        return { ok: false, msg: v > want ? 'The pressure factor is smaller than that.' : 'The pressure factor is larger than that.' };
      },
      reward: {
        log: 'Volume and temperature changes multiply pressure by 9.',
        title: 'Two Changes at Once',
        body: 'Cutting volume to a third multiplies pressure by 3, and tripling kelvin temperature (300 K to 900 K) multiplies it by 3 again: 3 × 3 = 9.',
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
      body: 'At constant pressure, gas volume scales with kelvin temperature (Charles\'s law). At constant volume, gas pressure scales with kelvin temperature (Gay-Lussac\'s law). When both volume and temperature change, both factors multiply.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('little', 'slot:predict')],
  [dial('rb', 'temp', 4), typed('ans', '2')],
  [dial(RIG, 'temp', 1), dial(RIG, 'temp', 4), typed('ans', '49')],
  [put('sixth', 'slot:predict')],
  [dial(RIG, 'temp', 4), dial(RIG, 'temp', 2), put('sixth', 'slot:show')],
  [dial(RIG, 'volume', 4), dial(RIG, 'temp', 4), typed('ans', '9')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('rb', 'temp', 2), typed('ans', '1.5')],
  [dial(RIG, 'temp', 4), typed('ans', '98')],
  [],
  [dial(RIG, 'temp', 2), put('half', 'slot:show')],
  [dial(RIG, 'volume', 4), typed('ans', '3')]
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
