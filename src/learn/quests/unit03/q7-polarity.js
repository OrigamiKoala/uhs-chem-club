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

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\belectronegativ\w*/i, introducedAt: 1 },
  { term: /\bmolecular dipoles?\b|\bdipoles?\b/i, introducedAt: 4 },
  { term: /\bnonpolar\b/i, introducedAt: 4 },
  { term: /\bpolar\b/i, introducedAt: 2 },
  { term: /\bpartial charges?\b/i, introducedAt: 2 }
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

const pullRow = i => ({ x: 13 + i * 27, y: 53 });
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
    title: 'How Hard Each Atom Pulls',
    prompt: 'Sort each molecule by how unevenly its two atoms share the bond pair: not at all, partly, or one atom takes it.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'H2', pullRow(0), { field: true }), molCard('b', 'HBr', pullRow(1), { field: true }), molCard('c', 'KF', pullRow(2), { field: true }),
        molCard('d', 'HCl', pullRow(3), { field: true }),
        arrowsTool('ar', { x: 128, y: 49 })
      ],
      zones: { trays: [
        { id: 'none', label: 'Shared evenly', at: { x: 26, y: 20 }, size: { w: 46, h: 24 }, cell: 22 },
        { id: 'part', label: 'Pulled toward one', at: { x: 75, y: 20 }, size: { w: 46, h: 24 }, cell: 22 },
        { id: 'taken', label: 'Taken by one', at: { x: 124, y: 20 }, size: { w: 46, h: 24 }, cell: 22 }
      ] }
    }),
    hints: [
      'Use the arrows, the molecules and the three trays.',
      'Lay the arrows on a molecule and read the number printed on its card, then do the same for the others.',
      'A reading of zero means the bond pair is shared evenly; the larger the reading, the more one atom pulls the pair its way.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c', 'd'];
      const where = Object.fromEntries(ids.map(id => [id, ['none', 'part', 'taken'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all four molecules into trays.' };
      const band = id => { const d = molRead(t.pieces[id]).net; return d < 0.4 ? 'none' : d < 1.7 ? 'part' : 'taken'; };
      const wrong = ids.find(id => where[id] !== band(id));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is in a tray that its printed reading does not fit.` };
      return { ok: true };
    },
    reward: {
      log: 'The bigger the difference in pull, the more one-sided the bond.',
      title: 'Electronegativity',
      body: 'Electronegativity is how strongly an atom pulls shared electrons toward itself. The number on each card is the difference between its two atoms: 0 for H₂, 0.96 for HCl, 3.16 for KF. Above about 1.7 the pair is taken over entirely, which is an ionic bond.'
    }
  },

  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Which End',
    prompt: 'Orient the hydrogen chloride molecule between the plates so that it remains aligned when the field is switched on.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('a', 'HCl', rowAt(0), { turn: true }), arrowsTool('ar', { x: 130, y: 14 })],
      fixtures: [plates('pl', PLATES_BIG.at, { size: PLATES_BIG.size })]
    }),
    hints: [
      'Use the molecule, the arrows, the plates and "Switch Field".',
      'Identify which atom is more electronegative and bears a partial negative charge.',
      'Align the partially negative chlorine atom toward the positive plate so the molecule does not rotate.'
    ],
    check(state) {
      const b = dmolBehaviour(state.table.pieces.a, state.table);
      if (!b.around) return { ok: false, notYet: true, msg: 'Put the molecule between the plates.' };
      if (b.aligned) return { ok: true };
      return { ok: false, msg: 'The molecule would swing round when the field comes on.' };
    },
    reward: {
      log: 'The harder puller takes the minus.',
      title: 'Polar Covalent Bonds',
      body: 'Unequal sharing of electrons produces partial charges: the more electronegative chlorine atom becomes partially negative while hydrogen becomes partially positive. This creates a polar covalent bond that aligns in an electric field.',
      model: { type: 'shape', mol: 'HCl', caption: 'HCl · Polar' }
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'Two Pulls',
    prompt: 'Does carbon dioxide align in an external electric field despite possessing polar bonds?',
    cards: GUESSES,
    hints: [
      'Use the two cards and the slot.',
      'Consider whether the two opposing C=O bond dipoles cancel out.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Your prediction is recorded. Test each molecule between the electric field plates on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Five Molecules',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'sort each molecule by whether it aligns in the electric field.');
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
      'Use the arrows tool to determine whether individual bond dipoles cancel out.',
      'Place each molecule between the plates, activate the field, and sort it based on its dipole alignment.'
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
        title: 'Molecular Polarity and Symmetry',
        body: `${verdictLine(QUEST_KEY, 'stays')}A polar molecule has bond dipole moments that sum to a net dipole moment, aligning in an electric field. In symmetrical molecules like carbon dioxide and carbon tetrachloride, individual bond dipoles cancel, making them nonpolar.`,
        model: { type: 'shape', mol: 'H2O', caption: 'H₂O · Net dipole' }
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Charged Rod',
    prompt: 'Sort the liquid streams that are deflected by a charged rod into the tray.',
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
      'Observe which liquid streams are deflected toward the charged rod.',
      'Test each stream with the charged rod and place polar liquids that deflect into the tray.'
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
      title: 'Deflection of Polar Liquids',
      body: 'Molecules with permanent dipole moments reorient in the presence of an electric field and are attracted to an electrostatic charge. Consequently, streams of polar liquids deflect toward a charged rod, whereas nonpolar liquids do not.',
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
      heading: 'Summary',
      body: 'A covalent bond is polar when electrons are shared unequally due to electronegativity differences. A molecule is polar only when its bond dipoles do not cancel out due to molecular geometry.'
    },
    {
      heading: 'Symmetry and Dipoles',
      body: 'Symmetrical molecular geometries cancel equal bond dipoles, resulting in nonpolar molecules despite containing polar bonds.'
    },
    {
      heading: 'Next',
      body: 'The next bench investigates orbital hybridization and how atomic orbitals mix to form sigma and pi bonds.'
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
  [lay('ar', 'b'), lay('ar', 'd'), lay('ar', 'a'), lay('ar', 'c'), into('b', 'part'), into('d', 'part'), into('a', 'none'), into('c', 'taken')],
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
  [into('a', 'part'), into('b', 'none'), into('c', 'none'), into('d', 'none')],
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
