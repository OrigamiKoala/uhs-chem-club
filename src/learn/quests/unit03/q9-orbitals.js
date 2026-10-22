/**
 * q9-orbitals.js — Ligar, bench nine: MOLECULAR ORBITALS. Beyond the exam, and the
 * briefing and the first card say so.
 *
 * The ninth bench on the world and its seventh TABLETOP (plan `bench-tabletop.md`, phase T3c). The box rack, worked with
 * the hands: the two atoms' boxes stand at the sides and the boxes they make between them stand in the middle, lowest energy
 * at the bottom. Each box is a container; electrons are poured into it from a jar by a drag (or a tap on the jar and then the
 * box) and a box takes one arrow of each direction and no more. The magnet measures the REAL molecule, never the player's
 * arrangement, and a rank of cards on a rail is how the species are put in order of bond length.
 *
 *   1  put the molecule's two boxes and an atom's box in order     -> bonding orbital, antibonding orbital
 *   2  place H2's two electrons                                     -> (electrons fill from the bottom)
 *   3  He2's four electrons, and the bond order they give           -> (bond order is zero)
 *   4  N2's ten electrons, and the bond order they give             -> (a triple bond is order three)
 *   5  O2's twelve, until the rack pulls as hard as the sample      -> (Lewis cannot explain it)
 *   6  rank O2+, O2 and O2- by bond length                          -> (higher order, shorter bond)
 *   7  predict F2's bond against O2's, and test it                  -> (more antibonding electrons)
 *   8  predict whether B2 is pulled, in the other order             -> (the order switch)
 *
 * EVERY COUNT IS `mo.readMO`; every unpaired figure the magnet gives is the real one in `mo.DIATOMICS`, every ground state
 * is `mo.fillMO`, and `verify:learn` checks the graded fills against all three.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { DIATOMICS, fillMO, readMO, bondOrderOf } from '../../engine/mo.js';
import {
  moTable, moRack, moSupply, magnet, bondTester, marker, moCard, fillSteps,
  readOf, matchesGround, supplyLeft, magnetRead, bondTestRead
} from '../../table/kits/mo.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bantibonding\b/i, introducedAt: 1 },
  { term: /\bbonding orbitals?\b/i, introducedAt: 1 },
  { term: /\bmolecular orbitals?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q8-hybrid', 'unit02/q6-filling', 'unit03/q3-distance'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   The rack stands in the middle of a 150 x 64 table; the jar of electrons stands at its left and the magnet or the marker at its right.
   ------------------------------------------------------------------ */

const RACK_AT = { x: 74, y: 32 };
const JAR_AT = { x: 15, y: 40 };

/** A table with one rack, its jar of electrons and whatever fixtures stand beside it. */
function rackTable(mol, { counts = false, jar = JAR_AT, extra = [], pieces = [], zones = {}, prediction = null } = {}) {
  const rack = moRack('a', mol, RACK_AT, { counts });
  return moTable({
    pieces,
    zones: { ...zones, containers: [moSupply('supply', 'Electrons', jar, DIATOMICS[mol].e, jar.y < 20 ? { w: 28, h: 19 } : undefined), ...rack.containers] },
    fixtures: [rack.fixture, ...extra],
    ...(prediction ? { prediction } : {})
  });
}

/** The three tokens (or two) of a prediction, stacked under the jar of electrons. */
const tokenAt = (id, label, y) => ({ id, label, at: { x: 15, y }, r: 6.5 });
const SLOT_AT = { x: 134, y: 53 };

const ROW_ID = 'rail';
const rail = (items, start, first, last, size = { w: 128, h: 20 }, at = { x: 75, y: 53 }) => ({ id: ROW_ID, at, size, first, last, items, start });

