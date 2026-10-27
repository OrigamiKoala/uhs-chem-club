/**
 * q1-knocks.js — Bellows, bench one: PRESSURE AND TEMPERATURE.
 *
 * The gauge gallery on a gasholder's flank, on the gas kit (`table/kits/gas.js`). The Fifth jammed gas into the station's holders and the
 * needles will not come down; before anyone can let it out, the crew has to know what a gauge is actually measuring.
 *
 * THE CLICK. Most players arrive believing a gas pushes the way a weight does: down, so a gauge in the floor of a box of air must read
 * more than one in the roof. Stage 1 asks for that guess (a predict stage: the question and four cards, no instrument) and stage 2 puts
 * the same gauge on a box's roof, side wall and floor. The three read alike, and warming the box raises all three together. The wrong
 * model is a card on the bench, the box contradicts it, and only then is the word given: pressure, particles knocking every wall.
 *
 *   1  PREDICT: which of a box's three gauges reads highest        (no instrument)
 *   2  TEST: a gauge on the roof, the side wall and the floor      -> Pressure
 *   3  squeeze the same gas: which readings move with the gauge    -> Boyle's law
 *   4  heat the gas, rank four snapshots of its speeds             -> A Spread of Speeds
 *   5  a light and a heavy gas at one temperature                  -> Kinetic Energy, Kinetic Molecular Theory
 *
 * (Cut as repeats: the three-scale unit conversion, the line carried to absolute zero (now earned on bench two, where the same line is
 * drawn for room against heat), the heat-until-fast target, and the closing statement-marking.)
 *
 * THE EVIDENCE IS ON THE BENCH. In stage 3 only the piston moves, so the particles' speed, number and warmth stay put while the gauge and
 * the knock counter rise and fall together. In stage 4 the 3D crowd is the speed screen: every particle at its own speed, from the same
 * distribution the screen draws. A word is plain until its card has earned it, on the dials too: the gauges print bare figures until
 * stage 2 names the unit.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, box, chip, histCard, boxRead, rigAt, cylRead, whereIs, speedBins, toKelvin
} from '../../table/kits/gas.js';
import { widget, put, dial, sort, cardIn, cardColumn, predictStage, youPredicted, guessOf } from './_shared.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bpressure\b/i, introducedAt: 2 },
  { term: /\b(?:kpa|kilopascals?)\b/i, introducedAt: 2 },
  { term: /\bboyle.?s law\b/i, introducedAt: 3 },
  { term: /\bmaxwell.boltzmann\b/i, introducedAt: 4 },
  { term: /\bkinetic energy\b/i, introducedAt: 5 },
  { term: /\bkinetic molecular theory\b/i, introducedAt: 5 }
];

/** Mole, particle and the other words Tallow earned are plain here. */
export const BUILDS_ON = ['unit01/q6-weigh'];

/** The key the player's guess is kept under (`engine/predict.js`). */
export const QUEST_KEY = 'unit04/q1-knocks';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RIG = 'rig';
const BOX = 'box';
const T0 = 298.15;

/** The guesses of stage 1 and the verdicts of stage 2: one statement per wall, and the one that says they are alike. */
export const GUESSES = [
  ['roof', 'The roof gauge reads most'],
  ['side', 'The side gauge reads most'],
  ['floor', 'The floor gauge reads most'],
  ['same', 'All three read the same']
];

/** The heater of stage 2, in degrees C: the box is warmed and every gauge is read again. */
const BOX_TEMPS = [20, 60, 100, 150, 200];
/** The piston's settings in stage 3, in litres: even halvings, so the barrel is as long as the room in it. */
const SQUEEZE = [24, 12, 8, 6];
/** Stage 4's heater, in degrees C, and the shared scale of its screen and snapshots. */
const SPREAD = [-73, 27, 127, 227, 327, 427, 527];
const REF_SPEEDS = Math.max(...speedBins('N2', toKelvin(SPREAD[0], 'C'), 24, 2400));
/** The readings of stage 3 and of stage 5. */
const READINGS = [['knocks', 'KNOCKS'], ['speed', 'SPEED'], ['amount', 'AMOUNT'], ['temp', 'TEMPERATURE']];

