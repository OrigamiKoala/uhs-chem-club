/**
 * q2-photon.js — Lanternfall, bench two: PHOTONS.
 *
 * The photocell: a metal plate in a vacuum tube, a cup that counts the electrons that leave it each second, and a meter for
 * the speed of the fastest. `q1-wave` ended on a puzzle the wave picture cannot answer, and this is the answer, reached the
 * way it was reached in 1905: by turning two dials and watching two meters disagree about what "more" means.
 *
 * The second of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4a), on the optics kit. The bench is the desk at
 * the foot of an aurora mast, where the photocell is kept out of the wind: metal plates are dragged into the holder, the
 * colour and the brightness are set, and the electrons that leave the plate run to a collector and into a counting cup.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  free electrons from a plate                      -> a puzzle: red at full does nothing
 *   2  the lowest frequency that frees any              -> threshold frequency
 *   3  what brightness does above the threshold         -> photon
 *   4  what raising the frequency does                  -> the photoelectric effect
 *   5  the energy of one photon                         -> E = h x frequency, Planck's constant
 *   6  three plates, put in order of how hard they hold on -> work function
 *   7  the lamps that free electrons from zinc          -> only the ultraviolet has the energy
 *   8  predict an intense red lamp on zinc, then test   -> light is both wave and particle
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 5 asks for the energy of a photon without ever giving the number a photon's energy is
 * a multiple of: the plaque carries one worked check, a sodium threshold quoted in joules beside its wavelength, and
 * dividing the one by the frequency of the other is how the constant is found.
 *
 * EVERY READING IS `planPhotocell`: the counter, the speed meter and the cup are its answer for the plate in the holder, the
 * colour on the dial and the brightness, and no `check()` authors any of it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { planPhotocell, photonJoules, thresholdNm } from '../../engine/lightdata.js';
import {
  opticsTable, photocell, metalPlate, lamp, plaque, marker, cellRead, firstFreeing, seated
} from '../../table/kits/optics.js';

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

/** The dial, red end first. */
const SWEEP = [650, 600, 550, 500, 450, 400, 350];
/** Finer near sodium's threshold, so "the lowest that frees any" has exactly one answer. */
const NEAR_SODIUM = [650, 600, 575, 550, 525, 500, 450];
/** The speed dial: sodium is dark at the first setting and fastest at the last. */
const SPEEDS = [550, 500, 450, 400, 350, 300];
/** A wide sweep for the three plates, with each metal's own threshold between two steps. */
const THREE_PLATES = [650, 600, 575, 550, 525, 450, 350, 300, 275];
/** Red, violet and two ultraviolet settings for zinc. */
const FOR_ZINC = [650, 400, 300, 250];

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

/** A plate standing in the holder, fixed there: the stage is about the light, not the plate. */
const seatedPlate = (id, label, cell, metal) => metalPlate(id, label, cell.slots[0].at, metal, { fixed: true, zone: `slot:${cell.slots[0].id}` });
/** A lamp standing in the lamp slot, fixed there. */
const seatedLamp = (id, label, cell, nm) => lamp(id, label, cell.slots[1].at, nm, { fixed: true, zone: `slot:${cell.slots[1].id}` });

