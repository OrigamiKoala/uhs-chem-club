/**
 * Unit 9 · Bench 1 — The Handover (q1-handover)
 *
 * Verdigris's first bench, on the ph kit (`table/kits/ph.js`: the pour window in `ph-pour.js`, the ratio rig in `ph-rig.js`). Eight stages and
 * ONE click: the belief that a base is something with OH in it (so ammonia cannot be a base) and that an acid just "breaks up".
 *
 *   1  pour HCl into water, mark its hydrogens, and say which particle holds them afterwards            -> Brønsted–Lowry acid, hydronium
 *   2  PREDICT: what will ammonia, which has no OH in it, do in water?
 *   3  pour ammonia, mark the water's hydrogens, and say whether ammonia acted as an acid or a base      -> Brønsted–Lowry base
 *   4  pair four acids with what is left of each after it hands a proton over                            -> conjugate acid–base pair
 *   5  two pours (nitric acid, ammonia): find the substance that acted as an acid in one and a base in the other -> amphoteric
 *   6  the ratio rig on three waters: the two ion concentrations multiply to one number                  -> autoionization, Kw
 *   7  BF₃ and NH₃ (beyond the exam): a proton moved, an electron pair moved, or nothing                 -> Lewis acid and base
 *   8  sealed: pair up the species of three reactions
 *
 * THE WRONG MODEL IS ON THE TABLE: in stage 3 the white hydrogens of the water end up on the ammonia, which has no OH to give. The number of
 * cells that change in a window is the planner's (`engine/phdata.js` through `ph-read.js` `windowOf`); pairs are checked from the formulas
 * (`formulaStats`, `isConjugate`). This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  phTable, selectorFixture, note, pieceIn, dialValue, pourFixture, pourRead, formulaChip, rigParts, tile, rigRead, steady, readingsText,
  transferParts, transferRead, H_INK, OH_INK, ACID_INK, BASE_INK
} from '../../table/kits/ph.js';
import { sci, fmt, waterIons, waterKw, formulaStats, isConjugate, KW25 } from '../../engine/phdata.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bBr[øo]nsted.Lowry acids?\b/i, introducedAt: 1 },
  { term: /\bhydronium\b/i, introducedAt: 1 },
  { term: /\bBr[øo]nsted.Lowry bases?\b/i, introducedAt: 3 },
  { term: /\bconjugate\b/i, introducedAt: 4 },
  { term: /\bamphoteric\b/i, introducedAt: 5 },
  { term: /\bautoionization\b/i, introducedAt: 6 },
  { term: /\bKw\b/, introducedAt: 6 },
  { term: /\bLewis\b/i, introducedAt: 7 }
];

/** Nothing earlier on the track: this is the first bench of Verdigris. */
export const BUILDS_ON = [];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q1-handover';
const GUESS = {
  nothing: 'Nothing: it has no OH to give',
  release: 'Break apart and release OH⁻',
  take: 'Accept a proton from water, leaving OH⁻',
  give: 'Donate a proton to water',
  stay: 'Dissolve and stay as it is'
};
const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const charge = q => (q === 0 ? 'no charge' : `charge ${q > 0 ? '+' : '−'}${Math.abs(q)}`);
const howMany = n => `${n} hydrogen${n === 1 ? '' : 's'}`;
const describe = f => { const s = formulaStats(f); return `${f} has ${howMany(s.h)} and ${charge(s.charge)}`; };

/* ---------------------------------------------------------------- what each stage's windows hold (inputs only) */

const WATER = '#7d8b97';
/** The proton bench of stages 1 and 3: two particles, each carrying one proton it could give. `goal` is where the planner says one goes. */
const BENCH_HCL = { goal: { from: 'hcl', to: 'h2o' }, mols: [
  { key: 'hcl', label: 'HCl', ink: ACID_INK, ink2: BASE_INK, hs: 1, gives: true, lost: 'Cl⁻', gained: 'H₂Cl⁺' },
  { key: 'h2o', label: 'H₂O', ink: WATER, ink2: H_INK, hs: 2, gives: true, lost: 'OH⁻', gained: 'H₃O⁺' }] };
