/**
 * Unit 8 · Bench 7 — Solubility Equilibria (q7-dissolve)
 *
 * Teeter's settling pond, on the pans kit (`table/kits/pans.js`) with the solubility beaker and the expression form
 * (`table/kits/pans-beaker.js`). Seven stages and ONE click: the belief that the salt with the smaller Ksp is always the less soluble.
 *
 *   1  add a salt until another scoop changes nothing     -> a limit: saturated; the solid and the water keep trading units
 *   2  write the equilibrium constant for a dissolving    -> Ksp, the solubility product (solid left out, powers from the equation)
 *   3  TYPED: moles of AgCl that dissolve per litre       -> molar solubility (past any dial; the picture is a nearby salt)
 *   4  PREDICT: AgCl or Ag2CrO4 holds more dissolved      -> the wrong model is on the table: "smaller Ksp, less soluble"
 *   5  TEST: read a beaker of each                        -> Ksp ranks solubility only between salts with the same ion ratio
 *   6  BaSO4 with an "Added sulfate" dial                 -> common-ion effect, precipitate
 *   7  three mixtures with Ksp on a plate (no Q gauge)    -> a precipitate forms only when Q is past Ksp
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
import { pansTable, plaqueFixture, note, pieceIn, dialValue } from '../../table/kits/pans.js';
import { beakerFixture, kspFormFixture, beakerRead, formExpression, formSpecies, sci, ionText, SCOOP } from '../../table/kits/pans-beaker.js';

import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickable } from '../../table/kits/pans-choice.js';
export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bsaturated\b/i, introducedAt: 1 },
  { term: /\bKsp\b|\bsolubility product\b/i, introducedAt: 2 },
  { term: /\bmolar solubility\b/i, introducedAt: 3 },
  { term: /\bcommon.ion\b/i, introducedAt: 6 },
  { term: /\bprecipitate\b/i, introducedAt: 6 }
];

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
// Stage 6: BaSO4 with a dial adding 0, 0.05, or 0.10 mol/L sulfate.
const S6_TOTAL = 3 * s0('BaSO4');
const S6_LIST = [0, 0.05, 0.10];
const S6_LABELS = ['none', '0.05 mol/L', '0.10 mol/L'];
// Stage 7: three mixtures of Pb²⁺ and I⁻ after mixing, mol/L.
const S7_MIX = [
  { cat: 5.0e-3, an: 1.0e-3 },
  { cat: 2.0e-3, an: 4.0e-3 },
  { cat: 1.0e-3, an: 3.0e-3 }
];

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
    prompt: 'Find the point where adding another scoop of CaF₂ dissolves no more salt.',
    widget,
    table: pansTable({
      fixtures: [beakerFixture('jar', { x: 75, y: 27 }, { salt: S1_SALT, scoops: true, title: 'CaF₂ in water' })]
    }),
    hints: [
      'Press "Add solid" on the beaker one scoop at a time.',
      'Watch the two ion meters and the solid collecting on the bottom after each scoop.',
      'Stop once a new scoop leaves both ion meters unchanged.'
    ],
    check(state) {
      const r = beakerRead(state.table, 'jar');
      if (r.n === 0) return { ok: false, notYet: true, msg: 'Add solid to the beaker first.' };
      const prev = read(S1_SALT, (r.n - 1) * SCOOP * r.s0);
      if (r.n >= 2 && r.dissolved > 0 && prev.dissolved === r.dissolved) return { ok: true };
      return { ok: false, msg: `That scoop still dissolved ([${ionText(r.S.cation)}] rose from ${sci(prev.cat)} to ${sci(r.cat)} mol/L). Keep adding until extra solid sits on the bottom without raising the meters.` };
    },
    reward: {
      log: 'The meters stopped rising once solid stayed on the floor.',
      title: 'Saturated',
      body: 'Eventually the ion meters stopped rising and extra solid sat on the bottom. Water holding all the dissolved solid it can is saturated—solid and ions are at equilibrium.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-expression',
    title: 'Writing the Expression',
    briefing: 'A solid at equilibrium with its dissolved ions has an equilibrium constant called the solubility product, Ksp.',
    prompt: 'Build the Ksp expression for dissolving Ag₂CrO₄(s).',
    widget,
    table: pansTable({
      fixtures: [
        beakerFixture('jar', { x: 40, y: 27 }, { salt: S2_SALT, total: 2.5 * s0(S2_SALT), title: 'Ag₂CrO₄ in water' }),
        kspFormFixture('form', { x: 112, y: 27 }, { salt: S2_SALT })
      ]
    }),
    hints: [
      'Adjust the three exponent dials on the expression.',
      'Check the equation on the beaker and notice which substances have concentration meters.',
      'Raise each ion to its equation coefficient, and leave the solid out (power 0).'
    ],
    check(state) {
      const e = formExpression(state.table, 'form');
      const [cat, an, solid] = e.parts;
      if (solid.set > 0) return { ok: false, msg: `Pure solids like ${solid.text} are left out of Ksp (set its power to 0).` };
      for (const p of [cat, an]) {
        if (p.set !== p.power) return { ok: false, msg: `The equation has ${p.power > 1 ? `${p.power} ` : '1 '}${p.text}, so its exponent should be ${p.power}, not ${p.set}.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Each ion took the power of its coefficient; the solid was left out.',
      title: 'The Solubility Product',
      body: 'Ksp = [Ag⁺]²[CrO₄²⁻]: each dissolved ion is raised to its coefficient, and the pure solid is left out just like in any K.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-typed',
    title: 'How Much Dissolves',
    briefing: {
      speaker: 'Vess',
      body: 'Molar solubility (s) is the moles of salt that dissolve in 1 L; for a 1:1 salt, Ksp = s². Use the Ksp plate and calculator to find s for AgCl.'
    },
    prompt: 'What is the molar solubility of AgCl, in mol/L?',
    entry: { id: 's', label: 'AgCl dissolved', unit: 'mol/L' },
    widget,
    table: pansTable({
      fixtures: [
        beakerFixture('jar', { x: 40, y: 27 }, { salt: S3_PICTURE, total: 2.5 * s0(S3_PICTURE), title: 'BaSO₄ in water' }),
        plaqueFixture('ksp', 'Ksp at 25 °C', { x: 112, y: 24 }, [`${name(S3_PICTURE)}   ${sci(ksp(S3_PICTURE))}`, `${name(S3_ASK)}   ${sci(ksp(S3_ASK))}`], { w: 56 })
      ]
    }),
    hints: [
      'Read the Ksp values on the plate and use the calculator to find s.',
      'Check how the BaSO₄ beaker\'s ion concentration relates to its Ksp on the plate.',
      'For a 1:1 salt like AgCl, Ksp = s², so take the square root of Ksp.'
    ],
    check(state) {
      const { raw, v } = typed(state.table, 's');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the molar solubility in mol/L.' };
      const want = s0(S3_ASK);
      if (Math.abs(v - want) <= S3_TOL * want) return { ok: true };
      if (Math.abs(v - ksp(S3_ASK)) <= 0.15 * ksp(S3_ASK)) return { ok: false, msg: `${raw} is Ksp itself, not the molar solubility s—remember Ksp = s².` };
      return { ok: false, msg: `${raw} mol/L is too ${v > want ? 'high' : 'low'} for Ksp = ${sci(ksp(S3_ASK))}; remember Ksp = s².` };
    },
    reward: {
      log: 'About 1.3e−5 mol/L of AgCl dissolves.',
      title: 'Molar Solubility',
      body: 'Each AgCl splits into one Ag⁺ and one Cl⁻, so Ksp = s² and s = 1.3 × 10⁻⁵ mol/L.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'Which Dissolves More',
    // A PREDICT STAGE: no beaker on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Which salt dissolves more per litre of water: AgCl or Ag₂CrO₄?',
    widget,
    table: pansTable({
      pieces: [
        note('agcl', GUESS.agcl, { x: 30, y: 14 }),
        note('ag2', GUESS.ag2, { x: 78, y: 14 }),
        note('same', GUESS.same, { x: 126, y: 14 })
      ],
      fixtures: [
        clipFixture('clip', { x: 78, y: 45 }, 'dissolve', { title: 'A solid in water', w: 34 }),
        plaqueFixture('ksp', 'Ksp at 25 °C', { x: 32, y: 42 }, [`${name('AgCl')}   ${sci(ksp('AgCl'))}`, `${name('Ag2CrO4')}   ${sci(ksp('Ag2CrO4'))}`], { w: 54 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 122, y: 42 }, size: { w: 42, h: 14 } }] }
    }),
    hints: [
      'Drag one prediction card into the slot.',
      'Look at both Ksp values on the plate and notice their formulas.',
      'Decide whether a larger Ksp always means more salt dissolves.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, we measure a beaker of each salt to test your prediction.'
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
        return g && GUESS[g] ? `You predicted "${GUESS[g]}". Which salt has more dissolved in its beaker?` : 'Which salt has more dissolved in its beaker?';
      },
      widget,
      table: pansTable({
        fixtures: [
          pickable(beakerFixture('agcl', { x: 40, y: 25 }, { salt: 'AgCl', total: t, ref, showDissolved: true, title: 'AgCl in water' }), 1),
          pickable(beakerFixture('ag2', { x: 112, y: 25 }, { salt: 'Ag2CrO4', total: t, ref, showDissolved: true, title: 'Ag₂CrO₄ in water' }), 2),
          choiceFixture('pick', 'Holds more dissolved', { x: 75, y: 60 }, { same: 3, options: ['AgCl', 'Ag₂CrO₄', 'The same', ' '], start: 4, placeholder: 'tap a beaker' })
        ]
      }, { h: 70 }),
      hints: [
        'Tap the beaker that holds more dissolved salt.',
        'Compare the "Dissolved salt" reading (in mol/L) on both beakers.',
        'Read the "Dissolved salt" line itself, not an individual ion concentration.'
      ],
      check(state) {
        const v = dialValue(state.table, 'pick');
        if (v === 4) return { ok: false, notYet: true, msg: 'Tap a beaker to choose it.' };
        if (v === 2) return { ok: true };
        const a = read('AgCl', t); const b = read('Ag2CrO4', t);
        return { ok: false, msg: `The beakers show ${sci(b.dissolved)} mol/L of Ag₂CrO₄ dissolved versus ${sci(a.dissolved)} mol/L of AgCl.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = !g || !GUESS[g] ? '' : g === 'ag2' ? 'Your prediction matched. ' : 'Your prediction did not match. ';
        return {
          log: 'Ag₂CrO₄ held more dissolved than AgCl.',
          title: 'Ksp Does Not Rank Alone',
          body: `${verdict}Ag₂CrO₄ has a smaller Ksp yet dissolves more, because its Ksp squares [Ag⁺]. Ksp compares solubility directly only when salts have the same ion ratio.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-common',
    title: 'A Common Ion',
    prompt: 'What happens to dissolved BaSO₄ when sodium sulfate is added to its saturated solution?',
    widget,
    table: pansTable({
      pieces: [
        note('more', 'More BaSO₄ dissolves', { x: 112, y: 11 }),
        note('solid', 'Some BaSO₄ comes out as solid', { x: 112, y: 29 }),
        note('same', 'Nothing changes', { x: 112, y: 47 })
      ],
      fixtures: [
        beakerFixture('b', { x: 42, y: 28 }, {
          salt: 'BaSO4', total: S6_TOTAL, showDissolved: true,
          common: { ion: 'anion', list: S6_LIST, label: 'Sulfate added', labels: S6_LABELS },
          title: 'Saturated BaSO₄'
        })
      ],
      zones: { slots: [{ id: 'ans', label: 'What happens', at: { x: 112, y: 66 }, size: { w: 46, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Turn the "Sulfate added" dial on the beaker, then place a card in the slot.',
      'Watch the Ba²⁺ meter, "Dissolved salt", and the solid on the bottom as you add sulfate.',
      'See whether adding sulfate dissolves more BaSO₄ or forces some out as solid.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      const cVal = dialValue(state.table, 'b', 'c');
      if (cVal === 1) return { ok: false, msg: 'Turn the "Sulfate added" dial first to add sodium sulfate.' };
      if (card.id === 'solid') return { ok: true };
      const r = beakerRead(state.table, 'b');
      return { ok: false, msg: `With ${S6_LABELS[cVal - 1]} sulfate added, dissolved BaSO₄ dropped to ${sci(r.dissolved)} mol/L and more solid settled on the bottom.` };
    },
    reward: {
      log: 'Added sulfate drove BaSO₄ out of solution as a solid.',
      title: 'Common-Ion Effect',
      body: 'Extra sulfate raised Q above Ksp, forcing BaSO₄ out as a solid (precipitate) until Q returned to Ksp. This is the common-ion effect.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const jar = (i, x) => beakerFixture(`m${i + 1}`, { x, y: 18 }, {
      salt: 'PbI2', total: 0, cat0: S7_MIX[i].cat, an0: S7_MIX[i].an, gauge: false, tallies: false, compact: true, title: `Mix ${i + 1}`
    });
    const Q = i => read('PbI2', 0, S7_MIX[i].cat, S7_MIX[i].an).Q;
    return {
      id: 's7-mix',
      title: 'Mixing Two Solutions',
      prompt: 'Which mixture forms a solid (precipitate) when checked with the calculator?',
      widget,
      table: pansTable({
        fixtures: [
          pickable(jar(0, 26), 1), pickable(jar(1, 75), 2), pickable(jar(2, 124), 3),
          plaqueFixture('ksp', 'Ksp at 25 °C', { x: 75, y: 49 }, [`${name('PbI2')}   ${sci(ksp('PbI2'))}`, 'Q = [Pb²⁺] × [I⁻]²'], { w: 54 }),
          choiceFixture('pick', 'Forms a precipitate', { x: 75, y: 68 }, { options: ['Mix 1', 'Mix 2', 'Mix 3', ' '], start: 4, placeholder: 'tap a beaker' })
        ]
      }, { h: 80 }),
      hints: [
        'Calculate Q for each mixture and compare it with Ksp on the plate, then tap a beaker.',
        'Use Q = [Pb²⁺] × [I⁻]² with the two ion concentrations on each beaker.',
        'A precipitate forms only when Q is greater than Ksp.'
      ],
      check(state) {
        const v = dialValue(state.table, 'pick');
        if (v === 4) return { ok: false, notYet: true, msg: 'Tap a beaker to choose it.' };
        if (v === 2) return { ok: true };
        return { ok: false, msg: `Mix ${v} has Q = ${sci(Q(v - 1))}, which is below Ksp = ${sci(ksp('PbI2'))}, so no solid forms.` };
      },
      reward: {
        log: 'Only the mixture with Q past Ksp formed a precipitate.',
        title: 'Q Against Ksp',
        body: 'Only Mix 2 has Q above Ksp, so only Mix 2 forms a precipitate.'
      }
    };
  })()
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
  [dial('b', 'c', 3), put('solid', 'slot:ans')],
  [dial('pick', 'value', 2)]
];

export const MISSES = [
  runs('jar', 2),
  [dial('form', 'e1', 2)],
  [{ type: { entry: 's', value: '1.8e-10' } }],
  [],
  [dial('pick', 'value', 1)],
  [dial('b', 'c', 3), put('more', 'slot:ans')],
  [dial('pick', 'value', 1)]
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
export const CHECKS = { S1_SALT, S2_SALT, S3_PICTURE, S3_ASK, S3_TOL, S5_TOTAL, S6_TOTAL, S7_MIX, read, typed, formSpecies, solubilityWithCommon };
