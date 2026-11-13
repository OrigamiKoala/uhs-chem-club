/**
 * boss-leach.js — Learn world 9 elite: THE LEACH.
 *
 * The Fifth Guild's sump pump at the pump house of the acid marsh. It draws from five intake vats and calls every vat "acid" without
 * measuring any of them. Each of its five phases puts the TABLETOP of a bench the player has worked back in front of them, on the ph kit
 * (`table/kits/ph.js`), with a NEW case on the table and the Leach standing in the table's corner, watching it. Each phase is a different
 * tool and ONE decision:
 *
 *   1  the scale flasks   which of three flasks is neutral, when one reads 7.00 and two read 6.51      (bench 2, warm water)
 *   2  the weak acids     rank three acids that differ in strength and in strength of flask by pH      (bench 3, the windows)
 *   3  the salts          sort three salt solutions into acidic, neutral and basic                    (bench 5, the meter)
 *   4  the burette        pick the dye for a base titrated with an acid                                (bench 6, the dyes)
 *   5  the mixing flask   type the ratio of acetate to acetic acid that gives pH 5.10                  (bench 7, Henderson-Hasselbalch)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence and
 * never the answer; rung 1 names the control. A refusal names what the table shows, never the rule. Nothing blocks a correct commit. A
 * miss costs one point of Integrity and three knock the table back, with every reading and hint still kept. The foe is the Leach itself,
 * in the corner pad of each table (`table/layout.js` `FOE_PAD`): it only observes, and a boss phase never declares a field stage or a
 * prediction.
 *
 * Every figure is `engine/phdata.js`; the numbers a stage grades against are the planners', never typed twice. Clearing the last phase
 * files the Case File clue `clue_verdigris_leach`. The boss pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { session } from '../../../session.js';
import {
  phTable, selectorFixture, plaqueFixture, tag, pieceIn, dialValue, flaskFixture, scaleFlask, scaleMeter, buretteFixture, mixFixture,
  flaskSol, windowOf, concText, strengthText
} from '../../table/kits/ph.js';
import { meterPiece } from '../../table/kits/ph.js';
import {
  ACIDS, BASES, INDICATORS, scaleSolution, bufferState, ratioForPH, pOf, fmt, sci, titrationML, equivalenceML, indicatorWindowML,
  indicatorEndsAtEquivalence
} from '../../engine/phdata.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit09/q2-scale', 'unit09/q3-weak', 'unit09/q5-salts', 'unit09/q6-titrate', 'unit09/q7-buffer'
];

export const CLUE_ID = 'clue_verdigris_leach';
const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The Leach, as every phase's foe: one body, watching the table. On a table it reads no probe, it only observes. */
const LEACH_FOE = [{ id: 'leach', label: 'The Leach' }];

const widget = { type: 'table', label: 'The bench' };

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const within = (v, want, tol) => Math.abs(v - want) <= tol;
const mL1 = v => (Math.round(v * 10) / 10).toFixed(1);

/* ------------------------------------------------------------------
   THE FIGURES (inputs; every figure shown or graded is the planners')
   ------------------------------------------------------------------ */

// Phase 1: three flasks, each at the temperature it is labelled with. Water at 60 °C and a very dilute acid at 25 °C both read 6.51; a very
// dilute base at 60 °C reads 7.00.
const P1_FLASKS = [
  { id: 'a', label: 'HCl, 25 °C', name: 'hydrochloric acid', solute: { id: 'hcl', c: 2.8e-7, T: 25 } },
  { id: 'w', label: 'Water, 60 °C', name: 'water', solute: { id: 'water', c: 0, T: 60 } },
  { id: 'b', label: 'NaOH, 60 °C', name: 'sodium hydroxide', solute: { id: 'naoh', c: 8.6e-7, T: 60 } }
];
const P1_PICK = 2;
const p1Sol = f => scaleSolution(f.solute);

// Phase 2: three weak acids at different strengths. The meter reads the first flask only.
const P2_FLASKS = [
  { key: 'acetic', name: 'Acetic acid', solute: { id: 'acetic', c: 0.10 }, meter: true },
  { key: 'hf', name: 'Hydrofluoric acid', solute: { id: 'hf', c: 0.0010 }, meter: false },
  { key: 'formic', name: 'Formic acid', solute: { id: 'formic', c: 0.050 }, meter: false }
];
const p2PH = f => flaskSol({ solute: f.solute }).pH;
const P2_WANT = [...P2_FLASKS].sort((a, b) => p2PH(a) - p2PH(b)).map(f => f.key);

