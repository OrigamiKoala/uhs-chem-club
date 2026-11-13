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
 * THE ORDER (teaching pass, 2026-11-12; the bench before it is `archive/2026-11-11/lanternfall/q1-wave.before.js`):
 *
 *   1  briefing defines wavelength and frequency; both screens' waves cross at one drawn speed -> shorter wavelength, higher frequency
 *   2  PREDICT: which of red and violet travels faster (no timer)
 *   3  TEST: time both lamps over one gap and say which took less time           -> the speed of light
 *   4  five sources read on the ruler by wavelength, ordered by frequency         -> the electromagnetic spectrum
 *   5  worked case in the briefing (one lamp), then the frequency of another lamp whose wave is on the screen
 *
 * The two pulse stages that each asked for a speed worked out in nanoseconds were merged into stage 3, which compares two times.
 *
 * EVERY READING IS `lightdata.js`: the crests that fit the ruler are `planTrace`, the time a pulse takes is `pulseNs`. The kit
 * (`table/kits/optics.js`) only asks what is standing in which slot.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { fmtLength } from '../../engine/lightbench.js';
import { planTrace } from '../../engine/lightdata.js';
import {
  opticsTable, plaque, waveScreen, logRuler, pulseRail, lamp, tunedLamp, radiator, detector,
  waveRead, rulerRead, bandRead, pulseRead, seated, pickedUpBy, detectorsOn
} from '../../table/kits/optics.js';

export const meta = { stageCount: 5 };

/** The stage whose card confirms each term. Wavelength and frequency are defined in stage 1's briefing, before the screens are touched. */
export const VOCABULARY = [
  { term: /\belectromagnetic spectrum\b/i, introducedAt: 4 },
  { term: /\bspeed of light\b/i, introducedAt: 3 },
  { term: /\bwavelengths?\b/i, introducedAt: 1 },
  { term: /\bfrequenc(?:y|ies)\b/i, introducedAt: 1 }
];

/** Builds on nothing outside Tallow. */
export const BUILDS_ON = [];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and what each guess is called in the prompt. */
const QUEST_KEY = 'unit02/q1-wave';
const GUESS_LABEL = { red: 'Red', violet: 'Violet', same: 'Same speed' };

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

/** Stage 3's answer dial: which lamp's light crossed the gap in less time. It starts unset. */
const FIRST = ['Not set', 'Red', 'Violet', 'Same time'];

/** Each lamp's last timing on the recorder, by lamp: `{ red: {gap, ns}, violet: {gap, ns} }`. */
function timings(t) {
  const out = {};
  for (const row of t.recorder?.rows || []) {
    const l = String(row.label || '').toLowerCase();
    const who = l.includes('violet') ? 'violet' : l.includes('red') ? 'red' : null;
    if (who) out[who] = { gap: row.x, ns: row.y };
  }
  return out;
}

