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
import { applyNotes } from '../../table/notes.js';
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
  if (r.n > want) return `The ladder holds ${r.n} electrons; ${ELEMENTS[el].name} has ${want} outside its core.`;
  if (r.n < want) return { notYet: true, msg: `The ladder holds ${r.n} of ${ELEMENTS[el].name}'s ${want} outer electrons.` };
  if (r.s < 2 && r.d > 0) return '4s has a place left, and it sits lower on the ladder than 3d.';
  if (pairedWithEmpty(r)) return 'One 3d orbital holds two electrons while another 3d orbital is empty.';
  return 'The ladder does not hold the lowest arrangement.';
}

function ionMiss(r, q) {
  if (r.charge < q) return { notYet: true, msg: `The charge reads ${r.charge > 0 ? '+' : ''}${r.charge}.` };
  if (r.charge > q) return `The charge reads +${r.charge}.`;
  if (r.s > 0 && dBoxes(r).includes(0)) return `4s still holds ${r.s === 2 ? 'two electrons' : 'an electron'}, above an empty place in 3d.`;
  if (r.s > 0) return `4s still holds ${r.s === 2 ? 'two electrons' : 'an electron'}, above the 3d level.`;
  return 'The ladder does not hold the lowest arrangement.';
}

const result = m => (typeof m === 'string' ? { ok: false, msg: m } : { ok: false, ...m });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const L = dshellFixture('ladder', { x: 60, y: 31 }, { mode: 'build', el: 'V', test: true, title: 'Vanadium' });
    return {
      id: 's1-vanadium',
      title: 'Vanadium',
      briefing: { speaker: SPEAKER, body: 'Vanadium has five electrons outside its core, the full inner shells it shares with argon. The 3d subshell is a set of five orbitals of the same energy, each holding at most two electrons.' },
      prompt: 'How are vanadium\'s five outer electrons arranged at the lowest energy?',
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Tap the boxes to add electrons, then press "Test Energy".',
        'Compare where each electron sits with the empty places below it or level with it.',
        'Two electrons in one orbital repel each other, so an empty orbital of the same energy costs less.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.n === 0) return { ok: false, notYet: true, msg: 'The ladder is empty.' };
        if (holds(r, 2, 3)) return { ok: true };
        return result(buildMiss(r, 'V'));
      },
      reward: {
        log: 'Vanadium: 4s² 3d³, three alone.',
        title: 'One Per Orbital',
        body: 'Two in 4s, then three alone in separate 3d orbitals. Electrons in one orbital repel each other, so 3d fills one per orbital before any pair.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const L = dshellFixture('ladder', { x: 60, y: 31 }, { mode: 'build', el: 'Fe', title: 'Iron' });
    return {
      id: 's2-iron',
      title: 'Iron',
      prompt: 'How are iron\'s eight outer electrons arranged at the lowest energy?',
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Tap the boxes to add electrons; this ladder has no test.',
        'Count what is left for 3d once 4s is full, and compare it with the five 3d orbitals.',
        'Use what vanadium showed: one electron in each 3d orbital first, then pairs.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.n === 0) return { ok: false, notYet: true, msg: 'The ladder is empty.' };
        if (holds(r, 2, 6)) return { ok: true };
        return result(buildMiss(r, 'Fe'));
      },
      reward: {
        log: 'Iron: 4s² 3d⁶, one pair.',
        title: 'The Sixth Pairs',
        body: 'Two in 4s and six in 3d: five alone, then one pair once every 3d orbital has an electron. Iron\'s outer electrons are 4s² 3d⁶.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Which Two Leave',
    predict: true,
    prompt: 'Iron loses two electrons to become the ion Fe²⁺: which two leave?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-3d', 'The last two in: two from 3d', { x: 32, y: 14 }),
        note('g-4s', 'The two in 4s', { x: 32, y: 33 }),
        note('g-one', 'One from 4s and one from 3d', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'fill-fe', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows the order iron\'s electrons went in.',
      'An electron leaves most easily from the highest level it sits on.',
      'Ask whether the ladder stays the same once the atom has a positive charge.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the ladder.' }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const L = dshellFixture('ladder', { x: 60, y: 31 }, { mode: 'remove', el: 'Fe', test: true, title: 'Iron, losing electrons' });
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's4-fe2',
      title: 'Making Fe²⁺',
      get prompt() { const g = guess(); return `Which two electrons has Fe²⁺ lost?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Tap an electron to remove it, watch the levels, then press "Test Energy".',
        'Watch where 4s sits compared with 3d once the charge is +1.',
        'The electrons that leave are the ones on the highest level of the ion, not of the neutral atom.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.charge === 0) return { ok: false, notYet: true, msg: 'The ladder still holds all eight of iron\'s outer electrons.' };
        if (r.charge === 2 && r.s === 0 && r.d === 6) return { ok: true };
        return result(ionMiss(r, 2));
      },
      get reward() {
        const g = guess();
        return {
          log: 'Fe²⁺ is 3d⁶: the 4s pair left.',
          title: '4s Leaves First',
          body: `The two 4s electrons left. Once iron carries a charge its 3d level lies below 4s, so Fe²⁺ is 3d⁶.${g ? ` You predicted ${g}.` : ''}`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const L = dshellFixture('ladder', { x: 60, y: 31 }, { mode: 'remove', el: 'Co', title: 'Cobalt, losing electrons' });
    return {
      id: 's5-co3',
      title: 'Cobalt(III)',
      prompt: 'How are the outer electrons of the Co³⁺ ion arranged?',
      widget,
      table: lodeTable({ pieces: [], fixtures: [L.fixture] }),
      hints: [
        'Tap electrons to remove them until the charge reads +3.',
        'Watch which level is highest once the atom is charged.',
        'Take electrons from the highest level of the ion first, then from the next one down.'
      ],
      check(state) {
        const r = dshellRead(state.table, 'ladder');
        if (r.charge === 0) return { ok: false, notYet: true, msg: 'The ladder still holds all nine of cobalt\'s outer electrons.' };
        if (r.charge === 3 && r.s === 0 && r.d === 6 && !pairedWithEmpty(r)) return { ok: true };
        if (r.charge === 3 && r.s === 0 && pairedWithEmpty(r)) return { ok: false, msg: 'One 3d orbital holds two electrons while another 3d orbital is empty.' };
        return result(ionMiss(r, 3));
      },
      reward: {
        log: 'Co³⁺ is 3d⁶.',
        title: 'Then From 3d',
        body: 'Both 4s electrons leave first, then one from 3d. Co³⁺ keeps six 3d electrons: 3d⁶, the same as Fe²⁺.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const L = dshellFixture('ladder', { x: 104, y: 29 }, { mode: 'remove', load: true, title: 'Ladder', h: 42 });
    return {
      id: 's6-drum',
      title: 'The Sealed Drum',
      prompt: 'The drum holds a 3+ ion with five 3d electrons: which metal is it?',
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
        'Lay a metal card on the ladder\'s square and tap away three electrons.',
        'Compare the 3d electrons left with the drum\'s five.',
        'Two electrons leave from 4s and the third from 3d, so the atom had one more 3d electron than its 3+ ion.'
      ],
      check(state) {
        const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a metal card in the drum\'s slot.' };
        if (card.props.el === 'Fe') return { ok: true };
        const left = ELEMENTS[card.props.el].d - 1;
        return { ok: false, msg: `${ELEMENTS[card.props.el].name[0].toUpperCase()}${ELEMENTS[card.props.el].name.slice(1)} as a 3+ ion keeps ${left} 3d electrons.` };
      },
      reward: {
        log: 'The drum holds Fe³⁺.',
        title: 'Iron(III)',
        body: 'Iron, 4s² 3d⁶, loses both 4s electrons and one 3d electron, leaving Fe³⁺ with five 3d electrons, one in each orbital.'
      }
    };
  })()
];

const NOTES = {
  1: ['Tap a box to add an electron; a third tap empties it.'],
  2: ['Tap a box to add an electron; a third tap empties it.'],
  3: ['Drag the card you choose into the slot.'],
  4: ['Tap an electron to remove it.'],
  5: ['Tap an electron to remove it.'],
  6: ['Drag a card onto the ladder, then tap electrons away.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'In the fourth row, 3d fills one electron per orbital before any pair. Once the atom is an ion its 3d level lies below 4s, so the 4s electrons leave first.' }]
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
