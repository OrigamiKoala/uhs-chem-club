/**
 * Unit 6 · Bench 4 — Kinds of Solid (q4-solids)
 *
 * An ice-cutting yard on the matter kit (`table/kits/matter.js`, `matter-tester.js`): the TESTER melts a sample, strikes it with a hammer,
 * or clips two leads to it, and the sample card keeps what each test showed. A six-stage recap of AP 3.2 and 3.3.A.1. Ligar's `q2-lattice`
 * already taught ionic, metallic and network solids, alloys, conduction and brittleness; this bench adds only what Ligar does not:
 * molecular solids (held by the grips of `q2-grip`), and crystalline against amorphous.
 *
 *   1  five solids heated to 200 °C and filed by what melting has to overcome   -> molecular solids
 *   2  PREDICT: quartz and fused silica glass are both silicon and oxygen
 *   3  TEST: four solids heated to 2000 °C, filed by how each gives way         -> crystalline, amorphous
 *   4  five samples shown as pictures of their particles, filed                 -> a pattern, whatever the particles are
 *   5  four sealed solids filed under metallic, ionic, network or molecular
 *   6  five sealed solids, one of them a window glass that looks ionic          -> the whole record
 *
 * THE WRONG MODEL IS ON THE TABLE. "A solid is a solid: the same arrangement, only harder or softer." The prediction offers it, and
 * stage 3 overturns it: quartz and fused silica are the same atoms and give way differently.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { matterTable, note, whereIs } from '../../table/kits/matter.js';
import { solidCard, solidTestFixture, cardRows } from '../../table/kits/matter-tester.js';
import { SOLIDS, meltText } from '../../engine/matterdata-tester.js';

export const meta = { stageCount: 6 };

/** Mirrowen has no ground yet, so at T4 the table stands in a room of its own (`rooms.js`). */
export const ROOM = 'foundry';

export const VOCABULARY = [
  { term: /\bmolecular solids?\b/i, introducedAt: 1 },
  { term: /\bcrystalline\b/i, introducedAt: 3 },
  { term: /\bamorphous\b/i, introducedAt: 3 }
];

