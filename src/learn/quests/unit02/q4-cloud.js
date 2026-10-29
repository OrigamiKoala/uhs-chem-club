/**
 * q4-cloud.js — Lanternfall, bench four: ORBITALS.
 *
 * The particle probe, on the crawler's lab bench. Bench three ended on a ladder that breaks for helium, because an electron is
 * not a bead on a rung, and this is where it is. A probe finds the electron once per shot and leaves a dot; one shot is a dot
 * and five hundred are a shape, drawn from the real hydrogen-like |psi|^2 and reproducible shot for shot.
 *
 * The fourth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4b), on the cloud kit (`table/kits/cloud.js`), reworked on
 * 2026-10-23 around ONE CLICK. Each press of a plate's Run key drops a dot (the exposure dial says one shot, fifty or five hundred);
 * films of one area, laid on a plate, count what they catch; strings of different wavelengths are put round the ring track and
 * sorted by whether they close; clouds are turned and tilted from the one view the table shares and sorted by shape. At `3D On`
 * the dots are real beads standing at their depth, so a cloud is a solid you turn (`cloud.js` `pilesOf`).
 *
 * THE CLICK. Most players picture the electron as a planet on a circular path round the nucleus. So the guess is asked first, with no
 * probe on the table (a ring, a ball or two lobes), and then 500 shots are laid over four outlines of the same area, one of which
 * is the planet's ring. The ring catches the fewest. The picture is a ball, thickest in the middle, and no path can be drawn through it.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  PREDICT: where five hundred shots at hydrogen's electron will land (no probe)  -> a guess before the evidence
 *   2  TEST: four outlines of one area laid on the plate; which catches the most     -> probability, orbital
 *   3  strings sorted by whether they close on a ring                                 -> standing wave, wave-particle duality
 *   4  a cloud turned until a slice through it is empty                               -> node, p and s orbitals
 *   5  five clouds sorted by shape                                                    -> d orbitals
 *
 * Cut on 2026-10-23 (problems doc T6, T7): the counting-ring stage (probability is now earned by the film stage), the second cloud
 * with a node (the node is met in the p cloud), the three p orbitals (stage 5 sorts them with the d clouds) and the uncertainty
 * principle (AP depth; the `Track Electron` key and the blur gauge stay in the kit, unused).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  cloudTable, cloudPlate, viewFixture, ringTrack, cloudCard, ringTile, filmPiece,
  plateRead, ringRead, filmRead, trackRead, blurRead, blurAt, catchOf, axisOf, nodePm, shapeOf, FILMS, ringFits, RING_CIRCUMFERENCE_PM, BOHR_PM,
  SLICE_HALF
} from '../../table/kits/cloud.js';

export const meta = { stageCount: 5 };

/** Specific phrases first, so "p orbital" is read as the phrase and not as a stray "orbital". */
export const VOCABULARY = [
  { term: /\bd orbitals?\b/i, introducedAt: 5 },
  { term: /\bp orbitals?\b/i, introducedAt: 4 },
  { term: /\bs orbitals?\b/i, introducedAt: 4 },
  { term: /\bnodes?\b/i, introducedAt: 4 },
  { term: /\bwave.particle duality\b/i, introducedAt: 3 },
  { term: /\bstanding waves?\b/i, introducedAt: 3 },
  { term: /\borbitals?\b/i, introducedAt: 2 },
  { term: /\bprobabilit(?:y|ies)\b/i, introducedAt: 2 }
];

