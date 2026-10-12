/**
 * boss-compressor.js — Learn world 4 elite: THE COMPRESSOR.
 *
 * The machine that runs every pump on the cloud deck, gone rogue. It is made of
 * everything Bellows measured, and each of its five phases puts the gas rig back
 * in front of the player with a new gas, a new tank or a new pinhole on the plate,
 * and the compressor standing in the well reading it:
 *
 *   1  the intake   set the piston until the gauge reads four times its first reading   (bench 2)
 *   2  the heater   the volume a free piston reaches at a temperature the dial lacks    (benches 2, 3)
 *   3  the tank     the mass of gas in a sealed tank, from its gauge                    (bench 3)
 *   4  the blend    the partial pressure of one gas in a mixture                        (bench 4)
 *   5  the seals    an unmarked gas, named by racing its leak against nitrogen          (bench 5)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the
 * objective and never the route. A hint rung is one sentence and never the
 * answer. Nothing blocks a correct commit. A miss costs one point of Integrity
 * and three knock the rig back, with every reading and hint still kept.
 *
 * Clearing it files the Case File clue `clue_bellows_warm`. The boss pays no XP:
 * the main story never does.
 */

import { mountGas, gasState } from '../../engine/gasmount.js';
import { blankAnswer } from '../../engine/stagerunner.js';
import { readOf, volumeIdeal, GASES, R } from '../../engine/gasdata.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = ['unit04/q2-laws', 'unit04/q3-ideal', 'unit04/q4-mixtures', 'unit04/q5-speed'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const cyl = (id, label, gas, extra = {}) => ({
  id, label, head: 'cylinder', gas, n: 1, T: 300, V: 20, hold: 'dial', ...extra
});
const tank = (id, label, parts, extra = {}) => ({ id, label, head: 'mixture', parts, V: 10, T: 300, ...extra });
const leak = (id, label, gas, extra = {}) => ({ id, label, head: 'leak', gas, dots: 24, ...extra });
const choice = (id, label) => ({ id, label });

const BASE = { scale: 'kpa', units: true, labels: { gauge: 'PRESSURE' }, tempUnit: 'both' };

