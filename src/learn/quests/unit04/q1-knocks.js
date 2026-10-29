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
 *   3  squeeze the gas until the gauge reads six times as much    -> Boyle's law
 *   4  the piston stops at 3 L: what does the gauge read at 1.5 L  -> Using Boyle's law (a figure worked out from the bench)
 *   5  heat the gas, rank four snapshots of its speeds             -> A Spread of Speeds
 *   6  a light and a heavy gas at one temperature                  -> Kinetic Energy, Kinetic Molecular Theory
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
import { widget, put, dial, sort, cardIn, cardColumn, predictStage, youPredicted, guessOf, answerCards, answerSlot, answerOf } from './_shared.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bpressure\b/i, introducedAt: 2 },
  { term: /\b(?:kpa|kilopascals?)\b/i, introducedAt: 2 },
  { term: /\bboyle.?s law\b/i, introducedAt: 3 },
  { term: /\bmaxwell.boltzmann\b/i, introducedAt: 5 },
  { term: /\bkinetic energy\b/i, introducedAt: 6 },
  { term: /\bkinetic molecular theory\b/i, introducedAt: 6 }
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
/** The piston's settings in stages 3 and 4, in litres: 24 and its halving, then the room that gives three, four, six and eight times the gauge. */
const SQUEEZE = [24, 12, 8, 6, 4, 3];
/** Stage 3 asks for this many times the starting gauge. */
const TIMES_AS_MUCH = 6;
/** Stage 4's room beyond the dial (litres), and the figures to lay: the gauge there, the slip of halving once, the squeeze that lowers it, and double the answer. */
const BEYOND = 1.5;
export const BEYOND_CARDS = [['a', '1660 kPa', 1660], ['b', '830 kPa', 830], ['c', '6.5 kPa', 6.5], ['d', '3320 kPa', 3320]];
/** Stage 4's heater, in degrees C, and the shared scale of its screen and snapshots. */
const SPREAD = [-73, 27, 127, 227, 327, 427, 527];
const REF_SPEEDS = Math.max(...speedBins('N2', toKelvin(SPREAD[0], 'C'), 24, 2400));

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
      'Lay one card in the slot.',
      'Picture one particle of the gas flying about inside the box and ask which walls it reaches.',
      'Ask what a gauge fixed to a wall can feel: the weight of the gas above it, or something else.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Locked in. The next bench fits one gauge to each of the box\'s three walls.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const b = box(BOX, { x: 34, y: 33 }, {
      gas: 'N2', n: 1, V: 10, T: 300, temps: BOX_TEMPS, tempList: 'C', tempStart: 1, units: 'plain', gaugeMax: 600, label: 'Holder 4, sealed'
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
      }),
      hints: [
        'Use the "Heater" dial, then place a card in the slot.',
        'Compare the three gauges with each other as temperature changes.',
        'Read the three figures at one setting, then again at a hotter one, and see which of them ever differ.'
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
      prompt: `Set the piston so the gauge reads ${TIMES_AS_MUCH} times its starting figure.`,
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the "Piston" dial and watch the gauge.',
        'Compare the gauge with the room at each setting, and with the knocks.',
        'Find what happens to the gauge each time the room is halved, then work out the room that gives six times.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.volume.value) === 1) return { ok: false, notYet: true, msg: 'The piston is where it started: turn it and watch the gauge.' };
        const ratio = cylRead(t, RIG, 0).P / rigAt(t, RIG, { volume: 1 })[0].P;
        if (Math.abs(ratio - TIMES_AS_MUCH) < 0.02) return { ok: true };
        return { ok: false, msg: ratio < TIMES_AS_MUCH ? `The gauge reads less than ${TIMES_AS_MUCH} times its starting figure.` : `The gauge reads more than ${TIMES_AS_MUCH} times its starting figure.` };
      },
      reward: {
        log: 'Gauge times room stayed the same.',
        title: 'Boyle\'s Law',
        body: 'Squeezing a gas into less room makes the same particles knock more often, and the gauge rises as the room falls: 24 L and 104 give about 2500, and so do 4 L and 623. At one temperature, pressure times volume is constant (Boyle\'s law).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Holder 2', gas: 'He', n: 1, hold: 'dial', V: 24, T: 300 }], volumes: SQUEEZE, volumeStart: 1, vmax: 24,
      show: { speed: false }, label: 'Holder'
    });
    return {
      title: 'Using Boyle\'s Law',
      prompt: `Lay the card for what the gauge would read at ${BEYOND} L, beyond the piston dial's last setting.`,
      widget,
      table: gasTable({
        pieces: answerCards(BEYOND_CARDS),
        fixtures: [r],
        zones: { slots: [answerSlot('Gauge at 1.5 L')] }
      }),
      hints: [
        'Turn the "Piston" dial to read the gauge at each setting.',
        'Multiply the gauge by the room at several settings and compare the products.',
        'Divide that product by the new room.'
      ],
      check(state) {
        const t = state.table;
        const v = answerOf(t, BEYOND_CARDS);
        if (v == null) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const a = rigAt(t, RIG, { volume: 1 })[0];
        const want = (a.P * a.V) / BEYOND;
        if (Math.abs(v - want) / want < 0.02) return { ok: true };
        return { ok: false, msg: v < a.P ? 'That reading is lower than the gauge at 24 L, and squeezing the gas cannot lower it.' : 'That reading does not fit the gauge-times-room figure of the other settings.' };
      },
      reward: {
        log: 'Gauge times room, divided by the new room.',
        title: 'Using Boyle\'s Law',
        body: 'Because pressure times volume stays about 2500, the gauge at 1.5 L is 2500 ÷ 1.5, close to 1660 kPa. Write it P₁V₁ = P₂V₂ and check the result: squeezing a gas can only raise its gauge.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
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

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const HE_C = 100;
    const rg = (id, at, label, gas, n, extra) => rig(id, at, {
      cyls: [{ id: 'a', label, gas, n, hold: 'V', V: 20, T: T0, ...(extra.T ? { T: extra.T } : {}) }], ...(extra.temps ? { temps: extra.temps, tempList: 'C', tempStart: 1 } : {}), vmax: 20, compact: true, w: 34,
      show: { gauge: false, volume: false, speed: true, energy: true }, words: { speed: 'SPEED', energy: 'ENERGY' }
    });
    return {
      title: 'Mass and Kinetic Energy',
      prompt: 'Set Holder 6\'s heater so its particles carry the same energy of motion as Holder 5\'s.',
      widget,
      table: gasTable({
        fixtures: [rg('ra', { x: 20, y: 25 }, 'Holder 5', 'He', 1, { T: toKelvin(HE_C, 'C') }), rg('rb', { x: 58, y: 25 }, 'Holder 6', 'CO2', 2, { temps: [0, 50, 100, 150, 200] })]
      }),
      hints: [
        'Turn Holder 6\'s "Heater" dial and watch its ENERGY reading.',
        'Compare the ENERGY readings of the two cylinders, and then their SPEED readings.',
        'Stop where the two ENERGY readings agree, then look at what else the two cylinders print alike and what they print differently.'
      ],
      check(state) {
        const t = state.table;
        const a = cylRead(t, 'ra', 0);
        const b = cylRead(t, 'rb', 0);
        if (Math.round(t.fixtures.rb.dials.temp.value) === 1 && Math.abs(a.energy - b.energy) > 1e-9) return { ok: false, notYet: true, msg: 'Holder 6\'s heater is where it started: turn it and watch its ENERGY reading.' };
        if (Math.abs(a.energy - b.energy) <= 1e-9) return { ok: true };
        return { ok: false, msg: a.energy > b.energy ? 'Holder 6\'s particles carry less energy than Holder 5\'s.' : 'Holder 6\'s particles carry more energy than Holder 5\'s.' };
      },
      reward: {
        log: 'The same energy, a different speed.',
        title: 'Kinetic Energy',
        body: 'The two gases carry the same average kinetic energy when they share a temperature, though helium\'s particles move about three times faster. Kinetic molecular theory takes temperature as the average kinetic energy of the particles, whatever their mass.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn the Heater dial,', 'then place a card in the slot.'],
  3: ['Turn the Piston dial.'],
  4: ['Turn the Piston dial,', 'then place a card in the slot.'],
  5: ['Turn the Heater dial,', 'then arrange snapshots on the strip.'],
  6: ['Turn Holder 6\'s Heater dial.']
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
  [dial(BOX, 'temp', 3), dial(BOX, 'temp', 5), put('same', 'slot:show')],
  [dial(RIG, 'volume', 1), dial(RIG, 'volume', 5)],
  [dial(RIG, 'volume', 3), dial(RIG, 'volume', 6), put('a', 'slot:answer')],
  [dial(RIG, 'temp', 1), dial(RIG, 'temp', 7), put('d', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('a', 'rail:3')],
  [dial('rb', 'temp', 3)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(BOX, 'temp', 3), put('floor', 'slot:show')],
  [dial(RIG, 'volume', 3)],
  [dial(RIG, 'volume', 6), put('b', 'slot:answer')],
  [put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('d', 'rail:3')],
  [dial('rb', 'temp', 4)]
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