// Phase 3: three new salts.
const P3_SALTS = [
  { key: 'nh4no3', solute: { id: 'nh4', c: 0.20 }, name: 'Ammonium nitrate' },
  { key: 'na2co3', solute: { id: 'carbonate', c: 0.10 }, name: 'Sodium carbonate' },
  { key: 'kcl', solute: { id: 'kcl', c: 0.10 }, name: 'Potassium chloride' }
];
const KINDS = ['acidic', 'neutral', 'basic'];
const kindOf = pH => (pH < 6.995 ? 0 : pH > 7.005 ? 2 : 1);
const p3PH = s => flaskSol({ solute: s.solute }).pH;

// Phase 4: ammonia titrated with hydrochloric acid (equivalence acidic).
const P4_SPEC = { analyte: { type: 'weakBase', Kb: BASES.nh3.Kb }, c0: 0.100, V0: 25, ct: 0.100 };
const DYES = ['methylOrange', 'methylRed', 'bromothymol', 'phenolphthalein'];
const P4_RIGHT = DYES.filter(id => indicatorEndsAtEquivalence(P4_SPEC, INDICATORS[id]));

// Phase 5: a buffer of acetic acid and acetate for a pH of 5.10.
const U = 1e-4;
const KA = ACIDS.acetic.Ka;
const P5_TARGET = 5.10;
const P5_REF = [{ ha: 100, a: 100 }, { ha: 10, a: 100 }];
const P5_TOL = 0.03;
const p5PH = (ha, a) => bufferState({ Ka: KA, nHA: ha * U, nA: a * U, V: 0.1 }).pH;
const P5_PKA = pOf(KA);

/* ------------------------------------------------------------------
   THE FIVE PHASES
   Each keeps the top-right corner clear for the foe (the last 23.5 units of the table, down to y 23.5).
   ------------------------------------------------------------------ */