/* ------------------------------------------------------------------
   THE FIVE PHASES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Phase 1 · The Intake',
    briefing: {
      speaker: SPEAKER,
      body: 'This is the compressor that runs every pump on the deck, and each phase puts one of the benches in front of it again. A miss costs the rig a point of Integrity; three knock it back, and nothing you have read is lost.'
    },
    prompt: 'The rogue compressor\'s intake cylinder is roaring on the cloud deck! Adjust the volume dial to compress the gas until the pressure gauge reads four times its starting value.',
    controls: ['volume'],
    volumes: [5, 10, 20, 40], volumeStart: 3,
    ...BASE,
    vmax: 40, gaugeMax: 600,
    rigs: [cyl('a', 'INTAKE', 'N2', { note: 'the compressor\'s intake cylinder, under a piston' })],
    widget: { type: 'none' },
    encounter: {
      species: 'the compressor',
      act: 'Set Piston',
      intent: 'The compressor cycles at a steady stroke over its intake.'
    },
    hints: [
      'Turn the volume dial and read the gauge at each setting.',
      'Compare the reading at each setting with the reading the phase began on.',
      'Find the setting at which the room has fallen by the same factor that the pressure must climb.'
    ],
    check(state) {
      const start = readOf(STAGES[0], 'a', {}).P;
      const now = readOf(STAGES[0], 'a', { volume: state.volume }).P;
      if (Math.abs(now - start) < 1e-6) return { ok: false, notYet: true, msg: 'The gauge still reads what it did when the phase began.' };
      if (Math.abs(now / start - 4) < 0.01) return { ok: true };
      return now / start < 4
        ? { ok: false, msg: 'The gauge is still short of what the phase asks for.' }
        : { ok: false, msg: 'The gauge has gone past what the phase asks for.' };
    },
    reward: {
      title: 'Intake Choked',
      body: 'A quarter of the room gives four times the pressure: Boyle\'s law, with the temperature held. The compressor\'s intake can be starved by the same law that fills it.',
      log: 'The pressure set to four times its first reading.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Phase 2 · The Heater',
    prompt: 'The compressor fires up its thermal jacket while its free-floating piston keeps pressure constant! What volume will this helium sample expand to at 750 K (to the nearest 5 L)?',
    controls: ['temp'],
    temps: [300, 450, 600, 900], tempStart: 1, tempList: 'K',
    ...BASE,
    thermoLo: -50, thermoHi: 700, vmax: 80, gaugeMax: 200,
    rigs: [cyl('a', 'HEATER', 'He', { hold: 'P', P0: 101.3, note: 'the compressor\'s heater cylinder, under a free piston' })],
    widget: { type: 'number', label: 'Volume at 750 K, in litres', min: 20, max: 100, step: 5 },
    encounter: {
      species: 'the compressor',
      act: 'Give Volume',
      intent: 'The compressor swells its heater cylinder against the weight on the piston.'
    },
    hints: [
      'Turn the temperature dial and read the volume at each of its settings.',
      'Compare the volumes at the two settings either side of 750 K with their temperatures.',
      'Scale a volume you can read by the ratio of 750 K to the kelvin temperature of that reading.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the volume.' };
      const a = STAGES[1].rigs[0];
      const want = volumeIdeal(a.n, 750, a.P0);
      if (Math.abs(state.number - want) <= 2.5) return { ok: true };
      return { ok: false, msg: 'The dial has no setting at that temperature, so the volume has to be worked out from the ones it does have.' };
    },
    reward: {
      title: 'Heater Choked',
      body: 'At a steady pressure the volume goes in step with the kelvin temperature, so a volume at a temperature the dial lacks follows from any one it has. The compressor\'s heater was running to a formula.',
      log: 'A volume found between two settings.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Phase 3 · The Tank',
    prompt: 'The compressor seals off an emergency oxygen reservoir and arms its pressure gauge! Calculate the total mass of oxygen inside the sealed tank in grams.',
    controls: ['temp'],
    temps: [300, 350, 400], tempStart: 1, tempList: 'K',
    ...BASE,
    show: { mass: true },
    reference: ['R = 8.31 kPa·L per mol·K', 'Molar mass of oxygen: 32.0 g/mol'],
    vmax: 15, gaugeMax: 250,
    rigs: [cyl('a', 'TANK', 'O2', { n: 0.75, V: 15, hold: 'V', sealed: true, note: 'the compressor\'s sealed tank' })],
    widget: { type: 'number', label: 'Grams of oxygen', min: 0, max: 60, step: 2 },
    encounter: {
      species: 'the compressor',
      act: 'Give Mass',
      intent: 'The compressor keeps its tank shut and shows only its gauge.'
    },
    hints: [
      'Read the gauge, the volume and the thermometer, and heat the tank to take a second reading.',
      'Check that the amount of gas you work out is the same at both temperatures.',
      'Work out the moles from the gas law and multiply them by the molar mass of oxygen.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the mass.' };
      const r = readOf(STAGES[2], 'a', {});
      if (Math.abs(state.number - r.mass) < 1) return { ok: true };
      return { ok: false, msg: 'The gas law gives moles, and the mass is a separate step from them; check both steps.' };
    },
    reward: {
      title: 'Tank Weighed',
      body: 'The gas law gives the moles in a sealed tank from its gauge, and the molar mass turns the moles into grams. The compressor\'s tank was weighed without being opened.',
      log: 'The mass of a gas found from its gauge.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Phase 4 · The Blend',
    prompt: 'A pressurized helium-neon blend is stabilizing the machine\'s central manifold! What partial pressure does the helium contribute to the total tank gauge, in kilopascals?',
    controls: [],
    ...BASE,
    labels: { gauge: 'PRESSURE', share: 'MOLE FRACTION' },
    show: { share: true },
    gaugeMax: 300,
    rigs: [tank('a', 'BLEND', [{ gas: 'He', n: 1.5 }, { gas: 'Ne', n: 0.5 }], { V: 24.94, note: 'the compressor\'s blending tank' })],
    widget: { type: 'number', label: 'Helium pushes with, in kPa', min: 0, max: 200, step: 10 },
    encounter: {
      species: 'the compressor',
      act: 'Give Share',
      intent: 'The compressor holds its blending tank at one steady push.'
    },
    hints: [
      'Read the gauge for the whole tank and the mole fraction of each gas.',
      'Compare the share of the moles that helium makes up with the share of the push it must make.',
      'Multiply the mole fraction of helium by the total pressure on the gauge.'
    ],
    check(state) {
      if (state.number === null || state.number === undefined) return { ok: false, notYet: true, msg: 'Set the pressure.' };
      const m = readOf(STAGES[3], 'a', {});
      const want = m.rows.find(r => r.gas === 'He').P;
      if (Math.abs(state.number - want) < 5) return { ok: true };
      return { ok: false, msg: 'A gas in a blend pushes with only its own share of the total on the gauge.' };
    },
    reward: {
      title: 'Blend Split',
      body: 'Each gas in a blend pushes as if alone, so its partial pressure is its mole fraction times the total. The compressor\'s blend was read gas by gas.',
      log: 'The partial pressure of one gas in a blend.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Phase 5 · The Seals',
    prompt: 'The compressor\'s flank cracks, venting an unknown gas alongside known nitrogen! Race their leak times through the pinhole to identify the mystery escaping gas.',
    controls: ['time'],
    times: [0, 1, 2, 3, 4, 5, 6, 7, 8], timeStart: 1,
    ...BASE,
    show: { half: true },
    reference: ['Molar masses — what one mole weighs — in g/mol: N₂ 28.0, Ne 20.2, Ar 39.9, Kr 83.8, Xe 131'],
    rigs: [
      leak('a', 'SEAL A', 'N2', { note: 'a seal known to hold nitrogen' }),
      leak('b', 'SEAL B', 'Kr', { sealed: true, note: 'an unmarked seal' })
    ],
    widget: {
      type: 'choice', label: 'The escaping gas is',
      options: [choice('Ne', 'Ne'), choice('Ar', 'Ar'), choice('Kr', 'Kr'), choice('Xe', 'Xe')]
    },
    encounter: {
      species: 'the compressor',
      act: 'Name Gas',
      intent: 'A pinhole hisses in the compressor\'s flank, and nothing says what is leaving it.'
    },
    hints: [
      'Turn the time dial and read the time each seal takes to be half empty.',
      'Compare the two times as a ratio and square it.',
      'Multiply the molar mass of nitrogen by the square of the ratio of the times.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a gas.' };
      if (state.choice === 'Kr') return { ok: true };
      return { ok: false, msg: 'The rates go as the root of the molar mass, so square the ratio of the times before comparing it with the masses listed.' };
    },
    reward: {
      title: 'Compressor Still',
      body: 'Racing an unknown gas against a known one through a pinhole names it: the square of the ratio of the leak times is the ratio of the molar masses. The seal gave the compressor away, and it stands still.',
      log: 'An unmarked gas named by its leak.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: 'clue_bellows_warm',
  sections: [
    {
      heading: 'What You Found',
      body: 'The compressor stands cold in its housing. In its vault is a sealed cylinder logged at one pressure for twelve days while the deck froze fifty degrees around it, and Gay-Lussac\'s law says no sealed gas can do that.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase was a bench you had already worked: a piston, a heater, a sealed tank, a blend and a pinhole. That is all of Bellows, and it was enough to read the machine and to read what it was keeping.'
    },
    {
      heading: 'Next',
      body: 'The cylinder goes into the Case File. Something inside it was giving off heat for twelve days, and no gas law explains where that heat came from.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas at 120 kPa is compressed at a constant temperature to one third of its volume. What is its new pressure?',
    options: [
      { id: 'a', label: '360 kPa' },
      { id: 'b', label: '40 kPa' },
      { id: 'c', label: '120 kPa' },
      { id: 'd', label: '240 kPa' }
    ],
    answer: 'a',
    explanation: 'At a constant temperature the pressure goes inversely with the volume (Boyle’s law), so one third of the volume gives three times the pressure: 360 kPa.'
  },
  {
    question: 'How many moles of gas are in a rigid 8.31 L tank at 300 K and 300 kPa? (R = 8.31 kPa·L/mol·K)',
    options: [
      { id: 'a', label: '1.00 mol' },
      { id: 'b', label: '0.10 mol' },
      { id: 'c', label: '10.0 mol' },
      { id: 'd', label: '3.00 mol' }
    ],
    answer: 'a',
    explanation: 'n = PV/RT = (300 × 8.31) / (8.31 × 300) = 1.00 mol.'
  },
  {
    question: 'A mixture of 3.0 mol of nitrogen and 1.0 mol of oxygen has a total pressure of 200 kPa. What is the partial pressure of the oxygen?',
    options: [
      { id: 'a', label: '50 kPa' },
      { id: 'b', label: '150 kPa' },
      { id: 'c', label: '25 kPa' },
      { id: 'd', label: '100 kPa' }
    ],
    answer: 'a',
    explanation: 'The mole fraction of oxygen is 1.0 / 4.0 = 0.25, and its partial pressure is 0.25 × 200 = 50 kPa.'
  },
  {
    question: 'Gas X takes four times as long as helium (4.0 g/mol) to effuse. What is the molar mass of gas X?',
    options: [
      { id: 'a', label: '64 g/mol' },
      { id: 'b', label: '16 g/mol' },
      { id: 'c', label: '32 g/mol' },
      { id: 'd', label: '8.0 g/mol' }
    ],
    answer: 'a',
    explanation: 'The rates go as one over the square root of the molar mass, so the ratio of the molar masses is the square of the ratio of the times: 4.0 × 4² = 64 g/mol.'
  },
  {
    question: 'A sealed rigid cylinder of gas is cooled from 400 K to 200 K. What happens to its pressure?',
    options: [
      { id: 'a', label: 'It halves' },
      { id: 'b', label: 'It doubles' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It falls to a quarter' }
    ],
    answer: 'a',
    explanation: 'At a fixed volume the pressure is proportional to the kelvin temperature (Gay-Lussac’s law), so halving the kelvin temperature halves the pressure.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return {}; }

export const SOLUTIONS = [
  { volume: 1 },
  { number: 60 },
  { number: 24 },
  { number: 150 },
  { choice: 'Kr' }
];

export const MISSES = [
  { volume: 2 },
  { number: 40 },
  { number: 12 },
  { number: 50 },
  { choice: 'Ar' }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...gasState(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };
  return mountGas(container, bossCtx, { STAGES, DEBRIEF, toolNoteFor, blankState });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { readOf, volumeIdeal, GASES, R };
