/**
 * q3-distance.js — Ligar, bench three: BOND ENERGY.
 *
 * The third bench on the world and its third TABLETOP (plan `bench-tabletop.md`, phase T3a). Benches one and two
 * found out WHETHER two atoms hold and what that builds. This one asks how far apart they sit and how much holds
 * them: the player takes a pair in the hand and pulls it apart, and the plot keeps a trace of the energy at every
 * separation the hand passes through, so the curve is something the player draws and its bottom is a place they find.
 *
 *   1  pull a pair apart and let go at the bottom of its well      -> potential energy curve, bond length
 *   2  set a marker to the depth of a well                         -> bond energy
 *   3  squeeze a pair in until its energy is back at zero          -> (the nuclei repel)
 *   4  predict where a third pair settles, then release it         -> (more shells, bigger atoms)
 *   5  rail three carbon-carbon pairs from the longest bond        -> bond order
 *   6  rail the same pairs from the hardest to pull apart          -> (shorter is stronger)
 *   7  rail three salts from the most strongly held                -> lattice energy
 *   8  hotplate two salts and slot the one that takes more heat    -> (a tighter lattice melts higher)
 *
 * THE TABLE (`table/`, `kits/bonds.js`). A pair's separation is the position of the hand on a track (a dial), and
 * `bonddata.js` `planCurve` / `morse` say what the energy is there: the bottom of a well is where the pair was
 * left, graded where it is left, and the curve is drawn only over the stretch the hand has been through. No
 * stage tells the bench where a bottom is: a pair let go (stage 4's Run key) settles at `PAIRS[...].r0`, which is
 * the same table the grading reads. EVERY FIGURE IS A MEASURED ONE: the pair cards and the salts draw real bond
 * lengths, real bond energies and real ion radii and charges; a salt reads no energy (charge and size are the evidence,
 * and `verify:learn` checks the order against the real lattice energies).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { PAIRS, LATTICES, planCurve, byLatticeEnergy, coulombIndex, IONS } from '../../engine/bonddata.js';
import { bondsTable, hotplate, pairTag, saltPiece, wellRead, innerZero, piecesIn } from '../../table/kits/bonds.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\blattice energ(?:y|ies)\b/i, introducedAt: 7 },
  { term: /\bbond orders?\b/i, introducedAt: 5 },
  { term: /\bbond energ(?:y|ies)\b/i, introducedAt: 2 },
  { term: /\bbond lengths?\b/i, introducedAt: 1 },
  { term: /\bpotential energy curves?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q1-joins', 'unit03/q2-lattice', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

/** The legend lines. Every key says what it does ("Release Pair C"), and the pieces are dragged. Kept so the quest contract holds. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   One fixture, the wells, holds a plot of energy against separation and a track for each pair's hand. A pair stage is
   that plot over the table, and a stage that files things has its rail under it (150 x 72 units).
   ------------------------------------------------------------------ */

/** A well fixture's declaration: `rows` are `{id, pair, label, start}`, one hand each; `box` its place and size. */
function wells(id, rows, { at, size, dmax = 300, top = 9, pitch = 7, margin = 4, discs = false, marker = null, release = null, plot, runLabel, min = 0, grab = 0, icon }) {
  const dials = {};
  for (const r of rows) dials[r.id] = { min, max: dmax, step: 2, value: r.start, label: r.label };
  if (marker) dials[marker.id] = { min: 0, max: marker.max, step: marker.step, value: 0, label: marker.label };
  return {
    id, kind: 'wells', label: 'Pull the pair', at, size, ...(runLabel ? { runLabel } : { noRun: true }), dials,
    props: {
      rows, top, rowPitch: pitch, margin, discs, plot, ...(marker ? { marker: marker.id } : {}), ...(release ? { release } : {}),
      ...(grab ? { grab: { [rows[0].id]: grab } } : {}), ...(icon ? { icon } : {})
    }
  };
}
const row = (id, pair, label, start) => ({ id, pair, label, start });

const tokenAt = (id, label, x) => ({ id, label, at: { x, y: 65 }, r: 6.5 });
const tagAt = (id, label, pair, x) => pairTag(id, label, pair, { x, y: 61 });

/** Is the hand within `tol` pm of a pair's bottom? */
const nearBottom = (row, tol) => Math.abs(row.gap - row.r0) <= tol;
const tolFor = pair => Math.max(6, Math.round(PAIRS[pair].r0 * 0.1));
const moved = row => row.lo !== row.hi;

