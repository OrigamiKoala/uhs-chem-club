/**
 * Unit 12 · Bench 6 — Magnetism (q6-spin)
 *
 * The Coil's control shed, on the lode kit. A magnetic balance beside the split d-orbital ladder and the lamp-and-prism bench. Seven
 * stages and ONE click: the belief that d electrons always spread out across all five orbitals before any pair (Hund's rule without the
 * gap). With a wide gap, pairing in the lower three costs less than crossing the gap.
 *
 *   1  two iron(II) complexes on the balance                                   -> paramagnetic vs diamagnetic
 *   2  PREDICT: with a wide gap, do six d electrons spread out or pair below?
 *   3  TEST: place six electrons on the wide-gap ladder and Test Energy        -> low spin vs high spin (pairing cost vs gap)
 *   4  which d-electron counts change unpaired count between narrow and wide   -> d⁴ to d⁷ have two arrangements; d³, d⁸ do not
 *   5  rank three water complexes by magnetic pull (commit gate before magnet) -> pull grows with unpaired electrons
 *   6  two cobalt(III) drums: read colour first, then check which is pulled    -> wide gap pairs d⁶; narrow gap leaves four unpaired
 *   7  SEALED: match the sealed drum's pull to Cu²⁺'s, then identify it        -> Fe³⁺ with a wide gap (one unpaired)
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  lodeTable, magnetFixture, dsplitFixture, dsplitRead, specFixture, vial, note, numCard, lodeLeadFixture
} from '../../table/kits/lode.js';
import { COMPLEXES, GAPS } from '../../engine/lodedata.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bparamagnetic\b/i, introducedAt: 1 },
  { term: /\bpairing cost\b/i, introducedAt: 3 },
  { term: /\b(low|high) spin\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit12/q5-colour'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit12/q6-spin';
const GUESS = { 'g-spread': 'spreading across all five orbitals', 'g-pair': 'pairing up in the lower three' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const railIds = state => state.table.zones?.rail?.order || [];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const M = magnetFixture('mag', { x: 76, y: 21 }, { w: 72, h: 36 });
    return {
      id: 's1-iron',
      title: 'Two Iron Drums',
      prompt: 'Which iron(II) complex is pulled by the magnet?',
      briefing: { speaker: SPEAKER, body: 'Unpaired electrons make a substance paramagnetic, meaning a magnet pulls on it. Paired electrons cancel each other out and produce no pull.' },
      widget,
      table: lodeTable({
        pieces: [
          vial('v-fe2-aq', 'fe2-aq', { x: 20, y: 49 }, { name: 'Fe²⁺ + H₂O' }),
          vial('v-fe2-cn', 'fe2-cn', { x: 44, y: 49 }, { name: 'Fe²⁺ + CN−' })
        ],
        fixtures: [M.fixture],
        zones: { slots: [M.slot, { id: 'answer', label: 'Pulled by magnet', at: { x: 128, y: 46 }, size: { w: 28, h: 16 } }] }
      }),
      hints: [
        'Test each vial in the Magnet balance and press "Switch On" to see if it moves toward the poles.',
        'Compare the pull bar for the water complex and the cyanide complex.',
        'Only complexes with unpaired electrons are pulled by a magnet.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a vial in the answer slot.' };
        if (card.id === 'v-fe2-aq') return { ok: true };
        if (card.props.pull == null) return { ok: false, msg: 'Test that vial in the Magnet balance first.' };
        return { ok: false, msg: 'The cyanide vial showed no magnetic pull.' };
      },
      reward: {
        log: 'The water complex is paramagnetic.',
        title: 'The Ligand Decides',
        body: 'The water complex is paramagnetic and pulled by the magnet, while the cyanide complex is not. Both contain Fe²⁺ with six d electrons, so the ligand determines the magnetism.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Spread or Pair',
    predict: true,
    prompt: 'With a wide energy gap, do six d electrons spread across all five orbitals or pair in the lower three?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-spread', 'Spread out: one per orbital before any pair', { x: 32, y: 20 }),
        note('g-pair', 'Pair up in the lower three orbitals', { x: 32, y: 44 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'd6-equal', w: 62, h: 30, title: 'Watch first' })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch the clip showing six d electrons when all five orbitals have equal energy.',
      'Spreading out avoids pairing, but forces electrons up into the higher-energy level.',
      'Compare the energy cost of pairing two electrons with the energy cost of crossing the gap.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      remember(QUEST_KEY, card.id);
      return { ok: true };
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is saved. Now test how six d electrons arrange themselves across a wide gap.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const D = dsplitFixture('ds', { x: 75, y: 31 }, { mode: 'build', gap: GAPS.wide, pair: true, count: 6, w: 122, h: 52, title: 'Six d electrons, wide gap' });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-test',
      title: 'Pairing Against the Gap',
      get prompt() { const g = guess(); return `Arrange six d electrons at the lowest energy across this wide gap${g ? ` (you predicted ${g})` : ''}.`; },
      briefing: { speaker: SPEAKER, body: 'Putting two electrons in the same orbital requires energy (the pairing cost, shown by the purple bar). Jumping across the gap also requires energy.' },
      widget,
      table: lodeTable({ fixtures: [D.fixture] }),
      hints: [
        'Compare the height of the energy gap with the purple pairing-cost bar.',
        'Place six electrons in the boxes and press "Test Energy" to check your arrangement.',
        'Electrons take whichever option costs less energy: pairing up when crossing the gap costs more.'
      ],
      check(state) {
        const r = dsplitRead(state.table, 'ds');
        if (r.n !== 6) return { ok: false, notYet: true, msg: `Place 6 electrons in total (${r.n} placed so far).` };
        if (r.occ.slice(0, 3).every(x => x === 2) && r.occ.slice(3).every(x => x === 0)) return { ok: true };
        return { ok: false, msg: 'Two electrons are above the gap, which costs more energy than pairing them in the lower orbitals.' };
      },
      reward: {
        log: 'With a wide gap, all six pair in the lower three.',
        title: 'Low Spin and High Spin',
        get body() { const g = guess(); return `When the gap is wider than the pairing cost, all six electrons pair in the lower three orbitals (low spin), leaving none unpaired. A narrow gap lets them spread across all five (high spin).${g ? ` You predicted ${g}.` : ''}`; }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const D = dsplitFixture('ds', { x: 64, y: 21 }, { mode: 'fill', countDial: [3, 4, 5, 6, 7, 8], gapDial: true, w: 96, h: 40, title: 'Fill Lowest' });
    const ids = ['d3', 'd5', 'd8'];
    const CHANGES = new Set(['d5']);
    return {
      id: 's4-counts',
      title: 'Which Counts Change',
      briefing: { speaker: SPEAKER, body: 'Set "d electrons" and "Gap" (Narrow or Wide), then press "Fill Lowest" to see if the number of unpaired electrons changes.' },
      prompt: 'For which d-electron counts does gap width change the number of unpaired electrons?',
      widget,
      table: lodeTable({
        pieces: [
          numCard('c-d3', 'd³', { x: 12, y: 52 }, 3),
          numCard('c-d5', 'd⁵', { x: 28, y: 52 }, 5),
          numCard('c-d8', 'd⁸', { x: 44, y: 52 }, 8)
        ],
        fixtures: [D.fixture],
        zones: {
          trays: [
            { id: 'changes', label: 'Unpaired count changes', at: { x: 78, y: 53 }, size: { w: 38, h: 14 }, cell: 12, cellH: 13 },
            { id: 'same', label: 'Stays the same', at: { x: 122, y: 53 }, size: { w: 38, h: 14 }, cell: 12, cellH: 13 }
          ]
        }
      }),
      hints: [
        'Test each electron count with both Narrow and Wide gaps using "Fill Lowest", then sort the cards.',
        'Compare the number of unpaired electrons at the narrow gap versus the wide gap.',
        'The unpaired count only changes when an electron has to choose between pairing below or crossing the gap.'
      ],
      check(state) {
        const t = state.table;
        const off = ids.filter(id => !['tray:changes', 'tray:same'].includes(t.pieces[`c-${id}`].zone));
        if (off.length) return { ok: false, notYet: true, msg: `${off.length} card${off.length > 1 ? 's still need' : ' still needs'} to be placed in a tray.` };
        const wrong = ids.find(id => (t.pieces[`c-${id}`].zone === 'tray:changes') !== CHANGES.has(id));
        if (!wrong) return { ok: true };
        if (wrong === 'd8') return { ok: false, msg: 'd⁸ has two unpaired electrons for both the narrow gap and the wide gap.' };
        if (wrong === 'd3') return { ok: false, msg: 'd³ has three unpaired electrons for both the narrow gap and the wide gap.' };
        return { ok: false, msg: 'd⁵ has five unpaired electrons with a narrow gap, but only one with a wide gap.' };
      },
      reward: {
        log: 'Only d⁵ changes here (d⁴ to d⁷ have two arrangements).',
        title: 'Four to Seven',
        body: 'Only d⁵ changes here (from five unpaired down to one). Both d³ and d⁸ keep the same unpaired count either way; only d⁴ through d⁷ have both high-spin and low-spin forms.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const D = dsplitFixture('ds', { x: 38, y: 21 }, { mode: 'fill', countDial: [3, 5, 8], gap: GAPS.narrow, w: 66, h: 40, title: 'Water complexes (narrow gap)' });
    const M = magnetFixture('mag', { x: 116, y: 21 }, { w: 58, h: 40 });
    return {
      id: 's5-rank',
      title: 'Ranking the Pull',
      briefing: { speaker: SPEAKER, body: 'Test each vial on the Magnet balance (or check unpaired electrons on the ladder), then order all three vials on the rail from weakest to strongest pull.' },
      prompt: 'Order these three complexes from weakest to strongest magnetic pull.',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-mn-aq', 'mn-aq', { x: 40, y: 52 }, { name: 'Mn²⁺' }),
          vial('v-cr-aq', 'cr-aq', { x: 75, y: 52 }, { name: 'Cr³⁺' }),
          vial('v-ni-aq', 'ni-aq', { x: 110, y: 52 }, { name: 'Ni²⁺' })
        ],
        fixtures: [D.fixture, M.fixture],
        zones: {
          slots: [M.slot],
          rail: { at: { x: 75, y: 52 }, size: { w: 96, h: 14 }, slots: 3, first: 'Weakest pull', last: 'Strongest pull', items: ['v-mn-aq', 'v-cr-aq', 'v-ni-aq'], start: ['v-mn-aq', 'v-cr-aq', 'v-ni-aq'] }
        }
      }),
      hints: [
        'Test each vial on the Magnet balance, or count its unpaired electrons on the ladder.',
        'Count how many unpaired electrons each ion has with water\'s narrow gap.',
        'More unpaired electrons produce a stronger magnetic pull.'
      ],
      check(state) {
        const order = railIds(state);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Place all three vials on the rail.' };
        if (order[0] === 'v-ni-aq' && order[1] === 'v-cr-aq' && order[2] === 'v-mn-aq') return { ok: true };
        const a = COMPLEXES[state.table.pieces[order[0]].props.cx];
        const b = COMPLEXES[state.table.pieces[order[1]].props.cx];
        const c = COMPLEXES[state.table.pieces[order[2]].props.cx];
        if (a.unpaired > b.unpaired) return { ok: false, msg: `${a.metal}${a.q === 2 ? '²⁺' : '³⁺'} (${a.unpaired} unpaired) is to the left of ${b.metal}${b.q === 2 ? '²⁺' : '³⁺'} (${b.unpaired} unpaired).` };
        return { ok: false, msg: `${b.metal}${b.q === 2 ? '²⁺' : '³⁺'} (${b.unpaired} unpaired) is to the left of ${c.metal}${c.q === 2 ? '²⁺' : '³⁺'} (${c.unpaired} unpaired).` };
      },
      reward: {
        log: 'Ni²⁺ (2) < Cr³⁺ (3) < Mn²⁺ (5).',
        title: 'More Unpaired, Stronger Pull',
        body: 'Ni²⁺ has 2 unpaired electrons, Cr³⁺ has 3, and Mn²⁺ has 5. Magnetic pull grows stronger as the number of unpaired electrons increases.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const S = specFixture('spec', { x: 46, y: 20 }, { w: 60, h: 36 });
    const M = magnetFixture('mag', { x: 122, y: 20 }, { w: 48, h: 36 });
    return {
      id: 's6-cobalt',
      title: 'Cobalt Again',
      briefing: { speaker: SPEAKER, body: 'Test each cobalt(III) vial in the spectrometer and magnet balance to see how its absorbed colour connects to its magnetic pull.' },
      prompt: 'Which cobalt(III) complex is pulled by the magnet?',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-co-nh3', 'co-nh3', { x: 20, y: 50 }, { name: 'Co(NH₃)₆³⁺' }),
          vial('v-co-f', 'co-f', { x: 44, y: 50 }, { name: 'CoF₆³−' })
        ],
        fixtures: [S.fixture, M.fixture],
        zones: { slots: [S.slot, M.slot, { id: 'answer', label: 'Pulled by the magnet', at: { x: 86, y: 50 }, size: { w: 28, h: 16 } }] }
      }),
      hints: [
        'Test both vials in the spectrometer and magnet balance, then place the pulled one in the slot.',
        'Compare the colour each vial absorbs to see which one has the wider gap.',
        'Check whether a narrow or wide gap leaves six d electrons unpaired.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a vial in the slot.' };
        if (card.id === 'v-co-f') return { ok: true };
        return { ok: false, msg: 'The ammonia complex absorbs higher-energy blue light, which means it has a wide gap.' };
      },
      reward: {
        log: 'The fluoride complex is pulled by the magnet.',
        title: 'Colour Meets Magnetism',
        body: 'The fluoride complex is pulled because its narrow gap leaves four of six d electrons unpaired. Ammonia\'s wide gap pairs all six, leaving no magnetic pull.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const M = magnetFixture('mag', { x: 48, y: 21 }, { w: 56, h: 40 });
    const D = dsplitFixture('ds', { x: 114, y: 21 }, { mode: 'fill', countDial: [5, 6], gapDial: true, w: 60, h: 40, title: 'Test arrangements' });
    return {
      id: 's7-sealed',
      title: 'The Sealed Drum',
      briefing: { speaker: SPEAKER, body: 'Cu²⁺ (d⁹) has 1 unpaired electron. Compare the sealed drum\'s pull with Cu²⁺, then use the ladder to identify the iron ion and gap.' },
      prompt: 'Which iron complex is inside the sealed drum?',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-cu', 'cu-aq', { x: 9, y: 52 }, { name: 'Cu²⁺' }),
          vial('v-sealed', 'fe3-cn', { x: 22, y: 52 }, { name: 'Sealed', sealedTint: true }),
          numCard('c-fe2-n', 'Fe²⁺, narrow gap', { x: 41, y: 52 }, 1),
          numCard('c-fe2-w', 'Fe²⁺, wide gap', { x: 61, y: 52 }, 2),
          numCard('c-fe3-n', 'Fe³⁺, narrow gap', { x: 81, y: 52 }, 3),
          numCard('c-fe3-w', 'Fe³⁺, wide gap', { x: 101, y: 52 }, 4)
        ],
        fixtures: [M.fixture, D.fixture],
        zones: { slots: [M.slot, { id: 'answer', label: 'Sealed drum', at: { x: 130, y: 52 }, size: { w: 32, h: 15 } }] }
      }),
      hints: [
        'Test both the sealed drum and Cu²⁺ on the magnet balance, then place a card in the slot.',
        'Compare the drum\'s pull with Cu²⁺\'s pull to find how many unpaired electrons it has.',
        'Use the ladder to see which iron ion and gap width leave that many unpaired electrons.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === 'c-fe3-w') return { ok: true };
        if (card.id === 'c-fe3-n') return { ok: false, msg: 'Fe³⁺ with a narrow gap leaves five unpaired electrons, far more than Cu²⁺.' };
        if (card.id === 'c-fe2-w') return { ok: false, msg: 'Fe²⁺ with a wide gap pairs all six electrons, leaving no magnetic pull.' };
        return { ok: false, msg: 'Fe²⁺ with a narrow gap leaves four unpaired electrons, far more than Cu²⁺.' };
      },
      reward: {
        log: 'Fe³⁺ with a wide gap.',
        title: 'One Unpaired Electron',
        body: 'The drum holds Fe³⁺ with a wide gap. Four of its five d electrons pair in the lower level, leaving one unpaired electron and the same pull as Cu²⁺.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Unpaired electrons make a complex paramagnetic. When the ligand\'s energy gap is wider than the pairing cost, electrons pair in the lower level first (low spin); when the gap is narrower, they spread across all five orbitals (high spin).' }]
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

export const SOLUTIONS = [
  [put('v-fe2-aq', 'slot:mag.holder'), { run: 'mag' }, put('v-fe2-aq', 'slot:answer')],
  [put('g-pair', 'slot:guess')],
  [dial('ds', 'b0', 2), dial('ds', 'b1', 2), dial('ds', 'b2', 2), { run: 'ds' }],
  [put('c-d3', 'tray:same'), put('c-d5', 'tray:changes'), put('c-d8', 'tray:same')],
  [put('v-ni-aq', 'rail:0'), put('v-cr-aq', 'rail:1'), put('v-mn-aq', 'rail:2'), put('v-ni-aq', 'slot:mag.holder'), { run: 'mag' }, put('v-ni-aq', 'rail:0')],
  [put('v-co-f', 'slot:answer'), put('v-co-nh3', 'slot:mag.holder'), { run: 'mag' }],
  [put('v-sealed', 'slot:mag.holder'), { run: 'mag' }, put('c-fe3-w', 'slot:answer')]
];

export const MISSES = [
  [put('v-fe2-cn', 'slot:answer')],
  [],
  [dial('ds', 'b0', 2), dial('ds', 'b1', 1), dial('ds', 'b2', 1), dial('ds', 'b3', 1), dial('ds', 'b4', 1)],
  [put('c-d3', 'tray:same'), put('c-d5', 'tray:changes'), put('c-d8', 'tray:changes')],
  [put('v-cr-aq', 'rail:0'), put('v-ni-aq', 'rail:1'), put('v-mn-aq', 'rail:2')],
  [put('v-co-nh3', 'slot:answer')],
  [put('c-fe3-n', 'slot:answer')]
];

function blankState() { return {}; }
export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
