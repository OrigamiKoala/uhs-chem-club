/**
 * Unit 5 · Bench 6 — Entropy (q6-entropy)
 *
 * The silencer bay, on the heat kit (`table/kits/heat.js`). Nine stages building entropy from first principles:
 *   1  PREDICT: when the barrier is removed, where will the four particles end up?
 *   2  TEST: shake the two-box chamber and read the cumulative distribution -> 16 microstates, statistically spread out
 *   3  LAW OF LARGE NUMBERS: why real-world distributions concentrate sharply around the center
 *   4  SORT: four changes sorted by whether entropy increases or decreases -> entropy (S), ΔS
 *   5  ENERGY LEVELS: why warming a sample increases entropy (more accessible energy levels)
 *   6  RANK: four live 3D particle boxes ranked from lowest to highest entropy
 *   7  THIRD LAW: absolute zero (0 K) and Nernst's heat theorem -> a perfect crystal at 0 K has S = 0
 *   8  ENTROPY PATH: cooling reactants to 0 K, reacting at 0 K, warming products -> why ΔS° = ΣS°(products) − ΣS°(reactants)
 *   9  CALCULATE: compute ΔS° for CaCO₃(s) → CaO(s) + CO₂(g) from standard entropy tables
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  heatTable, phaseCard, shiftCard, tag, note, leadFixture, rxnFixture, chamberFixture, warmFixture,
  shakesOf, whereIs, waysOf, plaqueFixture, FORMATION_TABLE, fixed
} from '../../table/kits/heat.js';

export const meta = { stageCount: 9 };

export const VOCABULARY = [
  { term: /\bentropy\b/i, introducedAt: 4 },
  { term: /ΔS/, introducedAt: 4 },
  { term: /\bthird law\b/i, introducedAt: 7 }
];

/** A shaken chamber builds on Bellows' gas; state functions were introduced in Hess's Law. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit05/q5-hess'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const QUEST_KEY = 'unit05/q6-entropy';
const GUESS_LABEL = { left: '"All in the left box"', spread: '"Spread across both boxes"', right: '"All in the right box"' };

/** 4 particles distributed across 2 boxes: 2^4 = 16 microstates, only 1 with all four in the left box. */
const TOTAL_WAYS = 16;
const CROWDED_WAYS = 1;

/** How many of the shakes so far left `n` particles in the left box (box 1). */
const tally = (t, n) => shakesOf(t, 'chamber').filter(s => s.filter(c => c === 1).length === n).length;

