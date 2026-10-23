/**
 * q3-distance.js — Ligar, bench three: BOND ENERGY.
 *
 * The third bench on the world and its third TABLETOP (plan `bench-tabletop.md`, phase T3a). Benches one and two found out WHETHER
 * two atoms hold and what that builds. This one asks how far apart they sit and how much holds them: the player takes a pair in the
 * hand and pulls it apart, and the plot keeps a trace of the energy at every separation the hand passes through, so the curve is
 * something the player draws and its bottom is a place they find. (The plot is a graph, so it stays flat: a graph is drawn square-on.
 * The atoms on the track are drawn to scale beside it, and the reward of the click stage holds a solid model.)
 *
 * THE CLICK (2026-10-23 rollout). Students expect that more shared pairs means more crowding, so the atoms must sit FURTHER apart. The
 * quest asks for that prediction (the wrong idea is a card) once the player can read a well, then has them pull a single, a double and a
 * triple carbon pair and rail them by where each bottoms out: the more pairs, the shorter the bond.
 *
 *   1  pull a hydrogen pair apart and let go at the bottom of its well     -> potential energy curve, bond length
 *   2  set a marker to the depth of a well                                 -> bond energy
 *   3  PREDICT: do more shared pairs sit further apart or closer?          (no instrument; the wrong idea is a card)
 *   4  pull three carbon pairs and rail them from the longest bond         -> bond order (and deeper, so stronger)
 *   5  melt three salts and rail them by the heat each takes               -> charge and size set the hold
 *   -- debrief: what sets a bond's length and its strength.
 *
 * Cut as repeats (2026-10-23): "squeezed" (the trace of stage 1 already climbs on the squeezed side, and the card says so), "two sizes"
 * (a prediction on bond length by atom size: a second prediction on the same plot), "deeper too" (the wells of stage 4 are the evidence
 * and its card says it), and the two-salt melt (stage 5 melts three).
 *
 * THE TABLE (`table/`, `kits/bonds.js`). A pair's separation is the position of the hand on a track (a dial), and `bonddata.js`
 * `planCurve` / `morse` say what the energy is there: the bottom of a well is where the pair was left, graded where it is left, and the
 * curve is drawn only over the stretch the hand has been through. No stage tells the bench where a bottom is. EVERY FIGURE IS A MEASURED
 * ONE: the pair cards and the salts draw real bond lengths, real bond energies, real ion radii and real melting points.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { PAIRS, LATTICES, planCurve, byLatticeEnergy, coulombIndex, IONS } from '../../engine/bonddata.js';
import { bondsTable, hotplate, pairTag, saltPiece, wellRead, piecesIn } from '../../table/kits/bonds.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 5 };

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

const tagAt = (id, label, pair, x) => pairTag(id, label, pair, { x, y: 61 });

/** Is the hand within `tol` pm of a pair's bottom? */
const nearBottom = (row, tol) => Math.abs(row.gap - row.r0) <= tol;
const tolFor = pair => Math.max(6, Math.round(PAIRS[pair].r0 * 0.1));
const moved = row => row.lo !== row.hi;

