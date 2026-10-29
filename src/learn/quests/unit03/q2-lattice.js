/**
 * q2-lattice.js — Ligar, bench two: STONE AND WIRE.
 *
 * The second bench on the world and its second TABLETOP (plan `bench-tabletop.md`, phase T3a). Bench one settled what a bond IS;
 * this one asks what a block of each kind actually DOES, because that is the only reason a bond type matters to anybody holding a
 * piece of salvage. The table is the ore drift's: blocks on the ledge, a hotplate that takes a block on its plate, a pair of leads
 * that clip across a block and light a lamp while a current passes, and a grid to build ions into.
 *
 * THE CLICK (2026-10-23 rollout). Almost everyone believes that salt, being made of charged particles, lets a current through. So the
 * quest opens on a prediction about a cold block of salt (the wrong idea is a card), and the next bench clips the leads on four
 * blocks, cold and molten: the salt stays dark until it is molten, the copper lights cold, and two more blocks never light. Only
 * then is the word "conduct" given, and the lattice is built by hand to show why the ions cannot move.
 *
 *   1  PREDICT: does a cold block of salt light the lamp?                   (no instrument; the wrong idea is a card)
 *   2  clip the leads on four blocks, cold and molten, and tray them        -> a current needs charges that are free to move
 *   3  heat the four blocks and rail them by when each gives way            -> the melting point measures the hold
 *   4  build a grid of ions with no two alike touching, slide a layer       -> a lattice, and why it shatters
 *   5  find the one sealed block that holds at 900 degrees and passes none  -> why the arches are still standing
 *   -- debrief: what a bond type decides about a material, and what is next.
 *
 * Cut as repeats (2026-10-23): "what survives the blow" and "lift one out" (molecules and the formula unit: the same
 * how-is-it-built question the sealed liner already asks), "the block the blade will not cut" (the network, which stage 5
 * finds), "four sealed blocks" (merged into the liner), and the chipped copper block fetched from the seam (it carried a copy of a
 * block the bench holds, so no field fetch remains on this bench).
 *
 * THE TABLE (`table/`, `kits/bonds.js`). Nothing here is a switch with an outcome behind it. A block is MOLTEN exactly while it
 * stands on the hotplate at or past its melting point, so the temperature it gives way at is found by turning the dial and taking
 * the block off cools it; the leads' lamp is `conductionOf` for the block as it is right now. `SOLUTIONS` and `MISSES` are scripts
 * of the player's own actions, replayed by `verify:table` by drag and by two taps.
 *
 * `q1-joins` earned bond, ionic and covalent, so those are plain words here. What this quest has to earn is on `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { conductionOf } from '../../engine/joinbench.js';
import {
  bondsTable, slabPiece, hotplate, declOf, gridRead, piecesIn, guessCard, strikeOf
} from '../../table/kits/bonds.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 7 };

/**
 * When each withheld word is earned. Specific terms first: the schedule is
 * searched in order and the first match decides when a word becomes sayable.
 */
export const VOCABULARY = [
  { term: /\bsubstitutional\b/i, introducedAt: 7 },
  { term: /\binterstitial\b/i, introducedAt: 7 },
  { term: /\balloys?\b/i, introducedAt: 6 },
  { term: /\bmelting points?\b/i, introducedAt: 3 },
  { term: /\blattices?\b/i, introducedAt: 4 },
  { term: /\bbrittle\b/i, introducedAt: 4 },
  { term: /\bconduct\w*\b/i, introducedAt: 2 }
];

export const BUILDS_ON = ['unit03/q1-joins'];

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q2-lattice';
const GUESSES = [
  ['lights', 'the lamp lights on the cold salt', ['The lamp lights', 'Salt has', 'charged particles']],
  ['dark', 'the lamp stays dark on the cold salt', ['The lamp stays dark', 'Ions are locked', 'in the solid']],
  ['never', 'the lamp never lights on salt', ['The lamp never lights', 'Salt does not', 'carry current']]
];

/**
 * The legend lines. A key whose label says what it does owes nothing, and this bench's tools are pieces you
 * lay on a block (a hammer, a pair of leads) and one key ("Slide a Layer"): every one says what it does.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE BLOCKS
   `melt` is the one thing the bench is simply told, because a temperature is a measurement; everything
   else a block does is derived from its build (`bonds.js`, `joinbench.js` `planSlab`).
   ------------------------------------------------------------------ */

