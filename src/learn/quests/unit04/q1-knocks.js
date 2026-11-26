/**
 * q1-knocks.js — Bellows, bench one: WHAT PRESSURE IS.
 *
 * 1  PREDICT: which of a box's three gauges reads highest        (no instrument)
 * 2  TEST: a gauge on the roof, the side wall and the floor      -> Pressure (kPa), collisions
 * 3  cool the box and follow the pressure line to zero           -> Absolute zero (−273 °C), kelvin (K)
 * 4  halve the volume and see collisions double                  -> Boyle's law
 * 5  what would the pressure be at 1.5 L (worked case first)     -> Using Boyle's law (P₁V₁ = P₂V₂)
 * 6  heat the gas, rank four snapshots of its speeds             -> Maxwell–Boltzmann distribution
 * 7  a light and a heavy gas at one temperature                  -> Kinetic energy, temperature
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import {
  gasTable, rig, box, histCard, markerFixture, boxRead, rigAt, cylRead, markerRead, whereIs, speedBins, toKelvin
} from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, cardColumn, answerCards, answerSlot, predictStage, typed } from './_shared.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bpressure\b/i, introducedAt: 1 },
  { term: /\b(?:kpa|kilopascals?)\b/i, introducedAt: 2 },
  { term: /\bcollisions?\b/i, introducedAt: 2 },
  { term: /\babsolute zero\b/i, introducedAt: 3 },
  { term: /\bkelvin\b/i, introducedAt: 3 },
  { term: /\bboyle.?s law\b/i, introducedAt: 4 },
  { term: /\bkinetic energy\b/i, introducedAt: 7 }
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
const T0 = 300;

/** The guesses of stage 1 and the verdicts of stage 2: one statement per wall, and the one that says they are alike. */
export const GUESSES = [
  ['roof', 'The roof meter reads highest'],
  ['side', 'The side wall meter reads highest'],
  ['floor', 'The floor meter reads highest'],
  ['same', 'All three read the same']
];

/** The heater of stage 2, in degrees C: the box is warmed and every gauge is read again. */
const BOX_TEMPS = [20, 60, 100, 150, 200];
/** Stage 3's heater, in degrees C, used to plot pressure against °C down to zero. */
const ZERO_TEMPS = [-73, -23, 27, 77, 127];
const ZERO_TOL = 10;
/** The piston's settings in stages 4 and 5, in litres: 24 and its halvings, plus 8 and 4. */
const SQUEEZE = [24, 12, 8, 6, 4, 3];
/** Stage 4's cards for what happens to collisions when volume is halved. */
export const COLLISION_CARDS = [
  ['half', 'Half as many'],
  ['same', 'The same'],
  ['twice', 'Twice as many'],
  ['four', 'Four times as many']
];
/** Stage 5's volume beyond the dial (litres). */
const BEYOND = 1.5;
/** Stage 6's heater, in degrees C, and the shared scale of its screen and snapshots. */
const SPREAD = [-73, 27, 227, 527];
const REF_SPEEDS = Math.max(...speedBins('N2', toKelvin(SPREAD[0], 'C'), 24, 2400));

/** Which wall a box reads highest, or 'same' when no wall reads more than the others. */
export function wallMost(q) {
  const ps = q.walls.map(w => w.P);
  const hi = Math.max(...ps);
  const lo = Math.min(...ps);
  if (hi - lo <= hi * 0.005) return 'same';
  return q.walls.find(w => w.P === hi).id;
}

