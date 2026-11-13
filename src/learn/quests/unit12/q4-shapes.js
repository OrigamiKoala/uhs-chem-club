/**
 * Unit 12 · Bench 4 — Shapes and Isomers (q4-shapes)
 *
 * The drum-filling gantry, on the lode kit. Complexes drawn in three dimensions and turned by a dial; a key that tries every turn and flip
 * of one model to lay it on another. Six stages and ONE click: the belief that every placement of the same parts is a different molecule
 * (six ways to choose two places of four), or that every placement is the same molecule turned. Turn to Fit shows there are exactly two.
 *
 *   1  six ligands released from a flat ring settle apart                    -> octahedron
 *   2  four ligands round Zn²⁺ and round Pt²⁺: which is flat?                -> tetrahedron, square planar
 *   3  PREDICT: how many arrangements of two NH₃ and two Cl− round a square?
 *   4  TEST: build them on three frames and turn one onto another            -> isomers; cis and trans
 *   5  four NH₃ and two Cl− round an octahedron                              -> again two, cis and trans
 *   6  SEALED: four models turned every way: which are trans?
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { lodeTable, cplxFixture, cplxRead, matchFixture, matchRead, lchoiceFixture, chosen, pickOf, note, lodeLeadFixture } from '../../table/kits/lode.js';
import { cisTrans, distinctCount } from '../../engine/lodedata.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\boctahed(ron|ral)\b/i, introducedAt: 1 },
  { term: /\bsquare planar\b/i, introducedAt: 2 },
  { term: /\btetrahed(ron|ral)\b/i, introducedAt: 2 },
  { term: /\bisomers?\b/i, introducedAt: 4 },
  { term: /\b(cis|trans)\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit12/q3-complex', 'unit03/q6-shape'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit12/q4-shapes';
const GUESS = { 'g-1': 'one', 'g-2': 'two', 'g-6': 'six' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const frame = (id, x, geom, metal, q) => cplxFixture(id, { x, y: 19 }, { metal, q, geom, mode: 'cycle', palette: ['nh3', 'cl'], title: `Model ${id}`, w: 46, h: 34, tilt: 62 });

/** What the comparisons on the table have shown, in words, for a refusal. */
function matchWords(t, ids) {
  const said = ids.map(id => [id, matchRead(t, id)]).filter(([, r]) => r);
  if (!said.length) return 'No two models have been compared yet.';
  return said.map(([id, r]) => `${t.fixtures[id].props.b} against ${t.fixtures[id].props.a}: ${r.same ? 'the same' : 'different'}`).join('; ') + '.';
}

