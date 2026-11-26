/**
 * Unit 13 · Bench 3 — Isomers (q3-isomers)
 *
 * The mirror vault on Thornmere's branch mound, on the thorn kit: the model board with a record strip, the heat test, the twist rig
 * and the mirror rig (`table/kits/thorn-space.js`). Eight stages and ONE click: the belief that a molecule's mirror image can always be
 * turned round to match it. The mirror rig answers it by turning the image through every one of its twelve turns.
 *
 *   1  build C₄H₁₀ with its carbons joined in a different order from butane -> 2-methylpropane: structural isomers
 *   2  count the different molecules of C₅H₁₂ (Record keeps each one)        -> three
 *   3  where does the most compact C₅H₁₂ boil? (two of the three in store)    -> below both: less contact
 *   4  which of three molecules has two forms that twisting cannot join?    -> 1,2-dichloroethene: cis and trans
 *   5  PREDICT: can a mirror image always be turned to match?
 *   6  TEST: CHFClBr and its mirror image, turned through all twelve turns  -> no: chiral, enantiomers
 *   7  which of three new molecules is chiral?                              -> 1-chloroethanol
 *   8  SEALED: which carbon makes lactic acid chiral?                       -> the middle one: a stereocentre
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  thornTable, tbuildFixture, buildRead, buildScript, tmolFixture, molRead, tleadFixture, ttestFixture, resultOf, tcard,
  tchoiceFixture, chosenIndex, note, tmirrorFixture, mirrorRead, turnsToMatch
} from '../../table/kits/thorn.js';
import { keyOf, substance, ISOMER_COUNT } from '../../engine/thorndata.js';
import '../../engine/thorn-scenes/q3-isomers.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bstructural isomers?\b/i, introducedAt: 1 },
  { term: /\bcis\b/i, introducedAt: 4 },
  { term: /\btrans\b/i, introducedAt: 4 },
  { term: /\bchiral\b/i, introducedAt: 6 },
  { term: /\benantiomers?\b/i, introducedAt: 6 },
  { term: /\bstereocentres?\b/i, introducedAt: 8 }
];

/** Chains and their formulas are bench 1's; the double bond's second pair is bench 2's. Dispersion forces are Mirrowen's (recapped). */
export const BUILDS_ON = ['unit13/q1-chains', 'unit13/q2-unsat'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit13/q3-isomers';
const GUESS = { 'g-always': 'always', 'g-never': 'never', 'g-depends': 'that it depends on the atoms' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

const CHFCLBR = substance('bromochlorofluoromethane').groups;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const V = tmolFixture('plate', { x: 28, y: 22 }, { scene: 'skel-butane', mode: 'show', skeletal: true, title: 'Butane, C₄H₁₀', w: 48, h: 30 });
    const B = tbuildFixture('board', { x: 100, y: 31 }, { cols: 4, rows: 3, auto: true, formula: true, maxOrder: 1, title: 'Model board', w: 84, h: 56 });
    return {
      id: 's1-another',
      title: 'One Formula, Two Molecules',
      briefing: { speaker: SPEAKER, body: 'Molecules with the same formula whose atoms are joined in a different order are structural isomers. Butane\'s four carbons are joined in one line.' },
      prompt: 'Is there a molecule of C₄H₁₀ whose carbons are joined in a different order from butane\'s?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V, B] }),
      hints: [
        'Build on the model board and read the formula under it as you go.',
        'Compare how each carbon of your molecule is joined with how butane\'s are joined.',
        'Try a carbon that is bonded to three other carbons instead of two.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'The board is empty.' };
        if (!r.joined) return { ok: false, msg: 'The carbons on the board are not all joined.' };
        if (r.key === keyOf('methylpropane')) return { ok: true };
        if (r.key === keyOf('butane')) return { ok: false, msg: 'Your carbons are joined one after another in a line of four, as butane\'s are, however the line bends.' };
        return { ok: false, msg: `The board holds ${r.formula}, not C₄H₁₀.` };
      },
      reward: {
        log: '2-Methylpropane, an isomer of butane.',
        title: 'Structural Isomers',
        body: 'Yes: one carbon bonded to three others makes 2-methylpropane. It and butane are structural isomers, the same atoms joined in a different order.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const B = tbuildFixture('board', { x: 72, y: 28 }, { cols: 5, rows: 3, auto: true, formula: true, maxOrder: 1, record: true, recordFormula: 'C₅H₁₂', title: 'Model board', w: 128, h: 52 });
    return {
      id: 's2-count',
      title: 'Counting Isomers',
      prompt: 'How many different molecules have the formula C₅H₁₂?',
      entry: { id: 'n', label: 'Different molecules', unit: '' },
      widget,
      table: thornTable({ pieces: [], fixtures: [B] }),
      hints: [
        'Build a C₅H₁₂ and press "Record", then change the build and record again.',
        'Watch which builds the strip takes and which it refuses as already recorded.',
        'Start from the longest chain and shorten it one carbon at a time, moving the carbons you take off onto the side.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'n');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type how many different molecules there are.' };
        if (v === ISOMER_COUNT[5]) return { ok: true };
        const got = buildRead(state.table, 'board').recorded.length;
        if (v > got) return { ok: false, msg: `Your strip holds ${got} different molecule${got === 1 ? '' : 's'} of C₅H₁₂, fewer than ${v}.` };
        if (v < got) return { ok: false, msg: `Your strip already holds ${got} different molecules of C₅H₁₂.` };
        return { ok: false, msg: 'The board can hold a C₅H₁₂ that is not on your strip yet.' };
      },
      reward: {
        log: 'C₅H₁₂ has three structural isomers.',
        title: 'Three',
        body: 'Three: pentane, 2-methylbutane and 2,2-dimethylpropane. Any other build is one of these drawn bent, and the strip refused it.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const T = ttestFixture('rig', { x: 72, y: 30 }, { test: 'heat', only: ['pentane', 'methylbutane'], w: 58, h: 48 });
    return {
      id: 's3-compact',
      title: 'The Compact One',
      briefing: { speaker: SPEAKER, body: 'Molecules attract one another most where they lie against each other, by dispersion forces. Only two of the three isomers of C₅H₁₂ are in store to test.' },
      prompt: 'Where does the most compact isomer, 2,2-dimethylpropane, boil compared with the other two?',
      widget,
      table: thornTable({
        pieces: [tcard('c-pent', 'pentane', { x: 12, y: 10 }), tcard('c-mbut', 'methylbutane', { x: 12, y: 25 }), tcard('c-dmp', 'dimethylpropane', { x: 12, y: 40 })],
        fixtures: [T.fixture, tchoiceFixture('ans', 'It boils', { x: 125, y: 32 }, { options: ['Above both', 'Between them', 'Below both'], w: 44 })],
        zones: { slots: [T.slot] }
      }),
      hints: [
        'Lay each card in the Sample slot and press "Heat".',
        'Compare how much of the two molecules lie against each other in the window, and where each boils.',
        'Ask how much of a ball-shaped molecule can lie against its neighbour, compared with a more stretched one.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 3) return { ok: true };
        const tested = resultOf(state.table, 'c-pent', 'heat') !== undefined && resultOf(state.table, 'c-mbut', 'heat') !== undefined;
        if (!tested) return { ok: false, msg: 'Not both of the isomers in store have been heated yet.' };
        return { ok: false, msg: 'Of the two you heated, the more compact one boiled lower and its window showed less contact.' };
      },
      reward: {
        log: '2,2-Dimethylpropane boils lowest of the three (9.5 °C).',
        title: 'Less Contact',
        body: 'Below both: it boils at 9.5 °C. The more compact a molecule, the less of it lies against its neighbours, and the weaker the dispersion forces to overcome.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const T = ttestFixture('rig', { x: 100, y: 29 }, { test: 'twist', w: 86, h: 48 });
    return {
      id: 's4-twist',
      title: 'One Side or the Other',
      prompt: 'Which of these molecules exists in two forms that twisting cannot turn into each other?',
      widget,
      table: thornTable({
        pieces: [tcard('c-ane', 'dichloroethane', { x: 14, y: 8 }), tcard('c-12', 'dichloroethene12', { x: 14, y: 22.5 }), tcard('c-11', 'dichloroethene11', { x: 14, y: 37 })],
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'two', label: 'Two forms', at: { x: 22, y: 52 }, size: { w: 36, h: 12 } }] }
      }),
      hints: [
        'Lay a card in the Sample slot and press "Twist", then try the others.',
        'Compare what the far end does with a single bond and with a double bond, and look at the form drawn beside it.',
        'Two forms are two molecules only if twisting cannot join them and the far end turned over looks different.'
      ],
      check(state) {
        const card = inSlot(state, 'two');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card.props.sub === 'dichloroethene12') return { ok: true };
        const seen = resultOf(state.table, card.id, 'twist');
        if (!seen) return { ok: false, msg: 'That molecule has not been twisted yet.' };
        if (card.props.sub === 'dichloroethane') return { ok: false, msg: 'Its far end turned and stayed turned.' };
        return { ok: false, msg: 'With its far end turned over, it is drawn just as it was: both chlorines are still on one carbon.' };
      },
      reward: {
        log: '1,2-Dichloroethene has cis and trans forms.',
        title: 'Cis and Trans',
        body: '1,2-Dichloroethene: its double bond cannot turn, so its chlorines stay on the same side (cis) or on opposite sides (trans), two different molecules.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-predict',
    title: 'The Mirror',
    predict: true,
    prompt: 'Can a molecule\'s mirror image always be turned round until it matches the molecule?',
    widget,
    table: thornTable({
      pieces: [
        note('g-always', 'Always', { x: 30, y: 14 }),
        note('g-never', 'Never', { x: 30, y: 33 }),
        note('g-depends', 'It depends on the atoms', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 108, y: 44 }, { scene: 'mirror-ch2cl2', caption: 'CH₂Cl₂ and its mirror image, turned until they match.', w: 70, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 108, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip turns a mirror image of CH₂Cl₂ until each of its four groups stands where the same group stands in the molecule.',
      'Your left hand is the mirror image of your right: compare how they fit when you turn one.',
      'Ask what the two chlorines and two hydrogens of CH₂Cl₂ allow that four different groups would not.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the mirror rig.' }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const M = tmirrorFixture('mirror', { x: 56, y: 31 }, { groups: CHFCLBR, sub: 'bromochlorofluoromethane', title: 'CHFClBr and its mirror image', w: 96, h: 54 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's6-four',
      title: 'Four Different Groups',
      get prompt() { const g = guess(); return `Can the mirror image of CHFClBr be turned to match it?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [M, tchoiceFixture('ans', 'Can it match?', { x: 127, y: 31 }, { options: ['Yes', 'No'], w: 40 })] }),
      hints: [
        'Press "Next Turn" again and again and watch the count under the rig.',
        'Compare the count on each turn with four, and keep going until all twelve turns have been tried.',
        'If no turn ever puts all four groups in place, the image and the molecule are not the same molecule.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap Yes or No.' };
        if (pick === 2) return { ok: true };
        const r = mirrorRead(state.table, 'mirror');
        return { ok: false, msg: r.tried >= 12 ? 'None of the twelve turns put all four groups in place.' : `No turn tried so far put all four groups in place (${r.tried} of 12 tried).` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'CHFClBr is chiral.',
          title: 'Chiral',
          body: `No${g ? ` (you predicted ${g})` : ''}: every turn left groups swapped, as a left hand never fits a right. Such a molecule is chiral, and it and its mirror image are enantiomers.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const M = tmirrorFixture('mirror', { x: 100, y: 29 }, { holder: true, w: 86, h: 50 });
    return {
      id: 's7-which',
      title: 'Which Is Chiral',
      prompt: 'Which of these three molecules is chiral?',
      widget,
      table: thornTable({
        pieces: [tcard('c-bcm', 'bromochloromethane', { x: 14, y: 8 }), tcard('c-cle', 'chloroethanol', { x: 14, y: 22.5 }), tcard('c-clp', 'chloropropane', { x: 14, y: 37 })],
        fixtures: [M.fixture],
        zones: { slots: [M.slot, { id: 'chiral', label: 'Chiral', at: { x: 22, y: 52 }, size: { w: 36, h: 12 } }] }
      }),
      hints: [
        'Lay a card in the Sample slot and press "Next Turn" until the count stops changing, then try the next card.',
        'Compare the best count each card reached, which it prints once it has been turned.',
        'Look at the four groups round each carbon: are any two of them the same?'
      ],
      check(state) {
        const card = inSlot(state, 'chiral');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card.props.sub === 'chloroethanol') return { ok: true };
        const best = card.props.res?.mirror;
        if (best === 4) return { ok: false, msg: 'A turn put all four of that molecule\'s groups in place.' };
        return { ok: false, msg: 'That molecule\'s carbon holds two groups that are the same.' };
      },
      reward: {
        log: '1-Chloroethanol is chiral.',
        title: 'Four Different',
        body: '1-Chloroethanol: its carbon holds H, CH₃, OH and Cl, four different groups. The other two each hold two the same, and a turn swapped those back into place.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'lactic', mode: 'pick', pick: { kind: 'atom', among: ['c1', 'c2', 'c3'] }, title: 'Lactic acid', w: 112, h: 56 });
    return {
      id: 's8-centre',
      title: 'The Carbon That Does It',
      prompt: 'Which carbon atom makes lactic acid chiral?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Tap a carbon atom to choose it.',
        'For each carbon, list the four things bonded to it.',
        'Use what the mirror rig showed: only four different groups round one carbon leave a mirror image no turn can match.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a carbon atom.' };
        if (r.picked === 'c2') return { ok: true };
        if (r.picked === 'c1') return { ok: false, msg: 'That carbon holds three hydrogens.' };
        return { ok: false, msg: 'That carbon has a double bond to an oxygen, so it holds three groups, not four.' };
      },
      reward: {
        log: 'Lactic acid\'s middle carbon is a stereocentre.',
        title: 'Stereocentre',
        body: 'The middle carbon: it holds H, CH₃, OH and COOH, four different groups. A carbon like that is a stereocentre.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'One formula can be several molecules: atoms joined in a different order, held on either side of a double bond, or mirror images that no turn can match.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const record = { run: 'board' };
const takeAway = i => ({ setDial: { fixture: 'board', dial: `c${i}`, value: 0 } });
const turns = n => Array.from({ length: n }, () => ({ run: 'mirror' }));

/** C₅H₁₂ on a 5 × 3 board: pentane on the top row, 2-methylbutane, and 2,2-dimethylpropane as a cross. */
const S2 = [
  ...buildScript('board', { sites: [0, 1, 2, 3, 4] }), record,
  takeAway(4), ...buildScript('board', { sites: [6] }), record,
  takeAway(3), takeAway(2), takeAway(0), ...buildScript('board', { sites: [5, 7, 11] }), record,
  typed('n', 3)
];

export const SOLUTIONS = [
  buildScript('board', { sites: [4, 5, 6, 1] }),
  S2,
  [put('c-pent', 'slot:rig.holder'), { run: 'rig' }, put('c-mbut', 'slot:rig.holder'), { run: 'rig' }, choose(3)],
  [put('c-ane', 'slot:rig.holder'), { run: 'rig' }, put('c-12', 'slot:rig.holder'), { run: 'rig' }, put('c-12', 'slot:two')],
  [put('g-always', 'slot:guess')],
  [...turns(11), choose(2)],
  [put('c-bcm', 'slot:mirror.holder'), ...turns(turnsToMatch(substance('bromochloromethane').groups).length), put('c-cle', 'slot:mirror.holder'), { run: 'mirror' }, put('c-cle', 'slot:chiral')],
  [{ setDial: { fixture: 'mol', dial: 'pick', value: 2 } }]
];

export const MISSES = [
  buildScript('board', { sites: [4, 5, 6, 7] }),
  [...buildScript('board', { sites: [0, 1, 2, 3, 4] }), record, typed('n', 2)],
  [put('c-pent', 'slot:rig.holder'), { run: 'rig' }, put('c-mbut', 'slot:rig.holder'), { run: 'rig' }, choose(2)],
  [put('c-ane', 'slot:rig.holder'), { run: 'rig' }, put('c-ane', 'slot:two')],
  [],
  [...turns(3), choose(1)],
  [put('c-clp', 'slot:mirror.holder'), ...turns(turnsToMatch(substance('chloropropane').groups).length), put('c-clp', 'slot:chiral')],
  [{ setDial: { fixture: 'mol', dial: 'pick', value: 1 } }]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