/* ------------------------------------------------------------------
   THE SEVEN STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    ...predictStage({
      key: QUEST_KEY,
      title: 'Three Pressure Meters',
      prompt: 'In a sealed box of gas with pressure meters on its roof, side wall, and floor, which meter reads highest?',
      items: GUESSES,
      hints: [
        'Think about how gas particles move inside a sealed box: do they settle on the floor or bounce everywhere?',
        'Picture a single gas particle bouncing around inside the box and think about which walls it hits.',
        'A pressure meter responds to particles hitting its wall, not to gas piling up at the bottom.'
      ],
      reward: {
        log: 'Prediction recorded.',
        title: 'Prediction Recorded',
        body: 'Your guess is locked in. Next, you will test a sealed box with three pressure meters.'
      }
    }),
    briefing: {
      speaker: 'Vess',
      body: 'A pressure meter measures how hard gas particles press against a wall when they hit it.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const b = box(BOX, { x: 35, y: 33 }, {
      gas: 'N2', n: 1, V: 10, T: 300, temps: BOX_TEMPS, tempList: 'C', tempStart: 1, units: 'kpa', gaugeMax: 600, w: 62, side: 19, label: 'Sealed box'
    });
    return {
      title: 'Pressure on Every Wall',
      prompt: 'Which statement matches the three pressure meters as you heat the box?',
      widget,
      table: gasTable({
        pieces: cardColumn(GUESSES, { x: 0 }).map((c, i) => ({ ...c, at: { x: 92 + (i % 2) * 38, y: 44.5 + Math.floor(i / 2) * 13 } })),
        fixtures: [b],
        zones: { slots: [{ id: 'show', label: 'What the meters show', at: { x: 111, y: 27 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Watch all three wall readings (ROOF, SIDE WALL, FLOOR) as you heat the box.',
        'Compare the three meters with each other at two different temperatures.',
        'Notice whether any wall gets a higher reading than the others as the gas warms.'
      ],
      check(state) {
        const t = state.table;
        const seen = t.fixtures[BOX].props.seen?.temp || [1];
        if (seen.length < 2) return { ok: false, notYet: true, msg: 'Turn the Heater dial to a warmer setting first so you can compare all three meters.' };
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const q = boxRead(t, BOX);
        const want = wallMost(q);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: `Look at all three readings (ROOF, SIDE WALL, FLOOR) at ${Math.round(q.tC)} °C and compare them.` };
      },
      reward: {
        log: 'All three meters read the same.',
        title: 'Pressure',
        body: 'Gas particles fly in every direction and collide equally with every wall. Those collisions create pressure, measured in kilopascals (kPa).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const b = box(BOX, { x: 38, y: 29 }, {
      gas: 'N2', n: 1, V: 10, T: 300, temps: ZERO_TEMPS, tempList: 'C', tempStart: 3, units: 'kpa', gaugeMax: 600,
      plot: { x: 'TC', y: 'P' }, label: 'Sealed box'
    });
    return {
      title: 'Where Pressure Runs Out',
      briefing: {
        speaker: 'Vess',
        body: 'Cooling slows gas particles down, so their wall collisions weaken and the pressure drops.'
      },
      prompt: 'At what temperature would this gas\'s pressure reach zero if you kept cooling it?',
      widget,
      table: gasTable({
        fixtures: [b, markerFixture('zero', 'Pressure reaches zero at', { x: 112, y: 49 }, { min: -400, max: 0, step: 10, start: 0, unit: '°C', w: 52 })],
        tools: ['straightedge']
      }, { recorder: { at: { x: 112, y: 21 }, size: { w: 52, h: 30 }, xLabel: 'Temperature', xUnit: '°C', yLabel: 'Pressure', yUnit: 'kPa', range: { xMin: -300, xMax: 200, yMin: 0, yMax: 400 } } }),
      hints: [
        'Record the pressure at several temperatures on the Heater dial to plot points on the graph.',
        'Notice that the plotted points form a straight line sloping down toward 0 kPa.',
        'Press Straightedge to extend the line to 0 kPa, then set the marker to that temperature.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'zero');
        if (v === 0) return { ok: false, notYet: true, msg: 'At 0 °C the pressure is still 222 kPa. Move the marker to where the line crosses 0 kPa.' };
        if (Math.abs(v - (-273.15)) <= ZERO_TOL) return { ok: true };
        return { ok: false, msg: t.recorder.tool ? `At ${v} °C the line is not at 0 kPa; check where the extended line crosses zero on the graph.` : 'Record at least two temperatures and press Straightedge to extend the line to 0 kPa.' };
      },
      reward: {
        log: 'Pressure reaches zero at −273 °C.',
        title: 'Absolute Zero and Kelvin',
        body: 'The line hits zero at −273 °C, called absolute zero. The kelvin scale starts there (K = °C + 273), so 27 °C is 300 K.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'He', n: 1, hold: 'dial', V: 24, T: 300 }], volumes: SQUEEZE, volumeStart: 1, vmax: 24,
      show: { knocks: true, speed: true, kelvin: true }, words: { speed: 'SPEED', knocks: 'COLLISIONS' }, label: 'Cylinder'
    });
    return {
      title: 'Volume and Pressure',
      prompt: 'When the volume is halved, what happens to the collisions with the walls each second?',
      widget,
      table: gasTable({
        pieces: answerCards(COLLISION_CARDS),
        fixtures: [r],
        zones: { slots: [answerSlot('Collisions')] }
      }),
      hints: [
        'Use the Piston dial to compare two volumes where one is half the other, such as 24 L and 12 L.',
        'Compare the COLLISIONS counter and the pressure at both volumes.',
        'Think about how often the same particles hit the walls when they only have half the space to cross.'
      ],
      check(state) {
        const t = state.table;
        const seen = t.fixtures[RIG].props.seen?.volume || [1];
        const vols = seen.map(i => SQUEEZE[i - 1]);
        const hasHalf = vols.some(a => vols.some(b => Math.abs(a - 2 * b) < 0.01));
        if (!hasHalf) return { ok: false, notYet: true, msg: 'Turn the Piston dial to compare a volume with half that volume first.' };
        const card = cardIn(t, 'answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === 'twice') return { ok: true };
        return { ok: false, msg: 'Compare the COLLISIONS counter at 24 L and 12 L on the cylinder.' };
      },
      reward: {
        log: 'Half the volume gives twice the collisions and twice the pressure.',
        title: 'Boyle\'s Law',
        body: 'Halving the volume doubles the wall collisions each second and doubles the pressure. This relationship is Boyle\'s law.',
        model: { type: 'bellows-scene', scene: 'boyle' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = rig(RIG, { x: 75, y: 31 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'He', n: 1, hold: 'dial', V: 24, T: 300 }], volumes: SQUEEZE, volumeStart: 1, vmax: 24, w: 76,
      show: { speed: false, kelvin: true }, label: 'Cylinder'
    });
    return {
      title: 'Using Boyle\'s Law',
      briefing: {
        speaker: 'Vess',
        body: 'When a quantity doubles, it is multiplied by a factor of 2; when it halves, it is multiplied by 0.5. At a fixed temperature, pressure × volume stays constant (P₁V₁ = P₂V₂).'
      },
      prompt: `If this gas starts at 24 L and is compressed to ${BEYOND} L, by what factor is its pressure multiplied?`,
      entry: { id: 'ans', label: 'Pressure factor', unit: '×' },
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Compare the volume change from 24 L to 1.5 L.',
        'Use the Piston dial to see how halving the volume affects pressure.',
        'Since pressure is inversely proportional to volume, divide 24 L by 1.5 L.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the factor by which pressure is multiplied.' };
        const want = 24 / BEYOND;
        if (Math.abs(v - want) / want < 0.02) return { ok: true };
        return {
          ok: false,
          msg: v <= 1
            ? 'Compressing a gas to a smaller volume raises its pressure, so the factor must be greater than 1.'
            : `Multiplying by ${v} matches compressing to ${(24 / v).toFixed(1)} L, not ${BEYOND} L.`
        };
      },
      reward: {
        log: 'Compressing from 24 L to 1.5 L multiplies pressure by 16.',
        title: 'Using Boyle\'s Law',
        body: 'Because 1.5 L is one-sixteenth of 24 L, the pressure is multiplied by a factor of 16.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const r = rig(RIG, { x: 29, y: 29 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'N2', n: 1, hold: 'V', V: 20, T: T0 }], temps: SPREAD, tempList: 'C', tempStart: 2, vmax: 20,
      speedScreen: true, screenRef: REF_SPEEDS, show: { amount: false, kelvin: true }, w: 52, label: 'Cylinder'
    });
    const snap = (id, label, C) => histCard(id, label, { x: 0, y: 0 }, 'N2', toKelvin(C, 'C'), REF_SPEEDS);
    return {
      title: 'Speeds in a Gas',
      briefing: {
        speaker: 'Vess',
        body: 'The bar graph next to the cylinder shows particle speeds from 0 m/s (left) to 2400 m/s (right), where taller bars mean more particles at that speed. Each snapshot card shows that graph at one temperature.'
      },
      prompt: 'Order the four speed snapshots from coldest (left) to hottest (right).',
      widget,
      table: gasTable({
        pieces: [snap('a', 'SNAPSHOT A', 527), snap('b', 'SNAPSHOT B', 27), snap('c', 'SNAPSHOT C', 227), snap('d', 'SNAPSHOT D', -73)],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 103, y: 42 }, size: { w: 92, h: 22 }, first: 'Coldest', last: 'Hottest', items: ['a', 'b', 'c', 'd'], start: ['a', 'b', 'c', 'd'] } }
      }),
      hints: [
        'Turn the Heater dial and compare the cylinder\'s speed screen with the four snapshots.',
        'Match each heater temperature (−73, 27, 227, and 527 °C) to the snapshot with the same bar shape.',
        'Heating shifts the peak to higher speeds and spreads the curve wider, so colder snapshots stay narrower on the left.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four snapshots on the strip.' };
        const temp = id => t.pieces[id].props.T;
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => temp(x) - temp(y));
        if (order.join() === want.join()) return { ok: true };
        for (let i = 0; i < order.length - 1; i++) {
          if (temp(order[i]) > temp(order[i + 1])) {
            return { ok: false, msg: `${t.pieces[order[i]].label} is hotter than ${t.pieces[order[i + 1]].label}: swap them so colder is on the left.` };
          }
        }
        return { ok: false, msg: 'Two adjacent snapshots on the strip are in the wrong order.' };
      },
      reward: {
        log: 'Every gas has a range of speeds.',
        title: 'Speeds in a Gas',
        body: 'Gas particles move at a range of speeds. Heating shifts the whole curve to higher speeds and spreads it wider.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const rg = (id, at, label, gas, n, extra) => rig(id, at, {
      cyls: [{ id: 'a', label, gas, n, hold: 'V', V: 20, T: T0, ...(extra.T ? { T: extra.T } : {}) }],
      ...(extra.temps ? { temps: extra.temps, tempList: 'K', tempStart: 1 } : {}), vmax: 20, compact: true, w: 40,
      show: { gauge: false, volume: false, temperature: true, kelvin: true, speed: true, energy: true },
      words: { speed: 'SPEED', energy: 'KINETIC ENERGY' }
    });
    return {
      title: 'Mass and Kinetic Energy',
      briefing: {
        speaker: 'Vess',
        body: 'Kinetic energy is energy of motion (measured in zeptojoules, zJ). A particle has more kinetic energy if it is heavier or moving faster.'
      },
      prompt: 'At what temperature do carbon dioxide (CO₂) particles have the same average kinetic energy as helium (He) particles at 300 K?',
      widget,
      table: gasTable({
        fixtures: [
          rg('ra', { x: 45, y: 28 }, 'Cylinder A', 'He', 1, { T: 300 }),
          rg('rb', { x: 105, y: 28 }, 'Cylinder B', 'CO2', 2, { temps: [200, 250, 300, 350, 400] })
        ]
      }),
      hints: [
        'Turn Cylinder B\'s Heater dial and watch its KINETIC ENERGY reading change.',
        'Compare the KINETIC ENERGY and SPEED readings of both cylinders as Cylinder B warms up.',
        'Look at both temperatures when the two KINETIC ENERGY readings match.'
      ],
      check(state) {
        const t = state.table;
        const a = cylRead(t, 'ra', 0);
        const b = cylRead(t, 'rb', 0);
        if (Math.round(t.fixtures.rb.dials.temp.value) === 1 && Math.abs(a.energy - b.energy) > 1e-9) {
          return { ok: false, notYet: true, msg: 'Turn Cylinder B\'s Heater dial first and watch its KINETIC ENERGY reading.' };
        }
        if (Math.abs(a.energy - b.energy) <= 1e-9) return { ok: true };
        return {
          ok: false,
          msg: a.energy > b.energy
            ? `At ${Math.round(b.T)} K, Cylinder B's kinetic energy (${b.energy.toFixed(2)} zJ) is lower than Cylinder A's (${a.energy.toFixed(2)} zJ).`
            : `At ${Math.round(b.T)} K, Cylinder B's kinetic energy (${b.energy.toFixed(2)} zJ) is higher than Cylinder A's (${a.energy.toFixed(2)} zJ).`
        };
      },
      reward: {
        log: 'Same kinetic energy at the same temperature.',
        title: 'Temperature and Kinetic Energy',
        body: 'Both gases have the same average kinetic energy at 300 K, even though lighter helium moves three times faster. Temperature measures average kinetic energy, no matter the particle mass.',
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
      body: 'Gas pressure comes from particles colliding equally with every wall. Compressing a gas increases collisions, cooling slows particles toward absolute zero (−273 °C, or 0 K), and temperature measures average kinetic energy.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('floor', 'slot:predict')],
  [dial(BOX, 'temp', 3), dial(BOX, 'temp', 5), put('same', 'slot:show')],
  [dial(BOX, 'temp', 1), { run: BOX }, dial(BOX, 'temp', 3), { run: BOX }, dial(BOX, 'temp', 5), { run: BOX }, { lay: { kind: 'straightedge', through: [0, 2] } }, dial('zero', 'value', -270)],
  [dial(RIG, 'volume', 2), put('twice', 'slot:answer')],
  [dial(RIG, 'volume', 3), dial(RIG, 'volume', 6), typed('ans', '16')],
  [dial(RIG, 'temp', 1), dial(RIG, 'temp', 4), put('d', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('a', 'rail:3')],
  [dial('rb', 'temp', 3)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(BOX, 'temp', 3), put('floor', 'slot:show')],
  [dial(BOX, 'temp', 1), { run: BOX }, dial(BOX, 'temp', 5), { run: BOX }, { lay: { kind: 'straightedge', through: [0, 1] } }, dial('zero', 'value', -100)],
  [dial(RIG, 'volume', 2), put('four', 'slot:answer')],
  [dial(RIG, 'volume', 6), typed('ans', '830')],
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
