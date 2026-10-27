/**
 * boss-compressor.js — Learn world 4 elite: THE COMPRESSOR.
 *
 * The machine that runs every pump on the cloud deck, gone rogue. It is made of everything Bellows measured. Five phases, each on the
 * TABLETOP of a bench the player has worked, on the gas kit (`table/kits/gas.js`), with the compressor standing in the table's corner,
 * watching it. Each phase is a DIFFERENT idea from a different bench, and each asks the player to use it, not to read a figure off a plate:
 *
 *   1  the intake   squeeze the gas until the gauge reads four times the plaque     (bench 1: squeezing and the knocks)
 *   2  the heater   heat the helium until its room has doubled                      (bench 2: the room follows the kelvin, not the Celsius number)
 *   3  the tanks    sort the tanks by how many particles each holds                 (bench 3: equal rooms, counting from a plate)
 *   4  the blend    open each tank in turn and rank them by their push              (bench 4: the moles decide the push)
 *   5  the seals    set a reference chamber to leak at the pace of the unmarked one (bench 5: the lighter gas leaks first)
 *
 * (There is no prediction and no field stage in a fight, and the old phases that asked for a figure to be worked out by hand were cut.)
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
  gasTable, rig, tank, pinhole, commonTank, plaqueFixture, cylRead, tankRead, tankMoles, whereIs, pinholeRead, pressureIdeal, sig
} from '../../table/kits/gas.js';
import { widget, put, dial, sort } from './_shared.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = ['unit04/q1-knocks', 'unit04/q2-laws', 'unit04/q3-ideal', 'unit04/q4-mixtures', 'unit04/q5-speed'];

const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The compressor, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const COMPRESSOR_FOE = [{ id: 'compressor', label: 'The Compressor' }];

const RIG = 'rig';
const PIN = 'pin';
const CT = 'ct';
const VALVES = `${CT}.valves`;
const T0 = 300;

/* ------------------------------------------------------------------
   THE TABLES
   Each phase keeps the top-right corner clear for the foe (`FOE_PAD`: x from 126.5, y to 23.5 on a 150 x 64 table).
   ------------------------------------------------------------------ */

/** Phase 1: the intake's cylinder, the room it starts in, and the factor the gauge is asked to climb. */
const INTAKE_VOLUMES = [5, 10, 20, 40];
const INTAKE_START = 3;
const INTAKE_FACTOR = 4;
/** Phase 2: the heater's settings in degrees C (one is double the number it starts at, and one is double the room). */
export const HEATER_TEMPS = [27, 54, 127, 327, 427];
const HEATER_P = 101.3;
/** Phase 3: the reference tank and the three to sort. */
export const TANKS = [
  { id: 'a', gas: 'He', P: 100, V: 10, T: 300 },
  { id: 'b', gas: 'N2', P: 100, V: 10, T: 300 },
  { id: 'c', gas: 'Ar', P: 100, V: 10, T: 150 },
  { id: 'd', gas: 'He', P: 100, V: 5, T: 300 }
];
/** Phase 4: three tanks of 20 L at 300 K; the heaviest gas has the fewest moles. */
export const BLEND = [['a', 'N2', 1.0], ['b', 'CO2', 0.5], ['c', 'He', 1.5]];
const BLEND_V = 20;
/** Phase 5: the unmarked seal's gas, and the gases the reference can be set to. */
export const SEAL = 'Xe';
export const SEAL_GASES = ['Ne', 'Ar', 'Kr', 'Xe'];

const cyl = (id, label, gas, extra = {}) => ({ id, label, gas, n: 1, T: T0, V: 20, hold: 'dial', ...extra });

