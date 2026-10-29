/**
 * q6-real.js — Bellows, bench six: REAL GASES.
 *
 * The liquefier's cold box beside the compressor tower, on the gas kit (`table/kits/gas.js`). Every bench so far held a gas to the gas
 * law, and the law held. This one squeezes and chills until it stops. A cylinder prints what its gauge reads beside what the gas law says
 * it should read, so how far a real gas strays is something to look at, not something to work out.
 *
 * THE CLICK. Players treat the gas law as exact: squeeze helium to a hundredth of its room and the gauge must read a hundred times
 * more. Stage 1 asks for that guess (a predict stage, no instrument). Stage 2 squeezes helium as far as the piston goes, with the
 * particles drawn at the share of the room they truly take: the crowd fills the glass, and the gauge reads MORE than the law says.
 * The particles are not points. Stage 3 sorts four gases by which side of the law they read on (cooled gases read below it), and
 * stage 4 ranks cold gases by how far they stray, with the plant's own record of when each turns liquid as new evidence.
 *
 *   1  PREDICT: helium squeezed to a hundredth of its room, against the gas law
 *   2  TEST: squeeze it all the way, lay the card for the gauge        -> Particles Take Room
 *   3  four cylinders: above, on or below the law                      -> Ideal Gas, Real Gas
 *   4  rank cold gases by how far each strays                          -> Strong Pulls Stray Furthest
 *
 * (Cut as past the idea or repeated: the compression-factor readings and the two corrections in kilopascals, the van der Waals
 * equation, the "which cylinder is most ideal" slot and the two statement-marking stages, which asked the player to report lines the
 * plate printed.)
 *
 * FIELD. Stage 4 may fetch the cold box's draw-off record (`bellows/stations.js`, field point `drawoff`): the temperatures at which the
 * three gases turn liquid. It is new evidence, not a copy of anything on the bench, and the stage is solvable without it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { gasTable, rig, chip, stmt, whereIs, cylRead, rigAt, GASES } from '../../table/kits/gas.js';
import { widget, put, dial, sort, cardIn, predictStage, youPredicted, guessOf } from './_shared.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bideal gas(?:es)?\b/i, introducedAt: 3 },
  { term: /\breal gas(?:es)?\b/i, introducedAt: 3 }
];

/** The gas laws, pressure and the speed screen are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q5-speed'];

export const QUEST_KEY = 'unit04/q6-real';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RIG = 'rig';

/** The piston's settings for stage 2 (litres): a thousand-fold squeeze in six steps. */
export const SQUEEZE = [24.6, 2.5, 0.5, 0.2, 0.1, 0.06];
/** The cold settings of stage 4 (kelvin). */
export const COLD = [200, 220, 240];

/** A real-gas cylinder: its gauge is the van der Waals one, held to the plain gas law beside it. */
const cyl = (id, label, gas, extra = {}) => ({ id, label, gas, n: 1, T: 300, V: 1, hold: 'dial', vdw: true, ...extra });

export const GUESSES = [['less', 'Less than the gas law says'], ['exact', 'Exactly what the gas law says'], ['more', 'More than the gas law says']];

/** The side of the gas law a cylinder reads on, as the card that says so: within two percent is "on" the law. */
export function sideOf(q) {
  const ratio = q.ideal > 0 ? q.P / q.ideal : 1;
  return ratio > 1.02 ? 'more' : ratio < 0.98 ? 'less' : 'exact';
}

