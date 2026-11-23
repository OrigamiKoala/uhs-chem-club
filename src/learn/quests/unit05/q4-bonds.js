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

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
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
const trays = (x = 68) => [
  { id: 'broken', label: 'Broken', at: { x, y: 19 }, size: { w: 62, h: 25 }, cell: 29, cellH: 12 },
  { id: 'formed', label: 'Formed', at: { x, y: 49 }, size: { w: 62, h: 25 }, cell: 29, cellH: 12 }
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
    prompt: 'When two bonded hydrogen atoms are pulled apart, does that absorb energy or release energy?',
    widget,
    table: heatTable({
      pieces: [
        note('in', 'Absorbs energy', { x: 24, y: 16 }),
        note('out', 'Releases energy', { x: 70, y: 16 }),
        note('none', 'Needs no energy', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'bond', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Watch the clip showing two hydrogen atoms held together by a bond.',
      'Notice how the bond stretches as the two hydrogen atoms are pulled apart.',
      'Think about whether separating attracted atoms requires putting energy in, or whether they fly apart on their own.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(KEY_1, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for breaking the bond is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-crank',
    title: 'Apart and Back Together',
    briefing: { speaker: SPEAKER, body: 'Bond enthalpy is the energy needed to break one mole of a specific bond. The meter below the graph shows the energy absorbed or released as the atoms move.' },
    prompt: 'The meter shows pulling the bond apart: what is the energy change when the two free H atoms bond again?',
    widget,
    table: heatTable({
      fixtures: [
        wellFixture('crank', { x: 34, y: 30 }, { bond: 'H-H', atoms: ['H', 'H'], bondLabel: 'H–H', title: 'H–H bond', pullLabel: 'Pull' }),
        selectorFixture('after', 'When the atoms bond again', { x: 114, y: 32 }, { options: FORM_OPTIONS, start: 1, w: 60, list: true })
      ]
    }),
    hints: [
      'Slide the Pull knob (or drag the atoms apart) and watch the energy meter under the graph.',
      'Note the direction and amount of energy once the two atoms are completely separated.',
      'Letting the atoms bond again is the exact reverse of pulling them apart.'
    ],
    check(state) {
      const t = state.table;
      const r = wellRead(t, 'crank');
      const k = dialAt(t, 'after', 'value');
      if (!r.free) return { ok: false, notYet: true, msg: 'Pull the atoms all the way apart first.' };
      if (k === 1) return { ok: false, notYet: true, msg: 'Choose what happens when the atoms bond again.' };
      if (k === FORM_RIGHT) return { ok: true };
      return { ok: false, msg: `The meter read ENERGY IN, ${Math.round(r.E)} kJ/mol, while pulling the atoms apart, and you selected "${FORM_OPTIONS[k - 1]}" for bonding.` };
    },
    reward: {
      log: 'Breaking the bond absorbed energy; forming it released the same amount.',
      title: 'Bond Enthalpy',
      body: 'Breaking the H–H bond absorbed 436 kJ/mol, its bond enthalpy. Forming the bond releases the exact same 436 kJ/mol.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-methane',
    title: 'Burning Methane, Bond by Bond',
    briefing: { speaker: SPEAKER, body: 'During a reaction, reactant bonds break (absorbing energy) and product bonds form (releasing energy). The bond table totals each side as you sort.' },
    prompt: 'Which bonds break and which form when methane burns, and how many of each?',
    widget,
    table: heatTable({
      pieces: CH4_CHIPS.map(([id, bond, count, noteText], i) => bondChip(id, bond, { x: 17, y: 14 + i * 13 }, { note: noteText })),
      fixtures: [ledgerFixture('ledger', { x: 123, y: 34 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 48, title: 'CH₄ + 2O₂ → CO₂ + 2H₂O' })],
      zones: { trays: trays(68) }
    }),
    hints: [
      'Check the equation on the bond table and the molecule name on each bond card.',
      'Count how many of each molecule appear in the equation, and how many of that bond are inside one molecule.',
      'Bonds in molecules on the left of the arrow break, and bonds in molecules on the right form.'
    ],
    check(state) {
      const t = state.table;
      const want = { ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' };
      if (Object.keys(want).some(k => !['broken', 'formed'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Sort all four bond cards into the trays.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) {
        const off = CH4_CHIPS.find(([id, , n]) => (t.pieces[id].props.scale || 1) !== n);
        if (!off) return { ok: true };
        const k = t.pieces[off[0]].props.scale || 1;
        return { ok: false, msg: `The bond table currently counts ${k} ${off[1]} bond${k === 1 ? '' : 's'} for ${off[3]}; check the equation count (tap the card and press Larger).` };
      }
      const tray = t.zones.trays[whereIs(t, wrong[0])];
      return { ok: false, msg: `The "${tray.label}" tray has a bond from a molecule on the ${wrong[1] === 'broken' ? 'left' : 'right'} side of the arrow.` };
    },
    reward: {
      log: 'Burning methane released more energy than breaking its bonds cost.',
      title: 'Broken and Formed',
      body: 'Breaking the reactant bonds absorbed 2,648 kJ, while forming the product bonds released 3,450 kJ. More energy came out than went in, giving ΔH ≈ −802 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict-air',
    title: 'Air Joins Up',
    // A PREDICT STAGE on a new case of the same idea: the ledger is not on the table yet.
    predict: true,
    prompt: 'Nitrogen (N≡N) and oxygen (O=O) have very strong bonds, so will forming nitric oxide (NO) warm or cool the bath?',
    widget,
    table: heatTable({
      pieces: [
        note('warm', 'Warms the bath', { x: 24, y: 16 }),
        note('cool', 'Cools the bath', { x: 70, y: 16 }),
        note('same', 'No temperature change', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'air', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Watch the clip showing nitrogen and oxygen molecules held together by strong bonds.',
      'To form nitric oxide, the strong bonds in N₂ and O₂ must break before new N–O bonds form.',
      'Consider whether forming the new bonds will release more or less energy than breaking the old ones absorbs.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(KEY_2, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for nitrogen and oxygen is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-air',
    title: 'The Bond Table for Air',
    briefing: { speaker: SPEAKER, body: 'A double line (=) shows a double bond, and a triple line (≡) shows a triple bond. Compare the bonds broken and formed, then place your answer in the slot to unlock the totals.' },
    prompt: 'In N₂ + O₂ → 2 NO, does breaking the old bonds cost more energy than forming the new ones releases?',
    widget,
    table: heatTable({
      pieces: [
        { ...bondChip('nn', 'N≡N', { x: 17, y: 16 }, { note: 'nitrogen' }), zone: 'tray:broken' },
        { ...bondChip('oo', 'O=O', { x: 17, y: 30 }, { note: 'oxygen' }), zone: 'tray:broken' },
        { ...bondChip('no', 'N=O', { x: 17, y: 44 }, { count: 2, dH: 631, note: 'nitric oxide' }), zone: 'tray:formed' },
        tag('warm', 'Warms the bath', { x: 82, y: 56 }),
        tag('cool', 'Cools the bath', { x: 108, y: 56 }),
        tag('same', 'No temperature change', { x: 134, y: 56 })
      ],
      fixtures: [ledgerFixture('ledger', { x: 110, y: 17 }, { broken: 'broken', formed: 'formed', hideNet: true, hideTotalsUntilCommit: true, gate: { slot: 'answer' }, w: 52, title: 'N₂ + O₂ → 2 NO' })],
      zones: {
        trays: [
          { id: 'broken', label: 'Broken', at: { x: 36, y: 19 }, size: { w: 56, h: 25 }, cell: 27, cellH: 12 },
          { id: 'formed', label: 'Formed', at: { x: 36, y: 49 }, size: { w: 56, h: 25 }, cell: 27, cellH: 12 }
        ],
        slots: [{ id: 'answer', label: 'My answer', at: { x: 108, y: 38 }, size: { w: 34, h: 14 } }]
      }
    }),
    hints: [
      'Compare the two totals on the bond table: energy absorbed by broken bonds versus energy released by formed bonds.',
      'Check which total is larger: bonds broken or bonds formed.',
      'Any extra energy not paid back by the new bonds must be absorbed from the surrounding water bath.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      if (card.id === 'cool') return { ok: true };
      const r = ledgerRead(t, 'ledger');
      return { ok: false, msg: `The bond table shows ${r.broken} kJ absorbed by broken bonds and ${r.formed} kJ released by formed bonds.` };
    },
    reward: {
      log: 'Formed bonds released less energy than broken bonds cost.',
      title: 'An Endothermic Reaction',
      body: 'Breaking the bonds absorbed 1,443 kJ, while forming the new ones released only 1,262 kJ. The remaining 181 kJ came from the bath, cooling it: ΔH ≈ +181 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-estimate',
    title: 'Estimating ΔH',
    briefing: { speaker: SPEAKER, body: 'Sort the bonds into Broken and Formed, set the right count for each bond, and calculate ΔH from the two totals.' },
    prompt: 'Using the bond energies on the bench, what is ΔH for H₂ + Cl₂ → 2 HCl?',
    entry: { id: 'dH', label: 'Estimated ΔH', unit: 'kJ' },
    widget,
    table: heatTable({
      pieces: [
        bondChip('hh', 'H-H', { x: 17, y: 16 }, { note: 'hydrogen' }),
        bondChip('cc', 'Cl-Cl', { x: 17, y: 30 }, { note: 'chlorine' }),
        bondChip('hc', 'H-Cl', { x: 17, y: 44 }, { note: 'hydrogen chloride' })
      ],
      fixtures: [
        ledgerFixture('ledger', { x: 123, y: 34 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 48, title: 'H₂ + Cl₂ → 2 HCl' })
      ],
      zones: {
        trays: trays(68)
      }
    }),
    hints: [
      'Sort the three bond cards into Broken and Formed, set the H–Cl count to 2 with Larger, and read both totals.',
      'Compare the energy absorbed by broken bonds with the energy released by formed bonds.',
      'Calculate bonds broken minus bonds formed; when more energy is released than absorbed, ΔH is negative.'
    ],
    check(state) {
      const t = state.table;
      const v = entryNumber(t, 'dH');
      if (v == null || Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Enter your calculated ΔH, including its sign.' };
      const r = ledgerRead(t, 'ledger');
      if (r.nBroken + r.nFormed < 4) return { ok: false, notYet: true, msg: 'Sort all bond cards into trays and set the H–Cl count to 2 first.' };
      if (Math.abs(v - HCL_SUMS.net) <= 2 && r.net === HCL_SUMS.net) return { ok: true };
      return { ok: false, msg: `The bond table shows ${r.broken} kJ absorbed (broken) and ${r.formed} kJ released (formed); check the difference and sign.` };
    },
    reward: {
      log: 'Bond enthalpies gave ΔH = −184 kJ for 2 mol of HCl.',
      title: 'Estimating ΔH',
      body: 'Breaking the bonds absorbed 678 kJ and forming two H–Cl bonds released 862 kJ, giving ΔH ≈ −184 kJ. This is an estimate because tabulated bond enthalpies are averages.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag your prediction into the slot.'],
  2: ['Slide the Pull knob, then select your answer from the list.'],
  3: ['Drag each bond card into a tray; tap one to press Larger.'],
  4: ['Drag your prediction into the slot.'],
  5: ['Drag a card into the slot.'],
  6: ['Sort the bond cards (tap H–Cl and press Larger), then enter ΔH.']
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
      body: 'Breaking a bond always absorbs energy, and forming it releases the exact same amount. A reaction is exothermic when new bonds release more energy than breaking old bonds absorbed, and endothermic when they release less.'
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
  [...sort({ hh: 'broken', cc: 'broken', hc: 'formed' }), { scale: { piece: 'hc', factor: 2 } }, { type: { entry: 'dH', value: '-184' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('crank', 'pull', 7), dial('after', 'value', 2)],
  [...sort({ ch: 'broken', oo: 'formed', co: 'formed', oh: 'formed' })],
  [],
  [put('warm', 'slot:answer')],
  [...sort({ hh: 'broken', cc: 'broken', hc: 'formed' }), { scale: { piece: 'hc', factor: 2 } }, { type: { entry: 'dH', value: '184' } }]
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
    onLoad(r) {
      if (r.index === 1) {
        const g = recall(KEY_1);
        if (g && GUESS_1[g]) r.frame.note(`You predicted: ${GUESS_1[g]}. Test it with the Pull knob.`);
      } else if (r.index === 4) {
        const g = recall(KEY_2);
        if (g && GUESS_2[g]) r.frame.note(`You predicted: ${GUESS_2[g]}. Test it on the bond table.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { FORM_OPTIONS, FORM_RIGHT, HCL_SUMS, CH4_SUMS, NO_SUMS, CH4_BROKEN, CH4_FORMED, NO_BROKEN, NO_FORMED, HH };
export { ledgerRead, wellRead };
