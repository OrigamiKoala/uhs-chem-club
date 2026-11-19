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

export const meta = { stageCount: 6 };

/** Specific phrases first, so "p orbital" is read as the phrase and not as a stray "orbital". */
export const VOCABULARY = [
  { term: /\bd orbitals?\b/i, introducedAt: 6 },
  { term: /\bp orbitals?\b/i, introducedAt: 5 },
  { term: /\bs orbitals?\b/i, introducedAt: 2 },
  { term: /\bnodes?\b/i, introducedAt: 5 },
  { term: /\bstanding waves?\b/i, introducedAt: 4 },
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
    const b = cloudPlate('b', 'SAMPLE B', { x: 40, y: 31 }, '2s', { extent: 10 });
    return {
      title: 'Particle and Wave',
      briefing: {
        speaker: SPEAKER,
        body: 'Fire single shots to watch individual electron hits, then switch the exposure up to 500 to see the overall pattern that builds up.'
      },
      prompt: 'From single hits and the 500-shot pattern, how does an electron behave?',
      widget,
      table: cloudTable({
        pieces: [
          { id: 'both', kind: 'tile', label: 'Both particle & wave', at: { x: 96, y: 28 }, props: { choice: 'both' } },
          { id: 'part', kind: 'tile', label: 'Only a particle', at: { x: 126, y: 28 }, props: { choice: 'part' } },
          { id: 'wave', kind: 'tile', label: 'Only a wave', at: { x: 111, y: 48 }, props: { choice: 'wave' } }
        ],
        fixtures: [b.fixture],
        zones: {
          slots: [{ id: 'ans', label: 'Answer', at: { x: 111, y: 8 }, size: { w: 28, h: 10 }, accepts: ['tile'] }]
        }
      }),
      hints: [
        'Press "Measure" at 1 shot to see a single dot land, then turn Exposure to 500 and press "Measure" again.',
        'Notice that each individual measurement is a single localized point, while hundreds of measurements form concentric wave-like rings.',
        'Drag the card that captures both single-hit particle behaviour and many-hit wave behaviour into the Answer slot.'
      ],
      check(state) {
        const t = state.table;
        const r = plateRead(t, 'b');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Take at least 500 measurements first so the overall ring pattern appears.' };
        const held = Object.values(t.pieces).find(p => p.zone === 'slot:ans');
        if (!held) return { ok: false, notYet: true, msg: 'Place one of the three cards in the Answer slot.' };
        if (held.id === 'both') return { ok: true };
        return { ok: false, msg: held.id === 'part' ? 'Each single hit is a point, yet hundreds of hits form wave-like rings with an empty gap between them.' : 'Hundreds of hits form a wave-like pattern, yet each single measurement lands as one discrete dot.' };
      },
      reward: {
        log: 'Single hits are dots; many hits form wave-like rings.',
        title: 'Wave-Particle Duality',
        body: 'Each measurement finds the electron at one point like a particle, yet the pattern of many measurements spreads in rings like a wave. Electrons act as both particles and waves.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const track = ringTrack('track', { x: 37, y: 40 });
    const tiles = RING_STRINGS.map((pm, i) => ringTile(`s${pm}`, { x: 20 + i * 22, y: 9 }, pm));
    return {
      title: 'Waves That Fit',
      briefing: {
        speaker: SPEAKER,
        body: 'Because an electron acts as a wave (measured in picometres, pm), a wave wrapping round a ring reinforces itself only when crests meet crests after each lap; otherwise crests meet troughs and it cancels out.'
      },
      prompt: 'Which wavelengths grow stronger on this ring and which grow weaker?',
      widget,
      table: cloudTable({
        pieces: tiles,
        fixtures: [track.fixture],
        zones: {
          slots: track.slots,
          trays: [tray('closes', 'Grows stronger', { x: 110, y: 31 }, { w: 66, h: 18 }, 20), tray('smears', 'Grows weaker', { x: 110, y: 55 }, { w: 66, h: 18 }, 20)]
        }
      }),
      hints: [
        'Drag a wave onto the ring track and watch whether the 3D wave grows taller or shrinks away.',
        'Compare wavelengths that divide the track circumference into a whole number of waves with those that do not.',
        'Waves that fit a whole number of times grow stronger; all others grow weaker and vanish.'
      ],
      check(state) {
        const t = state.table;
        const ids = RING_STRINGS.map(pm => `s${pm}`);
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put every wave in a tray.' };
        const wrong = RING_STRINGS.find(pm => where(t, `s${pm}`) !== (ringFits(pm, RING_CIRCUMFERENCE_PM).fits ? 'closes' : 'smears'));
        if (wrong === undefined) return { ok: true };
        return { ok: false, msg: `The ${wrong} pm wave is in a tray that disagrees with what happens on the track.` };
      },
      reward: {
        log: 'Only whole numbers of wavelengths grow stronger.',
        title: 'Standing Wave',
        body: 'Only a whole number of wavelengths fits the ring and reinforces into a standing wave; any other wavelength cancels itself out.',
        model: {
          type: 'standing-wave',
          caption: 'A wave that does not fit cancels out; a whole number of wavelengths reinforces into a standing wave.'
        }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const orbitals = ['1s', '2pz', '2s', '2px'];
    const cards = orbitals.map((o, i) => cloudCard(`sp${i + 1}`, `CLOUD ${'ABCD'[i]}`, { x: 15 + i * 24, y: 12 }, o, { extent: 12 }));
    const v = viewFixture('view', { x: 126, y: 15 });
    return {
      title: 's and p Orbitals',
      briefing: {
        speaker: SPEAKER,
        body: 'Not every orbital is round. While s orbitals are spherical, p orbitals have two opposite lobes separated by a flat empty plane (a node) through the nucleus.'
      },
      prompt: 'Rotate each cloud with the joystick, then sort the spherical s orbitals and two-lobed p orbitals.',
      widget,
      table: cloudTable({
        pieces: cards,
        fixtures: [v],
        zones: {
          trays: [
            tray('sorb', 's orbital (round)', { x: 40, y: 46 }, { w: 60, h: 20 }),
            tray('porb', 'p orbital (two lobes)', { x: 110, y: 46 }, { w: 60, h: 20 })
          ]
        }
      }),
      hints: [
        'Drag the joystick to turn all four clouds in 3D and check their shapes from multiple angles.',
        'An s orbital looks round from every angle; a p orbital shows two separate lobes with a gap through the middle.',
        'Sort the two round clouds into the s orbital tray and the two two-lobed clouds into the p orbital tray.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['sp1', 'sp2', 'sp3', 'sp4'];
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put all four clouds in a tray.' };
        const want = { sp1: 'sorb', sp2: 'porb', sp3: 'sorb', sp4: 'porb' };
        const wrong = ids.find(id => where(t, id) !== want[id]);
        if (!wrong) return { ok: true };
        return { ok: false, msg: `${t.pieces[wrong].label} has a different shape when rotated from the side.` };
      },
      reward: {
        log: 'Spherical s orbitals separated from two-lobed p orbitals.',
        title: 'p Orbitals and Nodes',
        body: 'A p orbital has two lobes on opposite sides of the nucleus with a flat plane between them where the electron is never found: a node.',
        model: { type: 'orbital', orbital: '2pz', dots: 260, slice: true, caption: 'A p orbital: two lobes with an empty nodal plane between them.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const orbitals = ['3pz', '3dxy', '3dz2', '3dx2y2', '3dyz'];
    const cards = orbitals.map((o, i) => cloudCard(`k${'abcde'[i]}`, `SAMPLE ${'ABCDE'[i]}`, { x: 12 + i * 21, y: 11 }, o, { extent: 24 }));
    const v = viewFixture('view', { x: 128, y: 15 });
    return {
      title: 'd Orbitals',
      briefing: {
        speaker: SPEAKER,
        body: 'Beyond s and p orbitals sit the five d orbitals: four of them have four lobes like a cloverleaf, and one has two lobes with a ring round its middle.'
      },
      prompt: 'Rotate the clouds to tell the p orbital apart from the four d orbitals by shape.',
      widget,
      table: cloudTable({
        pieces: cards,
        fixtures: [v],
        zones: {
          trays: [
            tray('two', 'p orbital (two lobes)', { x: 22, y: 43 }, { w: 38, h: 22 }),
            tray('four', 'd orbital (four lobes)', { x: 72, y: 43 }, { w: 57, h: 22 }),
            tray('ring', 'd orbital (lobes + ring)', { x: 123, y: 43 }, { w: 38, h: 22 })
          ]
        }
      }),
      hints: [
        'Turn all five clouds with the joystick, then drag each one into a tray.',
        'Compare each cloud with the two-lobed p orbital, and look for four lobes or a ring round the middle.',
        'One side can hide a lobe behind another, so decide from the angle that shows the most separate parts.'
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
        log: 'p orbital separated from four-lobed and ringed d orbitals.',
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
  3: ['Try 1 shot, then 500 shots, and place your answer card.'],
  4: ['Try a wave on the track.'],
  5: ['Drag the joystick to rotate the clouds, then sort them.'],
  6: ['Drag the joystick to rotate the clouds, then sort them.']
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
  [...fire('b'), put('both', 'slot:ans')],
  [].concat(...RING_STRINGS.map(pm => goes(`s${pm}`, ringFits(pm, RING_CIRCUMFERENCE_PM).fits ? 'closes' : 'smears'))),
  [put('sp1', 'tray:sorb'), put('sp2', 'tray:porb'), put('sp3', 'tray:sorb'), put('sp4', 'tray:porb')],
  [put('ka', 'tray:two'), put('kb', 'tray:four'), put('kc', 'tray:ring'), put('kd', 'tray:four'), put('ke', 'tray:four')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [...fire('a'), put('f1', 'slot:a.film')],
  [...fire('b'), put('part', 'slot:ans')],
  [].concat(...RING_STRINGS.map(pm => goes(`s${pm}`, 'closes'))),
  [put('sp1', 'tray:porb'), put('sp2', 'tray:porb'), put('sp3', 'tray:sorb'), put('sp4', 'tray:porb')],
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
