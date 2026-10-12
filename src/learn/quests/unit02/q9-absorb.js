/**
 * q9-absorb.js — Lanternfall, bench nine: SPECTROSCOPY.
 *
 * The light bench's cuvette head, the last thing Lanternfall asks and the one
 * a chemist actually uses. The first eight benches asked what light does to an
 * atom; this one asks what a solution does to a beam, and how much. It runs from
 * what each kind of light does to a molecule, through why a copper solution is
 * blue, to Beer-Lambert and a calibration line.
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
 * Every number on the bench is A = epsilon x b x c, asked of `planAbsorb` in
 * `lightdata.js`: copper(II) sulfate absorbs near 630 nm and permanganate near
 * 525 nm, as measured. Stage 8's line is drawn from three standards and the
 * sealed sample's reading is one more point on the same relation, so nothing
 * on the bench is authored twice.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { LightBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { planAbsorb } from '../../engine/lightdata.js';
import { fmtLength } from '../../engine/lightbench.js';

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

export function toolNoteFor() { return null; }

const PLAIN = { absorb: 'Dimming' };
const EARNED = { absorb: 'Absorbance' };

/** The copper dial: every step on the way up to, and past, the peak at 630 nm. */
const COPPER_SWEEP = [450, 500, 550, 600, 630, 680, 730];

/** Stage 8's three standards, read at the peak through 1 cm, and the sealed sample. */
const STANDARDS = [0.002, 0.004, 0.006].map(conc => ({ conc, abs: planAbsorb('cuso4', 630, 1, conc) }));
const SEALED_CONC = 0.005;
const SEALED_ABS = planAbsorb('cuso4', 630, 1, SEALED_CONC);

