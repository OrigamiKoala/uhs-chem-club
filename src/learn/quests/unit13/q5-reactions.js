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

const FOUR = 'That carbon already has four full bonds and none broke, so the pair bounced back.';
const ARROW2 = {
  right: { src: 'l:o:0', dst: 'c' }, srcFixed: 'l:o:0', dstAmong: ['c', 'br', 'm', 'h1', 'h2'],
  wrongs: [{ dst: 'br', msg: 'Bromine already has a full set of electrons, so the pair bounced back.' }]
};
const ARROW4 = {
  right: { src: 'l:oe:0', dst: 'c' },
  srcAmong: pairsOf(sceneOf('est-0')).map(p => p.id).filter(id => id !== 'l:oe:1'),
  wrongs: [
    { src: 'l:oe:0', dst: 'h2', msg: 'Moving to that hydrogen only passes a proton between oxygens without bonding to carbon, so the pair bounced back.' },
    { dst: 'm', msg: FOUR }
  ]
};
const ARROW6 = {
  right: { src: 'l:ox:0', dst: 'c' }, srcFixed: 'l:ox:0', dstAmong: ['m', 'c', 'o1', 'oe', 'e'],
  wrongs: [{ dst: 'e', msg: 'That carbon only shares one bond with oxygen, while the C=O carbon shares three bonds with oxygens, so the pair bounced back.' }, { dst: 'm', msg: FOUR }]
};

const V2 = tmolFixture('view', { x: 75, y: 31 }, { play: 'sub-oh', mode: 'arrow', arrow: ARROW2, pairs: true, title: 'Bromoethane and a hydroxide ion', w: 124, h: 56 });
const V4 = tmolFixture('view', { x: 75, y: 31 }, { play: 'ester-make', mode: 'arrow', arrow: ARROW4, pairs: true, title: 'Ethanoic acid and ethanol', w: 124, h: 56 });
const V6 = tmolFixture('view', { x: 75, y: 31 }, { play: 'ester-break', mode: 'arrow', arrow: ARROW6, pairs: true, title: 'Ethyl ethanoate and a hydroxide ion', w: 124, h: 56 });