const BENCH_NH3 = { goal: { from: 'h2o', to: 'nh3' }, mols: [
  { key: 'nh3', label: 'NH₃', ink: BASE_INK, ink2: ACID_INK, hs: 3, gives: true, lost: 'NH₂⁻', gained: 'NH₄⁺' },
  { key: 'h2o', label: 'H₂O', ink: WATER, ink2: OH_INK, hs: 2, gives: true, lost: 'OH⁻', gained: 'H₃O⁺' }] };
const bench = spec => transferParts('bench', { x: 146, y: 38 }, spec);
/** What a move on the bench was: null before one, else { right, from, to, many }. */
const benchMove = (state, goal) => {
  const r = transferRead(state.table, 'bench');
  return { r, from: r.moves[0]?.from, to: r.moves[0]?.to, many: r.moves.length > 1, none: !r.moved, right: r.right };
};

const HCL = { id: 'hcl', c: 0.10 };
const HNO3 = { id: 'hno3', c: 0.10 };
const NH3 = { id: 'nh3', c: 0.00010 };

const S1_CARDS = ['HCl', 'Cl⁻', 'H₂O', 'H₃O⁺', 'OH⁻'];
const S4_ACIDS = ['HNO₃', 'H₂O', 'NH₄⁺', 'HCN'];
const S4_LEFT = ['NH₃', 'H₃O⁺', 'CN⁻', 'OH⁻', 'NO₃⁻', 'NH₂⁻'];
const S5_CARDS = ['HNO₃', 'NH₃', 'H₂O', 'NO₃⁻', 'NH₄⁺'];
/** The three waters of stage 6: pure, with a little strong acid, with a little strong base (mol/L added). */
const WATERS = [
  { title: 'Pure water', spec: {} },
  { title: 'Acid added', spec: { acid: 1e-3 } },
  { title: 'Base added', spec: { base: 1e-2 } }
];
const slugOf = f => f.replace(/[^A-Za-z0-9]/g, m => `u${m.charCodeAt(0)}`);

/* ---------------------------------------------------------------- stage helpers */

