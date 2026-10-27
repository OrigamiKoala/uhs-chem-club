/**
 * q2-photon.js — Lanternfall, bench two: PHOTONS.
 *
 * The photocell: a metal plate in a vacuum tube, a cup that counts the electrons that leave it each second, and a meter for
 * the speed of the fastest. `q1-wave` ended on light as a wave, and this is the place the wave picture fails, reached the way it
 * was reached in 1905: by turning two dials and watching two meters disagree about what "more" means.
 *
 * The second of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4a), on the optics kit, reworked on 2026-10-23 around ONE
 * CLICK. The bench is the desk at the foot of an aurora mast, where the photocell is kept out of the wind: metal plates are dragged
 * into the holder, the colour and the brightness are set, and the electrons that leave the plate run to a collector and into a counting cup.
 *
 * THE CLICK. A player who has just met light as a wave believes a brighter lamp is a bigger wave and so does more: a bright enough
 * red lamp should free electrons that a faint violet one frees. So the guess is asked first, with no photocell on the table, and then
 * the photocell shows the opposite: dim violet frees electrons and the brightest red frees none.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  PREDICT: will a very bright red lamp free electrons from sodium (no photocell)   -> a guess before the evidence
 *   2  TEST: get electrons to break free from the sodium plate                          -> the photoelectric effect
 *   3  the lowest frequency that frees any                                              -> threshold frequency
 *   4  what brightness does above the threshold (twice the count, the same speed)       -> photon
 *   5  three plates, put in order of how hard they hold on                              -> work function
 *
 * Cut on 2026-10-23 (problems doc T7): the speed-against-frequency stage (stage 4's idea is the same trade, and the speed meter
 * is still on the dial), the photon-energy sum with Planck's constant (a plug-in; the Drill Deck practises it), the zinc tray sort
 * (stage 5 again with lamps) and the closing prediction (the guess is now asked at the start, where it can be wrong).
 *
 * EVERY READING IS `planPhotocell`: the counter, the speed meter and the cup are its answer for the plate in the holder, the colour on
 * the dial and the brightness, and no `check()` authors any of it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { planPhotocell, photonJoules, thresholdNm } from '../../engine/lightdata.js';
import {
  opticsTable, photocell, metalPlate, lamp, cellRead, firstFreeing, seated
} from '../../table/kits/optics.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bphotoelectric\b/i, introducedAt: 2 },
  { term: /\bthreshold frequency\b/i, introducedAt: 3 },
  { term: /\bphotons?\b/i, introducedAt: 4 },
  { term: /\bwork functions?\b/i, introducedAt: 5 }
];

/** Wavelength, frequency, the speed of light and the visible spectrum are plain words from q1-wave. */
export const BUILDS_ON = ['unit02/q1-wave'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and what each guess is called in the prompt. */
const QUEST_KEY = 'unit02/q2-photon';
const GUESS_LABEL = { many: 'Many electrons', few: 'A few electrons', none: 'No electrons' };

/** The dial, red end first. */
const SWEEP = [650, 600, 550, 500, 450, 400, 350];
/** Finer near sodium's threshold, so "the lowest that frees any" has exactly one answer. */
const NEAR_SODIUM = [650, 600, 575, 550, 525, 500, 450];
/** A wide sweep for the three plates, with each metal's own threshold between two steps. */
const THREE_PLATES = [650, 600, 575, 550, 525, 450, 350, 300, 275];

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

/** A plate standing in the holder, fixed there: the stage is about the light, not the plate. */
const seatedPlate = (id, label, cell, metal) => metalPlate(id, label, cell.slots[0].at, metal, { fixed: true, zone: `slot:${cell.slots[0].id}` });

const SHEET = { at: { x: 128, y: 28 }, size: { w: 36, h: 34 }, xLabel: 'Frequency', xUnit: 'x 10^14 /s', yLabel: 'Speed', yUnit: 'x 10^5 m/s' };

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Bright Red on Sodium',
    // A PREDICT STAGE: the photocell is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'A very bright red lamp shines on a sodium plate: how many electrons do you think it frees?',
    widget,
    table: opticsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'many', label: 'Many', at: { x: 38, y: 48 }, r: 7 },
          { id: 'few', label: 'A few', at: { x: 75, y: 48 }, r: 7 },
          { id: 'none', label: 'None', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three guesses into the slot.',
      'Think about what a brighter lamp is: a bigger wave that carries more energy, or something else.',
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
      body: 'A wave that is bigger carries more energy, so it is fair to guess that a brighter lamp frees more. Next, a photocell will test it.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 31 }, { settings: SWEEP, start: 1, brightness: { start: 5 } });
    return {
      title: 'Freeing Electrons',
      // The guess comes back here, locked in.
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": get electrons to break free from the sodium plate.`
          : 'Get electrons to break free from the sodium plate.';
      },
      widget,
      table: opticsTable({
        pieces: [metalPlate('na', 'Sodium', { x: 128, y: 22 }, 'Na')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Use the Colour dial and the Brightness dial, and watch "Electrons Per Second".',
        'Compare what frees for red at full brightness with what frees for violet at its dimmest.',
        'Try different colours on the dial until electrons break free from the plate.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        if (!r.plate) return { ok: false, notYet: true, msg: 'Put the sodium plate in the holder.' };
        if (r.freed) return { ok: true };
        if (r.fixture.dials.colour.value === 1 && r.brightness === 5) {
          return { ok: false, notYet: true, msg: 'Nothing is leaving the plate with the lamp as it stands.' };
        }
        return { ok: false, msg: 'No electrons are freed at this setting.' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'none'
          ? 'You predicted none, and the plate agreed. '
          : 'The plate did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'Red at full brightness: nothing. Violet, barely lit: electrons.',
          title: 'The Photoelectric Effect',
          body: `${verdict}Red light at full brightness frees nothing, while dim violet light frees electrons immediately. A wave model predicts that higher brightness delivers more energy, so light must deliver its energy in discrete packets.`,
          model: { type: 'photons', metal: 'Na', nm: 400, brightness: 1, caption: 'A violet photon carries enough energy to free an electron from sodium, while a red photon carries too little.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 26 }, { settings: NEAR_SODIUM, start: 1, brightness: 3 });
    return {
      title: 'Finding the Threshold',
      prompt: 'Find the lowest frequency that knocks electrons loose from the sodium plate.',
      widget,
      table: opticsTable({
        pieces: [seatedPlate('na', 'Sodium', cell, 'Na')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Use the Colour dial, stepping it one setting at a time.',
        'Watch "Electrons Per Second": every setting past the first one that frees electrons frees them too.',
        'Stop on the first setting where electrons break free from the plate.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        const v = r.fixture.dials.colour.value;
        const first = firstFreeing(r.fixture.props.settings, 'Na', 3);
        if (v === first) return { ok: true };
        if (v === 1) return { ok: false, notYet: true, msg: 'The lamp is where it started. Set it, then press Submit.' };
        if (v < first) return { ok: false, msg: 'No electrons are freed at this setting.' };
        return { ok: false, msg: 'Electrons were already freed at a lower setting.' };
      },
      reward: {
        log: 'Electrons break free at one setting and not before.',
        title: 'Threshold Frequency',
        body: 'Below one particular frequency no electron leaves, however bright the lamp is; at and above it electrons come off at once. That cut-off is the threshold frequency, and every metal has its own.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 26 }, { lamp: true, brightness: { start: 2 } });
    return {
      title: 'Increasing Brightness',
      prompt: 'Double the number of electrons freed each second.',
      widget,
      table: opticsTable({
        pieces: [seatedPlate('na', 'Sodium', cell, 'Na'), lamp('v', 'Violet lamp', cell.slots[1].at, 400, { fixed: true, zone: `slot:${cell.slots[1].id}` })],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Use the Brightness dial, and watch both the count and the speed meter.',
        'Compare the count and the speed at the lowest brightness with the count and the speed at a higher one.',
        'Raise the brightness a step at a time until Electrons Per Second is twice what you began with.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        const began = planPhotocell('Na', 400, cell.fixture.dials.brightness.value).count;
        if (r.count === began * 2) return { ok: true };
        if (r.count === began) return { ok: false, notYet: true, msg: 'Electrons Per Second is still what it was when you began.' };
        return { ok: false, msg: 'Electrons Per Second is not twice what you began with.' };
      },
      reward: {
        log: 'Brighter: more electrons, same speed.',
        title: 'Photon',
        body: 'Brightness changes how many electrons leave but not how fast, as if the light arrived in separate packets and each packet freed one electron. Each packet is a photon, and a brighter lamp sends more photons every second, not stronger ones.',
        model: { type: 'photons', metal: 'Na', nm: 400, brightness: 4, caption: 'Four violet photons free four electrons at the same speed. Greater brightness means more photons per second, not higher photon energy.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 23 }, { settings: THREE_PLATES, start: 1, brightness: 3, record: true, compact: true });
    const rail = { id: 'rail', at: { x: 52, y: 55.5 }, size: { w: 100, h: 14 }, first: 'Loosest grip', last: 'Tightest grip', items: ['cs', 'na', 'zn'], start: ['zn', 'cs', 'na'] };
    return {
      title: 'Three Plates',
      prompt: 'Put the three metal plates on the rail from loosest electron grip to tightest.',
      widget,
      table: opticsTable({
        pieces: [
          metalPlate('cs', 'Cesium', { x: 20, y: 55.5 }, 'Cs'),
          metalPlate('na', 'Sodium', { x: 52, y: 55.5 }, 'Na'),
          metalPlate('zn', 'Zinc', { x: 84, y: 55.5 }, 'Zn')
        ],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots, rail },
        recorder: SHEET
      }),
      hints: [
        'Use the Colour dial and "Record" with each plate in the holder.',
        'Compare the wavelength where each plate first frees electrons.',
        'Put the plate that frees electrons at the longest wavelength (lowest frequency) at the left end of the rail.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three plates back on the rail.' };
        const want = ['cs', 'na', 'zn'];
        if (order.join() === want.join()) return { ok: true };
        const nm = id => thresholdNm(t.pieces[id].props.metal);
        for (let k = 0; k < order.length - 1; k++) {
          if (nm(order[k]) < nm(order[k + 1])) return { ok: false, msg: `${t.pieces[order[k]].label} holds electrons tighter than ${t.pieces[order[k + 1]].label}: it needs shorter waves to free any.` };
        }
        return { ok: false, msg: 'The rail does not run from loosest electron grip to tightest.' };
      },
      reward: {
        log: 'Cesium frees electrons easiest, then sodium, then zinc.',
        title: 'Work Function',
        body: 'The least energy that frees an electron from a metal is its work function, about 3.4 x 10^-19 J for cesium, 3.7 for sodium and 6.9 for zinc. The higher it is, the higher the frequency a photon needs before it frees anything.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Drag the plate into the holder.', 'Turn the dials and watch Electrons Per Second.'],
  4: ['Turn the Brightness dial and watch Electrons Per Second.'],
  5: ['Try each plate in the holder.']
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
      body: 'Light comes in packets called photons, and each photon\'s energy is set by its frequency. An electron leaves a metal only if one photon carries more than the metal\'s work function, and no number of weaker photons can add up to it.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Energy is quantized rather than continuous. Electrons in an atom can only hold specific amounts of energy.'
    },
    {
      heading: 'Next',
      body: 'Glowing gases emit light at only specific wavelengths. The next bench examines what electrons do to produce those distinct lines.'
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
    explanation: 'A photon\'s energy is Planck\'s constant times its frequency: (6.626 x 10^-34 J s)(6.0 x 10^14 s^-1) = 4.0 x 10^-19 J. Dividing instead of multiplying gives the other figures.'
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Plates are put in the holder and back on the rail, dials are set, a reading is
   recorded, a prediction is a token. Nothing here says what the cup counts.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const colour = value => ({ setDial: { fixture: 'cell', dial: 'colour', value } });
const bright = value => ({ setDial: { fixture: 'cell', dial: 'brightness', value } });
/** The setting of the three-plates dial at which `metal` first frees electrons. */
const wakes = metal => firstFreeing(THREE_PLATES, metal, 3);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ predict: 'none' }],
  [put('na', 'slot:cell.holder'), colour(6), bright(1)],
  [colour(5)],
  [bright(4)],
  [
    put('cs', 'slot:cell.holder'), colour(wakes('Cs')), { run: 'cell' }, put('cs', 'rail:0'),
    put('na', 'slot:cell.holder'), colour(wakes('Na')), { run: 'cell' }, put('na', 'rail:1'),
    put('zn', 'slot:cell.holder'), colour(wakes('Zn')), { run: 'cell' }, put('zn', 'rail:2')
  ]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('na', 'slot:cell.holder'), colour(3), bright(5)],
  [colour(7)],
  [bright(3)],
  [put('cs', 'rail:2')]
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
export { planPhotocell, photonJoules, thresholdNm, seated, THREE_PLATES, NEAR_SODIUM, SWEEP, QUEST_KEY };
