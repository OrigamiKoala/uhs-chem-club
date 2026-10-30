/**
 * Unit 7 · Bench 7 — Titration (q7-titrate)
 *
 * The pickling line, on the pot kit: a burette of base over a flask of acid (`table/kits/pot-titrate.js`), an indicator card for the
 * flask, and where a stage asks for it a window of the ions still free in the flask. Every reading is `reactdata-titrate.js` /
 * `reactdata.js` `titrate`; nothing on the table is authored. Eight stages and ONE click: the belief that an acid takes an EQUAL
 * VOLUME of base.
 *
 *   1  PREDICT: how much 0.250 mol/L base does 25.0 mL of 0.100 mol/L acid take?   (the held model: the same volume, 25.0 mL)
 *   2  TEST: titrate until the indicator changes colour                              -> titration, burette, indicator
 *   3  stop where the window shows nothing left over of either                       -> equivalence point
 *   4  an unknown acid: titrate, then type its concentration                          -> moles of base = moles of acid (typed)
 *   5  sulfuric acid: type its concentration                                          -> two H+ for each acid particle
 *   6  an indicator that changes early: type the gap to the equivalence point        -> endpoint
 *   7  permanganate against iron(II), purple needs no indicator: type the iron        -> a mole ratio of 5 to 1
 *   8  sealed: the bath's sulfuric acid, type its concentration
 *
 * THE TEACHING STANCE. The base's strength is printed on the burette (a constant is given), the acid's strength never is when it is
 * the answer. A flask's colour and its window are the planners' answers at the burette's reading. Nothing is read off: the figure
 * typed is worked from the reading the player took. No pH value is shown anywhere.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, stmt, plaqueFixture, fixed } from '../../table/kits/pot.js';
import { titratorFixture, titratorRead, indicatorCard } from '../../table/kits/pot-titrate.js';
import {
  flaskAt, equivalenceMl, endpointMl, acidMolarity, acidMoles, permanganateAt, permanganateEndMl, ironMolarity
} from '../../engine/reactdata-titrate.js';

export const meta = { stageCount: 8 };

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
const SYS4 = { acid: { M: 0.18, mL: 25, nH: 1 }, base: { M: 0.2, nOH: 1 } };      // stage 4: hydrochloric acid of an unknown strength
const SYS5 = { acid: { M: 0.072, mL: 25, nH: 2 }, base: { M: 0.1, nOH: 1 } };     // stage 5: sulfuric acid
const SYS6 = { acid: { M: 0.02, mL: 25, nH: 1 }, base: { M: 0.02, nOH: 1 } };     // stage 6: a dilute pair, methyl orange
const PERM7 = { fe: { M: 0.09, mL: 25 }, mn: { M: 0.02 } };                       // stage 7: iron(II) against permanganate
const SYS8 = { acid: { M: 0.45, mL: 25, nH: 2 }, base: { M: 0.5, nOH: 1 } };      // stage 8: the bath's sulfuric acid

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
// Stage 4 and 5 and 8: the acid's strength, and the burette reading that the colour change gives.
const ANS4 = SYS4.acid.M;
const ANS5 = SYS5.acid.M;
const ANS8 = SYS8.acid.M;
// Stage 6.
const EQ6 = equivalenceMl(SYS6);
const END6 = endpointMl(SYS6, MO, STEP);
const GAP6 = EQ6 - END6;
const UNIT6 = 0.00002;
// Stage 7.
const ANS7 = PERM7.fe.M;

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const typedValue = (t, id) => entryNumber(t, id);
const within = (v, want, tol) => Math.abs(v - want) <= tol;

/** The burette reading at which the player first saw the flask change colour, or null when it has not. */
function firstChange(t, fid) {
  const r = titratorRead(t, fid);
  const p = r.f.props;
  if (p.mode === 'perm') {
    for (const row of r.rows) if (permanganateAt(p.perm.fe, p.perm.mn, row.x).colour !== 'pale') return row.x;
    return null;
  }
  const start = flaskAt(p.sys, 0, r.indicator).colour;
  for (const row of r.rows) if (flaskAt(p.sys, row.x, r.indicator).colour !== start) return row.x;
  return null;
}

