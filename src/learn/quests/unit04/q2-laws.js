/**
 * q2-laws.js — Bellows, bench two: THE GAS LAWS.
 *
 * The Compressor's piston deck, and the second of Bellows' TABLETOPS (plan `bench-tabletop.md`, phase T5), on the gas kit
 * (`table/kits/gas.js`). Bench one found out what a gauge measures. This one changes ONE thing on the rig at a time and reads how the
 * others answer, which is the whole of how the gas laws were found: squeeze it, warm it in a sealed tank, warm it under a free piston,
 * add to it. Each law arrives on the card after the player has watched it happen, and the last stage puts all of them in one sum.
 *
 *   1  a quarter of the room, the same temperature         -> Boyle's law
 *   2  what the knock counter does when the room halves    -> inversely proportional
 *   3  growing the kelvin temperature at steady pressure   -> Charles's law
 *   4  doubling the volume: the Celsius number or kelvin   -> (the kelvin scale is a count from zero)
 *   5  heating a sealed tank by half again                 -> Gay-Lussac's law
 *   6  adding gas under the weighted piston                -> Avogadro's law
 *   7  pressure and temperature both changed               -> combined gas law
 *   8  four gauge records, sorted by what each held fixed  -> (the four relations as one gas)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 2's knock counter doubles while the average speed and the particle count do not move. Stage 4 prints
 * the temperature in degrees only, so the doubling cannot be read off a number: it has to be reached by counting from where the
 * particles stop. Stage 7 puts the answer on a dial setting, so it is found by watching Cylinder B's gauge meet half of Cylinder A's.
 * Stage 8's records are drawn from the ideal law with the other quantities held, never from the cylinder's own readings.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, chip, curveCard, markerFixture, markerRead, rigAt, cylRead, whereIs, knocks, recordCurve
} from '../../table/kits/gas.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bboyle.?s law\b/i, introducedAt: 1 },
  { term: /\binversely proportional\b/i, introducedAt: 2 },
  { term: /\bcharles.?s law\b/i, introducedAt: 3 },
  { term: /\bgay.lussac.?s law\b/i, introducedAt: 5 },
  { term: /\bavogadro.?s law\b/i, introducedAt: 6 },
  { term: /\bcombined gas law\b/i, introducedAt: 7 }
];

/** Pressure, kelvin, the units and the speed screen are plain words from q1-knocks. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const RIG = 'rig';

/** The piston's detents in litres, even steps so the barrel is as long as the room in it. */
const QUARTER = [8, 16, 24, 32];
const HALF = [10, 20, 30, 40];
const BIG = [20, 30, 40, 50, 60, 70, 80];

