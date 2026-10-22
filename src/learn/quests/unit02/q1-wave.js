/**
 * q1-wave.js — Lanternfall, bench one: LIGHT AS A WAVE.
 *
 * Tallow left the player with electrons on rings at fixed distances and no reason why. Lanternfall is the reason, and it
 * starts with the light itself: the sky over this ice field is the first emission spectrum the player ever sees.
 *
 * The first of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4a), on the optics kit. The bench is the wave flume's
 * observation shelf on the south shore of the lake, and its table is an optical rail: a lamp put in a screen draws its wave
 * and counts the crests that pass each second, a colour dial tunes it, a pulse is timed between two detectors set a measured
 * distance apart, lamps are put on a rail by frequency. The flume itself is the field stage: a strip off its chart recorder,
 * the same picture drawn in water.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  tune a lamp until more crests pass a second than a fixed lamp's -> wavelength, frequency
 *   2  tune the lamp to twice the crest spacing of Sample A            -> they are inversely related
 *   3  time a pulse between two detectors a measured distance apart    -> the speed of light
 *   4  read two reference lamps, work out a lamp that is not on the bench -> frequency from wavelength
 *   5  four lamps on a rail, lowest frequency to highest               -> the visible spectrum
 *   6  tray three lamps under the strip that picks them up             -> the electromagnetic spectrum
 *   7  tray a radio mast, an oven and an X-ray tube by frequency       -> one kind of wave, every size
 *   8  put in the slot the lamp that makes a frequency                  -> every code is an element
 *   -- debrief: a lamp can be told by its light, and a bright red one will not do what a faint violet one does.
 *
 * EVERY READING IS `lightdata.js`: the crests that fit the ruler are `planTrace`, the time a pulse takes is `pulseNs`, which strip
 * a lamp lights is `planPrism` and `detectorFor`. The kit (`table/kits/optics.js`) only asks what is standing in which slot.
 *
 * `VOCABULARY` publishes the schedule. Wavelength and frequency are earned on the first card; the screen prints the real words
 * from the start, and the stage-one briefing says what the screen counts.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { fmtLength } from '../../engine/lightbench.js';
import { planTrace } from '../../engine/lightdata.js';
import {
  opticsTable, waveScreen, logRuler, pulseRail, spectrograph, lamp, tunedLamp, waterStrip, radiator, detector, marker,
  waveRead, rulerRead, bandRead, pulseRead, seated, pickedUpBy, detectorsOn
} from '../../table/kits/optics.js';

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

/** The dial, red end first: turning it up raises the frequency. */
const RED_TO_VIOLET = [700, 650, 600, 550, 500, 450, 400];
const WIDE_DIAL = [700, 650, 600, 550, 500, 450, 400, 350];

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

/** A lamp already standing in a screen's holder, fixed there: a reference the player reads and cannot move. */
const seatedLamp = (id, label, screen, nm) => lamp(id, label, screen.slots[0].at, nm, { fixed: true, zone: `slot:${screen.slots[0].id}` });

/** The trays of a sort: a row of three wide ones across the foot of the table. */
const tray = (id, label, x, y = 55) => ({ id, label, at: { x, y }, size: { w: 44, h: 18 }, cell: 22 });
const TRAY_X = [28, 75, 122];

