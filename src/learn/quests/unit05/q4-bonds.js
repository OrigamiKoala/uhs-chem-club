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
  heatTable, bondChip, note, tag, wellFixture, ledgerFixture, markerFixture, selectorFixture, leadFixture, markerRead, dialAt, ledgerRead, wellRead,
  whereIs, bondEnthalpySum, BOND_ENTHALPIES, signedKJ
} from '../../table/kits/heat.js';

export const meta = { stageCount: 6 };

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

const HCL_SUMS = bondEnthalpySum([{ bond: 'H-H', count: 1 }, { bond: 'Cl-Cl', count: 1 }], [{ bond: 'H-Cl', count: 2 }]);   // broken 678, formed 862, net -184

const HH = BOND_ENTHALPIES['H-H'].dH;
/** Stage 2: what happens when the two free atoms bond again. The first position is blank (nothing chosen yet). */
const FORM_OPTIONS = [' ', `Takes in ${HH} kJ/mol`, `Takes in ${HH / 2} kJ/mol`, 'No energy change', `Gives out ${HH / 2} kJ/mol`, `Gives out ${HH} kJ/mol`];
const FORM_RIGHT = FORM_OPTIONS.length;

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
   THE SIX STAGES
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
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'bond', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Watch the clip: two hydrogen atoms held together by a bond.',
      'Picture two magnets stuck together, and what it takes to separate them.',
      'Think about whether energy has to be put in to separate the atoms, or whether they would fly apart by themselves.'
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
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for breaking the bond is recorded. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-crank',
    title: 'Apart and Back Together',
    briefing: { speaker: SPEAKER, body: 'The energy needed to pull apart one mole of bonds of one kind is the bond enthalpy of that bond. The meter under the graph shows the energy taken in or given out as the two atoms move.' },
    prompt: 'When the two free hydrogen atoms bond again, what is the energy change?',
    widget,
    table: heatTable({
      fixtures: [
        wellFixture('crank', { x: 34, y: 30 }, { bond: 'H-H', atoms: ['H', 'H'], bondLabel: 'H–H', title: 'H–H bond', pullLabel: 'Pull' }),
        selectorFixture('after', 'When the atoms bond again', { x: 114, y: 32 }, { options: FORM_OPTIONS, start: 1, w: 60, list: true })
      ]
    }),
    hints: [
      'Drag one atom away from the other and watch the meter under the graph.',
      'Notice which way the energy went as the bond came apart, and how much it was once the atoms were free.',
      'Letting the atoms bond again is the same change run backwards.'
    ],
    check(state) {
      const t = state.table;
      const r = wellRead(t, 'crank');
      const k = dialAt(t, 'after', 'value');
      if (!r.free) return { ok: false, notYet: true, msg: 'Drag the atoms all the way apart first.' };
      if (k === 1) return { ok: false, notYet: true, msg: 'Set the dial to what happens when the atoms bond again.' };
      if (k === FORM_RIGHT) return { ok: true };
      return { ok: false, msg: `The meter read ENERGY IN, ${Math.round(r.E)} kJ/mol, while the atoms were pulled apart, and the dial says "${FORM_OPTIONS[k - 1]}" for the way back.` };
    },
    reward: {
      log: 'Pulling the atoms apart took energy in; bonding gives it back.',
      title: 'Bond Enthalpy',
      body: 'Pulling the H–H bond apart took in 436 kJ/mol, which is its bond enthalpy. Forming the bond gives out the same 436 kJ/mol.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-methane',
    title: 'Burning Methane, Bond by Bond',
    briefing: { speaker: SPEAKER, body: 'In a reaction the bonds of the starting molecules break, which takes energy in, and the bonds of the new molecules form, which gives energy out. The bond table adds up each side as you fill it.' },
    prompt: 'Which bonds break and which form when methane burns, and how many of each?',
    widget,
    table: heatTable({
      pieces: CH4_CHIPS.map(([id, bond, count, noteText], i) => bondChip(id, bond, { x: 17, y: 14 + i * 13 }, { note: noteText })),
      fixtures: [ledgerFixture('ledger', { x: 121, y: 34 }, { broken: 'broken', formed: 'formed', hideNet: false, w: 50, title: 'CH₄ + 2O₂ → CO₂ + 2H₂O' })],
      zones: { trays: trays(66) }
    }),
    hints: [
      'Read the equation printed on the bond table, and the molecule named on each bond card.',
      'Count how many of each molecule the equation has, and how many of that bond one molecule holds.',
      'Molecules left of the arrow are used up, so their bonds break, and molecules right of it are made, so their bonds form.'
    ],
    check(state) {
      const t = state.table;
      const want = { ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' };
      if (Object.keys(want).some(k => !['broken', 'formed'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every bond needs a tray.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) {
        const off = CH4_CHIPS.find(([id, , n]) => (t.pieces[id].props.scale || 1) !== n);
        if (!off) return { ok: true };
        const k = t.pieces[off[0]].props.scale || 1;
        return { ok: false, msg: `The bond table counts ${k} ${off[1]} bond${k === 1 ? '' : 's'} from the ${off[3]} bond card.` };
      }
      const tray = t.zones.trays[whereIs(t, wrong[0])];
      return { ok: false, msg: `The "${tray.label}" tray holds a bond from a molecule on the ${wrong[1] === 'broken' ? 'left' : 'right'} of the arrow.` };
    },
    reward: {
      log: 'Burning methane paid back more than it cost.',
      title: 'Broken and Formed',
      body: 'Breaking the bonds took in 2,648 kJ and forming the new ones gave out 3,450 kJ. More came out than went in, so burning methane gives out about 802 kJ: ΔH ≈ −802 kJ.'
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
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'air', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Watch the clip: nitrogen molecules and oxygen molecules in air, each held together by its own bond.',
      'To make nitric oxide, the bonds in N₂ and O₂ must break and new bonds between N and O must form.',
      'Think about whether the new bonds give out more energy than breaking the old ones takes in.'
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
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for nitrogen and oxygen is recorded. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-air',
    title: 'The Bond Table for Air',
    briefing: { speaker: SPEAKER, body: 'A double line (=) marks a double bond, and a triple line (≡) marks a triple bond. Compare the bonds broken and formed, commit your answer in the slot, and the ledger totals will unlock.' },
    prompt: 'Will making nitric oxide from nitrogen and oxygen warm the bath or cool it?',
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
      fixtures: [ledgerFixture('ledger', { x: 108, y: 18 }, { broken: 'broken', formed: 'formed', hideNet: true, hideTotalsUntilCommit: true, gate: { slot: 'answer' }, w: 52, title: 'N₂ + O₂ → 2 NO' })],
      zones: {
        trays: [
          { id: 'broken', label: 'Broken', at: { x: 40, y: 20 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 },
          { id: 'formed', label: 'Formed', at: { x: 40, y: 50 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 }
        ],
        slots: [{ id: 'answer', label: 'My answer', at: { x: 96, y: 39 }, size: { w: 36, h: 14 } }]
      }
    }),
    hints: [
      'Look at the two totals on the bond table: the energy taken in by the bonds broken and the energy given out by the bonds formed.',
      'Compare the two totals.',
      'Energy that the new bonds do not give back has to come from somewhere, and the reaction sits in the bath.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (card.id === 'cool') return { ok: true };
      const r = ledgerRead(t, 'ledger');
      return { ok: false, msg: `The bond table reads ${r.broken} kJ for the bonds broken and ${r.formed} kJ for the bonds formed.` };
    },
    reward: {
      log: 'The bonds formed paid back less than the bonds broken cost.',
      title: 'An Endothermic Reaction',
      body: 'Breaking the bonds took in 1,443 kJ and forming the new ones gave out only 1,262 kJ. The other 181 kJ came from the bath, so the bath cools: the reaction is endothermic, ΔH ≈ +181 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-estimate',
    title: 'Estimating a ΔH',
    briefing: { speaker: SPEAKER, body: 'ΔH is about the energy taken in by the bonds broken minus the energy given out by the bonds formed. The result is an estimate, because for most bonds the listed bond enthalpy is an average over many different molecules.' },
    prompt: 'What is the estimated ΔH for H₂ + Cl₂ → 2 HCl?',
    widget,
    table: heatTable({
      pieces: [
        bondChip('hh', 'H-H', { x: 17, y: 16 }, { note: 'hydrogen' }),
        bondChip('cc', 'Cl-Cl', { x: 17, y: 30 }, { note: 'chlorine' }),
        bondChip('hc', 'H-Cl', { x: 17, y: 44 }, { count: 2, note: 'hydrogen chloride' })
      ],
      fixtures: [
        ledgerFixture('ledger', { x: 121, y: 20 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 50, title: 'H₂ + Cl₂ → 2 HCl' }),
        markerFixture('dH', 'Estimated ΔH', { x: 121, y: 48 }, { min: -400, max: 400, step: 2, start: -400, unit: 'kJ', w: 52 })
      ],
      zones: {
        trays: [
          { id: 'broken', label: 'Broken', at: { x: 66, y: 20 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 },
          { id: 'formed', label: 'Formed', at: { x: 66, y: 50 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 }
        ]
      }
    }),
    hints: [
      'Sort the three bond cards into the trays, then read the two totals on the bond table.',
      'Compare the energy taken in by the bonds broken with the energy given out by the bonds formed.',
      'When more energy is given out than taken in, the reaction gives out heat and ΔH is negative.'
    ],
    check(state) {
      const t = state.table;
      const v = markerRead(t, 'dH');
      if (v === -400) return { ok: false, notYet: true, msg: 'Set the estimate you worked out.' };
      const r = ledgerRead(t, 'ledger');
      if (r.nBroken + r.nFormed < 4) return { ok: false, notYet: true, msg: 'Put every bond card in a tray first.' };
      if (Math.abs(v - HCL_SUMS.net) <= 2 && r.net === HCL_SUMS.net) return { ok: true };
      return { ok: false, msg: `The bond table reads ${r.broken} kJ for the bonds broken and ${r.formed} kJ for the bonds formed.` };
    },
    reward: {
      log: 'Bond enthalpies gave ΔH = −184 kJ for two moles of HCl.',
      title: 'Estimating ΔH',
      body: 'Breaking the bonds took in 678 kJ and forming the new ones gave out 862 kJ, so ΔH ≈ 678 − 862 = −184 kJ.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Drag one atom away from the other, then set the answer dial.'],
  3: ['Drag each bond card into a tray.'],
  4: ['Drag the card you choose into the slot.'],
  5: ['Drag a card into the slot.'],
  6: ['Drag each bond card into a tray, then set the dial.']
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
      body: 'Breaking a bond takes energy in, and forming it gives the same energy out. A reaction gives out heat when its new bonds give out more energy than breaking the old ones took in, and takes heat in when they give out less.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));

export const SOLUTIONS = [
  [put('in', 'slot:guess')],
  [dial('crank', 'pull', 7), dial('after', 'value', FORM_RIGHT)],
  [...sort({ ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' }), ...CH4_CHIPS.map(([id, , n]) => ({ scale: { piece: id, factor: n } }))],
  [put('cool', 'slot:guess')],
  [put('cool', 'slot:answer')],
  [...sort({ hh: 'broken', cc: 'broken', hc: 'formed' }), dial('dH', 'value', -184)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('crank', 'pull', 7), dial('after', 'value', 2)],
  [...sort({ ch: 'broken', oo: 'formed', co: 'formed', oh: 'formed' })],
  [],
  [put('warm', 'slot:answer')],
  [...sort({ hh: 'broken', cc: 'broken', hc: 'formed' }), dial('dH', 'value', 184)]
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
export const CHECKS = { FORM_OPTIONS, FORM_RIGHT, HCL_SUMS, CH4_SUMS, NO_SUMS, CH4_BROKEN, CH4_FORMED, NO_BROKEN, NO_FORMED, HH };
export { ledgerRead, wellRead };