export const BUILDS_ON = ['unit02/q2-photon', 'unit02/q3-lines'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q4-cloud';
const GUESS_LABEL = { ring: 'On a ring', ball: 'In a ball', lobes: 'In two lobes' };

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

const ENOUGH_SHOTS = 200;

/** How much of the cloud a slice may leave on the plate and still be "almost nothing". */
const EMPTY_SLICE = 0.06;

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Electron Location',
    // A PREDICT STAGE: the probe is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'A probe finds hydrogen\'s electron five hundred times: where do you think the dots land?',
    widget,
    table: cloudTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'ring', label: 'On a ring', at: { x: 38, y: 48 }, r: 7 },
          { id: 'ball', label: 'In a ball', at: { x: 75, y: 48 }, r: 7 },
          { id: 'lobes', label: 'Two lobes', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three guesses into the slot.',
      'Picture the electron as you first met it, on the ladder and in the pictures of atoms, and ask where a camera left open would catch it.',
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
      body: 'Early atomic models placed electrons on circular tracks. Next, repeated measurements test whether electrons follow fixed orbits or form probability clouds.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const a = cloudPlate('a', 'BEACON ATOM', { x: 36, y: 31 }, '1s', { film: true });
    const at = [[98, 16], [124, 16], [98, 44], [124, 44]];
    const shapes = ['ring', 'disc', 'hollow', 'lobes'];
    return {
      title: 'Measuring the Cloud',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": which film catches the most of the atom's electron dots?`
          : 'Which film catches the most of the atom\'s electron dots?';
      },
      widget,
      table: cloudTable({
        pieces: shapes.map((s, i) => filmPiece(`f${i + 1}`, `FILM ${'ABCD'[i]}`, { x: at[i][0], y: at[i][1] }, s)),
        fixtures: [a.fixture],
        zones: { slots: a.slots }
      }),
      hints: [
        'Use "Fire" with Number of shots at 500, then lay a film on the plate.',
        'Compare the count each film catches, and look at where on the plate the dots lie thickest.',
        'Lay each of the four films in turn, note its count, and keep the film that catches the most.'
      ],
      check(state) {
        const t = state.table;
        const f = filmRead(t, 'a');
        if (f.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Fire more shots first: a film cannot be judged from a few dots.' };
        if (!f.shape) return { ok: false, notYet: true, msg: 'Lay a film on the plate.' };
        const best = Math.max(...Object.keys(FILMS).map(k => catchOf(t, 'a', k)));
        if (f.caught === best) return { ok: true };
        return { ok: false, msg: 'Another film catches more of the dots than this one.' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'ball'
          ? 'You predicted a ball, and the dots agreed. '
          : 'The dots did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'A fuzzy ball, densest in the middle.',
          title: 'Orbital',
          body: `${verdict}One shot finds the electron in one place and the next finds it somewhere else, so all that can be said is the probability of finding it in each place. A region like this one, round and densest at the middle, is called an orbital.`,
          model: { type: 'orbital', orbital: '1s', dots: 220, caption: 'Hydrogen\'s electron after many shots: a ball of dots, thickest in the middle. No path can be drawn through it.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const track = ringTrack('track', { x: 37, y: 40 });
    const tiles = RING_STRINGS.map((pm, i) => ringTile(`s${pm}`, { x: 20 + i * 22, y: 9 }, pm));
    return {
      title: 'Waves That Fit',
      prompt: 'Sort the six strings by whether they close into one clean ring on the track.',
      widget,
      table: cloudTable({
        pieces: tiles,
        fixtures: [track.fixture],
        zones: {
          slots: track.slots,
          trays: [tray('closes', 'Closes into one ring', { x: 110, y: 31 }, { w: 66, h: 18 }, 20), tray('smears', 'Smears into a band', { x: 110, y: 55 }, { w: 66, h: 18 }, 20)]
        }
      }),
      hints: [
        'Use the track: drag a string onto it and look at what the laps do.',
        'Compare a string whose laps draw one clean ring with one whose laps smear into a band.',
        'A string closes only if a whole number of its wavelengths go round the track, so divide the track length by each wavelength.'
      ],
      check(state) {
        const t = state.table;
        const ids = RING_STRINGS.map(pm => `s${pm}`);
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put every string in a tray.' };
        const wrong = RING_STRINGS.find(pm => where(t, `s${pm}`) !== (ringFits(pm, RING_CIRCUMFERENCE_PM).fits ? 'closes' : 'smears'));
        if (wrong === undefined) return { ok: true };
        return { ok: false, msg: `The ${wrong} pm string is in a tray that disagrees with how its laps meet on the track.` };
      },
      reward: {
        log: 'Only whole numbers of waves survive the lap.',
        title: 'Standing Wave',
        body: 'A wave on a ring survives only if a whole number of wavelengths fits, because non-integer laps meet out of phase and crests cancel troughs to zero. Whole numbers meet peak to peak, reinforcing into a permanent standing wave. Electrons follow this same rule: wave-particle duality.',
        model: {
          type: 'standing-wave',
          caption: 'Why non-integers cancel: Lap 1 meets Lap 2 out of phase (crest cancels trough → zero). Whole numbers meet peak to peak, reinforcing into a permanent standing wave.'
        }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const c = cloudPlate('c', 'SAMPLE C', { x: 36, y: 31 }, '2pz', { view: 'view', extent: 12 });
    const v = viewFixture('view', { x: 104, y: 22 }, { slice: true });
    return {
      title: 'Two Lobes',
      prompt: 'Find the view in which a slice through the middle of Sample C shows almost no dots.',
      widget,
      table: cloudTable({ pieces: [], fixtures: [c.fixture, v] }),
      hints: [
        'Use "Fire" at 500 shots, then move the joystick and use the Slice switch.',
        'Compare the sides you look from, noting the direction in which the dots gather and the flat plane they never cross.',
        'Move the joystick to turn and tilt the cloud until you look along the gap between its lobes, then switch Slice on and see whether the middle goes empty.'
      ],
      check(state) {
        const t = state.table;
        const r = plateRead(t, 'c');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Fire more shots first: an empty slice cannot be found among a few dots.' };
        if (!r.slice) return { ok: false, msg: 'The slice is off, so every dot is showing.' };
        if (r.shown.length <= EMPTY_SLICE * r.fired) return { ok: true };
        return { ok: false, msg: 'That slice still holds dots.' };
      },
      reward: {
        log: 'Two lobes, and a flat plane with nothing in it.',
        title: 'p Orbital',
        body: 'A p orbital has two lobes with a node between them, a flat plane through the nucleus where the electron is never found. The round orbitals met so far are s orbitals, and the two-lobed ones are p orbitals.',
        model: { type: 'orbital', orbital: '2pz', dots: 260, slice: true, caption: 'A p cloud: two lobes of dots with an empty nodal plane between them.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
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
            tray('two', 'Two lobes', { x: 22, y: 43 }, { w: 38, h: 22 }),
            tray('four', 'Four lobes', { x: 72, y: 43 }, { w: 57, h: 22 }),
            tray('ring', 'Two lobes and a ring', { x: 123, y: 43 }, { w: 38, h: 22 })
          ]
        }
      }),
      hints: [
        'Move the joystick to view the clouds from different sides, then drag each cloud into a tray.',
        'Compare each cloud with the two-lobed shape you already know, and look for extra lobes or a ring.',
        'Count the lobes from the clearest side of each cloud, and look for a ring round the middle of the two-lobed one.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['ka', 'kb', 'kc', 'kd', 'ke'];
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put all five clouds in a tray.' };
        const name = { 'two lobes': 'two', 'four lobes': 'four', 'two lobes and a ring': 'ring' };
        const wrong = ids.find(id => where(t, id) !== name[shapeOf(t.pieces[id].props.orbital)]);
        if (!wrong) return { ok: true };
        return { ok: false, msg: `${t.pieces[wrong].label} is in a tray that does not match the lobes it shows from its clearest side.` };
      },
      reward: {
        log: 'Four lobes, four lobes, and one with a ring.',
        title: 'd Orbitals',
        body: 'From the third shell up there are five d orbitals: four have four lobes, and one is a two-lobed shape with a ring round its middle. They matter most in the transition metals, which this world will reach before it ends.',
        model: {
          type: 'd-orbitals',
          caption: 'The five d orbitals: four have four lobes, and one has two lobes with a center ring.'
        },
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Lay a film on the plate to count the dots it catches.'],
  3: ['Try a string on the track.'],
  4: ['Move the joystick to view the cloud from another side.'],
  5: ['Move the joystick to view the clouds from different sides, then drag each cloud into a tray.']
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
      body: 'An electron has no fixed orbit. It occupies an orbital, a probability cloud whose shape depends on energy: spherical for s, two-lobed for p, and multi-lobed or ringed for d. Each orbital represents a standing electron wave.',
      orbitals: {
        types: ['s', 'p', 'd'],
        caption: 'Fundamental orbital boundary surfaces: spherical s, two-lobed p, and multi-lobed d orbitals.'
      }
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Chemical bonds form when these atomic orbitals overlap, and molecular geometry follows directly from how the orbitals point in space.'
    },
    {
      heading: 'Next',
      body: 'Each orbital has a specific size, shape, and orientation. The next bench assigns each electron four quantum numbers that define its state and spin.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Shots are fired, views set, films and strings put where they go. Nothing here says
   what a plate counts or a ring closes.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const fire = id => [dial(id, 'burst', 3), { run: id }];
const goes = (id, tray) => [put(id, 'slot:track.tile'), put(id, `tray:${tray}`)];

export const SOLUTIONS = [
  [{ predict: 'ball' }],
  [...fire('a'), put('f2', 'slot:a.film')],
  [].concat(...RING_STRINGS.map(pm => goes(`s${pm}`, ringFits(pm, RING_CIRCUMFERENCE_PM).fits ? 'closes' : 'smears'))),
  [...fire('c'), dial('view', 'turn', 0), dial('view', 'tilt', 0), dial('view', 'slice', 1)],
  [put('ka', 'tray:two'), put('kb', 'tray:four'), put('kc', 'tray:ring'), put('kd', 'tray:four'), put('ke', 'tray:four')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [...fire('a'), put('f1', 'slot:a.film')],
  [].concat(...RING_STRINGS.map(pm => goes(`s${pm}`, 'closes'))),
  [...fire('c'), dial('view', 'slice', 1)],
  [put('ka', 'tray:four'), put('kb', 'tray:four'), put('kc', 'tray:four'), put('kd', 'tray:two'), put('ke', 'tray:four')]
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
export { plateRead, ringRead, filmRead, trackRead, blurRead, blurAt, catchOf, axisOf, nodePm, shapeOf, FILMS, ringFits, RING_CIRCUMFERENCE_PM, BOHR_PM, SLICE_HALF, EMPTY_SLICE, RING_STRINGS, QUEST_KEY };
