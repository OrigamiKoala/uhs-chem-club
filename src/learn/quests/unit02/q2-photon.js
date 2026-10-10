/**
 * q2-photon.js — Lanternfall, bench two: PHOTONS.
 *
 * The light bench's photocell head: a metal plate in a vacuum tube, a counter
 * for the electrons that leave it each second, and a meter for the speed of the
 * fastest. `q1-wave` ended on a puzzle the wave picture cannot answer, and this
 * is the answer, reached the way it was reached in 1905: by turning two dials
 * and watching two meters disagree about what "more" means.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  free electrons from a plate                      -> a puzzle: red at full does nothing
 *   2  the lowest frequency that frees any              -> threshold frequency
 *   3  what brightness does above the threshold         -> photon
 *   4  what raising the frequency does                  -> the photoelectric effect
 *   5  the energy of one photon                         -> E = h x frequency, Planck's constant
 *   6  three plates, ordered by how hard they hold on   -> work function
 *   7  the lamp that frees electrons from zinc          -> only the ultraviolet has the energy
 *   8  why a brighter red lamp never works on zinc      -> light is both wave and particle
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 5 asks for the energy of a photon without
 * ever giving Planck's constant: the plate carries one worked check, a sodium
 * threshold quoted in joules beside its wavelength, and dividing the one by the
 * frequency of the other is how the constant is found.
 *
 * EVERY STAGE IS A FIGHT, and this is the bench the fight fits best: the plate
 * is a lamp moth's shell, and "more power" is the surprise, because turning the
 * lamp up on a shell that will not give is exactly what fails. The moth sheds
 * when `planPhotocell` says electrons leave, as many streaks as the counter
 * counts, and no `check()` knows any of it (foes.js).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { LightBench } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { planPhotocell } from '../../engine/lightdata.js';
import { esc } from '../../../ui/layout.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bthreshold frequency\b/i, introducedAt: 2 },
  { term: /\bphotoelectric\b/i, introducedAt: 4 },
  { term: /\bphotons?\b/i, introducedAt: 3 },
  { term: /\bplanck.?s constant\b/i, introducedAt: 5 },
  { term: /\bwork functions?\b/i, introducedAt: 6 }
];

/** Wavelength, frequency, the speed of light and the visible spectrum are plain words from q1-wave. */
export const BUILDS_ON = ['unit02/q1-wave'];

const SPEAKER = 'Vess';

const LABELS = { spacing: 'Wavelength', rate: 'Frequency', count: 'Electrons freed per second', speed: 'Fastest electron', dial: 'Wavelength' };

/** The dial, red end first. */
const SWEEP = [650, 600, 550, 500, 450, 400, 350];
/** Finer near sodium's threshold, so "the lowest that frees any" has exactly one answer. */
const NEAR_SODIUM = [650, 600, 575, 550, 525, 500, 450];
/** A wide sweep for the three plates, with each metal's own threshold between two steps. */
const THREE_PLATES = [650, 600, 575, 550, 525, 450, 350, 300, 275];
const FOR_ZINC = [650, 520, 400, 300, 250];

