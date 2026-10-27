/**
 * Unit 5 · Bench 6 — Entropy (q6-entropy)
 *
 * The silencer bay, where steam expands, on the heat kit (`table/kits/heat.js`). A chamber of cells that is shaken, boxes of particles to
 * rank, and equations to sort by the room they leave. Four stages and ONE click: the belief that a gas has to be pushed to spread out, or
 * that "entropy" means mess.
 *
 *   1  PREDICT: four particles, the wall opens, the box is shaken again and again: where are they most often?
 *   2  TEST: shake the chamber and read the bars                   -> entropy (the number of ways)
 *   3  four changes sorted by whether the particles get more room or less   -> the sign of the entropy change
 *   4  four boxes of the same twelve particles ranked by their room and their motion  -> solid, liquid, gas, and warming
 *
 * THE WRONG MODEL IS ON THE TABLE. "Back in the left half" and "pulled into the right half" are cards beside "spread over both halves";
 * the bars count each shake, and the spread-out arrangements outnumber the crowded ones sixty-eight to two. Nothing pushes. The chamber
 * is a glass box with the beads of the last shake in it at `3D On`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, phaseCard, stmt, tag, note, chamberFixture, shakesOf, whereIs, waysOf
} from '../../table/kits/heat.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bentropy\b/i, introducedAt: 2 },
  { term: /ΔS/, introducedAt: 3 }
];

/** A shaken chamber is Bellows' gas; a lagged cup is this world's first bench. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const QUEST_KEY = 'unit05/q6-entropy';
const GUESS_LABEL = { left: '"Back in the left half"', spread: '"Spread over both halves"', right: '"Pulled into the right half"' };

/** Arrangements of four particles in eight cells: 70 in all, 2 with every particle in one half. */
const TOTAL_WAYS = waysOf(8, 4);
const CROWDED_WAYS = 2;

