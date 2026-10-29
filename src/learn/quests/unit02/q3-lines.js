/**
 * q3-lines.js — Lanternfall, bench three: LINE SPECTRA.
 *
 * The prism, with gas tubes, and the energy ladder. The aurora over this ice field is the reason the bench exists: a glowing gas
 * does not give out a smear of colour but a handful of exact ones, and that is the first thing anybody ever saw that said an
 * atom's electrons are not free to be anywhere.
 *
 * The third of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4a), on the optics kit, reworked on 2026-10-23 around ONE
 * CLICK. The bench is the spectrograph sled's own table, tailgate down: sources are plugged into the socket, a reference strip is
 * slid alongside the band, and the energy ladder is worked by dragging its one electron from rung to rung, each drop giving out the
 * line it makes.
 *
 * THE CLICK. A player who has just seen a hot filament give every colour expects a hot gas to do the same: a glowing tube is a
 * glowing thing, so its light should be a smooth rainbow. The guess is asked first, with no prism on the table, and then the prism
 * shows a few exact colours and nothing between them.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  PREDICT: what a glowing hydrogen tube's band looks like (no prism)          -> a guess before the evidence
 *   2  TEST: four sources, each under the band it makes                            -> continuous and line spectra
 *   3  name the gas in a sealed tube against reference strips                      -> emission spectrum
 *   4  drag the electron down a rung until it gives out red                        -> energy levels, ground and excited states
 *   5  filament light through a cell of cool gas                                   -> absorption spectrum
 *
 * Cut on 2026-10-23 (problems doc T6, T7): the energy of a line (a plug-in sum with Planck's constant), the predicted line from the
 * Bohr formula (AP depth), the electron past the top of the ladder (ionization, met again in q7) and the helium lines that do
 * not fit the ladder (the limit of a model the quest no longer builds).
 *
 * Every line is a real one (`lightdata.js` `LINES`), every rung the real Bohr value -2.18 x 10^-18 J / n^2, and every drop is
 * asked of `planJump`, so the strip shows exactly the line the electron's fall gives out.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { planJump, jumpsForLine, photonJoules, LINES, bohrJoules } from '../../engine/lightdata.js';
import {
  opticsTable, spectrograph, energyLadder, linesStrip, filament, gasTube, coolCell, refStrip,
  bandRead, ladderRead, rungOf, seated, TOP
} from '../../table/kits/optics.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bcontinuous spectrum\b/i, introducedAt: 2 },
  { term: /\bline spectrum\b/i, introducedAt: 2 },
  { term: /\bemission spectrum\b/i, introducedAt: 3 },
  { term: /\benergy levels?\b/i, introducedAt: 4 },
  { term: /\bground state\b/i, introducedAt: 4 },
  { term: /\bexcited states?\b/i, introducedAt: 4 },
  { term: /\babsorption spectrum\b/i, introducedAt: 5 }
];

export const BUILDS_ON = ['unit02/q1-wave', 'unit02/q2-photon'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q3-lines';
const GUESS_LABEL = { rainbow: 'A smooth rainbow', exact: 'A few exact colours', one: 'One colour only' };

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, x, y = 55, w = 44, cell = 22, h = 18) => ({ id, label, at: { x, y }, size: { w, h }, cell });
const where = (t, id) => (t.pieces[id].zone || '').replace(/^tray:/, '');
const trayed = (t, ids) => ids.every(id => where(t, id) && !where(t, id).startsWith('slot:'));

/** The ladder, with the strip it writes on, at the table's left. */
const LADDER_AT = { x: 30, y: 32 };
const LINES_AT = { x: 104, y: 16 };

/** The red line: the one visible line of hydrogen that is longer than orange. */
const isRed = nm => nm >= 620 && nm <= 750;

/** The sources of stage 2, and the band each makes (a hot solid fills the band; a glowing gas lights a few places). */
const SOURCES = { fil: 'band', h: 'lines', he: 'lines', na: 'lines' };

