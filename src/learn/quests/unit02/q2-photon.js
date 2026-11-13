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
 * THE ORDER (teaching pass, 2026-11-12; the bench before it is `archive/2026-11-11/lanternfall/q2-photon.before.js`):
 *
 *   1  PREDICT from the wave picture the briefing gives: how many electrons a very bright red lamp removes
 *   2  TEST: the dimmest light that removes any (graded on Brightness at its lowest)   -> the photoelectric effect
 *   3  briefing names the photons the photocell has been drawing; the lowest frequency  -> threshold frequency
 *   4  record two brightness settings, then say what a brighter lamp changes            -> more photons, not more energy in each
 *   5  briefing defines work function; three plates ordered by it
 *   6  worked case in the briefing (cesium), then the kinetic energy of the electron the photocell beside the plate is drawing
 *
 * The photocell's picture moves (`optics-draw.js` `paintCellFixture`): photons cross to the plate, as many each second as the
 * brightness, and an electron leaves for each one that carries enough energy, at a drawn speed that follows the speed meter.
 *
 * EVERY READING IS `planPhotocell`: the counter, the speed meter and the cup are its answer for the plate in the holder, the colour on
 * the dial and the brightness, and no `check()` authors any of it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { planPhotocell, photonJoules, thresholdNm } from '../../engine/lightdata.js';
import {
  opticsTable, plaque, photocell, metalPlate, lamp, cellRead, firstFreeing, seated
} from '../../table/kits/optics.js';

export const meta = { stageCount: 6 };

/** The stage whose card confirms each term. "Photon" is defined in stage 3's briefing and "work function" in stage 5's. */
export const VOCABULARY = [
  { term: /\bphotoelectric\b/i, introducedAt: 2 },
  { term: /\bthreshold frequency\b/i, introducedAt: 3 },
  { term: /\bphotons?\b/i, introducedAt: 3 },
  { term: /\bwork functions?\b/i, introducedAt: 5 }
];

