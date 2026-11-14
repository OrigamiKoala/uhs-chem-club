/**
 * Unit 13 · Bench 1 — Carbon Chains (q1-chains)
 *
 * The tapped stump on Thornmere's first mound, on the thorn kit's model board (`table/kits/thorn-build.js`). Eight stages and ONE click:
 * the belief that every carbon in a chain carries methane's four hydrogens. The board answers it: a new carbon can bond to a full one only
 * if one of that carbon's hydrogens leaves, so each carbon added brings two more hydrogens, not four.
 *
 *   1  two carbons joined by a single bond, filled with hydrogens       -> six: ethane, a hydrocarbon
 *   2  PREDICT: a third carbon joins: how many more hydrogens?
 *   3  TEST: add the third carbon to ethane and fill it                 -> eight; one hydrogen left; an alkane
 *   4  TYPED: hydrogens on a chain of twenty carbons (board holds six)  -> 42, CₙH₂ₙ₊₂
 *   5  build the molecule a skeletal formula stands for                 -> pentane
 *   6  name a branched alkane whose longest chain is not drawn straight -> 3-methylpentane
 *   7  bond hexane's two end carbons: how many hydrogens are left?      -> twelve: a cycloalkane
 *   8  SEALED: the drum's C₄H₈ with single bonds only                   -> a ring of four, cyclobutane
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  thornTable, tbuildFixture, buildRead, buildScript, whereOn, tmolFixture, tleadFixture, tchoiceFixture, chosenIndex, note, plaqueFixture
} from '../../table/kits/thorn.js';
import { keyOf, alkaneH } from '../../engine/thorndata.js';
import '../../engine/thorn-scenes/q1-chains.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bhydrocarbons?\b/i, introducedAt: 1 },
  { term: /\balkanes?\b/i, introducedAt: 3 },
  { term: /\bskeletal formulas?\b/i, introducedAt: 5 },
  { term: /\bbranch(es|ed)?\b/i, introducedAt: 6 },
  { term: /\bcycloalkanes?\b/i, introducedAt: 7 }
];

/** Carbon's four bonds and the shared pair of a covalent bond are Ligar's. */
export const BUILDS_ON = ['unit03/q4-dots'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit13/q1-chains';
const GUESS = { 'g-four': 'four more', 'g-three': 'three more', 'g-two': 'two more' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

/** Typed hydrogen counts a student is likely to give for a chain of twenty, each refused with what the board shows. */
export const TWENTY_SLIPS = [80, 40, 60, 22, 41, 44];
/** Typed counts for the closed ring of six. */
export const RING_SLIPS = [14, 10, 13, 6];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 2, rows: 1, auto: false, lock: true, lockBonds: true, start: { sites: [0, 1], bonds: [[0, 1, 1]] }, title: 'Two carbons, a single bond', w: 86, h: 48 });
    return {
      id: 's1-ethane',
      title: 'Four Bonds Each',
      briefing: { speaker: SPEAKER, body: 'A carbon atom has four valence electrons and forms four covalent bonds; a hydrogen atom forms one. A compound made of carbon and hydrogen only is a hydrocarbon.' },
      prompt: 'How many hydrogen atoms can two carbon atoms joined by a single bond hold?',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Tap a carbon to give it a hydrogen, and keep going until its ring closes.',
        'Compare the bonds each carbon already uses with the four it can form.',
        'Each carbon spends one bond on the other carbon, so count what is left of four on each.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (r.nH === 0) return { ok: false, notYet: true, msg: 'Neither carbon holds a hydrogen yet.' };
        if (r.full) return { ok: true };
        return { ok: false, msg: `The ${whereOn(state.table, 'board', r.open[0])} carbon still has an unused bond.` };
      },
      reward: {
        log: 'Ethane, C₂H₆: six hydrogens.',
        title: 'Ethane',
        body: 'Six: each carbon uses one bond on the other carbon and three on hydrogens. This is ethane, C₂H₆, a hydrocarbon.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'One More Carbon',
    predict: true,
    prompt: 'A third carbon joins the chain of two: how many more hydrogen atoms can the molecule then hold?',
    widget,
    table: thornTable({
      pieces: [
        note('g-four', 'Four more', { x: 30, y: 14 }),
        note('g-three', 'Three more', { x: 30, y: 33 }),
        note('g-two', 'Two more', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { play: 'methane-still', pairs: false, caption: 'One carbon alone holds four hydrogens: methane.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The picture shows a carbon with all four of its bonds used by hydrogens.',
      'A new carbon has to bond to a carbon that is already in the chain.',
      'Ask what a carbon whose four bonds are all used must give up before it can bond to one more atom.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the model board.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 4, rows: 2, auto: false, lockBonds: true, maxOrder: 1, start: { sites: [1, 2], bonds: [[1, 2, 1]], h: { 1: 3, 2: 3 } }, title: 'Model board', w: 100, h: 52 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-third',
      title: 'The Third Carbon',
      get prompt() { const g = guess(); return `How many hydrogen atoms does a chain of three carbons hold?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Tap a dashed ring beside a carbon to set a third carbon there, then tap carbons to give them hydrogens.',
        'Watch what happens to the hydrogens of the carbon the new one bonds to.',
        'Count what the molecule held before, what it lost, and what the new carbon took.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (r.nC < 3) return { ok: false, notYet: true, msg: 'The chain still has two carbons.' };
        if (r.nC > 3) return { ok: false, msg: `The board holds ${r.nC} carbons.` };
        if (r.full) return { ok: true };
        return { ok: false, msg: `The ${whereOn(state.table, 'board', r.open[0])} carbon still has an unused bond.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Propane, C₃H₈: eight hydrogens.',
          title: 'Two More, Not Four',
          body: `Eight, two more than ethane${g ? ` (you predicted ${g})` : ''}: one hydrogen left to free a bond and the new carbon took three. Chains with single bonds only are alkanes.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const B = tbuildFixture('board', { x: 64, y: 31 }, { cols: 6, rows: 1, auto: true, formula: true, maxOrder: 1, title: 'Model board', w: 120, h: 46 });
    return {
      id: 's4-twenty',
      title: 'Twenty Carbons',
      briefing: {
        speaker: SPEAKER,
        body: 'Every carbon inside a chain holds two hydrogens, and each end carbon holds one more. For a chain of ten:',
        worked: ['2 × 10 = 20 hydrogens on the ten carbons', '20 + 2 = 22, one more at each end: C₁₀H₂₂']
      },
      prompt: 'How many hydrogen atoms does an alkane chain of twenty carbons hold?',
      entry: { id: 'h', label: 'Hydrogen atoms', unit: '' },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Build chains of two, three and four carbons on the board and read the formula under it.',
        'Compare how many hydrogens each added carbon brings with how many the end carbons hold.',
        'Use two hydrogens for every carbon, then add the extra one at each end of the chain.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'h');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of hydrogen atoms.' };
        if (v === alkaneH(20)) return { ok: true };
        if (v === 80) return { ok: false, msg: 'On the board a carbon inside the chain holds two hydrogens, not four.' };
        if (v === 40) return { ok: false, msg: 'On the board the two end carbons each hold one more hydrogen than the carbons between them.' };
        if (v === 60) return { ok: false, msg: 'On the board a carbon inside the chain holds two hydrogens, not three.' };
        if (v === 22) return { ok: false, msg: 'C₁₀H₂₂ is the chain of ten; this chain is twice as long.' };
        if (v === 41 || v === 43) return { ok: false, msg: 'Every chain on the board holds an even number of hydrogens.' };
        return { ok: false, msg: `A chain of three holds 8 on the board and a chain of four holds 10; ${v} does not follow that step.` };
      },
      reward: {
        log: 'C₂₀H₄₂: 42 hydrogens.',
        title: 'CₙH₂ₙ₊₂',
        body: '42: two for each of the twenty carbons and one more at each end. An alkane of n carbons is CₙH₂ₙ₊₂.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const V = tmolFixture('draw', { x: 36, y: 30 }, { scene: 'skel-pentane', mode: 'show', skeletal: true, title: 'Skeletal formula', w: 60, h: 40 });
    const B = tbuildFixture('board', { x: 108, y: 31 }, { cols: 5, rows: 2, auto: true, maxOrder: 1, title: 'Model board', w: 74, h: 50 });
    return {
      id: 's5-skeletal',
      title: 'Drawing It Quickly',
      briefing: { speaker: SPEAKER, body: 'A skeletal formula draws only the bonds between carbons, as a zigzag line. Every corner and every end of the line is a carbon, and the hydrogens are left out.' },
      prompt: 'Which molecule does this skeletal formula stand for?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V, B] }),
      hints: [
        'Build your answer on the model board by tapping dashed rings.',
        'Compare the corners and ends of the zigzag with the carbons on your board.',
        'Every corner and every end is one carbon, and a line that does not split means no carbon is joined to three others.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'The board is empty.' };
        if (!r.joined) return { ok: false, msg: 'The carbons on the board are not all joined.' };
        if (r.key === keyOf('pentane')) return { ok: true };
        if (r.nC !== 5) return { ok: false, msg: `Your chain has ${r.nC} carbon${r.nC === 1 ? '' : 's'}; the drawing has five corners and ends.` };
        return { ok: false, msg: 'One carbon on your board is joined to three others, and the drawing has no such corner.' };
      },
      reward: {
        log: 'The skeletal formula is pentane.',
        title: 'Pentane',
        body: 'The skeletal formula has five corners and ends, so five carbons in one unbranched chain: pentane, C₅H₁₂.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const V = tmolFixture('draw', { x: 46, y: 31 }, { scene: 'skel-3-methylpentane', mode: 'show', skeletal: true, title: 'Skeletal formula', w: 84, h: 52 });
    return {
      id: 's6-branch',
      title: 'Naming a Branch',
      briefing: { speaker: SPEAKER, body: 'A branched alkane is named from its longest chain, with the branch\'s place on it as a number. 2-Methylpropane is a three-carbon chain (propane) with a one-carbon branch (methyl) on carbon 2.' },
      prompt: 'What is this branched alkane called?',
      widget,
      table: thornTable({
        pieces: [],
        fixtures: [
          V,
          plaqueFixture('names', 'Chains', { x: 120, y: 14 }, ['1 meth-   2 eth-', '3 prop-   4 but-', '5 pent-   6 hex-'], { w: 50 }),
          tchoiceFixture('ans', 'Its name', { x: 120, y: 44 }, { options: ['2-Ethylbutane', '3-Methylpentane', 'Hexane'], w: 50 })
        ]
      }),
      hints: [
        'Count the carbons along every path through the drawing, including paths that turn into the branch.',
        'Compare the longest path you can trace with the line of four that is drawn straight.',
        'Name the longest chain first, then number it so the branch gets its place from the nearer end.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three names.' };
        if (pick === 2) return { ok: true };
        if (pick === 1) return { ok: false, msg: 'A chain of five carbons runs through the drawing when it turns into the lower line.' };
        return { ok: false, msg: 'One carbon in the drawing is joined to three others, so the six carbons are not one straight chain.' };
      },
      reward: {
        log: 'The branched alkane is 3-methylpentane.',
        title: '3-Methylpentane',
        body: 'Its longest chain runs through the lower line: five carbons, a pentane, with a one-carbon branch on carbon 3. It is 3-methylpentane.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const B = tbuildFixture('board', { x: 60, y: 31 }, { cols: 3, rows: 2, auto: true, lock: true, maxOrder: 1, start: { sites: [0, 1, 2, 3, 4, 5], bonds: [[0, 1, 1], [1, 2, 1], [2, 5, 1], [5, 4, 1], [4, 3, 1]] }, title: 'Model board', w: 90, h: 54 });
    return {
      id: 's7-ring',
      title: 'Closing the Ring',
      prompt: 'How many hydrogen atoms are left when hexane\'s two end carbons bond to each other?',
      entry: { id: 'h', label: 'Hydrogen atoms', unit: '' },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Tap the dotted gap between the two end carbons to bond them.',
        'Watch the hydrogens on the two end carbons as the bond forms.',
        'Each carbon still holds four bonds, so a new bond on a carbon costs it one hydrogen.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'h');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of hydrogen atoms.' };
        if (v === 12) return { ok: true };
        const r = buildRead(state.table, 'board');
        if (r.rings) return { ok: false, msg: `With the two ends bonded, the hydrogens drawn on the board do not number ${v}.` };
        if (v === 14) return { ok: false, msg: 'Hexane holds 14 before its ends are bonded; the ends have not been bonded on the board yet.' };
        return { ok: false, msg: `Hexane on the board holds 14 hydrogens before its ends are bonded; ${v} is not what is left after.` };
      },
      reward: {
        log: 'Cyclohexane, C₆H₁₂: twelve hydrogens.',
        title: 'A Ring',
        body: 'Twelve: each end carbon gave up one hydrogen to bond to the other. An alkane closed into a ring is a cycloalkane, and this one is cyclohexane, C₆H₁₂.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 4, rows: 2, auto: true, formula: true, maxOrder: 2, title: 'Model board', w: 96, h: 52 });
    return {
      id: 's8-drum',
      title: 'The Sealed Drum',
      prompt: 'The drum\'s molecule has four carbons, eight hydrogens and single bonds only: which molecule is it?',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Build on the model board and read the formula under it as you go.',
        'Compare the hydrogens your molecule holds with the eight the drum\'s holds.',
        'Use what hexane showed: a chain loses hydrogens when one more bond is made between its carbons.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'The board is empty.' };
        if (!r.joined) return { ok: false, msg: 'The carbons on the board are not all joined.' };
        if (r.key === keyOf('cyclobutane')) return { ok: true };
        if (r.nC !== 4) return { ok: false, msg: `The board holds ${r.nC} carbon${r.nC === 1 ? '' : 's'}; the drum's molecule has four.` };
        if (r.doubles) return { ok: false, msg: 'Your molecule has a double bond; the drum\'s has single bonds only.' };
        return { ok: false, msg: `Your molecule is ${r.formula}; the drum's holds eight hydrogens.` };
      },
      reward: {
        log: 'The drum holds cyclobutane, C₄H₈.',
        title: 'Cyclobutane',
        body: 'A ring of four: cyclobutane, C₄H₈. Two hydrogens fewer than the chain of four, with single bonds only, means one ring.'
      }
    };
  })()
];

const NOTES = {
  1: ['Tap a carbon to add a hydrogen to it.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Tap a dashed ring to add a carbon; tap a carbon to add a hydrogen.'],
  4: ['Tap a dashed ring to add a carbon; type your answer in the box.'],
  5: ['Tap a dashed ring to add a carbon.'],
  6: ['Tap a name to answer.'],
  7: ['Tap the gap between two carbons to bond them; type your answer.'],
  8: ['Tap a dashed ring to add a carbon; tap between two carbons to change the bond.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Every carbon holds four bonds. A carbon added to a chain brings two more hydrogens, and closing a ring costs two.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const hset = (i, n) => ({ setDial: { fixture: 'board', dial: `h${i}`, value: n } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });

export const SOLUTIONS = [
  [hset(0, 3), hset(1, 3)],
  [put('g-four', 'slot:guess')],
  [...buildScript('board', { sites: [3] }), hset(3, 3)],
  [...buildScript('board', { sites: [0, 1, 2, 3] }), typed('h', 42)],
  buildScript('board', { sites: [0, 1, 2, 3, 4] }),
  [choose(2)],
  [...buildScript('board', { bonds: [[0, 3, 1]] }), typed('h', 12)],
  buildScript('board', { sites: [0, 1, 4, 5], bonds: [[1, 5, 1]] })
];

export const MISSES = [
  [hset(0, 3), hset(1, 2)],
  [],
  [...buildScript('board', { sites: [3] }), hset(3, 2)],
  [typed('h', 80)],
  buildScript('board', { sites: [0, 1, 2, 3] }),
  [choose(1)],
  [...buildScript('board', { bonds: [[0, 3, 1]] }), typed('h', 14)],
  buildScript('board', { sites: [0, 1, 2, 3] })
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
