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
  pesTable, plaqueFixture, specimen, chamber, buildFixture, writerFixture,
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
const GUESS_LABEL = { all: 'All three together', one: 'Just one', two: 'Two of them' };

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
    prompt: 'Lithium has three electrons: when the weakest light that frees any of them shines, how many come off?',
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
      'Drag one of the three guesses into the slot.',
      'Think about whether the three electrons of an atom are all held the same way, or whether some sit closer in.',
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
      body: 'If every electron were held the same way, a light would take all of them or none. Next, a chamber will fire light of any strength at lithium.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['a'], { energyDial: true, rings: true });
    return {
      title: 'The Weakest Light',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": set the light to the weakest energy that frees any of lithium's electrons.`
          : 'Set the light to the weakest energy that frees any of lithium\'s electrons.';
      },
      widget,
      table: pesTable({
        pieces: [specimen('a', 'LITHIUM', 'Li', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Use the Light energy dial and "Fire Light", and watch the strip.',
        'Compare the ring picture beside the holder with the piles that appear at each setting.',
        'Step the energy down from the top until nothing is left on the strip, and stop on the setting just above that.'
      ],
      check(state) {
        const t = state.table;
        const r = chamberRead(t, CHAMBER);
        const want = weakestStep('Li');
        const v = Math.round(t.fixtures[CHAMBER].dials.energy.value);
        if (v === want) return { ok: true };
        if (r.electronsNow === 0) return { ok: false, msg: 'That light frees no electron at all.' };
        return { ok: false, msg: 'A weaker light than this one already frees an electron.' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'one'
          ? 'You predicted just one, and the strip agreed. '
          : 'The strip did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'The outer electron is the loosely held one.',
          title: 'Binding Energy',
          body: `${verdict}The energy needed to remove an electron is its binding energy, and the closer an electron sits to the nucleus the more tightly it is bound. Lithium's outer electron comes off with far less than the two beside the nucleus.`,
          model: { type: 'atom', p: 3, n: 4, eject: true, caption: 'Lithium: two electrons on the shell close to the middle, held tightly, and one on the shell outside, held loosely. Not to scale.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['x'], { model: 'build', axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'Name the Specimen',
      prompt: 'Build the atom whose peaks match the sealed specimen\'s.',
      widget,
      table: pesTable({
        pieces: [specimen('x', 'SEALED SPECIMEN', 'O', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture, buildFixture('build', { x: 130.5, y: 25 }, { max: 13, label: 'Build an atom' })],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Use "Fire Light" on the sealed specimen, then the Protons and Electrons dials of the build.',
        'Compare the outlines the build makes with the piles on the strip, and what the heights add up to.',
        'A whole atom has as many electrons as protons, so build the one whose outlines cover every pile.'
      ],
      check(state) {
        const t = state.table;
        const b = buildRead(t, 'build');
        if (!b.protons && !b.electrons) return { ok: false, notYet: true, msg: 'Build an atom with the dials.' };
        if (b.whole && b.sym === 'O') return { ok: true };
        if (!b.whole) return { ok: false, msg: 'The build has a different number of protons and electrons.' };
        return { ok: false, msg: 'The outlines of that atom do not cover the sealed specimen\'s piles.' };
      },
      reward: {
        log: 'The heights summed to the atomic number.',
        title: 'The Photoelectron Spectrum',
        body: 'Counting how many electrons come off at each energy gives a photoelectron spectrum: a peak\'s position says how tightly those electrons were held, and its height says how many there are. The heights add up to all the electrons, and in a neutral atom that equals its atomic number, so peaks of 2, 2 and 4 belong to oxygen.',
        model: { type: 'rack', z: 8, caption: 'Oxygen\'s three peaks as three rows: 2 electrons, 2 electrons and 4 electrons.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['o', 'f', 'n'], { axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'Oxygen, Fluorine, Neon',
      prompt: 'Rank the three specimens by how tightly they hold their innermost electrons, loosest first.',
      widget,
      table: pesTable({
        pieces: [specimen('o', 'OXYGEN', 'O', { x: 0, y: 0 }, { note: '8 protons' }), specimen('f', 'FLUORINE', 'F', { x: 0, y: 0 }, { note: '9 protons' }), specimen('n', 'NEON', 'Ne', { x: 0, y: 0 }, { note: '10 protons' })],
        fixtures: [ch.fixture],
        zones: { slots: ch.slots, rail: { id: 'rail', at: { x: 62, y: 54 }, size: { w: 84, h: 12 }, first: 'Held loosest', last: 'Held tightest', items: ['o', 'f', 'n'], start: ['n', 'o', 'f'] } }
      }),
      hints: [
        'Use "Fire Light" with each specimen in the holder.',
        'Compare the position of the pile that stands furthest toward the high-energy end with the number of protons on each card.',
        'Lay the specimens on the rail in the order of their innermost piles, the one nearest the low-energy end first.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three specimens on the rail.' };
        const want = ['o', 'f', 'n'].slice().sort((p, q) => holdOf(t.pieces[p].props.sym) - holdOf(t.pieces[q].props.sym));
        if (order.join() === want.join()) return { ok: true };
        for (let k = 0; k < order.length - 1; k++) {
          if (holdOf(t.pieces[order[k]].props.sym) > holdOf(t.pieces[order[k + 1]].props.sym)) {
            return { ok: false, msg: `${t.pieces[order[k]].label} stands left of ${t.pieces[order[k + 1]].label}, and its innermost pile stands further toward the high-energy end.` };
          }
        }
        return { ok: false, msg: 'The rail does not run the way the innermost piles stand.' };
      },
      reward: {
        log: 'A bigger nuclear charge holds the same shell harder.',
        title: 'More Charge, Tighter Hold',
        body: 'Neon\'s first-shell electrons feel ten protons and fluorine\'s feel nine, and the extra proton holds them noticeably tighter. The same two electrons in the same shell need more energy to remove from the atom with the bigger nuclear charge.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const ch = chamber(CHAMBER, CH, ['c'], { axisLabel: 'BINDING ENERGY, MJ/mol' });
    return {
      title: 'The Sealed Specimen\'s Rows',
      prompt: 'Write down the ground-state electron configuration this sealed specimen\'s spectrum shows.',
      widget,
      table: pesTable({
        pieces: [specimen('c', 'SEALED SPECIMEN', 'N', { x: 0, y: 0 }, { zone: SLOT })],
        fixtures: [ch.fixture, writerFixture('write', { x: 130.5, y: 26 }, { label: 'Electrons in each row' })],
        zones: { slots: ch.slots }
      }),
      hints: [
        'Use "Fire Light" and the dial of each row on the page.',
        'Order the piles from the one held most tightly to the one held least, which is the order the rows fill in.',
        'Set each row of the page to the height of the next pile along, starting with the most tightly held.'
      ],
      check(state) {
        const t = state.table;
        const w = writtenRead(t, 'write');
        if (w.total === 0) return { ok: false, notYet: true, msg: 'Write the electrons in each row.' };
        const want = writerTarget('N');
        if (WRITER_ROWS.every(r => w.counts[r] === want[r])) return { ok: true };
        return { ok: false, msg: 'The page and the strip do not agree, row by row.' };
      },
      reward: {
        log: 'Peak by peak, the spectrum is the arrangement.',
        title: 'The Spectrum Is the Configuration',
        body: 'A photoelectron spectrum is the electron configuration drawn out: each peak is a row, and its height is how many electrons the row holds. Read from the most tightly held peak to the least, it spells the configuration row by row.',
        model: { type: 'rack', z: 7, caption: 'Nitrogen\'s rows, lowest at the bottom: 2, 2 and 3 electrons, the three in the top row standing alone.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const plate = plaqueFixture('plate', 'Energy to remove each electron in turn', { x: 52, y: 26 }, [
      'First: 738 kJ/mol',
      'Second: 1451 kJ/mol',
      'Third: 7733 kJ/mol',
      'Fourth: 10543 kJ/mol'
    ], { w: 70 });
    return {
      title: 'Counting Outer Electrons',
      prompt: 'Type how many outer-shell electrons the sealed atom has.',
      entry: { id: 'ans', label: 'Outer-shell electrons', unit: '' },
      widget,
      table: pesTable({ pieces: [], fixtures: [plate], zones: {} }),
      hints: [
        'Read the four energies on the plate, then type the figure in the field.',
        'Compare each energy with the one before it and find the step that jumps the most.',
        'Electrons removed before the big jump come from the outer shell; the jump marks the first electron from a shell closer in.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a whole number.' };
        if (v === 2) return { ok: true };
        return { ok: false, msg: 'The energies do not climb steeply at the step that figure implies.' };
      },
      reward: {
        log: 'The big jump marks the first electron from a closer shell.',
        title: 'Successive Ionization Energies',
        body: 'Each electron is harder to remove than the last, but the cost jumps when the next electron sits in a shell closer to the nucleus. Here it jumps after the second, so the atom has two outer-shell electrons: magnesium.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Turn the Light energy dial, then press Fire Light.'],
  3: ['Set the Protons and Electrons dials: your atom\'s peaks', 'appear on the strip as outlines.']
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
      body: 'A photoelectron spectrum has one peak for every row of electrons: its height is how many electrons the row holds and its position is how tightly they are held. It is the configuration measured instead of written.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'PES provides direct experimental evidence for subshell energy levels and electron configurations. The spectrum directly reflects the underlying electronic structure.'
    },
    {
      heading: 'Next',
      body: 'Binding energy follows predictable periodic trends across rows and down columns. The next bench measures atomic radii and ionization energies across the periodic table.'
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
