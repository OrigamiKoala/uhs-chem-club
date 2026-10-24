/**
 * q1-wave.js — Lanternfall, bench one: LIGHT AS A WAVE.
 *
 * Tallow left the player with electrons on rings at fixed distances and no reason why. Lanternfall is the reason, and it
 * starts with the light itself: the sky over this ice field is the first emission spectrum the player ever sees.
 *
 * The first of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4a), on the optics kit, and reworked on 2026-10-23 around
 * ONE CLICK (`docs/plans/lanternfall-world.md`). The bench is the wave flume's observation shelf on the south shore of the lake, and
 * its table is an optical rail: a lamp put in a screen draws its wave and counts the crests that pass each second, a colour dial tunes
 * it, a pulse is timed between two detectors set a measured distance apart, sources are laid on a rail by frequency.
 *
 * THE CLICK. Most players arrive believing colour is a kind of strength: violet is "more energetic" and so must be faster, or red,
 * the longest wave, must be the one that gets there first. So the quest asks for the guess BEFORE the timer is on the table, and then
 * the timer says that red and violet cross the same gap in the same time. The trade between crest spacing and crests a second
 * (stage 1) is only ever a trade at one speed, and that speed is the thing the pulse measures.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  tune a spare lamp until more crests pass a second than a beacon's       -> wavelength, frequency
 *   2  PREDICT: which of red and violet arrives first over one gap (no timer)  -> a guess before the evidence
 *   3  TEST: time a pulse of each colour between two detectors                 -> the speed of light
 *   4  five sources laid on a rail, lowest frequency to highest                -> the visible and electromagnetic spectrum
 *   -- debrief: a lamp can be told by its light, and a bright red one will not do what a faint violet one does.
 *
 * Cut on 2026-10-23 (problems doc T7, U3): "twice as far apart" (stage 1 again with a number), "a lamp not on the bench" (a division,
 * practised in the Drill Deck), "lowest to highest" with four lamps (stage 4 now holds the lamps among the other sources), "past
 * the ends" (the same idea as stage 4), and the flume strip, a water wave that carried nothing the screen did not (the field point is gone).
 *
 * EVERY READING IS `lightdata.js`: the crests that fit the ruler are `planTrace`, the time a pulse takes is `pulseNs`. The kit
 * (`table/kits/optics.js`) only asks what is standing in which slot.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { fmtLength } from '../../engine/lightbench.js';
import { planTrace } from '../../engine/lightdata.js';
import {
  opticsTable, waveScreen, logRuler, pulseRail, lamp, tunedLamp, radiator, detector, marker,
  waveRead, rulerRead, bandRead, pulseRead, seated, pickedUpBy, detectorsOn
} from '../../table/kits/optics.js';

export const meta = { stageCount: 4 };

/** When each withheld word is earned. */
export const VOCABULARY = [
  { term: /\belectromagnetic spectrum\b/i, introducedAt: 4 },
  { term: /\bvisible spectrum\b/i, introducedAt: 4 },
  { term: /\bspeed of light\b/i, introducedAt: 3 },
  { term: /\bwavelengths?\b/i, introducedAt: 1 },
  { term: /\bfrequenc(?:y|ies)\b/i, introducedAt: 1 }
];

/** Builds on nothing outside Tallow. */
export const BUILDS_ON = [];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and what each guess is called in the prompt. */
const QUEST_KEY = 'unit02/q1-wave';
const GUESS_LABEL = { red: 'Red first', violet: 'Violet first', same: 'Together' };

/** The dial, red end first: turning it up raises the frequency. */
const RED_TO_VIOLET = [700, 650, 600, 550, 500, 450, 400];

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

/** A lamp already standing in a screen's holder, fixed there: a reference the player reads and cannot move. */
const seatedLamp = (id, label, screen, nm) => lamp(id, label, screen.slots[0].at, nm, { fixed: true, zone: `slot:${screen.slots[0].id}` });

/** Rate of a wave screen, as a number the check compares. */
const rateOf = (t, id) => { const r = waveRead(t, id); return r && r.kind === 'light' ? r.plan.hz : null; };