/** The four records of stage 8: what is plotted, what is held, and the quantity or quantities a record keeps steady. */
export const RECORDS = [
  { id: 'a', held: 'temperature', spec: { x: 'V', y: 'P', fixed: { n: 1, T: 300 }, xmin: 2, xmax: 40, ymin: 0, ymax: 1300, xName: 'room', yName: 'pressure' } },
  { id: 'b', held: 'pressure', spec: { x: 'T', y: 'V', fixed: { n: 1, P: 101.3 }, xmin: 0, xmax: 600, ymin: 0, ymax: 50, xName: 'temperature', yName: 'room' } },
  { id: 'c', held: 'volume', spec: { x: 'T', y: 'P', fixed: { n: 1, V: 10 }, xmin: 0, xmax: 600, ymin: 0, ymax: 500, xName: 'temperature', yName: 'pressure' } },
  { id: 'd', held: 'both', spec: { x: 'n', y: 'V', fixed: { T: 300, P: 101.3 }, xmin: 0, xmax: 4, ymin: 0, ymax: 100, xName: 'amount', yName: 'room' } }
];

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */
const STAGE_REWARDS = [
  {
      reward: {
        log: 'A quarter of the room, four times the pressure.',
        title: 'Boyle\'s Law',
        body: 'At a fixed temperature, the pressure of a gas rises as its volume falls, and pressure times volume stays the same. This is Boyle\'s law.'
      }
  },
  {
      reward: {
        log: 'The same particles knock more often in less room.',
        title: 'Inversely Proportional',
        body: 'With the same particles in half the room, each one reaches the wall twice as often, so the knocks double. Pressure and volume are inversely proportional: as one falls the other rises by the same factor.'
      }
  },
  {
      reward: {
        log: 'The volume follows the kelvin temperature.',
        title: 'Charles\'s Law',
        body: 'At a steady pressure, the volume of a gas is proportional to its kelvin temperature: three times the kelvin, three times the volume. This is Charles\'s law.'
      }
  },
  {
      reward: {
        log: 'Volume is in proportion to the temperature only from absolute zero.',
        title: 'Why Kelvin',
        body: 'Volume at a steady pressure is proportional to the temperature only when the temperature is counted from absolute zero, as kelvin is. The zero of the Celsius scale is just where water freezes, so the same line does not pass through it.'
      }
  },
  {
      reward: {
        log: 'The pressure follows the kelvin temperature.',
        title: 'Gay-Lussac\'s Law',
        body: 'At a fixed volume, the pressure of a gas is proportional to its kelvin temperature, so heating a sealed tank raises the pressure in step. This is Gay-Lussac\'s law.'
      }
  },
  {
      reward: {
        log: 'Twice the gas fills twice the room.',
        title: 'Avogadro\'s Law',
        body: 'At the same temperature and pressure, the volume of a gas is proportional to the amount of gas: equal amounts fill equal volumes. This is Avogadro\'s law.'
      }
  },
  {
      reward: {
        log: 'Pressure and temperature, together.',
        title: 'Combined Gas Law',
        body: 'When pressure, volume and temperature all change, the quantity pressure times volume over kelvin temperature stays the same for a fixed amount of gas. This is the combined gas law, and the laws before it are the cases where one quantity is held fixed.'
      }
  },
  {
      reward: {
        log: 'Four changes, one gas.',
        title: 'One Gas, Four Changes',
        body: 'Each record is the same gas answering a different change: a curve when only the volume and pressure move, and straight lines through zero when the pressure or the volume is held. Together they are one relation between pressure, volume, temperature and amount.',
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
    const r = rig(RIG, { x: 36, y: 25 }, { cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', n: 1, hold: 'dial', V: 32, T: 300 }], volumes: QUARTER, volumeStart: 4, vmax: 32 });
    return {
      title: 'A Quarter of the Room',
      briefing: { speaker: SPEAKER, body: 'This bench changes one thing at a time on a cylinder of nitrogen. Press Submit when the table shows your answer.' },
      prompt: 'Squeeze the gas to a quarter of its room, then set the marker to how many times the gauge has risen.',
      widget,
      table: gasTable({ fixtures: [r, markerFixture('times', 'The gauge has risen', { x: 112, y: 28 }, { min: 1, max: 8, step: 1, start: 1, unit: 'times', w: 50 })] }),
      hints: [
        'Turn the Piston dial and watch the gauge as the room gets smaller.',
        'Compare the gauge at the biggest room with the gauge at the smallest.',
        'Divide the later reading by the earlier one to see how many times larger it is.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'times');
        if (v === 1) return { ok: false, notYet: true, msg: 'Squeeze the gas, then set the marker to how many times the gauge has risen.' };
        const a = rigAt(t, RIG, { volume: 4 })[0].P;
        const b = rigAt(t, RIG, { volume: 1 })[0].P;
        if (v === Math.round(b / a)) return { ok: true };
        return { ok: false, msg: 'Compare the gauge with the whole room and with a quarter of it: how many times larger is the second reading than the first?' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'He', n: 1, hold: 'dial', V: 40, T: 300 }], volumes: HALF, volumeStart: 4, vmax: 40,
      show: { knocks: true, speed: true }, words: { speed: 'SPEED' }, plot: { x: 'V', y: 'knocks' }
    });
    const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
    return {
      title: 'The Same Particles',
      prompt: 'Predict how the knock counter changes when the piston halves the room, then test it.',
      widget,
      table: gasTable({
        fixtures: [r],
        prediction: {
          slot: { id: 'predict', label: 'Knocks, half the room', at: { x: 111, y: 38 }, size: { w: 30, h: 12 } },
          tokens: [token('twice', 'Twice as often', 83), token('same', 'As often as before', 111), token('half', 'Half as often', 139)]
        }
      }, { recorder: { at: { x: 111, y: 20 }, size: { w: 38, h: 22 }, xLabel: 'Room', xUnit: 'L', yLabel: 'Knocks', yUnit: '' } }),
      hints: [
        'Place a prediction, then halve the room with the Piston dial and press Record.',
        'Compare the knock counter before and after the piston moves.',
        'Work out how often a particle reaches the wall when it has half as far to go.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        const full = rigAt(t, RIG, { volume: 4 })[0].knocks;
        const half = rigAt(t, RIG, { volume: 2 })[0].knocks;
        const ratio = half / full;
        const want = ratio > 1.5 ? 'twice' : ratio < 0.75 ? 'half' : 'same';
        if (token === want) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The knock counter did not change by that factor: compare its reading at the full room with its reading at half.' };
        return { ok: false, msg: 'Halve the room with the Piston dial, press Record, and compare the knock counter with your prediction.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const temps = [27, 77, 127, 177, 227, 327];
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'He', n: 1, hold: 'P', V: 20, T: 300.15, P0: 101.325 }], temps, tempList: 'C', tempStart: 1, vmax: 60,
      show: { kelvin: true }
    });
    return {
      title: 'Under a Weight',
      briefing: { speaker: SPEAKER, body: 'A steady weight now rests on the piston, so the gas can take whatever room it needs.' },
      prompt: 'Warm the gas until its volume has grown by half.',
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the Heater dial up one setting at a time and watch the volume.',
        'Compare the volume at each setting with the volume at the start.',
        'Divide the volume now by the volume at the start, and stop when that factor is the one asked for.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'The heater is where it started: turn it and watch the volume.' };
        const first = rigAt(t, RIG, { temp: 1 })[0].V;
        const now = cylRead(t, RIG, 0).V;
        const ratio = now / first;
        if (Math.abs(ratio - 1.5) < 0.015) return { ok: true };
        return { ok: false, msg: ratio < 1.5 ? 'The volume has not yet grown by half: divide the volume now by the volume at the start.' : 'The volume has grown by more than half: divide the volume now by the volume at the start.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const base = { gas: 'He', n: 1, hold: 'P', V: 20, T: 300.15, P0: 101.325 };
    const a = rig('ra', { x: 20, y: 25 }, { cyls: [{ id: 'a', label: 'Cylinder A', ...base }], vmax: 60, compact: true, w: 34, show: { gauge: false } });
    const b = rig('rb', { x: 58, y: 25 }, { cyls: [{ id: 'a', label: 'Cylinder B', ...base }], temps: [27, 50, 100, 200, 327, 400], tempList: 'C', tempStart: 1, vmax: 60, compact: true, w: 34, show: { gauge: false } });
    return {
      title: 'Which Scale',
      prompt: 'Set Cylinder B\'s heater so that its volume is twice the volume of Cylinder A.',
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Turn Cylinder B\'s Heater dial and watch its volume beside Cylinder A\'s.',
        'Compare the two volumes at each setting, and the temperature Cylinder B prints.',
        'Count the temperature from where the particles stop, as the first bench showed.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures.rb.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Cylinder B\'s heater is where it started: turn it and watch the volume.' };
        const va = cylRead(t, 'ra', 0).V;
        const vb = cylRead(t, 'rb', 0).V;
        if (Math.abs(vb / va - 2) < 0.02) return { ok: true };
        return { ok: false, msg: 'Cylinder B\'s volume is not yet twice Cylinder A\'s: divide one volume by the other at each setting.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Tank A', gas: 'N2', n: 1, hold: 'V', V: 10, T: 300 }], temps: [300, 375, 450, 600], tempList: 'K', tempStart: 1, vmax: 10, plot: { x: 'T', y: 'P' }
    });
    const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
    return {
      title: 'A Sealed Tank',
      prompt: 'Predict what the gauge does when the sealed tank is heated from 300 K to 450 K, then test it.',
      widget,
      table: gasTable({
        fixtures: [r],
        prediction: {
          slot: { id: 'predict', label: 'The gauge, at 450 K', at: { x: 111, y: 38 }, size: { w: 30, h: 12 } },
          tokens: [token('half', 'Half again', 83), token('double', 'Doubles', 111), token('quarter', 'A quarter more', 139)]
        }
      }, { recorder: { at: { x: 111, y: 20 }, size: { w: 38, h: 22 }, xLabel: 'Temperature', xUnit: 'K', yLabel: 'Gauge', yUnit: 'kPa' } }),
      hints: [
        'Place a prediction, then turn the Heater dial to 450 K and press Record.',
        'Compare the gauge at 450 K with the gauge at 300 K.',
        'Divide the later gauge reading by the first and compare the result with your prediction.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        const ratio = rigAt(t, RIG, { temp: 3 })[0].P / rigAt(t, RIG, { temp: 1 })[0].P;
        const want = Math.abs(ratio - 1.5) < 0.03 ? 'half' : Math.abs(ratio - 2) < 0.03 ? 'double' : 'quarter';
        if (token === want) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The gauge did not change by that factor: compare its reading at 450 K with its reading at 300 K.' };
        return { ok: false, msg: 'Turn the Heater dial to 450 K, press Record, and compare the gauge with your prediction.' };
      },
      ...STAGE_REWARDS[4]
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const r = rig(RIG, { x: 36, y: 25 }, {
      cyls: [{ id: 'a', label: 'Cylinder A', gas: 'Ne', hold: 'P', V: 20, T: 300, P0: 101.325 }], amounts: [1, 1.5, 2, 2.5, 3], amountStart: 1, vmax: 80
    });
    return {
      title: 'Feeding the Piston',
      prompt: 'Sort each reading by whether it changes when gas is added under the weighted piston.',
      widget,
      table: gasTable({
        pieces: [['pressure', 'PRESSURE'], ['volume', 'VOLUME'], ['temp', 'TEMPERATURE']].map(([id, label], i) => chip(id, label, { x: 11 + i * 17, y: 52 })),
        fixtures: [r],
        zones: {
          trays: [
            { id: 'changes', label: 'Changes', at: { x: 101, y: 17 }, size: { w: 58, h: 21 }, cell: 19 },
            { id: 'stays', label: 'Stays the same', at: { x: 101, y: 52 }, size: { w: 58, h: 21 }, cell: 19 }
          ]
        }
      }),
      hints: [
        'Turn the Gas in dial and watch every reading on the cylinder.',
        'Compare which readings change and which stay the same as gas is added under the weighted piston.',
        'Put each reading in the tray for what it did while you added gas.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['pressure', 'volume', 'temp'];
        if (!ids.every(id => whereIs(t, id) === 'changes' || whereIs(t, id) === 'stays')) return { ok: false, notYet: true, msg: 'Put every reading in a tray.' };
        const a = rigAt(t, RIG, { amount: 1 })[0];
        const b = rigAt(t, RIG, { amount: 5 })[0];
        const changes = { pressure: Math.abs(a.P - b.P) > 1e-6, volume: Math.abs(a.V - b.V) > 1e-6, temp: Math.abs(a.T - b.T) > 1e-6 };
        for (const id of ids) {
          if (whereIs(t, id) !== (changes[id] ? 'changes' : 'stays')) return { ok: false, msg: `Add gas again and watch the ${id === 'temp' ? 'temperature' : id}: does it change?` };
        }
        return { ok: true };
      },
      ...STAGE_REWARDS[5]
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const a = rig('ra', { x: 20, y: 25 }, { cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', n: 0.802, hold: 'V', V: 20, T: 300 }], vmax: 80, compact: true, w: 34, show: { kelvin: true, temperature: false } });
    const b = rig('rb', { x: 58, y: 25 }, { cyls: [{ id: 'a', label: 'Cylinder B', gas: 'N2', n: 0.802, hold: 'dial', V: 20, T: 450 }], volumes: BIG, volumeStart: 1, vmax: 80, compact: true, w: 34, show: { kelvin: true, temperature: false } });
    return {
      title: 'Everything at Once',
      prompt: 'Set Cylinder B\'s piston so its gauge reads half of Cylinder A\'s while it stays at 450 K.',
      widget,
      table: gasTable({ fixtures: [a, b] }),
      hints: [
        'Turn Cylinder B\'s Piston dial and watch its gauge beside Cylinder A\'s.',
        'Compare Cylinder B\'s gauge with half of Cylinder A\'s at each setting.',
        'Stop on the setting where Cylinder B\'s gauge reads half of Cylinder A\'s.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures.rb.dials.volume.value) === 1) return { ok: false, notYet: true, msg: 'Cylinder B\'s piston is where it started: turn it and watch its gauge.' };
        const pa = cylRead(t, 'ra', 0).P;
        const pb = cylRead(t, 'rb', 0).P;
        if (Math.abs(pb - pa / 2) < 0.006 * pa) return { ok: true };
        return { ok: false, msg: pb > pa / 2 ? 'Cylinder B\'s gauge is still above half of Cylinder A\'s: give the gas more room.' : 'Cylinder B\'s gauge is below half of Cylinder A\'s: give the gas less room.' };
      },
      ...STAGE_REWARDS[6]
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const tray = (id, label, x) => ({ id, label, at: { x, y: 24 }, size: { w: 34, h: 28 }, cell: 25 });
    return {
      title: 'Four Records',
      prompt: 'Put each plotted record in the tray for the quantity it held steady.',
      widget,
      table: gasTable({
        pieces: RECORDS.map((r, i) => curveCard(r.id, `RECORD ${r.id.toUpperCase()}`, { x: 19 + i * 36, y: 51 }, r.spec)),
        zones: {
          trays: [tray('temperature', 'Temperature', 19), tray('pressure', 'Pressure', 55), tray('volume', 'Volume', 91), tray('both', 'Temperature and pressure', 127)]
        }
      }),
      hints: [
        'Read the two quantities on the axes of each record.',
        'Find the quantities of a gas that are not on an axis, and ask which of them the record keeps steady.',
        'Put each record in the tray for the quantity or quantities that stayed the same while the others were plotted.'
      ],
      check(state) {
        const t = state.table;
        const ids = RECORDS.map(r => r.id);
        if (!ids.every(id => (t.pieces[id].zone || '').startsWith('tray:'))) return { ok: false, notYet: true, msg: 'Put every record in a tray.' };
        for (const r of RECORDS) {
          if (whereIs(t, r.id) !== r.held) return { ok: false, msg: 'Read the two axes of that record and ask which of pressure, volume and temperature is left out, and which of those the curve keeps steady.' };
        }
        return { ok: true };
      },
      ...STAGE_REWARDS[7]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Piston dial, then set the marker.'],
  2: ['Place a prediction, turn the Piston dial,', 'then press Record.'],
  3: ['Turn the Heater dial to warm the gas.'],
  4: ['Turn Cylinder B\'s Heater dial.'],
  5: ['Place a prediction, turn the Heater dial,', 'then press Record.'],
  6: ['Turn the Gas in dial; drag each chip into a tray.'],
  7: ['Turn Cylinder B\'s Piston dial.'],
  8: ['Drag each record into a tray.']
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
      body: 'Pressure and volume pull against each other, pressure and kelvin temperature climb together, volume and kelvin temperature climb together, and volume follows the amount of gas. All four are the same gas, each one answering the change you made.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every gas calculation on an exam is one of these relations or two of them chained together. You have now seen each one happen.'
    },
    {
      heading: 'Next',
      body: 'The next bench shows that all four relations are one equation, and finds the number that ties them together.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas at 2.00 atm is compressed at a constant temperature until its volume is one third of what it was. What is the new pressure?',
    options: [
      { id: 'a', label: '6.00 atm' },
      { id: 'b', label: '0.67 atm' },
      { id: 'c', label: '3.00 atm' },
      { id: 'd', label: '2.00 atm' }
    ],
    answer: 'a',
    explanation: 'At a constant temperature the product of pressure and volume stays the same (Boyle’s law). One third of the volume means three times the pressure, so 6.00 atm.'
  },
  {
    question: 'A balloon holds 2.0 L of air at 300 K. What is its volume at 450 K, at the same pressure?',
    options: [
      { id: 'a', label: '3.0 L' },
      { id: 'b', label: '1.3 L' },
      { id: 'c', label: '4.5 L' },
      { id: 'd', label: '2.0 L' }
    ],
    answer: 'a',
    explanation: 'At a constant pressure the volume is proportional to the kelvin temperature (Charles’s law): 2.0 L × 450/300 = 3.0 L.'
  },
  {
    question: 'Why must temperatures be in kelvin in gas-law calculations?',
    options: [
      { id: 'a', label: 'Because volume and pressure are proportional to temperature only when it is counted from absolute zero' },
      { id: 'b', label: 'Because kelvin degrees are larger than Celsius degrees' },
      { id: 'c', label: 'Because Celsius temperatures cannot be negative' },
      { id: 'd', label: 'Because gases only exist above 0 K' }
    ],
    answer: 'a',
    explanation: 'A proportion needs a true zero. The kelvin scale puts zero at absolute zero, where the particles would have no motion left; the Celsius zero is just where water freezes.'
  },
  {
    question: 'A sealed rigid tank of gas is heated from 250 K to 500 K. What happens to its pressure?',
    options: [
      { id: 'a', label: 'It doubles' },
      { id: 'b', label: 'It halves' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It becomes four times as large' }
    ],
    answer: 'a',
    explanation: 'At a fixed volume the pressure is proportional to the kelvin temperature (Gay-Lussac’s law), and the kelvin temperature doubled.'
  },
  {
    question: 'A gas at 100 kPa, 10.0 L and 300 K is taken to 50 kPa and 600 K. What volume does it fill?',
    options: [
      { id: 'a', label: '40.0 L' },
      { id: 'b', label: '10.0 L' },
      { id: 'c', label: '20.0 L' },
      { id: 'd', label: '5.0 L' }
    ],
    answer: 'a',
    explanation: 'By the combined gas law, V2 = V1 × (P1/P2) × (T2/T1) = 10.0 × 2 × 2 = 40.0 L.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));

export const SOLUTIONS = [
  [dial(RIG, 'volume', 1), dial(RIG, 'volume', 4), dial(RIG, 'volume', 1), dial('times', 'value', 4)],
  [{ predict: 'twice' }, dial(RIG, 'volume', 2), { run: RIG }],
  [dial(RIG, 'temp', 4)],
  [dial('rb', 'temp', 5)],
  [{ predict: 'half' }, dial(RIG, 'temp', 3), { run: RIG }],
  [dial(RIG, 'amount', 5), ...sort({ volume: 'changes', pressure: 'stays', temp: 'stays' })],
  [dial('rb', 'volume', 5)],
  [...sort({ a: 'temperature', b: 'pressure', c: 'volume', d: 'both' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial(RIG, 'volume', 1), dial('times', 'value', 2)],
  [{ predict: 'half' }, dial(RIG, 'volume', 2), { run: RIG }],
  [dial(RIG, 'temp', 3)],
  [dial('rb', 'temp', 2)],
  [{ predict: 'double' }, dial(RIG, 'temp', 3), { run: RIG }],
  [dial(RIG, 'amount', 5), ...sort({ volume: 'changes', pressure: 'changes', temp: 'stays' })],
  [dial('rb', 'volume', 3)],
  [...sort({ a: 'pressure', b: 'temperature', c: 'volume', d: 'both' })]
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
export { rigAt, cylRead, knocks, recordCurve };
