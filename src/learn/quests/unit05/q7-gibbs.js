/**
 * Unit 5 · Bench 7 — Free Energy (q7-gibbs)
 *
 * The turbine hall's control room, and Ember Reach's last bench TABLETOP (plan `bench-tabletop.md`, phase T6), on the heat kit
 * (`table/kits/heat.js`). A plot of ΔG against temperature with a dial that walks along it, cards that each carry such a line, and the
 * stack of the fifth bench again, now adding free energies. Whether a change runs depends on both the heat and the entropy, and the
 * temperature is the lever that tips the balance.
 *
 *   1  changes that run on their own                 -> spontaneous change
 *   2  ΔH and ΔS combined at one temperature         -> Gibbs free energy
 *   3  the four sign combinations                    -> temperature as a lever
 *   4  the temperature where ΔG is zero              -> equilibrium at ΔG = 0
 *   5  free energies of formation                    -> free energy of reaction
 *   6  a diamond that does not change                -> kinetic control
 *   7  two reactions on the stack                    -> coupled reactions
 *   8  a decomposition dialled until it runs         -> (temperature tips the balance)
 *
 * THE EVIDENCE IS ON THE BENCH. A plot that asks for ΔG hides its own figure (`hideDG`) and its tug-of-war numbers, and one that asks
 * for the crossing temperature hides the crossing mark, so each is found from the line and the dial. The formula is on a plaque, because
 * a formula a stage needs is never withheld.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, eqn, note, markCard, gCard, stackFixture, selectorFixture, plotFixture, plaqueFixture, markerFixture, markerRead, dialAt, whereIs,
  plotRead, plotAt, stackRead, FORMATION_TABLE, gibbsFreeEnergy, standardReactionChange
} from '../../table/kits/heat.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bspontaneous\b/i, introducedAt: 1 },
  { term: /\bGibbs free energy\b/i, introducedAt: 2 },
  { term: /\bkinetic control\b/i, introducedAt: 6 },
  { term: /\bcoupled\b/i, introducedAt: 7 }
];

/** Entropy and enthalpy are earned in the benches before this one. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const FORMULA = 'ΔG = ΔH − T × ΔS';

const CO_DG = standardReactionChange([{ id: 'CO2(g)' }], [{ id: 'CO(g)' }], 'dGf'); // -257.2
const DG_300 = gibbsFreeEnergy(-100, -200, 300);                                    // -40
const COUPLED = 742.2 - 771.6;                                                     // -29.4

const CARD_AT = i => ({ x: 25.5, y: 10 + i * 13 });
const STACK_TRAY = { id: 'stack', label: 'The stack', at: { x: 78, y: 33 }, size: { w: 52, h: 52 }, cell: 50, cellH: 13 };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-favorable',
    title: 'Changes That Run on Their Own',
    prompt: 'Sort the three changes by whether they run on their own or only while energy is supplied.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each card names one change at 298 K and 1 bar, with a note of what is seen when it is left alone. Press Submit when the table shows your answer.'
    },
    widget,
    table: heatTable({
      pieces: [
        note('burn', 'Burning methane: keeps burning once lit', { x: 26, y: 12 }),
        note('cold', 'Cold-pack salt: dissolves by itself and chills the water', { x: 26, y: 31 }),
        note('split', 'Splitting liquid water: stops the moment the current stops', { x: 26, y: 50 })
      ],
      zones: {
        trays: [
          { id: 'fav', label: 'Runs on its own', at: { x: 78, y: 34 }, size: { w: 46, h: 50 }, cell: 44, cellH: 16 },
          { id: 'unfav', label: 'Needs continuous driving', at: { x: 126, y: 34 }, size: { w: 46, h: 50 }, cell: 44, cellH: 16 }
        ]
      }
    }),
    hints: [
      'Read the note on each card.',
      'Compare what each change does when it is left alone.',
      'A change that carries on by itself belongs in the first tray, and one that stops when the supply stops belongs in the second.'
    ],
    check(state) {
      const t = state.table;
      const want = { burn: 'fav', cold: 'fav', split: 'unfav' };
      if (Object.keys(want).some(k => !['fav', 'unfav'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Place all three changes first.' };
      if (Object.entries(want).every(([k, v]) => whereIs(t, k) === v)) return { ok: true };
      return { ok: false, msg: 'Go by the note on each card: what does the change do when it is left alone?' };
    },
    reward: {
      log: 'Two changes ran by themselves, and one did not.',
      title: 'Spontaneous Change',
      body: 'A change that runs on its own, without continuous outside driving, is spontaneous. ΔH alone cannot decide it, because dissolving a cold-pack salt climbs in enthalpy and still runs by itself.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-combine-dh-ds',
    title: 'Balancing Enthalpy Against Entropy',
    prompt: 'Set the marker to ΔG for the reaction on the plaque at 300 K, in kJ/mol.',
    briefing: {
      speaker: SPEAKER,
      body: 'The plaque gives the reaction\'s ΔH in kilojoules and its ΔS in joules, and the plot shows a line that moves with temperature.'
    },
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 38, y: 30 }, { dH: -100, dS: -200, Ts: [200, 300, 400, 500, 600], tempStart: 2, hideDG: true, hideTug: true, hideCrossing: true, title: 'Free energy' }),
        plaqueFixture('ref', 'The reaction', { x: 100, y: 16 }, ['ΔH = −100 kJ/mol', 'ΔS = −200 J/(mol·K)', FORMULA], { w: 52 }),
        markerFixture('dG', 'ΔG at 300 K', { x: 124, y: 44 }, { min: -120, max: 120, step: 20, start: 0, unit: 'kJ/mol', w: 46 })
      ]
    }),
    hints: [
      'Read the ΔH and the ΔS from the plaque, and the temperature from the dial.',
      'Compare the units of ΔH and ΔS before you put them in the same sum.',
      'Turn ΔS into kilojoules, multiply it by the temperature, and take that off ΔH.'
    ],
    check(state) {
      const v = markerRead(state.table, 'dG');
      if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to ΔG.' };
      if (v === DG_300) return { ok: true };
      return { ok: false, msg: 'Check the units of ΔS against those of ΔH, and the sign of the T × ΔS term when ΔS is negative.' };
    },
    reward: {
      log: 'The two terms were balanced at one temperature.',
      title: 'Gibbs Free Energy',
      body: 'The Gibbs free energy, ΔG = ΔH − TΔS, balances the heat a change gives out against the entropy it gains at a given temperature. A negative ΔG means the change is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-four-signs',
    title: 'The Four Tug-of-War Cases',
    prompt: 'Sort the four sign combinations by the temperatures at which ΔG is negative.',
    briefing: {
      speaker: SPEAKER,
      body: 'On each card the line is ΔG against temperature, and the shaded strip is where ΔG is below zero.'
    },
    widget,
    table: heatTable({
      pieces: [
        gCard('both-help', 'ΔH < 0, ΔS > 0', { x: 20, y: 14 }, { dH: -40, dS: 100 }),
        gCard('both-oppose', 'ΔH > 0, ΔS < 0', { x: 54, y: 14 }, { dH: 40, dS: -100 }),
        gCard('high-t', 'ΔH > 0, ΔS > 0', { x: 88, y: 14 }, { dH: 40, dS: 100 }),
        gCard('low-t', 'ΔH < 0, ΔS < 0', { x: 122, y: 14 }, { dH: -40, dS: -100 })
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
      'Follow each card\'s line from the cold end to the hot end.',
      'Compare where each line sits against the shaded strip at the two ends.',
      'If the line stays on one side the verdict never changes, and if it crosses the verdict flips at one temperature.'
    ],
    check(state) {
      const t = state.table;
      const want = { 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' };
      if (Object.keys(want).some(k => !['always', 'never', 'high', 'low'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Place all four cases first.' };
      if (Object.entries(want).every(([k, v]) => whereIs(t, k) === v)) return { ok: true };
      return { ok: false, msg: 'Check each card\'s line against the shaded strip at both ends of the temperature range.' };
    },
    reward: {
      log: 'Each case was sorted by its line.',
      title: 'Temperature as a Lever',
      body: 'When ΔH and −TΔS agree in sign, the verdict is the same at every temperature. When they oppose each other, temperature tips ΔG across zero, high T letting entropy win and low T letting enthalpy win.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-crossing-temp',
    title: 'Where Ice Starts to Melt',
    prompt: 'Set the marker to the temperature in kelvin at which ΔG is zero for melting ice.',
    briefing: {
      speaker: SPEAKER,
      body: 'Ice melts when ΔG turns negative, and the dial sets the temperature the plot reads.'
    },
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 38, y: 30 }, { dH: 6.01, dS: 22.0, Ts: [250, 260, 273, 285, 300], hideCrossing: true, title: 'Melting ice' }),
        plaqueFixture('ref', 'What you may use', { x: 100, y: 16 }, [FORMULA, 'H₂O(s) ⇌ H₂O(l)'], { w: 52 }),
        markerFixture('T', 'ΔG is zero at', { x: 124, y: 44 }, { min: 223, max: 323, step: 10, start: 223, unit: 'K', w: 46 })
      ]
    }),
    hints: [
      'Turn the Temperature dial and watch the ΔG printed under the plot.',
      'Compare the readings either side of the point where ΔG changes sign.',
      'At the temperature where ΔG is zero, ΔH equals T times ΔS, so you can also solve for T directly.'
    ],
    check(state) {
      const v = markerRead(state.table, 'T');
      if (v === 223) return { ok: false, notYet: true, msg: 'Set the marker to the temperature.' };
      if (Math.abs(v - 273) <= 2) return { ok: true };
      return { ok: false, msg: 'Check the dial for the setting where ΔG reads zero, or set ΔH equal to T × ΔS with both in the same unit.' };
    },
    reward: {
      log: 'The line crossed zero at the melting point.',
      title: 'Equilibrium at ΔG = 0',
      body: 'At 273 K, ΔG is zero and ice and liquid water coexist in equilibrium. Below it enthalpy wins and ice stays solid, and above it the TΔS term wins and ice melts.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-formation-gibbs',
    title: 'Free Energy from Formation Values',
    prompt: 'Use the free energies of formation on the plaque to find ΔG for CO(g) + ½O₂(g) → CO₂(g), and set it on the dial.',
    briefing: {
      speaker: SPEAKER,
      body: 'Free energy depends only on a substance\'s state, as enthalpy does, so a table of formation values works the same way.'
    },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('dgf', 'ΔG°f, kJ/mol', { x: 46, y: 28 }, [`CO(g)    ${FORMATION_TABLE['CO(g)'].dGf}`.replace('-', '−'), 'O₂(g)    0', `CO₂(g)    ${FORMATION_TABLE['CO2(g)'].dGf}`.replace('-', '−')], { w: 70 }),
        selectorFixture('answer', 'ΔG (kJ/mol)', { x: 120, y: 28 }, { options: ['−257.2', '+257.2', '−531.6', '−394.4'], start: 4, w: 46 })
      ]
    }),
    hints: [
      'Read the free energy of formation of each substance from the plaque.',
      'Compare the total for the products with the total for the reactants.',
      'Add the free energies of the products, then take off the free energies of the reactants.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the value you worked out.' };
      if (v === 2) return { ok: false, msg: 'The sign is backward: check which total is larger, the products\' or the reactants\'.' };
      if (v === 3) return { ok: false, msg: 'The reactants are taken off the products, not added to them.' };
      return { ok: false, msg: 'That is only the products\' total; the reactants\' free energy still has to be taken off.' };
    },
    reward: {
      log: 'The reaction was routed through the elements.',
      title: 'Free Energy of Reaction',
      body: 'A reaction\'s ΔG is the free energies of formation of its products minus those of its reactants. Burning carbon monoxide to carbon dioxide has a ΔG of −257.2 kJ/mol, so it is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-diamond-kinetic',
    title: 'Why Diamonds Last',
    prompt: 'Mark the statement the plot supports: why does a diamond ring not change, when diamond to graphite has a negative ΔG?',
    briefing: {
      speaker: SPEAKER,
      body: 'The plot shows where the change sits, and the plaque says what is seen in practice.'
    },
    widget,
    table: heatTable({
      pieces: [
        markCard('barrier', 'The change is immeasurably slow because it needs a large energy barrier', { x: 108, y: 11 }),
        markCard('unfav', 'A negative ΔG means a change cannot happen', { x: 108, y: 30 }),
        markCard('eq', 'Diamond and graphite are already at equilibrium', { x: 108, y: 49 })
      ],
      fixtures: [
        plotFixture('plot', { x: 38, y: 27 }, { dH: -1.9, dS: 3.3, Ts: [200, 298, 400, 500], tempStart: 2, hideCrossing: true, title: 'Diamond to graphite' }),
        plaqueFixture('seen', 'Seen in practice', { x: 38, y: 56 }, ['No change at 298 K'], { w: 60 })
      ]
    }),
    hints: [
      'Tap a statement to mark it, and tap it again to take the mark off.',
      'Compare what the sign of ΔG says with what is seen in practice.',
      'ΔG says which way a change can run, and something else must say how fast it runs.'
    ],
    check(state) {
      const t = state.table;
      const marked = ['barrier', 'unfav', 'eq'].filter(id => t.pieces[id].props.flipped);
      if (!marked.length) return { ok: false, notYet: true, msg: 'Mark the statement the plot supports.' };
      if (marked.length === 1 && marked[0] === 'barrier') return { ok: true };
      if (marked.includes('unfav')) return { ok: false, msg: 'Read the sign on the plot again: a negative ΔG is the sign of a change that can run.' };
      if (marked.includes('eq')) return { ok: false, msg: 'At equilibrium ΔG would be zero, and the plot shows it is not.' };
      return { ok: false, msg: 'Mark only the one statement the plot supports.' };
    },
    reward: {
      log: 'Favourable did not mean fast.',
      title: 'Kinetic Control',
      body: 'A negative ΔG says a change can run, not how fast. A diamond sits behind a large activation barrier, so its change to graphite is under kinetic control and too slow to see.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-coupled-reactions',
    title: 'Driving an Uphill Reaction',
    prompt: 'Make the stack add up to Fe₂O₃(s) + 3 CO(g) → 2 Fe(s) + 3 CO₂(g), then set its combined ΔG.',
    briefing: {
      speaker: SPEAKER,
      body: 'The first reaction cannot run alone, but the oxygen it frees is exactly what the second uses.'
    },
    widget,
    table: heatTable({
      pieces: [
        eqn('c1', CARD_AT(0), [[1, 'Fe₂O₃(s)']], [[2, 'Fe(s)'], [1.5, 'O₂(g)']], 742.2, { symbol: 'ΔG' }),
        eqn('c2', CARD_AT(1), [[3, 'CO(g)'], [1.5, 'O₂(g)']], [[3, 'CO₂(g)']], -771.6, { symbol: 'ΔG' })
      ],
      fixtures: [
        stackFixture('wanted', { x: 128, y: 19 }, { tray: 'stack', target: { lhs: [[1, 'Fe₂O₃(s)'], [3, 'CO(g)']], rhs: [[2, 'Fe(s)'], [3, 'CO₂(g)']] }, hideSum: true, w: 44, h: 30, symbol: 'ΔG' }),
        selectorFixture('answer', 'Combined ΔG (kJ)', { x: 128, y: 48 }, { options: ['−29.4', '+29.4', '+1513.8', '+742.2'], start: 4, w: 44 })
      ],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Drag both reactions into the stack and read the equation the stack adds up to.',
      'Compare what the first reaction frees with what the second one uses.',
      'The substance that appears in both cancels, so the free energy changes simply add.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 4) return { ok: false, notYet: true, msg: 'Stack the reactions, add their ΔG values, and set the total.' };
      if (v === 2) return { ok: false, msg: 'The sign is backward: compare how far each reaction climbs or falls and which is larger.' };
      if (v === 3) return { ok: false, msg: 'One of the two reactions falls, and a fall is taken off a climb, not added to it.' };
      return { ok: false, msg: 'That is only the first reaction; the second one is needed to make it run.' };
    },
    reward: {
      log: 'The steeper fall outweighed the climb.',
      title: 'Coupled Reactions',
      body: 'An uphill reaction can be driven by a coupled reaction that falls further, if the two share an intermediate. Smelting iron and building proteins in cells both rely on this.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-pick-temp',
    title: 'Dialling Temperature to Tip the Balance',
    prompt: 'Turn the dial to the temperature at which this decomposition first has a negative ΔG.',
    briefing: {
      speaker: SPEAKER,
      body: 'The reaction takes in heat and gains entropy, and the plot reads ΔG at the temperature the dial is set to.'
    },
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 50, y: 30 }, { dH: 90, dS: 150, Ts: [300, 450, 600, 750], hideCrossing: true, title: 'High-temperature decomposition' }),
        plaqueFixture('ref', 'The reaction', { x: 114, y: 26 }, ['AB(s) → A(s) + B(g)', 'ΔH = +90 kJ/mol', 'ΔS = +150 J/(mol·K)'], { w: 56 })
      ]
    }),
    hints: [
      'Turn the Temperature dial through its settings and read the ΔG at each.',
      'Compare the sign of the ΔG reading at each setting.',
      'Keep the setting where the reading falls below zero, not merely to it.'
    ],
    check(state) {
      const r = plotRead(state.table, 'plot');
      if (r.T === 300) return { ok: false, notYet: true, msg: 'The dial is where it started: turn it and read ΔG at each setting.' };
      if (r.dG < 0) return { ok: true };
      if (Math.abs(r.dG) < 1e-9) return { ok: false, msg: 'At that setting ΔG reads zero, which is the balance point and not below it.' };
      return { ok: false, msg: 'At that setting the plot reads ΔG above zero, so the decomposition does not run there.' };
    },
    reward: {
      log: 'Only the hottest setting tipped the balance.',
      title: 'Temperature Tips the Balance',
      body: 'For a reaction with positive ΔH and positive ΔS, ΔG falls as temperature rises and turns negative above ΔH divided by ΔS. At 750 K the TΔS term outweighs the 90 kJ it costs.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag each change into a tray.'],
  2: ['Turn the Temperature dial; set the marker.'],
  3: ['Drag each card into a tray.'],
  4: ['Turn the Temperature dial; set the marker.'],
  5: ['Turn the dial to the value you worked out.'],
  6: ['Tap a statement to mark it.'],
  7: ['Drag cards into the stack.'],
  8: ['Turn the Temperature dial.']
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
      body: 'ΔG = ΔH − TΔS sets one verdict from two pulls. A negative ΔG says a change can run on its own, temperature can tip it when the pulls oppose, and a barrier can still make it too slow to see.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'This one balance explains why ice melts, why iron can be smelted and why your own cells can build what they need. Nothing in it is a rule to memorise.'
    },
    {
      heading: 'Next',
      body: 'The caldera rim holds the Fifth Guild’s siphon core, and every tool from this world will be needed to crack it.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A reaction has ΔH = −50 kJ/mol and ΔS = −100 J/(mol·K). What is ΔG at 300 K?',
    options: [
      { id: 'a', label: '−20 kJ/mol' },
      { id: 'b', label: '+20 kJ/mol' },
      { id: 'c', label: '−80 kJ/mol' },
      { id: 'd', label: '+30 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'TΔS is 300 K × (−0.100 kJ/(mol·K)) = −30 kJ, so ΔG = −50 − (−30) = −20 kJ/mol.'
  },
  {
    question: 'A change has ΔH > 0 and ΔS > 0. When is it spontaneous?',
    options: [
      { id: 'a', label: 'Only at high temperature' },
      { id: 'b', label: 'Only at low temperature' },
      { id: 'c', label: 'At every temperature' },
      { id: 'd', label: 'At no temperature' }
    ],
    answer: 'a',
    explanation: 'Entropy gain only outweighs the heat cost once T is large enough, so ΔG turns negative at high temperature.'
  },
  {
    question: 'Melting has ΔH = +6.01 kJ/mol and ΔS = +22.0 J/(mol·K). At what temperature is ΔG zero?',
    options: [
      { id: 'a', label: '273 K' },
      { id: 'b', label: '132 K' },
      { id: 'c', label: '2.73 K' },
      { id: 'd', label: '546 K' }
    ],
    answer: 'a',
    explanation: 'Set ΔH = TΔS and solve: T = 6010 J/mol divided by 22.0 J/(mol·K), which is 273 K.'
  },
  {
    question: 'An uphill reaction has ΔG = +60 kJ and is coupled to a reaction with ΔG = −90 kJ. What is the combined ΔG?',
    options: [
      { id: 'a', label: '−30 kJ' },
      { id: 'b', label: '+30 kJ' },
      { id: 'c', label: '+150 kJ' },
      { id: 'd', label: '−150 kJ' }
    ],
    answer: 'a',
    explanation: 'The two free energy changes add, giving +60 + (−90) = −30 kJ, so the coupled pair runs.'
  },
  {
    question: 'Why does graphite not appear from a diamond at room temperature when ΔG is negative?',
    options: [
      { id: 'a', label: 'The change is far too slow because of a large activation energy' },
      { id: 'b', label: 'A negative ΔG means the change is forbidden' },
      { id: 'c', label: 'Diamond has a lower free energy than graphite' }
    ],
    answer: 'a',
    explanation: 'ΔG tells you whether a change can run, not how fast, and a large barrier can make a favourable change immeasurably slow.'
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
  [...sort({ burn: 'fav', cold: 'fav', split: 'unfav' })],
  [dial('plot', 'temp', 2), dial('dG', 'value', -40)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' })],
  [dial('plot', 'temp', 3), dial('T', 'value', 273)],
  [dial('answer', 'value', 1)],
  [{ flip: 'barrier' }],
  [...stack('c1', 'c2'), dial('answer', 'value', 1)],
  [dial('plot', 'temp', 4)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...sort({ burn: 'fav', cold: 'unfav', split: 'unfav' })],
  [dial('dG', 'value', 40)],
  [...sort({ 'both-help': 'never', 'both-oppose': 'always', 'high-t': 'high', 'low-t': 'low' })],
  [dial('T', 'value', 303)],
  [dial('answer', 'value', 2)],
  [{ flip: 'unfav' }],
  [...stack('c1', 'c2'), dial('answer', 'value', 2)],
  [dial('plot', 'temp', 3)]
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
export { plotRead, plotAt, stackRead, CO_DG, DG_300, COUPLED };
