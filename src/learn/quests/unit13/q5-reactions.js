/**
 * Unit 13 · Bench 5 — Making and Breaking (q5-reactions)
 *
 * The fallen trunk on Thornmere's fifth mound, the Fifth's mixing floor, on the thorn kit: the electron view, the approach test and the
 * reaction viewer (`table/kits/thorn-react.js`). Eight stages and ONE click: the belief that an incoming group goes for the atom it
 * replaces. The electron view answers it: hydroxide's pair goes to the carbon, which bromine has left short of electrons, and the C–Br
 * pair leaves with the bromine. This bench carries the Charge Gardens' intuitions (rich to poor; four bonds, so one gives way; crowding
 * blocks a path; steps) without their college names.
 *
 *   1  PREDICT: hydroxide meets bromoethane: which atom does its pair go to?
 *   2  TEST: the arrow, in the electron view                                 -> the carbon; substitution
 *   3  rank four bromo-compounds by how easily hydroxide reaches the carbon  -> by CH₃ groups round the carbon
 *   4  which pair starts ethanol + ethanoic acid, and where does it go?       -> ethanol's O pair to the C=O carbon
 *   5  which bond of the product was made?                                   -> the acid C to the alcohol O: an ester; condensation
 *   6  where does hydroxide's pair go on the ester?                          -> the C=O carbon: hydrolysis
 *   7  sort three new reactions into addition, substitution, condensation
 *   8  SEALED: which carbon of 1,2-dibromo-2-methylpropane can hydroxide reach?  -> the CH₂ carbon
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { thornTable, tmolFixture, molRead, arrowScript, tleadFixture, ttestFixture, resultOf, tcard, note } from '../../table/kits/thorn.js';
import { sceneOf, pairsOf } from '../../engine/thorndata.js';
import '../../engine/thorn-scenes/q5-reactions.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bsubstitution\b/i, introducedAt: 2 },
  { term: /\besters?\b/i, introducedAt: 5 },
  { term: /\bcondensation\b/i, introducedAt: 5 },
  { term: /\bhydrolysis\b/i, introducedAt: 6 }
];

/** Electron-rich and electron-poor sites and the curved arrow are bench 2's; carboxylic acids and alcohols bench 4's. */
export const BUILDS_ON = ['unit13/q2-unsat', 'unit13/q4-groups'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit13/q5-reactions';
const GUESS = { 'g-br': 'the bromine', 'g-c': 'the carbon bonded to bromine', 'g-h': 'a hydrogen' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

const FOUR = 'That carbon has four bonds and none of them gave way: the pair returned.';
const ARROW2 = {
  right: { src: 'l:o:0', dst: 'c' }, srcFixed: 'l:o:0', dstAmong: ['c', 'br', 'm', 'h1', 'h2'],
  wrongs: [{ dst: 'br', msg: 'Bromine already holds four pairs of electrons round it: the pair returned.' }]
};
const ARROW4 = {
  right: { src: 'l:oe:0', dst: 'c' },
  srcAmong: pairsOf(sceneOf('est-0')).map(p => p.id).filter(id => id !== 'l:oe:1'),
  wrongs: [
    { src: 'l:oe:0', dst: 'h2', msg: 'A proton could only pass between the two oxygens, and no bond to carbon would form: the pair returned.' },
    { dst: 'm', msg: FOUR }
  ]
};
const ARROW6 = {
  right: { src: 'l:ox:0', dst: 'c' }, srcFixed: 'l:ox:0', dstAmong: ['m', 'c', 'o1', 'oe', 'e'],
  wrongs: [{ dst: 'e', msg: 'That carbon shares one pair with oxygen, and the C=O carbon three: the pair returned.' }, { dst: 'm', msg: FOUR }]
};

const V2 = tmolFixture('view', { x: 75, y: 31 }, { play: 'sub-oh', mode: 'arrow', arrow: ARROW2, pairs: true, title: 'Bromoethane and a hydroxide ion', w: 124, h: 56 });
const V4 = tmolFixture('view', { x: 75, y: 31 }, { play: 'ester-make', mode: 'arrow', arrow: ARROW4, pairs: true, under: 'Proton moves between oxygens are left out of this picture.', title: 'Ethanoic acid and ethanol', w: 124, h: 56 });
const V6 = tmolFixture('view', { x: 75, y: 31 }, { play: 'ester-break', mode: 'arrow', arrow: ARROW6, pairs: true, under: 'Drawn as one move; proton moves are left out.', title: 'Ethyl ethanoate and a hydroxide ion', w: 124, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'No pair has been moved yet.' };
  return { ok: false, msg: r.last.msg };
}

/* Stage 3: the four cards, easiest to reach first, and the CH₃ groups each carbon carries. */
const RANK = ['c-m', 'c-e', 'c-p', 'c-t'];
const CROWD = { 'c-m': 0, 'c-e': 1, 'c-p': 2, 'c-t': 3 };
/* Stage 7: where each reaction belongs. */
const KINDS = { 'c-a': 'add', 'c-b': 'sub', 'c-c': 'cond' };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Where It Goes',
    predict: true,
    prompt: 'A hydroxide ion, OH⁻, meets bromoethane: which atom do you expect its spare pair of electrons to move to?',
    widget,
    table: thornTable({
      pieces: [
        note('g-br', 'The bromine', { x: 30, y: 14 }),
        note('g-c', 'The carbon bonded to bromine', { x: 30, y: 33 }),
        note('g-h', 'A hydrogen', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { play: 'nh3-hcl', caption: 'Ammonia\'s lone pair moves to the hydrogen of H–Cl.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows a lone pair moving to the electron-poor end of H–Cl, and chlorine leaving with the pair it shared.',
      'Bromine attracts the pair it shares with carbon more strongly than carbon does.',
      'Ask which atom of bromoethane is left short of electrons, the way hydrogen was in H–Cl.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it in the electron view.' }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's2-in-out',
      title: 'One In, One Out',
      get prompt() { const g = guess(); return `Which atom of bromoethane does the hydroxide ion's spare pair move to?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [V2] }),
      hints: [
        'Tap an atom and press "Move Electrons": the hydroxide ion\'s pair is the one that moves.',
        'Look at where the pair shared by carbon and bromine sits along their bond.',
        'A pair moves to the electron-poor atom, and a carbon that gains a bond must let one of its four go.'
      ],
      check: arrowCheck,
      get reward() {
        const g = guess();
        return {
          log: 'Hydroxide bonded to carbon; bromide left.',
          title: 'Substitution',
          body: `The carbon${g ? ` (you predicted ${g})` : ''}: bromine pulls their shared pair, leaving carbon electron-poor, and the C–Br pair left with bromine. One group in, one out: a substitution reaction.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const T = ttestFixture('rig', { x: 104, y: 20 }, { test: 'reach', only: ['bromomethane', 'tbutylbromide'], w: 84, h: 38 });
    const card = (id, sub, text) => tcard(id, sub, { x: 0, y: 0 }, { text });
    return {
      id: 's3-crowding',
      title: 'Crowding',
      prompt: 'How easily does a hydroxide ion reach the carbon bonded to bromine in each of these four molecules?',
      widget,
      table: thornTable({
        pieces: [card('c-m', 'bromomethane', 'CH₃Br'), card('c-e', 'bromoethane', 'CH₃CH₂Br'), card('c-p', 'bromopropane2', '(CH₃)₂CHBr'), card('c-t', 'tbutylbromide', '(CH₃)₃CBr')],
        fixtures: [T.fixture],
        zones: {
          slots: [T.slot],
          rail: { at: { x: 75, y: 52 }, size: { w: 140, h: 12 }, first: 'Reached most easily', last: 'Hardest to reach', items: RANK, start: ['c-p', 'c-m', 'c-t', 'c-e'] }
        }
      }),
      hints: [
        'Lay a card in the Sample slot and press "Send In OH⁻"; only two of the four are in store.',
        'Compare what stands round the carbon in the two that can be tested.',
        'A CH₃ group is far larger than a hydrogen, so ask how much of the way in each carbon\'s neighbours fill.'
      ],
      check(state) {
        const order = state.table.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four cards on the rail.' };
        if (order.join() === RANK.join()) return { ok: true };
        const k = order.findIndex((id, i) => i > 0 && CROWD[order[i - 1]] > CROWD[id]);
        const a = state.table.pieces[order[k - 1]]; const b = state.table.pieces[order[k]];
        return { ok: false, msg: `${a.props.text} sits before ${b.props.text}, and its carbon carries more CH₃ groups.` };
      },
      reward: {
        log: 'Each CH₃ group blocks more of the way in.',
        title: 'Crowding Blocks the Way',
        body: 'From CH₃Br to (CH₃)₃CBr: hydrogens left the way open, and each CH₃ group round the carbon blocked more of it.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-acid-alcohol',
    title: 'Acid Meets Alcohol',
    prompt: 'Which pair of electrons starts the reaction between ethanol and ethanoic acid, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V4] }),
    hints: [
      'Tap a pair of electrons, then the atom it moves to, and press "Move Electrons".',
      'Compare where each molecule holds spare pairs, and where each of the acid\'s shared pairs sits along its bond.',
      'A pair moves from an electron-rich site to an electron-poor carbon, and the C=O pair can move out onto its oxygen so the carbon keeps four bonds.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Ethanol\'s oxygen bonded to the acid\'s carbon; water left.',
      title: 'Joined, Water Out',
      body: 'Ethanol\'s oxygen pair moved to the electron-poor carbon of C=O. When that carbon\'s pair came back, the acid\'s –OH left with a hydrogen as water.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'est-2', mode: 'pick', pick: { kind: 'bond', among: [['c', 'oe'], ['c', 'o1'], ['m', 'c'], ['oe', 'e']] }, marks: ['oe', 'e'], under: 'Ringed: the atoms that came from ethanol.', title: 'The products', w: 110, h: 56 });
    return {
      id: 's5-new-bond',
      title: 'The New Bond',
      prompt: 'Which bond of the product was made in the reaction between ethanol and ethanoic acid?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Tap a bond of the product to choose it.',
        'Compare the ringed atoms that came from ethanol with the atoms that came from the acid.',
        'The new bond joins an atom that came from one molecule to an atom that came from the other.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a bond.' };
        const [a, b] = r.picked;
        if (a === 'c' && b === 'oe') return { ok: true };
        if (a === 'oe') return { ok: false, msg: 'Both atoms of that bond are ringed: it was in the ethanol before the reaction.' };
        return { ok: false, msg: 'Neither atom of that bond is ringed: it was in the acid before the reaction.' };
      },
      reward: {
        log: 'The ester link: acid carbon to alcohol oxygen.',
        title: 'Ester and Condensation',
        body: 'The C–O bond from the acid\'s carbon to the alcohol\'s oxygen. The product is an ester, and joining two molecules while a small one leaves is a condensation reaction.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-break',
    title: 'Water Breaks It',
    briefing: { speaker: SPEAKER, body: 'The ester link was made as water left. Here a hydroxide ion, made from water, meets the ester.' },
    prompt: 'Which atom of the ester does the hydroxide ion\'s spare pair move to?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V6] }),
    hints: [
      'Tap an atom and press "Move Electrons": the hydroxide ion\'s pair is the one that moves.',
      'Compare the two carbons bonded to the link\'s oxygen: how many pairs each shares with oxygen.',
      'The pair goes where carbon is shortest of electrons, and the link\'s pair can leave with its oxygen.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Hydroxide broke the ester link.',
      title: 'Hydrolysis',
      body: 'To the carbon of C=O, and the link\'s C–O pair left with the alcohol\'s oxygen. A link made by losing water, broken by adding it back: hydrolysis.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const T = ttestFixture('rig', { x: 96, y: 20 }, { test: 'react', w: 92, h: 36 });
    const tray = (id, label, x) => ({ id, label, at: { x, y: 50 }, size: { w: 36, h: 11 }, cell: 22, cellH: 11 });
    return {
      id: 's7-kinds',
      title: 'Three Kinds',
      prompt: 'Which of these three reactions is an addition, which a substitution, and which a condensation?',
      widget,
      table: thornTable({
        pieces: [tcard('c-a', 'rxA', { x: 14, y: 8 }), tcard('c-b', 'rxB', { x: 14, y: 22.5 }), tcard('c-c', 'rxC', { x: 14, y: 37 })],
        fixtures: [T.fixture],
        zones: { slots: [T.slot], trays: [tray('add', 'Addition', 48), tray('sub', 'Substitution', 88), tray('cond', 'Condensation', 128)] }
      }),
      hints: [
        'Lay a reaction card in the Sample slot and press "Run Reaction".',
        'Watch which atoms join and which leave, and count the separate molecules before and after.',
        'Addition leaves nothing over; substitution swaps one group for another; condensation joins two molecules and lets a small one go.'
      ],
      check(state) {
        const pieces = Object.values(state.table.pieces).filter(p => KINDS[p.id]);
        const placed = pieces.filter(p => String(p.zone || '').startsWith('tray:'));
        if (placed.length < 3) return { ok: false, notYet: true, msg: 'Lay each reaction card in a tray.' };
        const wrong = placed.find(p => p.zone !== `tray:${KINDS[p.id]}`);
        if (!wrong) return { ok: true };
        const seen = resultOf(state.table, wrong.id, 'react');
        if (seen === undefined) return { ok: false, msg: `${wrong.label} has not been run yet.` };
        return { ok: false, msg: `${wrong.label} ran ${seen} in separate molecules and ions, and does not belong in that tray.` };
      },
      reward: {
        log: 'Addition, substitution, condensation.',
        title: 'Three Kinds',
        body: 'A is an addition, with nothing left over; B a substitution, one group in and one out; C a condensation, two molecules joined as water left.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'dibromo', mode: 'pick', pick: { kind: 'atom', among: ['c1', 'c2', 'm1', 'm2'] }, pairs: true, title: '1,2-Dibromo-2-methylpropane', w: 110, h: 56 });
    return {
      id: 's8-two-carbons',
      title: 'Two Carbons Bonded to Bromine',
      prompt: 'Which carbon of this molecule can a hydroxide ion reach and bond to?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Tap a carbon to choose it.',
        'Compare which carbons have a pair pulled toward bromine, and what stands round each of those.',
        'The ion needs a carbon that is electron-poor and that it can get to from the side opposite the bromine.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a carbon.' };
        if (r.picked === 'c1') return { ok: true };
        if (r.picked === 'c2') return { ok: false, msg: 'Two CH₃ groups and a carbon stand round that one.' };
        return { ok: false, msg: 'No bromine pulls that group\'s pairs.' };
      },
      reward: {
        log: 'The CH₂ carbon is the one hydroxide reaches.',
        title: 'Rich to Poor, Unblocked',
        body: 'The carbon with two hydrogens: bromine leaves it electron-poor, and its hydrogens leave the way open. The other is just as poor, but crowded.'
      }
    };
  })()
];

const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Tap an atom, then press the key.'],
  3: ['Drag a card into the Sample slot to test it, then along the rail.'],
  4: ['Tap a pair of dots, then an atom, then press the key.'],
  5: ['Tap a bond to answer.'],
  6: ['Tap an atom, then press the key.'],
  7: ['Drag a card into the Sample slot, then into a tray.'],
  8: ['Tap a carbon to answer.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A reaction is a pair of electrons moving from an electron-rich site to an electron-poor carbon; a carbon that gains a bond lets one go; crowding blocks the way. An ester link made by losing water is broken by adding it back.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const pick = (fixture, n) => ({ setDial: { fixture, dial: 'pick', value: n } });
const rail = order => order.map((id, i) => put(id, `rail:${i}`));

export const SOLUTIONS = [
  [put('g-br', 'slot:guess')],
  arrowScript(V2, null, 'c'),
  [put('c-m', 'slot:rig.holder'), { run: 'rig' }, put('c-t', 'slot:rig.holder'), { run: 'rig' }, ...rail(RANK)],
  arrowScript(V4, 'l:oe:0', 'c'),
  [pick('mol', 1)],
  arrowScript(V6, null, 'c'),
  [put('c-a', 'slot:rig.holder'), { run: 'rig' }, put('c-a', 'tray:add'), put('c-b', 'slot:rig.holder'), { run: 'rig' }, put('c-b', 'tray:sub'), put('c-c', 'slot:rig.holder'), { run: 'rig' }, put('c-c', 'tray:cond')],
  [pick('mol', 1)]
];

export const MISSES = [
  [],
  arrowScript(V2, null, 'br'),
  [put('c-m', 'slot:rig.holder'), { run: 'rig' }, ...rail(['c-e', 'c-m', 'c-p', 'c-t'])],
  arrowScript(V4, 'l:oe:0', 'h2'),
  [pick('mol', 2)],
  arrowScript(V6, null, 'e'),
  [put('c-a', 'slot:rig.holder'), { run: 'rig' }, put('c-a', 'tray:cond'), put('c-b', 'tray:sub'), put('c-c', 'tray:add')],
  [pick('mol', 2)]
];

/** The arrows a student is likely to draw and must be refused, each with a reason (`verify:thornmere` replays them). */
export const SLIPS = {
  2: [[null, 'br'], [null, 'h1'], [null, 'm']],
  4: [['l:oe:0', 'h2'], ['l:o2:0', 'e'], ['l:oe:0', 'o1'], ['l:o1:0', 'he']],
  6: [[null, 'e'], [null, 'o1'], [null, 'oe']]
};
export const ARROW_VIEWS = { 2: V2, 4: V4, 6: V6 };

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
