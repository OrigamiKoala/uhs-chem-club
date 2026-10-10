/**
 * q1-wave.js — Lanternfall, bench one: LIGHT AS A WAVE.
 *
 * Tallow left the player with electrons on rings at fixed distances and no
 * reason why. Lanternfall is the reason, and it starts with the light itself:
 * the sky over this ice field is the first emission spectrum the player ever
 * sees. The light bench (`engine/lightbench.js`) gives a lamp you can tune, a
 * screen that draws its light as a wave, and a prism that spreads it out.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  turn the dial from red to violet                 -> wavelength, frequency
 *   2  find the lamp with twice another's crest spacing -> they are inversely related
 *   3  three lamps, spacing against count               -> the speed of light
 *   4  a 600 nm lamp that is not on the bench           -> frequency from wavelength
 *   5  four lamps, lowest frequency to highest          -> the visible spectrum
 *   6  a lamp the eye cannot see                        -> the electromagnetic spectrum
 *   7  radio, microwave and X-ray against frequency     -> one kind of wave, every size
 *   8  two lamps with their names on                    -> every code is an element
 *   -- debrief: a lamp can be told by its light, and a bright red one will not do what a faint violet one does.
 *
 * `VOCABULARY` publishes the schedule. Wavelength and frequency are earned on
 * the first card and plain from the second stage on; before it the bench prints
 * "Crest to crest" and "Crests per second" and says nothing harder.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { LightBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { fmtLength } from '../../engine/lightbench.js';

export const meta = { stageCount: 8 };

/** When each withheld word is earned. */
export const VOCABULARY = [
  { term: /\belectromagnetic spectrum\b/i, introducedAt: 6 },
  { term: /\bvisible spectrum\b/i, introducedAt: 5 },
  { term: /\bspeed of light\b/i, introducedAt: 3 },
  { term: /\bwavelengths?\b/i, introducedAt: 1 },
  { term: /\bfrequenc(?:y|ies)\b/i, introducedAt: 1 }
];

/** Builds on nothing outside Tallow. */
export const BUILDS_ON = [];

const SPEAKER = 'Vess';

/** The labels the bench prints: plain English until the word has been earned. */
const PLAIN_LABELS = { spacing: 'Crest to crest', rate: 'Crests per second', dial: 'Colour' };
const EARNED_LABELS = { spacing: 'Wavelength', rate: 'Frequency', dial: 'Wavelength' };

/** The dial, red end first: turning it up raises the frequency. */
const RED_TO_VIOLET = [700, 650, 600, 550, 500, 450, 400];

/* ------------------------------------------------------------------
   THE KEY LEGEND. The dial's label says what it does; nothing here needs one.
   ------------------------------------------------------------------ */
export function toolNoteFor() { return null; }

