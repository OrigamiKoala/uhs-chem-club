/**
 * q1-knocks.js — Bellows, bench one: PRESSURE AND TEMPERATURE.
 *
 * The gauge gallery on a gasholder's flank, and the first of Bellows' TABLETOPS (plan `bench-tabletop.md`, phase T5), on the gas kit
 * (`table/kits/gas.js`). A cylinder with a piston you set by hand, a gauge, a thermometer, a counter that ticks for every knock on the
 * far wall and a window onto the particles themselves. Nothing here is told: the player moves the piston and watches a needle and a
 * counter move together, and what the needle has been measuring all along is the knocking.
 *
 *   1  what moves with the gauge as the piston moves       -> pressure
 *   2  what adding gas does to it                          -> (pressure follows the amount)
 *   3  what heating does to the particles                  -> kinetic energy
 *   4  how the speeds of the particles compare             -> Maxwell–Boltzmann distribution
 *   5  a light gas and a heavy one at one temperature      -> (equal energy, unequal speed)
 *   6  one push, three scales                              -> atm, kPa, mmHg
 *   7  where the pressure would reach zero                 -> absolute zero, kelvin
 *   8  which statements the bench has shown                -> kinetic molecular theory
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 1 moves only the piston, so the particles' speed, number and warmth do not change while the gauge
 * and the knock counter rise and fall together: the only thing left to be measured is the knocking. Stage 6 puts a reference gauge
 * with all three rings beside a cylinder that carries one, so the conversion is read off a gauge, never given. Stage 7's strip is
 * ruled well past the coldest point the heater reaches, so a line laid across the readings can be carried on to where it meets zero.
 *
 * FIELD. The gauge gallery's pedestal gauge on the holder's own pipe (`bellows/stations.js` `buildGaugeGallery`) is the field point
 * `gauge`: a card with the holder's three-ring reading, carried back to the bench (stage 6). It is evidence, never a lock; at T1 to
 * T3 the same fetch is a drawn site plate.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, chip, stmt, markCard, numCard, rings, markerFixture, rigAt, cylRead, whereIs, speedBins, toKelvin, histCard, kPaToAtm, ATM_KPA, markerRead
} from '../../table/kits/gas.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bpressure\b/i, introducedAt: 1 },
  { term: /\bkinetic energy\b/i, introducedAt: 3 },
  { term: /\bmaxwell.boltzmann\b/i, introducedAt: 4 },
  { term: /\b(?:atm|atmospheres?|kpa|kilopascals?|mmhg)\b/i, introducedAt: 6 },
  { term: /\babsolute zero\b/i, introducedAt: 7 },
  { term: /\bkelvin\b/i, introducedAt: 7 },
  { term: /\bkinetic molecular theory\b/i, introducedAt: 8 }
];

/** Mole, particle and the other words Tallow earned are plain here. */
export const BUILDS_ON = ['unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const T0 = 298.15;
const RIG = 'rig';

/** The piston's detents, in litres: even steps, so the barrel is as long as the room in it. */
const VOL = [8, 12, 16, 20, 24, 28, 32];
const AMOUNTS = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const WARM = [0, 25, 100, 200, 400];
const SPREAD = [-73, 27, 127, 227, 327, 427, 527];
const COLD = [-100, -50, 0, 50, 100, 200];

export const SPEED_MARK = 1500;
export const ZERO_TOL = 10;
const REF_SPEEDS = Math.max(...speedBins('N2', toKelvin(SPREAD[0], 'C'), 24, 2400));

const ONE = (gas, extra = {}) => [{ id: 'a', label: 'Cylinder A', gas, n: 1, hold: 'dial', V: 20, T: T0, ...extra }];

/** The four chips of stage 1 and the two trays they go in. */
const READINGS = [['knocks', 'KNOCKS'], ['speed', 'SPEED'], ['amount', 'AMOUNT'], ['temp', 'TEMPERATURE']];

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */
const STAGE_REWARDS = [
  {
      reward: {
        log: 'The gauge follows the knocks.',
        title: 'Pressure',
        body: 'The gauge reads pressure: the combined push of all the particles knocking on the wall. Squeeze the same particles into less room and they knock more often, so the pressure climbs.'
      }
  },
  {
      reward: {
        log: 'Twice the gas, twice the pressure.',
        title: 'Pressure Follows the Amount',
        body: 'Twice the particles in the same room knock twice as often, so the pressure doubles. At a fixed volume and temperature the pressure is proportional to the amount of gas.'
      }
  },
  {
      reward: {
        log: 'Hotter particles move faster.',
        title: 'Kinetic Energy',
        body: 'Heated particles move faster, and the energy of that motion is their kinetic energy. Temperature measures the average kinetic energy of the particles.'
      }
  },
  {
      reward: {
        log: 'A spread of speeds with one peak.',
        title: 'Maxwell–Boltzmann Distribution',
        body: 'The speeds follow a Maxwell–Boltzmann distribution: a spread of speeds with a peak. Heating moves the peak to higher speeds and flattens the spread.'
      }
  },
  {
      reward: {
        log: 'The same energy, a different speed.',
        title: 'Same Temperature, Same Energy',
        body: 'At one temperature every gas has the same average kinetic energy, so the lighter particles must move faster. The temperature fixes the energy, never the speed.'
      }
  },
  {
      reward: {
        log: 'One push, three scales.',
        title: 'Atmospheres, Kilopascals, mmHg',
        body: 'The three rings are three units for the same pressure: one atmosphere (atm) is 101.3 kilopascals (kPa) is 760 millimetres of mercury (mmHg). Any reading in one unit can be turned into either of the others.'
      }
  },
  {
      reward: {
        log: 'Zero pressure at the coldest possible point.',
        title: 'Absolute Zero',
        body: 'Carried back, the line reaches zero pressure at −273 °C. Nothing can be colder, because the particles would have no motion left to lose. That point is absolute zero, and the kelvin scale starts counting from it.'
      }
  },
  {
      reward: {
        log: 'The whole picture, in one theory.',
        title: 'Kinetic Molecular Theory',
        body: 'Everything the bench has shown fits one picture, the kinetic molecular theory. A gas is a crowd of tiny particles in constant random motion, far apart, and its pressure is their knocking on the walls.',
        last: true
      }
  }
];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const r = rig(RIG, { x: 36, y: 23 }, { cyls: ONE('He'), volumes: VOL, volumeStart: 4, vmax: 32, show: { knocks: true, speed: true }, words: { speed: 'SPEED' } });
    return {
      title: 'Rising and Falling',
      briefing: {
        speaker: SPEAKER,
        body: 'This bench holds helium in a cylinder with a piston, a gauge for the pressure — how hard the gas pushes — and a counter for the knocks on the wall. Press Submit when the table shows your answer.'
      },
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
        'Turn the Piston dial through its whole range and watch every reading on the cylinder.',
        'Compare which readings rise and fall alongside the gauge and which stay where they were.',
        'Put each reading in the tray for what you saw it do while the piston moved.'
      ],
      check(state) {
        const t = state.table;
        const ids = READINGS.map(x => x[0]);
        if (!ids.every(id => whereIs(t, id) === 'moves' || whereIs(t, id) === 'stays')) return { ok: false, notYet: true, msg: 'Put every reading in a tray.' };
        const a = rigAt(t, RIG, { volume: 1 })[0];
        const b = rigAt(t, RIG, { volume: VOL.length })[0];
        const changes = { knocks: a.knocks !== b.knocks, speed: a.mean !== b.mean, amount: a.n !== b.n, temp: a.T !== b.T };
        for (const [id, label] of READINGS) {
          const want = changes[id] ? 'moves' : 'stays';
          if (whereIs(t, id) !== want) return { ok: false, msg: `Move the piston again and watch the ${label.toLowerCase()} beside the gauge: does it change along with it?` };
        }
        return { ok: true };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', hold: 'V', V: 20, T: T0 }], amounts: AMOUNTS, amountStart: 1, vmax: 20,
      show: { knocks: true }, plot: { x: 'n', y: 'P' }
    });
    return {
      title: 'Twice the Gas',
      briefing: { speaker: SPEAKER, body: 'The Gas in dial now adds gas to the cylinder, and Record drops its readings on the paper strip.' },
      prompt: 'Add gas until the gauge reads three times its first reading.',
      widget,
      table: gasTable({ fixtures: [r] }, { recorder: { at: { x: 112, y: 24 }, size: { w: 40, h: 26 }, xLabel: 'Amount', xUnit: 'mol', yLabel: 'Gauge', yUnit: 'kPa', xDigits: 1 } }),
      hints: [
        'Press Record at the starting amount, then add gas a step at a time and press Record again.',
        'Compare each new gauge reading with the first one on the paper strip.',
        'Divide a reading by the first to see by what factor the gauge has moved, and stop when that factor is the one asked for.'
      ],
      check(state) {
        const t = state.table;
        const first = rigAt(t, RIG, { amount: 1 })[0].P;
        const now = cylRead(t, RIG, 0);
        if (Math.round(t.fixtures[RIG].dials.amount.value) === 1) return { ok: false, notYet: true, msg: 'The cylinder holds its starting amount: add gas and watch the gauge.' };
        const ratio = now.P / first;
        if (Math.abs(ratio - 3) < 0.015) return { ok: true };
        return { ok: false, msg: ratio < 3 ? 'The gauge has not yet reached three times its first reading: divide the reading by the first one.' : 'The gauge has gone past three times its first reading: divide the reading by the first one.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'He', hold: 'V', V: 20, T: T0 }], temps: WARM, tempList: 'C', tempStart: 2, vmax: 20,
      show: { speed: true, energy: true }, cols: 1
    });
    return {
      title: 'Warming Up',
      briefing: { speaker: SPEAKER, body: 'The Heater dial now warms the gas, and the cylinder prints the average speed of its particles.' },
      prompt: 'Heat the gas until its particles average more than 1500 m/s.',
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the Heater dial up one setting at a time and watch the speed reading.',
        'Compare the average speed at each setting with the mark the prompt names.',
        'Stop on a setting whose average speed is past the mark.'
      ],
      check(state) {
        const t = state.table;
        const q = cylRead(t, RIG, 0);
        if (Math.round(t.fixtures[RIG].dials.temp.value) === 2) return { ok: false, notYet: true, msg: 'The heater is where it started: turn it and watch the speed.' };
        if (q.mean > SPEED_MARK) return { ok: true };
        return { ok: false, msg: 'The average speed is not yet past the mark: compare the reading with the mark at each setting.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 36, y: 24 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', hold: 'V', V: 20, T: T0 }], temps: SPREAD, tempList: 'C', tempStart: 2, vmax: 20,
      speedScreen: true, screenRef: REF_SPEEDS, show: { amount: false }
    });
    // Three snapshots of nitrogen's speeds, taken at three temperatures the player is never told: A is the hottest, B the coldest.
    const snap = (id, label, C) => histCard(id, label, { x: 0, y: 0 }, 'N2', toKelvin(C, 'C'), REF_SPEEDS);
    return {
      title: 'A Crowd, Not a Line',
      prompt: 'Put the three speed snapshots in order from the coldest gas to the hottest.',
      widget,
      table: gasTable({
        pieces: [snap('a', 'SNAPSHOT A', 527), snap('b', 'SNAPSHOT B', 27), snap('c', 'SNAPSHOT C', 227)],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 109, y: 40 }, size: { w: 80, h: 22 }, first: 'Coldest', last: 'Hottest', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } }
      }),
      hints: [
        'Turn the Heater dial from its coldest setting to its hottest and watch the speed screen change shape.',
        'Compare where the tallest bar stands and how tall it is in each snapshot with how the screen looked at each setting.',
        'Put the snapshot whose bars lie furthest left and stand tallest at the cold end of the rail, and the flattest, furthest right at the hot end.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three snapshots on the rail.' };
        const temp = id => t.pieces[id].props.T;
        const want = ['a', 'b', 'c'].sort((x, y) => temp(x) - temp(y));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Turn the Heater dial and compare each snapshot with the screen: where does the tallest bar stand as the gas warms, and how tall is it?' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rg = (id, at, gas, n, start) => rig(id, at, {
      cyls: [{ id: 'a', label: gas === 'He' ? 'Cylinder A' : 'Cylinder B', gas, n, hold: 'V', V: 20, T: T0 }], temps: [0, 100, 200, 300], tempList: 'C', tempStart: start, vmax: 20, compact: true, w: 34,
      show: { gauge: false, volume: false, speed: true, energy: true }, words: { speed: 'SPEED', energy: 'ENERGY' }
    });
    return {
      title: 'Light and Heavy',
      prompt: 'Set both cylinders to one temperature, then sort each reading by whether the two gases share it.',
      widget,
      table: gasTable({
        pieces: [['energy', 'ENERGY'], ['speed', 'SPEED'], ['amount', 'AMOUNT'], ['temp', 'TEMPERATURE']].map(([id, label], i) => chip(id, label, { x: 12 + i * 18, y: 53 })),
        fixtures: [rg('ra', { x: 20, y: 25 }, 'He', 1, 1), rg('rb', { x: 58, y: 25 }, 'CO2', 2, 3)],
        zones: {
          trays: [
            { id: 'same', label: 'Same in both', at: { x: 94, y: 33 }, size: { w: 34, h: 36 }, cell: 17 },
            { id: 'different', label: 'Different', at: { x: 132, y: 33 }, size: { w: 34, h: 36 }, cell: 17 }
          ]
        }
      }),
      hints: [
        'Turn both Heater dials until the two thermometers read alike.',
        'Compare the readings printed on the two cylinders at that one temperature.',
        'Put a reading in "Same in both" only if the two cylinders print the same figure for it.'
      ],
      check(state) {
        const t = state.table;
        const a = cylRead(t, 'ra', 0);
        const b = cylRead(t, 'rb', 0);
        const ids = ['energy', 'speed', 'amount', 'temp'];
        if (!ids.every(id => whereIs(t, id) === 'same' || whereIs(t, id) === 'different')) return { ok: false, notYet: true, msg: 'Put every reading in a tray.' };
        if (Math.abs(a.T - b.T) > 0.01) return { ok: false, msg: 'The two cylinders are not at one temperature yet: turn the Heater dials until the thermometers read alike.' };
        const same = { energy: Math.abs(a.energy - b.energy) < 1e-9, speed: Math.abs(a.mean - b.mean) < 1e-6, amount: a.n === b.n, temp: true };
        for (const id of ids) {
          if (whereIs(t, id) !== (same[id] ? 'same' : 'different')) return { ok: false, msg: `Compare the ${id === 'temp' ? 'temperature' : id} printed on the two cylinders: do the figures match?` };
        }
        return { ok: true };
      },
      ...STAGE_REWARDS[4]
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const a = rig('ra', { x: 36, y: 20 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', n: 1.4625, hold: 'V', V: 24, T: 300 }], vmax: 24, units: 'atm', show: { amount: false }, w: 62
    });
    const ref = rings('ref', { x: 100, y: 19 }, { atms: [0.5, 1, 1.5, 2, 2.5, 3], start: 2 });
    const cards = [['n114', '114', 114], ['n152', '152', 152], ['n1140', '1140', 1140], ['n15', '15.2', 15.2]];
    return {
      title: 'Three Scales',
      prompt: 'Put the reading of Cylinder A\'s gauge, in kilopascals, in the slot.',
      widget,
      table: gasTable({
        pieces: [
          ...cards.map(([id, label, v], i) => numCard(id, label, { x: 14 + i * 20, y: 52 }, v)),
          { ...stmt('holder', 'Holder gauge: 1 atm = 101 kPa = 760 mmHg', { x: 126, y: 42 }), hidden: true, fetchFrom: 'gauge' }
        ],
        fixtures: [a, ref],
        zones: { slots: [{ id: 'answer', label: 'A, in kPa', at: { x: 98, y: 50 }, size: { w: 20, h: 11 } }] },
        fetch: [{ id: 'gauge', label: 'Holder Gauge', at: { x: 132, y: 55 } }]
      }),
      hints: [
        'Turn the Set to dial on the reference gauge and read all three of its rings at once; the holder\'s own gauge shows the same three.',
        'Turn the dial until the atmosphere ring matches Cylinder A\'s gauge, then read the kilopascal ring.',
        'Put the card that matches the kilopascal ring in the slot.'
      ],
      check(state) {
        const t = state.table;
        const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        const want = Math.round(kPaToAtm(cylRead(t, 'ra', 0).P) * ATM_KPA);
        if (card.props.value === want) return { ok: true };
        return { ok: false, msg: 'Turn the reference gauge until its atmosphere ring matches Cylinder A\'s gauge, then read the kilopascal ring beside it.' };
      },
      ...STAGE_REWARDS[5]
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'He', hold: 'V', V: 20, T: T0 }], temps: COLD, tempList: 'C', tempStart: 3, vmax: 20, plot: { x: 'TC', y: 'P' }
    });
    return {
      title: 'Where It Stops',
      briefing: { speaker: SPEAKER, body: 'The paper strip is ruled well past the coldest setting, and the straightedge in the dock lays a line across the readings.' },
      prompt: 'Set the marker to the temperature at which the gas pressure would reach zero.',
      widget,
      table: gasTable({
        fixtures: [r, markerFixture('zero', 'Pressure reaches zero at', { x: 108, y: 54 }, { min: -400, max: 0, step: 10, start: 0, unit: '°C', w: 50 })],
        tools: ['straightedge']
      }, { recorder: { at: { x: 112, y: 22 }, size: { w: 42, h: 28 }, xLabel: 'Temperature', xUnit: '°C', yLabel: 'Pressure', yUnit: 'kPa', range: { xMin: -300, xMax: 250, yMin: 0, yMax: 250 } } }),
      hints: [
        'Step the Heater dial through every setting and press Record at each one.',
        'Lay the straightedge across the points and follow the line down toward the bottom of the paper strip.',
        'Read the temperature at which the line reaches the bottom edge of the strip, and set the marker to it.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'zero');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the temperature you read off the line.' };
        if (Math.abs(v - (-273.15)) <= ZERO_TOL) return { ok: true };
        return { ok: false, msg: t.recorder.tool ? 'Follow the laid line down to the bottom edge of the strip and read the temperature beneath that point.' : 'Record some readings and lay the straightedge across them, then follow the line to the bottom edge of the strip.' };
      },
      ...STAGE_REWARDS[6]
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const r = rig(RIG, { x: 36, y: 31 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', hold: 'dial', V: 20, T: T0 }], volumes: VOL, volumeStart: 4, temps: [-100, 0, 25, 200, 500], tempList: 'C', tempStart: 3, vmax: 32,
      speedScreen: true, screenRef: REF_SPEEDS, show: { speed: true, energy: true }, words: { energy: 'ENERGY OF MOTION' }
    });
    const statements = [
      ['moving', 'Gas particles are always moving'],
      ['knock', 'Knocks on the walls make pressure'],
      ['apart', 'Gas particles are far apart'],
      ['stop', 'Cooling a gas to 0 °C stops its particles'],
      ['slower', 'Hotter gas particles move more slowly'],
      ['equal', 'Every particle moves at the same speed']
    ];
    return {
      title: 'What the Bench Showed',
      prompt: 'Mark every statement the bench has shown to be true of a gas.',
      widget,
      table: gasTable({
        pieces: statements.map(([id, label], i) => markCard(id, label, { x: 93 + (i % 2) * 37, y: 12 + Math.floor(i / 2) * 19 })),
        fixtures: [r]
      }),
      hints: [
        'Move the piston and the heater and test each statement against what the cylinder does.',
        'Compare each statement with the knock window, the speed screen and the thermometer in turn.',
        'Mark only the statements that nothing on the cylinder contradicts.'
      ],
      check(state) {
        const t = state.table;
        const marked = statements.map(s => s[0]).filter(id => t.pieces[id].props.flipped);
        if (!marked.length) return { ok: false, notYet: true, msg: 'Tap the statements that are true to mark them.' };
        const want = TRUE_STATEMENTS;
        if (marked.slice().sort().join() === want.slice().sort().join()) return { ok: true };
        if (marked.some(id => !want.includes(id))) return { ok: false, msg: 'One of the marked statements is contradicted by something the bench has shown: test each against the speed screen and the thermometer.' };
        return { ok: false, msg: 'A statement the bench has shown to be true is still unmarked: look back at the window and the knock counter.' };
      },
      ...STAGE_REWARDS[7]
    };
  })()
];

