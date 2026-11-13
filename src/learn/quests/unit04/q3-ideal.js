/**
 * q3-ideal.js — Bellows, bench three: THE IDEAL GAS LAW.
 *
 * 1  PREDICT: one mole of helium vs one mole of carbon dioxide, which fills more volume
 * 2  TEST: how many moles of carbon dioxide fill the same volume as one mole of helium  -> Avogadro's law
 * 3  what does P × V ÷ (n × T) come to for this gas                                     -> Gas constant R, PV = nRT
 * 4  how many moles of gas are in Tank X (worked case first)                            -> Using the ideal gas law
 * 5  weigh a sealed tank and name the gas                                               -> Molar mass from a tank
 * 6  moles in Tank Y with atmospheres and Celsius                                       -> Units in the gas law
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { gasTable, rig, tank, numCard, cylRead, scaleFixture, scaleRead, plaqueFixture, GASES, R } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, predictStage, answerCards, answerSlot, typed } from './_shared.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bavogadro.?s law\b/i, introducedAt: 2 },
  { term: /\bgas constant\b/i, introducedAt: 3 },
  { term: /\bideal gas law\b/i, introducedAt: 3 },
  { term: /\batmospheres?\b|\batm\b/i, introducedAt: 6 }
];

/** Pressure, kelvin, the laws of bench two and the mole are plain words from here on. */
export const BUILDS_ON = ['unit04/q2-laws', 'unit01/q6-weigh'];

export const QUEST_KEY = 'unit04/q3-ideal';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RIG = 'rig';
const STP = 273.15;
const P_ATM = 101.325;

export const GUESSES = [['he', 'Helium fills more'], ['co2', 'Carbon dioxide fills more'], ['same', 'They fill the same volume']];

/** Stage 2's amounts of carbon dioxide, in moles; the one that fills helium's volume is not the first. */
export const CO2_AMOUNTS = [0.5, 1, 1.5, 2];

/** Stage 3's cards for R in kPa·L/(mol·K). */
export const R_CARDS = [['n831', '8.31', 8.31], ['n0831', '0.0831', 0.0831], ['n83', '83.1', 83.1], ['n101', '101.3', 101.3]];

/** Stage 4: Tank X (distinct from the worked case). */
export const PLATE = { gas: 'N2', P: 400, V: 10, T: 300 };

/** Stage 5: the sealed tank on the scale. */
export const SEALED = { gas: 'CO2', P: 250, V: 10, T: 300 };
export const GAS_CARDS = [['n2', 'Nitrogen, 28 g/mol', 'N2'], ['o2', 'Oxygen, 32 g/mol', 'O2'], ['ar', 'Argon, 40 g/mol', 'Ar'], ['co2', 'Carbon dioxide, 44 g/mol', 'CO2']];

/** Stage 6: Tank Y in atmospheres and degrees C, with R in atmospheres. */
export const ATM_PLATE = { P: 2.5, V: 5, TC: 27 };
export const R_ATM = 0.0821;

