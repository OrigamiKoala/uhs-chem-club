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
    title: 'Guess the Squeeze',
    prompt: 'The gas law says helium squeezed to a hundredth of its room reads a hundred times higher: what does a real gauge read?',
    items: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Picture the particles of the gas crowded together in almost no room.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    reward: {
      log: 'Prediction locked in.',
      title: 'A Guess Worth Testing',
      body: 'A cylinder that prints its gauge beside the figure the gas law gives is about to be set out, with a piston that squeezes harder than any before.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 36, y: 30 }, {
      cyls: [cyl('a', 'Holder 13', 'He')], volumes: SQUEEZE, volumeStart: 1, vmax: 24.6, w: 62, trueSize: true,
      show: { temperature: false, amount: false, ideal: true }
    });
    return {
      title: 'Squeezed Hard',
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'squeeze the helium as far as the piston goes, then lay the card for how its gauge compares with the gas law.', 'Squeeze the helium as far as the piston goes, then lay the card for how its gauge compares with the gas law.');
      },
      widget,
      table: gasTable({
        pieces: [stmt('less', 'Less than the gas law says', { x: 90, y: 45 }), stmt('exact', 'Exactly what the gas law says', { x: 128, y: 45 }), stmt('more', 'More than the gas law says', { x: 109, y: 57.5 })],
        fixtures: [r],
        zones: { slots: [{ id: 'show', label: 'The gauge, against the law', at: { x: 109, y: 27 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Use the "Piston" dial, then lay a card in the slot.',
        'Compare the gauge with the figure the gas law says at the smallest room.',
        'Lay the card that says which side of the gas law\'s figure the gauge is on.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (Math.round(t.fixtures[RIG].dials.volume.value) !== SQUEEZE.length) return { ok: false, notYet: true, msg: 'Squeeze the helium as far as the piston goes first.' };
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card.id === sideOf(cylRead(t, RIG, 0))) return { ok: true };
        return { ok: false, msg: 'The gauge is not on the side of the gas law\'s figure that card says.' };
      },
      get reward() {
        const g = guessOf(QUEST_KEY, GUESSES);
        const verdict = !g ? '' : g.id === 'more' ? 'You predicted this one, and the gauge agreed. ' : 'The gauge did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'Squeezed hard, the gauge reads above the law.',
          title: 'Particles Take Room',
          body: `${verdict}Squeezed hard, helium reads more than the gas law says, because its particles are not points: they take up room themselves, so there is less room left for them to move in.`,
          model: {
            type: 'gas',
            boxes: [{ label: 'Roomy', w: 3.4, parts: [{ kind: 'He', n: 12 }] }, { label: 'Squeezed', w: 1.0, h: 1.0, d: 1.0, parts: [{ kind: 'He', n: 12 }] }],
            caption: 'The same 12 particles in a roomy vessel and in a squeezed one. Not to scale.'
          }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const mk = (id, at, cases) => rig(id, at, {
      cyls: cases.map(c => cyl(c.id, `Holder ${c.id.toUpperCase()}`, c.gas, { V: c.V, T: c.T, hold: 'V' })), vmax: 24.6, compact: true, w: 44, trueSize: true,
      show: { temperature: true, amount: false, ideal: true }
    });
    const tray = (id, label, y) => ({ id, label, at: { x: 133, y }, size: { w: 30, h: 14 }, cell: 17 });
    return {
      title: 'Which Side of the Law',
      prompt: 'Sort each cylinder by whether its gauge reads above, on or below what the gas law says.',
      widget,
      table: gasTable({
        pieces: CASES.map((c, i) => chip(c.id, `HOLDER ${c.id.toUpperCase()}`, { x: 106, y: 10 + i * 14 })),
        fixtures: [mk('r1', { x: 25, y: 32 }, CASES.slice(0, 2)), mk('r2', { x: 73, y: 32 }, CASES.slice(2))],
        zones: { trays: [tray('above', 'Reads above the law', 11), tray('on', 'Reads on the law', 31), tray('below', 'Reads below the law', 51)] }
      }),
      hints: [
        'Use the three trays.',
        'Compare each cylinder\'s gauge with the figure printed as the gas law\'s, side by side.',
        'A cylinder goes in the first tray if its gauge is the larger figure, and in the last if it is the smaller.'
      ],
      check(state) {
        const t = state.table;
        if (!CASES.every(c => ['above', 'on', 'below'].includes(whereIs(t, c.id)))) return { ok: false, notYet: true, msg: 'Put every cylinder in a tray.' };
        const side = c => TRAY_OF[sideOf(cylRead(t, c.id === 'a' || c.id === 'b' ? 'r1' : 'r2', c.id))];
        const bad = CASES.filter(c => whereIs(t, c.id) !== side(c));
        if (bad.length) return { ok: false, msg: `Holder ${bad[0].id.toUpperCase()}'s gauge and the gas law's figure do not fit the tray it is in.` };
        return { ok: true };
      },
      reward: {
        log: 'Squeezed gases read above, cold gases below.',
        title: 'Ideal Gas, Real Gas',
        body: 'A gas that always follows the gas law is called an ideal gas, and real gases stray from it: above it when squeezed, because their particles take up room, and below it when cold, because their particles pull on each other. Only a thin, warm gas stays on the law.'
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
      title: 'Who Strays Furthest',
      prompt: 'Rank the three cold gases from the one that strays furthest from the gas law to the one that strays least.',
      widget,
      table: gasTable({
        pieces: [
          ...['a', 'b', 'c'].map(id => chip(id, `HOLDER ${id.toUpperCase()}`, { x: 0, y: 0 })),
          { ...stmt('draw', 'Liquid at (°C): NH₃ −33 N₂ −196 He −269', { x: 100, y: 43 }), hidden: true, fetchFrom: 'drawoff' }
        ],
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 108, y: 24 }, size: { w: 66, h: 16 }, first: 'Strays furthest', last: 'Strays least', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } },
        fetch: [{ id: 'drawoff', label: 'Cold Draw-off', at: { x: 130, y: 56 } }]
      }),
      hints: [
        'Use the "Heater" dial, and drag the chips along the strip.',
        'Compare how far each cylinder sits off the law, whichever side it is on, at each setting.',
        'Put first the cylinder that sits furthest off the law at every setting of the dial.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders on the strip.' };
        const dev = id => { const q = cylRead(t, RIG, id); return Math.abs(q.P - q.ideal) / q.ideal; };
        const want = ['a', 'b', 'c'].sort((x, y) => dev(y) - dev(x));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two neighbouring cylinders on the strip are the wrong way round.' };
      },
      reward: {
        log: 'The stronger the pull, the further a gas strays.',
        title: 'Strong Pulls Stray Furthest',
        body: 'The harder a gas\'s particles pull on one another, the further its gauge falls below the gas law when it is cold: ammonia most, nitrogen less, helium hardly at all. The same pull is what lets a cold gas turn into a liquid.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag one card into the slot.'],
  2: ['Turn the Piston dial,', 'then drag a card into the slot.'],
  3: ['Drag each chip into a tray.'],
  4: ['Turn the Heater dial,', 'then drag the chips along the strip.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'A real gas reads above the gas law where its particles crowd, and below it where they cling, so it is closest to ideal when it is thin and warm. The same pull that holds it back is what turns it into a liquid.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every pressure vessel on the cloud deck is designed with this in mind. The gas law is a very good first answer, and now you know exactly where it stops being one.'
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
