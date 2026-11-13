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
import { applyNotes } from '../../table/notes.js';
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
      prompt: 'Which iron(II) complex has unpaired electrons?',
      briefing: 'An electron alone in an orbital makes its substance pulled toward a magnet: the substance is paramagnetic. Paired electrons cancel, and give no pull.',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-fe2-aq', 'fe2-aq', { x: 20, y: 49 }, { name: 'H₂O' }),
          vial('v-fe2-cn', 'fe2-cn', { x: 42, y: 49 }, { name: 'CN−' })
        ],
        fixtures: [M.fixture],
        zones: { slots: [M.slot, { id: 'answer', label: 'Has unpaired electrons', at: { x: 128, y: 46 }, size: { w: 28, h: 16 } }] }
      }),
      hints: [
        'Drop each vial in the holder and press "Switch On", then lay one in the answer slot.',
        'Compare how far each vial moves toward the poles.',
        'Only unpaired electrons give a magnetic pull.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a vial in the answer slot.' };
        if (card.id === 'v-fe2-aq') return { ok: true };
        return { ok: false, msg: 'The cyanide vial did not move toward the poles.' };
      },
      reward: {
        log: 'The water complex is paramagnetic.',
        title: 'The Ligand Decides',
        body: 'The water complex is paramagnetic and pulled toward the poles; the cyanide one is not. Both hold Fe²⁺ with six d electrons, so the ligand decides.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Spread or Pair',
    prompt: 'With a wide gap, do six d electrons spread over all five orbitals or pair up in the lower three?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-spread', 'Spread out: one per orbital before any pair', { x: 40, y: 49 }, { w: 46, h: 15 }),
        note('g-pair', 'Pair up in the lower three', { x: 88, y: 49 }, { w: 40, h: 15 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 75, y: 20 }, 'd6-equal', { w: 96, h: 30, title: 'Watch first' })],
      zones: { slots: [{ id: 'guess', label: 'Your prediction', at: { x: 128, y: 49 }, size: { w: 30, h: 16 } }] }
    }),
    hints: [
      'The clip shows six d electrons when all five orbitals sit at the same energy.',
      'Spreading out avoids pairing, but puts electrons into the upper set.',
      'Compare the cost of a pair with the cost of crossing the gap.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Drop one prediction card in the slot.' };
      remember(QUEST_KEY, card.id);
      return { ok: true };
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the split ladder.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const D = dsplitFixture('ds', { x: 75, y: 31 }, { mode: 'build', gap: GAPS.wide, pair: true, count: 6, w: 122, h: 52, title: 'Six d electrons, wide gap' });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-test',
      title: 'Pairing Against the Gap',
      get prompt() { const g = guess(); return `How do six d electrons arrange themselves when the gap is wider than the pairing cost${g ? `, after predicting ${g}` : ''}?`; },
      briefing: 'Putting two electrons in one orbital costs energy, because they repel. Lifting an electron across the gap costs energy too.',
      widget,
      table: lodeTable({ fixtures: [D.fixture] }),
      hints: [
        'Tap the orbital boxes to place six electrons, then press "Test Energy".',
        'Compare the height of the gap with the pairing-cost bar.',
        'Each electron goes where it costs least: a pair if crossing the gap costs more.'
      ],
      check(state) {
        const r = dsplitRead(state.table, 'ds');
        if (r.n !== 6) return { ok: false, notYet: true, msg: `Place 6 electrons (${r.n} placed).` };
        if (r.occ.slice(0, 3).every(x => x === 2) && r.occ.slice(3).every(x => x === 0)) return { ok: true };
        return { ok: false, msg: 'Two electrons sit above the gap, which is taller than the pairing bar.' };
      },
      reward: {
        log: 'With a wide gap, all six pair in the lower three.',
        title: 'Low Spin and High Spin',
        get body() { const g = guess(); return `When the gap is wider than the pairing cost, all six pair in the lower three, leaving none unpaired: low spin (high spin spreads across all five).${g ? ` You predicted ${g}.` : ''}`; }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const D = dsplitFixture('ds', { x: 56, y: 19 }, { mode: 'fill', countDial: [3, 4, 5, 6, 7, 8], gapDial: true, w: 88, h: 34, title: 'Fill Lowest' });
    const ids = ['d3', 'd5', 'd8'];
    const CHANGES = new Set(['d5']);
    return {
      id: 's4-counts',
      title: 'Which Counts Choose',
      prompt: 'For which of these numbers of d electrons does the gap change how many are unpaired?',
      widget,
      table: lodeTable({
        pieces: [
          numCard('c-d3', 'd³', { x: 14, y: 49 }, 3),
          numCard('c-d5', 'd⁵', { x: 34, y: 49 }, 5),
          numCard('c-d8', 'd⁸', { x: 54, y: 49 }, 8)
        ],
        fixtures: [D.fixture],
        zones: {
          trays: [
            { id: 'changes', label: 'Unpaired count changes', at: { x: 92, y: 51 }, size: { w: 28, h: 15 }, cell: 14, cellH: 14 },
            { id: 'same', label: 'Stays the same', at: { x: 126, y: 51 }, size: { w: 28, h: 15 }, cell: 14, cellH: 14 }
          ]
        }
      }),
      hints: [
        'Set the electron count and the gap, press "Fill Lowest", then sort the cards.',
        'Count the unpaired electrons at the narrow gap and at the wide gap.',
        'A choice exists only when an electron could either pair below or cross the gap.'
      ],
      check(state) {
        const t = state.table;
        const off = ids.filter(id => !['tray:changes', 'tray:same'].includes(t.pieces[`c-${id}`].zone));
        if (off.length) return { ok: false, notYet: true, msg: `${off.length} card${off.length > 1 ? 's are' : ' is'} not in a tray yet.` };
        const wrong = ids.find(id => (t.pieces[`c-${id}`].zone === 'tray:changes') !== CHANGES.has(id));
        if (!wrong) return { ok: true };
        if (wrong === 'd8') return { ok: false, msg: 'd⁸ shows two unpaired with the narrow gap and with the wide one.' };
        if (wrong === 'd3') return { ok: false, msg: 'd³ shows three unpaired with the narrow gap and with the wide one.' };
        return { ok: false, msg: 'd⁵ shows five unpaired with the narrow gap and one with the wide one.' };
      },
      reward: {
        log: 'Only d⁵ changes here (d⁴ to d⁷ have two arrangements).',
        title: 'Four to Seven',
        body: 'Only d⁵ changes, five to one. Three electrons fill the lower set singly either way, and eight leave two unpaired either way; only four to seven have two arrangements.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const D = dsplitFixture('ds', { x: 40, y: 20 }, { mode: 'fill', countDial: [3, 5, 8], gap: GAPS.narrow, w: 64, h: 34, title: 'Water complexes (narrow gap)' });
    const M = magnetFixture('mag', { x: 118, y: 20 }, {
      w: 50, h: 34,
      gate: { kind: 'rail', id: 'rank', initial: ['v-mn-aq', 'v-cr-aq', 'v-ni-aq'], msg: 'Rank the vials on the rail first.' }
    });
    return {
      id: 's5-rank',
      title: 'Ranking the Pull',
      prompt: 'Rank these three complexes by how strongly the magnet pulls them.',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-mn-aq', 'mn-aq', { x: 40, y: 49 }, { name: 'Mn²⁺' }),
          vial('v-cr-aq', 'cr-aq', { x: 75, y: 49 }, { name: 'Cr³⁺' }),
          vial('v-ni-aq', 'ni-aq', { x: 110, y: 49 }, { name: 'Ni²⁺' })
        ],
        fixtures: [D.fixture, M.fixture],
        zones: {
          slots: [M.slot],
          rail: { at: { x: 75, y: 49 }, size: { w: 96, h: 14 }, first: 'Weakest pull', last: 'Strongest pull', items: ['v-mn-aq', 'v-cr-aq', 'v-ni-aq'], start: ['v-mn-aq', 'v-cr-aq', 'v-ni-aq'] }
        }
      }),
      hints: [
        'Work out each ion\'s arrangement on the ladder, rank the vials on the rail, then test them.',
        'Count the unpaired electrons each ion has with water\'s narrow gap.',
        'More unpaired electrons give a stronger magnetic pull.'
      ],
      check(state) {
        const order = railIds(state);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three vials on the rail.' };
        if (order[0] === 'v-ni-aq' && order[1] === 'v-cr-aq' && order[2] === 'v-mn-aq') return { ok: true };
        const a = COMPLEXES[state.table.pieces[order[0]].props.cx];
        const b = COMPLEXES[state.table.pieces[order[1]].props.cx];
        const c = COMPLEXES[state.table.pieces[order[2]].props.cx];
        if (a.unpaired > b.unpaired) return { ok: false, msg: `${a.metal}${a.q === 2 ? '²⁺' : '³⁺'} (${a.unpaired} unpaired) sits left of ${b.metal}${b.q === 2 ? '²⁺' : '³⁺'} (${b.unpaired} unpaired).` };
        return { ok: false, msg: `${b.metal}${b.q === 2 ? '²⁺' : '³⁺'} (${b.unpaired} unpaired) sits left of ${c.metal}${c.q === 2 ? '²⁺' : '³⁺'} (${c.unpaired} unpaired).` };
      },
      reward: {
        log: 'Ni²⁺ (2) < Cr³⁺ (3) < Mn²⁺ (5).',
        title: 'More Unpaired, Stronger Pull',
        body: 'Ni²⁺ has 2 unpaired electrons, Cr³⁺ has 3, and Mn²⁺ has 5. The pull grows with the number of unpaired electrons.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const S = specFixture('spec', { x: 50, y: 20 }, { w: 62, h: 34 });
    const M = magnetFixture('mag', { x: 124, y: 20 }, { w: 44, h: 34, gate: { kind: 'slot', id: 'answer', msg: 'Choose a vial in the slot first.' } });
    return {
      id: 's6-cobalt',
      title: 'Cobalt Again',
      prompt: 'Which cobalt(III) complex does the magnet pull?',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-co-nh3', 'co-nh3', { x: 20, y: 49 }, { name: 'Co(NH₃)₆³⁺' }),
          vial('v-co-f', 'co-f', { x: 42, y: 49 }, { name: 'CoF₆³−' })
        ],
        fixtures: [S.fixture, M.fixture],
        zones: { slots: [S.slot, M.slot, { id: 'answer', label: 'Pulled by the magnet', at: { x: 86, y: 48 }, size: { w: 28, h: 16 } }] }
      }),
      hints: [
        'Shine light through each vial, choose one in the slot, then test it with the magnet.',
        'Compare the colour each vial takes out with the gap it needs.',
        'A narrow gap leaves d⁶ spread out with four unpaired electrons.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a vial in the slot.' };
        if (card.id === 'v-co-f') return { ok: true };
        return { ok: false, msg: 'The ammonia vial took out blue light, the wide-gap end.' };
      },
      reward: {
        log: 'The fluoride complex is pulled by the magnet.',
        title: 'Colour Meets Magnetism',
        body: 'The fluoride complex is pulled: its narrow gap leaves four of six d electrons unpaired. Ammonia\'s wide gap pairs all six.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const M = magnetFixture('mag', { x: 48, y: 19 }, { w: 56, h: 32 });
    const D = dsplitFixture('ds', { x: 114, y: 19 }, { mode: 'fill', countDial: [5, 6], gapDial: true, w: 58, h: 32, title: 'Test arrangements' });
    return {
      id: 's7-sealed',
      title: 'The Sealed Drum',
      prompt: 'Which iron complex is in the sealed drum?',
      widget,
      table: lodeTable({
        pieces: [
          vial('v-cu', 'cu-aq', { x: 11, y: 47 }, { name: 'Cu²⁺' }),
          vial('v-sealed', 'fe3-cn', { x: 26, y: 47 }, { name: 'Sealed', sealedTint: true }),
          numCard('c-fe2-n', 'Fe²⁺, narrow', { x: 45, y: 47 }, 1),
          numCard('c-fe2-w', 'Fe²⁺, wide', { x: 65, y: 47 }, 2),
          numCard('c-fe3-n', 'Fe³⁺, narrow', { x: 85, y: 47 }, 3),
          numCard('c-fe3-w', 'Fe³⁺, wide', { x: 105, y: 47 }, 4)
        ],
        fixtures: [M.fixture, D.fixture],
        zones: { slots: [M.slot, { id: 'answer', label: 'Sealed drum', at: { x: 132, y: 47 }, size: { w: 24, h: 14 } }] }
      }),
      hints: [
        'Test the sealed drum and the Cu²⁺ vial on the magnet, then lay a card in the slot.',
        'Compare the drum\'s pull with Cu²⁺\'s, and count Cu²⁺\'s unpaired electrons.',
        'Find which iron ion and gap leave that many unpaired electrons.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card.id === 'c-fe3-w') return { ok: true };
        if (card.id === 'c-fe3-n') return { ok: false, msg: 'That arrangement leaves five unpaired; the drum pulls like Cu²⁺.' };
        if (card.id === 'c-fe2-w') return { ok: false, msg: 'Fe²⁺ with a wide gap leaves none unpaired.' };
        return { ok: false, msg: 'Fe²⁺ with a narrow gap leaves four unpaired; the drum pulls like Cu²⁺.' };
      },
      reward: {
        log: 'Fe³⁺ with a wide gap.',
        title: 'One Unpaired Electron',
        body: 'Fe³⁺ with a wide gap: five d electrons, four paired in the lower set and one alone, the same pull as Cu²⁺\'s single unpaired electron.'
      }
    };
  })()
];

const NOTES = {
  1: ['Holder, "Switch On", then the answer slot.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Tap boxes to place six, then "Test Energy".'],
  4: ['Set the dials, "Fill Lowest", then sort.'],
  5: ['Rank on the rail, then test on the magnet.'],
  6: ['Test in the lamp, choose in the slot, then magnet.'],
  7: ['Test both vials on the magnet, then lay a card.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Unpaired electrons make a complex paramagnetic. When a ligand splits the d orbitals by more than the pairing cost, electrons pair in the lower set first (low spin); when the gap is narrower, they spread across all five (high spin).' }]
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