/** What a stage's check reads: the electrons on rack `a`, and what they should be. */
const rackRead = t => readOf(t, 'a');
const COUNT_MSG = 'Count the electrons on the rack against the number the molecule has.';
const HIGH_MSG = 'An electron is sitting higher on the ladder than it needs to be.';

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rack = moRack('a', 'H2', { x: 62, y: 21 }, { live: false, merged: false, tags: { u1s: '1', g1s: '2' }, size: { w: 86, h: 42 } });
    return {
      title: 'Two Become Two',
      briefing: {
        speaker: SPEAKER,
        body: 'This bench shows how atomic energy levels combine when a molecule forms: press "Join Atoms" to see it happen. Press Submit when the table shows your answer.'
      },
      prompt: 'Put the molecule\'s two boxes and one atom\'s box in order of energy.',
      widget: { type: 'table', label: 'The bench' },
      table: moTable({
        pieces: [
          moCard('box1', 'Box 1', { x: 30, y: 53 }),
          moCard('box2', 'Box 2', { x: 75, y: 53 }),
          moCard('atom', 'Atom\'s box', { x: 120, y: 53 })
        ],
        zones: { rail: rail(['box1', 'box2', 'atom'], ['atom', 'box1', 'box2'], 'Lowest energy', 'Highest energy', { w: 128, h: 20 }) },
        fixtures: [rack.fixture]
      }),
      hints: [
        'Press "Join Atoms" and read where the numbered boxes stand on the ladder.',
        'Compare the height of each numbered box with the height of the boxes the atoms started with.',
        'Drag the cards along the rail so the lowest box comes first and the highest comes last.'
      ],
      check(state) {
        const order = state.table.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three boxes on the rail in order.' };
        if (order.join() === ['box2', 'atom', 'box1'].join()) return { ok: true };
        if (order[1] !== 'atom') return { ok: false, msg: 'Press Join Atoms, then compare the height of the atom\'s box with the heights of the two new boxes.' };
        return { ok: false, msg: 'Read the numbers on the two new boxes against their heights on the ladder.' };
      },
      reward: {
        log: 'Two atomic boxes make two molecular ones.',
        title: 'Bonding and Antibonding Orbitals',
        body: 'When two atoms\' orbitals combine they make two molecular orbitals: a bonding orbital below the originals and an antibonding orbital above them. Electrons in the lower box hold the atoms together, and electrons in the upper box push them apart.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Two Electrons',
    briefing: {
      speaker: SPEAKER,
      body: 'Drag from the jar of electrons to a box, or tap the jar and then the box. Dragging from a box back to the jar lifts one out.'
    },
    prompt: 'Place H₂\'s two electrons so the molecule has as little energy as it can.',
    widget: { type: 'table', label: 'The bench' },
    table: rackTable('H2'),
    hints: [
      'Drag an electron from the jar into a box, or tap the jar and then the box.',
      'Compare the two boxes by how high they sit on the ladder.',
      'Each electron goes in the lowest box that has room, and a box takes one arrow of each direction.'
    ],
    check(state) {
      const t = state.table;
      const r = rackRead(t);
      if (r.total === 0) return { ok: false, notYet: true, msg: 'Place the two electrons on the rack.' };
      if (r.total !== DIATOMICS.H2.e) return { ok: false, msg: COUNT_MSG };
      if (matchesGround(t, 'a', DIATOMICS.H2.e)) return { ok: true };
      return { ok: false, msg: HIGH_MSG };
    },
    reward: {
      log: 'Both go in the lower box.',
      title: 'Electrons Fill From the Bottom',
      body: 'Both electrons go in the bonding orbital, paired. The molecule is lower in energy than the separate atoms, so the atoms stay together.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Four Electrons',
    prompt: 'Place He₂\'s four electrons, then set the marker to the bond order the boxes give.',
    widget: { type: 'table', label: 'The bench' },
    table: rackTable('He2', { counts: true, extra: [marker('order', 'Bond order', { x: 134, y: 34 }, { max: 4, value: 1 })] }),
    hints: [
      'Pour the four electrons into the boxes from the bottom of the ladder up, then turn the marker.',
      'Compare the electrons in the lower box with those in the upper one.',
      'Half the difference between the electrons in the lower boxes and those in the upper ones is the bond order.'
    ],
    check(state) {
      const t = state.table;
      const r = rackRead(t);
      if (r.total === 0) return { ok: false, notYet: true, msg: 'Place the four electrons on the rack.' };
      if (r.total !== DIATOMICS.He2.e) return { ok: false, msg: COUNT_MSG };
      if (!matchesGround(t, 'a', DIATOMICS.He2.e)) return { ok: false, msg: HIGH_MSG };
      if (t.fixtures.order.dials.n.value === r.bondOrder) return { ok: true };
      return { ok: false, msg: 'Read the counts for the lower and the upper box, then work out the marker from them.' };
    },
    reward: {
      log: 'Nothing gained, so nothing holds.',
      title: 'Bond Order From the Boxes',
      body: 'Half the difference between the electrons in bonding orbitals and those in antibonding orbitals is the bond order. He₂ has two of each, so its bond order is zero and the molecule does not form.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Ten Electrons',
    prompt: 'Fill N₂\'s boxes with its ten electrons and set the marker to the bond order.',
    widget: { type: 'table', label: 'The bench' },
    table: rackTable('N2', { counts: true, extra: [marker('order', 'Bond order', { x: 134, y: 34 }, { max: 4, value: 1 })] }),
    hints: [
      'Pour the ten electrons in from the bottom of the ladder up, one to each box in a row before pairing.',
      'Compare the electrons in the lower boxes with those in the upper ones.',
      'Half the difference between the two counts is the bond order.'
    ],
    check(state) {
      const t = state.table;
      const r = rackRead(t);
      if (r.total === 0) return { ok: false, notYet: true, msg: 'Place the ten electrons on the rack.' };
      if (r.total !== DIATOMICS.N2.e) return { ok: false, msg: COUNT_MSG };
      if (!matchesGround(t, 'a', DIATOMICS.N2.e)) return { ok: false, msg: HIGH_MSG };
      if (t.fixtures.order.dials.n.value === r.bondOrder) return { ok: true };
      return { ok: false, msg: 'Read the counts for the lower and the upper boxes before halving the difference.' };
    },
    reward: {
      log: 'Eight below, two above.',
      title: 'A Triple Bond in Boxes',
      body: 'Nitrogen has eight electrons in bonding boxes and two in antibonding ones, so its bond order is three: the triple bond a Lewis structure draws.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Oxygen and the Magnet',
    briefing: {
      speaker: SPEAKER,
      body: 'The magnet holds the real molecule to its field, whatever the rack shows. Press "Test Sample" to see how hard it pulls.'
    },
    prompt: 'Arrange O₂\'s twelve electrons so the rack pulls on the magnet as hard as the real sample does.',
    widget: { type: 'table', label: 'The bench' },
    table: rackTable('O2', { counts: true, extra: [magnet('magnet', { x: 134, y: 36 }, { mol: 'O2' })] }),
    hints: [
      'Pour the twelve electrons in from the bottom of the ladder up, and test the sample with the magnet.',
      'Compare the boxes in the top row of the electrons you placed: how many hold one arrow, and how many two.',
      'Electrons standing alone in a box are pulled by a magnet, and pairs are not.'
    ],
    check(state) {
      const t = state.table;
      const r = rackRead(t);
      if (r.total === 0) return { ok: false, notYet: true, msg: 'Place the twelve electrons on the rack.' };
      if (r.total !== DIATOMICS.O2.e) return { ok: false, msg: COUNT_MSG };
      if (r.unpaired !== magnetRead(t, 'magnet').real) return { ok: false, msg: 'Test the sample with the magnet and compare it with how the electrons sit on your rack.' };
      if (matchesGround(t, 'a', DIATOMICS.O2.e)) return { ok: true };
      return { ok: false, msg: HIGH_MSG };
    },
    reward: {
      log: 'Two electrons stand alone.',
      title: 'Oxygen Is Paramagnetic',
      body: 'The last two electrons of O₂ go one each into two separate antibonding boxes, so oxygen is paramagnetic — pulled by a magnet. A Lewis structure with every electron paired could not have said so.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Three Oxygens',
    prompt: 'Rank the three oxygen species by bond length, shortest first.',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: [
        moCard('a', 'O₂', { x: 30, y: 32 }, { mol: 'O2', counts: true }),
        moCard('b', 'O₂⁺', { x: 75, y: 32 }, { mol: 'O2p', counts: true }),
        moCard('c', 'O₂⁻', { x: 120, y: 32 }, { mol: 'O2m', counts: true })
      ],
      zones: { rail: rail(['a', 'b', 'c'], ['a', 'c', 'b'], 'Shortest bond', 'Longest bond', { w: 132, h: 26 }, { x: 75, y: 32 }) }
    }),
    hints: [
      'Drag each card along the rail to put the three in order.',
      'Compare the electrons in the lower and the upper boxes on each card.',
      'The bond with the highest bond order is the shortest.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three species on the rail in order.' };
      const want = order.slice().sort((x, y) => DIATOMICS[t.pieces[x].props.mol].length - DIATOMICS[t.pieces[y].props.mol].length);
      if (order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Work out the bond order of each card from its counts, then ask which order pulls the atoms closest.' };
    },
    reward: {
      log: 'A higher order is a shorter bond.',
      title: 'Higher Order, Shorter Bond',
      body: 'Taking an electron out of an antibonding box raises the bond order and shortens the bond, and adding one lowers it and lengthens the bond. O₂⁺ has the highest order of the three and O₂⁻ the lowest.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'A Weak Link',
    prompt: 'Predict how the fluorine-fluorine bond compares in strength with the oxygen-oxygen bond.',
    widget: { type: 'table', label: 'The bench' },
    table: rackTable('F2', {
      counts: true,
      jar: { x: 15, y: 14.6 },
      pieces: [moCard('ref', 'O₂', { x: 134, y: 36 }, { mol: 'O2', counts: true }, { fixed: true })],
      extra: [bondTester('tester', { x: 134, y: 14 }, ['O2', 'F2'])],
      prediction: {
        slot: { id: 'predict', label: 'F₂ bond', at: SLOT_AT, size: { w: 26, h: 10 } },
        tokens: [tokenAt('stronger', 'Stronger', 31), tokenAt('weaker', 'Weaker', 44), tokenAt('same', 'The same', 57)]
      }
    }),
    hints: [
      'Pour the fourteen electrons into F₂\'s boxes, then press "Test Bond" to read both molecules.',
      'Compare the electrons in the upper boxes on the F₂ rack with those on the O₂ card.',
      'Each electron in an upper box cancels the hold of one in a lower box, so count the lower boxes against the upper ones for each molecule.'
    ],
    check(state) {
      const t = state.table;
      const token = t.prediction.token;
      if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for the F₂ bond first.' };
      const real = DIATOMICS.F2.energy < DIATOMICS.O2.energy ? 'weaker' : DIATOMICS.F2.energy > DIATOMICS.O2.energy ? 'stronger' : 'same';
      if (token === real) return { ok: true };
      if (bondTestRead(t, 'tester').tested) return { ok: false, msg: 'The tester\'s figures for the two molecules do not match your prediction.' };
      if (rackRead(t).total === 0) return { ok: false, msg: 'Fill F₂\'s boxes and run the tester, then compare the two molecules.' };
      return { ok: false, msg: 'Run the tester and compare the F₂ rack with the O₂ card.' };
    },
    reward: {
      log: 'Every extra antibonding electron costs a bond.',
      title: 'Weaker With Each Antibonding Electron',
      body: 'F₂ fills both antibonding π boxes completely, so its bond order is only one. Each antibonding electron cancels the hold of a bonding one, and the weak F–F bond is the result.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Other Order',
    prompt: 'Predict whether diboron is pulled toward the magnet.',
    widget: { type: 'table', label: 'The bench' },
    table: rackTable('B2', {
      counts: true,
      jar: { x: 15, y: 14.6 },
      extra: [magnet('magnet', { x: 134, y: 16 }, { mol: 'B2', size: { w: 28, h: 28 } })],
      prediction: {
        slot: { id: 'predict', label: 'B₂', at: SLOT_AT, size: { w: 26, h: 10 } },
        tokens: [tokenAt('pulled', 'Pulled in', 31), tokenAt('pushed', 'Pushed out', 44)]
      }
    }),
    hints: [
      'Pour the six electrons in from the bottom of the ladder up, and test the sample with the magnet.',
      'Compare the order of the boxes on this rack with the order on the oxygen rack.',
      'Fill the boxes in the order this rack shows, and see where the last two electrons land.'
    ],
    check(state) {
      const t = state.table;
      const token = t.prediction.token;
      if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for diboron first.' };
      const real = DIATOMICS.B2.unpaired > 0 ? 'pulled' : 'pushed';
      if (token === real) return { ok: true };
      if (magnetRead(t, 'magnet').tested) return { ok: false, msg: 'The sample on the magnet did not do what you predicted.' };
      return { ok: false, msg: 'Fill the rack in the order it shows and compare it with what the magnet says.' };
    },
    reward: {
      log: 'The boxes swap order below oxygen.',
      title: 'The Order Switch',
      body: 'In molecules up to nitrogen the side-to-side π boxes sit below the end-on one, because the 2s and 2p boxes mix. B₂\'s last two electrons then go into separate π boxes, so B₂ is paramagnetic — pulled by a magnet. This is beyond the exam.'
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
      body: 'Atomic boxes combine into molecular ones, half of them bonding and half antibonding, and electrons fill them from the bottom up. Half the difference between the bonding electrons and the antibonding ones is the bond order, and it sets length, strength and whether the molecule exists at all.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Where a Lewis structure fails, as with oxygen\'s magnetism, the boxes still work. That is why chemists keep both models and know which question each one answers.'
    },
    {
      heading: 'Next',
      body: 'Ligar\'s last guard stands at the end of the cut. It is made of everything you have measured here.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the bond order of N₂?',
    options: [
      { id: 'a', label: '3' },
      { id: 'b', label: '2' },
      { id: 'c', label: '1' },
      { id: 'd', label: '2.5' }
    ],
    answer: 'a',
    explanation: 'N₂ has 8 electrons in bonding orbitals and 2 in antibonding orbitals: (8 − 2)/2 = 3.'
  },
  {
    question: 'Why does He₂ not exist as a stable molecule?',
    options: [
      { id: 'a', label: 'Its bonding and antibonding orbitals are both filled, so its bond order is zero' },
      { id: 'b', label: 'Helium atoms repel each other electrically' },
      { id: 'c', label: 'Helium has no electrons' },
      { id: 'd', label: 'Helium atoms are too big' }
    ],
    answer: 'a',
    explanation: 'Two electrons in the bonding orbital and two in the antibonding orbital cancel: (2 − 2)/2 = 0.'
  },
  {
    question: 'Which statement about O₂ does a molecular orbital diagram explain, but a Lewis structure does not?',
    options: [
      { id: 'a', label: 'It is attracted to a magnet because it has two unpaired electrons' },
      { id: 'b', label: 'It has a double bond' },
      { id: 'c', label: 'It is a gas at room temperature' },
      { id: 'd', label: 'It has 12 valence electrons' }
    ],
    answer: 'a',
    explanation: 'The last two electrons go one each into two degenerate π* orbitals, so O₂ is paramagnetic.'
  },
  {
    question: 'Put O₂⁺, O₂ and O₂⁻ in order of increasing bond length.',
    options: [
      { id: 'a', label: 'O₂⁺ < O₂ < O₂⁻' },
      { id: 'b', label: 'O₂⁻ < O₂ < O₂⁺' },
      { id: 'c', label: 'O₂ < O₂⁺ < O₂⁻' },
      { id: 'd', label: 'All the same' }
    ],
    answer: 'a',
    explanation: 'Bond orders are 2.5, 2 and 1.5. The higher the bond order, the shorter the bond.'
  },
  {
    question: '(Beyond the exam.) Why is B₂ paramagnetic?',
    options: [
      { id: 'a', label: 'Its last two electrons occupy separate π orbitals, since π lies below σ in B₂' },
      { id: 'b', label: 'It has an odd number of electrons' },
      { id: 'c', label: 'Its bond order is zero' },
      { id: 'd', label: 'It has a triple bond' }
    ],
    answer: 'a',
    explanation: 'For B₂ the two π2p orbitals are filled before σ2p, so the last two electrons enter them singly.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Electrons are poured from the jar into boxes (`fillSteps` pours a ground state,
   one box at a time), cards are put on the rail, a prediction is a token, a marker is a dial. Nothing here says what a rack reads.
   ------------------------------------------------------------------ */

const pour = (to, n = 1, from = 'supply') => ({ pour: { from, to: `a.${to}`, what: 'electron', amount: n } });
const at = (piece, index) => ({ place: { piece, to: `rail:${index}` } });
const bondOrder = value => ({ setDial: { fixture: 'order', dial: 'n', value } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ run: 'rack-a' }, at('box2', 0), at('atom', 1), at('box1', 2)],
  fillSteps('a', DIATOMICS.H2.order, DIATOMICS.H2.e),
  [...fillSteps('a', DIATOMICS.He2.order, DIATOMICS.He2.e), bondOrder(0)],
  [...fillSteps('a', DIATOMICS.N2.order, DIATOMICS.N2.e), bondOrder(3)],
  [...fillSteps('a', DIATOMICS.O2.order, DIATOMICS.O2.e), { run: 'magnet' }],
  [at('b', 0), at('a', 1), at('c', 2)],
  [...fillSteps('a', DIATOMICS.F2.order, DIATOMICS.F2.e), { run: 'tester' }, { predict: 'weaker' }],
  [...fillSteps('a', DIATOMICS.B2.order, DIATOMICS.B2.e), { predict: 'pulled' }, { run: 'magnet' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [{ run: 'rack-a' }, at('atom', 0), at('box1', 1), at('box2', 2)],
  [pour('u1s:0', 2)],
  [...fillSteps('a', DIATOMICS.He2.order, DIATOMICS.He2.e), bondOrder(2)],
  [...fillSteps('a', DIATOMICS.N2.order, DIATOMICS.N2.e), bondOrder(2)],
  [pour('g2s:0', 2), pour('u2s:0', 2), pour('g2p:0', 2), pour('p2p:0', 2), pour('p2p:1', 2), pour('q2p:0', 2), { run: 'magnet' }],
  [at('a', 0), at('b', 1), at('c', 2)],
  [{ run: 'tester' }, { predict: 'stronger' }],
  [{ run: 'magnet' }, { predict: 'pushed' }]
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
export { bondOrderOf, fillMO, readMO, supplyLeft };
