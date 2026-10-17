/**
 * q2-lattice.js — Ligar, bench two: STONE AND WIRE.
 *
 * The second bench on the world and its second TABLETOP (plan `bench-tabletop.md`, phase T3a). Bench one settled
 * what a bond IS; this one asks what a block of each kind actually DOES, because that is the only reason a bond
 * type matters to anybody holding a piece of salvage. The table is the ore drift's: blocks on the ledge, a
 * hotplate that takes a block on its plate, a hammer, a pair of leads that clip across a block, a pair of tongs,
 * and a grid to build ions into.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  heat three blocks until each comes apart  -> the melting point measures the hold
 *   2  build a grid of ions and slide a layer    -> a lattice, and why it shatters
 *   3  a current, cold and molten, on three blocks -> what it takes to conduct
 *   4  break the vent block down as far as it goes -> molecules, and the weak pull between them
 *   5  take hold of one atom of the block the blade will not cut -> a network of covalent bonds
 *   6  lift one molecule out with the tongs      -> not everything is made of molecules
 *   7  four sealed blocks, tests only            -> the tests name the build
 *   8  pick a liner for a 900 degree vessel      -> why the arches are still standing
 *   -- debrief: what a bond type decides about a material, and what is next.
 *
 * THE TABLE (`table/`, `kits/bonds.js`). Nothing here is a switch with an outcome behind it. A block is MOLTEN
 * exactly while it stands on the hotplate at or past its melting point, so the temperature it gives way at is
 * found by turning the dial and taking the block off cools it; a blow is the old bench's own mapping from the
 * build; the leads' lamp is `conductionOf` for the block as it is right now; what the tongs bring out is the
 * connected group `planSlab` draws round an atom. `SOLUTIONS` and `MISSES` are scripts of the player's own
 * actions, replayed by `verify:table` by drag and by two taps.
 *
 * FIELD (stage 1, evidence and never a lock): a block chipped from the drift's own face. At 3D On the player
 * walks to the seam (`ligar/stations.js` `buildOreDrift`, the field point `chip`); below that the same fetch is
 * a drawn site plate on the table.
 *
 * WHAT THIS BENCH DOES NOT DO. It never weighs a block and never counts what is in one. Recipes are bench
 * three of Tallow's and counting by weight is its last bench.
 *
 * `q1-joins` earned bond, ionic and covalent, so those are plain words here. What this quest has to earn is on
 * `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { conductionOf } from '../../engine/joinbench.js';
import {
  bondsTable, slabPiece, hotplate, declOf, groupsOf, smallestPiece, liftCells, liftsOf, gridRead, piecesIn
} from '../../table/kits/bonds.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. Specific terms first: the schedule is
 * searched in order and the first match decides when a word becomes sayable.
 */
export const VOCABULARY = [
  { term: /\bmelting points?\b/i, introducedAt: 1 },
  { term: /\blattices?\b/i, introducedAt: 2 },
  { term: /\bbrittle\b/i, introducedAt: 2 },
  { term: /\bconduct\w*\b/i, introducedAt: 3 },
  { term: /\bformula units?\b/i, introducedAt: 6 }
];

const SPEAKER = 'Vess';

/**
 * The legend lines. A key whose label says what it does owes nothing, and this bench's tools are pieces you
 * lay on a block (a hammer, a pair of leads, a pair of tongs) and one key ("Slide a Layer"): every one says what
 * it does. Kept so the quest contract (`toolNoteFor`) holds.
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
const sealed = (d, melt) => ({ ...d, melt, sealed: true });

/* ------------------------------------------------------------------
   THE TABLES
   One layout, so the furniture is always where the hand expects it (150 x 72 units): the hotplate across the
   top left, the blocks along y 48, the tools along y 64, and whatever a stage files things into down the right.
   ------------------------------------------------------------------ */

