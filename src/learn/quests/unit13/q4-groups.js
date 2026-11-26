/**
 * Unit 13 · Bench 4 — Functional Groups (q4-groups)
 *
 * The wood-acid pit on Thornmere's fourth mound, where the Fifth condenses wood alcohol and wood acid, on the thorn kit: the heat test,
 * the pH test and the electron view. Eight stages and ONE click: the belief that the –OH in a formula is hydroxide, so an alcohol makes
 * water basic. The pH test answers it, and the window shows why: ethanol's oxygen is bonded to carbon by a shared pair and stays.
 *
 *   1  heat ethanol and methoxymethane (one formula): which part of ethanol holds its neighbours?  -> the –OH: an alcohol
 *   2  PREDICT: NaOH makes water basic; what does ethanol's –OH do to the pH?
 *   3  TEST: the pH test on sodium hydroxide and ethanol                                         -> leaves it at 7
 *   4  which atom of propanone is electron-poor?                                                 -> the C of C=O: the carbonyl
 *   5  which of three clear liquids is the acid?                                                 -> ethanoic acid: –COOH
 *   6  where can the ethanoate ion's spare pair move?                                            -> to the carbon; the charge is shared
 *   7  which pair moves first when methylamine meets water?                                      -> nitrogen's lone pair: an amine
 *   8  SEALED: lactic acid has two O–H groups: which hydrogen leaves as a proton?                 -> the –COOH hydrogen
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  thornTable, tmolFixture, molRead, arrowScript, tleadFixture, ttestFixture, resultOf, tcard, tchoiceFixture, chosenIndex, note, plaqueFixture
} from '../../table/kits/thorn.js';
import { phOf } from '../../engine/thorndata.js';
import '../../engine/thorn-scenes/q3-isomers.js';
import '../../engine/thorn-scenes/q4-groups.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bfunctional groups?\b/i, introducedAt: 1 },
  { term: /\balcohols?\b/i, introducedAt: 1 },
  { term: /\bcarbonyl\b/i, introducedAt: 4 },
  { term: /\bcarboxylic acids?\b/i, introducedAt: 5 },
  { term: /\bamines?\b/i, introducedAt: 7 }
];

/** The curved arrow and the electron-poor site are bench 2's; pH, acids and bases are Verdigris's (recapped). */
export const BUILDS_ON = ['unit13/q2-unsat', 'unit09/q1-handover'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit13/q4-groups';
const GUESS = { 'g-up': 'that it raises the pH', 'g-seven': 'that it leaves the pH at 7', 'g-down': 'that it lowers the pH' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

/* Stage 6: the charged oxygen's spare pair is given; the atom it moves to is the decision. */
const ARROW6 = { right: { src: 'l:o2:2', dst: 'c' }, srcFixed: 'l:o2:2', dstAmong: ['m', 'c', 'o1'] };
/* Stage 7: methylamine and water; either end of the arrow is the student's. The far hydrogen of water is not offered. */
const ARROW7 = {
  right: { src: 'l:n:0', dst: 'hw1' },
  dstAmong: ['m', 'n', 'hn1', 'hn2', 'o', 'hw1'],
  wrongs: [
    { src: 'l:o:0', dst: 'hn1', msg: 'Water\'s oxygen does not pull a proton off nitrogen, so the pair bounced back.' },
    { src: 'l:o:1', dst: 'hn1', msg: 'Water\'s oxygen does not pull a proton off nitrogen, so the pair bounced back.' },
    { src: 'l:o:0', dst: 'hn2', msg: 'Water\'s oxygen does not pull a proton off nitrogen, so the pair bounced back.' },
    { src: 'l:o:1', dst: 'hn2', msg: 'Water\'s oxygen does not pull a proton off nitrogen, so the pair bounced back.' },
    { src: 'l:n:0', dst: 'hn1', msg: 'That hydrogen is already bonded to this nitrogen, so the pair bounced back.' },
    { src: 'l:n:0', dst: 'hn2', msg: 'That hydrogen is already bonded to this nitrogen, so the pair bounced back.' }
  ]
};
const V6 = tmolFixture('view', { x: 59, y: 31 }, { play: 'ethanoate-shift', mode: 'arrow', arrow: ARROW6, pairs: true, title: 'The ethanoate ion', w: 104, h: 56 });
const V7 = tmolFixture('view', { x: 75, y: 31 }, { play: 'amine-water', mode: 'arrow', arrow: ARROW7, pairs: true, title: 'Methylamine and water', w: 120, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'Move an electron pair first.' };
  return { ok: false, msg: r.last.msg };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const T = ttestFixture('rig', { x: 72, y: 30 }, { test: 'heat', w: 56, h: 48 });
    const V = tmolFixture('mol', { x: 125, y: 31 }, { scene: 'ethanol', mode: 'pick', pick: { kind: 'atom', among: ['c1', 'c2', 'o', 'ho'] }, title: 'Ethanol', w: 48, h: 50 });
    return {
      id: 's1-oh',
      title: 'One Atom Changed',
      briefing: { speaker: SPEAKER, body: 'Both drums hold carbon chains with small reactive parts called functional groups. First compare two isomers of C₂H₆O: ethanol and methoxymethane.' },
      prompt: 'Which part of ethanol pulls nearby molecules together much more strongly than methoxymethane does?',
      widget,
      table: thornTable({
        pieces: [tcard('c-eth', 'ethanol', { x: 12, y: 12 }), tcard('c-mom', 'methoxymethane', { x: 12, y: 28 })],
        fixtures: [T.fixture, V],
        zones: { slots: [T.slot] }
      }),
      hints: [
        'Compare the boiling points and dashed attraction lines in the window for ethanol and methoxymethane.',
        'Look at which atoms in ethanol connect with dashed lines to the neighboring molecule.',
        'A strong hydrogen bond forms between an –OH hydrogen on one molecule and an oxygen on the next.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap an atom on the ethanol drawing.' };
        if (r.picked === 'ho' || r.picked === 'o') return { ok: true };
        const tested = resultOf(state.table, 'c-mom', 'heat') !== undefined;
        return { ok: false, msg: tested ? 'Methoxymethane has CH₃ groups too, yet it boiled at −24.8 °C.' : 'Heat methoxymethane too so you can compare it with ethanol.' };
      },
      reward: {
        log: 'The –OH group: ethanol is an alcohol.',
        title: 'Alcohol',
        body: 'The –OH group: its hydrogen attracts the next molecule\'s oxygen in a hydrogen bond. A carbon chain with an –OH group is an alcohol, and –OH is its functional group.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Is It a Base',
    predict: true,
    briefing: { speaker: SPEAKER, body: 'On the pH scale, 7 is neutral, above 7 is basic, and below 7 is acidic. Sodium hydroxide (NaOH) releases OH⁻ ions and raises pH above 7.' },
    prompt: 'Sodium hydroxide makes water basic: what do you expect ethanol, with its –OH group, to do to the pH of water?',
    widget,
    table: thornTable({
      pieces: [
        note('g-up', 'Raises it above 7', { x: 30, y: 14 }),
        note('g-seven', 'Leaves it at 7', { x: 30, y: 33 }),
        note('g-down', 'Lowers it below 7', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { scene: 'naoh-dissolves', caption: 'Sodium hydroxide in water: Na⁺ and OH⁻ separate.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'The picture shows sodium hydroxide splitting into free Na⁺ and OH⁻ ions in water.',
      'Compare how OH⁻ is held in ionic NaOH with how ethanol\'s oxygen is bonded to carbon.',
      'Think about whether ethanol\'s –OH, held to carbon by a covalent bond, breaks off as a free hydroxide ion.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Next, test both sodium hydroxide and ethanol in water with the pH meter.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const T = ttestFixture('rig', { x: 88, y: 22 }, { test: 'ph', w: 84, h: 42 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-ph',
      title: 'The pH Test',
      get prompt() { const g = guess(); return `What does ethanol do to the pH of water?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({
        pieces: [tcard('c-naoh', 'naoh', { x: 12, y: 8 }), tcard('c-eth', 'ethanol', { x: 12, y: 23 })],
        fixtures: [T.fixture, tchoiceFixture('ans', 'Ethanol', { x: 24, y: 48 }, { options: ['Raises it', 'Leaves it at 7', 'Lowers it'], w: 44 })],
        zones: { slots: [T.slot] }
      }),
      hints: [
        'Watch the pH meter and the water window for both sodium hydroxide and ethanol.',
        'Compare what happens to NaOH in water with what happens to ethanol.',
        'A base raises pH by releasing free OH⁻ ions, so check whether ethanol releases any.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        if (pick === 2) return { ok: true };
        const seen = resultOf(state.table, 'c-eth', 'ph');
        if (seen === undefined) return { ok: false, msg: 'Test ethanol in water first.' };
        return { ok: false, msg: `With ethanol in the water, the meter read pH ${seen.toFixed(1)}.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Ethanol left the pH at 7.',
          title: 'Not Hydroxide',
          body: `It leaves the pH at 7${g ? ` (you predicted ${g})` : ''}. Ethanol's –OH is held to carbon by a covalent bond, so it stays attached instead of breaking off as OH⁻.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const V = tmolFixture('mol', { x: 56, y: 31 }, { scene: 'propanone', mode: 'pick', pick: { kind: 'atom', among: ['m1', 'c', 'm2', 'o'] }, pairs: true, title: 'Propanone', w: 100, h: 56 });
    return {
      id: 's4-poor',
      title: 'Short of Electrons',
      briefing: { speaker: SPEAKER, body: 'Oxygen pulls shared electrons much more strongly than carbon does (higher electronegativity), so C=O electrons sit closer to oxygen. Propanone (acetone) has a C=O bond.' },
      prompt: 'Which atom of propanone is the electron-poor site?',
      widget,
      table: thornTable({
        pieces: [],
        fixtures: [V, plaqueFixture('en', 'Electronegativity', { x: 128, y: 20 }, ['O  3.4', 'C  2.6', 'H  2.2'], { w: 34 })]
      }),
      hints: [
        'Look at where the shared electron pairs sit along each bond in propanone.',
        'Check which atom has its shared electron pairs pulled away from it.',
        'The electron-poor atom is the one whose shared pairs sit farthest away.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap an atom.' };
        if (r.picked === 'c') return { ok: true };
        if (r.picked === 'o') return { ok: false, msg: 'Both C=O electron pairs sit close to oxygen, making oxygen electron-rich.' };
        return { ok: false, msg: 'Two carbons pull electrons equally, so the pair between them sits right in the middle.' };
      },
      reward: {
        log: 'The carbon of C=O is electron-poor.',
        title: 'The Carbonyl Group',
        body: 'The carbon bonded to oxygen: both C=O electron pairs sit closer to oxygen, leaving that carbon short of electrons. A carbon double-bonded to oxygen is called a carbonyl group.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const T = ttestFixture('rig', { x: 100, y: 28 }, { test: 'ph', w: 86, h: 44 });
    return {
      id: 's5-acid',
      title: 'Which Is the Acid',
      prompt: 'Which of these three clear liquids from the plant is an acid?',
      widget,
      table: thornTable({
        pieces: [
          tcard('c-eth', 'ethanol', { x: 14, y: 8 }, { text: 'A: CH₃CH₂OH' }),
          tcard('c-prop', 'propanone', { x: 14, y: 22.5 }, { text: 'B: CH₃COCH₃' }),
          tcard('c-acid', 'ethanoic', { x: 14, y: 37 }, { text: 'C: CH₃COOH' })
        ],
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'acid', label: 'The acid', at: { x: 22, y: 52 }, size: { w: 42, h: 14 } }] }
      }),
      hints: [
        'Test each of the three liquids and watch the pH meter and the water window.',
        'Compare the three pH readings and see which molecule hands off a proton in the window.',
        'An acid gives a proton (H⁺) to water and lowers the pH below 7.'
      ],
      check(state) {
        const card = inSlot(state, 'acid');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const seen = resultOf(state.table, card.id, 'ph');
        if (seen === undefined) return { ok: false, msg: 'Test that liquid in water first.' };
        if (card.props.sub === 'ethanoic') return { ok: true };
        return { ok: false, msg: `That liquid read pH ${seen.toFixed(1)}, not acidic.` };
      },
      reward: {
        log: 'Ethanoic acid: –COOH gave a proton to water.',
        title: 'Carboxylic Acid',
        body: `Sample C (ethanoic acid), pH ${phOf('ethanoic').toFixed(1)}: its –COOH group gave a proton (H⁺) to water. A molecule with a –COOH group is a carboxylic acid.`
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-share',
    title: 'Why It Lets Go',
    prompt: 'Ethanoic acid lost a proton, leaving a spare electron pair on one oxygen: which atom can that pair move to?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V6, plaqueFixture('en', 'Electronegativity', { x: 131, y: 20 }, ['O  3.4', 'C  2.6'], { w: 34 })] }),
    hints: [
      'Look at the highlighted spare pair on the lower oxygen and the bonds around the middle carbon.',
      'Check which atom has its shared electron pairs pulled away toward oxygen.',
      'Carbon can only hold four bonds, so it can accept a new pair only if its C=O pair shifts onto the other oxygen.'
    ],
    check: arrowCheck,
    reward: {
      log: 'The charge is shared by two oxygens.',
      title: 'Shared Charge',
      body: 'To the electron-poor carbon, while the C=O pair moves onto the other oxygen. Sharing the negative charge across two oxygens stabilizes the ion, so –COOH releases its proton easily.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-amine',
    title: 'The Nitrogen Group',
    briefing: { speaker: SPEAKER, body: 'A nitrogen bonded to a carbon chain, carrying a lone pair of electrons, forms an amine. Compare the electron pairs on methylamine with the bonds in water.' },
    prompt: 'Which electron pair moves first when methylamine meets water, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V7] }),
    hints: [
      'Look at the gold lone pair on nitrogen and the O–H bonds of water.',
      'Compare the lone pair on nitrogen with the electron-poor hydrogens on water.',
      'Nitrogen\'s lone pair moves to an electron-poor hydrogen on water, leaving OH⁻ behind.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Methylamine took a proton from water.',
      title: 'Amine',
      body: 'Nitrogen\'s lone pair pulled a proton off water, leaving the O–H pair on oxygen as OH⁻. That makes an amine a base, raising the pH of water.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'lactic', mode: 'pick', pick: { kind: 'atom', among: ['h4', 'h5', 'h6'] }, pairs: true, title: 'Lactic acid', w: 120, h: 56 });
    return {
      id: 's8-which-h',
      title: 'Two O–H Groups',
      briefing: { speaker: SPEAKER, body: 'Lactic acid has two different O–H groups. Look at the carbon attached to each one.' },
      prompt: 'Lactic acid has two O–H groups: which hydrogen leaves as a proton in water?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Look at the two O–H hydrogens at opposite ends of lactic acid.',
        'Compare what else is bonded to the carbon next to each O–H group.',
        'Remember ethanoic acid: the leftover negative charge can only be shared when a second oxygen (C=O) sits on the same carbon.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a hydrogen atom.' };
        if (r.picked === 'h6') return { ok: true };
        if (r.picked === 'h5') return { ok: false, msg: 'That carbon has no second oxygen to share the charge; compare it with the C=O carbon.' };
        return { ok: false, msg: 'That hydrogen is bonded to carbon, where the electron pair sits evenly in the middle.' };
      },
      reward: {
        log: 'The –COOH hydrogen leaves.',
        title: 'The Acid Group',
        body: 'The –COOH hydrogen leaves because two oxygens can share the negative charge left behind. The other –OH belongs to an alcohol group and stays put.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Functional groups control how a molecule behaves by shifting where electrons sit: –OH forms hydrogen bonds, C=O makes carbon electron-poor, –COOH shares a negative charge, and an amine\'s lone pair pulls a proton from water.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const pick = (fixture, n) => ({ setDial: { fixture, dial: 'pick', value: n } });

export const SOLUTIONS = [
  [put('c-eth', 'slot:rig.holder'), { run: 'rig' }, put('c-mom', 'slot:rig.holder'), { run: 'rig' }, pick('mol', 4)],
  [put('g-up', 'slot:guess')],
  [put('c-naoh', 'slot:rig.holder'), { run: 'rig' }, put('c-eth', 'slot:rig.holder'), { run: 'rig' }, choose(2)],
  [pick('mol', 2)],
  [put('c-prop', 'slot:rig.holder'), { run: 'rig' }, put('c-acid', 'slot:rig.holder'), { run: 'rig' }, put('c-acid', 'slot:acid')],
  arrowScript(V6, null, 'c'),
  arrowScript(V7, 'l:n:0', 'hw1'),
  [pick('mol', 3)]
];

export const MISSES = [
  [put('c-mom', 'slot:rig.holder'), { run: 'rig' }, pick('mol', 1)],
  [],
  [put('c-eth', 'slot:rig.holder'), { run: 'rig' }, choose(1)],
  [pick('mol', 4)],
  [put('c-prop', 'slot:rig.holder'), { run: 'rig' }, put('c-prop', 'slot:acid')],
  arrowScript(V6, null, 'o1'),
  arrowScript(V7, 'l:o:0', 'hn1'),
  [pick('mol', 2)]
];

/** The arrows a student is likely to draw and must be refused, each with a reason (`verify:thornmere` replays them). */
export const SLIPS = {
  6: [[null, 'o1'], [null, 'm']],
  7: [['l:o:0', 'hn1'], ['l:n:0', 'hn1'], ['l:n:0', 'o'], ['s:o-hw1', 'n'], ['l:o:1', 'n']]
};
export const ARROW_VIEWS = { 6: V6, 7: V7 };

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
