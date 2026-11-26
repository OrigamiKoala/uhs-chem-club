/**
 * Unit 13 · Bench 6 — Long Chains (q6-polymers)
 *
 * The plate works on Thornmere's high branch mound, under a cast plate of the Fifth's armour, on the thorn kit's electron view in its
 * chain-maker form (`mode: 'steps'`, key "Join Next"). Eight stages and ONE click: the belief that a polymer of an alkene still holds the
 * alkene's double bonds. The chain maker answers it: each second pair becomes the bond to the next unit.
 *
 *   1  PREDICT: alkene molecules join end to end: what happens to each double bond?
 *   2  TEST: the chain maker joins three monomers                            -> single bonds only: an addition polymer
 *   3  which pair of the next monomer moves to the chain's end?             -> the second pair of its double bond
 *   4  which monomer made this stretch of chain?                            -> chloroethene (PVC)
 *   5  water given off when six two-ended monomers join (maker holds four)  -> five: a condensation polymer
 *   6  TYPED: water given off when 500 monomers join                        -> 499
 *   7  which pair starts the join of two amino acids, and where does it go? -> nitrogen's pair to the other's C=O carbon: an amide link
 *   8  SEALED: which bond of a polyester chain does hydroxide break?         -> the C–O of the ester link
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { thornTable, tmolFixture, molRead, arrowScript, tleadFixture, tchoiceFixture, chosenIndex, note } from '../../table/kits/thorn.js';
import { sceneOf, pairsOf, linksIn } from '../../engine/thorndata.js';
import '../../engine/thorn-scenes/q6-polymers.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmonomers?\b/i, introducedAt: 2 },
  { term: /\bpolymers?\b/i, introducedAt: 2 },
  { term: /\baddition polymers?\b/i, introducedAt: 2 },
  { term: /\bcondensation polymers?\b/i, introducedAt: 5 },
  { term: /\bamino acids?\b/i, introducedAt: 7 },
  { term: /\bamide links?\b/i, introducedAt: 7 },
  { term: /\bproteins?\b/i, introducedAt: 7 }
];

/** Addition across a double bond is bench 2's; condensation, the ester link and hydrolysis bench 5's; amines bench 4's. */
export const BUILDS_ON = ['unit13/q2-unsat', 'unit13/q4-groups', 'unit13/q5-reactions'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit13/q6-polymers';
const GUESS = { 'g-stays': 'that it stays double', 'g-single': 'that it becomes single', 'g-splits': 'that it splits the molecule' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

/** Typed answers to "500 monomers" a student is likely to give, each refused with what the maker showed. */
export const CHAIN_SLIPS = [500, 250, 501, 1000];

/* Stage 3: the chain's electron-poor end is given; which pair of the waiting monomer moves is the decision. */
const ARROW3 = { right: { src: 'p:a2-b2', dst: 'b1' }, dstFixed: 'b1', srcAmong: ['s:a2-b2', 'p:a2-b2', 's:b2-m2', 's:b2-n2'] };
/* Stage 7: two glycines. The far ends (the first molecule's amine, the second's acid) are not offered. */
const O_PAIRS = ['l:o1:0', 'l:o1:1', 'l:oh1:0', 'l:oh1:1', 'l:o2:0', 'l:o2:1', 'l:oh2:0', 'l:oh2:1'];
const ARROW7 = {
  right: { src: 'l:n2:0', dst: 'c1' },
  srcAmong: pairsOf(sceneOf('gly-0')).map(p => p.id).filter(id => id !== 'l:n1:0'),
  dstAmong: ['n1', 'ca1', 'c1', 'o1', 'oh1', 'hh1', 'n2', 'ca2', 'c2'],
  wrongs: [
    ...O_PAIRS.map(src => ({ src, dst: 'c1', msg: 'Oxygen holds its lone pairs more tightly than nitrogen does, so the pair bounced back.' })),
    { src: 'l:n2:0', dst: 'c2', msg: 'That carbon is on the same glycine molecule as the nitrogen, so they cannot reach each other.' }
  ]
};

const V3 = tmolFixture('view', { x: 75, y: 31 }, { play: 'chain-step2', mode: 'arrow', arrow: ARROW3, pairs: true, title: 'The chain\'s end and the next monomer', w: 128, h: 56 });
const V7 = tmolFixture('view', { x: 75, y: 31 }, { play: 'gly-join', mode: 'arrow', arrow: ARROW7, pairs: true, title: 'Two molecules of glycine', w: 136, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'Move an electron pair first.' };
  return { ok: false, msg: r.last.msg };
}

const condMaker = (x, w) => tmolFixture('maker', { x, y: 30 }, { play: 'cond-chain', mode: 'steps', keyLabel: 'Join Next', under: 'A: an acid group at each end. B: an alcohol group at each end.', title: 'Chain maker', w, h: 50 });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Into a Chain',
    predict: true,
    briefing: { speaker: SPEAKER, body: 'Plastics are long chains built by linking many small molecules end to end. Start with alkenes, which are molecules with a carbon–carbon double bond.' },
    prompt: 'When alkene molecules link end to end into a long chain, what do you expect happens to each double bond?',
    widget,
    table: thornTable({
      pieces: [
        note('g-stays', 'It stays double', { x: 30, y: 14 }),
        note('g-single', 'It becomes a single bond', { x: 30, y: 33 }),
        note('g-splits', 'It splits the molecule in two', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { play: 'hbr-ethene', caption: 'H–Br adds across ethene\'s double bond.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch what happens to ethene\'s double bond when H–Br adds across it.',
      'Compare the bond between the two carbons before and after H–Br adds.',
      'Think about what happens to the double bond if its second pair is used to connect to the next molecule.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Next, join 2-methylpropene monomers in the chain maker and watch their bonds.' }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const M = tmolFixture('maker', { x: 60, y: 31 }, { play: 'chain-grow', mode: 'steps', keyLabel: 'Join Next', title: 'Chain maker: 2-methylpropene', w: 112, h: 56 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's2-join',
      title: 'Joining Up',
      briefing: { speaker: SPEAKER, body: 'A small molecule that links up repeatedly is a monomer, and the long chain it builds is a polymer. Here R⁺ is an electron-poor starter that begins the chain.' },
      get prompt() { const g = guess(); return `What happens to each double bond as the monomers join?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [M, tchoiceFixture('ans', 'Each double bond', { x: 133, y: 31 }, { options: ['Stays double', 'Becomes single', 'Splits apart'], w: 30 })] }),
      hints: [
        'Watch the orange second pair of each double bond as you press Join Next.',
        'Compare the bond between a monomer\'s two carbons before and after it joins the chain.',
        'Each double bond spends its second pair to connect to the chain, leaving one bond between its own carbons.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        if (pick === 2) return { ok: true };
        const r = molRead(state.table, 'maker');
        if (pick === 1) return { ok: false, msg: r.step ? 'Compare a joined monomer with a waiting one: they do not have the same bond between their carbons.' : 'Press Join Next first to watch a monomer attach.' };
        return { ok: false, msg: 'Each joined monomer still keeps its two carbons bonded together.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'The double bonds became single: an addition polymer.',
          title: 'Addition Polymer',
          body: `Each monomer's double bond became a single bond as its second pair linked to the chain${g ? ` (you predicted ${g})` : ''}. Because nothing is left over, this is an addition polymer.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-end',
    title: 'The Growing End',
    prompt: 'Which electron pair on the waiting monomer moves to the chain\'s electron-poor end?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V3] }),
    hints: [
      'Look at the waiting monomer on the right and the electron-poor end of the chain.',
      'Compare the pale single-bond pairs with the exposed orange pair beside the double bond.',
      'Only an exposed electron pair outside a single bond can reach the growing chain.'
    ],
    check: arrowCheck,
    reward: {
      log: 'The second pair of the double bond moved to the chain\'s end.',
      title: 'The Electron-Rich Site',
      body: 'The double bond\'s second pair (the electron-rich site) formed the bond to the chain, turning the monomer\'s far carbon into the new growing end.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const V = tmolFixture('mol', { x: 54, y: 31 }, { scene: 'pvc', mode: 'show', title: 'A stretch of the chain', w: 100, h: 50 });
    return {
      id: 's4-monomer',
      title: 'Which Monomer',
      briefing: { speaker: SPEAKER, body: 'To find the monomer that built a chain, split the chain into identical repeating units: each unit came from one monomer.' },
      prompt: 'Which monomer was this chain made from?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V, tchoiceFixture('ans', 'The monomer', { x: 128, y: 31 }, { options: ['CH₂=CHCl', 'CHCl=CHCl', 'CH₃CH₂Cl'], w: 38 })] }),
      hints: [
        'Scan along the chain for the smallest pattern of carbons and chlorines that repeats.',
        'Count how many carbons and chlorines appear in one repeating unit.',
        'Each repeating unit was one monomer whose double bond opened into single bonds to link up.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the formulas.' };
        if (pick === 1) return { ok: true };
        if (pick === 2) return { ok: false, msg: 'Look closely: the chain has only one chlorine for every two carbons.' };
        return { ok: false, msg: 'CH₃CH₂Cl has no double bond, so it cannot link into an addition polymer.' };
      },
      reward: {
        log: 'The chain is poly(chloroethene), PVC.',
        title: 'PVC',
        body: 'Chloroethene, CH₂=CHCl: every repeating unit has two carbons and one chlorine. This plastic is PVC, used in pipes and siding.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-water',
    title: 'Links That Lose Water',
    briefing: { speaker: SPEAKER, body: 'Here A has an acid group at both ends and B has an alcohol group at both ends. The chain maker joins four of them so you can count the water released.' },
    prompt: 'How many water molecules are released when six of these two-ended monomers join into one chain?',
    entry: { id: 'w', label: 'Water molecules', unit: '' },
    widget,
    table: thornTable({ pieces: [], fixtures: [condMaker(75, 120)] }),
    hints: [
      'Watch the H₂O molecules drop beneath each link as you join the four monomers.',
      'Compare the number of monomers in the chain with the number of water molecules released.',
      'One water molecule is released at every link between two neighboring monomers.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'w');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of water molecules.' };
      if (v === linksIn(6)) return { ok: true };
      if (molRead(state.table, 'maker').step === 0) return { ok: false, msg: 'Press Join Next first and count the water molecules below the chain.' };
      if (v === 6) return { ok: false, msg: 'On the bench, four monomers released three waters, which is one fewer than the number of monomers.' };
      return { ok: false, msg: `On the bench, four monomers released three waters, so ${v} does not match that pattern for six.` };
    },
    reward: {
      log: 'Six monomers, five links, five water molecules.',
      title: 'Condensation Polymer',
      body: 'Five waters: six monomers in a row have five links, releasing one water at each link. A polymer built this way is a condensation polymer (here, a polyester).'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-five-hundred',
    title: 'A Real Chain',
    briefing: {
      speaker: SPEAKER,
      body: 'Real plastic chains contain hundreds or thousands of monomers in a row. Use the pattern from the four-monomer maker to scale up.'
    },
    prompt: 'How many water molecules are released when 500 monomers join into one chain?',
    entry: { id: 'w', label: 'Water molecules', unit: '' },
    widget,
    table: thornTable({ pieces: [], fixtures: [condMaker(75, 120)] }),
    hints: [
      'Check the chain maker to see how many links connect four monomers.',
      'Compare the number of links in a chain with the number of monomers.',
      'Count how many links connect 500 monomers in a row, with one water released per link.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'w');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of water molecules.' };
      if (v === linksIn(500)) return { ok: true };
      if (v === 500 || v === 501) return { ok: false, msg: 'Four monomers released three waters: always one fewer than the number of monomers.' };
      if (v === 250) return { ok: false, msg: 'Every link between neighboring monomers releases one water molecule.' };
      return { ok: false, msg: `Four monomers released three waters, so ${v} does not fit that pattern for 500.` };
    },
    reward: {
      log: '500 monomers, 499 water molecules.',
      title: 'n − 1',
      body: '499 waters: a chain of n monomers has n − 1 links, and each link releases one water molecule.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-amino',
    title: 'Amino Acids',
    briefing: { speaker: SPEAKER, body: 'An amino acid has an amine group at one end and a carboxylic acid group at the other. Glycine is the simplest one.' },
    prompt: 'Which electron pair starts the link between two glycine molecules, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V7] }),
    hints: [
      'Look at the gold lone pair on the right glycine\'s nitrogen and the C=O carbon on the left glycine.',
      'Compare the lone pairs on nitrogen and oxygen, and check which carbon has its electrons pulled away by oxygens.',
      'This works just like making an ester, except nitrogen\'s lone pair moves to the C=O carbon instead of oxygen\'s.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Two glycines joined by an amide link.',
      title: 'Amide Link',
      body: 'Nitrogen\'s lone pair bonded to the other glycine\'s C=O carbon while water left. That C–N bond is an amide link, and a long chain of amino acids is a protein.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'polyester', mode: 'pick', pick: { kind: 'bond', among: [['r1', 'c1'], ['c1', 'o1'], ['c1', 'x1'], ['x1', 'p1'], ['p1', 'p2']] }, pairs: true, title: 'A stretch of polyester', w: 136, h: 54 });
    return {
      id: 's8-cut',
      title: 'Where to Cut',
      prompt: 'Which bond in this polyester chain does a hydroxide ion break?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Look along the polyester chain for the C=O groups and the C–O bonds right beside them.',
        'Find the ester links where two monomers were joined when water left.',
        'Just like on the ester bench, hydroxide moves to the C=O carbon and breaks the C–O link beside it.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a bond.' };
        const [a, b] = r.picked;
        if (a === 'c1' && b === 'x1') return { ok: true };
        if (b === 'o1') return { ok: false, msg: 'That double-bond pair only shifts onto oxygen, leaving the chain intact.' };
        if (a === 'x1') return { ok: false, msg: 'That carbon only shares one bond with oxygen, while the C=O carbon beside it shares three.' };
        if (a === 'p1') return { ok: false, msg: 'Two carbons share electrons evenly, so hydroxide does not target that bond.' };
        return { ok: false, msg: 'That bond sits inside a monomer, not at the link between two monomers.' };
      },
      reward: {
        log: 'Hydroxide cuts the ester link\'s C–O bond.',
        title: 'Cut at the Link',
        body: 'The C–O bond of each ester link, right next to C=O: hydrolysis breaks the exact link condensation made. Those links are the weak point in the plastic armor.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Monomers build polymers either by opening double bonds with nothing left over, or by releasing water at each link. Any link made by losing water can be broken by adding water back.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const pick = (fixture, n) => ({ setDial: { fixture, dial: 'pick', value: n } });
const join = n => Array.from({ length: n }, () => ({ run: 'maker' }));

export const SOLUTIONS = [
  [put('g-stays', 'slot:guess')],
  [...join(3), choose(2)],
  arrowScript(V3, 'p:a2-b2', null),
  [choose(1)],
  [...join(3), typed('w', 5)],
  [typed('w', 499)],
  arrowScript(V7, 'l:n2:0', 'c1'),
  [pick('mol', 3)]
];

export const MISSES = [
  [],
  [...join(2), choose(1)],
  arrowScript(V3, 's:a2-b2', null),
  [choose(2)],
  [...join(3), typed('w', 6)],
  [typed('w', 500)],
  arrowScript(V7, 'l:oh2:0', 'c1'),
  [pick('mol', 2)]
];

/** The arrows a student is likely to draw and must be refused, each with a reason (`verify:thornmere` replays them). */
export const SLIPS = {
  3: [['s:a2-b2', null], ['s:b2-m2', null], ['s:b2-n2', null]],
  7: [['l:oh2:0', 'c1'], ['l:o2:0', 'c1'], ['l:n2:0', 'c2'], ['l:n2:0', 'o1'], ['l:o1:0', 'n2']]
};
export const ARROW_VIEWS = { 3: V3, 7: V7 };

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
