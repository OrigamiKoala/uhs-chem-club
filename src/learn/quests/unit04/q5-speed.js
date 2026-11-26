/**
 * q5-speed.js — Bellows, bench five: SPEED AND ESCAPE.
 *
 * The leak-test station at a vent stack, on the gas kit (`table/kits/gas.js`). Bench one found that the particles of a gas move at a
 * spread of speeds, and that a lighter gas is faster at one temperature. This one asks what that does when a gas finds a hole, and
 * when it has to push its way through other gas.
 *
 * THE CLICK. Players expect a heavy gas to be the one that gets away, or all gases to leak alike: a hole is a hole. Stage 1 asks which
 * of a helium chamber and a nitrogen chamber, each with a pinhole, will empty first (a predict stage, no instrument). Stage 2 sets four
 * chambers out, with the particles flying about in the glass, and the player ranks them by how soon each is empty. The lightest goes
 * first, the heaviest last, and the word for it is given only then. Stage 3 uses it to name an unknown leak by matching it against
 * a reference whose gas the player can change; stages 4 and 5 meet the same idea in a new case, two gases racing down a tube.
 *
 *   1  PREDICT: which of two chambers empties first
 *   2  TEST: rank four chambers by how soon each runs out        -> Effusion
 *   3  set a reference chamber to empty at the sample's pace      -> Naming by Leak
 *   4  PREDICT: where two gases let in at the two ends of a tube meet
 *   5  TEST: the race down the tube                              -> Diffusion
 *   6  the molar mass of an unknown gas, from how long it takes to half-empty -> Graham's law (a figure worked out)
 *   7  four speed snapshots at 300 K ordered from lightest to heaviest particles -> Mass and Speed
 *
 * (Cut as repeats or as past the idea: the speed-peak target, the particle-speed calculation at 300 K, the fast tail of a heated gas,
 * and the random walk of a smell. The unmarked sample stands on the bench.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { gasTable, rig, pinhole, tube, chip, stmt, halfTime, tubeRead, pinholeRead, histCard, speedBins, GASES, front } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, answerCards, answerSlot, predictStage, youPredicted, guessOf, typed } from './_shared.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\beffusion\b/i, introducedAt: 2 },
  { term: /\bdiffusion\b/i, introducedAt: 5 },
  { term: /\bgraham.?s law\b/i, introducedAt: 6 }
];

/** Pressure, kelvin, the speed screen and the gas laws are plain words here. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit04/q3-ideal'];

export const KEY_LEAK = 'unit04/q5-speed#leak';
export const KEY_TUBE = 'unit04/q5-speed#tube';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const PIN = 'pin';
const T0 = 300;
/** The seconds a stopwatch can be set to. */
const TIMES = [0, 1, 2, 3, 4, 5, 6];
/** The chambers of stage 2, in the order they stand on the bench (the lightest is not first), and their gases. */
export const CHAMBERS = [['a', 'N2'], ['b', 'H2'], ['c', 'CO2'], ['d', 'He']];
/** The reference chamber's gases and the sample's gas in stage 3. */
export const REFERENCE_GASES = ['Ne', 'Ar', 'Kr', 'Xe'];
export const SAMPLE = 'Kr';
/** Stage 6: the reference gases on its dial and the unknown (not on the dial). */
export const MASS_GASES = ['He', 'Ne', 'Ar', 'Kr'];
export const UNKNOWN = 'CH4';
/** The tube: its length in centimetres and the stopwatch's seconds. */
export const TUBE_CM = 100;
const TUBE_TIMES = [0, 15, 30, 45, 60, 75];

export const LEAK_GUESSES = [['he', 'The helium chamber'], ['n2', 'The nitrogen chamber'], ['same', 'They empty at the same time']];
export const TUBE_GUESSES = [['nh3', 'Near the ammonia end'], ['mid', 'Halfway'], ['hcl', 'Near the hydrogen chloride end']];
export const GRAHAM_CARDS = [
  ['4', '4× as long'],
  ['2', '2× as long'],
  ['0.5', 'Half as long']
];

