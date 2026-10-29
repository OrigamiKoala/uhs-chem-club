/**
 * boss-compressor.js — Learn world 4 elite: THE COMPRESSOR.
 *
 * The machine that runs every pump on the cloud deck, gone rogue. It is made of everything Bellows measured. Five phases, each on the
 * TABLETOP of a bench the player has worked, on the gas kit (`table/kits/gas.js`), with the compressor standing in the table's corner,
 * watching it. Each phase is a DIFFERENT idea from a different bench, and each asks the player to use it, not to read a figure off a plate:
 *
 *   1  the intake   set a piston AND a heater so the gauge reads six times the plaque (benches 1 and 2: room and kelvin together; the gauge is hidden)
 *   2  the blend    open tanks until nitrogen pushes 60 kPa of a 100 kPa gauge        (bench 4: the moles decide each push, and the pushes add)
 *   3  the tanks    the mass of gas in a sealed tank from its plate in atm, L and C    (bench 3: the gas law with its units, then the molar mass)
 *   4  the cold box warm a cramped cold gas until its gauge reads on the gas law      (bench 6: pull and size cancel)
 *   5  the seals    set a reference chamber to leak at the pace of the unmarked one   (bench 5: the lighter gas leaks first)
 *
 * (There is no prediction and no field stage in a fight. Phases 1 to 3 ask for a worked figure or a target that cannot be read off the bench; a phase 3 card is a figure, never a guess.)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence
 * and never the answer. Nothing blocks a correct commit. A miss costs one point of Integrity and three knock the table back, with every
 * reading and hint still kept. The foe is the compressor itself, in the corner pad of each table (`table/layout.js` `FOE_PAD`): it only
 * observes, and a boss phase never declares a field stage (the walk is suspended while the compressor stands).
 *
 * Clearing it files the Case File clue `clue_bellows_warm`. The boss pays no XP: the main story never does.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, tank, pinhole, commonTank, commonRead, partialOf, plaqueFixture, cylRead, tankRead, tankMoles, pinholeRead, pressureIdeal, sig, toKelvin, GASES
} from '../../table/kits/gas.js';
import { widget, put, dial, typed } from './_shared.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = ['unit04/q1-knocks', 'unit04/q2-laws', 'unit04/q3-ideal', 'unit04/q4-mixtures', 'unit04/q5-speed', 'unit04/q6-real'];

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

/** Phase 1: the intake's cylinder (it starts at 20 L and 27 C), and the factor the gauge is asked to climb. Only one pair of settings makes six. */
const INTAKE_VOLUMES = [5, 10, 20, 40];
const INTAKE_START = 3;
const INTAKE_TEMPS = [27, 77, 127, 177, 327];
export const INTAKE_FACTOR = 6;
/** Phase 2: four tanks of 100 L at 300 K. Nitrogen must push 60 kPa of a 100 kPa gauge, which three of them do together. */
export const BLEND = [['a', 'N2', 1.5], ['b', 'N2', 0.9], ['c', 'He', 1.6], ['d', 'Ar', 0.8]];
export const BLEND_V = 100;
export const BLEND_WANT = { N2: 60, total: 100, tol: 1 };
/** Phase 3: the mass of gas in a tank from its plate (atmospheres, litres, degrees C). The cards: the answer, Celsius as kelvin, moles taken for grams, and a doubled mass. */
export const WEIGH = { gas: 'He', P: 2.0, V: 10, TC: 27 };
export const R_ATM = 0.0821;
export const WEIGH_CARDS = [['a', '3.2 g', 3.2], ['b', '36 g', 36], ['c', '0.81 g', 0.81], ['d', '6.5 g', 6.5]];
/** Phase 4: ammonia in a small room, and the heater's settings (kelvin): the gauge reads on the gas law at one of them. */
export const COLD_V = 0.5;
export const COLD_TEMPS = [300, 600, 900, 1200, 2000];
/** Phase 5: the unmarked seal's gas, and the gases the reference can be set to. */
export const SEAL = 'Xe';
export const SEAL_GASES = ['Ne', 'Ar', 'Kr', 'Xe'];

/** The grams of gas in phase 3's tank: moles from the gas law in atmospheres and kelvin, times the molar mass. */
export function weighGrams(w = WEIGH) {
  return ((w.P * w.V) / (R_ATM * (w.TC + 273.15))) * GASES[w.gas].M;
}

