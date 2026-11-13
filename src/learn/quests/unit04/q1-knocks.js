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
import { applyNotes } from '../../table/notes.js';
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
  { term: /\bmaxwell.boltzmann\b/i, introducedAt: 6 },
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
const T0 = 298.15;

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
const SPREAD = [-73, 27, 127, 227, 327, 427, 527];
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
      prompt: 'A sealed box of gas has a pressure meter on its roof, its side wall and its floor: which reads highest?',
      items: GUESSES,
      hints: [
        'Lay one card in the slot.',
        'Picture one gas particle flying inside the box and ask which walls it can reach.',
        'Ask what a meter fixed to a wall can feel: the weight of the gas above it, or the particles hitting it.'
      ],
      reward: {
        log: 'Prediction recorded.',
        title: 'Prediction Recorded',
        body: 'Your guess is locked in. Next, you will test a sealed box with three pressure meters.'
      }
    }),
    briefing: {
      speaker: 'Vess',
      body: 'A pressure meter measures how hard a gas presses on the wall it is fixed to.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const b = box(BOX, { x: 34, y: 33 }, {
      gas: 'N2', n: 1, V: 10, T: 300, temps: BOX_TEMPS, tempList: 'C', tempStart: 1, units: 'plain', gaugeMax: 600, label: 'Sealed box'
    });
    return {
      title: 'Pressure on Every Wall',
      prompt: 'Which statement do the three pressure meters support?',
      widget,
      table: gasTable({
        pieces: cardColumn(GUESSES, { x: 0 }).map((c, i) => ({ ...c, at: { x: 90 + (i % 2) * 38, y: 44.5 + Math.floor(i / 2) * 13 } })),
        fixtures: [b],
        zones: { slots: [{ id: 'show', label: 'What the meters show', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Turn the Heater dial, then place a card in the slot.',
        'Compare the three meters with each other as the temperature changes.',
        'Watch which walls the particles hit as you warm the box, and check whether any meter reads differently.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const want = wallMost(boxRead(t, BOX));
        if (card.id === want) return { ok: true };
        const names = { roof: 'roof', side: 'side wall', floor: 'floor' };
        return { ok: false, msg: `The ${names[card.id] || 'side wall'} meter does not read higher than the other two.` };
      },
      reward: {
        log: 'All three meters read alike.',
        title: 'Pressure',
        body: 'The particles fly in every direction and collide with every wall alike. Those collisions are the gas\'s pressure, measured in kilopascals, kPa.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const b = box(BOX, { x: 34, y: 31 }, {
      gas: 'N2', n: 1, V: 10, T: 300, temps: ZERO_TEMPS, tempList: 'C', tempStart: 3, units: 'kpa', gaugeMax: 600,
      plot: { x: 'TC', y: 'P' }, label: 'Sealed box'
    });
    return {
      title: 'Where Pressure Runs Out',
      briefing: {
        speaker: 'Vess',
        body: 'Cooling a gas slows its particles, so they collide with the walls less hard and the pressure falls. Record the pressure at several temperatures and follow the line down.'
      },
      prompt: 'At what temperature would the pressure of this gas fall to zero?',
      widget,
      table: gasTable({
        fixtures: [b, markerFixture('zero', 'Pressure reaches zero at', { x: 108, y: 55 }, { min: -400, max: 0, step: 10, start: 0, unit: '°C', w: 50 })],
        tools: ['straightedge']
      }, { recorder: { at: { x: 112, y: 24 }, size: { w: 42, h: 28 }, xLabel: 'Temperature', xUnit: '°C', yLabel: 'Pressure', yUnit: 'kPa', range: { xMin: -300, xMax: 200, yMin: 0, yMax: 400 } } }),
      hints: [
        'Turn the Heater dial and press Record at several temperatures.',
        'Read how the pressure drops in equal steps as temperature falls on the cooled box.',
        'Extend the equal steps down to zero pressure.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'zero');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the temperature you read off the line.' };
        if (Math.abs(v - (-273.15)) <= ZERO_TOL) return { ok: true };
        return { ok: false, msg: t.recorder.tool ? 'The laid line reaches zero pressure at a different temperature from the marker.' : 'There is no line on the strip yet: record some readings and lay the straightedge across them.' };
      },
      reward: {
        log: 'Pressure reaches zero at −273 °C.',
        title: 'Absolute Zero and Kelvin',
        body: 'The line reaches zero at −273 °C, called absolute zero. The kelvin scale counts from there: K = °C + 273, so 27 °C is 300 K.'
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
        'Turn the Piston dial to compare two volumes where one is half the other.',
        'Watch the particles, the COLLISIONS counter and the pressure as you halve the volume.',
        'Ask what happens to how often the same particles hit the walls in half the space.'
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
        body: 'Half the volume gives twice the collisions and twice the pressure, so pressure × volume stays the same at one temperature. This is Boyle\'s law.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'He', n: 1, hold: 'dial', V: 24, T: 300 }], volumes: SQUEEZE, volumeStart: 1, vmax: 24,
      show: { speed: false, kelvin: true }, label: 'Cylinder'
    });
    return {
      title: 'Using Boyle\'s Law',
      briefing: {
        speaker: 'Vess',
        body: 'At one temperature, pressure × volume is the same before and after: P₁V₁ = P₂V₂.',
        worked: ['200 kPa × 6.0 L = 1200', 'new volume 2.0 L', '1200 ÷ 2.0 = 600 kPa']
      },
      prompt: `What would the pressure be at ${BEYOND} L?`,
      entry: { id: 'ans', label: `Pressure at ${BEYOND} L`, unit: 'kPa' },
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the Piston dial and read the pressure and volume at each setting.',
        'Check whether pressure × volume stays the same at every Piston setting.',
        'Use P₁V₁ = P₂V₂ from the worked example to find the pressure at the new volume.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the pressure in kPa.' };
        const a = rigAt(t, RIG, { volume: 1 })[0];
        const want = (a.P * a.V) / BEYOND;
        if (Math.abs(v - want) / want < 0.02) return { ok: true };
        return {
          ok: false,
          msg: v < a.P
            ? 'That pressure is lower than at 24 L, and compressing a gas cannot lower its pressure.'
            : `At ${((a.P * a.V) / v).toFixed(1)} L this gas would read ${v} kPa, not at ${BEYOND} L.`
        };
      },
      reward: {
        log: 'Pressure × volume stays about 2490 kPa·L.',
        title: 'Using Boyle\'s Law',
        body: 'Pressure × volume stays about 2490 kPa·L, so at 1.5 L the pressure is about 1660 kPa.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const r = rig(RIG, { x: 31, y: 27 }, {
      cyls: [{ id: 'a', label: 'Cylinder', gas: 'N2', n: 1, hold: 'V', V: 20, T: T0 }], temps: SPREAD, tempList: 'C', tempStart: 2, vmax: 20,
      speedScreen: true, screenRef: REF_SPEEDS, show: { amount: false, kelvin: true }, w: 54, label: 'Cylinder'
    });
    const snap = (id, label, C) => histCard(id, label, { x: 0, y: 0 }, 'N2', toKelvin(C, 'C'), REF_SPEEDS);
    return {
      title: 'Speeds in a Gas',
      briefing: {
        speaker: 'Vess',
        body: 'The speed screen sorts the particles by how fast they are moving: each bar counts the particles near that speed.'
      },
      prompt: 'Put the four speed snapshots in order from coldest on the left to hottest on the right.',
      widget,
      table: gasTable({
        pieces: [snap('a', 'SNAPSHOT A', 527), snap('b', 'SNAPSHOT B', 27), snap('c', 'SNAPSHOT C', 227), snap('d', 'SNAPSHOT D', -73)],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 103, y: 42 }, size: { w: 88, h: 22 }, first: 'Coldest', last: 'Hottest', items: ['a', 'b', 'c', 'd'], start: ['a', 'b', 'c', 'd'] } }
      }),
      hints: [
        'Turn the Heater dial and drag the snapshots onto the strip, coldest on the left.',
        'Compare the speed screen at each heater setting with the four snapshots.',
        'Notice how heating shifts the speed spread higher, and order the snapshots by their spread.'
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
        log: 'Every gas has a spread of speeds.',
        title: 'Speeds in a Gas',
        body: 'The particles do not all move at one speed. Heating shifts the spread to higher speeds and widens it; this spread is the Maxwell–Boltzmann distribution.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const rg = (id, at, label, gas, n, extra) => rig(id, at, {
      cyls: [{ id: 'a', label, gas, n, hold: 'V', V: 20, T: T0, ...(extra.T ? { T: extra.T } : {}) }],
      ...(extra.temps ? { temps: extra.temps, tempList: 'K', tempStart: 1 } : {}), vmax: 20, compact: true, w: 34,
      show: { gauge: false, volume: false, temperature: true, kelvin: true, speed: true, energy: true },
      words: { speed: 'SPEED', energy: 'KINETIC ENERGY' },
      ...(extra.hide ? { hideUntilCommit: extra.hide } : {})
    });
    return {
      title: 'Mass and Kinetic Energy',
      briefing: {
        speaker: 'Vess',
        body: 'Kinetic energy is energy of motion. A particle has more of it if it is heavier or moving faster.'
      },
      prompt: 'At what temperature do carbon dioxide (CO₂) particles have the same average kinetic energy as helium (He) particles at 300 K?',
      widget,
      table: gasTable({
        fixtures: [
          rg('ra', { x: 20, y: 25 }, 'Cylinder A', 'He', 1, { T: 300 }),
          rg('rb', { x: 58, y: 25 }, 'Cylinder B', 'CO2', 2, { temps: [200, 250, 300, 350, 400], hide: ['energy'] })
        ]
      }),
      hints: [
        'Turn Cylinder B\'s Heater dial and watch its KINETIC ENERGY and SPEED readings.',
        'Compare the KINETIC ENERGY and SPEED readings of both cylinders.',
        'Compare the temperatures of the two cylinders when their KINETIC ENERGY readings match.'
      ],
      check(state) {
        const t = state.table;
        const a = cylRead(t, 'ra', 0);
        const b = cylRead(t, 'rb', 0);
        if (Math.round(t.fixtures.rb.dials.temp.value) === 1 && Math.abs(a.energy - b.energy) > 1e-9) {
          return { ok: false, notYet: true, msg: 'Cylinder B\'s heater is where it started: turn it and watch its KINETIC ENERGY reading.' };
        }
        if (Math.abs(a.energy - b.energy) <= 1e-9) return { ok: true };
        return {
          ok: false,
          msg: a.energy > b.energy
            ? 'Cylinder B\'s particles have less kinetic energy than Cylinder A\'s.'
            : 'Cylinder B\'s particles have more kinetic energy than Cylinder A\'s.'
        };
      },
      reward: {
        log: 'The same kinetic energy at the same temperature.',
        title: 'Temperature and Kinetic Energy',
        body: 'The energies match at 300 K, the same temperature, though helium moves about three times as fast. Temperature measures the average kinetic energy of the particles, whatever their mass.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn the Heater dial,', 'then place a card in the slot.'],
  3: ['Record each setting, lay the straightedge,', 'then set the marker.'],
  4: ['Turn the Piston dial,', 'then place a card in the slot.'],
  5: ['Turn the Piston dial,', 'then type your answer in the field at the bottom.'],
  6: ['Turn the Heater dial,', 'then arrange snapshots on the strip.'],
  7: ['Turn Cylinder B\'s Heater dial.']
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
      body: 'Gas pressure comes from particles colliding with the walls, equally in every direction. Cooling slows the particles toward absolute zero at −273 °C, where the kelvin scale begins; compressing a gas doubles collisions when volume halves; and temperature measures average kinetic energy.'
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
  [dial(RIG, 'volume', 1), dial(RIG, 'volume', 2), put('twice', 'slot:answer')],
  [dial(RIG, 'volume', 3), dial(RIG, 'volume', 6), typed('ans', '1660')],
  [dial(RIG, 'temp', 1), dial(RIG, 'temp', 7), put('d', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('a', 'rail:3')],
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