function arrowCheck(state) {
  const r = molRead(state.table, 'view');
  if (r.done) return { ok: true };
  if (!r.tried) return { ok: false, notYet: true, msg: 'Move an electron pair first.' };
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
    briefing: { speaker: SPEAKER, body: 'To see how hydroxide (OH⁻) reacts with carbon links, start with a simpler molecule: bromoethane, a carbon chain carrying a bromine atom.' },
    prompt: 'When hydroxide (OH⁻) meets bromoethane, which atom do you expect its spare electron pair to move to?',
    widget,
    table: thornTable({
      pieces: [
        note('g-br', 'The bromine', { x: 30, y: 14 }),
        note('g-c', 'The carbon bonded to bromine', { x: 30, y: 33 }),
        note('g-h', 'A hydrogen', { x: 30, y: 52 })
      ],
      fixtures: [tleadFixture('lead', { x: 112, y: 44 }, { play: 'nh3-hcl', caption: 'Ammonia\'s lone pair moves to the hydrogen of H–Cl.', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'The clip shows a lone pair moving to the electron-poor end of H–Cl while chlorine leaves with the shared pair.',
      'Bromine pulls the electrons it shares with carbon much more strongly than carbon does.',
      'Find which atom in bromoethane is left short of electrons, just like hydrogen was in H–Cl.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Next, move hydroxide\'s spare pair onto bromoethane in the electron view.' }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's2-in-out',
      title: 'One In, One Out',
      get prompt() { const g = guess(); return `Which atom of bromoethane does hydroxide's spare electron pair move to?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: thornTable({ pieces: [], fixtures: [V2] }),
      hints: [
        'Look at the highlighted spare pair on hydroxide and the shared pair between carbon and bromine.',
        'Check which way the shared electron pair sits along the C–Br bond.',
        'The pair moves to the electron-poor atom, and a carbon that gains a bond must release one of its four.'
      ],
      check: arrowCheck,
      get reward() {
        const g = guess();
        return {
          log: 'Hydroxide bonded to carbon; bromide left.',
          title: 'Substitution',
          body: `The carbon bonded to bromine: bromine pulls their electrons away, leaving carbon electron-poor, so the C–Br pair leaves as Br⁻. Swapping one group for another is a substitution reaction${g ? ` (you predicted ${g})` : ''}.`
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
      briefing: { speaker: SPEAKER, body: 'To bond with carbon, hydroxide must approach from the side opposite bromine. Test which groups around carbon leave the path open and which block it.' },
      prompt: 'Rank these four molecules from easiest to hardest for hydroxide to reach the carbon bonded to bromine.',
      widget,
      table: thornTable({
        pieces: [card('c-m', 'bromomethane', 'CH₃Br'), card('c-e', 'bromoethane', 'CH₃CH₂Br'), card('c-p', 'bromopropane2', '(CH₃)₂CHBr'), card('c-t', 'tbutylbromide', '(CH₃)₃CBr')],
        fixtures: [T.fixture],
        zones: {
          slots: [T.slot],
          rail: { at: { x: 75, y: 52 }, size: { w: 140, h: 12 }, first: 'Easiest to reach', last: 'Hardest to reach', items: RANK, start: ['c-p', 'c-m', 'c-t', 'c-e'] }
        }
      }),
      hints: [
        'Test the two available samples in the Approach test, then arrange all four cards on the rail.',
        'Compare the size of the groups around the carbon in the two samples you can test.',
        'A CH₃ group is much bulkier than a single hydrogen, so more CH₃ groups block more of the path.'
      ],
      check(state) {
        const order = state.table.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Place all four cards on the rail.' };
        if (order.join() === RANK.join()) return { ok: true };
        const k = order.findIndex((id, i) => i > 0 && CROWD[order[i - 1]] > CROWD[id]);
        const a = state.table.pieces[order[k - 1]]; const b = state.table.pieces[order[k]];
        return { ok: false, msg: `${a.props.text} is placed before ${b.props.text}, even though its carbon has more bulky CH₃ groups.` };
      },
      reward: {
        log: 'Each CH₃ group blocks more of the way in.',
        title: 'Crowding Blocks the Way',
        body: 'From CH₃Br to (CH₃)₃CBr: small hydrogens leave the path open, while each bulky CH₃ group blocks more of it, slowing or stopping substitution.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-acid-alcohol',
    title: 'Acid Meets Alcohol',
    briefing: { speaker: SPEAKER, body: 'Now combine an acid and an alcohol: ethanoic acid meets ethanol to form an armor link.' },
    prompt: 'Which electron pair starts the reaction between ethanol and ethanoic acid, and where does it go?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V4] }),
    hints: [
      'Look at the gold lone pairs on ethanol\'s oxygen and the C=O carbon of ethanoic acid.',
      'Check which molecule has an exposed lone pair and which carbon has its electrons pulled away by oxygens.',
      'The lone pair moves to the electron-poor C=O carbon, while the C=O pair shifts onto oxygen so carbon keeps four bonds.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Ethanol\'s oxygen bonded to the acid\'s carbon; water left.',
      title: 'Joined, Water Out',
      body: 'Ethanol\'s oxygen pair bonded to the acid\'s electron-poor C=O carbon, and the acid\'s –OH left with a hydrogen as water.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const V = tmolFixture('mol', { x: 75, y: 31 }, { scene: 'est-2', mode: 'pick', pick: { kind: 'bond', among: [['c', 'oe'], ['c', 'o1'], ['m', 'c'], ['oe', 'e']] }, marks: ['oe', 'e'], under: 'Ringed: atoms that came from ethanol.', title: 'The products', w: 110, h: 56 });
    return {
      id: 's5-new-bond',
      title: 'The New Bond',
      prompt: 'Which bond in this product was newly formed between ethanol and ethanoic acid?',
      widget,
      table: thornTable({ pieces: [], fixtures: [V] }),
      hints: [
        'Look at which atoms are ringed (from ethanol) and which are unringed (from the acid).',
        'Trace the border between the ringed ethanol atoms and the unringed acid atoms.',
        'The new bond connects one atom from the acid directly to one atom from the alcohol.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a bond.' };
        const [a, b] = r.picked;
        if (a === 'c' && b === 'oe') return { ok: true };
        if (a === 'oe') return { ok: false, msg: 'Both atoms of that bond are ringed, so it was already in ethanol before the reaction.' };
        return { ok: false, msg: 'Neither atom of that bond is ringed, so it was already in the acid before the reaction.' };
      },
      reward: {
        log: 'The ester link: acid carbon to alcohol oxygen.',
        title: 'Ester and Condensation',
        body: 'The C–O bond from the acid\'s carbon to the alcohol\'s oxygen forms an ester. Joining two molecules while releasing a small one like water is a condensation reaction.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-break',
    title: 'Water Breaks It',
    briefing: { speaker: SPEAKER, body: 'The ester formed when water left. Here hydroxide (OH⁻, water minus one proton) meets the ester to reverse that link.' },
    prompt: 'Which atom of the ester does hydroxide\'s spare electron pair move to?',
    widget,
    table: thornTable({ pieces: [], fixtures: [V6] }),
    hints: [
      'Look at the highlighted pair on hydroxide and the two carbons next to the ester\'s oxygen.',
      'Compare how many bonds to oxygen each of those two carbons has.',
      'The pair moves to the most electron-poor carbon, letting the ester\'s C–O bond break.'
    ],
    check: arrowCheck,
    reward: {
      log: 'Hydroxide broke the ester link.',
      title: 'Hydrolysis',
      body: 'To the C=O carbon, breaking the C–O link so the alcohol\'s oxygen leaves. Breaking a link by adding water back across it is called hydrolysis.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const T = ttestFixture('rig', { x: 96, y: 20 }, { test: 'react', w: 92, h: 36 });
    const tray = (id, label, x) => ({ id, label, at: { x, y: 50 }, size: { w: 40, h: 13 }, cell: 24, cellH: 13 });
    return {
      id: 's7-kinds',
      title: 'Three Kinds',
      briefing: { speaker: SPEAKER, body: 'Addition joins atoms across a double bond with nothing left over, substitution swaps one group for another, and condensation joins two molecules while releasing a small one.' },
      prompt: 'Sort these three reactions into addition, substitution, and condensation.',
      widget,
      table: thornTable({
        pieces: [tcard('c-a', 'rxA', { x: 14, y: 8 }), tcard('c-b', 'rxB', { x: 14, y: 22.5 }), tcard('c-c', 'rxC', { x: 14, y: 37 })],
        fixtures: [T.fixture],
        zones: { slots: [T.slot], trays: [tray('add', 'Addition', 46), tray('sub', 'Substitution', 88), tray('cond', 'Condensation', 130)] }
      }),
      hints: [
        'Run each card in the Reaction viewer to see which atoms join and which leave.',
        'Count how many separate molecules exist before and after each reaction.',
        'Addition leaves nothing over, substitution swaps one group for another, and condensation joins two molecules while releasing water.'
      ],
      check(state) {
        const pieces = Object.values(state.table.pieces).filter(p => KINDS[p.id]);
        const placed = pieces.filter(p => String(p.zone || '').startsWith('tray:'));
        if (placed.length < 3) return { ok: false, notYet: true, msg: 'Place all three reaction cards into trays.' };
        const wrong = placed.find(p => p.zone !== `tray:${KINDS[p.id]}`);
        if (!wrong) return { ok: true };
        const seen = resultOf(state.table, wrong.id, 'react');
        if (seen === undefined) return { ok: false, msg: `Run ${wrong.label} in the viewer first.` };
        return { ok: false, msg: `${wrong.label} went ${seen} in separate molecules and ions, so it belongs in a different tray.` };
      },
      reward: {
        log: 'Addition, substitution, condensation.',
        title: 'Three Kinds',
        body: 'A is addition (nothing left over), B is substitution (one group swaps for another), and C is condensation (two molecules join while water leaves).'
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
        'Find both carbons bonded to bromine and check the groups around each one.',
        'Compare how crowded the two bromine-bonded carbons are.',
        'Hydroxide needs a carbon that is both electron-poor and open enough to reach from the side opposite bromine.'
      ],
      check(state) {
        const r = molRead(state.table, 'mol');
        if (!r.picked) return { ok: false, notYet: true, msg: 'Tap a carbon.' };
        if (r.picked === 'c1') return { ok: true };
        if (r.picked === 'c2') return { ok: false, msg: 'Two bulky CH₃ groups and another carbon crowd that carbon and block hydroxide.' };
        return { ok: false, msg: 'That carbon has no bromine pulling its electrons away.' };
      },
      reward: {
        log: 'The CH₂ carbon is the one hydroxide reaches.',
        title: 'Rich to Poor, Unblocked',
        body: 'The carbon with two hydrogens: bromine makes it electron-poor, and its small hydrogens leave the path open. The other carbon is just as electron-poor, but too crowded.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Reactions happen when an electron-rich pair moves to an electron-poor carbon, pushing out another bond if the path is not crowded. Ester links formed by losing water can be broken by adding water back.' }]
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
