/**
 * Unit 5 · Bench 6 — Entropy (q6-entropy)
 *
 * The silencer bay, where steam expands, and Ember Reach's sixth TABLETOP (plan `bench-tabletop.md`, phase T6), on the heat kit
 * (`table/kits/heat.js`). Cells that particles are put in, a chamber that is shaken, pictures of a sample's particles to rank and sort,
 * and the entropy table that turns a count of arrangements into a number.
 *
 *   1  more room, more ways to arrange             -> microstates
 *   2  a chamber shaken again and again            -> entropy
 *   3  ice, liquid water and steam                 -> solid, liquid, gas
 *   4  counting gas across a reaction              -> gas moles and ΔS°
 *   5  a crystal breaking into mobile ions         -> dissolving a salt
 *   6  warming a sample without changing phase     -> heating raises entropy
 *   7  the table of absolute entropies             -> standard molar entropy
 *   8  four changes sorted by the sign of ΔS       -> the sign of ΔS
 *
 * THE EVIDENCE IS ON THE BENCH. The cells print the arrangements the player has logged and never the count of all of them; the chamber
 * tallies where the particles stood after each shake, and the sample prints the entropy it gained only once it has been recorded.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, phaseCard, stmt, tag, particle, cellsFixture, chamberFixture, warmFixture, plaqueFixture, markerFixture, selectorFixture,
  markerRead, dialAt, whereIs, waysOf, loggedArrangements, shakesOf, warmAt, FORMATION_TABLE, standardReactionChange
} from '../../table/kits/heat.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmicrostates?\b/i, introducedAt: 1 },
  { term: /\bentropy\b/i, introducedAt: 2 },
  { term: /\bstandard molar entropy\b/i, introducedAt: 7 }
];

/** Counting arrangements is the idea behind pressure and the gas laws in Bellows, and the mole is Tallow's. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const WAYS_8_2 = waysOf(8, 2);
const S0 = id => FORMATION_TABLE[id].S0;
const DS_LIME = standardReactionChange([{ id: 'CaO(s)' }, { id: 'CO2(g)' }], [{ id: 'CaCO3(s)' }], 'S0');

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const cells = cellsFixture('box', { x: 61, y: 23 }, { cells: 8, leftCells: 4, particles: 2, hideWays: true, title: 'Box of cells' });
    return {
      id: 's1-count-ways',
      title: 'More Room, More Ways to Arrange',
      prompt: 'Open the gate, then set the marker to how many different ways the two particles can sit in the open cells.',
      briefing: {
        speaker: SPEAKER,
        body: 'Two particles sit in a box of cells, and a gate holds them in the left four; each different choice of cells for them is one arrangement. Press Submit when the table shows your answer.'
      },
      widget,
      table: heatTable({
        pieces: [particle('p1', { x: 20, y: 52 }, { label: 'A' }), particle('p2', { x: 40, y: 52 }, { label: 'B' })],
        fixtures: [cells.fixture, markerFixture('ways', 'Arrangements', { x: 114, y: 51 }, { min: 2, max: 60, step: 2, start: 20, unit: 'ways', w: 46 })],
        zones: { slots: cells.slots }
      }),
      hints: [
        'Drag the two particles into cells and press Log, and turn the Gate dial to open the gate.',
        'Compare the shut box with the open one by counting the different pairs of cells the two particles could fill.',
        'Each particle takes a cell of its own, and swapping the two particles gives the same arrangement.'
      ],
      check(state) {
        const v = markerRead(state.table, 'ways');
        if (v === 20) return { ok: false, notYet: true, msg: 'Set the marker to the number of arrangements.' };
        if (v === WAYS_8_2) return { ok: true };
        if (v === waysOf(4, 2)) return { ok: false, msg: 'That is the count with the gate shut; open it and count again.' };
        return { ok: false, msg: 'Count the pairs of open cells: each particle needs a cell of its own, and the particles are identical.' };
      },
      reward: {
        log: 'Opening the gate multiplied the ways.',
        title: 'Microstates',
        body: 'Each distinct arrangement of the particles is a microstate, and W is how many there are. Opening the gate to eight cells raises W from 6 to 28.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
    return {
      id: 's2-why-never-back',
      title: 'Why an Expanding Gas Never Crowds Back',
      prompt: 'Predict where four particles will stand after many shakes of the open chamber, then test it.',
      briefing: {
        speaker: SPEAKER,
        body: 'Nothing pulls the particles to the right; each shake puts them in whichever cells are open.'
      },
      widget,
      table: heatTable({
        fixtures: [chamberFixture('chamber', { x: 45, y: 27 }, { cells: 8, particles: 4, title: 'Open chamber of 8 cells' })],
        prediction: {
          slot: { id: 'predict', label: 'After many shakes', at: { x: 118, y: 28 }, size: { w: 30, h: 12 } },
          tokens: [token('spread', 'Spread over both halves', 58), token('crowded', 'Crowded in the left half', 98), token('right', 'Pulled to the right', 136)]
        }
      }),
      hints: [
        'Place a prediction, then press Shake again and again and watch the tally.',
        'Compare how often every particle stood in the left half with how often they were spread out.',
        'With particles moving at random, the state with the most arrangements is the one that turns up.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        if (token === 'spread') return { ok: true };
        if (t.prediction.tested) return token === 'right'
          ? { ok: false, msg: 'Empty space has nothing in it to pull with; the particles only move at random.' }
          : { ok: false, msg: 'Read the tally under the chamber: the crowded arrangement turns up far less often than a spread one.' };
        return { ok: false, msg: 'Press Shake a good many times and compare the tally with your prediction.' };
      },
      reward: {
        log: 'Spread out is simply the likeliest state.',
        title: 'Entropy',
        body: 'Entropy, S, measures how many microstates a system has: S = k ln W. A gas spreads out because spread-out states overwhelmingly outnumber crowded ones, with no force needed.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-order-phases',
    title: 'Positional Freedom Across Solid, Liquid and Gas',
    prompt: 'Order ice, liquid water and steam from the lowest entropy to the highest.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each card draws the same number of water molecules in the same box at the same temperature.'
    },
    widget,
    table: heatTable({
      pieces: [
        phaseCard('ice', 'Ice H₂O(s)', { x: 40, y: 38 }, 'solid'),
        phaseCard('water', 'Liquid water H₂O(l)', { x: 75, y: 38 }, 'liquid'),
        phaseCard('steam', 'Steam H₂O(g)', { x: 110, y: 38 }, 'gas')
      ],
      zones: { rail: { at: { x: 75, y: 38 }, size: { w: 112, h: 14 }, first: 'Lowest entropy', last: 'Highest entropy', items: ['ice', 'water', 'steam'] } }
    }),
    hints: [
      'Look at how the molecules are placed on each of the three cards.',
      'Compare how many different places each molecule could be in on each card.',
      'The more places a molecule can be, the more arrangements there are, so put the cards from fewest places to most.'
    ],
    check(state) {
      const order = state.table.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three phases in order.' };
      if (order.join(',') === 'ice,water,steam') return { ok: true };
      return { ok: false, msg: 'Compare how much freedom the molecules have on each card: the most confined phase has the fewest arrangements.' };
    },
    reward: {
      log: 'More freedom meant more arrangements.',
      title: 'Solid, Liquid, Gas',
      body: 'For one substance at one temperature, S of a solid is smaller than S of a liquid, which is far smaller than S of a gas. Boiling lets each molecule roam a volume about a thousand times larger.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-gas-moles',
    title: 'Counting Gas Across a Reaction',
    prompt: 'Sort the two reactions by the sign of their ΔS°.',
    briefing: {
      speaker: SPEAKER,
      body: 'ΔS° is the entropy of a reaction\'s products less that of its reactants, and each card shows the states of the substances involved.'
    },
    widget,
    table: heatTable({
      pieces: [
        stmt('lime', 'CaCO₃(s) → CaO(s) + CO₂(g)', { x: 30, y: 22 }),
        stmt('haber', 'N₂(g) + 3 H₂(g) → 2 NH₃(g)', { x: 30, y: 42 })
      ],
      zones: {
        trays: [
          { id: 'pos', label: 'ΔS° above zero', at: { x: 110, y: 20 }, size: { w: 40, h: 14 }, cell: 36, cellH: 13 },
          { id: 'neg', label: 'ΔS° below zero', at: { x: 110, y: 46 }, size: { w: 40, h: 14 }, cell: 36, cellH: 13 }
        ]
      }
    }),
    hints: [
      'Read the equation on each card, state symbols included.',
      'Compare the moles of gas on the two sides of each equation.',
      'Gas carries by far the most entropy, so a reaction that makes gas gains entropy and one that uses gas up loses it.'
    ],
    check(state) {
      const t = state.table;
      if (!['pos', 'neg'].includes(whereIs(t, 'lime')) || !['pos', 'neg'].includes(whereIs(t, 'haber'))) return { ok: false, notYet: true, msg: 'Place both reactions first.' };
      if (whereIs(t, 'lime') === 'pos' && whereIs(t, 'haber') === 'neg') return { ok: true };
      return { ok: false, msg: 'Count the moles of gas on each side of each equation: a reaction that ends with more gas than it began with gains entropy.' };
    },
    reward: {
      log: 'The gas decided the sign.',
      title: 'Gas Moles and ΔS°',
      body: 'Gas dominates entropy changes. A reaction that produces gas has a positive ΔS°, and one that turns four moles of gas into two has a negative ΔS°.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-dissolving',
    title: 'Breaking a Crystal Into Mobile Ions',
    prompt: 'Put the sign of ΔS° for solid sodium chloride dissolving in water in the slot.',
    briefing: {
      speaker: SPEAKER,
      body: 'Sodium chloride is a crystal of fixed ions, and in water its ions drift apart.'
    },
    widget,
    table: heatTable({
      pieces: [
        { ...phaseCard('before', 'Before: NaCl(s) crystal', { x: 30, y: 26 }, 'solid'), fixed: true },
        { ...phaseCard('after', 'After: Na⁺ + Cl⁻ in water', { x: 66, y: 26 }, 'liquid'), fixed: true },
        tag('pos', 'Positive', { x: 80, y: 52 }),
        tag('neg', 'Negative', { x: 108, y: 52 }),
        tag('zero', 'Zero', { x: 136, y: 52 })
      ],
      zones: { slots: [{ id: 'answer', label: 'Sign of ΔS°', at: { x: 118, y: 26 }, size: { w: 28, h: 12 } }] }
    }),
    hints: [
      'Compare how the ions are placed on the two cards.',
      'Compare how many places each ion could be in before and after dissolving.',
      'More places for the ions means more arrangements, and the sign follows from whether the count rose or fell.'
    ],
    check(state) {
      const p = Object.values(state.table.pieces).find(q => q.zone === 'slot:answer');
      if (!p) return { ok: false, notYet: true, msg: 'Put a sign in the slot.' };
      if (p.id === 'pos') return { ok: true };
      if (p.id === 'neg') return { ok: false, msg: 'The ions do not disappear when they dissolve; compare the places each one can be in before and after.' };
      return { ok: false, msg: 'The two cards show the ions in very different freedom, and no gas is needed for entropy to change.' };
    },
    reward: {
      log: 'The freed ions gained arrangements.',
      title: 'Dissolving a Salt',
      body: 'Freeing ions from a rigid crystal into a solution gives each ion far more places to be. Dissolving most simple salts therefore has a positive ΔS°.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
    return {
      id: 's6-heating',
      title: 'How Heating Changes Entropy',
      prompt: 'Predict what warming a sample without changing its phase does to its entropy, then test it.',
      briefing: {
        speaker: SPEAKER,
        body: 'Position is not the only freedom: heat also spreads over the speeds, spins and vibrations of the molecules.'
      },
      widget,
      table: heatTable({
        fixtures: [warmFixture('sample', { x: 30, y: 28 }, { Ts: [-73, 27, 127], hideS: true, title: '100 g gas sample' })],
        prediction: {
          slot: { id: 'predict', label: 'Warming it', at: { x: 118, y: 28 }, size: { w: 30, h: 12 } },
          tokens: [token('up', 'Entropy increases', 70), token('down', 'Entropy decreases', 106), token('same', 'Stays the same', 138)]
        }
      }),
      hints: [
        'Place a prediction, turn the Heater dial to a higher setting and press Record.',
        'Compare the range of speeds drawn at the cool setting and at the hot one.',
        'A wider range of possible motions means more arrangements of the energy.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        if (token === 'up') return { ok: true };
        if (t.prediction.tested) return token === 'down'
          ? { ok: false, msg: 'Faster molecules do not have fewer states; compare the range of speeds at the two settings.' }
          : { ok: false, msg: 'The two settings show different spreads of speeds, so the number of arrangements is not the same.' };
        return { ok: false, msg: 'Turn the Heater dial up, press Record and compare the entropy it prints with your prediction.' };
      },
      reward: {
        log: 'The hot sample had more ways to share its energy.',
        title: 'Heating Raises Entropy',
        body: 'Warming a substance spreads its energy over a wider range of speeds, rotations and vibrations. More ways to share the energy means a larger W, so entropy rises with temperature.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-table-calc',
    title: 'Absolute Entropies at 298 K',
    prompt: 'Use the entropy table to find ΔS° for CaCO₃(s) → CaO(s) + CO₂(g), and set it on the dial.',
    briefing: {
      speaker: SPEAKER,
      body: 'Entropy has a true zero, a perfect crystal at 0 K, so every substance at 298 K has a value above zero.'
    },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('s0', 'S° at 298 K, J/(mol·K)', { x: 46, y: 28 }, [`CaCO₃(s)    ${S0('CaCO3(s)')}`, `CaO(s)    ${S0('CaO(s)')}`, `CO₂(g)    ${S0('CO2(g)')}`], { w: 70 }),
        selectorFixture('answer', 'ΔS° (J/(mol·K))', { x: 120, y: 28 }, { options: ['+160.2', '−160.2', '+343.6', '+251.9'], start: 4, w: 46 })
      ]
    }),
    hints: [
      'Read the S° of each substance from the table.',
      'Compare the total for the products with the total for the reactants.',
      'Add the entropies of the products, then take off the entropies of the reactants.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the value you worked out.' };
      if (v === 2) return { ok: false, msg: 'The sign is backward: the reaction makes a gas from a solid, so check which total is larger.' };
      if (v === 3) return { ok: false, msg: 'The reactant\'s entropy is taken off the products\', not added to them.' };
      return { ok: false, msg: 'That is only the products\' total; the reactant\'s entropy still has to be taken off.' };
    },
    reward: {
      log: 'The products held more entropy than the reactant.',
      title: 'Standard Molar Entropy',
      body: 'The standard molar entropy, S°, is the absolute entropy of one mole of a substance at 1 bar and 298 K. Products less reactants gives ΔS°, and here it is +160.2 J/(mol·K) because a solid has made a gas.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sort-four',
    title: 'Sorting Four Changes by ΔS',
    prompt: 'Sort the four changes by whether their entropy rises or falls.',
    widget,
    table: heatTable({
      pieces: [
        stmt('boil', 'C₂H₅OH(l) → C₂H₅OH(g)', { x: 30, y: 12 }),
        stmt('freeze', 'H₂O(l) → H₂O(s)', { x: 30, y: 26 }),
        stmt('decomp', '2 N₂O₅(s) → 4 NO₂(g) + O₂(g)', { x: 30, y: 40 }),
        stmt('precip', 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)', { x: 30, y: 54 })
      ],
      zones: {
        trays: [
          { id: 'pos', label: 'ΔS above zero', at: { x: 108, y: 19 }, size: { w: 40, h: 26 }, cell: 36, cellH: 13 },
          { id: 'neg', label: 'ΔS below zero', at: { x: 108, y: 50 }, size: { w: 40, h: 26 }, cell: 36, cellH: 13 }
        ]
      }
    }),
    hints: [
      'Read the equation on each card, state symbols included.',
      'Compare how free the particles are before and after each change.',
      'A change that frees particles into more places gains entropy, and one that locks them into fewer places loses it.'
    ],
    check(state) {
      const t = state.table;
      const want = { boil: 'pos', freeze: 'neg', decomp: 'pos', precip: 'neg' };
      if (Object.keys(want).some(k => !['pos', 'neg'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Place all four changes first.' };
      if (Object.entries(want).every(([k, v]) => whereIs(t, k) === v)) return { ok: true };
      return { ok: false, msg: 'Check each equation: which side has the particles with more freedom to move?' };
    },
    reward: {
      log: 'Four changes sorted by freedom.',
      title: 'The Sign of ΔS',
      body: 'Boiling and gas-forming decomposition spread particles into far more arrangements, so ΔS is positive. Freezing and precipitating lock mobile particles into a crystal, so ΔS is negative.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the particles into cells; press Log.'],
  2: ['Place a prediction, then press Shake.'],
  3: ['Drag the cards into order along the rail.'],
  4: ['Drag each reaction into a tray.'],
  5: ['Drag a sign into the slot.'],
  6: ['Place a prediction; turn the Heater dial;', 'press Record.'],
  7: ['Turn the dial to the value you worked out.'],
  8: ['Drag each change into a tray.']
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
      body: 'Entropy counts the ways particles and energy can be arranged. A gas fills its chamber, a gas-making reaction gains entropy, heating raises it, and every substance at 298 K has a positive value.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Entropy is half of the answer to why things happen on their own. The other half is the heat you measured on the last benches.'
    },
    {
      heading: 'Next',
      body: 'The last bench sets the two against each other, and the balance decides which way a change runs.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which has the greatest entropy per mole at the same temperature?',
    options: [
      { id: 'a', label: 'H₂O(g)' },
      { id: 'b', label: 'H₂O(l)' },
      { id: 'c', label: 'H₂O(s)' }
    ],
    answer: 'a',
    explanation: 'A gas has the most freedom of position, so it has the most microstates and the greatest entropy.'
  },
  {
    question: 'What is the sign of ΔS° for 2 SO₂(g) + O₂(g) → 2 SO₃(g)?',
    options: [
      { id: 'a', label: 'Negative, because three moles of gas become two' },
      { id: 'b', label: 'Positive, because a new compound forms' },
      { id: 'c', label: 'Zero, because every substance is a gas' }
    ],
    answer: 'a',
    explanation: 'The reaction uses up gas, so there are fewer places for the particles to be and entropy falls.'
  },
  {
    question: 'N₂(g) + 3 H₂(g) → 2 NH₃(g). With S° of 191.6, 130.7 and 192.8 J/(mol·K), what is ΔS°?',
    options: [
      { id: 'a', label: '−198.1 J/(mol·K)' },
      { id: 'b', label: '+198.1 J/(mol·K)' },
      { id: 'c', label: '−390.9 J/(mol·K)' },
      { id: 'd', label: '+583.7 J/(mol·K)' }
    ],
    answer: 'a',
    explanation: 'Products are 2 × 192.8 = 385.6 and reactants are 191.6 + 3 × 130.7 = 583.7, so ΔS° is 385.6 − 583.7 = −198.1.'
  },
  {
    question: 'Why does a substance’s entropy rise when it is heated at constant phase?',
    options: [
      { id: 'a', label: 'Its energy can be shared among a wider range of speeds, spins and vibrations' },
      { id: 'b', label: 'Its particles move to fixed positions in a crystal' },
      { id: 'c', label: 'Its particles become fewer in number' }
    ],
    answer: 'a',
    explanation: 'A larger range of possible motions means more microstates, and entropy counts microstates.'
  },
  {
    question: 'Which change has a negative ΔS?',
    options: [
      { id: 'a', label: 'Freezing liquid water' },
      { id: 'b', label: 'Boiling liquid water' },
      { id: 'c', label: 'Dissolving sodium chloride in water' },
      { id: 'd', label: 'Dry ice turning into gas' }
    ],
    answer: 'a',
    explanation: 'Freezing locks mobile molecules into a crystal, which leaves them fewer arrangements; the other changes free particles.'
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
  [put('p1', 'slot:box.c1'), put('p2', 'slot:box.c2'), { run: 'box' }, dial('box', 'gate', 2), put('p2', 'slot:box.c6'), { run: 'box' }, dial('ways', 'value', 28)],
  [{ predict: 'spread' }, { run: 'chamber' }, { run: 'chamber' }, { run: 'chamber' }],
  [...rail('ice', 'water', 'steam')],
  [...sort({ lime: 'pos', haber: 'neg' })],
  [put('pos', 'slot:answer')],
  [{ predict: 'up' }, dial('sample', 'temp', 3), { run: 'sample' }],
  [dial('answer', 'value', 1)],
  [...sort({ boil: 'pos', freeze: 'neg', decomp: 'pos', precip: 'neg' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('ways', 'value', 6)],
  [{ predict: 'crowded' }, { run: 'chamber' }],
  [...rail('steam', 'water', 'ice')],
  [...sort({ lime: 'neg', haber: 'pos' })],
  [put('neg', 'slot:answer')],
  [{ predict: 'down' }, dial('sample', 'temp', 3), { run: 'sample' }],
  [dial('answer', 'value', 2)],
  [...sort({ boil: 'neg', freeze: 'neg', decomp: 'pos', precip: 'neg' })]
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
export { waysOf, loggedArrangements, shakesOf, warmAt, DS_LIME, WAYS_8_2 };
