/**
 * boss-compressor.js — Learn world 4 elite: THE COMPRESSOR.
 *
 * The machine that runs every pump on the cloud deck, gone rogue. It is made of everything Bellows measured. Five phases, each on the
 * TABLETOP of a bench the player has worked (plan `bench-tabletop.md`, phase T5), on the gas kit (`table/kits/gas.js`), with the
 * compressor standing in the table's corner, watching it:
 *
 *   1  the intake   set the piston until the gauge reads four times its first reading   (bench 2)
 *   2  the heater   the volume a free piston reaches at a temperature the dial lacks    (benches 2, 3)
 *   3  the tank     the mass of gas in a sealed tank, from its gauge                    (bench 3)
 *   4  the blend    the partial pressure of one gas in a mixture                        (bench 4)
 *   5  the seals    an unmarked gas, named by racing its leak against nitrogen          (bench 5)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence
 * and never the answer. Nothing blocks a correct commit. A miss costs one point of Integrity and three knock the table back, with every
 * reading and hint still kept. The foe is the compressor itself, in the corner pad of each table (`table/layout.js` `FOE_PAD`): it only
 * observes, and a boss phase never declares a field stage (the walk is suspended while the compressor stands).
 *
 * Clearing it files the Case File clue `clue_bellows_warm`. The boss pays no XP: the main story never does.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, tank, pinhole, chip, markerFixture, plaqueFixture, markerRead, cylRead, tankRead, whereIs,
  pressureIdeal, volumeIdeal, halfTime, GASES, R, sig
} from '../../table/kits/gas.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = ['unit04/q2-laws', 'unit04/q3-ideal', 'unit04/q4-mixtures', 'unit04/q5-speed'];

const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The compressor, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const COMPRESSOR_FOE = [{ id: 'compressor', label: 'The Compressor' }];

const widget = { type: 'table', label: 'The bench' };
const RIG = 'rig';
const PIN = 'pin';
const T0 = 300;

/* ------------------------------------------------------------------
   THE TABLES
   Each phase keeps the top-right corner clear for the foe (`FOE_PAD`: x from 126.5, y to 23.5 on a 150 x 64 table).
   ------------------------------------------------------------------ */

/** Phase 1: the intake's cylinder, the room it starts in, and the factor the gauge is asked to climb. */
const INTAKE_VOLUMES = [5, 10, 20, 40];
const INTAKE_START = 3;
const INTAKE_FACTOR = 4;
/** Phase 2: the helium's weight on the free piston, the temperature asked for, and how it is read. */
const HEATER_TEMPS = [300, 450, 600, 900];
const HEATER_P = 101.3;
const HEATER_ASKED = 750;
/** Phase 3: the sealed tank's oxygen. */
const TANK_O2 = { n: 0.75, V: 15 };
/** Phase 4: the blend, and the gas whose own push is asked. */
const BLEND = { parts: [{ gas: 'He', n: 1.5 }, { gas: 'Ne', n: 0.5 }], V: 24.94, T: T0 };
/** Phase 5: the unmarked seal's gas, and the gases it might be. */
const SEAL = 'Kr';
const CANDIDATES = ['Ne', 'Ar', 'Kr', 'Xe'];

const rigAtHome = (at, o) => rig(RIG, at, o);
const cyl = (id, label, gas, extra = {}) => ({ id, label, gas, n: 1, T: T0, V: 20, hold: 'dial', ...extra });

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */
const STAGE_REWARDS = [
  {
      reward: {
        log: 'The pressure set to four times its first reading.',
        title: 'Intake Choked',
        body: 'A quarter of the room gives four times the pressure: Boyle\'s law, with the temperature held. The compressor\'s intake can be starved by the same law that fills it.'
      }
  },
  {
      reward: {
        log: 'A volume found between two settings.',
        title: 'Heater Choked',
        body: 'At a steady pressure the volume goes in step with the kelvin temperature, so a volume at a temperature the dial lacks follows from any one it has. The compressor\'s heater was running to a formula.'
      }
  },
  {
      reward: {
        log: 'The mass of a gas found from its gauge.',
        title: 'Tank Weighed',
        body: 'The gas law gives the moles in a sealed tank from its gauge, and the molar mass turns the moles into grams. The compressor\'s tank was weighed without being opened.'
      }
  },
  {
      reward: {
        log: 'The partial pressure of one gas in a blend.',
        title: 'Blend Split',
        body: 'Each gas in a blend pushes as if alone, so its partial pressure is its mole fraction times the total. The compressor\'s blend was read gas by gas.'
      }
  },
  {
      reward: {
        log: 'An unmarked gas named by its leak.',
        title: 'Compressor Still',
        body: 'The square of the ratio of effusion times equals the ratio of molar masses. The leak rate identifies the mystery gas as krypton.',
        last: true
      }
  }
];

