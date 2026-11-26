/**
 * Unit 12 · Bench 1 — The d-Block (q1-dblock)
 *
 * The assay hut at the head of Lodestone's canyon, on the lode kit (`table/kits/lode.js`). One fourth-row atom at a time on an energy
 * ladder: the 4s orbital and the five orbitals of 3d. Six stages and ONE click: the belief that the electrons that went in last (3d) are the
 * first to leave. The ion ladder answers it: as the atom takes a charge its 3d level glides below 4s, so 4s empties first.
 *
 *   1  vanadium, built with Test Energy                    -> 3d fills one per orbital before any pair
 *   2  iron, built without the test                        -> pairing begins with the sixth 3d electron
 *   3  PREDICT: which two electrons leave iron for Fe²⁺?
 *   4  TEST: take two electrons from iron and watch the levels    -> 4s leaves first; Fe²⁺ is 3d⁶
 *   5  cobalt(III), a new case                             -> two from 4s, then one from 3d
 *   6  SEALED: the drum's 3+ ion with five 3d electrons     -> iron
 *
 * A short bench by design (the plan session's four-bench plan split; configurations recap Lanternfall `q6`). This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { lodeTable, dshellFixture, dshellRead, elemCard, note, plaqueFixture, lodeLeadFixture } from '../../table/kits/lode.js';
import { ELEMENTS } from '../../engine/lodedata.js';

export const meta = { stageCount: 6 };

/** Subshell, orbital and ion are Lanternfall's and Tallow's words, recapped in stage one's briefing; this bench earns no new term. */
export const VOCABULARY = [];

