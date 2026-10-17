/**
 * q3-lines.js — Lanternfall, bench three: LINE SPECTRA.
 *
 * The prism, with gas tubes, and the energy ladder. The aurora over this ice field is the reason the bench exists: a glowing gas
 * does not give out a smear of colour but a handful of exact ones, and that is the first thing anybody ever saw that said an
 * atom's electrons are not free to be anywhere. The quest goes from "which light is which" through "which jump makes which
 * line" to the one place the simple ladder fails.
 *
 * The third of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4a), on the optics kit. The bench is the spectrograph
 * sled's own table, tailgate down: sources are plugged into the socket, a reference strip is slid alongside the band, and the
 * energy ladder is worked by dragging its one electron from rung to rung, each drop giving out the line it makes.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  a hot filament and a gas tube, each in the socket        -> continuous and line spectra
 *   2  name the gas in a sealed tube against reference strips   -> emission spectrum
 *   3  filament light through a cell of cool gas                -> absorption spectrum
 *   4  drag the electron down a rung until it gives out red     -> energy levels, ground and excited states
 *   5  the energy of one line                                   -> the jump's energy leaves as one photon
 *   6  predict a line from the ladder, then make the drop       -> the Bohr model
 *   7  an electron given more than the whole ladder             -> ionization
 *   8  which of three lines a drop on the ladder can make       -> the model's limit
 *
 * Every line is a real one (`lightdata.js` `LINES`), every rung the real Bohr value -2.18 x 10^-18 J / n^2, and every drop is
 * asked of `planJump`, so the strip shows exactly the line the electron's fall gives out. Which pair of rungs makes a line the
 * player puts in the probe is `jumpsForLine`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { planJump, jumpsForLine, photonJoules, LINES, bohrJoules } from '../../engine/lightdata.js';
import {
  opticsTable, spectrograph, energyLadder, linesStrip, plaque, marker, filament, gasTube, coolCell, refStrip, lineChip,
  bandRead, ladderRead, rungOf, seated, TOP
} from '../../table/kits/optics.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bcontinuous spectrum\b/i, introducedAt: 1 },
  { term: /\bline spectrum\b/i, introducedAt: 1 },
  { term: /\bemission spectrum\b/i, introducedAt: 2 },
  { term: /\babsorption spectrum\b/i, introducedAt: 3 },
  { term: /\benergy levels?\b/i, introducedAt: 4 },
  { term: /\bground state\b/i, introducedAt: 4 },
  { term: /\bexcited states?\b/i, introducedAt: 4 },
  { term: /\bbohr\b/i, introducedAt: 6 },
  { term: /\bioniz\w*\b/i, introducedAt: 7 }
];

export const BUILDS_ON = ['unit02/q1-wave', 'unit02/q2-photon'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, x, y = 55, w = 44, cell = 22, h = 18) => ({ id, label, at: { x, y }, size: { w, h }, cell });
const where = (t, id) => (t.pieces[id].zone || '').replace(/^tray:/, '');
const trayed = (t, ids) => ids.every(id => where(t, id) && !where(t, id).startsWith('slot:'));

/** The ladder, with the strip it writes on, at the table's left; stages that also need a plaque or a marker fit them to its right. */
const LADDER_AT = { x: 30, y: 32 };
const LINES_AT = { x: 104, y: 16 };
const TOP_LABEL = 'top';

