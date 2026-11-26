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
      briefing: { speaker: SPEAKER, body: 'Swamp tar is made of hydrocarbons, which are molecules built from carbon and hydrogen only. Every carbon atom forms four bonds, and every hydrogen atom forms one.' },
      prompt: 'How many hydrogen atoms can two carbon atoms joined by a single bond hold?',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Look at the dashed open bonds around each carbon on the board.',
        'Compare the bond each carbon already uses with the four bonds it can form.',
        'Each carbon uses one bond to connect to the other carbon, so count how many of its four bonds are left.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (r.nH === 0) return { ok: false, notYet: true, msg: 'Add hydrogens to the carbons first.' };
        if (r.full) return { ok: true };
        const s = r.open[0];
        return { ok: false, msg: `Each carbon needs four bonds; the ${whereOn(state.table, 'board', s)} carbon only has ${r.hOn(s) + 1}.` };
      },
      reward: {
        log: 'Ethane, C₂H₆: six hydrogens.',
        title: 'Ethane',
        body: 'Six hydrogens: each carbon uses one bond on the other carbon and three on hydrogens. This molecule is ethane, C₂H₆, a hydrocarbon.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'One More Carbon',
    predict: true,
    prompt: 'If a third carbon joins the chain of two, how many more hydrogen atoms can the molecule hold?',
    widget,
    table: thornTable({
      pieces: [
        note('g-four', 'Four more', { x: 30, y: 14 }),
        note('g-three', 'Three more', { x: 30, y: 33 }),
        note('g-two', 'Two more', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { play: 'methane-still', pairs: false, caption: 'One carbon alone holds four hydrogens (methane).', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Look at the picture: a single carbon uses all four of its bonds to hold hydrogens.',
      'A new carbon has to connect to a carbon that is already full.',
      'If a carbon already has four bonds, what must it give up to form a new bond?'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Next, add a third carbon to ethane on the board and count the hydrogens.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 4, rows: 2, auto: false, lockBonds: true, maxOrder: 1, start: { sites: [1, 2], bonds: [[1, 2, 1]], h: { 1: 3, 2: 3 } }, title: 'Model board', w: 100, h: 52 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-third',
      title: 'The Third Carbon',
      get prompt() { const g = guess(); return `With a third carbon added and filled, how many more hydrogens than ethane does the chain hold?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Look at the dashed plus rings next to the two carbons on the board.',
        'Watch what happens to a carbon\'s hydrogens when the new carbon bonds to it.',
        'Start with ethane\'s 6 hydrogens, subtract the one that left, and add the hydrogens on the new carbon.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (r.nC < 3) return { ok: false, notYet: true, msg: 'Add a third carbon to the chain first.' };
        if (r.nC > 3) return { ok: false, msg: `Your board has ${r.nC} carbons instead of three.` };
        if (r.full) return { ok: true };
        return { ok: false, msg: `The ${whereOn(state.table, 'board', r.open[0])} carbon still has an open bond.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Propane, C₃H₈: eight hydrogens.',
          title: 'Two More, Not Four',
          body: `Two more than ethane, for 8 total${g ? ` (you predicted ${g})` : ''}: one hydrogen left the middle carbon to make room, and the new carbon brought three. Single-bond chains like this are alkanes.`
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
        body: 'Build chains of two, three, and four carbons on the board and watch how the hydrogen count grows.'
      },
      prompt: 'How many hydrogen atoms does an alkane chain of twenty carbons hold?',
      entry: { id: 'h', label: 'Hydrogen atoms', unit: '' },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Watch the formula under the board as you build chains of two, three, and four carbons.',
        'Compare how many hydrogens a middle carbon holds with how many an end carbon holds.',
        'Give every carbon two hydrogens, then check how many extra hydrogens sit on the two ends.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'h');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of hydrogen atoms.' };
        if (v === alkaneH(20)) return { ok: true };
        if (v === 80) return { ok: false, msg: 'Look at the board: each carbon inside the chain holds two hydrogens, not four.' };
        if (v === 40) return { ok: false, msg: 'Look at the board: each end carbon holds one extra hydrogen compared with the middle carbons.' };
        if (v === 60) return { ok: false, msg: 'Look at the board: each carbon inside the chain holds two hydrogens, not three.' };
        if (v === 41 || v === 43) return { ok: false, msg: 'Every alkane chain on the board has an even number of hydrogens.' };
        return { ok: false, msg: `On the board, three carbons hold 8 hydrogens and four hold 10, so ${v} does not fit that pattern.` };
      },
      reward: {
        log: 'C₂₀H₄₂: 42 hydrogens.',
        title: 'CₙH₂ₙ₊₂',
        body: '42 hydrogens: two for each of the twenty carbons, plus one extra at each end. Any alkane chain of n carbons has the formula CₙH₂ₙ₊₂.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const V = tmolFixture('draw', { x: 36, y: 30 }, { scene: 'skel-pentane', mode: 'show', skeletal: true, title: 'Skeletal formula', w: 60, h: 40 });
    const B = tbuildFixture('board', { x: 108, y: 31 }, { cols: 5, rows: 2, auto: true, formula: true, maxOrder: 1, title: 'Model board', w: 74, h: 50 });
    return {
      id: 's5-skeletal',
      title: 'Drawing It Quickly',
      briefing: { speaker: SPEAKER, body: 'A skeletal formula shows only the bonds between carbons as a zigzag line. Every corner and every end represents one carbon, and the hydrogens are hidden.' },
      prompt: 'Which molecule does this skeletal formula show?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V, B] }),
      hints: [
        'Count every corner and every end along the zigzag line on the left.',
        'Compare the corners and ends of the zigzag with the carbons on your board.',
        'Each corner or end is one carbon, and a line with no split means the carbons form one straight chain.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'Build a molecule on the board first.' };
        if (!r.joined) return { ok: false, msg: 'All the carbons on the board need to be connected.' };
        if (r.key === keyOf('pentane')) return { ok: true };
        if (r.nC !== 5) return { ok: false, msg: `Your chain has ${r.nC} carbon${r.nC === 1 ? '' : 's'}, so count the corners and ends of the drawing again.` };
        return { ok: false, msg: 'Your build has a branch, but the drawing is one unbranched zigzag.' };
      },
      reward: {
        log: 'The skeletal formula is pentane.',
        title: 'Pentane',
        body: 'This skeletal formula has five corners and ends, meaning five carbons in one chain: pentane, C₅H₁₂ (pent- means five, like a pentagon).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const V = tmolFixture('draw', { x: 46, y: 31 }, { scene: 'skel-3-methylpentane', mode: 'show', skeletal: true, title: 'Skeletal formula', w: 84, h: 52 });
    return {
      id: 's6-branch',
      title: 'Naming a Branch',
      briefing: { speaker: SPEAKER, body: 'A branched alkane is named from its longest continuous carbon chain, numbered from the nearer end. A carbon attached to the side is a branch (a one-carbon branch is called methyl).' },
      prompt: 'What is the name of this branched alkane?',
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
        'Trace every path through the drawing, including paths that bend down into the lower line.',
        'Compare the longest path you can trace with the four-carbon line drawn straight across.',
        'Name the longest chain first, then number it from the nearer end to locate the branch.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three names.' };
        if (pick === 2) return { ok: true };
        if (pick === 1) return { ok: false, msg: 'You can trace a five-carbon chain if you turn down into the lower line.' };
        return { ok: false, msg: 'One carbon is bonded to three other carbons, so these six carbons do not form one straight chain.' };
      },
      reward: {
        log: 'The branched alkane is 3-methylpentane.',
        title: '3-Methylpentane',
        body: 'Turning into the lower line gives a five-carbon chain (pentane) with a one-carbon branch on carbon 3. That makes it 3-methylpentane.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const B = tbuildFixture('board', { x: 60, y: 31 }, { cols: 3, rows: 2, auto: true, formula: true, lock: true, maxOrder: 1, start: { sites: [0, 1, 2, 3, 4, 5], bonds: [[0, 1, 1], [1, 2, 1], [2, 5, 1], [5, 4, 1], [4, 3, 1]] }, title: 'Model board', w: 90, h: 54 });
    return {
      id: 's7-ring',
      title: 'Closing the Ring',
      briefing: { speaker: SPEAKER, body: 'A carbon chain can close into a ring when its two end carbons bond to each other.' },
      prompt: 'How many hydrogen atoms are left when hexane\'s two end carbons bond together?',
      entry: { id: 'h', label: 'Hydrogen atoms', unit: '' },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Look at the amber dashed gap between the two end carbons on the left of the board.',
        'Watch what happens to the hydrogens on both end carbons when they bond.',
        'Each carbon can only hold four bonds, so forming a new bond between the ends costs each end one hydrogen.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'h');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of hydrogen atoms.' };
        if (v === 12) return { ok: true };
        const r = buildRead(state.table, 'board');
        if (r.rings) return { ok: false, msg: 'Count the hydrogens on the board now that the ring is closed; each end carbon lost one hydrogen.' };
        if (v === 14) return { ok: false, msg: 'Hexane has 14 hydrogens before its ends join; bond the two ends on the board first.' };
        return { ok: false, msg: `Hexane starts with 14 hydrogens before closing the ring, so ${v} does not match what is left after bonding the ends.` };
      },
      reward: {
        log: 'Cyclohexane, C₆H₁₂: twelve hydrogens.',
        title: 'A Ring',
        body: 'Twelve hydrogens: each end carbon gave up one hydrogen to bond to the other. An alkane closed into a ring is a cycloalkane (cyclo- means ring), so this is cyclohexane, C₆H₁₂.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 4, rows: 2, auto: true, formula: true, maxOrder: 2, title: 'Model board', w: 96, h: 52 });
    return {
      id: 's8-drum',
      title: 'The Sealed Drum',
      prompt: 'A sealed drum from the swamp holds a C₄H₈ hydrocarbon with single bonds only: which molecule is it?',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Watch the formula under the board as you add carbons and connect bonds.',
        'Compare the number of hydrogens on your board with the eight in C₄H₈.',
        'Remember hexane: closing a chain into a ring removes two hydrogens while keeping all single bonds.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'Build a molecule on the board first.' };
        if (!r.joined) return { ok: false, msg: 'Connect all the carbons on the board into one molecule.' };
        if (r.key === keyOf('cyclobutane')) return { ok: true };
        if (r.nC !== 4) return { ok: false, msg: `Your board has ${r.nC} carbon${r.nC === 1 ? '' : 's'}, but the drum's molecule has four.` };
        if (r.doubles) return { ok: false, msg: 'Your molecule has a double bond, but the drum\'s molecule has single bonds only.' };
        return { ok: false, msg: `Your molecule is ${r.formula}, but the drum's molecule holds eight hydrogens.` };
      },
      reward: {
        log: 'The drum holds cyclobutane, C₄H₈.',
        title: 'Cyclobutane',
        body: 'A four-carbon ring: cyclobutane, C₄H₈. Having two fewer hydrogens than a four-carbon chain, with single bonds only, means the carbons form a ring.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Every carbon forms four bonds. Adding a carbon to a chain adds two hydrogens, and closing a chain into a ring removes two.' }]
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