const RAIL = (items, start, first, last) => ({ id: 'rail', at: { x: 49, y: 63 }, size: { w: 90, h: 12 }, first, last, items, start });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Bottom',
    briefing: {
      speaker: SPEAKER,
      body: 'The two atoms are held by a hand on the track: drag it to pull them apart or push them together, and the plot keeps every point the hand passes through. What the plot draws is energy against separation.'
    },
    prompt: 'Pull the hydrogen pair apart and let go where its energy is lowest.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      fixtures: [wells('w', [row('a', 'H-H', 'Pair A', 200)], { at: { x: 67, y: 34 }, size: { w: 130, h: 62 }, top: 14, margin: 10, discs: true, grab: 7, discK: 0.085, plot: { y0: 26, foot: 9 } })]
    }),
    hints: [
      'Drag the hand along the track through the whole of its range and watch the plot fill in.',
      'Compare the energy on either side of the lowest point the trace has drawn.',
      'Let go at the separation under the point where the energy is most negative.'
    ],
    check(state) {
      const r = wellRead(state.table, 'w').rows[0];
      if (!moved(r)) return { ok: false, notYet: true, msg: 'Drag the hand along the track to draw the trace.' };
      if (nearBottom(r, tolFor('H-H'))) return { ok: true };
      return r.gap < r.r0
        ? { ok: false, msg: 'Squeezed in that far the trace has already started to climb again.' }
        : { ok: false, msg: 'Wound out that far the trace is higher than it is closer in.' };
    },
    reward: {
      log: 'The lowest point of the trace.',
      title: 'Potential Energy Curve',
      body: 'The trace is a potential energy curve: the energy of the pair at every separation. Its lowest point is where the atoms are happiest, and that separation is the bond length.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Pulling Apart',
    prompt: 'Set the depth marker to the energy it takes to pull the hydrogen-chlorine pair completely apart.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      fixtures: [wells('w', [row('a', 'H-Cl', 'Pair A', 250)], {
        at: { x: 67, y: 35 }, size: { w: 130, h: 64 }, dmax: 330, top: 12, pitch: 9, margin: 10, discs: true, grab: 6,
        marker: { id: 'depth', label: 'Depth', max: 1000, step: 10 }, plot: { y0: 29, foot: 9 }
      })]
    }),
    hints: [
      'Drag the hand along the track until the trace has a bottom, then turn the depth marker.',
      'Measure from the zero line down to the lowest point the trace has reached.',
      'Set the marker so its line lies along the bottom of the trace, and the number beside it is the energy.'
    ],
    check(state) {
      const r = wellRead(state.table, 'w');
      if (!r.marker) return { ok: false, notYet: true, msg: 'Set the depth marker against the trace.' };
      const de = r.rows[0].de;
      if (Math.abs(r.marker - de) <= 15) return { ok: true };
      return r.marker < de
        ? { ok: false, msg: 'The well goes deeper than that: measure all the way from the zero line to its bottom.' }
        : { ok: false, msg: 'The well is not as deep as that. Measure from the zero line to its bottom.' };
    },
    reward: {
      log: 'The depth of the well.',
      title: 'Bond Energy',
      body: 'The depth of the well, measured from the zero line down to its bottom, is the energy it takes to pull the atoms completely apart. That is the bond energy.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Squeezed',
    prompt: 'Squeeze the hydrogen pair in until its energy comes back up to zero.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      fixtures: [wells('w', [row('a', 'H-H', 'Pair A', 120)], { at: { x: 67, y: 34 }, size: { w: 130, h: 62 }, top: 14, margin: 10, discs: true, grab: 7, discK: 0.085, min: 20, plot: { y0: 26, foot: 9 } })]
    }),
    hints: [
      'Drag the hand toward the smallest separations and watch where the new points land.',
      'Compare the energy at the lowest point with the energy at the closest settings.',
      'Keep squeezing until the reading is back to the level of the dashed zero line.'
    ],
    check(state) {
      const r = wellRead(state.table, 'w').rows[0];
      if (!moved(r)) return { ok: false, notYet: true, msg: 'Drag the hand along the track.' };
      const at = innerZero('H-H');
      if (Math.abs(r.gap - at) <= 6) return { ok: true };
      return r.gap > at
        ? { ok: false, msg: 'The energy there is still below the zero line: squeeze the pair closer.' }
        : { ok: false, msg: 'Squeezed past that, the energy is already well above the zero line.' };
    },
    reward: {
      log: 'Closer in, the trace climbs.',
      title: 'Nuclei Repel',
      body: 'Pushed closer than the bond length, the positive nuclei — the centres — repel each other and the energy climbs steeply. That repulsion is what holds the bottom of the well where it is.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Two Sizes',
    prompt: 'Predict where the fluorine pair settles against the other two, then release it.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      fixtures: [wells('w', [row('a', 'H-H', 'Pair A', 200), row('b', 'Cl-Cl', 'Pair B', 260), row('c', 'F-F', 'Pair C', 220)], {
        at: { x: 62, y: 29 }, size: { w: 118, h: 52 }, dmax: 330, top: 9, pitch: 6.5, margin: 6, plot: { y0: 27, foot: 8 }, release: 'c', runLabel: 'Release Pair C', icon: 0.036
      })],
      prediction: {
        slot: { id: 'predict', label: 'Pair C', at: { x: 135, y: 30 }, size: { w: 26, h: 12 } },
        tokens: [tokenAt('closer', 'Inside', 24), tokenAt('between', 'Between', 72), tokenAt('further', 'Outside', 122)]
      }
    }),
    hints: [
      'Pull Pair A and Pair B along their tracks until each trace shows its bottom.',
      'Compare the size of each pair\'s atoms in the little pictures with where its bottom sits.',
      'Judge where a pair whose atoms are that size would settle, set the prediction, and release Pair C to see.'
    ],
    check(state) {
      const t = state.table;
      const token = t.prediction.token;
      const read = wellRead(t, 'w');
      const [a, b] = [read.row('a').r0, read.row('b').r0];
      const c = read.row('c');
      const real = c.r0 < a ? 'closer' : c.r0 > b ? 'further' : 'between';
      if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for Pair C first.' };
      if (token === real) return { ok: true };
      if (Math.abs(c.gap - c.r0) <= 1) return { ok: false, msg: `Pair C came to rest at ${c.gap} pm, where Pair A rests at ${a} pm and Pair B at ${b} pm. Compare the sizes of the atoms again.` };
      return { ok: false, msg: 'Release Pair C to see where it comes to rest, then compare it with the other two.' };
    },
    reward: {
      log: 'Bigger atoms sit further apart.',
      title: 'Size Sets the Length',
      body: 'More shells make a bigger atom, and bigger atoms cannot get as close before their outer electrons meet. So a bond between larger atoms is longer.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Three Wells',
    prompt: 'Order the three carbon-carbon pairs from the longest bond to the shortest.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [tagAt('a', 'Pair A', 'C#C', 20), tagAt('b', 'Pair B', 'C-C', 50), tagAt('c', 'Pair C', 'C=C', 80)],
      zones: { rail: RAIL(['a', 'b', 'c'], ['c', 'a', 'b'], 'Longest bond', 'Shortest bond') },
      fixtures: [wells('w', [row('a', 'C#C', 'Pair A', 180), row('b', 'C-C', 'Pair B', 180), row('c', 'C=C', 'Pair C', 180)], {
        at: { x: 66, y: 28 }, size: { w: 126, h: 50 }, dmax: 200, top: 9, pitch: 7, margin: 6, plot: { y0: 29, foot: 8 }
      })]
    }),
    hints: [
      'Pull each pair along its track until its trace has a bottom.',
      'Compare where each bottom sits along the separation axis, and what is printed on each card.',
      'Put first the card whose lowest point sits at the widest separation.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three pairs on the rail in order.' };
      const want = order.slice().sort((x, y) => PAIRS[t.pieces[y].props.pair].r0 - PAIRS[t.pieces[x].props.pair].r0);
      if (order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Compare where each trace bottoms out along the separation axis, not how deep it goes.' };
    },
    reward: {
      log: 'The more pairs shared, the shorter the bond.',
      title: 'Bond Order',
      body: 'The number of shared pairs between two atoms is the bond order. Each extra pair draws the atoms closer, so a higher bond order means a shorter bond.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Deeper Too',
    prompt: 'Order the three pairs from the one that takes the most energy to pull apart to the one that takes the least.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [tagAt('a', 'Pair A', 'C-C', 20), tagAt('b', 'Pair B', 'C=C', 50), tagAt('c', 'Pair C', 'C#C', 80)],
      zones: { rail: RAIL(['a', 'b', 'c'], ['b', 'a', 'c'], 'Takes the most', 'Takes the least') },
      fixtures: [wells('w', [row('a', 'C-C', 'Pair A', 180), row('b', 'C=C', 'Pair B', 180), row('c', 'C#C', 'Pair C', 180)], {
        at: { x: 66, y: 28 }, size: { w: 126, h: 50 }, dmax: 200, top: 9, pitch: 7, margin: 6, plot: { y0: 29, foot: 8 }
      })]
    }),
    hints: [
      'Pull each pair along its track until its trace has a bottom.',
      'Compare how far below the zero line each bottom sits, and where along the axis it is.',
      'Put first the card whose lowest point is furthest below the zero line.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three pairs on the rail in order.' };
      const want = order.slice().sort((x, y) => PAIRS[t.pieces[y].props.pair].de - PAIRS[t.pieces[x].props.pair].de);
      if (order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Compare how deep each well goes below the zero line, and then see where along the axis each one sits.' };
    },
    reward: {
      log: 'Shorter bonds are stronger bonds.',
      title: 'Shorter and Stronger',
      body: 'Across a family of bonds, the shorter one is the stronger one. The extra shared pairs both draw the atoms closer and hold them harder.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Salt Strength',
    prompt: 'Rank the three salts by how strongly their ions are held, the most strongly first.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        saltPiece('a', 'NaCl', 'NaCl', { x: 40, y: 36 }),
        saltPiece('b', 'KCl', 'KCl', { x: 75, y: 36 }),
        saltPiece('c', 'MgO', 'MgO', { x: 110, y: 36 })
      ],
      zones: { rail: { id: 'rail', at: { x: 75, y: 36 }, size: { w: 120, h: 16 }, first: 'Held the hardest', last: 'Held the least', items: ['a', 'b', 'c'], start: ['b', 'a', 'c'] } }
    }),
    hints: [
      'Read the charge marked on each ion and how far apart the ion centres are on each card.',
      'Compare the charges first, then the distances between ion centres.',
      'Order by the size of the charges first, and where the charges tie, put the smaller ions ahead.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three salts on the rail in order.' };
      const want = byLatticeEnergy(order.map(id => t.pieces[id].props.lattice)).map(l => order.find(id => t.pieces[id].props.lattice === l));
      if (order.join() === want.join()) return { ok: true };
      if (order[0] !== want[0]) return { ok: false, msg: 'Compare the charges on the ions of the three cards before anything else.' };
      return { ok: false, msg: 'The two salts with matching charges differ in how big their ions are.' };
    },
    reward: {
      log: 'Charge and size set the hold.',
      title: 'Lattice Energy',
      body: 'The energy needed to separate a lattice into its ions is the lattice energy. It rises with the charges on the ions and falls as the ions get bigger.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Melting Higher',
    prompt: 'Put the salt that takes more heat to melt in the marked place.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [saltPiece('a', 'NaF', 'NaF', { x: 14, y: 48 }), saltPiece('b', 'NaCl', 'NaCl', { x: 42, y: 48 })],
      zones: { slots: [{ id: 'more', label: 'Needs more heat', at: { x: 122, y: 30 }, size: { w: 26, h: 20 } }] },
      fixtures: [hotplate('hp', { x: 49, y: 19 }, { w: 92, h: 32, max: 1200 })]
    }),
    hints: [
      'Slide a salt onto the hotplate and turn the dial up until it gives way.',
      'Compare the setting at which each salt melts, and the distance between its ion centres.',
      'The salt held more tightly takes more heat before its ions can move.'
    ],
    check(state) {
      const t = state.table;
      const held = piecesIn(t, 'slot:more', 'salt')[0];
      if (!held) return { ok: false, notYet: true, msg: 'Put a salt in the marked place.' };
      const hotter = Object.values(t.pieces).filter(p => p.kind === 'salt').sort((x, y) => LATTICES[y.props.lattice].melts - LATTICES[x.props.lattice].melts)[0];
      if (held.id === hotter.id) return { ok: true };
      return { ok: false, msg: 'Compare how far apart the ion centres sit on the two cards, and what that does to the hold.' };
    },
    reward: {
      log: 'A tighter lattice melts higher.',
      title: 'Tighter Lattice, Higher Melting Point',
      body: 'A more tightly held lattice takes more heat before its ions can move, so it melts at a higher temperature. Fluoride ions are smaller than chloride ions, so sodium fluoride holds harder.'
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
      body: 'Two atoms settle where the pull between them and the push between their nuclei balance, and that sets how long the bond is and how much it costs to break. Bigger atoms sit further apart, more shared pairs sit closer and hold harder, and a lattice is held by charge over distance.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every bond length and bond energy in a table is a point on one of these curves. You can now say why one is long, why another is strong, and why one salt melts before another.'
    },
    {
      heading: 'Next',
      body: 'The next bench lays the electrons out on a slate, so you can see where each one of a molecule\'s pairs goes.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'On a potential energy curve for two bonded atoms, what does the lowest point represent?',
    options: [
      { id: 'a', label: 'The bond length, where the energy is a minimum' },
      { id: 'b', label: 'The separation at which the atoms are fully parted' },
      { id: 'c', label: 'The point of greatest repulsion' },
      { id: 'd', label: 'The point where the atoms have no energy' }
    ],
    answer: 'a',
    explanation: 'The atoms are most stable at the separation where attraction and repulsion balance. That separation is the bond length, and the depth of the well there is the bond energy.'
  },
  {
    question: 'Why is the H–H bond shorter than the Cl–Cl bond?',
    options: [
      { id: 'a', label: 'Hydrogen atoms are smaller, so their outer shells meet closer together' },
      { id: 'b', label: 'Hydrogen atoms are lighter' },
      { id: 'c', label: 'The H–H bond is weaker' },
      { id: 'd', label: 'Hydrogen atoms carry a charge' }
    ],
    answer: 'a',
    explanation: 'Atomic size sets how close two atoms can get. A hydrogen atom has one small shell, a chlorine atom three, so the chlorine pair sits further apart.'
  },
  {
    question: 'Which carbon–carbon bond is the shortest and the strongest?',
    options: [
      { id: 'a', label: 'The triple bond' },
      { id: 'b', label: 'The double bond' },
      { id: 'c', label: 'The single bond' },
      { id: 'd', label: 'All three are the same' }
    ],
    answer: 'a',
    explanation: 'Each extra shared pair draws the atoms closer and holds them harder. C≡C is about 120 pm and 839 kJ/mol, against 154 pm and 348 kJ/mol for C–C.'
  },
  {
    question: 'Which has the largest lattice energy?',
    options: [
      { id: 'a', label: 'MgO' },
      { id: 'b', label: 'NaCl' },
      { id: 'c', label: 'KCl' },
      { id: 'd', label: 'NaF' }
    ],
    answer: 'a',
    explanation: 'Lattice energy grows with the product of the ion charges and shrinks with the distance between them. MgO has 2+ and 2− ions that are also small.'
  },
  {
    question: 'Sodium fluoride melts at a higher temperature than sodium chloride. What is the best explanation?',
    options: [
      { id: 'a', label: 'Fluoride ions are smaller, so the ions sit closer and are held more strongly' },
      { id: 'b', label: 'Fluoride has a larger charge than chloride' },
      { id: 'c', label: 'Sodium fluoride is made of molecules' },
      { id: 'd', label: 'Sodium fluoride has covalent bonds' }
    ],
    answer: 'a',
    explanation: 'Both ions carry one unit of charge, but fluoride is smaller, so the centres are closer and the lattice energy is larger. More heat is needed to free the ions.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the
   reducer by direct actions, by drag and by two taps. A hand is moved by setting its dial; the plot keeps what the
   hand passed through, and nothing here says where a bottom is.
   ------------------------------------------------------------------ */

const hand = (row, value, fixture = 'w') => ({ setDial: { fixture, dial: row, value } });
const to = (piece, index) => ({ place: { piece, to: `rail:${index}` } });
const heat = value => ({ setDial: { fixture: 'hp', dial: 'heat', value } });
const onPlate = (id, i) => ({ place: { piece: id, to: `free:${[20, 49, 78][i]},26` } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [hand('a', 90), hand('a', 40), hand('a', 74)],
  [hand('a', 200), hand('a', 127), hand('a', 300), hand('depth', 430)],
  [hand('a', 74), hand('a', 50), hand('a', 40)],
  [hand('a', 74), hand('b', 120), hand('b', 199), { predict: 'between' }, { run: 'w' }],
  [hand('a', 120), hand('b', 154), hand('c', 134), to('b', 0), to('c', 1), to('a', 2)],
  [hand('a', 154), hand('b', 134), hand('c', 120), to('c', 0), to('b', 1), to('a', 2)],
  [to('c', 0), to('a', 1), to('b', 2)],
  [onPlate('a', 0), onPlate('b', 1), heat(825), heat(1000), { place: { piece: 'a', to: 'slot:more' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [hand('a', 120)],
  [hand('a', 127), hand('depth', 200)],
  [hand('a', 74), hand('a', 90)],
  [hand('a', 74), hand('b', 199), { predict: 'closer' }, { run: 'w' }],
  [to('a', 0), to('b', 1), to('c', 2)],
  [to('a', 0), to('b', 1), to('c', 2)],
  [to('b', 0), to('a', 1), to('c', 2)],
  [onPlate('b', 0), { place: { piece: 'b', to: 'slot:more' } }]
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
export const CHECKS = { planCurve, coulombIndex, IONS };
