/**
 * Unit 5 · Bench 3 — Enthalpy of Reaction (q3-enthalpy)
 *
 * The habitat's boiler room, and Ember Reach's third TABLETOP (plan `bench-tabletop.md`, phase T6), on the heat kit
 * (`table/kits/heat.js`). The same lidded cup, now read from the system's side of the line. The heat a bath gains is the heat the
 * reaction lost, counted per mole, and that figure is flipped, scaled and weighed out as fuel.
 *
 *   1  a bath that gained heat                    -> ΔH, with the system's sign
 *   2  twice the scoop in the cup                 -> (heat scales, heat per mole does not)
 *   3  the reverse of a reaction                  -> (ΔH changes sign)
 *   4  a weighed charge of fuel                   -> (heat from grams, by way of moles)
 *   5  the diagram of an uphill reaction          -> (positive ΔH climbs)
 *   6  steam against liquid water                 -> (state symbols carry energy)
 *   7  a heat target worked back to grams         -> (grams from heat)
 *   8  three fuels ranked                         -> (heat per gram)
 *
 * THE EVIDENCE IS ON THE BENCH. A stage that asks for a sign prints no verdict on its shelves; a stage that asks for a figure puts the
 * molar mass and the molar enthalpy on a plaque and leaves the dividing to the player.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, charge, shelfCard, stmt, markCard, numCard, cupFixture, shelvesFixture, plaqueFixture, markerFixture, cupRead, shelvesRead,
  markerRead, whereIs, FUELS
} from '../../table/kits/heat.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\benthalpy\b/i, introducedAt: 1 },
  { term: /\bstate symbols?\b/i, introducedAt: 6 }
];

/** Moles and molar mass are Tallow's; heat in a bath is this world's first two benches. */
export const BUILDS_ON = ['unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const MOUTH = 'slot:cup.mouth';
const PER_MOLE_FORM = -460;
const NO_LABELS = ['Far lower', 'Lower', 'Level', 'Higher', 'Far higher'];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: '200 g Acid Bath', water: 200, T0: 20, showHeat: true });
    return {
      id: 's1-sign',
      title: 'From the Bath\'s Gain to the System\'s Change',
      prompt: 'Set the marker to the reaction\'s ΔH in kJ/mol, from the heat the bath gained and the moles that reacted.',
      briefing: {
        speaker: SPEAKER,
        body: 'ΔH is the heat a reaction takes in or gives out per mole, counted from the system\'s side of the line. Press Submit when the table shows your answer.'
      },
      widget,
      table: heatTable({
        pieces: [charge('mg', 'Mg + 2H⁺', { x: 76, y: 22 }, { moles: 0.05, dH: PER_MOLE_FORM })],
        fixtures: [c.fixture, markerFixture('dH', 'Reaction ΔH', { x: 120, y: 34 }, { min: -600, max: 600, step: 20, start: 0, unit: 'kJ/mol', w: 52 })],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Drop the charge in the cup\'s mouth and read the heat the bath gained and the moles that reacted.',
        'Compare which side of the line gained the energy with which side lost it.',
        'Divide the heat by the moles, then give it the sign that belongs to the system\'s side.'
      ],
      check(state) {
        const v = markerRead(state.table, 'dH');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the reaction\'s ΔH.' };
        if (v === PER_MOLE_FORM) return { ok: true };
        if (v === -PER_MOLE_FORM) return { ok: false, msg: 'Decide which side of the line gained the energy; the system\'s change has the opposite sign to the bath\'s.' };
        return { ok: false, msg: 'Check that the heat is divided by the moles that reacted, and that the size is kilojoules per mole.' };
      },
      reward: {
        log: 'The system lost what the bath gained.',
        title: 'Enthalpy Change',
        body: 'The heat a reaction exchanges at constant pressure, per mole of reaction, is its enthalpy change, ΔH. A reaction that warms its bath has a negative ΔH, because the system lost that energy.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 29 }, { title: '200 g Acid Bath', water: 200, T0: 20, showHeat: true, molesList: [0.05, 0.1], record: true });
    const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
    return {
      id: 's2-scale-amount',
      title: 'Doubling the Scoop in the Cup',
      prompt: 'Predict what doubling the moles does to the heat in the cup and to the heat per mole, then test it.',
      widget,
      table: heatTable({
        pieces: [charge('mg', 'Mg + 2H⁺', { x: 76, y: 20 }, { moles: 0.05, dH: PER_MOLE_FORM })],
        fixtures: [c.fixture],
        zones: { slots: [c.slot] },
        prediction: {
          slot: { id: 'predict', label: 'Doubling the moles', at: { x: 118, y: 28 }, size: { w: 30, h: 12 } },
          tokens: [token('q-doubles-dh-same', 'Heat doubles, ΔH same', 66), token('both-double', 'Both double', 100), token('neither', 'Neither changes', 132)]
        }
      }),
      hints: [
        'Place a prediction, drop the charge in the cup, set the Moles reacted dial and press Record.',
        'Compare the heat at the two settings, then divide each by the moles that reacted.',
        'Work out the heat per mole at both settings and see whether it moves.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        if (token === 'q-doubles-dh-same') return { ok: true };
        if (t.prediction.tested) return token === 'neither'
          ? { ok: false, msg: 'Read the heat the cup prints at both Moles reacted settings: it is not the same.' }
          : { ok: false, msg: 'Divide the heat by the moles at both settings, and check whether the quotient moves.' };
        return { ok: false, msg: 'Drop the charge in the cup, turn the Moles reacted dial through both settings, press Record and compare.' };
      },
      reward: {
        log: 'Twice the scoop gave twice the heat.',
        title: 'Heat Scales, ΔH Does Not',
        body: 'The heat caught in a cup grows with the amount that reacts, but the heat per mole does not. ΔH is quoted per mole of reaction so that every cup size gives the same figure.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const s = shelvesFixture('chart', { x: 30, y: 30 }, { reactants: 'H₂(g) + ½O₂(g)', products: 'H₂O(l)', dH: -285.8, scale: 285.8, hideValue: true, hideVerdict: true, dir: true, title: 'Water formation' });
    const cards = [['plus', '+285.8', 285.8], ['minus', '−285.8', -285.8], ['double', '+571.6', 571.6], ['zero', '0', 0]];
    return {
      id: 's3-reverse',
      title: 'Climbing Back Up the Same Hill',
      prompt: 'Forming liquid water from hydrogen and oxygen has a ΔH of −285.8 kJ/mol; put the ΔH for splitting it back apart in the slot.',
      widget,
      table: heatTable({
        pieces: cards.map(([id, label, v], i) => numCard(id, label, { x: 66 + i * 21, y: 56 }, v)),
        fixtures: [s],
        zones: { slots: [{ id: 'answer', label: 'ΔH of splitting water', at: { x: 118, y: 30 }, size: { w: 20, h: 12 } }] }
      }),
      hints: [
        'Turn the Direction dial to Reverse and watch which shelf the reaction now starts on.',
        'Compare the distance between the two shelves before and after the swap.',
        'The reverse trip covers the same distance in the opposite direction.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Put a value in the slot.' };
        if (p.props.value === 285.8) return { ok: true };
        if (p.props.value === -285.8) return { ok: false, msg: 'That is the value for the trip down; the reverse trip starts on the lower shelf.' };
        if (p.props.value === 571.6) return { ok: false, msg: 'Only one mole of water is split, and the shelves are the same distance apart.' };
        return { ok: false, msg: 'The two shelves sit at different heights, so some energy must be exchanged.' };
      },
      reward: {
        log: 'The reverse trip covers the same distance.',
        title: 'Reversing a Reaction',
        body: 'Reversing a reaction swaps its starting and finishing shelves, so ΔH keeps its size and changes its sign. Splitting water takes in exactly what forming it gave out.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const s = shelvesFixture('chart', { x: 30, y: 30 }, { reactants: 'CH₄(g) + 2O₂(g)', products: 'CO₂(g) + 2H₂O(l)', dH: -890, scale: 890, hideVerdict: true, title: 'Burning methane' });
    const cards = [['q445', '445 kJ', 445], ['q890', '890 kJ', 890], ['q1780', '1780 kJ', 1780], ['q55', '55.5 kJ', 55.5]];
    return {
      id: 's4-burn-mass',
      title: 'Heat from a Weighed Fuel Charge',
      prompt: 'Put the heat released when 8.02 g of methane burns in the slot.',
      briefing: {
        speaker: SPEAKER,
        body: 'The ΔH on the chart is for one mole of methane burning, but the charge on the bench is weighed in grams.'
      },
      widget,
      table: heatTable({
        pieces: cards.map(([id, label, v], i) => numCard(id, label, { x: 66 + i * 21, y: 56 }, v)),
        fixtures: [s, plaqueFixture('ref', 'The charge', { x: 92, y: 16 }, ['8.02 g of methane', 'Molar mass of CH₄: 16.04 g/mol'], { w: 56 })],
        zones: { slots: [{ id: 'answer', label: 'Heat released', at: { x: 124, y: 40 }, size: { w: 22, h: 12 } }] }
      }),
      hints: [
        'Read the ΔH from the chart and the molar mass from the plaque.',
        'Compare the mass of the charge with the mass of one mole.',
        'Turn the grams into moles first, then multiply by the heat released per mole.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Put a value in the slot.' };
        if (p.props.value === 445) return { ok: true };
        if (p.props.value === 890) return { ok: false, msg: 'That is the heat for a whole mole; compare the mass of the charge with the mass of one mole.' };
        if (p.props.value === 1780) return { ok: false, msg: 'The charge is smaller than one mole, not larger.' };
        return { ok: false, msg: 'That looks like a figure per gram; the question asks for the whole charge.' };
      },
      reward: {
        log: 'Half a mole released half the heat.',
        title: 'Heat from Grams',
        body: 'A balanced equation ties kilojoules to moles, so grams must become moles first. Here 8.02 g is half a mole of methane, and it releases half of 890 kJ, which is 445 kJ.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const s = shelvesFixture('chart', { x: 44, y: 32 }, {
      reactants: 'N₂(g) + O₂(g)', products: '2 NO(g)', dH: 0, scale: 180.6, hideValue: true, hideVerdict: true, title: 'Chart',
      build: { afterList: [-180.6, -90.3, 0, 90.3, 180.6], labels: NO_LABELS, label: 'After shelf' }
    });
    return {
      id: 's5-pick-endo',
      title: 'Spotting an Uphill Reaction',
      prompt: 'Set the chart to match N₂ + O₂ → 2 NO, which has a ΔH of +180.6 kJ/mol.',
      widget,
      table: heatTable({ fixtures: [s] }),
      hints: [
        'Turn the After shelf dial and watch where the finishing shelf stands.',
        'Compare the sign of the ΔH in the prompt with whether the products end higher or lower.',
        'A positive ΔH means the system took in energy, so its products end on the higher shelf.'
      ],
      check(state) {
        const r = shelvesRead(state.table, 'chart');
        if (r.dH === 0) return { ok: false, notYet: true, msg: 'The two shelves are level: turn the After shelf dial.' };
        if (r.dH > 0) return { ok: true };
        return { ok: false, msg: 'On that chart the products end on a lower shelf than they began, which is how a system looks after giving out energy.' };
      },
      reward: {
        log: 'The products sit on the higher shelf.',
        title: 'A Positive ΔH',
        body: 'A positive ΔH means the products sit on a higher enthalpy shelf than the reactants, so the reaction takes in heat. Forming nitric oxide from air is an uphill, endothermic reaction.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const a = shelvesFixture('vapour', { x: 28, y: 32 }, { reactants: 'H₂(g) + ½O₂(g)', products: 'H₂O(g)', dH: -241.8, scale: 285.8, hideVerdict: true, title: 'To water vapour' });
    const b = shelvesFixture('liquid', { x: 80, y: 32 }, { reactants: 'H₂(g) + ½O₂(g)', products: 'H₂O(l)', dH: -285.8, scale: 285.8, hideVerdict: true, title: 'To liquid water' });
    return {
      id: 's6-state-matters',
      title: 'Why Physical State Changes ΔH',
      prompt: 'Mark the statement the two charts support: why does burning hydrogen to liquid water release more heat than burning it to steam?',
      widget,
      table: heatTable({
        pieces: [
          markCard('condense', 'The steam condensing to liquid gives out extra heat', { x: 126, y: 12 }),
          markCard('heavier', 'Liquid water has a larger molar mass than steam', { x: 126, y: 30 }),
          markCard('reactants', 'The hydrogen and oxygen start at different energies in the two runs', { x: 126, y: 48 })
        ],
        fixtures: [a, b]
      }),
      hints: [
        'Tap a statement to mark it, and tap it again to take the mark off.',
        'Compare the starting shelf on the two charts, and then compare where each one finishes.',
        'The liquid is further along the road than the gas, so the step between them has its own energy.'
      ],
      check(state) {
        const t = state.table;
        const marked = ['condense', 'heavier', 'reactants'].filter(id => t.pieces[id].props.flipped);
        if (!marked.length) return { ok: false, notYet: true, msg: 'Mark the statement the charts support.' };
        if (marked.length === 1 && marked[0] === 'condense') return { ok: true };
        if (marked.includes('heavier')) return { ok: false, msg: 'A mole of water has the same mass whether it is a gas or a liquid.' };
        if (marked.includes('reactants')) return { ok: false, msg: 'Compare the labels on the starting shelf of the two charts: they are the same.' };
        return { ok: false, msg: 'Mark only the statement that both charts support.' };
      },
      reward: {
        log: 'The liquid sits a step below the steam.',
        title: 'State Symbols Matter',
        body: 'Changing state carries its own enthalpy: condensing a mole of steam releases about 44 kJ. That is why a thermochemical equation always shows state symbols such as (s), (l) and (g).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const s = shelvesFixture('chart', { x: 30, y: 30 }, { reactants: 'CH₄(g) + 2O₂(g)', products: 'CO₂(g) + 2H₂O(l)', dH: -890, scale: 890, hideVerdict: true, title: 'Burning methane' });
    return {
      id: 's7-mass-for-heat',
      title: 'Weighing Out a Target Heat Dose',
      prompt: 'Set the marker to the grams of methane that must burn to release 222.5 kJ.',
      widget,
      table: heatTable({
        fixtures: [
          s,
          plaqueFixture('ref', 'What you may use', { x: 92, y: 16 }, ['Molar mass of CH₄: 16.0 g/mol'], { w: 56 }),
          markerFixture('grams', 'Methane to burn', { x: 120, y: 40 }, { min: 1, max: 12, step: 1, start: 1, unit: 'g', w: 52 })
        ]
      }),
      hints: [
        'Read the ΔH from the chart and the molar mass from the plaque.',
        'Compare the target heat with the heat that one whole mole releases.',
        'Find the moles that deliver the target, then turn those moles into grams.'
      ],
      check(state) {
        const v = markerRead(state.table, 'grams');
        if (v === 1) return { ok: false, notYet: true, msg: 'Set the marker to the mass of methane.' };
        if (Math.abs(v - 4.0) <= 0.15) return { ok: true };
        return { ok: false, msg: 'Work from the heat to the moles first, then from the moles to the grams.' };
      },
      reward: {
        log: 'A quarter of a mole delivers the target.',
        title: 'Grams from Heat',
        body: 'The route runs both ways: heat divided by ΔH gives moles, and moles times molar mass gives grams. A quarter of a mole of methane, 4.0 g, releases 222.5 kJ.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    return {
      id: 's8-rank-fuels',
      title: 'Heat per Mole vs Heat per Gram',
      prompt: 'Order the three fuels from lowest to highest heat released per gram.',
      widget,
      table: heatTable({
        pieces: [
          shelfCard('methanol', 'Methanol', { x: 40, y: 40 }, { dH: FUELS.methanol.dHc, from: 'CH₃OH + 1.5O₂', to: 'CO₂ + 2H₂O' }),
          shelfCard('methane', 'Methane', { x: 75, y: 40 }, { dH: FUELS.methane.dHc, from: 'CH₄ + 2O₂', to: 'CO₂ + 2H₂O' }),
          shelfCard('hydrogen', 'Hydrogen', { x: 110, y: 40 }, { dH: FUELS.hydrogen.dHc, from: 'H₂ + ½O₂', to: 'H₂O(l)' })
        ],
        fixtures: [plaqueFixture('ref', 'Heat per mole and molar mass', { x: 75, y: 13 }, ['Methanol: −726 kJ/mol, 32.0 g/mol', 'Methane: −890 kJ/mol, 16.0 g/mol', 'Hydrogen: −286 kJ/mol, 2.02 g/mol'], { w: 84 })],
        zones: { rail: { at: { x: 75, y: 50 }, size: { w: 112, h: 14 }, first: 'Lowest heat per gram', last: 'Highest heat per gram', items: ['methanol', 'methane', 'hydrogen'] } }
      }),
      hints: [
        'Read each fuel\'s heat per mole and its molar mass from the plaque.',
        'Compare the fuels by the heat in one gram, not in one mole.',
        'Divide each fuel\'s heat per mole by its molar mass, then put the three in rising order.'
      ],
      check(state) {
        const order = state.table.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three fuels in order.' };
        if (order.join(',') === 'methanol,methane,hydrogen') return { ok: true };
        return { ok: false, msg: 'Heat per mole is not heat per gram; divide each fuel\'s heat by its own molar mass before ranking.' };
      },
      reward: {
        log: 'The lightest molecule carries the most heat per gram.',
        title: 'Energy per Gram',
        body: 'Hydrogen releases the least heat per mole but the most per gram, because its molar mass is tiny. Fuels for anything that must lift their own weight are ranked in kilojoules per gram.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the charge onto the cup, then set the marker.'],
  2: ['Place a prediction; drag the charge onto the cup;', 'turn the Moles reacted dial; press Record.'],
  3: ['Turn the Direction dial; drag a value into the slot.'],
  4: ['Drag the right value into the slot.'],
  5: ['Turn the After shelf dial.'],
  6: ['Tap a statement to mark it.'],
  7: ['Set the marker.'],
  8: ['Drag the fuels into order along the rail.']
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
      body: 'ΔH is the heat per mole of reaction counted from the system’s side: negative when the bath warms, positive when it cools. Reversing a reaction flips its sign, and moles turn it into kilojoules and grams.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'A thermochemical equation is a price list: it says how much heat a mole of reaction buys or costs. From here on the bench reads that price, not the bath.'
    },
    {
      heading: 'Next',
      body: 'The next bench looks inside the price and asks where in the molecules the energy is kept.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'For N₂(g) + 3 H₂(g) → 2 NH₃(g), ΔH = −92 kJ. What is ΔH for 2 NH₃(g) → N₂(g) + 3 H₂(g)?',
    options: [
      { id: 'a', label: '+92 kJ' },
      { id: 'b', label: '−92 kJ' },
      { id: 'c', label: '+184 kJ' },
      { id: 'd', label: '0 kJ' }
    ],
    answer: 'a',
    explanation: 'Reversing a reaction swaps the reactants and products, so ΔH keeps its size and changes its sign.'
  },
  {
    question: 'C(s) + O₂(g) → CO₂(g) has ΔH = −393.5 kJ/mol. How much heat is released when 2.00 mol of carbon burns completely?',
    options: [
      { id: 'a', label: '787 kJ' },
      { id: 'b', label: '394 kJ' },
      { id: 'c', label: '197 kJ' },
      { id: 'd', label: '1574 kJ' }
    ],
    answer: 'a',
    explanation: 'Two moles release twice the heat of one mole: 2.00 mol × 393.5 kJ/mol is about 787 kJ.'
  },
  {
    question: 'Why is a fuel’s ΔH more negative when it burns to liquid water than to water vapour?',
    options: [
      { id: 'a', label: 'Condensing the vapour to a liquid releases extra heat' },
      { id: 'b', label: 'Condensing the vapour to a liquid absorbs heat from the flame' },
      { id: 'c', label: 'Liquid water contains more oxygen atoms than vapour' }
    ],
    answer: 'a',
    explanation: 'Liquid water sits lower in enthalpy than vapour, so ending as a liquid releases the enthalpy of condensation as well.'
  },
  {
    question: 'When 0.10 mol of a salt dissolves in a calorimeter, the water bath loses 1.5 kJ. What is ΔH for dissolving one mole of the salt?',
    options: [
      { id: 'a', label: '+15 kJ/mol' },
      { id: 'b', label: '−15 kJ/mol' },
      { id: 'c', label: '+1.5 kJ/mol' },
      { id: 'd', label: '−1.5 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'The bath lost the energy the salt gained, so ΔH is positive, and 1.5 kJ divided by 0.10 mol is 15 kJ/mol.'
  },
  {
    question: 'Burning 1.0 mol of carbon (12.0 g/mol) releases 394 kJ, and burning 1.0 mol of hydrogen (2.0 g/mol) releases 286 kJ. Which releases more heat per gram?',
    options: [
      { id: 'a', label: 'Hydrogen, because a gram of it holds many more moles' },
      { id: 'b', label: 'Carbon, because 394 kJ is larger than 286 kJ' },
      { id: 'c', label: 'Both release the same heat per gram' }
    ],
    answer: 'a',
    explanation: 'Divide by the molar mass: hydrogen gives about 143 kJ per gram and carbon about 33 kJ per gram.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const rail = (...ids) => ids.map((id, i) => put(id, `rail:${i}`));

export const SOLUTIONS = [
  [put('mg', MOUTH), dial('dH', 'value', -460)],
  [{ predict: 'q-doubles-dh-same' }, put('mg', MOUTH), dial('cup', 'moles', 2), { run: 'cup' }],
  [dial('chart', 'dir', 2), put('plus', 'slot:answer')],
  [put('q445', 'slot:answer')],
  [dial('chart', 'after', 5)],
  [{ flip: 'condense' }],
  [dial('grams', 'value', 4)],
  [...rail('methanol', 'methane', 'hydrogen')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('mg', MOUTH), dial('dH', 'value', 460)],
  [{ predict: 'both-double' }, put('mg', MOUTH), dial('cup', 'moles', 2), { run: 'cup' }],
  [dial('chart', 'dir', 2), put('minus', 'slot:answer')],
  [put('q890', 'slot:answer')],
  [dial('chart', 'after', 1)],
  [{ flip: 'heavier' }],
  [dial('grams', 'value', 8)],
  [...rail('hydrogen', 'methane', 'methanol')]
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
export { cupRead, shelvesRead, PER_MOLE_FORM };
