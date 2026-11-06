/**
 * Unit 10 · Bench 2 — Which Metal Gives (q2-activity)
 *
 * Brinewire's activity bench, on the cell kit (`table/kits/cell.js`; the dip rack, its nails and its strips are `cell-dip.js`). A strip of
 * metal is dipped in beakers of other metals' ions; the window shows a coating of the other metal, bubbles, or nothing. Eight stages and ONE
 * click: the belief that if zinc coats from a copper solution, copper coats from a zinc solution too.
 *
 *   1  find the solution that coated both of the other metals                                  -> displacement
 *   2  rank zinc, iron, lead and copper from four racks of dips                                 -> activity series
 *   3  PREDICT: what does a copper strip do in a zinc solution?
 *   4  TEST: dip it                                                                             -> the exchange goes one way
 *   5  place hydrogen among five metals from the strips that bubble in acid                    -> metals above hydrogen give it
 *   6  which partner wired to an iron nail keeps blue spots off it                              -> sacrificial anode
 *   7  place the sealed metal X in the list of four                                            -> a metal sits between two others
 *   8  choose the strip that takes copper out of a copper and iron mix and leaves the iron      -> a new case of the same order
 *
 * THE WRONG MODEL IS ON THE TABLE. The zinc strip comes out of the copper solution coated with copper and thinner; the copper strip
 * dipped in the zinc solution comes out as it went in. A swap that runs one way does not run back.
 *
 * Every window is `engine/celldata-q2-activity.js` (which is `celldata.js`'s displaces / givesHydrogen / protectsIron). The rack prints no
 * log of results: each beaker keeps a mark for the strips dipped in it, and the player's own dips are the evidence. This quest pays no XP,
 * writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { cellTable, selectorFixture, note, tag, pieceIn, dialValue } from '../../table/kits/cell.js';
import { dipFixture, nailsFixture, stripPiece, hydrogenPiece, triedIn, dipRead, nailsAged } from '../../table/kits/cell-dip.js';
import { METALS, activityOrder, givesHydrogen, protectsIron } from '../../engine/celldata.js';
import { dipResult, dipWords, coated, stripsTakingOnly } from '../../engine/celldata-q2-activity.js';

import { attachScenes } from '../../table/kits/cell-attach.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bdisplacement\b/i, introducedAt: 1 },
  { term: /\bactivity series\b/i, introducedAt: 2 },
  { term: /\bsacrificial anode\b/i, introducedAt: 6 }
];

/** Built quests whose words this bench uses: none (it uses only electrons and ions, earned in Tallow). */
export const BUILDS_ON = [];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit10/q2-activity';
const GUESS = {
  coat: 'Coated with zinc',
  clean: 'Stays clean',
  dissolve: 'Dissolves',
  swap: 'Coated and thinner'
};

/* ---------------------------------------------------------------- what each stage puts on the table (inputs; every picture is the planner's) */

const S1_METALS = ['zn', 'cu', 'ag'];
const S2_METALS = ['cu', 'zn', 'pb', 'fe'];
const S4_METALS = ['zn', 'cu'];
const S5_METALS = ['mg', 'zn', 'fe', 'cu', 'ag'];
const S6_PARTNERS = ['zn', 'cu', 'mg', 'sn'];
const S7_KNOWN = ['zn', 'fe', 'pb', 'cu'];
const S7_X = 'ni';
const S8_STRIPS = ['zn', 'fe', 'mg', 'ag'];

const S1_ANSWER = S1_METALS.find(ion => S1_METALS.filter(m => m !== ion).every(m => coated(m, ion)));
const S2_WANT = activityOrder(S2_METALS);
const S7_WANT = activityOrder([...S7_KNOWN, S7_X]);
const S8_ANSWER = stripsTakingOnly(S8_STRIPS, 'cu', 'fe')[0];

const nm = id => METALS[id].name;
const Nm = id => nm(id)[0].toUpperCase() + nm(id).slice(1);
const solutionOf = id => `${METALS[id].ion} solution`;
const list = names => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const bid = (metals, id) => `b${metals.indexOf(id)}`;
const seat = (metals, id) => `slot:dip.${bid(metals, id)}`;

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const run = fixture => ({ run: fixture });

