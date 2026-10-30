/**
 * The second game on the Learn road, and the second on the TABLETOP (plan
 * `bench-tabletop.md`, phase T1). Eight stages in the instrument room under the
 * evaporators: a beam and a detector you place yourself, a handful of particles to
 * pick out, an atom you load with electrons while a charge needle reads it live, a
 * tester you drop a sample into, and trays to sort into. A stage is graded on what is
 * on the table when Commit is pressed.
 *
 * THE ORDER IS THE WHOLE DESIGN. Every stage is a thing the player does with their
 * hands, and the concept arrives immediately afterwards as a reward card, connecting
 * the player's observation to the real chemistry:
 *
 *   1  PREDICT: lay the model of the atom you would bet on (no instrument yet) -> A Model Is a Guess
 *   2  TEST: fire a beam at a foil; detectors keep every hit -> The Nucleus · Mostly Empty Space
 *   3  send specks between charged plates and sort by what bends -> Protons & Neutrons
 *   4  load electrons until the needle rests on zero    -> Electrons & Electrical Neutrality
 *   5  load electrons onto shells                       -> Electron Shells & The Bohr Model
 *   6  test samples and tray them by what they do       -> Valence Electrons & Reactivity
 *   7  tray two specimens of equal weight               -> Atomic Number & Isotopes
 *   8  tray unknown specimens against a reference       -> Three Ways to Differ (isotope, ion, element)
 *
 * (A stage that pulled electrons off Sample A to a needle of +2 repeated the lesson of `q4-ledger` stage 5 and was cut; the word
 * "ion" is now earned by the reward card of the last stage.)
 *   -- debrief: subatomic model summary & preview of the periodic table.
 *
 * WORDS ARE FREE, PHENOMENA ARE DISCOVERED. Real words (proton, neutron, electron,
 * nucleus, shell) are used in play from the moment they help, and stage 3's card names
 * all three particles at once. The one exception is the particles themselves on stage 3,
 * which keep neutral labels (marked, blank) because telling those two apart IS the
 * discovery there; from stage 4 they are proton, neutron and electron outright.
 *
 * THE TABLE (`table/`, `kits/atoms.js`). The beam's counts are `corebench.js` `planBeam`,
 * the needle is protons against electrons on the table, the tester is the kit's model of
 * a ring with a spare or one short. A tray that holds more than it should prints the
 * stencilled `!` lamp. No stage declares an outcome; `SOLUTIONS` and `MISSES` are
 * scripts of the player's own actions, replayed by `verify:table`.
 *
 * WHAT THIS QUEST DOES NOT SAY. The core bench does not talk to the sampler scope's
 * catalogue. The player will finish this site holding a proton count for a dozen specimens
 * and no idea that the scope has been filing by exactly that number since site one. That
 * reveal belongs to `q3-catalogue`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It reports
 * through `ctx` and nothing else.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { atomTable, piecesIn, needleReading, behaviourOf } from '../../table/kits/atoms.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned.
 *
 * `introducedAt` is the stage whose REWARD CARD first names the term. That card may use it;
 * play copy may use it from the NEXT stage on. `verify:learn` reads this table; nothing
 * here is player-facing.
 */
export const VOCABULARY = [
  { term: /\bnucle(us|i|ar)\b/i, introducedAt: 2 },
  { term: /\bprotons?\b/i, introducedAt: 3 },
  { term: /\bneutrons?\b/i, introducedAt: 3 },
  { term: /\belectrons?\b/i, introducedAt: 3 },
  { term: /\bshells?\b/i, introducedAt: 5 },
  { term: /\bvalence\b/i, introducedAt: 6 },
  { term: /\bisotopes?\b/i, introducedAt: 7 },
  { term: /\bions?\b/i, introducedAt: 8 }
];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and what each model card is called in the prompt. */
const QUEST_KEY = 'unit01/q2-core';
const MODEL_LABEL = { solid: 'Solid all through', even: 'Soft and even', core: 'Tiny dense center' };

/**
 * The legend lines. The keys of this table are pieces dragged and two keys pressed ("Fire Beam",
 * "Run Tester"), and a key whose label says what it does owes nothing. Kept so the quest
 * contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PARTS
   Three sorts of thing a needle can be put on. The codes are the instrument's own, the
   readings are real, and none of them is named until stage 2's card names them. The sealed
   bench's boss (`boss-hopper`) reads this table for its probe.
   ------------------------------------------------------------------ */