/** Configurations (subshells, orbitals, spin) are Lanternfall's; the bench recaps them in its first briefing. */
export const BUILDS_ON = ['unit02/q6-filling'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit12/q1-dblock';
const GUESS = { 'g-3d': 'two from 3d', 'g-4s': 'the two in 4s', 'g-one': 'one from each' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

/* ---- reading a ladder ---- */
const dBoxes = r => r.occ.slice(1);
const pairedWithEmpty = r => dBoxes(r).includes(2) && dBoxes(r).includes(0);
/** True when the ladder holds `s` in 4s and `d` in 3d, one per 3d orbital before any pair. */
const holds = (r, s, d) => r.s === s && r.d === d && !pairedWithEmpty(r) && (d > 5 || !dBoxes(r).includes(2));

function buildMiss(r, el) {
  const want = ELEMENTS[el].s + ELEMENTS[el].d;
  if (r.n > want) return `You placed ${r.n} electrons, but ${ELEMENTS[el].name} has ${want} outer electrons.`;
  if (r.n < want) return { notYet: true, msg: `You placed ${r.n} of ${ELEMENTS[el].name}'s ${want} outer electrons.` };
  if (r.s < 2 && r.d > 0) return 'Check which level sits lower in energy: 4s or 3d.';
  if (pairedWithEmpty(r)) return 'One 3d orbital has two electrons while another 3d orbital is still empty.';
  return 'That is not the lowest-energy arrangement.';
}

function ionMiss(r, q) {
  if (r.charge < q) return { notYet: true, msg: `The ion's charge is ${r.charge > 0 ? '+' : ''}${r.charge}.` };
  if (r.charge > q) return `The ion's charge is +${r.charge}.`;
  if (r.s > 0 && dBoxes(r).includes(0)) return `4s still holds ${r.s === 2 ? 'two electrons' : 'an electron'} even though a 3d orbital is empty.`;
  if (r.s > 0) return `4s still holds ${r.s === 2 ? 'two electrons' : 'an electron'}, even though 4s is higher in energy than 3d here.`;
  return 'That is not the lowest-energy arrangement.';
}

const result = m => (typeof m === 'string' ? { ok: false, msg: m } : { ok: false, ...m });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const L = dshellFixture('ladder', { x: 75, y: 31 }, { mode: 'build', el: 'V', test: true, title: 'Vanadium' });
    return {
      id: 's1-vanadium',
      title: 'Vanadium',
      briefing: { speaker: SPEAKER, body: 'Vanadium has five outer electrons beyond its full inner shells. The 3d subshell has five equal-energy orbitals, each holding up to two electrons.' },
      prompt: 'Arrange vanadium\'s five outer electrons in their lowest-energy orbitals.',
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Start with the 4s box below 3d, then place the remaining electrons in the five 3d boxes.',
        'Compare the energy of placing an electron in an empty 3d orbital versus pairing it up.',
        'Electrons in the same orbital repel each other, so filling an empty orbital of the same energy costs less.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.n === 0) return { ok: false, notYet: true, msg: 'No electrons are placed on the ladder yet.' };
        if (holds(r, 2, 3)) return { ok: true };
        return result(buildMiss(r, 'V'));
      },
      reward: {
        log: 'Vanadium is 4s² 3d³, with three unpaired electrons.',
        title: 'One Per Orbital',
        body: 'Two electrons fill 4s, and three go into separate 3d orbitals. Because electrons in the same orbital repel each other, 3d orbitals fill singly before pairing.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const L = dshellFixture('ladder', { x: 75, y: 31 }, { mode: 'build', el: 'Fe', title: 'Iron' });
    return {
      id: 's2-iron',
      title: 'Iron',
      prompt: 'Arrange iron\'s eight outer electrons in their lowest-energy orbitals.',
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Fill the lower 4s box first, then place the remaining electrons in the five 3d boxes.',
        'Count how many electrons remain for 3d after 4s is full, and compare that with the five 3d orbitals.',
        'Follow the same rule as vanadium: put one electron in each 3d orbital before pairing any.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.n === 0) return { ok: false, notYet: true, msg: 'No electrons are placed on the ladder yet.' };
        if (holds(r, 2, 6)) return { ok: true };
        return result(buildMiss(r, 'Fe'));
      },
      reward: {
        log: 'Iron is 4s² 3d⁶, with one paired 3d orbital.',
        title: 'The Sixth Electron Pairs',
        body: 'Iron has two electrons in 4s and six in 3d. Five fill the 3d orbitals singly, and the sixth forms a pair, giving 4s² 3d⁶.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Which Two Leave',
    predict: true,
    prompt: 'When iron loses two electrons to become Fe²⁺, which two leave?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-3d', 'The last two added (two from 3d)', { x: 32, y: 14 }),
        note('g-4s', 'The two in 4s', { x: 32, y: 33 }),
        note('g-one', 'One from 4s and one from 3d', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'fill-fe', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch the clip to see the order in which iron\'s electrons filled.',
      'Electrons leave most easily from the highest-energy level.',
      'Think about whether 4s and 3d keep the same order once the atom becomes positively charged.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is saved. Now test it on the energy ladder.' }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const L = dshellFixture('ladder', { x: 75, y: 31 }, { mode: 'remove', el: 'Fe', test: true, title: 'Iron, losing electrons' });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's4-fe2',
      title: 'Making Fe²⁺',
      get prompt() { const g = guess(); return `Remove two electrons to form Fe²⁺${g ? ` (you predicted ${g})` : ''}.`; },
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Watch 4s and 3d trade places as soon as the charge reaches +1.',
        'Compare the heights of 4s and 3d once iron is positively charged.',
        'Electrons leave from the highest-energy level of the ion, not the neutral atom.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.charge === 0) return { ok: false, notYet: true, msg: 'All eight of iron\'s outer electrons are still on the ladder.' };
        if (r.charge === 2 && r.s === 0 && r.d === 6) return { ok: true };
        return result(ionMiss(r, 2));
      },
      get reward() {
        const g = guess();
        const right = recall(QUEST_KEY) === 'g-4s';
        return {
          log: 'Fe²⁺ is 3d⁶ because the two 4s electrons leave first.',
          title: '4s Leaves First',
          body: `Both 4s electrons leave first because 3d drops below 4s once iron becomes an ion. Fe²⁺ is 3d⁶${g ? (right ? ', matching your prediction' : `, not ${g}`) : ''}.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const L = dshellFixture('ladder', { x: 75, y: 31 }, { mode: 'remove', el: 'Co', title: 'Cobalt, losing electrons' });
    return {
      id: 's5-co3',
      title: 'Cobalt(III)',
      prompt: 'Remove three electrons from cobalt to build the Co³⁺ ion.',
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Watch which level moves highest as cobalt takes on a positive charge.',
        'After 4s is empty, look for a 3d orbital that holds a pair of electrons.',
        'Remove both 4s electrons first, then take one electron from a paired 3d orbital.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.charge === 0) return { ok: false, notYet: true, msg: 'All nine of cobalt\'s outer electrons are still on the ladder.' };
        if (r.charge === 3 && r.s === 0 && r.d === 6 && !pairedWithEmpty(r)) return { ok: true };
        if (r.charge === 3 && r.s === 0 && pairedWithEmpty(r)) return { ok: false, msg: 'One 3d orbital has two electrons while another 3d orbital is empty.' };
        return result(ionMiss(r, 3));
      },
      reward: {
        log: 'Co³⁺ is 3d⁶.',
        title: 'Then From 3d',
        body: 'Both 4s electrons leave first, followed by one electron from 3d. That leaves Co³⁺ with six 3d electrons (3d⁶), the same as Fe²⁺.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const L = dshellFixture('ladder', { x: 106, y: 29 }, { mode: 'remove', load: true, title: 'Ladder', w: 80, h: 44 });
    return {
      id: 's6-drum',
      title: 'The Sealed Drum',
      prompt: 'Which metal forms a 3+ ion with five 3d electrons?',
      widget,
      table: lodeTable({
        pieces: ['Mn', 'Fe', 'Co', 'Ni'].map((el, i) => elemCard(`el-${el}`, el, { x: 10 + i * 14, y: 56 })),
        fixtures: [
          L.fixture,
          plaqueFixture('drum', 'The sealed drum', { x: 22, y: 14 }, ['A 3+ ion', 'Five 3d electrons'], { w: 38 })
        ],
        zones: { slots: [L.slot, { id: 'answer', label: 'The drum\'s metal', at: { x: 22, y: 36 }, size: { w: 26, h: 14 } }] }
      }),
      hints: [
        'Drop each metal card onto "Load an atom" and remove three electrons.',
        'Compare how many 3d electrons remain with the five listed on the drum.',
        'Two electrons leave from 4s and the third leaves from 3d, so the neutral atom started with one more 3d electron.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a metal card in the drum\'s slot.' };
        if (card.props.el === 'Fe') return { ok: true };
        return { ok: false, msg: `Test ${ELEMENTS[card.props.el].name} on "Load an atom" by removing three electrons and counting how many remain in 3d.` };
      },
      reward: {
        log: 'The drum holds Fe³⁺.',
        title: 'Iron(III), Fe³⁺',
        body: 'Iron (4s² 3d⁶) loses both 4s electrons and one 3d electron, leaving Fe³⁺ (iron(III)) with five unpaired 3d electrons.'
      }
    };
  })()
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'In the fourth row, 3d orbitals fill one electron at a time before pairing. Once a metal forms a positive ion, 3d drops below 4s, so the 4s electrons leave first.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const box = (i, value) => ({ setDial: { fixture: 'ladder', dial: `b${i}`, value } });

export const SOLUTIONS = [
  [box(0, 2), box(1, 1), box(2, 1), box(3, 1), { run: 'ladder' }],
  [box(0, 2), box(1, 2), box(2, 1), box(3, 1), box(4, 1), box(5, 1)],
  [put('g-3d', 'slot:guess')],
  [box(0, 0), { run: 'ladder' }],
  [box(0, 0), box(1, 1)],
  [put('el-Fe', 'slot:ladder.card'), box(0, 0), box(1, 1), put('el-Fe', 'slot:answer')]
];

export const MISSES = [
  [box(0, 2), box(1, 2), box(2, 1)],
  [box(0, 2), box(1, 2), box(2, 2), box(3, 1), box(4, 1)],
  [],
  [box(1, 1), box(2, 0), { run: 'ladder' }],
  [box(0, 1), box(1, 1), box(2, 0)],
  [put('el-Mn', 'slot:answer')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { holds, pairedWithEmpty };
