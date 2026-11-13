/**
 * Unit 8 · Bench 6 — Le Chatelier's Principle (q6-lean)
 *
 * Teeter's pump station, on the pans kit (`table/kits/pans.js`) and its vessel (`pans-stress.js`): a sealed vessel of gas, a graph of the
 * moles of each gas, and a scale that marks Q with a needle and K with a line. Eight stages and TWO clicks: that adding a gas which does not
 * react raises the pressure and so shifts the vessel, and that a catalyst gives more product.
 *
 *   1  add H2 to the settled N2 + 3 H2 <-> 2 NH3 vessel       -> the N2 amount falls (the H2 pushed Q below K)
 *   2  squeeze the vessel                                      -> fewer gas molecules once settled
 *   3  PREDICT: argon at a fixed volume                        -> the held model: more gas, more pressure, so it shifts
 *   4  TEST: argon in the settled vessel                       -> the pressure of every reacting gas, and Q, do not move
 *   5  heat two vessels                                        -> K falls in one and rises in the other (heat is the one change of K)
 *   6  iron powder in a vessel mixed from N2 and H2            -> the same end, sooner (a catalyst changes the rate, not K)
 *   7  take NH3 out of the settled vessel                      -> it makes some back but settles with less than before (a product taken out)
 *   8  sort four new changes by which way the vessel shifts    -> a settled vessel shifts until Q is back on K (Le Chatelier)
 *
 * Simulation: ideal gases, K(T) from the van 't Hoff relation with a constant dH, every amount moving at one rate (`engine/eqdata.js`).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, selectorFixture, note, chip, dialValue, whereIs } from '../../table/kits/pans.js';
import { vesselFixture, vesselRead, vesselYield, baseOf, spheres, amt, fmtQ } from '../../table/kits/pans-stress.js';
import { leanStress, leanTotalP } from '../../engine/eqdata.js';

import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickable } from '../../table/kits/pans-choice.js';
export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bcatalysts?\b/i, introducedAt: 6 },
  { term: /\bLe Chatelier\b/i, introducedAt: 8 }
];

export const BUILDS_ON = ['unit08/q3-q'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q6-lean';

const GUESS = {
  more: 'More NH₃: the extra gas raises the pressure',
  less: 'Less NH₃: the extra gas takes up volume',
  same: 'The same NH₃: the extra gas changes nothing'
};
const SHORT = { more: 'more NH₃', less: 'less NH₃', same: 'the same NH₃' };

/** N2 + 3 H2 <-> 2 NH3 at 673 K in a litre, from one mole of N2 and three of H2. */
const MIX = { N2: 1, H2: 3 };
const HABER = { rxn: 'haber', mix: MIX, V0: 1, T0: 673, axis: [-7, -1], addSp: 'H2', takeSp: 'NH3', title: 'Vessel: N₂ + 3 H₂ ⇌ 2 NH₃' };
const NO2 = { rxn: 'n2o4', mix: { N2O4: 0.04 }, V0: 1, T0: 298, axis: [-3, 4], unit: 0.0025, title: 'Vessel 2: N₂O₄ ⇌ 2 NO₂' };

const UP = ['Rises', 'Falls', 'Stays the same', ' '];
const SAME3 = ['The same as before', 'Less than before', 'More than before', ' '];
const COUNT = ['More than before', 'Fewer than before', 'The same as before', ' '];

/** The four unseen changes of stage 8. */
const PICKS = [
  { id: 'c-addN2', label: 'Add N₂', st: { add: { N2: 1 } }, want: 'more' },
  { id: 'c-addNH3', label: 'Add NH₃', st: { add: { NH3: 0.5 } }, want: 'less' },
  { id: 'c-expand', label: 'Expand', st: { V: 2 }, want: 'less' },
  { id: 'c-helium', label: 'Add helium', st: { inert: 2 }, want: 'same' }
];
const TRAY_FOR = { forward: 'more', reverse: 'less', none: 'same' };

const S8 = { vol: { min: 0.5, max: 2, step: 0.5, value: 1 }, temp: { min: 573, max: 773, step: 50, value: 673 }, cycles: { max: 3, value: 0 } };
const grid = (min, max, step) => { const out = []; for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000); return out; };

export const LEAN = { MIX, HABER, NO2, PICKS, S8, grid };