const MID = 4;   // where an untouched dial rests

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Red to Violet',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench has a lamp you can tune, a screen that draws its light as a wave, and a prism that spreads it into colours. Tap a wave on the screen to measure how far apart its crests are.'
    },
    prompt: 'Say what changes on the screen as the dial turns from red to violet.',
    labels: PLAIN_LABELS,
    controls: ['tune'],
    settings: RED_TO_VIOLET,
    start: MID,
    rigs: [
      { id: 'lamp', label: 'LAMP', head: 'trace', tuned: true, note: 'a lamp you can tune' }
    ],
    widget: {
      type: 'choice', label: 'What changes',
      options: [
        { id: 'crowd', label: 'The crests crowd closer and more of them pass each second' },
        { id: 'spread', label: 'The crests spread further apart and more of them pass each second' },
        { id: 'slow', label: 'The crests spread further apart and fewer of them pass each second' },
        { id: 'same', label: 'Only the colour changes; the wave and the count stay put' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Observe Wave',
      intent: 'A lamp moth perches silently on the trace screen.',
      hit: 'The optical wave compresses and disperses the moth.'
    },
    hints: [
      'Turn the dial from its first position to its last and watch the wave and the "Crests per second" box.',
      'Compare how far apart two crests sit at the red end with how far apart they sit at the violet end.',
      'Tap the wave at each end of the dial, read the crest-to-crest spacing each time, and set it beside the count.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what changes.' };
      if (state.choice === 'same') {
        return { ok: false, msg: 'Turn the dial a step at a time and watch the wave itself, not just its colour.' };
      }
      if (state.choice !== 'crowd') {
        return { ok: false, msg: 'Watch the spacing between crests as the dial turns, and watch the count beside it at the same time.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Violet: crests close together, many a second.',
      title: 'Wavelength and Frequency',
      body: 'The distance from one crest to the next is the wavelength, and the number of crests that pass each second is the frequency. Turning from red to violet shortens the wavelength and raises the frequency, so the two move in opposite directions.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Twice as Far Apart',
    prompt: 'Find the lamp setting whose wavelength is twice Sample A\'s.',
    labels: EARNED_LABELS,
    controls: ['tune'],
    settings: [700, 650, 600, 550, 500, 450, 400, 350],
    start: MID,
    rigs: [
      { id: 'a', label: 'SAMPLE A', head: 'trace', nm: 350, note: 'a fixed lamp' },
      { id: 'lamp', label: 'LAMP', head: 'trace', tuned: true, note: 'a lamp you can tune' }
    ],
    widget: { type: 'none' },
    encounter: {
      species: 'lamp moth',
      act: 'Tune Wave',
      intent: 'Two moths flutter between the fixed and tunable lamp beams.',
      hit: 'The tuned wavelength doubles and the moths scatter.'
    },
    hints: [
      'Tap Sample A\'s wave to read its crest-to-crest spacing, then turn the dial and tap the lamp\'s wave the same way.',
      'Compare the wavelength at each dial setting with twice the wavelength of Sample A.',
      'Double the wavelength you measured for Sample A, then turn the dial until the lamp\'s measured wavelength matches that figure.'
    ],
    check(state) {
      if (state.setting === MID) {
        return { ok: false, notYet: true, msg: 'The lamp is where it started. Set it, then Commit.' };
      }
      if (state.setting !== 1) {
        return { ok: false, msg: 'Measure Sample A and the lamp, then compare: this setting\'s wavelength is not twice Sample A\'s.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The wider lamp counted half as fast.',
      title: 'Two Quantities, One Trade',
      body: 'The lamp with crests twice as far apart counted exactly half as many each second. Wavelength and frequency are inversely related: whatever you do to one, the other undoes.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Spacing Times Count',
    prompt: 'Say how fast the light from each of these three lamps travels.',
    labels: EARNED_LABELS,
    controls: [],
    rigs: [
      { id: 'a', label: 'SAMPLE A', head: 'trace', nm: 400, note: 'a fixed lamp' },
      { id: 'b', label: 'SAMPLE B', head: 'trace', nm: 500, note: 'a fixed lamp' },
      { id: 'c', label: 'SAMPLE C', head: 'trace', nm: 750, note: 'a fixed lamp' }
    ],
    widget: { type: 'decimal', label: 'Speed of the light (x 10^8 m/s)', min: 0, max: 6, step: 0.5 },
    encounter: {
      species: 'lamp moth',
      act: 'Calculate C',
      intent: 'A cluster of moths feeds around the emission traces at varied wavelengths.',
      hit: 'The constant speed of light dissolves the moths into radiance.'
    },
    hints: [
      'Tap each lamp\'s wave to read its wavelength, and read its frequency from the box above the wave.',
      'Multiply each lamp\'s wavelength, in metres, by its frequency and compare the three products.',
      'Convert nanometres to metres by multiplying by 10^-9, then multiply by the frequency in crests per second.'
    ],
    check(state) {
      if (state.decimal === 0) return { ok: false, notYet: true, msg: 'Set the speed you worked out.' };
      if (state.decimal !== 3) {
        return { ok: false, msg: 'Multiply one lamp\'s wavelength, in metres, by its frequency, then check the same sum on a second lamp.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Every lamp: spacing times count is the same.',
      title: 'The Speed of Light',
      body: 'Wavelength times frequency comes out the same for every lamp, 3.00 x 10^8 metres per second, which is the speed of light. Light of any colour crosses empty space at that one speed, so a longer wavelength has to mean a lower frequency.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'A Lamp Not on the Bench',
    prompt: 'Give the frequency of a 600 nm lamp.',
    labels: EARNED_LABELS,
    controls: [],
    rigs: [
      { id: 'r1', label: 'REFERENCE 1', head: 'trace', nm: 300, note: 'a fixed lamp' },
      { id: 'r2', label: 'REFERENCE 2', head: 'trace', nm: 500, note: 'a fixed lamp' }
    ],
    widget: { type: 'decimal', label: 'Frequency (x 10^14 per second)', min: 0, max: 12, step: 0.5 },
    encounter: {
      species: 'lamp moth',
      act: 'Compute Hertz',
      intent: 'A pair of moths feed on the twin reference traces.',
      hit: 'The calculated frequency strikes true and clears the bench.'
    },
    hints: [
      'Tap each reference lamp to read its wavelength and note the frequency printed above its wave.',
      'Work out what wavelength times frequency comes to for each reference lamp and check that it is the same for both.',
      'Divide that fixed product by 600 nm, written in metres, to get the frequency in crests per second.'
    ],
    check(state) {
      if (state.decimal === 0) return { ok: false, notYet: true, msg: 'Set the frequency you worked out.' };
      if (state.decimal !== 5) {
        return { ok: false, msg: 'Use what the two reference lamps show: a wavelength and its frequency are tied together by one fixed product.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Frequency is the speed of light over wavelength.',
      title: 'One Division',
      body: 'Frequency is the speed of light divided by wavelength, so a lamp that is not on the bench still has a frequency you can work out. Any wavelength, measured or merely named, turns into a frequency with that single division.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Lowest to Highest',
    prompt: 'Order the four lamps from the lowest frequency to the highest.',
    labels: EARNED_LABELS,
    controls: [],
    rigs: [
      { id: 'a', label: 'SAMPLE A', head: 'trace', nm: 520, note: 'a fixed lamp' },
      { id: 'b', label: 'SAMPLE B', head: 'trace', nm: 680, note: 'a fixed lamp' },
      { id: 'c', label: 'SAMPLE C', head: 'trace', nm: 430, note: 'a fixed lamp' },
      { id: 'd', label: 'SAMPLE D', head: 'trace', nm: 600, note: 'a fixed lamp' }
    ],
    widget: {
      type: 'order', label: 'Lowest first',
      items: [
        { id: 'a', label: 'Sample A' }, { id: 'b', label: 'Sample B' },
        { id: 'c', label: 'Sample C' }, { id: 'd', label: 'Sample D' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Order Spectra',
      intent: 'Four moths beat their wings at differing optical frequencies.',
      hit: 'The ordered spectrum locks into alignment and the moths disperse.'
    },
    hints: [
      'Read the frequency printed above each lamp\'s wave, or watch where each colour sits from red to violet.',
      'Frequency climbs as the crests crowd together, which is the same direction as red to violet.',
      'Place the lamp with the widest crests first and the one with the closest crests last.'
    ],
    check(state) {
      if (state.order.length < 4) return { ok: false, notYet: true, msg: 'Tap all four lamps in order.' };
      const want = ['b', 'd', 'a', 'c'];
      if (state.order.join() === want.slice().reverse().join()) {
        return { ok: false, msg: 'That order runs the wrong way: the first lamp you tap must have the lowest frequency.' };
      }
      if (state.order.join() !== want.join()) {
        return { ok: false, msg: 'Compare each lamp\'s frequency before you place it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Red low, violet high.',
      title: 'The Visible Spectrum',
      body: 'The light the eye can see runs from red, with the longest wavelengths and lowest frequencies, to violet, with the shortest wavelengths and highest frequencies. That band, from about 700 nm down to about 400 nm, is the visible spectrum.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Past the Ends',
    prompt: 'Say which detector responds to Sample B, which the eye cannot see.',
    labels: EARNED_LABELS,
    controls: [],
    rigs: [
      { id: 'a', label: 'SAMPLE A', head: 'prism', source: { type: 'lamp', nm: 550 }, note: 'a fixed lamp' },
      { id: 'b', label: 'SAMPLE B', head: 'prism', source: { type: 'lamp', nm: 1000 }, note: 'a fixed lamp' }
    ],
    widget: {
      type: 'choice', label: 'The detector that responds',
      options: [
        { id: 'ir', label: 'The infrared strip' },
        { id: 'uv', label: 'The ultraviolet strip' },
        { id: 'both', label: 'Both strips' },
        { id: 'none', label: 'Neither strip' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Detect Beam',
      intent: 'An elusive moth feeds beyond the boundary of visible perception.',
      hit: 'The infrared sensor registers and burns away the shroud.'
    },
    hints: [
      'Look at Sample B\'s plate and see which strip beside the band lights up.',
      'Compare Sample B\'s wavelength with the two ends of the visible spectrum, and decide which end it lies beyond.',
      'A wavelength longer than red falls past the red end of the band, and one shorter than violet falls past the violet end.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick a detector.' };
      if (state.choice === 'none') {
        return { ok: false, msg: 'Something is lighting a strip on Sample B\'s plate. Look at the plate again.' };
      }
      if (state.choice !== 'ir') {
        return { ok: false, msg: 'Compare Sample B\'s wavelength with the ends of the band before choosing a strip.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Beyond red and beyond violet, there is still light.',
      title: 'The Electromagnetic Spectrum',
      body: 'Beyond red lies infrared, with longer wavelengths and lower frequencies, and beyond violet lies ultraviolet, with shorter wavelengths and higher frequencies. Radio waves, microwaves, X-rays and the rest continue the same line, and together they make up the electromagnetic spectrum, of which visible light is a thin slice.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Radio to X-ray',
    prompt: 'Match each source to its frequency.',
    labels: EARNED_LABELS,
    controls: [],
    rigs: [
      { id: 'radio', label: 'RADIO MAST', head: 'scale', nm: 3e9, note: 'a transmitter' },
      { id: 'micro', label: 'MICROWAVE OVEN', head: 'scale', nm: 1.2e8, note: 'a heater' },
      { id: 'xray', label: 'X-RAY TUBE', head: 'scale', nm: 0.1, note: 'a dental tube' }
    ],
    widget: {
      type: 'bins', label: 'Frequency of each source',
      rows: [
        { id: 'radio', label: 'Radio mast' },
        { id: 'micro', label: 'Microwave oven' },
        { id: 'xray', label: 'X-ray tube' }
      ],
      bins: [
        { id: 'f8', label: '1 x 10^8 per second', note: '' },
        { id: 'f9', label: '2.5 x 10^9 per second', note: '' },
        { id: 'f18', label: '3 x 10^18 per second', note: '' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Sort Waves',
      intent: 'Three electromagnetic masts draw moths across disparate wavelengths.',
      hit: 'Each source is mapped to its frequency band.',
      moves: {
        f8: 'Tag Radio',
        f9: 'Tag Micro',
        f18: 'Tag Xray'
      }
    },
    hints: [
      'Tap each source on its ruler to read the wavelength it works at.',
      'Divide the speed of light by each wavelength, written in metres, to get that source\'s frequency.',
      'The longest wavelength has the lowest frequency and the shortest wavelength has the highest, so only the sizes of the three figures are left to match.'
    ],
    check(state) {
      const rows = ['radio', 'micro', 'xray'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'Match all three sources.' };
      const want = { radio: 'f8', micro: 'f9', xray: 'f18' };
      for (const r of rows) {
        if (state.bins[r] !== want[r]) {
          return { ok: false, msg: 'Work one source\'s frequency out from its wavelength and see which figure it lands on.' };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Metres to a tenth of a nanometre: one kind of wave.',
      title: 'One Kind of Wave, Every Size',
      body: 'A radio mast, a microwave oven and an X-ray tube all send out the same kind of wave; only the wavelength differs, from metres down to a tenth of a nanometre. Frequency rises as wavelength falls, by exactly the factor that keeps their product at the speed of light.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Names on the Lamps',
    prompt: 'Give the frequency of the sodium lamp.',
    labels: EARNED_LABELS,
    controls: [],
    rigs: [
      { id: 'a', label: 'LAMP A', head: 'trace', nm: 589, note: 'CAT 11, sodium (Na)' },
      { id: 'b', label: 'LAMP B', head: 'trace', nm: 656, note: 'CAT 01, hydrogen (H)' }
    ],
    widget: { type: 'decimal', label: 'Frequency (x 10^14 per second)', min: 4.5, max: 6, step: 0.1 },
    encounter: {
      species: 'lamp moth',
      act: 'Read Sodium',
      intent: 'Two elemental lamps illuminate the moth with distinctive emission yellow.',
      hit: 'The sodium frequency is verified and the moth goes dark.'
    },
    hints: [
      'Find the lamp whose label names sodium, then tap its wave.',
      'Read the sodium lamp\'s frequency from the box above its wave, or work it out from its wavelength.',
      'Divide the speed of light by 589 nm, written in metres, and round the result to one decimal place.'
    ],
    check(state) {
      if (state.decimal === 4.5) return { ok: false, notYet: true, msg: 'Set the frequency you read or worked out.' };
      if (state.decimal !== 5.1) {
        return { ok: false, msg: 'Check you are reading the sodium lamp, not the other one, and that the figure is in the unit shown.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'CAT 11 is sodium, CAT 01 is hydrogen.',
      title: 'Every Code Is an Element',
      body: 'Each catalogue code you have been filing by is an element with a name and a symbol: CAT 11 is sodium, Na, and CAT 01 is hydrogen, H. From here on the benches print the symbol beside the code.',
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
      body: 'Light is a wave, and every wave has a wavelength and a frequency that trade against each other through one fixed speed: 3.00 x 10^8 metres per second. What the eye calls colour is a thin slice of the electromagnetic spectrum.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Once you can turn a wavelength into a frequency, you can compare a radio mast with an X-ray tube on one scale. That is the scale the rest of this world is measured on.'
    },
    {
      heading: 'Next',
      body: 'The next bench asks something a wave cannot answer: why does a bright red lamp fail to free a single electron from a plate that a faint violet one frees at once?'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Light has a wavelength of 600 nm. What is its frequency? (c = 3.00 x 10^8 m/s)',
    options: [
      { id: 'a', label: '5.00 x 10^14 Hz' },
      { id: 'b', label: '2.00 x 10^-6 Hz' },
      { id: 'c', label: '1.80 x 10^17 Hz' },
      { id: 'd', label: '5.00 x 10^5 Hz' }
    ],
    answer: 'a',
    explanation: 'Frequency is c divided by wavelength: (3.00 x 10^8 m/s) / (600 x 10^-9 m) = 5.00 x 10^14 Hz. Forgetting to convert nanometres to metres is what gives the other figures.'
  },
  {
    question: 'Which of these has the highest frequency?',
    options: [
      { id: 'a', label: 'Radio waves' },
      { id: 'b', label: 'Infrared light' },
      { id: 'c', label: 'Green light' },
      { id: 'd', label: 'Ultraviolet light' }
    ],
    answer: 'd',
    explanation: 'Frequency rises as wavelength falls. Ultraviolet has a shorter wavelength than green, infrared and radio, so its frequency is the highest of the four.'
  },
  {
    question: 'A wave\'s wavelength is doubled and its speed stays the same. What happens to its frequency?',
    options: [
      { id: 'a', label: 'It doubles' },
      { id: 'b', label: 'It halves' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It quadruples' }
    ],
    answer: 'b',
    explanation: 'Speed equals wavelength times frequency. With the speed fixed, doubling the wavelength means the frequency must halve.'
  },
  {
    question: 'Which colour of visible light has the shortest wavelength?',
    options: [
      { id: 'a', label: 'Red' },
      { id: 'b', label: 'Green' },
      { id: 'c', label: 'Yellow' },
      { id: 'd', label: 'Violet' }
    ],
    answer: 'd',
    explanation: 'Visible light runs from red, near 700 nm, to violet, near 400 nm. Violet has the shortest wavelength and therefore the highest frequency of the visible colours.'
  },
  {
    question: 'In a vacuum, how do the speeds of red light and violet light compare?',
    options: [
      { id: 'a', label: 'Violet is faster, because its frequency is higher' },
      { id: 'b', label: 'Red is faster, because its wavelength is longer' },
      { id: 'c', label: 'They are the same: all light travels at 3.00 x 10^8 m/s' },
      { id: 'd', label: 'It depends on how bright each one is' }
    ],
    answer: 'c',
    explanation: 'All electromagnetic waves travel at the same speed in a vacuum. Red and violet differ in wavelength and frequency, but their product is always 3.00 x 10^8 m/s.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return { setting: stage.start ?? null };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { choice: 'crowd' },
  { setting: 1 },
  { decimal: 3 },
  { decimal: 5 },
  { order: ['b', 'd', 'a', 'c'] },
  { choice: 'ir' },
  { bins: { radio: 'f8', micro: 'f9', xray: 'f18' } },
  { decimal: 5.1 }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { choice: 'spread' },
  { setting: 3 },
  { decimal: 2 },
  { decimal: 4 },
  { order: ['c', 'a', 'd', 'b'] },
  { choice: 'uv' },
  { bins: { radio: 'f9', micro: 'f8', xray: 'f18' } },
  { decimal: 5.6 }
];

/** Build a full state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let bench = null;
  let runner = null;

  function labelsOf(stage) { return stage.labels || PLAIN_LABELS; }

  function onProbe(hit) {
    const L = labelsOf(runner.stage);
    if (hit.kind === 'trace') {
      runner.readout(`Screen // ${hit.plateLabel}`, `${L.spacing}: ${hit.nm} nm.`);
    } else if (hit.kind === 'scale') {
      runner.readout(`Ruler // ${hit.plateLabel}`, `${L.spacing}: ${fmtLength(hit.nm)}.`);
    } else if (hit.kind === 'prism') {
      runner.readout(`Band // ${hit.plateLabel}`, `Under the cursor: ${hit.nm} nm.`);
    }
  }

  function paintSetting() {
    const st = runner.stage.settings;
    runner.paintDial('setting', runner.state.setting, {
      min: 1, max: st.length, text: `${st[runner.state.setting - 1]} nm`
    });
  }

  function setSetting(v) {
    runner.state.setting = v;
    bench.setSetting(v);
    paintSetting();
  }

  function onLoad(stage, i, r) {
    const rigs = stage.rigs;
    bench.setRigs(rigs, {
      settings: stage.settings || [],
      setting: r.state.setting || 1,
      labels: labelsOf(stage)
    });
    bench.setSelectable(false);

    const parts = [];
    if (stage.settings) {
      parts.push(r.dialHtml('setting', {
        label: labelsOf(stage).dial, min: 1, max: stage.settings.length, value: r.state.setting
      }));
    }
    r.setControls(parts, null, stage.settings ? {
      dials: { setting: { min: 1, max: stage.settings.length, onChange: v => setSetting(v) } }
    } : {});
    if (stage.settings) paintSetting();
    r.readout(null, null, { idleHead: 'Screen // standby', idle: 'Tap a wave to measure it.' });
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => {
      bench = LightBench(r.frame.instrumentHost, {
        onProbe,
        onSetting: v => setSetting(v)
      });
    },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
