/**
 * boss-crucible.js — Learn world 5 elite: THE CRUCIBLE.
 *
 * The Fifth Guild's geothermal siphon core at the rim of the caldera. It is made of everything Ember Reach measured, and each of its
 * five phases puts the TABLETOP of a bench the player has worked back in front of them (plan `bench-tabletop.md`, phase T6), on the heat
 * kit (`table/kits/heat.js`), with a new substance on the table and the Crucible standing in the table's corner, watching it:
 *
 *   1  the jacket    heat caught by a weighed water jacket                  (bench 2)
 *   2  the coil      ΔH for ammonia from a bond ledger                      (bench 4)
 *   3  the slag      ΔH for splitting iron oxide from a stack of steps      (bench 5)
 *   4  the vent      ΔS for splitting steam from an entropy table           (bench 6)
 *   5  the seal      the temperature at which a decomposition tips over     (bench 7)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence
 * and never the answer. Nothing blocks a correct commit. A miss costs one point of Integrity and three knock the table back, with every
 * reading and hint still kept. The foe is the Crucible itself, in the corner pad of each table (`table/layout.js` `FOE_PAD`): it only
 * observes, and a boss phase never declares a field stage (the walk is suspended while the Crucible stands).
 *
 * Clearing it files the Case File clue `clue_ember_siphon`. The boss pays no XP: the main story never does.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, eqn, bondChip, cupFixture, plotFixture, plaqueFixture, markerFixture, selectorFixture, ledgerFixture, stackFixture, markerRead, dialAt,
  plotRead, whereIs, SPECIFIC_HEAT_WATER, FORMATION_TABLE, bondEnthalpySum, heatTransfer, crossingTemperature
} from '../../table/kits/heat.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit05/q2-calorimetry', 'unit05/q4-bonds', 'unit05/q5-hess', 'unit05/q6-entropy', 'unit05/q7-gibbs'
];

const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The Crucible, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const CRUCIBLE_FOE = [{ id: 'crucible', label: 'The Crucible' }];

const widget = { type: 'table', label: 'The bench' };
const MOUTH = 'slot:jacket.mouth';

const JACKET_KJ = heatTransfer(500, SPECIFIC_HEAT_WATER, 20) / 1000; // 41.84
const NH3 = bondEnthalpySum(
  [{ bond: 'N≡N', count: 1 }, { bond: 'H-H', count: 3 }],
  [{ bond: 'N-H', count: 6 }]
); // broken 2253, formed 2346, net -93
const T_SEAL = crossingTemperature(176, 160); // 1100
const DS_STEAM = 2 * FORMATION_TABLE['H2(g)'].S0 + FORMATION_TABLE['O2(g)'].S0 - 2 * FORMATION_TABLE['H2O(g)'].S0; // +89.0

const STACK_TRAY = { id: 'stack', label: 'The stack', at: { x: 76, y: 25 }, size: { w: 52, h: 26 }, cell: 50, cellH: 13 };

/** The reward card of each stage: the idea just worked out, named. */
const STAGE_REWARDS = [
  { reward: { log: 'The jacket\'s warming gave the heat.', title: 'Jacket Vented', body: 'The heat a bath absorbs is its mass times its specific heat capacity times its temperature rise. The Crucible\'s surplus went into the water, and the jacket now reads true.' } },
  { reward: { log: 'The product bonds paid back more than they cost.', title: 'Coil Cooled', body: 'Forming six N–H bonds gives back slightly more than breaking N≡N and three H–H bonds costs, so ammonia\'s synthesis releases heat. The coil\'s own energy has gone out of it.' } },
  { reward: { log: 'The slag came apart in two steps.', title: 'Slag Cracked', body: 'Turning the second card round makes the carbon oxides cancel and leaves iron oxide splitting into iron and oxygen. Hess\'s law gave the climb without anyone running the reaction.' } },
  { reward: { log: 'Two moles of gas became three.', title: 'Vent Sealed', body: 'Splitting steam turns two moles of gas into three, so the products hold more entropy than the reactants. ΔS° is positive, and the Crucible\'s vent loses its pressure.' } },
  { reward: { log: 'The seal gave way at its crossing point.', title: 'Seal Broken', body: 'Above ΔH divided by ΔS, the TΔS term outweighs the heat the limestone costs and ΔG turns negative. The Crucible\'s core stands open.', last: true } }
];