/** Stage 3's four cylinders: where each stands, and the tray (above, on or below) the plates put it in. */
export const CASES = [
  { id: 'a', gas: 'He', V: 0.1, T: 300 },
  { id: 'b', gas: 'CO2', V: 0.5, T: 230 },
  { id: 'c', gas: 'N2', V: 24.6, T: 300 },
  { id: 'd', gas: 'NH3', V: 0.5, T: 250 }
];
const TRAY_OF = { more: 'above', exact: 'on', less: 'below' };

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Compression Prediction',
    prompt: 'The gas law predicts helium squeezed to a hundredth of its volume reads a hundred times higher: what does a real gauge read?',
    items: GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Picture the gas squeezed until its particles nearly fill the room: ask whether they can still be treated as points.',
      'Ask whether the gauge could rise by more or by less than the law says when the particles themselves take up room.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'A compression cylinder will now test whether helium deviates from the gas law under high pressure.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 36, y: 30 }, {
      cyls: [cyl('a', 'Holder 13', 'He')], volumes: SQUEEZE, volumeStart: 1, vmax: 24.6, w: 62, trueSize: true,
      show: { temperature: false, amount: false, ideal: true }
    });
    return {
      title: 'High-Pressure Compression',
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'Compress the helium fully, then place the card for how the gauge compares with the gas law.', 'Compress the helium fully, then place the card for how the gauge compares with the gas law.');
      },
      widget,
      table: gasTable({
        pieces: [stmt('less', 'Less than the gas law says', { x: 90, y: 45 }), stmt('exact', 'Exactly what the gas law says', { x: 128, y: 45 }), stmt('more', 'More than the gas law says', { x: 109, y: 57.5 })],
        fixtures: [r],
        zones: { slots: [{ id: 'show', label: 'Prediction', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Turn the Piston dial, then place a card in the slot.',
        'Compare the gauge with the gas law value at minimum volume.',
        'Read the gauge and the gas law figure at the smallest room and see which is larger.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (Math.round(t.fixtures[RIG].dials.volume.value) !== SQUEEZE.length) return { ok: false, notYet: true, msg: 'Compress the cylinder to minimum volume first.' };
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === sideOf(cylRead(t, RIG, 0))) return { ok: true };
        return { ok: false, msg: 'The gauge is not on that side of the gas law value.' };
      },
      get reward() {
        return {
          log: 'Squeezed hard, the gauge reads above the law.',
          title: 'Molecular Volume',
          body: 'At high pressures, helium exerts more pressure than the gas law predicts. Gas particles occupy finite volume themselves, leaving less empty space to move in.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const mk = (c, at) => rig(`r${c.id}`, at, {
      cyls: [cyl(c.id, `Holder ${c.id.toUpperCase()}`, c.gas, { V: c.V, T: c.T, hold: 'V' })], vmax: 24.6, compact: true, w: 44, trueSize: true,
      title: `Holder ${c.id.toUpperCase()}  ${GASES[c.gas].sym}, ${c.V} L, ${c.T} K`,
      show: { volume: false, temperature: false, amount: false, ideal: true }
    });
    const tray = (id, label, y) => ({ id, label, at: { x: 133, y }, size: { w: 30, h: 14 }, cell: 17 });
    return {
      title: 'Deviations from Ideal Behavior',
      prompt: 'Sort each cylinder by whether its gauge reads above, on or below what the gas law says.',
      widget,
      table: gasTable({
        pieces: CASES.map((c, i) => chip(c.id, `HOLDER ${c.id.toUpperCase()}`, { x: 106, y: 10 + i * 14 })),
        fixtures: CASES.map((c, i) => mk(c, { x: 25 + (i % 2) * 48, y: 16.2 + Math.floor(i / 2) * 31.6 })),
        zones: { trays: [tray('above', 'Reads above the law', 11), tray('on', 'Reads on the law', 31), tray('below', 'Reads below the law', 51)] }
      }),
      hints: [
        'Drag each chip into a tray.',
        'Compare each holder\'s gauge with the gas law figure printed under it.',
        'Look at how much room each holder\'s gas has and how cold it is, and compare that with the holder that reads on the law.'
      ],
      check(state) {
        const t = state.table;
        if (!CASES.every(c => ['above', 'on', 'below'].includes(whereIs(t, c.id)))) return { ok: false, notYet: true, msg: 'Place every cylinder in a tray.' };
        const side = c => TRAY_OF[sideOf(cylRead(t, `r${c.id}`, c.id))];
        const bad = CASES.filter(c => whereIs(t, c.id) !== side(c));
        if (bad.length) return { ok: false, msg: `Holder ${bad[0].id.toUpperCase()}'s gauge does not match its tray.` };
        return { ok: true };
      },
      reward: {
        log: 'Compressed gases read above, cold gases below.',
        title: 'Ideal Gas and Real Gas',
        body: 'A gas that strictly follows the gas law is an ideal gas. Real gases deviate under extreme conditions: reading above the law when compressed because particles take up space, and below when cooled because intermolecular forces pull them together.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = rig(RIG, { x: 30, y: 32 }, {
      cyls: [cyl('a', 'Holder A', 'N2', { V: 2, hold: 'V' }), cyl('b', 'Holder B', 'NH3', { V: 2, hold: 'V' }), cyl('c', 'Holder C', 'He', { V: 2, hold: 'V' })],
      temps: COLD, tempList: 'K', tempStart: 1, vmax: 2, compact: true, w: 36, trueSize: true,
      show: { gauge: false, volume: false, temperature: false, amount: false, off: true }
    });
    return {
      title: 'Deviation Comparison',
      prompt: 'Rank the three cold gases on the rail from the one that differs most from the gas law to the one that differs least.',
      widget,
      table: gasTable({
        pieces: [
          ...['a', 'b', 'c'].map(id => chip(id, `HOLDER ${id.toUpperCase()}`, { x: 0, y: 0 })),
          { ...stmt('draw', 'Liquid at (°C): NH₃ −33 N₂ −196 He −269', { x: 100, y: 43 }), hidden: true, fetchFrom: 'drawoff' }
        ],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 108, y: 24 }, size: { w: 66, h: 16 }, first: 'Largest deviation', last: 'Smallest deviation', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } },
        fetch: [{ id: 'drawoff', label: 'Cold Draw-off', at: { x: 130, y: 56 } }]
      }),
      hints: [
        'Turn the Heater dial, then arrange the chips on the rail.',
        'Compare how far each cylinder deviates from the gas law at each temperature.',
        'Work out the gap between each gauge and its gas law figure as a share of that figure.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders on the rail.' };
        const dev = id => { const q = cylRead(t, RIG, id); return Math.abs(q.P - q.ideal) / q.ideal; };
        const want = ['a', 'b', 'c'].sort((x, y) => dev(y) - dev(x));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two adjacent cylinders on the rail are in the wrong order.' };
      },
      reward: {
        log: 'Stronger intermolecular forces cause greater deviation.',
        title: 'Intermolecular Attractions',
        body: 'Stronger attractions between particles cause colder gases to fall further below ideal gas law predictions: ammonia most, nitrogen less, and helium least. These same attractive forces allow gases to condense into liquids.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn the Piston dial,', 'then place a card in the slot.'],
  3: ['Drag each chip into a tray.'],
  4: ['Turn the Heater dial,', 'then arrange the chips on the rail.']
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
      body: 'Real gases deviate from ideal behavior at high pressures due to molecular volume and at low temperatures due to intermolecular attractions. Real gases behave most ideally at low pressures and high temperatures.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Helium is squeezed into a very small room. Compared with the gas law, its gauge reads:',
    options: [
      { id: 'a', label: 'Higher, because its particles take up room themselves' },
      { id: 'b', label: 'Lower, because its particles pull on each other' },
      { id: 'c', label: 'Exactly the same' },
      { id: 'd', label: 'Zero' }
    ],
    answer: 'a',
    explanation: 'The particles are not points: in a very small room the room they fill themselves is a large share of it, so the pressure is higher than the law says.'
  },
  {
    question: 'Carbon dioxide is cooled until it is close to turning liquid. Compared with the gas law, its gauge reads:',
    options: [
      { id: 'a', label: 'Lower, because its particles pull on each other' },
      { id: 'b', label: 'Higher, because it is colder' },
      { id: 'c', label: 'Exactly the same' },
      { id: 'd', label: 'Infinite' }
    ],
    answer: 'a',
    explanation: 'Slow particles are held back by the pull between them, so they push on the walls less than the gas law says.'
  },
  {
    question: 'Under which conditions does a real gas behave most like an ideal gas?',
    options: [
      { id: 'a', label: 'Low pressure and high temperature' },
      { id: 'b', label: 'High pressure and low temperature' },
      { id: 'c', label: 'High pressure and high temperature' },
      { id: 'd', label: 'Low pressure and low temperature' }
    ],
    answer: 'a',
    explanation: 'The particles are then far apart and moving too fast for their pulls to matter.'
  },
  {
    question: 'Which gas strays furthest from the gas law when cold: helium, nitrogen or ammonia?',
    options: [
      { id: 'a', label: 'Ammonia, whose particles pull hardest on each other' },
      { id: 'b', label: 'Nitrogen' },
      { id: 'c', label: 'Helium' },
      { id: 'd', label: 'They stray equally' }
    ],
    answer: 'a',
    explanation: 'The stronger the pull between particles, the further a cold gas strays below the law.'
  },
  {
    question: 'An ideal gas has particles that take up no room and pull on nothing. What would happen if one were cooled for ever?',
    options: [
      { id: 'a', label: 'It would stay a gas' },
      { id: 'b', label: 'It would turn into a liquid' },
      { id: 'c', label: 'It would turn solid at once' },
      { id: 'd', label: 'It would explode' }
    ],
    answer: 'a',
    explanation: 'Without any pull between its particles, nothing could hold them together as a liquid.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('exact', 'slot:predict')],
  [dial(RIG, 'volume', 6), put('more', 'slot:show')],
  [...sort({ a: 'above', b: 'below', c: 'on', d: 'below' })],
  [{ fetch: 'drawoff' }, dial(RIG, 'temp', 1), dial(RIG, 'temp', 3), put('b', 'rail:0'), put('a', 'rail:1'), put('c', 'rail:2')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(RIG, 'volume', 6), put('exact', 'slot:show')],
  [...sort({ a: 'on', b: 'below', c: 'on', d: 'below' })],
  [put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2')]
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
export { rigAt, cylRead, GASES };