const dialNo = (t, fid, name = 'value') => Math.round(dialValue(t, fid, name));

/** Which way the vessel shifts for stage-8 change `index`, from the planner. */
export function pickKind(f, index) {
  const { rxn, base } = baseOf(f);
  const res = leanStress(rxn, base, PICKS[index].st);
  return { res, kind: TRAY_FOR[res.dir] };
}

/** The most NH3 the dials can make, over every setting they take. */
export function bestMade(f) {
  let best = 0;
  for (const V of grid(S8.vol.min, S8.vol.max, S8.vol.step)) for (const T of grid(S8.temp.min, S8.temp.max, S8.temp.step)) for (let c = 0; c <= S8.cycles.max; c++) best = Math.max(best, vesselYield(f, V, T, c).made);
  return best;
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-add',
    title: 'Adding H₂',
    prompt: 'After H₂ is added to the settled vessel, where does the amount of N₂ settle?',
    widget,
    table: pansTable({
      fixtures: [
        { ...vesselFixture('v', { x: 52, y: 30 }, { ...HABER, touch: true, answer: { target: 'ans', watch: 'N2', higher: 1, same: 3, lower: 2 }, dials: { add: { name: 'H₂', max: 2, step: 0.5 } } }), props: { ...vesselFixture('v', { x: 52, y: 30 }, { ...HABER, touch: true, answer: { target: 'ans', watch: 'N2', higher: 1, same: 3, lower: 2 }, dials: { add: { name: 'H₂', max: 2, step: 0.5 } } }).props, gate: { fixtureDial: 'ans', dial: 'value', start: 4 }, gateMsg: 'Tap the graph to commit your prediction first, then press "Run".' } },
        choiceFixture('ans', 'N₂ amount', { x: 127, y: 24 }, { options: UP, start: 4, w: 40 })
      ]
    }),
    hints: [
      'Tap the H₂ supply and tap the graph where the N₂ amount will settle, then press "Run".',
      'Watch the Q marker against the K line just after H₂ goes in, and press "Run" to check the N₂ line.',
      'Compare Q with K just after the H₂ goes in and again once the lines are flat.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap the graph where the N₂ amount will settle.' };
      if (v === 2) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'No H₂ has been added to the vessel yet.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the H₂ went in.' };
      return { ok: false, msg: `With ${t.fixtures.v.dials.add.value} mol of H₂ added, the N₂ line reads ${amt(r.now.n.N2)} mol now and stood at ${amt(r.base.n.N2)} mol before.` };
    },
    reward: {
      log: 'Adding H₂ made the N₂ amount fall.',
      title: 'More of One Reactant',
      body: 'The added H₂ put Q below K. The vessel made more NH₃, using up N₂ as well, until Q was back on K.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-squeeze',
    title: 'Compressing the Vessel',
    prompt: 'After the vessel is compressed and settles again, does it hold more, fewer or the same gas molecules?',
    widget,
    table: pansTable({
      fixtures: [
        { ...vesselFixture('v', { x: 52, y: 30 }, { ...HABER, touch: true, dials: { vol: { min: 0.5, max: 1, step: 0.25, value: 1 } } }), props: { ...vesselFixture('v', { x: 52, y: 30 }, { ...HABER, touch: true, dials: { vol: { min: 0.5, max: 1, step: 0.25, value: 1 } } }).props, gate: { fixtureDial: 'ans', dial: 'value', start: 4 }, gateMsg: 'Set Gas molecules to commit your prediction first, then press "Run".' } },
        selectorFixture('ans', 'Gas molecules', { x: 127, y: 24 }, { options: COUNT, start: 4, list: true })
      ]
    }),
    hints: [
      'Drag the piston down, set the answer dial, then press "Run".',
      'Count the spheres in the window now and compare them with the count printed for before the compression.',
      'Follow Q against K just after the compression and see which side has fewer gas molecules.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'The piston has not moved: the vessel is still 1 L.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the piston moved.' };
      const s = spheres(r);
      return { ok: false, msg: `The window shows ${s.total} spheres now and ${s.before} before the compression.` };
    },
    reward: {
      log: 'Compressing the vessel left fewer gas molecules.',
      title: 'Less Volume',
      body: 'Halving the volume put Q below K, so the vessel made NH₃: four molecules become two, and the count fell.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Argon in the Vessel',
    // A PREDICT STAGE: the vessel is not on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Argon, which does not react, is added at fixed volume: what happens to the amount of NH₃?',
    widget,
    table: pansTable({
      pieces: [note('more', GUESS.more, { x: 26, y: 16 }), note('less', GUESS.less, { x: 76, y: 16 }), note('same', GUESS.same, { x: 126, y: 16 })],
      fixtures: [clipFixture('clip', { x: 126, y: 52 }, 'gasadd', { title: 'A gas with a gas added', h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 76, y: 44 }, size: { w: 44, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Lay one of the three cards in the slot.',
      'Think about what the argon does to the pressure of N₂, H₂ and NH₃ themselves.',
      'Decide whether the argon changes the volume or the pressure of each reacting gas.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess' && !p.hidden);
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess' && !p.hidden);
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, argon goes into a settled vessel and the amounts are read.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-argon',
    title: 'Argon Added',
    get prompt() {
      const g = recall(QUEST_KEY);
      return g && SHORT[g] ? `You predicted ${SHORT[g]}. After argon is added, where does the amount of NH₃ settle?` : 'After argon is added, where does the amount of NH₃ settle?';
    },
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v', { x: 52, y: 30 }, { ...HABER, cap2: 'pressure', touch: true, answer: { target: 'ans', watch: 'NH3', higher: 1, same: 3, lower: 2 }, dials: { inert: { max: 2, step: 0.5 } } }),
        choiceFixture('ans', 'NH₃ amount', { x: 127, y: 24 }, { options: UP, start: 4, w: 40 })
      ]
    }),
    hints: [
      'Tap the argon supply, then tap the graph where the NH₃ amount will settle.',
      'Compare the pressure and the NH₃ line with their readings before the argon went in, and watch the Q marker.',
      'Ask whether the argon changed the volume or pressure of each of N₂, H₂ and NH₃.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap the graph where the NH₃ amount will settle.' };
      if (v === 3) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'No argon has been added to the vessel yet.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the argon went in.' };
      return { ok: false, msg: `The pressure reads ${Math.round(r.now.P)} atm, up from ${Math.round(leanTotalP(r.rxn, r.base.n, r.base.V, r.base.T))} atm, and the NH₃ line reads ${amt(r.now.n.NH3)} mol against ${amt(r.base.n.NH3)} mol before the argon.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = !g || !SHORT[g] ? '' : g === 'same' ? 'You predicted no change, and the vessel agreed. ' : 'The vessel did not agree with your prediction, which is how a guess gets better. ';
      return {
        log: 'Argon left the NH₃ amount where it was.',
        title: 'A Gas That Does Not React',
        body: `${verdict}Argon raised the total pressure but left the pressures of N₂, H₂ and NH₃ as they were. Q stayed on K and nothing shifted.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-heat',
    title: 'Heating Two Vessels',
    briefing: 'Heating a settled vessel moves it in the direction that takes heat in.',
    prompt: 'Which reaction takes in heat as it makes its product?',
    widget,
    table: pansTable({
      fixtures: [
        pickable(vesselFixture('v1', { x: 38, y: 29 }, { ...HABER, window: false, w: 70, title: 'Vessel 1: N₂ + 3 H₂ ⇌ 2 NH₃', touch: true, dials: { temp: { min: 673, max: 773, step: 25 } } }), 1, 'ans'),
        pickable(vesselFixture('v2', { x: 112, y: 29 }, { ...NO2, window: false, w: 70, touch: true, dials: { temp: { min: 298, max: 398, step: 25 } } }), 2, 'ans'),
        choiceFixture('ans', 'Takes in heat making product', { x: 75, y: 73 }, { options: ['Vessel 1', 'Vessel 2', 'Both vessels', 'Neither vessel', ' '], start: 5, w: 70, plates: [3, 4] })
      ]
    }, { h: 90 }),
    hints: [
      'Heat each vessel with its burner, press "Run", then tap the answer.',
      'Compare the K printed under each graph with the faint mark where it stood before the heating.',
      'Check whether K rises or falls when each vessel is heated.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 5) return { ok: false, notYet: true, msg: 'Tap an answer.' };
      if (v === 2) return { ok: true };
      const a = vesselRead(t, 'v1'); const b = vesselRead(t, 'v2');
      if (!a.changed && !b.changed) return { ok: false, msg: 'Neither vessel has been heated yet.' };
      const one = (name, r) => (r.changed ? `${name}\'s K reads ${fmtQ(r.K0)} at ${r.base.T} K and ${fmtQ(r.res.post.K)} at ${r.res.post.T} K.` : `${name} has not been heated: its K reads ${fmtQ(r.K0)}.`);
      return { ok: false, msg: `${one('Vessel 1', a)} ${one('Vessel 2', b)}` };
    },
    reward: {
      log: 'Heating lowered K in one vessel and raised it in the other.',
      title: 'Heat Changes K',
      body: 'Heating raised K for N₂O₄ ⇌ 2 NO₂, so that reaction takes in heat; it lowered K for the ammonia vessel, which gives heat out. Only temperature changes K.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-powder',
    title: 'Iron Powder',
    prompt: 'What does the iron powder change?',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v1', { x: 38, y: 29 }, { ...HABER, settled: false, window: false, w: 70, dials: {}, title: 'Vessel 1: without iron powder' }),
        vesselFixture('v2', { x: 112, y: 29 }, { ...HABER, settled: false, window: false, w: 70, dials: {}, catalyst: true, title: 'Vessel 2: with iron powder' }),
        selectorFixture('ans', 'The iron powder changes', { x: 75, y: 73 }, { options: ['The final NH₃ amount', 'How soon it settles', 'Both of those', 'Neither of those', ' '], start: 5, w: 56, list: true })
      ]
    }, { h: 90 }),
    hints: [
      'Run both vessels, then set the answer dial.',
      'Compare where each NH₃ line ends and how many seconds each vessel takes to settle.',
      'Run each vessel until its lines are flat, then compare the final NH₃ amount and settling time.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const a = vesselRead(t, 'v1'); const b = vesselRead(t, 'v2');
      if (a.t === 0 && b.t === 0) return { ok: false, msg: 'Neither vessel has been run yet.' };
      if (a.t === 0 || b.t === 0) return { ok: false, msg: `Vessel ${a.t === 0 ? 1 : 2} has not been run yet.` };
      const one = (name, r) => `${name} holds ${amt(r.now.n.NH3)} mol of NH₃ at ${r.t} s${r.settled ? ` and settled in ${r.tick} s` : ' and is still changing'}.`;
      return { ok: false, msg: `${one('Vessel 1', a)} ${one('Vessel 2', b)}` };
    },
    reward: {
      log: 'The iron powder gave the same amounts, sooner.',
      title: 'A Catalyst',
      body: 'Both vessels settled at the same amounts. Iron powder is a catalyst: it speeds the reaction both ways equally, so the vessel settles sooner, not somewhere else.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-take',
    title: 'Taking NH₃ Out',
    prompt: 'After some NH₃ is taken out, where does the amount of NH₃ settle compared with before?',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v', { x: 52, y: 30 }, { ...HABER, touch: true, answer: { target: 'ans', watch: 'NH3', higher: 3, same: 1, lower: 2 }, dials: { take: { name: 'NH₃', max: 0.5, step: 0.25 } } }),
        choiceFixture('ans', 'NH₃ amount', { x: 127, y: 24 }, { options: SAME3, start: 4, w: 40 })
      ]
    }),
    hints: [
      'Tap the NH₃ trap to take NH₃ out, then tap the graph where NH₃ will settle.',
      'Watch the NH₃ line against its dashed level from before, and the Q marker against the K line.',
      'Compare the final NH₃ amount with its amount before any came out.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap the graph where the NH₃ amount will settle.' };
      if (v === 2) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'No NH₃ has been taken out of the vessel yet.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the NH₃ came out.' };
      return { ok: false, msg: `With ${t.fixtures.v.dials.take.value} mol of NH₃ taken out, the NH₃ line reads ${amt(r.now.n.NH3)} mol now and stood at ${amt(r.base.n.NH3)} mol before.` };
    },
    reward: {
      log: 'Taking NH₃ out left the vessel settling with less NH₃ than before.',
      title: 'Taking a Product Out',
      body: 'Q fell below K and the vessel made NH₃ again, but not all that was taken. Removing product keeps a vessel making more.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-shift',
    title: 'Which Way Will It Shift?',
    prompt: 'Which way does the settled vessel shift after each change?',
    widget,
    table: pansTable({
      pieces: [
        chip('c-addN2', 'Add N₂', { x: 96, y: 9 }),
        chip('c-addNH3', 'Add NH₃', { x: 128, y: 9 }),
        chip('c-expand', 'Expand', { x: 96, y: 26 }),
        chip('c-helium', 'Add helium', { x: 128, y: 26 })
      ],
      fixtures: [
        vesselFixture('q', { x: 36, y: 30 }, { ...HABER, window: false, w: 66, dials: {}, title: 'Vessel: N₂ + 3 H₂ ⇌ 2 NH₃' })
      ],
      zones: {
        trays: [
          { id: 'more', label: 'Makes more NH₃', at: { x: 84, y: 49 }, size: { w: 25, h: 21 }, cell: 24, cellH: 10 },
          { id: 'same', label: 'No shift', at: { x: 110, y: 49 }, size: { w: 25, h: 21 }, cell: 24, cellH: 10 },
          { id: 'less', label: 'Makes less NH₃', at: { x: 136, y: 49 }, size: { w: 25, h: 21 }, cell: 24, cellH: 10 }
        ]
      }
    }),
    hints: [
      'Sort all four change cards into the three trays.',
      'For each change, ask whether it puts Q below K, above K, or leaves Q on K.',
      'Use the balanced equation N₂ + 3 H₂ ⇌ 2 NH₃ to decide which way Q moves.'
    ],
    check(state) {
      const t = state.table;
      if (PICKS.some(p => !['more', 'same', 'less'].includes(whereIs(t, p.id)))) return { ok: false, notYet: true, msg: 'Every change needs a tray.' };
      const f = t.fixtures.q;
      const wrong = PICKS.find((_, idx) => whereIs(t, PICKS[idx].id) !== pickKind(f, idx).kind);
      if (!wrong) return { ok: true };
      const idx = PICKS.indexOf(wrong);
      const { res } = pickKind(f, idx);
      return { ok: false, msg: `After "${wrong.label}", Q is ${fmtQ(res.post.Q)} against K at ${fmtQ(res.post.K)}.` };
    },
    reward: {
      log: 'The four changes were sorted by which way the vessel shifts.',
      title: "Le Chatelier's Principle",
      body: 'Each change that moved Q off K was followed by a shift that brought it back. This is Le Chatelier\'s principle: a vessel disturbed from equilibrium shifts to reduce the disturbance.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: "Le Chatelier's Principle",
  body: 'A change that moves Q off K makes a settled vessel shift until Q is back on K; only a change of temperature moves K.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runs = (fid, n) => Array.from({ length: n }, () => ({ run: fid }));
const sortAll = (override = {}) => PICKS.map(p => put(p.id, `tray:${override[p.id] || p.want}`));

export const SOLUTIONS = [
  [dial('ans', 'value', 2), dial('v', 'add', 1), ...runs('v', 3)],
  [dial('ans', 'value', 2), dial('v', 'vol', 0.5), ...runs('v', 6)],
  [put('same', 'slot:guess')],
  [dial('v', 'inert', 2), ...runs('v', 3), dial('ans', 'value', 3)],
  [dial('v1', 'temp', 773), dial('v2', 'temp', 398), ...runs('v1', 2), ...runs('v2', 2), dial('ans', 'value', 2)],
  [...runs('v1', 6), ...runs('v2', 6), dial('ans', 'value', 2)],
  [dial('v', 'take', 0.5), ...runs('v', 6), dial('ans', 'value', 2)],
  [...sortAll()]
];

export const MISSES = [
  [dial('ans', 'value', 1), dial('v', 'add', 1), ...runs('v', 3)],
  [dial('ans', 'value', 1), dial('v', 'vol', 0.5), ...runs('v', 6)],
  [],
  [dial('v', 'inert', 2), ...runs('v', 3), dial('ans', 'value', 1)],
  [dial('v1', 'temp', 773), dial('v2', 'temp', 398), ...runs('v1', 2), ...runs('v2', 2), dial('ans', 'value', 4)],
  [...runs('v1', 6), ...runs('v2', 6), dial('ans', 'value', 3)],
  [dial('v', 'take', 0.5), ...runs('v', 6), dial('ans', 'value', 1)],
  [...sortAll({ 'c-helium': 'more', 'c-addN2': 'same' })]
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