/* ------------------------------------------------------------------
   THE FIVE PHASES
   Each keeps the top-right corner clear for the foe (`FOE_PAD`: x from 126.5, y to 23.5 on a 150 x 64 table).
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const c = cupFixture('jacket', { x: 30, y: 32 }, { title: 'Cooling jacket · 500 g', water: 500, T0: 20, joules: Math.round(JACKET_KJ * 1000) });
    return {
      id: 'p1-jacket',
      title: 'Phase 1 · The Jacket',
      briefing: {
        speaker: SPEAKER,
        body: 'This is the siphon core the Fifth Guild built at the rim, and each phase puts one of the benches in front of it again. A miss costs the table a point of Integrity; three knock it back, and nothing you have read is lost.'
      },
      prompt: 'Set the marker to the heat the water jacket absorbed from the Crucible, in kilojoules.',
      widget,
      table: heatTable({
        fixtures: [
          c.fixture,
          plaqueFixture('ref', 'What you may use', { x: 88, y: 24 }, ['q = m × c × ΔT', 'c of water = 4.184 J/(g·°C)', '1 kJ = 1000 J'], { w: 52 }),
          markerFixture('kj', 'Heat absorbed', { x: 88, y: 48 }, { min: 10, max: 90, step: 2, start: 10, unit: 'kJ', w: 46 })
        ],
        zones: { slots: [c.slot] }
      }),
      foes: CRUCIBLE_FOE,
      encounter: {
        species: 'the crucible',
        act: 'Meter Heat',
        intent: 'The Crucible dumps its surplus heat into the water jacket around it.'
      },
      hints: [
        'Read the jacket\'s mass and its temperature rise from the cup.',
        'Compare the mass, the specific heat capacity and the rise, each of which the heat depends on.',
        'Multiply the three together, then turn the joules into kilojoules.'
      ],
      check(state) {
        const v = markerRead(state.table, 'kj');
        if (v === 10) return { ok: false, notYet: true, msg: 'Set the marker to the heat.' };
        if (Math.abs(v - JACKET_KJ) < 1.1) return { ok: true };
        if (v > 85) return { ok: false, msg: 'The sum comes out in joules, and a kilojoule is a thousand of them.' };
        return { ok: false, msg: 'Check that the sum uses the jacket\'s whole mass and the whole of its temperature rise, each once.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const cards = ['−93', '+93', '−2346', '+4599'];
    void cards;
    return {
      id: 'p2-bonds',
      title: 'Phase 2 · The Coil',
      prompt: 'Sort the bonds into the ledger, then set the estimated ΔH for N₂ + 3 H₂ → 2 NH₃, in kJ/mol.',
      widget,
      table: heatTable({
        pieces: [
          bondChip('nn', 'N≡N', { x: 17, y: 16 }, { note: 'nitrogen' }),
          bondChip('hh', 'H-H', { x: 17, y: 30 }, { count: 3, note: 'hydrogen' }),
          bondChip('nh', 'N-H', { x: 17, y: 44 }, { count: 6, note: 'ammonia' })
        ],
        fixtures: [
          ledgerFixture('ledger', { x: 102, y: 22 }, { broken: 'broken', formed: 'formed', hideNet: true, w: 46, title: 'N₂ + 3 H₂ → 2 NH₃' }),
          selectorFixture('answer', 'Estimated ΔH', { x: 102, y: 48 }, { options: ['−93 kJ/mol', '+93 kJ/mol', '−2346 kJ/mol', '+4599 kJ/mol'], start: 4, w: 46 })
        ],
        zones: {
          trays: [
            { id: 'broken', label: 'Broken', at: { x: 56, y: 22 }, size: { w: 28, h: 26 }, cell: 27, cellH: 13 },
            { id: 'formed', label: 'Formed', at: { x: 56, y: 50 }, size: { w: 28, h: 14 }, cell: 27, cellH: 13 }
          ]
        }
      }),
      foes: CRUCIBLE_FOE,
      encounter: {
        species: 'the crucible',
        act: 'Balance Bonds',
        intent: 'Nitrogen and hydrogen charge the Crucible\'s synthesis coil.'
      },
      hints: [
        'Sort the chips, then read the total for the bonds broken and the total for the bonds formed.',
        'Compare the cost of reaching free atoms with the payoff of building the product.',
        'Take the energy to break the bonds and subtract the energy released by forming the new ones.'
      ],
      check(state) {
        const v = dialAt(state.table, 'answer', 'value');
        if (v === 1) return { ok: true };
        if (v === 4) return { ok: false, notYet: true, msg: 'Set the estimate you worked out.' };
        if (v === 2) return { ok: false, msg: 'The sign is backward: compare which of the two totals is the larger.' };
        if (v === 3) return { ok: false, msg: 'That is only the energy of the bonds formed; the cost of the bonds broken still has to be counted.' };
        return { ok: false, msg: 'The bonds formed give energy back, so their total is taken off the broken total, not added to it.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const S = 'Fe₂O₃(s)'; const FE = 'Fe(s)'; const CO = 'CO(g)'; const CO2 = 'CO₂(g)'; const O2 = 'O₂(g)';
    return {
      id: 'p3-hess',
      title: 'Phase 3 · The Slag',
      prompt: 'Make the stack add up to Fe₂O₃(s) → 2 Fe(s) + 1.5 O₂(g), then set its net ΔH.',
      widget,
      table: heatTable({
        pieces: [
          eqn('c1', { x: 25.5, y: 18 }, [[1, S], [3, CO]], [[2, FE], [3, CO2]], -24.8),
          eqn('c2', { x: 25.5, y: 33 }, [[3, CO], [1.5, O2]], [[3, CO2]], -849.0)
        ],
        fixtures: [
          stackFixture('wanted', { x: 124, y: 40 }, { tray: 'stack', target: { lhs: [[1, S]], rhs: [[2, FE], [1.5, O2]] }, hideSum: true, w: 44, h: 30 }),
          selectorFixture('answer', 'Net ΔH (kJ/mol)', { x: 76, y: 52 }, { options: ['+824.2', '−873.8', '−824.2', '+849.0'], start: 4, w: 52 })
        ],
        zones: { trays: [STACK_TRAY] }
      }),
      foes: CRUCIBLE_FOE,
      encounter: {
        species: 'the crucible',
        act: 'Stack Steps',
        intent: 'Molten iron slag seals the plates of the Crucible\'s lower exchanger.'
      },
      hints: [
        'Drag both cards into the stack and compare its equation with the target.',
        'Pick up a card and press Flip, and watch what happens to its ΔH.',
        'Turn the card that has the wrong side, so that everything not in the target cancels, then add the cards.'
      ],
      check(state) {
        const v = dialAt(state.table, 'answer', 'value');
        if (v === 1) return { ok: true };
        if (v === 4) return { ok: false, notYet: true, msg: 'Stack the cards, turning one round if you need to, and set the net.' };
        if (v === 2) return { ok: false, msg: 'Added as printed, the cards leave carbon dioxide and carbon monoxide uncancelled.' };
        if (v === 3) return { ok: false, msg: 'The sign is backward: one card is turned round, and the other keeps its own.' };
        return { ok: false, msg: 'That is only the turned card; the first card is still to be added.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const s0 = id => FORMATION_TABLE[id].S0;
    return {
      id: 'p4-entropy',
      title: 'Phase 4 · The Vent',
      prompt: 'Use the entropy table to find ΔS° for 2 H₂O(g) → 2 H₂(g) + O₂(g), and set it on the dial.',
      widget,
      table: heatTable({
        fixtures: [
          plaqueFixture('s0', 'S° at 298 K, J/(mol·K)', { x: 46, y: 34 }, [`H₂O(g)    ${s0('H2O(g)')}`, `H₂(g)    ${s0('H2(g)')}`, `O₂(g)    ${s0('O2(g)')}`], { w: 70 }),
          selectorFixture('answer', 'ΔS° (J/(mol·K))', { x: 112, y: 40 }, { options: ['+89.0', '−89.0', '+277.8', '+466.6'], start: 4, w: 46 })
        ]
      }),
      foes: CRUCIBLE_FOE,
      encounter: {
        species: 'the crucible',
        act: 'Count Gas',
        intent: 'The Crucible\'s top vent splits steam into two different gases.'
      },
      hints: [
        'Read the S° of each substance from the table, and count the moles of each in the equation.',
        'Compare the total for the products with the total for the reactants, counting every mole.',
        'Add the entropies of the products, then take off those of the reactants, each multiplied by its moles.'
      ],
      check(state) {
        const v = dialAt(state.table, 'answer', 'value');
        if (v === 1) return { ok: true };
        if (v === 4) return { ok: false, notYet: true, msg: 'Set the value you worked out.' };
        if (v === 2) return { ok: false, msg: 'The sign is backward: two moles of gas become three, and the table shows which total is larger.' };
        if (v === 3) return { ok: false, msg: 'The equation has two moles of steam, and each mole carries its own entropy.' };
        return { ok: false, msg: 'That is only the products\' total; the reactants\' entropy still has to be taken off.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    return {
      id: 'p5-gibbs',
      title: 'Phase 5 · The Seal',
      prompt: 'Set the marker to the temperature in kelvin at which ΔG reaches zero for the limestone seal.',
      widget,
      table: heatTable({
        fixtures: [
          plotFixture('plot', { x: 38, y: 30 }, { dH: 176, dS: 160, Ts: [600, 800, 900, 1000, 1100, 1200, 1400], tempStart: 3, hideCrossing: true, hideTug: true, title: 'Limestone seal' }),
          plaqueFixture('ref', 'The reaction', { x: 98, y: 33 }, ['CaCO₃(s) → CaO(s) + CO₂(g)', 'ΔG = ΔH − T × ΔS'], { w: 52 }),
          markerFixture('T', 'ΔG is zero at', { x: 98, y: 52 }, { min: 700, max: 1500, step: 100, start: 700, unit: 'K', w: 46 })
        ]
      }),
      foes: CRUCIBLE_FOE,
      encounter: {
        species: 'the crucible',
        act: 'Find Crossing',
        intent: 'The Crucible drives its core up toward the heat at which its limestone seal gives way.'
      },
      hints: [
        'Read the ΔH, the ΔS and their units from the plot, and turn the Temperature dial.',
        'Compare the units of ΔH and ΔS before you put them in one equation.',
        'Set ΔG to zero, put both in the same unit, and solve for the temperature.'
      ],
      check(state) {
        const v = markerRead(state.table, 'T');
        if (v === 700) return { ok: false, notYet: true, msg: 'Set the marker to the temperature.' };
        if (v === T_SEAL) return { ok: true };
        return { ok: false, msg: 'Check that ΔH and ΔS are in the same energy unit before you divide one by the other.' };
      },
      ...STAGE_REWARDS[4]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Set the marker; the cup prints no heat.'],
  2: ['Drag each chip into a tray, then turn the dial.'],
  3: ['Drag cards into the stack; Flip turns one round.'],
  4: ['Turn the dial to the value you worked out.'],
  5: ['Turn the Temperature dial; set the marker.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: 'clue_ember_siphon',
  sections: [
    {
      heading: 'What You Found',
      body: 'The Crucible splits along its firebrick seams. Inside is a heat exchanger that carried megawatts away from the shelters without a wisp of steam reaching the sky.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase was a bench you had already worked: a bath, a ledger of bonds, a stack of steps, a table of entropies and a balance of two terms. That is all of Ember Reach, and it was enough to read the machine.'
    },
    {
      heading: 'Next',
      body: 'The siphon manifold goes into the Case File. The raiders were feeding a hidden endothermic process far below the crust, and no thermometer at the surface could have seen it.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A 250 g bath of water (c = 4.184 J/(g·°C)) warms by 4.0 °C. How much heat did it absorb?',
    options: [
      { id: 'a', label: '4180 J' },
      { id: 'b', label: '1050 J' },
      { id: 'c', label: '2090 J' },
      { id: 'd', label: '16 700 J' }
    ],
    answer: 'a',
    explanation: 'Heat is mass times c times the rise: 250 g × 4.184 J/(g·°C) × 4.0 °C is about 4180 J.'
  },
  {
    question: 'Breaking bonds costs 1370 kJ and forming new ones gives back 1852 kJ. What is the estimated ΔH?',
    options: [
      { id: 'a', label: '−482 kJ' },
      { id: 'b', label: '+482 kJ' },
      { id: 'c', label: '−3222 kJ' },
      { id: 'd', label: '+3222 kJ' }
    ],
    answer: 'a',
    explanation: 'ΔH is the energy of the bonds broken minus the energy of the bonds formed: 1370 − 1852 = −482 kJ.'
  },
  {
    question: 'A → B has ΔH = +80 kJ and C → B has ΔH = +30 kJ. What is ΔH for A → C?',
    options: [
      { id: 'a', label: '+50 kJ' },
      { id: 'b', label: '−50 kJ' },
      { id: 'c', label: '+110 kJ' },
      { id: 'd', label: '−110 kJ' }
    ],
    answer: 'a',
    explanation: 'Turn the second step round to give B → C with ΔH = −30 kJ, then add it to the first: +80 − 30 = +50 kJ.'
  },
  {
    question: 'Which reaction has a positive ΔS°?',
    options: [
      { id: 'a', label: '2 N₂O(g) → 2 N₂(g) + O₂(g)' },
      { id: 'b', label: '2 NO₂(g) → N₂O₄(g)' },
      { id: 'c', label: 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)' }
    ],
    answer: 'a',
    explanation: 'The first makes three moles of gas from two. The other two use up gas or free ions and lose entropy.'
  },
  {
    question: 'A decomposition has ΔH = +60 kJ/mol and ΔS = +100 J/(mol·K). Above what temperature is it spontaneous?',
    options: [
      { id: 'a', label: '600 K' },
      { id: 'b', label: '6.0 K' },
      { id: 'c', label: '60 K' },
      { id: 'd', label: '1670 K' }
    ],
    answer: 'a',
    explanation: 'The crossing temperature is ΔH divided by ΔS: 60 000 J/mol divided by 100 J/(mol·K) is 600 K.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));
const stack = (...ids) => ids.map(id => put(id, 'tray:stack'));

export const SOLUTIONS = [
  [dial('kj', 'value', 42)],
  [...sort({ nn: 'broken', hh: 'broken', nh: 'formed' }), dial('answer', 'value', 1)],
  [...stack('c1', 'c2'), { flip: 'c2' }, dial('answer', 'value', 1)],
  [dial('answer', 'value', 1)],
  [dial('plot', 'temp', 5), dial('T', 'value', 1100)]
];

export const MISSES = [
  [dial('kj', 'value', 22)],
  [...sort({ nn: 'broken', hh: 'broken', nh: 'formed' }), dial('answer', 'value', 2)],
  [...stack('c1', 'c2'), dial('answer', 'value', 2)],
  [dial('answer', 'value', 2)],
  [dial('T', 'value', 700 + 100)]
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
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };
  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { JACKET_KJ, NH3, T_SEAL, DS_STEAM };
export { plotRead, whereIs };