const SALT = { build: 'grid', melt: 801, tint: 'bone' };
const VENT = { build: 'clusters', melt: 115, tint: 'sand', cluster: 3, groups: 8 };
const ARCH = { build: 'web', melt: 1710, tint: 'iron' };
const COPPER = { build: 'metallic', melt: 1085, tint: 'rust' };
// The alloy blocks of stages 6 and 7 (`joinbench.js` `planSlab`): one kind of atom in rows, with a few atoms of another kind mixed in.
const BRASS = { build: 'metallic', alloy: 'sub', melt: 930, tint: 'rust' };
const STEEL = { build: 'metallic', alloy: 'int', melt: 1450, tint: 'pale' };
const sealed = (d, melt) => ({ ...d, melt, sealed: true });

/* ------------------------------------------------------------------
   THE TABLES
   One layout, so the furniture is always where the hand expects it (150 x 72 units): the hotplate across
   the top left, the blocks along y 44, the tools along y 61, and whatever a stage files things into down the right.
   ------------------------------------------------------------------ */

const PLATE_AT = { x: 49, y: 19 };
const PLATE_Y = 26;            // a block's middle when it lies on the plate
const BENCH_Y = 44;
const TOOLS_Y = 61;
const bench = (i, step = 24) => ({ x: 14 + i * step, y: BENCH_Y });
/** What each tool does, printed under the place it hangs (`caption`): a bench that has to be known before it can be used is a bad bench. */
const CAPTION = { hammer: 'Strikes a block', leads: 'Tests current' };
const toolAt = (id, label, i) => ({ id, kind: id, label, at: { x: 14 + i * 28, y: TOOLS_Y }, caption: CAPTION[id] });
const leads = i => toolAt('leads', 'Leads', i);
const plate = max => hotplate('hp', PLATE_AT, { max });
const tray = (id, label, y, h = 18) => ({ id, label, at: { x: 122, y }, size: { w: 44, h }, cell: 22 });
const heat = value => ({ setDial: { fixture: 'hp', dial: 'heat', value } });

/** The twelve ions of stage 4: six sodium ions and six chlorine ions in two rows, and a 4 x 3 grid of cells. */
const IONS = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: `na${i + 1}`, kind: 'ion', label: 'Na', at: { x: 14 + (i % 3) * 14, y: 20 + Math.floor(i / 3) * 15 }, props: { el: 'Na', charge: 1, disk: true } })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `cl${i + 1}`, kind: 'ion', label: 'Cl', at: { x: 14 + (i % 3) * 14, y: 50 + Math.floor(i / 3) * 15 }, props: { el: 'Cl', charge: -1, disk: true } }))
];
const CELLS = Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => `g${r}${c}`));
const GRID_SLOTS = CELLS.flatMap((row, r) => row.map((id, c) => ({ id, label: '', at: { x: 80 + c * 14, y: 12 + r * 14 }, size: { w: 13.4, h: 13.4 } })));

/** The block standing in a tray, as pieces. */
const trayOf = (t, id) => piecesIn(t, `tray:${id}`, 'slab');
/** Which way a block carries a current, from its build alone: cold and molten, only molten, or never. */
const carries = d => (conductionOf(d, false) ? 'both' : conductionOf(d, true) ? 'molten' : 'never');

