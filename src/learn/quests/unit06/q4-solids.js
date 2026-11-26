/**
 * Unit 6 · Bench 4 — Kinds of Solid (q4-solids)
 *
 * An ice-cutting yard on the matter kit (`table/kits/matter.js`, `matter-tester.js`): the TESTER melts a sample, strikes it with a hammer,
 * or clips two leads to it, and the sample card keeps what each test showed. A five-stage recap of AP 3.2 and 3.3.A.1. Ligar's
 * `q2-lattice` already taught ionic, metallic and network solids, alloys, conduction and brittleness; this bench adds only what Ligar
 * does not: molecular solids (held by the attractions of `q2-grip`), and crystalline against amorphous.
 *
 *   1  five solids heated to 200 °C and filed by whether they are molecular   -> molecular solids
 *   2  PREDICT: quartz and fused silica glass are both silicon and oxygen
 *   3  TEST: four solids heated to 2000 °C with particle window beside trace  -> crystalline, amorphous
 *   4  four sealed solids filed under metallic, ionic, network or molecular
 *   5  five sealed solids, one of them a window glass that looks ionic       -> the whole record
 *
 * THE WRONG MODEL IS ON THE TABLE. "A solid is a solid: the same arrangement, only harder or softer." The prediction offers it, and
 * stage 3 overturns it: quartz and fused silica are the same atoms, shown in the window and on the stiffness trace.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { matterTable, note, whereIs, leadFixture } from '../../table/kits/matter.js';
import { solidCard, solidTestFixture, cardRows } from '../../table/kits/matter-tester.js';
import { SOLIDS, meltText, currentReading } from '../../engine/matterdata-tester.js';

export const meta = { stageCount: 6 };


export const VOCABULARY = [
  { term: /\bmolecular solids?\b/i, introducedAt: 1 },
  { term: /\bcrystalline\b/i, introducedAt: 3 },
  { term: /\bamorphous\b/i, introducedAt: 3 }
];

/** Ionic, metallic and network solids, brittleness, conduction and melting point are Ligar's; the attractions between molecules are `q2-grip`'s. */
export const BUILDS_ON = ['unit03/q2-lattice', 'unit06/q2-grip'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit06/q4-solids';
const SLOT = 'slot:tester.slot';
const TESTER_AT = { x: 37, y: 23.5 };
const GUESS_LABEL = { alike: 'both would melt at one temperature', differ: 'the glass would go soft gradually', higher: 'the glass would stay rigid longer' };

/* ------------------------------------------------------------------
   THE SAMPLES AND THEIR ANSWERS
   ------------------------------------------------------------------ */

const S1 = [
  { id: 'ice', solid: 'ice', label: 'ice', tray: 'grips' }, { id: 'iodine', solid: 'iodine', label: 'iodine', tray: 'grips' }, { id: 'naphthalene', solid: 'naphthalene', label: 'mothball', tray: 'grips' },
  { id: 'gallium', solid: 'gallium', label: 'gallium (metal)', tray: 'stronger' }, { id: 'salt', solid: 'salt', label: 'table salt', tray: 'stronger' }
];
const S3 = [
  { id: 'quartz', solid: 'quartz', label: 'quartz', tray: 'one' }, { id: 'silica', solid: 'silica', label: 'fused silica', tray: 'range' },
  { id: 'salt', solid: 'salt', label: 'salt', tray: 'one' }, { id: 'copper', solid: 'copper', label: 'copper', tray: 'one' }
];
const S4 = [
  { id: 'x1', solid: 'quartz', label: 'X1', tray: 'network' }, { id: 'x2', solid: 'copper', label: 'X2', tray: 'metallic' },
  { id: 'x3', solid: 'naphthalene', label: 'X3', tray: 'molecular' }, { id: 'x4', solid: 'salt', label: 'X4', tray: 'ionic' }
];
const S5 = [
  { id: 'x1', solid: 'glass', label: 'X1', tray: 'amorphous' }, { id: 'x2', solid: 'iodine', label: 'X2', tray: 'molecular' },
  { id: 'x3', solid: 'iron', label: 'X3', tray: 'metallic' }, { id: 'x4', solid: 'quartz', label: 'X4', tray: 'network' },
  { id: 'x5', solid: 'potassium', label: 'X5', tray: 'ionic' }
];
const S6 = [
  { id: 'naphthalene', solid: 'naphthalene', label: 'naphthalene', tray: 'chains' },
  { id: 'polyethylene', solid: 'polyethylene', label: 'polyethylene', tray: 'chains' },
  { id: 'crosslinked', solid: 'crosslinked', label: 'cross-linked resin', tray: 'crosslink' }
];

/* ------------------------------------------------------------------
   TABLE BUILDING
   ------------------------------------------------------------------ */

/** Five sample cards in two rows, top right. */
const CARD_AT = [{ x: 86, y: 14 }, { x: 110, y: 14 }, { x: 134, y: 14 }, { x: 86, y: 35.5 }, { x: 110, y: 35.5 }];
/** Four sample cards clear of the wider window+trace tester. */
const CARD_AT_4 = [{ x: 112, y: 14 }, { x: 136, y: 14 }, { x: 112, y: 35.5 }, { x: 136, y: 35.5 }];

/** A row of trays across the foot of the table. */
function trayRow(defs) {
  const n = defs.length;
  const w = n === 2 ? 70 : n === 4 ? 33 : 27;
  const pitch = n === 2 ? 74 : n === 4 ? 36 : 29;
  const x0 = n === 2 ? 3 : n === 4 ? 3 : 2.5;
  return defs.map(([id, label, view], i) => ({ id, label, ...(view ? { view } : {}), at: { x: x0 + i * pitch + w / 2, y: 61 }, size: { w, h: 21 }, cell: 23.2, cellH: 19 }));
}

function benchTable(items, tester, trays, cardPos = CARD_AT) {
  const cards = items.map((s, i) => solidCard(s.id, s.solid, s.label ?? s.id, cardPos[i]));
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

/** Every sample in a tray, or why not. `mustTest` ensures samples are tested before passing; `say` is the refusal for the first misfiled one. */
function fileCheck(items, say, mustTest = null) {
  return state => {
    const t = state.table;
    const inTray = id => t.zones.trays[whereIs(t, id)];
    if (items.some(s => !inTray(s.id))) return { ok: false, notYet: true, msg: 'Sort every sample into a tray.' };
    if (mustTest) {
      const untested = mustTest(t);
      if (untested) return { ok: false, msg: NOT_TESTED(untested) };
    }
    const wrong = items.find(s => whereIs(t, s.id) !== s.tray);
    if (!wrong) return { ok: true };
    return { ok: false, msg: say(t.pieces[wrong.id], trayLabel(t, whereIs(t, wrong.id)), wrong, t) };
  };
}

const cap = text => text.charAt(0).toUpperCase() + text.slice(1);
const NOT_TESTED = p => cap(`${p.label} has not been tested yet.`);

/** Stage 1: what the heater did to the sample, and the tray it sits in. */
const meltSay = (p, tray) => {
  const m = p.props.melt;
  if (!m) return NOT_TESTED(p);
  const did = m.held ? `stayed solid up to ${m.maxT} °C` : `melted at ${meltText(m)}`;
  const lamp = p.props.cur ? (p.props.cur.cold ? ', and conducted electricity when cold' : ', and did not conduct electricity when cold') : ', and has not been tested for conductivity';
  return cap(`${p.label} ${did}${lamp}, so it does not belong in "${tray}".`);
};

/** Stage 3: the shape of the trace. */
const traceSay = (p, tray) => {
  const m = p.props.melt;
  if (!m) return NOT_TESTED(p);
  const did = m.hi === m.lo ? `stayed rigid up to ${m.lo} °C and melted all at once` : `softened gradually from ${m.lo} °C to ${m.hi} °C`;
  return cap(`${p.label} ${did}, so it does not belong in "${tray}".`);
};

/** Stages 4 and 5: the whole record the sample's card kept. */
const recordSay = (p, tray) => {
  const rows = cardRows(p).map(r => r[0]);
  if (!rows.length) return NOT_TESTED(p);
  return `${p.label} showed ${rows.join(', ')}, which does not match "${tray}".`;
};

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, { tests: ['melt', 'current'], T0: -40, maxT: 200 });
    return {
      id: 's1-melt',
      title: 'Five Solids',
      briefing: 'A molecular solid is made of whole molecules held together only by weak attractions between them. The lamp lights if a solid conducts electricity.',
      prompt: 'Which of these five samples are molecular solids?',
      widget,
      table: benchTable(S1, tester, [['grips', 'Molecular solid'], ['stronger', 'Not molecular']]),
      hints: [
        'Test each sample in the tester with both Melt and Current, then sort them into the two trays.',
        'Compare each sample\'s melting trace with whether it conducts electricity when cold or molten.',
        'A molecular solid melts at a low temperature and does not conduct electricity.'
      ],
      check: fileCheck(S1, meltSay, t => S1.map(s => t.pieces[s.id]).find(p => !p.props.melt && !p.props.cur)),
      reward: {
        log: 'Ice, iodine, and naphthalene melted low and did not conduct; gallium melted low and conducted.',
        title: 'Molecular Solids',
        body: 'Ice, iodine, and naphthalene are molecular solids: weak attractions make them melt easily, and they do not conduct electricity. Gallium melts low too, but it conducts electricity because it is a metal.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Same Atoms',
    // A PREDICT STAGE: the tester is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Quartz and glass are both made of silicon and oxygen—how will each behave when heated?',
    widget,
    table: matterTable({
      pieces: [
        note('alike', 'Both melt at one sharp temperature', { x: 30, y: 14 }),
        note('differ', 'Quartz melts sharply; glass softens gradually', { x: 74, y: 14 }),
        note('higher', 'Glass melts at a higher sharp temperature', { x: 30, y: 34 })
      ],
      fixtures: [leadFixture('lead', { x: 117, y: 52 }, { scene: 'heater', w: 44, h: 24, leftLabel: 'SOLID' })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 40, h: 15 } }] }
    }),
    hints: [
      'Read the three prediction cards and drag your choice into the slot.',
      'Think about what quartz and glass share (the same atoms) and what could still differ (how those atoms are arranged).',
      'Pick how you expect quartz and glass to melt as they heat up.'
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
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, heat quartz, fused silica glass, and two other solids in the tester.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const tester = solidTestFixture('tester', { x: 51, y: 23.5 }, { tests: ['melt'], view: 'both', T0: 0, maxT: 2000 });
    return {
      id: 's3-glass',
      title: 'Quartz and Glass',
      get prompt() {
        const g = recall(QUEST_KEY);
        return g && GUESS_LABEL[g]
          ? `You predicted ${GUESS_LABEL[g]}. Which solids melt at one sharp temperature and which soften over a range?`
          : 'Which solids melt at one sharp temperature and which soften over a range?';
      },
      widget,
      table: benchTable(S3, tester, [['one', 'Melts at one temperature'], ['range', 'Softens over a range']], CARD_AT_4),
      hints: [
        'Heat each sample in the tester with "Heat", then sort them into the two trays.',
        'Compare each sample\'s particle arrangement with how its stiffness curve drops as it heats up.',
        'Particles in a repeating pattern break free all at once, while disordered particles soften gradually.'
      ],
      check: fileCheck(S3, traceSay, t => S3.map(s => t.pieces[s.id]).find(p => !p.props.melt)),
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g === 'differ' ? 'The traces matched your prediction. ' : g && GUESS_LABEL[g] ? 'The traces disagreed with your prediction. ' : '';
        return {
          log: 'Quartz melted at one temperature, while fused silica softened over a range.',
          title: 'Crystalline and Amorphous',
          body: `${verdict}Crystalline solids have a repeating pattern and melt at one sharp temperature, while amorphous solids like glass have no repeating pattern and soften gradually.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, {});
    return {
      id: 's4-sealed',
      title: 'Four Sealed Solids',
      briefing: {
        speaker: 'Vess',
        body: 'Test each sealed solid with Melt, Strike, and Current in the tester to compare how metals, ionic, network, and molecular solids behave.'
      },
      prompt: 'What kind of solid is each sealed sample?',
      widget,
      table: benchTable(S4, tester, [['metallic', 'Metallic'], ['ionic', 'Ionic'], ['network', 'Network'], ['molecular', 'Molecular']]),
      hints: [
        'Drag a sample into the tester, pick Melt, Strike, or Current on the Mode dial, and press "Test".',
        'Compare the melt trace, the hammer result, and whether each sample conducts electricity cold or molten.',
        'Use the hammer, heater, and conductivity test together: no single test separates all four kinds.'
      ],
      check: fileCheck(S4, recordSay, t => S4.map(s => t.pieces[s.id]).find(p => !p.props.melt && !p.props.strike && !p.props.cur)),
      reward: {
        log: 'Each kind of solid left its own record.',
        title: 'Four Records',
        body: 'Metals flatten and conduct when solid, while ionic solids shatter and conduct only when molten. Network solids shatter, never conduct, and melt highest, whereas molecular solids crumble and melt low.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const tester = solidTestFixture('tester', { x: 39, y: 23.5 }, { tests: ['melt'], view: 'trace', w: 74, title: 'Melt & Trace Viewer' });
    const cardPos5 = [{ x: 89, y: 14 }, { x: 113, y: 14 }, { x: 137, y: 14 }, { x: 89, y: 35.5 }, { x: 113, y: 35.5 }];
    const cards5 = S5.map((s, i) => solidCard(s.id, s.solid, s.label ?? s.id, cardPos5[i], {
      props: {
        solid: s.solid,
        strike: SOLIDS[s.solid].strike,
        cur: currentReading(SOLIDS[s.solid], { T0: 0, maxT: 2000 })
      }
    }));
    return {
      id: 's5-sealed',
      title: 'Five Sealed Solids',
      prompt: 'What kind of solid is each of X1 to X5?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        recorder: { at: { x: 147.4, y: 2.4 }, size: { w: 5, h: 3.4 } },
        pieces: cards5,
        fixtures: [tester.fixture],
        zones: { slots: [tester.slot], trays: trayRow([['metallic', 'Metallic'], ['ionic', 'Ionic'], ['network', 'Network'], ['molecular', 'Molecular'], ['amorphous', 'Amorphous (glass)']]) }
      }),
      hints: [
        'Read the hammer and conductivity records on each card, then heat the look-alike samples in the viewer.',
        'Two solids (X1 and X5) agree on the card records, so compare their melting traces.',
        'A trace that drops at one sharp temperature is crystalline; one that softens over a range is amorphous.'
      ],
      check: fileCheck(S5, recordSay, t => ['x1', 'x5'].map(id => t.pieces[id]).find(p => !p.props.melt)),
      reward: {
        log: 'X1 (window glass) matched the ionic solid in every test except its melt trace.',
        title: 'The Whole Record',
        body: 'X1 (window glass) and X5 (ionic) both shattered and conducted only when molten. Their melting traces told them apart: X1 softened over a range, proving it is amorphous.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const tester = solidTestFixture('tester', TESTER_AT, { tests: ['melt', 'strike'], view: 'trace', w: 66, maxT: 500, title: 'Polymer Tester' });
    const polySay = (card, tray) => `${cap(card.label)} melted at ${meltText(card.props.melt)} and ${card.props.strike} under the hammer, which does not match "${tray}".`;
    return {
      id: 's6-polymers',
      title: 'Long Chains and Cross-Links',
      briefing: {
        speaker: SPEAKER,
        body: 'A polymer is made of long chain-like molecules. Heat and strike all three samples in the tester to compare how they soften and break.'
      },
      prompt: 'Which solids are held only by dispersion between molecules or chains, and which by covalent cross-links?',
      widget,
      table: benchTable(S6, tester, [['chains', 'Dispersion (molecules/chains)'], ['crosslink', 'Covalent cross-links']]),
      hints: [
        'Heat and strike each sample in the tester, then sort them into trays.',
        'Compare the softening temperature of polyethylene with naphthalene and with the cross-linked resin.',
        'Unlinked chains soften over a low range and flatten; covalent cross-links keep the solid rigid and brittle.'
      ],
      check: fileCheck(S6, polySay, t => S6.map(s => t.pieces[s.id]).find(p => !p.props.melt && !p.props.strike)),
      reward: {
        log: 'Long chains softened over a range above naphthalene; cross-linked resin stayed rigid.',
        title: 'Polymers and Cross-Linking',
        body: 'Polyethylene softens higher than small naphthalene molecules because longer chains have stronger dispersion forces. Covalent cross-links lock chains together so the resin stays rigid until high heat.'
      }
    };
  })()
];


/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Molecular solids melt at low temperatures because only weak attractions between molecules give way. Crystalline solids have repeating patterns and melt at one sharp temperature, whereas amorphous solids like glass have no repeating pattern and soften over a range.'
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

export const SOLUTIONS = [
  fileAll(S1, [1, 2]),
  [put('differ', 'slot:guess')],
  fileAll(S3),
  fileAll(S4, [1, 2, 3]),
  fileAll(S5),
  fileAll(S6, [1, 2])
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  fileAll(S1, [1, 2], { gallium: 'grips' }),
  [],
  fileAll(S3, [null], { silica: 'one' }),
  fileAll(S4, [1, 2, 3], { x1: 'ionic', x4: 'network' }),
  fileAll(S5, [null], { x1: 'ionic', x5: 'amorphous' }),
  fileAll(S6, [1, 2], { polyethylene: 'crosslink' })
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
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { S1, S3, S4, S5, S6, SOLIDS };