/** Reference strips: hydrogen, helium, sodium and mercury. */
const STRIP_GAS = [['h', 'Hydrogen', 'H'], ['he', 'Helium', 'He'], ['na', 'Sodium', 'Na'], ['hg', 'Mercury', 'Hg']];

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'A Glowing Tube',
    // A PREDICT STAGE: the prism is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'A tube of glowing hydrogen sends its light through a prism: what do you think the band looks like?',
    widget,
    table: opticsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'rainbow', label: 'Rainbow', at: { x: 38, y: 48 }, r: 7 },
          { id: 'exact', label: 'A few colours', at: { x: 75, y: 48 }, r: 7 },
          { id: 'one', label: 'One colour', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three guesses into the slot.',
      'Think of a hot wire in a lamp, which glows with every colour, and ask whether a glowing gas would do the same.',
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
      body: 'A glowing gas is hot and bright like a glowing wire, so a rainbow is a fair guess. Next, a prism will spread the light of each source across a scale.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const sp = spectrograph('sp', 'Band', { x: 56, y: 21 });
    return {
      title: 'Filament and Tubes',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": put each light source under the kind of band it makes.`
          : 'Put each light source under the kind of band it makes.';
      },
      widget,
      table: opticsTable({
        pieces: [
          filament('fil', 'Filament', { x: 111, y: 10 }),
          gasTube('h', 'Hydrogen tube', { x: 138, y: 10 }, 'H'),
          gasTube('he', 'Helium tube', { x: 111, y: 30 }, 'He'),
          gasTube('na', 'Sodium tube', { x: 138, y: 30 }, 'Na')
        ],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, trays: [tray('band', 'Lit from end to end', 17, 55, 30, 25, 18), tray('lines', 'Lit in a few places', 72, 55, 78, 25, 18)] }
      }),
      hints: [
        'Use the socket: drag a source into it and look at the band.',
        'Compare whether each band is filled from one end to the other or only lit in a few places.',
        'Sort the sources by the band each one makes when it is in the socket, not by how it looks on the table.'
      ],
      check(state) {
        const t = state.table;
        const ids = Object.keys(SOURCES);
        if (!trayed(t, ids)) return { ok: false, notYet: true, msg: 'Put every source under a band.' };
        const wrong = ids.find(id => where(t, id) !== SOURCES[id]);
        if (!wrong) return { ok: true };
        return { ok: false, msg: `The ${t.pieces[wrong].label} makes a different band from the one it is under.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'exact'
          ? 'You predicted a few exact colours, and the prism agreed. '
          : 'The prism did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'A hot wire: every colour. A glowing gas: a few.',
          title: 'Line Spectrum',
          body: `${verdict}A hot solid gives off an unbroken band of every colour, a continuous spectrum, while a glowing gas gives off only a few bright lines, a line spectrum.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const sp = spectrograph('sp', 'Band', { x: 44, y: 27 }, { ref: true, size: { w: 84, h: 52 } });
    return {
      title: 'Name the Gas',
      prompt: 'Pick the element in the sealed tube.',
      widget,
      table: opticsTable({
        pieces: [
          ...STRIP_GAS.map(([id, label, gas], i) => refStrip(id, label, { x: i < 3 ? 104 : 130, y: i < 3 ? 11 + i * 21 : 11 }, gas)),
          gasTube('x', 'Sealed tube', { x: 130, y: 33 }, 'He')
        ],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }),
      hints: [
        'Use the socket for the sealed tube and the alongside slot for the strips.',
        'Compare the strip\'s lines with the sealed tube\'s lines, position by position, and watch which of them light.',
        'Try each element in turn and keep the one whose every line falls exactly on a line of the sealed tube\'s band.'
      ],
      check(state) {
        const r = bandRead(state.table, 'sp');
        if (!r.src || r.src.id !== 'x') return { ok: false, notYet: true, msg: 'Plug the sealed tube into the socket to read its lines.' };
        if (!r.ref) return { ok: false, notYet: true, msg: 'Slide an element\'s strip alongside the band.' };
        if (r.whole && r.refLines.length === r.seen.length) return { ok: true };
        return { ok: false, msg: `The ${r.ref.label} strip has lines where the sealed tube's band is dark, or the tube has lines the strip lacks.` };
      },
      reward: {
        log: 'The sealed tube\'s lines matched one reference exactly.',
        title: 'Emission Spectrum',
        body: 'Every gas gives its own set of bright lines, so the lines work as a fingerprint that no other gas shares. The light a glowing gas gives out, read this way, is its emission spectrum.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const lad = energyLadder('lad', 'Hydrogen', LADDER_AT);
    return {
      title: 'Hydrogen Red Line',
      prompt: 'Make the hydrogen atom give out its red line.',
      widget,
      table: opticsTable({
        pieces: [lad.electron],
        fixtures: [lad.fixture, linesStrip('made', 'Lines made', LINES_AT, 'lad')],
        zones: { slots: lad.slots }
      }),
      hints: [
        'Use the electron: drag it up the ladder, then drop it onto a lower rung.',
        'Compare the colour and the wavelength of the line each drop gives out on the strip.',
        'Drop the electron from each higher rung in turn, and read each line until you meet the red one.'
      ],
      check(state) {
        const read = ladderRead(state.table, 'lad');
        const l = read.last;
        if (!l) return { ok: false, notYet: true, msg: 'Move the electron to another rung.' };
        if (l.up || l.nm == null) return { ok: false, msg: 'That move gave out no light.' };
        if (isRed(l.nm)) return { ok: true };
        return { ok: false, msg: 'The last line made is not the red one.' };
      },
      reward: {
        log: 'The red line: down from the third rung to the second.',
        title: 'Energy Levels',
        body: 'An electron in hydrogen can only sit on certain rungs, called energy levels, and each line in the spectrum is a jump down between two of them. The lowest rung is the ground state, and any higher one is an excited state.',
        model: { type: 'ladder', hi: 3, lo: 2, caption: 'An electron dropping from the third energy level to the second emits the difference in energy as a photon of red light.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const sp = spectrograph('sp', 'Band', { x: 44, y: 27 }, { cell: true, ref: true, size: { w: 84, h: 52 } });
    return {
      title: 'Light Through Cool Gas',
      prompt: 'Pick the element in the cool cell.',
      widget,
      table: opticsTable({
        pieces: [
          refStrip('h', 'Hydrogen', { x: 104, y: 11 }, 'H'),
          refStrip('he', 'Helium', { x: 104, y: 32 }, 'He'),
          refStrip('na', 'Sodium', { x: 104, y: 53 }, 'Na'),
          refStrip('hg', 'Mercury', { x: 130, y: 11 }, 'Hg'),
          filament('fil', 'Filament', { x: 130, y: 31 }),
          coolCell('cell', 'Cool cell', { x: 130, y: 50 }, 'H')
        ],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }),
      hints: [
        'Use the socket for the filament, the cell holder for the cool cell and the alongside slot for the strips.',
        'Compare the dark places in the band with the lines on each strip, position by position.',
        'Keep the element whose every line falls exactly on a dark place in the band behind the cool cell.'
      ],
      check(state) {
        const r = bandRead(state.table, 'sp');
        if (!r.src || r.src.kind !== 'filament' || !r.cell) return { ok: false, notYet: true, msg: 'Plug the filament into the socket and put the cool cell in front of it.' };
        if (!r.ref) return { ok: false, notYet: true, msg: 'Slide an element\'s strip alongside the band.' };
        if (r.whole && r.refLines.length === r.seen.length) return { ok: true };
        return { ok: false, msg: `The ${r.ref.label} strip has lines where the band behind the cell is bright.` };
      },
      reward: {
        log: 'Cool hydrogen takes out exactly what hot hydrogen gives.',
        title: 'Absorption Spectrum',
        body: 'Cool hydrogen takes out of the filament\'s light exactly the colours that hot hydrogen gives out, leaving dark lines in the band. That pattern of missing colours is the absorption spectrum, and its lines sit where the emission lines do.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Drag a source into the socket.'],
  3: ['Put the tube in the socket, then slide an element\'s', 'strip into the alongside slot.'],
  4: ['Drag the electron to another rung.', 'Any light that leaves is written on the strip.'],
  5: ['Put the filament in the socket, the cool cell in front of it,', 'then find which element is in the cell.']
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
      body: 'An atom\'s electrons sit only on certain energy levels, and light is given out or taken in exactly when an electron moves between two of them. Each gas therefore has a line spectrum no other gas shares.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Line spectra identify elements across chemistry and astronomy. Emission lines reveal which atoms are present, while dark absorption lines show which cool gases lie in front of a light source.'
    },
    {
      heading: 'Next',
      body: 'The simple ladder model only fits single-electron atoms like hydrogen. The next bench examines where electrons actually reside in three dimensions.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Sources are plugged in, strips slid alongside, an electron dragged from rung to
   rung, a prediction is a token. Nothing here says what a band or a ladder reads.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const rung = n => put('lad.e', `slot:lad.r${n === TOP ? 'top' : n}`);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ predict: 'exact' }],
  [put('fil', 'slot:sp.src'), put('h', 'slot:sp.src'), put('he', 'slot:sp.src'), put('na', 'slot:sp.src'), put('fil', 'tray:band'), put('h', 'tray:lines'), put('he', 'tray:lines'), put('na', 'tray:lines')],
  [put('x', 'slot:sp.src'), put('h', 'slot:sp.ref'), put('he', 'slot:sp.ref')],
  [rung(3), rung(2)],
  [put('fil', 'slot:sp.src'), put('cell', 'slot:sp.cell'), put('he', 'slot:sp.ref'), put('h', 'slot:sp.ref')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('fil', 'tray:lines'), put('h', 'tray:band'), put('he', 'tray:lines'), put('na', 'tray:lines')],
  [put('x', 'slot:sp.src'), put('h', 'slot:sp.ref')],
  [rung(4), rung(2)],
  [put('fil', 'slot:sp.src'), put('cell', 'slot:sp.cell'), put('he', 'slot:sp.ref')]
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
export { planJump, jumpsForLine, photonJoules, bohrJoules, LINES, seated, rungOf, SOURCES, STRIP_GAS, QUEST_KEY };