/** Stage 5: the lamp on the bench, and the lamp the briefing works through. Neither is a setting of stage 1's dial. */
const ASKED_NM = 625;
const WORKED_NM = 470;

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const a = waveScreen('a', 'Beacon 1', { x: 38, y: 20 });
    const l = waveScreen('l', 'Spare lamp', { x: 112, y: 23 }, { settings: RED_TO_VIOLET, start: 4 });
    return {
      title: 'Red to Violet',
      briefing: {
        speaker: SPEAKER,
        body: 'Light is a wave. The distance from one crest (the top of a wave) to the next is its wavelength, and the number of crests that pass a point each second is its frequency.'
      },
      prompt: 'Which colours of light have a higher frequency than Beacon 1\'s green light?',
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
        'Turn the Colour dial on the spare lamp\'s screen and watch its wave.',
        'Compare how far apart the crests are on the two screens, and the two frequencies printed above them.',
        'Watch the right-hand edge of each screen, and see whether crests that are closer together reach it more often or less often.'
      ],
      check(state) {
        const t = state.table;
        const mine = rateOf(t, 'l');
        const ref = rateOf(t, 'a');
        if (mine === null) return { ok: false, notYet: true, msg: 'Put the spare lamp in its holder to light its screen.' };
        if (mine > ref) return { ok: true };
        if (mine === ref) return { ok: false, msg: 'At this setting the spare lamp\'s crests are as far apart as Beacon 1\'s, and the two frequencies are equal.' };
        return { ok: false, msg: 'At this setting the spare lamp\'s crests are further apart than Beacon 1\'s, and fewer of them pass each second.' };
      },
      reward: {
        log: 'Toward violet: shorter wavelength, higher frequency.',
        title: 'Wavelength and Frequency',
        body: 'Toward violet the wavelength gets shorter and the frequency gets higher. The two change in opposite directions.',
        model: { type: 'wave', nm: [700, 400], caption: 'One wave tuned from red to violet and back: as the crests move closer together, more of them pass each second.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Race Red and Violet',
    // A PREDICT STAGE: the timer is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which colour of light travels faster: red, violet, or neither?',
    widget,
    table: opticsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'red', label: 'Red', at: { x: 38, y: 48 }, r: 7 },
          { id: 'violet', label: 'Violet', at: { x: 75, y: 48 }, r: 7 },
          { id: 'same', label: 'Same speed', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three cards into the slot.',
      'Think about what changed on the screen between red and violet: the wavelength, the frequency, or how fast the wave crossed.',
      'A prediction is not graded, so choose the one you think is most likely.'
    ],
    check(state) {
      if (!state.table.prediction?.token) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const token = state.table.prediction?.token;
      if (token) remember(QUEST_KEY, token);
    },
    reward: {
      log: 'Prediction made.',
      title: 'Prediction',
      body: 'Next, a pulse timer measures how long light of each colour takes to cross the same gap.'
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
      title: 'Time a Pulse',
      // The guess comes back here: it is the first thing the player reads about the test.
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": does red or violet light cross the gap in less time, or do they take the same time?`
          : 'Does red or violet light cross the gap in less time, or do they take the same time?';
      },
      widget,
      table: opticsTable({
        pieces: [
          detector('d1', 'Detector 1', { x: 13, y: 50 }),
          detector('d2', 'Detector 2', { x: 33, y: 50 }),
          lamp('red', 'Red lamp', { x: 57, y: 50 }, 700),
          lamp('violet', 'Violet lamp', { x: 80, y: 50 }, 400)
        ],
        fixtures: [rail.fixture, {
          id: 'first', kind: 'marker', label: 'Result', at: { x: 112, y: 52 }, size: { w: 36, h: 16 }, noRun: true,
          dials: { n: { min: 1, max: FIRST.length, step: 1, value: 1, label: 'Less time taken by', labels: FIRST } }, props: {}
        }],
        zones: { slots: rail.slots },
        recorder: { at: { x: 140, y: 52 }, size: { w: 18, h: 18 }, xLabel: 'Gap', xUnit: 'm', yLabel: 'Time', yUnit: 'ns' }
      }),
      hints: [
        'Stand a lamp in the holder and a detector on each of two marks, then press "Fire Pulse" to send one short flash of light.',
        'Compare the pulse times of the two lamps over the same gap, on the timer or on the paper strip.',
        'A lamp whose light travelled faster would show a shorter pulse time over the same gap.'
      ],
      check(state) {
        const t = state.table;
        const got = timings(t);
        if (!got.red || !got.violet) return { ok: false, notYet: true, msg: 'Time a pulse from each of the two lamps first.' };
        if (got.red.gap !== got.violet.gap) return { ok: false, notYet: true, msg: `The red lamp was timed over ${got.red.gap.toFixed(1)} m and the violet lamp over ${got.violet.gap.toFixed(1)} m: time both over one gap.` };
        const pick = FIRST[t.fixtures.first.dials.n.value - 1];
        if (pick === 'Not set') return { ok: false, notYet: true, msg: 'Set the dial to your answer.' };
        if (pick === 'Same time') return { ok: true };
        return { ok: false, msg: `Over ${got.red.gap.toFixed(1)} m the timer read ${got.red.ns.toFixed(1)} ns for the red lamp and ${got.violet.ns.toFixed(1)} ns for the violet lamp.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'same' ? 'Your prediction held. ' : 'The timer did not agree with your prediction. ';
        return {
          log: 'Red and violet crossed the same gap in the same time.',
          title: 'The Speed of Light',
          body: `${verdict}Red and violet light cross the gap in the same time. In air or empty space all light travels at 3.00 × 10⁸ metres per second, the speed of light.`
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
      briefing: {
        speaker: SPEAKER,
        body: 'Radio waves, microwaves and X-rays are the same kind of wave as visible light, and they travel at the same speed. The whole range of wavelengths is called the electromagnetic spectrum.'
      },
      prompt: 'What is the order of the five sources from the lowest frequency to the highest?',
      widget,
      table: opticsTable({
        pieces: SOURCES.map(source),
        fixtures: [ruler.fixture],
        zones: { slots: ruler.slots, rail }
      }),
      hints: [
        'Drag each source into the ruler\'s holder to read its wavelength, then put it back on the rail.',
        'Compare the five wavelengths: the ruler reads wavelength, and the rail asks for frequency.',
        'The waves from all five travel at the speed of light, so think what a long wavelength means for how many crests pass each second.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < SOURCES.length) return { ok: false, notYet: true, msg: 'Put all five sources back on the rail.' };
        if (order.join() === BY_FREQUENCY.join()) return { ok: true };
        const nm = id => t.pieces[id].props.nm;
        for (let k = 0; k < order.length - 1; k++) {
          if (nm(order[k]) < nm(order[k + 1])) {
            return { ok: false, msg: `${t.pieces[order[k]].label} stands left of ${t.pieces[order[k + 1]].label}, and the ruler gives it the shorter wavelength of the two.` };
          }
        }
        return { ok: false, msg: 'The rail does not agree with the wavelengths on the ruler.' };
      },
      reward: {
        log: 'Radio, oven, red, violet, X-ray: one scale.',
        title: 'The Electromagnetic Spectrum',
        body: 'The longest wavelength has the lowest frequency. The eye sees only one small part of the electromagnetic spectrum, from about 700 nm to 400 nm.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const screen = waveScreen('s', 'Orange lamp', { x: 40, y: 22 }, { rate: false });
    const plate = plaque('plate', 'For this lamp', { x: 112, y: 20 }, [
      `Wavelength: ${ASKED_NM} nm`,
      `= ${(ASKED_NM / 100).toFixed(2)} × 10⁻⁷ m`,
      'Speed of light: 3.00 × 10⁸ m/s'
    ], { w: 66, h: 28 });
    const want = 3e8 / (ASKED_NM * 1e-9) / 1e14;
    const worked = 3e8 / (WORKED_NM * 1e-9) / 1e14;
    return {
      title: 'Wavelength to Frequency',
      briefing: {
        speaker: SPEAKER,
        body: 'Each second, light travels 3.00 × 10⁸ metres. Divide that distance by the length of one wave, in metres, to find how many waves passed: frequency = speed of light ÷ wavelength.',
        worked: [
          `A blue lamp: wavelength ${WORKED_NM} nm = ${(WORKED_NM / 100).toFixed(2)} × 10⁻⁷ m`,
          `3.00 × 10⁸ m/s ÷ ${(WORKED_NM / 100).toFixed(2)} × 10⁻⁷ m`,
          `= ${worked.toFixed(2)} × 10¹⁴ crests each second`
        ]
      },
      prompt: 'What is the frequency of the orange lamp\'s light?',
      entry: { id: 'ans', label: 'Frequency', unit: '× 10¹⁴ each second' },
      widget,
      table: opticsTable({
        pieces: [seatedLamp('orange', 'Orange lamp', screen, ASKED_NM)],
        fixtures: [screen.fixture, plate],
        zones: { slots: screen.slots }
      }),
      hints: [
        'The screen draws the orange lamp\'s wave, and the plate gives its wavelength in metres.',
        'Compare this wavelength with the blue lamp\'s in the briefing, and decide whether the frequency should come out higher or lower.',
        'Follow the worked case under the briefing, with this lamp\'s wavelength in place of the blue lamp\'s.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the frequency, counted in units of 10¹⁴ crests each second.' };
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        if (v >= worked) return { ok: false, msg: `The orange lamp's wavelength is longer than the blue lamp's, and the blue lamp's frequency is ${worked.toFixed(2)} × 10¹⁴ each second.` };
        return { ok: false, msg: `That frequency times ${(ASKED_NM / 100).toFixed(2)} × 10⁻⁷ m does not give 3.00 × 10⁸ m/s.` };
      },
      reward: {
        log: 'Speed of light divided by wavelength gives frequency.',
        title: 'Speed, Wavelength and Frequency',
        body: `The orange lamp's frequency is ${want.toFixed(2)} × 10¹⁴ each second, lower than the blue lamp's. Wavelength × frequency is the speed of light for every colour.`,
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the lamp into its holder and turn the Colour dial.', 'nm is a nanometre: a billionth of a metre.'],
  3: ['Stand a lamp and two detectors on the rail, then press Fire Pulse.'],
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
      body: 'Light is a wave with a wavelength and a frequency. All light travels at one speed, 3.00 × 10⁸ metres per second, so a shorter wavelength always means a higher frequency.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'A radio mast, a lamp and an X-ray tube can now be compared on one scale, the electromagnetic spectrum. The rest of this world is measured on that scale.'
    },
    {
      heading: 'Next',
      body: 'Next: why a bright red lamp cannot remove an electron from a metal when faint violet light can.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Lamps are put in holders and on the rail, dials are set, a pulse is fired.
   Nothing here says what a screen reads.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const colour = (fixture, value) => ({ setDial: { fixture, dial: 'colour', value } });
const typed = (id, value) => ({ type: { entry: id, value: String(value) } });
const answer = (fixture, value) => ({ setDial: { fixture, dial: 'n', value } });
/** Both lamps timed over the gap between two marks. */
const timeBoth = (m) => [put('d1', 'slot:rail.m0'), put('d2', `slot:rail.m${m}`), put('red', 'slot:rail.lamp'), { run: 'rail' }, put('violet', 'slot:rail.lamp'), { run: 'rail' }];

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [put('lamp', 'slot:l.lamp'), colour('l', 6)],
  [{ predict: 'same' }],
  [...timeBoth(3), answer('first', FIRST.indexOf('Same time') + 1)],
  [put('radio', 'rail:0'), put('micro', 'rail:1'), put('red', 'rail:2'), put('violet', 'rail:3'), put('xray', 'rail:4')],
  [typed('ans', '4.8')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('lamp', 'slot:l.lamp'), colour('l', 2)],
  [],
  [...timeBoth(2), answer('first', FIRST.indexOf('Violet') + 1)],
  [put('violet', 'rail:0')],
  [typed('ans', '6.9')]
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
export { planTrace, fmtLength, rulerRead, bandRead, pulseRead, pickedUpBy, detectorsOn, seated, SOURCES, BY_FREQUENCY, QUEST_KEY, FIRST, ASKED_NM, WORKED_NM, timings };