/** The five sources of stage 4: the camp's radio mast and oven, two spare lamps, the medic's X-ray tube. Wavelengths in nm. */
const SOURCES = [
  ['radio', 'Relay mast', 3e9, 'radiator'],
  ['micro', 'Galley oven', 1.2e8, 'radiator'],
  ['red', 'Red lamp', 700, 'lamp'],
  ['violet', 'Violet lamp', 400, 'lamp'],
  ['xray', 'Medic X-ray', 0.1, 'radiator']
];
/** Lowest frequency first: the longest wavelength first. */
const BY_FREQUENCY = SOURCES.slice().sort((a, b) => b[2] - a[2]).map(s => s[0]);

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const a = waveScreen('a', 'Beacon 1', { x: 38, y: 20 }, { plain: true });
    const l = waveScreen('l', 'Spare lamp', { x: 112, y: 23 }, { settings: RED_TO_VIOLET, start: 4, plain: true });
    return {
      title: 'Red to Violet',
      prompt: 'Tune the spare lamp until more crests pass each second than pass for Beacon 1.',
      widget,
      table: opticsTable({
        pieces: [
          seatedLamp('ref', 'Beacon 1', a, 500),
          tunedLamp('lamp', 'Spare lamp', { x: 28, y: 53 })
        ],
        fixtures: [a.fixture, l.fixture],
        zones: { slots: [...a.slots, ...l.slots] }
      }),
      hints: [
        'Use the Colour dial on the spare lamp\'s screen.',
        'Compare the crests that pass each second on the spare lamp\'s screen with the number on Beacon 1\'s.',
        'Turn the dial until the spare lamp\'s count is the larger of the two, and look at how its crests are spaced.'
      ],
      check(state) {
        const t = state.table;
        const mine = rateOf(t, 'l');
        const ref = rateOf(t, 'a');
        if (mine === null) return { ok: false, notYet: true, msg: 'Put the spare lamp in its holder to light its screen.' };
        if (mine > ref) return { ok: true };
        return { ok: false, msg: 'At this setting the spare lamp has fewer crests passing each second than Beacon 1.' };
      },
      reward: {
        log: 'Violet: crests close together, many a second.',
        title: 'Wavelength and Frequency',
        body: 'The distance from one crest to the next is the wavelength, and the number of crests that pass each second is the frequency. Turning from red to violet shortens the wavelength and raises the frequency, so the two move in opposite directions.',
        model: { type: 'wave', nm: [700, 400], caption: 'One wave tuned from red to violet and back: as the crests crowd together, more of them pass each second, and the colour shifts with the wavelength.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Race Red and Violet',
    // A PREDICT STAGE: the timer is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Red and violet light cross the same gap: which one do you think arrives first?',
    widget,
    table: opticsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'red', label: 'Red first', at: { x: 38, y: 48 }, r: 7 },
          { id: 'violet', label: 'Violet first', at: { x: 75, y: 48 }, r: 7 },
          { id: 'same', label: 'Together', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three guesses into the slot.',
      'Think about what a lamp changes when it goes from red to violet: how far apart its crests are, how fast they travel, or both.',
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
      title: 'A Guess to Test',
      body: 'A guess is only worth something if the bench can test it, and a pulse of light can be timed. Next, a timer sends each colour down the same rail.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rail = pulseRail('rail', 'Pulse timer', { x: 68, y: 21.5 }, {
      lamp: true,
      size: { w: 134, h: 39 },
      marks: [{ metres: 0, label: '0 m' }, { metres: 1.5, label: '1.5 m' }, { metres: 3, label: '3.0 m' }, { metres: 4.5, label: '4.5 m' }]
    });
    return {
      title: 'Time the Pulses',
      // The guess comes back here, locked in: it is the first thing the player reads about the test.
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": how fast does violet light travel?`
          : 'How fast does violet light travel?';
      },
      widget,
      table: opticsTable({
        pieces: [
          detector('d1', 'Detector 1', { x: 13, y: 50 }),
          detector('d2', 'Detector 2', { x: 33, y: 50 }),
          lamp('red', 'Red lamp', { x: 57, y: 50 }, 700),
          lamp('violet', 'Violet lamp', { x: 80, y: 50 }, 400)
        ],
        fixtures: [rail.fixture, marker('speed', 'Your reading', { x: 112, y: 52 }, { label: 'Speed (x 10^8 m/s)', min: 0, max: 6, step: 0.5, value: 0, size: { w: 36, h: 16 } })],
        zones: { slots: rail.slots },
        recorder: { at: { x: 140, y: 52 }, size: { w: 18, h: 18 }, xLabel: 'Gap', xUnit: 'm', yLabel: 'Time', yUnit: 'ns' }
      }),
      hints: [
        'Use "Fire Pulse" with a detector on each of two marks and a lamp in the holder.',
        'Compare the time the red lamp\'s pulse takes over a gap with the time the violet lamp\'s takes over the same gap.',
        'Divide the gap by the time, turning nanoseconds into seconds with 10^-9, and set your reading to the result.'
      ],
      check(state) {
        const t = state.table;
        const v = t.fixtures.speed.dials.n.value;
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the speed you worked out.' };
        if (v === 3) return { ok: true };
        return { ok: false, msg: 'Your reading does not match the gap and the pulse time on the timer.' };
      },
      // The verdict on the guess opens the card; it never says a wrong guess cost anything.
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'same'
          ? 'You predicted that they arrive together, and the timer agreed. '
          : 'The timer did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'Red and violet crossed the same gap in the same time.',
          title: 'The Speed of Light',
          body: `${verdict}Light crosses a gap at one speed whatever its colour: 3.00 x 10^8 metres per second, the speed of light. That is why a shorter wavelength has to mean a higher frequency, since the two multiply to that speed.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ruler = logRuler('ruler', 'Ruler', { x: 45, y: 19 });
    const source = ([id, label, nm, kind]) => (kind === 'lamp' ? lamp(id, label, { x: 20, y: 52 }, nm) : radiator(id, label, { x: 20, y: 52 }, nm));
    const rail = { id: 'rail', at: { x: 74, y: 53 }, size: { w: 134, h: 15 }, first: 'Lowest frequency', last: 'Highest frequency', items: ['xray', 'red', 'radio', 'violet', 'micro'], start: ['xray', 'red', 'radio', 'violet', 'micro'] };
    return {
      title: 'One Scale',
      prompt: 'Put the five sources on the rail from lowest frequency to highest.',
      widget,
      table: opticsTable({
        pieces: SOURCES.map(source),
        fixtures: [ruler.fixture],
        zones: { slots: ruler.slots, rail }
      }),
      hints: [
        'Use the ruler\'s holder, and drag a source back onto the rail when you have read it.',
        'Compare the five wavelengths on the ruler, remembering that every wave of light crosses a gap at the same speed.',
        'The longer the wavelength, the fewer crests pass each second, so line the sources up by wavelength with the longest at the left.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < SOURCES.length) return { ok: false, notYet: true, msg: 'Put all five sources back on the rail.' };
        if (order.join() === BY_FREQUENCY.join()) return { ok: true };
        const nm = id => t.pieces[id].props.nm;
        for (let k = 0; k < order.length - 1; k++) {
          if (nm(order[k]) < nm(order[k + 1])) {
            return { ok: false, msg: `${t.pieces[order[k]].label} stands left of ${t.pieces[order[k + 1]].label}, and its wavelength is the shorter.` };
          }
        }
        return { ok: false, msg: 'The rail does not run the way the ruler\'s wavelengths do.' };
      },
      reward: {
        log: 'Radio, oven, red, violet, X-ray: one scale.',
        title: 'The Electromagnetic Spectrum',
        body: 'A radio mast, an oven, a lamp and an X-ray tube all send out the same kind of wave; only the wavelength differs. The narrow band the eye can see, about 700 nm (red) to 400 nm (violet), is the visible spectrum, and the whole family is the electromagnetic spectrum.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the lamp into its holder.', 'Turn the Colour dial to tune it.'],
  3: ['Set a lamp and two detectors, then press Fire Pulse.'],
  4: ['Drag a source into the ruler\'s holder to read it,', 'then back onto the rail.']
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
      body: 'Light is a wave, and every wave has a wavelength and a frequency that trade against each other through one fixed speed: 3.00 x 10^8 metres per second. What the eye calls colour is a thin slice of the electromagnetic spectrum.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Once you can turn a wavelength into a frequency, you can compare a radio mast with an X-ray tube on one scale. That is the scale the rest of this world is measured on.'
    },
    {
      heading: 'Next',
      body: 'Great job measuring light on the ice. Next, we\'ll investigate why a bright red lamp can\'t knock an electron loose, but faint violet light can.'
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Lamps are put in holders and on the rail, dials are set, a pulse is fired.
   Nothing here says what a screen reads.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const colour = (fixture, value) => ({ setDial: { fixture, dial: 'colour', value } });
const reading = (fixture, value) => ({ setDial: { fixture, dial: 'n', value } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [put('lamp', 'slot:l.lamp'), colour('l', 6)],
  [{ predict: 'same' }],
  [put('d1', 'slot:rail.m0'), put('d2', 'slot:rail.m3'), put('red', 'slot:rail.lamp'), { run: 'rail' }, put('violet', 'slot:rail.lamp'), { run: 'rail' }, reading('speed', 3)],
  [put('radio', 'rail:0'), put('micro', 'rail:1'), put('red', 'rail:2'), put('violet', 'rail:3'), put('xray', 'rail:4')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('lamp', 'slot:l.lamp'), colour('l', 2)],
  [],
  [put('d1', 'slot:rail.m0'), put('d2', 'slot:rail.m2'), put('violet', 'slot:rail.lamp'), { run: 'rail' }, reading('speed', 2.5)],
  [put('violet', 'rail:0')]
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
export { planTrace, fmtLength, rulerRead, bandRead, pulseRead, pickedUpBy, detectorsOn, seated, SOURCES, BY_FREQUENCY, QUEST_KEY };
