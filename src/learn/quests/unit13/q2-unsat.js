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
    { src: 'p:c1-c2', dst: 'br', msg: 'Bromine already pulls the H–Br electrons tightly toward itself, so the pair bounced back.' },
    { src: 'l:br:0', dst: 'c1', msg: 'That carbon already has four full bonds and none broke, so the pair bounced back.' },
    { src: 'l:br:1', dst: 'c1', msg: 'That carbon already has four full bonds and none broke, so the pair bounced back.' },
    { src: 'l:br:2', dst: 'c1', msg: 'That carbon already has four full bonds and none broke, so the pair bounced back.' },
    { src: 'l:br:0', dst: 'c2', msg: 'That carbon already has four full bonds and none broke, so the pair bounced back.' },
    { src: 'l:br:1', dst: 'c2', msg: 'That carbon already has four full bonds and none broke, so the pair bounced back.' },
    { src: 'l:br:2', dst: 'c2', msg: 'That carbon already has four full bonds and none broke, so the pair bounced back.' }
  ]
};
/* The second arrow: the bromide ion's pair is given; the atom is the decision. */
const ARROW2 = {
  right: { src: 'l:br:3', dst: 'c2' },
  srcFixed: 'l:br:3',
  dstAmong: ['c1', 'c2', 'h1', 'h2', 'h3', 'h4', 'hb'],
  wrongs: [{ dst: 'c1', msg: 'That carbon already has four full bonds and none broke, so the pair bounced back.' }]
};