export const PARTS = {
  marked: {
    code: '+ SPECK', mass: 1.0, charge: 1,
    note: 'Heavy, and it pushes the needle up every time.'
  },
  blank: {
    code: 'BLANK SPECK', mass: 1.0, charge: 0,
    note: 'Same size and weight as a + particle, but the needle does not move for it at all.'
  },
  light: {
    code: 'OUTER SPECK', mass: 0.0005, charge: -1,
    note: 'Almost weightless, and it pushes the needle the opposite way to a + particle.'
  },
  core: {
    code: 'MIDDLE // WHOLE', mass: null, charge: null,
    note: 'The whole center at once, packed too tight to separate from here.'
  },
  whole: {
    code: 'WHOLE ATOM', mass: null, charge: null,
    note: 'The whole atom, edge to edge. Almost all of that width is empty.'
  }
};

export { behaviourOf };

/* ------------------------------------------------------------------
   THE TABLES
   One layout (120 x 64 units): the work along the top, the trays and the needle in the
   middle, the scratch corner bottom left.
   ------------------------------------------------------------------ */

const NAMES = { proton: 'Proton', neutron: 'Neutron', electron: 'Electron' };
const SPECK = { proton: 'Marked', neutron: 'Blank', electron: 'Outer' };

/** The nine specks of stage 3, in the order they lie: the charge each carries (+1 or none). */
const SPECK_ORDER = [1, 0, 0, 1, 0, 1, 0, 0, 1];

const part = (id, kind, x, y, named = true, zone = null, props = null) => ({
  id, kind, label: (named ? NAMES : SPECK)[kind], at: { x, y }, ...(zone ? { zone } : {}), ...(props ? { props } : {})
});

/** `n` electrons ids `${prefix}1..n` stacked into a zone (the zone lays them out). */
const electrons = (prefix, n, zone, from = 1) =>
  Array.from({ length: n }, (_, i) => part(`${prefix}${from + i}`, 'electron', 0, 0, true, zone));

const trayAt = (id, label, x, y, w, h, cap) => ({ id, label, at: { x, y }, size: { w, h }, ...(cap != null ? { cap } : {}) });
/** A round place round a fixed middle: pieces dropped in it snap onto these rings, closest in first. */
const orbitAt = (id, x, y, w, h, rings, radii) => ({ ...trayAt(id, '', x, y, w, h), orbit: { rings, radii } });
/** An individual shell orbit tray: concentric ring round a middle. */
const shellOrbit = (id, x, y, radius, cap, ringIndex) => ({
  ...trayAt(id, '', x, y, radius * 2, radius * 2, cap),
  orbit: { rings: [cap], radii: [radius], ringIndex }
});
/** A tray for specimens: wide pieces, so a wider pitch and a deeper tray. */
const specimenTray = (id, label, x, y = 38, w = 38, h = 20) => ({ id, label, at: { x, y }, size: { w, h }, cell: 19 });

const specimen = (id, label, x, y, props) => ({ id, kind: 'specimen', label, at: { x, y }, props });
const nucleus = (id, label, x, y, p, n) => ({ id, kind: 'nucleus', label, at: { x, y }, fixed: true, props: { p, n } });

/** The shell trays of an atom with a nucleus at the top left: one per shell, closest in first. */
const SHELLS = [
  trayAt('sh1', 'Shell 1', 14, 46, 20, 16, 2),
  trayAt('sh2', 'Shell 2', 48, 46, 40, 20, 8),
  trayAt('sh3', 'Shell 3', 98, 54, 40, 20, 8)
];
const SOURCE_TRAY = (label, n) => trayAt('src', label, 98, 24, 40, 30, n);

const needleFixture = (zones, nuc, at, range, size = { w: 40, h: 16 }) => ({
  id: 'needle', kind: 'needle', label: 'Charge', at, size, noRun: true, props: { zones, nucleus: nuc, range }
});

const inZone = (t, zone, kind) => piecesIn(t, zone, kind).length;
const placedOn = (t, zones) => zones.reduce((n, z) => n + inZone(t, z, 'electron'), 0);