const hole = (ids, side) => ids.map(id => `slot:${id}`).includes(side);

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-hcl',
    title: 'Where the Hydrogen Goes',
    briefing: {
      speaker: 'Vess',
      body: 'A hydrogen atom without its electron is a single proton, written H⁺. Watch the white hydrogen when the HCl is poured.'
    },
    prompt: 'Which particle holds the proton after HCl is poured into water?',
    widget,
    // The graded answer is where the proton is carried on the bench, not a card: the window shows the pour, the bench is the answer.
    table: (() => {
      const w = pourFixture('win', { x: 54, y: 38 }, { scene: 'acid', solute: HCL, label: 'Particle window', mark: 'solute' });
      const b = bench(BENCH_HCL);
      return phTable({
        pieces: b.pieces,
        fixtures: [w, b.fixture],
        zones: { slots: b.slots }
      }, { w: 184, h: 76 });
    })(),
    hints: [
      'Press "Pour" and watch the white hydrogen, then carry a proton on the proton bench.',
      'Look at which particle holds the white hydrogen after the pour.',
      'Ask which particle in the window gained the white hydrogen.'
    ],
    check(state) {
      const m = benchMove(state);
      if (m.none) return { ok: false, notYet: true, msg: 'Carry a proton to a seat.' };
      if (m.many) return { ok: false, msg: 'One proton moves in this pour; put the other back.' };
      if (m.right) return { ok: true };
      const n = pourRead(state.table, 'win').moved;
      if (m.from === m.to) return { ok: false, msg: 'A particle cannot take its own proton.' };
      return { ok: false, msg: `In the window the white hydrogens leave the chlorine in ${n} of 8 cells; the proton you moved is on the wrong particle and comes straight back.` };
    },
    reward: {
      log: 'Each HCl donated a proton to a water molecule.',
      title: 'Handing Over a Proton',
      body: 'Each HCl donated (passed) a proton to a water molecule, making hydronium, H₃O⁺, and leaving Cl⁻. A substance that donates a proton is a Brønsted–Lowry acid.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Ammonia in Water',
    predict: true,
    prompt: 'Which best describes what ammonia, NH₃, will do when it is poured into water?',
    widget,
    table: phTable({
      pieces: [
        note('nothing', GUESS.nothing, { x: 30, y: 9 }),
        note('release', GUESS.release, { x: 80, y: 9 }),
        note('take', GUESS.take, { x: 30, y: 28 }),
        note('give', GUESS.give, { x: 80, y: 28 }),
        note('stay', GUESS.stay, { x: 30, y: 47 })
      ],
      // The lead-in: hydrochloric acid handing a proton to water, on a loop, with no control. It is the case of stage 1, not the one asked about.
      fixtures: [pourFixture('clip', { x: 92, y: 88 }, { scene: 'acid', solute: HCL, label: 'Hydrochloric acid in water', w: 100, window: 14, loop: true })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 28 }, size: { w: 36, h: 14 } }] }
    }, { h: 112 }),
    leadIn: true,
    hints: [
      'Place one of the five prediction cards in the slot.',
      'Ask whether ammonia can only donate a proton, or whether water could donate one to it.',
      'Ask what particles could be left in the water if ammonia changed it.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Next, ammonia is poured into water and its atoms are followed.' }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-nh3',
    title: 'Ammonia Acts',
    get prompt() { return guessLine('Which particle accepts a proton when ammonia is poured into water?', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const w = pourFixture('win', { x: 54, y: 38 }, { scene: 'base', solute: NH3, label: 'Particle window', mark: 'water' });
      const b = bench(BENCH_NH3);
      return phTable({
        pieces: b.pieces,
        fixtures: [w, b.fixture],
        zones: { slots: b.slots }
      }, { w: 184, h: 76 });
    })(),
    hints: [
      'Press "Pour" and watch the white hydrogens, then carry a proton on the proton bench.',
      'Follow the white hydrogens of the water and see which particle holds them afterwards.',
      'Count the hydrogens on ammonia before and after the pour to see which way the proton moved.'
    ],
    check(state) {
      const m = benchMove(state);
      if (m.none) return { ok: false, notYet: true, msg: 'Carry a proton to a seat.' };
      if (m.many) return { ok: false, msg: 'One proton moves in this pour; put the other back.' };
      if (m.right) return { ok: true };
      const n = pourRead(state.table, 'win').moved;
      if (m.from === m.to) return { ok: false, msg: 'A particle cannot take its own proton.' };
      return { ok: false, msg: `In the window, ${n} of 8 ammonia particles changed, and each went from three hydrogens to four; the proton you moved comes straight back.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = g === 'take' ? 'The prediction held: ' : g ? 'Not what you predicted: ' : '';
      return {
        log: 'Ammonia accepted a proton from water.',
        title: 'A Base Accepts a Proton',
        body: `${verdict}${verdict ? 'water' : 'Water'} donated a proton to ammonia, making NH₄⁺ and leaving OH⁻. A substance that accepts a proton is a Brønsted–Lowry base.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-pairs',
    title: 'What Is Left',
    briefing: {
      speaker: 'Vess',
      body: 'What is left of an acid after it donates a proton is its conjugate base. The two differ by one proton.'
    },
    prompt: 'What is the conjugate base of each acid?',
    widget,
    table: (() => {
      const slots = S4_ACIDS.map((a, i) => ({ id: `p${i}`, label: ' ', at: { x: 68, y: 12 + i * 18 }, size: { w: 22, h: 11 } }));
      return phTable({
        pieces: [
          ...S4_ACIDS.map((a, i) => formulaChip(`a-${i}`, a, { x: 28, y: 12 + i * 18 }, { fixed: true })),
          ...S4_LEFT.map((f, i) => formulaChip(`l-${slugOf(f)}`, f, { x: 112 + (i % 2) * 26, y: 12 + Math.floor(i / 2) * 20 }))
        ],
        zones: { slots }
      }, { w: 152, h: 78 });
    })(),
    hints: [
      'Drag a formula card from the right into the slot beside each acid.',
      'Compare the hydrogens and charge of each acid with each formula card.',
      'A conjugate base is the acid after one H⁺ has left.'
    ],
    check(state) {
      const bad = [];
      let empty = 0;
      S4_ACIDS.forEach((a, i) => {
        const c = pieceIn(state.table, `p${i}`);
        if (!c) { empty++; return; }
        if (!isConjugate(a, c.label)) bad.push(`${describe(c.label)}, beside ${describe(a)}.`);
      });
      if (empty === S4_ACIDS.length) return { ok: false, notYet: true, msg: 'Lay a formula card beside an acid.' };
      if (bad.length) return { ok: false, msg: bad[0] };
      if (empty) return { ok: false, notYet: true, msg: 'Pair every acid.' };
      return { ok: true };
    },
    reward: {
      log: 'Each acid and what it leaves behind form a pair.',
      title: 'Conjugate Pairs',
      body: 'An acid and the particle left when it donates a proton are a conjugate acid–base pair. Each pair differs by one proton.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-both',
    title: 'Two Ways Round',
    prompt: 'Which substance acts as an acid in one window and as a base in the other?',
    widget,
    table: (() => {
      const a = pourFixture('winA', { x: 46, y: 32 }, { scene: 'acid', solute: HNO3, label: 'Nitric acid', w: 88, window: 28, mark: 'water' });
      const b = pourFixture('winB', { x: 138, y: 32 }, { scene: 'base', solute: NH3, label: 'Ammonia', w: 88, window: 28, mark: 'water' });
      return phTable({
        pieces: S5_CARDS.map((f, i) => formulaChip(`c-${slugOf(f)}`, f, { x: 20 + i * 26, y: 74 })),
        fixtures: [a, b],
        zones: { slots: [{ id: 'both', label: 'Acts both ways', at: { x: 160, y: 74 }, size: { w: 30, h: 12 } }] }
      }, { w: 184, h: 86 });
    })(),
    hints: [
      'Press "Pour" on both windows, then drag a formula card into the slot.',
      'The water hydrogens are marked white: follow them in each window.',
      'Check which substance gained a proton in one window and lost one in the other.'
    ],
    check(state) {
      const c = pieceIn(state.table, 'both');
      if (!c) return { ok: false, notYet: true, msg: 'Lay a formula card in the slot.' };
      if (c.label === 'H₂O') return { ok: true };
      const msg = {
        'HNO₃': 'HNO₃ is in the first window only, and there it lost its hydrogen.',
        'NH₃': 'NH₃ is in the second window only, and there it gained a hydrogen.',
        'NO₃⁻': 'NO₃⁻ appears in the first window only, after the pour.',
        'NH₄⁺': 'NH₄⁺ appears in the second window only, after the pour.'
      }[c.label];
      return { ok: false, msg };
    },
    reward: {
      log: 'Water donated a proton in one window and accepted one in the other.',
      title: 'Amphoteric',
      body: 'Water accepted a proton from nitric acid and donated a proton to ammonia. A substance that can act as an acid or a base is amphoteric.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-kw',
    title: 'Ions in Pure Water',
    briefing: {
      speaker: 'Vess',
      body: 'Pure water holds a little H₃O⁺ and OH⁻ from autoionization, when one water molecule donates a proton to another. The board compares pure water with acid and base added, showing their concentrations (moles per litre).'
    },
    prompt: 'Which combination of the two concentrations is the same for all three waters?',
    widget,
    table: (() => {
      const rig = rigParts('rig', { x: 86, y: 32 }, {
        cols: WATERS.map(w => { const v = waterIons(w.spec); return { values: { H: v.h, OH: v.oh }, title: w.title, lines: [`H₃O⁺ ${sci(v.h, 2)}`, `OH⁻ ${sci(v.oh, 2)}`] }; }),
        top: 2, bottom: 2, pitch: 40, h: 34
      });
      return phTable({
        pieces: [tile('t-H', 'H', 'H₃O⁺', { x: 180, y: 14 }), tile('t-OH', 'OH', 'OH⁻', { x: 180, y: 36 })],
        fixtures: [rig.fixture],
        zones: { slots: rig.slots }
      }, { w: 196, h: 54 });
    })(),
    hints: [
      'Drag the two cards into the slots above and below the line on the expression board.',
      'Compare the three numbers the expression board prints for each arrangement you try.',
      'Look for an arrangement where the rise in one concentration cancels the fall in the other.'
    ],
    check(state) {
      const r = rigRead(state.table, 'rig');
      if (!r.laid) return { ok: false, notYet: true, msg: 'Lay a card on the board.' };
      if (steady(r.readings) && Math.abs(r.readings[0] - 1) > 0.02) return { ok: true };
      return { ok: false, msg: `The board reads ${readingsText(r.readings)} on the three columns.` };
    },
    get reward() {
      const v = waterIons({});
      return {
        log: 'H₃O⁺ times OH⁻ came to one number in every water.',
        title: 'Autoionization and Kw',
        body: `[H₃O⁺] × [OH⁻] is ${sci(KW25, 2)} in every water at 25 °C. That constant is Kw, and in pure water each ion is ${sci(v.h, 2)} mol/L.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-lewis',
    title: 'Without a Proton',
    briefing: {
      speaker: 'Vess',
      body: 'Not every acid–base reaction moves a proton. The Mark dial lets you follow either the hydrogens or the lone pairs (unshared electron pairs).'
    },
    prompt: 'What moves when boron trifluoride, BF₃, meets ammonia?',
    widget,
    table: (() => {
      const w = pourFixture('win', { x: 54, y: 38 }, { scene: 'lewis', label: 'Particle window' });
      return phTable({
        fixtures: [w, selectorFixture('verdict', 'What moved', { x: 144, y: 38 }, { options: ['A proton', 'An electron pair', 'Nothing', ' '], start: 4, w: 64 })]
      }, { w: 182, h: 76 });
    })(),
    hints: [
      'Set the "Mark" dial, press "Pour", then set the "What moved" dial.',
      'Mark the hydrogens of NH₃, then the lone pairs, and compare the windows before and after.',
      'Follow each mark and see which one ends up between the two molecules.'
    ],
    check(state) {
      const v = dialValue(state.table, 'verdict');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      if (v === 1) return { ok: false, msg: 'In the window every hydrogen of NH₃ is still on the nitrogen after the pour.' };
      return { ok: false, msg: `In the window all ${pourRead(state.table, 'win').moved} of 8 cells changed: each BF₃ is now joined to an NH₃.` };
    },
    reward: {
      log: 'BF₃ accepted a lone pair from NH₃; no proton moved.',
      title: 'Lewis Acid and Base',
      body: 'Nitrogen shared its lone pair with boron, and no proton moved. A substance that accepts an electron pair is a Lewis acid; one that donates it is a Lewis base.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'The Handover',
  body: 'An acid donates a proton to a base. Water can be either, and every acid leaves a conjugate base behind.'
};

const slotT = i => `slot:rig.t${i}`;
const slotB = i => `slot:rig.b${i}`;
const sl = id => `slot:${id}`;
const chip = f => `c-${slugOf(f)}`;

export const SOLUTIONS = [
  [{ run: 'win' }, put('bench.h.hcl', sl('bench.take.h2o'))],
  [put('take', sl('guess'))],
  [{ run: 'win' }, put('bench.h.h2o', sl('bench.take.nh3'))],
  [put('l-' + slugOf('NO₃⁻'), sl('p0')), put('l-' + slugOf('OH⁻'), sl('p1')), put('l-' + slugOf('NH₃'), sl('p2')), put('l-' + slugOf('CN⁻'), sl('p3'))],
  [{ run: 'winA' }, { run: 'winB' }, put(chip('H₂O'), sl('both'))],
  [put('t-H', slotT(1)), put('t-OH', slotT(2))],
  [dial('win', 'mark', 3), { run: 'win' }, dial('verdict', 'value', 2)]
];

export const MISSES = [
  [put('bench.h.h2o', sl('bench.take.hcl'))],
  [],
  [put('bench.h.nh3', sl('bench.take.h2o'))],
  [put('l-' + slugOf('H₃O⁺'), sl('p1'))],
  [put(chip('NH₃'), sl('both'))],
  [put('t-H', slotT(1))],
  [dial('verdict', 'value', 1)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { S4_ACIDS, S4_LEFT, S5_CARDS, WATERS, GUESS, NH3, HCL, HNO3, hole, fmt, waterKw };
