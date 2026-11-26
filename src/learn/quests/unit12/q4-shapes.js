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
    title: 'Six Around One',
    briefing: { speaker: SPEAKER, body: 'Ligands repel each other because of their electron clouds. Here, six ammonia ligands start in a flat ring around Co³⁺ until you release them.' },
    prompt: 'What shape do six ligands form around a metal ion once released?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        cplxFixture('cx', { x: 50, y: 31 }, { metal: 'Co', q: 3, geom: 'oct', mode: 'ring6', turn: true, turnStart: 3, title: 'Co³⁺ and six NH₃', w: 92, h: 56 }),
        lchoiceFixture('pick', 'The shape', { x: 124, y: 30 }, { list: true, w: 46, options: ['A flat hexagon', 'Four in a square, one above & below', 'Five in a ring, one on top'] })
      ]
    }),
    hints: [
      'Press "Release", then drag the "Turn" dial toward Edge-on.',
      'Watch how the ligands move out of the flat ring and inspect the shape from the side.',
      'Repelling ligands move as far apart from each other as 3D space allows.'
    ],
    check(state) {
      const t = state.table;
      const c = chosen(t, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap the shape that matches the model.' };
      if (c === 'Four in a square, one above & below') return { ok: true };
      if (!cplxRead(t, 'cx').released) return { ok: false, msg: 'Press "Release" first to let the ligands move out of the flat ring.' };
      return { ok: false, msg: 'Drag the "Turn" dial to Edge-on and count how many ligands sit in the middle plane, above, and below.' };
    },
    reward: {
      log: 'Six ligands make an octahedron.',
      title: 'Octahedron',
      body: 'Four ligands form a square around the ion with one above and one below, all 90° apart. This shape is an octahedron, and it keeps six ligands further apart than a flat ring.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-four',
    title: 'Four Around One',
    prompt: 'Which complex has all four ligands in one flat plane?',
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
      'Rotate both models with their "Turn" dials, then pick the flat one.',
      'View each model edge-on to see whether all four ligands line up.',
      'A completely flat shape looks like a single straight line when viewed edge-on.'
    ],
    check(state) {
      const c = chosen(state.table, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap the complex that is flat.' };
      if (c === 'Pt²⁺') return { ok: true };
      return { ok: false, msg: 'Viewed edge-on, two of Zn²⁺\'s ligands stick out above the ion and two below it.' };
    },
    reward: {
      log: 'Pt²⁺ holds four in a square.',
      title: 'Square Planar',
      body: 'Four ligands usually spread 109.5° apart in a tetrahedron, like Zn²⁺. Some d⁸ ions such as Pt²⁺ form a flat square (square planar) because of how their d orbitals interact with ligands.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'How Many Ways',
    predict: true,
    briefing: { speaker: SPEAKER, body: 'Molecules with the same atoms arranged differently are called isomers. Two models are the same isomer if rotating or flipping one makes it match the other.' },
    prompt: 'How many different ways can two NH₃ and two Cl− be arranged in a flat square around Pt²⁺?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-1', 'One: every arrangement is just a rotated copy', { x: 32, y: 14 }),
        note('g-2', 'Two: the Cl− ions are side by side or across from each other', { x: 32, y: 33 }),
        note('g-6', 'Six: one for every way to pick two corners', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'sq-turn', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch the clip rotate a square with four identical ligands.',
      'There are six ways to pick two of four corners, but rotating the square turns some into others.',
      'Ask what is actually different about how the two Cl− ions sit relative to each other.'
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
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is saved. Now test it by building and rotating models.' }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's4-turn',
      title: 'Turn to Fit',
      get prompt() { const g = guess(); return `How many different arrangements of two NH₃ and two Cl− exist around Pt²⁺${g ? ` (you predicted ${g})` : ''}?`; },
      widget,
      table: lodeTable({
        pieces: [],
        fixtures: [
          frame('A', 25, 'sq', 'Pt', 2), frame('B', 75, 'sq', 'Pt', 2), frame('C', 125, 'sq', 'Pt', 2),
          matchFixture('mAB', { x: 50, y: 44 }, { a: 'A', b: 'B', geom: 'sq', need: { nh3: 2, cl: 2 }, w: 48, h: 13 }),
          matchFixture('mAC', { x: 100, y: 44 }, { a: 'A', b: 'C', geom: 'sq', need: { nh3: 2, cl: 2 }, w: 48, h: 13 }),
          lchoiceFixture('pick', 'Different arrangements', { x: 40, y: 57.5 }, { row: true, w: 60, options: ['1', '2', '3', '6'] })
        ]
      }),
      hints: [
        'Tap the rings on each model to place two NH₃ and two Cl−, then press a "Turn" button to compare.',
        'Check which arrangements cannot be rotated or flipped to match each other.',
        'Compare whether the two Cl− ligands sit side by side or across from each other.'
      ],
      check(state) {
        const t = state.table;
        const c = chosen(t, 'pick');
        if (!c) return { ok: false, notYet: true, msg: 'Tap the number of distinct arrangements you found.' };
        if (c === '2') return { ok: true };
        const w = matchWords(t, ['mAB', 'mAC']);
        return { ok: false, msg: w === 'No two models have been compared yet.' ? w : `${w} Check whether any third arrangement is truly different from the first two.` };
      },
      get reward() {
        const g = guess();
        const right = recall(QUEST_KEY) === 'g-2';
        return {
          log: 'Two isomers: cis and trans.',
          title: 'Cis and Trans',
          body: `There are two isomers${g ? (right ? ', matching your prediction' : `, not ${g}`) : ''}: the two Cl− ions sit side by side (cis) or across from each other (trans). Any other placement rotates into one of those two.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-octahedron',
    title: 'Around an Octahedron',
    prompt: 'How many different arrangements of four NH₃ and two Cl− exist around Co³⁺?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        cplxFixture('A', { x: 37, y: 20 }, { metal: 'Co', q: 3, geom: 'oct', mode: 'cycle', palette: ['nh3', 'cl'], title: 'Model A', w: 70, h: 38, tilt: 32 }),
        cplxFixture('B', { x: 112, y: 20 }, { metal: 'Co', q: 3, geom: 'oct', mode: 'cycle', palette: ['nh3', 'cl'], title: 'Model B', w: 70, h: 38, tilt: 32 }),
        matchFixture('mAB', { x: 40, y: 47.5 }, { a: 'A', b: 'B', geom: 'oct', need: { nh3: 4, cl: 2 }, w: 70, h: 13 }),
        lchoiceFixture('pick', 'Different arrangements', { x: 112, y: 47.5 }, { row: true, w: 60, options: ['1', '2', '3', '15'] })
      ]
    }),
    hints: [
      'Build four NH₃ and two Cl− on both models, then press "Turn B to Fit A".',
      'Try placing the two Cl− ligands at different angles around the center and compare.',
      'Any two spots on an octahedron are either side by side (90°) or directly opposite (180°).'
    ],
    check(state) {
      const t = state.table;
      const c = chosen(t, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap the number of distinct arrangements you found.' };
      if (c === '2') return { ok: true };
      return { ok: false, msg: matchWords(t, ['mAB']) };
    },
    reward: {
      log: 'Two isomers around the octahedron.',
      title: 'Octahedral Isomers',
      body: 'There are two isomers: cis (Cl− ions 90° apart) and trans (Cl− ions 180° apart). Every other placement rotates into one of these two.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-sealed',
    title: 'Which Are Trans',
    briefing: { speaker: SPEAKER, body: 'Drag each model\'s "Turn" dial to "Above" to see whether its two Cl− ligands are side by side (cis) or opposite (trans), then tap the trans models.' },
    prompt: 'Which of these four sealed Pt(NH₃)₂Cl₂ models are the trans isomer?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: SEALED.map((m, i) => cplxFixture(`m${m.id}`, { x: 20 + i * 37, y: 31 }, { metal: 'Pt', q: 2, geom: 'sq', mode: 'show', start: m.arr, turn: true, turnStart: 2, mark: true, title: `Model ${m.id}`, w: 35, h: 52, yaw: m.yaw, tilt: m.tilt }))
    }),
    hints: [
      'Rotate each model to "Above" with its dial, then tap the trans models.',
      'Check where the two Cl− ligands sit once you look straight down from above.',
      'In the trans isomer, the two matching ligands sit directly across from each other.'
    ],
    check(state) {
      const t = state.table;
      const marked = SEALED.filter(m => Math.round(t.fixtures[`m${m.id}`].dials.mark.value) === 1);
      if (!marked.length) return { ok: false, notYet: true, msg: 'Tap the models you want to select.' };
      const wrong = SEALED.find(m => (cisTrans('sq', m.arr, 'cl') === 'trans') !== marked.includes(m));
      if (!wrong) return { ok: true };
      const on = marked.includes(wrong);
      return { ok: false, msg: on ? `Viewed from above, Model ${wrong.id} has its two Cl− ions side by side.` : `Viewed from above, Model ${wrong.id} has its two Cl− ions across from each other.` };
    },
    reward: {
      log: 'B and D are trans.',
      title: 'Trans',
      body: 'Models B and D are trans: their two Cl− ions sit across from each other no matter how you rotate them. Models A and C are cis.'
    }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Six ligands form an octahedron, and four form a tetrahedron or a flat square. When two matching ligands sit side by side the isomer is cis; when they sit across from each other it is trans.' }]
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
