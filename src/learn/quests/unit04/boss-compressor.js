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
import { widget, put, dial, cardIn, answerCards, typed } from './_shared.js';
import { session } from '../../../session.js';
import { markFights } from '../../table/near.js';

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
/** Phase 2: four tanks of 100 L at 300 K. Nitrogen must contribute 75 kPa of a 125 kPa total pressure, which three of them do together. */
export const BLEND = [['a', 'N2', 1.8], ['b', 'N2', 1.2], ['c', 'He', 2.0], ['d', 'Ar', 1.0]];
export const BLEND_V = 100;
export const BLEND_WANT = { N2: 75, total: 125, tol: 1 };
/** Phase 3: the mass of gas in a tank from its plate (atmospheres, litres, degrees C). */
export const WEIGH = { gas: 'He', P: 2.0, V: 10, TC: 27 };
export const R_ATM = 0.0821;
export const WEIGH_CARDS = [['a', '3.2 g', 3.2], ['b', '36 g', 36], ['c', '0.81 g', 0.81], ['d', '6.5 g', 6.5]];
/** Phase 4: ammonia in a small volume, and the heater's settings (kelvin): the pressure reads on the gas law at one of them. */
export const COLD_V = 0.5;
export const COLD_TEMPS = [300, 600, 900, 1200, 2000];
export const COLD_CARDS = [
  ['attractions', 'Attractions between particles lower pressure'],
  ['volume', 'Particle volume raises pressure'],
  ['none', 'Neither effect changes pressure']
];
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
      body: 'Volume and kelvin factors multiply: a quarter of the volume gives 4× pressure, and 450 K over 300 K gives 1.5×, totaling 6×.'
    }
  },
  {
    reward: {
      log: 'Blend pressures set.',
      title: 'Partial Pressures',
      body: 'Each gas adds pressure according to its moles. Nitrogen\'s 3.0 mol out of 5.0 mol gives a mole fraction of 0.60, or 75 kPa of the 125 kPa total.'
    }
  },
  {
    reward: {
      log: 'Tank weighed.',
      title: 'Mass From the Gas Law',
      body: 'Using 300 K (not 27 °C), n = (2.0 × 10) ÷ (0.0821 × 300) = 0.81 mol. Multiplying by 4.0 g/mol gives about 3.2 g.'
    }
  },
  {
    reward: {
      log: 'Cylinder read on the law.',
      title: 'Real Gas Behavior',
      body: 'Cold ammonia reads below the ideal gas law because attractions lower pressure, while hot ammonia reads above it from particle volume. Stronger attractions shift the crossover to ~1200 K.'
    }
  },
  {
    reward: {
      log: 'Seal leak identified.',
      title: 'Effusion Match',
      body: 'Gases that effuse at the same rate have the same molar mass. The 8.07 s leak rate matches xenon.',
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
        body: 'Use the gas laws to balance the Compressor\'s five stages. Here the pressure meter is hidden, so use the volume and kelvin factors to set the dials.'
      },
      prompt: `Which Piston and Heater settings make the pressure six times the starting ${began} kPa?`,
      widget,
      table: gasTable({ fixtures: [r, plaqueFixture('began', 'The pressure began at', { x: 106, y: 36 }, [`${began} kPa`], { w: 44 })] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Set Intake',
        intent: 'The compressor cycles at a steady stroke over its intake.'
      },
      hints: [
        'The cylinder starts at 20 L and 27 °C (300 K).',
        'Find how much shrinking the volume multiplies pressure, and how much raising kelvin temperature multiplies it.',
        'When volume shrinks and kelvin temperature rises, their two pressure factors multiply to 6.'
      ],
      check(state) {
        const t = state.table;
        const start = pressureIdeal(1, toKelvin(INTAKE_TEMPS[0], 'C'), INTAKE_VOLUMES[INTAKE_START - 1]);
        const k = cylRead(t, RIG, 0).P / start;
        if (Math.abs(k - 1) < 1e-6) return { ok: false, notYet: true, msg: 'The dials are where they started.' };
        if (Math.abs(k / INTAKE_FACTOR - 1) < 0.01) return { ok: true };
        return { ok: false, msg: k < INTAKE_FACTOR ? `With these settings the pressure is ${k.toFixed(1)} times the starting ${began} kPa, less than six times.` : `With these settings the pressure is ${k.toFixed(1)} times the starting ${began} kPa, more than six times.` };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ct = commonTank(CT, { x: 37, y: 31 }, { V: BLEND_V, T: T0, of: VALVES, show: { partials: true, share: true }, words: 3, w: 68 });
    const at = [[88, 32], [118, 32], [88, 52], [118, 52]];
    return {
      id: 'phase2',
      title: 'Phase 2 · The Blend',
      prompt: 'Open tanks into the common tank until nitrogen\'s partial pressure is 75 kPa and total pressure is 125 kPa.',
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
        'Drag tanks into the drop tray below the common tank to add them, or drag them back out.',
        'Watch both nitrogen\'s partial pressure and the total pressure after each tank.',
        'Every tank raises the total pressure, while only nitrogen tanks raise nitrogen\'s partial pressure.'
      ],
      check(state) {
        const t = state.table;
        const rd = commonRead(t, CT);
        if (!rd.tanks.length) return { ok: false, notYet: true, msg: 'Open a tank into the common tank first.' };
        const n2 = partialOf(rd, 'N2');
        const w = BLEND_WANT;
        if (Math.abs(n2 - w.N2) <= w.tol && Math.abs(rd.P - w.total) <= w.tol) return { ok: true };
        if (Math.abs(n2 - w.N2) > w.tol) return { ok: false, msg: n2 < w.N2 ? 'Nitrogen\'s partial pressure is below the target.' : 'Nitrogen\'s partial pressure is above the target.' };
        return { ok: false, msg: rd.P < w.total ? 'The total pressure is below the target.' : 'The total pressure is above the target.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const w = WEIGH;
    const nW = (w.P * 101.325 * w.V) / (8.314462618 * (w.TC + 273.15));
    const tankRig = rig('tank', { x: 52, y: 31 }, {
      cyls: [{ id: 'a', label: 'Sealed tank', gas: w.gas, n: nW, hold: 'V', V: w.V, T: w.TC + 273.15, sealed: true }],
      vmax: 20, w: 68, units: 'atm',
      title: `Sealed tank · helium (${GASES[w.gas].M.toFixed(1)} g/mol)`,
      show: { amount: false, temperature: true, gauge: true, volume: true }
    });
    return {
      id: 'phase3',
      title: 'Phase 3 · The Tanks',
      prompt: 'What is the mass of helium gas in the sealed tank?',
      entry: { id: 'ans', label: 'Mass of gas', unit: 'g' },
      widget,
      table: gasTable({
        fixtures: [tankRig],
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Weigh Gas',
        intent: 'The compressor seals the tank and locks its dial.'
      },
      hints: [
        'Read the pressure (2.00 atm), volume (10 L), and temperature (27 °C = 300 K) on the tank.',
        'Use n = PV ÷ (RT) with R = 0.0821 L·atm/(mol·K) to find the moles of helium.',
        'Multiply the moles by helium\'s molar mass (4.0 g/mol) to get grams.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the value in g.' };
        const want = weighGrams();
        if (Math.abs(v - want) / want < 0.04) return { ok: true };
        const moles = (WEIGH.P * WEIGH.V) / (R_ATM * (WEIGH.TC + 273.15));
        if (Math.abs(v - moles) / moles < 0.1) {
          return { ok: false, msg: `${v} is the value in mol, not g.` };
        }
        return { ok: false, msg: v > want ? 'The tank holds less gas than that.' : 'The tank holds more gas than that.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 36, y: 32 }, {
      cyls: [cyl('a', 'CYLINDER', 'NH3', { V: COLD_V, hold: 'V', vdw: true })], temps: COLD_TEMPS, tempList: 'K', tempStart: 1, vmax: 24.6, w: 62, trueSize: true, attractions: true,
      title: `Cylinder  ${GASES.NH3.sym}, ${COLD_V} L`, show: { temperature: false, amount: false, volume: false, ideal: true }
    });
    return {
      id: 'phase4',
      title: 'Phase 4 · The Cold Box',
      prompt: 'Why does cold NH₃ at 300 K read lower pressure than the ideal gas law predicts?',
      widget,
      table: gasTable({
        pieces: answerCards(COLD_CARDS, { x: 84, y: 44 }),
        fixtures: [r],
        zones: { slots: [{ id: 'answer', label: 'Why cold NH₃ reads low', at: { x: 96, y: 24 }, size: { w: 38, h: 12 } }] }
      }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Warm Cylinder',
        intent: 'The compressor compresses a cold cylinder of ammonia.'
      },
      hints: [
        'Compare the measured pressure and ideal gas law at 300 K, then warm the gas with the Heater dial.',
        'Watch how measured pressure shifts from below the ideal gas law at 300 K to above it at 2000 K.',
        'Think about how attractions between slow particles affect their collisions with the walls.'
      ],
      check(state) {
        const t = state.table;
        const seen = t.fixtures[RIG].props.seen?.temp || [1];
        if (seen.length < 2) return { ok: false, notYet: true, msg: 'Turn the Heater dial to compare 300 K with a warmer setting.' };
        const card = cardIn(t, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === 'attractions') return { ok: true };
        return { ok: false, msg: 'Particle volume raises pressure; cold attractions between particles lower it.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const p = pinhole(PIN, { x: 56, y: 31 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: SEAL, label: 'SEAL B', sealed: true }],
      picks: { ref: { gases: SEAL_GASES, label: 'Gas', start: 1 } }, times: [0, 1, 2, 3, 4, 5, 6, 7, 8], timeStart: 1, showHalf: true, record: false, w: 80
    });
    return {
      id: 'phase5',
      title: 'Phase 5 · The Seals',
      prompt: 'Which reference gas matches SEAL B\'s leak rate (8.07 s)?',
      widget,
      table: gasTable({ fixtures: [p] }),
      foes: COMPRESSOR_FOE,
      encounter: {
        species: 'the compressor',
        act: 'Name Gas',
        intent: 'A pinhole hisses in the compressor\'s flank, and nothing says what is leaving it.'
      },
      hints: [
        'Turn the Gas dial and compare REFERENCE\'s half-empty time with SEAL B (8.07 s).',
        'Heavier gases effuse more slowly and take longer to half-empty.',
        'Two gases with the same half-empty time have the same molar mass.'
      ],
      check(state) {
        const t = state.table;
        const r = pinholeRead(t, PIN);
        const ref = r.chambers[0];
        const seal = r.chambers[1];
        if (Math.round(t.fixtures[PIN].dials.ref.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Gas dial to test different gases.' };
        if (ref.gas === seal.gas) return { ok: true };
        return { ok: false, msg: ref.half < seal.half ? `The reference (${ref.half.toFixed(2)} s) empties faster than SEAL B (${seal.half.toFixed(2)} s).` : `The reference (${ref.half.toFixed(2)} s) empties slower than SEAL B (${seal.half.toFixed(2)} s).` };
      },
      ...STAGE_REWARDS[4]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Piston and Heater dials.'],
  2: ['Drag tanks into the drop tray below the common tank.'],
  3: ['R = 0.0821 L·atm per mol·K.', 'Type your answer in the field at the bottom.'],
  4: ['Turn the Heater dial,', 'then place a card in the slot.'],
  5: ['Turn the Gas dial to match SEAL B.']
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
      body: 'The compressor sits cold in its housing. Inside its vault is a sealed cylinder whose pressure stayed steady for twelve days while the outside air dropped fifty degrees, breaking Gay-Lussac\'s law for an unheated gas.'
    },
    {
      heading: 'Next',
      body: 'You log the cylinder in the Case File. Something inside it produced heat for twelve days straight.'
    }
  ]
};

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
  [dial(RIG, 'temp', 4), put('attractions', 'slot:answer')],
  [dial(PIN, 'time', 4), dial(PIN, 'ref', 4)]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [dial(RIG, 'volume', 1), dial(RIG, 'temp', 3)],
  [put('a', `tray:${VALVES}`), put('b', `tray:${VALVES}`), put('d', `tray:${VALVES}`)],
  [typed('ans', "36")],
  [dial(RIG, 'temp', 2), put('volume', 'slot:answer')],
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

markFights(STAGES);
