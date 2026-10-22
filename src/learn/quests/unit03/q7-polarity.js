/**
 * q7-polarity.js — Ligar, bench seven: POLARITY.
 *
 * The seventh bench on the world and its fifth TABLETOP (plan `bench-tabletop.md`, phase T3b). Two charged plates stand
 * on the plate with a gap between them, and a molecule is a card that is put there. Switch Field charges the plates, and a
 * molecule whose bond pulls do not cancel swings round to line up with the field; one whose pulls cancel stays as it stood.
 * The ARROWS tool, laid on a molecule, draws each bond's pull and their sum. A charged rod is laid on a stream of liquid.
 *
 *   1  turn H-Cl so its partial negative end faces the positive plate   -> partial charge, polar bond
 *   2  tray three bonds by how evenly they share                        -> nonpolar covalent, polar covalent
 *   3  predict whether CO2 turns, then switch the field on              -> molecular dipole
 *   4  tray water and carbon dioxide by whether their arrows add        -> bond dipole
 *   5  change one atom of CCl4 so it turns                              -> (symmetry cancels)
 *   6  predict which of NH3 and BF3 turns, then switch the field on     -> (a lone pair breaks symmetry)
 *   7  tray three molecules polar or nonpolar                           -> (the field sorts them)
 *   8  tray the streams a charged rod bends                             -> (polar liquids bend)
 *
 * EVERY TURN IS `vsepr.planDipole`: the bond pulls are electronegativity differences along the arm vectors `planDomains`
 * settled, summed. A card between the bars is drawn swung round when the field is on and its pulls add up, as they say, and
 * not otherwise (`kits/domain-field.js`). A stream bends toward the rod exactly when its molecules' pulls add up.
 *
 * FIELD (stage 8, evidence and never a lock): a stream drawn from the sump, in the pump station down the decline. At 3D On
 * the player walks to the sump (`ligar/stations.js` `buildSumpStation`, the field point `sump`); below that the same fetch
 * is a drawn site plate on the table.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { RIG_MOLECULES, planDipole, bondKind } from '../../engine/vsepr.js';
import {
  domainTable, plates, molCard, molOf, molRead, streamPiece, arrowsTool, rodTool, swapTool, dmolBehaviour, platesAround, fieldIsOn, platesOf
} from '../../table/kits/domain.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bbond dipoles?\b/i, introducedAt: 4 },
  { term: /\bmolecular dipoles?\b|\bdipoles?\b/i, introducedAt: 3 },
  { term: /\bpolar covalent\b/i, introducedAt: 2 },
  { term: /\bnonpolar\b/i, introducedAt: 2 },
  { term: /\bpolar\b/i, introducedAt: 1 },
  { term: /\bpartial charges?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q6-shape', 'unit03/q1-joins', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

/** Every piece says what it is ("Arrows", "Charged Rod", "Swap H") and the field key is named by what it does, so no key needs a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   The plates at the left, a molecule a card. A stage that sorts has its trays in a column at the right; a stage that does not
   has the tools there. Cards start in a row under the plates (or, where the stage is a test, already between them).
   ------------------------------------------------------------------ */

const PLATES_BIG = { at: { x: 52, y: 21 }, size: { w: 100, h: 40 } };
const PLATES_SHORT = { at: { x: 37, y: 20 }, size: { w: 70, h: 38 } };

