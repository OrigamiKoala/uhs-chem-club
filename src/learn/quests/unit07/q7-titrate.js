/**
 * Unit 7 · Bench 7 — Titration (q7-titrate)
 *
 * The pickling line, on the pot kit: a burette of base over a flask of acid (`table/kits/pot-titrate.js`), an indicator card for the
 * flask, and where a stage asks for it a particle view of the ions still free in the flask. Every reading is `reactdata-titrate.js` /
 * `reactdata.js` `titrate`; nothing on the table is authored.
 *
 *   1  PREDICT: how much 0.250 mol/L base does 25.0 mL of 0.100 mol/L acid take?
 *   2  TEST: titrate until the indicator changes colour                              -> titration, burette, indicator
 *   3  stop where the particle view shows nothing left over of either                -> equivalence point
 *   4  an unknown acid: titrate, then type its concentration (worked case in brief)  -> moles of base = moles of acid
 *   5  sulfuric acid: type its concentration                                         -> two H+ for each H2SO4
 *   6  an indicator that changes early: before, at, or after the equivalence point   -> endpoint
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { potTable, stmt, chip, plaqueFixture, fixed } from '../../table/kits/pot.js';
import { titratorFixture, titratorRead, indicatorCard } from '../../table/kits/pot-titrate.js';
import {
  flaskAt, equivalenceMl, endpointMl, acidMolarity, acidMoles
} from '../../engine/reactdata-titrate.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\btitration\b/i, introducedAt: 2 },
  { term: /\bburette\b/i, introducedAt: 2 },
  { term: /\bindicator\b/i, introducedAt: 2 },
  { term: /\bequivalence point\b/i, introducedAt: 3 },
  { term: /\bendpoint\b/i, introducedAt: 6 }
];

/** Moles and the mole ratio are the stoichiometry bench's. */
export const BUILDS_ON = ['unit07/q6-stoich'];

export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q7-titrate';

/* ------------------------------------------------------------------
   THE CASES (every figure is worked from the volumes and strengths below)
   ------------------------------------------------------------------ */

const SYS2 = { acid: { M: 0.1, mL: 25, nH: 1 }, base: { M: 0.25, nOH: 1 } };      // stage 1 and 2: 10.0 mL to equal, 10.5 mL to the colour
const SYS3 = { acid: { M: 0.2, mL: 25, nH: 1 }, base: { M: 0.25, nOH: 1 } };      // stage 3: 20.0 mL
const SYS4 = { acid: { M: 0.18, mL: 25, nH: 1 }, base: { M: 0.2, nOH: 1 } };      // stage 4: hydrochloric acid of an unknown concentration
const SYS5 = { acid: { M: 0.072, mL: 25, nH: 2 }, base: { M: 0.1, nOH: 1 } };     // stage 5: sulfuric acid
const SYS6 = { acid: { M: 0.02, mL: 25, nH: 1 }, base: { M: 0.02, nOH: 1 } };     // stage 6: a dilute pair, methyl orange

const STEP = 0.5;
const PH = 'phenolphthalein';
const MO = 'methyl orange';

// Stage 1 and 2.
const GUESS = { v5: '5.0 mL', v10: '10.0 mL', v25: '25.0 mL', v62: '62.5 mL' };
const GUESS_VALUE = { v5: 5.0, v10: 10.0, v25: 25.0, v62: 62.5 };
const EQ2 = equivalenceMl(SYS2);
const END2 = endpointMl(SYS2, PH, STEP);
// Stage 3.
const EQ3 = equivalenceMl(SYS3);
const UNIT3 = 0.00025;
// Stage 4 and 5: the acid's concentration.
const ANS4 = SYS4.acid.M;
const ANS5 = SYS5.acid.M;
// Stage 6.
const EQ6 = equivalenceMl(SYS6);
const END6 = endpointMl(SYS6, MO, STEP);
const UNIT6 = 0.00002;

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const typedValue = (t, id) => entryNumber(t, id);
const within = (v, want, tol) => Math.abs(v - want) <= tol;

/** The burette reading at which the player first saw the flask change colour, or null when it has not. */
function firstChange(t, fid) {
  const r = titratorRead(t, fid);
  const p = r.f.props;
  const start = flaskAt(p.sys, 0, r.indicator).colour;
  for (const row of r.rows) if (flaskAt(p.sys, row.x, r.indicator).colour !== start) return row.x;
  return null;
}