const PLATE_AT = { x: 49, y: 19 };
const PLATE_Y = 26;            // a block's middle when it lies on the plate
const BENCH_Y = 48;
const TOOLS_Y = 64;
const bench = (i, step = 27) => ({ x: 14 + i * step, y: BENCH_Y });
const toolAt = (id, label, i) => ({ id, kind: id, label, at: { x: 14 + i * 16, y: TOOLS_Y } });
const hammer = i => toolAt('hammer', 'Hammer', i);
const leads = i => toolAt('leads', 'Leads', i);
const tongs = i => toolAt('tongs', 'Tongs', i);
const plate = max => hotplate('hp', PLATE_AT, { max });
const tray = (id, label, y, h = 20) => ({ id, label, at: { x: 122, y }, size: { w: 44, h }, cell: 22 });
const heat = value => ({ setDial: { fixture: 'hp', dial: 'heat', value } });

/** The twelve ions of stage 2: six sodium ions and six chlorine ions in two rows, and a 4 x 3 grid of cells. */
const IONS = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: `na${i + 1}`, kind: 'ion', label: 'Na', at: { x: 9 + i * 13.5, y: 38 }, props: { el: 'Na', charge: 1 } })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `cl${i + 1}`, kind: 'ion', label: 'Cl', at: { x: 9 + i * 13.5, y: 54 }, props: { el: 'Cl', charge: -1 } }))
];
const CELLS = Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => `g${r}${c}`));
const GRID_SLOTS = CELLS.flatMap((row, r) => row.map((id, c) => ({ id, label: '', at: { x: 96 + c * 14, y: 12 + r * 14 }, size: { w: 13.4, h: 13.4 } })));

/** The block standing in a tray, as pieces. */
const trayOf = (t, id) => piecesIn(t, `tray:${id}`, 'slab');
/** Which way a block carries a current, from its build alone: cold and molten, only molten, or never. */
const carries = d => (conductionOf(d, false) ? 'both' : conductionOf(d, true) ? 'molten' : 'never');