/** Rate of a wave screen, as a number the check compares. */
const rateOf = (t, id) => { const r = waveRead(t, id); return r && r.kind === 'light' ? r.plan.hz : null; };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const a = waveScreen('a', 'Sample A', { x: 38, y: 20 });
    const l = waveScreen('l', 'Lamp', { x: 112, y: 23 }, { settings: RED_TO_VIOLET, start: 4 });
    return {
      title: 'Red to Violet',
      briefing: {
        speaker: SPEAKER,
        body: 'A lamp put in its holder draws its light as a wave, and the Colour dial tunes it; 10^14 means 1 followed by 14 zeros. Press Submit when the table shows your answer.'
      },
      prompt: 'Tune the lamp so that more crests pass each second than pass for Sample A.',
      widget,
      table: opticsTable({
        pieces: [
          seatedLamp('ref', 'Sample A', a, 500),
          tunedLamp('lamp', 'Lamp', { x: 28, y: 53 }),
          waterStrip('flume', 'Flume strip', { x: 58, y: 53 }, 0.9, 1.1, { hidden: true, fetchFrom: 'flume' })
        ],
        fixtures: [a.fixture, l.fixture],
        zones: { slots: [...a.slots, ...l.slots] },
        fetch: [{ id: 'flume', label: 'Flume strip', at: { x: 112, y: 54 } }]
      }),
      hints: [
        'Drag the lamp into its holder, then turn the colour dial and watch the wave change.',
        'Compare the crests that pass each second on the lamp\'s screen with the number on Sample A\'s.',
        'Turn the colour dial until the lamp\'s count is the larger of the two, and look at how its crests are spaced.'
      ],
      check(state) {
        const t = state.table;
        const mine = rateOf(t, 'l');
        const ref = rateOf(t, 'a');
        if (mine === null) return { ok: false, notYet: true, msg: 'Put the lamp in its holder to light its screen.' };
        if (mine > ref) return { ok: true };
        return { ok: false, msg: 'At this setting fewer crests pass each second than pass for Sample A. Turn the dial and watch what the wave does.' };
      },
      reward: {
        log: 'Violet: crests close together, many a second.',
        title: 'Wavelength and Frequency',
        body: 'The distance from one crest to the next is the wavelength, and the number of crests that pass each second is the frequency. Turning from red to violet shortens the wavelength and raises the frequency, so the two move in opposite directions.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const a = waveScreen('a', 'Sample A', { x: 38, y: 20 });
    const l = waveScreen('l', 'Lamp', { x: 112, y: 23 }, { settings: WIDE_DIAL, start: 4 });
    return {
      title: 'Twice as Far Apart',
      prompt: 'Tune the lamp until its crests sit twice as far apart as Sample A\'s.',
      widget,
      table: opticsTable({
        pieces: [
          seatedLamp('ref', 'Sample A', a, 350),
          tunedLamp('lamp', 'Lamp', { x: 28, y: 53 })
        ],
        fixtures: [a.fixture, l.fixture],
        zones: { slots: [...a.slots, ...l.slots] }
      }),
      hints: [
        'Put the lamp in its holder and turn the colour dial to see how far apart its crests are at each setting.',
        'Compare the crest spacing printed on the lamp\'s screen with the crest spacing printed on Sample A\'s.',
        'Double the spacing printed for Sample A, then turn the dial until the lamp\'s spacing matches that figure.'
      ],
      check(state) {
        const t = state.table;
        const mine = waveRead(t, 'l');
        const ref = waveRead(t, 'a');
        if (!mine) return { ok: false, notYet: true, msg: 'Put the lamp in its holder to light its screen.' };
        if (mine.nm === ref.nm * 2) return { ok: true };
        return { ok: false, msg: 'Measure Sample A and the lamp, then compare: the lamp\'s crests are not twice as far apart as Sample A\'s at this setting.' };
      },
      reward: {
        log: 'The wider lamp counted half as fast.',
        title: 'Two Quantities, One Trade',
        body: 'The lamp with crests twice as far apart counted exactly half as many each second. Wavelength and frequency are inversely related: whatever you do to one, the other undoes.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rail = pulseRail('rail', 'Pulse timer', { x: 68, y: 21.5 }, {
      marks: [{ metres: 0, label: '0 m' }, { metres: 1.5, label: '1.5 m' }, { metres: 3, label: '3.0 m' }, { metres: 4.5, label: '4.5 m' }, { metres: 6, label: '6.0 m' }]
    });
    return {
      title: 'Spacing Times Count',
      prompt: 'Find how fast light travels.',
      widget,
      table: opticsTable({
        pieces: [
          detector('d1', 'Detector 1', { x: 30, y: 49 }),
          detector('d2', 'Detector 2', { x: 58, y: 49 })
        ],
        fixtures: [rail.fixture, marker('speed', 'Your reading', { x: 100, y: 53 }, { label: 'Speed (x 10^8 m/s)', min: 0, max: 6, step: 0.5, value: 0, size: { w: 52, h: 16 } })],
        zones: { slots: rail.slots },
        recorder: { at: { x: 140, y: 52 }, size: { w: 18, h: 18 }, xLabel: 'Gap', xUnit: 'm', yLabel: 'Time', yUnit: 'ns' }
      }),
      hints: [
        'Stand a detector on each of two marks and press "Fire Pulse" to time the light between them.',
        'Compare the gap between the detectors with the time the pulse took to cross it.',
        'Divide the gap by the time, turning nanoseconds into seconds with 10^-9, and set your reading to the result.'
      ],
      check(state) {
        const t = state.table;
        const v = t.fixtures.speed.dials.n.value;
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the speed you worked out.' };
        if (v === 3) return { ok: true };
        return { ok: false, msg: 'Divide the gap the pulse crossed by the time it took, in the same units, and check the result against your reading.' };
      },
      reward: {
        log: 'A pulse crossed the gap at one speed.',
        title: 'The Speed of Light',
        body: 'Light crosses 3.0 metres in 10 nanoseconds, which is 3.00 x 10^8 metres per second: the speed of light. A lamp\'s wavelength times the crests that pass each second comes to that same figure, so a longer wavelength has to mean a lower frequency.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = waveScreen('r', 'Screen', { x: 40, y: 21 });
    return {
      title: 'A Lamp Not on the Bench',
      prompt: 'What is the frequency of light with a wavelength of 600 nm?',
      widget,
      table: opticsTable({
        pieces: [
          lamp('r1', 'Lamp 1', { x: 104, y: 12 }, 300),
          lamp('r2', 'Lamp 2', { x: 104, y: 30 }, 500)
        ],
        fixtures: [r.fixture, marker('freq', 'Your reading', { x: 108, y: 53 }, { label: 'Frequency (x 10^14 /s)', min: 0, max: 12, step: 0.5, value: 0, size: { w: 56, h: 16 } })],
        zones: { slots: r.slots }
      }),
      hints: [
        'Put each reference lamp in the holder in turn and read the wavelength and the frequency its screen prints.',
        'Turn each wavelength into metres with 10^-9 and multiply it by its frequency, then check that the two products agree.',
        'Divide that fixed product by 600 nm, written in metres with 10^-9, to get the frequency in waves per second.'
      ],
      check(state) {
        const v = state.table.fixtures.freq.dials.n.value;
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the frequency you worked out.' };
        if (v === 5) return { ok: true };
        return { ok: false, msg: 'Use what the two reference lamps show: a wavelength and its frequency are tied together by one fixed product.' };
      },
      reward: {
        log: 'Frequency is the speed of light over wavelength.',
        title: 'One Division',
        body: 'Frequency is the speed of light divided by wavelength, so a lamp that is not on the bench still has a frequency you can work out. Any wavelength, measured or merely named, turns into a frequency with that single division.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = waveScreen('r', 'Screen', { x: 75, y: 20 });
    const rail = { id: 'rail', at: { x: 75, y: 52 }, size: { w: 124, h: 15 }, first: 'Lowest frequency', last: 'Highest frequency', items: ['a', 'b', 'c', 'd'], start: ['a', 'c', 'b', 'd'] };
    return {
      title: 'Lowest to Highest',
      prompt: 'Put the four lamps on the rail from lowest frequency to highest.',
      widget,
      table: opticsTable({
        pieces: [
          lamp('a', 'Lamp A', { x: 20, y: 52 }, 520),
          lamp('b', 'Lamp B', { x: 50, y: 52 }, 680),
          lamp('c', 'Lamp C', { x: 80, y: 52 }, 430),
          lamp('d', 'Lamp D', { x: 110, y: 52 }, 600)
        ],
        fixtures: [r.fixture],
        zones: { slots: r.slots, rail }
      }),
      hints: [
        'Drag a lamp from the rail into the holder to read its frequency, then put it back.',
        'Compare the frequency each lamp\'s screen prints as you try them one at a time.',
        'Put the lamp with the widest crests at the left end of the rail and the one with the closest crests at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four lamps back on the rail in order.' };
        const want = ['b', 'd', 'a', 'c'];
        if (order.join() === want.slice().reverse().join()) {
          return { ok: false, msg: 'That order runs the wrong way: the lamp at the left end of the rail must have the lowest frequency.' };
        }
        if (order.join() !== want.join()) return { ok: false, msg: 'Compare each lamp\'s frequency before you place it.' };
        return { ok: true };
      },
      reward: {
        log: 'Red low, violet high.',
        title: 'The Visible Spectrum',
        body: 'The light the eye can see runs from red, with the longest wavelengths and lowest frequencies, to violet, with the shortest wavelengths and highest frequencies. That band, from about 700 nm down to about 400 nm, is the visible spectrum.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const band = spectrograph('band', 'Band', { x: 56, y: 21 }, { detectors: true });
    return {
      title: 'Past the Ends',
      prompt: 'Put each lamp under the detector that picks up its light.',
      widget,
      table: opticsTable({
        pieces: [
          lamp('a', 'Lamp A', { x: 115, y: 10 }, 550),
          lamp('b', 'Lamp B', { x: 137, y: 10 }, 1000),
          lamp('c', 'Lamp C', { x: 126, y: 28 }, 300)
        ],
        fixtures: [band.fixture],
        zones: {
          slots: band.slots,
          trays: [tray('eye', 'The band itself', TRAY_X[0]), tray('ir', 'The infrared strip', TRAY_X[1]), tray('uv', 'The ultraviolet strip', TRAY_X[2])]
        }
      }),
      hints: [
        'Drag a lamp into the socket and see which part of the band, or which strip beside it, lights up.',
        'Compare each lamp\'s wavelength with the two ends of the band the eye can see.',
        'A wavelength longer than red falls past the red end of the band, and one shorter than violet falls past the violet end.'
      ],
      check(state) {
        const t = state.table;
        const want = { a: 'eye', b: 'ir', c: 'uv' };
        const where = id => (t.pieces[id].zone || '').replace(/^tray:/, '');
        if (Object.keys(want).some(id => !where(id) || where(id).startsWith('slot:'))) return { ok: false, notYet: true, msg: 'Put every lamp under a detector.' };
        for (const id of Object.keys(want)) {
          if (where(id) !== want[id]) return { ok: false, msg: 'A lamp is under the wrong detector: put it in the socket and see what lights.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'Beyond red and beyond violet, there is still light.',
        title: 'The Electromagnetic Spectrum',
        body: 'Beyond red lies infrared, with longer wavelengths and lower frequencies, and beyond violet lies ultraviolet, with shorter wavelengths and higher frequencies. Radio waves, microwaves, X-rays and the rest continue the same line, and together they make up the electromagnetic spectrum, of which visible light is a thin slice.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const ruler = logRuler('ruler', 'Ruler', { x: 45, y: 19 });
    return {
      title: 'Radio to X-ray',
      prompt: 'Put each source under the frequency it works at.',
      widget,
      table: opticsTable({
        pieces: [
          radiator('radio', 'Radio mast', { x: 108, y: 10 }, 3e9),
          radiator('micro', 'Microwave', { x: 135, y: 10 }, 1.2e8),
          radiator('xray', 'X-ray tube', { x: 121, y: 28 }, 0.1)
        ],
        fixtures: [ruler.fixture],
        zones: {
          slots: ruler.slots,
          trays: [tray('f8', '1 x 10^8 per second', TRAY_X[0]), tray('f9', '2.5 x 10^9 per second', TRAY_X[1]), tray('f18', '3 x 10^18 per second', TRAY_X[2])]
        }
      }),
      hints: [
        'Drag a source into the ruler\'s holder to read the wavelength it works at.',
        'Divide the speed of light by each wavelength, written in metres with 10^-9, to get that source\'s frequency.',
        'The longest wavelength has the lowest frequency and the shortest has the highest, so only the sizes of the three figures are left to match.'
      ],
      check(state) {
        const t = state.table;
        const want = { radio: 'f8', micro: 'f9', xray: 'f18' };
        const where = id => (t.pieces[id].zone || '').replace(/^tray:/, '');
        if (Object.keys(want).some(id => !where(id) || where(id).startsWith('slot:'))) return { ok: false, notYet: true, msg: 'Match all three sources.' };
        for (const id of Object.keys(want)) {
          if (where(id) !== want[id]) return { ok: false, msg: 'Work one source\'s frequency out from its wavelength and see which figure it lands on.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'Metres to a tenth of a nanometre: one kind of wave.',
        title: 'One Kind of Wave, Every Size',
        body: 'A radio mast, a microwave oven and an X-ray tube all send out the same kind of wave; only the wavelength differs, from metres down to a tenth of a nanometre. Frequency rises as wavelength falls, by exactly the factor that keeps their product at the speed of light.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const r = waveScreen('r', 'Screen', { x: 42, y: 20 }, { rate: false });
    return {
      title: 'Names on the Lamps',
      prompt: 'Which lamp emits light at a frequency of 5.1 x 10^14 per second?',
      widget,
      table: opticsTable({
        pieces: [
          lamp('a', 'Lamp A', { x: 30, y: 52 }, 589),
          lamp('b', 'Lamp B', { x: 62, y: 52 }, 656)
        ],
        fixtures: [r.fixture],
        zones: { slots: [...r.slots, { id: 'match', label: '5.1 x 10^14 per second', at: { x: 112, y: 22 }, size: { w: 28, h: 16 } }] }
      }),
      hints: [
        'Drag a lamp into the holder to read the wavelength its screen prints.',
        'Divide the speed of light by 5.1 x 10^14 per second to get the wavelength the lamp has to have.',
        'Turn that wavelength into nanometres with 10^9, then put the lamp that prints it in the matching slot.'
      ],
      check(state) {
        const t = state.table;
        const there = seated(t, 'match');
        if (!there) return { ok: false, notYet: true, msg: 'Put a lamp in the matching slot.' };
        if (there.id === 'a') return { ok: true };
        return { ok: false, msg: 'Divide the speed of light by 5.1 x 10^14 to find the wavelength, then read the lamp\'s screen against it.' };
      },
      reward: {
        log: 'CAT 11 is sodium, CAT 01 is hydrogen.',
        title: 'Every Code Is an Element',
        body: 'Each catalogue code you have been filing by is an element with a name and a symbol: CAT 11 is sodium, Na, and CAT 01 is hydrogen, H. From here on the benches print the symbol beside the code.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the lamp into its holder.', 'Turn the Colour dial to tune it.'],
  3: ['Stand a detector on each of two marks,', 'then press Fire Pulse.'],
  4: ['Put a lamp in the holder to read its screen.'],
  5: ['Read a lamp in the holder, then put it back.'],
  6: ['Try each lamp in the socket.'],
  7: ['Put a source in the holder to read it,', 'then drag it under the figure it matches.'],
  8: ['Put a lamp in the holder to read it,', 'then drag it to the matching slot.']
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
      body: 'Great job measuring light on the ice! Next, we\'ll investigate why a bright red lamp can\'t knock an electron loose, but faint violet light can.'
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
  [{ fetch: 'flume' }, put('flume', 'slot:l.lamp'), put('lamp', 'slot:l.lamp'), colour('l', 6)],
  [put('lamp', 'slot:l.lamp'), colour('l', 1)],
  [put('d1', 'slot:rail.m0'), put('d2', 'slot:rail.m2'), { run: 'rail' }, reading('speed', 3)],
  [put('r1', 'slot:r.lamp'), put('r2', 'slot:r.lamp'), reading('freq', 5)],
  [put('a', 'slot:r.lamp'), put('c', 'rail:2'), put('a', 'rail:2')],
  [put('a', 'slot:band.src'), put('b', 'slot:band.src'), put('c', 'slot:band.src'), put('a', 'tray:eye'), put('b', 'tray:ir'), put('c', 'tray:uv')],
  [put('radio', 'slot:ruler.src'), put('micro', 'slot:ruler.src'), put('xray', 'slot:ruler.src'), put('radio', 'tray:f8'), put('micro', 'tray:f9'), put('xray', 'tray:f18')],
  [put('a', 'slot:r.lamp'), put('b', 'slot:r.lamp'), put('a', 'slot:match')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('lamp', 'slot:l.lamp'), colour('l', 2)],
  [put('lamp', 'slot:l.lamp'), colour('l', 3)],
  [put('d1', 'slot:rail.m0'), put('d2', 'slot:rail.m1'), { run: 'rail' }, reading('speed', 2.5)],
  [put('r1', 'slot:r.lamp'), reading('freq', 4)],
  [put('d', 'rail:0')],
  [put('a', 'tray:ir'), put('b', 'tray:eye'), put('c', 'tray:uv')],
  [put('radio', 'tray:f9'), put('micro', 'tray:f8'), put('xray', 'tray:f18')],
  [put('b', 'slot:match')]
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
export { planTrace, fmtLength, rulerRead, bandRead, pulseRead, pickedUpBy, detectorsOn };