/** Where the ring has formed, as the card that says so: more than a twentieth of the tube from the middle is "nearer an end". */
export function ringCard(ringFromLeft, length = TUBE_CM) {
  return Math.abs(ringFromLeft - length / 2) < length * 0.05 ? 'mid' : ringFromLeft < length / 2 ? 'nh3' : 'hcl';
}

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
/** Stage 8: four gases at one temperature, shuffled; the snapshots share one height scale so the heavy gas's tall narrow curve is not clipped. */
export const SNAP_T = 300;
export const SNAP_GASES = [['a', 'N2'], ['b', 'Xe'], ['c', 'He'], ['d', 'CO2']];
export const SNAP_REF = Math.max(...SNAP_GASES.map(([, g]) => Math.max(...speedBins(g, SNAP_T, 24, 2400))));

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: KEY_LEAK,
    title: 'Which Gas Leaks First?',
    prompt: 'Between a helium chamber and a nitrogen chamber that each have a tiny pinhole, which one runs out of gas first?',
    items: LEAK_GUESSES,
    hints: [
      'Think about which gas\'s particles move faster at the same temperature: helium (4 g/mol) or nitrogen (28 g/mol).',
      'Faster particles cross the chamber more often, so they reach the tiny hole more frequently.',
      'Ask whether lighter or heavier particles move faster when both gases have the same average kinetic energy.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, you will test four pinhole chambers to see which gas escapes fastest.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const p = pinhole(PIN, { x: 75, y: 24 }, {
      chambers: CHAMBERS.map(([id, gas]) => ({ id, gas, label: `CHAMBER ${id.toUpperCase()}` })), times: TIMES, timeStart: 1, w: 104, record: false
    });
    return {
      title: 'Pinholes and Escape Speed',
      briefing: 'Four chambers hold different gases at 300 K, each with a tiny pinhole opening into a vacuum.',
      get prompt() {
        return youPredicted(KEY_LEAK, LEAK_GUESSES, 'Order the four chambers from the one that empties first (left) to last (right).', 'Order the four chambers from the one that empties first (left) to last (right).');
      },
      widget,
      table: gasTable({
        pieces: CHAMBERS.map(([id, gas]) => chip(id, `CHAMBER ${id.toUpperCase()} (${GASES[gas].sym})`, { x: 0, y: 0 })),
        fixtures: [p],
        zones: { rail: { id: 'rail', at: { x: 75, y: 55 }, size: { w: 94, h: 14 }, first: 'Empties first', last: 'Empties last', items: CHAMBERS.map(([id]) => id), start: CHAMBERS.map(([id]) => id) } }
      }),
      hints: [
        'Turn the Stopwatch dial to watch how much gas remains in each chamber over time.',
        'Compare the percentage remaining in each chamber at 2 s or 4 s.',
        'The chamber with the lowest percentage left is escaping fastest.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four chambers on the strip.' };
        const gasOf = id => CHAMBERS.find(c => c[0] === id)[1];
        const want = CHAMBERS.map(c => c[0]).sort((x, y) => halfTime(gasOf(x), T0) - halfTime(gasOf(y), T0));
        if (order.join() === want.join()) return { ok: true };
        for (let i = 0; i < order.length - 1; i++) {
          if (halfTime(gasOf(order[i]), T0) > halfTime(gasOf(order[i + 1]), T0)) {
            return { ok: false, msg: `${t.pieces[order[i]].label} empties slower than ${t.pieces[order[i + 1]].label}: swap them.` };
          }
        }
        return { ok: false, msg: 'Two adjacent chambers on the strip are in the wrong order.' };
      },
      get reward() {
        return {
          log: 'The lightest gas emptied fastest.',
          title: 'Effusion',
          body: 'Gas escaping through a tiny hole into a vacuum is called effusion. Lighter particles move faster at the same temperature, so they effuse faster.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const p = pinhole(PIN, { x: 75, y: 31 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: SAMPLE, label: 'STACK LEAK', sealed: true }],
      picks: { ref: { gases: REFERENCE_GASES, label: 'Gas', start: 1 } }, times: TIMES, timeStart: 1, showHalf: true, record: false, w: 80
    });
    return {
      title: 'Identifying an Unknown Gas',
      prompt: 'Which reference gas leaks out at the same rate as the stack sample?',
      widget,
      table: gasTable({ fixtures: [p] }),
      hints: [
        'Turn the Gas dial and compare REFERENCE\'s half-empty time with STACK LEAK (6.45 s).',
        'Heavier gases take longer to half-empty, while lighter gases empty faster.',
        'Match the reference gas whose half-empty time equals the stack leak\'s time.'
      ],
      check(state) {
        const t = state.table;
        const r = pinholeRead(t, PIN);
        const ref = r.chambers[0];
        const leak = r.chambers[1];
        if (Math.round(t.fixtures[PIN].dials.ref.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Gas dial to test different gases.' };
        if (ref.gas === leak.gas) return { ok: true };
        return { ok: false, msg: ref.half < leak.half ? `The reference (${ref.half.toFixed(2)} s) empties faster than the stack leak (${leak.half.toFixed(2)} s).` : `The reference (${ref.half.toFixed(2)} s) empties slower than the stack leak (${leak.half.toFixed(2)} s).` };
      },
      reward: {
        log: 'Effusion rate matched to reference gas.',
        title: 'Matching by Leak Rate',
        body: 'The stack leak emptied at the same pace as krypton (6.45 s), showing it has krypton\'s molar mass (84 g/mol).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  predictStage({
    key: KEY_TUBE,
    title: 'Gas Meeting Point',
    prompt: 'When ammonia (NH₃, 17 g/mol) and hydrogen chloride (HCl, 36.5 g/mol) enter opposite ends of a tube, where do they meet?',
    items: TUBE_GUESSES,
    hints: [
      'Compare the molar masses of NH₃ (17 g/mol) and HCl (36.5 g/mol) to see which particles move faster.',
      'Both gases start at the same time, so the faster gas travels farther along the tube.',
      'If one gas travels more than halfway down the tube, think about which end their meeting point is closer to.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, you will watch both gases travel down a tube until they meet.'
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const tb = tube('tube', { x: 42, y: 28 }, { ends: ['NH3', 'HCl'], times: TUBE_TIMES, timeStart: 1, length: TUBE_CM });
    return {
      title: 'Racing Down a Tube',
      get prompt() {
        return youPredicted(KEY_TUBE, TUBE_GUESSES, 'Where does the white ring form when ammonia and hydrogen chloride meet in the tube?', 'Where does the white ring form when ammonia and hydrogen chloride meet in the tube?');
      },
      widget,
      table: gasTable({
        pieces: [stmt('nh3', 'Near the ammonia end', { x: 97, y: 45 }), stmt('mid', 'Halfway', { x: 131, y: 45 }), stmt('hcl', 'Near the hydrogen chloride end', { x: 114, y: 57.5 })],
        fixtures: [tb],
        zones: { slots: [{ id: 'show', label: 'Where the ring formed', at: { x: 114, y: 26 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Turn the Stopwatch dial to 60 s or 75 s to see where the white ring forms.',
        'Compare the ring\'s position with the 50 cm midpoint of the 100 cm tube.',
        'Check which end (NH₃ at 0 cm or HCl at 100 cm) the ring is closer to.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const f = t.fixtures.tube;
        const end = { ...t, fixtures: { ...t.fixtures, tube: { ...f, dials: { ...f.dials, time: { ...f.dials.time, value: f.props.times.length } } } } };
        const ring = Math.round(tubeRead(end, 'tube').ringFromLeft);
        const want = ringCard(ring);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: `The white ring formed at ${ring} cm of ${TUBE_CM} cm (past the 50 cm midpoint), closer to the HCl end.` };
      },
      get reward() {
        return {
          log: 'The reaction ring formed closer to the heavier gas.',
          title: 'Diffusion',
          body: 'One gas spreading through another is diffusion. Lighter ammonia moves faster, so the ring forms closer to the heavier HCl end (at 59 cm).'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const p = pinhole(PIN, { x: 41, y: 31 }, {
      chambers: [{ id: 'a', gas: 'He', label: 'HELIUM (4 g/mol)', sealed: true }, { id: 'b', label: 'COMPARE GAS', pick: 'ref' }],
      picks: { ref: { gases: ['He', 'CH4', 'Ar', 'Kr'], label: 'Gas', start: 1, withMass: true } }, times: TIMES, timeStart: 1, showHalf: true, record: false, w: 70
    });
    return {
      title: 'Mass and Escape Time',
      briefing: 'Compare helium (4 g/mol) with heavier gases on the Gas dial, watching how each gas\'s half-empty time changes.',
      prompt: 'When molar mass is 4 times larger (from 4 g/mol to 16 g/mol), by what factor does the half-empty time multiply?',
      widget,
      table: gasTable({
        pieces: [stmt('4', '4× as long', { x: 99, y: 44 }), stmt('2', '2× as long', { x: 133, y: 44 }), stmt('0.5', 'Half as long', { x: 116, y: 56 })],
        fixtures: [p],
        zones: { slots: [answerSlot('Effect on half-empty time', { x: 116, y: 24 })] }
      }),
      hints: [
        'Turn the Gas dial to Methane, 16 g/mol (4 times helium\'s 4 g/mol).',
        'Compare methane\'s half-empty time (2.82 s) with helium\'s (1.41 s).',
        'Divide methane\'s half-empty time by helium\'s to find the factor.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[PIN].dials.ref.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Gas dial to compare helium (4 g/mol) with methane (16 g/mol).' };
        const card = cardIn(t, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === '2') return { ok: true };
        return { ok: false, msg: 'Compare the half-empty times of 16 g/mol (2.82 s) and 4 g/mol (1.41 s) on the pinhole chambers.' };
      },
      reward: {
        log: 'Four times the molar mass doubled the half-empty time.',
        title: 'Graham\'s Law',
        body: 'Half-empty time scales with the square root of molar mass (Graham\'s law): 4 times the molar mass gives √4 = 2 times the half-empty time.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const p = pinhole(PIN, { x: 75, y: 31 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: UNKNOWN, label: 'UNKNOWN', sealed: true }],
      picks: { ref: { gases: MASS_GASES, label: 'Gas', start: 1, withMass: true } }, times: TIMES, timeStart: 1, showHalf: true, record: false, w: 80
    });
    return {
      title: 'Using Graham\'s Law',
      briefing: 'Use Graham\'s law: half-empty time scales with the square root of molar mass.',
      prompt: 'What is the molar mass of the unknown gas?',
      entry: { id: 'ans', label: 'Molar mass', unit: 'g/mol' },
      widget,
      table: gasTable({
        fixtures: [p],
      }),
      hints: [
        'Compare the unknown\'s half-empty time (2.82 s) with helium\'s (1.41 s, 4 g/mol).',
        'Find the ratio of the unknown\'s half-empty time to helium\'s half-empty time.',
        'By Graham\'s law, square that time ratio to find how many times heavier the unknown is than helium.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the value in g/mol.' };
        const want = GASES[UNKNOWN].M;
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: v > want ? 'The unknown gas has a lower value than that.' : 'The unknown gas has a higher value than that.' };
      },
      reward: {
        log: 'Time grew as the square root of molar mass.',
        title: 'Unknown Molar Mass',
        body: 'By Graham\'s law, twice the half-empty time means 2² = 4 times the molar mass: 4 × 4 = 16 g/mol (methane).',
        model: { type: 'bellows-scene', scene: 'leak-race' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const snap = (id, label, gas) => histCard(id, label, { x: 0, y: 0 }, gas, SNAP_T, SNAP_REF);
    const speedRig = rig('speedRig', { x: 28, y: 29 }, {
      cyls: [{ id: 'a', label: 'Reference', gas: 'He', n: 1, hold: 'V', V: 20, T: SNAP_T }],
      gases: ['He', 'N2', 'CO2', 'Xe'], gasStart: 1, gasWithMass: true,
      vmax: 20, w: 50, speedScreen: true, screenRef: SNAP_REF,
      show: { gauge: false, volume: false, temperature: false, amount: false, kelvin: true },
      title: `Reference at ${SNAP_T} K`
    });
    return {
      title: 'Speed Distribution and Mass',
      prompt: `Order the four speed snapshots from lightest particles (left) to heaviest (right), all at ${SNAP_T} K.`,
      widget,
      table: gasTable({
        pieces: SNAP_GASES.map(([id, gas]) => snap(id, `SNAPSHOT ${id.toUpperCase()}`, gas)),
        fixtures: [speedRig],
        zones: { rail: { id: 'rail', at: { x: 102, y: 36 }, size: { w: 92, h: 24 }, first: 'Lightest', last: 'Heaviest', items: ['a', 'b', 'c', 'd'], start: ['a', 'b', 'c', 'd'] } }
      }),
      hints: [
        'Turn the Gas dial on the reference cylinder from Helium (4 g/mol) to Xenon (131 g/mol) and watch the speed curve.',
        'Lighter particles move faster at 300 K, so their speed curve spreads wider to the right.',
        'Heavier particles move slower, so their curve peaks taller and narrower on the left.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four snapshots on the strip.' };
        const mass = id => GASES[t.pieces[id].props.gas].M;
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => mass(x) - mass(y));
        if (order.join() === want.join()) return { ok: true };
        for (let i = 0; i < order.length - 1; i++) {
          if (mass(order[i]) > mass(order[i + 1])) {
            return { ok: false, msg: `${t.pieces[order[i]].label} and ${t.pieces[order[i + 1]].label} are in the wrong order on the strip.` };
          }
        }
        return { ok: false, msg: 'Two adjacent snapshots on the strip are in the wrong order.' };
      },
      reward: {
        log: 'At one temperature the heavier gas is slower.',
        title: 'Mass and Speed',
        body: 'At one temperature every gas has the same average kinetic energy, so heavier particles move slower. Their curve peaks taller and narrower at low speeds, while a light gas spreads wider toward high speeds.',
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
      body: 'At the same temperature, lighter gas particles move faster than heavier ones. Because they move faster, they effuse through pinholes and diffuse through other gases more quickly (Graham\'s law).'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('he', 'slot:predict')],
  [dial(PIN, 'time', 3), put('b', 'rail:0'), put('d', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')],
  [dial(PIN, 'time', 2), dial(PIN, 'ref', 3)],
  [put('hcl', 'slot:predict')],
  [put('hcl', 'slot:show'), dial('tube', 'time', 6), { run: 'tube' }],
  [dial(PIN, 'ref', 2), put('2', 'slot:answer')],
  [dial(PIN, 'ref', 2), typed('ans', "16")],
  [put('c', 'rail:0'), put('a', 'rail:1'), put('d', 'rail:2'), put('b', 'rail:3')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(PIN, 'time', 3), put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('d', 'rail:3')],
  [dial(PIN, 'ref', 2)],
  [],
  [put('mid', 'slot:show'), dial('tube', 'time', 6), { run: 'tube' }],
  [dial(PIN, 'ref', 2), put('4', 'slot:answer')],
  [dial(PIN, 'ref', 2), typed('ans', "20")],
  [put('b', 'rail:0'), put('d', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')]
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
export { halfTime, tubeRead, pinholeRead, GASES, front };
