/**
 * q4-dots.js — Ligar, bench four: LEWIS STRUCTURES.
 *
 * The pair board. A slate holds a molecule's atoms and a tray holds exactly its
 * valence electrons; a pair goes between two atoms or onto one, and every atom
 * carries a lamp that lights when eight stand round it (two for hydrogen). The
 * board reads and never lectures: it has one rule, that a hydrogen or fluorine
 * atom shares one pair and no more.
 *
 *   1  place all of water's electrons so every lamp is lit       -> Lewis structure, lone pair, octet
 *   2  file three molecules by the lone pairs on the heavy atom   -> (valence electrons set the count)
 *   3  carbon dioxide, where single bonds leave two lamps dark    -> (multiple bonds share more)
 *   4  which atom sits in the middle                              -> central atom
 *   5  the ammonium ion, where the tray has to change             -> polyatomic ion
 *   6  why boron's lamp stays amber in BF3                        -> incomplete octet
 *   7  nitric oxide, with an odd number of electrons              -> free radical
 *   8  SF6, where sulfur goes past eight                          -> expanded octet
 *
 * Stage 4 is HOF, not HCN: on this board hydrogen and fluorine take one pair
 * only, so the oxygen between them is the one atom that can join them, which is
 * something the player can FIND. (HCN has an isomer, HNC, that lights every lamp
 * as well, so the lamps alone could not settle which atom sits in the middle.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { PairBoard } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { pairKeys, paintPairHand, describeBoard, boardState, litCount } from '../../engine/paircontrols.js';
import { MOLECULES, DRAWINGS, planLewis, allLit, trayFor, blankDrawing, drawing } from '../../engine/lewis.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bincomplete octets?\b/i, introducedAt: 6 },
  { term: /\bexpanded octets?\b/i, introducedAt: 8 },
  { term: /\bfree radicals?\b/i, introducedAt: 7 },
  { term: /\bpolyatomic ions?\b/i, introducedAt: 5 },
  { term: /\bcentral atoms?\b/i, introducedAt: 4 },
  { term: /\blewis structures?\b/i, introducedAt: 1 },
  { term: /\blone pairs?\b/i, introducedAt: 1 },
  { term: /\boctets?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q1-joins', 'unit03/q3-distance', 'unit01/q2-core'];

const SPEAKER = 'Vess';

/** A key whose label does not say what one tap does owes a sentence. */
const TOOL_TEXT = {
  hand: { key: 'Where the next pair goes', what: 'Each tap puts two electrons — or one with the dot — from the tray into the slot between two atoms or onto one atom.' }
};
export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

