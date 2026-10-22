/**
 * q9-absorb.js — Lanternfall, bench nine: SPECTROSCOPY.
 *
 * The cuvette sled, the last thing Lanternfall asks and the one a chemist actually uses. The first eight benches asked what light does to an
 * atom; this one asks what a solution does to a beam, and how much. It runs from what each kind of light does to a molecule, through why a
 * copper solution is blue, to Beer-Lambert and a calibration line.
 *
 * The ninth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4c), on the cuvette kit (`table/kits/cuvette.js`). Cuvettes are filled
 * by hand with a dropper (a drop is a fixed strength, so drops are concentration), slid into the spectrometer's beam and read live; "Record" drops
 * a point on the sheet; the straightedge is laid across the points for the calibration line. It is beyond the exam, and says so.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  what microwave, infrared and ultraviolet do to a molecule  -> molecular spectroscopy
 *   2  three readings, matched to the light behind them           -> bigger jumps, shorter waves
 *   3  why the copper solution looks blue                         -> complementary colour
 *   4  the best wavelength to measure at                          -> absorbance
 *   5  doubling the concentration                                 -> absorbance doubles
 *   6  doubling the path                                          -> so does the dimming
 *   7  the rule connecting the three                              -> the Beer-Lambert law
 *   8  the concentration of a sealed sample                       -> the calibration curve
 *
 * Every number on the bench is A = epsilon x b x c, asked of `planAbsorb` in `lightdata.js`: copper(II) sulfate absorbs near 630 nm and
 * permanganate near 525 nm, as measured. Stage 8's line is drawn from the standards the player fills and the sealed sample's reading is one more
 * point on the same relation, so nothing on the bench is authored twice.
 *
 * FIELD (stage 5). A blank can be drawn at the hole cut through the lake ice: lake water in a cuvette, which reads nothing, and puts the origin
 * on the sheet. It is evidence, never a lock; the field point is a real piece of the host (`lanternfall/stations.js` `buildWaterHole`), and at
 * T1 to T3 the same fetch is a drawn site plate.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import {
  cuvetteTable, cuvette, dropper, rinser, chip, motionCard, readingCard, spectro, plaqueFixture, markerFixture,
  spectroRead, regionRead, absorbOf, concOf, missingColour, colourOfNm, chipIn, lightOf, fmtWave, markerRead, planAbsorb, planRegion, regionOf,
  COLOURS, COPPER_SWEEP, PATHS, REGIONS, DROP, MAX_DROPS, SOLUTES, gotThrough
} from '../../table/kits/cuvette.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmolecular spectroscopy\b/i, introducedAt: 1 },
  { term: /\bcomplementary colou?rs?\b/i, introducedAt: 3 },
  { term: /\babsorbance\b/i, introducedAt: 4 },
  { term: /\bbeer.?lambert\b/i, introducedAt: 7 },
  { term: /\bcalibration curves?\b/i, introducedAt: 8 }
];

export const BUILDS_ON = ['unit02/q1-wave', 'unit02/q3-lines'];

const SPEAKER = 'Vess';

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

const where = (t, id) => (t.pieces[id].zone || '').replace(/^(tray|slot):/, '');
const REC = { at: { x: 112, y: 13 }, size: { w: 30, h: 18 } };
const recorder = (xLabel, xUnit) => ({ ...REC, xLabel, xUnit, yLabel: 'Reading', yUnit: '' });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { region: true, label: 'Light and a molecule' });
    const slot = (id, label, y) => ({ id, label, at: { x: 124, y }, size: { w: 11, h: 11 } });
    return {
      title: 'What Each Light Does',
      briefing: {
        speaker: SPEAKER,
        body: 'This bench shines radiation through a cuvette to measure how much of it a sample takes in. Turn the light dial to choose the kind of radiation and watch the molecule.'
      },
      prompt: 'Put each kind of light beside the motion it makes in the molecule.',
      widget,
      table: cuvetteTable({
        pieces: [
          motionCard('stretches', 'Stretches and bends its bonds', { x: 18, y: 53 }),
          motionCard('jumps', 'Moves an electron up a level', { x: 54, y: 53 }),
          motionCard('spins', 'Spins the molecule', { x: 90, y: 53 })
        ],
        fixtures: [sp.fixture],
        zones: { slots: [slot('microwave', 'Microwave', 10), slot('infrared', 'Infrared', 27), slot('uv', 'UV and visible', 44)] }
      }),
      hints: [
        'Turn the light dial through its three settings and watch what the molecule does.',
        'Compare how the molecule moves under each setting, and note which movement belongs to which kind of light.',
        'Match the whole molecule turning to the longest waves, the bond changing length to the middle ones, and the electron to the shortest.'
      ],
      check(state) {
        const t = state.table;
        const want = { microwave: 'spins', infrared: 'stretches', uv: 'jumps' };
        const seat = k => Object.values(t.pieces).find(p => p.zone === `slot:${k}`)?.id || null;
        if (Object.keys(want).some(k => !seat(k))) return { ok: false, notYet: true, msg: 'Match all three kinds of light.' };
        for (const k of Object.keys(want)) {
          if (seat(k) !== want[k]) return { ok: false, msg: 'Turn the light dial to that kind of light and watch what the molecule does before you match it.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'Three lights, three movements.',
        title: 'Molecular Spectroscopy',
        body: 'Microwaves make a molecule spin, infrared makes its bonds stretch and bend, and ultraviolet or visible light lifts an electron to a higher energy level. Reading which light a substance takes in, and how much, is molecular spectroscopy.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const tray = (id, label, x) => ({ id, label, at: { x, y: 30 }, size: { w: 36, h: 22 }, cell: 25 });
    return {
      title: 'Three Readings',
      prompt: 'Put each recorded wavelength in the tray for the kind of light that caused it.',
      widget,
      table: cuvetteTable({
        pieces: [readingCard('r1', 'READING 1', 3e7, { x: 16, y: 53 }), readingCard('r2', 'READING 2', 3e4, { x: 44, y: 53 }), readingCard('r3', 'READING 3', 300, { x: 72, y: 53 })],
        fixtures: [plaqueFixture('visible', 'Visible light', { x: 36, y: 8 }, ['380 to 750 nm'], { w: 62 })],
        zones: { trays: [tray('microwave', 'Microwave', 32), tray('infrared', 'Infrared', 76), tray('ultraviolet', 'Ultraviolet', 120)] }
      }),
      hints: [
        'Read the wavelength printed on each card.',
        'Compare each wavelength with the band of visible light on the plate, and with the order of the spectrum from the first bench.',
        'The longest wavelength belongs to the lowest-energy light and the shortest to the highest.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['r1', 'r2', 'r3'];
        if (!ids.every(id => (t.pieces[id].zone || '').startsWith('tray:'))) return { ok: false, notYet: true, msg: 'Put every reading in a tray.' };
        for (const id of ids) {
          const want = lightOf(t.pieces[id].props.nm);
          if (where(t, id) !== (want === 'uv' ? 'ultraviolet' : want)) return { ok: false, msg: 'Read each wavelength against the band of visible light and the order of the electromagnetic spectrum.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'Longer waves, smaller movements.',
        title: 'Bigger Change, Shorter Wave',
        body: 'The longer the wavelength a molecule takes in, the smaller the change it makes: a spin takes the least energy, a vibration more, and lifting an electron the most. That is why a single molecule needs three different instruments to be read in full.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { strip: true, label: 'White light through the cuvette' });
    const chips = COLOURS.map((c, i) => chip(`c-${c.id}`, c.label, c.nm, { x: 14 + i * 22, y: 53 }));
    return {
      title: 'Why Copper Looks Blue',
      prompt: 'Which colour does the copper solution take out of white light?',
      widget,
      table: cuvetteTable({
        pieces: [cuvette('cu', 'COPPER', { x: 0, y: 0 }, { conc: COPPER, zone: BEAM }), ...chips],
        fixtures: [sp.fixture],
        zones: { slots: [...sp.slots, { id: 'taken', label: 'Taken out', at: { x: 118, y: 24 }, size: { w: 11, h: 11 } }] }
      }),
      hints: [
        'Look at the strip, which shows the light that gets through the cuvette.',
        'Compare the colours missing from that strip with the colour the solution looks.',
        'Find where the strip is darkest, then put the chip for the colour of the spectrum at that place in the slot.'
      ],
      check(state) {
        const t = state.table;
        const c = chipIn(t, 'taken');
        if (!c) return { ok: false, notYet: true, msg: 'Put a colour chip in the slot.' };
        if (c.id === missingColour('cuso4').id) return { ok: true };
        return { ok: false, msg: 'That colour still gets through: compare the strip with white light and find the colour that is missing.' };
      },
      reward: {
        log: 'Orange missing, so the rest looks blue.',
        title: 'Complementary Colour',
        body: 'A solution looks like the colour opposite the one it takes in: copper(II) sulfate removes orange and leaves blue. The colour you see is the complementary colour of the light that is missing.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { tune: true, xAxis: 'nm', label: 'Spectrometer' });
    return {
      title: 'The Best Wavelength',
      briefing: {
        speaker: SPEAKER,
        body: 'You can now adjust the wavelength of the light. Turn the dial to find where the solution dims the beam most.'
      },
      prompt: 'Set the wavelength at which the solution dims the beam most.',
      widget,
      table: cuvetteTable({
        pieces: [cuvette('cu', 'COPPER', { x: 0, y: 0 }, { conc: COPPER, zone: BEAM })],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }, { recorder: recorder('Wavelength', 'nm') }),
      hints: [
        'Turn the wavelength dial and watch the dimming reading as it changes.',
        'Press "Record" at every setting, including the ones either side of the largest, and compare the points on the sheet.',
        'Stop the dial on the setting where the reading is greater than at every other.'
      ],
      check(state) {
        const t = state.table;
        const start = 2;
        const now = Math.round(t.fixtures[SP].dials.nm.value);
        const reads = COPPER_SWEEP.map(nm => planAbsorb('cuso4', nm, 1, COPPER));
        const best = reads.indexOf(Math.max(...reads)) + 1;
        if (now === start && t.recorder.rows.length === 0) return { ok: false, notYet: true, msg: 'The lamp is where it started. Sweep it and watch the reading.' };
        if (now === best) return { ok: true };
        return { ok: false, msg: 'This is not the setting with the biggest reading. Compare the readings either side of it.' };
      },
      reward: {
        log: 'The reading peaks near 630 nm.',
        title: 'Absorbance',
        body: 'How much the cuvette dims a beam is its absorbance, and it is largest at the wavelength the solution takes in best. Measuring at that peak gives the biggest and most reliable reading.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { xAxis: 'conc', word: 'ABSORBANCE', label: 'Spectrometer' });
    return {
      title: 'Doubling the Concentration',
      prompt: 'Fill Cuvette B so that it takes in twice as much light as Cuvette A.',
      widget,
      table: cuvetteTable({
        pieces: [
          cuvette('a', 'CUVETTE A', { x: 14, y: 53 }, { drops: 2 }), cuvette('b', 'CUVETTE B', { x: 36, y: 53 }, { drops: 0 }),
          dropper('drop', { x: 62, y: 53 }), rinser('empty', { x: 84, y: 53 }),
          cuvette('lake', 'LAKE WATER', { x: 106, y: 54 }, { conc: 0, blank: true, fetchFrom: 'hole', hidden: true })
        ],
        fixtures: [sp.fixture, plaqueFixture('drop-note', 'One drop = 2 mmol/L', { x: 122, y: 29 }, [], { w: 50 })],
        zones: { slots: sp.slots },
        fetch: [{ id: 'hole', label: 'Ice Hole Water', at: { x: 124, y: 45 } }]
      }, { recorder: recorder('Concentration', 'mmol/L') }),
      hints: [
        'Lay "Add Drop" on a cuvette to fill it, then slide it into the beam and read it.',
        'Compare the reading of Cuvette A with the readings of Cuvette B as you add drops to it.',
        'Add drops to Cuvette B and read it each time until its reading is twice Cuvette A\'s.'
      ],
      check(state) {
        const t = state.table;
        const a = absorbOf(t.pieces.a);
        const b = absorbOf(t.pieces.b);
        if (!(concOf(t.pieces.b) > 0)) return { ok: false, notYet: true, msg: 'Cuvette B is empty: fill it and read it.' };
        if (a > 0 && Math.abs(b - 2 * a) < 0.0005) return { ok: true };
        return { ok: false, msg: b > 2 * a ? 'Cuvette B takes in more than twice as much as Cuvette A: read both and take drops out.' : 'Cuvette B takes in less than twice as much as Cuvette A: read both and add drops.' };
      },
      reward: {
        log: 'Twice the concentration, twice the absorbance.',
        title: 'A Straight Line Through Zero',
        body: 'Twice the concentration gave twice the absorbance, and four times gave four times. That is what you would expect if each absorbing particle in the beam takes out its own share of the light.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { pathDial: true, xAxis: 'path', word: 'ABSORBANCE', label: 'Spectrometer' });
    return {
      title: 'Doubling the Path',
      briefing: {
        speaker: SPEAKER,
        body: 'You can now change the path the light takes through the cuvette. Turn the path dial to see how the distance changes the reading.'
      },
      prompt: 'Set the path so the reading is twice the reading through one centimetre.',
      widget,
      table: cuvetteTable({
        pieces: [cuvette('cu', 'COPPER', { x: 0, y: 0 }, { conc: 0.008, zone: BEAM })],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }, { recorder: recorder('Path', 'cm') }),
      hints: [
        'Turn the path dial and watch the cuvette and the reading.',
        'Press "Record" at each path length and compare the reading with the one before it.',
        'Note how the reading at each longer path compares with the reading at one centimetre.'
      ],
      check(state) {
        const t = state.table;
        const path = PATHS[Math.round(t.fixtures[SP].dials.path.value) - 1];
        const one = planAbsorb('cuso4', 630, 1, 0.008);
        const now = planAbsorb('cuso4', 630, path, 0.008);
        if (path === 1) return { ok: false, notYet: true, msg: 'The path is still one centimetre: change it and watch the reading.' };
        if (Math.abs(now - 2 * one) < 0.0005) return { ok: true };
        return { ok: false, msg: 'That path does not give twice the one-centimetre reading: compare the readings at two paths whose lengths differ by a factor of two.' };
      },
      reward: {
        log: 'Twice the path, twice the absorbance.',
        title: 'Same Effect, Another Way',
        body: 'Light that passes through twice as many absorbing particles loses twice as much, whether they are crowded into a stronger solution or spread along a longer path. Path length and concentration enter the absorbance in exactly the same way.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { pathDial: true, xAxis: 'conc', word: 'ABSORBANCE', label: 'Spectrometer' });
    const token = (id, label, x) => ({ id, label, at: { x, y: 53 }, r: 7 });
    return {
      title: 'The Rule',
      prompt: 'Predict how Cuvette B read through two centimetres compares with Cuvette A read through one.',
      widget,
      table: cuvetteTable({
        pieces: [cuvette('a', 'CUVETTE A', { x: 14, y: 53 }, { drops: 2 }), cuvette('b', 'CUVETTE B', { x: 36, y: 53 }, { drops: 4 })],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots },
        prediction: {
          slot: { id: 'predict', label: 'B against A', at: { x: 128, y: 30 }, size: { w: 24, h: 12 } },
          tokens: [token('x1', 'x1', 80), token('x2', 'x2', 94), token('x3', 'x3', 108), token('x4', 'x4', 122)]
        }
      }),
      hints: [
        'Place a prediction, then read Cuvette A through one centimetre and Cuvette B through two.',
        'Check your prediction against what you found when the concentration doubled and when the path doubled.',
        'The reading must rise by the same factor as the path and by the same factor as the concentration, so both factors apply together.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for the ratio first.' };
        const ratio = absorbOf(t.pieces.b, 630, 2) / absorbOf(t.pieces.a, 630, 1);
        if (token === `x${Math.round(ratio)}`) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The two readings do not stand in the ratio you predicted.' };
        return { ok: false, msg: 'Read Cuvette A through one centimetre and Cuvette B through two, and compare the readings with your prediction.' };
      },
      reward: {
        log: 'A = epsilon times b times c.',
        title: 'The Beer-Lambert Law',
        body: 'Absorbance is proportional to path length and to concentration: A = εbc, where ε is a constant for the substance at that wavelength. This is the Beer-Lambert law, and it turns a reading of light into a measurement of how much is dissolved.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const sp = spectro(SP, SPEC_AT, { xAxis: 'conc', word: 'ABSORBANCE', label: 'Spectrometer' });
    return {
      title: 'The Sealed Sample',
      prompt: 'Determine the concentration of the sealed copper solution using the calibration line.',
      widget,
      table: cuvetteTable({
        pieces: [
          cuvette('s1', 'STANDARD 1', { x: 14, y: 53 }, { drops: 0 }), cuvette('s2', 'STANDARD 2', { x: 36, y: 53 }, { drops: 0 }), cuvette('s3', 'STANDARD 3', { x: 58, y: 53 }, { drops: 0 }),
          cuvette('sealed', 'SEALED SAMPLE', { x: 80, y: 53 }, { conc: SEALED_CONC, sealed: true }),
          dropper('drop', { x: 106, y: 56 }), rinser('empty', { x: 126, y: 56 })
        ],
        fixtures: [sp.fixture, plaqueFixture('drop-note', 'One drop = 2 mmol/L', { x: 122, y: 29 }, [], { w: 50 }), markerFixture('conc', 'Sealed sample (mmol/L)', { x: 122, y: 42 }, { max: 8, step: 0.5, w: 44 })],
        zones: { slots: sp.slots },
        tools: ['straightedge']
      }, { recorder: recorder('Concentration', 'mmol/L') }),
      hints: [
        'Fill the standards with drops, slide each into the beam and press "Record", then put the sealed sample in the beam and read it.',
        'Lay the straightedge across the standards\' points and find where the sealed sample\'s reading falls along the line.',
        'Read across from the sealed reading to the line, then straight down to the concentration scale, and set the marker there.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'conc');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the concentration you read off the line.' };
        if (v === SEALED_CONC * 1000) return { ok: true };
        return { ok: false, msg: 'Follow the sealed sample\'s reading across to the line through the standards, then down to the concentration scale.' };
      },
      reward: {
        log: 'The line through the standards gave the sealed reading back.',
        title: 'Calibration Curve',
        body: 'Standards of known concentration give a line of absorbance against concentration, and an unknown sample\'s reading is read back off that line. This calibration curve is how a chemist measures how much of a coloured substance is dissolved.',
        last: true
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
      body: 'Each kind of light makes a molecule do something different, and a solution looks the colour of the light it leaves behind. The absorbance of a coloured solution rises in step with its concentration and its path, which lets a reading of light measure an amount of matter.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every pharmacy, water lab and hospital measures something dissolved this way. The same line you drew from three standards sits behind most of those numbers.'
    },
    {
      heading: 'Next',
      body: 'That is the last bench on Lanternfall. One feeder still haunts the ice: the Lantern-Eater, made of everything you have measured here.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A solution of potassium permanganate looks purple. Which colour of light does it absorb most strongly?',
    options: [
      { id: 'a', label: 'Green, the colour opposite purple' },
      { id: 'b', label: 'Purple' },
      { id: 'c', label: 'Red' },
      { id: 'd', label: 'It absorbs all colours equally' }
    ],
    answer: 'a',
    explanation: 'A solution looks the complementary colour of the light it absorbs. Purple is the complement of green, and permanganate takes in light near 525 nm, which is green.'
  },
  {
    question: 'A solution has an absorbance of 0.30 in a 1.0 cm cuvette. What would its absorbance be in a 2.0 cm cuvette?',
    options: [
      { id: 'a', label: '0.60' },
      { id: 'b', label: '0.15' },
      { id: 'c', label: '0.30' },
      { id: 'd', label: '0.09' }
    ],
    answer: 'a',
    explanation: 'By the Beer-Lambert law, A = εbc, so absorbance is proportional to path length b. Doubling b doubles A: 0.30 x 2 = 0.60.'
  },
  {
    question: 'A 0.010 M solution has an absorbance of 0.25. A second solution of the same substance reads 0.50 under the same conditions. Its concentration is:',
    options: [
      { id: 'a', label: '0.020 M' },
      { id: 'b', label: '0.0050 M' },
      { id: 'c', label: '0.010 M' },
      { id: 'd', label: '0.040 M' }
    ],
    answer: 'a',
    explanation: 'Absorbance is proportional to concentration when the path and wavelength are the same. The second reading is twice the first, so the concentration is twice as large: 0.020 M.'
  },
  {
    question: 'Infrared radiation passing through a sample causes which change in its molecules?',
    options: [
      { id: 'a', label: 'Bonds stretch and bend' },
      { id: 'b', label: 'The whole molecule spins' },
      { id: 'c', label: 'Electrons jump to higher energy levels' },
      { id: 'd', label: 'Nuclei split' }
    ],
    answer: 'a',
    explanation: 'Infrared photons carry about the energy that changes a bond\'s vibration. Microwaves are the ones that cause rotation, and ultraviolet or visible light moves electrons.'
  },
  {
    question: 'Why is a calibration curve made from solutions of known concentration?',
    options: [
      { id: 'a', label: 'So an unknown sample\'s absorbance can be converted into a concentration' },
      { id: 'b', label: 'To find the colour of the unknown sample' },
      { id: 'c', label: 'To remove the need for a spectrometer' },
      { id: 'd', label: 'To change the wavelength of the lamp' }
    ],
    answer: 'a',
    explanation: 'The standards fix the relationship between absorbance and concentration for that substance and wavelength. An unknown\'s absorbance is then read back along that line to a concentration.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions, by drag
   and by two taps. Light is chosen, cuvettes are filled with drops, slid into the beam and recorded, the straightedge is laid, a marker is set.
   Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const drops = (id, n) => Array.from({ length: n }, () => ({ join: ['drop', id] }));
const read = id => [put(id, BEAM), { run: SP }];

export const SOLUTIONS = [
  [dial(SP, 'region', 1), dial(SP, 'region', 2), dial(SP, 'region', 3), put('spins', 'slot:microwave'), put('stretches', 'slot:infrared'), put('jumps', 'slot:uv')],
  [put('r1', 'tray:microwave'), put('r2', 'tray:infrared'), put('r3', 'tray:ultraviolet')],
  [put('c-orange', 'slot:taken')],
  [dial(SP, 'nm', 3), { run: SP }, dial(SP, 'nm', 4), { run: SP }, dial(SP, 'nm', 5), { run: SP }, dial(SP, 'nm', 6), { run: SP }, dial(SP, 'nm', 5)],
  [{ fetch: 'hole' }, ...read('lake'), ...read('a'), ...drops('b', 4), ...read('b')],
  [dial(SP, 'path', 1), { run: SP }, dial(SP, 'path', 2), { run: SP }],
  [{ predict: 'x4' }, ...read('a'), put('b', BEAM), dial(SP, 'path', 2), { run: SP }],
  [
    ...drops('s1', 1), ...drops('s2', 2), ...drops('s3', 3), ...read('s1'), ...read('s2'), ...read('s3'),
    { lay: { kind: 'straightedge', through: [0, 2] } }, ...read('sealed'), dial('conc', 'value', 5)
  ]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('stretches', 'slot:microwave'), put('spins', 'slot:infrared'), put('jumps', 'slot:uv')],
  [put('r1', 'tray:ultraviolet'), put('r2', 'tray:infrared'), put('r3', 'tray:microwave')],
  [put('c-blue', 'slot:taken')],
  [dial(SP, 'nm', 3), { run: SP }, dial(SP, 'nm', 4), { run: SP }],
  [...read('a'), ...drops('b', 2), ...read('b')],
  [dial(SP, 'path', 3), { run: SP }],
  [{ predict: 'x3' }, ...read('a'), put('b', BEAM), dial(SP, 'path', 2), { run: SP }],
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
export { spectroRead, regionRead, absorbOf, concOf, missingColour, colourOfNm, chipIn, lightOf, fmtWave, markerRead, planAbsorb, planRegion, regionOf, COLOURS, COPPER_SWEEP, PATHS, REGIONS, DROP, MAX_DROPS, SOLUTES, gotThrough };