/** The reward card of each phase: the idea just worked out, named. */
const STAGE_REWARDS = [
  {
    reward: {
      log: 'Intake pressure adjusted.',
      title: 'Intake Pressure',
      body: 'Reducing volume to one-fourth increases pressure fourfold at constant temperature, as gas particles collide with container walls four times as frequently.'
    }
  },
  {
    reward: {
      log: 'Volume doubled with temperature.',
      title: 'Thermal Expansion',
      body: 'Gas volume is directly proportional to absolute temperature in kelvin. Doubling the initial 300 K requires heating to 600 K (327 °C), not 54 °C.'
    }
  },
  {
    reward: {
      log: 'Particle quantities determined.',
      title: 'Mole Counting',
      body: 'Pressure, volume, and temperature together determine the exact mole quantity of gas in a sealed vessel according to the ideal gas law.'
    }
  },
  {
    reward: {
      log: 'Gases ranked by partial pressure.',
      title: 'Partial Pressures',
      body: 'At equal volume and temperature, the gas with the most moles produces the highest pressure regardless of molecular mass.'
    }
  },
  {
    reward: {
      log: 'Seal leak identified.',
      title: 'Effusion Match',
      body: 'Gases with equal effusion rates share identical molar masses. The leak rate matches xenon, identifying the escaping gas.',
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
    const r = rig(RIG, { x: 44, y: 32 }, {
      cyls: [cyl('a', 'INTAKE', 'N2')], volumes: INTAKE_VOLUMES, volumeStart: INTAKE_START, vmax: 40, show: { temperature: false, amount: false }
    });
    const began = sig(pressureIdeal(1, T0, INTAKE_VOLUMES[INTAKE_START - 1]), 3);
    return {
      id: 'phase1',
      title: 'Phase 1 · The Intake',
      briefing: {
        speaker: SPEAKER,
        body: 'Apply the gas relationships from each bench to stabilize the compressor and clear the fault.'
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
        'Turn the Piston dial.',
        'Compare the reading at each setting with the figure on the plaque.',
        'Select the setting where volume has decreased by the same factor pressure must increase.'
      ],
      check(state) {
        const t = state.table;
        const q = cylRead(t, RIG, 0);
        const start = pressureIdeal(1, T0, INTAKE_VOLUMES[INTAKE_START - 1]);
        if (Math.abs(q.P - start) < 1e-6) return { ok: false, notYet: true, msg: 'The gauge still reads its starting value.' };
        if (Math.abs(q.P / start - INTAKE_FACTOR) < 0.01) return { ok: true };
        return q.P / start < INTAKE_FACTOR
          ? { ok: false, msg: 'The gauge reading is below the target figure.' }
          : { ok: false, msg: 'The gauge reading exceeds the target figure.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 44, y: 32 }, {
      cyls: [cyl('a', 'HEATER', 'He', { hold: 'P', P0: HEATER_P, V: 24.6, T: 300.15 })], temps: HEATER_TEMPS, tempList: 'C', tempStart: 1, vmax: 60,
      show: { gauge: false, amount: false }
    });
    return {
      id: 'phase2',
      title: 'Phase 2 · The Heater',
      prompt: 'Heat the helium until its volume has doubled.',
      widget,
      table: gasTable({ fixtures: [r] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Heat Helium',
        intent: 'The compressor swells its heater cylinder against the weight on the piston.'
      },
      hints: [
        'Turn the Heater dial.',
        'Compare the volume at each setting with the starting volume.',
        'Select the setting where the volume is exactly twice the starting volume.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Heater dial to adjust temperature.' };
        const ratio = cylRead(t, RIG, 0).V / cylRead({ ...t, fixtures: { ...t.fixtures, [RIG]: { ...t.fixtures[RIG], dials: { ...t.fixtures[RIG].dials, temp: { ...t.fixtures[RIG].dials.temp, value: 1 } } } } }, RIG, 0).V;
        if (Math.abs(ratio - 2) < 0.02) return { ok: true };
        return { ok: false, msg: ratio < 2 ? 'The volume has not yet doubled.' : 'The volume has increased past double.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const mk = ({ id, gas, P, V, T }, at, extra = {}) => tank(id, `TANK ${id.toUpperCase()}`, at, { gas, P, V, T, plate: true, gaugeMax: 300, ...extra });
    const tray = (id, label, x) => ({ id, label, at: { x, y: 30 }, size: { w: 38, h: 20 }, cell: 15 });
    const xs = { a: 14, b: 44, c: 74, d: 104 };
    return {
      id: 'phase3',
      title: 'Phase 3 · The Tanks',
      prompt: 'Sort each tank into a tray based on particle count compared to Tank A.',
      widget,
      table: gasTable({
        pieces: TANKS.map(t => mk(t, { x: xs[t.id], y: 54 }, t.id === 'a' ? { fixed: true } : {})),
        zones: { trays: [tray('fewer', 'Fewer particles', 25), tray('same', 'The same number', 65), tray('more', 'More particles', 105)] }
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Count Tanks',
        intent: 'The compressor keeps its tanks shut and shows only their plates.'
      },
      hints: [
        'Drag each tank into a tray.',
        'Compare each tank\'s pressure, volume, and temperature with Tank A.',
        'Determine particle counts from the ideal gas law relationship.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['b', 'c', 'd'];
        if (!ids.every(id => ['fewer', 'same', 'more'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Place every tank in a tray.' };
        const nA = tankMoles(t.pieces.a);
        for (const id of ids) {
          const ratio = tankMoles(t.pieces[id]) / nA;
          const want = Math.abs(ratio - 1) < 1e-6 ? 'same' : ratio > 1 ? 'more' : 'fewer';
          if (whereIs(t, id) !== want) return { ok: false, msg: `Tank ${id.toUpperCase()} does not belong in that tray.` };
        }
        return { ok: true };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 30 }, { V: BLEND_V, T: T0, of: VALVES, show: { partials: true }, words: 2 });
    return {
      id: 'phase4',
      title: 'Phase 4 · The Blend',
      prompt: 'Arrange the three tanks on the rail from highest pressure to lowest pressure.',
      widget,
      table: gasTable({
        pieces: BLEND.map(([id, gas, n]) => tank(id, `TANK ${id.toUpperCase()}`, { x: 0, y: 0 }, { gas, n, V: BLEND_V, T: T0, noGauge: true, printMass: true })),
        fixtures: [ct.fixture],
        zones: {
          trays: [ct.tray],
          rail: { id: 'rail', at: { x: 108, y: 48 }, size: { w: 80, h: 16 }, first: 'Highest pressure', last: 'Lowest pressure', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] }
        }
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Rank Tanks',
        intent: 'The compressor holds its blending tanks at one steady push.'
      },
      hints: [
        'Drag a tank into the common tank tray to read its pressure, then return it to the rail.',
        'Compare pressures of tanks with equal volume and temperature rather than their masses.',
        'Place the tank with the highest pressure at the left end of the rail.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three tanks on the rail.' };
        const want = BLEND.map(b => b[0]).sort((x, y) => tankRead(t.pieces[y]).P - tankRead(t.pieces[x]).P);
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two adjacent tanks on the rail are in the wrong order.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const p = pinhole(PIN, { x: 40, y: 30 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: SEAL, label: 'SEAL B', sealed: true }],
      picks: { ref: { gases: SEAL_GASES, label: 'Gas', start: 1 } }, times: [0, 1, 2, 3, 4, 5, 6, 7, 8], timeStart: 1, showHalf: true, record: false
    });
    return {
      id: 'phase5',
      title: 'Phase 5 · The Seals',
      prompt: 'Set the reference gas so its effusion rate matches the unmarked seal.',
      widget,
      table: gasTable({ fixtures: [p] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Name Gas',
        intent: 'A pinhole hisses in the compressor\'s flank, and nothing says what is leaving it.'
      },
      hints: [
        'Adjust the Gas and Stopwatch dials.',
        'Compare the time required for each chamber to reach half its initial amount.',
        'Select the reference gas whose half-time matches the seal.'
      ],
      check(state) {
        const t = state.table;
        const r = pinholeRead(t, PIN);
        const ref = r.chambers[0];
        const seal = r.chambers[1];
        if (Math.round(t.fixtures[PIN].dials.ref.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Gas dial to test different gases.' };
        if (ref.gas === seal.gas) return { ok: true };
        return { ok: false, msg: ref.half < seal.half ? 'The reference chamber empties faster than the seal.' : 'The reference chamber empties more slowly than the seal.' };
      },
      ...STAGE_REWARDS[4]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Piston dial to adjust pressure.'],
  2: ['Turn the Heater dial to adjust temperature.'],
  3: ['Drag each tank into a tray.'],
  4: ['Open one tank at a time to read its pressure,', 'then place it on the rail.'],
  5: ['Adjust the Gas and Stopwatch dials.']
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
      body: 'The compressor stands cold in its housing. In its vault is a sealed cylinder logged at constant pressure for twelve days while surroundings froze fifty degrees, violating Gay-Lussac\'s law for an unheated gas.'
    },
    {
      heading: 'Next',
      body: 'The cylinder goes into the Case File. Something inside it maintained heat for twelve days, which cannot be explained by standard gas behavior.'
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
    explanation: 'At a constant temperature the pressure goes inversely with the volume (Boyle\'s law), so one third of the volume gives three times the pressure: 360 kPa.'
  },
  {
    question: 'A gas under a light piston starts at 27 °C. Roughly what temperature doubles its volume?',
    options: [
      { id: 'a', label: '327 °C' },
      { id: 'b', label: '54 °C' },
      { id: 'c', label: '127 °C' },
      { id: 'd', label: '600 °C' }
    ],
    answer: 'a',
    explanation: 'The volume follows the kelvin temperature: 27 °C is 300 K, twice that is 600 K, which is 327 °C.'
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
    question: 'A chamber of hydrogen and a chamber of carbon dioxide each have a pinhole. Which empties first?',
    options: [
      { id: 'a', label: 'Hydrogen, whose particles are lighter and faster' },
      { id: 'b', label: 'Carbon dioxide, whose particles are heavier' },
      { id: 'c', label: 'They empty together' },
      { id: 'd', label: 'Neither empties' }
    ],
    answer: 'a',
    explanation: 'At one temperature the lighter particles move faster and reach the hole more often.'
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
    explanation: 'At a fixed volume the pressure is proportional to the kelvin temperature (Gay-Lussac\'s law), so halving the kelvin temperature halves the pressure.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

/** The bench state that solves each phase, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [dial(RIG, 'volume', 1)],
  [dial(RIG, 'temp', 4)],
  [...sort({ b: 'same', c: 'more', d: 'fewer' })],
  [
    put('c', `tray:${VALVES}`), put('c', 'rail:0'), put('a', `tray:${VALVES}`), put('a', 'rail:1'), put('b', `tray:${VALVES}`), put('b', 'rail:2')
  ],
  [dial(PIN, 'time', 4), dial(PIN, 'ref', 4)]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [dial(RIG, 'volume', 2)],
  [dial(RIG, 'temp', 2)],
  [...sort({ b: 'more', c: 'more', d: 'fewer' })],
  [put('b', 'rail:0'), put('a', 'rail:1'), put('c', 'rail:2')],
  [dial(PIN, 'ref', 3)]
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
export { pressureIdeal, tankRead, tankMoles, pinholeRead };
