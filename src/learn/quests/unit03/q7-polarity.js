/**
 * q7-polarity.js — Ligar, bench seven: POLARITY.
 *
 * The seventh bench on the world and its fifth TABLETOP (plan `bench-tabletop.md`, phase T3b). Two charged plates stand on the plate
 * with a gap between them, and a molecule is a card that is put there. Switch Field charges the plates, and a molecule whose bond
 * pulls do not cancel swings round to line up with the field; one whose pulls cancel stays as it stood. The ARROWS tool, laid on a
 * molecule, draws each bond's pull and their sum. A charged rod is laid on a stream of liquid. At `3D On` every molecule card carries
 * the molecule itself as a solid (`engine/ligar-mol3d.js`), standing on its tile and swung round as a whole by the field.
 *
 * THE CLICK (2026-10-23 rollout). Everyone expects that strongly polar bonds make a polar molecule. Carbon dioxide has two of them and
 * is the counter-example. The quest asks whether it turns (the obvious answer is a card), then sorts FIVE molecules by what the field
 * does to them, among them the ones that fail the rule of thumb in both directions: carbon dioxide and carbon tetrachloride have polar
 * bonds and do not turn, water and ammonia turn.
 *
 *   1  set hydrogen chloride so the field leaves it alone              -> partial charge, polar bond
 *   2  PREDICT: does carbon dioxide turn in the field?                  (no instrument; the obvious answer is a card)
 *   3  sort five molecules by what the field does to them              -> polar and nonpolar molecules, symmetry
 *   4  lay a charged rod on three streams                               -> polar liquids bend
 *   -- debrief.
 *
 * Cut (2026-10-23): "three bonds" (even, uneven, handed over: bench one's ionic and covalent again), "bent and straight" and "flat and
 * pyramid" (stage 3's five molecules hold both), "one hydrogen" (the swap of a single atom: the same symmetry idea, built instead of
 * read), the three-molecule sort, and the sump stream fetched for the last stage (it was the same water as the stream on the bench).
 *
 * EVERY TURN IS `vsepr.planDipole`: the bond pulls are electronegativity differences along the arm vectors `planDomains` settled,
 * summed. A card between the bars is drawn swung round when the field is on and its pulls add up, as they say, and not otherwise
 * (`kits/domain-field.js`). A stream bends toward the rod exactly when its molecules' pulls add up.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { RIG_MOLECULES, planDipole, bondKind } from '../../engine/vsepr.js';
import {
  domainTable, plates, molCard, molOf, molRead, streamPiece, arrowsTool, rodTool, dmolBehaviour, platesAround, fieldIsOn, platesOf
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bmolecular dipoles?\b|\bdipoles?\b/i, introducedAt: 3 },
  { term: /\bnonpolar\b/i, introducedAt: 3 },
  { term: /\bpolar\b/i, introducedAt: 1 },
  { term: /\bpartial charges?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q6-shape', 'unit03/q1-joins', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q7-polarity';
const GUESSES = [
  ['turns', 'carbon dioxide swings round', ['CO₂ swings round', 'Both its bonds', 'are strongly polar']],
  ['stays', 'carbon dioxide stays put', ['CO₂ stays put', 'whatever its', 'bonds are like'] ]
];

/** Every piece says what it is ("Arrows", "Charged Rod") and the field key is named by what it does, so no key needs a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   The plates at the left, a molecule a card. A stage that sorts has its trays in a column at the right; a stage that does not
   has the tools there. Cards start in a row under the plates (or, where the stage is a test, already between them).
   ------------------------------------------------------------------ */

const PLATES_BIG = { at: { x: 52, y: 21 }, size: { w: 100, h: 40 } };
const PLATES_SHORT = { at: { x: 37, y: 20 }, size: { w: 70, h: 38 } };