const rowAt = (i, y = 53) => ({ x: 15 + i * 28, y });
/** The trays stand in a grid at the right of the plates: two across, as many down as the stage needs. */
const TRAY_SPOTS = [{ x: 100, y: 19 }, { x: 133, y: 19 }, { x: 100, y: 50 }, { x: 133, y: 50 }];
const grid = labels => labels.map(([id, label], i) => ({ id, label, at: { ...TRAY_SPOTS[i] }, size: { w: 32, h: 26 }, cell: 26 }));

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Which End',
    briefing: {
      speaker: SPEAKER,
      body: 'Switch Field charges the two plates, the left one positive and the right one negative; the arrows tool, laid on a molecule, draws the pull across each bond. Press Submit when the table shows your answer.'
    },
    prompt: 'Turn the hydrogen chloride molecule so that its partial negative end faces the positive plate.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('a', 'HCl', rowAt(0), { turn: true }), arrowsTool('ar', { x: 130, y: 14 })],
      fixtures: [plates('pl', PLATES_BIG.at, { size: PLATES_BIG.size })]
    }),
    hints: [
      'Put the molecule between the plates and switch the field on to see which way it swings.',
      'Compare the arrow across the bond, and the end that swings toward the positive plate, with each atom\'s pull.',
      'The end that pulls the shared pair harder is the end that swings toward the positive plate.'
    ],
    check(state) {
      const b = dmolBehaviour(state.table.pieces.a, state.table);
      if (!b.around) return { ok: false, notYet: true, msg: 'Put the molecule between the plates.' };
      if (b.aligned) return { ok: true };
      return { ok: false, msg: 'Switch the field on: the molecule swings round, so it is not set the way the field wants it.' };
    },
    reward: {
      log: 'The harder puller takes the minus.',
      title: 'Partial Charge, Polar Bond',
      body: 'An atom that pulls the shared pair harder ends up with a partial negative charge, and the atom at the other end with a partial positive one. A bond like that is a polar bond.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Three Bonds',
    prompt: 'Classify each bond by how evenly it shares its electron pair.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'NaCl', rowAt(0), { field: true }),
        molCard('b', 'H2', rowAt(1), { field: true }),
        molCard('c', 'HCl', rowAt(2), { field: true }),
        arrowsTool('ar', { x: 133, y: 45 })
      ],
      zones: { trays: grid([['even', 'Evenly'], ['uneven', 'Unevenly'], ['given', 'Handed over']]) },
      fixtures: [plates('pl', PLATES_SHORT.at, { size: PLATES_SHORT.size })]
    }),
    hints: [
      'Put each molecule between the plates, lay the arrows on it and read the net pull.',
      'Compare the size of the net pull on each card.',
      'Rank the three by the size of the pull and sort them from none, through some, to nearly all.'
    ],
    check(state) {
      const t = state.table;
      const want = { a: 'given', b: 'even', c: 'uneven' };
      const where = Object.fromEntries(Object.keys(want).map(id => [id, ['even', 'uneven', 'given'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all three bonds into trays.' };
      if (Object.keys(want).every(id => where[id] === want[id])) return { ok: true };
      return { ok: false, msg: 'Compare the pull on each card: the bond that pulls most is not shared like the one that pulls least.' };
    },
    reward: {
      log: 'A spectrum from even to handed over.',
      title: 'Nonpolar, Polar, Ionic',
      body: 'Atoms of the same element share a pair evenly, a nonpolar covalent bond. A small difference in pull makes a polar covalent bond, and a large one hands the pair over entirely, an ionic bond.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Pulls, No Turn',
    prompt: 'Predict whether the linear carbon dioxide molecule turns between the plates, then switch the field on.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('a', 'CO2', rowAt(0), { field: true }), arrowsTool('ar', { x: 60, y: 53 })],
      fixtures: [plates('pl', PLATES_SHORT.at, { size: PLATES_SHORT.size })],
      prediction: {
        slot: { id: 'predict', label: 'In the field', at: { x: 125, y: 12 }, size: { w: 26, h: 12 } },
        tokens: [{ id: 'turns', label: 'Turns', at: { x: 100, y: 34 }, r: 6.5 }, { id: 'stays', label: 'Does not turn', at: { x: 118, y: 52 }, r: 6.5 }]
      }
    }),
    hints: [
      'Put the prediction in its place, lay the arrows on the molecule and switch the field on.',
      'Compare the pull of one bond with the pull of the other, and the direction each arrow points.',
      'Equal pulls in exactly opposite directions leave nothing to turn the molecule.'
    ],
    check(state) {
      const t = state.table;
      const token = t.prediction.token;
      if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
      const real = molRead(t.pieces.a).polar ? 'turns' : 'stays';
      if (token === real) return { ok: true };
      const tested = platesOf(t).some(fieldIsOn) && platesAround(t.pieces.a, t);
      return tested
        ? { ok: false, msg: 'With the field on, the molecule did not move. Lay the arrows on it and compare the two bond pulls.' }
        : { ok: false, msg: 'Switch the field on with the molecule between the plates, then compare it with the prediction.' };
    },
    reward: {
      log: 'Polar bonds, no net pull.',
      title: 'Molecular Dipole',
      body: 'A molecule whose bond pulls do not cancel has a molecular dipole and swings round in a field. Carbon dioxide has two polar bonds but no molecular dipole, because the pulls oppose each other equally.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Bent and Straight',
    prompt: 'Sort each molecule into a tray by whether its bond arrows add up to a net arrow or cancel.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [molCard('a', 'H2O', rowAt(0), { field: true }), molCard('b', 'CO2', rowAt(1), { field: true }), arrowsTool('ar', { x: 133, y: 45 })],
      zones: { trays: grid([['add', 'Arrows add up'], ['cancel', 'Arrows cancel']]) },
      fixtures: [plates('pl', PLATES_SHORT.at, { size: PLATES_SHORT.size })]
    }),
    hints: [
      'Put each molecule between the plates, lay the arrows on it and switch the field on.',
      'Compare the directions of the bond arrows on each card with the arrow they add up to.',
      'Arrows pointing different ways add to a net arrow, while arrows pointing straight against each other cancel.'
    ],
    check(state) {
      const t = state.table;
      const where = Object.fromEntries(['a', 'b'].map(id => [id, ['add', 'cancel'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort both molecules into trays.' };
      if (['a', 'b'].every(id => where[id] === (molRead(t.pieces[id]).polar ? 'add' : 'cancel'))) return { ok: true };
      return { ok: false, msg: 'A molecule is under the wrong heading. Lay the arrows on each and compare the direction of the bond arrows with the arrow they add up to.' };
    },
    reward: {
      log: 'Arrows add or cancel.',
      title: 'Bond Dipoles Add or Cancel',
      body: 'Each polar bond pulls like an arrow, a bond dipole. In a bent molecule the arrows add up to a net pull, and in a straight one they cancel.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'One Hydrogen',
    briefing: {
      speaker: SPEAKER,
      body: 'A swap tool, laid on a molecule, changes one of its outer atoms to the atom the tool names.'
    },
    prompt: 'Change one atom of the carbon tetrachloride molecule so that it turns in the field.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'CCl4', rowAt(0), { field: true, extra: { hub: 'C', arms: RIG_MOLECULES.CCl4.arms.map(a => ({ ...a })) } }),
        arrowsTool('ar', { x: 130, y: 12 }), swapTool('swh', 'H', { x: 130, y: 30 }), swapTool('swc', 'Cl', { x: 130, y: 48 })
      ],
      fixtures: [plates('pl', PLATES_BIG.at, { size: PLATES_BIG.size })]
    }),
    hints: [
      'Lay a swap tool on the molecule to change one of its outer atoms, then switch the field on.',
      'Compare the net pull of the molecule before and after the swap, with the arrows laid on it.',
      'A molecule only fails to turn when every pull on one side is matched by an equal pull on the other.'
    ],
    check(state) {
      const read = molRead(state.table.pieces.a);
      const changed = read.arms.filter(a => a.kind === 'atom' && a.sym !== 'Cl').length;
      if (changed === 0) return { ok: false, notYet: true, msg: 'Swap one of the outer atoms.' };
      if (changed > 1) return { ok: false, msg: 'More than one atom has changed. Swap the others back until only one differs.' };
      if (read.polar) return { ok: true };
      return { ok: false, msg: 'With that atom changed the pulls still cancel. Switch the field on and watch whether the molecule moves.' };
    },
    reward: {
      log: 'One different atom breaks the balance.',
      title: 'Symmetry Cancels',
      body: 'Identical atoms placed evenly round the centre pull equally in every direction, so CCl₄ has no net pull. Swap one for a different atom and the balance is gone.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Flat and Pyramid',
    prompt: 'Predict which of ammonia and boron trifluoride turns between the plates, then switch the field on.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'NH3', rowAt(0), { field: true }), molCard('b', 'BF3', rowAt(1), { field: true }),
        arrowsTool('ar', { x: 80, y: 53 })
      ],
      fixtures: [plates('pl', { x: 44, y: 21 }, { size: { w: 84, h: 40 } })],
      prediction: {
        slot: { id: 'predict', label: 'The one that turns', at: { x: 119, y: 12 }, size: { w: 26, h: 12 } },
        tokens: [
          { id: 'nh3', label: 'NH₃ only', at: { x: 101, y: 36 }, r: 6.5 }, { id: 'bf3', label: 'BF₃ only', at: { x: 133, y: 36 }, r: 6.5 },
          { id: 'both', label: 'Both', at: { x: 104, y: 54 }, r: 6.5 }, { id: 'neither', label: 'Neither', at: { x: 134, y: 54 }, r: 6.5 }
        ]
      }
    }),
    hints: [
      'Lay the arrows on both molecules, then switch the field on.',
      'Compare where the bond arrows point on each card, flat in a plane or leaning to one side.',
      'Bonds that lie in a plane round the centre can cancel, while bonds that lean to one side cannot.'
    ],
    check(state) {
      const t = state.table;
      const token = t.prediction.token;
      if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
      const turns = ['a', 'b'].filter(id => molRead(t.pieces[id]).polar);
      const real = turns.length === 2 ? 'both' : turns.length === 0 ? 'neither' : turns[0] === 'a' ? 'nh3' : 'bf3';
      if (token === real) return { ok: true };
      const tested = platesOf(t).some(fieldIsOn) && ['a', 'b'].every(id => platesAround(t.pieces[id], t));
      return tested
        ? { ok: false, msg: 'With the field on, one molecule swung round and the other did not. Lay the arrows on both and compare where the bond arrows point.' }
        : { ok: false, msg: 'Switch the field on with both molecules between the plates, then compare them with the prediction.' };
    },
    reward: {
      log: 'A lone pair makes the bonds lean one way.',
      title: 'Shape Decides',
      body: 'Ammonia\'s lone pair makes its three bonds lean to one side, so they cannot cancel. Boron trifluoride\'s three bonds lie flat and cancel exactly, even though each one is strongly polar.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Three Molecules',
    prompt: 'Classify each of the three molecules as polar or nonpolar.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'XeF4', rowAt(0), { field: true }), molCard('b', 'SF4', rowAt(1), { field: true }), molCard('c', 'CHCl3', rowAt(2), { field: true }),
        arrowsTool('ar', { x: 133, y: 45 })
      ],
      zones: { trays: grid([['polar', 'Polar'], ['nonpolar', 'Nonpolar']]) },
      fixtures: [plates('pl', PLATES_SHORT.at, { size: PLATES_SHORT.size })]
    }),
    hints: [
      'Put each molecule between the plates, lay the arrows on it and switch the field on.',
      'Compare the net pull on each card, if there is one, after the bond arrows are added.',
      'Sort a molecule as polar when its bond arrows add to a net arrow and as nonpolar when they cancel.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c'];
      const where = Object.fromEntries(ids.map(id => [id, ['polar', 'nonpolar'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all three molecules into trays.' };
      if (ids.every(id => where[id] === (molRead(t.pieces[id]).polar ? 'polar' : 'nonpolar'))) return { ok: true };
      return { ok: false, msg: 'A molecule is under the wrong heading. Switch the field on for the one you are unsure of and watch whether it turns.' };
    },
    reward: {
      log: 'The field sorts molecules.',
      title: 'The Field Sorts Them',
      body: 'A molecule is polar when its bond dipoles add to a net pull and nonpolar when they cancel. Its shape matters as much as its bonds.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Charged Rod',
    briefing: {
      speaker: SPEAKER,
      body: 'Lay the charged rod on a stream to bring it close. A stream drawn from the sump is waiting at the pumps.'
    },
    prompt: 'Put the streams that a charged rod bends into the tray.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        streamPiece('s1', 'CCl4', { x: 24, y: 21 }), streamPiece('s2', 'CHCl3', { x: 56, y: 21 }), streamPiece('s3', 'H2O', { x: 88, y: 21 }),
        { ...streamPiece('s4', 'H2O', { x: 120, y: 21 }, { note: 'Sump' }), hidden: true, fetchFrom: 'sump' },
        rodTool('rod', { x: 136, y: 14 })
      ],
      zones: { trays: [{ id: 'bent', label: 'Bent by the rod', at: { x: 62, y: 51 }, size: { w: 90, h: 24 }, cell: 20 }] },
      fetch: [{ id: 'sump', label: 'Sump stream', at: { x: 124, y: 54 } }]
    }),
    hints: [
      'Lay the charged rod on one stream at a time and watch which way the stream runs.',
      'Compare the streams that bend with what the molecules of each liquid do in the field.',
      'A charged rod bends the stream of a liquid whose molecules turn in the field.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['s1', 's2', 's3'];
      const bent = ids.filter(id => t.pieces[id].zone === 'tray:bent');
      const want = ids.filter(id => molRead(t.pieces[id]).polar);
      if (!bent.length) return { ok: false, notYet: true, msg: 'Put the streams the rod bends into the tray.' };
      if (bent.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'A stream in the tray is not bent by the rod, or one that bends is not there. Lay the rod on each stream and watch.' };
    },
    reward: {
      log: 'Polar liquids bend; nonpolar ones do not.',
      title: 'Polar Liquids Bend',
      body: 'A stream of molecules that turn in a field is pulled by a charged rod, and a stream of molecules that do not turn is left alone. How strongly molecules attract each other follows the same rule, which is the next unit\'s question.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the molecule between the plates,', 'then press Switch Field.'],
  8: ['Lay the rod on a stream.']
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
      body: 'A bond is polar when its atoms pull the pair unequally, and a molecule is polar when those pulls do not cancel. Shape decides: symmetrical molecules cancel their pulls even when every bond is strongly polar.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Whether a molecule is polar decides what it dissolves in, how it attracts its neighbours and how it behaves near a charge. You can now tell from a Lewis structure and a shape.'
    },
    {
      heading: 'Next',
      body: 'The last of the shape benches asks what the orbitals look like that make these bonds, and why some bonds turn and some will not.'
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
   direct actions, by drag and by two taps. A molecule is put between the plates (`gap`), the arrows or a swap laid on it, the
   field switched, a card put in a tray: nothing here says what a molecule does in a field.
   ------------------------------------------------------------------ */

const gap = (id, x = 37, y = 21) => ({ place: { piece: id, to: `free:${x},${y}` } });
const lay = (toolId, id) => ({ join: [toolId, id] });
const field = { run: 'pl' };
const into = (id, zone) => ({ place: { piece: id, to: `tray:${zone}` } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [gap('a'), { flip: 'a' }],
  [gap('a'), lay('ar', 'a'), into('a', 'given'), gap('b'), lay('ar', 'b'), into('b', 'even'), gap('c'), lay('ar', 'c'), into('c', 'uneven')],
  [gap('a'), lay('ar', 'a'), field, { predict: 'stays' }],
  [gap('a'), lay('ar', 'a'), into('a', 'add'), gap('b'), lay('ar', 'b'), into('b', 'cancel')],
  [gap('a', 52, 27), lay('swh', 'a'), lay('ar', 'a'), field],
  [gap('a', 32, 21), gap('b', 62, 21), lay('ar', 'a'), field, { predict: 'nh3' }],
  [gap('a'), lay('ar', 'a'), into('a', 'nonpolar'), gap('b'), lay('ar', 'b'), into('b', 'polar'), gap('c'), lay('ar', 'c'), into('c', 'polar')],
  [{ fetch: 'sump' }, lay('rod', 's1'), lay('rod', 's2'), lay('rod', 's3'), into('s2', 'bent'), into('s3', 'bent')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [gap('a')],
  [into('a', 'uneven'), into('b', 'even'), into('c', 'given')],
  [gap('a'), field, { predict: 'turns' }],
  [into('a', 'cancel'), into('b', 'add')],
  [gap('a', 52, 27), lay('swh', 'a'), lay('swh', 'a')],
  [gap('a', 32, 21), gap('b', 62, 21), field, { predict: 'both' }],
  [into('a', 'polar'), into('b', 'polar'), into('c', 'nonpolar')],
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