/** The rack of beakers for a list of solutions (metal ids) and the seats over them. */
const rack = (ions, at) => dipFixture('dip', at, { beakers: ions.map((ion, i) => ({ id: `b${i}`, ion })) });
/** The strips, in a column or a row. `caption` only on the first of a row. */
const strips = (metals, at, step, { row = false, caption = true } = {}) => metals.map((m, i) =>
  stripPiece(`s-${m}`, m, row ? { x: at.x + i * step, y: at.y } : { x: at.x, y: at.y + i * step }, caption === true || i === 0 ? {} : { caption: null }));

/** The dip rack answered by tapping the beaker itself (`props.pick`, read by `gestures.js`): column i sets the hidden answer dial to i + 1. */
const tapBeakers = (fx, n, target = 'pick') => ({ ...fx, props: { ...fx.props, pick: { fixture: target, dial: 'value', cols: Array.from({ length: n }, (_, i) => ({ x0: 2 + i * 30, x1: 32 + i * 30, value: i + 1 })) } } });
/** An answer dial that is only a readout: nothing can turn it, the tap on the thing sets it. */
const readout = fx => ({ ...fx, props: { ...fx.props, hidden: Object.keys(fx.dials) } });

/** The dips a strip has been given anywhere on the rack: `{ beaker id, result }` for the first beaker that holds a mark for it. */
function triedAny(t, id) {
  const r = dipRead({ fixtures: t.fixtures, pieces: t.pieces }, 'dip').find(x => x.tried.some(y => y.id === id));
  return r ? r.tried.find(y => y.id === id).res : null;
}

/** What a beaker showed for a strip, in words for a refusal: the reading, or that the dip has not been made. */
function dipLine(t, metals, stripId, ionId) {
  const res = triedIn({ fixtures: t.fixtures, pieces: t.pieces }, 'dip', bid(metals, ionId), stripId);
  if (!res) return `The ${nm(stripId)} strip has not been dipped in the ${solutionOf(ionId)} yet.`;
  return res.coats.length ? `The ${nm(stripId)} strip took a ${dipWords(res)} coating in the ${solutionOf(ionId)}.` : `The ${nm(stripId)} strip stayed clean in the ${solutionOf(ionId)}.`;
}

