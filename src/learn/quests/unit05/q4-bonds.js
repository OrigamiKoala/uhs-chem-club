/**
 * Unit 5 · Bench 4 — Bond Enthalpies (q4-bonds)
 *
 * The sampling coil over a fumarole, on the heat kit (`table/kits/heat.js`). A crank pulls one bond apart, two atoms in space with the
 * rod between them thinning, and prints what that costs; a ledger sums the bond chips lying in its two trays, Broken and Formed. Five
 * stages and ONE click: the belief that breaking a bond gives energy out.
 *
 *   1  PREDICT: pulling two bonded hydrogen atoms apart takes energy in, or gives it out?
 *   2  TEST: the crank, and the energy change of the two atoms               -> bond enthalpy
 *   3  which bonds burning methane breaks, which it forms                   -> broken and formed; ΔH is broken less formed
 *   4  PREDICT (a new case): nitrogen and oxygen joining to make nitric oxide, warm the bath or cool it?
 *   5  TEST: the ledger for that reaction, read                               -> a reaction that climbs
 *
 * THE WRONG MODEL IS ON THE TABLE. "Takes energy in", "gives energy out" and "needs none" are three cards, and the crank's meter reads
 * ENERGY IN. The methane ledger then pays back more than it cost, and the second prediction (the air's reaction) is the one where
 * the ledger comes out the other way, so no one learns that every reaction is downhill.
 *
 * Each bond chip is two atoms and a rod: flat on the drawn table, solid at `3D On` (`engine/heat-solids.js`). The picture is the
 * same fact either way: a double bond has two rods.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, bondChip, note, tag, wellFixture, ledgerFixture, markerFixture, markerRead, ledgerRead, wellRead,
  whereIs, bondEnthalpySum, BOND_ENTHALPIES, signedKJ
} from '../../table/kits/heat.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bbond enthalpy\b/i, introducedAt: 2 }
];

/** Bonds are Ligar's first bench; a bath's thermometer is this world's first. */
export const BUILDS_ON = ['unit03/q1-joins', 'unit05/q1-flow'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const KEY_1 = 'unit05/q4-bonds';
const KEY_2 = 'unit05/q4-bonds#air';
const GUESS_1 = { in: '"Takes energy in"', out: '"Gives energy out"', none: '"Needs no energy"' };
const GUESS_2 = { warm: '"Warms the bath"', cool: '"Cools the bath"', same: '"Leaves the bath as it is"' };

const CH4_BROKEN = [{ bond: 'C-H', count: 4 }, { bond: 'O=O', count: 2 }];
const CH4_FORMED = [{ bond: 'C=O', count: 2 }, { bond: 'O-H', count: 4 }];
const CH4_SUMS = bondEnthalpySum(CH4_BROKEN, CH4_FORMED);   // broken 2648, formed 3450, net -802
const NO_BROKEN = [{ bond: 'N≡N', count: 1 }, { bond: 'O=O', count: 1 }];
const NO_FORMED = [{ bond: 'N=O', count: 2, dH: 631 }];
const NO_SUMS = bondEnthalpySum(NO_BROKEN, NO_FORMED);      // broken 1443, formed 1262, net +181

const HH = BOND_ENTHALPIES['H-H'].dH;

/** The two trays and the ledger over them that the methane stage uses. */
const trays = (x = 66) => [
  { id: 'broken', label: 'Broken', at: { x, y: 20 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 },
  { id: 'formed', label: 'Formed', at: { x, y: 50 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 }
];

const CH4_CHIPS = [
  ['ch', 'C-H', 4, 'methane', 'broken'], ['oo', 'O=O', 2, 'oxygen', 'broken'],
  ['co', 'C=O', 2, 'carbon dioxide', 'formed'], ['oh', 'O-H', 4, 'water', 'formed']
];

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Pulling Atoms Apart',
    // A PREDICT STAGE: the crank is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Two hydrogen atoms are held together by a bond: does pulling them apart take energy in or give energy out?',
    widget,
    table: heatTable({
      pieces: [
        note('in', 'Takes energy in', { x: 24, y: 16 }),
        note('out', 'Gives energy out', { x: 70, y: 16 }),
        note('none', 'Needs no energy', { x: 116, y: 16 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 70, y: 44 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Picture the two atoms held side by side, and what you would have to do to separate them.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(KEY_1, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'You have picked the answer you would bet on. Next, a crank can pull the two atoms apart and a meter will say what happened.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-crank',
    title: 'The Crank',
    get prompt() {
      const guess = recall(KEY_1);
      return guess && GUESS_1[guess]
        ? `You predicted ${GUESS_1[guess]}: pull the bond completely apart, then set the marker to the energy change of the two atoms.`
        : 'Pull the bond completely apart, then set the marker to the energy change of the two atoms.';
    },
    widget,
    table: heatTable({
      fixtures: [
        wellFixture('crank', { x: 34, y: 30 }, { bond: 'H-H', atoms: ['H', 'H'], bondLabel: 'H–H', title: 'H–H crank' }),
        markerFixture('change', 'Energy change of the atoms', { x: 116, y: 32 }, { min: -480, max: 480, step: 4, start: 0, unit: 'kJ/mol', w: 56 })
      ]
    }),
    hints: [
      'Use the "Crank" dial and the marker.',
      'Compare the meter at each setting of the crank, and note which way the energy is going.',
      'Energy that goes into the atoms raises their energy and energy that leaves them lowers it, so the marker takes the matching sign.'
    ],
    check(state) {
      const t = state.table;
      const r = wellRead(t, 'crank');
      const v = markerRead(t, 'change');
      if (!r.free) return { ok: false, notYet: true, msg: 'Pull the bond all the way apart with the crank.' };
      if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the energy change of the two atoms.' };
      if (v === HH) return { ok: true };
      if (v === -HH) return { ok: false, msg: 'The meter says ENERGY IN, and the marker sits below zero.' };
      return { ok: false, msg: 'The marker and the meter show different figures.' };
    },
    get reward() {
      const guess = recall(KEY_1);
      const verdict = !guess || !GUESS_1[guess] ? '' : guess === 'in'
        ? 'You bet on energy going in, and the meter agreed. '
        : 'The meter did not agree with your bet, which is how a guess gets better. ';
      return {
        log: 'The crank took energy in.',
        title: 'Bond Enthalpy',
        body: `${verdict}Pulling bonded atoms apart takes energy in: the energy to break one mole of a bond is its bond enthalpy, 436 kJ/mol for H–H. Letting free atoms snap back together gives the same energy back out.`,
        model: { type: 'molecule', name: 'hydrogen', caption: 'A hydrogen molecule: two atoms and the bond between them.' }
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-methane',
    title: 'Burning Methane, Bond by Bond',
    prompt: 'Sort each bond into the tray for bonds that break or bonds that form when methane burns.',
    widget,
    table: heatTable({
      pieces: CH4_CHIPS.map(([id, bond, count, noteText], i) => bondChip(id, bond, { x: 17, y: 14 + i * 13 }, { count, note: noteText })),
      fixtures: [ledgerFixture('ledger', { x: 121, y: 34 }, { broken: 'broken', formed: 'formed', hideNet: false, w: 50, title: 'CH₄ + 2O₂ → CO₂ + 2H₂O' })],
      zones: { trays: trays(66) }
    }),
    hints: [
      'Use the four bond chips, the two trays and the ledger.',
      'Compare each chip\'s molecule with the equation printed on the ledger.',
      'Bonds in the molecules on the left of the arrow come apart, and bonds in the molecules on the right are built.'
    ],
    check(state) {
      const t = state.table;
      const want = { ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' };
      if (Object.keys(want).some(k => !['broken', 'formed'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every bond needs a tray.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const tray = t.zones.trays[whereIs(t, wrong[0])];
      return { ok: false, msg: `The "${tray.label}" tray holds a bond from a molecule on the ${wrong[1] === 'broken' ? 'left' : 'right'} of the arrow.` };
    },
    reward: {
      log: 'Burning methane paid back more than it cost.',
      title: 'Broken Less Formed',
      body: 'Breaking bonds takes energy in, and forming bonds gives it back out. Burning methane breaks bonds worth 2,648 kJ and forms bonds worth 3,450 kJ, so 802 kJ more comes back than went in, and ΔH is the energy of the bonds broken minus the energy of the bonds formed.',
      model: { type: 'molecules', items: ['methane', 'oxygen', 'carbon dioxide', 'water'], caption: 'Methane and oxygen, whose bonds come apart, beside carbon dioxide and water, whose bonds are built.' }
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict-air',
    title: 'Air Joins Up',
    // A PREDICT STAGE on a new case of the same idea: the ledger is not on the table yet.
    predict: true,
    prompt: 'Nitrogen and oxygen in air can join to make nitric oxide: will that reaction warm the bath or cool it?',
    widget,
    table: heatTable({
      pieces: [
        note('warm', 'Warms the bath', { x: 24, y: 16 }),
        note('cool', 'Cools the bath', { x: 70, y: 16 }),
        note('same', 'Leaves the bath as it is', { x: 116, y: 16 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 70, y: 44 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Picture the bonds of nitrogen and oxygen coming apart and the bonds of nitric oxide being built.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(KEY_2, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Read the Ledger',
      body: 'You have picked what you expect. Next, the bonds of this reaction are laid in a ledger, ready to be read.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-air',
    title: 'The Air Ledger',
    get prompt() {
      const guess = recall(KEY_2);
      return guess && GUESS_2[guess]
        ? `You predicted ${GUESS_2[guess]}: read the ledger and lay the card for what the bath will do.`
        : 'Read the ledger and lay the card for what the bath will do.';
    },
    widget,
    table: heatTable({
      pieces: [
        { ...bondChip('nn', 'N≡N', { x: 17, y: 16 }, { note: 'nitrogen' }), zone: 'tray:broken' },
        { ...bondChip('oo', 'O=O', { x: 17, y: 30 }, { note: 'oxygen' }), zone: 'tray:broken' },
        { ...bondChip('no', 'N=O', { x: 17, y: 44 }, { count: 2, dH: 631, note: 'nitric oxide' }), zone: 'tray:formed' },
        tag('warm', 'Warms the bath', { x: 84, y: 57.4 }),
        tag('cool', 'Cools the bath', { x: 110, y: 57.4 }),
        tag('same', 'Leaves it as it is', { x: 136, y: 57.4 })
      ],
      fixtures: [ledgerFixture('ledger', { x: 108, y: 18 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 52, title: 'N₂ + O₂ → 2 NO' })],
      zones: {
        trays: [
          { id: 'broken', label: 'Broken', at: { x: 40, y: 20 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 },
          { id: 'formed', label: 'Formed', at: { x: 40, y: 50 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 }
        ],
        slots: [{ id: 'answer', label: 'The ledger says', at: { x: 96, y: 39 }, size: { w: 36, h: 14 } }]
      }
    }),
    hints: [
      'Use the ledger, the three cards and the slot.',
      'Compare the Broken total with the Formed total.',
      'Whichever total is larger decides which way the energy goes, so the bath follows it.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (card.id === 'cool') return { ok: true };
      const r = ledgerRead(t, 'ledger');
      return { ok: false, msg: `The ledger reads ${r.broken} kJ for the bonds broken and ${r.formed} kJ for the bonds formed.` };
    },
    get reward() {
      const guess = recall(KEY_2);
      const verdict = !guess || !GUESS_2[guess] ? '' : guess === 'cool'
        ? 'You predicted this one, and the ledger agreed. '
        : 'The ledger did not agree with your prediction, which is how a guess gets better. ';
      return {
        log: 'The bonds formed paid back less than the bonds broken cost.',
        title: 'A Climbing Reaction',
        body: `${verdict}Here the bonds formed pay back ${signedKJ(NO_SUMS.net).replace('+', '')} kJ less than the bonds broken cost, so ΔH is positive and the bath cools. Not every reaction runs downhill, which is why nitrogen and oxygen sit side by side in air without burning.`,
        model: { type: 'molecules', items: ['nitrogen', 'oxygen', 'nitric oxide'], caption: 'Nitrogen with its triple bond, oxygen with its double bond, and nitric oxide.' }
      };
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Turn the "Crank" dial, then set the marker.'],
  3: ['Drag each chip into a tray.'],
  4: ['Drag the card you choose into the slot.'],
  5: ['Drag a card into the slot.']
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
      body: 'Breaking a bond takes energy in and forming one gives it out. A reaction releases heat when the bonds it forms are worth more than the bonds it breaks, and takes heat in when they are worth less.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'The Fifth\'s coil pulls gas molecules apart over the vent, and every bond it breaks has to be paid for from somewhere. A reaction that climbs, like the one in air, never runs unless something keeps feeding it.'
    },
    {
      heading: 'Next',
      body: 'The next bench shows that a reaction\'s heat does not depend on the route it takes, so a reaction no one can run can still be worked out.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which statement about bond breaking and bond forming is correct?',
    options: [
      { id: 'a', label: 'Breaking a bond absorbs energy, and forming a bond releases energy' },
      { id: 'b', label: 'Breaking a bond releases energy, and forming a bond absorbs energy' },
      { id: 'c', label: 'Both breaking and forming a bond release energy' },
      { id: 'd', label: 'Both breaking and forming a bond absorb energy' }
    ],
    answer: 'a',
    explanation: 'Pulling atoms out of an attraction takes energy in, and letting them fall back into it gives the same energy out.'
  },
  {
    question: 'Breaking H–H (436 kJ/mol) and Cl–Cl (242 kJ/mol) and forming two H–Cl bonds (431 kJ/mol each) gives what ΔH for H₂ + Cl₂ → 2 HCl?',
    options: [
      { id: 'a', label: '−184 kJ' },
      { id: 'b', label: '+184 kJ' },
      { id: 'c', label: '−862 kJ' },
      { id: 'd', label: '+678 kJ' }
    ],
    answer: 'a',
    explanation: 'Breaking costs 436 + 242 = 678 kJ and forming gives back 2 × 431 = 862 kJ, so ΔH is 678 − 862 = −184 kJ.'
  },
  {
    question: 'Which of these bonds between carbon atoms has the highest bond enthalpy?',
    options: [
      { id: 'a', label: 'C≡C, the triple bond' },
      { id: 'b', label: 'C=C, the double bond' },
      { id: 'c', label: 'C–C, the single bond' }
    ],
    answer: 'a',
    explanation: 'More shared electron pairs hold the nuclei closer in a deeper well, so the triple bond takes the most energy to break.'
  },
  {
    question: 'For 2 H₂ + O₂ → 2 H₂O (gas), use H–H = 436, O=O = 498 and O–H = 463 kJ/mol. What is the estimated ΔH?',
    options: [
      { id: 'a', label: '−482 kJ' },
      { id: 'b', label: '+482 kJ' },
      { id: 'c', label: '−1852 kJ' },
      { id: 'd', label: '+1370 kJ' }
    ],
    answer: 'a',
    explanation: 'Breaking 2 H–H and 1 O=O costs 1370 kJ, and forming 4 O–H gives back 1852 kJ, so ΔH is 1370 − 1852 = −482 kJ.'
  },
  {
    question: 'Breaking the bonds of a fuel takes energy, yet burning it releases heat. Why?',
    options: [
      { id: 'a', label: 'The product bonds are stronger, so forming them releases more than breaking the fuel’s bonds cost' },
      { id: 'b', label: 'Breaking the fuel’s bonds releases heat once the first bond has snapped' },
      { id: 'c', label: 'The oxygen supplies all of the energy and the fuel supplies none' }
    ],
    answer: 'a',
    explanation: 'Energy is released when the total paid back by new bonds is larger than the total spent breaking old ones.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));

export const SOLUTIONS = [
  [put('in', 'slot:guess')],
  [dial('crank', 'pull', 7), dial('change', 'value', HH)],
  [...sort({ ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' })],
  [put('cool', 'slot:guess')],
  [put('cool', 'slot:answer')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('crank', 'pull', 7), dial('change', 'value', -HH)],
  [...sort({ ch: 'broken', oo: 'formed', co: 'formed', oh: 'formed' })],
  [],
  [put('warm', 'slot:answer')]
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

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { CH4_SUMS, NO_SUMS, CH4_BROKEN, CH4_FORMED, NO_BROKEN, NO_FORMED, HH };
export { ledgerRead, wellRead };