const SHEET = { at: { x: 128, y: 28 }, size: { w: 36, h: 34 }, xLabel: 'Frequency', xUnit: 'x 10^14 /s', yLabel: 'Speed', yUnit: 'x 10^5 m/s' };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 31 }, { settings: SWEEP, start: 1, brightness: { start: 5 } });
    return {
      title: 'A Plate That Will Not Give',
      briefing: {
        speaker: SPEAKER,
        body: 'A lamp shines on a metal plate in a vacuum tube, and the electrons it frees run into a cup. The meters show how many leave each second and how fast the fastest one flies.'
      },
      prompt: 'Get electrons to break free from the sodium plate.',
      widget,
      table: opticsTable({
        pieces: [metalPlate('na', 'Sodium', { x: 128, y: 22 }, 'Na')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Drag the sodium plate into the holder, then turn the colour dial and the brightness dial and watch the cup.',
        'Compare what the cup collects for red at full brightness with what it collects for violet at its dimmest.',
        'Try every colour on the dial at both ends of the brightness dial until the cup collects something.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        if (!r.plate) return { ok: false, notYet: true, msg: 'Put the sodium plate in the holder.' };
        if (r.freed) return { ok: true };
        if (r.fixture.dials.colour.value === 1 && r.brightness === 5) {
          return { ok: false, notYet: true, msg: 'Nothing is leaving the plate with the lamp as it stands. Change what it does.' };
        }
        return { ok: false, msg: 'The cup is still empty. Brighter is not the only thing this lamp can change.' };
      },
      reward: {
        log: 'Red at full brightness: nothing. Violet, barely lit: electrons.',
        title: 'A Puzzle the Wave Cannot Solve',
        body: 'A brighter lamp is a bigger wave, so a wave picture says red at full strength should free at least as many electrons as violet at a whisper. The plate says the opposite, which is something waves alone cannot explain.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 26 }, { settings: NEAR_SODIUM, start: 1, brightness: 3 });
    return {
      title: 'Where It Wakes',
      prompt: 'Find the lowest frequency that knocks electrons loose from the sodium plate.',
      widget,
      table: opticsTable({
        pieces: [seatedPlate('na', 'Sodium', cell, 'Na')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Turn the colour dial from the red end toward violet and watch for the first setting where the cup collects something.',
        'Every setting beyond it frees electrons too, so the answer is the first one that does, not any one that does.',
        'Step the dial one position at a time and stop on the setting just after the cup leaves empty.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        const v = r.fixture.dials.colour.value;
        const first = firstFreeing(r.fixture.props.settings, 'Na', 3);
        if (v === first) return { ok: true };
        if (v === 1) return { ok: false, notYet: true, msg: 'The lamp is where it started. Set it, then Commit.' };
        if (v < first) return { ok: false, msg: 'No electron leaves the plate at this setting. Keep turning toward violet.' };
        return { ok: false, msg: 'Electrons already leave at the setting before this one. Look for where they first appear.' };
      },
      reward: {
        log: 'The cup wakes at one setting and not before.',
        title: 'Threshold Frequency',
        body: 'Below one particular frequency no electron leaves, however bright the lamp is; at and above it electrons come off at once. That cut-off is the threshold frequency, and every metal has its own.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 26 }, { lamp: true, brightness: { start: 2 } });
    return {
      title: 'Turn Up the Lamp',
      prompt: 'Double the number of electrons the cup collects each second.',
      widget,
      table: opticsTable({
        pieces: [seatedPlate('na', 'Sodium', cell, 'Na'), seatedLamp('v', 'Lamp', cell, 400)],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots }
      }),
      hints: [
        'Turn the brightness dial up and down and watch both the cup and the speed meter.',
        'Compare the count and the speed at the lowest brightness with the count and speed at a higher one.',
        'Raise the brightness a step at a time until the cup collects twice what it did when you began.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        const began = planPhotocell('Na', 400, cell.fixture.dials.brightness.value).count;
        if (r.count === began * 2) return { ok: true };
        if (r.count === began) return { ok: false, notYet: true, msg: 'The cup is collecting what it did when you began. Change the lamp.' };
        return { ok: false, msg: 'The cup is not collecting twice what it did when you began. Read both meters at two brightnesses and see which one moves.' };
      },
      reward: {
        log: 'Brighter: more electrons, same speed.',
        title: 'Photon',
        body: 'Brightness changes how many electrons leave but not how fast, as if the light arrived in separate packets and each packet freed one electron. Each packet is a photon, and a brighter lamp sends more photons every second, not stronger ones.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 26 }, { settings: SPEEDS, start: 1, brightness: 3, record: true });
    return {
      title: 'Turn Up the Frequency',
      prompt: 'Tune the lamp so that the fastest electron leaves at 8 x 10^5 metres per second.',
      widget,
      table: opticsTable({
        pieces: [seatedPlate('na', 'Sodium', cell, 'Na')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots },
        recorder: SHEET
      }),
      hints: [
        'Turn the colour dial toward violet and watch the speed meter, pressing "Record" to keep each reading.',
        'Compare the speed at the first colour that frees electrons with the speed at the last, and see which meter changes.',
        'Step the dial one position at a time until the speed meter reads the figure the prompt asks for.'
      ],
      check(state) {
        const r = cellRead(state.table, 'cell');
        if (r.freed && Math.abs(r.speed - 8) < 0.05) return { ok: true };
        if (r.fixture.dials.colour.value === 1) return { ok: false, notYet: true, msg: 'The speed meter reads zero with the lamp where it started. Tune it.' };
        return { ok: false, msg: 'The fastest electron is not leaving at that speed. Watch the speed meter as you turn the dial.' };
      },
      reward: {
        log: 'Higher frequency: faster electrons, same number.',
        title: 'The Photoelectric Effect',
        body: 'Raising the frequency makes each freed electron faster and leaves their number alone, while raising the brightness does the opposite. This is the photoelectric effect, and it shows that a photon\'s energy is set by its frequency and the number of photons by the brightness.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'One Photon\'s Energy',
    prompt: 'What is the energy of a single photon at 500 nm?',
    widget,
    table: opticsTable({
      pieces: [],
      fixtures: [
        plaque('card', 'On the plaque', { x: 56, y: 24 }, [
          'Sodium threshold: 539 nm',
          'One photon at 539 nm: 3.69 x 10^-19 J',
          'Planck constant h: 6.626 x 10^-34 J s',
          'Light speed c: 3.00 x 10^8 m/s',
          'Frequency of 500 nm light: 6.00 x 10^14 /s'
        ], { w: 96, h: 40 }),
        marker('energy', 'Your reading', { x: 56, y: 54 }, { label: 'Energy (x 10^-19 J)', min: 0, max: 8, step: 0.5, value: 0, size: { w: 60, h: 16 } })
      ]
    }),
    hints: [
      'Use the sodium plate\'s worked figure: its threshold wavelength is given beside the energy of one photon at that wavelength.',
      'Turn the threshold wavelength, written in metres with 10^-9, into a frequency with the speed of light, then divide the photon\'s energy by that frequency to find the number that ties them together.',
      'Multiply that number by the frequency printed for 500 nm light to get the energy of one of its photons, and set your reading to the result.'
    ],
    check(state) {
      const v = state.table.fixtures.energy.dials.n.value;
      if (v === 0) return { ok: false, notYet: true, msg: 'Set the energy you worked out.' };
      if (v === 4) return { ok: true };
      return { ok: false, msg: 'A photon\'s energy is proportional to its frequency, so scale the worked sodium figure by how the two frequencies compare.' };
    },
    reward: {
      log: 'Energy is frequency times one fixed number.',
      title: 'Planck\'s Constant',
      body: 'A photon\'s energy is its frequency multiplied by one fixed number, E = h x frequency, where h = 6.626 x 10^-34 joule seconds is Planck\'s constant. The sodium plate\'s worked figure was simply that sum done at its threshold.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
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
        'Drag a plate from the rail into the holder, sweep the colour dial from red toward violet and watch the cup.',
        'The plate whose cup wakes at the lowest frequency lets go of its electrons most easily.',
        'Note the setting where each plate\'s cup first leaves zero, then put the plate that woke earliest at the left end of the rail.'
      ],
      check(state) {
        const order = state.table.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three plates back on the rail in order.' };
        const want = ['cs', 'na', 'zn'];
        if (order.join() === want.slice().reverse().join()) {
          return { ok: false, msg: 'That order runs the wrong way: the plate at the left end of the rail must be the one that lets go most easily.' };
        }
        if (order.join() !== want.join()) {
          return { ok: false, msg: 'Sweep the dial and note where each plate\'s cup first wakes before you place it.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'Cesium wakes first, then sodium, then zinc.',
        title: 'Work Function',
        body: 'The least energy that frees an electron from a metal is its work function, about 3.4 x 10^-19 J for cesium, 3.7 for sodium and 6.9 for zinc. The higher it is, the higher the frequency a photon needs before it frees anything.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 23 }, { lamp: true, brightness: 5 });
    const tray = (id, label, y) => ({ id, label, at: { x: 128, y }, size: { w: 44, h: 20 }, cell: 22 });
    return {
      title: 'Freeing Zinc',
      prompt: 'Put each lamp that frees electrons from the zinc plate in the first tray.',
      widget,
      table: opticsTable({
        pieces: [
          seatedPlate('zn', 'Zinc', cell, 'Zn'),
          lamp('a', 'Lamp A', { x: 24, y: 55 }, 650),
          lamp('b', 'Lamp B', { x: 56, y: 55 }, 520),
          lamp('c', 'Lamp C', { x: 88, y: 55 }, 250)
        ],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots, trays: [tray('yes', 'Frees electrons', 14), tray('no', 'Frees none', 40)] }
      }),
      hints: [
        'Drag a lamp into the lamp slot and watch the cup beside the zinc plate.',
        'Compare each lamp\'s photon energy with the work function of zinc, which was the highest of the three plates.',
        'A lamp frees electrons only if its wavelength is shorter than the zinc plate\'s threshold wavelength.'
      ],
      check(state) {
        const t = state.table;
        const want = { a: 'no', b: 'no', c: 'yes' };
        const where = id => (t.pieces[id].zone || '').replace(/^tray:/, '');
        if (Object.keys(want).some(id => !where(id) || where(id).startsWith('slot:'))) return { ok: false, notYet: true, msg: 'Put every lamp in a tray.' };
        for (const id of Object.keys(want)) {
          if (where(id) !== want[id]) return { ok: false, msg: 'A lamp is in the wrong tray: put it in the lamp slot and see whether the cup wakes.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'Only the ultraviolet lamp frees zinc.',
        title: 'Zinc Needs Ultraviolet',
        body: 'Zinc holds its electrons so tightly that only ultraviolet photons carry enough energy to free one. Red and green photons fall short, and no amount of them makes up the difference.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const cell = photocell('cell', 'Photocell', { x: 52, y: 31 }, { settings: FOR_ZINC, start: 1, brightness: { start: 3 }, record: 'Test' });
    return {
      title: 'Why Brighter Fails',
      prompt: 'Predict whether an intense red light frees electrons from the zinc plate.',
      widget,
      table: opticsTable({
        pieces: [seatedPlate('zn', 'Zinc', cell, 'Zn')],
        fixtures: [cell.fixture],
        zones: { slots: cell.slots },
        prediction: {
          slot: { id: 'predict', label: 'Intense red on zinc', at: { x: 128, y: 17 }, size: { w: 28, h: 12 } },
          tokens: [
            { id: 'leave', label: 'Electrons', at: { x: 128, y: 40 }, r: 6.5 },
            { id: 'none', label: 'None', at: { x: 128, y: 54 }, r: 6.5 }
          ]
        }
      }),
      hints: [
        'Place a prediction, then turn the lamp to red at full brightness and press "Test" to see what the plate does.',
        'Compare what brightness changed with what frequency changed, using what you found at the earlier stages.',
        'Ask whether more photons that each carry too little energy can ever do what one photon of a bigger energy does.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for the intense red light first.' };
        const real = planPhotocell('Zn', FOR_ZINC[0], 5).freed ? 'leave' : 'none';
        if (token === real) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The plate did not do what you predicted.' };
        return { ok: false, msg: 'Turn the lamp to red at full brightness, press Test, and compare what the cup does with your prediction.' };
      },
      reward: {
        log: 'More photons of too little energy never add up.',
        title: 'Both Wave and Particle',
        body: 'Light acts as a wave, yet arrives in photons that free electrons one by one. Like a machine taking only dollar coins, a sack of pennies never buys a dollar item. This is called *wave-particle duality*.',
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Plates are put in the holder and back on the rail, dials are set, a reading is
   recorded, a prediction is a token. Nothing here says what the cup counts.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const colour = value => ({ setDial: { fixture: 'cell', dial: 'colour', value } });
const bright = value => ({ setDial: { fixture: 'cell', dial: 'brightness', value } });
const reading = (fixture, value) => ({ setDial: { fixture, dial: 'n', value } });
/** The setting of the three-plates dial at which `metal` first frees electrons. */
const wakes = metal => firstFreeing(THREE_PLATES, metal, 3);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [put('na', 'slot:cell.holder'), colour(6), bright(1)],
  [colour(5)],
  [bright(4)],
  [colour(6), { run: 'cell' }],
  [reading('energy', 4)],
  [
    put('cs', 'slot:cell.holder'), colour(wakes('Cs')), { run: 'cell' }, put('cs', 'rail:0'),
    put('na', 'slot:cell.holder'), colour(wakes('Na')), { run: 'cell' }, put('na', 'rail:1'),
    put('zn', 'slot:cell.holder'), colour(wakes('Zn')), { run: 'cell' }, put('zn', 'rail:2')
  ],
  [put('a', 'slot:cell.lamp'), put('b', 'slot:cell.lamp'), put('c', 'slot:cell.lamp'), put('a', 'tray:no'), put('b', 'tray:no'), put('c', 'tray:yes')],
  [{ predict: 'none' }, bright(5), { run: 'cell' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('na', 'slot:cell.holder'), colour(3), bright(5)],
  [colour(7)],
  [bright(3)],
  [colour(4), { run: 'cell' }],
  [reading('energy', 3.5)],
  [put('cs', 'rail:2')],
  [put('a', 'tray:yes'), put('b', 'tray:no'), put('c', 'tray:yes')],
  [{ predict: 'leave' }, bright(5), { run: 'cell' }]
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
export { planPhotocell, photonJoules, thresholdNm, seated, THREE_PLATES, NEAR_SODIUM, SPEEDS, FOR_ZINC };
