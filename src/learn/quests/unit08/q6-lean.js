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
 *   7  sort six changes by what each does to Q                 -> a settled vessel moves until Q is back on K (Le Chatelier)
 *   8  take NH3 out of the settled vessel                       -> it makes some back but settles with less than before (a product taken out)
 *
 * Taking a product out (the CED second stress) has its own stage 8, after the sort of stage 7.
 *
 * Simulation: ideal gases, K(T) from the van 't Hoff relation with a constant dH, every amount moving at one rate (`engine/eqdata.js`).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, selectorFixture, note, chip, dialValue, whereIs } from '../../table/kits/pans.js';
import { vesselFixture, vesselRead, vesselYield, baseOf, pickStress, spheres, amt, fmtQ } from '../../table/kits/pans-stress.js';
import { leanStress, leanTotalP } from '../../engine/eqdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bcatalysts?\b/i, introducedAt: 6 },
  { term: /\bLe Chatelier\b/i, introducedAt: 7 }
];

export const BUILDS_ON = ['unit08/q3-q'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q6-lean';

const GUESS = {
  more: 'More NH₃: the extra gas raises the pressure',
  less: 'Less NH₃: the extra gas takes up room',
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

/** The six changes of stage 7, in the order the vessel's menu lists them (the first entry is no change). */
const PICKS = [
  { label: 'None', st: {} },
  { label: 'Add H₂', st: { add: { H2: 1 } } },
  { label: 'Take out NH₃', st: { add: { NH3: -0.5 } } },
  { label: 'Add NH₃', st: { add: { NH3: 0.5 } } },
  { label: 'Expand', st: { V: 2 } },
  { label: 'Add argon', st: { inert: 2 } },
  { label: 'Catalyst', st: { catalyst: true } }
];
const SORT_CHIPS = [['c-addH2', 1, 'below'], ['c-takeNH3', 2, 'below'], ['c-addNH3', 3, 'above'], ['c-expand', 4, 'above'], ['c-argon', 5, 'equal'], ['c-cat', 6, 'equal']];

/** The dial settings of stage 8: every one the dials can take, to find the setting that makes the most NH3. */
const S8 = { vol: { min: 0.5, max: 2, step: 0.5, value: 1 }, temp: { min: 573, max: 773, step: 50, value: 673 }, cycles: { max: 3, value: 0 } };
const grid = (min, max, step) => { const out = []; for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000); return out; };

export const LEAN = { MIX, HABER, NO2, PICKS, SORT_CHIPS, S8, grid };

const dialNo = (t, fid, name = 'value') => Math.round(dialValue(t, fid, name));

/** The kind of stage-7 change `index` makes: Q below K, above K, or on it, from the planner. */
export function pickKind(f, index) {
  const { rxn, base } = baseOf(f);
  const res = leanStress(rxn, base, pickStress(f, index));
  return { res, kind: res.dir === 'forward' ? 'below' : res.dir === 'reverse' ? 'above' : 'equal' };
}

/** The most NH3 the dials of stage 8 can make, over every setting they take. */
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
    prompt: 'Add H₂ to the settled vessel, then set the dial to what happens to the N₂ amount.',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v', { x: 52, y: 30 }, { ...HABER, dials: { add: { name: 'H₂', max: 2, step: 0.5 } } }),
        selectorFixture('ans', 'N₂ amount', { x: 127, y: 24 }, { options: UP, start: 4, list: true })
      ]
    }),
    hints: [
      'Use the "Add H₂" dial, the "Run" key and the answer dial.',
      'Watch the N₂ line against its dashed level from before, and the Q needle against the K line.',
      'Compare Q with K just after the H₂ goes in and again once the lines are flat, and see which amounts moved between the two.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'No H₂ has been added to the vessel yet.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the H₂ went in.' };
      return { ok: false, msg: `With ${t.fixtures.v.dials.add.value} mol of H₂ added, the N₂ line reads ${amt(r.now.n.N2)} mol now and stood at ${amt(r.base.n.N2)} mol before.` };
    },
    reward: {
      log: 'Adding H₂ made the N₂ amount fall.',
      title: 'More of One Reactant',
      body: 'The H₂ pushed Q below K. The vessel then made more NH₃ and used up N₂ as well as H₂, until Q was back on K.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-squeeze',
    title: 'Squeezing the Vessel',
    prompt: 'Squeeze the vessel, then set the dial to whether it holds more, fewer or the same gas molecules once settled.',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v', { x: 52, y: 30 }, { ...HABER, dials: { vol: { min: 0.5, max: 1, step: 0.25, value: 1 } } }),
        selectorFixture('ans', 'Gas molecules', { x: 127, y: 24 }, { options: COUNT, start: 4, list: true })
      ]
    }),
    hints: [
      'Use the "Volume" dial, the "Run" key and the answer dial.',
      'Count the spheres in the window now and compare them with the count printed for before the squeeze.',
      'Follow Q against K just after the squeeze and once the lines are flat, and see which gases the amounts moved toward.'
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
      return { ok: false, msg: `The window shows ${s.total} spheres now and ${s.before} before the squeeze.` };
    },
    reward: {
      log: 'Squeezing the vessel left fewer gas molecules.',
      title: 'Less Room',
      body: 'Halving the volume pushed Q below K, so the vessel made more NH₃. Four molecules of N₂ and H₂ make two of NH₃, so a squeezed vessel ends with fewer molecules.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Argon in the Vessel',
    // A PREDICT STAGE: the vessel is not on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Lay the card for what adding argon, a gas that does not react, does to the NH₃ amount in a fixed-size vessel.',
    widget,
    table: pansTable({
      pieces: [note('more', GUESS.more, { x: 26, y: 16 }), note('less', GUESS.less, { x: 76, y: 16 }), note('same', GUESS.same, { x: 126, y: 16 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 76, y: 44 }, size: { w: 44, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Think about what the argon does to the pressure of N₂, H₂ and NH₃ themselves.',
      'Decide whether the argon changes how much room, or how much of the pressure, the gases that react have.'
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
      return g && SHORT[g] ? `You predicted ${SHORT[g]}. Add argon to the vessel and set the dial to what happens to the NH₃ amount.` : 'Add argon to the vessel and set the dial to what happens to the NH₃ amount.';
    },
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v', { x: 52, y: 30 }, { ...HABER, cap2: 'pressure', dials: { inert: { max: 2, step: 0.5 } } }),
        selectorFixture('ans', 'NH₃ amount', { x: 127, y: 24 }, { options: UP, start: 4, list: true })
      ]
    }),
    hints: [
      'Use the "Add argon" dial, the "Run" key and the answer dial.',
      'Compare the pressure and the NH₃ line with their readings before the argon went in, and watch the Q needle.',
      'Ask whether the argon changed how much room, or how much pressure, each of N₂, H₂ and NH₃ has.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
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
        body: `${verdict}Argon raised the total pressure but not the pressure of N₂, H₂ or NH₃, so Q stayed on K and nothing shifted. Squeezing raised the pressure of every gas that reacts; argon at a fixed volume does not.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-heat',
    title: 'Heating Two Vessels',
    prompt: 'Heat each vessel, then set the dial to where heating makes K larger.',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v1', { x: 38, y: 29 }, { ...HABER, window: false, w: 70, title: 'Vessel 1: N₂ + 3 H₂ ⇌ 2 NH₃', dials: { temp: { min: 673, max: 773, step: 25 } } }),
        vesselFixture('v2', { x: 112, y: 29 }, { ...NO2, window: false, w: 70, dials: { temp: { min: 298, max: 398, step: 25 } } }),
        selectorFixture('ans', 'Heating makes K larger in', { x: 75, y: 73 }, { options: ['Vessel 1', 'Vessel 2', 'Both vessels', 'Neither vessel', ' '], start: 5, w: 56, list: true })
      ]
    }, { h: 90 }),
    hints: [
      'Use the two "Temperature" dials, the two "Run" keys and the answer dial.',
      'Compare the K printed under each graph with the faint mark where it stood before the heating.',
      'Read K at the lowest and the highest temperature in each vessel before choosing.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const a = vesselRead(t, 'v1'); const b = vesselRead(t, 'v2');
      if (!a.changed && !b.changed) return { ok: false, msg: 'Neither vessel has been heated yet.' };
      const one = (name, r) => (r.changed ? `${name}\'s K reads ${fmtQ(r.K0)} at ${r.base.T} K and ${fmtQ(r.res.post.K)} at ${r.res.post.T} K.` : `${name} has not been heated: its K reads ${fmtQ(r.K0)}.`);
      return { ok: false, msg: `${one('Vessel 1', a)} ${one('Vessel 2', b)}` };
    },
    reward: {
      log: 'Heating lowered K in one vessel and raised it in the other.',
      title: 'Heat Changes K',
      body: 'Vessel 1 gives out heat as it makes NH₃, so heating lowered its K and sent it back toward N₂ and H₂. Vessel 2 takes in heat as it makes NO₂, so heating raised its K. Of all the changes so far, only temperature moved K.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-powder',
    title: 'Iron Powder',
    prompt: 'Run both vessels, then set the dial to what the iron powder changes.',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v1', { x: 38, y: 29 }, { ...HABER, settled: false, window: false, w: 70, dials: {}, title: 'Vessel 1: without iron powder' }),
        vesselFixture('v2', { x: 112, y: 29 }, { ...HABER, settled: false, window: false, w: 70, dials: {}, catalyst: true, title: 'Vessel 2: with iron powder' }),
        selectorFixture('ans', 'The iron powder changes', { x: 75, y: 73 }, { options: ['The final NH₃ amount', 'How soon it settles', 'Both of those', 'Neither of those', ' '], start: 5, w: 56, list: true })
      ]
    }, { h: 90 }),
    hints: [
      'Use the "Run" key on each vessel and the answer dial.',
      'Compare where each NH₃ line ends, the tick each vessel settles by, and the Q needle and K in the two.',
      'Run each vessel until its lines are flat, then compare where the NH₃ line ends and how many ticks it took to get there.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const a = vesselRead(t, 'v1'); const b = vesselRead(t, 'v2');
      if (a.t === 0 && b.t === 0) return { ok: false, msg: 'Neither vessel has been run yet.' };
      if (a.t === 0 || b.t === 0) return { ok: false, msg: `Vessel ${a.t === 0 ? 1 : 2} has not been run yet.` };
      const one = (name, r) => `${name} holds ${amt(r.now.n.NH3)} mol of NH₃ at tick ${r.t}${r.settled ? ` and settled by tick ${r.tick}` : ' and is still changing'}.`;
      return { ok: false, msg: `${one('Vessel 1', a)} ${one('Vessel 2', b)}` };
    },
    reward: {
      log: 'The iron powder gave the same amounts, sooner.',
      title: 'A Catalyst',
      body: 'Both vessels settled at the same amounts, with Q on the same K, but the vessel with iron powder got there in far fewer ticks. Iron powder is a catalyst: it speeds up a reaction in both directions equally, so it changes how soon a vessel settles and never where.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-q',
    title: 'Moving Q',
    prompt: 'Sort the changes by what each does to Q at the moment it is made.',
    widget,
    table: pansTable({
      pieces: [
        chip('c-addH2', 'Add H₂', { x: 84, y: 9.5 }), chip('c-takeNH3', 'Take out NH₃', { x: 110, y: 9.5 }), chip('c-addNH3', 'Add NH₃', { x: 136, y: 9.5 }),
        chip('c-expand', 'Expand', { x: 84, y: 22.5 }), chip('c-argon', 'Add argon', { x: 110, y: 22.5 }), chip('c-cat', 'Catalyst', { x: 136, y: 22.5 })
      ],
      fixtures: [
        vesselFixture('q', { x: 36, y: 30 }, {
          ...HABER, window: false, w: 66, Vmax: 2, picks: PICKS, title: 'Vessel: N₂ + 3 H₂ ⇌ 2 NH₃', dials: { pick: { labels: PICKS.map(p => p.label) } }
        })
      ],
      zones: {
        trays: [
          { id: 'below', label: 'Q below K', at: { x: 84, y: 49 }, size: { w: 25, h: 21 }, cell: 24, cellH: 10 },
          { id: 'above', label: 'Q above K', at: { x: 110, y: 49 }, size: { w: 25, h: 21 }, cell: 24, cellH: 10 },
          { id: 'equal', label: 'Q equal to K', at: { x: 136, y: 49 }, size: { w: 25, h: 21 }, cell: 24, cellH: 10 }
        ]
      }
    }),
    hints: [
      'Use the "Change" dial on the vessel and the three trays.',
      'For each chip, set the dial to it and read where the Q needle stands against the K line before pressing "Run".',
      'Compare Q with K once for every chip, then lay each chip in the tray that matches the reading.'
    ],
    check(state) {
      const t = state.table;
      if (SORT_CHIPS.some(([id]) => !['below', 'above', 'equal'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Every change needs a tray.' };
      const f = t.fixtures.q;
      const wrong = SORT_CHIPS.find(([id, idx]) => whereIs(t, id) !== pickKind(f, idx).kind);
      if (!wrong) return { ok: true };
      const [id, idx] = wrong;
      const { res } = pickKind(f, idx);
      return { ok: false, msg: `With "${t.pieces[id].label}" set on the vessel, Q reads ${fmtQ(res.post.Q)} and K reads ${fmtQ(res.post.K)}.` };
    },
    reward: {
      log: 'The changes were sorted by what they did to Q.',
      title: "Le Chatelier's Principle",
      body: 'Every change except the argon and the catalyst moved Q away from K, and a settled vessel then moves until Q is back on K. That is Le Chatelier\'s principle: a vessel pushed out of balance moves to undo the push.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-take',
    title: 'Taking NH₃ Out',
    prompt: 'Take some NH₃ out of the settled vessel, then set the dial to its NH₃ amount once it settles again, compared with before.',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('v', { x: 52, y: 30 }, { ...HABER, dials: { take: { name: 'NH₃', max: 0.5, step: 0.25 } } }),
        selectorFixture('ans', 'NH₃ amount', { x: 127, y: 24 }, { options: SAME3, start: 4, list: true })
      ]
    }),
    hints: [
      'Use the "Take out NH₃" dial, the "Run" key and the answer dial.',
      'Watch the NH₃ line against its dashed level from before, and the Q needle against the K line.',
      'Compare the NH₃ amount once the lines are flat with its amount before any came out, and ask whether the NH₃ taken out is still in the vessel.'
    ],
    check(state) {
      const t = state.table;
      const v = dialNo(t, 'ans');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const r = vesselRead(t, 'v');
      if (!r.changed) return { ok: false, msg: 'No NH₃ has been taken out of the vessel yet.' };
      if (r.t === 0) return { ok: false, msg: 'No time has passed since the NH₃ came out.' };
      return { ok: false, msg: `With ${t.fixtures.v.dials.take.value} mol of NH₃ taken out, the NH₃ line reads ${amt(r.now.n.NH3)} mol now and stood at ${amt(r.base.n.NH3)} mol before.` };
    },
    reward: {
      log: 'Taking NH₃ out left the vessel settling with less NH₃ than before.',
      title: 'Taking a Product Out',
      body: 'Taking NH₃ out pushed Q below K, so the vessel made some NH₃ again, but never all of it back, because the NH₃ taken out was gone. A plant that takes its product out as it forms keeps the vessel making more.'
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
const sortAll = (override = {}) => SORT_CHIPS.map(([id, , kind]) => put(id, `tray:${override[id] || kind}`));

export const SOLUTIONS = [
  [dial('v', 'add', 1), ...runs('v', 3), dial('ans', 'value', 2)],
  [dial('v', 'vol', 0.5), ...runs('v', 6), dial('ans', 'value', 2)],
  [put('same', 'slot:guess')],
  [dial('v', 'inert', 2), ...runs('v', 3), dial('ans', 'value', 3)],
  [dial('v1', 'temp', 773), dial('v2', 'temp', 398), ...runs('v1', 2), ...runs('v2', 2), dial('ans', 'value', 2)],
  [...runs('v1', 6), ...runs('v2', 6), dial('ans', 'value', 2)],
  [dial('q', 'pick', 5), ...sortAll()],
  [dial('v', 'take', 0.5), ...runs('v', 6), dial('ans', 'value', 2)]
];

export const MISSES = [
  [dial('v', 'add', 1), ...runs('v', 3), dial('ans', 'value', 1)],
  [dial('v', 'vol', 0.5), ...runs('v', 6), dial('ans', 'value', 1)],
  [],
  [dial('v', 'inert', 2), ...runs('v', 3), dial('ans', 'value', 1)],
  [dial('v1', 'temp', 773), dial('v2', 'temp', 398), ...runs('v1', 2), ...runs('v2', 2), dial('ans', 'value', 4)],
  [...runs('v1', 6), ...runs('v2', 6), dial('ans', 'value', 3)],
  [dial('q', 'pick', 6), ...sortAll({ 'c-argon': 'below', 'c-addH2': 'equal' })],
  [dial('v', 'take', 0.5), ...runs('v', 6), dial('ans', 'value', 1)]
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
