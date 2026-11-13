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
  { term: /\bs orbitals?\b/i, introducedAt: 2 },
  { term: /\bnodes?\b/i, introducedAt: 4 },
  { term: /\bstanding waves?\b/i, introducedAt: 3 },
  { term: /\borbitals?\b/i, introducedAt: 2 },
  { term: /\bprobabilit(?:y|ies)\b/i, introducedAt: 2 }
];

export const BUILDS_ON = ['unit02/q2-photon', 'unit02/q3-lines'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q4-cloud';
const GUESS_LABEL = { ring: 'On a ring', ball: 'In a ball', lobes: 'Two lobes' };

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
    title: 'Where Is the Electron?',
    // A PREDICT STAGE: the plate is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    briefing: {
      speaker: SPEAKER,
      body: 'A measurement can find where an atom\'s electron is at one moment, and a dot marks the place. Older pictures of the atom drew the electron circling the nucleus on a fixed ring.'
    },
    prompt: 'Hydrogen\'s electron is located five hundred times: where do the dots land?',
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
      'Drag one of the three cards into the slot.',
      'Think where the dots would land if the electron circled on a ring, and where they would land if it did not.',
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
      body: 'Next, a plate marks where hydrogen\'s electron is found, measurement after measurement.'
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
          ? `You predicted "${GUESS_LABEL[guess]}": in which region round the nucleus is hydrogen's electron found most often?`
          : 'In which region round the nucleus is hydrogen\'s electron found most often?';
      },
      widget,
      table: cloudTable({
        pieces: shapes.map((s, i) => filmPiece(`f${i + 1}`, `FILM ${'ABCD'[i]}`, { x: at[i][0], y: at[i][1] }, s)),
        fixtures: [a.fixture],
        zones: { slots: a.slots }
      }),
      hints: [
        'Press "Measure" until the plate holds a few hundred dots, then lay a film on it.',
        'Each film covers a region of the same area, so compare how many dots each one counts.',
        'The region where the dots lie thickest is where the electron is most likely to be found.'
      ],
      check(state) {
        const t = state.table;
        const f = filmRead(t, 'a');
        if (f.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Take more measurements first: a few dots do not show where most of them fall.' };
        if (!f.shape) return { ok: false, notYet: true, msg: 'Lay a film on the plate.' };
        const best = Math.max(...Object.keys(FILMS).map(k => catchOf(t, 'a', k)));
        if (f.caught === best) return { ok: true };
        return { ok: false, msg: `This film counts ${f.caught} of the ${f.fired} dots, and the dots lie thicker in another region.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'ball'
          ? 'Your prediction held. '
          : 'The dots did not agree with your prediction. ';
        return {
          log: 'A ball of dots, thickest in the middle.',
          title: 'Orbital',
          body: `${verdict}Each measurement finds the electron somewhere else, so only the probability of finding it in each place can be given. The region where it is likely to be found is called an orbital (this round one is an s orbital).`,
          model: { type: 'orbital', orbital: '1s', dots: 220, caption: 'Hydrogen\'s electron after many measurements: a ball of dots, thickest in the middle. No path can be drawn through it.' }
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
      briefing: {
        speaker: SPEAKER,
        body: 'An electron in an atom behaves as a wave, with wavelengths measured in picometres (pm, a trillionth of a metre). A wave running round a ring lasts only if, after each lap, its crests land on its own crests; otherwise crests land on troughs (the lows of the wave) and the wave cancels itself.'
      },
      prompt: 'Which wavelengths make a wave that lasts on this ring?',
      widget,
      table: cloudTable({
        pieces: tiles,
        fixtures: [track.fixture],
        zones: {
          slots: track.slots,
          trays: [tray('closes', 'Lasts', { x: 110, y: 31 }, { w: 66, h: 18 }, 20), tray('smears', 'Cancels itself', { x: 110, y: 55 }, { w: 66, h: 18 }, 20)]
        }
      }),
      hints: [
        'Drag a wave onto the ring track and watch what its laps do.',
        'Compare a wave whose laps all draw the same line with one whose laps spread into a band.',
        'Work out how many wavelengths of each wave go round the track, and see what the waves that last have in common.'
      ],
      check(state) {
        const t = state.table;
        const ids = RING_STRINGS.map(pm => `s${pm}`);
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put every wave in a tray.' };
        const wrong = RING_STRINGS.find(pm => where(t, `s${pm}`) !== (ringFits(pm, RING_CIRCUMFERENCE_PM).fits ? 'closes' : 'smears'));
        if (wrong === undefined) return { ok: true };
        return { ok: false, msg: `The ${wrong} pm wave is in a tray that disagrees with how its laps meet on the track.` };
      },
      reward: {
        log: 'Only whole numbers of wavelengths last.',
        title: 'Standing Wave',
        body: 'Only a whole number of wavelengths fits the ring; any other wave cancels itself. A wave that lasts like this is a standing wave.',
        model: {
          type: 'standing-wave',
          caption: 'A wave that does not fit: the second lap\'s crests land on the first lap\'s troughs and cancel. A wave that fits: crests land on crests, lap after lap.'
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
      briefing: {
        speaker: SPEAKER,
        body: 'Sample C holds another electron cloud. Measure dots, then turn the view with the joystick and switch on Slice to look through a thin slab.'
      },
      prompt: 'Where round the nucleus is this electron never found?',
      widget,
      table: cloudTable({ pieces: [], fixtures: [c.fixture, v] }),
      hints: [
        'Press "Measure" until the plate holds a few hundred dots, then turn the cloud with the joystick; the Slice switch keeps only a thin slab through the nucleus.',
        'Compare the cloud from several sides, and notice where the dots gather and where there are none.',
        'A slab through the nucleus that holds no dots is a place the electron is never found, so look for the view whose slice is empty.'
      ],
      check(state) {
        const t = state.table;
        const r = plateRead(t, 'c');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Take more measurements first: a few dots do not show where none fall.' };
        if (!r.slice) return { ok: false, msg: 'The slice is off, so every dot is showing.' };
        if (r.shown.length <= EMPTY_SLICE * r.fired) return { ok: true };
        return { ok: false, msg: `This slice through the nucleus still holds ${r.shown.length} dots, so the electron is found there.` };
      },
      reward: {
        log: 'Two lobes, and a flat plane with nothing in it.',
        title: 'p Orbital',
        body: 'The cloud has two lobes with a flat plane between them where the electron is never found: a node. This two-lobed orbital is a p orbital.',
        model: { type: 'orbital', orbital: '2pz', dots: 260, slice: true, caption: 'A p orbital: two lobes of dots with an empty plane, the node, between them.' }
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
      prompt: 'What shape is each of the five orbitals?',
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
        'Turn all five clouds with the joystick, then drag each one into a tray.',
        'Compare each cloud with the two-lobed p orbital, and look for extra lobes or a ring.',
        'One side can hide a lobe behind another, so decide from the view in which each cloud shows the most separate parts.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['ka', 'kb', 'kc', 'kd', 'ke'];
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put all five clouds in a tray.' };
        const name = { 'two lobes': 'two', 'four lobes': 'four', 'two lobes and a ring': 'ring' };
        const wrong = ids.find(id => where(t, id) !== name[shapeOf(t.pieces[id].props.orbital)]);
        if (!wrong) return { ok: true };
        return { ok: false, msg: `${t.pieces[wrong].label} shows a different number of lobes from another side than its tray names.` };
      },
      reward: {
        log: 'Four lobes, four lobes, and one with a ring.',
        title: 'd Orbitals',
        body: 'The two-lobed cloud is a p orbital. The other four—three with four lobes here, and one with two lobes and a ring round its middle—are d orbitals.',
        model: {
          type: 'd-orbitals',
          caption: 'The five d orbitals: four have four lobes, and one has two lobes with a ring round the middle.'
        },
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Lay a film on the plate to count the dots inside it.'],
  3: ['Try a wave on the track.'],
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
      body: 'An electron has no fixed path. It is found in an orbital, a region whose shape is round for s, two-lobed for p, and four-lobed or ringed for d. Each orbital is a standing wave of the electron.',
      orbitals: {
        types: ['s', 'p', 'd'],
        caption: 'The shapes of s, p and d orbitals.'
      }
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Atoms bond where their orbitals overlap, so the directions the orbitals point in set the shapes of molecules.'
    },
    {
      heading: 'Next',
      body: 'Next: three numbers that pick out each orbital, and how many electrons one orbital can hold.'
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
