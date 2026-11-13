/**
 * q7-pes.js — Lanternfall, bench seven: PHOTOELECTRON SPECTROSCOPY.
 *
 * The detector arc. Fire light of enough energy at a specimen and every electron it carries enough energy for is knocked loose; each lands
 * in a strip graded in energy, and they pile up. The result is the configuration drawn out, and it is the strongest evidence this world
 * offers that the rows you filled on the last bench are real: one peak per row, as tall as the row is full.
 *
 * The seventh of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4c), on the spectrum kit (`table/kits/pes.js`), reworked on
 * 2026-10-23 around ONE CLICK and pitched for a first reader: knocking electrons off with light, and asking how much it takes. A
 * specimen card is put in the chamber and "Fire Light" drops its electrons into the bins of a strip (instanced beads at `3D On`); the
 * card keeps a printout of what it showed, so several can be ranked on a rail; the light's energy is a dial, because the least energy
 * that frees an electron is how tightly it was held; an atom is built to match a sealed spectrum; a configuration is written row by row.
 * This is optional depth beyond a first course, and the stage-two card says so.
 *
 * THE CLICK. Every electron of an atom looks alike, so a player expects a light either to take them all or none. The guess (all three of
 * lithium's, one, or two) is asked with no chamber on the table, and then the weakest light that frees anything frees just one: the
 * outer electron is held loosely and the two nearest the middle are held far harder.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  PREDICT: how many of lithium's electrons the weakest freeing light takes (no chamber) -> a guess before the evidence
 *   2  TEST: set the light to the weakest energy that frees any                               -> binding energy
 *   3  build the atom whose peaks match a sealed specimen's                                    -> the photoelectron spectrum
 *   4  oxygen, fluorine and neon ranked by how hard they hold their innermost electrons       -> more charge, tighter hold
 *   5  write down the configuration a sealed spectrum shows                                    -> the spectrum is the configuration
 *
 * THE ROWS' NAMES ARE NEVER ON THE BENCH until stage five, whose answer they are. A peak is a position and a height and nothing
 * else; the strip's scale says "energy to remove" until the word for it is earned (stage 2).
 *
 * Cut on 2026-10-23 (problems doc T6, T7): the first two spectra and the tally (stage 3 teaches that heights are counts), boron's two
 * subshells (a subshell is a second idea on top of the first), and the three third-row neighbours (stage 5 again at a larger count).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  pesTable, plaqueFixture, ieBarsFixture, specimen, chamber, buildFixture, writerFixture,
  chamberRead, buildRead, writtenRead, writerTarget, freedBy, holdOf, electronsIn, spectrumOf, shellsOf,
  ENERGY_STEPS, TOP_STEP, WRITER_ROWS, BINS, binOf, pilesOf, energyAt, LADDER, groundConfig, zOf
} from '../../table/kits/pes.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bphotoelectron spectr(?:um|a)\b/i, introducedAt: 3 },
  { term: /\bbinding energy\b/i, introducedAt: 2 }
];

export const BUILDS_ON = ['unit02/q6-filling', 'unit02/q2-photon'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q7-pes';
const GUESS_LABEL = { all: 'All three', one: 'Just one', two: 'Two' };

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const CH = { x: 57, y: 25 };
const CHAMBER = 'ch';
const SLOT = `slot:${CHAMBER}.spec`;

const railOf = t => t.zones.rail.order.slice();

/** The weakest light step that frees any electron of `sym`. */
export function weakestStep(sym) {
  for (let i = 1; i <= TOP_STEP; i++) if (freedBy(sym, energyAt(i)).length > 0) return i;
  return null;
}

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Lithium\'s Three',
    // A PREDICT STAGE: the chamber is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    briefing: {
      speaker: SPEAKER,
      body: 'Light with enough energy removes an electron from any atom, not only from a metal. Lithium has three electrons: two in its first shell and one in its second.'
    },
    prompt: 'Light just strong enough to remove an electron shines on lithium: how many of its three electrons leave?',
    widget,
    table: pesTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'all', label: 'All three', at: { x: 38, y: 48 }, r: 7 },
          { id: 'two', label: 'Two', at: { x: 75, y: 48 }, r: 7 },
          { id: 'one', label: 'Just one', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three cards into the slot.',
      'Think whether the nucleus holds all three electrons equally tightly, given where each one is.',
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
      body: 'Next, a chamber shines light of a chosen energy on lithium and collects the electrons that leave.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['a'], { energyDial: true, rings: true });
    return {
      title: 'The Weakest Light',
      briefing: {
        speaker: SPEAKER,
        body: 'The energy needed to remove one electron from an atom is that electron\'s binding energy. Light removes an electron only if its energy is at least that much.'
      },
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": what is the least energy of light that removes an electron from lithium?`
          : 'What is the least energy of light that removes an electron from lithium?';
      },
      widget,
      table: pesTable({
        pieces: [specimen('a', 'LITHIUM', 'Li', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Turn the Light energy dial and press "Fire Light"; each electron removed lands on the strip at its binding energy.',
        'Compare how many electrons leave at each setting with where they sit in the picture of the atom.',
        'Below some energy the light removes nothing, so find the lowest setting at which the strip is not empty.'
      ],
      check(state) {
        const t = state.table;
        const r = chamberRead(t, CHAMBER);
        const want = weakestStep('Li');
        const v = Math.round(t.fixtures[CHAMBER].dials.energy.value);
        if (v === want) return { ok: true };
        if (r.electronsNow === 0) return { ok: false, msg: 'Light of that energy removes no electron.' };
        return { ok: false, msg: 'Light of a lower energy than this already removes an electron.' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'one'
          ? 'Your prediction held. '
          : 'The strip did not agree with your prediction. ';
        return {
          log: 'The outer electron has the lowest binding energy.',
          title: 'Binding Energy',
          body: `${verdict}The outer electron leaves at a far lower energy than the two in the first shell. The closer an electron is to the nucleus, the higher its binding energy.`,
          model: { type: 'atom', p: 3, n: 4, eject: true, caption: 'Lithium: two electrons in the first shell, tightly held, and one in the second shell, held far less tightly. Not to scale.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['x'], { axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'Name the Specimen',
      briefing: {
        speaker: SPEAKER,
        body: 'A photoelectron spectrum counts the electrons removed at each binding energy. A peak\'s position says how tightly those electrons are held, and its height says how many of them there are.'
      },
      prompt: 'Which atom gives the sealed specimen\'s spectrum?',
      widget,
      table: pesTable({
        pieces: [specimen('x', 'SEALED SPECIMEN', 'O', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture, buildFixture('build', { x: 130.5, y: 25 }, { max: 13, label: 'Build an atom' })],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Press "Fire Light" to record the spectrum, then set the Protons and Electrons dials of "Build an atom".',
        'Count the electrons in each peak on the strip.',
        'Every electron of the atom is in one of the peaks, and a neutral atom has as many protons as electrons.'
      ],
      check(state) {
        const t = state.table;
        const b = buildRead(t, 'build');
        const r = chamberRead(t, CHAMBER);
        if (!r.fired) return { ok: false, notYet: true, msg: 'Press Fire Light to record the specimen\'s spectrum first.' };
        if (!b.protons && !b.electrons) return { ok: false, notYet: true, msg: 'Build an atom with the dials.' };
        if (b.whole && b.sym === 'O') return { ok: true };
        if (!b.whole) return { ok: false, msg: `The built atom has ${b.protons} protons and ${b.electrons} electrons, so it is an ion and not a neutral atom.` };
        return { ok: false, msg: `The built atom has ${b.electrons} electrons, and the peaks on the strip hold ${r.electrons}.` };
      },
      reward: {
        log: 'The peak heights add up to the number of electrons.',
        title: 'The Photoelectron Spectrum',
        body: 'Peaks of 2, 2 and 4 electrons add up to 8. An atom with 8 electrons has 8 protons, so the specimen is oxygen.',
        model: { type: 'rack', z: 8, caption: 'Oxygen\'s three peaks as three subshells: 2 electrons, 2 electrons and 4 electrons.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ch = chamber(CHAMBER, { x: CH.x, y: CH.y - 1 }, ['o', 'f', 'n'], { axisLabel: 'BINDING ENERGY, MJ/mol', h: 38 });
    return {
      title: 'Oxygen, Fluorine, Neon',
      prompt: 'What is the order of the three atoms from the lowest binding energy of their innermost electrons to the highest?',
      widget,
      table: pesTable({
        pieces: [specimen('o', 'OXYGEN', 'O', { x: 0, y: 0 }, { note: '8 protons' }), specimen('f', 'FLUORINE', 'F', { x: 0, y: 0 }, { note: '9 protons' }), specimen('n', 'NEON', 'Ne', { x: 0, y: 0 }, { note: '10 protons' })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots, rail: { id: 'rail', at: { x: 62, y: 54 }, size: { w: 84, h: 12 }, first: 'Lowest binding energy', last: 'Highest binding energy', items: ['o', 'f', 'n'], start: ['n', 'o', 'f'] } }
      }),
      hints: [
        'Put each specimen in the holder in turn and press "Fire Light".',
        'Compare where the peak of highest binding energy stands for each atom with the number of protons on its card.',
        'The innermost electrons are the same two in all three atoms, so think what differs in the nucleus that attracts them.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three specimens on the rail.' };
        if (!['o', 'f', 'n'].every(id => t.pieces[id].props.printed)) return { ok: false, notYet: true, msg: 'Record the spectrum of all three specimens first.' };
        const want = ['o', 'f', 'n'].slice().sort((p, q) => holdOf(t.pieces[p].props.sym) - holdOf(t.pieces[q].props.sym));
        if (order.join() === want.join()) return { ok: true };
        for (let k = 0; k < order.length - 1; k++) {
          if (holdOf(t.pieces[order[k]].props.sym) > holdOf(t.pieces[order[k + 1]].props.sym)) {
            return { ok: false, msg: `${t.pieces[order[k]].label} stands left of ${t.pieces[order[k + 1]].label}, and its innermost peak stands at the higher binding energy of the two.` };
          }
        }
        return { ok: false, msg: 'The rail does not agree with where the innermost peaks stand.' };
      },
      reward: {
        log: 'More protons: higher binding energy for the same shell.',
        title: 'More Protons, Higher Binding Energy',
        body: 'Neon\'s ten protons hold its two first-shell electrons more tightly than fluorine\'s nine or oxygen\'s eight. For the same shell, more protons mean a higher binding energy.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['c'], { axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'The Sealed Specimen\'s Subshells',
      prompt: 'What electron configuration does this sealed specimen\'s spectrum show?',
      widget,
      table: pesTable({
        pieces: [specimen('c', 'SEALED SPECIMEN', 'N', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture, writerFixture('write', { x: 130.5, y: 26 }, { label: 'Electrons in each subshell' })],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Press "Fire Light", then set the dial for each subshell on the page.',
        'Compare the peaks in order of binding energy with the order in which the subshells fill.',
        'The subshell that fills first lies nearest the nucleus, so think which peak its electrons make.'
      ],
      check(state) {
        const t = state.table;
        const w = writtenRead(t, 'write');
        if (w.total === 0) return { ok: false, notYet: true, msg: 'Set the number of electrons in each subshell.' };
        const want = writerTarget('N');
        if (WRITER_ROWS.every(r => w.counts[r] === want[r])) return { ok: true };
        return { ok: false, msg: 'A dial on the page does not match the height of the peak for that subshell.' };
      },
      reward: {
        log: 'Peak by peak, the spectrum is the configuration.',
        title: 'The Spectrum Is the Configuration',
        body: 'Read from the highest binding energy to the lowest, the peak heights give the configuration subshell by subshell: 1s² 2s² 2p³, which is nitrogen.',
        model: { type: 'rack', z: 7, caption: 'Nitrogen\'s subshells, lowest at the bottom: 2, 2 and 3 electrons, the three 2p electrons each in an orbital of its own.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const plate = plaqueFixture('plate', 'Energy to remove each electron in turn', { x: 42, y: 26 }, [
      'First: 738 kJ/mol',
      'Second: 1451 kJ/mol',
      'Third: 7733 kJ/mol',
      'Fourth: 10543 kJ/mol'
    ], { w: 66 });
    const chart = ieBarsFixture('bars', 'Energy per Electron', { x: 112, y: 26 }, [
      { label: '1st', value: 738 },
      { label: '2nd', value: 1451 },
      { label: '3rd', value: 7733 },
      { label: '4th', value: 10543 }
    ], { w: 56, h: 38 });
    return {
      title: 'Counting Outer Electrons',
      briefing: {
        speaker: SPEAKER,
        body: 'The energy needed to remove the outermost electron from an atom is its ionization energy. Removing a second electron, then a third, takes more energy each time.'
      },
      prompt: 'How many electrons are in this atom\'s outer shell?',
      entry: { id: 'ans', label: 'Outer-shell electrons', unit: '' },
      widget,
      table: pesTable({ pieces: [], fixtures: [plate, chart], zones: {} }),
      hints: [
        'The plate lists the energy needed to remove the first four electrons, one after another.',
        'Compare each energy with the one before it.',
        'An electron in a shell nearer the nucleus has a far higher binding energy, so look for where the list shows that.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a whole number.' };
        if (v === 2) return { ok: true };
        return { ok: false, msg: 'After that many electrons, the next energy on the plate is not much bigger than the one before it.' };
      },
      reward: {
        log: 'The jump marks the first electron from an inner shell.',
        title: 'Successive Ionization Energies',
        body: 'The energy jumps more than five times after the second electron, so the third came from a shell nearer the nucleus. The atom has two outer electrons: it is magnesium.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Turn the Light energy dial, then press Fire Light.'],
  3: ['Press Fire Light, then set the Protons and Electrons dials.']
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
      body: 'A photoelectron spectrum has one peak for each subshell that holds electrons. The peak\'s position is the binding energy of those electrons and its height is how many there are, so the spectrum is the configuration, measured.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'The spectrum is the evidence for shells and subshells: electrons in an atom are held at a few separate energies, and more protons hold the same shell more tightly.'
    },
    {
      heading: 'Next',
      body: 'Next: how the size of an atom and the energy to remove its outer electron change across the periodic table.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Specimens are put in the chamber and fired, dials are turned, atoms are built and written.
   Nothing here says what a strip shows.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const writeRows = counts => WRITER_ROWS.map(r => dial('write', r, counts[r] || 0));

export const SOLUTIONS = [
  [{ predict: 'one' }],
  [dial(CHAMBER, 'energy', weakestStep('Li')), { run: CHAMBER }],
  [{ run: CHAMBER }, dial('build', 'protons', 8), dial('build', 'electrons', 8)],
  [put('o', `slot:${CHAMBER}.spec`), { run: CHAMBER }, put('f', `slot:${CHAMBER}.spec`), { run: CHAMBER }, put('n', `slot:${CHAMBER}.spec`), { run: CHAMBER }, put('o', 'rail:0'), put('f', 'rail:1'), put('n', 'rail:2')],
  [{ run: CHAMBER }, ...writeRows({ '1s': 2, '2s': 2, '2p': 3 })],
  [{ type: { entry: 'ans', value: '2' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(CHAMBER, 'energy', 9)],
  [{ run: CHAMBER }, dial('build', 'protons', 9), dial('build', 'electrons', 9)],
  [put('n', 'rail:0')],
  [{ run: CHAMBER }, ...writeRows({ '1s': 2, '2s': 3, '2p': 2 })],
  [{ type: { entry: 'ans', value: '3' } }]
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
export { holdOf, electronsIn, spectrumOf, shellsOf, ENERGY_STEPS, TOP_STEP, WRITER_ROWS, BINS, binOf, pilesOf, energyAt, LADDER, groundConfig, zOf, freedBy, QUEST_KEY };
