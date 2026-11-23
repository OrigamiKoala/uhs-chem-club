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

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, phaseCard, stmt, shiftCard, tag, note, leadFixture, rxnFixture, chamberFixture, shakesOf, whereIs, waysOf, plaqueFixture, markerFixture, markerRead, FORMATION_TABLE, fixed
} from '../../table/kits/heat.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bentropy\b/i, introducedAt: 3 },
  { term: /ΔS/, introducedAt: 3 }
];

/** A shaken chamber is Bellows' gas; a lagged cup is this world's first bench. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const QUEST_KEY = 'unit05/q6-entropy';
const GUESS_LABEL = { left: '"All in the left half"', spread: '"Spread over both halves"', right: '"All in the right half"' };

/** Arrangements of four particles in eight cells: 70 in all, 2 with every particle in one half. */
const TOTAL_WAYS = waysOf(8, 4);
const CROWDED_WAYS = 2;

/** How many of the shakes so far left `n` particles in the left half. */
const tally = (t, n) => shakesOf(t, 'chamber').filter(s => s.filter(c => c <= 4).length === n).length;

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
const S0 = id => FORMATION_TABLE[id].S0;
// Stage 5: CaCO3(s) -> CaO(s) + CO2(g), products less reactants.
const DS_LIME = S0('CaO(s)') + S0('CO2(g)') - S0('CaCO3(s)');

