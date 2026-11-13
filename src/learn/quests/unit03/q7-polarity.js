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
import { RIG_MOLECULES, planDipole, bondKind, EN, ionicPercent, BOND_DIPOLE, E_DEBYE_PER_ANGSTROM } from '../../engine/vsepr.js';
import {
  domainTable, plates, marker, markerValue, molCard, molOf, molRead, arrowsTool, dmolBehaviour, platesAround, fieldIsOn, platesOf
} from '../../table/kits/domain.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\belectronegativ\w*/i, introducedAt: 1 },
  { term: /\bmolecular dipoles?\b|\bdipoles?\b/i, introducedAt: 4 },
  { term: /\bnonpolar\b/i, introducedAt: 4 },
  { term: /\bpolar\b/i, introducedAt: 2 },
  { term: /\bpartial charges?\b/i, introducedAt: 2 },
  { term: /\bpercent ionic character\b/i, introducedAt: 5 }
];

export const BUILDS_ON = ['unit03/q6-shape', 'unit03/q1-joins', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q7-polarity';
const GUESSES = [
  ['turns', 'carbon dioxide turns in the field', ['CO₂ turns', 'Both its bonds', 'are polar']],
  ['stays', 'carbon dioxide does not turn', ['CO₂ does not turn', 'whatever its', 'bonds are like']]
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
const TRAY_NAME = { none: 'Shared equally', part: 'Shared unequally', taken: 'One atom takes it', turns: 'Turns: polar', stays: 'Does not turn: nonpolar' };
/** The dipole a full transfer of one electron would give across a bond of this length, in debye (stage 5 prints it on the card). */
const fullDipole = mol => E_DEBYE_PER_ANGSTROM * BOND_DIPOLE[mol].pm / 100;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'How Evenly Is It Shared',
    briefing: {
      speaker: SPEAKER,
      body: 'Electronegativity is how strongly an atom pulls on electrons it shares; each card prints it for both of its atoms. Atoms with equal values share a pair equally, and a very large difference lets one atom take the pair altogether.'
    },
    prompt: 'How evenly does each pair of atoms share its bonding electrons?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'H2', pullRow(0), { show: ['pulls'] }), molCard('b', 'HBr', pullRow(1), { show: ['pulls'] }), molCard('c', 'KF', pullRow(2), { show: ['pulls'] }),
        molCard('d', 'HCl', pullRow(3), { show: ['pulls'] })
      ],
      zones: { trays: [
        { id: 'none', label: TRAY_NAME.none, at: { x: 26, y: 20 }, size: { w: 46, h: 24 }, cell: 22 },
        { id: 'part', label: TRAY_NAME.part, at: { x: 75, y: 20 }, size: { w: 46, h: 24 }, cell: 22 },
        { id: 'taken', label: TRAY_NAME.taken, at: { x: 124, y: 20 }, size: { w: 46, h: 24 }, cell: 22 }
      ] }
    }),
    hints: [
      'Each card prints the electronegativity of its two atoms; drag each card into a tray.',
      'Compare the two values on one card with each other, then compare that difference with the other cards\'.',
      'The atom with the higher value pulls the shared pair toward itself, and the larger the difference, the further the pair shifts.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c', 'd'];
      const where = Object.fromEntries(ids.map(id => [id, ['none', 'part', 'taken'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all four cards into trays.' };
      const band = id => { const d = molRead(t.pieces[id]).net; return d < 0.4 ? 'none' : d < 1.7 ? 'part' : 'taken'; };
      const wrong = ids.find(id => where[id] !== band(id));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is in "${TRAY_NAME[where[wrong]]}", but the two electronegativities on its card differ by ${molRead(t.pieces[wrong]).net.toFixed(1)}.` };
      return { ok: true };
    },
    reward: {
      log: 'The bigger the difference, the less evenly the pair is shared.',
      title: 'Electronegativity Difference',
      body: 'H₂ shares equally, HBr and HCl unequally, and in KF fluorine takes the electron. The larger the difference in electronegativity, the more unequal the sharing.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Which End',
    briefing: {
      speaker: SPEAKER,
      body: 'When a pair is shared unequally, the atom it sits closer to is slightly negative, written δ−, and the other slightly positive, δ+: these are partial charges. A bond with partial charges is a polar covalent bond, and its two charged ends are called a dipole.'
    },
    prompt: 'Which end of a hydrogen chloride molecule faces the positive plate when the field is on?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('a', 'HCl', rowAt(0), { turn: true, show: ['pulls'] }), arrowsTool('ar', { x: 130, y: 14 })],
      fixtures: [plates('pl', PLATES_BIG.at, { size: PLATES_BIG.size })]
    }),
    hints: [
      'Drag the molecule between the plates and turn it end for end; "Switch Field" turns the field on and off.',
      'Compare the electronegativities of hydrogen and chlorine printed on the card, and which way the dipole arrow points.',
      'Opposite charges attract, so decide which atom is δ− and which plate that end is drawn to.'
    ],
    check(state) {
      const b = dmolBehaviour(state.table.pieces.a, state.table);
      if (!b.around) return { ok: false, notYet: true, msg: 'Put the molecule between the plates.' };
      if (b.aligned) return { ok: true };
      return { ok: false, msg: 'Set this way the molecule swings round when the field is on: the end facing the positive plate is not its δ− end.' };
    },
    reward: {
      log: 'The chlorine end faces the positive plate.',
      title: 'Polar Covalent Bond',
      body: 'The chlorine end. Chlorine is more electronegative, so the shared pair sits closer to it and the partial charges are δ− on chlorine and δ+ on hydrogen: a polar covalent bond.',
      model: { type: 'shape', mol: 'HCl', caption: 'HCl · Polar' }
    }
  },

  /* ---------------------------------------------------------------- 3 */
  predictStage({
    key: QUEST_KEY,
    title: 'Two Bond Dipoles',
    prompt: 'Both bonds in carbon dioxide, O=C=O, are polar: does the whole molecule turn in an electric field?',
    cards: GUESSES,
    hints: [
      'Lay one of the two cards in the slot.',
      'Carbon dioxide is linear, so its two bonds point in opposite directions from the carbon atom.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage puts carbon dioxide and four other molecules between the plates.'
    }
  }),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Five Molecules',
    briefing: {
      speaker: SPEAKER,
      body: 'A molecule that has a δ− side and a δ+ side turns in an electric field and is called polar. One whose bond dipoles balance symmetrically around the centre has no such sides and is called nonpolar.'
    },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'which of these five molecules are polar?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'CO2', rowAt(0), { field: true }), molCard('b', 'H2O', rowAt(1), { field: true }), molCard('c', 'CCl4', rowAt(2), { field: true }),
        molCard('d', 'NH3', rowAt(3), { field: true }), molCard('e', 'CHCl3', rowAt(4), { field: true }),
        arrowsTool('ar', { x: 69, y: 22 })
      ],
      zones: { trays: [{ id: 'turns', label: 'Polar', at: { x: 100, y: 18 }, size: { w: 32, h: 22 }, cell: 22 }, { id: 'stays', label: 'Nonpolar', at: { x: 133, y: 18 }, size: { w: 32, h: 22 }, cell: 22 }] },
      fixtures: [plates('pl', { x: 27, y: 21 }, { size: { w: 52, h: 40 } })]
    }),
    hints: [
      'Drag a molecule between the plates and press "Switch Field"; drag the dipole arrows onto a molecule to see each bond\'s dipole.',
      'Compare the directions of the bond dipole arrows in a molecule that turned with those in one that did not.',
      'Equal arrows spread evenly round the central atom leave no side of the molecule more negative than another.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c', 'd', 'e'];
      const where = Object.fromEntries(ids.map(id => [id, ['turns', 'stays'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all five molecules into trays.' };
      const wrong = ids.find(id => where[id] !== (molRead(t.pieces[id]).polar ? 'turns' : 'stays'));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is in a tray that does not match what it did between the plates: test it again with the field on.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Water, ammonia and chloroform turned. Carbon dioxide and carbon tetrachloride did not.',
        title: 'Polar and Nonpolar Molecules',
        body: `${verdictLine(QUEST_KEY, 'stays')}In CO₂ and CCl₄ equal bond dipoles are spread evenly round the central atom and balance, so the molecules are nonpolar. In H₂O, NH₃ and CHCl₃ they do not balance, so those molecules are polar.`,
        model: { type: 'shape', mol: 'H2O', caption: 'H₂O · Polar' }
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'How Ionic Is It',
    briefing: {
      speaker: SPEAKER,
      body: 'The size of a dipole is measured in debye, D. If one atom took the shared pair completely the dipole would be as large as it can be, and percent ionic character is the measured dipole as a percent of that.',
      worked: [
        'Hydrogen fluoride: measured dipole 1.82 D.',
        `Full transfer would give ${fullDipole('HF').toFixed(2)} D.`,
        `1.82 ÷ ${fullDipole('HF').toFixed(2)} = 0.41, so 41%.`
      ]
    },
    prompt: 'What is the percent ionic character of the H–Cl bond?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('hcl', 'HCl', { x: 40, y: 32 }, { show: ['dipole'] })],
      fixtures: [marker('ionic', { x: 104, y: 32 }, { label: 'Percent', max: 100 })]
    }),
    hints: [
      'The card prints the measured dipole of H–Cl and the dipole a full transfer would give; the dial sets your answer.',
      'Compare the measured dipole with the full-transfer dipole: the bar on the card shows how far the shared pair has shifted.',
      'The worked case for hydrogen fluoride shows where the two dipoles go in the division.'
    ],
    check(state) {
      const v = markerValue(state.table, 'ionic');
      if (!v) return { ok: false, notYet: true, msg: 'Set the dial to a percent.' };
      const want = Math.round(ionicPercent('HCl'));
      if (Math.abs(v - want) <= 2) return { ok: true };
      return { ok: false, msg: `${v}% of the full-transfer dipole would be ${(v / 100 * fullDipole('HCl')).toFixed(2)} D, which is not the dipole measured.` };
    },
    reward: {
      log: 'The measured dipole is about 18% of a full transfer.',
      title: 'Percent Ionic Character',
      body: 'About 18%: the shared pair is shifted toward chlorine but far from transferred. Percent ionic character puts a number on how unequal the sharing is.',
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
      body: 'The more two atoms differ in electronegativity, the less equally they share a pair. Unequal sharing gives a bond a δ− end and a δ+ end: a polar covalent bond.'
    },
    {
      heading: 'Whole Molecules',
      body: 'A molecule is polar only if its bond dipoles do not balance. Shape decides: linear CO₂ is nonpolar although its bonds are polar, and bent H₂O is polar.'
    },
    {
      heading: 'Next',
      body: 'The next bench asks which orbitals an atom uses to make its bonds.'
    }
  ]
};

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
  [into('b', 'part'), into('d', 'part'), into('a', 'none'), into('c', 'taken')],
  [gap('a'), { flip: 'a' }],
  [guess('stays')],
  [
    gap('a'), lay('ar', 'a'), field, into('a', 'stays'),
    gap('b'), into('b', 'turns'), gap('c'), into('c', 'stays'), gap('d'), into('d', 'turns'), gap('e'), into('e', 'turns')
  ],
  [{ setDial: { fixture: 'ionic', dial: 'value', value: 18 } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [into('a', 'part'), into('b', 'none'), into('c', 'none'), into('d', 'none')],
  [gap('a')],
  [],
  [into('a', 'turns'), into('b', 'turns'), into('c', 'stays'), into('d', 'turns'), into('e', 'turns')],
  [{ setDial: { fixture: 'ionic', dial: 'value', value: 100 } }]
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
