/**
 * q4-cloud.js — Lanternfall, bench four: ORBITALS.
 *
 * The particle probe, on the crawler's lab bench. Bench three ended on a ladder that breaks for helium, because an electron is
 * not a bead on a rung, and this is where it is. A probe finds the electron once per shot and leaves a dot; one shot is a dot
 * and five hundred are a shape, drawn from the real hydrogen-like |psi|^2 and reproducible shot for shot.
 *
 * The fourth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4b), on the cloud kit (`table/kits/cloud.js`). Each press
 * of a plate's Run key drops a dot (the exposure dial says one shot, fifty or five hundred); a counting ring set on the plate
 * counts what is inside it or what lies in its shell; films of one area, laid on a plate, count what they catch; strings of
 * different wavelengths are put round the ring track and sorted by whether they close; clouds are turned and tilted from the one
 * view the table shares, put on the peg of the axis their lobes lie along and into trays by shape.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  one shot, then fifty, then ring where most fall    -> probability
 *   2  four outlines of one area laid on the plate        -> orbital
 *   3  strings sorted by whether they close on a ring     -> standing wave, wave-particle duality
 *   4  a second cloud, bigger, with an empty shell        -> node
 *   5  a cloud turned until a slice through it is empty   -> p orbital, beside s orbital
 *   6  the pegs a two-lobed cloud lies along              -> three p orbitals
 *   7  five clouds sorted by shape                        -> d orbitals
 *   8  predict the speed blur when the position sharpens  -> the uncertainty principle
 *
 * From stage five a cloud is a SOLID the player turns (the view dials): the three flat views it replaced asked for a spatial
 * skill this audience has not got yet, and the turn dials let them find the side a shape shows itself from.
 *
 * THE BENCH NEVER DRAWS A PATH. The Track Electron key exists only to refuse, with the reason (`cloudplate.js` `trackRefusal`).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import {
  cloudTable, cloudPlate, viewFixture, ringTrack, blurGauge, tracker, cloudCard, ringTile, filmPiece,
  plateRead, ringRead, filmRead, trackRead, blurRead, blurAt, catchOf, axisOf, nodePm, shapeOf, FILMS, ringFits, RING_CIRCUMFERENCE_PM, BOHR_PM,
  SLICE_HALF
} from '../../table/kits/cloud.js';

export const meta = { stageCount: 8 };

/** Specific phrases first, so "p orbital" is read as the phrase and not as a stray "orbital". */
export const VOCABULARY = [
  { term: /\buncertainty principle\b/i, introducedAt: 8 },
  { term: /\bd orbitals?\b/i, introducedAt: 7 },
  { term: /\bp orbitals?\b/i, introducedAt: 5 },
  { term: /\bs orbitals?\b/i, introducedAt: 5 },
  { term: /\bwave.particle duality\b/i, introducedAt: 3 },
  { term: /\bstanding waves?\b/i, introducedAt: 3 },
  { term: /\bnodes?\b/i, introducedAt: 4 },
  { term: /\borbitals?\b/i, introducedAt: 2 },
  { term: /\bprobabilit(?:y|ies)\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q2-photon', 'unit02/q3-lines'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, at, size, cell = 19) => ({ id, label, at, size, cell });
const where = (t, id) => (t.pieces[id].zone || '').replace(/^(tray|slot):/, '');
const inTray = (t, id) => (t.pieces[id].zone || '').startsWith('tray:');

/** The ring track's six strings, in pm: 1, 1.33, 1.66, 2, 2.37 and 3 wavelengths go round it. */
const RING_STRINGS = [332, 250, 200, 166, 140, 111];

/** The share of a plate's shots a counting ring may hold and still be "nine in ten". */
const NINE_IN_TEN = [0.85, 0.97];

const MIN_SHOTS = 50;
const ENOUGH_SHOTS = 200;

/** How much of the cloud a slice may leave on the plate and still be "almost nothing". */
const EMPTY_SLICE = 0.06;

/** The half width, in pm, the node a stage asks for may be set within. */
const NODE_TOLERANCE_PM = 12;


/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const a = cloudPlate('a', 'SAMPLE A', { x: 50, y: 31 }, '1s', { ring: 'disc', ringMax: 300, ringStep: 10 });
    return {
      title: 'One Shot, Fifty Shots',
      briefing: {
        speaker: SPEAKER,
        body: 'This detector fires pulses to find an electron\'s location and leaves a glowing dot. Repeated shots reveal the pattern where the electron spends its time.'
      },
      prompt: 'Set the counting ring to hold about nine in ten of Sample A\'s shots.',
      widget,
      table: cloudTable({ pieces: [], fixtures: [a.fixture] }, { w: 100 }),
      hints: [
        'Press "Fire" with the exposure at one shot, then at fifty, and watch where the dots land.',
        'Compare where each new shot lands with where the one before it landed, and read how many fall inside the ring.',
        'Take at least fifty shots, then widen the ring until about nine in every ten of them fall inside it and no more.'
      ],
      check(state) {
        const t = state.table;
        const r = ringRead(t, 'a');
        if (r.fired < MIN_SHOTS) return { ok: false, notYet: true, msg: 'Fire more shots first: a few dots say little about where the rest will fall.' };
        if (r.rpm === 0) return { ok: false, notYet: true, msg: 'Set the counting ring on the plate.' };
        if (r.share < NINE_IN_TEN[0]) return { ok: false, msg: 'Too many shots fall outside the ring: read how many are inside it and set it again.' };
        if (r.share > NINE_IN_TEN[1]) return { ok: false, msg: 'The ring holds nearly every shot: read how many are inside it and set it again.' };
        return { ok: true };
      },
      reward: {
        log: 'One shot: one place. The next: another.',
        title: 'Probability',
        body: 'One shot finds the electron in one place and the next shot finds it somewhere else. Only after many shots does a pattern appear, so all that can be said about where it is is the probability of finding it in each place.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const a = cloudPlate('a', 'SAMPLE A', { x: 36, y: 31 }, '1s', { film: true });
    const at = [[98, 16], [124, 16], [98, 44], [124, 44]];
    const shapes = ['ring', 'disc', 'hollow', 'lobes'];
    return {
      title: 'Five Hundred Shots',
      briefing: {
        speaker: SPEAKER,
        body: 'Each film is an outline with the same area as the others. Laid on the plate, a film counts the dots it catches.'
      },
      prompt: 'Find the film that catches the most of Sample A\'s dots.',
      widget,
      table: cloudTable({
        pieces: shapes.map((s, i) => filmPiece(`f${i + 1}`, `FILM ${'ABCD'[i]}`, { x: at[i][0], y: at[i][1] }, s)),
        fixtures: [a.fixture],
        zones: { slots: a.slots }
      }),
      hints: [
        'Fire the full five hundred shots, then lay a film on the plate and read how many dots it catches.',
        'Compare the count each film catches and look at where on the plate the dots lie thickest.',
        'Lay each of the four films in turn, note its count, and keep the film that catches the most.'
      ],
      check(state) {
        const t = state.table;
        const f = filmRead(t, 'a');
        if (f.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Fire more shots first: a film cannot be judged from a few dots.' };
        if (!f.shape) return { ok: false, notYet: true, msg: 'Lay a film on the plate.' };
        const best = Math.max(...Object.keys(FILMS).map(k => catchOf(t, 'a', k)));
        if (f.caught === best) return { ok: true };
        return { ok: false, msg: 'Another film catches more of the dots: lay each one on the plate and compare the counts.' };
      },
      reward: {
        log: 'A fuzzy ball, densest in the middle.',
        title: 'Orbital',
        body: 'The cloud of dots is a picture of where the electron is likely to be found, and a region like it is called an orbital. This one, round and densest at the middle, is the lowest orbital an electron can have.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const track = ringTrack('track', { x: 37, y: 40 });
    const tiles = RING_STRINGS.map((pm, i) => ringTile(`s${pm}`, { x: 20 + i * 22, y: 9 }, pm));
    return {
      title: 'Waves That Fit',
      briefing: {
        speaker: SPEAKER,
        body: 'A string put on the ring track is drawn round it, lap after lap.'
      },
      prompt: 'Sort the six strings by whether they close into one clean ring on the track.',
      widget,
      table: cloudTable({
        pieces: tiles,
        fixtures: [track.fixture],
        zones: {
          slots: track.slots,
          trays: [tray('closes', 'Closes into one ring', { x: 110, y: 28 }, { w: 66, h: 20 }, 20), tray('smears', 'Smears into a band', { x: 110, y: 52 }, { w: 66, h: 20 }, 20)]
        }
      }),
      hints: [
        'Drag a string onto the track and look at what the laps do.',
        'Compare a string whose laps draw one clean ring with one whose laps smear into a band.',
        'A string closes only if a whole number of its wavelengths go round the track, so divide the track length by each wavelength.'
      ],
      check(state) {
        const t = state.table;
        const ids = RING_STRINGS.map(pm => `s${pm}`);
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put every string in a tray.' };
        for (const pm of RING_STRINGS) {
          const fits = ringFits(pm, RING_CIRCUMFERENCE_PM).fits;
          if (where(t, `s${pm}`) !== (fits ? 'closes' : 'smears')) {
            return { ok: false, msg: 'A string is in the wrong tray: put it on the track and check whether its laps agree, then check the strings you did not test.' };
          }
        }
        return { ok: true };
      },
      reward: {
        log: 'Only whole numbers of waves survive the lap.',
        title: 'Standing Wave',
        body: 'A wave on a ring survives only if a whole number of wavelengths fits, because otherwise each lap cancels the one before. Electrons are held to the same rule, which is why they behave as waves as well as particles: wave-particle duality.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const a = cloudPlate('a', 'SAMPLE A', { x: 36, y: 31 }, '1s', { ring: 'band', ringMax: 300, ringStep: 5, slice: true, extent: 8 });
    const b = cloudPlate('b', 'SAMPLE B', { x: 104, y: 31 }, '2s', { ring: 'band', ringMax: 300, ringStep: 5, slice: true, extent: 8 });
    return {
      title: 'Bigger and Emptier',
      briefing: {
        speaker: SPEAKER,
        body: 'The ring now counts the shots that lie at its distance from the middle, and Slice shows only a thin slab through the middle.'
      },
      prompt: 'Find the distance from the middle at which Sample B has a shell with no shots in it.',
      widget,
      table: cloudTable({ pieces: [], fixtures: [a.fixture, b.fixture] }),
      hints: [
        'Press "Fire" with the exposure at five hundred shots, then turn Slice on and look at both plates.',
        'Compare how far out each cloud reaches, and turn the ring through the distances while you read the count in its shell.',
        'Step the ring outward from the middle and stop where the count in the shell falls to nothing between two distances that have shots.'
      ],
      check(state) {
        const t = state.table;
        const r = ringRead(t, 'b');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Fire more shots at Sample B first: an empty shell cannot be found among a few dots.' };
        const want = nodePm('2s');
        if (Math.abs(r.rpm - want) <= NODE_TOLERANCE_PM) return { ok: true };
        if (r.count === 0) return { ok: false, msg: 'A shell can be empty because the cloud has not reached it, or because nothing is found there: look for a distance with shots on both sides of it.' };
        return { ok: false, msg: 'Shots lie in the shell at that distance: turn the ring through the distances and read the count in each.' };
      },
      reward: {
        log: 'The bigger cloud has a shell with nothing in it.',
        title: 'Node',
        body: 'The second cloud is larger than the first and has a shell where the electron is never found, which is called a node. Each step up in energy makes the cloud bigger and adds a node.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const c = cloudPlate('c', 'SAMPLE C', { x: 36, y: 31 }, '2pz', { view: 'view', extent: 12 });
    const v = viewFixture('view', { x: 104, y: 22 }, { slice: true });
    return {
      title: 'Two Lobes',
      briefing: {
        speaker: SPEAKER,
        body: 'From here the plate shows the whole cloud as a solid you can turn and tilt. Slice keeps only the dots within a thin slab through the middle, across your line of sight.'
      },
      prompt: 'Find the view in which a slice through the middle of Sample C shows almost no dots.',
      widget,
      table: cloudTable({ pieces: [], fixtures: [c.fixture, v] }),
      hints: [
        'Press "Fire" with the exposure at five hundred shots, then turn and tilt the view to look at the cloud from other sides.',
        'Compare the sides, noting the direction in which the dots gather and the flat plane they never cross.',
        'Turn the cloud until you look along the gap between its lobes, then switch Slice on and see whether the middle goes empty.'
      ],
      check(state) {
        const t = state.table;
        const r = plateRead(t, 'c');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Fire more shots first: an empty slice cannot be found among a few dots.' };
        if (!r.slice) return { ok: false, msg: 'The slice is off, so every dot is showing: switch it on and look again.' };
        if (r.shown.length <= EMPTY_SLICE * r.fired) return { ok: true };
        return { ok: false, msg: 'That slice still holds dots: turn and tilt the view and watch how many are left in it.' };
      },
      reward: {
        log: 'Two lobes, and a flat plane with nothing in it.',
        title: 'p Orbital',
        body: 'A p orbital has two lobes with a node between them, a flat plane through the nucleus where the electron is never found. The round orbitals met so far are s orbitals, and the two-lobed ones are p orbitals.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const orbitals = ['2px', '2pz', '2py', '2pz'];
    const cards = orbitals.map((o, i) => cloudCard(`c${i + 1}`, `SAMPLE ${'CDEF'[i]}`, { x: 16 + i * 22, y: 12 }, o, { seed: i === 3 ? 3 : 1 }));
    const v = viewFixture('view', { x: 125, y: 17 });
    const peg = (axis, x) => ({ id: `peg-${axis}`, label: `Along ${axis}`, at: { x, y: 46 }, size: { w: 18, h: 18 } });
    return {
      title: 'Ways to Point',
      prompt: 'Put each cloud on the axis it lies along; a cloud that repeats a direction goes in the tray.',
      widget,
      table: cloudTable({
        pieces: cards,
        fixtures: [v],
        zones: {
          slots: [peg('x', 24), peg('y', 52), peg('z', 80)],
          trays: [tray('same', 'Same way as one on a peg', { x: 121, y: 47 }, { w: 42, h: 22 })]
        }
      }),
      hints: [
        'Turn and tilt the view and find the line each cloud\'s two lobes lie along.',
        'Compare the four clouds and note which of them point the same way as another.',
        'Put one cloud on each axis peg, and put any cloud that points the same way as one already on a peg in the tray.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['c1', 'c2', 'c3', 'c4'];
        const pegged = ['x', 'y', 'z'].map(a => ({ axis: a, id: ids.find(id => t.pieces[id].zone === `slot:peg-${a}`) }));
        if (pegged.some(p => !p.id) || !ids.every(id => t.pieces[id].zone)) return { ok: false, notYet: true, msg: 'Put each cloud on a peg or in the tray.' };
        for (const p of pegged) {
          if (axisOf(t.pieces[p.id].props.orbital) !== p.axis) return { ok: false, msg: 'A peg holds a cloud that lies along another axis: turn the view until its lobes line up with an axis.' };
        }
        const spare = ids.filter(id => !pegged.some(p => p.id === id));
        if (!spare.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'A cloud is still off the pegs and out of the tray.' };
        return { ok: true };
      },
      reward: {
        log: 'Along x, along y, along z. No more.',
        title: 'Three p Orbitals',
        body: 'The two-lobed shape can point along x, along y or along z, which makes three p orbitals of equal energy in every shell from the second up. With the single s orbital they make up the whole of the second shell.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const orbitals = ['3pz', '3dxy', '3dz2', '3dx2y2', '3dyz'];
    const cards = orbitals.map((o, i) => cloudCard(`k${'abcde'[i]}`, `SAMPLE ${'ABCDE'[i]}`, { x: 12 + i * 21, y: 11 }, o, { extent: 24 }));
    const v = viewFixture('view', { x: 128, y: 15 });
    return {
      title: 'Five Clouds',
      prompt: 'Put each cloud in the tray that names its shape.',
      widget,
      table: cloudTable({
        pieces: cards,
        fixtures: [v],
        zones: {
          trays: [
            tray('two', 'Two lobes', { x: 22, y: 38 }, { w: 38, h: 22 }),
            tray('four', 'Four lobes', { x: 72, y: 38 }, { w: 57, h: 22 }),
            tray('ring', 'Two lobes and a ring', { x: 123, y: 38 }, { w: 38, h: 22 })
          ]
        }
      }),
      hints: [
        'Turn and tilt the view to find the side from which each shape shows most clearly.',
        'Compare each cloud with the two-lobed shape you already know, and look for extra lobes or a ring.',
        'Count the lobes from the clearest side of each cloud, and look for a ring round the middle of the two-lobed one.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['ka', 'kb', 'kc', 'kd', 'ke'];
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put all five clouds in a tray.' };
        const name = { 'two lobes': 'two', 'four lobes': 'four', 'two lobes and a ring': 'ring' };
        for (const id of ids) {
          if (where(t, id) !== name[shapeOf(t.pieces[id].props.orbital)]) {
            return { ok: false, msg: 'Turn the clouds and count the lobes from the clearest side before you tray a cloud.' };
          }
        }
        return { ok: true };
      },
      reward: {
        log: 'Four lobes, four lobes, four lobes, and one with a ring.',
        title: 'd Orbitals',
        body: 'From the third shell up there are five d orbitals: four have four lobes, and one is a two-lobed shape with a ring round its middle. They matter most in the transition metals, which this world will reach before it ends.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const a = cloudPlate('a', 'SAMPLE A', { x: 34, y: 30 }, '1s');
    const gauge = blurGauge('blur', { x: 88, y: 24 });
    const track = tracker('track', { x: 90, y: 52 });
    const token = (id, label, y) => ({ id, label, at: { x: 128, y }, r: 7 });
    return {
      title: 'No Path',
      briefing: {
        speaker: SPEAKER,
        body: 'Like a long-exposure photograph of moths round a lantern, an orbital shows where an electron spends time, not a path. The precision dial sets how sharply the bench fixes where the electron is.'
      },
      prompt: 'Predict what happens to the speed blur when the position blur is made smaller, then test it.',
      widget,
      table: cloudTable({
        pieces: [],
        fixtures: [a.fixture, gauge, track],
        prediction: {
          slot: { id: 'predict', label: 'The speed blur', at: { x: 128, y: 10 }, size: { w: 24, h: 12 } },
          tokens: [token('grows', 'It grows', 26), token('shrinks', 'It shrinks', 40), token('stays', 'It stays', 54)]
        }
      }),
      hints: [
        'Place a prediction, then turn the precision dial and read the two blurs.',
        'Compare the position blur and the speed blur at the lowest and the highest precision.',
        'Turn the dial toward a sharper position and watch which way the speed blur moves, then press "Track Electron" and read why.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for the speed blur first.' };
        // Sharper position is the higher precision level; the speed blur at each level is the gauge's own.
        const dv = blurAt(5).dv - blurAt(1).dv;
        const real = dv > 0 ? 'grows' : dv < 0 ? 'shrinks' : 'stays';
        if (token === real) return { ok: true };
        return { ok: false, msg: 'Turn the precision dial toward a sharper position and read the speed blur before and after.' };
      },
      reward: {
        log: 'Fix where it is and its speed blurs.',
        title: 'Uncertainty Principle',
        body: 'The more exactly the bench fixes where an electron is, the less exactly it can know how fast it is going, and the other way round. This is the uncertainty principle, and it is why an electron is pictured as a cloud of probability and never as a path.',
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
      body: 'An electron has no path. What it has is an orbital, a cloud of probability whose shape is set by the energy it has: round for s, two-lobed for p, four-lobed or ringed for d. Each orbital holds a standing wave that fits its shell.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every bond in this universe is made of these clouds overlapping, and every shape a molecule takes follows from how they point. You will meet all of them again in the next world.'
    },
    {
      heading: 'Next',
      body: 'A cloud has a shape and a size. The next bench gives every electron an address, four numbers that say which cloud it is in and how it spins.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What does an orbital show?',
    options: [
      { id: 'a', label: 'The region where an electron is likely to be found' },
      { id: 'b', label: 'The exact path an electron follows' },
      { id: 'c', label: 'The size of the nucleus' },
      { id: 'd', label: 'The speed of an electron at an exact moment' }
    ],
    answer: 'a',
    explanation: 'An orbital is a map of probability: where the electron is likely to be found. The uncertainty principle means no exact path exists to draw.'
  },
  {
    question: 'Which orbital shape has two lobes and a node, a plane with no electron density, through the nucleus?',
    options: [
      { id: 'a', label: 'A p orbital' },
      { id: 'b', label: 'An s orbital' },
      { id: 'c', label: 'A d orbital with four lobes' },
      { id: 'd', label: 'A 1s orbital' }
    ],
    answer: 'a',
    explanation: 'A p orbital has two lobes either side of the nucleus and a flat node between them. An s orbital is spherical with no such plane.'
  },
  {
    question: 'How many p orbitals are there in the second shell?',
    options: [
      { id: 'a', label: 'One' },
      { id: 'b', label: 'Two' },
      { id: 'c', label: 'Three' },
      { id: 'd', label: 'Five' }
    ],
    answer: 'c',
    explanation: 'A p orbital can point along x, y or z, giving three of equal energy: 2px, 2py and 2pz.'
  },
  {
    question: 'The uncertainty principle says that:',
    options: [
      { id: 'a', label: 'An electron\'s position and speed cannot both be known exactly at once' },
      { id: 'b', label: 'An electron has no mass' },
      { id: 'c', label: 'Atoms cannot be measured' },
      { id: 'd', label: 'Electrons always travel in circles' }
    ],
    answer: 'a',
    explanation: 'Fixing an electron\'s position more exactly blurs its speed, and the other way round. That is why electrons are described by orbitals rather than by paths.'
  },
  {
    question: 'An electron behaves as a wave on a circular track only if:',
    options: [
      { id: 'a', label: 'A whole number of wavelengths fits round the track' },
      { id: 'b', label: 'Its wavelength equals the radius' },
      { id: 'c', label: 'It moves fast enough to complete one lap in a second' },
      { id: 'd', label: 'The track is exactly one nanometre long' }
    ],
    answer: 'a',
    explanation: 'A wave that does not fit a whole number of times meets itself out of step on the next lap and cancels. Only a standing wave survives, which is why electrons have only certain energies.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Shots are fired, rings and views set, films and strings put where they go. Nothing here says
   what a plate counts or a ring closes.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const fire = id => [dial(id, 'burst', 3), { run: id }];
const goes = (id, tray) => [put(id, 'slot:track.tile'), put(id, `tray:${tray}`)];

export const SOLUTIONS = [
  [...fire('a'), dial('a', 'ring', 140)],
  [...fire('a'), put('f2', 'slot:a.film')],
  [].concat(...RING_STRINGS.map(pm => goes(`s${pm}`, ringFits(pm, RING_CIRCUMFERENCE_PM).fits ? 'closes' : 'smears'))),
  [...fire('a'), dial('a', 'slice', 1), ...fire('b'), dial('b', 'slice', 1), dial('b', 'ring', 105)],
  [...fire('c'), dial('view', 'turn', 0), dial('view', 'tilt', 0), dial('view', 'slice', 1)],
  [put('c1', 'slot:peg-x'), put('c2', 'slot:peg-z'), put('c3', 'slot:peg-y'), put('c4', 'tray:same')],
  [put('ka', 'tray:two'), put('kb', 'tray:four'), put('kc', 'tray:ring'), put('kd', 'tray:four'), put('ke', 'tray:four')],
  [{ predict: 'grows' }, dial('blur', 'level', 5)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...fire('a'), dial('a', 'ring', 40)],
  [...fire('a'), put('f1', 'slot:a.film')],
  [].concat(...RING_STRINGS.map(pm => goes(`s${pm}`, 'closes'))),
  [...fire('b'), dial('b', 'ring', 60)],
  [...fire('c'), dial('view', 'slice', 1)],
  [put('c1', 'slot:peg-y'), put('c2', 'slot:peg-z'), put('c3', 'slot:peg-x'), put('c4', 'tray:same')],
  [put('ka', 'tray:four'), put('kb', 'tray:four'), put('kc', 'tray:four'), put('kd', 'tray:two'), put('ke', 'tray:four')],
  [{ predict: 'shrinks' }, dial('blur', 'level', 5)]
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
export { plateRead, ringRead, filmRead, trackRead, blurRead, blurAt, catchOf, axisOf, nodePm, shapeOf, FILMS, ringFits, RING_CIRCUMFERENCE_PM, BOHR_PM, SLICE_HALF, NODE_TOLERANCE_PM, NINE_IN_TEN, EMPTY_SLICE, RING_STRINGS };