function flaskAt(builder, id, x, top, o) {
  const probe = builder(id, { x, y: 0 }, o);
  return builder(id, { x, y: top + probe.size.h / 2 }, o);
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 'p1-neutral',
    title: 'Phase 1 · The Warm Flasks',
    prompt: 'Which flask is neutral?',
    widget,
    table: (() => {
      const f = P1_FLASKS.map((x, i) => flaskAt(scaleFlask, `f${i + 1}`, 24 + i * 46, 1, { solute: x.solute, label: x.label, w: 42, window: 14, legend: false, lens: true }));
      return phTable({
        pieces: [scaleMeter('meter', { x: 160, y: 40 }, 'pH')],
        fixtures: [...f.map(x => x.fixture), selectorFixture('pick', 'The neutral flask is', { x: 96, y: 78 }, { options: ['Hydrochloric acid', 'Water', 'Sodium hydroxide', ' '], start: 4, w: 78 })],
        zones: { slots: f.map(x => x.slot) }
      }, { w: 184, h: 92 });
    })(),
    foes: LEACH_FOE,
    encounter: {
      species: 'the leach',
      act: 'Commit Flask',
      intent: 'The Leach holds three flasks up to its meter, each at a temperature of its own.'
    },
    hints: [
      'Use the pH meter on each flask and the answer dial.',
      'Compare the amounts of H₃O⁺ and OH⁻ that each flask\'s counter counts with each other.',
      'Look at what each flask\'s counter shows for H₃O⁺ and OH⁻ beside its pH reading.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === P1_PICK) return { ok: true };
      const f = P1_FLASKS[v - 1]; const s = p1Sol(f);
      return { ok: false, msg: `The ${f.name} flask reads ${fmt(s.pH, 2)}, and its counter counts ${sci(s.h, 2)} M of H₃O⁺ against ${sci(s.oh, 2)} M of OH⁻.` };
    },
    get reward() {
      const w = p1Sol(P1_FLASKS[1]); const a = p1Sol(P1_FLASKS[0]); const b = p1Sol(P1_FLASKS[2]);
      return {
        log: 'Only the warm water held equal H₃O⁺ and OH⁻.',
        title: 'Neutral Is Equal Amounts',
        body: `The warm water read ${fmt(w.pH, 2)} and held equal H₃O⁺ and OH⁻, so it is neutral. The acid also read ${fmt(a.pH, 2)} and the base read ${fmt(b.pH, 2)}, but neither held equal amounts.`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'p2-acids',
    title: 'Phase 2 · The Three Acids',
    prompt: 'Which acid solution has the lowest pH and which the highest?',
    widget,
    table: (() => {
      const f = P2_FLASKS.map((x, i) => flaskAt(flaskFixture, `f${i + 1}`, 24 + i * 46, 1, { solute: x.solute, label: x.name, w: 44, window: 16, meter: x.meter }));
      return phTable({
        pieces: [
          meterPiece('meter', { x: 160, y: 40 }),
          ...P2_FLASKS.map((x, i) => tag(`c-${x.key}`, x.name, { x: 24 + i * 40, y: 94 }))
        ],
        fixtures: f.map(x => x.fixture),
        zones: { slots: f.map(x => x.slot).filter(Boolean), rail: { at: { x: 82, y: 76 }, size: { w: 140, h: 14 }, first: 'Lowest pH', last: 'Highest pH', items: [], start: [] } }
      }, { w: 184, h: 108 });
    })(),
    foes: LEACH_FOE,
    encounter: {
      species: 'the leach',
      act: 'Commit Order',
      intent: 'The Leach draws three acids from three vats, each at a concentration of its own.'
    },
    hints: [
      'Use the pH meter on the one flask with a seat, then drag the three cards onto the rail.',
      'Compare the concentration printed on each flask with the number of its units that have handed over a proton.',
      'Compare both the concentration on each flask and the share ionized in its window against the one flask the meter reads.'
    ],
    check(state) {
      const order = state.table.zones.rail.order.map(id => id.slice(2));
      if (order.length < P2_WANT.length) return { ok: false, notYet: true, msg: `Put all ${P2_WANT.length} cards on the rail.` };
      if (order.join() === P2_WANT.join()) return { ok: true };
      const rank = k => P2_WANT.indexOf(k);
      const k = order.findIndex((id, i) => i > 0 && rank(order[i - 1]) > rank(id));
      const f = key => P2_FLASKS.find(x => x.key === key);
      const say = key => { const x = f(key); const w = windowOf({ solute: x.solute }); return `${x.name.toLowerCase()} shows ${w.ionized} of ${w.units} units handed over at ${concText(x.solute.c)}`; };
      return { ok: false, msg: `${f(order[k - 1]).name} sits left of ${f(order[k]).name.toLowerCase()}; the window of ${say(order[k - 1])}, and the window of ${say(order[k])}.` };
    },
    get reward() {
      const p = Object.fromEntries(P2_FLASKS.map(x => [x.key, fmt(p2PH(x), 2)]));
      return {
        log: 'The most dilute acid was the one with the largest share ionized and not the lowest pH.',
        title: 'Concentration Is Not Share',
        body: `Formic acid read ${p.formic}, acetic acid ${p.acetic} and hydrofluoric acid ${p.hf}. Hydrofluoric acid had the largest share ionized, but it was the most dilute flask, so its H₃O⁺ in mol/L was the smallest.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'p3-salts',
    title: 'Phase 3 · The Salt Vats',
    prompt: 'Which salt solutions are acidic, which neutral and which basic?',
    widget,
    table: (() => {
      const probe = flaskFixture('p', { x: 0, y: 0 }, { solute: P3_SALTS[0].solute, w: 36, window: 8, legend: false, waterNote: false, units: 120, cols: 12 });
      const fl = P3_SALTS.map((s, i) => flaskFixture(`f${i + 1}`, { x: 24 + i * 46, y: 1 + probe.size.h / 2 }, { solute: s.solute, label: s.name, w: 36, window: 8, legend: false, waterNote: false, units: 120, cols: 12, meter: i === 0 }));
      const trays = [['acidic', 'Acidic', 24], ['neutral', 'Neutral', 72], ['basic', 'Basic', 120]].map(([id, label, x]) => ({ id, label, at: { x, y: 76 }, size: { w: 44, h: 26 }, cell: 22, cellH: 12 }));
      return phTable({
        pieces: [meterPiece('meter', { x: 162, y: 40 }), ...P3_SALTS.map((s, i) => tag(`c-${s.key}`, s.name, { x: 20 + i * 40, y: 52 }))],
        fixtures: [...fl.map(f => f.fixture), plaqueFixture('parents', 'Strong parents', { x: 166, y: 78 }, ['Acids: HCl, HNO₃', 'Bases: NaOH, KOH'], { w: 44 })],
        zones: { trays, slots: fl.filter(f => f.slot).map(f => f.slot) }
      }, { w: 192, h: 100 });
    })(),
    foes: LEACH_FOE,
    encounter: {
      species: 'the leach',
      act: 'Commit Sort',
      intent: 'The Leach pours three salts into its vats and calls them all safe.'
    },
    hints: [
      'Put the pH meter on ammonium nitrate, read the strong-parents plate, then drag the cards into the trays.',
      'Compare the flask you measured with the other two using the ions on the plate.',
      'Ions from strong parents leave water neutral; an ion from a weak parent shifts the pH.'
    ],
    check(state) {
      const t = state.table;
      const where = Object.fromEntries(P3_SALTS.map(s => [s.key, t.pieces[`c-${s.key}`].zone]));
      if (Object.values(where).some(z => !z || !z.startsWith('tray:'))) return { ok: false, notYet: true, msg: 'Drag every card into a tray.' };
      for (const s of P3_SALTS) {
        const pH = p3PH(s);
        if (where[s.key] === `tray:${KINDS[kindOf(pH)]}`) continue;
        return { ok: false, msg: `The meter on ${s.name.toLowerCase()} reads ${fmt(pH, 2)}.` };
      }
      return { ok: true };
    },
    get reward() {
      const p = Object.fromEntries(P3_SALTS.map(s => [s.key, fmt(p3PH(s), 2)]));
      return {
        log: 'Ammonium nitrate read acidic and sodium carbonate read basic.',
        title: 'Salts of Weak Parents',
        body: `Ammonium nitrate read ${p.nh4no3}, sodium carbonate ${p.na2co3} and potassium chloride ${p.kcl}. An ion that comes from a weak parent reacts with water, and an ion from a strong acid or a strong base leaves the pH alone.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'p4-dye',
    title: 'Phase 4 · The Dosing Run',
    prompt: 'Which indicator changes colour at the equivalence point of this titration?',
    widget,
    table: phTable({
      pieces: DYES.map((id, i) => tag(`c-${id}`, INDICATORS[id].name[0].toUpperCase() + INDICATORS[id].name.slice(1), { x: 112, y: 12 + i * 17 })),
      fixtures: [
        buretteFixture('bur', { x: 48, y: 46 }, {
          samples: [{ title: 'Ammonia', sub: ['25.0 mL, 0.10 M', 'tube: hydrochloric acid'], ...P4_SPEC, meter: false }], cap: 40, rack: DYES
        })
      ],
      zones: { slots: [{ id: 'dye', label: 'My indicator', at: { x: 150, y: 40 }, size: { w: 36, h: 14 } }] }
    }, { w: 180, h: 96 }),
    foes: LEACH_FOE,
    encounter: {
      species: 'the leach',
      act: 'Commit Indicator',
      intent: 'The Leach doses a vat of ammonia from a tube of acid.'
    },
    hints: [
      'Use "Pour size" and "Pour" and watch the four tubes, then lay a card in the slot.',
      'Compare the volume at which each tube changes colour with the volume the flask needs.',
      'Work out the volume that uses up the ammonia, then look for the tube that is still unchanged just before it and changed just after.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'dye');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      const id = card.id.slice(2);
      if (P4_RIGHT.includes(id)) return { ok: true };
      const w = indicatorWindowML(P4_SPEC, INDICATORS[id]);
      return { ok: false, msg: `The ${INDICATORS[id].name} tube changed colour between ${mL1(w.from)} mL and ${mL1(w.to)} mL.` };
    },
    get reward() {
      const eq = equivalenceML(P4_SPEC);
      const pH = titrationML(P4_SPEC, eq);
      return {
        log: 'Methyl red turned over at the steep fall.',
        title: 'An Indicator for a Base',
        body: `Ammonia needed ${mL1(eq)} mL of acid and the pH there was ${fmt(pH, 2)}. Methyl red changes colour at about that pH, so it is the indicator for this titration.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'p5-ratio',
    title: 'Phase 5 · The Mixing Flask',
    prompt: `What ratio of acetate to acetic acid gives a pH of ${fmt(P5_TARGET, 2)}?`,
    widget,
    entry: { id: 'ratio', label: 'Acetate per acetic acid', unit: '' },
    table: (() => {
      const a = flaskAt(mixFixture, 'f1', 24, 1, { title: '100 acetic acid, 100 acetate', ...P5_REF[0], pour: false });
      const b = flaskAt(mixFixture, 'f2', 70, 1, { title: '10 acetic acid, 100 acetate', ...P5_REF[1], pour: false });
      return phTable({
        fixtures: [a.fixture, b.fixture, plaqueFixture('plate', 'Acetic acid', { x: 120, y: 14 }, [`pKa ${fmt(P5_PKA, 2)}`, `Target pH ${fmt(P5_TARGET, 2)}`], { w: 40 })]
      }, { w: 184, h: 52 });
    })(),
    foes: LEACH_FOE,
    encounter: {
      species: 'the leach',
      act: 'Commit Ratio',
      intent: 'The Leach mixes acid and salt in a flask and wants it held at one pH.'
    },
    hints: [
      'Type the ratio in the field; the plate gives the pKa and the target.',
      'Compare the target with the readings of the two flasks, and with the pKa.',
      'Find how far the target lies above the pKa and turn that distance back into a ratio with a power of ten.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ratio');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      if (!(v > 0)) return { ok: false, msg: 'A flask cannot hold zero or a negative number of spheres.' };
      const got = p5PH(100, 100 * v);
      if (within(got, P5_TARGET, P5_TOL + 1e-9)) return { ok: true };
      return { ok: false, msg: `A flask with ${v} acetate spheres for each acetic acid sphere reads ${fmt(got, 2)}, and the target is ${fmt(P5_TARGET, 2)}.` };
    },
    get reward() {
      const r = ratioForPH(P5_PKA, P5_TARGET);
      return {
        log: 'The ratio came from the distance above the pKa.',
        title: 'A Buffer to Order',
        body: `A pH of ${fmt(P5_TARGET, 2)} lies ${fmt(P5_TARGET - P5_PKA, 2)} above the pKa, so the ratio of acetate to acetic acid is 10 to the power ${fmt(P5_TARGET - P5_PKA, 2)}, which is ${fmt(r, 2)}. A flask made to that ratio holds the pH the Leach asked for.`
      };
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */

export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: CLUE_ID,
  sections: [
    {
      heading: 'What You Found',
      body: 'The Leach stops drawing and stands still. In its last vat is a sample the Fifth labelled only "acid", with nothing measured.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase asked a flask a question the Fifth never asked: is it neutral, how strong, acidic or basic, which dye, what ratio. Each one has an answer that can be read off a meter.'
    },
    {
      heading: 'Next',
      body: 'The last vat goes into the Case File. The water was never only acid; someone stopped reading it.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const rail = order => order.map((id, i) => put(`c-${id}`, `rail:${i}`));

export const SOLUTIONS = [
  [put('meter', 'slot:f1.seat'), put('meter', 'slot:f2.seat'), dial('pick', 'value', P1_PICK)],
  [put('meter', 'slot:f1.seat'), ...rail(P2_WANT)],
  [put('c-nh4no3', 'tray:acidic'), put('c-na2co3', 'tray:basic'), put('c-kcl', 'tray:neutral')],
  [{ run: 'bur' }, put('c-methylRed', 'slot:dye')],
  [typed('ratio', '2.27')]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [put('meter', 'slot:f3.seat'), dial('pick', 'value', 3)],
  [...rail(['hf', 'acetic', 'formic'])],
  [put('c-nh4no3', 'tray:neutral'), put('c-na2co3', 'tray:basic'), put('c-kcl', 'tray:neutral')],
  [{ run: 'bur' }, put('c-bromothymol', 'slot:dye')],
  [typed('ratio', '0.44')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };
  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { P1_FLASKS, P1_PICK, P2_FLASKS, P2_WANT, P3_SALTS, P4_SPEC, DYES, P4_RIGHT, P5_TARGET, P5_REF, P5_TOL, strengthText };