const RAIL = (items, start, first, last) => ({ id: 'rail', at: { x: 49, y: 64 }, size: { w: 90, h: 12 }, first, last, items, start });

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q3-distance';
const GUESSES = [
  ['further', 'the triple bond sits further apart', ['Further apart', 'More pairs', 'crowd the gap']],
  ['same', 'the triple bond sits the same distance apart', ['The same distance', 'Both are carbon', 'atoms']],
  ['closer', 'the triple bond sits closer together', ['Closer together', 'More pairs', 'pull harder']]
];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Bottom',
    prompt: 'Pull the hydrogen pair apart and let go where its energy is lowest.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      fixtures: [wells('w', [row('a', 'H-H', 'Pair A', 200)], { at: { x: 67, y: 34 }, size: { w: 130, h: 62 }, top: 14, margin: 10, discs: true, grab: 7, discK: 0.085, plot: { y0: 26, foot: 9 } })]
    }),
    hints: [
      'Use the hand on the track.',
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
      body: 'The trace is a potential energy curve: the energy of the pair at every separation. Its lowest point is where the atoms are happiest, and that separation is the bond length; squeezed closer, the two nuclei push each other away and the energy climbs steeply.',
      model: { type: 'molecule', name: 'hydrogen', caption: 'A hydrogen pair at the bottom of its well: the bond length is the gap between the two centres.' }
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
      'Use the hand on the track and the depth marker.',
      'Measure from the zero line down to the lowest point the trace has reached.',
      'Set the marker so its line lies along the bottom of the trace, and the number beside it is the energy.'
    ],
    check(state) {
      const r = wellRead(state.table, 'w');
      if (!r.marker) return { ok: false, notYet: true, msg: 'Set the depth marker against the trace.' };
      const de = r.rows[0].de;
      if (Math.abs(r.marker - de) <= 15) return { ok: true };
      return r.marker < de
        ? { ok: false, msg: 'The marker\'s line sits above the bottom of the trace.' }
        : { ok: false, msg: 'The marker\'s line sits below the bottom of the trace.' };
    },
    reward: {
      log: 'The depth of the well.',
      title: 'Bond Energy',
      body: 'The depth of the well, measured from the zero line down to its bottom, is the energy it takes to pull the atoms completely apart. That is the bond energy.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  predictStage({
    key: QUEST_KEY,
    title: 'More Pairs, More Room?',
    prompt: 'How far apart do two carbon atoms sit when three pairs hold them, compared with one pair?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Picture the shared pairs sitting in the gap between the atoms, and what they do to the atoms.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    reward: {
      title: 'A Guess Comes First',
      body: 'Your guess is locked in, and the next bench tests it. Pull the wells for a single, a double and a triple bond.'
    }
  }),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Three Wells',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'order the three carbon-carbon pairs from the longest bond to the shortest.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [tagAt('a', 'Pair A', 'C#C', 20), tagAt('b', 'Pair B', 'C-C', 50), tagAt('c', 'Pair C', 'C=C', 80)],
      zones: { rail: RAIL(['a', 'b', 'c'], ['c', 'a', 'b'], 'Longest bond', 'Shortest bond') },
      fixtures: [wells('w', [row('a', 'C#C', 'Pair A', 180), row('b', 'C-C', 'Pair B', 180), row('c', 'C=C', 'Pair C', 180)], {
        at: { x: 66, y: 28 }, size: { w: 126, h: 50 }, dmax: 200, top: 9, pitch: 7, margin: 6, plot: { y0: 29, foot: 8 }
      })]
    }),
    hints: [
      'Use the three hands and the rail.',
      'Compare where each trace bottoms out along the separation axis, and how deep each one goes.',
      'Pull each pair until its trace has a bottom, then put first the card whose lowest point sits at the widest separation.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three pairs on the rail in order.' };
      const want = order.slice().sort((x, y) => PAIRS[t.pieces[y].props.pair].r0 - PAIRS[t.pieces[x].props.pair].r0);
      if (order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Two neighbouring pairs on the rail are in the wrong order.' };
    },
    get reward() {
      return {
        log: 'The more pairs shared, the shorter the bond.',
        title: 'Bond Order',
        body: `${verdictLine(QUEST_KEY, 'closer')}The number of shared pairs between two atoms is the bond order, and each extra pair draws the atoms closer and digs the well deeper. A shorter bond is a stronger bond.`,
        model: { type: 'molecule', name: 'nitrogen', caption: 'Nitrogen: three shared pairs (a triple bond) hold its atoms close.' }
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Salt Strength',
    prompt: 'Rank the three salts by how much heat each takes to melt, the most first.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        saltPiece('a', 'NaCl', 'NaCl', { x: 24, y: 56 }),
        saltPiece('b', 'KCl', 'KCl', { x: 56, y: 56 }),
        saltPiece('c', 'MgO', 'MgO', { x: 88, y: 56 })
      ],
      zones: { rail: { id: 'rail', at: { x: 56, y: 56 }, size: { w: 104, h: 16 }, first: 'Takes the most heat', last: 'Takes the least', items: ['a', 'b', 'c'], start: ['b', 'a', 'c'] } },
      fixtures: [hotplate('hp', { x: 49, y: 19 }, { w: 92, h: 32, max: 3000 })]
    }),
    hints: [
      'Use the hotplate and its heat dial.',
      'Compare the setting at which each salt melts, and the charges and ion sizes printed on its card.',
      'Slide each salt onto the plate and turn the dial up until it gives way, then rank them by the setting.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three salts on the rail in order.' };
      const want = order.slice().sort((x, y) => LATTICES[t.pieces[y].props.lattice].melts - LATTICES[t.pieces[x].props.lattice].melts);
      if (order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Two neighbouring salts on the rail are in the wrong order.' };
    },
    reward: {
      log: 'Magnesium oxide took the most heat. Potassium chloride took the least.',
      title: 'Charge and Size Set the Hold',
      body: 'A salt takes more heat to melt when its ions carry bigger charges and sit closer together, because that holds the lattice harder. Magnesium oxide, with charges of 2 on small ions, outlasted both of the salts with charges of 1.',
      model: { type: 'crystal', cation: 'Mg', anion: 'O', n: 3, caption: 'Magnesium oxide: charges of 2+ and 2− on small ions, held hardest of the three.' },
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the hand along its track.']
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
      body: 'Two atoms settle where the pull between them and the push between their nuclei balance, and that sets how long the bond is and how much it costs to break. More shared pairs sit closer and hold harder, and a salt is held by charge over distance.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every bond length and bond energy in a table is a point on one of these curves. The breakers can now be loaded for the bond they have to beat, instead of by guesswork.'
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
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [hand('a', 90), hand('a', 40), hand('a', 74)],
  [hand('a', 200), hand('a', 127), hand('a', 300), hand('depth', 430)],
  [guess('closer')],
  [hand('a', 120), hand('b', 154), hand('c', 134), to('b', 0), to('c', 1), to('a', 2)],
  [onPlate('a', 0), onPlate('b', 1), onPlate('c', 2), heat(775), heat(825), heat(2875), to('c', 0), to('a', 1), to('b', 2)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [hand('a', 120)],
  [hand('a', 127), hand('depth', 200)],
  [],
  [to('a', 0), to('b', 1), to('c', 2)],
  [to('b', 0), to('a', 1), to('c', 2)]
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