/* ---------------------------------------------------------------- stages */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-coat',
    title: 'Coated or Clean',
    prompt: 'Find the solution that put a coating on both of the other metals.',
    widget,
    table: (() => {
      const d = rack(S1_METALS, { x: 49, y: 33 });
      return cellTable({
        pieces: strips(S1_METALS, { x: 20, y: 76 }, 36, { row: true, caption: false }),
        fixtures: [
          tapBeakers(d.fixture, S1_METALS.length),
          readout(selectorFixture('pick', 'Answer', { x: 140, y: 36 }, { options: [...S1_METALS.map(solutionOf), ' '], start: 4, w: 54, list: true }))
        ],
        zones: { slots: d.slots }
      }, { w: 176, h: 92 });
    })(),
    hints: [
      'Drag a strip over a beaker to dip it, then tap the beaker you choose.',
      'Compare how each strip looks after it is dipped in each solution.',
      'Check each solution for a coating on both strips that are not its own metal.'
    ],
    check(state) {
      const t = state.table;
      const v = dialValue(t, 'pick');
      if (v === S1_METALS.length + 1) return { ok: false, notYet: true, msg: 'Tap a beaker.' };
      const ion = S1_METALS[v - 1];
      if (ion === S1_ANSWER) return { ok: true };
      const other = S1_METALS.filter(m => m !== ion).find(m => !coated(m, ion));
      return { ok: false, msg: dipLine(t, S1_METALS, other, ion) };
    },
    get reward() {
      const lines = S1_METALS.map(ion => ({ ion, got: S1_METALS.filter(m => m !== ion && coated(m, ion)) }));
      const most = lines.find(l => l.ion === S1_ANSWER);
      const rest = lines.filter(l => l.ion !== S1_ANSWER).sort((p, q) => q.got.length - p.got.length)
        .map(l => (l.got.length ? `only ${list(l.got.map(nm))} in the ${solutionOf(l.ion)}` : `no strip in the ${solutionOf(l.ion)}`));
      return {
        log: 'One solution coated both of the other strips.',
        title: 'Displacement',
        body: `${Nm(most.got[0])} and ${nm(most.got[1])} were coated in the ${solutionOf(most.ion)}. A coating means displacement: the strip's metal went into the solution as ions.`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-rank',
    title: 'Ranking Four Metals',
    prompt: 'Rank zinc, iron, lead and copper from the metal that gives electrons most readily to the one that gives least.',
    widget,
    table: (() => {
      const d = rack(S2_METALS, { x: 64, y: 33 });
      return cellTable({
        pieces: strips(S2_METALS, { x: 19, y: 71 }, 30, { row: true }),
        fixtures: [d.fixture],
        zones: {
          slots: d.slots,
          rail: { at: { x: 88, y: 108 }, size: { w: 150, h: 12 }, first: 'Gives most readily', last: 'Gives least readily', items: [], start: [] }
        }
      }, { w: 200, h: 122 });
    })(),
    hints: [
      'Dip the strips in the beakers, then drag the four strips onto the rail.',
      'Each beaker keeps a mark for every strip dipped in it; compare which strips were coated in which solutions.',
      'A strip that is coated has given electrons to the ions in the solution, so rank the metals by how many of the other solutions each one coated in.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < S2_METALS.length) return { ok: false, notYet: true, msg: `Put all ${S2_METALS.length} strips on the rail.` };
      if (order.join() === S2_WANT.map(m => `s-${m}`).join()) return { ok: true };
      const E = id => METALS[id.slice(2)].E0;
      const k = order.findIndex((id, i) => i > 0 && E(id) < E(order[i - 1]));
      const a = order[k - 1].slice(2); const b = order[k].slice(2);
      return { ok: false, msg: `${Nm(a)} sits left of ${nm(b)}. ${dipLine(t, S2_METALS, b, a)}` };
    },
    get reward() {
      const o = S2_WANT;
      const parts = o.slice(0, -1).map((m, i) => `${nm(m)} displaced ${list(o.slice(i + 1).map(nm))}`);
      return {
        log: 'The strips fell into an order.',
        title: 'Activity Series',
        body: `From most to least ready to give electrons the order is ${o.map(nm).join(', ')}: the activity series.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Back the Other Way',
    // A PREDICT STAGE: no rack is on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'A zinc strip is coated with copper in a copper solution; what does a copper strip do in a zinc solution?',
    widget,
    table: cellTable({
      pieces: [
        tag('st1', 'Zinc strip in copper solution: coated with copper', { x: 40, y: 9 }),
        tag('st2', 'Copper strip in zinc solution: ?', { x: 112, y: 9 }),
        note('coat', GUESS.coat, { x: 30, y: 30 }),
        note('clean', GUESS.clean, { x: 80, y: 30 }),
        note('dissolve', GUESS.dissolve, { x: 30, y: 50 }),
        note('swap', GUESS.swap, { x: 80, y: 50 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 128, y: 40 }, size: { w: 36, h: 14 } }] }
    }, { w: 150, h: 62 }),
    hints: [
      'Use the four cards and the slot.',
      'Picture the zinc strip in the copper solution, then the copper strip in the zinc solution.',
      'Ask whether a swap that happens one way must happen the other way too.'
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
      body: 'Next, a copper strip is dipped in the zinc solution.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-test',
    title: 'Copper in Zinc',
    get prompt() { return guessLine('Dip a copper strip in the zinc solution and say what happens to it.', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const d = rack(S4_METALS, { x: 34, y: 33 });
      return cellTable({
        pieces: strips(S4_METALS, { x: 82, y: 18 }, 22),
        fixtures: [
          d.fixture,
          selectorFixture('pick', 'What happens', { x: 122, y: 36 }, { options: [GUESS.coat, GUESS.clean, GUESS.dissolve, GUESS.swap, ' '], start: 5, w: 52, list: true })
        ],
        zones: { slots: d.slots }
      }, { w: 150, h: 68 });
    })(),
    hints: [
      'Dip the copper strip in the zinc solution, then set the answer dial.',
      'Compare the copper strip in the zinc solution with the zinc strip in the copper solution.',
      'Choose the answer that matches what the copper strip looks like in its window.'
    ],
    check(state) {
      const t = state.table;
      const v = dialValue(t, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the answer dial.' };
      if (v === 2) return { ok: true };
      const res = triedIn({ fixtures: t.fixtures, pieces: t.pieces }, 'dip', bid(S4_METALS, 'zn'), 'cu');
      if (!res) return { ok: false, msg: `The copper strip has not been dipped in the ${solutionOf('zn')} yet.` };
      return { ok: false, msg: `That does not match the window of the copper strip in the ${solutionOf('zn')}; compare it with the zinc strip in the ${solutionOf('cu')}.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = g === 'clean' ? 'The copper strip did stay clean, as you predicted. ' : g ? 'The copper strip stayed clean, not what you predicted. ' : '';
      return {
        log: 'Copper did not coat in the zinc solution.',
        title: 'One Way Only',
        body: `${verdict}The zinc strip was coated with copper, but the copper strip stayed clean in the zinc solution. A displacement runs one way only: the more active metal takes the place of the less active one, never the reverse.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-hydrogen',
    title: 'Hydrogen in the List',
    prompt: 'Place hydrogen in the list of the five metals, from most readily giving electrons to least.',
    widget,
    table: (() => {
      const d = rack(S5_METALS.map(() => 'acid'), { x: 79, y: 33 });
      return cellTable({
        pieces: [
          ...strips(S5_METALS, { x: 18, y: 72 }, 34, { row: true, caption: false }),
          hydrogenPiece('r-h', { x: 177, y: 72 })
        ],
        fixtures: [d.fixture],
        zones: {
          slots: d.slots,
          rail: { at: { x: 88, y: 114 }, size: { w: 150, h: 12 }, first: 'Gives most readily', last: 'Gives least readily', items: [], start: [] }
        }
      }, { w: 192, h: 128 });
    })(),
    hints: [
      'Dip a strip in each acid beaker, then drag the five strips and the hydrogen onto the rail.',
      'Look at which strips give bubbles in the acid and which stay clean.',
      'Hydrogen belongs between the metals that bubbled and the metals that did not, with the metals that give most readily on the left.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < S5_METALS.length + 1) return { ok: false, notYet: true, msg: `Put all ${S5_METALS.length + 1} pieces on the rail.` };
      const h = order.indexOf('r-h');
      for (let i = 0; i < order.length; i++) {
        if (i === h) continue;
        const m = order[i].slice(2);
        const before = i < h;
        if (before === givesHydrogen(m)) continue;
        const res = triedAny(t, m);
        if (!res) return { ok: false, msg: `The ${nm(m)} strip has not been dipped in an acid beaker yet.` };
        return { ok: false, msg: `${Nm(m)} sits ${before ? 'left' : 'right'} of hydrogen, but its strip ${res.gas ? 'gave bubbles' : 'stayed clean'} in the acid.` };
      }
      return { ok: true };
    },
    get reward() {
      const up = activityOrder(S5_METALS.filter(givesHydrogen)); const down = activityOrder(S5_METALS.filter(m => !givesHydrogen(m)));
      return {
        log: 'Some strips bubbled in acid and some did not.',
        title: 'Hydrogen in the List',
        body: `${Nm(up[0])}, ${list(up.slice(1).map(nm))} gave bubbles of hydrogen in the acid, and ${list(down.map(nm))} did not. Hydrogen sits in the activity series too: the metals above it give hydrogen from an acid, and the metals below it do not.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-nails',
    title: 'Iron and a Partner',
    prompt: 'Find which metals, wired to an iron nail, keep it from rusting in brine.',
    widget,
    table: (() => {
      const n = nailsFixture('nails', { x: 64, y: 31 }, { partners: S6_PARTNERS });
      return cellTable({
        fixtures: [n]
      }, { w: 204, h: 114 });
    })(),
    hints: [
      'Press "Leave a Week", then tap each nail that has no blue spots.',
      'Compare the nails after the week: the blue spots show where iron is dissolving.',
      'Tap the nail of every beaker that shows no blue spots.'
    ],
    check(state) {
      const t = state.table;
      const marks = t.fixtures.scene.dials;
      const inTray = S6_PARTNERS.filter((m, i) => Math.round(marks[`n${i}`].value) === 1);
      if (!inTray.length) return { ok: false, notYet: true, msg: 'Tap the nails with no blue spots.' };
      const want = S6_PARTNERS.filter(protectsIron);
      const wrong = inTray.find(m => !want.includes(m)) ?? want.find(m => !inTray.includes(m));
      if (wrong == null) return { ok: true };
      if (!nailsAged(t, 'nails')) return { ok: false, msg: 'The nails have not been left for a week yet, so no beaker shows any blue spots.' };
      return { ok: false, msg: `The nail wired to ${nm(wrong)} ${protectsIron(wrong) ? 'showed no blue spots' : 'showed blue spots'}.` };
    },
    get reward() {
      const p = S6_PARTNERS.filter(protectsIron); const q = S6_PARTNERS.filter(m => !protectsIron(m));
      return {
        log: 'The nails wired to some metals stayed free of spots.',
        title: 'Sacrificial Anode',
        body: `The nails wired to ${list(p.map(nm))} showed no blue spots: a more active partner gives its electrons in place of the iron, as a sacrificial anode.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-sealed',
    title: 'The Sealed Strip',
    prompt: 'Place the sealed metal X in the list of zinc, iron, lead and copper.',
    widget,
    table: (() => {
      const d = rack(S7_KNOWN, { x: 64, y: 33 });
      return cellTable({
        pieces: [
          stripPiece('s-x', S7_X, { x: 148, y: 22 }, { sealed: true }),
          ...S7_KNOWN.map((m, i) => stripPiece(`s-${m}`, m, { x: 30 + i * 36, y: 70 }, { caption: null }))
        ],
        fixtures: [d.fixture],
        zones: {
          slots: d.slots,
          rail: { at: { x: 88, y: 92 }, size: { w: 150, h: 12 }, first: 'Gives most readily', last: 'Gives least readily', items: S7_KNOWN.map(m => `s-${m}`), start: S7_KNOWN.map(m => `s-${m}`) }
        }
      }, { w: 176, h: 108 });
    })(),
    hints: [
      'Dip the X strip in each beaker, then drag it to its place on the rail.',
      'Compare which solutions coated the X strip with the order of the four known metals on the rail.',
      'X belongs after the metals whose solutions left it clean and before the metals whose solutions coated it.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      const metalOf = id => (id === 's-x' ? S7_X : id.slice(2));
      if (order.length < S7_KNOWN.length + 1) return { ok: false, notYet: true, msg: 'Put the X strip on the rail.' };
      if (order.map(metalOf).join() === S7_WANT.join()) return { ok: true };
      const E = id => METALS[metalOf(id)].E0;
      const k = order.findIndex((id, i) => i > 0 && E(id) < E(order[i - 1]));
      const a = metalOf(order[k - 1]); const b = metalOf(order[k]);
      if (b === S7_X) return { ok: false, msg: `X sits right of ${nm(a)}. ${dipLine(t, S7_KNOWN, 'ni', a).replace('The nickel strip', 'The X strip')}` };
      if (a === S7_X) return { ok: false, msg: `X sits left of ${nm(b)}. ${dipLine(t, S7_KNOWN, 'ni', b).replace('The nickel strip', 'The X strip')}` };
      return { ok: false, msg: `${Nm(a)} sits left of ${nm(b)}, which is not the order the earlier dips gave.` };
    },
    get reward() {
      const got = S7_KNOWN.filter(m => coated(S7_X, m)); const clean = S7_KNOWN.filter(m => !coated(S7_X, m));
      const o = S7_WANT; const at = o.indexOf(S7_X);
      return {
        log: 'The sealed strip found its place.',
        title: 'Between Two Metals',
        body: `Strip X was coated in the ${list(got.map(nm))} solutions but not the ${list(clean.map(nm))} solutions, so it sits between ${nm(o[at - 1])} and ${nm(o[at + 1])}: it was ${nm(S7_X)}.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-mix',
    title: 'Take Out the Copper',
    prompt: 'Choose a strip that takes the copper out of a solution of copper(II) and iron(II) ions and leaves the iron ions.',
    widget,
    table: (() => {
      const d = rack(S8_STRIPS.map(() => 'mix'), { x: 64, y: 33 });
      return cellTable({
        pieces: strips(S8_STRIPS, { x: 19, y: 71 }, 30, { row: true, caption: false }),
        fixtures: [d.fixture],
        zones: { slots: [...d.slots, { id: 'answer', label: 'Chosen strip', at: { x: 64, y: 96 }, size: { w: 30, h: 12 } }] }
      }, { w: 176, h: 112 });
    })(),
    hints: [
      'Dip each strip in a beaker, then lay the strip you choose in the answer seat.',
      'Compare the coating on each strip, and the ions left in its beaker, with the copper and iron ions at the start.',
      'Choose the strip that is coated with copper alone while the beaker still holds iron ions.'
    ],
    check(state) {
      const t = state.table;
      const chosen = pieceIn(t, 'answer');
      if (!chosen) return { ok: false, notYet: true, msg: 'Lay a strip in the answer seat.' };
      const m = chosen.props.metal;
      if (m === S8_ANSWER) return { ok: true };
      const res = triedAny(t, m);
      if (!res) return { ok: false, msg: `The ${nm(m)} strip has not been dipped in a beaker yet.` };
      return { ok: false, msg: `The ${nm(m)} strip came out ${res.coats.length ? `coated ${dipWords(res)}` : 'clean'}.` };
    },
    get reward() {
      const both = S8_STRIPS.filter(m => dipResult(m, 'mix').coats.length === 2); const none = S8_STRIPS.filter(m => !dipResult(m, 'mix').coats.length);
      return {
        log: 'One strip took out the copper alone.',
        title: 'A New Case',
        body: `${Nm(S8_ANSWER)} took out the copper only; ${list(both.map(nm))} took out the iron too, and ${list(none.map(nm))} neither. A strip displaces only the less active metals.`
      };
    }
  }
];

/** Every stage gets its mechanism view (3D at 3D On, flat otherwise); predict stages get a lead-in. */
attachScenes(STAGES, {
  compact: [6], inside: [1, 4, 5, 7], demos: { 2: 'zn-in-cu' },
  own: { 5: { sitesKey: 'nails', dials: Object.fromEntries(S6_PARTNERS.map((m, i) => [`n${i}`, { min: 0, max: 1, step: 1, value: 0, label: `Nail ${i + 1}` }])) } }
});

export const DEBRIEF = {
  title: 'Which Metal Gives',
  body: 'A metal displaces the ions of any metal below it in the activity series, and the swap never runs the other way. The same order tells which metals give hydrogen from an acid and which protect iron.'
};

/** Dips for the scripts: lay a strip in the seat of one beaker. */
const dip = (metals, strip, ion) => put(`s-${strip}`, seat(metals, ion));

export const SOLUTIONS = [
  [dip(S1_METALS, 'zn', 'ag'), dip(S1_METALS, 'cu', 'ag'), dip(S1_METALS, 'ag', 'cu'), dial('pick', 'value', S1_METALS.indexOf(S1_ANSWER) + 1)],
  [
    ...S2_METALS.flatMap(ion => S2_METALS.filter(m => m !== ion).map(m => dip(S2_METALS, m, ion))),
    ...S2_WANT.map((m, i) => put(`s-${m}`, `rail:${i}`))
  ],
  [put('clean', 'slot:guess')],
  [dip(S4_METALS, 'cu', 'zn'), dial('pick', 'value', 2)],
  [
    ...S5_METALS.map(m => put(`s-${m}`, `slot:dip.b${S5_METALS.indexOf(m)}`)),
    ...[...S5_METALS.filter(givesHydrogen), 'h', ...S5_METALS.filter(m => !givesHydrogen(m))].map((m, i) => put(m === 'h' ? 'r-h' : `s-${m}`, `rail:${i}`))
  ],
  [run('nails'), ...S6_PARTNERS.map((m, i) => (protectsIron(m) ? dial('scene', `n${i}`, 1) : null)).filter(Boolean)],
  [...S7_KNOWN.map(m => dip(S7_KNOWN, 'x', m)), put('s-x', `rail:${S7_WANT.indexOf(S7_X)}`)],
  [...S8_STRIPS.map((m, i) => put(`s-${m}`, `slot:dip.b${i}`)), put(`s-${S8_ANSWER}`, 'slot:answer')]
];

export const MISSES = [
  [dip(S1_METALS, 'cu', 'zn'), dial('pick', 'value', 1)],
  [dip(S2_METALS, 'fe', 'zn'), put('s-fe', 'rail:0'), put('s-zn', 'rail:1'), put('s-pb', 'rail:2'), put('s-cu', 'rail:3')],
  [],
  [dip(S4_METALS, 'cu', 'zn'), dial('pick', 'value', 1)],
  [put('s-cu', 'slot:dip.b3'), ...['mg', 'zn', 'fe', 'cu', 'ag', 'h'].map((m, i) => put(m === 'h' ? 'r-h' : `s-${m}`, `rail:${i}`))],
  [run('nails'), dial('scene', `n${S6_PARTNERS.indexOf('cu')}`, 1), dial('scene', `n${S6_PARTNERS.indexOf('zn')}`, 1)],
  [put('s-x', seat(S7_KNOWN, 'fe')), put('s-x', 'rail:1')],
  [put('s-zn', 'slot:dip.b0'), put('s-zn', 'slot:answer')]
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

export const CHECKS = { S1_METALS, S1_ANSWER, S2_METALS, S2_WANT, S4_METALS, S5_METALS, S6_PARTNERS, S7_KNOWN, S7_X, S7_WANT, S8_STRIPS, S8_ANSWER, GUESS };