/** Ionic, metallic and network solids, brittleness, conduction and melting point are Ligar's; the grips between molecules are `q2-grip`'s. */
export const BUILDS_ON = ['unit03/q2-lattice', 'unit06/q2-grip'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit06/q4-solids';
const SLOT = 'slot:tester.slot';
const TESTER_AT = { x: 37, y: 23.5 };
const GUESS_LABEL = { alike: 'both would melt at one temperature', differ: 'the glass would go soft gradually', higher: 'the glass would hold on longer' };

/* ------------------------------------------------------------------
   THE SAMPLES AND THEIR ANSWERS
   ------------------------------------------------------------------ */

const S1 = [
  { id: 'ice', solid: 'ice', tray: 'grips' }, { id: 'iodine', solid: 'iodine', tray: 'grips' }, { id: 'naphthalene', solid: 'naphthalene', tray: 'grips' },
  { id: 'salt', solid: 'salt', tray: 'stronger' }, { id: 'copper', solid: 'copper', tray: 'stronger' }
];
const S3 = [
  { id: 'quartz', solid: 'quartz', label: 'quartz', tray: 'one' }, { id: 'silica', solid: 'silica', label: 'fused silica', tray: 'range' },
  { id: 'salt', solid: 'salt', label: 'salt', tray: 'one' }, { id: 'copper', solid: 'copper', label: 'copper', tray: 'one' }
];
const S4 = [
  { id: 'a', solid: 'glass', label: 'A', tray: 'amorphous' }, { id: 'b', solid: 'copper', label: 'B', tray: 'crystalline' },
  { id: 'c', solid: 'silica', label: 'C', tray: 'amorphous' }, { id: 'd', solid: 'ice', label: 'D', tray: 'crystalline' },
  { id: 'e', solid: 'quartz', label: 'E', tray: 'crystalline' }
];
const S5 = [
  { id: 'x1', solid: 'quartz', label: 'X1', tray: 'network' }, { id: 'x2', solid: 'copper', label: 'X2', tray: 'metallic' },
  { id: 'x3', solid: 'naphthalene', label: 'X3', tray: 'molecular' }, { id: 'x4', solid: 'salt', label: 'X4', tray: 'ionic' }
];
const S6 = [
  { id: 'x1', solid: 'glass', label: 'X1', tray: 'amorphous' }, { id: 'x2', solid: 'iodine', label: 'X2', tray: 'molecular' },
  { id: 'x3', solid: 'iron', label: 'X3', tray: 'metallic' }, { id: 'x4', solid: 'quartz', label: 'X4', tray: 'network' },
  { id: 'x5', solid: 'potassium', label: 'X5', tray: 'ionic' }
];

/* ------------------------------------------------------------------
   TABLE BUILDING
   ------------------------------------------------------------------ */

/** Five sample cards in two rows, top right. */
const CARD_AT = [{ x: 86, y: 14 }, { x: 110, y: 14 }, { x: 134, y: 14 }, { x: 86, y: 35.5 }, { x: 110, y: 35.5 }];

/** A row of trays across the foot of the table. */
function trayRow(defs) {
  const n = defs.length;
  const w = n === 2 ? 70 : n === 4 ? 33 : 27;
  const pitch = n === 2 ? 74 : n === 4 ? 36 : 29;
  const x0 = n === 2 ? 3 : n === 4 ? 3 : 2.5;
  return defs.map(([id, label], i) => ({ id, label, at: { x: x0 + i * pitch + w / 2, y: 61 }, size: { w, h: 21 }, cell: 23.2, cellH: 19 }));
}

function benchTable(items, tester, trays) {
  const cards = items.map((s, i) => solidCard(s.id, s.solid, s.label ?? s.id, CARD_AT[i]));
  return matterTable({
    bounds: { w: 150, h: 72 },
    recorder: { at: { x: 147.4, y: 2.4 }, size: { w: 5, h: 3.4 } },
    pieces: cards,
    fixtures: [tester.fixture],
    zones: { slots: [tester.slot], trays: trayRow(trays) }
  });
}

/* ------------------------------------------------------------------
   REFUSALS
   ------------------------------------------------------------------ */

const trayLabel = (t, id) => t.zones.trays[id]?.label;

/** Every sample in a tray, or why not. `say(card, tray label, item)` is the stage's refusal for the first misfiled one. */
function fileCheck(items, say) {
  return state => {
    const t = state.table;
    const inTray = id => t.zones.trays[whereIs(t, id)];
    if (items.some(s => !inTray(s.id))) return { ok: false, notYet: true, msg: 'Every sample needs a tray.' };
    const wrong = items.find(s => whereIs(t, s.id) !== s.tray);
    if (!wrong) return { ok: true };
    return { ok: false, msg: say(t.pieces[wrong.id], trayLabel(t, whereIs(t, wrong.id)), wrong, t) };
  };
}

const cap = text => text.charAt(0).toUpperCase() + text.slice(1);
const NOT_TESTED = p => cap(`${p.label} has not been in the tester yet.`);

/** Stage 1: what the heater did to the sample, and the tray it sits in. */
const meltSay = (p, tray) => {
  const m = p.props.melt;
  if (!m) return NOT_TESTED(p);
  const did = m.held ? `stayed rigid to the top of the heater's range, ${m.maxT} °C` : `fell at ${meltText(m)}`;
  return cap(`${p.label}'s trace ${did}, and it sits in the "${tray}" tray.`);
};

/** Stage 3: the shape of the trace. */
const traceSay = (p, tray) => {
  const m = p.props.melt;
  if (!m) return NOT_TESTED(p);
  const did = m.hi === m.lo ? `stood flat to ${m.lo} °C and fell at once` : `fell a little at a time from ${m.lo} °C to ${m.hi} °C`;
  return cap(`${p.label}'s trace ${did}, and it sits in the "${tray}" tray.`);
};

/** Stage 4: the picture, said by comparison with a sample filed beside it. */
const pictureSay = (p, tray, wrong, t) => {
  const mine = SOLIDS[p.props.solid];
  const here = Object.values(t.pieces).filter(q => q.id !== p.id && q.zone && q.zone === p.zone && SOLIDS[q.props.solid].crystalline !== mine.crystalline);
  if (here.length) return `The picture of sample ${p.label} does not look like the picture of sample ${here[0].label}, which is filed with it.`;
  return `Look at the picture of sample ${p.label} again beside the pictures of the other samples.`;
};

/** Stages 5 and 6: the whole record the sample's card kept. */
const recordSay = (p, tray) => {
  const rows = cardRows(p).map(r => r[0]);
  if (!rows.length) return NOT_TESTED(p);
  return `${p.label} showed ${rows.join(', ')}, and it sits in the "${tray}" tray.`;
};

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, { tests: ['melt'], T0: -40, maxT: 200 });
    return {
      id: 's1-melt',
      title: 'Five Solids',
      prompt: 'Sort the solids by whether melting each one only has to overcome grips between molecules.',
      widget,
      table: benchTable(S1, tester, [['grips', 'Only grips between molecules'], ['stronger', 'Something stronger']]),
      hints: [
        'Use the tester, its "Heat" key and the two trays.',
        'Compare how far up the heater\'s range each sample held its shape before it ran.',
        'The weaker the hold between particles, the less heat it takes to loosen them, and the grips between molecules are weak holds.'
      ],
      check: fileCheck(S1, meltSay),
      reward: {
        log: 'Ice, iodine and naphthalene melted far below the others.',
        title: 'Molecular Solids',
        body: 'Ice, iodine and naphthalene are made of whole molecules held to one another by weak grips, so a little heat frees them: each is a molecular solid. Melting moves the molecules apart and leaves every one whole.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Same Atoms',
    // A PREDICT STAGE: the tester is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Quartz and fused silica glass are both made only of silicon and oxygen: how will each give way as it is heated?',
    widget,
    table: matterTable({
      pieces: [
        note('alike', 'Both stay hard, then melt at one temperature', { x: 30, y: 14 }),
        note('differ', 'Quartz melts at one temperature; the glass goes soft gradually', { x: 78, y: 14 }),
        note('higher', 'The glass holds its shape to a higher temperature than quartz', { x: 30, y: 34 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Think about what the two solids share and what could still be different.',
      'Commit to the way you expect each to give way as the temperature climbs.'
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
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, heat quartz, fused silica glass and two more solids in the tester.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, { tests: ['melt'], T0: 0, maxT: 2000 });
    return {
      id: 's3-glass',
      title: 'Quartz and Glass',
      get prompt() {
        const g = recall(QUEST_KEY);
        return g && GUESS_LABEL[g]
          ? `You guessed ${GUESS_LABEL[g]}: heat each solid and file it by how it gives way.`
          : 'Heat each solid and file it by how it gives way.';
      },
      widget,
      table: benchTable(S3, tester, [['one', 'Gives way at one temperature'], ['range', 'Gives way over a range']]),
      hints: [
        'Use the tester, its "Heat" key and the two trays.',
        'Compare the shape of each trace as the temperature climbs.',
        'Some samples lose their stiffness at a single temperature, and others lose it a little at a time.'
      ],
      check: fileCheck(S3, traceSay),
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g === 'differ' ? 'Your guess matched the traces. ' : g && GUESS_LABEL[g] ? 'The traces differed from your guess. ' : '';
        return {
          log: 'Quartz melted at one temperature, and fused silica softened over a range.',
          title: 'Crystalline and Amorphous',
          body: `${verdict}In a crystalline solid the particles sit in a repeating pattern, so every hold gives way at one temperature. An amorphous solid, such as glass, has no pattern, so its holds give way a few at a time.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, { view: 'window' });
    return {
      id: 's4-picture',
      title: 'Inside the Solid',
      prompt: 'File each sample as crystalline or amorphous.',
      widget,
      table: benchTable(S4, tester, [['crystalline', 'Crystalline'], ['amorphous', 'Amorphous']]),
      hints: [
        'Use the tester\'s window: drag a sample into the slot, then drag it into a tray.',
        'Compare whether the particles of each sample sit in a pattern that repeats.',
        'A pattern that repeats in every direction is crystalline, and particles with no repeating pattern are amorphous.'
      ],
      check: fileCheck(S4, pictureSay),
      reward: {
        log: 'Metals, molecules and quartz repeat; the two glasses do not.',
        title: 'Reading the Picture',
        body: 'Metals, molecules and quartz can all be crystalline: what counts is a repeating pattern, whatever the particles are. Glass is made of the same silicon and oxygen as quartz, but its network has no pattern, so it is amorphous.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, {});
    return {
      id: 's5-sealed',
      title: 'Four Sealed Solids',
      prompt: 'Sort the four sealed solids into the tray for the kind of solid each is.',
      widget,
      table: benchTable(S5, tester, [['metallic', 'Metallic'], ['ionic', 'Ionic'], ['network', 'Network'], ['molecular', 'Molecular']]),
      hints: [
        'Use the tester: drag a sample in, turn the "Test" dial, and press "Test" for each test.',
        'Compare the melt trace, the hammer result and the two lamps of each sample with the others.',
        'Ask which solid lights the lamp cold, which only molten, which melts lowest and which holds out longest.'
      ],
      check: fileCheck(S5, recordSay),
      reward: {
        log: 'Each kind of solid left its own record.',
        title: 'Four Records',
        body: 'Metals flatten and light the lamp cold. Ionic solids shatter and light it only when molten. Network solids shatter, never light it and melt highest, while molecular solids crumble and melt low.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, {});
    return {
      id: 's6-sealed',
      title: 'Five Sealed Solids',
      prompt: 'Sort the five sealed solids into the tray for the kind of solid each is.',
      widget,
      table: benchTable(S6, tester, [['metallic', 'Metallic'], ['ionic', 'Ionic'], ['network', 'Network'], ['molecular', 'Molecular'], ['amorphous', 'Amorphous']]),
      hints: [
        'Use the tester: drag a sample in, turn the "Test" dial, and press "Test" for each test.',
        'Two solids can agree on most tests, so compare every reading of every sample.',
        'A trace that falls at one temperature and a trace that falls over a range mean different things about the particles.'
      ],
      check: fileCheck(S6, recordSay),
      reward: {
        log: 'The glass looked ionic in every test but the melt trace.',
        title: 'The Whole Record',
        body: 'The window glass shattered, stayed dark cold and lit the lamp molten, just as the ionic solid did. Only its trace told them apart: no single melting temperature means no repeating pattern, so it is amorphous.'
      }
    };
  })()
];

/** How-to lines printed on the plate. The bench tables are full, so only the prediction carries one; the tester's own plate and its Tour step say how it works. */
const NOTES = {
  2: ['Drag the card you choose into the slot.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A molecular solid melts low because only the grips between its molecules give way. A crystalline solid melts at one temperature because its particles repeat in a pattern, and an amorphous solid such as glass softens over a range because it has none.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES: SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = n => ({ setDial: { fixture: 'tester', dial: 'test', value: n } });
const RUN = { run: 'tester' };

/** Seat a sample, run `steps` (a list of dial settings, or none for a single test) and file it. */
const file = (s, tray, dials = [null]) => [
  put(s.id, SLOT), ...dials.flatMap(d => (d == null ? [RUN] : [dial(d), RUN])), put(s.id, `tray:${tray ?? s.tray}`)
];
const fileAll = (items, dials, override = {}) => items.flatMap(s => file(s, override[s.id], dials));
const seeAll = items => items.flatMap(s => [put(s.id, SLOT), put(s.id, `tray:${s.tray}`)]);

export const SOLUTIONS = [
  fileAll(S1),
  [put('differ', 'slot:guess')],
  fileAll(S3),
  seeAll(S4),
  fileAll(S5, [1, 2, 3]),
  fileAll(S6, [1, 2, 3])
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  fileAll(S1, [null], { salt: 'grips' }),
  [],
  fileAll(S3, [null], { silica: 'one' }),
  seeAll(S4.map(s => (s.id === 'b' ? { ...s, tray: 'amorphous' } : s))),
  fileAll(S5, [1, 2, 3], { x1: 'ionic', x4: 'network' }),
  fileAll(S6, [1, 2, 3], { x1: 'ionic', x5: 'amorphous' })
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { S1, S3, S4, S5, S6, SOLIDS };