/* ------------------------------------------------------------------
   THE FIVE PHASES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const r = rigAtHome({ x: 44, y: 32 }, {
      cyls: [cyl('a', 'INTAKE', 'N2')], volumes: INTAKE_VOLUMES, volumeStart: INTAKE_START, vmax: 40, show: { temperature: false, amount: false }
    });
    const began = sig(pressureIdeal(1, T0, INTAKE_VOLUMES[INTAKE_START - 1]), 3);
    return {
      id: 'phase1',
      title: 'Phase 1 · The Intake',
      briefing: {
        speaker: SPEAKER,
        body: 'This is the compressor that runs every pump on the deck, and each phase puts one of the benches in front of it again. A miss costs the table a point of Integrity; three knock it back, and nothing you have read is lost.'
      },
      prompt: 'Bring the gauge to four times the figure on the plaque.',
      widget,
      table: gasTable({ fixtures: [r, plaqueFixture('began', 'The gauge began at', { x: 106, y: 36 }, [`${began} kPa`], { w: 44 })] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Set Piston',
        intent: 'The compressor cycles at a steady stroke over its intake.'
      },
      hints: [
        'Turn the Piston dial and read the gauge at each setting.',
        'Compare the reading at each setting with the figure on the plaque.',
        'Find the setting at which the room has fallen by the same factor that the pressure must climb.'
      ],
      check(state) {
        const t = state.table;
        const q = cylRead(t, RIG, 0);
        const start = pressureIdeal(1, T0, INTAKE_VOLUMES[INTAKE_START - 1]);
        if (Math.abs(q.P - start) < 1e-6) return { ok: false, notYet: true, msg: 'The gauge still reads what it did when the phase began.' };
        if (Math.abs(q.P / start - INTAKE_FACTOR) < 0.01) return { ok: true };
        return q.P / start < INTAKE_FACTOR
          ? { ok: false, msg: 'The gauge is still short of what the phase asks for.' }
          : { ok: false, msg: 'The gauge has gone past what the phase asks for.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rigAtHome({ x: 44, y: 32 }, {
      cyls: [cyl('a', 'HEATER', 'He', { hold: 'P', P0: HEATER_P })], temps: HEATER_TEMPS, tempList: 'K', tempStart: 1, vmax: 80,
      show: { gauge: true, amount: false, kelvin: true, temperature: false }
    });
    return {
      id: 'phase2',
      title: 'Phase 2 · The Heater',
      prompt: 'At constant pressure, what volume will this helium reach at 750 K, to the nearest 5 L?',
      widget,
      table: gasTable({ fixtures: [r, markerFixture('vol', 'Volume at 750 K', { x: 106, y: 36 }, { min: 0, max: 100, step: 5, start: 0, unit: 'L', w: 50 })] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Give Volume',
        intent: 'The compressor swells its heater cylinder against the weight on the piston.'
      },
      hints: [
        'Turn the Heater dial and read the volume at each of its settings.',
        'Compare the volumes at the settings either side of 750 K with their temperatures.',
        'Scale a volume you can read by the ratio of 750 K to the kelvin temperature of that reading.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'vol');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the volume.' };
        const want = volumeIdeal(1, HEATER_ASKED, HEATER_P);
        if (Math.abs(v - want) <= 2.5) return { ok: true };
        return { ok: false, msg: 'The dial has no setting at that temperature, so the volume has to be worked out from the ones it does have.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rigAtHome({ x: 44, y: 32 }, {
      cyls: [cyl('a', 'TANK', 'O2', { n: TANK_O2.n, V: TANK_O2.V, hold: 'V', sealed: true })], temps: [300, 350, 400], tempList: 'K', tempStart: 1, vmax: 15,
      show: { amount: false }
    });
    return {
      id: 'phase3',
      title: 'Phase 3 · The Tank',
      prompt: 'Calculate the total mass of oxygen in grams inside the sealed tank.',
      widget,
      table: gasTable({
        fixtures: [
          r,
          plaqueFixture('ref', 'What you may use', { x: 100, y: 14 }, ['R = 8.31 kPa·L per mol·K', 'Molar mass of oxygen: 32.0 g/mol'], { w: 46 }),
          markerFixture('grams', 'Grams of oxygen', { x: 106, y: 46 }, { min: 0, max: 60, step: 2, start: 0, unit: 'g', w: 50 })
        ]
      }),
      foes: COMPRESSOR_FOE,
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
        const t = state.table;
        const v = markerRead(t, 'grams');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the mass.' };
        const want = TANK_O2.n * GASES.O2.M;
        if (Math.abs(v - want) < 1) return { ok: true };
        return { ok: false, msg: 'The gas law gives moles, and the mass is a separate step from them; check both steps.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    return {
      id: 'phase4',
      title: 'Phase 4 · The Blend',
      prompt: 'What partial pressure in kilopascals does helium contribute to this mixture?',
      widget,
      table: gasTable({
        pieces: [tank('t', 'BLEND', { x: 44, y: 32 }, { parts: BLEND.parts, V: BLEND.V, T: BLEND.T, partsPlate: true, plate: false, gaugeMax: 300 })],
        fixtures: [markerFixture('push', 'Helium pushes with', { x: 106, y: 36 }, { min: 0, max: 200, step: 10, start: 0, unit: 'kPa', w: 50 })]
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Give Share',
        intent: 'The compressor holds its blending tank at one steady push.'
      },
      hints: [
        'Read the gauge for the whole tank and the moles of each gas printed on its face.',
        'Compare the share of the moles that helium makes up with the share of the push it must make.',
        'Multiply the share of the moles that is helium by the total pressure on the gauge.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'push');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the pressure.' };
        const want = tankRead(t.pieces.t).rows.find(r => r.gas === 'He').P;
        if (Math.abs(v - want) < 5) return { ok: true };
        return { ok: false, msg: 'A gas in a blend pushes with only its own share of the total on the gauge.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const p = pinhole(PIN, { x: 38, y: 30 }, {
      chambers: [{ id: 'a', gas: 'N2', label: 'SEAL A' }, { id: 'b', gas: SEAL, label: 'SEAL B', sealed: true }],
      times: [0, 1, 2, 3, 4, 5, 6, 7, 8], timeStart: 1, showHalf: true, record: false
    });
    const trays = CANDIDATES.map((g, i) => ({ id: g.toLowerCase(), label: GASES[g].name[0].toUpperCase() + GASES[g].name.slice(1), at: { x: 88 + i * 16, y: 38 }, size: { w: 15, h: 22 }, cell: 13 }));
    return {
      id: 'phase5',
      title: 'Phase 5 · The Seals',
      prompt: 'Race the unmarked seal against nitrogen, then put its chip in the tray of the gas escaping.',
      widget,
      table: gasTable({
        pieces: [chip('u', 'SEAL B', { x: 104, y: 55 })],
        fixtures: [p, plaqueFixture('ref', 'Molar mass, g per mole', { x: 100, y: 11 }, ['N2 28.0  Ne 20.2  Ar 39.9', 'Kr 83.8  Xe 131'], { w: 46 })],
        zones: { trays }
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Name Gas',
        intent: 'A pinhole hisses in the compressor\'s flank, and nothing says what is leaving it.'
      },
      hints: [
        'Turn the Stopwatch dial and read the time each seal takes to be half empty.',
        'Compare the two times as a ratio and square it.',
        'Multiply the molar mass of nitrogen by the square of the ratio of the times.'
      ],
      check(state) {
        const t = state.table;
        const tray = whereIs(t, 'u');
        if (!CANDIDATES.map(g => g.toLowerCase()).includes(tray)) return { ok: false, notYet: true, msg: 'Put the chip in the tray of the gas you think it is.' };
        const guess = GASES.N2.M * (halfTime(SEAL, T0) / halfTime('N2', T0)) ** 2;
        const want = CANDIDATES.slice().sort((a, b) => Math.abs(GASES[a].M - guess) - Math.abs(GASES[b].M - guess))[0].toLowerCase();
        if (tray === want) return { ok: true };
        return { ok: false, msg: 'The rates go as the root of the molar mass, so square the ratio of the times before comparing it with the masses listed.' };
      },
      ...STAGE_REWARDS[4]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Piston dial and read the gauge.'],
  2: ['Turn the Heater dial, work out the volume,', 'then set the marker.'],
  3: ['Turn the Heater dial, work out the mass,', 'then set the marker.'],
  4: ['Read the tank, then set the marker.'],
  5: ['Turn the Stopwatch dial, read the times,', 'then put the chip in a tray.']
};
applyNotes(STAGES, NOTES);

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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

/** The bench state that solves each phase, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [dial(RIG, 'volume', 1)],
  [dial(RIG, 'temp', 3), dial('vol', 'value', 60)],
  [dial(RIG, 'temp', 2), dial('grams', 'value', 24)],
  [dial('push', 'value', 150)],
  [dial(PIN, 'time', 4), put('u', 'tray:kr')]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [dial(RIG, 'volume', 2)],
  [dial('vol', 'value', 40)],
  [dial('grams', 'value', 12)],
  [dial('push', 'value', 50)],
  [dial(PIN, 'time', 4), put('u', 'tray:ar')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
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
  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { pressureIdeal, volumeIdeal, halfTime, GASES, R, tankRead };
