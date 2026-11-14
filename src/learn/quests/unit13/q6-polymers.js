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
import { applyNotes } from '../../table/notes.js';
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
    ...O_PAIRS.map(src => ({ src, dst: 'c1', msg: 'Oxygen holds that pair more closely than nitrogen holds its own: the pair returned.' })),
    { src: 'l:n2:0', dst: 'c2', msg: 'That carbon is in the same molecule as the nitrogen, and the two ends of one molecule cannot reach each other.' }
  ]
};

const V3 = tmolFixture('view', { x: 75, y: 31 }, { play: 'chain-step2', mode: 'arrow', arrow: ARROW3, pairs: true, title: 'The chain\'s end and the next monomer', w: 128, h: 56 });
const V7 = tmolFixture('view', { x: 75, y: 31 }, { play: 'gly-join', mode: 'arrow', arrow: ARROW7, pairs: true, under: 'Proton moves are left out of this picture.', title: 'Two molecules of glycine', w: 136, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'No pair has been moved yet.' };
  return { ok: false, msg: r.last.msg };
}

const condMaker = (x, w) => tmolFixture('maker', { x, y: 30 }, { play: 'cond-chain', mode: 'steps', keyLabel: 'Join Next', under: 'A: an acid group at each end. B: an alcohol group at each end.', title: 'Chain maker', w, h: 50 });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Into a Chain',
    predict: true,
    prompt: 'Alkene molecules can join end to end into a very long chain: what do you expect happens to each double bond?',
    widget,
    table: thornTable({
      pieces: [
        note('g-stays', 'It stays double', { x: 30, y: 14 }),
        note('g-single', 'It becomes a single bond', { x: 30, y: 33 }),
        note('g-splits', 'It splits the molecule in two', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { play: 'hbr-ethene', caption: 'H–Br adds across ethene\'s double bond.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows the second pair of ethene\'s double bond making a new bond, as on the second bench.',
      'Compare the bonds between the two carbons before and after H–Br added.',
      'Ask what bond holds one unit to the next if each joins through its second pair.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it with the chain maker.' }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const M = tmolFixture('maker', { x: 60, y: 31 }, { play: 'chain-grow', mode: 'steps', keyLabel: 'Join Next', title: 'Chain maker: 2-methylpropene', w: 112, h: 56 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's2-join',
      title: 'Joining Up',
      briefing: { speaker: SPEAKER, body: 'A small molecule that joins to others of its kind is a monomer, and the long chain they make is a polymer. R⁺ is an electron-poor carbon that starts the chain.' },
      get prompt() { const g = guess(); return `What happens to each double bond as the monomers join?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [M, tchoiceFixture('ans', 'Each double bond', { x: 133, y: 31 }, { options: ['Stays double', 'Becomes single', 'Splits apart'], w: 30 })] }),
      hints: [
        'Press "Join Next" to add one monomer at a time, and watch the rust-coloured pair.',
        'Compare the bond between the two carbons of a monomer before and after it joins.',
        'The second pair of each double bond moved: ask what it became, and what was left between the monomer\'s own carbons.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 2) return { ok: true };
        const r = molRead(state.table, 'maker');
        if (pick === 1) return { ok: false, msg: r.step ? 'A joined monomer and a waiting one are not drawn with the same bond between their own carbons.' : 'No monomer has been joined yet.' };
        return { ok: false, msg: 'Each joined monomer keeps both of its carbons, bonded to each other.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'The double bonds became single: an addition polymer.',
          title: 'Addition Polymer',
          body: `Each became single${g ? ` (you predicted ${g})` : ''}: the second pair became the bond to the chain. Nothing left, so the chain is an addition polymer of its monomer.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-end',
    title: 'The Growing End',
    prompt: 'Which pair of electrons of the waiting monomer moves to the chain\'s electron-poor end?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V3] }),
    hints: [
      'Tap a pair of electrons of the waiting monomer and press "Move Electrons".',
      'Compare the pairs on the lines between atoms with the rust-coloured pair beside the double bond.',
      'The pair that moves is one that can be reached from outside the molecule.'
    ],
    check: arrowCheck,
    reward: {
      log: 'The second pair of the double bond moved to the chain\'s end.',
      title: 'The Electron-Rich Site',
      body: 'The second pair of its double bond, the monomer\'s electron-rich site, became the bond to the chain, and the monomer\'s far carbon became the new end.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const V = tmolFixture('mol', { x: 54, y: 31 }, { scene: 'pvc', mode: 'show', title: 'A stretch of the chain', w: 100, h: 50 });
    return {
      id: 's4-monomer',
      title: 'Which Monomer',
      prompt: 'Which monomer was this chain made from?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V, tchoiceFixture('ans', 'The monomer', { x: 128, y: 31 }, { options: ['CH₂=CHCl', 'CHCl=CHCl', 'CH₃CH₂Cl'], w: 38 })] }),
      hints: [
        'Tap one of the three formulas to answer.',
        'Find the stretch that repeats along the chain, and count its carbons and chlorines.',
        'Each repeating unit was one monomer, and its double bond became the single bonds that join the units.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the formulas.' };
        if (pick === 1) return { ok: true };
        if (pick === 2) return { ok: false, msg: 'The chain carries one chlorine for every two carbons.' };
        return { ok: false, msg: 'CH₃CH₂Cl has no double bond for the chain to join through.' };
      },
      reward: {
        log: 'The chain is poly(chloroethene), PVC.',
        title: 'PVC',
        body: 'Chloroethene, CH₂=CHCl: two carbons and one chlorine repeat along the chain. This plastic is PVC.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-water',
    title: 'Links That Lose Water',
    prompt: 'How many water molecules are given off when six of these two-ended monomers join into one chain?',
    entry: { id: 'w', label: 'Water molecules', unit: '' },
    widget,
    table: thornTable({ pieces: [], fixtures: [condMaker(75, 120)] }),
    hints: [
      'Press "Join Next" to join the monomers one at a time, and count what falls.',
      'Compare the number of monomers in the chain with the number of water molecules below it.',
      'Each link between two neighbouring monomers gives off one water molecule.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'w');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of water molecules.' };
      if (v === linksIn(6)) return { ok: true };
      if (v === 6) return { ok: false, msg: 'On the bench four monomers gave three water molecules, not four.' };
      return { ok: false, msg: `On the bench four monomers gave three water molecules; ${v} does not follow from that for six.` };
    },
    reward: {
      log: 'Six monomers, five links, five water molecules.',
      title: 'Condensation Polymer',
      body: 'Five: one for each link, and six monomers in a row have five links. A polymer made by losing water at each link is a condensation polymer; this one is a polyester.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-five-hundred',
    title: 'A Real Chain',
    briefing: {
      speaker: SPEAKER,
      body: 'A chain of monomers in a row has one link fewer than it has monomers. For 100 monomers:',
      worked: ['100 monomers in a row: 100 − 1 = 99 links', 'one water molecule for each link: 99 water molecules']
    },
    prompt: 'How many water molecules are given off when 500 monomers join into one chain?',
    entry: { id: 'w', label: 'Water molecules', unit: '' },
    widget,
    table: thornTable({ pieces: [], fixtures: [condMaker(75, 120)] }),
    hints: [
      'The chain maker on the bench still joins four monomers, so the links can be counted again.',
      'Compare the links in a chain with the monomers in it, on the bench and in the worked case.',
      'Count the links between 500 monomers in a row, and give one water molecule for each.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'w');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of water molecules.' };
      if (v === linksIn(500)) return { ok: true };
      if (v === 500 || v === 501) return { ok: false, msg: `Four monomers on the bench gave three water molecules, and ${v} is not that pattern for 500.` };
      if (v === 250) return { ok: false, msg: 'Every link gave one water molecule on the bench, whichever kind of monomer came next.' };
      return { ok: false, msg: `Four monomers on the bench gave three; ${v} does not follow that for 500.` };
    },
    reward: {
      log: '500 monomers, 499 water molecules.',
      title: 'n − 1',
      body: '499: a chain of n monomers has n − 1 links, and each link gave off one water molecule.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-amino',
    title: 'Amino Acids',
    briefing: { speaker: SPEAKER, body: 'An amino acid has an amine group at one end and a carboxylic acid group at the other. Glycine is the smallest.' },
    prompt: 'Which pair of electrons starts the join between two glycine molecules, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V7] }),
    hints: [
      'Tap a pair of electrons, then the atom it moves to, and press "Move Electrons".',
      'Find the lone pair that nitrogen holds, and the carbon of the other molecule whose pairs are pulled toward oxygen.',
      'This is the ester bench\'s reaction again, with a nitrogen pair in place of an oxygen pair.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Two glycines joined by an amide link.',
      title: 'Amide Link',
      body: 'Nitrogen\'s pair moved to the other molecule\'s C=O carbon, and water left. That C–N link is an amide link, and a long chain of amino acids joined by them is a protein.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'polyester', mode: 'pick', pick: { kind: 'bond', among: [['r1', 'c1'], ['c1', 'o1'], ['c1', 'x1'], ['x1', 'p1'], ['p1', 'p2']] }, pairs: true, title: 'A stretch of polyester', w: 136, h: 54 });
    return {
      id: 's8-cut',
      title: 'Where to Cut',
      prompt: 'Which bond of this polyester chain does a hydroxide ion break?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Tap a bond of the chain to choose it.',
        'Find the links where two monomers were joined as water left.',
        'Use what the ester bench showed: hydroxide\'s pair goes to the C=O carbon, and the link\'s C–O pair leaves.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a bond.' };
        const [a, b] = r.picked;
        if (a === 'c1' && b === 'x1') return { ok: true };
        if (b === 'o1') return { ok: false, msg: 'That pair would move out onto its oxygen, and the chain would still be joined.' };
        if (a === 'x1') return { ok: false, msg: 'That carbon shares one pair with oxygen; the C=O carbon beside it shares three.' };
        if (a === 'p1') return { ok: false, msg: 'No oxygen pulls the pair those two carbons share.' };
        return { ok: false, msg: 'That bond lies inside one monomer, not at a link between two.' };
      },
      reward: {
        log: 'Hydroxide cuts the ester link\'s C–O bond.',
        title: 'Cut at the Link',
        body: 'The C–O bond of the ester link, beside C=O: hydrolysis cuts the chain at each link where condensation joined it.'
      }
    };
  })()
];

const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Press the key to join the next monomer; tap a statement to answer.'],
  3: ['Tap a pair of dots, then press the key.'],
  4: ['Tap a formula to answer.'],
  5: ['Press the key to join the next monomer; type your answer.'],
  6: ['Type your answer in the box.'],
  7: ['Tap a pair of dots, then an atom, then press the key.'],
  8: ['Tap a bond to answer.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Monomers join into polymers either through their double bonds, losing nothing, or at reacting groups, losing water at every link; a link made by losing water is cut by adding it back.' }]
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
