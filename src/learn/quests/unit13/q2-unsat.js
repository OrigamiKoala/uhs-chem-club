/**
 * Unit 13 · Bench 2 — Double Bonds (q2-unsat)
 *
 * The tar still on Thornmere's second mound, on the thorn kit (`table/kits/thorn.js`). Eight stages and ONE click: the belief that a double
 * bond, being stronger, makes a molecule react less. The bromine test answers it, and the electron view shows why: the second pair of a
 * double bond lies beside the line between the carbons, an electron-rich site, and a reaction is that pair moving to an electron-poor atom.
 * This is the bench that carries the Charge Gardens' intuition (a pair moves from electron-rich to electron-poor; a carbon has four bonds)
 * into the Learn road; it assumes none of it and recaps the curved arrow in stage 4's briefing.
 *
 *   1  two carbons with a double bond, filled with hydrogens          -> four: ethene, an alkene
 *   2  PREDICT: which reacts with bromine, ethane or ethene?
 *   3  TEST: the bromine test on both                                 -> ethene; the second pair is an electron-rich site
 *   4  the first curved arrow: ethene and H–Br                        -> the second pair moves to the electron-poor hydrogen
 *   5  the second arrow: where bromide's pair goes                    -> the carbon with three bonds; an addition reaction
 *   6  build C₃H₆ that takes the colour out of bromine water          -> propene; unsaturated
 *   7  benzene's six bonds, by the length meter                       -> all equal; aromatic
 *   8  SEALED: three jars by formula, two of them C₆H₁₂              -> only the alkene fades the bromine
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  thornTable, tbuildFixture, buildRead, buildScript, whereOn, tmolFixture, molRead, arrowScript, tleadFixture,
  ttestFixture, resultOf, tcard, tchoiceFixture, chosenIndex, note, plaqueFixture
} from '../../table/kits/thorn.js';
import { keyOf, substance } from '../../engine/thorndata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\balkenes?\b/i, introducedAt: 1 },
  { term: /\belectron-rich\b/i, introducedAt: 3 },
  { term: /\bcurved arrows?\b/i, introducedAt: 4 },
  { term: /\belectron-poor\b/i, introducedAt: 4 },
  { term: /\baddition reactions?\b/i, introducedAt: 5 },
  { term: /\bunsaturated\b/i, introducedAt: 6 },
  { term: /\baromatic\b/i, introducedAt: 7 }
];

/** Carbon's four bonds and the alkanes are this world's first bench; the double bond as two shared pairs is Ligar's. */
export const BUILDS_ON = ['unit03/q4-dots'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit13/q2-unsat';
const GUESS = { 'g-ane': 'ethane', 'g-ene': 'ethene', 'g-none': 'neither' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

/* The first arrow: ethene and hydrogen bromide. */
const ARROW1 = {
  right: { src: 'p:c1-c2', dst: 'hb' },
  wrongs: [
    { src: 'p:c1-c2', dst: 'br', msg: 'That pair went toward bromine, which already holds the H–Br pair close: it returned.' },
    { src: 'l:br:0', dst: 'c1', msg: 'That carbon has four bonds and none of them gave way: the pair returned.' },
    { src: 'l:br:1', dst: 'c1', msg: 'That carbon has four bonds and none of them gave way: the pair returned.' },
    { src: 'l:br:2', dst: 'c1', msg: 'That carbon has four bonds and none of them gave way: the pair returned.' },
    { src: 'l:br:0', dst: 'c2', msg: 'That carbon has four bonds and none of them gave way: the pair returned.' },
    { src: 'l:br:1', dst: 'c2', msg: 'That carbon has four bonds and none of them gave way: the pair returned.' },
    { src: 'l:br:2', dst: 'c2', msg: 'That carbon has four bonds and none of them gave way: the pair returned.' }
  ]
};
/* The second arrow: the bromide ion's pair is given; the atom is the decision. */
const ARROW2 = {
  right: { src: 'l:br:3', dst: 'c2' },
  srcFixed: 'l:br:3',
  dstAmong: ['c1', 'c2', 'h1', 'h2', 'h3', 'h4', 'hb'],
  wrongs: [{ dst: 'c1', msg: 'That carbon has four bonds and none of them gave way: the pair returned.' }]
};

const V4 = tmolFixture('view', { x: 75, y: 31 }, { play: 'hbr-step1', mode: 'arrow', arrow: ARROW1, pairs: true, title: 'Ethene and hydrogen bromide', w: 112, h: 56 });
const V5 = tmolFixture('view', { x: 75, y: 31 }, { play: 'hbr-step2', mode: 'arrow', arrow: ARROW2, pairs: true, title: 'After the first pair moved', w: 112, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'No pair has been moved yet.' };
  return { ok: false, msg: r.last.msg };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 2, rows: 1, auto: false, lock: true, lockBonds: true, start: { sites: [0, 1], bonds: [[0, 1, 2]] }, title: 'Two carbons, a double bond', w: 86, h: 48 });
    return {
      id: 's1-ethene',
      title: 'Two Pairs Shared',
      briefing: { speaker: SPEAKER, body: 'Two atoms can share two pairs of electrons instead of one. That is a double bond, drawn as two lines, and it counts as two of a carbon\'s four bonds.' },
      prompt: 'How many hydrogen atoms can two carbon atoms joined by a double bond hold?',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Tap a carbon to give it a hydrogen, and keep going until it takes no more.',
        'Compare the bonds each carbon already has to the other carbon with the four it can hold.',
        'Count the double bond as two bonds, and see what is left of four on each carbon.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (r.nH === 0) return { ok: false, notYet: true, msg: 'Neither carbon holds a hydrogen yet.' };
        if (r.full) return { ok: true };
        return { ok: false, msg: `The ${whereOn(state.table, 'board', r.open[0])} carbon still has an unused bond.` };
      },
      reward: {
        log: 'Ethene, C₂H₄: four hydrogens.',
        title: 'Ethene',
        body: 'Four: the double bond uses two of each carbon\'s four bonds, leaving two for hydrogens. This is ethene, C₂H₄, and a hydrocarbon with a carbon–carbon double bond is an alkene.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Which One Reacts',
    predict: true,
    prompt: 'Bromine reacts with only one of these two hydrocarbons: which do you expect?',
    widget,
    table: thornTable({
      pieces: [
        note('g-ane', 'Ethane, with its single bond', { x: 30, y: 14 }),
        note('g-ene', 'Ethene, with its double bond', { x: 30, y: 33 }),
        note('g-none', 'Neither of them', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { scene: 'bromine-water', caption: 'Where bromine bonds to a sample, the orange goes.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows what bromine water looks like before and after bromine bonds to a sample.',
      'A double bond is two shared pairs of electrons between the same two carbons, and a single bond is one.',
      'Ask which molecule has electrons that a bromine molecule could reach.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it with bromine water.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const T = ttestFixture('rig', { x: 100, y: 30 }, { test: 'bromine', w: 86, h: 48 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-bromine',
      title: 'The Bromine Test',
      get prompt() { const g = guess(); return `Which hydrocarbon takes the colour out of bromine water?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({
        pieces: [tcard('c-ethane', 'ethane', { x: 14, y: 10 }), tcard('c-ethene', 'ethene', { x: 14, y: 26 })],
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'reacts', label: 'Takes the colour out', at: { x: 22, y: 52 }, size: { w: 36, h: 14 } }] }
      }),
      hints: [
        'Lay a card in the holder and press "Add Bromine Water", then try the other card.',
        'In the window, compare where each molecule\'s pairs of electrons sit and what the bromine molecule does.',
        'A pair that lies beside the line between two atoms can be reached from outside; a pair on the line cannot.'
      ],
      check(state) {
        const card = inSlot(state, 'reacts');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a sample card in the slot.' };
        if (card.props.sub === 'ethene') return { ok: true };
        const seen = resultOf(state.table, card.id, 'bromine');
        return { ok: false, msg: seen ? 'The jar with ethane in it is still orange.' : 'Ethane has not been tested with bromine water.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Ethene took the colour out of bromine water.',
          title: 'The Second Pair',
          body: `Ethene${g ? `, and you predicted ${g}` : ''}. The second pair of its double bond lies beside the line between the carbons, where bromine can reach it: that pair is an electron-rich site.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-arrow',
    title: 'The First Arrow',
    briefing: { speaker: SPEAKER, body: 'A curved arrow shows one pair of electrons moving, from where it is to where it goes. A pair moves from an electron-rich site to an atom that is short of electrons: an electron-poor site.' },
    prompt: 'Which pair of electrons starts the reaction between ethene and hydrogen bromide, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V4] }),
    hints: [
      'Tap a pair of electrons, then the atom it moves to, and press "Move Electrons".',
      'Look at where the pair shared by hydrogen and bromine sits along their bond.',
      'Find the pair that can be reached from outside the molecule, and the atom whose shared pair has been pulled away from it.'
    ],
    check: arrowCheck,
    reward: {
      log: 'The second pair moved to hydrogen; bromide left.',
      title: 'Rich to Poor',
      body: 'The curved arrow ran from the double bond\'s second pair to hydrogen, the electron-poor end of H–Br. Hydrogen holds one bond, so its pair with bromine left with the bromine.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-second',
    title: 'The Second Arrow',
    prompt: 'The bromide ion has a spare pair of electrons: which atom does it bond to?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V5] }),
    hints: [
      'Tap an atom and press "Move Electrons": the bromide ion\'s pair is the one that moves.',
      'Count the bonds on each carbon.',
      'A pair can stay only where there is a place for it: an atom with fewer bonds than it can hold.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Bromide bonded to the carbon with three bonds: bromoethane.',
      title: 'Addition',
      body: 'The carbon with three bonds: it had a free place and a positive charge. Hydrogen and bromine added across the double bond and nothing left, which is an addition reaction.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 5, rows: 3, auto: true, formula: true, title: 'Model board', w: 96, h: 50 });
    return {
      id: 's6-propene',
      title: 'Three Carbons, Six Hydrogens',
      prompt: 'Build the molecule with the formula C₃H₆ that takes the colour out of bromine water.',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Tap a dashed ring to set a carbon, and tap between two carbons to change their bond.',
        'Compare the formula under the board with C₃H₆ as you build.',
        'Use what ethene showed: the molecule that reacts with bromine has a pair of electrons beside a bond.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'The board is empty.' };
        if (!r.joined) return { ok: false, msg: 'The carbons on the board are not all joined.' };
        if (r.key === keyOf('propene')) return { ok: true };
        if (r.nC !== 3) return { ok: false, msg: `The board holds ${r.nC} carbon${r.nC === 1 ? '' : 's'}.` };
        return { ok: false, msg: `The board holds ${r.formula}.` };
      },
      reward: {
        log: 'Propene, C₃H₆.',
        title: 'Unsaturated',
        body: 'Propene. Its double bond leaves it two hydrogens short of the eight a chain of three could hold: a molecule like that is unsaturated.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const V = tmolFixture('ring', { x: 48, y: 31 }, { play: 'benzene-shift', mode: 'steps', loop: true, meter: true, pairs: true, title: 'Benzene, C₆H₆', w: 88, h: 56 });
    return {
      id: 's7-benzene',
      title: 'Benzene',
      briefing: { speaker: SPEAKER, body: 'A carbon–carbon single bond is 154 pm long and a double bond is shorter, 134 pm. Benzene is a ring of six carbons, drawn here with single and double bonds in turn.' },
      prompt: 'How do the six carbon–carbon bonds of benzene compare with one another?',
      widget,
      table: thornTable({
        pieces: [],
        fixtures: [
          V,
          plaqueFixture('ref', 'Bond lengths', { x: 122, y: 13 }, ['C–C single: 154 pm', 'C=C double: 134 pm'], { w: 46 }),
          tchoiceFixture('ans', 'The six bonds are', { x: 122, y: 43 }, { options: ['Three short, three long', 'All the same length', 'All single bonds'], w: 50 })
        ]
      }),
      hints: [
        'Tap a bond between two carbons to lay the length meter on it, and press "Move Electrons" to watch the second pairs.',
        'Compare the reading on a bond drawn double with the reading on a bond drawn single.',
        'Ask where the three second pairs are if neither drawing of the ring is the whole picture.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 2) return { ok: true };
        if (pick === 1) return { ok: false, msg: 'The meter does not read two different lengths round the ring.' };
        return { ok: false, msg: 'The plate gives 154 pm for a single bond, and the meter does not read that on the ring.' };
      },
      reward: {
        log: 'Benzene: six equal bonds, 139 pm.',
        title: 'Aromatic',
        body: 'All six are 139 pm, between single and double: the three second pairs are shared round the whole ring. A ring like this is aromatic.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const T = ttestFixture('rig', { x: 100, y: 28 }, { test: 'bromine', w: 86, h: 44 });
    const JARS = { 'j-a': 'hexane', 'j-b': 'cyclohexane', 'j-c': 'hexene' };
    return {
      id: 's8-jars',
      title: 'Three Sealed Jars',
      prompt: 'Which sealed jar holds the alkene?',
      widget,
      table: thornTable({
        pieces: Object.entries(JARS).map(([id, sub], i) => tcard(id, sub, { x: 14, y: 8 + i * 14.5 }, { text: `${'ABC'[i]}: ${substance(sub).formula}` })),
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'alkene', label: 'The alkene', at: { x: 20, y: 52 }, size: { w: 34, h: 12 } }] }
      }),
      hints: [
        'Lay a jar\'s card in the holder and press "Add Bromine Water".',
        'Two jars carry the same formula: compare what each does to the bromine water.',
        'A chain can lose two hydrogens by closing into a ring or by forming a double bond, and only one of those gives bromine a pair to reach.'
      ],
      check(state) {
        const card = inSlot(state, 'alkene');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a jar\'s card in the slot.' };
        if (card.props.sub === 'hexene') return { ok: true };
        if (card.props.sub === 'hexane') return { ok: false, msg: 'C₆H₁₄ is the formula of a chain of six carbons holding every hydrogen it can.' };
        const seen = resultOf(state.table, card.id, 'bromine');
        return { ok: false, msg: seen ? 'That jar is still orange.' : 'That jar has not been tested with bromine water.' };
      },
      reward: {
        log: 'Jar C is the alkene, hex-1-ene.',
        title: 'Ring or Double Bond',
        body: 'Jar C. Two hydrogens fewer than the chain can mean a ring or a double bond, and only the double bond took the colour out of the bromine water.'
      }
    };
  })()
];

const NOTES = {
  1: ['Tap a carbon to add a hydrogen to it.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Drag a card into the holder to test it, then drag your answer into the slot.'],
  4: ['Tap a pair of dots, then an atom, then press the key.'],
  5: ['Tap an atom, then press the key.'],
  6: ['Tap a dashed ring to add a carbon; tap between two carbons to change the bond.'],
  7: ['Tap a bond in the ring to measure it; tap a statement to answer.'],
  8: ['Drag a card into the holder to test it, then drag your answer into the slot.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A double bond\'s second pair of electrons lies beside the bond, where another molecule can reach it. A reaction begins when that pair moves to an atom that is short of electrons.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const hset = (i, n) => ({ setDial: { fixture: 'board', dial: `h${i}`, value: n } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });

export const SOLUTIONS = [
  [hset(0, 2), hset(1, 2)],
  [put('g-ane', 'slot:guess')],
  [put('c-ethane', 'slot:rig.holder'), { run: 'rig' }, put('c-ethene', 'slot:rig.holder'), { run: 'rig' }, put('c-ethene', 'slot:reacts')],
  arrowScript(V4, 'p:c1-c2', 'hb'),
  arrowScript(V5, null, 'c2'),
  buildScript('board', { sites: [5, 6, 7], bonds: [[5, 6, 2]] }),
  [{ setDial: { fixture: 'ring', dial: 'meter', value: 1 } }, { run: 'ring' }, { setDial: { fixture: 'ring', dial: 'meter', value: 2 } }, choose(2)],
  [put('j-b', 'slot:rig.holder'), { run: 'rig' }, put('j-c', 'slot:rig.holder'), { run: 'rig' }, put('j-c', 'slot:alkene')]
];

export const MISSES = [
  [hset(0, 2), hset(1, 1)],
  [],
  [put('c-ethane', 'slot:rig.holder'), { run: 'rig' }, put('c-ethane', 'slot:reacts')],
  arrowScript(V4, 'p:c1-c2', 'br'),
  arrowScript(V5, null, 'c1'),
  buildScript('board', { sites: [5, 6, 7] }),
  [choose(1)],
  [put('j-b', 'slot:rig.holder'), { run: 'rig' }, put('j-b', 'slot:alkene')]
];

/** The arrows a student is likely to draw and must be refused, each with a reason (`verify:thornmere` replays them). */
export const SLIPS = {
  4: [['p:c1-c2', 'br'], ['l:br:0', 'c1'], ['s:c1-h1', 'hb'], ['s:hb-br', 'c1'], ['p:c1-c2', 'h3']],
  5: [[null, 'c1'], [null, 'h3'], [null, 'hb']]
};
export const ARROW_VIEWS = { 4: V4, 5: V5 };

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
