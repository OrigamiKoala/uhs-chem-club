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
  if (r.mark === 0) return { ok: false, notYet: true, msg: 'Tap the gap between two bars where the removal energy jumps.' };
  const j = jumpAfter(el);
  if (r.mark === j) return r.removed > j ? { ok: true } : { ok: false, msg: `Only ${r.removed} electrons have been removed so far.` };
  if (r.removed <= r.mark) return { ok: false, msg: `Electron ${r.mark + 1} has not been removed yet.` };
  return { ok: false, msg: `Removing electron ${r.mark} takes ${kj(r.costs[r.mark - 1])} and electron ${r.mark + 1} takes ${kj(r.costs[r.mark])}, a steady climb rather than a sharp jump.` };
}

const TRANS = new Set(['Ti', 'Cu']);

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-calcium',
    title: 'Calcium\'s Costs',
    briefing: { speaker: SPEAKER, body: 'The energy needed to remove an electron is called ionization energy. Press "Remove an Electron" to plot each step, then tap the gap where the energy jumps.' },
    prompt: 'Tap the gap showing how many electrons calcium loses before ionization energy jumps.',
    widget,
    table: lodeTable({ pieces: [], fixtures: [iestripFixture('strip', { x: 75, y: 30 }, { el: 'Ca', w: 112, h: 50 })] }),
    hints: [
      'Compare the bar heights for the first three electrons and check which shell each leaves.',
      'Look at how much each bar rises compared with the bar before it.',
      'Electrons in a full inner shell sit much closer to the nucleus and take far more energy to remove.'
    ],
    check(state) { return markMiss(state.table, 'strip', 'Ca'); },
    reward: {
      log: 'Calcium: two, then the jump.',
      title: 'Ionization Energy',
      body: 'Calcium loses two outer electrons easily. The third comes from the full inner 3p shell and takes four times as much ionization energy, so calcium only forms Ca²⁺.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-manganese',
    title: 'Manganese\'s Costs',
    prompt: 'Tap the gap showing how many electrons manganese loses before ionization energy jumps.',
    widget,
    table: lodeTable({ pieces: [], fixtures: [iestripFixture('strip', { x: 75, y: 30 }, { el: 'Mn', w: 112, h: 50 })] }),
    hints: [
      'Watch how steadily the bars rise as 4s and 3d electrons are removed.',
      'Compare the steady steps across the outer shell with the sudden jump at the inner 3p shell.',
      'Because 4s and 3d electrons are close in energy, the big jump only happens when the inner shell begins.'
    ],
    check(state) { return markMiss(state.table, 'strip', 'Mn'); },
    reward: {
      log: 'Manganese: seven, then the jump.',
      title: 'Oxidation States',
      body: 'Manganese loses up to seven outer electrons (two 4s and five 3d) in steady steps before hitting the inner shell. Each charge it can take (+2 to +7) is an oxidation state.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'The Third Electron',
    predict: true,
    prompt: 'Which ion needs more energy to lose its next electron, Mn²⁺ or Fe²⁺?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-fe', 'Fe²⁺ (one more proton pulls harder)', { x: 32, y: 14 }),
        note('g-mn', 'Mn²⁺ (all five 3d electrons are unpaired)', { x: 32, y: 33 }),
        note('g-same', 'About the same (both lose a 3d electron)', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'ie-ti-v', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch the clip showing two neighboring metals losing their third electron.',
      'Iron has one more proton than manganese, but also one more 3d electron.',
      'Think about which 3d orbital iron\'s extra electron has to share.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is saved. Now test both ions on the strips.' }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's4-third',
      title: 'Mn²⁺ and Fe²⁺',
      get prompt() { const g = guess(); return `Which ion needs more energy to lose its next electron, Mn²⁺ or Fe²⁺${g ? ` (you predicted ${g})` : ''}?`; },
      widget,
      table: lodeTable({
        pieces: [],
        fixtures: [
          pickOf(iestripFixture('mn', { x: 38, y: 23 }, { el: 'Mn', q0: 2, n: 1, mark: false, scale: 4000, w: 70, h: 40 }), 1),
          pickOf(iestripFixture('fe', { x: 112, y: 23 }, { el: 'Fe', q0: 2, n: 1, mark: false, scale: 4000, w: 70, h: 40 }), 2),
          lchoiceFixture('pick', 'Needs more energy', { x: 75, y: 51 }, { options: ['Mn²⁺', 'Fe²⁺'], w: 52 })
        ]
      }),
      hints: [
        'Remove one electron from each strip and compare the bar heights.',
        'Watch which 3d orbital Fe²⁺\'s electron leaves from.',
        'Two electrons sharing one orbital repel each other, making one of them easier to remove.'
      ],
      check(state) {
        const t = state.table;
        const c = chosen(t, 'pick');
        if (!c) return { ok: false, notYet: true, msg: 'Tap the ion that needs more energy.' };
        if (c === 'Mn²⁺') return { ok: true };
        const mn = iestripRead(t, 'mn'); const fe = iestripRead(t, 'fe');
        if (!mn.removed) return { ok: false, msg: 'Remove an electron from Mn²⁺ first.' };
        if (!fe.removed) return { ok: false, msg: 'Remove an electron from Fe²⁺ first.' };
        return { ok: false, msg: `Fe²⁺ took ${kj(fe.costs[0])} while Mn²⁺ took ${kj(mn.costs[0])}.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Mn²⁺ 3,248 kJ/mol, Fe²⁺ 2,957 kJ/mol.',
          title: 'The Paired Electron',
          body: `Mn²⁺ needs more energy${g ? ` (you predicted ${g})` : ''}. Fe²⁺'s sixth 3d electron shares an orbital and is pushed away by its partner, so it takes less energy to remove despite iron's extra proton.`
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
      briefing: { speaker: SPEAKER, body: 'A transition metal forms at least one ion with a partly filled 3d subshell. Neutral copper is an exception in this row, with one 4s electron and ten in 3d.' },
      prompt: 'Sort these four metals into transition metals and non-transition metals.',
      widget,
      table: lodeTable({
        pieces: els.map((el, i) => elemCard(`el-${el}`, el, { x: 10 + i * 14, y: 57 })),
        fixtures: [L.fixture],
        zones: {
          slots: [L.slot],
          trays: [
            { id: 'yes', label: 'Transition metal', at: { x: 86, y: 52.5 }, size: { w: 34, h: 21 }, cell: 14, cellH: 10.5 },
            { id: 'no', label: 'Not transition', at: { x: 125, y: 52.5 }, size: { w: 34, h: 21 }, cell: 14, cellH: 10.5 }
          ]
        }
      }),
      hints: [
        'Drop each card onto "Load an atom", inspect its ions, and sort it into a tray.',
        'Count the 3d electrons in each metal\'s ions out of the ten that 3d can hold.',
        'A metal qualifies only if at least one of its ions has between 1 and 9 electrons in 3d.'
      ],
      check(state) {
        const t = state.table;
        const placed = els.map(el => t.pieces[`el-${el}`]);
        const off = placed.filter(p => p.zone !== 'tray:yes' && p.zone !== 'tray:no');
        if (off.length) return { ok: false, notYet: true, msg: `${off.length} card${off.length > 1 ? 's still need' : ' still needs'} to be placed in a tray.` };
        for (const p of placed) {
          const el = p.props.el;
          const inYes = p.zone === 'tray:yes';
          if (inYes === TRANS.has(el)) continue;
          const ions = COMMON_IONS[el].map(q => `${el}${q > 1 ? ['', '', '²', '³'][q] : ''}⁺ has ${ionOf(el, q).d} 3d electron${ionOf(el, q).d === 1 ? '' : 's'}`);
          return { ok: false, msg: `${cap(ELEMENTS[el].name)}: ${ions.join(', ')}.` };
        }
        return { ok: true };
      },
      reward: {
        log: 'Ti and Cu are transition metals.',
        title: 'Transition Metals',
        body: 'Ti³⁺ and Cu²⁺ each have a partly filled 3d subshell, so titanium and copper are transition metals. Calcium has no 3d electrons and Zn²⁺ has all ten, so neither qualifies.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const L = dshellFixture('ladder', { x: 111, y: 22 }, { mode: 'show', load: true, title: 'Atom', w: 74, h: 40, slotAt: { x: 92, y: 52 } });
    return {
      id: 's6-sealed',
      title: 'The Sealed Strip',
      prompt: 'Which metal matches the ionization energy pattern on the sealed strip?',
      widget,
      table: lodeTable({
        pieces: ['Sc', 'Ti', 'V', 'Cr'].map((el, i) => elemCard(`el-${el}`, el, { x: 10 + i * 14, y: 57 })),
        fixtures: [L.fixture, iestripFixture('strip', { x: 35, y: 22 }, { el: 'Ti', sealed: true, n: 6, mark: false, w: 66, h: 40 })],
        zones: { slots: [L.slot, { id: 'answer', label: 'The sealed metal', at: { x: 127, y: 52 }, size: { w: 24, h: 13 } }] }
      }),
      hints: [
        'Remove electrons from the sealed strip, then inspect each metal card on "Load an atom".',
        'Compare how many electrons leave before the jump with each atom\'s total 4s and 3d electrons.',
        'The sharp jump happens right after all 4s and 3d electrons are gone.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a metal card in the slot.' };
        if (card.props.el === 'Ti') return { ok: true };
        const e = ELEMENTS[card.props.el];
        const r = iestripRead(state.table, 'strip');
        if (r.removed <= 4) return { ok: false, msg: 'Remove more electrons from the sealed strip until the energy jumps, then compare with the metals on "Load an atom".' };
        return { ok: false, msg: `${cap(e.name)} has ${e.s + e.d} outer electrons (4s and 3d). Check where the sealed strip jumps.` };
      },
      reward: {
        log: 'The sealed strip is titanium.',
        title: 'Titanium',
        body: 'Titanium has four outer electrons (4s² 3d²), followed by the inner shell jump. That means its highest oxidation state is +4.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Ionization energy climbs steadily while 4s and 3d electrons leave, then jumps sharply at the inner shell, letting these metals form multiple charges. A paired 3d electron is also easier to remove because of electron repulsion.' }]
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
