/**
 * Unit 5 · Bench 4 — Bond Enthalpies (q4-bonds)
 *
 * The sampling coil over a fumarole, and Ember Reach's fourth TABLETOP (plan `bench-tabletop.md`, phase T6), on the heat kit
 * (`table/kits/heat.js`). A crank pulls one bond out of its well and prints what that costs; a ledger sums the bond chips lying in its
 * two trays, Broken and Formed. The energy of a reaction is the climb to free atoms less the drop into products.
 *
 *   1  pulling H–H apart                        -> bond enthalpy
 *   2  letting the atoms snap back              -> (forming releases what breaking cost)
 *   3  which bonds burning methane breaks       -> (broken and formed bonds)
 *   4  the sum for burning methane              -> (ΔH is broken less formed)
 *   5  the sum against the calorimeter          -> average bond enthalpy
 *   6  why burning still releases heat          -> (the stronger products)
 *   7  a double bond against a single one       -> bond order
 *   8  a reaction that climbs                   -> (weaker products make it endothermic)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 2's crank prints the energy it releases only once the player has let go, so the prediction is
 * reasoned from stage 1 before it is tested. A ledger always shows its totals but, on the stages that ask for the net, never the net
 * itself.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, bondChip, numCard, markCard, tag, stmt, wellFixture, ledgerFixture, plaqueFixture, markerFixture, markerRead, ledgerRead, wellRead,
  whereIs, bondEnthalpySum, BOND_ENTHALPIES
} from '../../table/kits/heat.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bbond enthalpy\b/i, introducedAt: 1 },
  { term: /\baverage bond enthalpies\b/i, introducedAt: 5 },
  { term: /\bbond order\b/i, introducedAt: 7 }
];

/** Bonds are Ligar's first bench. */
export const BUILDS_ON = ['unit03/q1-joins'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const CH4_BROKEN = [{ bond: 'C-H', count: 4 }, { bond: 'O=O', count: 2 }];
const CH4_FORMED = [{ bond: 'C=O', count: 2 }, { bond: 'O-H', count: 4 }];
const CH4_SUMS = bondEnthalpySum(CH4_BROKEN, CH4_FORMED);   // broken 2648, formed 3450, net -802
const NO_BROKEN = [{ bond: 'N≡N', count: 1 }, { bond: 'O=O', count: 1 }];
const NO_FORMED = [{ bond: 'N=O', count: 2, dH: 631 }];
const NO_SUMS = bondEnthalpySum(NO_BROKEN, NO_FORMED);      // broken 1443, formed 1262, net +181

/** The two trays and the ledger over them that every ledger stage shares. */
const trays = (x = 40) => [
  { id: 'broken', label: 'Broken', at: { x, y: 20 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 },
  { id: 'formed', label: 'Formed', at: { x, y: 50 }, size: { w: 56, h: 24 }, cell: 27, cellH: 12 }
];
const CH4_CHIPS = [
  ['ch', 'C-H', 4, 'methane', 'broken'], ['oo', 'O=O', 2, 'oxygen', 'broken'],
  ['co', 'C=O', 2, 'carbon dioxide', 'formed'], ['oh', 'O-H', 4, 'water', 'formed']
];
const methaneChips = (laid, at) => CH4_CHIPS.map(([id, bond, count, note, side], i) =>
  ({ ...bondChip(id, bond, at(i), { count, note }), ...(laid ? { zone: `tray:${side}` } : {}) }));

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-break-hh',
    title: 'Pulling Two Atoms Out of Their Well',
    prompt: 'Pull the H–H bond apart completely, then set the marker to the energy it took, in kJ/mol.',
    briefing: {
      speaker: SPEAKER,
      body: 'Two bonded hydrogen atoms sit in a well of energy made by their shared electrons, and the crank pulls them out of it. Press Submit when the table shows your answer.'
    },
    widget,
    table: heatTable({
      fixtures: [
        wellFixture('crank', { x: 30, y: 32 }, { bond: 'H-H', atoms: ['H', 'H'], bondLabel: 'H–H', title: 'H–H crank' }),
        markerFixture('cost', 'Energy to break H–H', { x: 118, y: 34 }, { min: 236, max: 636, step: 50, start: 236, unit: 'kJ/mol', w: 52 })
      ]
    }),
    hints: [
      'Turn the Crank dial one setting at a time and watch the two atoms separate.',
      'Compare the energy the crank prints at each setting with the setting before.',
      'Set the marker to the figure the crank prints when the atoms are completely apart.'
    ],
    check(state) {
      const v = markerRead(state.table, 'cost');
      if (v === 236) return { ok: false, notYet: true, msg: 'Pull the bond with the crank, then set the marker to the energy it printed.' };
      if (v === BOND_ENTHALPIES['H-H'].dH) return { ok: true };
      return { ok: false, msg: 'Pull the bond all the way and read the energy printed beneath the atoms.' };
    },
    reward: {
      log: 'The crank printed what the bond costs.',
      title: 'Bond Enthalpy',
      body: 'The energy needed to break one mole of a gaseous bond into separate atoms is its bond enthalpy, and for H–H it is 436 kJ/mol. Breaking a bond always takes energy in.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
    return {
      id: 's2-form-hh',
      title: 'Falling Back Into the Same Well',
      prompt: 'Predict what happens to the energy when free hydrogen atoms snap together into H–H bonds, then test it.',
      widget,
      table: heatTable({
        fixtures: [wellFixture('crank', { x: 30, y: 28 }, { bond: 'H-H', atoms: ['H', 'H'], forming: true, hideCost: true, record: true, bondLabel: 'H + H', title: 'Atoms falling in' })],
        prediction: {
          slot: { id: 'predict', label: 'Falling into the bond', at: { x: 118, y: 30 }, size: { w: 30, h: 12 } },
          tokens: [token('release', 'Releases what breaking took', 60), token('absorb', 'Takes in the same again', 100), token('none', 'Neither: no exchange', 134)]
        }
      }),
      hints: [
        'Place a prediction, then press Let go and watch the atoms fall back into the well.',
        'Compare this trip with the one where you pulled the atoms apart: one climbs out of the well, and this one falls back in.',
        'A trip back down between the same two levels undoes what the trip up cost.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        if (token === 'release') return { ok: true };
        if (t.prediction.tested) return token === 'absorb'
          ? { ok: false, msg: 'Pulling the atoms apart took energy in, and falling back into the well cannot take it in again.' }
          : { ok: false, msg: 'The atoms end in a different place from where they began, so their energy changes.' };
        return { ok: false, msg: 'Press Let go and compare the energy it prints with your prediction.' };
      },
      reward: {
        log: 'The fall back released what the climb cost.',
        title: 'Forming a Bond',
        body: 'Forming a bond is the exact reverse of breaking it. The atoms fall back into the well and give out the same energy that pulling them out took in.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-count-methane',
    title: 'Taking Inventory of Broken and Formed Bonds',
    prompt: 'Sort each bond by whether burning methane breaks it or forms it.',
    briefing: {
      speaker: SPEAKER,
      body: 'Methane burns in oxygen to make carbon dioxide and water, and the ledger lists every bond on both sides.'
    },
    widget,
    table: heatTable({
      pieces: methaneChips(false, i => ({ x: 17, y: 14 + i * 13 })),
      fixtures: [ledgerFixture('ledger', { x: 121, y: 34 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 50, title: 'CH₄ + 2O₂ → CO₂ + 2H₂O' })],
      zones: { trays: trays(66) }
    }),
    hints: [
      'Read the label on each chip, and the molecule it comes from.',
      'Compare each molecule with the equation: which side of the arrow is it on?',
      'Bonds in the starting molecules are broken, and bonds in the new molecules are formed.'
    ],
    check(state) {
      const t = state.table;
      const want = { ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' };
      if (Object.keys(want).some(k => !['broken', 'formed'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Place all four bonds first.' };
      if (Object.entries(want).every(([k, v]) => whereIs(t, k) === v)) return { ok: true };
      return { ok: false, msg: 'Check which side of the equation each molecule is on: the starting molecules lose their bonds, and the new ones gain theirs.' };
    },
    reward: {
      log: 'The ledger was sorted into two columns.',
      title: 'Broken and Formed',
      body: 'A reaction breaks every bond in its starting molecules and forms every bond in its products. Burning one methane takes 4 C–H and 2 O=O bonds apart and builds 2 C=O and 4 O–H bonds.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const cards = [['minus', '−802', -802], ['plus', '+802', 802], ['total', '+6098', 6098], ['broken', '+2648', 2648]];
    return {
      id: 's4-estimate-dh',
      title: 'Up to Free Atoms, Down to Products',
      prompt: 'Use the ledger to estimate ΔH for burning methane, and put it in the slot, in kJ/mol.',
      widget,
      table: heatTable({
        pieces: [
          ...methaneChips(true, () => ({ x: 0, y: 0 })),
          ...cards.map(([id, label, v], i) => numCard(id, label, { x: 76 + i * 20, y: 56 }, v))
        ],
        fixtures: [ledgerFixture('ledger', { x: 108, y: 20 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 52, title: 'CH₄ + 2O₂ → CO₂ + 2H₂O' })],
        zones: { trays: trays(40), slots: [{ id: 'answer', label: 'Estimated ΔH', at: { x: 126, y: 40 }, size: { w: 20, h: 12 } }] }
      }),
      hints: [
        'Read the total for the bonds broken and the total for the bonds formed on the ledger.',
        'Compare what it costs to reach free atoms with what is paid back by building the products.',
        'Take the energy to break the bonds and subtract the energy released by forming the new ones.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Put a value in the slot.' };
        const net = ledgerRead(t, 'ledger').net;
        if (p.props.value === Math.round(net)) return { ok: true };
        if (p.props.value === -Math.round(net)) return { ok: false, msg: 'The sign is backward: ask which total is the larger, the climb to free atoms or the drop into products.' };
        if (p.props.value > 3000) return { ok: false, msg: 'The formed bonds give energy back, so the two totals must not simply be added.' };
        return { ok: false, msg: 'That is only the cost of breaking bonds; the energy from forming the new ones still has to be taken off.' };
      },
      reward: {
        log: 'The drop outweighed the climb.',
        title: 'Broken Less Formed',
        body: 'A reaction climbs to free atoms by breaking its bonds and then drops into its products by forming new ones. ΔH is the energy of the bonds broken minus the energy of the bonds formed.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    return {
      id: 's5-why-estimate',
      title: 'Why the Table Estimate Differs from the Cup',
      prompt: 'Mark the statement that explains why the bond estimate for burning methane differs from the calorimeter value.',
      widget,
      table: heatTable({
        pieces: [
          ...methaneChips(true, () => ({ x: 0, y: 0 })),
          markCard('avg', 'Table values are averages for gas molecules, and the calorimeter makes liquid water', { x: 126, y: 9 }),
          markCard('forgot', 'The calorimeter forgot to count the energy of breaking the C–H bonds', { x: 126, y: 26 }),
          markCard('ionic', 'Bond enthalpies apply only to ionic solids, not to gases', { x: 126, y: 43 }),
          { ...stmt('coil', 'Coil gauges: the water leaves as a liquid', { x: 88, y: 54 }), hidden: true, fetchFrom: 'coil' }
        ],
        fixtures: [
          ledgerFixture('ledger', { x: 86, y: 18 }, { broken: 'broken', formed: 'formed', hideNet: false, w: 36, title: 'The bond estimate' }),
          plaqueFixture('measured', 'Measured', { x: 86, y: 38 }, ['ΔH = −890 kJ/mol'], { w: 36 })
        ],
        zones: { trays: trays(34) },
        fetch: [{ id: 'coil', label: 'Coil Gauges', at: { x: 130, y: 57.5 } }]
      }),
      hints: [
        'Tap a statement to mark it, and tap it again to take the mark off.',
        'Compare the estimate with the measured value, and the conditions the table assumes with the conditions in the calorimeter.',
        'Ask whether a bond in one molecule costs exactly what the same kind of bond costs in every other, and what state the water is in.'
      ],
      check(state) {
        const t = state.table;
        const marked = ['avg', 'forgot', 'ionic'].filter(id => t.pieces[id].props.flipped);
        if (!marked.length) return { ok: false, notYet: true, msg: 'Mark the statement that explains the difference.' };
        if (marked.length === 1 && marked[0] === 'avg') return { ok: true };
        if (marked.includes('forgot')) return { ok: false, msg: 'A calorimeter measures the whole reaction, so it cannot miss a step of it.' };
        if (marked.includes('ionic')) return { ok: false, msg: 'The bonds on the ledger are all in gas molecules, so a rule about ionic solids cannot be the reason.' };
        return { ok: false, msg: 'Mark only the one statement that explains the difference.' };
      },
      reward: {
        log: 'The table gives an estimate, not a measurement.',
        title: 'Average Bond Enthalpies',
        body: 'Tabulated bond enthalpies are averages over many gas-phase molecules, so a sum from them is only an estimate. A calorimeter measures the real reaction, including the heat given out when steam condenses.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    return {
      id: 's6-why-burning-exo',
      title: 'Why Burning Still Releases Heat',
      prompt: 'Mark the statement the ledger supports: if breaking bonds costs energy, why does burning methane still release heat?',
      widget,
      table: heatTable({
        pieces: [
          ...methaneChips(true, () => ({ x: 0, y: 0 })),
          markCard('strong', 'The new bonds release more energy than breaking the old ones cost', { x: 126, y: 10 }),
          markCard('breakch', 'Breaking the C–H bonds releases heat as they snap apart', { x: 126, y: 28 }),
          markCard('nobreak', 'No bonds are broken; the atoms only rearrange', { x: 126, y: 46 })
        ],
        fixtures: [ledgerFixture('ledger', { x: 86, y: 34 }, { broken: 'broken', formed: 'formed', hideNet: false, w: 36, title: 'Cost and payoff' })],
        zones: { trays: trays(34) }
      }),
      hints: [
        'Tap a statement to mark it, and tap it again to take the mark off.',
        'Compare the total for breaking bonds with the total for forming them on the ledger.',
        'Heat is released when what is paid back by the new bonds is larger than what the old ones cost.'
      ],
      check(state) {
        const t = state.table;
        const marked = ['strong', 'breakch', 'nobreak'].filter(id => t.pieces[id].props.flipped);
        if (!marked.length) return { ok: false, notYet: true, msg: 'Mark the statement the ledger supports.' };
        if (marked.length === 1 && marked[0] === 'strong') return { ok: true };
        if (marked.includes('breakch')) return { ok: false, msg: 'Pulling atoms out of a bond is the climb, so it always takes energy in.' };
        if (marked.includes('nobreak')) return { ok: false, msg: 'The ledger lists bonds on the starting side, and they must be taken apart for the new ones to form.' };
        return { ok: false, msg: 'Mark only the one statement the ledger supports.' };
      },
      reward: {
        log: 'The payoff was larger than the cost.',
        title: 'Where the Heat Comes From',
        body: 'Breaking bonds never releases energy. Fuels burn hot because their atoms snap into stronger, lower-energy product bonds, and the energy those bonds give out is more than the old ones cost.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    return {
      id: 's7-double-vs-single',
      title: 'Single and Double Bond Wells',
      prompt: 'Rank the two carbon bonds by the energy needed to break them.',
      briefing: {
        speaker: SPEAKER,
        body: 'Both cranks hold two carbon atoms, one joined by a single shared pair and one by two.'
      },
      widget,
      table: heatTable({
        pieces: [tag('single', 'C–C single bond', { x: 55, y: 54 }), tag('double', 'C=C double bond', { x: 95, y: 54 })],
        fixtures: [
          wellFixture('single', { x: 28, y: 24 }, { bond: 'C-C', atoms: ['C', 'C'], bondLabel: 'C–C', title: 'C–C crank' }),
          wellFixture('double', { x: 80, y: 24 }, { bond: 'C=C', atoms: ['C', 'C'], bondLabel: 'C=C', title: 'C=C crank' })
        ],
        zones: { rail: { at: { x: 75, y: 54 }, size: { w: 100, h: 12 }, first: 'Least energy to break', last: 'Most energy to break', items: ['single', 'double'], start: ['double', 'single'] } }
      }),
      hints: [
        'Pull each bond all the way with its crank and read the energy it prints.',
        'Compare the two figures with the number of electron pairs shared in each bond.',
        'The bond with more shared pairs holds the nuclei more tightly, so it sits in a deeper well.'
      ],
      check(state) {
        const order = state.table.zones.rail.order;
        if (order.length < 2) return { ok: false, notYet: true, msg: 'Put both bonds in order.' };
        if (order.join(',') === 'single,double') return { ok: true };
        return { ok: false, msg: 'Compare the two figures the cranks print; they are not in that order.' };
      },
      reward: {
        log: 'The double bond cost more to break.',
        title: 'Bond Order',
        body: 'Between the same two elements, a higher bond order pulls the nuclei closer into a deeper well, so it takes more energy to break. A triple bond is stronger than a double, and a double is stronger than a single.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const cards = [['plus', '+181', 181], ['minus', '−181', -181], ['big', '+2705', 2705], ['zero', '0', 0]];
    return {
      id: 's8-predict-sign',
      title: 'A Reaction That Climbs',
      prompt: 'Sort the bonds into the ledger, then put the estimated ΔH for N₂ + O₂ → 2 NO in the slot.',
      briefing: {
        speaker: SPEAKER,
        body: 'Air is mostly nitrogen and oxygen, and the chips list the bonds in these two gases and in nitric oxide.'
      },
      widget,
      table: heatTable({
        pieces: [
          bondChip('nn', 'N≡N', { x: 17, y: 16 }, { note: 'nitrogen' }),
          bondChip('oo', 'O=O', { x: 17, y: 30 }, { note: 'oxygen' }),
          bondChip('no', 'N=O', { x: 17, y: 44 }, { count: 2, dH: 631, note: 'nitric oxide' }),
          ...cards.map(([id, label, v], i) => numCard(id, label, { x: 80 + i * 18, y: 56 }, v))
        ],
        fixtures: [ledgerFixture('ledger', { x: 108, y: 20 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 52, title: 'N₂ + O₂ → 2 NO' })],
        zones: {
          trays: [
            { id: 'broken', label: 'Broken', at: { x: 56, y: 20 }, size: { w: 28, h: 25 }, cell: 27, cellH: 12.5 },
            { id: 'formed', label: 'Formed', at: { x: 56, y: 50 }, size: { w: 28, h: 13 }, cell: 27, cellH: 12.5 }
          ],
          slots: [{ id: 'answer', label: 'Estimated ΔH', at: { x: 126, y: 38 }, size: { w: 20, h: 12 } }]
        }
      }),
      hints: [
        'Sort the chips, then read the total for the bonds broken and the total for the bonds formed.',
        'Compare the two totals before you subtract, and decide which sign the answer must have.',
        'Take the energy to break the bonds and subtract the energy released by forming the new ones.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Put a value in the slot.' };
        if (p.props.value === Math.round(NO_SUMS.net)) return { ok: true };
        if (p.props.value === -Math.round(NO_SUMS.net)) return { ok: false, msg: 'The sign is backward: compare which of the two totals is larger.' };
        if (p.props.value > 1000) return { ok: false, msg: 'The formed bonds pay energy back, so their total is taken off the broken total, not added to it.' };
        return { ok: false, msg: 'The two totals on the ledger are not equal, so the difference cannot be nothing.' };
      },
      reward: {
        log: 'Weaker product bonds made the reaction climb.',
        title: 'A Climbing Reaction',
        body: 'Here the bonds formed pay back less than the bonds broken cost, so ΔH is positive and the reaction absorbs heat. Not every reaction runs downhill, which is why nitrogen and oxygen sit side by side in air without burning.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Crank dial, then set the marker.'],
  2: ['Place a prediction, then press Let go.'],
  3: ['Drag each chip into a tray.'],
  4: ['Drag the right value into the slot.'],
  5: ['Tap a statement to mark it.'],
  6: ['Tap a statement to mark it.'],
  7: ['Turn each crank; drag the bonds into order.'],
  8: ['Drag each chip into a tray, then a value into the slot.']
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
      body: 'Every reaction climbs to free atoms by breaking its bonds and then drops into its products by forming new ones. When the new bonds are stronger the drop is larger, ΔH is negative, and the reaction releases heat.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Bond enthalpies let you estimate the heat of a reaction nobody has measured yet. They are averages, so the answer is a guide, not a reading.'
    },
    {
      heading: 'Next',
      body: 'The next bench finds the heat of a reaction by stacking known steps instead of counting bonds.'
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
const rail = (...ids) => ids.map((id, i) => put(id, `rail:${i}`));

export const SOLUTIONS = [
  [dial('crank', 'pull', 7), dial('cost', 'value', 436)],
  [{ predict: 'release' }, { run: 'crank' }],
  [...sort({ ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' })],
  [put('minus', 'slot:answer')],
  [{ fetch: 'coil' }, { flip: 'avg' }],
  [{ flip: 'strong' }],
  [dial('single', 'pull', 7), dial('double', 'pull', 7), ...rail('single', 'double')],
  [...sort({ nn: 'broken', oo: 'broken', no: 'formed' }), put('plus', 'slot:answer')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('crank', 'pull', 3), dial('cost', 'value', 286)],
  [{ predict: 'absorb' }, { run: 'crank' }],
  [...sort({ ch: 'formed', oo: 'broken', co: 'formed', oh: 'formed' })],
  [put('plus', 'slot:answer')],
  [{ flip: 'forgot' }],
  [{ flip: 'breakch' }],
  [...rail('double', 'single')],
  [...sort({ nn: 'broken', oo: 'broken', no: 'formed' }), put('minus', 'slot:answer')]
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
export { ledgerRead, wellRead, CH4_SUMS, NO_SUMS, CH4_BROKEN, CH4_FORMED, NO_BROKEN, NO_FORMED };
