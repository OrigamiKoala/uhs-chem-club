/**
 * Unit 8 · Bench 1 — Running Both Ways (q1-both)
 *
 * Teeter's salt pans, on the pans kit (`table/kits/pans.js`). A pan holds 48 particles; each is A (orange) or B (blue) and turns to the
 * other with a fixed chance per tick. Eight stages and ONE click: the belief that once the amounts stop changing, nothing is happening.
 *
 *   1  A alone, run until it settles; what does the pan hold?  -> some A is left; the amounts stop changing
 *   2  PREDICT: what are the particles doing once the graph is flat?
 *   3  TEST: ringed particles in the settled pan      -> dynamic equilibrium (both changes keep going)
 *   4  B alone, run until it settles; against the dashed line   -> the same level from the other end
 *   5  match the settled pan to a particle diagram    -> a particulate picture of equilibrium (CED 7.8)
 *   6  two settled pans, one statement is false       -> the amounts need not be equal
 *   7  label two pans with an arrow                   -> reversible reaction (double arrow)
 *   8  three sealed pans: which has reached equilibrium
 *
 * THE WRONG MODEL IS ON THE TABLE. Card 1 of the prediction says nothing is happening. The ringed particles of stage 3 change colour in a
 * pan whose graph has not moved, and the two counts both run.
 *
 * Simulation: each particle changes with a fixed chance per tick (`engine/eqdata.js`). Real reactions are not all one-step collisions.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, panFixture, selectorFixture, note, panRead, pieceIn, dialValue, TRACERS, stateOfParticle } from '../../table/kits/pans.js';
import { diagramCard, arrowCard } from '../../table/kits/pans-pan.js';

import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickable, pickColumns } from '../../table/kits/pans-choice.js';
export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bdynamic equilibrium\b/i, introducedAt: 3 },
  { term: /\bequilibrium\b/i, introducedAt: 3 },
  { term: /\breversible reaction\b/i, introducedAt: 7 },
  { term: /\bdouble arrow\b/i, introducedAt: 7 }
];

/** Amounts of particles are Tallow's; no other quest's words are used here. */
export const BUILDS_ON = ['unit01/q6-weigh'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q1-both';
const GUESS = {
  stopped: 'Nothing is happening: every change has stopped',
  allB: 'All the A has turned to B and stays there',
  both: 'A keeps turning to B and B keeps turning back to A',
  oneway: 'A keeps turning to B, and none turns back'
};

// The pans: 48 particles; A turns to B with chance kf per tick and B to A with chance kr.
const P_LEVEL = { kf: 0.1, kr: 0.05 };
const TOL = 5;
const LEVEL_A = Math.round(48 * P_LEVEL.kr / (P_LEVEL.kf + P_LEVEL.kr));
const HOLDS = ['Only A', 'Only B', 'Both A and B', ' '];
const VS_DASHED = ['Lower', 'Level', 'Higher', ' '];

/** How many times the ringed particles changed colour in the strip (the last 40 ticks). */
function ringedChanges(r) {
  let k = 0;
  for (const i of TRACERS) for (let t = Math.max(1, r.t - 39); t <= r.t; t++) if (stateOfParticle(r.hist, i, t) !== stateOfParticle(r.hist, i, t - 1)) k++;
  return k;
}

const predictCard = (id, at) => note(id, GUESS[id], at);
const compact = { window: false, h: 42, w: 46 };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-settle',
    title: 'A Alone',
    prompt: 'Run the vessel until the amounts stop changing, then set the dial to what it holds.',
    widget,
    table: pansTable({
      fixtures: [
        panFixture('pan', { x: 52, y: 27 }, { ...P_LEVEL, b0: 0, seed: 11, title: 'Vessel: A alone' }),
        selectorFixture('ans', 'The vessel holds', { x: 126, y: 24 }, { options: HOLDS, start: 4, list: true })
      ]
    }),
    hints: [
      'Use the "Run" key on the vessel and the answer dial.',
      'Watch the orange and blue lines on the graph until both stop moving.',
      'Compare the two counts under the graph once the lines are flat with the counts when the vessel began.'
    ],
    check(state) {
      const t = state.table;
      const v = Math.round(dialValue(t, 'ans'));
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      const r = panRead(t, 'pan');
      if (r.settledA == null) return { ok: false, notYet: true, msg: 'The orange line on the graph is still falling.' };
      if (v === 3) return { ok: true };
      if (v === 1) return { ok: false, msg: `The counts under the graph read ${r.a} of A and ${r.b} of B.` };
      return { ok: false, msg: `The counts under the graph read ${r.a} of A and ${r.b} of B once the lines are flat.` };
    },
    reward: {
      log: 'Some A was left when the amounts stopped changing.',
      title: 'The Amounts Settle',
      body: 'Started with only A, the vessel did not turn all of it into B. After a while the number of each stopped changing, with some A left.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'What Is Happening?',
    // A PREDICT STAGE: the pan is not on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Once the graph is flat, which best describes what the particles in the vessel are doing?',
    widget,
    table: pansTable({
      pieces: [predictCard('stopped', { x: 30, y: 14 }), predictCard('allB', { x: 78, y: 14 }), predictCard('both', { x: 30, y: 36 }), predictCard('oneway', { x: 78, y: 36 })],
      fixtures: [clipFixture('clip', { x: 124, y: 55 }, 'react', { title: 'A reaction starting', kf: 0.08, kr: 0.04, seed: 5, span: 36 , h: 32 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what each card would look like for the particles themselves, not for the graph.',
      'A flat graph says the numbers stopped changing; decide whether that means the particles stopped.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, a settled vessel is put under a ring test to see what its particles do.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-tracer',
    title: 'Ringed Particles',
    get prompt() {
      const g = recall(QUEST_KEY);
      return g && GUESS[g] ? `You predicted "${GUESS[g]}". Say what the ringed particles show is happening in the settled vessel.` : 'Say what the ringed particles show is happening in the settled vessel.';
    },
    widget,
    table: pansTable({
      fixtures: [
        panFixture('pan', { x: 52, y: 32 }, { ...P_LEVEL, b0: 0, seed: 23, start: 100, tracer: true, title: 'Settled vessel, eight particles ringed' }),
        selectorFixture('verdict', 'What is happening', { x: 127, y: 22 }, { options: ['Nothing changes', 'Both changes go on', ' '], start: 3, list: true })
      ]
    }),
    hints: [
      'Use the "Run" key if you like, and the answer dial.',
      'Follow the ringed particles in the strip under the graph and read the two counts.',
      'A graph that is flat can hide changes that cancel each other out.'
    ],
    check(state) {
      const v = dialValue(state.table, 'verdict');
      if (v === 3) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const r = panRead(state.table, 'pan');
      return { ok: false, msg: `The ringed particles changed colour ${ringedChanges(r)} times in the strip, and the two counts under the graph are not zero.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = !g || !GUESS[g] ? '' : g === 'both' ? 'You predicted changes both ways, and the ringed particles agreed. ' : 'The ringed particles did not agree with your prediction, which is how a guess gets better. ';
      return {
        log: 'Particles kept changing in a flat vessel.',
        title: 'Dynamic Equilibrium',
        body: `${verdict}The graph is flat because A turns to B at about the same rate that B turns back to A. This state, with both changes still going on, is called dynamic equilibrium.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-from-b',
    title: 'B Alone',
    prompt: 'Run the B-only vessel until it stops changing, then set the dial to where its A ends against the dashed line.',
    widget,
    table: pansTable({
      fixtures: [
        panFixture('pan', { x: 52, y: 27 }, { ...P_LEVEL, b0: 48, seed: 31, title: 'Vessel: B alone', ghost: { b0: 0, seed: 11 } }),
        selectorFixture('ans', 'A against the dashed line', { x: 126, y: 24 }, { options: VS_DASHED, start: 4, list: true })
      ]
    }),
    hints: [
      'Use the "Run" key on the vessel and the answer dial; the dashed line is the vessel that started with only A.',
      'Compare where the orange line ends with where the dashed orange line ended.',
      'Look at both lines once the solid one has flattened, and see whether one stands above the other.'
    ],
    check(state) {
      const t = state.table;
      const v = Math.round(dialValue(t, 'ans'));
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      const r = panRead(t, 'pan');
      if (r.settledA == null) return { ok: false, notYet: true, msg: 'The orange line on the graph is still moving.' };
      const same = Math.abs(r.settledA - LEVEL_A) <= TOL;
      const truth = same ? 2 : r.settledA > LEVEL_A ? 3 : 1;
      if (v === truth) return { ok: true };
      return { ok: false, msg: `The solid orange line flattens near ${Math.round(r.settledA)} particles of A; the dashed one flattened near ${LEVEL_A}.` };
    },
    reward: {
      log: 'B alone settled at the same amounts.',
      title: 'Same Level From Either End',
      body: 'Started from B alone, the vessel settled at the same numbers of A and B as it did started from A alone. Where it settles belongs to the vessel, not to how it was started.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-diagram',
    title: 'A Picture of the Settled Vessel',
    prompt: 'Lay the particle diagram that matches the vessel once it is in equilibrium.',
    widget,
    table: pansTable({
      pieces: [
        diagramCard('d1', 'Diagram 1', { x: 22, y: 58 }, 48, 0),
        diagramCard('d2', 'Diagram 2', { x: 48, y: 58 }, 24, 24),
        diagramCard('d3', 'Diagram 3', { x: 74, y: 58 }, 8, 40),
        diagramCard('d4', 'Diagram 4', { x: 100, y: 58 }, 16, 32)
      ],
      fixtures: [panFixture('pan', { x: 52, y: 25 }, { ...P_LEVEL, b0: 0, seed: 71, title: 'Vessel: A alone', h: 42 })],
      zones: { slots: [{ id: 'match', label: 'Matches the vessel', at: { x: 127, y: 38 }, size: { w: 24, h: 22 } }] }
    }, { h: 70 }),
    hints: [
      'Use the "Run" key and the diagram cards.',
      'Compare the settled vessel\'s window with the number of orange and blue spheres on each card.',
      'The card must show the same proportion of orange to blue as the window.'
    ],
    check(state) {
      const t = state.table;
      const card = pieceIn(t, 'match');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      const r = panRead(t, 'pan');
      if (r.meanA == null) return { ok: false, notYet: true, msg: 'The vessel has not settled yet.' };
      const { a, b } = card.props;
      const want = r.meanA / r.n;
      if (Math.abs(a / (a + b) - want) <= 0.08) return { ok: true };
      if (b === 0) return { ok: false, msg: 'The vessel\'s graph shows blue spheres in it; that card has none.' };
      if (a === b) return { ok: false, msg: 'The two lines on the graph end at different heights; that card shows them level.' };
      return { ok: false, msg: a / (a + b) > want ? 'The orange line on the graph ends lower than that card shows.' : 'The orange line on the graph ends higher than that card shows.' };
    },
    reward: {
      log: 'The diagram with the settled proportion matches.',
      title: 'Equilibrium, Drawn',
      body: 'A particle diagram of a vessel in equilibrium shows both kinds present, in numbers that stay fixed. The picture is a snapshot; the particles in it are still changing.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-not-equal',
    title: 'Two Settled Vessels',
    prompt: 'Lay the statement that these two settled vessels show to be false.',
    widget,
    table: pansTable({
      pieces: [
        note('c-equal', 'A and B are always equal in number', { x: 26, y: 58 }),
        note('c-both', 'Changes keep going in both directions', { x: 76, y: 58 }),
        note('c-agree', 'On each vessel, the two counts are about the same', { x: 126, y: 58 })
      ],
      fixtures: [
        panFixture('p1', { x: 28, y: 25 }, { ...P_LEVEL, b0: 0, seed: 41, start: 100, title: 'Vessel 1', ...compact }),
        panFixture('p2', { x: 78, y: 25 }, { kf: 0.1, kr: 0.1, b0: 0, seed: 42, start: 100, title: 'Vessel 2', ...compact })
      ],
      zones: { slots: [{ id: 'false', label: 'False', at: { x: 126, y: 26 }, size: { w: 36, h: 14 } }] }
    }, { h: 70 }),
    hints: [
      'Use the "Run" key if you like, and the three cards.',
      'Read where the orange and blue lines end on each vessel, and the two counts under it.',
      'Test each statement against both vessels; only one of them fails.'
    ],
    check(state) {
      const c = pieceIn(state.table, 'false');
      if (!c) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (c.id === 'c-equal') return { ok: true };
      if (c.id === 'c-both') return { ok: false, msg: 'On both vessels, both counts under the graph are above zero.' };
      return { ok: false, msg: 'On both vessels, the two counts under the graph are close to each other.' };
    },
    reward: {
      log: 'The amounts were not equal; the rates were about the same.',
      title: 'Not Equal Amounts',
      body: 'In equilibrium the forward and reverse rates are equal, but the amounts of A and B need not be. Vessel 1 settled with about twice as much B as A, while its two counts matched.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-arrows',
    title: 'Writing the Vessels',
    prompt: 'Lay on each vessel the arrow card that describes how it reacts.',
    widget,
    table: pansTable({
      pieces: [arrowCard('one', 'A → B', { x: 124, y: 16 }), arrowCard('two', 'A ⇌ B', { x: 124, y: 36 })],
      fixtures: [
        panFixture('p1', { x: 28, y: 25 }, { kf: 0.1, kr: 0, b0: 0, seed: 52, start: 30, title: 'Vessel 1', ...compact }),
        panFixture('p2', { x: 78, y: 25 }, { ...P_LEVEL, b0: 0, seed: 51, start: 30, title: 'Vessel 2', ...compact })
      ],
      zones: {
        slots: [
          { id: 'l1', label: 'Vessel 1 is written', at: { x: 28, y: 54 }, size: { w: 24, h: 8 } },
          { id: 'l2', label: 'Vessel 2 is written', at: { x: 78, y: 54 }, size: { w: 24, h: 8 } }
        ]
      }
    }),
    hints: [
      'Use the "Run" key on each vessel and the two arrow cards.',
      'Compare the "B to A" count on the two vessels, and where each blue line ends.',
      'A vessel where B never turns back is written with a single arrow; one where it does is written with an arrow each way.'
    ],
    check(state) {
      const t = state.table;
      const a = pieceIn(t, 'l1'); const b = pieceIn(t, 'l2');
      if (!a || !b) return { ok: false, notYet: true, msg: 'Lay a card on each vessel.' };
      if (a.id === 'one' && b.id === 'two') return { ok: true };
      return a.id !== 'one'
        ? { ok: false, msg: 'Vessel 1\'s "B to A" count is 0 and its blue line ends at the top of the graph.' }
        : { ok: false, msg: 'Vessel 2\'s "B to A" count is above zero and its blue line stops below the top of the graph.' };
    },
    reward: {
      log: 'The vessel with changes both ways takes the double arrow.',
      title: 'Reversible Reaction',
      body: 'A reaction that can go both ways is a reversible reaction, written with a double arrow, ⇌. A single arrow means B never turns back into A.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Sealed Vessels',
    prompt: 'Tap the vessel that has reached equilibrium.',
    widget,
    table: pansTable({
      fixtures: [
        pickable(panFixture('p1', { x: 25, y: 25 }, { kf: 0.1, kr: 0, b0: 0, seed: 61, start: 60, title: 'Vessel 1', ...compact }), 1),
        pickable(panFixture('p2', { x: 75, y: 25 }, { kf: 0.004, kr: 0.002, b0: 0, seed: 62, start: 60, title: 'Vessel 2', ...compact }), 2),
        pickable(panFixture('p3', { x: 125, y: 25 }, { kf: 0.06, kr: 0.09, b0: 0, seed: 63, start: 60, title: 'Vessel 3', ...compact }), 3),
        choiceFixture('pick', 'Reached equilibrium', { x: 75, y: 55 }, { options: ['Vessel 1', 'Vessel 2', 'Vessel 3', ' '], start: 4, w: 56 })
      ]
    }),
    hints: [
      'Use the "Run" key on each vessel, then tap the vessel you choose.',
      'Compare the graphs and the two counts under each one.',
      'Equilibrium needs a graph that has stopped moving and changes still counted in both directions.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap a vessel.' };
      if (v === 3) return { ok: true };
      if (v === 1) return { ok: false, msg: 'Vessel 1\'s graph has stopped moving, and its "B to A" count is 0.' };
      return { ok: false, msg: 'Vessel 2\'s graph is still moving.' };
    },
    reward: {
      log: 'Vessel 3 was in equilibrium.',
      title: 'Spotting Equilibrium',
      body: 'A vessel is in equilibrium when its amounts hold steady and both changes are still being counted. A vessel that stopped because nothing turns back is finished, not in equilibrium.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Running Both Ways',
  body: 'A vessel that has stopped changing is still turning over, at about the same rate in both directions.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
/** Run a pan `n` times (ten ticks each). */
const runs = (fid, n) => Array.from({ length: n }, () => ({ run: fid }));

export const SOLUTIONS = [
  [...runs('pan', 10), dial('ans', 'value', 3)],
  [put('both', 'slot:guess')],
  [dial('verdict', 'value', 2)],
  [...runs('pan', 10), dial('ans', 'value', 2)],
  [...runs('pan', 10), put('d4', 'slot:match')],
  [put('c-equal', 'slot:false')],
  [put('one', 'slot:l1'), put('two', 'slot:l2')],
  [dial('pick', 'value', 3)]
];

export const MISSES = [
  [...runs('pan', 10), dial('ans', 'value', 1)],
  [],
  [dial('verdict', 'value', 1)],
  [...runs('pan', 10), dial('ans', 'value', 3)],
  [...runs('pan', 10), put('d2', 'slot:match')],
  [put('c-both', 'slot:false')],
  [put('two', 'slot:l1'), put('one', 'slot:l2')],
  [dial('pick', 'value', 1)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { P_LEVEL, TOL };