const slate = (id, label, mol, extra = {}) => ({ id, label, head: 'slate', mol, ...extra });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Water\'s Electrons',
    briefing: {
      speaker: SPEAKER,
      body: 'The tray holds every electron the molecule has, two to a pair. Each atom has a lamp that lights when enough electrons stand round it.'
    },
    prompt: 'Place all of water\'s electrons so every lamp lights, to draw the first true molecule of the rescue rock.',
    controls: ['hand', 'clear'],
    rigs: [slate('a', 'PLATE A', 'H2O')],
    widget: { type: 'none' },
    hints: [
      'Pick where the next pair goes, then tap a slot or an atom.',
      'Compare each atom\'s lamp with the number of electrons standing round it: hydrogen wants two and the others eight.',
      'Fill the slots between atoms first, then put whatever is left in the tray onto the atom whose lamp is still dark.'
    ],
    check(state) {
      const read = readPlate(state, 'a', STAGES[0]);
      if (read.used === 0) return { ok: false, notYet: true, msg: 'Place the tray\'s electrons on the slate.' };
      if (allLit(read)) return { ok: true };
      if (read.left > 0) return { ok: false, msg: 'Electrons are still in the tray, and a lamp is still dark.' };
      return { ok: false, msg: 'The tray is empty but a lamp is still dark. Look at which atom has too few round it and which has too many.' };
    },
    reward: {
      log: 'Every electron placed, every lamp lit.',
      title: 'Lewis Structure',
      body: 'A drawing that puts every valence — outer-shell — electron in a bond or on an atom is a Lewis structure. Pairs on one atom are lone pairs, and each atom is content with eight round it, two for hydrogen: the octet rule.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Is Left Over',
    prompt: 'File each molecule by the lone pairs on its heaviest atom, to map where each molecule can break.',
    controls: ['hand', 'clear'],
    rigs: [slate('ch4', 'PLATE A', 'CH4'), slate('nh3', 'PLATE B', 'NH3'), slate('hf', 'PLATE C', 'HF')],
    widget: {
      type: 'bins', label: 'Lone pairs on the heaviest atom',
      rows: [{ id: 'ch4', label: 'Plate A' }, { id: 'nh3', label: 'Plate B' }, { id: 'hf', label: 'Plate C' }],
      bins: [{ id: 'none', label: 'None' }, { id: 'one', label: 'One' }, { id: 'three', label: 'Three' }]
    },
    hints: [
      'Draw each molecule on its own plate until every lamp is lit.',
      'Compare the pairs left on the heaviest atom of each plate once its bonds are drawn.',
      'Count what the atom brings, take away the electrons its bonds use, and what remains sits on it as pairs.'
    ],
    check(state) {
      const rows = ['ch4', 'nh3', 'hf'];
      if (rows.some(r => !state.bins[r])) return { ok: false, notYet: true, msg: 'File all three molecules.' };
      const want = { ch4: 'none', nh3: 'one', hf: 'three' };
      const wrong = rows.filter(r => state.bins[r] !== want[r]);
      if (!wrong.length) return { ok: true };
      return { ok: false, msg: 'Draw the molecule you are unsure of until every lamp is lit, then count the pairs standing on its heaviest atom.' };
    },
    reward: {
      log: 'Valence electrons set the count.',
      title: 'What Is Left Over',
      body: 'An atom keeps as lone pairs the electrons its bonds do not use. Carbon uses all four of its own in bonds, nitrogen leaves one pair over, and fluorine leaves three.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Pairs Short',
    prompt: 'Place all of carbon dioxide\'s electrons so every lamp lights, to finish the drawing the breakers need.',
    controls: ['hand', 'clear'],
    rigs: [slate('a', 'PLATE A', 'CO2')],
    widget: { type: 'none' },
    hints: [
      'Place a pair in each slot first and see which lamps stay dark.',
      'Compare the lamp on carbon with the lamps on the oxygen atoms once their lone pairs are down.',
      'Where an atom is short, move a lone pair from its neighbour into the slot between them.'
    ],
    check(state) {
      const read = readPlate(state, 'a', STAGES[2]);
      if (read.used === 0) return { ok: false, notYet: true, msg: 'Place the tray\'s electrons on the slate.' };
      if (allLit(read)) return { ok: true };
      if (read.left > 0) return { ok: false, msg: 'Electrons are still in the tray, and a lamp is still dark.' };
      return { ok: false, msg: 'The tray is empty but a lamp is still dark. An atom with a pair to spare could share it.' };
    },
    reward: {
      log: 'Neighbours share a second pair.',
      title: 'Multiple Bonds Share More',
      body: 'When single bonds leave an atom short, the atoms beside it can share a second pair between them. Carbon dioxide ends with a double bond on each side of the carbon.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Middle',
    prompt: 'Say which atom sits in the middle of HOF, to set the keystone the cutters will split.',
    controls: ['hand', 'clear'],
    rigs: [slate('a', 'PLATE A', 'HOF')],
    widget: {
      type: 'choice', label: 'In the middle',
      options: [{ id: 'h', label: 'Hydrogen' }, { id: 'o', label: 'Oxygen' }, { id: 'f', label: 'Fluorine' }]
    },
    hints: [
      'Try drawing the molecule with each atom in turn as the one the other two join.',
      'Compare how many shared pairs each atom is allowed to take on this board.',
      'The atom in the middle must be allowed more than a single shared pair.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an atom.' };
      if (state.choice === 'o') return { ok: true };
      return { ok: false, msg: 'Try drawing it that way round. This atom has room for one shared pair only, so it cannot join the other two.' };
    },
    reward: {
      log: 'The atom that joins the others.',
      title: 'Central Atom',
      body: 'The atom in the middle, which the others attach to, is the central atom. An atom that can share only one pair, like hydrogen or fluorine, can never be it.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'One Electron Fewer',
    prompt: 'Draw the NH₄ ion so every lamp lights, to read the charged dust in the tunnel air.',
    controls: ['hand', 'clear', 'charge'],
    rigs: [slate('a', 'PLATE A', 'NH4')],
    widget: { type: 'none' },
    hints: [
      'Try the drawing with the tray as it is and see what is left over.',
      'Compare the number of electrons in the tray with the number the lamps need.',
      'Take an electron out of the tray, or add one, until the count matches what the lamps need.'
    ],
    check(state) {
      const q = state.charges.a;
      const read = readPlate(state, 'a', STAGES[4]);
      if (read.used === 0) return { ok: false, notYet: true, msg: 'Place the tray\'s electrons on the slate.' };
      if (allLit(read) && q === 1) return { ok: true };
      if (read.total % 2 === 1) return { ok: false, msg: 'The tray holds an odd number of electrons, and a pair cannot be made from a single one left over.' };
      if (q !== 1) return { ok: false, msg: 'The lamps can be lit, but the tray is not the one this ion has: its atoms bring one electron more than the ion keeps.' };
      return { ok: false, msg: 'Electrons are still in the tray, or a lamp is still dark.' };
    },
    reward: {
      log: 'The tray changes with the charge.',
      title: 'Polyatomic Ion',
      body: 'Atoms bonded together that carry an overall charge form a polyatomic ion. Each positive charge takes one electron out of the tray.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'The Amber Lamp',
    prompt: 'Say why the lamp on boron stays amber in BF₃, to explain the pale seam the miners keep hitting.',
    controls: ['hand', 'clear'],
    rigs: [slate('a', 'PLATE A', 'BF3')],
    widget: {
      type: 'choice', label: 'Because',
      options: [
        { id: 'f', label: 'Fluorine will not share a second pair, so boron is left with six' },
        { id: 'b', label: 'Boron brings too many electrons' },
        { id: 'l', label: 'Electrons are left over in the tray' },
        { id: 'n', label: 'Boron cannot share any pair at all' }
      ]
    },
    hints: [
      'Draw boron trifluoride using every electron in the tray.',
      'Compare how many shared pairs boron can have with how many each fluorine atom is willing to share.',
      'Count the shared pairs round boron when every fluorine atom takes exactly one.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'f') return { ok: true };
      if (state.choice === 'b') return { ok: false, msg: 'Count the electrons boron brings against the number it is round when its slots are filled.' };
      if (state.choice === 'l') return { ok: false, msg: 'Draw it and place every electron: the tray empties and the amber lamp stays.' };
      return { ok: false, msg: 'Boron shares a pair with each atom beside it. Look at what the other atoms will take.' };
    },
    reward: {
      log: 'Boron stops at six.',
      title: 'Incomplete Octet',
      body: 'An atom that ends with fewer than eight electrons round it has an incomplete octet. Boron is the usual case: it brings three electrons, and fluorine will not share a second pair to make up the rest.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'An Odd One',
    prompt: 'Use up every electron in the tray for NO — an odd count, so one is left without a partner — to draw the gas the blast released.',
    controls: ['hand', 'clear'],
    handDot: true,
    rigs: [slate('a', 'PLATE A', 'NO')],
    widget: { type: 'none' },
    hints: [
      'Place pairs until the tray will not give another, then see what is left in it.',
      'Compare the electrons in the tray with how many a whole number of pairs can use.',
      'Put the electron that has no partner onto the atom that has room for it.'
    ],
    check(state) {
      const read = readPlate(state, 'a', STAGES[6]);
      if (read.used === 0) return { ok: false, notYet: true, msg: 'Place the tray\'s electrons on the slate.' };
      const over = read.atoms.some(a => a.lamp === 'over');
      const dots = read.atoms.reduce((n, a) => n + a.dots, 0);
      if (read.left === 0 && !over && dots === 1) return { ok: true };
      if (read.left > 0) return { ok: false, msg: 'Electrons are still in the tray.' };
      if (over) return { ok: false, msg: 'An atom has more round it than it can hold.' };
      return { ok: false, msg: 'The tray is empty, but the electrons are not all placed the way they have to be. One of them cannot be half of a pair.' };
    },
    reward: {
      log: 'An electron with no partner.',
      title: 'Free Radical',
      body: 'A species with an odd number of electrons must leave one unpaired, and one lamp stays dark. That is a free radical, and its lone electron makes it very reactive.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Past Eight',
    prompt: 'Use up every electron in the tray for SF₆, to draw the heavy gas pooled at the tunnel floor.',
    controls: ['hand', 'clear'],
    rigs: [slate('a', 'PLATE A', 'SF6')],
    widget: { type: 'none' },
    hints: [
      'Place a shared pair in every slot, then see what the tray still holds.',
      'Compare the fluorine lamps with the lamp on sulfur as the tray runs out.',
      'Give each fluorine atom the lone pairs it needs and let sulfur keep the shared pairs it ends up with.'
    ],
    check(state) {
      const read = readPlate(state, 'a', STAGES[7]);
      if (read.used === 0) return { ok: false, notYet: true, msg: 'Place the tray\'s electrons on the slate.' };
      if (allLit(read) && read.atoms[0].lamp === 'expanded') return { ok: true };
      if (read.left > 0) return { ok: false, msg: 'Electrons are still in the tray, and a lamp is still dark.' };
      return { ok: false, msg: 'The tray is empty but a lamp is still dark, or an atom has more than it can hold.' };
    },
    reward: {
      log: 'Sulfur goes past eight.',
      title: 'Expanded Octet',
      body: 'Atoms on the third ring and below have room for more than eight electrons, so sulfur holds twelve in SF₆. That is an expanded octet, and it is why such atoms can bond to six others.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A Lewis structure puts every valence electron somewhere: in a bond between two atoms or as a lone pair on one. Most atoms stop at eight round them, but boron stops short, a radical leaves one over, and a third-ring atom can go beyond.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every shape, charge and reaction in the rest of this unit begins from one of these drawings. If you can place the electrons, you can say what the molecule will do.'
    },
    {
      heading: 'Next',
      body: 'Some molecules have more than one good drawing. The next bench counts the charge on each atom and chooses between them.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'How many lone pairs are on the oxygen atom in a Lewis structure of H₂O?',
    options: [
      { id: 'a', label: 'Two' },
      { id: 'b', label: 'One' },
      { id: 'c', label: 'Three' },
      { id: 'd', label: 'None' }
    ],
    answer: 'a',
    explanation: 'Water has eight valence electrons. Two bonds use four, and the remaining four sit on oxygen as two lone pairs.'
  },
  {
    question: 'What is the best Lewis structure for CO₂?',
    options: [
      { id: 'a', label: 'Two double bonds, with two lone pairs on each oxygen' },
      { id: 'b', label: 'Two single bonds, with three lone pairs on each oxygen' },
      { id: 'c', label: 'One triple and one single bond' },
      { id: 'd', label: 'Two double bonds, with no lone pairs' }
    ],
    answer: 'a',
    explanation: 'With 16 valence electrons, two double bonds give carbon and both oxygens eight electrons each.'
  },
  {
    question: 'How many electrons does the Lewis structure of the NH₄⁺ ion contain?',
    options: [
      { id: 'a', label: '8' },
      { id: 'b', label: '9' },
      { id: 'c', label: '10' },
      { id: 'd', label: '5' }
    ],
    answer: 'a',
    explanation: 'Nitrogen brings 5 and four hydrogens bring 4, which is 9. The positive charge removes one electron, leaving 8.'
  },
  {
    question: 'Why does boron in BF₃ have only six electrons round it?',
    options: [
      { id: 'a', label: 'Boron has only three valence electrons to share, and fluorine does not form a second bond to it' },
      { id: 'b', label: 'Boron cannot bond to fluorine' },
      { id: 'c', label: 'Fluorine has an expanded octet' },
      { id: 'd', label: 'The molecule has an unpaired electron' }
    ],
    answer: 'a',
    explanation: 'Boron brings three electrons, so three single bonds give it six. Fluorine is too electronegative to share more, so the octet stays incomplete.'
  },
  {
    question: 'Which of these can have an expanded octet?',
    options: [
      { id: 'a', label: 'Sulfur in SF₆' },
      { id: 'b', label: 'Nitrogen in NH₃' },
      { id: 'c', label: 'Oxygen in H₂O' },
      { id: 'd', label: 'Carbon in CH₄' }
    ],
    answer: 'a',
    explanation: 'Only atoms on the third period or below have room for more than eight electrons, so sulfur holds twelve in SF₆.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function readPlate(state, id, stage) {
  const rig = stage.rigs.find(r => r.id === id);
  const placed = state.boards?.[id] || blankDrawing();
  const q = state.charges?.[id] ?? MOLECULES[rig.mol].charge;
  const read = planLewis(MOLECULES[rig.mol], placed, q);
  return { ...read, used: read.total - read.left };
}

function blankState(stage) {
  return boardState(stage.rigs);
}

export const SOLUTIONS = [
  { boards: { a: DRAWINGS.H2O } },
  { bins: { ch4: 'none', nh3: 'one', hf: 'three' } },
  { boards: { a: DRAWINGS.CO2 } },
  { choice: 'o' },
  { boards: { a: DRAWINGS.NH4 }, charges: { a: 1 } },
  { choice: 'f' },
  { boards: { a: DRAWINGS.NO } },
  { boards: { a: DRAWINGS.SF6 } }
];

export const MISSES = [
  { boards: { a: drawing({ '0-1': 1, '0-2': 1 }) } },
  { bins: { ch4: 'none', nh3: 'three', hf: 'one' } },
  { boards: { a: drawing({ '0-1': 1, '1-2': 1 }, { 0: 3, 2: 3 }) } },
  { choice: 'h' },
  { boards: { a: DRAWINGS.NH4 }, charges: { a: 0 } },
  { choice: 'b' },
  { boards: { a: drawing({ '0-1': 2 }, { 0: 1, 1: 2 }) } },
  { boards: { a: drawing({ '0-1': 1, '0-2': 1, '0-3': 1, '0-4': 1, '0-5': 1, '0-6': 1 }) } }
];

export function stateFor(i, overrides) {
  const base = { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]) };
  return {
    ...base,
    ...overrides,
    boards: { ...base.boards, ...(overrides?.boards || {}) },
    charges: { ...base.charges, ...(overrides?.charges || {}) }
  };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let board = null;
  let runner = null;

  function paintAll() {
    paintPairHand(runner.frame.el.controls, board.cfg.hand);
  }

  /** Every crawler answers the lamps on its own plate. */
  function reactAll(quiet = false) {
    for (const rig of runner.stage.rigs) {
      const read = board.readOf(rig.id);
      if (!read) continue;
      runner.frame.foeReact(rig.id, { kind: 'lamps', lit: litCount(read), of: read.atoms.length }, quiet);
    }
  }

  function onProbe(hit) {
    if (hit.kind === 'hand') { paintAll(); return; }
    if (hit.kind === 'board') {
      runner.state.boards[hit.plateId] = hit.placed;
      const item = board.itemFor(hit.plateId);
      const d = describeBoard(hit, item);
      runner.readout(d.head, d.body);
      reactAll();
      paintAll();
    }
  }

  function syncFromBoard() {
    for (const rig of runner.stage.rigs) {
      runner.state.boards[rig.id] = board.placedOf(rig.id);
      runner.state.charges[rig.id] = board.chargeOf(rig.id);
    }
  }

  function onTool(tool) {
    if (tool.startsWith('hand:')) {
      board.setHand(tool.split(':')[1]);
      paintAll();
    } else if (tool === 'clear') {
      board.clear();
      syncFromBoard();
      runner.readout('Slate // cleared', 'The slate is back to how the stage handed it over.');
      reactAll(true);
    } else if (tool === 'charge:up' || tool === 'charge:down') {
      const id = runner.stage.rigs[0].id;
      const q = board.chargeOf(id) + (tool === 'charge:up' ? 1 : -1);
      board.setCharge(id, q);
      runner.state.charges[id] = q;
      const read = board.readOf(id);
      runner.readout('Tray // changed', `The tray now holds ${read.total} electrons, ${read.left} of them still to place.`);
      reactAll();
    }
  }

  function onLoad(stage, i, r) {
    board.setPlates(stage.rigs, {
      hands: stage.handDot ? ['bond', 'lone', 'dot', 'x'] : ['bond', 'lone', 'x'],
      labels: i === 0 ? { bond: 'BETWEEN', lone: 'ON ATOM' } : null
    });
    board.setSelectable(false);
    const parts = pairKeys({ stage: i + 1, dot: stage.handDot, charge: stage.controls.includes('charge'), earned: i >= 1 });
    r.setControls(parts, onTool);
    paintAll();
    r.readout(null, null, { idleHead: 'Slate // standby', idle: 'Pick where the next pair goes, then tap the slate.' });
    reactAll(true);
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { board = PairBoard(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => board?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export { trayFor };
