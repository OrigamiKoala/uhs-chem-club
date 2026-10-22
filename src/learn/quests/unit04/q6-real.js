/**
 * q6-real.js — Bellows, bench six: REAL GASES.
 *
 * The liquefier's cold box beside the compressor tower, and the sixth of Bellows' TABLETOPS (plan `bench-tabletop.md`, phase T5), on the gas
 * kit (`table/kits/gas.js`). Every bench so far held a gas to the gas law, and the gas law held. This one squeezes and chills until it stops.
 * The reading PV over nRT, which is one for an ideal gas, is pushed above one by the room the particles take and below one by the pull
 * between them, and the plate prints the two corrections one beside the other, in kilopascals, so which one wins at a setting is read,
 * not argued.
 *
 *   1  PV over nRT as helium is squeezed hard                -> (it rises above one)
 *   2  why it rises                                           -> (the particles take up room)
 *   3  PV over nRT as carbon dioxide is cooled               -> (it falls below one)
 *   4  what the pull does as the gas cools                    -> ideal gas, real gas
 *   5  three gases ordered by how far they stray              -> (the stronger the pull, the further)
 *   6  which cylinder behaves most like an ideal gas          -> (low pressure and high temperature)
 *   7  which correction matters when                          -> van der Waals equation (beyond the exam)
 *   8  why a real gas can be made a liquid                    -> (pulls that win over motion)
 *
 * THE EVIDENCE IS ON THE BENCH. Every reading comes from the van der Waals equation over each gas's measured constants (`gasdata.js`).
 * Stage 2's statements are each refuted or supported by a line the plate prints (the mass and the speed stay put, the room taken grows
 * and dwarfs the pull). Stage 7 is honest about what the constants say: for carbon dioxide the two corrections trade places with the
 * TEMPERATURE (their ratio is about RTb/a at any roomy setting), so a hot gas is the one the size of its particles governs. Stage 8's
 * evidence includes a sample at the cold box's draw-off, fetched from the field point `drawoff`, where this gas is a liquid.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, chip, stmt, markCard, markerRead, whereIs, cylRead, rigAt, GASES, pressureVdw, compression
} from '../../table/kits/gas.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bideal gas(?:es)?\b/i, introducedAt: 4 },
  { term: /\breal gas(?:es)?\b/i, introducedAt: 4 },
  { term: /\bvan der waals\b/i, introducedAt: 7 }
];

/** The gas laws, pressure and the speed screen are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q5-speed'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const RIG = 'rig';

/** The piston's settings for stages 1, 2 and 7 (litres). */
const SQUEEZE = [24.6, 2.5, 0.5, 0.2, 0.1, 0.06];
/** Stage 1's mark, and stage 3's. */
export const ABOVE = 1.25;
export const BELOW = 0.75;
/** Carbon dioxide's cooler, and the temperatures of stages 5, 6 and 7 (kelvin). */
const COOL = [300, 280, 260, 240, 230];
const COLD = [200, 220, 240];
const WARM = [250, 350, 450, 550];
const ROOMY = [1, 0.5, 0.25];
const HOT = [250, 500, 1000];

const WORDS = { room: 'SIZE PUTS ON', pull: 'PULL TAKES OFF', z: 'PV / nRT' };

const cyl = (id, label, gas, extra = {}) => ({ id, label, gas, n: 1, T: 300, V: 1, hold: 'dial', vdw: true, ...extra });
const token = (id, label, x) => ({ id, label, at: { x, y: 55 }, r: 7 });

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */

/** The statements of stages 2 and 8, and which are true. */
const REASONS = [
  ['c1', 'The particles take up room themselves', true],
  ['c2', 'The particles get heavier when squeezed', false],
  ['c3', 'The particles slow down as they are squeezed', false],
  ['c4', 'The pull between them grows and adds pressure', false],
  ['c5', 'Less room is left for them to move in', true]
];
const COOLING = [
  ['c1', 'The particles slow down as the gas cools', true],
  ['c2', 'The pull takes a larger share as it cools', true],
  ['c3', 'The gas gains mass as it cools', false],
  ['c4', 'Real particles never pull on each other', false]
];
export const TRUE_REASONS = REASONS.filter(r => r[2]).map(r => r[0]);
export const TRUE_COOLING = COOLING.filter(r => r[2]).map(r => r[0]);