export const TRUE_STATEMENTS = ['moving', 'knock', 'apart'];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Piston dial and watch the readings;', 'drag each chip into a tray.'],
  2: ['Turn the Gas in dial, then press Record.'],
  3: ['Turn the Heater dial to warm the gas.'],
  4: ['Turn the Heater dial and watch the speed screen;', 'drag each snapshot into its place on the rail.'],
  5: ['Turn each Heater dial, then drag the chips', 'into the trays.'],
  6: ['Turn the Set to dial; drag the card into the slot.'],
  7: ['Record each setting, lay the straightedge,', 'then set the marker.'],
  8: ['Tap a statement to mark it.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A gauge counts knocks. More gas, less room or more heat all make the knocks harder or more frequent, and the temperature is the average energy of the crowd that does the knocking. The coldest a gas can get is where that motion ends.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every gas law you will meet is one of these relationships written down with numbers. You have now seen where each one comes from.'
    },
    {
      heading: 'Next',
      body: 'The next bench changes one thing at a time and reads off exactly how the others answer.'
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
      { id: 'b', label: 'The weight of the gas pressing on its container' },
      { id: 'c', label: 'Attractions between the particles' },
      { id: 'd', label: 'The particles being at rest against the walls' }
    ],
    answer: 'a',
    explanation: 'The pressure is the combined force of countless collisions between moving particles and the container walls, divided by the wall area.'
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
  },
  {
    question: 'What is 1.50 atm in kilopascals?',
    options: [
      { id: 'a', label: '152 kPa' },
      { id: 'b', label: '114 kPa' },
      { id: 'c', label: '15.2 kPa' },
      { id: 'd', label: '1140 kPa' }
    ],
    answer: 'a',
    explanation: 'One atmosphere is 101.3 kPa, so 1.50 atm is 1.50 × 101.3 = 152 kPa.'
  },
  {
    question: 'On a graph of the pressure of a fixed amount of gas in a rigid container against temperature in °C, at what temperature does the straight line reach zero pressure?',
    options: [
      { id: 'a', label: '−273 °C' },
      { id: 'b', label: '0 °C' },
      { id: 'c', label: '−100 °C' },
      { id: 'd', label: '+273 °C' }
    ],
    answer: 'a',
    explanation: 'The line, carried back, meets zero pressure at −273 °C, which is absolute zero, or 0 K.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = (spec) => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));
const mark = ids => ids.map(id => ({ flip: id }));

export const SOLUTIONS = [
  [dial(RIG, 'volume', 1), dial(RIG, 'volume', 7), ...sort({ knocks: 'moves', speed: 'stays', amount: 'stays', temp: 'stays' })],
  [{ run: RIG }, dial(RIG, 'amount', 3), { run: RIG }, dial(RIG, 'amount', 5), { run: RIG }],
  [dial(RIG, 'temp', 4)],
  [dial(RIG, 'temp', 1), dial(RIG, 'temp', 7), put('b', 'rail:0'), put('c', 'rail:1'), put('a', 'rail:2')],
  [dial('ra', 'temp', 3), dial('rb', 'temp', 3), ...sort({ energy: 'same', temp: 'same', speed: 'different', amount: 'different' })],
  [{ fetch: 'gauge' }, dial('ref', 'pressure', 3), put('n152', 'slot:answer')],
  [dial(RIG, 'temp', 1), { run: RIG }, dial(RIG, 'temp', 2), { run: RIG }, dial(RIG, 'temp', 3), { run: RIG }, dial(RIG, 'temp', 6), { run: RIG },
    { lay: { kind: 'straightedge', through: [0, 3] } }, dial('zero', 'value', -270)],
  [dial(RIG, 'volume', 2), dial(RIG, 'temp', 5), ...mark(TRUE_STATEMENTS)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  sort({ knocks: 'stays', speed: 'moves', amount: 'stays', temp: 'stays' }),
  [dial(RIG, 'amount', 3), { run: RIG }],
  [dial(RIG, 'temp', 3)],
  [put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2')],
  [dial('ra', 'temp', 3), dial('rb', 'temp', 3), ...sort({ energy: 'different', temp: 'same', speed: 'same', amount: 'different' })],
  [put('n114', 'slot:answer')],
  [dial(RIG, 'temp', 1), { run: RIG }, dial(RIG, 'temp', 6), { run: RIG }, { lay: { kind: 'straightedge', through: [0, 1] } }, dial('zero', 'value', -100)],
  [...mark(['moving', 'knock', 'stop'])]
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
export { rigAt, cylRead };
