/**
 * Unit 8 · Bench 1 — Running Both Ways (q1-both)
 *
 * Teeter's equilibrium vessels, on the pans kit (`table/kits/pans.js`). A vessel holds 48 particles of butane (orange) or isobutane
 * (blue) at 320 K (K ≈ 2.0), turning into each other with a fixed chance per second. Six stages:
 *
 *   1  Butane alone: run until it settles; does all butane turn into isobutane?
 *   2  PREDICT: what are the particles doing once the graph is flat?
 *   3  Ringed particles: both changes go on at the same rate -> dynamic equilibrium
 *   4  Isobutane alone: settles at the same amounts from the other end
 *   5  Two settled vessels: equal rates, not equal amounts
 *   6  Writing the vessels: reversible reaction (⇌) vs one-way reaction (→)
 *
 * Simulation: each particle changes with a fixed chance per second (`engine/eqdata.js`). Real reactions are not all one-step collisions.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, panFixture, selectorFixture, note, panRead, pieceIn, dialValue, TRACERS, stateOfParticle } from '../../table/kits/pans.js';
import { arrowCard } from '../../table/kits/pans-pan.js';
import { clipFixture } from '../../table/kits/pans-clips.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bdynamic equilibrium\b/i, introducedAt: 3 },
  { term: /\bequilibrium\b/i, introducedAt: 3 },
  { term: /\brate\b/i, introducedAt: 3 },
  { term: /\breversible reaction\b/i, introducedAt: 6 },
  { term: /\bdouble arrow\b/i, introducedAt: 6 }
];

/** Amounts of particles are Tallow's; no other quest's words are used here. */
export const BUILDS_ON = ['unit01/q6-weigh'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q1-both';
const GUESS = {
  stopped: 'Nothing is happening: every change has stopped',
  allB: 'All the butane has turned to isobutane and stays there',
  both: 'Butane keeps turning to isobutane and isobutane keeps turning back',
  oneway: 'Butane keeps turning to isobutane, and none turns back'
};

// The vessels: 48 particles; butane turns to isobutane with chance kf per second and back with chance kr (K = 2.0 at 320 K).
const P_LEVEL = { kf: 0.1, kr: 0.05 };
const TOL = 5;
const LEVEL_A = Math.round(48 * P_LEVEL.kr / (P_LEVEL.kf + P_LEVEL.kr));
const HOLDS = ['Only butane', 'Only isobutane', 'Both', ' '];
const VS_DASHED = ['Less', 'Same', 'More', ' '];

/** How many times the ringed particles changed colour in the strip (the last 40 seconds). */
function ringedChanges(r) {
  let k = 0;
  for (const i of TRACERS) for (let t = Math.max(1, r.t - 39); t <= r.t; t++) if (stateOfParticle(r.hist, i, t) !== stateOfParticle(r.hist, i, t - 1)) k++;
  return k;
}

const predictCard = (id, at) => note(id, GUESS[id], at);
const compact = { window: false, h: 42, w: 46 };
const BUTANE_NAMES = { aName: 'butane', bName: 'isobutane' };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-settle',
    title: 'Butane Alone',
    briefing: {
      speaker: 'Vess',
      body: 'Butane and isobutane are the same atoms joined in two different shapes, and each can turn into the other.'
    },
    prompt: 'Does all the butane turn into isobutane?',
    widget,
    table: pansTable({
      fixtures: [
        panFixture('pan', { x: 52, y: 27 }, { ...P_LEVEL, b0: 0, seed: 11, title: 'Vessel: butane alone (47 °C)', ...BUTANE_NAMES }),
        selectorFixture('ans', 'The vessel holds', { x: 126, y: 24 }, { options: HOLDS, start: 4, list: true })
      ]
    }),
    hints: [
      'Press "Run" on the vessel until the lines stop moving, then set the answer dial.',
      'Watch the orange butane line and blue isobutane line until both flatten.',
      'Check the counts under the graph once the lines are flat.'
    ],
    check(state) {
      const t = state.table;
      const v = Math.round(dialValue(t, 'ans'));
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      const r = panRead(t, 'pan');
      if (r.settledA == null) return { ok: false, notYet: true, msg: 'The orange butane line on the graph is still falling.' };
      if (v === 3) return { ok: true };
      if (v === 1) return { ok: false, msg: `The settled vessel holds ${r.a} butane and ${r.b} isobutane.` };
      return { ok: false, msg: `The settled vessel still holds ${r.a} butane alongside ${r.b} isobutane.` };
    },
    reward: {
      log: 'Some butane was left when the amounts stopped changing.',
      title: 'The Amounts Settle',
      body: 'The amounts stopped changing with some butane still there. The reaction did not use it all up.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'What Is Happening?',
    // A PREDICT STAGE: the vessel is not on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Once the graph is flat, what are the particles in the vessel doing?',
    widget,
    table: pansTable({
      pieces: [predictCard('stopped', { x: 30, y: 14 }), predictCard('allB', { x: 78, y: 14 }), predictCard('both', { x: 30, y: 36 }), predictCard('oneway', { x: 78, y: 36 })],
      fixtures: [clipFixture('clip', { x: 124, y: 55 }, 'react', { title: 'A reaction starting', kf: 0.08, kr: 0.04, seed: 5, span: 36, h: 32 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Drag one of the four cards into the slot.',
      'Think about what each card means for the particles themselves, not just the flat lines.',
      'A flat graph means the totals hold steady; decide whether individual particles must be still.'
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
      body: 'Next, a settled vessel has eight particles ringed so you can follow them.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-tracer',
    title: 'Ringed Particles',
    get prompt() {
      const g = recall(QUEST_KEY);
      return g && GUESS[g] ? `You predicted "${GUESS[g]}". What do the ringed particles show is happening in the settled vessel?` : 'What do the ringed particles show is happening in the settled vessel?';
    },
    widget,
    table: pansTable({
      fixtures: [
        panFixture('pan', { x: 52, y: 32 }, { ...P_LEVEL, b0: 0, seed: 23, start: 100, tracer: true, title: 'Settled vessel, eight particles ringed', ...BUTANE_NAMES }),
        selectorFixture('verdict', 'What is happening', { x: 127, y: 22 }, { options: ['Nothing changes', 'Both changes go on', ' '], start: 3, list: true })
      ]
    }),
    hints: [
      'Follow the ringed particles in the strip under the graph, then set the answer dial.',
      'Count how many times the ringed particles switch colour and check the count of each change.',
      'See whether the ringed particles stay one colour or keep switching both ways.'
    ],
    check(state) {
      const v = dialValue(state.table, 'verdict');
      if (v === 3) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const r = panRead(state.table, 'pan');
      return { ok: false, msg: `The ringed particles changed colour ${ringedChanges(r)} times in the strip, and the count of each change is above zero.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = !g || !GUESS[g] ? '' : g === 'both' ? 'You predicted changes both ways, and the ringed particles agreed. ' : 'The ringed particles did not agree with your prediction, which is how a guess gets better. ';
      return {
        log: 'Particles kept changing in a settled vessel.',
        title: 'Dynamic Equilibrium',
        body: `${verdict}Butane keeps turning into isobutane and isobutane keeps turning back, at the same rate (changes per second), so the amounts hold steady. This is dynamic equilibrium.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-from-b',
    title: 'Isobutane Alone',
    prompt: 'Starting from isobutane alone, does the vessel settle with more, less or the same butane as before?',
    widget,
    table: pansTable({
      fixtures: [
        panFixture('pan', { x: 52, y: 27 }, { ...P_LEVEL, b0: 48, seed: 31, title: 'Vessel: isobutane alone (47 °C)', ghost: { b0: 0, seed: 11 }, ...BUTANE_NAMES }),
        selectorFixture('ans', 'Butane against the dashed line', { x: 126, y: 24 }, { options: VS_DASHED, start: 4, list: true })
      ]
    }),
    hints: [
      'Press "Run" on the vessel; the dashed lines show the vessel that started with butane alone.',
      'Watch where the solid orange butane line ends against the dashed orange line.',
      'See whether the solid orange line flattens above, below or level with the dashed one.'
    ],
    check(state) {
      const t = state.table;
      const v = Math.round(dialValue(t, 'ans'));
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      const r = panRead(t, 'pan');
      if (r.settledA == null) return { ok: false, notYet: true, msg: 'The orange butane line on the graph is still moving.' };
      const same = Math.abs(r.settledA - LEVEL_A) <= TOL;
      const truth = same ? 2 : r.settledA > LEVEL_A ? 3 : 1;
      if (v === truth) return { ok: true };
      return { ok: false, msg: `The solid orange line flattens near ${Math.round(r.settledA)} particles of butane; the dashed one flattened near ${LEVEL_A}.` };
    },
    reward: {
      log: 'Isobutane alone settled at the same amounts.',
      title: 'Same Level From Either End',
      body: 'It settled at the same amounts as when it started from butane. Where a reaction settles does not depend on which side it started.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's6-not-equal',
    title: 'Two Settled Vessels',
    briefing: {
      speaker: 'Vess',
      body: 'The substance a reaction starts with is the reactant, and what it makes is the product.'
    },
    prompt: 'Which statement do these two settled vessels show to be false?',
    widget,
    table: pansTable({
      pieces: [
        note('c-equal', 'Reactant and product are always equal in number', { x: 26, y: 58 }),
        note('c-both', 'Changes keep going in both directions', { x: 76, y: 58 }),
        note('c-agree', 'On each vessel, the count of each change is about the same', { x: 126, y: 58 })
      ],
      fixtures: [
        panFixture('p1', { x: 28, y: 25 }, { ...P_LEVEL, b0: 0, seed: 41, start: 100, title: 'Vessel 1', ...BUTANE_NAMES, ...compact }),
        panFixture('p2', { x: 78, y: 25 }, { kf: 0.1, kr: 0.1, b0: 0, seed: 42, start: 100, title: 'Vessel 2', aName: 'R', bName: 'P', ...compact })
      ],
      zones: { slots: [{ id: 'false', label: 'False', at: { x: 126, y: 26 }, size: { w: 36, h: 14 } }] }
    }, { h: 70 }),
    hints: [
      'Drag the false statement card into the slot.',
      'Check where the orange and blue lines end on each vessel, and compare the count of each change.',
      'Test each statement against both vessels and find the one that disagrees.'
    ],
    check(state) {
      const c = pieceIn(state.table, 'false');
      if (!c) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (c.id === 'c-equal') return { ok: true };
      if (c.id === 'c-both') return { ok: false, msg: 'On both vessels, the count of each change under the graph is above zero.' };
      return { ok: false, msg: 'On both vessels, the forward and reverse change counts are close to each other.' };
    },
    reward: {
      log: 'The amounts were not equal; the rates were about the same.',
      title: 'Not Equal Amounts',
      body: 'At equilibrium the two rates are equal, but the amounts are not: Vessel 1 holds about twice as much isobutane as butane.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's7-arrows',
    title: 'Writing the Vessels',
    briefing: {
      speaker: 'Vess',
      body: 'A reaction that runs both ways is a reversible reaction, written with a double arrow, ⇌.'
    },
    prompt: 'Which arrow describes how each vessel reacts?',
    widget,
    table: pansTable({
      pieces: [arrowCard('one', 'Reactant → Product', { x: 124, y: 16 }), arrowCard('two', 'Reactant ⇌ Product', { x: 124, y: 36 })],
      fixtures: [
        panFixture('p1', { x: 28, y: 25 }, { kf: 0.1, kr: 0, b0: 0, seed: 52, start: 30, title: 'Vessel 1', aName: 'R', bName: 'P', ...compact }),
        panFixture('p2', { x: 78, y: 25 }, { ...P_LEVEL, b0: 0, seed: 51, start: 30, title: 'Vessel 2', aName: 'R', bName: 'P', ...compact })
      ],
      zones: {
        slots: [
          { id: 'l1', label: 'Vessel 1 is written', at: { x: 28, y: 54 }, size: { w: 28, h: 8 } },
          { id: 'l2', label: 'Vessel 2 is written', at: { x: 78, y: 54 }, size: { w: 28, h: 8 } }
        ]
      }
    }),
    hints: [
      'Press "Run" on each vessel, then lay an arrow card under each one.',
      'Compare the reverse change count on the two vessels and see where each blue line ends.',
      'A reaction where product never turns back takes →; one that runs both ways takes ⇌.'
    ],
    check(state) {
      const t = state.table;
      const a = pieceIn(t, 'l1'); const b = pieceIn(t, 'l2');
      if (!a || !b) return { ok: false, notYet: true, msg: 'Lay a card on each vessel.' };
      if (a.id === 'one' && b.id === 'two') return { ok: true };
      return a.id !== 'one'
        ? { ok: false, msg: 'Vessel 1\'s reverse change count is 0 and its blue line ends at the top of the graph.' }
        : { ok: false, msg: 'Vessel 2\'s reverse change count is above zero and its blue line stops below the top of the graph.' };
    },
    reward: {
      log: 'The vessel with changes both ways takes the double arrow.',
      title: 'Reversible Reaction',
      body: 'In Vessel 2 the product turns back, so it is written with a double arrow, ⇌. In Vessel 1 nothing turns back: that reaction finishes, and is not at equilibrium.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Running Both Ways',
  body: 'A reaction at equilibrium has not stopped: both forward and reverse changes keep running at the same rate.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
/** Run a vessel `n` times (ten seconds each). */
const runs = (fid, n) => Array.from({ length: n }, () => ({ run: fid }));

export const SOLUTIONS = [
  [...runs('pan', 10), dial('ans', 'value', 3)],
  [put('both', 'slot:guess')],
  [dial('verdict', 'value', 2)],
  [...runs('pan', 10), dial('ans', 'value', 2)],
  [put('c-equal', 'slot:false')],
  [put('one', 'slot:l1'), put('two', 'slot:l2')]
];

export const MISSES = [
  [...runs('pan', 10), dial('ans', 'value', 1)],
  [],
  [dial('verdict', 'value', 1)],
  [...runs('pan', 10), dial('ans', 'value', 3)],
  [put('c-both', 'slot:false')],
  [put('two', 'slot:l1'), put('one', 'slot:l2')]
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