/** A refusal of a typed figure that names the burette's own reading. */
function missMsg(t, fid, shown, unit) {
  const r = titratorRead(t, fid);
  if (!r.rows.length) return { ok: false, msg: 'The burette has not been used yet.' };
  const seen = firstChange(t, fid);
  const tail = seen == null ? 'the flask has not changed colour yet.' : `the flask first changed colour at ${fixed(seen, 1)} mL.`;
  return { ok: false, msg: `${shown} ${unit} does not follow from the burette: ${tail}` };
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'How Much Base',
    // A PREDICT STAGE: the burette is not on the table yet. The guess is made first and comes back with the test.
    predict: true,
    prompt: 'Choose how much of the base it takes to use up all the acid.',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 12 + Math.floor(i / 2) * 16 })),
      fixtures: [plaqueFixture('facts', 'Acid and base', { x: 118, y: 18 }, [
        '25.0 mL of 0.100 mol/L acid', 'Base: 0.250 mol/L', 'mol/L is the mol in every litre.', 'One base particle uses up one acid particle.'
      ], { w: 58 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the four cards and the slot.',
      'Compare how many particles are in a litre of the acid with how many are in a litre of the base.',
      'Work out how many acid particles the flask holds, then how much of the base holds that many.'
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
      body: 'Next, run the base into a flask of the acid and see where it takes.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { sys: SYS2, presses: [0.5, 1, 2, 5], named: false, baseName: 'Base', acidName: 'acid' });
    return {
      id: 's2-colour',
      title: 'Watch the Colour',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `You guessed ${GUESS[g]}. ` : '';
        return `${guess}Add base until the dye in the flask first changes colour.`;
      },
      widget,
      table: potTable({
        pieces: [indicatorCard('ph', PH, { x: 100, y: 24 })],
        fixtures: [t.fixture, plaqueFixture('facts', 'Acid', { x: 120, y: 10 }, ['25.0 mL of 0.100 mol/L acid'], { w: 50 })],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Use the card, the slot beside the flask, the "Per press" dial and "Open Tap".',
        'Watch the flask and the reading together as the base runs in.',
        'Take big presses at first and small ones as the flask starts to look different.'
      ],
      check(state) {
        const r = titratorRead(state.table, 'tit');
        if (!r.rows.length) return { ok: false, notYet: true, msg: 'Nothing has run into the flask yet.' };
        if (!r.indicator) return { ok: false, msg: `The flask has no dye in it, and it reads ${fixed(r.vMl, 1)} mL.` };
        if (r.colour === 'colourless') return { ok: false, msg: `The flask is still colourless at ${fixed(r.vMl, 1)} mL.` };
        if (r.vMl > END2 + 1.0) return { ok: false, msg: `The flask had already changed colour before the reading reached ${fixed(r.vMl, 1)} mL.` };
        return { ok: true };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS_VALUE[g] != null
          ? (GUESS_VALUE[g] === EQ2 ? 'Your guess was right, and the flask changed colour a half step after it. ' : `Your guess was ${GUESS[g]}, and the flask changed at ${fixed(END2, 1)} mL. `)
          : '';
        return {
          log: `The flask changed colour at ${fixed(END2, 1)} mL.`,
          title: 'Titration',
          body: `${verdict}A titration runs a measured volume of one solution from a burette into a known volume of another until they have just met. An indicator is a dye that changes colour there, and 25.0 mL of this acid took only ${fixed(END2, 1)} mL of base.`
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
      prompt: 'Stop the burette where the base has exactly used up the acid in the flask.',
      widget,
      table: potTable({
        fixtures: [t.fixture, plaqueFixture('facts', 'Acid', { x: 127, y: 12 }, ['25.0 mL of acid', '0.200 mol/L'], { w: 40 })],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Use the "Per press" dial and "Open Tap", and watch the window.',
        'Compare the discs of H+ with the discs of OH- as the reading grows.',
        'Each press of the same size changes the discs by the same amount, so count what is left and press that much.'
      ],
      check(state) {
        const r = titratorRead(state.table, 'tit');
        if (!r.rows.length) return { ok: false, notYet: true, msg: 'Nothing has run into the flask yet.' };
        if (within(r.vMl, EQ3, 0.01)) return { ok: true };
        const n = (r.flask.acidLeft || r.flask.baseLeft) / UNIT3;
        return r.flask.acidLeft > 0
          ? { ok: false, msg: `The window still shows ${fixed(n, 1)} discs of H+ at ${fixed(r.vMl, 1)} mL.` }
          : { ok: false, msg: `The window shows ${fixed(n, 1)} discs of OH- left over at ${fixed(r.vMl, 1)} mL.` };
      },
      reward: {
        log: `${fixed(EQ3, 1)} mL of base used up the acid.`,
        title: 'Equivalence Point',
        body: 'The equivalence point is where the moles of base added equal the moles of acid in the flask, so nothing is left of either. Here it took 20.0 mL of 0.250 mol/L base to meet the acid in 25.0 mL.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { sys: SYS4, acidName: 'HCl' });
    return {
      id: 's4-unknown',
      title: 'The Acid in the Flask',
      prompt: 'Type the concentration of the acid in the flask in mol/L.',
      entry: { id: 'M', label: 'Acid strength', unit: 'mol/L' },
      widget,
      table: potTable({
        pieces: [indicatorCard('ph', PH, { x: 100, y: 24 })],
        fixtures: [t.fixture],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Use the card, the "Per press" dial and "Open Tap", then type the strength.',
        'Compare the burette reading at the colour change with the 25.0 mL of acid in the flask.',
        'The base that has run in at the colour change holds as many particles as the acid, so find the acid\'s share of each litre.'
      ],
      check(state) {
        const t2 = state.table;
        const v = typedValue(t2, 'M');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the strength in mol/L.' };
        if (within(v, ANS4, 0.006)) return { ok: true };
        return missMsg(t2, 'tit', fixed(v, 3), 'mol/L');
      },
      reward: {
        log: 'The acid is 0.180 mol/L.',
        title: 'Counting Acid by Base',
        body: 'At the colour change the moles of base run in equal the moles of acid, and the moles of acid divided by 0.0250 L is its concentration. About 23 mL of 0.200 mol/L base met 25.0 mL of the acid, so the acid is the weaker of the two, 0.180 mol/L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { sys: SYS5, acidName: 'H₂SO₄' });
    return {
      id: 's5-sulfuric',
      title: 'Sulfuric Acid',
      prompt: 'Type the concentration of the sulfuric acid in the flask in mol/L.',
      entry: { id: 'M', label: 'Acid strength', unit: 'mol/L' },
      widget,
      table: potTable({
        pieces: [indicatorCard('ph', PH, { x: 100, y: 24 })],
        fixtures: [t.fixture, plaqueFixture('facts', 'Sulfuric acid', { x: 118, y: 8 }, ['Each H₂SO₄ particle gives 2 H+.'], { w: 56 })],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Use the card, the "Per press" dial and "Open Tap", then type the strength.',
        'Compare how many H+ one acid particle gives here with how many one HCl gave before.',
        'Count the base particles that run in, then share them out among the H+ of each acid particle.'
      ],
      check(state) {
        const t2 = state.table;
        const v = typedValue(t2, 'M');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the strength in mol/L.' };
        if (within(v, ANS5, 0.0025)) return { ok: true };
        return missMsg(t2, 'tit', fixed(v, 3), 'mol/L');
      },
      reward: {
        log: 'The sulfuric acid is 0.0720 mol/L.',
        title: 'Two H+ for One Acid',
        body: 'Each sulfuric acid particle gives two H+, so it takes two OH- to use it up. The 36.5 mL of 0.100 mol/L base held twice as many particles as the acid, so the acid is half of 0.146 mol/L: 0.0720 mol/L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const t = titratorFixture('tit', { x: 55, y: 32 }, { sys: SYS6, window: true, unit: UNIT6, acidName: 'acid' });
    return {
      id: 's6-endpoint',
      title: 'An Early Dye',
      prompt: 'Type how many mL the burette gives between the first colour change and the equivalence point.',
      entry: { id: 'gap', label: 'Between them', unit: 'mL' },
      widget,
      table: potTable({
        pieces: [indicatorCard('mo', MO, { x: 127, y: 26 })],
        fixtures: [t.fixture, plaqueFixture('facts', 'Acid', { x: 127, y: 12 }, ['25.0 mL of acid', '0.0200 mol/L'], { w: 40 })],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Use the card, the "Per press" dial and "Open Tap", and watch the flask and the window.',
        'Note the reading when the flask first changes colour, and the reading when the window shows nothing left over of either.',
        'Take small presses near each of the two readings, then find how far apart they are.'
      ],
      check(state) {
        const t2 = state.table;
        const v = typedValue(t2, 'gap');
        if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Type the number of mL.' };
        if (within(v, GAP6, 0.3)) return { ok: true };
        const r = titratorRead(t2, 'tit');
        if (!r.rows.length) return { ok: false, msg: 'The burette has not been used yet.' };
        const seen = firstChange(t2, 'tit');
        const tail = seen == null ? 'the flask has not changed colour yet.' : `the flask first changed colour at ${fixed(seen, 1)} mL.`;
        return { ok: false, msg: `${fixed(v, 1)} mL does not match the readings: ${tail}` };
      },
      reward: {
        log: `The colour changed ${fixed(GAP6, 1)} mL before the equivalence point.`,
        title: 'Endpoint',
        body: 'The endpoint is where the indicator changes colour, and the equivalence point is where the moles match. Methyl orange changed 1.5 mL early in this weak solution; a good titration uses a dye whose endpoint lies close to the equivalence point.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { named: true, perm: PERM7, indicator: false, baseName: 'Permanganate', acidName: 'Fe²⁺ sample' });
    return {
      id: 's7-permanganate',
      title: 'Purple Base',
      prompt: 'Type the concentration of the Fe²⁺ ions in the flask in mol/L.',
      entry: { id: 'M', label: 'Iron strength', unit: 'mol/L' },
      widget,
      table: potTable({
        fixtures: [t.fixture, plaqueFixture('facts', 'Permanganate and iron', { x: 118, y: 18 }, [
          '5 Fe²⁺ + MnO₄⁻ + 8 H+ →', '5 Fe³⁺ + Mn²⁺ + 4 H₂O', 'Only the 5 to 1 count is used here.', 'Purple needs no indicator.'
        ], { w: 56 })],
        zones: { slots: [] }
      }),
      hints: [
        'Use the "Per press" dial and "Open Tap", then type the strength.',
        'Watch for the first purple that stays in the flask, and read the burette there.',
        'Count the permanganate particles that ran in, then scale them up by the count in the equation to the iron they met.'
      ],
      check(state) {
        const t2 = state.table;
        const v = typedValue(t2, 'M');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the strength in mol/L.' };
        if (within(v, ANS7, 0.005)) return { ok: true };
        return missMsg(t2, 'tit', fixed(v, 4), 'mol/L');
      },
      reward: {
        log: 'The iron is 0.0900 mol/L.',
        title: 'A Dye of Its Own',
        body: 'Permanganate is purple, so the first purple that stays is the endpoint with no indicator at all. Each permanganate particle met five Fe²⁺, so the 23.0 mL of 0.0200 mol/L run in showed 0.0900 mol/L of iron in the sample.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const t = titratorFixture('tit', { x: 47, y: 32 }, { sys: SYS8, acidName: 'H₂SO₄' });
    return {
      id: 's8-bath',
      title: 'The Pickling Bath',
      prompt: 'Type the concentration of the acid from the pickling bath in the sealed flask in mol/L.',
      entry: { id: 'M', label: 'Acid strength', unit: 'mol/L' },
      widget,
      table: potTable({
        pieces: [indicatorCard('ph', PH, { x: 100, y: 24 })],
        fixtures: [t.fixture],
        zones: { slots: [...t.slots] }
      }),
      hints: [
        'Use the card, the "Per press" dial and "Open Tap", then type the strength.',
        'Compare the base run in at the colour change with the acid in the flask, and think about how many H+ each acid particle gives.',
        'Share the base particles out among the H+ of each acid particle, then divide by the flask\'s volume in litres.'
      ],
      check(state) {
        const t2 = state.table;
        const v = typedValue(t2, 'M');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the strength in mol/L.' };
        if (within(v, ANS8, 0.012)) return { ok: true };
        return missMsg(t2, 'tit', fixed(v, 3), 'mol/L');
      },
      reward: {
        log: 'The pickling bath acid is 0.450 mol/L.',
        title: 'The Bath Is Counted',
        body: 'The bath\'s sulfuric acid is 0.450 mol/L: 45.5 mL of 0.500 mol/L base met 25.0 mL of it, with two H+ for each acid particle. A titration counts an acid by the base that meets it.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose', 'into the slot.'],
  2: ['Drag the card into the slot,', 'set the dial, press the key.'],
  3: ['Set the dial, press the key,', 'then watch the window.'],
  4: ['Drag the card into the slot,', 'run the base in, then type.'],
  5: ['Drag the card into the slot,', 'run the base in, then type.'],
  6: ['Drag the card into the slot,', 'run the base in, then type.'],
  7: ['Run the base in,', 'then type your answer.'],
  8: ['Drag the card into the slot,', 'run the base in, then type.']
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
      body: 'A titration counts an acid by the base that meets it. The base used at the equivalence point holds as many particles as the acid, and an indicator only shows that point nearly. The pickling bath is 0.450 mol/L.'
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
/** A press setting by the mL it lets out (a dial position is its place in the stage's list). */
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
  [put('mo', 'slot:tit.mouth'), press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), typed('gap', '1.5')],
  [press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), typed('M', '0.09')],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(4, run('tit')), press(L5, 5), run('tit'), press(L5, 0.5), run('tit'), typed('M', '0.45')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('ph', 'slot:tit.mouth'), press(L4, 5), ...times(3, run('tit'))],
  [press(L4, 5), ...times(4, run('tit')), press(L4, 0.5), run('tit')],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), typed('M', '0.2')],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(3, run('tit')), press(L5, 5), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), typed('M', '0.146')],
  [put('mo', 'slot:tit.mouth'), press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), press(L5, 1), run('tit'), press(L5, 0.5), run('tit'), typed('gap', '0')],
  [press(L5, 10), ...times(2, run('tit')), press(L5, 2), run('tit'), press(L5, 1), run('tit'), typed('M', '0.0184')],
  [put('ph', 'slot:tit.mouth'), press(L5, 10), ...times(4, run('tit')), press(L5, 5), run('tit'), press(L5, 0.5), run('tit'), typed('M', '0.91')]
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
  SYS2, SYS3, SYS4, SYS5, SYS6, SYS8, PERM7, GUESS_VALUE, UNIT3, UNIT6, STEP,
  answers: {
    eq2: EQ2, end2: END2, eq3: EQ3, conc4: ANS4, conc5: ANS5, eq6: EQ6, end6: END6, gap6: GAP6, conc7: ANS7, conc8: ANS8,
    perm7End: permanganateEndMl(PERM7.fe, PERM7.mn, STEP),
    // What the player's own reading gives (one step past the equivalence point), for the checks to compare with.
    fromReading4: acidMolarity(SYS4.base, endpointMl(SYS4, PH, STEP), SYS4.acid.mL, 1),
    fromReading7: ironMolarity(PERM7.mn, permanganateEndMl(PERM7.fe, PERM7.mn, STEP), PERM7.fe.mL)
  },
  moles: { acid3: acidMoles(SYS3), acid5: acidMoles(SYS5) }
};
