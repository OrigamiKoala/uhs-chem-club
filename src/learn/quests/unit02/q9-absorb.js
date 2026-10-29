/**
 * q9-absorb.js — Lanternfall, bench nine: SPECTROSCOPY.
 *
 * The cuvette sled, the last thing Lanternfall asks and the one a chemist actually uses. The first eight benches asked what light does to an
 * atom; this one asks what a solution does to a beam, and how much. It runs from why a copper solution is blue, to the colour a solution
 * takes in best, to how much it takes in as it gets stronger, and ends on a calibration line.
 *
 * The ninth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4c), on the cuvette kit (`table/kits/cuvette.js`), reworked on
 * 2026-10-23 around ONE CLICK. Cuvettes are filled by hand with a dropper (a drop is a fixed strength, so drops are concentration), slid into
 * the spectrometer's beam and read live; "Record" drops a point on the sheet; the straightedge is laid across the points for the
 * calibration line. At `3D On` the cuvette is a glass cell with a liquid column in it, and a beam of light runs through the well
 * (`cuvette.js` `dress3d`), dimmer on the far side by exactly what the reading says.
 *
 * THE CLICK. A player looks at a blue solution and thinks it takes in blue, or gives blue out. So the guess (blue, orange or violet) is asked
 * with no spectrometer on the table, and then a strip of the light that gets through the cell shows that the colour missing is
 * the one opposite, orange, and the blue is what is left.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  PREDICT: which colour of white light the copper solution takes out (no spectrometer)  -> a guess before the evidence
 *   2  TEST: put the colour the strip shows missing in the slot                              -> complementary colour
 *   3  tune the wavelength to peak absorbance (where the solution absorbs light most strongly)-> absorbance
 *   4  fill Cuvette B so that it takes in twice as much light as Cuvette A                   -> a straight line through zero
 *   5  fill standards, lay the straightedge, read the sealed sample's strength               -> the calibration curve
 *
 * Cut on 2026-10-23 (problems doc T6, T7, U3): what microwave, infrared and ultraviolet light do to a molecule and the three readings
 * (a lecture, in two stages, that the bench does not use again), doubling the path (stage 4 again with a different dial), the rule
 * A = epsilon b c as a prediction (AP depth), and the lake-water blank, a field fetch that carried a copy of an empty cuvette.
 *
 * Every number on the bench is A = epsilon x b x c, asked of `planAbsorb` in `lightdata.js`: copper(II) sulfate absorbs near 630 nm and
 * permanganate near 525 nm, as measured. Stage 5's line is drawn from the standards the player fills and the sealed sample's reading is one
 * more point on the same relation, so nothing on the bench is authored twice.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  cuvetteTable, cuvette, dropper, rinser, chip, spectro, plaqueFixture, markerFixture,
  spectroRead, regionRead, absorbOf, concOf, missingColour, colourOfNm, chipIn, lightOf, fmtWave, markerRead, planAbsorb, planRegion, regionOf,
  COLOURS, COPPER_SWEEP, PATHS, REGIONS, DROP, MAX_DROPS, SOLUTES, gotThrough
} from '../../table/kits/cuvette.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bcomplementary colou?rs?\b/i, introducedAt: 2 },
  { term: /\babsorbance\b/i, introducedAt: 3 },
  { term: /\bcalibration curves?\b/i, introducedAt: 5 }
];

export const BUILDS_ON = ['unit02/q1-wave', 'unit02/q3-lines'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q9-absorb';
const GUESS_LABEL = { blue: 'Blue', orange: 'Orange', violet: 'Violet' };

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const SP = 'sp';
const BEAM = `slot:${SP}.cuv`;
const SPEC_AT = { x: 39, y: 22 };

/** What the copper solutions of this quest are made of, and the strengths the stages ask for (mol/L). */
export const SEALED_CONC = 0.005;
export const COPPER = 0.01;