const rowAt = (i, y = 53) => ({ x: 15 + i * 28, y });
/** The trays stand in a grid at the right of the plates. */
const TRAY_SPOTS = [{ x: 100, y: 19 }, { x: 133, y: 19 }, { x: 100, y: 50 }, { x: 133, y: 50 }];
const grid = labels => labels.map(([id, label], i) => ({ id, label, at: { ...TRAY_SPOTS[i] }, size: { w: 32, h: 26 }, cell: 26 }));

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Which End',
    prompt: 'Set the hydrogen chloride molecule between the plates so that it does not swing when the field comes on.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('a', 'HCl', rowAt(0), { turn: true }), arrowsTool('ar', { x: 130, y: 14 })],
      fixtures: [plates('pl', PLATES_BIG.at, { size: PLATES_BIG.size })]
    }),
    hints: [
      'Use the molecule, the arrows, the plates and "Switch Field".',
      'Compare the arrow across the bond, and the end that swings toward the positive plate, with each atom\'s pull.',
      'Put the molecule between the plates, switch the field on, and turn the card round until it no longer swings.'
    ],
    check(state) {
      const b = dmolBehaviour(state.table.pieces.a, state.table);
      if (!b.around) return { ok: false, notYet: true, msg: 'Put the molecule between the plates.' };
      if (b.aligned) return { ok: true };
      return { ok: false, msg: 'The molecule would swing round when the field comes on.' };
    },
    reward: {
      log: 'The harder puller takes the minus.',
      title: 'Partial Charge, Polar Bond',
      body: 'An atom that pulls the shared pair harder ends up with a partial negative charge, and the atom at the other end with a partial positive one. A bond like that is a polar bond, and the negative end is the one that turns toward the positive plate.',
      model: { type: 'shape', mol: 'HCl', caption: 'Hydrogen chloride: chlorine pulls the pair harder, so it is the partly negative end.' }
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'Two Pulls',
    prompt: 'Carbon dioxide has two strongly polar bonds: will it swing round between the charged plates?',
    cards: GUESSES,
    hints: [
      'Use the two cards and the slot.',
      'Picture the two pulls, which way each one points, and what they add up to.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    reward: {
      title: 'A Guess Comes First',
      body: 'Your guess is locked in, and the next bench tests it. Put molecules between the plates and switch the field on.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Five Molecules',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'sort each molecule by whether it swings round when the field is switched on.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'CO2', rowAt(0), { field: true }), molCard('b', 'H2O', rowAt(1), { field: true }), molCard('c', 'CCl4', rowAt(2), { field: true }),
        molCard('d', 'NH3', rowAt(3), { field: true }), molCard('e', 'CHCl3', rowAt(4), { field: true }),
        arrowsTool('ar', { x: 69, y: 22 })
      ],
      zones: { trays: [{ id: 'turns', label: 'Swings round', at: { x: 100, y: 18 }, size: { w: 32, h: 22 }, cell: 22 }, { id: 'stays', label: 'Stays put', at: { x: 133, y: 18 }, size: { w: 32, h: 22 }, cell: 22 }] },
      fixtures: [plates('pl', { x: 27, y: 21 }, { size: { w: 52, h: 40 } })]
    }),
    hints: [
      'Use the molecules, the arrows, the plates, "Switch Field" and the two trays.',
      'Compare the direction of the bond arrows on each card with the arrow they add up to.',
      'Put each molecule between the plates in turn, lay the arrows on it, switch the field on, and file it by what it did.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c', 'd', 'e'];
      const where = Object.fromEntries(ids.map(id => [id, ['turns', 'stays'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all five molecules into trays.' };
      const wrong = ids.find(id => where[id] !== (molRead(t.pieces[id]).polar ? 'turns' : 'stays'));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is under a heading the plates did not show.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Water, ammonia and chloroform swung round. Carbon dioxide and carbon tetrachloride stayed put.',
        title: 'Polar and Nonpolar Molecules',
        body: `${verdictLine(QUEST_KEY, 'stays')}A molecule whose bond pulls add up to a net pull, a molecular dipole, is polar and swings round in a field; one whose pulls cancel is nonpolar, however polar each bond is. A straight or evenly built molecule cancels its pulls, and a bent or lopsided one cannot.`,
        model: { type: 'shape', mol: 'H2O', caption: 'Water is bent, so its two pulls add into one. Drag to turn it.' }
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Charged Rod',
    prompt: 'Put the streams that a charged rod bends into the tray.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        streamPiece('s1', 'CCl4', { x: 24, y: 21 }), streamPiece('s2', 'CHCl3', { x: 56, y: 21 }), streamPiece('s3', 'H2O', { x: 88, y: 21 }),
        rodTool('rod', { x: 130, y: 14 })
      ],
      zones: { trays: [{ id: 'bent', label: 'Bent by the rod', at: { x: 62, y: 51 }, size: { w: 90, h: 24 }, cell: 20 }] }
    }),
    hints: [
      'Use the charged rod, the streams and the tray.',
      'Compare the streams that bend with what the molecules of each liquid did in the field.',
      'Lay the rod on one stream at a time, watch which way it runs, and put the ones that bend in the tray.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['s1', 's2', 's3'];
      const bent = ids.filter(id => t.pieces[id].zone === 'tray:bent');
      const want = ids.filter(id => molRead(t.pieces[id]).polar);
      if (!bent.length) return { ok: false, notYet: true, msg: 'Put the streams the rod bends into the tray.' };
      if (bent.some(id => !want.includes(id))) return { ok: false, msg: 'The tray holds a stream the rod did not bend.' };
      if (want.some(id => !bent.includes(id))) return { ok: false, msg: 'A stream the rod bent is not in the tray.' };
      return { ok: true };
    },
    reward: {
      log: 'Polar liquids bend; nonpolar ones do not.',
      title: 'Polar Liquids Bend',
      body: 'A stream of molecules that swing round in a field is pulled by a charged rod, and a stream of molecules that do not is left alone. The shape of the molecule decides what the whole liquid does.',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A bond is polar when its atoms pull the pair unequally, and a molecule is polar when those pulls do not cancel. Shape decides: symmetrical molecules cancel their pulls even when every bond is strongly polar.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Whether a molecule is polar decides what it dissolves in, how it attracts its neighbours and how it behaves near a charge. You can now tell from a Lewis structure and a shape.'
    },
    {
      heading: 'Next',
      body: 'The next bench asks what the orbitals look like that make these bonds, and why some bonds turn and some will not.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'In an H–Cl bond, which atom carries the partial negative charge?',
    options: [
      { id: 'a', label: 'Chlorine, because it is more electronegative' },
      { id: 'b', label: 'Hydrogen, because it is smaller' },
      { id: 'c', label: 'Neither, because the bond is nonpolar' },
      { id: 'd', label: 'Hydrogen, because it has fewer electrons' }
    ],
    answer: 'a',
    explanation: 'Chlorine (3.16) pulls the shared pair harder than hydrogen (2.20), so chlorine ends up partially negative.'
  },
  {
    question: 'Why is CO₂ nonpolar although each C=O bond is polar?',
    options: [
      { id: 'a', label: 'The molecule is linear, so the two bond dipoles cancel' },
      { id: 'b', label: 'Carbon and oxygen have the same electronegativity' },
      { id: 'c', label: 'The molecule is bent' },
      { id: 'd', label: 'The bonds are triple bonds' }
    ],
    answer: 'a',
    explanation: 'The two equal bond dipoles point in opposite directions along a straight line and cancel.'
  },
  {
    question: 'Which molecule is polar?',
    options: [
      { id: 'a', label: 'H₂O' },
      { id: 'b', label: 'CCl₄' },
      { id: 'c', label: 'BF₃' },
      { id: 'd', label: 'CO₂' }
    ],
    answer: 'a',
    explanation: 'Water is bent, so its two O–H bond dipoles add. The other three are symmetrical and their dipoles cancel.'
  },
  {
    question: 'BF₃ has three very polar B–F bonds. Why is the molecule nonpolar?',
    options: [
      { id: 'a', label: 'It is trigonal planar, so the three dipoles cancel' },
      { id: 'b', label: 'It has a lone pair on boron' },
      { id: 'c', label: 'The bonds are not polar' },
      { id: 'd', label: 'Fluorine is less electronegative than boron' }
    ],
    answer: 'a',
    explanation: 'Three equal dipoles at 120 degrees to one another add to zero.'
  },
  {
    question: 'Which pair of atoms forms the most polar bond?',
    options: [
      { id: 'a', label: 'H and F' },
      { id: 'b', label: 'H and C' },
      { id: 'c', label: 'C and C' },
      { id: 'd', label: 'H and H' }
    ],
    answer: 'a',
    explanation: 'The larger the electronegativity difference, the more polar the bond. H (2.20) and F (3.98) differ most.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. A molecule is put between the plates (`gap`), the arrows laid on it, the
   field switched, a card put in a tray: nothing here says what a molecule does in a field.
   ------------------------------------------------------------------ */

const gap = (id, x = 37, y = 21) => ({ place: { piece: id, to: `free:${x},${y}` } });
const lay = (toolId, id) => ({ join: [toolId, id] });
const field = { run: 'pl' };
const into = (id, zone) => ({ place: { piece: id, to: `tray:${zone}` } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [gap('a'), { flip: 'a' }],
  [guess('stays')],
  [
    gap('a'), lay('ar', 'a'), field, into('a', 'stays'),
    gap('b'), into('b', 'turns'), gap('c'), into('c', 'stays'), gap('d'), into('d', 'turns'), gap('e'), into('e', 'turns')
  ],
  [lay('rod', 's1'), lay('rod', 's2'), lay('rod', 's3'), into('s2', 'bent'), into('s3', 'bent')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [gap('a')],
  [],
  [into('a', 'turns'), into('b', 'turns'), into('c', 'stays'), into('d', 'turns'), into('e', 'turns')],
  [into('s1', 'bent'), into('s3', 'bent')]
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
export { RIG_MOLECULES, planDipole, bondKind, molOf, molRead };