const CU = (id, conc, extra = {}) => ({
  id, label: extra.label || `SAMPLE ${id.toUpperCase()}`, head: 'cuvette', solute: 'cuso4', conc,
  shows: `${conc} mol/L`, note: extra.note || 'copper(II) sulfate solution', ...extra
});

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'What Each Light Does',
    briefing: {
      speaker: SPEAKER,
      body: 'Welcome to the spectrophotometry bench! We shine beams of radiation through cuvettes containing solutions to measure how much light gets absorbed, and observe how different wavelengths agitate the molecules.'
    },
    prompt: 'Test microwaves, infrared, and UV-visible light on the HCl molecule. What distinct physical motion does each region trigger?',
    labels: PLAIN,
    controls: ['region'],
    mode: 'region',
    region: 'uv-visible',
    rigs: [
      { id: 'mol', label: 'HYDROGEN CHLORIDE', head: 'cuvette', molecule: 'HCl', note: 'HCl, one molecule shown' }
    ],
    widget: {
      type: 'bins', label: 'What it does',
      rows: [
        { id: 'microwave', label: 'Microwave' },
        { id: 'infrared', label: 'Infrared' },
        { id: 'uv', label: 'Ultraviolet and visible' }
      ],
      bins: [
        { id: 'spins', label: 'Spins the molecule', note: '' },
        { id: 'stretches', label: 'Stretches and bends its bonds', note: '' },
        { id: 'jumps', label: 'Moves an electron up a level', note: '' }
      ]
    },
    hints: [
      'Press each of the three light keys in turn and watch what the molecule does in the cuvette.',
      'Compare how the molecule moves under each kind of light, and note which movement belongs to which key.',
      'Match the whole molecule turning to the longest waves, the bond changing length to the middle ones, and the electron to the shortest.'
    ],
    check(state) {
      const rows = ['microwave', 'infrared', 'uv'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'Match all three kinds of light.' };
      const want = { microwave: 'spins', infrared: 'stretches', uv: 'jumps' };
      for (const r of rows) {
        if (state.bins[r] !== want[r]) {
          return { ok: false, msg: 'Press that kind of light\'s key and watch what the molecule does before you match it.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Three lights, three movements.',
      title: 'Molecular Spectroscopy',
      body: 'Microwaves make a molecule spin, infrared makes its bonds stretch and bend, and ultraviolet or visible light lifts an electron to a higher energy level. Reading which light a substance takes in, and how much, is molecular spectroscopy.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Three Readings',
    prompt: 'Three distinct absorption wavelengths were detected! Match each recorded wavelength to the region of light that caused it.',
    labels: PLAIN,
    controls: [],
    rigs: [
      { id: 'r1', label: 'READING 1', head: 'scale', nm: 3e7, note: 'a molecule takes in light of this wavelength' },
      { id: 'r2', label: 'READING 2', head: 'scale', nm: 3e4, note: 'a molecule takes in light of this wavelength' },
      { id: 'r3', label: 'READING 3', head: 'scale', nm: 300, note: 'a molecule takes in light of this wavelength' }
    ],
    widget: {
      type: 'bins', label: 'The light that caused it',
      rows: [
        { id: 'r1', label: 'Reading 1' },
        { id: 'r2', label: 'Reading 2' },
        { id: 'r3', label: 'Reading 3' }
      ],
      bins: [
        { id: 'microwave', label: 'Microwave', note: '' },
        { id: 'infrared', label: 'Infrared', note: '' },
        { id: 'uv', label: 'Ultraviolet', note: '' }
      ]
    },
    hints: [
      'Tap each reading on its ruler to read the wavelength it was taken at.',
      'Compare each wavelength with the visible band shaded on the ruler, and with the order of the spectrum from the first bench.',
      'The longest wavelength belongs to the lowest-energy light and the shortest to the highest.'
    ],
    check(state) {
      const rows = ['r1', 'r2', 'r3'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'Match all three readings.' };
      const want = { r1: 'microwave', r2: 'infrared', r3: 'uv' };
      for (const r of rows) {
        if (state.bins[r] !== want[r]) {
          return { ok: false, msg: 'Read each wavelength on its ruler and place it against the order of the electromagnetic spectrum.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Longer waves, smaller movements.',
      title: 'Bigger Change, Shorter Wave',
      body: 'The longer the wavelength a molecule takes in, the smaller the change it makes: a spin takes the least energy, a vibration more, and lifting an electron the most. That is why a single molecule needs three different instruments to be read in full.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Why Copper Looks Blue',
    prompt: 'White light shines through the copper(II) sulfate solution, yet it appears strikingly blue. Why does the solution take on this colour?',
    labels: PLAIN,
    controls: [],
    after: true,
    rigs: [CU('a', 0.01, { label: 'COPPER SOLUTION', nm: 550, note: 'copper(II) sulfate solution, white light behind it' })],
    widget: {
      type: 'choice', label: 'Why it looks blue',
      options: [
        { id: 'takes', label: 'It takes orange light out of white light, and what is left looks blue' },
        { id: 'gives', label: 'It gives out blue light of its own' },
        { id: 'blue', label: 'It takes blue light out of white light and keeps it' },
        { id: 'mirror', label: 'It reflects only blue light and passes the rest' }
      ]
    },
    hints: [
      'Look at the strip under the cuvette, which shows the light that gets through it.',
      'Compare the colours missing from that strip with the colour the solution looks.',
      'Find where the strip is darkest, then name the colour of the spectrum that sits at that place.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'takes') {
        return { ok: false, msg: 'Compare the light that gets through the cuvette with white light, and see which colours are missing.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Orange missing, so the rest looks blue.',
      title: 'Complementary Colour',
      body: 'A solution looks like the colour opposite the one it takes in: copper(II) sulfate removes orange and leaves blue. The colour you see is the complementary colour of the light that is missing.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Best Wavelength',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now adjust the incident wavelength. Turn the dial to find the wavelength where the solution absorbs light most strongly.'
    },
    prompt: 'Tune the wavelength dial to find the peak absorption setting for measuring this copper(II) sulfate solution with maximum sensitivity.',
    labels: EARNED,
    controls: ['tune'],
    settings: COPPER_SWEEP,
    start: 1,
    rigs: [CU('a', 0.01, { label: 'COPPER SOLUTION', tuned: true })],
    widget: { type: 'none' },
    hints: [
      'Turn the dial and watch the dimming reading as the wavelength changes.',
      'Compare the reading at every setting, including the ones either side of the largest.',
      'Stop the dial on the setting where the reading is greater than at every other.'
    ],
    check(state) {
      if (state.setting === 1) {
        return { ok: false, notYet: true, msg: 'The lamp is where it started. Sweep it and watch the reading.' };
      }
      if (state.setting !== 5) {
        return { ok: false, msg: 'This is not the setting with the biggest reading. Compare the readings either side of it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The reading peaks near 630 nm.',
      title: 'Absorbance',
      body: 'How much the cuvette dims a beam is its absorbance, and it is largest at the wavelength the solution takes in best. Measuring at that peak gives the biggest and most reliable reading.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Doubling the Concentration',
    prompt: 'Examine the three cuvettes with different copper concentrations. What happens to the absorbance reading when concentration doubles?',
    labels: EARNED,
    controls: [],
    rigs: [
      CU('a', 0.004, { nm: 630 }),
      CU('b', 0.008, { nm: 630 }),
      CU('c', 0.016, { nm: 630 })
    ],
    widget: {
      type: 'choice', label: 'What it does',
      options: [
        { id: 'doubles', label: 'It doubles' },
        { id: 'halves', label: 'It halves' },
        { id: 'same', label: 'It stays the same' },
        { id: 'squares', label: 'It is multiplied by itself' }
      ]
    },
    hints: [
      'Read the absorbance on each of the three cuvettes.',
      'Compare each reading with the one before it, alongside how the concentrations compare.',
      'Divide the reading on the second cuvette by the reading on the first and set that beside how its concentration compares.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what doubling does.' };
      if (state.choice !== 'doubles') {
        return { ok: false, msg: 'Compare the readings on two cuvettes whose concentrations differ by a factor of two.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Twice the concentration, twice the absorbance.',
      title: 'A Straight Line Through Zero',
      body: 'Twice the concentration gave twice the absorbance, and four times gave four times. That is what you would expect if each absorbing particle in the beam takes out its own share of the light.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Doubling the Path',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now change the cuvette path length. Select different path keys to see how beam distance affects absorption.'
    },
    prompt: 'Switch the cuvette path length selector! What happens to the absorbance when the light travels twice as far through the solution?',
    labels: EARNED,
    controls: ['path'],
    path: 1,
    rigs: [CU('a', 0.008, { label: 'COPPER SOLUTION', nm: 630 })],
    widget: {
      type: 'choice', label: 'What it does',
      options: [
        { id: 'doubles', label: 'It doubles' },
        { id: 'halves', label: 'It halves' },
        { id: 'same', label: 'It stays the same' },
        { id: 'squares', label: 'It is multiplied by itself' }
      ]
    },
    hints: [
      'Press each path key and watch the cuvette and the reading.',
      'Compare the reading at each path length with the reading at the one before it.',
      'Note how the reading at two centimetres compares with the reading at one, and at four with two.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what doubling the path does.' };
      if (state.choice !== 'doubles') {
        return { ok: false, msg: 'Switch between two paths whose lengths differ by a factor of two and compare the readings.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Twice the path, twice the absorbance.',
      title: 'Same Effect, Another Way',
      body: 'Light that passes through twice as many absorbing particles loses twice as much, whether they are crowded into a stronger solution or spread along a longer path. Path length and concentration enter the absorbance in exactly the same way.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'The Rule',
    prompt: 'Combine your discoveries! Which mathematical equation correctly expresses how absorbance depends on path length and concentration?',
    labels: EARNED,
    controls: ['path'],
    path: 1,
    rigs: [
      CU('a', 0.004, { nm: 630 }),
      CU('b', 0.008, { nm: 630 })
    ],
    widget: {
      type: 'choice', label: 'The rule',
      options: [
        { id: 'prod', label: 'A = ε × b × c' },
        { id: 'quot', label: 'A = ε ÷ (b × c)' },
        { id: 'sum', label: 'A = ε + b + c' },
        { id: 'ratio', label: 'A = ε × b ÷ c' }
      ]
    },
    hints: [
      'Use the path keys and the two cuvettes to collect readings with different paths and concentrations.',
      'Check each candidate rule against the readings from the last two stages, and discard any that moves the wrong way.',
      'The absorbance must rise by the same factor as the path and by the same factor as the concentration, so it must be their product times a constant.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the rule.' };
      if (state.choice !== 'prod') {
        return { ok: false, msg: 'Test the rule against the readings: absorbance rose when concentration rose, and rose when path rose.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'A = epsilon times b times c.',
      title: 'The Beer-Lambert Law',
      body: 'Absorbance is proportional to path length and to concentration: A = εbc, where ε is a constant for the substance at that wavelength. This is the Beer-Lambert law, and it turns a reading of light into a measurement of how much is dissolved.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Sealed Sample',
    prompt: 'We found a sealed copper solution vial in the surveyor depot. Using the line of known reference standards, determine its concentration!',
    labels: EARNED,
    controls: [],
    rigs: [
      {
        id: 'cal', label: 'STANDARDS AND SEALED SAMPLE', head: 'plot', points: STANDARDS, unknownAbs: SEALED_ABS,
        maxConc: 0.008, maxAbs: 0.2, note: 'three standards at 1 cm, and one sealed reading'
      }
    ],
    widget: { type: 'decimal', label: 'Concentration (mmol/L)', min: 0, max: 8, step: 0.5 },
    hints: [
      'Read the three standards\' points and the sealed sample\'s absorbance off the plot.',
      'Find where the sealed sample\'s absorbance falls along the line drawn through the standards.',
      'Read across from the sealed absorbance to the line, then straight down to the concentration scale.'
    ],
    check(state) {
      if (state.decimal === 0) return { ok: false, notYet: true, msg: 'Set the concentration you read off the plot.' };
      if (state.decimal !== 5) {
        return { ok: false, msg: 'Follow the dashed level across to the line through the standards, then down to the concentration scale.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The line through the standards gave the sealed reading back.',
      title: 'Calibration Curve',
      body: 'Standards of known concentration give a line of absorbance against concentration, and an unknown sample\'s reading is read back off that line. This calibration curve is how a chemist measures how much of a coloured substance is dissolved.',
      last: true
    }
  }
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
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    setting: stage.start ?? null,
    path: stage.path ?? 1,
    region: stage.region ?? 'uv-visible',
    seen: new Set()
  };
}

export const SOLUTIONS = [
  { bins: { microwave: 'spins', infrared: 'stretches', uv: 'jumps' } },
  { bins: { r1: 'microwave', r2: 'infrared', r3: 'uv' } },
  { choice: 'takes' },
  { setting: 5 },
  { choice: 'doubles' },
  { choice: 'doubles' },
  { choice: 'prod' },
  { decimal: 5 }
];

export const MISSES = [
  { bins: { microwave: 'stretches', infrared: 'spins', uv: 'jumps' } },
  { bins: { r1: 'uv', r2: 'infrared', r3: 'microwave' } },
  { choice: 'gives' },
  { setting: 3 },
  { choice: 'squares' },
  { choice: 'same' },
  { choice: 'sum' },
  { decimal: 4 }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let bench = null;
  let runner = null;

  const REGION_KEYS = [
    ['microwave', 'Microwave'], ['infrared', 'Infrared'], ['uv-visible', 'Ultraviolet and visible']
  ];
  const PATH_KEYS = [1, 2, 4];

  function nmNow() {
    const st = runner.stage.settings;
    return st ? st[runner.state.setting - 1] : null;
  }

  function paintSetting() {
    const st = runner.stage.settings;
    if (!st) return;
    runner.paintDial('setting', runner.state.setting, { min: 1, max: st.length, text: `${st[runner.state.setting - 1]} nm` });
  }

  function paintKeys() {
    const host = runner.frame.el.controls;
    host.querySelectorAll('[data-region]').forEach(b => b.classList.toggle('selected', b.dataset.region === runner.state.region));
    host.querySelectorAll('[data-path]').forEach(b => b.classList.toggle('selected', Number(b.dataset.path) === runner.state.path));
  }

  /** The reading under the present settings, in the instrument's own words. */
  function readNow() {
    const stage = runner.stage;
    if (stage.mode === 'region') {
      runner.readout(null, null, { idleHead: 'Cuvette // standby', idle: 'Choose a kind of light.' });
      return;
    }
    const rigs = stage.rigs.filter(r => r.head === 'cuvette' && r.solute);
    if (!rigs.length) return;
    const word = stage.labels.absorb;
    const rows = rigs.map(r => {
      const nm = r.tuned ? nmNow() : r.nm;
      return `${r.label}: ${word} ${planAbsorb(r.solute, nm, runner.state.path, r.conc).toFixed(3)} at ${nm} nm, ${runner.state.path} cm`;
    });
    runner.readout('Cuvette // reading', rows.join('. ') + '.');
  }

  function setSetting(v) {
    runner.state.setting = v;
    bench.setSetting(v);
    paintSetting();
    readNow();
  }

  function onTool(tool) {
    const [kind, value] = tool.split(':');
    if (kind === 'region') {
      runner.state.region = value;
      bench.setRegion(value);
    } else if (kind === 'path') {
      runner.state.path = Number(value);
      bench.setPath(runner.state.path);
    }
    paintKeys();
    readNow();
  }

  function onProbe(hit) {
    if (hit.kind === 'scale') {
      runner.readout(`Ruler // ${hit.plateLabel}`, `Taken in at ${fmtLength(hit.nm)}.`);
    }
  }

  function onLoad(stage, i, r) {
    bench.setRigs(stage.rigs, {
      settings: stage.settings || [],
      setting: r.state.setting || 1,
      path: r.state.path,
      region: r.state.region,
      mode: stage.mode || null,
      after: Boolean(stage.after),
      labels: stage.labels
    });
    bench.setSelectable(false);

    const parts = [];
    const dials = {};
    if (stage.settings) {
      parts.push(r.dialHtml('setting', { label: 'Wavelength', min: 1, max: stage.settings.length, value: r.state.setting }));
      dials.setting = { min: 1, max: stage.settings.length, onChange: v => setSetting(v) };
    }
    if (stage.controls.includes('region')) {
      parts.push(`
        <div class="cb-field" role="group" aria-label="Light">
          <span class="form-label">Light</span>
          ${REGION_KEYS.map(([id, label]) => `<button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="region:${id}" data-region="${id}">${label}</button>`).join('')}
        </div>
      `);
    }
    if (stage.controls.includes('path')) {
      parts.push(`
        <div class="cb-field" role="group" aria-label="Path">
          <span class="form-label">Path</span>
          ${PATH_KEYS.map(cm => `<button type="button" class="btn-secondary quest-btn-sm cb-field-key" data-tool="path:${cm}" data-path="${cm}">${cm} cm</button>`).join('')}
        </div>
      `);
    }
    r.setControls(parts, onTool, { dials });
    paintSetting();
    paintKeys();
    readNow();
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => {
      bench = LightBench(r.frame.instrumentHost, { onProbe, onSetting: v => setSetting(v) });
    },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