const SEALED = [
  { id: 'A', arr: ['cl', 'cl', 'nh3', 'nh3'], yaw: 10, tilt: 30 },
  { id: 'B', arr: ['cl', 'nh3', 'cl', 'nh3'], yaw: 62, tilt: 48 },
  { id: 'C', arr: ['nh3', 'cl', 'cl', 'nh3'], yaw: 118, tilt: 22 },
  { id: 'D', arr: ['nh3', 'cl', 'nh3', 'cl'], yaw: 160, tilt: 36 }
];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-six',
    title: 'Six Round One',
    briefing: { speaker: SPEAKER, body: 'The lone pairs of a metal ion\'s ligands repel each other. Here six ammonia ligands are held in a flat ring round Co³⁺ until they are released.' },
    prompt: 'What shape do six ligands make round a metal ion once they are free to settle?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        cplxFixture('cx', { x: 50, y: 31 }, { metal: 'Co', q: 3, geom: 'oct', mode: 'ring6', turn: true, turnStart: 3, title: 'Co³⁺ and six NH₃', w: 92, h: 56 }),
        lchoiceFixture('pick', 'The shape', { x: 124, y: 30 }, { list: true, w: 46, options: ['A flat hexagon', 'An octahedron', 'Five round, one on top'] })
      ]
    }),
    hints: [
      'Press "Release", then turn the model with the "Turn" dial.',
      'Watch where the ligands go from the flat ring, and look at the model edge-on.',
      'Ligands that repel each other settle as far apart as they can.'
    ],
    check(state) {
      const t = state.table;
      const c = chosen(t, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap the shape you see.' };
      if (c === 'An octahedron') return { ok: true };
      if (!cplxRead(t, 'cx').released) return { ok: false, msg: 'The ligands are still held in the flat ring.' };
      return { ok: false, msg: 'Turned edge-on, the settled model shows four ligands round the middle, one above the ion and one below it.' };
    },
    reward: {
      log: 'Six ligands make an octahedron.',
      title: 'Octahedron',
      body: 'An octahedron: four ligands in a square round the ion, one above and one below, each 90° from its neighbours. Six are further apart this way than in a flat ring.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-four',
    title: 'Four Round One',
    prompt: 'Which of these two complexes has all four of its ligands in one flat plane?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        pickOf(cplxFixture('zn', { x: 38, y: 26 }, { metal: 'Zn', q: 2, geom: 'tet', mode: 'show', start: ['nh3', 'nh3', 'nh3', 'nh3'], turn: true, title: 'Zn²⁺ with four NH₃', w: 66, h: 48 }), 1),
        pickOf(cplxFixture('pt', { x: 112, y: 26 }, { metal: 'Pt', q: 2, geom: 'sq', mode: 'show', start: ['nh3', 'nh3', 'nh3', 'nh3'], turn: true, title: 'Pt²⁺ with four NH₃', w: 66, h: 48 }), 2),
        lchoiceFixture('pick', 'All four in one plane', { x: 75, y: 57 }, { options: ['Zn²⁺', 'Pt²⁺'], w: 50 })
      ]
    }),
    hints: [
      'Turn each model with its "Turn" dial, then tap the one you choose.',
      'Look at each model edge-on.',
      'A flat shape seen exactly edge-on is a single line.'
    ],
    check(state) {
      const c = chosen(state.table, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap the complex you choose.' };
      if (c === 'Pt²⁺') return { ok: true };
      return { ok: false, msg: 'Seen edge-on, two of zinc\'s ligands stand above the ion and two below it.' };
    },
    reward: {
      log: 'Pt²⁺ holds four in a square.',
      title: 'Square Planar',
      body: 'Four ligands usually settle 109.5° apart, a tetrahedron, as round zinc. Some metal ions, such as Pt²⁺, hold four in one flat square: square planar.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'How Many Ways',
    predict: true,
    briefing: { speaker: SPEAKER, body: 'Substances made of the same atoms arranged differently are isomers. Two models are the same if some turn or flip lays one exactly on the other.' },
    prompt: 'In how many different ways can two NH₃ and two Cl− be arranged round a flat square of Pt²⁺?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-1', 'One: every way is the same model turned', { x: 32, y: 14 }),
        note('g-2', 'Two', { x: 32, y: 33 }),
        note('g-6', 'Six: one for each choice of two places', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'sq-turn', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip turns a square whose four ligands are all alike.',
      'There are six ways to choose two of four places, but some may be one model turned.',
      'Ask what can be different about where the two Cl− sit compared with each other.'
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
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the models.' }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's4-turn',
      title: 'Turn to Fit',
      get prompt() { const g = guess(); return `How many different arrangements of two NH₃ and two Cl− are there round Pt²⁺?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: lodeTable({
        pieces: [],
        fixtures: [
          frame('A', 25, 'sq', 'Pt', 2), frame('B', 75, 'sq', 'Pt', 2), frame('C', 125, 'sq', 'Pt', 2),
          matchFixture('mAB', { x: 50, y: 44 }, { a: 'A', b: 'B', geom: 'sq', w: 48, h: 13 }),
          matchFixture('mAC', { x: 100, y: 44 }, { a: 'A', b: 'C', geom: 'sq', w: 48, h: 13 }),
          lchoiceFixture('pick', 'Different arrangements', { x: 40, y: 57.5 }, { row: true, w: 60, options: ['1', '2', '3', '6'] })
        ]
      }),
      hints: [
        'Tap the rings of each model to build an arrangement, then press a "Turn" key.',
        'Compare the arrangements that no turn can lay on each other.',
        'Look at whether the two Cl− sit side by side or opposite each other.'
      ],
      check(state) {
        const t = state.table;
        const c = chosen(t, 'pick');
        if (!c) return { ok: false, notYet: true, msg: 'Tap the number you found.' };
        if (c === '2') return { ok: true };
        return { ok: false, msg: matchWords(t, ['mAB', 'mAC']) };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Two isomers: cis and trans.',
          title: 'Cis and Trans',
          body: `Two isomers${g ? ` (you predicted ${g})` : ''}: the Cl− side by side, called cis, or opposite, called trans. Every other placement turns into one of these, and the cis form is a cancer drug.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-octahedron',
    title: 'Round an Octahedron',
    prompt: 'How many different arrangements of four NH₃ and two Cl− are there round Co³⁺?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        cplxFixture('A', { x: 37, y: 20 }, { metal: 'Co', q: 3, geom: 'oct', mode: 'cycle', palette: ['nh3', 'cl'], title: 'Model A', w: 70, h: 38, tilt: 32 }),
        cplxFixture('B', { x: 112, y: 20 }, { metal: 'Co', q: 3, geom: 'oct', mode: 'cycle', palette: ['nh3', 'cl'], title: 'Model B', w: 70, h: 38, tilt: 32 }),
        matchFixture('mAB', { x: 40, y: 47.5 }, { a: 'A', b: 'B', geom: 'oct', w: 70, h: 13 }),
        lchoiceFixture('pick', 'Different arrangements', { x: 112, y: 47.5 }, { row: true, w: 60, options: ['1', '2', '3', '15'] })
      ]
    }),
    hints: [
      'Build an arrangement on each model, then press "Turn B to Fit A".',
      'Compare an arrangement with the Cl− 90° apart and one with them 180° apart.',
      'Every pair of places round an octahedron is either side by side or opposite.'
    ],
    check(state) {
      const t = state.table;
      const c = chosen(t, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap the number you found.' };
      if (c === '2') return { ok: true };
      return { ok: false, msg: matchWords(t, ['mAB']) };
    },
    reward: {
      log: 'Two isomers round the octahedron.',
      title: 'Cis and Trans Again',
      body: 'Two: cis, with the Cl− 90° apart, and trans, 180° apart. The two forms of [Co(NH₃)₄Cl₂]⁺ are different substances, one violet and one green.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-sealed',
    title: 'Which Are Trans',
    prompt: 'Which of these four sealed models of Pt(NH₃)₂Cl₂ are the trans form?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: SEALED.map((m, i) => cplxFixture(`m${m.id}`, { x: 20 + i * 37, y: 31 }, { metal: 'Pt', q: 2, geom: 'sq', mode: 'show', start: m.arr, turn: true, turnStart: 2, mark: true, title: `Model ${m.id}`, w: 34, h: 50, yaw: m.yaw, tilt: m.tilt }))
    }),
    hints: [
      'Turn each model with its dial, then tap the ones you choose.',
      'Look where the two Cl− sit once a model is seen from above.',
      'Trans means the two like ligands sit on opposite sides of the metal ion.'
    ],
    check(state) {
      const t = state.table;
      const marked = SEALED.filter(m => Math.round(t.fixtures[`m${m.id}`].dials.mark.value) === 1);
      if (!marked.length) return { ok: false, notYet: true, msg: 'Tap the models you choose.' };
      const wrong = SEALED.find(m => (cisTrans('sq', m.arr, 'cl') === 'trans') !== marked.includes(m));
      if (!wrong) return { ok: true };
      const on = marked.includes(wrong);
      return { ok: false, msg: on ? `Model ${wrong.id}, seen from above, has its two Cl− side by side.` : `Model ${wrong.id}, seen from above, has its two Cl− on opposite sides.` };
    },
    reward: {
      log: 'B and D are trans.',
      title: 'Trans',
      body: 'B and D: their two Cl− sit opposite each other however the model is turned. A and C are cis.'
    }
  }
];

