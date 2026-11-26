/**
 * Unit 5 · Bench 7 — Free Energy (q7-gibbs)
 *
 * The turbine hall's control room, on the heat kit (`table/kits/heat.js`). A plot of the net balance of a change against temperature,
 * with a dial that walks along it, and cards that each carry such a line. Whether a change runs on its own depends on two pulls, the heat it
 * takes in or gives out and the spreading it gains, and temperature turns up the second. Four stages and ONE click: the belief that a change
 * which takes heat in will not run by itself. A sixth, typed stage sums formation free energies for ΔG° (CED 9.3).
 *
 *   1  PREDICT: a cold pack takes heat in as its salt dissolves; does it dissolve on its own?
 *   2  TEST: turn the dial to the lowest temperature at which it does   -> spontaneous change, free energy
 *   3  four kinds of change sorted by when they run                     -> temperature as a lever
 *   4  the temperature at which ice starts to melt                       -> the crossing
 *
 * THE WRONG MODEL IS ON THE TABLE. "It stays solid" is a card, and the plot prints the two pulls in plain words, HEAT and SPREAD, and their
 * NET: the heat pull is positive at every setting and the net still goes below zero once the spread has grown enough. The symbols
 * come after, on the reward card.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  heatTable, note, leadFixture, rxnFixture, gCard, plotFixture, gibbsBarsFixture, plaqueFixture, whereIs, plotRead, plotAt, gibbsFreeEnergy, crossingTemperature, fixed, FORMATION_TABLE
} from '../../table/kits/heat.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bspontaneous\b/i, introducedAt: 2 },
  { term: /\bfree energy\b/i, introducedAt: 2 }
];

/** Heat and spreading are earned in the benches before this one. */
export const BUILDS_ON = ['unit05/q3-enthalpy', 'unit05/q6-entropy'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const QUEST_KEY = 'unit05/q7-gibbs';
const GUESS_LABEL = { on: '"It dissolves by itself"', off: '"It stays solid"', warm: '"Only if it is warmed"' };

// Stage 2: ammonium nitrate dissolving takes in 25.7 kJ per mole and gains 108 J/(mol·K) of spreading.
// One setting of the dial, 238 K, is where ΔH and TΔS are equal: the student places the ball there.
const SALT = { dH: 25.7, dS: 108, Ts: [150, 200, 238, 298, 350] };
const T_SALT = crossingTemperature(25.7, 108);
// Stage 4: ammonia synthesis gives out 92 kJ per mole of reaction and loses 199 J/(mol·K) of spreading; ΔG at 298 K is -32.7 kJ.
const HABER = { dH: -92, dS: -199, T: 298 };
const HABER_DG = gibbsFreeEnergy(HABER.dH, HABER.dS, HABER.T);
// Stage 5: melting ice takes in 6.01 kJ per mole and gains 22.0 J/(mol·K).
// The dial has no setting at the melting point: the plot shows which side each setting is on, and the temperature itself is worked out.
const ICE = { dH: 6.01, dS: 22.0, Ts: [250, 260, 270, 280, 300] };
const T_ICE = crossingTemperature(ICE.dH, ICE.dS);
// Stage 6: CH4(g) + 2 O2(g) -> CO2(g) + 2 H2O(l), ΔG°rxn = ΣΔGf°(products) - ΣΔGf°(reactants).
const DGF = id => FORMATION_TABLE[id].dGf;
const GF_DG = DGF('CO2(g)') + 2 * DGF('H2O(l)') - (DGF('CH4(g)') + 2 * DGF('O2(g)'));
/* ------------------------------------------------------------------
   THE SIX STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'A Pack That Chills',
    // A PREDICT STAGE: the plot is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Like a cold pack, this salt absorbs heat as it dissolves, so will it dissolve on its own at room temperature?',
    widget,
    table: heatTable({
      pieces: [
        note('on', 'It dissolves on its own', { x: 24, y: 16 }),
        note('off', 'It stays solid', { x: 70, y: 16 }),
        note('warm', 'Only if heated', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'salt', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Watch the clip showing a salt crystal sitting in water.',
      'Think about whether absorbing heat always stops a change from happening on its own.',
      'Consider both the heat absorbed and how much the salt particles spread out when dissolving.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the cold-pack salt is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-plot',
    title: 'Heat Against Entropy',
    briefing: {
      speaker: SPEAKER,
      body: [
        'A change that happens on its own is spontaneous. Watch the two bars beside the plot: HEAT absorbed (ΔH) and SPREAD gained (TΔS).',
        'Slide the temperature ball to find where SPREAD catches up to HEAT and free energy change (ΔG = ΔH − TΔS) crosses zero.'
      ]
    },
    prompt: 'At what temperature does the salt switch from staying solid to dissolving on its own?',
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: SALT.dH, dS: SALT.dS, Ts: SALT.Ts, tempStart: 1, hideCrossing: true, hideDG: true, bars: true, words: true, title: 'Cold-pack salt in water', w: 68 }),
        plaqueFixture('key', 'Free energy change', { x: 118, y: 22 }, ['HEAT (ΔH): heat absorbed', 'SPREAD (TΔS): T × entropy gained', 'NET (ΔG = ΔH − TΔS)', 'Kelvin: K = °C + 273', 'Below zero: spontaneous'], { w: 58 })
      ]
    }),
    hints: [
      'Drag the ball along the line (or turn the Temperature dial) and watch the HEAT and SPREAD bars.',
      'Notice which bar grows as temperature rises, and find where HEAT and SPREAD are equal.',
      'The salt switches over at the temperature where the SPREAD (TΔS) bar matches the HEAT (ΔH) bar.'
    ],
    check(state) {
      const t = state.table;
      const r = plotRead(t, 'plot');
      if (Math.round(t.fixtures.plot.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Drag the ball along the line to change the temperature.' };
      if (Math.abs(r.dG) < 0.05) return { ok: true };
      return { ok: false, msg: `At ${r.T} K, HEAT (ΔH) is ${fixed(r.dH, 1, true)} kJ and SPREAD (TΔS) is ${fixed(r.TdS, 1, true)} kJ, giving ΔG = ${fixed(r.dG, 1, true)} kJ, so the salt ${r.dG > 0 ? 'stays solid' : 'already dissolves on its own'}.` };
    },
    reward: {
      log: 'ΔG reached zero at 238 K.',
      title: 'Free Energy',
      body: 'Below 238 K, ΔH outweighs TΔS, so ΔG is positive and the salt stays solid. Above 238 K, including room temperature (298 K), ΔG is negative and dissolving is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-four-signs',
    title: 'The Four Cases',
    prompt: 'At which temperatures is each kind of change spontaneous?',
    widget,
    table: heatTable({
      pieces: [
        gCard('both-help', 'Heat out, entropy up', { x: 20, y: 14 }, { dH: -40, dS: 100, hideCurve: true }),
        gCard('both-oppose', 'Heat in, entropy down', { x: 54, y: 14 }, { dH: 40, dS: -100, hideCurve: true }),
        gCard('high-t', 'Heat in, entropy up', { x: 88, y: 14 }, { dH: 40, dS: 100, hideCurve: true }),
        gCard('low-t', 'Heat out, entropy down', { x: 122, y: 14 }, { dH: -40, dS: -100, hideCurve: true })
      ],
      zones: {
        trays: [
          { id: 'always', label: 'At every temperature', at: { x: 20, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 },
          { id: 'never', label: 'At no temperature', at: { x: 54, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 },
          { id: 'high', label: 'Only when hot', at: { x: 88, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 },
          { id: 'low', label: 'Only when cold', at: { x: 122, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 }
        ]
      }
    }),
    hints: [
      'Check both signs on each card: heat out (ΔH < 0) and entropy up (ΔS > 0) both make ΔG negative.',
      'When heat and entropy oppose each other, remember that TΔS grows larger as temperature rises.',
      'In ΔG = ΔH − TΔS, heat in with entropy up is spontaneous only when hot, while heat out with entropy down is spontaneous only when cold.'
    ],
    check(state) {
      const t = state.table;
      const want = { 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' };
      if (Object.keys(want).some(k => !['always', 'never', 'high', 'low'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Sort all four cards into the trays.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const { dH, dS } = t.pieces[wrong[0]].props;
      return { ok: false, msg: `"${t.pieces[wrong[0]].label}" is in "${t.zones.trays[whereIs(t, wrong[0])].label}", yet its ΔG is ${fixed(gibbsFreeEnergy(dH, dS, 100), 0, true)} kJ at 100 K and ${fixed(gibbsFreeEnergy(dH, dS, 600), 0, true)} kJ at 600 K.` };
    },
    reward: {
      log: 'All four ΔH and ΔS combinations sorted.',
      title: 'When Temperature Decides',
      body: 'Releasing heat while gaining entropy is always spontaneous; the opposite never is. When ΔH and ΔS have the same sign, temperature decides because TΔS grows as temperature rises.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-number',
    title: 'Free Energy at 298 K',
    briefing: {
      speaker: SPEAKER,
      body: 'To calculate ΔG, both terms must share the same unit: ΔH is in kJ and ΔS is in J/K, so divide TΔS by 1,000. Here is an example; your bench has a different reaction.',
      worked: [
        'A reaction with ΔH = +50 kJ and ΔS = +100 J/K at 400 K.',
        'TΔS = 400 × 100 = 40,000 J = 40 kJ',
        'ΔG = ΔH − TΔS',
        'ΔG = 50 − 40 = +10 kJ',
        'ΔG is positive, so the reaction is not spontaneous at 400 K.'
      ]
    },
    prompt: 'What is the free energy change (ΔG) of this reaction at 298 K?',
    entry: { id: 'dg', label: 'ΔG at 298 K', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('facts', 'N₂ + 3 H₂ → 2 NH₃', { x: 48, y: 27 }, [
          'ΔH = −92 kJ',
          'ΔS = −199 J/(mol·K)',
          'T = 298 K',
          'ΔG = ΔH − TΔS',
          '1 kJ = 1,000 J'
        ], { w: 72 }),
        rxnFixture('atoms', { x: 121, y: 28 }, { lhs: [[1, 'N₂'], [3, 'H₂']], rhs: [[2, 'NH₃']], w: 50, h: 34 })
      ]
    }),
    hints: [
      'Read ΔH, ΔS, and temperature on the reference plate, paying close attention to each unit.',
      'Because ΔS is negative here, TΔS is also negative.',
      'Follow the worked example, remembering that subtracting a negative TΔS makes ΔG less negative.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'dg');
      if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Enter your calculated ΔG in kJ.' };
      if (Math.abs(v - HABER_DG) <= 0.6) return { ok: true };
      if (Math.abs(v - (HABER.dH + (HABER.T * HABER.dS) / 1000)) <= 2) return { ok: false, msg: 'That value is lower than ΔH, but ΔS is negative, so losing entropy cannot make ΔG more negative.' };
      if (Math.abs(v - HABER.dH) <= 2) return { ok: false, msg: 'That is ΔH alone; include the TΔS term as well.' };
      if (Math.abs(v) > 5000) return { ok: false, msg: `That value is about ${Math.round(Math.abs(v / HABER.dH))} times larger than ΔH: remember kJ and J are different units.` };
      return { ok: false, msg: `Getting ${fixed(v, 1)} kJ would require TΔS to be ${fixed(HABER.dH - v, 1)} kJ, which does not match 298 K times ΔS.` };
    },
    reward: {
      log: 'ΔG at 298 K is −32.7 kJ.',
      title: 'ΔG From ΔH and ΔS',
      body: 'TΔS = 298 × (−199) J = −59.3 kJ, so ΔG = −92 − (−59.3) = −32.7 kJ. Because ΔG is negative, the reaction is spontaneous at 298 K.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-ice',
    title: 'Where Ice Starts to Melt',
    prompt: 'Using its ΔH and ΔS, at what temperature in kelvin does ice start to melt?',
    entry: { id: 'T', label: 'Ice starts to melt at', unit: 'K' },
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: ICE.dH, dS: ICE.dS, Ts: ICE.Ts, tempStart: 1, hideCrossing: true, title: 'Melting ice', w: 64 }),
        plaqueFixture('facts', 'Melting ice', { x: 118, y: 18 }, ['ΔH = +6.01 kJ', 'ΔS = +22.0 J/(mol·K)', 'ΔG = ΔH − TΔS', 'At ΔG = 0: T = ΔH ÷ ΔS', '1 kJ = 1,000 J'], { w: 54 })
      ]
    }),
    hints: [
      'Drag the ball along the line to find the two temperatures where ΔG switches from positive to negative.',
      'Ice starts to melt at the exact temperature between them where ΔG equals zero.',
      'At that crossing temperature, ΔH and TΔS are equal once both are in the same units.'
    ],
    check(state) {
      const t = state.table;
      if (Math.round(t.fixtures.plot.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Drag the ball along the line first to inspect the ΔG plot.' };
      const v = entryNumber(t, 'T');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the temperature in kelvin.' };
      if (Math.abs(v - T_ICE) <= 2) return { ok: true };
      return { ok: false, msg: `At ${v} K, TΔS is ${fixed((v * ICE.dS) / 1000, 2, true)} kJ and ΔH is +6.01 kJ, giving ΔG = ${fixed(gibbsFreeEnergy(ICE.dH, ICE.dS, v), 2, true)} kJ.` };
    },
    reward: {
      log: 'ΔG crossed zero at 273 K, the melting point of ice.',
      title: 'The Melting Point',
      body: 'ΔG equals zero where ΔH = TΔS, so T = 6,010 ÷ 22.0 = 273 K (0 °C). Below 273 K ice stays solid; above 273 K melting is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-formation',
    title: 'Free Energy From Formation',
    briefing: {
      speaker: SPEAKER,
      body: 'Just like enthalpy of formation, standard free energy of reaction (ΔG°) equals the sum of ΔGf° of products minus reactants. Pure elements in their standard state have ΔGf° = 0.',
      worked: [
        `2 CO(g) + O₂(g) → 2 CO₂(g) at 298 K`,
        `ΔGf° in kJ/mol: CO(g) ${DGF('CO(g)')}, O₂(g) ${DGF('O2(g)')}, CO₂(g) ${DGF('CO2(g)')}`,
        `Products: 2 × (${DGF('CO2(g)')}) = ${fixed(2 * DGF('CO2(g)'), 1)} kJ`,
        `Reactants: 2 × (${DGF('CO(g)')}) + 0 = ${fixed(2 * DGF('CO(g)'), 1)} kJ`,
        `ΔG° = ${fixed(2 * DGF('CO2(g)'), 1)} − (${fixed(2 * DGF('CO(g)'), 1)}) = ${fixed(2 * DGF('CO2(g)') - 2 * DGF('CO(g)'), 1)} kJ`
      ]
    },
    prompt: 'What is ΔG° at 298 K for CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(l)?',
    entry: { id: 'dgf', label: 'ΔG° at 298 K', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('facts', 'Standard free energy of formation, ΔGf° (298 K)', { x: 48, y: 27 }, [
          `CH₄(g): ${DGF('CH4(g)')} kJ/mol`,
          `O₂(g): ${DGF('O2(g)')} kJ/mol (standard state)`,
          `CO₂(g): ${DGF('CO2(g)')} kJ/mol`,
          `H₂O(l): ${DGF('H2O(l)')} kJ/mol`,
          'ΔG°rxn = ΣΔGf°(products) − ΣΔGf°(reactants)'
        ], { w: 86 }),
        rxnFixture('atoms', { x: 121, y: 28 }, { lhs: [[1, 'CH₄'], [2, 'O₂']], rhs: [[1, 'CO₂'], [2, 'H₂O']], w: 50, h: 34 })
      ]
    }),
    hints: [
      'Read the ΔGf° value for each substance on the reference plate.',
      'Multiply each ΔGf° by its coefficient in the equation, noting that O₂(g) is 0.',
      'Subtract the reactant total from the product total, keeping track of negative signs.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'dgf');
      if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Enter ΔG° at 298 K in kJ.' };
      if (Math.abs(v - GF_DG) <= 1.0) return { ok: true };
      if (Math.abs(v + GF_DG) <= 1.0) return { ok: false, msg: 'The sign is reversed: check that you subtracted reactants from products.' };
      if (Math.abs(v - (DGF('CO2(g)') + DGF('H2O(l)') - DGF('CH4(g)'))) <= 1.0) return { ok: false, msg: 'That uses only 1 mol of H₂O(l), but the equation produces 2 mol.' };
      return { ok: false, msg: `${fixed(v, 1)} kJ does not match ΣΔGf°(products) − ΣΔGf°(reactants) for this equation.` };
    },
    reward: {
      log: 'ΔG° is −818.1 kJ.',
      title: 'ΔG° From Formation Values',
      body: 'ΔG° = (−394.4 + 2 × (−237.1)) − (−50.5 + 0) = −818.1 kJ. Elements in their standard state, like O₂(g), have ΔGf° = 0.'
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
      body: 'A change is spontaneous when its free energy change (ΔG = ΔH − TΔS) is negative. Releasing heat and gaining entropy both lower ΔG; when they oppose each other, temperature decides because TΔS grows as temperature rises.'
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
  [put('on', 'slot:guess')],
  [dial('plot', 'temp', 3)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' })],
  [{ type: { entry: 'dg', value: '-32.7' } }],
  [dial('plot', 'temp', 3), { type: { entry: 'T', value: '273' } }],
  [{ type: { entry: 'dgf', value: '-818.1' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('plot', 'temp', 4)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'low', 'low-t': 'high' })],
  [{ type: { entry: 'dg', value: '59210' } }],
  [dial('plot', 'temp', 5), { type: { entry: 'T', value: '303' } }],
  [{ type: { entry: 'dgf', value: '818.1' } }]
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
        const g = recall(QUEST_KEY);
        if (g && GUESS_LABEL[g]) r.frame.note(`You predicted: ${GUESS_LABEL[g]}. Test it on the plot.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { SALT, T_SALT, ICE, T_ICE, HABER, HABER_DG, GF_DG };
export { plotRead, plotAt };