/** How many of the shakes so far left `n` particles in the left half. */
const tally = (t, n) => shakesOf(t, 'chamber').filter(s => s.filter(c => c <= 4).length === n).length;

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Where Will They Stand?',
    // A PREDICT STAGE: the chamber is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'A box of four particles opens onto an empty half, and is shaken again and again: where will they be most often?',
    widget,
    table: heatTable({
      pieces: [
        note('left', 'Back in the left half', { x: 24, y: 16 }),
        note('spread', 'Spread over both halves', { x: 70, y: 16 }),
        note('right', 'Pulled into the right half', { x: 116, y: 16 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 70, y: 44 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Picture the particles starting in the left half with a shut wall, and the wall then opening.',
      'Commit to the card you expect based on how particles distribute randomly.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, shake the chamber repeatedly to record where the particles distribute.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-shake',
    title: 'Shake and Count',
    prompt: 'Shake the chamber repeatedly, then place the card for where particles occur most often.',
    widget,
    table: heatTable({
      pieces: [
        tag('left', 'Back in the left half', { x: 84, y: 57.4 }),
        tag('spread', 'Spread over both halves', { x: 110, y: 57.4 }),
        tag('right', 'Pulled into the right half', { x: 136, y: 57.4 })
      ],
      fixtures: [chamberFixture('chamber', { x: 45, y: 27 }, { cells: 8, particles: 4, title: 'Open chamber of 8 cells' })],
      zones: { slots: [{ id: 'answer', label: 'Most often', at: { x: 118, y: 28 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the "Shake" key, the bars under the chamber and the slot.',
      'Compare how tall each bar stands after many shakes.',
      'Random distribution makes the most probable configurations occur with the highest frequency.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (card.id === 'spread') return { ok: true };
      const k = shakesOf(t, 'chamber').length;
      if (k < 10) return { ok: false, msg: `The bars have counted only ${k} shakes so far.` };
      return card.id === 'left'
        ? { ok: false, msg: `The bar for all four in the left half stands at ${tally(t, 4)} of ${k} shakes.` }
        : { ok: false, msg: `The bar for none in the left half stands at ${tally(t, 0)} of ${k} shakes.` };
    },
    reward: {
      log: 'Spread out turned up almost every time.',
      title: 'Entropy',
      body: `Spread-out arrangements outnumber concentrated ones, with ${TOTAL_WAYS - CROWDED_WAYS} of ${TOTAL_WAYS} possible configurations. The measure of the number of microstates available to a system is its entropy, which increases as particles disperse.`,
      model: { type: 'box', cells: 8, filled: [1, 3, 6, 8], gate: 4, caption: 'Four particles spread over a box of eight cells, with the wall open.' }
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-room',
    title: 'More Room or Less?',
    prompt: 'Sort each change by whether it gives the particles more ways to arrange or fewer.',
    widget,
    table: heatTable({
      pieces: [
        stmt('melt', 'Ice melting', { x: 22, y: 14 }),
        stmt('lime', 'CaCO₃(s) → CaO(s) + CO₂(g)', { x: 58, y: 14 }),
        stmt('haber', 'N₂(g) + 3 H₂(g) → 2 NH₃(g)', { x: 94, y: 14 }),
        stmt('dew', 'Steam condensing', { x: 130, y: 14 })
      ],
      zones: {
        trays: [
          { id: 'more', label: 'More ways to arrange', at: { x: 40, y: 46 }, size: { w: 56, h: 22 }, cell: 36, cellH: 11 },
          { id: 'fewer', label: 'Fewer ways to arrange', at: { x: 110, y: 46 }, size: { w: 56, h: 22 }, cell: 36, cellH: 11 }
        ]
      }
    }),
    hints: [
      'Use the four cards and the two trays.',
      'Compare the free-moving gas and liquid on the two sides of each change.',
      'States with greater freedom of motion have higher entropy, with gases having significantly higher entropy than liquids or solids.'
    ],
    check(state) {
      const t = state.table;
      const want = { melt: 'more', lime: 'more', haber: 'fewer', dew: 'fewer' };
      if (Object.keys(want).some(k => !['more', 'fewer'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every change needs a tray.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      return { ok: false, msg: `${t.pieces[wrong[0]].label} does not belong in the "${t.zones.trays[whereIs(t, wrong[0])].label}" tray.` };
    },
    reward: {
      log: 'Gas decided the sign.',
      title: 'Room and the Sign of ΔS',
      body: 'Processes that increase particle dispersal or produce gas increase entropy, giving a positive entropy change (ΔS). Conversely, processes that constrain particles or consume gas result in a negative ΔS.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-rank',
    title: 'Room and Motion',
    prompt: 'Order the four boxes from the fewest ways to arrange the particles to the most.',
    widget,
    table: heatTable({
      pieces: [
        phaseCard('ice', 'Ice, −10 °C', { x: 0, y: 0 }, 'solid', {}, -10),
        phaseCard('cold', 'Water, 10 °C', { x: 0, y: 0 }, 'liquid', {}, 10),
        phaseCard('hot', 'Water, 80 °C', { x: 0, y: 0 }, 'liquid', {}, 80),
        phaseCard('steam', 'Steam, 110 °C', { x: 0, y: 0 }, 'gas', {}, 110)
      ],
      zones: { rail: { at: { x: 75, y: 36 }, size: { w: 134, h: 26 }, first: 'Fewest ways', last: 'Most ways', items: ['ice', 'cold', 'hot', 'steam'], start: ['hot', 'steam', 'ice', 'cold'] } }
    }),
    hints: [
      'Use the four boxes and the rail.',
      'Compare how much room each particle has and how long its streak is in each box.',
      'Both spatial dispersion across phases and increased thermal motion increase the available microstates.'
    ],
    check(state) {
      const order = state.table.zones.rail.order;
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four boxes on the rail.' };
      const want = ['ice', 'cold', 'hot', 'steam'];
      if (order.join() === want.join()) return { ok: true };
      const t = state.table;
      const j = order.findIndex((id, i) => i > 0 && want.indexOf(order[i - 1]) > want.indexOf(id));
      return { ok: false, msg: `"${t.pieces[order[j - 1]].label}" and "${t.pieces[order[j]].label}" are in the wrong order.` };
    },
    reward: {
      log: 'Room and motion both added ways.',
      title: 'Solid, Liquid, Gas, and Warming',
      body: 'For a substance, entropy increases from solid to liquid to gas as spatial microstates increase. Increasing temperature also increases entropy because thermal energy can be distributed across more accessible energy levels.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Press "Shake" again and again;', 'drag a card into the slot.'],
  3: ['Drag each change into a tray.'],
  4: ['Drag the boxes along the rail into order.']
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
      body: 'Entropy quantifies the number of accessible microstates in a system. Dispersal occurs spontaneously because dispersed states are statistically far more numerous, and entropy increases with phase transitions (solid to liquid to gas) and temperature.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which has the greatest entropy per mole at the same temperature?',
    options: [
      { id: 'a', label: 'H₂O(g)' },
      { id: 'b', label: 'H₂O(l)' },
      { id: 'c', label: 'H₂O(s)' }
    ],
    answer: 'a',
    explanation: 'A gas has the most freedom of position, so it has the most microstates and the greatest entropy.'
  },
  {
    question: 'What is the sign of ΔS° for 2 SO₂(g) + O₂(g) → 2 SO₃(g)?',
    options: [
      { id: 'a', label: 'Negative, because three moles of gas become two' },
      { id: 'b', label: 'Positive, because a new compound forms' },
      { id: 'c', label: 'Zero, because every substance is a gas' }
    ],
    answer: 'a',
    explanation: 'The reaction uses up gas, so there are fewer places for the particles to be and entropy falls.'
  },
  {
    question: 'N₂(g) + 3 H₂(g) → 2 NH₃(g). With S° of 191.6, 130.7 and 192.8 J/(mol·K), what is ΔS°?',
    options: [
      { id: 'a', label: '−198.1 J/(mol·K)' },
      { id: 'b', label: '+198.1 J/(mol·K)' },
      { id: 'c', label: '−390.9 J/(mol·K)' },
      { id: 'd', label: '+583.7 J/(mol·K)' }
    ],
    answer: 'a',
    explanation: 'Products are 2 × 192.8 = 385.6 and reactants are 191.6 + 3 × 130.7 = 583.7, so ΔS° is 385.6 − 583.7 = −198.1.'
  },
  {
    question: 'Why does a substance’s entropy rise when it is heated at constant phase?',
    options: [
      { id: 'a', label: 'Its energy can be shared among a wider range of speeds, spins and vibrations' },
      { id: 'b', label: 'Its particles move to fixed positions in a crystal' },
      { id: 'c', label: 'Its particles become fewer in number' }
    ],
    answer: 'a',
    explanation: 'A larger range of possible motions means more microstates, and entropy counts microstates.'
  },
  {
    question: 'Which change has a negative ΔS?',
    options: [
      { id: 'a', label: 'Freezing liquid water' },
      { id: 'b', label: 'Boiling liquid water' },
      { id: 'c', label: 'Dissolving sodium chloride in water' },
      { id: 'd', label: 'Dry ice turning into gas' }
    ],
    answer: 'a',
    explanation: 'Freezing locks mobile molecules into a crystal, which leaves them fewer arrangements; the other changes free particles.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));
const shakes = n => Array.from({ length: n }, () => ({ run: 'chamber' }));

export const SOLUTIONS = [
  [put('spread', 'slot:guess')],
  [...shakes(30), put('spread', 'slot:answer')],
  [...sort({ melt: 'more', lime: 'more', haber: 'fewer', dew: 'fewer' })],
  [put('ice', 'rail:0'), put('cold', 'rail:1'), put('hot', 'rail:2'), put('steam', 'rail:3')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [...shakes(30), put('left', 'slot:answer')],
  [...sort({ melt: 'fewer', lime: 'more', haber: 'fewer', dew: 'fewer' })],
  [put('hot', 'rail:0'), put('ice', 'rail:1'), put('cold', 'rail:2'), put('steam', 'rail:3')]
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

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { TOTAL_WAYS, CROWDED_WAYS };
export { shakesOf, waysOf };