const NOTES = {
  1: ['Press "Release", then turn the dial.'],
  2: ['Turn a dial, then tap a model.'],
  3: ['Drag the card you choose into the slot.'],
  4: ['Tap rings, press a "Turn" key, tap a number.'],
  5: ['Tap rings, press the key, tap a number.'],
  6: ['Turn a dial; tap a model to mark it.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Six ligands settle into an octahedron, four into a tetrahedron or a flat square, and two like ligands can sit side by side (cis) or opposite (trans).' }]
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const build = (id, arr) => arr.map((x, i) => dial(id, `s${i}`, x === 'cl' ? 2 : 1));

export const SOLUTIONS = [
  [{ run: 'cx' }, dial('cx', 'turn', 6), dial('pick', 'value', 2)],
  [dial('pt', 'turn', 6), dial('pick', 'value', 2)],
  [put('g-6', 'slot:guess')],
  [...build('A', ['cl', 'cl', 'nh3', 'nh3']), ...build('B', ['cl', 'nh3', 'cl', 'nh3']), ...build('C', ['nh3', 'nh3', 'cl', 'cl']), { run: 'mAB' }, { run: 'mAC' }, dial('pick', 'value', 2)],
  [...build('A', ['cl', 'cl', 'nh3', 'nh3', 'nh3', 'nh3']), ...build('B', ['cl', 'nh3', 'cl', 'nh3', 'nh3', 'nh3']), { run: 'mAB' }, dial('pick', 'value', 2)],
  [dial('mB', 'mark', 1), dial('mD', 'mark', 1)]
];

export const MISSES = [
  [dial('pick', 'value', 1)],
  [dial('pick', 'value', 1)],
  [],
  [...build('A', ['cl', 'cl', 'nh3', 'nh3']), ...build('C', ['nh3', 'nh3', 'cl', 'cl']), { run: 'mAC' }, dial('pick', 'value', 4)],
  [dial('pick', 'value', 4)],
  [dial('mA', 'mark', 1), dial('mB', 'mark', 1)]
];

function blankState() { return {}; }
export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { SEALED, distinctCount };
