/**
 * Unit 12 · Bench 2 — Many Charges (q2-charges)
 *
 * The ore crusher's sample deck, on the lode kit. One electron at a time is taken from an atom, and the bar for each shows what it cost;
 * the small ladder beside the bars shows which level each one left from. Six stages and ONE click: the belief that the energy to remove an
 * electron always rises across a row. Fe²⁺ has one more proton than Mn²⁺, yet its third electron costs less, and the ladder shows why: it
 * is the one electron of Fe²⁺ that shares an orbital.
 *
 *   1  calcium: two cheap electrons, then a jump at the inner shell        -> ionization energy; Ca forms only Ca²⁺
 *   2  manganese: seven at a steady climb, then the jump                    -> several charges; oxidation state
 *   3  PREDICT: Mn²⁺ or Fe²⁺, which holds its third electron harder?
 *   4  TEST: remove the third electron from each and compare              -> a paired electron is easier to remove
 *   5  which metals form an ion with a partly filled 3d subshell?          -> transition metal
 *   6  SEALED: a strip with no name, and four metals                       -> titanium
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { lodeTable, iestripFixture, iestripRead, dshellFixture, lchoiceFixture, chosen, pickOf, elemCard, note, lodeLeadFixture } from '../../table/kits/lode.js';
import { ELEMENTS, IE, COMMON_IONS, ionOf, jumpAfter } from '../../engine/lodedata.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bionization energ(y|ies)\b/i, introducedAt: 1 },
  { term: /\boxidation states?\b/i, introducedAt: 2 },
  { term: /\btransition metals?\b/i, introducedAt: 5 }
];

export const BUILDS_ON = ['unit12/q1-dblock'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit12/q2-charges';
const GUESS = { 'g-fe': 'Fe²⁺', 'g-mn': 'Mn²⁺', 'g-same': 'the same' };
const widget = { type: 'table', label: 'The bench' };
const cap = t => `${t[0].toUpperCase()}${t.slice(1)}`;
const kj = v => `${Math.round(v).toLocaleString('en-US')} kJ/mol`;

export function toolNoteFor() { return null; }

/** The refusal for a mark on a strip: what the bars either side of the mark show, or that the jump has not been measured. */
function markMiss(t, id, el) {
  const r = iestripRead(t, id);
  if (r.mark === 0) return { ok: false, notYet: true, msg: 'Tap the gap where the cost jumps.' };
  const j = jumpAfter(el);
  if (r.mark === j) return r.removed > j ? { ok: true } : { ok: false, msg: `Only ${r.removed} bars have been measured.` };
  if (r.removed <= r.mark) return { ok: false, msg: `Bar ${r.mark + 1} has not been measured yet.` };
  return { ok: false, msg: `Bar ${r.mark} is ${kj(r.costs[r.mark - 1])} and bar ${r.mark + 1} is ${kj(r.costs[r.mark])}.` };
}