const UNTRAYED = 'Tray every block before you commit.';

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Heat All Three',
    briefing: {
      speaker: SPEAKER,
      body: 'Slide a block onto the hotplate and turn its dial up to heat it. A block chipped from the drift\'s own face is waiting at the seam.'
    },
    prompt: 'Order the three blocks by how much heat each one takes to come apart.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', ARCH, bench(2)),
        { ...slabPiece('s4', 'BLOCK D', COPPER, { x: 122, y: 24 }), hidden: true, fetchFrom: 'chip' }
      ],
      zones: { rail: { id: 'rail', at: { x: 49, y: 55 }, size: { w: 92, h: 14 }, first: 'Comes apart first', last: 'Comes apart last', items: ['s1', 's2', 's3'], start: ['s1', 's3', 's2'] } },
      fixtures: [plate(2000)],
      fetch: [{ id: 'chip', label: 'Chipped block', at: { x: 128, y: 56 } }]
    }),
    hints: [
      'Slide a block onto the hotplate and turn the dial up until the block gives way.',
      'Try each block on the plate in turn, and note the setting of the dial at which each one comes apart.',
      'Put the block that gave way at the lowest setting at the left end of the rail and the one that held out longest at the right.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      const melt = id => declOf(t.pieces[id]).melt;
      const want = order.slice().sort((a, b) => melt(a) - melt(b));
      if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three blocks back on the rail in order.' };
      if (order.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'A block is out of place on the rail. Put each one to the heat it gave way at on the hotplate, and compare.' };
    },
    reward: {
      log: 'Block A 801 C. Block B 115 C. Block C 1710 C.',
      title: 'The Melting Point Measures the Hold',
      body: 'The temperature a solid comes apart at is its melting point, and it is a direct measure of how hard the whole block is being held together. These three went at 115, 801 and 1710 degrees, so whatever is doing the holding is not the same thing in each of them. The rest of this bench is finding out what the difference is.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Hit the Salt',
    prompt: 'Build a grid of all twelve ions with no two of the same charge touching, then slide one layer.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, { x: 14, y: 14 }),
        slabPiece('s2', 'BLOCK B', VENT, { x: 41, y: 14 }),
        { id: 'hammer', kind: 'hammer', label: 'Hammer', at: { x: 66, y: 14 } },
        ...IONS
      ],
      zones: { slots: GRID_SLOTS },
      fixtures: [{
        id: 'grid', kind: 'lattice', label: 'Grid', at: { x: 116, y: 59 }, size: { w: 62, h: 16 }, runLabel: 'Slide a Layer',
        props: { cells: CELLS, layer: 0 }
      }]
    }),
    hints: [
      'Drag the ions onto the cells of the grid, then press "Slide a Layer".',
      'Look at the charge marked on each ion as you set it down, and at what stands beside it and below it.',
      'Alternate the charges along every row and down every column, then slide the top row and read which ions now face each other.'
    ],
    check(state) {
      const g = gridRead(state.table, 'grid');
      if (g.filled === 0) return { ok: false, notYet: true, msg: 'Put the ions on the grid first.' };
      if (g.like > 0) return { ok: false, msg: 'Two ions of the same charge are touching. Look at what stands beside and below each ion you have set down.' };
      if (g.filled < g.total) return { ok: false, notYet: true, msg: 'Every ion goes on the grid before you commit.' };
      if (!g.slid) return { ok: false, notYet: true, msg: 'The grid is built. Slide a layer along and see what meets.' };
      return { ok: true };
    },
    reward: {
      log: 'The slid layer put like against like.',
      title: 'A Lattice, and Why It Shatters',
      body: 'An ionic solid is not a heap: its ions sit in a repeating three-dimensional grid called a lattice, with every plus surrounded by minuses and every minus by pluses. Knock one layer sideways by a single step and every pair that was pulling is suddenly pushing, so the whole block splits clean along that plane. That is why ionic solids are hard and yet brittle.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Put a Current Through It',
    briefing: {
      speaker: SPEAKER,
      body: 'The leads clip across the block they lie on, and their lamp is lit while a current passes through that block.'
    },
    prompt: 'Tray the three blocks by when each one passes a current.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', COPPER, bench(2)),
        leads(0)
      ],
      zones: { trays: [tray('both', 'Cold and molten', 14), tray('molten', 'Only when molten', 38), tray('never', 'Never', 62)] },
      fixtures: [plate(2000)]
    }),
    hints: [
      'Clip the leads onto a block and watch their lamp.',
      'Test each block cold, then slide it onto the hotplate, turn the dial past where it gives way, and watch the lamp again.',
      'Tray each block under what its lamp did: lit cold and molten, lit only once molten, or never lit.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['s1', 's2', 's3'];
      const where = Object.fromEntries(ids.map(id => [id, ['both', 'molten', 'never'].find(k => trayOf(t, k).some(p => p.id === id)) || null]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: UNTRAYED };
      if (ids.some(id => where[id] !== carries(declOf(t.pieces[id])))) {
        return { ok: false, msg: 'A block is under the wrong heading. Clip the leads on it cold, then again once it is on the plate past the heat it gave way at.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Salt conducts molten. Sulfur never conducts. Copper conducts cold and molten.',
      title: 'What It Takes to Conduct',
      body: 'A current is charge on the move, so a material only conducts if it holds charged particles, such as ions or electrons, and those particles can travel. In a metal like copper, valence electrons form a shared sea that flows freely even when cold. In the salt lattice the ions are pinned until melted, while sulfur holds no loose charges at all.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What Survives the Blow',
    prompt: 'Break Block A down as far as it will go, then set the tally to the fewest atoms still bonded together in one piece.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s2', 'BLOCK A', VENT, bench(0)),
        slabPiece('s1', 'BLOCK B', SALT, bench(1)),
        hammer(0)
      ],
      fixtures: [
        plate(1000),
        { id: 'tally', kind: 'tally', label: 'Smallest piece', at: { x: 122, y: 24 }, size: { w: 44, h: 16 }, noRun: true, dials: { atoms: { min: 0, max: 8, step: 1, value: 0, label: 'Atoms' } } }
      ]
    }),
    hints: [
      'Strike the block with the hammer, then slide it onto the hotplate and turn the dial up until it gives way.',
      'Look at what is left in the block\'s picture after each test, and at how its atoms are grouped.',
      'Count the atoms in one of the smallest groups that stays joined through both tests, and set the tally to that count.'
    ],
    check(state) {
      const t = state.table;
      const n = t.fixtures.tally.dials.atoms.value;
      if (n === 0) return { ok: false, notYet: true, msg: 'Set the tally to a number of atoms.' };
      if (n === smallestPiece(declOf(t.pieces.s2))) return { ok: true };
      return { ok: false, msg: 'Count again in the picture of Block A after the blow and after the melt: is every piece of it really that small, and does any piece come apart further?' };
    },
    reward: {
      log: 'Block A: the molecules came apart from each other, never from themselves.',
      title: 'Molecules, and the Weak Pull Between Them',
      body: 'This block is built of separate molecules, and the covalent bonds inside each one are strong, but what holds one molecule to the next is a far weaker pull. Melting it only has to beat that weaker pull, which is why 115 degrees was enough where the lattice needed 801. The molecules themselves come through both tests unchanged.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Block the Blade Will Not Cut',
    briefing: {
      speaker: SPEAKER,
      body: 'The tongs close on one atom near the middle of a block and lift.'
    },
    prompt: 'Take hold of one atom of Block A with the tongs, then tray the block by how much came out with it.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s3', 'BLOCK A', ARCH, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        hammer(0), leads(1), tongs(2)
      ],
      zones: { trays: [tray('one', 'Just that atom', 14), tray('group', 'A small group', 38), tray('whole', 'The whole block', 62)] },
      fixtures: [plate(2000)]
    }),
    hints: [
      'Lay the tongs on Block A and look at what is left in its picture.',
      'Compare what came out of Block A with the block you started with, and try the same on Block B.',
      'Tray Block A under the heading that matches how much came out of it.'
    ],
    check(state) {
      const t = state.table;
      const at = ['one', 'group', 'whole'].find(k => trayOf(t, k).some(p => p.id === 's3'));
      if (!at) return { ok: false, notYet: true, msg: 'Tray Block A under what came out with the atom.' };
      const lift = liftCells(declOf(t.pieces.s3), 'intact');
      const real = lift.whole ? 'whole' : lift.n === 1 ? 'one' : 'group';
      if (at === real) return { ok: true };
      return { ok: false, msg: 'That is not what came out of Block A. Lay the tongs on it and compare what is left in the picture with the block you began with.' };
    },
    reward: {
      log: 'Block A: the blade stopped, 1710 degrees, no current.',
      title: 'A Network of Covalent Bonds',
      body: 'Some covalent solids are not built of separate molecules at all: every atom is bonded on to its neighbours in one continuous network, so the whole block is effectively a single molecule. Breaking it or melting it means breaking covalent bonds themselves, which is why the hammer failed and it took 1710 degrees. Nothing in it carries a charge, so nothing conducts through it either.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Lift One Out',
    prompt: 'Lift an individual molecule out of one of the blocks with the tongs.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', ARCH, bench(2)),
        tongs(0)
      ]
    }),
    hints: [
      'Lay the tongs on a block and see what comes out with the atom they close on.',
      'Compare what comes out of each block with the block it came from.',
      'Lift from each block in turn, and keep the lift that leaves most of its block behind.'
    ],
    check(state) {
      const t = state.table;
      const lifts = liftsOf(t.pieces.tongs);
      if (!lifts.length) return { ok: false, notYet: true, msg: 'Lay the tongs on a block first.' };
      // A molecule is one of the separate groups a block is made of while it is whole; a half of a split block is not.
      const molecule = lifts.some(l => {
        const groups = groupsOf(declOf(t.pieces[l.slab]));
        return groups.length > 1 && groups.includes(l.n) && !l.whole;
      });
      if (molecule) return { ok: true };
      return { ok: false, msg: 'Everything in that block came out together, so nothing small can be lifted out of it. Try another block.' };
    },
    reward: {
      log: 'Only Block B holds separate molecules.',
      title: 'Not Everything Is Made of Molecules',
      body: 'Only a molecular solid is built from separate molecules you could actually pick one of. An ionic solid has none, because the grid simply repeats — so the formula written for it is just the smallest whole-number ratio of its ions, which is called a formula unit. A covalent network has none either, because the whole block is connected.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Four Sealed Blocks',
    prompt: 'Tray each sealed block by how its atoms are held together.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('x1', 'BLOCK A', sealed(SALT, 1074), bench(0, 24)),
        slabPiece('x2', 'BLOCK B', sealed(VENT, 80), bench(1, 24)),
        slabPiece('x3', 'BLOCK C', sealed(ARCH, 3550), bench(2, 24)),
        slabPiece('x4', 'BLOCK D', sealed(COPPER, 1085), bench(3, 24)),
        hammer(0), leads(1)
      ],
      zones: {
        trays: [
          { id: 'grid', label: 'Ionic lattice', at: { x: 111, y: 16 }, size: { w: 24, h: 22 }, cell: 22 },
          { id: 'clusters', label: 'Molecules', at: { x: 137, y: 16 }, size: { w: 24, h: 22 }, cell: 22 },
          { id: 'web', label: 'Network', at: { x: 111, y: 52 }, size: { w: 24, h: 22 }, cell: 22 },
          { id: 'metallic', label: 'Metallic', at: { x: 137, y: 52 }, size: { w: 24, h: 22 }, cell: 22 }
        ]
      },
      fixtures: [plate(3600)]
    }),
    hints: [
      'Nothing resolves inside a cased block, so heat each one, clip the leads on it, and hit it.',
      'A molecular solid melts low and crumbles, a lattice melts high and lights the lamp only when molten, a metal lights it cold and molten, and a network resists heat and never lights it.',
      'For each block note its heat, its blow and its lamp, then tray it under the build that behaves that way.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['x1', 'x2', 'x3', 'x4'];
      const builds = ['grid', 'clusters', 'web', 'metallic'];
      const where = Object.fromEntries(ids.map(id => [id, builds.find(k => trayOf(t, k).some(p => p.id === id))]));
      if (ids.some(id => !where[id])) return { ok: false, notYet: true, msg: UNTRAYED };
      const wrong = ids.filter(id => where[id] !== declOf(t.pieces[id]).build);
      if (wrong.length) {
        const name = t.pieces[wrong[0]].label.charAt(0) + t.pieces[wrong[0]].label.slice(1).toLowerCase();
        return { ok: false, msg: `${name} is filed wrong. Heat it, test it molten and strike it, and compare what it does with how each build behaved earlier.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'One lattice, one molecular, one network, one metal.',
      title: 'The Tests Name the Build',
      body: 'A block that melts low and crumbles into whole molecules is molecular; one that melts high, cleaves flat and conducts once molten is an ionic lattice; one that melts high, never cleaves and conducts cold is a metallic solid; one that resists heat and never conducts is a covalent network. How a material behaves is a direct report of how its atoms are held together.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Pick the Liner',
    prompt: 'Put the block that holds at 900 degrees and passes no current in the marked slot.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: [
        slabPiece('s1', 'BLOCK A', SALT, bench(0)),
        slabPiece('s2', 'BLOCK B', VENT, bench(1)),
        slabPiece('s3', 'BLOCK C', ARCH, bench(2)),
        leads(0)
      ],
      zones: { slots: [{ id: 'liner', label: 'Vessel liner', at: { x: 122, y: 30 }, size: { w: 26, h: 20 } }] },
      fixtures: [plate(2000)]
    }),
    hints: [
      'Slide each block onto the hotplate and turn the dial to 900.',
      'Look at which blocks are still solid at 900, and clip the leads on those, cold and hot.',
      'Keep only the block that stays solid at 900 and never lights the lamp, and put it in the slot.'
    ],
    check(state) {
      const t = state.table;
      const held = Object.values(t.pieces).find(p => p.kind === 'slab' && p.zone === 'slot:liner');
      if (!held) return { ok: false, notYet: true, msg: 'Put a block in the slot.' };
      const d = declOf(held);
      if (d.melt <= 900) return { ok: false, msg: 'That block gives way at or below 900 degrees on the hotplate, so it cannot line a vessel that runs that hot.' };
      if (conductionOf(d, false) || conductionOf(d, true)) return { ok: false, msg: 'That block stays solid at 900 degrees, but the leads\' lamp lights on it, so it would pass a current.' };
      return { ok: true };
    },
    reward: {
      log: 'Block C: 1710 degrees, no current, holds.',
      title: 'Why the Arches Are Still Standing',
      body: 'The only block that clears 900 degrees and still passes nothing is the covalent network, because coming apart at all means breaking its bonds one by one. The arches outside are built the same way, which is why a thousand years of weather has not brought one of them down. What a material is good for is decided by what kind of bond is holding it.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Three blocks, three builds. Ions in a repeating grid are hard, brittle and pass a current only once they are melted; separate molecules melt easily and never conduct; a network bonded all the way through barely melts at all.'
    },
    {
      heading: 'Why It Works',
      body: 'Nothing you measured was a property of an atom. Every one of them was a property of how atoms are held together, which is why knowing the bond type tells you what a material will do before you have tested anything.'
    },
    {
      heading: 'Next',
      body: 'Every block on this bench had one recipe and stuck to it. The next bench asks how fixed that really is, and whether the same compound from two different places comes out the same.'
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

const onPlate = (id, i) => ({ place: { piece: id, to: `free:${[20, 49, 78][i]},${PLATE_Y}` } });
const into = (piece, trayId) => ({ place: { piece, to: `tray:${trayId}` } });
const clip = (block) => ({ join: ['leads', block] });
const blow = (block) => ({ join: ['hammer', block] });
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
  [
    { fetch: 'chip' },
    onPlate('s1', 0), onPlate('s2', 1), onPlate('s3', 2), heat(125), heat(825), heat(1725),
    { place: { piece: 's2', to: 'rail:0' } }, { place: { piece: 's1', to: 'rail:1' } }, { place: { piece: 's3', to: 'rail:2' } }
  ],
  [blow('s1'), blow('s2'), ...CHECKER, { run: 'grid' }],
  [
    clip('s1'), onPlate('s1', 0), heat(825), into('s1', 'molten'),
    clip('s2'), onPlate('s2', 1), into('s2', 'never'),
    heat(0), clip('s3'), onPlate('s3', 2), heat(1100), into('s3', 'both')
  ],
  [blow('s2'), onPlate('s2', 0), heat(125), { setDial: { fixture: 'tally', dial: 'atoms', value: 3 } }],
  [{ join: ['tongs', 's3'] }, into('s3', 'whole')],
  [{ join: ['tongs', 's2'] }],
  [
    blow('x1'), blow('x2'), blow('x3'), blow('x4'),
    clip('x1'), onPlate('x1', 0), heat(1100), into('x1', 'grid'),
    clip('x2'), onPlate('x2', 1), heat(100), into('x2', 'clusters'),
    clip('x3'), onPlate('x3', 2), heat(1100), into('x3', 'web'),
    heat(0), clip('x4'), onPlate('x4', 0), into('x4', 'metallic')
  ],
  [onPlate('s1', 0), onPlate('s2', 1), onPlate('s3', 2), heat(900), clip('s3'), { place: { piece: 's3', to: 'slot:liner' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [{ place: { piece: 's3', to: 'rail:0' } }],
  [{ place: { piece: 'na1', to: grid(0, 0) } }, { place: { piece: 'na2', to: grid(0, 1) } }],
  [into('s1', 'both'), into('s2', 'never'), into('s3', 'both')],
  [blow('s2'), { setDial: { fixture: 'tally', dial: 'atoms', value: 1 } }],
  [{ join: ['tongs', 's3'] }, into('s3', 'group')],
  [{ join: ['tongs', 's1'] }],
  [into('x1', 'web'), into('x2', 'clusters'), into('x3', 'grid'), into('x4', 'metallic')],
  [{ place: { piece: 's1', to: 'slot:liner' } }]
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
