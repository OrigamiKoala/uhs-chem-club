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
  phTable, selectorFixture, note, pieceIn, dialValue, pourFixture, pourRead, formulaChip, rigParts, tile, rigRead, steady, readingsText
} from '../../table/kits/ph.js';
import { sci, fmt, waterIons, waterKw, formulaStats, isConjugate, KW25 } from '../../engine/phdata.js';

export const meta = { stageCount: 8 };

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
  take: 'Take a hydrogen from water, leaving OH⁻',
  give: 'Give a hydrogen to water',
  stay: 'Dissolve and stay as it is'
};
const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });
const charge = q => (q === 0 ? 'no charge' : `charge ${q > 0 ? '+' : '−'}${Math.abs(q)}`);
const howMany = n => `${n} hydrogen${n === 1 ? '' : 's'}`;
const describe = f => { const s = formulaStats(f); return `${f} has ${howMany(s.h)} and ${charge(s.charge)}`; };

/* ---------------------------------------------------------------- what each stage's windows hold (inputs only) */

const HCL = { id: 'hcl', c: 0.10 };
const HNO3 = { id: 'hno3', c: 0.10 };
const NH3 = { id: 'nh3', c: 0.00010 };

const S1_CARDS = ['HCl', 'Cl⁻', 'H₂O', 'H₃O⁺', 'OH⁻'];
const S4_ACIDS = ['HNO₃', 'H₂O', 'NH₄⁺', 'HCN'];
const S4_LEFT = ['NH₃', 'H₃O⁺', 'CN⁻', 'OH⁻', 'NO₃⁻', 'NH₂⁻'];
const S5_CARDS = ['HNO₃', 'NH₃', 'H₂O', 'NO₃⁻', 'NH₄⁺'];
const S8_REACTIONS = [
  { eq: ['H₂SO₄', 'H₂O', 'HSO₄⁻', 'H₃O⁺'] },
  { eq: ['CH₃COOH', 'NH₃', 'CH₃COO⁻', 'NH₄⁺'] },
  { eq: ['HCO₃⁻', 'OH⁻', 'CO₃²⁻', 'H₂O'] }
];
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
    prompt: 'Find which particle holds the hydrogen that began on each HCl once the acid is poured into water.',
    widget,
    table: (() => {
      const w = pourFixture('win', { x: 54, y: 38 }, { scene: 'acid', solute: HCL, label: 'Pour window' });
      return phTable({
        pieces: S1_CARDS.map((f, i) => formulaChip(`c-${slugOf(f)}`, f, { x: 128 + (i % 2) * 24, y: 12 + Math.floor(i / 2) * 20 })),
        fixtures: [w],
        zones: { slots: [{ id: 'holds', label: 'Holds it afterwards', at: { x: 140, y: 64 }, size: { w: 30, h: 12 } }] }
      }, { w: 164, h: 76 });
    })(),
    hints: [
      'Set the "Mark" dial, press "Pour", then drag a chip into the slot.',
      'Follow the white hydrogens in the window before the pour and after it.',
      'Count the hydrogens on the particle that holds a white one afterwards, and compare it with the chips.'
    ],
    check(state) {
      const c = pieceIn(state.table, 'holds');
      if (!c) return { ok: false, notYet: true, msg: 'Lay a chip in the slot.' };
      if (c.label === 'H₃O⁺') return { ok: true };
      const n = pourRead(state.table, 'win').moved;
      const msg = {
        'HCl': `After the pour the white hydrogens are no longer on the chlorine: ${n} of 8 cells changed.`,
        'Cl⁻': 'No chlorine particle in the window carries a white hydrogen after the pour.',
        'H₂O': 'The particles that hold a white hydrogen after the pour have three hydrogens, and a water molecule has two.',
        'OH⁻': 'The particles that hold a white hydrogen after the pour have three hydrogens, and OH⁻ has one.'
      }[c.label];
      return { ok: false, msg: msg || 'That chip does not match the window.' };
    },
    reward: {
      log: 'Each HCl handed its hydrogen to a water molecule.',
      title: 'Handing Over a Proton',
      body: 'Each HCl handed its hydrogen, as a proton (H⁺, a hydrogen with no electron), to a water molecule, making hydronium, H₃O⁺, and leaving Cl⁻. An acid that hands a proton over is a Brønsted–Lowry acid.'
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
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 28 }, size: { w: 36, h: 14 } }] }
    }, { h: 62 }),
    hints: [
      'Use the five cards and the slot.',
      'Look at the formula NH₃ and ask what it has that water can use.',
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
    get prompt() { return guessLine('Say whether ammonia acted as an acid or as a base.', recall(QUEST_KEY)); },
    widget,
    table: (() => {
      const w = pourFixture('win', { x: 54, y: 38 }, { scene: 'base', solute: NH3, label: 'Pour window' });
      return phTable({
        fixtures: [w, selectorFixture('verdict', 'Ammonia acted as', { x: 138, y: 38 }, { options: ['An acid', 'A base', 'Neither', ' '], start: 4, w: 60 })]
      }, { w: 176, h: 76 });
    })(),
    hints: [
      'Set the "Mark" dial, press "Pour", then set the answer dial.',
      'Follow the white hydrogens of the water and see which particles hold them afterwards.',
      'Compare the number of hydrogens on each ammonia particle before and after, and ask what the water lost.'
    ],
    check(state) {
      const v = dialValue(state.table, 'verdict');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      const n = pourRead(state.table, 'win').moved;
      return { ok: false, msg: `In the window, ${n} of 8 ammonia particles changed, and each went from three hydrogens to four.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = g === 'take' ? 'The prediction held: ' : g ? 'Not what you predicted: ' : '';
      return {
        log: 'Ammonia took a proton from water.',
        title: 'A Base Takes a Proton',
        body: `${verdict}ammonia took a proton from water, becoming NH₄⁺ and leaving OH⁻, with no OH in the ammonia itself. A substance that takes a proton is a Brønsted–Lowry base.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-pairs',
    title: 'What Is Left',
    prompt: 'Pair each acid with the particle that is left of it after it hands a proton over.',
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
      'Drag a chip from the right into the place beside each acid.',
      'Compare the formula of each acid with the formula of the chip: hydrogens and charge.',
      'The particle left behind is the acid without the proton it handed over.'
    ],
    check(state) {
      const bad = [];
      let empty = 0;
      S4_ACIDS.forEach((a, i) => {
        const c = pieceIn(state.table, `p${i}`);
        if (!c) { empty++; return; }
        if (!isConjugate(a, c.label)) bad.push(`${describe(c.label)}, beside ${describe(a)}.`);
      });
      if (empty === S4_ACIDS.length) return { ok: false, notYet: true, msg: 'Lay a chip beside an acid.' };
      if (bad.length) return { ok: false, msg: bad[0] };
      if (empty) return { ok: false, notYet: true, msg: 'Pair every acid.' };
      return { ok: true };
    },
    reward: {
      log: 'Each acid and what it leaves behind form a pair.',
      title: 'Conjugate Pairs',
      body: 'An acid and the particle left when it hands over a proton are a conjugate acid–base pair: HNO₃ and NO₃⁻, H₂O and OH⁻, NH₄⁺ and NH₃, HCN and CN⁻. The two differ by exactly one proton.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-both',
    title: 'Two Ways Round',
    prompt: 'Find the substance that acts as an acid in one window and as a base in the other.',
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
      'Press "Pour" on both windows, then drag a chip into the slot.',
      'The water hydrogens are already marked white: follow them in each window.',
      'Ask which substance is in both windows, and what it gained in one and lost in the other.'
    ],
    check(state) {
      const c = pieceIn(state.table, 'both');
      if (!c) return { ok: false, notYet: true, msg: 'Lay a chip in the slot.' };
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
      log: 'Water gave a proton in one window and took one in the other.',
      title: 'Amphoteric',
      body: 'Water took a proton from the nitric acid and gave a proton to the ammonia. A substance that can act as an acid or as a base, depending on its partner, is amphoteric.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-kw',
    title: 'Ions in Pure Water',
    prompt: 'Arrange tiles on the rig into a ratio that reads the same number for all three waters.',
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
      'Drag the two tiles into the places above and below the line.',
      'Compare the three numbers the rig prints for each arrangement you try.',
      'Try each tile alone, then both on one side of the line, then one on each side.'
    ],
    check(state) {
      const r = rigRead(state.table, 'rig');
      if (!r.laid) return { ok: false, notYet: true, msg: 'Lay a tile on the rig.' };
      if (steady(r.readings) && Math.abs(r.readings[0] - 1) > 0.02) return { ok: true };
      return { ok: false, msg: `The rig reads ${readingsText(r.readings)} on the three columns.` };
    },
    get reward() {
      const v = waterIons({});
      return {
        log: 'H₃O⁺ times OH⁻ came to one number in every water.',
        title: 'Autoionization and Kw',
        body: `Pure water holds H₃O⁺ and OH⁻ at ${sci(v.h, 2)} mol/L each, made by 2 H₂O ⇌ H₃O⁺ + OH⁻. This is autoionization. The two concentrations multiply to ${sci(KW25, 2)} in every water at 25 °C, and that number is Kw.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-lewis',
    title: 'Without a Proton',
    prompt: 'Find what moves when boron trifluoride, BF₃, meets ammonia, a case beyond the exam.',
    widget,
    table: (() => {
      const w = pourFixture('win', { x: 54, y: 38 }, { scene: 'lewis', label: 'Pour window (beyond the exam)' });
      return phTable({
        fixtures: [w, selectorFixture('verdict', 'What moved', { x: 144, y: 38 }, { options: ['A proton', 'An electron pair', 'Nothing', ' '], start: 4, w: 64 })]
      }, { w: 182, h: 76 });
    })(),
    hints: [
      'Set the "Mark" dial, press "Pour", then set the answer dial.',
      'Mark the hydrogens of NH₃, then the lone pairs, and compare the windows before and after.',
      'Follow each mark and ask which one ends up on a different atom.'
    ],
    check(state) {
      const v = dialValue(state.table, 'verdict');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 2) return { ok: true };
      if (v === 1) return { ok: false, msg: 'In the window every hydrogen of NH₃ is still on the nitrogen after the pour.' };
      return { ok: false, msg: `In the window all ${pourRead(state.table, 'win').moved} of 8 cells changed: each BF₃ is now joined to an NH₃.` };
    },
    reward: {
      log: 'BF₃ took a lone pair from NH₃; no proton moved.',
      title: 'Lewis Acid and Base',
      body: 'The nitrogen shared its lone pair with the boron, and no proton moved. A substance that accepts an electron pair is a Lewis acid, and one that gives it is a Lewis base. This is beyond the exam.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-react',
    title: 'Pairs in Reactions',
    prompt: 'In each reaction, lay the two substances of each conjugate pair side by side.',
    widget,
    table: (() => {
      const slots = []; const pieces = [];
      S8_REACTIONS.forEach((r, i) => {
        const y = 12 + i * 20;
        // The chips of the equation stand in a shuffled order so the order of the equation is not the pairing.
        const order = [0, 2, 3, 1].map(k => r.eq[k]);
        order.forEach((f, k) => pieces.push(formulaChip(`r${i}-${slugOf(f)}`, f, { x: 12 + k * 20, y })));
        for (const [g, x0] of [['a', 102], ['b', 148]]) for (const k of [0, 1]) slots.push({ id: `r${i}${g}${k}`, label: ' ', at: { x: x0 + k * 22, y }, size: { w: 20, h: 10 } });
      });
      return phTable({ pieces, zones: { slots } }, { w: 184, h: 66 });
    })(),
    hints: [
      'Drag chips into the places on the right of each reaction.',
      'Compare the hydrogens and the charge of each chip with the others in its row.',
      'A pair is two chips that differ by one proton: find which chip each reactant becomes.'
    ],
    check(state) {
      const t = state.table;
      let empty = 0;
      for (let i = 0; i < S8_REACTIONS.length; i++) {
        const g = ['a', 'b'].map(x => [pieceIn(t, `r${i}${x}0`), pieceIn(t, `r${i}${x}1`)]);
        empty += g.flat().filter(c => !c).length;
        for (const [c1, c2] of g) {
          if (!c1 || !c2) continue;
          if (!isConjugate(c1.label, c2.label) && !isConjugate(c2.label, c1.label)) return { ok: false, msg: `Reaction ${i + 1}: ${describe(c1.label)}, and ${describe(c2.label)}.` };
        }
        if (!g.some(([c1, c2]) => !c1 || !c2)) {
          const four = new Set(g.flat().map(c => c.label));
          if (four.size < 4) return { ok: false, msg: `Reaction ${i + 1}: one substance is laid in two places.` };
        }
      }
      if (empty === S8_REACTIONS.length * 4) return { ok: false, notYet: true, msg: 'Lay chips beside a reaction.' };
      if (empty) return { ok: false, notYet: true, msg: 'Fill every place.' };
      return { ok: true };
    },
    reward: {
      log: 'Every reaction was two conjugate pairs.',
      title: 'Pairs in a Reaction',
      body: 'In each reaction an acid hands a proton to a base, and each of the two becomes its conjugate: the acid turns into a base and the base into an acid. The members of a pair differ by exactly one proton.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'The Handover',
  body: 'An acid hands a proton to a base. Water can be either, and every acid leaves a conjugate base behind.'
};

const slotT = i => `slot:rig.t${i}`;
const slotB = i => `slot:rig.b${i}`;
const sl = id => `slot:${id}`;
const chip = f => `c-${slugOf(f)}`;

export const SOLUTIONS = [
  [dial('win', 'mark', 2), { run: 'win' }, put(chip('H₃O⁺'), sl('holds'))],
  [put('take', sl('guess'))],
  [dial('win', 'mark', 3), { run: 'win' }, dial('verdict', 'value', 2)],
  [put('l-' + slugOf('NO₃⁻'), sl('p0')), put('l-' + slugOf('OH⁻'), sl('p1')), put('l-' + slugOf('NH₃'), sl('p2')), put('l-' + slugOf('CN⁻'), sl('p3'))],
  [{ run: 'winA' }, { run: 'winB' }, put(chip('H₂O'), sl('both'))],
  [put('t-H', slotT(1)), put('t-OH', slotT(2))],
  [dial('win', 'mark', 3), { run: 'win' }, dial('verdict', 'value', 2)],
  (() => {
    const out = [];
    S8_REACTIONS.forEach((r, i) => {
      const [acid, base, cb, ca] = r.eq;
      out.push(put(`r${i}-${slugOf(acid)}`, sl(`r${i}a0`)), put(`r${i}-${slugOf(cb)}`, sl(`r${i}a1`)), put(`r${i}-${slugOf(base)}`, sl(`r${i}b0`)), put(`r${i}-${slugOf(ca)}`, sl(`r${i}b1`)));
    });
    return out;
  })()
];

export const MISSES = [
  [put(chip('HCl'), sl('holds'))],
  [],
  [dial('verdict', 'value', 1)],
  [put('l-' + slugOf('H₃O⁺'), sl('p1'))],
  [put(chip('NH₃'), sl('both'))],
  [put('t-H', slotT(1))],
  [dial('verdict', 'value', 1)],
  [put(`r0-${slugOf('H₂SO₄')}`, sl('r0a0')), put(`r0-${slugOf('H₃O⁺')}`, sl('r0a1'))]
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

export const CHECKS = { S4_ACIDS, S4_LEFT, S5_CARDS, S8_REACTIONS, WATERS, GUESS, NH3, HCL, HNO3, hole, fmt, waterKw };