const TRANS = new Set(['Ti', 'Cu']);

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-calcium',
    title: 'Calcium\'s Costs',
    briefing: { speaker: SPEAKER, body: 'Ionization energy is the energy needed to remove one electron from an atom or ion. Here the electrons are removed one at a time, and each bar is the cost of the next one.' },
    prompt: 'How many electrons can calcium lose before the cost of removing the next one jumps?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [iestripFixture('strip', { x: 75, y: 30 }, { el: 'Ca', w: 112, h: 50 })] }),
    hints: [
      'Press "Remove an Electron" a few times, then tap the gap where the bars jump.',
      'Compare each bar with the one before it, and the level each electron left from.',
      'An electron in a full inner shell sits much closer to the nucleus than one in the outer shell.'
    ],
    check(state) { return markMiss(state.table, 'strip', 'Ca'); },
    reward: {
      log: 'Calcium: two, then the jump.',
      title: 'Ionization Energy',
      body: 'Two. The third electron comes from the full 3p level inside, close to the nucleus, and costs four times the second, so calcium forms only Ca²⁺.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-manganese',
    title: 'Manganese\'s Costs',
    prompt: 'How many electrons can manganese lose before the cost of removing the next one jumps?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [iestripFixture('strip', { x: 75, y: 30 }, { el: 'Mn', w: 112, h: 50 })] }),
    hints: [
      'Press "Remove an Electron" until the cost jumps, then tap that gap.',
      'Compare the steps from bar 3 to bar 7 with the step from bar 7 to bar 8.',
      'The 4s and 3d electrons are close in energy, and only the inner shell sits far below them.'
    ],
    check(state) { return markMiss(state.table, 'strip', 'Mn'); },
    reward: {
      log: 'Manganese: seven, then the jump.',
      title: 'Oxidation States',
      body: 'Seven: two 4s and five 3d, each step a similar size, until the eighth comes from the inner shell. Each charge manganese can take, +2 up to +7, is an oxidation state.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'The Third Electron',
    predict: true,
    prompt: 'Which ion needs more energy to lose its third electron, Mn²⁺ or Fe²⁺?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-fe', 'Fe²⁺: one more proton holds it harder', { x: 32, y: 14 }),
        note('g-mn', 'Mn²⁺', { x: 32, y: 33 }),
        note('g-same', 'They need the same', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'ie-ti-v', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows two neighbours in the row losing their third electron.',
      'Iron has one more proton than manganese, and one more 3d electron.',
      'Think about which orbital that extra 3d electron has to go into.'
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
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the strips.' }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's4-third',
      title: 'Mn²⁺ and Fe²⁺',
      get prompt() { const g = guess(); return `Which ion needs more energy to lose its third electron, Mn²⁺ or Fe²⁺?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: lodeTable({
        pieces: [],
        fixtures: [
          pickOf(iestripFixture('mn', { x: 38, y: 23 }, { el: 'Mn', q0: 2, n: 1, mark: false, scale: 4000, w: 70, h: 40 }), 1),
          pickOf(iestripFixture('fe', { x: 112, y: 23 }, { el: 'Fe', q0: 2, n: 1, mark: false, scale: 4000, w: 70, h: 40 }), 2),
          lchoiceFixture('pick', 'Needs more energy', { x: 75, y: 50 }, { options: ['Mn²⁺', 'Fe²⁺'], w: 50 })
        ]
      }),
      hints: [
        'Press "Remove an Electron" on each ion, then tap the ion that cost more.',
        'Watch which orbital Fe²⁺\'s electron leaves from.',
        'Two electrons in one orbital repel each other, which makes one of them easier to remove.'
      ],
      check(state) {
        const t = state.table;
        const c = chosen(t, 'pick');
        if (!c) return { ok: false, notYet: true, msg: 'Tap the ion you choose.' };
        if (c === 'Mn²⁺') return { ok: true };
        const mn = iestripRead(t, 'mn'); const fe = iestripRead(t, 'fe');
        if (!mn.removed) return { ok: false, msg: 'Mn²⁺ has not lost an electron yet.' };
        if (!fe.removed) return { ok: false, msg: 'Fe²⁺ has not lost an electron yet.' };
        return { ok: false, msg: `Fe²⁺'s electron cost ${kj(fe.costs[0])} and Mn²⁺'s cost ${kj(mn.costs[0])}.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Mn²⁺ 3,248 kJ/mol, Fe²⁺ 2,957 kJ/mol.',
          title: 'The Paired Electron',
          body: `Mn²⁺. Fe²⁺'s sixth 3d electron shares an orbital and is repelled by its partner, so it leaves for less energy despite the extra proton.${g ? ` You predicted ${g}.` : ''}`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const L = dshellFixture('ladder', { x: 90, y: 19 }, { mode: 'show', load: true, ions: true, title: 'Atom and its ions', w: 116, h: 34 });
    const els = ['Ca', 'Ti', 'Cu', 'Zn'];
    return {
      id: 's5-transition',
      title: 'Transition Metals',
      briefing: { speaker: SPEAKER, body: 'A transition metal is an element that forms at least one ion with a partly filled 3d subshell. Copper\'s atom is one of two exceptions in the row: one 4s electron and ten in 3d.' },
      prompt: 'Which of these four metals are transition metals?',
      widget,
      table: lodeTable({
        pieces: els.map((el, i) => elemCard(`el-${el}`, el, { x: 10 + i * 14, y: 57 })),
        fixtures: [L.fixture],
        zones: {
          slots: [L.slot],
          trays: [
            { id: 'yes', label: 'Transition metal', at: { x: 92, y: 52.5 }, size: { w: 30, h: 21 }, cell: 14, cellH: 10.5 },
            { id: 'no', label: 'Not a transition metal', at: { x: 126, y: 52.5 }, size: { w: 30, h: 21 }, cell: 14, cellH: 10.5 }
          ]
        }
      }),
      hints: [
        'Lay each card on the ladder\'s square, then drag it to a tray.',
        'Count the 3d electrons in each of its ions, against the ten that 3d can hold.',
        'An ion counts only if its 3d subshell is neither empty nor full.'
      ],
      check(state) {
        const t = state.table;
        const placed = els.map(el => t.pieces[`el-${el}`]);
        const off = placed.filter(p => p.zone !== 'tray:yes' && p.zone !== 'tray:no');
        if (off.length) return { ok: false, notYet: true, msg: `${off.length} card${off.length > 1 ? 's are' : ' is'} not in a tray yet.` };
        for (const p of placed) {
          const el = p.props.el;
          const inYes = p.zone === 'tray:yes';
          if (inYes === TRANS.has(el)) continue;
          const ions = COMMON_IONS[el].map(q => `${el}${q > 1 ? ['', '', '²', '³'][q] : ''}⁺ shows ${ionOf(el, q).d} 3d electron${ionOf(el, q).d === 1 ? '' : 's'}`);
          return { ok: false, msg: `${cap(ELEMENTS[el].name)}: ${ions.join(', ')}.` };
        }
        return { ok: true };
      },
      reward: {
        log: 'Ti and Cu are transition metals.',
        title: 'Transition Metals',
        body: 'Ti³⁺ and Cu²⁺ each have a partly filled 3d subshell. Calcium has no 3d electrons and Zn²⁺ keeps all ten, so neither is a transition metal.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const L = dshellFixture('ladder', { x: 111, y: 22 }, { mode: 'show', load: true, title: 'Atom', w: 74, h: 40, slotAt: { x: 92, y: 52 } });
    return {
      id: 's6-sealed',
      title: 'The Sealed Strip',
      prompt: 'Which metal\'s electrons are being removed in the sealed strip?',
      widget,
      table: lodeTable({
        pieces: ['Sc', 'Ti', 'V', 'Cr'].map((el, i) => elemCard(`el-${el}`, el, { x: 10 + i * 14, y: 57 })),
        fixtures: [L.fixture, iestripFixture('strip', { x: 35, y: 22 }, { el: 'Ti', sealed: true, n: 6, mark: false, w: 66, h: 40 })],
        zones: { slots: [L.slot, { id: 'answer', label: 'The sealed metal', at: { x: 127, y: 52 }, size: { w: 24, h: 13 } }] }
      }),
      hints: [
        'Remove electrons from the sealed strip, and lay each card on the ladder\'s square.',
        'Compare where the strip jumps with the number of 4s and 3d electrons in each atom.',
        'The cost jumps once every 4s and 3d electron has gone.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a metal card in the slot.' };
        if (card.props.el === 'Ti') return { ok: true };
        const e = ELEMENTS[card.props.el];
        const r = iestripRead(state.table, 'strip');
        const seen = r.removed > 4 ? `; the strip jumps after ${jumpAfter('Ti')}` : '';
        return { ok: false, msg: `${cap(e.name)}'s atom has ${e.s + e.d} electrons in 4s and 3d${seen}.` };
      },
      reward: {
        log: 'The sealed strip is titanium.',
        title: 'Titanium',
        body: 'Titanium: four outer electrons, 4s² 3d², then the inner shell. Its highest oxidation state is +4.'
      }
    };
  })()
];

const NOTES = {
  1: ['Press "Remove an Electron", then tap a gap between bars.'],
  2: ['Press "Remove an Electron", then tap a gap between bars.'],
  3: ['Drag the card you choose into the slot.'],
  4: ['Press each key, then tap the ion you choose.'],
  5: ['Drag a card onto the square, then to a tray.'],
  6: ['Drag a card onto the square, or to the answer slot.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Ionization energies climb gently while 4s and 3d electrons leave and jump at the inner shell, so these metals take several charges. A paired 3d electron leaves more easily.' }]
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const removes = (id, n) => Array.from({ length: n }, () => ({ run: id }));

export const SOLUTIONS = [
  [...removes('strip', 3), dial('strip', 'mark', 2)],
  [...removes('strip', 8), dial('strip', 'mark', 7)],
  [put('g-fe', 'slot:guess')],
  [{ run: 'mn' }, { run: 'fe' }, dial('pick', 'value', 1)],
  [put('el-Ca', 'tray:no'), put('el-Ti', 'tray:yes'), put('el-Cu', 'tray:yes'), put('el-Zn', 'tray:no')],
  [...removes('strip', 6), put('el-Ti', 'slot:ladder.card'), put('el-Ti', 'slot:answer')]
];

export const MISSES = [
  [...removes('strip', 3), dial('strip', 'mark', 1)],
  [...removes('strip', 8), dial('strip', 'mark', 2)],
  [],
  [{ run: 'mn' }, { run: 'fe' }, dial('pick', 'value', 2)],
  [put('el-Ca', 'tray:no'), put('el-Ti', 'tray:yes'), put('el-Cu', 'tray:no'), put('el-Zn', 'tray:yes')],
  [...removes('strip', 6), put('el-V', 'slot:answer')]
];

function blankState() { return {}; }
export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { IE, TRANS };