const cyl = (id, label, gas, extra = {}) => ({ id, label, gas, n: 1, T: T0, V: 20, hold: 'dial', ...extra });

/** The reward card of each phase: the idea just worked out, named. */
const STAGE_REWARDS = [
  {
    reward: {
      log: 'Intake pressure set.',
      title: 'Combined Gas Law',
      body: 'The gauge goes up as the room shrinks and as the kelvin temperature rises, and the two factors multiply: a quarter of the room gives 4 times the gauge, and 450 K against 300 K gives another 1.5, so 6 times.'
    }
  },
  {
    reward: {
      log: 'Blend pressures set.',
      title: 'Partial Pressures',
      body: 'Each gas pushes by its own moles, and the pushes add. Nitrogen\'s 2.4 mol of the 4.0 mol in the tank is a share of 0.6, so it makes 60 kPa of the 100 kPa gauge.'
    }
  },
  {
    reward: {
      log: 'Tank weighed.',
      title: 'Mass From the Gas Law',
      body: 'n = PV ÷ RT = (2.0 × 10) ÷ (0.0821 × 300) = 0.81 mol, and 0.81 mol × 4.0 g/mol is about 3.2 g. The temperature goes in as 300 K, not 27.'
    }
  },
  {
    reward: {
      log: 'Holder read on the law.',
      title: 'Real Gas Crossing',
      body: 'Cold ammonia reads below the gas law because its particles pull on each other; very hot, the room the particles fill pushes the gauge above it. Near 1200 K the two effects cancel.'
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
      cyls: [cyl('a', 'INTAKE', 'N2')], volumes: INTAKE_VOLUMES, volumeStart: INTAKE_START, temps: INTAKE_TEMPS, tempList: 'C', tempStart: 1, vmax: 40,
      show: { gauge: false, amount: false }
    });
    const began = sig(pressureIdeal(1, toKelvin(INTAKE_TEMPS[0], 'C'), INTAKE_VOLUMES[INTAKE_START - 1]), 3);
    return {
      id: 'phase1',
      title: 'Phase 1 · The Intake',
      briefing: {
        speaker: SPEAKER,
        body: 'Apply the gas relationships from each bench to stabilize the compressor and clear the fault.'
      },
      prompt: 'Set the piston and heater so the gauge will read six times the figure on the plaque.',
      widget,
      table: gasTable({ fixtures: [r, plaqueFixture('began', 'The gauge began at', { x: 106, y: 36 }, [`${began} kPa`], { w: 44 })] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Set Intake',
        intent: 'The compressor cycles at a steady stroke over its intake.'
      },
      hints: [
        'Turn the Piston and Heater dials.',
        'Work out how much the piston setting multiplies the gauge, and how much the heater setting multiplies it.',
        'The gauge goes with the kelvin temperature and against the room, so the two factors multiply to the target.'
      ],
      check(state) {
        const t = state.table;
        const start = pressureIdeal(1, toKelvin(INTAKE_TEMPS[0], 'C'), INTAKE_VOLUMES[INTAKE_START - 1]);
        const k = cylRead(t, RIG, 0).P / start;
        if (Math.abs(k - 1) < 1e-6) return { ok: false, notYet: true, msg: 'The dials are where they started.' };
        if (Math.abs(k / INTAKE_FACTOR - 1) < 0.01) return { ok: true };
        return { ok: false, msg: k < INTAKE_FACTOR ? 'With these settings the gauge will read less than six times the figure.' : 'With these settings the gauge will read more than six times the figure.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: BLEND_V, T: T0, of: VALVES, show: { partials: true, share: true }, words: 3 });
    const at = [[86, 31], [110, 31], [86, 52], [110, 52]];
    return {
      id: 'phase2',
      title: 'Phase 2 · The Blend',
      prompt: 'Open tanks into the common tank until nitrogen alone pushes 60 kPa and the gauge reads 100 kPa.',
      widget,
      table: gasTable({
        pieces: BLEND.map(([id, gas, n], i) => tank(id, `TANK ${id.toUpperCase()}`, { x: at[i][0], y: at[i][1] }, { gas, n, V: BLEND_V, T: T0, showAmount: true, noGauge: true, plate: false })),
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] }
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Open Tanks',
        intent: 'The compressor keeps its blending tanks shut.'
      },
      hints: [
        'Drag tanks into or out of the tray under the common tank.',
        'Compare nitrogen\'s own push and the total gauge with the targets after each tank.',
        'Every tank adds its moles to the total, and only a nitrogen tank adds to nitrogen\'s push.'
      ],
      check(state) {
        const t = state.table;
        const rd = commonRead(t, CT);
        if (!rd.tanks.length) return { ok: false, notYet: true, msg: 'Open a tank into the common tank first.' };
        const n2 = partialOf(rd, 'N2');
        const w = BLEND_WANT;
        if (Math.abs(n2 - w.N2) <= w.tol && Math.abs(rd.P - w.total) <= w.tol) return { ok: true };
        if (Math.abs(n2 - w.N2) > w.tol) return { ok: false, msg: n2 < w.N2 ? 'Nitrogen alone pushes less than the target.' : 'Nitrogen alone pushes more than the target.' };
        return { ok: false, msg: rd.P < w.total ? 'The gauge reads less than the target.' : 'The gauge reads more than the target.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const w = WEIGH;
    const plate = plaqueFixture('plate', 'Sealed tank', { x: 34, y: 33 }, [`Gas: helium, ${GASES[w.gas].M.toFixed(1)} g/mol`, `Gauge: ${w.P} atm`, `Room: ${w.V} L`, `Temperature: ${w.TC} °C`], { w: 52 });
    return {
      id: 'phase3',
      title: 'Phase 3 · The Tanks',
      prompt: 'Type the mass of gas in the sealed tank.',
      entry: { id: 'ans', label: 'Mass of gas', unit: 'g' },
      widget,
      table: gasTable({
        fixtures: [plate],
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Weigh Gas',
        intent: 'The compressor shows only the plate of its tank.'
      },
      hints: [
        'Read the figures from the plate, then type the result.',
        'Find the moles first with the temperature in kelvin, then the mass those moles weigh.',
        'Use R = 0.0821 L·atm per mol·K, then multiply the moles by the molar mass.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the figure in g.' };
        const want = weighGrams();
        if (Math.abs(v - want) / want < 0.04) return { ok: true };
        return { ok: false, msg: v > want ? 'The tank holds less gas than that.' : 'The tank holds more gas than that.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 44, y: 32 }, {
      cyls: [cyl('a', 'HOLDER', 'NH3', { V: COLD_V, hold: 'V', vdw: true })], temps: COLD_TEMPS, tempList: 'K', tempStart: 1, vmax: 24.6, w: 62, trueSize: true,
      title: `Holder  ${GASES.NH3.sym}, ${COLD_V} L`, show: { temperature: false, amount: false, volume: false, ideal: true }
    });
    return {
      id: 'phase4',
      title: 'Phase 4 · The Cold Box',
      prompt: 'Set the heater until the gauge matches the gas law figure printed with it.',
      widget,
      table: gasTable({ fixtures: [r] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Warm Holder',
        intent: 'The compressor squeezes a cold holder of ammonia.'
      },
      hints: [
        'Turn the Heater dial.',
        'Compare the gauge with the gas law figure at each setting, and note which side of it the gauge is on.',
        'The gauge sits below the figure at one end of the dial and above it at the other, so look between those settings.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Heater dial.' };
        const q = cylRead(t, RIG, 0);
        const ratio = q.P / q.ideal;
        if (Math.abs(ratio - 1) <= 0.02) return { ok: true };
        return { ok: false, msg: ratio > 1 ? 'The gauge reads above the gas law figure.' : 'The gauge reads below the gas law figure.' };
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
  1: ['Turn the Piston and Heater dials.'],
  2: ['Drag tanks into or out of the tray.'],
  3: ['R = 0.0821 L·atm per mol·K.', 'Type your answer in the field at the bottom.'],
  4: ['Turn the Heater dial.'],
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
  [dial(RIG, 'volume', 1), dial(RIG, 'temp', 4)],
  [put('a', `tray:${VALVES}`), put('b', `tray:${VALVES}`), put('c', `tray:${VALVES}`)],
  [typed('ans', "3.2")],
  [dial(RIG, 'temp', 4)],
  [dial(PIN, 'time', 4), dial(PIN, 'ref', 4)]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [dial(RIG, 'volume', 1), dial(RIG, 'temp', 3)],
  [put('a', `tray:${VALVES}`), put('b', `tray:${VALVES}`), put('d', `tray:${VALVES}`)],
  [typed('ans', "36")],
  [dial(RIG, 'temp', 2)],
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