const UNTRAYED = 'Sort every block into a tray before you submit.';
const name = p => p.label.charAt(0) + p.label.slice(1).toLowerCase();

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Salt and the Lamp',
    prompt: 'With a cold block of salt wired to a lamp, what does the lamp do?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Consider whether ions in a solid can move to carry current.',
      'Choose the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Prediction recorded. Next, test which materials have charges free to move.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Wire Each Block',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'sort the four blocks into trays by whether electrons or ions can move.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', COPPER, bench(2)),
        slabPiece('s4', 'BLOCK D', ARCH, bench(3)),
        leads(0)
      ],
      zones: { trays: [tray('both', 'Mobile electrons', 14), tray('molten', 'Ions freed by melting', 37), tray('never', 'No mobile charges', 60)] },
      fixtures: [plate(2000)]
    }),
    hints: [
      'Use the leads, the hotplate and the three trays.',
      'Test which blocks conduct cold, only when melted, or never.',
      'Sort each block into the tray matching which of its charges can move.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['s1', 's2', 's3', 's4'];
      const where = Object.fromEntries(ids.map(id => [id, ['both', 'molten', 'never'].find(k => trayOf(t, k).some(p => p.id === id)) || null]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: UNTRAYED };
      const wrong = ids.find(id => where[id] !== carries(declOf(t.pieces[id])));
      if (wrong) return { ok: false, msg: `${name(t.pieces[wrong])}'s lamp did not do what its tray says.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Salt conducted only when molten. Copper conducted cold and molten. The other two never conducted.',
        title: 'Charge Mobility',
        body: `${verdictLine(QUEST_KEY, 'dark')}Electrical conduction requires charges that are free to move. Copper contains mobile valence electrons that flow cold and molten. Solid salt ions are locked in fixed positions until melted, while molecular and network solids have no mobile charges.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Heat All Four',
    prompt: 'Order the four blocks on the rail from lowest to highest melting point to compare bond strengths.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', COPPER, bench(2)),
        slabPiece('s4', 'BLOCK D', ARCH, bench(3))
      ],
      zones: { rail: { id: 'rail', at: { x: 56, y: 55 }, size: { w: 104, h: 14 }, first: 'Weakest hold', last: 'Strongest hold', items: ['s1', 's2', 's3', 's4'], start: ['s1', 's4', 's2', 's3'] } },
      fixtures: [plate(2000)]
    }),
    hints: [
      'Use the hotplate and its heat dial.',
      'Compare the temperatures at which the different structures break apart.',
      'Arrange the blocks from lowest melting point on the left to highest on the right.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      const melt = id => declOf(t.pieces[id]).melt;
      const want = order.slice().sort((a, b) => melt(a) - melt(b));
      if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four blocks back on the rail in order.' };
      if (order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Two neighbouring blocks on the rail are in the wrong order.' };
    },
    reward: {
      log: 'Block B 115 C. Block A 801 C. Block C 1085 C. Block D 1710 C.',
      title: 'Hold Between Particles',
      body: 'Melting point measures the energy needed to overcome the hold between particles. Molecular solids separate at low heat without breaking internal bonds. Ionic lattices and metals require high heat to disrupt, while covalent networks require breaking covalent bonds directly.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Build the Salt',
    prompt: 'Build a grid of all twelve ions alternating charges, then slide one layer.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: IONS,
      zones: { slots: GRID_SLOTS },
      fixtures: [{
        id: 'grid', kind: 'lattice', label: 'Grid', at: { x: 101, y: 59 }, size: { w: 62, h: 16 }, runLabel: 'Slide a Layer',
        props: { cells: CELLS, layer: 0 }
      }],
      opts: { diskAtoms: true }
    }),
    hints: [
      'Use the ions, the grid and "Slide a Layer".',
      'Alternate positive and negative charges along every row and column.',
      'Fill the grid with alternating ions, then slide one layer to observe charge repulsion.'
    ],
    check(state) {
      const g = gridRead(state.table, 'grid');
      if (g.filled === 0) return { ok: false, notYet: true, msg: 'Put the ions on the grid first.' };
      if (g.like > 0) return { ok: false, msg: 'Two ions of the same charge are touching.' };
      if (g.filled < g.total) return { ok: false, notYet: true, msg: 'Every ion goes on the grid before you submit.' };
      if (!g.slid) return { ok: false, notYet: true, msg: 'Slide a layer along the grid.' };
      return { ok: true };
    },
    reward: {
      log: 'The slid layer put like against like.',
      title: 'Lattices and Cleavage',
      body: 'Ionic solids form a repeating crystal lattice where each ion is surrounded by opposite charges. Shifting a layer aligns like charges that repel, causing the brittle crystal to fracture along flat planes.',
      model: { type: 'crystal', cation: 'Na', anion: 'Cl', n: 3, caption: 'Alternating sodium and chloride ions in a crystal lattice.' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Pick the Liner',
    prompt: 'Place the block that stays solid at 900 degrees and does not conduct into the liner slot.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('x1', 'BLOCK A', sealed(SALT, 770), bench(0)),
        slabPiece('x2', 'BLOCK B', sealed(VENT, 80), bench(1)),
        slabPiece('x3', 'BLOCK C', sealed(COPPER, 1085), bench(2)),
        slabPiece('x4', 'BLOCK D', sealed(ARCH, 3550), bench(3)),
        leads(0)
      ],
      zones: { slots: [{ id: 'liner', label: 'Vessel liner', at: { x: 122, y: 30 }, size: { w: 26, h: 20 } }] },
      fixtures: [plate(1000)]
    }),
    hints: [
      'Use the hotplate, the leads and the liner slot.',
      'Find which blocks resist 900 degrees and test them for mobile charges.',
      'Place the block that remains solid at 900 degrees with no mobile charges into the liner slot.'
    ],
    check(state) {
      const t = state.table;
      const held = Object.values(t.pieces).find(p => p.kind === 'slab' && p.zone === 'slot:liner');
      if (!held) return { ok: false, notYet: true, msg: 'Put a block in the slot.' };
      const d = declOf(held);
      if (d.melt <= 900) return { ok: false, msg: `${name(held)} is molten on the hotplate at 900 degrees.` };
      if (conductionOf(d, false) || conductionOf(d, true)) return { ok: false, msg: `${name(held)} lights the lamp.` };
      return { ok: true };
    },
    reward: {
      log: 'Block D: still solid at 900 degrees, no current.',
      title: 'Network Covalent Solids',
      body: 'Covalent network solids consist of atoms linked in a continuous three-dimensional network of covalent bonds. With no mobile charges and immense bond strength throughout the network, the material does not conduct and resists high temperatures.',
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Hammer the Metals',
    prompt: 'Hammer each block and sort it by how far it gives way.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('m1', 'BLOCK A', COPPER, bench(0)),
        slabPiece('m2', 'BLOCK B', STEEL, bench(1)),
        slabPiece('m3', 'BLOCK C', BRASS, bench(2)),
        toolAt('hammer', 'Hammer', 0)
      ],
      zones: { trays: [tray('bends', 'Bends a lot', 14), tray('dents', 'Dents a little', 37), tray('holds', 'Does not give', 60)] }
    }),
    hints: [
      'Use the hammer and the three trays.',
      'Strike each block and compare how far its rows of atoms shift, then look at what sits among them.',
      'The more foreign atoms sit in the way of the sliding rows, the less the block gives.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['m1', 'm2', 'm3'];
      const word = { bent: 'bends', dented: 'dents', held: 'holds' };
      const want = id => word[strikeOf(declOf(t.pieces[id]).build, declOf(t.pieces[id]).alloy)];
      const where = Object.fromEntries(ids.map(id => [id, ['bends', 'dents', 'holds'].find(k => trayOf(t, k).some(p => p.id === id)) || null]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: UNTRAYED };
      if (ids.some(id => !t.pieces[id].props.struck)) return { ok: false, notYet: true, msg: 'Strike every block before you submit.' };
      const wrong = ids.find(id => where[id] !== want(id));
      if (wrong) return { ok: false, msg: `${name(t.pieces[wrong])} did something other than its tray says when it was struck.` };
      return { ok: true };
    },
    reward: {
      log: 'Block A bent most. Block C dented a little. Block B did not give.',
      title: 'Alloys',
      body: 'In a pure metal the rows of atoms slide over each other, so it bends. An alloy is a metal mixed with atoms of another element, which sit in the way of the sliding rows: the alloy gives less, and is harder.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Where the Atoms Go',
    prompt: 'Sort each atom by where it sits in iron (atoms 140 pm wide): in an iron atom\'s place, or in a gap.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        guessCard('x1', 'Nickel', ['Nickel', '135 pm'], { x: 20, y: 22 }), guessCard('x2', 'Carbon', ['Carbon', '70 pm'], { x: 58, y: 22 }),
        guessCard('x3', 'Chromium', ['Chromium', '140 pm'], { x: 20, y: 50 }), guessCard('x4', 'Hydrogen', ['Hydrogen', '25 pm'], { x: 58, y: 50 })
      ],
      zones: { trays: [
        { id: 'replace', label: 'In its place', at: { x: 118, y: 19 }, size: { w: 60, h: 22 }, cell: 28 },
        { id: 'gap', label: 'In a gap', at: { x: 118, y: 52 }, size: { w: 60, h: 22 }, cell: 28 }
      ] }
    }),
    hints: [
      'Use the four atoms and the two trays.',
      'Compare each atom\'s width with the 140 pm width of an iron atom.',
      'An atom close to the width of an iron atom can stand in a row; a much smaller one fits between the rows.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['x1', 'x2', 'x3', 'x4'];
      const want = { x1: 'replace', x3: 'replace', x2: 'gap', x4: 'gap' };
      const where = Object.fromEntries(ids.map(id => [id, ['replace', 'gap'].find(k => t.pieces[id].zone === `tray:${k}`) || null]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: 'Sort every atom into a tray before you submit.' };
      const wrong = ids.find(id => where[id] !== want[id]);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is in a tray that its width does not fit.` };
      return { ok: true };
    },
    reward: {
      log: 'Similar widths replace; much smaller atoms fit in the gaps.',
      title: 'Substitutional and Interstitial Alloys',
      body: 'An atom of similar size takes the place of a metal atom: that is a substitutional alloy, such as brass (copper and zinc). Much smaller atoms such as carbon or hydrogen fit in the gaps between the metal atoms: that is an interstitial alloy, such as steel.',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  3: ['Drag a block onto the hotplate,', 'then turn the heat dial.'],
  4: ['Alternate charges on the grid,', 'then press "Slide a Layer".']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'Summary',
      body: 'Ionic solids form crystal lattices that are brittle and conduct electricity only when molten. Molecular solids melt at low temperatures and never conduct. Covalent networks possess high melting points and do not conduct. Metals conduct electricity in both solid and liquid states.'
    },
    {
      heading: 'Structure and Properties',
      body: 'Melting point, mechanical brittleness, and electrical conductivity directly reflect whether particles are separate molecules, ions in a lattice, atoms in a covalent network, or metal cations in a sea of electrons.'
    },
    {
      heading: 'Next',
      body: 'The next bench measures bond energy and internuclear distance by observing the forces between two bonding atoms.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Solid sodium chloride does not conduct electricity, but molten sodium chloride does. Why?',
    options: [
      { id: 'a', label: 'Melting turns the ions into metal atoms' },
      { id: 'b', label: 'Its ions are locked in the lattice when solid and free to move when molten' },
      { id: 'c', label: 'Heat itself carries the current' },
      { id: 'd', label: 'Melting adds electrons to the sample' }
    ],
    answer: 'b',
    explanation: 'A current is charge on the move. Sodium chloride has charges either way, but in the solid lattice they are pinned in place; melting frees them, so the charge can travel.'
  },
  {
    question: 'Sugar melts at about 186 degrees and salt at 801. What does that difference tell you?',
    options: [
      { id: 'a', label: 'Sugar molecules are held to each other by a much weaker pull than the one between ions' },
      { id: 'b', label: 'The bonds inside a sugar molecule are weaker than the bonds inside salt' },
      { id: 'c', label: 'Sugar is a smaller molecule than salt' },
      { id: 'd', label: 'Salt has more electrons' }
    ],
    answer: 'a',
    explanation: 'Melting sugar only separates whole molecules from each other, and the pull between molecules is weak. Melting salt has to pull apart an ionic lattice, where every ion is gripped by the ions all round it.'
  },
  {
    question: 'Why is an ionic solid hard but brittle — strong to press on, yet it shatters when struck?',
    options: [
      { id: 'a', label: 'Its bonds are weak in one direction only' },
      { id: 'b', label: 'Striking it slides one layer by a step, so like charges meet and repel' },
      { id: 'c', label: 'It is full of trapped air' },
      { id: 'd', label: 'The hammer adds charge to it' }
    ],
    answer: 'b',
    explanation: 'In the lattice every ion is surrounded by ions of opposite charge, which is a strong grip. Shift one plane by one ion and all those attractions become repulsions at once, and the crystal splits along that plane.'
  },
  {
    question: 'Diamond melts above 3500 degrees; iodine melts at 114. Both are made only of nonmetals. Why the enormous difference?',
    options: [
      { id: 'a', label: 'Diamond is ionic and iodine is covalent' },
      { id: 'b', label: 'Iodine atoms are heavier, so they need less heat' },
      { id: 'c', label: 'Diamond is one covalent network, so melting it breaks covalent bonds; iodine is separate molecules held by a weak pull' },
      { id: 'd', label: 'Diamond conducts heat away faster' }
    ],
    answer: 'c',
    explanation: 'Both are covalent, but they are built differently. Every carbon in diamond is bonded on to its neighbours right through the crystal, so melting it means breaking those bonds; melting iodine only separates I2 molecules that were barely holding on to each other.'
  },
  {
    question: 'An unknown solid melts at 60 degrees, does not conduct as a solid, and still does not conduct once it is molten. How is it built?',
    options: [
      { id: 'a', label: 'An ionic lattice' },
      { id: 'b', label: 'A covalent network' },
      { id: 'c', label: 'Separate molecules' },
      { id: 'd', label: 'A metal' }
    ],
    answer: 'c',
    explanation: 'A low melting point rules out both a lattice and a network, which need hundreds or thousands of degrees. Failing to conduct even when molten rules out ions, so what melted was the weak pull between separate molecules.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the
   reducer by direct actions, by drag and by two taps. A block is slid onto the hotplate by setting it down
   inside the plate (`free:X,Y`), and the dial is turned to a setting; nothing here says what a block does.
   ------------------------------------------------------------------ */

const SPOTS = [16, 39, 62, 85];
const onPlate = (id, i) => ({ place: { piece: id, to: `free:${SPOTS[i]},${PLATE_Y}` } });
const into = (piece, trayId) => ({ place: { piece, to: `tray:${trayId}` } });
const clip = (block) => ({ join: ['leads', block] });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });
const grid = (r, c) => `slot:g${r}${c}`;
/** The checkerboard: a sodium ion where row + column is even, a chlorine ion where it is odd. */
const CHECKER = (() => {
  const na = ['na1', 'na2', 'na3', 'na4', 'na5', 'na6'];
  const cl = ['cl1', 'cl2', 'cl3', 'cl4', 'cl5', 'cl6'];
  const out = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) out.push({ place: { piece: (r + c) % 2 === 0 ? na.shift() : cl.shift(), to: grid(r, c) } });
  return out;
})();

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [guess('dark')],
  [
    clip('s1'), onPlate('s1', 0), heat(825), into('s1', 'molten'),
    clip('s2'), onPlate('s2', 1), into('s2', 'never'),
    heat(0), clip('s3'), onPlate('s3', 2), heat(1100), into('s3', 'both'),
    clip('s4'), onPlate('s4', 3), heat(1725), into('s4', 'never')
  ],
  [
    onPlate('s1', 0), onPlate('s2', 1), onPlate('s3', 2), onPlate('s4', 3), heat(125), heat(825), heat(1100), heat(1725),
    { place: { piece: 's2', to: 'rail:0' } }, { place: { piece: 's1', to: 'rail:1' } }, { place: { piece: 's3', to: 'rail:2' } }, { place: { piece: 's4', to: 'rail:3' } }
  ],
  [...CHECKER, { run: 'grid' }],
  [onPlate('x1', 0), onPlate('x2', 1), onPlate('x3', 2), onPlate('x4', 3), heat(900), clip('x4'), { place: { piece: 'x4', to: 'slot:liner' } }],
  [
    { join: ['hammer', 'm1'] }, { join: ['hammer', 'm2'] }, { join: ['hammer', 'm3'] },
    into('m1', 'bends'), into('m3', 'dents'), into('m2', 'holds')
  ],
  [into('x1', 'replace'), into('x3', 'replace'), into('x2', 'gap'), into('x4', 'gap')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [into('s1', 'both'), into('s2', 'never'), into('s3', 'both'), into('s4', 'never')],
  [{ place: { piece: 's4', to: 'rail:0' } }],
  [{ place: { piece: 'na1', to: grid(0, 0) } }, { place: { piece: 'na2', to: grid(0, 1) } }],
  [{ place: { piece: 'x3', to: 'slot:liner' } }],
  [{ join: ['hammer', 'm1'] }, { join: ['hammer', 'm2'] }, { join: ['hammer', 'm3'] }, into('m1', 'dents'), into('m3', 'bends'), into('m2', 'holds')],
  [into('x1', 'gap'), into('x3', 'replace'), into('x2', 'gap'), into('x4', 'gap')]
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