/* ------------------------------------------------------------------
   THE SIX STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    ...predictStage({
      key: QUEST_KEY,
      title: 'Heavy Gas, Light Gas',
      prompt: 'One mole of helium and one mole of carbon dioxide are at the same temperature and pressure: which fills more volume?',
      items: GUESSES,
      hints: [
        'Lay one card in the slot.',
        'Ask what fixes the volume a gas fills: how many particles are in it, or how heavy each one is.',
        'Picture the same pressure on a piston from a few heavy particles and from the same number of light ones.'
      ],
      reward: {
        log: 'Prediction recorded.',
        title: 'Prediction Recorded',
        body: 'Your guess is locked in. Next, two cylinders will test whether different gases fill different volumes at the same temperature and pressure.'
      }
    }),
    briefing: {
      speaker: 'Vess',
      body: 'A mole is a fixed, very large number of particles.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const a = rig('ra', { x: 20, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'He', n: 1, hold: 'P', V: 20, T: STP, P0: P_ATM }], vmax: 70, compact: true, w: 34,
      show: { gauge: false, mass: true, kelvin: true }
    });
    const b = rig('rb', { x: 58, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder B', gas: 'CO2', hold: 'P', V: 20, T: STP, P0: P_ATM }], amounts: CO2_AMOUNTS, amountStart: 1, vmax: 70, compact: true, w: 34,
      show: { gauge: false, mass: true, kelvin: true }, hideUntilCommit: ['volume']
    });
    return {
      title: 'Equal Moles, Equal Volumes',
      prompt: 'How many moles of carbon dioxide fill the same volume as one mole of helium?',
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Turn Cylinder B\'s Gas in dial and watch its volume.',
        'Compare the volumes of Cylinder A and Cylinder B at each setting.',
        'Stop where the two volumes match, and read the amount of gas in Cylinder B.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures.rb.dials.amount.value) === 1) return { ok: false, notYet: true, msg: 'Cylinder B\'s dial is where it started: add gas and watch its volume.' };
        const va = cylRead(t, 'ra', 0).V;
        const vb = cylRead(t, 'rb', 0).V;
        if (Math.abs(vb - va) < 0.05) return { ok: true };
        return { ok: false, msg: vb < va ? 'Cylinder B fills less volume than Cylinder A.' : 'Cylinder B fills more volume than Cylinder A.' };
      },
      reward: {
        log: 'A mole of either gas fills the same volume.',
        title: 'Avogadro\'s Law',
        body: 'One mole of each fills the same volume, however heavy its particles. This is Avogadro\'s law.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 36, y: 28 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'N2', n: 1, hold: 'dial', V: 22.4, T: STP }],
      temps: [273, 300, 400], tempList: 'K', tempStart: 1, amounts: [1, 2], amountStart: 1, vmax: 22.4,
      show: { kelvin: true, volume: true }, plot: { x: 'nT', y: 'PV' }, label: 'Cylinder'
    });
    return {
      title: 'The Gas Constant',
      briefing: {
        speaker: 'Vess',
        body: 'Pressure rises with the moles (n) and kelvin temperature (T), and falls as volume (V) grows. Put together, P × V ÷ (n × T) comes to the same number for any gas.'
      },
      prompt: 'What does P × V ÷ (n × T) come to for this gas, in kPa, litres, moles and kelvin?',
      widget,
      table: gasTable({
        pieces: R_CARDS.map(([id, label, v], i) => numCard(id, label, { x: 84 + i * 18, y: 38 }, v)),
        fixtures: [r],
        zones: { slots: [{ id: 'answer', label: 'It comes to', at: { x: 111, y: 52 }, size: { w: 22, h: 11 } }] }
      }, { recorder: { at: { x: 111, y: 17 }, size: { w: 40, h: 24 }, xLabel: 'n × K', xUnit: 'mol K', yLabel: 'P × V', yUnit: 'kPa L' } }),
      hints: [
        'Turn both dials, read P, V, n and T, and place a card in the slot.',
        'Compute P × V ÷ (n × T) at one setting, then check another setting.',
        'Check where the decimal point sits for kPa, litres, moles and kelvin.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (Math.abs(card.props.value - R) < 0.01) return { ok: true };
        return { ok: false, msg: 'The cylinder readings do not come to the number on that card.' };
      },
      reward: {
        log: 'One number ties every reading together.',
        title: 'The Ideal Gas Law',
        body: 'It is 8.31 at every setting. That number is the gas constant, R, and the relation PV = nRT is the ideal gas law.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const nX = (PLATE.P * PLATE.V) / (R * PLATE.T);
    const rx = rig('rx', { x: 36, y: 29 }, {
      cyls: [{ id: 'a', label: 'Tank X', gas: PLATE.gas, n: nX, hold: 'V', V: PLATE.V, T: PLATE.T, sealed: true }],
      volumes: [5, 10, 15, 20], volumeStart: 2, vmax: 20, w: 62,
      title: 'Tank X', show: { amount: false, temperature: false, kelvin: true }
    });
    return {
      title: 'Moles in a Tank',
      briefing: {
        speaker: 'Vess',
        body: 'From PV = nRT, the moles in a tank are n = PV ÷ RT.',
        worked: ['P × V = 500 × 5.0 = 2500', 'R × T = 8.31 × 301 = 2500', 'n = 2500 ÷ 2500 = 1.0 mol']
      },
      prompt: 'How many moles of gas are in Tank X?',
      entry: { id: 'ans', label: 'Moles in Tank X', unit: 'mol' },
      widget,
      table: gasTable({ fixtures: [rx] }),
      hints: [
        'Read the pressure, volume and temperature on Tank X.',
        'Rearrange PV = nRT to solve for moles: n = PV ÷ RT.',
        'Follow the worked example with Tank X\'s pressure, volume and temperature.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the figure in mol.' };
        const want = (PLATE.P * PLATE.V) / (R * PLATE.T);
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        const pAtV = (v * R * PLATE.T) / PLATE.V;
        return { ok: false, msg: `In this ${PLATE.V} L tank at ${PLATE.T} K, ${v} mol would give ${pAtV.toFixed(0)} kPa, not ${PLATE.P} kPa.` };
      },
      reward: {
        log: 'PV ÷ RT gives the moles in Tank X.',
        title: 'Moles in a Tank',
        body: 'For Tank X, n = (400 × 10) ÷ (8.31 × 300), about 1.60 mol.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const sc = scaleFixture('scale', { x: 32, y: 33 });
    const sealed = tank('sealed', 'Sealed tank', { x: 64, y: 33 }, {
      gas: SEALED.gas, P: SEALED.P, V: SEALED.V, T: SEALED.T, sealed: true, plate: true, gaugeMax: 600
    });
    return {
      title: 'Naming a Gas',
      prompt: 'Which gas is in the sealed tank?',
      widget,
      table: gasTable({
        pieces: [sealed, ...answerCards(GAS_CARDS)],
        fixtures: [sc.fixture],
        zones: { slots: [...sc.slots, answerSlot('Gas in the tank')] }
      }),
      hints: [
        'Drag the sealed tank onto the scale to weigh its gas, then place a card in the slot.',
        'Use the tank\'s pressure, volume and temperature to find how many moles it holds.',
        'Divide the gas mass on the scale by the moles to find the mass of one mole.'
      ],
      check(state) {
        const t2 = state.table;
        if (!scaleRead(t2, 'scale').tank) return { ok: false, notYet: true, msg: 'Put the sealed tank on the scale to weigh its gas.' };
        const card = cardIn(t2, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const hit = GAS_CARDS.find(c => c[0] === card.id);
        if (hit && hit[2] === SEALED.gas) return { ok: true };
        return { ok: false, msg: 'That gas does not fit the sealed tank.' };
      },
      reward: {
        log: 'Mass over moles named the gas.',
        title: 'Naming a Gas',
        body: 'The tank holds about 1.0 mol and 44 g of gas, so one mole is 44 g: carbon dioxide.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const nY = (ATM_PLATE.P * P_ATM * ATM_PLATE.V) / (R * (ATM_PLATE.TC + 273.15));
    const ry = rig('ry', { x: 36, y: 29 }, {
      cyls: [{ id: 'a', label: 'Tank Y', gas: 'Ar', n: nY, hold: 'V', V: ATM_PLATE.V, T: ATM_PLATE.TC + 273.15, sealed: true }],
      volumes: [2.5, 5, 10], volumeStart: 2, vmax: 10, w: 62, units: 'atm',
      title: 'Tank Y · Ar', show: { amount: false, temperature: true, gauge: true, volume: true }
    });
    return {
      title: 'Atmospheres and Celsius',
      briefing: {
        speaker: 'Vess',
        body: 'Pressure is also measured in atmospheres: 1 atm is 101.3 kPa. With atm and litres the gas constant is 0.0821.'
      },
      prompt: 'How many moles of gas are in Tank Y?',
      entry: { id: 'ans', label: 'Moles in Tank Y', unit: 'mol' },
      widget,
      table: gasTable({ fixtures: [ry] }),
      hints: [
        'Read the pressure, volume and temperature on Tank Y (R = 0.0821 L·atm/(mol·K)).',
        'Convert the temperature from °C to kelvin before using PV = nRT.',
        'Each number must be in the unit that this R uses, and temperature is always in kelvin.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the figure in mol.' };
        const want = (ATM_PLATE.P * ATM_PLATE.V) / (R_ATM * (ATM_PLATE.TC + 273.15));
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: v > want ? 'That is more gas than Tank Y holds.' : 'That is less gas than Tank Y holds.' };
      },
      reward: {
        log: 'Same law, matched units.',
        title: 'Atmospheres and Celsius',
        body: '2.5 atm, 5.0 L and 300 K give 0.51 mol. Using 27 for the temperature would have given a number eleven times too large.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn Cylinder B\'s Gas in dial.'],
  3: ['Turn the dials, then place a card in the slot.'],
  4: ['Read Tank X, then type your answer at the bottom.'],
  5: ['Weigh the tank on the scale,', 'then place a card in the slot.'],
  6: ['Type your answer in the field at the bottom.']
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
      body: 'Equal moles of any gas fill equal volumes at the same temperature and pressure (Avogadro\'s law). Combining all gas relations gives the ideal gas law, PV = nRT, with R = 8.31 L·kPa/(mol·K) or 0.0821 L·atm/(mol·K) and temperature always in kelvin.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('co2', 'slot:predict')],
  [dial('rb', 'amount', 2)],
  [dial(RIG, 'temp', 2), { run: RIG }, dial(RIG, 'amount', 2), { run: RIG }, put('n831', 'slot:answer')],
  [typed('ans', '1.60')],
  [put('sealed', 'slot:scale.pan'), put('co2', 'slot:answer')],
  [typed('ans', '0.51')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('rb', 'amount', 3)],
  [dial(RIG, 'temp', 2), put('n0831', 'slot:answer')],
  [typed('ans', '16')],
  [put('sealed', 'slot:scale.pan'), put('n2', 'slot:answer')],
  [typed('ans', '5.6')]
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
export { cylRead };