export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'A Plate That Will Not Give',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench shines a lamp on a metal plate in a vacuum tube, and counts the electrons that come off it. A second meter reads how fast the fastest one leaves.'
    },
    prompt: 'Get electrons off the plate.',
    labels: LABELS,
    controls: ['tune', 'brightness'],
    settings: SWEEP,
    start: 1,
    brightnessStart: 5,
    brightnessDial: true,
    rigs: [{ id: 'cell', label: 'SODIUM PLATE', head: 'photocell', metal: 'Na', tuned: true, note: 'Na, a plate in a vacuum tube' }],
    widget: { type: 'none' },
    encounter: {
      species: 'lamp moth',
      act: 'Strike',
      intent: 'The moth clings to the plate, wings folded.'
    },
    hints: [
      'Turn the colour dial and watch the counter above the plate.',
      'Compare what the counter reads for red at full brightness with what it reads for violet at its dimmest.',
      'Try every colour on the dial at both ends of the brightness dial until the counter moves off zero.'
    ],
    check(state) {
      const nm = SWEEP[state.setting - 1];
      const freed = planPhotocell('Na', nm, state.brightness).count > 0;
      if (freed) return { ok: true };
      if (state.setting === 1 && state.brightness === 5) {
        return { ok: false, notYet: true, msg: 'Nothing is leaving the plate with the lamp as it stands. Change what it does.' };
      }
      return { ok: false, msg: 'The counter still reads zero. Brighter is not the only thing this lamp can change.' };
    },
    reward: {
      log: 'Red at full brightness: nothing. Violet, barely lit: electrons.',
      title: 'A Puzzle the Wave Cannot Solve',
      body: 'A brighter lamp is a bigger wave, so a wave picture says red at full strength should free at least as many electrons as violet at a whisper. The plate says the opposite, which is something waves alone cannot explain.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Where It Wakes',
    prompt: 'Find the lowest frequency that frees any electron from this plate.',
    labels: LABELS,
    controls: ['tune'],
    settings: NEAR_SODIUM,
    start: 1,
    brightness: 3,
    rigs: [{ id: 'cell', label: 'SODIUM PLATE', head: 'photocell', metal: 'Na', tuned: true, note: 'Na, a plate in a vacuum tube' }],
    widget: { type: 'none' },
    encounter: {
      species: 'lamp moth',
      act: 'Strike',
      intent: 'The moth waits, wings folded, for light to reach it.'
    },
    hints: [
      'Turn the dial from the red end toward violet and watch for the first setting where the counter wakes.',
      'Every setting beyond it frees electrons too, so the answer is the first one that does, not any one that does.',
      'Step the dial one position at a time and stop on the setting just after the counter leaves zero.'
    ],
    check(state) {
      const freed = i => planPhotocell('Na', NEAR_SODIUM[i - 1], 3).count > 0;
      if (!freed(state.setting)) {
        return { ok: false, msg: 'No electron leaves the plate at this setting. Keep turning toward violet.' };
      }
      if (state.setting > 1 && freed(state.setting - 1)) {
        return { ok: false, msg: 'Electrons already leave at the setting before this one. Look for where they first appear.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The counter wakes at one setting and not before.',
      title: 'Threshold Frequency',
      body: 'Below one particular frequency no electron leaves, however bright the lamp is; at and above it electrons come off at once. That cut-off is the threshold frequency, and every metal has its own.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Turn Up the Lamp',
    prompt: 'Say what turning up the brightness does, with the lamp set above the threshold.',
    labels: LABELS,
    controls: ['brightness'],
    brightnessStart: 2,
    brightnessDial: true,
    rigs: [{ id: 'cell', label: 'SODIUM PLATE', head: 'photocell', metal: 'Na', nm: 400, note: 'Na, a violet lamp is fixed on it' }],
    widget: {
      type: 'choice', label: 'What it does',
      options: [
        { id: 'more', label: 'More electrons leave each second, at the same speed' },
        { id: 'faster', label: 'The same number leave, but faster' },
        { id: 'both', label: 'More leave, and each one leaves faster' },
        { id: 'fewer', label: 'Fewer electrons leave' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Choose Move',
      intent: 'A violet lamp is fixed on the moth, and its wings flicker.'
    },
    hints: [
      'Turn the brightness dial up and down and watch both meters.',
      'Compare the counter with the speed meter at two brightness settings and see which of them moves.',
      'Read the counter and the speed at the lowest brightness, then again at the highest, and note which meter changed.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what turning up the brightness does.' };
      if (state.choice !== 'more') {
        return { ok: false, msg: 'Read the counter and the speed meter at a low brightness and again at a high one, and see which of them moved.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Brighter: more electrons, same speed.',
      title: 'Photon',
      body: 'Brightness changes how many electrons leave but not how fast, as if the light arrived in separate packets and each packet freed one electron. Each packet is a photon, and a brighter lamp sends more photons every second, not stronger ones.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Turn Up the Frequency',
    prompt: 'Say what raising the frequency does, with the brightness held where it is.',
    labels: LABELS,
    controls: ['tune'],
    settings: [550, 500, 450, 400, 350, 300],
    start: 1,
    brightness: 3,
    rigs: [{ id: 'cell', label: 'SODIUM PLATE', head: 'photocell', metal: 'Na', tuned: true, note: 'Na, brightness held' }],
    widget: {
      type: 'choice', label: 'What it does',
      options: [
        { id: 'faster', label: 'Each electron leaves faster, and the same number leave' },
        { id: 'more', label: 'More electrons leave, at the same speed' },
        { id: 'both', label: 'More leave, and each one leaves faster' },
        { id: 'none', label: 'Nothing changes once electrons are leaving' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Choose Move',
      intent: 'The moth is lit and holding its ground.'
    },
    hints: [
      'Turn the dial toward violet and watch the counter and the speed meter.',
      'Compare the two meters at the first setting that frees electrons with the same two meters at the last.',
      'Note which meter changes between the first and last settings, and which stays put.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what raising the frequency does.' };
      if (state.choice === 'none') {
        return { ok: false, msg: 'One of the two meters does move as the dial turns. Read both at each end of the sweep.' };
      }
      if (state.choice !== 'faster') {
        return { ok: false, msg: 'Read the counter and the speed meter at the first setting that frees electrons and at the last, and see which one changed.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Higher frequency: faster electrons, same number.',
      title: 'The Photoelectric Effect',
      body: 'Raising the frequency makes each freed electron faster and leaves their number alone, while raising the brightness does the opposite. This is the photoelectric effect, and it shows that a photon\'s energy is set by its frequency and the number of photons by the brightness.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'One Photon\'s Energy',
    prompt: 'Give the energy of one photon from a 500 nm lamp.',
    labels: LABELS,
    controls: [],
    reference: ['Sodium plate: threshold 539 nm, which is 3.69 x 10^-19 J for each photon', 'Light speed: 3.00 x 10^8 m/s'],
    rigs: [{ id: 'cell', label: 'SODIUM PLATE', head: 'photocell', metal: 'Na', nm: 539, note: 'Na, lit at its threshold' }],
    widget: { type: 'decimal', label: 'Energy of one photon (x 10^-19 J)', min: 0, max: 8, step: 0.5 },
    encounter: {
      species: 'lamp moth',
      act: 'Take Shot',
      intent: 'The moth waits for a measured shot.'
    },
    hints: [
      'Use the sodium plate\'s worked figure: its threshold wavelength is given beside the energy of one photon at that wavelength.',
      'Turn the threshold wavelength into a frequency, then divide the photon\'s energy by that frequency to find the number that ties them together.',
      'Convert 500 nm to a frequency, then multiply by the number you just found to get the energy of one of its photons.'
    ],
    check(state) {
      if (state.decimal === 0) return { ok: false, notYet: true, msg: 'Set the energy you worked out.' };
      if (state.decimal !== 4) {
        return { ok: false, msg: 'A photon\'s energy is proportional to its frequency, so scale the worked sodium figure by how the two frequencies compare.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Energy is frequency times one fixed number.',
      title: 'Planck\'s Constant',
      body: 'A photon\'s energy is its frequency multiplied by one fixed number, E = h x frequency, where h = 6.626 x 10^-34 joule seconds is Planck\'s constant. The sodium plate\'s worked figure was simply that sum done at its threshold.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Three Plates',
    prompt: 'Order the three plates by how tightly each holds its electrons, loosest first.',
    labels: LABELS,
    controls: ['tune'],
    settings: THREE_PLATES,
    start: 1,
    brightness: 3,
    rigs: [
      { id: 'zn', label: 'ZINC PLATE', head: 'photocell', metal: 'Zn', tuned: true, note: 'Zn' },
      { id: 'cs', label: 'CESIUM PLATE', head: 'photocell', metal: 'Cs', tuned: true, note: 'Cs' },
      { id: 'na', label: 'SODIUM PLATE', head: 'photocell', metal: 'Na', tuned: true, note: 'Na' }
    ],
    widget: {
      type: 'order', label: 'Loosest first',
      items: [{ id: 'cs', label: 'Cesium' }, { id: 'na', label: 'Sodium' }, { id: 'zn', label: 'Zinc' }]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Line Up',
      intent: 'Three moths hang at three plates, and each grips in its own way.',
      hit: 'All three moths go dark and drift away.'
    },
    hints: [
      'Turn the dial from red toward violet and watch which plate\'s counter wakes first.',
      'The plate that wakes at the lowest frequency lets go of its electrons most easily.',
      'Note the setting where each plate\'s counter first leaves zero, then place the plate that woke earliest first.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Tap all three plates in order.' };
      const want = ['cs', 'na', 'zn'];
      if (state.order.join() === want.slice().reverse().join()) {
        return { ok: false, msg: 'That order runs the wrong way: the first plate you tap must be the one that lets go most easily.' };
      }
      if (state.order.join() !== want.join()) {
        return { ok: false, msg: 'Sweep the dial and note where each plate\'s counter first wakes before you place it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Cesium wakes first, then sodium, then zinc.',
      title: 'Work Function',
      body: 'The least energy that frees an electron from a metal is its work function, about 3.4 x 10^-19 J for cesium, 3.7 for sodium and 6.9 for zinc. The higher it is, the higher the frequency a photon needs before it frees anything.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Freeing Zinc',
    prompt: 'Pick the lamp that frees electrons from the zinc plate.',
    labels: LABELS,
    controls: ['tune'],
    settings: FOR_ZINC,
    start: 1,
    brightness: 5,
    reference: ['Sample A: 650 nm', 'Sample B: 520 nm', 'Sample C: 250 nm'],
    rigs: [{ id: 'cell', label: 'ZINC PLATE', head: 'photocell', metal: 'Zn', tuned: true, note: 'Zn, at full brightness' }],
    widget: {
      type: 'choice', label: 'The lamp that works',
      options: [
        { id: 'a', label: 'Sample A' },
        { id: 'b', label: 'Sample B' },
        { id: 'c', label: 'Sample C' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Choose Lamp',
      intent: 'A zinc-shelled moth clings on with its wings tight.'
    },
    hints: [
      'Set the dial to each lamp\'s wavelength in turn and watch the counter above the zinc plate.',
      'Compare each lamp\'s photon energy with the work function of zinc, which was the highest of the three plates.',
      'A lamp frees electrons only if its wavelength is shorter than the zinc plate\'s threshold wavelength.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick a lamp.' };
      if (state.choice !== 'c') {
        return { ok: false, msg: 'Set the dial to that lamp\'s wavelength and see whether the counter wakes.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Only the ultraviolet lamp frees zinc.',
      title: 'Zinc Needs Ultraviolet',
      body: 'Zinc holds its electrons so tightly that only ultraviolet photons carry enough energy to free one. Red and green photons fall short, and no amount of them makes up the difference.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Why Brighter Fails',
    prompt: 'Say why a brighter red lamp will never work on zinc.',
    labels: LABELS,
    controls: ['tune', 'brightness'],
    settings: [650, 400, 300, 250],
    start: 1,
    brightnessStart: 3,
    brightnessDial: true,
    rigs: [{ id: 'cell', label: 'ZINC PLATE', head: 'photocell', metal: 'Zn', tuned: true, note: 'Zn' }],
    widget: {
      type: 'choice', label: 'Why',
      options: [
        { id: 'energy', label: 'Each red photon carries too little energy, and a brighter lamp only sends more of them' },
        { id: 'heat', label: 'A brighter red lamp heats the plate, and a hot plate holds its electrons more tightly' },
        { id: 'size', label: 'Red waves are too long to fit inside a zinc atom' },
        { id: 'slow', label: 'Red light travels too slowly to reach the plate' }
      ]
    },
    encounter: {
      species: 'lamp moth',
      act: 'Break Guard',
      intent: 'The zinc moth shrugs off a red lamp, however bright.'
    },
    hints: [
      'Turn the red lamp up to full brightness on the zinc plate and watch the counter.',
      'Compare what brightness changes with what frequency changes, using stages three and four.',
      'Ask whether more photons of too little energy can add up to one photon of enough energy.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the reason.' };
      if (state.choice !== 'energy') {
        return { ok: false, msg: 'Try the explanation against the bench: raise the brightness at red and see whether it changes anything.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'More photons of too little energy never add up.',
      title: 'Both Wave and Particle',
      body: 'Light spreads out and interferes like a wave, yet it arrives in photons that each carry energy h x frequency and free electrons one at a time. Neither picture alone explains the bench, so light is described as both a wave and a particle.',
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
      body: 'Light comes in packets called photons, and each photon\'s energy is Planck\'s constant times its frequency. An electron leaves a metal only if one photon carries more than the metal\'s work function, and no number of weaker photons can add up to it.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Energy comes in amounts, not smooth slopes. Every atom you have met has electrons that can only hold certain energies, and this is why.'
    },
    {
      heading: 'Next',
      body: 'The sky over this ice field is glowing in a handful of sharp colours. The next bench asks what a gas must be doing to give out exactly those.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the energy of one photon of light with a frequency of 6.0 x 10^14 Hz? (h = 6.626 x 10^-34 J s)',
    options: [
      { id: 'a', label: '4.0 x 10^-19 J' },
      { id: 'b', label: '1.1 x 10^-48 J' },
      { id: 'c', label: '9.1 x 10^47 J' },
      { id: 'd', label: '6.6 x 10^-34 J' }
    ],
    answer: 'a',
    explanation: 'E = hν = (6.626 x 10^-34 J s)(6.0 x 10^14 s^-1) = 4.0 x 10^-19 J. Dividing instead of multiplying gives the other figures.'
  },
  {
    question: 'Red light does not free electrons from a metal, however bright the lamp. Ultraviolet light does. Why?',
    options: [
      { id: 'a', label: 'Each ultraviolet photon carries more energy than each red photon' },
      { id: 'b', label: 'Ultraviolet light is brighter than red light' },
      { id: 'c', label: 'Ultraviolet light travels faster than red light' },
      { id: 'd', label: 'Red light has too many photons' }
    ],
    answer: 'a',
    explanation: 'A photon\'s energy is proportional to its frequency. Ultraviolet photons have the higher frequency, so only they carry more than the work function. Brightness changes the number of photons, not the energy of each.'
  },
  {
    question: 'A lamp above the threshold frequency is made brighter. What happens in the photocell?',
    options: [
      { id: 'a', label: 'More electrons are freed each second, each with the same maximum speed' },
      { id: 'b', label: 'The same number of electrons are freed, each with a higher maximum speed' },
      { id: 'c', label: 'More electrons are freed, each with a higher maximum speed' },
      { id: 'd', label: 'No change' }
    ],
    answer: 'a',
    explanation: 'Brightness sets the number of photons per second, so it sets the number of electrons freed. The energy of each photon, and so the speed of the fastest electron, depends only on frequency.'
  },
  {
    question: 'Metal X has a lower work function than metal Y. Compared with Y, metal X has:',
    options: [
      { id: 'a', label: 'A higher threshold frequency' },
      { id: 'b', label: 'A lower threshold frequency' },
      { id: 'c', label: 'The same threshold frequency' },
      { id: 'd', label: 'No threshold frequency' }
    ],
    answer: 'b',
    explanation: 'The threshold photon has just the work function\'s energy. A smaller work function needs a smaller photon energy, and so a lower frequency, to free an electron.'
  },
  {
    question: 'Which observation shows that light behaves as particles and not only as waves?',
    options: [
      { id: 'a', label: 'Light of low frequency frees no electrons however bright it is' },
      { id: 'b', label: 'Light travels at 3.00 x 10^8 m/s in a vacuum' },
      { id: 'c', label: 'Light has a wavelength' },
      { id: 'd', label: 'Red light looks different from violet light' }
    ],
    answer: 'a',
    explanation: 'A wave model says a bright enough lamp should free electrons at any frequency. That it does not is evidence that light delivers its energy in separate photons.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    setting: stage.start ?? null,
    brightness: stage.brightnessStart ?? stage.brightness ?? 3
  };
}

export const SOLUTIONS = [
  { setting: 6, brightness: 1 },
  { setting: 5 },
  { choice: 'more' },
  { choice: 'faster' },
  { decimal: 4 },
  { order: ['cs', 'na', 'zn'] },
  { choice: 'c' },
  { choice: 'energy' }
];

export const MISSES = [
  { setting: 3, brightness: 5 },
  { setting: 7 },
  { choice: 'both' },
  { choice: 'more' },
  { decimal: 3 },
  { order: ['zn', 'na', 'cs'] },
  { choice: 'b' },
  { choice: 'heat' }
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

  function nmNow() {
    const st = runner.stage.settings;
    return st ? st[runner.state.setting - 1] : null;
  }

  function paintSetting() {
    const st = runner.stage.settings;
    if (!st) return;
    runner.paintDial('setting', runner.state.setting, { min: 1, max: st.length, text: `${st[runner.state.setting - 1]} nm` });
  }
  function paintBrightness() {
    runner.paintDial('brightness', runner.state.brightness, { min: 1, max: 5, text: String(runner.state.brightness) });
  }

  function setSetting(v) {
    runner.state.setting = v;
    bench.setSetting(v);
    paintSetting();
    readNow();
  }
  function setBrightness(v) {
    runner.state.brightness = v;
    bench.setBrightness(v);
    paintBrightness();
    readNow();
  }

  /** What the plate is doing under the present dials, in the instrument's own words. */
  function readNow(quiet = false) {
    const stage = runner.stage;
    const rows = stage.rigs.map(r => {
      const nm = r.tuned ? nmNow() : r.nm;
      const plan = planPhotocell(r.metal, nm, runner.state.brightness);
      // The moth on this plate sheds exactly what the counter counts.
      runner.frame.foeReact(r.id, { nm, brightness: runner.state.brightness }, quiet);
      return `${r.label}: ${plan.count} electrons a second, fastest ${plan.speed.toFixed(1)} x 10^5 m/s`;
    });
    runner.readout('Counter // plate', rows.join('. ') + '.');
  }

  function onLoad(stage, i, r) {
    bench.setRigs(stage.rigs, {
      settings: stage.settings || [],
      setting: r.state.setting || 1,
      brightness: r.state.brightness,
      brightnessDial: Boolean(stage.brightnessDial),
      labels: stage.labels
    });
    bench.setSelectable(false);

    const parts = [];
    const dials = {};
    if (stage.settings) {
      parts.push(r.dialHtml('setting', { label: 'Wavelength', min: 1, max: stage.settings.length, value: r.state.setting }));
      dials.setting = { min: 1, max: stage.settings.length, onChange: v => setSetting(v) };
    }
    if (stage.brightnessDial) {
      parts.push(r.dialHtml('brightness', { label: 'Brightness', min: 1, max: 5, value: r.state.brightness }));
      dials.brightness = { min: 1, max: 5, onChange: v => setBrightness(v) };
    }
    if (stage.reference?.length) {
      parts.push(`
        <div class="assay-extract">
          <span class="form-label">On the plate</span>
          <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      `);
    }
    r.setControls(parts, null, { dials });
    paintSetting();
    if (stage.brightnessDial) paintBrightness();
    readNow(true);
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => {
      bench = LightBench(r.frame.instrumentHost, {
        onProbe: () => {},
        onSetting: v => setSetting(v),
        onBrightness: v => setBrightness(v)
      });
    },
    onLoad,
    onDispose: () => bench?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