/** A refusal of a typed figure that names the burette's own reading. */
function missMsg(t, fid, shown, unit) {
  const r = titratorRead(t, fid);
  if (!r.rows.length) return { ok: false, msg: 'Open the tap to titrate the flask first.' };
  const seen = firstChange(t, fid);
  const tail = seen == null ? 'the flask has not changed color yet.' : 'check the burette reading where the flask first changed color and convert to moles.';
  return { ok: false, msg: `${shown} ${unit} does not match the burette: ${tail}` };
}

/* ------------------------------------------------------------------
   THE SIX STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'How Much Base',
    predict: true,
    briefing: {
      title: 'Concentration in mol/L',
      body: 'A base releases OH⁻ ions that neutralize an acid\'s H⁺ ions. Concentration (mol/L) tells how many moles are dissolved in each liter.'
    },
    prompt: 'How much base do you expect will use up all the acid?',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 12 + Math.floor(i / 2) * 16 })),
      fixtures: [plaqueFixture('facts', 'Acid and base', { x: 118, y: 18 }, [
        '25.0 mL of 0.100 mol/L acid', 'Base: 0.250 mol/L', 'One mole of base uses up one mole of acid.'
      ], { w: 58 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Compare the acid\'s volume and concentration with the base\'s concentration on the plaque.',
      'Compare how many moles are in a litre of the acid with how many are in a litre of the base.',
      'Decide whether a more concentrated base is needed in a larger or a smaller volume.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the prediction slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, add the base to the acid flask and see what volume it takes.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { sys: SYS2, presses: [0.5, 1, 2, 5], named: false, baseName: 'Base', acidName: 'acid' });
    return {
      id: 's2-colour',
      title: 'Watch the Colour',
      briefing: {
        title: 'Titration and Indicators',
        body: 'In a titration, you add a measured volume of one solution from a burette into another until they completely react. An indicator is a dye that changes color when that happens.'
      },
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `You predicted ${GUESS[g]}. Test it: ` : '';
        return `${guess}add base a little at a time and watch when the flask changes color.`;
      },
      widget,
      table: potTable({
        pieces: [indicatorCard('ph', PH, { x: 100, y: 24 })],
        fixtures: [t.fixture, plaqueFixture('facts', 'Acid', { x: 120, y: 10 }, ['25.0 mL of 0.100 mol/L acid'], { w: 50 })],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Watch the flask color and the burette reading together once the indicator is in its slot.',
        'Watch the flask and the reading together as the base runs in.',
        'Take big presses at first and small ones as the flask starts to look different.'
      ],
      check(state) {
        const r = titratorRead(state.table, 'tit');
        if (!r.rows.length) return { ok: false, notYet: true, msg: 'Nothing has run into the flask yet.' };
        if (!r.indicator) return { ok: false, msg: `The flask has no indicator in it, and it reads ${fixed(r.vMl, 1)} mL.` };
        if (r.colour === 'colourless') return { ok: false, msg: `The flask is still colourless at ${fixed(r.vMl, 1)} mL.` };
        if (r.vMl > END2 + 1.0) return { ok: false, msg: `The flask had already changed colour before the reading reached ${fixed(r.vMl, 1)} mL.` };
        return { ok: true };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS_VALUE[g] != null
          ? `You predicted ${GUESS[g]}. `
          : '';
        return {
          log: `The flask changed color at ${fixed(END2, 1)} mL.`,
          title: 'Titration',
          body: `${verdict}The indicator changed color at ${fixed(END2, 1)} mL on the burette — slightly past the exact 10.0 mL match, because phenolphthalein turns pink once a tiny excess of base is present.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const t = titratorFixture('tit', { x: 55, y: 32 }, { sys: SYS3, presses: [0.5, 1, 2, 5], named: true, window: true, unit: UNIT3, indicator: false, acidName: 'acid' });
    return {
      id: 's3-equal',
      title: 'Nothing Left Over',
      prompt: 'At what burette reading is no H⁺ left in the flask (press Undo if you overshoot)?',
      widget,
      table: potTable({
        fixtures: [t.fixture, plaqueFixture('facts', 'Acid', { x: 127, y: 12 }, ['25.0 mL of acid', '0.200 mol/L'], { w: 40 })],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Watch the H⁺ circles in the particle view as you add base.',
        'Notice how many H⁺ circles disappear with each press of base, and watch for OH⁻ appearing if you overshoot.',
        'Each press removes the same amount of H⁺; stop when none are left.'
      ],
      check(state) {
        const r = titratorRead(state.table, 'tit');
        if (!r.rows.length) return { ok: false, notYet: true, msg: 'Open the tap to add base to the flask first.' };
        if (within(r.vMl, EQ3, 0.01)) return { ok: true };
        const n = Math.round((r.flask.acidLeft || r.flask.baseLeft) / UNIT3);
        return r.flask.acidLeft > 0
          ? { ok: false, msg: `The particle view still shows ${n} circles of H⁺ at ${fixed(r.vMl, 1)} mL.` }
          : { ok: false, msg: `Too far: ${n} circles of OH⁻ are left over at ${fixed(r.vMl, 1)} mL — press Undo to step back.` };
      },
      reward: {
        log: `${fixed(EQ3, 1)} mL of base used up the acid.`,
        title: 'Equivalence Point',
        body: 'At 20.0 mL, no H⁺ or OH⁻ is left over. That is the equivalence point: all the acid has reacted with the added base (one mole of base for each mole of acid here).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { sys: SYS4, acidName: 'HCl' });
    return {
      id: 's4-unknown',
      title: 'The Acid in the Flask',
      briefing: {
        title: 'Finding the Acid Concentration',
        body: 'At the equivalence point, all the acid has reacted with the base (one mole of OH⁻ neutralizes one mole of H⁺). Multiply the base volume (in litres) by its known concentration to find moles of base, then divide by the acid volume (in litres).'
      },
      prompt: 'What is the concentration of the HCl acid in the flask, in mol/L?',
      entry: { id: 'M', label: 'Concentration', unit: 'mol/L' },
      widget,
      table: potTable({
        pieces: [indicatorCard('ph', PH, { x: 100, y: 24 })],
        fixtures: [t.fixture],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Watch the burette reading where the flask first turns pink, and note the known base concentration.',
        'Compare the burette reading at the colour change with the 25.0 mL of acid in the flask.',
        'Multiply the base volume (in L) by 0.200 mol/L to find moles of base, then divide by 0.0250 L of acid.'
      ],
      check(state) {
        const t2 = state.table;
        const v = typedValue(t2, 'M');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in mol/L.' };
        if (within(v, ANS4, 0.006)) return { ok: true };
        return missMsg(t2, 'tit', fixed(v, 3), 'mol/L');
      },
      reward: {
        log: 'The acid is 0.180 mol/L.',
        title: 'Counting Acid by Base',
        body: 'The indicator turned pink at 23.0 mL (just past the 22.5 mL equivalence point). 22.5 mL of 0.200 mol/L base is 0.00450 mol in 0.0250 L: 0.180 mol/L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { sys: SYS5, acidName: 'H₂SO₄' });
    return {
      id: 's5-sulfuric',
      title: 'Sulfuric Acid',
      prompt: 'What is the concentration of the sulfuric acid in the flask, in mol/L?',
      entry: { id: 'M', label: 'Concentration', unit: 'mol/L' },
      widget,
      table: potTable({
        pieces: [indicatorCard('ph', PH, { x: 100, y: 24 })],
        fixtures: [t.fixture, plaqueFixture('facts', 'Sulfuric acid', { x: 118, y: 10 }, ['25.0 mL of sulfuric acid (H₂SO₄)', 'Compare its formula with HCl.'], { w: 56 })],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Watch the burette reading where the flask turns pink, and look at the formula H₂SO₄.',
        'Compare how many H⁺ ions one H₂SO₄ releases with how many one HCl released.',
        'Each mole of base neutralizes one mole of H⁺, and each H₂SO₄ molecule releases two H⁺ ions.'
      ],
      check(state) {
        const t2 = state.table;
        const v = typedValue(t2, 'M');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the concentration in mol/L.' };
        if (within(v, ANS5, 0.0025)) return { ok: true };
        return missMsg(t2, 'tit', fixed(v, 3), 'mol/L');
      },
      reward: {
        log: 'The sulfuric acid is 0.0720 mol/L.',
        title: 'Two H⁺ for One Acid',
        body: 'The indicator turned pink at 37.0 mL (just past the 36.0 mL equivalence point). 36.0 mL of 0.100 mol/L base is 0.00360 mol OH⁻, neutralizing half as many moles of H₂SO₄ (0.00180 mol in 25.0 mL): 0.0720 mol/L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const t = titratorFixture('tit', { x: 50, y: 32 }, { sys: SYS6, window: true, unit: UNIT6, acidName: 'acid' });
    return {
      id: 's6-endpoint',
      title: 'An Early Indicator',
      prompt: 'Does methyl orange change color before, at, or after no H⁺ is left in the particle view?',
      widget,
      table: potTable({
        pieces: [
          indicatorCard('mo', MO, { x: 113, y: 24 }),
          chip('before', 'Before', { x: 113, y: 40 }),
          chip('at', 'At', { x: 136, y: 40 }),
          chip('after', 'After', { x: 124.5, y: 52 })
        ],
        fixtures: [t.fixture, plaqueFixture('facts', 'Acid', { x: 125, y: 9.5 }, ['25.0 mL of acid', '0.0200 mol/L'], { w: 40 })],
        zones: { slots: [...t.slots, { id: 'when', label: 'Colour change', at: { x: 136, y: 24 }, size: { w: 22, h: 10.5 } }] }
      }),
      hints: [
        'Watch the flask color and the H⁺ circles in the particle view together as you add base.',
        'Compare the burette reading when the flask changes colour with what the particle view still shows.',
        'When the indicator changes colour, look at whether any H⁺ is still left in the particle view.'
      ],
      check(state) {
        const t2 = state.table;
        const r = titratorRead(t2, 'tit');
        if (!r.rows.length) return { ok: false, notYet: true, msg: 'Run base into the flask first.' };
        if (!r.indicator) return { ok: false, msg: 'Put the methyl orange card in the slot beside the flask.' };
        if (r.vMl < END6) return { ok: false, notYet: true, msg: `Keep adding base until the indicator changes colour (at ${fixed(r.vMl, 1)} mL it has not changed yet).` };
        const card = Object.values(t2.pieces).find(p => p.zone === 'slot:when');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id !== 'before') return { ok: false, msg: 'Look at the particle view when the color changed: H⁺ was still left in the flask.' };
        return { ok: true };
      },
      reward: {
        log: 'Methyl orange changed color before the equivalence point.',
        title: 'Endpoint',
        body: 'The color changed while H⁺ was still left in the flask. Where the indicator changes color is the endpoint; a good indicator has its endpoint close to the equivalence point.'
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
      body: 'A titration measures an unknown acid using the volume of base needed to neutralize it. At the equivalence point, the acid and base have completely reacted, and an indicator\'s color change marks that point closely.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const run = id => ({ run: id });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const press = (list, ml) => dial('tit', 'press', list.indexOf(ml) + 1);
const times = (n, a) => Array.from({ length: n }, () => a);
const L4 = [0.5, 1, 2, 5];
const L5 = [0.5, 1, 2, 5, 10];

export const SOLUTIONS = [
  [put('v10', 'slot:guess')],
  [put('ph', 'slot:tit.mouth'), press(L4, 5), ...times(2, run('tit')), press(L4, 0.5), run('tit')],
  [press(L4, 5), ...times(4, run('tit'))],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), typed('M', '0.18')],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(3, run('tit')), press(L5, 5), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), typed('M', '0.072')],
  [put('mo', 'slot:tit.mouth'), press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), put('before', 'slot:when')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('ph', 'slot:tit.mouth'), press(L4, 5), ...times(3, run('tit'))],
  [press(L4, 5), ...times(4, run('tit')), press(L4, 0.5), run('tit')],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), typed('M', '0.2')],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(3, run('tit')), press(L5, 5), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), typed('M', '0.146')],
  [put('mo', 'slot:tit.mouth'), press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), put('at', 'slot:when')]
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
    STAGES, DEBRIEF, blankState, toolNoteFor, room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = {
  SYS2, SYS3, SYS4, SYS5, SYS6, GUESS_VALUE, UNIT3, UNIT6, STEP,
  answers: {
    eq2: EQ2, end2: END2, eq3: EQ3, conc4: ANS4, conc5: ANS5, eq6: EQ6, end6: END6,
    fromReading4: acidMolarity(SYS4.base, endpointMl(SYS4, PH, STEP), SYS4.acid.mL, 1)
  },
  moles: { acid3: acidMoles(SYS3), acid5: acidMoles(SYS5) }
};