const REC = { at: { x: 113, y: 13 }, size: { w: 42, h: 24 } };
const recorder = (xLabel, xUnit) => ({ ...REC, xLabel, xUnit, yLabel: 'Absorbance', yUnit: '' });

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'A Blue Solution',
    // A PREDICT STAGE: the spectrometer is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'White light passes through a blue copper solution: which colour do you think the solution takes out?',
    widget,
    table: cuvetteTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'blue', label: 'Blue', at: { x: 38, y: 48 }, r: 7 },
          { id: 'orange', label: 'Orange', at: { x: 75, y: 48 }, r: 7 },
          { id: 'violet', label: 'Violet', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three guesses into the slot.',
      'Think about what is left of white light once one colour has been taken out of it, and what colour that leaves.',
      'There is no wrong guess yet; commit to the one you would bet on.'
    ],
    check(state) {
      if (!state.table.prediction?.token) return { ok: false, notYet: true, msg: 'Put a guess in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const token = state.table.prediction?.token;
      if (token) remember(QUEST_KEY, token);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'A blue solution looks blue, so taking blue out or putting blue in are both fair guesses. Next, a spectrometer will show what light gets through.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { strip: true, label: 'White light through the cuvette' });
    const chips = COLOURS.map((c, i) => chip(`c-${c.id}`, c.label, c.nm, { x: 14 + i * 22, y: 53 }));
    return {
      title: 'Complementary Color',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": which colour does the copper solution take out of white light?`
          : 'Which colour does the copper solution take out of white light?';
      },
      widget,
      table: cuvetteTable({
        pieces: [cuvette('cu', 'TANK WATER', { x: 0, y: 0 }, { conc: COPPER, zone: BEAM }), ...chips],
        fixtures: [sp.fixture],
        zones: { slots: [...sp.slots, { id: 'taken', label: 'Taken out', at: { x: 118, y: 24 }, size: { w: 11, h: 11 } }] }
      }),
      hints: [
        'Use the strip, which shows the light that gets through the cuvette, and the slot for a colour chip.',
        'Compare the colours missing from that strip with the colour the solution looks.',
        'Find where the strip is darkest, then put the chip for the colour of the spectrum at that place in the slot.'
      ],
      check(state) {
        const t = state.table;
        const c = chipIn(t, 'taken');
        if (!c) return { ok: false, notYet: true, msg: 'Put a colour chip in the slot.' };
        if (c.id === missingColour('cuso4').id) return { ok: true };
        return { ok: false, msg: 'That colour still gets through the cuvette.' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'orange'
          ? 'You predicted orange, and the strip agreed. '
          : 'The strip did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'Orange missing, so the rest looks blue.',
          title: 'Complementary Colour',
          body: `${verdict}A solution looks the colour opposite the one it takes in: copper(II) sulfate removes orange and leaves blue. The colour you see is the complementary colour of the light that is missing.`,
          model: { type: 'cuvette', solute: 'cuso4', conc: 0.01, nm: 630, mode: 'white', caption: 'White light enters the copper solution: copper(II) ions absorb orange photons, allowing blue light to pass through.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { tune: true, xAxis: 'nm', label: 'Spectrometer' });
    return {
      title: 'Peak Absorbance',
      prompt: 'Set the wavelength of maximum absorbance for the solution.',
      widget,
      table: cuvetteTable({
        pieces: [cuvette('cu', 'TANK WATER', { x: 0, y: 0 }, { conc: COPPER, zone: BEAM })],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }, { recorder: recorder('Wavelength', 'nm') }),
      hints: [
        'Use the Wavelength dial and "Record" at each setting.',
        'Compare the absorbance readings across the spectrum to find the peak.',
        'Stop the dial on the wavelength where absorbance is highest.'
      ],
      check(state) {
        const t = state.table;
        const start = 2;
        const now = Math.round(t.fixtures[SP].dials.nm.value);
        const reads = COPPER_SWEEP.map(nm => planAbsorb('cuso4', nm, 1, COPPER));
        const best = reads.indexOf(Math.max(...reads)) + 1;
        if (now === start && t.recorder.rows.length === 0) return { ok: false, notYet: true, msg: 'The lamp is where it started.' };
        if (now === best) return { ok: true };
        return { ok: false, msg: 'This setting does not give the maximum absorbance.' };
      },
      reward: {
        log: 'Absorbance peaks near 630 nm.',
        title: 'Absorbance',
        body: 'Absorbance measures how much light a solution absorbs at a given wavelength. It is highest at the absorption maximum (λ_max), where the solution absorbs light most strongly. Measuring at this peak gives the largest and most reliable reading.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { xAxis: 'conc', word: 'ABSORBANCE', label: 'Spectrophotometer' });
    return {
      title: 'Concentration and Absorbance',
      prompt: 'Prepare Cuvette B so that its absorbance is twice that of Cuvette A.',
      widget,
      table: cuvetteTable({
        pieces: [
          cuvette('a', 'CUVETTE A', { x: 18, y: 53 }, { drops: 2 }), cuvette('b', 'CUVETTE B', { x: 42, y: 53 }, { drops: 0 }),
          dropper('drop', { x: 70, y: 52 }), rinser('empty', { x: 92, y: 52 })
        ],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }, { recorder: recorder('Concentration', 'mmol/L') }),
      hints: [
        'Use Cu²⁺ Stock to increase concentration in Cuvette B, then slide it into the beam.',
        'Compare the absorbance of Cuvette A with Cuvette B as you add stock solute.',
        'Add stock until Cuvette B reaches 8.0 mmol/L, giving twice the absorbance of Cuvette A.'
      ],
      check(state) {
        const t = state.table;
        const a = absorbOf(t.pieces.a);
        const b = absorbOf(t.pieces.b);
        if (!(concOf(t.pieces.b) > 0)) return { ok: false, notYet: true, msg: 'Cuvette B has no solute added.' };
        if (a > 0 && Math.abs(b - 2 * a) < 0.0005) return { ok: true };
        return { ok: false, msg: b > 2 * a ? 'Cuvette B absorbance is too high.' : 'Cuvette B absorbance is too low.' };
      },
      reward: {
        log: 'Twice the concentration, twice the absorbance.',
        title: 'Concentration and Absorbance',
        body: 'Absorbance depends on solute concentration, not liquid volume. Doubling the dissolved molecules in the beam path doubles the light absorbed (A ∝ c).',
        model: { type: 'cuvette', solute: 'cuso4', conc: 0.008, nm: 630, caption: 'Doubling concentration doubles absorbing copper(II) ions in the beam path, doubling absorbance.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { xAxis: 'conc', word: 'ABSORBANCE', label: 'Spectrophotometer' });
    return {
      title: 'Calibration Curve',
      prompt: 'Determine the concentration of the unknown sample using the calibration line.',
      widget,
      table: cuvetteTable({
        pieces: [
          cuvette('s1', 'STANDARD 1', { x: 14, y: 53 }, { drops: 0 }), cuvette('s2', 'STANDARD 2', { x: 36, y: 53 }, { drops: 0 }), cuvette('s3', 'STANDARD 3', { x: 58, y: 53 }, { drops: 0 }),
          cuvette('sealed', 'SEALED SAMPLE', { x: 80, y: 53 }, { conc: SEALED_CONC, sealed: true }),
          dropper('drop', { x: 104, y: 52 }), rinser('empty', { x: 124, y: 52 })
        ],
        fixtures: [sp.fixture, markerFixture('conc', 'Unknown sample (mmol/L)', { x: 122, y: 35 }, { max: 8, step: 0.5, w: 44 })],
        zones: { slots: sp.slots },
        tools: ['straightedge']
      }, { recorder: { ...recorder('Concentration', 'mmol/L'), at: { x: 113, y: 13 } } }),
      hints: [
        'Prepare the standards with stock solute, record each in the spectrophotometer, and lay the straightedge.',
        'Find where the unknown sample\'s absorbance falls on the line.',
        'Set the marker to the concentration that matches the unknown sample\'s absorbance on the calibration line.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'conc');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the unknown sample\'s concentration.' };
        if (v === SEALED_CONC * 1000) return { ok: true };
        return { ok: false, msg: 'The marker does not match the unknown sample\'s absorbance on the calibration line.' };
      },
      reward: {
        log: 'Calibration line gave the unknown concentration.',
        title: 'Calibration Curve',
        body: 'Standards of known concentration establish the linear relationship between absorbance and concentration. An unknown sample\'s absorbance is then read off the line to determine its exact concentration.',
        model: { type: 'cuvette', solute: 'cuso4', conc: SEALED_CONC, nm: 630, caption: 'Unknown sample: concentration is determined directly from its absorbance on the calibration line.' },
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Put the cuvette in the holder to see the light', 'that gets through it.'],
  3: ['Put a cuvette in the holder and turn the', 'Wavelength dial.'],
  4: ['Stock adds +2.0 mmol/L;', 'Rinse resets to 0.0 mmol/L.']
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
      body: 'Absorbance depends on solute concentration, not liquid volume. In a standard 1.0 cm cell, doubling concentration doubles the absorbing particles encountered by the light beam, doubling absorbance (A = ε·b·c).'
    },
    {
      heading: 'Why It Matters',
      body: 'Spectrophotometry quantifies dissolved compounds directly from absorbance. Constructing a calibration curve from known standards allows rapid determination of unknown sample concentrations.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions, by drag
   and by two taps. Cuvettes are filled with drops, slid into the beam and recorded, the straightedge is laid, a marker is set.
   Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const drops = (id, n) => Array.from({ length: n }, () => ({ join: ['drop', id] }));
const read = id => [put(id, BEAM), { run: SP }];

export const SOLUTIONS = [
  [{ predict: 'orange' }],
  [put('c-orange', 'slot:taken')],
  [dial(SP, 'nm', 3), { run: SP }, dial(SP, 'nm', 4), { run: SP }, dial(SP, 'nm', 5), { run: SP }, dial(SP, 'nm', 6), { run: SP }, dial(SP, 'nm', 5)],
  [...read('a'), ...drops('b', 4), ...read('b')],
  [
    ...drops('s1', 1), ...drops('s2', 2), ...drops('s3', 3), ...read('s1'), ...read('s2'), ...read('s3'),
    { lay: { kind: 'straightedge', through: [0, 2] } }, ...read('sealed'), dial('conc', 'value', 5)
  ]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('c-blue', 'slot:taken')],
  [dial(SP, 'nm', 3), { run: SP }, dial(SP, 'nm', 4), { run: SP }],
  [...read('a'), ...drops('b', 2), ...read('b')],
  [...drops('s1', 1), ...drops('s2', 2), ...drops('s3', 3), ...read('s1'), ...read('s2'), ...read('s3'), { lay: { kind: 'straightedge', through: [0, 2] } }, ...read('sealed'), dial('conc', 'value', 4)]
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
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { spectroRead, regionRead, absorbOf, concOf, missingColour, colourOfNm, chipIn, lightOf, fmtWave, markerRead, planAbsorb, planRegion, regionOf, COLOURS, COPPER_SWEEP, PATHS, REGIONS, DROP, MAX_DROPS, SOLUTES, gotThrough, QUEST_KEY };