const cardAt = (i) => ({ x: 94 + (i % 2) * 36, y: 12 + Math.floor(i / 2) * 19 });

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */
const STAGE_REWARDS = [
  {
      reward: {
        log: 'Squeezed hard, the reading climbs above one.',
        title: 'Above One',
        body: 'Squeezed hard, helium reads above one: it pushes harder than the gas law says it should. The law counts on the particles being points, and these are not.'
      }
  },
  {
      reward: {
        log: 'The particles fill some of the room.',
        title: 'Particles Take Room',
        body: 'At high pressure, particle size is no longer negligible. Particles take up space themselves, leaving less room to move and driving pressure above ideal predictions.'
      }
  },
  {
      reward: {
        log: 'Cooled, the reading falls below one.',
        title: 'Below One',
        body: 'Cooled toward its condensing point, carbon dioxide reads below one: its pressure is lower than the gas law says. Something other than size is acting on the particles.'
      }
  },
  {
      reward: {
        log: 'A cold gas is held back by a pull.',
        title: 'Ideal Gas, Real Gas',
        body: 'An ideal gas has zero particle volume and zero attraction. Real gases drift from ideal behavior when crowded or cold enough for attractions to matter.'
      }
  },
  {
      reward: {
        log: 'The stronger the pull, the further a gas strays.',
        title: 'Strong Pulls Stray Furthest',
        body: 'Gases whose particles pull harder on one another stray furthest from the gas law: ammonia far more than nitrogen, and helium, whose particles barely attract at all, hardly any.'
      }
  },
  {
      reward: {
        log: 'Low pressure and high temperature.',
        title: 'When a Gas Behaves',
        body: 'A real gas comes closest to ideal at low pressure and high temperature: its particles are far apart and moving too fast for their pulls to matter.'
      }
  },
  {
      reward: {
        log: 'A pull and a size, one to a side.',
        title: 'The van der Waals Equation',
        body: 'Particle attractions reduce measured pressure, while particle volume increases it. In a cold gas the attractions win, and in a hot gas, whose particles move too fast to be held, the size of the particles does.'
      }
  },
  {
      reward: {
        log: 'A pull that wins over motion makes a liquid.',
        title: 'From Gas to Liquid',
        body: 'Where the pull between particles beats their motion, they stay together and the gas becomes a liquid. An ideal gas has no pull, so it could be cooled for ever and stay a gas.',
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
    const r = rig(RIG, { x: 75, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'He')], volumes: SQUEEZE, volumeStart: 1, vmax: 24.6, units: 'atm', w: 80,
      show: { temperature: false, amount: false, z: true }
    });
    return {
      title: 'Squeezed Hard',
      briefing: { speaker: SPEAKER, body: 'This bench squeezes and cools a gas past where the gas law holds, and prints PV / nRT — pressure times room over amount times R times temperature — which reads one while the law is true. Press Submit when the table shows your answer.' },
      prompt: 'Squeeze the helium until PV / nRT reads above 1.25.',
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the Piston dial from the largest room to the smallest and read PV / nRT at each setting.',
        'Compare the reading at the largest room with the readings at the smallest few.',
        'Stop on a setting whose reading is above the figure the prompt names.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.volume.value) === 1) return { ok: false, notYet: true, msg: 'The piston is where it started: turn the dial and read the figure.' };
        if (cylRead(t, RIG, 0).Z > ABOVE) return { ok: true };
        return { ok: false, msg: 'The reading is not above 1.25 yet: squeeze further and watch which way PV / nRT moves.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 38, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'He')], volumes: SQUEEZE, volumeStart: 3, vmax: 24.6, units: 'atm', w: 66, cols: 1, words: WORDS,
      show: { gauge: false, temperature: false, amount: false, z: true, room: true, pull: true, speed: true, mass: true }
    });
    return {
      title: 'Particles Take Room',
      prompt: 'Mark every statement the bench shows to be a reason the reading rises when the gas is squeezed.',
      widget,
      table: gasTable({ pieces: REASONS.map(([id, label], i) => markCard(id, label, cardAt(i))), fixtures: [r] }),
      hints: [
        'Turn the Piston dial and watch every line the plate prints.',
        'Compare each statement with the lines that stay put and the lines that grow as the room shrinks.',
        'Mark a statement only if a line on the plate shows it happening and the reading rising with it.'
      ],
      check(state) {
        const t = state.table;
        const marked = REASONS.map(r => r[0]).filter(id => t.pieces[id].props.flipped);
        if (!marked.length) return { ok: false, notYet: true, msg: 'Tap the statements that are reasons to mark them.' };
        if (marked.slice().sort().join() === TRUE_REASONS.slice().sort().join()) return { ok: true };
        if (marked.some(id => !TRUE_REASONS.includes(id))) return { ok: false, msg: 'One of the marked statements is contradicted by a line on the plate: turn the piston and see which lines stay put.' };
        return { ok: false, msg: 'A reason the bench shows is still unmarked: look at the line that grows as the room shrinks.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = rig(RIG, { x: 75, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'CO2', { V: 0.5, hold: 'V' })], temps: COOL, tempList: 'K', tempStart: 1, vmax: 1, w: 80,
      show: { temperature: false, kelvin: true, amount: false, z: true }
    });
    return {
      title: 'Cooled Toward a Liquid',
      prompt: 'Cool the carbon dioxide until PV / nRT reads below 0.75.',
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the Heater dial from the warmest setting to the coldest and read PV / nRT at each.',
        'Compare the reading at the warmest setting with the readings at the coldest.',
        'Stop on a setting whose reading is below the figure the prompt names.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'The heater is where it started: turn it and read the figure.' };
        if (cylRead(t, RIG, 0).Z < BELOW) return { ok: true };
        return { ok: false, msg: 'The reading is not below 0.75 yet: cool the gas further and watch which way PV / nRT moves.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 40, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'CO2', { V: 0.5, hold: 'V' })], temps: COOL, tempList: 'K', tempStart: 1, vmax: 1, w: 66,
      show: { temperature: false, kelvin: true, amount: false, z: true, pullShare: true }, plot: { x: 'T', y: 'pullShare' }
    });
    return {
      title: 'The Pull',
      briefing: { speaker: SPEAKER, body: 'The plate now prints PULL SHARE: the part of the push that the pull between the particles takes off.' },
      prompt: 'Predict what happens to the pull\'s share of the push as the gas cools, then test it.',
      widget,
      table: gasTable({
        fixtures: [r],
        prediction: {
          slot: { id: 'predict', label: 'The pull\'s share', at: { x: 111, y: 26 }, size: { w: 30, h: 12 } },
          tokens: [token('grows', 'Grows', 90), token('same', 'Stays', 112), token('falls', 'Falls', 134)]
        }
      }),
      hints: [
        'Place a prediction, turn the Heater dial down, and press Record at more than one setting.',
        'Compare PULL SHARE at the warmest setting with PULL SHARE at the coldest.',
        'Ask what a pull between neighbours does to the knock each particle makes on the wall as the particles slow.'
      ],
      check(state) {
        const t = state.table;
        const tk = t.prediction.token;
        if (!tk) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        const warm = rigAt(t, RIG, { temp: 1 })[0].pullShare;
        const cold = rigAt(t, RIG, { temp: COOL.length })[0].pullShare;
        const want = Math.abs(cold - warm) < 1e-6 ? 'same' : cold > warm ? 'grows' : 'falls';
        if (tk === want) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The plate does not follow that prediction: compare PULL SHARE at the warmest and the coldest settings.' };
        return { ok: false, msg: 'Turn the Heater dial down, press Record, and compare PULL SHARE with your prediction.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = rig(RIG, { x: 30, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'N2', { V: 2, hold: 'V' }), cyl('b', 'Cylinder B', 'NH3', { V: 2, hold: 'V' }), cyl('c', 'Cylinder C', 'He', { V: 2, hold: 'V' })],
      temps: COLD, tempList: 'K', tempStart: 1, vmax: 2, compact: true, w: 36,
      show: { gauge: false, volume: false, temperature: false, amount: false, z: true }
    });
    return {
      title: 'Who Strays Furthest',
      prompt: 'Rank these three cold gases from greatest departure from ideal behavior to least.',
      widget,
      table: gasTable({
        pieces: ['a', 'b', 'c'].map((id, i) => chip(id, `CYLINDER ${id.toUpperCase()}`, { x: 75 + i * 28, y: 54 })),
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 108, y: 28 }, size: { w: 80, h: 22 }, first: 'Greatest departure', last: 'Least departure', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } }
      }),
      hints: [
        'Read PV / nRT on all three cylinders and turn the Heater dial.',
        'Compare how far each reading sits from one, whichever side of one it is on.',
        'Put first the cylinder whose reading is furthest from one at every setting of the dial.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders on the rail.' };
        const dev = id => Math.abs(cylRead(t, RIG, id).Z - 1);
        const want = ['a', 'b', 'c'].sort((x, y) => dev(y) - dev(x));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Judge by the distance from one, and not by which side of it a reading is on.' };
      },
      ...STAGE_REWARDS[4]
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const mk = (id, at, list) => rig(id, at, {
      cyls: list.map(([cid, V]) => cyl(cid, `Cylinder ${cid.toUpperCase()}`, 'CO2', { V, hold: 'V' })), temps: WARM, tempList: 'K', tempStart: 1, vmax: 50, compact: true, w: 36,
      show: { gauge: false, volume: true, temperature: false, amount: false, z: true }
    });
    const slot = { id: 'best', label: 'The most ideal', at: { x: 118, y: 24 }, size: { w: 24, h: 14 } };
    return {
      title: 'When a Gas Behaves',
      prompt: 'Put the chip of the cylinder that behaves most like an ideal gas in the slot.',
      widget,
      table: gasTable({
        pieces: ['a', 'b', 'c', 'd'].map((id, i) => chip(id, `CYLINDER ${id.toUpperCase()}`, { x: 92 + i * 16, y: 54 })),
        fixtures: [mk('r1', { x: 24, y: 32 }, [['a', 0.4], ['b', 2]]), mk('r2', { x: 64, y: 32 }, [['c', 10], ['d', 50]])],
        zones: { slots: [slot] }
      }),
      hints: [
        'Read PV / nRT on all four cylinders, then turn both Heater dials.',
        'Compare how close each reading stays to one at every setting of the dials.',
        'Choose the cylinder whose reading stays closest to one whichever way the heaters are set.'
      ],
      check(state) {
        const t = state.table;
        const holder = ['a', 'b', 'c', 'd'].find(id => whereIs(t, id) === 'best');
        if (!holder) return { ok: false, notYet: true, msg: 'Put a cylinder\'s chip in the slot.' };
        const rigOf = id => (id === 'a' || id === 'b' ? 'r1' : 'r2');
        const worst = id => Math.max(...WARM.map((_, k) => Math.abs(rigAt(t, rigOf(id), { temp: k + 1 }).find(c => c.id === id).Z - 1)));
        const best = ['a', 'b', 'c', 'd'].sort((x, y) => worst(x) - worst(y))[0];
        if (holder === best) return { ok: true };
        return { ok: false, msg: 'Compare how close each reading is to one at the coldest setting and at the hottest; a good gas stays close at both.' };
      },
      ...STAGE_REWARDS[5]
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const r = rig(RIG, { x: 46, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'CO2')], volumes: ROOMY, volumeStart: 1, temps: HOT, tempList: 'K', tempStart: 1, vmax: 1, w: 70, words: WORDS,
      show: { temperature: false, kelvin: true, amount: false, z: true, pull: true, room: true }
    });
    return {
      title: 'Two Corrections',
      prompt: 'Turn the dials until the size of the particles puts on more pressure than the pull takes off.',
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Read the two lines of the plate at the setting the dials start on.',
        'Turn one dial at a time and watch which of the two lines grows faster.',
        'Stop on a setting where the line SIZE PUTS ON is the larger figure.'
      ],
      check(state) {
        const t = state.table;
        const q = cylRead(t, RIG, 0);
        if (q.room > q.pull) return { ok: true };
        return { ok: false, msg: 'The pull still takes off more than the size puts on: turn each dial in turn and watch which line grows faster.' };
      },
      ...STAGE_REWARDS[6]
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const r = rig(RIG, { x: 38, y: 32 }, {
      cyls: [cyl('a', 'Cylinder A', 'CO2', { V: 0.5, hold: 'V' })], temps: [300, 260, 240, 230], tempList: 'K', tempStart: 1, vmax: 1, w: 66,
      show: { gauge: false, temperature: false, kelvin: true, amount: false, z: false, speed: true, mass: true, pullShare: true }
    });
    return {
      title: 'Why It Condenses',
      prompt: 'Mark every statement the bench shows to be true of the gas as it cools.',
      widget,
      table: gasTable({
        pieces: [
          ...COOLING.map(([id, label], i) => markCard(id, label, cardAt(i))),
          { ...stmt('draw', 'Cold box draw-off: liquid CO₂ at −57 °C', { x: 94, y: 51 }), hidden: true, fetchFrom: 'drawoff' }
        ],
        fixtures: [r],
        fetch: [{ id: 'drawoff', label: 'Cold Draw-off', at: { x: 130, y: 55 } }]
      }),
      hints: [
        'Turn the Heater dial down and read the speed, the mass and the pull share at each setting.',
        'Compare each statement with the lines that move and the lines that stay put, and with the sample at the cold box\'s draw-off.',
        'Mark a statement only if a line on the plate or the draw-off shows it happening.'
      ],
      check(state) {
        const t = state.table;
        const marked = COOLING.map(r => r[0]).filter(id => t.pieces[id].props.flipped);
        if (!marked.length) return { ok: false, notYet: true, msg: 'Tap the statements that are true to mark them.' };
        if (marked.slice().sort().join() === TRUE_COOLING.slice().sort().join()) return { ok: true };
        if (marked.some(id => !TRUE_COOLING.includes(id))) return { ok: false, msg: 'One of the marked statements is contradicted by a line on the plate: turn the heater down and see which lines move and which stay put.' };
        return { ok: false, msg: 'A statement the bench shows is still unmarked: look at the speed and at the pull share as the gas cools.' };
      },
      ...STAGE_REWARDS[7]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Piston dial and read PV / nRT.'],
  2: ['Turn the Piston dial, then tap the statements', 'the plate supports.'],
  3: ['Turn the Heater dial and read PV / nRT.'],
  4: ['Place a prediction, turn the Heater dial,', 'then press Record.'],
  5: ['Drag each cylinder into its place on the rail.'],
  6: ['Turn both Heater dials, then drag a', 'chip into the slot.'],
  7: ['Turn the Piston and Heater dials.'],
  8: ['Turn the Heater dial and fetch the draw-off,', 'then tap the true statements.']
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
      body: 'A real gas reads above one where its particles crowd and below one where they cling, so it is closest to ideal when it is thin and hot, and furthest from it when it is dense and cold. The same pull that holds it back is what turns it into a liquid.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every pressure vessel on the cloud deck is designed with the corrections in mind. The gas law is a very good first answer, and now you know exactly where it stops being one.'
    },
    {
      heading: 'Next',
      body: 'Something at the heart of the deck is running every pump at once, and it is reading you as closely as you have read the gas.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'At very high pressure, a real gas has PV/nRT greater than 1. What is the main cause?',
    options: [
      { id: 'a', label: 'The particles take up a significant part of the volume' },
      { id: 'b', label: 'The attractions between the particles become stronger' },
      { id: 'c', label: 'The particles slow down' },
      { id: 'd', label: 'The particles lose mass' }
    ],
    answer: 'a',
    explanation: 'When the gas is compressed, the volume of the particles themselves is no longer negligible, so the free volume is smaller and the pressure higher than the ideal gas law predicts.'
  },
  {
    question: 'Near its condensing point, a real gas has PV/nRT less than 1. What is the main cause?',
    options: [
      { id: 'a', label: 'Attractions between the particles reduce the force of their collisions with the walls' },
      { id: 'b', label: 'The particles take up less volume' },
      { id: 'c', label: 'The particles move faster' },
      { id: 'd', label: 'The gas gains mass' }
    ],
    answer: 'a',
    explanation: 'Attractions pull the particles toward each other, so they strike the walls more softly and the pressure is lower than the ideal gas law predicts.'
  },
  {
    question: 'Which of these gases is expected to deviate most from ideal behaviour at the same temperature and pressure?',
    options: [
      { id: 'a', label: 'NH₃' },
      { id: 'b', label: 'N₂' },
      { id: 'c', label: 'He' },
      { id: 'd', label: 'H₂' }
    ],
    answer: 'a',
    explanation: 'Ammonia has the strongest attractions between its particles of these four, and so strays furthest from the ideal gas law.'
  },
  {
    question: 'Under which conditions does a real gas behave most ideally?',
    options: [
      { id: 'a', label: 'High temperature and low pressure' },
      { id: 'b', label: 'Low temperature and high pressure' },
      { id: 'c', label: 'High temperature and high pressure' },
      { id: 'd', label: 'Low temperature and low pressure' }
    ],
    answer: 'a',
    explanation: 'At high temperature the particles move too fast for attractions to matter, and at low pressure they are far enough apart for their own volume not to matter.'
  },
  {
    question: 'Why can a real gas be liquefied but an ideal gas could not?',
    options: [
      { id: 'a', label: 'Real particles attract one another, so they can cling together when cooled' },
      { id: 'b', label: 'Real particles have mass and ideal particles do not' },
      { id: 'c', label: 'Real particles are slower' },
      { id: 'd', label: 'Ideal particles are too big to condense' }
    ],
    answer: 'a',
    explanation: 'An ideal gas has no attractions between its particles, so nothing can hold them together when they slow down. Real particles do attract, and below a certain temperature the attraction wins.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const mark = ids => ids.map(id => ({ flip: id }));

export const SOLUTIONS = [
  [dial(RIG, 'volume', 6)],
  [dial(RIG, 'volume', 5), ...mark(TRUE_REASONS)],
  [dial(RIG, 'temp', 4)],
  [{ predict: 'grows' }, dial(RIG, 'temp', 5), { run: RIG }],
  [put('b', 'rail:0'), put('a', 'rail:1'), put('c', 'rail:2')],
  [dial('r1', 'temp', 3), dial('r2', 'temp', 3), put('d', 'slot:best')],
  [dial(RIG, 'temp', 3)],
  [{ fetch: 'drawoff' }, dial(RIG, 'temp', 4), ...mark(TRUE_COOLING)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial(RIG, 'volume', 3)],
  [...mark(['c2', 'c3'])],
  [dial(RIG, 'temp', 2)],
  [{ predict: 'falls' }, dial(RIG, 'temp', 5), { run: RIG }],
  [put('c', 'rail:0'), put('a', 'rail:1'), put('b', 'rail:2')],
  [put('a', 'slot:best')],
  [dial(RIG, 'volume', 2)],
  [...mark(['c3', 'c4'])]
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
export const CHECKS = { pressureVdw, compression, GASES, rigAt, cylRead };
