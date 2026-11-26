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
      briefing: { speaker: SPEAKER, body: 'Molecules with the same formula whose atoms are connected in a different order are called structural isomers. Butane connects its four carbons in one continuous line.' },
      prompt: 'Build a different C₄H₁₀ molecule whose carbons are not connected in one line.',
      widget,
      table: thornTable({ pieces: [], fixtures: [V, B] }),
      hints: [
        'Watch the formula under the board and look at the dashed rings above and below the middle carbon.',
        'Compare how each carbon in your build is connected with how butane\'s carbons are connected.',
        'Try connecting one carbon to three other carbons instead of putting all four in a row.'
      ],
      check(state) {
        const r = buildRead(state.table, 'board');
        if (!r.nC) return { ok: false, notYet: true, msg: 'Build a molecule on the board first.' };
        if (!r.joined) return { ok: false, msg: 'Connect all the carbons on the board into one molecule.' };
        if (r.key === keyOf('methylpropane')) return { ok: true };
        if (r.key === keyOf('butane')) return { ok: false, msg: 'Your four carbons are still connected in one continuous line, just like butane, even if the line bends.' };
        return { ok: false, msg: `Your board holds ${r.formula}, not C₄H₁₀.` };
      },
      reward: {
        log: '2-Methylpropane, an isomer of butane.',
        title: 'Structural Isomers',
        body: 'Connecting one carbon to three others makes 2-methylpropane. It and butane are structural isomers: the same atoms connected in a different order.'
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
        'Use the Record strip on the right, and start in the middle row so you have room to branch up and down.',
        'Watch which builds the strip saves and which ones it rejects as duplicates.',
        'Start with the five-carbon straight chain, then shorten the main chain one carbon at a time and attach the extra carbons as branches.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'n');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the number of different molecules.' };
        const got = buildRead(state.table, 'board').recorded.length;
        if (v === ISOMER_COUNT[5] && got >= ISOMER_COUNT[5]) return { ok: true };
        if (v === ISOMER_COUNT[5]) return { ok: false, msg: `Record all ${ISOMER_COUNT[5]} different C₅H₁₂ molecules on the strip first (${got} recorded so far).` };
        if (v > ISOMER_COUNT[5]) return { ok: false, msg: `Try building ${v} different C₅H₁₂ molecules on the board; you have found ${got} so far and the strip rejects repeats.` };
        if (v < got) return { ok: false, msg: `You already have ${got} different C₅H₁₂ molecules recorded on the strip.` };
        if (v > got) return { ok: false, msg: `Your strip only has ${got} different C₅H₁₂ molecule${got === 1 ? '' : 's'} so far, fewer than ${v}.` };
        return { ok: false, msg: 'There is still another C₅H₁₂ isomer you have not recorded yet.' };
      },
      reward: {
        log: 'C₅H₁₂ has three structural isomers.',
        title: 'Three Isomers',
        body: 'Pentane, 2-methylbutane, and 2,2-dimethylpropane are the three structural isomers of C₅H₁₂. Any other build is just one of these bent differently.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const T = ttestFixture('rig', { x: 72, y: 30 }, { test: 'heat', only: ['pentane', 'methylbutane'], w: 58, h: 48 });
    return {
      id: 's3-compact',
      title: 'The Compact One',
      briefing: { speaker: SPEAKER, body: 'Molecules attract each other most where their surfaces touch. You only have samples of two of the three C₅H₁₂ isomers to heat.' },
      prompt: 'Compared with the other two isomers, where does the most compact one, 2,2-dimethylpropane, boil?',
      widget,
      table: thornTable({
        pieces: [tcard('c-pent', 'pentane', { x: 12, y: 10 }), tcard('c-mbut', 'methylbutane', { x: 12, y: 25 }), tcard('c-dmp', 'dimethylpropane', { x: 12, y: 40 })],
        fixtures: [T.fixture, tchoiceFixture('ans', 'It boils', { x: 125, y: 32 }, { options: ['Above both', 'Between them', 'Below both'], w: 44 })],
        zones: { slots: [T.slot] }
      }),
      hints: [
        'Watch the thermometer and the contact dashes in the window as you heat each available sample.',
        'Compare how much surface touches between two molecules in the window and where each sample boils.',
        'Think about how little surface area two ball-shaped molecules share compared with two stretched-out chains.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        if (pick === 3) return { ok: true };
        const tested = resultOf(state.table, 'c-pent', 'heat') !== undefined && resultOf(state.table, 'c-mbut', 'heat') !== undefined;
        if (!tested) return { ok: false, msg: 'Heat both available isomers first.' };
        return { ok: false, msg: 'Between the two you heated, the more compact one had less contact in the window and boiled lower.' };
      },
      reward: {
        log: '2,2-Dimethylpropane boils lowest of the three (9.5 °C).',
        title: 'Less Contact',
        body: 'Below both: it boils at 9.5 °C. More compact molecules touch their neighbors over less surface area, so the attractions between them are weaker.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const T = ttestFixture('rig', { x: 100, y: 29 }, { test: 'twist', w: 86, h: 48 });
    return {
      id: 's4-twist',
      title: 'One Side or the Other',
      briefing: { speaker: SPEAKER, body: 'A single bond lets the two ends of a molecule twist freely. Test what happens when a double bond connects the carbons instead.' },
      prompt: 'Which of these molecules comes in two separate forms that twisting cannot turn into each other?',
      widget,
      table: thornTable({
        pieces: [tcard('c-ane', 'dichloroethane', { x: 14, y: 8 }), tcard('c-12', 'dichloroethene12', { x: 14, y: 22.5 }), tcard('c-11', 'dichloroethene11', { x: 14, y: 37 })],
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'two', label: 'Two forms', at: { x: 22, y: 52 }, size: { w: 42, h: 14 } }] }
      }),
      hints: [
        'Watch the molecule window as you twist each sample card in the Sample slot.',
        'Compare what the far end does on a single bond versus a double bond, and look at the flipped version beside it.',
        'A molecule only has two separate forms if the bond refuses to twist and flipping one end actually produces a different arrangement.'
      ],
      check(state) {
        const card = inSlot(state, 'two');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.props.sub === 'dichloroethene12') return { ok: true };
        const seen = resultOf(state.table, card.id, 'twist');
        if (!seen) return { ok: false, msg: 'Twist that molecule in the rig first.' };
        if (card.props.sub === 'dichloroethane') return { ok: false, msg: 'Its single bond twisted freely and stayed turned.' };
        return { ok: false, msg: 'Flipping the far end gives the exact same molecule, because both chlorines are on the same carbon.' };
      },
      reward: {
        log: '1,2-Dichloroethene has cis and trans forms.',
        title: 'Cis and Trans',
        body: '1,2-Dichloroethene: its double bond cannot twist, so the two chlorines stay locked on the same side (cis) or on opposite sides (trans), making two different molecules.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-predict',
    title: 'The Mirror',
    predict: true,
    briefing: { speaker: SPEAKER, body: 'Your left hand is the mirror image of your right, yet rotating it never makes it fit a right glove. Test whether molecules can work the same way.' },
    prompt: 'Can a molecule\'s mirror image always be rotated until it matches the original?',
    widget,
    table: thornTable({
      pieces: [
        note('g-always', 'Always', { x: 30, y: 14 }),
        note('g-never', 'Never', { x: 30, y: 33 }),
        note('g-depends', 'It depends on the atoms', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 108, y: 44 }, { scene: 'mirror-ch2cl2', caption: 'CH₂Cl₂ and its mirror image, rotated until they match.', w: 70, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 108, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch how the picture rotates the mirror image of CH₂Cl₂ until every group lines up with the original.',
      'Think of your left and right hands: compare how they line up when you rotate one.',
      'Consider whether having two identical chlorines and two identical hydrogens makes matching easier than having four different groups.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Next, rotate CHFClBr\'s mirror image on the mirror rig to see if it ever matches.' }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const M = tmirrorFixture('mirror', { x: 56, y: 31 }, { groups: CHFCLBR, sub: 'bromochlorofluoromethane', title: 'CHFClBr and its mirror image', w: 96, h: 54 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's6-four',
      title: 'Four Different Groups',
      get prompt() { const g = guess(); return `Can the mirror image of CHFClBr be rotated to match it?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [M, tchoiceFixture('ans', 'Can it match?', { x: 127, y: 31 }, { options: ['Yes', 'No'], w: 40 })] }),
      hints: [
        'Watch the match count under the mirror rig as you rotate the mirror image.',
        'Check whether any of the twelve rotations ever puts all four groups in place at once.',
        'If no rotation can line up all four groups, the molecule and its mirror image are different molecules.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap Yes or No.' };
        if (pick === 2) return { ok: true };
        const r = mirrorRead(state.table, 'mirror');
        return { ok: false, msg: r.tried >= 12 ? 'None of the twelve rotations lined up all four groups.' : `None of the rotations tried so far lined up all four groups (${r.tried} of 12 tried).` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'CHFClBr is chiral.',
          title: 'Chiral',
          body: `No${g ? ` (you predicted ${g})` : ''}: every rotation left groups swapped, just like a left hand and a right hand. Such a molecule is chiral, and the mirror pair are enantiomers.`
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
        zones: { slots: [M.slot, { id: 'chiral', label: 'Chiral', at: { x: 22, y: 52 }, size: { w: 42, h: 14 } }] }
      }),
      hints: [
        'Look at the best match count printed on each card after testing it in the mirror rig.',
        'Compare the best count each card reached: a chiral molecule never reaches 4 of 4.',
        'Check the four groups attached to each central carbon to see if any two are identical.'
      ],
      check(state) {
        const card = inSlot(state, 'chiral');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const best = card.props.res?.mirror;
        if (best === undefined) return { ok: false, msg: 'Test that molecule in the mirror rig first and check its best count.' };
        if (card.props.sub === 'chloroethanol') return { ok: true };
        if (best === 4) return { ok: false, msg: 'A rotation matched all four groups on that molecule, so it is not chiral.' };
        return { ok: false, msg: 'Keep rotating it: two of its groups are identical, so a rotation will line up all four.' };
      },
      reward: {
        log: '1-Chloroethanol is chiral.',
        title: 'Four Different',
        body: '1-Chloroethanol: its central carbon holds four different groups (H, CH₃, OH, and Cl). The other two each have two identical groups, so rotating them matches their mirror image.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'lactic', mode: 'pick', pick: { kind: 'atom', among: ['c1', 'c2', 'c3'] }, title: 'Lactic acid', w: 112, h: 56 });
    return {
      id: 's8-centre',
      title: 'The Carbon That Does It',
      briefing: { speaker: SPEAKER, body: 'Lactic acid is a chiral molecule. Look closely at the four groups attached to each carbon.' },
      prompt: 'Which carbon atom makes lactic acid chiral?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Look at the three carbons in lactic acid and see what is bonded to each one.',
        'List the groups attached to each carbon and check whether any two are the same.',
        'A carbon only creates a non-matching mirror image when it is bonded to four different groups.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a carbon atom.' };
        if (r.picked === 'c2') return { ok: true };
        if (r.picked === 'c1') return { ok: false, msg: 'That carbon is bonded to three identical hydrogens.' };
        return { ok: false, msg: 'That carbon has a double bond to oxygen, so it is only bonded to three groups, not four.' };
      },
      reward: {
        log: 'Lactic acid\'s middle carbon is a stereocentre.',
        title: 'Stereocentre',
        body: 'The middle carbon holds four different groups: H, CH₃, OH, and –COOH. A carbon bonded to four different groups is called a stereocentre.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'One formula can describe several different molecules: atoms connected in different orders, groups locked on opposite sides of a double bond, or non-matching mirror images.' }]
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
