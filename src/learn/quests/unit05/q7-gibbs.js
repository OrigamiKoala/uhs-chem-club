/**
 * Unit 5 · Bench 7 — Free Energy (q7-gibbs)
 *
 * The turbine hall's control room, on the heat kit (`table/kits/heat.js`). Seven stages:
 *   1  PREDICT: a cold-pack salt absorbs heat as it dissolves — will it dissolve on its own at room temperature?
 *   2  INTRODUCE G: what spontaneity, TΔS, and Gibbs free energy (ΔG = ΔH − TΔS) mean
 *   3  TEST: slide the temperature dial to see where TΔS catches up to ΔH for the cold-pack salt
 *   4  SORT: the four ΔH / ΔS sign combinations (visual ΔG vs T curves)
 *   5  CALCULATE: compute ΔG for N₂ + 3 H₂ → 2 NH₃ at 298 K (ensuring consistent kJ units)
 *   6  CROSSING: find the melting point of ice from ΔH and ΔS
 *   7  FORMATION: compute ΔG° from ΔGf° values (because G is a state function, just like H)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  heatTable, note, leadFixture, rxnFixture, gCard, plotFixture, gibbsBarsFixture, plaqueFixture,
  whereIs, plotRead, plotAt, gibbsFreeEnergy, crossingTemperature, fixed, FORMATION_TABLE
} from '../../table/kits/heat.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bspontaneous\b/i, introducedAt: 2 },
  { term: /\bfree energy\b/i, introducedAt: 2 }
];

/** Heat, state functions, and entropy are earned in the benches before this one. */
export const BUILDS_ON = ['unit05/q3-enthalpy', 'unit05/q5-hess', 'unit05/q6-entropy'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const QUEST_KEY = 'unit05/q7-gibbs';
const GUESS_LABEL = { on: '"It dissolves on its own"', off: '"It stays solid"', warm: '"Only if heated"' };

// Stage 3: ammonium nitrate dissolving absorbs 25.7 kJ/mol and gains 108 J/(mol·K) of entropy.
const SALT = { dH: 25.7, dS: 108, Ts: [150, 200, 238, 298, 350] };
const T_SALT = crossingTemperature(25.7, 108);
// Stage 5: ammonia synthesis releases 92 kJ and loses 199 J/(mol·K); ΔG at 298 K is -32.7 kJ.
const HABER = { dH: -92, dS: -199, T: 298 };
const HABER_DG = gibbsFreeEnergy(HABER.dH, HABER.dS, HABER.T);
// Stage 6: melting ice absorbs 6.01 kJ/mol and gains 22.0 J/(mol·K).
const ICE = { dH: 6.01, dS: 22.0, Ts: [250, 260, 270, 280, 300] };
const T_ICE = crossingTemperature(ICE.dH, ICE.dS);
// Stage 7: CH4(g) + 2 O2(g) -> CO2(g) + 2 H2O(l), ΔG°rxn = ΣΔGf°(products) - ΣΔGf°(reactants).
const DGF = id => FORMATION_TABLE[id].dGf;
const GF_DG = DGF('CO2(g)') + 2 * DGF('H2O(l)') - (DGF('CH4(g)') + 2 * DGF('O2(g)'));

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'A Pack That Chills',
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
      'Watch the solid crystal sitting in the water.',
      'Think about whether absorbing heat always stops a process from happening on its own.',
      'Consider both the heat absorbed and how much the particles spread out when dissolving.'
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
      body: 'Your prediction for the cold-pack salt is saved. Next, see how heat and entropy combine to decide whether a process happens on its own.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's1b-intro-gibbs',
    title: 'Gibbs Free Energy and Spontaneity',
    briefing: {
      speaker: SPEAKER,
      body: [
        'A spontaneous process happens on its own without continuous outside input, driven by releasing heat (ΔH < 0) and gaining entropy (ΔS > 0).',
        'Gibbs free energy combines both as ΔG = ΔH − TΔS (where TΔS is the entropy drive in energy units), and a process is spontaneous whenever ΔG < 0.'
      ]
    },
    prompt: 'When ΔG = ΔH − TΔS is calculated for a process, which sign of ΔG means the process is spontaneous?',
    widget,
    table: heatTable({
      pieces: [
        note('neg', 'Negative (ΔG < 0)', { x: 112, y: 14 }),
        note('pos', 'Positive (ΔG > 0)', { x: 112, y: 31 }),
        note('zero', 'Always zero (ΔG = 0)', { x: 112, y: 48 })
      ],
      fixtures: [
        plaqueFixture('gdef', 'Gibbs Free Energy (G)', { x: 38, y: 20 }, [
          'ΔG = ΔH − TΔS',
          'ΔH: heat absorbed (+) or released (−)',
          'TΔS: entropy drive at temperature T',
          'Releasing heat (−ΔH) and gaining entropy (+ΔS)',
          'both push ΔG below zero.'
        ], { w: 68 })
      ],
      zones: { slots: [{ id: 'answer', label: 'Spontaneous when', at: { x: 38, y: 46 }, size: { w: 48, h: 14 } }] }
    }),
    hints: [
      'Read the Gibbs Free Energy plaque on the left.',
      'Releasing heat makes ΔH negative, and gaining entropy makes −TΔS negative.',
      'When both favorable effects pull ΔG downward, ΔG becomes negative (< 0).'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      if (card.id === 'neg') return { ok: true };
      return { ok: false, msg: 'Both releasing heat (ΔH < 0) and gaining entropy (ΔS > 0) make ΔG = ΔH − TΔS negative.' };
    },
    reward: {
      log: 'Processes with ΔG < 0 are spontaneous.',
      title: 'Gibbs Free Energy (G)',
      body: 'ΔG = ΔH − TΔS balances heat (ΔH) against the entropy drive (TΔS). When ΔG < 0, the process is spontaneous; when ΔG > 0, it is not; at ΔG = 0, the two balance.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's2-plot',
    title: 'Heat Against Entropy',
    briefing: {
      speaker: SPEAKER,
      body: [
        'TΔS physically measures how strongly the entropy gain (ΔS) drives the process in energy units at temperature T — the higher the temperature, the more weight entropy carries.',
        'Slide the Temperature dial to watch the HEAT (ΔH) and ENTROPY (TΔS) bars and find where ΔG crosses zero.'
      ]
    },
    prompt: 'At what temperature does the salt switch from staying solid to dissolving on its own?',
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: SALT.dH, dS: SALT.dS, Ts: SALT.Ts, tempStart: 1, hideCrossing: true, hideDG: true, bars: true, words: true, title: 'Cold-pack salt in water', w: 68 }),
        plaqueFixture('key', 'Free energy balance', { x: 118, y: 22 }, [
          'HEAT (ΔH): heat absorbed',
          'ENTROPY (TΔS): T × entropy gained',
          'NET (ΔG = ΔH − TΔS)',
          'Kelvin: K = °C + 273',
          'Below zero: spontaneous'
        ], { w: 58 })
      ]
    }),
    hints: [
      'Slide the Temperature dial and watch the HEAT and ENTROPY bars.',
      'Notice which bar grows as temperature rises, and find where HEAT and ENTROPY are equal.',
      'The salt switches over at the temperature where the ENTROPY (TΔS) bar matches the HEAT (ΔH) bar.'
    ],
    check(state) {
      const t = state.table;
      const r = plotRead(t, 'plot');
      if (Math.round(t.fixtures.plot.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Slide the Temperature dial to change the temperature.' };
      if (Math.abs(r.dG) < 0.05) return { ok: true };
      return { ok: false, msg: `At ${r.T} K, HEAT (ΔH) is ${fixed(r.dH, 1, true)} kJ and ENTROPY (TΔS) is ${fixed(r.TdS, 1, true)} kJ, giving ΔG = ${fixed(r.dG, 1, true)} kJ, so the salt ${r.dG > 0 ? 'stays solid' : 'already dissolves on its own'}.` };
    },
    reward: {
      log: 'ΔG reached zero at 238 K.',
      title: 'When Entropy Wins',
      body: 'Below 238 K, ΔH outweighs TΔS, so ΔG is positive and the salt stays solid. Above 238 K — including room temperature (298 K) — TΔS outweighs ΔH, making ΔG negative so dissolving is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's3-four-signs',
    title: 'The Four Cases',
    briefing: {
      speaker: SPEAKER,
      body: 'Each card plots ΔG against temperature, with the shaded region showing where ΔG < 0 (spontaneous). Sort the four combinations of heat and entropy by when they are spontaneous.'
    },
    prompt: 'At which temperatures is each kind of change spontaneous?',
    widget,
    table: heatTable({
      pieces: [
        gCard('both-help', 'Heat out, entropy increases', { x: 20, y: 14 }, { dH: -40, dS: 100 }),
        gCard('both-oppose', 'Heat in, entropy decreases', { x: 54, y: 14 }, { dH: 40, dS: -100 }),
        gCard('high-t', 'Heat in, entropy increases', { x: 88, y: 14 }, { dH: 40, dS: 100 }),
        gCard('low-t', 'Heat out, entropy decreases', { x: 122, y: 14 }, { dH: -40, dS: -100 })
      ],
      zones: {
        trays: [
          { id: 'always', label: 'At every temperature', labelBelow: true, at: { x: 20, y: 45 }, size: { w: 32, h: 22 }, cell: 31, cellH: 22 },
          { id: 'never', label: 'At no temperature', labelBelow: true, at: { x: 54, y: 45 }, size: { w: 32, h: 22 }, cell: 31, cellH: 22 },
          { id: 'high', label: 'Only when hot', labelBelow: true, at: { x: 88, y: 45 }, size: { w: 32, h: 22 }, cell: 31, cellH: 22 },
          { id: 'low', label: 'Only when cold', labelBelow: true, at: { x: 122, y: 45 }, size: { w: 32, h: 22 }, cell: 31, cellH: 22 }
        ]
      }
    }),
    hints: [
      'Look at the shaded green region under zero on each card: that shows the temperatures where ΔG < 0.',
      'When heat is released (ΔH < 0) and entropy increases (ΔS > 0), ΔG stays below zero at every temperature.',
      'When ΔH and ΔS have the same sign, the line crosses zero: TΔS dominates at high temperatures, while ΔH dominates at low temperatures.'
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
      body: 'If both heat and entropy favor the change (ΔH < 0, ΔS > 0), it is always spontaneous; if both oppose it, it never is. When they compete, high T favors entropy while low T favors heat.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's4-number',
    title: 'Free Energy at 298 K',
    briefing: {
      speaker: SPEAKER,
      body: 'Before subtracting TΔS from ΔH, make sure both terms are in the same units — ΔH is in kJ while ΔS is in J/(mol·K), so express TΔS in kJ. Here is an example; your bench has a different reaction.',
      worked: [
        'A reaction with ΔH = +50 kJ and ΔS = +100 J/K at 400 K.',
        'TΔS = 400 K × 100 J/K = 40,000 J = 40 kJ',
        'ΔG = ΔH − TΔS = 50 kJ − 40 kJ = +10 kJ',
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
          'T = 298 K'
        ], { w: 72 }),
        rxnFixture('atoms', { x: 121, y: 28 }, { lhs: [[1, 'N₂'], [3, 'H₂']], rhs: [[2, 'NH₃']], dH: -92, w: 50, h: 34 })
      ]
    }),
    hints: [
      'Read ΔH, ΔS, and temperature on the reference plate, and make sure TΔS is in kJ to match ΔH.',
      'Because ΔS is negative here, TΔS is also negative.',
      'Subtracting a negative TΔS from ΔH makes ΔG less negative than ΔH.'
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

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's5-ice',
    title: 'Where Ice Starts to Melt',
    prompt: 'Using its ΔH and ΔS, at what temperature in kelvin does ice start to melt?',
    entry: { id: 'T', label: 'Ice starts to melt at', unit: 'K' },
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: ICE.dH, dS: ICE.dS, Ts: ICE.Ts, tempStart: 1, hideCrossing: true, title: 'Melting ice', w: 64 }),
        plaqueFixture('facts', 'Melting ice', { x: 118, y: 18 }, ['ΔH = +6.01 kJ', 'ΔS = +22.0 J/(mol·K)', 'At ΔG = 0: T = ΔH ÷ ΔS'], { w: 54 })
      ]
    }),
    hints: [
      'Slide the Temperature dial to find the two temperatures where ΔG switches from positive to negative.',
      'Ice starts to melt at the exact temperature between them where ΔG equals zero.',
      'At that crossing temperature, ΔH and TΔS are equal once both are in the same units.'
    ],
    check(state) {
      const t = state.table;
      if (Math.round(t.fixtures.plot.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Slide the Temperature dial first to inspect the ΔG plot.' };
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

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's6-formation',
    title: 'Free Energy From Formation',
    briefing: {
      speaker: SPEAKER,
      body: 'Because Gibbs free energy (G) is a state function — just like enthalpy (H) — ΔG° depends only on reactants and products, never the path between them. So ΔG°rxn = Σ ΔGf°(products) − Σ ΔGf°(reactants), with ΔGf° = 0 for elements in their standard states.',
      worked: [
        '2 CO(g) + O₂(g) → 2 CO₂(g) at 298 K',
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
        rxnFixture('atoms', { x: 121, y: 28 }, { lhs: [[1, 'CH₄'], [2, 'O₂']], rhs: [[1, 'CO₂'], [2, 'H₂O']], dH: -890, w: 50, h: 34 })
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
      body: 'ΔG° = (−394.4 + 2 × (−237.1)) − (−50.5 + 0) = −818.1 kJ. Because G is a state function, formation tables give ΔG° directly.'
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
      body: 'A change is spontaneous when its Gibbs free energy change (ΔG = ΔH − TΔS) is negative. Releasing heat and gaining entropy both lower ΔG; when they oppose each other, temperature decides because TΔS grows as temperature rises.'
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
  [put('neg', 'slot:answer')],
  [dial('plot', 'temp', 3)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' })],
  [{ type: { entry: 'dg', value: '-32.7' } }],
  [dial('plot', 'temp', 3), { type: { entry: 'T', value: '273' } }],
  [{ type: { entry: 'dgf', value: '-818.1' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('pos', 'slot:answer')],
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
      if (r.index === 2) {
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