/** The beam's three detectors (fixed pieces), with the angle each one sits at from the beam's line. */
const BEAM_DETECTORS = { detAhead: 0, detSide: 35, detBack: 180 };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Predict the Atom',
    // A PREDICT STAGE: the instrument is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which model of the atom do you think is right?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        // The wrong model most players arrive with is a soft atom with its + spread evenly through it, so it is a card.
        { id: 'solid', kind: 'model', label: 'Solid all through', at: { x: 22, y: 20 }, props: { model: 'solid' } },
        { id: 'even', kind: 'model', label: 'Soft and even', at: { x: 52, y: 20 }, props: { model: 'spread' } },
        { id: 'core', kind: 'model', label: 'Tiny dense center', at: { x: 82, y: 20 }, props: { model: 'core' } }
      ],
      zones: {
        slots: [{ id: 'model', label: 'My prediction', at: { x: 52, y: 44 }, size: { w: 28, h: 18 } }]
      }
    }),
    hints: [
      'Use the three model cards and the slot.',
      'Picture a stream of small shots fired at each model, and what each would do to them.',
      'There is no wrong guess yet; commit to the model you would bet on.'
    ],
    check(state) {
      const model = piecesIn(state.table, 'slot:model')[0];
      if (!model) return { ok: false, notYet: true, msg: 'Lay a model card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const model = piecesIn(state.table, 'slot:model')[0];
      if (model) remember(QUEST_KEY, model.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'A Model Is a Guess',
      body: 'A model is a picture of how something might be built, and a good one says what an experiment will show. Next, a beam of shots will test yours.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Fire Through It',
    // The guess comes back here, locked in: it is the first thing the player reads about the test.
    get prompt() {
      const guess = recall(QUEST_KEY);
      return guess && MODEL_LABEL[guess]
        ? `You predicted "${MODEL_LABEL[guess]}": which model fits where the shots go?`
        : 'Which model of the atom fits where the shots go?';
    },
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        // Three detectors, one at every angle the beam is read at: nothing to carry about the table.
        { id: 'detBack', kind: 'detector', label: 'Back', at: { x: 28, y: 36 }, fixed: true },
        { id: 'detSide', kind: 'detector', label: 'Side', at: { x: 62, y: 15 }, fixed: true },
        { id: 'detAhead', kind: 'detector', label: 'Ahead', at: { x: 64, y: 29 }, fixed: true },
        { id: 'solid', kind: 'model', label: 'Solid all through', at: { x: 16, y: 54 }, props: { model: 'solid' } },
        { id: 'even', kind: 'model', label: 'Soft and even', at: { x: 40, y: 54 }, props: { model: 'spread' } },
        { id: 'core', kind: 'model', label: 'Tiny dense center', at: { x: 64, y: 54 }, props: { model: 'core' } }
      ],
      zones: {
        slots: [{ id: 'model', label: 'Fits the shots', at: { x: 98, y: 40 }, size: { w: 28, h: 20 } }]
      },
      fixtures: [{
        id: 'beam', kind: 'beam', label: 'Beam and foil', runLabel: 'Fire Beam', at: { x: 38, y: 26 }, size: { w: 68, h: 38 },
        props: { specimen: 'a', detectors: BEAM_DETECTORS, quiet: true, source: { x: 10, y: 26 }, foil: { x: 46, y: 26 } }
      }]
    }),
    hints: [
      'Use "Fire Beam", and fire it more than once.',
      'After each firing, compare the Ahead and Side counts with the Back count.',
      'Ask which build of an atom lets nearly every shot pass yet sends a rare shot straight back, then lay that card in the slot.'
    ],
    check(state) {
      const t = state.table;
      const model = piecesIn(t, 'slot:model')[0];
      if (!model) return { ok: false, notYet: true, msg: 'Lay a model card in the slot.' };
      if (model.id === 'core') return { ok: true };
      if (model.id === 'solid') return { ok: false, msg: 'A solid atom would have stopped the shots. Most of them went straight on.' };
      return { ok: false, msg: 'A soft, even atom would have nudged every shot a little and sent none back. One shot came straight back.' };
    },
    // The verdict on the guess opens the card; the card never says the guess was wrong in a way that costs anything.
    get reward() {
      const guess = recall(QUEST_KEY);
      const verdict = !guess || !MODEL_LABEL[guess] ? '' : guess === 'core'
        ? 'You predicted this one, and the beam agreed. '
        : 'The beam did not agree with your prediction, which is how a model gets better. ';
      return {
        log: 'Per 40 shots: most through, 2 turned aside, 1 straight back.',
        title: 'The Nucleus',
        body: `${verdict}An atom is almost entirely empty space, with nearly everything it weighs packed into a tiny lump at its center called the nucleus.`,
        model: { type: 'atom', p: 6, n: 6, caption: 'A carbon atom, not to scale: the real nucleus is far smaller than the space round it.' }
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Which Ones Bend?',
    prompt: 'Sort the specks by what the charged plates do to them.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: SPECK_ORDER.map((charge, i) => ({ id: `sp${i + 1}`, kind: 'speck', label: 'Speck', at: { x: 14 + i * 11, y: 7 }, props: { charge } })),
      zones: {
        trays: [
          trayAt('bed', 'Bed', 60, 29, 50, 10),
          trayAt('bends', 'Bends', 29, 57, 50, 12),
          trayAt('straight', 'Goes straight', 91, 57, 50, 12)
        ]
      },
      fixtures: [{
        id: 'field', kind: 'field', label: 'Charged plates', runLabel: 'Switch On', at: { x: 60, y: 30 }, size: { w: 84, h: 34 },
        props: { backdrop: true, bed: 'tray:bed' }
      }]
    }),
    hints: [
      'Use the bed, "Switch On" and the two trays.',
      'Put the specks in the bed, switch the plates on, and compare what happens to each one.',
      'Sort the specks by what the plates did to them, not by how they look: they all look the same.'
    ],
    check(state) {
      const t = state.table;
      const specks = Object.values(t.pieces).filter(p => p.kind === 'speck');
      if (specks.some(p => !p.props.deflect)) return { ok: false, notYet: true, msg: 'A speck has not been through the plates yet.' };
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      if (specks.some(p => !['bends', 'straight'].includes(where(p.id)))) return { ok: false, notYet: true, msg: 'Every speck needs a tray.' };
      if (specks.some(p => p.props.deflect === 'straight' && where(p.id) === 'bends')) return { ok: false, msg: 'The "Bends" tray holds a speck that went straight.' };
      if (specks.some(p => p.props.deflect === 'bent' && where(p.id) === 'straight')) return { ok: false, msg: 'The "Goes straight" tray holds a speck that bent.' };
      return { ok: true };
    },
    reward: {
      log: 'Four specks bent, five went straight.',
      model: { type: 'atom', p: 4, n: 5, focus: 'nucleus', caption: 'The middle of a beryllium atom: 4 protons (amber) and 5 neutrons (grey).' },
      title: 'Protons, Neutrons and Electrons',
      body: 'The specks that bent carry a + charge: they are protons, each +1, and the ones that went straight are neutrons, with no charge at all. Much further out, so light they barely weigh anything, sit the electrons, each with a charge of −1.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Charge Balance',
    prompt: 'Make Sample D electrically neutral.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      // Sample D stands in the middle of the bench, the electrons wait along the top, and the needle reads from the
      // bottom left. Electrons are dragged straight onto the atom and come to rest on rings round its middle; the
      // rings are not named here (that is stage 5's discovery), they are only where an electron comes to rest.
      pieces: [
        nucleus('nuc', 'SAMPLE D', 60, 36, 8, 8),
        ...electrons('e', 10, 'tray:src')
      ],
      zones: {
        trays: [
          trayAt('src', 'Electrons', 60, 10.5, 102, 11, 10),
          orbitAt('atom', 60, 36, 44, 44, [2, 8], [12, 17])
        ]
      },
      fixtures: [needleFixture(['tray:atom'], 'nuc', { x: 18, y: 50 }, 10, { w: 30, h: 18 })]
    }),
    hints: [
      'Drag electrons from the tray onto Sample D, and watch the needle.',
      'Each electron you add moves the needle one step, and neutral means the needle rests at zero.',
      'Keep adding electrons until the needle sits on zero, then count what you have placed against what the middle holds.'
    ],
    check(state) {
      const q = needleReading(state.table, 'needle');
      if (q === 0) return { ok: true };
      if (q > 0) return { ok: false, msg: 'The needle still leans plus.' };
      return { ok: false, msg: 'The needle leans minus.' };
    },
    reward: {
      log: 'Sample D carries 8 electrons.',
      title: 'Neutral Atoms Balance',
      body: 'The needle reads the total charge on the atom: a neutral atom has a charge of 0, with equal numbers of protons and electrons.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Where the Electrons Sit',
    prompt: 'Place all 11 electrons of Sample D into their shells.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE D', 60, 39, 11, 12),
        { ...specimen('r1', 'SAMPLE A', 16, 26, { p: 2, n: 2, rings: [2], maxRings: 3 }), fixed: true },
        { ...specimen('r2', 'SAMPLE B', 16, 48, { p: 10, n: 10, rings: [2, 8], maxRings: 3 }), fixed: true },
        { ...specimen('r3', 'SAMPLE C', 104, 38, { p: 13, n: 14, rings: [2, 8, 3], maxRings: 3 }), fixed: true },
        ...electrons('e', 11, 'tray:src')
      ],
      zones: {
        trays: [
          trayAt('src', 'Electrons', 60, 10.5, 112, 11, 11),
          shellOrbit('sh1', 60, 39, 12, 2, 0),
          shellOrbit('sh2', 60, 39, 17, 8, 1),
          shellOrbit('sh3', 60, 39, 22, 8, 2)
        ]
      }
    }),
    hints: [
      'Drag electrons from the tray onto the shells around Sample D.',
      'No sample here holds more than 2 on the first shell or more than 8 on the second, and none of them starts a new shell while a closer one still has room.',
      'Put electrons on the first shell until it holds as many as the first shell does on the open samples, fill the second shell the same way, and only then put what is left on the third shell.'
    ],
    check(state) {
      const t = state.table;
      const rings = ['tray:sh1', 'tray:sh2', 'tray:sh3'].map(z => inZone(t, z, 'electron'));
      const placed = rings.reduce((n, r) => n + r, 0);
      if (placed !== 11) {
        return { ok: false, notYet: true, msg: `${placed} of the 11 electrons are on a shell. Drag the rest from the tray.` };
      }
      if (rings[0] > 2) {
        return { ok: false, msg: 'The first shell holds more than the first shell of any open sample.' };
      }
      if (rings[1] > 8) {
        return { ok: false, msg: 'The second shell holds more than the second shell of any open sample.' };
      }
      if (rings[0] < 2 || (rings[2] > 0 && rings[1] < 8)) {
        return { ok: false, msg: 'A shell further out has electrons while a closer one has room, which no open sample shows.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample D loaded 2 / 8 / 1.',
      model: { type: 'atom', p: 11, n: 12, caption: 'A sodium atom: 11 electrons on shells of 2, 8 and 1. Not to scale.' },
      title: 'Electron Shells',
      body: 'Each shell holds a fixed number: 2 in the first, 8 in the second and third. A shell fills up before the next one starts, which is why 11 electrons come out as 2, 8 and 1.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'The Outer Shell Decides',
    prompt: 'Sort the two cased samples by whether they give, take, or keep their electrons.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        specimen('s1', 'SAMPLE A', 12, 12, { p: 3, n: 4, rings: [2, 1] }),
        specimen('s2', 'SAMPLE B', 32, 12, { p: 17, n: 18, rings: [2, 8, 7] }),
        specimen('s3', 'SAMPLE C', 52, 12, { p: 10, n: 10, rings: [2, 8] }),
        specimen('s4', 'SAMPLE D', 72, 12, { p: 19, n: 20, rings: [2, 8, 8, 1], casing: true }),
        specimen('s5', 'SAMPLE E', 92, 12, { p: 9, n: 10, rings: [2, 7], casing: true })
      ],
      zones: {
        slots: [{ id: 'tester', label: 'Sample', at: { x: 66, y: 53 } }],
        trays: [
          specimenTray('gives', 'Gives one away', 21, 38, 38, 14),
          specimenTray('takes', 'Takes one on', 60, 38, 38, 14),
          specimenTray('inert', 'Will not trade', 99, 38, 38, 14)
        ]
      },
      fixtures: [{ id: 'tester', kind: 'tester', label: 'Tester', runLabel: 'Run Tester', at: { x: 96, y: 54 }, size: { w: 40, h: 16 }, props: { slot: 'tester' } }]
    }),
    hints: [
      'Use the tester slot and "Run Tester".',
      'Test the open samples first and compare what each one does with its outer ring.',
      'Compare what each cased sample does with the open samples to work out how its outer shell behaves.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const d = where('s4');
      const e = where('s5');
      if (!['gives', 'takes', 'inert'].includes(d) || !['gives', 'takes', 'inert'].includes(e)) {
        return { ok: false, notYet: true, msg: 'Both cased samples need a tray.' };
      }
      if (!t.pieces.s4.props.tested || !t.pieces.s5.props.tested) {
        return { ok: false, msg: 'Only one cased sample has been tested. Run the tester on both cased samples first.' };
      }
      if (d === 'inert' || e === 'inert') {
        return { ok: false, msg: 'A cased sample\'s tester result does not match the "Will not trade" tray.' };
      }
      if (d !== 'gives') return { ok: false, msg: 'Sample D\'s tester result does not match its tray.' };
      if (e !== 'takes') return { ok: false, msg: 'Sample E\'s tester result does not match its tray.' };
      return { ok: true };
    },
    reward: {
      log: 'Both cased samples tested and filed.',
      title: 'Valence Electrons',
      body: 'Electrons in the outermost shell are valence electrons, which determine how an atom reacts: one valence electron is given away, seven takes one to fill the shell, and a full shell of eight trades nothing.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Same Weight, Different Atom',
    prompt: 'Which samples are the same element as Sample A?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sa', 'SAMPLE A', 12, 12, { p: 6, n: 6, rings: [2, 4], counts: true }), fixed: true },
        specimen('sb', 'SAMPLE B', 34, 12, { p: 6, n: 7, rings: [2, 4], counts: true }),
        specimen('sc', 'SAMPLE C', 56, 12, { p: 7, n: 6, rings: [2, 5], counts: true }),
        // The same total as Sample C, and a different element: weight cannot sort these.
        specimen('sd', 'SAMPLE D', 78, 12, { p: 5, n: 8, rings: [2, 3], counts: true }),
        // Heavier than Sample A and still its element.
        specimen('se', 'SAMPLE E', 100, 12, { p: 6, n: 8, rings: [2, 4], counts: true })
      ],
      zones: {
        trays: [
          specimenTray('same', 'Same element as Sample A', 30, 38, 44),
          specimenTray('other', 'A different element', 82, 38, 44)
        ]
      }
    }),
    hints: [
      'Set each suspect beside Sample A, count for count.',
      'The total number of particles will not separate them, but their proton counts and outer shells can.',
      'Set each suspect beside the reference sample and compare two things, the proton count and the outer shell: the one that matches on both is the same element, whatever it weighs.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const want = { sb: 'same', sc: 'other', sd: 'other', se: 'same' };
      const names = { sb: 'Sample B', sc: 'Sample C', sd: 'Sample D', se: 'Sample E' };
      if (Object.keys(want).some(id => !['same', 'other'].includes(where(id)))) return { ok: false, notYet: true, msg: 'All four samples need a tray.' };
      const wrong = Object.keys(want).filter(id => where(id) !== want[id]);
      if (wrong.length) {
        return { ok: false, msg: `${names[wrong[0]]}'s proton count and outer shell do not agree with its tray${wrong.length > 1 ? ', and neither do another sample\'s' : ''}.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Samples B and E match Sample A. Samples C and D do not.',
      model: { type: 'atoms', items: [{ p: 6, n: 6, label: 'Sample A' }, { p: 6, n: 7, label: 'Sample B' }], caption: 'Sample A and Sample B: the same 6 protons and 6 electrons, one more neutron in B. Not to scale.' },
      title: 'Elements and Isotopes',
      body: 'An element is identified solely by its proton count, the atomic number. Atoms with the same number of protons but different numbers of neutrons are isotopes.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Tell Them Apart',
    prompt: 'Sort each sample as an isotope, a charged atom or a different element from reference Sample D.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sd', 'SAMPLE D', 12, 12, { p: 7, n: 7, rings: [2, 5], counts: true, needle: true }), fixed: true },
        specimen('n1', 'SAMPLE A', 34, 12, { p: 7, n: 8, rings: [2, 5], counts: true, needle: true }),
        specimen('n2', 'SAMPLE B', 56, 12, { p: 7, n: 7, rings: [2, 4], counts: true, needle: true }),
        specimen('n3', 'SAMPLE C', 78, 12, { p: 8, n: 8, rings: [2, 6], counts: true, needle: true }),
        // An ion that GAINED an electron: losing is not the only way to get a charge.
        specimen('n4', 'SAMPLE E', 100, 12, { p: 7, n: 7, rings: [2, 6], counts: true, needle: true })
      ],
      zones: {
        trays: [
          specimenTray('heavy', 'Isotope', 21, 38),
          specimenTray('charged', 'Charged', 60, 38),
          specimenTray('other', 'Different element', 99, 38)
        ]
      }
    }),
    hints: [
      'Set each sample beside Sample D and read its protons, neutrons and needle.',
      'Line each sample up against the reference\'s protons, neutrons and needle, and find the one of those three it does not match.',
      'A different proton count is a different element; the same protons with a different neutron count is an extra neutron; the same protons and neutrons with the needle off zero is a spare or a missing electron.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const want = { n1: 'heavy', n2: 'charged', n3: 'other', n4: 'charged' };
      const labels = { n1: 'Sample A', n2: 'Sample B', n3: 'Sample C', n4: 'Sample E' };
      for (const id of Object.keys(want)) {
        if (!['heavy', 'charged', 'other'].includes(where(id))) return { ok: false, notYet: true, msg: `${labels[id]} has no tray yet.` };
      }
      const wrong = Object.keys(want).filter(id => where(id) !== want[id]);
      if (wrong.length) {
        return { ok: false, msg: `${labels[wrong[0]]}'s tray does not match the one count that differs from the reference${wrong.length > 1 ? ', and neither does another sample\'s' : ''}.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'All four identified.',
      title: 'Three Ways to Differ',
      body: 'Change the neutrons and you get an isotope. Change the electrons and the atom carries a charge, which makes it an ion. Change the protons and you get a different element altogether.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player found, the model it adds up to, and
   what the next bench is about.
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'An atom is mostly empty space with a nucleus at the center. The nucleus holds protons and neutrons, and electrons sit outside it in shells.'
    },
    {
      heading: 'Subatomic Particles',
      body: 'Protons (+1) determine the element. Neutrons (0) add mass. Electrons (-1) balance charge, and outer-shell electrons govern chemical reactivity.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const run = id => ({ run: id });

/** Every electron id in `ids` into a zone. */
const moveAll = (ids, zone) => ids.map(id => to(id, zone));
const ids = (prefix, from, upto) => Array.from({ length: upto - from + 1 }, (_, i) => `${prefix}${from + i}`);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [to('core', 'slot:model')],
  [run('beam'), to('core', 'slot:model')],
  [...SPECK_ORDER.map((c, i) => to(`sp${i + 1}`, 'tray:bed')), run('field'), ...SPECK_ORDER.map((c, i) => to(`sp${i + 1}`, c ? 'tray:bends' : 'tray:straight'))],
  moveAll(ids('e', 1, 8), 'tray:atom'),
  [...moveAll(ids('e', 1, 2), 'tray:sh1'), ...moveAll(ids('e', 3, 10), 'tray:sh2'), to('e11', 'tray:sh3')],
  [
    to('s1', 'slot:tester'), run('tester'), to('s2', 'slot:tester'), run('tester'), to('s3', 'slot:tester'), run('tester'),
    to('s4', 'slot:tester'), run('tester'), to('s5', 'slot:tester'), run('tester'),
    to('s4', 'tray:gives'), to('s5', 'tray:takes')
  ],
  [to('sb', 'tray:same'), to('sc', 'tray:other'), to('sd', 'tray:other'), to('se', 'tray:same')],
  [to('n1', 'tray:heavy'), to('n2', 'tray:charged'), to('n3', 'tray:other'), to('n4', 'tray:charged')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [run('beam'), to('even', 'slot:model')],
  [...SPECK_ORDER.map((c, i) => to(`sp${i + 1}`, 'tray:bed')), run('field'), ...SPECK_ORDER.map((c, i) => to(`sp${i + 1}`, 'tray:bends'))],
  moveAll(ids('e', 1, 5), 'tray:atom'),
  [...moveAll(ids('e', 1, 3), 'tray:sh1'), ...moveAll(ids('e', 4, 11), 'tray:sh2')],
  [to('s4', 'slot:tester'), run('tester'), to('s5', 'slot:tester'), run('tester'), to('s4', 'tray:inert'), to('s5', 'tray:takes')],
  [to('sb', 'tray:other'), to('sc', 'tray:other'), to('sd', 'tray:other'), to('se', 'tray:same')],
  [to('n1', 'tray:heavy'), to('n2', 'tray:other'), to('n3', 'tray:other'), to('n4', 'tray:charged')]
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
