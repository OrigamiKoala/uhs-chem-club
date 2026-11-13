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
import { applyNotes } from '../../table/notes.js';
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
    prompt: 'The salt in a cold pack takes heat in as it dissolves: will it dissolve by itself at room temperature?',
    widget,
    table: heatTable({
      pieces: [
        note('on', 'It dissolves by itself', { x: 24, y: 16 }),
        note('off', 'It stays solid', { x: 70, y: 16 }),
        note('warm', 'Only if it is warmed', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'salt', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Watch the clip: a crystal of the salt sitting in water.',
      'Dissolving this salt takes heat in, but it also lets the particles of the salt move all through the water.',
      'Think about what happens to the entropy of the salt when it dissolves, and whether taking heat in has to stop a change.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the cold-pack salt is recorded. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-plot',
    title: 'Heat Against Entropy',
    briefing: { speaker: SPEAKER, body: 'A change that happens by itself is called spontaneous. It is spontaneous when the free energy change, ΔG = ΔH − TΔS, is negative: ΔH is the heat taken in, and TΔS is the temperature in kelvin times the entropy gained.' },
    prompt: 'At what temperature does the salt change from staying solid to dissolving by itself?',
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: SALT.dH, dS: SALT.dS, Ts: SALT.Ts, tempStart: 1, hideCrossing: true, hideDG: true, bars: true, title: 'Cold-pack salt in water', w: 68 }),
        plaqueFixture('key', 'Free energy change', { x: 118, y: 22 }, ['ΔG = ΔH − TΔS', 'ΔH: heat taken in', 'TΔS: kelvin temperature × entropy gained', 'Kelvin: K = °C + 273', 'ΔG negative: spontaneous'], { w: 58 })
      ]
    }),
    hints: [
      'Drag the ball along the line and watch the ΔH and TΔS bars beside the plot.',
      'Notice which bar grows as the temperature rises, and which stays the same.',
      'The salt changes over at the temperature where the TΔS bar matches the ΔH bar.'
    ],
    check(state) {
      const t = state.table;
      const r = plotRead(t, 'plot');
      if (Math.round(t.fixtures.plot.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Drag the ball along the line to change the temperature.' };
      if (Math.abs(r.dG) < 0.05) return { ok: true };
      return { ok: false, msg: `At ${r.T} K, ΔH is ${fixed(r.dH, 1, true)} kJ and TΔS is ${fixed(r.TdS, 1, true)} kJ, so ΔG is ${fixed(r.dG, 1, true)} kJ and the salt ${r.dG > 0 ? 'stays solid' : 'is already dissolving by itself'}.` };
    },
    reward: {
      log: 'ΔG reached zero at 238 K.',
      title: 'Free Energy',
      body: 'Below 238 K, ΔH is larger than TΔS, so ΔG is positive and the salt stays solid. Above 238 K, TΔS is larger and ΔG is negative: dissolving is spontaneous, although it takes heat in.'
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
        gCard('both-help', 'Heat out, entropy up', { x: 20, y: 14 }, { dH: -40, dS: 100 }),
        gCard('both-oppose', 'Heat in, entropy down', { x: 54, y: 14 }, { dH: 40, dS: -100 }),
        gCard('high-t', 'Heat in, entropy up', { x: 88, y: 14 }, { dH: 40, dS: 100 }),
        gCard('low-t', 'Heat out, entropy down', { x: 122, y: 14 }, { dH: -40, dS: -100 })
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
      'Look at the line on each card: it is ΔG against temperature, cold at the left and hot at the right.',
      'Compare where each line lies in the shaded strip, which is where ΔG is negative and the change is spontaneous.',
      'In ΔG = ΔH − TΔS the TΔS part grows with temperature, so think about which way the ΔS of each card tilts its line.'
    ],
    check(state) {
      const t = state.table;
      const want = { 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' };
      if (Object.keys(want).some(k => !['always', 'never', 'high', 'low'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every card needs a tray.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const { dH, dS } = t.pieces[wrong[0]].props;
      return { ok: false, msg: `"${t.pieces[wrong[0]].label}" is in "${t.zones.trays[whereIs(t, wrong[0])].label}", yet its ΔG line reads ${fixed(gibbsFreeEnergy(dH, dS, 100), 0, true)} kJ at 100 K and ${fixed(gibbsFreeEnergy(dH, dS, 600), 0, true)} kJ at 600 K.` };
    },
    reward: {
      log: 'Each case was sorted by its line.',
      title: 'When Temperature Decides',
      body: 'A change that gives out heat and gains entropy is spontaneous at every temperature, and one that does the opposite never is. For the other two kinds the temperature decides, because TΔS grows as it gets hotter.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-number',
    title: 'Free Energy at 298 K',
    briefing: {
      speaker: SPEAKER,
      body: 'To work out ΔG, the two parts must be in the same unit: ΔH is given in kJ and ΔS in J/K, so TΔS is divided by 1,000. Here is one change worked through; the reaction on your bench is a different one.',
      worked: [
        'A change with ΔH = +50 kJ and ΔS = +100 J/K, at 400 K.',
        'TΔS = 400 × 100 = 40,000 J = 40 kJ',
        'ΔG = ΔH − TΔS',
        'ΔG = 50 − 40 = +10 kJ',
        'ΔG is positive, so the change is not spontaneous at 400 K.'
      ]
    },
    prompt: 'What is the free energy change, ΔG, of this reaction at 298 K?',
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
        ], { w: 86, bars: { dH: HABER.dH, dS: HABER.dS, T: HABER.T } }),
        rxnFixture('atoms', { x: 121, y: 28 }, { lhs: [[1, 'N₂'], [3, 'H₂']], rhs: [[2, 'NH₃']], w: 50, h: 34 })
      ]
    }),
    hints: [
      'Read ΔH, ΔS and the temperature on the plate, and the unit of each.',
      'On this plate ΔS is negative, so TΔS is negative as well.',
      'The worked case shows the order of the steps, and taking away a negative TΔS raises ΔG.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'dg');
      if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Type the figure you worked out, in kJ.' };
      if (Math.abs(v - HABER_DG) <= 0.6) return { ok: true };
      if (Math.abs(v - (HABER.dH + (HABER.T * HABER.dS) / 1000)) <= 2) return { ok: false, msg: 'That figure is lower than ΔH, but the plate gives a negative ΔS, and a loss of entropy cannot make ΔG lower.' };
      if (Math.abs(v - HABER.dH) <= 2) return { ok: false, msg: 'That is ΔH alone, and the plate also gives a ΔS and a temperature.' };
      if (Math.abs(v) > 5000) return { ok: false, msg: `That figure is about ${Math.round(Math.abs(v / HABER.dH))} times the ΔH on the plate: kJ and J are not the same size.` };
      return { ok: false, msg: `${fixed(v, 1)} kJ needs TΔS to be ${fixed(HABER.dH - v, 1)} kJ, and 298 K times the plate's ΔS gives a different figure.` };
    },
    reward: {
      log: 'ΔG at 298 K came to −32.7 kJ.',
      title: 'ΔG From ΔH and ΔS',
      body: 'TΔS = 298 × (−199) J = −59.3 kJ, so ΔG = −92 − (−59.3) = −32.7 kJ. ΔG is negative, so the reaction is spontaneous at 298 K.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-ice',
    title: 'Where Ice Starts to Melt',
    prompt: 'From its ΔH and ΔS, at what temperature in kelvin does ice start to melt?',
    entry: { id: 'T', label: 'Ice starts to melt at', unit: 'K' },
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: ICE.dH, dS: ICE.dS, Ts: ICE.Ts, tempStart: 1, hideCrossing: true, title: 'Melting ice', w: 64 }),
        plaqueFixture('facts', 'Melting ice', { x: 118, y: 16 }, ['ΔH = +6.01 kJ', 'ΔS = +22.0 J/(mol·K)', 'ΔG = ΔH − TΔS', '1 kJ = 1,000 J'], { w: 52 })
      ]
    }),
    hints: [
      'Drag the ball along the line and find the two settings between which ΔG changes from positive to negative.',
      'Ice starts to melt at the temperature between those two settings where ΔG is neither positive nor negative.',
      'At that temperature ΔH and TΔS are equal, once both are in the same unit.'
    ],
    check(state) {
      const t = state.table;
      const v = entryNumber(t, 'T');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the temperature in kelvin.' };
      if (Math.abs(v - T_ICE) <= 2) return { ok: true };
      return { ok: false, msg: `At ${v} K, TΔS is ${fixed((v * ICE.dS) / 1000, 2, true)} kJ and ΔH is +6.01 kJ, so ΔG is ${fixed(gibbsFreeEnergy(ICE.dH, ICE.dS, v), 2, true)} kJ.` };
    },
    reward: {
      log: 'The line crossed zero at the melting point.',
      title: 'The Melting Point',
      body: 'ΔG is zero where ΔH = TΔS, so T = 6,010 ÷ 22.0 = 273 K, which is 0 °C. Below 273 K ice stays solid, and above it melting is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-formation',
    title: 'Free Energy From Formation',
    briefing: {
      speaker: SPEAKER,
      body: 'Just like enthalpy of formation, the standard free energy of reaction is the sum of ΔGf° of products minus reactants. An element in its standard state has ΔGf° = 0.',
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
      'Read the standard free energy of formation, ΔGf°, for each substance on the plate.',
      'Multiply each ΔGf° by its coefficient in the equation, and note that O₂(g) is an element in its standard state.',
      'Subtract the reactant total from the product total, keeping track of the negative signs.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'dgf');
      if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Type ΔG° at 298 K, in kJ.' };
      if (Math.abs(v - GF_DG) <= 1.0) return { ok: true };
      if (Math.abs(v + GF_DG) <= 1.0) return { ok: false, msg: 'The sign is reversed: reactants were subtracted in the opposite order from products.' };
      if (Math.abs(v - (DGF('CO2(g)') + DGF('H2O(l)') - DGF('CH4(g)'))) <= 1.0) return { ok: false, msg: 'That figure uses one mole of H₂O(l), but the equation makes two moles.' };
      return { ok: false, msg: `${fixed(v, 1)} kJ does not match ΣΔGf°(products) − ΣΔGf°(reactants) for this equation.` };
    },
    reward: {
      log: 'ΔG° came to −818.1 kJ.',
      title: 'ΔG° From Formation Values',
      body: 'ΔG° = (−394.4 + 2 × (−237.1)) − (−50.5 + 0) = −818.1 kJ. Elements in their standard state, like O₂(g), have ΔGf° = 0.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Drag the ball along the line to change the temperature.'],
  3: ['Drag each card into a tray.'],
  4: ['Type your answer in the field at the bottom.'],
  5: ['Drag the ball along the line, then type your answer in kelvin.'],
  6: ['Type your answer in the field at the bottom.']
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
      body: 'A change is spontaneous when its free energy change, ΔG = ΔH − TΔS, is negative. Giving out heat and gaining entropy both push ΔG down; when the two disagree, the temperature decides, because TΔS grows as it gets hotter.'
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
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { SALT, T_SALT, ICE, T_ICE, HABER, HABER_DG, GF_DG };
export { plotRead, plotAt };