/** Which wall a box reads highest, or 'same' when no wall reads more than the others (the gas knocks every wall alike). */
export function wallMost(q) {
  const ps = q.walls.map(w => w.P);
  const hi = Math.max(...ps);
  const lo = Math.min(...ps);
  if (hi - lo <= hi * 0.005) return 'same';
  return q.walls.find(w => w.P === hi).id;
}

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Gauge Comparison',
    prompt: 'Which of a sealed box\'s three gauges, on its roof, side wall and floor, will read the highest?',
    items: GUESSES,
    hints: [
      'Choose one of the cards.',
      'Consider how gas particles move and collide with each wall.',
      'Select the card that matches your prediction.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Gauges on the roof, side wall, and floor will now test how pressure is distributed.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const b = box(BOX, { x: 34, y: 33 }, {
      gas: 'N2', n: 1, V: 10, T: 300, temps: BOX_TEMPS, tempList: 'C', tempStart: 1, units: 'plain', gaugeMax: 600, label: 'Holder 4, sealed',
      plot: { x: 'TC', y: 'P' }
    });
    return {
      title: 'Pressure on Container Walls',
      // The guess comes back here, locked in: it is the first thing the player reads about the test.
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'which statement do the three gauges back up?', 'Which statement do the three gauges back up?');
      },
      widget,
      table: gasTable({
        pieces: cardColumn(GUESSES, { x: 0 }).map((c, i) => ({ ...c, at: { x: 90 + (i % 2) * 38, y: 44.5 + Math.floor(i / 2) * 13 } })),
        fixtures: [b],
        zones: { slots: [{ id: 'show', label: 'What the gauges show', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }, { recorder: { at: { x: 109, y: 11 }, size: { w: 36, h: 14 }, xLabel: 'Heat', xUnit: '°C', yLabel: 'Gauge', yUnit: '', xDigits: 0 } }),
      hints: [
        'Use the "Heater" dial and "Record", then place a card in the slot.',
        'Compare the three gauges with each other as temperature changes.',
        'Select the card describing how the three readings compare.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const want = wallMost(boxRead(t, BOX));
        if (card.id === want) return { ok: true };
        const names = { roof: 'roof', side: 'side wall', floor: 'floor' };
        return { ok: false, msg: `The ${names[card.id] || 'side wall'} gauge does not read more than the other two.` };
      },
      get reward() {
        return {
          log: 'All three gauges read alike.',
          title: 'Pressure',
          body: 'The gas pushes on every wall alike because its particles fly in all directions and collide with all walls. That push is pressure, measured in kilopascals (kPa).'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Holder 2', gas: 'He', n: 1, hold: 'dial', V: 24, T: 300 }], volumes: SQUEEZE, volumeStart: 1, vmax: 24,
      show: { knocks: true, speed: true }, words: { speed: 'SPEED' }, label: 'Holder'
    });
    return {
      title: 'Volume and Pressure',
      prompt: 'Sort each reading by whether it changes along with the gauge as the piston moves.',
      widget,
      table: gasTable({
        pieces: READINGS.map(([id, label], i) => chip(id, label, { x: 11 + i * 17, y: 52 })),
        fixtures: [r],
        zones: {
          trays: [
            { id: 'moves', label: 'Moves with the gauge', at: { x: 101, y: 17 }, size: { w: 58, h: 21 }, cell: 19 },
            { id: 'stays', label: 'Stays put', at: { x: 101, y: 52 }, size: { w: 58, h: 21 }, cell: 19 }
          ]
        }
      }),
      hints: [
        'Use the "Piston" dial.',
        'Compare each reading across different piston positions.',
        'Sort each reading by whether its value changes with the piston.'
      ],
      check(state) {
        const t = state.table;
        if (!READINGS.every(([id]) => ['moves', 'stays'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Put every reading in a tray.' };
        const a = rigAt(t, RIG, { volume: 1 })[0];
        const z = rigAt(t, RIG, { volume: SQUEEZE.length })[0];
        const changes = { knocks: a.knocks !== z.knocks, speed: a.mean !== z.mean, amount: a.n !== z.n, temp: a.T !== z.T };
        const wrongMoves = READINGS.some(([id]) => whereIs(t, id) === 'moves' && !changes[id]);
        const wrongStays = READINGS.some(([id]) => whereIs(t, id) === 'stays' && changes[id]);
        if (wrongMoves) return { ok: false, msg: 'The "Moves with the gauge" tray holds a reading that is the same at every piston setting.' };
        if (wrongStays) return { ok: false, msg: 'The "Stays put" tray holds a reading that is different at two piston settings.' };
        return { ok: true };
      },
      reward: {
        log: 'Only the knocks follow the gauge.',
        title: 'Boyle\'s Law',
        body: 'Compressing a gas into less volume increases wall collision frequency without changing particle speed or count. Halving volume doubles the collision rate and doubles the pressure (Boyle\'s law).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 31, y: 27 }, {
      cyls: [{ id: 'a', label: 'Holder 3', gas: 'N2', n: 1, hold: 'V', V: 20, T: T0 }], temps: SPREAD, tempList: 'C', tempStart: 2, vmax: 20,
      speedScreen: true, screenRef: REF_SPEEDS, show: { amount: false }, w: 54, label: 'Holder'
    });
    // Four snapshots of nitrogen's speeds, taken at four temperatures the player is never told.
    const snap = (id, label, C) => histCard(id, label, { x: 0, y: 0 }, 'N2', toKelvin(C, 'C'), REF_SPEEDS);
    return {
      title: 'Speed Distribution',
      prompt: 'Put the four speed snapshots in order from the coldest gas to the hottest.',
      widget,
      table: gasTable({
        pieces: [snap('a', 'SNAPSHOT A', 527), snap('b', 'SNAPSHOT B', 27), snap('c', 'SNAPSHOT C', 227), snap('d', 'SNAPSHOT D', -73)],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 103, y: 42 }, size: { w: 88, h: 22 }, first: 'Coldest', last: 'Hottest', items: ['a', 'b', 'c', 'd'], start: ['a', 'b', 'c', 'd'] } }
      }),
      hints: [
        'Use the "Heater" dial, and drag the snapshots along the strip.',
        'Compare the speed screen at each setting with the snapshots.',
        'Match each snapshot to the heater setting whose screen looks like it, then order the settings.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four snapshots on the strip.' };
        const temp = id => t.pieces[id].props.T;
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => temp(x) - temp(y));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two neighbouring snapshots on the strip are the wrong way round.' };
      },
      reward: {
        log: 'Every gas is a spread of speeds.',
        title: 'A Spread of Speeds',
        body: 'Particles in a gas do not move at a single speed; they form a distribution described by the Maxwell–Boltzmann distribution. Heating shifts the peak to higher speeds and broadens the spread.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rg = (id, at, label, gas, n, start) => rig(id, at, {
      cyls: [{ id: 'a', label, gas, n, hold: 'V', V: 20, T: T0 }], temps: [0, 100, 200, 300], tempList: 'C', tempStart: start, vmax: 20, compact: true, w: 34,
      show: { gauge: false, volume: false, speed: true, energy: true }, words: { speed: 'SPEED', energy: 'ENERGY' }
    });
    const chips = [['energy', 'ENERGY'], ['speed', 'SPEED'], ['amount', 'AMOUNT'], ['temp', 'TEMPERATURE']];
    return {
      title: 'Mass and Kinetic Energy',
      prompt: 'Set both cylinders to one temperature, then sort each reading by whether the two gases share it.',
      widget,
      table: gasTable({
        pieces: chips.map(([id, label], i) => chip(id, label, { x: 12 + i * 18, y: 53 })),
        fixtures: [rg('ra', { x: 20, y: 25 }, 'Holder 5', 'He', 1, 1), rg('rb', { x: 58, y: 25 }, 'Holder 6', 'CO2', 2, 3)],
        zones: {
          trays: [
            { id: 'same', label: 'Same in both', at: { x: 94, y: 33 }, size: { w: 34, h: 36 }, cell: 17 },
            { id: 'different', label: 'Different', at: { x: 132, y: 33 }, size: { w: 34, h: 36 }, cell: 17 }
          ]
        }
      }),
      hints: [
        'Use both "Heater" dials.',
        'Compare the values on the two cylinders at the same temperature.',
        'Place readings into "Same in both" only if both cylinders display matching values.'
      ],
      check(state) {
        const t = state.table;
        const a = cylRead(t, 'ra', 0);
        const b = cylRead(t, 'rb', 0);
        if (!chips.every(([id]) => ['same', 'different'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Put every reading in a tray.' };
        if (Math.abs(a.T - b.T) > 0.01) return { ok: false, msg: 'The two cylinders are not at one temperature yet.' };
        const same = { energy: Math.abs(a.energy - b.energy) < 1e-9, speed: Math.abs(a.mean - b.mean) < 1e-6, amount: a.n === b.n, temp: true };
        if (chips.some(([id]) => whereIs(t, id) === 'same' && !same[id])) return { ok: false, msg: 'The "Same in both" tray holds a reading that the two cylinders print differently.' };
        if (chips.some(([id]) => whereIs(t, id) === 'different' && same[id])) return { ok: false, msg: 'The "Different" tray holds a reading that the two cylinders print alike.' };
        return { ok: true };
      },
      reward: {
        log: 'The same energy, a different speed.',
        title: 'Kinetic Energy',
        body: 'At a given temperature, all gases share the same average kinetic energy, so lighter particles move faster. Kinetic molecular theory models gas pressure as continuous collisions of moving particles against container walls.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn the Heater dial and Record,', 'then place a card in the slot.'],
  3: ['Turn the Piston dial,', 'then sort each chip into a tray.'],
  4: ['Turn the Heater dial,', 'then arrange snapshots on the strip.'],
  5: ['Turn both Heater dials,', 'then sort chips into trays.']
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
      body: 'Gas pressure results from particles colliding with container walls, distributed equally across all surfaces. Temperature reflects average kinetic energy, so heating increases collision force and frequency, while compression increases collision frequency.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'According to kinetic molecular theory, what causes the pressure of a gas?',
    options: [
      { id: 'a', label: 'Particles colliding with the walls of the container' },
      { id: 'b', label: 'The weight of the gas pressing down on its container' },
      { id: 'c', label: 'Attractions between the particles' },
      { id: 'd', label: 'The particles being at rest against the walls' }
    ],
    answer: 'a',
    explanation: 'The pressure is the combined force of countless collisions between moving particles and the container walls, divided by the wall area.'
  },
  {
    question: 'Gauges are fitted to the roof, the side wall and the floor of a sealed box of gas. How do the three readings compare?',
    options: [
      { id: 'a', label: 'They are all the same' },
      { id: 'b', label: 'The floor reads the most, because the gas is heavy' },
      { id: 'c', label: 'The roof reads the most, because the gas rises' },
      { id: 'd', label: 'The side wall reads the most, because it is the widest' }
    ],
    answer: 'a',
    explanation: 'The particles fly in every direction and knock every wall alike, so the pressure is the same on all of them.'
  },
  {
    question: 'A piston squeezes a gas into half the room at the same temperature. What happens to the knocks on the walls and to the pressure?',
    options: [
      { id: 'a', label: 'Both double' },
      { id: 'b', label: 'Both halve' },
      { id: 'c', label: 'The knocks double and the pressure stays the same' },
      { id: 'd', label: 'Neither changes' }
    ],
    answer: 'a',
    explanation: 'The same particles in half the room reach the walls twice as often, so the knocks double and so does the pressure.'
  },
  {
    question: 'A sealed, rigid container of gas is heated. What happens to the average kinetic energy of the particles and to the pressure?',
    options: [
      { id: 'a', label: 'Both increase' },
      { id: 'b', label: 'Both decrease' },
      { id: 'c', label: 'The kinetic energy increases and the pressure stays the same' },
      { id: 'd', label: 'The kinetic energy stays the same and the pressure increases' }
    ],
    answer: 'a',
    explanation: 'Temperature measures average kinetic energy, so heating raises it. Faster particles hit the walls harder and more often, so the pressure rises too.'
  },
  {
    question: 'Helium and krypton are at the same temperature. Which statement is true?',
    options: [
      { id: 'a', label: 'They have the same average kinetic energy, and helium atoms move faster' },
      { id: 'b', label: 'They have the same average speed, and krypton atoms carry more energy' },
      { id: 'c', label: 'Krypton atoms have more kinetic energy and move faster' },
      { id: 'd', label: 'Helium atoms have more kinetic energy but move at the same speed' }
    ],
    answer: 'a',
    explanation: 'Average kinetic energy depends only on temperature. With the same energy, the lighter helium atoms must be moving faster than the heavier krypton atoms.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('floor', 'slot:predict')],
  [dial(BOX, 'temp', 3), { run: BOX }, dial(BOX, 'temp', 5), { run: BOX }, put('same', 'slot:show')],
  [dial(RIG, 'volume', 1), dial(RIG, 'volume', 4), ...sort({ knocks: 'moves', speed: 'stays', amount: 'stays', temp: 'stays' })],
  [dial(RIG, 'temp', 1), dial(RIG, 'temp', 7), put('d', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('a', 'rail:3')],
  [dial('ra', 'temp', 3), dial('rb', 'temp', 3), ...sort({ energy: 'same', temp: 'same', speed: 'different', amount: 'different' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(BOX, 'temp', 3), { run: BOX }, put('floor', 'slot:show')],
  sort({ knocks: 'stays', speed: 'moves', amount: 'stays', temp: 'stays' }),
  [put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('d', 'rail:3')],
  [dial('ra', 'temp', 3), dial('rb', 'temp', 3), ...sort({ energy: 'different', temp: 'same', speed: 'same', amount: 'different' })]
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
export { rigAt, cylRead, boxRead };