/** The red line: the one visible line of hydrogen that is longer than orange. */
const isRed = nm => nm >= 620 && nm <= 750;

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const sp = spectrograph('sp', 'Band', { x: 56, y: 21 });
    return {
      title: 'Filament and Tube',
      briefing: {
        speaker: SPEAKER,
        body: 'A source put in the socket has its light spread by a prism across a scale in nanometres. The band it makes is the picture to read.'
      },
      prompt: 'Put each light source under the kind of band it makes.',
      widget,
      table: opticsTable({
        pieces: [
          filament('fil', 'Filament', { x: 124, y: 12 }),
          gasTube('tube', 'Gas tube', { x: 124, y: 34 }, 'H')
        ],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, trays: [tray('band', 'Lit from end to end', 28), tray('lines', 'Lit in a few places', 75)] }
      }),
      hints: [
        'Drag a source into the socket and look at the band it makes.',
        'Compare whether each band is filled from one end to the other or only lit in a few places.',
        'Put the source whose band is lit everywhere in the first tray and the one lit in only a few exact places in the second.'
      ],
      check(state) {
        const t = state.table;
        if (!trayed(t, ['fil', 'tube'])) return { ok: false, notYet: true, msg: 'Put both sources under a band.' };
        if (where(t, 'fil') === 'band' && where(t, 'tube') === 'lines') return { ok: true };
        return { ok: false, msg: 'A source is under the wrong band: put it in the socket and look at which positions on the scale it lights.' };
      },
      reward: {
        log: 'A hot wire: every colour. A glowing gas: a few.',
        title: 'Line Spectrum',
        body: 'A hot solid gives off an unbroken band of every colour, a continuous spectrum, while a glowing gas gives off only a few bright lines, a line spectrum. The light from a gas is not a smear of colours but a set of exact ones.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const sp = spectrograph('sp', 'Band', { x: 44, y: 27 }, { ref: true, size: { w: 84, h: 52 } });
    return {
      title: 'Name the Gas',
      briefing: {
        speaker: SPEAKER,
        body: 'A reference strip can be slid alongside the band, and the lines on it that fall on a line of the band light up.'
      },
      prompt: 'Find which reference strip matches the lines of the sealed tube.',
      widget,
      table: opticsTable({
        pieces: [
          refStrip('h', 'Hydrogen', { x: 104, y: 11 }, 'H'),
          refStrip('he', 'Helium', { x: 134, y: 11 }, 'He'),
          refStrip('na', 'Sodium', { x: 104, y: 33 }, 'Na'),
          gasTube('x', 'Sealed tube', { x: 134, y: 33 }, 'He')
        ],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }),
      hints: [
        'Plug the sealed tube into the socket, then slide a reference strip alongside its band.',
        'Compare the strip\'s lines with the sealed tube\'s lines, position by position, and watch which of them light.',
        'Try each strip in turn and keep the one whose every line falls exactly on a line of the sealed tube\'s band.'
      ],
      check(state) {
        const r = bandRead(state.table, 'sp');
        if (!r.src || r.src.id !== 'x') return { ok: false, notYet: true, msg: 'Plug the sealed tube into the socket to read its lines.' };
        if (!r.ref) return { ok: false, notYet: true, msg: 'Slide a reference strip alongside the band.' };
        if (r.whole && r.refLines.length === r.seen.length) return { ok: true };
        return { ok: false, msg: 'Match every line, not just one: the sealed tube\'s lines must sit exactly where the strip\'s do.' };
      },
      reward: {
        log: 'The sealed tube\'s lines matched one reference exactly.',
        title: 'Emission Spectrum',
        body: 'Every gas gives its own set of bright lines, so the lines work as a fingerprint that no other gas shares. The light a glowing gas gives out, read this way, is its emission spectrum.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const sp = spectrograph('sp', 'Band', { x: 44, y: 27 }, { cell: true, ref: true, size: { w: 84, h: 52 } });
    return {
      title: 'Light Through Cool Gas',
      prompt: 'Find which reference strip matches the dark lines the cool cell cuts out of the filament\'s light.',
      widget,
      table: opticsTable({
        pieces: [
          refStrip('h', 'Hydrogen', { x: 104, y: 11 }, 'H'),
          refStrip('he', 'Helium', { x: 134, y: 11 }, 'He'),
          refStrip('na', 'Sodium', { x: 104, y: 33 }, 'Na'),
          filament('fil', 'Filament', { x: 134, y: 33 }),
          coolCell('cell', 'Cool cell', { x: 119, y: 52 }, 'H')
        ],
        fixtures: [sp.fixture],
        zones: { slots: sp.slots }
      }),
      hints: [
        'Plug the filament into the socket and put the cool cell in front of it, then slide a strip alongside the band.',
        'Compare the dark places in the band with the lines on each strip, position by position.',
        'Keep the strip whose every line falls exactly on a dark place in the band behind the cool cell.'
      ],
      check(state) {
        const r = bandRead(state.table, 'sp');
        if (!r.src || r.src.kind !== 'filament' || !r.cell) return { ok: false, notYet: true, msg: 'Plug the filament into the socket and put the cool cell in front of it.' };
        if (!r.ref) return { ok: false, notYet: true, msg: 'Slide a reference strip alongside the band.' };
        if (r.whole && r.refLines.length === r.seen.length) return { ok: true };
        return { ok: false, msg: 'Compare the band behind the cell with the bare filament\'s, then compare the places where they differ with the strip\'s lines.' };
      },
      reward: {
        log: 'Cool hydrogen takes out exactly what hot hydrogen gives.',
        title: 'Absorption Spectrum',
        body: 'Cool hydrogen takes out of the filament\'s light exactly the colours that hot hydrogen gives out, leaving dark lines in the band. That pattern of missing colours is the absorption spectrum, and its lines sit where the emission lines do.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const lad = energyLadder('lad', 'Hydrogen', LADDER_AT);
    return {
      title: 'Which Jump',
      briefing: {
        speaker: SPEAKER,
        body: 'The rungs are the energies the hydrogen atom\'s electron can have, and it rests on the lowest. Drag it to another rung and the strip records any light that leaves.'
      },
      prompt: 'Make the hydrogen atom give out its red line.',
      widget,
      table: opticsTable({
        pieces: [lad.electron],
        fixtures: [lad.fixture, linesStrip('made', 'Lines made', LINES_AT, 'lad')],
        zones: { slots: lad.slots }
      }),
      hints: [
        'Drag the electron up to a higher rung, then drop it onto a lower one, and watch the strip.',
        'Compare the colour and the wavelength of the line each drop gives out.',
        'Drop the electron from each higher rung in turn, and read each line\'s wavelength until you meet the red one.'
      ],
      check(state) {
        const read = ladderRead(state.table, 'lad');
        const l = read.last;
        if (!l) return { ok: false, notYet: true, msg: 'Move the electron to another rung.' };
        if (l.up || l.nm == null) return { ok: false, msg: 'Light is given out when an electron drops, so the move must run from a higher rung to a lower one.' };
        if (isRed(l.nm)) return { ok: true };
        return { ok: false, msg: 'The last line made is not the red one: read each line\'s colour and wavelength on the strip.' };
      },
      reward: {
        log: 'The red line: down from the third rung to the second.',
        title: 'Energy Levels',
        body: 'An electron in hydrogen can only sit on certain rungs, called energy levels, and each line in the spectrum is a jump down between two of them. The lowest rung is the ground state, and any higher one is an excited state.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const lad = energyLadder('lad', 'Hydrogen', LADDER_AT);
    return {
      title: 'Energy of a Line',
      prompt: 'What is the energy of the 486 nm emission line?',
      widget,
      table: opticsTable({
        pieces: [lad.electron],
        fixtures: [
          lad.fixture,
          linesStrip('made', 'Lines made', { x: 104, y: 13 }, 'lad', { size: { w: 84, h: 24 }, list: false }),
          plaque('card', 'On the plaque', { x: 104, y: 36 }, ['Worked line: 656 nm is 3.03 x 10^-19 J', 'h 6.626 x 10^-34 J s;  c 3.00 x 10^8 m/s'], { w: 84, h: 20 }),
          marker('energy', 'Your reading', { x: 104, y: 55 }, { label: 'Energy (x 10^-19 J)', min: 3.5, max: 4.5, step: 0.1, value: 3.5, size: { w: 60, h: 16 } })
        ],
        zones: { slots: lad.slots }
      }),
      hints: [
        'Use the worked figure for the 656 nm line to see how a wavelength turns into an energy.',
        'Turn 486 nm into a frequency with the speed of light, then multiply by Planck\'s constant.',
        'Convert 486 nm to metres with 10^-9, divide the speed of light by it, multiply the result by 6.626 x 10^-34 J s and set your reading to it.'
      ],
      check(state) {
        const v = state.table.fixtures.energy.dials.n.value;
        if (v === 3.5) return { ok: false, notYet: true, msg: 'Set the energy you worked out.' };
        if (v === 4.1) return { ok: true };
        return { ok: false, msg: 'Check the method on the worked 656 nm line first, then apply it to this line.' };
      },
      reward: {
        log: 'The 486 nm line carries 4.09 x 10^-19 J.',
        title: 'Energy Out Equals Energy Lost',
        body: 'The energy given out in a jump is exactly the difference between the two rungs, and it leaves as one photon: ΔE = hν. A bigger drop gives a photon of higher frequency, which is why the blue line comes from a bigger drop than the red.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const lad = energyLadder('lad', 'Hydrogen', LADDER_AT);
    const token = (id, at) => ({ id, label: id, at, r: 6.5 });
    return {
      title: 'A Line Not Yet Seen',
      prompt: 'Predict which wavelength an electron dropping from the fifth rung to the second gives out.',
      widget,
      table: opticsTable({
        pieces: [lad.electron],
        fixtures: [
          lad.fixture,
          linesStrip('made', 'Lines made', { x: 104, y: 13 }, 'lad', { size: { w: 84, h: 24 }, list: false }),
          plaque('card', 'On the plaque', { x: 104, y: 36 }, ['Rung n sits at -2.18 x 10^-18 J / n^2', 'h 6.626 x 10^-34 J s;  c 3.00 x 10^8 m/s'], { w: 84, h: 20 })
        ],
        zones: { slots: lad.slots },
        prediction: {
          slot: { id: 'predict', label: 'Line made, in nm', at: { x: 72, y: 53 }, size: { w: 22, h: 12 } },
          tokens: [token('410', { x: 94, y: 54 }), token('434', { x: 109, y: 54 }), token('486', { x: 124, y: 54 }), token('656', { x: 139, y: 54 })]
        }
      }),
      hints: [
        'Place a prediction, then drag the electron up to the fifth rung and down to the second to test it.',
        'Compare the line the strip records with the wavelengths on the tokens.',
        'Work out the energy of the fifth rung and of the second with the formula on the plaque, subtract, and turn that energy into a wavelength.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for the line first.' };
        const real = String(Math.round(planJump(5, 2).nm));
        if (token === real) return { ok: true };
        const made = ladderRead(t, 'lad').lines.some(n => Math.abs(n - planJump(5, 2).nm) < 1);
        if (made) return { ok: false, msg: 'The line the drop made is not the one you predicted.' };
        return { ok: false, msg: 'Work the jump through with the formula, then make the drop on the ladder and compare the line it gives out with your prediction.' };
      },
      reward: {
        log: 'The formula predicts a line the player never tapped.',
        title: 'The Bohr Model',
        body: 'The Bohr model puts hydrogen\'s electron on rungs at -2.18 x 10^-18 J divided by n squared, and from that one formula it predicts every line of hydrogen\'s visible spectrum to within a nanometre or two. A drop from the fifth rung to the second gives 434 nm, exactly as measured.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const lad = energyLadder('lad', 'Hydrogen', LADDER_AT, { top: true });
    return {
      title: 'Past the Top',
      prompt: 'Give the electron more energy than the whole ladder can hold.',
      widget,
      table: opticsTable({
        pieces: [lad.electron],
        fixtures: [lad.fixture, linesStrip('made', 'Lines made', LINES_AT, 'lad')],
        zones: { slots: lad.slots }
      }),
      hints: [
        'Drag the electron up the ladder, rung by rung, and read what the strip says about each climb.',
        'Compare the highest rung with the dashed line above it.',
        'An electron given more than the whole climb has no rung left to land on.'
      ],
      check(state) {
        const read = ladderRead(state.table, 'lad');
        if (read.rung === null || read.rung === 1) return { ok: false, notYet: true, msg: 'Move the electron up the ladder.' };
        if (read.out) return { ok: true };
        return { ok: false, msg: 'The electron still sits on a rung of the ladder: give it more than the whole climb.' };
      },
      reward: {
        log: 'The top of the ladder is open: the electron is gone.',
        title: 'Ionization',
        body: 'Give an electron more than the whole climb and it leaves the atom altogether, which is ionization. Hydrogen\'s electron needs exactly 2.18 x 10^-18 J to climb from its ground state to the open top.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const lad = energyLadder('lad', 'Hydrogen', LADDER_AT, { probeAt: { x: 74, y: 33 } });
    const chip = (id, nm, x) => lineChip(id, nm, { x, y: 33 });
    return {
      title: 'Helium Does Not Fit',
      prompt: 'Put each line in the tray that says whether any drop on the hydrogen ladder makes it.',
      widget,
      table: opticsTable({
        pieces: [lad.electron, chip('c486', 486, 99), chip('c588', 588, 119), chip('c447', 447, 139)],
        fixtures: [lad.fixture, linesStrip('made', 'Lines made', { x: 104, y: 13 }, 'lad', { size: { w: 84, h: 24 }, list: false })],
        zones: { slots: lad.slots, trays: [tray('yes', 'A drop makes it', 82, 54, 38, 18, 20), tray('no', 'No drop makes it', 122, 54, 38, 18, 20)] }
      }),
      hints: [
        'Drag a line into the probe slot and read what the strip says about it.',
        'Compare each line with the lines the hydrogen ladder gives out when its electron drops.',
        'A line goes in the first tray only if some pair of rungs gives it, and in the second if none does.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['c486', 'c588', 'c447'];
        if (!trayed(t, ids)) return { ok: false, notYet: true, msg: 'Put every line in a tray.' };
        for (const id of ids) {
          const makes = jumpsForLine(t.pieces[id].props.nm).length > 0;
          if (where(t, id) !== (makes ? 'yes' : 'no')) return { ok: false, msg: 'A line is in the wrong tray: put it in the probe slot and read whether any pair of rungs makes it.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'One electron fits the ladder; two do not.',
        title: 'Where the Model Stops',
        body: 'The ladder fits hydrogen because hydrogen\'s one electron has nothing else to feel. Helium\'s two electrons push on each other, so its rungs no longer follow the formula and the Bohr model cannot place its lines.',
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
      body: 'An atom\'s electrons sit only on certain energy levels, and light is given out or taken in exactly when an electron moves between two of them. Each gas therefore has a line spectrum no other gas shares, and the Bohr model reads hydrogen\'s from one formula.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every aurora, every neon sign and every star is read this way. The colours say which atoms are there, and the dark lines say which cool atoms lie in front of them.'
    },
    {
      heading: 'Next',
      body: 'The ladder breaks for helium because an electron is not a bead on a rung. The next bench asks where an electron actually is.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas tube gives out a few bright lines on a dark background. This is:',
    options: [
      { id: 'a', label: 'An emission line spectrum' },
      { id: 'b', label: 'A continuous spectrum' },
      { id: 'c', label: 'An absorption spectrum' },
      { id: 'd', label: 'A white-light spectrum' }
    ],
    answer: 'a',
    explanation: 'A glowing gas gives out only certain wavelengths, so its spectrum is a few bright lines. A hot solid gives a continuous band, and cool gas in front of one gives dark absorption lines.'
  },
  {
    question: 'An electron in a hydrogen atom drops from n = 3 to n = 2. What happens?',
    options: [
      { id: 'a', label: 'A photon with energy equal to the difference between the two levels is given out' },
      { id: 'b', label: 'A photon is absorbed' },
      { id: 'c', label: 'Nothing, because the electron stays in the atom' },
      { id: 'd', label: 'The atom is ionized' }
    ],
    answer: 'a',
    explanation: 'Falling to a lower level gives up the energy difference, and it leaves as one photon. Absorbing a photon would raise the electron, and ionization needs the electron to leave altogether.'
  },
  {
    question: 'In the Bohr model of hydrogen, which jump gives out the photon of highest frequency?',
    options: [
      { id: 'a', label: 'n = 6 to n = 2' },
      { id: 'b', label: 'n = 3 to n = 2' },
      { id: 'c', label: 'n = 4 to n = 3' },
      { id: 'd', label: 'n = 5 to n = 4' }
    ],
    answer: 'a',
    explanation: 'The bigger the drop in energy, the higher the photon\'s frequency. The levels crowd closer together as n grows, so the drop from n = 6 to n = 2 is the largest of the four.'
  },
  {
    question: 'The Bohr levels of hydrogen are E = -2.18 x 10^-18 J / n^2. How much energy lifts an electron from n = 1 to n = 2?',
    options: [
      { id: 'a', label: '1.64 x 10^-18 J' },
      { id: 'b', label: '2.18 x 10^-18 J' },
      { id: 'c', label: '5.45 x 10^-19 J' },
      { id: 'd', label: '2.73 x 10^-18 J' }
    ],
    answer: 'a',
    explanation: 'E(1) = -2.18 x 10^-18 J and E(2) = -2.18 x 10^-18 / 4 = -5.45 x 10^-19 J. The difference is 2.18 x 10^-18 - 5.45 x 10^-19 = 1.64 x 10^-18 J.'
  },
  {
    question: 'Why does the Bohr model fail for atoms with more than one electron?',
    options: [
      { id: 'a', label: 'It ignores the repulsion between electrons, which changes the energy levels' },
      { id: 'b', label: 'It only works for gases' },
      { id: 'c', label: 'Larger atoms have no energy levels' },
      { id: 'd', label: 'Photons cannot be absorbed by larger atoms' }
    ],
    answer: 'a',
    explanation: 'The model was built for one electron attracted by one nucleus. With a second electron the two repel each other, and the simple 1/n^2 pattern no longer fits the levels.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Sources are plugged in, strips slid alongside, an electron dragged from rung to
   rung, lines put in the probe, a prediction is a token. Nothing here says what a band or a ladder reads.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const reading = (fixture, value) => ({ setDial: { fixture, dial: 'n', value } });
const rung = n => put('lad.e', `slot:lad.r${n === TOP ? 'top' : n}`);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [put('fil', 'slot:sp.src'), put('tube', 'slot:sp.src'), put('fil', 'tray:band'), put('tube', 'tray:lines')],
  [put('x', 'slot:sp.src'), put('h', 'slot:sp.ref'), put('he', 'slot:sp.ref')],
  [put('fil', 'slot:sp.src'), put('cell', 'slot:sp.cell'), put('he', 'slot:sp.ref'), put('h', 'slot:sp.ref')],
  [rung(3), rung(2)],
  [rung(4), rung(2), reading('energy', 4.1)],
  [{ predict: '434' }, rung(5), rung(2)],
  [rung(TOP)],
  [put('c486', 'slot:lad.probe'), put('c588', 'slot:lad.probe'), put('c447', 'slot:lad.probe'), put('c486', 'tray:yes'), put('c588', 'tray:no'), put('c447', 'tray:no')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('fil', 'tray:lines'), put('tube', 'tray:band')],
  [put('x', 'slot:sp.src'), put('h', 'slot:sp.ref')],
  [put('fil', 'slot:sp.src'), put('cell', 'slot:sp.cell'), put('he', 'slot:sp.ref')],
  [rung(4), rung(2)],
  [rung(4), rung(2), reading('energy', 4.4)],
  [{ predict: '486' }, rung(5), rung(2)],
  [rung(6)],
  [put('c486', 'tray:no'), put('c588', 'tray:yes'), put('c447', 'tray:no')]
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
export { planJump, jumpsForLine, photonJoules, bohrJoules, LINES, seated, rungOf, TOP_LABEL };