const S0 = id => FORMATION_TABLE[id].S0;
// Stage 9: CaCO3(s) -> CaO(s) + CO2(g), products minus reactants.
const DS_LIME = S0('CaO(s)') + S0('CO2(g)') - S0('CaCO3(s)');

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Where Will They End Up?',
    predict: true,
    prompt: 'When the barrier is removed, where will the four particles end up?',
    widget,
    table: heatTable({
      pieces: [
        note('left', 'All in the left box', { x: 24, y: 16 }),
        note('spread', 'Spread across both boxes', { x: 70, y: 16 }),
        note('right', 'All in the right box', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'shut', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Watch the four particles bouncing inside the left side behind the glass barrier.',
      'Once the glass barrier is removed, nothing pulls any particle toward either side.',
      'Compare how many ways all four particles can land in one box versus how many ways they can split between both boxes.'
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
      body: 'Your prediction for the four particles is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-shake',
    title: 'Shake and Count',
    briefing: {
      speaker: SPEAKER,
      body: [
        'Each time you press Shake, every particle randomly lands in either the left box or the right box.',
        'The bar chart below tracks the overall distribution across ALL your shakes — each shake adds 1 to the column for how many particles landed in the left box (0, 1, 2, 3, or 4).'
      ]
    },
    prompt: 'After many shakes, where are the four particles found most often?',
    widget,
    table: heatTable({
      pieces: [
        tag('left', 'All in the left box', { x: 84, y: 57.4 }),
        tag('spread', 'Spread across both boxes', { x: 110, y: 57.4 }),
        tag('right', 'All in the right box', { x: 136, y: 57.4 })
      ],
      fixtures: [chamberFixture('chamber', { x: 45, y: 27 }, { cells: 2, particles: 4, title: 'Two boxes (left and right)' })],
      zones: { slots: [{ id: 'answer', label: 'Most often', at: { x: 118, y: 28 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Press "Shake" at least 10 times and watch the overall bar chart build up across all shakes.',
      'Compare column 4 (all four in the left box) and column 0 (all four in the right box) with the middle columns 1, 2, and 3.',
      'Each middle outcome can happen in more ways than putting all four in one box, so it happens much more often.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      const k = shakesOf(t, 'chamber').length;
      if (k < 10) return { ok: false, notYet: true, msg: `You have only shaken ${k} times so far; shake at least 10 times.` };
      if (card.id === 'spread') return { ok: true };
      return card.id === 'left'
        ? { ok: false, msg: `All four landed in the left box on only ${tally(t, 4)} of ${k} shakes.` }
        : { ok: false, msg: `All four landed in the right box on only ${tally(t, 0)} of ${k} shakes.` };
    },
    reward: {
      log: 'The particles almost always ended up spread across both boxes.',
      title: 'Statistically Spread Out',
      body: 'There are 16 ways to distribute 4 particles across the two boxes, and only 1 way for all four to land in the left box. Statistically, it is much more likely for the particles to be spread out.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's2b-large-numbers',
    title: 'Scaling Up to the Real World',
    briefing: {
      speaker: SPEAKER,
      body: [
        'With 4 particles, all 4 still land on the left 1 time out of 16, but adding more particles squeezes the bar chart tightly around the middle.',
        'With 20 particles the odds of all-left drop to 1 in a million, and with trillions of real-world molecules it is effectively zero.'
      ]
    },
    prompt: 'As the number of particles grows to real-world scales, what happens to the distribution?',
    widget,
    table: heatTable({
      pieces: [
        note('center', 'Concentrates sharply at an even split', { x: 112, y: 14 }),
        note('flat', 'Stays wide so all-left happens often', { x: 112, y: 31 }),
        note('corner', 'Shifts so all particles gather in one box', { x: 112, y: 48 })
      ],
      fixtures: [
        plaqueFixture('scale', 'Chance all particles land on the left', { x: 38, y: 20 }, [
          '4 particles:   1 in 16',
          '10 particles:  1 in 1,024',
          '20 particles:  1 in 1,048,576',
          '1 mole of gas: 1 in 2^(6×10²³)',
          '(never happens in the age of the universe)'
        ], { w: 68 })
      ],
      zones: { slots: [{ id: 'answer', label: 'At real-world scales', at: { x: 38, y: 46 }, size: { w: 48, h: 14 } }] }
    }),
    hints: [
      'Read the table on the left showing how fast the odds of all-left shrink as you add particles.',
      'Compare 4 particles (1 in 16) with 20 particles (1 in a million) and a real sample of gas.',
      'The law of large numbers means real-world samples stay overwhelmingly near an even, spread-out split.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      if (card.id === 'center') return { ok: true };
      return { ok: false, msg: 'Look at how tiny the odds of an uneven split become as the particle count grows from 4 to 20 to a real-world sample.' };
    },
    reward: {
      log: 'At real-world scales, particles stay spread out.',
      title: 'Why Entropy Does Not Reverse',
      body: 'As the number of particles grows, the distribution concentrates into a razor-sharp peak at the center. At real-world scales, the odds of a gas un-spreading are effectively zero.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's3-room',
    title: 'More Ways or Fewer?',
    briefing: { speaker: SPEAKER, body: 'Entropy (S) tracks how many ways particles can be arranged: more ways means higher entropy, and statistically a system moves toward states with more ways. An entropy change is written ΔS, which is positive when entropy increases.' },
    prompt: 'Which changes increase entropy, and which decrease it?',
    widget,
    table: heatTable({
      pieces: [
        shiftCard('melt', 'Ice melting', { x: 22, y: 13 }, { before: [['solid', 4]], after: [['liquid', 4]] }),
        shiftCard('lime', 'CaCO₃ → CaO + CO₂', { x: 58, y: 13 }, { before: [['solid', 2]], after: [['solid', 2], ['gas', 2]] }),
        shiftCard('haber', 'N₂ + 3 H₂ → 2 NH₃', { x: 94, y: 13 }, { before: [['gas', 4]], after: [['gas', 2]] }),
        shiftCard('dew', 'Steam condensing', { x: 130, y: 13 }, { before: [['gas', 4]], after: [['liquid', 4]] })
      ],
      zones: {
        trays: [
          { id: 'more', label: 'Entropy increases', labelBelow: true, at: { x: 37, y: 44 }, size: { w: 72, h: 22 }, cell: 35, cellH: 21 },
          { id: 'fewer', label: 'Entropy decreases', labelBelow: true, at: { x: 113, y: 44 }, size: { w: 72, h: 22 }, cell: 35, cellH: 21 }
        ]
      }
    }),
    hints: [
      'Compare the before and after particle pictures on each card.',
      'Check whether the particles move more freely after the change, and whether more or fewer gas particles are present.',
      'Gas particles have far more possible arrangements than the same particles packed into a liquid or solid.'
    ],
    check(state) {
      const t = state.table;
      const want = { melt: 'more', lime: 'more', haber: 'fewer', dew: 'fewer' };
      if (Object.keys(want).some(k => !['more', 'fewer'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Sort all four changes into the trays.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const card = t.pieces[wrong[0]];
      const gasOf = g => g.filter(([ph]) => ph === 'gas').reduce((s, [, n]) => s + n, 0);
      const gb = gasOf(card.props.before || []);
      const ga = gasOf(card.props.after || []);
      const detail = gb !== ga
        ? `it goes from ${gb} spread-out particle${gb === 1 ? '' : 's'} to ${ga}`
        : `it changes from ${card.props.before?.[0]?.[0]} to ${card.props.after?.[0]?.[0]}`;
      return { ok: false, msg: `"${card.label}" is in "${t.zones.trays[whereIs(t, wrong[0])].label}", even though ${detail}.` };
    },
    reward: {
      log: 'Freeing particles into liquid or gas increased entropy.',
      title: 'Entropy and the Sign of ΔS',
      body: 'Melting and producing gas give particles more possible arrangements, so entropy increases (ΔS > 0). Condensing and consuming gas leave fewer arrangements, so entropy decreases (ΔS < 0).'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's3b-energy-levels',
    title: 'Warming and Energy Levels',
    briefing: {
      speaker: SPEAKER,
      body: [
        'Particles do not just spread out in space — they also share energy across discrete energy levels, like rungs on a ladder.',
        'When a sample is cold, only the lowest energy rungs are accessible. Warming the sample gives particles enough energy to reach many higher rungs, creating far more ways to distribute energy among them.'
      ]
    },
    prompt: 'Warm the sample with the Heater dial: why does higher temperature increase entropy even without a phase change?',
    widget,
    table: heatTable({
      pieces: [
        note('levels', 'More energy levels become accessible', { x: 112, y: 14 }),
        note('fewer', 'Particles are forced into one energy level', { x: 112, y: 31 }),
        note('same', 'Temperature does not affect entropy', { x: 112, y: 48 })
      ],
      fixtures: [
        warmFixture('warmer', { x: 38, y: 20 }, { Ts: [10, 30, 50, 70, 90], title: 'Warming liquid water', w: 62, record: false })
      ],
      zones: { slots: [{ id: 'answer', label: 'Why warming increases S', at: { x: 38, y: 46 }, size: { w: 48, h: 14 } }] }
    }),
    hints: [
      'Turn the Heater dial up and watch both the particle speed and the entropy gained readout.',
      'Notice that the water stays liquid the entire time, yet its entropy still increases.',
      'Higher temperature opens up more accessible energy levels, so there are more ways to distribute energy among the particles.'
    ],
    check(state) {
      const t = state.table;
      const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      if (Math.round(t.fixtures.warmer.dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Heater dial up first to watch the entropy change.' };
      if (card.id === 'levels') return { ok: true };
      return { ok: false, msg: 'Watch the ENTROPY GAINED readout rise as you warm the water: higher energy opens up more ways to distribute energy.' };
    },
    reward: {
      log: 'Warming a sample opens more energy levels and increases entropy.',
      title: 'Accessible Energy Levels',
      body: 'Higher temperature makes more energy levels accessible to the particles. With more ways to distribute their energy, a warmer sample always has higher entropy than a colder one of the same phase.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's4-rank',
    title: 'Phase and Temperature',
    prompt: 'Rank the four boxes from lowest entropy to highest entropy.',
    widget,
    table: heatTable({
      pieces: [
        phaseCard('ice', 'Ice', { x: 0, y: 0 }, 'solid', {}, -10),
        phaseCard('cold', 'Cold water', { x: 0, y: 0 }, 'liquid', {}, 10),
        phaseCard('hot', 'Hot water', { x: 0, y: 0 }, 'liquid', {}, 80),
        phaseCard('steam', 'Steam', { x: 0, y: 0 }, 'gas', {}, 110)
      ],
      zones: { rail: { at: { x: 75, y: 36 }, size: { w: 134, h: 26 }, first: 'Lowest entropy', last: 'Highest entropy', items: ['ice', 'cold', 'hot', 'steam'], start: ['hot', 'steam', 'ice', 'cold'] } }
    }),
    hints: [
      'Watch how tightly the particles are packed and how fast they move in each box.',
      'Compare the two liquid water boxes, which differ only in temperature.',
      'Entropy increases from solid to liquid to gas, and increases when a substance is warmed.'
    ],
    check(state) {
      const order = state.table.zones.rail.order;
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Place all four boxes on the rail.' };
      const want = ['ice', 'cold', 'hot', 'steam'];
      if (order.join() === want.join()) return { ok: true };
      const t = state.table;
      const j = order.findIndex((id, i) => i > 0 && want.indexOf(order[i - 1]) > want.indexOf(id));
      const left = t.pieces[order[j - 1]];
      const right = t.pieces[order[j]];
      return { ok: false, msg: `"${left.label}" (${left.props.phase}, ${left.props.T} °C) is left of "${right.label}" (${right.props.phase}, ${right.props.T} °C); compare their phase and temperature.` };
    },
    reward: {
      log: 'Both phase and temperature increased entropy.',
      title: 'Solid, Liquid, Gas, and Warming',
      body: 'Ice has the lowest entropy, followed by cold water, hot water, and steam. Both spreading into a freer phase and warming to a higher temperature increase entropy.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's5-third-law',
    title: 'Absolute Zero and the Third Law',
    briefing: {
      speaker: SPEAKER,
      body: [
        'If warming a substance increases its entropy, what happens if we cool a perfect crystal all the way down to absolute zero (0 K, or −273 °C)?',
        'By the Third Law of Thermodynamics, at 0 K every particle sits locked in its single lowest-energy position — only 1 arrangement is possible, so its entropy is exactly zero (S = 0).'
      ]
    },
    prompt: 'According to the Third Law of Thermodynamics, what is the entropy of a perfect crystal at 0 K?',
    widget,
    table: heatTable({
      pieces: [
        note('zero', 'Exactly 0 J/(mol·K)', { x: 28, y: 18 }),
        note('neg', 'A negative number', { x: 75, y: 18 }),
        note('same', 'Different for every element', { x: 122, y: 18 })
      ],
      zones: { slots: [{ id: 'answer', label: 'Entropy at 0 K', at: { x: 75, y: 45 }, size: { w: 50, h: 20 } }] }
    }),
    hints: [
      'At absolute zero (0 K), thermal motion stops and every particle settles into its lowest energy state.',
      'With only 1 possible arrangement, there is no uncertainty left in how the particles are arranged.',
      'Unlike enthalpy, entropy has a true zero point: S = 0 at 0 K for any perfect crystal.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      if (card.id === 'zero') return { ok: true };
      return { ok: false, msg: 'At 0 K a perfect crystal has only 1 possible arrangement, which defines the true zero of entropy.' };
    },
    reward: {
      log: 'A perfect crystal at 0 K has S = 0.',
      title: 'The Third Law of Thermodynamics',
      body: 'Because every perfect crystal has S = 0 at 0 K, we can measure a substance\'s absolute (third-law) entropy S° by warming it from 0 K to 298 K and adding up all the entropy it gains.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's6-entropy-path',
    title: 'Down to 0 K and Back Up',
    briefing: {
      speaker: SPEAKER,
      body: [
        'Entropy is a state function, so ΔS° depends only on the reactants and products. By Nernst\'s heat theorem, any reaction between perfect crystals at 0 K has ΔS = 0.',
        'That means we can imagine a 3-step path: (1) cool the reactants to 0 K (losing S° of reactants), (2) react at 0 K (ΔS = 0), and (3) warm the products back up to 298 K (gaining S° of products).'
      ]
    },
    prompt: 'Following the path from reactants down to 0 K and back up to products, what is ΔS° for a reaction?',
    widget,
    table: heatTable({
      pieces: [
        note('pmr', 'Σ S°(products) − Σ S°(reactants)', { x: 112, y: 14 }),
        note('rmp', 'Σ S°(reactants) − Σ S°(products)', { x: 112, y: 31 }),
        note('sum', 'Σ S°(products) + Σ S°(reactants)', { x: 112, y: 48 })
      ],
      fixtures: [
        plaqueFixture('path', 'The 0 K Detour (State Function)', { x: 38, y: 24 }, [
          '1. Cool reactants to 0 K:  − Σ S°(reactants)',
          '2. Rearrange at 0 K:       0  (Nernst theorem)',
          '3. Warm products to 298 K: + Σ S°(products)'
        ], { w: 68 })
      ],
      zones: { slots: [{ id: 'answer', label: 'Total ΔS°rxn', at: { x: 38, y: 51 }, size: { w: 50, h: 16 } }] }
    }),
    hints: [
      'Read the three steps on the plaque: cooling reactants removes their entropy, reacting at 0 K adds 0, and warming products adds their entropy.',
      'Add the three steps together: (− Σ S°(reactants)) + 0 + (+ Σ S°(products)).',
      'The total change equals products minus reactants.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      if (card.id === 'pmr') return { ok: true };
      return { ok: false, msg: 'Check the signs of the three steps on the plaque: cooling reactants is negative and warming products is positive.' };
    },
    reward: {
      log: 'The 0 K path gives ΔS° = Σ S°(products) − Σ S°(reactants).',
      title: 'Where the Entropy Formula Comes From',
      body: 'Because S = 0 at 0 K (Third Law) and ΔS = 0 at 0 K (Nernst\'s theorem), cooling to 0 K and warming back up proves that ΔS°rxn = Σ S°(products) − Σ S°(reactants).'
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    id: 's7-table',
    title: 'Entropy From a Table',
    briefing: {
      speaker: SPEAKER,
      body: 'Now use standard third-law entropies (S° at 298 K) to compute ΔS° = Σ S°(products) − Σ S°(reactants). Remember to multiply each S° by its coefficient in the equation.',
      worked: [
        'N₂(g) + 3 H₂(g) → 2 NH₃(g)',
        `S° in J/(mol·K): N₂ ${S0('N2(g)')}, H₂ ${S0('H2(g)')}, NH₃ ${S0('NH3(g)')}`,
        `Products: 2 × ${S0('NH3(g)')} = ${fixed(2 * S0('NH3(g)'), 1)}`,
        `Reactants: ${S0('N2(g)')} + 3 × ${S0('H2(g)')} = ${fixed(S0('N2(g)') + 3 * S0('H2(g)'), 1)}`,
        `ΔS° = ${fixed(2 * S0('NH3(g)'), 1)} − ${fixed(S0('N2(g)') + 3 * S0('H2(g)'), 1)} = ${fixed(2 * S0('NH3(g)') - S0('N2(g)') - 3 * S0('H2(g)'), 1)} J/(mol·K)`
      ]
    },
    prompt: 'What is the entropy change (ΔS°) for CaCO₃(s) → CaO(s) + CO₂(g)?',
    entry: { id: 'dS', label: 'Entropy change ΔS°', unit: 'J/(mol·K)' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('s0', 'Standard entropy S°, J/(mol·K)', { x: 46, y: 30 }, [
          `CaCO₃(s)    ${S0('CaCO3(s)')}`,
          `CaO(s)    ${S0('CaO(s)')}`,
          `CO₂(g)    ${S0('CO2(g)')}`
        ], { w: 72 }),
        rxnFixture('atoms', { x: 116, y: 30 }, { lhs: [[1, 'CaCO₃']], rhs: [[1, 'CaO'], [1, 'CO₂']], w: 52, h: 34 })
      ]
    }),
    hints: [
      'Read the standard entropy of all three substances on the reference plate.',
      'Group the values into products (right of the arrow) and reactants (left of the arrow).',
      'Here every coefficient is 1, so subtract the reactant entropy from the sum of the products.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'dS');
      if (v == null || Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Enter the entropy change in J/(mol·K).' };
      if (Math.abs(v - DS_LIME) <= 2) return { ok: true };
      if (Math.abs(v - (S0('CaO(s)') + S0('CO2(g)'))) <= 3) return { ok: false, msg: `${v} J/(mol·K) is the entropy of the right side alone, leaving CaCO₃ out.` };
      return { ok: false, msg: `${v} J/(mol·K) is too ${v > DS_LIME ? 'high' : 'low'}; compare the right side of the arrow with the left side.` };
    },
    reward: {
      log: 'ΔS° for breaking down limestone is +160.2 J/(mol·K).',
      title: 'ΔS° From the Table',
      body: 'ΔS° = (38.1 + 213.8) − 91.7 = +160.2 J/(mol·K). Note that ΔS° is measured in joules per kelvin (J/K), not kilojoules.'
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
      body: 'Particles spread out because spread-out arrangements vastly outnumber crowded ones, making spreading out statistically overwhelming at real-world scales. Entropy increases from solid to liquid to gas and as warming opens more energy levels. By the Third Law, S = 0 at 0 K, giving ΔS°rxn = Σ S°(products) − Σ S°(reactants).'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));
const shakes = n => Array.from({ length: n }, () => ({ run: 'chamber' }));

export const SOLUTIONS = [
  [put('spread', 'slot:guess')],
  [...shakes(30), put('spread', 'slot:answer')],
  [put('center', 'slot:answer')],
  [...sort({ melt: 'more', lime: 'more', haber: 'fewer', dew: 'fewer' })],
  [dial('warmer', 'temp', 4), put('levels', 'slot:answer')],
  [put('ice', 'rail:0'), put('cold', 'rail:1'), put('hot', 'rail:2'), put('steam', 'rail:3')],
  [put('zero', 'slot:answer')],
  [put('pmr', 'slot:answer')],
  [{ type: { entry: 'dS', value: '160.2' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [...shakes(30), put('left', 'slot:answer')],
  [put('flat', 'slot:answer')],
  [...sort({ melt: 'fewer', lime: 'more', haber: 'fewer', dew: 'fewer' })],
  [dial('warmer', 'temp', 4), put('same', 'slot:answer')],
  [put('hot', 'rail:0'), put('ice', 'rail:1'), put('cold', 'rail:2'), put('steam', 'rail:3')],
  [put('neg', 'slot:answer')],
  [put('rmp', 'slot:answer')],
  [{ type: { entry: 'dS', value: '250' } }]
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
        if (g && GUESS_LABEL[g]) r.frame.note(`You predicted: ${GUESS_LABEL[g]}. Shake the chamber to test it.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { TOTAL_WAYS, CROWDED_WAYS, DS_LIME };
export { shakesOf, waysOf };
