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
import { applyNotes } from '../../table/notes.js';
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
    { src: 'l:o:0', dst: 'hn1', msg: 'Nitrogen holds that hydrogen\'s pair less tightly than oxygen holds water\'s, and nothing moved: the pair returned.' },
    { src: 'l:o:1', dst: 'hn1', msg: 'Nitrogen holds that hydrogen\'s pair less tightly than oxygen holds water\'s, and nothing moved: the pair returned.' },
    { src: 'l:o:0', dst: 'hn2', msg: 'Nitrogen holds that hydrogen\'s pair less tightly than oxygen holds water\'s, and nothing moved: the pair returned.' },
    { src: 'l:o:1', dst: 'hn2', msg: 'Nitrogen holds that hydrogen\'s pair less tightly than oxygen holds water\'s, and nothing moved: the pair returned.' },
    { src: 'l:n:0', dst: 'hn1', msg: 'That hydrogen is already bonded to this nitrogen: the pair returned.' },
    { src: 'l:n:0', dst: 'hn2', msg: 'That hydrogen is already bonded to this nitrogen: the pair returned.' }
  ]
};
const V6 = tmolFixture('view', { x: 64, y: 31 }, { play: 'ethanoate-shift', mode: 'arrow', arrow: ARROW6, pairs: true, title: 'The ethanoate ion', w: 112, h: 56 });
const V7 = tmolFixture('view', { x: 75, y: 31 }, { play: 'amine-water', mode: 'arrow', arrow: ARROW7, pairs: true, title: 'Methylamine and water', w: 120, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'No pair has been moved yet.' };
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
      briefing: { speaker: SPEAKER, body: 'A functional group is a small group of atoms on a carbon chain that decides much of how the molecule behaves. Ethanol and methoxymethane share one formula, C₂H₆O.' },
      prompt: 'Which part of an ethanol molecule holds its neighbours so much more strongly than methoxymethane\'s does?',
      widget,
      table: thornTable({
        pieces: [tcard('c-eth', 'ethanol', { x: 12, y: 12 }), tcard('c-mom', 'methoxymethane', { x: 12, y: 28 })],
        fixtures: [T.fixture, V],
        zones: { slots: [T.slot] }
      }),
      hints: [
        'Heat each card in the rig, then tap an atom of the ethanol drawing.',
        'Compare what the window draws between two ethanol molecules with what it draws for methoxymethane.',
        'Look for the atom ethanol has that methoxymethane lacks: a hydrogen bonded to oxygen.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap an atom of the ethanol drawing.' };
        if (r.picked === 'ho' || r.picked === 'o') return { ok: true };
        const tested = resultOf(state.table, 'c-mom', 'heat') !== undefined;
        return { ok: false, msg: tested ? 'Methoxymethane has CH₃ groups too, and it boiled at −24.8 °C.' : 'Methoxymethane, with CH₃ groups too, has not been heated yet.' };
      },
      reward: {
        log: 'The –OH group: ethanol is an alcohol.',
        title: 'Alcohol',
        body: 'The –OH group: its hydrogen is attracted to the oxygen of the next molecule, a hydrogen bond. A chain carrying –OH is an alcohol, and –OH is its functional group.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Is It a Base',
    predict: true,
    prompt: 'Sodium hydroxide makes water basic: what does ethanol, with its –OH group, do to the pH of water?',
    widget,
    table: thornTable({
      pieces: [
        note('g-up', 'Raises it above 7', { x: 30, y: 14 }),
        note('g-seven', 'Leaves it at 7', { x: 30, y: 33 }),
        note('g-down', 'Lowers it below 7', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { scene: 'naoh-dissolves', caption: 'Sodium hydroxide in water: Na⁺ and OH⁻ come apart.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows sodium hydroxide coming apart into a sodium ion and a hydroxide ion in water.',
      'Compare how the OH is held in sodium hydroxide with how ethanol\'s O is held to its carbon.',
      'Ask whether ethanol\'s oxygen, held to carbon by a shared pair, would come away as a hydroxide ion.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it with the pH test.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const T = ttestFixture('rig', { x: 78, y: 30 }, { test: 'ph', w: 70, h: 48 });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-ph',
      title: 'The pH Test',
      get prompt() { const g = guess(); return `What does ethanol do to the pH of water?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({
        pieces: [tcard('c-naoh', 'naoh', { x: 11, y: 12 }), tcard('c-eth', 'ethanol', { x: 11, y: 28 })],
        fixtures: [T.fixture, tchoiceFixture('ans', 'Ethanol', { x: 131, y: 31 }, { options: ['Raises it', 'Leaves it at 7', 'Lowers it'], w: 34 })],
        zones: { slots: [T.slot] }
      }),
      hints: [
        'Lay each card in the holder and press "Add to Water".',
        'Compare the meter and the window for sodium hydroxide with those for ethanol.',
        'A base raises the pH because hydroxide ions come free in the water; ask whether any did with ethanol.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 2) return { ok: true };
        const seen = resultOf(state.table, 'c-eth', 'ph');
        if (seen === undefined) return { ok: false, msg: 'Ethanol has not been added to water yet.' };
        return { ok: false, msg: `The meter read pH ${seen.toFixed(1)} with ethanol in the water.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Ethanol left the pH at 7.',
          title: 'Not Hydroxide',
          body: `It leaves the pH at 7${g ? `; you predicted ${g}` : ''}. Ethanol\'s oxygen is held to carbon by a shared pair and does not come away as a hydroxide ion.`
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
      briefing: { speaker: SPEAKER, body: 'Oxygen attracts the electrons it shares more strongly than carbon does: its electronegativity is higher. So a pair shared by carbon and oxygen sits nearer the oxygen.' },
      prompt: 'Which atom of propanone is the electron-poor site?',
      widget,
      table: thornTable({
        pieces: [],
        fixtures: [V, plaqueFixture('en', 'Electronegativity', { x: 128, y: 20 }, ['O  3.4', 'C  2.6', 'H  2.2'], { w: 34 })]
      }),
      hints: [
        'Tap an atom of the drawing to choose it.',
        'Look at where each shared pair sits along its bond, and which atom each pair has moved away from.',
        'The electron-poor atom is the one whose shared pairs sit farthest from it.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap an atom.' };
        if (r.picked === 'c') return { ok: true };
        if (r.picked === 'o') return { ok: false, msg: 'Both pairs of the C=O bond sit nearer that oxygen.' };
        return { ok: false, msg: 'The pair that CH₃ shares with the middle carbon sits midway between them.' };
      },
      reward: {
        log: 'The carbon of C=O is electron-poor.',
        title: 'The Carbonyl Group',
        body: 'The carbon bonded to oxygen: both shared pairs of C=O sit nearer the oxygen, away from it. A carbon double-bonded to oxygen is a carbonyl group.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const T = ttestFixture('rig', { x: 100, y: 28 }, { test: 'ph', w: 86, h: 44 });
    return {
      id: 's5-acid',
      title: 'Which Is the Acid',
      prompt: 'Which of these three clear liquids from the still is an acid?',
      widget,
      table: thornTable({
        pieces: [tcard('c-eth', 'ethanol', { x: 14, y: 8 }), tcard('c-prop', 'propanone', { x: 14, y: 22.5 }), tcard('c-acid', 'ethanoic', { x: 14, y: 37 })],
        fixtures: [T.fixture],
        zones: { slots: [T.slot, { id: 'acid', label: 'The acid', at: { x: 22, y: 52 }, size: { w: 36, h: 12 } }] }
      }),
      hints: [
        'Lay each card in the holder and press "Add to Water".',
        'Compare the three meter readings and what moves in each window.',
        'An acid gives a proton to water and lowers the pH below 7.'
      ],
      check(state) {
        const card = inSlot(state, 'acid');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card.props.sub === 'ethanoic') return { ok: true };
        const seen = resultOf(state.table, card.id, 'ph');
        return { ok: false, msg: seen === undefined ? 'That liquid has not been added to water yet.' : `The meter read pH ${seen.toFixed(1)} for that one.` };
      },
      reward: {
        log: 'Ethanoic acid: –COOH gave a proton to water.',
        title: 'Carboxylic Acid',
        body: `Ethanoic acid, pH ${phOf('ethanoic').toFixed(1)}: its –COOH group gave a proton to water. A molecule with –COOH is a carboxylic acid.`
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-share',
    title: 'Why It Lets Go',
    prompt: 'Ethanoic acid lost a proton, leaving a spare pair on one oxygen: which atom can that pair move to?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V6, plaqueFixture('en', 'Electronegativity', { x: 136, y: 20 }, ['O  3.4', 'C  2.6'], { w: 24 })] }),
    hints: [
      'Tap an atom and press "Move Electrons": the charged oxygen\'s spare pair is the one that moves.',
      'Look at which atom has its shared pairs pulled away toward an oxygen.',
      'A carbon already holding four bonds can take a new pair only if one of its pairs moves off onto another atom.'
    ],
    check: arrowCheck,
    reward: {
      log: 'The charge is shared by two oxygens.',
      title: 'Shared Charge',
      body: 'To the electron-poor carbon, as the C=O pair moved out onto the other oxygen. The charge is shared by two oxygens (resonance), which lowers the ion\'s energy, so –COOH lets its proton go.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-amine',
    title: 'The Nitrogen Group',
    briefing: { speaker: SPEAKER, body: 'A nitrogen bonded into a carbon chain, with a lone pair of its own, makes an amine. Water\'s O–H pairs sit nearer oxygen, leaving its hydrogens electron-poor.' },
    prompt: 'Which pair of electrons moves first when methylamine meets water, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V7] }),
    hints: [
      'Tap a pair of electrons, then the atom it moves to, and press "Move Electrons".',
      'Compare the lone pairs on nitrogen and on oxygen, and where each O–H and N–H pair sits.',
      'A lone pair moves to an electron-poor hydrogen, and the pair that hydrogen shared stays with the atom that held it closer.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Methylamine took a proton from water.',
      title: 'Amine',
      body: 'Nitrogen\'s lone pair took a proton from water, and the O–H pair stayed on oxygen as OH⁻. An amine is a base: it raises the pH of water.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'lactic', mode: 'pick', pick: { kind: 'atom', among: ['h4', 'h5', 'h6'] }, pairs: true, title: 'Lactic acid', w: 120, h: 56 });
    return {
      id: 's8-which-h',
      title: 'Two O–H Groups',
      prompt: 'Lactic acid has two O–H groups: which hydrogen leaves as a proton when it is put in water?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Tap a hydrogen atom to choose it.',
        'Compare the oxygen each O–H hydrogen is bonded to, and what else is bonded to that oxygen\'s carbon.',
        'Use what the ethanoate ion showed: a charge left behind is shared only where a second oxygen sits on the same carbon.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a hydrogen atom.' };
        if (r.picked === 'h6') return { ok: true };
        if (r.picked === 'h5') return { ok: false, msg: 'The carbon that oxygen is bonded to holds no second oxygen.' };
        return { ok: false, msg: 'That hydrogen\'s pair sits nearly midway between it and carbon.' };
      },
      reward: {
        log: 'The –COOH hydrogen leaves.',
        title: 'The Acid Group',
        body: 'The hydrogen of –COOH: the charge it leaves is shared by two oxygens. The other O–H belongs to an alcohol group and stays.'
      }
    };
  })()
];

const NOTES = {
  1: ['Drag a card into the holder to test it; tap an atom to answer.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Drag a card into the holder to test it; tap a statement to answer.'],
  4: ['Tap an atom to answer.'],
  5: ['Drag a card into the holder to test it, then drag your answer into the slot.'],
  6: ['Tap an atom, then press the key.'],
  7: ['Tap a pair of dots, then an atom, then press the key.'],
  8: ['Tap a hydrogen to answer.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A functional group decides how a molecule behaves because of where it puts electrons: –OH hydrogen bonds, C=O leaves its carbon electron-poor, –COOH shares a charge, and an amine\'s lone pair takes a proton.' }]
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