const V4 = tmolFixture('view', { x: 75, y: 31 }, { play: 'hbr-step1', mode: 'arrow', arrow: ARROW1, pairs: true, title: 'Ethene and hydrogen bromide', w: 112, h: 56 });
const V5 = tmolFixture('view', { x: 75, y: 31 }, { play: 'hbr-step2', mode: 'arrow', arrow: ARROW2, pairs: true, title: 'After the first pair moved', w: 112, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'Move an electron pair first.' };
  return { ok: false, msg: r.last.msg };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 2, rows: 1, auto: false, formula: true, lock: true, lockBonds: true, start: { sites: [0, 1], bonds: [[0, 1, 2]] }, title: 'Two carbons, a double bond', w: 86, h: 48 });
    return {
      id: 's1-ethene',
      title: 'Two Pairs Shared',
      briefing: { speaker: SPEAKER, body: 'The Fifth Guild heats swamp tar to break its chains into smaller molecules with double bonds. A double bond is drawn as two lines and uses two of each carbon\'s four bonds.' },
      prompt: 'How many hydrogen atoms can two carbon atoms joined by a double bond hold?',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Look at the dashed open bonds around each carbon on the board.',
        'Compare the two bonds already between the carbons with the four bonds each carbon can form.',
        'Count the double bond as two of each carbon\'s four bonds, then see how many are left for hydrogens.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (r.nH === 0) return { ok: false, notYet: true, msg: 'Add hydrogens to the carbons first.' };
        if (r.full) return { ok: true };
        return { ok: false, msg: `Each carbon forms four bonds; the ${whereOn(state.table, 'board', r.open[0])} carbon still has an open bond.` };
      },
      reward: {
        log: 'Ethene, C₂H₄: four hydrogens.',
        title: 'Ethene',
        body: 'Four hydrogens: the double bond uses two of each carbon\'s four bonds, leaving two for hydrogens. This is ethene, C₂H₄, an alkene (a hydrocarbon with a carbon–carbon double bond).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Which One Reacts',
    predict: true,
    briefing: { speaker: SPEAKER, body: 'Bromine water is orange because of dissolved bromine (Br₂). When bromine bonds to a molecule, the orange color fades away.' },
    prompt: 'Bromine reacts with only one of these two hydrocarbons: which one do you expect?',
    widget,
    table: thornTable({
      pieces: [
        note('g-ane', 'Ethane, with its single bond', { x: 30, y: 14 }),
        note('g-ene', 'Ethene, with its double bond', { x: 30, y: 33 }),
        note('g-none', 'Neither of them', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { scene: 'bromine-water', caption: 'When bromine bonds to a sample, the orange color fades.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'The picture shows orange bromine water turning clear when bromine bonds to a sample.',
      'A single bond shares one pair of electrons between the carbons, while a double bond shares two pairs.',
      'Think about which molecule has an exposed pair of electrons that bromine can reach.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Next, test both ethane and ethene with bromine water to see which one reacts.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const T = ttestFixture('rig', { x: 100, y: 30 }, { test: 'bromine', w: 86, h: 48 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-bromine',
      title: 'The Bromine Test',
      get prompt() { const g = guess(); return `Which hydrocarbon turns bromine water clear?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({
        pieces: [tcard('c-ethane', 'ethane', { x: 14, y: 10 }), tcard('c-ethene', 'ethene', { x: 14, y: 26 })],
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'reacts', label: 'Turns it clear', at: { x: 22, y: 52 }, size: { w: 42, h: 14 } }] }
      }),
      hints: [
        'Test both ethane and ethene in the Sample slot and watch the jar and enlarged window.',
        'Compare where each molecule\'s electron pairs sit in the window and how bromine responds.',
        'The second pair of a double bond sits outside the single bond where bromine can reach it.'
      ],
      check(state) {
        const card = inSlot(state, 'reacts');
        if (!card) return { ok: false, notYet: true, msg: 'Place a sample card in the slot.' };
        if (card.props.sub === 'ethene') return { ok: true };
        const seen = resultOf(state.table, card.id, 'bromine');
        return { ok: false, msg: seen ? 'The jar with ethane stayed orange.' : 'Test ethane with bromine water first.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Ethene turned bromine water clear.',
          title: 'The Second Pair',
          body: `Ethene${g ? ` (you predicted ${g})` : ''}. Its double bond has a second pair of electrons exposed outside the single bond where bromine can reach it, making it an electron-rich site.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-arrow',
    title: 'The First Arrow',
    briefing: { speaker: SPEAKER, body: 'A curved arrow shows one pair of electrons moving from an electron-rich site (an exposed pair) to an electron-poor site (an atom short of electrons).' },
    prompt: 'Which electron pair starts the reaction between ethene and H–Br, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V4] }),
    hints: [
      'Look at the orange second pair on ethene\'s double bond and the two atoms of H–Br.',
      'Look at where the shared electron pair sits along the H–Br bond.',
      'Move the exposed pair from the double bond to the atom whose shared electrons have been pulled away.'
    ],
    check: arrowCheck,
    reward: {
      log: 'The second pair moved to hydrogen; bromide left.',
      title: 'Rich to Poor',
      body: 'The curved arrow goes from the double bond\'s second pair to hydrogen, the electron-poor end of H–Br. Because hydrogen only forms one bond, bromine leaves with the H–Br pair as Br⁻.'
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
      'Look at the two carbons and the positive charge badge on the right carbon.',
      'Count how many bonds each carbon currently has.',
      'An electron pair can only form a bond to an atom that has an open spot.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Bromide bonded to the carbon with three bonds: bromoethane.',
      title: 'Addition',
      body: 'The carbon with three bonds and a positive charge, forming bromoethane. Hydrogen and bromine added across the double bond with nothing left over, making this an addition reaction.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const B = tbuildFixture('board', { x: 75, y: 31 }, { cols: 5, rows: 3, auto: true, formula: true, title: 'Model board', w: 96, h: 50 });
    return {
      id: 's6-propene',
      title: 'Three Carbons, Six Hydrogens',
      prompt: 'Build the C₃H₆ molecule that turns bromine water clear.',
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Watch the formula under the board as you add carbons and change the bond between them.',
        'Compare the formula under the board with C₃H₆ as you build.',
        'Remember ethene: turning bromine water clear requires a carbon–carbon double bond.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'Build a molecule on the board first.' };
        if (!r.joined) return { ok: false, msg: 'Connect all the carbons on the board into one molecule.' };
        if (r.key === keyOf('propene')) return { ok: true };
        if (r.nC !== 3) return { ok: false, msg: `Your board has ${r.nC} carbon${r.nC === 1 ? '' : 's'}, not three.` };
        if (r.formula === 'C₃H₈') return { ok: false, msg: 'C₃H₈ has no double bond, so it has two too many hydrogens.' };
        return { ok: false, msg: `Your board holds ${r.formula}, not C₃H₆.` };
      },
      reward: {
        log: 'Propene, C₃H₆.',
        title: 'Unsaturated',
        body: 'Propene, an alkene. Its double bond leaves it two hydrogens short of the eight a three-carbon alkane holds, so it is unsaturated.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const V = tmolFixture('ring', { x: 48, y: 31 }, { play: 'benzene-shift', mode: 'steps', loop: true, meter: true, pairs: true, title: 'Benzene, C₆H₆', w: 88, h: 56 });
    return {
      id: 's7-benzene',
      title: 'Benzene',
      briefing: { speaker: SPEAKER, body: 'Benzene is drawn with alternating single and double bonds, yet it does not fade bromine water. Bond length is measured in picometers (pm): a single bond is 154 pm and a double bond is 134 pm.' },
      prompt: 'How do the six carbon–carbon bonds in benzene compare with each other?',
      widget,
      table: thornTable({
        pieces: [],
        fixtures: [
          V,
          plaqueFixture('ref', 'Bond lengths', { x: 122, y: 13 }, ['C–C single: 154 pm', 'C=C double: 134 pm'], { w: 46 }),
          tchoiceFixture('ans', 'The six bonds are', { x: 122, y: 43 }, { options: ['Three short, three long', 'All the same length', 'All 154 pm (single)'], w: 50 })
        ]
      }),
      hints: [
        'Measure both a bond drawn as single and a bond drawn as double with the length meter.',
        'Compare the reading on a bond drawn double with the reading on a bond drawn single.',
        'Think about where the three extra electron pairs must be if every bond has the same length.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        const m = molRead(state.table, 'ring');
        if (m.meteredCount < 2) return { ok: false, msg: m.meteredCount === 1 ? 'Measure a second bond on the ring so you can compare them.' : 'Measure at least two bonds on the ring first.' };
        if (pick === 2) return { ok: true };
        if (pick === 1) return { ok: false, msg: 'Both bonds you measured had the exact same length, 139 pm.' };
        return { ok: false, msg: 'A single bond is 154 pm, which is longer than what the meter reads on the ring.' };
      },
      reward: {
        log: 'Benzene: six equal bonds, 139 pm.',
        title: 'Aromatic',
        body: 'All six bonds measure 139 pm, halfway between single and double, because the three extra pairs are shared evenly around the ring. Rings like this are called aromatic (a historical name) and are unusually stable.'
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
      prompt: 'Three plant jars are labeled only with their formulas: which one holds the alkene?',
      widget,
      table: thornTable({
        pieces: Object.entries(JARS).map(([id, sub], i) => tcard(id, sub, { x: 14, y: 8 + i * 14.5 }, { text: `${'ABC'[i]}: ${substance(sub).formula}` })),
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'alkene', label: 'The alkene', at: { x: 22, y: 52 }, size: { w: 42, h: 14 } }] }
      }),
      hints: [
        'Notice that two jars share the formula C₆H₁₂, and test them in the bromine rig.',
        'Compare what the two C₆H₁₂ samples do to the orange bromine water.',
        'Losing two hydrogens from a chain makes either a ring or a double bond, and only a double bond reacts with bromine.'
      ],
      check(state) {
        const card = inSlot(state, 'alkene');
        if (!card) return { ok: false, notYet: true, msg: 'Place a jar card in the slot.' };
        if (card.props.sub === 'hexene') return { ok: true };
        if (card.props.sub === 'hexane') return { ok: false, msg: 'C₆H₁₄ is a full six-carbon alkane chain with no room for a double bond.' };
        const seen = resultOf(state.table, card.id, 'bromine');
        return { ok: false, msg: seen ? 'That jar left the bromine water orange.' : 'Test that jar with bromine water first.' };
      },
      reward: {
        log: 'Jar C is the alkene, hex-1-ene.',
        title: 'Ring or Double Bond',
        body: 'Jar C. Having two fewer hydrogens than hexane can mean a ring or a double bond, and only the double bond turned the bromine water clear.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A double bond\'s second electron pair sits exposed outside the single bond, where another molecule can reach it. Reactions start when an electron-rich pair moves to an electron-poor atom.' }]
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