/** Stage 3: the entropy table's figure for each change, before and after (J/(mol·K)). */
const SORT_S0 = {
  melt: [S0('H2O(s)'), S0('H2O(l)')],
  lime: [S0('CaCO3(s)'), S0('CaO(s)') + S0('CO2(g)')],
  haber: [S0('N2(g)') + 3 * S0('H2(g)'), 2 * S0('NH3(g)')],
  dew: [S0('H2O(g)'), S0('H2O(l)')]
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Where Will They End Up?',
    // A PREDICT STAGE: the chamber is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'When four particles in the left half are freed into the whole box and shaken many times, where do they end up most often?',
    widget,
    table: heatTable({
      pieces: [
        note('left', 'All in the left half', { x: 24, y: 16 }),
        note('spread', 'Spread across both halves', { x: 70, y: 16 }),
        note('right', 'All in the right half', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'shut', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Watch the clip showing four particles moving randomly in the left half behind a wall.',
      'Once the wall opens, nothing pulls any particle toward either side.',
      'Compare how many ways all four particles can land on the left versus how many ways they can split between both halves.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the four particles is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-shake',
    title: 'Shake and Count',
    briefing: { speaker: SPEAKER, body: 'Each shake drops the four particles randomly into four of the eight cells. The bar chart counts how many particles landed in the left half on each shake.' },
    prompt: 'After many shakes, where are the four particles found most often?',
    widget,
    table: heatTable({
      pieces: [
        tag('left', 'All in the left half', { x: 84, y: 57.4 }),
        tag('spread', 'Spread across both halves', { x: 110, y: 57.4 }),
        tag('right', 'All in the right half', { x: 136, y: 57.4 })
      ],
      fixtures: [chamberFixture('chamber', { x: 45, y: 27 }, { cells: 8, particles: 4, title: 'Open box of 8 cells' })],
      zones: { slots: [{ id: 'answer', label: 'Most often', at: { x: 118, y: 28 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Press "Shake" at least 10 times and watch the bars grow under the box.',
      'Compare bar 4 (all four on the left) with bars 1, 2, and 3 (split across both halves).',
      'Every individual arrangement is equally likely, so outcomes with more possible arrangements happen more often.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      const k = shakesOf(t, 'chamber').length;
      if (k < 10) return { ok: false, notYet: true, msg: `You have only shaken ${k} times so far; shake at least 10 times.` };
      if (card.id === 'spread') return { ok: true };
      return card.id === 'left'
        ? { ok: false, msg: `All four landed in the left half on only ${tally(t, 4)} of ${k} shakes.` }
        : { ok: false, msg: `All four landed in the right half on only ${tally(t, 0)} of ${k} shakes.` };
    },
    reward: {
      log: 'The particles almost always ended up spread across both halves.',
      title: 'More Ways to Spread Out',
      body: `Four particles fit into eight cells in ${TOTAL_WAYS} ways, and only ${CROWDED_WAYS} put all four in one half. Particles spread out because there are far more spread-out arrangements.`
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-room',
    title: 'More Ways or Fewer?',
    briefing: { speaker: SPEAKER, body: 'Entropy (S) measures how many ways a sample\'s particles can be arranged: more ways means higher entropy. An entropy change is written ΔS, which is positive when entropy rises.' },
    prompt: 'Which changes increase entropy, and which decrease it?',
    widget,
    table: heatTable({
      pieces: [
        shiftCard('melt', 'Ice melting', { x: 22, y: 13 }, { before: [['solid', 4]], after: [['liquid', 4]] }),
        shiftCard('lime', 'CaCO₃ → CaO + CO₂', { x: 58, y: 13 }, { before: [['solid', 2]], after: [['solid', 2], ['gas', 2]] }),
        shiftCard('haber', 'N₂ + 3 H₂ → 2 NH₃', { x: 94, y: 13 }, { before: [['gas', 4]], after: [['gas', 2]] }),
        shiftCard('dew', 'Steam condensing', { x: 130, y: 13 }, { before: [['gas', 4]], after: [['liquid', 4]] })
      ],
      zones: {
        trays: [
          { id: 'more', label: 'Entropy rises', at: { x: 37, y: 46 }, size: { w: 72, h: 24 }, cell: 35, cellH: 21 },
          { id: 'fewer', label: 'Entropy falls', at: { x: 113, y: 46 }, size: { w: 72, h: 24 }, cell: 35, cellH: 21 }
        ]
      }
    }),
    hints: [
      'Compare the before and after particle pictures on each card.',
      'Check whether the particles move more freely after the change, and whether more or fewer gas particles are present.',
      'Gas particles have far more possible arrangements than the same particles packed into a liquid or solid.'
    ],
    check(state) {
      const t = state.table;
      const want = { melt: 'more', lime: 'more', haber: 'fewer', dew: 'fewer' };
      if (Object.keys(want).some(k => !['more', 'fewer'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Sort all four changes into the trays.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const card = t.pieces[wrong[0]];
      const gasOf = g => g.filter(([ph]) => ph === 'gas').reduce((s, [, n]) => s + n, 0);
      const gb = gasOf(card.props.before || []);
      const ga = gasOf(card.props.after || []);
      const detail = gb !== ga
        ? `it goes from ${gb} spread-out particle${gb === 1 ? '' : 's'} to ${ga}`
        : `it changes from ${card.props.before?.[0]?.[0]} to ${card.props.after?.[0]?.[0]}`;
      return { ok: false, msg: `"${card.label}" is in "${t.zones.trays[whereIs(t, wrong[0])].label}", even though ${detail}.` };
    },
    reward: {
      log: 'Freeing particles into liquid or gas raised entropy.',
      title: 'Entropy and the Sign of ΔS',
      body: 'Melting and producing gas give particles more possible arrangements, so entropy rises (ΔS > 0). Condensing and consuming gas reduce arrangements, so ΔS < 0.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-rank',
    title: 'Volume and Motion',
    prompt: 'Rank the four boxes from lowest entropy to highest entropy.',
    widget,
    table: heatTable({
      pieces: [
        phaseCard('ice', 'Ice', { x: 0, y: 0 }, 'solid', {}, -10),
        phaseCard('cold', 'Cold water', { x: 0, y: 0 }, 'liquid', {}, 10),
        phaseCard('hot', 'Hot water', { x: 0, y: 0 }, 'liquid', {}, 80),
        phaseCard('steam', 'Steam', { x: 0, y: 0 }, 'gas', {}, 110)
      ],
      zones: { rail: { at: { x: 75, y: 36 }, size: { w: 134, h: 26 }, first: 'Lowest entropy', last: 'Highest entropy', items: ['ice', 'cold', 'hot', 'steam'], start: ['hot', 'steam', 'ice', 'cold'] } }
    }),
    hints: [
      'Notice how tightly the particles are packed and how quickly they move in each box.',
      'Compare the two liquid water boxes, which differ only in temperature.',
      'More space gives particles more positions, and higher temperature gives them more ways to distribute their energy.'
    ],
    check(state) {
      const order = state.table.zones.rail.order;
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Place all four boxes on the rail.' };
      const want = ['ice', 'cold', 'hot', 'steam'];
      if (order.join() === want.join()) return { ok: true };
      const t = state.table;
      const j = order.findIndex((id, i) => i > 0 && want.indexOf(order[i - 1]) > want.indexOf(id));
      const left = t.pieces[order[j - 1]];
      const right = t.pieces[order[j]];
      return { ok: false, msg: `"${left.label}" (${left.props.phase}, ${left.props.T} °C) is left of "${right.label}" (${right.props.phase}, ${right.props.T} °C); compare their phase and temperature.` };
    },
    reward: {
      log: 'Both phase and temperature increased entropy.',
      title: 'Solid, Liquid, Gas, and Warming',
      body: 'Entropy increases from solid to liquid to gas because particles have more space to occupy. Warming a sample also raises entropy because faster particles can share energy in more ways.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-table',
    title: 'Entropy From a Table',
    briefing: {
      speaker: SPEAKER,
      body: 'Standard tables list the entropy of one mole of each substance. A reaction\'s ΔS equals the total entropy of its products minus the total entropy of its reactants.',
      worked: [
        'N₂(g) + 3 H₂(g) → 2 NH₃(g)',
        `S of one mole, in J/(mol·K): N₂ ${S0('N2(g)')}, H₂ ${S0('H2(g)')}, NH₃ ${S0('NH3(g)')}`,
        `Products: 2 × ${S0('NH3(g)')} = ${fixed(2 * S0('NH3(g)'), 1)}`,
        `Reactants: ${S0('N2(g)')} + 3 × ${S0('H2(g)')} = ${fixed(S0('N2(g)') + 3 * S0('H2(g)'), 1)}`,
        `ΔS = ${fixed(2 * S0('NH3(g)'), 1)} − ${fixed(S0('N2(g)') + 3 * S0('H2(g)'), 1)} = ${fixed(2 * S0('NH3(g)') - S0('N2(g)') - 3 * S0('H2(g)'), 1)} J/(mol·K)`
      ]
    },
    prompt: 'What is the entropy change (ΔS) for CaCO₃(s) → CaO(s) + CO₂(g)?',
    entry: { id: 'dS', label: 'Entropy change ΔS', unit: 'J/(mol·K)' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('s0', 'Standard entropy, J/(mol·K)', { x: 46, y: 30 }, [
          `CaCO₃(s)    ${S0('CaCO3(s)')}`,
          `CaO(s)    ${S0('CaO(s)')}`,
          `CO₂(g)    ${S0('CO2(g)')}`
        ], { w: 72 }),
        rxnFixture('atoms', { x: 116, y: 30 }, { lhs: [[1, 'CaCO₃']], rhs: [[1, 'CaO'], [1, 'CO₂']], w: 52, h: 34 })
      ]
    }),
    hints: [
      'Read the standard entropy of all three substances on the reference plate.',
      'Group the values into products (right of the arrow) and reactants (left of the arrow).',
      'Follow the worked example: here every coefficient is 1, so subtract the reactant entropy from the sum of the products.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'dS');
      if (v == null || Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Enter the entropy change in J/(mol·K).' };
      if (Math.abs(v - DS_LIME) <= 2) return { ok: true };
      if (Math.abs(v - (S0('CaO(s)') + S0('CO2(g)'))) <= 3) return { ok: false, msg: `${v} J/(mol·K) is the entropy of the right side alone, leaving CaCO₃ out.` };
      return { ok: false, msg: `${v} J/(mol·K) is too ${v > DS_LIME ? 'high' : 'low'}; compare the right side of the arrow with the left side.` };
    },
    reward: {
      log: 'ΔS for breaking down limestone is +160.2 J/(mol·K).',
      title: 'ΔS From the Table',
      body: 'ΔS = (38.1 + 213.8) − 91.7 = +160.2 J/(mol·K). Note that ΔS is measured in joules (J), not kilojoules (kJ).'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag your prediction into the slot.'],
  2: ['Press "Shake" at least 10 times;', 'then drag a card into the slot.'],
  3: ['Drag each change into a tray.'],
  4: ['Drag the boxes into order along the rail.'],
  5: ['Type your answer in the box below.']
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
      body: 'Particles spread out because spread-out arrangements vastly outnumber crowded ones. Entropy (S) counts these arrangements: it rises from solid to liquid to gas and increases with temperature, and a reaction\'s ΔS equals products minus reactants.'
    }
  ]
};

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
  [put('ice', 'rail:0'), put('cold', 'rail:1'), put('hot', 'rail:2'), put('steam', 'rail:3')],
  [{ type: { entry: 'dS', value: '160.2' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [...shakes(30), put('left', 'slot:answer')],
  [...sort({ melt: 'fewer', lime: 'more', haber: 'fewer', dew: 'fewer' })],
  [put('hot', 'rail:0'), put('ice', 'rail:1'), put('cold', 'rail:2'), put('steam', 'rail:3')],
  [{ type: { entry: 'dS', value: '250' } }]
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
    onLoad(r) {
      if (r.index === 1) {
        const g = recall(QUEST_KEY);
        if (g && GUESS_LABEL[g]) r.frame.note(`You predicted: ${GUESS_LABEL[g]}. Shake the chamber to test it.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { TOTAL_WAYS, CROWDED_WAYS, DS_LIME };
export { shakesOf, waysOf };
