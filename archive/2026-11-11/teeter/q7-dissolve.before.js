/**
 * Unit 8 · Bench 7 — Solubility Equilibria (q7-dissolve)
 *
 * Teeter's settling pond, on the pans kit (`table/kits/pans.js`) with the solubility beaker and the expression form
 * (`table/kits/pans-beaker.js`). Eight stages and ONE click: the belief that the salt with the smaller Ksp is always the less soluble.
 *
 *   1  add a salt until another scoop changes nothing     -> a limit: saturated; the solid and the water keep trading units
 *   2  write the equilibrium constant for a dissolving    -> Ksp, the solubility product (solid left out, powers from the equation)
 *   3  TYPED: moles of AgCl that dissolve per litre       -> molar solubility (past any dial; the picture is a nearby salt)
 *   4  PREDICT: AgCl or Ag2CrO4 holds more dissolved      -> the wrong model is on the table: "smaller Ksp, less soluble"
 *   5  TEST: read a beaker of each                        -> Ksp ranks solubility only between salts with the same ion ratio
 *   6  BaSO4 in water and in sulfate water                -> common-ion effect, precipitate
 *   7  three mixtures, Q against Ksp on a gauge           -> a precipitate forms only when Q is past Ksp
 *   8  AgCl and PbI2, the same added ion                  -> how far a solubility falls is not set by Ksp alone
 *
 * THE WRONG MODEL IS ON THE TABLE. Stage 4's plate prints both Ksp values and its first card says AgCl dissolves more. Stage 5's beakers
 * read the other way: Ag2CrO4 (Ksp 1.1e-12) holds 6.5e-5 mol/L, AgCl (Ksp 1.8e-10) holds 1.3e-5.
 *
 * Every figure comes from `engine/eqdata.js` (`KSP`, `molarSolubility`, `dissolveState`, `settleMixture`). Ksp values are at 25 °C. Ideal
 * solution: concentrations stand for activities, no ion pairs, the volume does not change. pH and solubility (CED 8.11) is Verdigris's.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { KSP, molarSolubility, dissolveState, solubilityWithCommon } from '../../engine/eqdata.js';
import { pansTable, selectorFixture, plaqueFixture, note, pieceIn, dialValue } from '../../table/kits/pans.js';
import { beakerFixture, kspFormFixture, beakerRead, formExpression, formSpecies, sci, ionText, SCOOP } from '../../table/kits/pans-beaker.js';

import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickable, pickColumns } from '../../table/kits/pans-choice.js';
export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bsaturated\b/i, introducedAt: 1 },
  { term: /\bKsp\b|\bsolubility product\b/i, introducedAt: 2 },
  { term: /\bmolar solubility\b/i, introducedAt: 3 },
  { term: /\bcommon.ion\b/i, introducedAt: 6 },
  { term: /\bprecipitate\b/i, introducedAt: 6 }
];

/** Bench 1 (settled, both ways) is built; `unit08/q2-k` and `unit08/q3-q` (K, Q against K) are what the Ksp and the gauge lean on. */
export const BUILDS_ON = ['unit08/q1-both'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q7-dissolve';

/* ------------------------------------------------------------------ the figures, all from the planners */

const ions = key => KSP[key].ions;
const ksp = key => KSP[key].ksp;
const s0 = key => molarSolubility(ksp(key), ions(key));
const name = key => KSP[key].formula;

const GUESS = {
  agcl: 'AgCl dissolves more',
  ag2: 'Ag₂CrO₄ dissolves more',
  same: 'They dissolve the same amount'
};

// Stage 1, 2 and 3: the salts and how much of each is in its beaker (dissolved or not).
const S1_SALT = 'CaF2';
const S2_SALT = 'Ag2CrO4';
const S3_PICTURE = 'BaSO4';
const S3_ASK = 'AgCl';
const S3_TOL = 0.05;
// Stage 5: both beakers hold the same 1.5e-4 mol/L of salt, and the dots in both are drawn against the larger solubility.
const S5_TOTAL = 1.5e-4;
// Stage 6: BaSO4 in water and in 0.10 mol/L sodium sulfate.
const S6_TOTAL = 3 * s0('BaSO4');
const S6_SULFATE = 0.10;
// Stage 7: three mixtures of Pb²⁺ and I⁻ after mixing, mol/L.
const S7_MIX = [
  { cat: 5.0e-3, an: 1.0e-3 },
  { cat: 2.0e-3, an: 4.0e-3 },
  { cat: 1.0e-3, an: 3.0e-3 }
];
// Stage 8: the added ion, mol/L, and the salt already in each beaker.
const S8_ADDED = 0.10;
const S8 = { AgCl: { total: 5e-5, ion: 'anion' }, PbI2: { total: 4e-3, ion: 'anion' } };
const S8_LIST = [0, 0.01, S8_ADDED];
const S8_LABELS = ['none', '0.01 mol/L', '0.10 mol/L'];

/** What a stage's beaker reads, from the planner and the stage's own declaration (the check never reads a drawn figure). */
const read = (salt, total, cat0 = 0, an0 = 0) => dissolveState(ksp(salt), ions(salt), total, cat0, an0);

/** A typed figure, read as a decimal with a true minus accepted. */
function typed(table, id) {
  const raw = String(table.entries?.[id] ?? '').trim().replace(/−/g, '-').replace(',', '.');
  return { raw, v: raw === '' ? NaN : Number(raw) };
}

/* ------------------------------------------------------------------ the stages */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-limit',
    title: 'Adding Solid',
    prompt: 'Add CaF₂ until another scoop no longer changes either meter.',
    widget,
    table: pansTable({
      fixtures: [beakerFixture('jar', { x: 75, y: 27 }, { salt: S1_SALT, scoops: true, title: 'CaF₂ in water' })]
    }),
    hints: [
      'Use the "Add solid" key on the beaker.',
      'Watch what the two meters do with each scoop, and what collects on the floor.',
      'Keep adding until one scoop leaves both meters exactly where they were.'
    ],
    check(state) {
      const r = beakerRead(state.table, 'jar');
      if (r.n === 0) return { ok: false, notYet: true, msg: 'The beaker has no solid in it yet.' };
      const prev = read(S1_SALT, (r.n - 1) * SCOOP * r.s0);
      if (r.n >= 2 && r.dissolved > 0 && prev.dissolved === r.dissolved) return { ok: true };
      return { ok: false, msg: `The last scoop moved [${ionText(r.S.cation)}] from ${sci(prev.cat)} to ${sci(r.cat)} mol/L.` };
    },
    reward: {
      log: 'The meters stopped rising once solid stayed on the floor.',
      title: 'Saturated',
      body: 'After a few scoops the water took no more CaF₂: the meters held still and the extra solid lay on the floor. Water holding as much dissolved solid as it can is saturated, and the solid and the water still trade units both ways.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-expression',
    title: 'Writing the Expression',
    prompt: 'Write the equilibrium constant expression for Ag₂CrO₄ dissolving in water.',
    widget,
    table: pansTable({
      fixtures: [
        beakerFixture('jar', { x: 40, y: 27 }, { salt: S2_SALT, total: 2.5 * s0(S2_SALT), title: 'Ag₂CrO₄ in water' }),
        kspFormFixture('form', { x: 112, y: 27 }, { salt: S2_SALT })
      ]
    }),
    hints: [
      'Use the three power dials on the expression.',
      'Compare the equation printed on the beaker with the substances the expression lists, and which of them have a meter.',
      'Raise each ion to the number of times it appears in the equation, and leave out the solid.'
    ],
    check(state) {
      const e = formExpression(state.table, 'form');
      const [cat, an, solid] = e.parts;
      if (solid.set > 0) return { ok: false, msg: `The beaker has a meter for each ion and none for ${solid.text}, and the expression has it to the power ${solid.set}.` };
      for (const p of [cat, an]) {
        if (p.set !== p.power) return { ok: false, msg: `The equation on the beaker has ${p.power > 1 ? `${p.power} ` : 'one '}${p.text} in it, and the expression has ${p.text} to the power ${p.set}.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Each ion took the power of its coefficient; the solid was left out.',
      title: 'The Solubility Product',
      body: 'The equilibrium constant for a solid dissolving is the solubility product constant, Ksp. For Ag₂CrO₄ it is [Ag⁺]²[CrO₄²⁻]: each ion raised to its coefficient in the equation, and the solid left out.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-typed',
    title: 'How Much Dissolves',
    prompt: 'Type how many moles of AgCl dissolve in one litre of water, in mol/L.',
    entry: { id: 's', label: 'AgCl dissolved', unit: 'mol/L' },
    widget,
    table: pansTable({
      fixtures: [
        beakerFixture('jar', { x: 40, y: 27 }, { salt: S3_PICTURE, total: 2.5 * s0(S3_PICTURE), title: 'BaSO₄ in water' }),
        plaqueFixture('ksp', 'Ksp at 25 °C', { x: 112, y: 24 }, [`${name(S3_PICTURE)}   ${sci(ksp(S3_PICTURE))}`, `${name(S3_ASK)}   ${sci(ksp(S3_ASK))}`], { w: 56 })
      ]
    }),
    hints: [
      'Use the beaker, the plate and the answer field.',
      'Compare the beaker\'s ion readings with its Ksp on the plate.',
      'When a salt gives one of each ion, both ions are at the same concentration, and Ksp is that concentration multiplied by itself.'
    ],
    check(state) {
      const { raw, v } = typed(state.table, 's');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the amount in mol/L.' };
      const want = s0(S3_ASK);
      if (Math.abs(v - want) <= S3_TOL * want) return { ok: true };
      const pic = read(S3_PICTURE, 2.5 * s0(S3_PICTURE));
      if (Math.abs(v - ksp(S3_ASK)) <= 0.15 * ksp(S3_ASK)) return { ok: false, msg: `${raw} is the Ksp on the plate; the BaSO₄ beaker holds ${sci(pic.cat)} mol/L of each ion at a Ksp of ${sci(ksp(S3_PICTURE))}.` };
      return { ok: false, msg: `At a Ksp of ${sci(ksp(S3_PICTURE))} the BaSO₄ beaker holds ${sci(pic.cat)} mol/L; ${raw} mol/L is too ${v > want ? 'high' : 'low'} for a Ksp of ${sci(ksp(S3_ASK))}.` };
    },
    reward: {
      log: 'About 1.3e−5 mol/L of AgCl dissolves.',
      title: 'Molar Solubility',
      body: 'The molar solubility of a salt is the moles of it that dissolve in one litre of water. Each AgCl gives one Ag⁺ and one Cl⁻, so Ksp = s × s and s = √(1.8e−10) = 1.3e−5 mol/L.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'Which Dissolves More',
    // A PREDICT STAGE: no beaker on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Which salt holds more dissolved in water, AgCl or Ag₂CrO₄?',
    widget,
    table: pansTable({
      pieces: [
        note('agcl', GUESS.agcl, { x: 30, y: 14 }),
        note('ag2', GUESS.ag2, { x: 78, y: 14 }),
        note('same', GUESS.same, { x: 126, y: 14 })
      ],
      fixtures: [
        clipFixture('clip', { x: 82, y: 45 }, 'dissolve', { title: 'A solid in water', w: 34 }),
        plaqueFixture('ksp', 'Ksp at 25 °C', { x: 36, y: 42 }, [`${name('AgCl')}   ${sci(ksp('AgCl'))}`, `${name('Ag2CrO4')}   ${sci(ksp('Ag2CrO4'))}`], { w: 56 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 42 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Compare the two Ksp values on the plate.',
      'Decide whether the size of Ksp alone tells you how much of each salt dissolves.'
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
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, a beaker of each salt is read to test the guess.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const t = S5_TOTAL;
    const ref = s0('Ag2CrO4');
    return {
      id: 's5-compare',
      title: 'Two Beakers',
      get prompt() {
        const g = recall(QUEST_KEY);
        return g && GUESS[g] ? `You predicted "${GUESS[g]}". Tap the salt that has more dissolved in its beaker.` : 'Tap the salt that has more dissolved in its beaker.';
      },
      widget,
      table: pansTable({
        fixtures: [
          pickable(beakerFixture('agcl', { x: 40, y: 25 }, { salt: 'AgCl', total: t, ref, showDissolved: true, title: 'AgCl in water' }), 1),
          pickable(beakerFixture('ag2', { x: 112, y: 25 }, { salt: 'Ag2CrO4', total: t, ref, showDissolved: true, title: 'Ag₂CrO₄ in water' }), 2),
          choiceFixture('pick', 'Holds more dissolved', { x: 75, y: 60 }, { same: 3, options: ['AgCl', 'Ag₂CrO₄', 'The same', ' '], start: 4 })
        ]
      }, { h: 70 }),
      hints: [
        'Tap a beaker to choose it; both are already read.',
        'Compare how much of each salt is dissolved in each beaker, in moles per litre.',
        'Count dissolved salt in whole formula units, which is the line marked "Dissolved salt", not one ion at a time.'
      ],
      check(state) {
        const v = dialValue(state.table, 'pick');
        if (v === 4) return { ok: false, notYet: true, msg: 'Tap one to choose it.' };
        if (v === 2) return { ok: true };
        const a = read('AgCl', t); const b = read('Ag2CrO4', t);
        return { ok: false, msg: `The beakers read ${sci(b.dissolved)} mol/L of Ag₂CrO₄ dissolved and ${sci(a.dissolved)} mol/L of AgCl.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = !g || !GUESS[g] ? '' : g === 'ag2' ? 'Your guess agreed with the beakers. ' : 'Your guess did not agree with the beakers, which is how a guess gets better. ';
        return {
          log: 'Ag₂CrO₄ held more dissolved than AgCl.',
          title: 'Ksp Does Not Rank Alone',
          body: `${verdict}Ag₂CrO₄ has the smaller Ksp, 1.1e−12 against 1.8e−10, yet more of it dissolves: 6.5e−5 mol/L against 1.3e−5. Ksp ranks salts only when they give the same ratio of ions.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const t = S6_TOTAL;
    return {
      id: 's6-common',
      title: 'Salt Already in the Water',
      prompt: 'Tap the beaker that holds more dissolved BaSO₄.',
      widget,
      table: pansTable({
        fixtures: [
          pickable(beakerFixture('b1', { x: 40, y: 25 }, { salt: 'BaSO4', total: t, showDissolved: true, title: 'Beaker 1: water' }), 1),
          pickable(beakerFixture('b2', { x: 112, y: 25 }, { salt: 'BaSO4', total: t, an0: S6_SULFATE, showDissolved: true, title: 'Beaker 2: 0.10 mol/L Na₂SO₄' }), 2),
          choiceFixture('pick', 'Holds more dissolved', { x: 75, y: 60 }, { same: 3, options: ['Beaker 1', 'Beaker 2', 'The same', ' '], start: 4 })
        ]
      }, { h: 70 }),
      hints: [
        'Tap a beaker to choose it; both are already read.',
        'Compare the "Dissolved salt" lines of the two beakers, and what each beaker\'s water held before any BaSO₄ went in.',
        'Sulfate that came from the sodium salt is not BaSO₄ that has dissolved; only the Ba²⁺ meter counts BaSO₄ in the water.'
      ],
      check(state) {
        const v = dialValue(state.table, 'pick');
        if (v === 4) return { ok: false, notYet: true, msg: 'Tap one to choose it.' };
        if (v === 1) return { ok: true };
        const a = read('BaSO4', t); const b = read('BaSO4', t, 0, S6_SULFATE);
        return { ok: false, msg: `Beaker 2 reads ${sci(b.dissolved)} mol/L of dissolved salt and Beaker 1 reads ${sci(a.dissolved)} mol/L.` };
      },
      reward: {
        log: 'Sulfate already in the water cut how much BaSO₄ dissolved.',
        title: 'Common-Ion Effect',
        body: 'A salt dissolves less in water that already holds one of its ions. The extra sulfate drives BaSO₄ back out as solid, a precipitate; this is the common-ion effect, and [Ba²⁺][SO₄²⁻] still equals Ksp.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const dom = [Math.log10(ksp('PbI2')) - 1.5, Math.log10(ksp('PbI2')) + 1.5];
    const jar = (i, x) => beakerFixture(`m${i + 1}`, { x, y: 25 }, {
      salt: 'PbI2', total: 0, cat0: S7_MIX[i].cat, an0: S7_MIX[i].an, gauge: true, gaugeDomain: dom, tallies: false, compact: true, title: `Mix ${i + 1}`
    });
    const Q = i => read('PbI2', 0, S7_MIX[i].cat, S7_MIX[i].an).Q;
    return {
      id: 's7-mix',
      title: 'Mixing Two Solutions',
      prompt: 'Tap the mixture in which a precipitate forms.',
      widget,
      table: pansTable({
        fixtures: [
          pickable(jar(0, 26), 1), pickable(jar(1, 75), 2), pickable(jar(2, 124), 3),
          choiceFixture('pick', 'Forms a precipitate', { x: 75, y: 60 }, { options: ['Mix 1', 'Mix 2', 'Mix 3', ' '], start: 4 })
        ]
      }, { h: 70 }),
      hints: [
        'Tap a mixture to choose it; each has a gauge.',
        'Compare Q with Ksp on each gauge.',
        'Use what Q above K and Q below K meant for a vessel on an earlier bench.'
      ],
      check(state) {
        const v = dialValue(state.table, 'pick');
        if (v === 4) return { ok: false, notYet: true, msg: 'Tap one to choose it.' };
        if (v === 2) return { ok: true };
        return { ok: false, msg: `Mix ${v} has Q = ${sci(Q(v - 1))} against a Ksp of ${sci(ksp('PbI2'))}.` };
      },
      reward: {
        log: 'Only the mixture with Q past Ksp formed a precipitate.',
        title: 'Q Against Ksp',
        body: `A precipitate forms when mixing leaves Q above Ksp. Mix 2 has Q = ${sci(Q(1))} against Ksp = ${sci(ksp('PbI2'))}; the other two stay below Ksp, so no solid forms.`
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Two Salts, One Added Ion',
    prompt: 'Tap the salt whose solubility drops by the larger factor when 0.10 mol/L of a common ion is added.',
    widget,
    table: pansTable({
      fixtures: [
        pickable(beakerFixture('agcl', { x: 40, y: 28 }, { salt: 'AgCl', total: S8.AgCl.total, showDissolved: true, showPure: true, tallies: false, common: { ion: S8.AgCl.ion, list: S8_LIST, label: 'Cl− added', labels: S8_LABELS }, title: 'AgCl' }), 1),
        pickable(beakerFixture('pbi2', { x: 112, y: 28 }, { salt: 'PbI2', total: S8.PbI2.total, showDissolved: true, showPure: true, tallies: false, common: { ion: S8.PbI2.ion, list: S8_LIST, label: 'I− added', labels: S8_LABELS }, title: 'PbI₂' }), 2),
        choiceFixture('pick', 'Drops by the larger factor', { x: 75, y: 62 }, { same: 3, options: ['AgCl', 'PbI₂', 'The same', ' '], start: 4 })
      ]
    }, { h: 72 }),
    hints: [
      'Use the "added" dial on each beaker then tap the beaker you choose.',
      'Compare each salt\'s "Dissolved salt" with and without the added ion, next to its "In pure water" line.',
      'A factor is how many times smaller the dissolved amount becomes, the old figure divided by the new one.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap one to choose it.' };
      if (v === 1) return { ok: true };
      const a = read('AgCl', S8.AgCl.total, 0, S8_ADDED); const b = read('PbI2', S8.PbI2.total, 0, S8_ADDED);
      return { ok: false, msg: `AgCl goes from ${sci(s0('AgCl'))} to ${sci(a.dissolved)} mol/L and PbI₂ from ${sci(s0('PbI2'))} to ${sci(b.dissolved)} mol/L.` };
    },
    reward: {
      log: 'The same added ion cut AgCl by a larger factor than PbI₂.',
      title: 'Not by Ksp Alone',
      body: 'Adding 0.10 mol/L of a common ion cuts AgCl from 1.3e−5 to 1.8e−9 mol/L, but PbI₂ from 1.3e−3 to 9.8e−7. How far a solubility falls depends on how the salt\'s ions enter its Ksp, not on the size of Ksp alone.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Solubility Equilibria',
  body: 'A saturated solution is an equilibrium between a solid and its ions, so the solid has a Ksp; what the water holds depends on the salt\'s ion ratio and on ions already in it.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runs = (fid, n) => Array.from({ length: n }, () => ({ run: fid }));

export const SOLUTIONS = [
  runs('jar', 5),
  [dial('form', 'e1', 2), dial('form', 'e3', 0)],
  [{ type: { entry: 's', value: '1.3e-5' } }],
  [put('ag2', 'slot:guess')],
  [dial('pick', 'value', 2)],
  [dial('pick', 'value', 1)],
  [dial('pick', 'value', 2)],
  [dial('agcl', 'c', 3), dial('pbi2', 'c', 3), dial('pick', 'value', 1)]
];

export const MISSES = [
  runs('jar', 2),
  [dial('form', 'e1', 2)],
  [{ type: { entry: 's', value: '1.8e-10' } }],
  [],
  [dial('pick', 'value', 1)],
  [dial('pick', 'value', 2)],
  [dial('pick', 'value', 1)],
  [dial('agcl', 'c', 3), dial('pbi2', 'c', 3), dial('pick', 'value', 2)]
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

/** For the checks in `tools/lib/teeter-q7-checks.mjs`. */
export const CHECKS = { S1_SALT, S2_SALT, S3_PICTURE, S3_ASK, S3_TOL, S5_TOTAL, S6_TOTAL, S6_SULFATE, S7_MIX, S8, S8_ADDED, read, typed, formSpecies, solubilityWithCommon };