/** Wavelength, frequency and the speed of light are plain words from q1-wave. */
export const BUILDS_ON = ['unit02/q1-wave'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and what each guess is called in the prompt. */
const QUEST_KEY = 'unit02/q2-photon';
const GUESS_LABEL = { many: 'Many', few: 'A few', none: 'None' };

/** The dial, red end first. */
const SWEEP = [650, 600, 550, 500, 450, 400, 350];
/** Finer near sodium's threshold, so "the lowest that removes any" has exactly one answer. */
const NEAR_SODIUM = [650, 600, 575, 550, 525, 500, 450];
/** A wide sweep for the three plates, with each metal's own threshold between two steps. */
const THREE_PLATES = [650, 600, 575, 550, 525, 450, 350, 300, 275];

/** Stage 4's three answers, as cards. */
const BRIGHTER = [
  ['more', 'More electrons, same speed'],
  ['faster', 'Same number, faster'],
  ['both', 'More electrons, faster']
];

/** Stage 6: Planck's constant as the plate prints it, the bench's lamp and the worked case's lamp (frequencies in 10^14 each second). */
const H = 6.6e-34;
const ASKED = { hz14: 7.5, metal: 'Na', nm: 400, work: 3.7 };
const WORKED = { hz14: 6.0, metal: 'cesium', work: 3.4 };

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

/** A plate standing in the holder, fixed there: the stage is about the light, not the plate. */
const seatedPlate = (id, label, cell, metal) => metalPlate(id, label, cell.slots[0].at, metal, { fixed: true, zone: `slot:${cell.slots[0].id}` });

const SHEET = { at: { x: 128, y: 28 }, size: { w: 36, h: 34 }, xLabel: 'Frequency', xUnit: '× 10¹⁴ /s', yLabel: 'Speed', yUnit: '× 10⁵ m/s' };

const card = (id, label, at) => ({ id, kind: 'card', label, at, r: 7, props: {} });
const inSlot = (t, slot) => Object.values(t.pieces).find(p => p.zone === `slot:${slot}`) || null;

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Bright Red on Sodium',
    // A PREDICT STAGE: the photocell is not on the table yet. The briefing gives the wave picture to predict from.
    predict: true,
    briefing: {
      speaker: SPEAKER,
      body: 'Light can remove electrons from a metal: this is the photoelectric effect. If light were only a wave, a brighter lamp would deliver more energy, so a bright enough lamp of any colour should remove some.'
    },
    prompt: 'A very bright red lamp shines on a sodium plate: how many electrons does it remove?',
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
      'Drag one of the three cards into the slot.',
      'Think about what the briefing says a brighter lamp delivers, and whether red light should be any different.',
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
      body: 'Next, a photocell shines light of any colour and brightness on a sodium plate and counts the electrons that leave.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 31 }, { settings: SWEEP, start: 1, brightness: { start: 5 } });
    return {
      title: 'Removing Electrons',
      // The guess comes back here.
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": which light removes electrons from the sodium plate even at the lowest brightness?`
          : 'Which light removes electrons from the sodium plate even at the lowest brightness?';
      },
      widget,
      table: opticsTable({
        pieces: [metalPlate('na', 'Sodium', { x: 128, y: 22 }, 'Na')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Put the sodium plate in the holder, then use the Colour dial and the Brightness dial.',
        'Compare what one colour does at full brightness and at the lowest brightness, then do the same for another colour.',
        'If brightness decided whether electrons leave, the brightest red light would remove the most: see whether it does.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        if (!r.plate) return { ok: false, notYet: true, msg: 'Put the sodium plate in the holder.' };
        if (r.freed && r.brightness === 1) return { ok: true };
        if (r.freed) return { ok: false, msg: `Electrons leave the plate at this colour, with Brightness at ${r.brightness} of 5: a dimmer light may still remove some.` };
        if (r.fixture.dials.colour.value === 1 && r.brightness === 5) return { ok: false, notYet: true, msg: 'Red light at full brightness reaches the plate and no electron leaves.' };
        return { ok: false, msg: `Light of ${r.nm} nm reaches the plate at brightness ${r.brightness} and no electron leaves.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'none' ? 'Your prediction held. ' : 'The plate did not agree with your prediction. ';
        return {
          log: 'Red at full brightness: none. Violet at the lowest brightness: electrons.',
          title: 'The Photoelectric Effect',
          body: `${verdict}The brightest red light removed no electrons, and light nearer violet removed some even at the lowest brightness. Colour decides it, not brightness, so the wave prediction fails.`,
          model: { type: 'photons', metal: 'Na', nm: 400, brightness: 1, caption: 'Violet light removes an electron from sodium. Red light, however bright, removes none.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 26 }, { settings: NEAR_SODIUM, start: 1, brightness: 3, showHz: true });
    return {
      title: 'The Lowest Frequency',
      briefing: {
        speaker: SPEAKER,
        body: 'Light delivers its energy in separate packets called photons: the photocell draws each one as a short bar. The higher the light\'s frequency, the more energy each photon carries.'
      },
      prompt: 'What is the lowest frequency of light that removes electrons from sodium?',
      widget,
      table: opticsTable({
        pieces: [seatedPlate('na', 'Sodium', cell, 'Na')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Step the Colour dial one setting at a time; the lamp\'s frequency is printed beside its wavelength.',
        'Notice what the photons do at the plate on each setting, and at which setting that changes.',
        'One photon either carries enough energy to remove an electron or it does not, so look for the frequency where that changes.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        const v = r.fixture.dials.colour.value;
        const first = firstFreeing(r.fixture.props.settings, 'Na', 3);
        if (v === first) return { ok: true };
        if (v === 1) return { ok: false, notYet: true, msg: 'The lamp is where it started.' };
        if (v < first) return { ok: false, msg: 'At this frequency photons reach the plate and no electron leaves.' };
        return { ok: false, msg: 'Electrons leave at this frequency, and they also left at a lower one.' };
      },
      reward: {
        log: 'Electrons leave at one frequency and not below it.',
        title: 'Threshold Frequency',
        body: 'Below this frequency each photon carries too little energy to remove an electron, however many arrive. The lowest frequency that removes any is the metal\'s threshold frequency.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 25 }, { lamp: true, brightness: { start: 2 }, record: true, plot: 'brightness' });
    return {
      title: 'More Light',
      briefing: {
        speaker: SPEAKER,
        body: 'One photon removes at most one electron. Any energy the photon carries beyond what the removal takes goes into the electron\'s speed.'
      },
      prompt: 'What does a brighter violet lamp change about the electrons that leave?',
      widget,
      table: opticsTable({
        pieces: [
          seatedPlate('na', 'Sodium', cell, 'Na'),
          lamp('v', 'Violet lamp', cell.slots[1].at, 400, { fixed: true, zone: `slot:${cell.slots[1].id}` }),
          ...BRIGHTER.map(([id, label], k) => card(id, label, { x: 62 + k * 36, y: 57 }))
        ],
        fixtures: [cell.fixture],
        zones: { slots: [...cell.slots, { id: 'answer', label: '', at: { x: 22, y: 57 }, size: { w: 38, h: 12 } }] },
        recorder: { at: { x: 128, y: 25 }, size: { w: 38, h: 34 }, xLabel: 'Brightness', xUnit: '', yLabel: 'Electrons per second', yUnit: '' }
      }),
      hints: [
        'Turn the Brightness dial and press "Record" at two or more settings.',
        'Compare the count and the speed of the fastest electron at a low brightness and at a high one.',
        'Think what a brighter lamp of the same colour sends more of, and whether any one photon carries more energy than before.'
      ],
      check(state) {
        const t = state.table;
        const rows = t.recorder?.rows || [];
        const tried = [...new Set(rows.map(r => r.x))];
        const pick = inSlot(t, 'answer');
        if (tried.length < 2) return { ok: false, notYet: true, msg: 'Record the photocell at two different brightness settings first.' };
        if (!pick) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (pick.id === 'more') return { ok: true };
        const lo = rows.reduce((m, r) => (r.x < m.x ? r : m));
        const hi = rows.reduce((m, r) => (r.x > m.x ? r : m));
        return { ok: false, msg: `At brightness ${lo.x} the count was ${lo.y} with the fastest electron at ${lo.label}; at brightness ${hi.x} it was ${hi.y} at ${hi.label}.` };
      },
      reward: {
        log: 'Brighter: more electrons, same speed.',
        title: 'Brightness and Photons',
        body: 'A brighter lamp sends more photons each second, so more electrons leave. Each photon carries the same energy as before, so they leave no faster.',
        model: { type: 'photons', metal: 'Na', nm: 400, brightness: 4, caption: 'Four violet photons remove four electrons at the same speed: more photons each second, not more energy in each.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 23 }, { settings: THREE_PLATES, start: 1, brightness: 3, record: true, compact: true, showHz: true });
    const rail = { id: 'rail', at: { x: 52, y: 55.5 }, size: { w: 100, h: 14 }, first: 'Lowest work function', last: 'Highest work function', items: ['cs', 'na', 'zn'], start: ['zn', 'cs', 'na'] };
    return {
      title: 'Three Plates',
      briefing: {
        speaker: SPEAKER,
        body: 'The least energy that removes an electron from a metal is that metal\'s work function. A photon with less energy than the work function removes nothing.'
      },
      prompt: 'What is the order of the three metals from the lowest work function to the highest?',
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
        'Put each plate in the holder in turn and step the Colour dial; "Record" keeps a reading.',
        'Compare the frequency at which each metal first gives up electrons.',
        'A photon\'s energy rises with its frequency, so think what it means that one metal needs photons of higher frequency than another.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three plates back on the rail.' };
        const want = ['cs', 'na', 'zn'];
        if (order.join() === want.join()) return { ok: true };
        const nm = id => thresholdNm(t.pieces[id].props.metal);
        for (let k = 0; k < order.length - 1; k++) {
          if (nm(order[k]) < nm(order[k + 1])) return { ok: false, msg: `${t.pieces[order[k]].label} stands left of ${t.pieces[order[k + 1]].label}, and ${t.pieces[order[k]].label} gives up no electrons until the frequency is higher.` };
        }
        return { ok: false, msg: 'The rail does not agree with the frequency at which each plate first gives up electrons.' };
      },
      reward: {
        log: 'Cesium lowest, then sodium, then zinc.',
        title: 'Work Function',
        body: 'Cesium gives up electrons to light of the lowest frequency, so its work function is the lowest. Zinc needs ultraviolet light, of higher frequency than violet, so its work function is the highest.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 44, y: 25 }, { lamp: true, brightness: 3, size: { w: 84, h: 43 } });
    const photon = H * ASKED.hz14 * 1e14 / 1e-19;
    const want = photon - ASKED.work;
    const workedPhoton = H * WORKED.hz14 * 1e14 / 1e-19;
    const data = plaque('data', 'Violet light on sodium', { x: 119, y: 22 }, [
      `Frequency: ${ASKED.hz14.toFixed(1)} × 10¹⁴ each second`,
      'Planck\'s constant: h = 6.6 × 10⁻³⁴ J s',
      `Sodium's work function: ${ASKED.work.toFixed(1)} × 10⁻¹⁹ J`
    ], { w: 60, h: 30 });
    return {
      title: 'Energy of the Electron',
      briefing: {
        speaker: SPEAKER,
        body: 'A photon\'s energy is h × frequency, where h is a fixed number called Planck\'s constant. The fastest electron leaves with that energy less the work function: this is its kinetic energy, the energy of its motion, in joules (J).',
        worked: [
          `Light of ${WORKED.hz14.toFixed(1)} × 10¹⁴ each second on ${WORKED.metal} (work function ${WORKED.work.toFixed(1)} × 10⁻¹⁹ J)`,
          `Photon: 6.6 × 10⁻³⁴ × ${WORKED.hz14.toFixed(1)} × 10¹⁴ = ${workedPhoton.toFixed(1)} × 10⁻¹⁹ J`,
          `Electron: ${workedPhoton.toFixed(1)} − ${WORKED.work.toFixed(1)} = ${(Number(workedPhoton.toFixed(1)) - WORKED.work).toFixed(1)} × 10⁻¹⁹ J`
        ]
      },
      prompt: 'How much kinetic energy does the fastest electron leave the sodium plate with?',
      entry: { id: 'ans', label: 'Kinetic energy', unit: '× 10⁻¹⁹ J' },
      widget,
      table: opticsTable({
        pieces: [
          seatedPlate('na', 'Sodium', cell, ASKED.metal),
          lamp('v', 'Violet lamp', cell.slots[1].at, ASKED.nm, { fixed: true, zone: `slot:${cell.slots[1].id}` })
        ],
        fixtures: [cell.fixture, data],
        zones: { slots: cell.slots }
      }),
      hints: [
        'The plate gives the lamp\'s frequency, Planck\'s constant and sodium\'s work function.',
        'Compare the energy of one violet photon with sodium\'s work function.',
        'Follow the worked case under the briefing, with this lamp\'s frequency and this metal\'s work function.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the kinetic energy in units of 10⁻¹⁹ J.' };
        if (Math.abs(v - want) <= 0.15) return { ok: true };
        if (v >= photon - 0.15) return { ok: false, msg: 'That is at least the whole energy of one violet photon, with nothing taken off for the work function.' };
        return { ok: false, msg: `One violet photon's energy less ${ASKED.work.toFixed(1)} × 10⁻¹⁹ J does not come to that.` };
      },
      reward: {
        log: 'Photon energy minus work function is the electron\'s kinetic energy.',
        title: 'Photon Energy',
        body: `One violet photon carries ${photon.toFixed(1)} × 10⁻¹⁹ J. Sodium's work function takes ${ASKED.work.toFixed(1)} × 10⁻¹⁹ J of it, and the electron keeps ${want.toFixed(1)} × 10⁻¹⁹ J as kinetic energy.`,
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Drag the plate into the holder.', 'Turn the dials and watch the plate.'],
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
      body: 'Light delivers its energy in photons, and the frequency sets the energy of each one. An electron leaves a metal only when one photon carries more than the metal\'s work function; more photons of too little energy remove nothing.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Energy arrives in fixed amounts. The next bench finds that electrons inside an atom can hold only certain amounts too.'
    },
    {
      heading: 'Next',
      body: 'A glowing gas gives out light at only a few wavelengths. Next: what its electrons do to make those lines.'
    }
  ]
};

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
  [{ run: 'cell' }, bright(4), { run: 'cell' }, put('more', 'slot:answer')],
  [
    put('cs', 'slot:cell.holder'), colour(wakes('Cs')), { run: 'cell' }, put('cs', 'rail:0'),
    put('na', 'slot:cell.holder'), colour(wakes('Na')), { run: 'cell' }, put('na', 'rail:1'),
    put('zn', 'slot:cell.holder'), colour(wakes('Zn')), { run: 'cell' }, put('zn', 'rail:2')
  ],
  [{ type: { entry: 'ans', value: '1.3' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('na', 'slot:cell.holder'), colour(6), bright(5)],
  [colour(7)],
  [{ run: 'cell' }, bright(4), { run: 'cell' }, put('both', 'slot:answer')],
  [put('cs', 'rail:2')],
  [{ type: { entry: 'ans', value: '5' } }]
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
export { planPhotocell, photonJoules, thresholdNm, seated, THREE_PLATES, NEAR_SODIUM, SWEEP, QUEST_KEY, BRIGHTER, H, ASKED, WORKED };
