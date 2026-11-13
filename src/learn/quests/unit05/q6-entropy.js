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
    title: 'Where Will They Stand?',
    // A PREDICT STAGE: the chamber is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Four particles in the left half of a box are let into the whole box: where will they be found most often?',
    widget,
    table: heatTable({
      pieces: [
        note('left', 'All in the left half', { x: 24, y: 16 }),
        note('spread', 'Spread over both halves', { x: 70, y: 16 }),
        note('right', 'All in the right half', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'shut', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Watch the clip: four particles moving at random in the left half, behind a wall.',
      'When the wall is taken away, nothing pulls a particle towards either side.',
      'Think about how many ways four particles can all be on the left, and how many ways they can be split between the two halves.'
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
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the four particles is recorded. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-shake',
    title: 'Shake and Count',
    briefing: { speaker: SPEAKER, body: 'Each shake puts the four particles in four of the eight cells at random. The bars count how many particles were in the left half after each shake.' },
    prompt: 'After many shakes, where are the four particles found most often?',
    widget,
    table: heatTable({
      pieces: [
        tag('left', 'All in the left half', { x: 84, y: 57.4 }),
        tag('spread', 'Spread over both halves', { x: 110, y: 57.4 }),
        tag('right', 'All in the right half', { x: 136, y: 57.4 })
      ],
      fixtures: [chamberFixture('chamber', { x: 45, y: 27 }, { cells: 8, particles: 4, title: 'Open box of 8 cells' })],
      zones: { slots: [{ id: 'answer', label: 'Most often', at: { x: 118, y: 28 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Press "Shake" at least twenty times and watch the bars under the box grow.',
      'Compare the bar for all four on the left with the bars for one, two or three on the left.',
      'Every single arrangement is as likely as any other, so a result that can be made in more ways turns up more often.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      const k = shakesOf(t, 'chamber').length;
      if (k < 10) return { ok: false, notYet: true, msg: `The bars have counted only ${k} shakes so far: shake at least ten times.` };
      if (card.id === 'spread') return { ok: true };
      return card.id === 'left'
        ? { ok: false, msg: `The bar for all four in the left half stands at ${tally(t, 4)} of ${k} shakes.` }
        : { ok: false, msg: `The bar for none in the left half stands at ${tally(t, 0)} of ${k} shakes.` };
    },
    reward: {
      log: 'Spread out turned up almost every time.',
      title: 'More Ways to Be Spread Out',
      body: `Four particles can be placed in eight cells in ${TOTAL_WAYS} ways, and only ${CROWDED_WAYS} of those have them all in one half. The particles end up spread out because there are far more spread-out arrangements.`
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-room',
    title: 'More Ways or Fewer?',
    briefing: { speaker: SPEAKER, body: 'Entropy, S, counts the ways the particles of a sample and their energy can be arranged: the more ways, the higher the entropy. A change in entropy is written ΔS, and it is positive when the entropy goes up.' },
    prompt: 'Which changes raise the entropy, and which lower it?',
    widget,
    table: heatTable({
      pieces: [
        shiftCard('melt', 'Ice melting', { x: 22, y: 15 }, { before: [['solid', 4]], after: [['liquid', 4]] }),
        shiftCard('lime', 'CaCO₃ → CaO + CO₂', { x: 58, y: 15 }, { before: [['solid', 2]], after: [['solid', 2], ['gas', 2]] }),
        shiftCard('haber', 'N₂ + 3 H₂ → 2 NH₃', { x: 94, y: 15 }, { before: [['gas', 4]], after: [['gas', 2]] }),
        shiftCard('dew', 'Steam condensing', { x: 130, y: 15 }, { before: [['gas', 4]], after: [['liquid', 4]] })
      ],
      zones: {
        trays: [
          { id: 'more', label: 'Entropy rises', at: { x: 40, y: 46 }, size: { w: 56, h: 22 }, cell: 36, cellH: 11 },
          { id: 'fewer', label: 'Entropy falls', at: { x: 110, y: 46 }, size: { w: 56, h: 22 }, cell: 36, cellH: 11 }
        ]
      }
    }),
    hints: [
      'Look at the particles drawn on each card, before the change and after it.',
      'Compare how freely the particles move before and after, and how many particles of gas there are.',
      'The particles of a gas can be arranged in far more ways than the same particles packed together in a liquid or a solid.'
    ],
    check(state) {
      const t = state.table;
      const want = { melt: 'more', lime: 'more', haber: 'fewer', dew: 'fewer' };
      if (Object.keys(want).some(k => !['more', 'fewer'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every change needs a tray.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const card = t.pieces[wrong[0]];
      const gasOf = g => g.filter(([ph]) => ph === 'gas').reduce((s, [, n]) => s + n, 0);
      const gb = gasOf(card.props.before || []);
      const ga = gasOf(card.props.after || []);
      const detail = gb !== ga
        ? `it goes from ${gb} spread-out particle${gb === 1 ? '' : 's'} to ${ga}`
        : `it goes from ${card.props.before?.[0]?.[0]} to ${card.props.after?.[0]?.[0]}`;
      return { ok: false, msg: `"${card.label}" is in the "${t.zones.trays[whereIs(t, wrong[0])].label}" tray, yet ${detail}.` };
    },
    reward: {
      log: 'Gas decided the sign.',
      title: 'Entropy and the Sign of ΔS',
      body: 'Melting and making a gas let the particles be arranged in more ways, so the entropy rises and ΔS is positive. Condensing and using up gas do the opposite, so ΔS is negative.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-rank',
    title: 'Volume and Motion',
    prompt: 'What is the order of the four boxes, from lowest entropy to highest?',
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
      'Look at how the particles in each box are packed and how fast they move.',
      'Compare the two boxes of liquid water, which differ only in temperature.',
      'Particles with more space can be placed in more ways, and faster particles can share out their energy in more ways.'
    ],
    check(state) {
      const order = state.table.zones.rail.order;
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four boxes on the rail.' };
      const want = ['ice', 'cold', 'hot', 'steam'];
      if (order.join() === want.join()) return { ok: true };
      const t = state.table;
      const j = order.findIndex((id, i) => i > 0 && want.indexOf(order[i - 1]) > want.indexOf(id));
      const left = t.pieces[order[j - 1]];
      const right = t.pieces[order[j]];
      return { ok: false, msg: `"${left.label}" (${left.props.phase}, ${left.props.T} °C) stands to the left of "${right.label}" (${right.props.phase}, ${right.props.T} °C): compare how spread out and how fast their particles are.` };
    },
    reward: {
      log: 'Volume and motion both added ways.',
      title: 'Solid, Liquid, Gas, and Warming',
      body: 'Entropy rises from solid to liquid to gas, because the particles have more places to be. Warming a sample also raises its entropy, because faster particles can share out their energy in more ways.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-table',
    title: 'Entropy From a Table',
    briefing: {
      speaker: SPEAKER,
      body: 'Tables list the entropy of one mole of each substance. The ΔS of a reaction is the entropy of everything it makes minus the entropy of everything it uses up.',
      worked: [
        'N₂(g) + 3 H₂(g) → 2 NH₃(g)',
        `S of one mole, in J/(mol·K): N₂ ${S0('N2(g)')}, H₂ ${S0('H2(g)')}, NH₃ ${S0('NH3(g)')}`,
        `Made: 2 × ${S0('NH3(g)')} = ${fixed(2 * S0('NH3(g)'), 1)}`,
        `Used up: ${S0('N2(g)')} + 3 × ${S0('H2(g)')} = ${fixed(S0('N2(g)') + 3 * S0('H2(g)'), 1)}`,
        `ΔS = ${fixed(2 * S0('NH3(g)'), 1)} − ${fixed(S0('N2(g)') + 3 * S0('H2(g)'), 1)} = ${fixed(2 * S0('NH3(g)') - S0('N2(g)') - 3 * S0('H2(g)'), 1)} J/(mol·K)`
      ]
    },
    prompt: 'What is the entropy change, ΔS, for CaCO₃(s) → CaO(s) + CO₂(g)?',
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('s0', 'Entropy of one mole at 298 K, J/(mol·K)', { x: 46, y: 30 }, [
          `CaCO₃(s)    ${S0('CaCO3(s)')}`,
          `CaO(s)    ${S0('CaO(s)')}`,
          `CO₂(g)    ${S0('CO2(g)')}`,
          '298 K is 25 °C: K = °C + 273'
        ], { w: 72 }),
        markerFixture('dS', 'Entropy change', { x: 116, y: 18 }, { min: 0, max: 400, step: 5, start: 0, unit: 'J/(mol·K)', w: 50 }),
        rxnFixture('atoms', { x: 116, y: 47 }, { lhs: [[1, 'CaCO₃']], rhs: [[1, 'CaO'], [1, 'CO₂']], w: 50, h: 32 })
      ]
    }),
    hints: [
      'Read the entropy of each of the three substances on the plate.',
      'Sort the three into what the reaction makes and what it uses up.',
      'The worked case shows the order of the steps, and in this reaction every substance has one mole.'
    ],
    check(state) {
      const v = markerRead(state.table, 'dS');
      if (v === 0) return { ok: false, notYet: true, msg: 'Set the dial to the entropy change.' };
      if (Math.abs(v - DS_LIME) <= 3) return { ok: true };
      if (Math.abs(v - (S0('CaO(s)') + S0('CO2(g)'))) <= 3) return { ok: false, msg: `The dial reads ${v} J/(mol·K), which is the entropy of what the reaction makes, with nothing taken off.` };
      return { ok: false, msg: `The dial reads ${v} J/(mol·K). The reaction turns a solid into a solid and a gas.` };
    },
    reward: {
      log: 'ΔS for the limestone reaction came to +160 J/(mol·K).',
      title: 'ΔS From the Table',
      body: 'ΔS = (38.1 + 213.8) − 91.7 = +160.2 J/(mol·K). It is positive, as expected when a solid gives off a gas.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Press "Shake" again and again;', 'drag a card into the slot.'],
  3: ['Drag each change into a tray.'],
  4: ['Drag the boxes along the rail into order.'],
  5: ['Set the dial.']
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
      body: 'Particles spread out because there are far more spread-out arrangements than crowded ones. Entropy counts the arrangements: it is higher for a gas than for a liquid or a solid, and higher when a sample is warmer. The ΔS of a reaction is the entropy of what it makes minus the entropy of what it uses up.'
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
  [{ setDial: { fixture: 'dS', dial: 'value', value: 160 } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [...shakes(30), put('left', 'slot:answer')],
  [...sort({ melt: 'fewer', lime: 'more', haber: 'fewer', dew: 'fewer' })],
  [put('hot', 'rail:0'), put('ice', 'rail:1'), put('cold', 'rail:2'), put('steam', 'rail:3')],
  [{ setDial: { fixture: 'dS', dial: 'value', value: 250 } }]
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
export const CHECKS = { TOTAL_WAYS, CROWDED_WAYS, DS_LIME };
export { shakesOf, waysOf };
