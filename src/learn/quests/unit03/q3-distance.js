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
 *   1  drag an H-Cl pair along its curve and set a line at the bond energy   -> bond length, bond energy
 *   2  PREDICT: do more shared pairs sit further apart or closer?          (no instrument; the wrong idea is a card)
 *   3  drag three carbon pairs and rail them from the shortest bond        -> bond order (and lower, so stronger)
 *   4  melt three salts and rail them by melting point                     -> lattice energy
 *   5  rail four salts, never heated, by charges and centre distance       -> Coulomb's law
 *   -- debrief: what sets a bond's length and its strength.
 *
 * Teaching pass 2026-11-12: the hydrogen pair left at the lowest point of its curve moved to `q1-joins` stage 2 (why atoms bond);
 * stage 1 asks for the bond energy of one mole, not two; rails run from the smallest value on the left.
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
import { predictStage, testPrompt, verdictLine, wells, wellRow } from './_ligar.js';

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

const row = wellRow;

const tagAt = (id, label, pair, x) => pairTag(id, label, pair, { x, y: 61 });

/** Is the hand within `tol` pm of a pair's bottom? */
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
    title: 'Pulling Apart',
    briefing: {
      speaker: SPEAKER,
      body: 'The distance between two bonded atoms, at the lowest point of their energy curve, is the bond length (in picometres, pm). The energy needed to pull one mole (a fixed chemist\'s count) of pairs apart from there is the bond energy.'
    },
    prompt: 'What is the bond energy of the H–Cl bond, for one mole of bonds?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      fixtures: [wells('w', [row('a', 'H-Cl', 'Pair', 250)], {
        at: { x: 67, y: 35 }, size: { w: 130, h: 64 }, dmax: 330, top: 12, pitch: 9, margin: 10, discs: true, grab: 6,
        marker: { id: 'depth', label: 'Bond energy', max: 1000, step: 10 }, plot: { y0: 29, foot: 9 }
      })]
    }),
    hints: [
      'Drag the right-hand atom along the track to draw the curve; the "Bond energy" dial lays a level line across the plot.',
      'Compare the energy of the pair at its lowest point with the zero line, where the atoms are far apart.',
      'Pulling the atoms apart takes the pair from its lowest energy up to zero, so the bond energy is the size of that climb.'
    ],
    check(state) {
      const r = wellRead(state.table, 'w');
      if (!moved(r.rows[0])) return { ok: false, notYet: true, msg: 'Drag the atom along the track to draw the curve.' };
      if (!r.marker) return { ok: false, notYet: true, msg: 'Set the "Bond energy" dial.' };
      const want = r.rows[0].de;
      if (Math.abs(r.marker - want) <= 12) return { ok: true };
      return r.marker < want
        ? { ok: false, msg: `A line ${r.marker} kJ/mol below zero is above the lowest point of the curve: the bonded pair has less energy than that.` }
        : { ok: false, msg: `A line ${r.marker} kJ/mol below zero is under the lowest point of the curve: the pair never has energy that low.` };
    },
    reward: {
      log: 'The depth of the curve.',
      title: 'Bond Energy',
      body: 'The lowest point of the curve is about 431 kJ/mol below zero, so that much energy pulls apart one mole of H–Cl bonds. The atoms sit 127 pm apart there: the bond length.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'More Pairs',
    prompt: 'Two carbon atoms share three pairs of electrons, not one: are they closer together, further apart, or the same?',
    cards: GUESSES,
    hints: [
      'Lay one of the three cards in the slot.',
      'Shared electrons sit between the two nuclei, and both nuclei attract them.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage has a single, a double and a triple carbon–carbon bond to measure.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Three Curves',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'which carbon–carbon bond is shortest and which longest?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [tagAt('a', 'Pair A', 'C#C', 20), tagAt('b', 'Pair B', 'C-C', 50), tagAt('c', 'Pair C', 'C=C', 80)],
      zones: { rail: RAIL(['a', 'b', 'c'], ['c', 'b', 'a'], 'Shortest bond', 'Longest bond') },
      fixtures: [wells('w', [row('a', 'C#C', 'Pair A', 180), row('b', 'C-C', 'Pair B', 180), row('c', 'C=C', 'Pair C', 180)], {
        at: { x: 66, y: 28 }, size: { w: 126, h: 50 }, dmax: 200, top: 9, pitch: 7, margin: 6, plot: { y0: 29, foot: 8 }
      })]
    }),
    hints: [
      'Drag each of the three pairs along its track to draw its curve, then drag the pair cards onto the rail.',
      'Compare where the lowest point of each curve falls along the distance axis, and how far below zero it is.',
      'The bond length is the distance at the lowest point of a curve, so read it from each curve before ordering the cards.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three pairs on the rail in order.' };
      const want = order.slice().sort((x, y) => PAIRS[t.pieces[x].props.pair].r0 - PAIRS[t.pieces[y].props.pair].r0);
      if (order.join() === want.join()) return { ok: true };
      const k = order.findIndex((id, i) => id !== want[i]);
      return { ok: false, msg: `${t.pieces[order[k]].label} is out of place: compare the distance at the lowest point of its curve with its neighbour's.` };
    },
    get reward() {
      return {
        log: 'The more pairs shared, the shorter the bond.',
        title: 'Bond Order',
        body: `${verdictLine(QUEST_KEY, 'closer')}More shared pairs pull the two carbon atoms closer and hold them more tightly, making the triple bond shortest and its curve deepest.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Salt Strength',
    prompt: 'Which of these ionic solids melts at the lowest temperature and which at the highest?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        saltPiece('a', 'NaCl', 'NaCl', { x: 24, y: 56 }),
        saltPiece('b', 'KCl', 'KCl', { x: 56, y: 56 }),
        saltPiece('c', 'MgO', 'MgO', { x: 88, y: 56 })
      ],
      zones: { rail: { id: 'rail', at: { x: 56, y: 56 }, size: { w: 104, h: 16 }, first: 'Melts lowest', last: 'Melts highest', items: ['a', 'b', 'c'], start: ['a', 'c', 'b'] } },
      fixtures: [hotplate('hp', { x: 49, y: 19 }, { w: 92, h: 32, max: 3000 })]
    }),
    hints: [
      'Drag each salt onto the hotplate and raise the heat dial until it melts.',
      'Compare the ion charges and the distance between ion centres printed on the salt that melted last with those on the other two.',
      'Melting pulls ions away from their neighbours, so ask which card\'s ions attract each other most strongly.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three salts on the rail in order.' };
      const want = order.slice().sort((x, y) => LATTICES[t.pieces[x].props.lattice].melts - LATTICES[t.pieces[y].props.lattice].melts);
      if (order.join() === want.join()) return { ok: true };
      const k = order.findIndex((id, i) => id !== want[i]);
      return { ok: false, msg: `${t.pieces[order[k]].label} is out of place: heat it beside its neighbour on the rail and see which melts first.` };
    },
    reward: {
      log: 'Magnesium oxide took the most heat. Potassium chloride took the least.',
      title: 'Lattice Energy',
      body: 'MgO, with 2+ and 2− ions close together, melts far higher than the salts of 1+ and 1− ions because stronger attraction holds its ions together.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'A Salt Not Yet Heated',
    briefing: {
      speaker: SPEAKER,
      body: 'The attraction between two ions grows with the product of their charges and shrinks as their centres get further apart. This is Coulomb\'s law.'
    },
    prompt: 'Which ionic solid has the weakest attraction between its ions and which the strongest?',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        saltPiece('a', 'NaCl', 'NaCl', { x: 22, y: 56 }),
        saltPiece('b', 'KCl', 'KCl', { x: 52, y: 56 }),
        saltPiece('c', 'MgO', 'MgO', { x: 82, y: 56 }),
        saltPiece('d', 'NaF', 'NaF', { x: 112, y: 56 })
      ],
      zones: { rail: { id: 'rail', at: { x: 67, y: 56 }, size: { w: 130, h: 16 }, first: 'Weakest attraction', last: 'Strongest attraction', items: ['a', 'b', 'c', 'd'], start: ['a', 'c', 'b', 'd'] } }
    }),
    hints: [
      'Each card prints its ions\' charges and the distance between their centres; drag the cards into order on the rail.',
      'Compare the three salts whose charges are the same by distance, then look at the salt whose charges are larger.',
      'Larger ion charges and a shorter distance between centres both pull ions together more strongly, as Coulomb\'s law says.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four salts on the rail in order.' };
      const want = order.slice().sort((x, y) => LATTICES[t.pieces[x].props.lattice].energy - LATTICES[t.pieces[y].props.lattice].energy);
      if (order.join() === want.join()) return { ok: true };
      const k = order.findIndex((id, i) => id !== want[i]);
      return { ok: false, msg: `${t.pieces[order[k]].label} is out of place: compare its charges and its distance between centres with its neighbour's on the rail.` };
    },
    reward: {
      log: 'Charges and distance ranked all four salts.',
      title: 'Coulomb\'s Law',
      body: 'KCl\'s ions are furthest apart and NaF\'s are closest of the three salts with 1+ and 1− ions; MgO\'s charges are doubled. Coulomb\'s law gives the order KCl, NaCl, NaF, MgO.',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Energy is in kilojoules for each mole of bonds (kJ/mol);', 'distance is in picometres (pm).']
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
      body: 'The lowest point of a pair\'s energy curve gives the bond length, and its depth below zero is the bond energy. More shared pairs make a bond shorter and stronger.'
    },
    {
      heading: 'Ionic Solids',
      body: 'Ions attract more strongly when their charges are larger and their centres closer, so such a solid has a higher lattice energy and melts at a higher temperature.'
    },
    {
      heading: 'Next',
      body: 'The next bench places the valence electrons of a molecule into bonds and lone pairs.'
    }
  ]
};

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
  [hand('a', 200), hand('a', 127), hand('a', 300), hand('depth', 430)],
  [guess('closer')],
  [hand('a', 120), hand('b', 154), hand('c', 134), to('a', 0), to('c', 1), to('b', 2)],
  [onPlate('a', 0), onPlate('b', 1), onPlate('c', 2), heat(775), heat(825), heat(2875), to('b', 0), to('a', 1), to('c', 2)],
  [to('b', 0), to('a', 1), to('d', 2), to('c', 3)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [hand('a', 127), hand('depth', 860)],
  [],
  [to('b', 0), to('c', 1), to('a', 2)],
  [to('a', 0), to('b', 1), to('c', 2)],
  [to('b', 0), to('a', 1), to('c', 2), to('d', 3)]
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
