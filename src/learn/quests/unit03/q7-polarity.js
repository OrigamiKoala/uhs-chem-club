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
import { createTable } from '../../table/model.js';
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
      body: 'Electronegativity measures how strongly an atom pulls on shared electrons; each card prints both atoms\' values. Equal values mean equal sharing, while a very large difference means one atom takes the electron completely.'
    },
    prompt: 'How evenly does each pair of atoms share its bonding electrons?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'H2', pullRow(0), { show: ['pulls'] }), molCard('b', 'HBr', pullRow(1), { show: ['pulls'] }), molCard('c', 'KF', pullRow(2), { show: ['pulls'] }),
        molCard('d', 'HCl', pullRow(3), { show: ['pulls'] })
      ],
      zones: { trays: [
        { id: 'none', label: TRAY_NAME.none, at: { x: 22, y: 20 }, size: { w: 36, h: 26 }, cell: 26 },
        { id: 'part', label: TRAY_NAME.part, at: { x: 75, y: 20 }, size: { w: 58, h: 26 }, cell: 28 },
        { id: 'taken', label: TRAY_NAME.taken, at: { x: 128, y: 20 }, size: { w: 36, h: 26 }, cell: 26 }
      ] }
    }),
    hints: [
      'Each card prints the electronegativity of its two atoms; drag each card into a tray.',
      'Find the difference between the two values on each card, then compare those differences across the four cards.',
      'The atom with the higher electronegativity pulls the shared electrons closer; the larger the difference, the more unequal the sharing.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c', 'd'];
      const where = Object.fromEntries(ids.map(id => [id, ['none', 'part', 'taken'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all four cards into trays.' };
      const band = id => { const d = molRead(t.pieces[id]).net; return d < 0.4 ? 'none' : d < 1.7 ? 'part' : 'taken'; };
      const wrong = ids.find(id => where[id] !== band(id));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is in "${TRAY_NAME[where[wrong]]}", but its two electronegativities differ by ${molRead(t.pieces[wrong]).net.toFixed(1)}.` };
      return { ok: true };
    },
    reward: {
      log: 'The bigger the difference, the less evenly the pair is shared.',
      title: 'Electronegativity Difference',
      body: 'H₂ shares equally, HBr and HCl share unequally, and in KF fluorine takes the electron. The larger the electronegativity difference, the more unequal the sharing.',
      model: { type: 'electronegativity-pull', left: 'H', right: 'Cl', enLeft: 2.2, enRight: 3.2, caption: 'More electronegative chlorine pulls the shared electrons closer.' }
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Which End',
    briefing: {
      speaker: SPEAKER,
      body: 'When electrons are shared unequally, the atom they sit closer to is slightly negative (δ−) and the other is slightly positive (δ+): these are partial charges. A bond with partial charges is a polar covalent bond, and its two charged ends form a dipole.'
    },
    prompt: 'Which way should HCl face so the electric field does not rotate it?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('a', 'HCl', { x: 75, y: 53 }, { turn: true, show: ['pulls'], extra: { showDipoles: true } })],
      fixtures: [plates('pl', { x: 75, y: 21 }, { size: PLATES_BIG.size, flipPiece: 'a' })]
    }),
    hints: [
      'Drag the molecule between the plates, press "Rotate Molecule" to flip it end for end, and press "Switch Field" to test if it turns.',
      'Compare the electronegativities of hydrogen and chlorine on the card, and check which way the bond dipole arrow points.',
      'Opposite charges attract, so point the slightly negative end (δ−) toward the positive (+) plate.'
    ],
    check(state) {
      const b = dmolBehaviour(state.table.pieces.a, state.table);
      if (!b.around) return { ok: false, notYet: true, msg: 'Put the molecule between the plates.' };
      if (b.aligned) return { ok: true };
      return { ok: false, msg: 'The molecule still turns when the field switches on. Rotate it so the negative end faces the positive (+) plate.' };
    },
    reward: {
      log: 'The chlorine end faces the positive plate.',
      title: 'Polar Covalent Bond',
      body: 'The chlorine end faces the positive plate. Chlorine is more electronegative, so the shared electrons sit closer to it, giving partial charges δ− on chlorine and δ+ on hydrogen: a polar covalent bond.',
      model: { type: 'shape', mol: 'HCl', caption: 'HCl · Polar' }
    }
  },

  /* ---------------------------------------------------------------- 3 */
  predictStage({
    key: QUEST_KEY,
    title: 'Two Bond Dipoles',
    prompt: 'Both bonds in carbon dioxide (O=C=O) are polar: does the whole molecule turn in an electric field?',
    cards: GUESSES,
    hints: [
      'Drag one of the two prediction cards into the slot.',
      'Carbon dioxide is linear, so its two bonds point in opposite directions from carbon.',
      'Predictions are never graded, so pick the card you think is most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage tests carbon dioxide and four other molecules between the plates.'
    }
  }),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Five Molecules',
    briefing: {
      speaker: SPEAKER,
      body: 'A molecule with a δ− side and a δ+ side turns in an electric field and is polar. One whose bond dipoles cancel out symmetrically around the center has no charged sides and is nonpolar.'
    },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'which of these five molecules are polar?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'CO2', rowAt(0), { field: true, extra: { showDipoles: true } }),
        molCard('b', 'H2O', rowAt(1), { field: true, extra: { showDipoles: true } }),
        molCard('c', 'CCl4', rowAt(2), { field: true, extra: { showDipoles: true } }),
        molCard('d', 'NH3', rowAt(3), { field: true, extra: { showDipoles: true } }),
        molCard('e', 'CHCl3', rowAt(4), { field: true, extra: { showDipoles: true } })
      ],
      zones: { trays: [{ id: 'turns', label: 'Polar', at: { x: 96, y: 18 }, size: { w: 46, h: 24 }, cell: 22 }, { id: 'stays', label: 'Nonpolar', at: { x: 134, y: 18 }, size: { w: 28, h: 24 }, cell: 22 }] },
      fixtures: [plates('pl', { x: 34, y: 21 }, { size: { w: 62, h: 40 } })]
    }),
    hints: [
      'Drag each molecule between the plates and press "Switch Field"; each card already shows its bond dipole arrows.',
      'Compare the directions of the bond dipole arrows in a molecule that turned with one that did not.',
      'Equal bond dipoles spaced symmetrically around the central atom cancel out, leaving neither side more negative than the other.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c', 'd', 'e'];
      const where = Object.fromEntries(ids.map(id => [id, ['turns', 'stays'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all five molecules into trays.' };
      const wrong = ids.find(id => where[id] !== (molRead(t.pieces[id]).polar ? 'turns' : 'stays'));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is in the wrong tray: test it again between the plates with the field on.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Water, ammonia and chloroform turned. Carbon dioxide and carbon tetrachloride did not.',
        title: 'Polar and Nonpolar Molecules',
        body: `${verdictLine(QUEST_KEY, 'stays')}In CO₂ and CCl₄, equal bond dipoles are arranged symmetrically around the central atom and cancel, so they are nonpolar. In H₂O, NH₃, and CHCl₃ they do not cancel, so those molecules are polar.`,
        model: { type: 'shape', mol: 'H2O', caption: 'H₂O · Polar' }
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'How Ionic Is It',
    briefing: {
      speaker: SPEAKER,
      body: 'Dipole strength is measured in debye (D). Full electron transfer would produce the maximum possible dipole, and percent ionic character is the measured dipole as a percentage of that maximum:',
      worked: [
        'Hydrogen fluoride: measured dipole = 1.82 D.',
        `Full electron transfer would give ${fullDipole('HF').toFixed(2)} D.`,
        `1.82 ÷ ${fullDipole('HF').toFixed(2)} = 0.41, or 41%.`
      ]
    },
    prompt: 'What is the percent ionic character of the H–Cl bond?',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('hcl', 'HCl', { x: 40, y: 32 }, { show: ['dipole'] })],
      fixtures: [marker('ionic', { x: 104, y: 32 }, { label: 'Percent', max: 100 })]
    }),
    hints: [
      'The card prints the measured dipole of H–Cl and the dipole a full transfer would give; set your answer on the dial.',
      'Compare the measured dipole with the full-transfer dipole; the bar on the card shows how far the shared electrons have shifted.',
      'Divide the measured dipole by the full-transfer dipole and convert to a percent, just like in the HF example.'
    ],
    check(state) {
      const v = markerValue(state.table, 'ionic');
      if (!v) return { ok: false, notYet: true, msg: 'Set the dial to a percent.' };
      const want = Math.round(ionicPercent('HCl'));
      if (Math.abs(v - want) <= 2) return { ok: true };
      return { ok: false, msg: `${v}% of the full-transfer dipole would be ${(v / 100 * fullDipole('HCl')).toFixed(2)} D, which does not match the measured dipole.` };
    },
    reward: {
      log: 'The measured dipole is about 18% of a full transfer.',
      title: 'Percent Ionic Character',
      body: 'About 18%: the shared electrons shift toward chlorine but are far from completely transferred. Percent ionic character puts a number on how unequal the sharing is.',
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
      body: 'The larger the electronegativity difference between two atoms, the less equally they share electrons. Unequal sharing gives a bond a δ− end and a δ+ end: a polar covalent bond.'
    },
    {
      heading: 'Whole Molecules',
      body: 'A molecule is polar only if its bond dipoles do not cancel. Shape decides: linear CO₂ is nonpolar even though its bonds are polar, while bent H₂O is polar.'
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

/** How far stage `n`'s field plates stand from where they are drawn (`table/near.js` may move the rig nearer the player). */
const rigDy = n => {
  const built = createTable(STAGES[n].table, STAGES[n].title);
  const drawn = createTable({ ...STAGES[n].table, layout: 'as-drawn' }, STAGES[n].title);
  return built.fixtures.pl.at.y - drawn.fixtures.pl.at.y;
};
const gap = (id, n, x = 37, y = 21) => ({ place: { piece: id, to: `free:${x},${y + rigDy(n)}` } });
const lay = (toolId, id) => ({ join: [toolId, id] });
const field = { run: 'pl' };
const into = (id, zone) => ({ place: { piece: id, to: `tray:${zone}` } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [into('b', 'part'), into('d', 'part'), into('a', 'none'), into('c', 'taken')],
  [gap('a', 1, 75), { flip: 'a' }],
  [guess('stays')],
  [
    gap('a', 3, 34), field, into('a', 'stays'),
    gap('b', 3, 34), into('b', 'turns'), gap('c', 3, 34), into('c', 'stays'), gap('d', 3, 34), into('d', 'turns'), gap('e', 3, 34), into('e', 'turns')
  ],
  [{ setDial: { fixture: 'ionic', dial: 'value', value: 18 } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [into('a', 'part'), into('b', 'none'), into('c', 'none'), into('d', 'none')],
  [gap('a', 1, 75)],
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
