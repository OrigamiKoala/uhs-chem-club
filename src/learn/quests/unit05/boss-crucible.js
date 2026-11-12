/**
 * boss-crucible.js — Learn world 5 elite: THE CRUCIBLE.
 *
 * The Fifth Guild's geothermal siphon core at the rim of the caldera. It is made of everything Ember Reach measured, and each of its
 * five phases puts the TABLETOP of a bench the player has worked back in front of them, on the heat kit (`table/kits/heat.js`), with a
 * new substance on the table and the Crucible standing in the table's corner, watching it. Each phase is a different tool and ONE decision:
 *
 *   1  the jacket    the heat a weighed water jacket caught                  (the cup, bench 2)
 *   2  the coil      the ledger of the bonds in ammonia, read                (the ledger, bench 4)
 *   3  the slag      iron oxide split, from two measured steps               (the stack, bench 5)
 *   4  the vent      the entropy change of splitting steam                   (the entropy table, bench 6)
 *   5  the seal      the temperature at which a limestone seal gives way     (the balance plot, bench 7)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one sentence
 * and never the answer; rung 1 names the control. A refusal names what the table shows, never the rule. Nothing blocks a correct commit.
 * A miss costs one point of Integrity and three knock the table back, with every reading and hint still kept. The foe is the Crucible
 * itself, in the corner pad of each table (`table/layout.js` `FOE_PAD`): it only observes, and a boss phase never declares a field stage
 * (the walk is suspended while the Crucible stands). No prediction is asked here: a boss tests what the benches taught.
 *
 * Clearing it files the Case File clue `clue_ember_siphon`. The boss pays no XP: the main story never does.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, eqn, bondChip, rxnFixture, cupFixture, plotFixture, plaqueFixture, markerFixture, selectorFixture, ledgerFixture, stackFixture, markerRead, dialAt,
  plotRead, ledgerRead, stackRead, cupRead, whereIs, fixed, gibbsFreeEnergy, SPECIFIC_HEAT_WATER, FORMATION_TABLE, bondEnthalpySum, heatTransfer, crossingTemperature
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

/** The reward card of each stage: the idea just worked out, named. No new word is introduced here. */
const S0 = id => FORMATION_TABLE[id].S0;
const STAGE_REWARDS = [
  { reward: { log: 'The jacket\'s warming gave the heat.', title: 'Jacket Vented', body: 'The 500 g jacket rose 20.0 °C, so it took in 500 × 4.184 × 20.0 = 41,840 J, which is about 41.8 kJ.' } },
  { reward: { log: 'The new bonds gave out more than the old ones took in.', title: 'Coil Cooled', body: `Breaking the bonds took in ${NH3.broken.toLocaleString('en-US')} kJ and forming six N–H bonds gave out ${NH3.formed.toLocaleString('en-US')} kJ, so ΔH ≈ −93 kJ: the reaction gives out heat.` } },
  { reward: { log: 'The slag came apart in two steps.', title: 'Slag Cracked', body: 'Flipping the second step turned its ΔH to +849.0 kJ and let the CO and CO₂ cancel. By Hess\'s law the stack adds up to ΔH = +824.2 kJ for splitting iron oxide.' } },
  { reward: { log: 'Two moles of gas became three.', title: 'Vent Sealed', body: `ΔS = (2 × ${S0('H2(g)')} + ${S0('O2(g)')}) − 2 × ${S0('H2O(g)')} = +${DS_STEAM.toFixed(1)} J/(mol·K). Two moles of gas became three, so the entropy rose.` } },
  { reward: { log: 'The seal gave way where ΔG reached zero.', title: 'Seal Broken', body: 'ΔG is zero where ΔH = TΔS, so T = 176,000 ÷ 160 = 1,100 K. Above that temperature ΔG is negative and the limestone breaks down by itself.', last: true } }
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
      prompt: 'How much heat did the water jacket take in from the Crucible?',
      entry: { id: 'kj', label: 'Heat taken in', unit: 'kJ' },
      widget,
      table: heatTable({
        fixtures: [
          c.fixture,
          plaqueFixture('ref', 'What you may use', { x: 88, y: 24 }, ['q = m × c × ΔT', 'c of water = 4.184 J/(g·°C)', '1 kJ = 1,000 J'], { w: 52 })
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
        'Read the mass printed on the jacket and the RISE beside its thermometer.',
        'Match the mass and the rise to the letters in q = m × c × ΔT on the plate.',
        'The equation gives its answer in joules, and this answer is asked for in kilojoules.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
        if (Math.abs(v - JACKET_KJ) < 1.1) return { ok: true };
        return { ok: false, msg: `${v} kJ would warm the 500 g jacket ${fixed((v * 1000) / (500 * SPECIFIC_HEAT_WATER), 1)} °C, and it rose ${fixed(cupRead(t, 'jacket').dT, 1)} °C.` };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    return {
      id: 'p2-bonds',
      title: 'Phase 2 · The Coil',
      prompt: 'What is the estimated ΔH for N₂ + 3 H₂ → 2 NH₃?',
      widget,
      table: heatTable({
        pieces: [
          { ...bondChip('nn', 'N≡N', { x: 17, y: 16 }, { note: 'nitrogen' }), zone: 'tray:broken' },
          { ...bondChip('hh', 'H-H', { x: 17, y: 30 }, { count: 3, note: 'hydrogen' }), zone: 'tray:broken' },
          { ...bondChip('nh', 'N-H', { x: 17, y: 44 }, { count: 6, note: 'ammonia' }), zone: 'tray:formed' }
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
        'Read the two totals on the bond table: the bonds broken and the bonds formed.',
        'Compare the energy taken in by the bonds broken with the energy given out by the bonds formed.',
        'When forming gives out more than breaking takes in, the reaction gives out the difference and ΔH is negative.'
      ],
      check(state) {
        const t = state.table;
        const v = dialAt(t, 'answer', 'value');
        if (v === 1) return { ok: true };
        if (v === 4) return { ok: false, notYet: true, msg: 'Set the estimate you worked out.' };
        const r = ledgerRead(t, 'ledger');
        return { ok: false, msg: `The bond table reads ${r.broken} kJ for the bonds broken and ${r.formed} kJ for the bonds formed.` };
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
      prompt: 'Which steps, flipped as needed, add up to Fe₂O₃(s) → 2 Fe(s) + 1.5 O₂(g)?',
      widget,
      table: heatTable({
        pieces: [
          eqn('c1', { x: 25.5, y: 18 }, [[1, S], [3, CO]], [[2, FE], [3, CO2]], -24.8),
          eqn('c2', { x: 25.5, y: 33 }, [[3, CO], [1.5, O2]], [[3, CO2]], -849.0)
        ],
        fixtures: [
          stackFixture('wanted', { x: 124, y: 42 }, { tray: 'stack', target: { lhs: [[1, S]], rhs: [[2, FE], [1.5, O2]] }, hideSum: false, w: 44, h: 34, ladder: { lo: -900, hi: 900 } })
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
        'Compare the reaction wanted with the reaction the stack prints under it.',
        'Find the substances that are in the stack but not in the reaction wanted.',
        'Two cards that both make the same substance cannot cancel it, so one of them has to run backwards.'
      ],
      check(state) {
        const t = state.table;
        const r = stackRead(t, 'wanted');
        if (r.empty) return { ok: false, notYet: true, msg: 'Stack the cards first.' };
        if (r.matches) return { ok: true };
        return { ok: false, msg: 'The stack adds up to a different reaction from the one wanted: compare the two reactions printed on it, one substance at a time.' };
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
      prompt: 'What is the entropy change, ΔS, for 2 H₂O(g) → 2 H₂(g) + O₂(g)?',
      widget,
      table: heatTable({
        fixtures: [
          plaqueFixture('s0', 'Entropy of one mole at 298 K, J/(mol·K)', { x: 46, y: 34 }, [`H₂O(g)    ${s0('H2O(g)')}`, `H₂(g)    ${s0('H2(g)')}`, `O₂(g)    ${s0('O2(g)')}`], { w: 70 }),
          selectorFixture('answer', 'ΔS (J/(mol·K))', { x: 112, y: 40 }, { options: ['+89.0', '−89.0', '+277.8', '+466.6', '—'], start: 5, w: 46 }),
          rxnFixture('atoms', { x: 104, y: 14 }, { lhs: [[2, 'H₂O']], rhs: [[2, 'H₂'], [1, 'O₂']], w: 40, h: 26 })
        ]
      }),
      foes: CRUCIBLE_FOE,
      encounter: {
        species: 'the crucible',
        act: 'Count Gas',
        intent: 'The Crucible\'s top vent splits steam into two different gases.'
      },
      hints: [
        'Read the entropy of one mole of each gas on the plate, and how many moles of each the equation has.',
        'Compare the total entropy of what the reaction makes with the total entropy of what it uses up.',
        'A substance with a 2 in front of it in the equation counts twice in its total.'
      ],
      check(state) {
        const v = dialAt(state.table, 'answer', 'value');
        if (v === 1) return { ok: true };
        if (v === 5) return { ok: false, notYet: true, msg: 'Set the value you worked out.' };
        if (v === 2) return { ok: false, msg: 'That sign says entropy falls, and the equation turns two moles of gas into three.' };
        if (v === 4) return { ok: false, msg: `That is the entropy of the products alone, ${(2 * s0('H2(g)') + s0('O2(g)')).toFixed(1)}, with nothing taken off.` };
        return { ok: false, msg: `That takes steam's ${s0('H2O(g)')} off once, and the equation uses two moles of it.` };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    return {
      id: 'p5-gibbs',
      title: 'Phase 5 · The Seal',
      prompt: 'At what temperature does the limestone seal start to break down by itself?',
      entry: { id: 'T', label: 'The seal breaks down above', unit: 'K' },
      widget,
      table: heatTable({
        fixtures: [
          plotFixture('plot', { x: 38, y: 30 }, { dH: 176, dS: 160, Ts: [600, 800, 1000, 1200, 1400], tempStart: 2, hideCrossing: true, title: 'Limestone seal' }),
          plaqueFixture('ref', 'The reaction', { x: 98, y: 28 }, ['CaCO₃(s) → CaO(s) + CO₂(g)', 'ΔH = +176 kJ', 'ΔS = +160 J/(mol·K)', 'ΔG = ΔH − TΔS', '1 kJ = 1,000 J'], { w: 52 })
        ]
      }),
      foes: CRUCIBLE_FOE,
      encounter: {
        species: 'the crucible',
        act: 'Find Crossing',
        intent: 'The Crucible drives its core up toward the heat at which its limestone seal gives way.'
      },
      hints: [
        'Drag the ball along the line and find the two settings between which ΔG changes from positive to negative.',
        'The seal starts to break down at the temperature between those settings where ΔG is neither positive nor negative.',
        'At that temperature ΔH and TΔS are the same size, once both are in the same unit.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'T');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the temperature in kelvin.' };
        if (Math.abs(v - T_SEAL) <= 15) return { ok: true };
        return { ok: false, msg: `At ${v} K, TΔS is ${fixed((v * 160) / 1000, 1, true)} kJ and ΔH is +176 kJ, so ΔG is ${fixed(gibbsFreeEnergy(176, 160, v), 1, true)} kJ.` };
      },
      ...STAGE_REWARDS[4]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Type your answer in the field at the bottom.'],
  2: ['Turn the dial to your answer.'],
  3: ['Drag cards into the stack; pick one up for Flip.'],
  4: ['Turn the dial to your answer.'],
  5: ['Drag the ball along the line, then type your answer in kelvin.']
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
      heading: 'The Siphon Manifold',
      body: 'The Crucible ran on five things you can now measure: the heat taken in by a water jacket, the energy of bonds broken and formed, steps added by Hess\'s law, the entropy of gases, and the temperature at which ΔG reaches zero.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));
const stack = (...ids) => ids.map(id => put(id, 'tray:stack'));

export const SOLUTIONS = [
  [{ type: { entry: 'kj', value: '42' } }],
  [dial('answer', 'value', 1)],
  [...stack('c1', 'c2'), { flip: 'c2' }],
  [dial('answer', 'value', 1)],
  [dial('plot', 'temp', 4), { type: { entry: 'T', value: '1100' } }]
];

export const MISSES = [
  [{ type: { entry: 'kj', value: '22' } }],
  [dial('answer', 'value', 2)],
  [...stack('c1', 'c2')],
  [dial('answer', 'value', 2)],
  [{ type: { entry: 'T', value: '800' } }]
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
